// Single Number II. Every bit column keeps a tally that counts 0 → 1 → 2 → back to 0: triples wipe themselves out,
// and the columns left at 1 are the single number's bits. Two masks hold the tallies for all columns at once:
// `ones` = columns at 1, `twos` = columns at 2. The masks are found from the source (`A = (A ^ x) & ~B`) or by name;
// the per-bit counting version (result |= 1 << b when count % 3 === 1) is narrated by the bit it adds.
import { options, row } from './util.js';

const isInt = Number.isInteger;

/** common binary width of the input, or 0 when it has negatives / is too wide to read */
function widthOf(nums) {
  if (!nums.every((v) => isInt(v) && v >= 0)) return 0;
  const w = Math.max(1, ...nums.map((v) => v.toString(2).length));
  return w <= 12 ? w : 0;
}
const fmt = (v, w) => (w ? v.toString(2).padStart(w, '0') : String(v));
const named = (v, w) => (w ? `${v} (${fmt(v, w)})` : String(v));
/** one digit per column, high to low: 0, 1 (in ones) or 2 (in twos) */
const tally = (ones, twos, w) => Array.from({ length: w }, (_, i) => ((twos >> (w - 1 - i)) & 1 ? 2 : (ones >> (w - 1 - i)) & 1)).join('');

/** { o, t, x }: the ones / twos masks and the loop item, from lines like `o = (o ^ x) & ~t` */
function masks(ctx) {
  const found = [];
  for (const l of ctx.lines || []) {
    const m = l.match(/\b(\w+)\s*=\s*\(\s*\1\s*\^\s*(\w+)\s*\)\s*&\s*~\s*\(?\s*(\w+)/);
    if (m) found.push(m);
  }
  if (found.length >= 2 && found[0][3] === found[1][1] && found[1][3] === found[0][1]) return { o: found[0][1], t: found[1][1], x: found[0][2] };
  const o = ['ones', 'one', 'once', 'seenOnce'].find((n) => n in ctx.vars);
  const t = ['twos', 'two', 'twice', 'seenTwice'].find((n) => n in ctx.vars);
  return o && t ? { o, t, x: ['x', 'num', 'n', 'v', 'val'].find((n) => n in ctx.vars || n in (ctx.next?.vars || {})) } : null;
}
const assigns = (src, k) => new RegExp(`^\\s*${k}\\s*(=[^=]|\\^=|&=|\\|=)`).test(src || '');

export default {
  id: 'single-number-ii',
  metaphor: 'A 0-1-2 tally for every bit',
  caption: 'Each bit column counts its 1s modulo 3: 0 → 1 → 2 → 0. Three copies of a number wipe their columns back to 0, so the columns left at 1 spell the single number.',
  narrate(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums) return null;
    const w = widthOf(nums);
    const m = masks(ctx);
    if (m && isInt(ctx.vars[m.o]) && isInt(ctx.vars[m.t])) {
      const ones = ctx.vars[m.o];
      const twos = ctx.vars[m.t];
      const x = ctx.vars[m.x];
      if (ctx.ret && !ctx.next) return w ? `columns left at 1 are the single number's bits: ${m.o} = ${fmt(ones, w)} = ${ones}` : `the columns left at 1 spell the single number: ${m.o} = ${ones}`;
      if (!(m.o in ctx.prev)) return w ? `every column's tally starts at 0: ${tally(0, 0, w)}` : `${m.o} = 0, ${m.t} = 0: every column's tally starts at 0`;
      if (!isInt(x)) return null;
      if (assigns(ctx.src, m.o) && x === 0) return `0 arrives: it has no 1s, no column counts up`;
      if (assigns(ctx.src, m.o)) return `${named(x, w)} arrives: each column where it has a 1 counts up; ${m.o} ${fmt(ctx.prev[m.o], w)} → ${fmt(ones, w)}`;
      if (assigns(ctx.src, m.t)) {
        if (!w) return `after ${x}: ${m.o} = ${ones}, ${m.t} = ${twos}`;
        // a column x hit that now reads 0 went 2 → 3 → 0
        const reset = [];
        for (let b = 0; b < w; b++) if ((x >> b) & 1 && !((ones >> b) & 1) && !((twos >> b) & 1)) reset.push(2 ** b);
        const r = reset.length ? `; the ${reset.join('s, ')}s column${reset.length > 1 ? 's' : ''} hit 3 and reset to 0` : '';
        return `tally per column after ${x}: ${tally(ones, twos, w)} (${m.t} = ${fmt(twos, w)})${r}`;
      }
      return null;
    }
    // per-bit counting: one bit is added to the answer
    for (const k of Object.keys(ctx.vars)) {
      const v = ctx.vars[k];
      const p = ctx.prev[k];
      if (ctx.params.includes(k) || !isInt(v) || !isInt(p) || v === p || !/\||<</.test(ctx.src || '')) continue;
      const bit = (v ^ p) >>> 0;
      if (bit & (bit - 1)) continue;
      const b = 31 - Math.clz32(bit);
      const c = ['count', 'cnt', 'c', 'sum', 'total'].find((n) => isInt(ctx.vars[n]) && ctx.vars[n] % 3 === 1);
      return `bit ${b}: ${c ? `${ctx.vars[c]} number${ctx.vars[c] === 1 ? ' has' : 's have'} it, ${ctx.vars[c]} % 3 = 1` : 'its count is 1 mod 3'}, so the single number has it → ${k} = ${v}`;
    }
    // per-bit counting: the test that found the bit's count is not 1 mod 3
    const c = ['count', 'cnt', 'c', 'sum', 'total'].find((n) => isInt(ctx.vars[n]));
    const bn = ['bit', 'b', 'i', 'k', 'pos', 'shift'].find((n) => isInt(ctx.vars[n]));
    if (c && bn && /%\s*3/.test(ctx.src || '') && ctx.vars[c] % 3 !== 1) {
      return `bit ${ctx.vars[bn]}: ${ctx.vars[c]} number${ctx.vars[c] === 1 ? ' has' : 's have'} it, ${ctx.vars[c]} % 3 = ${ctx.vars[c] % 3}: not a bit of the single number`;
    }
    if (ctx.ret && !ctx.next && isInt(ctx.result)) return `the bits whose count was 1 mod 3 spell the single number: ${ctx.result}`;
    return null;
  },
  // before ones takes the next number: what is left in ones?
  predict(ctx) {
    const nums = row(ctx.input?.[0]);
    const m = nums && masks(ctx);
    if (!m || !ctx.next) return null;
    const w = widthOf(nums);
    const ones = ctx.vars[m.o];
    const twos = ctx.vars[m.t];
    const nx = ctx.next.vars;
    const x = nx[m.x];
    if (!w || !isInt(ones) || !isInt(twos) || !isInt(x) || !isInt(nx[m.o]) || !assigns(ctx.lines[ctx.next.line - 1], m.o)) return null;
    if (((ones ^ x) & twos) === 0 || nx[m.o] !== ((ones ^ x) & ~twos)) return null; // ask only when the columns at 2 matter
    return options(
      `Tally per column: ${tally(ones, twos, w)}. Next ${named(x, w)} arrives. What is ${m.o} (the columns at 1) after it?`,
      fmt(nx[m.o], w),
      [fmt(ones ^ x, w), fmt(ones | x, w), fmt(x, w)],
      `Columns where ${x} has a 1 count up. A column at 0 goes to 1 (into ${m.o}); a column already at 2 goes to 3 = 0, so it does not land in ${m.o}: ${fmt(nx[m.o], w)}.`,
    );
  },
  bugs: [
    {
      label: 'Plain XOR: triples do not cancel',
      find: 'ones = (ones ^ x) & ~twos;',
      replace: 'ones = ones ^ x;',
      explain: 'XOR counts mod 2, not mod 3: three copies leave one copy behind. [2, 2, 3, 2] returns 2 ^ 3 = 1 instead of 3.',
    },
    {
      label: 'twos updated with the old ones',
      find: 'ones = (ones ^ x) & ~twos;       // bits seen 1 (mod 3) times\n    twos = (twos ^ x) & ~ones;',
      replace: 'const old = ones;\n    ones = (ones ^ x) & ~twos;\n    twos = (twos ^ x) & ~old;',
      explain: 'twos must skip the columns that just moved into ones. With the old ones, a first copy lands in ones and twos at once, and the tallies stop meaning 1 and 2.',
    },
  ],
};
