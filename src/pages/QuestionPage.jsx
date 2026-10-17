import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProblemPanel from '../components/question/ProblemPanel.jsx';
import CodeWorkspace from '../components/question/CodeWorkspace.jsx';
import QuizPanel from '../components/question/QuizPanel.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { formatDuration } from '../state/selectors.js';
import { questionById, topicById } from '../content/index.js';
import NotFound from './NotFound.jsx';
import { useQuestion } from '../content/useContent.js';

// Track time spent while the tab is visible.
function useTimeTracking(qid, dispatch) {
  useEffect(() => {
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      const ms = now - last;
      last = now;
      if (document.visibilityState === 'visible' && ms > 0 && ms < 5 * 60 * 1000) dispatch({ type: 'Q_TIME', qid, ms });
    };
    const iv = setInterval(flush, 20000);
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
      else last = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      flush();
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [qid, dispatch]);
}

const QuestionTip = () => (
  <CoachTip id="page:question" title="Work it like an interview.">
    Read it, name the pattern, open hints only if stuck, then code, Run and Submit. Opening the solution before you solve it means the solve won&apos;t count as
    clean in your weak-area score.
  </CoachTip>
);

export default function QuestionPage() {
  const { topicId, questionId } = useParams();
  const { progress, dispatch } = useProgress();
  const meta = questionById[questionId];
  const topic = topicById[meta?.topicId || topicId];
  const { data: question, loading } = useQuestion(questionId);

  useEffect(() => {
    if (meta) dispatch({ type: 'Q_OPEN', qid: meta.id, topicId: meta.topicId });
  }, [meta, dispatch]);
  useTimeTracking(questionId, dispatch);

  if (!meta || !topic) return <NotFound />;
  if (loading || !question)
    return (
      <div className="page qp-loading" aria-label="Loading the question">
        <div className="skeleton">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  const list = topic.questions;
  const i = list.findIndex((q) => q.id === question.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const qs = progress.questions[question.id];

  const mark = qs?.status === 'solved' ? ['✓', 'Solved'] : qs?.status === 'attempted' ? ['◐', 'Attempted'] : ['○', 'Not started'];

  return (
    <div className="qp">
      <nav className="qp-bar" aria-label="Question navigation">
        <Link to={`/topic/${topic.id}?tab=practice`} className="qp-back">
          <span aria-hidden="true">← </span>
          {topic.title}
        </Link>
        <span className="qp-folio folio">
          Q {i + 1} <span className="qp-of">of {list.length}</span>
        </span>
        <span className={`qp-status qp-status-${qs?.status || 'todo'}`}>
          <span aria-hidden="true">{mark[0]}</span> {mark[1]}
        </span>
        {qs?.timeSpentMs > 60000 && <span className="qp-time folio">{formatDuration(qs.timeSpentMs)} on this one</span>}
        <span className="qp-spacer" />
        {prev && (
          <Link to={`/topic/${topic.id}/q/${prev.id}`} className="qp-step" title={prev.title}>
            <span aria-hidden="true">← </span>Previous
          </Link>
        )}
        {next && (
          <Link to={`/topic/${topic.id}/q/${next.id}`} className="qp-step qp-step-next" title={next.title}>
            Next<span aria-hidden="true"> →</span>
          </Link>
        )}
      </nav>
      {question.kind === 'quiz' ? (
        <div className="qp-single">
          <QuestionTip />
          <ProblemPanel question={question} topic={topic} />
          <QuizPanel question={question} />
        </div>
      ) : (
        <div className="qp-split">
          <div className="qp-left">
            <QuestionTip />
            <ProblemPanel question={question} topic={topic} />
          </div>
          <div className="qp-right">
            <CodeWorkspace question={question} />
          </div>
        </div>
      )}
    </div>
  );
}
