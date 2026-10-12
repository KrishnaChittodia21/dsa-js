import { useState } from 'react';
import Icon from '../ui/Icon.jsx';

// A collapsible learning stage that must be explicitly opened (hints, approach, solution).
export default function Reveal({ title, icon = 'bulb', open, onOpen, locked, lockedText, confirmText, children, tone }) {
  const [confirming, setConfirming] = useState(false);
  if (open) {
    return (
      <section className={`reveal reveal-open ${tone ? `reveal-${tone}` : ''}`}>
        <div className="reveal-title">
          <Icon name={icon} size={16} /> {title}
        </div>
        <div className="reveal-body">{children}</div>
      </section>
    );
  }
  return (
    <section className="reveal">
      <div className="reveal-title muted">
        <Icon name={locked ? 'lock' : icon} size={16} /> {title}
      </div>
      {locked ? (
        <div className="small faint">{lockedText}</div>
      ) : confirming ? (
        <div className="row-wrap">
          <span className="small">{confirmText}</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={onOpen}>
            Yes, show it
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
            I'll keep trying
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-sm" onClick={() => (confirmText ? setConfirming(true) : onOpen())}>
          Reveal {title.toLowerCase()}
        </button>
      )}
    </section>
  );
}
