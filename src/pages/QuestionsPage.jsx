import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { monogram } from '../components/question/ProblemPanel.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { allQuestions, topics, topicById, patternById, companies, companyById, companyQuestions } from '../content/index.js';

const DIFFS = ['Easy', 'Medium', 'Hard'];
const DIFF_CHIP = { Easy: 'chip--easy', Medium: 'chip--med', Hard: 'chip--hard' };
const STATUSES = [
  ['all', 'Any'],
  ['todo', 'To do'],
  ['attempted', 'Attempted'],
  ['solved', 'Solved'],
];

/** A pill-shaped native <select> with a muted "label" prefix (keyboard + screen-reader friendly). */
function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className={`ql-fsel${value !== 'all' ? ' ql-fsel--on' : ''}`} style={{ '--em': `${label.length * 7.5 + 12}px` }}>
      <em>{label}</em>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {children}
      </select>
      <Icon name="chevronDown" size={14} />
    </label>
  );
}

export default function QuestionsPage() {
  const { progress } = useProgress();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('all');
  const [pattern, setPattern] = useState('all');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');
  const [company, setCompany] = useState('all');

  const byQuestion = useMemo(() => {
    const m = {};
    for (const c of companyQuestions) if (c.questionId) (m[c.questionId] ||= new Set()).add(c.company);
    return m;
  }, []);
  const patternOptions = useMemo(() => {
    const ids = new Set(allQuestions.filter((x) => topic === 'all' || x.topicId === topic).map((x) => x.pattern).filter(Boolean));
    return [...ids].map((id) => ({ id, name: patternById[id]?.name || id })).sort((a, b) => a.name.localeCompare(b.name));
  }, [topic]);

  const stOf = (x) => progress.questions[x.id]?.status || 'todo';
  const rows = allQuestions.filter((x) => {
    const st = stOf(x);
    if (topic !== 'all' && x.topicId !== topic) return false;
    if (pattern !== 'all' && x.pattern !== pattern) return false;
    if (diff !== 'all' && x.difficulty !== diff) return false;
    if (status === 'solved' && st !== 'solved') return false;
    if (status === 'todo' && st !== 'todo') return false;
    if (status === 'attempted' && st !== 'attempted') return false;
    if (company !== 'all' && !byQuestion[x.id]?.has(company)) return false;
    if (q && !`${x.title} ${(x.tags || []).join(' ')} ${patternById[x.pattern]?.name || ''} ${x.source?.number || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const solvedShown = rows.filter((x) => stOf(x) === 'solved').length;
  const attemptedShown = rows.filter((x) => stOf(x) === 'attempted').length;
  const filtered = q || topic !== 'all' || pattern !== 'all' || diff !== 'all' || status !== 'all' || company !== 'all';
  const clear = () => {
    setQ('');
    setTopic('all');
    setPattern('all');
    setDiff('all');
    setStatus('all');
    setCompany('all');
  };

  return (
    <div className="page page-wide ql">
      <header className="ql-head rise">
        <div>
          <span className="eyebrow">Practice · all questions</span>
          <h1 className="h1">Problem list</h1>
        </div>
        <p>
          <span className="mono">{allQuestions.length}</span> questions across <span className="mono">{topics.length}</span> topics · solve them from their topic for the best progression.
        </p>
      </header>

      <section className="tile ql-tile rise" style={{ '--i': 1 }} aria-label="Questions">
        <div className="ql-filters">
          <label className="search-in">
            <Icon name="search" size={17} />
            <input className="input" placeholder="Search title, tag, pattern or LC #" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
          </label>
          <div className="seg ql-seg" role="group" aria-label="Difficulty">
            <button type="button" aria-pressed={diff === 'all'} onClick={() => setDiff('all')}>
              All
            </button>
            {DIFFS.map((d) => (
              <button key={d} type="button" aria-pressed={diff === d} onClick={() => setDiff(d)}>
                {d}
              </button>
            ))}
          </div>
          <div className="seg ql-seg" role="group" aria-label="Status">
            {STATUSES.map(([v, l]) => (
              <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="ql-fchips">
          <FilterSelect label="topic" value={topic} onChange={(v) => { setTopic(v); setPattern('all'); }}>
            <option value="all">Any</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="pattern" value={pattern} onChange={setPattern}>
            <option value="all">Any</option>
            {patternOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="company" value={company} onChange={setCompany}>
            <option value="all">Any</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          {filtered && (
            <button type="button" className="ql-clear" onClick={clear}>
              Clear filters
            </button>
          )}
          <span className="ql-count">
            <b>{rows.length}</b> shown · {solvedShown} solved · {attemptedShown} attempted
          </span>
        </div>

        <div className="ql-table" role="table" aria-label="Questions">
          <div className="ql-h" role="row">
            <span role="columnheader">
              <span className="sr-only">Status</span>
            </span>
            <span role="columnheader">#</span>
            <span role="columnheader">Question</span>
            <span role="columnheader" className="ql-hide-md">
              Pattern
            </span>
            <span role="columnheader">Difficulty</span>
            <span role="columnheader">Topic</span>
            <span role="columnheader" className="ql-hide-md">
              Companies
            </span>
            <span role="columnheader" className="ql-r-tries">
              Tries
            </span>
          </div>
          {rows.map((x) => {
            const qs = progress.questions[x.id];
            const st = qs?.status || 'todo';
            const cos = [...(byQuestion[x.id] || [])];
            const pname = patternById[x.pattern]?.name;
            const tries = (qs?.submissions || 0) + (qs?.runs || 0) || qs?.attempts || 0;
            return (
              <Link key={x.id} to={`/topic/${x.topicId}/q/${x.id}`} className="ql-r" role="row">
                <span className={`ql-st ql-st--${st}`} role="cell" title={st === 'todo' ? 'Not started' : st} aria-label={st === 'todo' ? 'Not started' : st} />
                <span className="ql-r-no" role="cell">
                  {x.source?.number || '—'}
                </span>
                <span className="ql-r-ti" role="cell">
                  <b>{x.title}</b>
                  {x.source?.premium && <span className="tag ql-prem">premium</span>}
                </span>
                <span className="ql-r-sub" aria-hidden="true">
                  {x.source?.number ? `#${x.source.number} · ` : ''}
                  {pname || topicById[x.topicId]?.title}
                </span>
                <span className="ql-r-pt ql-hide-md" role="cell">
                  {pname || '—'}
                </span>
                <span className={`chip ${DIFF_CHIP[x.difficulty] || ''}`} role="cell">
                  <span className="diff-pips">
                    <i />
                    <i />
                    <i />
                  </span>
                  {x.difficulty}
                </span>
                <span className="ql-r-tp" role="cell">
                  {topicById[x.topicId]?.title}
                </span>
                <span className="ql-r-co ql-hide-md" role="cell">
                  {cos.length === 0 && <em>—</em>}
                  {cos.slice(0, 3).map((c) => (
                    <span key={c} className="mono-badge" title={companyById[c]?.name || c}>
                      {monogram(companyById[c]?.name || c)}
                    </span>
                  ))}
                  {cos.length > 3 && <em>+{cos.length - 3}</em>}
                </span>
                <span className="ql-r-tries" role="cell">
                  {tries}
                </span>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <div className="ql-empty">
              <Icon name="search" size={16} /> No questions match these filters.
            </div>
          )}
        </div>
        <div className="ql-foot">
          <span>
            showing {rows.length} of {allQuestions.length}
          </span>
          <span>status ◆ solved · ◩ attempted · ◇ to do</span>
        </div>
      </section>
    </div>
  );
}
