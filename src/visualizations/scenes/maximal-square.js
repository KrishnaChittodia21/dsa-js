// Maximal Square: a cell's number is the side of the biggest all-'1' square whose bottom-right corner is that tile:
// 1 + the smallest of top, left and top-left (any one of them caps the square), 0 on a '0' tile. Works with a
// rolling dp row (with or without a 0 sentinel in front), a full table (same size or one bigger) or the matrix
// updated in place.
import { changedIdx, firstInt, options, row } from './util.js';

const ROW = ['r', 'i', 'y'];
const DIAG = ['prevDiag', 'diag', 'topLeft', 'upLeft', 'prev', 'pre', 'tl', 'nw', 'd'];
const BEST = ['best', 'maxSide', 'max', 'side', 'ans', 'res', 'result', 'largest', 'maxLen', 'biggest', 'mx'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const SETUP = /new Array|\.fill\(|Array\.from|\.map\(|\.slice\(|\[\.\.\./;
const int = (v) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : Number.isInteger(v) ? v : undefined);
const sq = (s) => `${s}×${s}`;

/** the row of the matrix being swept when there is no row index: a learner's `for (const row of matrix)` */
function sweptRow(vars, params, n) {
  for (const [k, v] of Object.entries(vars)) {
    if (!params.includes(k) && row(v) && v.length === n && v.every((x) => x === '0' || x === '1')) return v;
  }
  return null;
}

/** the one square size written between two snapshots: { r?, c, v, top, left, diag, tile } in matrix coordinates */
function changedCell(vars, prev, params, input) {
  const m = input.length;
  const n = input[0]?.length || 0;
  for (const k of Object.keys(vars)) {
    if (params.includes(k) && k !== params[0]) continue;
    const a = vars[k];
    const b = prev[k];
    if (isGrid(a) && isGrid(b) && a.length === b.length) {
      const hits = [];
      a.forEach((rw, i) => changedIdx(rw, b[i]).forEach((j) => hits.push([i, j])));
      if (hits.length !== 1) continue;
      const off = a.length === m + 1 && a[0].length === n + 1 ? 1 : a.length === m && a[0].length === n ? 0 : -1;
      const [i, j] = hits[0];
      const v = int(a[i][j]);
      if (off < 0 || i - off < 0 || j - off < 0 || v === undefined) continue;
      const at = (y, x) => (y < 0 || x < 0 ? 0 : int(a[y][x]));
      return { r: i - off, c: j - off, v, top: at(i - 1, j), left: at(i, j - 1), diag: at(i - 1, j - 1) };
    }
    if (k !== params[0] && row(a) && row(b) && a.length === b.length && (a.length === n || a.length === n + 1)) {
      const d = changedIdx(a, b);
      if (d.length !== 1 || !Number.isInteger(a[d[0]])) continue;
      const off = a.length - n;
      const c = d[0] - off;
      if (c < 0) continue;
      const [, r] = firstInt(vars, ROW);
      const [, diag] = firstInt(vars, DIAG);
      // the old value at this index is the square above; the one to its left is already this row's
      return { r: Number.isInteger(r) && r >= 0 && r < m ? r : undefined, c, v: a[d[0]], top: b[d[0]], left: c > 0 ? a[d[0] - 1] : 0, diag: c > 0 ? diag : 0, swept: sweptRow(vars, params, n) };
    }
  }
  return null;
}

function readCell(ctx, vars, prev, src) {
  const input = ctx.input?.[0];
  if (!isGrid(input) || SETUP.test(src ?? '')) return null;
  const cell = changedCell(vars, prev, ctx.params, input);
  if (!cell) return null;
  // no row index (for (const row of matrix)): the swept row tells it when its pattern is unique in the matrix
  if (cell.r === undefined && cell.swept) {
    const same = input.map((r, i) => (r.join() === cell.swept.join() ? i : -1)).filter((i) => i >= 0);
    if (same.length === 1) cell.r = same[0];
  }
  const tile = cell.r !== undefined ? input[cell.r]?.[cell.c] : cell.swept?.[cell.c];
  const one = tile === '1' || tile === 1;
  const known = [cell.top, cell.left, cell.diag].every(Number.isInteger);
  const at = cell.r !== undefined ? `(${cell.r}, ${cell.c})` : `column ${cell.c}`;
  return { ...cell, tile, one, known, at };
}

/** [name, value] of the best-so-far counter */
const bestOf = (vars) => firstInt(vars, BEST);

export default {
  id: 'maximal-square',
  metaphor: 'Growing squares of lit tiles',
  caption: 'A number is the side of the biggest all-1 square ending at that tile (its bottom-right corner). It is 1 more than the smallest of top, left and top-left: any one of them caps the square.',
  narrate(ctx) {
    const [bName, best] = bestOf(ctx.vars);
    if (ctx.ret && Number.isInteger(ctx.value)) {
      const s = Math.round(Math.sqrt(ctx.value));
      return s * s === ctx.value ? `the biggest square is ${sq(s)}: its area is ${ctx.value}` : `returns ${ctx.value}`;
    }
    const c = readCell(ctx, ctx.vars, ctx.prev, ctx.src);
    if (c) {
      if (c.tile === undefined) return null;
      if (!c.one) return c.v === 0 ? `${c.at} is a '0' tile: no square can end here → 0` : null;
      if (c.known && c.v === 1 + Math.min(c.top, c.left, c.diag)) {
        return `${c.at} is lit: top ${c.top}, left ${c.left}, top-left ${c.diag}; smallest ${c.v - 1} + 1 = ${c.v} (a ${sq(c.v)} square)`;
      }
      return `${c.at} is lit: a ${sq(c.v)} square ends here`;
    }
    if (bName && Number.isInteger(ctx.prev[bName]) && best > ctx.prev[bName]) return `new biggest square: side ${best} (area ${best * best})`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    // the last step: side or area?
    const [, best] = bestOf(ctx.vars);
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && Number.isInteger(best) && best >= 2) {
      const v = ctx.next.value;
      return options(`The biggest square has side ${best}. What does the function return?`, v, [best, best * best, 2 * best, best + 1].filter((w) => w !== v), `The question asks for the area: side × side = ${best * best}.`);
    }
    // a lit tile whose square is capped by a neighbour: how big?
    const c = readCell(ctx, ctx.next.vars, ctx.vars, ctx.lines[ctx.next.line - 1]);
    if (!c || !c.one || !c.known || c.v !== 1 + Math.min(c.top, c.left, c.diag)) return null;
    // two moments worth a guess: a square grows past 1×1, or a big neighbour is capped by a 0 next to it
    const hi = Math.max(c.top, c.left, c.diag);
    if (!((c.v >= 2 && c.v === hi + 1) || (c.v === 1 && hi >= 2))) return null;
    const why = `Top ${c.top}, left ${c.left}, top-left ${c.diag}: the smallest (${Math.min(c.top, c.left, c.diag)}) caps the square, plus 1 for this tile.`;
    return options(`${c.at} is lit. How big is the biggest square with its corner here?`, c.v, [c.v + 1, Math.max(c.top, c.left, c.diag) + 1, c.v - 1].filter((w) => w >= 1 && w !== c.v), why);
  },
  bugs: [
    {
      label: 'Return the side, not the area',
      find: 'return best * best;',
      replace: 'return best;',
      explain: 'best is the side of the square; a 2×2 square has area 4, so returning the side reports 2.',
    },
    {
      label: 'Take the biggest neighbour, not the smallest',
      find: 'Math.min(top, dp[c] /* left */, prevDiag)',
      replace: 'Math.max(top, dp[c] /* left */, prevDiag)',
      explain: 'A square needs all three neighbours to be at least that big; the largest one lets holes in, so squares grow too big.',
    },
  ],
};
