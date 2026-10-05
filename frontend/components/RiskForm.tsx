'use client';

import { useState } from 'react';

interface FormData {
  // Step 1 — Personal
  age: string;
  gender: string;
  region: string;
  num_dependents: string;
  // Step 2 — Health
  bmi: string;
  smoker: string;
  medical_history: string;
  // Step 3 — Policy
  annual_income: string;
  policy_type: string;
  coverage_amount: string;
}

interface RiskFormProps {
  onResult: (result: any) => void;
}

const initialForm: FormData = {
  age: '', gender: 'male', region: 'northeast', num_dependents: '0',
  bmi: '', smoker: 'no', medical_history: 'none',
  annual_income: '', policy_type: 'standard', coverage_amount: '',
};

export default function RiskForm({ onResult }: RiskFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        age: parseInt(form.age),
        gender: form.gender,
        bmi: parseFloat(form.bmi),
        num_dependents: parseInt(form.num_dependents),
        region: form.region,
        smoker: form.smoker,
        medical_history: form.medical_history,
        annual_income: parseInt(form.annual_income),
        policy_type: form.policy_type,
        coverage_amount: parseInt(form.coverage_amount),
      };

      const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000');
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Server error');
      }

      const data = await res.json();
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze risk profile using local AI model.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Personal Info', 'Health Info', 'Policy Info'];

  return (
    <div>
      {/* Step progress */}
      <div className="step-progress">
        {stepLabels.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step-dot ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              <div className="step-dot-circle">
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="step-dot-label">{label}</span>
            </div>
            {i < 2 && (
              <div className={`step-connector ${step > i + 1 ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="form-layout">
        {/* Form card */}
        <div key={step} className="form-card">
          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <>
              <h2>
                <span className="step-icon">👤</span>
                Personal Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    id="age"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 35"
                    min={18} max={100}
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Dependents</label>
                  <input
                    id="num_dependents"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 2"
                    min={0} max={10}
                    value={form.num_dependents}
                    onChange={(e) => set('num_dependents', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <div className="toggle-group">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      id={`gender-${g}`}
                      className={`toggle-pill ${form.gender === g ? 'active' : ''}`}
                      onClick={() => set('gender', g)}
                      type="button"
                    >
                      {g === 'male' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Region</label>
                <select
                  id="region"
                  className="form-select"
                  value={form.region}
                  onChange={(e) => set('region', e.target.value)}
                >
                  <option value="northeast">Northeast</option>
                  <option value="northwest">Northwest</option>
                  <option value="southeast">Southeast</option>
                  <option value="southwest">Southwest</option>
                </select>
              </div>

              <div className="form-nav">
                <div />
                <button
                  className="btn-form-next"
                  onClick={() => setStep(2)}
                  disabled={!form.age}
                  type="button"
                >
                  Next: Health Info →
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Health Info ── */}
          {step === 2 && (
            <>
              <h2>
                <span className="step-icon">🏥</span>
                Health Information
              </h2>

              <div className="form-group">
                <label className="form-label">BMI (Body Mass Index)</label>
                <input
                  id="bmi"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 24.5"
                  min={10} max={60}
                  step={0.1}
                  value={form.bmi}
                  onChange={(e) => set('bmi', e.target.value)}
                />
                <span className="form-hint">
                  Normal: 18.5–24.9 · Overweight: 25–29.9 · Obese: 30+
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Smoker?</label>
                <div className="toggle-group">
                  {['no', 'yes'].map((s) => (
                    <button
                      key={s}
                      id={`smoker-${s}`}
                      className={`toggle-pill ${form.smoker === s ? 'active' : ''}`}
                      onClick={() => set('smoker', s)}
                      type="button"
                    >
                      {s === 'no' ? '✅ Non-Smoker' : '🚬 Smoker'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Medical History / Pre-existing Conditions</label>
                <select
                  id="medical_history"
                  className="form-select"
                  value={form.medical_history}
                  onChange={(e) => set('medical_history', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="diabetes">Diabetes</option>
                  <option value="heart_disease">Heart Disease</option>
                  <option value="hypertension">Hypertension</option>
                  <option value="obesity">Obesity</option>
                  <option value="asthma">Asthma</option>
                </select>
              </div>

              <div className="form-nav">
                <button className="btn-form-prev" onClick={() => setStep(1)} type="button">
                  ← Back
                </button>
                <button
                  className="btn-form-next"
                  onClick={() => setStep(3)}
                  disabled={!form.bmi}
                  type="button"
                >
                  Next: Policy Info →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Policy Info ── */}
          {step === 3 && (
            <>
              <h2>
                <span className="step-icon">📋</span>
                Policy & Financial Details
              </h2>

              <div className="form-group">
                <label className="form-label">Annual Income (₹)</label>
                <input
                  id="annual_income"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 750000"
                  min={0}
                  value={form.annual_income}
                  onChange={(e) => set('annual_income', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Policy Type</label>
                <div className="toggle-group">
                  {['basic', 'standard', 'premium'].map((p) => (
                    <button
                      key={p}
                      id={`policy-${p}`}
                      className={`toggle-pill ${form.policy_type === p ? 'active' : ''}`}
                      onClick={() => set('policy_type', p)}
                      type="button"
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Coverage Amount (₹)</label>
                <input
                  id="coverage_amount"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 500000"
                  min={0}
                  value={form.coverage_amount}
                  onChange={(e) => set('coverage_amount', e.target.value)}
                />
                <span className="form-hint">
                  Basic: ₹50K–2L · Standard: ₹2L–5L · Premium: ₹5L–20L
                </span>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="form-nav">
                <button className="btn-form-prev" onClick={() => setStep(2)} type="button">
                  ← Back
                </button>
                <button
                  className="btn-form-next"
                  onClick={handleSubmit}
                  disabled={loading || !form.annual_income || !form.coverage_amount}
                  type="button"
                  id="submit-predict"
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Analyzing...
                    </>
                  ) : (
                    '🎯 Get Risk Score'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar-card">
          <h3>Your Profile Summary</h3>
          <div className="factor-preview">
            {form.age && (
              <div className="factor-row">
                <span className="factor-label">👤 Age</span>
                <span className="factor-value">{form.age} years</span>
              </div>
            )}
            <div className="factor-row">
              <span className="factor-label">⚧ Gender</span>
              <span className="factor-value">{form.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
            </div>
            <div className="factor-row">
              <span className="factor-label">📍 Region</span>
              <span className="factor-value">{form.region.charAt(0).toUpperCase() + form.region.slice(1)}</span>
            </div>
            <div className="factor-row">
              <span className="factor-label">👨‍👩‍👧 Dependents</span>
              <span className="factor-value">{form.num_dependents}</span>
            </div>
            {form.bmi && (
              <div className="factor-row">
                <span className="factor-label">⚖️ BMI</span>
                <span className="factor-value">{form.bmi}</span>
              </div>
            )}
            <div className="factor-row">
              <span className="factor-label">🚬 Smoker</span>
              <span className="factor-value" style={{ color: form.smoker === 'yes' ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                {form.smoker === 'yes' ? 'Yes ⚠️' : 'No ✅'}
              </span>
            </div>
            <div className="factor-row">
              <span className="factor-label">🏥 Medical</span>
              <span className="factor-value" style={{ fontSize: '0.8rem' }}>
                {form.medical_history === 'none' ? 'None ✅' : form.medical_history.replace('_', ' ')}
              </span>
            </div>
            {form.policy_type && (
              <div className="factor-row">
                <span className="factor-label">📋 Policy</span>
                <span className="factor-value">{form.policy_type.charAt(0).toUpperCase() + form.policy_type.slice(1)}</span>
              </div>
            )}
          </div>

          <div className="model-info">
            <div className="model-badge">🤖 AI Model Active</div>
            <p>
              Random Forest Regressor · 300 trees · Trained on 5,000 records ·
              R² &gt; 0.93 · Local client-side AI inference
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
