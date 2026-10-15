// "Your next step": one deterministic recommendation from progress + topic metadata.
// Pure (no React, no storage) so it can be unit-tested with fake progress objects.
//
// Rules, in order:
//   0. nothing done yet                → start Stage 1's first topic
//   1. current topic = the most recently active in-progress topic; inside it:
//      a. lesson not finished           → continue the lesson at the saved step
//      b. a missed pattern challenge    → retry it (unsolved question whose pattern guess is still wrong)
//      c. an unsolved question          → attempted ones first, then the next in list order (Easy → Hard)
//   2. revision due                     → an unsolved question you already struggled with
//                                         (failed submission, wrong pattern guess, peeked at the solution),
//                                         else the weakest topic's Review tab
//   3. next topic                       → the first available topic in course order
//   4. everything complete              → Revision
// `secondary` is an optional "or revise …" alternative (weak area / question to retry).
import { topicPerformance, topicStats, topicStatus } from '../state/selectors.js';

const WEAK_BELOW = 0.65; // same threshold as selectors.weakAreas()

export function hasAnyProgress(progress) {
  return (
    Object.keys(progress.topics || {}).length > 0 ||
    Object.keys(progress.questions || {}).length > 0 ||
    Object.keys(progress.checkpoints || {}).length > 0
  );
}

const qHref = (q) => `/topic/${q.topicId}/q/${q.id}`;
const patternName = (topic, q) => topic.patterns.find((p) => p.id === q.pattern)?.name;

/** True when a question was answered badly at some point (same signals as selectors.mistakeQuestions). */
export function isMistake(qs) {
  return !!qs && ((qs.failedSubmissions || 0) > 0 || qs.patternGuess?.correct === false || !!qs.solutionViewedBeforeSolve);
}

/** The in-progress topic touched most recently (lesson activity or a question opened), or null. */
export function currentTopic(progress, topics) {
  const lastQ = progress.lastVisited || null;
  let best = null;
  let bestAt = -1;
  for (const t of topics) {
    if (topicStatus(t, progress) !== 'in-progress') continue;
    const at = Math.max(progress.topics[t.id]?.lastActiveAt || 0, lastQ?.topicId === t.id ? lastQ.at || 0 : 0);
    if (at > bestAt) {
      best = t;
      bestAt = at;
    }
  }
  return best;
}

/** The next thing to do inside one topic, or null when it has nothing left to suggest. */
export function stepInTopic(progress, topic) {
  const s = topicStats(topic, progress);
  if (topic.hasContent && !s.lessonCompleted && topic.lesson.sections.length) {
    const n = topic.lesson.sections.length;
    const i = Math.min(s.sectionIndex, n - 1);
    const sec = topic.lesson.sections[i];
    const fresh = i === 0 && !s.checkpointsAnswered && !(progress.topics[topic.id]?.maxSectionIndex > 0);
    return {
      kind: 'lesson',
      title: fresh ? `Start the lesson: ${topic.title}` : `Continue the lesson: ${sec.title}`,
      detail: `Step ${i + 1} of ${n} · ${s.checkpointsPassed}/${s.checkpointsTotal} checkpoints answered. The lesson pauses at each checkpoint until you answer it.`,
      href: `/topic/${topic.id}`,
      topic,
    };
  }
  const states = topic.questions.map((q) => ({ q, st: progress.questions[q.id] }));
  const missedPattern = states.find(({ st }) => st?.patternGuess && !st.patternGuess.finalCorrect && st.status !== 'solved');
  if (missedPattern) {
    return {
      kind: 'pattern',
      title: `Retry the pattern challenge: ${missedPattern.q.title}`,
      detail: 'Your pattern guess for this question was wrong. Re-read the clues, pick again, then solve it.',
      href: qHref(missedPattern.q),
      topic,
      question: missedPattern.q,
    };
  }
  const attempted = states.find(({ st }) => st?.status === 'attempted');
  const next = attempted || states.find(({ st }) => st?.status !== 'solved');
  if (next) {
    const pn = patternName(topic, next.q);
    const failed = next.st?.failedSubmissions || 0;
    return {
      kind: 'question',
      title: `${attempted ? 'Finish' : 'Solve'}: ${next.q.title}`,
      detail: attempted
        ? `${next.q.difficulty}${pn ? ` · ${pn}` : ''}. You've started it${failed ? ` (${failed} failed submission${failed === 1 ? '' : 's'})` : ''}; run, fix, then submit.`
        : `${next.q.difficulty}${pn ? ` · ${pn}` : ''}. Name the pattern first, then code it and submit against the hidden tests.`,
      href: qHref(next.q),
      topic,
      question: next.q,
    };
  }
  return null;
}

/** Unsolved questions you already struggled with, most recently opened first. */
export function questionsToRetry(progress, topics) {
  const out = [];
  for (const t of topics)
    for (const q of t.questions) {
      const st = progress.questions[q.id];
      if (st && st.status !== 'solved' && isMistake(st)) out.push({ q, t, at: st.lastOpenedAt || 0 });
    }
  return out.sort((a, b) => b.at - a.at);
}

/** Topics flagged weak (same scoring as selectors.weakAreas), weakest first. */
export function weakTopicsOf(progress, topics) {
  return topics
    .map((t) => ({ topic: t, ...topicPerformance(t, progress) }))
    .filter((x) => x.score !== null && x.score < WEAK_BELOW)
    .sort((a, b) => a.score - b.score);
}

function revisionStep(progress, topics) {
  const retry = questionsToRetry(progress, topics)[0];
  if (retry)
    return {
      kind: 'revision',
      title: `Retry: ${retry.q.title}`,
      detail: `${retry.t.title} · you struggled with this one and haven't solved it yet. Try it again without the solution.`,
      href: qHref(retry.q),
      topic: retry.t,
      question: retry.q,
    };
  const weak = weakTopicsOf(progress, topics)[0];
  if (weak)
    return {
      kind: 'revision',
      title: `Revise weak area: ${weak.topic.title}`,
      detail: weak.signals[0] ? `${weak.signals[0]}. The Review tab lists the checkpoints and questions to redo.` : 'The Review tab lists the checkpoints and questions to redo.',
      href: `/topic/${weak.topic.id}?tab=review`,
      topic: weak.topic,
    };
  return null;
}

export function nextStep(progress, topics) {
  if (!topics.length) return { kind: 'done', title: 'No topics yet', detail: '', href: '/', secondary: null };
  if (!hasAnyProgress(progress)) {
    const first = topics[0];
    return {
      kind: 'start',
      title: `Start ${first.stageTitle ? `${first.stageTitle}: ` : ''}${first.title}`,
      detail: first.description || 'Every topic starts with a short interactive lesson, then pattern-by-pattern practice.',
      href: `/topic/${first.id}`,
      topic: first,
      secondary: null,
    };
  }

  const cur = currentTopic(progress, topics);
  let primary = cur ? stepInTopic(progress, cur) : null;
  if (!primary) primary = revisionStep(progress, topics);
  if (!primary) {
    const t = topics.find((x) => topicStatus(x, progress) === 'available');
    if (t)
      primary = {
        kind: 'topic',
        title: `Start ${t.title}`,
        detail: `${t.stageTitle ? `${t.stageTitle} · ` : ''}${t.description || ''}`.trim(),
        href: `/topic/${t.id}`,
        topic: t,
      };
  }
  if (!primary)
    primary = {
      kind: 'done',
      title: 'Every topic is complete',
      detail: 'Keep it sharp: retry questions you struggled with and skim the cheat sheets before interviews.',
      href: '/revision',
    };

  // secondary: a weak area or a question to retry, when the primary isn't already revision
  let secondary = null;
  if (primary.kind !== 'revision') {
    const weak = weakTopicsOf(progress, topics)[0];
    const retry = questionsToRetry(progress, topics).find((r) => qHref(r.q) !== primary.href);
    if (weak) secondary = { title: `Revise weak area: ${weak.topic.title}`, href: `/topic/${weak.topic.id}?tab=review` };
    else if (retry) secondary = { title: `Retry ${retry.q.title}`, href: qHref(retry.q) };
  }
  return { ...primary, secondary };
}

