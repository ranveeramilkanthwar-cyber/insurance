import Link from 'next/link';
import './globals.css';

export default function Home() {
  return (
    <>
      {/* Animated background */}
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          Insure<span className="accent">AI</span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="#features">Features</Link></li>
          <li><Link href="#how-it-works">How It Works</Link></li>
          <li><Link href="/predict" className="btn-nav">Get Risk Score →</Link></li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="dot" />
          AI-Powered Risk Assessment
        </div>

        <h1>
          Know Your Insurance
          <br />
          <span className="gradient-text">Risk Score in Seconds</span>
        </h1>

        <p>
          Our machine learning model analyzes 10 key factors from your profile
          and returns a precise risk score (0–100) with actionable insights —
          trained locally on real insurance data.
        </p>

        <div className="hero-actions">
          <Link href="/predict" className="btn-primary">
            🎯 Calculate My Risk Score
          </Link>
          <Link href="#how-it-works" className="btn-secondary">
            📖 Learn How It Works
          </Link>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">5,000+</span>
            <span className="stat-label">Training Records</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">93%+</span>
            <span className="stat-label">Model Accuracy</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">10</span>
            <span className="stat-label">Risk Factors Analyzed</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">&lt; 1s</span>
            <span className="stat-label">Prediction Time</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-header">
          <h2>Why Choose <span className="text-gradient">InsureAI</span>?</h2>
          <p>A complete AI-powered insurance risk platform built for transparency and precision.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon cyan">🤖</div>
            <h3>Random Forest AI Model</h3>
            <p>
              Trained locally using scikit-learn with 300 decision trees. Robust to outliers,
              handles mixed data types, and provides feature importance rankings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon indigo">📊</div>
            <h3>10 Factor Analysis</h3>
            <p>
              Age, BMI, smoking status, medical history, income, region, policy type,
              coverage amount, dependents, and gender — all evaluated simultaneously.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">🎯</div>
            <h3>Personalized Insights</h3>
            <p>
              Get a detailed breakdown of which factors drive your risk score, with
              color-coded bars showing each factor&apos;s contribution.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green">💡</div>
            <h3>Actionable Recommendations</h3>
            <p>
              Receive tailored tips to reduce your risk score — from lifestyle changes
              to policy upgrade suggestions based on your specific profile.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how-it-works">
        <div className="section-header">
          <h2>How It <span className="text-gradient">Works</span></h2>
          <p>Four simple steps from input to insight.</p>
        </div>

        <div className="steps-grid">
          {[
            { n: '1', icon: '📝', title: 'Fill Your Profile', desc: 'Enter personal, health, and policy details in our guided 3-step form.' },
            { n: '2', icon: '🔄', title: 'AI Processes Data', desc: 'Our FastAPI backend preprocesses your inputs and feeds them to the trained model.' },
            { n: '3', icon: '🧠', title: 'Model Predicts', desc: 'The Random Forest Regressor outputs your risk score (0–100) in milliseconds.' },
            { n: '4', icon: '📈', title: 'Get Your Report', desc: 'View your animated risk gauge, factor breakdown, and personalized recommendations.' },
          ].map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-number">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to discover your<br /><span className="text-gradient">insurance risk profile?</span></h2>
          <p>It takes less than 2 minutes. No sign-up required.</p>
          <Link href="/predict" className="btn-primary">
            🚀 Start Risk Assessment
          </Link>
        </div>
      </section>

      <footer className="footer">
        © 2026 InsureAI — Powered by Random Forest ML · Built with Next.js + FastAPI
      </footer>
    </>
  );
}
