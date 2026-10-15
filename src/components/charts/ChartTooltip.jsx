/**
 * The chart's single tooltip: value first (strong), label second, short line-key in the series
 * colour. aria-hidden because every mark carries the same text in its aria-label.
 */
export default function ChartTooltip({ tip }) {
  if (!tip) return null;
  const half = 80;
  const x = tip.w > half * 2 ? Math.min(Math.max(tip.x, half), tip.w - half) : tip.x;
  return (
    <div className="chart-tip" style={{ left: x, top: tip.y }} aria-hidden="true">
      <div className="chart-tip-row">
        {tip.color && <span className="chart-tip-key" style={{ background: tip.color }} />}
        <strong>{tip.value}</strong>
      </div>
      <div className="chart-tip-label">{tip.label}</div>
      {tip.detail && <div className="chart-tip-detail">{tip.detail}</div>}
    </div>
  );
}
