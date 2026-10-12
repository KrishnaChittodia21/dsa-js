import { layoutCircle } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};

function graphPanel(n, edges, { states = {}, edgeStates = {}, directed = false, weights = false, nodeLabels } = {}) {
  const pos = layoutCircle(n);
  return {
    kind: 'nodes',
    nodes: pos.map((p) => ({ id: p.id, label: nodeLabels ? String(nodeLabels[p.id]) : String(p.id), x: p.x, y: p.y, state: states[p.id] || '' })),
    edges: edges.map(([a, b, w]) => ({ from: a, to: b, label: weights ? String(w) : undefined, state: edgeStates[`${a}-${b}`] || edgeStates[`${b}-${a}`] || '' })),
    directed,
    freeLayout: true,
  };
}

const adjOf = (n, edges, directed) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b, w] of edges) {
    adj[a].push([b, w ?? 1]);
    if (!directed) adj[b].push([a, w ?? 1]);
  }
  for (const list of adj) list.sort((x, y) => x[0] - y[0]);
  return adj;
};

export const graphBfs = {
  title: 'Graph BFS',
  description: 'Explore in layers using a queue: all nodes at distance 1, then distance 2, …',
  defaultInput: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6]], start: 0 },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'edges' },
    { key: 'start', type: 'number', label: 'start' },
  ],
  generate({ n, edges, start }) {
    const adj = adjOf(n, edges, false);
    const dist = new Array(n).fill('∞');
    const states = {};
    const edgeStates = {};
    const frames = [];
    const queue = [start];
    dist[start] = 0;
    states[start] = 'visited';
    const snap = (note, extra = {}) => frames.push({ note, panels: [graphPanel(n, edges, { states: { ...states, ...extra }, edgeStates: { ...edgeStates } }), { kind: 'queue', label: 'queue', values: queue.slice(head) }, arr([...dist], { label: 'distance' })] });
    let head = 0;
    snap(`Start at ${start}: mark it visited (distance 0) and enqueue it.`, { [start]: 'active' });
    let deq = 0;
    let asks = 0;
    while (head < queue.length) {
      const waiting = queue.slice(head);
      deq++;
      const q = deq >= 2 && asks < 3 && waiting.length >= 2 ? pick(`Queue (front → back): [${waiting.join(', ')}]. Which node is dequeued next?`, waiting[0], waiting.slice(1).reverse(), ++asks) : null;
      const u = queue[head++];
      states[u] = 'done';
      const found = [];
      for (const [v] of adj[u]) {
        if (dist[v] === '∞') {
          dist[v] = dist[u] + 1;
          states[v] = 'visited';
          edgeStates[`${u}-${v}`] = 'done';
          queue.push(v);
          found.push(v);
        }
      }
      snap(`Dequeue ${u} (front of the queue — FIFO). ${found.length ? `Unvisited neighbours ${found.join(', ')} get distance ${dist[u] + 1} → enqueue.` : 'No unvisited neighbours.'}`, { [u]: 'active' });
      attach(frames, q);
    }
    snap('Queue empty. Green edges form the BFS tree; distances are shortest paths in an unweighted graph.');
    return frames;
  },
};

export const graphDfs = {
  title: 'Graph DFS',
  description: 'Go as deep as possible, then backtrack. Uses recursion (the call stack).',
  defaultInput: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6]], start: 0 },
  fields: graphBfs.fields,
  generate({ n, edges, start }) {
    const adj = adjOf(n, edges, false);
    const states = {};
    const edgeStates = {};
    const order = [];
    const callStack = [];
    const frames = [];
    const snap = (note, active) => frames.push({ note, panels: [graphPanel(n, edges, { states: { ...states, ...(active !== undefined ? { [active]: 'active' } : {}) }, edgeStates: { ...edgeStates } }), { kind: 'stack', label: 'call stack', values: [...callStack] }, arr([...order], { label: 'visit order' })] });
    let deeper = 0;
    let asks = 0;
    const dfs = (u) => {
      states[u] = 'visited';
      order.push(u);
      callStack.push(`dfs(${u})`);
      snap(`Visit ${u}. Look at its neighbours in order.`, u);
      for (const [v] of adj[u]) {
        if (!states[v]) {
          deeper++;
          let q = null;
          if (deeper >= 2 && asks < 3) {
            const nbrs = adj[u].map(([x]) => x);
            const others = [...nbrs.filter((x) => x !== v), ...Array.from({ length: n }, (_, x) => x).filter((x) => !states[x] && x !== v)];
            q = pick(`At ${u}: neighbours in order [${nbrs.join(', ')}]; visited so far [${order.join(', ')}]. Which node does DFS go to next?`, v, others, asks + 1);
            if (q) asks++;
          }
          edgeStates[`${u}-${v}`] = 'done';
          snap(`${v} is the first unvisited neighbour of ${u} → go deeper into ${v}.`, u);
          attach(frames, q);
          dfs(v);
          snap(`Back in ${u} (returned from ${v}).`, u);
        }
      }
      states[u] = 'done';
      callStack.pop();
    };
    dfs(start);
    snap(`DFS order: ${order.join(' → ')}. Each node and edge processed once → O(V + E).`);
    return frames;
  },
};

const gridPanel = (grid, states, label) => ({ kind: 'grid', cells: grid, states, label });

export const gridBfs = {
  title: 'Multi-source BFS on a grid',
  description: 'All sources start in the queue together; the wave spreads one ring per minute.',
  defaultInput: { grid: [[2, 1, 1, 0], [1, 1, 0, 1], [0, 1, 1, 1], [1, 0, 1, 2]] },
  fields: [{ key: 'grid', type: 'json', label: 'grid (2 = source, 1 = open, 0 = wall)' }],
  generate({ grid }) {
    const g = grid.map((r) => [...r]);
    const R = g.length;
    const C = g[0]?.length || 0;
    const dist = g.map((r) => r.map(() => null));
    const states = g.map((r) => r.map((v) => (v === 0 ? 'wall' : v === 2 ? 'active' : '')));
    let q = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === 2) { q.push([r, c]); dist[r][c] = 0; }
    const frames = [];
    const cells = () => g.map((row, r) => row.map((v, c) => (v === 0 ? '■' : dist[r][c] === null ? '·' : dist[r][c])));
    frames.push({ note: `${q.length} source cell(s) enqueued at time 0. They all spread at the same time.`, panels: [gridPanel(cells(), states.map((r) => [...r]))] });
    let t = 0;
    let asks = 0;
    while (q.length) {
      const next = [];
      for (const [r, c] of q) {
        states[r][c] = 'done';
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== 1 || dist[nr][nc] !== null) continue;
          dist[nr][nc] = t + 1;
          states[nr][nc] = 'active';
          next.push([nr, nc]);
        }
      }
      if (next.length) {
        frames.push({ note: `Time ${t + 1}: the wave reaches ${next.length} new cell(s).`, panels: [gridPanel(cells(), states.map((r) => [...r]))] });
        if (asks < 3) {
          const k = next.length;
          attach(frames, pick(`The frontier at time ${t} has ${q.length} cell(s). How many NEW open cells does the wave reach at time ${t + 1}?`, k, [k + 1, k - 1 > 0 ? k - 1 : k + 2, k + 2, k + 3], asks++));
        }
      }
      q = next;
      t++;
    }
    const unreached = g.some((row, r) => row.some((v, c) => v === 1 && dist[r][c] === null));
    frames.push({ note: unreached ? 'Some open cells were never reached (walled off).' : `Every reachable cell has its distance to the NEAREST source. O(R·C).`, panels: [gridPanel(cells(), states.map((r) => [...r]))] });
    return frames;
  },
};

export const gridDfs = {
  title: 'Grid DFS: counting islands',
  description: 'Scan cells; each unvisited land cell starts a DFS that sinks the whole island.',
  defaultInput: { grid: [[1, 1, 0, 0, 1], [1, 0, 0, 1, 1], [0, 0, 1, 0, 0], [1, 0, 1, 1, 0]] },
  fields: [{ key: 'grid', type: 'json', label: 'grid (1 = land)' }],
  generate({ grid }) {
    const R = grid.length;
    const C = grid[0]?.length || 0;
    const label = grid.map((r) => r.map(() => 0));
    const frames = [];
    let islands = 0;
    let asks = 0;
    const cells = () => grid.map((row, r) => row.map((v, c) => (v === 1 ? (label[r][c] ? String.fromCharCode(64 + label[r][c]) : '1') : '')));
    const states = () => grid.map((row, r) => row.map((v, c) => (v === 0 ? 'water' : label[r][c] ? `island-${(label[r][c] - 1) % 4}` : '')));
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        if (grid[r][c] !== 1 || label[r][c]) continue;
        islands++;
        const stack = [[r, c]];
        label[r][c] = islands;
        let size = 0;
        while (stack.length) {
          const [cr, cc] = stack.pop();
          size++;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nc >= 0 && nr < R && nc < C && grid[nr][nc] === 1 && !label[nr][nc]) {
              label[nr][nc] = islands;
              stack.push([nr, nc]);
            }
          }
        }
        frames.push({ note: `Found new land at (${r}, ${c}) → island #${islands}. DFS marks all ${size} connected cell(s) so they are never counted again.`, panels: [gridPanel(cells(), states())] });
        if (frames.length > 1 && asks < 3) attach(frames, pick(`The scan finds unvisited land at (${r}, ${c}) → island #${islands}. How many cells will DFS mark for this island?`, size, [size + 1, size - 1 > 0 ? size - 1 : size + 2, size + 2, size + 3], asks++));
      }
    frames.push({ note: `Total islands: ${islands}. Every cell is visited a constant number of times → O(R·C).`, panels: [gridPanel(cells(), states())] });
    return frames;
  },
};

export const topoSort = {
  title: "Topological sort (Kahn's algorithm)",
  description: 'Repeatedly take a node with in-degree 0 (no remaining prerequisites).',
  defaultInput: { n: 6, edges: [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]] },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'directed edges [from, to]' },
  ],
  generate({ n, edges }) {
    const indeg = new Array(n).fill(0);
    const adj = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      indeg[b]++;
    }
    const states = {};
    const edgeStates = {};
    const order = [];
    const frames = [];
    const q = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    const snap = (note, active) => frames.push({ note, panels: [graphPanel(n, edges, { directed: true, states: { ...states, ...(active !== undefined ? { [active]: 'active' } : {}) }, edgeStates: { ...edgeStates } }), arr([...indeg], { label: 'in-degree' }), { kind: 'queue', label: 'ready queue', values: [...q] }, arr([...order], { label: 'order' })] });
    snap(`Nodes with in-degree 0 have no prerequisites: [${q.join(', ')}] → enqueue.`);
    let asks = 0;
    while (q.length) {
      let tq = null;
      if (asks < 3) {
        const blocked = Array.from({ length: n }, (_, x) => x).filter((x) => !states[x] && !q.includes(x) && indeg[x] > 0);
        tq = pick(`Ready queue: [${q.join(', ')}]. In-degrees: [${indeg.join(', ')}]. Which node is taken next?`, q[0], [...q.slice(1), ...blocked], asks + 1);
        if (tq) asks++;
      }
      const u = q.shift();
      order.push(u);
      states[u] = 'done';
      const freed = [];
      for (const v of adj[u]) {
        indeg[v]--;
        edgeStates[`${u}-${v}`] = 'muted';
        if (indeg[v] === 0) {
          q.push(v);
          freed.push(v);
        }
      }
      snap(`Take ${u} (front of the ready queue). Remove its outgoing edges.${freed.length ? ` ${freed.join(', ')} now have in-degree 0 → ready.` : ''}`, u);
      attach(frames, tq);
    }
    snap(order.length === n ? `Topological order: ${order.join(' → ')}. Every edge points forward in this order.` : `Only ${order.length}/${n} nodes processed → the rest are stuck in a CYCLE.`);
    return frames;
  },
};

export const unionFind = {
  title: 'Union Find',
  description: 'Each group is a tree; find() walks to the root, union() links roots.',
  defaultInput: { n: 8, edges: [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [0, 3]] },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'unions [a, b]' },
  ],
  generate({ n, edges }) {
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = new Array(n).fill(0);
    const frames = [];
    const find = (x) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const forest = (states = {}) => {
      // draw parent pointers as edges child → parent
      const e = [];
      for (let i = 0; i < n; i++) if (parent[i] !== i) e.push([i, parent[i]]);
      return graphPanel(n, e, { directed: true, states });
    };
    let groups = n;
    frames.push({ note: `Initially every element is its own group (its own root). Groups = ${n}.`, panels: [forest(), arr([...parent], { label: 'parent' }), vars({ groups })] });
    const uOpts = ['Different roots — link them', 'Same root — already connected, skip'];
    edges.forEach(([a, b], ei) => {
      const before = [...parent];
      const ra = find(a);
      const rb = find(b);
      const q = ei >= 1 ? pick(`union(${a}, ${b}): follow the parent pointers [${before.join(', ')}] to each root. Link the roots or already connected?`, uOpts[ra === rb ? 1 : 0], [uOpts[ra === rb ? 0 : 1]], ei) : null;
      if (ra === rb) {
        frames.push({ note: `union(${a}, ${b}): both have root ${ra} → already connected (this edge would form a cycle).`, panels: [forest({ [a]: 'bad', [b]: 'bad' }), arr([...parent], { label: 'parent' }), vars({ groups })] });
        attach(frames, q);
        return;
      }
      let big = ra;
      let small = rb;
      if (rank[big] < rank[small]) [big, small] = [small, big];
      parent[small] = big;
      if (rank[big] === rank[small]) rank[big]++;
      groups--;
      frames.push({ note: `union(${a}, ${b}): roots ${ra} and ${rb} differ → attach root ${small} under ${big} (union by rank). Groups = ${groups}.`, panels: [forest({ [a]: 'active', [b]: 'active', [big]: 'done' }), arr([...parent], { label: 'parent' }), vars({ groups })] });
      attach(frames, q);
    });
    return frames;
  },
};

export const dijkstra = {
  title: "Dijkstra's shortest paths",
  description: 'Always finalize the closest unfinished node (min-heap), then relax its edges.',
  defaultInput: { n: 6, edges: [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [4, 5, 9]], start: 0 },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'edges [u, v, w]' },
    { key: 'start', type: 'number', label: 'start' },
  ],
  generate({ n, edges, start }) {
    const adj = adjOf(n, edges, false);
    const dist = new Array(n).fill(Infinity);
    const done = new Array(n).fill(false);
    const states = {};
    const edgeStates = {};
    const prev = new Array(n).fill(-1);
    dist[start] = 0;
    const pq = [[0, start]];
    const frames = [];
    const fmt = () => dist.map((d) => (d === Infinity ? '∞' : d));
    const snap = (note, active) => frames.push({ note, panels: [graphPanel(n, edges, { weights: true, states: { ...states, ...(active !== undefined ? { [active]: 'active' } : {}) }, edgeStates: { ...edgeStates } }), arr(fmt(), { label: 'dist' }), { kind: 'queue', label: 'min-heap (dist, node)', values: [...pq].sort((a, b) => a[0] - b[0]).map(([d, v]) => `(${d}, ${v})`) }] });
    snap(`dist[${start}] = 0, everything else ∞. Push (0, ${start}).`);
    let pops = 0;
    let asks = 0;
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      let dq = null;
      if (!done[pq[0][1]] && pops++ >= 1 && asks < 3) {
        const heapNodes = pq.map(([, v]) => v).filter((v) => !done[v]);
        dq = pick(`Min-heap holds [${pq.map(([dd, v]) => `(${dd}, ${v})`).join(', ')}]. Which node is finalised next?`, pq[0][1], heapNodes.slice(1).reverse(), asks + 2);
        if (dq) asks++;
      }
      const [d, u] = pq.shift();
      if (done[u]) {
        snap(`Pop (${d}, ${u}) — stale entry, ${u} is already final. Skip (lazy deletion).`);
        continue;
      }
      done[u] = true;
      states[u] = 'done';
      if (prev[u] >= 0) edgeStates[`${prev[u]}-${u}`] = 'done';
      const relaxed = [];
      for (const [v, w] of adj[u]) {
        if (!done[v] && d + w < dist[v]) {
          dist[v] = d + w;
          prev[v] = u;
          pq.push([dist[v], v]);
          states[v] = 'visited';
          relaxed.push(`${v} → ${dist[v]}`);
        }
      }
      snap(`Pop (${d}, ${u}): the closest unfinished node, so ${d} is final (no negative edges can make it shorter later). ${relaxed.length ? `Relax: ${relaxed.join(', ')}.` : 'No improvements.'}`, u);
      attach(frames, dq);
    }
    snap('All nodes finalised. Green edges form the shortest-path tree. O((V + E) log V) with a heap.');
    return frames;
  },
};
