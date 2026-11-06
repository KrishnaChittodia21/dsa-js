// Minimum Cost to Cut a Stick: interval DP over the cut marks plus the two walls. Cell (i, j) is the cheapest way
// to make every cut strictly inside the piece (pos[i], pos[j]); the first cut there costs the piece's length and
// leaves two independent pieces. Works with a bottom-up table or a top-down memo table under any name.
import { changedIdx, firstInt, functionAt, options, row, writtenCell } from './util.js';

const I = ['i', 'l', 'lo', 'left', 'a', 'start', 's'];
const J = ['j', 'r', 'hi', 'right', 'b', 'end', 'e'];
const K = ['k', 'cut', 'c', 'mid', 'p', 'x'];
const isGrid = (v) => Array.isArray(v) && v.length > 1 && v.every((r) => row(r) && r.length === v.length);

/** the walls: a sorted row that starts at 0, ends at n and holds every cut */
function wallsOf(vars, params, n, cuts) {
  if (!Number.isInteger(n) || !row(cuts)) return null;
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !row(v) || v.length !== cuts.length + 2) continue;
    if (v[0] === 0 && v[v.length - 1] === n && v.every((x, t) => t === 0 || v[t - 1] < x)) return v;
  }
  return null;
}
/** the m × m table (m = walls) that is not a parameter */
function tableOf(vars, params, m) {
  for (const [k, v] of Object.entries(vars)) if (!params.includes(k) && isGrid(v) && v.length === m) return [k, v];
  return [];
}
/** the cell written between two snapshots: from the line, else the one changed cell */
function cellWritten(src, vars, prev, name) {
  const w = writtenCell(src, vars);
  if (w && w.name === name && w.at.length === 2) return w.at;
  const a = vars[name];
  const b = prev[name];
  if (!isGrid(a) || !isGrid(b) || a.length !== b.length) return null;
  const hits = [];
  a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push([i, j])));
  return hits.length === 1 ? hits[0] : null;
}
/** the known cost of piece (i, j): 0 with no mark inside, else the table cell when it is filled (memo tables use -1) */
const costOf = (dp, i, j) => (j - i < 2 ? 0 : Number.isFinite(dp[i]?.[j]) && dp[i][j] >= 0 ? dp[i][j] : undefined);
/** for piece (i, j) with total v: the cut k that explains it and the candidate totals of all cuts */
function explain(dp, pos, i, j, v) {
  const L = pos[j] - pos[i];
  const cands = [];
  for (let k = i + 1; k < j; k++) {
    const s = costOf(dp, i, k) + costOf(dp, k, j);
    if (Number.isFinite(s)) cands.push({ k, s, total: s + L });
  }
  const best = cands.filter((c) => c.total === v);
  return { L, cands, best: best.length === 1 ? best[0] : null, ties: best };
}
const piece = (pos, i, j) => `(${pos[i]}, ${pos[j]})`;

function setup(ctx) {
  const [nName, cutsName] = ctx.params;
  const n = ctx.vars[nName];
  const cuts = ctx.input?.[1] ?? ctx.vars[cutsName];
  const pos = wallsOf(ctx.vars, ctx.params, n, cuts);
  if (!pos) return null;
  const [dpName, dp] = tableOf(ctx.vars, ctx.params, pos.length);
  return { n, pos, dpName, dp };
}

export default {
  id: 'minimum-cost-to-cut-a-stick',
  metaphor: 'Sawing a plank, longest pieces first',
  caption: 'The marks are the cuts plus the two ends. Cell (i, j) is the cheapest way to make every cut inside the piece between mark i and mark j: the first cut costs the whole piece, then the left and right pieces are solved on their own.',
  compare: 'dp',
  narrate(ctx) {
    const s = setup(ctx);
    if (ctx.ret && Number.isInteger(ctx.value) && functionAt(ctx.lines, ctx.line) === functionAt(ctx.lines, 1)) return `cutting the whole stick (0, ${ctx.vars[ctx.params[0]]}) at every mark costs ${ctx.value} at best`;
    if (!s) return null;
    if (ctx.ret) {
      // a helper answering for one piece
      const [, i] = firstInt(ctx.vars, I);
      const [, j] = firstInt(ctx.vars, J);
      if (!Number.isInteger(ctx.value) || !(i >= 0 && i < j && j < s.pos.length)) return null;
      return j - i < 2 ? `piece ${piece(s.pos, i, j)} has no mark inside: nothing to cut, 0` : `piece ${piece(s.pos, i, j)} costs ${ctx.value} at best`;
    }
    const { pos, dpName, dp } = s;
    if (!wallsOf(ctx.prev, ctx.params, s.n, ctx.input?.[1] ?? ctx.vars[ctx.params[1]])) return `marks in order, with the stick's two ends added: ${pos.join(' | ')}`;
    if (!dp) return null;
    const at = isGrid(ctx.prev[dpName]) ? cellWritten(ctx.src, ctx.vars, ctx.prev, dpName) : null;
    if (at) {
      const [i, j] = at;
      if (!(i >= 0 && j < pos.length && i < j)) return null;
      const v = dp[i][j];
      if (j - i < 2) return null;
      const { L, best, ties } = explain(dp, pos, i, j, v);
      if (j - i === 2) return v === L ? `piece ${piece(pos, i, j)} holds one mark (${pos[i + 1]}): one cut, costs its length ${L}` : null;
      if (ties.length > 1) return `piece ${piece(pos, i, j)}: first cut at ${ties.map((c) => pos[c.k]).join(' or ')} (a tie): length ${L} + ${ties[0].s} = ${v}`;
      if (!best) return null;
      const k = best.k;
      return `piece ${piece(pos, i, j)}: first cut at ${pos[k]}: length ${L} + left ${costOf(dp, i, k)} + right ${costOf(dp, k, j)} = ${v}`;
    }
    // one candidate first cut being tried
    const [, i] = firstInt(ctx.vars, I);
    const [, j] = firstInt(ctx.vars, J);
    const [kName, k] = firstInt(ctx.vars, K);
    if (!Number.isInteger(i) || !Number.isInteger(j) || !kName || !(i < k && k < j) || j >= pos.length) return null;
    if (k === ctx.prev[kName]) return null;
    const l = costOf(dp, i, k);
    const r = costOf(dp, k, j);
    if (!Number.isFinite(l) || !Number.isFinite(r)) return null;
    return `piece ${piece(pos, i, j)}: try ${pos[k]} first → left ${piece(pos, i, k)} costs ${l}, right ${piece(pos, k, j)} costs ${r}: ${l + r} + length`;
  },
  // right before a piece with two or more marks is written: what does it cost?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = setup(ctx);
    if (!s || !s.dp) return null;
    const after = ctx.next.vars[s.dpName];
    if (!isGrid(after)) return null;
    const at = cellWritten(ctx.lines[ctx.next.line - 1], ctx.next.vars, ctx.vars, s.dpName);
    if (!at) return null;
    const [i, j] = at;
    if (!(i >= 0 && j < s.pos.length && j - i >= 3)) return null;
    const v = after[i][j];
    if (!Number.isFinite(v)) return null;
    const { L, cands, best } = explain(after, s.pos, i, j, v);
    if (!best || cands.length < 2 || cands.length !== j - i - 1) return null;
    const wrong = [v - L, ...cands.map((c) => c.total).filter((t) => t !== v), v + L];
    const marks = s.pos.slice(i + 1, j).join(', ');
    return options(
      `Piece ${piece(s.pos, i, j)} still needs cuts at ${marks}. What is the cheapest total for this piece?`,
      v,
      wrong.filter((w) => Number.isFinite(w) && w >= 0),
      `Cut at ${s.pos[best.k]} first: it costs the whole length ${L}, then left ${costOf(after, i, best.k)} + right ${costOf(after, best.k, j)} = ${v}. Every other first cut costs more.`,
    );
  },
  bugs: [
    {
      label: 'Forget the cost of the first cut',
      find: 'dp[i][j] = best + (pos[j] - pos[i]);',
      replace: 'dp[i][j] = best;',
      explain: 'Each piece adds up only its sub-pieces, and the smallest pieces cost 0, so every cut is free and the answer is 0.',
    },
    {
      label: 'Sort the cuts as text',
      find: '[...cuts].sort((a, b) => a - b)',
      replace: '[...cuts].sort()',
      explain: 'Without a comparator 100 sorts before 20 and 3, so the marks are out of order and pieces get negative lengths.',
    },
  ],
};
