// Word Search: a finger traces the word on the letter board. Each step must land on the next letter; tiles on the
// current path are covered (#) so the path cannot reuse them, and uncovered on the way back (backtracking).
// Works with dfs(r, c, k) style recursion (r/c, i/j, row/col, x/y) and a board that is marked in place or a visited grid.
import { callArgs, row } from './util.js';

const CELL = [['r', 'c'], ['i', 'j'], ['row', 'col'], ['x', 'y'], ['y', 'x'], ['rr', 'cc']];
const isBoard = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0);

/** the call we are in: { r, c, k } from its parameters (k = how many letters are matched so far), or null */
function stateOf(ctx, vars = ctx.vars) {
  const call = callArgs({ ...ctx, vars });
  if (!call) return null;
  const a = call.args;
  const pair = CELL.find(([x, y]) => Number.isInteger(a[x]) && Number.isInteger(a[y]));
  if (!pair) return null;
  const rest = Object.entries(a).filter(([k, v]) => !pair.includes(k) && Number.isInteger(v) && !ctx.params.includes(k));
  if (rest.length !== 1) return null;
  return { r: a[pair[0]], c: a[pair[1]], k: rest[0][1], fn: call.name };
}
const at = (r, c) => `(${r}, ${c})`;
/** a visited grid of the learner's (true / 1 = on the current path), not the board */
const seenOf = (ctx, vars) => Object.entries(vars || {}).find(([k, v]) => !ctx.params.includes(k) && /seen|visit|vis|used|mark|path/i.test(k) && Array.isArray(v) && v.length > 0 && v.every((r) => Array.isArray(r) && r.every((x) => typeof x === 'boolean' || x === 0 || x === 1)))?.[1];
/** is tile (r, c) on the current path: covered on the board, or marked in a visited grid */
function onPath(ctx, vars, r, c) {
  const g = vars[ctx.params[0]];
  const b0 = ctx.input?.[0];
  if (isBoard(g) && isBoard(b0) && g[r]?.[c] !== b0[r]?.[c]) return true;
  return !!seenOf(ctx, vars)?.[r]?.[c];
}

export default {
  id: 'word-search',
  metaphor: 'A finger tracing a word on a letter board',
  caption: 'The finger must step to a neighbouring tile holding the next letter. Covered tiles (#) are on the current path and cannot be reused; they are uncovered when the finger backs out.',
  narrate(ctx) {
    const [bName, wName] = ctx.params;
    const word = typeof ctx.vars[wName] === 'string' ? ctx.vars[wName] : null;
    const b0 = ctx.input?.[0];
    const g = ctx.vars[bName];
    const gp = ctx.prev[bName];
    // covering / uncovering a tile
    if (isBoard(g) && isBoard(gp) && isBoard(b0)) {
      const d = [];
      g.forEach((r, i) => r.forEach((x, j) => x !== gp[i]?.[j] && d.push([i, j])));
      if (d.length === 1) {
        const [r, c] = d[0];
        const len = g.flat().filter((x, k) => x !== b0[Math.floor(k / g[0].length)]?.[k % g[0].length]).length;
        if (g[r][c] === b0[r][c]) return `${at(r, c)} '${g[r][c]}' leaves the path: uncover it so other paths can use it`;
        return `${at(r, c)} '${b0[r][c]}' joins the path${word ? ` ("${word.slice(0, len)}" so far)` : ''}: cover it so the path cannot reuse it`;
      }
    }
    const sv = seenOf(ctx, ctx.vars);
    const sp = seenOf(ctx, ctx.prev);
    if (sv && sp && isBoard(b0) && sv.length === sp.length) {
      const d = [];
      sv.forEach((r, i) => r.forEach((x, j) => !!x !== !!sp[i]?.[j] && d.push([i, j])));
      if (d.length === 1) {
        const [r, c] = d[0];
        return sv[r][c] ? `${at(r, c)} '${b0[r][c]}' joins the path: mark it so the path cannot reuse it` : `${at(r, c)} '${b0[r][c]}' leaves the path: unmark it so other paths can use it`;
      }
    }
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') return ctx.value ? 'the whole word was traced: true' : 'the word cannot be traced on this board: false';
    const st = stateOf(ctx);
    if (!st || !word || !isBoard(b0)) return null;
    const { r, c, k } = st;
    const inside = r >= 0 && c >= 0 && r < b0.length && c < b0[0].length;
    if (ctx.ret && ctx.value === true && k === word.length) return `all ${word.length} letters matched: "${word}" is on the board!`;
    if (ctx.ret && ctx.value === true) return `${at(r, c)}: a path from here finished the word, pass "found" back up`;
    if (ctx.ret && ctx.value === false) {
      if (!inside) return `${at(r, c)} is off the board: dead end`;
      const now = isBoard(g) ? g[r][c] : b0[r][c];
      if (k >= word.length) return null;
      if (onPath(ctx, ctx.vars, r, c)) return `${at(r, c)} is already on the path: it cannot be used twice`;
      if (now !== word[k]) return `${at(r, c)} holds '${now}' but letter ${k + 1} must be '${word[k]}': dead end, back out`;
      return `${at(r, c)}: no neighbour carries on with '${word[k + 1] ?? ''}': back out`;
    }
    // a call starts (no verdict here: a prediction may ask about it)
    const before = stateOf(ctx, ctx.prev);
    if (before && (before.k > k || (before.k === k && before.r === r && before.c === c))) return null;
    if (inside && k < word.length && !ctx.ret) return `the finger tries ${at(r, c)} for letter ${k + 1} of "${word}": '${word[k]}'`;
    return null;
  },
  // the finger is on a tile: does the path go on?
  predict(ctx) {
    const nx = ctx.next;
    const [bName, wName] = ctx.params;
    const word = ctx.vars[wName];
    const b0 = ctx.input?.[0];
    const st = stateOf(ctx);
    if (!nx || !st || ctx.ret || typeof word !== 'string' || !isBoard(b0)) return null;
    const { r, c, k } = st;
    if (k < 1 || k >= word.length || r < 0 || c < 0 || r >= b0.length || c >= b0[0].length) return null; // skip start tiles
    const before = stateOf(ctx, ctx.prev);
    if (before && (before.k > k || (before.k === k && before.r === r && before.c === c))) return null;
    const g = isBoard(ctx.vars[bName]) ? ctx.vars[bName] : b0;
    const tile = g[r][c];
    const used = onPath(ctx, ctx.vars, r, c);
    if (used && tile !== '#') return null; // marked in a separate grid: the board tile alone would mislead
    const nst = stateOf(ctx, nx.vars);
    const sameCall = nst && nst.r === r && nst.c === c && nst.k === k;
    let answer;
    if (nx.ret && nx.value === false && sameCall) answer = 1;
    else if (!nx.ret && sameCall && tile === word[k] && !used) answer = 0;
    else return null;
    return {
      question: `The finger tries ${at(r, c)}, showing '${tile}'. Letter ${k + 1} of "${word}" must be '${word[k]}'. Does the path go on?`,
      options: [`Yes: it is '${word[k]}', cover it and look at its neighbours`, 'No: dead end, back out at once'],
      answer,
      explain: answer === 0 ? `The tile matches letter ${k + 1}, so the path grows and the search goes on from ${at(r, c)}.` : used ? 'The tile is already covered: it is on the current path and cannot be used twice.' : `'${tile}' is not '${word[k]}', so no path through here can spell the word.`,
    };
  },
  bugs: [
    {
      label: 'Bounds check before "all letters matched"',
      find: "if (k === word.length) return true;\n    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;",
      replace: "if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;\n    if (k === word.length) return true;",
      explain: 'After the last letter the finger steps once more; when the word ends at the board edge that step is off the board, so a found word is reported missing.',
    },
  ],
};
