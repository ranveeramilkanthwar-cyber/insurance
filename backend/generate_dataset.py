"""
Generate a synthetic insurance dataset for training the risk scoring model.
This creates a realistic CSV with 5000 rows.
"""

import pandas as pd
import numpy as np

np.random.seed(42)
N = 5000

# ── Core demographics ────────────────────────────────────────────────────────
age = np.random.randint(18, 75, N)
gender = np.random.choice(["male", "female"], N)
bmi = np.round(np.random.normal(27.5, 6, N).clip(15, 50), 1)
num_dependents = np.random.choice([0, 1, 2, 3, 4, 5], N, p=[0.25, 0.25, 0.25, 0.15, 0.07, 0.03])

# ── Location ─────────────────────────────────────────────────────────────────
region = np.random.choice(["northeast", "northwest", "southeast", "southwest"], N)

# ── Health / lifestyle ────────────────────────────────────────────────────────
smoker = np.random.choice(["yes", "no"], N, p=[0.20, 0.80])
medical_history = np.random.choice(
    ["none", "diabetes", "heart_disease", "hypertension", "obesity", "asthma"],
    N, p=[0.45, 0.18, 0.10, 0.15, 0.07, 0.05]
)

# ── Financial / policy ────────────────────────────────────────────────────────
annual_income = np.round(np.random.lognormal(10.8, 0.6, N)).clip(20000, 500000)
policy_type = np.random.choice(["basic", "standard", "premium"], N, p=[0.35, 0.45, 0.20])
coverage_amount = np.where(
    policy_type == "basic",   np.random.randint(50000,  200000, N),
    np.where(
    policy_type == "standard", np.random.randint(200000, 500000, N),
                               np.random.randint(500000, 2000000, N)
    )
)

# ── Risk score computation (deterministic formula + noise) ────────────────────
risk = np.zeros(N)

# Age factor: older = higher risk
risk += (age - 18) / (75 - 18) * 20          # 0–20 pts

# BMI factor
bmi_risk = np.where(bmi < 18.5, 8,
           np.where(bmi < 25,   0,
           np.where(bmi < 30,   6,
           np.where(bmi < 35,  12, 18))))
risk += bmi_risk                              # 0–18 pts

# Smoking factor
risk += np.where(smoker == "yes", 25, 0)     # 0 or 25 pts

# Medical history factor
med_risk_map = {"none": 0, "asthma": 4, "hypertension": 8,
                "diabetes": 14, "obesity": 10, "heart_disease": 20}
risk += np.array([med_risk_map[m] for m in medical_history])  # 0–20 pts

# Dependents factor
risk += num_dependents * 1.5                  # 0–7.5 pts

# Income factor: lower income = slightly higher risk
risk += (1 - (annual_income - 20000) / (500000 - 20000)) * 5  # 0–5 pts

# Region factor
region_risk_map = {"northeast": 2, "northwest": 1, "southeast": 3, "southwest": 1}
risk += np.array([region_risk_map[r] for r in region])        # 1–3 pts

# Gender small factor
risk += np.where(gender == "male", 1, 0)

# Add noise
risk += np.random.normal(0, 3, N)

# Clip to 0–100
risk = np.clip(risk, 0, 100).round(1)

# ── Assemble DataFrame ─────────────────────────────────────────────────────────
df = pd.DataFrame({
    "age": age,
    "gender": gender,
    "bmi": bmi,
    "num_dependents": num_dependents,
    "region": region,
    "smoker": smoker,
    "medical_history": medical_history,
    "annual_income": annual_income.astype(int),
    "policy_type": policy_type,
    "coverage_amount": coverage_amount,
    "risk_score": risk,
})

output_path = "data/insurance_data.csv"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
df.to_csv(output_path, index=False)

print(f"✅ Dataset generated: {output_path}")
print(f"   Rows: {len(df)}")
print(f"   Risk score stats:\n{df['risk_score'].describe().round(2)}")
print(f"\n   First 3 rows:\n{df.head(3)}")
