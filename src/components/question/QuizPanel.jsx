import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { Stamp } from '../lesson/Checkpoint.jsx';

const LETTERS = 'ABCDEF';

export default function QuizPanel({ question }) {
  const { progress, dispatch } = useProgress();
  const qs = progress.questions[question.id] || {};
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(qs.status === 'solved' ? { choice: question.quiz.answer, correct: true } : null);
  const quiz = question.quiz;

  const submit = () => {
    const correct = selected === quiz.answer;
    dispatch({ type: 'Q_QUIZ_ANSWER', qid: question.id, choice: selected, correct });
    setResult({ choice: selected, correct });
  };

  return (
    <div className="exam-quiz">
      <div className={`checkpoint ${result ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`}>
        <div className="checkpoint-head">
          <span className="checkpoint-folio">A</span>
          <span className="checkpoint-tag">Your answer</span>
        </div>
        <div className="options" role="radiogroup">
          {quiz.options.map((opt, i) => {
            let state = '';
            if (result && i === quiz.answer && result.correct) state = 'correct';
            else if (result && i === result.choice && !result.correct) state = 'wrong';
            return (
              <button key={i} type="button" role="radio" aria-checked={selected === i} className={`option ${selected === i && !result ? 'selected' : ''} ${state}`} disabled={!!result} onClick={() => setSelected(i)}>
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
        {!result && (
          <div className="checkpoint-actions">
            <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
              Check my answer
            </button>
          </div>
        )}
        {result && result.correct && (
          <div className="feedback feedback-correct">
            <Stamp ok />
            <Markdown>{quiz.explanation}</Markdown>
          </div>
        )}
        {result && !result.correct && (
          <div className="feedback feedback-wrong">
            <Stamp ok={false} />
            <p className="feedback-line">Count the work again, one loop at a time.</p>
            {quiz.misconceptions?.[result.choice] && <Markdown>{quiz.misconceptions[result.choice]}</Markdown>}
            <div className="checkpoint-actions">
              <button type="button" className="btn btn-sm btn-primary" onClick={() => { setResult(null); setSelected(null); }}>
                Try again
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResult({ choice: quiz.answer, correct: true })}>
                Show me the answer
              </button>
            </div>
          </div>
        )}
      </div>
      {result?.correct && question.approach && (
        <section className="exam-section exam-analysis">
          <h4 className="exam-label">How to analyse it</h4>
          <Markdown>{question.approach}</Markdown>
        </section>
      )}
    </div>
  );
}
