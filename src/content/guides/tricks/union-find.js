export default {
  signals: [
    '"swap any pair any number of times" → swaps are transitive, so each group can be freely rearranged',
    'queries "is there a path using only edges with weight < limit" → sort edges and queries offline',
    '"last day you can still cross" / "when does it become connected" → add things in time order',
    '"similar" or "equivalent" strings form groups',
    '"minimum cables to connect all computers" → components − 1',
    'adding edges and asking "is the graph still bipartite?"',
    '"find the next free slot / seat / day" repeatedly',
  ],
  tricks: [
    {
      title: 'Answer threshold queries offline: sort both lists',
      kind: 'template',
      md: 'For "can u reach v using only edges lighter than limit" questions, sort the edges by weight and the queries by limit. Move one pointer through the edges, union every edge below the current limit, then answer the query with `find(u) === find(v)`. Each edge is added once, so the total is O((E + Q) log) for sorting plus almost-constant DSU work. Remember the original query index so answers go back in input order.',
      code: `function limitedPaths(n, edges, queries) {
  const p = Array.from({ length: n }, (_, i) => i);
  const find = (x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
  edges.sort((a, b) => a[2] - b[2]);
  const order = queries.map((_, i) => i).sort((a, b) => queries[a][2] - queries[b][2]);
  const ans = new Array(queries.length);
  let e = 0;
  for (const qi of order) {
    const [u, v, limit] = queries[qi];
    while (e < edges.length && edges[e][2] < limit) { p[find(edges[e][0])] = find(edges[e][1]); e++; }
    ans[qi] = find(u) === find(v);
  }
  return ans;
}
console.log(limitedPaths(3, [[0, 1, 2], [1, 2, 4]], [[0, 2, 5], [0, 2, 4]])); // [ true, false ]`,
    },
    {
      title: 'Parity DSU: check bipartiteness while edges arrive',
      kind: 'template',
      md: 'Store `par[x]`, the colour of x compared with its parent (0 = same, 1 = different). During `find`, add up these values with XOR all the way to the root. To add an edge (a, b) that must join different colours: if a and b already share a root and have the same parity, the edge closes an odd cycle, so the graph is not bipartite. Otherwise link the roots with parity `pa ^ pb ^ 1`.',
      code: `const n = 3, p = [0, 1, 2], par = [0, 0, 0];
function find(x) {                        // returns [root, parity of x vs root]
  if (p[x] === x) return [x, 0];
  const [r, pp] = find(p[x]);
  par[x] ^= pp; p[x] = r;
  return [r, par[x]];
}
function addEdge(a, b) {                  // false → odd cycle
  const [ra, pa] = find(a), [rb, pb] = find(b);
  if (ra === rb) return pa !== pb;
  p[ra] = rb; par[ra] = pa ^ pb ^ 1; return true;
}
console.log(addEdge(0, 1), addEdge(1, 2), addEdge(2, 0)); // true true false`,
    },
    {
      title: 'Keep group stats at the root',
      kind: 'template',
      md: 'Size, sum, min, max, or an "is still bipartite" flag can all live in arrays indexed by the root. When you link `rb` under `ra`, merge `rb`\'s stats into `ra`, e.g. `size[ra] += size[rb]`, `mn[ra] = Math.min(mn[ra], mn[rb])`. Only the root\'s values matter. Keep a running `best = Math.max(best, size[ra])` and "largest group so far" costs O(1) per query.',
    },
    {
      title: '"Next free slot" pointers',
      kind: 'optimization',
      md: 'To fill slots, have `next[i]` point to the next slot that might still be free, with a sentinel at `n`. `find(i)` jumps to the first free slot at or after i. When you fill slot s, set `next[s] = s + 1`. Path compression means each filled slot is skipped almost for free afterwards. Use it for painting ranges offline, booking seats, and "assign the earliest free day".',
      code: `const n = 5, next = Array.from({ length: n + 1 }, (_, i) => i);
const find = (x) => { while (next[x] !== x) { next[x] = next[next[x]]; x = next[x]; } return x; };
function take(from) {                      // claim first free slot >= from
  const s = find(from);
  if (s === n) return -1;
  next[s] = s + 1;
  return s;
}
console.log(take(1), take(1), take(0), take(4), take(4)); // 1 2 0 4 -1`,
    },
    {
      title: 'Lazy Map-based DSU for keys you don\'t know in advance',
      kind: 'javascript',
      md: 'When the keys are strings or coordinates and you don\'t know them up front, create each parent entry the first time `find` sees the key. Use a `Map`, not a plain object. A Map keeps number keys as numbers, has no prototype keys like `"constructor"`, and is faster when keys are added often. Count components with a counter that goes up on each new key and down on each successful union.',
      code: `const parent = new Map();
let groups = 0;
function find(x) {
  if (!parent.has(x)) { parent.set(x, x); groups++; }
  while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
  return x;
}
function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) { parent.set(ra, rb); groups--; } }
union('alice@x', 'bob@x'); union('carol@y', 'carol@y'); find('dave@z');
console.log(groups); // 3`,
    },
    {
      title: 'Grid DSU: union only right and down',
      kind: 'optimization',
      md: 'Use `id = r * C + c`. When you scan the whole grid, union each land cell only with its right and down neighbours. Every adjacent pair still gets joined once, and you do half the `find` calls compared with checking all four directions. When cells are added one at a time ("number of islands II"), you do need all four directions, because the new cell may touch land on any side.',
    },
    {
      title: 'Always group by find(x), never by parent[x]',
      kind: 'edge-cases',
      md: 'After all the unions, `parent[x]` can still point to a node that is not the root (path compression only fixes paths that `find` has walked). When you group items (accounts merge, smallest string with swaps), call `find(x)` for every item. Bugs here usually show up as groups that are split into several pieces.',
      code: `const p = [0, 0, 1, 2];                    // chain 3 → 2 → 1 → 0
const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
const byParent = new Set(p).size;
const byRoot = new Set(p.map((_, i) => find(i))).size;
console.log(byParent, byRoot); // 3 1`,
    },
    {
      title: 'Know when NOT to use DSU',
      kind: 'interview',
      md: 'DSU models a relation that is symmetric and transitive. It ignores edge direction, so it cannot answer "can u reach v" in a directed graph or find directed cycles. It also cannot split groups. For a single static graph with one question, a plain BFS is just as fast and easier to explain. Choose DSU when edges arrive over time or when you have many connectivity queries, and say so.',
    },
    {
      title: 'Know what each optimisation gives you alone',
      kind: 'interview',
      md: 'Union by size (or rank) alone keeps trees at depth O(log n). Path compression alone gives O(log n) amortized. Together they give O(α(n)), which is at most 4 for any realistic input. If you are short on time, writing union by size alone is safe and easy to justify.',
    },
    {
      title: 'Make network connected: count extra edges first',
      kind: 'recognition',
      md: 'Connecting n computers needs at least n − 1 cables, so if `connections.length < n - 1` the answer is -1. Otherwise the answer is always `components - 1`. Each extra cable inside a component can be moved to join two components, and there are always enough of them.',
    },
  ],
  traps: [
    { looksLike: 'Union Find for a cycle in a directed graph', actually: 'DFS colours or Kahn', why: 'DSU ignores direction, so u→v and v→u look like the same undirected edge' },
    { looksLike: 'Re-run BFS after each added cell (number of islands II)', actually: 'Incremental DSU', why: 'BFS per addition is O(k·R·C); DSU keeps the island count up to date in near O(1) per cell' },
    { looksLike: 'Union Find with deletions', actually: 'Process the operations in reverse as additions', why: 'DSU can merge groups but never split them' },
    { looksLike: 'Graph of accounts compared pairwise', actually: 'DSU keyed by email', why: 'comparing all pairs of accounts is O(n²); unioning each account\'s emails with its first email is linear' },
  ],
  sources: [
    { label: 'CP-Algorithms — Disjoint Set Union', url: 'https://cp-algorithms.com/data_structures/disjoint_set_union.html' },
    { label: 'CP-Algorithms — Kruskal with DSU', url: 'https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html' },
  ],
};
