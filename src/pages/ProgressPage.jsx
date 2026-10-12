import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { DiffProgress, ProgressBar, StatCard, StatusBadge } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { activityTotals, companyProgress, formatDuration, overallStats, streak, strongAreas, topicStats, topicStatus, weakAreas, pct } from '../state/selectors.js';
import { topics } from '../content/index.js';
import { todayKey } from '../state/progressReducer.js';

function ActivityHeatmap({ activity }) {
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 7 * 17 + 1);
  for (let i = 0; i < 7 * 17; i++) {
    const k = todayKey(d);
    days.push({ k, n: activity[k] || 0 });
    d.setDate(d.getDate() + 1);
  }
  const level = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  return (
    <div className="heatmap" role="img" aria-label="Activity over the last 17 weeks">
      {days.map((x) => (
        <span key={x.k} className={`heat heat-${level(x.n)}`} title={`${x.k}: ${x.n} actions`} />
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const { progress, dispatch } = useProgress();
  const o = overallStats(progress);
  const a = activityTotals(progress);
  const st = streak(progress);
  const weak = weakAreas(progress);
  const strong = strongAreas(progress);
  const comp = companyProgress(progress);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dsa-journey-progress-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !data.questions) throw new Error('Not a DSA Journey progress file');
      dispatch({ type: 'IMPORT', state: data });
      setMsg('Progress imported.');
    } catch (err) {
      setMsg(`Import failed: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Progress</h1>
          <p>Everything is stored locally in your browser. Export a backup to move it between devices.</p>
        </div>
        <span className="spacer" />
        <button type="button" className="btn btn-sm" onClick={exportData}>
          <Icon name="download" size={14} /> Export
        </button>
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            if (window.confirm('Delete ALL progress? This cannot be undone (export a backup first).')) dispatch({ type: 'RESET_ALL' });
          }}
        >
          Reset
        </button>
      </div>
      {msg && <div className="small" style={{ marginBottom: '1rem' }}>{msg}</div>}

      <div className="grid-4">
        <StatCard icon="target" label="Overall mastery" value={`${o.overall}%`} sub={`${o.topicsCompleted}/${o.topicsTotal} topics completed`} />
        <StatCard icon="check" label="Solved" value={`${o.solved}/${o.total}`} sub={`${a.submissions} submissions · ${a.failedSubmissions} failed`} />
        <StatCard icon="help" label="Checkpoints" value={`${pct(a.checkpointsFirstTry, a.checkpointsAnswered)}%`} sub={`${a.checkpointsFirstTry}/${a.checkpointsAnswered} correct on first try`} />
        <StatCard icon="puzzle" label="Pattern recognition" value={`${pct(a.patternCorrect, a.patternGuesses)}%`} sub={`${a.patternCorrect}/${a.patternGuesses} identified correctly`} />
      </div>

      <div className="grid-3" style={{ marginTop: '1rem' }}>
        <div className="card">
          <h3>Difficulty</h3>
          <DiffProgress byDiff={o.byDiff} />
        </div>
        <div className="card">
          <h3>Activity</h3>
          <ActivityHeatmap activity={progress.activity} />
          <div className="small muted" style={{ marginTop: '0.5rem' }}>
            Streak {st.current} day(s) · longest {st.longest} · time practising {formatDuration(a.timeMs)}
          </div>
        </div>
        <div className="card">
          <h3>Strong & weak</h3>
          <div className="small" style={{ fontWeight: 600, color: 'var(--success)' }}>
            Strong
          </div>
          <div className="row-wrap" style={{ margin: '0.25rem 0 0.75rem' }}>
            {strong.length ? strong.map((s) => <Link key={s.topic.id} to={`/topic/${s.topic.id}`} className="badge badge-success">{s.topic.title}</Link>) : <span className="small faint">Not enough data yet</span>}
          </div>
          <div className="small" style={{ fontWeight: 600, color: 'var(--danger)' }}>
            Needs work
          </div>
          <div className="row-wrap" style={{ marginTop: '0.25rem' }}>
            {weak.length ? weak.map((s) => <Link key={s.topic.id} to={`/topic/${s.topic.id}?tab=review`} className="badge badge-danger">{s.topic.title}</Link>) : <span className="small faint">Nothing flagged</span>}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>By topic</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Status</th>
              <th>Learning</th>
              <th>Easy</th>
              <th>Medium</th>
              <th>Hard</th>
              <th>Checkpoints (1st try)</th>
              <th style={{ width: 160 }}>Mastery</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => {
              const s = topicStats(t, progress);
              return (
                <tr key={t.id}>
                  <td>
                    <Link to={`/topic/${t.id}`}>{t.title}</Link>
                  </td>
                  <td>
                    <StatusBadge status={topicStatus(t, progress)} />
                  </td>
                  <td className="small">{s.lessonCompleted ? '✓' : `${s.checkpointsPassed}/${s.checkpointsTotal}`}</td>
                  {['Easy', 'Medium', 'Hard'].map((d) => (
                    <td key={d} className="mono small">
                      {s.byDiff[d].solved}/{s.byDiff[d].total}
                    </td>
                  ))}
                  <td className="mono small">{s.checkpointsAnswered ? `${s.checkpointFirstTry}/${s.checkpointsAnswered}` : '—'}</td>
                  <td>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={s.mastery} size="sm" label={`${t.title} mastery`} />
                      </div>
                      <span className="mono small">{s.mastery}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {comp.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>By company</h2>
          <div className="grid-4">
            {comp.map((c) => (
              <Link key={c.company.id} to={`/companies/${c.company.id}`} className="card card-tight card-link">
                <div className="row small" style={{ justifyContent: 'space-between' }}>
                  <strong>{c.company.name}</strong>
                  <span className="mono muted">
                    {c.solved}/{c.total}
                  </span>
                </div>
                <ProgressBar value={c.solved} max={c.total || 1} size="sm" label={`${c.company.name}`} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
