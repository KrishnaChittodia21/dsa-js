// Number of Submatrices That Sum to Target. Pick a band of rows (top..bottom) and squash it into one strip of
// column totals; then it is Subarray Sum Equals K on that strip: walk it with a running total and a ledger of
// totals seen so far; each earlier total equal to running − target closes a rectangle that sums to target.
// Works with common names (total/count/res, cur/sum/run, colSum/sums/strip, seen/map/freq, top/bottom…).
import { entriesOf, firstInt, options, row } from './util.js';

const TOTAL = ['total', 'count', 'res', 'result', 'ans', 'answer', 'cnt'];
const RUN = ['cur', 'curr', 'sum', 'run', 'running', 'prefix', 'pre', 'acc', 's'];
const STRIP = /^(colSum|colSums|col|cols|sums|strip|arr|rowSum|rowSums|band|compressed|squash|acc|column|columns|cs)$/i;
const LEDGER = /seen|map|freq|count|cnt|mp|ledger|prefix|pre|hm|table/i;
const TOP = ['top', 'r1', 'up', 'startRow', 'i', 'row1'];
const BOTTOM = ['bottom', 'r2', 'down', 'endRow', 'j', 'row2'];
const COL = ['c', 'col', 'k', 'j', 'x'];
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const numName = (vars, names) => names.find((k) => fin(vars[k]));

const stripOf = (vars) => Object.entries(vars).find(([k, v]) => STRIP.test(k) && row(v) && v.every(fin));
const ledgerOf = (vars) => Object.entries(vars).find(([k, v]) => LEDGER.test(k) && entriesOf(v));
const countIn = (led, key) => (led ? entriesOf(led[1]).find(([k]) => Number(k) === key)?.[1] ?? 0 : 0);
function band(vars) {
  const [tName, t] = firstInt(vars, TOP);
  const [, b] = firstInt(vars, BOTTOM.filter((k) => k !== tName));
  return fin(t) && fin(b) && b >= t ? (t === b ? `row ${t}` : `rows ${t}–${b}`) : null;
}
const rects = (k) => `${k} rectangle${k === 1 ? '' : 's'}`;

export default {
  id: 'number-of-submatrices-that-sum-to-target',
  metaphor: 'Squash a band of rows, then count',
  caption: 'For every band of rows, the rows are squashed into one strip of column totals. Walking the strip with a running total and a ledger of earlier totals, each earlier total equal to running − target closes a rectangle.',
  compare: 'total',
  narrate(ctx) {
    const target = ctx.vars[ctx.params[1]];
    if (!fin(target)) return null;
    const total = numName(ctx.vars, TOTAL);
    const run = numName(ctx.vars, RUN);
    const led = ledgerOf(ctx.vars);
    const strip = stripOf(ctx.vars);
    const [cName, c] = firstInt(ctx.vars, COL.filter((k) => !ctx.params.includes(k)));
    // a fresh ledger: the band is fully squashed
    if (led && strip && (!ledgerOf(ctx.prev) || entriesOf(ledgerOf(ctx.prev)[1]).length > entriesOf(led[1]).length)) {
      const b = band(ctx.vars);
      return `${b ? `${b} squashed` : 'band squashed'} into column totals [${strip[1].join(', ')}]; a fresh ledger: ${entriesOf(led[1]).map(([k, v]) => `${k}×${v}`).join(', ') || 'empty'}`;
    }
    const [tName, t] = firstInt(ctx.vars, TOP);
    const newTop = tName && fin(ctx.prev[tName]) && ctx.prev[tName] !== t;
    if (newTop && strip && strip[1].every((x) => x === 0)) return `a new top row ${t}: the column totals start again at 0`;
    if (strip && !newTop && row(ctx.prev[strip[0]])) {
      const d = strip[1].map((x, i) => (x === ctx.prev[strip[0]][i] ? -1 : i)).filter((i) => i >= 0);
      const [, b] = firstInt(ctx.vars, BOTTOM);
      if (d.length === 1 && strip[1].length === ctx.prev[strip[0]].length) return `squash${fin(b) ? ` row ${b}` : ''} into column ${d[0]}: ${ctx.prev[strip[0]][d[0]]} → ${strip[1][d[0]]}`;
    }
    if (run && fin(ctx.prev[run]) && (ctx.vars[run] !== ctx.prev[run] || new RegExp(`\\b${run}\\s*\\+?=`).test(ctx.src))) {
      return `${cName ? `column ${c}: ` : ''}running total ${ctx.vars[run]}; look in the ledger for ${ctx.vars[run]} − ${target} = ${ctx.vars[run] - target}`;
    }
    if (total && run && fin(ctx.prev[total])) {
      const k = ctx.vars[total] - ctx.prev[total];
      const want = ctx.vars[run] - target;
      if (k > 0) return `the ledger holds ${want} ${k === 1 ? 'once' : `${k} times`}: ${rects(k)} summing to ${target} ${k === 1 ? 'ends' : 'end'} here (total ${ctx.vars[total]})`;
      if (new RegExp(`\\b${total}\\s*\\+?=`).test(ctx.src)) return `no earlier total of ${want}: no rectangle ends here`;
    }
    if (led && run && ledgerOf(ctx.prev)?.[0] === led[0] && countIn(led, ctx.vars[run]) !== countIn(ledgerOf(ctx.prev), ctx.vars[run])) {
      return `write running total ${ctx.vars[run]} in the ledger (seen ${countIn(led, ctx.vars[run])}×)`;
    }
    return null;
  },
  // right after the running total moved: how many rectangles end here?
  predict(ctx) {
    if (!ctx.next) return null;
    const target = ctx.vars[ctx.params[1]];
    const total = numName(ctx.vars, TOTAL);
    const run = numName(ctx.vars, RUN);
    const led = ledgerOf(ctx.vars);
    if (!fin(target) || !total || !run || !led || !fin(ctx.prev[run])) return null;
    const nx = ctx.next.vars;
    if (!fin(nx[total]) || nx[run] !== ctx.vars[run]) return null;
    const k = nx[total] - ctx.vars[total];
    if (k < 0) return null;
    // a "no" answer is only certain when the next step is the count line itself
    // "none" is asked only against a ledger with a few totals in it, so the answer is not always 0
    if (k === 0 && entriesOf(led[1]).length < 2) return null;
    if (k === 0 && !new RegExp(`\\b${total}\\b`).test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const want = ctx.vars[run] - target;
    const seen = entriesOf(led[1]).map(([x, v]) => `${x}×${v}`).join(', ');
    return options(
      `Running total ${ctx.vars[run]}, target ${target}; the ledger holds ${seen}. How many rectangles end here?`,
      k,
      [0, 1, 2, 3, k + 1].filter((x) => x !== k),
      k ? `${ctx.vars[run]} − ${target} = ${want} was seen ${k}×: each of those earlier totals starts a rectangle that sums to ${target}.` : `${want} (= ${ctx.vars[run]} − ${target}) is not in the ledger, so no rectangle ending here sums to ${target}.`,
    );
  },
  bugs: [
    {
      label: 'Forget the {0: 1} seed',
      find: 'new Map([[0, 1]])',
      replace: 'new Map()',
      explain: 'Without "total 0 seen once", a rectangle that starts at column 0 has no earlier total to match, so e.g. [[1, 2, 3]] with target 3 counts 1 instead of 2.',
    },
    {
      label: 'Column totals never reset for a new top row',
      find: 'for (let top = 0; top < m; top++) {\n    const colSum = new Array(n).fill(0);',
      replace: 'const colSum = new Array(n).fill(0);\n  for (let top = 0; top < m; top++) {',
      explain: 'The strip keeps the rows of the previous band, so "rows 1–2" is really rows 0–2 again plus row 1 twice: the bands are wrong and so is the count.',
    },
  ],
};
