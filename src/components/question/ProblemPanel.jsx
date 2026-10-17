import { Link } from 'react-router-dom';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
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
    <div className="exam-solution">
      {question.solution?.code && <CodeBlock code={question.solution.code} title="Reference solution" />}
      {question.solution?.explanation && <Markdown>{question.solution.explanation}</Markdown>}
      {question.dryRun && (
        <div>
          <h4 className="exam-label">Dry run</h4>
          <DryRun dryRun={question.dryRun} />
        </div>
      )}
      {question.complexity && (
        <div className="complexity-card">
          <dl className="complexity-pills">
            <div>
              <dt className="eyebrow">Time</dt>
              <dd className="complexity-value">{question.complexity.time}</dd>
            </div>
            <div>
              <dt className="eyebrow">Space</dt>
              <dd className="complexity-value">{question.complexity.space}</dd>
            </div>
          </dl>
          {question.complexity.explanation && <Markdown>{question.complexity.explanation}</Markdown>}
        </div>
      )}
      {question.alternative && (
        <div>
          <h4 className="exam-label">Another way: {question.alternative.title}</h4>
          <Markdown>{question.alternative.md}</Markdown>
          {question.alternative.code && <CodeBlock code={question.alternative.code} />}
          {question.alternative.complexity && <p className="exam-aside">Complexity: <span className="folio">{question.alternative.complexity}</span></p>}
        </div>
      )}
      {question.mistakes?.length > 0 && (
        <div>
          <h4 className="exam-label">Common mistakes</h4>
          <ul className="md exam-mistakes">
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
    <div className="exam">
      <header className="exam-head">
        <div className="exam-crumbs">
          <Link to={`/topic/${topic.id}?tab=practice`}>{topic.title}</Link>
          <span aria-hidden="true">/</span>
          <DifficultyBadge difficulty={question.difficulty} />
          {question.source?.platform === 'LeetCode' && question.source.url && (
            <a href={question.source.url} target="_blank" rel="noreferrer" className="exam-source">
              LeetCode{question.source.number ? ` № ${question.source.number}` : ''}
              {question.source.premium ? ' · Premium' : ''} <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {question.source?.platform === 'Classic' && <span className="exam-source">Classic problem</span>}
          {solved && <span className="exam-solved">✓ Solved</span>}
        </div>
        <h1 className="exam-title">{question.title}</h1>
      </header>

      <section className="exam-section exam-statement">
        <Markdown>{question.statement}</Markdown>
        {question.examples?.map((ex, i) => (
          <div key={i} className="exam-example">
            <div className="exam-label">Example {i + 1}</div>
            <dl className="exam-io">
              <dt>Input</dt>
              <dd>{ex.input}</dd>
              <dt>Output</dt>
              <dd>{ex.output}</dd>
            </dl>
            {ex.explanation && <Markdown className="exam-aside">{ex.explanation}</Markdown>}
          </div>
        ))}
        {question.constraints?.length > 0 && (
          <div>
            <div className="exam-label">Constraints</div>
            <ul className="exam-constraints">
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
            <section className="exam-think" role="note">
              <div className="exam-label">Before you type anything</div>
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
              lockedText={!guessed ? 'Name the pattern above first.' : `Read hint ${i} first.`}
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
            lockedText="Name the pattern above first."
            confirmText="The approach gives away the whole idea. Have you tried with the hints?"
          >
            <Markdown>{question.approach}</Markdown>
            {pattern && (
              <p className="exam-aside">
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
            lockedText="Name the pattern above first."
            confirmText={solved ? undefined : 'Opening the solution before you solve it is noted, so your weak spots can come back for revision. Open it?'}
          >
            <SolutionDetails question={question} />
          </Reveal>
        </>
      )}

      {companyRefs.length > 0 && (
        <section className="exam-section exam-companies">
          <div className="exam-label">Asked at</div>
          <div className="row-wrap">
            {companyRefs.map((c, i) => (
              <span key={i} className="exam-company">
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
      lockedText="Name the pattern above first — the animation would give it away."
    >
      <p className="exam-aside">
        Watch <strong>{pattern.name}</strong> on a small example, then map each step onto this problem.
      </p>
      <PatternVisual pattern={pattern} compact />
    </Reveal>
  );
}
