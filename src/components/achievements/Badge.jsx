import { useId } from 'react';
import {
  Award,
  Bike,
  Blocks,
  BookOpen,
  Brackets,
  Briefcase,
  CircleCheck,
  Code,
  Cpu,
  Crown,
  Eye,
  Flame,
  Footprints,
  Layers,
  Lock,
  Moon,
  Mountain,
  Network,
  Repeat,
  Rocket,
  RotateCcw,
  Scale,
  ShieldCheck,
  Target,
  Terminal,
  TreePine,
} from 'lucide-react';

/** glyph keys used by src/content/achievements.js → lucide icons */
const ART = {
  footprints: Footprints,
  terminal: Terminal,
  eye: Eye,
  book: BookOpen,
  blocks: Blocks,
  brackets: Brackets,
  layers: Layers,
  repeat: Repeat,
  tree: TreePine,
  network: Network,
  cpu: Cpu,
  rocket: Rocket,
  crown: Crown,
  code: Code,
  bike: Bike,
  scale: Scale,
  mountain: Mountain,
  shield: ShieldCheck,
  check: CircleCheck,
  target: Target,
  flame: Flame,
  moon: Moon,
  rotate: RotateCcw,
  briefcase: Briefcase,
};

/** chrome rim gradients per tier (Achievements.html `tg-*`) — fixed metal colours in both themes */
const RIM = {
  standard: [['0', '#FFE3CF'], ['.47', '#FF8E5C'], ['.53', '#C2410C'], ['1', '#FFB07A']],
  bronze: [['0', '#FFD2B0'], ['.47', '#D08B5B'], ['.53', '#8A4E2A'], ['1', '#E9A577']],
  silver: [['0', '#FFFFFF'], ['.47', '#C9CED6'], ['.53', '#7D838C'], ['1', '#E6E9EE']],
  gold: [['0', '#FFF4C2'], ['.47', '#F2C14E'], ['.53', '#9A6A00'], ['1', '#FDE68A']],
  diamond: [['0', '#CFF6FF'], ['.35', '#8EE6FF'], ['.65', '#7B5CFF'], ['1', '#FF2E88']],
  locked: [['0', '#4A4450'], ['1', '#2A262F']],
};

const OUTER = 'M33 2 63 19v36L33 72 3 55V19z';
const FACET = 'M33 2 63 19 33 36 3 19z';
const INNER = 'M33 10 56 23v28L33 64 10 51V23z';

/**
 * Achievement medallion (Kinetic Voxel): a chrome hexagon whose rim is the tier's metal, a dark
 * inner face with the glow-lit glyph and, when locked, dim graphite + a lock chip.
 * Sizes: sm 44px · md 72px · lg 168px wide. Pass `label` to expose it as an image to assistive
 * tech; otherwise it is decorative. `shine` sweeps a highlight across it (off for reduced motion).
 */
export default function Badge({ art, tier = 'standard', locked = false, size = 'md', label, shine = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const t = locked ? 'locked' : RIM[tier] ? tier : 'standard';
  const Glyph = ART[art] || Award;
  return (
    <span
      className={`ach-med ach-med--${t} ach-med--${size} ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <svg className="ach-med-hx" viewBox="0 0 66 74" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`tg-${uid}`} x1="0" y1="0" x2={t === 'diamond' ? 1 : 0} y2="1">
            {RIM[t].map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          <clipPath id={`tc-${uid}`}>
            <path d={OUTER} />
          </clipPath>
        </defs>
        <path d={OUTER} fill={`url(#tg-${uid})`} />
        <path d={FACET} fill="#fff" opacity={locked ? 0.05 : 0.22} />
        <path className="ach-med-in" d={INNER} />
        {shine && !locked && (
          <g clipPath={`url(#tc-${uid})`}>
            <g className="ach-med-shine">
              <rect x="-30" y="-10" width="18" height="100" fill="#fff" opacity="0.28" transform="skewX(-18)" />
            </g>
          </g>
        )}
      </svg>
      <Glyph className="ach-med-glyph" strokeWidth={1.9} aria-hidden="true" focusable="false" />
      {locked && size !== 'sm' && (
        <span className="ach-med-lock" aria-hidden="true">
          <Lock strokeWidth={2.2} />
        </span>
      )}
    </span>
  );
}

/** voxel colour of each tier (shelf cubes, plinths, meters) */
export const TIER_COLOR = { standard: '#FF7A3D', bronze: '#C47A48', silver: '#C9CED6', gold: '#F2C14E', diamond: '#8EE6FF' };
const TIER_NAME = { standard: 'One-step', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', diamond: 'Diamond' };
const rank = (tier) => ['bronze', 'silver', 'gold', 'diamond'].indexOf(tier);

/** Metal tier pill ("Silver", "Silver at 50"); 'standard' renders as an outlined plasma pill. */
export function TierPill({ tier, children }) {
  if (!TIER_NAME[tier]) return null;
  return <span className={`ach-tpill ach-tpill--${tier}`}>{children ?? TIER_NAME[tier]}</span>;
}

/**
 * Voxel plinth under a medallion: one cube per tier, lit for every tier earned, the next tier
 * outlined in ultraviolet. A one-step badge stands on a single slab.
 * @param ladder evaluation tiers [{ tier, goal }] · @param tier stored (earned) tier or null · @param next next tier or null
 */
export function Plinth({ ladder, tier, next, className = '' }) {
  const tiered = ladder.length && ladder[0].tier !== 'standard';
  if (!tiered) {
    return (
      <span className={`ach-plinth ach-plinth--slab ${className}`} style={{ '--pc': tier ? TIER_COLOR.standard : undefined }} aria-hidden="true">
        <i className={tier ? 'on' : ''} style={{ '--k': 0 }} />
      </span>
    );
  }
  return (
    <span className={`ach-plinth ${className}`} style={{ '--pc': tier ? TIER_COLOR[tier] : undefined }} aria-hidden="true">
      {ladder.map((t, k) => {
        const on = tier && rank(tier) >= rank(t.tier);
        const nx = !on && next?.tier === t.tier;
        return <i key={t.tier} className={on ? 'on' : nx ? 'nx' : ''} style={{ '--k': k }} />;
      })}
    </span>
  );
}

/** Ascending voxel steps, one per tier, labelled with its goal (mono). */
export function TierLadder({ ladder, tier, next, earnedDates = {}, formatDate = (x) => x }) {
  const steps = ladder.filter((t) => t.tier !== 'standard');
  if (!steps.length) return null;
  return (
    <ol className="ach-ladder" aria-label="Tiers">
      {steps.map((t, i) => {
        const got = tier && rank(tier) >= rank(t.tier);
        const isNext = !got && next?.tier === t.tier;
        const when = got && earnedDates[t.tier] ? ` · earned ${formatDate(earnedDates[t.tier])}` : '';
        return (
          <li key={t.tier} className={`ach-step ach-step--${t.tier} ${got ? 'got' : ''} ${isNext ? 'next' : ''}`} style={{ '--lv': i + 1 }} title={`${TIER_NAME[t.tier]} at ${t.goal}${when}`}>
            <i aria-hidden="true" />
            <span className="sr-only">{`${TIER_NAME[t.tier]} at ${t.goal}${got ? ', earned' : isNext ? ', next' : ''}`}</span>
            <span aria-hidden="true">{t.goal}</span>
          </li>
        );
      })}
    </ol>
  );
}
