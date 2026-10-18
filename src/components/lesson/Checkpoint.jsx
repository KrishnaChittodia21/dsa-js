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
      <section className="ls-qc ls-qc--done" aria-label="Checkpoint (answered)">
        <div className="ls-qc-head">
          <span className="eyebrow ls-qc-k">
            <Icon name="checkCircle" size={14} /> Checkpoint · answered
          </span>
          <span className="tag">{saved.firstTryCorrect ? 'first try' : saved.revealed ? 'answer revealed' : `after ${saved.attempts} attempts`}</span>
          <span className="spacer" />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReview(true)}>
            Review
          </button>
        </div>
        <Markdown className="ls-qc-q">{block.question}</Markdown>
        {!compact && (
          <div className="ls-qc-ans">
            <span className="ls-qc-ans-k">{LETTERS[block.answer]}</span>
            <Markdown className="inline-md">{block.options[block.answer]}</Markdown>
          </div>
        )}
      </section>
    );
  }

  const showResult = !!feedback;
  const isCorrect = feedback?.correct;

  return (
    <section className={`ls-qc ${showResult ? (isCorrect ? 'ls-qc--ok' : 'ls-qc--bad') : ''}`} role="group" aria-labelledby={`${block.id}-q`}>
      <div className="ls-qc-head">
        <span className="eyebrow ls-qc-k">
          <i className="pip pip--uv" />
          Checkpoint · before continuing
        </span>
        {wrong.size > 0 && !showResult && <span className="tag">{wrong.size} ruled out</span>}
        {review && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setReview(false);
                setFeedback(null);
                setSelected(null);
              }}
            >
              Close
            </button>
          </>
        )}
      </div>
      <div id={`${block.id}-q`}>
        <Markdown className="ls-qc-q">{block.question}</Markdown>
      </div>
      <div className="options" role="radiogroup" aria-labelledby={`${block.id}-q`}>
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
              {state === 'correct' && <span className="ls-qc-res ls-qc-res--ok">CORRECT</span>}
              {state === 'wrong' && <span className="ls-qc-res ls-qc-res--bad">NOT IT</span>}
              {eliminated && <span className="ls-qc-res">RULED OUT</span>}
            </button>
          );
        })}
      </div>

      {!showResult && (
        <div className="ls-qc-act">
          <button type="button" className="btn btn--plasma" disabled={selected === null} onClick={submit}>
            Check answer
          </button>
          {wrong.size > 0 && !passed && (
            <button type="button" className="btn btn--ghost" onClick={reveal}>
              Show me the answer
            </button>
          )}
          <span className="ls-qc-hint">Think it through first — there is no penalty for being wrong.</span>
        </div>
      )}

      {showResult && isCorrect && (
        <div className="feedback feedback-correct" role="status">
          <div className="feedback-title">
            <Icon name="checkCircle" size={17} /> {feedback.revealed ? `The answer is ${LETTERS[block.answer]}.` : saved && saved.attempts > 1 ? 'Correct — you got there!' : 'Correct!'}
          </div>
          <Markdown>{block.explanation}</Markdown>
        </div>
      )}

      {showResult && !isCorrect && (
        <div className="feedback feedback-wrong" role="status">
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
          <div className="ls-qc-act">
            <button type="button" className="btn btn--plasma" onClick={retry}>
              Try again
            </button>
            <button type="button" className="btn btn--ghost" onClick={reveal}>
              Show me the answer
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
