import { useEffect, useRef } from 'react';
import { Check, Compass, Lock } from 'lucide-react';
import { useProgress } from '../../state/ProgressContext.jsx';
import { useUiPrefs } from '../../lib/uiPrefs.js';
import { LOOP, TAB_META, stepProgress } from './studyLoop.js';

/**
 * "Study path" stepper: the topic's tabs shown as the study loop
 * (Learn → Visualize → Practice → Review, plus Company Qs and Cheatsheet on the side), each with its own
 * mini progress. It IS the tab bar (same `?tab=` ids), so it keeps tablist semantics and arrow keys.
 * Kinetic Voxel `.spath/.ps` (uv = current step, plasma = done; light flows only on the conduit leaving the current step).
 */
export default function StudyPath({ topic, tab, locked, onSelect, extras = ['company', 'cheatsheet'] }) {
  const { progress } = useProgress();
  const visited = useUiPrefs().visitedTabs[topic.id] || [];
  const progs = Object.fromEntries([...LOOP, ...extras].map((id) => [id, stepProgress(progress, topic, id, visited)]));
  const currentIdx = LOOP.findIndex((id) => !progs[id].complete);
  const all = [...LOOP, ...extras];
  const scrollRef = useRef(null);

  // on narrow screens the stepper scrolls inside itself: keep the active step in view (never scrolls the page)
  useEffect(() => {
    const box = scrollRef.current;
    const el = box && document.getElementById(`tab-${tab}`);
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    const left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    box.scrollTo({ left: Math.max(0, left) });
  }, [tab]);

  const onKeyDown = (e) => {
    const i = all.indexOf(tab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      onSelect(next);
      requestAnimationFrame(() => {
        const el = document.getElementById(`tab-${next}`);
        el?.focus({ preventScroll: true });
      });
    }
  };

  const stateOf = (id) => {
    const isLocked = id === 'learn' && locked;
    const idx = LOOP.indexOf(id);
    return isLocked ? 'locked' : idx === -1 ? 'extra' : progs[id].complete ? 'done' : idx === currentIdx ? 'cur' : 'todo';
  };

  const renderStep = (id, n) => {
    const meta = TAB_META[id];
    const Icon = meta.icon;
    const prog = progs[id];
    const state = stateOf(id);
    const active = tab === id;
    const pctVal = prog.complete ? 100 : prog.total ? Math.min(100, (prog.done / prog.total) * 100) : 0;
    const extra = n === undefined;
    return (
      <button
        key={id}
        id={`tab-${id}`}
        role="tab"
        type="button"
        aria-selected={active}
        aria-controls="topic-panel"
        tabIndex={active ? 0 : -1}
        className={`ps ps--${state === 'todo' ? 'todo' : state} ${extra ? 'ps--extra' : ''}`}
        onClick={() => onSelect(id)}
        title={`${meta.why}${state === 'locked' ? ' (unlock the topic first)' : ''}`}
      >
        <span className="ps-ico" aria-hidden="true">
          {state === 'locked' ? <Lock /> : state === 'done' ? <Check strokeWidth={3} /> : <Icon />}
        </span>
        {extra ? (
          <span className="ps-label">
            {meta.label}
            {id === 'company' && <span className="ps-count">{prog.total}</span>}
          </span>
        ) : (
          <span className="ps-txt">
            <span className="ps-label">
              <span className="sr-only">Step {n}: </span>
              {meta.label}
            </span>
            <span className="ps-meta">
              {state === 'locked' ? 'locked' : prog.text}
              {prog.total > 0 && (
                <span className="ps-bar" aria-hidden="true">
                  <i style={{ '--v': `${pctVal}%` }} />
                </span>
              )}
            </span>
          </span>
        )}
        <span className={`ps-tip ${extra ? 'ps-tip--r' : ''}`} aria-hidden="true">
          {meta.why}
        </span>
      </button>
    );
  };

  // "why" line: what the active step is for, then where the loop goes next
  const meta = TAB_META[tab] || TAB_META.learn;
  const nextId = LOOP.find((id, i) => i >= Math.max(0, currentIdx) && id !== tab && !progs[id].complete);
  let next;
  if (currentIdx === -1) next = 'Every step of the loop is ticked — come back to Review before interviews.';
  else if (tab !== LOOP[currentIdx]) next = `You’re up to ${TAB_META[LOOP[currentIdx]].label} (${progs[LOOP[currentIdx]].text}).`;
  else if (nextId) next = `Next: ${TAB_META[nextId].label} — ${progs[nextId].text}.`;

  return (
    <section className="tp-sp" aria-label="Study path">
      <div className="tp-sp-head">
        <span className="eyebrow">
          <Compass aria-hidden="true" />
          Study path · follow it left to right
        </span>
        <span className="tp-sp-keys">← → to move between steps</span>
      </div>
      <div className="tp-sp-scroll" ref={scrollRef}>
        <div className="spath" role="tablist" aria-label="Study path" onKeyDown={onKeyDown}>
          {LOOP.map((id, i) => {
            const prev = i > 0 ? stateOf(LOOP[i - 1]) : null;
            return [
              i > 0 && <span key={`sep-${id}`} className={`ps-sep ${prev === 'done' ? 'ps-sep--lit' : prev === 'cur' ? 'ps-sep--flow' : ''}`} aria-hidden="true" />,
              renderStep(id, i + 1),
            ];
          })}
          <span className="ps-spacer" aria-hidden="true" />
          {extras.map((id) => renderStep(id))}
        </div>
      </div>
      <p className="spath-why">
        <span className="eyebrow">why {meta.label.toLowerCase()}</span>
        <span>
          <b>{meta.why}</b> {next}
        </span>
      </p>
    </section>
  );
}
