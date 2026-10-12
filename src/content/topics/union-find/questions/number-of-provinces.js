export default {
  id: 'number-of-provinces',
  title: 'Number of Provinces',
  difficulty: 'Medium',
  order: 1,
  pattern: 'union-find-connectivity',
  tags: ['graph', 'union find', 'dfs'],
  source: { platform: 'LeetCode', number: 547, url: 'https://leetcode.com/problems/number-of-provinces/' },

  statement: `There are \`n\` cities. You are given an \`n × n\` matrix \`isConnected\` where \`isConnected[i][j] = 1\` means city \`i\` and city \`j\` are directly linked, and \`0\` means they are not.

Links are symmetric (\`isConnected[i][j] === isConnected[j][i]\`) and every city is linked to itself.

A **province** is a group of cities that are connected directly or through other cities, with no links to cities outside the group. Return the number of provinces.`,
  examples: [
    { input: 'isConnected = [[1,1,0],[1,1,0],[0,0,1]]', output: '2', explanation: 'Cities 0 and 1 form one province, city 2 is alone.' },
    { input: 'isConnected = [[1,0,0],[0,1,0],[0,0,1]]', output: '3' },
  ],
  constraints: ['1 <= n <= 200', 'isConnected[i][j] is 0 or 1', 'isConnected[i][i] === 1', 'isConnected[i][j] === isConnected[j][i]'],

  think: `- A province is a connected component. How does each "1" in the matrix change the number of groups?
- Do you need to look at both \`[i][j]\` and \`[j][i]\`?
- What does the group count start at, and when does it go down?`,
  patternChallenge: {
    options: ['Sliding Window', 'Binary Search', 'Union Find (Dynamic Connectivity)', 'Topological Sort'],
    answer: 2,
    explanation: '"Groups connected directly or indirectly" is exactly connected components. Union every linked pair and count the groups. (DFS also works.) Topological sort is for directed dependencies; windows and binary search do not model connectivity.',
  },
  hints: [
    'Start with n groups, one per city. Every time you merge two different groups, there is one fewer.',
    'Scan only the upper triangle (j > i) because the matrix is symmetric; call union(i, j) whenever the entry is 1, and return the final count.',
  ],
  approach: `**DFS approach:** for every unvisited city start a DFS that marks its whole province; count the starts. O(n²) because the matrix has n² cells.

**Union Find:** create \`new UnionFind(n)\` (count = n). For every pair i < j with \`isConnected[i][j] === 1\`, call \`union(i, j)\`; each successful union decrements \`count\`. Return \`count\`. Also O(n² · α(n)).

Both are optimal here since just reading the matrix costs O(n²). The DSU version is shorter and does not need a visited array or recursion.`,

  functionName: 'findCircleNum',
  paramNames: ['isConnected'],
  starterCode: `/**
 * @param {number[][]} isConnected
 * @return {number}
 */
function findCircleNum(isConnected) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Cities 0 and 1 form one province; city 2 is alone.', args: [[[1, 1, 0], [1, 1, 0], [0, 0, 1]]], expected: 2 },
    { scenario: 'Example 2', hint: 'No links between different cities: every city is its own province.', args: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]], expected: 3 },
    { scenario: 'Single city', hint: 'The smallest input is one province.', args: [[[1]]], expected: 1 },
    { scenario: 'Everyone linked', hint: 'Counting 1s would give 9; there is exactly one group.', args: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]], expected: 1 },
    { scenario: 'Indirect connection', hint: '0–3, 3–2, 2–1: everything joins through a chain. Compare roots via find, not parent[i] === parent[j].', args: [[[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1]]], expected: 1 },
    { scenario: 'One pair, three loners', hint: 'Only cities 1 and 4 are linked: 4 provinces.', args: [[[1, 0, 0, 0, 0], [0, 1, 0, 0, 1], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 1, 0, 0, 1]]], expected: 4 },
    { scenario: 'Two blocks', hint: 'Two disjoint fully linked pairs.', args: [[[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]]], expected: 2 },
    { scenario: 'Two cities, linked', hint: 'Off-diagonal 1s link the only two cities: 1 province.', args: [[[1, 1], [1, 1]]], expected: 1 },
    { scenario: 'Not an edge list', hint: 'This is an adjacency matrix: row 0 = [1,0,1] means city 0 links to city 2, not "edge from 1 to 0".', args: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 2 },
    { scenario: 'Max size, all isolated', hint: '200 cities with only self-links: 200 provinces.', argsGen: '() => { const n = 200; const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))); const link = (a, b) => { M[a][b] = 1; M[b][a] = 1; };  return [M]; }', expected: 200 },
    { scenario: 'Max size, reversed chain', hint: 'City i links to i + 1, listed so unions build deep trees; finds must follow parents to the root.', argsGen: '() => { const n = 200; const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))); const link = (a, b) => { M[a][b] = 1; M[b][a] = 1; }; for (let i = 199; i > 0; i--) link(i, i - 1); return [M]; }', expected: 1 },
    { scenario: 'Max size, residue groups', hint: 'City i links to i + 7: seven provinces by residue mod 7.', argsGen: '() => { const n = 200; const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))); const link = (a, b) => { M[a][b] = 1; M[b][a] = 1; }; for (let i = 0; i + 7 < n; i++) link(i, i + 7); return [M]; }', expected: 7 },
  ],

  solution: {
    code: `function findCircleNum(isConnected) {
  const n = isConnected.length;
  const uf = new UnionFind(n);            // toolkit DSU, count starts at n
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {     // symmetric: upper triangle is enough
      if (isConnected[i][j] === 1) uf.union(i, j);
    }
  }
  return uf.count;
}`,
    explanation: 'Every successful union merges two provinces into one, so `count` ends at the number of provinces.',
  },
  dryRun: {
    columns: ['pair (i,j)', 'linked?', 'union result', 'count'],
    rows: [
      ['start', '', '', '3'],
      ['(0,1)', 'yes', 'merged', '2'],
      ['(0,2)', 'no', '—', '2'],
      ['(1,2)', 'no', '—', '2'],
    ],
  },
  complexity: { time: 'O(n² · α(n))', space: 'O(n)', explanation: 'We read every cell of the upper triangle once; each union is near O(1). The DSU arrays use O(n).' },
  alternative: {
    title: 'DFS over the matrix',
    md: 'Keep a visited array; for each unvisited city, DFS through row `i` marking linked cities. Count how many DFS calls start from the outer loop.',
    code: `function findCircleNum(M) {
  const n = M.length, seen = new Array(n).fill(false);
  let provinces = 0;
  const dfs = (i) => { seen[i] = true; for (let j = 0; j < n; j++) if (M[i][j] && !seen[j]) dfs(j); };
  for (let i = 0; i < n; i++) if (!seen[i]) { provinces++; dfs(i); }
  return provinces;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Counting the 1s in the matrix instead of groups.',
    'Treating the input as an edge list — it is an adjacency matrix.',
    'Comparing parent[i] with parent[j] instead of using find.',
  ],
};
