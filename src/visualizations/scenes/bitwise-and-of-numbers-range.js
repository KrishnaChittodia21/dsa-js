// Bitwise AND of Numbers Range. Two odometers, left and right: every number between them is ANDed, and any bit below
// the shared leading bits takes both values somewhere in the range, so it ends as 0. The scene strips low bits until
// the two ends agree (shift version, counter found by shape) or drops right's lowest 1 until right ≤ left (Kernighan).
import { options } from './util.js';

const isNum = (v) => Number.isInteger(v) && v >= 0;
const len = (v) => (v > 0 ? Math.floor(Math.log2(v)) + 1 : 1);

/** binary of every value, padded to a common width; decimal when too wide to read */
function bins(...vs) {
  const w = Math.max(...vs.map(len));
  return vs.map((v) => (w > 16 ? String(v) : v.toString(2).padStart(w, '0')));
}

/** a counter (not a parameter) that went up by 1 this step */
/** true when the current line writes a parameter (then the first step no longer shows the original range) */
const writesParam = (ctx) => ctx.params.some((p) => new RegExp(`\\b${p}\\s*([&|^+-]|>>|<<)?=[^=]`).test(ctx.src || ''));

const counter = (ctx) => Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && isNum(ctx.vars[k]) && ctx.vars[k] === ctx.prev[k] + 1) || null;

export default {
  id: 'bitwise-and-of-numbers-range',
  metaphor: 'Two odometers keep only shared leading digits',
  caption: 'left and right are written in binary. Below their shared leading bits, every bit is 0 for some number in the range, so the AND keeps the shared prefix and fills the rest with 0s.',
  narrate(ctx) {
    const [ln, rn] = ctx.params;
    const l = ctx.vars[ln];
    const r = ctx.vars[rn];
    if (!isNum(l) || !isNum(r)) return null;
    const pl = ctx.prev[ln];
    const pr = ctx.prev[rn];
    if (!isNum(pl) || !isNum(pr)) {
      if (writesParam(ctx)) return null;
      const [a, b] = bins(l, r);
      return `${ln} = ${a}, ${rn} = ${b}: every number from ${l} to ${r} is ANDed together`;
    }
    if (l !== pl && r === pr && l === pl >> 1) {
      const [a, b] = bins(pl, l);
      return `${ln} loses its last bit: ${a} → ${b}`;
    }
    if (r !== pr && l === pl) {
      const [a, b] = bins(pr, r);
      if (r === pr >> 1) return `${rn} loses its last bit too: ${a} → ${b}`;
      if (r === (pr & (pr - 1))) return `${rn} drops its lowest 1: ${a} → ${b} (${ln} = ${bins(l, pr)[0]})`;
      return null;
    }
    const c = counter(ctx);
    if (c) return `${ctx.vars[c]} low bit${ctx.vars[c] === 1 ? '' : 's'} stripped from both ends: ${ln} = ${bins(l, r)[0]}, ${rn} = ${bins(l, r)[1]}`;
    if (ctx.ret && isNum(ctx.result)) {
      const [res] = bins(ctx.result);
      if (l === r && ctx.result !== l) return `${ln} = ${rn} = ${bins(l)[0]}: the shared prefix. Refill the stripped bits with 0s → ${res} = ${ctx.result}`;
      if (l === r) return `${ln} = ${rn} = ${res}: only the shared prefix is left, the AND is ${ctx.result}`;
      return `${rn} = ${bins(r)[0]} is no longer above ${ln}: what is left is the shared prefix, ${res} = ${ctx.result}`;
    }
    return null;
  },
  // at the start: which bits survive? after a strip: does the loop strip again?
  predict(ctx) {
    const [ln, rn] = ctx.params;
    const l = ctx.vars[ln];
    const r = ctx.vars[rn];
    if (!isNum(l) || !isNum(r)) return null;
    if (!Object.keys(ctx.prev).length) {
      if (!isNum(ctx.result) || writesParam(ctx)) return null;
      const f = (v) => (len(Math.max(r, v)) > 16 ? String(v) : `${bins(r, v)[1]} (${v})`);
      return options(`AND of every number from ${ln} = ${bins(l, r)[0]} to ${rn} = ${bins(l, r)[1]}. What will your run return?`, f(ctx.result), [f(l & r), f(l), f(r), f(0)], `Bits above the first place where ${ln} and ${rn} differ are the same in every number; at and below it, some number has a 0. Your run returns ${ctx.result}.`);
    }
    if (!ctx.next) return null;
    const pl = ctx.prev[ln];
    const pr = ctx.prev[rn];
    if (!isNum(pl) || !isNum(pr)) return null;
    const c = counter(ctx);
    const kern = r !== pr && l === pl && r === (pr & (pr - 1)); // a Kernighan strip of right just happened
    if (!c && !kern) return null;
    const nx = ctx.next.vars;
    const again = nx[ln] !== l || nx[rn] !== r;
    if (!again && !ctx.next.ret) return null;
    const [a, b] = bins(l, r);
    return {
      question: `${ln} = ${a}, ${rn} = ${b}. Does the loop strip another bit?`,
      options: ['Yes: keep going', 'No: stop here'],
      answer: again ? 0 : 1,
      explain: again ? (l === r ? 'Your loop keeps going even though the two ends agree.' : `${a} and ${b} still differ, so their shared prefix is shorter than this.`) : l === r ? `${a} = ${b}: the two ends agree, so this is the shared prefix.` : `${rn} = ${b} is no longer above ${ln} = ${a}: the prefix is what is left.`,
    };
  },
  bugs: [
    {
      label: 'Forget to refill the stripped bits',
      find: 'return left << shift;',
      replace: 'return left;',
      explain: 'After stripping, left holds only the prefix bits moved down: 5…7 leaves 1, but the prefix 1 belongs in the top place, 100 = 4.',
    },
  ],
};
