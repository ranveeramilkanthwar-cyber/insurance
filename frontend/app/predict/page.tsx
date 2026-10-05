'use client';

import { useState } from 'react';
import Link from 'next/link';
import RiskForm from '@/components/RiskForm';
import ResultCard from '@/components/ResultCard';

export default function PredictPage() {
  const [result, setResult] = useState<any>(null);

  return (
    <>
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          Insure<span className="accent">AI</span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/">← Back to Home</Link></li>
        </ul>
      </nav>

      <main className="predict-page">
        <div className="predict-header">
          <h1>
            {result ? '📊 Your Risk Assessment' : '🎯 Insurance Risk Calculator'}
          </h1>
          <p>
            {result
              ? `Risk Score: ${result.risk_score}/100 — ${result.risk_label} Risk Profile`
              : 'Fill in your details across 3 simple steps to get your AI-powered risk score.'}
          </p>
        </div>

        {result ? (
          <ResultCard result={result} onReset={() => setResult(null)} />
        ) : (
          <RiskForm onResult={setResult} />
        )}
      </main>

      <footer className="footer">
        © 2026 InsureAI — Powered by Random Forest ML · Next.js + FastAPI
      </footer>
    </>
  );
}
