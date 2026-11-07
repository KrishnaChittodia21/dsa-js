// Shorts for Advanced Graphs (M9). Format: src/content/shortSchema.js. Facts come only from
// topics/advanced-graphs/topic.js. Every disc / low value, finish order, component, stack, path, in-degree, depth and
// BFS level below comes from running the pattern's template on its own "e.g." graph; check() compares each result
// with a brute force (remove an edge / node and count pieces, mutual reach, all edge orders, all seatings, route BFS).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const list = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/advanced-graphs.js: ${msg}`);
};

// pos: [x, y] per vertex. o.st: vertex → state, o.tag: vertex → tag above it, o.lab: vertex → label,
// o.es: 'u-v' → edge state (either order unless o.directed)
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.directed ? { directed: true } : {}),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({
    id: i,
    label: String(o.lab?.[i] ?? i),
    x: pos[i][0],
    y: pos[i][1],
    ...(o.st?.[i] ? { state: o.st[i] } : {}),
    ...(o.tag?.[i] !== undefined ? { tag: String(o.tag[i]) } : {}),
  })),
  edges: edges.map(([u, v]) => {
    const s = o.es?.[`${u}-${v}`] ?? (o.directed ? undefined : o.es?.[`${v}-${u}`]);
    return { from: u, to: v, ...(s ? { state: s } : {}) };
  }),
});
// connected pieces of an undirected graph, optionally without one edge index or one node
function pieces(n, edges, skip = {}) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  edges.forEach(([u, v], i) => {
    if (i !== skip.edge && u !== skip.node && v !== skip.node) parent[find(u)] = find(v);
  });
  return new Set(Array.from({ length: n }, (_, i) => i).filter((i) => i !== skip.node).map(find)).size;
}

// ================= 1. low-link: bridges & cut vertices, e.g. two triangles joined by one cable =================
// the pattern's bridgesAndCuts, with a snapshot at every enter / back edge / return / finish
function lowLink(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => {
    adj[u].push([v, id]);
    adj[v].push([u, id]);
  });
  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const bridges = [];
  const cut = new Set();
  const path = [];
  const ev = [];
  let time = 0;
  const snap = (what, o) => ev.push({ what, ...o, disc: disc.slice(), low: low.slice(), path: path.slice(), bridges: bridges.map((b) => b.slice()), cut: [...cut].sort((a, b) => a - b) });
  function dfs(u, parentEdge) {
    disc[u] = low[u] = time++;
    path.push(u);
    snap('enter', { u });
    let children = 0;
    for (const [v, id] of adj[u]) {
      if (id === parentEdge) continue;
      if (disc[v] === -1) {
        children++;
        dfs(v, id);
        low[u] = Math.min(low[u], low[v]);
        const bridge = low[v] > disc[u];
        if (bridge) bridges.push([u, v]);
        const cutv = parentEdge !== -1 && low[v] >= disc[u];
        if (cutv) cut.add(u);
        snap('return', { u, v, bridge, cutv });
      } else {
        low[u] = Math.min(low[u], disc[v]);
        snap('back', { u, v });
      }
    }
    if (parentEdge === -1 && children >= 2) cut.add(u);
    path.pop();
    snap('finish', { u, children });
  }
  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);
  return { ev, disc, low, bridges, cut: [...cut].sort((a, b) => a - b) };
}
const bruteBridges = (n, edges) => edges.filter((_, i) => pieces(n, edges, { edge: i }) > pieces(n, edges));
const bruteCuts = (n, edges) => Array.from({ length: n }, (_, v) => v).filter((v) => pieces(n, edges, { node: v }) > pieces(n, edges));
const keyOf = (es) => es.map(([u, v]) => [Math.min(u, v), Math.max(u, v)].join('-')).sort().join(' ');

const B_N = 6;
const B_E = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 3],
];
const B_POS = [
  [0, 0],
  [0, 1.4],
  [1.2, 0.7],
  [2.4, 0.7],
  [3.6, 0],
  [3.6, 1.4],
];
const B = lowLink(B_N, B_E);
const B_BRUTE = bruteBridges(B_N, B_E);
check(keyOf(B.bridges) === keyOf(B_BRUTE) && keyOf(B.bridges) === '2-3', 'bridges = brute force = 2–3');
check(seq(B.cut) === seq(bruteCuts(B_N, B_E)) && seq(B.cut) === '2, 3', 'cut vertices = brute force = 2, 3');
const bAt = (what, u, v) => B.ev.find((e) => e.what === what && e.u === u && (v === undefined || e.v === v));
const b20 = bAt('back', 2, 0);
const b53 = bAt('back', 5, 3);
const r45 = bAt('return', 4, 5);
const r34 = bAt('return', 3, 4);
const r23 = bAt('return', 2, 3);
const f0 = bAt('finish', 0);
check(b20.low[2] === 0 && b53.low[5] === 3 && r45.low[4] === 3 && !r45.bridge, 'low values climb');
check(r34.low[4] === r34.disc[3] && !r34.bridge && r34.cutv, '3–4: low = disc → not a bridge, but 3 is a cut vertex');
check(r23.low[3] === 3 && r23.disc[2] === 2 && r23.bridge && r23.cutv, '2–3 is a bridge');
check(f0.children === 1 && !f0.cut.includes(0) && seq(f0.low) === '0, 0, 0, 3, 3, 3', 'root 0 has one child');
const dl = (e) => Object.fromEntries(e.disc.map((d, i) => [i, d === -1 ? undefined : `${d}/${e.low[i]}`]).filter(([, t]) => t));
const bPanels = (e, es, test) => [
  gp(B_N, B_E, B_POS, { tag: dl(e), st: { ...states(e.path, 'visited'), ...(e.path.length ? { [e.path[e.path.length - 1]]: 'active' } : {}), ...states(e.cut, 'bad') }, es: { ...Object.fromEntries(e.bridges.map(([u, v]) => [`${u}-${v}`, 'bad'])), ...es } }),
  stk(e.path, 'DFS path'),
  ...(test ? [vars(test)] : []),
];
const lFrames = [
  { say: 0, note: `Dive 0 → 1 → 2: disc 0, 1, 2. 2 sees 0 by a back edge: low[2] = min(2, disc[0]) = ${b20.low[2]}.`, panels: bPanels(b20, { '2-0': 'active' }) },
  { say: 0, note: `On: 2 → 3 → 4 → 5, disc 3, 4, 5. 5 sees 3 by a back edge: low[5] = ${b53.low[5]}.`, panels: bPanels(b53, { '5-3': 'active' }) },
  { say: 1, note: `5 returns to 4: low[4] = min(4, low[5]) = ${r45.low[4]}. Its subtree climbs above 4.`, panels: bPanels(r45, { '4-5': 'active' }, { test: `low[5] = 3 > disc[4] = 4?`, bridge: 'no' }) },
  { say: 2, note: 'At 3: low[4] = 3 = disc[3]. Not > → 3–4 is no bridge. But ≥ → 3 is a cut vertex.', panels: bPanels(r34, { '3-4': 'active' }, { test: 'low[4] = 3 vs disc[3] = 3', 'bridge (>)': 'no', 'cut 3 (≥)': 'yes' }) },
  { say: 1, note: `At 2: low[3] = ${r23.low[3]} > disc[2] = ${r23.disc[2]}. Nothing below 3 reaches 2: bridge 2–3, cut vertex 2.`, panels: bPanels(r23, { '2-3': 'active' }, { test: 'low[3] = 3 > disc[2] = 2?', bridge: 'yes', 'cut 2': 'yes' }) },
  { say: 3, note: `low 0 flows up to 1 and 0. Root 0 has ${f0.children} DFS child: not a cut vertex.`, panels: bPanels(f0, {}, { bridges: '2–3', cut: seq(f0.cut), 'root children': f0.children }) },
];
// the turn: e.g. a bow tie, two triangles sharing node 0
const BT_E = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 4],
  [4, 0],
];
const BT_POS = [
  [1.2, 0.7],
  [0, 0],
  [0, 1.4],
  [2.4, 0],
  [2.4, 1.4],
];
const BT = lowLink(5, BT_E);
const BT_F = BT.ev[BT.ev.length - 1];
check(BT.bridges.length === 0 && bruteBridges(5, BT_E).length === 0, 'bow tie has no bridge');
check(seq(BT.cut) === '0' && seq(bruteCuts(5, BT_E)) === '0' && BT_F.children === 2 && BT.low[1] === 0 && BT.low[3] === 0, 'root 0 is the only cut vertex');
check(pieces(5, BT_E, { node: 0 }) === 2, 'removing 0 leaves two pieces');

// ================= 2. Kosaraju, e.g. n = 6: a triangle, a 2-cycle and a lone feeder =================
// the pattern's kosaraju, with snapshots in pass 1 (enter / finish) and one record per pass-2 start
function kosaraju(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    g[u].push(v);
    rg[v].push(u);
  }
  const seen = new Array(n).fill(false);
  const order = [];
  const path = [];
  const ev = [];
  function dfs1(u) {
    seen[u] = true;
    path.push(u);
    ev.push({ what: 'enter', u, path: path.slice(), order: order.slice() });
    for (const v of g[u]) if (!seen[v]) dfs1(v);
    order.push(u);
    path.pop();
    ev.push({ what: 'finish', u, path: path.slice(), order: order.slice() });
  }
  for (let u = 0; u < n; u++) if (!seen[u]) dfs1(u);
  const comp = new Array(n).fill(-1);
  let count = 0;
  const starts = [];
  function dfs2(u, c, got) {
    comp[u] = c;
    got.push(u);
    for (const v of rg[u]) if (comp[v] === -1) dfs2(v, c, got);
  }
  for (let i = n - 1; i >= 0; i--) {
    const u = order[i];
    if (comp[u] === -1) {
      const got = [];
      dfs2(u, count++, got);
      starts.push({ u, got, comp: comp.slice() });
    }
  }
  return { ev, order, count, comp, starts };
}
const reachAll = (n, edges) => {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  return Array.from({ length: n }, (_, s) => {
    const seen = new Set([s]);
    const st = [s];
    while (st.length) for (const v of g[st.pop()]) if (!seen.has(v)) seen.add(v), st.push(v);
    return seen;
  });
};
const K_N = 6;
const K_E = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 3],
  [5, 4],
];
const K_RE = K_E.map(([u, v]) => [v, u]);
const K_POS = [
  [0, 0],
  [1.2, 0],
  [0.6, 1.1],
  [2.2, 1.1],
  [3.4, 1.1],
  [3.4, 0],
];
const K = kosaraju(K_N, K_E);
const K_REACH = reachAll(K_N, K_E);
for (let u = 0; u < K_N; u++) for (let v = 0; v < K_N; v++) check((K.comp[u] === K.comp[v]) === (K_REACH[u].has(v) && K_REACH[v].has(u)), `SCC of ${u}, ${v} = mutual reach`);
check(seq(K.order) === '4, 3, 2, 1, 0, 5' && K.count === 3, 'finish order and 3 SCCs');
check(K.starts.map((s) => `${s.u}:${s.got.join('')}`).join(' ') === '5:5 0:021 3:34', 'pass 2 starts 5, 0, 3');
// sources of the condensation vs nodes with in-degree 0
const K_SRC = Array.from({ length: K.count }, (_, c) => c).filter((c) => !K_E.some(([u, v]) => K.comp[u] !== K.comp[v] && K.comp[v] === c));
const K_IN0 = Array.from({ length: K_N }, (_, v) => v).filter((v) => !K_E.some(([, w]) => w === v));
let K_MIN = Infinity;
for (let mask = 1; mask < 1 << K_N; mask++) {
  const pick = Array.from({ length: K_N }, (_, v) => v).filter((v) => mask & (1 << v));
  if (new Set(pick.flatMap((s) => [...K_REACH[s]])).size === K_N) K_MIN = Math.min(K_MIN, pick.length);
}
check(K_SRC.length === 2 && K_MIN === 2 && seq(K_IN0) === '5', 'min starts = 2 source components, but only 1 source node');
const kDive = K.ev.find((e) => e.what === 'enter' && e.u === 4);
const kFin0 = K.ev.find((e) => e.what === 'finish' && e.u === 0);
const kFin5 = K.ev.find((e) => e.what === 'finish' && e.u === 5);
check(seq(kDive.path) === '0, 1, 2, 3, 4' && seq(kFin0.order) === '4, 3, 2, 1, 0', 'pass 1 events');
const fTag = (order) => Object.fromEntries(order.map((u, i) => [u, `f${i}`]));
const COMP_ST = ['active', 'done', 'visited'];
const COMP_NAME = (c) => `{${K.starts[c].got.slice().sort((a, b) => a - b).join(', ')}}`;
const p1Panels = (e, es = {}) => [
  gp(K_N, K_E, K_POS, { directed: true, tag: fTag(e.order), st: { ...states(e.order, 'done'), ...states(e.path, 'visited'), ...(e.path.length ? { [e.path[e.path.length - 1]]: 'active' } : {}) }, es }),
  stk(e.path, 'DFS path'),
  arr(e.order.length ? e.order : ['·'], { label: 'order (by finish)' }),
];
const p2Panels = (s, i) => [
  gp(K_N, K_RE, K_POS, { directed: true, label: 'transpose', tag: Object.fromEntries(s.comp.map((c, u) => [u, c === -1 ? undefined : `c${c}`]).filter(([, t]) => t)), st: Object.fromEntries(s.comp.map((c, u) => [u, c === -1 ? '' : COMP_ST[c]])) }),
  arr(K.order, { label: 'order (by finish)', highlights: { [K.order.indexOf(s.u)]: 'active', ...hl(K_N, (k) => (s.comp[K.order[k]] !== -1 && K.order[k] !== s.u ? 'muted' : '')) }, pointers: [{ index: K.order.indexOf(s.u), label: `start ${i + 1}`, color: 'a' }] }),
];
const [KS0, KS1, KS2] = K.starts;
// condensation: one super-node per SCC
const KC_LAB = K.starts.map((_, c) => COMP_NAME(c));
const KC_E = [...new Set(K_E.filter(([u, v]) => K.comp[u] !== K.comp[v]).map(([u, v]) => `${K.comp[u]}-${K.comp[v]}`))].map((k) => k.split('-').map(Number));
const KC_POS = [
  [2.4, 0],
  [0, 0],
  [1.2, 1.2],
];
check(KC_E.length === 2 && KC_E.every(([, v]) => v === 2), 'condensation: c0 → c2 ← c1');
const kcPanel = (st) => gp(K.count, KC_E, KC_POS, { directed: true, label: 'condensation', lab: KC_LAB, st });

// ================= 3. Hierholzer, e.g. 5 one-way tickets with a dead end =================
const E_N = 5;
const E_E = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [4, 0],
];
const E_POS = [
  [1.2, 1],
  [2.4, 1],
  [3.6, 1],
  [0, 0.2],
  [0, 1.8],
];
// the pattern's eulerPath with lists sorted descending (pop() = smallest), one snapshot per push / pop
function hierholzer(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  for (const l of adj) l.sort((a, b) => b - a);
  const stack = [start];
  const path = [];
  const ev = [];
  const walked = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    if (adj[u].length) {
      const v = adj[u].pop();
      stack.push(v);
      walked.push(`${u}-${v}`);
      ev.push({ what: 'push', u, v, stack: stack.slice(), path: path.slice(), walked: walked.slice() });
    } else {
      path.push(stack.pop());
      ev.push({ what: 'pop', u, stack: stack.slice(), path: path.slice(), walked: walked.slice() });
    }
  }
  return { ev, path: path.slice().reverse(), pushed: [start, ...ev.filter((e) => e.what === 'push').map((e) => e.v)] };
}
const E_OUT = Array.from({ length: E_N }, (_, i) => E_E.filter(([u]) => u === i).length);
const E_IN = Array.from({ length: E_N }, (_, i) => E_E.filter(([, v]) => v === i).length);
const E_START = E_OUT.findIndex((o, i) => o - E_IN[i] === 1);
const E_END = E_IN.findIndex((d, i) => d - E_OUT[i] === 1);
const H = hierholzer(E_N, E_E, E_START);
const usesAll = (p) => {
  const left = E_E.map(([u, v]) => `${u}-${v}`);
  for (let i = 1; i < p.length; i++) {
    const k = left.indexOf(`${p[i - 1]}-${p[i]}`);
    if (k < 0) return false;
    left.splice(k, 1);
  }
  return left.length === 0;
};
// brute force: every order of the 5 tickets, keep the ones that chain into a walk
const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
const E_ALL = perms(E_E).filter((p) => p.every((e, i) => i === 0 || p[i - 1][1] === e[0])).map((p) => seq([p[0][0], ...p.map((e) => e[1])]));
check(E_START === 0 && E_END === 2 && E_OUT.every((o, i) => i === 0 || i === 2 || o === E_IN[i]), 'start 0 (+1), end 2 (−1)');
check(usesAll(H.path) && seq(H.path) === '0, 3, 4, 0, 1, 2' && new Set(E_ALL).size === 1 && E_ALL[0] === seq(H.path), 'Hierholzer = the only Euler path');
check(seq(H.pushed) === '0, 1, 2, 3, 4, 0' && !usesAll(H.pushed), 'push order is not a valid path');
const hAt = (pred) => H.ev.find(pred);
const hStuck = hAt((e) => e.what === 'push' && e.v === 2);
const hPop1 = hAt((e) => e.what === 'pop' && e.u === 1);
const hDetour = hAt((e) => e.what === 'push' && e.u === 4);
const hEnd = H.ev[H.ev.length - 1];
check(seq(hStuck.stack) === '0, 1, 2' && seq(hPop1.path) === '2, 1' && seq(hDetour.stack) === '0, 3, 4, 0' && seq(hEnd.path) === '2, 1, 0, 4, 3, 0', 'Hierholzer events');
const hPanels = (e, extra = {}) => {
  return [
    gp(E_N, E_E, E_POS, { directed: true, st: { ...states(e.path, 'done'), ...(e.stack.length ? { [e.stack[e.stack.length - 1]]: 'active' } : {}) }, es: { ...states(e.walked, 'visited'), ...extra } }),
    stk(e.stack),
    arr(e.path.length ? e.path : ['·'], { label: 'path (end first)', highlights: e.path.length ? { [e.path.length - 1]: 'done' } : {} }),
  ];
};
const balTable = () =>
  table(
    ['out', 'in', 'out − in'],
    E_OUT.map((_, i) => String(i)),
    [E_OUT, E_IN, E_OUT.map((o, i) => o - E_IN[i])],
  );

// ================= 4. functional graph, e.g. f = [1, 2, 3, 1, 3, 4, 5] =================
// the pattern's functionalShape, one snapshot per pop
function functional(f) {
  const n = f.length;
  const indeg = new Array(n).fill(0);
  const depth = new Array(n).fill(0);
  for (const v of f) indeg[v]++;
  const start = indeg.slice();
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const seeds = queue.slice();
  const pops = [];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    const v = f[u];
    depth[v] = Math.max(depth[v], depth[u] + 1);
    const was = indeg[v];
    if (--indeg[v] === 0) queue.push(v);
    pops.push({ u, v, h, was, indeg: indeg.slice(), depth: depth.slice(), queue: queue.slice(h + 1), pushed: indeg[v] === 0 });
  }
  return { start, seeds, pops, onCycle: indeg.map((d) => d > 0), depth };
}
const F_F = [1, 2, 3, 1, 3, 4, 5];
const F_N = F_F.length;
const F_E = F_F.map((v, i) => [i, v]);
const F_POS = [
  [1, 0],
  [2, 0],
  [3, 0.8],
  [2, 1.6],
  [1, 1.6],
  [0, 1.6],
  [-1, 1.6],
];
const F = functional(F_F);
const F_CYC = F.onCycle.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
// brute force: a node is on a cycle iff following pointers from it comes back to it
const F_BRUTE = Array.from({ length: F_N }, (_, s) => {
  let x = F_F[s];
  for (let k = 0; k < F_N; k++, x = F_F[x]) if (x === s) return true;
  return false;
});
check(seq(F_CYC) === '1, 2, 3' && F_BRUTE.every((b, i) => b === F.onCycle[i]), 'cycle = 1, 2, 3 = brute force');
check(seq(F.start) === '0, 2, 1, 2, 1, 1, 0' && seq(F.seeds) === '0, 6' && F.depth[1] === 1 && F.depth[3] === 3, 'in-degrees, seeds, depths');
// naive walk from 6 until a node repeats
const F_WALK = [6];
while (!F_WALK.slice(0, -1).includes(F_WALK[F_WALK.length - 1])) F_WALK.push(F_F[F_WALK[F_WALK.length - 1]]);
check(seq(F_WALK) === '6, 5, 4, 3, 1, 2, 3', 'walk from 6');
const fPanels = (p, peeled) => [
  gp(F_N, F_E, F_POS, { directed: true, st: { ...states(peeled, 'muted'), ...states(p.queue, 'visited'), ...(p.u !== undefined ? { [p.u]: 'active' } : {}) }, es: p.u !== undefined ? { [`${p.u}-${p.v}`]: 'active' } : {} }),
  table(['indeg', 'depth'], F_F.map((_, i) => String(i)), [p.indeg, p.depth]),
  que(p.queue),
];
const F_FRAMES = [
  { say: 0, note: `Count arrows in: indeg = ${list(F.start)}. Nobody points at ${seq(F.seeds)}: tree leaves. Queue them.`, panels: fPanels({ indeg: F.start, depth: new Array(F_N).fill(0), queue: F.seeds }, []) },
  ...F.pops.map((p, k) => ({
    say: 1,
    note: `Pop ${p.u}: depth[${p.v}] = ${p.depth[p.v]}, indeg[${p.v}] ${p.was} → ${p.indeg[p.v]}.${p.pushed ? ` Push ${p.v}: a tree node too.` : ` ${p.v} still has an arrow in.`}`,
    panels: fPanels(p, F.pops.slice(0, k).map((q) => q.u)),
  })),
];
F_FRAMES.push({
  say: 2,
  note: `Queue empty. indeg > 0 left: ${seq(F_CYC)}, the cycle of length ${F_CYC.length}. Longest chain into 3: depth ${F.depth[3]}.`,
  panels: [gp(F_N, F_E, F_POS, { directed: true, st: { ...states(F.pops.map((p) => p.u), 'muted'), ...states(F_CYC, 'done') }, es: { '1-2': 'done', '2-3': 'done', '3-1': 'done' } }), arr(F.depth, { label: 'depth', highlights: hl(F_N, (k) => (F.onCycle[k] ? 'done' : '')) })],
});
// the turn: e.g. favorite = [1, 0, 0, 1, 5, 6, 4]: pair 0 ↔ 1 with a chain on each side, and a 3-cycle 4 → 5 → 6
const M_F = [1, 0, 0, 1, 5, 6, 4];
const M_N = M_F.length;
const M_POS = [
  [1, 0],
  [2, 0],
  [0, 0],
  [3, 0],
  [0.5, 1.3],
  [2.5, 1.3],
  [1.5, 2.2],
];
const M = functional(M_F);
const M_PAIR = 2 + M.depth[0] + M.depth[1];
const M_CYCLE = M.onCycle.filter((c, i) => c && M_F[M_F[i]] !== i).length; // the only longer cycle: 4, 5, 6
const M_ANS = Math.max(M_CYCLE, M_PAIR);
// brute force: largest set of people that can sit around a table with everyone next to their favourite
let M_BRUTE = 0;
for (let mask = 1; mask < 1 << M_N; mask++) {
  const ppl = Array.from({ length: M_N }, (_, i) => i).filter((i) => mask & (1 << i));
  if (ppl.length < 2 || ppl.length <= M_BRUTE) continue;
  const [first, ...rest] = ppl;
  const ok = perms(rest).some((p) => {
    const ring = [first, ...p];
    return ring.every((x, i) => M_F[x] === ring[(i + 1) % ring.length] || M_F[x] === ring[(i - 1 + ring.length) % ring.length]);
  });
  if (ok) M_BRUTE = ppl.length;
}
check(M_PAIR === 4 && M_CYCLE === 3 && M_ANS === 4 && M_BRUTE === 4, 'meeting: max(3, 2 + 1 + 1) = 4 = brute force');

// ================= 5. BFS over routes, e.g. 4 routes, stop 1 → stop 9 =================
const R = [
  [1, 3, 5],
  [5, 8, 6],
  [6, 2, 9],
  [3, 4, 2],
];
const R_SRC = 1;
const R_DST = 9;
const STOPS = [1, 3, 5, 8, 6, 2, 9, 4];
const S_POS = [
  [0, 0.6],
  [1, 1.4],
  [1.4, 0],
  [2.8, -0.6],
  [4.2, 0.9],
  [2.8, 1.8],
  [4.2, 2.4],
  [1.4, 2.6],
];
const sid = (x) => STOPS.indexOf(x);
const S_E = R.flatMap((r) => r.flatMap((a, i) => r.slice(i + 1).map((b) => [sid(a), sid(b)])));
const RT_E = [];
for (let a = 0; a < R.length; a++) for (let b = a + 1; b < R.length; b++) if (R[a].some((x) => R[b].includes(x))) RT_E.push([a, b]);
const RT_POS = [
  [0, 0],
  [1.4, -0.6],
  [2.8, 0],
  [1.4, 0.8],
];
const RT_LAB = R.map((_, i) => `R${i}`);
// the pattern's minGroups, one snapshot per BFS level (and per skipped route)
function minGroups(groups, source, target) {
  const byItem = new Map();
  groups.forEach((g, id) =>
    g.forEach((x) => {
      if (!byItem.has(x)) byItem.set(x, []);
      byItem.get(x).push(id);
    }),
  );
  const usedGroup = new Array(groups.length).fill(false);
  const seenItem = new Set([source]);
  let frontier = [source];
  let steps = 0;
  const levels = [];
  while (frontier.length) {
    steps++;
    const next = [];
    const boarded = [];
    const skipped = [];
    for (const item of frontier)
      for (const gid of byItem.get(item) ?? []) {
        if (usedGroup[gid]) {
          skipped.push({ item, gid });
          continue;
        }
        usedGroup[gid] = true;
        boarded.push({ item, gid });
        for (const x of groups[gid]) {
          if (x === target) {
            levels.push({ steps, frontier, boarded, skipped, next: next.slice(), used: usedGroup.slice(), seen: [...seenItem], hit: true });
            return { byItem, levels, answer: steps };
          }
          if (!seenItem.has(x)) {
            seenItem.add(x);
            next.push(x);
          }
        }
      }
    levels.push({ steps, frontier, boarded, skipped, next: next.slice(), used: usedGroup.slice(), seen: [...seenItem] });
    frontier = next;
  }
  return { byItem, levels, answer: -1 };
}
const MG = minGroups(R, R_SRC, R_DST);
// brute force: BFS on the route graph (routes sharing a stop are neighbours)
const rtDist = R.map((r) => (r.includes(R_SRC) ? 1 : Infinity));
for (let changed = true; changed; ) {
  changed = false;
  for (const [a, b] of RT_E)
    for (const [x, y] of [
      [a, b],
      [b, a],
    ])
      if (rtDist[x] + 1 < rtDist[y]) (rtDist[y] = rtDist[x] + 1), (changed = true);
}
const R_BRUTE = Math.min(...R.map((r, i) => (r.includes(R_DST) ? rtDist[i] : Infinity)));
check(MG.answer === 3 && R_BRUTE === 3 && S_E.length === 12, '3 buses = brute force; 12 stop-pair edges');
const [L1, L2, L3] = MG.levels;
check(seq(L1.next) === '3, 5' && seq(L2.next) === '4, 2, 8, 6' && L3.hit && L3.skipped[0].item === 4 && L3.skipped[0].gid === 3 && L3.boarded[0].gid === 2, 'BFS levels');
const routesOf = (x) => MG.byItem.get(x) ?? [];
const mgPanels = (seen, active, used, boardNow, frontier, label) => [
  gp(STOPS.length, S_E, S_POS, { lab: STOPS, st: { ...states(seen.map(sid), 'visited'), ...states(active.map(sid), 'active') } }),
  gp(R.length, RT_E, RT_POS, { label: 'routes', lab: RT_LAB, st: { ...states(used.map((u, i) => (u ? i : -1)).filter((i) => i >= 0), 'done'), ...states(boardNow, 'active') } }),
  que(frontier, label),
];
const usedIds = (u) => u.map((b, i) => (b ? `R${i}` : '')).filter(Boolean);
const L3_BEFORE_USED = L2.used;

export default [
  {
    id: 'adv-graph-lowlink-bridges',
    title: 'Find every critical cable in one DFS',
    steps: [
      {
        kind: 'watch',
        title: 'Cut each cable and look',
        lines: ['A **bridge**: an edge whose removal splits the graph.', 'Brute force: remove each edge, BFS, put it back: **O(E · (V + E))**.'],
        frames: [
          { say: 0, note: 'e.g. 6 routers and 7 cables: two triangles joined by one cable. Which cable is critical?', panels: [gp(B_N, B_E, B_POS)] },
          { say: 1, note: `Remove each of the ${B_E.length} cables, search, put it back: ${B_E.length} full searches. Only 2–3 splits it.`, panels: [gp(B_N, B_E, B_POS, { es: { '2-3': 'bad' } }), vars({ searches: B_E.length, each: 'O(V + E)', bridges: B_BRUTE.map(([u, v]) => `${u}–${v}`).join(', ') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'disc and low, tagged as disc/low',
        lines: [
          '`disc[u]` = when DFS first reaches u. A back edge sets `low[u] = min(low[u], disc[v])`.',
          'Child c returns to parent p: `low[p] = min(low[p], low[c])`. Bridge iff `low[c] > disc[p]`.',
          'Cut vertex iff `low[c] >= disc[p]`: the subtree cannot climb **above** p.',
          'The root is a cut vertex only with **≥ 2** DFS children.',
        ],
        frames: lFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"critical connection"**, **"bridge"**, **"articulation point" / "cut vertex"**, **"removing it disconnects"**, **"single point of failure"**.'],
        frames: [{ say: 0, note: 'One DFS answers "is there a detour around this tree edge?" for every edge at once: O(V + E).', panels: [vars({ 'remove + BFS': 'O(E · (V + E))', 'low-link DFS': 'O(V + E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the root of a bow tie',
        lines: ['e.g. two triangles sharing node 0. DFS from 0, tags show disc/low.', `Root 0 has ${BT_F.children} tree children, 1 and 3. low[1] = low[3] = 0.`],
        panels: [gp(5, BT_E, BT_POS, { tag: dl(BT_F), st: { 0: 'active' } }), vars({ 'root children': BT_F.children, bridges: 'none' })],
        task: {
          type: 'choose',
          question: 'Is the root 0 a cut vertex?',
          options: [
            { text: 'Yes: a root with 2 or more DFS children is always a cut vertex' },
            { text: 'No: low[1] = low[3] = 0, so both subtrees climb back to the root', why: 'They climb TO the root, not past it. Remove 0 and nothing links {1, 2} with {3, 4}.' },
            { text: 'Yes, because low[3] >= disc[0]', why: 'Right answer, wrong reason: for the root that test is always true. That is why the root has its own rule.' },
            { text: 'No: there is no bridge, so there is no cut vertex', why: 'Edges and nodes are different questions: every edge lies on a triangle, yet node 0 joins the two.' },
          ],
          answer: 0,
        },
        solved: 'The root is special: it is a cut vertex iff it has **≥ 2 DFS children**.',
        then: [{ note: `Check by removal: without 0 the graph falls into ${pieces(5, BT_E, { node: 0 })} pieces, {1, 2} and {3, 4}.`, panels: [gp(5, BT_E, BT_POS, { st: { 0: 'bad', 1: 'done', 2: 'done', 3: 'visited', 4: 'visited' }, es: { '0-1': 'muted', '2-0': 'muted', '0-3': 'muted', '4-0': 'muted' } })] }],
      },
    ],
  },

  {
    id: 'adv-graph-scc-kosaraju',
    title: 'Two DFS passes find every group that can reach itself',
    steps: [
      {
        kind: 'watch',
        title: 'Who reaches whom, both ways?',
        lines: ['A **strongly connected component**: a maximal group where every node reaches every other.', 'Brute force: one search from every vertex, then compare: **V × O(V + E)**.'],
        frames: [
          { say: 0, note: 'e.g. 6 nodes, one-way edges. 0 → 1 does not mean 1 → 0.', panels: [gp(K_N, K_E, K_POS, { directed: true })] },
          { say: 1, note: `Search from each of the ${K_N} nodes; u and v share an SCC when each reaches the other.`, panels: [gp(K_N, K_E, K_POS, { directed: true, st: states([...K_REACH[5]], 'visited') }), vars({ 'from 5 reaches': seq([...K_REACH[5]].sort()), searches: K_N })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Pass 1: record finishing order',
        lines: ['DFS the original graph. Push u onto `order` when it **finishes**.'],
        frames: [
          { say: 0, note: `DFS from 0 dives ${seq(kDive.path).replace(/, /g, ' → ')}. 2 → 0 and 4 → 3 lead to seen nodes.`, panels: p1Panels(kDive, { '0-1': 'active', '1-2': 'active', '2-3': 'active', '3-4': 'active' }) },
          { say: 0, note: `4 finishes first, then 3, 2, 1, 0. order = ${list(kFin0.order)}.`, panels: p1Panels(kFin0) },
          { say: 0, note: `5 is still unseen. 5 → 4 is done already, so 5 finishes last: order = ${list(kFin5.order)}.`, panels: p1Panels(kFin5, { '5-4': 'active' }) },
        ],
      },
      {
        kind: 'watch',
        title: 'Pass 2: the transpose, latest finish first',
        lines: ['Reverse every edge. Same SCCs, but sources become **sinks**.', 'Walk `order` from the end; each unassigned node starts a DFS on the transpose.', 'Each pass-2 DFS tree is exactly one SCC.'],
        frames: [
          { say: 1, note: `Start at the last finisher, ${KS0.u}. In the transpose no edge leaves 5. SCC c0 = ${COMP_NAME(0)}.`, panels: p2Panels(KS0, 0) },
          { say: 1, note: `Next unassigned from the end: ${KS1.u}. Reach ${seq(KS1.got)}; 3 → 2 only points in. SCC c1 = ${COMP_NAME(1)}.`, panels: p2Panels(KS1, 1) },
          { say: 2, note: `1 and 2 are done. Start ${KS2.u}: reach ${seq(KS2.got)}; 4 → 5 leads into c0, done. SCC c2 = ${COMP_NAME(2)}.`, panels: p2Panels(KS2, 2) },
          { say: 2, note: `Collapse each SCC into one node: the condensation, a DAG. ${K.count} SCCs, found in O(V + E).`, panels: [kcPanel(states(K_SRC, 'done')), arr(K.comp, { label: 'comp' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"strongly connected"**, **"mutually reachable"**, **"can reach each other"**, **"minimum number of nodes to start from"**.'],
        frames: [{ say: 0, note: 'Directed graph with cycles + a DAG-style question: condense first, then reason on the DAG.', panels: [vars({ 'search from all': 'V × O(V + E)', Kosaraju: 'O(V + E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: where to start',
        lines: ['Same graph. Pick the fewest start nodes so that every node is reachable.', `Only node ${seq(K_IN0)} has no incoming edge.`],
        panels: [gp(K_N, K_E, K_POS, { directed: true, tag: Object.fromEntries(K.comp.map((c, u) => [u, `c${c}`])), st: Object.fromEntries(K.comp.map((c, u) => [u, COMP_ST[c]])) }), kcPanel({})],
        task: {
          type: 'choose',
          question: 'How many start nodes are needed?',
          options: [
            { text: `${K_SRC.length}: one per source component, ${K_SRC.map(COMP_NAME).join(' and ')}` },
            { text: `${K_IN0.length}: only node 5 has in-degree 0`, why: 'That counts source NODES. 0 has an arrow from 2, but from inside its own SCC: nothing outside reaches {0, 1, 2}.' },
            { text: `${K.count}: one per SCC`, why: 'c2 = {3, 4} is reachable from either source, so it needs no start of its own.' },
            { text: '1: start at 5, the last finisher', why: 'The last finisher sits in A source SCC, but there can be several sources. From 5 you never reach 0.' },
          ],
          answer: 0,
        },
        solved: 'Minimum starts = number of **source components** (in-degree 0 in the condensation).',
      },
    ],
  },

  {
    id: 'adv-graph-euler-hierholzer',
    title: 'Use every ticket once: write a stop when you get stuck',
    steps: [
      {
        kind: 'watch',
        title: 'Greedy walks get stuck early',
        lines: ['Use every edge **exactly once**: an Eulerian path.', 'Trying every order of edges with backtracking is **exponential**.'],
        frames: [
          { say: 0, note: 'e.g. 5 one-way tickets. Use every ticket exactly once.', panels: [gp(E_N, E_E, E_POS, { directed: true })] },
          { say: 1, note: 'Smallest first: 0 → 1 → 2, stuck at 2 with 3 tickets unused. Backtrack and retry? Exponential.', panels: [gp(E_N, E_E, E_POS, { directed: true, st: { 2: 'bad' }, es: { '0-1': 'active', '1-2': 'active', '0-3': 'bad', '3-4': 'bad', '4-0': 'bad' } }), vars({ used: 2, left: 3 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Hierholzer: stuck means final',
        lines: [
          'Start at the node with out − in = 1, else any node with an edge.',
          'Top of the stack has an unused edge: follow it (push).',
          'No unused edge: that node is **final**: pop it onto the path.',
          'Reverse the path: every edge, exactly once.',
        ],
        frames: [
          { say: 0, note: `out − in: node ${E_START} has +1, the start; node ${E_END} has −1, the end. All others balance.`, panels: [gp(E_N, E_E, E_POS, { directed: true, st: { [E_START]: 'active', [E_END]: 'done' } }), balTable()] },
          { say: 1, note: `Push the smallest: 1, then 2. stack = ${list(hStuck.stack)}.`, panels: hPanels(hStuck, { '0-1': 'active', '1-2': 'active' }) },
          { say: 2, note: `2 has no unused ticket: pop it, it goes LAST. 1 is stuck too: path = ${list(hPop1.path)}.`, panels: hPanels(hPop1) },
          { say: 1, note: `Back at 0: 0 → 3 is unused. Push 3, 4, 0: the skipped cycle. stack = ${list(hDetour.stack)}.`, panels: hPanels(hDetour, { '0-3': 'active', '3-4': 'active', '4-0': 'active' }) },
          { say: 2, note: `Every top is stuck now: pop 0, 4, 3, 0. path = ${list(hEnd.path)}.`, panels: hPanels(hEnd) },
          { say: 3, note: `Reverse: ${seq(H.path)}. The detour 0 → 3 → 4 → 0 is spliced in before the dead end.`, panels: [gp(E_N, E_E, E_POS, { directed: true, st: states([0, 1, 2, 3, 4], 'done'), es: states(['0-1', '1-2', '0-3', '3-4', '4-0'], 'done') }), arr(H.path, { label: 'Euler path' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"use all the tickets"**, **"every edge exactly once"**, **"end of one equals start of next"**, **"domino chain"**, **"contains every password"**.'],
        frames: [{ say: 0, note: 'Each edge is pushed once and popped once: O(E), plus O(E log E) to sort for lexical order.', panels: [vars({ backtracking: 'exponential', Hierholzer: 'O(E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: write on the way down?',
        lines: [`The stack received ${seq(H.pushed)} in that order.`, `A friend writes each node when it is pushed: ${seq(H.pushed)}.`],
        panels: [gp(E_N, E_E, E_POS, { directed: true, es: { '1-2': 'active' } }), arr(H.pushed, { label: 'push order', highlights: { 2: 'bad', 3: 'bad' } })],
        task: {
          type: 'choose',
          question: 'What is wrong with that answer?',
          options: [
            { text: 'It jumps 2 → 3, which is no ticket: the dead end 1, 2 must come last, so write nodes when stuck' },
            { text: 'Nothing: it lists every node', why: 'Every node is the Hamiltonian question. Euler needs consecutive nodes to be real edges, and 2 → 3 is not one.' },
            { text: 'It should start at 2', why: '2 has in − out = 1: it is the end. The start is the node with out − in = 1, here 0.' },
            { text: 'Lists should be sorted ascending and read with shift()', why: 'The choice order was fine. shift() is O(E) per call; sort descending and pop() instead.' },
          ],
          answer: 0,
        },
        solved: 'Append a node when it is **stuck**, then reverse: detours land before dead ends.',
      },
    ],
  },

  {
    id: 'adv-graph-functional',
    title: 'One arrow per node: peel the trees, keep the cycle',
    steps: [
      {
        kind: 'watch',
        title: 'Walking from every node',
        lines: ['Every node i has exactly one arrow out, to `f[i]`: a **functional graph**.', 'Simulating the walk from every node repeats the same cycle again and again: O(n²).'],
        frames: [
          { say: 0, note: `e.g. f = ${list(F_F)}. Each component: one cycle with trees hanging into it.`, panels: [gp(F_N, F_E, F_POS, { directed: true }), arr(F_F, { label: 'f' })] },
          { say: 1, note: `Walk from 6 until a repeat: ${seq(F_WALK)}. Start from 5, 4, … and walk the same cycle again.`, panels: [gp(F_N, F_E, F_POS, { directed: true, st: { ...states(F_WALK, 'visited'), 3: 'bad' } }), arr(F_WALK, { label: 'walk from 6', highlights: { 3: 'bad', [F_WALK.length - 1]: 'bad' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Peel leaves with in-degree (Kahn)',
        lines: ['Leaves have in-degree 0: queue them.', 'Pop u: `depth[f[u]] = max(depth[f[u]], depth[u] + 1)`, `indeg[f[u]]--`; at 0, push it.', 'Nodes never peeled (indeg > 0) lie on cycles.'],
        frames: F_FRAMES,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"exactly one outgoing edge"**, **"each person has exactly one favorite"**, **"edges[i] is the node i points to"**, **"longest cycle"**.', 'Round table, everyone next to their favourite: **max(longest cycle, sum over 2-cycles a ↔ b of 2 + depth[a] + depth[b])**.'],
        frames: [
          { say: 0, note: 'The shape is always cycles + in-trees: Kahn peeling + walking the cycles is O(n).', panels: [vars({ 'walk from all': 'O(n²)', peeling: 'O(n)' })] },
          { say: 1, note: 'A big cycle fills a whole table alone. Pairs with their chains are open lines: all of them fit together.', panels: [vars({ 'cycle ≥ 3': 'one table, no extras', '2-cycles': 'sum them all' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: who comes to the meeting?',
        lines: [`e.g. favorite = ${list(M_F)}. Peeling gives depth = ${list(M.depth)}.`, 'Pair 0 ↔ 1 with chains 2 → 0 and 3 → 1; a 3-cycle 4 → 5 → 6 → 4.'],
        panels: [gp(M_N, M_F.map((v, i) => [i, v]), M_POS, { directed: true, st: { 0: 'active', 1: 'active', 4: 'done', 5: 'done', 6: 'done' } }), arr(M.depth, { label: 'depth' })],
        task: {
          type: 'choose',
          question: 'What is the most people at one round table?',
          options: [
            { text: `${M_ANS} = max(${M_CYCLE}, 2 + ${M.depth[0]} + ${M.depth[1]}): the pair with both chains` },
            { text: `${M_N}: seat the pair line and the 3-cycle together`, why: 'A cycle of length ≥ 3 closes on itself: it fills a table alone and cannot be combined with pairs.' },
            { text: `${M_CYCLE}: the longest cycle`, why: 'The 2-cycle carries chains: 2 → 0 ↔ 1 ← 3 seats 4 people.' },
            { text: '2: only the mutual pair', why: 'Each side of a pair can have a chain of people behind it: add depth[0] + depth[1].' },
          ],
          answer: 0,
        },
        solved: 'Several 2-cycles (with chains) add up, but only **one** longer cycle can be used.',
      },
    ],
  },

  {
    id: 'adv-graph-meta-bfs',
    title: 'Count buses, not stops: BFS over whole routes',
    steps: [
      {
        kind: 'watch',
        title: 'An edge for every pair of stops',
        lines: ['Riding inside a route is free; each bus boarded costs 1.', 'Joining every pair of stops on a route: **O(L²)** edges per route.'],
        frames: [
          { say: 0, note: `e.g. routes ${R.map(list).join(' ')}. Fewest buses from stop ${R_SRC} to stop ${R_DST}?`, panels: [gp(STOPS.length, S_E, S_POS, { lab: STOPS, st: { [sid(R_SRC)]: 'active', [sid(R_DST)]: 'done' } }), table(RT_LAB, ['stops'], R.map((r) => [seq(r)]))] },
          { say: 1, note: `Pairs of stops: ${S_E.length} edges already. A route with 10^5 stops makes 5·10^9.`, panels: [gp(STOPS.length, S_E, S_POS, { lab: STOPS, es: Object.fromEntries(S_E.map(([a, b]) => [`${a}-${b}`, 'bad'])) }), vars({ 'pair edges': S_E.length, routes: R.length })] },
        ],
      },
      {
        kind: 'watch',
        title: 'One BFS level = one more bus',
        lines: ['Index `stop → routes`.', 'Level k: for each frontier stop, board every **unused** route, mark it used, add its new stops.', 'The level where the target appears is the number of buses.'],
        frames: [
          { say: 0, note: 'Build the index once: which routes pass each stop.', panels: [table(['routes'], STOPS.map(String), [STOPS.map((x) => routesOf(x).map((g) => `R${g}`).join(' '))]), gp(R.length, RT_E, RT_POS, { label: 'routes', lab: RT_LAB })] },
          { say: 1, note: `Level 1: stop 1 boards R0, marked used. New stops: ${seq(L1.next)}.`, panels: mgPanels(L1.seen, L1.next, L1.used, [0], L1.next, 'next frontier') },
          { say: 1, note: `Level 2: 3 boards R3, 5 boards R1; R0 is used, skipped. New: ${seq(L2.next)}.`, panels: mgPanels(L2.seen, L2.next, L2.used, [3, 1], L2.next, 'next frontier') },
          { say: 2, note: `Level 3: 4's only route R3 is used: skip. 2 boards R2, which holds ${R_DST}. Answer: ${MG.answer} buses.`, panels: mgPanels([...L3.seen, R_DST], [R_DST], L3.used, [2], L3.frontier, 'frontier') },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"least number of buses"**, **"minimum transfers"**, **"each route is a cycle of stops"**.'],
        frames: [{ say: 0, note: 'Each route is expanded once and each stop enqueued once: O(sum of route lengths).', panels: [vars({ 'pair edges': 'O(L²) per route', 'route BFS': 'O(sum of lengths)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: a route seen before',
        lines: [`Level 3 starts with frontier ${seq(L3.frontier)}.`, `Stop 4's only route is R3; used so far: ${usedIds(L3_BEFORE_USED).join(', ')}.`],
        panels: mgPanels(L2.seen, [4], L3_BEFORE_USED, [], L3.frontier, 'frontier'),
        task: {
          type: 'choose',
          question: 'What does the BFS do with R3 from stop 4?',
          options: [
            { text: 'Skip it: R3 was boarded at level 2, the cheapest it can ever be' },
            { text: 'Board it again: stop 4 may lead somewhere new', why: "R3's stops were all added at level 2. Rescanning finds nothing and costs O(L) each time: O(routes²·L)." },
            { text: 'Return −1: stop 4 is a dead end', why: 'Other frontier stops (2, 8, 6) still wait their turn at this level.' },
          ],
          answer: 0,
        },
        solved: 'Mark a **route** used the first time: BFS levels only grow, so it is never cheaper later.',
        then: [{ note: `Stop 2 boards R2 and finds ${R_DST}: ${MG.answer} buses, the same as a BFS on the route graph.`, panels: mgPanels([...L3.seen, R_DST], [R_DST], L3.used, [2], L3.frontier, 'frontier') }],
      },
    ],
  },
];
