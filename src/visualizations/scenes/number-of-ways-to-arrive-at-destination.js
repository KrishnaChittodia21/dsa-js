// Number of Ways to Arrive at Destination (Dijkstra that also counts shortest routes). Intersections settle in
// order of arrival time; each road either finds a faster arrival (reset the route count), ties the best time
// (add the routes) or is slower (ignored). Reads a heap of [time, node] tickets, a dist-like board and a ways-like
// board; Infinity may be recorded as null (shown as ∞).
import { changedIdx, firstInt, itemsOf, options, row } from './util.js';

const inf = (x) => x === null || x === undefined || x === Infinity;
const fmt = (x) => (inf(x) ? '∞' : x);
const AT = ['u', 'node', 'cur', 'curr', 'from'];
const TO = ['v', 'nei', 'to', 'nb', 'next', 'neighbor', 'neighbour'];
const CAND = ['nd', 'nt', 'newDist', 'newTime', 'cand', 'alt', 'total', 'arrive', 'arrival', 'nextTime', 'dd', 'ndist'];
const TIME = ['d', 'du', 'time', 'cd', 'curDist', 'currDist', 'dist0'];
const FASTER = 'faster: dist drops, ways reset to ways[u]';
const TIE = 'tie: ways[v] += ways[u]';
const SLOWER = 'slower: nothing changes';

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
/** the one ticket taken off the heap between two steps, or null */
function popped(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const gone = minus(a.items, b.items);
  return gone.length === 1 && !minus(b.items, a.items).length ? gone[0] : null;
}
const board = (vars, params, re) => Object.keys(vars || {}).find((k) => !params.includes(k) && re.test(k) && row(vars[k]) && vars[k].length > 0);
const distOf = (vars, params) => board(vars, params, /dist|time|best|cost|short/i);
const waysOf = (vars, params) => board(vars, params, /ways|count|cnt|paths|num|routes/i);
/** the one changed cell [index, new, old] of board k between two snapshots */
function cell(vars, prev, k) {
  if (!k || !row(prev?.[k]) || prev[k].length !== vars[k].length) return null;
  const ch = changedIdx(vars[k], prev[k]);
  return ch.length === 1 ? [ch[0], vars[k][ch[0]], prev[k][ch[0]]] : null;
}

export default {
  id: 'number-of-ways-to-arrive-at-destination',
  metaphor: 'Counting equally fast routes across town',
  caption: 'dist is the fastest known time to each intersection, ways how many routes achieve it. A faster road resets the count, an equally fast road adds its routes, a slower road is ignored.',
  narrate(ctx) {
    if (ctx.ret && Number.isInteger(ctx.value)) return `${ctx.value} route${ctx.value === 1 ? ' reaches' : 's reach'} intersection ${ctx.vars[ctx.params[0]] - 1} in the shortest time (counted modulo 10⁹ + 7)`;
    if (!Object.keys(ctx.prev).length) return null;
    const D = distOf(ctx.vars, ctx.params);
    const W = waysOf(ctx.vars, ctx.params);
    const [, u] = firstInt(ctx.vars, AT);
    const p = popped(ctx.prev, ctx.vars);
    if (p) {
      const [d, x] = p;
      const dist = D && ctx.vars[D];
      if (dist && Number.isInteger(x) && !inf(dist[x]) && d > dist[x]) return `pop (${d}, ${x}): a stale ticket, ${x} was already settled at ${dist[x]}; skip it so its routes are not counted twice`;
      const w = W && ctx.vars[W][x];
      return `pop the closest unsettled intersection: ${x} at time ${d}${Number.isInteger(w) ? ` (${w} shortest route${w === 1 ? '' : 's'} to it)` : ''}`;
    }
    const dc = cell(ctx.vars, ctx.prev, D);
    const wc = cell(ctx.vars, ctx.prev, W);
    if (dc) {
      const [i, nw, old] = dc;
      if (nw === 0 && inf(old)) return `start at intersection ${i} at time 0; every other one is at ∞`;
      return `faster: ${nw} < ${fmt(old)}, so dist[${i}] drops to ${nw}${wc ? ` and ways[${i}] becomes ${wc[1]}` : ''}`;
    }
    if (wc) {
      const [i, nw, old] = wc;
      const wu = u !== undefined && W ? ctx.vars[W][u] : undefined;
      if (nw === 1 && old === 0 && i === 0 && u === undefined) return 'one way to stand at intersection 0: the empty route';
      if (Number.isInteger(wu) && old > 0 && nw === (old + wu) % 1_000_000_007) return `tie: another way into ${i} at the same time, so ways[${i}] = ${old} + ${wu} = ${nw}`;
      if (Number.isInteger(wu) && nw === wu && old === 0) return `first routes into ${i}: ways[${i}] = ways[${u}] = ${wu}`;
      if (Number.isInteger(wu) && nw === wu) return `the old routes to ${i} were slower: ways[${i}] resets to ways[${u}] = ${wu}`;
      return null;
    }
    const [cName, c] = firstInt(ctx.vars, CAND);
    const [vName, v] = firstInt(ctx.vars, TO);
    if (cName && v !== undefined && u !== undefined && (c !== ctx.prev[cName] || v !== ctx.prev[vName])) return `road ${u} → ${v}: arriving at ${v} at time ${c}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const D = distOf(ctx.vars, ctx.params);
    const W = waysOf(ctx.vars, ctx.params);
    if (!D) return null;
    // a road from the settled intersection: faster, tie or slower?
    const [cName, c] = firstInt(ctx.vars, CAND);
    const [vName, v] = firstInt(ctx.vars, TO);
    const [, du] = firstInt(ctx.vars, TIME);
    const [, u] = firstInt(ctx.vars, AT);
    if (cName && v !== undefined && (c !== ctx.prev[cName] || v !== ctx.prev[vName]) && u !== undefined && W && !inf(ctx.vars[D][v]) && du !== undefined && ctx.vars[D][v] >= du && !cell(ctx.vars, ctx.prev, D) && !cell(ctx.vars, ctx.prev, W) && firstInt(ctx.next.vars, CAND)[0] === cName) {
      const cur = ctx.vars[D][v];
      const expect = c < cur ? FASTER : c === cur ? TIE : SLOWER;
      const dc = cell(ctx.next.vars, ctx.vars, D);
      const wc = cell(ctx.next.vars, ctx.vars, W);
      const seen = dc && dc[0] === v ? FASTER : !dc && wc && wc[0] === v ? TIE : !dc && !wc ? SLOWER : null;
      if (seen !== expect) return null;
      const why = expect === FASTER ? `${c} < ${cur}: every route counted so far is slower, so the count restarts from ways[${u}].` : expect === TIE ? `${c} equals the best time ${cur}: all ways[${u}] routes through ${u} are new shortest routes, so they are added.` : `${c} > ${cur}: this road is slower than the best time, so it adds nothing.`;
      return options(`Road ${u} → ${v} arrives at time ${c}. ${D}[${v}] = ${cur}. What happens?`, expect, [FASTER, TIE, SLOWER], why);
    }
    // which ticket pops next?
    const p = popped(ctx.vars, ctx.next.vars);
    const h = heapOf(ctx.vars);
    if (!p || !h || h.items.length < 2) return null;
    const firsts = h.items.map((it) => it[0]);
    if (p[0] !== Math.min(...firsts) || firsts.filter((x) => x === p[0]).length !== 1) return null;
    const label = (it) => `${it[1]} at time ${it[0]}`;
    return options(`The heap holds ${h.items.map((it) => `(${it[0]}, ${it[1]})`).join(', ')}. Which intersection pops next?`, label(p), h.items.filter((it) => it !== p).map(label), `The min-heap hands out the earliest time: ${p[1]} at ${p[0]}. Every other ticket is later, so no route can still beat it.`);
  },
  bugs: [
    {
      label: 'Add routes on a faster road',
      find: 'ways[v] = ways[u];',
      replace: 'ways[v] = (ways[v] + ways[u]) % MOD;',
      explain: 'When a faster road is found, the routes counted before are all slower and no longer count. Adding keeps them, so the count is too big.',
    },
    {
      label: 'Modulo on the times',
      find: 'const nd = d + t;',
      replace: 'const nd = (d + t) % MOD;',
      explain: 'Only the route COUNT is taken modulo 10⁹ + 7. Reducing the times makes a long route look short, so the wrong routes are counted.',
    },
  ],
};
