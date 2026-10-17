// App wiring for the pure achievements catalogue: the real content + selectors as its context,
// and a memoised evaluation hook for pages.
import { useMemo } from 'react';
import { ACHIEVEMENTS, buildAchievementContext, evaluateAll, TIER_LABEL } from '../content/achievements.js';
import { allQuestions, companies, companyQuestions, stages, topics } from '../content/index.js';
import { streak, topicStatus } from './selectors.js';

export const achievementCtx = buildAchievementContext({ topics, stages, allQuestions, companies, companyQuestions, topicStatus, streak });

/** { [id]: evaluation } for the current progress (memoised on the progress object). */
export function useAchievementEvaluations(progress) {
  return useMemo(() => evaluateAll(progress, achievementCtx), [progress]);
}

export const formatEarnedDate = (ts) => (ts ? new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Accessible one-line description of a badge: "Problem Solver — gold, earned 12 Oct 2026" / "Locked: Solve 50 coding questions". */
export function badgeLabel(achievement, stored, evaluation) {
  if (stored?.tier) {
    const tier = TIER_LABEL[stored.tier] ? `${TIER_LABEL[stored.tier].toLowerCase()}, ` : '';
    return `${achievement.name} — ${tier}earned ${formatEarnedDate(stored.earnedAt)}`;
  }
  const req = evaluation?.requirement || '';
  return `${achievement.name}. Locked: ${req.charAt(0).toLowerCase()}${req.slice(1)}`;
}

export const ACHIEVEMENT_TOTAL = ACHIEVEMENTS.length;
