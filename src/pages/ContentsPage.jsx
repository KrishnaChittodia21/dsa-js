import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  Box,
  Building2,
  Check,
  ChevronRight,
  Code2,
  FileText,
  List,
  Lock,
  Map as MapIcon,
  PlayCircle,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Target,
  Terminal,
} from 'lucide-react';
import CoachTip from '../components/guide/CoachTip.jsx';
import { hasVisual } from '../components/PatternVisual.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { mistakeQuestions, recommendations, topicStats, topicStatus } from '../state/selectors.js';
import { allPatterns, allQuestions, companies, companyQuestions, companyQuestionsForTopic, getCheckpoints, jsSections, stages, toolkit, topics } from '../content/index.js';
import { fmtH, pad2, stageSummary } from './LearningPath.jsx';

/** Highlights every case-insensitive occurrence of `q` in `text`. */
function Hl({ text, q }) {
  if (!q) return text;
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, i)) {
    if (at > i) parts.push(text.slice(i, at));
    parts.push(<mark key={at}>{text.slice(at, at + q.length)}</mark>);
    i = at + q.length;
  }
  parts.push(text.slice(i));
  return <>{parts}</>;
}

const has = (s, q) => String(s || '').toLowerCase().includes(q);
const shortPattern = (name) => name.replace(/^.*?—\s*/, '');
const DIFF_LETTER = { Easy: 'E', Medium: 'M', Hard: 'H' };
const DIFF_CLS = { Easy: 't-easy', Medium: 't-med', Hard: 't-hard' };

/** Everything in the course on one page: stages → topics → lesson steps, patterns, questions, plus every other page. */
export default function ContentsPage() {
  const { progress } = useProgress();
  const { hash } = useLocation();
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [onlyViz, setOnlyViz] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  // per-topic open state; undefined → default (current topic open, or open when a search hits inside it)
  const [openTopics, setOpenTopics] = useState({});
  const q = query.trim().toLowerCase();
  const filtering = !!q || onlyUnsolved || onlyViz;
  const currentId = recommendations(progress).current?.id;

  const totals = useMemo(
    () => ({
      steps: topics.reduce((a, t) => a + t.lesson.sections.length, 0),
      checkpoints: topics.reduce((a, t) => a + getCheckpoints(t).length, 0),
      animations: allPatterns.filter(hasVisual).length,
    }),
    [],
  );

  // stage id → visible topic views ({ topic, sections, patterns, questions, deep })
  const views = useMemo(() => {
    const out = new Map();
    for (const st of stages) {
      const stageHit = !!q && has(st.title, q);
      const list = [];
      for (const t of st.topics) {
        const tp = progress.topics[t.id] || {};
        const read = (i) => tp.lessonCompleted || i < (tp.maxSectionIndex || 0);
        const topicHit = !q || stageHit || [t.title, t.description, t.category].some((s) => has(s, q));
        let sections = t.lesson.sections.map((_, i) => i);
        let patterns = t.patterns;
        let questions = t.questions;
        if (onlyUnsolved) {
          sections = sections.filter((i) => !read(i));
          questions = questions.filter((x) => progress.questions[x.id]?.status !== 'solved');
        }
        if (onlyViz) patterns = patterns.filter(hasVisual);
        let deep = false;
        if (q && !topicHit) {
          sections = sections.filter((i) => has(t.lesson.sections[i].title, q));
          patterns = patterns.filter((p) => has(p.name, q) || has(p.summary, q));
          questions = questions.filter((x) => has(x.title, q) || (x.tags || []).some((g) => has(g, q)));
          deep = true;
        }
        if (onlyViz && !patterns.length) continue;
        if (onlyUnsolved && tp.lessonCompleted && !questions.length) continue;
        if (q && !topicHit && !sections.length && !patterns.length && !questions.length) continue;
        list.push({ topic: t, sections, patterns, questions, deep });
      }
      if (list.length) out.set(st.id, list);
    }
    return out;
  }, [progress, q, onlyUnsolved, onlyViz]);

  // deep links: /contents#stage-<id>, /contents#practice-tools
  useEffect(() => {
    if (!hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    const m = /^stage-(.+)$/.exec(id);
    if (m) setCollapsed((c) => ({ ...c, [m[1]]: false }));
    const raf = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  const jump = (stageId) => {
    setCollapsed((c) => ({ ...c, [stageId]: false }));
    nav(`/contents#stage-${stageId}`, { replace: true });
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setAll = (open) => {
    setCollapsed(Object.fromEntries(stages.map((s) => [s.id, !open])));
    setOpenTopics(Object.fromEntries(topics.map((t) => [t.id, open])));
  };
  const shownTopics = [...views.values()].reduce((a, l) => a + l.length, 0);
  const solved = allQuestions.filter((x) => progress.questions[x.id]?.status === 'solved').length;
  const retry = mistakeQuestions(progress).filter((x) => progress.questions[x.id]?.status !== 'solved').length;

  const tools = [
    { to: '/questions', icon: List, title: 'Questions', desc: 'Every practice question with topic, difficulty, status and company filters.', count: `${solved}/${allQuestions.length} solved` },
    { to: '/patterns', icon: Puzzle, title: 'Patterns', desc: 'Every pattern with recognition clues, template, variations and its questions.', count: `${allPatterns.length} patterns` },
    { to: '/finder', icon: Target, title: 'Pattern Finder', desc: 'Answer a few questions about a new problem and it names the pattern; keyword clues too.' },
    { to: '/visualize', icon: PlayCircle, title: 'Visualizer', desc: 'Step-through animations that pause to ask what happens next.', count: `${totals.animations} patterns animated` },
    { to: '/playground', icon: Terminal, title: 'Playground', desc: 'Run any JavaScript with the DSA toolkit classes available as globals.' },
    { to: '/revision', icon: RefreshCw, title: 'Revision', desc: 'Weak areas, questions to retry and the review of every finished lesson.', count: retry ? `${retry} to retry` : 'nothing to retry' },
    { to: '/cheatsheet', icon: FileText, title: 'Cheat Sheet', desc: 'Every topic’s pattern, template and complexity on one printable page.' },
    { to: '/companies', icon: Building2, title: 'Companies', desc: 'Questions linked to companies, each with a source and evidence level.', count: `${companies.length} companies · ${companyQuestions.length} entries` },
    { to: '/toolkit', icon: Box, title: 'JS DSA Toolkit', desc: 'Readable Stack, Queue, Deque, Heap, Trie, Union-Find, Segment tree… implementations.', count: `${toolkit.length} structures` },
    { to: '/js', icon: Code2, title: 'JavaScript for DSA', desc: 'The built-ins you need, their complexity and the gotchas.', count: `${jsSections.length} sections` },
    { to: '/path', icon: MapIcon, title: 'Learning Path', desc: 'The stages as a linked list with prerequisites and unlocks.' },
    { to: '/progress', icon: BarChart3, title: 'Progress', desc: 'Per-topic table, strong & weak areas, export / import and reset.' },
    { to: '/settings', icon: Settings, title: 'Settings', desc: 'Theme, accent colour, coach tips and the welcome tour.' },
  ];

  return (
    <div className="page cx">
      <div className="section-head cx-head rise">
        <div>
          <span className="eyebrow">
            <i className="pip" />
            Contents · everything in DSA Journey
          </span>
          <h1 className="h1 cx-title">stages → topics → lessons → problems</h1>
        </div>
        <div className="row">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll(true)}>
            Expand all
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll(false)}>
            Collapse all
          </button>
        </div>
      </div>
      <div className="cx-tot rise" style={{ '--i': 1 }}>
        {[
          [stages.length, 'stages'],
          [topics.length, 'topics'],
          [totals.steps, 'lesson steps'],
          [totals.checkpoints, 'checkpoints'],
          [allPatterns.length, 'patterns'],
          [totals.animations, 'animated'],
          [allQuestions.length, 'problems'],
          [toolkit.length, 'toolkit structures'],
        ].map(([n, l]) => (
          <span key={l}>
            <b>{n}</b> {l}
          </span>
        ))}
        {filtering && (
          <span className="cx-tot-hit" aria-live="polite">
            {q ? `filter “${query.trim()}” · ` : 'filtered · '}
            {shownTopics} topic{shownTopics === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <CoachTip id="page:contents" title="Find anything.">
        Search filters every stage, topic, lesson step, pattern and question below. Press <kbd className="kbd">⌘</kbd>/<kbd className="kbd">Ctrl</kbd> <kbd className="kbd">K</kbd> anywhere to jump straight to one.
      </CoachTip>

      <div className="cx-toolbar rise" style={{ '--i': 2 }}>
        <label className="search-in cx-search">
          <Search aria-hidden="true" />
          <input className="input" type="search" placeholder="Search topics, lesson steps, patterns, questions…" aria-label="Search the contents" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" className="chip" aria-pressed={onlyUnsolved} onClick={() => setOnlyUnsolved((v) => !v)}>
          <Check aria-hidden="true" /> Only unsolved
        </button>
        <button type="button" className="chip" aria-pressed={onlyViz} onClick={() => setOnlyViz((v) => !v)}>
          <PlayCircle aria-hidden="true" /> Only with visualisations
        </button>
      </div>

      <nav className="cx-jump" aria-label="Jump to stage">
        {stages.map((st, i) => (
          <button key={st.id} type="button" className="cx-jump-b" onClick={() => jump(st.id)} disabled={!views.has(st.id)}>
            <span className="mono">S{pad2(i + 1)}</span> {st.title}
          </button>
        ))}
        <button type="button" className="cx-jump-b" onClick={() => document.getElementById('practice-tools')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="mono">+</span> Practice &amp; tools
        </button>
      </nav>

      <div className="cx-list">
        {stages.map((st, si) => {
          const list = views.get(st.id);
          if (!list) return null;
          const m = stageSummary(st, progress, currentId);
          const open = filtering || !collapsed[st.id];
          return (
            <section key={st.id} id={`stage-${st.id}`} className={`cx-st cx-st--${m.state}`}>
              <button type="button" className="cx-st-head" aria-expanded={open} onClick={() => setCollapsed((c) => ({ ...c, [st.id]: open }))}>
                <span className="cx-st-n">{pad2(si + 1)}</span>
                <span className="cx-st-title">
                  <span className="cx-st-h">
                    <Hl text={st.title} q={q} />
                  </span>
                  <span className="cx-st-d">{st.description}</span>
                </span>
                <span className="cx-st-sum">
                  {m.state === 'done' ? (
                    <span className="chip chip--heat">
                      {m.done} / {st.topics.length} done
                    </span>
                  ) : m.state === 'cur' ? (
                    <span className="chip chip--uv">
                      {m.done} / {st.topics.length} · {m.mastery}%
                    </span>
                  ) : m.state === 'part' ? (
                    <span className="chip chip--ice">{m.open} unlocked</span>
                  ) : (
                    <span className="chip">
                      <Lock aria-hidden="true" /> locked
                    </span>
                  )}
                  <span className="tag">{m.steps} steps</span>
                </span>
                <span className="cx-st-cnt">
                  <b>{m.solved}</b> / {m.total} solved
                  <br />
                  {fmtH(m.minutes)}
                </span>
                <ChevronRight aria-hidden="true" className="cx-chev" />
              </button>
              <Collapse open={open} className="cx-st-body">
                {list.map((v) => (
                  <TopicEntry
                    key={v.topic.id}
                    view={v}
                    q={q}
                    current={v.topic.id === currentId}
                    open={openTopics[v.topic.id] ?? (v.deep || (!filtering && v.topic.id === currentId))}
                    onToggle={(o) => setOpenTopics((s) => ({ ...s, [v.topic.id]: o }))}
                  />
                ))}
              </Collapse>
            </section>
          );
        })}
        {filtering && !views.size && <p className="cx-empty">Nothing matches. Try another word or turn off the toggles.</p>}
      </div>

      <section id="practice-tools" className="cx-tools">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <i className="pip pip--ice" />
              Practice &amp; tools
            </span>
            <h2 className="h2 cx-h2">Every page outside the topic lessons</h2>
          </div>
        </div>
        <div className="cx-tools-grid">
          {tools.map((t) => {
            const I = t.icon;
            return (
              <Link key={t.to} to={t.to} className="cx-tool">
                <span className="cx-tool-ico" aria-hidden="true">
                  <I />
                </span>
                <span className="cx-tool-txt">
                  <b>{t.title}</b>
                  <span>{t.desc}</span>
                  {t.count && <span className="cx-tool-n">{t.count}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Height-animated disclosure body (instant with reduced motion). */
function Collapse({ open, className, children }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div className={className} style={{ overflow: 'hidden' }} initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopicEntry({ view, q, current, open, onToggle }) {
  const { progress } = useProgress();
  const { topic: t, sections, patterns, questions } = view;
  const status = topicStatus(t, progress);
  const s = topicStats(t, progress);
  const tp = progress.topics[t.id] || {};
  const company = companyQuestionsForTopic(t.id).length;
  const animated = t.patterns.some(hasVisual);
  const cells = 10;
  const on = s.total ? Math.round((s.solved / s.total) * cells) : s.lessonCompleted ? cells : 0;
  const uvTone = current || status === 'in-progress';
  const chips = [
    ['visualize', t.patterns.filter(hasVisual).length],
    ['practice', t.questions.length],
    ['review', undefined],
    ['company', company],
    ['cheatsheet', undefined],
  ];
  const chipCls = status === 'completed' ? 'chip--solved' : s.solved > 0 || s.attempted > 0 ? 'chip--attempted' : 'chip--todo';
  return (
    <article className={`cx-tp cx-tp--${status} ${current ? 'cx-tp--cur' : ''}`} id={`contents-${t.id}`}>
      <button type="button" className="cx-tp-head" aria-expanded={open} onClick={() => onToggle(!open)}>
        <span className="cx-ix">{pad2(t.index + 1)}</span>
        <span className="cx-tt">
          <Hl text={t.title} q={q} />
          <small>
            {t.lesson.sections.length} steps · {t.patterns.length} pattern{t.patterns.length === 1 ? '' : 's'}
            {animated ? ' · ▶ animated' : ''}
            {status === 'locked' ? ' · locked' : ''}
          </small>
        </span>
        <span className="cx-mini" style={{ '--c': uvTone ? 'var(--uv)' : undefined }} role="img" aria-label={`${s.mastery}% mastery`}>
          {Array.from({ length: cells }, (_, i) => (
            <i key={i} className={i < on ? 'on' : ''} />
          ))}
        </span>
        <span className={`chip ${chipCls}`}>
          {s.solved}/{s.total}
        </span>
        <ChevronRight aria-hidden="true" className="cx-chev" />
      </button>
      <Collapse open={open} className="cx-tp-wrap">
        <div className="cx-tp-body">
          <div className="cx-col">
            <h5>
              <span>Lesson · {t.lesson.sections.length} steps</span>
              <span>
                {s.checkpointsPassed} / {s.checkpointsTotal} checkpoints
              </span>
            </h5>
            {sections.length === 0 && <p className="cx-none">{t.lesson.sections.length ? 'Every step read.' : 'This lesson is being written.'}</p>}
            {sections.map((i) => {
              const sec = t.lesson.sections[i];
              const cur = !tp.lessonCompleted && status === 'in-progress' && i === (tp.sectionIndex || 0);
              const read = !cur && (tp.lessonCompleted || i < (tp.maxSectionIndex || 0));
              const checks = (sec.blocks || []).filter((b) => b.type === 'checkpoint').length;
              return (
                <Link key={sec.id} to={`/topic/${t.id}?s=${i}`} className={`cx-chap ${read ? 'cx-chap--done' : ''} ${cur ? 'cx-chap--cur' : ''}`} aria-current={cur ? 'step' : undefined}>
                  <span className="cx-chap-s">§{i + 1}</span>
                  <span>
                    <Hl text={sec.title} q={q} />
                    {checks > 0 && (
                      <small>
                        {checks} checkpoint{checks === 1 ? '' : 's'}
                      </small>
                    )}
                  </span>
                  <span className="cx-chap-i" aria-label={read ? 'read' : cur ? 'reading' : 'not read'}>
                    {read && <Check aria-hidden="true" />}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="cx-col">
            <h5>
              <span>
                Problems · {questions.length === t.questions.length ? t.questions.length : `${questions.length} of ${t.questions.length}`}
              </span>
              <span>
                E {s.byDiff.Easy.solved}/{s.byDiff.Easy.total} · M {s.byDiff.Medium.solved}/{s.byDiff.Medium.total} · H {s.byDiff.Hard.solved}/{s.byDiff.Hard.total}
              </span>
            </h5>
            {questions.length === 0 && <p className="cx-none">{t.questions.length ? 'Every problem solved.' : 'Questions are on their way.'}</p>}
            {questions.map((x) => {
              const st = progress.questions[x.id]?.status;
              const lc = x.source?.number ? `${x.source.platform === 'LeetCode' ? 'LC' : x.source.platform || ''} ${x.source.number}` : '';
              return (
                <Link key={x.id} to={`/topic/${t.id}/q/${x.id}`} className={`cx-prob ${st === 'solved' ? 'cx-prob--solved' : ''}`}>
                  <i className={`cx-d cx-d--${st === 'solved' ? 's' : st === 'attempted' ? 'a' : 't'}`} aria-label={st || 'to do'} />
                  <span className="cx-prob-t">
                    <Hl text={x.title} q={q} />
                  </span>
                  <span className={`cx-df ${DIFF_CLS[x.difficulty]}`} title={x.difficulty}>
                    {DIFF_LETTER[x.difficulty]}
                  </span>
                  <span className="cx-lc">{lc}</span>
                </Link>
              );
            })}
          </div>
          <div className="cx-tp-foot">
            {patterns.length > 0 && (
              <div className="cx-chips">
                <span className="cx-k">patterns</span>
                {patterns.map((p) => (
                  <Link key={p.id} to={hasVisual(p) ? `/topic/${t.id}?tab=visualize` : `/patterns#${p.id}`} className="chip" title={p.summary}>
                    {hasVisual(p) && <PlayCircle aria-label="animated" />}
                    <Hl text={shortPattern(p.name)} q={q} />
                  </Link>
                ))}
              </div>
            )}
            <div className="cx-chips">
              <span className="cx-k">open</span>
              <Link to={`/topic/${t.id}`} className="chip chip--uv">
                <TabIcon id="learn" /> {TAB_META.learn.label}
              </Link>
              {chips
                .filter(([, n]) => n !== 0)
                .map(([id, n]) => (
                  <Link key={id} to={`/topic/${t.id}?tab=${id}`} className="chip">
                    <TabIcon id={id} /> {TAB_META[id].label}
                    {n !== undefined && <span className="cx-n">{n}</span>}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </Collapse>
    </article>
  );
}

function TabIcon({ id }) {
  const I = TAB_META[id].icon;
  return <I aria-hidden="true" />;
}
