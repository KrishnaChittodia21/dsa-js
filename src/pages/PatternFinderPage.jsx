import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import SheetSection from '../components/SheetSection.jsx';
import BigOChip from '../components/BigOChip.jsx';
import { FINDER, FINDER_TABS, KEYWORDS, GOLDEN_RULES, sectionByNum } from '../content/guides/index.js';
import { topicById } from '../content/index.js';

const LETTERS = 'ABCDEFGHIJ';

/** Walk the decision tree along the answers given so far. */
function walk(path) {
  const nodes = [];
  let id = 'start';
  let result = null;
  for (let d = 0; ; d++) {
    const node = FINDER[id];
    const ch = path[d];
    nodes.push({ id, node, ch });
    if (ch === undefined) break;
    const o = node.options[ch];
    if (o.result) {
      result = o.result;
      break;
    }
    id = o.next;
  }
  return { nodes, result };
}

/** The glowing wires between the chosen option and the next question (drawn from measured DOM boxes). */
function useWires(treeRef, colsRef, deps) {
  const [paths, setPaths] = useState([]);
  useLayoutEffect(() => {
    const tree = treeRef.current;
    const cols = colsRef.current;
    if (!tree || !cols) return undefined;
    const draw = () => {
      const tb = tree.getBoundingClientRect();
      const sx = tree.scrollLeft;
      const out = [];
      const els = [...cols.children];
      els.forEach((col, d) => {
        const next = els[d + 1];
        col.querySelectorAll('.pf-opt').forEach((o) => {
          const r = o.getBoundingClientRect();
          const x1 = r.right - tb.left + sx;
          const y1 = r.top + r.height / 2 - tb.top;
          if (o.classList.contains('pf-opt--on') && next) {
            const t = (next.querySelector('.pf-qh') || next.querySelector('.pf-res')).getBoundingClientRect();
            const x2 = t.left - tb.left + sx;
            const y2 = t.top + Math.min(26, t.height / 2) - tb.top;
            if (x2 > x1) {
              const mx = (x1 + x2) / 2;
              out.push({ on: true, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` });
            }
          } else if (!col.classList.contains('pf-qn--past')) {
            out.push({ on: false, d: `M${x1},${y1} h12` });
          }
        });
      });
      setPaths(out);
    };
    draw();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    ro?.observe(tree);
    ro?.observe(cols);
    document.fonts?.ready.then(draw).catch(() => {});
    // keep the live question in view when the tree is wider than its box
    tree.scrollTo?.({ left: tree.scrollWidth, behavior: 'smooth' });
    // phones: the tree stacks vertically — bring the newest question / result into view
    if (cols.children.length > 1 && window.matchMedia?.('(max-width: 720px)').matches) cols.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return paths;
}

function Finder() {
  const [path, setPath] = useState([]);
  const { nodes, result } = useMemo(() => walk(path), [path]);
  const treeRef = useRef(null);
  const colsRef = useRef(null);
  const wires = useWires(treeRef, colsRef, [path]);
  const choose = (d, i) => setPath([...path.slice(0, d), i]);
  const answered = nodes.filter((n) => n.ch !== undefined);

  return (
    <div className="pf-fd">
      <div className="pf-main">
        <div className="pf-crumbs" aria-label="Your answers">
          {answered.length === 0 && <span className="mono pf-crumb-hint">Pick the input shape to start ↓</span>}
          {answered.map(({ node, ch }, d) => (
            <span key={d} className="pf-crumb">
              {d > 0 && <span className="pf-sep">→</span>}
              <button type="button" className="chip" onClick={() => setPath(path.slice(0, d))} title="Go back to this question">
                {node.options[ch].label}
              </button>
            </span>
          ))}
        </div>
        <div className="pf-tree" ref={treeRef}>
          <svg className="pf-wires" aria-hidden="true" width="100%" height="100%">
            <defs>
              <linearGradient id="pfBeam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8EE6FF" />
                <stop offset=".55" stopColor="#7B5CFF" />
                <stop offset="1" stopColor="#FF6B2C" />
              </linearGradient>
            </defs>
            {wires.map((w, i) => (
              <path key={`${path.join('.')}-${i}`} className={w.on ? 'pf-w-on' : 'pf-w-off'} d={w.d} />
            ))}
          </svg>
          <div className="pf-cols" ref={colsRef} style={{ '--n': nodes.length + (result ? 1 : 0) }}>
            {nodes.map(({ node, ch }, d) => (
              <div key={`${d}-${node.q}`} className={`pf-qn ${ch === undefined ? 'pf-qn--live' : 'pf-qn--past'}`}>
                <div className="pf-qh">
                  <span>
                    Q{d + 1}
                    {ch === undefined ? ' · answer' : ''}
                  </span>
                  <b>{node.q}</b>
                  {ch === undefined && node.hint && <small>{node.hint}</small>}
                </div>
                {ch === undefined ? (
                  node.options.map((o, i) => (
                    <button key={o.label} type="button" className="pf-opt" onClick={() => choose(d, i)}>
                      <span className="pf-lt">{LETTERS[i]}</span>
                      <span>{o.label}</span>
                      {o.result && <i className="pf-end" title="leads to a pattern" />}
                    </button>
                  ))
                ) : (
                  <>
                    <button type="button" className="pf-opt pf-opt--on" onClick={() => setPath(path.slice(0, d))} title="Change this answer">
                      <span className="pf-lt">{LETTERS[ch]}</span>
                      <span>{node.options[ch].label}</span>
                    </button>
                    <div className="pf-rest">
                      <span>other branches</span>
                      {node.options.map((o, i) =>
                        i === ch ? null : (
                          <button key={o.label} type="button" className="pf-rb" title={o.label} aria-label={`Switch to: ${o.label}`} onClick={() => choose(d, i)}>
                            {LETTERS[i]}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {result && (
              <div className="pf-qn">
                <div className="pf-res" aria-live="polite">
                  <span className="eyebrow">Likely pattern</span>
                  <h4>{result.pattern}</h4>
                  <p>{result.why}</p>
                  <BigOChip value={result.complexity} />
                  {(result.also || []).length > 0 && (
                    <div className="pf-also">
                      also:{' '}
                      {result.also.map((t, i) => (
                        <span key={t}>
                          {i > 0 && ', '}
                          <Link to={`/topic/${t}`}>{topicById[t]?.title || t}</Link>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pf-res-acts">
                    <Link to={`/topic/${result.topic}`} className="btn btn--chrome btn--sm">
                      Learn: {topicById[result.topic].title} <Icon name="arrowRight" size={15} />
                    </Link>
                    <Link to={`/topic/${result.topic}?tab=visualize`} className="btn btn--ghost btn--sm">
                      <Icon name="play" size={15} /> Visualize
                    </Link>
                    <Link to={`/topic/${result.topic}?tab=practice`} className="btn btn--ghost btn--sm">
                      Practice
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="pf-kw">
          <div className="row row--between">
            <span className="eyebrow">When you see these words…</span>
            <Link className="tile-link" to="/finder?tab=keywords">
              All {KEYWORDS.length} keywords <Icon name="arrowRight" size={13} />
            </Link>
          </div>
          <div className="pf-kw-grid">
            {KEYWORDS.slice(0, 8).map(([w, p, ts]) => (
              <Link key={w} to={`/topic/${ts[0]}`} className="pf-kwi">
                <span>“{w}”</span>
                <b>{p}</b>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <aside className="pf-side">
        <div className="tile tile--raised">
          <div className="tile-head" style={{ marginBottom: 12 }}>
            <span className="eyebrow">Controls</span>
            <span className="tag">
              {answered.length} answer{answered.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="pf-side-p">Click any answer, chip or lettered branch to rewind the tree to that question. Every result links to its lesson, animation and practice set.</p>
          <div className="row row--wrap" style={{ marginTop: 14, gap: 8 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPath(path.slice(0, -1))} disabled={!path.length}>
              <Icon name="chevronLeft" size={15} /> Back
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPath([])} disabled={!path.length}>
              <Icon name="rotate" size={15} /> Start over
            </button>
          </div>
        </div>
        <div className="pf-insight">
          <b>Think property, not problem.</b> Don’t ask “which problem have I seen like this?” — ask what <b>property</b> the input has. Property → pattern → data structure → algorithm → complexity.
        </div>
        <div className="tile">
          <div className="tile-head" style={{ marginBottom: 12 }}>
            <span className="eyebrow">The 30-second routine</span>
          </div>
          <ol className="pf-routine">
            <li>Identify the data structure.</li>
            <li>Spot keywords (sorted, contiguous, top K…).</li>
            <li>Ask about constraints (n, negatives, duplicates).</li>
            <li>Name the likely pattern.</li>
            <li>Ask “can I do O(n)?” — sorting, hash map, two pointers, window, prefix sum, heap, binary search, DP, BFS/DFS, DSU.</li>
            <li>State complexity before coding.</li>
            <li>Code, then test edge cases.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function Keywords({ initial }) {
  const [q, setQ] = useState(initial || '');
  const f = q.toLowerCase().trim();
  const rows = KEYWORDS.filter(([w, p]) => !f || w.toLowerCase().includes(f) || p.toLowerCase().includes(f));
  return (
    <div className="pf-pane">
      <label className="search-in pf-search">
        <Icon name="search" size={17} />
        <input className="input" type="search" placeholder='Type a word from the problem, e.g. "subarray", "prefix", "nearest"' value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter keywords" autoFocus />
      </label>
      <p className="pf-count mono">
        {rows.length} / {KEYWORDS.length} keywords
      </p>
      <div className="pf-kw-grid pf-kw-grid--all">
        {rows.map(([w, p, ts]) => (
          <div key={w} className="pf-kwi">
            <span>“{w}”</span>
            <b>{p}</b>
            <span className="pf-kwi-links">
              {ts.map((t) => (
                <Link key={t} to={`/topic/${t}`}>
                  {topicById[t].title}
                </Link>
              ))}
            </span>
          </div>
        ))}
        {rows.length === 0 && <div className="pf-empty">No keyword matches “{q}”. Try the decision tree instead.</div>}
      </div>
    </div>
  );
}

function GoldenRules() {
  return (
    <div className="tile pf-rules">
      <div className="tile-head">
        <div>
          <span className="eyebrow">
            <i className="pip" />
            Golden rules · {GOLDEN_RULES.length}
          </span>
          <h2 className="h2" style={{ marginTop: 12 }}>
            Signal → pattern
          </h2>
        </div>
      </div>
      <ol className="pf-rule-list">
        {GOLDEN_RULES.map(([signal, pattern, topic], i) => (
          <li key={i} className="pf-rule">
            <span className="pf-rule-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="pf-rule-s">{signal}</span>
            <b className="pf-rule-p">→ {pattern}</b>
            <Link className="pf-rule-t" to={`/topic/${topic}`}>
              {topicById[topic].title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PatternFinderPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'finder';
  const current = useMemo(() => FINDER_TABS.find((t) => t.id === tab) || FINDER_TABS[0], [tab]);
  return (
    <div className="page pf-page">
      <section className="tile tile--glow pf-shell rise">
        <div className="pf-head">
          <div>
            <span className="eyebrow">
              <i className="pip pip--uv" />
              Pattern Finder · a decision tree built from your recognition sheet
            </span>
            <h1 className="h1 pf-title">Name the pattern before you code</h1>
          </div>
          <Link to="/patterns" className="tile-link">
            Pattern library <Icon name="arrowRight" size={13} />
          </Link>
        </div>
        <div className="pf-tabs" role="tablist" aria-label="Pattern finder sections">
          {FINDER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current.id === t.id}
              className="pf-tab"
              onClick={() => setParams(t.id === 'finder' ? {} : { tab: t.id })}
            >
              {t.label}
              {t.id === 'keywords' && <b>{KEYWORDS.length}</b>}
              {t.id === 'rules' && <b>{GOLDEN_RULES.length}</b>}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={current.label}>
          {current.id === 'finder' && <Finder />}
          {current.id === 'keywords' && <Keywords initial={params.get('q')} />}
          {current.id === 'rules' && <GoldenRules />}
          {current.sections && current.id !== 'keywords' && (
            <div className="sheet-grid pf-sheets">
              {current.sections.map((n) => (
                <SheetSection key={n} section={sectionByNum(n)} />
              ))}
            </div>
          )}
          {current.id === 'keywords' && (
            <details className="details pf-orig">
              <summary>The original “When you see these words…” sheet</summary>
              <SheetSection section={sectionByNum(52)} />
            </details>
          )}
        </div>
      </section>
    </div>
  );
}
