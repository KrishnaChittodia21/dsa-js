import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import BigOChip, { firstBigO } from '../components/BigOChip.jsx';
import { jsSections, jsComplexityTable, jsGotchas } from '../content/index.js';
import { WorkbenchHeader } from './ToolkitPage.jsx';

export default function JsReferencePage() {
  const location = useLocation();
  const [filter, setFilter] = useState('');
  const [section, setSection] = useState('all');
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = decodeURIComponent(location.hash.slice(1));
    setSection('all');
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    return () => clearTimeout(t);
  }, [location.hash]);
  const f = filter.toLowerCase().trim();
  const sections = jsSections
    .filter((s) => section === 'all' || s.id === section)
    .map((s) => ({ ...s, items: (s.items || []).filter((it) => !f || `${it.name} ${it.signature} ${it.description} ${it.dsaUse} ${it.complexity}`.toLowerCase().includes(f)) }))
    .filter((s) => s.items.length);
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const showExtras = !f && section === 'all';

  return (
    <div className="page wb-page jr-page">
      <WorkbenchHeader title="JavaScript for DSA" lead="Only the JavaScript you need for interviews — with the time complexity of each operation and the traps that cost accepted answers." />

      <div className="jr-top rise" style={{ '--i': 1 }}>
        <label className="search-in">
          <Icon name="search" size={17} />
          <input className="input" type="search" placeholder="Filter (e.g. splice, Map, ??, O(n))" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter APIs" />
        </label>
        <span className="jr-count mono">
          {total} API{total === 1 ? '' : 's'}
        </span>
      </div>
      <div className="jr-secs rise" style={{ '--i': 2 }} role="group" aria-label="Sections">
        <button type="button" className="chip" aria-pressed={section === 'all'} onClick={() => setSection('all')}>
          All <b>{jsSections.reduce((n, s) => n + (s.items || []).length, 0)}</b>
        </button>
        {jsSections.map((s) => (
          <button key={s.id} type="button" className="chip" aria-pressed={section === s.id} onClick={() => setSection(s.id)}>
            {s.title} <b>{(s.items || []).length}</b>
          </button>
        ))}
      </div>

      {jsSections.length === 0 && <div className="tile">Reference is being written.</div>}

      <div className="jr-layout">
        <div className="jr-main">
          {sections.map((s, si) => (
            <section key={s.id} id={s.id} className="tile jr-sec rise" style={{ '--i': Math.min(si + 3, 10) }} aria-labelledby={`jr-${s.id}`}>
              <div className="tile-head">
                <div>
                  <span className="eyebrow">
                    <i className="pip pip--ice" />
                    {s.items.length} API{s.items.length === 1 ? '' : 's'}
                  </span>
                  <h2 id={`jr-${s.id}`} className="h2" style={{ marginTop: 12 }}>
                    {s.title}
                  </h2>
                </div>
              </div>
              {s.intro && !f && <Markdown className="jr-intro">{s.intro}</Markdown>}
              {s.items.map((it) => (
                <div key={it.name} id={`${s.id}-${it.name}`} className="jr-api">
                  <code className="jr-sig">{it.signature || it.name}</code>
                  <div className="jr-body">
                    <Markdown className="jr-desc">{it.description}</Markdown>
                    {it.dsaUse && (
                      <p className="jr-use">
                        <b>DSA use:</b> {it.dsaUse}
                      </p>
                    )}
                    {it.pitfall && (
                      <div className="jr-pit">
                        <Icon name="alert" size={14} />
                        <Markdown className="inline-md">{it.pitfall}</Markdown>
                      </div>
                    )}
                    {it.example && <CodeBlock code={it.example} copy={false} />}
                  </div>
                  {it.complexity ? <BigOChip value={it.complexity} label={firstBigO(it.complexity)} title={it.complexity} sm /> : <span />}
                </div>
              ))}
            </section>
          ))}
          {sections.length === 0 && <div className="tile jr-empty">Nothing matches “{filter}”. Try a method name like <code>slice</code> or a complexity like <code>O(n)</code>.</div>}
        </div>

        {showExtras && (
          <aside className="jr-aside">
            {jsComplexityTable.length > 0 && (
              <section id="complexity" className="tile jr-cx rise" style={{ '--i': 3 }} aria-labelledby="jr-cx-t">
                <div className="tile-head">
                  <div>
                    <span className="eyebrow">
                      <i className="pip pip--uv" />
                      {jsComplexityTable.length} operations
                    </span>
                    <h2 id="jr-cx-t" className="h2" style={{ marginTop: 12 }}>
                      Complexity at a glance
                    </h2>
                  </div>
                </div>
                <div className="jr-cx-list">
                  {jsComplexityTable.map((r) => (
                    <div key={r.op} className="jr-cx-row">
                      <code>{r.op}</code>
                      <BigOChip value={r.time} label={firstBigO(r.time)} title={r.time} sm />
                      {r.note && <span className="jr-cx-note">{r.note}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {jsGotchas.length > 0 && (
              <section id="gotchas" className="tile jr-go rise" style={{ '--i': 4 }} aria-labelledby="jr-go-t">
                <div className="tile-head">
                  <div>
                    <span className="eyebrow">
                      <i className="pip pip--volt" />
                      Gotchas · {jsGotchas.length} traps
                    </span>
                    <h2 id="jr-go-t" className="h2" style={{ marginTop: 12 }}>
                      Costs accepted answers
                    </h2>
                  </div>
                </div>
                {jsGotchas.map((g, i) => (
                  <div key={g.title} className="jr-gotcha">
                    <span className="jr-gn">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <b>{g.title}</b>
                      <Markdown className="jr-go-md">{g.md}</Markdown>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
