import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import { saveUiPrefs, useUiPrefs } from '../../lib/uiPrefs.js';

/**
 * A small dismissible tip shown until the learner closes it (remembered in UI prefs; Settings can turn tips off).
 * Kinetic Voxel `.coach` capsule (ice = tip). `tag` defaults to "tip · <id suffix>", e.g. "tab:learn" → "tip · learn".
 */
export default function CoachTip({ id, title, tag, children }) {
  const prefs = useUiPrefs();
  const reduce = useReducedMotion();
  const visible = prefs.showCoachTips && !prefs.coachDismissed[id];
  const label = tag || `tip · ${String(id).split(':').pop()}`;
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          className="coach coach-tip"
          aria-label="Tip"
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="coach-ico" aria-hidden="true">
            <Lightbulb />
          </span>
          <div>
            <span className="coach-tag">{label}</span>
            <strong>{title}</strong> {children}
          </div>
          <button type="button" className="coach-x" aria-label="Dismiss tip" onClick={() => saveUiPrefs({ coachDismissed: { ...prefs.coachDismissed, [id]: true } })}>
            <X aria-hidden="true" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
