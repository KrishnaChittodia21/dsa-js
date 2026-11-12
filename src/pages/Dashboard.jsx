import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Compass, Play } from 'lucide-react';
import NextStepCard from '../components/guide/NextStepCard.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import ShortOfTheDay from '../components/guide/ShortOfTheDay.jsx';
import VoxCity from '../components/charts/VoxCity.jsx';
import Icon from '../components/ui/Icon.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import { plural } from '../components/charts/core.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicStats, topicStatus } from '../state/selectors.js';
import { todayKey } from '../state/progressReducer.js';
import { companiesForQuestion, companyById, loadQuestion, questionById, stages, topicById, topics } from '../content/index.js';
import { currentTopic, hasAnyProgress, nextStep } from '../lib/nextStep.js';
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

const TOOLS_TAB_NAMES = { cheatsheet: 'Cheat sheet', toolkit: 'JS DSA Toolkit', js: 'JavaScript for DSA', playground: 'Playground' };

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
  if (path === '/tools') return TOOLS_TAB_NAMES[new URLSearchParams(search).get('tab')] ?? 'Cheat sheet';
  return PAGE_NAMES[path] ?? null;
}

// Progress charts, KPIs and company readiness live on the Progress page (ProgressPage.jsx).
const pad2 = (n) => String(n).padStart(2, '0');
export const DIFF_CLS = { Easy: 'easy', Medium: 'med', Hard: 'hard' };

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
export function DiffChip({ level }) {
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
export const qHref = (q) => `/topic/${q.topicId}/q/${q.id}`;


function frameFor(s) {
  if (!s) return null;
  const qid = s.question?.id;
  const tid = s.topic?.id;
  switch (s.kind) {
    case 'lesson':
      return { fn: 'read', arg: `"${tid}"`, extra: s.title.startsWith('Start') ? null : `${(s.sectionIndex ?? 0) + 1}`, tag: 'lesson' };
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

export default function Dashboard() {
  const { progress } = useProgress();
  const step = nextStep(progress, topics);
  const isNew = !hasAnyProgress(progress);
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

  // ---- pattern city: one tower per topic, grows as mastery rises ----
  const started = Object.keys(progress.questions).length + Object.keys(progress.topics).length > 0;
  const statusOf = Object.fromEntries(topics.map((t) => [t.id, topicStatus(t, progress)]));
  const cityStages = stages
    .filter((s) => s.topics.length)
    .map((s, i) => ({
      id: s.id,
      number: i + 1,
      title: s.title.split(' & ')[0].length > 18 ? s.title.split(' ')[0] : s.title.split(' & ')[0],
      topics: s.topics.map((t) => ({ id: t.id, title: t.title, status: statusOf[t.id], mastery: topicStats(t, progress).mastery, current: started && t.id === heroTopic.id })),
    }));
  const counts = { completed: 0, 'in-progress': 0, available: 0, locked: 0 };
  for (const t of topics) counts[statusOf[t.id]]++;
  const masteries = topics.map((t) => ({ t, m: topicStats(t, progress).mastery }));
  const tallest = masteries.reduce((x, y) => (y.m > x.m ? y : x), masteries[0]);

  const hour = now.getHours();
  const greet = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="page dash">
      {/* ---------- greeting ---------- */}
      <div data-guide="dash-greet" className="dash-greet rise">
        <h1 className="dash-hi">
          <span className="eyebrow">{dateLabel}</span>
          {isNew ? 'Welcome to DSA Journey.' : `${greet}.`}{' '}
          <span className="dash-hi-sub">
            {isNew ? 'Start with the first lesson below.' : `${plural(frames.length, 'frame')} on today’s stack.`}
          </span>
        </h1>
      </div>


      <div className="dash-coach rise">
        <CoachTip id="dashboard" title="Your next step picks itself.">
          Worked out from your answers: open lesson → missed pattern challenge → unsolved questions → revision. Press <span className="kbd">?</span> for the tour.
        </CoachTip>
      </div>

      <ShortOfTheDay />

      {/* ================= HERO ================= */}
      <section data-guide="dash-hero" className="tile tile--glow dash-hero dash-hero--solo rise" style={{ '--i': 1 }} aria-labelledby="dash-hero-title">
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
                  lesson {hs.lessonCompleted ? `✓ ${secs.length}` : `${secI + 1}`} / {secs.length}
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
                  <b>{lessonOpen ? `${secI + 1}. ${secs[secI].title}` : nextQ ? nextQ.title : 'revision'}</b>
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
                {lessonOpen && step.kind === 'lesson' ? (step.title.startsWith('Start') ? 'Start the lesson' : `Resume step ${secI + 1}`) : { start: 'Start learning', pattern: 'Retry it', question: 'Solve it', revision: 'Revise', topic: 'Start the topic', done: 'Open Revision' }[step.kind] || 'Go'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/plan" className="btn btn--ghost btn--lg">
                Plan your journey
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
      </section>

      {/* ================= MASTERY MAP: pattern city ================= */}
      <section data-guide="dash-city" className="tile section rise dash-city-tile" style={{ '--i': 2 }} aria-labelledby="dash-city-t">
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
            Patterns <Icon name="arrowRight" size={13} />
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
              {started && (
                <span>
                  Beacon <b className="t-uv">{heroTopic.title}</b> · you are here
                </span>
              )}
              <span>Height = topic mastery (lesson 30%, then Easy, Medium and Hard solved).</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TODAY + BFS ================= */}
      <div className="grid section dash-row4">
        <section data-guide="dash-today" className="tile c-5 rise dash-stack-tile" style={{ '--i': 2 }} aria-labelledby="dash-stack-t">
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
        <section data-guide="dash-bfs" className="tile c-7 rise dash-bfs" style={{ '--i': 3 }} aria-labelledby="dash-bfs-t">
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

    </div>
  );
}

/** two-letter text monogram (never a logo) */
export function mono(name) {
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
  const r = qs?.lastResult;
  return (
    <aside className="tile tile--raised dash-next" aria-label="Next problem">
      <div className="eyebrow">
        <span>Next problem</span>
        <span>{topicById[q.topicId]?.title || ''}</span>
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
