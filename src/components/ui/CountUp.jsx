import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Number that counts up from 0 on first render (instant when reduced motion is on). */
export default function CountUp({ value, suffix = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const from = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduce) {
      el.textContent = `${value}${suffix}`;
      return undefined;
    }
    const controls = animate(from.current, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => {
        el.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, suffix, reduce]);
  return (
    <span ref={ref} aria-label={`${value}${suffix}`}>
      {reduce ? `${value}${suffix}` : `0${suffix}`}
    </span>
  );
}
