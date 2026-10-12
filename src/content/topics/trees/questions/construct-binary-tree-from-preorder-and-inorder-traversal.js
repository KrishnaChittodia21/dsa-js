export default {
  id: 'construct-binary-tree-from-preorder-and-inorder-traversal',
  title: 'Construct Binary Tree from Preorder and Inorder Traversal',
  difficulty: 'Medium',
  order: 7,
  pattern: 'tree-construction',
  tags: ['tree', 'divide and conquer', 'hash map', 'recursion'],
  source: { platform: 'LeetCode', number: 105, url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/' },

  statement: `You are given two arrays \`preorder\` and \`inorder\`: the preorder and inorder traversals of the same binary tree with **unique** values. Rebuild the tree and return its root.`,
  examples: [
    { input: 'preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]', output: '[3,9,20,null,null,15,7]' },
    { input: 'preorder = [-1], inorder = [-1]', output: '[-1]' },
  ],
  constraints: ['1 <= preorder.length <= 3000', 'inorder.length === preorder.length', 'Values are unique', 'Both arrays describe the same tree'],

  think: `- Which array tells you the root immediately?
- Once you know the root, how does the other array tell you which values are in the left subtree and which in the right?
- How many elements of preorder belong to the left subtree?
- What makes a naive solution O(n²), and how do you avoid it?`,
  patternChallenge: {
    options: ['Tree BFS — Level Order', 'Tree Construction — preorder gives roots, inorder splits (index Map)', 'Sorting', 'Binary Search Tree insertion'],
    answer: 1,
    explanation: 'preorder[0] is the root; its position in inorder divides the rest into left and right subtrees. Recurse on index ranges with a value → index Map. Inserting into a BST would need an ordering — values here are arbitrary.',
  },
  hints: [
    'Build `idx = new Map(value → position in inorder)`. Keep a pointer `p` into preorder that always points at the next root to create.',
    '`build(lo, hi)` builds the subtree whose inorder range is [lo, hi]: take `preorder[p++]` as root, find `mid = idx.get(root)`, build left from [lo, mid − 1] first, then right from [mid + 1, hi].',
  ],
  approach: `**Naive recursion:** root = preorder[0]; find it in inorder with \`indexOf\`; \`slice\` both arrays into left/right parts and recurse. Correct, but \`indexOf\` and \`slice\` are O(n) per call → O(n²) on a skewed tree.

**Optimized:**
1. Map every inorder value to its index (O(1) lookup).
2. A global preorder pointer: preorder lists a root, then its whole left subtree, then its whole right subtree — so if we always build the left subtree first, the next unused preorder value is exactly the next root we need.
3. Recurse on inorder **index ranges** instead of slices. Empty range (\`lo > hi\`) → null.
Each value is consumed once → O(n) time.`,

  functionName: 'buildTree',
  paramNames: ['preorder', 'inorder'],
  starterCode: `/**
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @return {TreeNode}
 */
function buildTree(preorder, inorder) {
  
}
`,
  io: { params: ['any', 'any'], returns: 'tree' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 3 is the root, 9 is its left subtree, [15, 20, 7] its right subtree.', args: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], expected: [3, 9, 20, null, null, 15, 7] },
    { scenario: 'Example 2', hint: 'A single node: both arrays hold just the root.', args: [[-1], [-1]], expected: [-1] },
    { scenario: 'Two nodes, left child', hint: 'In inorder the child comes before the root, so it belongs on the left.', args: [[1, 2], [2, 1]], expected: [1, 2] },
    { scenario: 'Two nodes, right child', hint: 'In inorder the child comes after the root, so it belongs on the right. Watch the range bounds: left is [lo, mid − 1], right is [mid + 1, hi].', args: [[1, 2], [1, 2]], expected: [1, null, 2] },
    { scenario: 'Perfect tree', hint: 'Both subtrees are non-empty at every inner node. Build the left subtree before the right, because preorder lists left first.', args: [[1, 2, 4, 5, 3, 6, 7], [4, 2, 5, 1, 6, 3, 7]], expected: [1, 2, 3, 4, 5, 6, 7] },
    { scenario: 'Left chain', hint: 'Inorder is the reverse of preorder: every root has an empty right range.', args: [[1, 2, 3, 4], [4, 3, 2, 1]], expected: [1, 2, null, 3, null, 4] },
    { scenario: 'Right chain', hint: 'Preorder and inorder are identical: every root has an empty left range.', args: [[1, 2, 3, 4], [1, 2, 3, 4]], expected: [1, null, 2, null, 3, null, 4] },
    { scenario: 'Zigzag path', hint: 'The path turns left, right, left — the split point moves around inside the ranges.', args: [[1, 2, 3, 4], [2, 4, 3, 1]], expected: [1, 2, null, null, 3, 4] },
    { scenario: 'Root splits unevenly', hint: 'The root\'s left subtree has two nodes and the right one. Find the split from the position of the root in inorder.', args: [[3, 1, 2, 4], [1, 2, 3, 4]], expected: [3, 1, 4, null, 2] },
    { scenario: 'Negative and unsorted values', hint: 'Values are arbitrary unique numbers, not 1..n — look them up by value (a Map), not by assuming positions.', args: [[0, -5, 7, -9, 8, -2, 10], [7, -9, -5, 0, -2, 8, 10]], expected: [0, -5, 8, 7, null, -2, 10, null, -9] },
    { scenario: 'Values at index boundaries', hint: 'Values that look like indices (0, 1, 2…) in a scrambled shape — do not confuse a value with its position.', args: [[2, 0, 3, 1, 4], [0, 3, 2, 4, 1]], expected: [2, 0, 1, null, 3, 4] },
    { scenario: 'Random shape (31 nodes)', hint: 'A larger irregular tree: every subtree range must be computed exactly.', args: [[17, -13, 2, -31, -28, 14, -34, -7, -25, -40, 20, 44, -22, 50, 29, 23, 47, 38, -4, 32, 11, -37, -16, -10, -19, 26, 8, -1, 41, 35, 5], [14, -28, -31, -7, -34, 2, 20, -40, -25, -13, 50, -22, 44, 23, 29, 17, 32, -4, 11, 38, -16, -37, -10, 47, 8, 26, -1, -19, 35, 41, 5]], expected: [17, -13, 47, 2, 44, 38, -19, -31, -25, -22, 29, -4, -37, 26, 41, -28, -34, -40, null, 50, null, 23, null, 32, 11, -16, -10, 8, -1, 35, 5, 14, null, -7, null, 20] },
    { scenario: 'Random shape (40 nodes)', hint: 'Another irregular tree with uneven depths on each side.', args: [[-37, -13, 14, -40, -4, -19, 32, 41, 26, 62, 50, -7, -16, 53, 71, 29, 65, 68, -10, 2, -22, 59, -28, 8, 11, -34, 23, 35, 74, -31, -1, 17, 77, 38, 5, 20, 56, -25, 47, 44], [-19, -4, -40, 26, 62, 41, 32, 50, 14, -16, 53, -7, 71, 29, -13, -22, 2, -10, 68, -28, 59, 8, 65, 11, -37, 74, 35, -1, -31, 23, 17, 38, 77, -34, 20, 5, -25, 56, 47, 44]], expected: [-37, -13, -34, 14, 65, 23, 5, -40, -7, 68, 11, 35, 17, 20, 56, -4, 32, -16, 71, -10, 59, null, null, 74, -31, null, 77, null, null, -25, 47, -19, null, 41, 50, null, 53, null, 29, 2, null, -28, 8, null, null, -1, null, 38, null, null, null, null, 44, null, null, 26, null, null, null, null, null, null, null, -22, null, null, null, null, null, null, null, null, null, null, null, null, 62] },
    { scenario: 'Large complete tree (n = 3000)', hint: 'A 3000-node complete tree. Look up each root\'s inorder position in a Map built once — indexOf inside the recursion is O(n²).', argsGen: '() => { const n = 3000, pre = [], ino = []; const st = [1]; while (st.length) { const i = st.pop(); if (i > n) continue; pre.push(i); st.push(2 * i + 1, 2 * i); } (function go(i) { if (i > n) return; go(2 * i); ino.push(i); go(2 * i + 1); })(1); return [pre, ino]; }', expected: Array.from({ length: 3000 }, (_, i) => i + 1) },
    { scenario: 'Long left chain (n = 3000)', hint: 'Inorder is preorder reversed, so every root has an empty right range and the recursion is 3000 deep.', argsGen: '() => [Array.from({ length: 3000 }, (_, i) => i + 1), Array.from({ length: 3000 }, (_, i) => 3000 - i)]', expected: Array.from({ length: 5998 }, (_, i) => (i === 0 ? 1 : i % 2 ? (i + 3) / 2 : null)) },
  ],

  solution: {
    code: `function buildTree(preorder, inorder) {
  const idx = new Map();                     // value -> position in inorder
  inorder.forEach((v, i) => idx.set(v, i));
  let p = 0;                                 // next root in preorder

  // build the subtree whose values occupy inorder[lo..hi]
  function build(lo, hi) {
    if (lo > hi) return null;
    const val = preorder[p++];
    const mid = idx.get(val);
    const node = new TreeNode(val);
    node.left = build(lo, mid - 1);          // left subtree comes next in preorder
    node.right = build(mid + 1, hi);
    return node;
  }

  return build(0, inorder.length - 1);
}`,
    explanation: 'Uses the toolkit\'s `TreeNode` class (available globally).',
  },
  dryRun: {
    columns: ['call build(lo, hi)', 'root (preorder[p])', 'mid in inorder', 'left range', 'right range'],
    rows: [
      ['(0, 4)', '3', '1', '(0, 0)', '(2, 4)'],
      ['(0, 0)', '9', '0', '(0, −1) null', '(1, 0) null'],
      ['(2, 4)', '20', '3', '(2, 2)', '(4, 4)'],
      ['(2, 2)', '15', '2', 'null', 'null'],
      ['(4, 4)', '7', '4', 'null', 'null'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'The Map holds n entries; each value is processed once. Recursion depth is the tree height (up to n for a chain).' },
  alternative: {
    title: 'Slicing (simpler, O(n²))',
    md: 'Find the root in inorder with indexOf, slice both arrays, recurse. Easy to explain first in an interview, then optimize.',
    code: `function buildTree(preorder, inorder) {
  if (preorder.length === 0) return null;
  const root = new TreeNode(preorder[0]);
  const mid = inorder.indexOf(preorder[0]);
  root.left = buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
  root.right = buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));
  return root;
}`,
    complexity: 'O(n²) time and space worst case',
  },
  mistakes: [
    'Building the right subtree before the left while consuming preorder left to right.',
    'Using `indexOf` inside the recursion (O(n²)).',
    'Off-by-one in the ranges: left is [lo, mid − 1], right is [mid + 1, hi].',
    'Assuming it works with duplicate values — the split point would be ambiguous.',
  ],
};
