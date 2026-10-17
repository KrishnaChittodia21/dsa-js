import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LessonPlayer from '../components/lesson/LessonPlayer.jsx';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import EvidenceBadge from '../components/EvidenceBadge.jsx';
import { JsToolsTable } from '../components/lesson/Block.jsx';
import { Callout, DifficultyBadge, QuestionStatusIcon } from '../components/ui/primitives.jsx';
import StudyPath from '../components/guide/StudyPath.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import NextUp from '../components/guide/NextUp.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { missedCheckpoints, mistakeQuestions, topicStats, topicStatus, prerequisitesMet, STATUS_LABEL } from '../state/selectors.js';
import { topicById, topics, companyQuestionsForTopic, companyById, EVIDENCE_LEVELS, patternById, getCheckpoints } from '../content/index.js';
import { markTabVisited } from '../lib/uiPrefs.js';
import NotFound from './NotFound.jsx';
import { useTopicContent } from '../content/useContent.js';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';
import TopicTricks from '../components/TopicTricks.jsx';
import { visualForPattern } from '../visualizations/patternVisuals.js';

const MARK = { locked: '·', available: '○', 'in-progress': '◐', completed: '✓' };

/** An empty state in the notebook voice: one specific sentence, and an optional action. */
function Blank({ title, children }) {
  return (
    <div className="blank">
      <p className="blank-title">{title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

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
  if (!groups.length) return <Blank title="Nothing to animate here.">This topic is rules and analysis rather than step-by-step processes, so the lesson covers it with worked examples instead.</Blank>;
  const toggle = (k) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <div className="stack">
      <Callout variant="tip" title="Predict, then watch">
        <span className="small">Each animation stops at the key moments and asks what happens next. Answer before you reveal it; that is the quickest way to find out whether the pattern has really landed. “Try your own input” is there for edge cases.</span>
      </Callout>
      <ol className="anim-list">
        {groups.map((g, i) => {
          const primary = g.patterns.find((p) => !visualForPattern(p).related) || g.patterns[0];
          const isOpen = open.has(g.key);
          return (
            <li key={g.key} className={`viz-entry ${isOpen ? 'open' : ''}`}>
              <button type="button" className="viz-entry-head" onClick={() => toggle(g.key)} aria-expanded={isOpen}>
                <span className="folio">{String(i + 1).padStart(2, '0')}</span>
                <span className="viz-entry-text">
                  <span className="viz-entry-title">{g.patterns.map((p) => p.name).join(' · ')}</span>
                  <span className="viz-entry-sum">{primary.summary}</span>
                </span>
                <span className="viz-entry-sign" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="viz-entry-body">
                  <PatternVisual pattern={primary} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {topic.patterns.length > withVisual.length && (
        <p className="margin-text">Not animated: {topic.patterns.filter((p) => !hasVisual(p)).map((p) => p.name).join(', ')}. The lesson covers these with worked examples.</p>
      )}
    </div>
  );
}

function LearnTab({ topic, onFinish, initialSection, onSectionApplied }) {
  const { data, loading, error } = useTopicContent(topic.id);
  if (loading)
    return (
      <div className="skeleton" role="status" aria-label="Loading the lesson">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  if (error) return <div className="callout callout-danger small">The lesson didn&apos;t load. {String(error.message || error)}</div>;
  return <LessonPlayer topic={{ ...topic, lesson: data?.lesson || topic.lesson }} onFinish={onFinish} initialSection={initialSection} onSectionApplied={onSectionApplied} />;
}

const DIFFS = ['Easy', 'Medium', 'Hard'];

export function MasteryBox({ topic, progress }) {
  const s = topicStats(topic, progress);
  return (
    <dl className="mastery-box">
      <div>
        <dt>Lesson</dt>
        <span className="leader" aria-hidden="true" />
        <dd>{s.lessonCompleted ? '✓ done' : `${s.checkpointsPassed}/${s.checkpointsTotal} checkpoints`}</dd>
      </div>
      {DIFFS.map((d) => (
        <div key={d}>
          <dt className={`diff-${d.toLowerCase()}`}>{d}</dt>
          <span className="leader" aria-hidden="true" />
          <dd>
            {s.byDiff[d].solved}/{s.byDiff[d].total}
          </dd>
        </div>
      ))}
      <div className="mastery-total">
        <dt>Mastery</dt>
        <span className="leader" aria-hidden="true" />
        <dd>{s.mastery}%</dd>
      </div>
    </dl>
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
              <span className="qlist-co folio" title={[...companies].map((c) => companyById[c]?.name).join(', ')}>
                {companies.size}
                <span aria-hidden="true"> co.</span>
                <span className="sr-only"> {companies.size === 1 ? 'company' : 'companies'}</span>
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
  if (!topic.questions.length) return <Blank title="No questions here yet.">This topic&apos;s practice set is still being written; the lesson and cheatsheet are ready.</Blank>;
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
            <section key={d} className="practice-set" aria-label={`${d} questions`}>
              <div className="practice-set-head">
                <h3 className={`diff-${d.toLowerCase()}`}>{d}</h3>
                <span className="folio">
                  {solved}/{list.length} solved
                </span>
                <span
                  className="thin-rule"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={list.length}
                  aria-valuenow={solved}
                  aria-label={`${d} progress`}
                >
                  <span style={{ width: `${(solved / list.length) * 100}%` }} />
                </span>
              </div>
              <QuestionList questions={list} progress={progress} topicId={topic.id} />
            </section>
          );
        })}
      </div>
      <aside className="practice-margin">
        <div className="note">
          <p className="eyebrow">Your ledger</p>
          <MasteryBox topic={topic} progress={progress} />
        </div>
        <div className="note">
          <p className="eyebrow">How to practise</p>
          <ol className="small thought-list">
            <li>Read the problem and its constraints.</li>
            <li>Name the pattern before any hint.</li>
            <li>Say the brute force in words.</li>
            <li>Make it faster, then code it.</li>
            <li>Run it, then submit against the hidden tests.</li>
            <li>Only then read the solution and the alternatives.</li>
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
      {byCompany.length === 0 && <Blank title="No sourced company questions for this topic yet.">A question only appears here once it has a source we can link to.</Blank>}
      {byCompany.map(([cid, list]) => (
        <section key={cid} className="ruled-sec">
          <div className="ruled-sec-head">
            <h3>
              <Link to={`/companies/${cid}`}>{companyById[cid]?.name || cid}</Link>
            </h3>
            <span className="folio">{list.length}</span>
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
                    {e.title} <span aria-hidden="true">↗</span>
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
                      {s.label} <span aria-hidden="true">↗</span>
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
  if (!c) return <Blank title="This cheatsheet hasn't been written yet." />;
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

function ReviewTab({ topic: meta, progress, onRelearn }) {
  const { dispatch } = useProgress();
  const { data, loading } = useTopicContent(meta.id);
  if (loading)
    return (
      <div className="skeleton" role="status" aria-label="Loading the review">
        <span />
        <span />
        <span />
      </div>
    );
  const topic = data ? { ...meta, lesson: data.lesson, patterns: data.patterns.map((p) => ({ ...p, topicId: meta.id })) } : meta;
  const mistakes = mistakeQuestions(progress, topic.id);
  const missed = missedCheckpoints(progress, topic);
  return (
    <div className="review">
      <div className="review-pair">
        <section className="ruled-sec">
          <h3>Key concepts</h3>
          <ul className="md">
            {topic.keyConcepts.map((k) => (
              <li key={k}>
                <Markdown>{k}</Markdown>
              </li>
            ))}
          </ul>
        </section>
        <section className="ruled-sec">
          <h3>Pattern recognition clues</h3>
          {topic.patterns.map((p) => (
            <div key={p.id} className="clue-group">
              <div className="clue-name">{p.name}</div>
              <div className="row-wrap">
                {(p.clues || []).map((c) => (
                  <span key={c} className="badge badge-outline mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="ruled-sec">
        <h3>Templates</h3>
        {topic.patterns.map((p) => (
          <details key={p.id} className="details">
            <summary>
              {p.name} <span className="small muted">— {p.summary}</span>
            </summary>
            {p.template && <CodeBlock code={p.template} />}
            {p.mistakes?.length > 0 && (
              <>
                <p className="eyebrow">Common mistakes</p>
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
          <p className="small review-complexity">
            <span className="eyebrow">Complexity</span> <span className="mono">{topic.cheatsheet.complexity}</span>
          </p>
        )}
      </section>

      {topic.jsTools.length > 0 && (
        <section className="ruled-sec">
          <h3>JavaScript APIs used</h3>
          <JsToolsTable items={topic.jsTools} />
        </section>
      )}

      <div className="review-pair">
        <section className="ruled-sec">
          <h3>Checkpoints you missed</h3>
          {missed.length > 0 && (
            <div className="row-wrap review-redo">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  dispatch({ type: 'LESSON_RESET', topicId: meta.id, checkpointIds: missed.map((c) => c.id) });
                  onRelearn?.();
                }}
              >
                Re-answer these {missed.length} checkpoint{missed.length === 1 ? '' : 's'}
              </button>
              <span className="small muted">Only these answers are cleared, and your new first try is the one that counts.</span>
            </div>
          )}
          {missed.length === 0 ? (
            <p className="small muted">{getCheckpoints(topic).some((c) => progress.checkpoints[c.id]) ? 'None. Every checkpoint so far was right on the first try.' : 'Nothing yet. The lesson checkpoints show up here once you answer them.'}</p>
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
        </section>
        <section className="ruled-sec">
          <h3>Questions to retry</h3>
          {mistakes.length === 0 ? (
            <p className="small muted">Clean so far. A question lands here after a failed submission, a wrong pattern guess, or a look at the solution before solving it.</p>
          ) : (
            <QuestionList questions={mistakes} progress={progress} topicId={topic.id} />
          )}
        </section>
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
  const nextTopic = topics[topic.index + 1];
  const toNextTopic = nextTopic
    ? { lead: status === 'completed' ? 'Topic complete.' : 'Ready to move on?', label: `Next topic: ${nextTopic.title}`, to: `/topic/${nextTopic.id}` }
    : { lead: 'That was the last topic.', label: 'Revise what you learned', to: '/revision' };

  return (
    <div className="page page-wide chapter ink-in">
      <header className="chapter-head">
        <div className="chapter-opener">
          <p className="chapter-folio">
            <span className="chapter-num">Chapter {String(topic.index + 1).padStart(2, '0')}</span>
            <Link to="/path">{topic.stageTitle}</Link>
            <span className={`chapter-status st-${status}`}>
              <span aria-hidden="true">{MARK[status]}</span> {STATUS_LABEL[status]}
            </span>
            <span className={`diff-${topic.difficulty.toLowerCase()}`}>{topic.difficulty}</span>
            <span>~{topic.estMinutes} min</span>
          </p>
          <h1 className="chapter-title">{topic.title}</h1>
          <p className="standfirst">{topic.summary}</p>
          {topic.prerequisites.length > 0 && (
            <p className="chapter-prereq">
              <span className="eyebrow">Builds on</span>{' '}
              {topic.prerequisites.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' · '}
                  <Link to={`/topic/${p}`}>{topicById[p].title}</Link>
                  {progress.topics[p]?.lessonCompleted ? ' ✓' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
        <aside className="chapter-margin" aria-label="Mastery">
          <p className="eyebrow">Mastery ledger</p>
          <MasteryBox topic={topic} progress={progress} />
        </aside>
      </header>

      {status === 'locked' && (
        <Callout variant="warning" title="This topic is still locked">
          <p className="small">Its prerequisites aren&apos;t finished yet. You can open it anyway; the lesson just assumes you know what comes before.</p>
          <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'TOPIC_UNLOCK', topicId: topic.id })}>
            Unlock anyway
          </button>
        </Callout>
      )}

      <StudyPath topic={topic} tab={tab} locked={status === 'locked' && !tState.unlockedManually} onSelect={setTab} />

      {tab === 'learn' && (
        <CoachTip id="tab:learn" title="The lesson waits for you.">
          Steps can end with a checkpoint question; the lesson continues once you answer, and a wrong answer explains the misconception. Your place is saved.
        </CoachTip>
      )}
      {tab === 'visualize' && (
        <CoachTip id="tab:visualize" title="Step through it.">
          Focus an animation and use ← → to step; it pauses to ask what happens next. “Try your own input” tests edge cases.
        </CoachTip>
      )}
      {tab === 'practice' && (
        <CoachTip id="tab:practice" title="Name the pattern first.">
          Each question asks which pattern fits before you get a hint. <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>Enter</kbd> runs the visible tests; Submit also runs hidden ones.
        </CoachTip>
      )}
      {tab === 'company' && (
        <CoachTip id="tab:company" title="Every attribution has a source.">
          Check the evidence level: verified, community-reported or commonly associated.
        </CoachTip>
      )}
      {tab === 'cheatsheet' && (
        <CoachTip id="tab:cheatsheet" title="One card per topic.">
          Skim it before interviews; the global Cheat Sheet prints every topic on one page.
        </CoachTip>
      )}
      {tab === 'review' && (
        <CoachTip id="tab:review" title="Redo, don't re-read.">
          Re-answer the checkpoints you missed and retry the listed questions without opening the solution; that is what lifts a weak area.
        </CoachTip>
      )}

      {tab === 'learn' && (status !== 'locked' || tState.unlockedManually || prerequisitesMet(topic, progress)) && (
        <>
          <LearnTab
            topic={topic}
            onFinish={() => setTab(visualCount ? 'visualize' : 'practice')}
            initialSection={initialSection}
            onSectionApplied={() => setParams({}, { replace: true })}
          />
          {s.lessonCompleted && (
            <NextUp
              lead="Lesson complete."
              label={visualCount ? `Next: watch ${visualCount} pattern${visualCount === 1 ? '' : 's'} animate` : `Next: practise ${topic.questions.length} questions`}
              onClick={() => setTab(visualCount ? 'visualize' : 'practice')}
            />
          )}
        </>
      )}
      {tab === 'learn' && status === 'locked' && !tState.unlockedManually && (
        <Blank title="Unlock the topic to start the lesson.">
          Finish {topic.prerequisites.filter((p) => !progress.topics[p]?.lessonCompleted).map((p) => topicById[p].title).join(', ')} first, or unlock it above.
        </Blank>
      )}
      {tab === 'visualize' && (
        <>
          <VisualizeTab topic={topic} />
          <NextUp lead="Seen how it moves?" label={topic.questions.length ? `Next: practise ${topic.questions.length} questions` : 'Next: the cheatsheet'} onClick={() => setTab(topic.questions.length ? 'practice' : 'cheatsheet')} />
        </>
      )}
      {tab === 'practice' && (
        <>
          <PracticeTab topic={topic} progress={progress} />
          {status === 'completed' ? (
            <NextUp {...toNextTopic} />
          ) : (
            s.solved > 0 && <NextUp lead={`${s.solved}/${s.total} solved.`} label="Next: review what you missed" onClick={() => setTab('review')} />
          )}
        </>
      )}
      {tab === 'company' && <CompanyTab topic={topic} />}
      {tab === 'cheatsheet' && (
        <>
          <Cheatsheet topic={topic} />
          <TopicTricks topicId={topic.id} />
        </>
      )}
      {tab === 'review' && (
        <>
          <ReviewTab topic={topic} progress={progress} onRelearn={() => setTab('learn')} />
          <NextUp {...toNextTopic} />
        </>
      )}

      {tab !== 'learn' && s.lessonCompleted === false && tab === 'practice' && topic.questions.length > 0 && (
        <p className="margin-text chapter-tip">Finish the lesson first if you can; the questions lean on its patterns.</p>
      )}
    </div>
  );
}
