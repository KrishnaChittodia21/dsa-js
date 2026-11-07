// Plan your journey (pure maths, ported from system-design-learn's src/lib/pace.ts): covered minutes, the pacer,
// behind/ahead, catch-up advice and the projected date of every stage. Days are local YYYY-MM-DD strings, so they
// compare as strings. The plan itself lives in UI prefs (`studyPlan`), not in progress.

export const DAILY_MIN = 15;
export const DAILY_MAX = 180;
export const DAYS_PER_WEEK = [3, 4, 5, 6, 7];
/** a gap smaller than this is "on pace" */
const BEHIND_MIN = 15;
const CATCH_UP_DAYS = 14;
/** stop walking the calendar after ~10 years (only reachable with absurd inputs) */
const MAX_WALK = 3650;
// study days run Monday onwards: 5 days a week = Mon–Fri
const STUDY_DOW = [1, 2, 3, 4, 5, 6, 0];

const pad = (n) => String(n).padStart(2, '0');
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day, n) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

export const isStudyDay = (day, daysPerWeek) => STUDY_DOW.slice(0, daysPerWeek).includes(parseDay(day).getDay());

/** study days in [from, to) */
export function studyDaysBetween(from, to, daysPerWeek) {
  let n = 0;
  for (let d = from, i = 0; d < to && i < MAX_WALK; d = addDays(d, 1), i++) if (isStudyDay(d, daysPerWeek)) n++;
  return n;
}

/** planned minutes on a day, including any catch-up minutes */
function minutesOn(plan, day, withCatchUp = true) {
  if (!isStudyDay(day, plan.daysPerWeek)) return 0;
  const extra = withCatchUp && plan.catchUp && day <= plan.catchUp.until ? plan.catchUp.extraMinutes : 0;
  return plan.dailyMinutes + extra;
}

/** the day on which `need` more minutes are done, studying from `from` (inclusive) */
function dayAfter(plan, from, need, withCatchUp = true) {
  let left = need;
  let d = from;
  for (let i = 0; i < MAX_WALK; i++, d = addDays(d, 1)) {
    left -= minutesOn(plan, d, withCatchUp);
    if (left <= 0) return d;
  }
  return d;
}

/** study time already covered: each topic's minutes × its completion (0–1) */
export const coveredMinutes = (topics, completion) => Math.round(topics.reduce((a, t) => a + (t.estMinutes || 0) * completion(t), 0));

/** A goal is 'all' or a comma-separated list of 'stage:<id>'. */
export function parseGoal(goal) {
  const parts = String(goal || '').split(',').map((x) => x.trim()).filter(Boolean);
  return parts.length && !parts.includes('all') ? parts : ['all'];
}
export const joinGoal = (parts) => (parts.length ? parts.join(',') : 'all');

/** The stages in the goal (course order), with their minutes and minutes still to do. */
export function goalTarget(goal, stages, completion) {
  const parts = parseGoal(goal);
  const isAll = parts[0] === 'all';
  const picked = stages.filter((s) => isAll || parts.includes(`stage:${s.id}`));
  if (!picked.length) return goalTarget('all', stages, completion);
  const stops = picked.map((s) => {
    const minutes = s.topics.reduce((a, t) => a + (t.estMinutes || 0), 0);
    const remaining = Math.round(s.topics.reduce((a, t) => a + (t.estMinutes || 0) * (1 - completion(t)), 0));
    return { id: s.id, number: stages.indexOf(s) + 1, title: s.title, minutes, remaining };
  });
  const minutes = stops.reduce((a, s) => a + s.minutes, 0);
  const remaining = stops.reduce((a, s) => a + s.remaining, 0);
  const label = isAll ? 'Finish the whole course' : stops.length === 1 ? `Finish stage ${stops[0].number}: ${stops[0].title}` : `Finish ${stops.length} stages`;
  return { minutes, remaining, label, stops };
}

/**
 * Where you stand against the plan. `course` = { stages, topics, completion(topic) → 0..1, activityDays: string[] }.
 * state: 'behind' | 'on' | 'ahead' | 'done'.
 */
export function computePace(plan, course, today = localDay()) {
  const { stages, topics, completion } = course;
  const total = topics.reduce((a, t) => a + (t.estMinutes || 0), 0);
  const covered = coveredMinutes(topics, completion);
  const goal = goalTarget(plan.goal, stages, completion);
  const planned = studyDaysBetween(plan.baselineAt, today, plan.daysPerWeek) * plan.dailyMinutes;
  const expected = Math.min(total, plan.baselineCovered + planned);
  const gap = Math.round(expected - covered);
  const done = goal.remaining <= 0;
  const state = done ? 'done' : gap >= BEHIND_MIN ? 'behind' : -gap >= plan.dailyMinutes ? 'ahead' : 'on';

  // the pacer is `gap` minutes ahead of you (or level), whatever the goal
  const finish = done ? null : dayAfter(plan, today, goal.remaining);
  const pacerFinish = done ? null : dayAfter(plan, today, Math.max(1, goal.remaining - Math.max(0, gap)), false);
  const slowFinish = done ? null : dayAfter(plan, today, goal.remaining, false);
  const extraDays = slowFinish && pacerFinish && slowFinish > pacerFinish ? studyDaysBetween(pacerFinish, slowFinish, plan.daysPerWeek) : 0;

  const window = Math.max(1, studyDaysBetween(today, addDays(today, CATCH_UP_DAYS), plan.daysPerWeek));
  const catchUpPerDay = gap > 0 ? Math.min(DAILY_MAX - plan.dailyMinutes, Math.max(5, Math.ceil(gap / window / 5) * 5)) : 0;

  const activityDays = [...(course.activityDays || [])].sort();
  const lastActive = [...activityDays].reverse().find((d) => d < today);
  const missedFrom = lastActive && addDays(lastActive, 1) > plan.baselineAt ? addDays(lastActive, 1) : plan.baselineAt;
  const missedDays = state !== 'behind' ? 0 : studyDaysBetween(missedFrom, today, plan.daysPerWeek);

  // the date each stage of the goal is reached, studying the stages in course order (null once covered)
  let left = 0;
  const dates = goal.stops.map((s) => {
    left += s.remaining;
    return s.remaining <= 0 ? null : dayAfter(plan, today, left);
  });

  return { covered, expected, gap, state, goal, finish, extraDays, slowFinish, catchUpPerDay: Math.max(0, catchUpPerDay), lastActive, missedDays, todayMinutes: minutesOn(plan, today), dates };
}

export const newPlan = (covered, today = localDay()) => ({ dailyMinutes: 45, daysPerWeek: 5, goal: 'all', startedAt: today, baselineAt: today, baselineCovered: covered });

/** pace changed: the pacer keeps its position (so any gap stays) and runs at the new pace from today */
export const repace = (plan, expected, today = localDay()) => ({ ...plan, baselineAt: today, baselineCovered: expected });

/** finish date moved (or plan started): the pacer restarts from today at your real position, so old misses stop counting */
export const rebase = (plan, covered, today = localDay()) => ({ ...plan, baselineAt: today, baselineCovered: covered, catchUp: undefined });

export const withCatchUp = (plan, extraMinutes, today = localDay()) => ({ ...plan, catchUp: { extraMinutes, until: addDays(today, CATCH_UP_DAYS - 1) } });

/** "2 h 15 m", "40 m" */
export function hm(mins) {
  const m = Math.round(Math.abs(mins));
  const h = Math.floor(m / 60);
  return h ? `${h} h${m % 60 ? ` ${m % 60} m` : ''}` : `${m} m`;
}

export const fmtDay = (day, year = false) => parseDay(day).toLocaleDateString('en-GB', year ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
