import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Box, Compass, Download, Keyboard, ListTree, Menu, RefreshCw, RotateCcw, Save, Search, Target, X } from 'lucide-react';
import { allQuestions, stages, topics } from '../../content/index.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { nextStep } from '../../lib/nextStep.js';
import { useFocusTrap } from '../../lib/useFocusTrap.js';
import { LOOP, TAB_META } from './studyLoop.js';

const STEP_TITLES = ['What this is', 'The study loop', 'Finding your way', 'Your progress', 'Start here'];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Welcome tour: shown once on first visit, re-opened from the Guide button, the "?" key or Settings. */
export default function WelcomeTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const ref = useRef(null);
  const nav = useNavigate();
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
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="tour-head">
          <span className="eyebrow">
            <Compass size={14} aria-hidden="true" /> Guide · {step + 1}/{STEP_TITLES.length}
          </span>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Close the guide" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="tour-body" aria-live="polite">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: 24 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * dir }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {step === 0 && (
                <>
                  <h2 id="tour-title">Welcome to DSA Journey</h2>
                  <p>
                    Learn data structures and algorithms in JavaScript, one pattern at a time: {topics.length} topics in {stages.length} stages, each with an
                    interactive lesson, step-through animations and practice questions ({allQuestions.length} in total) run against real tests.
                  </p>
                  <ol className="tour-phases">
                    {stages.map((st, i) => (
                      <motion.li key={st.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.2 }}>
                        <span className="tour-phase-num">{i + 1}</span>
                        <span>{st.title}</span>
                      </motion.li>
                    ))}
                  </ol>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 id="tour-title">Every topic follows the same loop</h2>
                  <p className="muted">Follow the Study path at the top of each topic, left to right.</p>
                  <ol className="tour-loop">
                    {LOOP.map((id, i) => {
                      const m = TAB_META[id];
                      const Icon = m.icon;
                      return (
                        <motion.li key={id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 * i, duration: 0.22, ease: 'easeOut' }}>
                          <span className="tour-loop-icon">
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span>
                            <strong>{m.label}</strong>
                            <span className="muted small"> {m.why}</span>
                          </span>
                        </motion.li>
                      );
                    })}
                  </ol>
                  <p className="small muted tour-note">
                    Inside every question: read it, <strong>name the pattern</strong> before any hint, then hints → approach → solution only if you need them.
                    Company Qs and the Cheatsheet sit at the end of the path.
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 id="tour-title">Where things are</h2>
                  <ul className="tour-where">
                    <li>
                      <Menu size={18} aria-hidden="true" />
                      <span>
                        <strong>Sidebar</strong>: every page, plus each stage&apos;s topics with a status dot. Hide it with the menu button.
                      </span>
                    </li>
                    <li>
                      <ListTree size={18} aria-hidden="true" />
                      <span>
                        <strong>Contents</strong>: everything on one searchable page, down to each lesson step, pattern and question.
                      </span>
                    </li>
                    <li>
                      <Search size={18} aria-hidden="true" />
                      <span>
                        <strong>Search</strong>: press {isMac ? <kbd>⌘</kbd> : <kbd>Ctrl</kbd>} <kbd>K</kbd> (or <kbd>/</kbd>) to jump to any page, topic,
                        lesson step, pattern, question or JS API.
                      </span>
                    </li>
                    <li>
                      <Target size={18} aria-hidden="true" />
                      <span>
                        <strong>Pattern Finder</strong>: stuck on a new problem? Answer a few questions and it names the pattern.
                      </span>
                    </li>
                    <li>
                      <Box size={18} aria-hidden="true" />
                      <span>
                        <strong>JavaScript</strong>: the DSA Toolkit (Heap, Trie, Union-Find…), the JS reference and a Playground.
                      </span>
                    </li>
                    <li>
                      <RefreshCw size={18} aria-hidden="true" />
                      <span>
                        <strong>Revision</strong>: weak areas and the questions to retry, worked out from your answers.
                      </span>
                    </li>
                  </ul>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 id="tour-title">Your progress saves itself</h2>
                  <ul className="tour-where">
                    <li>
                      <Save size={18} aria-hidden="true" />
                      <span>
                        Lesson steps, checkpoint answers, pattern guesses, code drafts and solved questions are saved automatically <strong>in this browser</strong>.
                        No account needed.
                      </span>
                    </li>
                    <li>
                      <Download size={18} aria-hidden="true" />
                      <span>
                        Use <strong>Progress → Export</strong> to back it up or move it to another device, and <strong>Import</strong> to restore it.
                      </span>
                    </li>
                    <li>
                      <RotateCcw size={18} aria-hidden="true" />
                      <span>It is lost if you clear this site&apos;s data or use a private window, and <strong>Progress → Reset</strong> deletes it.</span>
                    </li>
                    <li>
                      <Keyboard size={18} aria-hidden="true" />
                      <span>
                        Press <kbd>?</kbd> any time (or the <strong>Guide</strong> button) to see this tour again.
                      </span>
                    </li>
                  </ul>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 id="tour-title">Start here</h2>
                  <p>Your next step:</p>
                  <div className="tour-next">
                    <strong>{next.title}</strong>
                    {next.detail && <span className="muted small">{next.detail}</span>}
                  </div>
                  <div className="row-wrap">
                    <button type="button" className="btn btn-primary" data-autofocus onClick={() => finish(next.href)}>
                      {next.kind === 'start' ? 'Start learning' : 'Go to my next step'} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="btn" onClick={() => finish('/contents')}>
                      <ListTree size={16} aria-hidden="true" /> Show me the Contents
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="tour-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Skip
          </button>
          <div className="tour-dots" role="group" aria-label="Tour steps">
            {STEP_TITLES.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`tour-dot ${i === step ? 'on' : ''}`}
                aria-label={`Step ${i + 1}: ${t}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn btn-icon" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Back">
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            {step < STEP_TITLES.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(step + 1)} data-autofocus={step === 0 ? true : undefined}>
                Next <ArrowRight size={16} aria-hidden="true" />
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
