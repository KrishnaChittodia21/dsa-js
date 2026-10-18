import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { activityTotals, patternStats, pct, recommendations, topicStatus } from '../state/selectors.js';
import { allPatterns, stages, topicById, topics } from '../content/index.js';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';
import { topicShort } from '../components/BigOChip.jsx';

const shortName = (name) => name.replace(/^.*?—\s*/, '');
const DIFF_LETTER = { Easy: 'E', Medium: 'M', Hard: 'H' };
const DIFF_CLS = { Easy: 't-easy', Medium: 't-med', Hard: 't-hard' };
const HEAT_LABEL = {
  h4: 'hot · ≥ 90% solved',
  h3: 'warm · ≥ 60% solved',
  h2: 'warming · ≥ 30% solved',
  h1: 'cold · started',
  cu: 'current pattern',
  pg: 'topic in progress · not practised yet',
  av: 'unlocked · untouched',
  lk: 'locked',
};

/** heat bucket of one pattern from real progress (solved share of its questions + topic state). */
function patternHeat(p, progress, statusOf, currentId) {
  if (p.id === currentId) return 'cu';
  const status = statusOf[p.topicId];
  if (status === 'locked') return 'lk';
  const st = patternStats(p, progress);
  if (st.total === 0) return status === 'completed' ? 'h3' : status === 'in-progress' ? 'pg' : 'av';
  if (st.solved > 0) {
    const f = st.solved / st.total;
    return f >= 0.9 ? 'h4' : f >= 0.6 ? 'h3' : f >= 0.3 ? 'h2' : 'h1';
  }
  return status === 'available' ? 'av' : 'pg';
}

function QuestionDot({ status }) {
  const cls = status === 'solved' ? 'pt-d--s' : status === 'attempted' ? 'pt-d--a' : 'pt-d--t';
  const label = status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'To do';
  return <i className={`pt-d ${cls}`} role="img" aria-label={label} title={label} />;
}

function Examples({ questions, progress, limit, showNumber = false }) {
  const list = limit ? questions.slice(0, limit) : questions;
  if (!list.length) return <p className="pt-none">No practice questions for this pattern yet.</p>;
  return (
    <div className="pt-exs">
      {list.map((q) => (
        <Link key={q.id} to={`/topic/${q.topicId}/q/${q.id}`} className="pt-ex">
          <QuestionDot status={progress.questions[q.id]?.status} />
          <span className="pt-ex-t">{q.title}</span>
          <span className={`pt-ex-d ${DIFF_CLS[q.difficulty]}`}>
            {DIFF_LETTER[q.difficulty]}
            {showNumber && q.source?.number ? ` · LC ${q.source.number}` : ''}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** The full pattern sheet (topic content loads on demand): why, use/not-when, evolution, template, problems. */
function PatternDetail({ summary, progress, featured = false }) {
  const { data, loading } = useTopicContent(summary.topicId);
  const [play, setPlay] = useState(false);
  const full = { ...summary, ...(data?.patterns?.find((p) => p.id === summary.id) || {}) };
  const st = patternStats(summary, progress);
  const solved = st.questions.filter((q) => progress.questions[q.id]?.status === 'solved').length;
  const attempted = st.questions.filter((q) => progress.questions[q.id]?.status === 'attempted').length;
  const visual = hasVisual(full);

  return (
    <div className={featured ? 'pt-feat-body' : 'pt-detail'}>
      <div className="pt-detail-l">
        {full.whyItExists && (
          <div className="pt-blk">
            <h5>Why it exists</h5>
            <Markdown className="pt-md">{full.whyItExists}</Markdown>
          </div>
        )}
        {(full.whenToUse || []).length > 0 && (
          <div className="pt-blk">
            <h5>Use it when…</h5>
            <ul className="pt-list">
              {full.whenToUse.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {(full.whenNotToUse || []).length > 0 && (
          <div className="pt-blk">
            <h5>Not when…</h5>
            <ul className="pt-list pt-list--no">
              {full.whenNotToUse.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {full.evolution && (
          <div className="pt-blk">
            <h5>How it escalates</h5>
            <div className="pt-evo">
              {[
                ['easy', 't-easy'],
                ['medium', 't-med'],
                ['hard', 't-hard'],
              ].map(([d, cls]) => (
                <div key={d}>
                  <b className={cls}>{d.toUpperCase()}</b>
                  <Markdown className="pt-md">{full.evolution[d]}</Markdown>
                </div>
              ))}
            </div>
          </div>
        )}
        {!featured && full.variations?.length > 0 && full.variations[0].description && (
          <div className="pt-blk">
            <h5>Variations</h5>
            <div className="pt-vars">
              {full.variations.map((v) => (
                <div key={v.name}>
                  <b>{v.name}</b>
                  <Markdown className="pt-md">{v.description}</Markdown>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="pt-detail-r">
        {loading && <div className="pt-loading mono">loading the template…</div>}
        {visual && play && (
          <div className="pt-blk pt-visual">
            <PatternVisual pattern={full} />
          </div>
        )}
        {full.template && <CodeBlock code={full.template} title={`template · ${shortName(full.name)}`} />}
        <div className="pt-blk">
          <h5>
            Example problems
            <span className="pt-h5-n">
              {solved} / {st.total} solved{attempted ? ` · ${attempted} attempted` : ''}
            </span>
          </h5>
          <Examples questions={st.questions} progress={progress} showNumber />
        </div>
        {full.mistakes?.length > 0 && (
          <div className="pt-blk">
            <h5>Mistakes to avoid</h5>
            <ul className="pt-list pt-list--warn">
              {full.mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="pt-foot">
          <Link to={`/topic/${full.topicId}`} className="btn btn--chrome btn--sm">
            Open the lesson <Icon name="arrowRight" size={15} />
          </Link>
          {visual && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPlay((v) => !v)} aria-pressed={play}>
              <Icon name={play ? 'pause' : 'play'} size={15} /> {play ? 'Hide animation' : 'See it move'}
            </button>
          )}
          <Link to={`/topic/${full.topicId}?tab=practice`} className="btn btn--ghost btn--sm">
            Practice set
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ pattern, progress, heat }) {
  const topic = topicById[pattern.topicId];
  const st = patternStats(pattern, progress);
  return (
    <article className="tile tile--raised pt-feat rise" style={{ '--i': 3 }} id={pattern.id} aria-labelledby={`h-${pattern.id}`}>
      <div className="pt-feat-top">
        <div className="row row--wrap" style={{ gap: 8 }}>
          <span className="chip pt-chip-uv">
            <i className="pip pip--uv" />
            {heat === 'cu' ? 'Current' : 'Featured'} · {topic.title}
          </span>
          {hasVisual(pattern) && <span className="tag">▶ animated</span>}
          <span className="tag">{st.total} problems</span>
        </div>
        <h3 id={`h-${pattern.id}`} className="chrome">
          {shortName(pattern.name)}
        </h3>
        <p className="pt-sum">{pattern.summary}</p>
        {pattern.clues?.length > 0 && (
          <div className="pt-blk">
            <h5>When you see…</h5>
            <div className="pt-sig">
              {pattern.clues.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="pt-arrow">
              <i />
              think {shortName(pattern.name)}
            </div>
          </div>
        )}
      </div>
      <PatternDetail summary={pattern} progress={progress} featured />
    </article>
  );
}

function PatternCard({ pattern, progress, heat, open, onToggle, index }) {
  const topic = topicById[pattern.topicId];
  const st = patternStats(pattern, progress);
  const cells = Math.max(1, Math.min(st.total, 10));
  const lit = st.total ? Math.round((st.solved / st.total) * cells) : 0;
  const tone = heat === 'av' ? 'var(--ice)' : heat === 'cu' || heat === 'pg' ? 'var(--uv)' : 'var(--plasma)';
  const stateLabel = { lk: 'locked', av: 'unlocked', pg: 'in progress', cu: 'current' }[heat];
  const tpTone = heat === 'av' ? ' t-ice' : heat === 'cu' || heat === 'pg' ? ' t-uv' : '';
  return (
    <article
      className={`tile pt-card rise${open ? ' pt-card--open' : ''}${['h3', 'h4'].includes(heat) ? ' pt-card--hot' : ''}${heat === 'lk' ? ' pt-card--lk' : ''}`}
      style={{ '--i': Math.min(index + 4, 12) }}
      id={pattern.id}
    >
      <div className="pt-card-top">
        <div className="pt-card-name">
          <span className={`pt-tp${tpTone}`}>
            {topic.title}
            {stateLabel ? ` · ${stateLabel}` : ''}
          </span>
          <h4>{shortName(pattern.name)}</h4>
        </div>
        <i className={`pt-pc pt-cube--${heat}`} title={HEAT_LABEL[heat]} aria-hidden="true" />
      </div>
      <p className="pt-card-sum">{pattern.summary}</p>
      {pattern.clues?.length > 0 && (
        <div className="pt-sig pt-sig--sm">
          {pattern.clues.slice(0, open ? undefined : 3).map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}
      {st.total > 0 && (
        <div className="pt-mrow">
          <div className="vmeter" style={{ '--c': tone }} role="img" aria-label={`${st.solved} of ${st.total} solved`}>
            {Array.from({ length: cells }, (_, i) => (
              <i key={i} className={i < lit ? 'on' : undefined} />
            ))}
          </div>
          <span className="mono">
            {st.solved} / {st.total}
          </span>
        </div>
      )}
      {!open && <Examples questions={st.questions} progress={progress} limit={3} />}
      {open && <PatternDetail summary={pattern} progress={progress} />}
      <button type="button" className="pt-more" onClick={onToggle} aria-expanded={open}>
        {open ? 'Collapse' : 'Template, not-when & all problems'}
        <Icon name="chevronDown" size={15} />
      </button>
    </article>
  );
}

function Skyline({ heatOf, statusOf, currentTopicId, counts }) {
  const groups = stages.map((s, i) => ({ ...s, n: i + 1, topics: s.topics.filter((t) => t.patterns.length) })).filter((s) => s.topics.length);
  return (
    <section className="tile tile--glow pt-sky rise" style={{ '--i': 1 }} aria-labelledby="pt-sky-t">
      <div className="pt-sky-head">
        <div>
          <span className="eyebrow">
            <i className="pip pip--uv" />
            Mastery map · 1 cube = 1 pattern · columns = topics
          </span>
          <h2 id="pt-sky-t" className="h2" style={{ marginTop: 12 }}>
            Pattern skyline
          </h2>
        </div>
        <div className="pt-legend">
          <span>
            cold
            <span className="pt-ramp" aria-hidden="true">
              <i className="pt-cube--h1" />
              <i className="pt-cube--h2" />
              <i className="pt-cube--h3" />
              <i className="pt-cube--h4" />
            </span>
            hot
          </span>
          <span>
            <i className="pt-key pt-cube--cu" />
            current
          </span>
          <span>
            <i className="pt-key pt-cube--pg" />
            started
          </span>
          <span>
            <i className="pt-key pt-cube--av" />
            unlocked
          </span>
          <span>
            <i className="pt-key pt-cube--lk" />
            locked
          </span>
        </div>
      </div>
      <div className="pt-sk-scroll">
        <div
          className="pt-sk"
          role="img"
          aria-label={`${counts.total} patterns across ${topics.length} topics: ${counts.practised} practised, ${counts.progress} in started topics, ${counts.available} unlocked, ${counts.locked} locked`}
        >
          {groups.map((s) => (
            <div key={s.id} className="pt-sk-g">
              <div className="pt-sk-cols">
                {s.topics.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.patterns[0].id}`}
                    className={`pt-sk-col${t.id === currentTopicId ? ' pt-sk-col--cur' : ''}`}
                    title={`${t.title} · ${t.patterns.length} patterns · ${statusOf[t.id]}`}
                    tabIndex={-1}
                  >
                    <span className="pt-sk-stack">
                      {t.patterns.map((p) => (
                        <i key={p.id} className={`pt-pc pt-cube--${heatOf[p.id]}`} title={`${shortName(p.name)} · ${HEAT_LABEL[heatOf[p.id]]}`} />
                      ))}
                    </span>
                    <span className="pt-sk-n">{t.patterns.length}</span>
                    <span className="pt-sk-l">{topicShort(t)}</span>
                  </a>
                ))}
              </div>
              <span className="pt-sk-s">S{String(s.n).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-sky-foot">
        <div>
          <span className="num">{counts.practised}</span>
          patterns <b>practised</b> — {counts.hot} of them glowing hot (≥ 90% solved).
        </div>
        <div>
          <span className="num t-uv">{counts.progress}</span>
          in topics you have <b>started</b> but not practised yet{counts.currentName ? ` — current: ${counts.currentName}` : ''}.
        </div>
        <div>
          <span className="num t-ice">{counts.available}</span>
          <b>unlocked</b> but untouched — ready whenever you are.
        </div>
        <div>
          <span className="num t-muted">{counts.locked}</span>
          <b>locked</b> behind prerequisites on the learning path.
        </div>
      </div>
    </section>
  );
}

export default function PatternsPage() {
  const { progress } = useProgress();
  const location = useLocation();
  const rec = useMemo(() => recommendations(progress), [progress]);
  const currentPattern = rec.currentPattern;
  const statusOf = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, topicStatus(t, progress)])), [progress]);
  const heatOf = useMemo(() => Object.fromEntries(allPatterns.map((p) => [p.id, patternHeat(p, progress, statusOf, currentPattern?.id)])), [progress, statusOf, currentPattern]);
  const counts = useMemo(() => {
    const v = Object.values(heatOf);
    return {
      total: v.length,
      practised: v.filter((h) => /^h/.test(h)).length,
      hot: v.filter((h) => h === 'h4').length,
      progress: v.filter((h) => h === 'pg' || h === 'cu').length,
      available: v.filter((h) => h === 'av').length,
      locked: v.filter((h) => h === 'lk').length,
      currentName: currentPattern ? shortName(currentPattern.name) : '',
    };
  }, [heatOf, currentPattern]);
  const acts = activityTotals(progress);

  const categories = useMemo(() => {
    const m = new Map();
    for (const t of topics) if (t.patterns.length) m.set(t.category, (m.get(t.category) || 0) + t.patterns.length);
    return [...m.entries()];
  }, []);

  const [category, setCategory] = useState(() => {
    const hp = allPatterns.find((p) => p.id === decodeURIComponent(location.hash.slice(1)));
    if (hp) return topicById[hp.topicId].category;
    return currentPattern ? topicById[currentPattern.topicId].category : 'all';
  });
  const [open, setOpen] = useState(() => new Set(location.hash ? [decodeURIComponent(location.hash.slice(1))] : []));
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!location.hash) return undefined;
    const id = decodeURIComponent(location.hash.slice(1));
    const hp = allPatterns.find((p) => p.id === id);
    if (hp) {
      setCategory(topicById[hp.topicId].category);
      setOpen((s) => new Set([...s, id]));
    }
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [location.hash]);

  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const f = filter.toLowerCase().trim();
  const matches = (p) => !f || p.name.toLowerCase().includes(f) || (p.clues || []).some((c) => c.toLowerCase().includes(f)) || (p.summary || '').toLowerCase().includes(f);
  const shown = allPatterns.filter((p) => (f || category === 'all' || topicById[p.topicId].category === category) && matches(p));
  const featured = shown.find((p) => p.id === currentPattern?.id);
  const rest = shown.filter((p) => p !== featured);

  return (
    <div className="page pt-page">
      <section className="pt-hero rise">
        <div>
          <span className="eyebrow">
            <i className="pip" />
            patterns[ ] · property → pattern → structure → complexity
          </span>
          <h1 className="display chrome pt-title">
            Pattern
            <br />
            library<span className="pt-dot">.</span>
          </h1>
          <p className="lead">
            The curriculum is organised around patterns. Each one shows <b>why it exists</b>, the <b>signals</b> that give it away, its template and how problems escalate. Don’t know which applies? Ask the{' '}
            <b>Pattern Finder</b>.
          </p>
          <div className="pt-jump">
            <Link className="btn btn--plasma" to="/finder">
              Open Pattern Finder <Icon name="target" size={18} />
            </Link>
            <a
              className="btn btn--ghost"
              href="#pt-lib"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pt-lib')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Browse library
            </a>
          </div>
        </div>
        <div className="pt-stats">
          <div>
            <span className="num">{counts.total}</span>
            <span className="eyebrow">patterns</span>
          </div>
          <div>
            <span className="num">
              {counts.practised}
              <span className="of"> lit</span>
            </span>
            <span className="eyebrow">practised</span>
          </div>
          <div>
            <span className="num plasma-text">{acts.patternGuesses ? `${pct(acts.patternCorrect, acts.patternGuesses)}%` : '—'}</span>
            <span className="eyebrow">{acts.patternGuesses ? `spotted first try · ${acts.patternCorrect}/${acts.patternGuesses}` : 'no pattern guesses yet'}</span>
          </div>
        </div>
      </section>

      <Skyline heatOf={heatOf} statusOf={statusOf} currentTopicId={currentPattern?.topicId} counts={counts} />

      <div className="pt-toolbar rise" style={{ '--i': 2 }} id="pt-lib">
        <label className="search-in">
          <Icon name="search" size={17} />
          <input className="input" type="search" placeholder="Filter by name or clue — e.g. “at most k”, “sorted”, “top k”" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter patterns" />
        </label>
        <div className="pt-cats" role="group" aria-label="Category">
          <button type="button" className="pt-cat" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
            All <b>{allPatterns.length}</b>
          </button>
          {categories.map(([c, n]) => (
            <button key={c} type="button" className="pt-cat" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c} <b>{n}</b>
            </button>
          ))}
        </div>
      </div>
      {f && (
        <p className="pt-note mono">
          {shown.length} pattern{shown.length === 1 ? '' : 's'} match “{filter}” across all categories
        </p>
      )}

      <div className="pt-grid">
        {featured && <FeaturedCard pattern={featured} progress={progress} heat={heatOf[featured.id]} />}
        {rest.map((p, i) => (
          <PatternCard key={p.id} pattern={p} progress={progress} heat={heatOf[p.id]} open={open.has(p.id)} onToggle={() => toggle(p.id)} index={i} />
        ))}
        {shown.length === 0 && (
          <div className="tile pt-empty">
            No pattern matches “{filter}”. Try another clue from the problem statement, or let the <Link to="/finder">Pattern Finder</Link> ask you questions.
          </div>
        )}
      </div>
    </div>
  );
}
