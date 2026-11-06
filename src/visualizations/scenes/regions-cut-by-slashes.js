// Regions Cut by Slashes (union-find on triangles). Each square is cut by its diagonals into 4 triangles (top,
// right, bottom, left); a stroke keeps two halves apart, an open square lets all four touch, and touching
// triangles of neighbouring squares always join. The pieces left at the end are the regions.
// Reads a union-find parent row (a toolkit UnionFind object, or parent / par / fa…) and the cell (r / c…); a
// "blow the grid up 3×3 and flood fill" version gets the cell notes and generic steps.
import { firstInt, groupsOf, row, parentOf } from './util.js';

const R = ['r', 'row', 'i'];
const C = ['c', 'col', 'j'];
/** a line that calls union (not a helper's definition) */
const unionCall = (text) => /\b(union|unite|merge|join)\s*\(/i.test(text || '') && !/=>|\bfunction\b/.test(text);

/** the union-find parent row, plain or inside a class instance */
const pieces = (p) => groupsOf(p).length;
const plural = (k) => `${k} piece${k === 1 ? '' : 's'}`;
/** the cell [r, c, char] when a variable holds that cell's character */
function cellOf(vars, grid) {
  const [rName, r] = firstInt(vars, R);
  const [cName, c] = firstInt(vars, C);
  if (!rName || !cName || !Array.isArray(grid) || typeof grid[r] !== 'string' || c >= grid[r].length) return null;
  const ch = grid[r][c];
  return Object.values(vars).some((v) => v === ch) ? [r, c, ch, rName, cName] : null;
}
const STROKE = {
  '/': "a '/' stroke runs bottom-left to top-right: the top-left half and the bottom-right half are cut apart",
  '\\': "a '\\' stroke runs top-left to bottom-right: the top-right half and the bottom-left half are cut apart",
  ' ': 'no stroke: the whole square is open, its four triangles all touch',
};
/** is this union line the one that joins a triangle with the neighbouring square's? */
const crossLine = (text, cell) => !!cell && new RegExp(`\\b(${cell[3]}|${cell[4]})\\s*\\+\\s*1\\b`).test(text || '');

export default {
  id: 'regions-cut-by-slashes',
  metaphor: 'Squares cut into four triangles',
  caption: 'Every square is four triangles: top, right, bottom, left. Triangles joined into one tree of the forest are one piece of open space; a stroke keeps two halves apart. The pieces left at the end are the regions.',
  narrate(ctx) {
    const grid = ctx.vars[ctx.params[0]];
    if (ctx.ret && Number.isInteger(ctx.value)) return `${ctx.value} region${ctx.value === 1 ? '' : 's'}: every piece of open space left is one region`;
    const p = parentOf(ctx.vars, ctx.params);
    const pp = parentOf(ctx.prev, ctx.params);
    const cell = cellOf(ctx.vars, grid);
    const was = cellOf(ctx.prev, ctx.prev[ctx.params[0]]);
    if (p && (!pp || pp.length !== p.length)) return pieces(p) === p.length && p.length % 4 === 0 ? `${p.length / 4} squares, each cut into 4 triangles: ${plural(p.length)} to start` : null;
    // on the line that reads the square's character (grid[r][c]): steps back from a helper call have other names
    const reads = cell && new RegExp(`\\[\\s*${cell[3]}\\s*\\]\\s*\\[\\s*${cell[4]}\\s*\\]`).test(ctx.src);
    if (reads && (!was || was[0] !== cell[0] || was[1] !== cell[1])) return `square (${cell[0]}, ${cell[1]}): ${STROKE[cell[2]] || `it holds "${cell[2]}"`}`;
    if (!p || !pp || pp.length !== p.length) return null;
    const now = pieces(p);
    const cross = crossLine(ctx.src, cell);
    if (now < pieces(pp)) return cross ? `the triangles touching across the border of square (${cell[0]}, ${cell[1]}) join (${plural(now)})` : `two triangles${cell ? ` of square (${cell[0]}, ${cell[1]})` : ''} join (${plural(now)})`;
    if (!unionCall(ctx.src) || !was || was[0] !== cell?.[0] || was[1] !== cell?.[1]) return null; // back from a helper: the join happened inside it
    return `these two triangles are already one piece (joined the long way round): nothing changes, ${plural(now)}`;
  },
  // before a join: does the number of pieces drop?
  predict(ctx) {
    if (!ctx.next) return null;
    const grid = ctx.vars[ctx.params[0]];
    const p = parentOf(ctx.vars, ctx.params);
    const np = parentOf(ctx.next.vars, ctx.params);
    const text = ctx.lines?.[ctx.next.line - 1] || '';
    // the next step is the union call itself, and this step is not inside a helper (or a union of its own)
    if (!p || !np || np.length !== p.length || !unionCall(text) || /=>|\bfunction\b|\breturn\b/.test(ctx.src)) return null;
    const cell = cellOf(ctx.next.vars, grid);
    if (!cell) return null;
    const drops = pieces(np) < pieces(p);
    const cross = crossLine(text, cell);
    // ask about the first square's joins across its border and about every join that changes nothing
    if (drops && !(cross && cell[0] === 0 && cell[1] === 0 && !crossLine(ctx.src, cellOf(ctx.vars, grid)))) return null;
    if (!drops && pieces(np) !== pieces(p)) return null;
    return {
      question: `Next, the code joins two triangles ${cross ? `across a border of square (${cell[0]}, ${cell[1]})` : `of square (${cell[0]}, ${cell[1]})`}. Are they in different pieces so far?`,
      options: ['Yes: two pieces merge, one fewer', 'No: already one piece, nothing changes'],
      answer: drops ? 0 : 1,
      explain: drops ? 'Nothing linked these two triangles yet, so joining them merges two pieces.' : 'Open space already connects them the long way round (through other squares): they are one piece, so the count stays.',
    };
  },
  bugs: [
    {
      label: "Swap the halves of '/' and '\\'",
      find: "ch === '/'",
      replace: "ch === '\\\\'",
      explain: "A '/' square now joins top with right (the halves of a '\\'), and the other way round: strokes cut the wrong halves, so the region count is wrong.",
    },
    {
      label: 'Forget the joins to the square below',
      find: 'if (r + 1 < n) uf.union(id(r, c, 2), id(r + 1, c, 0));',
      replace: '',
      explain: 'Without the cross-border join, a square never connects to the one below it: open space split only by the grid lines counts as separate regions.',
    },
  ],
};
