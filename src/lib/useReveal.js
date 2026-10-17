import { useEffect } from 'react';

/**
 * Scroll reveal for `[data-reveal]` elements inside `ref` (see base.css): each gets `data-revealed`
 * once it scrolls into view. New elements added later (filters, expanding sections) are picked up too.
 * Without IntersectionObserver, or with reduced motion, everything is revealed at once.
 */
export default function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const showAll = () => root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => el.setAttribute('data-revealed', ''));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-revealed', '');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
    );
    const scan = () => root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [ref]);
}
