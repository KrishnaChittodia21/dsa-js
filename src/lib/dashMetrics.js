// Dashboard metrics: pure functions over (progress, topic metadata), used by the Dashboard charts.
// No React, no storage — unit-tested with fake progress objects.
import { missedCheckpoints, topicStats, topicStatus } from '../state/selectors.js';
import { todayKey } from '../state/progressReducer.js';
import { isMistake, weakTopicsOf } from './nextStep.js';

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/** topics by state: completed / in progress / not started (available + locked) */
export function statusCounts(progress, topics) {
  const c = { completed: 0, inProgress: 0, available: 0, locked: 0, total: topics.length };
  for (const t of topics) {
    const s = topicStatus(t, progress);
    if (s === 'completed') c.completed++;
    else if (s === 'in-progress') c.inProgress++;
    else if (s === 'available') c.available++;
    else c.locked++;
  }
  c.notStarted = c.available + c.locked;
  return c;
}

/** per stage, in course order: average topic mastery, topics completed, questions solved */
export function stageProgress(progress, stages) {
  return stages
    .filter((st) => st.topics.length)
    .map((st, i) => {
      const stats = st.topics.map((t) => topicStats(t, progress));
      const mastery = Math.round(stats.reduce((a, s) => a + s.mastery, 0) / stats.length);
      const completed = st.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
      return {
        id: st.id,
        number: i + 1,
        title: st.title,
        mastery,
        completed,
        total: st.topics.length,
        solved: stats.reduce((a, s) => a + s.solved, 0),
        questions: stats.reduce((a, s) => a + s.total, 0),
        done: completed === st.topics.length,
      };
    });
}

/** solved / total per difficulty, only difficulties that have questions */
export function difficultySolved(progress, topics, levels = ['Easy', 'Medium', 'Hard']) {
  return levels
    .map((level) => {
      const qs = topics.flatMap((t) => t.questions.filter((q) => q.difficulty === level));
      const solved = qs.filter((q) => progress.questions[q.id]?.status === 'solved').length;
      return { level, solved, total: qs.length, pct: pct(solved, qs.length) };
    })
    .filter((x) => x.total > 0);
}

/** solved / total for every topic the learner has started, in course order */
export function topicSolved(progress, topics) {
  return topics
    .map((t) => ({ topic: t, status: topicStatus(t, progress), ...topicStats(t, progress) }))
    .filter((x) => x.status === 'in-progress' || x.status === 'completed')
    .map((x) => ({ topic: x.topic, solved: x.solved, total: x.total, pct: pct(x.solved, x.total), mastery: x.mastery, status: x.status }));
}

/**
 * First-try accuracy of the three things dsa-js grades:
 * lesson checkpoints, pattern challenges, and code submissions (share that passed every test).
 * Each entry is null-safe: `seen` 0 means "no data yet".
 */
export function accuracy(progress, topics) {
  const ids = new Set(topics.flatMap((t) => t.questions.map((q) => q.id)));
  const qs = Object.entries(progress.questions || {})
    .filter(([id]) => ids.has(id))
    .map(([, s]) => s);
  const cps = Object.values(progress.checkpoints || {});
  const guesses = qs.filter((s) => s.patternGuess);
  const submissions = qs.reduce((a, s) => a + (s.submissions || 0), 0);
  const failed = qs.reduce((a, s) => a + (s.failedSubmissions || 0), 0);
  const passedSubs = Math.max(0, submissions - Math.min(failed, submissions));
  return [
    { id: 'checkpoints', label: 'Checkpoints', correct: cps.filter((c) => c.firstTryCorrect).length, seen: cps.length, pct: pct(cps.filter((c) => c.firstTryCorrect).length, cps.length), unit: 'answered' },
    { id: 'patterns', label: 'Pattern challenges', correct: guesses.filter((s) => s.patternGuess.correct).length, seen: guesses.length, pct: pct(guesses.filter((s) => s.patternGuess.correct).length, guesses.length), unit: 'guessed' },
    { id: 'submissions', label: 'Submissions', correct: passedSubs, seen: submissions, pct: pct(passedSubs, submissions), unit: 'submitted' },
  ];
}

/** headline numbers for the KPI row */
export function kpis(progress, topics) {
  const all = topics.flatMap((t) => t.questions);
  const solved = all.filter((q) => progress.questions[q.id]?.status === 'solved').length;
  const masteries = topics.map((t) => topicStats(t, progress).mastery);
  const acc = accuracy(progress, topics);
  const timeMs = Object.values(progress.questions || {}).reduce((a, s) => a + (s.timeSpentMs || 0), 0);
  return {
    topicsCompleted: { done: topics.filter((t) => topicStatus(t, progress) === 'completed').length, total: topics.length },
    solved: { done: solved, total: all.length },
    mastery: masteries.length ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : 0,
    checkpoints: acc[0],
    patterns: acc[1],
    submissions: acc[2],
    timeMs,
  };
}

/** 0 = no activity, 1 = 1–2 actions, 2 = 3–7, 3 = 8+ (progress.activity counts recorded actions per day) */
export const activityLevel = (n) => (!n ? 0 : n < 3 ? 1 : n < 8 ? 2 : 3);

/** the last `weeks` calendar weeks (Monday-first columns, oldest first), ending with the week that holds `now` */
export function activityWeeks(activity = {}, now = new Date(), weeks = 12) {
  const today = todayKey(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const day = todayKey(date);
      const count = activity[day] || 0;
      return { day, count, level: activityLevel(count), today: day === today, future: day > today };
    }),
  );
}

/** number of distinct active days within the last `n` days, today included */
export function activeInLast(activity = {}, n = 7, now = new Date()) {
  let c = 0;
  for (let i = 0; i < n; i++) if (activity[todayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))]) c++;
  return c;
}

/**
 * Weak topics for the dashboard (selectors.weakAreas scoring, weakest first), each with the
 * concrete things to redo: unsolved questions you struggled with, missed checkpoints,
 * questions whose pattern you mis-identified and questions solved only after peeking.
 */
export function weakForChart(progress, topics, limit = 6) {
  return weakTopicsOf(progress, topics)
    .slice(0, limit)
    .map((w) => {
      const states = w.topic.questions.map((q) => ({ q, st: progress.questions[q.id] }));
      const retry = states.filter(({ st }) => st && st.status !== 'solved' && isMistake(st)).map((x) => x.q);
      const wrongPattern = states.filter(({ st }) => st?.patternGuess && st.patternGuess.correct === false).map((x) => x.q);
      const peeked = states.filter(({ st }) => st?.solutionViewedBeforeSolve).map((x) => x.q);
      const failedSubs = states.reduce((a, { st }) => a + (st?.failedSubmissions || 0), 0);
      return {
        ...w,
        weakness: Math.round((1 - w.score) * 100),
        scorePct: Math.round(w.score * 100),
        retry,
        wrongPattern,
        peeked,
        failedSubs,
        missedCheckpoints: missedCheckpoints(progress, w.topic).length,
      };
    });
}
