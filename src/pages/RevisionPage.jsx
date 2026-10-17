import { Link } from 'react-router-dom';
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
    <div className="page rv ink-in">
      <header className="page-header rv-head">
        <div>
          <span className="eyebrow">Revision</span>
          <h1>
            Go back over it, <em>on purpose</em>
          </h1>
          <p>Coming back to something a few days later beats reading it twice. Start with the weak spots, redo what tripped you, then skim the sheets of what you've finished.</p>
        </div>
        <Link to="/cheatsheet" className="btn">
          Open the one-page cheat sheet
        </Link>
      </header>

      <section className="rv-sec" aria-labelledby="rv-weak">
        <div className="rv-margin" aria-hidden="true">
          <span className="rv-num">1</span>
        </div>
        <div className="rv-content">
          <h2 id="rv-weak">Weak spots</h2>
          {weak.length === 0 ? (
            <p className="rv-empty">Nothing weak yet. This list is worked out from first-try checkpoint answers, pattern guesses, and whether you solved a question without opening its solution.</p>
          ) : (
            <ol className="rv-weak">
              {weak.map((w) => (
                <li key={w.topic.id}>
                  <div className="rv-weak-score">
                    <span className="rv-weak-big">{Math.round(w.score * 100)}</span>
                    <span className="eyebrow">score</span>
                  </div>
                  <div>
                    <h3>{w.topic.title}</h3>
                    <ul className="rv-signals">
                      {w.signals.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <div className="rv-actions">
                      <Link to={`/topic/${w.topic.id}?tab=review`} className="btn btn-sm btn-primary">
                        Review the topic
                      </Link>
                      <Link to={`/topic/${w.topic.id}`} className="rf-textbtn">
                        Redo the lesson
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="rv-sec" aria-labelledby="rv-retry">
        <div className="rv-margin" aria-hidden="true">
          <span className="rv-num">2</span>
        </div>
        <div className="rv-content">
          <h2 id="rv-retry">Questions to try again</h2>
          {mistakes.length === 0 ? (
            <p className="rv-empty">Nothing to retry. Questions you fail, mis-name or peek at the answer for will be waiting here.</p>
          ) : (
            <div className="rv-qlist">
              <QuestionList questions={mistakes} progress={progress} showTopic />
            </div>
          )}
        </div>
      </section>

      <section className="rv-sec" aria-labelledby="rv-done">
        <div className="rv-margin" aria-hidden="true">
          <span className="rv-num">3</span>
        </div>
        <div className="rv-content">
          <h2 id="rv-done">Finished lessons</h2>
          {studied.length === 0 ? (
            <div className="rf-empty">
              <p>No finished lessons yet. Complete one and its review sheet will be filed here.</p>
              <Link to="/path" className="btn btn-sm">
                Pick a lesson
              </Link>
            </div>
          ) : (
            <ul className="rv-done">
              {studied.map((t) => {
                const missed = missedCheckpoints(progress, t).length;
                const done = topicStatus(t, progress) === 'completed';
                return (
                  <li key={t.id}>
                    <span className={`rv-done-mark ${done ? 'is-done' : ''}`} aria-hidden="true">
                      {done ? '●' : '◐'}
                    </span>
                    <span className="rv-done-title">
                      {t.title}
                      <span className="sr-only">{done ? ' (completed)' : ' (in progress)'}</span>
                    </span>
                    {missed > 0 && <span className="rv-missed">{missed} missed checkpoints</span>}
                    <span className="rv-done-links">
                      <Link to={`/topic/${t.id}?tab=review`}>Review</Link>
                      <Link to={`/topic/${t.id}?tab=cheatsheet`}>Cheat sheet</Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
