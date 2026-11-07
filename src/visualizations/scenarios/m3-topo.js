// Pattern animations for topological sort: in/out-degree counting (town judge), DFS post-order with
// white/gray/black colours, leaf trimming (minimum height trees) and DP along Kahn's order (parallel courses III).
import { layoutCircle, layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const queue = (values, label) => ({ kind: 'queue', values, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, lo, hi, d) => {
  const x = Number(v);
  return Number.isFinite(x) ? clamp(Math.round(x), lo, hi) : d;
};
const MAX_N = 8;
const MAX_E = 16;
const list = (a) => `[${a.join(', ')}]`;

// Keeps edges whose ends are integers in [base, base + n − 1], shifts them to 0-based, drops repeats
// (and self-loops unless allowed). Undirected repeats are matched in both directions.
function cleanEdges(raw, n, { base = 0, directed = true, selfLoops = false } = {}) {
  const out = [];
  const seen = new Set();
  let dropped = 0;
  for (const e of Array.isArray(raw) ? raw : []) {
    const a = Array.isArray(e) ? Number(e[0]) - base : NaN;
    const b = Array.isArray(e) ? Number(e[1]) - base : NaN;
    const ok = Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < n && b < n && (selfLoops || a !== b);
    const key = directed ? `${a}-${b}` : `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (!ok || seen.has(key) || out.length >= MAX_E) {
      dropped++;
      continue;
    }
    seen.add(key);
    out.push([a, b]);
  }
  return { edges: out, dropped };
}
const readN = (n) => toInt(n, 0, MAX_N, 0);
const clampNote = (rawN, n, dropped) => {
  const parts = [];
  if (Number(rawN) > MAX_N) parts.push(`n clamped to ${MAX_N}`);
  if (dropped) parts.push(`${dropped} invalid/repeated edge(s) dropped`);
  return parts.length ? ` (${parts.join('; ')}.)` : '';
};

// Directed or undirected graph on a circle: no edge can pass through another node.
function graphPanel(n, edges, { states = {}, edgeStates = {}, labels, directed = true, label, pos } = {}) {
  const p = pos || layoutCircle(n);
  return {
    kind: 'nodes',
    nodes: p.map((q) => ({ id: q.id, label: labels ? String(labels[q.id]) : String(q.id), x: q.x, y: q.y, state: states[q.id] || '' })),
    edges: edges.map(([a, b]) => ({ from: a, to: b, state: edgeStates[`${a}-${b}`] || (directed ? '' : edgeStates[`${b}-${a}`] || '') })),
    directed,
    freeLayout: !pos,
    label,
  };
}

/* ------------------------------------------------------------------ in/out-degree counting: town judge */
export const topoTownJudge = {
  problem: { name: 'Find the Town Judge', statement: 'The judge trusts nobody and is trusted by everyone else. Given trust pairs [a, b] (a trusts b), find the judge or -1.', example: 'n = 4, trust [1,3] [1,4] [2,3] [2,4] [4,3] → 3', exampleOutput: 3, questionId: 'find-the-town-judge' },
  title: 'Degree counting: find the town judge',
  description:
    'Each trust pair [a, b] is the edge a → b: b gains in-degree, a gains out-degree. The judge is trusted by everyone else (in-degree n − 1) and trusts nobody (out-degree 0). People are labelled 1..n; n is clamped to 8 and the list to 16 pairs (invalid or repeated pairs are dropped).',
  defaultInput: { n: 4, trust: [[1, 3], [1, 4], [2, 3], [2, 4], [4, 3]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (people 1..n)' },
    { key: 'trust', type: 'json', label: 'trust [a, b] = a trusts b' },
  ],
  testInputs: [
    { n: 1, trust: [] },
    { n: 2, trust: [] },
    { n: 3, trust: [[1, 3], [2, 3], [3, 1]] },
    { n: 3, trust: [[1, 2], [2, 3]] },
    { n: 5, trust: [[1, 2], [3, 4]] },
    { n: 3, trust: [[1, 3], [2, 3], [1, 3], [9, 1], [2, 2]] },
    { n: 0, trust: [] },
  ],
  generate({ n: rawN, trust }) {
    const n = readN(rawN);
    const { edges, dropped } = cleanEdges(trust, n, { base: 1 });
    const labels = Array.from({ length: n }, (_, i) => i + 1);
    const indeg = new Array(n).fill(0);
    const outdeg = new Array(n).fill(0);
    const edgeStates = {};
    const frames = [];
    const table = (rowState = {}) => ({
      kind: 'table',
      label: 'degree counts',
      rowLabels: labels.map((p) => `person ${p}`),
      colLabels: ['in', 'out', 'in − out'],
      cells: labels.map((_, i) => [indeg[i], outdeg[i], indeg[i] - outdeg[i]]),
      states: labels.map((_, i) => new Array(3).fill(rowState[i] || '')),
    });
    const snap = (note, states = {}) => frames.push({ note, panels: [graphPanel(n, edges, { states, edgeStates: { ...edgeStates }, labels, label: 'a → b means "a trusts b"' }), table(states)] });
    if (n === 0) {
      snap('n = 0: there is nobody in town.');
      snap('No people, so no judge → return −1.');
      frames.at(-1).result = -1;
      return frames;
    }
    snap(`Town of ${n}. The template only COUNTS: for every pair [a, b], outdeg[a]++ and indeg[b]++. No traversal needed.${clampNote(rawN, n, dropped)}`);
    let asks = 0;
    edges.forEach(([a, b], k) => {
      let q;
      if ((k === 1 || k === 3) && asks < 2) {
        q = pick(`Next pair: [${a + 1}, ${b + 1}] ("${a + 1} trusts ${b + 1}"). Whose IN-degree goes up?`, `person ${b + 1}`, [`person ${a + 1}`, 'both of them', 'nobody'], asks + 1, 'The arrow points at the person being trusted; in-degree counts arrows coming in.');
        if (q) asks++;
      }
      outdeg[a]++;
      indeg[b]++;
      edgeStates[`${a}-${b}`] = 'done';
      snap(`[${a + 1}, ${b + 1}]: edge ${a + 1} → ${b + 1}. ${b + 1} is trusted once more (in = ${indeg[b]}); ${a + 1} trusts one more person (out = ${outdeg[a]}).`, { [a]: 'visited', [b]: 'active' });
      attach(frames, q);
    });
    if (!edges.length) snap('No trust pairs at all: every in-degree and out-degree stays 0.');
    let judge = -1;
    const yes = 'Yes — the judge';
    const no = 'No';
    let scanAsk = 0;
    for (let i = 0; i < n; i++) {
      const ok = indeg[i] === n - 1 && outdeg[i] === 0;
      let q;
      if (scanAsk < 2 && (i === 1 || ok)) {
        q = pick(`Check person ${i + 1}: in = ${indeg[i]}, out = ${outdeg[i]}, n − 1 = ${n - 1}. Is ${i + 1} the judge?`, ok ? yes : no, [ok ? no : yes], scanAsk + (ok ? 1 : 0));
        scanAsk++;
      }
      if (ok) judge = i;
      const why = ok ? `in = ${indeg[i]} = n − 1 and out = 0 → everyone else trusts ${i + 1}, and ${i + 1} trusts nobody.` : indeg[i] !== n - 1 ? `in = ${indeg[i]} ≠ n − 1 = ${n - 1} → not trusted by everyone.` : `out = ${outdeg[i]} ≠ 0 → ${i + 1} trusts someone, so not the judge.`;
      snap(`Person ${i + 1}: ${why}`, { [i]: ok ? 'done' : 'bad' });
      attach(frames, q);
    }
    const states = judge >= 0 ? { [judge]: 'done' } : {};
    snap(
      judge >= 0
        ? `Judge = ${judge + 1}. Same test with the net score: in − out = ${n - 1} = n − 1 only for the judge. One pass over the pairs + one over the people → O(n + m).`
        : `Nobody has in = n − 1 and out = 0 → return −1. O(n + m): one pass over the pairs, one over the people.`,
      states,
    );
    frames.at(-1).result = judge >= 0 ? judge + 1 : -1;
    return frames;
  },
};

/* ------------------------------------------------------------------ DFS post-order + white/gray/black */
const LETTER = ['W', 'G', 'B'];
export const topoThreeColor = {
  problem: { name: 'Course Schedule (cycle check + order)', statement: 'Given directed edges, detect a cycle with DFS colours, or produce a topological order from reversed post-order.', example: 'n = 6, edges 0→1, 0→2, 1→3, 2→3, 3→4, 5→4 → no cycle; order [5, 0, 2, 1, 3, 4]', exampleOutput: [5, 0, 2, 1, 3, 4], questionId: 'course-schedule' },
  title: 'DFS post-order + 3-colour cycle check',
  description:
    'White = unseen, gray = on the current DFS path, black = finished. A vertex is appended to post when it turns black; reversed post is a topological order. Meeting a gray vertex is a back edge → cycle. n is clamped to 8 and edges to 16 (invalid or repeated edges are dropped).',
  defaultInput: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [5, 4]] },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'directed edges [u, v] (u before v)' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 3, edges: [[0, 1], [1, 2], [2, 0]] },
    { n: 4, edges: [[0, 1], [2, 3]] },
    { n: 2, edges: [[1, 1]] },
    { n: 5, edges: [[0, 1], [1, 2], [3, 1], [2, 4], [4, 3]] },
  ],
  generate({ n: rawN, edges: rawEdges }) {
    const n = readN(rawN);
    const { edges, dropped } = cleanEdges(rawEdges, n, { selfLoops: true });
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) adj[u].push(v);
    const color = new Array(n).fill(0);
    const post = [];
    const calls = [];
    const edgeStates = {};
    const frames = [];
    let hasCycle = false;
    const snap = (note, cur, extra = {}, tail) => {
      const states = {};
      color.forEach((c, i) => {
        if (c) states[i] = c === 1 ? 'visited' : 'done';
      });
      if (cur != null) states[cur] = 'active';
      Object.assign(states, extra);
      const hl = {};
      color.forEach((c, i) => {
        if (c) hl[i] = c === 1 ? 'visited' : 'done';
      });
      if (cur != null) hl[cur] = 'active';
      frames.push({
        note,
        panels: [
          graphPanel(n, edges, { states, edgeStates: { ...edgeStates }, label: 'edge u → v: u comes before v' }),
          arr(color.map((c) => LETTER[c]), { label: 'color (W white · G gray · B black)', highlights: hl, showIndices: true }),
          tail || arr([...post], { label: 'post (finish order)' }),
          stack([...calls], 'call stack (= gray path)'),
        ],
      });
    };
    if (n === 0) {
      snap('n = 0: no vertices.');
      snap('Nothing to visit → the empty order [] is valid.');
      frames.at(-1).result = [];
      return frames;
    }
    snap(`All ${n} vertices start WHITE (unseen). The outer loop will start a DFS from each vertex that is still white.${clampNote(rawN, n, dropped)}`);
    let asks = 0;
    let finishes = 0;
    let blackSeen = 0;
    const order = [];
    const dfs = (u, outer) => {
      color[u] = 1;
      calls.push(`dfs(${u})`);
      order.push(u);
      snap(`${outer ? `Outer loop: ${u} is white → dfs(${u}). ` : ''}Enter ${u}: paint it GRAY — it is on the current path.`, u);
      for (const v of adj[u]) {
        if (color[v] === 1) {
          const q = pick(`Edge ${u} → ${v}, and ${v} is GRAY (still on the path). What does it mean?`, 'A directed cycle — stop', ['Already visited — skip it', `Recurse into ${v} again`], asks++);
          hasCycle = true;
          snap(`Edge ${u} → ${v}: ${v} is gray, so it is an ancestor on the current path. Following the path ${v} → … → ${u} → ${v} closes a loop: a back edge = directed cycle. hasCycle = true; unwind.`, u, { [u]: 'bad', [v]: 'bad' });
          attach(frames, q);
          return;
        }
        if (color[v] === 0) {
          edgeStates[`${u}-${v}`] = 'done';
          snap(`Edge ${u} → ${v}: ${v} is white (unseen) → go deeper into ${v}.`, u);
          dfs(v, false);
          if (hasCycle) return;
        } else {
          blackSeen++;
          const q = blackSeen === 1 ? pick(`Edge ${u} → ${v}, and ${v} is already BLACK. What does DFS do?`, 'Skip it — not a cycle', ['Report a cycle', `Recurse into ${v} again`], 0) : undefined;
          edgeStates[`${u}-${v}`] = 'muted';
          snap(`Edge ${u} → ${v}: ${v} is black — fully explored earlier and already in post. Meeting it again is NOT a cycle (a single visited flag would get this wrong). Skip.`, u);
          attach(frames, q);
        }
      }
      color[u] = 2;
      calls.pop();
      post.push(u);
      finishes++;
      let q;
      if ((finishes === 1 || finishes === 4) && asks < 6) {
        const wrong = [...calls.map((s) => Number(s.slice(4, -1))).reverse(), ...Array.from({ length: n }, (_, i) => i).filter((i) => color[i] === 0)];
        q = pick(`post = ${list(post.slice(0, -1))}. Which vertex turns black and is appended to post next?`, u, wrong, finishes + 1, 'A vertex finishes only after every edge out of it is handled.');
      }
      snap(`Every edge out of ${u} is handled → paint ${u} BLACK and append it to post. Everything reachable from ${u} finished before it.`, u);
      attach(frames, q);
    };
    for (let i = 0; i < n && !hasCycle; i++) if (color[i] === 0) dfs(i, i > 0);
    if (hasCycle) {
      snap('hasCycle is true → return []. A directed cycle means no topological order exists. O(V + E).', null, Object.fromEntries(frames[frames.length - 1].panels[0].nodes.filter((x) => x.state === 'bad').map((x) => [x.id, 'bad'])));
      frames.at(-1).result = [];
      return frames;
    }
    const topo = [...post].reverse();
    const q = pick(`post = ${list(post)}. What does topoDfs return?`, list(topo), [list(post), list(order)], 1, 'Reverse the post-order; pre-order (entry order) is not a topological order in general.');
    snap(`Return post reversed: ${list(topo)}. Every edge u → v points forward in it, because v always finished before u. O(V + E).`, null, {}, arr(topo, { label: 'topological order = post reversed', highlights: Object.fromEntries(topo.map((_, i) => [i, 'done'])) }));
    attach(frames, q);
    frames.at(-1).result = topo;
    return frames;
  },
};

/* ------------------------------------------------------------------ leaf trimming: minimum height trees */
function treePositions(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  let root = 0;
  for (let i = 1; i < n; i++) if (adj[i].length > adj[root].length) root = i;
  const seen = new Set([root]);
  const build = (u) => ({ id: u, label: String(u), children: [...adj[u]].sort((x, y) => x - y).filter((v) => !seen.has(v) && seen.add(v)).map(build) });
  const { nodes } = layoutNary(build(root));
  return nodes.sort((a, b) => a.id - b.id).map((p) => ({ id: p.id, x: p.x, y: p.y }));
}
const isTree = (n, edges) => {
  if (n === 0 || edges.length !== n - 1) return n === 0;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of edges) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
  }
  return true;
};

export const topoLeafTrimming = {
  problem: { name: 'Minimum Height Trees', statement: 'Among all roots of an undirected tree, return those that give the smallest height.', example: 'n = 8, edges [0,1] [1,2] [1,3] [3,4] [4,5] [4,6] [6,7] → [3, 4]', exampleOutput: [3, 4], questionId: 'minimum-height-trees' },
  title: 'Leaf trimming: minimum height trees',
  description:
    'Peel all current leaves (degree 1) of an undirected tree layer by layer, like Kahn on in-degree 0; the last 1–2 vertices are the centres = the roots of minimum height trees. n is clamped to 8; invalid or repeated edges are dropped, and a graph that is not a tree is rejected.',
  defaultInput: { n: 8, edges: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [4, 6], [6, 7]] },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'undirected edges [u, v]' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 2, edges: [[0, 1]] },
    { n: 4, edges: [[1, 0], [1, 2], [1, 3]] },
    { n: 6, edges: [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 0], [2, 3]] },
    { n: 4, edges: [[0, 1], [2, 3]] },
  ],
  generate({ n: rawN, edges: rawEdges }) {
    const n = readN(rawN);
    const { edges, dropped } = cleanEdges(rawEdges, n, { directed: false });
    const frames = [];
    const tree = isTree(n, edges);
    const pos = tree && n ? treePositions(n, edges) : undefined;
    const deg = new Array(n).fill(0);
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      adj[v].push(u);
      deg[u]++;
      deg[v]++;
    }
    const removed = new Array(n).fill(false);
    const edgeStates = {};
    let leaves = [];
    let remaining = n;
    const snap = (note, extra = {}, side = {}) => {
      const states = {};
      for (let i = 0; i < n; i++) if (removed[i]) states[i] = 'muted';
      for (const l of leaves) if (!removed[l]) states[l] = 'visited';
      Object.assign(states, extra);
      const hl = {};
      for (let i = 0; i < n; i++) hl[i] = states[i] || '';
      frames.push({
        note,
        panels: [
          graphPanel(n, edges, { states, edgeStates: { ...edgeStates }, directed: false, pos, label: 'gray = peeled' }),
          arr(deg.map((d, i) => (removed[i] ? '–' : d)), { label: 'deg (remaining neighbours)', highlights: hl, showIndices: true }),
          queue([...leaves], 'leaves (current layer)'),
          vars({ remaining, ...side }),
        ],
      });
    };
    const extra = clampNote(rawN, n, dropped);
    if (!tree) {
      snap(`This graph is not a tree: a tree on n vertices is connected with exactly n − 1 edges (here ${edges.length}).${extra}`);
      snap('With a cycle, its vertices never become leaves; with separate parts there is no single middle. Leaf trimming (and "centre") needs a tree.');
      frames.at(-1).result = null;
      return frames;
    }
    if (n <= 2) {
      snap(`n = ${n}.${extra}`);
      snap(`n ≤ 2: return every vertex ${list([...Array(n).keys()])}. ${n === 1 ? 'A single vertex has no edges, so no leaves — the special case avoids an empty answer.' : n === 2 ? 'Both ends of the only edge give height 1.' : 'No vertices, no centres.'}`, Object.fromEntries([...Array(n).keys()].map((i) => [i, 'done'])));
      frames.at(-1).result = [...Array(n).keys()];
      return frames;
    }
    snap(`Count each vertex's degree. A leaf has degree 1 — like in-degree 0 in Kahn, it can be removed first.${extra}`);
    for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
    snap(`First layer of leaves: ${list(leaves)}. remaining = ${remaining} > 2, so peel them.`, Object.fromEntries(leaves.map((l) => [l, 'active'])));
    let asks = 0;
    let layer = 0;
    while (remaining > 2) {
      layer++;
      remaining -= leaves.length;
      const next = [];
      leaves.forEach((leaf, k) => {
        const alive = adj[leaf].find((nb) => !removed[nb] && !leaves.includes(nb));
        let q;
        if (alive != null && asks < 6 && (layer === 1 ? k === 1 : k === 0)) {
          const becomes = deg[alive] - 1 === 1;
          q = pick(`Peel leaf ${leaf}: its neighbour ${alive} has deg ${deg[alive]}. Does ${alive} become a leaf of the next layer?`, becomes ? 'Yes' : 'No', [becomes ? 'No' : 'Yes'], asks++ + 1);
        }
        for (const nb of adj[leaf]) if (--deg[nb] === 1) next.push(nb);
        removed[leaf] = true;
        for (const nb of adj[leaf]) edgeStates[`${leaf}-${nb}`] = 'muted';
        const became = alive != null && next.includes(alive);
        snap(
          alive == null ? `Peel leaf ${leaf}. Its neighbour is in this same layer, so nothing new happens.` : `Peel leaf ${leaf}: deg[${alive}] drops to ${deg[alive]}. ${became ? `${alive} is now a leaf → next layer.` : `${alive} still has ${deg[alive]} neighbours, not a leaf yet.`}`,
          { [leaf]: 'bad', ...(alive != null ? { [alive]: 'active' } : {}) },
          { layer, next: list(next) },
        );
        attach(frames, q);
      });
      leaves = next;
      const stop = remaining <= 2;
      const q = pick(`Layer ${layer} is gone: remaining = ${remaining}. Peel another layer?`, stop ? 'No — stop, these are the centres' : 'Yes — keep peeling', [stop ? 'Yes — keep peeling' : 'No — stop, these are the centres'], layer + 1);
      snap(`Layer ${layer} peeled: every longest path lost one vertex at each end. remaining = ${remaining}${stop ? ' ≤ 2 → stop.' : ' > 2 → peel the new leaves'} ${list(leaves)}${stop ? ' are what is left.' : '.'}`, Object.fromEntries(leaves.map((l) => [l, stop ? 'done' : 'active'])), { layer });
      attach(frames, q);
    }
    // height when rooted at a centre (for the closing note)
    const full = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) full[a].push(b), full[b].push(a);
    const dist = new Array(n).fill(-1);
    const bq = [leaves[0]];
    dist[leaves[0]] = 0;
    for (let h = 0; h < bq.length; h++) for (const v of full[bq[h]]) if (dist[v] < 0) (dist[v] = dist[bq[h]] + 1), bq.push(v);
    const height = Math.max(...dist);
    snap(`Centres: ${list(leaves)}. Rooting the tree at ${leaves.length === 2 ? 'either one' : 'it'} gives the minimum height, ${height}. Each vertex and edge is handled once → O(n).`, Object.fromEntries(leaves.map((l) => [l, 'done'])), { answer: list(leaves) });
    frames.at(-1).result = leaves;
    return frames;
  },
};

/* ------------------------------------------------------------------ DP along Kahn's order: parallel courses III */
export const topoDagDp = {
  problem: { name: 'Parallel Courses III', statement: 'Course v takes time[v] and can start once all its prerequisites finish. Return the earliest time all courses are done.', example: 'time [3, 2, 4, 1, 2, 3] with the default edges → 12', exampleOutput: 12, questionId: 'parallel-courses-iii' },
  title: "DAG DP: earliest finish along Kahn's order",
  description:
    'Parallel courses III: course v takes time[v] and starts after all its prerequisites. Kahn pops u only when all its prerequisites are done, so finish[u] is final; then push finish[v] = max(finish[v], finish[u] + time[v]) along each edge. The answer is the largest finish. n is clamped to 8, edges to 16, times to 1–99 (missing → 1).',
  defaultInput: { n: 6, edges: [[0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]], time: [3, 2, 4, 1, 2, 3] },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'edges [u, v] = u before v' },
    { key: 'time', type: 'numbers', label: 'time[v]' },
  ],
  testInputs: [
    { n: 0, edges: [], time: [] },
    { n: 1, edges: [], time: [5] },
    { n: 3, edges: [[0, 1], [1, 2], [2, 1]], time: [1, 2, 3] },
    { n: 5, edges: [[0, 1], [2, 3]], time: [4, 1, 2, 2] },
    { n: 4, edges: [[0, 1], [0, 2], [1, 3], [2, 3]], time: [1, 5, 2, 1] },
    { n: 12, edges: [[0, 9], [0, 1]], time: [200, -3] },
  ],
  generate({ n: rawN, edges: rawEdges, time: rawTime }) {
    const n = readN(rawN);
    const { edges, dropped } = cleanEdges(rawEdges, n, { selfLoops: true });
    const t = Array.isArray(rawTime) ? rawTime : [];
    const time = Array.from({ length: n }, (_, i) => toInt(t[i], 1, 99, 1));
    const adj = Array.from({ length: n }, () => []);
    const indeg = new Array(n).fill(0);
    for (const [u, v] of edges) {
      adj[u].push(v);
      indeg[v]++;
    }
    const finish = time.slice();
    const done = new Array(n).fill(false);
    const edgeStates = {};
    const q = [];
    let head = 0;
    const frames = [];
    const labels = time.map((x, i) => `${i}:${x}`);
    const snap = (note, extra = {}, fin = {}) => {
      const states = {};
      for (let i = 0; i < n; i++) if (done[i]) states[i] = 'done';
      for (const x of q.slice(head)) states[x] = 'visited';
      Object.assign(states, extra);
      frames.push({
        note,
        panels: [
          graphPanel(n, edges, { states, edgeStates: { ...edgeStates }, labels, label: 'node = course:time · u → v: u before v' }),
          arr([...indeg], { label: 'indeg (prerequisites left)', showIndices: true }),
          arr([...finish], { label: 'finish (earliest finish time)', highlights: fin, showIndices: true }),
          queue(q.slice(head), 'Kahn queue'),
        ],
      });
    };
    if (n === 0) {
      snap('n = 0: no courses.');
      snap('Nothing to take → total time 0.');
      frames.at(-1).result = 0;
      return frames;
    }
    snap(`Start with finish = time (a course with no prerequisites ends after its own time). indeg counts unfinished prerequisites.${clampNote(rawN, n, dropped)}`);
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    snap(`Courses with indeg 0 can start at time 0: ${list(q)} → queue.`, Object.fromEntries(q.map((x) => [x, 'active'])));
    let asks = 0;
    let relaxes = 0;
    while (head < q.length) {
      let pq;
      if (head === 2 && q.length - head >= 2) pq = pick(`Kahn queue (front → back): ${list(q.slice(head))}. Which course is popped next?`, q[head], q.slice(head + 1).reverse(), asks++ + 2);
      const u = q[head++];
      done[u] = true;
      snap(`Pop ${u}. Every prerequisite (if any) was popped earlier, so finish[${u}] = ${finish[u]} is final. Push it forward along ${adj[u].length ? `${adj[u].length} edge(s)` : 'its edges (none)'}.`, { [u]: 'active' }, { [u]: 'done' });
      attach(frames, pq);
      for (const v of adj[u]) {
        const cand = finish[u] + time[v];
        const nv = Math.max(finish[v], cand);
        relaxes++;
        let rq;
        if ((relaxes === 2 || relaxes === 4) && asks < 6) rq = pick(`Edge ${u} → ${v}: finish[${u}] = ${finish[u]}, time[${v}] = ${time[v]}, finish[${v}] = ${finish[v]} now. New finish[${v}]?`, nv, [Math.min(finish[v], cand), finish[u], cand + finish[v], time[v]], asks++ + relaxes, `max(${finish[v]}, ${finish[u]} + ${time[v]}): ${v} must wait for its SLOWEST prerequisite.`);
        const grew = nv > finish[v];
        const old = finish[v];
        finish[v] = nv;
        edgeStates[`${u}-${v}`] = 'done';
        indeg[v]--;
        if (indeg[v] === 0) q.push(v);
        snap(
          `Edge ${u} → ${v}: max(${old}, ${finish[u]} + ${time[v]}) = ${nv}${grew ? ` — ${v} now waits for ${u}.` : ` — unchanged, another prerequisite finishes later.`} indeg[${v}] → ${indeg[v]}${indeg[v] === 0 ? `, so ${v} is ready → queue.` : '.'}`,
          { [u]: 'active', [v]: indeg[v] === 0 ? 'visited' : '' },
          { [v]: 'active' },
        );
        attach(frames, rq);
      }
    }
    if (head < n) {
      const stuck = [...Array(n).keys()].filter((i) => !done[i]);
      snap(`Queue empty after ${head} of ${n} courses. ${list(stuck)} never reached indeg 0 → they sit on or behind a cycle. No schedule exists → return −1.`, Object.fromEntries(stuck.map((i) => [i, 'bad'])));
      frames.at(-1).result = -1;
      return frames;
    }
    const best = Math.max(...finish);
    const at = finish.indexOf(best);
    const sum = time.reduce((a, b) => a + b, 0);
    const fq = pick('Every course is processed. What is the minimum time to finish ALL courses (in parallel)?', best, [sum, Math.min(...finish), finish[n - 1], time[at]], asks + 1, 'The answer is the latest finish time, max(finish).');
    snap(`All ${n} courses done in topological order. Answer = max(finish) = ${best} (course ${at} ends last). One Kahn pass, each edge relaxed once → O(V + E).`, { [at]: 'done' }, Object.fromEntries(finish.map((f, i) => [i, f === best ? 'done' : ''])));
    attach(frames, fq);
    frames.at(-1).result = best;
    return frames;
  },
};
