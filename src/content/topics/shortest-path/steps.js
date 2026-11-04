// Step lessons for Shortest Path (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every relaxation, heap content, dist value, deque, round and matrix cell below comes from running the lesson's own
// code (Dijkstra with lazy deletion + stale check, 0-1 BFS, Bellman-Ford with a copy, Floyd-Warshall k-i-j,
// Dijkstra with Math.max, BFS over (r, c, remaining)) on the example graph. check() throws if a run drifts.
// The heap is drawn as its entries sorted smallest first; equal distances leave in push order (as in the dry run).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const f = (x) => (x === Infinity ? '∞' : x);
const fl = (xs) => xs.map(f);
const list = (xs) => `[${xs.join(', ')}]`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`shortest-path/steps.js: ${msg}`);
};

// ---------- graph drawing ----------
// directed weighted graph; ids 0..n-1, o.lab: id → label, o.st: id → state, o.es: 'u-v' → edge state
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  directed: o.undirected ? undefined : true,
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(o.lab?.[i] ?? i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v, w]) => {
    const s = o.es?.[`${u}-${v}`];
    return { from: u, to: v, label: String(w), ...(s ? { state: s } : {}) };
  }),
});
const ek = (pairs, s) => Object.fromEntries(pairs.map(([u, v]) => [`${u}-${v}`, s]));

// ---------- the lesson's Dijkstra (template): lazy deletion, stale check, nd = comb(d, w) ----------
function hpush(h, e) {
  let i = h.length;
  while (i > 0 && h[i - 1][0] > e[0]) i--;
  h.splice(i, 0, e);
}
function dijkstra(n, edges, src, comb = (d, w) => d + w) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const heap = [[0, src]];
  const ev = [];
  const order = [];
  while (heap.length) {
    const [d, u] = heap.shift();
    if (d > dist[u]) {
      ev.push({ stale: true, d, u, rel: [], dist: dist.slice(), heap: heap.map((e) => e.slice()) });
      continue;
    }
    order.push(u);
    const rel = [];
    for (const [v, w] of adj[u]) {
      const nd = comb(d, w);
      const ok = nd < dist[v];
      rel.push({ v, w, nd, ok, old: dist[v] });
      if (ok) {
        dist[v] = nd;
        hpush(heap, [nd, v]);
      }
    }
    ev.push({ stale: false, d, u, rel, dist: dist.slice(), heap: heap.map((e) => e.slice()) });
  }
  return { dist, ev, order };
}
const heapP = (h, lab = (u) => u) => que(h.map(([d, u]) => `${d}·${lab(u)}`), 'heap · d·node');

// one frame per pop: graph, dist, heap
function dijFrames(n, edges, pos, run, o = {}) {
  const lab = (u) => o.lab?.[u] ?? u;
  const done = [];
  const fr = [];
  run.ev.forEach((e) => {
    if (!e.stale) done.push(e.u);
    const relOk = e.rel.filter((r) => r.ok);
    const note = e.stale
      ? `Pop [${e.d}, ${lab(e.u)}]: ${e.d} > dist[${lab(e.u)}] = ${e.dist[e.u]} → **stale**, skip.`
      : `Pop [${e.d}, ${lab(e.u)}]: final. ` +
        (e.rel.length
          ? e.rel.map((r) => `${lab(r.v)}: ${e.d}+${r.w}=${r.nd}${r.ok ? (r.old === Infinity ? ' ✓' : ` < ${r.old} ✓`) : ` ≥ ${r.old} ✗`}`).join(', ') + '.'
          : 'No edges.');
    fr.push({
      say: e.stale ? o.saySt : relOk.length ? o.sayRel : o.sayPop,
      note,
      panels: [
        gp(n, edges, pos, { lab: o.lab, st: { ...states(e.heap.map((x) => x[1]), 'visited'), ...states(done, 'done'), [e.u]: e.stale ? 'bad' : 'active' }, es: ek(relOk.map((r) => [e.u, r.v]), 'active') }),
        arr(fl(e.dist), { label: o.distLabel || 'dist', highlights: { ...states(relOk.map((r) => r.v), 'active'), ...(e.stale ? { [e.u]: 'bad' } : {}) } }),
        heapP(e.heap, lab),
      ],
    });
  });
  return fr;
}

// ---------- what ----------
const AB = ['A', 'B', 'C', 'D'];
const ABP = [[0, 0], [2.4, 0], [0, 1.6], [2.4, 1.6]];
const abE = (w) => [[0, 1, w], [0, 2, 1], [2, 3, 2], [3, 1, 1]];
const ab = (w, o = {}) => gp(4, abE(w), ABP, { lab: AB, ...o });
const VIA = 1 + 2 + 1;
check(VIA === 4, 'A→C→D→B');
const directOrVia = (w) => Math.min(w, VIA);
check(directOrVia(5) === 4, 'A→B = 5 case');

// ---------- why: the best route's prefix is a best route ----------
const WL = ['A', 'X', 'M', 'Z'];
const WE = [[0, 2, 5], [0, 1, 1], [1, 2, 1], [2, 3, 3]];
const WP = [[0, 1], [1, 0], [2, 1], [3.3, 1]];
const wg = (o) => gp(4, WE, WP, { lab: WL, ...o });
const WD = dijkstra(4, WE, 0).dist;
check(same(WD, [0, 1, 2, 5]), 'why dist');
// monotone paths in a 3 × 3 grid of cells (right / down)
const PAS = [[1, 1, 1], [1, 0, 0], [1, 0, 0]];
for (let r = 1; r < 3; r++) for (let c = 1; c < 3; c++) PAS[r][c] = PAS[r - 1][c] + PAS[r][c - 1];
check(PAS[2][2] === 6, 'monotone paths');

// ---------- intuition: the lesson's graph ----------
const IE = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]];
const IP = [[0, 1], [1.5, 0], [1.5, 2], [3, 1], [4.3, 1]];
const ig = (o) => gp(5, IE, IP, o);
const ITRUE = dijkstra(5, IE, 0).dist;
check(same(ITRUE, [0, 3, 1, 4, 7]), 'intuition truth');
// relax a list of edges in place, pass after pass, recording every edge
function passes(n, edges, src) {
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const out = [];
  for (let p = 1; p <= n; p++) {
    const steps = [];
    let changed = false;
    for (const [u, v, w] of edges) {
      const ok = dist[u] + w < dist[v];
      const old = dist[v];
      if (ok) { dist[v] = dist[u] + w; changed = true; }
      steps.push({ u, v, w, ok, old, dist: dist.slice() });
    }
    out.push({ p, steps, changed, dist: dist.slice() });
    if (!changed) break;
  }
  return out;
}
const FWD = passes(5, IE, 0);
check(same(FWD[0].dist, ITRUE), 'forward order: one pass');
const REV = passes(5, IE.slice().reverse(), 0);
const REV_FIRST_RIGHT = REV.findIndex((p) => same(p.dist, ITRUE)) + 1;
check(REV_FIRST_RIGHT === 4, 'reverse order: 4 passes');
const edgeNames = (es) => es.map(([u, v]) => `${u}→${v}`);

// ---------- brute force: Network Delay Time, the lesson's DFS (1-indexed) ----------
const BT = [[1, 3, 4], [1, 2, 1], [2, 3, 1], [3, 4, 1], [2, 4, 5]];
const BE = BT.map(([u, v, w]) => [u - 1, v - 1, w]);
const BPOS = [[0, 1], [1.4, 0], [1.4, 2], [2.8, 1]];
const BLAB = ['1', '2', '3', '4'];
const bg = (o) => gp(4, BE, BPOS, { lab: BLAB, ...o });
function bruteRun() {
  const adj = Array.from({ length: 5 }, () => []);
  for (const [u, v, w] of BT) adj[u].push([v, w]);
  const dist = new Array(5).fill(Infinity);
  const fr = [];
  const path = [];
  let sets = 0;
  const snap = (say, note, u, bad) =>
    fr.push({
      say,
      note,
      panels: [
        bg({ st: { ...states(path.map((x) => x - 1), 'visited'), [u - 1]: bad ? 'bad' : 'active' }, es: ek(path.slice(1).map((x, i) => [path[i] - 1, x - 1]), 'active') }),
        arr(fl(dist.slice(1)), { label: 'dist', indexBase: 1, highlights: { [u - 1]: bad ? 'bad' : 'active' } }),
        vars({ sets }),
      ],
    });
  function dfs(u, cost) {
    if (cost >= dist[u]) {
      snap(0, `dfs(${u}, ${cost}): ${cost} ≥ dist[${u}] = ${dist[u]} → prune.`, u, true);
      return;
    }
    const old = dist[u];
    dist[u] = cost;
    sets++;
    path.push(u);
    snap(old === Infinity ? 1 : 2, `dfs(${u}, ${cost}): dist[${u}] = ${cost}${old === Infinity ? '' : ` (was ${old}: improved again)`}.`, u);
    for (const [v, w] of adj[u]) dfs(v, cost + w);
    path.pop();
  }
  dfs(1, 0);
  const ans = Math.max(...dist.slice(1));
  return { fr, dist, sets, ans };
}
const BR = bruteRun();
check(same(BR.dist.slice(1), [0, 1, 2, 3]) && BR.sets === 6 && BR.ans === 3, 'brute force run');
// Bellman-Ford rounds, each reading the previous round (the template's copy)
function bfRounds(n, edges, src, rounds) {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const out = [{ dist: dist.slice(), changed: [] }];
  for (let i = 0; i < rounds; i++) {
    const next = dist.slice();
    const steps = [];
    for (const [u, v, w] of edges) {
      const ok = dist[u] !== Infinity && dist[u] + w < next[v];
      if (ok) next[v] = dist[u] + w;
      steps.push({ u, v, w, ok, prev: dist.slice(), next: next.slice() });
    }
    out.push({ dist: next.slice(), changed: next.map((x, j) => (x !== dist[j] ? j : -1)).filter((j) => j >= 0), steps });
    dist = next;
  }
  return out;
}
const BFB = bfRounds(4, BE, 0, 3);
check(same(BFB[1].dist, [0, 1, 4, Infinity]) && BFB[2].dist[3] === 5 && same(BFB[3].dist, [0, 1, 2, 3]), 'brute BF rounds');

// ---------- optimized-bfs ----------
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// BFS from sources on a grid of '.' / '#', recording each ring (mark visited when enqueued)
function gridRings(g, sources) {
  const R = g.length;
  const C = g[0].length;
  const dist = g.map((row) => row.map(() => null));
  let q = sources.slice();
  for (const [r, c] of q) dist[r][c] = 0;
  const rings = [q.slice()];
  while (q.length) {
    const next = [];
    for (const [r, c] of q)
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] === '#' || dist[nr][nc] !== null) continue;
        dist[nr][nc] = dist[r][c] + 1;
        next.push([nr, nc]);
      }
    if (next.length) rings.push(next);
    q = next;
  }
  return { dist, rings };
}
const ringGrid = (g, dist, upto, newest) =>
  grid(
    g.map((row, r) => row.map((ch, c) => (ch === '#' ? '■' : dist[r][c] !== null && dist[r][c] <= upto ? dist[r][c] : '·'))),
    g.map((row, r) => row.map((ch, c) => (ch === '#' ? 'muted' : dist[r][c] === null || dist[r][c] > upto ? '' : dist[r][c] === newest ? 'active' : 'done'))),
    'dist (■ wall)',
  );
const G1 = ['...#', '.#..', '..#.', '#...'].map((s) => [...s]);
const G1R = gridRings(G1, [[0, 0]]);
check(G1R.dist[3][3] === 6 && G1R.rings.length === 7, 'single-source rings');
const G2 = ['S...', '.#..', '...S'].map((s) => [...s]);
const G2S = [[0, 0], [2, 3]];
const G2R = gridRings(G2, G2S);
const G2MAX = Math.max(...G2R.dist.flat().filter((x) => x !== null));
check(G2MAX === 2, 'multi-source max');
// the lesson's minObstacles (0-1 BFS), recording every pop
function zeroOne(grid0) {
  const R = grid0.length;
  const C = grid0[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(Infinity));
  dist[0][0] = 0;
  const dq = [[0, 0]];
  const ev = [];
  while (dq.length) {
    const [r, c] = dq.shift();
    const moves = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      const w = grid0[nr][nc];
      if (dist[r][c] + w < dist[nr][nc]) {
        dist[nr][nc] = dist[r][c] + w;
        if (w === 0) dq.unshift([nr, nc]);
        else dq.push([nr, nc]);
        moves.push({ nr, nc, w });
      }
    }
    ev.push({ r, c, moves, dist: dist.map((row) => row.slice()), dq: dq.map((x) => x.slice()) });
  }
  return { dist, ev, ans: dist[R - 1][C - 1] };
}
const Z1 = [[0, 1, 0], [0, 1, 0], [0, 0, 0]];
const Z1R = zeroOne(Z1);
check(Z1R.ans === 0 && Z1R.ev.length <= 12, '0-1 bfs run');
const Z2 = [[0, 1, 1], [1, 1, 0], [1, 0, 0]];
const Z2R = zeroOne(Z2);
check(Z2R.ans === 2, '0-1 bfs turn');
const zGrid = (g, dist, cur, moved = []) =>
  grid(
    dist.map((row) => row.map(f)),
    g.map((row, r) => row.map((w, c) => (r === cur[0] && c === cur[1] ? 'active' : moved.some(([a, b]) => a === r && b === c) ? 'visited' : w === 1 ? 'muted' : ''))),
    'dist (grey = obstacle)',
  );
function zFrames(g, run) {
  return run.ev.map((e) => ({
    say: e.moves.some((m) => m.w === 0) ? 1 : e.moves.length ? 2 : 0,
    note:
      `popFront (${e.r},${e.c}), dist ${e.dist[e.r][e.c]}. ` +
      (e.moves.length ? e.moves.map((m) => `(${m.nr},${m.nc}) w=${m.w} → ${m.w ? 'back' : 'front'}`).join('; ') + '.' : 'Nothing improves.'),
    panels: [zGrid(g, e.dist, [e.r, e.c], e.moves.map((m) => [m.nr, m.nc])), que(e.dq.map(([r, c]) => `${r},${c}`), 'deque')],
  }));
}

// ---------- optimized: Dijkstra with lazy deletion ----------
const OE = [[0, 1, 6], [0, 2, 2], [2, 1, 3], [2, 3, 8], [1, 3, 2], [3, 4, 2], [1, 4, 7]];
const OP = [[0, 1], [1.6, 0], [1.6, 2], [3.2, 1], [4.4, 0]];
const OR = dijkstra(5, OE, 0);
check(same(OR.dist, [0, 5, 2, 7, 9]) && OR.ev.filter((e) => e.stale).length === 3, 'optimized run');
// negative edge: the lesson's A→B 2, A→C 5, C→B −4
const NL = ['A', 'B', 'C'];
const NE = [[0, 1, 2], [0, 2, 5], [2, 1, -4]];
const NP = [[0, 0], [2.2, 0], [0, 1.6]];
const NR = dijkstra(3, NE, 0);
check(NR.ev[1].u === 1 && NR.ev[1].d === 2 && NR.ev[2].u === 2 && NR.ev[2].rel[0].nd === 1, 'negative edge run');
// counting shortest paths: ways[v], strict → copy, tie → add, stale skipped
const CE = [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1], [3, 4, 2], [1, 4, 3]];
const CP = [[0, 1], [1.4, 0], [1.4, 2], [2.8, 1], [4, 0]];
function countRun() {
  const adj = Array.from({ length: 5 }, () => []);
  for (const [u, v, w] of CE) adj[u].push([v, w]);
  const dist = new Array(5).fill(Infinity);
  const ways = new Array(5).fill(0);
  dist[0] = 0;
  ways[0] = 1;
  const heap = [[0, 0]];
  const fr = [];
  while (heap.length) {
    const [d, u] = heap.shift();
    if (d > dist[u]) {
      fr.push({ note: `Pop [${d}, ${u}]: stale, skip — ways[${u}] is not added twice.`, u, dist: dist.slice(), ways: ways.slice(), heap: heap.slice(), stale: true });
      continue;
    }
    const parts = [];
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        ways[v] = ways[u];
        hpush(heap, [d + w, v]);
        parts.push(`${v}: ${d + w} better → ways = ${ways[v]}`);
      } else if (d + w === dist[v]) {
        ways[v] += ways[u];
        parts.push(`${v}: tie at ${d + w} → ways += ${ways[u]} = ${ways[v]}`);
      }
    }
    fr.push({ note: `Pop [${d}, ${u}]. ${parts.length ? parts.join('; ') + '.' : 'Nothing new.'}`, u, dist: dist.slice(), ways: ways.slice(), heap: heap.slice() });
  }
  return { fr, ways, dist };
}
const CR = countRun();
check(CR.ways[4] === 3 && CR.dist[4] === 4, 'counting ways');

// ---------- template: Dijkstra on a grid (enter a cell = pay its number), Bellman-Ford with a limit ----------
const TG = [[0, 3, 1], [1, 7, 2], [4, 1, 5]];
function gridDij(g) {
  const R = g.length;
  const C = g[0].length;
  const dist = g.map((row) => row.map(() => Infinity));
  dist[0][0] = 0;
  const heap = [[0, 0, 0]];
  const ev = [];
  while (heap.length) {
    const [d, r, c] = heap.shift();
    if (d > dist[r][c]) {
      ev.push({ d, r, c, stale: true, moves: [], dist: dist.map((x) => x.slice()), heap: heap.slice() });
      continue;
    }
    const moves = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      const nd = d + g[nr][nc];
      if (nd < dist[nr][nc]) {
        dist[nr][nc] = nd;
        let i = heap.length;
        while (i > 0 && heap[i - 1][0] > nd) i--;
        heap.splice(i, 0, [nd, nr, nc]);
        moves.push([nr, nc, nd]);
      }
    }
    ev.push({ d, r, c, stale: false, moves, dist: dist.map((x) => x.slice()), heap: heap.slice() });
  }
  return { dist, ev };
}
const TGR = gridDij(TG);
check(TGR.dist[2][2] === 11 && Math.max(...TGR.ev.map((e) => e.heap.length)) <= 7, 'grid dijkstra');
const TBE = [[0, 1, 1], [1, 2, 1], [0, 2, 5], [2, 3, 1], [0, 3, 9]];
const TBP = [[0, 1], [1.4, 0], [2.8, 0], [2.8, 2]];
const tbg = (o) => gp(4, TBE, TBP, o);
const TBR = bfRounds(4, TBE, 0, 3);
check(TBR[1].dist[3] === 9 && TBR[2].dist[3] === 6 && TBR[3].dist[3] === 3, 'template BF');

// ---------- implementation: networkDelayTime ----------
const NT = [[1, 2, 2], [1, 3, 6], [2, 3, 1], [3, 4, 2], [2, 4, 6]];
function delayRun(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = [[0, k]];
  let finalized = 0;
  let latest = 0;
  const ev = [];
  while (heap.length) {
    const [d, u] = heap.shift();
    if (d > dist[u]) {
      ev.push({ d, u, stale: true, dist: dist.slice(), heap: heap.slice(), finalized, latest, rel: [] });
      continue;
    }
    finalized++;
    latest = d;
    const rel = [];
    for (const [v, w] of adj[u])
      if (d + w < dist[v]) {
        dist[v] = d + w;
        hpush(heap, [dist[v], v]);
        rel.push(`dist[${v}] = ${dist[v]}`);
      }
    ev.push({ d, u, stale: false, dist: dist.slice(), heap: heap.slice(), finalized, latest, rel });
  }
  return { ans: finalized === n ? latest : -1, ev };
}
const NDR = delayRun(NT, 4, 1);
check(NDR.ans === 5, 'network delay');
const ND5 = delayRun(NT, 5, 1);
check(ND5.ans === -1, 'network delay unreachable');
const NDL = ['1', '2', '3', '4'];
const NDE = NT.map(([u, v, w]) => [u - 1, v - 1, w]);
const NDP = [[0, 1], [1.4, 0], [1.4, 2], [2.8, 1]];

// ---------- dry run: the lesson's table, rebuilt from a real run ----------
const DR = dijkstra(5, IE, 0);
const DR_ROWS = [
  ['[0, 0]', 'no', '[0, 4, 1, ∞, ∞]', '[1,2] [4,1]'],
  ['[1, 2]', 'no', '[0, 3, 1, 6, ∞]', '[3,1] [4,1] [6,3]'],
  ['[3, 1]', 'no', '[0, 3, 1, 4, ∞]', '[4,1] [4,3] [6,3]'],
  ['[4, 1]', 'yes', 'unchanged', '[4,3] [6,3]'],
  ['[4, 3]', 'no', '[0, 3, 1, 4, 7]', '[6,3] [7,4]'],
  ['[6, 3]', 'yes', 'unchanged', '[7,4]'],
  ['[7, 4]', 'no', '[0, 3, 1, 4, 7]', 'empty'],
];
check(DR.ev.length === DR_ROWS.length, 'dry run: 7 pops');
DR.ev.forEach((e, i) => {
  const row = DR_ROWS[i];
  check(`[${e.d}, ${e.u}]` === row[0] && (e.stale ? 'yes' : 'no') === row[1], `dry run row ${i + 1} pop`);
  if (!e.stale) check(`[${fl(e.dist).join(', ')}]` === row[2], `dry run row ${i + 1} dist`);
  check((e.heap.length ? e.heap.map(([d, u]) => `[${d},${u}]`).join(' ') : 'empty') === row[3], `dry run row ${i + 1} heap`);
});
check(same(DR.order, [0, 2, 1, 3, 4]), 'dry run finalise order');
check(same(DR.ev[1].heap, [[3, 1], [4, 1], [6, 3]]) && same(DR.ev[1].dist, [0, 3, 1, 6, Infinity]), 'dry-run turn picture');
const DRF = dijFrames(5, IE, IP, DR, { sayPop: 0, sayRel: 1, saySt: 2 });

// ---------- optimized-bellman-ford ----------
const KE = [[0, 1, 100], [1, 2, 100], [0, 2, 500]];
const KP = [[0, 1], [1.4, 0], [2.8, 1]];
const kg = (o) => gp(3, KE, KP, o);
// negative cycle: rounds in place, then one extra round
const CYE = [[0, 1, 4], [1, 2, -2], [2, 1, 1]];
const CYP = [[0, 0], [1.6, 0], [1.6, 1.6]];
function bfInPlace(n, edges, src, rounds) {
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const out = [];
  for (let i = 0; i < rounds; i++) {
    const ch = [];
    for (const [u, v, w] of edges)
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        ch.push(`dist[${v}] = ${dist[v]}`);
      }
    out.push({ dist: dist.slice(), ch });
  }
  return out;
}
const CYR = bfInPlace(3, CYE, 0, 3);
check(same(CYR[0].dist, [0, 3, 2]) && same(CYR[1].dist, [0, 2, 1]) && CYR[2].ch.length > 0, 'negative cycle');
// k stops → k + 1 rounds with a copy
const FE = [[0, 1, 100], [1, 3, 600], [0, 2, 200], [2, 3, 200], [1, 2, 50]];
const FP = [[0, 1], [1.5, 0], [1.5, 2], [3, 1]];
const fg = (o) => gp(4, FE, FP, o);
const FK1 = bfRounds(4, FE, 0, 2);
const FK2 = bfRounds(4, FE, 0, 3);
check(FK1[2].dist[3] === 400 && FK2[3].dist[3] === 350, 'k stops');

// ---------- optimized-floyd-warshall ----------
const WE4 = [[0, 1, 3], [1, 2, 2], [2, 3, 1], [0, 3, 10], [3, 0, 2], [1, 3, 8]];
const WP4 = [[0, 0], [2, 0], [2, 1.6], [0, 1.6]];
function fwRun(n, edges) {
  const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [u, v, w] of edges) d[u][v] = Math.min(d[u][v], w);
  const snaps = [{ d: d.map((r) => r.slice()), ch: [] }];
  for (let k = 0; k < n; k++) {
    const ch = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] + d[k][j] < d[i][j]) {
          d[i][j] = d[i][k] + d[k][j];
          ch.push([i, j]);
        }
    snaps.push({ d: d.map((r) => r.slice()), ch, k });
  }
  return snaps;
}
const FW = fwRun(4, WE4);
check(FW[2].d[0][3] === 10 && FW[3].d[0][3] === 6 && FW[4].d[0][3] === 6, 'floyd d[0][3]');
const fwPanel = (s, k) =>
  table(
    ['0', '1', '2', '3'],
    ['0', '1', '2', '3'],
    s.d.map((row) => row.map(f)),
    s.d.map((row, i) => row.map((_, j) => (s.ch.some(([a, b]) => a === i && b === j) ? 'active' : k !== undefined && (i === k || j === k) ? 'window' : ''))),
    k === undefined ? 'd[i][j] (direct edges)' : `d[i][j] after k = ${k}`,
  );
const fwNote = (s) => (s.ch.length ? s.ch.map(([i, j]) => `d[${i}][${j}] = ${f(s.d[i][j])}`).join(', ') : 'no cell improves');

// ---------- optimized-minimax: Path With Minimum Effort (Dijkstra with Math.max) ----------
const MH = [[1, 2, 2], [3, 8, 2], [5, 3, 5]];
function cellGraph(h, weight) {
  const R = h.length;
  const C = h[0].length;
  const edges = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        edges.push([r * C + c, nr * C + nc, weight(h[r][c], h[nr][nc])]);
      }
  return edges;
}
const MAXC = (d, w) => Math.max(d, w);
const MR = dijkstra(9, cellGraph(MH, (a, b) => Math.abs(a - b)), 0, MAXC);
check(MR.dist[8] === 2, 'min effort');
const rc = (u) => `${Math.floor(u / 3)},${u % 3}`;
const effGrid = (dist, cur, done, ch) =>
  grid(
    [0, 1, 2].map((r) => [0, 1, 2].map((c) => `${MH[r][c]}:${f(dist[r * 3 + c])}`)),
    [0, 1, 2].map((r) => [0, 1, 2].map((c) => {
      const u = r * 3 + c;
      return u === cur ? 'active' : ch.includes(u) ? 'visited' : done.includes(u) ? 'done' : '';
    })),
    'height:effort',
  );
function effFrames() {
  const done = [];
  return MR.ev.map((e) => {
    if (!e.stale) done.push(e.u);
    const ok = e.rel.filter((r) => r.ok);
    return {
      say: e.stale ? 2 : 1,
      note: e.stale
        ? `Pop [${e.d}, (${rc(e.u)})]: stale, skip.`
        : `Pop [${e.d}, (${rc(e.u)})]. ${ok.length ? ok.map((r) => `(${rc(r.v)}): max(${e.d}, ${r.w}) = ${r.nd}`).join('; ') + '.' : 'Nothing improves.'}`,
      panels: [effGrid(e.dist, e.u, done, ok.map((r) => r.v)), que(e.heap.map(([d, u]) => `${d}·${rc(u)}`), 'heap · effort·cell')],
    };
  });
}
// binary search check: BFS using only steps ≤ X
function reachWithin(h, X) {
  const seen = new Set([0]);
  const q = [0];
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    const r = Math.floor(u / 3);
    const c = u % 3;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const v = nr * 3 + nc;
      if (nr < 0 || nc < 0 || nr >= 3 || nc >= 3 || seen.has(v) || Math.abs(h[r][c] - h[nr][nc]) > X) continue;
      seen.add(v);
      q.push(v);
    }
  }
  return [...seen];
}
const X1 = reachWithin(MH, 1);
const X2 = reachWithin(MH, 2);
check(!X1.includes(8) && X2.includes(8), 'binary search on effort');
const reachGrid = (cells, X) => grid(MH, [0, 1, 2].map((r) => [0, 1, 2].map((c) => (cells.includes(r * 3 + c) ? (r * 3 + c === 8 ? 'active' : 'done') : 'muted'))), `heights · reachable with steps ≤ ${X}`);
// Swim in Rising Water: node weights, path value = max cell height, start included
const SW = [[0, 1, 2], [7, 8, 3], [6, 5, 4]];
const SWR = dijkstra(9, cellGraph(SW, (_, b) => b), 0, MAXC);
const SWANS = Math.max(SW[0][0], SWR.dist[8]);
check(SWANS === 4, 'swim');

// ---------- optimized-state-bfs: obstacles elimination, k = 1 ----------
const SG = [[0, 0, 0, 1], [1, 1, 0, 1], [0, 0, 1, 0]];
const SK = 1;
function stateRun(g, k, cellOnly) {
  const R = g.length;
  const C = g[0].length;
  const key = (r, c, rem) => (cellOnly ? `${r},${c}` : `${r},${c},${rem}`);
  const seen = new Set([key(0, 0, k)]);
  let q = [[0, 0, k]];
  const levels = [q.slice()];
  let steps = 0;
  while (q.length) {
    if (q.some(([r, c]) => r === R - 1 && c === C - 1)) return { ans: steps, levels };
    const next = [];
    for (const [r, c, rem] of q)
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const nrem = rem - g[nr][nc];
        if (nrem < 0 || seen.has(key(nr, nc, nrem))) continue;
        seen.add(key(nr, nc, nrem));
        next.push([nr, nc, nrem]);
      }
    if (next.length) levels.push(next);
    q = next;
    steps++;
  }
  return { ans: -1, levels };
}
const SCELL = stateRun(SG, SK, true);
const SSTATE = stateRun(SG, SK, false);
check(SCELL.ans === -1 && SSTATE.ans === 5, 'state bfs vs cell bfs');
check(Math.max(...SSTATE.levels.map((l) => l.length)) <= 7, 'state bfs levels fit');
const lvlGrid = (level, label) =>
  grid(
    SG.map((row, r) => row.map((w, c) => {
      const hit = level.filter(([a, b]) => a === r && b === c).map((x) => x[2]);
      return hit.length ? hit.join('/') : w ? '■' : '·';
    })),
    SG.map((row, r) => row.map((w, c) => (level.some(([a, b]) => a === r && b === c) ? 'active' : w ? 'muted' : ''))),
    label,
  );
// level 2 of the cell-only BFS: (1,2) first reached with 0 eliminations left
check(SCELL.levels[3].some(([r, c, rem]) => r === 1 && c === 2 && rem === 0), 'cell-only: (1,2) taken by the poorer state');
check(SSTATE.levels[3].some(([r, c, rem]) => r === 1 && c === 2 && rem === 1), 'state: (1,2) also kept with 1 left');
const SHORT = { R: 4, C: 5, k: 6 };
check(SHORT.k >= SHORT.R + SHORT.C - 3, 'shortcut applies');

// ---------- mistakes: visited at push time in Dijkstra ----------
const ME = [[0, 1, 5], [0, 2, 1], [2, 1, 1]];
const MP = [[0, 1], [2, 0], [1, 2]];
const mg = (o) => gp(3, ME, MP, o);
check(dijkstra(3, ME, 0).dist[1] === 2, 'correct dist[1]');
// the buggy version: mark seen when pushed, never relax a seen node again
const buggy = (() => {
  const dist = [0, Infinity, Infinity];
  const seen = [1, 0, 0];
  const heap = [[0, 0]];
  while (heap.length) {
    const [d, u] = heap.shift();
    for (const [a, v, w] of ME) if (a === u && !seen[v] && d + w < dist[v]) { dist[v] = d + w; seen[v] = 1; hpush(heap, [dist[v], v]); }
  }
  return dist;
})();
check(buggy[1] === 5, 'buggy dist[1]');

// ---------- interview tips: parallel edges ----------
const PE = [[0, 1, 7], [0, 1, 3]];
check(dijkstra(2, PE, 0).dist[1] === 3, 'parallel edges');

export default {
  what: [
    {
      kind: 'watch',
      title: 'More edges can be cheaper',
      lines: ['Path cost = the **sum** of its edge weights.', 'Direct A → B costs 4; A → C → D → B costs 1 + 2 + 1 = 4: a tie.', 'Make A → B cost **5** and the three-edge route wins.'],
      frames: [
        { say: 0, note: 'Four places, weighted one-way edges.', panels: [ab(4), vars({ 'A→B': '?' })] },
        { say: 1, note: 'One edge: A → B costs 4.', panels: [ab(4, { st: { 0: 'active', 1: 'done' }, es: { '0-1': 'active' } }), vars({ direct: 4 })] },
        { say: 1, note: 'Three edges: 1 + 2 + 1 = 4. Same price.', panels: [ab(4, { st: { 0: 'active', 2: 'visited', 3: 'visited', 1: 'done' }, es: ek([[0, 2], [2, 3], [3, 1]], 'active') }), vars({ direct: 4, via: VIA })] },
        { say: 2, note: `A → B now costs 5. The longer route (4) is cheaper. Counting edges would pick the wrong one.`, panels: [ab(5, { st: { 0: 'active', 2: 'visited', 3: 'visited', 1: 'done' }, es: { ...ek([[0, 2], [2, 3], [3, 1]], 'done'), '0-1': 'bad' } }), vars({ direct: 5, via: VIA, best: directOrVia(5) })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Relaxation: update if better',
      lines: ['`dist[v]` = best cost to v found **so far**. It starts at `Infinity`.', 'Relax u → v: `if (dist[u] + w < dist[v]) dist[v] = dist[u] + w`.'],
      frames: [
        { say: 0, note: 'Nothing reached yet: dist[A] = 0, the rest ∞.', panels: [ab(4, { st: { 0: 'active' } }), arr(['0', '∞', '∞', '∞'], { label: 'dist A B C D', highlights: { 0: 'active' } })] },
        { say: 1, note: 'Relax A → B: 0 + 4 < ∞ → dist[B] = 4.', panels: [ab(4, { st: { 0: 'done', 1: 'active' }, es: { '0-1': 'active' } }), arr([0, 4, '∞', '∞'], { label: 'dist A B C D', highlights: { 1: 'active' } })] },
        { say: 1, note: 'Relax A → C: dist[C] = 1. Relax C → D: 1 + 2 = 3.', panels: [ab(4, { st: { 0: 'done', 2: 'done', 3: 'active' }, es: ek([[0, 2], [2, 3]], 'active') }), arr([0, 4, 1, 3], { label: 'dist A B C D', highlights: { 2: 'active', 3: 'active' } })] },
        { say: 1, note: 'Relax D → B: 3 + 1 = 4. Not < 4, so dist[B] stays 4.', panels: [ab(4, { st: { 3: 'done', 1: 'active' }, es: { '3-1': 'muted' } }), arr([0, 4, 1, 3], { label: 'dist A B C D', highlights: { 1: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the family member',
      lines: ['The right algorithm follows from the **edge weights**.'],
      panels: [table(['all equal', 'only 0 or 1', 'any ≥ 0', 'negative ok', 'all pairs'], ['algorithm'], [['BFS'], ['0-1 BFS'], ['Dijkstra'], ['?'], ['Floyd-W.']], [[''], [''], [''], ['active'], ['']], 'weights → algorithm')],
      task: {
        type: 'choose',
        question: 'One source, and some edges are negative. Which member fits?',
        options: [
          { text: 'Bellman-Ford, O(V · E)', why: '' },
          { text: 'Dijkstra', why: 'Dijkstra is the member for non-negative weights only.' },
          { text: 'BFS', why: 'BFS only fits when all edges cost the same.' },
        ],
        answer: 0,
      },
      solved: 'Negative edges allowed → Bellman-Ford, O(V · E).',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Optimal substructure',
      lines: ['If the best route A → Z passes through M, its A → M part is a best route to M.', 'Otherwise swap in the cheaper A → M and A → Z gets cheaper — contradiction.', 'So remember **one number per node**, not whole paths.'],
      frames: [
        { say: 0, note: `Best A → Z: A → X → M → Z = 1 + 1 + 3 = ${WD[3]}.`, panels: [wg({ st: { 0: 'active', 1: 'visited', 2: 'visited', 3: 'done' }, es: ek([[0, 1], [1, 2], [2, 3]], 'done') }), vars({ 'A→Z': WD[3] })] },
        { say: 0, note: `Its A → M part costs ${WD[2]}, the best way to M.`, panels: [wg({ st: { 0: 'active', 1: 'visited', 2: 'active' }, es: ek([[0, 1], [1, 2]], 'active') }), vars({ 'A→M': WD[2] })] },
        { say: 1, note: 'A route starting with A → M (5) costs 5 + 3 = 8. Swapping in the cheaper prefix (2) gives 5.', panels: [wg({ st: { 0: 'active', 2: 'bad', 3: 'done' }, es: { '0-2': 'bad', '2-3': 'active' } }), vars({ 'via 5': 8, 'via 2': 5 })] },
        { say: 2, note: 'All we keep: one best cost per node.', panels: [wg({ st: { 0: 'done', 1: 'done', 2: 'done', 3: 'done' } }), arr(WD, { label: 'dist A X M Z' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: paths vs numbers',
      lines: ['Brute force tries every path.', 'Count corner-to-corner paths in a **3 × 3** grid of cells, moving only right or down.'],
      panels: [grid([['A', '·', '·'], ['·', '·', '·'], ['·', '·', 'Z']], [['active', '', ''], ['', '', ''], ['', '', 'done']], '3 × 3 cells')],
      task: { type: 'number', question: 'How many right/down paths go from A to Z?', options: [4, 6, 8, 9], answer: PAS[2][2], hint: 'Ways into a cell = ways into the cell above + ways into the cell on the left.' },
      solved: `${PAS[2][2]} paths for 9 cells — and the count explodes as the grid grows. dist needs just 9 numbers.`,
      then: [{ say: 0, note: 'Each cell = above + left. Paths grow fast; distances stay one per node.', panels: [grid(PAS, [['', '', ''], ['', '', ''], ['', '', 'active']], 'paths into each cell')] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Ask in order: the first yes decides',
      lines: ['Every pair, small n → Floyd-Warshall.', 'Negative edges or "at most k edges" → Bellman-Ford.', 'All weights equal → BFS. Only 0 and 1 → 0-1 BFS.', 'Otherwise (non-negative) → Dijkstra.'],
      frames: (() => {
        const rows = [['all pairs, n small?', 'Floyd-W.'], ['negative / ≤ k edges?', 'Bellman-F.'], ['all equal?', 'BFS'], ['only 0 / 1?', '0-1 BFS'], ['otherwise (≥ 0)', 'Dijkstra']];
        const say = [0, 1, 2, 2, 3];
        return rows.map((r, k) => ({ say: say[k], note: `${r[0]} → ${r[1]}`, panels: [table(rows.map((x) => x[0]), ['use'], rows.map((x, i) => [i <= k ? x[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: road trip',
      lines: ['One start city, n = 10⁵ cities.', 'Each road has its own driving time, all positive.'],
      panels: [gp(4, [[0, 1, 7], [0, 2, 3], [2, 1, 2], [1, 3, 4]], [[0, 1], [1.5, 0], [1.5, 2], [3, 1]], { lab: ['S', 'P', 'Q', 'T'] })],
      task: {
        type: 'choose',
        question: 'Which algorithm?',
        options: [
          { text: 'Dijkstra with a min-heap', why: '' },
          { text: 'BFS', why: 'The times differ, so fewest roads is not fastest.' },
          { text: 'Floyd-Warshall', why: 'One source only, and O(n³) at n = 10⁵ is hopeless.' },
          { text: 'Bellman-Ford', why: 'No negative edges and no edge limit; O(V·E) is far slower.' },
        ],
        answer: 0,
      },
      solved: 'Non-negative, different weights, one source → Dijkstra.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the worst climb',
      lines: ['A hiker wants the route whose **largest single climb** is smallest.', 'The path cost is a **max**, not a sum.'],
      panels: [grid([[1, 2, 2], [3, 8, 2], [5, 3, 5]], undefined, 'heights')],
      task: {
        type: 'choose',
        question: 'Which twist fits?',
        options: [
          { text: 'Dijkstra relaxing with Math.max (minimax)', why: '' },
          { text: 'Dijkstra summing the climbs', why: 'A sum answers "total climbing", not "the largest step".' },
          { text: 'BFS over (cell, climbs left)', why: 'That twist is for a resource that changes what you may do; here the cost is a max.' },
        ],
        answer: 0,
      },
      solved: 'Max instead of sum → same Dijkstra, relax with Math.max (or binary search + BFS).',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Disguised graphs',
      lines: ['A **grid**: cells are nodes, moves are edges.', 'A **word list**: words are nodes, one-letter changes are edges.', 'A **state space**: node = (cell, keys held).', 'Say node, edge, cost → the table picks the algorithm.'],
      frames: [
        { say: 0, note: 'Cell (1,1) is a node; its 4 neighbours are its edges.', panels: [grid([['·', '·', '·'], ['·', '•', '·'], ['·', '·', '·']], [['', 'visited', ''], ['visited', 'active', 'visited'], ['', 'visited', '']], 'grid')] },
        { say: 1, note: 'hit – hot – dot – dog: each step changes one letter.', panels: [gp(4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]], [[0, 0], [1.3, 0], [2.6, 0], [3.9, 0]], { lab: ['hit', 'hot', 'dot', 'dog'], undirected: true })] },
        { say: 2, note: 'Same cell, different keys held → different nodes.', panels: [grid([['·', 'a', '·'], ['·', '#', 'A'], ['@', '·', '·']], [['', 'visited', ''], ['', 'muted', 'bad'], ['active', '', '']], 'a = key, A = door'), vars({ node: '(r,c,keys)' })] },
        { say: 3, note: 'Every move costs 1 in all three → BFS. Different costs would mean Dijkstra.', panels: [table(['grid', 'words', 'state'], ['node', 'cost'], [['cell', '1'], ['word', '1'], ['(cell,keys)', '1']], [['', 'done'], ['', 'done'], ['', 'done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: name the cost',
      lines: ['Entering a cell costs the number written on it.', 'Find the cheapest way from top-left to bottom-right.'],
      panels: [grid(TG, [['active', '', ''], ['', '', ''], ['', '', 'done']], 'cost to enter')],
      task: {
        type: 'choose',
        question: 'Node = cell, edge = a move. What do you run?',
        options: [
          { text: 'Dijkstra: costs differ and are non-negative', why: '' },
          { text: 'BFS: it is a grid', why: 'Moves cost 1 to 7 here, not all the same.' },
          { text: '0-1 BFS', why: 'Costs are not only 0 or 1.' },
        ],
        answer: 0,
      },
      solved: 'Grid + different non-negative costs → Dijkstra, pushing [d, r, c].',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'One move: relax an edge',
      lines: ['Relax u → v: `if (dist[u] + w < dist[v]) dist[v] = dist[u] + w`.', 'Distances only go **down**.', 'Each value is the cost of a real path, so never below the truth.'],
      frames: [
        { say: 0, note: 'Start: dist[0] = 0.', panels: [ig({ st: { 0: 'active' } }), arr(fl([0, Infinity, Infinity, Infinity, Infinity]), { label: 'dist', highlights: { 0: 'active' } })] },
        { say: 0, note: 'Relax 0 → 1 (4) and 0 → 2 (1).', panels: [ig({ st: { 0: 'done', 1: 'active', 2: 'active' }, es: ek([[0, 1], [0, 2]], 'active') }), arr(fl([0, 4, 1, Infinity, Infinity]), { label: 'dist', highlights: { 1: 'active', 2: 'active' } })] },
        { say: 1, note: 'Relax 2 → 1: 1 + 2 = 3 < 4. dist[1] drops 4 → 3.', panels: [ig({ st: { 2: 'done', 1: 'active' }, es: { '2-1': 'active', '0-1': 'muted' } }), arr(fl([0, 3, 1, Infinity, Infinity]), { label: 'dist', highlights: { 1: 'active' } })] },
        { say: 2, note: '3 is the real path 0 → 2 → 1. No value is ever a fake shortcut.', panels: [ig({ st: { 0: 'done', 2: 'done', 1: 'done' }, es: ek([[0, 2], [2, 1]], 'done') }), arr(fl([0, 3, 1, Infinity, Infinity]), { label: 'dist', highlights: { 1: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Order is everything',
      lines: ['The algorithms differ only in **which edge to relax next**.', 'Relax the edge list in this order: one pass is enough here.'],
      frames: [
        { say: 0, note: 'Relax every edge once, left to right.', panels: [ig({ st: { 0: 'active' } }), arr(edgeNames(IE), { label: 'edges' }), arr(fl([0, Infinity, Infinity, Infinity, Infinity]), { label: 'dist' })] },
        ...FWD[0].steps.map((s, i) => ({
          say: 1,
          note: `${s.u} → ${s.v}: ${s.ok ? `dist[${s.v}] = ${s.dist[s.v]}${s.old === Infinity ? '' : ` (was ${s.old})`}` : 'no improvement'}.`,
          panels: [ig({ st: { [s.v]: s.ok ? 'active' : '' }, es: { [`${s.u}-${s.v}`]: s.ok ? 'active' : 'muted' } }), arr(edgeNames(IE), { label: 'edges', pointers: [ptr(i, 'e')], highlights: hl(IE.length, (k) => (k < i ? 'done' : k === i ? 'active' : '')) }), arr(fl(s.dist), { label: 'dist', highlights: s.ok ? { [s.v]: 'active' } : {} })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the bad order',
      lines: ['Same edges, list **reversed**: 3→4 first, 0→1 last.', 'Pass = relax every edge once, in place.'],
      panels: [ig({ st: { 0: 'active' } }), arr(edgeNames(IE.slice().reverse()), { label: 'edges' }), arr(fl([0, Infinity, Infinity, Infinity, Infinity]), { label: 'dist' })],
      task: { type: 'number', question: 'After how many passes is every dist correct?', options: [1, 2, 3, 4], answer: REV_FIRST_RIGHT, hint: 'An edge only helps once its start node already has a value. 3→4 comes first but needs dist[3].' },
      solved: `${REV_FIRST_RIGHT} passes instead of 1. Same relaxations, worse order — that is why each algorithm picks the order carefully.`,
      then: REV.slice(0, REV_FIRST_RIGHT).map((p) => ({ say: 0, note: `After pass ${p.p}: ${list(fl(p.dist))}.`, panels: [ig({ st: states(p.dist.map((d, i) => (d === ITRUE[i] ? i : -1)).filter((i) => i >= 0), 'done') }), arr(fl(p.dist), { label: `dist after pass ${p.p}`, highlights: hl(5, (i) => (p.dist[i] === ITRUE[i] ? 'done' : '')) })] })),
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'DFS every path',
      lines: ['`dfs(u, cost)`: stop if `cost >= dist[u]`.', 'Otherwise set `dist[u] = cost` and follow every edge.', 'A bad edge order improves the same node again and again.', 'Answer = the largest dist.'],
      frames: [
        ...BR.fr,
        { say: 3, note: `Done: dist = ${list(BR.dist.slice(1))}. ${BR.sets} sets for 4 nodes. Answer max = ${BR.ans}.`, panels: [bg({ st: states([0, 1, 2, 3], 'done') }), arr(BR.dist.slice(1), { label: 'dist', indexBase: 1, highlights: { 3: 'active' } }), vars({ sets: BR.sets, ans: BR.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: Bellman-Ford rounds',
      lines: ['Middle step: relax **every** edge in a loop.', 'After round i, all shortest paths with **≤ i edges** are correct.', 'Here each round reads the previous round\'s values.'],
      panels: [bg({ st: { 0: 'done', 1: 'done', 2: 'visited' } }), arr(fl(BFB[1].dist), { label: 'dist after round 1', indexBase: 1 })],
      task: { type: 'number', question: 'dist[4] after round 2?', options: [3, 5, 6, 8], answer: BFB[2].dist[3], hint: 'Two edges at most: 1 → 3 → 4 or 1 → 2 → 4.' },
      solved: `${BFB[2].dist[3]} = 1 → 3 → 4 (4 + 1). The 3-edge route 1 → 2 → 3 → 4 needs round 3.`,
      then: [2, 3].map((r) => ({ say: 1, note: `Round ${r}: dist = ${list(fl(BFB[r].dist))}.`, panels: [bg({ st: states(BFB[r].changed, 'active') }), arr(fl(BFB[r].dist), { label: `dist after round ${r}`, indexBase: 1, highlights: states(BFB[r].changed, 'active') })] })),
    },
  ],

  'optimized-bfs': [
    {
      kind: 'watch',
      title: 'BFS rings = distances',
      lines: ['All moves cost 1: the queue holds distance d, then d + 1, nothing else.', 'Mark visited **when you enqueue**.', 'The first discovery of a cell is its shortest distance.'],
      frames: G1R.rings.map((ring, d) => ({
        say: d === 0 ? 1 : d === G1R.rings.length - 1 ? 2 : 0,
        note: d === 0 ? 'Source (0,0) enqueued and marked: dist 0.' : `Ring ${d}: ${ring.length} new cell${ring.length > 1 ? 's' : ''} enqueued and marked at dist ${d}.`,
        panels: [ringGrid(G1, G1R.dist, d, d), que(ring.map(([r, c]) => `${r},${c}`), `queue (dist ${d})`)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: two sources',
      lines: ['**Multi-source BFS**: every source starts in the first frontier at distance 0.', 'Each cell gets its distance to the **nearest** source.'],
      panels: [ringGrid(G2, G2R.dist, 0, 0)],
      task: { type: 'number', question: 'The farthest open cell is how far from its nearest source?', options: [2, 3, 4, 5], answer: G2MAX, hint: 'Both sources spread one ring per step at the same time.' },
      solved: `${G2MAX}: the two waves meet in the middle.`,
      then: G2R.rings.slice(1).map((ring, i) => ({ say: 1, note: `Ring ${i + 1}: ${ring.length} cells.`, panels: [ringGrid(G2, G2R.dist, i + 1, i + 1)] })),
    },
    {
      kind: 'watch',
      title: '0-1 BFS with a deque',
      lines: ['`minObstacles`: entering an obstacle costs 1, a free cell 0.', 'Weight **0** → `pushFront`: same distance, process next.', 'Weight **1** → `pushBack`: one further.'],
      frames: [
        { say: 0, note: 'dist[0][0] = 0, deque = [(0,0)].', panels: [zGrid(Z1, Z1.map((row, r) => row.map((_, c) => (r || c ? Infinity : 0))), [0, 0]), que(['0,0'], 'deque')] },
        ...zFrames(Z1, Z1R),
        { say: 0, note: `Answer dist[2][2] = ${Z1R.ans}: the free way around, no obstacle broken.`, panels: [zGrid(Z1, Z1R.dist, [2, 2]), que([], 'deque')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: break the fewest',
      lines: ['Grey cells are obstacles (cost 1 to enter).', 'Run the same 0-1 BFS from the top-left.'],
      panels: [grid(Z2.map((row) => row.map((w) => (w ? '■' : '·'))), Z2.map((row, r) => row.map((w, c) => (r === 0 && c === 0 ? 'active' : r === 2 && c === 2 ? 'done' : w ? 'muted' : ''))), 'grid (■ obstacle)')],
      task: { type: 'number', question: 'Fewest obstacles removed to reach the bottom-right?', options: [1, 2, 3, 4], answer: Z2R.ans, hint: 'Both neighbours of the start are obstacles, and so is the middle.' },
      solved: `${Z2R.ans}: every way out of the corner pays 1, and one more wall blocks each route.`,
      then: [{ say: 1, note: 'Final dist grid from the 0-1 BFS.', panels: [zGrid(Z2, Z2R.dist, [2, 2])] }],
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Dijkstra with lazy deletion',
      lines: ['Pop the smallest `[d, u]`.', 'If `d > dist[u]`, the entry is **stale**: skip it.', 'Otherwise u is final: relax its edges, push every improvement.'],
      frames: [
        { say: 0, note: 'dist[0] = 0, heap = [[0, 0]].', panels: [gp(5, OE, OP, { st: { 0: 'visited' } }), arr(fl([0, Infinity, Infinity, Infinity, Infinity]), { label: 'dist' }), heapP([[0, 0]])] },
        ...dijFrames(5, OE, OP, OR, { sayPop: 2, sayRel: 2, saySt: 1 }),
        { say: 2, note: `Heap empty. dist = ${list(OR.dist)}; ${OR.ev.filter((e) => e.stale).length} stale entries skipped.`, panels: [gp(5, OE, OP, { st: states([0, 1, 2, 3, 4], 'done') }), arr(OR.dist, { label: 'dist' }), heapP([])] },
      ],
    },
    {
      kind: 'watch',
      title: 'Why negative edges break it',
      lines: ['From A the heap pops A (0), then B (2): B is declared **final** at 2.', 'Later C (5) relaxes C → B: 5 + (−4) = 1 < 2.', 'The "final" value was wrong: the rest of the path **subtracted**.'],
      frames: [
        ...dijFrames(3, NE, NP, { ev: NR.ev.slice(0, 2) }, { lab: NL, sayPop: 0, sayRel: 0, saySt: 0, distLabel: 'dist A B C' }),
        { say: 1, note: 'Pop [5, C]: B: 5 + (−4) = 1 < 2. B was already "final".', panels: [gp(3, NE, NP, { lab: NL, st: { 0: 'done', 1: 'bad', 2: 'active' }, es: { '2-1': 'bad' } }), arr(NR.ev[2].dist, { label: 'dist A B C', highlights: { 1: 'bad' } })] },
        { say: 2, note: 'The proof needs "the rest of the path adds ≥ 0". A −4 edge breaks it → Bellman-Ford.', panels: [gp(3, NE, NP, { lab: NL, st: { 1: 'bad' }, es: { '2-1': 'bad' } }), vars({ 'final B': 2, true: 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the shortest ways',
      lines: ['`ways[v]`: strictly better → `ways[v] = ways[u]`; a tie → `ways[v] += ways[u]`.', 'Stale entries are skipped, so each node adds once.'],
      panels: [gp(5, CE, CP), arr(['1', 0, 0, 0, 0], { label: 'ways' })],
      task: { type: 'number', question: `How many shortest paths reach node 4 (dist ${CR.dist[4]})?`, options: [1, 2, 3, 4], answer: CR.ways[4], hint: 'List them: through 1 directly, or through 3 (and 3 itself has two ways in).' },
      solved: `ways[4] = ${CR.ways[4]}: 0-1-4, 0-1-3-4, 0-2-3-4, all cost ${CR.dist[4]}.`,
      then: CR.fr.map((e) => ({ say: e.stale ? 1 : 0, note: e.note, panels: [gp(5, CE, CP, { st: { [e.u]: e.stale ? 'bad' : 'active' } }), arr(fl(e.dist), { label: 'dist' }), arr(e.ways, { label: 'ways', highlights: { 4: 'active' } })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: which path cost breaks it?',
      lines: ['The greedy proof needs one thing: **extending a path never makes it better**.'],
      panels: [vars({ 'max(d,w)': '≥ d', 'd·p, p≤1': '≤ d', 'd + (−4)': '< d' })],
      task: {
        type: 'choose',
        question: 'Which path cost can NOT use Dijkstra?',
        options: [
          { text: 'A sum with some negative edges', why: '' },
          { text: 'The max edge on the path (minimax)', why: 'max(d, w) ≥ d: extending never improves it, so Dijkstra works with Math.max.' },
          { text: 'A product of probabilities in [0, 1], maximised', why: 'Extending can only keep or lower the product; a max-heap works.' },
        ],
        answer: 0,
      },
      solved: 'A negative edge lets a longer path get cheaper — the one thing the proof forbids.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'The template on a grid',
      lines: ['No adjacency list: neighbours come from `DIRS`.', 'Push `[d, r, c]`; skip stale entries.', 'Here entering a cell costs its number.'],
      frames: [
        { say: 1, note: 'dist[0][0] = 0, heap = [0·0,0].', panels: [grid(TG.map((row, r) => row.map((_, c) => (r || c ? '∞' : 0))), [['active', '', ''], ['', '', ''], ['', '', '']], 'dist'), que(['0·0,0'], 'heap · d·r,c'), grid(TG, undefined, 'cost')] },
        ...TGR.ev.map((e) => ({
          say: e.stale ? 1 : 0,
          note: e.stale ? `Pop [${e.d}, ${e.r}, ${e.c}]: stale, skip.` : `Pop [${e.d}, ${e.r}, ${e.c}]. ${e.moves.length ? e.moves.map(([r, c, d]) => `(${r},${c}) → ${d}`).join(', ') + '.' : 'No improvement.'}`,
          panels: [
            grid(e.dist.map((row) => row.map(f)), e.dist.map((row, r) => row.map((_, c) => (r === e.r && c === e.c ? (e.stale ? 'bad' : 'active') : e.moves.some(([a, b]) => a === r && b === c) ? 'visited' : ''))), 'dist'),
            que(e.heap.map(([d, r, c]) => `${d}·${r},${c}`), 'heap · d·r,c'),
            grid(TG, undefined, 'cost'),
          ],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'Bellman-Ford: at most k edges',
      lines: ['`next = dist.slice()`: this round reads only last round.', 'For each edge: `if (dist[u] + w < next[v]) next[v] = dist[u] + w`.', 'After `maxEdges` rounds, dist[dst] uses at most that many edges.'],
      frames: [
        { say: 0, note: 'maxEdges = 2, src 0, dst 3.', panels: [tbg({ st: { 0: 'active', 3: 'done' } }), arr(fl(TBR[0].dist), { label: 'dist' }), vars({ maxEdges: 2 })] },
        ...[1, 2].flatMap((r) =>
          TBR[r].steps.map((s) => ({
            say: 1,
            note: `Round ${r}, ${s.u}→${s.v}: ${s.ok ? `next[${s.v}] = ${s.next[s.v]}` : s.prev[s.u] === Infinity ? `dist[${s.u}] is ∞, skip` : 'no improvement'}.`,
            panels: [tbg({ st: { [s.u]: 'visited', [s.v]: s.ok ? 'active' : '' }, es: { [`${s.u}-${s.v}`]: s.ok ? 'active' : 'muted' } }), arr(fl(s.prev), { label: `dist (round ${r - 1})`, highlights: { [s.u]: 'visited' } }), arr(fl(s.next), { label: 'next', highlights: s.ok ? { [s.v]: 'active' } : {} })],
          })),
        ),
        { say: 2, note: `Within 2 edges: dist[3] = ${TBR[2].dist[3]} (0 → 2 → 3).`, panels: [tbg({ st: { 0: 'done', 2: 'done', 3: 'active' }, es: ek([[0, 2], [2, 3]], 'done') }), arr(fl(TBR[2].dist), { label: 'dist', highlights: { 3: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one more edge',
      lines: ['Same graph, same code, `maxEdges = 3`.'],
      panels: [tbg({ st: { 0: 'active', 3: 'done' } }), arr(fl(TBR[2].dist), { label: 'dist after round 2' })],
      task: { type: 'number', question: 'dist[3] after round 3?', options: [3, 4, 6, 9], answer: TBR[3].dist[3], hint: 'Round 3 can use a 3-edge path. Which path to 3 has three edges?' },
      solved: `${TBR[3].dist[3]}: 0 → 1 → 2 → 3 = 1 + 1 + 1.`,
      then: [{ say: 0, note: `Round 3: dist = ${list(fl(TBR[3].dist))}.`, panels: [tbg({ st: { 0: 'done', 1: 'done', 2: 'done', 3: 'active' }, es: ek([[0, 1], [1, 2], [2, 3]], 'done') }), arr(fl(TBR[3].dist), { label: 'dist', highlights: states(TBR[3].changed, 'active') })] }],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Network Delay Time',
      lines: ['Nodes are 1..n: allocate n + 1 slots.', 'Each real pop: `finalized++`, `latest = d`.', 'Pops come out in non-decreasing order, so the last one is the farthest.', 'Return `latest` if all n were finalised, else −1.'],
      frames: [
        { say: 0, note: 'k = 1: dist[1] = 0, heap = [[0, 1]].', panels: [gp(4, NDE, NDP, { lab: NDL, st: { 0: 'visited' } }), arr(fl([0, Infinity, Infinity, Infinity]), { label: 'dist', indexBase: 1 }), vars({ finalized: 0, latest: 0 })] },
        ...NDR.ev.map((e) => ({
          say: e.stale ? 2 : 1,
          note: e.stale ? `Pop [${e.d}, ${e.u}]: stale, skip. Counters unchanged.` : `Pop [${e.d}, ${e.u}]: finalized = ${e.finalized}, latest = ${e.latest}.${e.rel.length ? ` ${e.rel.join(', ')}.` : ''}`,
          panels: [
            gp(4, NDE, NDP, { lab: NDL, st: { [e.u - 1]: e.stale ? 'bad' : 'active' } }),
            arr(fl(e.dist.slice(1)), { label: 'dist', indexBase: 1, highlights: { [e.u - 1]: e.stale ? 'bad' : 'done' } }),
            vars({ finalized: e.finalized, latest: e.latest, heap: e.heap.length }),
          ],
        })),
        { say: 3, note: `finalized = 4 = n → return ${NDR.ans}.`, panels: [gp(4, NDE, NDP, { lab: NDL, st: states([0, 1, 2, 3], 'done') }), vars({ return: NDR.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a fifth node',
      lines: ['Same `times`, but now **n = 5**.', 'Node 5 has no edges at all.'],
      panels: [gp(5, NDE, [...NDP, [4.2, 1]], { lab: [...NDL, '5'], st: { 4: 'muted' } })],
      task: { type: 'number', question: 'What does networkDelayTime return?', options: [-1, 5, 6, 8], answer: ND5.ans, hint: 'Count the finalised nodes and compare with n.' },
      solved: 'Only 4 nodes are ever popped: 4 ≠ 5 → −1. Node 5 never hears the signal.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'The first two pops',
      lines: ['Pop the smallest `[d, u]`; relax u\'s edges.', 'An improved node is pushed again: the old entry stays in the heap.', 'A popped `d > dist[u]` is stale.'],
      frames: [
        { say: 0, note: 'Start: dist[0] = 0, heap = [0,0].', panels: [ig({ st: { 0: 'visited' } }), arr(fl([0, Infinity, Infinity, Infinity, Infinity]), { label: 'dist' }), heapP([[0, 0]])] },
        ...DRF.slice(0, 2),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pop [3, 1]',
      lines: ['dist = [0, 3, 1, 6, ∞], heap = [3,1] [4,1] [6,3].', 'Node 1 has one edge: 1 → 3 (weight 1).'],
      panels: [ig({ st: { 0: 'done', 2: 'done', 1: 'active', 3: 'visited' }, es: { '1-3': 'active' } }), arr(fl(DR.ev[1].dist), { label: 'dist', highlights: { 3: 'active' } }), heapP(DR.ev[1].heap)],
      task: { type: 'number', question: 'Pop [3, 1] and relax 1 → 3. What is dist[3] now?', options: [4, 5, 6, 7], answer: DR.ev[2].dist[3], hint: 'Compare 3 + 1 with the current dist[3] = 6.' },
      solved: '3 + 1 = 4 < 6 → dist[3] = 4, and [4, 3] is pushed. The old [6, 3] stays behind.',
      then: DRF.slice(2).map(({ say, ...fr }) => fr),
    },
    {
      kind: 'turn',
      title: 'Your turn: who was settled when',
      lines: ['Every node is finalised exactly once, in distance order.'],
      panels: [ig({ st: states([0, 1, 2, 3, 4], 'done') }), arr(DR.dist, { label: 'final dist' })],
      task: { type: 'order', question: 'Tap the nodes in the order Dijkstra finalised them.', items: DR.order.map(String), hint: 'Sort the nodes by their final distance.' },
      solved: `${DR.order.join(', ')} — distances 0, 1, 3, 4, 7.`,
    },
  ],

  'optimized-bellman-ford': [
    {
      kind: 'watch',
      title: 'In place vs with a copy',
      lines: ['After round i, `dist[v]` = cheapest with **at most i edges** — if round i reads round i − 1.', 'In place, an edge relaxed early feeds a later edge in the **same** round.', 'k = 0 stops = 1 flight = 1 round.'],
      frames: [
        { say: 2, note: 'Edges in this order: 0→1, 1→2, 0→2. k = 0 stops: one round.', panels: [kg({ st: { 0: 'active', 2: 'done' } }), arr(fl([0, Infinity, Infinity]), { label: 'dist' })] },
        { say: 1, note: 'In place: 0→1 sets dist[1] = 100.', panels: [kg({ st: { 1: 'active' }, es: { '0-1': 'active' } }), arr([0, 100, '∞'], { label: 'dist (in place)', highlights: { 1: 'active' } })] },
        { say: 1, note: 'In place: 1→2 reads the new 100 → dist[2] = 200. Two flights in one round ✗.', panels: [kg({ st: { 2: 'bad' }, es: { '0-1': 'active', '1-2': 'bad' } }), arr([0, 100, 200], { label: 'dist (in place)', highlights: { 2: 'bad' } })] },
        { say: 0, note: 'With a copy: next[1] = 100.', panels: [kg({ st: { 1: 'active' }, es: { '0-1': 'active' } }), arr(fl([0, Infinity, Infinity]), { label: 'dist (last round)' }), arr([0, 100, '∞'], { label: 'next', highlights: { 1: 'active' } })] },
        { say: 0, note: '1→2 reads OLD dist[1] = ∞: nothing.', panels: [kg({ es: { '1-2': 'muted' } }), arr(fl([0, Infinity, Infinity]), { label: 'dist (last round)', highlights: { 1: 'visited' } }), arr([0, 100, '∞'], { label: 'next' })] },
        { say: 0, note: '0→2: next[2] = 500. One flight ✓.', panels: [kg({ st: { 2: 'done' }, es: { '0-2': 'active' } }), arr(fl([0, Infinity, Infinity]), { label: 'dist (last round)' }), arr([0, 100, 500], { label: 'next', highlights: { 2: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'One more round: a negative cycle',
      lines: ['Relax every edge V − 1 times (no edge limit, in place is fine).', 'If one **extra** round still improves something, there is a negative cycle.'],
      frames: [
        { say: 0, note: 'V = 3, so 2 rounds. 1 → 2 → 1 costs −2 + 1 = −1.', panels: [gp(3, CYE, CYP, { st: { 0: 'active' } }), arr(fl([0, Infinity, Infinity]), { label: 'dist' })] },
        ...CYR.map((r, i) => ({
          say: i < 2 ? 0 : 1,
          note: i < 2 ? `Round ${i + 1}: ${r.ch.join(', ')}.` : `Extra round 3: ${r.ch.join(', ')} — still improving → negative cycle.`,
          panels: [gp(3, CYE, CYP, { st: i < 2 ? { 1: 'active', 2: 'active' } : { 1: 'bad', 2: 'bad' }, es: i < 2 ? {} : { '1-2': 'bad', '2-1': 'bad' } }), arr(r.dist, { label: `dist after round ${i + 1}`, highlights: i < 2 ? {} : { 1: 'bad', 2: 'bad' } })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: at most one stop',
      lines: ['Cheapest flight 0 → 3 with **k = 1** stop.', 'Rounds = k + 1 = 2, each reading the previous round.'],
      panels: [fg({ st: { 0: 'active', 3: 'done' } }), vars({ k: 1, rounds: 2 })],
      task: { type: 'number', question: 'Cheapest price 0 → 3 within 1 stop?', options: [350, 400, 700, -1], answer: FK1[2].dist[3], hint: 'Only 2-flight routes: 0 → 1 → 3 or 0 → 2 → 3.' },
      solved: `${FK1[2].dist[3]} via 0 → 2 → 3. The cheaper 350 (0 → 1 → 2 → 3) uses 2 stops.`,
      then: [1, 2].map((r) => ({ say: 1, note: `Round ${r}: dist = ${list(fl(FK1[r].dist))}.`, panels: [fg({ st: states(FK1[r].changed, 'active') }), arr(fl(FK1[r].dist), { label: `dist after round ${r}`, highlights: states(FK1[r].changed, 'active') })] })),
    },
  ],

  'optimized-floyd-warshall': [
    {
      kind: 'watch',
      title: 'Allow one more stop-over at a time',
      lines: ['`d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j])`, k outermost.', 'After k = 0..m, `d[i][j]` uses only stop-overs from {0..m}.'],
      frames: [
        { say: 0, note: 'Start: direct edges, 0 on the diagonal, ∞ elsewhere.', panels: [gp(4, WE4, WP4), fwPanel(FW[0])] },
        ...[1, 2].map((s) => ({ say: 1, note: `k = ${s - 1}: ${fwNote(FW[s])}.`, panels: [gp(4, WE4, WP4, { st: { [s - 1]: 'active' } }), fwPanel(FW[s], s - 1)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: stop-over 2',
      lines: ['Now allow node 2 as a stop-over.', 'Read `d[0][2]` and `d[2][3]` from the matrix.'],
      panels: [gp(4, WE4, WP4, { st: { 2: 'active', 0: 'visited', 3: 'visited' } }), fwPanel(FW[2], 1)],
      task: { type: 'number', question: 'd[0][3] after k = 2?', options: [6, 7, 10, 11], answer: FW[3].d[0][3], hint: `min(d[0][3], d[0][2] + d[2][3]) = min(10, ${FW[2].d[0][2]} + ${FW[2].d[2][3]}).` },
      solved: `${FW[3].d[0][3]} = 0 → 1 → 2 → 3. The halves were already best using stops {0, 1}.`,
      then: [3, 4].map((s) => ({ say: 1, note: `k = ${s - 1}: ${fwNote(FW[s])}.`, panels: [gp(4, WE4, WP4, { st: { [s - 1]: 'active' } }), fwPanel(FW[s], s - 1)] })),
    },
  ],

  'optimized-minimax': [
    {
      kind: 'watch',
      title: 'Dijkstra with Math.max',
      lines: ['Path With Minimum Effort: a route costs its **largest** height difference.', 'Relax with `nd = Math.max(d, w)`.', 'Extending never lowers the max, so popped = final; stale entries skipped.'],
      frames: [{ say: 0, note: 'Start (0,0): effort 0. Each cell shows height:effort.', panels: [effGrid([0, ...Array(8).fill(Infinity)], 0, [], []), que(['0·0,0'], 'heap · effort·cell')] }, ...effFrames()],
    },
    {
      kind: 'turn',
      title: 'Your turn: binary search a limit',
      lines: ['Guess a limit X. BFS using only steps ≤ X.', 'If X works, every larger X works: binary search the smallest.'],
      panels: [grid(MH, [['active', '', ''], ['', '', ''], ['', '', 'done']], 'heights')],
      task: {
        type: 'choose',
        question: 'With X = 1, does BFS reach the bottom-right?',
        options: [
          { text: 'No — every way into (2,2) or past 8 needs a step of 2 or more', why: '' },
          { text: 'Yes — along the top row and down the right side', why: '(1,2) → (2,2) is 2 → 5: a step of 3.' },
          { text: 'Yes — down the left side', why: '(0,0) → (1,0) is 1 → 3: a step of 2.' },
        ],
        answer: 0,
      },
      solved: `X = 1 fails, X = 2 works → the answer is 2, as Dijkstra found.`,
      then: [
        { say: 0, note: `X = 1: only ${X1.length} cells reachable. Target missed.`, panels: [reachGrid(X1, 1)] },
        { say: 1, note: `X = 2: target reached → smallest working X = 2.`, panels: [reachGrid(X2, 2)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: swim in rising water',
      lines: ['Now the weights are on **cells**: at time t you may stand on heights ≤ t.', 'Answer = min over paths of the max height on the path, start included.'],
      panels: [grid(SW, [['active', '', ''], ['', '', ''], ['', '', 'done']], 'heights')],
      task: { type: 'number', question: 'Earliest time to reach the bottom-right?', options: [3, 4, 5, 8], answer: SWANS, hint: 'Avoid the 7 and the 8: walk around the edge.' },
      solved: `${SWANS}: 0 → 1 → 2 → 3 → 4 around the rim; its highest cell is 4.`,
    },
  ],

  'optimized-state-bfs': [
    {
      kind: 'watch',
      title: 'Visited on (r, c) alone is wrong',
      lines: ['k = 1 obstacle may be removed.', 'A cell-only visited set keeps the **first** arrival, even a poorer one.', 'The richer arrival is thrown away — and it was the only one that could finish.'],
      frames: [
        ...SCELL.levels.map((lvl, d) => ({
          say: d === 2 ? 1 : 0,
          note: d === 2 ? 'Step 2: (1,1) breaks a wall and arrives with 0 left.' : d === 3 ? 'Step 3: (1,2) is claimed by the state with 0 left; (0,2) with 1 left is turned away.' : `Step ${d}: frontier ${lvl.map(([r, c, k]) => `(${r},${c})${k}`).join(' ')}.`,
          panels: [lvlGrid(lvl, `cell-only BFS, step ${d} (number = left)`), vars({ step: d })],
        })),
        { say: 2, note: 'Nobody left can pass the wall at (2,2): returns −1.', panels: [lvlGrid([], 'cell-only BFS: stuck'), vars({ answer: SCELL.ans })] },
      ],
    },
    {
      kind: 'watch',
      title: 'BFS over (r, c, remaining)',
      lines: ['The node becomes `(r, c, remaining)`.', 'Moves cost 1 → plain BFS on this bigger graph.', 'At most R · C · (k + 1) states.'],
      frames: [
        ...SSTATE.levels.map((lvl, d) => ({
          say: d === 3 ? 0 : 1,
          note: d === 3 ? 'Step 3: (1,2) now holds two states: 0 left and 1 left.' : `Step ${d}: ${lvl.length} state${lvl.length > 1 ? 's' : ''}.`,
          panels: [lvlGrid(lvl, `state BFS, step ${d} (number = left)`), que(lvl.map(([r, c, k]) => `${r},${c},${k}`), 'frontier')],
        })),
        { say: 2, note: `Goal reached at step ${SSTATE.ans}. States possible: 3 · 4 · 2 = 24.`, panels: [vars({ answer: SSTATE.ans, 'max states': 24 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the bulldozer shortcut',
      lines: ['If `k ≥ R + C − 3`, bulldoze an L-shaped path.', 'Then the answer is `R + C − 2` immediately.'],
      panels: [vars(SHORT)],
      task: { type: 'number', question: 'R = 4, C = 5, k = 6. The answer?', options: [6, 7, 9, 20], answer: SHORT.R + SHORT.C - 2, hint: `Check: is 6 ≥ ${SHORT.R} + ${SHORT.C} − 3?` },
      solved: `6 ≥ 6 → answer ${SHORT.R + SHORT.C - 2} with no search.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Marking visited at push time in Dijkstra',
      lines: ['A node can still be **improved** after it is pushed.', 'Marking it visited on push freezes the first, worse value.', '(In plain BFS, marking at push time is correct.)'],
      frames: [
        { say: 1, note: 'Pop 0: push 1 at 5 and 2 at 1 — and mark both visited.', panels: [mg({ st: { 0: 'done', 1: 'visited', 2: 'visited' }, es: ek([[0, 1], [0, 2]], 'active') }), arr([0, 5, 1], { label: 'dist (buggy)' })] },
        { say: 1, note: 'Pop 2: 1 + 1 = 2 < 5, but 1 is "visited" → ignored.', panels: [mg({ st: { 2: 'active', 1: 'bad' }, es: { '2-1': 'bad' } }), arr(buggy, { label: 'dist (buggy)', highlights: { 1: 'bad' } })] },
        { say: 0, note: 'Correct: relax on "strictly smaller". dist[1] = 2.', panels: [mg({ st: { 2: 'done', 1: 'active' }, es: ek([[0, 2], [2, 1]], 'done') }), arr(dijkstra(3, ME, 0).dist, { label: 'dist (correct)', highlights: { 1: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one shared list',
      lines: ['`const adj = new Array(3).fill([])`', 'then push edges 0→1 (4) and 1→2 (3).'],
      panels: [table(['adj[0]', 'adj[1]', 'adj[2]'], ['contents'], [['[1,4] [2,3]'], ['[1,4] [2,3]'], ['[1,4] [2,3]']], [['bad'], ['bad'], ['bad']])],
      task: {
        type: 'choose',
        question: 'Why does every node list both edges?',
        options: [
          { text: 'fill([]) puts the SAME array in every slot', why: '' },
          { text: 'The edges were pushed in both directions', why: 'Then adj[2] would hold [1,3], not a copy of everything.' },
          { text: 'push copies the edge into every list', why: 'push adds to one array; here all slots ARE one array.' },
        ],
        answer: 0,
      },
      solved: 'Use `Array.from({ length: n }, () => [])`: one fresh array per node.',
    },
    {
      kind: 'turn',
      title: 'Your turn: stops vs edges',
      lines: ['"At most k stops." Bellman-Ford runs one round per edge.'],
      panels: [gp(4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]], [[0, 0], [1.3, 0], [2.6, 0], [3.9, 0]], { lab: ['src', 'a', 'b', 'dst'], st: { 1: 'visited', 2: 'visited' } }), vars({ k: 2 })],
      task: { type: 'number', question: 'k = 2 stops. How many rounds?', options: [1, 2, 3, 4], answer: 3, hint: 'Stops are the cities in between; count the flights.' },
      solved: 'k stops = k + 1 edges → 3 rounds.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: read the constraints',
      lines: ['Say the decision out loud: weights, sources, size.'],
      panels: [vars({ n: '≤ 100', ask: 'all pairs' })],
      task: {
        type: 'choose',
        question: 'n ≤ 100 and every pair is asked. Your pick?',
        options: [
          { text: 'Floyd-Warshall, O(n³)', why: '' },
          { text: '0-1 BFS', why: 'Nothing says the weights are only 0 or 1, and it is single-source.' },
          { text: 'Bellman-Ford with k rounds', why: 'That hint is "at most k stops", not "all pairs".' },
        ],
        answer: 0,
      },
      solved: 'n ≤ 100 → n³ = 10⁶: Floyd-Warshall is fine.',
    },
    {
      kind: 'turn',
      title: 'Your turn: parallel edges',
      lines: ['Edge case: two edges with the same ends.', 'The template pushes both into `adj[0]`.'],
      panels: [gp(2, PE, [[0, 0], [2, 0]]), arr(['[1,7]', '[1,3]'], { label: 'adj[0]' })],
      task: { type: 'number', question: 'dist[1] after Dijkstra from 0?', options: [3, 7, 10], answer: dijkstra(2, PE, 0).dist[1], hint: 'Relax both edges; only a strictly smaller value is kept.' },
      solved: '7 first, then 3 < 7 wins. Relaxation handles parallel edges by itself.',
    },
  ],
};
