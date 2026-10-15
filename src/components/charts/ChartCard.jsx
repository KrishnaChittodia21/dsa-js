import { useId, useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import Legend from './Legend.jsx';

/**
 * Card that owns a chart's title, subtitle, legend and its table-view twin.
 * When `empty` is set, it replaces the chart (and the table toggle) with a friendly next step.
 * table: { columns: string[], rows: (string|number)[][] }
 */
export default function ChartCard({ title, subtitle, legend, table, empty, action, className = '', children }) {
  const [asTable, setAsTable] = useState(false);
  const id = useId();
  return (
    <section className={`card chart-card ${className}`} aria-labelledby={`${id}-t`}>
      <header className="chart-head">
        <div>
          <h3 id={`${id}-t`} className="chart-title">
            {title}
          </h3>
          {subtitle && <p className="chart-sub">{subtitle}</p>}
        </div>
        <div className="chart-actions">
          {action}
          {table && !empty && (
            <button type="button" className="btn btn-ghost btn-xs chart-toggle" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
              {asTable ? <BarChart3 size={14} aria-hidden="true" /> : <Table2 size={14} aria-hidden="true" />}
              {asTable ? 'View as chart' : 'View as table'}
            </button>
          )}
        </div>
      </header>
      {empty ? (
        <div className="chart-empty">{empty}</div>
      ) : asTable && table ? (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) =>
                    j === 0 ? (
                      <th key={j} scope="row">
                        {v}
                      </th>
                    ) : (
                      <td key={j}>{v}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {children}
          {legend && legend.length > 1 && <Legend items={legend} />}
        </>
      )}
    </section>
  );
}
