interface Tree {
  l: number[];
  r: number[];
  i: number[];
  c: number[];
  w: number[];
}

interface ModelData {
  base_score: number;
  scaler: {
    mean: number[];
    scale: number[];
  };
  categories: {
    gender: string[];
    region: string[];
    smoker: string[];
    medical_history: string[];
    policy_type: string[];
  };
  trees: Tree[];
}

let cachedModel: ModelData | null = null;

async function getModel(): Promise<ModelData> {
  if (cachedModel) return cachedModel;
  const res = await fetch('/model_data.json');
  if (!res.ok) throw new Error('Failed to load local ML model data');
  cachedModel = await res.json();
  return cachedModel!;
}

export interface PredictRequest {
  age: number;
  gender: string;
  bmi: number;
  num_dependents: number;
  region: string;
  smoker: string;
  medical_history: string;
  annual_income: number;
  policy_type: string;
  coverage_amount: number;
}

export interface RiskFactor {
  factor: string;
  importance: number;
  description: string;
}

export interface PredictResponse {
  risk_score: number;
  risk_label: string;
  risk_color: string;
  risk_description: string;
  top_factors: RiskFactor[];
  recommendations: string[];
}

const FEATURE_IMP: Record<string, number> = {
  smoker: 0.8473650217056274,
  medical_history: 0.0891963392496109,
  age: 0.02421896532177925,
  bmi: 0.019582655280828476,
  num_dependents: 0.008342239074409008,
  region: 0.0026130154728889465,
  gender: 0.0023063605185598135,
  annual_income: 0.0022770322393625975,
  policy_type: 0.0022282940335571766,
  coverage_amount: 0.0018700540531426668
};

function getRiskLabel(score: number): { label: string; color: string; description: string } {
  if (score < 25) {
    return { label: 'Low', color: '#22c55e', description: "Your risk profile is excellent. You're a low-risk customer." };
  } else if (score < 50) {
    return { label: 'Moderate', color: '#f59e0b', description: 'Your risk profile is average. Some factors to monitor.' };
  } else if (score < 75) {
    return { label: 'High', color: '#f97316', description: 'Your risk profile shows elevated risk. Review key factors.' };
  } else {
    return { label: 'Critical', color: '#ef4444', description: 'Your risk profile indicates critical risk. Immediate action recommended.' };
  }
}

function getRecommendations(req: PredictRequest, score: number): string[] {
  const recs: string[] = [];
  if (req.smoker === 'yes') {
    recs.push('🚭 Quitting smoking could significantly reduce your risk score by up to 25 points.');
  }
  if (req.bmi >= 30) {
    recs.push('🥗 Maintaining a healthy BMI (18.5–24.9) can reduce health-related risk.');
  }
  if (req.medical_history === 'diabetes' || req.medical_history === 'heart_disease') {
    recs.push('🩺 Regular medical check-ups and medication adherence can help manage your condition.');
  }
  if (req.medical_history === 'hypertension') {
    recs.push("❤️ Managing blood pressure with lifestyle changes and medication reduces risk.");
  }
  if (req.age > 55) {
    recs.push('📅 Consider a comprehensive health plan that covers age-related conditions.');
  }
  if (req.policy_type === 'basic' && score > 50) {
    recs.push('🛡️ Upgrading to a Standard or Premium policy offers better coverage for your risk level.');
  }
  if (recs.length === 0) {
    recs.push('👍 Maintain your healthy lifestyle to keep your risk score low.');
    recs.push('📋 Annual health screenings are recommended for all policyholders.');
  }
  return recs;
}

function getFactorDescription(feature: string, req: PredictRequest): string {
  const formatNum = (n: number) => new Intl.NumberFormat().format(n);
  const bmiStatus = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };
  const mapping: Record<string, string> = {
    smoker: `Smoker: ${req.smoker === 'yes' ? 'Yes 🚭' : 'No 🚭'}`,
    medical_history: `Medical history: ${req.medical_history.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    bmi: `BMI: ${req.bmi} (${bmiStatus(req.bmi)})`,
    age: `Age: ${req.age} years`,
    annual_income: `Annual income: ₹${formatNum(req.annual_income)}`,
    coverage_amount: `Coverage amount: ₹${formatNum(req.coverage_amount)}`,
    region: `Region: ${req.region.replace(/\b\w/g, c => c.toUpperCase())}`,
    policy_type: `Policy: ${req.policy_type.replace(/\b\w/g, c => c.toUpperCase())}`,
    num_dependents: `Dependents: ${req.num_dependents}`,
    gender: `Gender: ${req.gender.replace(/\b\w/g, c => c.toUpperCase())}`
  };
  return mapping[feature] ?? feature.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function localPredict(req: PredictRequest): Promise<PredictResponse> {
  const model = await getModel();

  // 1. Preprocessing - Ordinal Encoding
  const encodeCategorical = (featureName: keyof typeof model.categories, value: string): number => {
    const categoriesList = model.categories[featureName];
    const idx = categoriesList.indexOf(value);
    return idx !== -1 ? idx : -1;
  };

  const genderIdx = encodeCategorical('gender', req.gender);
  const regionIdx = encodeCategorical('region', req.region);
  const smokerIdx = encodeCategorical('smoker', req.smoker);
  const medHistoryIdx = encodeCategorical('medical_history', req.medical_history);
  const policyTypeIdx = encodeCategorical('policy_type', req.policy_type);

  // Raw features vector matching preprocessor ColumnTransformer order:
  // NUMERIC_FEATURES = ["age", "bmi", "num_dependents", "annual_income", "coverage_amount"]
  // CATEGORICAL_FEATURES = ["gender", "region", "smoker", "medical_history", "policy_type"]
  const rawFeatures = [
    req.age,
    req.bmi,
    req.num_dependents,
    req.annual_income,
    req.coverage_amount,
    genderIdx,
    regionIdx,
    smokerIdx,
    medHistoryIdx,
    policyTypeIdx
  ];

  // 2. Preprocessing - Standard Scaling for first 5 features
  const X_trans = new Float32Array(rawFeatures.length);
  for (let i = 0; i < 5; i++) {
    const mean = model.scaler.mean[i];
    const scale = model.scaler.scale[i];
    X_trans[i] = (rawFeatures[i] - mean) / scale;
  }
  // Categorical features are NOT scaled, just copied
  for (let i = 5; i < rawFeatures.length; i++) {
    X_trans[i] = rawFeatures[i];
  }

  // 3. Tree traversal logic
  let sumWeights = 0;
  for (const tree of model.trees) {
    let node = 0;
    while (true) {
      const left = tree.l[node];
      const right = tree.r[node];
      if (left === -1 || right === -1) {
        sumWeights += tree.w[node];
        break;
      }
      
      const feat = tree.i[node];
      const cond = tree.c[node];
      const val = X_trans[feat];
      
      if (val < cond) {
        node = left;
      } else {
        node = right;
      }
    }
  }

  const rawScore = model.base_score + sumWeights;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)) * 10) / 10;

  const { label, color, description } = getRiskLabel(score);

  const topFactors: RiskFactor[] = Object.entries(FEATURE_IMP)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([f, imp]) => ({
      factor: f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      importance: Math.round(imp * 1000) / 10,
      description: getFactorDescription(f, req)
    }));

  const recommendations = getRecommendations(req, score);

  return {
    risk_score: score,
    risk_label: label,
    risk_color: color,
    risk_description: description,
    top_factors: topFactors,
    recommendations
  };
}
