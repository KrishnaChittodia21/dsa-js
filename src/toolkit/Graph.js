// Graph stored as an adjacency list: Map<node, Array<{ to, weight }>>.
export class Graph {
  constructor(directed = false) {
    this.directed = directed;
    this.adj = new Map();
  }
  addNode(u) {
    if (!this.adj.has(u)) this.adj.set(u, []);
    return this;
  }
  addEdge(u, v, weight = 1) {
    this.addNode(u).addNode(v);
    this.adj.get(u).push({ to: v, weight });
    if (!this.directed) this.adj.get(v).push({ to: u, weight });
    return this;
  }
  neighbors(u) {
    return this.adj.get(u) || [];
  }
  nodes() {
    return [...this.adj.keys()];
  }
  bfs(start) {
    const order = [];
    const seen = new Set([start]);
    const queue = [start];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      order.push(u);
      for (const { to } of this.neighbors(u)) {
        if (!seen.has(to)) {
          seen.add(to);
          queue.push(to);
        }
      }
    }
    return order;
  }
  dfs(start) {
    const order = [];
    const seen = new Set();
    const visit = (u) => {
      seen.add(u);
      order.push(u);
      for (const { to } of this.neighbors(u)) if (!seen.has(to)) visit(to);
    };
    visit(start);
    return order;
  }
  // Build from an edge list like [[0,1],[1,2]] or [[0,1,5]] (with weights).
  static fromEdges(n, edges, directed = false) {
    const g = new Graph(directed);
    for (let i = 0; i < n; i++) g.addNode(i);
    for (const [u, v, w = 1] of edges) g.addEdge(u, v, w);
    return g;
  }
}

// Plain adjacency-list array for nodes 0..n-1 — the fastest shape for interview code.
export function buildAdjList(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u);
  }
  return adj;
}
