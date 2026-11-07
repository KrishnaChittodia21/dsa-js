import { useLayoutEffect, useRef, useState } from 'react';

/** On a narrow screen a long array (8–16 cells) is wider than its stage: zoom the drawing down to fit instead of
 *  hiding cells behind a sideways scroll (never below 55%, so values stay readable). Re-measures when `dep` changes
 *  or the stage's parent resizes. With `box` (a ref to a scroll container) the drawing also shrinks so the box
 *  stops overflowing vertically. With `run` set, the stage has a fixed height: the drawing also shrinks to fit that
 *  height, and the zoom only ever goes down while `run` (and the stage size) stays the same, so stepping through a
 *  run settles on the scale of its largest frame instead of rescaling every step. Returns [ref for the stage, zoom]. */
export function useFitZoom(dep, box, run) {
  const ref = useRef(null);
  const sticky = useRef({ run: undefined, size: '', z: 1 });
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
      let z = widest > avail ? avail / widest : 1;
      const el = box?.current;
      const over = el ? el.scrollHeight - el.clientHeight : 0;
      if (over > 0 && stage.offsetHeight > 0) z = Math.min(z, (stage.offsetHeight - over) / stage.offsetHeight);
      if (run !== undefined) {
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        if (stage.scrollHeight > stage.clientHeight) z = Math.min(z, (stage.clientHeight - padY) / (stage.scrollHeight - padY));
      }
      stage.style.zoom = prev;
      z = z < 1 ? Math.max(0.55, Math.floor(z * 100) / 100) : 1;
      if (run !== undefined) {
        const s = sticky.current;
        const size = `${stage.clientWidth}x${stage.clientHeight}`;
        if (s.run !== run || s.size !== size) Object.assign(s, { run, size, z: 1 });
        z = s.z = Math.min(s.z, z);
      }
      setZoom(z);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage.parentElement);
    if (box?.current) ro.observe(box.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  return [ref, zoom];
}
