// Pure reducer for all learner progress. Persisted to localStorage by ProgressProvider.
import { tierRank } from '../content/achievements.js';

export const STORAGE_KEY = 'dsa-journey:progress:v1';

export const initialProgress = () => ({
  version: 1,
  topics: {},
  checkpoints: {},
  reflections: {},
  questions: {},
  activity: {},
  lastVisited: null,
  // earned badges: { [id]: { tier, earnedAt, tiers: { [tier]: earnedAt } } } (see src/content/achievements.js)
  achievements: {},
});

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const touch = (state) => {
  const k = todayKey();
  return { ...state, activity: { ...state.activity, [k]: (state.activity[k] || 0) + 1 } };
};

const now = () => Date.now();

function updateTopic(state, topicId, patch) {
  const prev = state.topics[topicId] || {};
  const next = { startedAt: prev.startedAt || now(), ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
  return { ...state, topics: { ...state.topics, [topicId]: next } };
}

function updateQuestion(state, qid, patch) {
  const prev = state.questions[qid] || { attempts: 0, runs: 0, submissions: 0, failedSubmissions: 0, hintsRevealed: 0, timeSpentMs: 0 };
  const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
  return { ...state, questions: { ...state.questions, [qid]: next } };
}

export function progressReducer(state, action) {
  switch (action.type) {
    case 'LESSON_SET_SECTION':
      return updateTopic(state, action.topicId, (t) => ({
        sectionIndex: action.index,
        maxSectionIndex: Math.max(t.maxSectionIndex || 0, action.index),
        lastActiveAt: now(),
      }));
    case 'LESSON_COMPLETE':
      return touch(updateTopic(state, action.topicId, (t) => ({ lessonCompleted: true, completedLessonAt: t.completedLessonAt || now(), lastActiveAt: now() })));
    case 'LESSON_RESET': {
      const topics = { ...state.topics, [action.topicId]: { ...(state.topics[action.topicId] || {}), sectionIndex: 0 } };
      const checkpoints = { ...state.checkpoints };
      for (const id of action.checkpointIds || []) delete checkpoints[id];
      return { ...state, topics, checkpoints };
    }
    case 'TOPIC_UNLOCK':
      return updateTopic(state, action.topicId, { unlockedManually: true });
    case 'TOPIC_MARK_COMPLETE':
      return updateTopic(state, action.topicId, { manualComplete: action.value });
    case 'CHECKPOINT_ANSWER': {
      const prev = state.checkpoints[action.id] || { attempts: 0, wrongChoices: [] };
      const firstTry = prev.attempts === 0;
      const next = {
        ...prev,
        topicId: action.topicId,
        attempts: prev.attempts + 1,
        lastChoice: action.choice,
        correct: prev.correct || action.correct,
        firstTryCorrect: firstTry ? action.correct : prev.firstTryCorrect,
        wrongChoices: action.correct ? prev.wrongChoices : [...new Set([...(prev.wrongChoices || []), action.choice])],
        answeredAt: now(),
      };
      const s = { ...state, checkpoints: { ...state.checkpoints, [action.id]: next } };
      return touch(updateTopic(s, action.topicId, { lastActiveAt: now() }));
    }
    case 'CHECKPOINT_REVEAL': {
      const prev = state.checkpoints[action.id] || { attempts: 0, wrongChoices: [] };
      return {
        ...state,
        checkpoints: {
          ...state.checkpoints,
          [action.id]: { ...prev, topicId: action.topicId, revealed: true, firstTryCorrect: prev.attempts === 0 ? false : prev.firstTryCorrect, attempts: Math.max(prev.attempts, 1) },
        },
      };
    }
    case 'REFLECT':
      return { ...state, reflections: { ...state.reflections, [action.key]: action.value } };

    case 'Q_OPEN': {
      const s = updateQuestion(state, action.qid, (q) => ({ firstOpenedAt: q.firstOpenedAt || now(), status: q.status || 'opened', lastOpenedAt: now() }));
      return { ...s, lastVisited: { topicId: action.topicId, questionId: action.qid, at: now() } };
    }
    case 'Q_TIME':
      return updateQuestion(state, action.qid, (q) => ({ timeSpentMs: (q.timeSpentMs || 0) + action.ms }));
    case 'Q_PATTERN_GUESS':
      return touch(
        updateQuestion(state, action.qid, (q) =>
          q.patternGuess ? { patternGuess: { ...q.patternGuess, retried: true, finalCorrect: action.correct } } : { patternGuess: { choice: action.choice, correct: action.correct, finalCorrect: action.correct } },
        ),
      );
    case 'Q_HINT':
      return updateQuestion(state, action.qid, (q) => ({ hintsRevealed: Math.max(q.hintsRevealed || 0, action.count) }));
    case 'Q_APPROACH':
      return updateQuestion(state, action.qid, { approachViewed: true });
    case 'Q_VIEW_SOLUTION':
      return updateQuestion(state, action.qid, (q) => ({ solutionViewed: true, solutionViewedBeforeSolve: q.status !== 'solved' ? true : q.solutionViewedBeforeSolve }));
    case 'Q_SAVE_CODE':
      return updateQuestion(state, action.qid, { code: action.code });
    case 'Q_RUN':
      return updateQuestion(state, action.qid, (q) => ({
        runs: (q.runs || 0) + 1,
        status: q.status === 'solved' ? 'solved' : 'attempted',
        lastResult: { passed: action.passed, total: action.total, at: now(), kind: 'run' },
      }));
    case 'Q_SUBMIT': {
      const solvedNow = action.allPassed;
      return touch(
        updateQuestion(state, action.qid, (q) => ({
          attempts: (q.attempts || 0) + 1,
          submissions: (q.submissions || 0) + 1,
          failedSubmissions: (q.failedSubmissions || 0) + (solvedNow ? 0 : 1),
          status: q.status === 'solved' || solvedNow ? 'solved' : 'attempted',
          solvedAt: q.solvedAt || (solvedNow ? now() : undefined),
          solvedWithoutSolution: q.status === 'solved' ? q.solvedWithoutSolution : solvedNow ? !q.solutionViewed : undefined,
          lastResult: { passed: action.passed, total: action.total, at: now(), kind: 'submit' },
        })),
      );
    }
    case 'Q_QUIZ_ANSWER':
      return touch(
        updateQuestion(state, action.qid, (q) => ({
          attempts: (q.attempts || 0) + 1,
          failedSubmissions: (q.failedSubmissions || 0) + (action.correct ? 0 : 1),
          quizFirstCorrect: q.attempts ? q.quizFirstCorrect : action.correct,
          status: q.status === 'solved' || action.correct ? 'solved' : 'attempted',
          solvedAt: q.solvedAt || (action.correct ? now() : undefined),
          solvedWithoutSolution: q.status === 'solved' ? q.solvedWithoutSolution : action.correct && !q.attempts,
        })),
      );
    case 'Q_MARK_SOLVED':
      return touch(updateQuestion(state, action.qid, (q) => ({ status: 'solved', solvedAt: q.solvedAt || now(), manual: true })));
    case 'Q_RESET': {
      const questions = { ...state.questions };
      delete questions[action.qid];
      return { ...state, questions };
    }
    case 'ACHIEVEMENTS_EARN': {
      // action.earned: [{ id, tier, tiers: [newly reached tier names] }]; never downgrades a stored tier
      const at = action.at || now();
      const achievements = { ...(state.achievements || {}) };
      for (const e of action.earned || []) {
        const prev = achievements[e.id] || {};
        if (prev.tier && tierRank(prev.tier) >= tierRank(e.tier)) continue;
        const tiers = { ...(prev.tiers || {}) };
        for (const t of e.tiers?.length ? e.tiers : [e.tier]) if (!tiers[t]) tiers[t] = at;
        achievements[e.id] = { ...prev, tier: e.tier, earnedAt: at, tiers };
      }
      return { ...state, achievements };
    }
    case 'IMPORT':
      return { ...initialProgress(), ...action.state };
    case 'RESET_ALL':
      return initialProgress();
    default:
      return state;
  }
}
