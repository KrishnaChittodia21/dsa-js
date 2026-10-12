import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DifficultyBadge, QuestionStatusIcon } from '../components/ui/primitives.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { allQuestions, topics, topicById, patternById, companies, companyQuestions } from '../content/index.js';

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

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Questions</h1>
          <p>
            {allQuestions.length} questions across {topics.length} topics. Solve them from their topic for the best progression.
          </p>
        </div>
      </div>
      <div className="filter-bar">
        <input className="input" placeholder="Search title, tag or pattern" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select className="select" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
          <option value="all">All difficulties</option>
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
        <span className="small muted">{rows.length} shown</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              <th>Question</th>
              <th>Topic</th>
              <th>Pattern</th>
              <th>Difficulty</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const st = progress.questions[x.id];
              return (
                <tr key={x.id}>
                  <td>
                    <QuestionStatusIcon status={st?.status} />
                  </td>
                  <td>
                    <Link to={`/topic/${x.topicId}/q/${x.id}`}>{x.title}</Link>
                    {x.source?.premium && <span className="badge" style={{ marginLeft: 6 }}>premium</span>}
                  </td>
                  <td className="small">
                    <Link to={`/topic/${x.topicId}`} className="muted">
                      {topicById[x.topicId]?.title}
                    </Link>
                  </td>
                  <td className="small muted">{patternById[x.pattern]?.name}</td>
                  <td>
                    <DifficultyBadge difficulty={x.difficulty} />
                  </td>
                  <td className="small mono muted">{st?.submissions || st?.attempts || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            <Icon name="search" /> No questions match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
