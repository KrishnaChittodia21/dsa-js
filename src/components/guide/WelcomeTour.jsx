import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Code2,
  Compass,
  Download,
  House,
  Keyboard,
  LayoutGrid,
  Layers,
  ListTree,
  RotateCcw,
  Route,
  Save,
  Search,
  SquareTerminal,
  Target,
  X,
} from 'lucide-react';
import { allQuestions, stages, topics } from '../../content/index.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { topicStatus } from '../../state/selectors.js';
import { nextStep } from '../../lib/nextStep.js';
import { useFocusTrap } from '../../lib/useFocusTrap.js';
import { LOOP, TAB_META } from './studyLoop.js';

const STEP_TITLES = ['What this is', 'The study loop', 'Finding your way', 'Your progress', 'Start here'];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

/* ---------- voxel art, one per step (decorative; the copy says the same thing) ---------- */

/** step 1: the stages as a voxel staircase — plasma = done, ultraviolet = current, ghost = ahead */
function ArtStairs({ state }) {
  return (
    <div className="wt-stairs">
      {state.map((s, i) => (
        <div key={i} className={`vox ${s === 'done' ? '' : s === 'cur' ? 'vox--uv' : 'vox--ghost'}`} style={{ '--h': i + 1 }} />
      ))}
    </div>
  );
}

/** step 2: the study loop — four stations on one isometric track, light flowing forward */
function ArtLoop() {
  // diamond track: Learn (left) → Visualize (top) → Practice (right) → Review (bottom)
  const st = [
    { id: 'learn', x: 70, y: 110, h: 30, cls: 'uv', lx: 70, ly: 156, anchor: 'middle' },
    { id: 'visualize', x: 230, y: 30, h: 42, cls: 'hot', lx: 278, ly: 30, anchor: 'start' },
    { id: 'practice', x: 390, y: 110, h: 22, cls: 'ghost', lx: 390, ly: 156, anchor: 'middle' },
    { id: 'review', x: 230, y: 190, h: 12, cls: 'ghost', lx: 278, ly: 210, anchor: 'start' },
  ];
  const cube = ({ x, y, h, cls }) => {
    const w = 26;
    const d = 15;
    const top = `${x},${y - h - d} ${x + w},${y - h} ${x},${y - h + d} ${x - w},${y - h}`;
    const left = `${x - w},${y - h} ${x},${y - h + d} ${x},${y + d} ${x - w},${y}`;
    const right = `${x},${y - h + d} ${x + w},${y - h} ${x + w},${y} ${x},${y + d}`;
    return (
      <g className={`wt-st wt-st--${cls}`}>
        <polygon className="wt-st-l" points={left} />
        <polygon className="wt-st-r" points={right} />
        <polygon className="wt-st-t" points={top} />
      </g>
    );
  };
  const track = 'M70,110 L230,30 L390,110 L230,190 Z';
  return (
    <svg className="wt-loop" viewBox="0 -36 470 262" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wtFlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CFC4FF" />
          <stop offset=".5" stopColor="#7B5CFF" />
          <stop offset="1" stopColor="#FF2E88" />
        </linearGradient>
      </defs>
      <polygon className="wt-floor" points="10,110 230,0 450,110 230,220" />
      <path className="wt-rail" d={track} />
      <path className="wt-flow" d={track} />
      <text className="wt-mid" x="230" y="106" textAnchor="middle">
        EVERY TOPIC
      </text>
      <text className="wt-mid" x="230" y="122" textAnchor="middle">
        SAME LOOP
      </text>
      <ellipse className="wt-ping" cx="70" cy="110" rx="40" ry="22" />
      {st.map((s) => (
        <g key={s.id}>{cube(s)}</g>
      ))}
      {st.map((s, i) => (
        <text key={s.id} className={`wt-n ${s.cls === 'uv' ? 'wt-n--uv' : ''}`} x={s.lx} y={s.ly} textAnchor={s.anchor}>
          {`0${i + 1} · ${TAB_META[s.id].label.toUpperCase()}`}
        </text>
      ))}
    </svg>
  );
}

const DOCK_ICONS = [House, Route, ListTree, Layers, Code2, Activity, RotateCcw, Award];

/** step 3: the floating dock with its More key, the `?` keycap and ⌘K search */
function ArtDock() {
  return (
    <div className="wt-dockart">
      <span className="wt-sl">
        <i>~/journey/</i>
        <b>dashboard</b>
        <span className="wt-sl-sp" />
        <span className="kbd">?</span>
        <span className="wt-sl-k">
          <Search aria-hidden="true" />
          {MOD}K
        </span>
      </span>
      <span className="wt-dock">
        {DOCK_ICONS.map((Icon, i) => (
          <i key={i} className={i === 0 ? 'on' : ''}>
            <Icon />
          </i>
        ))}
        <i className="more">
          <LayoutGrid />
        </i>
        <i className="q">?</i>
        <b>
          <Search />
          {MOD}K
        </b>
      </span>
    </div>
  );
}

/** step 4: auto-save into this browser, export to a file, `?` to reopen */
function ArtSave() {
  return (
    <div className="wt-save">
      <span className="wt-file">
        <Save />
        auto
      </span>
      <span className="wt-arr">
        <ArrowRight />
      </span>
      <span className="wt-cubewrap">
        <span className="cube wt-chromecube" />
        <span className="wt-lbl">this browser</span>
      </span>
      <span className="wt-arr">
        <ArrowDownToLine />
      </span>
      <span className="wt-qk">?</span>
    </div>
  );
}

/** step 5: a linked list of steps, "you are here" on the next one (the first one for a fresh start) */
function ArtNext({ fresh }) {
  const done = fresh ? 0 : 2;
  return (
    <div className="wt-ll">
      <span className="wt-ll-row">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="wt-ll-cell">
            {i > 0 && <span className={`l ${i <= done ? 'l--d' : ''}`} />}
            <span className={`n ${i < done ? 'n--d' : i === done ? 'n--c' : ''}`}>{i < done ? <Check /> : i === done ? <ArrowRight /> : null}</span>
          </span>
        ))}
      </span>
      <span className="wt-you">you are here{fresh ? ' · the very first step' : ''}</span>
    </div>
  );
}

/** Welcome tour: shown once on first visit, re-opened from the Guide key, the "?" key, ⌘K or Settings. */
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

  const stageState = useMemo(() => {
    const done = stages.map((s) => s.topics.filter(Boolean).every((t) => topicStatus(t, progress) === 'completed'));
    const cur = done.findIndex((d) => !d);
    return done.map((d, i) => (d ? 'done' : i === cur ? 'cur' : 'todo'));
  }, [progress]);

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
  const last = step === STEP_TITLES.length - 1;

  return (
    <div className="wt-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        ref={ref}
        className="wt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="wt-head">
          <span className="eyebrow">
            <Compass aria-hidden="true" /> Guide · <span className="mono">{step + 1}/{STEP_TITLES.length}</span>
          </span>
          <button type="button" className="iconbtn" aria-label="Close the guide" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="wt-body" aria-live="polite">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 * dir }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className={`wt-art wt-art--${step}`} aria-hidden="true">
                {step === 0 && <ArtStairs state={stageState} />}
                {step === 1 && <ArtLoop />}
                {step === 2 && <ArtDock />}
                {step === 3 && <ArtSave />}
                {step === 4 && <ArtNext fresh={next.kind === 'start'} />}
              </div>

              {step === 0 && (
                <>
                  <h2 id="tour-title" className="chrome">
                    Welcome to DSA&nbsp;Journey
                  </h2>
                  <p>
                    Learn data structures and algorithms in JavaScript, one pattern at a time:{' '}
                    <b>
                      <span className="mono">{topics.length}</span> topics in <span className="mono">{stages.length}</span> stages
                    </b>
                    , each with an interactive lesson, step-through animations and practice questions (
                    <b>
                      <span className="mono">{allQuestions.length}</span> in total
                    </b>
                    ) run against real tests.
                  </p>
                  <ol className="wt-phases" aria-label={`The ${stages.length} stages`}>
                    {stages.map((st, i) => (
                      <li key={st.id} className={stageState[i] === 'done' ? 'is-done' : stageState[i] === 'cur' ? 'is-cur' : ''}>
                        <span className="wt-pn">{i + 1}</span>
                        <span>{st.title}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 id="tour-title" className="chrome">
                    Every topic follows the same loop
                  </h2>
                  <p>Follow the Study path at the top of each topic, left to right.</p>
                  <ol className="wt-loop-list">
                    {LOOP.map((id, i) => {
                      const m = TAB_META[id];
                      const Icon = m.icon;
                      return (
                        <li key={id}>
                          <span className={`wt-loop-ico ${i === 0 ? 'is-cur' : ''}`}>
                            <Icon aria-hidden="true" />
                          </span>
                          <span>
                            <b>
                              <span className="mono wt-loop-n">0{i + 1}</span> {m.label}
                            </b>
                            <span className="wt-why">{m.why}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="wt-chain" aria-label="Inside every question">
                    <span>inside every question:</span>
                    <span className="s">read it</span>
                    <i aria-hidden="true">→</i>
                    <span className="s s--k">name the pattern</span>
                    <i aria-hidden="true">→</i>
                    <span className="s">hints</span>
                    <i aria-hidden="true">→</i>
                    <span className="s">approach</span>
                    <i aria-hidden="true">→</i>
                    <span className="s">solution</span>
                  </div>
                  <p className="wt-note">Company Qs and the Cheatsheet sit at the end of the path.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 id="tour-title" className="chrome">
                    Where things are
                  </h2>
                  <ul className="wt-where">
                    <li>
                      <House aria-hidden="true" />
                      <span>
                        <b>The dock</b> at the bottom: Dashboard, Path, Topics, Patterns, Practice, Visualizer, Revision and more, one key each. On a phone
                        it is the tab bar.
                      </span>
                    </li>
                    <li>
                      <LayoutGrid aria-hidden="true" />
                      <span>
                        <b>More</b> (the grid key) opens everything else: the stage-by-stage syllabus, Pattern Finder, the JS reference, Playground,
                        Progress and Settings.
                      </span>
                    </li>
                    <li>
                      <SquareTerminal aria-hidden="true" />
                      <span>
                        <b>The status line</b> at the top: where you are, your streak and solved count, the guide <span className="kbd">?</span>, search and
                        the theme switch.
                      </span>
                    </li>
                    <li>
                      <Search aria-hidden="true" />
                      <span>
                        <b>Search</b>: press <span className="kbd">{MOD}</span> <span className="kbd">K</span> (or <span className="kbd">/</span>) to jump to
                        any page, topic, lesson step, pattern, question or JS API.
                      </span>
                    </li>
                    <li>
                      <Target aria-hidden="true" />
                      <span>
                        <b>Pattern Finder</b> names the pattern for a new problem; <b>Revision</b> lists weak areas and the questions to retry.
                      </span>
                    </li>
                  </ul>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 id="tour-title" className="chrome">
                    Your progress saves itself
                  </h2>
                  <ul className="wt-where">
                    <li>
                      <Save aria-hidden="true" />
                      <span>
                        Lesson steps, checkpoint answers, pattern guesses, code drafts and solved questions are saved automatically <b>in this browser</b>. No
                        account needed.
                      </span>
                    </li>
                    <li>
                      <Download aria-hidden="true" />
                      <span>
                        Use <b>Progress → Export</b> to back it up or move it to another device, and <b>Import</b> to restore it.
                      </span>
                    </li>
                    <li>
                      <RotateCcw aria-hidden="true" />
                      <span>
                        It is lost if you clear this site&apos;s data or use a private window, and <b>Progress → Reset</b> deletes it.
                      </span>
                    </li>
                    <li>
                      <Keyboard aria-hidden="true" />
                      <span>
                        Press <span className="kbd">?</span> any time (or the <b>?</b> key in the dock) to see this tour again.
                      </span>
                    </li>
                  </ul>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 id="tour-title" className="chrome">
                    Start here
                  </h2>
                  <p>Your next step:</p>
                  <div className="wt-next">
                    <b>{next.title}</b>
                    {next.detail && <span>{next.detail}</span>}
                  </div>
                  <div className="wt-next-acts">
                    <button type="button" className="btn btn--plasma btn--sm" data-autofocus onClick={() => finish(next.href)}>
                      {next.kind === 'start' ? 'Start learning' : 'Go to my next step'} <ArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => finish('/contents')}>
                      <ListTree aria-hidden="true" /> Show me the Contents
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="wt-foot">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            Skip
          </button>
          <div className="wt-dots" role="group" aria-label="Tour steps">
            {STEP_TITLES.map((t, i) => (
              <button
                key={t}
                type="button"
                className={i === step ? 'on' : i < step ? 'seen' : ''}
                aria-label={`Step ${i + 1}: ${t}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
              >
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="wt-nav">
            <button type="button" className="iconbtn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Back">
              <ArrowLeft aria-hidden="true" />
            </button>
            {!last ? (
              <button type="button" className="btn btn--plasma btn--sm" onClick={() => go(step + 1)} data-autofocus={step === 0 ? true : undefined}>
                Next <ArrowRight aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="btn btn--chrome btn--sm" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
        <div className="wt-keys" aria-hidden="true">
          <span>
            <span className="kbd">←</span>
            <span className="kbd">→</span> step
          </span>
          <span>
            <span className="kbd">Esc</span> close
          </span>
          <span>
            <span className="kbd">?</span> reopen any time
          </span>
        </div>
      </motion.div>
    </div>
  );
}
