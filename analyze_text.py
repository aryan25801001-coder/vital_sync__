"""
routers/analyze_text.py
========================
Emergency Text Analysis — urgency classification
Input:  emergency message text
Output: "high" | "medium" | "low" urgency level

Primary approach: Hugging Face Inference API (zero-shot classification)
Fallback:         Keyword-based rule engine
"""

import os
import logging
import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

logger = logging.getLogger("vitalsync.analyze_text")
router = APIRouter()

# ── Hugging Face config ───────────────────────────────────────────────────────
# Set HUGGINGFACE_API_KEY in your .env file.
# Free plan is sufficient for this use-case (rate-limited).
HF_API_KEY   = os.getenv("HUGGINGFACE_API_KEY", "")
HF_MODEL     = "facebook/bart-large-mnli"        # zero-shot classification model
HF_API_URL   = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
CANDIDATE_LABELS = ["high urgency emergency", "medium urgency situation", "low urgency inquiry"]


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK: Keyword-based urgency detection
# ─────────────────────────────────────────────────────────────────────────────
HIGH_KEYWORDS   = ["cardiac arrest", "not breathing", "unconscious", "choking", "severe bleeding",
                   "stroke", "chest pain", "critical", "dying", "heart attack", "unresponsive",
                   "seizure", "code blue", "trauma", "fatal", "crush injury", "anaphylaxis"]

MEDIUM_KEYWORDS = ["injured", "bleeding", "accident", "broken bone", "fracture", "moderate",
                   "pain", "fever", "difficulty breathing", "dizzy", "vomiting", "sprain",
                   "burn", "allergic", "concussion"]

def _keyword_urgency(text: str) -> str:
    """Rule-based fallback when Hugging Face API is unavailable."""
    text_lower = text.lower()
    if any(kw in text_lower for kw in HIGH_KEYWORDS):
        return "high"
    if any(kw in text_lower for kw in MEDIUM_KEYWORDS):
        return "medium"
    return "low"


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class TextInput(BaseModel):
    message: str = Field(..., min_length=3, max_length=2000,
                         description="Emergency message text to analyze")

class TextOutput(BaseModel):
    urgency: str          # "high" | "medium" | "low"
    confidence: float     # 0.0 – 1.0
    source: str           # "huggingface" | "keyword_fallback"
    model: str            # model name or "rule_engine"


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=TextOutput)
async def analyze_emergency_text(data: TextInput):
    """
    Analyzes an emergency text message and returns urgency level.

    Example request body:
    {
        "message": "Patient is unconscious and not breathing after a car accident"
    }
    """
    logger.info(f"Text analysis request (len={len(data.message)}): {data.message[:80]}…")

    # ── Try Hugging Face API first ────────────────────────────────────────────
    if HF_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            payload = {
                "inputs": data.message,
                "parameters": {"candidate_labels": CANDIDATE_LABELS},
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(HF_API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            result = resp.json()

            # HF returns labels sorted by score descending
            top_label: str = result["labels"][0]
            top_score: float = result["scores"][0]

            # Map the multi-word label back to simple urgency level
            if "high" in top_label:
                urgency = "high"
            elif "medium" in top_label:
                urgency = "medium"
            else:
                urgency = "low"

            logger.info(f"HF result: urgency={urgency} confidence={top_score:.3f}")
            return TextOutput(urgency=urgency, confidence=round(top_score, 3),
                              source="huggingface", model=HF_MODEL)

        except Exception as e:
            logger.warning(f"Hugging Face API failed, falling back to keyword engine. Error: {e}")

    # ── Fallback: keyword rule engine ─────────────────────────────────────────
    urgency = _keyword_urgency(data.message)
    logger.info(f"Keyword fallback result: {urgency}")
    return TextOutput(urgency=urgency, confidence=1.0,
                      source="keyword_fallback", model="rule_engine")
