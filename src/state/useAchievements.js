import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateAll, newlyEarned, tierRank } from '../content/achievements.js';
import { achievementCtx } from './achievements.js';

// wait for a burst of dispatches (IMPORT, a submit + its toast) to settle before evaluating
const SETTLE_MS = 600;

/**
 * Achievement detection, used once in AppShell. After progress changes it evaluates the catalogue,
 * stores newly earned badges / tier-ups (ACHIEVEMENTS_EARN) and queues them for the celebration
 * overlay. Everything found in one evaluation (e.g. the first load of existing progress, or an
 * import) lands in the queue together and is shown as ONE celebration; anything already stored is
 * never celebrated again.
 *
 * Returns { queue: [{ id, tier }], dismiss }.
 */
export function useAchievementDetection(progress, dispatch) {
  const [queue, setQueue] = useState([]);
  // `${id}:${tier}` already dispatched in this session (guards StrictMode's double effects and the
  // window before the reducer's update comes back round)
  const sent = useRef(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      const fresh = newlyEarned(evaluateAll(progress, achievementCtx), progress.achievements).filter((e) => !sent.current.has(`${e.id}:${e.tier}`));
      if (!fresh.length) return;
      for (const e of fresh) sent.current.add(`${e.id}:${e.tier}`);
      dispatch({ type: 'ACHIEVEMENTS_EARN', earned: fresh, at: Date.now() });
      setQueue((q) => {
        const next = [...q];
        for (const e of fresh) {
          const i = next.findIndex((x) => x.id === e.id);
          if (i === -1) next.push({ id: e.id, tier: e.tier });
          else if (tierRank(e.tier) > tierRank(next[i].tier)) next[i] = { id: e.id, tier: e.tier };
        }
        return next;
      });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [progress, dispatch]);

  // a reset wipes the stored badges, so they may be earned (and celebrated) again
  useEffect(() => {
    if (!Object.keys(progress.achievements || {}).length) sent.current.clear();
  }, [progress.achievements]);

  const dismiss = useCallback(() => setQueue([]), []);
  return { queue, dismiss };
}
