// Tiny window-event bus so any component can open app-level overlays owned by AppShell.
const PREFIX = 'dsa-journey:';

export function emit(name) {
  window.dispatchEvent(new CustomEvent(PREFIX + name));
}

export function on(name, fn) {
  const handler = () => fn();
  window.addEventListener(PREFIX + name, handler);
  return () => window.removeEventListener(PREFIX + name, handler);
}

export const openGuide = () => emit('open-guide');
export const openPalette = () => emit('open-palette');

/** true when the user asked the OS to reduce motion */
export const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
