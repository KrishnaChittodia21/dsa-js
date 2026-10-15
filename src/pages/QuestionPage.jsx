import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProblemPanel from '../components/question/ProblemPanel.jsx';
import CodeWorkspace from '../components/question/CodeWorkspace.jsx';
import QuizPanel from '../components/question/QuizPanel.jsx';
import Icon from '../components/ui/Icon.jsx';
import { QuestionStatusIcon } from '../components/ui/primitives.jsx';
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
  if (loading || !question) return <div className="page muted small">Loading question…</div>;
  const list = topic.questions;
  const i = list.findIndex((q) => q.id === question.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const qs = progress.questions[question.id];

  return (
    <div className="qpage">
      <div className="qpage-bar">
        <Link to={`/topic/${topic.id}?tab=practice`} className="btn btn-ghost btn-sm">
          <Icon name="chevronLeft" size={15} /> {topic.title}
        </Link>
        <span className="small muted">
          Question {i + 1} of {list.length}
        </span>
        <QuestionStatusIcon status={qs?.status} />
        {qs?.timeSpentMs > 60000 && (
          <span className="small faint">
            <Icon name="clock" size={12} /> {formatDuration(qs.timeSpentMs)}
          </span>
        )}
        <span className="spacer" />
        {prev && (
          <Link to={`/topic/${topic.id}/q/${prev.id}`} className="btn btn-ghost btn-sm" title={prev.title}>
            <Icon name="chevronLeft" size={15} /> Prev
          </Link>
        )}
        {next && (
          <Link to={`/topic/${topic.id}/q/${next.id}`} className="btn btn-sm" title={next.title}>
            Next <Icon name="chevronRight" size={15} />
          </Link>
        )}
      </div>
      {question.kind === 'quiz' ? (
        <div className="qpage-single">
          <QuestionTip />
          <ProblemPanel question={question} topic={topic} />
          <QuizPanel question={question} />
        </div>
      ) : (
        <div className="qpage-split">
          <div className="qpage-left">
            <QuestionTip />
            <ProblemPanel question={question} topic={topic} />
          </div>
          <div className="qpage-right">
            <CodeWorkspace question={question} />
          </div>
        </div>
      )}
    </div>
  );
}
