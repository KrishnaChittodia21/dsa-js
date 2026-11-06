// Shorts for Minimum Spanning Tree (M9). Format: src/content/shortSchema.js. Facts come only from topics/mst/topic.js.
// Every sorted edge, union, parent[] value, heap entry, minCost value, total and skip / force weight below comes from
// running the pattern's template on its own "e.g." graph: Kruskal with the toolkit UnionFind (union by rank, ra stays
// root on a tie, path-halving find, stable sort), lazy Prim ([weight, node], mark on pop, stale skip), dense Prim
// (scan + relax, with the parent[] variation for drawing), the virtual-node wrapper and mstWith(skip, force).
// The heap is drawn as its entries sorted smallest first.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label) => ({ kind: 'queue', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const hl = (ids, s) => Object.fromEntries(ids.map((i) => [i, s]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const f = (x) => (x === Infinity ? '∞' : String(x));
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/mst.js: ${msg}`);
};

// ---------- drawing: G = { L: labels, E: [[u, v, w]], P: positions }; o.es: 'u-v' (u < v) → edge state ----------
const key = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);
const gp = (G, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.label ? { label: o.label } : {}),
  nodes: G.L.map((l, i) => ({ id: i, label: l, x: G.P[i][0], y: G.P[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}), ...(o.tag?.[i] !== undefined ? { tag: String(o.tag[i]) } : {}) })),
  edges: (o.edges || G.E).map(([u, v, w]) => {
    const s = o.es?.[key(u, v)];
    return { from: u, to: v, label: String(w), ...(s ? { state: s } : {}) };
  }),
});
const ek = (es, s) => Object.fromEntries(es.map(([u, v]) => [key(u, v), s]));
const en = (G, [u, v]) => `${G.L[u]}–${G.L[v]}`;
const ew = (G, e) => `${en(G, e)} ${e[2]}`;

// ---------- the toolkit UnionFind ----------
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

// ---------- the template's Kruskal, recording each examined edge ----------
function kruskal(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const u = UF(n);
  let total = 0;
  let used = 0;
  const ev = [];
  for (let i = 0; i < sorted.length; i++) {
    const ok = union(u, sorted[i][0], sorted[i][1]);
    if (ok) {
      total += sorted[i][2];
      used++;
    }
    ev.push({ i, ok, total, used, parent: u.parent.slice() });
    if (ok && used === n - 1) break;
  }
  return { sorted, ev, total, used, ans: used === n - 1 ? total : -1, tree: ev.filter((e) => e.ok).map((e) => sorted[e.i]) };
}
// sorted-edge table: examined rows done (kept) / muted (skipped), the current one active / bad
const sortedTable = (G, run, upto, label = 'sorted edges') =>
  table(
    run.sorted.map((e) => en(G, e)),
    ['w', 'union'],
    run.sorted.map((e, i) => {
      const x = run.ev.find((v) => v.i === i);
      return [String(e[2]), !x || i > upto ? '' : x.ok ? 'true · keep' : 'false · skip'];
    }),
    run.sorted.map((e, i) => {
      const x = run.ev.find((v) => v.i === i);
      const s = !x || i > upto ? '' : i === upto ? (x.ok ? 'active' : 'bad') : x.ok ? 'done' : 'muted';
      return [s, s];
    }),
    label,
  );
const kPanels = (G, run, k, label) => {
  const e = run.ev[k];
  const cur = run.sorted[e.i];
  const kept = run.ev.slice(0, k + 1).filter((x) => x.ok).map((x) => run.sorted[x.i]);
  return [
    gp(G, { es: { ...ek(kept, 'done'), [key(cur[0], cur[1])]: e.ok ? 'active' : 'bad' }, st: hl([cur[0], cur[1]], e.ok ? 'active' : 'bad'), label: label || `total ${e.total} · used ${e.used}` }),
    sortedTable(G, run, e.i),
    arr(e.parent.map((x) => G.L[x]), { label: `parent of ${G.L.join(' ')}`, showIndices: false, highlights: hl([cur[0], cur[1]], e.ok ? 'active' : 'bad') }),
  ];
};

// ====================== mst-kruskal: e.g. n = 5, 7 candidate edges ======================
const KG = { L: ['0', '1', '2', '3', '4'], E: [[0, 1, 6], [0, 2, 3], [1, 2, 4], [1, 3, 2], [2, 3, 5], [3, 4, 7], [2, 4, 8]], P: [[0, 0.7], [1.5, 0], [1.5, 1.4], [3, 0], [3, 1.4]] };
const KR = kruskal(5, KG.E);
check(KR.ans === 16 && KR.ev.length === 6, 'kruskal run');
check(same(KR.tree.map((e) => en(KG, e)), ['1–3', '0–2', '1–2', '3–4']), 'kruskal tree');
check(same(KR.ev.filter((e) => !e.ok).map((e) => en(KG, KR.sorted[e.i])), ['2–3', '0–1']), 'kruskal skips');
// C(7, 4): every way to pick n − 1 = 4 of the 7 edges
const K_SUBSETS = (7 * 6 * 5 * 4) / (4 * 3 * 2 * 1);
check(K_SUBSETS === 35, 'subset count');
const kNote = (e) => {
  const c = KR.sorted[e.i];
  if (!e.ok) return `${ew(KG, c)}: union returns **false**: ${c[0]} and ${c[1]} already in one component. Skip: it would close a cycle.`;
  return `${ew(KG, c)}: union returns **true**. total ${e.total}, used ${e.used}${e.used === 4 ? ' = n − 1 → stop; 2–4 never examined' : ''}.`;
};
const kFrames = KR.ev.map((e, k) => ({ say: e.ok ? 1 : 2, note: kNote(e), panels: kPanels(KG, KR, k) }));
// the turn: after 1–3 and 0–2, edge 1–2 is next; a visited Set has seen all of 0, 1, 2, 3
const K_T = KR.ev[1];
check(KR.ev[2].ok && en(KG, KR.sorted[2]) === '1–2', 'turn: 1–2 is accepted');

// ====================== mst-prim: e.g. n = 5, adjacency lists, start A ======================
const PG = { L: ['A', 'B', 'C', 'D', 'E'], E: [[0, 1, 5], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 6], [3, 4, 8], [2, 4, 7]], P: [[0, 0.7], [1.5, 0], [1.5, 1.4], [3, 0], [3, 1.4]] };
function hpush(h, e) {
  let i = h.length;
  while (i > 0 && h[i - 1][0] > e[0]) i--;
  h.splice(i, 0, e);
}
function prim(n, edges, start = 0) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const inTree = new Array(n).fill(0);
  const heap = [[0, start, -1]]; // [weight, node, from] — from only for drawing
  let total = 0;
  let count = 0;
  const ev = [];
  const tree = [];
  while (heap.length && count < n) {
    const [w, u, from] = heap.shift();
    if (inTree[u]) {
      ev.push({ w, u, stale: true, pushed: [], total, count, heap: heap.map((e) => e.slice()), inTree: inTree.slice(), tree: tree.slice() });
      continue;
    }
    inTree[u] = 1;
    total += w;
    count++;
    if (from >= 0) tree.push([from, u, w]);
    const pushed = [];
    for (const [v, wt] of adj[u])
      if (!inTree[v]) {
        hpush(heap, [wt, v, u]);
        pushed.push([wt, v, u]);
      }
    ev.push({ w, u, stale: false, pushed, total, count, heap: heap.map((e) => e.slice()), inTree: inTree.slice(), tree: tree.slice() });
  }
  return { ev, total, count, ans: count === n ? total : -1, tree };
}
const PR = prim(5, PG.E);
check(PR.ans === 13 && PR.ev.length === 7 && PR.ev.filter((e) => e.stale).length === 2, 'prim run');
check(KR && kruskal(5, PG.E).ans === PR.ans, 'prim agrees with kruskal');
const ent = ([w, u]) => `[${w}, ${PG.L[u]}]`;
const heapP = (h) => que(h.map(([w, u]) => `${w}·${PG.L[u]}`), 'heap · w·node');
const inIds = (t) => t.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
const pPanels = (e) => [
  gp(PG, {
    st: { ...hl(inIds(e.inTree), 'done'), ...hl(e.pushed.map((p) => p[1]), 'visited'), [e.u]: e.stale ? 'bad' : 'active' },
    es: { ...ek(e.pushed.map((p) => [p[2], p[1]]), 'active'), ...ek(e.tree, 'done') },
    label: `total ${e.total} · ${e.count} in tree`,
  }),
  heapP(e.heap),
];
const pFrames = PR.ev.map((e) => ({
  say: e.stale ? 1 : 2,
  note: e.stale
    ? `Pop ${ent([e.w, e.u])}: ${PG.L[e.u]} is already in the tree → **stale**, skip.`
    : `Pop ${ent([e.w, e.u])}: add ${PG.L[e.u]}, total ${e.total}.` + (e.pushed.length ? ` Push ${e.pushed.map(ent).join(' ')}.` : ' Nothing new to push.'),
  panels: pPanels(e),
}));
// the turn: C was just popped; B already waits in the heap as [5, B] and edge C–B costs 3
const P_T = PR.ev[1];
check(P_T.u === 2 && P_T.pushed.some(([w, v]) => w === 3 && v === 1) && PR.tree.some(([a, b, w]) => a === 2 && b === 1 && w === 3), 'turn: B joins via C–B 3');

// ====================== mst-prim-dense: e.g. 4 points, cost = Manhattan distance ======================
const PTS = [[0, 0], [2, 2], [3, 0], [4, 3]];
const DN = PTS.length;
const man = (i, j) => Math.abs(PTS[i][0] - PTS[j][0]) + Math.abs(PTS[i][1] - PTS[j][1]);
const DPOS = PTS.map(([x, y]) => [x / 1.3, (3 - y) / 1.3]);
const DG = { L: ['0', '1', '2', '3'], E: [], P: DPOS };
const dTag = Object.fromEntries(PTS.map(([x, y], i) => [i, `(${x},${y})`]));
function densePrim() {
  const minCost = new Array(DN).fill(Infinity);
  const parent = new Array(DN).fill(-1);
  const inTree = new Array(DN).fill(0);
  minCost[0] = 0;
  let total = 0;
  const ev = [];
  for (let round = 0; round < DN; round++) {
    let u = -1;
    for (let v = 0; v < DN; v++) if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    inTree[u] = 1;
    total += minCost[u];
    const pick = { round, u, total, minCost: minCost.slice(), parent: parent.slice(), inTree: inTree.slice() };
    const rel = [];
    for (let v = 0; v < DN; v++)
      if (!inTree[v]) {
        const d = man(u, v);
        const ok = d < minCost[v];
        if (ok) (minCost[v] = d), (parent[v] = u);
        rel.push({ v, d, ok });
      }
    ev.push({ ...pick, rel, after: minCost.slice(), afterParent: parent.slice() });
  }
  return { ev, total };
}
const DP = densePrim();
check(DP.total === 9 && same(DP.ev.map((e) => e.u), [0, 2, 1, 3]), 'dense prim run');
check(kruskal(DN, [0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].filter((j) => j > i).map((j) => [i, j, man(i, j)]))).ans === 9, 'dense prim agrees with kruskal');
const dTree = (parent, inTree) => inIds(inTree).filter((v) => parent[v] >= 0).map((v) => [parent[v], v, man(parent[v], v)]);
const dPanels = (e, phase) => {
  const tree = dTree(phase === 'pick' ? e.parent : e.afterParent, e.inTree);
  const relE = phase === 'relax' ? e.rel.map((r) => [e.u, r.v, r.d]) : [];
  const mc = phase === 'pick' ? e.minCost : e.after;
  return [
    gp(DG, {
      edges: [...tree, ...relE],
      es: { ...ek(relE.filter((r, i) => e.rel[i].ok), 'active'), ...ek(relE.filter((r, i) => !e.rel[i].ok), 'muted'), ...ek(tree, 'done') },
      st: { ...hl(inIds(e.inTree), 'done'), [e.u]: 'active' },
      tag: dTag,
      label: `round ${e.round + 1} · total ${e.total}`,
    }),
    arr(mc.map(f), { label: 'minCost', highlights: { ...hl(inIds(e.inTree), 'muted'), ...(phase === 'relax' ? hl(e.rel.filter((r) => r.ok).map((r) => r.v), 'active') : { [e.u]: 'active' }) }, pointers: [ptr(e.u, 'u')] }),
  ];
};
const dFrames = [
  { say: 0, note: 'minCost[0] = 0, every other point ∞. Nothing is in the tree yet.', panels: [gp(DG, { tag: dTag, label: 'start' }), arr(['0', '∞', '∞', '∞'], { label: 'minCost' })] },
];
DP.ev.forEach((e, k) => {
  const pickNote = k === 0 ? 'Scan: point 0 has the smallest minCost (0). Add it.' : `Scan the outside points: ${e.u} has the smallest minCost (${e.minCost[e.u]}). Add it, total ${e.total}.`;
  dFrames.push({ say: 1, note: pickNote, panels: dPanels(e, 'pick') });
  if (!e.rel.length) return;
  const said = e.rel.map((r) => (r.ok ? `${r.v} → ${r.d}` : `${r.v} keeps ${f(e.after[r.v])}`)).join(', ');
  dFrames.push({ say: 2, note: `Relax from ${e.u}: ${said}.`, panels: dPanels(e, 'relax') });
});
check(dFrames.length === 8, 'dense frames');
// the turn: after round 1, minCost = [0, 4, 3, 7] and 0 is in the tree
const D_T = DP.ev[0];
check(same(D_T.after, [0, 4, 3, 7]) && DP.ev[1].u === 2, 'turn: round 2 picks 2');

// ====================== mst-virtual-node: e.g. 4 houses, wells [3, 6, 2, 7], 3 pipes ======================
const WELLS = [3, 6, 2, 7];
const PIPES = [[1, 2, 2], [2, 3, 4], [3, 4, 3]];
const VG0 = { L: ['0', '1', '2', '3', '4'], P: [[1.8, 0], [0, 1.6], [1.2, 1.6], [2.4, 1.6], [3.6, 1.6]] };
function withVirtualNode(n, nodeCost, edges) {
  const all = edges.map(([u, v, w]) => [u, v, w]);
  for (let i = 1; i <= n; i++) all.push([0, i, nodeCost[i - 1]]);
  return { all, run: kruskal(n + 1, all) };
}
const VNR = withVirtualNode(4, WELLS, PIPES);
const VR = VNR.run;
const VG = { ...VG0, E: VNR.all };
check(VR.ans === 10 && VR.ev.length === 4 && VR.ev.every((e) => e.ok), 'virtual node run');
check(same(VR.tree.map((e) => en(VG, e)), ['1–2', '0–3', '3–4', '0–1']), 'virtual node tree');
const V_WELLS = VR.tree.filter((e) => e[0] === 0).map((e) => e[1]);
check(same(V_WELLS, [3, 1]), 'two wells');
// greedy "one well at the cheapest house, pipes for the rest": cheapest well + MST of the pipes alone
const V_CHEAP = WELLS.indexOf(Math.min(...WELLS)) + 1;
const V_PIPES = kruskal(5, PIPES.map(([u, v, w]) => [u, v, w]));
const V_PIPE_TOTAL = V_PIPES.tree.reduce((s, e) => s + e[2], 0);
const V_GREEDY = Math.min(...WELLS) + V_PIPE_TOTAL;
check(V_CHEAP === 3 && V_PIPE_TOTAL === 9 && V_GREEDY === 11, 'greedy one well');
const houses = { L: ['', '1', '2', '3', '4'], P: VG0.P, E: PIPES };
const wellTag = { 1: 'well 3', 2: 'well 6', 3: 'well 2', 4: 'well 7' };
const vFrames = VR.ev.map((e, k) => {
  const c = VR.sorted[e.i];
  const what = c[0] === 0 ? `well at house ${c[1]}` : `pipe ${en(VG, c)}`;
  return { say: 2, note: `${ew(VG, c)} = ${what}: union true. total ${e.total}, used ${e.used}${e.used === 4 ? ' = n → stop' : ''}.`, panels: kPanels(VG, VR, k) };
});

// ====================== mst-edge-classification: e.g. n = 4, edges pre-sorted, two of weight 2 ======================
const CG = { L: ['0', '1', '2', '3'], E: [[0, 1, 1], [1, 2, 2], [0, 2, 2], [2, 3, 3], [1, 3, 4]], P: [[0, 0.7], [1.4, 0], [1.4, 1.4], [2.8, 0.7]] };
function mstWith(n, edges, skip = -1, force = -1) {
  const uf = UF(n);
  let total = 0;
  let used = 0;
  const tree = [];
  if (force !== -1) {
    const [u, v, w] = edges[force];
    union(uf, u, v);
    total += w;
    used++;
    tree.push(edges[force]);
  }
  for (let i = 0; i < edges.length; i++) {
    if (i === skip || i === force) continue;
    const [u, v, w] = edges[i];
    if (union(uf, u, v)) {
      total += w;
      used++;
      tree.push(edges[i]);
    }
  }
  return { total: used === n - 1 ? total : Infinity, tree };
}
const BEST = mstWith(4, CG.E);
check(BEST.total === 6 && same(BEST.tree.map((e) => en(CG, e)), ['0–1', '1–2', '2–3']), 'my MST');
const CLS = CG.E.map((e, i) => {
  const s = mstWith(4, CG.E, i);
  const fo = mstWith(4, CG.E, -1, i);
  const cls = s.total > BEST.total ? 'critical' : fo.total === BEST.total ? 'pseudo-critical' : 'in no MST';
  return { i, s, fo, cls };
});
check(same(CLS.map((c) => c.cls), ['critical', 'pseudo-critical', 'pseudo-critical', 'critical', 'in no MST']), 'classification');
const OTHER = CLS[1].s.tree;
check(same(OTHER.map((e) => en(CG, e)), ['0–1', '0–2', '2–3']) && CLS[1].s.total === 6, 'second MST without 1–2');
const clsTable = (shown, hot = -1) =>
  table(
    CG.E.map((e) => ew(CG, e)),
    ['skip', 'force', 'class'],
    CLS.map((c) => (shown.includes(c.i) ? [f(c.s.total), f(c.fo.total), c.cls] : ['', '', ''])),
    CLS.map((c) => {
      const s = c.i === hot ? 'active' : shown.includes(c.i) ? (c.cls === 'in no MST' ? 'muted' : 'done') : '';
      return [s, s, s];
    }),
    `best = ${BEST.total}`,
  );
const cFrame = (i, shown, say) => {
  const c = CLS[i];
  const e = CG.E[i];
  const forceTxt = c.cls === 'critical' ? '' : ` Force it: ${f(c.fo.total)}.`;
  return {
    say,
    note: `${ew(CG, e)}: skip it → ${f(c.s.total)}${c.s.total > BEST.total ? ` > ${BEST.total}` : ""}.${forceTxt} → **${c.cls}**.`,
    panels: [
      gp(CG, { es: { ...ek((c.cls === 'critical' ? c.s : c.fo).tree, 'done'), [key(e[0], e[1])]: c.cls === 'critical' ? 'bad' : 'active' }, label: c.cls === 'critical' ? `skip ${en(CG, e)} · ${f(c.s.total)}` : `force ${en(CG, e)} · ${f(c.fo.total)}` }),
      clsTable(shown, i),
    ],
  };
};

export default [
  {
    id: 'mst-kruskal',
    title: 'Cheapest edge first, unless it closes a cycle',
    steps: [
      {
        kind: 'watch',
        title: 'Connect all, pay least',
        lines: ['"Connect all nodes at **minimum total cost**." A spanning tree always has exactly n − 1 edges.', 'Trying every spanning tree is exponential.'],
        frames: [
          {
            say: 1,
            note: `e.g. n = 5, 7 candidate edges. Picking 4 of 7 alone gives ${K_SUBSETS} subsets to test; it explodes with size.`,
            panels: [gp(KG, { label: 'n = 5 · need 4 edges' }), vars({ edges: 7, 'n − 1': 4, 'subsets of 4': K_SUBSETS })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort, then union',
        lines: ['`edges.sort((a, b) => a[2] - b[2])`: cheapest first (always pass a comparator).', '`uf.union(u, v)` true → joins two components: `total += w`, stop at n − 1 edges.', '`union` false → same component already: the edge would close a cycle, skip it.'],
        frames: [{ say: 0, note: 'Sorted by weight. Every node starts as its own component.', panels: [gp(KG, { label: 'total 0 · used 0' }), sortedTable(KG, KR, -1), arr(KG.L, { label: `parent of ${KG.L.join(' ')}`, showIndices: false })] }, ...kFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"connect all cities / houses / computers at minimum cost"**, **input is a list of [u, v, cost]**, **"return -1 if it is impossible to connect everything"**.'],
        frames: [
          {
            say: 0,
            note: `MST total ${KR.ans}. O(m log m), dominated by the sort. Fewer than n − 1 edges kept → return -1.`,
            panels: [gp(KG, { es: ek(KR.tree, 'done'), st: hl([0, 1, 2, 3, 4], 'done'), label: `MST · total ${KR.ans}` }), vars({ time: 'O(m log m)', disconnected: 'used < n − 1 → -1' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: both ends already touched',
        lines: ['Kept so far: 1–3 and 0–2. Next edge: **1–2 (4)**.', 'Nodes 0, 1, 2 and 3 are all "visited" by kept edges.'],
        panels: kPanels(KG, KR, 1, `total ${K_T.total} · used ${K_T.used}`),
        task: {
          type: 'choose',
          question: 'What does Kruskal do with edge 1–2?',
          options: [
            { text: 'Skip it: both endpoints are already visited', why: 'Visited is not the same as connected: 1 sits in {1, 3} and 2 in {0, 2}. A visited Set cannot tell components apart.' },
            { text: 'Keep it: union(1, 2) is true, it joins {1, 3} with {0, 2}' },
            { text: 'Stop: every node is already visited', why: 'Stop only at n − 1 = 4 kept edges. Only 2 are kept, and node 4 is not even reached.' },
            { text: 'Skip it: 0–1 (6) would be the better link', why: 'Edges come cheapest first. 1–2 (4) is the cheapest edge joining the two components, so it is safe.' },
          ],
          answer: 1,
        },
        solved: 'Union Find answers "same component?", not "seen before?". 1–2 joins two components, so it is kept: total 9.',
      },
    ],
  },

  {
    id: 'mst-prim',
    title: 'Grow one tree: pop the cheapest edge leaving it',
    steps: [
      {
        kind: 'watch',
        title: 'Adjacency lists, one tree',
        lines: ['Input as **adjacency lists**. Grow one tree from a start node.', 'The cheapest edge leaving the tree is always safe; scanning every edge for it each step is slow.'],
        frames: [
          {
            say: 1,
            note: 'e.g. n = 5, start at A. Cut = (tree) vs (the rest). A heap of candidate edges finds the cheapest in O(log m).',
            panels: [gp(PG, { st: { 0: 'active' }, label: 'start A' }), que(['0·A'], 'heap · w·node')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Pop, check, push',
        lines: ['`heap.push([0, start])`; the heap is keyed by the **edge weight** alone.', 'Pop `[w, u]`: `u` already in the tree → **stale**, skip.', 'Else mark `u` **on pop**, `total += w`, push `[wt, v]` for every neighbour not in the tree.'],
        frames: pFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **adjacency list / matrix input**, **"connect all nodes at minimum cost"**, **you already know Dijkstra: Prim has the same shape**.'],
        frames: [
          {
            say: 0,
            note: `count = n = 5 → total ${PR.ans}. Two entries popped stale. O(m log m); count < n → return -1.`,
            panels: [gp(PG, { es: ek(PR.tree, 'done'), st: hl([0, 1, 2, 3, 4], 'done'), label: `MST · total ${PR.ans}` }), vars({ time: 'O(m log m)', priority: 'edge weight, not dist + w' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: B is already in the heap',
        lines: ['A joined; the heap held [1, C] and [5, B]. Pop [1, C]: C joins.', 'C–B costs 3, but B already waits in the heap as [5, B].'],
        panels: [
          gp(PG, { st: { 0: 'done', 2: 'active', 1: 'visited' }, es: { ...ek(P_T.tree, 'done'), [key(2, 1)]: 'active' }, label: `total ${P_T.total} · 2 in tree` }),
          que(['5·B'], 'heap before C pushes'),
        ],
        task: {
          type: 'choose',
          question: 'What should happen with edge C–B (3)?',
          options: [
            { text: 'Push [3, B]; B joins when its first entry pops' },
            { text: 'Nothing: B was already pushed, so it is taken', why: 'That is marking on push: B would be locked in at 5. A cheaper edge to it arrived later.' },
            { text: 'Push [4, B]: total so far 1 plus 3', why: 'That is Dijkstra (dist + w). Prim\'s priority is the edge weight alone.' },
            { text: 'Delete [5, B] from the heap first', why: 'No deletion needed: [5, B] stays and is skipped as stale when it pops after B joined.' },
          ],
          answer: 0,
        },
        solved: '[3, B] pops before [5, B]: B joins via C–B for 3, and [5, B] later pops stale. Mark on pop, never on push.',
      },
    ],
  },

  {
    id: 'mst-prim-dense',
    title: 'Every pair connected: one minCost array, no edge list',
    steps: [
      {
        kind: 'watch',
        title: 'Points: all pairs are edges',
        lines: ['"Points", cost = Manhattan distance, **any two can be connected**.', 'Kruskal would build and sort ~n²/2 edges: O(n² log n) time, O(n²) memory.'],
        frames: [
          {
            say: 1,
            note: `e.g. 4 points: ${(DN * (DN - 1)) / 2} pairs, none stored. For 1,000 points it is ~500,000 edges to build and sort.`,
            panels: [gp(DG, { tag: dTag, label: 'e.g. 4 points' }), vars({ n: DN, pairs: (DN * (DN - 1)) / 2, 'n = 1000': '~500,000 edges' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Scan, add, relax',
        lines: ['`minCost[v]` = cheapest edge from the tree to v; `minCost[0] = 0`, the rest ∞.', 'Each round: **scan** the outside nodes for the smallest minCost, add it, `total += minCost[u]`.', '**Relax**: `minCost[v] = min(minCost[v], cost(u, v))` for every outside v.'],
        frames: dFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"points" with a distance formula**, **"any two points can be connected"**, **n ≤ 1000 with no edge list**.'],
        frames: [
          {
            say: 0,
            note: `total ${DP.total}. n rounds × O(n) scan + O(n) relax = O(n²) time, O(n) memory.`,
            panels: [gp(DG, { edges: dTree(DP.ev.at(-1).afterParent, DP.ev.at(-1).inTree), es: ek(dTree(DP.ev.at(-1).afterParent, DP.ev.at(-1).inTree), 'done'), st: hl([0, 1, 2, 3], 'done'), tag: dTag, label: `MST · total ${DP.total}` }), vars({ time: 'O(n²)', memory: 'O(n)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: round 2 scan',
        lines: ['Point 0 is in the tree. After relaxing from 0: minCost = [0, 4, 3, 7].'],
        panels: [dPanels(D_T, 'relax')[0], arr(D_T.after.map(f), { label: 'minCost', highlights: { 0: 'muted' } })],
        task: {
          type: 'choose',
          question: 'Which point does the round-2 scan pick?',
          options: [
            { text: 'Point 0: its minCost 0 is the smallest', why: 'Point 0 is already in the tree. Forgetting to skip in-tree nodes in the scan is wrong, not just wasteful.' },
            { text: 'Point 2: smallest minCost among the outside points (3)' },
            { text: 'Point 1: it is the next index', why: 'Order of indexes does not matter; the scan takes the smallest minCost: 3 < 4.' },
            { text: 'Point 3: the farthest point must be attached first', why: 'Prim always takes the cheapest crossing edge; point 3 costs 7 from the tree right now.' },
          ],
          answer: 1,
        },
        solved: 'The scan skips in-tree nodes: point 2 joins for 3, then relaxing from it lowers point 3 from 7 to 4.',
      },
    ],
  },

  {
    id: 'mst-virtual-node',
    title: 'Build a well or lay a pipe: wells become edges to node 0',
    steps: [
      {
        kind: 'watch',
        title: 'A well is not an edge',
        lines: ['Each house gets water from **its own well** (per-node cost) or **a pipe** (per-edge cost).', 'Greedy "one well at the cheapest house, pipes for the rest" can miss that two wells are cheaper.'],
        frames: [
          {
            say: 0,
            note: 'e.g. 4 houses, wells cost 3, 6, 2, 7; pipes 1–2 (2), 2–3 (4), 3–4 (3).',
            panels: [gp(houses, { st: { 0: 'hidden' }, tag: wellTag, label: 'houses 1..4' })],
          },
          {
            say: 1,
            note: `Greedy: one well at house ${V_CHEAP} (2) + all three pipes (${V_PIPE_TOTAL}) = ${V_GREEDY}.`,
            panels: [gp(houses, { st: { 0: 'hidden', [V_CHEAP]: 'active' }, es: ek(PIPES, 'done'), tag: wellTag, label: `greedy · ${V_GREEDY}` })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Add node 0, run Kruskal',
        lines: ['Invent a source **node 0**: well at house i = edge 0–i with weight `wells[i]`.', 'Now n + 1 = 5 nodes: `kruskal(n + 1, all)`, stop at n = 4 edges.', 'Kruskal compares wells and pipes on equal terms.'],
        frames: [
          { say: 0, note: 'Edges 0–1 (3), 0–2 (6), 0–3 (2), 0–4 (7) join the pipes. Sorted, ties in input order.', panels: [gp(VG, { st: { 0: 'active' }, label: 'n + 1 = 5 nodes' }), sortedTable(VG, VR, -1)] },
          ...vFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **per-node cost AND per-edge cost in the same problem**, **"supply every house"**, **"build a well OR lay a pipe"**.'],
        frames: [
          {
            say: 0,
            note: `Total ${VR.ans} < ${V_GREEDY}: wells at houses ${V_WELLS.join(' and ')}, pipes 1–2 and 3–4. Two wells beat one.`,
            panels: [gp(VG, { edges: VR.tree, es: ek(VR.tree, 'done'), st: hl([0, 1, 2, 3, 4], 'done'), label: `MST · total ${VR.ans}` }), vars({ wells: `houses ${V_WELLS.join(', ')}`, total: VR.ans, greedy: V_GREEDY })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: size the UnionFind',
        lines: ['Houses are 1..4, the virtual source is node 0.'],
        panels: [gp(VG, { st: { 0: 'active' }, label: 'houses + node 0' })],
        task: {
          type: 'choose',
          question: 'Which UnionFind and stop rule does Kruskal need here?',
          options: [
            { text: 'UnionFind(4), stop at 3 edges', why: 'That counts houses only: node 4 has no slot, and 3 edges cannot connect 5 nodes.' },
            { text: 'UnionFind(5), stop at 4 edges' },
            { text: 'UnionFind(5), stop at 5 edges', why: 'A spanning tree on 5 nodes has exactly 4 edges; it is done after n = 4.' },
            { text: 'UnionFind(4), skip the node-0 edges', why: 'The node-0 edges are the wells. Without them nobody gets water.' },
          ],
          answer: 1,
        },
        solved: 'With node 0 the graph has n + 1 nodes: UnionFind(n + 1), and the tree is complete after n edges.',
      },
    ],
  },

  {
    id: 'mst-edge-classification',
    title: 'Ban it, force it: which edges every MST needs',
    steps: [
      {
        kind: 'watch',
        title: 'Ties make many MSTs',
        lines: ['With tied weights a graph has several MSTs of the same total.', '"Is it in **my** MST?" does not tell whether an edge is in all, some or no MSTs.'],
        frames: [
          {
            say: 1,
            note: `e.g. n = 4, edges pre-sorted. My Kruskal MST: 0–1, 1–2, 2–3, best = ${BEST.total}. 0–2 was skipped.`,
            panels: [gp(CG, { es: { ...ek(BEST.tree, 'done'), '0-2': 'muted' }, label: `my MST · ${BEST.total}` })],
          },
          {
            say: 0,
            note: `0–1, 0–2, 2–3 also weighs ${CLS[1].s.total}. 0–2 is in an MST after all; 1–2 is not in every one.`,
            panels: [gp(CG, { es: { ...ek(OTHER, 'done'), '1-2': 'muted' }, label: `another MST · ${CLS[1].s.total}` })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'mstWith(skip, force)',
        lines: ['Critical: `mstWith(skip = i) > best` (a disconnected run counts as Infinity).', 'Else pseudo-critical: `mstWith(force = i) === best`.', 'Else the edge is in no MST.'],
        frames: [cFrame(0, [0], 0), cFrame(2, [0, 2], 1), cFrame(3, [0, 2, 3], 0), cFrame(4, [0, 2, 3, 4], 2)],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"is the MST unique"**, **"edges whose removal increases the MST weight"**, **"appears in some but not all MSTs"**, **"second minimum spanning tree"**.'],
        frames: [
          {
            say: 0,
            note: 'One Kruskal re-run per edge: O(m · m α(n)). Fine for m up to a few hundred.',
            panels: [clsTable([0, 2, 3, 4]), vars({ 'per edge': 'skip run + force run', time: 'O(m · m α(n))' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: edge 1–2',
        lines: ['1–2 (2) is in my MST. Skipping it, Kruskal takes 0–2 (2) instead.'],
        panels: [gp(CG, { es: { ...ek(BEST.tree, 'done'), '1-2': 'active' }, label: `my MST · ${BEST.total}` }), clsTable([0, 2, 3, 4], 1)],
        task: {
          type: 'choose',
          question: 'How is edge 1–2 classified?',
          options: [
            { text: 'Critical: it is in my MST', why: '"In my MST" is the trap. Skip it and the MST still weighs 6, so no MST needs it.' },
            { text: 'Pseudo-critical: skip → 6, force → 6' },
            { text: 'In no MST: 0–2 replaces it', why: 'Forcing 1–2 still gives 6 (it is in my MST), so it belongs to some MST.' },
            { text: 'Critical: skipping it disconnects the graph', why: 'Without 1–2, 0–2 still links 2 to the rest. The run gives 6, not Infinity.' },
          ],
          answer: 1,
        },
        solved: 'Skip 1–2 → 6 = best, so not critical; force it → 6, so pseudo-critical. Its tie 0–2 is pseudo-critical too.',
        then: [cFrame(1, [0, 1, 2, 3, 4], 0)],
      },
    ],
  },
];
