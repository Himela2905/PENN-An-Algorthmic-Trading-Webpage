"""
train_model.py
----------------
Trains a Random Forest classifier on ml/training_data.csv
and saves the trained model to ml/model.pkl

What it does:
  1. Loads the CSV built by generate_training_data.py
  2. Splits features (X) from the label (y = best_strategy)
  3. Trains a Random Forest classifier
  4. Evaluates accuracy on a held-out test split
  5. Saves the trained model + feature column order to ml/model.pkl

Run with:
    python train_model.py

Honest note (for viva/report):
  With ~195 rows and 18 distinct labels, some labels have very few
  examples (1-2 rows). The model will be most reliable on the common
  labels (Bollinger Bands, RSI, Stochastic, ATR Breakout) and less
  reliable on rare ones. This is expected and disclosed, not hidden.
"""

import os
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


DATA_FILE  = os.path.join("ml", "training_data.csv")
MODEL_FILE = os.path.join("ml", "model_category.pkl")

# These must exactly match the keys returned by calculate_features() in recommender.py
FEATURE_COLUMNS = [
    "volatility",
    "trend_strength",
    "avg_rsi",
    "vol_trend",
    "daily_range",
    "momentum_20d",
    "return_consistency",
    "historical_max_drawdown",
]

LABEL_COLUMN = "category"   # broad category instead of 20 specific strategies
                            # (see relabel_categories.py for how this is derived)


def train():
    if not os.path.exists(DATA_FILE):
        print(f"Could not find {DATA_FILE}. Run generate_training_data.py first.")
        return

    df = pd.read_csv(DATA_FILE)
    print(f"Loaded {len(df)} rows from {DATA_FILE}")

    # drop rows with missing feature values, just in case
    df = df.dropna(subset=FEATURE_COLUMNS + [LABEL_COLUMN])
    print(f"{len(df)} rows remain after dropping incomplete rows")

    X = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN]

    # ---- Check label distribution before splitting ----
    label_counts = y.value_counts()
    print("\nLabel counts:")
    print(label_counts)

    # labels with only 1 example can't be split into train+test safely,
    # stratify would fail — so we fall back to a plain random split
    # rather than a stratified one when any label is too rare.
    min_count = label_counts.min()
    use_stratify = min_count >= 2

    if use_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        print("\nNote: some labels have only 1 example — "
              "using a plain random split instead of stratified split.")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

    print(f"\nTraining on {len(X_train)} rows, testing on {len(X_test)} rows")

    # ---- Train the model ----
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,           # keeps the model simple, avoids overfitting on small data
        min_samples_leaf=2,    # avoids creating leaves for single rare examples
        random_state=42,
        class_weight="balanced"  # gives rare labels more relative weight during training
    )
    model.fit(X_train, y_train)

    # ---- Evaluate ----
    y_pred   = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\nTest accuracy: {accuracy * 100:.1f}%")
    print("\nDetailed report (per strategy):")
    print(classification_report(y_test, y_pred, zero_division=0))

    # ---- Feature importance — which features actually matter ----
    importances = pd.Series(model.feature_importances_, index=FEATURE_COLUMNS)
    importances = importances.sort_values(ascending=False)
    print("\nFeature importance (which numbers the model relies on most):")
    print(importances.round(3))

    # ---- Save model + feature order together ----
    os.makedirs("ml", exist_ok=True)
    joblib.dump({
        "model":            model,
        "feature_columns":  FEATURE_COLUMNS,
        "trained_on_rows":  len(df),
        "test_accuracy":    round(accuracy * 100, 1),
    }, MODEL_FILE)

    print(f"\nModel saved to {MODEL_FILE}")


if __name__ == "__main__":
    train()