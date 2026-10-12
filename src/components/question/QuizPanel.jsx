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
    <div className="quiz">
      <div className={`checkpoint ${result ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`}>
        <div className="checkpoint-head">
          <span className="checkpoint-tag">
            <Icon name="help" size={15} /> Your answer
          </span>
        </div>
        <div className="options">
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
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary" disabled={selected === null} onClick={submit}>
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
            <div className="row" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => { setResult(null); setSelected(null); }}>
                Try again
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResult({ choice: quiz.answer, correct: true })}>
                Show explanation
              </button>
            </div>
          </div>
        )}
      </div>
      {result?.correct && question.approach && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h4>How to analyse it</h4>
          <Markdown>{question.approach}</Markdown>
        </div>
      )}
    </div>
  );
}
