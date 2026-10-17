import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { Stamp } from '../lesson/Checkpoint.jsx';

const LETTERS = 'ABCD';

// "Which pattern would you use?" — asked BEFORE any hint or solution is shown.
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
  return (
    <div className={`checkpoint ${answered ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`}>
      <div className="checkpoint-head">
        <span className="checkpoint-folio">P</span>
        <span className="checkpoint-tag">Name the pattern</span>
        {saved && <span className="checkpoint-meta">{saved.correct ? '✓ first try' : '× missed first try'}</span>}
      </div>
      <div className="checkpoint-q">{pc.question || 'Before any hints: which pattern would you reach for?'}</div>
      <div className="options" role="radiogroup">
        {pc.options.map((opt, i) => {
          let state = '';
          if (answered && i === pc.answer && result.correct) state = 'correct';
          else if (answered && i === result.choice && !result.correct) state = 'wrong';
          return (
            <button key={i} type="button" role="radio" aria-checked={selected === i} className={`option ${selected === i && !answered ? 'selected' : ''} ${state}`} disabled={answered} onClick={() => setSelected(i)}>
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="option-text">{opt}</span>
              {state === 'correct' && <span className="option-mark" aria-label="correct">✓</span>}
              {state === 'wrong' && <span className="option-mark" aria-label="your answer, wrong">×</span>}
            </button>
          );
        })}
      </div>
      {!answered && (
        <div className="checkpoint-actions">
          <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
            Lock in my answer
          </button>
          <span className="checkpoint-hint">The clues are in the statement: what is asked for, and in what shape.</span>
        </div>
      )}
      {answered && result.correct && (
        <div className="feedback feedback-correct">
          <Stamp ok>Right pattern</Stamp>
          <Markdown>{pc.explanation}</Markdown>
        </div>
      )}
      {answered && !result.correct && (
        <div className="feedback feedback-wrong">
          <Stamp ok={false} />
          <p>Read the statement again. What is being optimised — and is the answer contiguous, ordered, or a choice among options? Then have one more go.</p>
          <div className="checkpoint-actions">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => { setRetrying(true); setSelected(null); }}>
              Try again
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResult({ choice: pc.answer, correct: true })}>
              Show me the pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
