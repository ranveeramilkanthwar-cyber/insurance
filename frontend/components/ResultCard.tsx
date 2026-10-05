'use client';

import { useEffect, useRef } from 'react';
import RiskGauge from './RiskGauge';

interface RiskFactor {
  factor: string;
  importance: number;
  description: string;
}

interface PredictResponse {
  risk_score: number;
  risk_label: string;
  risk_color: string;
  risk_description: string;
  top_factors: RiskFactor[];
  recommendations: string[];
}

interface ResultCardProps {
  result: PredictResponse;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Animate bars in after mount
  useEffect(() => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      setTimeout(() => {
        bar.style.width = `${result.top_factors[i].importance}%`;
      }, 300 + i * 100);
    });
  }, [result]);

  return (
    <div style={{ animation: 'scaleIn 0.5s ease both' }}>
      {/* Top row */}
      <div className="results-layout">
        {/* Gauge card */}
        <div className="result-card glow-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>
            YOUR RISK SCORE
          </h2>
          <RiskGauge
            score={result.risk_score}
            color={result.risk_color}
            label={result.risk_label}
          />
          <p className="risk-description">{result.risk_description}</p>
        </div>

        {/* Top factors card */}
        <div className="result-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> Risk Factor Breakdown
          </h2>
          <div className="factors-list">
            {result.top_factors.map((f, i) => (
              <div className="factor-item" key={i}>
                <div className="factor-item-header">
                  <span className="factor-name">{f.factor}</span>
                  <span className="factor-pct">{f.importance.toFixed(1)}%</span>
                </div>
                <div className="factor-bar-bg">
                  <div
                    ref={(el) => { barRefs.current[i] = el; }}
                    className="factor-bar-fill"
                    style={{ width: '0%' }}
                  />
                </div>
                <div className="factor-desc">{f.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="result-card full">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💡</span> Personalized Recommendations
          </h2>
          <div className="recs-list">
            {result.recommendations.map((rec, i) => (
              <div className="rec-item" key={i}>
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn-secondary" onClick={onReset} style={{ cursor: 'pointer' }}>
          ← Assess Another Profile
        </button>
      </div>
    </div>
  );
}
