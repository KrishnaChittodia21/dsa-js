import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { TAB_META } from '../components/guide/studyLoop.js';
import { plural } from '../components/charts/core.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress, formatDuration, streak, topicStats, topicStatus, STATUS_LABEL } from '../state/selectors.js';
import { todayKey } from '../state/progressReducer.js';
import { questionById, stages, topicById, topics } from '../content/index.js';
import { nextStep, hasAnyProgress } from '../lib/nextStep.js';
import { accuracy, activeInLast, activityWeeks, difficultySolved, kpis, stageProgress, statusCounts, topicSolved, weakForChart } from '../lib/dashMetrics.js';
import { getUiPrefs } from '../lib/uiPrefs.js';
import useReveal from '../lib/useReveal.js';

const PAGE_NAMES = {
  '/visualize': 'Visualizer',
  '/playground': 'Playground',
  '/finder': 'Pattern Finder',
  '/patterns': 'Patterns',
  '/toolkit': 'JS DSA Toolkit',
  '/js': 'JavaScript for DSA',
};

/** A readable name for a saved location, for "pick up where you left off". */
function describeLocation(loc) {
  const [path, search = ''] = loc.split('?');
  const q = /^\/topic\/[^/]+\/q\/([^/]+)/.exec(path);
  if (q) {
    const meta = questionById[q[1]];
    return meta ? `${meta.title} · ${topicById[meta.topicId]?.title}` : null;
  }
  const t = /^\/topic\/([^/]+)/.exec(path);
  if (t) {
    const topic = topicById[t[1]];
    if (!topic) return null;
    const tab = new URLSearchParams(search).get('tab');
    return tab && TAB_META[tab] ? `${topic.title} · ${TAB_META[tab].label}` : topic.title;
  }
  const tool = /^\/toolkit\/(.+)/.exec(path);
  if (tool) return 'JS DSA Toolkit';
  return PAGE_NAMES[path] ?? null;
}

const GO = {
  start: 'Start the lesson',
  lesson: 'Continue the lesson',
  pattern: 'Retry the challenge',
  question: 'Open the question',
  revision: 'Start revising',
  topic: 'Start the topic',
  done: 'Open revision',
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const MARK = { locked: '·', available: '○', 'in-progress': '◐', completed: '✓' };
const pad = (n) => String(n).padStart(2, '0');
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const shortDate = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** One tally line: label, dotted leader, value (+ an optional pencilled note underneath). */
function Line({ label, value, note }) {
  return (
    <div className="tally-line">
      <dt>{label}</dt>
      <span className="leader" aria-hidden="true" />
      <dd>
        <span className="tally-value">{value}</span>
        {note && <span className="tally-note">{note}</span>}
      </dd>
    </div>
  );
}

/** A thin ruled bar (2px fill on a hairline). */
function Rule({ value, tone = '' }) {
  return (
    <span className={`thin-rule ${tone}`} aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

export default function Dashboard() {
  const { progress } = useProgress();
  const ref = useRef(null);
  useReveal(ref);
  const step = nextStep(progress, topics);
  const isNew = !hasAnyProgress(progress);
  const k = kpis(progress, topics);

  const last = getUiPrefs().lastStudyLocation;
  const lastLabel = last ? describeLocation(last) : null;
  const resume = last && lastLabel && last !== step.href && last.split('?')[0] !== step.href ? { href: last, label: lastLabel } : undefined;

  // ---- metrics ----
  const status = statusCounts(progress, topics);
  const stageRows = stageProgress(progress, stages);
  const diffs = difficultySolved(progress, topics);
  const started = topicSolved(progress, topics);
  const acc = accuracy(progress, topics);
  const weeks = activityWeeks(progress.activity);
  const st = streak(progress);
  const week = activeInLast(progress.activity, 7);
  const studyDays = Object.keys(progress.activity || {}).length;
  const companies = companyProgress(progress)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.solved / b.total - a.solved / a.total || b.total - a.total)
    .slice(0, 6);
  const weak = weakForChart(progress, topics);
  const totalRetry = weak.reduce((n, w) => n + w.retry.length, 0);

  const now = new Date();
  const dateline = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const here = step.topic;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const day = todayKey(d);
    return { day, weekday: d.toLocaleDateString(undefined, { weekday: 'short' }), date: d.getDate(), active: !!progress.activity?.[day], today: i === 6 };
  });
  const flat = weeks.flat();
  const subPct = acc[2];

  return (
    <div ref={ref} className="page dash ink-in">
      {/* ---------- Today's page ---------- */}
      <header className="today">
        <p className="today-dateline">
          <span className="eyebrow">Today&apos;s page</span>
          <span className="folio">{dateline}</span>
          {here && (
            <span className="folio today-folio">
              Chapter {pad(here.index + 1)} of {topics.length}
            </span>
          )}
        </p>
        <div className="today-spread">
          <div className="today-copy">
            <h1 className="today-title">
              {isNew ? (
                <>
                  Page one: <em>{here?.title ?? 'the first chapter'}</em>.
                </>
              ) : step.kind === 'done' ? (
                <>
                  Every chapter is <em>finished</em>.
                </>
              ) : here ? (
                <>
                  You&apos;re in <em>{here.title}</em>.
                </>
              ) : (
                <>Pick up where you left off.</>
              )}
            </h1>
            <p className="standfirst">
              {isNew
                ? `${topics.length} topics in ${stages.length} parts, from Big-O to advanced graphs and DP. Each one goes the same way: a short lesson, an animation you can step through, then questions where you name the pattern before you code it.`
                : here
                  ? `${here.stageTitle} · ${status.completed} of ${topics.length} topics complete, ${k.solved.done} questions solved so far.`
                  : `${status.completed} of ${topics.length} topics complete, ${k.solved.done} questions solved so far.`}
            </p>
          </div>
          <aside className="today-mastery" aria-label="Overall mastery">
            <span className="eyebrow">Overall mastery</span>
            <span className="big-num">
              {k.mastery}
              <span className="big-num-unit">%</span>
            </span>
            <Rule value={k.mastery} />
            <p className="margin-text">The average of every topic&apos;s mastery. The lesson counts for 30%; the rest is Easy, Medium and Hard questions solved.</p>
          </aside>
        </div>
      </header>

      {/* ---------- Next on the desk ---------- */}
      <section className="desk" aria-labelledby="desk-title">
        <h2 id="desk-title" className="eyebrow">
          Next on the desk
        </h2>
        <p className="desk-sentence">
          <strong>{/[.?!]$/.test(step.title) ? step.title : `${step.title}.`}</strong> {step.detail && <span className="desk-detail">{step.detail}</span>}
        </p>
        <div className="desk-actions">
          <Link to={step.href} className="btn btn-primary btn-lg">
            {GO[step.kind] || 'Go'} →
          </Link>
          {step.secondary && (
            <Link to={step.secondary.href} className="desk-alt">
              or {lower1(step.secondary.title)}
            </Link>
          )}
        </div>
        {resume && (
          <p className="desk-resume">
            <span className="eyebrow">Where you left off</span> <Link to={resume.href}>{resume.label}</Link>
          </p>
        )}
      </section>

      {/* ---------- the ruler: 32 topics ---------- */}
      <section className="dash-sec" aria-labelledby="ruler-title" data-reveal>
        <div className="sec-head">
          <h2 id="ruler-title">The course, topic by topic</h2>
          <Link to="/contents" className="sec-link">
            Open the contents →
          </Link>
        </div>
        <ol className="ruler" aria-label={`All ${topics.length} topics in course order`}>
          {stages.map((stg, si) => (
            <li key={stg.id} className="ruler-part" style={{ flexGrow: stg.topics.length }}>
              <ol className="ruler-ticks">
                {stg.topics.map((t) => {
                  const s = topicStatus(t, progress);
                  const m = topicStats(t, progress).mastery;
                  const isHere = here?.id === t.id;
                  return (
                    <li key={t.id} className="ruler-cell">
                      <Link
                        to={`/topic/${t.id}`}
                        className={`tick st-${s} ${isHere ? 'here' : ''}`}
                        aria-label={`${t.index + 1}. ${t.title}: ${STATUS_LABEL[s]}, ${m}% mastery${isHere ? ' (you are here)' : ''}`}
                        title={`${pad(t.index + 1)} ${t.title} · ${m}%`}
                      >
                        <span className="tick-fill" style={{ height: `${s === 'completed' ? 100 : Math.max(m, 0)}%` }} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <span className="ruler-label folio" aria-hidden="true">
                {ROMAN[si]}
              </span>
            </li>
          ))}
        </ol>
        <p className="ruler-key">
          <span>
            <b className="mk st-completed">✓</b> {status.completed} completed
          </span>
          <span>
            <b className="mk st-in-progress">◐</b> {status.inProgress} in progress
          </span>
          <span>
            <b className="mk">○</b> {status.notStarted} not started ({status.available} open, {status.locked} locked)
          </span>
          {here && (
            <span>
              <b className="mk here-key" aria-hidden="true" /> you are here
            </span>
          )}
        </p>
        <p className="margin-text">A topic is complete when its lesson is done and at least half its questions are solved. Tick height is the topic&apos;s mastery.</p>

        <ol className="stage-ledger">
          {stageRows.map((s, i) => (
            <li key={s.id}>
              <Link
                to={`/contents#stage-${s.id}`}
                className="stage-line"
                aria-label={`Part ${ROMAN[i]}, ${s.title}: ${s.mastery}% mastery, ${s.completed} of ${s.total} topics completed, ${s.solved} of ${s.questions} questions solved. Open in Contents`}
              >
                <span className="stage-num">{ROMAN[i]}</span>
                <span className="stage-title">{s.title}</span>
                <span className="leader" aria-hidden="true" />
                <span className="stage-stats folio">
                  {s.completed}/{s.total} topics · {s.solved}/{s.questions} solved
                </span>
                <span className="stage-pct">{s.mastery}%</span>
                <Rule value={s.mastery} tone={s.done ? 'good' : ''} />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- study ledger + the week ---------- */}
      <div className="dash-spread" data-reveal>
        <section className="dash-sec" aria-labelledby="ledger-title">
          <div className="sec-head">
            <h2 id="ledger-title">Study ledger</h2>
            <Link to="/progress" className="sec-link">
              Per-topic table →
            </Link>
          </div>
          <dl className="tally">
            <Line label="Topics completed" value={`${k.topicsCompleted.done}/${k.topicsCompleted.total}`} note={`${status.inProgress} in progress`} />
            <Line label="Questions solved" value={k.solved.done} note={`of ${k.solved.total} · ${k.solved.total - k.solved.done} to go`} />
            <Line
              label="Checkpoints right first time"
              value={k.checkpoints.seen ? `${k.checkpoints.pct}%` : '—'}
              note={k.checkpoints.seen ? `${k.checkpoints.correct} of ${k.checkpoints.seen}` : 'answer a lesson checkpoint to start this'}
            />
            <Line
              label="Patterns named first time"
              value={k.patterns.seen ? `${k.patterns.pct}%` : '—'}
              note={k.patterns.seen ? `${k.patterns.correct} of ${k.patterns.seen} challenges` : 'name a pattern on any question'}
            />
            <Line
              label="Submissions passing every test"
              value={subPct.seen ? `${subPct.pct}%` : '—'}
              note={subPct.seen ? `${subPct.correct} of ${plural(subPct.seen, 'submission')}` : 'no submissions yet'}
            />
            <Line label="Time on questions" value={formatDuration(k.timeMs)} note={`${plural(k.submissions.seen, 'submission')} in all`} />
          </dl>

          <h3 className="sub-head eyebrow">Solved by difficulty</h3>
          <dl className="tally tally-diff">
            {diffs.map((d) => (
              <div key={d.level} className="tally-line">
                <dt>
                  <span className={`diff-letter diff-${d.level.toLowerCase()}`} aria-hidden="true">
                    {d.level[0]}
                  </span>{' '}
                  {d.level}
                </dt>
                <span className="leader" aria-hidden="true" />
                <dd>
                  <span className="tally-value">
                    {d.solved}/{d.total}
                  </span>
                  <span className="tally-note">{d.pct}%</span>
                </dd>
                <Rule value={d.pct} />
              </div>
            ))}
          </dl>
        </section>

        <section className="dash-sec" aria-labelledby="week-title">
          <div className="sec-head">
            <h2 id="week-title">The week</h2>
          </div>
          <ol className="week-days" aria-label={`Studied on ${week} of the last 7 days`}>
            {last7.map((d) => (
              <li key={d.day} className={`${d.active ? 'on' : ''} ${d.today ? 'today' : ''}`}>
                <span className="wk-name">{d.weekday}</span>
                <span className="wk-date">{d.date}</span>
                <span className="wk-mark" aria-hidden="true">
                  {d.active ? '✓' : '·'}
                </span>
                <span className="sr-only">{d.active ? 'studied' : 'no study'}</span>
              </li>
            ))}
          </ol>
          <p className="week-sentence">
            {st.current ? (
              <>
                <span className="big-inline">{plural(st.current, 'day')}</span> in a row; your longest run is {plural(st.longest, 'day')}. {week}/7 days this week.
              </>
            ) : (
              <>No streak yet. One checkpoint today starts it.{st.longest ? ` Your longest run is ${plural(st.longest, 'day')}.` : ''}</>
            )}
          </p>

          <h3 className="sub-head eyebrow">The last 12 weeks</h3>
          <div className="strip" aria-hidden="true">
            {weeks.map((w) => (
              <span key={w[0].day} className="strip-week">
                {w.map((d) => (
                  <span key={d.day} className={`strip-day lv-${d.level} ${d.today ? 'today' : ''} ${d.future ? 'future' : ''}`} title={`${shortDate(d.day)}: ${plural(d.count, 'action')}`} />
                ))}
              </span>
            ))}
          </div>
          <p className="strip-axis folio" aria-hidden="true">
            <span>{shortDate(flat[0].day)}</span>
            <span>today</span>
          </p>
          <table className="sr-only">
            <caption>Study activity, last 12 weeks</caption>
            <thead>
              <tr>
                <th>Week starting</th>
                <th>Active days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w[0].day}>
                  <td>{shortDate(w[0].day)}</td>
                  <td>{w.filter((d) => d.count).length}</td>
                  <td>{w.reduce((a, d) => a + d.count, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="margin-text">
            {plural(studyDays, 'active day')} in total. A taller mark means more done that day.
          </p>
        </section>
      </div>

      {/* ---------- work in hand + margin notes ---------- */}
      <div className="dash-spread dash-spread-notes" data-reveal>
        <section className="dash-sec" aria-labelledby="work-title">
          <div className="sec-head">
            <h2 id="work-title">Work in hand</h2>
            <span className="folio">{plural(started.length, 'topic')} started</span>
          </div>
          {started.length ? (
            <ol className="work-list">
              {started.map((s) => (
                <li key={s.topic.id}>
                  <Link
                    to={`/topic/${s.topic.id}?tab=practice`}
                    className="work-line"
                    aria-label={`${s.topic.title}: ${s.solved} of ${s.total} solved, mastery ${s.mastery}%, ${s.status === 'completed' ? 'completed' : 'in progress'}. Open practice`}
                  >
                    <span className="folio work-num">{pad(s.topic.index + 1)}</span>
                    <span className={`mk st-${s.status}`} aria-hidden="true">
                      {MARK[s.status]}
                    </span>
                    <span className="work-title">{s.topic.title}</span>
                    <span className="leader" aria-hidden="true" />
                    <span className="folio work-count">
                      {s.solved}/{s.total}
                    </span>
                    <span className="work-pct">{s.mastery}%</span>
                    <Rule value={s.pct} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="blank">
              <p>Nothing on the desk yet. Open the first lesson and this list starts filling in.</p>
              <Link to={step.href} className="btn btn-sm">
                {GO[step.kind] || 'Start'} →
              </Link>
            </div>
          )}

          <div className="sec-head sec-head-minor">
            <h2 id="co-title">Company questions</h2>
            <Link to="/companies" className="sec-link">
              All companies →
            </Link>
          </div>
          {companies.length ? (
            <dl className="tally" aria-labelledby="co-title">
              {companies.map((c) => (
                <div key={c.company.id} className="tally-line">
                  <dt>
                    <Link to={`/companies/${c.company.id}`}>{c.company.name}</Link>
                  </dt>
                  <span className="leader" aria-hidden="true" />
                  <dd>
                    <span className="tally-value">
                      {c.solved}/{c.total}
                    </span>
                    <span className="tally-note">solved</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="margin-text">No company data loaded.</p>
          )}
        </section>

        <aside className="notes" aria-labelledby="notes-title">
          <div className="sec-head">
            <h2 id="notes-title">Margin notes</h2>
            <Link to="/revision" className="sec-link">
              Revision →
            </Link>
          </div>
          {weak.length ? (
            weak.map((w) => (
              <div key={w.topic.id} className="note note-weak">
                <p className="eyebrow">
                  Weak spot · score {w.scorePct}%
                </p>
                <p className="note-title">
                  <Link to={`/topic/${w.topic.id}?tab=review`}>{w.topic.title}</Link>
                </p>
                {w.signals.length > 0 && <p className="note-body">{w.signals.join('. ')}.</p>}
                <ul className="note-actions">
                  {w.retry.length > 0 && (
                    <li>
                      <Link to={`/topic/${w.topic.id}/q/${w.retry[0].id}`}>
                        Retry “{w.retry[0].title}”{w.retry.length > 1 ? ` (+${w.retry.length - 1})` : ''}
                      </Link>
                    </li>
                  )}
                  {w.missedCheckpoints > 0 && (
                    <li>
                      <Link to={`/topic/${w.topic.id}?tab=review`}>Re-answer {plural(w.missedCheckpoints, 'missed checkpoint')}</Link>
                    </li>
                  )}
                  {w.wrongPattern.length > 0 && (
                    <li>
                      <Link to={`/topic/${w.topic.id}?tab=cheatsheet`}>Revise the recognition clues</Link>
                    </li>
                  )}
                  {w.peeked.length > 0 && <li className="note-plain">Solved {plural(w.peeked.length, 'question')} after peeking at the solution</li>}
                  <li>
                    <Link to={`/topic/${w.topic.id}?tab=practice`}>Try new questions</Link>
                  </li>
                </ul>
              </div>
            ))
          ) : (
            <div className="note">
              <p className="eyebrow">Weak spots</p>
              <p className="note-body">None flagged. A topic is judged once it has a few checkpoint answers, pattern guesses or submissions; anything under 65% shows up here.</p>
            </div>
          )}

          <div className="note note-howto">
            <p className="eyebrow">How to clear a weak spot</p>
            <ol className="howto">
              <li>
                <strong>Re-answer the checkpoints you missed.</strong> The topic&apos;s Review tab clears just those; your new first try is what counts.
              </li>
              <li>
                <strong>Retry the questions you struggled with</strong>, without opening the solution. A solve after peeking never counts as clean.
              </li>
              <li>
                <strong>Name the pattern before coding.</strong> The first guess on each question is final, so revise the recognition clues, then get the next one right first time.
              </li>
              <li>
                <strong>Practise new questions in the topic.</strong> The score averages checkpoints (×2), pattern guesses (×2) and clean solves (×3), so fresh first-try wins lift it past 65%.
              </li>
            </ol>
            <p className="note-actions-row">
              {totalRetry > 0 && (
                <Link to="/revision" className="btn btn-primary btn-sm">
                  Retry {plural(totalRetry, 'question')}
                </Link>
              )}
              <Link to="/revision" className={totalRetry > 0 ? 'desk-alt' : 'btn btn-sm'}>
                Open the revision page
              </Link>
            </p>
          </div>
        </aside>
      </div>

      {/* ---------- elsewhere ---------- */}
      <nav className="elsewhere" aria-label="Practice">
        <span className="eyebrow">Elsewhere in the notebook</span>
        <ul>
          <li>
            <Link to="/questions">All questions</Link> <span className="folio">{k.solved.done}/{k.solved.total}</span>
          </li>
          <li>
            <Link to="/finder">Pattern Finder</Link>
          </li>
          <li>
            <Link to="/visualize">Visualizer</Link>
          </li>
          <li>
            <Link to="/playground">Playground</Link>
          </li>
          <li>
            <Link to="/companies">Companies</Link>
          </li>
          <li>
            <Link to="/cheatsheet">Cheat sheet</Link>
          </li>
          <li>
            <Link to="/contents">Contents</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
