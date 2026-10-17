import '../../styles/viz.css';

/** Swatch mirrors the mark; text stays in text tokens, never the series colour. items: { label, color, kind?, value? } */
export default function Legend({ items, className = '' }) {
  return (
    <ul className={`tally-legend ${className}`}>
      {items.map((it) => (
        <li key={it.label}>
          <span className={`tally-swatch ${it.kind === 'line' ? 'line' : ''}`} style={{ background: it.color }} aria-hidden="true" />
          <span className="tally-legend-label">{it.label}</span>
          {it.value !== undefined && <span className="tally-legend-value">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
