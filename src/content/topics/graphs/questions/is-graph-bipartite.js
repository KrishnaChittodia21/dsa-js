export default {
  id: 'is-graph-bipartite',
  title: 'Is Graph Bipartite?',
  difficulty: 'Medium',
  order: 8,
  pattern: 'graph-bipartite-coloring',
  tags: ['graph', 'bfs', 'coloring'],
  source: { platform: 'LeetCode', number: 785, url: 'https://leetcode.com/problems/is-graph-bipartite/' },

  statement: `You are given an undirected graph with \`n\` vertices as an adjacency list \`graph\`: \`graph[u]\` lists the neighbours of \`u\`. There are no self-loops or parallel edges, and the graph **may be disconnected**.

Return \`true\` if the vertices can be split into two sets A and B such that every edge connects a vertex in A with a vertex in B.`,
  examples: [
    { input: 'graph = [[1,2,3],[0,2],[0,1,3],[0,2]]', output: 'false', explanation: '0–1–2 is a triangle (odd cycle).' },
    { input: 'graph = [[1,3],[0,2],[1,3],[0,2]]', output: 'true', explanation: 'A = {0, 2}, B = {1, 3}.' },
  ],
  constraints: ['1 <= n <= 100', 'graph[u] does not contain u', 'If v is in graph[u], u is in graph[v]'],

  think: `- If vertex 0 is in set A, where must all its neighbours be? And their neighbours?
- What kind of cycle makes the split impossible?
- What if vertex 0 has no edges at all but other vertices do?`,
  patternChallenge: {
    options: ['Topological Sort', 'Backtracking over all 2^n splits', 'BFS/DFS 2-colouring', 'Dijkstra'],
    answer: 2,
    explanation: 'Once one vertex is coloured, all colours in its component are forced (neighbour = opposite colour). A traversal either colours everything consistently or finds a same-colour edge. Trying all 2^n splits is exponential and unnecessary.',
  },
  hints: [
    'Keep `color[v]` = -1 (uncoloured), 0 or 1. Start from EVERY uncoloured vertex (the graph may be disconnected).',
    'BFS: uncoloured neighbour → give it `1 - color[u]`; neighbour with the same colour as u → return false.',
  ],
  approach: `**Brute force:** try every assignment of vertices to A/B: O(2^n · m).

**2-colouring BFS:** colours are forced inside a component, so a traversal decides everything. For each uncoloured start: colour 0, BFS; each uncoloured neighbour gets the opposite colour; an already-coloured neighbour with the **same** colour proves an odd cycle → not bipartite. O(V + E).`,

  functionName: 'isBipartite',
  paramNames: ['graph'],
  starterCode: `/**
 * @param {number[][]} graph
 * @return {boolean}
 */
function isBipartite(graph) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '0–1–2 is a triangle (odd cycle), so no 2-colouring exists.', args: [[[1,2,3],[0,2],[0,1,3],[0,2]]], expected: false },
    { scenario: 'Example 2', hint: 'A 4-cycle splits into {0,2} and {1,3}.', args: [[[1,3],[0,2],[1,3],[0,2]]], expected: true },
    { scenario: 'Single vertex', hint: 'One vertex, no edges — trivially bipartite.', args: [[[]]], expected: true },
    { scenario: 'Single edge', hint: 'Two vertices joined by an edge go to different sides.', args: [[[1],[0]]], expected: true },
    { scenario: 'Isolated 0, triangle elsewhere', hint: 'Starting only from vertex 0 misses the triangle {1,2,3}. Start a BFS from every uncoloured vertex.', args: [[[],[2,3],[1,3],[1,2]]], expected: false },
    { scenario: 'Two separate edges', hint: 'A disconnected graph whose components are both bipartite.', args: [[[1],[0],[3],[2]]], expected: true },
    { scenario: 'Odd cycle of length 5', hint: 'Any odd cycle forces two adjacent vertices onto the same side.', args: [[[1,4],[0,2],[1,3],[2,4],[3,0]]], expected: false },
    { scenario: 'Long path', hint: 'A path alternates colours all the way along.', args: [[[1],[0,2],[1,3],[2,4],[3,5],[4]]], expected: true },
    { scenario: 'Colour 0 is a real colour', hint: 'If you test "uncoloured" with !color[v], vertices coloured 0 look unvisited and get recoloured. Use -1 for uncoloured.', args: [[[1,2],[0,3],[0,3],[1,2,4],[3]]], expected: true },
    { scenario: 'Good component, then bad one', hint: 'The first component is fine but the second has a triangle — do not return true after checking only one component.', args: [[[1],[0],[3,4],[2,4],[2,3]]], expected: false },
    { scenario: 'All isolated vertices', hint: 'No edges at all: every vertex is its own component and the answer is true.', args: [[[],[],[],[]]], expected: true },
    { scenario: 'Odd cycle (n = 99)', hint: 'A 99-vertex ring is an odd cycle: the conflict only appears when the traversal closes the loop.', argsGen: '() => [Array.from({ length: 99 }, (_, i) => [(i + 98) % 99, (i + 1) % 99])]', expected: false },
    { scenario: 'Complete bipartite K(50,50)', hint: 'The maximum n = 100 with 2,500 edges, all crossing between the two halves.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => Array.from({ length: 50 }, (_, j) => (i < 50 ? 50 + j : j)))]', expected: true },
  ],

  solution: {
    code: `function isBipartite(graph) {
  const n = graph.length;
  const color = new Int8Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;        // already handled with its component
    color[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of graph[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];        // forced opposite colour
          queue.push(v);
        } else if (color[v] === color[u]) {
          return false;                   // same colour on both ends → odd cycle
        }
      }
    }
  }
  return true;
}`,
  },
  dryRun: { columns: ['pop', 'color[u]', 'neighbour', 'result'], rows: [['0', '0', '1, 2, 3', 'all get colour 1'], ['1', '1', '0 (0) ok, 2 (1)', 'same colour → false']] },
  complexity: { time: 'O(V + E)', space: 'O(V)', explanation: 'Each vertex is coloured once and each adjacency entry checked once.' },
  alternative: { title: 'DFS colouring', md: '`dfs(u, c)`: set color[u] = c; for each neighbour, if uncoloured recurse with 1 − c, else if color equals c return false.', complexity: 'O(V + E) time, O(V) space' },
  mistakes: [
    'Starting only from vertex 0 — test 5 has an isolated vertex 0 and a triangle elsewhere.',
    'Using `!color[v]` to test "uncoloured" when colour 0 is a valid colour.',
    'Returning true as soon as one component is fine.',
  ],
};
