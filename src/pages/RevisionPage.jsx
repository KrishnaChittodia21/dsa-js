import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { EmptyState, StatusBadge } from '../components/ui/primitives.jsx';
import { QuestionList } from './TopicPage.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { mistakeQuestions, missedCheckpoints, topicStatus, weakAreas, topicStats } from '../state/selectors.js';
import { topics } from '../content/index.js';

export default function RevisionPage() {
  const { progress } = useProgress();
  const weak = weakAreas(progress);
  const mistakes = mistakeQuestions(progress);
  const studied = topics.filter((t) => ['completed', 'in-progress'].includes(topicStatus(t, progress)) && topicStats(t, progress).lessonCompleted);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Revision</h1>
          <p>Spaced review beats re-reading. Revisit weak areas, redo questions you struggled with, and skim the cheatsheets of finished topics.</p>
        </div>
        <span className="spacer" />
        <Link to="/cheatsheet" className="btn">
          <Icon name="file" size={15} /> Global cheat sheet
        </Link>
      </div>

      <h2>Weak areas</h2>
      {weak.length === 0 ? (
        <p className="muted small">No weak areas detected yet. They are computed from first-try checkpoint accuracy, pattern-recognition accuracy, and whether you solved questions without viewing the solution.</p>
      ) : (
        <div className="grid-2">
          {weak.map((w) => (
            <div key={w.topic.id} className="card">
              <div className="row">
                <h3 style={{ margin: 0, flex: 1 }}>{w.topic.title}</h3>
                <span className="badge badge-danger">score {Math.round(w.score * 100)}%</span>
              </div>
              <ul className="small" style={{ margin: '0.5rem 0' }}>
                {w.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="row">
                <Link to={`/topic/${w.topic.id}?tab=review`} className="btn btn-sm btn-primary">
                  Review topic
                </Link>
                <Link to={`/topic/${w.topic.id}`} className="btn btn-sm btn-ghost">
                  Redo lesson
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Questions to retry</h2>
      {mistakes.length === 0 ? <p className="muted small">Questions you failed, mis-identified, or peeked at will appear here.</p> : <div className="card"><QuestionList questions={mistakes} progress={progress} showTopic /></div>}

      <h2 style={{ marginTop: '2rem' }}>Completed lessons</h2>
      {studied.length === 0 ? (
        <EmptyState icon="book" title="Nothing to review yet">
          Complete a lesson and its Review tab will appear here.
        </EmptyState>
      ) : (
        <div className="grid-auto">
          {studied.map((t) => {
            const missed = missedCheckpoints(progress, t).length;
            return (
              <div key={t.id} className="card">
                <div className="row-wrap" style={{ marginBottom: '0.35rem' }}>
                  <StatusBadge status={topicStatus(t, progress)} />
                  {missed > 0 && <span className="badge badge-warning">{missed} missed checkpoints</span>}
                </div>
                <h3>{t.title}</h3>
                <div className="row">
                  <Link to={`/topic/${t.id}?tab=review`} className="btn btn-sm">
                    Review
                  </Link>
                  <Link to={`/topic/${t.id}?tab=cheatsheet`} className="btn btn-sm btn-ghost">
                    Cheatsheet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
