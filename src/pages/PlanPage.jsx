import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Check, Clock3, PartyPopper, Trash2 } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicStats } from '../state/selectors.js';
import { stages, topics } from '../content/index.js';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import { addDays, computePace, coveredMinutes, DAILY_MAX, DAILY_MIN, DAYS_PER_WEEK, fmtDay, hm, isStudyDay, joinGoal, localDay, newPlan, parseGoal, rebase, repace, withCatchUp } from '../lib/pace.js';

// Plan your journey: modelled on system-design-learn's Study plan (/plan). Pick daily minutes, days a week and which
// stages; it dates every stage and keeps a pacer. A topic's study time counts by its mastery (lesson + problems).

const setPlan = (studyPlan) => saveUiPrefs({ studyPlan });
const weekday = (day, long = false) => new Date(`${day}T12:00`).toLocaleDateString('en-GB', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'short' });

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const daysFrom = (today, d) => Math.max(0, Math.round((Date.parse(d) - Date.parse(today)) / 864e5));

/** counts up to `target` once, on first mount (static under reduced motion); later changes show straight away */
function useCountUp(target) {
  const want = useRef(target);
  want.current = target;
  const [shown, setShown] = useState(() => (reducedMotion() ? null : 0));
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || shown === null) return undefined;
    ran.current = true;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 800);
      setShown(p < 1 ? Math.round(want.current * (1 - (1 - p) ** 3)) : null);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ran.current = false; // StrictMode re-runs the effect: let it start again
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return shown === null ? target : shown;
}

/** a number that counts up on first view; screen readers get the real value only */
function Count({ value }) {
  const v = useCountUp(value);
  return (
    <>
      <span className="num" aria-hidden="true">
        {v}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

// the trail: three switchbacks climbing from bottom-left to the summit, top-right (viewBox 0 0 340 210)
const TRAIL = 'M 22 188 C 150 198 316 186 306 150 C 296 114 48 132 40 96 C 32 58 262 76 292 40 C 300 30 304 24 312 20';

/** eases a set of 0..1 positions to new values (≈450ms, rAF) so markers travel along the trail, not across it */
function useGlide(target) {
  const [cur, setCur] = useState(target);
  const shown = useRef(target);
  const sig = JSON.stringify(target);
  useEffect(() => {
    if (reducedMotion()) {
      shown.current = target;
      setCur(target);
      return undefined;
    }
    const from = shown.current;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 450);
      const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      const next = {};
      for (const k of Object.keys(target)) next[k] = (from[k] ?? target[k]) + (target[k] - (from[k] ?? target[k])) * e;
      shown.current = next;
      setCur(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return cur;
}

/**
 * The journey as a trail (decorative; the same facts are in the text around it). The trail behind you glows, the
 * dashed trail ahead runs to the flag on your finish date. Covered stages sit behind the traveller (how far depends
 * on how much of the goal you've covered); the rest are placed by date on a time scale that only rescales when the
 * finish leaves it, so a new pace walks the waypoints and the flag along the trail.
 */
function Route({ stops, dates, today }) {
  const ref = useRef(null);
  const trail = useRef(null);
  const [inView, setInView] = useState(false);
  const [len, setLen] = useState(0);
  useLayoutEffect(() => setLen(trail.current?.getTotalLength?.() || 0), []);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const doneN = dates.filter((d) => d === null).length;
  const finishDays = dates.length && dates[dates.length - 1] ? daysFrom(today, dates[dates.length - 1]) : 0;
  const horizon = useRef(0);
  if (finishDays > horizon.current || finishDays < horizon.current * 0.4) horizon.current = Math.max(7, Math.ceil(finishDays * 1.25));
  const total = stops.reduce((a, s) => a + s.minutes, 0) || 1;
  const done = stops.reduce((a, s) => a + s.minutes - s.remaining, 0);
  const target = { you: 0.05 + 0.4 * (done / total) };
  const at = (d) => target.you + (1 - target.you) * Math.min(1, daysFrom(today, d) / horizon.current);
  let k = 0;
  stops.forEach((s, i) => {
    target[s.id] = dates[i] === null ? (target.you * ++k) / (doneN + 1) : at(dates[i]);
  });
  target.end = finishDays ? at(dates[dates.length - 1]) : target.you;
  const g = useGlide(target);
  const pt = (f) => (len ? trail.current.getPointAtLength(Math.max(0, Math.min(1, f)) * len) : { x: 22, y: 188 });
  const place = (f) => {
    const p = pt(f);
    return { transform: `translate(${p.x}px, ${p.y}px)` };
  };

  return (
    <div ref={ref} className={`pl-route${inView ? ' is-in' : ''}`} aria-hidden="true">
      <svg className="pl-rt-svg" viewBox="0 0 340 210" focusable="false">
        <defs>
          <mask id="pl-rt-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="340" height="210">
            <path className="pl-rt-reveal" d={TRAIL} pathLength="1" />
          </mask>
        </defs>
        <g mask="url(#pl-rt-reveal)">
          <path ref={trail} className="pl-rt-bed" d={TRAIL} />
          <path className="pl-rt-plan" d={TRAIL} pathLength="1" style={{ strokeDasharray: `0 ${g.you} ${Math.max(0, g.end - g.you)} 2` }} />
          <path className="pl-rt-ahead" d={TRAIL} />
          <path className="pl-rt-done" d={TRAIL} pathLength="1" style={{ strokeDasharray: `${g.you} 2` }} />
        </g>
        {len > 0 && (
          <>
            {stops.map((s, i) => (
              <g key={s.id} style={place(g[s.id] ?? target[s.id])}>
                <g className={`pl-rt-wp${dates[i] === null ? ' pl-rt-wp--done' : ''}`} style={{ '--f': target[s.id] }}>
                  <circle r="8" />
                  <text dy="3.5">{i + 1}</text>
                </g>
              </g>
            ))}
            <g style={place(g.end)}>
              <g className="pl-rt-flag" style={{ '--f': target.end }}>
                <path d="M 0 0 V -24" />
                <path className="pl-rt-cloth" d="M 0 -24 L 14 -19.5 L 0 -15 Z" />
              </g>
            </g>
            <g style={place(g.you)}>
              <g className="pl-rt-you">
                <circle className="pl-rt-ping" r="9" />
                <circle r="6" />
              </g>
            </g>
          </>
        )}
      </svg>
      <div className="pl-rt-legend mono">
        <span>{doneN ? `${doneN} stage${doneN > 1 ? 's' : ''} behind you` : 'at the trailhead'}</span>
        <span className="pl-rt-end">{finishDays ? `flag in ${finishDays}d` : 'summit reached'}</span>
      </div>
    </div>
  );
}

/** this week, Monday to Sunday: studied, missed, rest and planned days */
function Week({ plan, days, today }) {
  const monday = addDays(today, -((new Date(`${today}T12:00`).getDay() + 6) % 7));
  return (
    <ol className="pl-week" aria-label="This week">
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(monday, i);
        const on = isStudyDay(d, plan.daysPerWeek);
        const studied = days.has(d);
        const state = studied ? 'studied' : d >= today ? (on ? 'planned' : 'rest') : on ? 'missed' : 'rest';
        return (
          <li key={d} className={`pl-day pl-day--${state}${d === today ? ' pl-day--today' : ''}`}>
            <span className="pl-day-n">{d === today ? 'Today' : weekday(d)}</span>
            <span className="pl-day-m">{studied ? <Check size={13} aria-hidden="true" /> : on ? `${plan.dailyMinutes}m` : 'rest'}</span>
            <span className="sr-only">{state}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function PlanPage() {
  const { progress } = useProgress();
  const saved = useUiPrefs().studyPlan || null;
  const today = localDay();
  const completion = useMemo(() => {
    const m = Object.fromEntries(topics.map((t) => [t.id, topicStats(t, progress).mastery / 100]));
    return (t) => m[t.id] || 0;
  }, [progress]);
  const covered = useMemo(() => coveredMinutes(topics, completion), [completion]);
  // before a plan is started the inputs edit a draft, so trying numbers doesn't create a plan
  const [draft, setDraft] = useState(() => saved || newPlan(covered, today));
  const plan = saved || draft;
  const activityDays = Object.keys(progress.activity || {});
  const pace = computePace(plan, { stages, topics, completion, activityDays }, today);
  const activity = new Set(activityDays);

  // a new pace applies from today: the pacer keeps its position, so a gap stays. Only "Move my finish date" resets it.
  const change = (next, newPace) => {
    const merged = { ...plan, ...next };
    const final = newPace && saved ? repace(merged, pace.expected, today) : merged;
    if (saved) setPlan(final);
    else setDraft(final);
  };

  const parts = parseGoal(plan.goal);
  const isAll = parts[0] === 'all';
  const inGoal = (id) => isAll || parts.includes(`stage:${id}`);
  const toggleStage = (id) => {
    const on = new Set(isAll ? stages.map((s) => `stage:${s.id}`) : parts);
    const k = `stage:${id}`;
    if (on.has(k)) on.delete(k);
    else on.add(k);
    // nothing ticked (or everything) is the whole course
    const list = stages.map((s) => `stage:${s.id}`).filter((x) => on.has(x));
    change({ goal: list.length === stages.length ? 'all' : joinGoal(list) }, false);
  };

  const weekly = plan.dailyMinutes * plan.daysPerWeek;
  const left = pace.goal.remaining;
  const behind = !!saved && pace.state === 'behind';
  const warnOn = behind && !saved.warningsOff;
  const here = pace.dates.findIndex((d) => d !== null);

  return (
    <div className="page page-narrow pl">
      <header className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/plan
        </span>
        <h1 className="display display--s chrome">Plan your journey</h1>
        <p className="lead">Tell it how much time you have and it dates every stage. The pacer shows where your plan expects you to be today; if you fall behind, it tells you how to catch up.</p>
      </header>

      <section className="tile pl-calc rise" style={{ '--i': 1 }} aria-labelledby="pl-calc-t">
        <h2 id="pl-calc-t" className="sr-only">
          Pace calculator
        </h2>
        <div className="pl-inputs">
          <label className="pl-field" htmlFor="pl-daily">
            <span className="eyebrow">Time I can study per day</span>
            <span className="pl-mins">
              <b className="mono">{plan.dailyMinutes}</b> minutes
            </span>
            <input id="pl-daily" type="range" className="pl-range" min={DAILY_MIN} max={DAILY_MAX} step={5} value={plan.dailyMinutes} onChange={(e) => change({ dailyMinutes: Number(e.target.value) }, true)} />
          </label>
          <div className="pl-field">
            <span className="eyebrow" id="pl-days-k">
              Days per week
            </span>
            <div className="seg" role="group" aria-labelledby="pl-days-k">
              {DAYS_PER_WEEK.map((n) => (
                <button key={n} type="button" aria-pressed={plan.daysPerWeek === n} onClick={() => change({ daysPerWeek: n }, true)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <fieldset className="pl-field pl-goal">
            <legend className="eyebrow">Goal · stages to finish</legend>
            {stages.map((s) => (
              <label key={s.id} className="pl-goal-row">
                <input type="checkbox" checked={inGoal(s.id)} onChange={() => toggleStage(s.id)} />
                <span className="pl-goal-t">{s.title}</span>
              </label>
            ))}
            {!isAll && (
              <button type="button" className="btn btn--ghost btn--sm pl-goal-all" onClick={() => change({ goal: 'all' }, false)}>
                Whole course
              </button>
            )}
          </fieldset>
        </div>

        <div className="pl-result" aria-live="polite">
          <span className="eyebrow">{pace.goal.label}</span>
          {pace.finish ? (
            <p className="pl-big">
              by{' '}
              <b key={pace.finish} className="pl-flip">
                {fmtDay(pace.finish, true)}
              </b>
            </p>
          ) : (
            <p className="pl-big">
              <PartyPopper size={26} aria-hidden="true" /> Done
            </p>
          )}
          <Route stops={pace.goal.stops} dates={pace.dates} today={today} />
          <p className="small">
            {plan.dailyMinutes} min a day, {plan.daysPerWeek} days a week. {hm(covered)} covered so far{saved ? `; plan started ${fmtDay(saved.startedAt)}` : ''}.
          </p>
          <div className="pl-stats">
            <div>
              <Count value={Math.ceil(left / weekly)} />
              <span className="eyebrow">weeks left</span>
            </div>
            <div>
              <Count value={Math.round(left / 60)} />
              <span className="eyebrow">hours to go</span>
            </div>
            <div>
              <span className="num">{hm(weekly)}</span>
              <span className="eyebrow">per week</span>
            </div>
          </div>
          {!saved && (
            <button type="button" className="btn btn--plasma" onClick={() => setPlan(rebase({ ...plan, startedAt: today }, covered, today))}>
              Start this plan
            </button>
          )}
        </div>
      </section>

      {saved &&
        (warnOn ? (
          <section className="tile pl-warn rise" role="status" aria-labelledby="pl-warn-t">
            <Clock3 size={20} aria-hidden="true" className="pl-warn-ic" />
            <div>
              <h2 id="pl-warn-t" className="h2 pl-warn-h">
                You’re {hm(pace.gap)} behind the pacer
              </h2>
              <p className="small">
                {pace.lastActive ? `Last studied ${weekday(pace.lastActive, true)}` : 'No study recorded since the plan started'}
                {pace.missedDays ? `, ${pace.missedDays} study day${pace.missedDays > 1 ? 's' : ''} missed since` : ''}.{' '}
                {saved.catchUp
                  ? `You’re catching up with +${saved.catchUp.extraMinutes} min a day until ${fmtDay(saved.catchUp.until)}.`
                  : pace.catchUpPerDay > 0
                    ? `To get back on pace, add ${pace.catchUpPerDay} min a day for the next 2 weeks (${plan.dailyMinutes + pace.catchUpPerDay} instead of ${plan.dailyMinutes}).`
                    : ''}
                {pace.extraDays > 0 && pace.slowFinish ? ` Or keep your pace and finish ${pace.extraDays} study day${pace.extraDays > 1 ? 's' : ''} later, on ${fmtDay(pace.slowFinish)}.` : ''}
              </p>
              <div className="pl-acts">
                {!saved.catchUp && pace.catchUpPerDay > 0 && (
                  <button type="button" className="btn btn--plasma btn--sm" onClick={() => setPlan(withCatchUp(saved, pace.catchUpPerDay, today))}>
                    Add {pace.catchUpPerDay} min/day for 2 weeks
                  </button>
                )}
                <button type="button" className="btn btn--chrome btn--sm" onClick={() => setPlan(rebase(saved, covered, today))}>
                  Move my finish date
                </button>
              </div>
            </div>
          </section>
        ) : (
          !behind && (
            <section className="tile pl-warn pl-warn--ok rise" role="status" aria-labelledby="pl-warn-t">
              <Check size={20} aria-hidden="true" className="pl-warn-ic" />
              <div>
                <h2 id="pl-warn-t" className="h2 pl-warn-h">
                  {pace.state === 'done' ? 'Goal reached' : pace.state === 'ahead' ? `You’re ${hm(-pace.gap)} ahead of the pacer` : 'Right on pace'}
                </h2>
                <p className="small">
                  {pace.state === 'done'
                    ? 'Pick more stages above to keep going.'
                    : pace.state === 'ahead'
                      ? 'Nice. You could finish early, or keep this buffer for a busy week.'
                      : `Keep this rhythm and you’ll arrive on the date above. ${pace.todayMinutes ? `Today: ${pace.todayMinutes} min.` : 'Today is a rest day.'}`}
                </p>
              </div>
            </section>
          )
        ))}

      {saved && (
        <div className="pl-switch-row">
          <span className="pl-switch">
            <button type="button" className="toggle" role="switch" aria-checked={!saved.warningsOff} aria-labelledby="pl-warn-k" onClick={() => setPlan({ ...saved, warningsOff: !saved.warningsOff })} />
            <span id="pl-warn-k" className="small">
              Behind-schedule warnings
            </span>
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPlan(null)}>
            <Trash2 size={14} aria-hidden="true" /> Remove plan
          </button>
        </div>
      )}

      <section className="tile pl-path rise" style={{ '--i': 2 }} aria-labelledby="pl-path-t">
        <div className="tile-head">
          <div>
            <span className="eyebrow">
              <i className="pip pip--uv" aria-hidden="true" />
              {pace.goal.stops.length} stage{pace.goal.stops.length === 1 ? '' : 's'} · {hm(pace.goal.minutes)} of study
            </span>
            <h2 id="pl-path-t" className="h2">
              Your journey
            </h2>
          </div>
          <Link to="/contents" className="btn btn--ghost btn--sm">
            All topics
          </Link>
        </div>
        <ol className="pl-list">
          {pace.goal.stops.map((s, i) => {
            const d = pace.dates[i];
            const pct = s.minutes ? Math.round(((s.minutes - s.remaining) / s.minutes) * 100) : 100;
            return (
              <li key={s.id} className={`pl-stop${d === null ? ' pl-stop--done' : ''}${i === here ? ' pl-stop--here' : ''}`}>
                <span className="pl-stop-body">
                  <Link to={`/contents#stage-${s.id}`} className="pl-stop-t">
                    {s.title}
                  </Link>
                  {i === here && <span className="chip chip--plain pl-here">you are here</span>}
                  <span className="meter" role="img" aria-label={`${pct}% covered`}>
                    <i style={{ '--v': `${pct}%` }} />
                  </span>
                  <span className="small">{d === null ? `${hm(s.minutes)} · covered` : `${hm(s.remaining)} left of ${hm(s.minutes)}`}</span>
                </span>
                <span className="mono pl-stop-d">{d === null ? 'done' : fmtDay(d)}</span>
              </li>
            );
          })}
        </ol>
        {saved && (
          <>
            <h3 className="eyebrow pl-week-k">This week</h3>
            <Week plan={saved} days={activity} today={today} />
          </>
        )}
        <p className="small pl-note">
          Covered counts each topic’s study time by its mastery (lesson steps read and problems solved). The pacer is what your plan expected by today. A new pace applies from today and keeps any gap; “Move my finish date” restarts the pacer from where you are, so
          earlier misses stop counting. The plan is kept in this browser.
        </p>
      </section>
    </div>
  );
}
