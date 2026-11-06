// Flood Fill: the paint bucket. Paint spills from the start pixel into every 4-neighbour that still has the old
// colour; the repaint itself marks a pixel as done. Works with the recursive DFS (one call per pixel, stops at
// edges / other colours) and with a BFS queue that paints as it enqueues (r/c, nr/nc, i/j, row/col, x/y).
import { row } from './util.js';

const PAIRS = [
  ['nr', 'nc'],
  ['r', 'c'],
  ['i', 'j'],
  ['row', 'col'],
  ['x', 'y'],
  ['ni', 'nj'],
  ['y', 'x'],
];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0);
const gridOf = (ctx, vars) => (isGrid(vars?.[ctx.params[0]]) ? vars[ctx.params[0]] : null);
const changed = (g, p) => {
  if (!isGrid(p) || p.length !== g.length) return [];
  const out = [];
  g.forEach((r, i) => r.forEach((x, j) => x !== p[i]?.[j] && out.push([i, j])));
  return out;
};
// the cell pair that moved since `prev` (else any pair present)
const cellOf = (vars, prev) => {
  const ok = ([a, b]) => Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b]);
  const moved = PAIRS.find((p) => ok(p) && (vars[p[0]] !== prev?.[p[0]] || vars[p[1]] !== prev?.[p[1]]));
  const p = moved || PAIRS.find(ok);
  return p ? [vars[p[0]], vars[p[1]], !!moved, /^n/.test(p[0])] : null;
};
const oldOf = (ctx) => {
  const [g0, sr, sc] = ctx.input || [];
  return isGrid(g0) ? g0[sr]?.[sc] : undefined;
};
const inside = (g, r, c) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;

/** why a fill stops at (r, c), from the grid as it is now */
function stopWhy(g, r, c, old, color, g0) {
  if (!inside(g, r, c)) return 'off';
  if (g[r][c] === color && g0?.[r]?.[c] === old) return 'painted'; // painted by this fill, not born that colour
  if (g[r][c] !== old) return 'wall';
  return null;
}
const OPTS = ['Paint it', 'Stop: it is off the image', 'Stop: a different colour', 'Stop: already painted'];
const KEY = { paint: 0, off: 1, wall: 2, painted: 3 };

export default {
  id: 'flood-fill',
  metaphor: 'Paint spilling from a bucket',
  caption: 'Paint spills from the start pixel to its up / down / left / right neighbours that still have the old colour. Lit tiles were just painted; a repainted pixel is never visited again.',
  narrate(ctx) {
    const g = gridOf(ctx, ctx.vars);
    const old = oldOf(ctx);
    const color = ctx.vars[ctx.params[3]];
    if (!g || old === undefined) return null;
    const oName = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && !(k in ctx.prev) && ctx.vars[k] === old && /old|orig|start|src|source|base|init|target|prev|from/i.test(k));
    if (oName) return `the start pixel (${ctx.input[1]}, ${ctx.input[2]}) has colour ${old}: every ${old} joined to it turns ${color}`;
    const total = changed(g, ctx.input[0]).length;
    const d = changed(g, ctx.prev[ctx.params[0]]);
    if (d.length === 1) {
      const [r, c] = d[0];
      return `(${r}, ${c}) still had the old colour ${old}: paint it ${g[r][c]} (${total} painted so far)`;
    }
    if (d.length > 1) return `${d.length} pixels painted at once (${total} so far)`;
    if (ctx.ret && Array.isArray(ctx.value)) {
      return total ? `nowhere left to spill: ${total} pixel${total > 1 ? 's' : ''} repainted` : `the new colour ${color} equals the old one: nothing to paint, the image comes back unchanged`;
    }
    const cell = cellOf(ctx.vars, ctx.prev);
    if (!cell) return null;
    const [r, c, moved, nbr] = cell;
    if (ctx.ret) {
      const why = stopWhy(g, r, c, old, color, ctx.input[0]);
      if (why === 'off') return `(${r}, ${c}) is off the image: the paint stops at the edge`;
      if (why === 'painted') return `(${r}, ${c}) is already painted ${color}: turn back`;
      if (why === 'wall' && g[r][c] === color) return `(${r}, ${c}) was ${color} from the start, not ${old}: another region, the paint stops`;
      if (why === 'wall') return `(${r}, ${c}) has colour ${g[r][c]}, not ${old}: a wall, the paint stops`;
      return null;
    }
    // no verdict here: a prediction may ask what happens to this pixel
    if (moved && inside(g, r, c) && g[r][c] === old) return `the paint reaches (${r}, ${c})`;
    if (!moved) return null;
    if (nbr) {
      // a BFS neighbour that will be skipped
      const why = stopWhy(g, r, c, old, color, ctx.input[0]);
      if (why === 'off') return `neighbour (${r}, ${c}) is off the image: skip it`;
      if (why === 'painted') return `neighbour (${r}, ${c}) is already painted: skip it`;
      if (why === 'wall') return `neighbour (${r}, ${c}) has colour ${g[r][c]}, not ${old}: skip it`;
      return null;
    }
    if (inside(g, r, c) && g[r][c] === color && total) {
      const q = Object.keys(ctx.vars).some((k) => /queue|^q$|stack|^st$/i.test(k));
      return q ? `(${r}, ${c}) leaves the line: spill to its 4 neighbours` : `back at (${r}, ${c}): spill to its next neighbour`;
    }
    return null;
  },
  // paint or stop? asked when a pixel has just been reached and the next step decides
  predict(ctx) {
    const nx = ctx.next;
    const g = gridOf(ctx, ctx.vars);
    const old = oldOf(ctx);
    const color = ctx.vars[ctx.params[3]];
    if (!nx || !g || old === undefined || old === color || !(ctx.params[0] in ctx.prev)) return null;
    let cell;
    let ans;
    const nCell = cellOf(nx.vars, ctx.vars);
    const now = cellOf(ctx.vars, ctx.prev);
    if (nx.ret && nx.value === undefined && nCell?.[2]) {
      // the next step reaches a new pixel and returns right there
      cell = nCell;
      ans = stopWhy(g, cell[0], cell[1], old, color, ctx.input[0]);
    } else if (now?.[2] && inside(g, now[0], now[1])) {
      cell = now;
      const d = changed(gridOf(ctx, nx.vars) || [], g);
      if (d.length === 1 && d[0][0] === now[0] && d[0][1] === now[1]) ans = 'paint';
    }
    if (!cell || !ans) return null;
    const [r, c] = cell;
    if (r === ctx.input[1] && c === ctx.input[2] && ans === 'paint') return null; // the start pixel: no question
    const shown = inside(g, r, c) ? `colour ${g[r][c]}` : 'outside the image';
    return {
      question: `The paint (old colour ${old}, new ${color}) reaches (${r}, ${c}): ${shown}. What happens?`,
      options: OPTS,
      answer: KEY[ans],
      explain:
        ans === 'paint'
          ? `(${r}, ${c}) is inside and still has the old colour ${old}, so it is painted ${color} and the paint spills on from it.`
          : ans === 'off'
            ? `Row ${r} / column ${c} is outside the image: bounds are checked before the pixel is read.`
            : ans === 'painted'
              ? `(${r}, ${c}) already has the new colour ${color}: it was painted earlier, so the fill does not go round in circles.`
              : `(${r}, ${c}) has colour ${g[r][c]}, not ${old}: it is not part of the region, so the paint stops there.`,
    };
  },
  bugs: [
    {
      label: 'No early return when the colours match',
      find: 'if (old === color) return image;',
      replace: '',
      explain: 'When the new colour equals the old one, a painted pixel still looks unpainted, so the fill bounces between neighbours forever.',
    },
    {
      label: 'Only two directions',
      find: 'fill(r, c + 1); fill(r, c - 1);',
      replace: 'fill(r, c + 1);',
      explain: 'The paint never flows left, so pixels reachable only by going left (like (0, 0) in a spiral) keep the old colour.',
    },
  ],
};
