import { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import Badge, { TIER_COLOR, TierLadder, TierPill } from './Badge.jsx';
import { achievementById, TIER_LABEL } from '../../content/achievements.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { useAchievementEvaluations } from '../../state/achievements.js';
import { useFocusTrap } from '../../lib/useFocusTrap.js';
import { prefersReducedMotion } from '../../lib/appEvents.js';

/** Kinetic Voxel confetti colours: the earned tiers' metals + plasma / volt / uv / ice */
const KV = ['#FF6B2C', '#FF2E88', '#7B5CFF', '#8EE6FF'];
const METAL = { standard: ['#FFB07A', '#FF6B2C'], bronze: ['#FFD2B0', '#C47A48'], silver: ['#E6E9EE', '#8F97A3'], gold: ['#FFF4C2', '#F2C14E'], diamond: ['#CFF6FF', '#7B5CFF'] };
const paletteFor = (tiers) => [...new Set(tiers.flatMap((t) => METAL[t] || []).concat(KV))];

/** One canvas burst of square "voxel" confetti (skipped for reduced motion). */
function burst(colors) {
  if (prefersReducedMotion()) return;
  import('canvas-confetti')
    .then(({ default: confetti }) => {
      const opts = { colors, shapes: ['square'], scalar: 1.15, disableForReducedMotion: true, zIndex: 120 };
      confetti({ ...opts, particleCount: 110, spread: 75, startVelocity: 45, origin: { y: 0.55 } });
      setTimeout(() => confetti({ ...opts, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 200);
      setTimeout(() => confetti({ ...opts, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 200);
    })
    .catch(() => {
      /* decoration only */
    });
}

/** deterministic pseudo-random voxel cubes drifting around the dialog (CSS, hidden for reduced motion) */
function cubes(colors) {
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 22 }, (_, i) => ({
    i,
    s: `${8 + Math.round(rnd() * 3) * 2}px`,
    c: colors[i % colors.length],
    x: `${(i % 2 ? 55 + rnd() * 40 : 4 + rnd() * 40).toFixed(1)}%`,
    y: `${(8 + rnd() * 78).toFixed(1)}%`,
    r: `${Math.round(30 + rnd() * 50)}deg`,
    d: `${(rnd() * 2.6).toFixed(2)}s`,
  }));
}

/**
 * "Achievement unlocked" dialog (Achievements.html state preview). One item → the medallion spins in
 * large on a ray burst with its tier ladder; several (first load, import, a big jump) → one combined
 * grid. Focus-trapped; Esc, the close button, a backdrop click or "Keep going" dismiss it.
 */
export default function AchievementCelebration({ items, onClose, onViewAll }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { progress } = useProgress();
  const evs = useAchievementEvaluations(progress);
  useFocusTrap(ref, true, onClose);

  const list = items.map((i) => ({ ...i, a: achievementById[i.id] })).filter((i) => i.a);
  const single = list.length === 1;
  const first = list[0];
  const colors = useMemo(() => paletteFor(items.map((i) => i.tier)), [items]);
  const drift = useMemo(() => cubes(colors), [colors]);

  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    burst(colors);
  }, [colors]);

  const pop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { scale: 0.2, rotate: -200, opacity: 0 }, animate: { scale: 1, rotate: 0, opacity: 1 } };
  const ev = first && evs[first.id];
  const stored = first && progress.achievements?.[first.id];

  return (
    <div className="ach-cel" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ach-cel-rays" aria-hidden="true" />
      <div className="ach-cel-confetti" aria-hidden="true">
        {drift.map((c) => (
          <i key={c.i} className="cube" style={{ '--s': c.s, '--c': c.c, '--x': c.x, '--y': c.y, '--r': c.r, '--d': c.d }} />
        ))}
      </div>
      <motion.div
        ref={ref}
        className={`ach-cel-modal ${single ? '' : 'ach-cel-modal--many'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ach-title"
        aria-describedby="ach-desc"
        tabIndex={-1}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <button type="button" className="iconbtn ach-cel-x" aria-label="Close" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <span className="eyebrow ach-cel-eyebrow">
          <Sparkles aria-hidden="true" /> {single ? 'Achievement unlocked' : 'Achievements unlocked'}
        </span>

        {single && first ? (
          <>
            <motion.div className="ach-cel-hero" {...pop} transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 150, damping: 14, delay: 0.15 }}>
              <Badge art={first.a.art} tier={first.tier} size="lg" shine />
            </motion.div>
            <h2 id="ach-title" className="chrome">
              {first.a.name}
            </h2>
            {TIER_LABEL[first.tier] ? <TierPill tier={first.tier}>{TIER_LABEL[first.tier]} tier</TierPill> : <TierPill tier="standard">Unlocked</TierPill>}
            <p id="ach-desc">{first.a.description}</p>
            {ev && ev.tiers[0]?.tier !== 'standard' && (
              <div className="ach-cel-ladder">
                <TierLadder ladder={ev.tiers} tier={stored?.tier || first.tier} next={ev.next} />
              </div>
            )}
          </>
        ) : (
          <>
            <h2 id="ach-title" className="chrome">
              <span className="mono">{list.length}</span> new badges
            </h2>
            <p id="ach-desc">Nice work. Here is everything your progress has unlocked.</p>
            <ul className="ach-cel-grid">
              {list.map((i, n) => (
                <motion.li
                  key={i.id}
                  style={{ '--pc': TIER_COLOR[i.tier] || TIER_COLOR.standard }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 260, damping: 18, delay: 0.08 + Math.min(n, 16) * 0.05 }}
                >
                  <Badge art={i.a.art} tier={i.tier} size="md" />
                  <span className="ach-cel-name">{i.a.name}</span>
                  <TierPill tier={i.tier}>{i.tier === 'standard' ? 'Unlocked' : undefined}</TierPill>
                </motion.li>
              ))}
            </ul>
          </>
        )}

        <div className="ach-cel-acts">
          <button type="button" className="btn btn--chrome" onClick={onClose} data-autofocus>
            Keep going
          </button>
          <button type="button" className="btn btn--ghost" onClick={onViewAll}>
            View all badges <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
