import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

const LETTERS = 'ABCDEFGH';

/**
 * A multiple-choice question inside a lesson. Explain → Ask → Wait → Correct → Explain deeper.
 * Wrong answers show the specific misconception, then a deeper re-explanation, and let the learner retry.
 */
export default function Checkpoint({ block, topicId, compact = false }) {
  const { progress, dispatch } = useProgress();
  const saved = progress.checkpoints[block.id];
  const passed = !!(saved && (saved.correct || saved.revealed));
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct, choice }
  const [review, setReview] = useState(false);
  const wrong = new Set(saved?.wrongChoices || []);

  const submit = () => {
    if (selected === null) return;
    const correct = selected === block.answer;
    dispatch({ type: 'CHECKPOINT_ANSWER', id: block.id, topicId, choice: selected, correct });
    setFeedback({ correct, choice: selected });
  };
  const reveal = () => {
    dispatch({ type: 'CHECKPOINT_REVEAL', id: block.id, topicId });
    setFeedback({ correct: true, choice: block.answer, revealed: true });
    setSelected(block.answer);
  };
  const retry = () => {
    setFeedback(null);
    setSelected(null);
  };

  // Already answered on a previous visit → compact summary with option to review.
  if (passed && !feedback && !review) {
    return (
      <div className="checkpoint checkpoint-done">
        <div className="checkpoint-head">
          <span className="checkpoint-tag">
            <Icon name="checkCircle" size={15} /> Checkpoint
          </span>
          <span className="small muted">{saved.firstTryCorrect ? 'Correct on first try' : saved.revealed ? 'Answer revealed' : `Solved after ${saved.attempts} attempts`}</span>
          <span className="spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReview(true)}>
            Review
          </button>
        </div>
        <Markdown className="checkpoint-q">{block.question}</Markdown>
        {!compact && (
          <div className="small">
            <strong>Answer: </strong>
            {LETTERS[block.answer]}. {block.options[block.answer]}
          </div>
        )}
      </div>
    );
  }

  const showResult = !!feedback;
  const isCorrect = feedback?.correct;

  return (
    <div className={`checkpoint ${showResult ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`} role="group" aria-labelledby={`${block.id}-q`}>
      <div className="checkpoint-head">
        <span className="checkpoint-tag">
          <Icon name="help" size={15} /> Before continuing
        </span>
        {review && (
          <>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setReview(false); setFeedback(null); setSelected(null); }}>
              Close
            </button>
          </>
        )}
      </div>
      <div id={`${block.id}-q`}>
        <Markdown className="checkpoint-q">{block.question}</Markdown>
      </div>
      <div className="options" role="radiogroup">
        {block.options.map((opt, i) => {
          const isSel = selected === i;
          const eliminated = !showResult && wrong.has(i) && !review && !passed;
          let state = '';
          if (showResult && i === block.answer && isCorrect) state = 'correct';
          else if (showResult && i === feedback.choice && !isCorrect) state = 'wrong';
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSel}
              className={`option ${isSel ? 'selected' : ''} ${state} ${eliminated ? 'eliminated' : ''}`}
              disabled={showResult || eliminated}
              onClick={() => setSelected(i)}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="option-text">
                <Markdown>{opt}</Markdown>
              </span>
              {state === 'correct' && <Icon name="check" size={16} />}
              {state === 'wrong' && <Icon name="x" size={16} />}
            </button>
          );
        })}
      </div>

      {!showResult && (
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
            Check answer
          </button>
          {wrong.size > 0 && !passed && (
            <button type="button" className="btn btn-ghost" onClick={reveal}>
              Show me the answer
            </button>
          )}
          <span className="small faint">Think it through first — there is no penalty for being wrong.</span>
        </div>
      )}

      {showResult && isCorrect && (
        <div className="feedback feedback-correct">
          <div className="feedback-title">
            <Icon name="checkCircle" size={17} /> {feedback.revealed ? `The answer is ${LETTERS[block.answer]}.` : saved && saved.attempts > 1 ? 'Correct — you got there!' : 'Correct!'}
          </div>
          <Markdown>{block.explanation}</Markdown>
        </div>
      )}

      {showResult && !isCorrect && (
        <div className="feedback feedback-wrong">
          <div className="feedback-title">
            <Icon name="alert" size={17} /> Not quite.
          </div>
          {block.misconceptions?.[feedback.choice] && <Markdown>{block.misconceptions[feedback.choice]}</Markdown>}
          {block.deeper && (
            <div className="feedback-deeper">
              <div className="feedback-subtitle">
                <Icon name="bulb" size={15} /> Let's look at it another way
              </div>
              <Markdown>{block.deeper}</Markdown>
            </div>
          )}
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={retry}>
              Try again
            </button>
            <button type="button" className="btn btn-ghost" onClick={reveal}>
              Show me the answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
