export default {
  id: 'shortest-path-visiting-all-nodes',
  title: 'Shortest Path Visiting All Nodes',
  difficulty: 'Hard',
  order: 2,
  pattern: 'graph-state-space-bfs',
  tags: ['graph', 'bfs', 'bitmask', 'state space'],
  source: { platform: 'LeetCode', number: 847, url: 'https://leetcode.com/problems/shortest-path-visiting-all-nodes/' },

  statement: `You have a connected, undirected graph with \`n\` nodes labelled \`0..n-1\`, given as an adjacency list \`graph\`.

Return the length (number of edges) of the shortest walk that visits **every node at least once**. You may start and stop at any node, revisit nodes, and reuse edges.`,
  examples: [
    { input: 'graph = [[1,2,3],[0],[0],[0]]', output: '4', explanation: 'One order: 1 → 0 → 2 → 0 → 3.' },
    { input: 'graph = [[1],[0,2,4],[1,3,4],[2],[1,2]]', output: '4', explanation: 'One order: 0 → 1 → 4 → 2 → 3.' },
  ],
  constraints: ['1 <= n <= 12', 'The graph is connected', 'No self-loops'],

  think: `- Why is "which node am I on" not enough to describe your progress?
- How many different "sets of visited nodes" are there for n = 12? Can you store one as a single number?
- The walk can start anywhere. How do you start BFS from all nodes at once?`,
  patternChallenge: {
    options: ['BFS over (node, visited-mask) states', 'DFS from every node', 'Topological Sort', 'Greedy nearest unvisited node'],
    answer: 0,
    explanation: 'Revisiting is allowed, so a plain visited-per-node BFS is wrong. The state that matters is (current node, set of visited nodes). With n ≤ 12 there are n · 2^n ≈ 49k states, and each move costs 1 → BFS. Greedy nearest-neighbour is not optimal in general.',
  },
  hints: [
    'Encode the visited set as a bitmask: bit i is 1 if node i has been visited. Moving to v gives mask | (1 << v).',
    'Seed the queue with (i, 1 << i) for every i at distance 0. The first state whose mask is (1 << n) − 1 gives the answer.',
  ],
  approach: `**Brute force:** try all orders of visiting (n! permutations) with shortest paths between them — hopeless for n = 12.

**BFS over states:** a state is \`(node, mask)\`, where \`mask\` is the set of visited nodes as bits (see the lesson for bitmask basics). Each edge \`u → v\` moves \`(u, mask)\` to \`(v, mask | (1 << v))\` with cost 1. Multi-source: every \`(i, 1 << i)\` starts at distance 0 because the walk may begin anywhere. BFS returns the first distance where \`mask === full\`. There are \`n · 2^n\` states and each has up to \`n\` moves → O(2^n · n²).`,

  functionName: 'shortestPathLength',
  paramNames: ['graph'],
  starterCode: `/**
 * @param {number[][]} graph
 * @return {number}
 */
function shortestPathLength(graph) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A star: you must pass back through the hub 0 between leaves.', args: [[[1, 2, 3], [0], [0], [0]]], expected: 4 },
    { scenario: 'Example 2', hint: 'One order: 0 → 1 → 4 → 2 → 3.', args: [[[1], [0, 2, 4], [1, 3, 4], [2], [1, 2]]], expected: 4 },
    { scenario: 'Single node', hint: 'n = 1: the walk is empty, length 0.', args: [[[]]], expected: 0 },
    { scenario: 'Two nodes', hint: 'One edge covers both nodes.', args: [[[1], [0]]], expected: 1 },
    { scenario: 'Triangle', hint: 'Two edges visit all three nodes.', args: [[[1, 2], [0, 2], [0, 1]]], expected: 2 },
    { scenario: 'Tree with a fork', hint: 'Leaves 0 and 1 both hang off node 2, so the walk must go back through 2 once: start at one leaf and end at node 4.', args: [[[2], [2], [0, 1, 3], [2, 4], [3]]], expected: 5 },
    { scenario: 'Start anywhere', hint: 'Starting from node 0 (the middle) forces backtracking; starting at node 1 gives 4. Seed BFS with every node.', args: [[[1, 2], [0], [0, 3], [2, 4], [3]]], expected: 4 },
    { scenario: 'Revisit the hub', hint: 'Visited must be (node, set of visited nodes): marking only nodes forbids passing through 0 again.', args: [[[1, 2, 3, 4, 5], [0], [0], [0], [0], [0]]], expected: 8 },
    { scenario: 'Cycle of six', hint: 'Walk around the cycle: 5 edges.', args: [[[1, 5], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0]]], expected: 5 },
    { scenario: 'Two stars joined', hint: 'Two hubs with leaves: the walk revisits each hub.', args: [[[1, 2, 3], [0], [0], [0, 4], [3, 5, 6], [4], [4]]], expected: 8 },
    { scenario: 'Largest path (n = 12)', hint: 'A path of 12 nodes: 11 edges from one end to the other.', argsGen: '() => [Array.from({ length: 12 }, (_, i) => [i - 1, i + 1].filter((j) => j >= 0 && j < 12))]', expected: 11, timeLimitMs: 1000 },
    { scenario: 'Largest star (n = 12)', hint: 'Star with 11 leaves: start and end at leaves, 2·11 − 2 = 20 edges. State BFS covers n·2^n states; trying all node orders (12!) is far too slow.', argsGen: '() => [[Array.from({ length: 11 }, (_, i) => i + 1), ...Array.from({ length: 11 }, () => [0])]]', expected: 20, timeLimitMs: 1000 },
    { scenario: 'Complete graph (n = 12)', hint: 'Every pair adjacent: 11 edges, but each state has 11 moves — the densest case.', argsGen: '() => [Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => j).filter((j) => j !== i))]', expected: 11, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shortestPathLength(graph) {
  const n = graph.length;
  const full = (1 << n) - 1;
  // seen[node][mask] — have we already reached this exact state?
  const seen = Array.from({ length: n }, () => new Uint8Array(1 << n));
  let queue = [];
  for (let i = 0; i < n; i++) {
    queue.push([i, 1 << i]);
    seen[i][1 << i] = 1;
  }
  for (let steps = 0; queue.length; steps++) {
    const next = [];
    for (const [u, mask] of queue) {
      if (mask === full) return steps;
      for (const v of graph[u]) {
        const m2 = mask | (1 << v);
        if (!seen[v][m2]) { seen[v][m2] = 1; next.push([v, m2]); }
      }
    }
    queue = next;
  }
  return -1; // unreachable for a connected graph
}`,
    explanation: 'Level-by-level BFS: `steps` is the number of edges walked for every state in the current level.',
  },
  dryRun: { columns: ['steps', 'example state (node, mask)', 'meaning'], rows: [['0', '(1, 0010)', 'start at 1'], ['1', '(0, 0011)', 'visited {0,1}'], ['2', '(2, 0111)', 'visited {0,1,2}'], ['3', '(0, 0111)', 'back at 0 — new state? no, (0,0111) differs from (0,0011) → allowed'], ['4', '(3, 1111)', 'all visited → answer 4']] },
  complexity: { time: 'O(2^n · n²)', space: 'O(2^n · n)', explanation: 'n · 2^n states, each scanning up to n neighbours. For n = 12: about 590k transitions.' },
  alternative: {
    title: 'Floyd–Warshall + bitmask DP (TSP style)',
    md: 'Compute all-pairs shortest distances, then dp[mask][i] = shortest walk visiting mask and ending at i. Same O(2^n · n²), but uses DP ideas from later topics.',
    complexity: 'O(2^n · n²) time, O(2^n · n) space',
  },
  mistakes: [
    'Marking only the node as visited — you then cannot pass back through a hub (test 1 needs to revisit 0).',
    'Starting BFS from node 0 only — the best walk may start elsewhere.',
    'Handling n = 1 incorrectly (answer 0).',
  ],
};
