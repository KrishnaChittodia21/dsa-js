export default {
  id: 'course-schedule-iv',
  title: 'Course Schedule IV',
  difficulty: 'Medium',
  order: 6,
  pattern: 'topo-dag-dp',
  tags: ['graph', 'topological sort', 'transitive closure'],
  source: { platform: 'LeetCode', number: 1462, url: 'https://leetcode.com/problems/course-schedule-iv/' },

  statement: `There are \`numCourses\` courses \`0..numCourses-1\`. **Careful with direction here:** \`prerequisites[i] = [a, b]\` means course \`a\` must be taken **before** course \`b\`. Prerequisites are transitive: if a is before b and b is before c, then a is a prerequisite of c.

The prerequisite graph has no cycles. For each query \`[u, v]\`, answer whether \`u\` is a (direct or indirect) prerequisite of \`v\`. Return an array of booleans.`,
  examples: [
    { input: 'numCourses = 2, prerequisites = [[1,0]], queries = [[0,1],[1,0]]', output: '[false,true]' },
    { input: 'numCourses = 3, prerequisites = [[1,2],[1,0],[2,0]], queries = [[1,0],[1,2]]', output: '[true,true]' },
  ],
  constraints: ['2 <= numCourses <= 100', '0 <= prerequisites.length <= n(n−1)/2', '1 <= queries.length <= 10^4', 'No cycles, no duplicate pairs'],

  think: `- 10^4 queries with a DFS each would be up to 10^4 · (V + E). Can you precompute every answer once?
- If you know all prerequisites of u, and u is a direct prerequisite of v, what do you know about v?`,
  patternChallenge: {
    options: ['BFS for every query', 'Binary search on course numbers', 'Union-Find', 'Topological order + propagating prerequisite sets (transitive closure)'],
    answer: 3,
    explanation: 'Many reachability queries on a small DAG → precompute the transitive closure. Walk in topological order and let pre[v] absorb pre[u] ∪ {u} for each edge u → v; then each query is O(1). Union-Find cannot answer directed reachability.',
  },
  hints: [
    'Edge a → b for each [a, b]. Kahn order ensures pre[a] is complete before b uses it.',
    'Use `pre = Array.from({ length: n }, () => new Set())` or an n×n boolean matrix; answer queries with `pre[v].has(u)`.',
  ],
  approach: `**Per-query DFS:** O(q · (V + E)) — 10^4 × ~5,000 = 5·10^7, borderline but OK here; wasteful in general.

**Transitive closure via topological order:** Kahn over edges \`a → b\`. When relaxing \`u → v\`, set \`reach[v] |= reach[u] ∪ {u}\`. After the pass, \`reach[v]\` is the full set of prerequisites of v. Each query is one lookup. With an n×n boolean matrix that is O(n · (n + m)) precomputation and O(1) per query.

**Floyd–Warshall style:** \`reach[i][j] ||= reach[i][k] && reach[k][j]\` for all k, i, j — O(n³) = 10^6 here, also fine.`,

  functionName: 'checkIfPrerequisite',
  paramNames: ['numCourses', 'prerequisites', 'queries'],
  starterCode: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @param {number[][]} queries
 * @return {boolean[]}
 */
function checkIfPrerequisite(numCourses, prerequisites, queries) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[1,0] means 1 is before 0 — not the other way round as in Course Schedule I/II.', args: [2, [[1, 0]], [[0, 1], [1, 0]]], expected: [false, true] },
    { scenario: 'Example 2', hint: '1 is before 0 directly and also via 2; 1 is before 2 directly.', args: [3, [[1, 2], [1, 0], [2, 0]], [[1, 0], [1, 2]]], expected: [true, true] },
    { scenario: 'No prerequisites', hint: 'With no edges every query is false.', args: [2, [], [[1, 0], [0, 1]]], expected: [false, false] },
    { scenario: 'Transitive chain', hint: '0 is before 3 only through 1 and 2 — recording just direct prerequisites answers false.', args: [4, [[0, 1], [1, 2], [2, 3]], [[0, 3], [3, 0], [1, 3], [0, 2], [2, 1]]], expected: [true, false, true, true, false] },
    { scenario: 'Separate components', hint: 'Courses in different components are never prerequisites of each other.', args: [5, [[0, 1], [0, 2], [3, 4]], [[0, 4], [3, 4], [1, 2], [0, 1]]], expected: [false, true, false, true] },
    { scenario: 'Complete DAG, reverse queries', hint: 'Every higher course is before every lower one; queries asked low → high must all be false.', args: [5, [[4, 3], [4, 1], [4, 0], [3, 2], [3, 1], [3, 0], [2, 1], [2, 0], [1, 0]], [[1, 4], [4, 2], [0, 1], [4, 0], [0, 2], [1, 3], [0, 1]]], expected: [false, true, false, true, false, false, false] },
    { scenario: 'Siblings unrelated', hint: 'Two courses sharing a prerequisite are not prerequisites of each other.', args: [3, [[0, 1], [0, 2]], [[1, 2], [2, 1], [0, 2]]], expected: [false, false, true] },
    { scenario: 'Diamond paths', hint: 'Two routes from 0 to 3; reachability is true either way, and 3 reaches nothing.', args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]], [[0, 3], [3, 0], [1, 2], [2, 3]]], expected: [true, false, false, true] },
    { scenario: 'Repeated query', hint: 'The same query twice must give the same answer twice.', args: [3, [[2, 1], [1, 0]], [[2, 0], [2, 0], [0, 2]]], expected: [true, true, false] },
    { scenario: 'Isolated course', hint: 'Course 2 has no edges at all.', args: [3, [[0, 1]], [[0, 2], [2, 1], [0, 1]]], expected: [false, false, true] },
    { scenario: 'Long reversed chain', hint: 'Course 9 is before 8, … before 0; the prerequisites are listed from the end of the chain, so propagate in topological order, not input order.', args: [10, [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6], [8, 7], [9, 8]], [[9, 0], [0, 9], [5, 1], [1, 5]]], expected: [true, false, true, false] },
    { scenario: 'Max graph, 10^4 queries', hint: 'A complete DAG on 100 courses (4950 edges) with 10^4 queries, most asked in the impossible direction: precompute reachability once instead of searching per query.', argsGen: '() => { const n = 100; let s = 9; const r = () => (s = (s * 48271) % 2147483647); const pre = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pre.push([j, i]); const qs = []; for (let t = 0; t < 10000; t++) { let u = r() % n, v = r() % n; if (u === v) v = (v + 1) % n; qs.push(t % 4 ? [98 - (t % 3), 99] : [u, v]); } return [n, pre, qs]; }', expectedGen: "() => { const [, , queries] = (() => { const n = 100; let s = 9; const r = () => (s = (s * 48271) % 2147483647); const pre = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pre.push([j, i]); const qs = []; for (let t = 0; t < 10000; t++) { let u = r() % n, v = r() % n; if (u === v) v = (v + 1) % n; qs.push(t % 4 ? [98 - (t % 3), 99] : [u, v]); } return [n, pre, qs]; })(); return queries.map(([u, v]) => u > v); }" },
  ],

  solution: {
    code: `function checkIfPrerequisite(numCourses, prerequisites, queries) {
  const n = numCourses;
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of prerequisites) { adj[a].push(b); indeg[b]++; }   // a before b

  // reach[v][u] = 1 if u is a (possibly indirect) prerequisite of v
  const reach = Array.from({ length: n }, () => new Uint8Array(n));
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];                       // reach[u] is final
    for (const v of adj[u]) {
      reach[v][u] = 1;
      for (let k = 0; k < n; k++) if (reach[u][k]) reach[v][k] = 1;
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return queries.map(([u, v]) => reach[v][u] === 1);
}`,
    explanation: 'Rows are Uint8Arrays, so the closure is n² bytes = 10 KB for n = 100.',
  },
  dryRun: { columns: ['pop', 'edge', 'reach[v] becomes'], rows: [['1', '1→2', 'reach[2] = {1}'], ['1', '1→0', 'reach[0] = {1}'], ['2', '2→0', 'reach[0] = {1, 2}'], ['queries', '[1,0] → reach[0] has 1 → true; [1,2] → reach[2] has 1 → true', '']] },
  complexity: { time: 'O(n · (n + m) + q)', space: 'O(n²)', explanation: 'Each edge merges a row of n flags; each query is O(1).' },
  alternative: {
    title: 'Floyd–Warshall closure',
    md: 'Initialise reach[a][b] = true for each pair, then for k, i, j: reach[i][j] ||= reach[i][k] && reach[k][j]. Simple and fine for n = 100.',
    complexity: 'O(n³ + q) time, O(n²) space',
  },
  mistakes: [
    'Using the Course Schedule I/II direction — here [a, b] means a BEFORE b.',
    'Answering with a DFS per query when q is large.',
    'Only recording direct prerequisites (the question is transitive).',
  ],
};
