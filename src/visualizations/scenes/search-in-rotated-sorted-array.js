// Search in Rotated Sorted Array: a sorted shelf was cut once and its two pieces swapped. Around any middle guess,
// at least one side is still in order (its first value <= its last); if the target's value lies inside that ordered
// side, search there, else search the other side. Works with lo/hi, left/right, l/r, low/high, start/end and mid / m.
import { firstInt, row } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'm', 'middle'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const inside = (n, a, i) => Number.isInteger(i) && i >= 0 && i < a.length;

// which side of [lo, hi] around mid is in order, and whether the target sits inside it
function sides(a, lo, mid, hi, t) {
  if (![lo, mid, hi].every((i) => inside(0, a, i))) return null;
  if (a[lo] <= a[mid]) return { side: 'left', from: a[lo], to: a[mid], holds: a[lo] <= t && t < a[mid] };
  return { side: 'right', from: a[mid], to: a[hi], holds: a[mid] < t && t <= a[hi] };
}

export default {
  id: 'search-in-rotated-sorted-array',
  metaphor: 'A sorted shelf, cut and swapped',
  caption: 'The shelf was sorted, then cut once and the two pieces swapped. The bracket is where the target can still be; around each middle guess one side is still in order, and its ends tell whether the target is in it.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  compare: 'mid',
  narrate(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const t = ctx.vars[tName];
    if (!a) return null;
    const pair = pairOf(ctx.vars);
    const [mName, m] = firstInt(ctx.vars, MID);
    if (mName && pair && m !== ctx.prev[mName] && inside(0, a, m)) {
      // no verdict: the prediction right after asks which side is dropped
      return `guess the middle: ${arrName}[${m}] = ${a[m]}, the target is ${t}`;
    }
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (/return/.test(ctx.src) && mName && inside(0, a, m) && a[m] === t) return `${arrName}[${m}] = ${t} is the target: return ${m}`;
    if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return null;
    const left = lo > hi ? `nothing left: ${t} is not on the shelf` : `${hi - lo + 1} left to search`;
    const [, pm] = firstInt(ctx.prev, MID);
    const s = sides(a, ctx.prev[loName], pm, ctx.prev[hiName], t);
    const moved = lo !== ctx.prev[loName] ? 'lo' : hi !== ctx.prev[hiName] ? 'hi' : null;
    if (moved && s) {
      const range = `${s.side} side ${s.from}…${s.to} is in order`;
      const kept = (moved === 'lo') === (s.side === 'right');
      return kept ? `${range} and holds ${t}: keep it (${left})` : `${range}, ${t} is not in it: drop it (${left})`;
    }
    if (lo > hi) return `${loName} = ${lo} passed ${hiName} = ${hi}: ${left}`;
    return null;
  },
  // right after a guess: which side goes?
  predict(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next || !inside(0, a, m)) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const t = ctx.vars[tName];
    const nx = ctx.next.vars;
    const moved = nx[loName] > lo ? 'left' : nx[hiName] < hi ? 'right' : ctx.next.ret && a[m] === t ? 'found' : null;
    const s = sides(a, lo, m, hi, t);
    if (!moved || !s) return null;
    const why = moved === 'found'
      ? `${a[m]} is the target, so its index ${m} is returned.`
      : `The ${s.side} side ${s.from}…${s.to} is in order${s.holds ? ` and ${t} lies inside it, so the search stays there` : `, and ${t} is not between its ends, so the target can only be on the other side`}.`;
    return {
      question: `${[...new Set([lo, m, hi])].map((i) => `${arrName}[${i}] = ${a[i]}`).join(', ')}; the target is ${t}. What happens next?`,
      options: [`Drop the left side (${loName} moves up)`, `Drop the right side (${hiName} moves down)`, `Stop: ${arrName}[${m}] is the target`],
      answer: { left: 0, right: 1, found: 2 }[moved],
      explain: why,
    };
  },
  bugs: [
    {
      label: 'Strict check: nums[lo] < nums[mid]',
      find: 'nums[lo] <= nums[mid]',
      replace: 'nums[lo] < nums[mid]',
      explain: 'When lo === mid the one-item left side is in order, but the strict check calls it unordered and range-checks the wrong side, so [3, 1] never finds 1.',
    },
    {
      label: 'Range-check the left side against nums[hi]',
      find: 'target < nums[mid]) hi = mid - 1',
      replace: 'target <= nums[hi]) hi = mid - 1',
      explain: 'The left side is checked against the right end of the bracket instead of its own end, so targets past the cut are searched for on the wrong side.',
    },
  ],
};
