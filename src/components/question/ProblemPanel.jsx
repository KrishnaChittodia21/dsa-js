import { Link } from 'react-router-dom';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
import DryRunTable from '../lesson/DryRunTable.jsx';
import PatternChallenge from './PatternChallenge.jsx';
import Reveal from './Reveal.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { patternById, companiesForQuestion, companyById } from '../../content/index.js';
import EvidenceBadge from '../EvidenceBadge.jsx';
import { bigoClass } from '../../visualizations/complexity.js';

export function DryRun({ dryRun }) {
  if (!dryRun) return null;
  if (typeof dryRun === 'string') return <Markdown>{dryRun}</Markdown>;
  return <DryRunTable columns={dryRun.columns} rows={dryRun.rows} note={dryRun.note} title={dryRun.title} />;
}

/** Two-letter monogram for a company (text only, never a logo). */
export const monogram = (name = '') => {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).replace(/^./, (c) => c.toUpperCase());
};

export function SolutionDetails({ question }) {
  return (
    <div className="qp-sol">
      {question.solution?.code && <CodeBlock code={question.solution.code} title="Reference solution" />}
      {question.solution?.explanation && <Markdown>{question.solution.explanation}</Markdown>}
      {question.dryRun && (
        <div>
          <h4>Dry run</h4>
          <DryRun dryRun={question.dryRun} />
        </div>
      )}
      {question.complexity && (
        <div className="qp-sol-cx">
          <div className="qp-cx-targets">
            <div>
              <span className="lbl-mono">time</span>
              <span className={`bigo ${bigoClass(question.complexity.time)}`}>{question.complexity.time}</span>
            </div>
            <div>
              <span className="lbl-mono">space</span>
              <span className={`bigo ${bigoClass(question.complexity.space)}`}>{question.complexity.space}</span>
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
          {question.alternative.complexity && <p className="qp-faint">Complexity: {question.alternative.complexity}</p>}
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

export default function ProblemPanel({ question }) {
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
    <div className="qp-prob">
      <section className="qp-statement">
        <Markdown>{question.statement}</Markdown>
      </section>

      {question.examples?.map((ex, i) => (
        <div key={i} className="qp-ex-wrap">
          <span className="lbl-mono">Example {i + 1}</span>
          <div className="qp-ex">
            <span className="k">Input</span>
            <span className="v">{ex.input}</span>
            <span className="k">Output</span>
            <span className="v">{ex.output}</span>
            {ex.explanation && (
              <div className="why">
                <Markdown>{ex.explanation}</Markdown>
              </div>
            )}
          </div>
        </div>
      ))}

      {question.constraints?.length > 0 && (
        <div className="qp-cons">
          <span className="lbl-mono">Constraints</span>
          <div className="qp-chips">
            {question.constraints.map((c) => (
              <code key={c} className="qp-il">
                {c}
              </code>
            ))}
          </div>
        </div>
      )}

      {question.kind !== 'quiz' && (
        <>
          {question.think && (
            <section className="qp-think">
              <span className="eyebrow">
                <i className="pip pip--uv" />
                Think about it first
              </span>
              <Markdown>{question.think}</Markdown>
            </section>
          )}

          <div className="qp-ladder" aria-label="Hints ladder">
            <PatternChallenge question={question} />

            {hints.map((h, i) => (
              <Reveal
                key={i}
                title={`Hint ${i + 1}`}
                open={hintsShown > i}
                onOpen={() => dispatch({ type: 'Q_HINT', qid: question.id, count: i + 1 })}
                locked={!guessed || hintsShown < i}
                lockedText={!guessed ? 'Answer the pattern question first.' : `Open hint ${i} first.`}
                meta="opened"
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
              closedMeta="asks first"
            >
              <Markdown>{question.approach}</Markdown>
              {pattern && (
                <p className="qp-faint">
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
              closedMeta={solved ? 'tap to reveal' : 'viewing is recorded'}
            >
              <SolutionDetails question={question} />
            </Reveal>
          </div>
        </>
      )}

      {companyRefs.length > 0 && (
        <section className="qp-cos">
          <span className="lbl-mono">
            Company associations · <span className="t-2">{companyRefs.length}</span>
          </span>
          <ul className="qp-cos-list">
            {companyRefs.map((c, i) => {
              const name = companyById[c.company]?.name || c.company;
              return (
                <li key={i}>
                  <span className="mono-badge" aria-hidden="true">
                    {monogram(name)}
                  </span>
                  <Link to={`/companies/${c.company}`}>{name}</Link>
                  <EvidenceBadge evidence={c.evidence} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
