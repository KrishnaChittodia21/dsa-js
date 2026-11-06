// Perfect Squares: dp[x] = fewest square tiles (1, 4, 9, …) that add up to x. A cell improves when some square,
// laid last on top of the already-solved x − square, uses fewer tiles. Works with a dp row; a memo Map / object
// (recursion) gets a short "solved" note.
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'memo', 'cache', 'best', 'table', 'f', 'minSq', 'count', 'counts'];
const ROOT = ['j', 'k', 'i', 'r', 'root', 's', 'sq', 'square', 'q'];
const SIDE = ['j', 'k', 'r', 's', 'root', 'side'];
const NUM = ['x', 'i', 'num', 'm', 'target', 'amount'];
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length > 1 && r.every((x) => typeof x === 'number'));
const tiles = (v) => `${v} tile${v === 1 ? '' : 's'}`;
const fmt = (v) => (Number.isFinite(v) ? String(v) : '∞');

/** the side r of the last square that explains dp[x] = v: the loop's square when it fits, else any that does */
function sideFor(vars, dp, x, v) {
  const fits = [];
  for (let r = 1; r * r <= x; r++) if (dp[x - r * r] + 1 === v) fits.push(r);
  // a loop variable that is the side (j) or the square itself (sq = j * j)
  const named = ROOT.map((k) => vars[k]).find((w) => Number.isInteger(w) && (fits.includes(w) || fits.some((r) => r * r === w)));
  if (named !== undefined) return fits.includes(named) ? named : Math.round(Math.sqrt(named));
  return fits[0];
}

export default {
  id: 'perfect-squares',
  metaphor: 'Building a number from square tiles',
  caption: 'Cell x is the fewest square tiles (1, 4, 9, …) that add up to x (∞ = not built yet). A cell improves when one more square on top of a smaller, already-built number uses fewer tiles.',
  compare: 'dp',
  narrate(ctx) {
    const n = ctx.input?.[0];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `${n} needs ${tiles(ctx.value)} at the fewest`;
    const d = dpOf(ctx.vars, ctx.params);
    if (!d) {
      const key = DP.filter((k) => !ctx.params.includes(k)).find((k) => entriesOf(ctx.vars[k]));
      const m = key && entriesOf(ctx.vars[key]);
      const was = (key && entriesOf(ctx.prev[key])) || [];
      const [x, v] = (m && m.length === was.length + 1 && m.find(([k]) => !was.some(([w]) => w === k))) || [];
      return Number.isInteger(v) ? `${x} solved: ${tiles(v)} at the fewest (remembered)` : null;
    }
    const [name, dp] = d;
    const before = row(ctx.prev[name]);
    if (!before) return dp.slice(1).every((v) => v === Infinity) ? `every number 1…${dp.length - 1} starts at ∞: not built yet` : null;
    const ch = changedIdx(dp, before);
    if (ch.length !== 1) {
      // trying a square: the side is chosen, the cell is not written yet
      const rk = SIDE.find((k) => Number.isInteger(ctx.vars[k]));
      const xk = NUM.find((k) => k !== rk && Number.isInteger(ctx.vars[k]));
      const [r, x] = [ctx.vars[rk], ctx.vars[xk]];
      const moved = ctx.prev[rk] !== r || ctx.prev[xk] !== x;
      if (!(ch.length === 0 && moved && r >= 1 && r * r <= x)) return null;
      const try_ = `${x}: try a ${r}×${r} tile last, on top of ${x - r * r}`;
      // when the cell stays as it is, tell why (an improvement is left for the prediction)
      // a write into the cell that kept its value (dp[x] = min(dp[x], …)) has already decided
      const wrote = new RegExp(`\\b${name}\\s*\\[[^\\]]+\\]\\s*=[^=]`).test(ctx.src || '');
      const stays = wrote || (ctx.next && changedIdx(row(ctx.next.vars[name]) || [], dp).length === 0 && ctx.next.vars[rk] !== r);
      const c = dp[x - r * r] + 1;
      return stays && Number.isFinite(c) && c >= dp[x] ? `${try_}: ${c} tiles, no better than ${fmt(dp[x])}` : try_;
    }
    const x = ch[0];
    const v = dp[x];
    if (x === 0 && v === 0) return '0 needs no tiles at all: the cell every other one is built on';
    const r = sideFor(ctx.vars, dp, x, v);
    if (r === undefined) return null;
    const was = Number.isFinite(before[x]) ? `, better than ${before[x]}` : '';
    if (r * r === x) return `${x} is itself a square (${r}×${r}): ${tiles(1)}${was}`;
    return `${x}: a ${r}×${r} tile on top of ${x - r * r} (${tiles(dp[x - r * r])}) → ${tiles(v)}${was}`;
  },
  // when a cell that is already built is about to improve: to how many tiles?
  predict(ctx) {
    if (!ctx.next) return null;
    const d = dpOf(ctx.vars, ctx.params);
    const after = d && row(ctx.next.vars[d[0]]);
    if (!after) return null;
    const ch = changedIdx(after, d[1]);
    if (ch.length !== 1) return null;
    const x = ch[0];
    const v = after[x];
    const was = d[1][x];
    if (!Number.isFinite(was) || !Number.isFinite(v) || v >= was) return null;
    const r = sideFor(ctx.next.vars, after, x, v);
    const why = r === undefined ? 'Another last square builds it with fewer tiles.' : r * r === x ? `${x} is itself a square (${r}×${r}): one tile.` : `A ${r}×${r} tile on top of ${x - r * r} (${tiles(after[x - r * r])}) makes ${x} with ${tiles(v)}.`;
    return options(`${x} takes ${tiles(was)} so far. It is about to improve: to how many?`, v, [was, v + 1, was - 1].filter((w) => w !== v && w >= 0), why);
  },
  bugs: [
    {
      label: 'Start every cell at 0 instead of ∞',
      find: 'fill(Infinity)',
      replace: 'fill(0)',
      explain: 'Every cell already says "0 tiles", so no square can ever improve it and the answer comes out as 0.',
    },
    {
      label: 'Skip the square that fits exactly',
      find: 'j * j <= x',
      replace: 'j * j < x',
      explain: 'A square equal to x (4 for 4, 1 for 1) is never tried, so square numbers need several tiles, and 1 cannot be built at all.',
    },
  ],
};
