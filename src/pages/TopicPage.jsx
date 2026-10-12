import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LessonPlayer from '../components/lesson/LessonPlayer.jsx';
import Icon from '../components/ui/Icon.jsx';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import EvidenceBadge from '../components/EvidenceBadge.jsx';
import { JsToolsTable } from '../components/lesson/Block.jsx';
import { Callout, DifficultyBadge, EmptyState, ProgressBar, QuestionStatusIcon, StatusBadge, Tabs } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { missedCheckpoints, mistakeQuestions, topicStats, topicStatus, prerequisitesMet } from '../state/selectors.js';
import { topicById, companyQuestionsForTopic, companyById, EVIDENCE_LEVELS, patternById, getCheckpoints } from '../content/index.js';
import NotFound from './NotFound.jsx';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';
import TopicTricks from '../components/TopicTricks.jsx';
import { visualForPattern } from '../visualizations/patternVisuals.js';

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
  if (!groups.length) return <EmptyState icon="play" title="No animations for this topic">Its ideas are rules and analysis rather than step-by-step processes — the lesson covers them with worked examples.</EmptyState>;
  const toggle = (k) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <div className="stack">
      <Callout variant="tip" title="Predict, then watch">
        <span className="small">Animations pause at key steps and ask what happens next. Answer before revealing — it's the fastest way to check you really understand the pattern. Use “Try your own input” to test edge cases.</span>
      </Callout>
      {groups.map((g) => {
        const primary = g.patterns.find((p) => !visualForPattern(p).related) || g.patterns[0];
        return (
          <div key={g.key} className="card">
            <button type="button" className="pattern-head" style={{ padding: 0 }} onClick={() => toggle(g.key)} aria-expanded={open.has(g.key)}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 650 }}>{g.patterns.map((p) => p.name).join(' · ')}</div>
                <div className="small muted">{primary.summary}</div>
              </div>
              <Icon name="chevronDown" size={16} />
            </button>
            {open.has(g.key) && (
              <div style={{ marginTop: '0.75rem' }}>
                <PatternVisual pattern={primary} />
              </div>
            )}
          </div>
        );
      })}
      {topic.patterns.length > withVisual.length && (
        <p className="small faint">Not animated: {topic.patterns.filter((p) => !hasVisual(p)).map((p) => p.name).join(', ')} — these are covered with examples in the lesson.</p>
      )}
    </div>
  );
}

function LearnTab({ topic, onFinish }) {
  const { data, loading, error } = useTopicContent(topic.id);
  if (loading) return <div className="card muted small">Loading lesson…</div>;
  if (error) return <div className="callout callout-danger small">Could not load this lesson: {String(error.message || error)}</div>;
  return <LessonPlayer topic={{ ...topic, lesson: data?.lesson || topic.lesson }} onFinish={onFinish} />;
}

const DIFFS = ['Easy', 'Medium', 'Hard'];

export function MasteryBox({ topic, progress }) {
  const s = topicStats(topic, progress);
  return (
    <div className="mastery-box mono small">
      <div>
        <span>Learning</span>
        <span>{s.lessonCompleted ? '✓' : `${s.checkpointsPassed}/${s.checkpointsTotal} checkpoints`}</span>
      </div>
      {DIFFS.map((d) => (
        <div key={d}>
          <span style={{ color: `var(--${d.toLowerCase()})` }}>{d}</span>
          <span>
            {s.byDiff[d].solved}/{s.byDiff[d].total}
          </span>
        </div>
      ))}
      <div className="mastery-total">
        <span>Pattern mastery</span>
        <span>{s.mastery}%</span>
      </div>
    </div>
  );
}

export function QuestionList({ questions, progress, topicId, showTopic = false }) {
  return (
    <ul className="list-plain qlist">
      {questions.map((q, i) => {
        const st = progress.questions[q.id];
        const companies = new Set(companyQuestionsForTopic(q.topicId).filter((c) => c.questionId === q.id).map((c) => c.company));
        return (
          <li key={q.id} className="qlist-row">
            <span className="qlist-num mono faint">{i + 1}</span>
            <QuestionStatusIcon status={st?.status} />
            <Link to={`/topic/${topicId || q.topicId}/q/${q.id}`} className="qlist-title">
              {q.title}
            </Link>
            <span className="qlist-pattern small muted">{patternById[q.pattern]?.name?.replace(/^.*?—\s*/, '')}</span>
            {showTopic && <span className="small muted">{topicById[q.topicId]?.title}</span>}
            {companies.size > 0 && (
              <span className="badge" title={[...companies].map((c) => companyById[c]?.name).join(', ')}>
                <Icon name="building" size={11} /> {companies.size}
              </span>
            )}
            {q.kind === 'design' && <span className="badge badge-outline">design</span>}
            {q.kind === 'quiz' && <span className="badge badge-outline">quiz</span>}
            <DifficultyBadge difficulty={q.difficulty} />
          </li>
        );
      })}
    </ul>
  );
}

function PracticeTab({ topic, progress }) {
  const [pattern, setPattern] = useState('all');
  const qs = pattern === 'all' ? topic.questions : topic.questions.filter((q) => q.pattern === pattern);
  if (!topic.questions.length) return <EmptyState icon="list" title="Questions are on their way">This topic's practice set is still being written.</EmptyState>;
  return (
    <div className="topic-practice">
      <div>
        {topic.patterns.length > 1 && (
          <div className="filter-bar">
            <button type="button" className="chip" aria-pressed={pattern === 'all'} onClick={() => setPattern('all')}>
              All patterns
            </button>
            {topic.patterns.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={pattern === p.id} onClick={() => setPattern(p.id)}>
                {p.name.replace(/^.*?—\s*/, '')} ({topic.questions.filter((q) => q.pattern === p.id).length})
              </button>
            ))}
          </div>
        )}
        {DIFFS.map((d) => {
          const list = qs.filter((q) => q.difficulty === d);
          if (!list.length) return null;
          const solved = list.filter((q) => progress.questions[q.id]?.status === 'solved').length;
          return (
            <div key={d} className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header">
                <DifficultyBadge difficulty={d} />
                <span className="small muted mono">
                  {solved}/{list.length}
                </span>
                <span className="spacer" />
                <div style={{ width: 140 }}>
                  <ProgressBar value={solved} max={list.length} variant={d.toLowerCase()} size="sm" label={`${d} progress`} />
                </div>
              </div>
              <QuestionList questions={list} progress={progress} topicId={topic.id} />
            </div>
          );
        })}
      </div>
      <aside className="stack">
        <div className="card">
          <h3>Progress</h3>
          <MasteryBox topic={topic} progress={progress} />
        </div>
        <div className="card">
          <h3>How to practise</h3>
          <ol className="small thought-list">
            <li>Read the problem and constraints.</li>
            <li>Name the pattern before any hint.</li>
            <li>Write the brute force in words.</li>
            <li>Optimise, then code it.</li>
            <li>Run, then submit against hidden tests.</li>
            <li>Only then read the solution & alternatives.</li>
          </ol>
        </div>
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
    <div className="stack">
      <Callout variant="insight" title="How company attributions work">
        <div className="small">
          Attributions come only from linked sources. <strong>{EVIDENCE_LEVELS.verified.label}</strong>: {EVIDENCE_LEVELS.verified.description} <strong>{EVIDENCE_LEVELS.community.label}</strong>: {EVIDENCE_LEVELS.community.description} <strong>{EVIDENCE_LEVELS.associated.label}</strong>: {EVIDENCE_LEVELS.associated.description}
        </div>
      </Callout>
      {byCompany.length === 0 && <EmptyState icon="building" title="No sourced company questions for this topic yet">We only list company questions with a verifiable source.</EmptyState>}
      {byCompany.map(([cid, list]) => (
        <div key={cid} className="card">
          <div className="card-header">
            <h3>
              <Link to={`/companies/${cid}`}>{companyById[cid]?.name || cid}</Link>
            </h3>
            <span className="badge">{list.length}</span>
          </div>
          <CompanyEntryTable entries={list} />
        </div>
      ))}
    </div>
  );
}

export function CompanyEntryTable({ entries, showCompany = false }) {
  const { progress } = useProgress();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th />
            {showCompany && <th>Company</th>}
            <th>Question</th>
            <th>Pattern</th>
            <th>Difficulty</th>
            <th>Evidence</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>
                <QuestionStatusIcon status={progress.questions[e.questionId]?.status} />
              </td>
              {showCompany && <td className="small">{companyById[e.company]?.name}</td>}
              <td>
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
              <td className="small muted">{e.pattern || topicById[e.topicId]?.title || '—'}</td>
              <td>
                <DifficultyBadge difficulty={e.difficulty} />
              </td>
              <td>
                <EvidenceBadge evidence={e.evidence} />
              </td>
              <td className="small">
                {e.sourceList.map((s) =>
                  s.url ? (
                    <a key={s.key} href={s.url} target="_blank" rel="noreferrer" title={s.description} style={{ display: 'block' }}>
                      {s.label} <Icon name="external" size={10} />
                    </a>
                  ) : (
                    <span key={s.key}>{s.label}</span>
                  ),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Cheatsheet({ topic }) {
  const c = topic.cheatsheet;
  if (!c) return <EmptyState icon="file" title="Cheatsheet coming soon" />;
  return (
    <div className="cheatsheet">
      <div className="cheat-flow">
        <div className="cheat-step">
          <div className="cheat-k">Pattern</div>
          <div className="cheat-v">{topic.patterns.map((p) => p.name).join(' · ') || topic.title}</div>
        </div>
        <div className="cheat-step">
          <div className="cheat-k">When to use</div>
          <ul>
            {c.whenToUse?.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="cheat-step">
          <div className="cheat-k">Recognition clues</div>
          <div className="row-wrap">
            {c.clues?.map((x) => (
              <span key={x} className="badge badge-accent mono">
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="cheat-step">
          <div className="cheat-k">Template</div>
          <CodeBlock code={c.template} />
        </div>
        <div className="cheat-step">
          <div className="cheat-k">Complexity</div>
          <div className="mono">{c.complexity}</div>
        </div>
        <div className="cheat-step">
          <div className="cheat-k">Common mistakes</div>
          <ul>
            {c.mistakes?.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="cheat-step">
          <div className="cheat-k">JS tools</div>
          <div className="row-wrap">
            {c.jsTools?.map((x) => (
              <code key={x}>{x}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewTab({ topic: meta, progress }) {
  const { data, loading } = useTopicContent(meta.id);
  if (loading) return <div className="card muted small">Loading review…</div>;
  const topic = data ? { ...meta, lesson: data.lesson, patterns: data.patterns.map((p) => ({ ...p, topicId: meta.id })) } : meta;
  const mistakes = mistakeQuestions(progress, topic.id);
  const missed = missedCheckpoints(progress, topic);
  return (
    <div className="stack">
      <div className="grid-2">
        <div className="card">
          <h3>Key concepts</h3>
          <ul className="md">
            {topic.keyConcepts.map((k) => (
              <li key={k}>
                <Markdown>{k}</Markdown>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Pattern recognition clues</h3>
          {topic.patterns.map((p) => (
            <div key={p.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="row-wrap" style={{ marginTop: '0.25rem' }}>
                {(p.clues || []).map((c) => (
                  <span key={c} className="badge badge-outline mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Templates</h3>
        {topic.patterns.map((p) => (
          <details key={p.id} className="details">
            <summary>
              {p.name} <span className="small muted">— {p.summary}</span>
            </summary>
            {p.template && <CodeBlock code={p.template} />}
            {p.mistakes?.length > 0 && (
              <>
                <div className="small" style={{ fontWeight: 600 }}>
                  Common mistakes
                </div>
                <ul className="small">
                  {p.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </details>
        ))}
        {topic.cheatsheet?.complexity && (
          <p className="small" style={{ marginTop: '0.75rem' }}>
            <strong>Complexity:</strong> <span className="mono">{topic.cheatsheet.complexity}</span>
          </p>
        )}
      </div>

      {topic.jsTools.length > 0 && (
        <div className="card">
          <h3>JavaScript APIs used</h3>
          <JsToolsTable items={topic.jsTools} />
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Checkpoints you missed</h3>
          {missed.length === 0 ? (
            <div className="small muted">{getCheckpoints(topic).some((c) => progress.checkpoints[c.id]) ? 'None — every checkpoint answered correctly on the first try.' : 'Answer the lesson checkpoints first.'}</div>
          ) : (
            missed.map((c) => (
              <details key={c.id} className="details">
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
        </div>
        <div className="card">
          <h3>Questions to retry</h3>
          {mistakes.length === 0 ? <div className="small muted">Questions with failed submissions, wrong pattern guesses, or where you viewed the solution first will be listed here.</div> : <QuestionList questions={mistakes} progress={progress} topicId={topic.id} />}
        </div>
      </div>
    </div>
  );
}

export default function TopicPage() {
  const { topicId } = useParams();
  const [params, setParams] = useSearchParams();
  const { progress, dispatch } = useProgress();
  const topic = topicById[topicId];
  const tab = params.get('tab') || 'learn';
  const setTab = (t) => setParams(t === 'learn' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, [topicId]);

  if (!topic) return <NotFound />;
  const status = topicStatus(topic, progress);
  const s = topicStats(topic, progress);
  const companyCount = companyQuestionsForTopic(topic.id).length;
  const tState = progress.topics[topic.id] || {};

  return (
    <div className="page page-wide">
      <div className="topic-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-wrap small" style={{ marginBottom: '0.4rem' }}>
            <Link to="/path" className="muted">
              {topic.stageTitle}
            </Link>
            <Icon name="chevronRight" size={12} />
            <StatusBadge status={status} />
            <DifficultyBadge difficulty={topic.difficulty} />
            <span className="muted">
              <Icon name="clock" size={12} /> ~{topic.estMinutes} min
            </span>
          </div>
          <h1 style={{ margin: 0 }}>{topic.title}</h1>
          <p className="muted" style={{ margin: '0.35rem 0 0', maxWidth: 780 }}>
            {topic.summary}
          </p>
          {topic.prerequisites.length > 0 && (
            <div className="small" style={{ marginTop: '0.5rem' }}>
              <span className="muted">Builds on: </span>
              {topic.prerequisites.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' · '}
                  <Link to={`/topic/${p}`}>{topicById[p].title}</Link>
                  {progress.topics[p]?.lessonCompleted ? ' ✓' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
        <MasteryBox topic={topic} progress={progress} />
      </div>

      {status === 'locked' && (
        <Callout variant="warning" title="This topic is locked">
          <p className="small">Its prerequisites aren't complete yet. You can still explore it — the lesson assumes you know the prerequisites.</p>
          <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })}>
            Unlock anyway
          </button>
        </Callout>
      )}

      <Tabs
        label="Topic sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'learn', label: 'Learn', icon: 'book' },
          { id: 'visualize', label: 'Visualize', icon: 'play', count: topic.patterns.filter(hasVisual).length || undefined },
          { id: 'practice', label: 'Practice', icon: 'code', count: topic.questions.length },
          { id: 'company', label: 'Company Questions', icon: 'building', count: companyCount },
          { id: 'cheatsheet', label: 'Cheatsheet', icon: 'file' },
          { id: 'review', label: 'Review', icon: 'refresh' },
        ]}
      />

      {tab === 'learn' && (status !== 'locked' || tState.unlockedManually || prerequisitesMet(topic, progress)) && <LearnTab topic={topic} onFinish={() => setTab('practice')} />}
      {tab === 'learn' && status === 'locked' && !tState.unlockedManually && (
        <EmptyState icon="lock" title="Unlock the topic to start the lesson">
          Finish {topic.prerequisites.filter((p) => !progress.topics[p]?.lessonCompleted).map((p) => topicById[p].title).join(', ')} first — or unlock it above.
        </EmptyState>
      )}
      {tab === 'visualize' && <VisualizeTab topic={topic} />}
      {tab === 'practice' && <PracticeTab topic={topic} progress={progress} />}
      {tab === 'company' && <CompanyTab topic={topic} />}
      {tab === 'cheatsheet' && (
        <>
          <Cheatsheet topic={topic} />
          <TopicTricks topicId={topic.id} />
        </>
      )}
      {tab === 'review' && <ReviewTab topic={topic} progress={progress} />}

      {tab !== 'learn' && s.lessonCompleted === false && tab === 'practice' && topic.questions.length > 0 && (
        <p className="small faint" style={{ marginTop: '1rem' }}>
          Tip: finish the lesson first — questions build on its patterns.
        </p>
      )}
    </div>
  );
}
