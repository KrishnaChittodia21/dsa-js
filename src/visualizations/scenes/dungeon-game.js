// Dungeon Game: need[r][c] = the least health the knight must have when he walks into room (r, c) to still reach
// the princess. Filled backwards from her room: need = max(1, cheaper way on − room value). Works with a rolling
// row (length n or n + 1, row number from r / i / row) or a full 2-D table (m or m + 1 rows).
import { changedIdx, firstInt, options, row } from './util.js';

const DP = ['need', 'dp', 'hp', 'health', 'minHp', 'memo', 'f', 'cost', 'table', 'req'];
const ROW = ['r', 'i', 'row', 'y'];
const COL = ['c', 'j', 'col', 'x'];
const NEXT = ['next', 'nxt', 'after', 'minNext', 'exit', 'out', 'nextNeed'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const fin = (x) => typeof x === 'number' && Number.isFinite(x);

/** { r, c, v, old, below, right } for the one cell that changed between two snapshots, else null */
function changedCell(vars, prev, m, n, skip) {
  for (const k of DP) {
    if (skip.includes(k)) continue;
    const a = vars[k];
    const b = prev[k];
    if (isGrid(a) && isGrid(b) && (a.length === m || a.length === m + 1) && b.length === a.length) {
      const hits = [];
      a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push({ r: i, c: j, v: r[j], old: b[i][j], below: a[i + 1]?.[j], right: r[j + 1] })));
      if (hits.length === 1) return hits[0];
    } else if (row(a) && row(b) && (a.length === n || a.length === n + 1) && b.length === a.length) {
      const d = changedIdx(a, b);
      const [, r] = firstInt(vars, ROW);
      if (d.length === 1 && Number.isInteger(r)) return { r, c: d[0], v: a[d[0]], old: b[d[0]], below: b[d[0]], right: a[d[0] + 1] };
    }
  }
  return null;
}

/** the room, the cheaper way on and the rule's value for a written cell, or null when the cell does not fit it */
function explain(cell, grid, m, n) {
  const { r, c, v, below, right } = cell;
  if (!(r >= 0 && r < m && c >= 0 && c < n) || !fin(v) || !row(grid[r])) return null;
  const d = grid[r][c];
  if (!fin(d)) return null;
  const goal = r === m - 1 && c === n - 1;
  let next;
  let way;
  if (fin(below) && (!fin(right) || below <= right)) [next, way] = [below, 'down'];
  else if (fin(right)) [next, way] = [right, 'right'];
  else if (goal) [next, way] = [1, 'out'];
  else return null;
  if (goal && next === 1) way = 'out';
  const raw = next - d;
  return v === Math.max(1, raw) ? { d, next, way, raw, goal, clamp: raw < 1 } : null;
}

const roomName = (e, r, c) => (e.goal ? `the princess room (${r},${c})` : `room (${r},${c})`);
const wayText = (e) => (e.way === 'out' ? 'he must leave with at least 1' : `the cheaper way on (${e.way}) needs ${e.next}`);

export default {
  id: 'dungeon-game',
  metaphor: 'Walking the dungeon backwards from the princess',
  caption: 'Each number is the least health the knight needs walking into that room. Start at the princess and work back: take the cheaper way on, add the demon’s damage or subtract the potion, but never below 1.',
  narrate(ctx) {
    const [gName] = ctx.params;
    const grid = ctx.vars[gName];
    if (!isGrid(grid) || !row(grid[0])) return null;
    const [m, n] = [grid.length, grid[0].length];
    if (ctx.ret && !ctx.next && fin(ctx.value)) return `the knight must start with ${ctx.value} health to reach the princess alive`;
    const cell = changedCell(ctx.vars, ctx.prev, m, n, ctx.params);
    if (!cell) {
      // the step that picks the cheaper way on, before the room itself is costed
      const k = NEXT.find((x) => fin(ctx.vars[x]) && new RegExp(`\\b${x}\\s*=[^=]`).test(ctx.src || ''));
      const [, r] = firstInt(ctx.vars, ROW);
      const [, c] = firstInt(ctx.vars, COL);
      if (!k || !(r >= 0 && r < m && c >= 0 && c < n)) return null;
      return r === m - 1 && c === n - 1 ? `the princess room (${r},${c}): after it he only has to be alive, ${ctx.vars[k]}` : `room (${r},${c}): the cheaper way on (down or right) needs ${ctx.vars[k]} health`;
    }
    const e = explain(cell, grid, m, n);
    if (!e) return cell.v === 1 && cell.c === n - 1 && cell.r >= m - 1 ? 'past the princess the knight just has to be alive: 1 health' : null;
    const { r, c, v } = cell;
    const room = roomName(e, r, c);
    if (e.clamp) return `${room} has a potion (+${e.d}) that covers the ${e.next} needed after it, but he must be alive: ${v}`;
    if (e.d < 0) return `${room} has a demon (${e.d}): ${wayText(e)}, so enter with ${e.next} + ${-e.d} = ${v}`;
    if (e.d === 0) return `${room} is empty: ${wayText(e)}, so enter with ${v}`;
    return `${room} has a potion (+${e.d}): ${wayText(e)}, so ${e.next} − ${e.d} = ${v} on entering is enough`;
  },
  // before a demon room or the first potion that hits the floor of 1: how much health on entering?
  predict(ctx) {
    if (!ctx.next) return null;
    const [gName] = ctx.params;
    const grid = ctx.vars[gName];
    if (!isGrid(grid) || !row(grid[0])) return null;
    const [m, n] = [grid.length, grid[0].length];
    const cell = changedCell(ctx.next.vars, ctx.vars, m, n, ctx.params);
    if (!cell) return null;
    const e = explain(cell, grid, m, n);
    if (!e || e.goal || !(e.d < 0 || (e.clamp && cell.right !== 1))) return null;
    const { r, c, v } = cell;
    const why = e.clamp
      ? `The way on needs ${e.next} and the potion gives ${e.d}: ${e.next} − ${e.d} = ${e.raw}, but health can never be below 1 on entering, so 1.`
      : `The way on (${e.way}) needs ${e.next}; the demon takes ${-e.d}, so he must walk in with ${e.next} + ${-e.d} = ${v}.`;
    const room = e.d < 0 ? `demon ${e.d}` : `potion +${e.d}`;
    return options(`Room (${r},${c}) holds ${room}. How much health must the knight have walking in?`, v, [e.raw, e.next, v + 1, e.next - 1].filter((x) => x !== v), why);
  },
  bugs: [
    {
      label: 'Forget the floor of 1',
      find: 'Math.max(1, next - dungeon[r][c])',
      replace: 'next - dungeon[r][c]',
      explain: 'A big potion makes the need drop to 0 or below, as if the knight could walk in dead. A single potion room [[100]] returns −99 instead of 1.',
    },
    {
      label: 'Leave the princess room with 0 health',
      find: 'need[n - 1] = 1;',
      replace: 'need[n - 1] = 0;',
      explain: 'The knight must still be alive after the last room. Starting from 0, a demon of −5 in her room asks for only 5 health, and he dies at 0.',
    },
  ],
};
