import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { Callout, EmptyState } from '../components/ui/primitives.jsx';
import { jsSections, jsComplexityTable, jsGotchas } from '../content/index.js';

export default function JsReferencePage() {
  const location = useLocation();
  const [filter, setFilter] = useState('');
  useEffect(() => {
    if (location.hash) setTimeout(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [location.hash]);
  const f = filter.toLowerCase();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>JavaScript for DSA</h1>
          <p>Only the JavaScript you need for interviews — with the time complexity of each operation.</p>
        </div>
        <span className="spacer" />
        <input className="input" placeholder="Filter (e.g. splice, Map, ??)" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter APIs" />
      </div>
      {jsSections.length === 0 && <EmptyState title="Reference is being written" />}
      <nav className="row-wrap" style={{ marginBottom: '1.25rem' }} aria-label="Sections">
        {jsSections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip">
            {s.title}
          </a>
        ))}
        {jsComplexityTable.length > 0 && (
          <a href="#complexity" className="chip">
            Complexity table
          </a>
        )}
        {jsGotchas.length > 0 && (
          <a href="#gotchas" className="chip">
            Gotchas
          </a>
        )}
      </nav>
      {jsComplexityTable.length > 0 && !f && (
        <section id="complexity" className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Complexity at a glance</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Time</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {jsComplexityTable.map((r) => (
                  <tr key={r.op}>
                    <td className="mono small">{r.op}</td>
                    <td className="mono small nowrap" style={{ color: 'var(--accent)' }}>
                      {r.time}
                    </td>
                    <td className="small muted">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {jsSections.map((s) => {
        const items = (s.items || []).filter((it) => !f || `${it.name} ${it.signature} ${it.description} ${it.dsaUse}`.toLowerCase().includes(f));
        if (!items.length) return null;
        return (
          <section key={s.id} id={s.id} style={{ marginBottom: '2rem', scrollMarginTop: '1rem' }}>
            <h2>{s.title}</h2>
            {s.intro && !f && <Markdown className="muted">{s.intro}</Markdown>}
            <div className="stack-sm" style={{ marginTop: '0.75rem' }}>
              {items.map((it) => (
                <div key={it.name} id={`${s.id}-${it.name}`} className="card js-item">
                  <div className="row-wrap">
                    <code className="js-sig">{it.signature || it.name}</code>
                    <span className="spacer" />
                    {it.complexity && <span className="badge badge-accent mono">{it.complexity}</span>}
                  </div>
                  <Markdown className="small">{it.description}</Markdown>
                  {it.example && <CodeBlock code={it.example} copy={false} />}
                  {it.dsaUse && (
                    <div className="small">
                      <strong>DSA use:</strong> {it.dsaUse}
                    </div>
                  )}
                  {it.pitfall && (
                    <div className="small js-pitfall">
                      <strong>Pitfall:</strong> <Markdown className="inline-md">{it.pitfall}</Markdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {jsGotchas.length > 0 && !f && (
        <section id="gotchas">
          <h2>Classic gotchas</h2>
          <div className="grid-2">
            {jsGotchas.map((g) => (
              <Callout key={g.title} variant="warning" title={g.title}>
                <Markdown className="small">{g.md}</Markdown>
              </Callout>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
