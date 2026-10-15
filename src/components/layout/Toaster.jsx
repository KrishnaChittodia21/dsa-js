import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PartyPopper, X } from 'lucide-react';
import { dismissToast, getToasts, subscribeToasts } from '../../lib/celebrate.js';

/** Bottom-right toasts (auto-hide after 3s), announced politely to screen readers. */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);
  return (
    <div className="toaster" aria-live="polite" role="status">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast"
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <PartyPopper size={20} aria-hidden="true" className="toast-icon" />
            <div>
              <strong>{t.title}</strong>
              {t.detail && <div className="small muted">{t.detail}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
