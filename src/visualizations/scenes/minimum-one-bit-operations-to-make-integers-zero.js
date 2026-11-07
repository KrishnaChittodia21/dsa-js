// Minimum One Bit Operations: a Gray-code odometer. Starting from 0, the two allowed moves visit 0, 1, 3, 2, 6, 7, 5, 4, …
// (the Gray code), so the moves needed for n = n's position in that order = the inverse Gray code:
// n ^ (n >> 1) ^ (n >> 2) ^ …. Follows the loop that folds every right shift of n into an accumulator.
import { firstInt } from './util.js';

const ACC = ['ans', 'res', 'result', 'answer', 'acc', 'moves', 'ops', 'count', 'steps', 'x', 'out'];
const bits = (v) => (v > 0 ? 32 - Math.clz32(v) : 1);
const bin = (v, w) => (v >>> 0).toString(2).padStart(w, '0');

function names(ctx) {
  const nName = ctx.params[0];
  if (!Number.isInteger(ctx.vars[nName])) return null;
  const rest = Object.fromEntries(Object.entries(ctx.vars).filter(([k]) => k !== nName));
  const [aName] = firstInt(rest, ACC);
  if (!aName) return null;
  // one width for the whole run: the answer has the same top bit as the starting n
  const w = Math.max(bits(ctx.vars[nName]), bits(ctx.vars[aName]), typeof ctx.result === 'number' ? bits(ctx.result) : 1);
  return { nName, aName, w };
}

export default {
  id: 'minimum-one-bit-operations-to-make-integers-zero',
  metaphor: 'Winding back a Gray-code odometer',
  caption: 'Counting up from 0 with the two moves visits 0, 1, 3, 2, 6, 7, 5, 4, …: the Gray code. The moves for n equal its place in that list, found by XOR-ing n with every right shift of itself.',
  compare: 'ans',
  narrate(ctx) {
    const nm = names(ctx);
    if (!nm) return null;
    const { nName, aName, w } = nm;
    const n = ctx.vars[nName];
    const a = ctx.vars[aName];
    if (ctx.ret && !ctx.next && typeof ctx.result === 'number') {
      return ctx.result === 0 ? `${nName} is already 0: no moves needed` : `${bin(ctx.result, w)} = ${ctx.result}: that many moves wind the odometer back to 0`;
    }
    const pa = ctx.prev[aName];
    if (Number.isInteger(pa) && a !== pa && (a ^ pa) === n) {
      if (ctx.prev[nName] !== n) return `${nName} shifts right to ${bin(n, w)} and is folded in: ${aName} ${bin(pa, w)} ^ ${bin(n, w)} = ${bin(a, w)} (${a})`;
      return `fold in ${nName} = ${bin(n, w)}: ${aName} ${bin(pa, w)} ^ ${bin(n, w)} = ${bin(a, w)} (${a})`;
    }
    const pn = ctx.prev[nName];
    if (Number.isInteger(pn) && n !== pn && n === pn >> 1) {
      return n === 0 ? `${nName} shifts right to 0: every shift has been folded in` : `${nName} shifts right: ${bin(pn, w)} → ${bin(n, w)}, the next copy to fold in`;
    }
    return null;
  },
  // right before a fold: what does the accumulator become?
  predict(ctx) {
    const nm = names(ctx);
    if (!nm || !ctx.next) return null;
    const { nName, aName, w } = nm;
    const n = ctx.vars[nName];
    const a = ctx.vars[aName];
    const na = ctx.next.vars[aName];
    const nn = ctx.next.vars[nName];
    // the reference shifts n in the loop header, so the fold may come in the same step as the shift
    const shifted = nn === n >> 1 && nn !== n;
    if (a === 0 || !Number.isInteger(na) || na === a || (nn !== n && !shifted) || nn === 0 || (na ^ a) !== nn) return null;
    const right = bin(na, w);
    const opts = [...new Set([right, bin(a | nn, w), bin(a & nn, w), bin(a + nn, w)])].filter((s) => s.length === w).sort();
    if (opts.length < 2) return null;
    return {
      question: shifted ? `${aName} = ${bin(a, w)}. ${nName} shifts right to ${bin(nn, w)} and is folded in. What does ${aName} become?` : `${aName} = ${bin(a, w)} and ${nName} = ${bin(n, w)}. What is ${aName} ^ ${nName}?`,
      options: opts,
      answer: opts.indexOf(right),
      explain: `XOR sets a bit where exactly one of the two has a 1: ${bin(a, w)} ^ ${bin(nn, w)} = ${right}.`,
    };
  },
  bugs: [
    {
      label: 'Forward Gray code instead of its inverse',
      find: 'ans ^= n;',
      replace: 'ans = n ^ (n >> 1); break;',
      explain: 'n ^ (n >> 1) turns a position into its Gray code; this question needs the opposite (which position holds n), so 6 gives 5 instead of 4.',
    },
  ],
};
