import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';

// Iteration table revealed one row at a time so the learner predicts the next state.
export default function DryRunTable({ title, columns, rows, note, stepwise = true }) {
  const [shown, setShown] = useState(stepwise ? 1 : rows.length);
  const done = shown >= rows.length;
  return (
    <div className="dryrun">
      <div className="dryrun-head">
        <span className="dryrun-title">
          <Icon name="play" size={12} /> dry run{title && <span className="dryrun-fn">{title}</span>}
        </span>
        <span className="dryrun-count">
          row {Math.min(shown, rows.length)} / {rows.length}
        </span>
      </div>
      <div className="table-wrap dryrun-scroll">
        <table>
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
        <div className="dryrun-ctl">
          {!done ? (
            <>
              <button type="button" className="btn btn--chrome btn--sm" onClick={() => setShown((s) => s + 1)}>
                Next row <Icon name="chevronRight" size={14} />
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(rows.length)}>
                Show all
              </button>
              <span className="dryrun-scrub" aria-hidden="true">
                {rows.map((_, i) => (
                  <i key={i} className={i < shown - 1 ? 'past' : i === shown - 1 ? 'now' : ''} />
                ))}
              </span>
              <span className="dryrun-hint">Predict the next row before revealing it.</span>
            </>
          ) : (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(1)}>
              <Icon name="rotate" size={14} /> Restart
            </button>
          )}
        </div>
      )}
      {note && done && <Markdown className="small muted dryrun-note">{note}</Markdown>}
    </div>
  );
}
