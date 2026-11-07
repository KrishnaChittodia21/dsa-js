// Gray Code. A row of n switches that walks through every setting, flipping exactly one switch per move and ending one
// flip away from all-off. Each written cell is compared with the cell before it; the formula i ^ (i >> 1) and the
// reflect-and-prefix build (pushing mirrored values with a new top bit) both narrate. The sequence is the first working
// array that is not a parameter.
import { options, row } from './util.js';

const bin = (v, w) => v.toString(2).padStart(w, '0');
const oneBit = (x) => x > 0 && (x & (x - 1)) === 0;
const bitOf = (x) => Math.round(Math.log2(x));
const lowBit = (k) => k & -k;

const seqName = (ctx) => Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && row(ctx.vars[k]) && ctx.vars[k].every((x) => x === null || x === undefined || Number.isInteger(x)));

/** index of the one cell written between before and after (in place, or one push), else -1 */
function written(after, before) {
  if (!after || !before) return -1;
  if (after.length === before.length + 1 && before.every((x, i) => x === after[i])) return before.length;
  if (after.length !== before.length) return -1;
  const d = after.map((x, i) => (x === before[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 1 ? d[0] : -1;
}

const width = (ctx) => {
  const n = ctx.vars[ctx.params[0]];
  return Number.isInteger(n) && n > 0 && n <= 16 ? n : null;
};

export default {
  id: 'gray-code',
  metaphor: 'Switches that change one at a time',
  caption: 'Each cell is a setting of n switches, written in binary. Neighbouring cells differ in exactly one switch, and the last cell is one flip away from the first.',
  narrate(ctx) {
    const name = seqName(ctx);
    const w = width(ctx);
    if (!name || !w) return null;
    const a = ctx.vars[name];
    if (!(name in ctx.prev)) return a.length === 1 ? 'start with one setting, every switch off; each round mirrors the list' : `${a.length} slot${a.length === 1 ? '' : 's'} for the ${1 << w} settings of ${w} switch${w === 1 ? '' : 'es'}`;
    const k = written(a, row(ctx.prev[name]));
    const g = a[k];
    if (k < 0 || !Number.isInteger(g) || g < 0) return null;
    const top = k > 0 ? 1 << Math.floor(Math.log2(k)) : 0;
    const m = 2 * top - 1 - k; // the slot k mirrors in reflect-and-prefix
    const formula = ctx.lines.some((l) => l.includes('>>')) && g === (k ^ (k >> 1)) && k > 1 ? `${bin(k, w)} XOR its half ${bin(k >> 1, w)}` : k > 1 && a[m] !== undefined && g === (a[m] | top) ? `mirror of slot ${m} with switch ${bitOf(top)} on` : null;
    if (k === 0) return `start with every switch off: ${bin(g, w)}`;
    const before = a[k - 1];
    if (!Number.isInteger(before)) return formula ? `slot ${k}: ${formula} = ${bin(g, w)}` : null;
    const diff = g ^ before;
    const flip = oneBit(diff) ? `only switch ${bitOf(diff)} flips` : `${diff.toString(2).split('1').length - 1} switches flip ✗`;
    const wrap = k === (1 << w) - 1 && a.length === 1 << w && Number.isInteger(a[0]) && oneBit(g ^ a[0]) ? ' · and one flip back to the start closes the circle' : '';
    return `slot ${k}: ${formula ? `${formula} = ` : ''}${bin(g, w)}, from ${bin(before, w)} ${flip}${wrap}`;
  },
  // before a cell is written: which switch flips?
  predict(ctx) {
    const name = seqName(ctx);
    const w = width(ctx);
    if (!name || !w || !ctx.next) return null;
    const a = ctx.vars[name];
    const after = row(ctx.next.vars[name]);
    const k = written(after, a);
    if (k < 2 || w < 2 || !Number.isInteger(after[k]) || !Number.isInteger(a[k - 1])) return null;
    const diff = after[k] ^ a[k - 1];
    if (!oneBit(diff) || diff >= 1 << w) return null; // a broken sequence: nothing fair to ask
    const b = bitOf(diff);
    const opts = Array.from({ length: Math.min(w, 4) }, (_, i) => `switch ${i}`);
    if (b >= opts.length) opts[opts.length - 1] = `switch ${b}`;
    const rule = diff === lowBit(k) ? ` In this order the move into slot ${k} = ${bin(k, w)} flips the switch at ${k}'s lowest 1.` : '';
    return {
      question: `Slot ${k - 1} is ${bin(a[k - 1], w)}. Which switch flips for slot ${k}? (switch 0 is the rightmost)`,
      options: opts,
      answer: opts.indexOf(`switch ${b}`),
      explain: `${bin(a[k - 1], w)} → ${bin(after[k], w)}: only switch ${b} changes.${rule}`,
    };
  },
  bugs: [
    {
      label: 'Plain counting order',
      find: 'i ^ (i >> 1)',
      replace: 'i',
      explain: 'Counting 0, 1, 2, 3 flips two switches between 1 = 01 and 2 = 10, so the one-flip rule breaks at once.',
    },
  ],
};
