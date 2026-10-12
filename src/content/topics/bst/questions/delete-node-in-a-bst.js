export default {
  id: 'delete-node-in-a-bst',
  title: 'Delete Node in a BST',
  difficulty: 'Medium',
  order: 7,
  pattern: 'bst-guided-descent',
  tags: ['tree', 'binary search tree'],
  source: { platform: 'LeetCode', number: 450, url: 'https://leetcode.com/problems/delete-node-in-a-bst/' },

  statement: `Given the \`root\` of a BST and a value \`key\`, delete the node with that value (if it exists) and return the root of the updated tree. The result must still be a valid BST.

Several trees can be valid answers (e.g. using the successor or the predecessor); any valid one is accepted.`,
  examples: [
    { input: 'root = [5,3,6,2,4,null,7], key = 3', output: '[5,4,6,2,null,null,7]', explanation: '3 has two children; its successor 4 takes its place. [5,2,6,null,4,null,7] is also valid.' },
    { input: 'root = [5,3,6,2,4,null,7], key = 0', output: '[5,3,6,2,4,null,7]', explanation: '0 is not in the tree.' },
    { input: 'root = [], key = 0', output: '[]' },
  ],
  constraints: ['0 <= number of nodes <= 10^4', '-10^5 <= Node.val, key <= 10^5', 'All values are unique'],

  think: `- How do you find the node? (Same as search.)
- What are the three shapes the node can have (by number of children)? Which ones are trivial?
- If the node has two children, which existing value could take its place without breaking the ordering?`,
  patternChallenge: {
    options: ['Rebuild the tree from its in-order without the key', 'BST — Guided Descent (with the successor trick)', 'BST — Bottom-up Subtree Info', 'Breadth-first search'],
    answer: 1,
    explanation: 'Locate the key by descending, then fix the node locally: leaf/one child → splice; two children → replace with the in-order successor and delete that. Rebuilding is O(n) and destroys the shape; bottom-up info and BFS do not use the ordering to find the node.',
  },
  hints: [
    'Write `deleteNode(node, key)` returning the new root of that subtree. Recurse left or right, reassigning the child.',
    'At the node: if one side is null, return the other side. Otherwise find the minimum of the right subtree, copy its value into the node, and delete that value from the right subtree.',
  ],
  approach: `**Brute force:** in-order → remove key → rebuild a (balanced) BST. O(n), shape changes completely.

**Optimized (3 cases):**
1. **Find** the key with guided descent, re-attaching the returned subtree on the way back (\`node.left = deleteNode(node.left, key)\`).
2. **No left child** → return \`node.right\` (covers the leaf case: both null). **No right child** → return \`node.left\`.
3. **Two children** → the in-order successor \`s\` = leftmost node of \`node.right\`. Copy \`s.val\` into \`node\`, then \`node.right = deleteNode(node.right, s.val)\`. \`s\` has no left child, so that inner delete is case 2.

Total: one downward path plus one path to the successor → O(h).`,

  functionName: 'deleteNode',
  paramNames: ['root', 'key'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} key
 * @return {TreeNode}
 */
function deleteNode(root, key) {
  
}
`,
  io: { params: ['tree', 'any'], returns: 'tree' },
  checker: `(output, args, expected, h) => {
  const root = h.arrayToTree(output);
  const ok = (n, lo, hi) => !n || (lo < n.val && n.val < hi && ok(n.left, lo, n.val) && ok(n.right, n.val, hi));
  if (!ok(root, -Infinity, Infinity)) return false;       // still a valid BST
  const want = h.traversals.inorder(h.arrayToTree(args[0])).filter((v) => v !== args[1]);
  return JSON.stringify(h.traversals.inorder(root)) === JSON.stringify(want); // exactly key removed
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: 3 has two children, so replace it with its in-order successor (4) or predecessor.', args: [[5, 3, 6, 2, 4, null, 7], 3], expected: [5, 4, 6, 2, null, null, 7] },
    { scenario: 'Example 2', hint: 'The key is not in the tree — return the tree unchanged.', args: [[5, 3, 6, 2, 4, null, 7], 0], expected: [5, 3, 6, 2, 4, null, 7] },
    { scenario: 'Example 3', hint: 'Empty tree: return null.', args: [[], 0], expected: [] },
    { scenario: 'Delete the root', hint: 'The root has two children; you must return the new root. Not returning root leaves the parent with undefined.', args: [[5, 3, 6, 2, 4, null, 7], 5], expected: [3, 2, 4, null, null, null, 6, null, 7] },
    { scenario: 'Only node in tree', hint: 'Deleting the only node leaves an empty tree.', args: [[1], 1], expected: [] },
    { scenario: 'Root with one child', hint: 'Root 2 has only a left child — that child becomes the new root.', args: [[2, 1], 2], expected: [1] },
    { scenario: 'Delete a leaf', hint: 'A leaf is simply removed: return null for that position.', args: [[5, 3, 6, 2, 4, null, 7], 7], expected: [5, 3, 6, 2, 4] },
    { scenario: 'Node with only right child', hint: 'Node 6 has only a right child; splice it in place of 6.', args: [[5, 3, 6, 2, 4, null, 7], 6], expected: [5, 3, 7, 2, 4] },
    { scenario: 'Node with only left child', hint: 'Node 14 has only a left child (13) — return that child.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 14], expected: [8, 3, 10, 1, 6, null, 13, null, null, 4, 7] },
    { scenario: 'Two children, both subtrees kept', hint: 'Returning just one child of 3 loses the other subtree (1 or 6, 4, 7).', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 3], expected: [8, 1, 10, null, 6, null, 14, 4, 7, 13] },
    { scenario: 'Successor has a right child', hint: 'The successor of 5 is 6, which has a right child (7). Delete the successor from root.right, not root.left.', args: [[5, 2, 9, null, null, 6, 10, null, 7], 5], expected: [2, null, 9, 6, 10, null, 7] },
    { scenario: 'Key larger than all', hint: 'The search falls off the right spine — nothing changes.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 100000], expected: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] },
    { scenario: 'Large tree (n = 10^4)', hint: '10^4 nodes, delete the root: only O(h) nodes should change.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 5000]', expectedGen: "() => { const [arr, key] = (() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 5000])(); const vals = traversals.inorder(arrayToTree(arr)).filter((v) => v !== key); const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(vals[m], b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(0, vals.length - 1)); }" },
  ],

  solution: {
    code: `function deleteNode(root, key) {
  if (!root) return null;                            // key not found
  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    if (!root.left) return root.right;               // 0 or 1 child
    if (!root.right) return root.left;
    let succ = root.right;                           // 2 children: in-order successor
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);   // successor has no left child
  }
  return root;
}`,
  },
  dryRun: {
    columns: ['call', 'node', 'action'],
    rows: [
      ['deleteNode(5, 3)', '5', '3 < 5 → root.left = deleteNode(3, 3)'],
      ['deleteNode(3, 3)', '3', 'two children → succ = 4; val = 4; right = deleteNode(4, 4)'],
      ['deleteNode(4, 4)', '4', 'no left → return right (null)'],
      ['back in 5', '5', 'left = node(4) with left child 2'],
    ],
  },
  complexity: { time: 'O(h)', space: 'O(h)', explanation: 'One path to find the key and one to find the successor; recursion depth is at most h.' },
  alternative: {
    title: 'Relink instead of copying values',
    md: 'Instead of copying the successor value, hang the deleted node\'s left subtree under the successor\'s left pointer and return node.right. Also valid, but it can increase the height more than the value-copy approach.',
    complexity: 'O(h) time',
  },
  mistakes: [
    'Handling the two-children case by returning one child and losing the other subtree.',
    'Deleting the successor from the wrong subtree (it lives in root.right).',
    'Not returning `root` at the end, so the parent re-attaches `undefined`.',
  ],
};
