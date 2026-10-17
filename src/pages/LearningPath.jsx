import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicStats, topicStatus, recommendations, STATUS_LABEL } from '../state/selectors.js';
import { stages, topicById, companyQuestionsForTopic } from '../content/index.js';
import useReveal from '../lib/useReveal.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const MARK = { locked: '·', available: '○', 'in-progress': '◐', completed: '✓' };
const DIFF = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };

/** One topic as a numbered syllabus row: description, prerequisites, time, mastery rule and actions. */
export function TopicCard({ topic, progress, dispatch, highlight }) {
  const status = topicStatus(topic, progress);
  const s = topicStats(topic, progress);
  const companyCount = companyQuestionsForTopic(topic.id).length;
  const locked = status === 'locked';
  const patterns = topic.patterns.map((p) => p.name.replace(/^.*?—\s*/, ''));
  return (
    <li className={`syl-topic st-${status} ${highlight ? 'is-next' : ''}`}>
      <span className="syl-num" aria-hidden="true">
        {String(topic.index + 1).padStart(2, '0')}
      </span>
      <div className="syl-body">
        <div className="syl-titleline">
          <h3>
            <span className="sr-only">Topic {topic.index + 1}: </span>
            {locked ? topic.title : <Link to={`/topic/${topic.id}`}>{topic.title}</Link>}
          </h3>
          {highlight && <span className="syl-next">Next up</span>}
          <span className={`syl-status st-${status}`}>
            <span aria-hidden="true">{MARK[status]}</span> {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="syl-desc">{topic.description}</p>
        <p className="syl-meta">
          <span>~{Math.round(topic.estMinutes / 10) * 10} min lesson</span>
          <span className={`syl-diff diff-${DIFF[topic.difficulty] || ''}`}>{topic.difficulty}</span>
          <span>{s.total} questions</span>
          {companyCount > 0 && <span>{companyCount} company references</span>}
        </p>
        {patterns.length > 0 && (
          <p className="syl-patterns">
            <span className="eyebrow">Patterns</span> {patterns.slice(0, 5).join(' · ')}
            {patterns.length > 5 && <span className="folio"> +{patterns.length - 5} more</span>}
          </p>
        )}
        <p className="syl-prereq">
          {topic.prerequisites.length ? (
            <>
              <span className="eyebrow">Builds on</span>{' '}
              {topic.prerequisites.map((p, i) => (
                <span key={p}>
                  {i > 0 && ', '}
                  <Link to={`/topic/${p}`}>{topicById[p].title}</Link>
                  {progress.topics[p]?.lessonCompleted ? <span className="syl-tick"> ✓</span> : ''}
                </span>
              ))}
            </>
          ) : (
            <span className="syl-free">No prerequisites; start here whenever you like.</span>
          )}
        </p>
        <div className="syl-mastery">
          <span
            className={`thin-rule ${status === 'completed' ? 'good' : ''}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={s.mastery}
            aria-label={`${topic.title} mastery`}
          >
            <span style={{ width: `${s.mastery}%` }} />
          </span>
          <span className="folio">{s.mastery}% mastery</span>
        </div>
        <div className="syl-actions">
          {locked ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })}>
                Unlock anyway
              </button>
              <span className="syl-hint">It reads best after its prerequisites, but nothing stops you.</span>
            </>
          ) : (
            <>
              <Link to={`/topic/${topic.id}`} className={`btn btn-sm ${status === 'available' || status === 'in-progress' ? 'btn-primary' : ''}`}>
                {status === 'completed' ? 'Revisit' : status === 'in-progress' ? 'Continue' : 'Start the lesson'}
              </Link>
              <Link to={`/topic/${topic.id}?tab=visualize`} className="syl-link" title="Step-through animations for this topic">
                Watch it animate
              </Link>
              {s.lessonCompleted && (
                <Link to={`/topic/${topic.id}?tab=practice`} className="syl-link">
                  Practise
                </Link>
              )}
              {status === 'completed' && (
                <Link to={`/topic/${topic.id}?tab=review`} className="syl-link">
                  Review
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function LearningPath() {
  const { progress, dispatch } = useProgress();
  const rec = recommendations(progress);
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref} className="page syllabus ink-in">
      <header className="page-header syl-header">
        <div>
          <p className="eyebrow">Syllabus</p>
          <h1>The learning path</h1>
          <p>
            Topics open once the lessons they build on are finished. A topic counts as complete when its lesson is done and at least half its questions are
            solved.
          </p>
        </div>
      </header>
      {stages.map((stage, si) => {
        const done = stage.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
        const minutes = stage.topics.reduce((a, t) => a + t.estMinutes, 0);
        return (
          <section key={stage.id} className="syl-part" aria-labelledby={`part-${stage.id}`} data-reveal={si > 0 ? '' : undefined}>
            <div className="syl-part-head">
              <p className="syl-part-num">Part {ROMAN[si]}</p>
              <h2 id={`part-${stage.id}`}>{stage.title}</h2>
              <p className="syl-part-desc">{stage.description}</p>
              <p className="folio">
                {done}/{stage.topics.length} complete · about {minutes >= 90 ? `${Math.round(minutes / 60)} hours` : `${minutes} minutes`} of lessons
              </p>
            </div>
            <ol className="syl-topics">
              {stage.topics.map((t) => (
                <TopicCard
                  key={t.id}
                  topic={t}
                  progress={progress}
                  dispatch={dispatch}
                  highlight={t.id === rec.nextTopic?.id || (t.id === rec.current.id && topicStatus(t, progress) !== 'completed')}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
