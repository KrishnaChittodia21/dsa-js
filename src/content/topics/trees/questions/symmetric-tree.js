export default {
  id: 'symmetric-tree',
  title: 'Symmetric Tree',
  difficulty: 'Easy',
  order: 4,
  pattern: 'tree-dfs-traversal',
  tags: ['tree', 'dfs', 'bfs', 'recursion'],
  source: { platform: 'LeetCode', number: 101, url: 'https://leetcode.com/problems/symmetric-tree/' },

  statement: `Given the \`root\` of a binary tree, return \`true\` if the tree is a **mirror image of itself** (symmetric around its centre line), otherwise \`false\`.`,
  examples: [
    { input: 'root = [1,2,2,3,4,4,3]', output: 'true' },
    { input: 'root = [1,2,2,null,3,null,3]', output: 'false', explanation: 'Both 3s are right children, so the sides are not mirrors.' },
  ],
  constraints: ['The number of nodes is in the range [1, 1000]', '-100 <= Node.val <= 100'],

  think: `- Symmetric means the left subtree is a mirror of the right subtree. How is "mirror" different from "same"?
- If you compare nodes \`a\` (on the left) and \`b\` (on the right), which children of \`a\` should be paired with which children of \`b\`?
- Can you reuse the idea from Same Tree?`,
  patternChallenge: {
    options: ['Tree DFS on mirrored pairs of nodes', 'Inorder traversal and palindrome check', 'Tree Recursion — Top-Down with depth', 'Two Pointers on the level-order array'],
    answer: 0,
    explanation: 'It is Same Tree with crossed pairs: (a.left, b.right) and (a.right, b.left). An inorder palindrome check fails on some trees (e.g. [1,2,2,2,null,2]) because inorder loses shape information.',
  },
  hints: [
    'Write a helper `mirror(a, b)` that returns whether subtree a is a mirror of subtree b.',
    '`mirror(a, b)`: both null → true; one null → false; values differ → false; else `mirror(a.left, b.right) && mirror(a.right, b.left)`.',
  ],
  approach: `The tree is symmetric iff \`root.left\` and \`root.right\` are mirrors. Two trees are mirrors iff their roots have equal values, the **outer** pair (a.left, b.right) are mirrors, and the **inner** pair (a.right, b.left) are mirrors.

This is the Same Tree recursion with crossed children. O(n) time. An iterative version pushes pairs onto a queue/stack in the same crossed order.`,

  functionName: 'isSymmetric',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {boolean}
 */
function isSymmetric(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The left subtree is the mirror image of the right subtree.',
      args: [[1, 2, 2, 3, 4, 4, 3]], expected: true },
    { scenario: 'Example 2', hint: 'Both 3s are right children — values match level by level but the shape is not mirrored.',
      args: [[1, 2, 2, null, 3, null, 3]], expected: false },
    { scenario: 'Single node', hint: 'A lone root is symmetric.',
      args: [[1]], expected: true },
    { scenario: 'Palindromic inorder', hint: 'Mistake check: inorder is 2,2,1,2,2 — a palindrome — yet the tree is not symmetric. Traversals lose the shape.',
      args: [[1, 2, 2, 2, null, 2]], expected: false },
    { scenario: 'Same, not mirror', hint: 'Mistake check: both subtrees are identical (3 on the left of each). Pairing a.left with b.left says yes; a mirror needs a.left with b.right.',
      args: [[1, 2, 2, 3, null, 3]], expected: false },
    { scenario: 'Different child values', hint: 'The two children differ.',
      args: [[1, 2, 3]], expected: false },
    { scenario: 'Only a left child', hint: 'One side is null and the other is not — check nulls before `.val`.',
      args: [[1, 2]], expected: false },
    { scenario: 'Only a right child', hint: 'The mirror of the previous case.',
      args: [[1, null, 2]], expected: false },
    { scenario: 'Inner pair mirrored', hint: 'The inner grandchildren (left.right and right.left) mirror each other.',
      args: [[1, 2, 2, null, 3, 3]], expected: true },
    { scenario: 'Deep symmetric', hint: 'Symmetric down to the fourth level.',
      args: [[2, 3, 3, 4, 5, 5, 4, null, null, 8, 9, 9, 8]], expected: true },
    { scenario: 'Deep asymmetric', hint: 'Only the 4th level breaks the mirror (8,9 vs 8,9 instead of 9,8).',
      args: [[2, 3, 3, 4, 5, 5, 4, null, null, 8, 9, 8, 9]], expected: false },
    { scenario: 'Negative and zero values', hint: 'Values 0 and negatives are real nodes.',
      args: [[0, -100, -100, 100, null, null, 100]], expected: true },
    { scenario: 'V shape (999 nodes)', hint: 'Two 499-node arms, one going left and one going right — symmetric, 500 levels deep.',
      argsGen: '() => { const a = [0, 1, 1]; for (let i = 2; i < 500; i++) a.push(i % 201 - 100, null, null, i % 201 - 100); return [a]; }', expected: true },
    { scenario: 'Perfect tree, one bad leaf', hint: 'A 511-node mirrored tree whose very last leaf is changed — the mismatch is at the bottom-right.',
      argsGen: '() => { const a = []; for (let L = 0; L < 9; L++) { const w = 2 ** L; for (let k = 0; k < w; k++) a.push(Math.min(k, w - 1 - k) % 100); } a[a.length - 1] = -1; return [a]; }', expected: false },
  ],

  solution: {
    code: `function isSymmetric(root) {
  // a is on the left side, b is its mirror position on the right side
  function mirror(a, b) {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (a.val !== b.val) return false;
    return mirror(a.left, b.right)     // outer pair
        && mirror(a.right, b.left);    // inner pair
  }
  return root === null || mirror(root.left, root.right);
}`,
  },
  dryRun: {
    columns: ['pair (a, b)', 'values', 'next pairs'],
    rows: [
      ['(2, 2)', 'equal', '(3, 3) outer, (4, 4) inner'],
      ['(3, 3)', 'equal', '(null, null), (null, null) → true'],
      ['(4, 4)', 'equal', 'true → symmetric'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Every node is compared once with its mirror partner.' },
  alternative: {
    title: 'Iterative with a queue of pairs',
    md: 'Enqueue (root.left, root.right). Repeatedly dequeue a pair, check it, and enqueue (a.left, b.right) and (a.right, b.left).',
    complexity: 'O(n) time, O(w) space',
  },
  mistakes: [
    'Pairing a.left with b.left (that checks "same", not "mirror").',
    'Comparing inorder traversals — shape is lost.',
    'Accessing `.val` before the null checks.',
  ],
};
