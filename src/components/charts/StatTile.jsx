/** Stat tile: label · value · optional context line. The number is the chart. */
export default function StatTile({ label, value, hint, icon }) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        {icon}
        {label}
      </div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
