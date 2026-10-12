export default {
  id: 'path-with-maximum-probability',
  title: 'Path with Maximum Probability',
  difficulty: 'Medium',
  order: 4,
  pattern: 'shortest-path-dijkstra',
  tags: ['graph', 'shortest path', 'heap', 'dijkstra'],
  source: { platform: 'LeetCode', number: 1514, url: 'https://leetcode.com/problems/path-with-maximum-probability/' },

  statement: `You are given an undirected graph with \`n\` nodes (\`0\` to \`n - 1\`). Edge \`edges[i] = [a, b]\` succeeds with probability \`succProb[i]\` when you traverse it.

Return the **maximum probability** of successfully going from \`start\` to \`end\` (the probability of a path is the **product** of its edge probabilities). If there is no path, return \`0\`. Answers within \`1e-5\` are accepted.`,
  examples: [
    { input: 'n = 3, edges = [[0,1],[1,2],[0,2]], succProb = [0.5,0.5,0.2], start = 0, end = 2', output: '0.25', explanation: '0 → 1 → 2 has probability 0.5 × 0.5 = 0.25, better than the direct 0.2.' },
    { input: 'n = 3, edges = [[0,1],[1,2],[0,2]], succProb = [0.5,0.5,0.3], start = 0, end = 2', output: '0.3' },
    { input: 'n = 3, edges = [[0,1]], succProb = [0.5], start = 0, end = 2', output: '0' },
  ],
  constraints: ['2 <= n <= 10^4', '0 <= edges.length <= 2·10^4', '0 <= succProb[i] <= 1', 'start != end', 'No duplicate edges'],

  think: `- Instead of minimising a sum, you maximise a product. When you extend a path by an edge with p ≤ 1, can its probability go up?
- If extending never helps, which algorithm's greedy argument still works?
- Which heap do you need now — min or max?`,
  patternChallenge: {
    options: ['BFS counting edges', 'Dijkstra with a max-heap, multiplying probabilities', 'Bellman-Ford with k rounds', 'Floyd-Warshall'],
    answer: 1,
    explanation: 'Probabilities are in [0, 1], so multiplying by another edge never increases a path\'s value — the same monotonicity Dijkstra needs, mirrored. Pop the most probable node from a max-heap; it is final. BFS ignores the probabilities, Bellman-Ford is slower and there is no edge limit, and Floyd-Warshall is O(n³) with n = 10^4.',
  },
  hints: [
    '`best[v]` = highest probability found to reach v. Start with best[start] = 1.',
    'Use a MaxHeap of `[prob, node]`. Relax with `p * edgeProb > best[v]`. Return the probability when `end` is popped.',
  ],
  approach: `**Brute force:** enumerate all simple paths and multiply — exponential.

**Trick 1 (logs):** maximising a product of p's = minimising the sum of \`−log p\`, which are non-negative → ordinary Dijkstra. Works, but floating logs are noisy.

**Trick 2 (direct):** run Dijkstra with a **max**-heap and multiplication:
1. Build an undirected adjacency list \`[neighbour, prob]\`.
2. \`best[start] = 1\`; push \`[1, start]\` into a \`MaxHeap\`.
3. Pop \`[p, u]\`; if u is end return p; skip if \`p < best[u]\` (stale); relax \`p * q\`.
4. If the heap empties, return 0.`,

  functionName: 'maxProbability',
  paramNames: ['n', 'edges', 'succProb', 'start', 'end'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @param {number[]} succProb
 * @param {number} start
 * @param {number} end
 * @return {number}
 */
function maxProbability(n, edges, succProb, start, end) {
  
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: '0 → 1 → 2 gives 0.25, better than the direct 0.2.', args: [3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.2], 0, 2], expected: 0.25 },
    { scenario: 'Example 2', hint: 'Now the direct edge 0.3 beats 0.25.', args: [3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.3], 0, 2], expected: 0.3 },
    { scenario: 'Example 3', hint: 'Node 2 is unreachable — return 0. Initialising best with Infinity breaks this.', args: [3, [[0, 1]], [0.5], 0, 2], expected: 0 },
    { scenario: 'Certain edge', hint: 'Probability 1 along the only edge.', args: [2, [[0, 1]], [1], 0, 1], expected: 1 },
    { scenario: 'Zero-probability edge', hint: 'An edge with probability 0 is as good as no path: answer 0.', args: [2, [[0, 1]], [0], 0, 1], expected: 0 },
    { scenario: 'No edges at all', hint: 'Empty edge list: return 0.', args: [2, [], [], 0, 1], expected: 0 },
    { scenario: 'Undirected edges', hint: 'start = 3, end = 0: edges listed as [0,1], [1,3] must be walked backwards too.', args: [4, [[0, 1], [1, 3], [0, 2], [2, 3]], [0.9, 0.9, 0.5, 1], 3, 0], expected: 0.81 },
    { scenario: 'Multiply, not add', hint: 'Path probabilities multiply: 0.9³ = 0.729 beats the direct 0.7. Adding would cap at 1 and pick wrongly.', args: [4, [[0, 1], [1, 2], [2, 3], [0, 3]], [0.9, 0.9, 0.9, 0.7], 0, 3], expected: 0.7290000000000001 },
    { scenario: 'Max-heap, not min-heap', hint: 'A min-heap expands the LEAST probable node first and can settle the end too early with a poor value.', args: [4, [[0, 1], [1, 3], [0, 2], [2, 3]], [0.1, 0.1, 0.9, 0.9], 0, 3], expected: 0.81 },
    { scenario: 'Mixed small graph', hint: 'Several candidate paths with different products.', args: [5, [[1, 4], [2, 4], [0, 4], [0, 3], [0, 2], [2, 3]], [0.37, 0.17, 0.93, 0.23, 0.39, 0.04], 3, 4], expected: 0.2139 },
    { scenario: 'Longer path wins', hint: 'Many near-certain edges beat one weak shortcut.', args: [5, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]], [0.99, 0.99, 0.99, 0.99, 0.5], 0, 4], expected: 0.96059601 },
    { scenario: 'Large graph (n = 10^4)', hint: 'Relaxing every edge n times is O(V·E); Dijkstra with a max-heap is O(E log V).', argsGen: '() => { let x = 2222; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, E = [], P = []; for (let i = n - 1; i >= 1; i--) { E.push([i - 1, i]); P.push(0.9999 + (r() % 1000) / 10000000); } while (E.length < 20000) { const a = r() % n, b = r() % n; if (a !== b && Math.abs(a - b) > 1) { E.push([a, b]); P.push((r() % 300) / 1000); } } return [n, E, P, 0, n - 1]; }', expected: 0.6066406160407026, timeLimitMs: 500 },
  ],

  solution: {
    code: `function maxProbability(n, edges, succProb, start, end) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => {
    adj[a].push([b, succProb[i]]);
    adj[b].push([a, succProb[i]]);
  });

  const best = new Array(n).fill(0);
  best[start] = 1;
  const heap = new MaxHeap((e) => e[0]);   // [probability, node]
  heap.push([1, start]);

  while (!heap.isEmpty()) {
    const [p, u] = heap.pop();
    if (u === end) return p;               // most probable arrival is final
    if (p < best[u]) continue;             // stale
    for (const [v, q] of adj[u]) {
      const np = p * q;
      if (np > best[v]) {
        best[v] = np;
        heap.push([np, v]);
      }
    }
  }
  return 0;
}`,
    explanation: 'The toolkit `MaxHeap` pops the largest probability. Everything else mirrors Dijkstra with `<` flipped to `>` and `+` replaced by `*`.',
  },
  dryRun: {
    columns: ['pop', 'relax', 'best[0..2]'],
    rows: [
      ['[1, 0]', '1 → 0.5, 2 → 0.2', '[1, 0.5, 0.2]'],
      ['[0.5, 1]', '2 → 0.25 > 0.2 ✓', '[1, 0.5, 0.25]'],
      ['[0.25, 2]', 'end reached', 'answer 0.25'],
    ],
  },
  complexity: { time: 'O((n + E) log E)', space: 'O(n + E)', explanation: 'Same as Dijkstra: each improvement pushes one heap entry.' },
  alternative: {
    title: 'Bellman-Ford style relaxation',
    md: 'Repeatedly relax every edge in both directions until nothing improves (at most n − 1 rounds). Simple but O(n · E) in the worst case.',
    complexity: 'O(n · E) time, O(n) space',
  },
  mistakes: [
    'Using a min-heap (you want the MOST probable node first).',
    'Adding probabilities instead of multiplying.',
    'Forgetting the edges are undirected.',
    'Initialising best with Infinity instead of 0.',
  ],
};
