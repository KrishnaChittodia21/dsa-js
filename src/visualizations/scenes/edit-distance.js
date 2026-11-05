// Edit Distance: cell (i, j) = fewest edits turning the first i letters of word1 into the first j letters of word2.
// Works with a full 2-D table or a single rolling row (the row number then comes from i / r / row).
import { changedIdx, firstInt, options, row } from './util.js';

const DP = ['dp', 'memo', 'table', 'prev', 'cur', 'curr', 'row'];
const ROW = ['i', 'r', 'row'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));

/** { i, j, v, old } for the one cell that changed between two snapshots, else null */
function changedCell(vars, prev) {
  for (const k of DP) {
    const a = vars[k];
    const b = prev[k];
    if (isGrid(a) && isGrid(b) && a.length === b.length) {
      const hits = [];
      a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push({ i, j, v: r[j], old: b[i][j] })));
      if (hits.length === 1) return hits[0];
    } else if (row(a) && row(b) && a.length === b.length) {
      const d = changedIdx(a, b);
      const [, i] = firstInt(vars, ROW);
      if (d.length === 1) return { i, j: d[0], v: a[d[0]], old: b[d[0]] };
    }
  }
  return null;
}

const q = (s) => `'${s}'`;

export default {
  id: 'edit-distance',
  metaphor: 'A grid of word-fixing costs',
  caption: 'Row i is the first i letters of word1, column j the first j letters of word2; a cell is the fewest edits between them. Matching letters copy the diagonal for free; otherwise 1 + the cheapest of replace ↖, delete ↑, insert ←.',
  pointers: ['j', 'col', 'c'],
  narrate(ctx) {
    const [w1n, w2n] = ctx.params;
    const w1 = ctx.vars[w1n];
    const w2 = ctx.vars[w2n];
    if (typeof w1 !== 'string' || typeof w2 !== 'string') return null;
    const c = changedCell(ctx.vars, ctx.prev);
    if (!c || !Number.isInteger(c.v)) return null;
    const { i, j, v } = c;
    if (!Number.isInteger(i) || i === 0) return j >= 1 && j <= w2.length && v === j ? `'' → ${q(w2.slice(0, j))}: ${j} insert${j === 1 ? '' : 's'}` : null;
    if (i > w1.length || j > w2.length) return null;
    if (j === 0) return `${q(w1.slice(0, i))} → '': ${i} delete${i === 1 ? '' : 's'}`;
    const [a, b] = [w1[i - 1], w2[j - 1]];
    const pair = `${q(w1.slice(0, i))} → ${q(w2.slice(0, j))}`;
    return a === b ? `${pair}: last letters match ('${a}'), no edit: copy the diagonal → ${v}` : `${pair}: '${a}' ≠ '${b}', 1 + the cheapest neighbour → ${v}`;
  },
  // before a cell is filled: how many edits?
  predict(ctx) {
    if (!ctx.next) return null;
    const [w1n, w2n] = ctx.params;
    const w1 = ctx.vars[w1n];
    const w2 = ctx.vars[w2n];
    const c = changedCell(ctx.next.vars, ctx.vars);
    if (typeof w1 !== 'string' || typeof w2 !== 'string' || !c || !Number.isInteger(c.v)) return null;
    const { i, j, v } = c;
    if (!(i >= 1 && i <= w1.length && j >= 1 && j <= w2.length)) return null;
    const [a, b] = [w1[i - 1], w2[j - 1]];
    const why = a === b ? `'${a}' = '${b}': the last letters already match, so the cost is the diagonal cell with no extra edit.` : `'${a}' ≠ '${b}': one edit (replace, delete or insert) on top of the cheapest of the three neighbours.`;
    return options(`How many edits turn ${q(w1.slice(0, i))} into ${q(w2.slice(0, j))}?`, v, [v + 1, Math.max(0, v - 1), v + 2].filter((w) => w !== v), why);
  },
  bugs: [
    {
      label: 'Pay an edit even when the letters match',
      find: 'dp[j] = diag;',
      replace: 'dp[j] = diag + 1;',
      explain: 'Matching last letters need no edit, but this charges one anyway, so every shared letter adds a phantom edit.',
    },
    {
      label: 'Forget the first column (i deletes)',
      find: 'dp[0] = i;',
      replace: '',
      explain: 'Turning the first i letters into an empty word takes i deletes; left at 0, the grid thinks dropping letters is free.',
    },
  ],
};
