import { useState } from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { stages } from '../content/index.js';
import { Callout } from '../components/ui/primitives.jsx';
import SheetSection from '../components/SheetSection.jsx';
import { sectionByNum } from '../content/guides/index.js';

export default function CheatSheetPage() {
  const [showTemplates, setShowTemplates] = useState(true);
  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>DSA Cheat Sheet</h1>
          <p>Every pattern on one page: when to use it, the clues that give it away, its template and complexity.</p>
        </div>
        <span className="spacer" />
        <label className="row small">
          <input type="checkbox" checked={showTemplates} onChange={(e) => setShowTemplates(e.target.checked)} /> Show templates
        </label>
        <button type="button" className="btn btn-sm" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <Callout variant="tip" title="Recognising the pattern is half the problem">
        <span className="small">
          Use the <Link to="/finder">Pattern Finder</Link> — an interactive decision tree, keyword → pattern lookup, common confusions and constraint → complexity guide built from your cheat sheet. Each topic's Cheatsheet tab also has its recognition tree plus tricks & tips.
        </span>
      </Callout>
      <div className="sheet-grid" style={{ margin: '1rem 0 2rem' }}>
        <SheetSection section={sectionByNum(58)} collapsible defaultOpen={false} />
        <SheetSection section={sectionByNum(59)} collapsible defaultOpen={false} />
      </div>
      {stages.map((s) => (
        <section key={s.id} style={{ marginBottom: '2rem' }}>
          <div className="divider-label">{s.title}</div>
          <div className="cheat-grid">
            {s.topics
              .filter((t) => t.cheatsheet)
              .map((t) => (
                <article key={t.id} className="card cheat-card">
                  <h3>
                    <Link to={`/topic/${t.id}?tab=cheatsheet`}>{t.title}</Link>
                  </h3>
                  <div className="small">
                    <strong>Use when:</strong> {t.cheatsheet.whenToUse?.join('; ')}
                  </div>
                  <div className="row-wrap" style={{ margin: '0.5rem 0' }}>
                    {t.cheatsheet.clues?.map((c) => (
                      <span key={c} className="badge badge-accent mono">
                        {c}
                      </span>
                    ))}
                  </div>
                  {showTemplates && t.cheatsheet.template && <CodeBlock code={t.cheatsheet.template} copy={false} />}
                  <div className="small mono" style={{ color: 'var(--accent)' }}>
                    {t.cheatsheet.complexity}
                  </div>
                  <div className="small muted" style={{ marginTop: '0.35rem' }}>
                    <strong>Avoid:</strong> {t.cheatsheet.mistakes?.join('; ')}
                  </div>
                  <div className="small" style={{ marginTop: '0.35rem' }}>
                    <strong>JS:</strong> {t.cheatsheet.jsTools?.join(', ')}
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
