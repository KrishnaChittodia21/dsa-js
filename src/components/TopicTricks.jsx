import { useEffect, useState } from 'react';
import Markdown from './ui/Markdown.jsx';
import CodeBlock from './ui/CodeBlock.jsx';
import SheetSection from './SheetSection.jsx';
import { SHEET_SECTIONS_BY_TOPIC, sectionByNum, loadTricks, hasTricks } from '../content/guides/index.js';

const KIND_LABEL = {
  recognition: 'Recognition',
  template: 'Template',
  javascript: 'JavaScript',
  'edge-cases': 'Edge cases',
  interview: 'Interview',
  optimization: 'Optimization',
};

// "Pattern recognition" (the learner's sheet sections for this topic) + researched "Tricks & tips".
export default function TopicTricks({ topicId }) {
  const [tricks, setTricks] = useState(null);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    let alive = true;
    setTricks(null);
    if (hasTricks(topicId)) loadTricks(topicId).then((t) => alive && setTricks(t));
    return () => {
      alive = false;
    };
  }, [topicId]);
  const sections = (SHEET_SECTIONS_BY_TOPIC[topicId] || []).map(sectionByNum).filter(Boolean);
  const kinds = tricks ? [...new Set(tricks.tricks.map((t) => t.kind).filter(Boolean))] : [];
  const shown = tricks ? tricks.tricks.filter((t) => filter === 'all' || t.kind === filter) : [];

  return (
    <div className="stack" style={{ marginTop: '2rem' }}>
      {sections.length > 0 && (
        <section>
          <div className="divider-label">Pattern recognition (your cheat sheet)</div>
          <div className="sheet-grid">
            {sections.map((s) => (
              <SheetSection key={s.num} section={s} />
            ))}
          </div>
        </section>
      )}

      {tricks && (
        <section>
          <div className="divider-label">Tricks & tips</div>
          {tricks.signals?.length > 0 && (
            <div className="trick-clues">
              <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>
                More clues that point here
              </div>
              <div className="row-wrap">
                {tricks.signals.map((s) => (
                  <span key={s} className="badge badge-accent mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kinds.length > 1 && (
            <div className="filter-bar">
              <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                All ({tricks.tricks.length})
              </button>
              {kinds.map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                  {KIND_LABEL[k] || k} ({tricks.tricks.filter((t) => t.kind === k).length})
                </button>
              ))}
            </div>
          )}
          <div className="trick-grid">
            {shown.map((t) => (
              <article key={t.title} className="trick">
                <div className="row" style={{ alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <h4 style={{ margin: 0, flex: 1 }}>{t.title}</h4>
                  {t.kind && <span className="badge">{KIND_LABEL[t.kind] || t.kind}</span>}
                </div>
                <Markdown className="small">{t.md}</Markdown>
                {t.code && <CodeBlock code={t.code} copy />}
              </article>
            ))}
          </div>
          {tricks.traps?.length > 0 && (
            <div className="trick-traps">
              <h4>Looks like one thing, is actually another</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Looks like</th>
                      <th>Actually</th>
                      <th>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tricks.traps.map((t, i) => (
                      <tr key={i}>
                        <td className="small">{t.looksLike}</td>
                        <td className="small" style={{ fontWeight: 600 }}>
                          {t.actually}
                        </td>
                        <td className="small muted">
                          <Markdown className="inline-md">{t.why}</Markdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tricks.sources?.length > 0 && (
            <details className="details" style={{ marginTop: '1rem' }}>
              <summary className="small">Sources consulted ({tricks.sources.length})</summary>
              <ul className="small">
                {tricks.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                      <span aria-hidden="true" className="ext-mark">
                        {' '}
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
