// Scene: Sliding Window Median. Two piles meeting at the middle of the window: the small half (a max-heap, its top
// the largest small number) and the large half (a min-heap, its top the smallest large number). A number leaving
// the window is only marked as gone (lazy deletion) and thrown out once it surfaces on a top. Reads two heap-like
// variables (itemsOf; small half by name), a delayed-like counter (entriesOf) and the output array.
import { entriesOf, itemsOf, options } from './util.js';

const LOW = /low|small|left|max|^lo|lo$|^lh/i;
const HIGH = /high|large|big|right|min|^hi|hi$|^rh/i;
const DELAYED = /delay|remov|lazy|del|gone|trash|stale|pending/i;
const OUT = /^(out|res|result|ans|answer|medians?|output)$/i;

const nums = (a) => Array.isArray(a) && a.every((x) => typeof x === 'number');

/** { lowName, low, highName, high } or null */
function halves(ctx, vars) {
  if (!vars) return null;
  const hs = Object.entries(vars).filter(([k, v]) => !ctx.params.includes(k) && !OUT.test(k) && (v?.$obj || /heap|pq/i.test(k) || LOW.test(k) || HIGH.test(k)) && nums(itemsOf(v)));
  const lo = hs.filter(([k]) => LOW.test(k) && !HIGH.test(k));
  const hi = hs.filter(([k]) => HIGH.test(k) && !LOW.test(k));
  let pair = null;
  if (lo.length === 1 && hi.length === 1) pair = [lo[0], hi[0]];
  else if (hs.length === 2) pair = hs;
  if (!pair) return null;
  return { lowName: pair[0][0], low: itemsOf(pair[0][1]), highName: pair[1][0], high: itemsOf(pair[1][1]) };
}
function delayedOf(ctx, vars) {
  const k = Object.keys(vars || {}).find((x) => !ctx.params.includes(x) && DELAYED.test(x) && entriesOf(vars[x]));
  return k ? new Map(entriesOf(vars[k])) : null;
}
function outOf(ctx, vars) {
  const k = Object.keys(vars || {}).find((x) => !ctx.params.includes(x) && OUT.test(x) && nums(vars[x]));
  return k ? vars[k] : null;
}
function minus(a, b) {
  const left = [...b];
  return a.filter((x) => {
    const i = left.indexOf(x);
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
/** what moved between two snapshots: { into, from, x } (into null = thrown out of `from`) or null */
function move(before, after) {
  if (!before || !after || before.lowName !== after.lowName || before.highName !== after.highName) return null;
  const lAdd = minus(after.low, before.low);
  const lGone = minus(before.low, after.low);
  const hAdd = minus(after.high, before.high);
  const hGone = minus(before.high, after.high);
  const n = lAdd.length + lGone.length + hAdd.length + hGone.length;
  if (n === 1 && lAdd.length) return { into: 'low', from: null, x: lAdd[0] };
  if (n === 1 && hAdd.length) return { into: 'high', from: null, x: hAdd[0] };
  if (n === 1 && lGone.length) return { into: null, from: 'low', x: lGone[0] };
  if (n === 1 && hGone.length) return { into: null, from: 'high', x: hGone[0] };
  if (n === 2 && lGone.length === 1 && hAdd[0] === lGone[0]) return { into: 'high', from: 'low', x: hAdd[0] };
  if (n === 2 && hGone.length === 1 && lAdd[0] === hGone[0]) return { into: 'low', from: 'high', x: lAdd[0] };
  return null;
}
const SIDE = { low: 'small half', high: 'large half' };
const show = (a) => `[${[...a].sort((x, y) => x - y).join(', ')}]`;
/** a heap's items in order, those still marked as gone tagged "(gone)" */
function showLive(a, d) {
  const left = new Map(d || []);
  return `[${[...a].sort((x, y) => x - y).map((x) => (left.get(x) > 0 ? (left.set(x, left.get(x) - 1), `${x} (gone)`) : x)).join(', ')}]`;
}

export default {
  id: 'sliding-window-median',
  metaphor: 'Two piles meeting mid-window, stale ones swept late',
  caption: 'The left heap is the small half of the window (largest on top), the right heap the large half (smallest on top). A number that leaves the window is only marked as gone, and is thrown out when it reaches a top.',
  narrate(ctx) {
    const [numsName, kName] = ctx.params;
    const a = ctx.vars[numsName];
    const k = ctx.vars[kName];
    if (ctx.ret && Array.isArray(ctx.value)) return `every window has its median: [${ctx.value.join(', ')}]`;
    const out = outOf(ctx, ctx.vars);
    const pout = outOf(ctx, ctx.prev);
    if (out && pout && out.length === pout.length + 1 && nums(a) && Number.isInteger(k)) {
      const w = out.length - 1;
      const win = a.slice(w, w + k);
      return `window ${w} = [${win.join(', ')}], in order ${show(win)}: its median is ${out[w]}`;
    }
    const d = delayedOf(ctx, ctx.vars);
    const pd = delayedOf(ctx, ctx.prev);
    if (d && pd) {
      const up = [...d].find(([x, c]) => c > (pd.get(x) ?? 0));
      if (up) return `${up[0]} slides out of the window: it is only marked as gone (digging it out of a heap would be slow)`;
    }
    const h = halves(ctx, ctx.vars);
    if (!h) {
      // a sorted window array instead of two heaps
      const wk = Object.keys(ctx.vars).find((x) => !ctx.params.includes(x) && !OUT.test(x) && nums(ctx.vars[x]) && nums(ctx.prev[x]) && ctx.vars[x].length > 1);
      if (!wk) return null;
      const [now, was] = [ctx.vars[wk], ctx.prev[wk]];
      const gone = minus(was, now);
      const added = minus(now, was);
      if (gone.length === 1 && !added.length) return `${gone[0]} slides out of the window and is cut out of the sorted ${wk}`;
      if (added.length === 1 && !gone.length) return `${added[0]} enters the window and is slotted into its place in the sorted ${wk}`;
      return null;
    }
    const m = move(halves(ctx, ctx.prev), h);
    if (!m) return null;
    if (!m.into) return d && (d.get(m.x) ?? 0) > 0 ? `${m.x} was marked as gone and is now on top of the ${SIDE[m.from]}: thrown out for real` : `${m.x} leaves the ${SIDE[m.from]}`;
    if (!m.from) return m.into === 'low' ? `${m.x} enters the window and joins the small half (it is not above the small half's top)` : `${m.x} enters the window and joins the large half (it is above the small half's top)`;
    return m.from === 'low' ? `the small half has one too many: its biggest, ${m.x}, crosses to the large half` : `the large half has more: its smallest, ${m.x}, moves to the small half`;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [numsName, kName] = ctx.params;
    const a = ctx.vars[numsName];
    const k = ctx.vars[kName];
    // a window is complete: what is its median? (the first and the third window)
    const out = outOf(ctx, ctx.vars);
    const nout = outOf(ctx, ctx.next.vars);
    if (out && nout && nout.length === out.length + 1 && (out.length === 0 || out.length === 2) && nums(a) && Number.isInteger(k)) {
      const w = out.length;
      const win = a.slice(w, w + k);
      if (win.length !== k) return null;
      const right = nout[w];
      const s = [...win].sort((x, y) => x - y);
      const mean = Math.round((win.reduce((p, x) => p + x, 0) / k) * 100) / 100;
      const wrong = [...new Set([...s, mean])].filter((x) => x !== right);
      return options(
        `Window [${win.join(', ')}] is complete. What is its median?`,
        right,
        wrong.slice(0, 3),
        k % 2 ? `In order ${show(win)}: the middle one is ${right}.` : `In order ${show(win)}: an even window averages its two middle values: ${right}.`,
      );
    }
    // the small (or large) half is about to give a number away: which one?
    const h = halves(ctx, ctx.vars);
    const nm = move(h, halves(ctx, ctx.next.vars));
    if (h && nm && nm.from && nm.into) {
      const src = nm.from === 'low' ? h.low : h.high;
      const opts = [...new Set([nm.x, ...src])].slice(0, 4);
      if (opts.length < 2) return null;
      return options(
        `Small half ${showLive(h.low, delayedOf(ctx, ctx.vars))}, large half ${showLive(h.high, delayedOf(ctx, ctx.vars))}: the halves are out of balance. Which number moves to the ${SIDE[nm.into]}?`,
        nm.x,
        opts.filter((x) => x !== nm.x),
        nm.from === 'low' ? `The small half's top is its biggest number, ${nm.x}: moving it keeps every small number ≤ every large one.` : `The large half's top is its smallest number, ${nm.x}: moving it keeps the halves in order.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Even window: integer average',
      find: '(low.peek() + high.peek()) / 2',
      replace: 'Math.floor((low.peek() + high.peek()) / 2)',
      explain: 'The two middle values 1 and 4 average to 2.5, but the floor turns it into 2: even windows lose their half.',
    },
    {
      label: 'A gone top is never swept',
      find: 'if (x === high.peek()) prune(high);',
      replace: '',
      explain: 'A number that left the window stays on top of the large half, so the next even median (or a move between halves) uses a number that is no longer in the window.',
    },
  ],
};
