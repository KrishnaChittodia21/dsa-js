export default {
  id: 'classic-mst-is-unique',
  title: 'Is the Minimum Spanning Tree Unique?',
  difficulty: 'Medium',
  order: 4,
  pattern: 'mst-edge-classification',
  tags: ['graph', 'minimum spanning tree', 'union find', 'sorting'],
  source: { platform: 'Classic', note: 'Classic MST exercise (e.g. POJ 1679 "The Unique MST"): decide whether the MST is unique.' },

  statement: `You are given a **connected** undirected weighted graph with \`n\` nodes (\`0\` … \`n - 1\`) and \`edges[i] = [u, v, w]\`.

Return \`true\` if the graph has **exactly one** minimum spanning tree (as a set of edges), and \`false\` if two or more different spanning trees share the minimum total weight.

Parallel edges count as different edges: two edges \`[0,1,3]\` and \`[0,1,3]\` give two different trees.`,
  examples: [
    { input: 'n = 3, edges = [[0,1,1],[1,2,2],[0,2,3]]', output: 'true' },
    { input: 'n = 3, edges = [[0,1,1],[1,2,1],[0,2,1]]', output: 'false', explanation: 'Any two of the three edges form an MST of weight 2.' },
    { input: 'n = 4, edges = [[0,1,1],[1,2,2],[2,3,2],[0,3,2]]', output: 'false', explanation: 'Weight 5 is achieved by {0–1, 1–2, 2–3} and by {0–1, 0–3, 2–3} (and more).' },
  ],
  constraints: ['1 <= n <= 10^4', 'n - 1 <= edges.length <= 10^5', 'The graph is connected', '0 <= w <= 10^6'],

  think: `- If all weights are distinct, can there ever be two MSTs?
- Where exactly can a "choice" appear during Kruskal?
- Within a group of equal-weight edges, how can you tell that some edges were interchangeable?`,
  patternChallenge: {
    options: ['Count MSTs with dynamic programming', 'Run Prim from every node and compare', 'Kruskal processing equal-weight edges as a group', 'BFS and compare depths'],
    answer: 2,
    explanation: 'Choices only arise between edges of the same weight, so process each weight group together: count usable edges before merging, then count successful merges. Prim from every node gives the same total each time and says nothing about alternatives; the other options do not model spanning trees.',
  },
  hints: [
    'With distinct weights the MST is always unique. Ties are the only source of choice — and only ties among edges that were individually usable.',
    'For each group of equal weight: (1) count edges whose endpoints are in different components (before any union in this group); (2) union them all and count successes. If (1) > (2), there was a choice → not unique.',
  ],
  approach: `**Brute force:** compute the MST, then for each MST edge ban it and recompute; if some banned run gives the same total, another MST exists. O(n · m α(n)) — correct but slow.

**Group Kruskal (O(m log m)):**
1. Sort edges by weight. Walk through them in groups of equal weight.
2. **Before** unioning anything in the group, count \`candidates\` = edges in the group with \`find(u) !== find(v)\`. Every such edge could appear in some MST.
3. Now union each edge of the group, counting \`merged\` = successful unions. Any MST must take exactly \`merged\` edges from this group.
4. If \`candidates > merged\`, at least one candidate could be swapped for another → return false.
5. If every group passes, return true.

Why it works: after all lighter edges, the components are the same for EVERY MST (a standard fact — all MSTs have the same multiset of weights and the same component structure after each weight level). Inside the group, the MST must pick a spanning forest of the "component graph"; it is unique exactly when every usable edge is forced.`,

  functionName: 'isMstUnique',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges  [u, v, w]
 * @return {boolean}
 */
function isMstUnique(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Distinct weights always give a unique MST.', args: [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]]], expected: true },
    { scenario: 'Example 2', hint: 'Any two of the three equal edges form an MST.', args: [3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]]], expected: false },
    { scenario: 'Example 3', hint: 'Three weight-2 edges compete for two slots — several MSTs.', args: [4, [[0, 1, 1], [1, 2, 2], [2, 3, 2], [0, 3, 2]]], expected: false },
    { scenario: 'Single node', hint: 'The empty tree is the only spanning tree.', args: [1, []], expected: true },
    { scenario: 'Two parallel equal edges', hint: 'Parallel edges are different edges: [0,1,3] twice gives two different trees.', args: [2, [[0, 1, 3], [0, 1, 3]]], expected: false },
    { scenario: 'Parallel edges, different weights', hint: 'The lighter parallel edge is forced; the heavier one is never usable.', args: [2, [[0, 1, 3], [0, 1, 4]]], expected: true },
    { scenario: 'Tie that closes a cycle', hint: '0–2 closes a cycle with the lighter edges, so only 2–3 is usable at weight 5. Equal weights alone do not mean "not unique".', args: [4, [[0, 1, 1], [1, 2, 1], [0, 2, 5], [2, 3, 5]]], expected: true },
    { scenario: 'Count before union', hint: 'If you count candidates while unioning, the last weight-2 edge already looks like a cycle edge and the choice is missed. Count the whole group first.', args: [3, [[0, 1, 2], [1, 2, 2], [0, 2, 2]]], expected: false },
    { scenario: 'Equal weights both forced', hint: 'The two weight-2 edges are both in every MST — a tie in weights inside the tree is still unique.', args: [3, [[0, 1, 2], [1, 2, 2], [0, 2, 3]]], expected: true },
    { scenario: 'Choice only in a later group', hint: 'Lighter groups are forced; the ambiguity appears in the weight-2 group.', args: [4, [[0, 1, 2], [1, 2, 2], [2, 3, 2], [0, 2, 2]]], expected: false },
    { scenario: 'Mixed groups, unique', hint: 'Several weight groups, each fully forced.', args: [5, [[0, 1, 1], [1, 2, 1], [0, 2, 2], [2, 3, 2], [3, 4, 3], [2, 4, 4]]], expected: true },
    { scenario: 'Zero weights tie', hint: 'Weight 0 is allowed and ties work the same way.', args: [3, [[0, 1, 0], [1, 2, 0], [0, 2, 0]]], expected: false },
    { scenario: 'Large unique (m = 10^5)', hint: 'Banning each tree edge and rerunning Kruskal is O(n·m); one grouped Kruskal pass is O(m log m).', argsGen: '() => { let x = 31337; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, e = []; for (let i = 1; i < n; i++) e.push([r() % i, i, i]); while (e.length < 100000) { const u = r() % n, v = r() % n; e.push([u, v, 20000 + e.length]); }  return [n, e]; }', expected: true, timeLimitMs: 1000 },
    { scenario: 'Large with one duplicate', hint: 'A single duplicated tree edge makes the MST non-unique; the grouped check finds it in O(m log m).', argsGen: '() => { let x = 4242; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, e = []; for (let i = 1; i < n; i++) e.push([r() % i, i, r() % 1000]); while (e.length < 100000) { const u = r() % n, v = r() % n; e.push([u, v, 1000 + r() % 1000]); } e.push([e[5][0], e[5][1], e[5][2]]); return [n, e]; }', expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function isMstUnique(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const uf = new UnionFind(n);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j][2] === sorted[i][2]) j++; // group [i, j)

    // 1. how many edges of this weight are individually usable?
    let candidates = 0;
    for (let k = i; k < j; k++) {
      if (uf.find(sorted[k][0]) !== uf.find(sorted[k][1])) candidates++;
    }
    // 2. how many can actually be used together?
    let merged = 0;
    for (let k = i; k < j; k++) {
      if (uf.union(sorted[k][0], sorted[k][1])) merged++;
    }
    if (candidates > merged) return false;  // a choice existed
    i = j;
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['weight group', 'candidates (before)', 'merged', 'verdict'],
    rows: [
      ['w = 1: {0–1}', '1', '1', 'ok'],
      ['w = 2: {1–2, 2–3, 0–3}', '3', '2', '3 > 2 → false'],
    ],
    note: 'Example 3. Among the weight-2 edges, any two of the three complete the tree.',
  },
  complexity: { time: 'O(m log m)', space: 'O(n + m)', explanation: 'One sort, then two passes of near-O(1) Union Find operations per edge.' },
  alternative: {
    title: 'Ban each MST edge and recompute',
    md: 'Build one MST with Kruskal. For each of its n − 1 edges, rerun Kruskal with that edge banned; if any rerun is still connected with the same total, the MST is not unique. Simple and convincing, O(n · m α(n)) after sorting.',
    complexity: 'O(m log m + n · m) time',
  },
  mistakes: [
    'Counting candidates while unioning — the last interchangeable edge then looks like an ordinary cycle edge and the tie is missed.',
    'Comparing totals of Kruskal and Prim — both always find the same minimum total, so this says nothing about uniqueness.',
    'Treating any two equal weights as "not unique" — ties between edges that close cycles with lighter edges do not create choices.',
  ],
};
