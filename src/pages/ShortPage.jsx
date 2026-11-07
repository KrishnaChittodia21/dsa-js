// M9: one Short in a vertical story player — a port of system-design-learn's components/ShortPlayer.tsx and
// pages/Short.tsx: segment bars (one per step), tap zones (hold to pause), Back / Next, speed, Save, a "Your turn"
// question that blocks Next until answered (answering dispatches SHORT_DONE) and an end card with the next Short.
// Frames are drawn with the Visualizer's own panels. #/shorts/<id>?queue=a,b,c plays a list back to back.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Pause, Play, RotateCcw } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicById } from '../content/index.js';
import { loadShorts, shortLength, shortSaveItem } from '../lib/shorts.js';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import { rich, rotated } from '../components/lesson/StepLesson.jsx';
import { Panel } from '../visualizations/panels.jsx';
import { useFitZoom } from '../visualizations/useFitZoom.js';
import SaveButton from '../components/ui/SaveButton.jsx';

// the speed button cycles in this order; `id` is what uiPrefs.shortSpeed stores
const SPEEDS = [
  { id: 'normal', label: '1×', ms: 2200 },
  { id: 'fast', label: '1.5×', ms: 1500 },
  { id: 'slow', label: '0.7×', ms: 3300 },
];
const UP_NEXT_SECONDS = 5;
const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** every screen of a Short: each watch frame, the question, then any frames shown after it is answered */
function beatsOf(steps) {
  const out = [];
  steps.forEach((step, si) => {
    const run = (frames, after) => frames.forEach((f, fi) => out.push({ si, step, f, fi, n: frames.length, after }));
    if (step.kind === 'watch') run(step.frames, false);
    else {
      out.push({ si, step, quiz: true });
      run(step.then || [], true);
    }
  });
  return out;
}

function Pic({ panels, box }) {
  const [ref, zoom] = useFitZoom(panels, box);
  return (
    <div className="viz sp-pic sp-in d2">
      <div className="viz-stage st-stage" ref={ref} style={zoom < 1 ? { zoom } : undefined}>
        {panels.map((p, i) => (
          <Panel key={i} panel={p} />
        ))}
      </div>
    </div>
  );
}

function Quiz({ task, solvedText, solved, onSolve }) {
  const [picked, setPicked] = useState(null);
  const [shake, setShake] = useState(0);
  const missed = useRef(false);
  const right = solved || picked === task.answer;
  return (
    <>
      <div className="sp-opts sp-in d3" role="group" aria-label="Your answer">
        {rotated(task.options.map((o, i) => [o, i]), task.question).map(([o, i]) => (
          <button
            key={`${i}-${picked === i ? shake : 0}`}
            type="button"
            className={`sp-opt ${right && i === task.answer ? 'right' : !right && picked === i ? 'wrong' : ''}`}
            disabled={right}
            onClick={() => {
              setPicked(i);
              setShake((n) => n + 1);
              if (i === task.answer) onSolve(!missed.current);
              else missed.current = true;
            }}
          >
            {rich(o.text)}
          </button>
        ))}
      </div>
      <p className="sp-fb" aria-live="polite">
        {right ? (
          <>
            <b>Right.</b> {rich(solvedText)} Press Next to continue.
          </>
        ) : picked !== null ? (
          <>
            <b className="no">Not that one:</b> {rich(task.options[picked].why || 'look at the picture again.')}
          </>
        ) : null}
      </p>
    </>
  );
}

function Player({ s, topicTitle, next, ms, speed, onSpeed, onSolve }) {
  const beats = useMemo(() => beatsOf(s.steps), [s.steps]);
  const END = beats.length; // the end card comes after the last beat
  const turn = s.steps[s.steps.length - 1];
  const [cur, setCur] = useState(0);
  const [run, setRun] = useState(0); // remounts the screen so its entrance plays again
  const [paused, setPaused] = useState(reducedMotion);
  const [held, setHeld] = useState(false);
  const [solved, setSolved] = useState(false);
  const elapsed = useRef(0);
  const bars = useRef(null);
  const body = useRef(null);
  const b = cur < END ? beats[cur] : null;
  const waiting = !!b?.quiz && !solved;
  const beatMs = (x) => (x.fi === x.n - 1 ? ms * 1.6 : ms);

  const show = useCallback(
    (i) => {
      elapsed.current = 0;
      setCur(Math.max(0, Math.min(END, i)));
      setRun((n) => n + 1);
    },
    [END],
  );
  const goNext = useCallback(() => {
    if (waiting || cur >= END) return;
    show(cur + 1);
  }, [waiting, cur, END, show]);
  const goPrev = useCallback(() => {
    if (cur === 0) return;
    show(cur - 1);
  }, [cur, show]);

  // playing a list: the end card counts down to the next Short (pause or hold stops it)
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(UP_NEXT_SECONDS);
  useEffect(() => {
    if (!next?.auto || cur !== END || paused || held) return undefined;
    if (countdown <= 0) {
      navigate(next.href);
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [next, cur, END, paused, held, countdown, navigate]);

  // the clock: fills the bars (with a transform, so they fill smoothly) and moves on; it stops while paused or
  // held, and waits on the question
  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      const len = b && !b.quiz ? beatMs(b) : Infinity;
      if (!paused && !held && b && !b.quiz) elapsed.current += dt;
      const k = Number.isFinite(len) ? Math.min(1, elapsed.current / len) : 0;
      const at = b ? b.si : s.steps.length;
      bars.current?.querySelectorAll('i').forEach((el, i) => {
        let f = i < at ? 1 : 0;
        if (i === at) f = !b ? 1 : b.quiz ? (solved && !b.step.then ? 1 : 0) : (b.fi + k) / b.n;
        el.style.transform = `scaleX(${f})`;
      });
      if (b && !b.quiz && elapsed.current >= len) goNext();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [b, paused, held, ms, solved, goNext, run, s.steps.length]);

  // keyboard: ← → move, Space pauses (not while typing; Space on a focused button or link presses it instead)
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ' && !e.target.closest?.('button:not(.sp-zone), a')) {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  // a tap on a side moves; a long press pauses until released (like Stories)
  const press = useRef({ timer: 0, held: false });
  const zone = (go) => ({
    onPointerDown: () => {
      press.current.held = false;
      press.current.timer = setTimeout(() => {
        press.current.held = true;
        setHeld(true);
      }, 260);
    },
    onPointerUp: () => {
      clearTimeout(press.current.timer);
      if (press.current.held) setHeld(false);
      else go();
    },
    onPointerLeave: () => {
      clearTimeout(press.current.timer);
      if (press.current.held) setHeld(false);
    },
  });

  // keep the same point in the frame when the speed changes
  const cycleSpeed = () => {
    const i = SPEEDS.findIndex((x) => x.id === speed);
    const nx = SPEEDS[(i + 1) % SPEEDS.length];
    elapsed.current = (elapsed.current * nx.ms) / ms;
    onSpeed(nx.id);
  };
  const sp = SPEEDS.find((x) => x.id === speed) || SPEEDS[0];
  const lesson = `/topic/${s.topicId}`;
  const kind = b?.quiz ? 'Your turn' : b?.after ? 'The answer' : 'Watch';
  const stepTag = b && `${kind} · step ${b.si + 1} of ${s.steps.length}`;
  const line = b && b.step.lines[b.quiz ? 0 : (b.f.say ?? 0)];

  return (
    <div className={`sp-player ${paused || held ? 'paused' : ''}`} role="region" aria-roledescription="short video" aria-label={s.title}>
      <div className="sp-bars" ref={bars} aria-hidden="true">
        {[...s.steps, null].map((st, i) => (
          <div key={i} className={`sp-bar ${st?.kind === 'turn' ? 'q' : ''}`}>
            <i />
          </div>
        ))}
      </div>
      <div className="sp-top">
        <span className="sp-avatar" aria-hidden="true">
          {'{ }'}
        </span>
        <span className="sp-who">
          <b>DSA Journey</b>
          <span>{topicTitle}</span>
        </span>
        <span className="sp-save">
          <SaveButton data-guide="short-save" saveKey={`short:${s.id}`} item={shortSaveItem(s)} />
        </span>
        <button type="button" data-guide="short-speed" className="sp-pp sp-speed" onClick={cycleSpeed} aria-label={`Reading speed: ${sp.id}`} title="Reading speed">
          {sp.label}
        </button>
        <button type="button" className="sp-pp" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? <Play size={14} fill="currentColor" aria-hidden="true" /> : <Pause size={14} fill="currentColor" aria-hidden="true" />}
        </button>
      </div>

      <div className="sp-body">
        <div className="sp-stage" ref={body}>
          {b ? (
            <>
              {/* keyed by step: a new step plays its entrance, frames inside it change in place */}
              <div className="sp-beat" key={`${run}-${b.si}-${kind}`}>
                <span className="sp-kick sp-in">{stepTag}</span>
                <h2 className={`sp-head sp-in d1 ${b.quiz ? 'sp-head-q' : ''}`}>{rich(b.quiz ? b.step.task.question : b.step.title)}</h2>
                {line && <p className="sp-sub sp-in d1">{rich(line)}</p>}
                <Pic panels={b.quiz ? b.step.panels : b.f.panels} box={body} />
                {b.quiz && (
                  <Quiz
                    task={b.step.task}
                    solvedText={b.step.solved}
                    solved={solved}
                    onSolve={(firstTry) => {
                      setSolved(true);
                      onSolve(firstTry);
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="sp-beat" key={`${run}-end`}>
              <span className="sp-kick sp-in">The lesson · Short {s.n}</span>
              <h2 className="sp-head sp-head-q sp-in d1">{rich(turn.solved)}</h2>
              <p className="sp-sub sp-in d2">
                {s.pattern.name} · {topicTitle}
              </p>
              <div className="sp-end sp-in d3">
                {next?.href && (
                  <Link className="btn btn-primary" to={next.href}>
                    <span>
                      Next Short ({next.position}){next.auto && !paused && !held ? ` in ${countdown} s` : ''}
                      <span className="sp-next-title">{next.title}</span>
                    </span>
                  </Link>
                )}
                <Link className={`btn ${next?.href ? '' : 'btn-primary'}`} to={lesson}>
                  <BookOpen size={16} aria-hidden="true" /> Read the lesson
                </Link>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setCountdown(UP_NEXT_SECONDS);
                    show(0);
                  }}
                >
                  <RotateCcw size={16} aria-hidden="true" /> Watch again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* pointer-only shortcuts: Back / Next below are the keyboard and screen-reader controls */}
        {b && <button type="button" className="sp-zone l" tabIndex={-1} aria-hidden="true" {...zone(goPrev)} />}
        {b && !waiting && <button type="button" className="sp-zone r" tabIndex={-1} aria-hidden="true" {...zone(goNext)} />}
      </div>
      {held && <div className="sp-hold">PAUSED</div>}
      {/* the frame's narration in its own row, so it never sits on the picture or the controls */}
      {b && !b.quiz && (
        <p className="sp-cap" aria-live="polite">
          {b.f.note ? rich(b.f.note) : null}
        </p>
      )}

      <div className="sp-foot">
        <div className="sp-navrow">
          <button type="button" className="sp-nav" onClick={goPrev} disabled={cur === 0} aria-label="Previous frame">
            ‹ Back
          </button>
          <span className="sp-count">
            {paused ? <span className="sp-paused">Paused · ▶ to play</span> : `${Math.min(cur, END) + 1} / ${END + 1}`}
          </span>
          <button
            type="button"
            className="sp-nav"
            onClick={() => {
              goNext();
              setPaused(false);
            }}
            disabled={cur >= END || waiting}
            aria-label="Next frame"
          >
            Next ›
          </button>
        </div>
        <span className="sp-title">{s.title}</span>
        <span className="sp-tags">
          Short {s.n} · #{s.pattern.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} · {shortLength(s, ms)}
        </span>
      </div>
    </div>
  );
}

export default function ShortPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { progress, dispatch } = useProgress();
  const speed = useUiPrefs().shortSpeed || 'normal';
  const [shorts, setShorts] = useState(null);
  useEffect(() => {
    let live = true;
    loadShorts().then((s) => live && setShorts(s));
    return () => {
      live = false;
    };
  }, []);

  if (!shorts) return <div className="page short-page"><p className="empty">Loading…</p></div>;
  const i = shorts.findIndex((x) => x.id === id);
  const s = shorts[i];
  if (!s)
    return (
      <div className="page short-missing">
        <h1>There is no Short called “{id}”</h1>
        <p>
          It may have moved. <Link to="/shorts">See all Shorts</Link>
        </p>
      </div>
    );

  // a list to play: this one must be in it; otherwise the next one in course order
  const byId = Object.fromEntries(shorts.map((x) => [x.id, x]));
  const queue = (params.get('queue') || '').split(',').filter((q) => byId[q]);
  const at = queue.indexOf(s.id);
  const after = shorts[i + 1];
  let next = null;
  if (at >= 0 && queue[at + 1]) {
    const n = byId[queue[at + 1]];
    next = { href: `/shorts/${n.id}?queue=${queue.join(',')}`, title: n.title, position: `${at + 2} of ${queue.length}`, auto: true };
  } else if (at < 0 && after) {
    next = { href: `/shorts/${after.id}`, title: after.title, position: `Short ${after.n}` };
  }
  const ms = (SPEEDS.find((x) => x.id === speed) || SPEEDS[0]).ms;

  return (
    <div className="page short-page">
      <nav className="short-page-top" data-guide="short-nav" aria-label="Shorts">
        <Link to="/shorts">
          <ArrowLeft size={15} aria-hidden="true" /> {at >= 0 ? `All Shorts · ${at + 1} of ${queue.length}` : 'All Shorts'}
        </Link>
        <Link to={`/topic/${s.topicId}`} title={`${s.pattern.name} lesson`}>
          <BookOpen size={15} aria-hidden="true" /> {shortLength(s, ms)} short
        </Link>
      </nav>
      {/* keyed by id: the next Short starts from its first frame */}
      <Player
        key={s.id}
        s={s}
        topicTitle={topicById[s.topicId]?.title || s.topicId}
        next={next}
        ms={ms}
        speed={speed}
        onSpeed={(v) => saveUiPrefs({ shortSpeed: v })}
        onSolve={(firstTry) => dispatch({ type: 'SHORT_DONE', id: s.id, correct: firstTry })}
      />
    </div>
  );
}
