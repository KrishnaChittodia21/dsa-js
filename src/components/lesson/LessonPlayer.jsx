import { useEffect, useMemo, useRef, useState } from 'react';
import Block from './Block.jsx';
import { ProgressBar } from '../ui/primitives.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { checkpointPassed } from '../../state/selectors.js';
import { getCheckpoints } from '../../content/index.js';

/**
 * Walks through a topic's lesson section by section.
 * Inside a section, content after an unanswered checkpoint stays hidden — the lesson
 * waits for the learner's answer before it continues explaining.
 * Layout: a notebook page — a slim margin rail of § numbers beside a ~68ch text column.
 */
export default function LessonPlayer({ topic, onFinish, initialSection, onSectionApplied }) {
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

  // deep link from Contents / search: ?s=<step>. Guided mode only jumps to steps already reached.
  useEffect(() => {
    if (initialSection === undefined || !sections.length) return;
    const i = Math.min(initialSection, sections.length - 1);
    if (mode === 'full') requestAnimationFrame(() => document.getElementById(`sec-${sections[i].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    else if (tState.lessonCompleted || i <= (tState.maxSectionIndex || 0)) go(i);
    onSectionApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection]);

  const sectionDone = (s) =>
    (s.blocks || []).every((b) => b.type !== 'checkpoint' || checkpointPassed(progress, b.id));

  const allCheckpoints = useMemo(() => getCheckpoints(topic), [topic]);
  const passedCount = allCheckpoints.filter((c) => checkpointPassed(progress, c.id)).length;
  // checkpoint id → its number in the lesson, printed as the index card's folio ("Q 3")
  const cpNumber = useMemo(() => new Map(allCheckpoints.map((c, i) => [c.id, i + 1])), [allCheckpoints]);

  if (!sections.length) {
    return <p className="lesson-empty">This lesson is still being written. The practice questions may already be open — try one.</p>;
  }

  const renderBlocks = (section, gated) => {
    const out = [];
    for (let i = 0; i < section.blocks.length; i++) {
      const b = section.blocks[i];
      out.push(
        <div className={`lesson-block lesson-block-${b.type}`} key={`${section.id}-${i}`}>
          <Block block={b} topicId={topic.id} blockKey={`${topic.id}:${section.id}:${i}`} number={b.type === 'checkpoint' ? cpNumber.get(b.id) : undefined} />
        </div>,
      );
      if (gated && b.type === 'checkpoint' && !checkpointPassed(progress, b.id)) {
        const remaining = section.blocks.length - i - 1;
        if (remaining > 0)
          out.push(
            <p className="lesson-wait" key="wait">
              The rest of this section waits for your answer above.
            </p>,
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
      <nav className="lesson-rail" aria-label="Lesson sections">
        <div className="lesson-rail-head">
          <span className="eyebrow">Sections</span>
          <span className="folio">
            {passedCount}/{allCheckpoints.length} checks
          </span>
        </div>
        <ProgressBar value={mode === 'full' || tState.lessonCompleted ? sections.length : index} max={sections.length} size="sm" label="Lesson progress" />
        <ol className="lesson-toc">
          {sections.map((s, i) => {
            const reached = i <= (tState.maxSectionIndex || 0) || tState.lessonCompleted;
            const done = (reached && sectionDone(s) && i < index) || tState.lessonCompleted;
            const active = mode === 'guided' && i === index;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`lesson-toc-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  onClick={() => {
                    if (mode === 'full') document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    else if (reached || i <= index) go(i);
                  }}
                  disabled={mode === 'guided' && !reached && i > index}
                >
                  <span className="lesson-toc-num">§ {i + 1}</span>
                  <span className="lesson-toc-title">{s.title}</span>
                  {done && (
                    <span className="lesson-toc-mark" aria-label="done">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="lesson-mode" onClick={() => setMode(mode === 'guided' ? 'full' : 'guided')}>
          {mode === 'guided' ? 'Read the whole lesson on one page' : 'Go back to one step at a time'}
        </button>
      </nav>

      <div className="lesson-content">
        {mode === 'guided' ? (
          <>
            <header className="lesson-section-head">
              <span className="eyebrow">
                § {index + 1} <span aria-hidden="true">·</span> step {index + 1} of {sections.length}
              </span>
              <h2>{current.title}</h2>
            </header>
            <div className="lesson-blocks">{renderBlocks(current, true)}</div>
            <div className="lesson-footer">
              <button type="button" className="btn" disabled={index === 0} onClick={() => go(index - 1)}>
                ← Previous
              </button>
              <span className="spacer" />
              {!currentDone && <span className="lesson-footer-note">Answer the checkpoint to turn the page.</span>}
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
                  {tState.lessonCompleted ? 'Lesson done — open the practice set' : 'Finish the lesson'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary lesson-next" disabled={!currentDone} onClick={() => go(index + 1)}>
                  <span className="lesson-next-k">Next</span> {sections[index + 1].title} →
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {sections.map((s, i) => (
              <section key={s.id} id={`sec-${s.id}`} className="lesson-full-section">
                <header className="lesson-section-head">
                  <span className="eyebrow">§ {i + 1}</span>
                  <h2>{s.title}</h2>
                </header>
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
                  {passedCount < allCheckpoints.length ? `Answer every checkpoint first (${passedCount}/${allCheckpoints.length})` : 'Finish the lesson'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
