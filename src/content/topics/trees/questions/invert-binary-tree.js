export default {
  id: 'invert-binary-tree',
  title: 'Invert Binary Tree',
  difficulty: 'Easy',
  order: 2,
  pattern: 'tree-dfs-traversal',
  tags: ['tree', 'dfs', 'bfs', 'recursion'],
  source: { platform: 'LeetCode', number: 226, url: 'https://leetcode.com/problems/invert-binary-tree/' },

  statement: `Given the \`root\` of a binary tree, **mirror** it: for every node, swap its left and right children. Return the root of the inverted tree.`,
  examples: [
    { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' },
    { input: 'root = [2,1,3]', output: '[2,3,1]' },
    { input: 'root = []', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 100]', '-100 <= Node.val <= 100'],

  think: `- Is swapping the two children of the root enough? What else has to happen?
- Does it matter whether you swap before or after inverting the subtrees?
- What does the empty tree invert to?`,
  patternChallenge: {
    options: ['Two Pointers', 'Tree DFS — visit every node and swap its children', 'Tree Construction from Traversals', 'Binary Search'],
    answer: 1,
    explanation: 'Every node must be touched once and transformed locally (swap its two pointers). Any traversal order works — preorder, postorder, or BFS. No rebuilding from traversals is needed.',
  },
  hints: [
    'At each node: swap `node.left` and `node.right`.',
    'Then recurse into both children (or recurse first and swap afterwards — both orders work). Return the node.',
  ],
  approach: `Mirroring the whole tree = mirroring each subtree **and** swapping them. Recursively:
1. \`invert(null) = null\`.
2. Swap the node's children.
3. Invert both children.
Every node is visited once → O(n). BFS with a queue works equally well: pop a node, swap its children, enqueue them.`,

  functionName: 'invertTree',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
function invertTree(root) {
  
}
`,
  io: { params: ['tree'], returns: 'tree' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: every node\'s children are swapped, not just the root\'s.',
      args: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1] },
    { scenario: 'Example 2', hint: 'A root with two leaves — swap them.',
      args: [[2, 1, 3]], expected: [2, 3, 1] },
    { scenario: 'Example 3', hint: 'The empty tree inverts to the empty tree — return null without touching .left.',
      args: [[]], expected: [] },
    { scenario: 'Single node', hint: 'A leaf has nothing to swap; return the node itself.',
      args: [[1]], expected: [1] },
    { scenario: 'Only a left child', hint: 'The lone left child must move to the right side.',
      args: [[1, 2]], expected: [1, null, 2] },
    { scenario: 'Only a right child', hint: 'The lone right child must move to the left side.',
      args: [[1, null, 2]], expected: [1, 2] },
    { scenario: 'Left chain becomes right chain', hint: 'Every level must be swapped. If you only swap the root\'s children, the deeper nodes stay on the left.',
      args: [[1, 2, null, 3, null, 4]], expected: [1, null, 2, null, 3, null, 4] },
    { scenario: 'Only the root swapped', hint: 'Mistake check: swapping only the root\'s children leaves 3\'s and 8\'s subtrees un-mirrored.',
      args: [[5, 3, 8, null, 4, 7]], expected: [5, 8, 3, null, 7, 4] },
    { scenario: 'Swap without a temp', hint: 'If you write `root.left = root.right; root.right = root.left;` both children end up as the old right subtree. Use a temp or destructuring.',
      args: [[1, 2, 3, 4, 5]], expected: [1, 3, 2, null, null, 5, 4] },
    { scenario: 'Reusing overwritten left', hint: '`root.left = invertTree(root.right); root.right = invertTree(root.left);` inverts the same subtree twice. Save both results first.',
      args: [[10, 20, 30, 40, null, null, 50]], expected: [10, 30, 20, 50, null, null, 40] },
    { scenario: 'Negative and zero values', hint: 'Values may be negative or 0 — never test a node with `if (root.val)`, test it against null.',
      args: [[0, -100, 100, -1, null, null, 1]], expected: [0, 100, -100, 1, null, null, -1] },
    { scenario: 'Zigzag path', hint: 'Alternating left/right links must flip to alternating right/left at every level.',
      args: [[1, 2, null, null, 3, 4, null, null, 5]], expected: [1, null, 2, 3, null, null, 4, 5] },
    { scenario: 'Maximum size (100 nodes)', hint: 'A complete tree with 100 nodes — every one of them gets its children swapped.',
      argsGen: '() => [Array.from({ length: 100 }, (_, i) => (i % 21) - 10)]', expected: [-10, -8, -9, -4, -5, -6, -7, 4, 3, 2, 1, 0, -1, -2, -3, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, 10, 9, 8, 7, 6, 5, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10] },
  ],

  solution: {
    code: `function invertTree(root) {
  if (root === null) return null;
  // swap the children (preorder), then mirror each subtree
  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  return root;
}`,
  },
  dryRun: {
    columns: ['visit', 'before swap (left, right)', 'after swap'],
    rows: [
      ['4', '(2, 7)', '(7, 2)'],
      ['7', '(6, 9)', '(9, 6)'],
      ['9, 6', 'leaves', 'unchanged'],
      ['2', '(1, 3)', '(3, 1)'],
      ['3, 1', 'leaves', 'unchanged → [4,7,2,9,6,3,1]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node is swapped once; the recursion is as deep as the tree.' },
  alternative: {
    title: 'Iterative BFS',
    md: 'Queue the root; repeatedly take a node, swap its children, and queue the non-null ones. Avoids recursion depth issues.',
    code: `function invertTree(root) {
  const queue = root ? [root] : [];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    [node.left, node.right] = [node.right, node.left];
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return root;
}`,
    complexity: 'O(n) time, O(w) space',
  },
  mistakes: [
    'Swapping without a temp or destructuring: `root.left = root.right; root.right = root.left;` loses the original left.',
    'Only swapping the root\'s children, not every node\'s.',
    'Writing `root.left = invertTree(root.right); root.right = invertTree(root.left);` — the second line uses the already-overwritten left.',
  ],
};
