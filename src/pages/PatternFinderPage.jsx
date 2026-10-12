import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { Callout, Tabs } from '../components/ui/primitives.jsx';
import SheetSection from '../components/SheetSection.jsx';
import { FINDER, FINDER_TABS, KEYWORDS, GOLDEN_RULES, sectionByNum } from '../content/guides/index.js';
import { topicById } from '../content/index.js';

const LETTERS = 'ABCDEFGHIJ';

function Finder() {
  // path = [{ node, choice }] — the answers given so far.
  const [path, setPath] = useState([]);
  const nodeId = path.length ? FINDER[path[path.length - 1].node].options[path[path.length - 1].choice].next : 'start';
  const last = path[path.length - 1];
  const result = last && FINDER[last.node].options[last.choice].result;
  const node = !result && FINDER[nodeId];

  const choose = (i) => setPath([...path, { node: nodeId, choice: i }]);
  const back = () => setPath(path.slice(0, -1));

  return (
    <div className="finder">
      <div>
        {path.length > 0 && (
          <div className="finder-path small">
            {path.map((p, i) => (
              <button key={i} type="button" className="chip" onClick={() => setPath(path.slice(0, i))} title="Go back to this question">
                {FINDER[p.node].options[p.choice].label}
              </button>
            ))}
          </div>
        )}

        {node && (
          <div className="card">
            <div className="small muted">Question {path.length + 1}</div>
            <h2 className="finder-q">{node.q}</h2>
            {node.hint && <div className="small muted">{node.hint}</div>}
            <div className="finder-options" role="list">
              {node.options.map((o, i) => (
                <button key={o.label} type="button" className="option" onClick={() => choose(i)}>
                  <span className="option-letter">{LETTERS[i]}</span>
                  <span className="option-text">{o.label}</span>
                  <Icon name={o.result ? 'target' : 'chevronRight'} size={15} />
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="finder-result">
            <div className="small muted">Likely pattern</div>
            <div className="finder-result-pattern">{result.pattern}</div>
            <p style={{ margin: '0 0 0.5rem' }}>{result.why}</p>
            <div className="small">
              Typical complexity: <span className="mono">{result.complexity}</span>
            </div>
            <div className="row-wrap" style={{ marginTop: '1rem' }}>
              <Link to={`/topic/${result.topic}`} className="btn btn-primary">
                Learn: {topicById[result.topic].title}
              </Link>
              <Link to={`/topic/${result.topic}?tab=visualize`} className="btn">
                <Icon name="play" size={14} /> Visualize
              </Link>
              <Link to={`/topic/${result.topic}?tab=practice`} className="btn">
                Practice
              </Link>
              {(result.also || []).map((t) => (
                <Link key={t} to={`/topic/${t}`} className="btn btn-ghost btn-sm">
                  also: {topicById[t].title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: '1rem' }}>
          {path.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={back}>
              <Icon name="chevronLeft" size={14} /> Back
            </button>
          )}
          {path.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPath([])}>
              <Icon name="rotate" size={14} /> Start over
            </button>
          )}
        </div>
      </div>
      <aside className="stack">
        <Callout variant="insight" title="Think property, not problem">
          <span className="small">
            Don't ask "which problem have I seen like this?" — ask "what <strong>property</strong> does this input have?" Property → pattern → data structure → algorithm → complexity.
          </span>
        </Callout>
        <div className="card">
          <h3>The 30-second routine</h3>
          <ol className="small thought-list">
            <li>Identify the data structure.</li>
            <li>Spot keywords (sorted, contiguous, top K…).</li>
            <li>Ask about constraints (n, negatives, duplicates).</li>
            <li>Name the likely pattern.</li>
            <li>Ask "can I do O(n)?" — sorting, hash map, two pointers, window, prefix sum, heap, binary search, DP, BFS/DFS, DSU.</li>
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
    <div className="stack">
      <input className="input" placeholder='Type a word from the problem, e.g. "subarray", "prefix", "nearest"' value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter keywords" style={{ maxWidth: 520 }} autoFocus />
      <div className="kw-list">
        {rows.map(([w, p, topics]) => (
          <div key={w} className="kw">
            <span className="kw-word">"{w}"</span>
            <span className="small">→ {p}</span>
            <span className="row-wrap small">
              {topics.map((t) => (
                <Link key={t} to={`/topic/${t}`}>
                  {topicById[t].title}
                </Link>
              ))}
            </span>
          </div>
        ))}
        {rows.length === 0 && <div className="muted small">No keyword matches “{q}”. Try the decision-tree wizard instead.</div>}
      </div>
    </div>
  );
}

function GoldenRules() {
  return (
    <div className="card">
      <h3>Golden rules — each links to its topic</h3>
      <div className="table-wrap">
        <table>
          <tbody>
            {GOLDEN_RULES.map(([signal, pattern, topic], i) => (
              <tr key={i}>
                <td className="mono small faint">{i + 1}</td>
                <td className="small">{signal}</td>
                <td className="small" style={{ fontWeight: 650 }}>
                  → {pattern}
                </td>
                <td className="small">
                  <Link to={`/topic/${topic}`}>{topicById[topic].title}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PatternFinderPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'finder';
  const current = useMemo(() => FINDER_TABS.find((t) => t.id === tab) || FINDER_TABS[0], [tab]);
  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Pattern Finder</h1>
          <p>Recognise the pattern from the problem's properties. Built from your pattern-recognition cheat sheet — every answer links to the lesson, animation and practice set.</p>
        </div>
      </div>
      <Tabs
        label="Pattern finder sections"
        active={current.id}
        onChange={(id) => setParams(id === 'finder' ? {} : { tab: id })}
        tabs={FINDER_TABS.map((t) => ({ id: t.id, label: t.label }))}
      />
      {current.id === 'finder' && <Finder />}
      {current.id === 'keywords' && <Keywords initial={params.get('q')} />}
      {current.id === 'rules' && <GoldenRules />}
      {current.sections && current.id !== 'keywords' && (
        <div className="sheet-grid" style={{ marginTop: current.id === 'rules' ? '1rem' : 0 }}>
          {current.sections.map((n) => (
            <SheetSection key={n} section={sectionByNum(n)} />
          ))}
        </div>
      )}
      {current.id === 'keywords' && (
        <details className="details" style={{ marginTop: '1.5rem' }}>
          <summary>The original "When you see these words…" sheet</summary>
          <SheetSection section={sectionByNum(52)} />
        </details>
      )}
    </div>
  );
}
