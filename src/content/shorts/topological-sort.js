// Shorts for Topological Sort (M9). Format: src/content/shortSchema.js. Facts come only from
// topics/topological-sort/topic.js. Every degree, in-degree, queue, colour, post-order, leaf layer and finish time
// below comes from running the pattern's template on its own "e.g." graph; check() throws on drift.
// Edge [u, v] always means u → v, "u before v".
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const stk = (values, label) => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const list = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/topological-sort.js: ${msg}`);
};

// pos: [x, y] per vertex. o.st: vertex → state, o.es: 'u-v' → edge state, o.undirected, o.label
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.undirected ? {} : { directed: true }),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v]) => {
    const s = o.es?.[`${u}-${v}`] ?? (o.undirected ? o.es?.[`${v}-${u}`] : undefined);
    return { from: u, to: v, ...(s ? { state: s } : {}) };
  }),
});
const adjOf = (n, edges) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  return adj;
};

// ---------- the pattern's Kahn template, one snapshot per pop ----------
function kahn(n, edges) {
  const adj = adjOf(n, edges);
  const indeg = new Array(n).fill(0);
  for (const [, v] of edges) indeg[v]++;
  const start = indeg.slice();
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const seeds = queue.slice();
  const pops = [];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const decs = [];
    const pushed = [];
    for (const v of adj[u]) {
      decs.push(`${v}: ${indeg[v]}→${indeg[v] - 1}`);
      if (--indeg[v] === 0) {
        queue.push(v);
        pushed.push(v);
      }
    }
    pops.push({ u, head, decs, pushed, touched: adj[u], indeg: indeg.slice(), queue: queue.slice() });
  }
  return { start, seeds, pops, queue, order: queue.length === n ? queue : [] };
}

// ================= 1. degree counting: town judge, e.g. n = 4 =================
const J_N = 4;
const J_E = [
  [0, 2],
  [1, 2],
  [3, 2],
  [1, 0],
];
const J_POS = [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2],
];
const jFrames = [];
const J_IN = new Array(J_N).fill(0);
const J_OUT = new Array(J_N).fill(0);
const jTable = (st) => table(['in', 'out'], ['0', '1', '2', '3'], [J_IN.slice(), J_OUT.slice()], st);
for (const [u, v] of J_E) {
  J_OUT[u]++;
  J_IN[v]++;
  const st = [hl(J_N, (k) => (k === v ? 'active' : '')), hl(J_N, (k) => (k === u ? 'active' : ''))].map((r) => Array.from({ length: J_N }, (_, k) => r[k] || ''));
  jFrames.push({ say: 1, note: `[${u}, ${v}]: ${u} trusts ${v}. outdeg[${u}]++ → ${J_OUT[u]}, indeg[${v}]++ → ${J_IN[v]}.`, panels: [gp(J_N, J_E, J_POS, { st: { [u]: 'visited', [v]: 'active' }, es: { [`${u}-${v}`]: 'active' } }), jTable(st)] });
}
const JUDGE = J_IN.findIndex((d, i) => d === J_N - 1 && J_OUT[i] === 0);
check(JUDGE === 2 && J_IN.filter((d, i) => d === J_N - 1 && J_OUT[i] === 0).length === 1, 'the judge is 2');
jFrames.push({
  say: 2,
  note: `Read the columns: indeg[2] = ${J_IN[2]} = n − 1 and outdeg[2] = 0. Vertex 2 is the judge. No traversal.`,
  panels: [gp(J_N, J_E, J_POS, { st: { 2: 'done' } }), jTable([Array.from({ length: J_N }, (_, k) => (k === 2 ? 'done' : '')), Array.from({ length: J_N }, (_, k) => (k === 2 ? 'done' : ''))])],
});
// the turn: e.g. n = 3, 0 → 2, 1 → 2, 2 → 0
const T_E = [
  [0, 2],
  [1, 2],
  [2, 0],
];
const T_POS = [
  [0, 0],
  [2, 0],
  [1, 1],
];
const T_IN = [0, 0, 0];
const T_OUT = [0, 0, 0];
for (const [u, v] of T_E) {
  T_OUT[u]++;
  T_IN[v]++;
}
const T_SCORE = T_IN.map((d, i) => d - T_OUT[i]);
check(T_IN[2] === 2 && T_OUT[2] === 1 && !T_SCORE.includes(3 - 1), 'no judge in the turn graph');

// ================= 2. Kahn: build order, e.g. n = 6 =================
const K_N = 6;
const K_E = [
  [3, 0],
  [3, 1],
  [0, 2],
  [1, 2],
  [4, 1],
  [2, 5],
];
const K_POS = [
  [1.3, 0],
  [1.3, 1.5],
  [2.6, 0.75],
  [0, 0],
  [0, 1.5],
  [3.9, 0.75],
];
const K = kahn(K_N, K_E);
check(seq(K.order) === '3, 4, 0, 1, 2, 5', 'Kahn order');
check(seq(K.seeds) === '3, 4', 'two seeds');
const kPanels = (done, cur, ready, indeg, queue, order, touched = []) => [
  gp(K_N, K_E, K_POS, { st: { ...states(done, 'muted'), ...states(ready, 'visited'), ...(cur !== null ? { [cur]: 'active' } : {}) }, es: Object.fromEntries(touched.map((v) => [`${cur}-${v}`, 'active'])) }),
  arr(indeg, { label: 'indeg', highlights: hl(K_N, (k) => (touched.includes(k) ? 'active' : '')) }),
  que(queue),
  arr(order.length ? order : ['·'], { label: 'order', highlights: order.length ? { [order.length - 1]: 'done' } : {} }),
];
const kFrames = [
  { say: 0, note: `Count prerequisites: indeg = ${list(K.start)}. Seed the queue with every 0: ${seq(K.seeds)}.`, panels: kPanels([], null, K.seeds, K.start, K.seeds, []) },
  ...K.pops.map((p) => {
    const order = K.queue.slice(0, p.head + 1);
    const waiting = p.queue.slice(p.head + 1);
    return {
      say: 1,
      note: `Pop ${p.u}. ${p.decs.length ? `${p.decs.join(', ')}.` : 'No outgoing edges.'} ${p.pushed.length ? `Push ${seq(p.pushed)}: ready.` : 'Nothing new is ready.'}`,
      panels: kPanels(order.slice(0, -1), p.u, waiting, p.indeg, waiting, order, p.touched),
    };
  }),
];
kFrames[kFrames.length - 1].note += ` ${K.order.length} = n: valid order.`;
// the turn: add 2 → 0, which closes the cycle 0 → 2 → 0
const KC_E = [...K_E, [2, 0]];
const KC = kahn(K_N, KC_E);
check(seq(KC.queue) === '3, 4, 1' && KC.order.length === 0, 'cycle stops Kahn after 3 vertices');

// ================= 3. DFS three colours, e.g. n = 5 with a diamond into 2 =================
const D_N = 5;
const D_E = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 2],
  [2, 4],
];
const D_POS = [
  [0, 0.75],
  [1.3, 0],
  [2.6, 0.75],
  [1.3, 1.5],
  [3.9, 0],
];
// the pattern's topoDfs, recording an event at every colour change and every edge to a non-white vertex
function topoDfs(n, edges) {
  const adj = adjOf(n, edges);
  const color = new Uint8Array(n);
  const post = [];
  const path = [];
  const ev = [];
  let hasCycle = false;
  const snap = (what, u, v) => ev.push({ what, u, v, color: [...color], post: post.slice(), path: path.slice() });
  const dfs = (u) => {
    color[u] = 1;
    path.push(u);
    snap('enter', u);
    for (const v of adj[u]) {
      if (color[v] === 1) {
        hasCycle = true;
        snap('gray', u, v);
        return;
      }
      if (color[v] === 2) snap('black', u, v);
      if (color[v] === 0) {
        dfs(v);
        if (hasCycle) return;
      }
    }
    color[u] = 2;
    path.pop();
    post.push(u);
    snap('finish', u);
  };
  for (let i = 0; i < n && !hasCycle; i++) if (color[i] === 0) dfs(i);
  return { ev, hasCycle, order: hasCycle ? [] : post.slice().reverse() };
}
const D = topoDfs(D_N, D_E);
check(!D.hasCycle && seq(D.order) === '0, 3, 1, 2, 4', 'DFS order');
const dPanels = (e, extra = {}) =>
  [
    gp(D_N, extra.edges || D_E, D_POS, { st: Object.fromEntries(e.color.map((c, i) => [i, c === 1 ? 'active' : c === 2 ? 'done' : ''])), es: extra.es }),
    stk(e.path, 'gray = on the path'),
    arr(e.post.length ? e.post : ['·'], { label: 'post-order' }),
  ];
const at = (what, u) => D.ev.find((e) => e.what === what && e.u === u);
const deep = at('enter', 4);
const fin1 = at('finish', 1);
const meet = at('black', 3);
const fin0 = at('finish', 0);
check(seq(deep.path) === '0, 1, 2, 4' && seq(fin1.post) === '4, 2, 1' && meet.v === 2 && seq(fin0.post) === '4, 2, 1, 3, 0', 'DFS events');
const dFrames = [
  { say: 0, note: `Enter 0, 1, 2, 4: each turns gray on entry. Gray = the open calls = the path ${seq(deep.path)}.`, panels: dPanels(deep, { es: { '0-1': 'active', '1-2': 'active', '2-4': 'active' } }) },
  { say: 1, note: `4 has no edges: black, post 4. Then 2 and 1 finish too. post = ${list(fin1.post)}.`, panels: dPanels(fin1) },
  { say: 2, note: 'Enter 3; its edge 3 → 2 meets a BLACK vertex: finished, off the path. A diamond, not a cycle.', panels: dPanels(meet, { es: { '3-2': 'active' } }) },
  { say: 1, note: `3 and 0 finish. post = ${list(fin0.post)}: every vertex after all that depend on it.`, panels: dPanels(fin0) },
  { say: 3, note: `Reverse it: ${seq(D.order)}. Every edge now points forward.`, panels: [gp(D_N, D_E, D_POS, { st: states([0, 1, 2, 3, 4], 'done') }), arr(D.order, { label: 'topological order' })] },
];
// the turn: add 4 → 1
const DC_E = [...D_E, [4, 1]];
const DC = topoDfs(D_N, DC_E);
const dcHit = DC.ev.find((e) => e.what === 'gray');
check(DC.hasCycle && dcHit.u === 4 && dcHit.v === 1 && seq(dcHit.path) === '0, 1, 2, 4' && DC.order.length === 0, 'back edge 4 → 1');
const dcBefore = DC.ev[DC.ev.indexOf(dcHit) - 1];

// ================= 4. leaf trimming: e.g. a 7-vertex tree =================
function centers(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const deg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
    deg[u]++;
    deg[v]++;
  }
  const rounds = [];
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
  rounds.push({ leaves: leaves.slice(), deg: deg.slice(), remaining: n });
  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;
    const next = [];
    for (const leaf of leaves) for (const nb of adj[leaf]) if (--deg[nb] === 1) next.push(nb);
    leaves = next;
    rounds.push({ leaves: leaves.slice(), deg: deg.slice(), remaining });
  }
  return { centers: leaves, rounds, adj };
}
const height = (adj, root) => {
  const dist = new Array(adj.length).fill(-1);
  dist[root] = 0;
  const q = [root];
  for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (dist[v] < 0) q.push(v), (dist[v] = dist[q[h]] + 1);
  return Math.max(...dist);
};
const L_N = 7;
const L_E = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [2, 5],
  [5, 6],
];
const L_POS = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [2, 1],
  [2, 2],
];
const L = centers(L_N, L_E);
const L_H = Array.from({ length: L_N }, (_, r) => height(L.adj, r));
check(seq(L.centers) === '2' && L.rounds.length === 3 && Math.min(...L_H) === L_H[2] && L_H.filter((h) => h === L_H[2]).length === 1, 'center is 2');
check(seq(L.rounds[0].leaves) === '0, 4, 6' && seq(L.rounds[1].leaves) === '1, 3, 5', 'leaf layers');
const lPanels = (removed, leaves, done, deg, remaining) => [
  gp(L_N, L_E, L_POS, { undirected: true, st: { ...states(removed, 'muted'), ...states(leaves, 'active'), ...states(done, 'done') }, es: Object.fromEntries(L_E.filter(([u, v]) => removed.includes(u) || removed.includes(v)).map(([u, v]) => [`${u}-${v}`, 'muted'])) }),
  arr(deg, { label: 'deg', highlights: hl(L_N, (k) => (leaves.includes(k) ? 'active' : removed.includes(k) ? 'muted' : '')) }),
  vars({ remaining }),
];
const [R0, R1, R2] = L.rounds;
const lFrames = [
  { say: 0, note: `Leaves = degree 1: ${seq(R0.leaves)}. Each sits at the very edge, a bad root.`, panels: lPanels([], R0.leaves, [], R0.deg, R0.remaining) },
  { say: 1, note: `Remove all of them at once. Neighbours drop to degree 1: new leaves ${seq(R1.leaves)}.`, panels: lPanels(R0.leaves, R1.leaves, [], R1.deg, R1.remaining) },
  { say: 1, note: `Peel ${seq(R1.leaves)}. 2 drops to degree 1 and becomes the next layer.`, panels: lPanels([...R0.leaves, ...R1.leaves], [], R2.leaves, R2.deg, R2.remaining) },
  { say: 2, note: `remaining = ${R2.remaining} ≤ 2: stop. Center: ${seq(L.centers)}, the middle of the longest path 0–1–2–3–4.`, panels: [gp(L_N, L_E, L_POS, { undirected: true, st: { ...states([...R0.leaves, ...R1.leaves], 'muted'), 2: 'done' } }), arr(L_H, { label: 'height if root', highlights: { 2: 'done' } })] },
];
// the turn: e.g. the path 0–1–2–3–4–5
const P_E = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
];
const P_POS = Array.from({ length: 6 }, (_, i) => [i, 0]);
const P = centers(6, P_E);
const P_H = Array.from({ length: 6 }, (_, r) => height(P.adj, r));
check(seq(P.centers) === '2, 3' && P_H[2] === 3 && P_H[3] === 3 && Math.min(...P_H) === 3, 'path has two centers');
const pBefore = P.rounds[P.rounds.length - 2];
check(P.rounds.length === 3 && seq(pBefore.leaves) === '1, 4', 'path peels 0,5 then 1,4');

// ================= 5. DP along the order: parallel courses, e.g. n = 5 =================
const C_N = 5;
const C_T = [2, 3, 1, 4, 2];
const C_E = [
  [0, 2],
  [3, 2],
  [3, 1],
  [2, 4],
  [1, 4],
];
const C_POS = [
  [0, 0],
  [1.3, 1.5],
  [1.3, 0],
  [0, 1.5],
  [2.6, 0.75],
];
// the pattern's template: relax edges in Kahn order
function minimumTime(n, edges, time) {
  const adj = adjOf(n, edges);
  const indeg = new Array(n).fill(0);
  for (const [, v] of edges) indeg[v]++;
  const finish = time.slice();
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const pops = [];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const rel = [];
    for (const v of adj[u]) {
      const before = finish[v];
      finish[v] = Math.max(finish[v], finish[u] + time[v]);
      rel.push({ v, before, after: finish[v] });
      if (--indeg[v] === 0) queue.push(v);
    }
    pops.push({ u, head, rel, finish: finish.slice(), queue: queue.slice() });
  }
  return { pops, finish, answer: Math.max(...finish) };
}
const C = minimumTime(C_N, C_E, C_T);
check(C.answer === 9 && seq(C.pops.map((p) => p.u)) === '0, 3, 2, 1, 4', 'answer 9 in Kahn order');
// the wasteful / wrong ways
const C_SUM = C_T.reduce((a, b) => a + b, 0);
const idx = C_T.slice();
for (let u = 0; u < C_N; u++) for (const v of adjOf(C_N, C_E)[u]) idx[v] = Math.max(idx[v], idx[u] + C_T[v]);
check(C_SUM === 12 && Math.max(...idx) === 7 && idx[4] === 5, 'index order is stale');
const cPanels = (done, cur, rel, finish, queue) => [
  gp(C_N, C_E, C_POS, { st: { ...states(done, 'muted'), ...(cur !== null ? { [cur]: 'active' } : {}) }, es: Object.fromEntries(rel.map((v) => [`${cur}-${v}`, 'active'])) }),
  arr(C_T, { label: 'time' }),
  arr(finish, { label: 'finish', highlights: hl(C_N, (k) => (rel.includes(k) ? 'active' : '')) }),
  que(queue),
];
const cSeeds = [0, 3];
const cFrames = [
  { say: 0, note: `finish = time to start with. Kahn seeds the queue with ${seq(cSeeds)}: no prerequisites.`, panels: cPanels([], null, [], C_T, cSeeds) },
  ...C.pops.map((p) => ({
    say: 1,
    note: `Pop ${p.u} (finish ${p.finish[p.u]}). ${p.rel.map((r) => `${r.v}: max(${r.before}, ${p.finish[p.u]}+${C_T[r.v]}) = ${r.after}`).join('; ') || 'No outgoing edges'}.`,
    panels: cPanels(C.pops.slice(0, p.head).map((q) => q.u), p.u, p.rel.map((r) => r.v), p.finish, p.queue.slice(p.head + 1)),
  })),
];
check(cFrames[1].panels[3].values.length === 1 && seq(C.pops[0].queue) === '0, 3', 'seeds are 0 and 3');
const c2 = C.pops.find((p) => p.rel.some((r) => r.v === 2) && p.u === 3).rel.find((r) => r.v === 2);
check(c2.after === 5 && C.finish[2] === 5, 'finish[2] = max(2, 4) + 1');

export default [
  {
    id: 'topo-degree-counting',
    title: 'Find the judge by counting arrows, not walking them',
    steps: [
      {
        kind: 'watch',
        title: 'Who does everyone trust?',
        lines: ['`[a, b]` means "a trusts b": the edge **a → b**.', 'The judge: **everyone** points to it and it points to **no one**.'],
        frames: [
          { say: 0, note: 'e.g. n = 4 and trust pairs [0,2], [1,2], [3,2], [1,0]. Who is the judge?', panels: [gp(J_N, J_E, J_POS)] },
          { say: 1, note: 'Checking each person by re-reading every pair: 4 candidates × 4 pairs, e.g. 16 reads.', panels: [gp(J_N, J_E, J_POS, { st: { 0: 'visited' } }), vars({ candidates: J_N, 'pairs each': J_E.length, reads: J_N * J_E.length })] },
        ],
      },
      {
        kind: 'watch',
        title: 'One pass, two counters',
        lines: ['`indeg[v]` = arrows into v, `outdeg[u]` = arrows out of u.', 'For each `[u, v]`: `outdeg[u]++`, `indeg[v]++`.', 'The judge has indeg = n − 1 and outdeg = 0.'],
        frames: jFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"trusts"**, **"everybody … nobody"**, **"celebrity / judge"**, **"no incoming edges"**, **"no outgoing edges"**.'],
        frames: [{ say: 0, note: 'Roles defined by counts alone: one O(n + m) pass beats any traversal.', panels: [vars({ count: 'O(n + m)', source: 'indeg 0', sink: 'outdeg 0' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: trusted by all',
        lines: ['e.g. n = 3, trust pairs [0,2], [1,2], [2,0].', 'Vertex 2 is trusted by both others.'],
        panels: [gp(3, T_E, T_POS), table(['in', 'out'], ['0', '1', '2'], [T_IN, T_OUT])],
        task: {
          type: 'choose',
          question: 'Is vertex 2 the judge?',
          options: [
            { text: 'No: indeg = n − 1, but outdeg is 1; the judge trusts no one' },
            { text: 'Yes: indeg[2] = 2 = n − 1', why: 'That is half the rule. The judge also points to no one: outdeg must be 0.' },
            { text: 'Yes: it has the highest in-degree', why: 'Highest is not the rule; the judge needs exactly n − 1 in and 0 out.' },
            { text: 'Cannot tell without a BFS from 2', why: 'The role is defined purely by the two counts; no traversal is needed.' },
          ],
          answer: 0,
        },
        solved: 'Count both directions: the judge is **indeg n − 1 and outdeg 0**.',
        then: [{ note: `Net score indeg − outdeg = ${list(T_SCORE)}. No vertex scores n − 1 = 2: no judge here.`, panels: [gp(3, T_E, T_POS, { st: { 2: 'bad' }, es: { '2-0': 'bad' } }), arr(T_SCORE, { label: 'indeg − outdeg' })] }],
      },
    ],
  },

  {
    id: 'topo-kahn-indegree',
    title: 'Schedule tasks by peeling off the ready ones',
    steps: [
      {
        kind: 'watch',
        title: 'Scanning for a ready task, every round',
        lines: ['Edge u → v: "u must come before v".', 'Scanning all vertices for one with no pending prerequisites, n times: **O(n · (n + m))**.'],
        frames: [
          { say: 0, note: 'e.g. 6 build steps. 3 → 0 means 3 must be built before 0. Which can go first?', panels: [gp(K_N, K_E, K_POS)] },
          { say: 1, note: 'The scan finds 3, then re-checks every vertex to find the next one, from scratch each round.', panels: [gp(K_N, K_E, K_POS, { st: { 3: 'done', 0: 'visited', 1: 'visited', 2: 'visited', 4: 'visited', 5: 'visited' } }), vars({ 'per round': 'O(n + m)', rounds: 'n' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Count what is left, queue what is ready',
        lines: ['`indeg[v]` = prerequisites v still waits for. Push every 0 into a queue.', 'Pop u, append it. For each v in adj[u]: `indeg[v]--`; at 0, push v.'],
        frames: kFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"prerequisites"**, **"must be taken before"**, **"dependencies"**, **"build order"**, **"is it possible to finish all"**, **"any valid order"**.'],
        frames: [{ say: 0, note: 'Finishing u touches only its own edges: each edge is decremented once, O(V + E).', panels: [vars({ scan: 'O(n · (n + m))', Kahn: 'O(V + E)', edges: K_E.length, decrements: K_E.length })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: one more rule',
        lines: ['Same steps, plus a new rule **2 → 0**.', `Kahn pops ${seq(KC.queue)} and then the queue is empty.`],
        panels: [gp(K_N, KC_E, K_POS, { st: states(KC.queue, 'done'), es: { '2-0': 'bad' } }), arr(KC.pops[KC.pops.length - 1].indeg, { label: 'indeg' }), que([])],
        task: {
          type: 'choose',
          question: 'What do you return?',
          options: [
            { text: '[]: only 3 of 6 were processed, so there is a cycle' },
            { text: `[${seq(KC.queue)}], the order found so far`, why: 'Forgetting the count check: Kahn silently returns a partial order. Compare its length with n.' },
            { text: 'Restart from another seed: it may get further', why: 'The start choice does not matter: Kahn fails exactly when there is a cycle.' },
            { text: '[] and report 0, 2 and 5 as the cycle', why: 'Leftovers are on a cycle OR downstream of one: 5 only waits for 2.' },
          ],
          answer: 0,
        },
        solved: 'Processed **fewer than n** ⟺ a cycle: 0 and 2 wait on each other forever.',
      },
    ],
  },

  {
    id: 'topo-dfs-three-color',
    title: 'Gray means "on my path": catch cycles, not diamonds',
    steps: [
      {
        kind: 'watch',
        title: 'One visited flag cannot tell',
        lines: ['DFS meets an already visited vertex. Cycle, or just a second route?', 'A single visited boolean cannot tell these apart.'],
        frames: [
          { say: 0, note: 'e.g. 0 → 1 → 2 and 0 → 3 → 2: two routes into 2, then 2 → 4. A DAG.', panels: [gp(D_N, D_E, D_POS)] },
          { say: 1, note: 'From 3, DFS sees 2 again. "visited = true" would cry cycle on a harmless diamond.', panels: [gp(D_N, D_E, D_POS, { st: { 0: 'visited', 1: 'visited', 2: 'bad', 3: 'visited', 4: 'visited' }, es: { '3-2': 'bad' } }), vars({ visited: 'true for 2', verdict: 'cycle? wrong' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'White, gray, black',
        lines: ['On entry colour u **gray**: gray vertices are the calls still open.', 'After all neighbours, colour u **black** and append it to post-order.', 'Meeting black is fine; meeting **gray** is a back edge: a cycle.', 'Reverse the post-order: a topological order.'],
        frames: dFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"cycle in a directed graph"**, **"safe / terminal / eventually"**, **"deadlock"**, **"longest path" on a DAG with memo**.'],
        frames: [{ say: 0, note: 'Each vertex turns gray and black once; each edge is examined once: O(V + E).', panels: [vars({ white: 'not visited', gray: 'on the path', black: 'finished' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: an edge back',
        lines: ['Same graph plus the edge **4 → 1**.', `DFS has entered ${seq(dcBefore.path)}; now 4 looks at 1.`],
        panels: [...dPanels(dcBefore, { edges: DC_E, es: { '4-1': 'bad' } }).slice(0, 2)],
        task: {
          type: 'choose',
          question: 'What does the edge 4 → 1 mean here?',
          options: [
            { text: '1 is gray, on the current path: a back edge, so a cycle 1 → 2 → 4 → 1' },
            { text: '1 is black: a second route, like 3 → 2', why: 'dfs(1) is still open (1 is on the path stack), so 1 is gray, not black.' },
            { text: 'Nothing yet: wait for post-order and check it', why: 'Gray-again is proof on the spot: a path 1 ⇝ 4 plus the edge 4 → 1.' },
            { text: 'It is fine because 1 was visited first', why: 'Visited is not the question; on-the-path is. That is why there are three colours.' },
          ],
          answer: 0,
        },
        solved: 'Meeting **gray** = a back edge = a directed cycle; meeting **black** is harmless.',
        then: [{ note: 'topoDfs stops and returns []: no topological order exists.', panels: [gp(D_N, DC_E, D_POS, { st: states(dcHit.path, 'bad'), es: { '1-2': 'bad', '2-4': 'bad', '4-1': 'bad' } }), vars({ hasCycle: true, result: '[]' })] }],
      },
    ],
  },

  {
    id: 'topo-leaf-trimming',
    title: 'Peel the leaves to find the best root of a tree',
    steps: [
      {
        kind: 'watch',
        title: 'A BFS from every root',
        lines: ['Pick the root of an undirected tree that gives the **smallest height**.', 'Brute force: BFS from every vertex and measure the height, **O(n²)**.'],
        frames: [
          { say: 0, note: 'e.g. a tree of 7 vertices. Which root makes it the shortest?', panels: [gp(L_N, L_E, L_POS, { undirected: true })] },
          { say: 1, note: `One BFS per vertex: heights ${seq(L_H)}. Root 2 wins, after ${L_N} full BFS runs.`, panels: [gp(L_N, L_E, L_POS, { undirected: true, st: { 2: 'done' } }), arr(L_H, { label: 'height if root', highlights: { 2: 'done' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Peel layer by layer',
        lines: ['Leaves (degree 1) play the role of in-degree-0 vertices.', 'Remove **all** current leaves at once; neighbours whose degree drops to 1 are the next layer.', 'Stop when at most **2** vertices remain: they are the centers.'],
        frames: lFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"minimum height trees"**, **"center of the tree"**, **"root that minimises height"**, **"remove leaves repeatedly"**.'],
        frames: [{ say: 0, note: 'Each round removes both ends of the longest path; the survivors are its middle.', panels: [vars({ 'BFS from all': 'O(n²)', 'per round': 'longest path − 2' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: an even path',
        lines: ['e.g. the path 0–1–2–3–4–5.', `Two rounds peel 0, 5 then ${seq(pBefore.leaves)}. Left: ${seq(P.centers)}, remaining = 2.`],
        panels: [gp(6, P_E, P_POS, { undirected: true, st: { 0: 'muted', 5: 'muted', 1: 'muted', 4: 'muted', 2: 'active', 3: 'active' } }), vars({ remaining: 2 })],
        task: {
          type: 'choose',
          question: 'What does the algorithm do now?',
          options: [
            { text: 'Stop and return both 2 and 3: the longest path has an even count, its middle is an edge' },
            { text: 'Peel once more: 2 and 3 are both leaves now', why: 'That would remove both true answers. Stopping only at remaining === 1 is a listed mistake.' },
            { text: 'Return the smaller id, 2', why: 'Both give the same minimum height; the answer is both centers.' },
            { text: 'BFS from 2 and 3 to break the tie', why: 'There is no tie to break: leaf trimming is exact and both are centers.' },
          ],
          answer: 0,
        },
        solved: 'Stop at **≤ 2** remaining: an even-length longest path has **two** centers.',
        then: [{ note: `Check with BFS: heights ${seq(P_H)}. Roots 2 and 3 both give ${P_H[2]}, the minimum.`, panels: [gp(6, P_E, P_POS, { undirected: true, st: { 2: 'done', 3: 'done' } }), arr(P_H, { label: 'height if root', highlights: { 2: 'done', 3: 'done' } })] }],
      },
    ],
  },

  {
    id: 'topo-dag-dp',
    title: 'Earliest finish: push values forward in topological order',
    steps: [
      {
        kind: 'watch',
        title: 'Two ways to get it wrong',
        lines: ['Courses take `time[v]` months; any number can run in parallel.', 'v starts only when **all** its prerequisites are done.'],
        frames: [
          { say: 0, note: `e.g. time = ${list(C_T)}. Adding all of it, ${C_SUM}, assumes one course at a time.`, panels: [gp(C_N, C_E, C_POS), arr(C_T, { label: 'time' }), vars({ sum: C_SUM })] },
          { say: 1, note: `Relaxing in index order: 4 reads finish[1] before 3 → 1 made it final. max = ${Math.max(...idx)}: stale.`, panels: [gp(C_N, C_E, C_POS, { st: { 1: 'bad', 4: 'bad' }, es: { '3-1': 'bad' } }), arr(idx, { label: 'finish, index order', highlights: { 1: 'bad', 4: 'bad' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Relax edges in Kahn order',
        lines: ['In topological order, every predecessor of v is final before v.', 'Along each edge u → v: `finish[v] = max(finish[v], finish[u] + time[v])`.', 'The answer is `max(finish)`.'],
        frames: [...cFrames, { say: 2, note: `Every value is final: max(finish) = ${C.answer}, the critical path 3 → 1 → 4.`, panels: [gp(C_N, C_E, C_POS, { st: { 3: 'done', 1: 'done', 4: 'done' }, es: { '3-1': 'active', '1-4': 'active' } }), arr(C.finish, { label: 'finish', highlights: { 4: 'done' } })] }],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"minimum time to complete all courses"** with durations, **"all ancestors"**, **"longest increasing path"**, strictly increasing moves.'],
        frames: [{ say: 0, note: 'Longest path is NP-hard with cycles; on a DAG, one pass in topological order: O(V + E).', panels: [vars({ 'general graph': 'NP-hard', DAG: 'O(V + E)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: two prerequisites',
        lines: [`Course 2 (time ${C_T[2]}) needs 0 (finish ${C.finish[0]}) and 3 (finish ${C.finish[3]}).`, 'Both edges into 2 have been relaxed.'],
        panels: [gp(C_N, C_E, C_POS, { st: { 2: 'active' }, es: { '0-2': 'active', '3-2': 'active' } }), arr(C_T, { label: 'time' })],
        task: {
          type: 'choose',
          question: 'What is finish[2]?',
          options: [
            { text: `${c2.after} = max(${C.finish[0]}, ${C.finish[3]}) + ${C_T[2]}: it waits for the slower prerequisite` },
            { text: `${Math.min(C.finish[0], C.finish[3]) + C_T[2]} = min(${C.finish[0]}, ${C.finish[3]}) + ${C_T[2]}`, why: 'All prerequisites must finish, so the slowest one decides: max, not min.' },
            { text: 'Whichever predecessor was popped last', why: 'Overwriting is wrong; max over all incoming edges makes the order of pops irrelevant.' },
            { text: `${C.finish[0] + C.finish[3] + C_T[2]} = ${C.finish[0]} + ${C.finish[3]} + ${C_T[2]}`, why: '0 and 3 run in parallel; only the longest chain into 2 counts.' },
          ],
          answer: 0,
        },
        solved: 'finish[v] takes the **max** over predecessors, and the order guarantees each one is final.',
      },
    ],
  },
];
