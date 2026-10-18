import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

const LETTERS = 'ABCD';

// "Name the pattern first" — the first rung of the hint ladder, asked BEFORE any hint or solution.
export default function PatternChallenge({ question }) {
  const { progress, dispatch } = useProgress();
  const pc = question.patternChallenge;
  const saved = progress.questions[question.id]?.patternGuess;
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(saved ? { choice: saved.choice, correct: saved.finalCorrect ?? saved.correct } : null);
  const [retrying, setRetrying] = useState(false);
  if (!pc) return null;

  const submit = () => {
    if (selected === null) return;
    const correct = selected === pc.answer;
    dispatch({ type: 'Q_PATTERN_GUESS', qid: question.id, choice: selected, correct });
    setResult({ choice: selected, correct });
    setRetrying(false);
  };

  const answered = result && !retrying;
  const state = answered ? (result.correct ? 'qp-rung--done' : 'qp-rung--miss') : 'qp-rung--now';
  return (
    <section className={`qp-rung qp-pc ${state}`} aria-label="Pattern challenge">
      <div className="qp-rung-h">
        <Icon name="target" size={15} /> Name the pattern first
        <span className={`lbl-mono${saved ? (saved.correct ? ' t-easy' : ' t-hard') : ''}`}>{saved ? (saved.correct ? 'first try' : 'missed first try') : 'before any hint'}</span>
      </div>
      {answered && result.correct ? (
        <>
          <span className="qp-pick">
            <Icon name="check" size={13} strokeWidth={3} />
            {pc.options[pc.answer]}
          </span>
          <div className="qp-rung-body qp-pc-why">
            <Markdown>{pc.explanation}</Markdown>
          </div>
        </>
      ) : (
        <>
          <p className="qp-pc-q">{pc.question || 'Before any hints: which pattern would you use?'}</p>
          <div className="options qp-pc-opts" role="radiogroup" aria-label="Pattern options">
            {pc.options.map((opt, i) => {
              let st = '';
              if (answered && i === result.choice && !result.correct) st = 'wrong';
              return (
                <button key={i} type="button" role="radio" aria-checked={selected === i} className={`option ${selected === i && !answered ? 'selected' : ''} ${st}`} disabled={answered} onClick={() => setSelected(i)}>
                  <span className="option-letter">{LETTERS[i]}</span>
                  <span className="option-text">{opt}</span>
                </button>
              );
            })}
          </div>
          {!answered && (
            <div className="qp-row qp-pc-act">
              <button type="button" className="btn btn--plasma btn--sm" disabled={selected === null} onClick={submit}>
                Lock in my answer
              </button>
              <span className="qp-faint">Look for the clues in the problem statement.</span>
            </div>
          )}
          {answered && !result.correct && (
            <div className="qp-pc-miss">
              <b>
                <Icon name="alert" size={15} /> Not the best fit.
              </b>
              <p>Re-read the statement: what is being optimised, and is the answer contiguous, ordered, or a choice among options? Then try once more.</p>
              <div className="qp-row">
                <button type="button" className="btn btn--plasma btn--sm" onClick={() => { setRetrying(true); setSelected(null); }}>
                  Try again
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setResult({ choice: pc.answer, correct: true })}>
                  Show the pattern
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
