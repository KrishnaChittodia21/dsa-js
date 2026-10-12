export default {
  id: 'lowest-common-ancestor-of-a-binary-search-tree',
  title: 'Lowest Common Ancestor of a Binary Search Tree',
  difficulty: 'Medium',
  order: 2,
  pattern: 'bst-guided-descent',
  tags: ['tree', 'binary search tree', 'lca'],
  source: { platform: 'LeetCode', number: 235, url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },

  statement: `Given a binary search tree and two of its nodes \`p\` and \`q\`, return their **lowest common ancestor (LCA)**: the deepest node that has both \`p\` and \`q\` in its subtree. A node counts as a descendant of itself.

*In the tests, \`p\` and \`q\` are given by value; the harness passes you the actual node objects.*`,
  examples: [
    { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6', explanation: '2 is on the left of 6 and 8 on the right: they split at 6.' },
    { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4', output: '2', explanation: '4 is inside 2\'s subtree, and 2 is its own descendant.' },
  ],
  constraints: ['2 <= number of nodes <= 10^5', 'All values are unique', 'p !== q, and both exist in the tree'],

  think: `- If both \`p\` and \`q\` are smaller than the current node, where must their LCA be?
- What happens at the first node where they are **not** on the same side?
- You learned a general LCA for any binary tree in the Trees topic — what does the BST ordering let you skip?`,
  patternChallenge: {
    options: ['BST — Guided Descent', 'General binary-tree LCA (search both subtrees)', 'Union-Find', 'BST — In-order Traversal = Sorted Order'],
    answer: 0,
    explanation: 'The ordering tells you, at every node, whether both targets are on the left, both on the right, or split. That is guided descent: one path, O(h). The general LCA works but visits O(n) nodes; in-order and union-find do not fit.',
  },
  hints: [
    'Compare both p.val and q.val with node.val.',
    'Both smaller → go left. Both larger → go right. Otherwise (split, or one equals node) → the current node is the LCA.',
  ],
  approach: `**General approach (from Trees):** recursive DFS that returns a node if p or q is found in a subtree — O(n), ignores ordering.

**Optimized:** start at the root.
- If \`p.val < node.val\` and \`q.val < node.val\`, both are in the left subtree, and so is their LCA → go left.
- If both are larger → go right.
- Otherwise they are on different sides (or one of them is \`node\`) — any lower node would contain at most one of them, so \`node\` is the lowest common ancestor.`,

  functionName: 'lowestCommonAncestor',
  paramNames: ['root', 'p', 'q'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {TreeNode} p
 * @param {TreeNode} q
 * @return {TreeNode}
 */
function lowestCommonAncestor(root, p, q) {
  
}
`,
  harness: `(target, args, h) => {
  const root = h.arrayToTree(args[0]);
  const res = target(root, h.findNode(root, args[1]), h.findNode(root, args[2]));
  return res ? res.val : null;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: 2 is left of 6 and 8 is right of 6, so the paths split at the root.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], expected: 6 },
    { scenario: 'Example 2', hint: 'A node is its own ancestor: 4 is inside 2\'s subtree, so the answer is 2 itself.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], expected: 2 },
    { scenario: 'Two-node tree', hint: 'Smallest tree: p is the root, q its child — the root is the LCA.', args: [[2, 1], 2, 1], expected: 2 },
    { scenario: 'Both in left subtree', hint: 'Both values are smaller than the root: move left before deciding.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], expected: 4 },
    { scenario: 'Both in right subtree', hint: 'Both are larger than 6: move right, they split at 8.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 7, 9], expected: 8 },
    { scenario: 'Split at an inner node', hint: '0 and 5 split at 2, not at the root. Compare p.val and q.val, not the node objects.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 0, 5], expected: 2 },
    { scenario: 'Descendant given first', hint: 'q is the ancestor of p here (p = 3 lies under q = 4); argument order must not matter.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 4], expected: 4 },
    { scenario: 'p larger than q', hint: 'p > q: your comparisons must not assume p is the smaller one.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 9, 3], expected: 6 },
    { scenario: 'Split at the root, deep nodes', hint: 'Deep nodes on opposite sides still meet at the root.', args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 9], expected: 6 },
    { scenario: 'Ancestor through a gap', hint: '2 lives under 1\'s right child; 3 is the root, so the split is at 3.', args: [[3, 1, 4, null, 2], 2, 4], expected: 3 },
    { scenario: 'Right-skewed chain', hint: 'In a chain the LCA is always the shallower node.', args: [[1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12], 10, 7], expected: 7 },
    { scenario: 'Large tree, extremes (n = 10^5)', hint: '10^5 nodes: the smallest and largest values split at the root.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(100000), 1, 100000]', expected: 50000 },
    { scenario: 'Large tree, adjacent leaves', hint: '10^5 nodes, two close values: one downward walk of O(log n) steps suffices; the general LCA visits every node.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(100000), 77776, 77778]', expected: 77776 },
  ],

  solution: {
    code: `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p.val < node.val && q.val < node.val) node = node.left;       // both on the left
    else if (p.val > node.val && q.val > node.val) node = node.right; // both on the right
    else return node;                                                 // they split here
  }
  return null;
}`,
  },
  dryRun: {
    columns: ['node', 'p=3, q=5', 'decision'],
    rows: [['6', 'both < 6', 'go left'], ['2', 'both > 2', 'go right'], ['4', '3 < 4 < 5', 'split → LCA = 4']],
  },
  complexity: { time: 'O(h)', space: 'O(1)', explanation: 'A single downward walk; iterative so no stack.' },
  alternative: {
    title: 'General binary-tree LCA',
    md: 'Recursively search both subtrees; return the node where p and q are found on different sides. Works on any tree but is O(n).',
    complexity: 'O(n) time, O(h) space',
  },
  mistakes: [
    'Comparing node references with values (`p < node.val`) — compare `p.val`.',
    'Forgetting that a node can be its own ancestor (p = 2, q = 4 → 2).',
    'Using the O(n) general LCA without mentioning the BST shortcut.',
  ],
};
