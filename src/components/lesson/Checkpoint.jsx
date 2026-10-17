import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

const LETTERS = 'ABCDEFGH';

/** Rubber-stamp verdict on an index card: CORRECT in green ink, NOT QUITE in red. */
export function Stamp({ ok, children }) {
  return <span className={`stamp ${ok ? 'stamp-good' : 'stamp-bad'}`}>{children || (ok ? 'Correct' : 'Not quite')}</span>;
}

/**
 * A multiple-choice question inside a lesson. Explain → Ask → Wait → Correct → Explain deeper.
 * Wrong answers show the specific misconception, then a deeper re-explanation, and let the learner retry.
 * Drawn as an index card with a red top rule and a "Q n" folio.
 */
export default function Checkpoint({ block, topicId, compact = false, number }) {
  const { progress, dispatch } = useProgress();
  const saved = progress.checkpoints[block.id];
  const passed = !!(saved && (saved.correct || saved.revealed));
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct, choice }
  const [review, setReview] = useState(false);
  const wrong = new Set(saved?.wrongChoices || []);
  const folio = number ? `Q ${number}` : 'Q';

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
          <span className="checkpoint-folio">{folio}</span>
          <span className="checkpoint-tag">Checkpoint · done</span>
          <span className="checkpoint-meta">{saved.firstTryCorrect ? '✓ right first time' : saved.revealed ? 'answer shown' : `✓ after ${saved.attempts} tries`}</span>
          <span className="spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReview(true)}>
            Look again
          </button>
        </div>
        <Markdown className="checkpoint-q">{block.question}</Markdown>
        {!compact && (
          <div className="checkpoint-answer">
            <span className="eyebrow">Answer</span> <span className="option-letter">{LETTERS[block.answer]}</span> {block.options[block.answer]}
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
        <span className="checkpoint-folio">{folio}</span>
        <span className="checkpoint-tag">Before you read on</span>
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
              {state === 'correct' && <span className="option-mark" aria-label="correct">✓</span>}
              {state === 'wrong' && <span className="option-mark" aria-label="your answer, wrong">×</span>}
            </button>
          );
        })}
      </div>

      {!showResult && (
        <div className="checkpoint-actions">
          <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
            Check my answer
          </button>
          {wrong.size > 0 && !passed && (
            <button type="button" className="btn btn-ghost" onClick={reveal}>
              Show me the answer
            </button>
          )}
          <span className="checkpoint-hint">Think it through first. A wrong answer costs nothing.</span>
        </div>
      )}

      {showResult && isCorrect && (
        <div className="feedback feedback-correct">
          <Stamp ok>{feedback.revealed ? `Answer: ${LETTERS[block.answer]}` : 'Correct'}</Stamp>
          {!feedback.revealed && saved && saved.attempts > 1 && <p className="feedback-line">You got there.</p>}
          <Markdown>{block.explanation}</Markdown>
        </div>
      )}

      {showResult && !isCorrect && (
        <div className="feedback feedback-wrong">
          <Stamp ok={false} />
          {block.misconceptions?.[feedback.choice] && <Markdown>{block.misconceptions[feedback.choice]}</Markdown>}
          {block.deeper && (
            <div className="feedback-deeper">
              <div className="feedback-subtitle">Another way to see it</div>
              <Markdown>{block.deeper}</Markdown>
            </div>
          )}
          <div className="checkpoint-actions">
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
