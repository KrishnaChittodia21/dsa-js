import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { missedCheckpoints, mistakeQuestions, topicStats, topicStatus, weakAreas } from '../state/selectors.js';
import { patternById, topics } from '../content/index.js';

const DAY = 86400000;
const LESSON_INTERVALS = [1, 3, 7, 21, 60]; // spaced checks after a lesson is completed (days)
const DIFF_CHIP = { Easy: 'chip--easy', Medium: 'chip--med', Hard: 'chip--hard' };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const shortName = (name = '') => name.replace(/^.*?—\s*/, '');

function DiffChip({ d }) {
  return (
    <span className={`chip ${DIFF_CHIP[d] || ''}`}>
      <span className="diff-pips">
        <i />
        <i />
        <i />
      </span>
      {d}
    </span>
  );
}
function StatusChip({ status }) {
  if (status === 'solved') return <span className="chip chip--solved">Solved</span>;
  if (status === 'attempted') return <span className="chip chip--attempted">Attempted</span>;
  return <span className="chip chip--todo">To do</span>;
}
const dueLabel = (d) => (d <= 0 ? 'due today' : d === 1 ? 'tomorrow' : `in ${d} days`);

/** why a question is in the retry list, from the recorded signals */
function retryReasons(st) {
  const r = [];
  if (st.failedSubmissions) {
    const lr = st.lastResult;
    r.push(`${plural(st.failedSubmissions, 'failed submission')}${st.status !== 'solved' && lr?.total ? ` — last run ${lr.passed}/${lr.total} tests` : ''}`);
  }
  if (st.patternGuess?.correct === false) r.push('pattern challenge missed on the first guess');
  if (st.solutionViewedBeforeSolve) r.push('solution opened before solving — re-solve it clean');
  return r;
}

/**
 * The revision queue: the app's three real revision sources (questions to retry, weak areas,
 * completed lessons) merged into one FIFO-ish queue ordered by when each item is due.
 */
function buildQueue(progress, now) {
  const items = [];
  for (const q of mistakeQuestions(progress)) {
    const st = progress.questions[q.id];
    const solved = st.status === 'solved';
    const since = st.solvedAt ? Math.floor((now - st.solvedAt) / DAY) : 0;
    const due = solved ? Math.max(0, 7 - since) : 0;
    items.push({
      key: `q:${q.id}`,
      kind: 'retry',
      title: q.title,
      why: retryReasons(st).join(' · ') || 'flagged for another pass',
      due,
      rank: solved ? 2 : 0,
      to: `/topic/${q.topicId}/q/${q.id}`,
      difficulty: q.difficulty,
      status: st.status,
      pattern: shortName(patternById[q.pattern]?.name),
    });
  }
  for (const w of weakAreas(progress)) {
    items.push({
      key: `w:${w.topic.id}`,
      kind: 'weak',
      title: w.topic.title,
      why: `Review tab · score ${Math.round(w.score * 100)}%${w.signals[0] ? ` · ${w.signals[0].toLowerCase()}` : ''}`,
      due: 0,
      rank: 1,
      to: `/topic/${w.topic.id}?tab=review`,
    });
  }
  for (const t of topics) {
    const tp = progress.topics[t.id];
    if (!tp?.lessonCompleted) continue;
    const since = tp.completedLessonAt ? Math.floor((now - tp.completedLessonAt) / DAY) : 0;
    const next = LESSON_INTERVALS.find((i) => i >= since) ?? LESSON_INTERVALS[LESSON_INTERVALS.length - 1] * Math.ceil((since + 1) / 60);
    const missed = missedCheckpoints(progress, t).length;
    const due = Math.max(0, next - since - missed);
    items.push({
      key: `l:${t.id}`,
      kind: 'lesson',
      title: t.title,
      why: `${missed ? `${plural(missed, 'missed checkpoint')} · ` : ''}lesson done ${since === 0 ? 'today' : `${since}d ago`} · spaced check day ${next}`,
      due,
      rank: 3,
      to: `/topic/${t.id}?tab=review`,
    });
  }
  return items.sort((a, b) => a.due - b.due || a.rank - b.rank || a.title.localeCompare(b.title));
}

const KIND_LABEL = { retry: 'retry', weak: 'weak area', lesson: 'lesson' };

function Slab({ item, index, front, wait }) {
  return (
    <Link to={item.to} className={`rv-slab${front ? ' rv-slab--front' : ''}${wait ? ' rv-slab--wait' : ''}`} aria-label={`${front ? 'Front of the queue: ' : ''}${item.title} — ${KIND_LABEL[item.kind]}, ${dueLabel(item.due)}`}>
      {front && <span className="rv-head-tag">NEXT</span>}
      <div className="rv-qi">
        <span>[{index}]</span>
        <span className={item.due <= 0 ? 'rv-due' : 'rv-due rv-due--later'}>{wait ? (item.due <= 0 ? 'today' : `+${item.due}d`) : dueLabel(item.due)}</span>
      </div>
      <span className={`rv-kind rv-kind--${item.kind}`}>
        <i className="cube" />
        {KIND_LABEL[item.kind]}
      </span>
      <h4>{item.title}</h4>
      {!wait && <p className="rv-why">{item.why}</p>}
      {!wait && item.kind === 'retry' && (
        <div className="rv-chips">
          <DiffChip d={item.difficulty} />
          <StatusChip status={item.status} />
        </div>
      )}
    </Link>
  );
}

export default function RevisionPage() {
  const { progress } = useProgress();
  const [allRetry, setAllRetry] = useState(false);
  const now = Date.now();
  const queue = useMemo(() => buildQueue(progress, now), [progress]); // eslint-disable-line react-hooks/exhaustive-deps
  const weak = useMemo(() => weakAreas(progress), [progress]);
  const mistakes = useMemo(() => mistakeQuestions(progress), [progress]);
  const studied = topics.filter((t) => ['completed', 'in-progress'].includes(topicStatus(t, progress)) && topicStats(t, progress).lessonCompleted);
  const missedTotal = studied.reduce((s, t) => s + missedCheckpoints(progress, t).length, 0);
  const dueToday = queue.filter((i) => i.due <= 0);
  const dueWeek = queue.filter((i) => i.due > 0 && i.due <= 7);
  const front = queue[0];
  const track = queue.slice(0, 5);
  const waiting = queue.slice(5, 7);
  const more = Math.max(0, queue.length - 7);

  return (
    <div className="page rv-page">
      <section className="tile tile--glow rv-hero rise" aria-labelledby="rv-t">
        <div className="rv-hero-l">
          <div className="row row--wrap" style={{ gap: 10 }}>
            <span className="chip rv-chip-ice">
              <i className="pip pip--ice" />
              Revision · spaced review
            </span>
            <span className="tag">queue.length = {queue.length}</span>
          </div>
          <h1 id="rv-t" className="display chrome rv-title">
            Revise
            <br />
            &amp; recall<span className="rv-dot">.</span>
          </h1>
          <p className="lead">
            Spaced review beats re-reading. Your queue mixes the app’s three revision sources: <b>questions to retry</b>, <b>weak areas</b> and <b>completed lessons</b> — ordered by when each one is due.
          </p>
          <div className="rv-kpis">
            <div>
              <span className="eyebrow">due today</span>
              <span className="num">{dueToday.length}</span>
              <span className="small">{dueWeek.length} more this week</span>
            </div>
            <div>
              <span className="eyebrow">weak areas</span>
              <span className={`num${weak.length ? ' t-plasma' : ''}`}>{weak.length}</span>
              <span className="small">score under 65%</span>
            </div>
            <div>
              <span className="eyebrow">to retry</span>
              <span className="num">{mistakes.length}</span>
              <span className="small">failed, mis-spotted or peeked</span>
            </div>
            <div>
              <span className="eyebrow">lessons to skim</span>
              <span className="num">{studied.length}</span>
              <span className="small">{plural(missedTotal, 'missed checkpoint')}</span>
            </div>
          </div>
        </div>

        <aside className="tile tile--raised tile--hot rv-drill" aria-label="Drill the queue">
          <div className="eyebrow rv-drill-eb">
            <span>dequeue()</span>
            <span className="t-ice">front · [0]</span>
          </div>
          {front ? (
            <>
              <div className="rv-sig mono">
                <span className="k">const</span> item = revision.<span className="f">dequeue</span>();
                <br />
                <span className="c">
                  // → {KIND_LABEL[front.kind]} · {front.title}
                </span>
              </div>
              <h3>{front.title}</h3>
              <div className="rv-chips">
                {front.kind === 'retry' ? (
                  <>
                    <DiffChip d={front.difficulty} />
                    <StatusChip status={front.status} />
                    {front.pattern && <span className="tag">{front.pattern}</span>}
                  </>
                ) : (
                  <span className="tag">{front.kind === 'weak' ? 'weak area · review tab' : 'completed lesson · review tab'}</span>
                )}
              </div>
              <p className="rv-drill-why">{front.why}</p>
              <div>
                <div className="row row--between" style={{ marginBottom: 8 }}>
                  <span className="small">{dueToday.length ? `Drill the ${plural(dueToday.length, 'item')} due today` : 'Nothing due today — get ahead'}</span>
                  <span className="mono small">
                    0 / {Math.max(dueToday.length, 1)}
                  </span>
                </div>
                <div className="rv-plan" style={{ '--n': Math.min(Math.max(dueToday.length, 1), 12) }}>
                  {Array.from({ length: Math.min(Math.max(dueToday.length, 1), 12) }, (_, i) => (
                    <i key={i} className={i === 0 ? 'on' : undefined} />
                  ))}
                </div>
              </div>
              <div className="rv-drill-foot">
                <Link className="btn btn--plasma" to={front.to}>
                  Start drill <Icon name="play" size={18} />
                </Link>
                <Link className="btn btn--ghost" to="/cheatsheet">
                  Cheat sheet
                </Link>
              </div>
              {queue.length > 1 && (
                <div className="rv-after">
                  {queue.slice(1, 3).map((it, i) => (
                    <span key={it.key}>
                      <b>
                        then [{i + 1}] {it.title}
                      </b>
                      <span>{KIND_LABEL[it.kind]}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3>The queue is empty</h3>
              <p className="rv-drill-why">Finish a lesson or attempt a few questions — anything you fail, mis-spot or peek at gets enqueued here automatically.</p>
              <div className="rv-drill-foot">
                <Link className="btn btn--plasma" to="/path">
                  Continue the path <Icon name="arrowRight" size={18} />
                </Link>
              </div>
            </>
          )}
        </aside>
      </section>

      <section className="section rise" style={{ '--i': 1 }} aria-labelledby="rv-q-t">
        <div className="rv-qhead">
          <div>
            <span className="eyebrow">revision: Queue&lt;Item&gt; · first in, first out</span>
            <h2 id="rv-q-t" className="h1" style={{ marginTop: 10 }}>
              front → rear
            </h2>
          </div>
          <div className="rv-legend" aria-label="Item kinds">
            <span>
              <i className="cube" style={{ '--c': 'var(--volt)' }} />
              question to retry
            </span>
            <span>
              <i className="cube" style={{ '--c': 'var(--plasma)' }} />
              weak area
            </span>
            <span>
              <i className="cube" style={{ '--c': 'var(--ice)' }} />
              completed lesson
            </span>
          </div>
        </div>
        {queue.length === 0 ? (
          <div className="tile rv-empty">
            <b>Nothing enqueued yet.</b> Questions you fail, mis-identify or peek at, weak topics and finished lessons will line up here, ordered by when they are due.
          </div>
        ) : (
          <>
            <div className={`rv-track${waiting.length ? '' : ' rv-track--nowait'}`} style={{ '--n': track.length, '--w': waiting.length }}>
              <div className="rv-port rv-port--out" aria-hidden="true">
                <span className="rv-ptr rv-ptr--front">front</span>
                <Icon name="arrowRight" size={20} />
                <span>dequeue</span>
                <span className="rv-op">.shift()</span>
              </div>
              {track.map((it, i) => (
                <Slab key={it.key} item={it} index={i} front={i === 0} />
              ))}
              {waiting.length > 0 && (
                <div className="rv-qsep" aria-hidden="true">
                  <i />
                  <span>waiting</span>
                  <i />
                </div>
              )}
              {waiting.map((it, i) => (
                <Slab key={it.key} item={it} index={i + 5} wait />
              ))}
              <div className="rv-port" aria-hidden="true">
                <span className="rv-ptr rv-ptr--rear">rear</span>
                <Icon name="refresh" size={20} />
                <span>enqueue</span>
                <span className="rv-op">.push()</span>
              </div>
            </div>
            <div className="rv-ops">
              <span>
                Solve an item to <b>dequeue</b> it · fail it again and it is <b>re-enqueued</b> at the rear.
                {more > 0 && ` ${more} more item${more === 1 ? '' : 's'} behind the rear.`}
              </span>
              <span>
                peek() → <b className="t-ice">{front.title}</b>
              </span>
            </div>
          </>
        )}
      </section>

      <div className="grid section rv-cats">
        <section className="tile c-4 rv-cat rise" style={{ '--i': 2 }} aria-labelledby="rv-weak-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip" />
                Weak areas
              </span>
              <h3 id="rv-weak-t">Score under 65%</h3>
            </div>
            <span className="tag">{plural(weak.length, 'topic')}</span>
          </div>
          {weak.length === 0 ? (
            <p className="rv-none">No weak areas detected yet. They come from first-try checkpoint accuracy, pattern-recognition accuracy and whether you solved questions without viewing the solution.</p>
          ) : (
            weak.map((w) => {
              const sc = Math.round(w.score * 100);
              const lit = Math.round(sc / 10);
              return (
                <div key={w.topic.id} className="rv-weak">
                  <div className="rv-weak-top">
                    <h4>{w.topic.title}</h4>
                    <div className="rv-score" role="img" aria-label={`score ${sc}%`}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <i key={i} className={i < lit ? 'on' : undefined} style={{ height: `${30 + i * 7.8}%` }} />
                      ))}
                      <b>{sc}%</b>
                    </div>
                  </div>
                  {w.signals.length > 0 && (
                    <ul className="rv-sig-list">
                      {w.signals.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <div className="row row--wrap" style={{ gap: 8 }}>
                    <Link to={`/topic/${w.topic.id}?tab=review`} className="btn btn--chrome btn--sm">
                      Review topic
                    </Link>
                    <Link to={`/topic/${w.topic.id}`} className="btn btn--ghost btn--sm">
                      Redo lesson
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="tile c-4 rv-cat rise" style={{ '--i': 3 }} aria-labelledby="rv-retry-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--volt" />
                Questions to retry
              </span>
              <h3 id="rv-retry-t">Failed, mis-spotted or peeked</h3>
            </div>
            <span className="tag">{mistakes.length}</span>
          </div>
          {mistakes.length === 0 ? (
            <p className="rv-none">Questions you fail, mis-identify or peek at will appear here.</p>
          ) : (
            <div className="rv-list">
              {(allRetry ? mistakes : mistakes.slice(0, 8)).map((q) => {
                const st = progress.questions[q.id];
                return (
                  <Link key={q.id} to={`/topic/${q.topicId}/q/${q.id}`} className="rv-retry">
                    <b>{q.title}</b>
                    <StatusChip status={st.status} />
                    <span className="rv-retry-why">
                      {retryReasons(st)[0]}
                      {patternById[q.pattern] ? ` · ${shortName(patternById[q.pattern].name).toLowerCase()}` : ''}
                    </span>
                  </Link>
                );
              })}
              {mistakes.length > 8 && (
                <button type="button" className="rv-more" onClick={() => setAllRetry((v) => !v)} aria-expanded={allRetry}>
                  {allRetry ? 'Show fewer' : `Show all ${mistakes.length}`}
                  <Icon name="chevronDown" size={14} />
                </button>
              )}
            </div>
          )}
        </section>

        <section className="tile c-4 rv-cat rise" style={{ '--i': 4 }} aria-labelledby="rv-les-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--ice" />
                Completed lessons
              </span>
              <h3 id="rv-les-t">Skim the review tab</h3>
            </div>
            <span className="tag">
              {studied.length} / {topics.length}
            </span>
          </div>
          {studied.length === 0 ? (
            <p className="rv-none">Complete a lesson and its Review tab will appear here.</p>
          ) : (
            <div className="rv-list">
              {studied.map((t) => {
                const missed = missedCheckpoints(progress, t).length;
                return (
                  <div key={t.id} className="rv-lesson">
                    <span className="rv-ix">{String(t.index + 1).padStart(2, '0')}</span>
                    <div>
                      <b>{t.title}</b>
                      <small className={missed ? 'rv-miss' : undefined}>{missed ? plural(missed, 'missed checkpoint') : 'all checkpoints first try'}</small>
                    </div>
                    <div className="rv-acts">
                      <Link to={`/topic/${t.id}?tab=review`} className="btn btn--ghost btn--sm">
                        Review
                      </Link>
                      <Link to={`/topic/${t.id}?tab=cheatsheet`} className="iconbtn" aria-label={`${t.title} cheatsheet`} title="Cheatsheet">
                        <Icon name="file" size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="rv-foot-note">
            Every topic also has a cheatsheet tab — or open the <Link to="/cheatsheet">global cheat sheet</Link>. Numbers over time live on <Link to="/progress">Progress</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
