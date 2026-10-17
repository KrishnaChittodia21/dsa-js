import { useState } from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { stages } from '../content/index.js';
import SheetSection from '../components/SheetSection.jsx';
import { sectionByNum } from '../content/guides/index.js';

export default function CheatSheetPage() {
  const [showTemplates, setShowTemplates] = useState(true);
  return (
    <div className="page page-wide cs ink-in">
      <header className="cs-head">
        <div className="cs-title">
          <span className="eyebrow">One sheet · every pattern</span>
          <h1>The cheat sheet</h1>
        </div>
        <p className="cs-lede">When to use each pattern, the words that give it away, its template and its cost — small enough to print and pin above the desk.</p>
        <div className="cs-tools">
          <label className="cs-check">
            <input type="checkbox" checked={showTemplates} onChange={(e) => setShowTemplates(e.target.checked)} /> Include templates
          </label>
          <button type="button" className="btn btn-sm" onClick={() => window.print()}>
            Print the sheet
          </button>
        </div>
      </header>

      <aside className="rf-note cs-note">
        <span className="eyebrow">Spotting the pattern is half the problem</span>
        <p>
          The <Link to="/finder">pattern finder</Link> walks you there with a few questions, a keyword lookup, common mix-ups and a constraints → complexity guide. Each topic's Cheat sheet tab adds its own recognition tree and tricks.
        </p>
      </aside>

      <div className="cs-rules">
        <SheetSection section={sectionByNum(58)} collapsible defaultOpen={false} />
        <SheetSection section={sectionByNum(59)} collapsible defaultOpen={false} />
      </div>

      {stages.map((s, si) => (
        <section key={s.id} className="cs-stage" aria-labelledby={`cs-${s.id}`}>
          <h2 id={`cs-${s.id}`} className="cs-stage-h">
            <span className="folio">Part {si + 1}</span> {s.title}
          </h2>
          <div className="cs-cols">
            {s.topics
              .filter((t) => t.cheatsheet)
              .map((t) => (
                <article key={t.id} className="cs-entry">
                  <h3>
                    <Link to={`/topic/${t.id}?tab=cheatsheet`}>{t.title}</Link>
                    <span className="cs-cx mono">{t.cheatsheet.complexity}</span>
                  </h3>
                  <p>
                    <span className="cs-k">Use when</span> {t.cheatsheet.whenToUse?.join('; ')}
                  </p>
                  {t.cheatsheet.clues?.length > 0 && (
                    <p className="cs-clues">
                      <span className="cs-k">Clues</span> {t.cheatsheet.clues.map((c) => `“${c}”`).join('  ')}
                    </p>
                  )}
                  {showTemplates && t.cheatsheet.template && <CodeBlock code={t.cheatsheet.template} copy={false} />}
                  <p className="cs-avoid">
                    <span className="cs-k">Avoid</span> {t.cheatsheet.mistakes?.join('; ')}
                  </p>
                  <p>
                    <span className="cs-k">JS</span> <span className="mono">{t.cheatsheet.jsTools?.join(', ')}</span>
                  </p>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
