import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { DifficultyBadge, ProgressBar, StatusBadge } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicStats, topicStatus, recommendations } from '../state/selectors.js';
import { stages, topicById, companyQuestionsForTopic } from '../content/index.js';

export function TopicCard({ topic, progress, dispatch, highlight }) {
  const status = topicStatus(topic, progress);
  const s = topicStats(topic, progress);
  const companyCount = companyQuestionsForTopic(topic.id).length;
  const locked = status === 'locked';
  return (
    <div className={`card topic-card topic-${status} ${highlight ? 'topic-highlight' : ''}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-wrap" style={{ marginBottom: '0.35rem' }}>
            <StatusBadge status={status} />
            <DifficultyBadge difficulty={topic.difficulty} />
            {highlight && <span className="badge badge-accent">Recommended</span>}
          </div>
          <h3 style={{ margin: 0 }}>{locked ? topic.title : <Link to={`/topic/${topic.id}`}>{topic.title}</Link>}</h3>
        </div>
        <span className="topic-index mono">{String(topic.index + 1).padStart(2, '0')}</span>
      </div>
      <p className="small muted" style={{ margin: '0.5rem 0' }}>
        {topic.description}
      </p>
      <div className="topic-meta small">
        <span>
          <Icon name="clock" size={13} /> ~{Math.round(topic.estMinutes / 10) * 10} min lesson
        </span>
        <span>
          <Icon name="list" size={13} /> {s.total} questions
        </span>
        {companyCount > 0 && (
          <span>
            <Icon name="building" size={13} /> {companyCount} company refs
          </span>
        )}
      </div>
      {topic.patterns.length > 0 && (
        <div className="row-wrap" style={{ margin: '0.5rem 0' }}>
          {topic.patterns.slice(0, 5).map((p) => (
            <span key={p.id} className="badge badge-outline">
              {p.name.replace(/^.*?—\s*/, '')}
            </span>
          ))}
          {topic.patterns.length > 5 && <span className="small faint">+{topic.patterns.length - 5}</span>}
        </div>
      )}
      <div className="small muted" style={{ marginBottom: '0.35rem' }}>
        {topic.prerequisites.length ? (
          <>
            Prerequisites:{' '}
            {topic.prerequisites.map((p, i) => (
              <span key={p}>
                {i > 0 && ', '}
                <Link to={`/topic/${p}`}>{topicById[p].title}</Link>
                {progress.topics[p]?.lessonCompleted ? ' ✓' : ''}
              </span>
            ))}
          </>
        ) : (
          'No prerequisites'
        )}
      </div>
      <div className="row">
        <div style={{ flex: 1 }}>
          <ProgressBar value={s.mastery} variant={status === 'completed' ? 'success' : ''} size="sm" label={`${topic.title} mastery`} />
        </div>
        <span className="small mono muted">{s.mastery}%</span>
      </div>
      <div className="row" style={{ marginTop: '0.75rem' }}>
        {locked ? (
          <>
            <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })}>
              <Icon name="lock" size={13} /> Unlock anyway
            </button>
            <span className="small faint">Complete prerequisites first for the best experience.</span>
          </>
        ) : (
          <>
            <Link to={`/topic/${topic.id}`} className={`btn btn-sm ${status === 'available' || status === 'in-progress' ? 'btn-primary' : ''}`}>
              {status === 'completed' ? 'Revisit' : status === 'in-progress' ? 'Continue' : 'Start'}
            </Link>
            <Link to={`/topic/${topic.id}?tab=visualize`} className="btn btn-sm btn-ghost" title="Step-through animations for this topic">
              <Icon name="play" size={13} /> Visualize
            </Link>
            {s.lessonCompleted && (
              <Link to={`/topic/${topic.id}?tab=practice`} className="btn btn-sm btn-ghost">
                Practice
              </Link>
            )}
            {status === 'completed' && (
              <Link to={`/topic/${topic.id}?tab=review`} className="btn btn-sm btn-ghost">
                Review
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LearningPath() {
  const { progress, dispatch } = useProgress();
  const rec = recommendations(progress);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Learning Path</h1>
          <p>Topics unlock when their prerequisites' lessons are complete. A topic is completed when you finish its lesson and solve at least half its questions.</p>
        </div>
      </div>
      <div className="path">
        {stages.map((stage, si) => (
          <section key={stage.id} className="path-stage">
            <div className="path-stage-head">
              <span className="path-stage-num">{si + 1}</span>
              <div>
                <h2 style={{ margin: 0 }}>{stage.title}</h2>
                <div className="small muted">{stage.description}</div>
              </div>
            </div>
            <div className="grid-auto path-topics">
              {stage.topics.map((t) => (
                <TopicCard key={t.id} topic={t} progress={progress} dispatch={dispatch} highlight={t.id === rec.nextTopic?.id || (t.id === rec.current.id && topicStatus(t, progress) !== 'completed')} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
