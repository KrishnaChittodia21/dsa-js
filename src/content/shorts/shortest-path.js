// Shorts for Shortest Path (M9). Format: src/content/shortSchema.js. Facts come only from topics/shortest-path/topic.js.
// Every dist, heap, deque, round, matrix cell and frontier below comes from running the pattern's template on its own
// "e.g." graph (adjacency lists built in edge order). The heap is drawn as its entries sorted smallest first; equal
// distances leave in push order. check() throws at load if a run drifts from the numbers the text quotes.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const f = (x) => (x === Infinity ? '∞' : x);
const fl = (xs) => xs.map(f);
const list = (xs) => `[${xs.join(', ')}]`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/shortest-path.js: ${msg}`);
};

// ---------- drawing ----------
// edges [u, v, w?]; o.undirected, o.st: node → state, o.es: 'u-v' → edge state (either order when undirected)
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.undirected ? {} : { directed: true }),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v, w]) => {
    const s = o.es?.[`${u}-${v}`] ?? (o.undirected ? o.es?.[`${v}-${u}`] : undefined);
    return { from: u, to: v, ...(w !== undefined ? { label: String(w) } : {}), ...(s ? { state: s } : {}) };
  }),
});
const ek = (pairs, s) => Object.fromEntries(pairs.map(([u, v]) => [`${u}-${v}`, s]));
const adjOf = (n, edges, undirected) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    if (undirected) adj[v].push([u, w]);
  }
  return adj;
};
const heapP = (h, label = 'min-heap · d·node') => que(h.map(([d, u]) => `${d}·${u}`), label);

// Dijkstra template (lazy deletion, stale check); comb = d + w, or Math.max for minimax; dst = early exit on pop
function hpush(h, e) {
  let i = h.length;
  while (i > 0 && h[i - 1][0] > e[0]) i--;
  h.splice(i, 0, e);
}
function dijkstra(n, adj, src, { comb = (d, w) => d + w, dst } = {}) {
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const heap = [[0, src]];
  const ev = [];
  while (heap.length) {
    const [d, u] = heap.shift();
    if (u === dst) {
      ev.push({ ret: true, d, u, rel: [], dist: dist.slice(), heap: heap.map((e) => e.slice()) });
      return { dist, ev, ans: d };
    }
    if (d > dist[u]) {
      ev.push({ stale: true, d, u, rel: [], dist: dist.slice(), heap: heap.map((e) => e.slice()) });
      continue;
    }
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
    ev.push({ d, u, rel, dist: dist.slice(), heap: heap.map((e) => e.slice()) });
  }
  return { dist, ev, ans: dst === undefined ? undefined : -1 };
}
// one frame per pop: graph, dist, heap
function dijFrames(n, edges, pos, run, o) {
  const done = [];
  return run.ev.map((e) => {
    if (!e.stale) done.push(e.u);
    const okRel = e.rel.filter((r) => r.ok);
    const rels = e.rel.filter((r) => o.undirected ? !done.includes(r.v) || r.ok : true);
    const note = e.ret
      ? `Pop [${e.d}, ${e.u}]: the target, so return ${e.d}.`
      : e.stale
        ? `Pop [${e.d}, ${e.u}]: ${e.d} > ${o.dist}[${e.u}] = ${e.dist[e.u]}, a **stale** entry. Skip.`
        : `Pop [${e.d}, ${e.u}]: final. ` +
          (rels.length ? rels.map((r) => `${r.v}: ${o.show(e.d, r.w)} = ${r.nd}${r.ok ? (r.old === Infinity ? ' ✓' : ` < ${r.old} ✓`) : ` ≥ ${r.old} ✗`}`).join(', ') + '.' : 'No edges out.');
    return {
      say: e.stale ? o.saySt : o.sayRel,
      note,
      panels: [
        gp(n, edges, pos, { undirected: o.undirected, st: { ...states(e.heap.map((x) => x[1]), 'visited'), ...states(done, 'done'), [e.u]: e.stale ? 'bad' : 'active' }, es: ek(okRel.map((r) => [e.u, r.v]), 'active') }),
        arr(fl(e.dist), { label: o.dist, highlights: { ...states(okRel.map((r) => r.v), 'active'), ...(e.stale ? { [e.u]: 'bad' } : {}) } }),
        heapP(e.heap),
      ],
    };
  });
}

// ====================== unweighted BFS: e.g. 6 nodes, every edge costs 1, from 0 to 5 ======================
const BN = 6;
const BE = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
const BP = [[0, 1], [1.4, 0], [1.4, 2], [2.8, 0], [2.8, 2], [4.2, 1]];
const BADJ = adjOf(BN, BE, true).map((a) => a.map(([v]) => v));
// the template, recording each level; markOnPop = the mistake (count how often each node enters a frontier)
function bfsRun(start, target, markOnPop) {
  const dist = new Map([[start, 0]]);
  const seen = new Set(markOnPop ? [] : [start]);
  const enq = new Array(BN).fill(0);
  let frontier = [start];
  const levels = [];
  for (let lvl = 0; frontier.length; lvl++) {
    const next = [];
    const skipped = [];
    for (const u of frontier) {
      if (markOnPop) {
        if (seen.has(u)) continue;
        seen.add(u);
        if (!dist.has(u)) dist.set(u, lvl);
      }
      if (u === target) {
        levels.push({ frontier, next, skipped, dist: new Map(dist), ret: dist.get(u) });
        return { ans: dist.get(u), levels, enq };
      }
      for (const v of BADJ[u]) {
        if (markOnPop ? !seen.has(v) : !dist.has(v)) {
          if (!markOnPop) dist.set(v, dist.get(u) + 1);
          if (!markOnPop) seen.add(v); // the mistake (markOnPop) marks nothing until it is popped
          next.push(v);
          enq[v]++;
        } else if (!markOnPop) skipped.push([u, v]);
      }
    }
    levels.push({ frontier, next, skipped, dist: new Map(dist) });
    frontier = next;
  }
  return { ans: -1, levels, enq };
}
const BR = bfsRun(0, 5, false);
check(BR.ans === 3 && BR.levels.length === 4, 'bfs 0 → 5 is 3');
check(same(BR.levels.map((l) => l.frontier), [[0], [1, 2], [3, 4], [5]]), 'bfs rings');
check(BR.levels[1].skipped.some(([u, v]) => u === 2 && v === 3), '2 finds 3 already marked');
check(BR.enq.every((c) => c <= 1), 'each node enters once');
const BW = bfsRun(0, 5, true);
check(BW.ans === 3 && BW.enq[3] === 2 && BW.enq[5] === 2 && same(BW.levels[2].frontier, [3, 3, 4]), 'mark-on-pop enqueues 3 and 5 twice');
// every simple path 0 → 5 (what "try every path" explores)
const BPATHS = [];
(function dfs(u, path) {
  if (u === 5) return BPATHS.push(path);
  for (const v of BADJ[u]) if (!path.includes(v)) dfs(v, [...path, v]);
})(0, [0]);
check(BPATHS.length === 4 && Math.min(...BPATHS.map((p) => p.length - 1)) === 3, '4 simple paths, shortest 3 edges');
const bDist = (d) => Array.from({ length: BN }, (_, i) => (d.has(i) ? d.get(i) : '∞'));
const bFrames = BR.levels.map((l, i) => {
  const before = i ? BR.levels.slice(0, i).flatMap((x) => x.frontier) : [];
  const st = { ...states(before, 'done'), ...states(l.frontier, 'active'), ...states(l.next, 'visited') };
  const es = ek(l.next.map((v) => [l.frontier.find((u) => BADJ[u].includes(v) && BR.levels[i].dist.get(u) === l.dist.get(v) - 1), v]), 'active');
  const note =
    l.ret !== undefined
      ? `Ring 3 = [5]: 5 is the target. Return dist = ${l.ret}, the fewest moves.`
      : i === 0
        ? `Ring 0 = [0]. Its neighbours ${l.next.join(', ')} get dist 1 the moment they are enqueued.`
        : l.skipped.some(([u, v]) => u === 2 && v === 3)
          ? `Ring 1 = [1, 2]. 1 marks 3 (dist 2). 2 finds 3 already marked: skip. 4 gets dist 2.`
          : `Ring ${i} = [${l.frontier.join(', ')}]. ${l.next.join(', ')} gets dist ${i + 1}; the other neighbours are already marked.`;
  return { say: l.ret !== undefined ? 2 : 1, note, panels: [gp(BN, BE, BP, { undirected: true, st, es }), arr(bDist(l.dist), { label: 'dist', highlights: states(l.next, 'active') }), que(l.next, 'next ring')] };
});

// ====================== 0-1 BFS: e.g. 5 nodes, weights 0 or 1, from 0 ======================
const ZN = 5;
const ZE = [[0, 1, 1], [0, 2, 0], [2, 1, 0], [1, 4, 0], [2, 3, 1], [3, 4, 1]];
const ZP = [[0, 1], [1.5, 0], [1.5, 2], [3, 2], [3, 0]];
const ZADJ = adjOf(ZN, ZE);
function zeroOne(markOnPush) {
  const dist = new Array(ZN).fill(Infinity);
  dist[0] = 0;
  const marked = new Set([0]);
  const dq = [0];
  const ev = [];
  while (dq.length) {
    const u = dq.shift();
    const moves = [];
    for (const [v, w] of ZADJ[u]) {
      if (markOnPush && marked.has(v)) continue;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        marked.add(v);
        if (w === 0) dq.unshift(v);
        else dq.push(v);
        moves.push({ v, w, nd: dist[v] });
      }
    }
    ev.push({ u, moves, dist: dist.slice(), dq: dq.slice() });
  }
  return { dist, ev };
}
const ZR = zeroOne(false);
check(same(ZR.dist, [0, 0, 0, 1, 0]), '0-1 bfs dist');
check(same(ZR.ev.map((e) => e.u), [0, 2, 1, 4, 1, 3]), '0-1 bfs pop order');
const ZW = zeroOne(true);
check(ZW.dist[4] === 1, 'mark on push locks node 1 at 1, so dist[4] = 1');
// plain BFS (counting edges) reaches 4 by 0 → 1 → 4, which costs 1 + 0 = 1
const zFrames = [
  { say: 0, note: 'dist[0] = 0, deque = [0].', panels: [gp(ZN, ZE, ZP, { st: { 0: 'visited' } }), arr(fl([0, ...Array(ZN - 1).fill(Infinity)]), { label: 'dist' }), que([0], 'deque')] },
  ...ZR.ev.map((e, i) => {
    const prev = new Set(ZR.ev.slice(0, i).map((x) => x.u));
    const note = e.moves.length
      ? `Pop ${e.u} (dist ${e.dist[e.u]}). ` + e.moves.map((m) => `${e.u}→${m.v} w${m.w}: dist ${m.nd}, push ${m.w ? 'back' : 'FRONT'}`).join('; ') + '.'
      : prev.has(e.u)
        ? `Pop ${e.u} again: nothing improves.${e.dq.length ? '' : ' Deque empty: done.'}`
        : `Pop ${e.u} (dist ${e.dist[e.u]}): ${ZADJ[e.u].length ? 'no improvement' : 'no edges out'}.${e.dq.length ? '' : ' Deque empty: done.'}`;
    return {
      say: e.moves.some((m) => m.w === 0) ? 1 : e.moves.length ? 2 : 0,
      note,
      panels: [
        gp(ZN, ZE, ZP, { st: { ...states([...prev], 'done'), ...states(e.dq, 'visited'), [e.u]: 'active' }, es: ek(e.moves.map((m) => [e.u, m.v]), 'active') }),
        arr(fl(e.dist), { label: 'dist', highlights: states(e.moves.map((m) => m.v), 'active') }),
        que(e.dq, 'deque'),
      ],
    };
  }),
];
check(ZR.ev[1].moves[0].v === 1 && ZR.ev[1].moves[0].nd === 0, 'node 1 improved 1 → 0 by the free edge 2→1');

// ====================== Dijkstra: e.g. 5 nodes, weights ≥ 0, from 0 ======================
const DN = 5;
const DE = [[0, 1, 6], [0, 2, 2], [2, 1, 3], [2, 3, 7], [1, 3, 1], [3, 4, 2], [1, 4, 6]];
const DP = [[0, 1], [1.5, 0], [1.5, 2], [3, 2], [4.3, 1]];
const DR = dijkstra(DN, adjOf(DN, DE), 0);
check(same(DR.dist, [0, 5, 2, 6, 8]), 'dijkstra dist');
check(same(DR.ev.map((e) => (e.stale ? `s${e.u}` : e.u)), [0, 2, 1, 's1', 3, 4, 's3', 's4']), 'dijkstra pop order');
const dAll = dijFrames(DN, DE, DP, DR, { dist: 'dist', show: (d, w) => `${d}+${w}`, sayRel: 1, saySt: 2 });
// the last two pops are both stale: one frame
const dLast = DR.ev.slice(-2);
check(dLast.every((e) => e.stale), 'two stale pops at the end');
const dFrames = [
  { say: 0, note: 'dist[0] = 0, every other dist = ∞. Heap = [0·0].', panels: [gp(DN, DE, DP, { st: { 0: 'visited' } }), arr(fl([0, ...Array(DN - 1).fill(Infinity)]), { label: 'dist' }), heapP([[0, 0]])] },
  ...dAll.slice(0, -2),
  { say: 2, note: `Pop [9, 3] and [11, 4]: both stale (dist 6 and 8). Heap empty: dist = ${list(DR.dist)}.`, panels: [dAll.at(-1).panels[0], arr(DR.dist, { label: 'dist', highlights: states([0, 1, 2, 3, 4], 'done') }), heapP([])] },
];
// fewest edges vs cheapest
check(6 + 6 === 12 && 2 + 3 + 1 + 2 === DR.dist[4], '0→1→4 costs 12, 0→2→1→3→4 costs 8');

// ====================== Bellman-Ford with k stops: e.g. 4 cities, from 0 to 3, k = 1 stop ======================
const FN = 4;
const FE = [[0, 1, 100], [1, 3, 100], [0, 2, 50], [2, 1, 20], [0, 3, 500]]; // relaxed in this order
const FP = [[0, 1], [2, 0], [1, 2], [3.5, 1]];
const FK = 1; // stops → FK + 1 edges → FK + 1 rounds
function bellmanFordK(k, inPlace) {
  let dist = new Array(FN).fill(Infinity);
  dist[0] = 0;
  const rounds = [];
  for (let round = 0; round < k; round++) {
    const next = inPlace ? dist : dist.slice();
    const rel = [];
    for (const [u, v, w] of FE) {
      if (dist[u] + w < next[v]) {
        next[v] = dist[u] + w;
        rel.push({ u, v, w, nd: next[v] });
      }
    }
    dist = next;
    rounds.push({ rel, dist: dist.slice() });
  }
  return { dist, rounds };
}
const FR = bellmanFordK(FK + 1, false);
check(FR.dist[3] === 200, 'k = 1 stop: 200');
check(same(FR.rounds[0].dist, [0, 100, 50, 500]) && same(FR.rounds[1].dist, [0, 70, 50, 200]), 'bf rounds');
const FALL = bellmanFordK(FN - 1, true);
check(FALL.dist[3] === 170, 'no limit: 0→2→1→3 = 170 (3 flights)');
const FIP = bellmanFordK(FK + 1, true);
check(FIP.dist[3] === 170, 'in place, 2 rounds: 170, too many flights');
const fPanels = (dist, st, es, hot, label = 'dist') => [gp(FN, FE, FP, { st, es }), arr(fl(dist), { label, highlights: states(hot, 'active') })];

// ====================== Floyd-Warshall: e.g. 4 nodes, undirected ======================
const WN = 4;
const WE = [[0, 1, 4], [1, 2, 4], [0, 3, 1], [3, 2, 2]];
const WP = [[0, 0], [2.4, 0], [2.4, 1.6], [0, 1.6]];
const W0 = Array.from({ length: WN }, (_, i) => Array.from({ length: WN }, (_, j) => (i === j ? 0 : Infinity)));
for (const [u, v, w] of WE) {
  W0[u][v] = Math.min(W0[u][v], w);
  W0[v][u] = Math.min(W0[v][u], w);
}
const WK = []; // matrix after each k, and the cells k improved
{
  const d = W0.map((r) => r.slice());
  for (let k = 0; k < WN; k++) {
    const changed = [];
    for (let i = 0; i < WN; i++)
      for (let j = 0; j < WN; j++)
        if (d[i][k] + d[k][j] < d[i][j]) {
          d[i][j] = d[i][k] + d[k][j];
          changed.push([i, j]);
        }
    WK.push({ k, d: d.map((r) => r.slice()), changed });
  }
}
check(WK[1].d[0][2] === 8 && WK[2].d[0][2] === 8 && WK[3].d[0][2] === 3, 'd[0][2]: 8 after k = 1, 3 after k = 3');
check(same(WK[3].d, [[0, 4, 3, 1], [4, 0, 4, 5], [3, 4, 0, 2], [1, 5, 2, 0]]), 'floyd final');
const ids = ['0', '1', '2', '3'];
const mat = (d, changed = [], label = 'd[i][j]', extra = {}) =>
  table(ids, ids, d.map((r) => r.map((x) => String(f(x)))), d.map((r, i) => r.map((_, j) => extra[`${i},${j}`] || (changed.some(([a, b]) => a === i && b === j) ? 'active' : ''))), label);
const wNote = (s) => {
  const pairs = s.changed.filter(([i, j]) => i < j);
  return pairs.length
    ? `k = ${s.k}: stop-over ${s.k} shortens ${pairs.map(([i, j]) => `${i}–${j} to ${s.d[i][j]}`).join(', ')} (and the mirror cells).`
    : `k = ${s.k}: no pair gets shorter through ${s.k}.`;
};
const wFrames = WK.map((s) => ({ say: 1, note: wNote(s), panels: [gp(WN, WE, WP, { undirected: true, st: { [s.k]: 'active' } }), mat(s.d, s.changed, `d after k = ${s.k}`)] }));

// ====================== minimax: e.g. 5 nodes, undirected, from 0 to 4 ======================
const MN = 5;
const ME = [[0, 1, 2], [1, 4, 9], [0, 2, 5], [2, 3, 4], [3, 4, 5], [1, 2, 3]];
const MP = [[0, 1], [1.5, 0], [1.5, 2], [3, 2], [3, 0]];
const MADJ = adjOf(MN, ME, true);
const MR = dijkstra(MN, MADJ, 0, { comb: (d, w) => Math.max(d, w), dst: 4 });
check(MR.ans === 5, 'minimax 0 → 4 = 5');
check(same(MR.ev.map((e) => (e.ret ? `r${e.u}` : e.stale ? `s${e.u}` : e.u)), [0, 1, 2, 3, 's2', 'r4']), 'minimax pop order');
const MSUM = dijkstra(MN, MADJ, 0);
check(MSUM.dist[4] === 11, 'sum-cheapest 0 → 4 is 0→1→4 = 11');
const mAll = dijFrames(MN, ME, MP, MR, { undirected: true, dist: 'best', show: (d, w) => `max(${d}, ${w})`, sayRel: 1, saySt: 1 });
const mTurnAt = MR.ev.findIndex((e) => e.u === 3);
const mBefore = MR.ev[mTurnAt - 1];
check(mBefore.dist[3] === 4 && mBefore.dist[4] === 9 && mBefore.heap[0][1] === 3, 'before popping 3: best[3] = 4, best[4] = 9');
const mStart = { say: 0, note: 'best[0] = 0, every other best = ∞. Heap = [0·0].', panels: [gp(MN, ME, MP, { undirected: true, st: { 0: 'visited' } }), arr(fl([0, ...Array(MN - 1).fill(Infinity)]), { label: 'best' }), heapP([[0, 0]])] };

// ====================== state BFS: e.g. 3 × 4 grid, k = 1 obstacle may be removed ======================
const SG = [[0, 1, 0, 0], [0, 0, 1, 1], [1, 0, 1, 0]];
const SK = 1;
const SR = SG.length;
const SC = SG[0].length;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the template; cellOnly = the mistake (a visited flag per cell)
function bfsWithState(k, cellOnly) {
  const seen = Array.from({ length: SR }, () => new Array(SC).fill(-1));
  let frontier = [[0, 0, k]];
  seen[0][0] = k;
  const levels = [];
  for (let steps = 0; frontier.length; steps++) {
    levels.push(frontier);
    const next = [];
    for (const [r, c, left] of frontier) {
      if (r === SR - 1 && c === SC - 1) return { ans: steps, levels };
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= SR || nc >= SC) continue;
        const nl = left - SG[nr][nc];
        if (nl < 0 || (cellOnly ? seen[nr][nc] >= 0 : nl <= seen[nr][nc])) continue;
        seen[nr][nc] = nl;
        next.push([nr, nc, nl]);
      }
    }
    frontier = next;
  }
  return { ans: -1, levels };
}
const SS = bfsWithState(SK, false);
const SX = bfsWithState(SK, true);
check(SS.ans === 5 && SX.ans === -1, 'state BFS 5, cell-only BFS -1');
check(SK < SR + SC - 3, 'the walk-straight-through shortcut does not apply');
const has = (lvl, r, c, l) => lvl.some((s) => s[0] === r && s[1] === c && s[2] === l);
check(has(SS.levels[3], 2, 1, 0) && has(SS.levels[3], 2, 1, 1) && has(SX.levels[3], 2, 1, 0) && !has(SX.levels[3], 2, 1, 1), '(2,1): reached with 0 left, then with 1 left');
check(SX.levels.length === 4, 'cell-only BFS dies after step 3');
const sGrid = (level, label, extra = {}) =>
  grid(
    SG.map((row, r) => row.map((w, c) => {
      const hit = level.filter(([a, b]) => a === r && b === c).map((x) => x[2]);
      return hit.length ? hit.join('/') : w ? '■' : '·';
    })),
    SG.map((row, r) => row.map((w, c) => extra[`${r},${c}`] || (level.some(([a, b]) => a === r && b === c) ? 'active' : w ? 'muted' : ''))),
    label,
  );
const sq = (level) => que(level.map(([r, c, l]) => `${r},${c}·${l}`), 'frontier · r,c·left');
const sNotes = [
  'Step 0: start (0,0) with k = 1 removal left. Numbers on a cell = removals left in that state.',
  'Step 1: (1,0) free, keeps 1. (0,1) is an obstacle: break it, 0 left.',
  'Step 2: (2,0) is an obstacle: 0 left. (1,1) free: 1 left. (0,2): 0 left.',
  '(2,1) twice: with 0 left (via (2,0)), then with 1 left. 1 > seen = 0, so the richer state is kept.',
  'Step 4: only (2,1)·1 can break the obstacle (2,2). It goes on with 0 left.',
  `Step 5: (2,3), the goal. Answer ${SS.ans}.`,
];
check(SS.levels.length === sNotes.length && has(SS.levels[4], 2, 2, 0) && SS.levels[4].length === 1, 'state levels match the notes');
const sFrames = SS.levels.map((lvl, i) => ({ say: i === 3 ? 2 : i === 5 ? 0 : 1, note: sNotes[i], panels: [sGrid(lvl, `step ${i}`), sq(lvl)] }));

export default [
  {
    id: 'shortest-path-unweighted-bfs',
    title: 'Fewest moves: the first arrival is the shortest',
    steps: [
      {
        kind: 'watch',
        title: 'Every path is a lot of paths',
        lines: ['"Minimum number of moves from 0 to 5." Every edge costs 1.', 'Trying every path explodes: a node can be reached through exponentially many paths.'],
        frames: [
          { say: 0, note: `e.g. this graph: try every path from 0 to 5. There are already ${BPATHS.length} of them.`, panels: [gp(BN, BE, BP, { undirected: true, st: { 0: 'active', 5: 'done' } }), table(BPATHS.map((_, i) => `path ${i + 1}`), ['nodes', 'moves'], BPATHS.map((p) => [p.join(' → '), String(p.length - 1)]))] },
          { say: 1, note: 'On a 20×20 grid there are about 3.5 × 10^10 corner-to-corner paths. Exploring them all is hopeless.', panels: [vars({ 'every path': 'exponential', BFS: 'O(V + E)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Rings of equal distance',
        lines: ['BFS explores in rings: all nodes at distance 1, then distance 2, …', 'A node gets its dist **when it is enqueued**, and is never enqueued again.', 'Ring number = distance, so the first time the target shows up is the answer.'],
        frames: bFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"minimum number of steps"**, **"fewest moves"**, **"nearest exit"**, **grid with walls**, **"shortest transformation sequence"**, **all edges weight 1**.'],
        frames: [{ say: 0, note: 'Equal edge costs only. With different weights the first arrival is NOT the cheapest: Dijkstra.', panels: [vars({ 'all weights equal': 'BFS', 'only 0 or 1': '0-1 BFS', 'any ≥ 0': 'Dijkstra' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: mark it later',
        lines: ['A teammate marks a node **when it is popped**, not when it is enqueued.', 'Same graph, same start 0.'],
        panels: [gp(BN, BE, BP, { undirected: true, st: { 1: 'visited', 2: 'visited', 3: 'active' } }), que([1, 2], 'ring 1')],
        task: {
          type: 'choose',
          question: 'Ring 1 = [1, 2], and both are neighbours of 3. What happens to 3?',
          options: [
            { text: 'It is enqueued twice: once from 1, once from 2' },
            { text: 'Nothing changes: 3 is enqueued once', why: 'Nothing is marked until it is popped, so when 2 looks at 3, 3 still looks new.' },
            { text: 'dist[3] becomes 3 instead of 2', why: 'Both copies sit in ring 2, so its distance is still 2. The cost is the extra work.' },
            { text: 'BFS never reaches 5 any more', why: 'It still reaches 5 at ring 3. It just enqueues the same nodes many times.' },
          ],
          answer: 0,
        },
        solved: 'Mark visited **when you enqueue**: then every node enters the queue exactly once.',
        then: [{ note: `Run for real: ring 2 = [${BW.levels[2].frontier.join(', ')}]. 3 and 5 each enter twice; on a big grid that repeats everywhere.`, panels: [gp(BN, BE, BP, { undirected: true, st: { 3: 'bad', 5: 'bad' } }), que(BW.levels[2].frontier, 'ring 2 (marked on pop)')] }],
      },
    ],
  },

  {
    id: 'shortest-path-0-1-bfs',
    title: 'Free moves to the front, paid moves to the back',
    steps: [
      {
        kind: 'watch',
        title: 'Some moves are free',
        lines: ['Edge costs are only **0 or 1**. Counting edges no longer works.', 'Dijkstra would be correct, but its heap only ever holds two values: d and d + 1.'],
        frames: [
          { say: 0, note: 'e.g. from 0 to 4. Plain BFS reaches 4 in 2 hops (0 → 1 → 4) at cost 1 + 0 = 1.', panels: [gp(ZN, ZE, ZP, { st: { 0: 'active', 1: 'visited', 4: 'bad' }, es: ek([[0, 1], [1, 4]], 'bad') }), vars({ hops: 2, cost: 1 })] },
          { say: 0, note: '0 → 2 → 1 → 4 uses 3 hops but costs 0 + 0 + 0 = 0. More edges can be cheaper.', panels: [gp(ZN, ZE, ZP, { st: { 0: 'active', 2: 'visited', 1: 'visited', 4: 'done' }, es: ek([[0, 2], [2, 1], [1, 4]], 'active') }), vars({ hops: 3, cost: 0 })] },
          { say: 1, note: 'A heap costs O(E log V). A deque keeps "d at the front, d + 1 at the back" for free: O(V + E).', panels: [vars({ Dijkstra: 'O(E log V)', '0-1 BFS': 'O(V + E)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A deque instead of a heap',
        lines: ['Pop the front; relax only on a **strictly smaller** dist.', 'Weight **0** → same distance → `pushFront`: it goes next.', 'Weight **1** → one further → `pushBack`.'],
        frames: zFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"minimum obstacles to remove"**, **"minimum cost to change arrows"**, **free moves vs paid moves**, **cost is 0 or 1 per step**.'],
        frames: [{ say: 0, note: 'Grid version: stepping onto an obstacle costs 1, onto an empty cell 0.', panels: [vars({ 'empty cell': 'w = 0 → front', obstacle: 'w = 1 → back' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: lock it on push',
        lines: ['A teammate marks a node visited the first time it is pushed, and never touches it again.', 'Same graph, from 0.'],
        panels: [gp(ZN, ZE, ZP, { st: { 0: 'active' } }), arr(fl([0, ...Array(ZN - 1).fill(Infinity)]), { label: 'dist' })],
        task: {
          type: 'choose',
          question: 'What dist[4] does their version return?',
          options: [
            { text: '1: node 1 is locked at dist 1 before the free edge 2 → 1 is seen' },
            { text: '0, the true answer', why: '0 needs node 1 to drop from 1 to 0 via 2 → 1. A locked node can never improve.' },
            { text: '2, via 0 → 2 → 3 → 4', why: '0 → 1 → 4 already costs 1, which is smaller than 2.' },
            { text: '∞: 4 is never reached', why: '0 → 1 → 4 still reaches it, just at the wrong cost.' },
          ],
          answer: 0,
        },
        solved: 'In 0-1 BFS a node can still improve through a 0-edge: relax on "strictly smaller", never lock on push.',
        then: [{ note: `Their run: dist = ${list(fl(ZW.dist))}. The real 0-1 BFS gave ${list(ZR.dist)}.`, panels: [arr(fl(ZW.dist), { label: 'marked on push', highlights: { 1: 'bad', 4: 'bad' } }), arr(ZR.dist, { label: '0-1 BFS', highlights: { 1: 'done', 4: 'done' } })] }],
      },
    ],
  },

  {
    id: 'shortest-path-dijkstra',
    title: 'The cheapest route when edges cost different amounts',
    steps: [
      {
        kind: 'watch',
        title: 'Fewest edges is not cheapest',
        lines: ['Weights differ (all ≥ 0). BFS only counts edges.', 'Trying every path is exponential.'],
        frames: [
          { say: 0, note: 'e.g. 0 → 1 → 4: only 2 edges, but it costs 6 + 6 = 12. BFS would pick it.', panels: [gp(DN, DE, DP, { st: { 0: 'active', 1: 'visited', 4: 'bad' }, es: ek([[0, 1], [1, 4]], 'bad') }), vars({ edges: 2, cost: 12 })] },
          { say: 0, note: `0 → 2 → 1 → 3 → 4: 4 edges, cost 2 + 3 + 1 + 2 = ${DR.dist[4]}. More edges, cheaper.`, panels: [gp(DN, DE, DP, { st: { 0: 'active', 2: 'visited', 1: 'visited', 3: 'visited', 4: 'done' }, es: ek([[0, 2], [2, 1], [1, 3], [3, 4]], 'active') }), vars({ edges: 4, cost: DR.dist[4] })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Always expand the closest',
        lines: ['Push `[0, src]`. Pop the smallest `[d, u]`: with weights ≥ 0 its distance is **final**.', 'Relax: if `d + w < dist[v]`, set `dist[v]` and push `[dist[v], v]`.', 'An old entry stays in the heap: when `d > dist[u]` it is **stale**, skip it.'],
        frames: dFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"minimum time for the signal to reach all nodes"**, **weighted edges, all ≥ 0**, **"cheapest path"**, **"maximum probability"**, **"number of ways to arrive in the shortest time"**.'],
        frames: [{ say: 0, note: 'Up to E pushes and pops, each O(log V): O((V + E) log V).', panels: [vars({ 'every path': 'exponential', Dijkstra: 'O((V + E) log V)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: is it Dijkstra?',
        lines: ['Dijkstra\'s promise "the popped node is final" needs one thing: extending a path never makes it cheaper.'],
        panels: [vars({ needs: 'single source, weights ≥ 0', popped: 'final' })],
        task: {
          type: 'choose',
          question: 'Which problem is a fit for plain Dijkstra?',
          options: [
            { text: 'Minimum time for a signal from node k to reach all nodes; travel times are ≥ 0' },
            { text: 'Cheapest flight from src to dst with at most k stops', why: 'An edge-count limit: the cheapest way to a middle city may use too many stops. Bellman-Ford rounds.' },
            { text: 'Cheapest path when some edges are negative', why: 'A negative edge can lower a node after it was popped as "final". Bellman-Ford.' },
            { text: 'Fewest moves in a grid where every move costs 1', why: 'Dijkstra works, but with equal weights BFS is simpler and faster: O(V + E).' },
          ],
          answer: 0,
        },
        solved: 'Non-negative, different weights, one source → Dijkstra with a min-heap and the stale-entry check.',
      },
    ],
  },

  {
    id: 'shortest-path-bellman-ford',
    title: 'Cheapest price within k stops, one round per edge',
    steps: [
      {
        kind: 'watch',
        title: 'The cheapest route uses too many flights',
        lines: ['"Cheapest price from 0 to 3 with at most **1 stop**." k stops = k + 1 edges.', 'One best price per city forgets how many flights it took.'],
        frames: [
          { say: 1, note: `e.g. with no limit the cheapest is 0 → 2 → 1 → 3 = ${FALL.dist[3]}: 3 flights, 2 stops. Not allowed.`, panels: fPanels(FALL.dist, { 0: 'active', 3: 'bad' }, ek([[0, 2], [2, 1], [1, 3]], 'bad'), [3], 'dist, no limit') },
          { say: 0, note: 'Allowed: at most 1 stop = at most 2 edges. 0 → 1 → 3 = 200 beats the direct 500.', panels: fPanels([0, 100, 50, 200], { 0: 'active', 3: 'done' }, ek([[0, 1], [1, 3]], 'active'), [3], 'what we want') },
        ],
      },
      {
        kind: 'watch',
        title: 'Rounds that read the previous round',
        lines: ['Relax **every** edge once per round; run k + 1 = 2 rounds.', '`next = dist.slice()`: a round reads only the previous round.', 'After round i, dist[v] = cheapest cost using **at most i edges**.'],
        frames: [
          { say: 0, note: 'Start: dist[0] = 0, every other city ∞.', panels: fPanels([0, Infinity, Infinity, Infinity], { 0: 'active' }, {}, [0]) },
          { say: 1, note: `Round 1 from [0, ∞, ∞, ∞]: ${FR.rounds[0].rel.map((r) => `${r.u}→${r.v} = ${r.nd}`).join(', ')}. 1→3 and 2→1 read ∞: nothing.`, panels: fPanels(FR.rounds[0].dist, { 0: 'done', 1: 'visited', 2: 'visited', 3: 'visited' }, ek(FR.rounds[0].rel.map((r) => [r.u, r.v]), 'active'), FR.rounds[0].rel.map((r) => r.v), 'dist after round 1') },
          { say: 1, note: 'Round 2 reads round 1: 1→3 = 100 + 100 = 200 < 500 ✓. 2→1 = 50 + 20 = 70 < 100 ✓.', panels: fPanels(FR.rounds[1].dist, { 0: 'done', 1: 'visited', 3: 'active' }, ek(FR.rounds[1].rel.map((r) => [r.u, r.v]), 'active'), FR.rounds[1].rel.map((r) => r.v), 'dist after round 2') },
          { say: 2, note: `dist[1] = 70 uses 2 edges, but the rounds are over: it never feeds 1→3. Answer dist[3] = ${FR.dist[3]}.`, panels: fPanels(FR.dist, { 3: 'done' }, ek([[0, 1], [1, 3]], 'active'), [3], 'answer') },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"at most k stops"**, **"within k moves"**, **negative weights**, **"detect a negative cycle"**, **currency arbitrage**.'],
        frames: [{ say: 0, note: 'k rounds × E edges: O(k·E). With no limit, V − 1 rounds: O(V·E). A V-th round that improves = negative cycle.', panels: [vars({ 'k-limit': 'k + 1 rounds', 'no limit': 'V − 1 rounds', time: 'O(V·E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: skip the copy',
        lines: ['A teammate drops `next = dist.slice()` and updates `dist` in place.', 'Same edges, same order, still 2 rounds.'],
        panels: [gp(FN, FE, FP, { st: { 0: 'active' } }), vars({ order: '0→1, 1→3, 0→2, 2→1, 0→3', rounds: 2 })],
        task: {
          type: 'choose',
          question: 'What do they return for dist[3]?',
          options: [
            { text: '170: in round 1, 2→1 writes 70, and round 2 chains it into 1→3: 3 flights' },
            { text: '200, the same as with the copy', why: 'In place, a value written earlier in a round is read later: 70 for city 1 reaches 1→3 in round 2.' },
            { text: '500, the direct flight', why: 'Already in round 1, 1→3 reads the fresh 100 and sets 200: in place lets edges chain.' },
            { text: '∞: city 3 is never reached', why: 'The direct 0→3 alone gives 500, and chaining lowers it further.' },
          ],
          answer: 0,
        },
        solved: 'With an edge limit, each round must read the **previous** round: copy `dist` into `next`.',
        then: FIP.rounds.map((r, i) => ({ note: `In place, round ${i + 1}: ${r.rel.map((x) => `${x.u}→${x.v} = ${x.nd}`).join(', ')}.${i ? ' 3 flights: too many stops.' : ''}`, panels: fPanels(r.dist, { 3: i ? 'bad' : '' }, ek(r.rel.map((x) => [x.u, x.v]), 'bad'), r.rel.map((x) => x.v), `in place, round ${i + 1}`) })),
      },
    ],
  },

  {
    id: 'shortest-path-floyd-warshall',
    title: 'Every pair of distances from three nested loops',
    steps: [
      {
        kind: 'watch',
        title: 'n × n answers',
        lines: ['"For every city…": the question needs the distance between **all pairs**.', 'With small n, a triple loop is simpler than a single-source search from every node.'],
        frames: [
          { say: 0, note: 'e.g. 4 nodes → 16 distances. Start: 0 on the diagonal, edge weights, ∞ elsewhere.', panels: [gp(WN, WE, WP, { undirected: true }), mat(W0, [], 'd at the start')] },
          { say: 1, note: 'O(n³): 10^6 steps at n = 100 is fine; 10^12 at n = 10^4 is hopeless.', panels: [vars({ 'n = 100': '10^6', 'n = 10^4': '10^12', space: 'O(n²)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Allow one more stop-over',
        lines: ['For each k: `d[i][j] = min(d[i][j], d[i][k] + d[k][j])` for every i, j.', 'After stop-over k, d[i][j] is the best path whose middle nodes are all from {0..k}.', '**k must be the outer loop.**'],
        frames: wFrames.slice(0, 2),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **n ≤ 100**, **"every pair"**, **"for each city"**, **queries asking the distance between arbitrary pairs**.'],
        frames: [{ say: 0, note: 'Booleans instead of numbers give reachability: reach[i][j] ||= reach[i][k] && reach[k][j].', panels: [vars({ 'all pairs, small n': 'Floyd-Warshall', 'one source': 'Dijkstra / BFS' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: read the cell',
        lines: [`After k = 1, d[0][2] = ${WK[1].d[0][2]} (the route 0 → 1 → 2).`, 'Stop-overs 2 and 3 are not allowed yet.'],
        panels: [gp(WN, WE, WP, { undirected: true, st: { 0: 'active', 2: 'active' } }), mat(WK[1].d, [], 'd after k = 1', { '0,2': 'active', '2,0': 'active' })],
        task: {
          type: 'choose',
          question: `What does d[0][2] = ${WK[1].d[0][2]} promise at this moment?`,
          options: [
            { text: 'The cheapest 0 → 2 route whose stop-overs are only 0 and 1' },
            { text: 'The final shortest distance from 0 to 2', why: 'Stop-overs 2 and 3 are still to come: k = 3 can still lower it.' },
            { text: 'The cheapest route using at most 2 edges', why: 'That is the meaning of a Bellman-Ford round. Floyd-Warshall limits which nodes may be stop-overs.' },
            { text: 'The direct edge 0 – 2', why: 'There is no direct edge 0 – 2; it started at ∞.' },
          ],
          answer: 0,
        },
        solved: 'Floyd-Warshall is DP over "which nodes may be stop-overs": each outer k allows one more.',
        then: [wFrames[2], { ...wFrames[3], note: `${wNote(WK[3])} Final: d[0][2] = ${WK[3].d[0][2]} via 0 → 3 → 2.` }].map(({ say, ...fr }) => fr),
      },
    ],
  },

  {
    id: 'shortest-path-minimax',
    title: 'Minimise the hardest step, not the total',
    steps: [
      {
        kind: 'watch',
        title: 'The cheapest sum has a huge step',
        lines: ['The cost of a path is its **worst** edge, not the sum.', 'e.g. from 0 to 4, minimise the largest step on the way.'],
        frames: [
          { say: 0, note: `Sum-Dijkstra picks 0 → 1 → 4: total ${MSUM.dist[4]}, but one step is 9.`, panels: [gp(MN, ME, MP, { undirected: true, st: { 0: 'active', 1: 'visited', 4: 'bad' }, es: ek([[0, 1], [1, 4]], 'bad') }), vars({ sum: MSUM.dist[4], 'worst step': 9 })] },
          { say: 1, note: '0 → 1 → 2 → 3 → 4: total 14, yet its worst step is only 5. That is the one we want.', panels: [gp(MN, ME, MP, { undirected: true, st: { 0: 'active', 1: 'visited', 2: 'visited', 3: 'visited', 4: 'done' }, es: ek([[0, 1], [1, 2], [2, 3], [3, 4]], 'active') }), vars({ sum: 14, 'worst step': 5 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Dijkstra with max instead of +',
        lines: ['A path\'s cost is `max(edges)`. Extending a path never lowers its max.', 'So Dijkstra still works: relax with `nd = Math.max(d, w)`.', 'Return when the target is **popped**, not when it is pushed.'],
        frames: [mStart, ...mAll.slice(0, mTurnAt)],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"minimum effort"**, **"maximum absolute difference"**, **"swim"**, **"rising water"**, **"minimise the largest"**, **bottleneck**.'],
        frames: [{ say: 0, note: 'Other way: guess a limit X, BFS with edges ≤ X only, binary search the smallest X that reaches.', panels: [vars({ 'Dijkstra + max': 'heap, max instead of +', 'binary search': 'BFS per guess' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: relax one edge',
        lines: [`Next pop: [${mBefore.heap[0][0]}, 3]. Edge 3 – 4 has weight 5; best[4] = ${mBefore.dist[4]}.`],
        panels: mAll[mTurnAt - 1].panels,
        task: {
          type: 'choose',
          question: 'What candidate does node 3 offer node 4?',
          options: [
            { text: '5 = max(4, 5): better than 9, so best[4] = 5' },
            { text: '9 = 4 + 5: not better than 9, no update', why: 'That sums the steps. Here a path costs its single worst step: max(4, 5) = 5.' },
            { text: '4 = min(4, 5)', why: 'min would hide the hard step 3 – 4. A path is as hard as its hardest step.' },
            { text: 'None: skip, the entry [4, 3] is stale', why: `best[3] = ${mBefore.dist[3]}, so d = 4 is not larger: the entry is current.` },
          ],
          answer: 0,
        },
        solved: 'Same Dijkstra, one changed line: `Math.max(d, w)` instead of `d + w`.',
        then: mAll.slice(mTurnAt).map(({ say, ...fr }) => fr),
      },
    ],
  },

  {
    id: 'shortest-path-state-bfs',
    title: 'Same cell, more resources left: a different node',
    steps: [
      {
        kind: 'watch',
        title: 'A visited flag per cell loses the path',
        lines: ['"You may remove at most k = 1 obstacle." Fewest steps from top-left to bottom-right.', 'A visited flag on (r, c) keeps only the **first** arrival.'],
        frames: [
          { say: 0, note: 'e.g. this 3 × 4 grid (■ = obstacle). Numbers = removals left. Step 3 reaches (2,1) with 0 left first.', panels: [sGrid(SX.levels[3], 'cell-only, step 3', { '2,1': 'bad' }), sq(SX.levels[3])] },
          { say: 1, note: 'The later arrival at (2,1) with 1 left is thrown away. Nothing can break (2,2): answer −1.', panels: [sGrid([], 'cell-only: stuck', { '2,1': 'bad', '2,2': 'bad' }), vars({ answer: SX.ans })] },
        ],
      },
      {
        kind: 'watch',
        title: 'BFS over (row, col, left)',
        lines: ['The node is `(r, c, left)`. Every move costs 1, so plain BFS works on it.', '`seen[r][c]` = the **most** removals left ever had there.', 'A new arrival with fewer or equal left is dominated: skip it.'],
        frames: sFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"you can eliminate at most k obstacles"**, **"collect all keys"**, **"with at most k stops"**, **bitmask of visited things**.'],
        frames: [{ say: 0, note: 'The graph grows to rows × cols × (k + 1) states. Shortcut: k ≥ R + C − 3 → answer R + C − 2.', panels: [vars({ states: 'R·C·(k + 1)', here: `${SR}·${SC}·${SK + 1} = ${SR * SC * (SK + 1)}` })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: what to remember',
        lines: ['BFS reaches a cell again, later, with a different number of removals left.'],
        panels: [sGrid(SS.levels[3], 'step 3: (2,1) as 0/1'), sq(SS.levels[3])],
        task: {
          type: 'choose',
          question: 'What should seen[r][c] hold to prune safely?',
          options: [
            { text: 'The most removals left ever had at (r, c)' },
            { text: 'true / false: visited or not', why: 'That keeps the first, poorer arrival and drops the richer one: here it returns −1 instead of 5.' },
            { text: 'The fewest steps to reach (r, c)', why: 'BFS levels already give that. The question is whether the new state has more resource left.' },
            { text: 'The fewest removals left ever had there', why: 'Less left is worse: you would keep the poorer state and skip the better one.' },
          ],
          answer: 0,
        },
        solved: 'Put the resource in the node: (r, c, left). Prune only states with fewer or equal removals left.',
      },
    ],
  },
];
