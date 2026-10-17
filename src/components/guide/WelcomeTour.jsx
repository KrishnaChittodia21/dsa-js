import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { allQuestions, stages, topics } from '../../content/index.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { nextStep } from '../../lib/nextStep.js';
import { useFocusTrap } from '../../lib/useFocusTrap.js';
import { LOOP, TAB_META } from './studyLoop.js';

const STEP_TITLES = ['What this is', 'The study loop', 'Where things are', 'Your progress', 'Next on the desk'];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** The guide: five short pages shown once on first visit, re-opened from the Guide button, the "?" key or Settings. */
export default function WelcomeTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const ref = useRef(null);
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const { progress } = useProgress();
  const next = nextStep(progress, topics);
  const close = useCallback(() => onClose(), [onClose]);
  useFocusTrap(ref, true, close);
  // keep focus inside the dialog when the focused button disappears between steps
  useEffect(() => {
    const el = ref.current;
    if (el && !el.contains(document.activeElement)) el.focus();
  }, [step]);

  const go = (to) => {
    if (to < 0 || to >= STEP_TITLES.length) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
  };
  const finish = (href) => {
    onClose();
    nav(href);
  };
  const onKeyDown = (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(step + 1);
    if (e.key === 'ArrowLeft') go(step - 1);
  };

  const slide = (d) => (reduce ? 0 : 16 * d);
  const mod = isMac ? <kbd>⌘</kbd> : <kbd>Ctrl</kbd>;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        ref={ref}
        className="modal tour"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.3, 0.7, 0.1, 1] }}
      >
        <div className="tour-head">
          <span className="eyebrow">The guide</span>
          <span className="row">
            <span className="folio">
              p. {step + 1} of {STEP_TITLES.length}
            </span>
            <button type="button" className="btn btn-ghost btn-close" aria-label="Close the guide" onClick={onClose}>
              ×
            </button>
          </span>
        </div>
        <div className="tour-body" aria-live="polite">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: slide(dir) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slide(-dir) }}
              transition={{ duration: 0.18, ease: [0.3, 0.7, 0.1, 1] }}
            >
              {step === 0 && (
                <>
                  <h2 id="tour-title">
                    A notebook for learning <em>data structures &amp; algorithms</em> in JavaScript
                  </h2>
                  <p>
                    {topics.length} topics in {stages.length} stages, one pattern at a time. Each topic has a lesson that stops to ask you questions, animations you
                    can step through, and practice problems ({allQuestions.length} in all) checked against real tests.
                  </p>
                  <span className="eyebrow">Contents</span>
                  <ol className="tour-phases">
                    {stages.map((st, i) => (
                      <li key={st.id}>
                        <span className="tour-phase-num">§ {i + 1}</span>
                        <span>{st.title}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 id="tour-title">Every topic, the same four steps</h2>
                  <p>The study path along the top of each topic runs left to right.</p>
                  <ol className="tour-loop">
                    {LOOP.map((id, i) => {
                      const m = TAB_META[id];
                      return (
                        <li key={id}>
                          <span className="tour-loop-num" aria-hidden="true">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>
                            <strong>{m.label}</strong>
                            <span className="muted small">{m.why}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="tour-note">
                    Inside a question: read it, <strong>name the pattern</strong> before you open a hint, and only then reach for hints, the approach or the
                    solution. Company questions and the cheatsheet sit at the end of the path.
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 id="tour-title">Where things are</h2>
                  <dl className="tour-where">
                    <div>
                      <dt>Index</dt>
                      <dd>Top right. Every page and every topic, with a mark for how far you&apos;ve got.</dd>
                    </div>
                    <div>
                      <dt>Contents</dt>
                      <dd>The whole course on one searchable page, down to each lesson step, pattern and question.</dd>
                    </div>
                    <div>
                      <dt>Search</dt>
                      <dd>
                        Press {mod} <kbd>K</kbd> or <kbd>/</kbd> to jump to any page, topic, lesson step, pattern, question or JS API.
                      </dd>
                    </div>
                    <div>
                      <dt>Pattern finder</dt>
                      <dd>Stuck on a new problem? Answer a few questions and it names the pattern.</dd>
                    </div>
                    <div>
                      <dt>JavaScript</dt>
                      <dd>The DSA toolkit (Heap, Trie, Union-Find…), the JS reference and a playground.</dd>
                    </div>
                    <div>
                      <dt>Revision</dt>
                      <dd>Your weak spots and the questions worth another go, worked out from your answers.</dd>
                    </div>
                  </dl>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 id="tour-title">Your progress saves itself</h2>
                  <dl className="tour-where">
                    <div>
                      <dt>Saved here</dt>
                      <dd>
                        Lesson steps, checkpoint answers, pattern guesses, code drafts and solved questions stay <strong>in this browser</strong>. There&apos;s
                        no account.
                      </dd>
                    </div>
                    <div>
                      <dt>Back it up</dt>
                      <dd>
                        <strong>Progress → Export</strong> saves a file you can carry to another device; <strong>Import</strong> brings it back.
                      </dd>
                    </div>
                    <div>
                      <dt>Lost when</dt>
                      <dd>
                        you clear this site&apos;s data or use a private window. <strong>Progress → Reset</strong> deletes it on purpose.
                      </dd>
                    </div>
                    <div>
                      <dt>This guide</dt>
                      <dd>
                        Press <kbd>?</kbd> on any page, or the <strong>Guide</strong> link at the top.
                      </dd>
                    </div>
                  </dl>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 id="tour-title">Next on the desk</h2>
                  <div className="tour-next">
                    <strong>{next.title}</strong>
                    {next.detail && <span>{next.detail}</span>}
                  </div>
                  <div className="row-wrap">
                    <button type="button" className="btn btn-primary" data-autofocus onClick={() => finish(next.href)}>
                      {next.kind === 'start' ? 'Start the first lesson' : 'Open my next step'} <span aria-hidden="true">→</span>
                    </button>
                    <button type="button" className="btn" onClick={() => finish('/contents')}>
                      Show me the contents
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="tour-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Skip for now
          </button>
          <div className="tour-dots" role="group" aria-label="Guide pages">
            {STEP_TITLES.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`tour-dot ${i === step ? 'on' : ''}`}
                aria-label={`Page ${i + 1}: ${t}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous page">
              <span aria-hidden="true">←</span>
            </button>
            {step < STEP_TITLES.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(step + 1)} data-autofocus={step === 0 ? true : undefined}>
                Next <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button type="button" className="btn" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
