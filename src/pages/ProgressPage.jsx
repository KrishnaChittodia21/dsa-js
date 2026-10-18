import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { activityTotals, companyProgress, formatDuration, overallStats, pct, recommendations, streak, strongAreas, topicStats, topicStatus, weakAreas } from '../state/selectors.js';
import { questionById, stages, topics } from '../content/index.js';
import { todayKey } from '../state/progressReducer.js';
import { activityWeeks, difficultySolved, stageProgress } from '../lib/dashMetrics.js';
import BigOChip, { bigoKey, firstBigO, topicShort, useQuestionComplexities } from '../components/BigOChip.jsx';

const WEEKS = 17;
const BIGO_ROWS = [
  ['1', 'O(1)', '--o1'],
  ['logn', 'O(log n)', '--ologn'],
  ['n', 'O(n)', '--on'],
  ['nlogn', 'O(n log n)', '--onlogn'],
  ['n2', 'O(n²)+', '--on2'],
  ['2n', 'O(2ⁿ)', '--o2n'],
  ['nf', 'O(n!)', '--onf'],
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = (k) => {
  const d = new Date(`${k}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const fmtTime = (at) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
function dayLabel(at, now) {
  const k = todayKey(new Date(at));
  if (k === todayKey(now)) return 'today';
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (k === todayKey(y)) return 'yesterday';
  const d = new Date(at);
  return `${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()]} ${d.getDate()}`;
}

function TopicTowers({ progress, currentId }) {
  const groups = stages.filter((s) => s.topics.length);
  const max = Math.max(1, ...topics.map((t) => t.questions.length));
  const u = max > 18 ? 7 : 9.5;
  return (
    <div className="pg-sky-scroll">
      <div className="pg-sky" role="img" aria-label={`Solved versus planned problems for all ${topics.length} topics, grouped by stage`} style={{ '--pu': `${u}px`, '--maxh': max }}>
        {groups.map((s) => {
          const solved = s.topics.reduce((a, t) => a + topicStats(t, progress).solved, 0);
          const total = s.topics.reduce((a, t) => a + t.questions.length, 0);
          return (
            <div key={s.id} className="pg-tw-stage" style={{ '--n': s.topics.length }}>
              <div className="pg-tw-cols">
                {s.topics.map((t) => {
                  const st = topicStats(t, progress);
                  const status = topicStatus(t, progress);
                  const tone = t.id === currentId ? 'cur' : status === 'completed' ? 'hot' : status === 'in-progress' ? 'warm' : status === 'available' ? 'cold' : 'lock';
                  return (
                    <Link key={t.id} to={`/topic/${t.id}`} className={`pg-tw pg-tw--${tone}`} title={`${t.title} · ${st.solved}/${st.total} solved · ${status}`} tabIndex={-1}>
                      <span className="pg-tw-v" style={{ '--s': st.solved }}>
                        {st.solved || ''}
                      </span>
                      {st.total > 0 && <div className="vox vox--ghost pg-tw-g" style={{ '--h': st.total }} />}
                      {st.solved > 0 && <div className="vox pg-tw-f" style={{ '--h': st.solved }} />}
                      <span className="pg-tw-n">{topicShort(t)}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="pg-tw-s">
                <span>{s.title}</span>
                <b>
                  {solved} / {total}
                </b>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Heat({ activity, now }) {
  const weeks = activityWeeks(activity, now, WEEKS);
  const months = weeks.map((w, i) => {
    const d = new Date(`${w[0].day}T00:00:00`);
    const prev = i ? new Date(`${weeks[i - 1][0].day}T00:00:00`) : null;
    return !prev || prev.getMonth() !== d.getMonth() ? MONTHS[d.getMonth()] : '';
  });
  return (
    <div className="pg-hm-wrap">
      <div className="pg-hm-days" aria-hidden="true">
        <span />
        {['M', '', 'W', '', 'F', '', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div>
        <div className="pg-hm-months" aria-hidden="true" style={{ '--w': WEEKS }}>
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="pg-hm-grid" role="img" aria-label={`Activity over the last ${WEEKS} weeks`}>
          {weeks.flat().map((c) => (
            <i key={c.day} className={`${c.future ? 'fut' : c.level ? `l${c.level}` : ''}${c.today ? ' today' : ''}`} title={c.future ? '' : `${c.day} · ${c.count} action${c.count === 1 ? '' : 's'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { progress, dispatch } = useProgress();
  const now = useMemo(() => new Date(), []);
  const o = overallStats(progress);
  const a = activityTotals(progress);
  const st = streak(progress);
  const weak = weakAreas(progress);
  const strong = strongAreas(progress);
  const comp = companyProgress(progress);
  const rec = useMemo(() => recommendations(progress), [progress]);
  const stagesP = useMemo(() => stageProgress(progress, stages), [progress]);
  const diffs = difficultySolved(progress, topics);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const states = Object.entries(progress.questions).filter(([id]) => questionById[id]);
  const attempted = states.filter(([, s]) => s.status === 'attempted').length;
  const solvedIds = states.filter(([, s]) => s.status === 'solved').map(([id]) => id);
  const history = states
    .filter(([, s]) => s.lastResult?.at)
    .sort((x, y) => y[1].lastResult.at - x[1].lastResult.at)
    .slice(0, 9);
  const { map: cx, loading: cxLoading } = useQuestionComplexities([...new Set([...solvedIds, ...history.map(([id]) => id)])].sort());
  const mix = useMemo(() => {
    const m = Object.fromEntries(BIGO_ROWS.map(([k]) => [k, 0]));
    for (const id of solvedIds) if (cx[id]?.time) m[bigoKey(cx[id].time)]++;
    return m;
  }, [cx, solvedIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const mixTotal = Object.values(mix).reduce((s, n) => s + n, 0);
  const quadratic = mix.n2 + mix['2n'] + mix.nf;
  const activeDays = Object.keys(progress.activity || {}).filter((k) => progress.activity[k] > 0).sort();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dsa-journey-progress-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Backup downloaded.' });
  };
  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !data.questions) throw new Error('Not a DSA Journey progress file');
      dispatch({ type: 'IMPORT', state: data });
      setMsg({ ok: true, text: 'Progress imported.' });
    } catch (err) {
      setMsg({ ok: false, text: `Import failed: ${err.message}` });
    }
    e.target.value = '';
  };

  let lastDay = null;
  const curStage = stages.findIndex((s) => s.topics.some((t) => t.id === rec.current?.id));

  return (
    <div className="page pg-page">
      <section className="pg-head rise" aria-labelledby="pg-t">
        <div>
          <span className="eyebrow">
            <i className="pip" />
            Progress · stored locally in this browser
          </span>
          <h1 id="pg-t" className="display display--s chrome pg-title">
            Your progress
          </h1>
          <p className="pg-sub">Everything lives in your browser. Export a backup to move it between devices.</p>
        </div>
        <div className="pg-acts">
          <button type="button" className="btn btn--ghost btn--sm" onClick={exportData}>
            <Icon name="download" size={15} /> Export
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={15} /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => {
              if (window.confirm('Delete ALL progress? This cannot be undone (export a backup first).')) {
                dispatch({ type: 'RESET_ALL' });
                setMsg({ ok: true, text: 'All progress was reset.' });
              }
            }}
          >
            Reset
          </button>
        </div>
      </section>
      {msg && (
        <div className={`pg-msg ${msg.ok ? 'pg-msg--ok' : 'pg-msg--bad'}`} role="status">
          {msg.text}
        </div>
      )}

      <div className="pg-stat4">
        <div className="tile pg-stat rise" style={{ '--i': 1 }}>
          <span className="eyebrow">
            <i className="pip" />
            overall mastery
          </span>
          <div>
            <span className="num chrome">{o.overall}</span>
            <span className="of">%</span>
          </div>
          <span className="small">
            {o.topicsCompleted} / {o.topicsTotal} topics completed
          </span>
          <div className="meter" style={{ '--v': `${o.overall}%` }}>
            <i />
          </div>
        </div>
        <div className="tile pg-stat rise" style={{ '--i': 2 }}>
          <span className="eyebrow">
            <i className="pip pip--ice" />
            solved
          </span>
          <div>
            <span className="num">{o.solved}</span>
            <span className="of">/ {o.total}</span>
          </div>
          <span className="small">
            {a.submissions} submissions · {a.failedSubmissions} failed
          </span>
          <div className="meter meter--ice" style={{ '--v': `${pct(o.solved, o.total)}%` }}>
            <i />
          </div>
        </div>
        <div className="tile pg-stat rise" style={{ '--i': 3 }}>
          <span className="eyebrow">
            <i className="pip pip--uv" />
            checkpoints
          </span>
          <div>
            <span className="num">{a.checkpointsAnswered ? pct(a.checkpointsFirstTry, a.checkpointsAnswered) : '—'}</span>
            {a.checkpointsAnswered > 0 && <span className="of">%</span>}
          </div>
          <span className="small">
            {a.checkpointsFirstTry} / {a.checkpointsAnswered} correct on first try
          </span>
          <div className="meter meter--uv" style={{ '--v': `${pct(a.checkpointsFirstTry, a.checkpointsAnswered)}%` }}>
            <i />
          </div>
        </div>
        <div className="tile pg-stat rise" style={{ '--i': 4 }}>
          <span className="eyebrow">
            <i className="pip pip--volt" />
            pattern recognition
          </span>
          <div>
            <span className="num">{a.patternGuesses ? pct(a.patternCorrect, a.patternGuesses) : '—'}</span>
            {a.patternGuesses > 0 && <span className="of">%</span>}
          </div>
          <span className="small">
            {a.patternCorrect} / {a.patternGuesses} identified correctly
          </span>
          <div className="meter" style={{ '--v': `${pct(a.patternCorrect, a.patternGuesses)}%` }}>
            <i />
          </div>
        </div>
      </div>

      <div className="grid pg-grid">
        <section className="tile c-8 rise" style={{ '--i': 5 }} aria-labelledby="pg-sky-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip" />
                By topic · {topics.length} towers · 1 cube = 1 problem
              </span>
              <h2 id="pg-sky-t" className="h2" style={{ marginTop: 12 }}>
                Solved per topic
              </h2>
            </div>
            <span className="tag">ghost = planned</span>
          </div>
          <TopicTowers progress={progress} currentId={rec.current?.id} />
          <div className="pg-sky-legend">
            <span>
              <i className="cube" style={{ '--c': '#FF5A4E' }} />
              completed topic
            </span>
            <span>
              <i className="cube" style={{ '--c': '#FF7A3D' }} />
              in progress
            </span>
            <span>
              <i className="cube" style={{ '--c': '#7B5CFF' }} />
              current
            </span>
            <span>
              <i className="cube" style={{ '--c': '#45B9DD' }} />
              unlocked
            </span>
            <span>
              <i className="cube" style={{ '--c': 'var(--surface-3)' }} />
              planned, not solved
            </span>
          </div>
        </section>

        <section className="tile c-4 rise" style={{ '--i': 6 }} aria-labelledby="pg-dt-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--ice" />
                By difficulty · 10 cubes = 100%
              </span>
              <h2 id="pg-dt-t" className="h2" style={{ marginTop: 12 }}>
                {o.solved} of {o.total}
              </h2>
            </div>
          </div>
          <div className="pg-dts">
            {diffs.map((d) => (
              <div key={d.level} className={`pg-dt pg-dt--${d.level.toLowerCase()}`}>
                <span className="pg-dt-pct">{d.pct}%</span>
                <div className="pg-dt-stack">
                  <div className="vox vox--ghost" style={{ '--h': 10 }} />
                  {d.solved > 0 && <div className="vox pg-dt-f" style={{ '--h': Math.max(0.15, (d.solved / d.total) * 10) }} />}
                </div>
                <span className={`chip chip--${d.level === 'Medium' ? 'med' : d.level.toLowerCase()}`}>
                  <span className="diff-pips">
                    <i />
                    <i />
                    <i />
                  </span>
                  {d.level}
                </span>
                <span className="pg-dt-n">
                  {d.solved} <em>/ {d.total}</em>
                </span>
              </div>
            ))}
          </div>
          <div className="row row--wrap" style={{ marginTop: 22, gap: 8 }}>
            <span className="chip chip--solved">{o.solved} solved</span>
            <span className="chip chip--attempted">{attempted} attempted</span>
            <span className="chip chip--todo">{o.total - o.solved - attempted} to do</span>
          </div>
        </section>

        <section className="tile c-5 rise" style={{ '--i': 7 }} aria-labelledby="pg-bo-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--ice" />
                Big-O mix · 1 cube = 1 solved problem
              </span>
              <h2 id="pg-bo-t" className="h2" style={{ marginTop: 12 }}>
                How your problems scale
              </h2>
            </div>
          </div>
          {solvedIds.length === 0 ? (
            <p className="pg-none">Solve a problem and its optimal time complexity lands here.</p>
          ) : cxLoading && !mixTotal ? (
            <p className="pg-none mono">loading complexities…</p>
          ) : (
            <>
              <div>
                {BIGO_ROWS.filter(([k]) => mix[k] > 0 || ['1', 'logn', 'n', 'nlogn', 'n2'].includes(k)).map(([k, label, v]) => (
                  <div key={k} className="pg-bo-row" style={{ '--c': `var(${v})` }}>
                    <span className={`bigo bigo--${k}`}>{label}</span>
                    <div className="pg-bo-cubes">
                      {Array.from({ length: Math.min(mix[k], 60) }, (_, i) => (
                        <i key={i} />
                      ))}
                      {mix[k] > 60 && <span className="mono">+{mix[k] - 60}</span>}
                    </div>
                    <b>{mix[k]}</b>
                  </div>
                ))}
              </div>
              <div className="pg-insight">
                Reference (optimal) time complexity of the <b>{mixTotal}</b> problems you solved
                {quadratic > 0 ? (
                  <>
                    {' '}
                    — <b>{quadratic}</b> need quadratic time or worse even when solved optimally.
                  </>
                ) : (
                  <> — every one of them runs in O(n log n) or better.</>
                )}
              </div>
            </>
          )}
        </section>

        <section className="tile c-7 rise" style={{ '--i': 8 }} aria-labelledby="pg-act-t">
          <div className="tile-head">
            <span className="eyebrow" id="pg-act-t">
              <i className="pip pip--acid" />
              Activity · last {WEEKS} weeks
            </span>
            <span className="tag">time practising {formatDuration(a.timeMs)}</span>
          </div>
          <div className="pg-act">
            <div className="pg-act-top">
              <span className="display chrome">{st.current}</span>
              <div className="pg-act-sub">
                day streak{st.activeToday ? '' : ' · not active today yet'}
                <br />
                best <b>{st.longest}</b> days
                <br />
                active <b>{activeDays.length}</b> days
                {activeDays.length > 0 && (
                  <>
                    <br />
                    since <b>{fmtDay(activeDays[0])}</b>
                  </>
                )}
              </div>
            </div>
            <Heat activity={progress.activity} now={now} />
          </div>
          <div className="pg-hm-foot">
            <span>
              today: {fmtDay(todayKey(now))} · {progress.activity?.[todayKey(now)] || 0} recorded actions
            </span>
            <span className="pg-hm-scale" aria-hidden="true">
              less <i className="l0" />
              <i className="l1" />
              <i className="l2" />
              <i className="l3" /> more
            </span>
          </div>
        </section>

        <section className="tile c-6 rise" style={{ '--i': 9 }} aria-labelledby="pg-st-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--uv" />
                Mastery per stage
              </span>
              <h2 id="pg-st-t" className="h2" style={{ marginTop: 12 }}>
                {stagesP.length} stages
              </h2>
            </div>
            <Link className="tile-link" to="/path">
              Path <Icon name="arrowRight" size={13} />
            </Link>
          </div>
          {stagesP.map((s, i) => {
            const locked = stages[i].topics.every((t) => topicStatus(t, progress) === 'locked');
            const cur = i === curStage;
            const lit = Math.round(s.mastery / 10);
            return (
              <div key={s.id} className={`pg-st-row${cur ? ' pg-st-row--cur' : ''}${locked ? ' pg-st-row--lock' : ''}`}>
                <span className="pg-sc">S{String(s.number).padStart(2, '0')}</span>
                <div>
                  <div className="pg-nm">
                    <span>{s.title}</span>
                    <small>
                      {s.completed} / {s.total} topics · {s.solved}/{s.questions} solved
                    </small>
                  </div>
                  <div className="vmeter" style={{ '--c': cur ? 'var(--uv)' : 'var(--plasma)' }} role="img" aria-label={`${s.mastery}% mastery`}>
                    {Array.from({ length: 10 }, (_, k) => (
                      <i key={k} className={k < lit ? 'on' : undefined} />
                    ))}
                  </div>
                </div>
                <span className="pg-pc">{s.mastery}%</span>
              </div>
            );
          })}
          <div className="pg-sw">
            <div>
              <span className="eyebrow">strong</span>
              <div className="row row--wrap">
                {strong.length ? (
                  strong.map((s) => (
                    <Link key={s.topic.id} to={`/topic/${s.topic.id}`} className="chip pg-chip-good">
                      {s.topic.title}
                    </Link>
                  ))
                ) : (
                  <span className="pg-none">Not enough data yet</span>
                )}
              </div>
            </div>
            <div>
              <span className="eyebrow">needs work</span>
              <div className="row row--wrap">
                {weak.length ? (
                  weak.map((s) => (
                    <Link key={s.topic.id} to={`/topic/${s.topic.id}?tab=review`} className="chip pg-chip-bad">
                      {s.topic.title}
                    </Link>
                  ))
                ) : (
                  <span className="pg-none">Nothing flagged</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="tile c-6 rise" style={{ '--i': 10 }} aria-labelledby="pg-log-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--volt" />
                Attempt history
              </span>
              <h2 id="pg-log-t" className="h2" style={{ marginTop: 12 }}>
                Latest results
              </h2>
            </div>
            <span className="tag">{a.submissions} submissions</span>
          </div>
          {history.length === 0 ? (
            <p className="pg-none">Run or submit a solution and its latest result shows up here.</p>
          ) : (
            <div className="pg-log">
              {history.map(([id, s]) => {
                const q = questionById[id];
                const lr = s.lastResult;
                const pass = lr.total > 0 && lr.passed === lr.total;
                const day = dayLabel(lr.at, now);
                const showDay = day !== lastDay;
                lastDay = day;
                const extra = [];
                if (lr.kind === 'run') extra.push('run');
                if (s.submissions) extra.push(`${s.submissions} submission${s.submissions === 1 ? '' : 's'}`);
                if (s.status === 'solved' && s.solvedWithoutSolution) extra.push('no solution peek');
                return (
                  <div key={id} className="pg-ev-group">
                    {showDay && (
                      <div className="pg-ev pg-ev--day">
                        <span className="pg-t">{day}</span>
                      </div>
                    )}
                    <Link to={`/topic/${q.topicId}/q/${id}`} className={`pg-ev ${pass ? 'pg-ev--pass' : 'pg-ev--fail'}`}>
                      <span className="pg-t">{fmtTime(lr.at)}</span>
                      <span className="pg-dot" />
                      <div>
                        <b>{q.title}</b>
                        <small>
                          <span className={pass ? 'pg-good' : 'pg-bad'}>
                            {lr.passed} / {lr.total} tests
                          </span>
                          {extra.length > 0 && ` · ${extra.join(' · ')}`}
                        </small>
                      </div>
                      {cx[id]?.time ? <BigOChip value={cx[id].time} label={firstBigO(cx[id].time)} sm /> : <span />}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {comp.length > 0 && (
          <section className="tile c-12 rise" style={{ '--i': 11 }} aria-labelledby="pg-co-t">
            <div className="tile-head">
              <div>
                <span className="eyebrow">
                  <i className="pip pip--ice" />
                  By company · sourced lists
                </span>
                <h2 id="pg-co-t" className="h2" style={{ marginTop: 12 }}>
                  Company readiness
                </h2>
              </div>
              <Link className="tile-link" to="/companies">
                Companies <Icon name="arrowRight" size={13} />
              </Link>
            </div>
            <div className="pg-co">
              {comp.map((c) => (
                <Link key={c.company.id} to={`/companies/${c.company.id}`} className="pg-co-row">
                  <span className="mono-badge">{c.company.name.slice(0, 2)}</span>
                  <div>
                    <div className="pg-co-nm">
                      <b>{c.company.name}</b>
                      <span className="mono">
                        {c.solved} / {c.total}
                      </span>
                    </div>
                    <div className="meter meter--uv" style={{ '--v': `${pct(c.solved, c.total)}%` }}>
                      <i />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <details className="details pg-table">
        <summary>Every topic in detail (status, learning, Easy / Medium / Hard, checkpoints, mastery)</summary>
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
                <th>1st-try</th>
                <th>Mastery</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => {
                const s = topicStats(t, progress);
                const status = topicStatus(t, progress);
                return (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/topic/${t.id}`}>{t.title}</Link>
                    </td>
                    <td className="mono small">{status}</td>
                    <td className="mono small">{s.lessonCompleted ? 'done' : `${s.checkpointsPassed}/${s.checkpointsTotal}`}</td>
                    {['Easy', 'Medium', 'Hard'].map((d) => (
                      <td key={d} className="mono small">
                        {s.byDiff[d].solved}/{s.byDiff[d].total}
                      </td>
                    ))}
                    <td className="mono small">{s.checkpointsAnswered ? `${s.checkpointFirstTry}/${s.checkpointsAnswered}` : '—'}</td>
                    <td>
                      <div className="pg-mastery">
                        <div className="meter" style={{ '--v': `${s.mastery}%` }}>
                          <i />
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
      </details>
    </div>
  );
}
