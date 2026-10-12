import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import { ProgressBar } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { patternStats } from '../state/selectors.js';
import { topics } from '../content/index.js';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';

function PatternDetails({ summary, progress }) {
  const { data, loading } = useTopicContent(summary.topicId);
  if (loading) return <div className="pattern-body small muted">Loading…</div>;
  const full = data?.patterns?.find((p) => p.id === summary.id);
  return <PatternBody pattern={{ ...summary, ...full }} stats={patternStats(summary, progress)} progress={progress} />;
}

function PatternCard({ pattern, progress, open, onToggle }) {
  const st = patternStats(pattern, progress);
  return (
    <div className="card pattern-card" id={pattern.id}>
      <button type="button" className="pattern-head" onClick={onToggle} aria-expanded={open}>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontWeight: 650 }}>
            {pattern.name} {hasVisual(pattern) && <span className="badge badge-accent" title="Has an animation">▶ animated</span>}
          </div>
          <div className="small muted">{pattern.summary}</div>
        </div>
        <div style={{ width: 110 }}>
          <div className="small mono muted" style={{ textAlign: 'right' }}>
            {st.solved}/{st.total}
          </div>
          <ProgressBar value={st.solved} max={st.total || 1} size="sm" label={`${pattern.name} progress`} />
        </div>
        <Icon name="chevronDown" size={16} />
      </button>
      {open && <PatternDetails summary={pattern} progress={progress} />}
    </div>
  );
}

function PatternBody({ pattern, stats: st, progress }) {
  return (
    <>
      {(
        <div className="pattern-body">
          {hasVisual(pattern) && (
            <section>
              <h4>See it in motion</h4>
              <PatternVisual pattern={pattern} />
            </section>
          )}
          {pattern.whyItExists && (
            <section>
              <h4>Why does it exist?</h4>
              <Markdown>{pattern.whyItExists}</Markdown>
            </section>
          )}
          <div className="grid-2">
            <section>
              <h4>When to use it</h4>
              <ul className="small">
                {(pattern.whenToUse || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>When NOT to use it</h4>
              <ul className="small">
                {(pattern.whenNotToUse || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          </div>
          <section className="recognition" style={{ margin: '0.5rem 0 1rem' }}>
            <div className="recognition-title">
              <Icon name="target" size={16} /> How to recognize it in an interview
            </div>
            <div className="recognition-body">
              <ul className="recognition-clues">
                {(pattern.clues || []).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="recognition-arrow">
                <Icon name="arrowRight" size={22} />
              </div>
              <div className="recognition-conclusion">Think {pattern.name.replace(/^.*?—\s*/, '')}</div>
            </div>
          </section>
          {pattern.template && (
            <section>
              <h4>General template</h4>
              <CodeBlock code={pattern.template} />
            </section>
          )}
          {pattern.variations?.length > 0 && (
            <section>
              <h4>Variations</h4>
              <div className="grid-2">
                {pattern.variations.map((v) => (
                  <div key={v.name} className="card card-tight">
                    <div style={{ fontWeight: 600 }}>{v.name}</div>
                    <Markdown className="small muted">{v.description}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          )}
          {pattern.evolution && (
            <section>
              <h4>How it evolves: Easy → Medium → Hard</h4>
              <div className="evolution">
                {['easy', 'medium', 'hard'].map((d) => (
                  <div key={d} className={`evolution-step evo-${d}`}>
                    <div className={`badge badge-${d}`}>{d[0].toUpperCase() + d.slice(1)}</div>
                    <Markdown className="small">{pattern.evolution[d]}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          )}
          {pattern.mistakes?.length > 0 && (
            <section>
              <h4>Common mistakes</h4>
              <ul className="small">
                {pattern.mistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
          )}
          {st.questions.length > 0 && (
            <section>
              <h4>Practice this pattern</h4>
              <div className="row-wrap">
                {st.questions.map((q) => (
                  <Link key={q.id} to={`/topic/${q.topicId}/q/${q.id}`} className={`badge badge-${q.difficulty.toLowerCase()}`}>
                    {progress.questions[q.id]?.status === 'solved' ? '✓ ' : ''}
                    {q.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <div style={{ marginTop: '0.75rem' }}>
            <Link to={`/topic/${pattern.topicId}`} className="btn btn-sm">
              Open the lesson <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        </div>
      )}
    </>
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Patterns</h1>
          <p>The curriculum is organised around patterns. Each card shows why the pattern exists, the clues that reveal it, its template and how problems evolve.</p>
        </div>
        <span className="spacer" />
        <input className="input" placeholder="Filter by name or clue (e.g. “at most k”)" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minWidth: 280 }} aria-label="Filter patterns" />
      </div>
      {categories.map(([cat, ts]) => {
        const ps = ts.flatMap((t) => t.patterns).filter(matches);
        if (!ps.length) return null;
        return (
          <section key={cat} style={{ marginBottom: '2rem' }}>
            <div className="divider-label">{cat}</div>
            <div className="stack-sm">
              {ps.map((p) => (
                <PatternCard key={p.id} pattern={p} progress={progress} open={open.has(p.id) || !!f} onToggle={() => toggle(p.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
