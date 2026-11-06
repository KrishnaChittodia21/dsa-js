// Shorts for Graphs (M9). Format: src/content/shortSchema.js. Facts come only from topics/graphs/topic.js.
// Every adjacency list, visit order, queue / stack content, dist, colour, mask and label below comes from running the
// pattern's template (adjacency lists built in edge order) on its own "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const list = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/graphs.js: ${msg}`);
};

// ---------- drawing ----------
// pos: [x, y] per vertex. o.st: vertex → state, o.tag: vertex → tag above it, o.es: 'u-v' → edge state (either order)
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({
    id: i,
    label: String(i),
    x: pos[i][0],
    y: pos[i][1],
    ...(o.st?.[i] ? { state: o.st[i] } : {}),
    ...(o.tag?.[i] !== undefined ? { tag: String(o.tag[i]) } : {}),
  })),
  edges: edges.map(([u, v]) => {
    const s = o.es?.[`${u}-${v}`] ?? o.es?.[`${v}-${u}`];
    return { from: u, to: v, ...(s ? { state: s } : {}) };
  }),
});
const adjOf = (n, edges) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj;
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const mapG = (g, f) => g.map((row, r) => row.map((v, c) => f(v, r, c)));
const inside = (g, r, c) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const cn = (r, c) => `${r},${c}`;

// ====================== graph-adjacency-representation: e.g. n = 5 ======================
const AN = 5;
const AE = [[0, 1], [1, 2], [3, 1], [1, 4], [2, 4]];
const AP = [[0, 0], [1, 1], [2, 0], [0, 2], [2, 2]];
const A_RUN = [];
{
  const adj = Array.from({ length: AN }, () => []);
  const degree = new Array(AN).fill(0);
  for (const [u, v] of AE) {
    adj[u].push(v);
    degree[u]++;
    adj[v].push(u);
    degree[v]++;
    A_RUN.push({ u, v, adj: adj.map((a) => a.slice()), degree: degree.slice() });
  }
}
const A_END = A_RUN.at(-1);
check(list(A_END.adj[1]) === '[0, 2, 3, 4]' && list(A_END.degree) === '[1, 4, 2, 1, 2]', 'adjacency list');
check(A_END.degree.reduce((a, b) => a + b, 0) === 2 * AE.length, 'sum of degrees = 2m');
const aTable = (r, hot) =>
  table(
    Array.from({ length: AN }, (_, i) => String(i)),
    ['adj', 'degree'],
    r.adj.map((a, i) => [list(a), String(r.degree[i])]),
    hot === undefined ? 'adj + degree' : `adj + degree (edge [${hot[0]}, ${hot[1]}] added)`,
  );
const aFrames = A_RUN.map((r, k) => ({
  say: k === 0 ? 0 : 1,
  note: `Edge [${r.u}, ${r.v}]: push ${r.v} into adj[${r.u}] and ${r.u} into adj[${r.v}]; both degrees +1.`,
  panels: [gp(AN, AE.slice(0, k + 1), AP, { st: { [r.u]: 'active', [r.v]: 'active' }, es: { [`${r.u}-${r.v}`]: 'active' } }), aTable(r, [r.u, r.v])],
}));
// the turn: the shared-array trap, run for real
const A_TRAP = (() => {
  const adj = new Array(3).fill([]);
  for (const [u, v] of [[0, 1]]) {
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj[2].slice();
})();
check(list(A_TRAP) === '[1, 0]', 'fill([]) shares one array');

// ====================== graph-dfs: e.g. n = 6 ======================
const DN = 6;
const DE = [[0, 2], [2, 4], [4, 0], [1, 3]];
const DPOS = [[0, 0], [2, 0], [1, 1], [3, 0], [0, 2], [3, 1.5]];
const dfsComponents = (n, edges) => {
  const adj = adjOf(n, edges);
  const visited = new Uint8Array(n);
  const ev = [];
  const path = [];
  const launches = [];
  let components = 0;
  const dfs = (u) => {
    visited[u] = 1;
    path.push(u);
    ev.push({ u, comp: components, launch: path.length === 1, path: path.slice(), visited: Array.from(visited) });
    for (const v of adj[u]) if (!visited[v]) dfs(v);
    path.pop();
  };
  for (let s = 0; s < n; s++) {
    if (!visited[s]) {
      components++;
      launches.push(s);
      dfs(s);
    }
  }
  return { ev, components, launches };
};
const D_RUN = dfsComponents(DN, DE);
check(D_RUN.components === 3 && seq(D_RUN.launches) === '0, 1, 5', 'dfs components');
const D_COMP = {}; // vertex → its component number
for (const e of D_RUN.ev) D_COMP[e.u] = e.comp;
const dFrames = D_RUN.ev.map((e, k) => {
  const before = D_RUN.ev.slice(0, k).map((x) => x.u);
  return {
    say: e.launch ? 2 : 0,
    note: e.launch
      ? `Outer loop: ${e.u} is unvisited → components = ${e.comp}, dfs(${e.u}). Mark ${e.u} on entry.`
      : `dfs(${e.u}): mark ${e.u}. ${D_RUN.ev[k + 1] && !D_RUN.ev[k + 1].launch ? `Go deeper: dfs(${D_RUN.ev[k + 1].u}).` : 'No unvisited neighbour left: backtrack.'}`,
    panels: [
      gp(DN, DE, DPOS, { st: { ...states(before, 'done'), ...states(e.path, 'visited'), [e.u]: 'active' }, tag: Object.fromEntries([...before, e.u].map((u) => [u, `c${D_COMP[u]}`])) }),
      stk(e.path.map(String), 'recursion (current path)'),
      vars({ components: e.comp }),
    ],
  };
});
// the turn: another e.g. graph
const DT_E = [[3, 0], [2, 5], [5, 4]];
const DT_RUN = dfsComponents(6, DT_E);
check(seq(DT_RUN.launches) === '0, 1, 2' && DT_RUN.components === 3, 'turn launches');
const DT_POS = [[0, 0], [1, 1], [2, 0], [0, 1], [3, 1], [3, 0]];

// ====================== graph-bfs: e.g. n = 6 ======================
const BN = 6;
const BE = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3], [3, 5]];
const BPOS = [[0, 1], [1, 0], [2, 0], [3, 1], [1.5, 2], [4, 1]];
const B_ADJ = adjOf(BN, BE);
// DFS (mark on entry) with depth = edges on the path it took
const B_DFS = {};
{
  const go = (u, d) => {
    B_DFS[u] = d;
    for (const v of B_ADJ[u]) if (B_DFS[v] === undefined) go(v, d + 1);
  };
  go(0, 0);
}
const B_RUN = [];
let B_DIST;
{
  const dist = new Array(BN).fill(-1);
  dist[0] = 0;
  const queue = [0];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const found = [];
    const skipped = [];
    for (const v of B_ADJ[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        queue.push(v);
        found.push(v);
      } else skipped.push(v);
    }
    B_RUN.push({ u, head, found, skipped, dist: dist.slice(), queue: queue.slice() });
  }
  B_DIST = dist;
}
check(B_DFS[3] === 3 && B_DFS[4] === 4 && B_DIST[3] === 2 && B_DIST[4] === 1, 'dfs detour vs bfs');
const bTag = (dist) => Object.fromEntries(dist.map((d, v) => [v, d === -1 ? '?' : `d=${d}`]).filter(([, t]) => t !== '?'));
const bFrame = (r, k) => {
  const popped = B_RUN.slice(0, k).map((x) => x.u);
  return {
    say: 1,
    note: `Pop ${r.u} (d = ${r.dist[r.u]}). ${r.found.length ? `New: ${r.found.map((v) => `${v} → ${r.dist[v]}`).join(', ')}, pushed.` : 'No new neighbours.'}${r.skipped.length ? ` ${seq(r.skipped)} already found: skip.` : ''}`,
    panels: [
      gp(BN, BE, BPOS, { st: { ...states(popped, 'done'), ...states(r.queue.slice(r.head + 1), 'visited'), [r.u]: 'active' }, tag: bTag(r.dist) }),
      arr(r.queue.map(String), { label: 'queue', pointers: [ptr(r.head, 'head')], highlights: hl(r.queue.length, (x) => (x < r.head ? 'muted' : x === r.head ? 'active' : r.found.includes(r.queue[x]) ? 'window' : '')) }),
    ],
  };
};
const B_T = 3; // the turn: pop 2, its neighbour 3 already has a distance
check(B_RUN[B_T].u === 2 && B_RUN[B_T].found.length === 0 && B_RUN[B_T].skipped.includes(3), 'turn pop');

// ====================== grid-graph-traversal: e.g. 4 × 4 ======================
const IG = [[0, 1, 1, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 0, 1, 1]];
const countRegions = (g0, dirs) => {
  const g = g0.map((row) => row.slice());
  const R = g.length;
  const C = g[0].length;
  const launches = [];
  const sink = (r, c, own) => {
    if (r < 0 || r >= R || c < 0 || c >= C || g[r][c] !== 1) return;
    g[r][c] = 0;
    own.push(cn(r, c));
    for (const [dr, dc] of dirs) sink(r + dr, c + dc, own);
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (g[r][c] === 1) {
        const own = [];
        sink(r, c, own);
        launches.push({ r, c, own, grid: g.map((row) => row.slice()) });
      }
  return launches;
};
const I_RUN = countRegions(IG, DIRS);
const I_RUN8 = countRegions(IG, [...DIRS, ...DIAG]);
check(I_RUN.length === 3 && I_RUN8.length === 2, 'islands 4-dir and 8-dir');
const iFrames = I_RUN.map((L, k) => {
  const before = new Set(I_RUN.slice(0, k).flatMap((x) => x.own));
  const own = new Set(L.own);
  return {
    say: 1,
    note: `Scan hits land at (${L.r}, ${L.c}): count = ${k + 1}. sink() floods ${L.own.length} cell${L.own.length > 1 ? 's' : ''}, writing 0.`,
    panels: [grid(L.grid, mapG(IG, (_, r, c) => (r === L.r && c === L.c ? 'active' : own.has(cn(r, c)) ? 'done' : before.has(cn(r, c)) ? 'muted' : '')), 'grid (sunk cells are 0)'), vars({ count: k + 1 })],
  };
});
const I_AT = [1, 2];
const I_NB = DIRS.map(([dr, dc]) => [I_AT[0] + dr, I_AT[1] + dc]);
check(I_NB.filter(([r, c]) => IG[r][c] === 1).length === 1, 'neighbours of (1, 2)');

// ====================== multi-source-bfs: e.g. 3 × 4, sources are the 0s ======================
const MG = [[1, 1, 1, 1], [0, 1, 1, 1], [1, 1, 1, 0]];
let M_DIST;
let M_Q;
{
  const R = MG.length;
  const C = MG[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
  const queue = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (MG[r][c] === 0) (dist[r][c] = 0), queue.push([r, c]);
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  M_DIST = dist;
  M_Q = queue;
}
const M_MAX = Math.max(...M_DIST.flat());
check(JSON.stringify(M_DIST) === '[[1,2,3,2],[0,1,2,1],[1,2,1,0]]' && M_MAX === 3, 'multi-source dist');
const M_WAVES = Array.from({ length: M_MAX + 1 }, (_, d) => M_Q.filter(([r, c]) => M_DIST[r][c] === d));
check(M_WAVES[0].length === 2, 'two sources');
// one single-source BFS from (0, 2) alone, as the brute force would run it: steps until it meets a 0
const M_ONE = (() => {
  const seen = new Set([cn(0, 2)]);
  let frontier = [[0, 2]];
  for (let d = 0; frontier.length; d++) {
    if (frontier.some(([r, c]) => MG[r][c] === 0)) return { d, seen: seen.size };
    const next = [];
    for (const [r, c] of frontier)
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (inside(MG, nr, nc) && !seen.has(cn(nr, nc))) seen.add(cn(nr, nc)), next.push([nr, nc]);
      }
    frontier = next;
  }
  return null;
})();
check(M_ONE.d === M_DIST[0][2], 'one brute-force BFS agrees');
const M_ONES = MG.flat().filter((v) => v === 1).length;
const mFrames = M_WAVES.map((wave, k) => ({
  say: k === 0 ? 0 : 1,
  note:
    k === 0
      ? `Both 0 cells (the sources) go into the queue at distance 0, before the loop starts.`
      : `Wave ${k}: ${wave.length} cell${wave.length > 1 ? 's' : ''} first reached at distance ${k}, each by its nearest 0.${k === M_MAX ? ' Queue empty: done.' : ''}`,
  panels: [
    grid(
      mapG(MG, (_, r, c) => (M_DIST[r][c] <= k ? M_DIST[r][c] : '·')),
      mapG(MG, (_, r, c) => (M_DIST[r][c] === k ? 'active' : M_DIST[r][c] < k ? 'done' : '')),
      'dist',
    ),
    que(wave.map(([r, c]) => `${r},${c}`), `wave ${k} in the queue`),
  ],
}));
// the turn: rotting oranges, e.g. 0 empty, 1 fresh, 2 rotten
const RG = [[2, 1, 1], [0, 1, 0], [1, 0, 2]];
const R_RES = (() => {
  const t = mapG(RG, (v) => (v === 2 ? 0 : -1));
  const queue = [];
  RG.forEach((row, r) => row.forEach((v, c) => v === 2 && queue.push([r, c])));
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (inside(RG, nr, nc) && RG[nr][nc] === 1 && t[nr][nc] === -1) (t[nr][nc] = t[r][c] + 1), queue.push([nr, nc]);
    }
  }
  const fresh = [];
  RG.forEach((row, r) => row.forEach((v, c) => v === 1 && t[r][c] === -1 && fresh.push([r, c])));
  return { t, maxReached: Math.max(...t.flat()), fresh };
})();
check(R_RES.maxReached === 2 && R_RES.fresh.length === 1 && cn(...R_RES.fresh[0]) === '2,0', 'rotting oranges');

// ====================== bidirectional-bfs: e.g. start 0, target 8 ======================
const ZN = 9;
const ZE = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [3, 5], [4, 7], [5, 6], [6, 8], [7, 8]];
const ZP = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1.5], [3, 1.5], [3, 0], [4, 1]];
const Z_ADJ = adjOf(ZN, ZE);
// meet: 'other' = the template (check the other frontier), 'seen' = the mistake (check the shared seen set)
const biBfs = (start, target, meet) => {
  const side = { [start]: 'S', [target]: 'T' };
  const ev = [];
  if (start === target) return { steps: 0, ev };
  let front = new Set([start]);
  let back = new Set([target]);
  const seen = new Set([start, target]);
  for (let steps = 1; front.size && back.size; steps++) {
    const swapped = front.size > back.size;
    if (swapped) [front, back] = [back, front];
    const next = new Set();
    const expanding = [...front];
    for (const u of front) {
      for (const v of Z_ADJ[u]) {
        if (meet === 'other' && back.has(v)) {
          ev.push({ steps, swapped, expanding, back: [...back], u, v, met: true, side: { ...side } });
          return { steps, ev };
        }
        if (meet === 'seen' && seen.has(v)) {
          ev.push({ steps, u, v, met: true });
          return { steps, ev };
        }
        if (!seen.has(v)) {
          seen.add(v);
          next.add(v);
          side[v] = side[u];
        }
      }
    }
    ev.push({ steps, swapped, expanding, back: [...back], next: [...next], side: { ...side } });
    front = next;
  }
  return { steps: -1, ev };
};
const Z_RUN = biBfs(0, ZN - 1, 'other');
const Z_BAD = biBfs(0, ZN - 1, 'seen');
const Z_PLAIN = (() => {
  const dist = new Array(ZN).fill(-1);
  dist[0] = 0;
  const q = [0];
  for (let h = 0; h < q.length; h++) for (const v of Z_ADJ[q[h]]) if (dist[v] === -1) (dist[v] = dist[q[h]] + 1), q.push(v);
  return dist[ZN - 1];
})();
check(Z_RUN.steps === 4 && Z_PLAIN === 4, 'bidirectional answer = plain BFS answer');
const Z_MEET = Z_RUN.ev.at(-1);
check(Z_MEET.met && Z_MEET.u === 5 && Z_MEET.v === 2, 'frontiers meet at 5–2');
const Z_ASK = Z_RUN.ev[2]; // the turn: step 3 expands {6, 7} from the target side
check(seq(Z_ASK.expanding) === '6, 7' && Z_BAD.steps === 3 && Z_BAD.ev.at(-1).u === 6 && Z_BAD.ev.at(-1).v === 8, 'seen-check stops too early');
const zSt = (sd, expanding, extra = {}) => ({
  ...Object.fromEntries(Object.entries(sd).map(([v, s]) => [v, s === 'S' ? 'visited' : 'window'])),
  ...states(expanding, 'active'),
  ...extra,
});
const zFrame = (e) => ({
  say: e.met ? 2 : e.swapped ? 1 : 0,
  note: e.met
    ? `Step ${e.steps}: expand {${seq(e.expanding)}}. 5's neighbour 2 is in the other frontier: met. Return ${e.steps}.`
    : `Step ${e.steps}:${e.swapped ? ` front has ${e.back.length} > ${e.expanding.length}, swap sides.` : ''} Expand {${seq(e.expanding)}} → next {${seq(e.next)}}.`,
  panels: [
    gp(ZN, ZE, ZP, { st: zSt(e.side, e.expanding, e.met ? { [e.u]: 'done', [e.v]: 'done' } : {}), tag: { 0: 'start', 8: 'target' }, es: e.met ? { [`${e.u}-${e.v}`]: 'done' } : {} }),
    vars({ steps: e.steps, expanding: `{${seq(e.expanding)}}`, other: `{${seq(e.back)}}` }),
  ],
});
const Z_ONE = 25 ** 6;
const Z_TWO = 2 * 25 ** 3;
check(Z_ONE === 244140625 && Z_TWO === 31250, 'b = 25, d = 6 numbers');

// ====================== graph-bipartite-coloring: e.g. n = 5 ======================
const KN = 5;
const KE = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4]];
const KP = [[0, 0], [1, 0], [1, 1], [0, 1], [2, 1]];
const isBipartite = (n, edges, rec) => {
  const adj = adjOf(n, edges);
  const color = new Int8Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      const found = [];
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          queue.push(v);
          found.push(v);
        } else if (color[v] === color[u]) {
          rec?.push({ u, v, conflict: true, color: Array.from(color) });
          return false;
        }
      }
      rec?.push({ u, found, color: Array.from(color) });
    }
  }
  return true;
};
const K_RUN = [];
check(isBipartite(KN, KE, K_RUN) === true, 'square + tail is bipartite');
const K_COL = K_RUN.at(-1).color;
check(list(K_COL) === '[0, 1, 0, 1, 1]', 'colours');
const kPanel = (color, o = {}) =>
  gp(KN, o.edges || KE, KP, {
    st: { ...Object.fromEntries(color.map((c, v) => [v, c === 0 ? 'done' : c === 1 ? 'window' : ''])), ...(o.st || {}) },
    tag: Object.fromEntries(color.map((c, v) => [v, c === -1 ? undefined : c === 0 ? 'A' : 'B']).filter(([, t]) => t)),
    es: o.es,
    label: o.label,
  });
const kFrames = K_RUN.map((r) => ({
  say: 0,
  note: `Pop ${r.u} (group ${r.color[r.u] === 0 ? 'A' : 'B'}). ${r.found.length ? `New: ${seq(r.found)} ${r.found.length > 1 ? 'get' : 'gets'} the opposite group ${r.color[r.u] === 0 ? 'B' : 'A'}.` : 'Every neighbour already has the other group: no conflict.'}`,
  panels: [kPanel(r.color, { st: { [r.u]: 'active' } }), vars({ color: list(r.color.map((c) => (c === -1 ? '·' : c))) })],
}));
// a triangle (the lesson's odd cycle) for the problem frame
const K_TRI = [];
check(isBipartite(3, [[0, 1], [1, 2], [2, 0]], K_TRI) === false, 'triangle is not bipartite');
// the turn: which one extra edge keeps it bipartite?
const K_OPTS = [[4, 1], [4, 0], [0, 2], [4, 3]];
const K_OK = K_OPTS.map((e) => isBipartite(KN, [...KE, e]));
check(K_OK.join() === 'false,true,false,false', 'turn edges');

// ====================== graph-state-space-bfs: e.g. n = 5 ======================
const SN = 5;
const SE = [[0, 1], [1, 2], [2, 3], [2, 4]];
const SP = [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1]];
const S_ADJ = adjOf(SN, SE);
const bits = (m) => m.toString(2).padStart(SN, '0');
const setOf = (m) => `{${Array.from({ length: SN }, (_, i) => i).filter((i) => m & (1 << i)).join(', ')}}`;
const S_RES = (() => {
  const full = (1 << SN) - 1;
  const seen = Array.from({ length: SN }, () => new Uint8Array(1 << SN));
  const queue = [];
  for (let i = 0; i < SN; i++) {
    queue.push([i, 1 << i, 0, -1]);
    seen[i][1 << i] = 1;
  }
  for (let head = 0; head < queue.length; head++) {
    const [u, mask, d] = queue[head];
    if (mask === full) {
      const path = [];
      for (let k = head; k !== -1; k = queue[k][3]) path.unshift(queue[k]);
      return { d, path, states: queue.length };
    }
    for (const v of S_ADJ[u]) {
      const m2 = mask | (1 << v);
      if (!seen[v][m2]) {
        seen[v][m2] = 1;
        queue.push([v, m2, d + 1, head]);
      }
    }
  }
  return null;
})();
check(S_RES.d === 5 && S_RES.path.length === 6, 'shortest walk visiting all = 5');
const S_WALK = S_RES.path.map(([u]) => u);
check(new Set(S_WALK).size < S_WALK.length, 'the walk revisits a node');
const S_REV = S_WALK.find((u, k) => S_WALK.indexOf(u) < k); // the node visited twice
// plain BFS with seen[node]: the walk's revisit is refused
const sFrames = S_RES.path.map(([u, mask, d], k) => ({
  say: k === 0 ? 0 : 1,
  note:
    k === 0
      ? `d = 0: start at ${u}, mask = ${bits(mask)} = ${setOf(mask)}. (All ${SN} start states are seeded.)`
      : `d = ${d}: move to ${u}, mask | (1 << ${u}) = ${bits(mask)} → ${setOf(mask)}.${S_WALK.indexOf(u) < k ? ` ${u} again, but a new state.` : ''}${mask === (1 << SN) - 1 ? ' Full mask: return d.' : ''}`,
  panels: [
    gp(SN, SE, SP, { st: { ...Object.fromEntries(Array.from({ length: SN }, (_, i) => [i, mask & (1 << i) ? 'done' : ''])), [u]: 'active' } }),
    vars({ state: `(${u}, ${bits(mask)})`, d, 'mask bits': '4 3 2 1 0' }),
  ],
}));
const S_K = S_WALK.findIndex((u, k) => S_WALK.indexOf(u) < k); // step of the revisit
const S_PREV = S_RES.path[S_WALK.indexOf(S_REV)];
const S_AGAIN = S_RES.path[S_K];

// ====================== grid-component-labeling: e.g. 3 × 3 ======================
const LG = [[1, 1, 1], [1, 0, 0], [0, 0, 1]];
const L_LAB = LG.map((row) => row.slice());
const L_SIZE = [0, 0];
const L_FILLS = [];
{
  const fill = (r, c, id) => {
    if (!inside(L_LAB, r, c) || L_LAB[r][c] !== 1) return 0;
    L_LAB[r][c] = id;
    let s = 1;
    for (const [dr, dc] of DIRS) s += fill(r + dr, c + dc, id);
    return s;
  };
  let id = 2;
  for (let r = 0; r < LG.length; r++)
    for (let c = 0; c < LG[0].length; c++)
      if (L_LAB[r][c] === 1) {
        const at = [r, c];
        L_SIZE[id] = fill(r, c, id++);
        L_FILLS.push({ id: id - 1, at, lab: L_LAB.map((row) => row.slice()) });
      }
}
check(list(L_SIZE) === '[0, 0, 4, 1]', 'island sizes');
const L_ZEROS = [];
LG.forEach((row, r) =>
  row.forEach((v, c) => {
    if (v !== 0) return;
    const around = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([nr, nc]) => inside(LG, nr, nc) && L_LAB[nr][nc] >= 2);
    const ids = around.map(([nr, nc]) => L_LAB[nr][nc]);
    const distinct = [...new Set(ids)];
    L_ZEROS.push({ r, c, ids, distinct, val: 1 + distinct.reduce((s, i) => s + L_SIZE[i], 0), raw: 1 + ids.reduce((s, i) => s + L_SIZE[i], 0) });
  }),
);
const L_AT = (r, c) => L_ZEROS.find((z) => z.r === r && z.c === c);
const L_ASK = L_AT(1, 1);
check(L_ASK.val === 5 && L_ASK.raw === 9, 'dedupe at (1, 1)');
const L_BEST = Math.max(...L_ZEROS.map((z) => z.val));
check(L_BEST === 6 && L_AT(1, 2).val === 6, 'best flip');
const lGrid = (z, label = 'ids') =>
  grid(
    L_LAB,
    mapG(LG, (_, r, c) => (z && r === z.r && c === z.c ? 'active' : z && DIRS.some(([dr, dc]) => r === z.r + dr && c === z.c + dc) && L_LAB[r][c] >= 2 ? 'window' : L_LAB[r][c] === 0 ? 'muted' : '')),
    label,
  );
const lZeroFrame = (z) => ({
  say: 1,
  note: `Flip (${z.r}, ${z.c}): neighbour ids {${seq(z.distinct)}} → 1 + ${z.distinct.map((i) => `size[${i}]`).join(' + ') || '0'} = ${z.val}.`,
  panels: [lGrid(z), vars({ 'size[2]': L_SIZE[2], 'size[3]': L_SIZE[3], [`flip (${z.r}, ${z.c})`]: z.val })],
});
const L_SHOWN = L_ZEROS.filter((z) => z !== L_ASK);

export default [
  {
    id: 'graph-adjacency-representation',
    title: 'Edge list in, neighbours in O(deg) out',
    steps: [
      {
        kind: 'watch',
        title: 'Who are my neighbours?',
        lines: ['An edge list is great for storage but terrible for "who are my neighbours?": **O(m) per question**.', 'One O(n + m) pass builds an adjacency list; every later lookup is O(deg).'],
        frames: [
          {
            say: 0,
            note: `e.g. n = 5, ${AE.length} edges. Neighbours of 1? Scan every pair and keep those that contain 1.`,
            panels: [arr(AE.map(([u, v]) => `${u}–${v}`), { label: 'edges', highlights: hl(AE.length, (k) => (AE[k].includes(1) ? 'active' : 'visited')) })],
          },
          {
            say: 0,
            note: 'Each new question about any vertex scans all m pairs again.',
            panels: [gp(AN, AE, AP, { st: { 1: 'active' } }), vars({ 'per question': 'O(m)' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'One pass: adj + degree',
        lines: ['`adj = Array.from({ length: n }, () => [])`: one **own** array per vertex.', 'Each `[u, v]`: `adj[u].push(v)`, `degree[u]++`; undirected: also `adj[v].push(u)`, `degree[v]++`.'],
        frames: aFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"edges[i] = [u, v]"**, **"n nodes labelled 0 to n-1"**, **"the center / hub / judge"**, **"degree"**.', 'Many easy problems are answered by degrees alone, with no traversal.'],
        frames: [
          {
            say: 1,
            note: `Vertex 1 has degree ${A_END.degree[1]} = n − 1: it touches every other vertex. Sum of degrees ${A_END.degree.reduce((a, b) => a + b, 0)} = 2m.`,
            panels: [arr(A_END.degree, { label: 'degree', highlights: { 1: 'done' } }), vars({ build: 'O(n + m)', 'neighbours of u': 'O(deg u)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the fill trap',
        lines: ['A teammate writes `const adj = new Array(3).fill([]);`', 'Then adds the undirected edge [0, 1]: `adj[0].push(1); adj[1].push(0);`'],
        panels: [table(['0', '1', '2'], ['adj'], [['?'], ['?'], ['?']], 'adj')],
        task: {
          type: 'choose',
          question: 'What is adj[2] now?',
          options: [
            { text: '[]', why: 'Vertex 2 has no edges, but `fill([])` put the SAME array in every slot, so it sees both pushes.' },
            { text: '[1]', why: 'Both pushes go into the one shared array: first 1, then 0.' },
            { text: list(A_TRAP) },
            { text: 'A TypeError', why: 'Filling with an array is legal. No error, just silently wrong neighbours.' },
          ],
          answer: 2,
        },
        solved: '`fill([])` shares one array. Use `Array.from({ length: n }, () => [])`: a new array per vertex.',
      },
    ],
  },

  {
    id: 'graph-dfs',
    title: 'Count the separate groups: one DFS launch each',
    steps: [
      {
        kind: 'watch',
        title: 'Cycles need a visited mark',
        lines: ['A graph has **no natural order** and may contain **cycles**: just following edges can loop forever.', '`visited[u] = 1` **on entry**: the second arrival at a vertex is ignored.'],
        frames: [
          {
            say: 0,
            note: 'e.g. 0, 2, 4 form a cycle. Following edges without marks: 0 → 2 → 4 → 0 → 2 → … forever.',
            panels: [gp(DN, DE, DPOS, { st: { 0: 'active', 2: 'active', 4: 'active' }, es: { '0-2': 'bad', '2-4': 'bad', '4-0': 'bad' } }), arr(['0', '2', '4', '0', '2', '4', '…'], { label: 'walk', highlights: { 3: 'bad', 4: 'bad', 5: 'bad' } })],
          },
          {
            say: 1,
            note: 'With marks, each vertex is processed once: O(V + E). Some parts (1–3, and 5) are not connected at all.',
            panels: [gp(DN, DE, DPOS), vars({ n: DN, edges: DE.length })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Go deep, then launch again',
        lines: ['`dfs(u)`: mark u, recurse into each unvisited neighbour.', 'Backtrack when stuck: the recursion stack is the current path.', 'Outer loop over **every** vertex: each new launch is a new **connected component**.'],
        frames: [
          ...dFrames,
          {
            say: 2,
            note: `Loop ends. ${D_RUN.components} launches (from ${seq(D_RUN.launches)}) → ${D_RUN.components} components.`,
            panels: [gp(DN, DE, DPOS, { st: states(D_RUN.launches, 'done'), tag: Object.fromEntries(Object.entries(D_COMP).map(([u, c]) => [u, `c${c}`])) }), vars({ components: D_RUN.components })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"connected"**, **"reachable"**, **"number of provinces / components / islands"**, **"is there a path"**, **"visit all"**.', 'DFS finds *a* path, not the shortest. Very deep inputs: use an explicit stack.'],
        frames: [{ say: 0, note: 'Each vertex marked once, each neighbour list scanned once: O(V + E).', panels: [vars({ time: 'O(V + E)', space: 'O(V)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: who launches?',
        lines: [`e.g. n = 6, edges ${DT_E.map(([u, v]) => `${u}–${v}`).join(', ')}.`, 'The outer loop runs s = 0..5 and calls dfs(s) only when s is unvisited.'],
        panels: [gp(6, DT_E, DT_POS)],
        task: {
          type: 'choose',
          question: 'From which vertices does the outer loop launch a DFS?',
          options: [
            { text: '0 only', why: 'dfs(0) reaches only 0 and 3. The graph is disconnected; starting only from 0 misses the rest.' },
            { text: '0, 2', why: '1 has no edges, but it is still unvisited when s = 1: a component of its own.' },
            { text: seq(DT_RUN.launches) },
            { text: '0, 3, 1, 2, 5, 4', why: 'Vertices marked by an earlier dfs are skipped by the loop: 3, 5 and 4 are already visited.' },
          ],
          answer: 2,
        },
        solved: `Launches at ${seq(DT_RUN.launches)}: **${DT_RUN.components} components**. Number of launches = number of components.`,
      },
    ],
  },

  {
    id: 'graph-bfs',
    title: 'Fewest edges from a start: ripples through a queue',
    steps: [
      {
        kind: 'watch',
        title: 'DFS takes the detour',
        lines: ['DFS with a permanent `visited` may reach a vertex along a **long detour**, mark it, and refuse the shorter route later.'],
        frames: [
          {
            say: 0,
            note: `e.g. DFS from 0 dives 0 → 1 → 2 → 3: vertex 3 is claimed at ${B_DFS[3]} edges.`,
            panels: [gp(BN, BE, BPOS, { st: { 0: 'done', 1: 'done', 2: 'done', 3: 'bad' }, es: { '0-1': 'active', '1-2': 'active', '2-3': 'active' }, tag: { 3: `${B_DFS[3]} edges` } })],
          },
          {
            say: 0,
            note: `Then 4 is reached from 3 at ${B_DFS[4]} edges; the direct edge 0–4 (1 edge) is refused: 4 is visited.`,
            panels: [gp(BN, BE, BPOS, { st: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'bad' }, es: { '3-4': 'active', '0-4': 'bad' }, tag: { 3: `${B_DFS[3]} edges`, 4: `${B_DFS[4]} edges` } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Rings: distance 0, 1, 2…',
        lines: ['`dist[start] = 0`; a FIFO queue; `for (let head = 0; head < queue.length; head++)`: O(1) dequeue.', 'Neighbour with `dist === -1`: `dist[v] = dist[u] + 1`, push. **Mark when enqueued**, not when popped.'],
        frames: [
          { say: 0, note: 'dist[0] = 0, queue = [0]. Every other distance is unknown (−1).', panels: [gp(BN, BE, BPOS, { st: { 0: 'active' }, tag: { 0: 'd=0' } }), arr(['0'], { label: 'queue', pointers: [ptr(0, 'head')] })] },
          ...B_RUN.map(bFrame),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"minimum number of steps / moves / transformations"**, **"shortest path"** with no weights, **"nearest"**, **"level"**.', 'The queue always looks like [d, …, d, d+1, …]: first discovery is along a shortest path.'],
        frames: [{ say: 1, note: `dist = ${list(B_DIST)}. O(V + E). Different edge weights → Dijkstra, not BFS.`, panels: [arr(B_DIST, { label: 'dist' }), vars({ time: 'O(V + E)', weighted: 'Dijkstra' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: found twice',
        lines: [`Queue ${list(B_RUN[B_T - 1].queue)}, head at ${B_RUN[B_T].head}: pop 2 (d = ${B_DIST[2]}).`, `Its neighbour 3 already has dist ${B_DIST[3]} (found from 4).`],
        panels: [
          gp(BN, BE, BPOS, { st: { 0: 'done', 1: 'done', 4: 'done', 2: 'active', 3: 'visited' }, tag: bTag(B_RUN[B_T - 1].dist) }),
          arr(B_RUN[B_T - 1].queue.map(String), { label: 'queue', pointers: [ptr(B_RUN[B_T].head, 'head')], highlights: hl(B_RUN[B_T - 1].queue.length, (x) => (x < B_RUN[B_T].head ? 'muted' : x === B_RUN[B_T].head ? 'active' : '')) }),
        ],
        task: {
          type: 'choose',
          question: 'What does BFS do with 3 while processing 2?',
          options: [
            { text: `Set dist[3] = ${B_DIST[2] + 1} and push 3 again`, why: 'The first discovery is already along a shortest path. A later arrival can never be shorter.' },
            { text: 'Push 3 again, skip it when it is popped later', why: 'That is mark-on-pop: same distances, but a vertex enters the queue once per edge. Wasted time and memory.' },
            { text: `Nothing: dist[3] !== −1, so skip it` },
            { text: 'Set dist[3] = min(2, 3)', why: 'No min is ever needed in BFS: vertices are discovered in order of distance.' },
          ],
          answer: 2,
        },
        solved: 'Discovered once, at its shortest distance, when **enqueued**. Every vertex enters the queue once: O(V + E).',
        then: [bFrame(B_RUN[B_T], B_T)],
      },
    ],
  },

  {
    id: 'grid-graph-traversal',
    title: 'Count islands without building a graph',
    steps: [
      {
        kind: 'watch',
        title: 'Neighbours are computed',
        lines: ['Each cell is a vertex; up / down / left / right are its neighbours. No adjacency list: `DIRS` + bounds checks.', 'Check bounds **before** reading `grid[r][c]`: `grid[-1][c]` throws.'],
        frames: [
          {
            say: 0,
            note: `e.g. cell (1, 2): DIRS gives (2, 2), (0, 2), (1, 3), (1, 1). Only (0, 2) is land.`,
            panels: [grid(IG, mapG(IG, (v, r, c) => (r === I_AT[0] && c === I_AT[1] ? 'active' : I_NB.some(([nr, nc]) => nr === r && nc === c) ? (v === 1 ? 'done' : 'window') : '')), 'grid: 1 = land')],
          },
          {
            say: 1,
            note: 'Cell (0, 1) going up: (−1, 1) is off the grid. `r < 0` is checked first, so grid[−1] is never read.',
            panels: [grid(IG, mapG(IG, (_, r, c) => (r === 0 && c === 1 ? 'active' : '')), 'grid: 1 = land'), vars({ nr: -1, nc: 1, 'r < 0': 'true → return' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Scan, count, sink',
        lines: ['Scan every cell. Unvisited land → **count one island**.', '`sink(r, c)` floods the whole island, writing 0 in place, so it is never counted again.'],
        frames: iFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"m x n grid"**, **"4-directionally adjacent"**, **"island"**, **"region"**, **"pixel / image"**, **"cells"**.'],
        frames: [{ say: 0, note: 'V = R·C, each cell has at most 4 edges: O(R·C). Big all-land grid: BFS or an explicit stack.', panels: [vars({ time: 'O(R·C)', islands: I_RUN.length })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: add the diagonals',
        lines: ['Same grid, but now cells are **8-directionally** adjacent: the four diagonals are added to DIRS.'],
        panels: [grid(IG, null, 'grid: 1 = land')],
        task: {
          type: 'choose',
          question: 'How many islands now?',
          options: [
            { text: String(I_RUN.length), why: 'That is the 4-direction count. (0, 1) and (1, 0) touch diagonally, so their islands merge.' },
            { text: String(I_RUN8.length) },
            { text: '1', why: 'The bottom pair (3, 2), (3, 3) has no land on any diagonal: it stays separate.' },
            { text: '4', why: 'More directions only add edges: islands can merge, never split.' },
          ],
          answer: 1,
        },
        solved: `DIRS defines the edges. With diagonals, the top two islands join: **${I_RUN8.length}** islands.`,
      },
    ],
  },

  {
    id: 'multi-source-bfs',
    title: 'Distance to the nearest source, for every cell, in one pass',
    steps: [
      {
        kind: 'watch',
        title: 'One BFS per cell',
        lines: ['"For every cell, how far is the nearest 0?" Brute force runs a BFS from every cell: **O((R·C)²)**.'],
        frames: [
          {
            say: 0,
            note: `e.g. cell (0, 2) alone: its own BFS ripples out until it meets a 0 at distance ${M_ONE.d}.`,
            panels: [grid(MG, mapG(MG, (v, r, c) => (r === 0 && c === 2 ? 'active' : v === 0 ? 'done' : '')), 'grid: 0 = source')],
          },
          {
            say: 0,
            note: `…then again for each of the other ${M_ONES - 1} cells, re-exploring the same cells every time.`,
            panels: [grid(MG, mapG(MG, (v) => (v === 1 ? 'visited' : 'done')), 'grid: 0 = source'), vars({ 'BFS runs': M_ONES })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'All sources at distance 0',
        lines: ['Put **every** source in the queue at distance 0, then run a normal BFS.', 'The ripples spread together; each cell is first reached by its **nearest** source.'],
        frames: mFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"nearest 0 / gate / land"**, **"every minute, all adjacent cells become…"**, **"simultaneously"**.', 'Why it works: a virtual super-source with a 0-length edge to every source.'],
        frames: [{ say: 1, note: 'One BFS from the super-source = the queue seeded with all sources. O(R·C) total.', panels: [vars({ 'one BFS per cell': 'O((R·C)²)', 'multi-source': 'O(R·C)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: rotting oranges',
        lines: ['e.g. 2 = rotten, 1 = fresh, 0 = empty. Each minute, rotten oranges rot their fresh neighbours.', 'Answer: minutes until no fresh orange is left, or −1 if that never happens.'],
        panels: [grid(RG, mapG(RG, (v) => (v === 2 ? 'bad' : v === 0 ? 'muted' : '')), 'grid')],
        task: {
          type: 'choose',
          question: 'What is the answer?',
          options: [
            { text: `${R_RES.maxReached}`, why: `${R_RES.maxReached} is the largest time assigned, but the orange at (2, 0) is walled in and never rots.` },
            { text: '1', why: 'Both rotten oranges spread at once, but (0, 2) and (1, 1) are 2 steps from (0, 0).' },
            { text: '−1: the orange at (2, 0) is never reached' },
          ],
          answer: 2,
        },
        solved: 'Seed all rotten oranges; the answer is the largest distance, but **−1 if any fresh cell is never reached**.',
      },
    ],
  },

  {
    id: 'bidirectional-bfs',
    title: 'Search from both ends and meet in the middle',
    steps: [
      {
        kind: 'watch',
        title: 'b^d explodes',
        lines: ['With about b neighbours per vertex and an answer d steps away, one BFS explores about **b^d** vertices.', 'Two searches that meet in the middle each go d/2 deep: about **2 · b^(d/2)**.'],
        frames: [
          { say: 0, note: `For b = 25, d = 6: 25^6 = ${Z_ONE.toLocaleString('en-US')} vertices for one BFS.`, panels: [vars({ b: 25, d: 6, 'one BFS': Z_ONE.toLocaleString('en-US') })] },
          { say: 1, note: `Two halves of depth 3: 2 · 25^3 = ${Z_TWO.toLocaleString('en-US')}.`, panels: [vars({ b: 25, d: 6, 'one BFS': Z_ONE.toLocaleString('en-US'), 'two halves': Z_TWO.toLocaleString('en-US') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Two frontiers, one seen set',
        lines: ['`front = {start}`, `back = {target}`, shared `seen`. Expand one whole layer per step.', 'If `front.size > back.size`, **swap**: always expand the smaller side.', 'A neighbour in the **other** frontier: the searches touched. Return `steps`.'],
        frames: [
          { say: 0, note: 'e.g. start 0, target 8. front = {0}, back = {8}, seen = {0, 8}.', panels: [gp(ZN, ZE, ZP, { st: { 0: 'visited', 8: 'window' }, tag: { 0: 'start', 8: 'target' } }), vars({ steps: 0 })] },
          ...Z_RUN.ev.map(zFrame),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"transform beginWord into endWord"**, **"minimum number of moves from start to target"**, both endpoints given.', 'Needs reversible moves; on small graphs plain BFS is simpler.'],
        frames: [{ say: 0, note: `Same answer as one BFS (${Z_PLAIN}); the gain comes with a huge branching factor, e.g. word ladder.`, panels: [vars({ answer: Z_RUN.steps, 'plain BFS': Z_PLAIN })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: did they meet?',
        lines: [`Step 3 expands {6, 7} from the target side; the other frontier is {${seq(Z_ASK.back)}}.`, 'Expanding 6: its neighbour 8 is in `seen`, 5 is new.'],
        panels: [gp(ZN, ZE, ZP, { st: zSt(Z_RUN.ev[1].side, ['6', '7']), tag: { 0: 'start', 8: 'target' } }), vars({ front: '{6, 7}', back: `{${seq(Z_ASK.back)}}` })],
        task: {
          type: 'choose',
          question: 'Which test means the two searches have met?',
          options: [
            { text: '`seen.has(v)`', why: `seen also holds this side's own vertices: 8 is where this search started. It would return ${Z_BAD.steps}, too early.` },
            { text: '`back.has(v)`: v is in the other frontier' },
            { text: '`v === target`', why: 'The searches meet in the middle, not at the target. After a swap, the target is on your own side.' },
          ],
          answer: 1,
        },
        solved: `Check the **other** frontier. At step 4, 5 sees 2 in it: answer **${Z_RUN.steps}**.`,
        then: [{ ...zFrame(Z_MEET), say: 0 }],
      },
    ],
  },

  {
    id: 'graph-bipartite-coloring',
    title: 'Split into two groups, or prove you cannot',
    steps: [
      {
        kind: 'watch',
        title: 'Two groups, no edge inside one',
        lines: ['"Split into two groups so no **dislike** pair is in the same group" = is the graph **bipartite**?', 'A graph is bipartite iff it has **no odd-length cycle**.'],
        frames: [
          { say: 0, note: 'e.g. 5 people, an edge = a dislike pair. Paint each one A or B so every edge joins A and B.', panels: [gp(KN, KE, KP)] },
          {
            say: 1,
            note: 'A triangle cannot: 0 is A, 1 is B, then 2 must differ from both.',
            panels: [gp(3, [[0, 1], [1, 2], [2, 0]], [[0, 1], [2, 1], [1, 0]], { st: { 0: 'done', 1: 'window', 2: 'bad' }, tag: { 0: 'A', 1: 'B', 2: '?' }, es: { '1-2': 'bad', '2-0': 'bad' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Opposite of my colour',
        lines: ['BFS: an uncoloured neighbour gets `1 − color[u]`. A neighbour with the **same** colour → return false.', 'Outer loop over every vertex: disconnected parts need their own start.'],
        frames: [
          { say: 1, note: 'Vertex 0 is uncoloured: color[0] = 0 (group A), queue = [0].', panels: [kPanel([0, -1, -1, -1, -1], { st: { 0: 'active' } }), vars({ color: list([0, '·', '·', '·', '·']) })] },
          ...kFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"two groups / sets"**, **"bipartite"**, **"dislike"**, **"no two adjacent … same colour"**.', 'More than two colours is a different, much harder problem.'],
        frames: [{ say: 0, note: `No conflict: A = {${K_COL.map((c, v) => (c === 0 ? v : null)).filter((v) => v !== null).join(', ')}}, B = {${K_COL.map((c, v) => (c === 1 ? v : null)).filter((v) => v !== null).join(', ')}}. O(V + E).`, panels: [kPanel(K_COL), vars({ bipartite: 'true', time: 'O(V + E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: one more dislike',
        lines: [`The colouring is A = {0, 2}, B = {1, 3, 4}.`, 'One more dislike pair (edge) is added.'],
        panels: [kPanel(K_COL)],
        task: {
          type: 'choose',
          question: 'Which new edge keeps the graph bipartite?',
          options: [
            { text: '4–1', why: '4 and 1 are both B: the triangle 1–2–4 is an odd cycle.' },
            { text: '4–0' },
            { text: '0–2', why: '0 and 2 are both A: the triangle 0–1–2 is an odd cycle.' },
            { text: '4–3', why: '4 and 3 are both B: the triangle 2–3–4 is an odd cycle.' },
          ],
          answer: 1,
        },
        solved: 'An edge between A and B is fine; an edge inside a group closes an **odd cycle**: not bipartite.',
      },
    ],
  },

  {
    id: 'graph-state-space-bfs',
    title: 'Shortest walk that visits every node: BFS over (node, mask)',
    steps: [
      {
        kind: 'watch',
        title: 'Where am I is not enough',
        lines: ['"Shortest walk that visits every node; you may revisit nodes." A walk may **have to** come back.', `Standing on ${S_REV} having visited ${setOf(S_PREV[1])} differs from standing on ${S_REV} having visited ${setOf(S_AGAIN[1])}.`],
        frames: [
          { say: 0, note: 'e.g. n = 5. Leaves 0, 3, 4 all hang off the path, so some node must be walked through twice.', panels: [gp(SN, SE, SP, { st: { 0: 'window', 3: 'window', 4: 'window' } })] },
          {
            say: 1,
            note: `A plain seen[node] marks ${S_REV} once; the walk's return to ${S_REV} is then refused. Mark the whole state instead.`,
            panels: [gp(SN, SE, SP, { st: { [S_REV]: 'bad' } }), vars({ [`(${S_REV}, ${bits(S_PREV[1])})`]: 'state 1', [`(${S_REV}, ${bits(S_AGAIN[1])})`]: 'a different state' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Follow one winning path of states',
        lines: ['Seed every `(i, 1 << i)` at d = 0. Bit i of the mask is 1 when node i was visited.', 'Move to v: `m2 = mask | (1 << v)`; skip if `seen[v][m2]`. Pop with `mask === (1 << n) − 1` → return d.'],
        frames: sFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"visit every node"**, **"collect all keys"**, **"you may revisit nodes"**, **n <= 12**.'],
        frames: [{ say: 0, note: `n · 2^n = ${SN * 2 ** SN} possible states here; ${S_RES.states} were queued before the answer ${S_RES.d}. JS bitwise ops are 32-bit.`, panels: [vars({ states: `n · 2^n = ${SN * 2 ** SN}`, answer: S_RES.d })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the visited check',
        lines: [`The walk reaches ${S_REV} a second time at d = ${S_AGAIN[2]}, with mask ${bits(S_AGAIN[1])}.`, `It was first at ${S_REV} at d = ${S_PREV[2]} with mask ${bits(S_PREV[1])}.`],
        panels: [gp(SN, SE, SP, { st: { ...Object.fromEntries(Array.from({ length: SN }, (_, i) => [i, S_AGAIN[1] & (1 << i) ? 'done' : ''])), [S_REV]: 'active' } }), vars({ first: `(${S_REV}, ${bits(S_PREV[1])})`, now: `(${S_REV}, ${bits(S_AGAIN[1])})` })],
        task: {
          type: 'choose',
          question: 'Which visited check lets this state into the queue, and still keeps BFS finite?',
          options: [
            { text: '`seen[node]`', why: `${S_REV} is already seen, so the walk is refused and the full mask may never be reached.` },
            { text: '`seen[mask]`', why: 'The same mask at a different node is a different situation: where you stand decides the next moves.' },
            { text: '`seen[node][mask]`' },
            { text: 'No visited check', why: 'Then the same (node, mask) is queued again and again: the queue blows up.' },
          ],
          answer: 2,
        },
        solved: 'Mark **the state**, `seen[node][mask]`. Coming back with a bigger mask is progress, not a repeat.',
      },
    ],
  },

  {
    id: 'grid-component-labeling',
    title: 'Flip one 0: label islands once, then each flip is O(1)',
    steps: [
      {
        kind: 'watch',
        title: 'Recount for every flip?',
        lines: ['"You may flip one 0 into a 1. What is the largest island?"', 'Flipping each 0 and recounting the biggest island costs **O((R·C)²)**.'],
        frames: [
          { say: 0, note: 'e.g. a 3 × 3 grid with four 0 cells.', panels: [grid(LG, mapG(LG, (v) => (v === 0 ? 'window' : '')), 'grid')] },
          { say: 1, note: 'Flip (1, 2), traverse the whole grid; flip (2, 0), traverse again… one full traversal per 0.', panels: [grid(mapG(LG, (v, r, c) => (r === 1 && c === 2 ? 1 : v)), mapG(LG, (_, r, c) => (r === 1 && c === 2 ? 'active' : 'visited')), 'grid with (1, 2) flipped')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Label, then add sizes',
        lines: ['Fill every island once; write its id (2, 3, …: never clashes with 0/1) and store `size[id]`.', 'For a 0: collect the **distinct** ids of its 4 neighbours; result = 1 + their sizes.'],
        frames: [
          ...L_FILLS.map((f) => ({
            say: 0,
            note: `Land at (${f.at[0]}, ${f.at[1]}): fill writes id ${f.id} into ${L_SIZE[f.id]} cell${L_SIZE[f.id] > 1 ? 's' : ''}. size[${f.id}] = ${L_SIZE[f.id]}.`,
            panels: [grid(f.lab, mapG(f.lab, (v) => (v === f.id ? 'done' : v === 0 ? 'muted' : '')), 'ids'), vars({ size: list(L_SIZE.slice(0, f.id + 1)) })],
          })),
          ...L_SHOWN.map(lZeroFrame),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"change at most one 0 to 1"**, **"largest after one operation"**, **"size of the island containing"**.', 'No 0 at all? The whole grid is one island: answer R·C.'],
        frames: [{ say: 0, note: 'Label once O(R·C), then O(1) per 0 cell: O(R·C) total. Changing over time → union-find.', panels: [vars({ 'recount per flip': 'O((R·C)²)', 'label first': 'O(R·C)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the middle cell',
        lines: [`Flip (1, 1). Its neighbours above and to the left both carry id ${L_ASK.ids[0]} (size ${L_SIZE[L_ASK.ids[0]]}); right and below are 0.`],
        panels: [lGrid(L_ASK), vars({ 'size[2]': L_SIZE[2], 'size[3]': L_SIZE[3] })],
        task: {
          type: 'choose',
          question: 'How big is the island after flipping (1, 1)?',
          options: [
            { text: String(L_ASK.raw), why: `1 + 4 + 4 counts island 2 twice: it touches (1, 1) from two sides. Use a Set of ids.` },
            { text: String(L_ASK.val) },
            { text: String(L_ASK.val - 1), why: 'The flipped cell itself becomes land: add 1.' },
          ],
          answer: 1,
        },
        solved: `Distinct ids {2} → 1 + 4 = **${L_ASK.val}**. The best flip is (1, 2) with ${L_BEST}.`,
        then: [{ ...lZeroFrame(L_ASK), say: 0 }],
      },
    ],
  },
];
