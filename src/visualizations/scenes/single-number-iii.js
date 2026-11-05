// Single Number III. Pairs cancel under XOR (switches flipped twice), so XOR-ing everything leaves a ^ b: the
// places where the two loners differ. One of those bits splits the numbers into two groups: each loner lands in a
// different group and pairs always travel together, so XOR inside a group leaves one loner. Variables are found by
// shape: an accumulator assigned with ^ on its line, a split bit (a single 1), groups fed from the input.
import { options, row } from './util.js';

const isInt = Number.isInteger;
const INDEX = new Set(['i', 'j', 'k', 'idx', 'index']);

/** common binary width of the input, or 0 when it has negatives / is too wide to read */
function widthOf(nums) {
  if (!nums.every((v) => isInt(v) && v >= 0)) return 0;
  const w = Math.max(1, ...nums.map((v) => v.toString(2).length));
  return w <= 12 ? w : 0;
}
const fmt = (v, w) => (w ? v.toString(2).padStart(w, '0') : String(v));
const named = (v, w) => (w ? `${v} (${fmt(v, w)})` : String(v));
const oneBit = (v) => isInt(v) && v !== 0 && (v & (v - 1)) === 0;
const xorLine = (src, k) => new RegExp(`\\b${k}\\s*(\\^=|=[^=].*\\^)`).test(src || '');

/** [d, x] from a line like `d = x & -x` (also x & (~x + 1), x & ~(x - 1), -x & x): the split bit and a ^ b */
function splitNames(lines) {
  for (const l of lines || []) {
    const m = l.match(/\b(\w+)\s*=\s*(\w+)\s*&\s*\(?\s*[-~]\s*\(?\s*(\w+)/) || l.match(/\b(\w+)\s*=\s*\(?\s*-\s*(\w+)\s*\)?\s*&\s*(\w+)/);
    if (m && m[2] === m[3]) return [m[1], m[2]];
  }
  return [null, null];
}

/** the split bit's name once it holds a single 1 */
function splitOf(ctx) {
  const [d] = splitNames(ctx.lines);
  return d && oneBit(ctx.vars[d]) ? d : null;
}

/** an accumulator that just took a number in with ^: { k, item, before } */
function absorbed(ctx, nums) {
  for (const k of Object.keys(ctx.vars)) {
    if (ctx.params.includes(k) || INDEX.has(k)) continue;
    const v = ctx.vars[k];
    const b = ctx.prev[k];
    if (!isInt(v) || !isInt(b) || v === b || !xorLine(ctx.src, k) || !nums.includes(v ^ b)) continue;
    return { k, item: v ^ b, before: b };
  }
  return null;
}

/** the number just looked at by a grouping step that changed no group (a loop variable holding an input value) */
function looked(ctx, nums, skip) {
  return Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && k !== skip && isInt(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k] && nums.includes(ctx.vars[k]));
}

export default {
  id: 'single-number-iii',
  metaphor: 'Pairs cancel, then one bit splits',
  caption: 'XOR of everything cancels the pairs and leaves a ^ b. Pick one bit where a and b differ: it sorts every number into two groups, a loner in each, pairs never split. XOR each group.',
  narrate(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums) return null;
    const w = widthOf(nums);
    const d = splitOf(ctx);
    const ab = absorbed(ctx, nums);
    if (!d) {
      if (ab) {
        const all = nums.reduce((s, v) => s ^ v, 0);
        const tail = ctx.vars[ab.k] === all && !absorbedNext(ctx, ab.k) ? `: the pairs are gone, ${ab.k} = a ^ b` : '';
        const move = `${ab.k} ${fmt(ab.before, w)} → ${fmt(ctx.vars[ab.k], w)}`;
        if (twinOf(nums, ab.before, ctx.vars[ab.k])) return `second ${named(ab.item, w)}: flips the same switches back, the pair cancels (${move})${tail}`;
        return `${named(ab.item, w)} flips its switches: ${move}${tail}`;
      }
      return null;
    }
    if (!(d in ctx.prev)) {
      const [, x] = splitNames(ctx.lines);
      if (!isInt(ctx.vars[x])) return null;
      return `${x} = ${fmt(ctx.vars[x], w)} has a 1 wherever the two loners differ; ${d} = ${fmt(ctx.vars[d], w)} keeps one such bit to split on`;
    }
    const bit = fmt(ctx.vars[d], w);
    if (ab) {
      const has = (ab.item & ctx.vars[d]) !== 0;
      return `${named(ab.item, w)} ${has ? 'has' : 'lacks'} bit ${bit}: into group ${ab.k}, ${fmt(ab.before, w)} → ${fmt(ctx.vars[ab.k], w)}`;
    }
    const v = looked(ctx, nums, d);
    if (v && new RegExp(`\\b${d}\\b`).test(ctx.src || '')) {
      const has = (ctx.vars[v] & ctx.vars[d]) !== 0;
      return `${named(ctx.vars[v], w)} ${has ? 'has' : 'lacks'} bit ${bit}: it belongs to the other group, not XOR-ed in here`;
    }
    if (ctx.ret && !ctx.next && Array.isArray(ctx.result)) return `each group kept its loner: ${ctx.result.join(' and ')}`;
    return null;
  },
  // before the split bit is taken, and before a number is sorted into a group
  predict(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums || !ctx.next) return null;
    const w = widthOf(nums);
    if (!w) return null;
    const nx = ctx.next.vars;
    const d = splitOf(ctx);
    if (!d) {
      const [nd, x] = splitNames(ctx.lines);
      if (!nd || !isInt(ctx.vars[x]) || nx[x] !== ctx.vars[x] || !oneBit(nx[nd]) || nx[nd] !== (ctx.vars[x] & -ctx.vars[x])) return null;
      const xv = ctx.vars[x];
      const high = 2 ** (31 - Math.clz32(xv));
      return options(`${x} = ${fmt(xv, w)}. Which bit does ${x} & -${x} keep?`, fmt(nx[nd], w), [fmt(high, w), fmt(xv, w), fmt(1, w)], `-${x} flips every bit above the lowest 1 and keeps that 1, so the AND leaves only the lowest 1 of ${fmt(xv, w)}: ${fmt(nx[nd], w)}.`);
    }
    // the next step XORs a number into a group: which group?
    const k = Object.keys(nx).find((n) => !ctx.params.includes(n) && !INDEX.has(n) && isInt(nx[n]) && isInt(ctx.vars[n]) && nx[n] !== ctx.vars[n] && xorLine(ctx.lines[ctx.next.line - 1], n) && nums.includes(nx[n] ^ ctx.vars[n]));
    if (!k) return null;
    const item = nx[k] ^ ctx.vars[k];
    const bit = fmt(ctx.vars[d], w);
    const has = (item & ctx.vars[d]) !== 0;
    return {
      question: `Next up: ${named(item, w)}. The split bit is ${bit}. Which group does it join?`,
      options: [`The group with bit ${bit} set`, `The group with bit ${bit} clear`],
      answer: has ? 0 : 1,
      explain: `${fmt(item, w)} & ${bit} is ${has ? 'not 0' : '0'}. Its twin (if any) has the same bit, so the pair lands together and cancels.`,
    };
  },
  bugs: [
    {
      label: 'v & d === 0 without parentheses',
      find: 'if (v & d) a ^= v;',
      replace: 'if (v & d === 0) a ^= v;',
      explain: '=== binds tighter than &, so this is v & false = 0: no number ever joins the group, a stays 0 and the run returns [0, a ^ b].',
    },
  ],
};

/** true when the step after this one XORs another number into the same accumulator */
function absorbedNext(ctx, k) {
  return !!ctx.next && ctx.next.vars[k] !== ctx.vars[k];
}

/** true when the step from `before` to `now` is the second copy of a number (only when one prefix of nums fits) */
function twinOf(nums, before, now) {
  const pre = [0];
  for (const v of nums) pre.push(pre[pre.length - 1] ^ v);
  const ps = [];
  for (let p = 1; p < pre.length; p++) if (pre[p - 1] === before && pre[p] === now) ps.push(p);
  return ps.length === 1 && nums.slice(0, ps[0] - 1).filter((x) => x === nums[ps[0] - 1]).length % 2 === 1;
}
