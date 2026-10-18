import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { hasVisual } from '../components/PatternVisual.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicStats, topicStatus, recommendations, weakAreas } from '../state/selectors.js';
import { stages, topics, topicById, allPatterns, allQuestions, getCheckpoints, companyQuestionsForTopic } from '../content/index.js';

/* ---------- small shared helpers (also used by ContentsPage) ---------- */
export const pad2 = (n) => String(n).padStart(2, '0');
/** 150 → "2h30", 420 → "7h", 45 → "45m" */
export function fmtH(min) {
  const m = Math.round(min / 10) * 10;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${pad2(r)}` : `${h}h`;
}
const has = (s, q) => String(s || '').toLowerCase().includes(q);

/** Status chip for a topic (uv = current / in progress, ice = unlocked, plasma = completed). */
export function TopicStatusChip({ status, current }) {
  if (status === 'completed') return <span className="chip chip--heat">Completed</span>;
  if (status === 'in-progress')
    return (
      <span className="chip chip--uv">
        {current && <i className="pip pip--uv" />}
        {current ? 'Current' : 'In progress'}
      </span>
    );
  if (status === 'available') return <span className="chip chip--ice">Unlocked</span>;
  return (
    <span className="chip">
      <Icon name="lock" size={12} /> Locked
    </span>
  );
}

/** Stage roll-up: { state: done|cur|part|lock, done, open, solved, total, mastery, minutes, steps } */
export function stageSummary(stage, progress, currentId) {
  let done = 0;
  let open = 0;
  let solved = 0;
  let total = 0;
  let mastery = 0;
  let minutes = 0;
  let steps = 0;
  for (const t of stage.topics) {
    const st = topicStatus(t, progress);
    const s = topicStats(t, progress);
    if (st === 'completed') done++;
    if (st !== 'locked') open++;
    solved += s.solved;
    total += s.total;
    mastery += s.mastery;
    minutes += t.estMinutes || 0;
    steps += t.lesson.sections.length;
  }
  const n = stage.topics.length;
  const state = done === n ? 'done' : stage.topics.some((t) => t.id === currentId) ? 'cur' : open > 0 ? 'part' : 'lock';
  return { state, done, open, solved, total, mastery: Math.round(mastery / Math.max(1, n)), minutes, steps };
}

/* ---------- one topic row inside the stage panel ---------- */
export function TopicRow({ topic, progress, dispatch, current, recommended, showStage = false }) {
  const status = topicStatus(topic, progress);
  const s = topicStats(topic, progress);
  const tp = progress.topics[topic.id] || {};
  const locked = status === 'locked';
  const n = topic.lesson.sections.length;
  const cells = 10;
  const on = s.total ? Math.round((s.solved / s.total) * cells) : s.lessonCompleted ? cells : 0;
  const companyCount = companyQuestionsForTopic(topic.id).length;
  const reached = s.lessonCompleted ? n : Math.min(n, (tp.sectionIndex || 0) + 1);
  const started = status !== 'available' && status !== 'locked';
  const action = locked ? null : status === 'completed' ? 'Revisit' : current ? 'Resume' : status === 'in-progress' ? 'Continue' : 'Start';
  return (
    <div className={`lp-row ${current ? 'lp-row--cur' : ''} ${locked ? 'lp-row--lock' : ''}`} id={`topic-${topic.id}`}>
      <span className="lp-ix" aria-hidden="true">
        {pad2(topic.index + 1)}
      </span>
      <div className="lp-nm">
        <h4>
          {locked ? topic.title : <Link to={`/topic/${topic.id}`}>{topic.title}</Link>}
          <TopicStatusChip status={status} current={current} />
          {recommended && !current && <span className="chip chip--ice">Next up</span>}
          {showStage && <span className="tag">{topic.stageTitle}</span>}
        </h4>
        <p>{topic.description}</p>
        <div className="lp-pre">
          {topic.prerequisites.length ? (
            <>
              needs
              {topic.prerequisites.map((p) => {
                const ok = progress.topics[p]?.lessonCompleted || progress.topics[p]?.manualComplete;
                return (
                  <Link key={p} to={`/topic/${p}`} className={`lp-ptr ${ok ? '' : 'lp-ptr--miss'}`} title={`${topicById[p].title}${ok ? ' — lesson done' : ' — lesson not finished'}`}>
                    {ok && <Icon name="check" size={10} strokeWidth={3} />}
                    {p}
                  </Link>
                );
              })}
            </>
          ) : (
            'no prerequisites'
          )}
          <span className="lp-meta">
            ~{fmtH(topic.estMinutes)} · {s.total} problems{companyCount > 0 ? ` · ${companyCount} company refs` : ''}
          </span>
        </div>
        {!locked && (
          <div className="lp-links">
            <Link to={`/topic/${topic.id}?tab=visualize`} title="Step-through animations for this topic">
              <Icon name="play" size={11} /> visualize
            </Link>
            {s.lessonCompleted && <Link to={`/topic/${topic.id}?tab=practice`}>practice</Link>}
            {status === 'completed' && <Link to={`/topic/${topic.id}?tab=review`}>review</Link>}
          </div>
        )}
      </div>
      <div className="lp-mast">
        <div className="vmeter" style={{ '--c': current || status === 'in-progress' ? 'var(--uv)' : undefined }} role="img" aria-label={`${topic.title}: ${s.solved} of ${s.total} problems solved, ${s.mastery}% mastery`}>
          {Array.from({ length: cells }, (_, i) => (
            <i key={i} className={i < on ? 'on' : ''} />
          ))}
        </div>
        <div className="lp-mast-row">
          <span>mastery {s.mastery}%</span>
          <b>
            {s.solved}/{s.total}
          </b>
        </div>
      </div>
      <div className="lp-ehm" aria-label="Solved by difficulty">
        {['Easy', 'Medium', 'Hard'].map((d) => {
          const b = s.byDiff[d];
          return (
            <div key={d} style={{ '--c': `var(--${d === 'Medium' ? 'med' : d.toLowerCase()})` }} title={`${d}: ${b.solved}/${b.total}`}>
              <i />
              <span className="lp-bar" style={{ '--v': `${b.total ? (b.solved / b.total) * 100 : 0}%` }} />
              <b>
                {b.solved}/{b.total}
              </b>
            </div>
          );
        })}
      </div>
      <div className="lp-lsn">
        <b className={current ? 't-uv' : ''}>{s.lessonCompleted ? `§${n}/${n} ✓` : started && n ? `§${reached}/${n}` : '—'}</b>
        {n} steps · {s.checkpointsPassed}/{s.checkpointsTotal} checks
      </div>
      <div className="lp-act">
        {locked ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })} title="Complete prerequisites first for the best experience.">
            <Icon name="lock" size={13} /> Unlock
          </button>
        ) : (
          <Link to={`/topic/${topic.id}`} className={`btn btn--sm ${current ? 'btn--plasma' : 'btn--ghost'}`}>
            {action} {current && <Icon name="arrowRight" size={14} />}
          </Link>
        )}
      </div>
    </div>
  );
}
export { TopicRow as TopicCard };

/* ---------- prerequisite DAG around one stage (layered, left → right) ---------- */
function PrereqDag({ stage, progress, currentId }) {
  const nav = useNavigate();
  const graph = useMemo(() => {
    const inStage = new Set(stage.topics.map((t) => t.id));
    const ids = new Set(inStage);
    for (const t of stage.topics) for (const p of t.prerequisites) ids.add(p);
    // direct dependents, but only from this stage and the next one (hub topics like hashing feed half the course)
    const si = stages.indexOf(stage);
    const near = new Set([...(stages[si + 1]?.topics || [])].map((t) => t.id));
    for (const t of topics) if (!inStage.has(t.id) && near.has(t.id) && t.prerequisites.some((p) => inStage.has(p))) ids.add(t.id);
    const depth = {};
    const d = (id) => {
      if (depth[id] !== undefined) return depth[id];
      depth[id] = 0;
      const ps = topicById[id].prerequisites.filter((p) => ids.has(p));
      depth[id] = ps.length ? Math.max(...ps.map(d)) + 1 : 0;
      return depth[id];
    };
    [...ids].forEach(d);
    const layers = [];
    for (const id of [...ids].sort((a, b) => topicById[a].index - topicById[b].index)) (layers[depth[id]] ||= []).push(id);
    const colW = 118;
    const rowH = 46;
    const maxRows = Math.max(...layers.map((l) => l.length));
    const H = maxRows * rowH + 16;
    const pos = {};
    layers.forEach((l, li) => {
      const off = (H - l.length * rowH) / 2;
      l.forEach((id, ri) => {
        pos[id] = { x: 14 + li * colW, y: off + ri * rowH + rowH / 2 + 6 };
      });
    });
    const edges = [];
    for (const id of ids) for (const p of topicById[id].prerequisites) if (ids.has(p)) edges.push([p, id]);
    return { ids: [...ids], pos, edges, W: (layers.length - 1) * colW + 124, H, inStage };
  }, [stage]);

  const done = (id) => !!(progress.topics[id]?.lessonCompleted || progress.topics[id]?.manualComplete);
  const cls = (id) => {
    if (id === currentId) return 'cur';
    if (done(id)) return 'done';
    const st = topicStatus(topicById[id], progress);
    return st === 'in-progress' ? 'prog' : st === 'available' ? 'avail' : 'lock';
  };
  const label = (id) => (id.length > 15 ? `${id.slice(0, 14)}…` : id);
  const words = { cur: 'current', done: 'lesson done', prog: 'in progress', avail: 'unlocked', lock: 'locked' };
  return (
    <svg className="lp-dag-svg" viewBox={`0 0 ${graph.W} ${graph.H}`} style={{ minWidth: Math.min(graph.W, 440) }} role="group" aria-label={`Prerequisite graph around ${stage.title}`}>
      <defs>
        <linearGradient id="lpDagHot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFAA70" />
          <stop offset="1" stopColor="#FF2E88" />
        </linearGradient>
      </defs>
      {graph.edges.map(([a, b]) => {
        const A = graph.pos[a];
        const B = graph.pos[b];
        const mx = (A.x + B.x) / 2;
        const k = done(a) ? 'lp-e--lit' : a === currentId ? 'lp-e--next' : '';
        return <path key={`${a}>${b}`} className={`lp-e ${k}`} d={`M${A.x + 8} ${A.y} C${mx} ${A.y} ${mx} ${B.y} ${B.x - 8} ${B.y}`} />;
      })}
      {graph.ids.map((id) => {
        const p = graph.pos[id];
        const c = cls(id);
        const out = !graph.inStage.has(id);
        const go = () => nav(`/topic/${id}`);
        return (
          <g
            key={id}
            className={`lp-n lp-n--${c} ${out ? 'lp-n--out' : ''}`}
            role="link"
            tabIndex={0}
            aria-label={`${topicById[id].title} (${words[c]})`}
            onClick={go}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go();
              }
            }}
          >
            <title>{topicById[id].title}</title>
            {c === 'cur' && <circle className="lp-ring" cx={p.x} cy={p.y} r={9} />}
            <circle className="lp-dot" cx={p.x} cy={p.y} r={c === 'cur' ? 8 : 7} />
            <text x={p.x - 7} y={p.y - 13}>
              {label(id)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** "Finish X → unlocks Y" sentences for the stage's unfinished, open topics. */
function unlockHints(stage, progress) {
  const done = (id) => !!(progress.topics[id]?.lessonCompleted || progress.topics[id]?.manualComplete);
  const out = [];
  for (const t of stage.topics) {
    if (done(t.id) || topicStatus(t, progress) === 'locked') continue;
    const unlocks = [];
    const withOthers = [];
    for (const d of topics) {
      if (!d.prerequisites.includes(t.id) || topicStatus(d, progress) !== 'locked') continue;
      const missing = d.prerequisites.filter((p) => !done(p));
      if (missing.length === 1) unlocks.push(d.title);
      else if (missing.length === 2) withOthers.push({ title: d.title, also: missing.filter((m) => m !== t.id).map((m) => topicById[m].title) });
    }
    if (unlocks.length || withOthers.length) out.push({ topic: t, unlocks, withOthers });
  }
  return out.slice(0, 3);
}

export default function LearningPath() {
  const { progress, dispatch } = useProgress();
  const { hash } = useLocation();
  const rec = recommendations(progress);
  const currentId = rec.current?.id;
  const currentStageId = rec.current?.stageId || stages[0].id;
  const [selected, setSelected] = useState(() => {
    const m = /^#stage-(.+)$/.exec(hash || '');
    return m && stages.some((s) => s.id === m[1]) ? m[1] : currentStageId;
  });
  const [query, setQuery] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [onlyViz, setOnlyViz] = useState(false);
  const panelRef = useRef(null);
  const q = query.trim().toLowerCase();
  const filtering = !!q || statusF !== 'all' || onlyUnsolved || onlyViz;

  // deep link: /path#stage-<id>
  useEffect(() => {
    const m = /^#stage-(.+)$/.exec(hash || '');
    if (!m || !stages.some((s) => s.id === m[1])) return undefined;
    setSelected(m[1]);
    const raf = requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  const sums = useMemo(() => Object.fromEntries(stages.map((st) => [st.id, stageSummary(st, progress, currentId)])), [progress, currentId]);
  const totals = useMemo(
    () => ({
      steps: topics.reduce((a, t) => a + t.lesson.sections.length, 0),
      checkpoints: topics.reduce((a, t) => a + getCheckpoints(t).length, 0),
    }),
    [],
  );
  const statuses = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, topicStatus(t, progress)])), [progress]);
  const counts = useMemo(() => {
    const c = { all: topics.length, 'in-progress': 0, available: 0, completed: 0, locked: 0 };
    for (const t of topics) c[statuses[t.id]]++;
    return c;
  }, [statuses]);
  const lessonsDone = topics.filter((t) => progress.topics[t.id]?.lessonCompleted).length;
  const solved = allQuestions.filter((x) => progress.questions[x.id]?.status === 'solved').length;
  const minutesLeft = topics.filter((t) => !progress.topics[t.id]?.lessonCompleted).reduce((a, t) => a + (t.estMinutes || 0), 0);
  const curLessonDone = !!progress.topics[currentId]?.lessonCompleted;
  const curSecIdx = (progress.topics[currentId]?.sectionIndex || 0) + 1;
  const curSection = rec.current?.lesson.sections[curSecIdx - 1];

  const matches = (t) => {
    if (statusF !== 'all' && statuses[t.id] !== statusF) return false;
    if (onlyUnsolved && !t.questions.some((x) => progress.questions[x.id]?.status !== 'solved')) return false;
    if (onlyViz && !t.patterns.some(hasVisual)) return false;
    if (q && ![t.title, t.description, t.id, t.stageTitle, ...t.lesson.sections.map((s) => s.title), ...t.patterns.map((p) => p.name)].some((s) => has(s, q))) return false;
    return true;
  };
  const stage = stages.find((s) => s.id === selected) || stages[0];
  const si = stages.indexOf(stage);
  const sum = sums[stage.id];
  const rows = filtering ? topics.filter(matches) : stage.topics;
  const hints = unlockHints(stage, progress);
  const maxMin = Math.max(...stages.map((s) => sums[s.id].minutes));
  const weak = new Set(weakAreas(progress).map((w) => w.topic.id));

  // recommended next — a queue: the next action, other topics in flight, then the next new topic
  const queue = [];
  if (rec.nextAction) {
    const a = rec.nextAction;
    if (a.kind === 'lesson')
      queue.push({
        to: `/topic/${a.topic.id}`,
        text: (
          <>
            Continue <b>{a.topic.title}</b> — {curSection?.title || 'the lesson'}
          </>
        ),
        t: `§${curSecIdx}/${a.topic.lesson.sections.length}`,
      });
    else if (a.kind === 'question')
      queue.push({
        to: `/topic/${a.topic.id}/q/${a.question.id}`,
        text: (
          <>
            Solve <b>{a.question.title}</b>
          </>
        ),
        t: a.question.difficulty,
      });
    else queue.push({ to: `/topic/${a.topic.id}`, text: <>{a.label}</>, t: `~${fmtH(a.topic.estMinutes)}` });
  }
  for (const t of topics) {
    if (queue.length >= 3) break;
    if (t.id !== currentId && statuses[t.id] === 'in-progress')
      queue.push({
        to: `/topic/${t.id}`,
        text: (
          <>
            Back to <b>{t.title}</b>
            {weak.has(t.id) ? ' — weak area' : ''}
          </>
        ),
        t: `${topicStats(t, progress).mastery}%`,
      });
  }
  if (rec.nextTopic && queue.length < 4)
    queue.push({
      to: `/topic/${rec.nextTopic.id}`,
      text: (
        <>
          Start <b>{rec.nextTopic.title}</b>
        </>
      ),
      t: `~${fmtH(rec.nextTopic.estMinutes)}`,
    });

  const pick = (id) => {
    setSelected(id);
    setQuery('');
    setStatusF('all');
    setOnlyUnsolved(false);
    setOnlyViz(false);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="page lp">
      {/* ---------- hero ---------- */}
      <section className="lp-hero rise">
        <div>
          <span className="eyebrow">
            <i className="pip pip--uv" />
            LinkedList&lt;Stage&gt; · head → NULL
          </span>
          <h1 className="display chrome lp-title">
            The path<span className="lp-dot">.</span>
          </h1>
          <p className="lead">
            {stages.length} stages, {topics.length} topics. A topic unlocks when its prerequisites’ lessons are done; it’s <b>completed</b> when you finish the lesson and solve at least half its problems.
            {rec.current && (
              <>
                {' '}
                You’re on{' '}
                <b>
                  Stage {pad2(stages.findIndex((s) => s.id === rec.current.stageId) + 1)} → {rec.current.title}
                  {curLessonDone ? '' : `, §${curSecIdx}`}
                </b>
                .
              </>
            )}
          </p>
        </div>
        <div className="lp-stats">
          <div>
            <span className="num">
              {lessonsDone}
              <span className="of"> / {topics.length}</span>
            </span>
            <span className="eyebrow">lessons done</span>
          </div>
          <div>
            <span className="num">
              {solved}
              <span className="of"> / {allQuestions.length}</span>
            </span>
            <span className="eyebrow">problems solved</span>
          </div>
          <div>
            <span className="num plasma-text">~{Math.round(minutesLeft / 60)}h</span>
            <span className="eyebrow">of lessons left</span>
          </div>
        </div>
      </section>

      {/* ---------- the linked list of stage blocks ---------- */}
      <section className="tile tile--glow lp-rail rise" style={{ '--i': 1 }} aria-labelledby="lp-chain-t">
        <div className="lp-rail-head">
          <span className="eyebrow" id="lp-chain-t">
            stages · {stages.length} nodes · towers = topics · height = share solved
          </span>
          <div className="lp-legend" aria-hidden="true">
            <span>
              <i className="lp-lg--done" />
              completed
            </span>
            <span>
              <i className="lp-lg--cur" />
              current
            </span>
            <span>
              <i className="lp-lg--open" />
              unlocked
            </span>
            <span>
              <i className="lp-lg--lock" />
              locked
            </span>
          </div>
        </div>
        <ol className="lp-chain">
          {stages.map((st, i) => {
            const m = sums[st.id];
            const many = st.topics.length;
            const w = many >= 6 ? 10 : many === 5 ? 12 : 15;
            const firstMissing = m.state === 'lock' ? st.topics[0].prerequisites.find((p) => !progress.topics[p]?.lessonCompleted) : null;
            const sel = st.id === selected && !filtering;
            return (
              <li key={st.id} className={`lp-sn lp-sn--${m.state} ${sel ? 'is-sel' : ''}`}>
                <button type="button" className="lp-sn-btn" onClick={() => pick(st.id)} aria-pressed={sel} aria-label={`Stage ${i + 1} ${st.title}: ${m.done} of ${st.topics.length} topics completed, ${m.solved} of ${m.total} problems solved`}>
                  {m.state === 'cur' && (
                    <span className="lp-you" aria-hidden="true">
                      <span>you{curLessonDone ? '' : ` · §${curSecIdx}`}</span>
                      <i />
                    </span>
                  )}
                  <span className="lp-towers" aria-hidden="true" style={{ gap: many >= 6 ? 5 : 8 }}>
                    {st.topics.map((t) => {
                      const ts = statuses[t.id];
                      const s = topicStats(t, progress);
                      const share = s.total ? s.solved / s.total : s.lessonCompleted ? 1 : 0;
                      const h = ts === 'locked' ? 0.35 : Math.max(0.5, +(0.5 + 4.5 * share).toFixed(2));
                      const tone = t.id === currentId || ts === 'in-progress' ? 'vox--uv' : ts === 'completed' ? '' : ts === 'available' ? 'lp-vox--avail' : 'lp-vox--lock';
                      return <span key={t.id} className={`vox ${tone}`} style={{ '--h': h, '--w': `${w}px` }} />;
                    })}
                  </span>
                  <span className="lp-block">
                    <span className="eyebrow lp-block-k">
                      <span>S{pad2(i + 1)}</span>
                      <span className={m.state === 'done' ? 't-plasma' : m.state === 'cur' ? 't-uv' : m.state === 'part' ? 't-ice' : ''}>{m.state === 'done' ? 'done' : m.state === 'cur' ? `${m.mastery}%` : m.state === 'part' ? `${m.open} open` : 'locked'}</span>
                    </span>
                    <span className="lp-block-t">{st.title}</span>
                    <span className="lp-block-s">
                      {m.done}/{st.topics.length} · {fmtH(m.minutes)}
                    </span>
                    <span className={`meter ${m.state === 'cur' ? 'meter--uv' : m.state === 'part' ? 'meter--ice' : ''}`} style={{ '--v': `${m.state === 'done' ? 100 : m.state === 'cur' ? m.mastery : m.total ? (m.solved / m.total) * 100 : 0}%` }}>
                      <i />
                    </span>
                  </span>
                  <span className="lp-idx">
                    <span className={i === 0 ? 't-plasma' : ''}>{i === 0 ? 'head [0]' : `[${i}]`}</span>
                    <b>{i === stages.length - 1 ? '→ NULL' : m.state === 'cur' ? 'current' : firstMissing ? `needs ${firstMissing}` : `${m.solved}/${m.total}`}</b>
                  </span>
                </button>
                {i < stages.length - 1 && <span className="lp-next" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <div className="lp-rail-foot">
          {[
            [stages.length, 'stages'],
            [topics.length, 'topics'],
            [totals.steps, 'lesson steps'],
            [totals.checkpoints, 'checkpoints'],
            [allPatterns.length, 'patterns'],
            [allQuestions.length, 'problems'],
          ].map(([n, l]) => (
            <div key={l}>
              <span className="num">{n}</span>
              <span className="eyebrow">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- toolbar ---------- */}
      <div className="lp-toolbar rise" style={{ '--i': 2 }}>
        <label className="search-in lp-search">
          <Icon name="search" size={17} />
          <input className="input" type="search" placeholder="Search topics, lesson steps, patterns…" aria-label="Search topics, lesson steps and patterns" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="seg lp-seg" role="group" aria-label="Filter by status">
          {[
            ['all', 'All'],
            ['in-progress', 'In progress'],
            ['available', 'Unlocked'],
            ['completed', 'Done'],
            ['locked', 'Locked'],
          ].map(([id, l]) => (
            <button key={id} type="button" aria-pressed={statusF === id} onClick={() => setStatusF(id)}>
              {l} <span className="mono">{counts[id]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="chip" aria-pressed={onlyUnsolved} onClick={() => setOnlyUnsolved((v) => !v)}>
          <Icon name="check" size={13} /> Has unsolved
        </button>
        <button type="button" className="chip" aria-pressed={onlyViz} onClick={() => setOnlyViz((v) => !v)}>
          <Icon name="play" size={13} /> Has animation
        </button>
      </div>

      {/* ---------- stage panel + DAG + estimates ---------- */}
      <div className="grid lp-grid">
        <section className="tile c-12 lp-panel rise" style={{ '--i': 3 }} ref={panelRef} id={`stage-${stage.id}`} aria-labelledby="lp-panel-t">
          <nav className="lp-tabs" aria-label="Stages">
            {stages.map((st, i) => {
              const m = sums[st.id];
              const sel = st.id === selected && !filtering;
              return (
                <button key={st.id} type="button" className={`lp-stab lp-stab--${m.state}`} aria-current={sel ? 'true' : undefined} onClick={() => pick(st.id)}>
                  <i />S{pad2(i + 1)}
                  {sel && <span className="lp-stab-t"> · {st.title}</span>}
                </button>
              );
            })}
          </nav>
          {filtering ? (
            <div className="lp-panel-head">
              <div>
                <span className="eyebrow">
                  <i className="pip pip--ice" />
                  filter · all stages
                </span>
                <h2 id="lp-panel-t" className="h1">
                  {rows.length} matching topic{rows.length === 1 ? '' : 's'}
                </h2>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => pick(selected)}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="lp-panel-head">
              <div>
                <span className="eyebrow">
                  <i className={`pip ${sum.state === 'cur' ? 'pip--uv' : sum.state === 'part' ? 'pip--ice' : ''}`} />
                  Stage {pad2(si + 1)} · {sum.state === 'done' ? 'completed' : sum.state === 'cur' ? 'in progress' : sum.state === 'part' ? `${sum.open} unlocked` : 'locked'} · est. {fmtH(sum.minutes)}
                </span>
                <h2 id="lp-panel-t" className="h1">
                  {stage.title}
                </h2>
                <p>{stage.description}</p>
              </div>
              <div className="lp-kpis">
                <div>
                  <span className="num">
                    {sum.done}
                    <span className="of">/{stage.topics.length}</span>
                  </span>
                  <span className="eyebrow">topics done</span>
                </div>
                <div>
                  <span className={`num ${sum.state === 'cur' ? 't-uv' : ''}`}>
                    {sum.mastery}
                    <span className="of">%</span>
                  </span>
                  <span className="eyebrow">mastery</span>
                </div>
                <div>
                  <span className="num">
                    {sum.solved}
                    <span className="of">/{sum.total}</span>
                  </span>
                  <span className="eyebrow">solved</span>
                </div>
              </div>
            </div>
          )}
          <div className="lp-rows">
            {rows.map((t) => (
              <TopicRow key={t.id} topic={t} progress={progress} dispatch={dispatch} current={t.id === currentId && statuses[t.id] !== 'completed'} recommended={t.id === rec.nextTopic?.id} showStage={filtering} />
            ))}
            {!rows.length && <p className="lp-empty">Nothing matches. Try another word or clear the filters.</p>}
          </div>
        </section>

        <section className="tile c-7 lp-dag rise" style={{ '--i': 4 }} aria-labelledby="lp-dag-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--ice" />
                Prerequisites · a DAG · S{pad2(si + 1)}
              </span>
              <h2 id="lp-dag-t" className="h2 lp-h2">
                What unlocks what
              </h2>
            </div>
          </div>
          <div className="lp-dag-wrap">
            <div className="lp-dag-scroll">
              <PrereqDag stage={stage} progress={progress} currentId={currentId} />
            </div>
            <div className="lp-dag-side">
              <div className="lp-dag-legend" aria-hidden="true">
                <span>
                  <i className="lp-lg--done" />
                  lesson done
                </span>
                <span>
                  <i className="lp-lg--cur" />
                  current
                </span>
                <span>
                  <i className="lp-lg--prog" />
                  in progress
                </span>
                <span>
                  <i className="lp-lg--open" />
                  unlocked
                </span>
                <span>
                  <i className="lp-lg--lock" />
                  locked
                </span>
              </div>
              <div className="lp-note">
                {hints.length ? (
                  hints.map((h) => (
                    <p key={h.topic.id}>
                      Finish <b>{h.topic.title}</b> →{' '}
                      {h.unlocks.length > 0 && (
                        <>
                          unlocks <b>{h.unlocks.join(', ')}</b>
                        </>
                      )}
                      {h.unlocks.length > 0 && h.withOthers.length > 0 && '; '}
                      {h.withOthers.length > 0 && (
                        <>
                          with {h.withOthers[0].also.join(' + ')}, unlocks <b>{h.withOthers[0].title}</b>
                        </>
                      )}
                      .
                    </p>
                  ))
                ) : (
                  <p>{sum.state === 'done' ? 'Every lesson in this stage is done — the topics that depend on it are open.' : sum.state === 'lock' ? 'Finish the prerequisites on the left to open this stage.' : 'Finishing these lessons opens the topics on the right.'}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="tile c-5 lp-est rise" style={{ '--i': 5 }} aria-labelledby="lp-est-t">
          <div className="tile-head lp-est-head">
            <span className="eyebrow" id="lp-est-t">
              <i className="pip" />
              Lesson time by stage
            </span>
            <span className="tag">{fmtH(stages.reduce((a, s) => a + sums[s.id].minutes, 0))} total</span>
          </div>
          <div className="lp-bars" role="img" aria-label={`Estimated lesson time per stage: ${stages.map((s, i) => `S${i + 1} ${fmtH(sums[s.id].minutes)}`).join(', ')}`}>
            {stages.map((st) => (
              <i key={st.id} className={`lp-bar--${sums[st.id].state}`} style={{ '--h': `${(sums[st.id].minutes / maxMin) * 100}%` }} />
            ))}
          </div>
          <div className="lp-bars-l" aria-hidden="true">
            {stages.map((st) => (
              <span key={st.id}>{fmtH(sums[st.id].minutes)}</span>
            ))}
          </div>
          <div className="lp-bars-l lp-bars-s" aria-hidden="true">
            {stages.map((st, i) => (
              <span key={st.id} className={sums[st.id].state === 'cur' ? 't-uv' : ''}>
                S{pad2(i + 1)}
              </span>
            ))}
          </div>
          <div className="lp-note lp-note--heat">
            About <b className="mono">{fmtH(minutesLeft)}</b> of lessons left across <b className="mono">{topics.length - lessonsDone}</b> topics — plus practice.
          </div>
          <span className="eyebrow lp-upn-k">recommended next · a queue</span>
          {queue.map((x, i) => (
            <Link key={i} className="lp-upn" to={x.to}>
              <span className="lp-upn-q">[{i}]</span>
              <span>{x.text}</span>
              <span className="lp-upn-t">{x.t}</span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
