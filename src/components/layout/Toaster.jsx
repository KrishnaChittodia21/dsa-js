import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { dismissToast, getToasts, subscribeToasts } from '../../lib/celebrate.js';

/** Bottom-right paper slips (auto-hide after 3s), announced politely to screen readers. */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);
  const reduce = useReducedMotion();
  return (
    <div className="toaster" aria-live="polite" role="status">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast"
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.3, 0.7, 0.1, 1] }}
          >
            <span className="toast-mark" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong className="toast-title">{t.title}</strong>
              {t.detail && <div className="toast-detail">{t.detail}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-close" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
