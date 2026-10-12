export default {
  id: 'vertical-order-traversal-of-a-binary-tree',
  title: 'Vertical Order Traversal of a Binary Tree',
  difficulty: 'Hard',
  order: 3,
  pattern: 'tree-serialization',
  tags: ['tree', 'dfs', 'bfs', 'sorting', 'hash map'],
  source: { platform: 'LeetCode', number: 987, url: 'https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/' },

  statement: `Give every node of a binary tree a position \`(row, col)\`: the root is at \`(0, 0)\`; the left child of a node at \`(row, col)\` is at \`(row + 1, col − 1)\` and its right child at \`(row + 1, col + 1)\`.

The **vertical order traversal** lists the columns from the leftmost to the rightmost. Inside a column, nodes are ordered **top to bottom** (by row); nodes that share both row and column are ordered by **value** (smallest first).

Return a list of columns, each column being the list of its node values in that order.`,
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '[[9],[3,15],[20],[7]]', explanation: 'Column −1: 9. Column 0: 3 (row 0), 15 (row 2). Column 1: 20. Column 2: 7.' },
    { input: 'root = [1,2,3,4,5,6,7]', output: '[[4],[2],[1,5,6],[3],[7]]', explanation: '5 and 6 are both at (2, 0), so they are ordered by value.' },
    { input: 'root = [1,2,3,4,6,5,7]', output: '[[4],[2],[1,5,6],[3],[7]]', explanation: 'Now 6 is the right child of 2 and 5 is the left child of 3. Both sit at (2, 0), so they are ordered by value: 5 before 6.' },
  ],
  constraints: ['The number of nodes is in the range [1, 1000]', '0 <= Node.val <= 1000'],

  think: `- What information do you need to store per node to be able to order everything at the end?
- Is a plain BFS order enough to break ties between nodes at the same (row, col)?
- Which three keys do you sort by, and in which priority?`,
  patternChallenge: {
    options: ['Tree BFS — Level Order only', 'Tree coordinates: traverse, collect (col, row, val), multi-key sort, group by column', 'Tree Recursion — Bottom-Up', 'Binary Search'],
    answer: 1,
    explanation: 'Attach explicit coordinates to each node (the same idea as encoding shape in serialization), then sort by (col, row, val). BFS alone gives rows in order but not the value tie-break for equal positions.',
  },
  hints: [
    'DFS (or BFS) carrying `(row, col)`; push `[col, row, val]` for every node into a list.',
    'Sort with `(a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]`, then walk the sorted list starting a new column whenever `col` changes.',
  ],
  approach: `1. **Assign coordinates** with any traversal: \`dfs(node, row, col)\` → children at \`(row + 1, col − 1)\` and \`(row + 1, col + 1)\`.
2. **Collect** \`[col, row, val]\` triples.
3. **Sort** by col, then row, then val. A numeric comparator is essential — the default sort compares strings.
4. **Group:** scan the sorted triples; start a new inner array whenever the column changes.

The sort dominates → O(n log n).

**Alternative:** a Map from column to list of \`[row, val]\`, tracking min/max column; sort each column's list separately. Same complexity, sometimes faster in practice.`,

  functionName: 'verticalTraversal',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function verticalTraversal(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'Column 0 holds 3 (row 0) and 15 (row 2); columns run from left to right.',
      args: [[3, 9, 20, null, null, 15, 7]], expected: [[9], [3, 15], [20], [7]] },
    { scenario: 'Example 2', hint: '5 and 6 share row 2, column 0 — they are ordered by value.',
      args: [[1, 2, 3, 4, 5, 6, 7]], expected: [[4], [2], [1, 5, 6], [3], [7]] },
    { scenario: 'Example 3', hint: '6 and 5 share a cell; BFS meets 6 first, but the value tie-break puts 5 first.',
      args: [[1, 2, 3, 4, 6, 5, 7]], expected: [[4], [2], [1, 5, 6], [3], [7]] },
    { scenario: 'Single node', hint: 'One column with one value.',
      args: [[1]], expected: [[1]] },
    { scenario: 'Left chain', hint: 'Every node gets its own column, all negative — columns must be sorted numerically.',
      args: [[1, 2, null, 3, null, 4]], expected: [[4], [3], [2], [1]] },
    { scenario: 'Right chain', hint: 'Columns 0, 1, 2, 3 — one node each.',
      args: [[1, null, 2, null, 3, null, 4]], expected: [[1], [2], [3], [4]] },
    { scenario: 'Duplicates in one cell', hint: 'Equal values in the same cell are both kept.',
      args: [[3, 1, 4, 0, 2, 2]], expected: [[0], [1], [3, 2, 2], [4]] },
    { scenario: 'String sort trap', hint: 'Mistake check: 10 and 9 share a cell. Sorting without a numeric comparator puts "10" before "9".',
      args: [[0, 1, 2, null, 10, 9]], expected: [[1], [0, 9, 10], [2]] },
    { scenario: 'Row order beats value', hint: 'Within a column, a higher row comes first even if its value is larger. Sorting by value alone gives [0, 1000].',
      args: [[1000, 1, 2, null, 0]], expected: [[1], [1000, 0], [2]] },
    { scenario: 'Many negative columns', hint: 'Columns −10 … −1 — a string sort of column keys would order −10 before −2.',
      argsGen: '() => { const a = [0]; for (let i = 1; i <= 10; i++) a.push(i, null); return [a]; }', expected: [[10], [9], [8], [7], [6], [5], [4], [3], [2], [1], [0]] },
    { scenario: 'Deep crossing subtrees', hint: 'Nodes from the left and right subtrees land in the same columns at various rows.',
      args: [[0, 2, 1, 3, null, null, null, 4, 5, null, 7, 6, null, 10, 8, 11, 9]], expected: [[4, 10, 11], [3, 6, 7], [2, 5, 8, 9], [0], [1]] },
    { scenario: 'Same cell, deep levels', hint: 'Several nodes share column 0 at different rows; order by row first, then value.',
      args: [[5, 1, 9, 8, 2, 7, 3, null, 4, 6, null, null, 0]], expected: [[8], [1, 4, 6], [5, 2, 7], [9, 0], [3]] },
    { scenario: 'Long zigzag (n = 1000)', hint: 'A 1000-node zigzag fills only columns −1 and 0, 500 nodes each. Values are scrambled, so ordering by value instead of by row (or BFS order without a full sort key) fails.',
      argsGen: '() => { const a = [0]; for (let d = 1; d < 1000; d++) { const v = (d * 7919) % 1001; if (d % 2 === 1) a.push(v, null); else a.push(null, v); } return [a]; }',
      expected: [Array.from({ length: 500 }, (_, k) => ((2 * k + 1) * 7919) % 1001), Array.from({ length: 500 }, (_, k) => (2 * k * 7919) % 1001)] },
  ],

  solution: {
    code: `function verticalTraversal(root) {
  const cells = [];                               // [col, row, val]
  const stack = [[root, 0, 0]];                   // iterative DFS: [node, row, col]
  while (stack.length) {
    const [node, row, col] = stack.pop();
    cells.push([col, row, node.val]);
    if (node.left) stack.push([node.left, row + 1, col - 1]);
    if (node.right) stack.push([node.right, row + 1, col + 1]);
  }

  // column first, then row (top to bottom), then value
  cells.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);

  const result = [];
  let lastCol = null;
  for (const [col, , val] of cells) {
    if (col !== lastCol) {                         // a new column starts
      result.push([]);
      lastCol = col;
    }
    result[result.length - 1].push(val);
  }
  return result;
}`,
    explanation: 'The traversal order does not matter because the sort fully determines the output order.',
  },
  dryRun: {
    columns: ['node', '(row, col)', 'triple [col,row,val]'],
    rows: [
      ['1', '(0, 0)', '[0,0,1]'],
      ['2', '(1, −1)', '[−1,1,2]'],
      ['3', '(1, 1)', '[1,1,3]'],
      ['4', '(2, −2)', '[−2,2,4]'],
      ['5', '(2, 0)', '[0,2,5]'],
      ['6', '(2, 0)', '[0,2,6]'],
      ['7', '(2, 2)', '[2,2,7] → sorted & grouped: [[4],[2],[1,5,6],[3],[7]]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Collecting coordinates is O(n); sorting n triples is O(n log n); grouping is O(n).' },
  alternative: {
    title: 'Map of columns',
    md: 'Store `Map<col, [row, val][]>` and track `minCol`/`maxCol`. For each column from min to max, sort its list by (row, val) and output the values. Sorting several small lists is never worse than one big sort.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Sorting without a comparator (string order: -1 < -10 < 2).',
    'Forgetting the value tie-break for nodes at the same row and column.',
    'Using BFS order as the in-column order without sorting equal positions by value.',
    'Sorting by row before column.',
  ],
};
