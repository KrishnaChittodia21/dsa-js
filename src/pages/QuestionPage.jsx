import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProblemPanel from '../components/question/ProblemPanel.jsx';
import CodeWorkspace from '../components/question/CodeWorkspace.jsx';
import QuizPanel from '../components/question/QuizPanel.jsx';
import PatternVisual, { hasVisual } from '../components/PatternVisual.jsx';
import Icon from '../components/ui/Icon.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { formatDuration } from '../state/selectors.js';
import { questionById, topicById, patternById } from '../content/index.js';
import { bigoClass } from '../visualizations/complexity.js';
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

const DIFF_CHIP = { Easy: 'chip--easy', Medium: 'chip--med', Hard: 'chip--hard' };

function StatusChip({ qs }) {
  if (qs?.status === 'solved') return <span className="chip chip--solved">Solved</span>;
  const tries = (qs?.runs || 0) + (qs?.submissions || 0);
  if (qs?.status === 'attempted')
    return (
      <span className="chip chip--attempted">
        Attempted · <span className="mono">{tries}</span> {tries === 1 ? 'run' : 'runs'}
      </span>
    );
  return <span className="chip chip--todo">Not started</span>;
}

/*
 * Layout note (dock): the shell renders this route in "fill" mode (.main-fill — a viewport-tall box
 * that already stops above the floating dock). `.qp` is the page's own scroll container and extends
 * under the dock by --dock-space (so content scrolls behind it like every other page), while the
 * editor column is sticky and sized with calc(100dvh − --status-h − --dock-space) so the dock never
 * covers the editor or the Run/Submit console. No shell change is needed.
 */
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
      <div className="qp">
        <div className="qp-in qp-loading">Loading question…</div>
      </div>
    );
  const list = topic.questions;
  const i = list.findIndex((q) => q.id === question.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const qs = progress.questions[question.id] || {};
  const solved = qs.status === 'solved';
  const guessed = !!qs.patternGuess;
  const pattern = patternById[question.pattern];
  const unlocked = solved || !!qs.solutionViewed;
  const hints = question.hints?.length || 0;
  const tags = meta.tags || question.tags || [];
  const src = question.source || meta.source;
  const quiz = question.kind === 'quiz';

  return (
    <div className="qp">
      <div className="qp-in">
        <div className="qp-bar rise">
          <Link to={`/topic/${topic.id}?tab=practice`} className="qp-crumb" title={`Back to ${topic.title}`}>
            <Icon name="chevronLeft" size={14} />
            <span className="qp-crumb-path">~/{topic.id}/</span>
            <b>
              question {i + 1} of {list.length}
            </b>
          </Link>
          <StatusChip qs={qs} />
          <span className="qp-sp" />
          {qs.timeSpentMs > 60000 && (
            <span className="qp-timer" title="Time spent on this question (counted while the tab is visible)">
              <Icon name="clock" size={14} /> {formatDuration(qs.timeSpentMs)} <span className="qp-timer-l">on this problem</span>
            </span>
          )}
          <div className="qp-nav">
            {prev ? (
              <Link to={`/topic/${topic.id}/q/${prev.id}`} className="btn btn--ghost btn--sm" title={prev.title}>
                <Icon name="chevronLeft" size={15} /> Prev
              </Link>
            ) : null}
            {next ? (
              <Link to={`/topic/${topic.id}/q/${next.id}`} className="btn btn--ghost btn--sm" title={next.title}>
                Next <Icon name="chevronRight" size={15} />
              </Link>
            ) : null}
          </div>
        </div>

        <QuestionTip />

        <header className="qp-head rise" style={{ '--i': 1 }}>
          <div className="qp-head-main">
            <div className="qp-tags">
              {src?.platform === 'LeetCode' &&
                (src.url ? (
                  <a className="tag qp-tag-link" href={src.url} target="_blank" rel="noreferrer">
                    LeetCode {src.number ? `#${src.number}` : ''}
                    {src.premium ? ' · premium' : ''} <Icon name="external" size={11} />
                  </a>
                ) : (
                  <span className="tag">LeetCode {src.number ? `#${src.number}` : ''}</span>
                ))}
              {src?.platform === 'Classic' && <span className="tag">Classic problem</span>}
              {question.difficulty && (
                <span className={`chip ${DIFF_CHIP[question.difficulty] || ''}`}>
                  <span className="diff-pips">
                    <i />
                    <i />
                    <i />
                  </span>
                  {question.difficulty}
                </span>
              )}
              {pattern && (guessed || solved) && (
                <span className="chip qp-chip--uv">
                  <i className="pip pip--uv" />
                  {pattern.name}
                </span>
              )}
              {tags.slice(0, 4).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="display display--s chrome qp-title">{question.title}</h1>
          </div>
          {!quiz && (
            <div className="qp-stats">
              <div>
                <span className="eyebrow">target</span>
                {unlocked && question.complexity ? (
                  <span className="qp-stats-bigo">
                    <span className={`bigo ${bigoClass(question.complexity.time)}`}>{question.complexity.time}</span>
                    <span className={`bigo ${bigoClass(question.complexity.space)}`}>{question.complexity.space}</span>
                  </span>
                ) : (
                  <span className="tag" title="Shown once you solve it (or open the solution)">
                    <Icon name="lock" size={11} /> after you solve
                  </span>
                )}
              </div>
              <div>
                <span className="eyebrow">tests</span>
                <span className="qp-stats-n">
                  {qs.lastResult ? qs.lastResult.passed : '—'}
                  <small> / {qs.lastResult ? qs.lastResult.total : question.tests?.length || 0}</small>
                </span>
              </div>
              {hints > 0 && (
                <div>
                  <span className="eyebrow">hints</span>
                  <span className="qp-stats-n">
                    {Math.min(qs.hintsRevealed || 0, hints)}
                    <small> / {hints}</small>
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {quiz ? (
          <div className="qp-single">
            <section className="tile qp-prob-tile rise" style={{ '--i': 2 }} aria-label="Problem">
              <ProblemPanel question={question} topic={topic} />
            </section>
            <QuizPanel question={question} />
          </div>
        ) : (
          <div className="qp-ws">
            <section className="tile qp-prob-tile rise" style={{ '--i': 2 }} aria-label="Problem">
              <ProblemPanel question={question} topic={topic} />
            </section>
            <div className="qp-ws-right rise" style={{ '--i': 3 }}>
              <CodeWorkspace question={question} />
            </div>
          </div>
        )}

        {!quiz && pattern && hasVisual(pattern) && (
          <section className="qp-motion" aria-label="Pattern in motion">
            {guessed ? (
              <PatternVisual pattern={pattern} eyebrow={`pattern in motion · ${pattern.name}`} />
            ) : (
              <div className="tile qp-motion-lock">
                <Icon name="lock" size={16} />
                <div>
                  <b>Pattern in motion</b>
                  <p>A step-through animation of this problem&apos;s pattern unlocks once you answer “Name the pattern first” — watching it now would give the answer away.</p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
