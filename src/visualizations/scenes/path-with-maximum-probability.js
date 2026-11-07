// Path with Maximum Probability (Dijkstra with a max-heap, multiplying chances). Each bridge holds with some
// chance; a route's chance is the product. The heap hands out the node reached with the best chance, and that
// chance is final, since multiplying by numbers ≤ 1 can only lower it. Reads a heap of [chance, node] tickets and
// a best / prob board.
import { changedIdx, firstInt, itemsOf, options, row } from './util.js';

const fmt = (x) => (typeof x === 'number' ? String(+x.toFixed(4)) : '?');
const NUM = (vars, names) => {
  const k = names.find((n) => typeof vars[n] === 'number' && Number.isFinite(vars[n]));
  return k === undefined ? [undefined, undefined] : [k, vars[k]];
};
const AT = ['u', 'node', 'cur', 'curr', 'from'];
const TO = ['v', 'nei', 'to', 'nb', 'next', 'neighbor', 'neighbour'];
const CHANCE = ['p', 'prob', 'pu', 'curP', 'currP', 'cp', 'chance', 'pr'];
const EDGE = ['q', 'w', 'ep', 'edgeP', 'edgeProb', 'pe', 'wt', 'weight', 'p2'];
const CAND = ['np', 'nprob', 'newP', 'newProb', 'cand', 'nextP', 'alt', 'pp', 'total'];

function heapOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2)) return { name: k, items };
  }
  return null;
}
function minus(a, b) {
  const left = b.map((x) => JSON.stringify(x));
  return a.filter((x) => {
    const i = left.indexOf(JSON.stringify(x));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
function popped(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const gone = minus(a.items, b.items);
  return gone.length === 1 && !minus(b.items, a.items).length ? gone[0] : null;
}
const boardOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && /best|prob|chance|dist|max/i.test(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every((x) => typeof x === 'number'));
function cell(vars, prev, k) {
  if (!k || !row(prev?.[k]) || prev[k].length !== vars[k].length) return null;
  const ch = changedIdx(vars[k], prev[k]);
  return ch.length === 1 ? [ch[0], vars[k][ch[0]], prev[k][ch[0]]] : null;
}

export default {
  id: 'path-with-maximum-probability',
  metaphor: 'Crossing shaky bridges, keeping the safest route',
  caption: 'Each edge is a bridge that holds with the chance on it; a route’s chance is the product. best holds the safest known chance per node, and the heap always hands out the safest node next.',
  narrate(ctx) {
    const end = ctx.vars[ctx.params[4]];
    if (ctx.ret && typeof ctx.value === 'number') {
      return ctx.value === 0 ? `no route reaches node ${end} with any chance: the answer is 0` : `node ${end} comes off the heap with chance ${fmt(ctx.value)}: no other route can beat it, so that is the answer`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const B = boardOf(ctx.vars, ctx.params);
    const p = popped(ctx.prev, ctx.vars);
    if (p) {
      const [c, x] = p;
      if (B && Number.isInteger(x) && c < ctx.vars[B][x]) return `pop (${fmt(c)}, node ${x}): stale, node ${x} already has a safer chance ${fmt(ctx.vars[B][x])}; skip it`;
      return `pop the safest unsettled node: node ${x} with chance ${fmt(c)}${x === end ? ` (that is the end node ${end})` : ''}`;
    }
    const bc = cell(ctx.vars, ctx.prev, B);
    if (bc) {
      const [i, nw, old] = bc;
      if (nw === 1 && old === 0) return `start at node ${i} with chance 1 (certain); every other node has chance 0 so far`;
      return `${fmt(nw)} > ${fmt(old)}: a safer route to node ${i}, so ${B}[${i}] rises to ${fmt(nw)}`;
    }
    const [cName, c] = NUM(ctx.vars, CAND);
    const [vName, v] = firstInt(ctx.vars, TO);
    const [, u] = firstInt(ctx.vars, AT);
    const [, pu] = NUM(ctx.vars, CHANCE);
    const [, q] = NUM(ctx.vars, EDGE);
    if (cName && v !== undefined && u !== undefined && (c !== ctx.prev[cName] || v !== ctx.prev[vName])) {
      return pu !== undefined && q !== undefined ? `bridge ${u} → ${v} holds with ${fmt(q)}: ${fmt(pu)} × ${fmt(q)} = ${fmt(c)}` : `bridge ${u} → ${v}: reach ${v} with chance ${fmt(c)}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const B = boardOf(ctx.vars, ctx.params);
    if (!B) return null;
    // does this bridge give a safer route?
    const [cName, c] = NUM(ctx.vars, CAND);
    const [vName, v] = firstInt(ctx.vars, TO);
    const [, u] = firstInt(ctx.vars, AT);
    const [, pu] = NUM(ctx.vars, CHANCE);
    const cur = v !== undefined ? ctx.vars[B][v] : undefined;
    if (cName && (c !== ctx.prev[cName] || v !== ctx.prev[vName]) && u !== undefined && typeof cur === 'number' && cur > 0 && pu !== undefined && cur <= pu && !cell(ctx.vars, ctx.prev, B) && NUM(ctx.next.vars, CAND)[0] === cName) {
      const nc = cell(ctx.next.vars, ctx.vars, B);
      const seen = nc && nc[0] === v ? 'yes' : !nc ? 'no' : null;
      const expect = c > cur ? 'yes' : 'no';
      if (seen !== expect) return null;
      return options(`Bridge ${u} → ${v} reaches ${v} with chance ${fmt(c)}; ${B}[${v}] = ${fmt(cur)}. Does ${B}[${v}] change?`, expect === 'yes' ? `yes, it rises to ${fmt(c)}` : 'no, it stays', [`yes, it rises to ${fmt(c)}`, 'no, it stays'], expect === 'yes' ? `${fmt(c)} > ${fmt(cur)}: this route is safer, so it replaces the old one (and goes on the heap).` : `${fmt(c)} is not more than ${fmt(cur)}: the known route is at least as safe, so nothing changes.`);
    }
    // which ticket pops next?
    const p = popped(ctx.vars, ctx.next.vars);
    const h = heapOf(ctx.vars);
    if (!p || !h || h.items.length < 2) return null;
    const firsts = h.items.map((it) => it[0]);
    if (p[0] !== Math.max(...firsts) || firsts.filter((x) => x === p[0]).length !== 1) return null;
    const label = (it) => `node ${it[1]} (chance ${fmt(it[0])})`;
    return options(`The heap holds ${h.items.map((it) => `(${fmt(it[0])}, ${it[1]})`).join(', ')}. Which node pops next?`, label(p), h.items.filter((it) => it !== p).map(label), `A max-heap hands out the highest chance: node ${p[1]} at ${fmt(p[0])}. Every other route is already less safe and can only get worse.`);
  },
  bugs: [
    {
      label: 'Min-heap instead of max-heap',
      find: 'new MaxHeap((e) => e[0])',
      replace: 'new MinHeap((e) => e[0])',
      explain: 'A min-heap hands out the LEAST safe node first, so the end node can be popped and returned with a poor chance before the safer route is found.',
    },
    {
      label: 'Bridges one way only',
      find: 'adj[b].push([a, succProb[i]]);',
      replace: '',
      explain: 'The edges are undirected. Storing only a → b means a route that crosses a bridge backwards is never found.',
    },
  ],
};
