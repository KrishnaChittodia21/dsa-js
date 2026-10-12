export default {
  id: 'validate-binary-search-tree',
  title: 'Validate Binary Search Tree',
  difficulty: 'Medium',
  order: 3,
  pattern: 'bst-range-bounds',
  tags: ['tree', 'binary search tree', 'dfs'],
  source: { platform: 'LeetCode', number: 98, url: 'https://leetcode.com/problems/validate-binary-search-tree/' },

  statement: `Given the \`root\` of a binary tree, decide whether it is a **valid binary search tree**:

- every value in a node's **left subtree** is strictly less than the node's value;
- every value in a node's **right subtree** is strictly greater than the node's value;
- both subtrees are themselves valid BSTs.`,
  examples: [
    { input: 'root = [2,1,3]', output: 'true' },
    { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: '4 is in the right subtree of 5 but 4 < 5.' },
    { input: 'root = [5,3,8,null,null,4,9]', output: 'false', explanation: '4 is a fine left child of 8, but it sits in 5\'s right subtree.' },
  ],
  constraints: ['1 <= number of nodes <= 10^4', '-2^31 <= Node.val <= 2^31 - 1'],

  think: `- Is it enough to check each node against its two children? Try the third example.
- As you walk down from the root, what constraints does each ancestor impose on a node?
- What initial bounds work even when values reach -2^31 or 2^31 − 1?`,
  patternChallenge: {
    options: ['Compare every node with its children only', 'BST — Pass Valid Range Down (low, high)', 'Level-order traversal', 'BST — Guided Descent'],
    answer: 1,
    explanation: 'Validity is a whole-subtree rule, which becomes local once each node knows the interval (low, high) its ancestors allow. Checking only children is the classic wrong answer; guided descent follows one path, but validation must inspect every node.',
  },
  hints: [
    'Every node must lie in an open interval. The root\'s is (-∞, +∞).',
    'Recurse with `valid(node.left, low, node.val)` and `valid(node.right, node.val, high)`; fail if `node.val <= low || node.val >= high`.',
  ],
  approach: `**Wrong shortcut:** check \`left.val < node.val < right.val\` at every node. Fails on \`[5,3,8,null,null,4,9]\`.

**Brute force:** for each node, compute the max of its left subtree and the min of its right subtree — O(n²) on skewed trees.

**Optimized (bounds):** pass the allowed interval down. Left child: \`(low, node.val)\`. Right child: \`(node.val, high)\`. Each node is checked once against two numbers — O(n).

**Equivalent:** in-order traversal must be strictly increasing (compare with \`prev\`).`,

  functionName: 'isValidBST',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {boolean}
 */
function isValidBST(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'Basic valid tree.', args: [[2, 1, 3]], expected: true },
    { scenario: 'Example 2', hint: '3 is in the right subtree of 5 but smaller than 5 — invalid.', args: [[5, 1, 4, null, null, 3, 6]], expected: false },
    { scenario: 'Example 3', hint: '4 is a valid child of 8, but it sits in the right subtree of 5. Checking only parent/child pairs misses this.', args: [[5, 3, 8, null, null, 4, 9]], expected: false },
    { scenario: 'Single node', hint: 'One node is always a valid BST.', args: [[1]], expected: true },
    { scenario: 'Duplicate left child', hint: 'Equal values are not allowed: use strict comparisons (<), not <=.', args: [[1, 1]], expected: false },
    { scenario: 'Duplicate right child', hint: 'A right child equal to its parent is also invalid.', args: [[1, null, 1]], expected: false },
    { scenario: 'All equal values', hint: 'Every node equal — invalid because the order must be strictly increasing.', args: [[2, 2, 2]], expected: false },
    { scenario: 'Maximum int value', hint: 'A single 2^31 − 1: a bound of 2^31 − 1 or a "MAX" sentinel would wrongly reject it.', args: [[2147483647]], expected: true },
    { scenario: 'Minimum and maximum values', hint: 'Values -2^31 and 2^31 − 1. Using Number.MIN_VALUE (a tiny positive number) as the lower bound rejects negatives.', args: [[-2147483648, null, 2147483647]], expected: true },
    { scenario: 'Negative values valid', hint: 'Negative values are fine; the lower bound must be -Infinity, not Number.MIN_VALUE.', args: [[-1, -2, 0]], expected: true },
    { scenario: 'Grandchild breaks upper bound', hint: '6 is fine for its parent 15, but must also be greater than the root 10.', args: [[10, 5, 15, null, null, 6, 20]], expected: false },
    { scenario: 'Perfect valid tree', hint: 'A full 3-level valid BST.', args: [[3, 1, 5, 0, 2, 4, 6]], expected: true },
    { scenario: 'Large valid tree (n = 10^4)', hint: '10^4 nodes forming a valid BST: pass bounds down in one O(n) pass.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000)]', expected: true },
    { scenario: 'Large tree, one deep violation', hint: 'Valid everywhere except one deep leaf that breaks an ancestor\'s bound.', argsGen: '() => { const a = ((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000); a[a.length - 1] = 1; return [a]; }', expected: false },
  ],

  solution: {
    code: `function isValidBST(root) {
  // Each stack entry: [node, low, high] — node.val must lie strictly inside (low, high).
  const stack = [[root, -Infinity, Infinity]];
  while (stack.length) {
    const [node, low, high] = stack.pop();
    if (!node) continue;
    if (node.val <= low || node.val >= high) return false;
    stack.push([node.left, low, node.val]);   // left: tighten the upper bound
    stack.push([node.right, node.val, high]); // right: tighten the lower bound
  }
  return true;
}`,
    explanation: 'Iterative DFS carrying bounds; the recursive version `valid(n, lo, hi)` is equally good for interviews.',
  },
  dryRun: {
    columns: ['node', '(low, high)', 'ok?'],
    rows: [['5', '(-∞, ∞)', 'yes'], ['8', '(5, ∞)', 'yes'], ['4', '(5, 8)', '4 <= 5 → false'],],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Every node is checked once; the stack holds pending siblings along one path.' },
  alternative: {
    title: 'In-order must be strictly increasing',
    code: `function isValidBST(root) {
  let prev = -Infinity;
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; }
    node = stack.pop();
    if (node.val <= prev) return false;
    prev = node.val;
    node = node.right;
  }
  return true;
}`,
    md: 'Uses the "in-order = sorted" pattern. Stops at the first descent.',
    complexity: 'O(n) time, O(h) space',
  },
  mistakes: [
    'Checking only parent/child pairs.',
    'Using `Number.MIN_VALUE` (a tiny positive number) as the lower bound.',
    'Allowing equal values (`<` vs `<=`) — duplicates make the tree invalid here.',
  ],
};
