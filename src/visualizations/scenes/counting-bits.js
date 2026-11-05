// Counting Bits. A tally board: each number i reads the count of a smaller number that is i minus one bit, and adds
// that bit back. Explains whichever recurrence the learner wrote (i & (i − 1), i >> 1, or a fresh count). The table is
// the first working array (not a parameter); a fill-then-write and a push-per-number build both work.
import { options, row } from './util.js';

const len = (v) => (v > 0 ? Math.floor(Math.log2(v)) + 1 : 1);
const bin = (v, w) => v.toString(2).padStart(w, '0');
const isPow2 = (k) => k > 0 && (k & (k - 1)) === 0;

const tableName = (ctx) => Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && row(ctx.vars[k]) && ctx.vars[k].every((x) => x === null || Number.isInteger(x)));

/** index of the one cell written between before and after (a write in place, or one push), else -1 */
function written(after, before) {
  if (!after || !before) return -1;
  if (after.length === before.length + 1 && before.every((x, i) => x === after[i])) return before.length;
  if (after.length !== before.length) return -1;
  const d = after.map((x, i) => (x === before[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 1 ? d[0] : -1;
}

/** why a[k] = v, in bits: the recurrence it matches (the shift one first when the code shifts) */
function why(a, k, v, w, shifts) {
  if (k === 0) return `0 has no 1s`;
  const low = k & (k - 1);
  const half = k >> 1;
  const byShift = a[half] + (k & 1) === v;
  if (a[low] + 1 === v && !(shifts && byShift)) return `${k} = ${bin(k, w)} minus its lowest 1 is ${bin(low, w)} (${low} has ${a[low]} one${a[low] === 1 ? '' : 's'}): ${a[low]} + 1 = ${v}`;
  if (byShift) return `${k} = ${bin(k, w)} without its last bit is ${bin(half, w)} (${half} has ${a[half]}), plus last bit ${k & 1} = ${v}`;
  return `${k} = ${bin(k, w)} has ${v} one${v === 1 ? '' : 's'}`;
}

export default {
  id: 'counting-bits',
  metaphor: 'Borrow the count of a smaller number',
  caption: 'Cell i holds how many 1s i has in binary. Each new cell copies the count of a smaller number that is i minus one bit, then adds that bit back.',
  narrate(ctx) {
    const name = tableName(ctx);
    if (!name) return null;
    const a = ctx.vars[name];
    const n = ctx.vars[ctx.params[0]];
    const w = len(Number.isInteger(n) ? n : a.length);
    if (!(name in ctx.prev)) return a.length === 1 ? 'the board starts with cell 0: the number 0 has no 1s' : a.length ? `a tally board with ${a.length} cell${a.length === 1 ? '' : 's'}, 0…${a.length - 1}: one count per number` : null;
    const k = written(a, row(ctx.prev[name]));
    if (k < 0 || !Number.isInteger(a[k])) return null;
    const note = why(a, k, a[k], w, ctx.lines.some((l) => l.includes('>>')));
    return isPow2(k) && k > 1 ? `${note} · a power of two has a single 1` : note;
  },
  // before a cell is written: how many 1s does that number have? Asked at powers of two and all-ones numbers first.
  predict(ctx) {
    const name = tableName(ctx);
    if (!name || !ctx.next) return null;
    const a = ctx.vars[name];
    const after = row(ctx.next.vars[name]);
    const k = written(after, a);
    if (k < 2 || !Number.isInteger(after[k])) return null;
    if (!isPow2(k) && (k & (k + 1)) !== 0 && k !== after.length - 1) return null;
    const n = ctx.vars[ctx.params[0]];
    const w = len(Number.isInteger(n) ? n : after.length);
    const v = after[k];
    const prevCount = a[k - 1];
    return options(`Next: ${k} = ${bin(k, w)}. How many 1s does it get?`, v, [v + 1, v - 1, prevCount].filter((x) => Number.isInteger(x) && x >= 0 && x !== v), `${why(after, k, v, w, ctx.lines.some((l) => l.includes('>>')))}.`);
  },
  bugs: [
    {
      label: 'Loop stops at n − 1',
      find: 'i <= n',
      replace: 'i < n',
      explain: 'The table has n + 1 cells (0…n); stopping at n − 1 leaves the last cell at 0, so n = 2 gives [0, 1, 0].',
    },
    {
      label: 'Borrow from i − 1 instead of i without its lowest 1',
      find: 'bits[i & (i - 1)]',
      replace: 'bits[i - 1]',
      explain: 'i − 1 does not always have one fewer 1: 2 = 10 and 1 = 01 both have one, so the counts just keep climbing.',
    },
  ],
};
