import { useLayoutEffect, useRef, useState } from 'react';

/** On a narrow screen a long array (8–16 cells) is wider than its stage: zoom the drawing down to fit instead of
 *  hiding cells behind a sideways scroll (never below 55%, so values stay readable). Re-measures when `dep` changes
 *  or the stage's parent resizes. Returns [ref for the stage element, zoom]. */
export function useFitZoom(dep) {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const stage = ref.current;
    if (!stage) return undefined;
    const fit = () => {
      // measure at natural size: drop the zoom for the measurement, then let React set the new one
      const prev = stage.style.zoom;
      stage.style.zoom = '';
      const cs = getComputedStyle(stage);
      const avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      // a panel shrinks to the stage and its array overflows inside it, so use each panel's content width
      const widest = Math.max(...[...stage.children].map((c) => Math.max(c.scrollWidth, ...[...c.children].map((g) => g.scrollWidth))), 1);
      stage.style.zoom = prev;
      setZoom(widest > avail ? Math.max(0.55, Math.floor((avail / widest) * 100) / 100) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage.parentElement);
    return () => ro.disconnect();
  }, [dep]);
  return [ref, zoom];
}
