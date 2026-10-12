export default {
  id: 'insert-into-a-binary-search-tree',
  title: 'Insert into a Binary Search Tree',
  difficulty: 'Medium',
  order: 1,
  pattern: 'bst-guided-descent',
  tags: ['tree', 'binary search tree'],
  source: { platform: 'LeetCode', number: 701, url: 'https://leetcode.com/problems/insert-into-a-binary-search-tree/' },

  statement: `You are given the \`root\` of a binary search tree and a value \`val\` that is **not** already in the tree. Insert \`val\` so that the tree is still a valid BST, and return the root of the resulting tree.

Several different trees can be valid answers; any of them is accepted.`,
  examples: [
    { input: 'root = [4,2,7,1,3], val = 5', output: '[4,2,7,1,3,5]', explanation: '5 > 4 → go right to 7; 5 < 7 and 7 has no left child → 5 becomes 7\'s left child.' },
    { input: 'root = [], val = 5', output: '[5]', explanation: 'Empty tree: the new node is the root.' },
  ],
  constraints: ['0 <= number of nodes <= 10^4', '-10^8 <= Node.val, val <= 10^8', 'All values are unique', 'val does not exist in the tree'],

  think: `- If you walk down as if **searching** for \`val\`, where do you end up?
- Does any existing node ever need to move?
- What should you return when the tree is empty?`,
  patternChallenge: {
    options: ['Backtracking', 'BST — Build Balanced from Sorted Data', 'BST — Guided Descent', 'Breadth-first search to find the first empty slot'],
    answer: 2,
    explanation: 'Insertion is a failed search: descend by comparing with each node and attach the new node where the search falls off the tree. Filling the first empty slot in BFS order ignores the ordering and breaks the BST; rebuilding balanced from scratch is O(n).',
  },
  hints: [
    'Search for `val`. The search will end at a `null` child — that is exactly where `val` belongs.',
    'Recursively: `if (!node) return new TreeNode(val)`; otherwise `node.left = insert(node.left, val)` or `node.right = ...`, and return `node`.',
  ],
  approach: `**Brute force:** collect all values plus \`val\`, sort, rebuild a BST — O(n log n) and throws away the existing structure.

**Optimized:** new values can always be added as a **leaf**. Walk down: smaller → left, larger → right. When the child you want is \`null\`, put the new node there. Every ancestor comparison you made is still true for the new leaf, so the invariant holds. O(h).`,

  functionName: 'insertIntoBST',
  paramNames: ['root', 'val'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} val
 * @return {TreeNode}
 */
function insertIntoBST(root, val) {
  
}
`,
  io: { params: ['tree', 'any'], returns: 'tree' },
  checker: `(output, args, expected, h) => {
  const root = h.arrayToTree(output);
  const ok = (n, lo, hi) => !n || (lo < n.val && n.val < hi && ok(n.left, lo, n.val) && ok(n.right, n.val, hi));
  if (!ok(root, -Infinity, Infinity)) return false;          // still a valid BST
  const want = [...h.traversals.inorder(h.arrayToTree(args[0])), args[1]].sort((a, b) => a - b);
  return JSON.stringify(h.traversals.inorder(root)) === JSON.stringify(want); // same values + val
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: walk right to 7, then 7 has no left child — attach 5 there.', args: [[4, 2, 7, 1, 3], 5], expected: [4, 2, 7, 1, 3, 5] },
    { scenario: 'Example 2', hint: 'Empty tree: the new node becomes (and you must return) the root.', args: [[], 5], expected: [5] },
    { scenario: 'Insert into deeper level', hint: 'Walk 40 → 20 → 30 and attach 25 as 30\'s left child.', args: [[40, 20, 60, 10, 30, 50, 70], 25], expected: [40, 20, 60, 10, 30, 50, 70, null, null, 25] },
    { scenario: 'Single node, larger value', hint: 'Becomes the root\'s right child.', args: [[1], 2], expected: [1, null, 2] },
    { scenario: 'Single node, smaller value', hint: 'Becomes the root\'s left child.', args: [[1], 0], expected: [1, 0] },
    { scenario: 'New minimum', hint: 'Smaller than everything: it goes to the bottom of the left spine.', args: [[4, 2, 7, 1, 3], 0], expected: [4, 2, 7, 1, 3, null, null, 0] },
    { scenario: 'New maximum', hint: 'Larger than everything: it goes to the bottom of the right spine. The first empty slot in BFS order (7.left) would break the ordering.', args: [[4, 2, 7, 1, 3], 8], expected: [4, 2, 7, 1, 3, null, 8] },
    { scenario: 'Value between two nodes', hint: 'Not assigning the recursive result back to root.left / root.right loses the new node.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 12], expected: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13, null, null, null, null, null, 12] },
    { scenario: 'Negative values', hint: 'Comparisons work the same with negatives.', args: [[-5, -10, 0], -7], expected: [-5, -10, 0, null, -7] },
    { scenario: 'Extreme values', hint: 'Values at ±10^8 — no special casing needed.', args: [[0, -100000000, 99999999], 100000000], expected: [0, -100000000, 99999999, null, null, null, 100000000] },
    { scenario: 'Right-skewed chain', hint: 'Inserting at the end of a chain: walk all the way down.', args: [[1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12], 13], expected: [1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12, null, 13] },
    { scenario: 'Large tree (n = 10^4)', hint: '10^4 nodes: one descent of O(h) is enough; rebuilding the tree is wasteful.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 2 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 7777]', expectedGen: "() => { const [arr, val] = (() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 2 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 7777])(); const vals = [...traversals.inorder(arrayToTree(arr)), val].sort((a, b) => a - b); const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(vals[m], b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(0, vals.length - 1)); }" },
  ],

  solution: {
    code: `function insertIntoBST(root, val) {
  const fresh = new TreeNode(val);
  if (!root) return fresh;
  let node = root;
  while (true) {
    if (val < node.val) {
      if (!node.left) { node.left = fresh; break; }   // fell off → attach here
      node = node.left;
    } else {
      if (!node.right) { node.right = fresh; break; }
      node = node.right;
    }
  }
  return root;
}`,
    explanation: 'Iterative, so a skewed tree of 10⁴ nodes cannot overflow the call stack.',
  },
  dryRun: {
    columns: ['node', 'compare', 'action'],
    rows: [['4', '5 > 4', 'go right'], ['7', '5 < 7', 'left is null → attach 5 as 7.left']],
  },
  complexity: { time: 'O(h)', space: 'O(1)', explanation: 'One root-to-leaf walk; no recursion.' },
  alternative: {
    title: 'Recursive (return the new subtree root)',
    code: `function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}`,
    md: 'Elegant and the same idea; uses O(h) stack.',
    complexity: 'O(h) time, O(h) space',
  },
  mistakes: [
    'Not assigning the recursive result back to `root.left` / `root.right`.',
    'Forgetting the empty-tree case.',
    'Inserting at the first empty slot found by BFS — breaks the ordering.',
  ],
};
