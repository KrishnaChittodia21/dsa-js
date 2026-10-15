import { Link } from 'react-router-dom';
import { useTooltip } from './core.js';
import ChartTooltip from './ChartTooltip.jsx';

/**
 * Horizontal bar list: label | thin bar from a shared baseline | value at the tip.
 * The whole row is the hover/focus target (a link when `href` is set). Optional reference line.
 * rows: { id, label, sub?, value, display, ariaLabel, tip, href?, actions?, color? }[]
 */
export default function BarList({ rows, max, color, reference, labelWidth }) {
  const { ref: tipRef, tip, bind } = useTooltip();
  const pos = (v) => `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%`;
  return (
    <div className="barlist" ref={tipRef} style={labelWidth ? { '--bar-label': labelWidth } : undefined}>
      {reference && (
        <div className="barlist-ref-row" aria-hidden="true">
          <span />
          <span className="barlist-ref-track">
            <span className="barlist-ref-label" style={{ left: pos(reference.value) }}>
              {reference.label}
            </span>
          </span>
          <span />
        </div>
      )}
      <ul className="barlist-rows">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="barlist-label">
                <span className="barlist-name">{r.label}</span>
                {r.sub && <span className="barlist-sub">{r.sub}</span>}
              </span>
              <span className="barlist-track">
                <span className="barlist-bar" style={{ width: pos(r.value), background: r.color ?? color }} />
                {reference && <span className="barlist-ref" style={{ left: pos(reference.value) }} />}
              </span>
              <span className="barlist-value">{r.display}</span>
            </>
          );
          const handlers = bind({ ...r.tip, color: r.tip.color ?? r.color ?? color });
          return (
            <li key={r.id} className={r.actions ? 'has-actions' : ''}>
              {r.href ? (
                <Link to={r.href} className="barlist-row" aria-label={r.ariaLabel} {...handlers}>
                  {inner}
                </Link>
              ) : (
                <div className="barlist-row" tabIndex={0} role="img" aria-label={r.ariaLabel} {...handlers}>
                  {inner}
                </div>
              )}
              {r.actions && <div className="barlist-actions">{r.actions}</div>}
            </li>
          );
        })}
      </ul>
      <ChartTooltip tip={tip} />
    </div>
  );
}
