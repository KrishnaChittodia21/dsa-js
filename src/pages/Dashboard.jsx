import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Building2, ChevronRight, Compass, FileText, ListChecks, Play, PlayCircle, Plus, Target, Terminal } from 'lucide-react';
import NextStepCard from '../components/guide/NextStepCard.jsx';
import JourneyMap from '../components/guide/JourneyMap.jsx';
import StreakCard from '../components/guide/StreakCard.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import VoxSort from '../components/charts/VoxSort.jsx';
import VoxCity from '../components/charts/VoxCity.jsx';
import BigOChart, { BIGO_CURVES } from '../components/charts/BigOChart.jsx';
import { plural } from '../components/charts/core.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress, missedCheckpoints, mistakeQuestions, streak, topicStats, topicStatus } from '../state/selectors.js';
import { todayKey } from '../state/progressReducer.js';
import { companiesForQuestion, companyById, companyQuestions, EVIDENCE_LEVELS, loadQuestion, questionById, stages, topicById, topics } from '../content/index.js';
import { currentTopic, hasAnyProgress, nextStep, weakTopicsOf } from '../lib/nextStep.js';
import { accuracy, activeInLast, difficultySolved, kpis, stageProgress } from '../lib/dashMetrics.js';
import { getUiPrefs } from '../lib/uiPrefs.js';
import { emit } from '../lib/appEvents.js';

const PAGE_NAMES = {
  '/visualize': 'Visualizer',
  '/playground': 'Playground',
  '/finder': 'Pattern Finder',
  '/patterns': 'Patterns',
  '/toolkit': 'JS DSA Toolkit',
  '/js': 'JavaScript for DSA',
};

/** A readable name for a saved location, for "Continue where you left off". */
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
  if (/^\/toolkit\/(.+)/.test(path)) return 'JS DSA Toolkit';
  return PAGE_NAMES[path] ?? null;
}

// short labels for the voxel columns (fallback: first word of the title)
const SHORT = {
  complexity: 'Big-O', arrays: 'Arrays', hashing: 'Hashing', 'two-pointers': 'Two Ptrs', 'sliding-window': 'Window', 'prefix-sum': 'Prefix',
  'array-techniques': 'Kadane', stack: 'Stack', 'queue-deque': 'Queue', 'binary-search': 'Bin Search', 'linked-list': 'Lists', recursion: 'Recursion',
  sorting: 'Sorting', intervals: 'Intervals', backtracking: 'Backtrack', trees: 'Trees', bst: 'BST', heaps: 'Heaps', tries: 'Tries', graphs: 'Graphs',
  'topological-sort': 'Topo Sort', 'union-find': 'Union Find', 'shortest-path': 'Paths', mst: 'MST', 'advanced-graphs': 'Adv Graphs', greedy: 'Greedy',
  'dp-1d': 'DP 1D', 'dp-2d': 'DP 2D', 'bit-manipulation': 'Bits', 'dp-advanced': 'DP Adv', 'advanced-structures': 'Seg Trees', 'string-algorithms': 'Strings',
};
const shortOf = (t) => SHORT[t.id] || t.title.split(/\s+/)[0];
// phone-width column labels (Mobile.html: BinS, 2-Ptr, Hash …)
const MINI = { 'binary-search': 'BinS', 'two-pointers': '2-Ptr', hashing: 'Hash', recursion: 'Recur', backtracking: 'BackT', intervals: 'Intvl', 'topological-sort': 'Topo', 'union-find': 'UF', 'advanced-graphs': 'AdvG', 'advanced-structures': 'SegT', 'string-algorithms': 'Str', sorting: 'Sort', 'dp-advanced': 'DPx', 'dp-1d': 'DP1', 'dp-2d': 'DP2', 'array-techniques': 'Kadn', 'queue-deque': 'Queue', 'shortest-path': 'Path', 'sliding-window': 'Window', 'prefix-sum': 'Prefix' };
const miniOf = (t) => MINI[t.id] || shortOf(t).slice(0, 6);
const MAX_COLS = 9;
const pad2 = (n) => String(n).padStart(2, '0');
const DIFF_CLS = { Easy: 'easy', Medium: 'med', Hard: 'hard' };
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/** Big-O label → colour class (complexities only) */
function bigoClass(s = '') {
  const x = s.toLowerCase().replace(/\s+/g, ' ');
  if (x.includes('!')) return 'nf';
  if (/2\^|2ⁿ|\^n|ⁿ/.test(x)) return '2n';
  if (/\^2|²|\^3|³|n ?[*·×] ?n|n ?[*·×] ?m|m ?[*·×] ?n/.test(x)) return 'n2';
  if (/n ?log|log ?n ?[*·×] ?n/.test(x) && !/^o\(log/.test(x)) return 'nlogn';
  if (/log/.test(x)) return 'logn';
  if (/o\(1\)/.test(x)) return '1';
  return 'n';
}

const DIFF_PIPS = (
  <span className="diff-pips" aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
);
function DiffChip({ level }) {
  return (
    <span className={`chip chip--${DIFF_CLS[level] || 'plain'}`}>
      {DIFF_PIPS}
      {level}
    </span>
  );
}

// ---- tiny JS highlighter for the next-problem snippet (always-dark code island) ----
const KW = new Set('function const let var return if else for while of in new class extends this null undefined true false break continue typeof'.split(' '));
function highlight(line) {
  const out = [];
  const re = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|([{}()[\];,.=+\-*/<>!&|?:])/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [tok] = m;
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? (KW.has(tok) ? 'k' : 'f') : m[5] ? (KW.has(tok) ? 'k' : null) : 'p';
    out.push(cls ? (
      <span key={i++} className={cls}>
        {tok}
      </span>
    ) : (
      tok
    ));
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/** first lines of a draft / starter, without the leading JSDoc */
function snippet(code = '', n = 4) {
  const body = code.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '').replace(/\s+$/, '');
  const lines = body.split('\n');
  const shown = lines.slice(0, n);
  if (lines.length > n) shown.push('  …');
  return shown;
}

/** the next question to work on inside a topic: attempted first, then the first unsolved (Easy → Hard) */
function nextQuestionIn(topic, progress, skipId) {
  const qs = topic.questions.filter((q) => q.id !== skipId);
  return qs.find((q) => progress.questions[q.id]?.status === 'attempted') || qs.find((q) => progress.questions[q.id]?.status !== 'solved') || null;
}
const qHref = (q) => `/topic/${q.topicId}/q/${q.id}`;

function reasonFor(st) {
  const failed = st.failedSubmissions || 0;
  const r = st.lastResult;
  if (st.status !== 'solved' && failed)
    return `${plural(failed, 'failed submission')}${r && r.total ? `; last ${r.kind} passed ${r.passed} of ${r.total} tests` : ''}.`;
  if (st.patternGuess?.correct === false) return 'Pattern challenge missed on the first guess. Re-read the clues.';
  if (st.solutionViewedBeforeSolve) return st.status === 'solved' ? 'Solved after opening the solution. Re-solve it cold.' : 'You opened the solution before solving. Try it without.';
  if (st.status === 'solved' && failed) return `Solved after ${plural(failed, 'failed submission')}. Re-solve it cleanly.`;
  return 'Attempted, not passing yet.';
}

/** revision queue, front → rear: unsolved mistakes (oldest first), weak areas, solved-with-help, missed checkpoints */
function revisionQueue(progress) {
  const items = [];
  const mistakes = mistakeQuestions(progress).map((q) => ({ q, st: progress.questions[q.id] }));
  const byAge = (a, b) => (a.st.lastOpenedAt || 0) - (b.st.lastOpenedAt || 0);
  for (const { q, st } of mistakes.filter((x) => x.st.status !== 'solved').sort(byAge))
    items.push({ id: `q-${q.id}`, kind: 'retry', title: q.title, why: reasonFor(st), href: qHref(q), diff: q.difficulty, status: 'attempted', tag: 'retry' });
  for (const w of weakTopicsOf(progress, topics))
    items.push({ id: `w-${w.topic.id}`, kind: 'weak', title: w.topic.title, why: `Weak area · score ${Math.round(w.score * 100)}%. ${w.signals[0] ? `${w.signals[0]}.` : ''}`, href: `/topic/${w.topic.id}?tab=review`, tag: 'review', score: Math.round(w.score * 100) });
  for (const { q, st } of mistakes.filter((x) => x.st.status === 'solved').sort(byAge))
    items.push({ id: `s-${q.id}`, kind: 'resolve', title: q.title, why: reasonFor(st), href: qHref(q), diff: q.difficulty, status: 'solved', tag: 're-solve' });
  for (const t of topics) {
    if (!progress.topics[t.id]?.lessonCompleted) continue;
    const missed = missedCheckpoints(progress, t).length;
    if (missed) items.push({ id: `c-${t.id}`, kind: 'checkpoints', title: t.title, why: `Re-answer ${plural(missed, 'missed checkpoint')} from the lesson.`, href: `/topic/${t.id}?tab=review`, tag: 'checkpoints' });
  }
  return items;
}

function frameFor(s) {
  if (!s) return null;
  const qid = s.question?.id;
  const tid = s.topic?.id;
  switch (s.kind) {
    case 'lesson':
      return { fn: 'read', arg: `"${tid}"`, extra: s.title.startsWith('Start') ? null : `§${(s.sectionIndex ?? 0) + 1}`, tag: 'lesson' };
    case 'question':
      return { fn: 'solve', arg: `"${qid}"`, tag: 'question' };
    case 'pattern':
      return { fn: 'guess', arg: `"${qid}"`, tag: 'pattern' };
    case 'revision':
      return qid ? { fn: 'retry', arg: `"${qid}"`, tag: 'revision' } : { fn: 'revise', arg: `"${tid}"`, tag: 'revision' };
    case 'topic':
    case 'start':
      return { fn: 'start', arg: `"${tid}"`, tag: 'topic' };
    default:
      return { fn: 'review', arg: '', tag: 'revision' };
  }
}
function frameFromHref(title, href) {
  const q = /^\/topic\/[^/]+\/q\/([^/?]+)/.exec(href);
  if (q) return { fn: 'retry', arg: `"${q[1]}"`, tag: 'revision' };
  const t = /^\/topic\/([^/?]+)/.exec(href);
  return { fn: 'revise', arg: t ? `"${t[1]}"` : '', tag: 'revision', title };
}

// badge art + summary load as their own chunk (shared with the Achievements page)
const AchievementsSummary = lazy(() => import('../components/achievements/AchievementsSummary.jsx'));

export default function Dashboard() {
  const { progress } = useProgress();
  const step = nextStep(progress, topics);
  const isNew = !hasAnyProgress(progress);
  const k = kpis(progress, topics);
  const st = streak(progress);
  const now = new Date();
  const today = todayKey(now);

  const last = getUiPrefs().lastStudyLocation;
  const lastLabel = last ? describeLocation(last) : null;
  const resume = last && lastLabel && last !== step.href && last.split('?')[0] !== step.href ? { href: last, label: lastLabel } : undefined;

  // ---- hero: the real current topic ----
  const cur = currentTopic(progress, topics);
  const heroTopic = step.topic || cur || topics.find((t) => topicStatus(t, progress) === 'available') || topics[0];
  const hs = topicStats(heroTopic, progress);
  const heroStage = stages.find((s) => s.id === heroTopic.stageId);
  const stageNo = stages.indexOf(heroStage) + 1;
  const secs = heroTopic.lesson.sections;
  const secI = Math.min(hs.sectionIndex, Math.max(0, secs.length - 1));
  const lessonOpen = heroTopic.hasContent && secs.length > 0 && !hs.lessonCompleted;
  const nextQ = step.question && step.question.topicId === heroTopic.id ? step.question : nextQuestionIn(heroTopic, progress);
  const heroWords = heroTopic.title.split(/\s+/).reduce((acc, w) => {
    if (acc.length && (w.length <= 2 || acc[acc.length - 1].length <= 2)) acc[acc.length - 1] += ` ${w}`;
    else acc.push(w);
    return acc;
  }, []);
  const heroChars = Math.max(6, ...heroWords.map((w) => w.length), Math.round(heroTopic.title.length / 2.2));

  // "then": what follows the primary step
  let then = null;
  if (step.kind === 'lesson' && nextQ)
    then = { title: `${progress.questions[nextQ.id]?.status === 'attempted' ? 'Finish' : 'Solve'}: ${nextQ.title}`, href: qHref(nextQ), detail: `${nextQ.difficulty} · practise the pattern right after the lesson, while it is fresh.` };
  else if ((step.kind === 'question' || step.kind === 'pattern') && step.topic) {
    const after = nextQuestionIn(step.topic, progress, step.question?.id);
    if (after) then = { title: `Solve: ${after.title}`, href: qHref(after), detail: `${after.difficulty} · the next unsolved question in ${step.topic.title}.` };
  }

  // ---- mastery[] voxel columns: topics you've touched ----
  const touched = topics
    .map((t) => ({ t, status: topicStatus(t, progress), s: topicStats(t, progress) }))
    .filter((x) => x.status === 'in-progress' || x.status === 'completed');
  let picked = touched;
  if (touched.length > MAX_COLS) {
    const recent = [...touched].sort((a, b) => (progress.topics[b.t.id]?.lastActiveAt || 0) - (progress.topics[a.t.id]?.lastActiveAt || 0));
    const keep = new Set([heroTopic.id, ...recent.map((x) => x.t.id)].slice(0, MAX_COLS));
    picked = touched.filter((x) => keep.has(x.t.id));
  }
  const voxCols = useMemo(
    () => picked.map(({ t, s }) => ({ id: t.id, title: t.title, label: shortOf(t), mini: miniOf(t), value: s.mastery, solved: s.solved, total: s.total, current: t.id === heroTopic.id, href: `/topic/${t.id}` })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(picked.map((x) => [x.t.id, x.s.mastery, x.s.solved])), heroTopic.id],
  );

  // ---- pattern city ----
  const statusOf = Object.fromEntries(topics.map((t) => [t.id, topicStatus(t, progress)]));
  const cityStages = stages
    .filter((s) => s.topics.length)
    .map((s, i) => ({
      id: s.id,
      number: i + 1,
      title: s.title.split(' & ')[0].length > 18 ? s.title.split(' ')[0] : s.title.split(' & ')[0],
      topics: s.topics.map((t) => ({ id: t.id, title: t.title, status: statusOf[t.id], mastery: topicStats(t, progress).mastery, current: !isNew && t.id === heroTopic.id })),
    }));
  const counts = { completed: 0, 'in-progress': 0, available: 0, locked: 0 };
  for (const t of topics) counts[statusOf[t.id]]++;
  const masteries = topics.map((t) => ({ t, m: topicStats(t, progress).mastery }));
  const tallest = masteries.reduce((a, b) => (b.m > a.m ? b : a), masteries[0]);

  // ---- today's call stack ----
  const frames = [
    step && { ...frameFor({ ...step, sectionIndex: secI }), title: step.title, href: step.href, top: true },
    then && { ...frameFromHref(then.title, then.href), fn: 'solve', tag: 'question', title: then.title, href: then.href },
    step.secondary && { ...frameFromHref(step.secondary.title, step.secondary.href), title: step.secondary.title, href: step.secondary.href },
  ].filter(Boolean);
  const solvedToday = topics
    .flatMap((t) => t.questions)
    .map((q) => ({ q, at: progress.questions[q.id]?.solvedAt }))
    .filter((x) => x.at && todayKey(new Date(x.at)) === today)
    .sort((a, b) => b.at - a.at);
  const popped = solvedToday[0];
  const actionsToday = progress.activity?.[today] || 0;

  // ---- revision queue ----
  const queue = revisionQueue(progress);
  const QSHOW = 5;

  // ---- numbers ----
  const diffs = difficultySolved(progress, topics);
  const attemptedCount = Object.values(progress.questions || {}).filter((q) => q.status === 'attempted').length;
  const lessonsDone = topics.filter((t) => progress.topics[t.id]?.lessonCompleted).length;
  const lessonsOpen = topics.filter((t) => t.hasContent && !progress.topics[t.id]?.lessonCompleted && statusOf[t.id] === 'in-progress').length;
  const week = activeInLast(progress.activity, 7);
  const acc = accuracy(progress, topics);
  const companies = companyProgress(progress)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.solved - a.solved || b.total - a.total)
    .slice(0, 5);
  const companiesTracked = companyProgress(progress).length;
  const sourced = companyQuestions.length;
  const stageRows = stageProgress(progress, stages).map((s) => {
    const stage = stages.find((x) => x.id === s.id);
    const sts = stage.topics.map((t) => statusOf[t.id]);
    const active = sts.filter((x) => x === 'in-progress').length;
    return { ...s, unlocked: sts.filter((x) => x === 'available').length, active, started: active > 0 || sts.includes('completed') };
  });

  const hour = now.getHours();
  const greet = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="page dash">
      {/* ---------- greeting + this week ---------- */}
      <div className="dash-greet rise">
        <h1 className="dash-hi">
          <span className="eyebrow">{dateLabel}</span>
          {isNew ? 'Welcome to DSA Journey.' : `${greet}.`}{' '}
          <span className="dash-hi-sub">
            {isNew ? 'Start with the first lesson below.' : `${plural(frames.length, 'frame')} on today’s stack.`}
          </span>
        </h1>
        <div className="dash-goal">
          <span className="eyebrow">this week</span>
          <div className="meter" style={{ '--v': `${Math.round((week / 7) * 100)}%` }} role="img" aria-label={`Studied on ${week} of the last 7 days`}>
            <i />
          </div>
          <b>
            {week} / 7 days
          </b>
        </div>
      </div>

      <div className="dash-coach rise">
        <CoachTip id="dashboard" title="Your next step picks itself.">
          Worked out from your answers: open lesson → missed pattern challenge → unsolved questions → revision. Press <span className="kbd">?</span> for the tour.
        </CoachTip>
      </div>

      {/* ================= HERO ================= */}
      <section className="tile tile--glow dash-hero rise" style={{ '--i': 1 }} aria-labelledby="dash-hero-title">
        <div className="dash-hero-top">
          <div className="dash-hero-copy">
            <div className="dash-hero-tags">
              {heroStage && (
                <span className="chip dash-chip-uv">
                  <i className="pip pip--uv" />
                  Stage <span className="mono">{pad2(stageNo)}</span> · {heroStage.title}
                </span>
              )}
              <span className="tag">
                topic {pad2(heroTopic.index + 1)} / {topics.length}
              </span>
              {secs.length > 0 && (
                <span className="tag">
                  lesson {hs.lessonCompleted ? `✓ ${secs.length}` : `§${secI + 1}`} / {secs.length}
                </span>
              )}
              {nextQ && <DiffChip level={nextQ.difficulty} />}
            </div>
            <h2 id="dash-hero-title" className="display chrome dash-hero-title" style={{ '--hero-chars': heroChars }}>
              {heroWords.map((w, i) => (
                <span key={i} className="dash-hero-line">
                  {w}
                  {i === heroWords.length - 1 && <span className="dash-hero-dot">.</span>}
                </span>
              ))}
            </h2>
            <p className="lead dash-hero-lede">
              {isNew ? (
                heroTopic.summary || heroTopic.description
              ) : (
                <>
                  Next up:{' '}
                  <b>{lessonOpen ? `§${secI + 1} ${secs[secI].title}` : nextQ ? nextQ.title : 'revision'}</b>
                  {lessonOpen ? ' in the lesson. ' : '. '}
                  <b>
                    <span className="mono">{hs.solved}</span> of <span className="mono">{hs.total}</span>
                  </b>{' '}
                  problems solved, mastery <span className="mono">{hs.mastery}%</span>.
                </>
              )}
            </p>
            <div className="dash-hero-cta">
              <Link to={step.href} className="btn btn--plasma btn--lg">
                {lessonOpen && step.kind === 'lesson' ? (step.title.startsWith('Start') ? 'Start the lesson' : `Resume §${secI + 1}`) : { start: 'Start learning', pattern: 'Retry it', question: 'Solve it', revision: 'Revise', topic: 'Start the topic', done: 'Open Revision' }[step.kind] || 'Go'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/path" className="btn btn--ghost btn--lg">
                Open the path
              </Link>
              <button type="button" className="btn btn--ghost btn--lg dash-guide" onClick={() => emit('open-guide')} title="Guide (press ?)">
                <Compass size={18} aria-hidden="true" />
                Guide <span className="kbd">?</span>
              </button>
            </div>
          </div>

          {nextQ ? <NextProblem q={nextQ} qs={progress.questions[nextQ.id]} /> : <div className="dash-next-empty tile tile--raised">Every question in {heroTopic.title} is solved.</div>}

          <NextStepCard step={step} then={then} resume={resume} />
        </div>

        <div className="dash-stage">
          <div className="dash-stage-head">
            <span className="eyebrow">
              mastery[ ] · {plural(picked.length, 'topic')} you’ve touched{touched.length > picked.length ? ` (${picked.length} most recent of ${touched.length})` : ''} · 1 cube = 10%
            </span>
            <div className="dash-legend" aria-hidden="true">
              <span>
                <i className="sw-hot" />
                strong
              </span>
              <span>
                <i className="sw-cur" />
                current
              </span>
              <span>
                <i className="sw-cold" />
                needs reps
              </span>
            </div>
          </div>
          {voxCols.length >= 2 ? (
            <VoxSort cols={voxCols} />
          ) : (
            <div className="dash-vs-empty">
              <div className="dash-vs-slots" aria-hidden="true">
                {Array.from({ length: MAX_COLS }, (_, i) => (
                  <span key={i}>
                    <i />[{i}]
                  </span>
                ))}
              </div>
              <p>
                {voxCols.length === 1 ? (
                  <>
                    One topic so far: <b>{voxCols[0].title}</b> at <span className="mono">{voxCols[0].value}%</span> mastery. Start a second one and your topics line up
                    here and sort themselves, weakest first.
                  </>
                ) : (
                  <>mastery[ ] is empty. Start a lesson or solve a question and each topic you touch becomes a voxel column, sorted weakest first, so you always know what to revise.</>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="dash-meta">
          <div className="dash-hm">
            <span className="eyebrow">solved</span>
            <span className="num">{k.solved.done}</span>
            <span className="of"> / {k.solved.total}</span>
            <span className="small">{attemptedCount ? `${attemptedCount} attempted, not yet passing` : 'no open attempts'}</span>
          </div>
          <div className="dash-hm">
            <span className="eyebrow">lessons</span>
            <span className="num">{lessonsDone}</span>
            <span className="of"> / {topics.length}</span>
            <span className="small">{lessonsOpen ? `${lessonsOpen} more in progress` : 'none in progress'}</span>
          </div>
          <div className="dash-hm">
            <span className="eyebrow">streak</span>
            <span className={`num ${st.current ? 'plasma-text' : ''}`}>{st.current}</span>
            <span className="of"> {st.current === 1 ? 'day' : 'days'}</span>
            <span className="small">best run: {plural(st.longest, 'day')}</span>
          </div>
          <div className="dash-hm">
            <span className="eyebrow">pattern challenges</span>
            {k.patterns.seen ? (
              <>
                <span className="num">{k.patterns.pct}</span>
                <span className="of">%</span>
                <span className="small">
                  right first try · {k.patterns.correct} of {k.patterns.seen}
                </span>
              </>
            ) : (
              <>
                <span className="num t-muted">—</span>
                <span className="small">name a pattern before coding</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* phones: streak + revision queue twins (Mobile.html screen 1) */}
      <div className="dash-twin">
        <StreakCard activity={progress.activity} current={st.current} longest={st.longest} compact />
        <Link to="/revision" className="dash-mcard" aria-label={`Revision queue: ${queue.length} items`}>
          <span className="eyebrow">revision queue</span>
          <span className="num">{queue.length}</span>
          <span className="dash-qmini" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i === 0 && queue.length ? 'f' : i < queue.length ? 'd' : ''} />
            ))}
          </span>
        </Link>
      </div>

      {/* ================= CITY + STACK ================= */}
      <div className="grid section dash-row1">
        <section className="tile c-7 rise dash-city-tile" style={{ '--i': 2 }} aria-labelledby="dash-city-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip" />
                Pattern city · {topics.length} topics · {cityStages.length} stages
              </span>
              <h2 id="dash-city-t" className="h2 dash-tile-h">
                Mastery map
              </h2>
            </div>
            <Link to="/patterns" className="tile-link">
              Patterns <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="dash-city">
            <VoxCity stages={cityStages} />
            <div>
              <div className="dash-legend-v">
                <div className="li-l">
                  <span className="cube" style={{ '--c': '#FF7A3D' }} />
                  Completed<b>{counts.completed}</b>
                </div>
                <div className="li-l">
                  <span className="cube" style={{ '--c': '#7B5CFF' }} />
                  In progress<b>{counts['in-progress']}</b>
                </div>
                <div className="li-l">
                  <span className="cube cube--line" />
                  Unlocked<b>{counts.available}</b>
                </div>
                <div className="li-l">
                  <span className="cube cube--ghost" />
                  Locked<b>{counts.locked}</b>
                </div>
              </div>
              <div className="dash-city-note">
                {tallest && tallest.m > 0 && (
                  <span>
                    Tallest tower <b>{tallest.t.title}</b> · <span className="mono">{tallest.m}%</span>
                  </span>
                )}
                {!isNew && (
                  <span>
                    Beacon <b className="t-uv">{heroTopic.title}</b> · you are here
                  </span>
                )}
                <span>Height = topic mastery (lesson 30%, then Easy, Medium and Hard solved).</span>
              </div>
            </div>
          </div>
        </section>

        <section className="tile c-5 rise dash-stack-tile" style={{ '--i': 3 }} aria-labelledby="dash-stack-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--volt" />
                Today’s call stack
              </span>
              <h2 id="dash-stack-t" className="h2 dash-tile-h">
                Pop the top frame
              </h2>
            </div>
            <span className="tag">depth {frames.length}</span>
          </div>
          <ol className="cstack" aria-label="Today’s plan, top of the stack first">
            {popped && (
              <li className="frame frame--popped">
                <span className="d" aria-hidden="true">
                  ✓
                </span>
                <span className="fn">
                  solve<em>(&quot;{popped.q.id}&quot;)</em>
                  <span className="sr-only"> solved today</span>
                </span>
                <span className="t">{new Date(popped.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            )}
            {frames.map((f, i) => (
              <li key={f.href + i} className={`frame ${i === 0 ? 'frame--top' : ''}`}>
                {i === 0 && (
                  <span className="sp" aria-hidden="true">
                    SP
                  </span>
                )}
                <span className="d" aria-hidden="true">
                  #{frames.length - i}
                </span>
                <Link to={f.href} className="fn" title={f.title}>
                  <i>{f.fn}</i>(<em>{f.arg}</em>
                  {f.extra ? `, ${f.extra}` : ''})<span className="sr-only">: {f.title}</span>
                </Link>
                <span className="t">{f.tag}</span>
              </li>
            ))}
            <li className="frame frame--base">
              <span className="d" aria-hidden="true">
                #0
              </span>
              <span className="fn">
                main<em>(today)</em>
              </span>
              <span className="t">{plural(actionsToday, 'action')}</span>
            </li>
          </ol>
          <div className="stack-foot">
            <span className="small">Finish a frame to pop it. The stack is rebuilt from your progress every time you come back.</span>
            <Link to={step.href} className="btn btn--chrome btn--sm">
              Run top <Play size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* ================= BIG-O + FIRST-TRY ACCURACY ================= */}
      <section className="tile section rise dash-bigo" style={{ '--i': 4 }} aria-labelledby="dash-bigo-t">
        <div className="bigo-strip">
          <div>
            <span className="eyebrow">
              <i className="pip pip--ice" />
              Complexity scale
            </span>
            <h2 id="dash-bigo-t" className="h2 dash-bigo-h">
              Big-O, colour-coded
            </h2>
            <p className="body dash-bigo-p">Every complexity in the app wears the same colour: icy when it scales, molten when it doesn’t.</p>
            <div className="bigo-scale">
              {BIGO_CURVES.map((c) => (
                <span key={c.k} className={`bigo bigo--${c.k}`}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="chart-wrap">
            <BigOChart />
            <span className="axis-l" style={{ left: 0 }}>
              n = 1
            </span>
            <span className="axis-l" style={{ right: 0 }}>
              n = 16 →
            </span>
          </div>
          <div className="dash-acc">
            <span className="eyebrow">First try · how you answer</span>
            {acc.some((a) => a.seen) ? (
              <ul className="dash-acc-list">
                {acc.map((a) => (
                  <li key={a.id}>
                    <span className="dash-acc-l">{a.label}</span>
                    <span className="dash-acc-v">{a.seen ? `${a.pct}%` : '—'}</span>
                    <div className="meter meter--ice" style={{ '--v': `${a.pct}%` }} role="img" aria-label={`${a.label}: ${a.seen ? `${a.pct}% right first time, ${a.correct} of ${a.seen} ${a.unit}` : 'no data yet'}`}>
                      <i />
                    </div>
                    <span className="dash-acc-n">{a.seen ? `${a.correct} / ${a.seen} ${a.unit}` : 'no data yet'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small dash-acc-empty">Answer a lesson checkpoint, a pattern challenge or submit code to see your first-try accuracy here.</p>
            )}
          </div>
        </div>
      </section>

      {/* ================= REVISION QUEUE ================= */}
      <section className="section rise" style={{ '--i': 5 }} aria-labelledby="dash-rev-t">
        <div className="section-head">
          <div>
            <span className="eyebrow">Revision queue · first in, first out</span>
            <h2 id="dash-rev-t" className="h1">
              Due for review
            </h2>
          </div>
          <div className="row dash-rev-meta">
            <span className="small">
              {queue.length ? `${plural(queue.length, 'item')} · unsolved mistakes first, then weak areas` : 'nothing queued'}
            </span>
            <Link to="/revision" className="btn btn--ghost btn--sm">
              All revision <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {queue.length ? (
          <div className="queue" style={{ '--qn': Math.min(QSHOW, queue.length) }}>
            <div className="q-arrows" aria-hidden="true">
              <span>← dequeue()</span>
              <span>enqueue() ←</span>
            </div>
            <div className="q-end q-end--front" aria-hidden="true">
              <ArrowRight size={18} />
              <span className="q-v">front</span>
            </div>
            <ol className="q-items">
              {queue.slice(0, QSHOW).map((it, i) => (
                <li key={it.id}>
                  <Link to={it.href} className={`qcard ${i === 0 ? 'qcard--front' : ''}`}>
                    <span className="qi">
                      <span>[{i}]</span>
                      <span className={i === 0 ? 'due' : 'due due--later'}>{it.tag}</span>
                    </span>
                    <h3 className="qcard-t">{it.title}</h3>
                    <p className="why">{it.why}</p>
                    <span className="chips">
                      {it.diff && <DiffChip level={it.diff} />}
                      {it.status && <span className={`chip chip--${it.status}`}>{it.status === 'solved' ? 'Solved' : 'Attempted'}</span>}
                      {it.kind === 'weak' && <span className="chip chip--plain">weak area</span>}
                      {it.kind === 'checkpoints' && <span className="chip chip--plain">lesson</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="q-end" aria-hidden="true">
              <Plus size={18} />
              <span className="q-v">rear</span>
            </div>
          </div>
        ) : (
          <div className="tile tile--flat dash-q-empty">
            <p>
              <b>The queue is empty.</b> Questions you fail, mis-identify or peek at, weak areas and missed checkpoints are enqueued here automatically, oldest at the
              front.
            </p>
          </div>
        )}
        <details className="dash-howto">
          <summary>How to clear a weak area</summary>
          <ol>
            <li>
              <b>Re-answer missed checkpoints.</b> In the topic’s Review tab, re-answer the ones you missed; the new first try is what counts.
            </li>
            <li>
              <b>Retry the questions you struggled with</b> without opening the solution. One solved after viewing its solution never counts as clean.
            </li>
            <li>
              <b>Name the pattern before coding.</b> A first pattern guess is final for that question, so revise the recognition clues first.
            </li>
            <li>
              <b>Practise new questions in the topic.</b> The score averages checkpoints ×2, pattern guesses ×2 and clean solves ×3; fresh first-try successes lift
              it above <span className="mono">65%</span>.
            </li>
          </ol>
        </details>
      </section>

      {/* ================= DIFFICULTY · STREAK · ACHIEVEMENTS ================= */}
      <div className="grid section dash-row3">
        <section className="tile c-4 rise dash-diff" style={{ '--i': 6 }} aria-labelledby="dash-diff-t">
          <div className="tile-head">
            <h2 className="eyebrow" id="dash-diff-t">
              <i className="pip pip--ice" />
              Solved by difficulty
            </h2>
            <Link to="/progress" className="tile-link">
              Progress <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="dash-diff-big">
            <span className="num chrome">{k.solved.done}</span>
            <span className="of">of {k.solved.total} problems</span>
          </div>
          {diffs.map((d) => {
            const on = d.solved ? Math.max(1, Math.round(d.pct / 5)) : 0;
            return (
              <div key={d.level} className="dash-diff-row">
                <DiffChip level={d.level} />
                <div className="vmeter" style={{ '--c': `var(--${DIFF_CLS[d.level]})` }} role="img" aria-label={`${d.level}: ${d.solved} of ${d.total} solved, ${d.pct}%`}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <i key={i} className={i < on ? 'on' : ''} />
                  ))}
                </div>
                <span className="r">
                  {d.solved}
                  <em>/{d.total}</em>
                </span>
              </div>
            );
          })}
          <div className="row row--wrap dash-diff-chips">
            <span className="chip chip--solved">{k.solved.done} solved</span>
            <span className="chip chip--attempted">{attemptedCount} attempted</span>
            <span className="chip chip--todo">{k.solved.total - k.solved.done - attemptedCount} to do</span>
          </div>
        </section>

        <div className="c-4 rise dash-cell" style={{ '--i': 7 }}>
          <StreakCard activity={progress.activity} current={st.current} longest={st.longest} weeks={5} />
        </div>

        <div className="c-4 rise dash-cell" style={{ '--i': 8 }}>
          <Suspense fallback={<div className="tile dash-ach dash-ach-placeholder" aria-hidden="true" />}>
            <AchievementsSummary progress={progress} />
          </Suspense>
        </div>
      </div>

      {/* ================= COMPANIES + BFS ================= */}
      <div className="grid section dash-row4">
        <section className="tile c-7 rise" style={{ '--i': 9 }} aria-labelledby="dash-co-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--ice" />
                Companies · {companiesTracked} tracked · {sourced} sourced questions
              </span>
              <h2 id="dash-co-t" className="h2 dash-tile-h">
                Interview readiness
              </h2>
            </div>
            <Link to="/companies" className="tile-link">
              All companies <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {companies.length ? (
            <ul className="dash-co">
              {companies.map((c) => (
                <li key={c.company.id}>
                  <Link to={`/companies/${c.company.id}`} className="co-row" aria-label={`${c.company.name}: ${c.solved} of ${c.total} solved`}>
                    <span className="mono-badge" aria-hidden="true">
                      {mono(c.company.name)}
                    </span>
                    <span className="nm">
                      {c.company.name}
                      <small>{plural(c.total, 'question')} here</small>
                    </span>
                    <span className="meter" style={{ '--v': `${pctOf(c.solved, c.total)}%` }}>
                      <i />
                    </span>
                    <span className="ct">
                      {c.solved}
                      <em> / {c.total}</em>
                    </span>
                    <span className="go" aria-hidden="true">
                      <ChevronRight size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small">No company data loaded.</p>
          )}
          <div className="evi" aria-label="Evidence levels">
            {Object.entries(EVIDENCE_LEVELS).map(([key, ev], i) => (
              <span key={key} className="chip chip--plain" title={ev.description}>
                <i className={`pip ${['pip--acid', 'pip--ice', 'pip--uv'][i] || ''}`} />
                {ev.label}
              </span>
            ))}
          </div>
        </section>

        <section className="tile c-5 rise dash-bfs" style={{ '--i': 10 }} aria-labelledby="dash-bfs-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--uv" />
                Visualizer · graphs
              </span>
              <h2 id="dash-bfs-t" className="h2 dash-tile-h">
                BFS, level by level
              </h2>
            </div>
            <Link to="/visualize" className="btn btn--ghost btn--sm">
              Step through <Play size={14} aria-hidden="true" />
            </Link>
          </div>
          <BfsDemo />
        </section>
      </div>

      {/* ================= PATH AS A LINKED LIST ================= */}
      <section className="section rise" style={{ '--i': 11 }} aria-labelledby="dash-path-t">
        <div className="section-head">
          <div>
            <span className="eyebrow">Continue learning · {stageRows.length} stages as a linked list</span>
            <h2 id="dash-path-t" className="h1">
              head → your path
            </h2>
          </div>
          <Link to="/path" className="btn btn--ghost btn--sm">
            Full path &amp; contents <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <JourneyMap stages={stageRows} />
      </section>

      {/* ---------- practice links ---------- */}
      <nav className="dash-practice" aria-label="Practice">
        <span className="eyebrow">Practice</span>
        <Link to="/questions" className="chip chip--plain">
          <ListChecks size={14} aria-hidden="true" /> All questions <span className="mono">{k.solved.done}/{k.solved.total}</span>
        </Link>
        <Link to="/finder" className="chip chip--plain">
          <Target size={14} aria-hidden="true" /> Pattern Finder
        </Link>
        <Link to="/visualize" className="chip chip--plain">
          <PlayCircle size={14} aria-hidden="true" /> Visualizer
        </Link>
        <Link to="/playground" className="chip chip--plain">
          <Terminal size={14} aria-hidden="true" /> Playground
        </Link>
        <Link to="/companies" className="chip chip--plain">
          <Building2 size={14} aria-hidden="true" /> Companies
        </Link>
        <Link to="/cheatsheet" className="chip chip--plain">
          <FileText size={14} aria-hidden="true" /> Cheat sheet
        </Link>
        <Link to="/contents" className="chip chip--plain">
          <BookOpen size={14} aria-hidden="true" /> Contents
        </Link>
      </nav>
    </div>
  );
}

/** two-letter text monogram (never a logo) */
function mono(name) {
  const w = name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean);
  return w.length > 1 ? `${w[0][0]}${w[1][0]}`.toUpperCase() : `${w[0][0].toUpperCase()}${(w[0][1] || '').toLowerCase()}`;
}

/** next-problem capsule: chips, the learner's draft (or the starter), companies */
function NextProblem({ q, qs }) {
  const [full, setFull] = useState(null);
  useEffect(() => {
    let live = true;
    loadQuestion(q.id).then((x) => live && setFull(x));
    return () => {
      live = false;
    };
  }, [q.id]);
  const draft = qs?.code;
  const code = draft || full?.starterCode || '';
  const lines = code ? snippet(code) : [];
  const cos = [...new Set(companiesForQuestion(q.id).map((cq) => cq.company))].map((id) => companyById[id]).filter(Boolean);
  const src = q.source?.platform === 'LeetCode' && q.source.number ? `LC ${q.source.number}` : q.source?.platform || '';
  const r = qs?.lastResult;
  return (
    <aside className="tile tile--raised dash-next" aria-label="Next problem">
      <div className="eyebrow">
        <span>Next problem</span>
        <span>{src}</span>
      </div>
      <h3>{q.title}</h3>
      <div className="chips">
        <DiffChip level={q.difficulty} />
        {full?.complexity?.time && <span className={`bigo bigo--${bigoClass(full.complexity.time)}`}>{full.complexity.time} time</span>}
        {full?.complexity?.space && <span className={`bigo bigo--${bigoClass(full.complexity.space)}`}>{full.complexity.space} space</span>}
      </div>
      {r && r.total > 0 && qs.status !== 'solved' && (
        <div className="dash-last-run">
          Last {r.kind}: <b className="mono">{r.passed} / {r.total}</b> tests passing
        </div>
      )}
      {lines.length > 0 && (
        <div className="code dash-next-code" aria-label={draft ? 'Your draft' : 'Starter code'}>
          <div className="code-bar">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            solution.js · {draft ? 'your draft' : 'starter'}
          </div>
          <pre>
            {lines.map((l, i) => (
              <span key={i} className={`ln ${draft && i === lines.length - 1 ? 'ln--hl' : ''}`} data-n={i + 1}>
                {highlight(l)}
                {draft && i === lines.length - 1 && <span className="caret" />}
              </span>
            ))}
          </pre>
        </div>
      )}
      <div className="dash-next-foot">
        {cos.length > 0 ? (
          <div className="mono-row" title={`Asked at or associated with ${plural(cos.length, 'company', 'companies')}`}>
            {cos.slice(0, 4).map((c) => (
              <span key={c.id} className="mono-badge" title={c.name}>
                {mono(c.name)}
              </span>
            ))}
            <span className="more">{cos.length > 4 ? `+${cos.length - 4} companies` : plural(cos.length, 'company', 'companies')}</span>
          </div>
        ) : (
          <span className="small">{q.tags?.slice(0, 2).join(' · ')}</span>
        )}
        <Link to={qHref(q)} className="btn btn--chrome btn--sm">
          Solve <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

/** looping BFS illustration (not learner data): nodes light up level by level */
function BfsDemo() {
  const N = [
    ['A', 220, 30, 0, 15],
    ['B', 120, 90, 1, 15],
    ['C', 320, 90, 1, 15],
    ['D', 60, 150, 2, 15],
    ['E', 170, 150, 2, 15],
    ['F', 270, 150, 2, 15],
    ['G', 380, 150, 2, 15],
    ['H', 110, 195, 3, 13],
    ['I', 330, 195, 3, 13],
  ];
  const at = Object.fromEntries(N.map(([id, x, y]) => [id, [x, y]]));
  const E = [
    ['A', 'B', 1],
    ['A', 'C', 1],
    ['B', 'D', 2],
    ['B', 'E', 2],
    ['C', 'F', 2],
    ['C', 'G', 2],
    ['D', 'H', 3],
    ['F', 'I', 3],
  ];
  return (
    <>
      <svg viewBox="0 0 440 210" role="img" aria-label="Breadth-first search lighting nodes level by level, from A to H and I">
        <g>
          {E.map(([a, b]) => (
            <line key={`${a}${b}`} className="be" x1={at[a][0]} y1={at[a][1]} x2={at[b][0]} y2={at[b][1]} />
          ))}
          <line className="be" x1="170" y1="150" x2="270" y2="150" />
          {E.map(([a, b, l]) => (
            <line key={`l${a}${b}`} className="bel" style={{ '--l': l }} pathLength="1" x1={at[a][0]} y1={at[a][1]} x2={at[b][0]} y2={at[b][1]} />
          ))}
        </g>
        {[34, 94, 154, 199].map((y, i) => (
          <text key={y} className="lvl" x="4" y={y}>
            L{i}
          </text>
        ))}
        {N.map(([id, x, y, l, r]) => (
          <g key={id}>
            <circle className="bn lv" style={{ '--l': l }} cx={x} cy={y} r={r} />
            <text className="bt" x={x} y={y + 4} textAnchor="middle">
              {id}
            </text>
          </g>
        ))}
      </svg>
      <div className="code dash-bfs-code">
        <pre>
          <span className="ln" data-n="7">
            {highlight('while (queue.length) {')}
          </span>
          <span className="ln ln--hl" data-n="8">
            {highlight('  const node = queue.shift();  // level-order')}
          </span>
          <span className="ln" data-n="9">
            {highlight('  for (const nb of adj[node]) visit(nb);')}
          </span>
        </pre>
      </div>
      <div className="qreadout">
        <span>queue after L1</span>
        {['D', 'E', 'F', 'G'].map((c) => (
          <span key={c} className="cell">
            {c}
          </span>
        ))}
        <span className="cell cell--ghost">·</span>
      </div>
    </>
  );
}
