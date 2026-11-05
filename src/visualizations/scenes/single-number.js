// Single Number. A panel of switches: XOR-ing a value in flips its switches, so the second copy of a value flips them
// back and the pair vanishes; only the loner stays lit. The accumulator is found by shape: a number assigned with ^ on
// its line whose value matches a prefix XOR of the input, which also tells which copy of a value just came in.
import { options, row } from './util.js';

const INDEX = new Set(['i', 'j', 'k', 'idx', 'index']);

/** common binary width of the input, or 0 when it has negatives / is too wide to read */
function widthOf(nums) {
  if (!nums.every((v) => Number.isInteger(v) && v >= 0)) return 0;
  const w = Math.max(1, ...nums.map((v) => v.toString(2).length));
  return w <= 12 ? w : 0;
}
const fmt = (v, w) => (w ? v.toString(2).padStart(w, '0') : String(v));
const named = (v, w) => (w ? `${v} (${fmt(v, w)})` : String(v));

function prefixes(nums) {
  const p = [0];
  for (const v of nums) p.push(p[p.length - 1] ^ v);
  return p;
}

const xorLine = (src, k) => new RegExp(`\\b${k}\\s*(\\^=|=[^=].*\\^)`).test(src || '');

/** { k, p }: the accumulator and how many numbers it holds (p = null when several prefixes fit) */
function acc(ctx) {
  const nums = row(ctx.input?.[0]);
  if (!nums) return null;
  const pre = prefixes(nums);
  const idx = Object.keys(ctx.vars).filter((n) => INDEX.has(n) && Number.isInteger(ctx.vars[n])).map((n) => ctx.vars[n]);
  for (const k of Object.keys(ctx.vars)) {
    if (ctx.params.includes(k) || INDEX.has(k)) continue;
    const v = ctx.vars[k];
    const b = ctx.prev[k];
    if (!Number.isInteger(v)) continue;
    if (!(k in ctx.prev)) {
      // a fresh accumulator: 0, or seeded with the first number
      if (v === 0 && nums.length) return { k, p: 0, nums, pre, start: true };
      if (nums.length && v === nums[0]) return { k, p: 1, nums, pre, start: true };
      continue;
    }
    if (!Number.isInteger(b) || v === b || !xorLine(ctx.src, k)) continue;
    const ps = [];
    for (let p = 1; p < pre.length; p++) if (pre[p - 1] === b && pre[p] === v) ps.push(p);
    if (!ps.length) continue;
    const p = ps.length === 1 ? ps[0] : ps.find((q) => idx.includes(q - 1)) ?? null;
    return { k, p, nums, pre, b };
  }
  return null;
}

/** true when nums[p - 1] is the second copy of its value */
const second = (nums, p) => nums.slice(0, p - 1).filter((x) => x === nums[p - 1]).length % 2 === 1;

export default {
  id: 'single-number',
  metaphor: 'Flip switches, pairs flip them back',
  caption: 'The accumulator is a row of switches. Each number flips the switches of its 1-bits; a second copy flips the same ones back, so pairs vanish and only the loner stays lit.',
  narrate(ctx) {
    const a = acc(ctx);
    if (a) {
      const w = widthOf(a.nums);
      const v = ctx.vars[a.k];
      if (a.start) return a.p === 0 ? `${a.k} starts at ${fmt(0, w)}: every switch is off` : `${a.k} starts with the first number, ${named(v, w)}`;
      const item = v ^ a.b;
      const move = `${a.k}: ${fmt(a.b, w)} → ${fmt(v, w)}`;
      if (a.p === null) return `${named(item, w)} flips its switches, ${move}`;
      if (second(a.nums, a.p)) return `second ${named(item, w)}: flips the same switches back, the pair cancels (${move})`;
      return `${named(item, w)} comes in and flips its switches (${move})`;
    }
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.result)) {
      const nums = row(ctx.input?.[0]);
      return `every pair has cancelled itself: only ${nums ? named(ctx.result, widthOf(nums)) : ctx.result} is left lit`;
    }
    return null;
  },
  // right before a second copy comes in: what is left?
  predict(ctx) {
    const a = acc(ctx);
    if (!a || a.p === null || !ctx.next || a.p >= a.nums.length) return null;
    const cur = ctx.vars[a.k];
    const nx = ctx.next.vars[a.k];
    const item = a.nums[a.p];
    if (nx === cur || nx !== a.pre[a.p + 1] || nx !== (cur ^ item) || !second(a.nums, a.p + 1)) return null;
    const w = widthOf(a.nums);
    return options(
      `${a.k} = ${fmt(cur, w)}. Next comes the second ${named(item, w)}. What is ${a.k} after XOR-ing it in?`,
      fmt(nx, w),
      [fmt(cur | item, w), fmt(cur & item, w), fmt(item, w), fmt(cur, w)].filter((s) => s !== fmt(nx, w)),
      `XOR flips the switches where ${item} has a 1. Its first copy flipped them already, so they flip back: ${fmt(cur, w)} ^ ${fmt(item, w)} = ${fmt(nx, w)}.`,
    );
  },
  bugs: [
    {
      label: 'Seed with nums[0], then XOR it again',
      find: 'let x = 0;',
      replace: 'let x = nums[0];',
      explain: 'The loop still XORs every number, so the first one goes in twice and cancels itself: [4, 1, 2, 1, 2] returns 0 instead of 4.',
    },
    {
      label: 'Add instead of XOR',
      find: 'x ^= v',
      replace: 'x += v',
      explain: 'A sum never forgets: pairs pile up instead of cancelling, so [2, 2, 1] returns 5 instead of 1.',
    },
  ],
};
