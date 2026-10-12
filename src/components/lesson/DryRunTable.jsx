import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';

// Iteration table revealed one row at a time so the learner predicts the next state.
export default function DryRunTable({ title, columns, rows, note, stepwise = true }) {
  const [shown, setShown] = useState(stepwise ? 1 : rows.length);
  const done = shown >= rows.length;
  return (
    <div className="dryrun">
      {title && (
        <div className="dryrun-title">
          <Icon name="play" size={14} /> Dry run: <span className="mono">{title}</span>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="mono">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((r, i) => (
              <tr key={i} className={i === shown - 1 && !done ? 'dryrun-latest' : ''}>
                {r.map((cell, j) => (
                  <td key={j} className="mono small">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stepwise && (
        <div className="row" style={{ marginTop: '0.5rem' }}>
          {!done ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => setShown((s) => s + 1)}>
                Next step <Icon name="chevronRight" size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(rows.length)}>
                Show all
              </button>
              <span className="small faint">Predict the next row before revealing it.</span>
            </>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(1)}>
              <Icon name="rotate" size={14} /> Restart
            </button>
          )}
        </div>
      )}
      {note && done && <Markdown className="small muted dryrun-note">{note}</Markdown>}
    </div>
  );
}
