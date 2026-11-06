// Network Delay Time (Dijkstra with a min-heap). A signal spreads from node k along one-way wires; the heap hands
// out the earliest-arriving node next, and its wires may give its neighbours an earlier arrival time.
// Reads a heap of [time, node] tickets (toolkit MinHeap / PriorityQueue or a plain array), a dist-like board and
// an adj / graph list of [v, w] rows. Infinity may be recorded as null (shown as ∞).
import { changedIdx, firstInt, itemsOf, options, row } from './util.js';

const inf = (x) => x === null || x === undefined || x === Infinity;
const fmt = (x) => (inf(x) ? '∞' : x);
const AT = ['u', 'node', 'cur', 'curr', 'from', 'src'];
const TIME = ['d', 'du', 'time', 't', 'cd', 'curDist', 'currDist', 'dd'];
const WEIGHT = ['w', 'wt', 'weight', 'cost', 'c', 'delay', 't', 'time'];

/** { name, items } of the heap: a heap-like variable whose items are [time, node, …] rows */
function heapOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2)) return { name: k, items };
  }
  return null;
}
/** items of a that are not in b (as a multiset) */
function minus(a, b) {
  const left = b.map((x) => JSON.stringify(x));
  return a.filter((x) => {
    const i = left.indexOf(JSON.stringify(x));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
/** the one ticket taken off the heap between two steps, or null */
function popped(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const gone = minus(a.items, b.items);
  return gone.length === 1 && !minus(b.items, a.items).length ? gone[0] : null;
}
/** name of the arrival-time board (not a parameter) */
const boardOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && /dist|time|arriv|best|cost/i.test(k) && row(vars[k]) && vars[k].length > 1);
const adjOf = (vars) => Object.entries(vars || {}).find(([k, v]) => /adj|graph|^g$/i.test(k) && Array.isArray(v) && v.length && v.every((r) => Array.isArray(r)))?.[0];

export default {
  id: 'network-delay-time',
  metaphor: 'A signal racing along one-way wires',
  caption: 'Edges are one-way wires labelled with their delay; dist holds the earliest time each node can hear the signal. The heap always hands out the node that hears it soonest, and that time is final.',
  narrate(ctx) {
    if (ctx.ret && Number.isInteger(ctx.value)) {
      return ctx.value === -1 ? 'some node never hears the signal (no wire path reaches it), so the answer is -1' : `every node has heard the signal; the last one hears it at time ${ctx.value}, so the answer is ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const b = boardOf(ctx.vars, ctx.params);
    const dist = b && ctx.vars[b];
    const p = popped(ctx.prev, ctx.vars);
    if (p) {
      const [d, u] = p;
      if (dist && Number.isInteger(u) && !inf(dist[u]) && d > dist[u]) return `pop (${d}, node ${u}): a stale ticket, node ${u} already hears it at ${dist[u]}, so skip it`;
      return `pop the closest unsettled node: node ${u} hears the signal at time ${d}, and that is final`;
    }
    if (dist && row(ctx.prev[b]) && ctx.prev[b].length === dist.length) {
      const ch = changedIdx(dist, ctx.prev[b]);
      if (ch.length === 1) {
        const i = ch[0];
        const [nw, old] = [dist[i], ctx.prev[b][i]];
        if (nw === 0 && inf(old)) return `the signal starts at node ${i} at time 0; every other node is at ∞ for now`;
        const [, u] = firstInt(ctx.vars, AT);
        const [, d] = firstInt(ctx.vars, TIME);
        const [, w] = firstInt(ctx.vars, WEIGHT);
        if (u !== undefined && d !== undefined && w !== undefined && d + w === nw) return `wire ${u} → ${i}: ${d} + ${w} = ${nw} < ${fmt(old)}, so dist[${i}] drops to ${nw}`;
        if (typeof nw === 'number') return `node ${i} can now hear the signal at time ${nw} (was ${fmt(old)})`;
      }
    }
    if (dist && !ctx.prev[b] && dist.every(inf)) return 'every node starts at ∞: nobody has heard the signal yet';
    const a = adjOf(ctx.vars);
    if (a && Array.isArray(ctx.prev[a]) && ctx.prev[a].length === ctx.vars[a].length) {
      const grown = ctx.vars[a].map((r, i) => (r.length === (ctx.prev[a][i]?.length ?? -1) + 1 ? i : -1)).filter((i) => i >= 0);
      const last = grown.length === 1 && ctx.vars[a][grown[0]].at(-1);
      if (row(last) && last.length === 2) return `wire ${grown[0]} → ${last[0]} carries the signal in ${last[1]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    // the final answer: max of the arrival times, not their sum
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && !heapOf(ctx.vars)?.items.length) {
      const b = boardOf(ctx.vars, ctx.params);
      const n = ctx.vars[ctx.params[1]];
      if (!b || !Number.isInteger(n)) return null;
      const times = ctx.vars[b].slice(-n);
      const fin = times.filter((x) => !inf(x));
      const max = Math.max(...fin);
      const sum = fin.reduce((s, x) => s + x, 0);
      const right = ctx.next.value;
      const why = right === -1 ? 'some node still has ∞: it can never hear the signal, so the answer is -1.' : right === max && fin.length === n ? `everyone hears it; the answer is when the LAST node hears it, the largest time ${max}, not the sum ${sum}.` : `that is what your code returns (largest time ${max}, sum ${sum}).`;
      return options(`The heap is empty. Arrival times: [${times.map(fmt).join(', ')}]. What does the run return?`, right, [-1, max, sum].filter((x) => x !== right), why);
    }
    // which ticket does the heap hand out next?
    const p = popped(ctx.vars, ctx.next.vars);
    const h = heapOf(ctx.vars);
    if (!p || !h || h.items.length < 2) return null;
    const firsts = h.items.map((it) => it[0]);
    if (p[0] !== Math.min(...firsts) || firsts.filter((x) => x === p[0]).length !== 1) return null;
    const label = (it) => `node ${it[1]} at time ${it[0]}`;
    const wrong = h.items.filter((it) => it !== p).map(label);
    return options(`The heap holds ${h.items.length} tickets: ${h.items.map((it) => `(${it[0]}, ${it[1]})`).join(', ')}. Which node pops next?`, label(p), wrong, `A min-heap hands out the smallest time first: node ${p[1]} at ${p[0]}. No other route can reach it sooner, because every other ticket is already later.`);
  },
  bugs: [
    {
      label: 'n slots for nodes 1…n',
      find: 'new Array(n + 1).fill(Infinity)',
      replace: 'new Array(n).fill(Infinity)',
      explain: 'Nodes are labelled 1 to n, so dist needs n + 1 slots: dist[n] does not exist, node n is never reached and the run answers -1.',
    },
    {
      label: 'Wires both ways',
      find: 'adj[u].push([v, w]);',
      replace: 'adj[u].push([v, w]); adj[v].push([u, w]);',
      explain: 'The wires are one-way. Storing v → u too lets the signal travel backwards and reach nodes that should never hear it.',
    },
  ],
};
