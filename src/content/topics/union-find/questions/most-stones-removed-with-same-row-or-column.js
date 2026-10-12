export default {
  id: 'most-stones-removed-with-same-row-or-column',
  title: 'Most Stones Removed with Same Row or Column',
  difficulty: 'Medium',
  order: 7,
  pattern: 'union-find-key-mapping',
  tags: ['union find', 'graph', 'hash map'],
  source: { platform: 'LeetCode', number: 947, url: 'https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/' },

  statement: `Stones sit on distinct integer grid points \`stones[i] = [row, col]\`. You may remove a stone if **another stone that is still on the board** shares its row or its column.

Return the maximum number of stones you can remove.`,
  examples: [
    { input: 'stones = [[0,0],[0,1],[1,0],[1,2],[2,1],[2,2]]', output: '5' },
    { input: 'stones = [[0,0],[0,2],[1,1],[2,0],[2,2]]', output: '3' },
    { input: 'stones = [[0,0]]', output: '0' },
  ],
  constraints: ['1 <= stones.length <= 1000', '0 <= row, col <= 10^4', 'No two stones share a position'],

  think: `- Link two stones if they share a row or column. Inside one linked group, how many stones can you remove? (Think of removing leaves of a spanning tree.)
- So the answer is (number of stones) − (number of groups). How do you build the groups without comparing every pair?`,
  patternChallenge: {
    options: ['Greedy by sorting stones', 'BFS shortest path', 'Union Find (Mapping Keys to Ids)', 'Sliding Window'],
    answer: 2,
    explanation: 'Stones connect through shared rows/columns — a connectivity problem whose "nodes" are rows and columns, encoded with an offset. Greedy removal order is hard to get right; the component count gives the answer directly.',
  },
  hints: [
    'In a connected group of k stones you can always remove k − 1 (remove stones in reverse BFS order, leaves first). Answer = stones − groups.',
    'Make rows and columns the DSU nodes: union(row, col + 10001) for every stone. Count distinct roots among the row nodes of the stones.',
  ],
  approach: `**Brute force:** compare every pair of stones (O(n²)) and union those sharing a row or column, then answer = n − components. Fine for n = 1000, but the offset trick is cleaner and linear.

**Why n − components?** Take any spanning tree of a group; repeatedly remove a leaf — it still shares a line with its tree neighbour. Only the last stone stays. You can never remove all stones of a group because the last one has no partner.

**Offset trick:** each stone is an edge between node \`row\` and node \`col + 10001\`. Union them. Stones in the same row share the row node, stones in the same column share the column node, so they end in one group. Count the distinct roots of the stones: \`new Set(stones.map(([r]) => uf.find(r))).size\`.`,

  functionName: 'removeStones',
  paramNames: ['stones'],
  starterCode: `/**
 * @param {number[][]} stones
 * @return {number}
 */
function removeStones(stones) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'All six stones form one linked group, so all but one can be removed.', args: [[[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]]], expected: 5 },
    { scenario: 'Example 2', hint: 'Two groups: the four corners and the lone centre stone. Answer = stones − groups.', args: [[[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]]], expected: 3 },
    { scenario: 'Example 3', hint: 'A single stone can never be removed.', args: [[[0, 0]]], expected: 0 },
    { scenario: 'Diagonal pair', hint: 'Neither row nor column is shared, so nothing can be removed.', args: [[[0, 1], [1, 0]]], expected: 0 },
    { scenario: 'Row value equals column value', hint: 'Row 3 and column 3 are different lines. Without an offset for columns, [3,7] and [5,3] wrongly merge.', args: [[[3, 7], [5, 3]]], expected: 0 },
    { scenario: 'Max coordinates', hint: 'Coordinates up to 10^4: the column offset must exceed the largest row (e.g. 10001).', args: [[[0, 0], [0, 10000], [10000, 10000]]], expected: 2 },
    { scenario: 'Separate row and column groups', hint: 'Row 1 links three stones and column 4 links two others; the groups share nothing, so 5 − 2 = 3.', args: [[[1, 1], [1, 2], [1, 3], [2, 4], [3, 4]]], expected: 3 },
    { scenario: 'Removal order matters', hint: 'Greedily removing the first removable stone ([0,1]) splits the group and leaves 2 stuck stones. Count groups instead of simulating.', args: [[[0, 1], [0, 0], [1, 1]]], expected: 2 },
    { scenario: 'All in one column', hint: 'Every stone shares column 5; all but one can be removed.', args: [[[0, 5], [3, 5], [7, 5], [9, 5]]], expected: 3 },
    { scenario: 'All isolated', hint: 'Distinct rows and columns everywhere: answer 0. A DSU sized for all rows and columns has many unused nodes — do not use its total count.', args: [[[0, 0], [1, 1], [2, 2], [3, 3]]], expected: 0 },
    { scenario: 'Large staircase (n = 1000)', hint: 'A staircase where each stone shares a row or a column with the next: one long group of 1000.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => [Math.floor((i + 1) / 2), Math.floor(i / 2)])]', expected: 999 },
    { scenario: 'Large random board (n = 1000)', hint: '1000 random stones on a 600×600 board: many groups of different sizes.', argsGen: '() => { let s = 13; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const m = new Map(); while (m.size < 1000) { const a = r() % 600, b = r() % 600; m.set(a * 1e5 + b, [a, b]); } return [[...m.values()]]; }', expected: 999 },
  ],

  solution: {
    code: `function removeStones(stones) {
  const OFFSET = 10001;                     // columns live in ids 10001..20001
  const uf = new UnionFind(2 * OFFSET);
  for (const [r, c] of stones) uf.union(r, c + OFFSET);

  const groups = new Set();
  for (const [r] of stones) groups.add(uf.find(r)); // only ids that hold stones
  return stones.length - groups.size;
}`,
    explanation: 'Do not use `uf.count` here: most of the 20 002 ids are unused rows/columns that would count as fake groups.',
  },
  dryRun: {
    columns: ['stone', 'union', 'group of rows/cols'],
    rows: [
      ['[0,0]', 'r0 – c0', '{r0,c0}'],
      ['[0,2]', 'r0 – c2', '{r0,c0,c2}'],
      ['[1,1]', 'r1 – c1', '{r1,c1}'],
      ['[2,0]', 'r2 – c0', '{r0,r2,c0,c2}'],
      ['[2,2]', 'r2 – c2 (already)', 'groups: 2 → 5 − 2 = 3'],
    ],
  },
  complexity: { time: 'O(n · α(R + C))', space: 'O(R + C)', explanation: 'One union per stone; the DSU spans the row and column id ranges (≈ 20 002 slots). A Map-based DSU would use O(n).' },
  alternative: {
    title: 'Pairwise unions (O(n²))',
    md: 'For every pair i < j, union(i, j) if they share a row or a column; answer = n − uf.count. Simple and fine for n ≤ 1000.',
    code: `function removeStones(stones) {
  const n = stones.length, uf = new UnionFind(n);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (stones[i][0] === stones[j][0] || stones[i][1] === stones[j][1]) uf.union(i, j);
  return n - uf.count;
}`,
    complexity: 'O(n² · α(n)) time, O(n) space',
  },
  mistakes: ['No offset: row 3 and column 3 collide.', 'Returning uf.count-based answers with a DSU sized for all rows/columns.', 'Trying to simulate greedy removals.'],
};
