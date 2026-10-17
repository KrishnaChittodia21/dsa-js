import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { saveUiPrefs, useUiPrefs } from '../../lib/uiPrefs.js';

/** A margin note in red pen, shown until the learner closes it (remembered in UI prefs; Settings can turn tips off). */
export default function CoachTip({ id, title, children }) {
  const prefs = useUiPrefs();
  const reduce = useReducedMotion();
  const visible = prefs.showCoachTips && !prefs.coachDismissed[id];
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          className="coach-tip"
          aria-label="Tip"
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.2, ease: [0.3, 0.7, 0.1, 1] }}
        >
          <div>
            <span className="eyebrow">Note</span>
            <strong>{title}</strong> {children}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-close"
            aria-label="Dismiss tip"
            onClick={() => saveUiPrefs({ coachDismissed: { ...prefs.coachDismissed, [id]: true } })}
          >
            ×
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
