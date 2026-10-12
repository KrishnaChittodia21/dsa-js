export default {
  id: 'remove-max-number-of-edges-to-keep-graph-fully-traversable',
  title: 'Remove Max Number of Edges to Keep Graph Fully Traversable',
  difficulty: 'Hard',
  order: 3,
  pattern: 'union-find-advanced',
  tags: ['union find', 'graph', 'greedy'],
  source: { platform: 'LeetCode', number: 1579, url: 'https://leetcode.com/problems/remove-max-number-of-edges-to-keep-graph-fully-traversable/' },

  statement: `Alice and Bob share an undirected graph with nodes \`1..n\`. Each edge \`[type, u, v]\` is one of:

- type 1 — only Alice can use it,
- type 2 — only Bob can use it,
- type 3 — both can use it.

Remove as many edges as possible such that, afterwards, **Alice can still reach every node from every node** using her edges, and so can Bob. Return the maximum number of removable edges, or \`-1\` if even with all edges one of them cannot traverse the whole graph.`,
  examples: [
    { input: 'n = 4, edges = [[3,1,2],[3,2,3],[1,2,4],[1,1,3],[2,3,4],[2,1,4]]', output: '2' },
    { input: 'n = 4, edges = [[3,1,2],[3,2,3],[1,1,4],[2,1,4]]', output: '0' },
    { input: 'n = 4, edges = [[3,2,3],[1,1,2],[2,3,4]]', output: '-1' },
  ],
  constraints: ['1 <= n <= 10^5', '1 <= edges.length <= min(10^5, 3n(n−1)/2)', 'All edges are distinct'],

  think: `- Each person needs a spanning tree: exactly n − 1 useful edges. Which edges are the most "valuable" to keep?
- Why should type-3 edges be processed before type 1 and type 2?
- How do you track Alice's and Bob's connectivity separately?`,
  patternChallenge: {
    options: ['Union Find — Multi-Instance & Online', 'Dijkstra', 'Topological Sort', 'Sliding Window'],
    answer: 0,
    explanation: 'Two separate connectivity states (one per person) plus a greedy order: shared edges first. Two DSUs model it directly. No distances or orderings are involved.',
  },
  hints: [
    'Use two DSUs, one for Alice and one for Bob. Count the edges you actually keep.',
    'First add every type-3 edge to both DSUs (keep it if it merges anything in either). Then add type-1 edges to Alice\'s DSU and type-2 to Bob\'s. Removed = total − kept; −1 if either DSU is not fully connected.',
  ],
  approach: `**Greedy argument:** a type-3 edge can replace one Alice edge *and* one Bob edge. If a type-3 edge would connect two of Alice's components, using it is never worse than using a type-1 edge for the same merge. So process all type-3 edges first, then the private ones.

**Algorithm:**
1. \`alice = new UnionFind(n + 1)\`, \`bob = new UnionFind(n + 1)\`, \`kept = 0\`.
2. For each type-3 edge: \`const a = alice.union(u, v); const b = bob.union(u, v); if (a || b) kept++\`. (Call both — do not short-circuit.)
3. For each type-1 edge: \`if (alice.union(u, v)) kept++\`. For type-2: same with bob.
4. With 1-indexed nodes, slot 0 is an isolated extra group, so "fully connected" means \`count === 2\`. If either is not, return −1; else return \`edges.length − kept\`.`,

  functionName: 'maxNumEdgesToRemove',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number}
 */
function maxNumEdgesToRemove(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two type-3 edges serve both people; then one extra type-1 and one extra type-2 edge are redundant.', args: [4, [[3, 1, 2], [3, 2, 3], [1, 2, 4], [1, 1, 3], [2, 3, 4], [2, 1, 4]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Every edge is needed by someone, so nothing can be removed.', args: [4, [[3, 1, 2], [3, 2, 3], [1, 1, 4], [2, 1, 4]]], expected: 0 },
    { scenario: 'Example 3', hint: 'Alice cannot reach node 4 at all, so the answer is -1.', args: [4, [[3, 2, 3], [1, 1, 2], [2, 3, 4]]], expected: -1 },
    { scenario: 'Single shared edge (n = 2)', hint: 'One type-3 edge must be unioned in BOTH DSUs. `alice.union(u,v) || bob.union(u,v)` short-circuits and skips Bob, giving -1.', args: [2, [[3, 1, 2]]], expected: 0 },
    { scenario: 'Type 3 listed last', hint: 'If you process edges in input order, the type-1 and type-2 edges get used first and the shared edge looks redundant — process type 3 first.', args: [2, [[1, 1, 2], [2, 1, 2], [3, 1, 2]]], expected: 2 },
    { scenario: 'Separate trees, no sharing', hint: 'Alice and Bob each need their own n − 1 edges; none are removable.', args: [3, [[1, 1, 2], [2, 1, 2], [1, 2, 3], [2, 2, 3]]], expected: 0 },
    { scenario: 'Shared triangle plus extras', hint: 'Two type-3 edges already span everything; the third type-3 edge and both personal edges are removable.', args: [3, [[3, 1, 2], [3, 2, 3], [3, 1, 3], [1, 1, 3], [2, 2, 1]]], expected: 3 },
    { scenario: 'Only Alice can traverse', hint: 'Bob has no edges at all — return -1 even though Alice is fine.', args: [2, [[1, 1, 2]]], expected: -1 },
    { scenario: 'Only Bob is disconnected', hint: 'Alice reaches everything but Bob misses node 3; checking only one DSU returns a number instead of -1.', args: [3, [[3, 1, 2], [1, 2, 3], [2, 1, 2]]], expected: -1 },
    { scenario: 'Disconnected components', hint: 'Two separate pieces {1,2} and {3,4}: both people fail. A DSU of size n + 1 has an extra component for index 0 — compare against n − 1 unions or count === 2 accordingly.', args: [4, [[3, 1, 2], [3, 3, 4], [1, 1, 2], [2, 3, 4]]], expected: -1 },
    { scenario: 'All type 3, redundant cycle', hint: 'A 4-cycle of shared edges: one edge closes the cycle and can go.', args: [4, [[3, 1, 2], [3, 2, 3], [3, 3, 4], [3, 4, 1]]], expected: 1 },
    { scenario: 'Large random graph (n = 10^5)', hint: 'A shared spanning tree plus random extra edges; needs near-constant-time DSU operations (path compression / union by rank).', argsGen: '() => { const n = 100000; let s = 31; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const seen = new Set(); const e = []; const add = (t, u, v) => { if (u === v) return; if (u > v) [u, v] = [v, u]; const k = t * 1e10 + u * 1e5 + v; if (seen.has(k)) return; seen.add(k); e.push([t, u, v]); }; for (let i = 2; i <= n; i++) add(3, 1 + (r() % (i - 1)), i); while (e.length < 100000) add(1 + (r() % 3), 1 + (r() % n), 1 + (r() % n)); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [n, e]; }', expected: 1, timeLimitMs: 1000 },
    { scenario: 'Large parallel chains (n = 5·10^4)', hint: 'Personal chains for both people plus two late shared edges: type 3 first means the shared edges replace one personal edge each.', argsGen: '() => { const n = 50000; const e = []; for (let i = 1; i < n; i++) { e.push([1, i, i + 1]); e.push([2, i, i + 1]); } e.push([3, 1, n]); e.push([3, 1, 2]); return [n, e]; }', expected: 4, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxNumEdgesToRemove(n, edges) {
  const alice = new UnionFind(n + 1);        // nodes 1..n (slot 0 unused)
  const bob = new UnionFind(n + 1);
  let kept = 0;

  for (const [t, u, v] of edges) {           // shared edges first
    if (t !== 3) continue;
    const a = alice.union(u, v);
    const b = bob.union(u, v);               // call both: no short-circuit!
    if (a || b) kept++;
  }
  for (const [t, u, v] of edges) {
    if (t === 1 && alice.union(u, v)) kept++;
    else if (t === 2 && bob.union(u, v)) kept++;
  }

  // count === 2 means {1..n} is one group plus the unused slot 0
  if (alice.count !== 2 || bob.count !== 2) return -1;
  return edges.length - kept;
}`,
  },
  dryRun: {
    columns: ['edge', 'Alice union', 'Bob union', 'kept'],
    rows: [
      ['[3,1,2]', 'yes', 'yes', '1'],
      ['[3,2,3]', 'yes', 'yes', '2'],
      ['[1,2,4]', 'yes', '—', '3'],
      ['[1,1,3]', 'no (1,3 connected)', '—', '3'],
      ['[2,3,4]', '—', 'yes', '4'],
      ['[2,1,4]', '—', 'no', '4 → removed = 6 − 4 = 2'],
    ],
  },
  complexity: { time: 'O(n + E · α(n))', space: 'O(n)', explanation: 'Two DSUs of size n + 1; each edge is examined twice at most.' },
  alternative: {
    title: 'Count-based finish',
    md: 'Instead of checking `count`, note that a spanning tree needs n − 1 successful unions: track aliceEdges and bobEdges (type-3 successes count for both) and require both to equal n − 1.',
    complexity: 'Same O(n + E · α(n))',
  },
  mistakes: ['`alice.union(u,v) || bob.union(u,v)` short-circuits and skips Bob\'s union.', 'Processing edges in input order instead of type 3 first.', 'Checking count === 1 with a DSU of size n + 1.'],
};
