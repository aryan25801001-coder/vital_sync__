"""
routers/classify.py
====================
Patient Priority Classification
Input:  heart_rate (bpm), oxygen_level (%), injury_severity (1-10)
Output: "Critical" | "Moderate" | "Normal"

Model: Logistic Regression trained on synthetic data.
"""

import logging
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os

logger = logging.getLogger("vitalsync.classify")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# 1.  TRAINING DATA
#     Classes: 0=Normal, 1=Moderate, 2=Critical
# ─────────────────────────────────────────────────────────────────────────────
LABELS = ["Normal", "Moderate", "Critical"]

def _build_training_data():
    np.random.seed(7)
    n = 600

    # Normal patients: stable vitals
    hr_normal  = np.random.uniform(60, 100, n // 3)
    ox_normal  = np.random.uniform(95, 100, n // 3)
    inj_normal = np.random.uniform(1, 3,   n // 3)
    y_normal   = np.zeros(n // 3)           # class 0

    # Moderate patients: slightly abnormal vitals
    hr_mod  = np.random.uniform(100, 130, n // 3)
    ox_mod  = np.random.uniform(88, 95,  n // 3)
    inj_mod = np.random.uniform(4, 6,    n // 3)
    y_mod   = np.ones(n // 3)               # class 1

    # Critical patients: dangerous vitals
    hr_crit  = np.random.uniform(130, 200, n // 3)
    ox_crit  = np.random.uniform(70, 88,  n // 3)
    inj_crit = np.random.uniform(7, 10,   n // 3)
    y_crit   = np.full(n // 3, 2)           # class 2

    X = np.column_stack([
        np.concatenate([hr_normal, hr_mod, hr_crit]),
        np.concatenate([ox_normal, ox_mod, ox_crit]),
        np.concatenate([inj_normal, inj_mod, inj_crit]),
    ])
    y = np.concatenate([y_normal, y_mod, y_crit]).astype(int)
    return X, y


# ─────────────────────────────────────────────────────────────────────────────
# 2.  MODEL
# ─────────────────────────────────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "..", "models", "classify_lr.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classify_scaler.pkl")

def _train_or_load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        logger.info("Loading cached classify model …")
        return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)
    logger.info("Training classify model (first run) …")
    X, y   = _build_training_data()
    scaler = StandardScaler()
    X_s    = scaler.fit_transform(X)
    model  = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_s, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("Classify model trained and saved.")
    return model, scaler

_lr_model, _scaler = _train_or_load()


# ─────────────────────────────────────────────────────────────────────────────
# 3.  FALLBACK LOGIC
# ─────────────────────────────────────────────────────────────────────────────
def _fallback_classify(hr: float, ox: float, inj: float) -> str:
    if hr > 130 or ox < 88 or inj >= 7:
        return "Critical"
    if hr > 100 or ox < 95 or inj >= 4:
        return "Moderate"
    return "Normal"


# ─────────────────────────────────────────────────────────────────────────────
# 4.  SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class ClassifyInput(BaseModel):
    heart_rate:      float = Field(..., ge=20,  le=300, description="Heart rate in BPM")
    oxygen_level:    float = Field(..., ge=50,  le=100, description="Blood oxygen level (%)")
    injury_severity: float = Field(..., ge=1,   le=10,  description="Injury severity score (1-10)")

class ClassifyOutput(BaseModel):
    priority: str    # "Critical" | "Moderate" | "Normal"
    confidence: float  # 0.0 - 1.0
    source: str


# ─────────────────────────────────────────────────────────────────────────────
# 5.  ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=ClassifyOutput)
def classify_patient(data: ClassifyInput):
    """
    Classifies a patient's priority level.

    Example request body:
    {
        "heart_rate": 145,
        "oxygen_level": 84,
        "injury_severity": 8
    }
    """
    logger.info(f"Classify request: {data.dict()}")
    try:
        X   = np.array([[data.heart_rate, data.oxygen_level, data.injury_severity]])
        X_s = _scaler.transform(X)
        pred_class  = int(_lr_model.predict(X_s)[0])
        proba       = float(_lr_model.predict_proba(X_s)[0][pred_class])
        priority    = LABELS[pred_class]
        source      = "ml_model"
        logger.info(f"ML classify: {priority} (confidence={proba:.2f})")
    except Exception as e:
        logger.warning(f"Classify model failed, using fallback. Error: {e}")
        priority = _fallback_classify(data.heart_rate, data.oxygen_level, data.injury_severity)
        proba    = 1.0
        source   = "fallback"

    return ClassifyOutput(priority=priority, confidence=round(proba, 3), source=source)
