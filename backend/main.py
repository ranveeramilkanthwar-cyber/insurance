"""
Insurance Risk Score API
========================
FastAPI server that loads the trained model and serves predictions.

Start with: uvicorn main:app --reload --port 8000
"""

import os, joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import uvicorn

# ── Load model on startup ──────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH    = os.path.join(BASE_DIR, "model.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model_metadata.pkl")

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(
        "model.pkl not found. Run 'python train.py' first to train the model."
    )

model_pipeline = joblib.load(MODEL_PATH)
metadata       = joblib.load(METADATA_PATH)
FEATURE_COLS   = metadata["feature_cols"]
FEATURE_IMP    = metadata["feature_importances"]

print("[OK] Model loaded successfully.")

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Insurance Risk Score API",
    description="Predicts insurance risk score (0–100) for a customer profile.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ─────────────────────────────────────────────────
class PredictRequest(BaseModel):
    age: int = Field(..., ge=18, le=100, description="Age of the customer")
    gender: str = Field(..., description="Gender: male or female")
    bmi: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index")
    num_dependents: int = Field(..., ge=0, le=10, description="Number of dependents")
    region: str = Field(..., description="Region: northeast, northwest, southeast, southwest")
    smoker: str = Field(..., description="Smoker: yes or no")
    medical_history: str = Field(..., description="Medical history")
    annual_income: int = Field(..., ge=0, description="Annual income in INR/USD")
    policy_type: str = Field(..., description="Policy type: basic, standard, premium")
    coverage_amount: int = Field(..., ge=0, description="Coverage amount")

    @validator("gender")
    def validate_gender(cls, v):
        v = v.lower()
        if v not in ["male", "female"]:
            raise ValueError("gender must be 'male' or 'female'")
        return v

    @validator("smoker")
    def validate_smoker(cls, v):
        v = v.lower()
        if v not in ["yes", "no"]:
            raise ValueError("smoker must be 'yes' or 'no'")
        return v

    @validator("region")
    def validate_region(cls, v):
        v = v.lower()
        valid = ["northeast", "northwest", "southeast", "southwest"]
        if v not in valid:
            raise ValueError(f"region must be one of {valid}")
        return v

    @validator("medical_history")
    def validate_medical_history(cls, v):
        v = v.lower()
        valid = ["none", "diabetes", "heart_disease", "hypertension", "obesity", "asthma"]
        if v not in valid:
            raise ValueError(f"medical_history must be one of {valid}")
        return v

    @validator("policy_type")
    def validate_policy_type(cls, v):
        v = v.lower()
        if v not in ["basic", "standard", "premium"]:
            raise ValueError("policy_type must be 'basic', 'standard', or 'premium'")
        return v


class RiskFactor(BaseModel):
    factor: str
    importance: float
    description: str


class PredictResponse(BaseModel):
    risk_score: float
    risk_label: str
    risk_color: str
    risk_description: str
    top_factors: List[RiskFactor]
    recommendations: List[str]


# ── Helper: risk label ─────────────────────────────────────────────────────────
def get_risk_label(score: float):
    if score < 25:
        return "Low",       "#22c55e", "Your risk profile is excellent. You're a low-risk customer."
    elif score < 50:
        return "Moderate",  "#f59e0b", "Your risk profile is average. Some factors to monitor."
    elif score < 75:
        return "High",      "#f97316", "Your risk profile shows elevated risk. Review key factors."
    else:
        return "Critical",  "#ef4444", "Your risk profile indicates critical risk. Immediate action recommended."


def get_recommendations(req: PredictRequest, score: float) -> List[str]:
    recs = []
    if req.smoker == "yes":
        recs.append("🚭 Quitting smoking could significantly reduce your risk score by up to 25 points.")
    if req.bmi >= 30:
        recs.append("⚖️ Maintaining a healthy BMI (18.5–24.9) can reduce health-related risk.")
    if req.medical_history in ["diabetes", "heart_disease"]:
        recs.append("🏥 Regular medical check-ups and medication adherence can help manage your condition.")
    if req.medical_history == "hypertension":
        recs.append("💊 Managing blood pressure with lifestyle changes and medication reduces risk.")
    if req.age > 55:
        recs.append("👴 Consider a comprehensive health plan that covers age-related conditions.")
    if req.policy_type == "basic" and score > 50:
        recs.append("📋 Upgrading to a Standard or Premium policy offers better coverage for your risk level.")
    if not recs:
        recs.append("✅ Maintain your healthy lifestyle to keep your risk score low.")
        recs.append("📅 Annual health screenings are recommended for all policyholders.")
    return recs


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "model": "RandomForestRegressor", "version": "1.0.0"}


@app.post("/predict", response_model=PredictResponse)
@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        # Build input DataFrame matching training column order
        input_df = pd.DataFrame([{
            "age":             req.age,
            "gender":          req.gender,
            "bmi":             req.bmi,
            "num_dependents":  req.num_dependents,
            "region":          req.region,
            "smoker":          req.smoker,
            "medical_history": req.medical_history,
            "annual_income":   req.annual_income,
            "policy_type":     req.policy_type,
            "coverage_amount": req.coverage_amount,
        }])

        # Predict
        raw_score = float(model_pipeline.predict(input_df)[0])
        score = round(max(0, min(100, raw_score)), 1)

        # Labels & colors
        label, color, description = get_risk_label(score)

        # Top risk factors from feature importance
        top_factors = [
            RiskFactor(
                factor=f.replace("_", " ").title(),
                importance=round(imp * 100, 1),
                description=_factor_description(f, req)
            )
            for f, imp in sorted(FEATURE_IMP.items(), key=lambda x: -x[1])[:5]
        ]

        recommendations = get_recommendations(req, score)

        return PredictResponse(
            risk_score=score,
            risk_label=label,
            risk_color=color,
            risk_description=description,
            top_factors=top_factors,
            recommendations=recommendations,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _factor_description(feature: str, req: PredictRequest) -> str:
    mapping = {
        "smoker":          f"Smoker: {'Yes ⚠️' if req.smoker == 'yes' else 'No ✅'}",
        "medical_history": f"Medical history: {req.medical_history.replace('_', ' ').title()}",
        "bmi":             f"BMI: {req.bmi} ({'Normal' if 18.5 <= req.bmi < 25 else 'Overweight' if req.bmi < 30 else 'Obese' if req.bmi < 35 else 'Severely Obese'})",
        "age":             f"Age: {req.age} years",
        "annual_income":   f"Annual income: ₹{req.annual_income:,}",
        "coverage_amount": f"Coverage amount: ₹{req.coverage_amount:,}",
        "region":          f"Region: {req.region.title()}",
        "policy_type":     f"Policy: {req.policy_type.title()}",
        "num_dependents":  f"Dependents: {req.num_dependents}",
        "gender":          f"Gender: {req.gender.title()}",
    }
    return mapping.get(feature, feature.replace("_", " ").title())


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
