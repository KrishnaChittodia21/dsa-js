/** Swatch mirrors the mark; text stays in text tokens, never the series colour. items: { label, color, kind?, value? } */
export default function Legend({ items, className = '' }) {
  return (
    <ul className={`chart-legend ${className}`}>
      {items.map((it) => (
        <li key={it.label}>
          <span className={`chart-swatch ${it.kind === 'line' ? 'line' : ''}`} style={{ background: it.color }} aria-hidden="true" />
          <span>{it.label}</span>
          {it.value !== undefined && <span className="chart-legend-value">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
