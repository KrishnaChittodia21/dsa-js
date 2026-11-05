// Maximal Rectangle. Each row of the grid is the ground of a skyline: a column's tower is the run of 1s ending in
// that row ('0' knocks it down). Each skyline is then solved as "largest rectangle in a histogram" with a stack of
// rising towers. Finds the towers row (integers, one per column) and the stack by shape, whatever their names.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'idx', 'k', 'cur', 'pos'];
const BEST = ['best', 'maxArea', 'max', 'ans', 'res', 'result', 'maxA', 'largest', 'area'];
const stackOf = (vars, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /stack|^st$|^stk$|^s$|mono/i.test(k) && row(v));
const list = (st, hOf) => (st.length ? st.map(hOf).join(', ') : 'empty');

function colsOf(ctx) {
  const m = ctx.vars[ctx.params[0]];
  return Array.isArray(m) && Array.isArray(m[0]) ? m[0].length : undefined;
}
// the towers: a row of integers, one per column, that is neither a parameter nor the stack
function towersOf(vars, ctx, cols) {
  if (!cols) return null;
  const s = stackOf(vars, ctx.params)?.[0];
  return Object.entries(vars).find(([k, v]) => k !== s && !ctx.params.includes(k) && row(v) && v.length === cols && v.every(Number.isInteger)) || null;
}
// the grid row being added: '0'/'1' cells, one per column
function gridRowOf(vars, ctx, cols) {
  const m = vars[ctx.params[0]];
  const own = Object.values(vars).find((v) => v !== m && row(v) && v.length === cols && v.every((x) => x === '0' || x === '1'));
  if (own) return own;
  const [, r] = firstInt(vars, ['r', 'row', 'rowIdx', 'ri', 'y']); // matrix[r][c] read in place
  return Array.isArray(m) && r >= 0 && r < m.length ? row(m[r]) : null;
}

function hist(ctx) {
  const cols = colsOf(ctx);
  const t = towersOf(ctx.vars, ctx, cols);
  if (!t) return null;
  const a = t[1];
  const n = a.length;
  const st = stackOf(ctx.vars, ctx.params);
  if (!st || !st[1].every((x) => Number.isInteger(x) && x >= 0 && x <= n)) return null;
  const [iName, i] = firstInt(ctx.vars, AT);
  const hOf = (k) => (k < n ? a[k] : 0);
  return { a, n, sName: st[0], st: st[1], iName, i: Number.isInteger(i) && i >= 0 && i <= n ? i : undefined, hOf };
}

export default {
  id: 'maximal-rectangle',
  metaphor: 'A skyline rising row by row',
  caption: "Each row is the ground of a skyline: a column's tower counts the 1s stacked straight above it, and a '0' knocks it down. Every skyline is then measured like a histogram, with a stack of rising towers.",
  narrate(ctx) {
    const cols = colsOf(ctx);
    const t = towersOf(ctx.vars, ctx, cols);
    const before = t && row(ctx.prev[t[0]]);
    if (t && before && before.length === cols) {
      const d = t[1].map((x, k) => (x === before[k] ? -1 : k)).filter((k) => k >= 0);
      if (d.length === 1) {
        const c = d[0];
        const h = t[1][c];
        return h === 0 ? `column ${c} hits a '0': its tower falls from ${before[c]} to 0` : `column ${c} has a '1': its tower grows to ${h}`;
      }
    }
    const s = hist(ctx);
    if (s) {
      const { st, n, i, hOf } = s;
      const was = row(ctx.prev[s.sName]);
      if (!was) return `measure this skyline: towers ${s.a.join(', ')}`;
      if (was.length === st.length + 1 && st.every((x, k) => x === was[k])) {
        const k = was[was.length - 1];
        const left = st.length ? st[st.length - 1] : -1;
        const r = i === undefined ? n : i;
        if (r <= k) return `tower ${k} (height ${hOf(k)}) leaves the stack`;
        const w = r - left - 1;
        const by = r === n ? 'the end of the row' : `tower ${r} (${hOf(r)}) is ${hOf(r) < hOf(k) ? 'lower' : 'not taller'}`;
        return `${by}: tower ${k} (height ${hOf(k)}) spans ${w > 1 ? `columns ${left + 1}–${r - 1}` : 'only itself'}, ${hOf(k)} × ${w} = ${hOf(k) * w}`;
      }
      if (st.length === was.length + 1 && was.every((x, k) => x === st[k])) {
        const k = st[st.length - 1];
        if (k === n) return 'the sentinel lands on an empty stack: this skyline is fully measured';
        return `tower ${k} (height ${hOf(k)}) joins the stack · heights: ${list(st, hOf)}`;
      }
    }
    const up = BEST.find((k) => Number.isInteger(ctx.vars[k]) && Number.isInteger(ctx.prev[k]) && ctx.vars[k] > ctx.prev[k]);
    if (up) return `a bigger rectangle: ${up} = ${ctx.vars[up]}`;
    return null;
  },
  // a tower about to change (grow or fall), and a tower about to be pushed or measured
  predict(ctx) {
    if (!ctx.next) return null;
    const cols = colsOf(ctx);
    const t = towersOf(ctx.vars, ctx, cols);
    const after = t && row(ctx.next.vars[t[0]]);
    if (t && after && after.length === cols) {
      const d = after.map((x, k) => (x === t[1][k] ? -1 : k)).filter((k) => k >= 0);
      const gr = gridRowOf(ctx.next.vars, ctx, cols);
      if (d.length === 1 && gr) {
        const c = d[0];
        const h = t[1][c];
        if (h >= 1 && (after[c] === 0 || c === t[1].findIndex((x) => x >= 1))) {
          return options(
            `The next row has '${gr[c]}' in column ${c}, whose tower is ${h} tall. How tall is it after this row?`,
            after[c],
            [h + 1, 0, h, 1],
            gr[c] === '1' ? `A '1' sits on top of the tower, so it grows by one: ${h} → ${h + 1}.` : `A '0' breaks the run of 1s: a rectangle cannot stand on it, so the tower falls to 0.`,
          );
        }
      }
    }
    const s = hist(ctx);
    if (!s || !s.st.length) return null;
    const { st, i, n, hOf, iName } = s;
    if (i === undefined || i >= n || ctx.next.vars[iName] !== i) return null;
    const nst = row(ctx.next.vars[s.sName]);
    if (!nst) return null;
    const top = st[st.length - 1];
    const popped = nst.length === st.length - 1 && nst.every((x, k) => x === st[k]);
    const pushed = nst.length === st.length + 1 && nst[nst.length - 1] === i && st.every((x, k) => x === nst[k]);
    // a 0-tall tower on either side is a dull question
    if ((!popped && !pushed) || top === i || (pushed && st.length < 2) || !hOf(top) || !hOf(i)) return null;
    const pop = `Tower ${top} (height ${hOf(top)}) is popped and measured`;
    const push = `Tower ${i} (height ${hOf(i)}) is pushed on top`;
    return options(
      `Skyline ${s.a.join(', ')}: tower ${i} (height ${hOf(i)}) is here; the stack's top is tower ${top} (height ${hOf(top)}). What happens next?`,
      popped ? pop : push,
      [popped ? push : pop],
      popped ? `${hOf(i)} is not taller than ${hOf(top)}, so tower ${top} cannot stretch further right: it is measured now.` : `${hOf(i)} is ${hOf(i) > hOf(top) ? 'taller than' : 'as tall as'} ${hOf(top)}, and this code only pops a taller top, so nothing is blocked yet: tower ${i} joins the stack.`,
    );
  },
  bugs: [
    {
      label: "Compare the cell with the number 1, not the string '1'",
      find: "row[c] === '1'",
      replace: 'row[c] === 1',
      explain: "The cells are strings, so '1' === 1 is never true: every tower stays 0 and the answer is always 0.",
    },
    {
      label: "A '0' does not knock the tower down",
      find: 'heights[c] + 1 : 0',
      replace: 'heights[c] + 1 : heights[c]',
      explain: "The tower keeps its old height over a '0', so 1s above and below a gap count as one tall column and the area comes out too big.",
    },
  ],
};
