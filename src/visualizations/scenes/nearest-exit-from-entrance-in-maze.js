// Nearest Exit from Entrance in Maze (BFS level by level). A search party spreads from the entrance one ring of
// tiles per step; the first open border tile any ring touches is the nearest exit. Works with level arrays or a
// queue of [r, c(, d)] items, visited marked in the maze itself, in a 2-D grid or in a Set.
import { firstInt, itemsOf, options, row } from './util.js';

const CUR = [['r', 'c'], ['row', 'col'], ['x', 'y'], ['i', 'j'], ['cr', 'cc'], ['cx', 'cy']];
const NEXT = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['r2', 'c2'], ['rr', 'cc'], ['nRow', 'nCol'], ['newRow', 'newCol']];
const LEVEL = ['steps', 'level', 'dist', 'd', 'moves', 'depth', 'step', 'lvl', 'ans', 'res'];
const EXIT = 'an exit: return now';
const JOIN = 'open: it joins the next ring';
const SKIP = 'skipped';

const pair = (vars, list) => {
  for (const [a, b] of list) if (Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b])) return [vars[a], vars[b]];
  return null;
};
const grid2 = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const at = (g, r, c) => (grid2(g) ? g[r]?.[c] : undefined);
/** did tile (r, c) get marked or queued between two steps? */
function joined(now, next, maze, r, c) {
  if (at(now[maze], r, c) !== at(next[maze], r, c)) return true;
  for (const [k, v] of Object.entries(next)) {
    if (k === maze) continue;
    const old = now[k];
    if (/vis|seen/i.test(k)) {
      if (grid2(v) && at(v, r, c) !== at(old, r, c)) return true;
      if (v?.$set && (old?.$set?.length ?? 0) < v.$set.length) return true;
    }
    const a = itemsOf(v);
    const b = itemsOf(old) || [];
    const last = Array.isArray(a) && a.length > b.length ? a.at(-1) : null;
    if (row(last) && last[0] === r && last[1] === c) return true;
  }
  return false;
}
/** why a tile is passed over, from the original maze and the current one */
function skipWhy(ctx, r, c) {
  const M = ctx.vars[ctx.params[0]];
  const orig = ctx.input?.[0];
  if (!grid2(M) || r < 0 || c < 0 || r >= M.length || c >= M[0].length) return 'it is outside the maze';
  if (at(orig, r, c) === '+') return 'it is a wall';
  return 'it was already reached';
}
const dirName = (dr, dc) => (dr === -1 && dc === 0 ? 'up' : dr === 1 && dc === 0 ? 'down' : dr === 0 && dc === -1 ? 'left' : dr === 0 && dc === 1 ? 'right' : 'at');
const ringOf = (vars) => Object.entries(vars).find(([k, v]) => /frontier|queue|^q$|level|cur/i.test(k) && Array.isArray(itemsOf(v)) && itemsOf(v).every((x) => row(x)));

export default {
  id: 'nearest-exit-from-entrance-in-maze',
  metaphor: 'A search party fanning out ring by ring',
  caption: 'Lit tiles are reached. Each round the whole ring of tiles at the same distance looks at its four neighbours; the first open tile on the border that a ring touches is the nearest exit.',
  narrate(ctx) {
    const [mName, eName] = ctx.params;
    const M = ctx.vars[mName];
    const nxt = pair(ctx.vars, NEXT);
    const cur = pair(ctx.vars, CUR);
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value === -1) return 'every reachable tile has been explored and none is an open border tile: no exit, -1';
      const t = nxt || cur;
      return `${t ? `(${t[0]},${t[1]})` : 'this tile'} is open and on the border: the nearest exit, ${ctx.value} step${ctx.value === 1 ? '' : 's'} from the entrance`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const ent = ctx.input?.[1] || ctx.vars[eName];
    // the entrance blocked behind the party
    if (row(ent) && !nxt && at(M, ent[0], ent[1]) !== at(ctx.prev[mName], ent[0], ent[1])) return `block the entrance (${ent[0]},${ent[1]}) behind you: it is never an exit and never visited twice`;
    if (nxt && cur) {
      const [nr, nc] = nxt;
      const moved = !ctx.prev || pair(ctx.prev, NEXT)?.join() !== nxt.join() || pair(ctx.prev, CUR)?.join() !== cur.join();
      if (moved) return `from (${cur[0]},${cur[1]}) look ${dirName(nr - cur[0], nc - cur[1])} at (${nr},${nc})`;
      if (joined(ctx.prev, ctx.vars, mName, nr, nc)) {
        if (at(M, nr, nc) === at(ctx.prev[mName], nr, nc) && !Object.keys(ctx.vars).some((k) => /vis|seen/i.test(k) && JSON.stringify(ctx.vars[k]) !== JSON.stringify(ctx.prev[k]))) return `(${nr},${nc}) goes on the list for the next ring`;
        const [, lv] = firstInt(ctx.vars, LEVEL);
        const edge = grid2(M) && (nr === 0 || nc === 0 || nr === M.length - 1 || nc === M[0].length - 1);
        return `(${nr},${nc}) is open${edge ? '' : ' but not on the border'}: mark it reached; it joins the next ring${lv !== undefined ? ` (${lv + 1} step${lv ? 's' : ''} out)` : ''}`;
      }
      if (/continue/.test(ctx.src)) return `skip (${nr},${nc}): ${skipWhy(ctx, nr, nc)}`;
      return null;
    }
    const [lName, lv] = firstInt(ctx.vars, LEVEL);
    const newRing = lName && lv !== ctx.prev[lName];
    if (cur && !newRing && pair(ctx.prev, CUR)?.join() !== cur.join()) return `(${cur[0]},${cur[1]}) takes its turn`;
    const ring = ringOf(ctx.vars);
    if (newRing && ring && /queue|^q$/i.test(ring[0])) return `ring ${lv}: the tiles ${lv} step${lv === 1 ? '' : 's'} from the entrance now take their turns`;
    if (newRing && ring) return `ring ${lv}: ${itemsOf(ring[1]).length} tile${itemsOf(ring[1]).length === 1 ? '' : 's'} ${lv} step${lv === 1 ? '' : 's'} from the entrance; each looks at its 4 neighbours`;
    return null;
  },
  // a neighbour tile is in view: skipped, joins the next ring, or an exit?
  predict(ctx) {
    if (!ctx.next) return null;
    const mName = ctx.params[0];
    const nxt = pair(ctx.vars, NEXT);
    const cur = pair(ctx.vars, CUR);
    if (!nxt || !cur || !grid2(ctx.vars[mName])) return null;
    const moved = pair(ctx.prev, NEXT)?.join() !== nxt.join() || pair(ctx.prev, CUR)?.join() !== cur.join();
    if (!moved) return null;
    const [nr, nc] = nxt;
    const sameTile = pair(ctx.next.vars, NEXT)?.join() === nxt.join() && pair(ctx.next.vars, CUR)?.join() === cur.join();
    let right = null;
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && ctx.next.value > 0) right = EXIT;
    else if (joined(ctx.vars, ctx.next.vars, mName, nr, nc)) right = JOIN;
    else if (!ctx.next.ret && (!sameTile || /continue/.test(ctx.lines?.[ctx.next.line - 1] || ''))) right = SKIP;
    if (!right) return null;
    // only interesting tiles: open ones, or open ones already reached
    if (right === SKIP && skipWhy(ctx, nr, nc) !== 'it was already reached') return null;
    const why = right === EXIT ? `(${nr},${nc}) is open and on the border, so the walk ends here: ${ctx.next.value} step${ctx.next.value === 1 ? '' : 's'}.` : right === JOIN ? `(${nr},${nc}) is open but not on the border: it is marked and waits for the next ring.` : `(${nr},${nc}) was already reached by an earlier (or this) ring, so it is skipped: no tile is queued twice.`;
    return options(`From (${cur[0]},${cur[1]}) the party looks at (${nr},${nc}). What happens to it?`, right, [EXIT, JOIN, SKIP], why);
  },
  bugs: [
    {
      label: 'Entrance counts as an exit',
      find: "maze[sr][sc] = '+';                       // mark visited",
      replace: '',
      explain: 'Without blocking the entrance, a neighbour can step back onto it; when the entrance is on the border it is taken as an exit, which the rules forbid.',
    },
    {
      label: 'Return steps instead of steps + 1',
      find: 'return steps + 1;',
      replace: 'return steps;',
      explain: 'The exit is one step beyond the tile you are standing on: returning the current ring number is one short.',
    },
  ],
};
