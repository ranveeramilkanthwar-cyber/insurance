"""
Insurance Risk Score — GPU-Accelerated ML Training Script
==========================================================
Primary:  XGBoost with CUDA GPU acceleration
Fallback: XGBoost CPU (if no CUDA GPU detected)
Also saves feature importance for the FastAPI server.
"""

import os, sys, time, joblib, warnings
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

warnings.filterwarnings("ignore")

# ── 1. GPU Detection ───────────────────────────────────────────────────────────
def detect_gpu():
    """Check if CUDA GPU is available."""
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            gpu_info = result.stdout.strip().split("\n")[0]
            print(f"🖥️   GPU detected: {gpu_info}")
            return True
    except Exception:
        pass
    try:
        import cupy
        print(f"🖥️   CuPy detected — CUDA available")
        return True
    except ImportError:
        pass
    print("💻  No GPU detected — using CPU (still fast!)")
    return False

HAS_GPU = detect_gpu()

# ── 2. Load data ───────────────────────────────────────────────────────────────
DATA_PATH = "data/insurance_data.csv"
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Dataset not found at '{DATA_PATH}'.\n"
        "Run first: python generate_dataset.py\n"
        "Or place your own CSV file there."
    )

df = pd.read_csv(DATA_PATH)
print(f"\n📦  Loaded {len(df):,} rows | Columns: {list(df.columns)}")

# ── 3. Feature / target split ──────────────────────────────────────────────────
FEATURE_COLS = [
    "age", "gender", "bmi", "num_dependents", "region",
    "smoker", "medical_history", "annual_income",
    "policy_type", "coverage_amount"
]
TARGET_COL = "risk_score"

X = df[FEATURE_COLS].copy()
y = df[TARGET_COL].copy()

NUMERIC_FEATURES     = ["age", "bmi", "num_dependents", "annual_income", "coverage_amount"]
CATEGORICAL_FEATURES = ["gender", "region", "smoker", "medical_history", "policy_type"]

# ── 4. Preprocessing pipeline ──────────────────────────────────────────────────
preprocessor = ColumnTransformer(transformers=[
    ("num", StandardScaler(), NUMERIC_FEATURES),
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), CATEGORICAL_FEATURES),
])

# ── 5. Build XGBoost model (GPU or CPU) ────────────────────────────────────────
try:
    import xgboost as xgb
    print(f"\n⚡  XGBoost {xgb.__version__} found.")

    if HAS_GPU:
        print("🚀  Training with GPU acceleration (CUDA)...")
        xgb_params = dict(
            n_estimators=500,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=3,
            reg_alpha=0.1,
            reg_lambda=1.0,
            tree_method="hist",
            device="cuda",           # <── GPU flag
            random_state=42,
            n_jobs=-1,
        )
        BACKEND = "XGBoost (GPU/CUDA)"
    else:
        print("⚡  Training with XGBoost (CPU, hist method)...")
        xgb_params = dict(
            n_estimators=500,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=3,
            reg_alpha=0.1,
            reg_lambda=1.0,
            tree_method="hist",      # Fast histogram-based (CPU)
            random_state=42,
            n_jobs=-1,
        )
        BACKEND = "XGBoost (CPU)"

    from xgboost import XGBRegressor
    model = XGBRegressor(**xgb_params)

except ImportError:
    print("\n⚠️  XGBoost not found, falling back to RandomForest (CPU)...")
    from sklearn.ensemble import RandomForestRegressor
    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )
    BACKEND = "RandomForest (CPU scikit-learn)"

print(f"    Backend: {BACKEND}")

# ── 6. Full pipeline ───────────────────────────────────────────────────────────
model_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("regressor",    model),
])

# ── 7. Train / test split ──────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)
print(f"\n🔀  Train: {len(X_train):,} | Test: {len(X_test):,}")

# ── 8. Train ───────────────────────────────────────────────────────────────────
t0 = time.time()
model_pipeline.fit(X_train, y_train)
elapsed = time.time() - t0
print(f"\n✅  Training completed in {elapsed:.1f}s")

# ── 9. Evaluate ────────────────────────────────────────────────────────────────
y_pred = model_pipeline.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae  = mean_absolute_error(y_test, y_pred)
r2   = r2_score(y_test, y_pred)

print("\n📊  Evaluation Metrics (Test Set):")
print(f"    RMSE          : {rmse:.2f}")
print(f"    MAE           : {mae:.2f}")
print(f"    R² Score      : {r2:.4f}  ({r2*100:.1f}% variance explained)")

# ── 10. Feature importance ─────────────────────────────────────────────────────
reg = model_pipeline.named_steps["regressor"]
feature_names = NUMERIC_FEATURES + CATEGORICAL_FEATURES

if hasattr(reg, "feature_importances_"):
    importances = pd.Series(reg.feature_importances_, index=feature_names)
    importances = importances.sort_values(ascending=False)
    print("\n🔑  Feature Importances:")
    for feat, imp in importances.items():
        bar = "█" * int(imp * 60)
        print(f"    {feat:<22} {bar} {imp:.4f}")
else:
    importances = pd.Series({f: 1/len(feature_names) for f in feature_names})

# ── 11. Save artifacts ─────────────────────────────────────────────────────────
joblib.dump(model_pipeline, "model.pkl")
joblib.dump({
    "feature_cols":        FEATURE_COLS,
    "numeric_features":    NUMERIC_FEATURES,
    "categorical_features":CATEGORICAL_FEATURES,
    "feature_importances": importances.to_dict(),
    "backend":             BACKEND,
    "r2_score":            round(r2, 4),
    "rmse":                round(rmse, 2),
    "mae":                 round(mae, 2),
    "training_rows":       len(X_train),
    "gpu_used":            HAS_GPU,
}, "model_metadata.pkl")

print(f"\n✅  Saved: model.pkl, model_metadata.pkl")
print(f"\n🎉  Done! Backend used: {BACKEND}")
print("    Start the API: uvicorn main:app --reload --port 8000")
