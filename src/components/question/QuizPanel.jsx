import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

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
    <div className="qp-quiz">
      <section className={`tile qp-quiz-card ${result ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`} aria-label="Your answer">
        <div className="qp-quiz-h">
          <span className="eyebrow">
            <i className="pip pip--uv" />
            Your answer
          </span>
          {result && <span className={`chip ${result.correct ? 'qp-chip--ok' : 'qp-chip--bad'}`}>{result.correct ? 'Correct' : 'Not quite'}</span>}
        </div>
        <div className="options" role="radiogroup" aria-label="Answer options">
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
              </button>
            );
          })}
        </div>
        {!result && (
          <div className="qp-row qp-quiz-act">
            <button type="button" className="btn btn--plasma btn--sm" disabled={selected === null} onClick={submit}>
              Check answer
            </button>
          </div>
        )}
        {result && result.correct && (
          <div className="feedback feedback-correct">
            <div className="feedback-title">
              <Icon name="checkCircle" size={17} /> Correct!
            </div>
            <Markdown>{quiz.explanation}</Markdown>
          </div>
        )}
        {result && !result.correct && (
          <div className="feedback feedback-wrong">
            <div className="feedback-title">
              <Icon name="alert" size={17} /> Not quite — count the work again.
            </div>
            {quiz.misconceptions?.[result.choice] && <Markdown>{quiz.misconceptions[result.choice]}</Markdown>}
            <div className="qp-row qp-quiz-act">
              <button type="button" className="btn btn--plasma btn--sm" onClick={() => { setResult(null); setSelected(null); }}>
                Try again
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setResult({ choice: quiz.answer, correct: true })}>
                Show explanation
              </button>
            </div>
          </div>
        )}
      </section>
      {result?.correct && question.approach && (
        <section className="tile qp-quiz-card">
          <span className="eyebrow">
            <i className="pip pip--ice" />
            How to analyse it
          </span>
          <div className="qp-rung-body">
            <Markdown>{question.approach}</Markdown>
          </div>
        </section>
      )}
    </div>
  );
}
