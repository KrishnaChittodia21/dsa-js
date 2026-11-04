// Step lessons for Advanced Graphs, part 1 (low-link: bridges & articulation points). Format: src/content/stepSchema.js.
// Facts come only from topic.js. Every disc / low value, back edge, bridge and cut-vertex verdict below comes from
// running the lesson's own code (bridgesAndCuts, bridgesBrute, findBridges) on the example graph; check() throws on drift.
// Edges are undirected; edge id = position in the edges list, exactly like the lesson's adjacency `[neighbour, id]`.
// Part 2 (SCC, Euler paths, functional graphs, meta-graph BFS, mistakes, tips) lives in steps-2.js.
import secondPart from './steps-2.js';
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label) => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const check = (ok, msg) => {
  if (!ok) throw new Error(`advanced-graphs/steps.js: ${msg}`);
};

// pos: [x, y] per vertex. o.st: vertex → state, o.es: 'u-v' → edge state (either order unless directed),
// o.el: 'u-v' → edge label, o.directed, o.label
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- the lesson's bridgesAndCuts (pattern template), verbatim ----------
function bridgesAndCuts(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges = [], cut = new Set();
  let time = 0;
  function dfs(u, parentEdge) {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const [v, id] of adj[u]) {
      if (id === parentEdge) continue;
      if (disc[v] === -1) {
        children++;
        dfs(v, id);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);
        if (parentEdge !== -1 && low[v] >= disc[u]) cut.add(u);
      } else {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
    if (parentEdge === -1 && children >= 2) cut.add(u);
  }
  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);
  return { bridges, cut: [...cut].sort((a, b) => a - b) };
}

// ---------- the same DFS, recording one event per step ----------
// kinds: start (outer loop), visit, skip (parent edge), back (v visited; up = v is an ancestor), ret (child returned), root
function lowlink(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges = [], cut = new Set(), tree = [], back = [], path = [], done = [], ev = [];
  let time = 0;
  const snap = (kind, x) =>
    ev.push({ kind, ...x, disc: disc.slice(), low: low.map((l, i) => (disc[i] === -1 ? -1 : l)), path: path.slice(), done: done.slice(), tree: tree.slice(), back: back.slice(), bridges: bridges.slice(), cut: [...cut], time });
  function dfs(u, parentEdge, parent) {
    disc[u] = low[u] = time++;
    path.push(u);
    snap('visit', { u, pe: parentEdge, p: parent });
    let children = 0;
    for (const [v, id] of adj[u]) {
      if (id === parentEdge) {
        snap('skip', { u, v, id });
        continue;
      }
      if (disc[v] === -1) {
        children++;
        tree.push([u, v]);
        dfs(v, id, u);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        const br = low[v] > disc[u];
        if (br) bridges.push([u, v]);
        const ct = parentEdge !== -1 && low[v] >= disc[u];
        if (ct) cut.add(u);
        snap('ret', { u, v, id, before, br, ct, root: parentEdge === -1 });
      } else {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        const up = disc[v] < disc[u];
        if (up) back.push([u, v]);
        snap('back', { u, v, id, before, up });
      }
    }
    path.pop();
    done.push(u);
    if (parentEdge === -1) {
      if (children >= 2) cut.add(u);
      snap('root', { u, children, rc: children >= 2 });
    }
  }
  for (let s = 0; s < n; s++)
    if (disc[s] === -1) {
      snap('start', { s });
      dfs(s, -1, -1);
    }
  const res = { adj, ev, disc, low, bridges, cut: [...cut].sort((a, b) => a - b), tree, back };
  const ref = bridgesAndCuts(n, edges);
  check(same(ref.bridges, res.bridges) && same(ref.cut, res.cut), 'instrumented run matches bridgesAndCuts');
  return res;
}

// connected pieces after removing one edge (by index) or one node, by plain DFS
function pieces(n, edges, o = {}) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => i !== o.edge && u !== o.node && v !== o.node && (adj[u].push(v), adj[v].push(u)));
  const comp = new Array(n).fill(-1);
  let c = 0;
  for (let s = 0; s < n; s++) {
    if (s === o.node || comp[s] !== -1) continue;
    const st = [s];
    comp[s] = c;
    while (st.length) for (const v of adj[st.pop()]) if (comp[v] === -1) (comp[v] = c), st.push(v);
    c++;
  }
  return { count: c, comp };
}

// picture of one event: finished = done, on the call path = visited, current = active, cut vertices so far = bad.
// tree edges = done, back edges (up) = active, bridges = bad.
const evGraph = (n, edges, pos, e, o = {}) => {
  const cur = e.kind === 'visit' || e.kind === 'skip' || e.kind === 'back' || e.kind === 'ret' ? e.u : e.kind === 'root' ? e.u : undefined;
  const st = { ...states(e.done, 'done'), ...states(e.path, 'visited'), ...(o.showCut === false ? {} : states(e.cut, 'bad')), ...(cur !== undefined && e.kind !== 'root' ? { [cur]: 'active' } : {}), ...o.st };
  const es = { ...ek(e.tree, 'done'), ...ek(e.back, 'active'), ...ek(e.bridges, 'bad'), ...o.es };
  return gp(n, edges, pos, { st, es, label: o.label, el: o.el });
};
const dash = (xs) => xs.map((x) => (x === -1 ? '-' : x));
const discArr = (e, act = []) => arr(dash(e.disc), { label: 'disc', highlights: hl(e.disc.length, (i) => (act.includes(i) ? 'active' : '')) });
const lowArr = (e, act = [], bad = []) => arr(dash(e.low), { label: 'low', highlights: hl(e.low.length, (i) => (bad.includes(i) ? 'bad' : act.includes(i) ? 'active' : '')) });
const evNote = (e) => {
  switch (e.kind) {
    case 'start':
      return `Outer loop: ${e.s} is unvisited, so call dfs(${e.s}, -1). ${e.s} is a root.`;
    case 'visit':
      return `Visit ${e.u}${e.p === -1 ? '' : ` from ${e.p}`}: disc[${e.u}] = low[${e.u}] = ${e.disc[e.u]}.`;
    case 'skip':
      return `${e.u} sees ${e.v} through e${e.id}, the edge it came in on: skip.`;
    case 'back':
      return e.up
        ? `${e.u} sees ${e.v}, already visited: back edge. low[${e.u}] = min(${e.before}, disc[${e.v}]=${e.disc[e.v]}) = ${e.low[e.u]}.`
        : `${e.u} sees ${e.v}, already visited. low[${e.u}] = min(${e.before}, disc[${e.v}]=${e.disc[e.v]}) stays ${e.low[e.u]}.`;
    case 'ret': {
      const head = `Back at ${e.u}: low[${e.u}] = min(${e.before}, low[${e.v}]=${e.low[e.v]}) = ${e.low[e.u]}.`;
      const br = `low[${e.v}]=${e.low[e.v]} > disc[${e.u}]=${e.disc[e.u]}? ${e.br ? `Yes: ${e.u}–${e.v} is a bridge.` : 'No.'}`;
      const ct = e.root ? '' : e.ct ? ` ${e.u} is a cut vertex.` : '';
      return `${head} ${br}${ct}`;
    }
    case 'root':
      return `Root ${e.u} has ${e.children} tree ${e.children === 1 ? 'child' : 'children'}: ${e.rc ? 'a cut vertex' : 'not a cut vertex'}.`;
  }
};

// ====================== the lesson's graph: triangle 0–1–2 plus tail 1–3–4 ======================
const G_E = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]];
const G_P = [[1, 0], [0.4, 1], [1.6, 1], [0.4, 2], [0.4, 3]];
const G = lowlink(5, G_E);
check(same(G.disc, [0, 1, 2, 3, 4]) && same(G.low, [0, 0, 0, 3, 4]), 'lesson disc/low');
check(same(G.bridges, [[3, 4], [1, 3]]) && same(G.cut, [1, 3]), 'lesson bridges 1–3, 3–4 and cut vertices 1, 3');
check(same(G.back, [[2, 0]]), 'one back edge 2 ⇢ 0');
const gG = (e, o) => evGraph(5, G_E, G_P, e, o);

// ====================== what ======================
// a square 0–1–2–3 with a tail 3–4 that forks to 5 and 6
const W_E = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [4, 6]];
const W_P = [[0, 0], [1.2, 0], [1.2, 1.2], [0, 1.2], [0, 2.4], [-0.7, 3.4], [0.7, 3.4]];
const W_CUT34 = pieces(7, W_E, { edge: 4 });
const W_CUT01 = pieces(7, W_E, { edge: 0 });
const W_NODE4 = pieces(7, W_E, { node: 4 });
check(W_CUT34.count === 2 && W_CUT01.count === 1 && W_NODE4.count === 3, 'what: removals');
const W_APS = [0, 1, 2, 3, 4, 5, 6].filter((v) => pieces(7, W_E, { node: v }).count > 1);
check(same(W_APS, [3, 4]) && same(lowlink(7, W_E).cut, [3, 4]), 'what: two articulation points');
const wg = (o = {}) => gp(7, W_E, W_P, o);
const S_E = [[0, 1], [1, 2], [2, 0], [2, 3]];
const S_P = [[0, 0], [1.4, 0], [0.7, 1.2], [2.1, 1.2]];

// ====================== why ======================
const Y_E = [[0, 1], [0, 2], [1, 3], [2, 3]];
const Y_P = [[0.8, 0], [0, 1], [1.6, 1], [0.8, 2]];
const Y = lowlink(4, Y_E);
check(same(Y.tree, [[0, 1], [1, 3], [3, 2]]) && same(Y.back, [[2, 0]]), 'why: 3–2 becomes a tree edge, 2 ⇢ 0 is the back edge');
const Y_SHOW = Y.ev.filter((e) => e.kind === 'visit' || (e.kind === 'back' && e.up));
const H_E = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [4, 1]];
const H_P = [[0, 0], [1.2, 0], [0.6, 1], [0.6, 2], [1.8, 2.4], [0.6, 3.2]];
const H = lowlink(6, H_E);
check(H.back.length === 3 && H.tree.length === 5, 'why turn: three back edges');
// each back edge u ⇢ v lands on a node that was on the call path when it was found
check(H.ev.filter((e) => e.kind === 'back' && e.up).every((e) => e.path.includes(e.v)), 'why turn: every back edge goes to an ancestor');

// ====================== recognize ======================
const ISL = [
  [1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1],
];
function islands(g) {
  const R = g.length, C = g[0].length, seen = g.map((r) => r.map(() => false));
  let k = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (!g[r][c] || seen[r][c]) continue;
      k++;
      const st = [[r, c]];
      seen[r][c] = true;
      while (st.length) {
        const [a, b] = st.pop();
        for (const [x, y] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]])
          if (x >= 0 && y >= 0 && x < R && y < C && g[x][y] && !seen[x][y]) (seen[x][y] = true), st.push([x, y]);
      }
    }
  return k;
}
const ISL_CUT = ISL.map((r) => r.slice());
ISL_CUT[1][2] = 0;
check(islands(ISL) === 1 && islands(ISL_CUT) === 2, 'recognize: one cell splits the island');
const islState = (g, bad) => g.map((r, i) => r.map((v, j) => (bad && i === bad[0] && j === bad[1] ? 'bad' : v ? 'done' : '')));

// ====================== intuition-lowlink ======================
const G_VISITS = G.ev.filter((e) => e.kind === 'visit' || (e.kind === 'back' && e.up));
const G_LOWS = G.ev.filter((e) => (e.kind === 'back' && e.up) || e.kind === 'ret');
check(G_LOWS.length === 5, 'intuition: one back edge, four returns');
const GX_E = [...G_E, [4, 1]];
const GX = lowlink(5, GX_E);
check(GX.low[3] === 1 && GX.bridges.length === 0, 'intuition turn: low[3] = 1, no bridges');
const T2_E = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3]];
const T2_P = [[0, 0], [1.2, 0], [0.6, 1], [0.6, 2], [1.2, 3], [0, 3]];
const T2 = lowlink(6, T2_E);
check(same(T2.disc, [0, 1, 2, 3, 4, 5]) && same(T2.low, [0, 0, 0, 3, 3, 3]) && same(T2.bridges, [[2, 3]]), 'intuition cell: bridge 2–3');
const T2_END = T2.ev.at(-1);

// ====================== brute-force ======================
// the lesson's bridgesBrute, recording each skipped edge's search
function bridgesBrute(n, edges) {
  const result = [], runs = [];
  for (let skip = 0; skip < edges.length; skip++) {
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([u, v], i) => { if (i !== skip) { adj[u].push(v); adj[v].push(u); } });
    const [a, b] = edges[skip];
    const seen = new Array(n).fill(false);
    const stack = [a]; seen[a] = true;
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (!seen[v]) { seen[v] = true; stack.push(v); }
    }
    if (!seen[b]) result.push(edges[skip]);
    runs.push({ skip, a, b, seen: seen.slice(), found: result.slice() });
  }
  return { result, runs };
}
const BG = bridgesBrute(5, G_E);
check(same(BG.result, [[1, 3], [3, 4]]), 'brute: same bridges as the lesson');
const B2_E = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5]];
const B2_P = [[0, 0], [1.2, 0], [1.2, 1.2], [0, 1.2], [2.4, 1.2], [3.6, 1.2]];
const B2 = bridgesBrute(6, B2_E);
check(B2.result.length === 2 && same(lowlink(6, B2_E).bridges.length, 2), 'brute turn: two bridges');
const bfFrame = (r) => ({
  say: r.found.length && r.found.at(-1) === G_E[r.skip] ? 2 : 1,
  note: `Skip ${r.a}–${r.b}, search from ${r.a}. ${r.seen[r.b] ? `${r.b} is still reached: not a bridge.` : `${r.b} is NOT reached: bridge.`}`,
  panels: [
    gp(5, G_E, G_P, { st: { ...hl(5, (i) => (r.seen[i] ? 'visited' : '')), [r.a]: 'active', ...(r.seen[r.b] ? {} : { [r.b]: 'bad' }) }, es: { [`${r.a}-${r.b}`]: 'muted' } }),
    arr(r.seen.map((s) => (s ? 'T' : 'F')), { label: 'seen', highlights: hl(5, (i) => (i === r.b ? (r.seen[i] ? 'done' : 'bad') : '')) }),
    vars({ skip: `${r.a}–${r.b}`, bridges: r.found.length }),
  ],
});

// ====================== optimized-bridges ======================
const adjCells = (n, edges, upto) => {
  const adj = Array.from({ length: n }, () => []);
  edges.slice(0, upto).forEach(([u, v], id) => { adj[u].push(`${v}·e${id}`); adj[v].push(`${u}·e${id}`); });
  return adj.map((row) => [0, 1, 2].map((k) => row[k] ?? ''));
};
const G_EL = Object.fromEntries(G_E.map(([u, v], id) => [`${u}-${v}`, `e${id}`]));
check(same(G.adj[1].map(([v, id]) => `${v}·e${id}`), ['0·e0', '2·e1', '3·e3']), 'adjacency of 1');
const adjTable = (upto, act = []) =>
  table(['0', '1', '2', '3', '4'], ['1st', '2nd', '3rd'], adjCells(5, G_E, upto), adjCells(5, G_E, upto).map((row, i) => row.map((_, k) => (act.some(([r, c]) => r === i && c === k) ? 'active' : ''))), 'adj');
const adjBuild = G_E.map(([u, v], id) => {
  const cells = adjCells(5, G_E, id + 1);
  return { u, v, id, cu: [u, cells[u].filter(Boolean).length - 1], cv: [v, cells[v].filter(Boolean).length - 1] };
});
const G_SKIP1 = G.ev.find((e) => e.kind === 'skip' && e.u === 1);
check(G_SKIP1.v === 0 && G_SKIP1.id === 0, 'dfs(1, 0) skips [0, 0]');
const C_E = [[0, 1], [0, 2], [3, 4], [4, 5], [5, 3]];
const C_P = [[0.7, 0], [0, 1], [1.4, 1], [2.8, 0], [2.4, 1], [3.4, 1]];
const C = lowlink(6, C_E);
check(same(C.cut, [0]) && same(C.bridges, [[0, 1], [0, 2]]), 'two components: root 0 is a cut vertex, root 3 is not');
const C_SHOW = C.ev.filter((e) => e.kind !== 'skip' && !(e.kind === 'back' && !e.up));
const K_E = [[0, 1], [2, 3], [3, 4], [5, 6]];
const K_P = [[0, 0], [0, 1], [1.2, 0], [1.2, 1], [1.2, 2], [2.4, 0], [2.4, 1]];
const K = lowlink(7, K_E);
const K_ROOTS = K.ev.filter((e) => e.kind === 'start').map((e) => e.s);
check(same(K_ROOTS, [0, 2, 5]), 'outer loop calls dfs three times');

// ====================== template-bridges ======================
const T_E = [[0, 1], [1, 2], [2, 0]];
const T_P = [[0.7, 0], [0, 1.2], [1.4, 1.2]];
const T = lowlink(3, T_E);
check(T.bridges.length === 0 && T.cut.length === 0, 'triangle: nothing critical');
const T_EL = Object.fromEntries(T_E.map(([u, v], id) => [`${u}-${v}`, `e${id}`]));
const callStack = (e) => {
  const pe = {};
  for (const x of T.ev.slice(0, T.ev.indexOf(e) + 1)) if (x.kind === 'visit') pe[x.u] = x.pe;
  return e.path.map((u) => `dfs(${u}, ${pe[u]})`);
};
const T_SHOW = T.ev.filter((e) => e.kind !== 'start');
const T_BACK = T.ev.find((e) => e.kind === 'back' && e.up);
check(T_BACK.u === 2 && T_BACK.v === 0, 'template: 2 sees 0');

// ====================== implementation-bridges ======================
// the lesson's findBridges, recording one event per loop turn
function findBridges(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges = [], ev = [];
  let time = 0, maxH = 0;
  const snap = (x) => ev.push({ ...x, stack: stack.map((f) => `[${f.join(',')}]`), low: low.map((l, i) => (disc[i] === -1 ? '-' : l)), disc: disc.slice(), bridges: bridges.slice() });
  let stack = [];
  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    disc[s] = low[s] = time++;
    stack = [[s, -1, 0]];
    snap({ kind: 'root', u: s });
    while (stack.length) {
      maxH = Math.max(maxH, stack.length);
      const frame = stack[stack.length - 1];
      const u = frame[0];
      if (frame[2] < adj[u].length) {
        const [v, id] = adj[u][frame[2]++];
        if (id === frame[1]) { snap({ kind: 'skip', u, v }); continue; }
        if (disc[v] === -1) {
          disc[v] = low[v] = time++;
          stack.push([v, id, 0]);
          snap({ kind: 'push', u, v });
        } else {
          const before = low[u];
          low[u] = Math.min(low[u], disc[v]);
          snap({ kind: 'back', u, v, before });
        }
      } else {
        stack.pop();
        if (stack.length) {
          const p = stack[stack.length - 1][0];
          const before = low[p];
          low[p] = Math.min(low[p], low[u]);
          const br = low[u] > disc[p];
          if (br) bridges.push([p, u]);
          snap({ kind: 'pop', u, p, before, br });
        } else snap({ kind: 'end', u });
      }
    }
  }
  return { bridges, ev, maxH };
}
const IT = findBridges(5, G_E);
check(same(IT.bridges, [[3, 4], [1, 3]]) && IT.ev.length === 16, 'iterative run: same bridges');
const itNote = (e) => {
  const d = e.disc;
  switch (e.kind) {
    case 'root':
      return `Start at 0: disc[0] = low[0] = 0. Push frame [0,-1,0]. (Here disc[u] happens to equal u.)`;
    case 'skip':
      return `${e.u} reads ${e.v}: same edge id as its frame's parentEdge. Skip.`;
    case 'push':
      return `${e.u} reads ${e.v}: unvisited. disc[${e.v}] = low[${e.v}] = ${d[e.v]}. Push frame for ${e.v}.`;
    case 'back':
      return `${e.u} reads ${e.v}: visited. low[${e.u}] = min(${e.before}, disc[${e.v}]=${d[e.v]}) = ${e.low[e.u]}.`;
    case 'pop':
      return `${e.u} has no neighbours left: pop. low[${e.p}] = min(${e.before}, ${e.low[e.u]}) = ${e.low[e.p]}. ${e.low[e.u]} > disc[${e.p}]=${d[e.p]}? ${e.br ? `Bridge ${e.p}–${e.u}.` : 'No.'}`;
    case 'end':
      return `${e.u} is done and the stack is empty. Bridges: ${e.bridges.map(([a, b]) => `${a}–${b}`).join(', ')}.`;
  }
};
const itFrame = (e) => {
  const cur = e.kind === 'pop' ? e.p : e.u;
  const st = { ...hl(5, (i) => (e.disc[i] !== -1 ? 'visited' : '')), [cur]: 'active' };
  return {
    say: e.kind === 'pop' ? 2 : e.kind === 'push' ? 1 : e.kind === 'end' ? 2 : 0,
    note: itNote(e),
    panels: [
      gp(5, G_E, G_P, { st, es: { ...ek(e.bridges, 'bad'), ...(e.v !== undefined ? { [`${e.u}-${e.v}`]: 'active' } : {}) } }),
      stk(e.stack, 'frames [u, pe, next]'),
      arr(e.low, { label: 'low', highlights: e.kind === 'pop' ? { [e.p]: 'active' } : e.kind === 'back' ? { [e.u]: 'active' } : {} }),
    ],
  };
};
const IT_POP2 = IT.ev.find((e) => e.kind === 'pop' && e.u === 2);
const IT_BEFORE_POP2 = IT.ev[IT.ev.indexOf(IT_POP2) - 1];
check(IT_POP2.p === 1 && IT_POP2.low[1] === 0, 'pop 2 lowers low[1]');
// the fill([]) trap, run for real
const shared = new Array(3).fill([]);
shared[0].push(1);
const fresh = Array.from({ length: 3 }, () => []);
fresh[0].push(1);
check(same(shared, [[1], [1], [1]]) && same(fresh, [[1], [], []]), 'fill([]) shares one array');
const showAdj = (a) => a.map((x) => `[${x.join(',')}]`);
const P6_E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]];
const P6_P = P6_E.map((_, i) => [i, 0]).concat([[5, 0]]);
const P6 = findBridges(6, P6_E);
check(P6.maxH === 6 && P6.bridges.length === 5, 'path of 6: 6 frames at once');

// ====================== dry-run-bridges ======================
const DRY_TABLE = [
  ['visit 0', '0:0', '0:0', '—', ''],
  ['visit 1 (from 0)', '1:1', '1:1', '—', ''],
  ['visit 2 (from 1)', '2:2', '2:2', '—', ''],
  ['2 sees 0 (back edge)', '', '2:0', 'low[2] = min(2, disc[0]=0)', ''],
  ['return 2 → 1', '', '1:0', 'low[2]=0 > disc[1]=1?', 'no → 1–2 not a bridge'],
  ['visit 3 (from 1)', '3:3', '3:3', '—', ''],
  ['visit 4 (from 3)', '4:4', '4:4', '—', ''],
  ['return 4 → 3', '', '3:3', 'low[4]=4 > disc[3]=3?', 'bridge 3–4; 3 is a cut vertex'],
  ['return 3 → 1', '', '1:0', 'low[3]=3 > disc[1]=1?', 'bridge 1–3; 1 is a cut vertex'],
  ['return 1 → 0', '', '0:0', 'root has 1 child', '0 is NOT a cut vertex'],
];
const G_ROOT = G.ev.find((e) => e.kind === 'root');
const DRY_EV = G.ev.filter((e) => e.kind === 'visit' || (e.kind === 'back' && e.up) || e.kind === 'ret');
const DRY_ROWS = DRY_EV.map((e) => {
  if (e.kind === 'visit') return [e.p === -1 ? `visit ${e.u}` : `visit ${e.u} (from ${e.p})`, `${e.u}:${e.disc[e.u]}`, `${e.u}:${e.low[e.u]}`, '—', ''];
  if (e.kind === 'back') return [`${e.u} sees ${e.v} (back edge)`, '', `${e.u}:${e.low[e.u]}`, `low[${e.u}] = min(${e.before}, disc[${e.v}]=${e.disc[e.v]})`, ''];
  if (e.root) return [`return ${e.v} → ${e.u}`, '', `${e.u}:${e.low[e.u]}`, `root has ${G_ROOT.children} child`, `${e.u} is ${G_ROOT.rc ? '' : 'NOT '}a cut vertex`];
  return [
    `return ${e.v} → ${e.u}`,
    '',
    `${e.u}:${e.low[e.u]}`,
    `low[${e.v}]=${e.low[e.v]} > disc[${e.u}]=${e.disc[e.u]}?`,
    e.br ? `bridge ${e.u}–${e.v}${e.ct ? `; ${e.u} is a cut vertex` : ''}` : `no → ${e.u}–${e.v} not a bridge`,
  ];
});
check(same(DRY_ROWS, DRY_TABLE), 'dry run matches the lesson table');
const dryFrame = (e, row) => {
  return {
    say: e.kind === 'visit' ? 0 : e.kind === 'back' ? 1 : 2,
    note: [row[0], row[3] === '—' ? '' : row[3], row[4]].filter(Boolean).map((t) => `${t.startsWith('low') ? t[0] : t[0].toUpperCase()}${t.slice(1)}${t.endsWith('?') ? '' : '.'}`).join(' '),
    panels: [gG(e, { showCut: true }), discArr(e, e.kind === 'visit' ? [e.u] : []), lowArr(e, [e.u])],
  };
};
const DX_E = [...G_E, [0, 3]];
const DX = lowlink(5, DX_E);
check(same(DX.low, [0, 0, 0, 0, 4]) && same(DX.bridges, [[3, 4]]), 'dry turn: edge 0–3 changes only low[3]');
const DX_CHANGED = G.low.map((l, i) => (l !== DX.low[i] ? i : -1)).filter((i) => i !== -1);
check(same(DX_CHANGED, [3]), 'dry turn: one changed cell');

const steps = {
  what: [
    {
      kind: 'watch',
      title: 'Cut one cable, or one router',
      lines: [
        'A **bridge** is an edge whose removal increases the number of connected components.',
        'An edge that lies on a cycle has a detour. Removing it changes nothing.',
        'An **articulation point** is a node whose removal (with its edges) increases the number of components.',
      ],
      frames: [
        { say: 0, note: 'One network: 7 nodes, 7 edges, 1 connected piece.', panels: [wg(), vars({ pieces: 1 })] },
        { say: 0, note: 'Remove 3–4: nodes 4, 5, 6 are cut off. 2 pieces, so 3–4 is a bridge.', panels: [wg({ st: states([4, 5, 6], 'bad'), es: { '3-4': 'muted' } }), vars({ removed: '3–4', pieces: W_CUT34.count })] },
        { say: 1, note: 'Remove 0–1 instead: 0 still reaches 1 via 0–3–2–1. Still 1 piece.', panels: [wg({ st: states([0, 1, 2, 3], 'visited'), es: { '0-1': 'muted', ...ek([[0, 3], [3, 2], [2, 1]], 'active') } }), vars({ removed: '0–1', pieces: W_CUT01.count })] },
        { say: 2, note: 'Remove node 4 with its edges: {0,1,2,3}, {5} and {6}. 3 pieces.', panels: [wg({ st: { 4: 'muted', 5: 'bad', 6: 'bad' }, es: ek([[3, 4], [4, 5], [4, 6]], 'muted') }), vars({ removed: 'node 4', pieces: W_NODE4.count })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the cut vertices',
      lines: ['Try removing each node in your head.', 'Count the ones that leave more than one piece.'],
      panels: [wg()],
      task: { type: 'number', question: 'How many articulation points does this graph have?', options: [1, 2, 3, 4], answer: W_APS.length, hint: 'Square nodes have a detour around them. Check the nodes on the tail.' },
      solved: 'Nodes 3 and 4. Removing any square node 0, 1 or 2 leaves the rest connected.',
      then: [{ say: 1, note: 'Articulation points: 3 and 4.', panels: [wg({ st: states(W_APS, 'bad') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: one-way streets',
      lines: ['Edges now have a direction.', 'Nodes 0, 1 and 2 can each reach the other two.'],
      panels: [gp(4, S_E, S_P, { directed: true, st: states([0, 1, 2], 'window') })],
      task: {
        type: 'choose',
        question: 'Which tool finds groups where every node can reach every other?',
        options: [
          { text: 'Strongly connected components (Kosaraju / Tarjan)', why: '' },
          { text: 'Bridges (low-link DFS)', why: 'Bridges are an undirected tool. They find edges whose removal splits the graph.' },
          { text: 'Eulerian path (Hierholzer)', why: 'Hierholzer uses every edge exactly once. It does not group nodes.' },
        ],
        answer: 0,
      },
      solved: 'A maximal group of mutually reachable nodes in a directed graph is an SCC.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'A DFS tree has no sideways edges',
      lines: [
        'Slow way: remove each edge and run a BFS. E × O(V + E). For 10^5 edges, ~10^10 operations.',
        'Fast way: one DFS, O(V + E). It works because of a fact about undirected DFS trees.',
        'Every non-tree edge connects a node to one of its **ancestors**. No "cross edges".',
      ],
      frames: [
        { say: 0, note: '10^5 edges, one BFS each, each BFS touches up to all 10^5 edges.', panels: [vars({ E: '10^5', 'BFS runs': '10^5', work: '~10^10' })] },
        ...Y_SHOW.map((e) => ({
          say: e.kind === 'back' ? 2 : 1,
          note:
            e.kind === 'back'
              ? '2 sees 0, which is still on the path above it: a back edge to an ancestor.'
              : e.u === 2
                ? '3 walks 3–2 because 2 is still unvisited. So 3–2 becomes a tree edge, not a sideways one.'
                : `DFS reaches ${e.u}${e.p === -1 ? ' (start)' : ` from ${e.p}`}.`,
          panels: [gp(4, Y_E, Y_P, { st: { ...states(e.path, 'visited'), [e.u]: 'active' }, es: { ...ek(e.tree, 'done'), ...ek(e.back, 'active') } })],
        })),
        { say: 2, note: 'Done: tree edges 0–1, 1–3, 3–2 and one back edge 2 ⇢ 0. Nothing sideways.', panels: [gp(4, Y_E, Y_P, { st: states([0, 1, 2, 3], 'done'), es: { ...ek(Y.tree, 'done'), ...ek(Y.back, 'active') } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the back edges',
      lines: ['DFS from 0, neighbours in edge order.', 'Every edge is either a **tree edge** or a **back edge**.'],
      panels: [gp(6, H_E, H_P)],
      task: { type: 'number', question: 'How many back edges will the DFS find?', options: [1, 2, 3, 4], answer: H.back.length, hint: 'The DFS reaches every node. Each node except 0 is entered through exactly one tree edge.' },
      solved: '8 edges, 5 of them tree edges, so 3 back edges. Each one lands on an ancestor.',
      then: [
        ...H.ev
          .filter((e) => e.kind === 'back' && e.up)
          .map((e) => ({
            say: 1,
            note: `${e.u} ⇢ ${e.v}: ${e.v} is on the path ${e.path.join(' → ')}, so it is an ancestor of ${e.u}.`,
            panels: [gp(6, H_E, H_P, { st: { ...states(e.path, 'visited'), [e.u]: 'active', [e.v]: 'window' }, es: { ...ek(H.tree, 'done'), ...ek(e.back, 'active') } })],
          })),
      ],
    },
  ],

  when: [
    {
      kind: 'turn',
      title: 'Your turn: the critical cable',
      lines: ['Servers joined by two-way cables.', 'The task: list every cable whose failure splits the network.'],
      panels: [gp(6, B2_E, B2_P, { label: 'undirected' })],
      task: {
        type: 'choose',
        question: 'Which technique fits?',
        options: [
          { text: 'Low-link DFS (bridges)', why: '' },
          { text: 'SCC (Kosaraju) + condensation', why: 'SCCs are for directed graphs and mutually reachable groups. These cables are two-way.' },
          { text: 'Eulerian path (Hierholzer)', why: 'Hierholzer walks every edge exactly once. Nothing here asks for a walk.' },
        ],
        answer: 0,
      },
      solved: 'Undirected and "which link is critical": low-link DFS for bridges.',
    },
    {
      kind: 'turn',
      title: 'Your turn: one array of arrows',
      lines: ['The input is one array `next`.', 'Node i has exactly one arrow: i → next[i].'],
      panels: [arr([1, 2, 0, 2], { label: 'next' }), gp(4, [[0, 1], [1, 2], [2, 0], [3, 2]], S_P, { directed: true })],
      task: {
        type: 'choose',
        question: 'Which technique fits?',
        options: [
          { text: 'Functional graph: peel trees with in-degree, study the cycles', why: '' },
          { text: 'Low-link DFS (articulation points)', why: 'Low-link works on undirected graphs. These are arrows.' },
          { text: 'BFS over meta-nodes (routes)', why: 'That is for "minimum number of buses/lines". Here there are no routes or groups.' },
        ],
        answer: 0,
      },
      solved: 'One array next[i] or favorite[i]: a functional graph.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'A tiny answer: test each case',
      lines: ['"Minimum cells to remove to disconnect an island" is always 0, 1 or 2.', 'Case 0: is the land already split?', 'Case 1: does removing one cell split it?'],
      frames: [
        { say: 0, note: 'One island of 9 land cells.', panels: [grid(ISL, islState(ISL), 'land'), vars({ islands: 1 })] },
        { say: 1, note: 'Count islands: 1. Not already disconnected, so the answer is not 0.', panels: [grid(ISL, islState(ISL), 'land'), vars({ islands: islands(ISL), answer: '≥ 1' })] },
        { say: 2, note: 'Remove the cell at row 1, column 2: the left and right blocks fall apart. 2 islands, so the answer is 1.', panels: [grid(ISL_CUT, islState(ISL_CUT, [1, 2]), 'land'), vars({ islands: islands(ISL_CUT), answer: 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: node or edge?',
      lines: ['Checklist: directed or undirected? Nodes or edges?', '"Which **router**, if it fails, splits this network?"'],
      panels: [gp(7, W_E, W_P, { label: 'undirected' })],
      task: {
        type: 'choose',
        question: 'What are you looking for?',
        options: [
          { text: 'Articulation points: a router is a node', why: '' },
          { text: 'Bridges', why: 'Bridges are edges. "Remove an edge" means bridge; here a node fails.' },
          { text: 'Strongly connected components', why: 'SCCs are a directed tool. This network is undirected.' },
        ],
        answer: 0,
      },
      solved: 'Undirected and "remove a node": articulation points.',
    },
  ],

  'intuition-lowlink': [
    {
      kind: 'watch',
      title: 'Stamp a discovery time',
      lines: ['DFS gives each node a **timestamp** the moment it is first reached.', 'That is its **discovery time**, `disc[u]`.', 'An edge to an already visited ancestor is a **back edge**.'],
      frames: [
        { say: 0, note: 'The lesson graph: triangle 0–1–2 and tail 1–3–4.', panels: [gp(5, G_E, G_P), arr(['-', '-', '-', '-', '-'], { label: 'disc' })] },
        ...G_VISITS.map((e) => ({
          say: e.kind === 'back' ? 2 : 1,
          note: e.kind === 'back' ? '2 sees 0, already visited and above it: back edge 2 ⇢ 0.' : `Reach ${e.u}${e.p === -1 ? '' : ` from ${e.p}`}: disc[${e.u}] = ${e.disc[e.u]}.`,
          panels: [gG(e), discArr(e, e.kind === 'visit' ? [e.u] : [])],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'low: how high can the subtree climb?',
      lines: [
        '`low[u]` = smallest disc reachable from u: down tree edges, then **at most one back edge** up.',
        'A back edge 2 ⇢ 0 pulls low[2] down to disc[0].',
        'On return, the parent takes the child\'s low if it is smaller.',
      ],
      frames: [
        { say: 0, note: 'Every low starts equal to disc.', panels: [gG(G.ev.find((e) => e.kind === 'visit' && e.u === 2)), lowArr(G.ev.find((e) => e.kind === 'visit' && e.u === 2))] },
        ...G_LOWS.map((e) => ({
          say: e.kind === 'back' ? 1 : 2,
          note: e.kind === 'back' ? `low[2] = min(2, disc[0]=0) = 0.` : `Return ${e.v} → ${e.u}: low[${e.u}] = min(${e.before}, low[${e.v}]=${e.low[e.v]}) = ${e.low[e.u]}.`,
          panels: [gG(e, { showCut: false, es: ek(e.bridges, 'done') }), lowArr(e, [e.u])],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'Read the verdicts',
      lines: [
        'Tree edge p → c: if `low[c] > disc[p]`, c\'s subtree cannot even reach p. **p–c is a bridge.**',
        'If `low[c] >= disc[p]`, the subtree cannot reach above p. **p is an articulation point** (unless p is the root).',
      ],
      frames: [
        { say: 0, note: 'disc = [0,1,2,3,4], low = [0,0,0,3,4]. Check the tree edges.', panels: [gG(G.ev.at(-1), { showCut: false, es: ek(G.bridges, 'done') }), discArr(G.ev.at(-1)), lowArr(G.ev.at(-1))] },
        { say: 0, note: 'Edge 1–2: low[2]=0 > disc[1]=1? No. The back edge 2 ⇢ 0 is the detour.', panels: [gp(5, G_E, G_P, { st: { 1: 'active', 2: 'active' }, es: { ...ek(G.tree, 'done'), '1-2': 'active', ...ek(G.back, 'active') } }), discArr(G.ev.at(-1), [1]), lowArr(G.ev.at(-1), [2])] },
        { say: 0, note: 'Edge 1–3: low[3]=3 > disc[1]=1. Bridge.', panels: [gp(5, G_E, G_P, { st: { 1: 'active', 3: 'active' }, es: { ...ek(G.tree, 'done'), ...ek(G.back, 'active'), '1-3': 'bad' } }), discArr(G.ev.at(-1), [1]), lowArr(G.ev.at(-1), [], [3])] },
        { say: 0, note: 'Edge 3–4: low[4]=4 > disc[3]=3. Bridge.', panels: [gp(5, G_E, G_P, { st: { 3: 'active', 4: 'active' }, es: { ...ek(G.tree, 'done'), ...ek(G.back, 'active'), ...ek(G.bridges, 'bad') } }), discArr(G.ev.at(-1), [3]), lowArr(G.ev.at(-1), [], [3, 4])] },
        { say: 1, note: 'Those same tests pass >= too: 1 and 3 are articulation points.', panels: [gG(G.ev.at(-1)), discArr(G.ev.at(-1), [1, 3]), lowArr(G.ev.at(-1), [3, 4])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: add one edge',
      lines: ['Same graph, plus an edge 4–1.', 'DFS order is unchanged: disc = [0,1,2,3,4].', 'Now 4 has a back edge up to 1.'],
      panels: [gp(5, GX_E, G_P, { es: { '4-1': 'active' } }), arr([0, 1, 2, 3, 4], { label: 'disc' })],
      task: { type: 'number', question: 'What is low[3] now?', options: [0, 1, 3, 4], answer: GX.low[3], hint: 'low[4] = min(4, disc[1]). Then 3 takes its child\'s low on return.' },
      solved: 'low[4] = 1 flows up: low[3] = min(3, 1) = 1. Now 1–3 and 3–4 lie on a cycle.',
      then: [
        { say: 2, note: 'low = [0,0,0,1,1]. No tree edge passes low[c] > disc[p]: no bridges.', panels: [evGraph(5, GX_E, G_P, GX.ev.at(-1), { showCut: false }), lowArr(GX.ev.at(-1), [3, 4])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the bridge',
      lines: ['Two triangles joined by one edge. DFS from 0.', 'The tree runs 0 → 1 → 2 → 3 → 4 → 5.', 'Back edges: 2 ⇢ 0 and 5 ⇢ 3.'],
      panels: [gp(6, T2_E, T2_P, { es: { ...ek(T2.tree, 'done'), ...ek(T2.back, 'active') } }), arr(T2.disc, { label: 'disc' }), arr(T2.low, { label: 'low' })],
      task: {
        type: 'cell',
        panel: 2,
        question: 'Tap the child c whose low[c] > disc[parent].',
        answer: 3,
        hints: { 0: '0 is the root. It has no parent edge.', 1: 'low[1]=0 is not > disc[0]=0.', 2: 'low[2]=0 is not > disc[1]=1.', 4: 'low[4]=3 is not > disc[3]=3.', 5: 'low[5]=3 is not > disc[4]=4.' },
      },
      solved: 'low[3]=3 > disc[2]=2: nothing below 3 climbs back to 2. Edge 2–3 is the bridge.',
      then: [{ say: 0, note: 'Bridge 2–3.', panels: [evGraph(6, T2_E, T2_P, T2_END, { showCut: false }), arr(T2.low, { label: 'low', highlights: { 3: 'bad' } })] }],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Delete, search, put back',
      lines: ['For each edge `skip`: rebuild the graph without it.', 'Search from one end a. Can it still reach the other end b?', 'If not, edges[skip] is a bridge.'],
      frames: [
        { say: 0, note: 'The lesson graph, 5 edges: 5 full searches.', panels: [gp(5, G_E, G_P), vars({ edges: 5, bridges: 0 })] },
        ...BG.runs.map(bfFrame),
        { say: 2, note: `Result: ${BG.result.map(([a, b]) => `${a}–${b}`).join(', ')}. Every search rediscovered almost the same tree.`, panels: [gp(5, G_E, G_P, { es: ek(BG.result, 'bad') }), vars({ searches: 5, bridges: BG.result.length })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: predict the result',
      lines: ['A square 0–1–2–3 with a tail 2–4–5.', 'bridgesBrute runs one search per edge.'],
      panels: [gp(6, B2_E, B2_P), vars({ edges: 6 })],
      task: { type: 'number', question: 'How many of the 6 searches fail to reach b?', options: [1, 2, 3, 6], answer: B2.result.length, hint: 'A square edge has a detour the other way round the square.' },
      solved: 'Only 2–4 and 4–5. The other 4 searches were spent just to say "not a bridge".',
      then: [{ say: 1, note: 'Bridges: 2–4 and 4–5.', panels: [gp(6, B2_E, B2_P, { es: ek(B2.result, 'bad'), st: states([4, 5], 'bad') }), vars({ searches: 6, bridges: 2 })] }],
    },
  ],

  'optimized-bridges': [
    {
      kind: 'watch',
      title: 'Adjacency with edge ids',
      lines: ['Each entry is `[neighbour, edgeId]`.', 'Both ends of an edge store the same id.', 'So parallel edges can be told apart.'],
      frames: adjBuild.map((b) => ({
        say: b.id === 0 ? 0 : b.id === 1 ? 1 : 2,
        note: `Edge e${b.id} = ${b.u}–${b.v}: push ${b.v}·e${b.id} to ${b.u}, and ${b.u}·e${b.id} to ${b.v}.`,
        panels: [gp(5, G_E, G_P, { es: { [`${b.u}-${b.v}`]: 'active', ...ek(G_E.slice(b.id + 1), 'muted') }, el: G_EL }), adjTable(b.id + 1, [b.cu, b.cv])],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the first entry of 1',
      lines: ['dfs(0, -1) went down e0 and called dfs(1, 0).', 'disc[1] = low[1] = 1.', 'Node 1 now reads its first entry: [0, 0].'],
      panels: [gG(G_SKIP1, { el: G_EL, es: { '0-1': 'active' } }), stk(['dfs(0, -1)', 'dfs(1, 0)'], 'calls'), adjTable(5, [[1, 0]])],
      task: {
        type: 'choose',
        question: 'What does dfs(1, 0) do with [0, 0]?',
        options: [
          { text: 'Skip it: id 0 is the parentEdge it came in on', why: '' },
          { text: 'Back edge: low[1] = min(1, disc[0]) = 0', why: 'That would treat the tree edge as its own detour. low[1] would drop for no reason.' },
          { text: 'Recurse into 0', why: '0 is already visited (disc[0] = 0), so it is never re-entered.' },
        ],
        answer: 0,
      },
      solved: 'Only the exact edge id we arrived through is skipped.',
      then: [{ say: 2, note: 'Skip. 1 moves on to 2·e1.', panels: [gG(G.ev.find((e) => e.kind === 'visit' && e.u === 2), { el: G_EL }), stk(['dfs(0, -1)', 'dfs(1, 0)', 'dfs(2, 1)'], 'calls'), adjTable(5, [[1, 1]])] }],
    },
    {
      kind: 'watch',
      title: 'Two pieces, two roots',
      lines: [
        'DFS(u, parentEdge): `disc[u] = low[u] = time++`.',
        'Unvisited v: recurse, take low[v], test. Visited v: back edge, take disc[v].',
        'Root rule: a DFS root is a cut vertex iff it has ≥ 2 tree children.',
        'Repeat from every unvisited node: the graph may be disconnected.',
      ],
      frames: C_SHOW.map((e) => ({
        say: e.kind === 'start' ? 3 : e.kind === 'root' ? 2 : e.kind === 'visit' ? 0 : 1,
        note: evNote(e),
        panels: [evGraph(6, C_E, C_P, e), discArr(e, e.kind === 'visit' ? [e.u] : []), lowArr(e, e.kind === 'back' || e.kind === 'ret' ? [e.u] : [])],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: how many roots?',
      lines: ['`for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);`', 'Seven nodes, four edges.'],
      panels: [gp(7, K_E, K_P)],
      task: { type: 'number', question: 'How many times does the outer loop call dfs(s, -1)?', options: [1, 3, 4, 7], answer: K_ROOTS.length, hint: 'One call visits a whole connected piece.' },
      solved: `Three: s = ${seq(K_ROOTS)}. Every other s is already visited.`,
      then: [{ say: 1, note: `Roots ${seq(K_ROOTS)}, one per piece.`, panels: [gp(7, K_E, K_P, { st: { ...states([0, 1, 2, 3, 4, 5, 6], 'done'), ...states(K_ROOTS, 'active') }, es: ek(K.tree, 'done') }), arr(K.disc, { label: 'disc', highlights: states(K_ROOTS, 'active') })] }],
    },
  ],

  'template-bridges': [
    {
      kind: 'watch',
      title: 'The call stack on a triangle',
      lines: ['Each call carries `parentEdge`: the id it came in on. The root gets -1.', 'Unvisited neighbour: `children++` and recurse.', 'Visited neighbour: `low[u] = Math.min(low[u], disc[v])`.'],
      frames: T_SHOW.map((e) => ({
        say: e.kind === 'back' ? 2 : e.kind === 'visit' && e.p !== -1 ? 1 : 0,
        note: evNote(e),
        panels: [evGraph(3, T_E, T_P, e, { el: T_EL }), stk(callStack(e), 'calls'), lowArr(e, e.kind === 'back' || e.kind === 'ret' ? [e.u] : [])],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the tree-edge branch',
      lines: ['Inside `if (disc[v] === -1)`.', 'Put the four parts in the order the template runs them.'],
      panels: [gp(3, T_E, T_P, { el: T_EL, st: { 0: 'visited', 1: 'active' }, es: { '0-1': 'done', '1-2': 'active' } }), stk(['dfs(0, -1)', 'dfs(1, 0)'], 'calls')],
      task: {
        type: 'order',
        question: 'Order the tree-edge branch.',
        items: ['children++', 'dfs(v, id)', 'low[u] = Math.min(low[u], low[v])', 'bridge and cut tests'],
        hint: 'low[v] is only final after the child call returns, and the tests read low.',
      },
      solved: 'Count the child, recurse, take its low, then test.',
    },
  ],

  'implementation-bridges': [
    {
      kind: 'watch',
      title: 'Frames instead of calls',
      lines: [
        'Each frame is `[node, parentEdgeId, next neighbour index]`.',
        'An unvisited neighbour: stamp it and push its frame (the "recursive call").',
        'No neighbours left: pop, then update the parent (the "return").',
      ],
      frames: IT.ev.map(itFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: the moment of return',
      lines: ['Frame [2,1,2] has read both its neighbours.', 'low[2] is already 0 from the back edge to 0.'],
      panels: [itFrame(IT_BEFORE_POP2).panels[0], itFrame(IT_BEFORE_POP2).panels[1], itFrame(IT_BEFORE_POP2).panels[2]],
      task: {
        type: 'choose',
        question: 'What happens on the next loop turn?',
        options: [
          { text: 'Pop 2, then low[1] = min(low[1], low[2]) and the bridge test', why: '' },
          { text: 'Pop 2 and nothing else', why: 'The parent still needs the child\'s low. That line moved to the pop.' },
          { text: 'Push 2 again to re-check its neighbours', why: 'frame[2] already passed the end of adj[2]. Visited nodes are never pushed again.' },
        ],
        answer: 0,
      },
      solved: 'The code after the recursive call runs when the child frame is popped.',
      then: [{ ...itFrame(IT_POP2), say: 1 }],
    },
    {
      kind: 'watch',
      title: 'The fill([]) trap',
      lines: ['`new Array(n).fill([])` puts the **same** array in every slot.', '`Array.from({ length: n }, () => [])` makes a fresh one each time.'],
      frames: [
        { say: 0, note: 'new Array(3).fill([]), then adj[0].push(1).', panels: [arr(showAdj(shared), { label: 'fill([])', highlights: { 0: 'active', 1: 'bad', 2: 'bad' } })] },
        { say: 0, note: 'Slots 1 and 2 show [1] too: one shared array.', panels: [arr(showAdj(shared), { label: 'fill([])', highlights: { 1: 'bad', 2: 'bad' } })] },
        { say: 1, note: 'Array.from with () => [], then adj[0].push(1). Only slot 0 changes.', panels: [arr(showAdj(fresh), { label: 'Array.from', highlights: { 0: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a path graph',
      lines: ['A path graph makes DFS as deep as the number of nodes.', 'Here the depth lives in an array, not the call stack.'],
      panels: [gp(6, P6_E, P6_P), stk([], 'frames')],
      task: { type: 'number', question: 'At its tallest, how many frames are on the stack?', options: [2, 3, 5, 6], answer: P6.maxH, hint: 'Each node pushes the next one before anything is popped.' },
      solved: 'All 6 at once. With 10^5 nodes that is 10^5 frames in an array: fine.',
      then: [
        {
          say: 1,
          note: 'Just before 5 is popped: 6 frames.',
          panels: [gp(6, P6_E, P6_P, { st: { ...states([0, 1, 2, 3, 4], 'visited'), 5: 'active' }, es: ek(P6_E, 'done') }), stk(P6.ev.find((e) => e.kind === 'push' && e.v === 5).stack, 'frames')],
        },
      ],
    },
  ],

  'dry-run-bridges': [
    {
      kind: 'watch',
      title: 'The dry run, row by row',
      lines: ['**visit**: disc = low = time++.', '**sees**: a back edge pulls low down to disc of the ancestor.', '**return**: the parent takes the child\'s low, then tests it.'],
      frames: [
        ...DRY_EV.map((e, i) => dryFrame(e, DRY_TABLE[i])),
        { say: 2, note: 'Bridges: 1–3, 3–4. Articulation points: 1, 3.', panels: [gG(G.ev.at(-1)), discArr(G.ev.at(-1)), lowArr(G.ev.at(-1))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: add edge 0–3',
      lines: ['Run the same dry run with one more edge: 0–3.', 'DFS order is the same: 0, 1, 2, 3, 4.', 'The dry run ended with low = [0,0,0,3,4].'],
      panels: [gp(5, DX_E, G_P, { es: { '0-3': 'active' } }), arr(G.low, { label: 'low (before)' })],
      task: {
        type: 'cell',
        panel: 1,
        question: 'Which low[] value ends up different?',
        answer: DX_CHANGED[0],
        hints: { 0: 'low[0] was already 0, the smallest possible.', 1: 'low[1] was already 0.', 2: 'low[2] was already 0.', 4: 'Nothing below 4 has a new edge. low[4] stays 4.' },
      },
      solved: '3 now sees 0: low[3] = min(3, disc[0]=0) = 0. So 1–3 is no longer a bridge.',
      then: [
        { say: 0, note: 'low = [0,0,0,0,4]. Only 3–4 is still a bridge.', panels: [evGraph(5, DX_E, G_P, DX.ev.at(-1)), lowArr(DX.ev.at(-1), [3])] },
      ],
    },
  ],
};

export default { ...steps, ...secondPart };
