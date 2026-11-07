// Number of Islands II (union-find). Land rises from the sea one cell at a time: each new cell is a new island,
// then it merges with every touching island it is not already part of. Reads the land marks (a flat land / grid
// row, a 2-D grid, a Set of cell keys, or -1 "water" slots in the parent row), the cell (r / c), the neighbour
// (nr / nc) and the island counter; anything else falls back to the generic notes.
import { cellAt, firstInt, row, parentOf } from './util.js';

const COUNT = ['islands', 'count', 'cnt', 'numIslands', 'num', 'total', 'components', 'comps', 'k', 'cur'];
const LAND = /^(land|lands|isLand|grid|g|board|map|mat|sea|filled|on|seen|visited|added)$/i;

/** is cell (r, c) land? true / false, or undefined when the code keeps it somewhere this scene cannot read */
function isLand(ctx, r, c, n) {
  for (const [k, v] of Object.entries(ctx.vars)) {
    if (!LAND.test(k) || ctx.params.includes(k)) continue;
    if (v && v.$set) return v.$set.some((x) => x === r * n + c || x === `${r},${c}` || x === `${r}_${c}` || x === `${r} ${c}` || x === `${r}:${c}`);
    if (Array.isArray(v) && v.length && v.every((x) => row(x))) return !!v[r]?.[c] && v[r][c] !== '0';
    const cell = cellAt(v, r * n + c);
    if (cell !== undefined && typeof cell !== 'object') return !!cell && cell !== -1;
  }
  const p = parentOf(ctx.vars, [], true);
  if (p && p.some((x) => x === -1)) return p[r * n + c] !== -1;
  return undefined;
}
const countOf = (ctx, vars) => firstInt(vars, COUNT.filter((k) => !ctx.params.includes(k)));
const resultOf = (ctx, vars) => Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && /^(answer|ans|res|result|out|output|counts)$/i.test(k) && row(v));
/** [r, c, nr, nc] under the first matching names (the cell placed and the neighbour being checked) */
function cellsOf(vars) {
  const two = (pairs) => pairs.map(([a, b]) => [vars[a], vars[b]]).find(([a, b]) => Number.isInteger(a) && Number.isInteger(b)) || [undefined, undefined];
  return [...two([['r', 'c'], ['row', 'col'], ['i', 'j'], ['x', 'y']]), ...two([['nr', 'nc'], ['ni', 'nj'], ['nx', 'ny'], ['rr', 'cc'], ['r2', 'c2']])];
}
const s = (k) => (k === 1 ? '' : 's');

export default {
  id: 'number-of-islands-ii',
  metaphor: 'Islands rising from the sea',
  caption: 'Each operation raises one cell out of the sea. A lone new cell is a new island; when it touches land of other islands they fuse into one. The answer records the island count after every cell.',
  narrate(ctx) {
    const [, nName, posName] = ctx.params;
    const n = ctx.vars[nName];
    const [r, c, nr, nc] = cellsOf(ctx.vars);
    const [pr, pc] = cellsOf(ctx.prev);
    if (ctx.ret && !ctx.next && row(ctx.value)) return `all ${ctx.value.length} cells placed: the island count after each one is [${ctx.value.join(', ')}]`;
    const res = resultOf(ctx, ctx.vars);
    const pres = res && resultOf(ctx, ctx.prev);
    if (res && pres && pres[0] === res[0] && res[1].length === pres[1].length + 1) {
      const k = res[1].at(-1);
      const at = ctx.input?.[2]?.[res[1].length - 1];
      return `after cell ${at ? `(${at[0]}, ${at[1]})` : res[1].length} rises: ${k} island${s(k)} in the sea (${res[1].length} of ${ctx.input?.[2]?.length ?? '?'} cells placed)`;
    }
    const [cName, k] = countOf(ctx, ctx.vars);
    const kp = cName && ctx.prev[cName];
    if (cName && Number.isInteger(kp) && k === kp + 1 && Number.isInteger(r) && Number.isInteger(c)) return `cell (${r}, ${c}) rises from the sea: on its own it is a new island (${k} island${s(k)})`;
    if (cName && Number.isInteger(kp) && k === kp - 1) {
      const nb = Number.isInteger(nr) && Number.isInteger(nc) ? ` with the island at (${nr}, ${nc})` : '';
      return `the new cell touches land of another island: they fuse${nb} (${k} island${s(k)})`;
    }
    if (Number.isInteger(r) && Number.isInteger(c) && Number.isInteger(n) && pr !== undefined && (r !== pr || c !== pc) && posName in ctx.vars) {
      const land = isLand(ctx, r, c, n);
      if (land === true && cName && k === kp) return `cell (${r}, ${c}) is already land: raising it again changes nothing`;
    }
    return null;
  },
  // the neighbour on screen is about to be checked: does the new cell fuse with it?
  predict(ctx) {
    if (!ctx.next) return null;
    const n = ctx.vars[ctx.params[1]];
    const m = ctx.vars[ctx.params[0]];
    const [r, c, nr, nc] = cellsOf(ctx.vars);
    if (![n, m, r, c, nr, nc].every(Number.isInteger) || nr < 0 || nc < 0 || nr >= m || nc >= n) return null;
    if (Math.abs(nr - r) + Math.abs(nc - c) !== 1) return null;
    const nx = ctx.next.vars;
    const [cName, k] = countOf(ctx, ctx.vars);
    if (!cName || !Number.isInteger(nx[cName])) return null;
    if (ctx.prev[cName] === k + 1) return null; // this step is the fusion with this neighbour: already decided
    const fused = nx[cName] === k - 1;
    const [xr, xc] = cellsOf(nx);
    if (xr !== r || xc !== c) return null; // the next step is in a helper (find): the outcome is not on screen yet
    const p = parentOf(ctx.vars, [], true);
    const pp = parentOf(ctx.prev, [], true);
    if (p && pp && p.join() !== pp.join()) return null; // a union is under way: not a clean moment to ask
    const decided = fused || cellsOf(nx).join() !== [r, c, nr, nc].join();
    if (!decided || nx[cName] !== k && !fused) return null;
    if (isLand(ctx, nr, nc, n) !== true) return null; // ask only about land neighbours: water is never a question
    const res = resultOf(ctx, ctx.vars);
    if (fused && res && Number.isInteger(res[1].at(-1) ?? 0) && k !== (res[1].at(-1) ?? 0) + 1) return null; // a cell's first fusion, then only the "already one island" cases
    return {
      question: `New land at (${r}, ${c}); its neighbour (${nr}, ${nc}) is land. Do they fuse, dropping the island count from ${k}?`,
      options: ['Yes: two islands become one', 'No: they are already one island'],
      answer: fused ? 0 : 1,
      explain: fused ? `(${nr}, ${nc}) belonged to a different island than the new cell, so the union succeeds and the count drops by one.` : `(${nr}, ${nc}) is already in the new cell's island (joined through another neighbour), so the union fails and the count stays.`,
    };
  },
  bugs: [
    {
      label: 'Decrement once per land neighbour',
      find: 'if (land[nb] && uf.union(id, nb)) islands--;',
      replace: 'if (land[nb]) { uf.union(id, nb); islands--; }',
      explain: 'Two neighbours can already be one island: the second union does nothing, yet the count still drops, so it undercounts.',
    },
    {
      label: 'Count a repeated cell again',
      find: 'if (!land[id]) {',
      replace: 'if (true) {',
      explain: 'Raising a cell that is already land adds a "new island" that then fuses with nothing new, so the count goes up by one.',
    },
  ],
};
