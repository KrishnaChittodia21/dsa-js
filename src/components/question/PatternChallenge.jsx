import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

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
        <span className="checkpoint-tag">
          <Icon name="target" size={15} /> Pattern recognition
        </span>
        {saved && <span className="small muted">{saved.correct ? 'Identified on first try' : 'Missed on first try'}</span>}
      </div>
      <div className="checkpoint-q">{pc.question || 'Before any hints: which pattern would you use?'}</div>
      <div className="options">
        {pc.options.map((opt, i) => {
          let state = '';
          if (answered && i === pc.answer && result.correct) state = 'correct';
          else if (answered && i === result.choice && !result.correct) state = 'wrong';
          return (
            <button key={i} type="button" role="radio" aria-checked={selected === i} className={`option ${selected === i && !answered ? 'selected' : ''} ${state}`} disabled={answered} onClick={() => setSelected(i)}>
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="option-text">{opt}</span>
            </button>
          );
        })}
      </div>
      {!answered && (
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
            Lock in my answer
          </button>
          <span className="small faint">Look for the clues in the problem statement.</span>
        </div>
      )}
      {answered && result.correct && (
        <div className="feedback feedback-correct">
          <div className="feedback-title">
            <Icon name="checkCircle" size={17} /> Right pattern!
          </div>
          <Markdown>{pc.explanation}</Markdown>
        </div>
      )}
      {answered && !result.correct && (
        <div className="feedback feedback-wrong">
          <div className="feedback-title">
            <Icon name="alert" size={17} /> Not the best fit.
          </div>
          <p className="small">Re-read the statement: what is being optimised, and is the answer contiguous, ordered, or a choice among options? Then try once more.</p>
          <div className="row">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => { setRetrying(true); setSelected(null); }}>
              Try again
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResult({ choice: pc.answer, correct: true })}>
              Show the pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
