export default {
  id: 'search-in-a-binary-search-tree',
  title: 'Search in a Binary Search Tree',
  difficulty: 'Easy',
  order: 1,
  pattern: 'bst-guided-descent',
  tags: ['tree', 'binary search tree'],
  source: { platform: 'LeetCode', number: 700, url: 'https://leetcode.com/problems/search-in-a-binary-search-tree/' },

  statement: `You are given the \`root\` of a binary search tree and an integer \`val\`.

Find the node whose value equals \`val\` and return **the subtree rooted at that node**. If no node has that value, return \`null\`.`,
  examples: [
    { input: 'root = [4,2,7,1,3], val = 2', output: '[2,1,3]', explanation: 'The node 2 together with its children 1 and 3.' },
    { input: 'root = [4,2,7,1,3], val = 5', output: '[]', explanation: '5 is not in the tree, so the answer is null (shown as []).' },
  ],
  constraints: ['1 <= number of nodes <= 5000', '1 <= Node.val <= 10^7', 'root is a valid BST', '1 <= val <= 10^7'],

  think: `- At the root, if \`val\` is smaller than \`root.val\`, which subtree can you ignore completely? Why is that safe?
- Do you need recursion at all, or is a single pointer walking down enough?
- How many nodes do you visit in the worst case?`,
  patternChallenge: {
    options: ['Breadth-first search over every node', 'BST — Guided Descent', 'Sliding Window', 'BST — Bottom-up Subtree Info'],
    answer: 1,
    explanation: 'The tree is a BST and we look for one value: the ordering tells us which side to go at every node, so one root-to-leaf path is enough. BFS works but ignores the ordering (O(n)); the other options solve different problem shapes.',
  },
  hints: [
    'Compare `val` with the current node. Equal → done. Smaller → the answer can only be on the left.',
    'Loop: `while (node && node.val !== val) node = val < node.val ? node.left : node.right;` and return `node`.',
  ],
  approach: `**Brute force:** DFS/BFS every node until you find \`val\` — O(n), ignores the BST property.

**Optimized (guided descent):** start at the root. If \`val < node.val\`, every value in the right subtree is even larger, so the target can only be on the left — move left. Symmetrically move right. Stop when you find it or fall off the tree. One path: O(h).`,

  functionName: 'searchBST',
  paramNames: ['root', 'val'],
  starterCode: `/**
 * Definition for a binary tree node (available as the global TreeNode):
 * function TreeNode(val, left, right) { this.val = val; this.left = left; this.right = right; }
 *
 * @param {TreeNode} root
 * @param {number} val
 * @return {TreeNode}
 */
function searchBST(root, val) {
  
}
`,
  io: { params: ['tree', 'any'], returns: 'tree' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 2 is found on the left of the root; return its whole subtree, not just the value.', args: [[4, 2, 7, 1, 3], 2], expected: [2, 1, 3] },
    { scenario: 'Example 2', hint: 'The value is not in the tree — return null (an empty tree), not undefined or the last node visited.', args: [[4, 2, 7, 1, 3], 5], expected: [] },
    { scenario: 'Single node, found', hint: 'The root itself matches — return it before moving anywhere.', args: [[1], 1], expected: [1] },
    { scenario: 'Single node, not found', hint: 'The search falls off a one-node tree immediately; return null.', args: [[1], 2], expected: [] },
    { scenario: 'Target is the root', hint: 'When the root matches, the answer is the entire tree.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 8], expected: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] },
    { scenario: 'Target is a leaf', hint: 'A leaf match returns a one-node subtree.', args: [[4, 2, 7, 1, 3], 7], expected: [7] },
    { scenario: 'Target deep in the tree', hint: 'Go right then left: 13 lives in the left subtree of 14. Decide the direction at every node.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 13], expected: [13] },
    { scenario: 'Return subtree, not value', hint: 'The answer is the node (its subtree [6,4,7]); returning `node.val` gives a number instead of a tree.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 6], expected: [6, 4, 7] },
    { scenario: 'Smaller than every value', hint: 'The search walks the left spine and falls off — not found.', args: [[5, 3, 8], 1], expected: [] },
    { scenario: 'Larger than every value', hint: 'Maximum allowed value; the search walks the right spine and falls off.', args: [[5, 3, 8], 10000000], expected: [] },
    { scenario: 'Left-skewed chain (n = 5000)', hint: 'A chain of 5000 nodes: guided descent walks one path. Searching both subtrees or recursing carelessly gets expensive.', argsGen: '() => [(() => { const a = [5000]; for (let v = 4999; v >= 1; v--) a.push(v, null); return a; })(), 1]', expected: [1] },
    { scenario: 'Large balanced tree (n = 5000)', hint: 'Only one root-to-leaf path should be visited; checking both subtrees turns O(h) into O(n).', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(5000), 3333]', expected: [3333] },
  ],

  solution: {
    code: `function searchBST(root, val) {
  let node = root;
  while (node && node.val !== val) {
    // The ordering tells us which ONE side can still contain val.
    node = val < node.val ? node.left : node.right;
  }
  return node; // the matching subtree, or null
}`,
  },
  dryRun: {
    columns: ['node', 'compare', 'move'],
    rows: [['4', '2 < 4', 'go left'], ['2', '2 === 2', 'return subtree [2,1,3]']],
  },
  complexity: { time: 'O(h)', space: 'O(1)', explanation: 'One root-to-leaf path. h = O(log n) for a balanced tree, O(n) for a skewed one. The iterative loop uses no extra memory.' },
  alternative: {
    title: 'Recursive',
    md: 'Same logic with recursion; uses O(h) call-stack space.',
    code: `function searchBST(root, val) {
  if (!root || root.val === val) return root;
  return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);
}`,
    complexity: 'O(h) time, O(h) space',
  },
  mistakes: [
    'Searching both subtrees (turns O(h) into O(n)).',
    'Returning `node.val` instead of the node — the problem wants the subtree.',
    'Returning `undefined` instead of `null` when not found.',
  ],
};
