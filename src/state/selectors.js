// Pure derived-data functions: (content, progress) → numbers the UI displays.
import { topics, topicById, allQuestions, getCheckpoints, companies, companyQuestions, DIFFICULTIES } from '../content/index.js';
import { todayKey } from './progressReducer.js';

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export { pct };

export const isSolved = (progress, qid) => progress.questions[qid]?.status === 'solved';
export const questionState = (progress, qid) => progress.questions[qid] || null;

export function checkpointPassed(progress, id) {
  const c = progress.checkpoints[id];
  return !!(c && (c.correct || c.revealed));
}

export function prerequisitesMet(topic, progress) {
  return topic.prerequisites.every((p) => {
    const t = progress.topics[p];
    return t && (t.lessonCompleted || t.manualComplete);
  });
}

export function topicStats(topic, progress) {
  const byDiff = {};
  for (const d of DIFFICULTIES) byDiff[d] = { solved: 0, total: 0 };
  let solved = 0;
  let attempted = 0;
  for (const q of topic.questions) {
    byDiff[q.difficulty].total++;
    const st = progress.questions[q.id];
    if (st?.status === 'solved') {
      byDiff[q.difficulty].solved++;
      solved++;
    } else if (st?.status === 'attempted') attempted++;
  }
  const cps = getCheckpoints(topic);
  const cpStates = cps.map((c) => progress.checkpoints[c.id]).filter(Boolean);
  const cpPassed = cps.filter((c) => checkpointPassed(progress, c.id)).length;
  const cpFirstTry = cpStates.filter((c) => c.firstTryCorrect).length;
  const t = progress.topics[topic.id] || {};
  const lessonCompleted = !!t.lessonCompleted;
  const sections = topic.lesson.sections.length;
  const lessonFraction = lessonCompleted ? 1 : sections ? Math.min(1, (t.maxSectionIndex || 0) / sections) * 0.9 : 0;

  // Mastery: learning 30%, Easy 20%, Medium 30%, Hard 20% (weights renormalised over difficulties that exist).
  const parts = [{ w: 30, v: lessonFraction }];
  const W = { Easy: 20, Medium: 30, Hard: 20 };
  for (const d of DIFFICULTIES) if (byDiff[d].total) parts.push({ w: W[d], v: byDiff[d].solved / byDiff[d].total });
  const wSum = parts.reduce((s, p) => s + p.w, 0);
  const mastery = Math.round((parts.reduce((s, p) => s + p.w * p.v, 0) / wSum) * 100);

  return {
    byDiff,
    solved,
    attempted,
    total: topic.questions.length,
    lessonCompleted,
    lessonFraction,
    sectionIndex: t.sectionIndex || 0,
    checkpointsTotal: cps.length,
    checkpointsPassed: cpPassed,
    checkpointsAnswered: cpStates.length,
    checkpointFirstTry: cpFirstTry,
    mastery,
  };
}

export function topicStatus(topic, progress) {
  const t = progress.topics[topic.id] || {};
  const stats = topicStats(topic, progress);
  if (t.manualComplete) return 'completed';
  if (stats.lessonCompleted && (stats.total === 0 || stats.solved >= Math.ceil(stats.total * 0.5))) return 'completed';
  const started = t.sectionIndex > 0 || t.maxSectionIndex > 0 || stats.checkpointsAnswered > 0 || stats.solved > 0 || stats.attempted > 0 || stats.lessonCompleted;
  if (started) return 'in-progress';
  if (topic.prerequisites.length === 0 || prerequisitesMet(topic, progress) || t.unlockedManually) return 'available';
  return 'locked';
}

export const STATUS_LABEL = { locked: 'Locked', available: 'Available', 'in-progress': 'In Progress', completed: 'Completed' };

export function overallStats(progress) {
  let solved = 0;
  const byDiff = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
  for (const q of allQuestions) {
    byDiff[q.difficulty].total++;
    if (isSolved(progress, q.id)) {
      solved++;
      byDiff[q.difficulty].solved++;
    }
  }
  const statuses = topics.map((t) => topicStatus(t, progress));
  const masteries = topics.map((t) => topicStats(t, progress).mastery);
  const patternsDone = topics.flatMap((t) =>
    t.patterns.filter((p) => {
      const qs = t.questions.filter((q) => q.pattern === p.id);
      return progress.topics[t.id]?.lessonCompleted && qs.length > 0 && qs.filter((q) => isSolved(progress, q.id)).length >= Math.ceil(qs.length / 2);
    }),
  ).length;
  const totalPatterns = topics.reduce((s, t) => s + t.patterns.length, 0);
  return {
    solved,
    total: allQuestions.length,
    remaining: allQuestions.length - solved,
    byDiff,
    topicsCompleted: statuses.filter((s) => s === 'completed').length,
    topicsInProgress: statuses.filter((s) => s === 'in-progress').length,
    topicsTotal: topics.length,
    patternsDone,
    totalPatterns,
    overall: Math.round(masteries.reduce((a, b) => a + b, 0) / (masteries.length || 1)),
  };
}

export function patternStats(pattern, progress) {
  const topic = topicById[pattern.topicId];
  const qs = topic.questions.filter((q) => q.pattern === pattern.id);
  const solved = qs.filter((q) => isSolved(progress, q.id)).length;
  return { total: qs.length, solved, questions: qs };
}

export function streak(progress) {
  const days = progress.activity || {};
  let count = 0;
  const d = new Date();
  // Today not yet active still keeps yesterday's streak alive.
  if (!days[todayKey(d)]) d.setDate(d.getDate() - 1);
  while (days[todayKey(d)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  let longest = 0;
  let run = 0;
  const keys = Object.keys(days).sort();
  let prev = null;
  for (const k of keys) {
    const cur = new Date(k + 'T00:00:00');
    if (prev && (cur - prev) / 86400000 === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  return { current: count, longest, activeToday: !!days[todayKey()] };
}

// Performance signals per topic → weak / strong areas.
export function topicPerformance(topic, progress) {
  const cps = getCheckpoints(topic).map((c) => progress.checkpoints[c.id]).filter(Boolean);
  const qStates = topic.questions.map((q) => ({ q, s: progress.questions[q.id] })).filter((x) => x.s);
  const guesses = qStates.filter((x) => x.s.patternGuess);
  const attempted = qStates.filter((x) => x.s.status === 'solved' || x.s.status === 'attempted' || x.s.submissions);
  const signals = [];
  let score = 0;
  let weight = 0;

  if (cps.length >= 2) {
    const acc = cps.filter((c) => c.firstTryCorrect).length / cps.length;
    score += acc * 2;
    weight += 2;
    if (acc < 0.7) signals.push(`${cps.filter((c) => !c.firstTryCorrect).length} of ${cps.length} checkpoints missed on first try`);
  }
  if (guesses.length >= 2) {
    const acc = guesses.filter((x) => x.s.patternGuess.correct).length / guesses.length;
    score += acc * 2;
    weight += 2;
    if (acc < 0.7) signals.push(`Pattern identified correctly in ${guesses.filter((x) => x.s.patternGuess.correct).length}/${guesses.length} questions`);
  }
  if (attempted.length >= 2) {
    const clean = attempted.filter((x) => x.s.status === 'solved' && x.s.solvedWithoutSolution).length / attempted.length;
    score += clean * 3;
    weight += 3;
    const peeked = attempted.filter((x) => x.s.solutionViewedBeforeSolve).length;
    const unsolved = attempted.filter((x) => x.s.status !== 'solved').length;
    if (peeked) signals.push(`Viewed the solution before solving ${peeked} question${peeked > 1 ? 's' : ''}`);
    if (unsolved) signals.push(`${unsolved} attempted question${unsolved > 1 ? 's' : ''} not solved yet`);
    const failed = attempted.reduce((s, x) => s + (x.s.failedSubmissions || 0), 0);
    if (failed >= 3) signals.push(`${failed} failed submissions`);
  }
  return { score: weight ? score / weight : null, signals, dataPoints: cps.length + guesses.length + attempted.length };
}

export function weakAreas(progress) {
  return topics
    .map((t) => ({ topic: t, ...topicPerformance(t, progress) }))
    .filter((x) => x.score !== null && x.score < 0.65)
    .sort((a, b) => a.score - b.score);
}

export function strongAreas(progress) {
  return topics
    .map((t) => ({ topic: t, ...topicPerformance(t, progress) }))
    .filter((x) => x.score !== null && x.score >= 0.85 && x.dataPoints >= 4)
    .sort((a, b) => b.score - a.score);
}

// Questions answered incorrectly at some point (for Review).
export function mistakeQuestions(progress, topicId) {
  return allQuestions.filter((q) => {
    if (topicId && q.topicId !== topicId) return false;
    const s = progress.questions[q.id];
    if (!s) return false;
    return (s.failedSubmissions || 0) > 0 || s.patternGuess?.correct === false || s.solutionViewedBeforeSolve;
  });
}

export function missedCheckpoints(progress, topic) {
  return getCheckpoints(topic).filter((c) => {
    const s = progress.checkpoints[c.id];
    return s && !s.firstTryCorrect;
  });
}

export function recommendations(progress) {
  const withStatus = topics.map((t) => ({ t, status: topicStatus(t, progress) }));
  const inProgress = withStatus.filter((x) => x.status === 'in-progress');
  // Current = most recently active in-progress topic; else first available.
  inProgress.sort((a, b) => (progress.topics[b.t.id]?.lastActiveAt || 0) - (progress.topics[a.t.id]?.lastActiveAt || 0));
  let current = inProgress[0]?.t;
  const lastQ = progress.lastVisited?.topicId && topicById[progress.lastVisited.topicId];
  if (lastQ && topicStatus(lastQ, progress) === 'in-progress') {
    const lastQAt = progress.lastVisited.at || 0;
    const curAt = current ? progress.topics[current.id]?.lastActiveAt || 0 : 0;
    if (!current || lastQAt > curAt) current = lastQ;
  }
  if (!current) current = withStatus.find((x) => x.status === 'available')?.t || topics[0];

  const nextTopic = withStatus.find((x) => x.t.id !== current.id && x.status === 'available')?.t || withStatus.find((x) => x.status === 'locked')?.t || null;

  const curStats = topicStats(current, progress);
  let nextAction;
  if (!curStats.lessonCompleted && current.hasContent) {
    const sec = current.lesson.sections[curStats.sectionIndex];
    nextAction = { kind: 'lesson', label: sec ? `Continue lesson: ${sec.title}` : 'Start the lesson', topic: current };
  } else {
    const nextQ = current.questions.find((q) => !isSolved(progress, q.id));
    nextAction = nextQ ? { kind: 'question', label: nextQ.title, question: nextQ, topic: current } : { kind: 'topic', label: nextTopic ? `Start ${nextTopic.title}` : 'Review completed topics', topic: nextTopic || current };
  }
  const currentPattern = (() => {
    const q = nextAction.question;
    if (q) return current.patterns.find((p) => p.id === q.pattern);
    return current.patterns[0];
  })();
  return { current, currentStats: curStats, currentPattern, nextTopic, nextAction };
}

export function recentlySolved(progress, limit = 6) {
  return allQuestions
    .filter((q) => progress.questions[q.id]?.solvedAt)
    .sort((a, b) => progress.questions[b.id].solvedAt - progress.questions[a.id].solvedAt)
    .slice(0, limit);
}

export function companyProgress(progress) {
  return companies
    .map((c) => {
      const entries = companyQuestions.filter((cq) => cq.company === c.id && cq.question);
      const solved = entries.filter((cq) => isSolved(progress, cq.questionId)).length;
      return { company: c, solved, total: entries.length, allEntries: companyQuestions.filter((cq) => cq.company === c.id).length };
    })
    .filter((x) => x.allEntries > 0);
}

export function activityTotals(progress) {
  const qs = Object.values(progress.questions);
  const cps = Object.values(progress.checkpoints);
  return {
    timeMs: qs.reduce((s, q) => s + (q.timeSpentMs || 0), 0),
    submissions: qs.reduce((s, q) => s + (q.submissions || 0), 0),
    failedSubmissions: qs.reduce((s, q) => s + (q.failedSubmissions || 0), 0),
    runs: qs.reduce((s, q) => s + (q.runs || 0), 0),
    checkpointsAnswered: cps.length,
    checkpointsFirstTry: cps.filter((c) => c.firstTryCorrect).length,
    patternGuesses: qs.filter((q) => q.patternGuess).length,
    patternCorrect: qs.filter((q) => q.patternGuess?.correct).length,
  };
}

export function formatDuration(ms) {
  if (!ms) return '0m';
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
