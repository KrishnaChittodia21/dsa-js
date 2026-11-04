// Step lessons for Graphs, part 1 (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every adjacency list, visit order, stack / queue content and dist value below comes from running the
// lesson's own code (adjacency lists built in edge order, exactly like the lesson) on the example graph.
// Part 2 (grids, multi-source, bidirectional, bipartite, state space, labeling, template, implementation, dry run,
// mistakes, tips) lives in steps-2.js.
import secondPart from './steps-2.js';
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const list = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`graphs/steps.js: ${msg}`);
};

// ---------- graph drawing ----------
// pos: [x, y] per vertex. o.st: vertex → state, o.es: 'u-v' → edge state (either order when undirected),
// o.lab: vertex → label, o.el: 'u-v' → edge label, o.directed, o.label
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.directed ? { directed: true } : {}),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(o.lab?.[i] ?? i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v]) => {
    const s = o.es?.[`${u}-${v}`] ?? (o.directed ? undefined : o.es?.[`${v}-${u}`]);
    const l = o.el?.[`${u}-${v}`] ?? o.el?.[`${v}-${u}`];
    return { from: u, to: v, ...(s ? { state: s } : {}), ...(l !== undefined ? { label: String(l) } : {}) };
  }),
});
const ek = (pairs, s) => Object.fromEntries(pairs.map(([u, v]) => [`${u}-${v}`, s]));

// the lesson's adjacency list: one array per vertex, pushed in edge order
function adjOf(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u);
  }
  return adj;
}

// the lesson's BFS distances (template-bfs), recording each pop
function bfsRun(n, adj, s) {
  const dist = new Array(n).fill(-1);
  dist[s] = 0;
  const queue = [s];
  const pops = [];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const found = [];
    for (const v of adj[u]) {
      if (dist[v] !== -1) continue;
      dist[v] = dist[u] + 1;
      queue.push(v);
      found.push(v);
    }
    pops.push({ u, head, found, dist: dist.slice(), queue: queue.slice() });
  }
  return { dist, order: queue, pops };
}

// the lesson's recursive DFS (mark on entry), recording enter / return events and skipped neighbours
function dfsRun(n, adj, s, visited = new Uint8Array(n)) {
  const ev = [];
  const path = [];
  const order = [];
  let skipped = [];
  const dfs = (u, from) => {
    visited[u] = 1;
    path.push(u);
    order.push(u);
    ev.push({ t: 'enter', u, from, skipped, path: path.slice(), visited: Array.from(visited) });
    skipped = [];
    for (const v of adj[u]) {
      if (!visited[v]) dfs(v, u);
      else skipped.push(v);
    }
    path.pop();
    ev.push({ t: 'ret', u, skipped, path: path.slice(), visited: Array.from(visited) });
    skipped = [];
  };
  dfs(s, null);
  return { ev, order };
}

// the lesson's iterative DFS (template-dfs): mark when pushing, pop from the end
function iterRun(n, adj, start) {
  const visited = new Uint8Array(n);
  const stack = [start];
  visited[start] = 1;
  const pops = [];
  while (stack.length) {
    const u = stack.pop();
    const pushed = [];
    for (const v of adj[u]) if (!visited[v]) { visited[v] = 1; stack.push(v); pushed.push(v); }
    pops.push({ u, pushed, stack: stack.slice() });
  }
  return { pops, order: pops.map((p) => p.u) };
}

// ---------- the intuition graph (the lesson's own example) ----------
const G7E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [5, 6], [4, 6]];
const G7P = [[2, 0], [1, 1], [3, 1], [0.4, 2], [1.6, 2], [3, 2], [2.4, 3]];
const G7A = adjOf(7, G7E);
const G7D = dfsRun(7, G7A, 0);
const G7B = bfsRun(7, G7A, 0);
check(seq(G7D.order) === '0, 1, 3, 4, 6, 5, 2', 'intuition DFS order (caption)');
check(seq(G7B.dist) === '0, 1, 1, 2, 2, 2, 3', 'intuition BFS layers (caption)');
const G7I = iterRun(7, G7A, 0);
check(seq(G7I.order) === '0, 2, 5, 6, 4, 1, 3', 'iterative DFS order');

// ---------- what ----------
const W5E = [[0, 1], [1, 2], [2, 0], [3, 4]];
const W5P = [[0, 0], [2, 0], [1, 1.3], [3.4, 0], [4.2, 1.3]];
const w5 = (o) => gp(5, W5E, W5P, o);
const DIR4E = [[0, 1], [0, 2], [1, 2], [3, 2]];
const DIR4P = [[0, 0], [2, 0], [2, 1.5], [0, 1.5]];
const degTable = (n, edges, k) => {
  const ind = Array(n).fill(0);
  const outd = Array(n).fill(0);
  for (const [u, v] of edges) { outd[u]++; ind[v]++; }
  return table(Array.from({ length: n }, (_, i) => String(i)), ['in', 'out'], ind.map((x, i) => [x, outd[i]]), ind.map((_, i) => (i === k ? ['active', 'active'] : ['', ''])), 'degrees');
};
const T4E = [[0, 1], [1, 2], [2, 0], [2, 3], [1, 3]];
const T4P = [[0, 0], [2, 0], [1, 1.4], [3, 1.4]];
const T4IN3 = T4E.filter(([, v]) => v === 3).length;
check(T4IN3 === 2, 'in-degree of 3');

// ---------- why ----------
const CYE = [[0, 1], [1, 2], [2, 0]];
const CYP = [[0, 0], [2, 0], [1, 1.4]];
const cy = (o) => gp(3, CYE, CYP, o);
const WALK = [0, 1, 2, 0, 1, 2, 0]; // the lesson's 0 → 1 → 2 → 0 → 1 → … walk
const WHY4E = [[0, 1], [0, 2], [1, 2], [2, 3]];
const WHY4A = adjOf(4, WHY4E);
const WHY4SCAN = WHY4A.reduce((a, l) => a + l.length, 0);
check(WHY4SCAN === 2 * WHY4E.length, '2m entries');

// ---------- representations: the lesson's code ----------
const R4E = [[0, 1], [1, 2], [2, 0], [2, 3]];
const R4P = [[0, 0], [2, 0], [1, 1.3], [2.6, 2.2]];
const R4A = adjOf(4, R4E);
check(JSON.stringify(R4A) === '[[1,2],[0,2],[1,0,3],[2]]', 'lesson adj');
const R4M = Array.from({ length: 4 }, () => Array(4).fill(0));
for (const [u, v] of R4E) R4M[u][v] = R4M[v][u] = 1;
function adjBuildFrames() {
  const adj = Array.from({ length: 4 }, () => []);
  const show = (k, touched) =>
    table(['0', '1', '2', '3'], ['adj[u]'], adj.map((l) => [l.length ? list(l) : '[]']), adj.map((_, i) => [touched.includes(i) ? 'active' : '']));
  const edgesArr = (k) => arr(R4E.map(([u, v]) => `${u}-${v}`), { label: 'edges', ...(k >= 0 ? { pointers: [ptr(k, 'e')] } : {}), highlights: hl(R4E.length, (i) => (i === k ? 'active' : i < k ? 'done' : '')) });
  const frames = [{ say: 0, note: 'Start: every vertex gets its OWN empty array.', panels: [edgesArr(-1), show(-1, []), gp(4, [], R4P)] }];
  R4E.forEach(([u, v], k) => {
    adj[u].push(v);
    adj[v].push(u);
    frames.push({ say: 1, note: `Edge [${u},${v}]: push ${v} into adj[${u}] and ${u} into adj[${v}].`, panels: [edgesArr(k), show(k, [u, v]), gp(4, R4E.slice(0, k + 1), R4P, { st: { [u]: 'active', [v]: 'active' }, es: { [`${u}-${v}`]: 'active' } })] });
  });
  frames.push({ say: 2, note: `Done: adj = ${list(adj.map(list))}. Neighbours of 2: just read adj[2].`, panels: [show(4, [2]), gp(4, R4E, R4P, { st: { 2: 'active', 0: 'visited', 1: 'visited', 3: 'visited' } })] });
  return frames;
}
const matPanel = (filled, st = {}) =>
  table(['0', '1', '2', '3'], ['0', '1', '2', '3'], R4M.map((row, i) => row.map((x, j) => (filled.some(([u, v]) => (u === i && v === j) || (u === j && v === i)) ? x : 0))), R4M.map((row, i) => row.map((_, j) => st[`${i},${j}`] || '')), 'mat[u][v]');
const R3E = [[3, 1], [0, 3], [3, 2]];
const R3A = adjOf(4, R3E);
check(seq(R3A[3]) === '1, 0, 2', 'adj[3] order');

// ---------- recognize: a word graph (change one letter) ----------
const WORDS = ['cat', 'cot', 'cut', 'cog', 'dog'];
const oneOff = (a, b) => [...a].filter((ch, i) => ch !== b[i]).length === 1;
const WE = [];
for (let i = 0; i < WORDS.length; i++) for (let j = i + 1; j < WORDS.length; j++) if (oneOff(WORDS[i], WORDS[j])) WE.push([i, j]);
const WP = [[0, 1], [1, 0], [1, 2], [2, 0], [3, 0]];
const wg = (edges, o = {}) => gp(5, edges, WP, { ...o, lab: WORDS });
const WB = bfsRun(5, adjOf(5, WE), 0);
check(WB.dist[4] === 3 && WE.length === 5, 'word ladder');

// ---------- brute force: all simple paths, the lesson's code ----------
const BFE = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]];
const BFP = [[0, 1], [1, 0], [1, 2], [2, 1]];
function bruteRun(n, adj, s, t) {
  let best = Infinity;
  const onPath = [s];
  const arrive = Array(n).fill(0);
  arrive[s] = 1;
  const frames = [];
  const lens = [];
  const snap = (say, note, u) =>
    frames.push({
      say,
      note,
      panels: [
        gp(n, BFE, BFP, { st: { ...states(onPath, 'visited'), [u]: u === t ? 'done' : 'active' }, es: ek(onPath.slice(1).map((x, i) => [onPath[i], x]), 'active') }),
        arr(arrive.slice(), { label: 'times reached', highlights: { [u]: 'active' } }),
        vars({ len: onPath.length - 1, best: best === Infinity ? '∞' : best }),
      ],
    });
  const go = (u, len) => {
    if (u === t) {
      best = Math.min(best, len);
      lens.push(len);
      snap(1, `Reached t = ${t} via ${onPath.join('→')}: len ${len}, best = ${best}.`, u);
      return;
    }
    for (const v of adj[u]) {
      if (onPath.includes(v)) continue;
      onPath.push(v);
      arrive[v]++;
      if (v !== t) snap(0, `Extend the path to ${v}: ${onPath.join('→')}.`, v);
      go(v, len + 1);
      onPath.pop();
    }
  };
  snap(0, `Start at s = ${s}.`, s);
  go(s, 0);
  return { frames, best, arrive, lens };
}
const BR = bruteRun(4, adjOf(4, BFE), 0, 3);
check(BR.best === 2 && seq(BR.arrive) === '1, 2, 2, 4' && seq(BR.lens) === '3, 2, 3, 2', 'brute force');
check(seq(G7B.order) === '0, 1, 2, 3, 4, 5, 6', 'intuition turn order');
// the turn graph: one more vertex
const BT5E = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [2, 4]];
const BT5P = [[0, 1], [1, 0], [1, 2], [2, 1], [3, 2]];
let BT5PATHS = 0;
{
  const adj = adjOf(5, BT5E);
  const on = new Set([0]);
  const go = (u) => {
    if (u === 4) { BT5PATHS++; return; }
    for (const v of adj[u]) if (!on.has(v)) { on.add(v); go(v); on.delete(v); }
  };
  go(0);
}
check(BT5PATHS === 7, 'paths to 4');

// ---------- optimized-dfs ----------
const DE = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]];
const DP = [[1, 0], [0, 1], [2, 1], [1, 2], [1, 3]];
const DR = dfsRun(5, adjOf(5, DE), 0);
check(seq(DR.order) === '0, 1, 3, 2, 4', 'dfs order');
function dfsFrames() {
  const done = [];
  const treeEdges = [];
  return DR.ev.map((e) => {
    if (e.t === 'ret') done.push(e.u);
    else if (e.from !== null) treeEdges.push([e.from, e.u]);
    const sk = e.skipped.length ? ` (${seq(e.skipped)} already visited: skip.)` : '';
    const note =
      e.t === 'enter'
        ? e.from === null
          ? `dfs(${e.u}): mark ${e.u} visited first.`
          : `${e.from} has an unvisited neighbour ${e.u}.${sk} dfs(${e.u}): mark ${e.u}.`
        : `${e.u}: no unvisited neighbours left.${sk} Return${e.path.length ? ` to ${e.path[e.path.length - 1]}` : ': done'}.`;
    return {
      say: e.t === 'enter' ? (e.from === null ? 0 : 1) : 2,
      note,
      panels: [
        gp(5, DE, DP, { st: { ...states(e.path, 'visited'), ...states(done, 'done'), ...(e.t === 'enter' ? { [e.u]: 'active' } : {}) }, es: ek(treeEdges, 'done') }),
        stk(e.path.map((u) => `dfs(${u})`), 'call stack'),
        arr(e.visited, { label: 'visited', highlights: { [e.u]: 'active' } }),
      ],
    };
  });
}
// components: the lesson's outer loop
const CE = [[0, 1], [1, 2], [3, 4]];
const CP = [[0, 0], [1, 0], [0.5, 1], [2.2, 0], [2.2, 1], [3.2, 0.5]];
function compFrames() {
  const n = 6;
  const adj = adjOf(n, CE);
  const visited = new Uint8Array(n);
  const comp = Array(n).fill(null);
  let count = 0;
  const frames = [];
  const colours = ['done', 'visited', 'active'];
  const pic = (s) => gp(n, CE, CP, { st: Object.fromEntries(comp.map((c, i) => [i, c === null ? '' : colours[c]]).filter(([, x]) => x)) });
  for (let s = 0; s < n; s++) {
    if (visited[s]) {
      frames.push({ say: 1, note: `s = ${s}: already visited, skip.`, panels: [pic(s), arr(Array.from(visited), { label: 'visited', pointers: [ptr(s, 's')] }), vars({ count })] });
      continue;
    }
    count++;
    const { order } = dfsRun(n, adj, s, visited);
    for (const u of order) comp[u] = count - 1;
    frames.push({ say: 0, note: `s = ${s}: unvisited → count = ${count}. dfs(${s}) marks ${seq(order)}.`, panels: [pic(s), arr(Array.from(visited), { label: 'visited', pointers: [ptr(s, 's')], highlights: states(order, 'active') }), vars({ count })] });
  }
  return { frames, count };
}
const COMP = compFrames();
check(COMP.count === 3, 'components');
const C7E = [[0, 4], [1, 2], [2, 5], [3, 6]];
const C7P = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1], [3, 1]];
const C7STARTS = [];
{
  const adj = adjOf(7, C7E);
  const vis = new Uint8Array(7);
  for (let s = 0; s < 7; s++) if (!vis[s]) { C7STARTS.push(s); dfsRun(7, adj, s, vis); }
}
check(seq(C7STARTS) === '0, 1, 3', 'component starts');
// cycle detection, the lesson's hasCycleUndirected
const YE = [[0, 1], [1, 2], [2, 3], [3, 1]];
const YP = [[0, 0], [1, 0], [2, 0.8], [1, 1.6]];
function cycleFrames() {
  const n = 4;
  const adj = adjOf(n, YE);
  const visited = new Uint8Array(n);
  const frames = [];
  const path = [];
  const tree = [];
  const pic = (u, extra = {}) => gp(n, YE, YP, { st: { ...states(path, 'visited'), [u]: 'active', ...extra.st }, es: { ...ek(tree, 'done'), ...extra.es } });
  const dfs = (u, parent) => {
    visited[u] = 1;
    path.push(u);
    frames.push({ say: 0, note: `dfs(${u}, parent ${parent}): mark ${u}.`, panels: [pic(u), vars({ u, parent })] });
    for (const v of adj[u]) {
      if (!visited[v]) { tree.push([u, v]); if (dfs(v, u)) return true; }
      else if (v !== parent) {
        frames.push({ say: 2, note: `${v} is visited and is NOT the parent (${parent}): a second route → cycle.`, panels: [pic(u, { st: { [v]: 'bad' }, es: { [`${u}-${v}`]: 'active' } }), vars({ u, v, parent, returns: 'true' })] });
        return true;
      } else frames.push({ say: 1, note: `${v} is visited, but it is the parent: just the edge we came along.`, panels: [pic(u, { es: { [`${u}-${v}`]: 'muted' } }), vars({ u, v, parent })] });
    }
    path.pop();
    return false;
  };
  const r = dfs(0, -1);
  return { frames, r };
}
const CYC = cycleFrames();
check(CYC.r === true, 'cycle found');
const SQE = [[0, 1], [1, 2], [2, 3], [3, 0]];
const SQP = [[0, 0], [1, 0], [1, 1], [0, 1]];
check(seq(adjOf(4, SQE)[3]) === '2, 0' && seq(dfsRun(4, adjOf(4, SQE), 0).order) === '0, 1, 2, 3', 'square cycle');

// ---------- template-dfs: iterative, on the intuition graph ----------
function iterFrames() {
  const vis = new Set([0]);
  const out = [];
  const frames = [{ say: 0, note: 'Start: push 0 and mark it right away.', panels: [gp(7, G7E, G7P, { st: { 0: 'visited' } }), stk([0]), arr([], { label: 'popped' })] }];
  for (const p of G7I.pops) {
    out.push(p.u);
    p.pushed.forEach((v) => vis.add(v));
    frames.push({
      say: p.pushed.length ? 2 : 1,
      note: `pop() → ${p.u}.${p.pushed.length ? ` Unvisited neighbours ${seq(p.pushed)}: mark + push.` : ' Nothing new to push.'}`,
      panels: [gp(7, G7E, G7P, { st: { ...states([...vis], 'visited'), ...states(out, 'done'), [p.u]: 'active' } }), stk(p.stack.slice()), arr(out.slice(), { label: 'popped', highlights: { [out.length - 1]: 'active' } })],
    });
  }
  frames.push({ say: 3, note: `Iterative: ${seq(G7I.order)}. Recursive: ${seq(G7D.order)}. Same vertices, different order.`, panels: [gp(7, G7E, G7P, { st: states([0, 1, 2, 3, 4, 5, 6], 'done') }), arr(G7I.order, { label: 'iterative' }), arr(G7D.order, { label: 'recursive' })] });
  return frames;
}
const IT6E = [[0, 1], [0, 2], [1, 3], [2, 4], [2, 5]];
const IT6P = [[1, 0], [0, 1], [2, 1], [0, 2], [1.5, 2], [2.5, 2]];
const IT6 = iterRun(6, adjOf(6, IT6E), 0);
check(seq(IT6.order) === '0, 2, 5, 4, 1, 3', 'iterative turn order');

// ---------- implementation-dfs: recursion depth on an all-land grid ----------
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function gridDepth(R, C) {
  const seen = Array.from({ length: R }, () => Array(C).fill(0));
  const path = [];
  const steps = [];
  let max = 0;
  const dfs = (r, c) => {
    seen[r][c] = 1;
    path.push([r, c]);
    max = Math.max(max, path.length);
    steps.push({ path: path.slice(), depth: path.length });
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc]) dfs(nr, nc);
    }
    path.pop();
  };
  dfs(0, 0);
  return { steps, max };
}
const GD3 = gridDepth(3, 3);
const GD4 = gridDepth(4, 4);
check(GD3.max === 9 && GD4.max === 16, 'grid depth');

// ---------- optimized-bfs ----------
const BE = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6]];
const BP = [[1, 0], [0, 1], [2, 1], [1, 2], [2.6, 2], [1.8, 3], [1.8, 4]];
const BB = bfsRun(7, adjOf(7, BE), 0);
check(seq(BB.dist) === '0, 1, 1, 2, 2, 3, 4', 'bfs dist');
function bfsFrames(n, edges, pos, run, s) {
  const tree = [];
  const frames = [
    {
      say: 0,
      note: `dist[${s}] = 0, queue = [${s}]. Everything else is -1 (unknown).`,
      panels: [gp(n, edges, pos, { st: { [s]: 'visited' } }), que([s]), arr([...Array(n)].map((_, i) => (i === s ? 0 : -1)), { label: 'dist', highlights: { [s]: 'active' } })],
    },
  ];
  run.pops.forEach((p, k) => {
    p.found.forEach((v) => tree.push([p.u, v]));
    const waiting = p.queue.slice(p.head + 1);
    const popped = run.order.slice(0, p.head);
    frames.push({
      say: p.found.length ? 2 : 1,
      note: `Pop ${p.u} (dist ${p.dist[p.u]}).${p.found.length ? ` New: ${seq(p.found)} → dist ${p.dist[p.u] + 1}, push.` : ' No unknown neighbours.'} Queue dists: ${waiting.length ? list(waiting.map((v) => p.dist[v])) : 'empty'}.`,
      panels: [
        gp(n, edges, pos, { st: { ...states(waiting, 'visited'), ...states(popped, 'done'), [p.u]: 'active' }, es: ek(tree, 'done') }),
        que(waiting),
        arr(p.dist.slice(), { label: 'dist', highlights: { ...states(p.found, 'active') } }),
      ],
    });
    if (k === run.pops.length - 1) frames[frames.length - 1].say = 3;
  });
  return frames;
}
const B6E = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3], [3, 5]];
const B6P = [[0, 0], [1, 0], [2, 0], [2, 1], [0, 1], [3, 1]];
const B6 = bfsRun(6, adjOf(6, B6E), 0);
check(B6.dist[5] === 3, 'dist to 5');
const WTE = [[0, 1], [1, 2], [2, 3], [0, 3]]; // s = 0, t = 3: three edges of cost 1, or one edge of cost 10
const WTP = [[0, 0], [1, 1], [2, 1], [3, 0]];
const WTW = { '0-1': 1, '1-2': 1, '2-3': 1, '0-3': 10 };
const WTB = bfsRun(4, adjOf(4, WTE), 0);
check(WTB.dist[3] === 1, 'BFS finds t via the direct edge');

// ---------- template-bfs ----------
const TBE = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]];
const TBP = DP;
const TB = bfsRun(5, adjOf(5, TBE), 0);
check(seq(TB.order) === '0, 1, 2, 3, 4', 'head bfs');
function headFrames() {
  const frames = [{ say: 0, note: 'queue = [0], head = 0. The array only grows.', panels: [gp(5, TBE, TBP, { st: { 0: 'visited' } }), arr([0], { label: 'queue array', pointers: [ptr(0, 'head')] }), arr([0, -1, -1, -1, -1], { label: 'dist' })] }];
  TB.pops.forEach((p) => {
    const q = p.queue;
    const next = p.head + 1;
    frames.push({
      say: 1,
      note: `u = queue[${p.head}] = ${p.u}.${p.found.length ? ` Push ${seq(p.found)}.` : ''} head → ${next}.`,
      panels: [
        gp(5, TBE, TBP, { st: { ...states(q.slice(next), 'visited'), ...states(q.slice(0, p.head), 'done'), [p.u]: 'active' } }),
        arr(q.slice(), { label: 'queue array', pointers: [ptr(p.head, 'head')], highlights: hl(q.length, (i) => (i < p.head ? 'muted' : i === p.head ? 'active' : '')) }),
        arr(p.dist.slice(), { label: 'dist', highlights: states(p.found, 'active') }),
      ],
    });
  });
  frames.push({ say: 2, note: 'head = 5 = queue.length: loop ends. Nothing was ever shifted.', panels: [arr(TB.order, { label: 'queue array', highlights: hl(5, () => 'muted') }), arr(TB.dist, { label: 'dist', highlights: hl(5, () => 'done') })] });
  return frames;
}
function levelFrames(n, edges, pos, start, target) {
  const adj = adjOf(n, edges);
  const seen = new Set([start]);
  let level = 0;
  let frontier = [start];
  const frames = [];
  const done = [];
  while (frontier.length) {
    if (frontier.includes(target)) {
      frames.push({ say: 2, note: `Level ${level}: ${target} is in the frontier → return ${level}.`, panels: [gp(n, edges, pos, { st: { ...states(done, 'done'), ...states(frontier, 'visited'), [target]: 'active' } }), arr(frontier, { label: 'frontier', highlights: { [frontier.indexOf(target)]: 'active' } }), vars({ level, returns: level })] });
      return { frames, ans: level };
    }
    const next = [];
    for (const u of frontier) for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); next.push(v); }
    frames.push({ say: 1, note: `Level ${level}: frontier ${list(frontier)}. Unseen neighbours → next = ${list(next)}.`, panels: [gp(n, edges, pos, { st: { ...states(done, 'done'), ...states(frontier, 'active'), ...states(next, 'visited') } }), arr(frontier, { label: 'frontier' }), vars({ level, next: list(next) })] });
    done.push(...frontier);
    frontier = next;
    level++;
  }
  return { frames, ans: -1 };
}
const LV = levelFrames(5, TBE, TBP, 0, 4);
check(LV.ans === 3, 'level bfs');
const LT6E = [[0, 1], [0, 2], [1, 3], [2, 4], [4, 5], [3, 5]];
const LT6P = [[0, 1], [1, 0], [1, 2], [2, 0], [2, 2], [3, 1]];
const LT6 = levelFrames(6, LT6E, LT6P, 0, 5);
check(LT6.ans === 3, 'level turn');
const OT6E = [[0, 3], [0, 1], [3, 4], [1, 2], [1, 4], [4, 5]];
const OT6P = [[1, 0], [0, 1], [0, 2], [2, 1], [1, 2], [2, 3]];
const OT6 = bfsRun(6, adjOf(6, OT6E), 0);
check(seq(OT6.order) === '0, 3, 1, 4, 2, 5', 'head order turn');

// ---------- implementation-bfs: shift() moves every remaining element ----------
function shiftFrames(items) {
  const q = items.slice();
  let moves = 0;
  const frames = [{ say: 0, note: `queue = ${list(q)}.`, panels: [arr(q.slice(), { label: 'queue (shift)' }), vars({ moves })] }];
  while (q.length) {
    const u = q.shift();
    moves += q.length;
    frames.push({ say: 0, note: `shift() → ${u}. The ${q.length} element${q.length === 1 ? '' : 's'} behind it move one slot left.`, panels: [q.length ? arr(q.slice(), { label: 'queue (shift)', highlights: hl(q.length, () => 'bad') }) : arr([], { label: 'queue (shift)' }), vars({ took: u, moves })] });
  }
  return { frames, moves };
}
const SH = shiftFrames(['a', 'b', 'c', 'd', 'e']);
check(SH.moves === 10, 'shift moves');
const SH6 = 5 + 4 + 3 + 2 + 1;

export default {
  what: [
    {
      kind: 'watch',
      title: 'Things plus connections',
      lines: ['A **vertex** is one thing, numbered `0..n-1`.', 'An **edge** `[u, v]` connects two vertices.', '**Neighbours** of u: vertices joined to u by an edge.', 'A **path**: each consecutive pair is an edge.', 'A **cycle**: a path back to its start without reusing an edge.', 'A **connected component**: a maximal group where everyone reaches everyone.'],
      frames: [
        { say: 0, note: 'Five vertices, no edges yet.', panels: [gp(5, [], W5P)] },
        ...W5E.map(([u, v], k) => ({ say: 1, note: `Edge [${u},${v}].`, panels: [gp(5, W5E.slice(0, k + 1), W5P, { st: { [u]: 'active', [v]: 'active' }, es: { [`${u}-${v}`]: 'active' } })] })),
        { say: 2, note: 'Neighbours of 2: 1 and 0.', panels: [w5({ st: { 2: 'active', 0: 'visited', 1: 'visited' }, es: ek([[1, 2], [2, 0]], 'active') })] },
        { say: 3, note: 'A path: 0 → 1 → 2. Each consecutive pair is an edge.', panels: [w5({ st: states([0, 1, 2], 'visited'), es: ek([[0, 1], [1, 2]], 'active') })] },
        { say: 4, note: '0 → 1 → 2 → 0: back at the start. A cycle.', panels: [w5({ st: states([0, 1, 2], 'active'), es: ek(CYE, 'done') })] },
        { say: 5, note: 'Two components: {0, 1, 2} and {3, 4}. No edge joins them.', panels: [w5({ st: { ...states([0, 1, 2], 'done'), ...states([3, 4], 'visited') } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Directed edges split the degree',
      lines: ['A **directed** edge `u → v` works one way only.', '**In-degree**: edges coming in. **Out-degree**: edges going out.'],
      frames: [
        { say: 0, note: 'Edges 0→1, 0→2, 1→2, 3→2.', panels: [gp(4, DIR4E, DIR4P, { directed: true }), degTable(4, DIR4E, -1)] },
        { say: 1, note: 'Vertex 2: three edges come in, none go out.', panels: [gp(4, DIR4E, DIR4P, { directed: true, st: { 2: 'active' }, es: ek([[0, 2], [1, 2], [3, 2]], 'active') }), degTable(4, DIR4E, 2)] },
        { say: 1, note: 'Vertex 0: two go out, none come in.', panels: [gp(4, DIR4E, DIR4P, { directed: true, st: { 0: 'active' }, es: ek([[0, 1], [0, 2]], 'active') }), degTable(4, DIR4E, 0)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: in-degree',
      lines: ['Count the arrows that **end** at vertex 3.'],
      panels: [gp(4, T4E, T4P, { directed: true, st: { 3: 'active' } })],
      task: { type: 'number', question: 'What is the in-degree of vertex 3?', options: [0, 1, 2, 3], answer: T4IN3, hint: 'Look for edges u → 3. Edges leaving 3 would count as out-degree.' },
      solved: '2 → 3 and 1 → 3 come in: in-degree 2. Vertex 3 has out-degree 0.',
      then: [{ say: 0, note: 'The two edges into 3.', panels: [gp(4, T4E, T4P, { directed: true, st: { 3: 'active', 1: 'visited', 2: 'visited' }, es: ek([[2, 3], [1, 3]], 'active') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: which kind of edge?',
      lines: ['On a social app, A follows B.', 'B does **not** follow A back.'],
      panels: [gp(2, [[0, 1]], [[0, 0], [2, 0]], { directed: true, lab: ['A', 'B'] })],
      task: {
        type: 'choose',
        question: 'What kind of edge is "A follows B"?',
        options: [
          { text: 'Directed', why: '' },
          { text: 'Undirected', why: 'An undirected edge works both ways, like a friendship. Here B does not follow A.' },
          { text: 'Weighted', why: 'Weighted means the edge carries a number (distance, cost). Following has no number.' },
        ],
        answer: 0,
      },
      solved: '"A follows B" is a one-way edge A → B: directed.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Following edges around a cycle',
      lines: ['A graph may contain **cycles**.', 'Just following edges, you walk around the cycle forever.', 'With `visited`, the second arrival at a vertex is ignored.'],
      frames: [
        { say: 0, note: 'The cycle 0 – 1 – 2 – 0.', panels: [cy({}), arr([], { label: 'walk' })] },
        ...WALK.slice(1).map((u, k) => {
          const w = WALK.slice(0, k + 2);
          return { say: 1, note: k < 2 ? `Follow an edge to ${u}.` : `Back at ${u} again, and the walk goes on…`, panels: [cy({ st: { [u]: k >= 2 ? 'bad' : 'active' }, es: { [`${WALK[k]}-${u}`]: 'active' } }), arr(w, { label: 'walk', highlights: hl(w.length, (i) => (i >= 3 ? 'bad' : '')) })] };
        }),
        { say: 2, note: 'With visited: mark 0.', panels: [cy({ st: { 0: 'active' } }), arr([1, 0, 0], { label: 'visited', highlights: { 0: 'active' } })] },
        { say: 2, note: 'Mark 1.', panels: [cy({ st: { 0: 'done', 1: 'active' }, es: { '0-1': 'done' } }), arr([1, 1, 0], { label: 'visited', highlights: { 1: 'active' } })] },
        { say: 2, note: 'Mark 2.', panels: [cy({ st: { 0: 'done', 1: 'done', 2: 'active' }, es: { '0-1': 'done', '1-2': 'done' } }), arr([1, 1, 1], { label: 'visited', highlights: { 2: 'active' } })] },
        { say: 2, note: '2 – 0 leads to 0, but visited[0] = 1: ignored. Each vertex once.', panels: [cy({ st: { 0: 'done', 1: 'done', 2: 'done' }, es: { '0-1': 'done', '1-2': 'done', '2-0': 'muted' } }), arr([1, 1, 1], { label: 'visited', highlights: { 0: 'done', 1: 'done', 2: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'No natural order to walk',
      lines: ['Some parts of a graph may not be connected at all.', 'Following edges from one start can **miss** them completely.'],
      frames: [
        { say: 0, note: 'Vertex 3 has no edge to 0, 1 or 2.', panels: [gp(4, CYE, [...CYP, [3, 0.7]])] },
        { say: 1, note: 'From 0, edges reach 1 and 2. Vertex 3 is never reached.', panels: [gp(4, CYE, [...CYP, [3, 0.7]], { st: { 0: 'done', 1: 'done', 2: 'done', 3: 'bad' }, es: ek(CYE, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where O(V + E) comes from',
      lines: ['Each vertex is processed once.', 'Each edge is looked at once, **twice** for undirected.'],
      panels: [gp(4, WHY4E, [[0, 0], [2, 0], [1, 1.3], [2.6, 2.2]]), vars({ n: 4, m: WHY4E.length })],
      task: { type: 'number', question: 'How many neighbour entries does a full traversal of this undirected graph read?', options: [4, 6, 8, 16], answer: WHY4SCAN, hint: 'Each undirected edge u–v is seen from u and again from v.' },
      solved: `${WHY4E.length} edges × 2 = ${WHY4SCAN} entries, plus 4 vertices: O(V + E).`,
      then: [{ say: 1, note: 'adj lists hold 2 + 2 + 3 + 1 = 8 entries.', panels: [table(['0', '1', '2', '3'], ['adj'], WHY4A.map((l) => [list(l)])), vars({ total: WHY4SCAN })] }],
    },
  ],

  representations: [
    {
      kind: 'watch',
      title: 'Edge list → adjacency list',
      lines: ['`Array.from({ length: n }, () => [])` gives each vertex its own array.', 'Undirected: each edge `[u, v]` is pushed both ways.', '"Neighbours of u?" is now just `adj[u]`.'],
      frames: adjBuildFrames(),
    },
    {
      kind: 'watch',
      title: 'The same graph as a matrix',
      lines: ['`mat[u][v] = mat[v][u] = 1` for every edge.', '"Edge u–v?" reads one cell: **O(1)**.', '"Neighbours of u?" scans a whole row: **O(n)**.', 'Memory is n² cells, even for a sparse graph.'],
      frames: [
        { say: 0, note: 'Start: a 4 × 4 grid of zeros.', panels: [matPanel([]), gp(4, [], R4P)] },
        ...R4E.map(([u, v], k) => ({ say: 0, note: `Edge [${u},${v}]: set mat[${u}][${v}] and mat[${v}][${u}].`, panels: [matPanel(R4E.slice(0, k + 1), { [`${u},${v}`]: 'active', [`${v},${u}`]: 'active' }), gp(4, R4E.slice(0, k + 1), R4P, { st: { [u]: 'active', [v]: 'active' } })] })),
        { say: 1, note: 'Edge 0–3? mat[0][3] = 0. One cell, no.', panels: [matPanel(R4E, { '0,3': 'bad' }), gp(4, R4E, R4P, { st: { 0: 'active', 3: 'active' } })] },
        { say: 2, note: 'Neighbours of 3: read all 4 cells of row 3 to find one 1.', panels: [matPanel(R4E, { '3,0': 'window', '3,1': 'window', '3,2': 'done', '3,3': 'window' }), gp(4, R4E, R4P, { st: { 3: 'active', 2: 'visited' } })] },
        { say: 3, note: '16 cells for 4 edges. The adjacency list held 8 entries.', panels: [matPanel(R4E), vars({ cells: 16, 'list entries': 8 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: build adj[3]',
      lines: ['Same code: `adj[u].push(v); adj[v].push(u);`', 'Edges, in this order: `[3,1]`, `[0,3]`, `[3,2]`.'],
      panels: [arr(R3E.map(([u, v]) => `${u}-${v}`), { label: 'edges' }), gp(4, R3E, [[0, 0], [2, 0], [2, 1.5], [1, 0.75]], { st: { 3: 'active' } })],
      task: { type: 'order', question: 'Tap the entries of adj[3] in the order they are pushed.', items: R3A[3].map(String), hint: 'Walk the edge list from the left; every edge touches 3.' },
      solved: `adj[3] = ${list(R3A[3])}: the order of the edge list.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: one matrix lookup',
      lines: ['Row 1 of the matrix for edges `[0,1], [1,2], [2,0], [2,3]`.'],
      panels: [arr(R4M[1], { label: 'mat[1]' }), gp(4, R4E, R4P, { st: { 1: 'active' } })],
      task: { type: 'cell', question: 'Which cell answers "is there an edge 1–3?"', answer: 3, hints: { 0: 'That is mat[1][0]: the edge 1–0.', 1: 'mat[1][1] is 1 to itself.', 2: 'That is mat[1][2]: the edge 1–2.' } },
      solved: 'mat[1][3] = 0: no edge 1–3, read in O(1).',
    },
    {
      kind: 'turn',
      title: 'Your turn: a big maze',
      lines: ['A 1,000 × 1,000 maze: 10⁶ cells.', 'From a cell you may step to its 4 neighbours.'],
      panels: [grid([[1, 1, 0], [0, 1, 1], [1, 1, 0]], [['', 'active', ''], ['', '', ''], ['', '', '']], 'a corner of the maze')],
      task: {
        type: 'choose',
        question: 'How should you store this graph?',
        options: [
          { text: 'Implicitly: compute neighbours with DIRS', why: '' },
          { text: 'Adjacency matrix', why: 'n = 10⁶ cells → n² = 10¹² cells of memory.' },
          { text: 'Edge list', why: 'Finding the neighbours of one cell would scan every edge: O(m).' },
        ],
        answer: 0,
      },
      solved: 'A grid is an implicit graph: neighbours are computed, nothing extra is stored.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Question shape → tool',
      lines: ['Relationships and reachability → graph traversal.', 'Only **BFS** answers unweighted shortest paths.'],
      frames: (() => {
        const rows = [
          ['A → B?', 'DFS or BFS'],
          ['How many groups?', 'DFS/BFS per unvisited'],
          ['Fewest steps', 'BFS'],
          ['Nearest X, every cell', 'multi-source BFS'],
          ['Start + target, huge', 'bidirectional BFS'],
          ['Two groups, no conflict', '2-colouring'],
          ['Steps cost differ', 'Dijkstra'],
          ['Dependencies', 'topological sort'],
        ];
        return rows.map((r, k) => ({ say: k === 2 ? 1 : 0, note: `${r[0]} → ${r[1]}.`, panels: [table(rows.map((x) => x[0]), ['tool'], rows.map((x, i) => [i <= k ? x[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: toll roads',
      lines: ['Cities joined by roads; each road has a different toll.', 'Find the cheapest route from A to B.'],
      panels: [gp(3, [[0, 1], [1, 2], [0, 2]], [[0, 1], [1, 0], [2, 1]], { lab: ['A', 'C', 'B'], el: { '0-1': 2, '1-2': 3, '0-2': 9 } })],
      task: {
        type: 'choose',
        question: 'Which tool?',
        options: [
          { text: 'Dijkstra (Shortest Path topic)', why: '' },
          { text: 'BFS', why: 'BFS counts edges, as if every step cost the same. Here the steps cost different amounts.' },
          { text: 'DFS', why: 'DFS answers reachability, not shortest anything.' },
        ],
        answer: 0,
      },
      solved: 'Steps with different costs → not BFS: Dijkstra.',
    },
    {
      kind: 'turn',
      title: 'Your turn: friend groups',
      lines: ['People and friendships.', '"How many separate friend groups are there?"'],
      panels: [gp(5, [[0, 1], [2, 3], [3, 4]], [[0, 0], [1, 0], [2.5, 0], [3.5, 0], [3, 1]])],
      task: {
        type: 'choose',
        question: 'Which tool?',
        options: [
          { text: 'DFS/BFS from every unvisited vertex', why: '' },
          { text: 'One BFS from vertex 0', why: 'One traversal only finds the group of its start.' },
          { text: 'Topological sort', why: 'That orders tasks by dependencies; friendships have no direction.' },
        ],
        answer: 0,
      },
      solved: 'Count groups → launch a traversal from each unvisited vertex.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Spot the hidden graph',
      lines: ['**What are the things?** → vertices.', '**What moves me from one thing to another?** → edges.', '**What is asked?** Reachability / groups → DFS; fewest moves → BFS.'],
      frames: [
        { say: 0, note: 'Puzzle: turn "cat" into "dog", changing one letter at a time. The words are the things.', panels: [wg([])] },
        ...WE.map(([a, b], k) => ({ say: 1, note: `${WORDS[a]} → ${WORDS[b]} changes one letter: an edge.`, panels: [wg(WE.slice(0, k + 1), { st: { [a]: 'active', [b]: 'active' }, es: { [`${a}-${b}`]: 'active' } })] })),
        { say: 2, note: '"Fewest changes from cat to dog?" Fewest moves, each move costs 1 → BFS.', panels: [wg(WE, { st: { 0: 'active', 4: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: run the ladder',
      lines: ['Edges join words one letter apart.'],
      panels: [wg(WE, { st: { 0: 'active', 4: 'done' } })],
      task: { type: 'number', question: 'Fewest changes from cat to dog?', options: [2, 3, 4, 5], answer: WB.dist[4], hint: 'Go layer by layer from cat: 1 change away, then 2…' },
      solved: `cat → cot → cog → dog: ${WB.dist[4]} changes.`,
      then: WB.pops.filter((p) => p.found.length).map((p) => ({ say: 0, note: `${WORDS[p.u]} (${p.dist[p.u]}) → ${p.found.map((v) => WORDS[v]).join(', ')} at ${p.dist[p.u] + 1}.`, panels: [wg(WE, { st: { ...states(p.queue.slice(0, p.head), 'done'), [p.u]: 'active', ...states(p.found, 'visited') } }), arr(p.dist.slice(), { label: 'dist: ' + WORDS.join(' ') })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: islands',
      lines: ['A grid of `1` (land) and `0` (water).', '"How many islands?" Land cells touching up/down/left/right form one island.'],
      panels: [grid([[1, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 1]], [['', '', '', ''], ['', '', '', ''], ['', '', '', '']], 'grid')],
      task: {
        type: 'choose',
        question: 'What is the graph, and what is asked?',
        options: [
          { text: 'Land cells + adjacent moves; count groups → DFS', why: '' },
          { text: 'Rows are vertices; fewest moves → BFS', why: 'The cells are the things you move between, and nothing asks for fewest moves.' },
          { text: 'No graph: just count the 1s', why: 'That counts land cells (5), not islands (2).' },
        ],
        answer: 0,
      },
      solved: 'Vertices = land cells, edges = adjacent land. Count groups → DFS from each unvisited land cell.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'DFS: the stubborn explorer',
      lines: ['Walk down a corridor as far as possible.', 'At a dead end, walk back to the last junction.', 'The path you are on is a **stack**.'],
      frames: (() => {
        const done = [];
        const out = [];
        return G7D.ev.map((e) => {
          if (e.t === 'ret') done.push(e.u);
          else out.push(e.u);
          return {
            say: e.t === 'enter' ? 0 : e.path.length ? 1 : 2,
            note: e.t === 'enter' ? `Go deeper: ${e.u}.` : e.path.length ? `${e.u} is a dead end now. Back to ${e.path[e.path.length - 1]}.` : 'Back at 0 with nothing left: done.',
            panels: [gp(7, G7E, G7P, { st: { ...states(e.path, 'visited'), ...states(done, 'done'), ...(e.t === 'enter' ? { [e.u]: 'active' } : {}) } }), stk(e.path, 'path'), arr(out.slice(), { label: 'visit order' })],
          };
        });
      })(),
    },
    {
      kind: 'watch',
      title: 'BFS: the ripple in a pond',
      lines: ['First everything 1 step away, then 2 steps, then 3.', 'The frontier waiting to be explored is a **queue**.'],
      frames: [
        { say: 0, note: 'Layer 0: the start, 0.', panels: [gp(7, G7E, G7P, { st: { 0: 'active' } }), que([0])] },
        ...G7B.pops.map((p) => ({
          say: 1,
          note: `Take ${p.u} from the front (layer ${p.dist[p.u]}).${p.found.length ? ` Add ${seq(p.found)} (layer ${p.dist[p.u] + 1}) at the back.` : ''}`,
          panels: [gp(7, G7E, G7P, { st: { ...states(p.queue.slice(0, p.head), 'done'), ...states(p.queue.slice(p.head + 1), 'visited'), [p.u]: 'active' } }), que(p.queue.slice(p.head + 1)), arr(p.dist.map((d) => (d < 0 ? '-' : d)), { label: 'layer' })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which container?',
      lines: ['Same graph, same visited set.', 'This run visited 0, 1, 2, 3, 4, 5, 6.'],
      panels: [gp(7, G7E, G7P), arr([0, 1, 2, 3, 4, 5, 6], { label: 'visit order' })],
      task: {
        type: 'choose',
        question: 'Which container held the frontier?',
        options: [
          { text: 'A queue', why: '' },
          { text: 'A stack', why: 'A stack dives: after 1 it would go to 3 before ever touching 2.' },
        ],
        answer: 0,
      },
      solved: 'Both neighbours of 0 come first, then the next layer: wide first → queue.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Try every simple path',
      lines: ['Extend the path to any vertex not already on it.', 'At t, keep the shortest length seen.', 'On backtrack, remove the vertex so other paths may use it.'],
      frames: (() => {
        const f = BR.frames;
        // mark the frames that follow a backtrack
        return f.map((x, i) => (i > 0 && f[i - 1].say === 1 ? { ...x, say: 2, note: `Backtrack, then ${x.note.charAt(0).toLowerCase()}${x.note.slice(1)}` } : x));
      })(),
    },
    {
      kind: 'watch',
      title: 'The waste',
      lines: ['Vertex 3 was reached 4 times, once per path.', 'Two of those arrivals used 3 edges when 2 were enough.'],
      frames: [
        { say: 0, note: `Paths to 3 used ${seq(BR.lens)} edges.`, panels: [gp(4, BFE, BFP, { st: { 3: 'bad' } }), arr(BR.arrive, { label: 'times reached', highlights: { 3: 'bad' } })] },
        { say: 1, note: 'A longer arrival at 3 can never give a shorter answer. Reach each vertex once.', panels: [gp(4, BFE, BFP, { st: { 0: 'done', 1: 'done', 3: 'done' }, es: ek([[0, 1], [1, 3]], 'done') }), vars({ best: BR.best })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the paths',
      lines: ['Add vertex 4, joined to 2 and 3.', 'Brute force tries every simple path from 0 to 4.'],
      panels: [gp(5, BT5E, BT5P, { st: { 0: 'active', 4: 'done' } })],
      task: { type: 'number', question: 'How many simple paths from 0 to 4 does it try?', options: [3, 4, 7, 10], answer: BT5PATHS, hint: 'Every path ends with 2 → 4 or 3 → 4. Count the simple paths 0 → 2 and 0 → 3 that avoid 4.' },
      solved: `${BT5PATHS} paths for 5 vertices. Each extra vertex multiplies them: exponential.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: keep or drop?',
      lines: ['Vertex x was already reached using **3** edges.', 'Another path now reaches x using **5** edges.'],
      panels: [vars({ 'first reach': 3, 'new reach': 5 })],
      task: {
        type: 'choose',
        question: 'Can exploring onward from the 5-edge arrival find a shorter answer?',
        options: [
          { text: 'No: wherever it leads, the 3-edge arrival gets there 2 edges sooner', why: '' },
          { text: 'Yes: it may lead to new vertices', why: 'Whatever x leads to, the 3-edge arrival leads there too, 2 edges cheaper.' },
          { text: 'Only if the graph has a cycle', why: 'Cycles do not matter: from x onward both arrivals see the same edges.' },
        ],
        answer: 0,
      },
      solved: 'Reach each vertex once, along a shortest path. That is BFS.',
    },
  ],

  'optimized-dfs': [
    {
      kind: 'watch',
      title: 'Recursive DFS, step by step',
      lines: ['Mark `u` visited **immediately**.', 'For each neighbour `v` not visited: recurse into `v`.', 'All neighbours done: return (backtrack) to the caller.'],
      frames: dfsFrames(),
    },
    {
      kind: 'watch',
      title: 'Counting components',
      lines: ['Loop over every vertex; start a DFS from each one still unvisited.', 'Already visited: an earlier DFS reached it, skip.', 'Each new start is a new **connected component**.'],
      frames: [...COMP.frames, { say: 2, note: `${COMP.count} launches = ${COMP.count} components.`, panels: [COMP.frames[COMP.frames.length - 1].panels[0], vars({ count: COMP.count })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does the loop launch?',
      lines: ['`for (let s = 0; s < n; s++) if (!visited[s]) dfs(s);`'],
      panels: [gp(7, C7E, C7P)],
      task: { type: 'order', question: 'Tap the vertices the outer loop starts a DFS from, in order.', items: C7STARTS.map(String), hint: 's goes 0, 1, 2…; skip every vertex an earlier DFS already marked.' },
      solved: `Launches at ${seq(C7STARTS)}: ${C7STARTS.length} components.`,
    },
    {
      kind: 'watch',
      title: 'Cycle detection with a parent',
      lines: ['Pass the vertex you came from as `parent`.', 'A visited neighbour that **is** the parent: the same edge, walked back.', 'A visited neighbour that is **not** the parent: a second route → cycle.'],
      frames: CYC.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: a square',
      lines: ['Edges `[0,1], [1,2], [2,3], [3,0]`.', 'DFS went 0 → 1 → 2 → 3. Now in `dfs(3, 2)`.'],
      panels: [gp(4, SQE, SQP, { st: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'active' }, es: ek([[0, 1], [1, 2], [2, 3]], 'done') }), vars({ u: 3, parent: 2, v: 0 })],
      task: {
        type: 'choose',
        question: 'Neighbour 0 is already visited. What happens?',
        options: [
          { text: 'Return true: a cycle', why: '' },
          { text: 'Skip it: 0 is the parent', why: 'The parent is 2, the vertex we came from. 0 was reached another way.' },
          { text: 'Recurse into 0', why: 'DFS only recurses into unvisited neighbours.' },
        ],
        answer: 0,
      },
      solved: '0 is visited and not the parent: 0 → 1 → 2 → 3 → 0 is a cycle.',
    },
  ],

  'template-dfs': [
    {
      kind: 'watch',
      title: 'DFS with an explicit stack',
      lines: ['Push the start and mark it **when pushing**.', '`stack.pop()` takes from the END: O(1).', 'Mark and push each unvisited neighbour: every vertex is pushed once.', 'The order differs from recursive DFS.'],
      frames: iterFrames(),
    },
    {
      kind: 'turn',
      title: 'Your turn: pop order',
      lines: ['Run `reachable(adj, 0)` on this graph.', 'Edges `[0,1], [0,2], [1,3], [2,4], [2,5]`.'],
      panels: [gp(6, IT6E, IT6P), stk([0])],
      task: { type: 'order', question: 'Tap the vertices in the order `stack.pop()` returns them.', items: IT6.order.map(String), hint: 'adj[0] = [1, 2]: both are pushed, so 2 sits on top.' },
      solved: `Pop order: ${seq(IT6.order)}.`,
      then: (() => {
        const out = [];
        return IT6.pops.map((p) => {
          out.push(p.u);
          return { say: 1, note: `pop() → ${p.u}.${p.pushed.length ? ` Push ${seq(p.pushed)}.` : ''}`, panels: [gp(6, IT6E, IT6P, { st: { ...states(out, 'done'), [p.u]: 'active' } }), stk(p.stack.slice()), arr(out.slice(), { label: 'popped' })] };
        });
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: why mark on push?',
      lines: ['Vertex 6 is a neighbour of both 4 and 5.'],
      panels: [gp(7, G7E, G7P, { st: { 5: 'done', 6: 'visited' }, es: { '5-6': 'done' } })],
      task: {
        type: 'choose',
        question: 'Marking when pushing guarantees what?',
        options: [
          { text: 'Each vertex is pushed only once', why: '' },
          { text: 'The pop order matches recursive DFS', why: 'It does not: the iterative order differs (neighbours come out in reverse).' },
          { text: 'The stack is sorted', why: 'Nothing sorts the stack; it just holds vertices waiting to be popped.' },
        ],
        answer: 0,
      },
      solved: 'Once 5 pushes 6 and marks it, 4 sees it visited and skips it.',
    },
  ],

  'implementation-dfs': [
    {
      kind: 'watch',
      title: 'How deep does recursion go?',
      lines: ['Every recursive call adds one frame to the call stack.', 'On an all-land grid, DFS can snake through every cell.', 'V8 allows roughly 10,000 frames: then `RangeError`.'],
      frames: [
        ...GD3.steps.map((s) => {
          const [r, c] = s.path[s.path.length - 1];
          const on = new Set(s.path.map(([a, b]) => `${a},${b}`));
          return { say: s.depth === 1 ? 0 : 1, note: `dfs(${r}, ${c}): depth ${s.depth}.`, panels: [grid([[1, 1, 1], [1, 1, 1], [1, 1, 1]], [0, 1, 2].map((a) => [0, 1, 2].map((b) => (a === r && b === c ? 'active' : on.has(`${a},${b}`) ? 'visited' : ''))), '3 × 3, all land'), vars({ depth: s.depth })] };
        }),
        { say: 2, note: '9 cells, 9 frames deep. A 300 × 300 grid: up to 90,000 deep. Use an explicit stack or BFS.', panels: [vars({ '3×3': 9, '300×300': '90,000', limit: '~10,000' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a 4 × 4 grid',
      lines: ['Same DFS, DIRS = down, up, right, left.', 'Start at (0, 0); every cell is land.'],
      panels: [grid([[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]], [['active', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']], '4 × 4, all land')],
      task: { type: 'number', question: 'How deep does the call stack get?', options: [4, 7, 8, 16], answer: GD4.max, hint: 'It goes down a column, then up the next one: no cell is a dead end until the last.' },
      solved: `${GD4.max}: the snake visits every cell before any call returns.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: one byte per cell',
      lines: ['visited = `new Uint8Array(R * C)` for R = 2, C = 4.', 'Cell (r, c) lives at index `r * C + c`.'],
      panels: [arr(Array(8).fill(0), { label: 'visited' }), grid([[0, 0, 0, 0], [0, 0, 1, 0]], [['', '', '', ''], ['', '', 'active', '']], 'cell (1, 2)')],
      task: { type: 'cell', question: 'Which index marks cell (1, 2)?', answer: 1 * 4 + 2, hints: { 3: 'That is r + c. Each row holds C = 4 cells.', 2: 'That is c alone, in row 0. Skip a full row of 4 first.', 5: 'Close: 1 * 4 + 1 is cell (1, 1).' } },
      solved: '1 * 4 + 2 = 6.',
    },
  ],

  'optimized-bfs': [
    {
      kind: 'watch',
      title: 'BFS distances, layer by layer',
      lines: ['`dist[s] = 0`, push s. Every other distance is -1.', 'Take `u` from the front of the queue.', 'Each neighbour with unknown dist gets `dist[u] + 1` and goes to the back.', 'Queue empty: `dist[t]` is the fewest edges from s.'],
      frames: bfsFrames(7, BE, BP, BB, 0),
    },
    {
      kind: 'watch',
      title: 'The queue invariant',
      lines: ['The queue always looks like `[d, …, d, d+1, …]`.', 'So vertices come out in order of distance: layer 0, 1, 2…'],
      frames: BB.pops.map((p) => {
        const waiting = p.queue.slice(p.head + 1);
        return { say: 0, note: `After popping ${p.u}: queue dists ${waiting.length ? list(waiting.map((v) => p.dist[v])) : 'empty'}.`, panels: [que(waiting.map((v) => `${v}·d${p.dist[v]}`), 'queue (vertex·dist)'), arr(BB.order.slice(0, p.head + 1).map((v) => BB.dist[v]), { label: 'dists popped so far' })] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: a long way and a short way',
      lines: ['Two routes from 0 to 5: along the top, or through 4.'],
      panels: [gp(6, B6E, B6P, { st: { 0: 'active', 5: 'done' } })],
      task: { type: 'number', question: 'What is dist[5] after BFS from 0?', options: [2, 3, 4, 5], answer: B6.dist[5], hint: 'The first discovery of each vertex is along a shortest path. Which way reaches 3 first?' },
      solved: `0 → 4 → 3 → 5: dist[5] = ${B6.dist[5]}.`,
      then: bfsFrames(6, B6E, B6P, B6, 0).map((f) => ({ ...f, say: 0 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: add weights',
      lines: ['0 → 1 → 2 → 3 costs 1 + 1 + 1.', 'The direct edge 0 → 3 costs 10.'],
      panels: [gp(4, WTE, WTP, { el: WTW, st: { 0: 'active', 3: 'done' } })],
      task: { type: 'number', question: 'BFS first discovers 3 along which route? Give that route\'s cost.', options: [1, 3, 10, 13], answer: WTW['0-3'], hint: 'BFS counts edges, not costs. Which route has fewer edges?' },
      solved: 'BFS locks in 3 via the single edge (cost 10). The real cheapest is 3. Different weights → Dijkstra.',
      then: [{ say: 0, note: 'Pop 0: neighbours 1 and 3 both get dist 1. 3 is claimed through the cost-10 edge.', panels: [gp(4, WTE, WTP, { el: WTW, st: { 0: 'done', 1: 'visited', 3: 'bad' }, es: { '0-3': 'active', '0-1': 'done' } }), arr(WTB.dist, { label: 'dist (edges)' })] }],
    },
  ],

  'template-bfs': [
    {
      kind: 'watch',
      title: 'A queue with a head pointer',
      lines: ['Start: `dist[s] = 0`, `queue = [s]`.', '`u = queue[head]`: "dequeue" just moves `head` forward.', 'The loop stops when `head` reaches the end.'],
      frames: headFrames(),
    },
    {
      kind: 'turn',
      title: 'Your turn: what head reads',
      lines: ['Run `bfsDistances` from 0.', 'Edges `[0,3], [0,1], [3,4], [1,2], [1,4], [4,5]`, in that order.'],
      panels: [gp(6, OT6E, OT6P, { st: { 0: 'active' } }), arr([0], { label: 'queue array', pointers: [ptr(0, 'head')] })],
      task: { type: 'order', question: 'Tap the vertices in the order `queue[head]` reads them.', items: OT6.order.map(String), hint: 'adj[0] = [3, 1]: neighbours are pushed in edge order.' },
      solved: `queue = ${list(OT6.order)}: the array ends up holding the BFS order.`,
    },
    {
      kind: 'watch',
      title: 'Level by level',
      lines: ['Keep the current `frontier` and build `next`.', 'Each round: check for the target, collect unseen neighbours, `level++`.', 'Target in the frontier: return `level`.'],
      frames: [{ say: 0, note: 'frontier = [0], level = 0. Target: 4.', panels: [gp(5, TBE, TBP, { st: { 0: 'active', 4: 'done' } }), arr([0], { label: 'frontier' }), vars({ level: 0 })] }, ...LV.frames],
    },
    {
      kind: 'turn',
      title: 'Your turn: which round?',
      lines: ['Level-by-level BFS from 0, target 5.'],
      panels: [gp(6, LT6E, LT6P, { st: { 0: 'active', 5: 'done' } })],
      task: { type: 'number', question: 'What does it return?', options: [2, 3, 4, 5], answer: LT6.ans, hint: 'Each round moves the frontier one edge further from 0.' },
      solved: `Frontiers [0], [1, 2], [3, 4], then [5]: returns ${LT6.ans}.`,
      then: LT6.frames.map((f) => ({ ...f, say: 0 })),
    },
  ],

  'implementation-bfs': [
    {
      kind: 'watch',
      title: 'shift() moves everyone',
      lines: ['Each `shift()` re-indexes the remaining elements: O(queue length).', 'A head pointer moves nothing: `queue[head++]` is O(1).'],
      frames: [
        ...SH.frames,
        { say: 1, note: 'With a head pointer: head = 4 reads the last one. 0 moves; the array keeps its cells.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'queue + head', pointers: [ptr(4, 'head')], highlights: hl(4, () => 'muted') }), vars({ moves: 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: six with shift',
      lines: ['Drain a queue of 6 with `shift()`.', 'Count every element that slides one slot left.'],
      panels: [arr(['a', 'b', 'c', 'd', 'e', 'f'], { label: 'queue (shift)' })],
      task: { type: 'number', question: 'How many moves in total?', options: [6, 15, 21, 36], answer: SH6, hint: 'The first shift moves 5, the next 4…' },
      solved: '5 + 4 + 3 + 2 + 1 = 15. Grows like n²; a head pointer stays at 0.',
    },
    {
      kind: 'turn',
      title: 'Your turn: decode a cell id',
      lines: ['A grid with C = 3 columns pushes `r * C + c`.', 'Decode: `r = Math.floor(id / C)`, `c = id % C`.'],
      panels: [que([7], 'queue'), grid([['', '', ''], ['', '', ''], ['', '', '']], [['', '', ''], ['', '', ''], ['', '', '']], '3 × 3 grid')],
      task: { type: 'number', question: 'Which row r is id 7?', options: [1, 2, 3, 7], answer: Math.floor(7 / 3), hint: 'Math.floor(7 / 3).' },
      solved: 'r = 2, c = 7 % 3 = 1: cell (2, 1).',
      then: [{ say: 1, note: 'Ids row by row: 7 is (2, 1).', panels: [grid([[0, 1, 2], [3, 4, 5], [6, 7, 8]], [['', '', ''], ['', '', ''], ['', 'active', '']], 'id = r * 3 + c')] }],
    },
  ],
  ...secondPart,
};
