import { useState } from 'react';

// A collapsible learning stage that must be explicitly opened (hints, approach, solution).
// `icon` is kept for API compatibility; stages are marked typographically (○ closed · ● open).
// eslint-disable-next-line no-unused-vars
export default function Reveal({ title, icon, open, onOpen, locked, lockedText, confirmText, children, tone }) {
  const [confirming, setConfirming] = useState(false);
  if (open) {
    return (
      <section className={`unfold unfold-open ${tone ? `unfold-${tone}` : ''}`}>
        <div className="unfold-title">
          <span className="unfold-mark" aria-hidden="true">●</span> {title}
        </div>
        <div className="unfold-body">{children}</div>
      </section>
    );
  }
  return (
    <section className={`unfold ${locked ? 'unfold-locked' : ''}`}>
      <div className="unfold-title">
        <span className="unfold-mark" aria-hidden="true">○</span> {title}
        {locked && <span className="unfold-lock">sealed</span>}
      </div>
      {locked ? (
        <p className="unfold-note">{lockedText}</p>
      ) : confirming ? (
        <div className="unfold-confirm">
          <p className="unfold-note">{confirmText}</p>
          <div className="row-wrap">
            <button type="button" className="btn btn-sm btn-primary" onClick={onOpen}>
              Yes, show it
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
              I&apos;ll keep trying
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-sm" onClick={() => (confirmText ? setConfirming(true) : onOpen())}>
          Show me the {title.toLowerCase()}
        </button>
      )}
    </section>
  );
}
