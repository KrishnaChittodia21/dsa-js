// First Missing Positive (cyclic sort). Numbered guests and numbered chairs: guest v belongs in chair v - 1. Guests
// are walked to their own chairs; numbers outside 1..n have no chair. Then the first chair without its own guest
// gives the answer. Works with any index name in IDX; the in-place index-marking variant falls back to generic notes.
import { options, row, swapped } from './util.js';

const IDX = ['i', 'j', 'k', 'idx', 'pos', 'p', 'cur'];
const home = (a, v) => Number.isInteger(v) && v >= 1 && v <= a.length;
// every number that has a chair is in it (or its chair already holds a copy)
const settled = (a) => a.every((v) => !home(a, v) || a[v - 1] === v);
// the index variable that moved this step (new, or changed by any amount)
const movedIdx = (ctx, n) => IDX.find((k) => Number.isInteger(ctx.vars[k]) && ctx.vars[k] >= 0 && ctx.vars[k] <= n && ctx.vars[k] !== ctx.prev[k]);

export default {
  id: 'first-missing-positive',
  metaphor: 'Numbered guests walking to their chairs',
  caption: 'Slot s is the chair of guest s + 1. A guest is swapped into its own chair; 0, negatives and numbers above n have no chair and stay put. The first chair without its own guest is the answer.',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a) return null;
    const n = a.length;
    if (b && b.length === n) {
      const sw = swapped(a, b);
      if (sw) {
        const [x, y] = sw;
        const [h, o] = a[y] === y + 1 ? [y, x] : a[x] === x + 1 ? [x, y] : [-1, -1];
        if (h < 0) return null;
        const both = a[o] === o + 1;
        return both ? `${a[x]} and ${a[y]} trade chairs: both are in their own chairs now` : `${a[h]} walks to its own chair, slot ${h}; ${a[o]} comes to slot ${o} and is looked at next`;
      }
      if (a.some((v, k) => v !== b[k])) return null;
    }
    const k = movedIdx(ctx, n);
    if (!k) return /^return\b/.test(ctx.src) && a.every((v, s) => v === s + 1) ? `every chair holds its own guest 1…${n}: the first missing positive is ${n + 1}` : null;
    const q = ctx.vars[k];
    const p = ctx.prev[k];
    const fresh = !Number.isInteger(p) || q < p;
    const okBefore = a.slice(0, q).every((v, s) => v === s + 1);
    // the final walk: a check line like `if (nums[j] !== j + 1) return j + 1`
    const t = `${ctx.src} ${(ctx.lines[ctx.line] || '').trim()}`;
    const check = /\breturn\b/.test(t) && /\+\s*1/.test(t);
    if (check && settled(a) && okBefore) {
      if (q === n) return `chairs 0…${n - 1} all hold their own guests 1…${n}: the first missing positive is ${n + 1}`;
      if (a[q] !== q + 1) return `chair ${q} holds ${a[q]}, not ${q + 1}: nobody numbered ${q + 1} came, so ${q + 1} is the first missing positive`;
      if (fresh) return `every guest is seated; walk the chairs from the left: chair ${q} holds its own guest ${q + 1}`;
    }
    if (fresh || q !== p + 1 || !(p < n)) return null;
    const v = a[p];
    if (!home(a, v)) return `${v} has no chair (only 1…${n} do): leave it in slot ${p} and move on`;
    if (v === p + 1) return `${v} is already in its own chair, slot ${p}: move on`;
    if (a[v - 1] === v) return `${v}'s chair (slot ${v - 1}) already holds a ${v}: this one is a duplicate, move on`;
    return null;
  },
  // before slot i is handled: is its number swapped home, or left alone?
  predict(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    if (!a || !ctx.next) return null;
    const after = row(ctx.next.vars[name]);
    if (!after || after.length !== a.length) return null;
    const n = a.length;
    const k = IDX.find((x) => Number.isInteger(ctx.vars[x]) && ctx.vars[x] >= 0 && ctx.vars[x] < n);
    if (!k) return null;
    const i = ctx.vars[k];
    const v = a[i];
    const sw = swapped(after, a);
    const same = after.every((x, s) => x === a[s]);
    const moveOn = same && ctx.next.vars[k] === i + 1;
    const swap = sw && sw.includes(i);
    if (!swap && !moveOn) return null;
    if (settled(a) && !swap) return null; // the line-up is done: walking the chairs is no real decision
    const go = home(a, v) ? `Swap: ${v} goes to its chair, slot ${v - 1}` : 'Swap it with another slot';
    const stay = `Leave it, move on to slot ${i + 1}`;
    const why = swap
      ? `${v} belongs in slot ${v - 1}, which holds ${a[v - 1]}, not a ${v}: swap it home.`
      : !home(a, v)
        ? `${v} is outside 1…${n}, so it has no chair: skip it.`
        : v === i + 1
          ? `${v} is already in its own chair.`
          : `Slot ${v - 1} already holds a ${v}: swapping would loop forever on the duplicate, so skip it.`;
    return options(`Slot ${i} holds ${v} (n = ${n}). What happens to it?`, swap ? go : stay, [swap ? stay : go], why);
  },
  bugs: [
    {
      label: 'Forget the n + 1 case',
      find: 'return n + 1;',
      replace: 'return n;',
      explain: 'When every chair 1…n is filled the answer is n + 1, but this returns n: [1] gives 1 instead of 2.',
    },
    {
      label: 'The final walk skips chair 0',
      find: 'for (let j = 0; j < n; j++)',
      replace: 'for (let j = 1; j < n; j++)',
      explain: 'Chair 0 is the chair of guest 1. Starting the walk at chair 1 never notices that 1 is missing: [2] answers 2 instead of 1.',
    },
  ],
};
