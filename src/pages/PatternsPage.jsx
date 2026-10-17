import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { patternStats } from '../state/selectors.js';
import { topics } from '../content/index.js';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';

const DIFF_MARK = { Easy: 'E', Medium: 'M', Hard: 'H' };
const slug = (s) => `cat-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

function PatternDetails({ summary, progress }) {
  const { data, loading } = useTopicContent(summary.topicId);
  if (loading)
    return (
      <div className="pi-body skeleton" aria-label="Loading the entry">
        <span />
        <span />
        <span />
      </div>
    );
  const full = data?.patterns?.find((p) => p.id === summary.id);
  return <PatternBody pattern={{ ...summary, ...full }} stats={patternStats(summary, progress)} progress={progress} />;
}

function PatternEntry({ pattern, progress, open, onToggle }) {
  const st = patternStats(pattern, progress);
  const share = st.total ? Math.round((st.solved / st.total) * 100) : 0;
  const clues = (pattern.clues || []).slice(0, 3);
  return (
    <li className={`pi-entry ${open ? 'is-open' : ''}`} id={pattern.id}>
      <div className="pi-entry-main">
        <button type="button" className="pi-entry-head" onClick={onToggle} aria-expanded={open}>
          <span className="pi-entry-name">{pattern.name}</span>
          <span className="pi-dots" aria-hidden="true" />
          <span className="pi-entry-folio folio">
            {st.solved}/{st.total}
            <span className="sr-only"> solved</span>
          </span>
          <span className="pi-toggle" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
        <p className="pi-entry-sum">
          {pattern.summary}
          {hasVisual(pattern) && <span className="pi-tag">animated</span>}
        </p>
        <span className="pi-meter" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </span>
      </div>
      {clues.length > 0 && (
        <aside className="pi-clues" aria-label={`Clues for ${pattern.name}`}>
          <span className="eyebrow">Look for</span>
          <ul>
            {clues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </aside>
      )}
      {open && <PatternDetails summary={pattern} progress={progress} />}
    </li>
  );
}

function PatternBody({ pattern, stats: st, progress }) {
  const short = pattern.name.replace(/^.*?—\s*/, '');
  return (
    <div className="pi-body">
      {hasVisual(pattern) && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">Watch it run</h4>
          <PatternVisual pattern={pattern} />
        </section>
      )}
      {pattern.whyItExists && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">Why it exists</h4>
          <Markdown>{pattern.whyItExists}</Markdown>
        </section>
      )}
      <section className="pi-sec">
        <h4 className="eyebrow">Reach for it when</h4>
        <ul className="pi-ticks">
          {(pattern.whenToUse || []).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <section className="pi-sec">
        <h4 className="eyebrow">Leave it alone when</h4>
        <ul className="pi-crosses">
          {(pattern.whenNotToUse || []).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      {(pattern.clues || []).length > 0 && (
        <section className="pi-sec pi-sec-wide">
          <div className="recognition">
            <div className="recognition-title">Spotting it in an interview</div>
            <div className="recognition-body">
              <div className="recognition-look">
                <div className="recognition-k">Look for</div>
                <ul className="recognition-clues">
                  {pattern.clues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="recognition-arrow" aria-hidden="true">
                →
              </div>
              <div className="recognition-think">
                <div className="recognition-k">Think</div>
                <div className="recognition-conclusion">{short}</div>
              </div>
            </div>
          </div>
        </section>
      )}
      {pattern.template && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">The template</h4>
          <CodeBlock code={pattern.template} />
        </section>
      )}
      {pattern.variations?.length > 0 && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">Variations</h4>
          <dl className="pi-vars">
            {pattern.variations.map((v) => (
              <div key={v.name}>
                <dt>{v.name}</dt>
                <dd>
                  <Markdown>{v.description}</Markdown>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {pattern.evolution && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">How it grows harder</h4>
          <ol className="pi-evo">
            {['easy', 'medium', 'hard'].map((d) => (
              <li key={d} className={`pi-evo-${d}`}>
                <span className="pi-evo-mark" aria-hidden="true">
                  {d[0].toUpperCase()}
                </span>
                <span className="sr-only">{d}: </span>
                <Markdown>{pattern.evolution[d]}</Markdown>
              </li>
            ))}
          </ol>
        </section>
      )}
      {pattern.mistakes?.length > 0 && (
        <section className="pi-sec pi-sec-wide pi-mistakes">
          <h4 className="eyebrow">Where people slip</h4>
          <ul>
            {pattern.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}
      {st.questions.length > 0 && (
        <section className="pi-sec pi-sec-wide">
          <h4 className="eyebrow">Practise it on</h4>
          <ul className="pi-practice">
            {st.questions.map((q) => {
              const solved = progress.questions[q.id]?.status === 'solved';
              return (
                <li key={q.id}>
                  <span className={`pi-q-mark ${solved ? 'is-solved' : ''}`} aria-label={solved ? 'Solved' : 'Not solved yet'}>
                    {solved ? '✓' : '○'}
                  </span>
                  <Link to={`/topic/${q.topicId}/q/${q.id}`}>{q.title}</Link>
                  <span className={`rf-dm rf-dm-${q.difficulty.toLowerCase()}`} title={q.difficulty}>
                    <span aria-hidden="true">{DIFF_MARK[q.difficulty]}</span>
                    <span className="sr-only">{q.difficulty}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <div className="pi-sec pi-sec-wide">
        <Link to={`/topic/${pattern.topicId}`} className="btn btn-sm">
          Open the lesson →
        </Link>
      </div>
    </div>
  );
}

export default function PatternsPage() {
  const { progress } = useProgress();
  const location = useLocation();
  const [open, setOpen] = useState(() => new Set(location.hash ? [location.hash.slice(1)] : []));
  const [filter, setFilter] = useState('');
  const categories = useMemo(() => {
    const m = new Map();
    for (const t of topics) {
      if (!t.patterns.length) continue;
      if (!m.has(t.category)) m.set(t.category, []);
      m.get(t.category).push(t);
    }
    return [...m.entries()];
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      setOpen((s) => new Set([...s, id]));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [location.hash]);

  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const f = filter.toLowerCase();
  const matches = (p) => !f || p.name.toLowerCase().includes(f) || (p.clues || []).some((c) => c.toLowerCase().includes(f)) || (p.summary || '').toLowerCase().includes(f);

  const visible = categories.map(([cat, ts]) => [cat, ts.flatMap((t) => t.patterns).filter(matches)]).filter(([, ps]) => ps.length);
  const total = categories.reduce((n, [, ts]) => n + ts.reduce((m, t) => m + t.patterns.length, 0), 0);
  const shown = visible.reduce((n, [, ps]) => n + ps.length, 0);

  return (
    <div className="page page-wide pi ink-in">
      <header className="page-header pi-head">
        <div>
          <span className="eyebrow">Index of patterns · {total} entries</span>
          <h1>
            Patterns, <em>filed by clue</em>
          </h1>
          <p>Every problem in this course is one of these shapes in disguise. Open an entry for why it exists, the words that give it away, its template and how it grows harder.</p>
        </div>
        <label className="pi-search">
          <span className="eyebrow">Look up</span>
          <input className="input" placeholder="a name or a clue, e.g. “at most k”" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter patterns" />
        </label>
      </header>

      <div className="pi-layout">
        <nav className="pi-toc" aria-label="Pattern sections">
          <span className="eyebrow">Sections</span>
          <ol>
            {visible.map(([cat, ps], i) => (
              <li key={cat}>
                <a href={`#${slug(cat)}`}>
                  <span className="folio">§{i + 1}</span>
                  <span>{cat}</span>
                  <span className="folio">{ps.length}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="pi-main">
          {f && (
            <p className="pi-count folio" aria-live="polite">
              {shown} of {total} entries match “{filter}”
            </p>
          )}
          {visible.length === 0 && (
            <div className="rf-empty">
              <p>No pattern mentions “{filter}”. Try a word from the problem statement instead — “sorted”, “window”, “top k”.</p>
              <button type="button" className="btn btn-sm" onClick={() => setFilter('')}>
                Clear the search
              </button>
            </div>
          )}
          {visible.map(([cat, ps], i) => (
            <section key={cat} id={slug(cat)} className="pi-cat" aria-labelledby={`${slug(cat)}-h`}>
              <h2 className="pi-cat-h" id={`${slug(cat)}-h`}>
                <span className="folio">§{i + 1}</span> {cat}
              </h2>
              <ol className="pi-list">
                {ps.map((p) => (
                  <PatternEntry key={p.id} pattern={p} progress={progress} open={open.has(p.id) || !!f} onToggle={() => toggle(p.id)} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
