// Island Perimeter. Fence the island: every land tile brings 4 fence pieces, and every side shared by two land
// tiles is inside the island, so its piece goes from both tiles (−2). Also narrates the "+1 per side facing water"
// version. Reads the running total from a few common names (perimeter / ans / res / total…).
import { firstInt, row, options } from './util.js';

const R = ['r', 'i', 'row', 'y'];
const C = ['c', 'j', 'col', 'x'];
const TOTAL = ['perimeter', 'perim', 'peri', 'fence', 'ans', 'res', 'result', 'total', 'count', 'sides', 'edges', 'p'];
const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v[0].length && r.length > 0);

function cell(vars, g) {
  const rn = R.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < g.length);
  const cn = C.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < g[0].length);
  return rn && cn ? { r: vars[rn], c: vars[cn], rn, cn } : null;
}
const totalOf = (vars, params) => firstInt(vars, TOTAL.filter((k) => !params.includes(k)));

// the neighbour this line looks at: grid[r + 1][c] → below, grid[r][c - 1] → left
function side(src, at) {
  const m = src.match(new RegExp(`\\[\\s*(${at.rn}|${at.cn})\\s*([+-])\\s*1\\s*\\]`));
  if (!m) return null;
  const down = m[1] === at.rn;
  const d = m[2] === '+' ? 1 : -1;
  const [r, c] = down ? [at.r + d, at.c] : [at.r, at.c + d];
  return { r, c, word: down ? (d > 0 ? 'below' : 'above') : d > 0 ? 'to the right' : 'to the left' };
}

export default {
  id: 'island-perimeter',
  metaphor: 'Fencing an island tile by tile',
  caption: 'Each land tile brings 4 pieces of fence. Where two land tiles touch, that side is inside the island, so its piece comes off both tiles: −2 per shared side.',
  narrate(ctx) {
    const g = ctx.vars[ctx.params[0]];
    if (!ok(g)) return null;
    const [pName, p] = totalOf(ctx.vars, ctx.params);
    if (ctx.ret && Number.isInteger(ctx.value) && !ctx.next) return `every land tile has been fenced: the fence is ${ctx.value} pieces long`;
    if (!pName || !Number.isInteger(ctx.prev[pName])) return null;
    const d = p - ctx.prev[pName];
    const at = cell(ctx.vars, g);
    if (!d || !at) return null;
    const here = `(${at.r}, ${at.c})`;
    const nb = side(ctx.src, at);
    if (d === 4) return `${here} is land: it brings 4 pieces of fence (fence ${p})`;
    if (d === -2) return `${here} touches land ${nb ? `${nb.word}, (${nb.r}, ${nb.c})` : 'next door'}: that side is inside the island, −2, one piece from each tile (fence ${p})`;
    if (d === -1) return `${here} shares a side with land${nb ? ` ${nb.word}` : ''}: −1 (fence ${p})`;
    if (d === 1) return `a side of ${here}${nb ? ` (${nb.word})` : ''} faces water or the map edge: +1 piece (fence ${p})`;
    return `${here}: ${d > 0 ? '+' : ''}${d} pieces (fence ${p})`;
  },
  // right after the fence changed on a land tile: how long is it after the next check?
  predict(ctx) {
    if (!ctx.next) return null;
    const g = ctx.vars[ctx.params[0]];
    const [pName, p] = totalOf(ctx.vars, ctx.params);
    if (!ok(g) || !pName || !Number.isInteger(ctx.prev[pName]) || p === ctx.prev[pName]) return null;
    const at = cell(ctx.vars, g);
    const q = ctx.next.vars[pName];
    if (!at || g[at.r][at.c] !== 1 || !Number.isInteger(q) || p - ctx.prev[pName] !== 4) return null;
    // skip tiles with land both below and right (two −2 in a row): keeps the answers varied
    if ((g[at.r + 1]?.[at.c] === 1) + (g[at.r][at.c + 1] === 1) > 1) return null;
    const d = q - p;
    const why =
      d === -2
        ? `(${at.r}, ${at.c}) touches another land tile: the shared side is inside the island, so both tiles lose that piece (−2).`
        : d === 0
          ? `No land touches (${at.r}, ${at.c}) on the sides still to check, so nothing comes off and the scan moves on.`
          : `The fence changes by ${d > 0 ? '+' : ''}${d}.`;
    return options(`(${at.r}, ${at.c}) is land and the fence is ${p} pieces. How long is it after the next step?`, q, [p - 2, p, p - 1, p + 4], why);
  },
  bugs: [
    {
      label: 'Subtract 1 per shared side',
      find: 'grid[r + 1][c] === 1) perimeter -= 2;',
      replace: 'grid[r + 1][c] === 1) perimeter -= 1;',
      explain: 'A shared side was counted by both tiles, so both pieces must come off. Taking only 1 leaves a piece of fence inside the island.',
    },
    {
      label: 'Only look to the right',
      find: 'if (r + 1 < R && grid[r + 1][c] === 1) perimeter -= 2;',
      replace: '',
      explain: 'Tiles stacked on top of each other also share a side. Ignoring the tile below, a vertical bar of 3 gets 12 instead of 8.',
    },
  ],
};

