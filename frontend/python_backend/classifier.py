
import os
import re
import joblib
import pandas as pd

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, classification_report


# --------------------------------------------------
# 1. FILE PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAINING_FILE = os.path.join(
    BASE_DIR, "data", "training_data.csv"
)

MODEL_DIR = os.path.join(BASE_DIR, "models")

MODEL_FILE = os.path.join(
    MODEL_DIR, "medical_classifier.pkl"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# --------------------------------------------------
# 2. LOAD TRAINING DATA
# --------------------------------------------------

def load_training_data():

    data = pd.read_csv(TRAINING_FILE)

    required = [
        "column_name",
        "sample_values",
        "category"
    ]

    if not all(column in data.columns for column in required):
        raise ValueError("Training CSV has missing columns.")

    return data.dropna(subset=required)


# --------------------------------------------------
# 3. FEATURE EXTRACTION
# --------------------------------------------------

def extract_features(column_name, sample_values):

    name = str(column_name).replace("_", " ").lower()

    values = [
        value.strip()
        for value in str(sample_values).split(";")
        if value.strip()
    ]

    if not values:
        values = ["unknown"]

    total = len(values)
    unique_ratio = len(set(values)) / total

    email_count = sum(
        bool(re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", v))
        for v in values
    )

    phone_count = sum(
        bool(re.fullmatch(r"\+?\d[\d\s-]{7,14}", v))
        for v in values
    )

    date_count = sum(
        bool(re.search(r"\d{4}-\d{2}-\d{2}", v))
        for v in values
    )

    numeric_count = sum(
        bool(re.fullmatch(r"\d+(\.\d+)?", v))
        for v in values
    )

    clinical_words = [
        "diagnosis", "disease", "blood", "medication",
        "prescription", "medical", "allergy",
        "treatment", "history", "symptom", "condition"
    ]

    identifier_words = [
        "name", "email", "phone", "mobile",
        "address", "contact"
    ]

    linking_words = [
        "id", "identifier", "number", "record",
        "registration", "case"
    ]

    quasi_words = [
        "age", "birth", "dob", "city",
        "gender", "postal", "occupation"
    ]

    features = [
        name,
        "sample_values " + " ".join(values[:10]),
        "feature_unique_ratio_" + (
            "high" if unique_ratio > 0.8
            else "medium" if unique_ratio > 0.4
            else "low"
        ),
        "feature_email_" + ("yes" if email_count else "no"),
        "feature_phone_" + ("yes" if phone_count else "no"),
        "feature_date_" + ("yes" if date_count else "no"),
        "feature_numeric_" + ("yes" if numeric_count else "no"),
        "feature_clinical_" + (
            "yes" if any(word in name for word in clinical_words)
            else "no"
        ),
        "feature_identifier_" + (
            "yes" if any(word in name for word in identifier_words)
            else "no"
        ),
        "feature_linking_" + (
            "yes" if any(word in name for word in linking_words)
            else "no"
        ),
        "feature_quasi_" + (
            "yes" if any(word in name for word in quasi_words)
            else "no"
        )
    ]

    return " ".join(features)


# --------------------------------------------------
# 4. PREPARE FEATURES
# --------------------------------------------------

def prepare_features(data):

    return [
        extract_features(row["column_name"], row["sample_values"])
        for _, row in data.iterrows()
    ]


# --------------------------------------------------
# 5. CREATE MODEL
# --------------------------------------------------

def create_model():

    text_features = FeatureUnion([
        (
            "word_features",
            TfidfVectorizer(
                analyzer="word",
                ngram_range=(1, 2),
                sublinear_tf=True
            )
        ),
        (
            "character_features",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(2, 5),
                sublinear_tf=True
            )
        )
    ])

    return Pipeline([
        ("features", text_features),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                C=1.0
            )
        )
    ])


# --------------------------------------------------
# 6. EVALUATE MODEL
# --------------------------------------------------

def evaluate_model(data):

    X = prepare_features(data)
    y = data["category"]

    if y.value_counts().min() < 4:
        print("Not enough examples for evaluation.")
        return

    cv = StratifiedKFold(
        n_splits=4,
        shuffle=True,
        random_state=42
    )

    predictions = cross_val_predict(
        create_model(),
        X,
        y,
        cv=cv
    )

    print("\n========== MODEL EVALUATION ==========")

    print(
        f"\nCross-validation accuracy: "
        f"{accuracy_score(y, predictions) * 100:.2f}%"
    )

    print("\nClassification Report:\n")

    print(
        classification_report(
            y,
            predictions,
            zero_division=0
        )
    )


# --------------------------------------------------
# 7. TRAIN AND SAVE MODEL
# --------------------------------------------------

def train_and_save_model():

    data = load_training_data()

    X = prepare_features(data)
    y = data["category"]

    model = create_model()

    model.fit(X, y)

    joblib.dump(model, MODEL_FILE)

    print("\nModel training completed!")
    print("Training examples:", len(data))
    print("Categories:", sorted(y.unique()))

    print("\nModel saved successfully!")
    print("Saved at:", MODEL_FILE)

    return model


# --------------------------------------------------
# 8. LOAD SAVED MODEL
# --------------------------------------------------

def load_saved_model():

    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(
            "Saved model not found. Train the model first."
        )

    model = joblib.load(MODEL_FILE)

    print("Saved model loaded successfully!")

    return model


# --------------------------------------------------
# 9. CLASSIFY COLUMN
# --------------------------------------------------

def classify_column(model, column_name, sample_values):

    features = extract_features(
        column_name,
        ";".join(map(str, sample_values[:10]))
    )

    probabilities = model.predict_proba([features])[0]

    best_index = probabilities.argmax()

    return {
        "column_name": column_name,
        "category": model.classes_[best_index],
        "confidence": round(
            float(probabilities[best_index] * 100), 2
        )
    }


# --------------------------------------------------
# 10. CLASSIFY DATASET
# --------------------------------------------------

def classify_dataset(model, dataframe):

    results = []

    for column in dataframe.columns:

        values = (
            dataframe[column]
            .dropna()
            .astype(str)
            .tolist()
        )

        results.append(
            classify_column(model, column, values)
        )

    return results


# --------------------------------------------------
# 11. MAIN PROGRAM
# --------------------------------------------------

if __name__ == "__main__":

    training_data = load_training_data()

    evaluate_model(training_data)

    # Train and save the model
    train_and_save_model()

    # Load the saved model
    model = load_saved_model()

    # Test on actual medical dataset
    TEST_FILE = os.path.join(
        BASE_DIR, "data", "medical_test.csv"
    )

    if not os.path.exists(TEST_FILE):
        raise FileNotFoundError(
            "medical_test.csv not found."
        )

    medical_data = pd.read_csv(TEST_FILE)

    print("\n========== MEDICAL DATASET ==========")

    print("Records:", len(medical_data))
    print("Columns:", len(medical_data.columns))

    results = classify_dataset(model, medical_data)

    print("\n========== CLASSIFICATION RESULTS ==========\n")

    for result in results:
        print(result)

    output_file = os.path.join(
        BASE_DIR, "data", "classification_results.csv"
    )

    pd.DataFrame(results).to_csv(
        output_file,
        index=False
    )

    print("\nClassification results saved!")
