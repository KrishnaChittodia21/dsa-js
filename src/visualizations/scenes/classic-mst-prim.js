// MST, Prim with a min-heap: the tree grows from town 0; every road leaving the tree is a ticket on the heap, and the
// cheapest ticket to a town not yet in the tree is built next. Reads the heap of [weight, town] tickets (toolkit
// MinHeap / PriorityQueue or a plain array), an in-tree flag row (inTree / visited / used…) and a total-like counter.
import { diffItems, firstInt, itemsOf, options, row } from './util.js';

const FLAGS = /tree|mst|vis|seen|used|taken|added|done|picked|marked|included|in$/i;
const AT = ['u', 'node', 'cur', 'curr', 'city', 'town', 'x'];
const W = ['w', 'wt', 'weight', 'cost', 'c', 'd'];
const TOTAL = ['total', 'sum', 'res', 'ans', 'result', 'mst', 'cost', 'totalWeight', 'tot', 'acc'];

/** the matrix parameter and its size */
function graphOf(ctx) {
  const g = ctx.vars[ctx.params[0]];
  return Array.isArray(g) && g.length && g.every((r) => row(r) && r.length === g.length) ? g : null;
}
/** the in-tree flags: a 0/1 or boolean row with one cell per town */
function flagsOf(vars, n, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !FLAGS.test(k) || !row(v) || v.length !== n) continue;
    if (v.every((x) => x === 0 || x === 1 || typeof x === 'boolean')) return v;
  }
  return null;
}
const inTree = (f) => (f ? f.filter(Boolean).length : 0);
/** { name, items } of the heap: a heap-like variable whose items are [weight, town] pairs */
function heapOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier|edges?$/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2)) return { name: k, items };
  }
  return null;
}
/** the one ticket that left the heap between two steps (nothing added), else null */
function popped(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const { removed, added } = diffItems(a.items, b.items);
  return removed.length === 1 && !added.length ? removed[0] : null;
}
/** the one ticket that joined the heap between two steps, else null */
function pushed(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const { removed, added } = diffItems(a.items, b.items);
  return added.length === 1 && !removed.length ? added[0] : null;
}
/** the popped ticket read as [weight, town], checked against the w / u variables it was unpacked into */
function asTicket(p, vars) {
  const [, u] = firstInt(vars, AT);
  const w = W.map((k) => vars[k]).find((x) => typeof x === 'number');
  if (u === undefined || w === undefined) return null;
  if (p[0] === w && p[1] === u) return [w, u];
  if (p[0] === u && p[1] === w) return [w, u];
  return null;
}

export default {
  id: 'classic-mst-prim',
  metaphor: 'Growing a road network from one town',
  caption: 'Lit towns are in the network. Every road from a lit town to a dark one is a ticket on the heap; the cheapest ticket is built next. A ticket to a town that got lit meanwhile is stale and thrown away. In the matrix, 0 means no road.',
  narrate(ctx) {
    const g = graphOf(ctx);
    if (!g) return null;
    const n = g.length;
    const f = flagsOf(ctx.vars, n, ctx.params);
    if (ctx.ret && typeof ctx.value === 'number') {
      if (ctx.value === -1) return `the heap ran dry with ${f ? `only ${inTree(f)} of ${n}` : 'not all'} towns in the network: the graph is disconnected, so -1`;
      return `all ${n} towns are in the network: the cheapest tree costs ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const pf = flagsOf(ctx.prev, n, ctx.params);
    const p = popped(ctx.prev, ctx.vars);
    if (p) {
      const t = asTicket(p, ctx.vars);
      if (!t) return null;
      const [w, u] = t;
      if (f && f[u]) return `pop (weight ${w}, town ${u}): town ${u} is already in the network, a stale ticket: skip it`;
      if (!f || !inTree(f)) return `start at town ${u}: it costs nothing to stand in the first town`;
      return `pop the cheapest road out of the network: weight ${w} reaches town ${u}`;
    }
    if (f && pf && pf.length === n && inTree(f) === inTree(pf) + 1) {
      const u = f.findIndex((x, i) => x && !pf[i]);
      return `town ${u} joins the network (${inTree(f)} of ${n})`;
    }
    const [tName, total] = firstInt(ctx.vars, TOTAL);
    if (tName && Number.isInteger(ctx.prev[tName]) && total !== ctx.prev[tName]) return `pay for the road: the network now costs ${total}`;
    const q = pushed(ctx.prev, ctx.vars);
    const [, u] = firstInt(ctx.vars, AT);
    if (q && u !== undefined && g[u]) {
      const v = g[u][q[1]] === q[0] ? q[1] : g[u][q[0]] === q[1] ? q[0] : undefined;
      if (v !== undefined) return `road ${u}–${v} (weight ${g[u][v]}) goes on the heap: a way to reach town ${v}`;
    }
    const [vName, v] = firstInt(ctx.vars, ['v', 'nei', 'next', 'to', 'j']);
    if (vName && v !== ctx.prev[vName] && u !== undefined && g[u] && v !== u && v >= 0 && v < n) {
      if (g[u][v] === 0) return `no road between towns ${u} and ${v} (0 means none)`;
      if (f && f[v]) return `town ${v} is already in the network: no ticket needed`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const g = graphOf(ctx);
    if (!g) return null;
    const n = g.length;
    const h = heapOf(ctx.vars);
    // the end: disconnected?
    if (ctx.next.ret && typeof ctx.next.value === 'number' && (!h || !h.items.length)) {
      const f = flagsOf(ctx.vars, n, ctx.params);
      if (!f || inTree(f) === n) return null;
      const [, total] = firstInt(ctx.vars, TOTAL);
      const right = ctx.next.value;
      return options(`The heap is empty and ${inTree(f)} of ${n} towns are in the network. What does the run return?`, right, [-1, total, 0].filter((x) => x !== undefined && x !== right), right === -1 ? 'Some town was never reached: no road leads into it, so there is no spanning tree and the answer is -1.' : 'That is what your code returns.');
    }
    // which ticket comes off the heap next?
    const p = popped(ctx.vars, ctx.next.vars);
    if (!p || !h || h.items.length < 2) return null;
    const t = asTicket(p, ctx.next.vars);
    if (!t) return null;
    const wi = p[0] === t[0] ? 0 : 1; // where the weight sits in a ticket
    const ws = h.items.map((it) => it[wi]);
    if (t[0] !== Math.min(...ws) || ws.filter((x) => x === t[0]).length !== 1) return null;
    const label = (it) => `town ${it[1 - wi]} (weight ${it[wi]})`;
    return options(`The heap holds ${h.items.length} tickets: ${h.items.map((it) => `${it[wi]} to town ${it[1 - wi]}`).join(', ')}. Which comes off next?`, label(p), h.items.filter((it) => it !== p).map(label), `A min-heap hands out the cheapest road first: weight ${t[0]} to town ${t[1]}. Prim always builds the cheapest road leaving the network.`);
  },
  bugs: [
    {
      label: 'A 0 is a free road',
      find: 'if (row[v] > 0 && !inTree[v])',
      replace: 'if (row[v] >= 0 && !inTree[v])',
      explain: 'In the matrix 0 means "no road", but now it is read as a road that costs nothing: towns get linked for free and the total is too small.',
    },
    {
      label: 'Push the distance, not the road',
      find: 'heap.push([row[v], v]);',
      replace: 'heap.push([total + row[v], v]);',
      explain: 'Like Dijkstra, the ticket now carries the distance from the start, so the heap picks the town nearest town 0 instead of the cheapest road out of the network.',
    },
  ],
};
