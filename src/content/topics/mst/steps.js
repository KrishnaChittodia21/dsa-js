// Step lessons for Minimum Spanning Tree (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every sorted edge, union, parent[] value, rejected edge, heap entry, minCost value and total below comes from
// running the lesson's own code on the example graph: Kruskal with the toolkit UnionFind (union by rank, ra stays
// root on a tie, path-halving find, stable sort), lazy Prim ([weight, node] entries, mark on pop, stale skip),
// dense Prim (minCost[] scan + relax), the virtual-node wrapper and mstWith(skip, force). check() throws on drift.
// The heap is drawn as its entries sorted smallest first; equal weights leave in push order.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label) => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const hl = (ids, s) => Object.fromEntries(ids.map((i) => [i, s]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const f = (x) => (x === Infinity ? '∞' : x);
const check = (ok, msg) => {
  if (!ok) throw new Error(`mst/steps.js: ${msg}`);
};

// ---------- graphs ----------
// G = { L: labels, E: [[u, v, w]], P: positions }; o.st: id → node state, o.es: 'u-v' (u < v) → edge state
const key = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);
const gp = (G, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.label ? { label: o.label } : {}),
  nodes: G.L.map((l, i) => ({ id: i, label: l, x: G.P[i][0], y: G.P[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: (o.edges || G.E).map(([u, v, w]) => {
    const s = o.es?.[key(u, v)];
    return { from: u, to: v, label: String(w), ...(s ? { state: s } : {}) };
  }),
});
const ek = (es, s) => Object.fromEntries(es.map(([u, v]) => [key(u, v), s]));
const en = (G, [u, v]) => `${G.L[u]}–${G.L[v]}`;
const ew = (G, e) => `${en(G, e)} ${e[2]}`;
const weight = (es) => es.reduce((s, e) => s + e[2], 0);

// ---------- the lesson's toolkit UnionFind ----------
const UF = (n) => ({ parent: Array.from({ length: n }, (_, i) => i), rank: new Array(n).fill(0), count: n });
function find(u, x) {
  while (u.parent[x] !== x) {
    u.parent[x] = u.parent[u.parent[x]];
    x = u.parent[x];
  }
  return x;
}
function union(u, a, b) {
  let ra = find(u, a);
  let rb = find(u, b);
  if (ra === rb) return false;
  if (u.rank[ra] < u.rank[rb]) [ra, rb] = [rb, ra];
  u.parent[rb] = ra;
  if (u.rank[ra] === u.rank[rb]) u.rank[ra]++;
  u.count--;
  return true;
}
const isSpanning = (n, es) => {
  const u = UF(n);
  return es.length === n - 1 && es.every(([a, b]) => union(u, a, b));
};
// every spanning tree of a small graph (subsets of n − 1 edge indexes)
function allTrees(n, E) {
  const out = [];
  const pick = (start, cur) => {
    if (cur.length === n - 1) {
      if (isSpanning(n, cur.map((i) => E[i]))) out.push(cur.slice());
      return;
    }
    for (let i = start; i < E.length; i++) pick(i + 1, [...cur, i]);
  };
  pick(0, []);
  return out;
}

// ---------- the lesson's Kruskal (template), recording each examined edge ----------
function kruskal(n, edges, { desc = false, early = true } = {}) {
  const sorted = [...edges].sort(desc ? (a, b) => b[2] - a[2] : (a, b) => a[2] - b[2]);
  const u = UF(n);
  let total = 0;
  let used = 0;
  const ev = [];
  for (let i = 0; i < sorted.length; i++) {
    const [a, b, w] = sorted[i];
    const ok = union(u, a, b);
    if (ok) {
      total += w;
      used++;
    }
    ev.push({ i, ok, total, used, parent: u.parent.slice(), count: u.count });
    if (ok && early && used === n - 1) break;
  }
  return { sorted, ev, total, used, count: u.count, ans: used === n - 1 ? total : -1 };
}

// ---------- the lesson's lazy Prim, recording each pop (entries also keep the tree node they came from, for drawing) ----------
function hpush(h, e) {
  let i = h.length;
  while (i > 0 && h[i - 1][0] > e[0]) i--;
  h.splice(i, 0, e);
}
function prim(n, edges, start = 0, prio = (d, w) => w) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const inTree = new Array(n).fill(0);
  const dist = new Array(n).fill(0); // only used by the Dijkstra-priority mistake
  const heap = [[0, start, -1, 0]]; // [priority, node, from, edge weight]
  let total = 0;
  let count = 0;
  const ev = [];
  const tree = [];
  while (heap.length && count < n) {
    const [w, u, from, ew0] = heap.shift();
    if (inTree[u]) {
      ev.push({ w, u, stale: true, pushed: [], total, count, heap: heap.map((e) => e.slice()), inTree: inTree.slice(), tree: tree.slice() });
      continue;
    }
    inTree[u] = 1;
    dist[u] = w;
    total += ew0;
    count++;
    if (from >= 0) tree.push([from, u, ew0]);
    const pushed = [];
    for (const [v, wt] of adj[u])
      if (!inTree[v]) {
        const e = [prio(dist[u], wt), v, u, wt];
        hpush(heap, e);
        pushed.push(e);
      }
    ev.push({ w, u, stale: false, pushed, total, count, heap: heap.map((e) => e.slice()), inTree: inTree.slice(), tree: tree.slice() });
  }
  return { ev, total, count, ans: count === n ? total : -1, heap, tree };
}
const heapP = (G, h, label = 'heap · w·node') => que(h.map(([w, u]) => `${w}·${G.L[u]}`), label);
const ent = (G, [w, u]) => `[${w}, ${G.L[u]}]`;

// one frame per pop: graph (tree done, popped node active / stale bad, new pushes visited), heap, total
function primFrames(G, run, sayOf, ex = () => ({})) {
  return run.ev.map((e, k) => {
    const st = { ...hl(e.inTree.map((x, i) => (x ? i : -1)).filter((i) => i >= 0), 'done'), ...hl(e.pushed.map((p) => p[1]), 'visited'), [e.u]: e.stale ? 'bad' : 'active' };
    const es = { ...ek(e.pushed.map((p) => [p[2], p[1]]), 'active'), ...ek(e.tree, 'done') };
    const note = e.stale
      ? `Pop ${ent(G, [e.w, e.u])}: ${G.L[e.u]} is already in the tree → **stale**, skip.`
      : `Pop ${ent(G, [e.w, e.u])}: add ${G.L[e.u]}, total ${e.total}. ` + (e.pushed.length ? `Push ${e.pushed.map((p) => ent(G, p)).join(' ')}.` : 'Nothing new to push.');
    return { say: sayOf(e, k), note, panels: [gp(G, { st, es, label: `total ${e.total} · ${e.count} in tree` }), heapP(G, e.heap)], ...ex(e, k) };
  });
}

// ---------- the village graph (what, dry runs) ----------
const V = { L: ['A', 'B', 'C', 'D', 'E'], E: [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]], P: [[0, 0], [2, 0], [1, 1.4], [3, 1.4], [4.3, 1.4]] };
const vg = (o) => gp(V, o);
const VK = kruskal(5, V.E);
check(VK.ans === 11 && VK.ev.length === 5, 'village kruskal');
const VMST = VK.ev.filter((e) => e.ok).map((e) => VK.sorted[e.i]);
check(same(VMST.map((e) => en(V, e)), ['A–C', 'B–C', 'D–E', 'B–D']), 'village MST edges');
const VTREES = allTrees(5, V.E);
check(Math.min(...VTREES.map((t) => weight(t.map((i) => V.E[i])))) === 11, 'MST is the cheapest spanning tree');

// ---------- what ----------
const W_TREE = [[0, 1, 4], [0, 2, 1], [2, 3, 8], [3, 4, 3]];
check(isSpanning(5, W_TREE) && weight(W_TREE) === 16, 'what: a non-minimum spanning tree');
check(!isSpanning(5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [3, 4, 3]]) && !isSpanning(5, [[0, 2, 1], [1, 2, 2], [3, 4, 3]]), 'what: wrong options');

// ---------- why: Cayley's formula, MST vs shortest-path tree ----------
const cay = (n) => n ** (n - 2);
check(cay(4) === 16 && cay(5) === 125 && cay(10) === 1e8, 'cayley');
const K4 = { L: ['0', '1', '2', '3'], E: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 2, 1], [1, 3, 1], [2, 3, 1]], P: [[0, 0], [1.6, 0], [0, 1.4], [1.6, 1.4]] };
check(allTrees(4, K4.E).length === cay(4), 'K4 trees');
const TRI = { L: ['A', 'B', 'C'], E: [[0, 1, 1], [1, 2, 1], [0, 2, 1.5]], P: [[0, 1.3], [1.2, 0], [2.4, 1.3]] };
check(kruskal(3, TRI.E).ans === 2, 'triangle MST');

// ---------- intuition: cut property, exchange argument, cycle property ----------
const crossing = (E, S) => E.filter(([u, v]) => S.includes(u) !== S.includes(v));
const S1 = [0, 2]; // {A, C}
const X1 = crossing(V.E, S1);
const X1min = X1.reduce((a, b) => (b[2] < a[2] ? b : a));
check(same(X1.map((e) => en(V, e)), ['A–B', 'B–C', 'C–D']) && en(V, X1min) === 'B–C' && VMST.some((e) => same(e, X1min)), 'cut {A,C}');
const S2 = [1, 3]; // {B, D}
const X2 = crossing(V.E, S2);
const X2min = X2.reduce((a, b) => (b[2] < a[2] ? b : a));
check(en(V, X2min) === 'B–C' && X2.length === 4, 'cut {B,D}');
const S2idx = VK.sorted.findIndex((e) => same(e, X2min));
// exchange argument on a square with ties
const SQ = { L: ['A', 'B', 'C', 'D'], E: [[0, 1, 1], [1, 2, 2], [2, 3, 1], [0, 3, 2]], P: [[0, 0], [1.8, 0], [1.8, 1.4], [0, 1.4]] };
const sqg = (o) => gp(SQ, o);
const SQ_T = [[0, 1, 1], [2, 3, 1], [0, 3, 2]];
const SQ_E = [1, 2, 2];
const SQ_F = [0, 3, 2];
const SQ_T2 = [[0, 1, 1], [2, 3, 1], SQ_E];
check(isSpanning(4, SQ_T) && isSpanning(4, SQ_T2) && kruskal(4, SQ.E).ans === weight(SQ_T) && weight(SQ_T2) === weight(SQ_T) - SQ_F[2] + SQ_E[2], 'exchange');
check(same(crossing(SQ.E, [0, 1]).map((e) => e[2]), [2, 2]), 'square cut: two crossing edges of weight 2');
// cycle property: A-B-C and B-C-D
check(!VMST.some((e) => en(V, e) === 'A–B') && !VMST.some((e) => en(V, e) === 'C–D'), 'cycle property heaviest edges');

// ---------- brute force ----------
const choose = (m, k) => (k === 0 ? 1 : (choose(m - 1, k - 1) * m) / k);
check(choose(6, 4) === 15, 'subsets');
const VSUB = VTREES.length;
check(VSUB === 8, 'village spanning trees among the 15 subsets');
// mstSlow: DFS reachability over chosen edges
function slowRun(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const adj = Array.from({ length: n }, () => []);
  const ev = [];
  let total = 0;
  let used = 0;
  for (const [u, v, w] of sorted) {
    const seen = new Array(n).fill(0);
    const stack = [u];
    seen[u] = 1;
    let found = false;
    while (stack.length) {
      const x = stack.pop();
      if (x === v) {
        found = true;
        break;
      }
      for (const y of adj[x]) if (!seen[y]) { seen[y] = 1; stack.push(y); }
    }
    if (!found) {
      adj[u].push(v);
      adj[v].push(u);
      total += w;
      used++;
    }
    ev.push({ e: [u, v, w], found, seen: seen.map((s, i) => (s ? i : -1)).filter((i) => i >= 0), total, used });
  }
  return { ev, ans: used === n - 1 ? total : -1 };
}
const SLOW = slowRun(5, V.E);
check(SLOW.ans === 11 && SLOW.ev.length === 6 && SLOW.ev.filter((e) => e.found).length === 2, 'mstSlow');
// reverse-delete: heaviest first, delete if still connected without it
function reverseDelete(n, edges) {
  let keep = [...edges].sort((a, b) => b[2] - a[2]);
  const order = keep.slice();
  const ev = [];
  for (const e of order) {
    const rest = keep.filter((x) => x !== e);
    const u = UF(n);
    rest.forEach(([a, b]) => union(u, a, b));
    const del = u.count === 1;
    if (del) keep = rest;
    ev.push({ e, del, keep: keep.slice() });
  }
  return { ev, keep };
}
const RD = reverseDelete(5, V.E);
check(weight(RD.keep) === 11 && same(RD.ev.map((x) => x.del), [true, false, true, false, false, false]), 'reverse delete');

// ---------- Kruskal frames: graph + sorted edges + parent[] ----------
const sortedArr = (G, run, upto, o = {}) =>
  arr(run.sorted.map((e) => ew(G, e)), {
    label: o.label || 'sorted edges',
    showIndices: false,
    highlights: Object.fromEntries(run.ev.filter((e) => e.i <= upto).map((e) => [e.i, e.i === upto && o.cur !== false ? (e.ok ? 'active' : 'bad') : e.ok ? 'done' : 'muted'])),
    ...(upto >= 0 && o.cur !== false ? { pointers: [ptr(upto, 'e')] } : {}),
  });
const parentArr = (G, p, hi = {}) => arr(p.map((x) => G.L[x]), { label: `parent of ${G.L.join(' ')}`, showIndices: false, highlights: hi });
function kFrames(G, run, sayOf, noteOf) {
  return run.ev.map((e, k) => {
    const cur = run.sorted[e.i];
    const acc = run.ev.filter((x) => x.i < e.i && x.ok).map((x) => run.sorted[x.i]);
    const rej = run.ev.filter((x) => x.i < e.i && !x.ok).map((x) => run.sorted[x.i]);
    const es = { ...ek(acc, 'done'), ...ek(rej, 'muted'), [key(cur[0], cur[1])]: e.ok ? 'active' : 'bad' };
    return {
      say: sayOf(e, k),
      note: noteOf(e, cur, k),
      panels: [gp(G, { es, st: { [cur[0]]: e.ok ? 'active' : 'bad', [cur[1]]: e.ok ? 'active' : 'bad' }, label: `total ${e.total} · used ${e.used}` }), sortedArr(G, run, e.i), parentArr(G, e.parent, e.ok ? { [cur[0]]: 'active', [cur[1]]: 'active' } : {})],
    };
  });
}

// ---------- G2: a second graph for Kruskal / Prim turns ----------
const G2 = { L: ['P', 'Q', 'R', 'S', 'T'], E: [[0, 1, 3], [0, 2, 4], [1, 2, 2], [1, 3, 7], [2, 3, 5], [2, 4, 8], [3, 4, 6]], P: [[0, 0.7], [1.5, 0], [1.5, 1.4], [3, 0], [3, 1.4]] };
const g2 = (o) => gp(G2, o);
const G2K = kruskal(5, G2.E);
const G2ACC = G2K.ev.filter((e) => e.ok).map((e) => en(G2, G2K.sorted[e.i]));
const G2REJ = G2K.ev.find((e) => !e.ok).i;
check(G2K.ans === 16 && same(G2ACC, ['Q–R', 'P–Q', 'R–S', 'S–T']) && G2REJ === 2 && G2K.ev.length === 5, 'G2 kruskal');
const G2P = prim(5, G2.E, 0);
check(G2P.ans === 16 && G2P.ev.filter((e) => e.stale).length === 1 && G2P.ev.length === 6, 'G2 prim from P');
const G2T = prim(5, G2.E, 4);
const G2T_ORDER = G2T.ev.filter((e) => !e.stale).map((e) => G2.L[e.u]);
check(G2T.ans === 16 && same(G2T_ORDER, ['T', 'S', 'R', 'Q', 'P']), 'G2 prim from T');

// ---------- template: maximum spanning tree, forest ----------
const VMAX = kruskal(5, V.E, { desc: true });
check(VMAX.ans === 20 && VMAX.ev.length === 4 && VMAX.ev.every((e) => e.ok), 'maximum spanning tree');
const FO = { L: ['0', '1', '2', '3', '4', '5'], E: [[0, 1, 2], [1, 2, 3], [0, 2, 4], [3, 4, 1], [4, 5, 7], [3, 5, 6]], P: [[0, 0], [1.4, 0], [0.7, 1.2], [2.6, 0], [4, 0], [3.3, 1.2]] };
const FOT = kruskal(6, FO.E);
const FOF = kruskal(6, FO.E, { early: false });
check(FOT.ans === -1 && FOF.total === 12 && FOF.used === 4 && FOF.count === 2, 'forest');

// ---------- implementation: Connecting Cities (1-indexed) ----------
function minimumCost(n, connections) {
  const sorted = [...connections].sort((a, b) => a[2] - b[2]);
  const u = UF(n + 1);
  let total = 0;
  let used = 0;
  const ev = [];
  for (const [a, b, cost] of sorted) {
    const ok = union(u, a, b);
    if (ok) total += cost;
    if (ok) used++;
    ev.push({ e: [a, b, cost], ok, total, used, parent: u.parent.slice() });
    if (ok && used === n - 1) return { ans: total, ev, sorted };
  }
  return { ans: n === 1 ? 0 : -1, ev, sorted };
}
const CC = { L: ['0', '1', '2', '3'], E: [[1, 2, 5], [1, 3, 6], [2, 3, 1]], P: [[0, 0], [0, 1.3], [1.5, 0], [1.5, 1.3]] };
const CCR = minimumCost(3, CC.E);
check(CCR.ans === 6 && CCR.ev.length === 2, 'connecting cities');
const CCD = minimumCost(4, [[1, 2, 3], [2, 3, 4], [1, 3, 5]]);
check(CCD.ans === -1 && CCD.ev.filter((e) => e.ok).length === 2 && !CCD.ev[2].ok, 'connecting cities disconnected');
const DS = [[1, 2, 9], [0, 1, 10]];
const DSS = [...DS].map((e) => e.slice()).sort();
check(same(DSS, [[0, 1, 10], [1, 2, 9]]), 'default sort moves the 10 first');

// ---------- dry run (Kruskal): the lesson's table ----------
check(same(VK.sorted.map((e) => en(V, e)), ['A–C', 'B–C', 'D–E', 'A–B', 'B–D', 'C–D']), 'dry-run order');
check(same(VK.ev.map((e) => e.total), [1, 3, 6, 6, 11]) && same(VK.ev.map((e) => e.used), [1, 2, 3, 3, 4]) && same(VK.ev.map((e) => e.ok), [true, true, true, false, true]), 'dry-run rows');
const DRY_FIND = ['A ≠ C', 'B ≠ {A,C}', 'D ≠ E', 'same group {A,B,C}', '{A,B,C} ≠ {D,E}'];
const DRY_ACT = ['accept, union', 'accept, union', 'accept, union', 'skip (cycle A-B-C)', 'accept, union'];
// without the early exit, C–D is examined and rejected
const VKF = kruskal(5, V.E, { early: false });
check(VKF.ev.length === 6 && !VKF.ev[5].ok && VKF.total === 11, 'C–D rejected without early exit');

// ---------- dry run (Prim): the lesson's table ----------
const VP = prim(5, V.E, 0);
check(same(VP.ev.map((e) => ent(V, [e.w, e.u])), ['[0, A]', '[1, C]', '[2, B]', '[4, B]', '[5, D]', '[3, E]']), 'prim pops');
check(same(VP.ev.map((e) => e.stale), [false, false, false, true, false, false]), 'prim stale');
check(same(VP.ev.map((e) => e.pushed.map((p) => `[${p[0]},${V.L[p[1]]}]`).join(' ')), ['[4,B] [1,C]', '[2,B] [8,D]', '[5,D]', '', '[3,E]', '']), 'prim pushes');
check(same(VP.ev.map((e) => e.total), [0, 1, 3, 3, 8, 11]) && VP.ans === 11, 'prim totals');
check(same(VP.heap.map((e) => ent(V, e)), ['[8, D]']), 'prim leftover heap');
// Prim vs Dijkstra priorities on the same graph
const VD = prim(5, V.E, 0, (d, w) => d + w);
const DIJ_B = VD.ev[1].pushed.find((p) => p[1] === 1)[0];
const DIJ_D = VD.ev[1].pushed.find((p) => p[1] === 3)[0];
check(DIJ_B === 3 && DIJ_D === 9 && VP.ev[1].pushed.find((p) => p[1] === 1)[0] === 2, 'prim vs dijkstra priorities');

// ---------- dense Prim: Min Cost to Connect All Points ----------
const PTS = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]];
function densePrim(points) {
  const n = points.length;
  const minCost = new Array(n).fill(Infinity);
  const inTree = new Array(n).fill(0);
  const from = new Array(n).fill(-1); // only for drawing the tree edges
  minCost[0] = 0;
  let total = 0;
  const ev = [];
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    const before = minCost.slice();
    inTree[u] = 1;
    total += minCost[u];
    const [x, y] = points[u];
    const rel = [];
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = Math.abs(x - points[v][0]) + Math.abs(y - points[v][1]);
      rel.push({ v, d, ok: d < minCost[v] });
      if (d < minCost[v]) {
        minCost[v] = d;
        from[v] = u;
      }
    }
    ev.push({ round, u, before, rel, minCost: minCost.slice(), inTree: inTree.slice(), total, from: from.slice() });
  }
  return { total, ev };
}
const DP = densePrim(PTS);
check(DP.total === 20 && same(DP.ev.map((e) => e.u), [0, 1, 3, 4, 2]), 'dense prim run');
check(same(DP.ev[2].minCost, [0, 4, 9, 3, 4]) && same(DP.ev[2].inTree, [1, 1, 0, 1, 0]), 'dense prim after round 3');
const PG = { L: ['0', '1', '2', '3', '4'], E: [], P: PTS.map(([x, y]) => [x / 1.6, (10 - y) / 2.6]) };
// tree edges: weight = minCost at the moment v was picked
DP.ev.forEach((e, k) => {
  e.tree = DP.ev.slice(1, k + 1).map((x) => [x.from[x.u], x.u, x.before[x.u]]);
});
const dpFrame2 = (e, say, note) => {
  const relE = e.rel.map((r) => [e.u, r.v, r.d]);
  return {
    say,
    note,
    panels: [
      gp(PG, { edges: [...e.tree, ...relE], es: { ...ek(relE.filter((r, i) => e.rel[i].ok), 'active'), ...ek(relE.filter((r, i) => !e.rel[i].ok), 'muted'), ...ek(e.tree, 'done') }, st: { ...hl(e.inTree.map((t, i) => (t ? i : -1)).filter((i) => i >= 0), 'done'), [e.u]: 'active' }, label: `round ${e.round + 1} · total ${e.total}` }),
      arr(e.minCost.map(f), { label: 'minCost', highlights: { ...hl(e.inTree.map((t, i) => (t ? i : -1)).filter((i) => i >= 0), 'muted'), ...hl(e.rel.filter((r) => r.ok).map((r) => r.v), 'active') }, pointers: [ptr(e.u, 'u')] }),
    ],
  };
};
check(weight(DP.ev[4].tree) === 20, 'dense prim tree weight');
const relNote = (e) => (e.rel.length ? e.rel.map((r) => `${r.v}: ${r.d}${r.ok ? (e.before[r.v] === Infinity ? ' ✓' : ` < ${e.before[r.v]} ✓`) : ` ≥ ${e.minCost[r.v]}`}`).join(', ') : 'nothing left to relax');
const K5 = (5 * 4) / 2;

// ---------- virtual node ----------
function withVirtualNode(n, nodeCost, edges) {
  const all = edges.map(([u, v, w]) => [u, v, w]);
  for (let i = 1; i <= n; i++) all.push([0, i, nodeCost[i - 1]]);
  return { all, run: kruskal(n + 1, all) };
}
const VN = { L: ['0', '1', '2', '3'], P: [[1.5, 0], [0, 1.5], [1.5, 1.5], [3, 1.5]] };
const VN1 = withVirtualNode(3, [1, 2, 2], [[1, 2, 1], [2, 3, 1]]);
check(VN1.run.ans === 3 && same(VN1.run.ev.filter((e) => e.ok).map((e) => key(VN1.run.sorted[e.i][0], VN1.run.sorted[e.i][1])), ['1-2', '2-3', '0-1']), 'virtual node example');
const VN2 = withVirtualNode(3, [1, 8, 2], [[1, 2, 3], [2, 3, 9]]);
const VN2_ACC = VN2.run.ev.filter((e) => e.ok).map((e) => VN2.run.sorted[e.i]);
check(VN2.run.ans === 6 && VN2_ACC.filter((e) => e[0] === 0).length === 2, 'virtual node turn: two wells');
check(Math.min(...allTrees(4, VN2.all).map((t) => weight(t.map((i) => VN2.all[i])))) === 6, 'virtual node turn brute');
const vnG = (run) => ({ L: VN.L, E: run.sorted, P: VN.P });

// ---------- edge classification ----------
const EC = { L: ['0', '1', '2', '3', '4'], E: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [0, 3, 2], [0, 4, 3], [3, 4, 3], [1, 4, 6]], P: [[0, 0], [1.6, 0], [1.6, 1.4], [0, 1.4], [0.8, 0.7]] };
const ecg = (o) => gp(EC, o);
function mstWith(n, edges, skip = -1, force = -1) {
  const u = UF(n);
  let total = 0;
  let used = 0;
  const acc = [];
  if (force !== -1) {
    const [a, b, w] = edges[force];
    union(u, a, b);
    total += w;
    used++;
    acc.push(force);
  }
  for (let i = 0; i < edges.length; i++) {
    if (i === skip || i === force) continue;
    const [a, b, w] = edges[i];
    if (union(u, a, b)) {
      total += w;
      used++;
      acc.push(i);
    }
  }
  return { w: used === n - 1 ? total : Infinity, acc };
}
const BEST = mstWith(5, EC.E).w;
const ECR = EC.E.map((_, i) => {
  const ban = mstWith(5, EC.E, i);
  const force = mstWith(5, EC.E, -1, i);
  const cls = ban.w > BEST ? 'critical' : force.w === BEST ? 'pseudo' : 'none';
  return { ban: ban.w, force: force.w, cls, banAcc: ban.acc, forceAcc: force.acc };
});
check(BEST === 7 && same(ECR.map((r) => r.cls), ['critical', 'critical', 'pseudo', 'pseudo', 'pseudo', 'pseudo', 'none']), 'classification');
const MY = mstWith(5, EC.E).acc;
check(same(MY, [0, 1, 2, 4]), 'my MST');
// cross-check with all spanning trees
const ECT = allTrees(5, EC.E).filter((t) => weight(t.map((i) => EC.E[i])) === BEST);
check(EC.E.every((_, i) => (ECR[i].cls === 'critical') === ECT.every((t) => t.includes(i)) && (ECR[i].cls === 'none') === !ECT.some((t) => t.includes(i))), 'classification vs all MSTs');
// uniqueness by weight groups
function groups(n, edges) {
  const u = UF(n);
  const out = [];
  let i = 0;
  while (i < edges.length) {
    let j = i;
    while (j < edges.length && edges[j][2] === edges[i][2]) j++;
    const grp = edges.slice(i, j);
    const cand = grp.filter(([a, b]) => find(u, a) !== find(u, b)).length;
    const succ = grp.filter(([a, b]) => union(u, a, b)).length;
    out.push({ w: edges[i][2], from: i, to: j - 1, cand, succ, parent: u.parent.slice() });
    i = j;
  }
  return out;
}
const GR = groups(5, EC.E);
check(same(GR.map((g) => [g.w, g.cand, g.succ]), [[1, 2, 2], [2, 2, 1], [3, 2, 1], [6, 0, 0]]) && ECT.length > 1, 'groups');
// second-best: brute force over all spanning trees, strictly greater than best
const SECOND = Math.min(...allTrees(5, EC.E).map((t) => weight(t.map((i) => EC.E[i]))).filter((w) => w > BEST));
check(SECOND === 8, 'second best');
// swap rule: non-tree edge 0–3 (w 2): tree path 0-1-2-3 has weights 1,1,2 → heaviest strictly < 2 is 1
check(BEST - 1 + 2 === SECOND, 'swap 0–3');
const ecArr = (hi = {}, o = {}) => arr(EC.E.map((e) => `${e[0]}–${e[1]} ${e[2]}`), { label: 'edges (pre-sorted)', highlights: hi, ...o });

// ---------- mistakes ----------
function visitedSetRun(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const seen = new Set();
  const ev = [];
  let total = 0;
  let used = 0;
  for (const [u, v, w] of sorted) {
    const skip = seen.has(u) && seen.has(v);
    if (!skip) {
      seen.add(u);
      seen.add(v);
      total += w;
      used++;
    }
    ev.push({ e: [u, v, w], skip, seen: [...seen], total, used });
  }
  return { ev, ans: used === n - 1 ? total : -1 };
}
const VS = visitedSetRun(5, V.E);
check(VS.ans === -1 && same(VS.ev.map((e) => e.skip), [false, false, false, true, true, true]), 'visited-set bug');
const TR2 = { L: ['A', 'B', 'C'], E: [[0, 1, 2], [1, 2, 2], [0, 2, 3]], P: [[0, 1.3], [1.2, 0], [2.4, 1.3]] };
const TR2P = prim(3, TR2.E, 0);
const TR2D = prim(3, TR2.E, 0, (d, w) => d + w);
check(TR2P.ans === 4 && weight(TR2D.tree) === 5, 'dist + w builds a heavier tree');
const DC = { L: ['0', '1', '2', '3', '4'], E: [[0, 1, 2], [1, 2, 3], [3, 4, 1]], P: [[0, 0], [1.4, 0], [0.7, 1.2], [2.8, 0], [2.8, 1.2]] };
const DCP = prim(5, DC.E, 0);
check(DCP.ans === -1 && DCP.count === 3 && DCP.total === 5, 'prim disconnected');

// ---------- interview tips: all-equal square ----------
const EQ = { L: ['A', 'B', 'C', 'D'], E: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]], P: SQ.P };
const EQN = allTrees(4, EQ.E).length;
check(EQN === 4, 'all-equal square has 4 MSTs');

// =====================================================================================
const villageTree = (tree, extra = {}) => vg({ es: { ...ek(tree, 'done'), ...extra } });
const dryFrames = kFrames(
  V,
  VK,
  (e, k) => (k === 3 ? 1 : k === 4 ? 2 : 0),
  (e, cur, k) => `${en(V, cur)}, w ${cur[2]}: ${DRY_FIND[k]} → ${DRY_ACT[k]}. total ${e.total}, used ${e.used}.`,
);

const steps = {
  what: [
    {
      kind: 'watch',
      title: 'Five villages, six possible roads',
      lines: ['Every village must reach every other one.', 'A road that closes a loop is wasted money.', 'Keep a **tree**: all n nodes, no cycle, **n − 1** edges.', 'The cheapest such tree is the **MST**.'],
      frames: [
        { say: 0, note: 'Candidate roads with their prices.', panels: [vg(), vars({ n: 5, roads: 6 })] },
        { say: 1, note: 'A–C and B–C already link A and B. A–B (4) would close the loop A-B-C.', panels: [vg({ es: { ...ek([[0, 2], [1, 2]], 'done'), '0-1': 'bad' }, st: hl([0, 1, 2], 'active') }), vars({ loop: 'A-B-C' })] },
        { say: 2, note: `Four roads reach all five villages: n − 1 = 4.`, panels: [villageTree(VMST), vars({ edges: VMST.length })] },
        { say: 3, note: `A–C 1 + B–C 2 + D–E 3 + B–D 5 = ${VK.total}. No spanning tree is cheaper.`, panels: [villageTree(VMST, ek([[0, 1], [2, 3]], 'muted')), vars({ total: VK.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the spanning tree',
      lines: ['A spanning tree touches **all** nodes and has **no cycle**.'],
      panels: [vg()],
      task: {
        type: 'choose',
        question: 'Which road set is a spanning tree of the five villages?',
        options: [
          { text: 'A–B, A–C, C–D, D–E', why: '' },
          { text: 'A–B, A–C, B–C, D–E', why: 'A–B, A–C, B–C form the loop A-B-C, and nothing links {D, E} to the rest.' },
          { text: 'A–C, B–C, D–E', why: 'Only 3 edges: {A, B, C} and {D, E} stay apart. A tree on 5 nodes needs 4.' },
          { text: 'A–C, B–C, B–D, C–D, D–E', why: '5 edges on 5 nodes always hold a cycle — here B-C-D.' },
        ],
        answer: 0,
      },
      solved: 'A–B, A–C, C–D, D–E: 4 edges, no loop, every village reached.',
      then: [{ say: 0, note: 'A spanning tree — but is it the cheapest?', panels: [villageTree(W_TREE)] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: price that tree',
      lines: ['Every spanning tree has 4 edges here.', 'The weights decide which one is **minimum**.'],
      panels: [villageTree(W_TREE), vars({ MST: VK.total })],
      task: { type: 'number', question: 'Total weight of the tree A–B, A–C, C–D, D–E?', options: [11, 14, 16, 19], answer: weight(W_TREE), hint: 'Add 4 + 1 + 8 + 3.' },
      solved: `${weight(W_TREE)}: a spanning tree, but ${weight(W_TREE) - VK.total} more than the MST (${VK.total}).`,
    },
  ],

  why: [
    {
      kind: 'turn',
      title: 'Your turn: count the trees',
      lines: ["Cayley's formula: a complete graph on n nodes has **n^(n−2)** spanning trees."],
      panels: [gp(K4, { label: 'complete graph, n = 4' })],
      task: { type: 'number', question: 'How many spanning trees does this 4-node complete graph have?', options: [4, 6, 16, 24], answer: cay(4), hint: 'n^(n−2) with n = 4.' },
      solved: `4² = ${cay(4)} spanning trees — already for just 4 nodes.`,
    },
    {
      kind: 'watch',
      title: 'Trying them all is hopeless',
      lines: ['The count explodes with n.', 'A greedy algorithm still finds an MST in **O(m log m)**.', 'Greedy is **provably correct** here — the cut property.'],
      frames: [
        { say: 0, note: 'n^(n−2) for growing n.', panels: [table(['n = 4', 'n = 5', 'n = 10', 'n = 20'], ['trees'], [[cay(4)], [cay(5)], ['?'], ['?']], [['done'], ['done'], [''], ['']])] },
        { say: 0, note: 'n = 10 → 100,000,000. n = 20 → about 2.6 × 10^23.', panels: [table(['n = 4', 'n = 5', 'n = 10', 'n = 20'], ['trees'], [[cay(4)], [cay(5)], ['10^8'], ['2.6×10^23']], [['done'], ['done'], ['bad'], ['bad']])] },
        { say: 1, note: 'Instead: pick cheap edges one at a time, never look back.', panels: [villageTree(VMST), vars({ time: 'O(m log m)' })] },
        { say: 2, note: 'Most "cheapest first" strategies fail. For MSTs the cut property proves it works.', panels: [villageTree(VMST), vars({ total: VK.total })] },
      ],
    },
    {
      kind: 'watch',
      title: 'MST is not a shortest-path tree',
      lines: ['MST minimises the **sum of all tree edges**.', 'A shortest-path tree minimises the **distance from one source**.', 'Different goals, different trees.'],
      frames: [
        { say: 0, note: 'Triangle: A–B 1, B–C 1, A–C 1.5.', panels: [gp(TRI)] },
        { say: 0, note: 'MST = {A–B, B–C}, total 2.', panels: [gp(TRI, { es: ek([[0, 1], [1, 2]], 'done'), label: 'MST · total 2' })] },
        { say: 1, note: 'In that MST, A → C costs 1 + 1 = 2. The direct edge costs 1.5.', panels: [gp(TRI, { es: { ...ek([[0, 1], [1, 2]], 'active'), '0-2': 'visited' }, st: { 0: 'active', 2: 'done' } }), vars({ 'MST A→C': 2, direct: 1.5 })] },
        { say: 2, note: 'Shortest-path tree from A = {A–B, A–C}, total 2.5. Not the MST.', panels: [gp(TRI, { es: ek([[0, 1], [0, 2]], 'done'), st: { 0: 'active' }, label: 'shortest paths from A · total 2.5' })] },
      ],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Three conditions, then pick by input',
      lines: ['Undirected, connect every node, pay once per edge for the smallest **total**.', 'Then the input shape picks the algorithm.'],
      frames: (() => {
        const rows = [['edge list, sparse', 'Kruskal'], ['adj list / matrix', 'heap Prim'], ['complete graph', 'dense Prim'], ['want a forest', 'Kruskal'], ['per-node cost', 'virtual node']];
        const first = { say: 0, note: 'Check: undirected? connect all? pay per edge, minimise the total?', panels: [table(['undirected', 'connect all', 'sum of edges'], ['ok?'], [['yes'], ['yes'], ['yes']], [['done'], ['done'], ['done']])] };
        return [first, ...rows.map((r, k) => ({ say: 1, note: `${r[0]} → ${r[1]}`, panels: [table(rows.map((x) => x[0]), ['use'], rows.map((x, i) => [i <= k ? x[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))] }))];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: islands',
      lines: ['The graph may be **disconnected**.', 'You want one cheapest tree per piece.'],
      panels: [gp(FO)],
      task: {
        type: 'choose',
        question: 'Which choice fits?',
        options: [
          { text: 'Kruskal with no early stop (a forest)', why: '' },
          { text: 'Dense Prim with arrays', why: 'That row is for complete graphs where every pair has a cost.' },
          { text: 'Prim from node 0, once', why: 'One Prim run grows one tree; it never reaches the other piece.' },
        ],
        answer: 0,
      },
      solved: 'Possibly disconnected, want a forest → Kruskal without the early exit.',
    },
    {
      kind: 'turn',
      title: 'Your turn: one-way pipes',
      lines: ['Water may flow along each pipe in **one direction only**.'],
      panels: [{ ...gp(DC), directed: true }],
      task: {
        type: 'choose',
        question: 'Is this a plain MST problem?',
        options: [
          { text: 'No — MST needs an undirected graph', why: '' },
          { text: 'Yes — use Kruskal', why: 'Condition 1 fails: a pipe does not work both ways.' },
          { text: 'Yes — use Prim', why: 'Prim, like Kruskal, assumes undirected edges.' },
        ],
        answer: 0,
      },
      solved: 'Condition 1 is "undirected". One-way edges rule MST out.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Four questions while reading',
      lines: ['Pay once per edge, summed? → **MST**.', 'Everything must be connected? → **spanning tree**.', 'A per-node alternative cost? → **virtual node**.', 'Asks about ALL minimum trees? → **edge classification**.'],
      frames: (() => {
        const rows = [['pay per edge?', 'MST'], ['connect all?', 'spanning'], ['per-node cost?', 'virtual node'], ['all MSTs?', 'classify']];
        return rows.map((r, k) => ({ say: k, note: `${r[0]} yes → ${r[1]}`, panels: [table(rows.map((x) => x[0]), ['if yes'], rows.map((x, i) => [i <= k ? x[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: generator or cable',
      lines: ['Each office can install its own generator (its own price),', 'or run a cable to an office that has power.'],
      panels: [table(['office 1', 'office 2', 'office 3'], ['generator'], [[5], [2], [7]], undefined, 'own cost per office')],
      task: {
        type: 'choose',
        question: 'Which idea does this call for?',
        options: [
          { text: 'MST with a virtual node', why: '' },
          { text: 'Edge classification', why: 'Nothing asks about all minimum trees — just one cheapest plan.' },
          { text: 'Shortest path from office 1', why: 'Every office must get power; we pay for the whole network.' },
        ],
        answer: 0,
      },
      solved: 'Per-node cost + per-edge cost → virtual node, then MST.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the essential links',
      lines: ['"Which links appear in **every** cheapest network?"'],
      panels: [ecg()],
      task: {
        type: 'choose',
        question: 'Which question from the list is this?',
        options: [
          { text: 'It asks about ALL minimum trees → edge classification', why: '' },
          { text: 'Per-node cost → virtual node', why: 'No node has its own price here.' },
          { text: 'Just build one MST and report its edges', why: 'With ties, one MST can hold edges that other MSTs skip.' },
        ],
        answer: 0,
      },
      solved: '"In every MST" = critical edges → classify edges.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'The cut property',
      lines: ['Split the nodes into S and the rest.', 'Edges with one end on each side **cross** the cut.', 'The cheapest crossing edge belongs to some MST.'],
      frames: [
        { say: 0, note: 'S = {A, C} (shaded); the rest = {B, D, E}.', panels: [vg({ st: hl(S1, 'visited') }), vars({ S: '{A,C}' })] },
        { say: 1, note: `Crossing: ${X1.map((e) => ew(V, e)).join(', ')}. A–C is inside S.`, panels: [vg({ st: hl(S1, 'visited'), es: ek(X1, 'active') }), vars({ crossing: X1.length })] },
        { say: 2, note: `Cheapest crossing edge: ${ew(V, X1min)}.`, panels: [vg({ st: hl(S1, 'visited'), es: { ...ek(X1, 'muted'), [key(X1min[0], X1min[1])]: 'done' } }), vars({ cheapest: X1min[2] })] },
        { say: 2, note: `And ${en(V, X1min)} is in the village MST.`, panels: [villageTree(VMST), vars({ total: VK.total })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The exchange argument',
      lines: ['Suppose an MST T skips the cheapest crossing edge e.', "T's path from u to v crosses the cut at some edge f.", 'Add e, remove f: still a spanning tree T\'.', "w(T') = w(T) − w(f) + w(e) ≤ w(T)."],
      frames: [
        { say: 0, note: 'Cut S = {A, B}. Crossing: B–C 2 and A–D 2. Take e = B–C.', panels: [sqg({ st: hl([0, 1], 'visited'), es: ek([[1, 2], [0, 3]], 'active') }), vars({ e: 'B–C' })] },
        { say: 0, note: `T = A–B, C–D, A–D: an MST (weight ${weight(SQ_T)}) without e.`, panels: [sqg({ st: hl([0, 1], 'visited'), es: ek(SQ_T, 'done') }), vars({ 'w(T)': weight(SQ_T) })] },
        { say: 1, note: 'T\'s path B → A → D → C. It leaves S at f = A–D.', panels: [sqg({ st: hl([0, 1], 'visited'), es: { ...ek(SQ_T, 'active'), '0-3': 'bad' } }), vars({ f: 'A–D' })] },
        { say: 2, note: 'Add e (a cycle appears), remove f: connected, 3 edges, a tree.', panels: [sqg({ st: hl([0, 1], 'visited'), es: { ...ek(SQ_T2, 'done'), '0-3': 'muted' } }), vars({ edges: SQ_T2.length })] },
        { say: 3, note: `${weight(SQ_T)} − ${SQ_F[2]} + ${SQ_E[2]} = ${weight(SQ_T2)} ≤ ${weight(SQ_T)}. T' is also minimum, and holds e.`, panels: [sqg({ es: ek(SQ_T2, 'done') }), vars({ "w(T')": weight(SQ_T2), 'w(T)': weight(SQ_T) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: cheapest across the cut',
      lines: ['S = {B, D}, shaded.', 'Find the cheapest edge with exactly one end in S.'],
      panels: [vg({ st: hl(S2, 'visited') }), sortedArr(V, VK, -1, { label: 'edges by weight' })],
      task: {
        type: 'cell',
        panel: 1,
        question: 'Which edge does the cut property say is safe?',
        answer: S2idx,
        hints: { 0: 'A–C has both ends outside S: it does not cross.', 2: 'D–E crosses, but B–C is cheaper.', 3: 'A–B crosses, but B–C is cheaper.', 4: 'B–D has both ends inside S.', 5: 'C–D crosses, but it is the most expensive.' },
      },
      solved: `Crossing: ${X2.map((e) => ew(V, e)).join(', ')}. Cheapest: ${ew(V, X2min)}.`,
      then: [{ say: 1, note: 'Four crossing edges; B–C wins.', panels: [vg({ st: hl(S2, 'visited'), es: { ...ek(X2, 'muted'), [key(X2min[0], X2min[1])]: 'done' } })] }],
    },
    {
      kind: 'watch',
      title: 'Kruskal and Prim pick different cuts',
      lines: ['**Kruskal**: S = a component holding one end of the cheapest remaining edge.', '**Prim**: S = the nodes already in its tree.', '**Cycle property**: the strictly heaviest edge on a cycle is in no MST.'],
      frames: [
        { say: 0, note: 'Kruskal at B–D: components {A,B,C} and {D,E}. S = {A,B,C}.', panels: [vg({ st: hl([0, 1, 2], 'visited'), es: { ...ek([[0, 2], [1, 2], [3, 4]], 'done'), '0-1': 'muted', '1-3': 'active' } })] },
        { say: 1, note: 'Prim with tree {A, C}: crossing edges A–B 4, B–C 2, C–D 8. Take B–C.', panels: [vg({ st: hl([0, 2], 'done'), es: { '0-2': 'done', '0-1': 'active', '2-3': 'active', '1-2': 'done' } })] },
        { say: 2, note: 'Cycle A-B-C: weights 4, 1, 2. A–B 4 is strictly heaviest → in no MST.', panels: [vg({ st: hl([0, 1, 2], 'active'), es: { '0-2': 'active', '1-2': 'active', '0-1': 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the cycle property',
      lines: ['Look at the cycle B-C-D.'],
      panels: [vg({ st: hl([1, 2, 3], 'active'), es: ek([[1, 2], [2, 3], [1, 3]], 'active') })],
      task: {
        type: 'choose',
        question: 'Which edge of B-C-D is in no MST?',
        options: [
          { text: 'C–D 8', why: '' },
          { text: 'B–D 5', why: 'Not the heaviest on this cycle: C–D (8) is.' },
          { text: 'B–C 2', why: 'The lightest edge of a cycle is never the one the cycle property drops.' },
        ],
        answer: 0,
      },
      solved: 'C–D 8 is the strictly heaviest edge on B-C-D → dropped from every MST.',
      then: [{ say: 0, note: 'Drop C–D: B-C-D stays connected through B.', panels: [villageTree(VMST, { '2-3': 'bad' })] }],
    },
  ],

  'brute-force': [
    {
      kind: 'turn',
      title: 'Your turn: how many subsets?',
      lines: ['Brute force tries every subset of **n − 1** edges.', 'There are C(m, n − 1) of them.'],
      panels: [vg(), vars({ n: 5, m: 6 })],
      task: { type: 'number', question: 'How many 4-edge subsets of these 6 roads would it try?', options: [6, 15, 24, 30], answer: choose(6, 4), hint: 'C(6, 4) = 6·5·4·3 / 4!.' },
      solved: `${choose(6, 4)} subsets; only ${VSUB} are spanning trees. Real graphs make this astronomical.`,
    },
    {
      kind: 'watch',
      title: 'Kruskal with a DFS check',
      lines: ['Sort edges, cheapest first.', 'For each edge: DFS over chosen edges — is v already reachable from u?', 'Reachable → would close a cycle → skip. Else keep it.'],
      frames: [
        { say: 0, note: 'Sorted: ' + VK.sorted.map((e) => ew(V, e)).join(', ') + '.', panels: [vg(), vars({ total: 0, used: 0 })] },
        ...SLOW.ev.map((e, k) => {
          const chosen = SLOW.ev.slice(0, k).filter((x) => !x.found).map((x) => x.e);
          return {
            say: e.found ? 2 : 1,
            note: `${ew(V, e.e)}: DFS from ${V.L[e.e[0]]} sees {${e.seen.map((i) => V.L[i]).join(',')}}. ` + (e.found ? `${V.L[e.e[1]]} reached → skip.` : `${V.L[e.e[1]]} not reached → keep.`),
            panels: [vg({ st: { ...hl(e.seen, 'visited'), [e.e[0]]: 'active', [e.e[1]]: e.found ? 'bad' : 'active' }, es: { ...ek(chosen, 'done'), [key(e.e[0], e.e[1])]: e.found ? 'bad' : 'active' } }), vars({ total: e.total, used: e.used, dfs: k + 1 })],
          };
        }),
      ],
    },
    {
      kind: 'watch',
      title: 'Reverse-delete',
      lines: ['Sort edges from most to least expensive.', 'Delete an edge if the graph stays connected without it.', 'Each check is a BFS/DFS: O(m · (n + m)) in total.'],
      frames: [
        { say: 0, note: 'Order: ' + RD.ev.map((x) => ew(V, x.e)).join(', ') + '.', panels: [vg()] },
        { say: 1, note: 'C–D 8: B still links C and D → delete.', panels: [gp(V, { edges: RD.ev[0].keep, es: {}, st: hl([2, 3], 'active') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: delete B–D?',
      lines: ['C–D is gone. Next is B–D 5.'],
      panels: [gp(V, { edges: RD.ev[0].keep, es: { '1-3': 'active' } })],
      task: {
        type: 'choose',
        question: 'Does reverse-delete remove B–D?',
        options: [
          { text: 'No — without it, {D, E} is cut off', why: '' },
          { text: 'Yes — it is the heaviest edge left', why: 'Heaviest is not enough: deletion needs the graph to stay connected.' },
          { text: 'Yes — D still has the edge D–E', why: 'D–E only reaches E; nothing then links D or E to A, B, C.' },
        ],
        answer: 0,
      },
      solved: 'B–D stays: it is the only link left between {A,B,C} and {D,E}.',
      then: RD.ev.slice(1).map((x) => ({
        say: x.del ? 1 : 2,
        note: `${ew(V, x.e)}: ${x.del ? 'still connected without it → delete.' : 'needed for connectivity → keep.'}`,
        panels: [gp(V, { edges: x.keep, es: x.del ? {} : { [key(x.e[0], x.e[1])]: 'active' } }), vars({ kept: weight(x.keep) })],
      })),
    },
  ],

  'optimized-kruskal': [
    {
      kind: 'watch',
      title: 'Sort, then union or skip',
      lines: ['Sort all edges by weight, cheapest first.', 'Union Find: every node starts as its own component.', '`find(u) !== find(v)` → accept, add w, union. Else skip.', 'Stop at n − 1 accepted edges.'],
      frames: [
        { say: 0, note: 'Sorted edge list.', panels: [vg(), sortedArr(V, VK, -1)] },
        { say: 1, note: 'parent[x] = x: five components.', panels: [vg(), sortedArr(V, VK, -1), parentArr(V, UF(5).parent)] },
        ...kFrames(V, VK, (e) => (e.used === 4 ? 3 : 2), (e, cur) => (e.ok ? `${ew(V, cur)}: different roots → accept. total ${e.total}.` : `${ew(V, cur)}: same root → skip (cycle).`) + (e.used === 4 && e.ok ? ' used = 4 = n − 1 → stop.' : '')),
      ],
    },
    {
      kind: 'watch',
      title: 'Why each accepted edge is safe',
      lines: ['Edge e = (u, v) arrives with u, v in different components. Let S = u\'s component.', 'Every cheaper edge was accepted (inside a component) or skipped (both ends together).', 'So no cheaper edge crosses S: e is the cheapest crossing edge.'],
      frames: [
        { say: 0, note: 'B–D 5 arrives. B is in {A,B,C}; D is in {D,E}. S = {A,B,C}.', panels: [vg({ st: hl([0, 1, 2], 'visited'), es: { ...ek([[0, 2], [1, 2], [3, 4]], 'done'), '0-1': 'muted', '1-3': 'active' } })] },
        { say: 1, note: 'Cheaper edges: A–C, B–C, D–E accepted; A–B skipped. None leaves S.', panels: [vg({ st: hl([0, 1, 2], 'visited'), es: { ...ek([[0, 2], [1, 2], [3, 4], [0, 1]], 'visited'), '1-3': 'active' } })] },
        { say: 2, note: 'Crossing S: B–D 5 and C–D 8. B–D is the cheapest → safe.', panels: [vg({ st: hl([0, 1, 2], 'visited'), es: { ...ek([[0, 2], [1, 2], [3, 4]], 'done'), '1-3': 'done', '2-3': 'muted' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: run Kruskal',
      lines: ['A new graph. Walk the sorted edges.'],
      panels: [g2(), sortedArr(G2, G2K, -1)],
      task: { type: 'order', question: 'Tap the edges Kruskal accepts, in order.', items: G2ACC, hint: 'Cheapest first; skip any edge whose ends are already joined.' },
      solved: `${G2ACC.join(', ')}: 4 edges, total ${G2K.total}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the first skip',
      lines: ['Same graph, same sorted list.'],
      panels: [sortedArr(G2, G2K, -1), g2()],
      task: {
        type: 'cell',
        question: 'Which sorted edge is the first one Kruskal skips?',
        answer: G2REJ,
        hints: { 0: 'Q–R is the cheapest edge: always accepted.', 1: 'P and Q are still apart when P–Q comes.', 3: 'S is still alone when R–S comes.', 4: 'By S–T an earlier edge has already been skipped.' },
      },
      solved: 'P–R: Q–R and P–Q already join P and R.',
      then: kFrames(G2, G2K, (e) => (e.ok ? 2 : 2), (e, cur) => (e.ok ? `${ew(G2, cur)}: accept, total ${e.total}.` : `${ew(G2, cur)}: same root → skip.`) + (e.used === 4 && e.ok ? ' n − 1 edges → stop.' : '')),
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Sort descending → maximum spanning tree',
      lines: ['Same loop, comparator flipped: `b[2] - a[2]`.', 'The most expensive edges that join components win.'],
      frames: [
        { say: 0, note: 'Descending order.', panels: [vg(), sortedArr(V, VMAX, -1, { label: 'sorted (descending)' })] },
        ...VMAX.ev.map((e, k) => {
          const cur = VMAX.sorted[e.i];
          const acc = VMAX.ev.slice(0, k + 1).map((x) => VMAX.sorted[x.i]);
          return { say: 1, note: `${ew(V, cur)}: joins two components → take it. total ${e.total}${e.used === 4 ? ', used 4 → stop' : ''}.`, panels: [vg({ es: { ...ek(acc, 'done'), [key(cur[0], cur[1])]: 'active' }, label: `total ${e.total}` }), sortedArr(V, VMAX, e.i, { label: 'sorted (descending)' })] };
        }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: two islands',
      lines: ['n = 6, but the graph has two pieces.', 'Forest version: **no early exit**, return the total always.'],
      panels: [gp(FO), sortedArr(FO, FOF, -1)],
      task: { type: 'number', question: 'What does the forest version return?', options: [-1, 9, 12, 15], answer: FOF.total, hint: 'Each piece gets its own MST; add both.' },
      solved: `{0,1,2}: 2 + 3 = 5. {3,4,5}: 1 + 6 = 7. Total ${FOF.total}. The plain template returns ${FOT.ans} (only ${FOT.used} of 5 edges).`,
      then: [{ say: 1, note: `Forest: ${FOF.used} edges, uf.count = ${FOF.count} components.`, panels: [gp(FO, { es: { ...ek(FOF.ev.filter((e) => e.ok).map((e) => FOF.sorted[e.i]), 'done'), ...ek(FOF.ev.filter((e) => !e.ok).map((e) => FOF.sorted[e.i]), 'muted') } }), vars({ total: FOF.total, count: FOF.count })] }],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Connecting Cities: nodes 1..n',
      lines: ['Sort with a comparator.', '`new UnionFind(n + 1)`: index 0 is unused.', 'Return as soon as n − 1 edges are used.'],
      frames: [
        { say: 0, note: 'n = 3. Sorted: ' + CCR.sorted.map((e) => ew(CC, e)).join(', ') + '.', panels: [gp(CC, { st: { 0: 'hidden' } }), arr(CCR.sorted.map((e) => ew(CC, e)), { label: 'sorted', showIndices: false })] },
        { say: 1, note: 'parent has n + 1 = 4 cells; cell 0 is never used.', panels: [gp(CC, { st: { 0: 'hidden' } }), arr(UF(4).parent, { label: 'parent', highlights: { 0: 'muted' } })] },
        ...CCR.ev.map((e, k) => ({
          say: k === CCR.ev.length - 1 ? 2 : 1,
          note: `${ew(CC, e.e)}: union → total ${e.total}, used ${e.used}` + (e.used === 2 ? ' = n − 1 → return 6.' : '.'),
          panels: [gp(CC, { st: { 0: 'hidden' }, es: { ...ek(CCR.ev.slice(0, k + 1).map((x) => x.e), 'done') } }), arr(e.parent, { label: 'parent', highlights: { 0: 'muted', [e.e[0]]: 'active', [e.e[1]]: 'active' } })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the default sort',
      lines: ['`.sort()` with no comparator compares arrays as **strings**.', '"1,2,9" vs "0,1,10".'],
      panels: [arr(DS.map((e) => `${e[0]}-${e[1]} w${e[2]}`), { label: 'before .sort()' })],
      task: { type: 'cell', question: 'Which edge does `.sort()` put first?', answer: 1, hints: { 0: 'By weight it should be first — but the string "1,2,9" is larger than "0,1,10".' } },
      solved: 'The weight-10 edge moves first: "0,1,10" < "1,2,9" as strings.',
      then: [
        { say: 0, note: '`.sort()`: string order, wrong for weights.', panels: [arr(DSS.map((e) => `${e[0]}-${e[1]} w${e[2]}`), { label: 'after .sort()', highlights: { 0: 'bad' } })] },
        { say: 0, note: '`.sort((a, b) => a[2] - b[2])`: weight 9 first.', panels: [arr([...DS].sort((a, b) => a[2] - b[2]).map((e) => `${e[0]}-${e[1]} w${e[2]}`), { label: 'with comparator', highlights: { 0: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: not enough roads',
      lines: ['n = 4, connections [1,2,3], [2,3,4], [1,3,5].'],
      panels: [gp({ L: ['1', '2', '3', '4'], E: [[0, 1, 3], [1, 2, 4], [0, 2, 5]], P: [[0, 0], [1.6, 0], [0.8, 1.3], [2.6, 1.3]] })],
      task: { type: 'number', question: 'What does minimumCost return?', options: [-1, 0, 7, 12], answer: CCD.ans, hint: 'Count successful unions. Is it n − 1 = 3?' },
      solved: 'Only 2 unions succeed: [1,3,5] closes a cycle and city 4 has no road. The loop ends, n ≠ 1 → -1.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Kruskal on the villages',
      lines: ['Walk the sorted edges; compare find(u) and find(v).', 'Same group → skip: it would close a cycle.', 'Different groups → accept, union, add w.'],
      frames: [{ say: 0, note: 'A=0 B=1 C=2 D=3 E=4. Five groups.', panels: [vg(), sortedArr(V, VK, -1), parentArr(V, UF(5).parent)] }, ...dryFrames.slice(0, 4)],
    },
    {
      kind: 'turn',
      title: 'Your turn: B–D',
      lines: ['Groups now: {A,B,C} and {D,E}. total 6, used 3.'],
      panels: dryFrames[3].panels,
      task: { type: 'number', question: 'B–D 5 is next. What is the total after it?', options: [6, 8, 11, 14], answer: VK.ev[4].total, hint: '{A,B,C} ≠ {D,E}: accept and add 5.' },
      solved: `6 + 5 = ${VK.ev[4].total}, used 4 = n − 1 → stop.`,
      then: [dryFrames[4]],
    },
    {
      kind: 'turn',
      title: 'Your turn: C–D',
      lines: ['The early exit left C–D 8 unexamined.'],
      panels: [villageTree(VMST, { '2-3': 'muted' }), sortedArr(V, VK, 4, { cur: false })],
      task: {
        type: 'choose',
        question: 'Without the early exit, what would happen to C–D?',
        options: [
          { text: 'Rejected: C and D are already in one group', why: '' },
          { text: 'Accepted: it is the last edge', why: 'Last does not mean needed; find(C) === find(D) after B–D.' },
          { text: 'The total would become 19', why: 'C–D is never added: its union returns false.' },
        ],
        answer: 0,
      },
      solved: 'C–D would be rejected anyway. Total stays 11.',
    },
  ],

  'optimized-prim': [
    {
      kind: 'watch',
      title: 'Grow one tree with a heap',
      lines: ['Push `[0, start]`.', 'Pop the cheapest `[w, u]`. Already in the tree → **stale**, skip.', 'Else add u, add w to the total.', 'Push `[weight(u, v), v]` for each neighbour v not in the tree.', 'Stop at n nodes.'],
      frames: [
        { say: 0, note: 'Start at P: heap = [0, P].', panels: [g2(), heapP(G2, [[0, 0]])] },
        ...primFrames(G2, G2P, (e) => (e.stale ? 1 : e.count === 5 ? 4 : 3)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: start from T',
      lines: ['Same graph, now start at T.'],
      panels: [g2({ st: { 4: 'active' } }), heapP(G2, [[0, 4]])],
      task: { type: 'order', question: 'Tap the nodes in the order they join the tree.', items: G2T_ORDER, hint: 'Each time, the cheapest edge leaving the tree so far.' },
      solved: `${G2T_ORDER.join(' → ')}, total ${G2T.total} — the same weight as from P.`,
    },
    {
      kind: 'watch',
      title: 'Prim vs Dijkstra: one line apart',
      lines: ['Prim pushes `[wt, v]`: the edge alone.', 'Dijkstra pushes `[dist[u] + wt, v]`: the whole path.'],
      frames: [
        { say: 0, note: 'Pop A. Both push [4, B] and [1, C] (dist[A] = 0).', panels: [vg({ st: { 0: 'done', 1: 'visited', 2: 'visited' }, es: ek([[0, 1], [0, 2]], 'active') }), heapP(V, VP.ev[0].heap, 'Prim heap'), heapP(V, VD.ev[0].heap, 'Dijkstra heap')] },
        { say: 0, note: 'Pop C. Prim pushes B with the edge weight: [2, B].', panels: [vg({ st: { 0: 'done', 2: 'active', 1: 'visited' }, es: { '0-2': 'done', '1-2': 'active' } }), que(['2·B', '4·B'], 'B entries · Prim'), vars({ 'C–B': 2 })] },
        { say: 1, note: `Dijkstra pushes B with 1 + 2 = ${DIJ_B}: [${DIJ_B}, B].`, panels: [vg({ st: { 0: 'done', 2: 'active', 1: 'visited' }, es: { '0-2': 'done', '1-2': 'active' } }), que([`${DIJ_B}·B`, '4·B'], 'B entries · Dijkstra'), vars({ 'dist[C]': 1, 'C–B': 2 })] },
      ],
    },
    {
      kind: 'turn',
      title: "Your turn: Dijkstra's D",
      lines: ['Still at the pop of C. dist[C] = 1, edge C–D = 8.'],
      panels: [vg({ st: { 0: 'done', 2: 'active', 3: 'visited' }, es: { '0-2': 'done', '2-3': 'active' } }), vars({ 'dist[C]': 1, 'C–D': 8 })],
      task: { type: 'number', question: 'Dijkstra pushes D with which priority?', options: [1, 8, 9, 13], answer: DIJ_D, hint: 'Dijkstra: dist[u] + wt.' },
      solved: `Dijkstra: 1 + 8 = ${DIJ_D}. Prim pushes [8, D] — the edge weight alone.`,
    },
  ],

  'dry-run-prim': [
    {
      kind: 'watch',
      title: 'Prim from A on the villages',
      lines: ['Pop the cheapest entry. Not in the tree → add it, push its edges.', 'Already in the tree → stale, skip.', 'Stop when all 5 nodes are in.'],
      frames: [{ say: 0, note: 'Heap = [0, A].', panels: [vg(), heapP(V, [[0, 0]])] }, ...primFrames(V, VP, (e) => (e.stale ? 1 : e.count === 5 ? 2 : 0)).slice(0, 3)],
    },
    {
      kind: 'turn',
      title: 'Your turn: pop [4, B]',
      lines: ['Tree = {A, C, B}. The heap top is [4, B].'],
      panels: primFrames(V, VP, () => 0)[2].panels,
      task: {
        type: 'choose',
        question: 'What does Prim do with [4, B]?',
        options: [
          { text: 'Skip it: B is already in the tree (stale)', why: '' },
          { text: 'Add 4 to the total', why: 'B joined via [2, B]. Adding 4 would pay for B twice.' },
          { text: 'Push B\'s neighbours again', why: 'B\'s edges were pushed when B joined; a stale entry does nothing.' },
        ],
        answer: 0,
      },
      solved: '[4, B] is stale: a cheaper edge (2) got B there first. Total stays 3.',
      then: primFrames(V, VP, (e) => (e.stale ? 1 : e.count === 5 ? 2 : 0)).slice(3),
    },
    {
      kind: 'turn',
      title: 'Your turn: left in the heap',
      lines: ['E joined: 5 nodes, the loop stops. Total 11.'],
      panels: [villageTree(VP.tree), vars({ total: VP.total, count: VP.count })],
      task: {
        type: 'choose',
        question: 'Which entry is still in the heap when Prim stops?',
        options: [
          { text: '[8, D]', why: '' },
          { text: '[5, D]', why: '[5, D] was popped: that is how D joined.' },
          { text: '[4, B]', why: '[4, B] was popped and skipped as stale.' },
          { text: 'None — the heap is empty', why: 'The loop stops at count === n, not only on an empty heap.' },
        ],
        answer: 0,
      },
      solved: '[8, D] (via C) was never popped: count reached n first.',
    },
  ],

  'optimized-prim-dense': [
    {
      kind: 'watch',
      title: 'minCost[] instead of a heap',
      lines: ['`minCost[v]` = cheapest edge from the tree to v. Infinity at first.', 'Each round: **scan** outside nodes for the smallest minCost, add it.', '**Relax**: can the new node attach each outside node more cheaply?'],
      frames: [
        { say: 0, note: `5 points, cost = Manhattan distance. A complete graph: ${K5} pairs, none stored.`, panels: [gp(PG, { label: 'points' }), arr(['0', '∞', '∞', '∞', '∞'], { label: 'minCost' })] },
        dpFrame2(DP.ev[0], 2, `Round 1: pick 0 (minCost 0). Relax: ${relNote(DP.ev[0])}.`),
        dpFrame2(DP.ev[1], 1, `Round 2: scan → 1 (minCost ${DP.ev[1].before[1]}), total ${DP.ev[1].total}. Relax: ${relNote(DP.ev[1])}.`),
        dpFrame2(DP.ev[2], 1, `Round 3: scan → 3 (minCost ${DP.ev[2].before[3]}), total ${DP.ev[2].total}. Relax: ${relNote(DP.ev[2])}.`),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: round 4 scan',
      lines: ['Tree = {0, 1, 3}. Scan the outside nodes.'],
      panels: [arr(DP.ev[2].minCost.map(f), { label: 'minCost', highlights: hl([0, 1, 3], 'muted') }), dpFrame2(DP.ev[2], 1, '-').panels[0]],
      task: { type: 'cell', question: 'Which node does round 4 pick?', answer: DP.ev[3].u, hints: { 0: '0 is already in the tree.', 1: '1 is already in the tree.', 2: 'minCost[2] = 9, but minCost[4] = 4 is smaller.', 3: '3 is already in the tree.' } },
      solved: `Node 4: minCost 4 is the smallest outside. Total ${DP.ev[3].total}.`,
      then: [dpFrame2(DP.ev[3], 2, `Round 4: add 4. Relax: ${relNote(DP.ev[3])}.`), dpFrame2(DP.ev[4], 1, `Round 5: add 2 (minCost 9). Total ${DP.total}.`)],
    },
    {
      kind: 'turn',
      title: 'Your turn: pairs in a complete graph',
      lines: ['A complete graph on n nodes has n(n−1)/2 edges.', 'Dense Prim never stores them: it computes each distance when relaxing.'],
      panels: [gp(PG, { label: '5 points' }), vars({ n: 5 })],
      task: { type: 'number', question: 'How many edges does the complete graph on these 5 points have?', options: [5, 10, 20, 25], answer: K5, hint: '5 · 4 / 2.' },
      solved: `${K5} edges. Dense Prim: n rounds × O(n) = O(n²) time, O(n) memory.`,
    },
  ],

  'optimized-virtual-node': [
    {
      kind: 'watch',
      title: 'A well becomes an edge',
      lines: ['Houses 1..3: wells cost 1, 2, 2. Pipes 1–2 and 2–3 cost 1.', 'Invent node 0, the water source. Well at i = edge 0–i of weight wells[i].', 'Run Kruskal on n + 1 = 4 nodes; stop at n = 3 edges.'],
      frames: [
        { say: 0, note: 'Pipes only: no edge says "build a well".', panels: [gp(vnG(VN1.run), { st: { 0: 'hidden' }, label: 'houses 1..3' })] },
        { say: 1, note: 'Node 0 with edges 0–1 (1), 0–2 (2), 0–3 (2).', panels: [gp(vnG(VN1.run), { label: 'node 0 = water source', st: { 0: 'active' }, es: ek([[0, 1], [0, 2], [0, 3]], 'active') }), arr(VN1.run.sorted.map((e) => `${e[0]}-${e[1]} ${e[2]}`), { label: 'sorted', showIndices: false })] },
        ...VN1.run.ev.map((e, k) => {
          const cur = VN1.run.sorted[e.i];
          return { say: 2, note: `${cur[0]}–${cur[1]} ${cur[2]}: accept, total ${e.total}` + (e.used === 3 ? ', used 3 → stop.' : '.'), panels: [gp(vnG(VN1.run), { es: { ...ek(VN1.run.ev.slice(0, k + 1).map((x) => VN1.run.sorted[x.i]), 'done') } }), arr(VN1.run.sorted.map((x) => `${x[0]}-${x[1]} ${x[2]}`), { label: 'sorted', showIndices: false, highlights: Object.fromEntries(VN1.run.ev.slice(0, k + 1).map((x) => [x.i, 'done'])) })] };
        }),
        { say: 2, note: 'Edge 0–1 = a well at house 1. Pipes carry water to 2 and 3. Total 3.', panels: [gp(vnG(VN1.run), { es: ek(VN1.run.ev.map((x) => VN1.run.sorted[x.i]), 'done'), st: { 0: 'active', 1: 'done' } }), vars({ wells: 1, pipes: 2, total: VN1.run.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: cheap wells, dear pipe',
      lines: ['Wells cost 1, 8, 2. Pipes: 1–2 costs 3, 2–3 costs 9.', 'Edges 0–i carry the well prices.'],
      panels: [gp(vnG(VN2.run)), arr(VN2.run.sorted.map((e) => `${e[0]}-${e[1]} ${e[2]}`), { label: 'sorted', showIndices: false })],
      task: { type: 'number', question: 'Minimum total cost?', options: [6, 10, 12, 13], answer: VN2.run.ans, hint: 'Kruskal on 4 nodes: take 3 edges, cheapest first, skipping cycles.' },
      solved: `0–1 (1) + 0–3 (2) + 1–2 (3) = ${VN2.run.ans}.`,
      then: [{ say: 2, note: 'Two edges touch node 0 → two wells (houses 1 and 3), plus pipe 1–2.', panels: [gp(vnG(VN2.run), { es: { ...ek(VN2_ACC, 'done'), ...ek(VN2.run.sorted.filter((e) => !VN2_ACC.includes(e)), 'muted') }, st: { 0: 'active', 1: 'done', 3: 'done' } }), vars({ wells: 2, total: VN2.run.ans })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many edges?',
      lines: ['n houses plus the source node 0.'],
      panels: [gp(vnG(VN2.run)), vars({ houses: 3 })],
      task: {
        type: 'choose',
        question: 'With n = 3 houses, when does Kruskal stop?',
        options: [
          { text: 'After 3 edges (n + 1 nodes − 1)', why: '' },
          { text: 'After 2 edges (n − 1)', why: 'Node 0 counts too: 4 nodes need 3 edges.' },
          { text: 'After 4 edges', why: '4 edges on 4 nodes always close a cycle.' },
        ],
        answer: 0,
      },
      solved: 'UnionFind(n + 1), stop at n edges.',
    },
  ],

  'optimized-edge-classification': [
    {
      kind: 'watch',
      title: 'Is the MST unique? Weight groups',
      lines: ['Take edges in groups of equal weight.', 'First count **candidates**: ends in different components, before any union.', 'Then union them and count **successes**.', 'candidates > successes → more than one MST.'],
      frames: [
        { say: 0, note: 'Five nodes, seven edges, several ties.', panels: [ecg(), ecArr()] },
        ...GR.map((g, k) => {
          const rows = GR.slice(0, k + 1);
          const done = EC.E.slice(0, g.to + 1);
          return {
            say: g.cand > g.succ ? 3 : k === 0 ? 1 : 2,
            note: `w = ${g.w}: candidates ${g.cand}, successes ${g.succ}.` + (g.cand > g.succ ? ' More candidates → a choice → not unique.' : ''),
            panels: [
              ecArr({ ...hl(Array.from({ length: g.from }, (_, i) => i), 'muted'), ...hl(Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i), g.cand > g.succ ? 'bad' : 'active') }),
              table(rows.map((r) => `w = ${r.w}`), ['cand', 'succ'], rows.map((r) => [r.cand, r.succ]), rows.map((r) => (r.cand > r.succ ? ['bad', 'bad'] : ['done', 'done']))),
              ecg({ es: ek(done.filter((e, i) => MY.includes(i)), 'done') }),
            ],
          };
        }),
      ],
    },
    {
      kind: 'watch',
      title: 'Critical and pseudo-critical',
      lines: [`best = MST weight = ${BEST}.`, '**Critical**: banning the edge makes the MST heavier (or impossible).', '**Pseudo-critical**: not critical, and forcing it still gives `best`.', 'Otherwise: in no MST.'],
      frames: (() => {
        const lab = EC.E.map((e) => `${e[0]}–${e[1]}`);
        const fr = [{ say: 0, note: `Kruskal on the pre-sorted list: total ${BEST}.`, panels: [ecg({ es: ek(MY.map((i) => EC.E[i]), 'done') }), ecArr(hl(MY, 'done'))] }];
        for (const i of [0, 2, 6]) {
          const r = ECR[i];
          const e = EC.E[i];
          if (r.cls === 'critical')
            fr.push({ say: 1, note: `Ban ${lab[i]}: best becomes ${f(r.ban)} > ${BEST} → critical.`, panels: [ecg({ es: { ...ek(r.banAcc.map((j) => EC.E[j]), 'done'), [key(e[0], e[1])]: 'bad' } }), ecArr({ [i]: 'bad', ...hl(r.banAcc, 'done') })] });
          else {
            fr.push({ say: 2, note: `Ban ${lab[i]}: still ${f(r.ban)} → not critical.`, panels: [ecg({ es: { ...ek(r.banAcc.map((j) => EC.E[j]), 'done'), [key(e[0], e[1])]: 'muted' } }), ecArr({ [i]: 'muted', ...hl(r.banAcc, 'done') })] });
            fr.push({ say: r.cls === 'pseudo' ? 2 : 3, note: `Force ${lab[i]}: ${r.force}${r.cls === 'pseudo' ? ` = ${BEST} → pseudo-critical.` : ` > ${BEST} → in no MST.`}`, panels: [ecg({ es: { ...ek(r.forceAcc.map((j) => EC.E[j]), 'done'), [key(e[0], e[1])]: r.cls === 'pseudo' ? 'active' : 'bad' } }), ecArr({ ...hl(r.forceAcc, 'done'), [i]: r.cls === 'pseudo' ? 'active' : 'bad' })] });
          }
        }
        fr.push({ say: 3, note: 'All seven edges classified.', panels: [table(lab.slice(0, 4), ['ban', 'force', 'class'], ECR.slice(0, 4).map((r) => [f(r.ban), r.force, r.cls])), table(lab.slice(4), ['ban', 'force', 'class'], ECR.slice(4).map((r) => [f(r.ban), r.force, r.cls]))] });
        return fr;
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: not in MY MST',
      lines: ['My Kruskal MST used 0–1, 1–2, 2–3, 0–4.', '0–3 was skipped.'],
      panels: [ecg({ es: { ...ek(MY.map((i) => EC.E[i]), 'done'), '0-3': 'active' } }), vars({ best: BEST })],
      task: {
        type: 'choose',
        question: 'So is 0–3 in no MST?',
        options: [
          { text: 'No — forcing it still gives 7: it is pseudo-critical', why: '' },
          { text: 'Yes — Kruskal skipped it', why: 'With ties, Kruskal picked 2–3 first; 0–3 (also 2) could take its place.' },
          { text: 'No — it is critical', why: 'Banning 0–3 still gives 7 (my MST never used it).' },
        ],
        answer: 0,
      },
      solved: 'Swap 2–3 for 0–3: still 7. "Not in my MST" ≠ "in no MST".',
    },
    {
      kind: 'turn',
      title: 'Your turn: second-best MST',
      lines: ['Add a non-tree edge (u, v, w): one cycle appears.', 'Remove the heaviest path edge **strictly smaller** than w: `best − maxEdge + w`.', 'Take the minimum over all non-tree edges.'],
      panels: [ecg({ es: { ...ek(MY.map((i) => EC.E[i]), 'done'), ...ek([EC.E[3], EC.E[5], EC.E[6]], 'active') } }), vars({ best: BEST })],
      task: { type: 'number', question: 'Weight of the strictly second-best spanning tree?', options: [7, 8, 9, 10], answer: SECOND, hint: 'Try 0–3 (2): the path 0-1-2-3 has 1, 1, 2; the heaviest strictly below 2 is 1.' },
      solved: `0–3: ${BEST} − 1 + 2 = 8. 3–4: ${BEST} − 2 + 3 = 8. 1–4: ${BEST} − 3 + 6 = 10. Minimum: ${SECOND}.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Visited Set instead of Union Find',
      lines: ['Bug: skip an edge when **both** ends are visited.', 'Two visited nodes may still be in **different** components.', 'Result: a needed edge is skipped, and the check `used === n − 1` fails.'],
      frames: [
        ...VS.ev.map((e, k) => {
          const kept = VS.ev.slice(0, k).filter((x) => !x.skip).map((x) => x.e);
          const wrong = e.skip && en(V, e.e) === 'B–D';
          return {
            say: wrong ? 1 : 0,
            note: `${ew(V, e.e)}: ` + (e.skip ? `both visited → skip${wrong ? ' — but B and D are in different components!' : '.'}` : `keep, visited {${e.seen.map((i) => V.L[i]).join(',')}}.`),
            panels: [vg({ st: { ...hl(e.seen, 'visited'), [e.e[0]]: wrong ? 'bad' : 'active', [e.e[1]]: wrong ? 'bad' : 'active' }, es: { ...ek(kept, 'done'), [key(e.e[0], e.e[1])]: e.skip ? 'bad' : 'active' } }), vars({ total: e.total, used: e.used })],
          };
        }),
        { say: 2, note: `used = ${VS.ev.at(-1).used} < 4 → returns -1. The real answer is ${VK.total}.`, panels: [villageTree(VS.ev.filter((x) => !x.skip).map((x) => x.e), { '1-3': 'bad' }), vars({ returns: -1, real: VK.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: Prim pushing dist + w',
      lines: ['Bug: Prim pushes `dist[u] + wt` — that is Dijkstra.', 'Graph: A–B 2, B–C 2, A–C 3. Start at A.'],
      panels: [gp(TR2)],
      task: { type: 'number', question: 'Total weight of the tree the buggy version builds?', options: [4, 5, 6, 7], answer: weight(TR2D.tree), hint: 'C is offered with 3 (via A) and 2 + 2 = 4 (via B). Which pops first?' },
      solved: `It joins C by A–C (3): tree weight ${weight(TR2D.tree)}. Real Prim takes B–C: ${TR2P.total}.`,
      then: [
        { say: 0, note: `Buggy: tree A–B, A–C = ${weight(TR2D.tree)}.`, panels: [gp(TR2, { es: ek(TR2D.tree, 'bad') })] },
        { say: 0, note: `Edge weight alone: tree A–B, B–C = ${TR2P.total}.`, panels: [gp(TR2, { es: ek(TR2P.tree, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the disconnected check',
      lines: ['Lazy Prim from 0. Nodes 3 and 4 are unreachable.'],
      panels: [gp(DC, { st: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'What does primMST return?',
        options: [
          { text: '-1', why: '' },
          { text: '5', why: 'That is the weight of the part reached. count = 3 ≠ 5, so the check returns -1.' },
          { text: '6', why: 'Edge 3–4 is never seen: Prim only grows from node 0.' },
        ],
        answer: 0,
      },
      solved: `The heap empties at count ${DCP.count} < n = 5 → -1.`,
      then: [{ say: 0, note: 'Tree {0, 1, 2}; 3 and 4 never join.', panels: [gp(DC, { st: { ...hl([0, 1, 2], 'done'), ...hl([3, 4], 'bad') }, es: ek(DCP.tree, 'done') }), vars({ count: DCP.count, n: 5, returns: DCP.ans })] }],
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say it out loud',
      lines: ['Name the **cut property**: the cheapest crossing edge is safe.', 'Mention the **early exit** at n − 1 edges.', 'Handle disconnection: fewer than n − 1 edges → -1.'],
      frames: [
        { say: 0, note: 'Each accepted edge is the cheapest across some cut.', panels: [g2({ es: ek(G2K.ev.filter((e) => e.ok).map((e) => G2K.sorted[e.i]), 'done') }), vars({ total: G2K.total })] },
        { say: 1, note: `Early exit: ${G2K.ev.length} of ${G2.E.length} edges examined; Q–S and R–T never looked at.`, panels: [sortedArr(G2, G2K, G2K.ev.length - 1, { cur: false }), vars({ examined: G2K.ev.length })] },
        { say: 2, note: 'Two islands: only 4 of 5 edges accepted → -1.', panels: [gp(FO, { es: ek(FOF.ev.filter((e) => e.ok).map((e) => FOF.sorted[e.i]), 'done') }), vars({ used: FOT.used, returns: FOT.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: all weights equal',
      lines: ['Edge case: every edge costs 1.', 'Many MSTs exist.'],
      panels: [gp(EQ)],
      task: { type: 'number', question: 'How many different MSTs does this square have?', options: [1, 2, 4, 6], answer: EQN, hint: 'A tree on 4 nodes has 3 edges. Which one of the 4 do you drop?' },
      solved: `${EQN}: drop any one of the four edges.`,
    },
  ],
};

// a turn's `then` frames reuse frame builders written for the watch steps; drop a say that points past the turn's own lines
for (const sec of Object.values(steps))
  for (const st of sec)
    if (st.kind === 'turn' && st.then) st.then = st.then.map(({ say, ...fr }) => (say !== undefined && say < st.lines.length ? { say, ...fr } : fr));

export default steps;
