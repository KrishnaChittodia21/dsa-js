import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DiffProgress, ProgressBar } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { activityTotals, companyProgress, formatDuration, overallStats, streak, strongAreas, topicStats, topicStatus, weakAreas, pct } from '../state/selectors.js';
import { topics } from '../content/index.js';
import { todayKey } from '../state/progressReducer.js';
import Heatmap from '../components/charts/Heatmap.jsx';
import { C } from '../components/charts/core.js';
import { activityWeeks } from '../lib/dashMetrics.js';

const STATUS_TEXT = {
  completed: ['●', 'Completed'],
  'in-progress': ['◐', 'In progress'],
  available: ['○', 'Open'],
  locked: ['–', 'Locked'],
};

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
      setMsg('Backup imported — your marks are restored.');
    } catch (err) {
      setMsg(`That file didn't import: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="page page-wide rc ink-in">
      <header className="page-header rc-head">
        <div>
          <span className="eyebrow">Report card · {todayKey()}</span>
          <h1>
            How it's <em>going</em>
          </h1>
          <p>Kept in this browser only. Export a copy to carry it to another device, or to keep a backup before you reset.</p>
        </div>
      </header>

      <dl className="rc-marks">
        <div>
          <dt className="eyebrow">Overall mastery</dt>
          <dd className="rc-big">
            {o.overall}
            <span className="rc-unit">%</span>
          </dd>
          <dd className="rc-sub">
            {o.topicsCompleted} of {o.topicsTotal} topics finished
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Solved</dt>
          <dd className="rc-big">
            {o.solved}
            <span className="rc-unit">/{o.total}</span>
          </dd>
          <dd className="rc-sub">
            {a.submissions} submissions · {a.failedSubmissions} failed
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Checkpoints, first try</dt>
          <dd className="rc-big">
            {pct(a.checkpointsFirstTry, a.checkpointsAnswered)}
            <span className="rc-unit">%</span>
          </dd>
          <dd className="rc-sub">
            {a.checkpointsFirstTry} of {a.checkpointsAnswered} right first time
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Pattern spotting</dt>
          <dd className="rc-big">
            {pct(a.patternCorrect, a.patternGuesses)}
            <span className="rc-unit">%</span>
          </dd>
          <dd className="rc-sub">
            {a.patternCorrect} of {a.patternGuesses} named correctly
          </dd>
        </div>
      </dl>

      <div className="rc-row">
        <section className="rc-panel" aria-labelledby="rc-diff">
          <h2 id="rc-diff" className="rc-panel-h">
            By difficulty
          </h2>
          <DiffProgress byDiff={o.byDiff} />
        </section>
        <section className="rc-panel" aria-labelledby="rc-act">
          <h2 id="rc-act" className="rc-panel-h">
            Attendance
          </h2>
          <Heatmap weeks={activityWeeks(progress.activity, new Date(), 17)} colors={[C.ord1, C.ord2, C.ord3]} />
          <p className="rc-note">
            {st.current}-day streak · longest {st.longest} · {formatDuration(a.timeMs)} at the desk
          </p>
        </section>
        <section className="rc-panel rc-remarks" aria-labelledby="rc-rem">
          <h2 id="rc-rem" className="rc-panel-h">
            Teacher's remarks
          </h2>
          <h3 className="eyebrow rc-good">Strong</h3>
          {strong.length ? (
            <ul>
              {strong.map((s) => (
                <li key={s.topic.id}>
                  <Link to={`/topic/${s.topic.id}`}>{s.topic.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rc-note">Too early to say — a few more checkpoints and this fills in.</p>
          )}
          <h3 className="eyebrow rc-bad">Worth another look</h3>
          {weak.length ? (
            <ul>
              {weak.map((s) => (
                <li key={s.topic.id}>
                  <Link to={`/topic/${s.topic.id}?tab=review`}>{s.topic.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rc-note">Nothing flagged. Keep going.</p>
          )}
        </section>
      </div>

      <section className="rc-sec" aria-labelledby="rc-topics">
        <h2 id="rc-topics" className="rc-sec-h">
          Marks by topic
        </h2>
        <div className="rc-table-wrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Status</th>
                <th scope="col">Lesson</th>
                <th scope="col" className="rc-num">
                  E
                </th>
                <th scope="col" className="rc-num">
                  M
                </th>
                <th scope="col" className="rc-num">
                  H
                </th>
                <th scope="col" className="rc-num">
                  1st try
                </th>
                <th scope="col" className="rc-mastery-h">
                  Mastery
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => {
                const s = topicStats(t, progress);
                const status = topicStatus(t, progress);
                const [mark, label] = STATUS_TEXT[status] || STATUS_TEXT.available;
                return (
                  <tr key={t.id}>
                    <th scope="row">
                      <Link to={`/topic/${t.id}`}>{t.title}</Link>
                    </th>
                    <td className={`rc-status rc-status-${status}`}>
                      <span aria-hidden="true">{mark}</span> {label}
                    </td>
                    <td className="mono">{s.lessonCompleted ? '✓' : `${s.checkpointsPassed}/${s.checkpointsTotal}`}</td>
                    {['Easy', 'Medium', 'Hard'].map((d) => (
                      <td key={d} className="mono rc-num">
                        {s.byDiff[d].solved}/{s.byDiff[d].total}
                      </td>
                    ))}
                    <td className="mono rc-num">{s.checkpointsAnswered ? `${s.checkpointFirstTry}/${s.checkpointsAnswered}` : '—'}</td>
                    <td className="rc-mastery">
                      <ProgressBar value={s.mastery} size="sm" label={`${t.title} mastery`} />
                      <span className="mono">{s.mastery}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {comp.length > 0 && (
        <section className="rc-sec" aria-labelledby="rc-comp">
          <h2 id="rc-comp" className="rc-sec-h">
            By company
          </h2>
          <ul className="rc-companies">
            {comp.map((c) => (
              <li key={c.company.id}>
                <Link to={`/companies/${c.company.id}`}>
                  <span>{c.company.name}</span>
                  <span className="rc-dots" aria-hidden="true" />
                  <span className="folio">
                    {c.solved}/{c.total}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rc-records" aria-labelledby="rc-rec">
        <h2 id="rc-rec" className="eyebrow">
          Record keeping
        </h2>
        <div className="rc-records-actions">
          <button type="button" className="btn btn-sm" onClick={exportData}>
            Export a backup
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            Import a backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
          <button
            type="button"
            className="rf-textbtn rf-textbtn-danger"
            onClick={() => {
              if (window.confirm('Erase all progress? This cannot be undone — export a backup first.')) dispatch({ type: 'RESET_ALL' });
            }}
          >
            Erase all progress
          </button>
        </div>
        {msg && (
          <p className="rc-msg" role="status">
            {msg}
          </p>
        )}
      </section>
    </div>
  );
}
