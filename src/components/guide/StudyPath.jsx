import { motion, useReducedMotion } from 'motion/react';
import { useProgress } from '../../state/ProgressContext.jsx';
import { useUiPrefs } from '../../lib/uiPrefs.js';
import { LOOP, TAB_META, stepProgress } from './studyLoop.js';

/**
 * Sticky "Study path": the topic's tabs as a numbered syllabus line
 * (Learn → Visualize → Practice → Review, plus Company Qs and Cheatsheet on the side), each with its own
 * mini progress. It IS the tab bar (same `?tab=` ids), so it keeps tablist semantics and arrow keys.
 */
export default function StudyPath({ topic, tab, locked, onSelect, extras = ['company', 'cheatsheet'] }) {
  const { progress } = useProgress();
  const visited = useUiPrefs().visitedTabs[topic.id] || [];
  const currentIdx = LOOP.findIndex((id) => !stepProgress(progress, topic, id, visited).complete);
  const all = [...LOOP, ...extras];
  const reduce = useReducedMotion();

  const onKeyDown = (e) => {
    const i = all.indexOf(tab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      onSelect(next);
      requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
    }
  };

  const renderStep = (id, n) => {
    const meta = TAB_META[id];
    const prog = stepProgress(progress, topic, id, visited);
    const isLocked = id === 'learn' && locked;
    const idx = LOOP.indexOf(id);
    const state = isLocked ? 'locked' : idx === -1 ? 'extra' : prog.complete ? 'done' : idx === currentIdx ? 'current' : 'todo';
    const active = tab === id;
    const pctVal = prog.total ? Math.min(100, (prog.done / prog.total) * 100) : 0;
    return (
      <button
        key={id}
        id={`tab-${id}`}
        role="tab"
        type="button"
        aria-selected={active}
        tabIndex={active ? 0 : -1}
        className={`path-step st-${state} ${active ? 'active' : ''} ${n === undefined ? 'path-extra' : ''}`}
        onClick={() => onSelect(id)}
        title={`${meta.why}${isLocked ? ' (unlock the topic first)' : ''}`}
      >
        {active && (
          <motion.span
            layoutId={reduce ? undefined : `path-indicator-${topic.id}`}
            className="path-indicator"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
        <span className="path-icon" aria-hidden="true">
          {isLocked ? '×' : state === 'done' ? '✓' : n !== undefined ? String(n).padStart(2, '0') : '§'}
        </span>
        <span className="path-text">
          <span className="path-label">
            {n !== undefined && <span className="sr-only">Step {n}: </span>}
            {meta.label}
            {id === 'company' && <span className="path-count">{prog.total}</span>}
          </span>
          {n !== undefined && (
            <span className="path-meta">
              {isLocked ? 'locked' : prog.text}
              {prog.total > 0 && (
                <span className="path-bar" aria-hidden="true">
                  <motion.span className="path-bar-fill" initial={false} animate={{ width: `${prog.complete ? 100 : pctVal}%` }} transition={{ duration: 0.4 }} />
                </span>
              )}
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="study-path" role="tablist" aria-label="Study path" onKeyDown={onKeyDown}>
      {LOOP.map((id, i) => (
        <span key={id} className="path-item">
          {i > 0 && (
            <span className="path-sep" aria-hidden="true">
              →
            </span>
          )}
          {renderStep(id, i + 1)}
        </span>
      ))}
      <span className="path-spacer" />
      {extras.map((id) => renderStep(id))}
    </div>
  );
}
