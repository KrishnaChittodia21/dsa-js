// Sum of Two Integers. Schoolbook column addition in base 2, done for all columns at once: XOR writes each column's
// digit, AND finds the columns that hold two 1s, and << 1 carries those one column left. Repeat until nothing is
// carried. Works with the loop (carry var, a = a ^ b, b = carry) and the recursive form (getSum(a ^ b, carry)).
// Numbers are shown as two's-complement patterns of 4, 8 or 16 bits; wider runs (carries rippling to bit 31) use decimal.
import { options } from './util.js';

const isInt = Number.isInteger;

/** a common signed width for these values, or 0 when they need all 32 bits */
const widthOf = (vs) => [4, 8, 16].find((w) => vs.every((v) => v >= -(2 ** (w - 1)) && v < 2 ** (w - 1))) || 0;
const bin = (v, w) => (w ? (v & (2 ** w - 1)).toString(2).padStart(w, '0') : String(v));

/** every number on screen plus the input, the result and this round's carry: one width for the whole step */
function intsOf(ctx) {
  const [a, b] = ctx.params.map((n) => ctx.vars[n]);
  const carry = isInt(a) && isInt(b) ? [(a & b) << 1] : [];
  return [...Object.values(ctx.vars), ...Object.values(ctx.prev), ...(ctx.input || []), ctx.result, ...carry].filter(isInt);
}

export default {
  id: 'sum-of-two-integers',
  metaphor: 'Column addition: digits now, carries later',
  caption: 'Each round adds every column at once: XOR writes the digit, and columns holding two 1s send a carry one column left. The carries are then added the same way, until none are left.',
  narrate(ctx) {
    const [an, bn] = ctx.params;
    const a = ctx.vars[an];
    const b = ctx.vars[bn];
    if (!isInt(a) || !isInt(b)) return null;
    const pa = ctx.prev[an];
    const pb = ctx.prev[bn];
    const w = widthOf(intsOf(ctx));
    const f = (v) => bin(v, w);
    if (ctx.ret && b === 0) return `nothing left to carry: the sum is ${an} = ${f(a)}${w ? ` (${a})` : ''}`;
    const src = ctx.src || '';
    // recursion: a new call starts with (digits, carries)
    if (isInt(pa) && isInt(pb) && a !== pa && b !== pb) {
      return `next round: ${an} = ${f(a)} (the column digits), ${bn} = ${f(b)} (the carries still to add)`;
    }
    // a = a ^ b: the digits of every column, carries ignored
    if (isInt(pa) && a !== pa && b === pb && a === (pa ^ b) && src.includes('^')) {
      return `add every column, ignoring carries: ${f(pa)} ^ ${f(b)} → ${an} = ${f(a)}`;
    }
    // b = carry: the carries become the number still to add
    if (isInt(pb) && b !== pb && a === pa) {
      const from = Object.keys(ctx.vars).find((k) => k !== an && k !== bn && ctx.vars[k] === b);
      if (from) return b === 0 ? `no carries this round: ${bn} = 0, the addition is finished` : `the carries become the number still to add: ${bn} = ${f(b)}`;
    }
    for (const k of Object.keys(ctx.vars)) {
      if (k === an || k === bn || !isInt(ctx.vars[k]) || ctx.vars[k] === ctx.prev[k]) continue;
      const v = ctx.vars[k];
      if (/<<|\*/.test(src) && v === ((a & b) << 1)) {
        if (v === 0) return `${f(a)} and ${f(b)} never both have a 1 in a column: nothing to carry, ${k} = 0`;
        return `columns where both have a 1 (${f(a & b)}) carry one column left: ${k} = ${f(v)}`;
      }
      if (src.includes('^') && v === (a ^ b)) return `add every column, ignoring carries: ${f(a)} ^ ${f(b)} → ${k} = ${f(v)}`;
    }
    return null;
  },
  // right before the XOR: what are the column digits?
  predict(ctx) {
    const [an, bn] = ctx.params;
    const a = ctx.vars[an];
    const b = ctx.vars[bn];
    if (!ctx.next || !isInt(a) || !isInt(b) || (a & b) === 0) return null;
    const nsrc = ctx.lines[ctx.next.line - 1] || '';
    if (!nsrc.includes('^')) return null;
    const nx = ctx.next.vars;
    const k = Object.keys(nx).find((n) => n !== bn && isInt(nx[n]) && nx[n] !== ctx.vars[n] && nx[n] === (a ^ b));
    if (!k) return null;
    const w = widthOf([a, b, a ^ b, a | b, a & b, a + b]);
    if (!w) return null;
    const f = (v) => bin(v, w);
    return options(
      `${an} = ${f(a)}, ${bn} = ${f(b)}. Add each column and drop the carries: what do you get?`,
      f(a ^ b),
      [f(a | b), f(a & b), f(a + b)].filter((s) => s !== f(a ^ b)),
      `1 + 0 = 1 and 0 + 0 = 0, but 1 + 1 = 0 with a carry: that is XOR, ${f(a)} ^ ${f(b)} = ${f(a ^ b)}. The carries (${f(a & b)} moved left) are added next round.`,
    );
  },
  maxPredicts: 2,
  bugs: [
    {
      label: 'Carry not shifted left',
      find: '(a & b) << 1',
      replace: '(a & b)',
      explain: 'A carry belongs to the next column. Left in place, 1 + 1 gives carry 1 in column 0 again, and the run returns 1 instead of 2.',
    },
    {
      label: 'OR instead of XOR for the digits',
      find: 'a = a ^ b',
      replace: 'a = a | b',
      explain: 'OR writes 1 for 1 + 1 as well, so a carried column is counted twice: 1 + 1 returns 3 instead of 2.',
    },
  ],
};
