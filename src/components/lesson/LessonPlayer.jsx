import { useEffect, useMemo, useRef, useState } from 'react';
import Block from './Block.jsx';
import Icon from '../ui/Icon.jsx';
import { ProgressBar } from '../ui/primitives.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { checkpointPassed } from '../../state/selectors.js';
import { getCheckpoints } from '../../content/index.js';

/**
 * Walks through a topic's lesson section by section.
 * Inside a section, content after an unanswered checkpoint stays hidden — the lesson
 * waits for the learner's answer before it continues explaining.
 */
export default function LessonPlayer({ topic, onFinish }) {
  const { progress, dispatch } = useProgress();
  const sections = topic.lesson.sections;
  const tState = progress.topics[topic.id] || {};
  const [mode, setMode] = useState(tState.lessonCompleted ? 'full' : 'guided');
  const index = Math.min(tState.sectionIndex || 0, Math.max(0, sections.length - 1));
  const topRef = useRef(null);

  const go = (i) => {
    dispatch({ type: 'LESSON_SET_SECTION', topicId: topic.id, index: i });
  };

  useEffect(() => {
    if (mode === 'guided') topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [index, mode]);

  const sectionDone = (s) =>
    (s.blocks || []).every((b) => b.type !== 'checkpoint' || checkpointPassed(progress, b.id));

  const allCheckpoints = useMemo(() => getCheckpoints(topic), [topic]);
  const passedCount = allCheckpoints.filter((c) => checkpointPassed(progress, c.id)).length;

  if (!sections.length) {
    return <div className="card muted">This lesson is being written. Check back soon — practice questions may already be available.</div>;
  }

  const renderBlocks = (section, gated) => {
    const out = [];
    for (let i = 0; i < section.blocks.length; i++) {
      const b = section.blocks[i];
      out.push(
        <div className="lesson-block" key={`${section.id}-${i}`}>
          <Block block={b} topicId={topic.id} blockKey={`${topic.id}:${section.id}:${i}`} />
        </div>,
      );
      if (gated && b.type === 'checkpoint' && !checkpointPassed(progress, b.id)) {
        const remaining = section.blocks.length - i - 1;
        if (remaining > 0)
          out.push(
            <div className="lesson-wait" key="wait">
              <Icon name="lock" size={14} /> Answer the question above to continue the lesson.
            </div>,
          );
        break;
      }
    }
    return out;
  };

  const current = sections[index];
  const currentDone = sectionDone(current);
  const isLast = index === sections.length - 1;

  return (
    <div className="lesson" ref={topRef}>
      <aside className="lesson-nav" aria-label="Lesson sections">
        <div className="lesson-nav-head">
          <div className="small muted">
            Checkpoints {passedCount}/{allCheckpoints.length}
          </div>
          <ProgressBar value={mode === 'full' || tState.lessonCompleted ? sections.length : index} max={sections.length} size="sm" label="Lesson progress" />
        </div>
        <ol className="lesson-nav-list">
          {sections.map((s, i) => {
            const reached = i <= (tState.maxSectionIndex || 0) || tState.lessonCompleted;
            const done = (reached && sectionDone(s) && i < index) || tState.lessonCompleted;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`lesson-nav-item ${mode === 'guided' && i === index ? 'active' : ''}`}
                  onClick={() => {
                    if (mode === 'full') document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    else if (reached || i <= index) go(i);
                  }}
                  disabled={mode === 'guided' && !reached && i > index}
                >
                  <span className={`lesson-nav-dot ${done ? 'done' : ''}`}>{done ? <Icon name="check" size={11} strokeWidth={3} /> : i + 1}</span>
                  <span>{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="lesson-mode">
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => setMode(mode === 'guided' ? 'full' : 'guided')}>
            <Icon name={mode === 'guided' ? 'book' : 'play'} size={14} /> {mode === 'guided' ? 'Show full lesson' : 'Guided mode'}
          </button>
        </div>
      </aside>

      <div className="lesson-content">
        {mode === 'guided' ? (
          <>
            <div className="lesson-section-head">
              <span className="badge badge-accent">
                Step {index + 1} of {sections.length}
              </span>
              <h2>{current.title}</h2>
            </div>
            <div className="lesson-blocks">{renderBlocks(current, true)}</div>
            <div className="lesson-footer">
              <button type="button" className="btn" disabled={index === 0} onClick={() => go(index - 1)}>
                <Icon name="chevronLeft" size={16} /> Previous
              </button>
              <span className="spacer" />
              {!currentDone && <span className="small muted">Answer the checkpoint to unlock the next step</span>}
              {isLast ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!currentDone}
                  onClick={() => {
                    dispatch({ type: 'LESSON_COMPLETE', topicId: topic.id });
                    onFinish?.();
                  }}
                >
                  <Icon name="trophy" size={16} /> {tState.lessonCompleted ? 'Lesson complete — practice' : 'Complete lesson'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" disabled={!currentDone} onClick={() => go(index + 1)}>
                  Next: {sections[index + 1].title} <Icon name="chevronRight" size={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {sections.map((s) => (
              <section key={s.id} id={`sec-${s.id}`} className="lesson-full-section">
                <h2>{s.title}</h2>
                <div className="lesson-blocks">{renderBlocks(s, false)}</div>
              </section>
            ))}
            {!tState.lessonCompleted && (
              <div className="lesson-footer">
                <span className="spacer" />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={passedCount < allCheckpoints.length}
                  onClick={() => {
                    dispatch({ type: 'LESSON_COMPLETE', topicId: topic.id });
                    onFinish?.();
                  }}
                >
                  {passedCount < allCheckpoints.length ? `Answer all checkpoints (${passedCount}/${allCheckpoints.length})` : 'Complete lesson'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
