import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs } from '../components/ui/primitives.jsx';
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
    <div className="fg">
      <div className="fg-key">
        {path.length > 0 && (
          <ol className="fg-trail" aria-label="Your answers so far">
            {path.map((p, i) => (
              <li key={i}>
                <button type="button" onClick={() => setPath(path.slice(0, i))} title="Go back to this question">
                  <span className="folio">{i + 1}</span>
                  <span className="fg-trail-q">{FINDER[p.node].q}</span>
                  <span className="fg-trail-a">{FINDER[p.node].options[p.choice].label}</span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {node && (
          <section className="fg-couplet" aria-live="polite">
            <span className="fg-couplet-num" aria-hidden="true">
              {path.length + 1}.
            </span>
            <div>
              <span className="eyebrow">Question {path.length + 1}</span>
              <h2 className="fg-q">{node.q}</h2>
              {node.hint && <p className="fg-hint">{node.hint}</p>}
              <div className="options fg-choices">
                {node.options.map((o, i) => (
                  <button key={o.label} type="button" className="option fg-choice" onClick={() => choose(i)}>
                    <span className="option-letter">{LETTERS[i]}</span>
                    <span className="option-text">{o.label}</span>
                    <span className="fg-choice-go">{o.result ? 'answer' : `go to ${path.length + 2}`}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {result && (
          <article className="fg-card" aria-live="polite">
            <div className="fg-card-top">
              <span className="eyebrow">Index card · Q {path.length}</span>
              <span className="fg-stamp">Likely match</span>
            </div>
            <h2 className="fg-card-pattern">{result.pattern}</h2>
            <p>{result.why}</p>
            <p className="fg-card-cx">
              <span className="eyebrow">Typical cost</span> <span className="mono">{result.complexity}</span>
            </p>
            <div className="fg-card-actions">
              <Link to={`/topic/${result.topic}`} className="btn btn-primary">
                Start the lesson: {topicById[result.topic].title}
              </Link>
              <Link to={`/topic/${result.topic}?tab=visualize`} className="btn">
                Watch it run
              </Link>
              <Link to={`/topic/${result.topic}?tab=practice`} className="btn">
                Open the practice set
              </Link>
            </div>
            {(result.also || []).length > 0 && (
              <p className="fg-card-also">
                <span className="eyebrow">See also</span>{' '}
                {result.also.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' · '}
                    <Link to={`/topic/${t}`}>{topicById[t].title}</Link>
                  </span>
                ))}
              </p>
            )}
          </article>
        )}

        {path.length > 0 && (
          <div className="fg-nav">
            <button type="button" className="rf-textbtn" onClick={back}>
              ← One step back
            </button>
            <button type="button" className="rf-textbtn" onClick={() => setPath([])}>
              Start the key again
            </button>
          </div>
        )}
      </div>

      <aside className="fg-margin">
        <div className="rf-note">
          <span className="eyebrow">Margin note</span>
          <p>
            Don't ask “which problem have I seen like this?” Ask “what <strong>property</strong> does this input have?” Property → pattern → data structure → algorithm → cost.
          </p>
        </div>
        <section className="fg-routine">
          <h3>The thirty-second routine</h3>
          <ol>
            <li>Name the data structure.</li>
            <li>Spot the keywords — sorted, contiguous, top K…</li>
            <li>Ask about constraints: n, negatives, duplicates.</li>
            <li>Name the likely pattern.</li>
            <li>Ask “can I do O(n)?” — sort, hash map, two pointers, window, prefix sum, heap, binary search, DP, BFS/DFS, DSU.</li>
            <li>Say the complexity out loud before you code.</li>
            <li>Code it, then try the edge cases.</li>
          </ol>
        </section>
      </aside>
    </div>
  );
}

function Keywords({ initial }) {
  const [q, setQ] = useState(initial || '');
  const f = q.toLowerCase().trim();
  const rows = KEYWORDS.filter(([w, p]) => !f || w.toLowerCase().includes(f) || p.toLowerCase().includes(f));
  return (
    <div className="fg-glossary">
      <label className="fg-glossary-search">
        <span className="eyebrow">A word from the problem</span>
        <input className="input" placeholder='e.g. "subarray", "prefix", "nearest"' value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter keywords" autoFocus />
      </label>
      <dl className="fg-terms">
        {rows.map(([w, p, topics]) => (
          <div key={w} className="fg-term">
            <dt>“{w}”</dt>
            <dd>
              <span className="fg-term-p">→ {p}</span>
              <span className="fg-term-links">
                {topics.map((t) => (
                  <Link key={t} to={`/topic/${t}`}>
                    {topicById[t].title}
                  </Link>
                ))}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {rows.length === 0 && <p className="rf-empty">No keyword matches “{q}”. The decision key on the first tab can usually get you there in four questions.</p>}
    </div>
  );
}

function GoldenRules() {
  return (
    <section className="fg-rules" aria-labelledby="fg-rules-h">
      <h3 id="fg-rules-h">Golden rules — each one points at its lesson</h3>
      <ol>
        {GOLDEN_RULES.map(([signal, pattern, topic], i) => (
          <li key={i}>
            <span className="folio">{String(i + 1).padStart(2, '0')}</span>
            <span className="fg-rule-sig">{signal}</span>
            <span className="fg-rule-p">→ {pattern}</span>
            <Link to={`/topic/${topic}`}>{topicById[topic].title}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PatternFinderPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'finder';
  const current = useMemo(() => FINDER_TABS.find((t) => t.id === tab) || FINDER_TABS[0], [tab]);
  return (
    <div className="page page-wide fg-page ink-in">
      <header className="page-header fg-head">
        <div>
          <span className="eyebrow">Field guide</span>
          <h1>
            What pattern <em>is this?</em>
          </h1>
          <p>Answer a few questions about the input, the way a botanist keys out a leaf. Every answer ends at a lesson, an animation and a practice set.</p>
        </div>
      </header>
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
        <div className="fg-sheets">
          {current.sections.map((n) => (
            <SheetSection key={n} section={sectionByNum(n)} />
          ))}
        </div>
      )}
      {current.id === 'keywords' && (
        <details className="fg-original">
          <summary>The original “When you see these words…” sheet</summary>
          <SheetSection section={sectionByNum(52)} />
        </details>
      )}
    </div>
  );
}
