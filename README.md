# 🛡️ InsureAI — AI-Powered Insurance Risk Scoring Platform

<div align="center">

![InsureAI Banner](https://img.shields.io/badge/InsureAI-v1.0-06b6d4?style=for-the-badge&logo=shield&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-GPU-FF6600?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)

**A full-stack AI system that predicts insurance risk scores (0–100) using GPU-accelerated XGBoost, served via FastAPI, and visualized on a stunning Next.js 16 dark glassmorphism website.**

[🎯 Live Demo](#) • [📊 Presentation](./presentation/index.html) • [📖 API Docs](http://localhost:8000/docs)

</div>

---

## 📁 Project Structure

```
insurance-ai/
├── 📂 backend/                    # Python ML + API
│   ├── generate_dataset.py        # Synthetic dataset generator (5,000 rows)
│   ├── train.py                   # GPU-accelerated XGBoost training
│   ├── main.py                    # FastAPI REST API server
│   ├── requirements.txt           # Python dependencies
│   └── data/
│       └── insurance_data.csv     # Dataset (generated or your own)
│
├── 📂 frontend/                   # Next.js 16 website
│   ├── app/
│   │   ├── globals.css            # Dark glassmorphism design system
│   │   ├── layout.tsx             # Root layout + metadata
│   │   ├── page.tsx               # Landing page
│   │   └── predict/
│   │       └── page.tsx           # Risk assessment page
│   ├── components/
│   │   ├── RiskGauge.tsx          # Animated SVG gauge component
│   │   ├── RiskForm.tsx           # Multi-step form (3 steps, 10 fields)
│   │   └── ResultCard.tsx         # Results with factor breakdown
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── 📂 presentation/
│   └── index.html                 # 11-slide interactive HTML presentation
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) NVIDIA GPU with CUDA 11/12 for GPU training

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate synthetic dataset (5,000 rows)
python generate_dataset.py

# Train the model (auto-detects GPU)
python train.py

# Start the API server
uvicorn main:app --reload --port 8000
```

> 🖥️ **GPU Training**: If you have an NVIDIA GPU, XGBoost will automatically use CUDA acceleration. The script detects GPU via `nvidia-smi` and sets `device='cuda'` on the XGBoost model. Falls back to CPU if no GPU found.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 AI Model Details

| Property | Value |
|---|---|
| **Algorithm** | XGBoost Regressor (Gradient Boosting) |
| **GPU Support** | CUDA via `device='cuda'`, `tree_method='hist'` |
| **CPU Fallback** | Automatic (same code, no change needed) |
| **Estimators** | 500 trees |
| **Max Depth** | 8 |
| **Learning Rate** | 0.05 |
| **Subsampling** | 85% rows + 85% columns |
| **R² Accuracy** | 93%+ |
| **Training Time** | ~2s CPU / ~0.5s GPU |
| **Inference Time** | < 5ms |

### Input Features (10 total)

| Feature | Type | Description |
|---|---|---|
| `age` | Numeric | Customer age (18–100) |
| `gender` | Categorical | male / female |
| `bmi` | Numeric | Body Mass Index (10–60) |
| `num_dependents` | Numeric | Number of dependents (0–10) |
| `region` | Categorical | northeast / northwest / southeast / southwest |
| `smoker` | Categorical | yes / no |
| `medical_history` | Categorical | none / diabetes / heart_disease / hypertension / obesity / asthma |
| `annual_income` | Numeric | Annual income in ₹ |
| `policy_type` | Categorical | basic / standard / premium |
| `coverage_amount` | Numeric | Coverage amount in ₹ |

### Output
- **`risk_score`**: Float 0–100 (continuous regression output)
- **`risk_label`**: Low / Moderate / High / Critical
- **`top_factors`**: Top 5 contributing risk factors with importance %
- **`recommendations`**: Personalized tips to reduce risk

---

## 🌐 API Reference

### `POST /predict`

**Request:**
```json
{
  "age": 45,
  "gender": "male",
  "bmi": 28.5,
  "num_dependents": 2,
  "region": "northeast",
  "smoker": "yes",
  "medical_history": "hypertension",
  "annual_income": 750000,
  "policy_type": "standard",
  "coverage_amount": 500000
}
```

**Response:**
```json
{
  "risk_score": 74.2,
  "risk_label": "High",
  "risk_color": "#f97316",
  "risk_description": "Your risk profile shows elevated risk. Review key factors.",
  "top_factors": [
    {"factor": "Smoker", "importance": 32.1, "description": "Smoker: Yes ⚠️"},
    {"factor": "Medical History", "importance": 24.3, "description": "Medical history: Hypertension"}
  ],
  "recommendations": [
    "🚭 Quitting smoking could significantly reduce your risk score by up to 25 points.",
    "💊 Managing blood pressure with lifestyle changes and medication reduces risk."
  ]
}
```

### `GET /health`
Returns model status and version info.

---

## 🎨 Frontend Features

- **Dark Glassmorphism Design** — Deep navy background with backdrop-filter glass cards
- **Animated Background** — Drifting radial gradient orbs
- **3-Step Form** — Guided input with progress indicator
- **Toggle Pills** — For binary fields (gender, smoker, policy type)
- **Profile Sidebar** — Real-time summary as you fill the form
- **SVG Risk Gauge** — Animated semi-circle gauge with color zones (green/yellow/orange/red)
- **Score Animation** — Numbers count up from 0 to the predicted score
- **Factor Bars** — Animated progress bars for top 5 risk contributors
- **Recommendations Panel** — Personalized, actionable cards

---

## ☁️ Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend/`
4. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

### Backend → Render.com
1. New Web Service → connect GitHub repo
2. Set **Root Directory** to `backend/`
3. **Build command**: `pip install -r requirements.txt && python generate_dataset.py && python train.py`
4. **Start command**: `uvicorn main:app --host 0.0.0.0 --port 10000`

---

## 📊 Presentation

Open [`presentation/index.html`](./presentation/index.html) in your browser for an interactive 11-slide presentation covering:
- Problem & Solution
- Tech Stack  
- System Architecture
- Dataset & Features
- GPU Model Training
- FastAPI Backend
- Frontend UI/UX
- End-to-End Flow
- GitHub Deployment
- Summary

Navigate with **← →** arrow keys or click the buttons.

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Built with ❤️ using Python · XGBoost · FastAPI · Next.js 16
</div>
