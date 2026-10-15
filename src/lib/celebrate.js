// Celebrations: a short toast plus (unless the OS asks for reduced motion) a confetti burst.
// canvas-confetti is imported on demand so it stays out of the main bundle.
import { prefersReducedMotion } from './appEvents.js';

let toasts = [];
let nextId = 1;
const listeners = new Set();

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getToasts = () => toasts;

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l());
}

export function showToast(title, detail, ms = 3000) {
  const t = { id: nextId++, title, detail };
  toasts = [...toasts.slice(-2), t];
  listeners.forEach((l) => l());
  setTimeout(() => dismissToast(t.id), ms);
}

export function celebrate(title, detail) {
  showToast(title, detail);
  if (prefersReducedMotion()) return;
  import('canvas-confetti')
    .then(({ default: confetti }) => {
      const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#fbbf24'];
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
      setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.6 }, colors, disableForReducedMotion: true }), 180);
    })
    .catch(() => {
      // confetti is decoration; the toast already said it
    });
}
