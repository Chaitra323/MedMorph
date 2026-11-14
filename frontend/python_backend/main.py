
import io
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from classifier import load_saved_model, classify_dataset


# Create FastAPI application
app = FastAPI(
    title="MedMorph API",
    description="Medical Dataset Classification API",
    version="1.0"
)


# Allow communication with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load the trained ML model once when the server starts
try:
    model = load_saved_model()
    print("MedMorph ML model loaded successfully!")
except Exception as error:
    model = None
    print("Model loading failed:", error)


# Test API endpoint
@app.get("/")
def home():
    return {
        "message": "MedMorph API is running!",
        "model_loaded": model is not None
    }


# Dataset classification endpoint
@app.post("/classify")
async def classify_file(file: UploadFile = File(...)):

    if model is None:
        raise HTTPException(
            status_code=500,
            detail="ML model is not loaded. Check the saved model file."
        )

    # Check file format
    extension = Path(file.filename or "").suffix.lower()

    if extension not in [".csv", ".xlsx"]:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX files are supported."
        )

    # Read uploaded file into memory
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    # Read dataset
    try:
        if extension == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded dataset. Check the file format."
        )

    if df.empty or len(df.columns) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded dataset has no usable data."
        )

    # Classify columns using the trained ML model
    try:
        results = classify_dataset(model, df)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(error)}"
        )

    # Return classification results
    return {
        "filename": file.filename,
        "total_records": len(df),
        "total_columns": len(df.columns),
        "results": results
    }
