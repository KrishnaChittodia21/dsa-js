import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  Box,
  Building2,
  Check,
  ChevronDown,
  Code2,
  FileText,
  List,
  ListTree,
  Map as MapIcon,
  PlayCircle,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Target,
  Terminal,
} from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import { DifficultyBadge } from '../components/ui/primitives.jsx';
import { hasVisual } from '../components/PatternVisual.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { mistakeQuestions, topicStats, topicStatus, STATUS_LABEL } from '../state/selectors.js';
import { allPatterns, allQuestions, companies, companyQuestions, companyQuestionsForTopic, getCheckpoints, jsSections, stages, toolkit, topics } from '../content/index.js';

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

/** Everything in the course on one page: stages → topics → lesson steps, patterns, questions, plus every other page. */
export default function ContentsPage() {
  const { progress } = useProgress();
  const { hash } = useLocation();
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [onlyViz, setOnlyViz] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const q = query.trim().toLowerCase();
  const filtering = !!q || onlyUnsolved || onlyViz;

  const totals = useMemo(
    () => ({
      steps: topics.reduce((a, t) => a + t.lesson.sections.length, 0),
      checkpoints: topics.reduce((a, t) => a + getCheckpoints(t).length, 0),
      animations: allPatterns.filter(hasVisual).length,
    }),
    [],
  );

  // stage id → visible topic views ({ topic, sections, patterns, questions, questionHits })
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
        let questionHits = false;
        if (q && !topicHit) {
          sections = sections.filter((i) => has(t.lesson.sections[i].title, q));
          patterns = patterns.filter((p) => has(p.name, q) || has(p.summary, q));
          questions = questions.filter((x) => has(x.title, q) || (x.tags || []).some((g) => has(g, q)));
          questionHits = questions.length > 0;
        }
        if (onlyViz && !patterns.length) continue;
        if (onlyUnsolved && tp.lessonCompleted && !questions.length) continue;
        if (q && !topicHit && !sections.length && !patterns.length && !questions.length) continue;
        list.push({ topic: t, sections, patterns, questions, questionHits });
      }
      if (list.length) out.set(st.id, list);
    }
    return out;
  }, [progress, q, onlyUnsolved, onlyViz]);

  // deep links: /contents#stage-<id>, /contents#practice-tools
  useEffect(() => {
    if (!hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    const raf = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  const jump = (stageId) => {
    setCollapsed((c) => ({ ...c, [stageId]: false }));
    nav(`/contents#stage-${stageId}`, { replace: true });
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setAll = (open) => setCollapsed(Object.fromEntries(stages.map((s) => [s.id, !open])));
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
    { to: '/path', icon: MapIcon, title: 'Learning Path', desc: 'The stages as a visual path with prerequisites and unlocks.' },
    { to: '/progress', icon: BarChart3, title: 'Progress', desc: 'Per-topic table, strong & weak areas, export / import and reset.' },
    { to: '/settings', icon: Settings, title: 'Settings', desc: 'Theme, accent colour, coach tips and the welcome tour.' },
  ];

  return (
    <div className="page contents-page stagger">
      <div className="contents-head">
        <div className="eyebrow">
          <ListTree size={14} aria-hidden="true" /> Contents
        </div>
        <h1>Everything in DSA Journey</h1>
        <div className="contents-totals">
          <span>
            <strong>{stages.length}</strong> stages
          </span>
          <span>
            <strong>{topics.length}</strong> topics
          </span>
          <span>
            <strong>{totals.steps}</strong> lesson steps
          </span>
          <span>
            <strong>{totals.checkpoints}</strong> checkpoints
          </span>
          <span>
            <strong>{allPatterns.length}</strong> patterns
          </span>
          <span>
            <strong>{totals.animations}</strong> animated
          </span>
          <span>
            <strong>{allQuestions.length}</strong> questions
          </span>
          <span>
            <strong>{toolkit.length}</strong> toolkit structures
          </span>
        </div>
      </div>

      <CoachTip id="page:contents" title="Find anything.">
        Search filters every stage, topic, lesson step, pattern and question below. Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>K</kbd> anywhere to jump straight to one.
      </CoachTip>

      <div className="contents-tools">
        <label className="contents-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Search topics, lesson steps, patterns, questions…" aria-label="Search the contents" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="row-wrap">
          <button type="button" className="chip" aria-pressed={onlyUnsolved} onClick={() => setOnlyUnsolved((v) => !v)}>
            Only unsolved
          </button>
          <button type="button" className="chip" aria-pressed={onlyViz} onClick={() => setOnlyViz((v) => !v)}>
            <PlayCircle size={14} aria-hidden="true" /> Only with visualisations
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAll(true)}>
            Expand all
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAll(false)}>
            Collapse all
          </button>
        </div>
        {filtering && (
          <p className="small muted" aria-live="polite">
            {shownTopics} matching topic{shownTopics === 1 ? '' : 's'}
          </p>
        )}
      </div>

      <nav className="phase-jump" aria-label="Jump to stage">
        {stages.map((st, i) => (
          <button key={st.id} type="button" className="chip" onClick={() => jump(st.id)} disabled={!views.has(st.id)}>
            {i + 1}. {st.title}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => document.getElementById('practice-tools')?.scrollIntoView({ behavior: 'smooth' })}>
          Practice &amp; tools
        </button>
      </nav>

      {stages.map((st, si) => {
        const list = views.get(st.id);
        if (!list) return null;
        const done = st.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
        const open = filtering || !collapsed[st.id];
        return (
          <section key={st.id} id={`stage-${st.id}`} className="contents-phase">
            <button type="button" className="contents-phase-head" aria-expanded={open} onClick={() => setCollapsed((c) => ({ ...c, [st.id]: open }))}>
              <span className="contents-phase-num">{si + 1}</span>
              <span className="contents-phase-title">
                <strong>
                  <Hl text={st.title} q={q} />
                </strong>
                <span className="muted small">{st.description}</span>
              </span>
              <span className="contents-phase-meter small muted">
                <ProgressRing value={(done / Math.max(1, st.topics.length)) * 100} size={34} stroke={4} tone="good" showValue={false} label={`${done} of ${st.topics.length} topics completed`} />
                {done}/{st.topics.length} done
              </span>
              <ChevronDown size={18} aria-hidden="true" className={`chev-icon ${open ? '' : 'closed'}`} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  className="contents-phase-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {list.map((v) => (
                    <TopicEntry key={v.topic.id} view={v} q={q} filtering={filtering} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
      {filtering && !views.size && <p className="muted">Nothing matches. Try another word or turn off the toggles.</p>}

      <section id="practice-tools" className="contents-phase">
        <div className="contents-phase-head static">
          <span className="contents-phase-num">+</span>
          <span className="contents-phase-title">
            <strong>Practice &amp; tools</strong>
            <span className="muted small">Every page outside the topic lessons.</span>
          </span>
        </div>
        <div className="tools-grid">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.to} to={t.to} className="tool-card">
                <Icon size={20} aria-hidden="true" className="tool-icon" />
                <span>
                  <strong>{t.title}</strong>
                  <span className="muted small"> {t.desc}</span>
                  {t.count && <span className="tool-count small">{t.count}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopicEntry({ view, q, filtering }) {
  const { progress } = useProgress();
  const { topic: t, sections, patterns, questions, questionHits } = view;
  const status = topicStatus(t, progress);
  const s = topicStats(t, progress);
  const tp = progress.topics[t.id] || {};
  const [showQs, setShowQs] = useState(false);
  const qsOpen = showQs || questionHits || (filtering && questions.length > 0 && questions.length < t.questions.length);
  const company = companyQuestionsForTopic(t.id).length;
  const chips = [
    ['visualize', t.patterns.filter(hasVisual).length],
    ['practice', t.questions.length],
    ['review', undefined],
    ['company', company],
    ['cheatsheet', undefined],
  ];
  return (
    <article className={`contents-topic st-${status}`}>
      <div className="contents-topic-head">
        <ProgressRing value={s.mastery} size={38} stroke={4} tone={status === 'completed' ? 'good' : 'accent'} label={`${t.title}: ${s.mastery}% mastery`} />
        <div className="contents-topic-title">
          <Link to={`/topic/${t.id}`}>
            <strong>
              <Hl text={t.title} q={q} />
            </strong>
          </Link>
          <span className="muted small">
            ~{t.estMinutes} min lesson · {t.difficulty} · {s.solved}/{s.total} solved
          </span>
        </div>
        <span className={`status-pill st-${status}`}>{STATUS_LABEL[status]}</span>
      </div>

      {sections.length > 0 && (
        <div className="contents-block">
          <div className="contents-block-label">Lesson</div>
          <ol className="contents-sections">
            {sections.map((i) => {
              const sec = t.lesson.sections[i];
              const read = tp.lessonCompleted || i < (tp.maxSectionIndex || 0);
              return (
                <li key={sec.id} className={read ? 'read' : ''}>
                  <Link to={`/topic/${t.id}?s=${i}`}>
                    <span className="contents-sec-num">{i + 1}</span>
                    <span className="contents-sec-title">
                      <Hl text={sec.title} q={q} />
                    </span>
                    {read && <Check size={14} className="contents-read" aria-label="done" />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="contents-block">
          <div className="contents-block-label">Patterns</div>
          <div className="contents-chips">
            {patterns.map((p) => (
              <Link key={p.id} to={hasVisual(p) ? `/topic/${t.id}?tab=visualize` : `/patterns#${p.id}`} className="chip chip-link" title={p.summary}>
                {hasVisual(p) && <PlayCircle size={13} className="contents-viz" aria-label="animated" />}
                <Hl text={shortPattern(p.name)} q={q} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="contents-block">
          <button type="button" className="contents-qtoggle" aria-expanded={qsOpen} onClick={() => setShowQs((v) => !v)}>
            <ChevronDown size={14} aria-hidden="true" className={`chev-icon ${qsOpen ? '' : 'closed'}`} />
            Questions{' '}
            <span className="muted small">
              {questions.length === t.questions.length ? `${s.solved}/${s.total} solved` : `${questions.length} shown of ${t.questions.length}`}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {qsOpen && (
              <motion.ol
                className="contents-questions"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {questions.map((x) => {
                  const done = progress.questions[x.id]?.status === 'solved';
                  return (
                    <li key={x.id} className={done ? 'read' : ''}>
                      <Link to={`/topic/${t.id}/q/${x.id}`}>
                        {done ? <Check size={14} className="contents-read" aria-label="solved" /> : <span className="contents-qdot" aria-hidden="true" />}
                        <span className="contents-sec-title">
                          <Hl text={x.title} q={q} />
                        </span>
                        <DifficultyBadge difficulty={x.difficulty} />
                      </Link>
                    </li>
                  );
                })}
              </motion.ol>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="contents-chips contents-tabs">
        {chips
          .filter(([, n]) => n !== 0)
          .map(([id, n]) => {
            const Icon = TAB_META[id].icon;
            return (
              <Link key={id} to={`/topic/${t.id}?tab=${id}`} className="chip chip-link">
                <Icon size={13} aria-hidden="true" /> {TAB_META[id].label}
                {n !== undefined && <span className="tab-count">{n}</span>}
              </Link>
            );
          })}
      </div>
    </article>
  );
}
