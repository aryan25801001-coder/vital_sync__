"""
routers/predict_load.py
========================
Hospital Load Prediction
Input:  current_patients (int), available_beds (int), incoming_cases_per_hour (float)
Output: predicted_load_percent (0-100)

Model: Linear Regression trained on synthetic data.
"""

import logging
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os

logger = logging.getLogger("vitalsync.predict_load")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# 1.  TRAINING DATA
# ─────────────────────────────────────────────────────────────────────────────
def _build_training_data():
    """
    Features: [current_patients, available_beds, incoming_cases_per_hour]
    Target:   load percentage (%) — how loaded the hospital will be in the next hour
    """
    np.random.seed(21)
    n = 400

    current_patients = np.random.randint(0, 200, n).astype(float)
    available_beds   = np.random.randint(10, 300, n).astype(float)
    incoming         = np.random.uniform(0, 30, n)

    # Hospital load = (patients after 1hr) / total_beds × 100
    # total_beds ≈ current_patients + available_beds
    total_beds         = current_patients + available_beds
    patients_next_hour = current_patients + incoming
    load               = (patients_next_hour / (total_beds + 1)) * 100  # +1 to avoid /0
    load               = load.clip(0, 100) + np.random.normal(0, 2, n)  # add small noise
    load               = load.clip(0, 100)

    X = np.column_stack([current_patients, available_beds, incoming])
    return X, load


# ─────────────────────────────────────────────────────────────────────────────
# 2.  MODEL
# ─────────────────────────────────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "..", "models", "load_lr.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "load_scaler.pkl")

def _train_or_load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        logger.info("Loading cached load-prediction model …")
        return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)
    logger.info("Training load-prediction model (first run) …")
    X, y   = _build_training_data()
    scaler = StandardScaler()
    X_s    = scaler.fit_transform(X)
    model  = LinearRegression()
    model.fit(X_s, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("Load-prediction model trained and saved.")
    return model, scaler

_lin_model, _scaler = _train_or_load()


# ─────────────────────────────────────────────────────────────────────────────
# 3.  FALLBACK LOGIC
# ─────────────────────────────────────────────────────────────────────────────
def _fallback_load(current: float, beds: float, incoming: float) -> float:
    total  = current + beds + 1
    future = current + incoming
    return round(min(100.0, (future / total) * 100), 2)


# ─────────────────────────────────────────────────────────────────────────────
# 4.  SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class LoadInput(BaseModel):
    current_patients:         int   = Field(..., ge=0, description="Current number of patients in hospital")
    available_beds:           int   = Field(..., ge=0, description="Number of available (empty) beds")
    incoming_cases_per_hour:  float = Field(..., ge=0, description="Expected new cases in next hour")

class LoadOutput(BaseModel):
    predicted_load_percent: float   # 0 – 100
    load_status: str                # "Low" | "Moderate" | "High" | "Critical"
    source: str


# ─────────────────────────────────────────────────────────────────────────────
# 5.  ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=LoadOutput)
def predict_hospital_load(data: LoadInput):
    """
    Predicts hospital load percentage for the next hour.

    Example request body:
    {
        "current_patients": 80,
        "available_beds": 40,
        "incoming_cases_per_hour": 12
    }
    """
    logger.info(f"Predict-load request: {data.dict()}")
    try:
        X   = np.array([[data.current_patients, data.available_beds, data.incoming_cases_per_hour]])
        X_s = _scaler.transform(X)
        load  = float(_lin_model.predict(X_s)[0])
        load  = round(max(0.0, min(100.0, load)), 2)
        source = "ml_model"
        logger.info(f"Predicted load: {load}%")
    except Exception as e:
        logger.warning(f"Load model failed, using fallback. Error: {e}")
        load   = _fallback_load(data.current_patients, data.available_beds, data.incoming_cases_per_hour)
        source = "fallback"

    if load < 50:
        status = "Low"
    elif load < 70:
        status = "Moderate"
    elif load < 90:
        status = "High"
    else:
        status = "Critical"

    return LoadOutput(predicted_load_percent=load, load_status=status, source=source)
