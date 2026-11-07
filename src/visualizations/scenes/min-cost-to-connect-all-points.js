// Min Cost to Connect All Points (Prim). The tree grows from one point; every outside point remembers its cheapest
// wire to the tree, the cheapest of those joins next, and the newcomer may offer shorter wires to the rest.
// Reads an in-tree flag row (inTree / visited / seen…) or Set, a board of best wires (minCost / dist / key…) and,
// for heap versions, a heap of [cost, point] items (popped via diffItems). Anything else gets the generic notes.
import { diffItems, itemsOf, options, row } from './util.js';

const inf = (x) => x === null || x === undefined || x === Infinity;
const fmt = (x) => (inf(x) ? '∞' : x);
const AT = ['u', 'cur', 'curr', 'node', 'pick', 'next', 'best', 'chosen', 'sel', 'nxt'];
const OTHER = ['v', 'j', 'k', 'other', 'nb', 'nei', 'w'];
const CAND = ['d', 'dist', 'cost', 'c', 'dd', 'nd', 'manhattan', 'len', 'distance', 'md', 'cand', 'newCost'];

/** the points already in the tree (a flag row or a Set), or null */
function treeOf(vars, n, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !/tree|mst|visit|vis$|seen|used|added|taken|done|connect|inset|joined/i.test(k)) continue;
    if (v && v.$set) return new Set(v.$set);
    if (row(v) && v.length === n) return new Set(v.map((x, i) => (x && x !== -1 ? i : -1)).filter((i) => i >= 0));
  }
  return null;
}
/** name of the board of best wires: a non-parameter row of n numbers / ∞ */
const boardOf = (vars, n, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && /min|cost|dist|key|best|^d$|wire/i.test(k) && row(vars[k]) && vars[k].length === n && vars[k].every((x) => inf(x) || typeof x === 'number'));
/** { name, items } of a heap of [cost, point] items */
function heapOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2)) return { name: k, items };
  }
  return null;
}
const firstIntOf = (vars, names, skip) => names.find((k) => !skip.includes(k) && Number.isInteger(vars?.[k]));
const pt = (pts, i) => (row(pts?.[i]) ? `point ${i} (${pts[i].join(', ')})` : `point ${i}`);

export default {
  id: 'min-cost-to-connect-all-points',
  metaphor: 'Wiring points to a growing tree',
  caption: 'The tree starts at one point. Every outside point remembers its cheapest wire (Manhattan length) to any tree point; the cheapest of those joins next, and the newcomer may offer shorter wires to the rest.',
  narrate(ctx) {
    const [pName] = ctx.params;
    const pts = ctx.vars[pName];
    const n = Array.isArray(pts) ? pts.length : undefined;
    if (ctx.ret && Number.isInteger(ctx.value) && ctx.value === ctx.result && !ctx.next) {
      return `${n ? `all ${n} points hang` : 'every point hangs'} on one tree: the shortest total wire is ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length || !n) return null;
    const tree = treeOf(ctx.vars, n, ctx.params);
    const before = treeOf(ctx.prev, n, ctx.params);
    const b = boardOf(ctx.vars, n, ctx.params);
    const board = b && ctx.vars[b];
    const old = b && row(ctx.prev[b]) && ctx.prev[b].length === n ? ctx.prev[b] : null;
    // heap versions: what was popped?
    const h = heapOf(ctx.vars);
    const hp = heapOf(ctx.prev);
    if (h && hp && h.name === hp.name) {
      const { removed } = diffItems(hp.items, h.items);
      if (removed.length === 1 && Number.isInteger(removed[0][1])) {
        const [c, i] = removed[0];
        if (before?.has(i)) return `pop (${c}, point ${i}): point ${i} is already in the tree, a stale wire: skip`;
        return `pop the cheapest wire left: ${pt(pts, i)} for ${c}`;
      }
    }
    if (tree && before) {
      const fresh = [...tree].filter((i) => !before.has(i));
      if (fresh.length === 1) {
        const i = fresh[0];
        const c = board ? board[i] : undefined;
        if (tree.size === 1) return `start the tree at ${pt(pts, i)}: it costs nothing`;
        return `${pt(pts, i)} joins the tree${typeof c === 'number' ? ` with a wire of ${c}` : ''} (${tree.size} of ${n} connected)`;
      }
    }
    if (board && !old && board.every(inf)) return `no wires known yet: every point starts at ∞`;
    if (board && old) {
      const ch = board.map((x, i) => (x === old[i] ? -1 : i)).filter((i) => i >= 0);
      if (ch.length === 1) {
        const i = ch[0];
        if (board[i] === 0 && inf(old[i])) return `${pt(pts, i)} is where the tree starts: its wire costs 0`;
        const u = firstIntOf(ctx.vars, AT, [b]);
        const from = u && tree?.has(ctx.vars[u]) && ctx.vars[u] !== i ? ` from ${pt(pts, ctx.vars[u])}` : '';
        return `${pt(pts, i)} gets a shorter wire${from}: ${board[i]} instead of ${fmt(old[i])}`;
      }
    }
    for (const k of ['total', 'res', 'ans', 'sum', 'cost', 'result', 'answer']) {
      if (Number.isInteger(ctx.vars[k]) && Number.isInteger(ctx.prev[k]) && ctx.vars[k] !== ctx.prev[k] && k !== b) return `pay ${ctx.vars[k] - ctx.prev[k]} for that wire: total ${ctx.vars[k]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const pts = ctx.vars[ctx.params[0]];
    const n = Array.isArray(pts) ? pts.length : 0;
    if (!n) return null;
    const tree = treeOf(ctx.vars, n, ctx.params);
    const nextTree = treeOf(ctx.next.vars, n, ctx.params);
    const b = boardOf(ctx.vars, n, ctx.params);
    const board = b && ctx.vars[b];
    // which point joins next? (from the board of best wires)
    if (tree && nextTree && board && tree.size >= 1) {
      const fresh = [...nextTree].filter((i) => !tree.has(i));
      if (fresh.length === 1 && nextTree.size === tree.size + 1) {
        const j = fresh[0];
        const cands = board.map((c, i) => [i, c]).filter(([i, c]) => !tree.has(i) && !inf(c));
        const min = Math.min(...cands.map(([, c]) => c));
        if (cands.length < 2 || board[j] !== min || cands.filter(([, c]) => c === min).length !== 1) return null;
        const shown = [[j, board[j]], ...cands.filter(([i]) => i !== j)].slice(0, 4).sort((x, y) => x[0] - y[0]);
        return {
          question: `Cheapest wires from the tree: ${cands.map(([i, c]) => `point ${i}: ${c}`).join(', ')}. Which point joins next?`,
          options: shown.map(([i]) => `point ${i}`),
          answer: shown.findIndex(([i]) => i === j),
          explain: `Point ${j} has the cheapest wire (${board[j]}). By the cut rule, the cheapest wire between the tree and the rest is always safe to add.`,
        };
      }
    }
    // heap versions: which wire is popped next?
    const h = heapOf(ctx.vars);
    const hn = heapOf(ctx.next.vars);
    if (h && hn && h.name === hn.name && h.items.length >= 2 && tree?.size) {
      const { removed, added } = diffItems(h.items, hn.items);
      const it = removed[0];
      const costs = h.items.map((x) => x[0]);
      if (removed.length !== 1 || added.length || tree.has(it[1]) || it[0] !== Math.min(...costs) || costs.filter((c) => c === it[0]).length !== 1) return null;
      const label = (x) => `point ${x[1]} for ${x[0]}`;
      return options(`The heap holds ${h.items.length} wires: ${h.items.slice(0, 6).map((x) => `(${x[0]}, point ${x[1]})`).join(', ')}${h.items.length > 6 ? ', …' : ''}; which one comes out next?`, label(it), h.items.filter((x) => x !== it).map(label), `A min-heap hands out the cheapest wire first: ${label(it)}. It is the cheapest link between the tree and the rest, so it is safe to use.`);
    }
    // relaxing: does the newcomer offer a shorter wire?
    if (board && tree) {
      const v = firstIntOf(ctx.vars, OTHER, [b]);
      const d = firstIntOf(ctx.vars, CAND, [b, v]);
      const u = firstIntOf(ctx.vars, AT, [b, v, d]);
      if (!v || !d || ctx.vars[d] === ctx.prev[d] && ctx.vars[v] === ctx.prev[v]) return null;
      const i = ctx.vars[v];
      const old = board[i];
      if (inf(old) || tree.has(i) || ctx.next.vars[b]?.length !== n) return null;
      const nb = ctx.next.vars[b][i];
      let yes;
      if (nb !== old && nb === ctx.vars[d]) yes = true;
      else if (nb === old && ctx.next.vars[v] !== i) yes = false;
      if (yes === undefined) return null;
      const via = u && tree.has(ctx.vars[u]) ? `point ${ctx.vars[u]}` : 'the newest tree point';
      return {
        question: `Point ${i}'s best wire so far costs ${old}. From ${via} it would cost ${ctx.vars[d]}. Does its best wire change?`,
        options: [`Yes: it drops to ${ctx.vars[d]}`, `No: it stays ${old}`],
        answer: yes ? 0 : 1,
        explain: yes ? `${ctx.vars[d]} < ${old}: the new tree point is closer, so point ${i} would now hang on it.` : `${ctx.vars[d]} ≥ ${old}: an older tree point is at least as close, so nothing changes.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Euclidean instead of Manhattan',
      find: 'const d = Math.abs(x - points[v][0]) + Math.abs(y - points[v][1]);',
      replace: 'const d = Math.hypot(x - points[v][0], y - points[v][1]);',
      explain: 'Wires run along the grid: |dx| + |dy|. Straight-line length makes diagonal wires too cheap (√2 instead of 2) and the total is not even an integer.',
    },
    {
      label: 'Pick a point already in the tree',
      find: 'if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;',
      replace: 'if (u === -1 || minCost[v] < minCost[u]) u = v;',
      explain: 'Point 0 keeps its wire cost 0, so every round picks it again: no new point ever joins and the total stays 0.',
    },
  ],
};
