import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../state/ProgressContext.jsx';
import { allQuestions, topics, topicById, patternById, companies, companyQuestions } from '../content/index.js';

const DIFF_MARK = { Easy: 'E', Medium: 'M', Hard: 'H' };
const STATUS_MARK = {
  solved: ['✓', 'Solved'],
  attempted: ['◐', 'Attempted'],
};

export default function QuestionsPage() {
  const { progress } = useProgress();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('all');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');
  const [company, setCompany] = useState('all');

  const companySet = useMemo(() => {
    if (company === 'all') return null;
    return new Set(companyQuestions.filter((c) => c.company === company).map((c) => c.questionId));
  }, [company]);

  const rows = allQuestions.filter((x) => {
    const st = progress.questions[x.id]?.status || 'todo';
    if (topic !== 'all' && x.topicId !== topic) return false;
    if (diff !== 'all' && x.difficulty !== diff) return false;
    if (status === 'solved' && st !== 'solved') return false;
    if (status === 'todo' && st === 'solved') return false;
    if (status === 'attempted' && st !== 'attempted') return false;
    if (companySet && !companySet.has(x.id)) return false;
    if (q && !`${x.title} ${(x.tags || []).join(' ')} ${patternById[x.pattern]?.name || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const solvedCount = allQuestions.filter((x) => progress.questions[x.id]?.status === 'solved').length;
  const filtered = q || topic !== 'all' || diff !== 'all' || status !== 'all' || company !== 'all';
  const clear = () => {
    setQ('');
    setTopic('all');
    setDiff('all');
    setStatus('all');
    setCompany('all');
  };

  return (
    <div className="page page-wide lg ink-in">
      <header className="lg-head">
        <div>
          <span className="eyebrow">The problem ledger</span>
          <h1>Questions</h1>
        </div>
        <dl className="lg-tally">
          <div>
            <dt className="eyebrow">Entries</dt>
            <dd>{allQuestions.length}</dd>
          </div>
          <div>
            <dt className="eyebrow">Topics</dt>
            <dd>{topics.length}</dd>
          </div>
          <div>
            <dt className="eyebrow">Solved</dt>
            <dd>{solvedCount}</dd>
          </div>
        </dl>
        <p className="lg-lede">Every question in the course, in one book. They make most sense solved from inside their topic, in order — use this page to find one again.</p>
      </header>

      <div className="lg-toolbar" role="search" aria-label="Filter questions">
        <input className="input lg-search" type="search" placeholder="Search a title, tag or pattern" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select className="select" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
          <option value="all">Any difficulty</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option>
          <option value="todo">Not solved</option>
          <option value="attempted">Attempted</option>
          <option value="solved">Solved</option>
        </select>
        <select className="select" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company">
          <option value="all">Any company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="lg-shown folio" aria-live="polite">
          {rows.length} shown
        </span>
        {filtered && (
          <button type="button" className="rf-textbtn" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>

      <div className="lg-table-wrap">
        <table className="lg-table">
          <thead>
            <tr>
              <th scope="col" className="lg-c-num">
                №
              </th>
              <th scope="col" className="lg-c-mark">
                <span className="sr-only">Status</span>
              </th>
              <th scope="col">Question</th>
              <th scope="col">Topic</th>
              <th scope="col">Pattern</th>
              <th scope="col" className="lg-c-diff">
                Diff.
              </th>
              <th scope="col" className="lg-c-att">
                Tries
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => {
              const st = progress.questions[x.id];
              const [mark, markLabel] = STATUS_MARK[st?.status] || ['○', 'Not started'];
              return (
                <tr key={x.id} className={st?.status === 'solved' ? 'is-solved' : undefined}>
                  <td className="lg-c-num folio">{String(i + 1).padStart(3, '0')}</td>
                  <td className={`lg-c-mark lg-mark-${st?.status || 'todo'}`}>
                    <span aria-hidden="true">{mark}</span>
                    <span className="sr-only">{markLabel}</span>
                  </td>
                  <td className="lg-c-title">
                    <Link to={`/topic/${x.topicId}/q/${x.id}`}>{x.title}</Link>
                    {x.source?.premium && <span className="lg-premium">premium</span>}
                  </td>
                  <td className="lg-c-topic">
                    <Link to={`/topic/${x.topicId}`}>{topicById[x.topicId]?.title}</Link>
                  </td>
                  <td className="lg-c-pattern">{patternById[x.pattern]?.name}</td>
                  <td className="lg-c-diff">
                    <span className={`rf-dm rf-dm-${x.difficulty.toLowerCase()}`} title={x.difficulty}>
                      <span aria-hidden="true">{DIFF_MARK[x.difficulty]}</span>
                      <span className="sr-only">{x.difficulty}</span>
                    </span>
                  </td>
                  <td className="lg-c-att folio">{st?.submissions || st?.attempts || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="rf-empty">
            <p>No question fits all of those filters at once. Loosen one and the ledger fills back in.</p>
            <button type="button" className="btn btn-sm" onClick={clear}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
