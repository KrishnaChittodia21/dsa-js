export default {
  id: 'binary-tree-level-order-traversal',
  title: 'Binary Tree Level Order Traversal',
  difficulty: 'Medium',
  order: 1,
  pattern: 'tree-level-order',
  tags: ['tree', 'bfs', 'queue'],
  source: { platform: 'LeetCode', number: 102, url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },

  statement: `Given the \`root\` of a binary tree, return the values of its nodes **level by level**: an array of levels, each level listing its values from left to right.`,
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
    { input: 'root = [1]', output: '[[1]]' },
    { input: 'root = []', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 2000]', '-1000 <= Node.val <= 1000'],

  think: `- Which data structure hands out nodes in the order "all of depth 0, then all of depth 1, …"?
- While processing a level you add the next level's nodes to the same queue. How do you know where the current level ends?
- What is the JavaScript cost of \`array.shift()\`?`,
  patternChallenge: {
    options: ['Tree DFS — Inorder', 'Tree BFS — Level Order with a queue', 'Tree Recursion — Bottom-Up', 'Stack'],
    answer: 1,
    explanation: '"Level by level, left to right" is the definition of BFS. A queue releases nodes in order of depth; snapshotting its size separates the levels. (A DFS that passes the depth and appends to `levels[depth]` also works.)',
  },
  hints: [
    'Start with a queue containing the root. For each level, read `size = number of nodes currently queued` before looping.',
    'Pop exactly `size` nodes, collect their values, and push their non-null children. Use a head index instead of `shift()`.',
  ],
  approach: `**BFS:**
1. \`queue = [root]\`, \`head = 0\`.
2. While there are unprocessed nodes: \`size = queue.length − head\`; process exactly \`size\` nodes — record \`val\`, push children.
3. Push the collected level into the result.

Each node is enqueued and dequeued once → O(n). A head index keeps dequeue O(1) (\`shift()\` would re-index the array every time).

**DFS alternative:** \`dfs(node, depth)\` appends \`node.val\` to \`levels[depth]\` (creating it when needed). Preorder with left before right keeps each level in left-to-right order.`,

  functionName: 'levelOrder',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function levelOrder(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: one inner array per depth.', args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
    { scenario: 'Example 2', hint: 'A single node gives a single level.', args: [[1]], expected: [[1]] },
    { scenario: 'Example 3', hint: 'An empty tree has no levels — return [], not [[]].', args: [[]], expected: [] },
    { scenario: 'Two nodes', hint: 'The second level holds just the left child.', args: [[1, 2]], expected: [[1], [2]] },
    { scenario: 'Perfect tree', hint: 'Each level doubles in size; read every level left to right.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: [[1], [2, 3], [4, 5, 6, 7]] },
    { scenario: 'Left chain', hint: 'Every level has exactly one node. Do not push null children into the queue.', args: [[1, 2, null, 3, null, 4]], expected: [[1], [2], [3], [4]] },
    { scenario: 'Right chain', hint: 'Only right children exist — skip the missing left ones without reading .val of null.', args: [[1, null, 2, null, 3]], expected: [[1], [2], [3]] },
    { scenario: 'Gaps inside a level', hint: 'Level 3 is made of a right child and a right grandchild of different parents — they still share one level.', args: [[1, 2, 3, null, 4, null, 5]], expected: [[1], [2, 3], [4, 5]] },
    { scenario: 'Uneven level sizes', hint: 'If you loop to queue.length while pushing children, nodes from the next level leak into the current one. Snapshot the level size first.', args: [[1, 2, 3, 4, 5, null, null, 6, 7, null, 8]], expected: [[1], [2, 3], [4, 5], [6, 7, 8]] },
    { scenario: 'Negative and zero values', hint: 'Values can be negative or zero — do not use a falsy check on node values.', args: [[0, -1, 1, null, null, -2, 2]], expected: [[0], [-1, 1], [-2, 2]] },
    { scenario: 'All duplicates', hint: 'Equal values are still separate nodes on their own levels.', args: [[5, 5, 5, 5, null, 5]], expected: [[5], [5, 5], [5, 5]] },
    { scenario: 'Extreme values', hint: 'Values at the constraint limits ±1000.', args: [[1000, -1000, 1000, null, -1000]], expected: [[1000], [-1000, 1000], [-1000]] },
    { scenario: 'Perfect tree (63 nodes)', hint: 'Six full levels: 1, 2, 4, 8, 16 and 32 nodes.', argsGen: '() => [Array.from({ length: 63 }, (_, i) => i + 1)]', expected: [[1], [2, 3], [4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15], [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]] },
    { scenario: 'Large complete tree (n = 2000)', hint: 'Eleven levels with 2000 nodes in total. Dequeue with a moving head index — repeated shift() re-copies the queue every time.', argsGen: '() => [Array.from({ length: 2000 }, (_, i) => i + 1)]', expected: Array.from({ length: 11 }, (_, k) => Array.from({ length: Math.min(2 ** (k + 1) - 1, 2000) - 2 ** k + 1 }, (_, j) => 2 ** k + j)) },
  ],

  solution: {
    code: `function levelOrder(root) {
  const result = [];
  if (root === null) return result;
  const queue = [root];
  let head = 0;                                  // index of the next node to dequeue

  while (head < queue.length) {
    const size = queue.length - head;            // snapshot: nodes on this level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['level', 'size', 'dequeued', 'enqueued', 'result'],
    rows: [
      ['0', '1', '3', '9, 20', '[[3]]'],
      ['1', '2', '9, 20', '15, 7', '[[3],[9,20]]'],
      ['2', '2', '15, 7', '—', '[[3],[9,20],[15,7]]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every node passes through the queue once. With a head index the array keeps all n nodes (O(n)); the widest level alone can already hold about n/2 nodes.' },
  alternative: {
    title: 'DFS with a depth parameter',
    md: 'Preorder DFS: `if (levels.length === depth) levels.push([]); levels[depth].push(node.val);` then recurse left and right with depth + 1.',
    code: `function levelOrder(root) {
  const levels = [];
  (function dfs(node, depth) {
    if (!node) return;
    if (levels.length === depth) levels.push([]);
    levels[depth].push(node.val);
    dfs(node.left, depth + 1);
    dfs(node.right, depth + 1);
  })(root, 0);
  return levels;
}`,
    complexity: 'O(n) time, O(h) extra space (plus output)',
  },
  mistakes: [
    'Using `queue.length` directly as the loop bound while pushing children.',
    '`shift()` in a loop — O(n²) for large trees.',
    'Pushing `null` children into the queue and then reading `.val` of null.',
    'Returning `[[]]` for an empty tree instead of `[]`.',
  ],
};
