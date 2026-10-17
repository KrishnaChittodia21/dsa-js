// Achievements (GitHub-style milestone badges): pure data + pure evaluation, no React and no
// content imports, so the same code runs in the app and in node checks.
//
// Every achievement is { id, name, description, group, art, tiers?, goal?, measure, requirement }.
//  - art: a glyph key resolved to a lucide icon by src/components/achievements/Badge.jsx
//  - tiers: [{ tier: 'bronze'|'silver'|'gold'|'diamond', goal }] (goal may be a function of ctx)
//  - goal: for single-step badges (stored with tier 'standard')
//  - measure(progress, ctx) → number (the "34" in "34 / 50")
//  - requirement(goal, ctx) → short text for a locked badge ("Solve 50 coding questions")
//
// ctx comes from buildAchievementContext(content): the topics/stages/questions/company lists plus
// the topicStatus and streak selectors (injected so this file stays free of app imports).

export const TIERS = ['bronze', 'silver', 'gold', 'diamond'];
export const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', diamond: 'Diamond', standard: '' };
/** rank for comparisons; 'standard' is the only step of a single-step badge */
export const tierRank = (tier) => (tier === 'standard' ? 0 : TIERS.indexOf(tier));

export const GROUPS = [
  { id: 'start', title: 'Getting started', blurb: 'Your first steps on the journey.' },
  { id: 'content', title: 'Lessons & stages', blurb: 'Work through the curriculum, stage by stage.' },
  { id: 'practice', title: 'Practice', blurb: 'Solve coding questions across every difficulty.' },
  { id: 'understanding', title: 'Understanding', blurb: 'Get it right first time.' },
  { id: 'consistency', title: 'Consistency', blurb: 'Show up day after day.' },
  { id: 'fun', title: 'Just for fun', blurb: 'Small surprises along the way.' },
];

// ---------- measuring helpers (all read the real progress shape) ----------
const qStates = (p) => Object.entries(p.questions || {});
const solvedIds = (p) => qStates(p).filter(([, s]) => s?.status === 'solved').map(([id]) => id);
const lessonsDone = (p) => Object.values(p.topics || {}).filter((t) => t?.lessonCompleted).length;
const solvedIn = (p, list) => list.filter((q) => p.questions?.[q.id]?.status === 'solved').length;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Precomputes the content-dependent lists every measure needs. */
export function buildAchievementContext({ topics, stages, allQuestions, companies = [], companyQuestions = [], topicStatus, streak }) {
  const coding = allQuestions.filter((q) => q.kind !== 'quiz');
  const byDiff = { Easy: [], Medium: [], Hard: [] };
  for (const q of allQuestions) byDiff[q.difficulty]?.push(q);
  // per company: the questions that exist in the bank (cq.question is null for off-bank entries)
  const companyBank = companies
    .map((c) => ({ company: c, ids: [...new Set(companyQuestions.filter((cq) => cq.company === c.id && cq.question).map((cq) => cq.questionId))] }))
    .filter((c) => c.ids.length > 0);
  return { topics, stages, allQuestions, coding, byDiff, companyBank, topicStatus, streak };
}

const stageGraduate = (stageId, number, title, art) => ({
  id: `stage-${stageId}`,
  name: `${title} Graduate`,
  description: `Completed every topic in stage ${number}, ${title}.`,
  group: 'content',
  art,
  goal: (ctx) => ctx.stages.find((s) => s.id === stageId)?.topics.length || 1,
  measure: (p, ctx) => (ctx.stages.find((s) => s.id === stageId)?.topics || []).filter((t) => ctx.topicStatus(t, p) === 'completed').length,
  requirement: (goal) => `Complete all ${goal} topics in ${title}`,
  unit: 'topics',
});

const STAGE_BADGES = [
  ['foundations', 1, 'Foundations', 'blocks'],
  ['array-patterns', 2, 'Core Array Patterns', 'brackets'],
  ['linear', 3, 'Linear Structures & Searching', 'layers'],
  ['recursion', 4, 'Recursion & Sorting', 'repeat'],
  ['trees', 5, 'Trees & Heaps', 'tree'],
  ['graphs', 6, 'Graphs', 'network'],
  ['optimization', 7, 'Greedy, DP & Bits', 'cpu'],
  ['advanced', 8, 'Advanced DSA', 'rocket'],
];

export const ACHIEVEMENTS = [
  // ---- getting started ----
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Completed your first lesson.',
    group: 'start',
    art: 'footprints',
    goal: 1,
    measure: (p) => lessonsDone(p),
    requirement: () => 'Complete any lesson',
    unit: 'lessons',
  },
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Solved your first question.',
    group: 'start',
    art: 'terminal',
    goal: 1,
    measure: (p) => solvedIds(p).length,
    requirement: () => 'Solve any question',
    unit: 'solved',
  },
  {
    id: 'pattern-spotter',
    name: 'Pattern Spotter',
    description: 'Named the right pattern on your first guess.',
    group: 'start',
    art: 'eye',
    goal: 1,
    measure: (p) => qStates(p).filter(([, s]) => s?.patternGuess?.correct).length,
    requirement: () => "Guess a question's pattern correctly on the first try",
    unit: 'correct guesses',
  },

  // ---- content ----
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Lessons completed.',
    group: 'content',
    art: 'book',
    tiers: [
      { tier: 'bronze', goal: 1 },
      { tier: 'silver', goal: 8 },
      { tier: 'gold', goal: 16 },
      { tier: 'diamond', goal: 32 },
    ],
    measure: (p) => lessonsDone(p),
    requirement: (goal) => `Complete ${plural(goal, 'lesson')}`,
    unit: 'lessons',
  },
  ...STAGE_BADGES.map(([id, n, title, art]) => stageGraduate(id, n, title, art)),
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Completed every topic in the course.',
    group: 'content',
    art: 'crown',
    goal: (ctx) => ctx.topics.length,
    measure: (p, ctx) => ctx.topics.filter((t) => ctx.topicStatus(t, p) === 'completed').length,
    requirement: (goal) => `Complete all ${goal} topics`,
    unit: 'topics',
  },

  // ---- practice ----
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Coding questions solved.',
    group: 'practice',
    art: 'code',
    tiers: [
      { tier: 'bronze', goal: 10 },
      { tier: 'silver', goal: 50 },
      { tier: 'gold', goal: 150 },
      { tier: 'diamond', goal: (ctx) => ctx.coding.length },
    ],
    measure: (p, ctx) => solvedIn(p, ctx.coding),
    requirement: (goal) => `Solve ${goal} coding questions`,
    unit: 'solved',
  },
  {
    id: 'easy-rider',
    name: 'Easy Rider',
    description: 'Solved every Easy question.',
    group: 'practice',
    art: 'bike',
    goal: (ctx) => ctx.byDiff.Easy.length,
    measure: (p, ctx) => solvedIn(p, ctx.byDiff.Easy),
    requirement: (goal) => `Solve all ${goal} Easy questions`,
    unit: 'solved',
  },
  {
    id: 'middle-path',
    name: 'Middle Path',
    description: 'Solved every Medium question.',
    group: 'practice',
    art: 'scale',
    goal: (ctx) => ctx.byDiff.Medium.length,
    measure: (p, ctx) => solvedIn(p, ctx.byDiff.Medium),
    requirement: (goal) => `Solve all ${goal} Medium questions`,
    unit: 'solved',
  },
  {
    id: 'hard-mode',
    name: 'Hard Mode',
    description: 'Hard questions solved.',
    group: 'practice',
    art: 'mountain',
    tiers: [
      { tier: 'bronze', goal: 1 },
      { tier: 'gold', goal: (ctx) => ctx.byDiff.Hard.length },
    ],
    measure: (p, ctx) => solvedIn(p, ctx.byDiff.Hard),
    requirement: (goal) => (goal === 1 ? 'Solve a Hard question' : `Solve all ${goal} Hard questions`),
    unit: 'solved',
  },
  {
    id: 'clean-sheet',
    name: 'Clean Sheet',
    description: 'Questions solved without viewing the solution first.',
    group: 'practice',
    art: 'shield',
    tiers: [
      { tier: 'bronze', goal: 5 },
      { tier: 'silver', goal: 25 },
      { tier: 'gold', goal: 100 },
    ],
    measure: (p) => qStates(p).filter(([, s]) => s?.status === 'solved' && s.solvedWithoutSolution).length,
    requirement: (goal) => `Solve ${goal} questions without opening the solution`,
    unit: 'clean solves',
  },

  // ---- understanding ----
  {
    id: 'checkpoint-champion',
    name: 'Checkpoint Champion',
    description: 'Lesson checkpoints answered right on the first try.',
    group: 'understanding',
    art: 'check',
    tiers: [
      { tier: 'bronze', goal: 25 },
      { tier: 'silver', goal: 100 },
      { tier: 'gold', goal: 250 },
    ],
    measure: (p) => Object.values(p.checkpoints || {}).filter((c) => c?.firstTryCorrect).length,
    requirement: (goal) => `Answer ${goal} checkpoints right on the first try`,
    unit: 'first-try checkpoints',
  },
  {
    id: 'pattern-sense',
    name: 'Pattern Sense',
    description: 'Patterns named correctly on the first guess.',
    group: 'understanding',
    art: 'target',
    tiers: [
      { tier: 'bronze', goal: 10 },
      { tier: 'silver', goal: 50 },
      { tier: 'gold', goal: 150 },
    ],
    measure: (p) => qStates(p).filter(([, s]) => s?.patternGuess?.correct).length,
    requirement: (goal) => `Name the pattern right first time on ${goal} questions`,
    unit: 'correct guesses',
  },

  // ---- consistency ----
  {
    id: 'on-a-roll',
    name: 'On a Roll',
    description: 'Days studied in a row (your longest streak).',
    group: 'consistency',
    art: 'flame',
    tiers: [
      { tier: 'bronze', goal: 3 },
      { tier: 'silver', goal: 7 },
      { tier: 'gold', goal: 30 },
      { tier: 'diamond', goal: 100 },
    ],
    measure: (p, ctx) => {
      const s = ctx.streak(p);
      return Math.max(s.current, s.longest);
    },
    requirement: (goal) => `Study ${goal} days in a row`,
    unit: 'days',
  },

  // ---- fun ----
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Solved a question between midnight and 4 am.',
    group: 'fun',
    art: 'moon',
    goal: 1,
    measure: (p) =>
      qStates(p).filter(([, s]) => {
        if (s?.status !== 'solved' || !s.solvedAt) return false;
        const h = new Date(s.solvedAt).getHours();
        return h >= 0 && h < 4;
      }).length,
    requirement: () => 'Solve a question between 00:00 and 03:59',
    unit: 'late solves',
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Solved a question after three or more failed submissions.',
    group: 'fun',
    art: 'rotate',
    goal: 1,
    measure: (p) => qStates(p).filter(([, s]) => s?.status === 'solved' && (s.failedSubmissions || 0) >= 3).length,
    requirement: () => 'Solve a question after 3+ failed submissions on it',
    unit: 'comebacks',
  },
  {
    id: 'company-ready',
    name: 'Company Ready',
    description: "Solved every in-bank question from one company's list.",
    group: 'fun',
    art: 'briefcase',
    // progress shows the company you are closest to finishing
    goal: (ctx, p) => (p ? bestCompany(p, ctx)?.total : null) || Math.min(...ctx.companyBank.map((c) => c.ids.length), Infinity) || 1,
    measure: (p, ctx) => bestCompany(p, ctx)?.solved || 0,
    requirement: (goal, ctx, p) => {
      const b = p && bestCompany(p, ctx);
      return b ? `Solve all ${b.total} ${b.company.name} questions` : "Solve every question on one company's list";
    },
    unit: 'solved',
  },
];

/** The company whose in-bank list is closest to done (completed ones win, then by share solved). */
function bestCompany(p, ctx) {
  let best = null;
  for (const c of ctx.companyBank) {
    const solved = c.ids.filter((id) => p.questions?.[id]?.status === 'solved').length;
    const row = { company: c.company, solved, total: c.ids.length, done: solved === c.ids.length };
    const score = (r) => (r.done ? 2 : 0) + r.solved / r.total;
    if (!best || score(row) > score(best) || (score(row) === score(best) && row.total < best.total)) best = row;
  }
  return best;
}

export const achievementById = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

const resolve = (goal, ctx, p) => (typeof goal === 'function' ? goal(ctx, p) : goal);

/** The tier ladder of one achievement with goals resolved: [{ tier, goal }]. */
export function tierLadder(a, ctx, progress) {
  if (a.tiers) {
    const out = [];
    for (const t of a.tiers) {
      const goal = resolve(t.goal, ctx, progress);
      // a content-sized goal ("all") never sits below an earlier fixed step
      if (!out.length || goal > out[out.length - 1].goal) out.push({ tier: t.tier, goal });
    }
    return out;
  }
  return [{ tier: 'standard', goal: resolve(a.goal, ctx, progress) }];
}

/**
 * Evaluate one achievement → { id, value, tiers: [{ tier, goal, reached }], tier (highest reached
 * or null), next ({ tier, goal } or null when maxed), fraction (toward next), requirement }.
 */
export function evaluateAchievement(a, progress, ctx) {
  const value = a.measure(progress, ctx) || 0;
  const ladder = tierLadder(a, ctx, progress).map((t) => ({ ...t, reached: value >= t.goal }));
  const reached = ladder.filter((t) => t.reached);
  const top = reached[reached.length - 1] || null;
  const next = ladder.find((t) => !t.reached) || null;
  return {
    id: a.id,
    value,
    tiers: ladder,
    tier: top?.tier || null,
    next,
    fraction: next ? Math.min(1, value / next.goal) : 1,
    requirement: a.requirement((next || ladder[ladder.length - 1]).goal, ctx, progress),
  };
}

/** Evaluate the whole catalogue: { [id]: evaluation }. */
export function evaluateAll(progress, ctx) {
  const out = {};
  for (const a of ACHIEVEMENTS) out[a.id] = evaluateAchievement(a, progress, ctx);
  return out;
}

/**
 * Compare evaluations with what is stored in progress.achievements and list what is newly earned:
 * [{ id, tier, tiers: [tier names newly reached] }]. Stored tiers are never revoked or re-awarded.
 */
export function newlyEarned(evaluations, stored = {}) {
  const out = [];
  for (const a of ACHIEVEMENTS) {
    const ev = evaluations[a.id];
    if (!ev?.tier) continue;
    const have = stored[a.id];
    const haveRank = have?.tier ? tierRank(have.tier) : -1;
    if (tierRank(ev.tier) <= haveRank) continue;
    const fresh = ev.tiers.filter((t) => t.reached && tierRank(t.tier) > haveRank).map((t) => t.tier);
    out.push({ id: a.id, tier: ev.tier, tiers: fresh });
  }
  return out;
}

/** Stored entries merged into a sorted list of earned badges, most recent first. */
export function earnedList(stored = {}) {
  return Object.entries(stored)
    .filter(([id, s]) => achievementById[id] && s?.tier)
    .map(([id, s]) => ({ id, ...s, achievement: achievementById[id] }))
    .sort((a, b) => (b.earnedAt || 0) - (a.earnedAt || 0));
}

/** Locked or still-climbing badge closest to its next step (highest fraction, ties → smaller gap). */
export function closestNext(evaluations) {
  let best = null;
  for (const a of ACHIEVEMENTS) {
    const ev = evaluations[a.id];
    if (!ev?.next) continue;
    const gap = ev.next.goal - ev.value;
    if (!best || ev.fraction > best.ev.fraction || (ev.fraction === best.ev.fraction && gap < best.gap)) best = { achievement: a, ev, gap };
  }
  return best;
}
