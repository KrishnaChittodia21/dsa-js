// Largest Rectangle in Histogram (monotonic stack). Bars wait on a stack of rising heights; a lower bar walking in
// ends every taller bar's rectangle, and each popped bar is measured between its two lower neighbours. Works with a
// stack of indices under a stack-like name, and an index under a common loop name.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'idx', 'k', 'cur', 'pos'];
const BEST = ['best', 'maxArea', 'max', 'ans', 'res', 'result', 'maxA', 'largest', 'area'];
const stackOf = (vars, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /stack|^st$|^stk$|^s$|mono/i.test(k) && row(v));
const isBar = (x, n) => Number.isInteger(x) && x >= 0 && x <= n; // n = the height-0 sentinel past the end
const list = (st, hOf) => (st.length ? st.map(hOf).join(', ') : 'empty');

function setup(ctx) {
  const name = ctx.params[0];
  const a = row(ctx.vars[name]);
  if (!a) return null;
  const n = a.length;
  const st = stackOf(ctx.vars, ctx.params);
  if (!st || !st[1].every((x) => isBar(x, n))) return null;
  const [iName, i] = firstInt(ctx.vars, AT);
  const hOf = (k) => (k < n ? a[k] : 0);
  return { a, n, sName: st[0], st: st[1], iName, i: isBar(i, n) ? i : undefined, hOf };
}

export default {
  id: 'largest-rectangle-in-histogram',
  metaphor: 'Bars waiting to learn their width',
  caption: 'The stack holds bars whose heights only rise towards the top: none of them has met a lower bar on its right yet. A lower bar ends their rectangles; each popped bar spans from the bar below it on the stack to the bar that popped it.',
  narrate(ctx) {
    const s = setup(ctx);
    if (!s) return null;
    const { st, n, i, hOf } = s;
    const was = row(ctx.prev[s.sName]);
    if (was && was.length === st.length + 1 && st.every((x, k) => x === was[k])) {
      const k = was[was.length - 1];
      const left = st.length ? st[st.length - 1] : -1;
      // no index any more: a flush after the loop, the bar reaches the right end
      const r = i === undefined ? n : i;
      if (r <= k) return `bar ${k} (height ${hOf(k)}) leaves the stack`;
      const w = r - left - 1;
      const by = r === n ? 'the end of the histogram' : `bar ${r} (${hOf(r)}) is ${hOf(r) < hOf(k) ? 'lower' : 'not taller'}`;
      return `${by}: bar ${k} (height ${hOf(k)}) spans ${w > 1 ? `bars ${left + 1}–${r - 1}` : `only itself`}, ${hOf(k)} × ${w} = ${hOf(k) * w}`;
    }
    if (was && st.length === was.length + 1 && was.every((x, k) => x === st[k])) {
      const k = st[st.length - 1];
      if (k === n) return 'the sentinel lands on an empty stack: every bar has been measured';
      return `bar ${k} (height ${hOf(k)}) joins the stack: no lower bar on its right yet · heights: ${list(st, hOf)}`;
    }
    const [bName, best] = firstInt(ctx.vars, BEST);
    if (bName && Number.isInteger(ctx.prev[bName]) && best > ctx.prev[bName] && !ctx.params.includes(bName)) return `new largest rectangle: ${best}`;
    if (bName && best === ctx.prev[bName] && new RegExp(`\\b${bName}\\s*=`).test(ctx.src)) return `no bigger than the best so far (${best})`;
    if (i !== undefined && i !== ctx.prev[s.iName] && st.length) {
      const t = st[st.length - 1];
      if (i === n) return `past the last bar: a height-0 sentinel arrives to measure the ${st.length} bar${st.length > 1 ? 's' : ''} still waiting`;
      return `bar ${i} (height ${hOf(i)}) arrives; the top of the stack is bar ${t} (height ${hOf(t)})`;
    }
    return null;
  },
  // a real bar is here and the stack is about to change: does the top bar get measured, or does the new bar join?
  predict(ctx) {
    const s = setup(ctx);
    if (!s || !ctx.next || !s.st.length) return null;
    const { st, i, n, hOf, iName } = s;
    if (i === undefined || i >= n || ctx.next.vars[iName] !== i) return null;
    const after = row(ctx.next.vars[s.sName]);
    if (!after) return null;
    const top = st[st.length - 1];
    const popped = after.length === st.length - 1 && after.every((x, k) => x === st[k]);
    const pushed = after.length === st.length + 1 && after[after.length - 1] === i && st.every((x, k) => x === after[k]);
    if ((!popped && !pushed) || top === i || (pushed && st.length < 2)) return null;
    const pop = `Bar ${top} (height ${hOf(top)}) is popped and measured`;
    const push = `Bar ${i} (height ${hOf(i)}) is pushed on top`;
    return options(
      `Bar ${i} (height ${hOf(i)}) is here; the stack's top is bar ${top} (height ${hOf(top)}). What happens next?`,
      popped ? pop : push,
      [popped ? push : pop],
      popped
        ? `${hOf(i)} is not taller than ${hOf(top)}, so bar ${top} cannot stretch past bar ${i}: its rectangle is complete and is measured now.`
        : `${hOf(i)} is ${hOf(i) > hOf(top) ? 'taller than' : 'as tall as'} ${hOf(top)}, and this code only pops a taller top, so no waiting bar is blocked yet: bar ${i} joins the stack.`,
    );
  },
  bugs: [
    {
      label: 'No sentinel: the last rising run is never measured',
      find: 'i <= n',
      replace: 'i < n',
      explain: 'Bars still on the stack at the end never meet a lower bar, so they are never measured: [1,2,3,4,5] misses 3 × 3 = 9.',
    },
    {
      label: 'Empty stack means left edge 0 instead of -1',
      find: 'st[st.length - 1] : -1',
      replace: 'st[st.length - 1] : 0',
      explain: 'When nothing lower is left on the stack, the bar reaches the very first bar; using 0 as the edge cuts one bar off: [2,1,2] gives 2 instead of 3.',
    },
  ],
};
