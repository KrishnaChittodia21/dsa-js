// M11: the page guide `?` opens on a page that has one (pageGuides.js): what each control does; "Show me" closes the
// guide, scrolls to the control and outlines it for a moment. "Open the full tour" opens the welcome tour.
import { useRef } from 'react';
import { Crosshair, X } from 'lucide-react';
import { useFocusTrap } from '../../lib/useFocusTrap.js';

const find = (target) => document.querySelector(`[data-guide="${target}"]`);

function showMe(target) {
  const el = find(target);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  el.classList.remove('guide-flash');
  void el.offsetWidth; // restart the outline if it is shown twice in a row
  el.classList.add('guide-flash');
  setTimeout(() => el.classList.remove('guide-flash'), 1800);
}

export default function PageGuide({ guide, onClose, onOpenTour }) {
  const ref = useRef(null);
  useFocusTrap(ref, true, onClose);
  return (
    <div className="wt-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="pg-card" role="dialog" aria-modal="true" aria-labelledby="pg-title" tabIndex={-1}>
        <header className="pg-head">
          <span className="lbl-mono">Guide · this page</span>
          <h2 id="pg-title">{guide.title}</h2>
          <button type="button" className="iconbtn pg-x" aria-label="Close the guide" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <ol className="pg-list">
          {guide.items.map((it) => (
            <li key={it.title}>
              <b>{it.title}</b>
              <p>{it.text}</p>
              {it.target && find(it.target) && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    onClose();
                    showMe(it.target);
                  }}
                >
                  <Crosshair size={14} aria-hidden="true" /> Show me
                </button>
              )}
            </li>
          ))}
        </ol>
        <footer className="pg-foot">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onOpenTour}>
            Open the full tour
          </button>
        </footer>
      </div>
    </div>
  );
}
