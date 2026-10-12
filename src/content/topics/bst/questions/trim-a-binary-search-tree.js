export default {
  id: 'trim-a-binary-search-tree',
  title: 'Trim a Binary Search Tree',
  difficulty: 'Medium',
  order: 6,
  pattern: 'bst-range-bounds',
  tags: ['tree', 'binary search tree', 'recursion'],
  source: { platform: 'LeetCode', number: 669, url: 'https://leetcode.com/problems/trim-a-binary-search-tree/' },

  statement: `Given the \`root\` of a binary search tree and bounds \`low\` and \`high\`, remove every node whose value is outside \`[low, high]\`. Nodes that remain must keep their relative structure (if a node was a descendant of another remaining node, it still is). Return the root of the trimmed tree — it may be a different node than the original root.

The result is unique.`,
  examples: [
    { input: 'root = [1,0,2], low = 1, high = 2', output: '[1,null,2]' },
    { input: 'root = [3,0,4,null,2,null,null,1], low = 1, high = 3', output: '[3,2,null,1]', explanation: '0 is removed; its right subtree (2 → 1) moves up to take its place.' },
  ],
  constraints: ['1 <= number of nodes <= 10^4', '0 <= Node.val <= 10^4', 'All values are unique', '0 <= low <= high <= 10^4'],

  think: `- If \`node.val < low\`, what do you know about everything in \`node.left\`? And about \`node.right\`?
- A removed node may have children that survive — who should adopt them?
- Can you write a function that returns "the trimmed version of this subtree"?`,
  patternChallenge: {
    options: ['BST — Pass Valid Range Down (low, high)', 'BST — Build Balanced from Sorted Data', 'Delete each out-of-range node with the successor trick', 'Level-order traversal'],
    answer: 0,
    explanation: 'The range [low, high] is a bound; at each node the ordering tells you that a whole side is out of range and can be discarded. Deleting nodes one by one works but costs O(h) per deletion; rebuilding balanced changes the structure the problem asks you to keep.',
  },
  hints: [
    'If `node.val < low`, the node AND its entire left subtree are too small. The answer for this subtree is simply the trimmed right subtree.',
    '`trim(node)`: `< low` → return trim(node.right); `> high` → return trim(node.left); otherwise trim both children, reassign them, return node.',
  ],
  approach: `**Brute force:** find every out-of-range value and delete it with the standard BST delete — O(n·h) and fiddly.

**Optimized (structural recursion with bounds):** \`trim(node)\` returns the root of the trimmed subtree.
- \`node === null\` → \`null\`.
- \`node.val < low\` → the node and its left subtree are all < low → return \`trim(node.right)\`.
- \`node.val > high\` → symmetric → return \`trim(node.left)\`.
- else → \`node.left = trim(node.left)\`, \`node.right = trim(node.right)\`, return \`node\`.

The surviving children are re-attached to the nearest surviving ancestor automatically, because the caller assigns the returned subtree.`,

  functionName: 'trimBST',
  paramNames: ['root', 'low', 'high'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} low
 * @param {number} high
 * @return {TreeNode}
 */
function trimBST(root, low, high) {
  
}
`,
  io: { params: ['tree', 'any', 'any'], returns: 'tree' },
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: 0 is below low and disappears.', args: [[1, 0, 2], 1, 2], expected: [1, null, 2] },
    { scenario: 'Example 2', hint: '0 < low, but its right subtree (2, 1) is in range and must be kept.', args: [[3, 0, 4, null, 2, null, null, 1], 1, 3], expected: [3, 2, null, 1] },
    { scenario: 'Single node kept', hint: 'The only node is in range — return it.', args: [[1], 1, 2], expected: [1] },
    { scenario: 'Single node removed', hint: 'Nothing is in range: return null (empty tree).', args: [[1], 2, 4], expected: [] },
    { scenario: 'Range covers everything', hint: 'No node is removed; the tree is returned unchanged.', args: [[2, 1, 3], 0, 10000], expected: [2, 1, 3] },
    { scenario: 'Root below low', hint: 'The root is removed. Returning null when node.val < low loses its in-range right subtree.', args: [[3, 1, 4, null, 2], 3, 4], expected: [3, null, 4] },
    { scenario: 'Root above high', hint: 'The root goes; the answer is built from its left subtree.', args: [[5, 3, 8, 1, 4, 7, 9], 0, 4], expected: [3, 1, 4] },
    { scenario: 'Root does not survive', hint: 'The original root is out of range; the new root comes from its right subtree.', args: [[5, 3, 8, 1, 4, 7, 9], 6, 10], expected: [8, 7, 9] },
    { scenario: 'Both sides trimmed', hint: 'Nodes are removed on both sides; reassign root.left and root.right with the trimmed results.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 5, 13], expected: [8, 6, 10, null, 7, null, 13] },
    { scenario: 'Range between values', hint: 'No value lies in [11, 12] — the result is empty.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 11, 12], expected: [] },
    { scenario: 'Only one node survives', hint: 'low = high = 6: exactly one node remains.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 6, 6], expected: [6] },
    { scenario: 'Value 0 and low = 0', hint: 'low = high = 0 keeps only the node with value 0.', args: [[2, 0, 3, null, 1], 0, 0], expected: [0] },
    { scenario: 'Large tree (n = 10^4)', hint: '10^4 nodes trimmed to [2500, 7500]: whole subtrees are dropped without visiting them.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 2500, 7500]', expectedGen: "() => { const [arr, lo, hi] = (() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 2500, 7500])(); const roots = [], st = [[arrayToTree(arr), null]]; while (st.length) { const [n, anc] = st.pop(); if (!n) continue; let me = anc; if (n.val >= lo && n.val <= hi) { me = new TreeNode(n.val); if (!anc) roots.push(me); else if (n.val < anc.val) anc.left = me; else anc.right = me; } st.push([n.left, me], [n.right, me]); } return treeToArray(roots[0] || null); }" },
  ],

  solution: {
    code: `function trimBST(root, low, high) {
  if (!root) return null;
  if (root.val < low) return trimBST(root.right, low, high);  // drop root + its left side
  if (root.val > high) return trimBST(root.left, low, high);  // drop root + its right side
  root.left = trimBST(root.left, low, high);
  root.right = trimBST(root.right, low, high);
  return root;
}`,
  },
  dryRun: {
    columns: ['node', 'range [1,3]', 'returns'],
    rows: [
      ['3', 'keep', 'node 3 with trimmed children'],
      ['0 (left of 3)', '< 1', 'trim(2)'],
      ['2', 'keep', 'node 2 with left = trim(1) = 1'],
      ['4 (right of 3)', '> 3', 'trim(null) = null'],
    ],
    note: 'Result [3,2,null,1].',
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node is visited at most once (discarded subtrees are never visited). Recursion depth is the height.' },
  alternative: {
    title: 'Iterative',
    md: 'First move the root down until it is in range. Then walk down the left spine fixing nodes that are < low (replace with their right child), and down the right spine fixing nodes > high. O(n) time, O(1) extra space.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Returning null when `node.val < low` — its right subtree may contain valid values.',
    'Not reassigning `root.left` / `root.right` with the trimmed results.',
    'Assuming the original root always survives.',
  ],
};
