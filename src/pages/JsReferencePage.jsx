import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { jsSections, jsComplexityTable, jsGotchas } from '../content/index.js';

export default function JsReferencePage() {
  const location = useLocation();
  const [filter, setFilter] = useState('');
  useEffect(() => {
    if (location.hash) setTimeout(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [location.hash]);
  const f = filter.toLowerCase();
  const visible = jsSections
    .map((s) => ({ ...s, shown: (s.items || []).filter((it) => !f || `${it.name} ${it.signature} ${it.description} ${it.dsaUse}`.toLowerCase().includes(f)) }))
    .filter((s) => s.shown.length);
  const hits = visible.reduce((n, s) => n + s.shown.length, 0);

  return (
    <div className="page page-wide js ink-in">
      <header className="page-header js-head">
        <div>
          <span className="eyebrow">Reference manual</span>
          <h1>
            JavaScript <em>for DSA</em>
          </h1>
          <p>Only the parts of the language interviews actually lean on — each with what it costs you in time.</p>
        </div>
      </header>

      <div className="js-layout">
        <nav className="js-index" aria-label="Manual sections">
          <label className="js-filter">
            <span className="eyebrow">Find an entry</span>
            <input className="input" type="search" placeholder="splice, Map, ??" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter APIs" />
          </label>
          <ol>
            {jsComplexityTable.length > 0 && !f && (
              <li>
                <a href="#complexity">
                  <span className="folio">0</span> Costs at a glance
                </a>
              </li>
            )}
            {visible.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span className="folio">{jsSections.findIndex((x) => x.id === s.id) + 1}</span> {s.title}
                  {f && <span className="folio js-index-hits">{s.shown.length}</span>}
                </a>
              </li>
            ))}
            {jsGotchas.length > 0 && !f && (
              <li>
                <a href="#gotchas">
                  <span className="folio">!</span> Classic gotchas
                </a>
              </li>
            )}
          </ol>
        </nav>

        <div className="js-body">
          {jsSections.length === 0 && <p className="rf-empty">The manual is still being written. The Toolkit sheets cover the data structures in the meantime.</p>}
          {f && (
            <p className="folio js-hits" aria-live="polite">
              {hits} {hits === 1 ? 'entry mentions' : 'entries mention'} “{filter}”
            </p>
          )}
          {f && hits === 0 && (
            <div className="rf-empty">
              <p>Nothing in the manual mentions “{filter}”. Try the method name without brackets — “slice”, not “slice()”.</p>
              <button type="button" className="btn btn-sm" onClick={() => setFilter('')}>
                Clear the search
              </button>
            </div>
          )}

          {jsComplexityTable.length > 0 && !f && (
            <section id="complexity" className="js-sec">
              <h2 className="js-sec-h">
                <span className="folio">§0</span> Costs at a glance
              </h2>
              <div className="js-cx-wrap">
                <table className="js-cx">
                  <thead>
                    <tr>
                      <th scope="col">Operation</th>
                      <th scope="col">Time</th>
                      <th scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jsComplexityTable.map((r) => (
                      <tr key={r.op}>
                        <td className="mono">{r.op}</td>
                        <td className="mono js-cx-time">{r.time}</td>
                        <td>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {visible.map((s) => (
            <section key={s.id} id={s.id} className="js-sec">
              <h2 className="js-sec-h">
                <span className="folio">§{jsSections.findIndex((x) => x.id === s.id) + 1}</span> {s.title}
              </h2>
              {s.intro && !f && <Markdown className="js-intro">{s.intro}</Markdown>}
              <div className="js-entries">
                {s.shown.map((it) => (
                  <article key={it.name} id={`${s.id}-${it.name}`} className="js-entry">
                    <header className="js-entry-head">
                      <code className="js-entry-sig">{it.signature || it.name}</code>
                      {it.complexity && <span className="js-entry-cx mono">{it.complexity}</span>}
                    </header>
                    <div className="js-entry-text">
                      <Markdown>{it.description}</Markdown>
                      {it.example && <CodeBlock code={it.example} copy={false} />}
                    </div>
                    {(it.dsaUse || it.pitfall) && (
                      <aside className="js-entry-margin">
                        {it.dsaUse && (
                          <p className="rf-note">
                            <span className="eyebrow">Use it for</span>
                            {it.dsaUse}
                          </p>
                        )}
                        {it.pitfall && (
                          <div className="rf-note rf-note-warn">
                            <span className="eyebrow">Watch out</span>
                            <Markdown>{it.pitfall}</Markdown>
                          </div>
                        )}
                      </aside>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}

          {jsGotchas.length > 0 && !f && (
            <section id="gotchas" className="js-sec">
              <h2 className="js-sec-h">
                <span className="folio">§!</span> Classic gotchas
              </h2>
              <ol className="js-gotchas">
                {jsGotchas.map((g) => (
                  <li key={g.title}>
                    <h3>{g.title}</h3>
                    <Markdown>{g.md}</Markdown>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
