import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import { saveUiPrefs, useUiPrefs } from '../../lib/uiPrefs.js';

/** A small dismissible tip shown until the learner closes it (remembered in UI prefs; Settings can turn tips off). */
export default function CoachTip({ id, title, children }) {
  const prefs = useUiPrefs();
  const visible = prefs.showCoachTips && !prefs.coachDismissed[id];
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          className="coach-tip"
          aria-label="Tip"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Lightbulb size={18} aria-hidden="true" className="coach-icon" />
          <div>
            <strong>{title}</strong> {children}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Dismiss tip" onClick={() => saveUiPrefs({ coachDismissed: { ...prefs.coachDismissed, [id]: true } })}>
            <X size={16} aria-hidden="true" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
