import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { DifficultyBadge, DiffProgress, ProgressBar, Ring, StatCard } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress, overallStats, recentlySolved, recommendations, streak, weakAreas, topicStats } from '../state/selectors.js';
import { topicById } from '../content/index.js';

export default function Dashboard() {
  const { progress } = useProgress();
  const o = overallStats(progress);
  const rec = recommendations(progress);
  const st = streak(progress);
  const recent = recentlySolved(progress);
  const weak = weakAreas(progress).slice(0, 4);
  const companies = companyProgress(progress).sort((a, b) => b.solved / (b.total || 1) - a.solved / (a.total || 1)).slice(0, 6);
  const cur = rec.current;
  const cs = rec.currentStats;
  const isNew = o.solved === 0 && Object.keys(progress.topics).length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{isNew ? 'Welcome to your DSA Journey' : 'Your DSA Journey'}</h1>
          <p>{isNew ? 'Learn each pattern deeply, check your understanding as you go, then practise until you can recognise it anywhere.' : 'Understand → Visualize → Learn the pattern → Implement → Practise → Master.'}</p>
        </div>
      </div>

      <div className="dash-hero card">
        <Ring value={o.overall} size={112} stroke={10} label={`Overall progress ${o.overall}%`} />
        <div className="dash-hero-body">
          <div className="card-title">Current topic</div>
          <h2 style={{ margin: 0 }}>
            <Link to={`/topic/${cur.id}`}>{cur.title}</Link>
          </h2>
          {rec.currentPattern && (
            <div className="muted small" style={{ marginTop: '0.2rem' }}>
              Pattern: <strong>{rec.currentPattern.name}</strong>
            </div>
          )}
          <div className="row small" style={{ margin: '0.6rem 0' }}>
            <span className="muted">Questions</span>
            <span className="mono">
              {cs.solved} / {cs.total} completed
            </span>
            <span className="muted">· Mastery {cs.mastery}%</span>
          </div>
          <ProgressBar value={cs.solved} max={cs.total || 1} label="Topic question progress" />
        </div>
        <div className="dash-next">
          <div className="card-title">Next up</div>
          <div className="dash-next-title">{rec.nextAction.label}</div>
          {rec.nextAction.question && (
            <div className="row small" style={{ margin: '0.25rem 0 0.75rem' }}>
              <DifficultyBadge difficulty={rec.nextAction.question.difficulty} />
            </div>
          )}
          <Link
            className="btn btn-primary"
            to={
              rec.nextAction.kind === 'question'
                ? `/topic/${rec.nextAction.topic.id}/q/${rec.nextAction.question.id}`
                : `/topic/${rec.nextAction.topic.id}`
            }
          >
            {rec.nextAction.kind === 'lesson' ? 'Continue learning' : rec.nextAction.kind === 'question' ? 'Solve it' : 'Go'} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>

      <div className="grid-4" style={{ margin: '1rem 0' }}>
        <StatCard icon="layers" label="Topics completed" value={`${o.topicsCompleted}/${o.topicsTotal}`} sub={`${o.topicsInProgress} in progress`} />
        <StatCard icon="puzzle" label="Patterns completed" value={`${o.patternsDone}/${o.totalPatterns}`} sub="lesson done + half its questions" />
        <StatCard icon="check" label="Questions solved" value={o.solved} sub={`${o.remaining} remaining of ${o.total}`} />
        <StatCard icon="flame" label="Learning streak" value={`${st.current} day${st.current === 1 ? '' : 's'}`} sub={st.activeToday ? 'Active today ✓' : `Longest: ${st.longest}`} />
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <h3>Difficulty progress</h3>
          </div>
          <DiffProgress byDiff={o.byDiff} />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recommended next topic</h3>
          </div>
          {rec.nextTopic ? (
            <>
              <Link to={`/topic/${rec.nextTopic.id}`} style={{ fontWeight: 650 }}>
                {rec.nextTopic.title}
              </Link>
              <p className="small muted" style={{ marginTop: '0.35rem' }}>
                {rec.nextTopic.description}
              </p>
              <div className="small">
                <span className="muted">Needs: </span>
                {rec.nextTopic.prerequisites.length ? rec.nextTopic.prerequisites.map((p) => topicById[p]?.title).join(', ') : 'nothing — start any time'}
              </div>
            </>
          ) : (
            <div className="muted small">You have unlocked every topic. 🎉</div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Weak areas</h3>
            <span className="spacer" />
            <Link to="/revision" className="small">
              Review
            </Link>
          </div>
          {weak.length === 0 ? (
            <div className="small muted">No weak areas yet. They appear here from checkpoint answers, pattern guesses and submissions.</div>
          ) : (
            <ul className="list-plain">
              {weak.map((w) => (
                <li key={w.topic.id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <Link to={`/topic/${w.topic.id}?tab=review`}>{w.topic.title}</Link>
                    <div className="small muted">{w.signals[0]}</div>
                  </div>
                  <span className="badge badge-danger">{Math.round(w.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recently solved</h3>
          </div>
          {recent.length === 0 ? (
            <div className="small muted">Solved questions will show up here.</div>
          ) : (
            <ul className="list-plain">
              {recent.map((q) => (
                <li key={q.id} className="list-row">
                  <Link to={`/topic/${q.topicId}/q/${q.id}`} style={{ flex: 1 }}>
                    {q.title}
                  </Link>
                  <DifficultyBadge difficulty={q.difficulty} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Company progress</h3>
            <span className="spacer" />
            <Link to="/companies" className="small">
              All
            </Link>
          </div>
          {companies.length === 0 ? (
            <div className="small muted">No company data loaded.</div>
          ) : (
            <div className="stack-sm">
              {companies.map((c) => (
                <div key={c.company.id}>
                  <div className="row small" style={{ justifyContent: 'space-between' }}>
                    <Link to={`/companies/${c.company.id}`}>{c.company.name}</Link>
                    <span className="mono muted">
                      {c.solved}/{c.total}
                    </span>
                  </div>
                  <ProgressBar value={c.solved} max={c.total || 1} size="sm" label={`${c.company.name} progress`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>The thought process</h3>
            <span className="spacer" />
            <Link to="/finder" className="small">
              Pattern Finder
            </Link>
          </div>
          <ol className="small thought-list">
            <li>What is the problem asking?</li>
            <li>What are the constraints?</li>
            <li>What pattern does it resemble?</li>
            <li>What technique &amp; data structure?</li>
            <li>What is the brute force?</li>
            <li>How can I optimise it?</li>
            <li>What is the time / space complexity?</li>
            <li>Can I implement it cleanly in JS?</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export function TopicMini({ topic, progress }) {
  const s = topicStats(topic, progress);
  return (
    <div className="small">
      {s.solved}/{s.total} · {s.mastery}%
    </div>
  );
}
