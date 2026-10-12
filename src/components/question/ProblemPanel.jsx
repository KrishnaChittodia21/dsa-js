import { Link } from 'react-router-dom';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
import Icon from '../ui/Icon.jsx';
import { DifficultyBadge } from '../ui/primitives.jsx';
import DryRunTable from '../lesson/DryRunTable.jsx';
import PatternChallenge from './PatternChallenge.jsx';
import Reveal from './Reveal.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { patternById, companiesForQuestion, companyById } from '../../content/index.js';
import EvidenceBadge from '../EvidenceBadge.jsx';
import PatternVisual, { hasVisual } from '../PatternVisual.jsx';
import { useState } from 'react';

export function DryRun({ dryRun }) {
  if (!dryRun) return null;
  if (typeof dryRun === 'string') return <Markdown>{dryRun}</Markdown>;
  return <DryRunTable columns={dryRun.columns} rows={dryRun.rows} note={dryRun.note} title={dryRun.title} />;
}

export function SolutionDetails({ question }) {
  return (
    <div className="stack">
      {question.solution?.code && <CodeBlock code={question.solution.code} title="Reference solution" />}
      {question.solution?.explanation && <Markdown>{question.solution.explanation}</Markdown>}
      {question.dryRun && (
        <div>
          <h4>Dry run</h4>
          <DryRun dryRun={question.dryRun} />
        </div>
      )}
      {question.complexity && (
        <div className="complexity-card">
          <div className="complexity-pills">
            <div>
              <div className="small muted">Time</div>
              <div className="complexity-value">{question.complexity.time}</div>
            </div>
            <div>
              <div className="small muted">Space</div>
              <div className="complexity-value">{question.complexity.space}</div>
            </div>
          </div>
          {question.complexity.explanation && <Markdown>{question.complexity.explanation}</Markdown>}
        </div>
      )}
      {question.alternative && (
        <div>
          <h4>Alternative: {question.alternative.title}</h4>
          <Markdown>{question.alternative.md}</Markdown>
          {question.alternative.code && <CodeBlock code={question.alternative.code} />}
          {question.alternative.complexity && <div className="small muted">Complexity: {question.alternative.complexity}</div>}
        </div>
      )}
      {question.mistakes?.length > 0 && (
        <div>
          <h4>Common mistakes</h4>
          <ul className="md">
            {question.mistakes.map((m, i) => (
              <li key={i}>
                <Markdown>{m}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ProblemPanel({ question, topic }) {
  const { progress, dispatch } = useProgress();
  const qs = progress.questions[question.id] || {};
  const solved = qs.status === 'solved';
  const guessed = !!qs.patternGuess;
  const hints = question.hints || [];
  const hintsShown = qs.hintsRevealed || 0;
  const pattern = patternById[question.pattern];
  const companyRefs = companiesForQuestion(question.id);
  const approachOpen = !!qs.approachViewed || qs.solutionViewed || solved;

  return (
    <div className="problem">
      <div className="problem-head">
        <div className="row-wrap small">
          <Link to={`/topic/${topic.id}?tab=practice`} className="muted">
            {topic.title}
          </Link>
          <Icon name="chevronRight" size={12} />
          <DifficultyBadge difficulty={question.difficulty} />
          {question.source?.platform === 'LeetCode' && question.source.url && (
            <a href={question.source.url} target="_blank" rel="noreferrer" className="badge badge-outline">
              LeetCode {question.source.number ? `#${question.source.number}` : ''} {question.source.premium ? '· Premium' : ''} <Icon name="external" size={11} />
            </a>
          )}
          {question.source?.platform === 'Classic' && <span className="badge badge-outline">Classic problem</span>}
          {solved && (
            <span className="badge badge-success">
              <Icon name="check" size={12} /> Solved
            </span>
          )}
        </div>
        <h1 className="problem-title">{question.title}</h1>
      </div>

      <section className="problem-section">
        <Markdown>{question.statement}</Markdown>
        {question.examples?.map((ex, i) => (
          <div key={i} className="example">
            <div className="example-title">Example {i + 1}</div>
            <div className="mono small">
              <div>
                <strong>Input:</strong> {ex.input}
              </div>
              <div>
                <strong>Output:</strong> {ex.output}
              </div>
            </div>
            {ex.explanation && <Markdown className="small muted">{ex.explanation}</Markdown>}
          </div>
        ))}
        {question.constraints?.length > 0 && (
          <div>
            <div className="example-title">Constraints</div>
            <ul className="constraints">
              {question.constraints.map((c) => (
                <li key={c}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {question.kind !== 'quiz' && (
        <>
          {question.think && (
            <section className="think">
              <div className="reveal-title">
                <Icon name="brain" size={16} /> Think about it first
              </div>
              <Markdown>{question.think}</Markdown>
            </section>
          )}

          <PatternChallenge question={question} />

          {pattern && hasVisual(pattern) && <PatternMotion pattern={pattern} locked={!guessed} />}

          {hints.map((h, i) => (
            <Reveal
              key={i}
              title={`Hint ${i + 1}`}
              open={hintsShown > i}
              onOpen={() => dispatch({ type: 'Q_HINT', qid: question.id, count: i + 1 })}
              locked={!guessed || hintsShown < i}
              lockedText={!guessed ? 'Answer the pattern question first.' : `Open hint ${i} first.`}
            >
              <Markdown>{h}</Markdown>
            </Reveal>
          ))}

          <Reveal
            title="Approach"
            icon="map"
            open={approachOpen}
            onOpen={() => dispatch({ type: 'Q_APPROACH', qid: question.id })}
            locked={!guessed}
            lockedText="Answer the pattern question first."
            confirmText="The approach explains the full idea. Have you tried with the hints?"
          >
            <Markdown>{question.approach}</Markdown>
            {pattern && (
              <p className="small muted">
                Pattern: <Link to={`/patterns#${pattern.id}`}>{pattern.name}</Link>
              </p>
            )}
          </Reveal>

          <Reveal
            title="Solution"
            icon="code"
            tone="solution"
            open={!!qs.solutionViewed || solved}
            onOpen={() => dispatch({ type: 'Q_VIEW_SOLUTION', qid: question.id })}
            locked={!guessed}
            lockedText="Answer the pattern question first."
            confirmText={solved ? undefined : 'Viewing the solution before solving is recorded (it helps find weak areas). Show it?'}
          >
            <SolutionDetails question={question} />
          </Reveal>
        </>
      )}

      {companyRefs.length > 0 && (
        <section className="problem-section">
          <div className="example-title">Company associations</div>
          <div className="row-wrap">
            {companyRefs.map((c, i) => (
              <span key={i} className="row small" style={{ gap: '0.35rem' }}>
                <Link to={`/companies/${c.company}`}>{companyById[c.company]?.name || c.company}</Link>
                <EvidenceBadge evidence={c.evidence} />
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PatternMotion({ pattern, locked }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal
      title="Pattern in motion"
      icon="play"
      open={open}
      onOpen={() => setOpen(true)}
      locked={locked}
      lockedText="Answer the pattern question first — the animation would give it away."
    >
      <p className="small muted" style={{ marginTop: 0 }}>
        Watch <strong>{pattern.name}</strong> on a small example, then map each step onto this problem.
      </p>
      <PatternVisual pattern={pattern} compact />
    </Reveal>
  );
}
