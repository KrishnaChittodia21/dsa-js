import { motion } from 'motion/react';

/** Circular progress (0–100) whose stroke animates in. Pass a label for screen readers. */
export default function ProgressRing({ value, size = 44, stroke = 5, tone, label, showValue = true, children }) {
  const v = Math.min(100, Math.max(0, Math.round(value || 0)));
  const r = (size - stroke) / 2;
  const color = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--accent)';
  return (
    <span className="pring" style={{ width: size, height: size }} role="img" aria-label={label ?? `${v}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: v / 100, opacity: v === 0 ? 0 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {(children || showValue) && (
        <span className="pring-label" aria-hidden="true" style={{ fontSize: Math.max(10, size * 0.24) }}>
          {children ?? `${v}%`}
        </span>
      )}
    </span>
  );
}
