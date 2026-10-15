// Shared chart plumbing (no components here): colour roles, tooltip state, container width, roving focus.
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** colour roles for marks; values live in src/styles/tokens.css (validated light + dark, not tied to the accent) */
export const C = {
  series: 'var(--chart-series)',
  weak: 'var(--chart-weak)',
  ord1: 'var(--chart-ord-1)',
  ord2: 'var(--chart-ord-2)',
  ord3: 'var(--chart-ord-3)',
  empty: 'var(--chart-empty)',
};

/**
 * One tooltip per chart. Attach `ref` to the positioned wrapper, spread `bind(data)` on each mark
 * (pointer + focus: keyboard focus shows the same readout as hover) and render <ChartTooltip tip={tip} />.
 * data: { value, label, detail?, color? }
 */
export function useTooltip() {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const place = useCallback((clientX, clientY, data) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setTip({ ...data, x: clientX - r.left, y: clientY - r.top, w: r.width });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  const bind = useCallback(
    (data) => ({
      onPointerMove: (e) => place(e.clientX, e.clientY, data),
      onPointerLeave: hide,
      onFocus: (e) => {
        const b = e.currentTarget.getBoundingClientRect();
        place(b.left + b.width / 2, b.top, data);
      },
      onBlur: hide,
    }),
    [place, hide],
  );
  return { ref, tip, bind, place, hide };
}

/** width of an element, kept in sync with ResizeObserver */
export function useWidth(fallback = 600) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width) || fallback));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return { ref, width };
}

/**
 * Roving tabindex for dense marks (heatmap cells): one tab stop,
 * ←/→ move by `step` (a week in the heatmap), ↑/↓ by one, Home/End to the ends.
 */
export function useRoving(count, { step = 1, initial = count - 1 } = {}) {
  const [active, setActive] = useState(Math.max(0, Math.min(initial, count - 1)));
  const nodes = useRef(new Map());
  const move = useCallback(
    (to) => {
      const i = Math.max(0, Math.min(count - 1, to));
      setActive(i);
      nodes.current.get(i)?.focus();
    },
    [count],
  );
  const itemProps = useCallback(
    (i, isActive) => ({
      ref: (el) => {
        if (el) nodes.current.set(i, el);
        else nodes.current.delete(i);
      },
      tabIndex: isActive ? 0 : -1,
      onKeyDown: (e) => {
        const delta = { ArrowRight: step, ArrowLeft: -step, ArrowDown: 1, ArrowUp: -1 };
        if (e.key in delta) move(i + delta[e.key]);
        else if (e.key === 'Home') move(0);
        else if (e.key === 'End') move(count - 1);
        else return;
        e.preventDefault();
      },
      onClick: () => setActive(i),
    }),
    [count, move, step],
  );
  return { active, setActive, itemProps };
}

export const pctOf = (n, total) => (total ? Math.round((n / total) * 100) : 0);
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
