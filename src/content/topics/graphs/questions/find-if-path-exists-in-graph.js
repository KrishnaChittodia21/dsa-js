export default {
  id: 'find-if-path-exists-in-graph',
  title: 'Find if Path Exists in Graph',
  difficulty: 'Easy',
  order: 3,
  pattern: 'graph-dfs',
  tags: ['graph', 'dfs', 'bfs'],
  source: { platform: 'LeetCode', number: 1971, url: 'https://leetcode.com/problems/find-if-path-exists-in-graph/' },

  statement: `There is an undirected graph with \`n\` vertices labelled \`0..n-1\` and an edge list \`edges\` (\`edges[i] = [u, v]\`). There are no self-loops and no duplicate edges.

Return \`true\` if there is a path from \`source\` to \`destination\`, otherwise \`false\`.`,
  examples: [
    { input: 'n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2', output: 'true', explanation: '0 → 2 directly (or 0 → 1 → 2).' },
    { input: 'n = 6, edges = [[0,1],[0,2],[3,5],[5,4],[4,3]], source = 0, destination = 5', output: 'false', explanation: '{0,1,2} and {3,4,5} are different components.' },
  ],
  constraints: ['1 <= n <= 2 * 10^5', '0 <= edges.length <= 2 * 10^5', '0 <= source, destination < n'],

  think: `- The input is an edge list. What is slow about finding the neighbours of a vertex in an edge list?
- What should happen when you reach a vertex twice?
- With n up to 200,000, is recursion safe?`,
  patternChallenge: {
    options: ['Graph DFS / BFS reachability', 'Topological Sort', 'Two Pointers', 'Dijkstra'],
    answer: 0,
    explanation: 'The question is pure reachability in an undirected, unweighted graph: build an adjacency list and traverse from source. Topological sort needs a directed acyclic graph; Dijkstra is for weighted shortest paths.',
  },
  hints: [
    'Convert `edges` into an adjacency list (both directions!).',
    'Traverse from `source` with an explicit stack and a visited Uint8Array; return true as soon as you pop `destination`.',
  ],
  approach: `**Brute force:** repeatedly scan the whole edge list to find neighbours — O(n·m).

**Optimized:** build an adjacency list in O(n + m), then DFS (or BFS) from \`source\` with a visited array. Stop early when \`destination\` is found. An **iterative** stack avoids the recursion limit: a path graph with 200,000 vertices would be 200,000 frames deep. (Union-Find, a later topic, also solves this.)`,

  functionName: 'validPath',
  paramNames: ['n', 'edges', 'source', 'destination'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @param {number} source
 * @param {number} destination
 * @return {boolean}
 */
function validPath(n, edges, source, destination) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A triangle: 0 reaches 2 directly — the basic case from the statement.', args: [3,[[0,1],[1,2],[2,0]],0,2], expected: true },
    { scenario: 'Example 2', hint: 'Two separate components {0,1,2} and {3,4,5}; there is no path between them.', args: [6,[[0,1],[0,2],[3,5],[5,4],[4,3]],0,5], expected: false },
    { scenario: 'Single vertex, no edges', hint: 'source === destination is always reachable, even with no edges at all.', args: [1,[],0,0], expected: true },
    { scenario: 'Two isolated vertices', hint: 'No edges and different endpoints → false.', args: [2,[],0,1], expected: false },
    { scenario: 'Same source and destination', hint: 'Return true immediately when source equals destination, even if that vertex is isolated.', args: [4,[[0,1],[1,2]],3,3], expected: true },
    { scenario: 'Edge stored in reverse', hint: 'Edges are undirected: [1,0] must let you travel 0 → 1. Adding only one direction fails here.', args: [3,[[1,0],[2,1]],0,2], expected: true },
    { scenario: 'Path walks back down a chain', hint: 'Travel from the end of a chain to its start — again both directions of each edge are needed.', args: [5,[[0,1],[1,2],[2,3],[3,4]],4,0], expected: true },
    { scenario: 'Disconnected, adjacent labels', hint: 'Labels 1 and 2 are numerically adjacent but in different components.', args: [4,[[0,1],[2,3]],1,2], expected: false },
    { scenario: 'Many components, target isolated', hint: 'The destination has no edges at all, so nothing can reach it.', args: [7,[[0,1],[1,2],[3,4],[4,5]],0,6], expected: false },
    { scenario: 'Star through a hub', hint: 'Every path goes through hub 4; a correct traversal finds 5 → 4 → 0 → 9.', args: [10,[[4,3],[1,4],[4,8],[1,7],[6,4],[4,2],[7,4],[4,0],[0,9],[5,4]],5,9], expected: true },
    { scenario: 'Cycle with a far target', hint: 'A ring: the visited set prevents looping forever around the cycle.', args: [6,[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]],2,5], expected: true },
    { scenario: 'Long chain (n = 2·10^5)', hint: 'A 200,000-vertex path: recursive DFS overflows the call stack — use an explicit stack or BFS queue.', argsGen: '() => { const n = 200000; return [n, Array.from({ length: n - 1 }, (_, i) => [i, i + 1]), 0, n - 1]; }', expected: true },
    { scenario: 'Scrambled chain (n = 10^5)', hint: 'The chain\'s edges are listed in reverse order: re-scanning the edge list until nothing changes is O(n·m). Build an adjacency list once.', argsGen: '() => { const n = 100000; return [n, Array.from({ length: n - 1 }, (_, i) => [n - 2 - i, n - 1 - i]), 0, n - 1]; }', expected: true, timeLimitMs: 1000 },
    { scenario: 'Large, two halves (n = 10^5)', hint: 'Two big components and the target in the other one: the whole first half must be explored before answering false.', argsGen: '() => { const n = 100000, h = n / 2, e = []; for (let i = 0; i + 1 < h; i++) { e.push([i, i + 1]); e.push([h + i, h + i + 1]); } return [n, e, 0, n - 1]; }', expected: false },
  ],

  solution: {
    code: `function validPath(n, edges, source, destination) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }

  const visited = new Uint8Array(n);
  const stack = [source];
  visited[source] = 1;
  while (stack.length) {
    const u = stack.pop();
    if (u === destination) return true;
    for (const v of adj[u]) {
      if (!visited[v]) { visited[v] = 1; stack.push(v); }
    }
  }
  return false;
}`,
    explanation: 'Iterative DFS: the last test is a 20,000-vertex chain that would be risky with recursion.',
  },
  dryRun: { columns: ['stack', 'pop', 'push'], rows: [['[0]', '0', '1, 2'], ['[1, 2]', '2', '— (0, 1 visited)'], ['—', 'found destination 2', 'return true']] },
  complexity: { time: 'O(n + m)', space: 'O(n + m)', explanation: 'Building the adjacency list touches every edge twice; each vertex is pushed at most once.' },
  alternative: {
    title: 'Union-Find',
    md: 'Union the endpoints of every edge, then check `find(source) === find(destination)`. Near-O(1) per edge; you will learn it in the Union-Find topic. The toolkit already exposes `UnionFind`.',
    complexity: 'O((n + m) · α(n)) time, O(n) space',
  },
  mistakes: [
    'Adding only one direction of each undirected edge.',
    'Recursive DFS on a long chain → maximum call stack exceeded.',
    'Forgetting the case source === destination (true, even with no edges).',
  ],
};
