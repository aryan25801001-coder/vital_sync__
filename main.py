"""
VitalSync ML Microservice - main.py
====================================
FastAPI-based Python microservice that exposes 4 ML endpoints:
  POST /recommend      - Hospital recommendation score
  POST /classify       - Patient priority classification
  POST /predict-load   - Hospital load prediction (%)
  POST /analyze-text   - Emergency text urgency analysis (Hugging Face)

Run this service with:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Import our individual ML routers ─────────────────────────────────────────
from routers import recommend, classify, predict_load, analyze_text

# ── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("vitalsync.main")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="VitalSync ML Microservice",
    description="Machine Learning endpoints for the VitalSync healthcare emergency system",
    version="1.0.0",
)

# Allow requests from the Next.js dev server (localhost:3000) and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://vitalsync01.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(recommend.router,     prefix="/recommend",     tags=["Hospital Recommendation"])
app.include_router(classify.router,      prefix="/classify",      tags=["Patient Priority"])
app.include_router(predict_load.router,  prefix="/predict-load",  tags=["Hospital Load"])
app.include_router(analyze_text.router,  prefix="/analyze-text",  tags=["Text Analysis"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Simple liveness probe so Node.js can verify the ML service is up."""
    logger.info("Health check called")
    return {"status": "ok", "service": "VitalSync ML Microservice", "version": "1.0.0"}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to VitalSync ML Microservice",
        "docs": "/docs",
        "endpoints": ["/recommend", "/classify", "/predict-load", "/analyze-text", "/health"],
    }
