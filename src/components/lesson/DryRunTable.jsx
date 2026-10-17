import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';

// Iteration table revealed one row at a time so the learner predicts the next state.
export default function DryRunTable({ title, columns, rows, note, stepwise = true }) {
  const [shown, setShown] = useState(stepwise ? 1 : rows.length);
  const done = shown >= rows.length;
  return (
    <div className="dryrun">
      {title && (
        <div className="dryrun-title">
          <span className="eyebrow">Dry run</span> <span className="dryrun-code">{title}</span>
        </div>
      )}
      <div className="ruled-wrap">
        <table className="dryrun-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((r, i) => (
              <tr key={i} className={i === shown - 1 && !done ? 'dryrun-latest' : ''}>
                {r.map((cell, j) => (
                  <td key={j}>{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stepwise && (
        <div className="dryrun-actions">
          {!done ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => setShown((s) => s + 1)}>
                Next row →
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(rows.length)}>
                Show every row
              </button>
              <span className="dryrun-hint">
                Row {shown} of {rows.length}. Predict the next one before you reveal it.
              </span>
            </>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(1)}>
              ↺ Start the dry run again
            </button>
          )}
        </div>
      )}
      {note && done && <Markdown className="dryrun-note">{note}</Markdown>}
    </div>
  );
}
