import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LessonPlayer from '../components/lesson/LessonPlayer.jsx';
import Icon from '../components/ui/Icon.jsx';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import EvidenceBadge from '../components/EvidenceBadge.jsx';
import { BigO, JsToolsTable } from '../components/lesson/Block.jsx';
import { Callout, EmptyState } from '../components/ui/primitives.jsx';
import StudyPath from '../components/guide/StudyPath.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import NextUp from '../components/guide/NextUp.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { missedCheckpoints, mistakeQuestions, topicStats, topicStatus, prerequisitesMet } from '../state/selectors.js';
import { topicById, topics, stages, companyQuestionsForTopic, companiesForQuestion, companyById, EVIDENCE_LEVELS, patternById, getCheckpoints } from '../content/index.js';
import { markTabVisited } from '../lib/uiPrefs.js';
import NotFound from './NotFound.jsx';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';
import TopicTricks from '../components/TopicTricks.jsx';
import { visualForPattern } from '../visualizations/patternVisuals.js';

const pad2 = (n) => String(n).padStart(2, '0');
const DIFFS = ['Easy', 'Medium', 'Hard'];
const DIFF_KEY = { Easy: 'easy', Medium: 'med', Hard: 'hard' };
const shortPattern = (name = '') => name.replace(/^.*?—\s*/, '');
const MONO = { microsoft: 'Ms', netflix: 'Nf', bloomberg: 'Bb', linkedin: 'Li', 'goldman-sachs': 'GS' };
/** Two-letter text monogram for a company (never a logo). */
export function monogram(id) {
  if (MONO[id]) return MONO[id];
  const name = companyById[id]?.name || id;
  const words = name.split(/[\s-]+/).filter(Boolean);
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).replace(/^./, (c) => c.toUpperCase());
}

/** Difficulty chip with the voxel pips (base.css .chip--easy/--med/--hard). */
export function DiffChip({ difficulty, children }) {
  if (!difficulty) return null;
  return (
    <span className={`chip chip--${DIFF_KEY[difficulty]}`}>
      <span className="diff-pips" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {children ?? difficulty}
    </span>
  );
}

/* ---------- Visualize tab: every distinct animation, framed (internals belong to the Visualizer) ---------- */
function VisualizeTab({ topic }) {
  const withVisual = topic.patterns.filter(hasVisual);
  // Show each distinct animation once, listing every pattern it illustrates.
  const groups = [];
  for (const p of withVisual) {
    const v = visualForPattern(p);
    const key = `${v.scenario}:${JSON.stringify(v.input || {})}`;
    const g = groups.find((x) => x.key === key);
    if (g) g.patterns.push(p);
    else groups.push({ key, patterns: [p] });
  }
  const [open, setOpen] = useState(() => new Set(groups.length ? [groups[0].key] : []));
  if (!groups.length)
    return (
      <EmptyState icon="play" title="No animations for this topic">
        Its ideas are rules and analysis rather than step-by-step processes — the lesson covers them with worked examples.
      </EmptyState>
    );
  const toggle = (k) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  return (
    <div className="tp-viz">
      <Callout variant="tip" title="Predict, then watch">
        <span className="small">Animations pause at key steps and ask what happens next. Answer before revealing — it's the fastest way to check you really understand the pattern. Use “Try your own input” to test edge cases.</span>
      </Callout>
      {groups.map((g, gi) => {
        const primary = g.patterns.find((p) => !visualForPattern(p).related) || g.patterns[0];
        const isOpen = open.has(g.key);
        return (
          <section key={g.key} className={`tile tp-viz-item ${isOpen ? 'is-open' : ''}`}>
            <button type="button" className="tp-viz-head" onClick={() => toggle(g.key)} aria-expanded={isOpen}>
              <span className="tp-viz-n">{pad2(gi + 1)}</span>
              <span className="tp-viz-t">
                <b>{g.patterns.map((p) => shortPattern(p.name)).join(' · ')}</b>
                <span>{primary.summary}</span>
              </span>
              <span className="tag">▶ animated</span>
              <Icon name="chevronRight" size={16} className="tp-chev" />
            </button>
            {isOpen && (
              <div className="tp-viz-frame">
                <PatternVisual pattern={primary} />
              </div>
            )}
          </section>
        );
      })}
      {topic.patterns.length > withVisual.length && (
        <p className="tp-faint">
          Not animated:{' '}
          {topic.patterns
            .filter((p) => !hasVisual(p))
            .map((p) => shortPattern(p.name))
            .join(', ')}{' '}
          — these are covered with examples in the lesson.
        </p>
      )}
    </div>
  );
}

function LearnTab({ topic, onFinish, initialSection, onSectionApplied }) {
  const { data, loading, error } = useTopicContent(topic.id);
  if (loading) return <div className="tile tp-loading loading-shimmer">Loading lesson…</div>;
  if (error) return <div className="callout callout-danger small">Could not load this lesson: {String(error.message || error)}</div>;
  return <LessonPlayer topic={{ ...topic, lesson: data?.lesson || topic.lesson }} onFinish={onFinish} initialSection={initialSection} onSectionApplied={onSectionApplied} />;
}

/** Topic progress rows (lesson, checks, Easy/Medium/Hard) — mono meters. */
export function MasteryBox({ topic, progress }) {
  const s = topicStats(topic, progress);
  const n = topic.lesson.sections.length;
  const reached = s.lessonCompleted ? n : Math.min(n, (progress.topics[topic.id]?.maxSectionIndex || 0) + (s.sectionIndex > 0 || s.checkpointsAnswered ? 1 : 0));
  const rows = [
    { k: 'lesson', cls: 'meter--uv', a: reached, b: n, label: s.lessonCompleted ? '✓' : null },
    { k: 'checks', cls: 'meter--uv', a: s.checkpointsPassed, b: s.checkpointsTotal },
    ...DIFFS.map((d) => ({ k: d.toLowerCase(), t: `t-${DIFF_KEY[d]}`, cls: 'meter--c', c: `var(--${DIFF_KEY[d]})`, a: s.byDiff[d].solved, b: s.byDiff[d].total })),
  ];
  return (
    <div className="tp-mbox">
      {rows.map((r) => (
        <div key={r.k} className="tp-prow">
          <span className={r.t}>{r.k}</span>
          <span className={`meter ${r.cls}`} style={{ '--c': r.c }}>
            <i style={{ '--v': `${r.b ? (r.a / r.b) * 100 : 0}%` }} />
          </span>
          <b>{r.label || `${r.a}/${r.b}`}</b>
        </div>
      ))}
    </div>
  );
}

/** Question rows (status diamond, title, pattern, companies, difficulty, source). Also used by the Revision page. */
export function QuestionList({ questions, progress, topicId, showTopic = false, nextId }) {
  return (
    <ol className="qlist">
      {questions.map((q, i) => {
        const st = progress.questions[q.id];
        const status = st?.status;
        const companies = [...new Set(companiesForQuestion(q.id).map((c) => c.company))];
        const lc = q.source?.number ? `${q.source.platform === 'LeetCode' ? 'LC' : q.source.platform || ''} ${q.source.number}` : '';
        const sub = [status === 'solved' ? 'solved' : status === 'attempted' ? `attempted${st.failedSubmissions ? ` · ${st.failedSubmissions} failed` : ''}` : 'to do', showTopic && topicById[q.topicId]?.title, q.kind === 'design' && 'design', q.kind === 'quiz' && 'quiz'].filter(Boolean).join(' · ');
        return (
          <li key={q.id} className={`qlist-row ${q.id === nextId ? 'qlist-row--next' : ''}`}>
            <span className="qlist-n">{pad2(i + 1)}</span>
            <i className={`qlist-d qlist-d--${status === 'solved' ? 's' : status === 'attempted' ? 'a' : 't'}`} aria-hidden="true" />
            <span className="qlist-t">
              <Link to={`/topic/${topicId || q.topicId}/q/${q.id}`}>{q.title}</Link>
              <small className={status === 'attempted' ? 'qlist-att' : ''}>{sub}</small>
            </span>
            <span className="qlist-pt">
              <i aria-hidden="true" />
              {shortPattern(patternById[q.pattern]?.name) || '—'}
            </span>
            <span className="qlist-cos" title={companies.map((c) => companyById[c]?.name || c).join(', ')}>
              {companies.length ? (
                <>
                  {companies.slice(0, 2).map((c) => (
                    <span key={c} className="mono-badge">
                      {monogram(c)}
                    </span>
                  ))}
                  <em>{companies.length}</em>
                </>
              ) : (
                <em>—</em>
              )}
            </span>
            <DiffChip difficulty={q.difficulty} />
            <span className="qlist-lc">{lc}</span>
          </li>
        );
      })}
    </ol>
  );
}

const HOW_TO = ['Read the problem and constraints.', 'Name the pattern before any hint.', 'Write the brute force in words.', 'Optimise, then code it.', 'Run, then submit against hidden tests.', 'Only then read the solution & alternatives.'];

function PracticeTab({ topic, progress }) {
  const [pattern, setPattern] = useState('all');
  const qs = pattern === 'all' ? topic.questions : topic.questions.filter((q) => q.pattern === pattern);
  if (!topic.questions.length)
    return (
      <EmptyState icon="list" title="Questions are on their way">
        This topic's practice set is still being written.
      </EmptyState>
    );
  const s = topicStats(topic, progress);
  const next = qs.find((q) => progress.questions[q.id]?.status === 'attempted') || qs.find((q) => progress.questions[q.id]?.status !== 'solved');
  return (
    <div className="tp-prac">
      <section className="tile tp-prac-main" aria-labelledby="tp-prac-t">
        <div className="tp-prac-head">
          <div>
            <span className="eyebrow">
              <i className="pip" />
              Practice · question bank
            </span>
            <h2 id="tp-prac-t" className="h1">
              {topic.questions.length} problems · {s.solved} solved
            </h2>
          </div>
          <div className="tp-dsum">
            {DIFFS.map((d) =>
              s.byDiff[d].total ? (
                <DiffChip key={d} difficulty={d}>
                  {s.byDiff[d].solved} / {s.byDiff[d].total}
                </DiffChip>
              ) : null,
            )}
          </div>
        </div>
        {topic.patterns.length > 1 && (
          <div className="tp-pfilter" role="group" aria-label="Filter by pattern">
            <button type="button" className="chip" aria-pressed={pattern === 'all'} onClick={() => setPattern('all')}>
              All <span className="tp-n">{topic.questions.length}</span>
            </button>
            {topic.patterns.map((p) => {
              const n = topic.questions.filter((q) => q.pattern === p.id).length;
              if (!n) return null;
              return (
                <button key={p.id} type="button" className="chip" aria-pressed={pattern === p.id} onClick={() => setPattern(p.id)}>
                  {shortPattern(p.name)} <span className="tp-n">{n}</span>
                </button>
              );
            })}
          </div>
        )}
        <QuestionList questions={qs} progress={progress} topicId={topic.id} nextId={next?.id} />
      </section>
      <aside className="tp-prac-side">
        <section className="tile tp-side">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">
              <i className="pip pip--uv" />
              Topic progress
            </span>
            <span className="tag">{s.mastery}% mastery</span>
          </div>
          <MasteryBox topic={topic} progress={progress} />
        </section>
        <section className="tile tp-side">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">How to practise · a stack</span>
          </div>
          <ol className="tp-howto">
            {HOW_TO.map((x, i) => (
              <li key={x}>
                <span>{pad2(i + 1)}</span>
                {x}
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}

export function CompanyTab({ topic }) {
  const entries = companyQuestionsForTopic(topic.id);
  const byCompany = useMemo(() => {
    const m = new Map();
    for (const e of entries) {
      if (!m.has(e.company)) m.set(e.company, []);
      m.get(e.company).push(e);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [entries]);
  return (
    <div className="tp-co">
      <Callout variant="insight" title="How company attributions work">
        <div className="small">
          Attributions come only from linked sources. <strong>{EVIDENCE_LEVELS.verified.label}</strong>: {EVIDENCE_LEVELS.verified.description} <strong>{EVIDENCE_LEVELS.community.label}</strong>: {EVIDENCE_LEVELS.community.description} <strong>{EVIDENCE_LEVELS.associated.label}</strong>: {EVIDENCE_LEVELS.associated.description}
        </div>
      </Callout>
      {byCompany.length === 0 && (
        <EmptyState icon="building" title="No sourced company questions for this topic yet">
          We only list company questions with a verifiable source.
        </EmptyState>
      )}
      {byCompany.map(([cid, list]) => (
        <section key={cid} className="tile tp-co-item">
          <div className="tp-co-head">
            <span className="mono-badge" aria-hidden="true">
              {monogram(cid)}
            </span>
            <h3>
              <Link to={`/companies/${cid}`}>{companyById[cid]?.name || cid}</Link>
            </h3>
            <span className="tag">
              {list.length} question{list.length === 1 ? '' : 's'}
            </span>
          </div>
          <CompanyEntryTable entries={list} />
        </section>
      ))}
    </div>
  );
}

export function CompanyEntryTable({ entries, showCompany = false }) {
  const { progress } = useProgress();
  return (
    <div className="table-wrap cet">
      <table>
        <thead>
          <tr>
            <th>
              <span className="sr-only">Status</span>
            </th>
            {showCompany && <th>Company</th>}
            <th>Question</th>
            <th>Pattern</th>
            <th>Difficulty</th>
            <th>Evidence</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const st = progress.questions[e.questionId]?.status;
            return (
              <tr key={i}>
                <td>
                  <i className={`qlist-d qlist-d--${st === 'solved' ? 's' : st === 'attempted' ? 'a' : 't'}`} title={st || 'to do'} />
                </td>
                {showCompany && <td className="small">{companyById[e.company]?.name}</td>}
                <td className="cet-q">
                  {e.question ? (
                    <Link to={`/topic/${e.question.topicId}/q/${e.question.id}`}>{e.title}</Link>
                  ) : e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer">
                      {e.title} <Icon name="external" size={11} />
                    </a>
                  ) : (
                    e.title
                  )}
                  {e.note && <div className="small faint">{e.note}</div>}
                </td>
                <td className="cet-p">{shortPattern(e.pattern || '') || topicById[e.topicId]?.title || '—'}</td>
                <td>
                  <DiffChip difficulty={e.difficulty} />
                </td>
                <td>
                  <EvidenceBadge evidence={e.evidence} />
                </td>
                <td className="cet-src">
                  {e.sourceList.map((s) =>
                    s.url ? (
                      <a key={s.key} href={s.url} target="_blank" rel="noreferrer" title={s.description}>
                        {s.label} <Icon name="external" size={10} />
                      </a>
                    ) : (
                      <span key={s.key}>{s.label}</span>
                    ),
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Cheatsheet({ topic }) {
  const c = topic.cheatsheet;
  if (!c) return <EmptyState icon="file" title="Cheatsheet coming soon" />;
  return (
    <section className="tile tp-cheat" aria-labelledby="tp-cheat-t">
      <div className="tp-cheat-head">
        <div>
          <span className="eyebrow">
            <i className="pip" />
            Cheatsheet · one card
          </span>
          <h2 id="tp-cheat-t" className="h2">
            {topic.patterns.map((p) => shortPattern(p.name)).join(' · ') || topic.title}
          </h2>
        </div>
        {c.complexity && (
          <div className="tp-cheat-cx">
            <span className="tp-k">complexity</span>
            <BigO value={c.complexity} />
          </div>
        )}
      </div>
      <div className="tp-cheat-grid">
        <div className="tp-cheat-cell">
          <span className="tp-k">when to use</span>
          <ul>
            {c.whenToUse?.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="tp-cheat-cell">
          <span className="tp-k">recognition clues</span>
          <div className="tp-clues">
            {c.clues?.map((x) => (
              <span key={x} className="tag">
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="tp-cheat-cell tp-cheat-wide">
          <span className="tp-k">template</span>
          <CodeBlock code={c.template} />
        </div>
        <div className="tp-cheat-cell">
          <span className="tp-k tp-k--bad">common mistakes</span>
          <ol className="tp-bugs">
            {c.mistakes?.map((x, i) => (
              <li key={x}>
                <span className="tp-bug">{pad2(i + 1)}</span>
                {x}
              </li>
            ))}
          </ol>
        </div>
        <div className="tp-cheat-cell">
          <span className="tp-k">JS tools</span>
          <div className="tp-clues">
            {c.jsTools?.map((x) => (
              <code key={x}>{x}</code>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewTab({ topic: meta, progress, onRelearn }) {
  const { dispatch } = useProgress();
  const { data, loading } = useTopicContent(meta.id);
  if (loading) return <div className="tile tp-loading loading-shimmer">Loading review…</div>;
  const topic = data ? { ...meta, lesson: data.lesson, patterns: data.patterns.map((p) => ({ ...p, topicId: meta.id })) } : meta;
  const mistakes = mistakeQuestions(progress, topic.id);
  const missed = missedCheckpoints(progress, topic);
  return (
    <div className="tp-rev">
      <div className="tp-rev-grid">
        <section className="tile tp-rev-item">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">
              <i className="pip pip--volt" />
              Checkpoints you missed
            </span>
            <span className="tag">{missed.length}</span>
          </div>
          {missed.length > 0 && (
            <div className="tp-rev-act">
              <button
                type="button"
                className="btn btn--plasma btn--sm"
                onClick={() => {
                  dispatch({ type: 'LESSON_RESET', topicId: meta.id, checkpointIds: missed.map((c) => c.id) });
                  onRelearn?.();
                }}
              >
                <Icon name="rotate" size={14} /> Re-answer these {missed.length} checkpoint{missed.length === 1 ? '' : 's'}
              </button>
              <span className="tp-faint">Clears just these answers; your new first try is what counts.</span>
            </div>
          )}
          {missed.length === 0 ? (
            <p className="tp-faint">{getCheckpoints(topic).some((c) => progress.checkpoints[c.id]) ? 'None — every checkpoint answered correctly on the first try.' : 'Answer the lesson checkpoints first.'}</p>
          ) : (
            missed.map((c) => (
              <details key={c.id} className="details tp-det">
                <summary>
                  <Markdown className="inline-md">{c.question}</Markdown>
                </summary>
                <div className="small">
                  <strong>Answer:</strong> {c.options[c.answer]}
                </div>
                <Markdown className="small">{c.explanation}</Markdown>
                {c.deeper && <Markdown className="small muted">{c.deeper}</Markdown>}
              </details>
            ))
          )}
        </section>
        <section className="tile tp-rev-item">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">
              <i className="pip pip--ice" />
              Questions to retry
            </span>
            <span className="tag">{mistakes.length}</span>
          </div>
          {mistakes.length === 0 ? <p className="tp-faint">Questions with failed submissions, wrong pattern guesses, or where you viewed the solution first will be listed here.</p> : <QuestionList questions={mistakes} progress={progress} topicId={topic.id} />}
        </section>
      </div>

      <div className="tp-rev-grid">
        <section className="tile tp-rev-item">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">Key concepts</span>
            <span className="tag">{topic.keyConcepts.length}</span>
          </div>
          <ol className="tp-concepts">
            {topic.keyConcepts.map((k, i) => (
              <li key={k}>
                <span>{pad2(i + 1)}</span>
                <Markdown className="inline-md">{k}</Markdown>
              </li>
            ))}
          </ol>
        </section>
        <section className="tile tp-rev-item">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">Pattern recognition clues</span>
          </div>
          {topic.patterns.map((p) => (
            <div key={p.id} className="tp-clue-row">
              <b>{shortPattern(p.name)}</b>
              <div className="tp-clues">
                {(p.clues || []).map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="tile tp-rev-item">
        <div className="tile-head tp-side-head">
          <span className="eyebrow">Templates</span>
          {topic.cheatsheet?.complexity && <BigO value={topic.cheatsheet.complexity} />}
        </div>
        {topic.patterns.map((p) => (
          <details key={p.id} className="details tp-det">
            <summary>
              {p.name} <span className="small muted">— {p.summary}</span>
            </summary>
            {p.template && <CodeBlock code={p.template} />}
            {p.mistakes?.length > 0 && (
              <>
                <div className="tp-k tp-k--bad">common mistakes</div>
                <ul className="small">
                  {p.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </details>
        ))}
      </section>

      {topic.jsTools.length > 0 && (
        <section className="tile tp-rev-item">
          <div className="tile-head tp-side-head">
            <span className="eyebrow">JavaScript APIs used</span>
          </div>
          <JsToolsTable items={topic.jsTools} />
        </section>
      )}
    </div>
  );
}

const TIPS = {
  learn: ['The lesson waits for you.', 'Steps can end with a checkpoint question; the lesson continues once you answer, and a wrong answer explains the misconception. Your place is saved.'],
  visualize: ['Step through it.', 'Focus an animation and use ← → to step; it pauses to ask what happens next. “Try your own input” tests edge cases.'],
  company: ['Every attribution has a source.', 'Check the evidence level: verified, community-reported or commonly associated.'],
  cheatsheet: ['One card per topic.', 'Skim it before interviews; the global Cheat Sheet prints every topic on one page.'],
  review: ['Redo, don’t re-read.', 'Re-answer the checkpoints you missed and retry the listed questions without opening the solution; that is what lifts a weak area.'],
};

export default function TopicPage() {
  const { topicId } = useParams();
  const [params, setParams] = useSearchParams();
  const { progress, dispatch } = useProgress();
  const topic = topicById[topicId];
  const tab = params.get('tab') || 'learn';
  const sParam = params.get('s');
  const initialSection = sParam !== null && /^\d+$/.test(sParam) ? Number(sParam) : undefined;
  const setTab = (t) => setParams(t === 'learn' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, [topicId]);
  useEffect(() => {
    if (topicById[topicId]) markTabVisited(topicId, tab);
  }, [topicId, tab]);

  if (!topic) return <NotFound />;
  const status = topicStatus(topic, progress);
  const s = topicStats(topic, progress);
  const tState = progress.topics[topic.id] || {};
  const visualCount = topic.patterns.filter(hasVisual).length;
  const prevTopic = topics[topic.index - 1];
  const nextTopic = topics[topic.index + 1];
  const toNextTopic = nextTopic
    ? { lead: status === 'completed' ? 'Topic complete.' : 'Ready to move on?', label: `Next topic: ${nextTopic.title}`, to: `/topic/${nextTopic.id}` }
    : { lead: 'That was the last topic.', label: 'Revise what you learned', to: '/revision' };
  const stageIdx = stages.findIndex((x) => x.id === topic.stageId);
  const nSec = topic.lesson.sections.length;
  const secIdx = Math.min(tState.sectionIndex || 0, Math.max(0, nSec - 1));
  const curSection = topic.lesson.sections[secIdx];
  const locked = status === 'locked' && !tState.unlockedManually;
  const statusWord = { completed: 'completed', 'in-progress': 'in progress', available: 'unlocked', locked: 'locked' }[status];
  const crumbTail = tab === 'learn' ? (s.lessonCompleted ? 'lesson ✓' : curSection ? `§${secIdx + 1} ${curSection.title.toLowerCase()}` : 'lesson') : tab;
  const vox = topic.questions.map((q) => {
    const st = progress.questions[q.id]?.status;
    return { id: q.id, st, h: st === 'solved' ? (q.difficulty === 'Hard' ? 3.8 : q.difficulty === 'Medium' ? 3.2 : 2.6) : st === 'attempted' ? 1.8 : 0.4 };
  });
  const left = topic.lesson.sections.length && !s.lessonCompleted ? Math.round((topic.estMinutes || 0) * (1 - Math.min(1, (tState.maxSectionIndex || 0) / nSec))) : 0;
  const halfNeed = Math.ceil(s.total * 0.5);

  return (
    <div className="page tp">
      {/* ---------- crumbs ---------- */}
      <nav className="tp-crumbs rise" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/path">path</Link>
          </li>
          <li>
            <Link to={`/path#stage-${topic.stageId}`}>
              S{pad2(stageIdx + 1)} · {topic.stageTitle.toLowerCase()}
            </Link>
          </li>
          <li>
            <Link to={`/topic/${topic.id}`}>
              {pad2(topic.index + 1)} · {topic.id}
            </Link>
          </li>
          <li aria-current="page">{crumbTail}</li>
        </ol>
        <div className="tp-crumbs-nav">
          {prevTopic && (
            <Link className="btn btn--ghost btn--sm" to={`/topic/${prevTopic.id}`} title={prevTopic.title}>
              <Icon name="chevronLeft" size={14} /> <span className="mono">{pad2(prevTopic.index + 1)}</span> <span className="tp-crumbs-t">{prevTopic.title}</span>
            </Link>
          )}
          {nextTopic && (
            <Link className="btn btn--ghost btn--sm" to={`/topic/${nextTopic.id}`} title={nextTopic.title}>
              <span className="mono">{pad2(nextTopic.index + 1)}</span> <span className="tp-crumbs-t">{nextTopic.title}</span> <Icon name="chevronRight" size={14} />
            </Link>
          )}
        </div>
      </nav>

      {/* ---------- hero ---------- */}
      <section className="tile tile--glow tp-hero rise" style={{ '--i': 1 }} aria-labelledby="tp-title">
        <div className="tp-hero-main">
          <div className="tp-tags">
            <Link to={`/path#stage-${topic.stageId}`} className="chip chip--uv">
              <i className="pip pip--uv" />
              Stage {pad2(stageIdx + 1)} · {topic.stageTitle}
            </Link>
            <DiffChip difficulty={topic.difficulty} />
            <span className="tag">~{topic.estMinutes} min lesson</span>
            <span className="tag">
              {topic.patterns.length} pattern{topic.patterns.length === 1 ? '' : 's'}
              {visualCount ? ' · ▶ animated' : ''}
            </span>
          </div>
          <h1 id="tp-title" className={`display chrome tp-title ${topic.title.length > 22 ? 'tp-title--long' : ''}`}>
            {topic.title}
            <span className="tp-dot">.</span>
          </h1>
          <p className="lead tp-lead">{topic.summary}</p>
          <div className="tp-coords" aria-label="Where you are">
            <div>
              <span className="eyebrow">stage</span>
              <b>
                {pad2(stageIdx + 1)}
                <em> / {pad2(stages.length)}</em>
              </b>
            </div>
            <div>
              <span className="eyebrow">topic</span>
              <b>
                {pad2(topic.index + 1)}
                <em> / {topics.length}</em>
              </b>
            </div>
            <div>
              <span className="eyebrow">lesson</span>
              <b className={status === 'in-progress' ? 't-uv' : ''}>
                {s.lessonCompleted ? '✓' : `§${secIdx + 1}`}
                <em> / {nSec}</em>
              </b>
            </div>
            <div>
              <span className="eyebrow">checks</span>
              <b>
                {s.checkpointsPassed}
                <em> / {s.checkpointsTotal}</em>
              </b>
            </div>
            <div>
              <span className="eyebrow">needs</span>
              <b className="tp-needs">
                {topic.prerequisites.length
                  ? topic.prerequisites.map((p) => (
                      <Link key={p} to={`/topic/${p}`} title={topicById[p].title}>
                        {p}
                        {progress.topics[p]?.lessonCompleted ? ' ✓' : ''}
                      </Link>
                    ))
                  : 'nothing'}
              </b>
            </div>
          </div>
        </div>
        <aside className="tile tile--raised tp-prog" aria-label="Topic progress">
          <div className="eyebrow tp-prog-k">
            <span>Topic progress</span>
            <span className={status === 'completed' ? 't-plasma' : status === 'in-progress' ? 't-uv' : status === 'available' ? 't-ice' : ''}>{statusWord}</span>
          </div>
          <div className="tp-prog-top">
            <span className="num">
              {s.mastery}
              <small>%</small>
            </span>
            <div className="tp-prog-r">
              mastery
              <br />
              <b>
                {s.solved} / {s.total}
              </b>{' '}
              solved{s.attempted ? ` · ${s.attempted} attempted` : ''}
            </div>
          </div>
          {vox.length > 0 && (
            <div className="tp-vox" role="img" aria-label={`${vox.length} problems as cubes: ${s.solved} solved, ${s.attempted} attempted, ${vox.length - s.solved - s.attempted} to do`}>
              {vox.map((v) => (
                <span key={v.id} className={`vox ${v.st === 'solved' ? '' : v.st === 'attempted' ? 'tp-vox--att' : 'vox--ghost'}`} style={{ '--h': v.h }} />
              ))}
            </div>
          )}
          <MasteryBox topic={topic} progress={progress} />
          <div className="tp-prog-foot">
            <span>{s.lessonCompleted ? (status === 'completed' ? 'topic complete' : `completes at ${halfNeed}/${s.total} solved`) : left ? `~${left} min of lesson left` : 'lesson not started'}</span>
            <button type="button" className="btn btn--chrome btn--sm" onClick={() => setTab('practice')}>
              Practice
            </button>
          </div>
        </aside>
      </section>

      {status === 'locked' && (
        <div className="tp-locked">
          <Callout variant="warning" title="This topic is locked">
            <p className="small">Its prerequisites aren't complete yet. You can still explore it — the lesson assumes you know the prerequisites.</p>
            <button type="button" className="btn btn--chrome btn--sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })}>
              <Icon name="lock" size={13} /> Unlock anyway
            </button>
          </Callout>
        </div>
      )}

      <div className="tp-sp-wrap rise" style={{ '--i': 2 }}>
        <StudyPath topic={topic} tab={tab} locked={locked} onSelect={setTab} />
        {tab === 'practice' ? (
          <CoachTip id="tab:practice" title="Name the pattern first.">
            Each question asks which pattern fits before any hint. <kbd className="kbd">Ctrl</kbd>/<kbd className="kbd">⌘</kbd> <kbd className="kbd">Enter</kbd> runs the visible tests; Submit also runs hidden ones.
          </CoachTip>
        ) : (
          TIPS[tab] && (
            <CoachTip id={`tab:${tab}`} title={TIPS[tab][0]}>
              {TIPS[tab][1]}
            </CoachTip>
          )
        )}
      </div>

      <div id="topic-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="tp-panel">
        {tab === 'learn' && (status !== 'locked' || tState.unlockedManually || prerequisitesMet(topic, progress)) && (
          <>
            <LearnTab topic={topic} onFinish={() => setTab(visualCount ? 'visualize' : 'practice')} initialSection={initialSection} onSectionApplied={() => setParams({}, { replace: true })} />
            {s.lessonCompleted && (
              <NextUp
                lead="Lesson complete."
                label={visualCount ? `Next: watch ${visualCount} pattern${visualCount === 1 ? '' : 's'} animate` : `Next: practise ${topic.questions.length} questions`}
                onClick={() => setTab(visualCount ? 'visualize' : 'practice')}
              />
            )}
          </>
        )}
        {tab === 'learn' && locked && (
          <EmptyState icon="lock" title="Unlock the topic to start the lesson">
            Finish{' '}
            {topic.prerequisites
              .filter((p) => !progress.topics[p]?.lessonCompleted)
              .map((p) => topicById[p].title)
              .join(', ')}{' '}
            first — or unlock it above.
          </EmptyState>
        )}
        {tab === 'visualize' && (
          <>
            <VisualizeTab topic={topic} />
            <NextUp lead="Seen how it moves?" label={topic.questions.length ? `Next: practise ${topic.questions.length} questions` : 'Next: the cheatsheet'} onClick={() => setTab(topic.questions.length ? 'practice' : 'cheatsheet')} />
          </>
        )}
        {tab === 'practice' && (
          <>
            {!s.lessonCompleted && topic.questions.length > 0 && <p className="tp-faint tp-prac-tip">Tip: finish the lesson first — questions build on its patterns.</p>}
            <PracticeTab topic={topic} progress={progress} />
            {status === 'completed' ? <NextUp {...toNextTopic} /> : s.solved > 0 && <NextUp lead={`${s.solved}/${s.total} solved.`} label="Next: review what you missed" onClick={() => setTab('review')} />}
          </>
        )}
        {tab === 'company' && <CompanyTab topic={topic} />}
        {tab === 'cheatsheet' && (
          <>
            <Cheatsheet topic={topic} />
            <div className="tp-tricks">
              <TopicTricks topicId={topic.id} />
            </div>
          </>
        )}
        {tab === 'review' && (
          <>
            <ReviewTab topic={topic} progress={progress} onRelearn={() => setTab('learn')} />
            <NextUp {...toNextTopic} />
          </>
        )}
      </div>
    </div>
  );
}
