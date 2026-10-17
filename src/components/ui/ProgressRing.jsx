import { motion, useReducedMotion } from 'motion/react';

/**
 * Progress (0–100) drawn as a thin ruled bar with quarter tick marks, `size` px wide, with an optional
 * Fraunces figure above it. The props are those of the old ring, so callers didn't change:
 * `stroke` sets the bar weight, `tone` its ink, `children` replaces the figure.
 */
export default function ProgressRing({ value, size = 44, stroke = 5, tone, label, showValue = true, children }) {
  const v = Math.min(100, Math.max(0, Math.round(value || 0)));
  const reduce = useReducedMotion();
  const color = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--accent)';
  const h = Math.max(2, Math.min(4, Math.round(stroke / 2)));
  return (
    <span
      className="pring"
      style={{ width: size, '--pring-h': `${h}px` }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label ?? `${v}% complete`}
    >
      {(children || showValue) && (
        <span className="pring-label" aria-hidden="true" style={{ fontSize: Math.max(12, Math.round(size * 0.3)) }}>
          {children ?? `${v}%`}
        </span>
      )}
      <span className="pring-track" aria-hidden="true">
        <motion.span
          className="pring-fill"
          style={{ background: color }}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: v / 100 }}
          transition={{ duration: 0.6, ease: [0.3, 0.7, 0.1, 1] }}
        />
      </span>
    </span>
  );
}
