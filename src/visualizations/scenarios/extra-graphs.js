import { layoutCircle } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
const fmt = (d) => (d === Infinity ? '∞' : d);

// Edge states are keyed by edge INDEX (safe with parallel edges).
function graph(n, edges, { states = {}, edgeStates = {}, directed = false, weights = false, label } = {}) {
  const pos = layoutCircle(n);
  const panel = {
    kind: 'nodes',
    nodes: pos.map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: states[p.id] || '' })),
    edges: edges.map(([a, b, w], i) => {
      const e = { from: a, to: b, state: edgeStates[i] || '' };
      if (weights) e.label = String(w);
      return e;
    }),
    directed,
    freeLayout: true,
  };
  if (label) panel.label = label;
  return panel;
}

// Sanitise user input: clamp n, drop invalid edges, coerce weights, clamp start. Never mutates input.
function cleanGraph(input, { maxN = 8, maxE = 16, weighted = true, zeroOne = false } = {}) {
  const n = Math.max(0, Math.min(maxN, Math.floor(Number(input && input.n)) || 0));
  const raw = Array.isArray(input && input.edges) ? input.edges : [];
  const edges = raw
    .filter((e) => Array.isArray(e) && e.length >= 2 && [e[0], e[1]].every((x) => Number.isInteger(x) && x >= 0 && x < n))
    .slice(0, maxE)
    .map((e) => {
      let w = weighted ? Number(e[2]) : 1;
      if (!Number.isFinite(w)) w = 1;
      if (zeroOne) w = w > 0 ? 1 : 0;
      return [e[0], e[1], w];
    });
  const start = n ? Math.max(0, Math.min(n - 1, Math.floor(Number(input && input.start)) || 0)) : 0;
  return { n, edges, start };
}

const weightedFields = (withStart, edgeLabel = 'edges [u, v, w]') => [
  { key: 'n', type: 'number', label: 'n (max 8)' },
  { key: 'edges', type: 'json', label: edgeLabel },
  ...(withStart ? [{ key: 'start', type: 'number', label: 'start' }] : []),
];

// Put the correct option at a chosen position so answers are not always index 0.
function placeAnswer(correct, distractors, pos) {
  const opts = distractors.filter((d) => d !== correct).filter((d, i, a) => a.indexOf(d) === i).slice(0, 3);
  const at = pos % (opts.length + 1);
  opts.splice(at, 0, correct);
  return { options: opts, answer: at };
}

const MST_DEFAULT = { n: 6, edges: [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [3, 4, 2], [4, 5, 6], [3, 5, 5]] };

/* ------------------------------------------------------------------ Kruskal */
export const kruskal = {
  title: "Kruskal's minimum spanning tree",
  description: 'Sort edges by weight; take each edge unless union-find says it would close a cycle. (n ≤ 8, ≤ 16 edges.)',
  defaultInput: MST_DEFAULT,
  fields: weightedFields(false, 'undirected edges [u, v, w]'),
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 5, edges: [[0, 1, 2], [1, 2, 2], [0, 2, 2], [3, 4, 1]] },
    { n: 4, edges: [[0, 1, 1], [0, 1, 1], [1, 2, 3], [2, 3, 3], [3, 0, 3], [2, 2, 0]] },
    { n: 3, edges: [[0, 1, -2], [1, 2, 5], [0, 2, 1]] },
  ],
  generate(input) {
    const { n, edges } = cleanGraph(input);
    const order = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2] || a - b);
    const labels = order.map((i) => `${edges[i][0]}-${edges[i][1]}:${edges[i][2]}`);
    const parent = Array.from({ length: n }, (_, i) => i);
    const size = new Array(n).fill(1);
    const find = (x) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const edgeStates = {};
    const listHl = {};
    const frames = [];
    let total = 0;
    let taken = 0;
    const snap = (note, { cur, states = {}, predict } = {}) => {
      const f = {
        note,
        panels: [
          graph(n, edges, { weights: true, states, edgeStates: { ...edgeStates } }),
          arr([...labels], { label: 'edges sorted by weight (u-v:w)', highlights: { ...listHl, ...(cur !== undefined ? { [cur]: 'active' } : {}) }, pointers: cur !== undefined ? [{ index: cur, label: 'current', color: 'a' }] : [] }),
          arr([...parent], { label: 'union-find parent' }),
          vars({ 'tree edges': taken, 'total weight': total }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(n === 0 ? 'Empty graph: there is nothing to connect.' : `Sort all ${edges.length} edges by weight. Every node starts as its own component (parent[i] = i). We greedily try the cheapest edge first.`);
    let asked = 0;
    let rejectAsked = false;
    for (let k = 0; k < order.length; k++) {
      if (taken === n - 1) {
        for (let r = k; r < order.length; r++) listHl[r] = 'muted';
        snap(`We already have n − 1 = ${n - 1} edges, so the tree is complete. The remaining ${order.length - k} edge(s) are never needed.`);
        break;
      }
      const i = order[k];
      const [u, v, w] = edges[i];
      const ru = find(u);
      const rv = find(v);
      const accept = ru !== rv;
      let predict;
      if (k % 2 === 1 || (!accept && !rejectAsked)) {
        if (!accept) rejectAsked = true;
        predict = ask(`Edge ${u}-${v} (w=${w}) is next. Accept or reject this edge?`, ['Accept it', 'Reject it'], accept ? 0 : 1, 'Compare find(u) and find(v): same root means they are already connected.');
        asked++;
      }
      if (accept) {
        let big = ru;
        let small = rv;
        if (size[big] < size[small]) [big, small] = [small, big];
        parent[small] = big;
        size[big] += size[small];
        total += w;
        taken++;
        edgeStates[i] = 'done';
        listHl[k] = 'done';
        snap(`Edge ${u}-${v} (w=${w}): find(${u}) = ${ru}, find(${v}) = ${rv} → different components, so no cycle. Accept it: it is the cheapest edge crossing between those components (cut property). Total = ${total}.`, { cur: k, states: { [u]: 'active', [v]: 'active' }, predict });
      } else {
        edgeStates[i] = 'muted';
        listHl[k] = 'bad';
        snap(`Edge ${u}-${v} (w=${w}): find(${u}) = find(${v}) = ${ru} → ${u === v ? 'a self-loop' : `${u} and ${v} are already connected by cheaper edges`}, so adding it would close a cycle. Reject.`, { cur: k, states: { [u]: 'bad', [v]: 'bad' }, predict });
      }
    }
    const comps = new Set(parent.map((_, i) => find(i))).size;
    const all = Object.fromEntries(parent.map((_, i) => [i, 'done']));
    if (n === 0) snap('No nodes → the MST is empty with total weight 0.');
    else if (comps === 1) snap(`MST complete: ${taken} edges, total weight ${total}. Sorting dominates → O(E log E); each union-find call is almost O(1).`, { states: all });
    else snap(`The graph has ${comps} separate components, so no single spanning tree exists. We get a minimum spanning FOREST of ${taken} edge(s), total weight ${total}. O(E log E).`, { states: all });
    return frames;
  },
};

/* ------------------------------------------------------------------ Prim */
export const prim = {
  title: "Prim's minimum spanning tree",
  description: 'Grow one tree from the start node, always adding the cheapest edge that leaves the tree (min-heap). (n ≤ 8, ≤ 16 edges.)',
  defaultInput: { ...MST_DEFAULT, start: 0 },
  fields: weightedFields(true, 'undirected edges [u, v, w]'),
  testInputs: [
    { n: 0, edges: [], start: 0 },
    { n: 1, edges: [], start: 0 },
    { n: 5, edges: [[0, 1, 3], [1, 2, 1], [3, 4, 2]], start: 0 },
    { n: 4, edges: [[0, 1, 2], [0, 2, 2], [0, 3, 2], [1, 2, 2], [2, 3, 2]], start: 2 },
    { n: 3, edges: [[0, 1, 5], [0, 1, 1], [1, 2, 4], [0, 2, 3]], start: 9 },
  ],
  generate(input) {
    const { n, edges, start } = cleanGraph(input);
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([a, b, w], i) => {
      adj[a].push({ to: b, w, i });
      if (a !== b) adj[b].push({ to: a, w, i });
    });
    const inTree = new Array(n).fill(false);
    const heap = [];
    const edgeStates = {};
    const frames = [];
    let total = 0;
    let count = 0;
    const sortHeap = () => heap.sort((x, y) => x.w - y.w || x.v - y.v || x.u - y.u);
    const name = (e) => `${e.u}-${e.v} (w=${e.w})`;
    const states = (extra = {}) => ({ ...Object.fromEntries(inTree.map((t, i) => [i, t ? 'done' : '']).filter(([, s]) => s)), ...extra });
    const snap = (note, extra, predict) => {
      sortHeap();
      const f = {
        note,
        panels: [
          graph(n, edges, { weights: true, states: states(extra), edgeStates: { ...edgeStates } }),
          { kind: 'queue', label: 'min-heap of crossing edges (w: u-v)', values: heap.map((e) => `${e.w}: ${e.u}-${e.v}`) },
          vars({ 'nodes in tree': count, 'total weight': total }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (n === 0) {
      snap('Empty graph: there is no node to start from.');
      snap('Nothing to span → MST weight 0.');
      return frames;
    }
    const pushFrom = (u) => {
      const pushed = [];
      for (const { to, w, i } of adj[u]) {
        if (!inTree[to]) {
          heap.push({ w, u, v: to, i });
          pushed.push(`${u}-${to}`);
        }
      }
      return pushed;
    };
    inTree[start] = true;
    count = 1;
    const first = pushFrom(start);
    snap(`Start the tree at node ${start}. Push every edge leaving it into the min-heap${first.length ? `: ${first.join(', ')}` : ' (it has none)'}.`, { [start]: 'active' });
    let adds = 0;
    while (heap.length) {
      sortHeap();
      const e = heap[0];
      if (inTree[e.v]) {
        heap.shift();
        snap(`Pop ${name(e)}: node ${e.v} is already in the tree, so this is a stale entry (both ends inside → it would make a cycle). Skip it.`, { [e.v]: 'bad' });
        continue;
      }
      // Predict: which crossing edge is chosen? Distractors are other live crossing edges with a different weight.
      const others = heap.slice(1).filter((x) => !inTree[x.v] && x.w !== e.w).map(name);
      let predict;
      if (others.length && adds % 2 === 0) {
        const { options, answer } = placeAnswer(name(e), others, adds / 2 + 1);
        predict = ask('Which edge is chosen next?', options, answer, 'Prim always takes the lightest edge that crosses from the tree to a new node.');
      }
      heap.shift();
      inTree[e.v] = true;
      count++;
      adds++;
      total += e.w;
      edgeStates[e.i] = 'done';
      const pushed = pushFrom(e.v);
      snap(`Cheapest edge leaving the tree is ${name(e)} → add node ${e.v}. Total = ${total}. ${pushed.length ? `Push ${e.v}'s edges to outside nodes: ${pushed.join(', ')}.` : `${e.v} has no edges to outside nodes.`}`, { [e.v]: 'active' }, predict);
    }
    const note = 'Unlike Dijkstra (heap keyed by total path distance from the start), Prim keys the heap by the single edge weight: it only cares about the cheapest way to attach each node. O(E log E) with a heap.';
    if (count === n) snap(`Heap empty. All ${n} node(s) are in the tree: MST weight ${total}. ${note}`);
    else snap(`Heap empty, but ${n - count} node(s) were never reached — the graph is disconnected, so Prim only spans ${start}'s component (weight ${total}). ${note}`);
    return frames;
  },
};

/* ------------------------------------------------------------------ Bellman-Ford */
export const bellmanFord = {
  title: 'Bellman-Ford shortest paths',
  description: 'Relax every directed edge V − 1 times; one more round detects a negative cycle. Works with negative weights. (n ≤ 8, ≤ 16 edges.)',
  defaultInput: { n: 5, edges: [[0, 1, 6], [0, 2, 7], [1, 2, 8], [1, 3, 5], [1, 4, -4], [2, 3, -3], [2, 4, 9], [3, 1, -2], [4, 0, 2], [4, 3, 7]], start: 0 },
  fields: weightedFields(true, 'directed edges [from, to, w] (w may be negative)'),
  testInputs: [
    { n: 4, edges: [[0, 1, 1], [1, 2, -1], [2, 3, -1], [3, 1, -1]], start: 0 },
    { n: 0, edges: [], start: 0 },
    { n: 1, edges: [], start: 0 },
    { n: 5, edges: [[0, 1, 2], [1, 2, -1], [3, 4, -5], [4, 3, -5]], start: 0 },
    { n: 3, edges: [[0, 1, 4], [0, 1, 1], [1, 2, 2]], start: 0 },
  ],
  generate(input) {
    const { n, edges, start } = cleanGraph(input);
    const dist = new Array(n).fill(Infinity);
    const pred = new Array(n).fill(-1);
    if (n) dist[start] = 0;
    const frames = [];
    const snap = (note, { edge, states = {}, distHl = {}, edgeStates, predict, round } = {}) => {
      const es = edgeStates || (edge !== undefined ? { [edge]: 'done' } : {});
      const f = {
        note,
        panels: [
          graph(n, edges, { directed: true, weights: true, states, edgeStates: es }),
          arr(dist.map(fmt), { label: 'dist', highlights: distHl }),
          vars({ round: round ?? '-', 'max rounds (V − 1)': Math.max(0, n - 1) }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (n === 0) {
      snap('Empty graph: no nodes, no distances.');
      snap('Nothing to relax. O(V·E) in general.');
      return frames;
    }
    snap(`dist[${start}] = 0, everything else ∞. A shortest path uses at most V − 1 = ${n - 1} edges, so ${n - 1} rounds of relaxing every edge are enough.`, { states: { [start]: 'active' }, round: 0 });
    let relaxCount = 0;
    let stoppedEarly = false;
    for (let r = 1; r <= n - 1; r++) {
      let changes = 0;
      edges.forEach(([u, v, w], i) => {
        if (dist[u] === Infinity || dist[u] + w >= dist[v]) return;
        const old = dist[v];
        dist[v] = dist[u] + w;
        pred[v] = i;
        changes++;
        let predict;
        if (relaxCount % 2 === 0) {
          const { options, answer } = placeAnswer(String(dist[v]), [String(fmt(old)), String(w), String(dist[u])], relaxCount / 2);
          predict = ask(`Round ${r}: relax edge ${u}→${v} (w=${w}). What is dist[${v}] after this step?`, options, answer, 'If dist[u] + w beats dist[v], dist[v] becomes dist[u] + w.');
        }
        relaxCount++;
        snap(`Round ${r}, edge ${u}→${v}: dist[${u}] + ${w} = ${dist[v]} < ${fmt(old)} → update dist[${v}] = ${dist[v]}.`, { edge: i, states: { [u]: 'active', [v]: 'visited' }, distHl: { [v]: 'active' }, round: r, predict });
      });
      if (changes === 0) {
        stoppedEarly = true;
        snap(`Round ${r}: checked all ${edges.length} edges and nothing changed. Distances are stable, so we can stop early — later rounds would change nothing either (and no negative cycle is reachable).`, {
          round: r,
          distHl: Object.fromEntries(dist.map((_, i) => [i, 'done'])),
          predict: r > 1 ? ask(`Round ${r} is about to start. Will any distance change?`, ['Yes, something shrinks', 'No, nothing changes'], 1) : undefined,
        });
        break;
      }
      snap(`End of round ${r}: ${changes} distance(s) improved. ${r < n - 1 ? 'Something changed, so run another round.' : 'That was the last of the V − 1 rounds.'}`, { round: r });
    }
    if (!stoppedEarly) {
      const bad = edges.findIndex(([u, v, w]) => dist[u] !== Infinity && dist[u] + w < dist[v]);
      const q = ask(`After ${n - 1} round(s), one extra check round runs. Can any edge still improve a distance?`, ['Yes — a negative cycle exists', 'No — distances are final'], bad >= 0 ? 0 : 1, 'Real shortest paths never need more than V − 1 edges.');
      if (bad >= 0) {
        const [u, v, w] = edges[bad];
        snap(`Extra round: edge ${u}→${v} (w=${w}) can STILL lower dist[${v}] (${dist[u]} + ${w} < ${dist[v]}). After V − 1 rounds that is only possible with a negative cycle reachable from ${start} — shortest paths are undefined (−∞). O(V·E).`, { edge: bad, states: { [u]: 'bad', [v]: 'bad' }, distHl: { [v]: 'bad' }, round: n, predict: q });
        return frames;
      }
      snap('Extra round: no edge can improve any distance → no negative cycle reachable.', { round: n, predict: q });
    }
    const es = {};
    pred.forEach((i) => {
      if (i >= 0) es[i] = 'done';
    });
    const unreached = dist.filter((d) => d === Infinity).length;
    snap(`Final distances from ${start}: [${dist.map(fmt).join(', ')}]${unreached ? ` (${unreached} node(s) unreachable → ∞)` : ''}. Green edges form the shortest-path tree. O(V·E) — slower than Dijkstra, but it handles negative weights.`, {
      edgeStates: es,
      states: Object.fromEntries(dist.map((d, i) => [i, d === Infinity ? 'muted' : 'done'])),
      distHl: Object.fromEntries(dist.map((d, i) => [i, d === Infinity ? 'muted' : 'done'])),
      round: '✓',
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ 0-1 BFS */
export const zeroOneBfs = {
  title: '0-1 BFS with a deque',
  description: 'Shortest paths when every edge weighs 0 or 1: 0-edges go to the deque front, 1-edges to the back. Undirected; n ≤ 8, ≤ 16 edges.',
  defaultInput: { n: 6, edges: [[0, 1, 1], [0, 2, 0], [2, 3, 1], [1, 3, 0], [3, 4, 0], [1, 4, 1], [4, 5, 1], [2, 5, 1]], start: 0 },
  fields: weightedFields(true, 'undirected edges [u, v, w] (w is 0 or 1)'),
  testInputs: [
    { n: 0, edges: [], start: 0 },
    { n: 1, edges: [], start: 0 },
    { n: 5, edges: [[0, 1, 0], [1, 2, 0], [3, 4, 1]], start: 1 },
    { n: 4, edges: [[0, 1, 1], [0, 1, 0], [1, 2, 7], [2, 3, 0], [0, 3, 1]], start: 0 },
  ],
  generate(input) {
    const { n, edges, start } = cleanGraph(input, { zeroOne: true });
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([a, b, w], i) => {
      adj[a].push({ to: b, w, i });
      if (a !== b) adj[b].push({ to: a, w, i });
    });
    const dist = new Array(n).fill(Infinity);
    const pred = new Array(n).fill(-1);
    const done = new Array(n).fill(false);
    const deque = [];
    const frames = [];
    const snap = (note, extra = {}, predict) => {
      const states = {};
      for (let i = 0; i < n; i++) states[i] = done[i] ? 'done' : dist[i] !== Infinity ? 'visited' : '';
      const es = {};
      pred.forEach((i) => {
        if (i >= 0) es[i] = 'done';
      });
      const f = {
        note,
        panels: [
          graph(n, edges, { weights: true, states: { ...states, ...extra }, edgeStates: es }),
          { kind: 'queue', label: 'deque (front → back)', values: [...deque] },
          arr(dist.map(fmt), { label: 'dist' }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (n === 0) {
      snap('Empty graph: nothing to explore.');
      snap('No nodes → no distances.');
      return frames;
    }
    dist[start] = 0;
    deque.push(start);
    snap(`dist[${start}] = 0; put ${start} in the deque. Trick: a 0-edge keeps the same distance, so its node belongs at the FRONT; a 1-edge adds 1, so it goes to the BACK.`, { [start]: 'active' });
    let relaxCount = 0;
    let lastAsk = -10;
    let lastAskW = -1;
    while (deque.length) {
      const u = deque.shift();
      if (done[u]) {
        snap(`Pop ${u} — it was already finalised via a cheaper path, so this copy is stale. Skip.`, { [u]: 'muted' });
        continue;
      }
      done[u] = true;
      snap(`Pop ${u} from the front (dist ${dist[u]}). The deque always holds distances d and d + 1 in order, so ${dist[u]} is final — like Dijkstra without a heap.`, { [u]: 'active' });
      for (const { to: v, w, i } of adj[u]) {
        if (done[v] || dist[u] + w >= dist[v]) continue;
        const old = dist[v];
        dist[v] = dist[u] + w;
        pred[v] = i;
        if (w === 0) deque.unshift(v);
        else deque.push(v);
        let predict;
        if (w !== lastAskW || relaxCount - lastAsk >= 3) {
          lastAsk = relaxCount;
          lastAskW = w;
          predict = ask(`Edge ${u}-${v} has weight ${w} and improves dist[${v}]. Push ${v} to the front or back of the deque?`, ['Front', 'Back'], w === 0 ? 0 : 1, 'Weight 0 → same distance as the node being processed → front.');
        }
        relaxCount++;
        snap(
          w === 0
            ? `Edge ${u}-${v} has weight 0: dist[${v}] = ${dist[v]} (was ${fmt(old)}), the same as ${u}'s, so push ${v} to the FRONT — it must be processed before any farther node.`
            : `Edge ${u}-${v} has weight 1: dist[${v}] = ${dist[v]} (was ${fmt(old)}), one more than ${u}'s, so push ${v} to the BACK.`,
          { [u]: 'active', [v]: 'visited' },
          predict,
        );
      }
    }
    const unreached = dist.filter((d) => d === Infinity).length;
    snap(`Deque empty. Distances from ${start}: [${dist.map(fmt).join(', ')}]${unreached ? ` (${unreached} unreachable)` : ''}. Each node is finalised once → O(V + E), faster than Dijkstra's O(E log V).`);
    return frames;
  },
};

/* ------------------------------------------------------------------ Floyd-Warshall */
export const floydWarshall = {
  title: 'Floyd-Warshall all-pairs shortest paths',
  description: 'For each intermediate node k, try improving every dist[i][j] with dist[i][k] + dist[k][j]. Directed; n ≤ 5, a sample of updates per k.',
  defaultInput: { n: 4, edges: [[0, 1, 3], [0, 3, 7], [1, 0, 8], [1, 2, 2], [2, 0, 5], [2, 3, 1], [3, 0, 2]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (max 5)' },
    { key: 'edges', type: 'json', label: 'directed edges [from, to, w]' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 5, edges: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [0, 4, 10], [1, 0, 1], [2, 1, 1], [3, 2, 1], [4, 3, 1]] },
    { n: 3, edges: [[0, 1, 1], [1, 2, -3], [2, 0, 1]] },
    { n: 4, edges: [[0, 1, 2], [2, 3, 1]] },
  ],
  generate(input) {
    const { n, edges } = cleanGraph(input, { maxN: 5, maxE: 20 });
    const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    for (const [u, v, w] of edges) d[u][v] = Math.min(d[u][v], w);
    const labels = Array.from({ length: n }, (_, i) => String(i));
    const frames = [];
    const snap = (note, { states, k, nodeStates = {}, predict } = {}) => {
      const f = {
        note,
        panels: [
          graph(n, edges, { directed: true, weights: true, states: nodeStates }),
          { kind: 'table', label: 'dist[i][j]  (row i = from, column j = to)', cells: d.map((r) => r.map(fmt)), states: states || d.map((r) => r.map(() => '')), rowLabels: labels, colLabels: labels },
          vars({ k: k ?? '-' }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    const base = (k) => d.map((r, i) => r.map((_, j) => (i === k || j === k ? 'visited' : '')));
    snap(n === 0 ? 'Empty graph: the matrix has no cells.' : 'Start: dist[i][j] is the direct edge weight (0 on the diagonal, ∞ if no edge). So far, paths may not pass through any other node.');
    for (let k = 0; k < n; k++) {
      snap(`k = ${k}: now paths may also pass through node ${k}. Only row ${k} (paths into ${k}) and column ${k} (paths out of ${k}) are used — they are highlighted.`, { states: base(k), k, nodeStates: { [k]: 'active' } });
      const improved = [];
      let shown = 0;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          if (i === k || j === k || d[i][k] === Infinity || d[k][j] === Infinity) continue;
          const via = d[i][k] + d[k][j];
          if (via >= d[i][j]) continue;
          const old = d[i][j];
          d[i][j] = via;
          improved.push([i, j]);
          if (shown >= 3) continue;
          shown++;
          const st = base(k);
          for (const [a, b] of improved) st[a][b] = 'done';
          st[i][k] = 'active';
          st[k][j] = 'active';
          const predict =
            shown === 1
              ? (() => {
                  const { options, answer } = placeAnswer(String(via), [String(fmt(old)), String(d[i][k]), String(d[k][j])], k + 1);
                  return ask(`Try ${i} → ${k} → ${j}: dist[${i}][${k}] = ${d[i][k]}, dist[${k}][${j}] = ${d[k][j]}, current dist[${i}][${j}] = ${fmt(old)}. What is dist[${i}][${j}] now?`, options, answer, 'Take the minimum of the old value and the detour through k.');
                })()
              : undefined;
          snap(`dist[${i}][${k}] + dist[${k}][${j}] = ${d[i][k]} + ${d[k][j]} = ${via} < ${fmt(old)} → going ${i} → ${k} → ${j} is shorter, update dist[${i}][${j}] = ${via}.`, { states: st, k, nodeStates: { [k]: 'active', [i]: 'visited', [j]: 'visited' }, predict });
        }
      if (!improved.length) snap(`No pair gets shorter by passing through ${k}. Move on.`, { states: base(k), k, nodeStates: { [k]: 'active' } });
      else if (improved.length > shown) {
        const st = base(k);
        for (const [a, b] of improved) st[a][b] = 'done';
        snap(`…and ${improved.length - shown} more cell(s) improve the same way (all ${improved.length} improvements via ${k} are green).`, { states: st, k, nodeStates: { [k]: 'active' } });
      }
    }
    const negs = labels.map(Number).filter((i) => d[i][i] < 0);
    if (n === 0) snap('Nothing to compute. Floyd-Warshall is O(n³) time, O(n²) space.');
    else if (negs.length) {
      const st = d.map((r, i) => r.map((_, j) => (i === j && d[i][i] < 0 ? 'bad' : '')));
      snap(`dist[i][i] < 0 for node(s) ${negs.join(', ')}: a path from a node back to itself has negative length → a negative cycle, so those distances are not meaningful. O(n³).`, { states: st, k: '✓', nodeStates: Object.fromEntries(negs.map((i) => [i, 'bad'])) });
    } else snap(`Done: every cell is the shortest distance from i to j using any intermediate nodes (∞ = unreachable). Three nested loops → O(n³) time, O(n²) space.`, { states: d.map((r) => r.map((v) => (v === Infinity ? 'muted' : 'done'))), k: '✓' });
    return frames;
  },
};

/* ------------------------------------------------------------------ Bipartite check */
export const bipartite = {
  title: 'Bipartite check (BFS 2-colouring)',
  description: 'Colour nodes with two colours so every edge joins different colours; a same-colour edge means an odd cycle. Undirected; n ≤ 8, ≤ 16 edges.',
  defaultInput: { n: 7, edges: [[0, 1], [0, 3], [1, 2], [2, 5], [3, 4], [4, 5], [1, 4]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (max 8)' },
    { key: 'edges', type: 'json', label: 'undirected edges [u, v]' },
  ],
  testInputs: [
    { n: 5, edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]] },
    { n: 6, edges: [[0, 1], [1, 2], [2, 3], [4, 5]] },
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 3, edges: [[0, 1], [1, 1]] },
  ],
  generate(input) {
    const { n, edges } = cleanGraph(input, { weighted: false });
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([a, b], i) => {
      adj[a].push({ to: b, i });
      if (a !== b) adj[b].push({ to: a, i });
    });
    const color = new Array(n).fill(-1);
    const C = ['A', 'B'];
    const edgeStates = {};
    let queue = [];
    const frames = [];
    const snap = (note, { extra = {}, es, predict } = {}) => {
      const states = {};
      color.forEach((c, i) => {
        if (c >= 0) states[i] = c === 0 ? 'visited' : 'done';
      });
      const f = {
        note,
        panels: [
          graph(n, edges, { states: { ...states, ...extra }, edgeStates: es || { ...edgeStates } }),
          { kind: 'queue', label: 'BFS queue', values: [...queue] },
          arr(color.map((c) => (c < 0 ? '-' : C[c])), { label: 'colour (A / B)', highlights: Object.fromEntries(color.map((c, i) => [i, c === 0 ? 'visited' : c === 1 ? 'done' : 'muted'])) }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(n === 0 ? 'Empty graph: trivially bipartite.' : 'Goal: split nodes into two sides A and B so every edge crosses sides. On the diagram, colour A uses the "visited" style and colour B the "done" (green) style.');
    for (let s = 0; s < n; s++) {
      if (color[s] !== -1) continue;
      color[s] = 0;
      queue = [s];
      snap(`Node ${s} is uncoloured, so it starts a new component. Colour it A (either colour works for a fresh component) and BFS from it.`, { extra: { [s]: 'active' } });
      while (queue.length) {
        const u = queue.shift();
        const fresh = [];
        let conflict = null;
        for (const { to: v, i } of adj[u]) {
          if (color[v] === -1) {
            color[v] = 1 - color[u];
            edgeStates[i] = 'done';
            queue.push(v);
            fresh.push(v);
          } else if (color[v] === color[u]) {
            conflict = { v, i };
            break;
          }
        }
        const predict = fresh.length ? ask(`Node ${u} has colour ${C[color[u]]}. What colour do its uncoloured neighbours get?`, ['A', 'B'], 1 - color[u], 'Neighbours must be on the opposite side.') : undefined;
        snap(
          fresh.length
            ? `Dequeue ${u} (colour ${C[color[u]]}). Its uncoloured neighbours ${fresh.join(', ')} must be on the other side → colour ${C[1 - color[u]]} and enqueue.`
            : `Dequeue ${u} (colour ${C[color[u]]}). ${conflict ? 'Now check its already-coloured neighbours…' : 'All its neighbours already have the opposite colour — consistent.'}`,
          { extra: { [u]: 'active' }, predict },
        );
        if (conflict) {
          const es = Object.fromEntries(edges.map((_, i) => [i, 'muted']));
          es[conflict.i] = '';
          snap(
            `Conflict! Edge ${u}-${conflict.v} joins two nodes that are both colour ${C[color[u]]}${u === conflict.v ? ' (a self-loop)' : ''}. Their BFS paths plus this edge form an ODD cycle, and an odd cycle can never alternate two colours → NOT bipartite. O(V + E).`,
            {
              extra: { [u]: 'bad', [conflict.v]: 'bad' },
              es,
              predict: ask(`Neighbour ${conflict.v} already has the same colour as ${u}. What does that mean?`, ['Recolour it and continue', 'Ignore this edge', 'The graph is not bipartite'], 2),
            },
          );
          return frames;
        }
      }
    }
    const A = color.map((c, i) => (c === 0 ? i : null)).filter((x) => x !== null);
    const B = color.map((c, i) => (c === 1 ? i : null)).filter((x) => x !== null);
    snap(`Every edge joins A to B → the graph IS bipartite. A = {${A.join(', ')}}, B = {${B.join(', ')}}. Each node and edge is handled once → O(V + E).`);
    return frames;
  },
};
