"""
routers/recommend.py
=====================
Hospital Recommendation System
Input:  distance (km), hospital_capacity (0-100), patient_severity (1-10)
Output: recommendation score (higher = better match)

Model: Random Forest Regressor trained on synthetic data.
The model is trained once at startup and reused for every request.
"""

import logging
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

# ── scikit-learn imports ──────────────────────────────────────────────────────
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

logger = logging.getLogger("vitalsync.recommend")
router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# 1.  TRAINING DATA (synthetic / dummy data)
#     In production, replace with real hospital data from your MongoDB.
# ─────────────────────────────────────────────────────────────────────────────
def _build_training_data():
    """
    Returns (X, y) where:
      X columns: [distance_km, hospital_capacity, patient_severity]
      y        : recommendation score 0-100
    """
    np.random.seed(42)
    n = 500

    distance    = np.random.uniform(1, 50, n)       # km
    capacity    = np.random.uniform(10, 100, n)     # 0-100
    severity    = np.random.uniform(1, 10, n)       # 1-10

    # Business logic for score:
    #  - Lower distance      → higher score
    #  - Higher capacity     → higher score
    #  - Higher severity     → needs a high-capacity, nearby hospital
    score = (
        (1 - distance / 50) * 40       # distance contributes 40 pts
        + (capacity / 100) * 35        # capacity contributes 35 pts
        + (severity / 10) * 25         # severity urgency contributes 25 pts
        + np.random.normal(0, 3, n)    # small noise
    ).clip(0, 100)

    X = np.column_stack([distance, capacity, severity])
    return X, score


# ─────────────────────────────────────────────────────────────────────────────
# 2.  MODEL — train once at module load time
# ─────────────────────────────────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "..", "models", "recommend_rf.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "recommend_scaler.pkl")

def _train_or_load_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        logger.info("Loading cached recommend model from disk …")
        model  = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
    else:
        logger.info("Training recommend model (first run) …")
        X, y   = _build_training_data()
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model  = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_scaled, y)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model,  MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
        logger.info("Recommend model trained and saved.")
    return model, scaler

_rf_model, _scaler = _train_or_load_model()


# ─────────────────────────────────────────────────────────────────────────────
# 3.  FALLBACK LOGIC (used if model prediction fails)
# ─────────────────────────────────────────────────────────────────────────────
def _fallback_score(distance: float, capacity: float, severity: float) -> float:
    """Simple rule-based score when the ML model is unavailable."""
    score = (1 - distance / 50) * 40 + (capacity / 100) * 35 + (severity / 10) * 25
    return round(float(score), 2)


# ─────────────────────────────────────────────────────────────────────────────
# 4.  PYDANTIC SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class RecommendInput(BaseModel):
    distance: float        = Field(..., ge=0,   description="Distance from patient to hospital in km")
    hospital_capacity: float = Field(..., ge=0, le=100, description="Available capacity of hospital (0-100)")
    patient_severity: float  = Field(..., ge=1, le=10,  description="Patient severity score (1-10)")

class RecommendOutput(BaseModel):
    score: float           # 0-100, higher = better recommendation
    label: str             # "Highly Recommended" / "Recommended" / "Not Recommended"
    source: str            # "ml_model" or "fallback"


# ─────────────────────────────────────────────────────────────────────────────
# 5.  ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=RecommendOutput)
def recommend_hospital(data: RecommendInput):
    """
    Returns a recommendation score for a hospital given patient & hospital info.

    Example request body:
    {
        "distance": 5.2,
        "hospital_capacity": 75,
        "patient_severity": 8
    }
    """
    logger.info(f"Recommend request: {data.dict()}")
    try:
        X = np.array([[data.distance, data.hospital_capacity, data.patient_severity]])
        X_scaled = _scaler.transform(X)
        score = float(_rf_model.predict(X_scaled)[0])
        score = round(max(0.0, min(100.0, score)), 2)
        source = "ml_model"
        logger.info(f"ML model score: {score}")
    except Exception as e:
        logger.warning(f"ML model failed, using fallback. Error: {e}")
        score  = _fallback_score(data.distance, data.hospital_capacity, data.patient_severity)
        source = "fallback"

    if score >= 70:
        label = "Highly Recommended"
    elif score >= 45:
        label = "Recommended"
    else:
        label = "Not Recommended"

    return RecommendOutput(score=score, label=label, source=source)
