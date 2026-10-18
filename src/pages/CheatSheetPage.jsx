import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import { questionById, stages } from '../content/index.js';
import SheetSection from '../components/SheetSection.jsx';
import BigOChip, { bigoKey, firstBigO, useQuestionComplexities } from '../components/BigOChip.jsx';
import { sectionByNum } from '../content/guides/index.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { WorkbenchHeader } from './ToolkitPage.jsx';

// Constraint → complexity reference at n = 10⁴ (log scale: 1 cube ≈ ×10) and the largest n that fits ~1 s.
const TOWERS = [
  { k: '1', label: 'O(1)', h: 1, c1: '#CFF6FF', c2: '#45B9DD', ops: '1', unit: 'op', ex: 'arr[i], Map.get, push / pop', fit: 'any n' },
  { k: 'logn', label: 'O(log n)', h: 2, c1: '#C2D3FF', c2: '#4A6BE0', ops: '14', unit: 'ops', ex: 'binary search, heap push / pop', fit: 'any n' },
  { k: 'n', label: 'O(n)', h: 5, c1: '#C9BBFF', c2: '#5B3FE0', ops: '10⁴', unit: 'ops', ex: 'one pass, two pointers, sliding window', fit: 'n ≤ 10⁸' },
  { k: 'nlogn', label: 'O(n log n)', h: 6, c1: '#E6B8FF', c2: '#8A2BC0', ops: '1.3·10⁵', unit: 'ops', ex: 'sort, heap of n, divide & conquer', fit: 'n ≤ 10⁶' },
  { k: 'n2', label: 'O(n²)', h: 9, c1: '#FF9CC6', c2: '#C0125F', ops: '10⁸', unit: 'ops', ex: 'all pairs, 2D DP, nested loops', fit: 'n ≤ 10⁴' },
  { k: '2n', label: 'O(2ⁿ)', h: 11, c1: '#FFB07A', c2: '#B93C0B', ops: '10³⁰¹⁰', unit: 'ops', ex: 'subsets, plain recursion on choices', fit: 'n ≤ 25' },
  { k: 'nf', label: 'O(n!)', h: 11, c1: '#FF8A70', c2: '#8A1410', ops: '10³⁵⁶⁵⁹', unit: 'ops', ex: 'permutations, brute-force orderings', fit: 'n ≤ 11' },
];

function BigOHero() {
  const { progress } = useProgress();
  const solved = Object.entries(progress.questions)
    .filter(([id, s]) => s.status === 'solved' && questionById[id])
    .map(([id]) => id)
    .sort();
  const { map } = useQuestionComplexities(solved);
  const counts = useMemo(() => {
    const m = {};
    for (const id of solved) if (map[id]?.time) m[bigoKey(map[id].time)] = (m[bigoKey(map[id].time)] || 0) + 1;
    return m;
  }, [map, solved.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const top = TOWERS.filter((t) => counts[t.k]).sort((a, b) => counts[b.k] - counts[a.k]).slice(0, 3);
  return (
    <section className="tile tile--glow cs-hero rise" style={{ '--i': 1 }} aria-labelledby="cs-bo-t">
      <div className="cs-bo-top">
        <div>
          <span className="eyebrow">
            <i className="pip pip--ice" />
            Constraint → complexity · ~10⁸ simple ops per second
          </span>
          <h2 id="cs-bo-t" className="h1 cs-bo-h">
            Read <span className="t-ice">n</span>, pick the Big-O.
          </h2>
          <p>
            Each tower is the work at <span className="mono">n = 10⁴</span> (log scale, 1 cube ≈ ×10). Under it: the largest n that still runs in about a second — the fastest way to rule an approach in or out before you write a line.
          </p>
        </div>
        {top.length > 0 && (
          <div className="cs-mine">
            <span className="small">Your {solved.length} solved (optimal time):</span>
            {top.map((t) => (
              <BigOChip key={t.k} value={t.label} label={`${counts[t.k]} × ${t.label}`} sm />
            ))}
          </div>
        )}
      </div>
      <div className="cs-towers-scroll">
        <div className="cs-towers">
          <span className="cs-budget" aria-hidden="true">
            <span>≈ 1 s budget · 10⁸ ops</span>
          </span>
          {TOWERS.map((t) => (
            <div key={t.k} className="cs-tw">
              <div className="cs-tw-stack" aria-hidden="true">
                <div className="vox" style={{ '--h': t.h, '--c1': t.c1, '--c2': t.c2 }} />
              </div>
              <div className="cs-cap">
                <BigOChip value={t.label} />
                <span className="cs-ops">
                  {t.ops}
                  <small>{t.unit}</small>
                </span>
                <span className="cs-ex">{t.ex}</span>
                <span className="cs-fit mono">{t.fit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cs-bo-foot">
        <span>
          Patterns exist to move you left on this scale: a sliding window turns <b>O(n²)</b> pair checks into <b>O(n)</b>.
        </span>
        <Link className="tile-link" to="/finder">
          Pattern Finder <Icon name="arrowRight" size={13} />
        </Link>
      </div>
    </section>
  );
}

export default function CheatSheetPage() {
  const [showTemplates, setShowTemplates] = useState(true);
  return (
    <div className="page wb-page cs-page">
      <WorkbenchHeader title="Cheat sheet" lead="Every pattern on one page: when to use it, the clues that give it away, its template and complexity. Print it, or keep it open mid-problem.">
        <div className="cs-tools">
          <button type="button" className={`toggle`} role="switch" aria-checked={showTemplates} aria-label="Show templates" onClick={() => setShowTemplates((v) => !v)} />
          <span className="small">Show templates</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <Icon name="file" size={15} /> Print
          </button>
        </div>
      </WorkbenchHeader>

      <BigOHero />

      <div className="cs-coach">
        <Icon name="target" size={18} />
        <p>
          <b>Recognising the pattern is half the problem.</b> The <Link to="/finder">Pattern Finder</Link> has the decision tree, keyword → pattern lookup, common confusions and the constraint → complexity guide; each topic’s Cheatsheet tab adds its recognition tree plus tricks & tips.
        </p>
      </div>

      <div className="sheet-grid cs-sheets">
        <SheetSection section={sectionByNum(58)} collapsible defaultOpen={false} />
        <SheetSection section={sectionByNum(59)} collapsible defaultOpen={false} />
      </div>

      {stages.map((s, si) => {
        const list = s.topics.filter((t) => t.cheatsheet);
        if (!list.length) return null;
        return (
          <section key={s.id} className="cs-stage">
            <div className="divider-label">
              S{String(si + 1).padStart(2, '0')} · {s.title}
            </div>
            <div className="cheat-grid cs-grid">
              {list.map((t) => (
                <article key={t.id} className="tile cheat-card cs-card">
                  <div className="cs-card-head">
                    <h3>
                      <Link to={`/topic/${t.id}?tab=cheatsheet`}>{t.title}</Link>
                    </h3>
                  </div>
                  {t.cheatsheet.whenToUse?.length > 0 && (
                    <p className="cs-use">
                      <b>Use when:</b> {t.cheatsheet.whenToUse.join('; ')}
                    </p>
                  )}
                  {t.cheatsheet.clues?.length > 0 && (
                    <div className="cs-sig">
                      {t.cheatsheet.clues.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  )}
                  {t.cheatsheet.complexity && (
                    <div className="cs-cx">
                      {!/</.test(t.cheatsheet.complexity) && <BigOChip value={t.cheatsheet.complexity} label={firstBigO(t.cheatsheet.complexity)} sm />}
                      <span>{t.cheatsheet.complexity}</span>
                    </div>
                  )}
                  {showTemplates && t.cheatsheet.template && <CodeBlock code={t.cheatsheet.template} copy={false} title={`template · ${t.id}`} />}
                  {t.cheatsheet.mistakes?.length > 0 && (
                    <p className="cs-avoid">
                      <b>Avoid:</b> {t.cheatsheet.mistakes.join('; ')}
                    </p>
                  )}
                  {t.cheatsheet.jsTools?.length > 0 && (
                    <div className="cs-js">
                      <span className="cs-lbl">JS</span>
                      {t.cheatsheet.jsTools.map((j) => (
                        <code key={j}>{j}</code>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
