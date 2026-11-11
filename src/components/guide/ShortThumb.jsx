// A Short's thumbnail: one frame of its own animation — the real panels (arrays, stacks, lists, trees, grids…),
// scaled to fit a small stage — so every card shows its pattern's mechanism. No image files.
import { useLayoutEffect, useRef, useState } from 'react';
import { Check, Play } from 'lucide-react';
import { Panel } from '../../visualizations/panels.jsx';
import { cropArray, posterFrame, shortLength } from '../../lib/shortsOrder.js';

const TONES = ['var(--ice)', 'var(--uv-t)', 'var(--volt-t)', 'var(--plasma-t)', 'var(--good)'];

/** decorative: everything it shows is also in the card's text */
export default function ShortThumb({ short, topicTitle, done = false, frameMs }) {
  const tone = TONES[[...short.topicId].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]; // one tone per topic
  // one panel reads at thumbnail size: the main structure, not the side "variables" box
  const all = posterFrame(short).panels;
  const panels = [cropArray(all.find((p) => p.kind !== 'vars') || all[0])];
  const box = useRef(null);
  const art = useRef(null);
  const [zoom, setZoom] = useState(null); // hidden until measured, so it never flashes at full size

  useLayoutEffect(() => {
    const fit = () => {
      const a = art.current;
      const b = box.current;
      if (!a || !b) return;
      const prev = a.style.zoom;
      a.style.zoom = ''; // measure at natural size
      const z = Math.min(1, (b.clientWidth - 20) / a.scrollWidth, (b.clientHeight - 16) / a.scrollHeight);
      a.style.zoom = prev;
      setZoom(Math.max(0.2, Math.floor(z * 100) / 100));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [short.id]);

  return (
    <span className="sh-thumb" style={{ '--tone': tone }} aria-hidden="true" inert="">
      <span className="sh-thumb-art" ref={box}>
        <span className="sh-thumb-panels" ref={art} style={zoom ? { zoom } : { visibility: 'hidden' }}>
          {panels.map((p, i) => (
            <Panel key={i} panel={p} />
          ))}
        </span>
      </span>
      <span className="sh-thumb-play">
        <Play size={18} fill="currentColor" />
      </span>
      <span className="sh-thumb-kicker mono">{topicTitle}</span>
      <span className="sh-thumb-len mono">{shortLength(short, frameMs)}</span>
      {done && (
        <span className="sh-thumb-seen">
          <Check size={12} /> Watched
        </span>
      )}
    </span>
  );
}
