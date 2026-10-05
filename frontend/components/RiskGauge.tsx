'use client';

import { useEffect, useRef } from 'react';

interface RiskGaugeProps {
  score: number;
  color: string;
  label: string;
}

export default function RiskGauge({ score, color, label }: RiskGaugeProps) {
  const arcRef = useRef<SVGPathElement>(null);
  const animatedScoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Animate the score number counting up
    let start = 0;
    const end = score;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(timer);
      }
      if (animatedScoreRef.current) {
        animatedScoreRef.current.textContent = Math.round(current).toString();
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // SVG gauge parameters
  const cx = 110;
  const cy = 120;
  const r = 90;
  const startAngle = -180;
  const endAngle = 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const describeArc = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + r * Math.cos(toRad(startDeg)),
      y: cy + r * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg)),
      y: cy + r * Math.sin(toRad(endDeg)),
    };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  // Calculate filled arc angle
  const fillDeg = startAngle + (score / 100) * 180;
  const fillPath = score > 0 ? describeArc(startAngle, Math.min(fillDeg, endAngle - 0.1)) : '';
  const bgPath = describeArc(startAngle, endAngle);

  const riskBgColor =
    score < 25 ? 'rgba(34,197,94,0.15)'
    : score < 50 ? 'rgba(245,158,11,0.15)'
    : score < 75 ? 'rgba(249,115,22,0.15)'
    : 'rgba(239,68,68,0.15)';

  return (
    <div className="gauge-wrapper">
      <div className="gauge-svg-container">
        <svg
          width="220"
          height="130"
          viewBox="0 0 220 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ticks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = -180 + i * 18;
            const rad = toRad(angle);
            const x1 = cx + (r - 10) * Math.cos(rad);
            const y1 = cy + (r - 10) * Math.sin(rad);
            const x2 = cx + r * Math.cos(rad);
            const y2 = cy + r * Math.sin(rad);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" />
            );
          })}

          {/* Background arc */}
          <path
            d={bgPath}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />

          {/* Color zones */}
          {/* Low (0-25%) */}
          <path d={describeArc(-180, -135)} stroke="#22c55e22" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* Moderate (25-50%) */}
          <path d={describeArc(-135, -90)} stroke="#f59e0b22" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* High (50-75%) */}
          <path d={describeArc(-90, -45)} stroke="#f9731622" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* Critical (75-100%) */}
          <path d={describeArc(-45, 0)} stroke="#ef444422" strokeWidth="14" strokeLinecap="round" fill="none" />

          {/* Filled arc */}
          {fillPath && (
            <path
              ref={arcRef}
              d={fillPath}
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              style={{
                filter: `drop-shadow(0 0 8px ${color}80)`,
                strokeDasharray: '1000',
                strokeDashoffset: '0',
              }}
            />
          )}

          {/* Needle endpoint dot */}
          {score > 0 && (
            <circle
              cx={cx + r * Math.cos(toRad(fillDeg))}
              cy={cy + r * Math.sin(toRad(fillDeg))}
              r="6"
              fill={color}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          )}
        </svg>

        {/* Score overlay */}
        <div className="gauge-score-overlay">
          <div className="gauge-score-number" style={{ color }}>
            <span ref={animatedScoreRef}>0</span>
          </div>
          <div className="gauge-score-label">/ 100</div>
        </div>
      </div>

      {/* Risk badge */}
      <div
        className="risk-badge"
        style={{
          backgroundColor: riskBgColor,
          border: `1px solid ${color}50`,
          color,
        }}
      >
        <span>●</span> {label} Risk
      </div>
    </div>
  );
}
