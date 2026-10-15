import { useTooltip, useWidth } from './core.js';
import ChartTooltip from './ChartTooltip.jsx';

/**
 * Vertical columns on a 0–max scale with hairline gridlines and the value on each cap.
 * columns: { id, label, value, display, ariaLabel, tip }[]
 */
export default function ColumnChart({ columns, max = 100, ticks = [0, 50, 100], tickFormat = (v) => `${v}%`, color, height = 170, ariaLabel = 'Column chart' }) {
  const { ref: tipRef, tip, bind } = useTooltip();
  const { ref, width } = useWidth(320);
  const axisW = 36;
  const top = 18; // room for cap labels
  const bottom = 22; // x-axis labels
  const plotH = height - top - bottom;
  const plotW = Math.max(60, width - axisW);
  const band = plotW / Math.max(1, columns.length);
  const barW = Math.min(28, band * 0.5);
  const y = (v) => top + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH;
  return (
    <div className="colchart" ref={tipRef}>
      <div ref={ref}>
        <svg width={width} height={height} className="chart-svg" role="group" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={axisW} x2={width} y1={y(t)} y2={y(t)} className={t === 0 ? 'chart-axis' : 'chart-gridline'} />
              <text x={axisW - 6} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
                {tickFormat(t)}
              </text>
            </g>
          ))}
          {columns.map((c, i) => {
            const cx = axisW + band * i + band / 2;
            const h = Math.max(0, y(0) - y(c.value));
            const x = cx - barW / 2;
            const yTop = y(c.value);
            const rr = Math.min(4, h, barW / 2);
            // 4px rounded data-end, square at the baseline
            const d = h ? `M${x},${y(0)} V${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} H${x + barW - rr} Q${x + barW},${yTop} ${x + barW},${yTop + rr} V${y(0)} Z` : '';
            return (
              <g key={c.id} className="chart-mark" tabIndex={0} role="img" aria-label={c.ariaLabel} {...bind({ ...c.tip, color })}>
                <rect x={cx - band / 2} y={top} width={band} height={plotH} fill="transparent" />
                {d && <path d={d} fill={color} className="chart-col" />}
                <text x={cx} y={yTop - 6} textAnchor="middle" className="chart-cap">
                  {c.display}
                </text>
                <text x={cx} y={height - 6} textAnchor="middle" className="chart-xlabel">
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ChartTooltip tip={tip} />
    </div>
  );
}
