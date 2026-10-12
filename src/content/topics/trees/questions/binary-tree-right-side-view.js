export default {
  id: 'binary-tree-right-side-view',
  title: 'Binary Tree Right Side View',
  difficulty: 'Medium',
  order: 2,
  pattern: 'tree-level-order',
  tags: ['tree', 'bfs', 'dfs'],
  source: { platform: 'LeetCode', number: 199, url: 'https://leetcode.com/problems/binary-tree-right-side-view/' },

  statement: `Imagine standing to the **right** of a binary tree. Return the values of the nodes you can see, from top to bottom — that is, the **rightmost node of every level**.`,
  examples: [
    { input: 'root = [1,2,3,null,5,null,4]', output: '[1,3,4]' },
    { input: 'root = [1,2,3,4,null,null,null,5]', output: '[1,3,4,5]', explanation: 'On levels 2 and 3 the only nodes are on the left side, and they are visible.' },
    { input: 'root = []', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 100]', '-100 <= Node.val <= 100'],

  think: `- Is the answer simply "keep following right children"? Try the second example.
- If you had each level as a list, which element would you take?
- Could a DFS find the same nodes if it visited right children first?`,
  patternChallenge: {
    options: ['Follow `.right` pointers from the root', 'Tree BFS — Level Order, take the last node of each level', 'Tree DFS — Inorder', 'Tree Construction'],
    answer: 1,
    explanation: 'The visible node of each level is the last one in left-to-right order — a per-level question → BFS. Following `.right` fails when a level\'s rightmost node lives in the left subtree.',
  },
  hints: [
    'Do a normal level-order traversal with a size snapshot.',
    'When `i === size − 1` (the last node of the level), push its value into the answer.',
  ],
  approach: `**BFS:** traverse level by level; the last node processed in each level is the one seen from the right. O(n).

**DFS alternative:** visit right before left, passing the depth. The **first** node you reach at a new depth (\`depth === result.length\`) is the rightmost of that level.`,

  functionName: 'rightSideView',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number[]}
 */
function rightSideView(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the rightmost node of each level.', args: [[1, 2, 3, null, 5, null, 4]], expected: [1, 3, 4] },
    { scenario: 'Example 2', hint: 'Levels 3 and 4 only have nodes on the left side, and they are still visible from the right.', args: [[1, 2, 3, 4, null, null, null, 5]], expected: [1, 3, 4, 5] },
    { scenario: 'Example 3', hint: 'An empty tree shows nothing — return [].', args: [[]], expected: [] },
    { scenario: 'Single node', hint: 'Just the root.', args: [[7]], expected: [7] },
    { scenario: 'Root with right child', hint: 'Two levels, each with one visible node.', args: [[1, null, 3]], expected: [1, 3] },
    { scenario: 'Root with left child', hint: 'With no right child, the left child is the visible one on level 2.', args: [[1, 2]], expected: [1, 2] },
    { scenario: 'Left chain', hint: 'If you only follow .right pointers you stop at the root. Every node in a left chain is visible.', args: [[1, 2, null, 3, null, 4]], expected: [1, 2, 3, 4] },
    { scenario: 'Both children present', hint: 'Take the last node of each level, not the first — the first gives the left side view.', args: [[1, 2, 3]], expected: [1, 3] },
    { scenario: 'Left side deeper', hint: 'The deepest level exists only on the left. In a DFS, visit right before left (or overwrite per depth) so the right node wins on shallower levels.', args: [[1, 2, 3, 4, 5, 6, 7, 8]], expected: [1, 3, 7, 8] },
    { scenario: 'Right subtree shorter', hint: 'Level 4 is reached only through the left subtree\'s right child.', args: [[1, 2, 3, 4, 5, null, 6, null, null, 7]], expected: [1, 3, 6, 7] },
    { scenario: 'Zigzag path', hint: 'The single path turns left, right, left — each node is the only one on its level.', args: [[1, 2, null, null, 3, 4]], expected: [1, 2, 3, 4] },
    { scenario: 'Negative values', hint: 'Values can be negative; do not use a falsy check on values.', args: [[-1, -2, 0, null, -4]], expected: [-1, 0, -4] },
    { scenario: 'Complete tree (n = 100)', hint: 'Seven levels; the last one is only partially filled from the left.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => (i % 201) - 100)]', expected: [-100, -98, -94, -86, -70, -38, -1] },
    { scenario: 'Long left spine (n = 100)', hint: 'The root has a 40-node right chain and a 59-node left chain. Below depth 40 the left chain becomes visible.', argsGen: '() => { const root = new TreeNode(0); let l = root, r = root; for (let i = 1; i <= 59; i++) { l.left = new TreeNode(-(i % 100)); l = l.left; } for (let i = 1; i <= 40; i++) { r.right = new TreeNode(i); r = r.right; } return [treeToArray(root)]; }', expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, -41, -42, -43, -44, -45, -46, -47, -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59] },
  ],

  solution: {
    code: `function rightSideView(root) {
  const view = [];
  if (root === null) return view;
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const size = queue.length - head;
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      if (i === size - 1) view.push(node.val);   // last node of this level
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return view;
}`,
  },
  dryRun: {
    columns: ['level', 'nodes (left → right)', 'last', 'view'],
    rows: [
      ['0', '1', '1', '[1]'],
      ['1', '2, 3', '3', '[1,3]'],
      ['2', '4', '4', '[1,3,4]'],
      ['3', '5', '5', '[1,3,4,5]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(w)', explanation: 'Every node is dequeued once; the queue holds at most one or two levels at a time (w = maximum width).' },
  alternative: {
    title: 'DFS, right child first',
    md: 'The first node reached at each depth when exploring right-first is the visible one.',
    code: `function rightSideView(root) {
  const view = [];
  (function dfs(node, depth) {
    if (!node) return;
    if (depth === view.length) view.push(node.val);
    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  })(root, 0);
  return view;
}`,
    complexity: 'O(n) time, O(h) space',
  },
  mistakes: [
    'Only walking `.right` pointers.',
    'Taking the first node of each level (that is the left side view).',
    'In the DFS version, visiting left before right.',
  ],
};
