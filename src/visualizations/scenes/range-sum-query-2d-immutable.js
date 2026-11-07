// Range Sum Query 2D - Immutable (design class). Every cell of the prefix table is the harvest of the field that
// runs from the top-left corner down to that cell. Building one: this cell + the field above + the field to the
// left − their overlap (counted twice). A query: big field − strip above − strip to the left + the corner cut twice.
// The table is found by shape among this's fields or locals: (m+1)×(n+1) with a zero border, or m×n without one.
import { options, row } from './util.js';

const NAME = /^p$|pre|sum|cum|acc|dp|^s$|table|ps/i; // not grid / matrix: that is the input
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isGrid = (g) => Array.isArray(g) && g.length > 0 && g.every((r) => row(r) && r.every(isNum));

/** the matrix the constructor was given */
function matrixOf(ctx) {
  const g = ctx.ops?.[0]?.args?.[0];
  return isGrid(g) ? g : null;
}
/** { name, g, pad } of the prefix table, pad = 1 with the zero border, 0 without */
function tableOf(vars, mat) {
  const m = mat.length;
  const n = mat[0].length;
  const o = vars?.this?.$obj || {};
  const cands = [...Object.entries(o).map(([k, v]) => [`this.${k}`, v]), ...Object.entries(vars || {}).filter(([k]) => k !== 'this')];
  for (const pad of [1, 0]) {
    const hit = cands.find(([k, v]) => NAME.test(k.replace('this.', '')) && isGrid(v) && v.length === m + pad && v.every((r) => r.length === n + pad));
    if (hit) return { name: hit[0], g: hit[1], pad };
  }
  return null;
}
/** the cell [R, C] (table coordinates) that changed between two tables of the same shape, else null */
function writtenCell(a, b) {
  const hits = [];
  b.forEach((r, i) => r.forEach((x, j) => x !== a[i][j] && hits.push([i, j])));
  return hits.length === 1 ? hits[0] : null;
}
/** the four parts of the build rule for table cell [R, C]: cell, above, left, overlap */
function parts(t, mat, R, C) {
  const at = (i, j) => (i < 0 || j < 0 ? 0 : t.g[i][j]);
  const r = R - t.pad;
  const c = C - t.pad;
  if (r < 0 || c < 0) return null;
  return { r, c, cell: mat[r][c], above: at(R - 1, C), left: at(R, C - 1), overlap: at(R - 1, C - 1) };
}
const isQuery = (ctx) => ctx.op > 0 && /sum|region/i.test(ctx.ops?.[ctx.op]?.name || '');
/** name of the method whose body holds line `at` (1-based): a helper like get(i, j) is not the query itself */
function methodAt(lines, at) {
  for (let i = at - 1; i >= 0; i--) {
    const m = (lines[i] || '').match(/^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m && !/^(if|for|while|switch|catch|function)$/.test(m[1])) return m[1];
  }
  return '';
}

export default {
  id: 'range-sum-query-2d-immutable',
  metaphor: 'Fields measured from the top-left corner',
  caption: 'Each table cell holds the harvest of the field from the top-left corner down to it. A region is the big field minus the strip above and the strip to the left, plus the corner that was cut twice.',
  maxPredicts: 2,
  narrate(ctx) {
    const mat = matrixOf(ctx);
    if (!mat) return null;
    const t = tableOf(ctx.vars, mat);
    if (!t) return null;
    if (isQuery(ctx)) {
      const [r1, c1, r2, c2] = ctx.ops[ctx.op].args || [];
      if (![r1, c1, r2, c2].every(Number.isInteger) || !/return/.test(ctx.src) || !/sum|region/i.test(methodAt(ctx.lines, ctx.line))) return null;
      const p = t.pad;
      const at = (i, j) => (i < 0 || j < 0 ? 0 : t.g[i]?.[j]);
      const big = at(r2 + p, c2 + p);
      const up = at(r1 - 1 + p, c2 + p);
      const lf = at(r2 + p, c1 - 1 + p);
      const cor = at(r1 - 1 + p, c1 - 1 + p);
      if (![big, up, lf, cor].every(isNum)) return null;
      return `rows ${r1}–${r2}, cols ${c1}–${c2}: big field ${big} − above ${up} − left ${lf} + corner ${cor} = ${big - up - lf + cor}`;
    }
    const before = tableOf(ctx.prev, mat);
    if (!before || before.name !== t.name) {
      return t.g.every((r) => r.every((x) => x === 0)) ? `a blank ${t.g.length}×${t.g[0].length} table${t.pad ? ': the extra zero row and column mean "nothing above / nothing to the left"' : ''}` : null;
    }
    const at = writtenCell(before.g, t.g);
    if (!at) return null;
    const q = parts(t, mat, ...at);
    if (!q || t.g[at[0]][at[1]] !== q.cell + q.above + q.left - q.overlap) return null;
    return `field to (${q.r}, ${q.c}): cell ${q.cell} + above ${q.above} + left ${q.left} − overlap ${q.overlap} = ${t.g[at[0]][at[1]]}`;
  },
  // before a table cell with a real overlap is written: what is the field's harvest?
  predict(ctx) {
    if (!ctx.next || isQuery(ctx)) return null;
    const mat = matrixOf(ctx);
    if (!mat) return null;
    const t = tableOf(ctx.vars, mat);
    const u = tableOf(ctx.next.vars, mat);
    if (!t || !u || t.name !== u.name) return null;
    const at = writtenCell(t.g, u.g);
    if (!at) return null;
    const q = parts(t, mat, ...at);
    const right = u.g[at[0]][at[1]];
    if (!q || !q.overlap || right !== q.cell + q.above + q.left - q.overlap) return null;
    return options(
      `Cell (${q.r}, ${q.c}) holds ${q.cell}; the field above totals ${q.above}, the field to the left ${q.left}, their overlap ${q.overlap}. Harvest of the field to (${q.r}, ${q.c})?`,
      right,
      [right + q.overlap, right - q.cell, q.cell + q.above, right + 2 * q.overlap].filter((x) => x !== right),
      `${q.cell} + ${q.above} + ${q.left} counts the overlap ${q.overlap} twice, so subtract it once: ${right}.`,
    );
  },
  bugs: [
    {
      label: 'Forget to add back the corner',
      find: ' + P[row1][col1];',
      replace: ';',
      explain: 'The strip above and the strip to the left both contain the top-left corner, so it is cut twice; without adding it back, any region not touching row 0 or column 0 comes out too small.',
    },
    {
      label: 'Build without subtracting the overlap',
      find: ' - this.P[r][c];',
      replace: ';',
      explain: 'The field above and the field to the left share their overlap; adding both counts it twice, so every corner total past the first row and column is too big.',
    },
  ],
};
