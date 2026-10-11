
import json
import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "model.joblib")
scaler = joblib.load(BASE_DIR / "scaler.joblib")

with open(BASE_DIR / "model_metrics.json", encoding="utf-8") as file:
    MODEL_METRICS = json.load(file)

app = FastAPI(title="Sentinel Fraud Detection API")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origin.split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class Transaction(BaseModel):
    amount: float = 0
    time: str | float | int = "00:00"
    features: list[float] = []


def time_to_seconds(value):
    if isinstance(value, str) and ":" in value:
        parts = value.split(":")
        if len(parts) == 2:
            return float(int(parts[0]) * 3600 + int(parts[1]) * 60)
    return float(value or 0)


def predict_one(transaction):
    values = transaction.get("features") or []
    values = [float(v) for v in values[:28]]
    values += [0.0] * (28 - len(values))

    row = [
        time_to_seconds(transaction.get("time", "00:00")),
        *values,
        float(transaction.get("amount", 0)),
    ]

    scaled = scaler.transform(np.array(row).reshape(1, -1))
    probability = float(model.predict_proba(scaled)[0][1])

    return {
        "fraud": probability > 0.5,
        "prob": probability,
        "score": probability,
    }


@app.get("/")
def root():
    return {
        "service": "Sentinel Fraud Detection API",
        "status": "online",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/model-performance")
def model_performance():
    return MODEL_METRICS


@app.get("/api/transactions")
def transactions():
    # No persistent transaction database is configured yet.
    return {"transactions": []}


@app.post("/api/predict")
def predict(transaction: Transaction):
    try:
        return predict_one(transaction.model_dump())
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {error}",
        ) from error


@app.post("/api/predict-batch")
def predict_batch(transactions: list[Transaction]):
    if len(transactions) > 500:
        raise HTTPException(
            status_code=400,
            detail="Maximum batch size is 500 transactions.",
        )

    try:
        return [
            {
                "fraud": result["fraud"],
                "prob": result["prob"],
            }
            for result in (
                predict_one(transaction.model_dump())
                for transaction in transactions
            )
        ]
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {error}",
        ) from error
    