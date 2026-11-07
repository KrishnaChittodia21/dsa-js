// Step lessons for Topological Sort (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every in-degree, queue, order, colour, finish time and leaf layer below comes from running the lesson's own code
// in JS (topoOrder, layered Kahn, topoDfs, minimumTime, findOrder) on the example graph; check() throws on drift.
// Edge [u, v] always means u → v, "u before v".
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const stk = (values, label) => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const list = (xs) => `[${xs.join(', ')}]`;
const seq = (xs) => xs.join(', ');
const check = (ok, msg) => {
  if (!ok) throw new Error(`topological-sort/steps.js: ${msg}`);
};

// pos: [x, y] per vertex. o.st: vertex → state, o.es: 'u-v' → edge state, o.lab: vertex → label, o.undirected, o.label
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.undirected ? {} : { directed: true }),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(o.lab?.[i] ?? i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v]) => {
    const s = o.es?.[`${u}-${v}`] ?? (o.undirected ? o.es?.[`${v}-${u}`] : undefined);
    return { from: u, to: v, ...(s ? { state: s } : {}) };
  }),
});
const ek = (pairs, s) => Object.fromEntries(pairs.map(([u, v]) => [`${u}-${v}`, s]));
const adjOf = (n, edges) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  return adj;
};
const forward = (order, edges) => edges.filter(([u, v]) => order.indexOf(u) < order.indexOf(v));
const backward = (order, edges) => edges.filter(([u, v]) => order.indexOf(u) > order.indexOf(v));

// ---------- the lesson's topoOrder (template-kahn), one snapshot per pop ----------
function kahn(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v]++;
  }
  const indeg0 = indeg.slice();
  const order = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) order.push(i);
  const seeds = order.slice();
  const pops = [];
  for (let head = 0; head < order.length; head++) {
    const u = order[head];
    const decs = [];
    const pushed = [];
    for (const v of adj[u]) {
      const from = indeg[v];
      indeg[v]--;
      decs.push({ v, from, to: indeg[v] });
      if (indeg[v] === 0) {
        order.push(v);
        pushed.push(v);
      }
    }
    pops.push({ u, head, decs, pushed, indeg: indeg.slice(), order: order.slice() });
  }
  return { adj, indeg0, seeds, pops, order, indeg, ok: order.length === n };
}
const decText = (decs) => (decs.length ? decs.map((d) => `${d.v}: ${d.from}→${d.to}`).join(', ') : 'no outgoing edges');

// popped: done · being popped: active · waiting in the queue: window. Edges out of popped vertices are crossed off (muted).
function kGraph(n, edges, pos, popped, cur, queued, o = {}) {
  const st = { ...states(popped, 'done'), ...states(queued, 'window'), ...(cur !== undefined ? { [cur]: 'active' } : {}), ...o.st };
  const es = {};
  for (const [u, v] of edges) {
    if (popped.includes(u)) es[`${u}-${v}`] = 'muted';
    if (u === cur) es[`${u}-${v}`] = 'active';
  }
  return gp(n, edges, pos, { st, es, lab: o.lab, label: o.label });
}
const indegArr = (values, active = [], o = {}) => arr(values, { label: 'indeg', highlights: hl(values.length, (i) => (active.includes(i) ? 'active' : o.muted?.includes(i) ? 'muted' : '')) });
// one frame per pop: graph, indeg, queue
const popFrame = (n, edges, pos, run, p, say, extra = '') => {
  const popped = p.order.slice(0, p.head);
  const queue = p.order.slice(p.head + 1);
  const push = p.pushed.length ? ` Push ${seq(p.pushed)}.` : ' Nothing reaches 0.';
  return {
    say,
    note: `Pop ${p.u}: ${decText(p.decs)}.${push} Order: ${seq(p.order.slice(0, p.head + 1))}.${extra}`,
    panels: [kGraph(n, edges, pos, popped, p.u, queue), indegArr(p.indeg, p.decs.map((d) => d.v), { muted: [...popped, p.u] }), que(queue)],
  };
};

// ---------- the lesson's topoDfs (template-dfs), one event per colour change / edge look ----------
function dfsRun(n, adj) {
  const color = new Uint8Array(n);
  const post = [];
  const path = [];
  const ev = [];
  const snap = (kind, extra) => ev.push({ kind, color: Array.from(color), path: path.slice(), post: post.slice(), ...extra });
  const dfs = (u) => {
    color[u] = 1;
    path.push(u);
    snap('enter', { u });
    for (const v of adj[u]) {
      if (color[v] === 1) {
        snap('back', { u, v });
        return false;
      }
      if (color[v] === 2) snap('black', { u, v });
      if (color[v] === 0 && !dfs(v)) return false;
    }
    color[u] = 2;
    path.pop();
    post.push(u);
    snap('finish', { u });
    return true;
  };
  for (let i = 0; i < n; i++) if (color[i] === 0 && !dfs(i)) return { ok: false, ev, post };
  return { ok: true, ev, post, order: post.slice().reverse() };
}
const COL = ['', 'active', 'done']; // white plain, gray purple, black orange
const colName = ['white', 'gray', 'black'];

// ---------- Kahn + DP (the template's minimumTime, 0-based here) ----------
function dpRun(n, edges, time) {
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
      rel.push({ v, before, cand: finish[u] + time[v], after: finish[v] });
      if (--indeg[v] === 0) queue.push(v);
    }
    pops.push({ u, head, rel, finish: finish.slice(), queue: queue.slice() });
  }
  return { pops, finish, answer: Math.max(...finish), queue };
}

// ====================== what ======================
const DR_LAB = ['underwear', 'socks', 'shirt', 'trousers', 'tie', 'shoes'];
const DR_E = [[1, 5], [0, 3], [3, 5], [2, 4]]; // the lesson's rules: socks→shoes, underwear→trousers, trousers→shoes, shirt→tie
const DR_P = [[0, 0], [0, 1.1], [0, 2.2], [1.9, 0], [1.9, 2.2], [3.6, 0.55]];
const DR_ORDER = [0, 1, 2, 3, 4, 5]; // the lesson's example order: underwear, socks, shirt, trousers, tie, shoes
check(backward(DR_ORDER, DR_E).length === 0, 'dressing order valid');
const DR_ROW = [0, 1, 2, 0, 2, 1];
const DR_LINE = DR_ORDER.map((v, i) => [i * 1.1, DR_ROW[i] * 0.8]);
const dr = (o = {}) => gp(6, DR_E, DR_P, { lab: DR_LAB, ...o });
const drLine = (o = {}) => gp(6, DR_E, DR_LINE, { lab: DR_LAB, label: 'left → right', ...o });

const E6 = [[0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]]; // the lesson's visual and dry-run graph
const P6 = [[0, 0], [0, 1.4], [1.3, 0], [1.3, 1.4], [2.6, 0.7], [3.9, 0.7]];
const WT_ORDER = [0, 3, 2, 1, 4, 5];
const WT_BACK = backward(WT_ORDER, E6);
check(WT_BACK.length === 2, 'what turn: two backward edges');
const WT_LINE = (() => {
  const pos = [];
  WT_ORDER.forEach((v, i) => (pos[v] = [i, i % 2 ? 0.9 : 0]));
  return pos;
})();

// ====================== why ======================
const WHY_E = [[0, 2], [0, 1], [1, 2]]; // 0 → 1 → 2 plus 0 → 2, with 0 → 2 listed first
const WHY_P = [[0, 0.6], [1.4, 0], [2.8, 0.6]];
const WHY_BFS = (() => {
  const adj = adjOf(3, WHY_E);
  const dist = [0, -1, -1];
  const q = [0];
  for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (dist[v] === -1) (dist[v] = dist[q[h]] + 1), q.push(v);
  return { order: q, dist };
})();
check(WHY_BFS.order.join() === '0,2,1' && WHY_BFS.dist.join() === '0,1,1', 'why: bfs order');
check(backward(WHY_BFS.order, WHY_E).map(String).join() === '1,2', 'why: 1 → 2 points back');

// ====================== recognize ======================
const RC_PRE = [[1, 0], [2, 1], [3, 0]]; // [a, b]: to take a you must first take b
const RC_RIGHT = RC_PRE.map(([a, b]) => [b, a]);
const RC_WRONG = RC_PRE.map(([a, b]) => [a, b]);
const RC_P = [[0, 0.7], [1.4, 0], [2.8, 0], [1.4, 1.4]];
const RC_R = kahn(4, RC_RIGHT);
const RC_W = kahn(4, RC_WRONG);
check(RC_R.order.join() === '0,1,3,2' && RC_W.order.join() === '2,3,1,0' && RC_W.ok, 'recognize runs');

// ====================== intuition ======================
const I_E = [[0, 3], [1, 3], [1, 2], [2, 4], [3, 4]];
const I_P = [[0, 0], [0, 1.4], [1.4, 1.4], [1.4, 0], [2.8, 0.7]];
const I_K = kahn(5, I_E);
check(I_K.order.join() === '0,1,3,2,4', 'intuition kahn');
const I_D = dfsRun(5, adjOf(5, I_E));
check(I_D.post.join() === '4,3,0,2,1' && I_D.order.join() === '1,2,0,3,4', 'intuition dfs');
const I_FIN = I_D.ev.filter((e) => e.kind === 'finish');
// every vertex has an incoming edge: walk backwards
const IC_E = [[0, 1], [1, 2], [2, 0], [2, 3]];
const IC_P = [[0, 0], [1.4, 0], [0.7, 1.2], [2.1, 1.2]];
const IC_WALK = (() => {
  const w = [3];
  while (!w.slice(0, -1).includes(w.at(-1))) w.push(IC_E.find(([, v]) => v === w.at(-1))[0]);
  return w;
})();
check(IC_WALK.join() === '3,2,1,0,2', 'backwards walk repeats 2');

// ====================== brute-force ======================
const BF_E = [[2, 0], [0, 1]];
const BF_PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const BF_OK = BF_PERMS.map((p) => backward(p, BF_E).length === 0);
check(BF_OK.filter(Boolean).length === 1 && BF_OK[4], 'one valid permutation');
// "slightly smarter": each round scans from vertex 0 for the first vertex whose prerequisites are all done
const SC_E = [[3, 1], [1, 0], [2, 0]];
const SC_ROUNDS = (() => {
  const done = [];
  const rounds = [];
  while (done.length < 4) {
    const checked = [];
    for (let v = 0; v < 4; v++) {
      if (done.includes(v)) continue;
      checked.push(v);
      if (SC_E.filter(([, b]) => b === v).every(([a]) => done.includes(a))) {
        rounds.push({ before: done.slice(), checked, pick: v });
        done.push(v);
        break;
      }
    }
  }
  return rounds;
})();
check(SC_ROUNDS.map((r) => r.pick).join() === '2,3,1,0' && SC_ROUNDS.map((r) => r.checked.length).join() === '3,3,2,1', 'scan rounds');

// ====================== optimized-kahn ======================
const K_E = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 6], [5, 6]];
const K_P = [[0, 0.2], [0, 1.6], [1.3, 0], [1.3, 0.9], [1.3, 1.8], [2.6, 0.45], [3.9, 1.1]];
const K = kahn(7, K_E);
check(K.ok && K.indeg0.join() === '0,0,1,2,1,2,2' && K.order.join() === '0,1,2,3,4,5,6', 'kahn run');
const K_NEXT = K.pops[3]; // pop 3 is the turn
check(K_NEXT.u === 3 && K_NEXT.pushed.join() === '5', 'pop 3 frees 5');
const KO_E = [[3, 1], [3, 0], [4, 2], [0, 2], [1, 4]];
const KO_P = [[1.4, 0], [1.4, 1.4], [2.8, 0.7], [0, 0.7], [2.8, 1.8]];
const KO = kahn(5, KO_E);
check(KO.order.join() === '3,1,0,4,2', 'kahn order turn');
const KC_E = [[0, 1], [1, 2], [2, 3], [3, 1], [0, 4]];
const KC_P = [[0, 0.7], [1.4, 0.7], [2.6, 0], [2.6, 1.4], [1.4, 2]];
const KC = kahn(5, KC_E);
check(!KC.ok && KC.order.join() === '0,4' && KC.indeg.join() === '0,1,1,1,0', 'kahn cycle');

// ====================== template-kahn ======================
const TK_E = [[0, 1], [2, 1], [1, 3], [2, 4]];
const TK_P = [[0, 0], [1.4, 0.7], [0, 1.4], [2.8, 0.7], [1.4, 2]];
const TK = kahn(5, TK_E);
check(TK.order.join() === '0,2,1,4,3', 'template kahn run');
const orderArr = (order, head, n, label = 'order (= queue)') =>
  arr(order, { label, pointers: head < order.length ? [ptr(head, 'head')] : [], highlights: hl(order.length, (i) => (i < head ? 'done' : i === head ? 'active' : 'window')) });
function layered(n, edges) {
  const adj = adjOf(n, edges);
  const indeg = new Array(n).fill(0);
  for (const [, v] of edges) indeg[v]++;
  let layer = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) layer.push(i);
  let rounds = 0;
  let done = 0;
  const snaps = [];
  while (layer.length) {
    rounds++;
    done += layer.length;
    const next = [];
    for (const u of layer) for (const v of adj[u]) if (--indeg[v] === 0) next.push(v);
    snaps.push({ layer, rounds, done, next });
    layer = next;
  }
  return { snaps, rounds, done, result: done === n ? rounds : -1 };
}
const LY_E = [[0, 2], [1, 2], [2, 3], [2, 4], [4, 5]];
const LY_P = [[0, 0], [0, 1.4], [1.3, 0.7], [2.6, 0], [2.6, 1.4], [3.9, 1.4]];
const LY = layered(6, LY_E);
check(LY.result === 4 && LY.snaps.map((s) => s.layer.join('')).join() === '01,2,34,5', 'layered run');
const LT_E = [[0, 3], [1, 3], [2, 4], [3, 5]];
const LT_P = [[0, 0], [0, 1], [0, 2], [1.4, 0.5], [1.4, 2], [2.8, 0.5]];
const LT = layered(6, LT_E);
check(LT.result === 3, 'layered turn');

// ====================== implementation-kahn ======================
function kahnMap(vertices, edges) {
  const adj = new Map();
  const indeg = new Map();
  for (const v of vertices) adj.set(v, []), indeg.set(v, 0);
  for (const [u, v] of edges) adj.get(u).push(v), indeg.set(v, indeg.get(v) + 1);
  const indeg0 = [...indeg];
  const order = [...indeg.keys()].filter((v) => indeg.get(v) === 0);
  for (let head = 0; head < order.length; head++) for (const v of adj.get(order[head])) if (indeg.set(v, indeg.get(v) - 1).get(v) === 0) order.push(v);
  return { indeg0, order };
}
const MP_E = [['a', 'b'], ['c', 'b']];
const MP_BAD = kahnMap([...new Set(MP_E.flat())], MP_E); // only vertices that appear in an edge
const MP_GOOD = kahnMap(['a', 'b', 'c', 'd'], MP_E);
check(MP_BAD.order.join('') === 'acb' && MP_GOOD.order.join('') === 'acdb', 'map kahn');
const MP_P = [[0, 0], [1.4, 0.6], [0, 1.2], [2.8, 0]];
const mpGraph = (st) => gp(4, [[0, 1], [2, 1]], MP_P, { lab: ['a', 'b', 'c', 'd'], st });
const DUP_E = [[0, 1], [0, 1], [1, 2]];
const DUP = kahn(3, DUP_E);
check(DUP.indeg0[1] === 2 && DUP.pops[0].decs.map((d) => `${d.from}${d.to}`).join() === '21,10' && DUP.ok, 'duplicate edges');
const LX_E = [[0, 3], [1, 2]];
const LX = kahn(4, LX_E);
const LX_MIN = (() => {
  const indeg = [0, 0, 0, 0];
  for (const [, v] of LX_E) indeg[v]++;
  const ready = [0, 1, 2, 3].filter((v) => indeg[v] === 0);
  const out = [];
  while (ready.length) {
    ready.sort((a, b) => a - b);
    const u = ready.shift();
    out.push(u);
    for (const [a, v] of LX_E) if (a === u && --indeg[v] === 0) ready.push(v);
  }
  return out;
})();
const LX_STACK = (() => {
  const indeg = [0, 0, 0, 0];
  for (const [, v] of LX_E) indeg[v]++;
  const st = [0, 1, 2, 3].filter((v) => indeg[v] === 0);
  const out = [];
  while (st.length) {
    const u = st.pop();
    out.push(u);
    for (const [a, v] of LX_E) if (a === u && --indeg[v] === 0) st.push(v);
  }
  return out;
})();
check(LX.order.join() === '0,1,3,2' && LX_MIN.join() === '0,1,2,3' && LX_STACK.join() === '1,2,0,3' && backward(LX_STACK, LX_E).length === 0, 'lexicographic');

// ====================== optimized-dfs ======================
const D_E = [[0, 1], [1, 2], [0, 3], [3, 2], [4, 3]];
const D_P = [[0, 0], [1.4, 0], [2.8, 0.7], [1.4, 1.4], [0, 1.4]];
const D = dfsRun(5, adjOf(5, D_E));
check(D.ok && D.post.join() === '2,1,3,0,4' && D.order.join() === '4,0,3,1,2' && D.ev.length === 12, 'dfs run');
check(backward(D.order, D_E).length === 0, 'reversed post-order valid');
const dGraph = (e, o = {}) => {
  const es = {};
  if (e.kind === 'black') es[`${e.u}-${e.v}`] = 'visited';
  if (e.kind === 'back') es[`${e.u}-${e.v}`] = 'bad';
  return gp(o.n ?? 5, o.edges ?? D_E, o.pos ?? D_P, { st: { ...Object.fromEntries(e.color.map((c, i) => [i, COL[c]])), ...o.st }, es, lab: o.lab });
};
const dNote = (e) =>
  e.kind === 'enter'
    ? `Enter ${e.u}: colour it gray. Path: ${e.path.join(' → ')}.`
    : e.kind === 'finish'
      ? `All of ${e.u}'s neighbours are done: ${e.u} turns black and joins the post-order.`
      : `From ${e.u}, edge to ${e.v}: ${e.v} is already black. Finished, not on the path: fine.`;
const dSay = (e) => (e.kind === 'enter' ? 1 : e.kind === 'finish' ? 2 : 3);
const DC_E = [[0, 1], [1, 2], [2, 0]];
const DC_P = [[0, 0], [1.4, 0], [0.7, 1.2]];
const DC = dfsRun(3, adjOf(3, DC_E));
const DC_BACK = DC.ev.at(-1);
check(!DC.ok && DC_BACK.kind === 'back' && DC_BACK.u === 2 && DC_BACK.v === 0 && DC_BACK.path.join() === '0,1,2', 'dfs back edge');
const PO_E = [[0, 2], [1, 2]]; // the lesson's a → c, b → c
const PO_LAB = ['a', 'b', 'c'];
const PO_P = [[0, 0], [0, 1.4], [1.4, 0.7]];
const PO = dfsRun(3, adjOf(3, PO_E));
const PO_PRE = PO.ev.filter((e) => e.kind === 'enter').map((e) => e.u);
check(PO.post.join() === '2,0,1' && PO.order.join() === '1,0,2' && PO_PRE.join() === '0,2,1', 'pre vs post');

// ====================== template-dfs ======================
const TD_E = [[0, 1], [1, 2], [2, 3], [3, 1]];
const TD_P = [[0, 0.7], [1.4, 0.7], [2.8, 0], [2.8, 1.4]];
const TD = dfsRun(4, adjOf(4, TD_E));
check(!TD.ok && TD.ev.at(-1).kind === 'back' && TD.ev.at(-1).u === 3 && TD.ev.at(-1).v === 1, 'template dfs cycle');
const CH_N = 6;
const CH_E = Array.from({ length: CH_N - 1 }, (_, i) => [i, i + 1]);
const CH = dfsRun(CH_N, adjOf(CH_N, CH_E));
const CH_DEPTH = Math.max(...CH.ev.map((e) => e.path.length));
check(CH_DEPTH === 6, 'chain depth');
const WS_E = [[0, 1], [1, 3], [2, 4], [4, 3]];
const WS_P = [[0, 0], [1.4, 0], [0, 1.4], [2.8, 0.7], [1.4, 1.4]];
const WS = dfsRun(5, adjOf(5, WS_E));
const WS_AFTER0 = WS.ev.filter((e) => e.kind === 'finish').find((e) => e.u === 0).color;
check(WS_AFTER0.join() === '2,2,0,2,0', 'first dfs tree');

// ====================== optimized-dag-dp ======================
const DP_E = [[0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
const DP_T = [2, 4, 3, 1, 2];
const DP_P = [[0, 0], [0, 1.4], [1.4, 0], [1.4, 1.4], [2.8, 0.7]];
const DP = dpRun(5, DP_E, DP_T);
check(DP.queue.join() === '0,1,2,3,4' && DP.finish.join() === '2,4,7,5,9' && DP.answer === 9, 'dp run');
const dpGraph = (done, cur, active = []) =>
  gp(5, DP_E, DP_P, { st: { ...states(done, 'done'), ...(cur !== undefined ? { [cur]: 'active' } : {}) }, es: ek(active.map((v) => [cur, v]), 'active') });
const finArr = (f, act = [], indexBase = 0) => arr(f, { label: 'finish', indexBase, highlights: hl(f.length, (i) => (act.includes(i) ? 'active' : '')) });
const dpFrame = (p) => ({
  say: 1,
  note: `Pop ${p.u} (finish ${p.finish[p.u]}). ${p.rel.map((r) => `${r.v}: max(${r.before}, ${p.finish[p.u]} + ${DP_T[r.v]}) = ${r.after}`).join('; ') || 'No outgoing edges'}.`,
  panels: [dpGraph(p.queue.slice(0, p.head), p.u, p.rel.map((r) => r.v)), arr(DP_T, { label: 'time' }), finArr(p.finish, p.rel.map((r) => r.v))],
});
// ancestor sets in topo order
const AN_E = [[0, 1], [1, 2], [3, 2]];
const AN_P = [[0, 0], [1.4, 0], [2.8, 0.7], [1.4, 1.4]];
const AN = (() => {
  const order = kahn(4, AN_E).order;
  const adj = adjOf(4, AN_E);
  const anc = Array.from({ length: 4 }, () => new Set());
  const snaps = [];
  for (const u of order)
    for (const v of adj[u]) {
      for (const a of anc[u]) anc[v].add(a);
      anc[v].add(u);
      snaps.push({ u, v, anc: anc.map((s) => [...s].sort((a, b) => a - b)) });
    }
  return { order, snaps };
})();
check(AN.order.join() === '0,3,1,2' && AN.snaps.at(-1).anc[2].join() === '0,1,3', 'ancestors');
const ancTable = (anc, hi) => table(['0', '1', '2', '3'], ['ancestors'], anc.map((s) => [s.length ? `{${s.join(',')}}` : '{}']), anc.map((_, i) => [i === hi ? 'active' : '']));

// ====================== optimized-leaf-trimming ======================
function trim(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v), adj[v].push(u);
  const deg = adj.map((a) => a.length);
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] <= 1) leaves.push(i);
  let remaining = n;
  const removed = [];
  const rounds = [];
  while (remaining > 2) {
    remaining -= leaves.length;
    const next = [];
    for (const u of leaves) for (const v of adj[u]) if (--deg[v] === 1) next.push(v);
    rounds.push({ leaves, before: removed.slice(), deg: deg.slice(), remaining });
    removed.push(...leaves);
    leaves = next;
  }
  return { rounds, centers: leaves, removed, adj };
}
const height = (adj, s) => {
  const d = adj.map(() => -1);
  d[s] = 0;
  const q = [s];
  for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (d[v] === -1) (d[v] = d[q[h]] + 1), q.push(v);
  return Math.max(...d);
};
const LT7_E = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]];
const LT7_P = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1.1], [2, 2.2]];
const TR = trim(7, LT7_E);
check(TR.rounds.length === 2 && TR.rounds[0].leaves.join() === '0,4,6' && TR.rounds[1].leaves.join() === '1,3,5' && TR.centers.join() === '2', 'trim run');
const TR_H = Array.from({ length: 7 }, (_, s) => height(TR.adj, s));
check(TR_H.join() === '4,3,2,3,4,3,4', 'heights');
const trGraph = (removed, leaves, centers = [], pos = LT7_P, n = 7, edges = LT7_E) =>
  gp(n, edges, pos, { undirected: true, st: { ...states(removed, 'muted'), ...states(leaves, 'active'), ...states(centers, 'done') }, es: ek(edges.filter(([u, v]) => removed.includes(u) || removed.includes(v)), 'muted') });
const TT_E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]];
const TT_P = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [2, 1.1]];
const TT = trim(7, TT_E);
check(TT.centers.slice().sort().join() === '2,3', 'trim turn centers');
const TT_H = Array.from({ length: 7 }, (_, s) => height(TT.adj, s));
check(TT_H[2] === 3 && TT_H[3] === 3 && Math.min(...TT_H) === 3, 'trim turn heights');

// ====================== template ======================
const TP_REL = [[1, 3], [2, 3], [3, 4]]; // 1-based [prev, next]
const TP_T = [1, 2, 3, 4];
const TP_E = TP_REL.map(([a, b]) => [a - 1, b - 1]);
const TP_P = [[0, 0], [0, 1.4], [1.4, 0.7], [2.8, 0.7]];
const TP = dpRun(4, TP_E, TP_T);
check(TP.answer === 9 && TP.finish.join() === '1,2,5,9', 'template dp');
const TP_LAB = ['1', '2', '3', '4'];

// ====================== implementation ======================
const FO_PRE = [[2, 0], [2, 1], [3, 2]]; // [course, pre]
function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    indeg[course]++;
  }
  const order = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) order.push(i);
  for (let head = 0; head < order.length; head++) for (const next of adj[order[head]]) if (--indeg[next] === 0) order.push(next);
  return order.length === numCourses ? order : [];
}
check(findOrder(4, FO_PRE).join() === '0,1,2,3' && findOrder(2, [[0, 1], [1, 0]]).length === 0, 'findOrder');
const FO_E = FO_PRE.map(([c, p]) => [p, c]);
const FO_P = [[0, 0], [0, 1.4], [1.4, 0.7], [2.8, 0.7]];
const FO = kahn(4, FO_E);

// ====================== dry-run ======================
const DRY = kahn(6, E6);
const DRY_TABLE = [
  ['(start)', 'indeg = [0,0,2,1,2,1]', '0, 1', '[0, 1]'],
  ['0', '2: 2→1', '—', '[0, 1]'],
  ['1', '2: 1→0, 3: 1→0', '2, 3', '[0, 1, 2, 3]'],
  ['2', '4: 2→1', '—', '[0, 1, 2, 3]'],
  ['3', '4: 1→0', '4', '[0, 1, 2, 3, 4]'],
  ['4', '5: 1→0', '5', '[0, 1, 2, 3, 4, 5]'],
  ['5', '—', '—', '6 = n → valid, no cycle'],
];
const DRY_ROWS = [
  ['(start)', `indeg = [${DRY.indeg0.join(',')}]`, seq(DRY.seeds), list(DRY.seeds)],
  ...DRY.pops.map((p, i) => [
    String(p.u),
    p.decs.length ? p.decs.map((d) => `${d.v}: ${d.from}→${d.to}`).join(', ') : '—',
    p.pushed.length ? seq(p.pushed) : '—',
    i === DRY.pops.length - 1 ? `${p.order.length} = n → valid, no cycle` : list(p.order),
  ]),
];
check(JSON.stringify(DRY_ROWS) === JSON.stringify(DRY_TABLE), 'dry run matches the lesson table');
check(DRY.pops.reduce((s, p) => s + p.decs.length, 0) === 6, 'six decrements');
const DRY2 = kahn(6, [...E6, [5, 0]]);
check(DRY2.order.join() === '1,3', 'dry turn: edge 5 → 0');
const dryFrame = (p, say) => {
  const popped = p.order.slice(0, p.head);
  return {
    say,
    note: `Pop ${p.u}: ${p.decs.length ? decText(p.decs) : 'no outgoing edges'}. Pushed: ${p.pushed.length ? seq(p.pushed) : '—'}.`,
    panels: [kGraph(6, E6, P6, popped, p.u, p.order.slice(p.head + 1)), indegArr(p.indeg, p.decs.map((d) => d.v)), orderArr(p.order, p.head, 6)],
  };
};

// ====================== mistakes ======================
const MS_E = [[0, 1], [1, 2], [2, 1], [2, 5], [0, 3], [3, 4]];
const MS_P = [[0, 0.7], [1.4, 0], [2.8, 0], [1.4, 1.4], [2.8, 1.4], [4.2, 0]];
const MS = kahn(6, MS_E);
check(MS.order.join() === '0,3,4', 'mistakes leftovers');
const MT_E = [[0, 1], [1, 2], [2, 3], [3, 1], [3, 4], [4, 5]];
const MT_P = [[0, 0.7], [1.3, 0.7], [2.3, 0], [2.3, 1.4], [3.5, 1.4], [4.7, 1.4]];
const MT = kahn(6, MT_E);
check(MT.order.join() === '0', 'mistakes turn');
const ISO_E = [[0, 1], [1, 2]];
const ISO_P = [[0, 0], [1.4, 0], [2.8, 0], [1.4, 1.2]];

// ====================== interview-tips ======================
const SL_E = [[0, 1], [2, 2]];
const SL = kahn(3, SL_E);
check(SL.order.join() === '0,1' && !SL.ok, 'self loop');
const AV_E = [[0, 2], [1, 2], [2, 3]];
check(backward([0, 1, 2, 3], AV_E).length === 0 && backward([1, 0, 2, 3], AV_E).length === 0, 'any valid order');

const steps = {
  what: [
    {
      kind: 'watch',
      title: 'Rules become arrows',
      lines: ['Each task is a **vertex**.', 'Each rule "X before Y" is a **directed edge X → Y**.', 'Some tasks have no rule between them at all.'],
      frames: [
        { say: 0, note: 'Six tasks for getting dressed. No rules yet.', panels: [gp(6, [], DR_P, { lab: DR_LAB })] },
        ...DR_E.map(([u, v], k) => ({
          say: 1,
          note: `${DR_LAB[u]} before ${DR_LAB[v]}: edge ${DR_LAB[u]} → ${DR_LAB[v]}.`,
          panels: [gp(6, DR_E.slice(0, k + 1), DR_P, { lab: DR_LAB, st: { [u]: 'active', [v]: 'active' }, es: { [`${u}-${v}`]: 'active' } })],
        })),
        { say: 2, note: 'Socks and shirt: no edge either way. Either may come first.', panels: [dr({ st: { 1: 'window', 2: 'window' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Line them up: every edge points forward',
      lines: ['A **topological order** lines up all the tasks.', 'For every edge u → v, u is further **left** than v.'],
      frames: [
        { say: 0, note: 'The lesson\'s order: underwear, socks, shirt, trousers, tie, shoes.', panels: [drLine(), vars({ edges: DR_E.length, forward: 0 })] },
        ...DR_E.map(([u, v], k) => ({
          say: 1,
          note: `${DR_LAB[u]} is #${DR_ORDER.indexOf(u) + 1}, ${DR_LAB[v]} is #${DR_ORDER.indexOf(v) + 1}: forward.`,
          panels: [drLine({ st: { [u]: 'active', [v]: 'active' }, es: { ...ek(DR_E.slice(0, k), 'done'), [`${u}-${v}`]: 'active' } }), vars({ edges: DR_E.length, forward: k + 1 })],
        })),
        { say: 1, note: 'All 4 edges point forward: a valid topological order.', panels: [drLine({ st: states(DR_ORDER, 'done'), es: ek(DR_E, 'done') }), vars({ edges: 4, forward: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the backward edges',
      lines: ['Here the vertices are lined up as 0, 3, 2, 1, 4, 5.', 'An edge is **backward** if its tail sits to the right of its head.'],
      panels: [gp(6, E6, WT_LINE, { label: 'left → right' }), arr(WT_ORDER, { label: 'line-up', showIndices: false })],
      task: { type: 'number', question: 'How many edges point backward (right to left)?', options: [0, 1, 2, 3], answer: WT_BACK.length, hint: 'Check each edge: is u left of v? Look at the edges out of 1.' },
      solved: '1 → 2 and 1 → 3 point backward, so this line-up is not a topological order.',
      then: [
        { say: 1, note: '1 sits after 2 and 3, but must come before both.', panels: [gp(6, E6, WT_LINE, { label: 'left → right', st: { 1: 'bad' }, es: ek(WT_BACK, 'bad') }), arr(WT_ORDER, { label: 'line-up', showIndices: false, highlights: { 3: 'bad' } })] },
      ],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'BFS order can break a rule',
      lines: ['BFS tells you what is **reachable**, and how far.', 'It ignores "before" rules: 2 is reached right after 0.', 'But 2 also needs 1 first. Edge 1 → 2 points **backward**.'],
      frames: [
        { say: 0, note: 'Edges 0 → 2, 0 → 1, 1 → 2. BFS starts at 0.', panels: [gp(3, WHY_E, WHY_P, { st: { 0: 'active' } }), que([0]), arr([0], { label: 'visit order' })] },
        { say: 1, note: 'Pop 0: reach 2, then 1. Both at distance 1.', panels: [gp(3, WHY_E, WHY_P, { st: { 0: 'done', 1: 'window', 2: 'window' }, es: ek([[0, 2], [0, 1]], 'active') }), que([2, 1]), arr(WHY_BFS.order, { label: 'visit order', highlights: { 0: 'done' } })] },
        { say: 2, note: 'Visit order 0, 2, 1. The rule 1 → 2 is broken.', panels: [gp(3, WHY_E, WHY_P, { st: { 1: 'bad', 2: 'bad' }, es: { '1-2': 'bad' } }), arr(WHY_BFS.order, { label: 'visit order', highlights: { 1: 'bad', 2: 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why the order helps DP',
      lines: ['Topological sort gives a **schedule**, **cycle detection** and an **evaluation order for DP on DAGs**.', 'Vertex 4 is about to be computed.'],
      panels: [gp(6, E6, P6, { st: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'active' }, es: ek([[2, 4], [3, 4]], 'active') }), arr([0, 1, 2, 3, 4, 5], { label: 'topological order', pointers: [ptr(4, 'now')], highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'active' } })],
      task: {
        type: 'choose',
        question: 'Why is it safe to compute vertex 4 now?',
        options: [
          { text: 'Its predecessors 2 and 3 come earlier, so their values are already final', why: '' },
          { text: 'Vertex 4 has the largest number so far', why: 'Vertex numbers mean nothing here. What matters is that every edge into 4 starts earlier in the order.' },
          { text: 'Topological sort removed the cycles around 4', why: 'Topological sort cannot remove cycles. It only detects them.' },
        ],
        answer: 0,
      },
      solved: 'Each vertex comes after all its predecessors, so one pass in topological order is enough.',
    },
  ],

  when: [
    {
      kind: 'turn',
      title: 'Your turn: parallel tasks',
      lines: ['Tasks take different times.', 'Any number of them can run at the same time.', 'The question: **minimum total time**.'],
      panels: [gp(5, DP_E, DP_P), arr(DP_T, { label: 'time' })],
      task: {
        type: 'choose',
        question: 'Which tool fits?',
        options: [
          { text: 'Kahn + DP (longest path)', why: '' },
          { text: 'Leaf trimming', why: 'Leaf trimming finds the best roots of an undirected tree. These are timed tasks with dependencies.' },
          { text: '3-colour DFS alone', why: 'It answers "is there a cycle?" or gives an order. It does not add up times along paths.' },
        ],
        answer: 0,
      },
      solved: '"Minimum time when tasks can run in parallel" is Kahn + DP over the longest path.',
    },
    {
      kind: 'turn',
      title: 'Your turn: an undirected graph',
      lines: ['Topological sort is only for **directed** graphs.'],
      panels: [gp(3, [[0, 1], [1, 2], [2, 0]], [[0, 0], [1.4, 0], [0.7, 1.2]], { undirected: true, label: 'undirected' })],
      task: {
        type: 'choose',
        question: 'Is there a cycle in this undirected graph? Which tool?',
        options: [
          { text: 'DFS with a parent check, or Union-Find', why: '' },
          { text: "Kahn's algorithm", why: 'Kahn needs edge directions to count in-degrees. These edges have none.' },
          { text: 'Reversed DFS post-order', why: 'That gives a topological order, which only exists for directed graphs.' },
        ],
        answer: 0,
      },
      solved: 'Undirected cycle detection: DFS with a parent check (Graphs topic) or Union-Find.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clue found: now fix the direction',
      lines: ['"prerequisites" is the clue: think topological sort.', '`[a, b]` means "to take a, first take b".', 'So the edge is **b → a**. Then run Kahn.'],
      frames: [
        { say: 0, note: 'prerequisites = [[1,0], [2,1], [3,0]].', panels: [arr(RC_PRE.map((p) => `[${p}]`), { label: 'prerequisites' })] },
        ...RC_PRE.map(([a, b], k) => ({
          say: 1,
          note: `[${a}, ${b}]: ${b} comes first. Edge ${b} → ${a}.`,
          panels: [arr(RC_PRE.map((p) => `[${p}]`), { label: 'prerequisites', highlights: { [k]: 'active' } }), gp(4, RC_RIGHT.slice(0, k + 1), RC_P, { st: { [b]: 'active', [a]: 'window' }, es: { [`${b}-${a}`]: 'active' } })],
        })),
        { say: 2, note: `Kahn gives ${seq(RC_R.order)}. Every course after its prerequisite.`, panels: [gp(4, RC_RIGHT, RC_P, { st: states([0, 1, 2, 3], 'done'), es: ek(RC_RIGHT, 'done') }), arr(RC_R.order, { label: 'order' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the backwards graph',
      lines: ['Someone adds the edges as **a → b** instead.', 'Now run Kahn on this wrong graph.'],
      panels: [gp(4, RC_WRONG, RC_P, { label: 'wrong direction' }), arr(RC_W.indeg0, { label: 'indeg' })],
      task: { type: 'number', question: 'How many courses does Kahn output on the wrong graph?', options: [0, 2, 3, 4], answer: RC_W.order.length, hint: 'Reversing every edge of a DAG cannot create a cycle.' },
      solved: 'All 4: it passes the cycle check. But the order is reversed, so it fails the order check.',
      then: [
        { say: 1, note: `Order ${seq(RC_W.order)}: course 2 first, before 1 and 0 it needs.`, panels: [gp(4, RC_WRONG, RC_P, { label: 'wrong direction', st: { 2: 'bad' } }), arr(RC_W.order, { label: 'wrong order', highlights: { 0: 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the clue',
      lines: ['Clue: a sorted dictionary in an **unknown alphabet**.', 'The word order implies "letter before letter" rules.'],
      panels: [arr(['wrt', 'wrf', 'er'], { label: 'sorted words' })],
      task: {
        type: 'choose',
        question: 'How do you recover the letter order?',
        options: [
          { text: 'Build a graph of letter rules, then run Kahn', why: '' },
          { text: 'Binary search over the words', why: 'The words are already in order. You need an order of letters, not a position.' },
          { text: 'Union-Find over the letters', why: 'Union-Find only groups letters together. It has no notion of "before".' },
        ],
        answer: 0,
      },
      solved: 'Orders implied by sorted words: build the graph, then Kahn.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Kahn: peel the ready ones',
      lines: ['Anything with no remaining prerequisites can be done **now**.', 'Do it and cross it off. Others may become ready.', 'Repeat until nothing is left.'],
      frames: [
        { say: 0, note: `Ready now: ${seq(I_K.seeds)}. Nothing points into them.`, panels: [kGraph(5, I_E, I_P, [], undefined, I_K.seeds), arr([], { label: 'done' })] },
        ...I_K.pops.map((p) => ({
          say: p.pushed.length ? 1 : 2,
          note: `Do ${p.u}, cross it off.${p.pushed.length ? ` Now ready: ${seq(p.pushed)}.` : ' Nothing new is ready.'}`,
          panels: [kGraph(5, I_E, I_P, p.order.slice(0, p.head + 1), undefined, p.order.slice(p.head + 1)), arr(p.order.slice(0, p.head + 1), { label: 'done' })],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'DFS: finish the deepest first',
      lines: ['Follow edges as deep as possible.', 'A task **finishes** only after everything that depends on it.', 'Reverse the finish list: a valid schedule.'],
      frames: [
        { say: 0, note: 'Start at 0 and go deep: 0 → 3 → 4.', panels: [gp(5, I_E, I_P, { st: { 0: 'active', 3: 'active', 4: 'active' }, es: ek([[0, 3], [3, 4]], 'active') }), arr([], { label: 'finish order' })] },
        ...I_FIN.map((e) => ({
          say: 1,
          note: `${e.u} finishes.`,
          panels: [gp(5, I_E, I_P, { st: { ...Object.fromEntries(e.color.map((c, i) => [i, COL[c]])), [e.u]: 'window' } }), arr(e.post, { label: 'finish order', highlights: { [e.post.length - 1]: 'window' } })],
        })),
        { say: 2, note: `Reversed: ${seq(I_D.order)}. Every edge points forward.`, panels: [gp(5, I_E, I_P, { st: states([0, 1, 2, 3, 4], 'done'), es: ek(I_E, 'done') }), arr(I_D.order, { label: 'schedule' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no source at all',
      lines: ['Every vertex here has in-degree at least 1.', 'Start at 3 and keep walking **backwards** along an incoming edge.'],
      panels: [gp(4, IC_E, IC_P, { st: { 3: 'active' } })],
      task: {
        type: 'choose',
        question: 'What must happen on the backwards walk?',
        options: [
          { text: 'It repeats a vertex: there is a directed cycle', why: '' },
          { text: 'It reaches a vertex with in-degree 0', why: 'There is none: every vertex has an incoming edge, so the walk can always go on.' },
          { text: 'It stops at 3', why: '3 has an incoming edge from 2, so the walk continues.' },
        ],
        answer: 0,
      },
      solved: 'With only n vertices the walk must repeat one. So a DAG always has a source, and Kahn can always start.',
      then: [
        ...IC_WALK.slice(1).map((v, k) => ({
          say: 1,
          note: k === IC_WALK.length - 2 ? `Back at ${v}: the walk closed a cycle ${v} → 0 → 1 → 2.` : `Step back to ${v}.`,
          panels: [gp(4, IC_E, IC_P, { st: { ...states(IC_WALK.slice(0, k + 1), 'visited'), [v]: k === IC_WALK.length - 2 ? 'bad' : 'active' }, es: ek(IC_WALK.slice(0, k + 2).slice(1).map((w, j) => [w, IC_WALK[j]]), k === IC_WALK.length - 2 ? 'bad' : 'active') })],
        })),
      ],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Try every permutation',
      lines: ['List every order of the n tasks.', 'Check each one: do **all** edges point forward?', 'n! orders × m edges each. Useless beyond n ≈ 10.'],
      frames: [
        { say: 0, note: 'Edges 2 → 0 and 0 → 1. n = 3: 3! = 6 orders.', panels: [gp(3, BF_E, [[1.4, 0], [2.8, 0], [0, 0]]), vars({ tried: 0, valid: 0 })] },
        ...BF_PERMS.map((p, k) => {
          const bad = backward(p, BF_E);
          return {
            say: 1,
            note: bad.length ? `${seq(p)}: edge ${bad[0][0]} → ${bad[0][1]} points backward.` : `${seq(p)}: both edges point forward. Valid.`,
            panels: [arr(p, { label: `order ${k + 1}`, showIndices: false, highlights: hl(3, () => (bad.length ? 'bad' : 'done')) }), vars({ tried: k + 1, valid: BF_OK.slice(0, k + 1).filter(Boolean).length })],
          };
        }),
        { say: 2, note: 'Six orders for one answer. At n = 10 that is 3,628,800 orders.', panels: [arr([2, 0, 1], { label: 'the valid one', showIndices: false, highlights: hl(3, () => 'done') }), vars({ tried: 6, valid: 1 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Smarter: scan for a ready vertex, again and again',
      lines: ['Scan all vertices for one whose prerequisites are all done.', 'Output it and start the scan **from scratch**.', 'n scans of O(n + m): O(n · (n + m)).'],
      frames: [
        { say: 0, note: 'Edges 3 → 1, 1 → 0, 2 → 0.', panels: [gp(4, SC_E, [[2.8, 0.7], [1.4, 0], [1.4, 1.4], [0, 0]]), arr([0, 1, 2, 3], { label: 'vertices' }), arr([], { label: 'output' })] },
        ...SC_ROUNDS.map((r, k) => ({
          say: k ? 1 : 0,
          note: `Round ${k + 1}: checked ${seq(r.checked)}. ${r.pick} is ready: output it.`,
          panels: [
            gp(4, SC_E, [[2.8, 0.7], [1.4, 0], [1.4, 1.4], [0, 0]], { st: { ...states(r.before, 'muted'), ...states(r.checked, 'bad'), [r.pick]: 'active' }, es: ek(SC_E.filter(([u]) => r.before.includes(u)), 'muted') }),
            arr([0, 1, 2, 3], { label: 'vertices', highlights: hl(4, (i) => (i === r.pick ? 'active' : r.checked.includes(i) ? 'bad' : r.before.includes(i) ? 'muted' : '')) }),
            arr([...r.before, r.pick], { label: 'output' }),
          ],
        })),
        { say: 2, note: `Vertex 0 was checked ${SC_ROUNDS.length} times. Each scan rediscovers what is ready.`, panels: [arr([2, 3, 1, 0], { label: 'output', highlights: hl(4, () => 'done') }), vars({ scans: SC_ROUNDS.length, checks: SC_ROUNDS.reduce((s, r) => s + r.checked.length, 0) })] },
      ],
    },
    {
      kind: 'turn',
      title: "Your turn: Kahn's counters",
      lines: ['Kahn keeps `indeg[v]`: prerequisites **remaining**.', 'Finishing `u` only touches u\'s **outgoing** edges.'],
      panels: [gp(6, E6, P6, { st: { 1: 'active' }, es: ek([[1, 2], [1, 3]], 'active') }), indegArr([0, 0, 2, 1, 2, 1])],
      task: { type: 'number', question: 'Vertex 1 finishes. How many counters change?', options: [1, 2, 3, 6], answer: kahn(6, E6).adj[1].length, hint: 'Count the edges leaving 1. Nothing else is touched.' },
      solved: 'Only indeg[2] and indeg[3]. Over the whole run each edge is processed once: O(V + E).',
    },
  ],

  'optimized-kahn': [
    {
      kind: 'watch',
      title: 'Build indeg, seed the queue',
      lines: ['Build `adj` (u → v) and `indeg[v]` = incoming edges.', 'Push every vertex with `indeg === 0` into a queue.'],
      frames: [
        { say: 0, note: '7 vertices, 8 edges.', panels: [gp(7, K_E, K_P), indegArr(new Array(7).fill(0))] },
        { say: 0, note: `Count arrows into each vertex: indeg = ${list(K.indeg0)}.`, panels: [gp(7, K_E, K_P), indegArr(K.indeg0, [3, 5, 6])] },
        { say: 1, note: `indeg 0: ${seq(K.seeds)}. They go into the queue.`, panels: [kGraph(7, K_E, K_P, [], undefined, K.seeds), indegArr(K.indeg0, K.seeds), que(K.seeds)] },
      ],
    },
    {
      kind: 'watch',
      title: 'Pop, decrement, push',
      lines: ['Pop `u` and append it to the order.', 'For each `v` in `adj[u]`: `indeg[v]--`.', 'If it becomes 0, push `v`.'],
      frames: K.pops.slice(0, 3).flatMap((p) => [
        { ...popFrame(7, K_E, K_P, K, p, 0), note: `Pop ${p.u}, append it. Order: ${seq(p.order.slice(0, p.head + 1))}.`, panels: [kGraph(7, K_E, K_P, p.order.slice(0, p.head), p.u, p.order.slice(p.head + 1).filter((v) => !p.pushed.includes(v))), indegArr(p.indeg.map((x, i) => (p.decs.some((d) => d.v === i) ? x + p.decs.filter((d) => d.v === i).length : x)), [], { muted: p.order.slice(0, p.head + 1) }), que(p.order.slice(p.head + 1).filter((v) => !p.pushed.includes(v)))] },
        { ...popFrame(7, K_E, K_P, K, p, p.pushed.length ? 2 : 1), note: `${decText(p.decs)}.${p.pushed.length ? ` Reached 0: push ${seq(p.pushed)}.` : ' Nothing reaches 0.'}` },
      ]),
    },
    {
      kind: 'turn',
      title: 'Your turn: who is freed next?',
      lines: ['The queue holds 3 and 4. Pop 3 next.', 'Its only edge is 3 → 5.'],
      panels: [kGraph(7, K_E, K_P, [0, 1, 2], 3, [4]), indegArr(K.pops[2].indeg, [], { muted: [0, 1, 2] }), que([3, 4])],
      task: { type: 'cell', question: 'Tap the counter that reaches 0 when 3 is popped.', panel: 1, answer: 5, hints: { 6: '6 waits for 4 and 5. Popping 3 does not touch it.', 4: '4 is already 0 and in the queue.', 3: 'That is 3 itself, already 0.' } },
      solved: 'indeg[5] goes 1 → 0, so 5 is pushed. Then 4 and 5 free 6.',
      then: K.pops.slice(3).map((p) => popFrame(7, K_E, K_P, K, p, 0, p.head === 6 ? ' 7 = n: a topological order.' : '')),
    },
    {
      kind: 'watch',
      title: 'A short order means a cycle',
      lines: ['When the queue is empty, count the order.', 'n vertices: a topological order.', 'Fewer: the leftovers are on, or behind, a cycle.'],
      frames: [
        { say: 0, note: `indeg = ${list(KC.indeg0)}. Sources: ${seq(KC.seeds)}.`, panels: [kGraph(5, KC_E, KC_P, [], undefined, KC.seeds), indegArr(KC.indeg0, KC.seeds), que(KC.seeds)] },
        ...KC.pops.map((p) => popFrame(5, KC_E, KC_P, KC, p, 0)),
        { say: 2, note: `Queue empty with ${KC.order.length} < 5. 1, 2, 3 wait on each other: the cycle 1 → 2 → 3 → 1.`, panels: [kGraph(5, KC_E, KC_P, KC.order, undefined, [], { st: states([1, 2, 3], 'bad') }), indegArr(KC.indeg, [], { muted: KC.order }), vars({ order: KC.order.length, n: 5 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: run Kahn yourself',
      lines: ['Seed sources in index order.', 'Pop from the front; push in `adj` order.'],
      panels: [gp(5, KO_E, KO_P), indegArr(KO.indeg0)],
      task: { type: 'order', question: 'Tap the vertices in the order Kahn outputs them.', items: KO.order.map(String), hint: 'Only 3 starts at 0. Popping 3 frees 1 and then 0 (adj[3] = [1, 0]).' },
      solved: `${seq(KO.order)}. 2 waits until both 4 and 0 are done.`,
      then: KO.pops.map((p) => popFrame(5, KO_E, KO_P, KO, p, 1)),
    },
  ],

  'template-kahn': [
    {
      kind: 'watch',
      title: 'The order doubles as the queue',
      lines: ['Seed `order` with every in-degree-0 vertex.', '`head` walks along `order`: everything after it is still queued.', 'Return `order` if it has n vertices, else `null`.'],
      frames: [
        { say: 0, note: `indeg = ${list(TK.indeg0)}. order = ${list(TK.seeds)}.`, panels: [kGraph(5, TK_E, TK_P, [], undefined, TK.seeds), indegArr(TK.indeg0, TK.seeds), orderArr(TK.seeds, 0, 5)] },
        ...TK.pops.map((p) => ({
          say: 1,
          note: `head = ${p.head}, u = ${p.u}: ${decText(p.decs)}.${p.pushed.length ? ` Append ${seq(p.pushed)}.` : ''}`,
          panels: [kGraph(5, TK_E, TK_P, p.order.slice(0, p.head), p.u, p.order.slice(p.head + 1)), indegArr(p.indeg, p.decs.map((d) => d.v)), orderArr(p.order, p.head, 5)],
        })),
        { say: 2, note: '`order.length === n`: return it. No separate result array needed.', panels: [kGraph(5, TK_E, TK_P, TK.order, undefined, []), orderArr(TK.order, 5, 5), vars({ length: 5, n: 5 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Layered Kahn counts rounds',
      lines: ['`layer` = every vertex that is ready **now**.', 'One round: process the whole layer, collect `next`.', 'Return `rounds` if `done === n`, else -1.'],
      frames: [
        { say: 0, note: `Layer 1: ${seq(LY.snaps[0].layer)}.`, panels: [gp(6, LY_E, LY_P, { st: states(LY.snaps[0].layer, 'window') }), arr(LY.snaps[0].layer, { label: 'layer', showIndices: false }), vars({ rounds: 0, done: 0 })] },
        ...LY.snaps.map((s, k) => {
          const before = LY.snaps.slice(0, k).flatMap((x) => x.layer);
          return {
            say: 1,
            note: `Round ${s.rounds}: process ${seq(s.layer)}.${s.next.length ? ` Next layer: ${seq(s.next)}.` : ' Next layer is empty.'}`,
            panels: [
              gp(6, LY_E, LY_P, { st: { ...states(before, 'done'), ...states(s.layer, 'active'), ...states(s.next, 'window') }, es: ek(LY_E.filter(([u]) => before.includes(u)), 'muted') }),
              arr(s.layer, { label: 'layer', showIndices: false, highlights: hl(s.layer.length, () => 'active') }),
              vars({ rounds: s.rounds, done: s.done }),
            ],
          };
        }),
        { say: 2, note: `done = ${LY.done} = n: ${LY.rounds} rounds.`, panels: [gp(6, LY_E, LY_P, { st: states([0, 1, 2, 3, 4, 5], 'done') }), vars({ rounds: LY.rounds, done: LY.done, n: 6 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the rounds',
      lines: ['Each round takes every vertex that is ready at the start of it.'],
      panels: [gp(6, LT_E, LT_P), indegArr(kahn(6, LT_E).indeg0)],
      task: { type: 'number', question: 'What does layered Kahn return?', options: [2, 3, 4, 6], answer: LT.result, hint: 'Layer 1 is every vertex with indeg 0. Which vertices does it free?' },
      solved: `Layers {${seq(LT.snaps[0].layer)}}, {${seq(LT.snaps[1].layer)}}, {${seq(LT.snaps[2].layer)}}: 3 rounds.`,
      then: LT.snaps.map((s, k) => ({ say: 0, note: `Round ${s.rounds}: ${seq(s.layer)}.`, panels: [gp(6, LT_E, LT_P, { st: { ...states(LT.snaps.slice(0, k).flatMap((x) => x.layer), 'done'), ...states(s.layer, 'active') } }), vars({ rounds: s.rounds, done: s.done })] })),
    },
  ],

  'implementation-kahn': [
    {
      kind: 'watch',
      title: 'String vertices: register every one',
      lines: ['For string vertices use a `Map` for `adj` and `indeg`.', 'Register vertices with **no** edges too: they must be output.'],
      frames: [
        { say: 0, note: 'Edges a → b and c → b. Vertex d has no edges.', panels: [mpGraph({ 3: 'window' })] },
        { say: 1, note: `Registering only from edges: d is never in the Map. Output ${seq(MP_BAD.order)}.`, panels: [mpGraph({ 3: 'bad' }), table(MP_BAD.indeg0.map(([k]) => k), ['indeg'], MP_BAD.indeg0.map(([, v]) => [v])), arr(MP_BAD.order, { label: 'order' })] },
        { say: 1, note: `Register all four first. d starts at 0. Output ${seq(MP_GOOD.order)}.`, panels: [mpGraph({ 3: 'done' }), table(MP_GOOD.indeg0.map(([k]) => k), ['indeg'], MP_GOOD.indeg0.map(([, v]) => [v]), [[''], [''], [''], ['active']]), arr(MP_GOOD.order, { label: 'order', highlights: { 2: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a duplicate edge',
      lines: ['The edge 0 → 1 appears **twice**.', 'Both copies go into `adj` and into `indeg`.'],
      panels: [gp(3, [[0, 1], [1, 2]], [[0, 0], [1.4, 0], [2.8, 0]], { es: { '0-1': 'active' } }), arr(DUP_E.map((e) => `${e[0]}→${e[1]}`), { label: 'edges', highlights: { 0: 'active', 1: 'active' } })],
      task: { type: 'number', question: 'What is indeg[1] after building?', options: [0, 1, 2, 3], answer: DUP.indeg0[1], hint: 'Every copy of an edge adds one to its head.' },
      solved: 'indeg[1] = 2. Popping 0 walks both copies: 2 → 1 → 0. Consistent, so it works.',
      then: [
        { say: 1, note: `Pop 0: ${decText(DUP.pops[0].decs)}. 1 is pushed once.`, panels: [kGraph(3, [[0, 1], [1, 2]], [[0, 0], [1.4, 0], [2.8, 0]], [], 0, [1]), indegArr(DUP.pops[0].indeg, [1])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the smallest order',
      lines: ['Kahn with a plain queue gives a **valid** order.', 'Sometimes you need the **lexicographically smallest** one.'],
      panels: [gp(4, LX_E, [[0, 0], [0, 1.2], [1.4, 1.2], [1.4, 0]]), arr(LX.order, { label: 'queue order' })],
      task: {
        type: 'choose',
        question: `The queue gives ${seq(LX.order)}. How do you get ${seq(LX_MIN)}?`,
        options: [
          { text: 'Swap the queue for a MinHeap', why: '' },
          { text: 'Sort the final order', why: 'Sorting ignores the edges. With other edges it would put a vertex before its prerequisite.' },
          { text: 'Use a stack instead of the queue', why: `A stack gives ${seq(LX_STACK)}: still valid, but not the smallest.` },
        ],
        answer: 0,
      },
      solved: `A MinHeap always pops the smallest ready vertex: ${seq(LX_MIN)}. Cost O((V + E) log V).`,
    },
  ],

  'optimized-dfs': [
    {
      kind: 'watch',
      title: 'White, gray, black',
      lines: ['**White**: not visited. **Gray**: still inside it. **Black**: finished.', 'Enter `u`: gray. The gray vertices are the open calls: the current path.', 'All neighbours done: black, and append `u` to the post-order.', 'Meeting a **black** vertex again is fine: two routes, no cycle.'],
      frames: [
        { say: 0, note: 'Everything starts white. Gray = purple, black = orange.', panels: [gp(5, D_E, D_P), stk([], 'open calls'), arr([], { label: 'post-order' })] },
        ...D.ev.map((e) => ({ say: dSay(e), note: dNote(e), panels: [dGraph(e), stk(e.path, 'open calls'), arr(e.post, { label: 'post-order', highlights: e.kind === 'finish' ? { [e.post.length - 1]: 'active' } : {} })] })),
      ],
    },
    {
      kind: 'watch',
      title: 'Reverse the post-order',
      lines: ['Every edge u → v: v finishes **before** u.', 'So reversed post-order puts u first.'],
      frames: [
        { say: 0, note: `Post-order: ${seq(D.post)}. 2 finished first.`, panels: [gp(5, D_E, D_P, { st: states([0, 1, 2, 3, 4], 'done') }), arr(D.post, { label: 'post-order' })] },
        { say: 1, note: `Reversed: ${seq(D.order)}. All 5 edges point forward.`, panels: [gp(5, D_E, D_P, { st: states([0, 1, 2, 3, 4], 'done'), es: ek(D_E, 'done') }), arr(D.order, { label: 'topological order', highlights: hl(5, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an edge to a gray vertex',
      lines: ['DFS entered 0, then 1, then 2. All three are gray.', 'Now dfs(2) looks at its edge **2 → 0**.'],
      panels: [gp(3, DC_E, DC_P, { st: { 0: 'active', 1: 'active', 2: 'active' }, es: { '2-0': 'window' } }), stk(DC_BACK.path, 'open calls')],
      task: {
        type: 'choose',
        question: 'What should the DFS do?',
        options: [
          { text: 'Report a cycle: 0 is on the current path', why: '' },
          { text: 'Skip 0, it was already visited', why: 'A plain visited flag would do that. But 0 is gray: its call is still open, so this edge closes a loop.' },
          { text: 'Append 0 to the post-order', why: '0 has not finished: dfs(0) is still waiting for 1 and 2.' },
        ],
        answer: 0,
      },
      solved: 'A path 0 ⇝ 2 plus the edge 2 → 0 is a directed cycle: a back edge.',
      then: [{ say: 1, note: 'Back edge 2 → 0: cycle 0 → 1 → 2 → 0.', panels: [gp(3, DC_E, DC_P, { st: states([0, 1, 2], 'bad'), es: ek(DC_E, 'bad') }), stk(DC_BACK.path, 'open calls')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: post-order, not pre-order',
      lines: ['Edges a → c and b → c. DFS loops a, b, c.', 'It enters a, then c, then later b.'],
      panels: [gp(3, PO_E, PO_P, { lab: PO_LAB })],
      task: { type: 'order', question: 'Tap the reversed post-order.', items: PO.order.map((v) => PO_LAB[v]), hint: 'Finish order: c, then a, then b. Now reverse it.' },
      solved: `b, a, c. Pre-order would give ${PO_PRE.map((v) => PO_LAB[v]).join(', ')}: c before its prerequisite b.`,
      then: [
        { say: 1, note: 'Pre-order a, c, b breaks b → c.', panels: [gp(3, PO_E, PO_P, { lab: PO_LAB, st: { 1: 'bad', 2: 'bad' }, es: { '1-2': 'bad' } }), arr(PO_PRE.map((v) => PO_LAB[v]), { label: 'pre-order', highlights: { 1: 'bad', 2: 'bad' } })] },
        { say: 1, note: 'Reversed post-order b, a, c: both edges point forward.', panels: [gp(3, PO_E, PO_P, { lab: PO_LAB, st: states([0, 1, 2], 'done'), es: ek(PO_E, 'done') }), arr(PO.order.map((v) => PO_LAB[v]), { label: 'reversed post', highlights: hl(3, () => 'done') })] },
      ],
    },
  ],

  'template-dfs': [
    {
      kind: 'watch',
      title: 'topoDfs meets a cycle',
      lines: ['`color` is a `Uint8Array`: 0 white, 1 gray, 2 black.', '`color[v] === GRAY`: back edge, `return false`.', 'The `false` travels up every open call; `topoDfs` returns `null`.'],
      frames: [
        { say: 0, note: 'Edges 0 → 1 → 2 → 3 → 1.', panels: [gp(4, TD_E, TD_P), arr([0, 0, 0, 0], { label: 'color' }), stk([], 'open calls')] },
        ...TD.ev.map((e) => ({
          say: e.kind === 'back' ? 1 : 0,
          note: e.kind === 'back' ? `dfs(${e.u}) sees ${e.v}: color[${e.v}] = 1, gray. Back edge.` : `dfs(${e.u}): color[${e.u}] = 1.`,
          panels: [dGraph(e, { n: 4, edges: TD_E, pos: TD_P }), arr(e.color, { label: 'color', highlights: e.kind === 'back' ? { [e.v]: 'bad' } : { [e.u]: 'active' } }), stk(e.path, 'open calls')],
        })),
        { say: 2, note: 'dfs(3), dfs(2), dfs(1), dfs(0) all return false. Result: null.', panels: [gp(4, TD_E, TD_P, { st: { 1: 'bad', 2: 'bad', 3: 'bad' }, es: ek([[1, 2], [2, 3], [3, 1]], 'bad') }), arr(TD.ev.at(-1).color, { label: 'color' }), vars({ result: 'null' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the next DFS tree',
      lines: ['`for (let i = 0; i < n; i++) if (color[i] === WHITE …) dfs(i)`', 'dfs(0) has just returned.'],
      panels: [gp(5, WS_E, WS_P, { st: Object.fromEntries(WS_AFTER0.map((c, i) => [i, COL[c]])) }), arr(WS_AFTER0, { label: 'color' })],
      task: { type: 'cell', question: 'Which vertex does the loop start the next DFS from?', panel: 1, answer: WS_AFTER0.indexOf(0), hints: { 0: 'color[0] = 2: already black.', 1: 'color[1] = 2: finished inside dfs(0).', 3: 'color[3] = 2: reached from 1.', 4: '4 is white too, but the loop reaches index 2 first.' } },
      solved: 'Index 2 is the first white vertex. dfs(2) then reaches 4; 3 is already black.',
    },
    {
      kind: 'turn',
      title: 'Your turn: how deep?',
      lines: ['Recursion depth can reach n.', 'For long chains with n in the tens of thousands, prefer Kahn in JavaScript.'],
      panels: [gp(CH_N, CH_E, Array.from({ length: CH_N }, (_, i) => [i, 0]))],
      task: { type: 'number', question: 'At the deepest moment, how many dfs calls are open at once?', options: [1, 3, 5, 6], answer: CH_DEPTH, hint: 'dfs(0) calls dfs(1), which calls dfs(2)… none returns until the end of the chain.' },
      solved: 'All 6: dfs(0) … dfs(5) are open together. A chain of 10^5 would mean 10^5 open calls.',
      then: [{ say: 0, note: 'Every vertex gray at once: the whole chain is on the call stack.', panels: [gp(CH_N, CH_E, Array.from({ length: CH_N }, (_, i) => [i, 0]), { st: states([0, 1, 2, 3, 4, 5], 'active') }), stk([0, 1, 2, 3, 4, 5], 'open calls')] }],
    },
  ],

  'optimized-dag-dp': [
    {
      kind: 'watch',
      title: 'Earliest finish, in Kahn order',
      lines: ['Course v starts when **all** its prerequisites are done.', '`finish[v] = time[v] + max(finish[u])`, relaxed edge by edge in Kahn order.', 'The answer is `max(finish)`.'],
      frames: [
        { say: 0, note: 'Start with finish = time. Sources 0 and 1 start at time 0.', panels: [dpGraph([], undefined), arr(DP_T, { label: 'time' }), finArr(DP_T)] },
        ...DP.pops.slice(0, 2).map(dpFrame),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: finish[4]',
      lines: ['4 needs both 2 and 3.', `Now finish[2] = ${DP.pops[1].finish[2]} and finish[3] = ${DP.pops[1].finish[3]}. time[4] = ${DP_T[4]}.`],
      panels: [dpGraph([0, 1], undefined, []), arr(DP_T, { label: 'time' }), finArr(DP.pops[1].finish, [2, 3])],
      task: { type: 'number', question: 'What is finish[4]?', options: [7, 9, 11, 14], answer: DP.finish[4], hint: 'Start after the slower prerequisite, then add time[4].' },
      solved: `max(${DP.finish[2]}, ${DP.finish[3]}) + ${DP_T[4]} = ${DP.finish[4]}. The answer is max(finish) = ${DP.answer}.`,
      then: [...DP.pops.slice(2).map(dpFrame), { say: 0, note: `max(finish) = ${DP.answer}: the critical path 1 → 2 → 4.`, panels: [gp(5, DP_E, DP_P, { st: states([1, 2, 4], 'done'), es: ek([[1, 2], [2, 4]], 'done') }), finArr(DP.finish, [4])] }],
    },
    {
      kind: 'watch',
      title: 'Ancestor sets for "is a a prerequisite of b?"',
      lines: ['Walk in topological order.', 'For each edge u → v: `ancestors[v] ∪= ancestors[u] ∪ {u}`.', 'Every query is now a Set lookup.'],
      frames: [
        { say: 0, note: `Kahn order: ${seq(AN.order)}.`, panels: [gp(4, AN_E, AN_P), ancTable([[], [], [], []], -1), arr(AN.order, { label: 'topo order' })] },
        ...AN.snaps.map((s) => ({
          say: 1,
          note: `Edge ${s.u} → ${s.v}: ancestors[${s.v}] gets ancestors[${s.u}] plus ${s.u}.`,
          panels: [gp(4, AN_E, AN_P, { st: { [s.u]: 'active', [s.v]: 'window' }, es: { [`${s.u}-${s.v}`]: 'active' } }), ancTable(s.anc, s.v), arr(AN.order, { label: 'topo order', highlights: { [AN.order.indexOf(s.u)]: 'active' } })],
        })),
        { say: 2, note: 'Is 0 a prerequisite of 2? ancestors[2].has(0): yes.', panels: [gp(4, AN_E, AN_P, { st: { 0: 'done', 2: 'active' } }), ancTable(AN.snaps.at(-1).anc, 2)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a hidden DAG',
      lines: ['Grid, longest increasing path.', 'You may only move to a **strictly larger** neighbour.'],
      panels: [{ kind: 'grid', cells: [['3', '4', '5'], ['2', '1', '6'], ['9', '8', '7']], label: 'values' }],
      task: {
        type: 'choose',
        question: 'Why is this a longest path in a DAG?',
        options: [
          { text: 'Every move goes to a larger value, so no walk can come back', why: '' },
          { text: 'Grid cells never form cycles', why: 'Neighbouring cells touch both ways. Only the strictly-larger rule rules out loops.' },
          { text: 'DFS colours remove the cycles first', why: 'Colours detect cycles. They never remove them.' },
        ],
        answer: 0,
      },
      solved: 'Strictly increasing moves can never loop. Solve it with memoised DFS or Kahn by value.',
    },
  ],

  'optimized-leaf-trimming': [
    {
      kind: 'watch',
      title: 'Peel all leaves at once',
      lines: ['A **leaf** (degree 1) is at the very edge: a bad root.', 'Remove **all** current leaves; neighbours lose degree.', 'Stop when at most **2** vertices remain.'],
      frames: [
        { say: 0, note: `Leaves: ${seq(TR.rounds[0].leaves)}.`, panels: [trGraph([], TR.rounds[0].leaves), arr(TR.adj.map((a) => a.length), { label: 'degree', highlights: hl(7, (i) => (TR.rounds[0].leaves.includes(i) ? 'active' : '')) }), vars({ remaining: 7 })] },
        ...TR.rounds.map((r, k) => {
          const removed = [...r.before, ...r.leaves];
          const next = TR.rounds[k + 1]?.leaves ?? [];
          return {
            say: k === TR.rounds.length - 1 ? 2 : 1,
            note: `Remove ${seq(r.leaves)}. ${r.remaining} left.${next.length ? ` New leaves: ${seq(next)}.` : ' At most 2: stop.'}`,
            panels: [
              trGraph(removed, next, next.length ? [] : TR.centers),
              arr(r.deg.map((d, i) => (removed.includes(i) ? '·' : d)), { label: 'degree', highlights: hl(7, (i) => (removed.includes(i) ? 'muted' : next.includes(i) ? 'active' : '')) }),
              vars({ remaining: r.remaining }),
            ],
          };
        }),
      ],
    },
    {
      kind: 'watch',
      title: 'Check against brute force',
      lines: ['Brute force: BFS from every vertex and take its height.', 'That is n BFS runs: O(n²).'],
      frames: [
        { say: 0, note: 'Height = farthest vertex from the root.', panels: [trGraph([], [], [2]), table(TR_H.map((_, i) => String(i)), ['height'], TR_H.map((h) => [h]), TR_H.map((h, i) => [i === 2 ? 'done' : ''])) ] },
        { say: 1, note: `7 BFS runs. Minimum height ${Math.min(...TR_H)}, at vertex 2: the same answer trimming found.`, panels: [vars({ runs: 7, best: 2, height: Math.min(...TR_H) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: trim this tree',
      lines: ['Peel leaves layer by layer.', 'Stop at most 2 vertices.'],
      panels: [trGraph([], [])],
      task: {
        type: 'choose',
        question: 'Which roots give the minimum height?',
        options: [
          { text: '2 and 3', why: '' },
          { text: 'Only 2', why: '2 has 3 children, but height is about the farthest vertex. Rooted at 3, the height is also 3.' },
          { text: '1, 2, 3 and 4', why: 'That is after one round. 1 and 4 are leaves now, so peel again.' },
        ],
        answer: 0,
      },
      solved: 'The longest path 0 … 5 has 6 vertices: its middle is the edge 2–3. Both give height 3.',
      then: TT.rounds.map((r, k) => {
        const removed = [...r.before, ...r.leaves];
        const next = TT.rounds[k + 1]?.leaves ?? [];
        return { say: 0, note: `Remove ${seq(r.leaves)}: ${r.remaining} left.`, panels: [trGraph(removed, next, next.length ? [] : TT.centers, TT_P, 7, TT_E)] };
      }),
    },
  ].map((s) => (s.kind === 'turn' ? { ...s, panels: [trGraph([], [], [], TT_P, 7, TT_E)] } : s)),

  template: [
    {
      kind: 'watch',
      title: 'Model, build, sort, use',
      lines: ['**Model**: vertices, and edges "first → later".', '**Build** `adj` and `indeg` (1-based input: subtract 1).', '**Sort** with Kahn.', '**Use** the order: here, a DP for the earliest finish.'],
      frames: [
        { say: 0, note: 'relations [[1,3], [2,3], [3,4]]: [prev, next].', panels: [gp(4, TP_E, TP_P, { lab: TP_LAB }), arr(TP_T, { label: 'time' })] },
        { say: 1, note: `adj[a - 1].push(b - 1): indeg = ${list(kahn(4, TP_E).indeg0)}. finish = time.slice().`, panels: [gp(4, TP_E, TP_P, { lab: TP_LAB }), arr(kahn(4, TP_E).indeg0, { label: 'indeg', indexBase: 1, highlights: { 2: 'active', 3: 'active' } }), finArr(TP_T, [], 1)] },
        ...TP.pops.map((p) => ({
          say: p.rel.length ? 3 : 2,
          note: `Pop vertex ${p.u + 1}.${p.rel.map((r) => ` Vertex ${r.v + 1}: max(${r.before}, ${p.finish[p.u]} + ${TP_T[r.v]}) = ${r.after}.`).join('') || ' No outgoing edges.'}`,
          panels: [gp(4, TP_E, TP_P, { lab: TP_LAB, st: { ...states(TP.queue.slice(0, p.head), 'done'), [p.u]: 'active' }, es: ek(p.rel.map((r) => [p.u, r.v]), 'active') }), que(p.queue.slice(p.head + 1).map((v) => v + 1)), finArr(p.finish, p.rel.map((r) => r.v), 1)],
        })),
        { say: 3, note: `Math.max(...finish) = ${TP.answer}.`, panels: [gp(4, TP_E, TP_P, { lab: TP_LAB, st: states([1, 2, 3], 'done'), es: ek([[1, 2], [2, 3]], 'done') }), finArr(TP.finish, [3], 1)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 1-based input',
      lines: ['relations are 1-based: `[prev, next]`.', 'The code does `indeg[b - 1]++`.'],
      panels: [indegArr([0, 0, 0]), arr(['[3, 1]'], { label: 'relation', showIndices: false })],
      task: { type: 'cell', question: 'For relation [3, 1], which indeg cell grows?', answer: 0, hints: { 1: 'That would be vertex 2. The head here is vertex 1.', 2: 'Index 2 is vertex 3, the tail. In-degree grows at the head.' } },
      solved: 'b = 1, so indeg[0]++. Vertex 1 now waits for vertex 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: why copy time?',
      lines: ['`const finish = time.slice();`', 'Sources are never relaxed by any edge.'],
      panels: [gp(4, TP_E, TP_P, { lab: TP_LAB, st: { 0: 'active', 1: 'active' } }), finArr(TP_T, [0, 1], 1)],
      task: {
        type: 'choose',
        question: 'What is the finish time of vertex 1, a source?',
        options: [
          { text: 'Its own time, 1', why: '' },
          { text: '0', why: 'That would claim the course takes no time. finish[v] is at least its own duration.' },
          { text: 'It stays unknown until an edge reaches it', why: 'No edge ever reaches a source. Its value must be right from the start.' },
        ],
        answer: 0,
      },
      solved: 'finish[v] ≥ its own duration, so start from a copy of time.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'findOrder, start to finish',
      lines: ['`[course, pre]`: pre comes first, so `adj[pre].push(course)`.', 'Kahn with `order` as the queue.', '`order.length === numCourses` → order, else `[]`.'],
      frames: [
        ...FO_PRE.map(([c, p], k) => ({
          say: 0,
          note: `[${c}, ${p}]: edge ${p} → ${c}, indeg[${c}]++.`,
          panels: [gp(4, FO_E.slice(0, k + 1), FO_P, { st: { [p]: 'active', [c]: 'window' }, es: { [`${p}-${c}`]: 'active' } }), indegArr(kahn(4, FO_E.slice(0, k + 1)).indeg0, [c])],
        })),
        { say: 1, note: `Seed: ${seq(FO.seeds)}.`, panels: [kGraph(4, FO_E, FO_P, [], undefined, FO.seeds), indegArr(FO.indeg0, FO.seeds), orderArr(FO.seeds, 0, 4)] },
        ...FO.pops.map((p) => ({ say: 1, note: `head = ${p.head}: pop ${p.u}, ${decText(p.decs)}.${p.pushed.length ? ` Push ${seq(p.pushed)}.` : ''}`, panels: [kGraph(4, FO_E, FO_P, p.order.slice(0, p.head), p.u, p.order.slice(p.head + 1)), indegArr(p.indeg, p.decs.map((d) => d.v)), orderArr(p.order, p.head, 4)] })),
        { say: 2, note: `4 === numCourses: return ${list(FO.order)}.`, panels: [orderArr(FO.order, 4, 4), vars({ length: 4, numCourses: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: impossible courses',
      lines: ['numCourses = 2, prerequisites = [[0, 1], [1, 0]].'],
      panels: [gp(2, [[1, 0], [0, 1]], [[0, 0], [1.6, 0]]), indegArr([1, 1])],
      task: {
        type: 'choose',
        question: 'What does findOrder return?',
        options: [
          { text: '[]', why: '' },
          { text: '[0, 1]', why: 'Neither course ever reaches in-degree 0, so nothing is output.' },
          { text: 'null', why: 'The template topoOrder returns null. This findOrder returns an empty array.' },
        ],
        answer: 0,
      },
      solved: 'No sources: order stays empty, 0 !== 2, so `[]`.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: "Kahn on the lesson's graph",
      lines: ['Edges 0→2, 1→2, 1→3, 2→4, 3→4, 4→5.', 'Each pop decrements its out-neighbours and pushes any 0.', '6 = n: valid, no cycle. 6 edges, 6 decrements.'],
      frames: [
        { say: 0, note: `(start) indeg = [${DRY.indeg0.join(',')}]. Pushed: ${seq(DRY.seeds)}.`, panels: [kGraph(6, E6, P6, [], undefined, DRY.seeds), indegArr(DRY.indeg0, DRY.seeds), orderArr(DRY.seeds, 0, 6)] },
        ...DRY.pops.slice(0, -1).map((p) => dryFrame(p, 1)),
        { ...dryFrame(DRY.pops.at(-1), 2), note: `Pop 5: —. Order has 6 = n vertices: valid, no cycle.` },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: add one edge',
      lines: ['Same graph, plus one edge **5 → 0**.', 'Now 0 starts with in-degree 1.'],
      panels: [gp(6, [...E6, [5, 0]], P6, { es: { '5-0': 'bad' } }), indegArr(DRY2.indeg0, [0])],
      task: { type: 'number', question: 'How many vertices does Kahn output now?', options: [2, 3, 4, 6], answer: DRY2.order.length, hint: 'Only 1 starts at 0. Follow what popping 1, then 3, frees.' },
      solved: 'Only 1 and 3. 2 waits for 0, and 0 waits for 5: the cycle 0 → 2 → 4 → 5 → 0.',
      then: [...DRY2.pops.map((p) => popFrame(6, [...E6, [5, 0]], P6, DRY2, p, 0)), { say: 0, note: '2 < 6: a cycle.', panels: [kGraph(6, [...E6, [5, 0]], P6, DRY2.order, undefined, [], { st: states([0, 2, 4, 5], 'bad') }), indegArr(DRY2.indeg, [], { muted: DRY2.order })] }],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Leftovers: on a cycle, or behind one',
      lines: ['Forgetting the cycle check: Kahn silently returns a partial order.', 'A vertex **downstream** of a cycle never reaches 0 either.', 'So leftovers are "on a cycle or downstream of one".'],
      frames: [
        { say: 0, note: `Edges include 1 → 2 → 1 and 2 → 5. indeg = ${list(MS.indeg0)}.`, panels: [kGraph(6, MS_E, MS_P, [], undefined, MS.seeds), indegArr(MS.indeg0, MS.seeds)] },
        ...MS.pops.map((p) => ({ ...popFrame(6, MS_E, MS_P, MS, p, 0), panels: popFrame(6, MS_E, MS_P, MS, p, 0).panels.slice(0, 2) })),
        { say: 0, note: `Kahn stops with ${seq(MS.order)}: only 3 of 6. Compare the length with n = 6.`, panels: [kGraph(6, MS_E, MS_P, MS.order, undefined, []), vars({ order: MS.order.length, n: 6 })] },
        { say: 1, note: '5 is not on the cycle. It waits for 2, which is never popped.', panels: [kGraph(6, MS_E, MS_P, MS.order, undefined, [], { st: { 1: 'bad', 2: 'bad', 5: 'window' } }), indegArr(MS.indeg, [5], { muted: MS.order })] },
        { say: 2, note: 'Leftovers 1, 2, 5. For exactly the cycle vertices, use DFS colours or peel the reverse graph.', panels: [kGraph(6, MS_E, MS_P, MS.order, undefined, [], { st: { 1: 'bad', 2: 'bad', 5: 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the leftovers',
      lines: ['A cycle 1 → 2 → 3 → 1, with a tail 3 → 4 → 5.'],
      panels: [gp(6, MT_E, MT_P), indegArr(MT.indeg0)],
      task: { type: 'number', question: 'How many vertices does Kahn never output?', options: [2, 3, 5, 6], answer: 6 - MT.order.length, hint: 'Only 0 is ever ready. Everything after the cycle is stuck too.' },
      solved: 'Five: 1, 2, 3 on the cycle, and 4, 5 downstream of it.',
      then: [{ say: 0, note: 'Only 0 is output.', panels: [kGraph(6, MT_E, MT_P, [0], undefined, [], { st: states([1, 2, 3, 4, 5], 'bad') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: which mistake?',
      lines: ['n = 4. Edges 0 → 1 → 2. Vertex 3 has no edges.', `The code returned ${list([0, 1, 2])}.`],
      panels: [gp(4, ISO_E, ISO_P, { st: { 3: 'bad' } }), arr([0, 1, 2], { label: 'returned' })],
      task: {
        type: 'choose',
        question: 'Which mistake is this?',
        options: [
          { text: 'Missing isolated vertices', why: '' },
          { text: 'Wrong edge direction', why: '0, 1, 2 respects every edge. The problem is a vertex that is absent.' },
          { text: 'Pre-order instead of reversed post-order', why: 'That puts a vertex before its prerequisite. Here one is simply missing.' },
        ],
        answer: 0,
      },
      solved: 'Vertices with no edges have in-degree 0: seed them, they belong in the order.',
    },
    {
      kind: 'turn',
      title: 'Your turn: an invalid dictionary',
      lines: ['Alien dictionary. The words are claimed to be sorted.'],
      panels: [arr(['abc', 'ab'], { label: 'sorted words' })],
      task: {
        type: 'choose',
        question: 'What should you return?',
        options: [
          { text: 'Impossible: a word before its own proper prefix', why: '' },
          { text: 'The letters a, b, c', why: 'No letter pair differs, so no rule is learned. But "abc" before "ab" breaks any alphabet.' },
          { text: 'Any order of the letters', why: 'This input is invalid. It has no answer at all.' },
        ],
        answer: 0,
      },
      solved: '"abc" before "ab" is impossible in any alphabet. Check this edge case first.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: "any valid order"',
      lines: ['The order is usually **not unique**.', 'Validate by checking every edge.'],
      panels: [gp(4, AV_E, [[0, 0], [0, 1.4], [1.4, 0.7], [2.8, 0.7]]), arr([0, 1, 2, 3], { label: 'expected' }), arr([1, 0, 2, 3], { label: 'yours' })],
      task: {
        type: 'choose',
        question: 'Your order differs from the expected one. What do you say?',
        options: [
          { text: 'Both are valid: every edge points forward in each', why: '' },
          { text: 'Mine is wrong because it does not match', why: '0 and 1 have no edge between them, so either may come first.' },
          { text: 'Sort mine so it matches', why: 'Sorting is not a check. Checking every edge u → v is.' },
        ],
        answer: 0,
      },
      solved: 'Tell the interviewer the order is not unique, and verify edges instead of comparing lists.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a self-loop',
      lines: ['Edge cases: no edges, **self-loop**, duplicates, disconnected vertices, n = 1.', 'Here prerequisites contain `[2, 2]`.'],
      panels: [gp(3, SL_E, [[0, 0], [1.4, 0], [2.8, 0]], { st: { 2: 'bad' } }), indegArr(SL.indeg0, [2])],
      task: { type: 'number', question: 'How many vertices does Kahn output?', options: [0, 1, 2, 3], answer: SL.order.length, hint: 'Vertex 2 waits for itself. Its counter can never reach 0.' },
      solved: 'Only 0 and 1. A self-loop is immediately impossible.',
    },
    {
      kind: 'turn',
      title: 'Your turn: no edges at all',
      lines: ['n = 3 and no edges.', 'Every line-up has zero edges to break.'],
      panels: [gp(3, [], [[0, 0], [1.4, 0], [2.8, 0]])],
      task: { type: 'number', question: 'How many valid topological orders are there?', options: [1, 3, 6, 9], answer: 6, hint: 'With no edges, any permutation works. Count permutations of 3.' },
      solved: '3! = 6: any permutation is valid.',
    },
  ],
};

// a turn's `then` frames link to the turn's own (shorter) lines; drop links that point past them
for (const sec of Object.values(steps))
  for (const st of sec)
    if (st.kind === 'turn' && st.then) st.then = st.then.map(({ say, ...f }) => (say !== undefined && say < st.lines.length ? { say, ...f } : f));

export default steps;
