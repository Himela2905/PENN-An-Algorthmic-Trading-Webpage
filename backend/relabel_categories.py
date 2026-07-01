"""
relabel_categories.py
-----------------------
One-time helper: adds a 'category' column to the already-generated
ml/training_data.csv by mapping each row's best_strategy to its
broader category (Trend Following / Mean Reversion / Breakout / Momentum).

This avoids re-running generate_training_data.py (which takes 10-15 min
and re-hits yfinance) — we already have the data, we're just relabeling it.

Run with:
    python relabel_categories.py
"""

import os
import pandas as pd
from recommender import get_category

DATA_FILE = os.path.join("ml", "training_data.csv")


def relabel():
    if not os.path.exists(DATA_FILE):
        print(f"Could not find {DATA_FILE}")
        return

    df = pd.read_csv(DATA_FILE)
    print(f"Loaded {len(df)} rows")

    df["category"] = df["best_strategy"].apply(get_category)

    df.to_csv(DATA_FILE, index=False)
    print(f"Added 'category' column. Saved back to {DATA_FILE}")

    print("\n--- Category distribution ---")
    print(df["category"].value_counts())


if __name__ == "__main__":
    relabel()