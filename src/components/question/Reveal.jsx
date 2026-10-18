import { useState } from 'react';
import Icon from '../ui/Icon.jsx';

// One rung of the question's hint ladder (hints, approach, solution): locked → available → open.
// It must be explicitly opened; `confirmText` asks once before opening (e.g. the solution).
export default function Reveal({ title, icon = 'bulb', open, onOpen, locked, lockedText, confirmText, children, tone, meta, closedMeta }) {
  const [confirming, setConfirming] = useState(false);
  if (open) {
    return (
      <section className={`qp-rung qp-rung--open ${tone ? `qp-rung--${tone}` : ''}`}>
        <div className="qp-rung-h">
          <Icon name={icon} size={15} /> {title}
          {meta && <span className="lbl-mono">{meta}</span>}
        </div>
        <div className="qp-rung-body">{children}</div>
      </section>
    );
  }
  return (
    <section className={`qp-rung ${locked ? 'qp-rung--lock' : ''}`}>
      <div className="qp-rung-h">
        <Icon name={locked ? 'lock' : icon} size={15} /> {title}
        <span className="lbl-mono">{locked ? 'locked' : closedMeta || 'tap to reveal'}</span>
      </div>
      {locked ? (
        <p className="qp-rung-note">{lockedText}</p>
      ) : confirming ? (
        <div className="qp-rung-confirm">
          <span>{confirmText}</span>
          <div className="qp-row">
            <button type="button" className="btn btn--plasma btn--sm" onClick={onOpen}>
              Yes, show it
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>
              I&apos;ll keep trying
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--ghost btn--sm qp-rung-btn" onClick={() => (confirmText ? setConfirming(true) : onOpen())}>
          Reveal {title.toLowerCase()}
        </button>
      )}
    </section>
  );
}
