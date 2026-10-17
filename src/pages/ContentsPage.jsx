import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import CoachTip from '../components/guide/CoachTip.jsx';
import { DifficultyBadge } from '../components/ui/primitives.jsx';
import { hasVisual } from '../components/PatternVisual.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { mistakeQuestions, topicStats, topicStatus, STATUS_LABEL } from '../state/selectors.js';
import { allPatterns, allQuestions, companies, companyQuestions, companyQuestionsForTopic, getCheckpoints, jsSections, stages, toolkit, topics } from '../content/index.js';
import useReveal from '../lib/useReveal.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const MARK = { locked: '·', available: '○', 'in-progress': '◐', completed: '✓' };
const pad = (n) => String(n).padStart(2, '0');

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
  const ref = useRef(null);
  useReveal(ref);
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
    { to: '/questions', title: 'Questions', desc: 'Every practice question, filterable by topic, difficulty, status and company.', count: `${solved}/${allQuestions.length} solved` },
    { to: '/patterns', title: 'Patterns', desc: 'Each pattern with its recognition clues, template, variations and questions.', count: `${allPatterns.length} patterns` },
    { to: '/finder', title: 'Pattern Finder', desc: 'Answer a few questions about a new problem and it names the pattern.' },
    { to: '/visualize', title: 'Visualizer', desc: 'Step-through animations that stop to ask what happens next.', count: `${totals.animations} animated` },
    { to: '/playground', title: 'Playground', desc: 'Run any JavaScript, with the toolkit classes loaded as globals.' },
    { to: '/revision', title: 'Revision', desc: 'Weak spots, questions to retry and the review of every finished lesson.', count: retry ? `${retry} to retry` : 'nothing to retry' },
    { to: '/cheatsheet', title: 'Cheat Sheet', desc: 'Every topic’s pattern, template and complexity on one printable page.' },
    { to: '/companies', title: 'Companies', desc: 'Questions linked to companies, each with a source and an evidence level.', count: `${companies.length} companies · ${companyQuestions.length} entries` },
    { to: '/toolkit', title: 'JS DSA Toolkit', desc: 'Readable Stack, Queue, Deque, Heap, Trie, Union-Find, Segment tree… implementations.', count: `${toolkit.length} structures` },
    { to: '/js', title: 'JavaScript for DSA', desc: 'The built-ins you need, what they cost, and the gotchas.', count: `${jsSections.length} sections` },
    { to: '/path', title: 'Learning Path', desc: 'The syllabus: parts, prerequisites and what each topic opens up.' },
    { to: '/progress', title: 'Progress', desc: 'Per-topic table, strong and weak areas, export, import and reset.' },
    { to: '/settings', title: 'Settings', desc: 'Theme, accent ink, coach tips and the welcome tour.' },
  ];
  const totalsLine = [
    [stages.length, 'parts'],
    [topics.length, 'topics'],
    [totals.steps, 'lesson steps'],
    [totals.checkpoints, 'checkpoints'],
    [allPatterns.length, 'patterns'],
    [totals.animations, 'animated'],
    [allQuestions.length, 'questions'],
    [toolkit.length, 'toolkit structures'],
  ];

  return (
    <div ref={ref} className="page toc-page ink-in">
      <header className="toc-head">
        <p className="eyebrow">Contents</p>
        <h1>Everything in the course</h1>
        <p className="toc-totals">
          {totalsLine.map(([n, label]) => (
            <span key={label}>
              <strong>{n}</strong> {label}
            </span>
          ))}
        </p>
      </header>

      <CoachTip id="page:contents" title="Find anything.">
        The search below filters every part, topic, lesson step, pattern and question. Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>K</kbd> anywhere to jump straight to one.
      </CoachTip>

      <div className="toc-tools">
        <label className="toc-search">
          <span className="eyebrow">Search</span>
          <input type="search" placeholder="A topic, lesson step, pattern or question…" aria-label="Search the contents" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="toc-toggles">
          <button type="button" className="chip" aria-pressed={onlyUnsolved} onClick={() => setOnlyUnsolved((v) => !v)}>
            Only unsolved
          </button>
          <button type="button" className="chip" aria-pressed={onlyViz} onClick={() => setOnlyViz((v) => !v)}>
            Only with animations
          </button>
          <span className="toc-toggles-gap" />
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAll(true)}>
            Open all
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAll(false)}>
            Close all
          </button>
        </div>
        {filtering && (
          <p className="toc-count folio" aria-live="polite">
            {shownTopics} matching topic{shownTopics === 1 ? '' : 's'}
          </p>
        )}
      </div>

      <nav className="toc-jump" aria-label="Jump to part">
        {stages.map((st, i) => (
          <button key={st.id} type="button" onClick={() => jump(st.id)} disabled={!views.has(st.id)}>
            <span className="folio">{ROMAN[i]}</span> {st.title}
          </button>
        ))}
        <button type="button" onClick={() => document.getElementById('practice-tools')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="folio">+</span> Practice &amp; tools
        </button>
      </nav>

      {stages.map((st, si) => {
        const list = views.get(st.id);
        if (!list) return null;
        const done = st.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
        const open = filtering || !collapsed[st.id];
        return (
          <section key={st.id} id={`stage-${st.id}`} className="toc-part" data-reveal={si > 1 ? '' : undefined}>
            <button type="button" className="toc-part-head" aria-expanded={open} onClick={() => setCollapsed((c) => ({ ...c, [st.id]: open }))}>
              <span className="toc-part-num">Part {ROMAN[si]}</span>
              <span className="toc-part-title">
                <Hl text={st.title} q={q} />
              </span>
              <span className="toc-part-desc">{st.description}</span>
              <span className="toc-part-meta folio">
                {done}/{st.topics.length} complete
              </span>
              <span className="toc-part-toggle" aria-hidden="true">
                {open ? '−' : '+'}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  className="toc-part-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <ol className="toc-chapters">
                    {list.map((v) => (
                      <TopicEntry key={v.topic.id} view={v} q={q} filtering={filtering} />
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
      {filtering && !views.size && <p className="toc-none">Nothing matches that. Try a shorter word, or switch the filters off.</p>}

      <section id="practice-tools" className="toc-part">
        <div className="toc-part-head static">
          <span className="toc-part-num">Appendix</span>
          <span className="toc-part-title">Practice &amp; tools</span>
          <span className="toc-part-desc">Every page outside the topic lessons.</span>
        </div>
        <ol className="toc-appendix">
          {tools.map((t) => (
            <li key={t.to}>
              <Link to={t.to} className="toc-line">
                <span className="toc-line-title">{t.title}</span>
                <span className="leader" aria-hidden="true" />
                <span className="folio">{t.count || '→'}</span>
              </Link>
              <p className="toc-line-desc">{t.desc}</p>
            </li>
          ))}
        </ol>
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
  const chap = pad(t.index + 1);
  const chips = [
    ['visualize', t.patterns.filter(hasVisual).length],
    ['practice', t.questions.length],
    ['review', undefined],
    ['company', company],
    ['cheatsheet', undefined],
  ];
  return (
    <li className={`toc-chapter st-${status}`}>
      <Link to={`/topic/${t.id}`} className="toc-line toc-chapter-line">
        <span className="toc-chap-num">{chap}</span>
        <span className="toc-chap-title">
          <Hl text={t.title} q={q} />
        </span>
        <span className="leader" aria-hidden="true" />
        <span className={`mk st-${status}`} aria-hidden="true">
          {MARK[status]}
        </span>
        <span className="sr-only">{STATUS_LABEL[status]},</span>
        <span className="toc-chap-pct folio">{s.mastery}%</span>
        <span className="sr-only">mastery</span>
      </Link>
      <p className="toc-chap-meta">
        ~{t.estMinutes} min lesson · {t.difficulty} · {s.solved}/{s.total} solved · {STATUS_LABEL[status].toLowerCase()}
      </p>

      {sections.length > 0 && (
        <ol className="toc-sections" aria-label={`${t.title}: lesson steps`}>
          {sections.map((i) => {
            const sec = t.lesson.sections[i];
            const read = tp.lessonCompleted || i < (tp.maxSectionIndex || 0);
            return (
              <li key={sec.id} className={read ? 'read' : ''}>
                <Link to={`/topic/${t.id}?s=${i}`} className="toc-line">
                  <span className="toc-sec-num">
                    {t.index + 1}.{i + 1}
                  </span>
                  <span className="toc-sec-title">
                    <Hl text={sec.title} q={q} />
                  </span>
                  <span className="leader" aria-hidden="true" />
                  {read ? (
                    <span className="mk st-completed" aria-label="done">
                      ✓
                    </span>
                  ) : (
                    <span className="mk" aria-hidden="true">
                      ○
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {patterns.length > 0 && (
        <p className="toc-patterns">
          <span className="eyebrow">Patterns</span>{' '}
          {patterns.map((p, i) => (
            <span key={p.id}>
              {i > 0 && <span className="toc-sep"> · </span>}
              <Link to={hasVisual(p) ? `/topic/${t.id}?tab=visualize` : `/patterns#${p.id}`} title={p.summary}>
                <Hl text={shortPattern(p.name)} q={q} />
              </Link>
              {hasVisual(p) && (
                <span className="toc-anim" title="Has a step-through animation">
                  <span aria-hidden="true"> ▸</span>
                  <span className="sr-only"> (animated)</span>
                </span>
              )}
            </span>
          ))}
        </p>
      )}

      {questions.length > 0 && (
        <div className="toc-qs">
          <button type="button" className="toc-qtoggle" aria-expanded={qsOpen} onClick={() => setShowQs((v) => !v)}>
            <span className="toc-qsign" aria-hidden="true">
              {qsOpen ? '−' : '+'}
            </span>
            Questions{' '}
            <span className="folio">
              {questions.length === t.questions.length ? `${s.solved}/${s.total} solved` : `${questions.length} shown of ${t.questions.length}`}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {qsOpen && (
              <motion.ol
                className="toc-questions"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {questions.map((x) => {
                  const done = progress.questions[x.id]?.status === 'solved';
                  return (
                    <li key={x.id} className={done ? 'read' : ''}>
                      <Link to={`/topic/${t.id}/q/${x.id}`} className="toc-line">
                        {done ? (
                          <span className="mk st-completed" aria-label="solved">
                            ✓
                          </span>
                        ) : (
                          <span className="mk" aria-hidden="true">
                            ○
                          </span>
                        )}
                        <span className="toc-sec-title">
                          <Hl text={x.title} q={q} />
                        </span>
                        <span className="leader" aria-hidden="true" />
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

      <p className="toc-tabs">
        {chips
          .filter(([, n]) => n !== 0)
          .map(([id, n], i) => (
            <span key={id}>
              {i > 0 && <span className="toc-sep" aria-hidden="true"> · </span>}
              <Link to={`/topic/${t.id}?tab=${id}`}>
                {TAB_META[id].label}
                {n !== undefined && <span className="folio"> {n}</span>}
              </Link>
            </span>
          ))}
      </p>
    </li>
  );
}
