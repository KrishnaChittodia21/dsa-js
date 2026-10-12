export default {
  id: 'same-tree',
  title: 'Same Tree',
  difficulty: 'Easy',
  order: 3,
  pattern: 'tree-dfs-traversal',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 100, url: 'https://leetcode.com/problems/same-tree/' },

  statement: `Given the roots of two binary trees \`p\` and \`q\`, return \`true\` if they are **identical**: same shape, and every pair of corresponding nodes has the same value.`,
  examples: [
    { input: 'p = [1,2,3], q = [1,2,3]', output: 'true' },
    { input: 'p = [1,2], q = [1,null,2]', output: 'false', explanation: 'Same values, but 2 is a left child in p and a right child in q.' },
    { input: 'p = [1,2,1], q = [1,1,2]', output: 'false' },
  ],
  constraints: ['The number of nodes in each tree is in the range [0, 100]', '-10^4 <= Node.val <= 10^4'],

  think: `- When are two **empty** trees the same? One empty and one not?
- If both roots exist and have equal values, what else must be true?
- Why is comparing preorder value lists not enough?`,
  patternChallenge: {
    options: ['Hashing both trees into sets of values', 'Tree DFS on two trees at once', 'BFS level order only on p', 'Sorting'],
    answer: 1,
    explanation: 'Walk both trees in lockstep: compare the current pair of nodes, then the pair of left children and the pair of right children. Sets of values ignore shape and positions.',
  },
  hints: [
    'Base cases: both null → true; exactly one null → false; values differ → false.',
    'Otherwise return `isSameTree(p.left, q.left) && isSameTree(p.right, q.right)`.',
  ],
  approach: `Recursive definition: two trees are the same iff their roots match **and** their left subtrees are the same **and** their right subtrees are the same.

Handle null carefully first (both null = same, one null = different), then compare values, then recurse. \`&&\` short-circuits, so the search stops at the first difference. O(min(n, m)) time.

A traversal list of values alone is not enough (\`[1,2]\` vs \`[1,null,2]\` both have preorder 1, 2) unless nulls are recorded too.`,

  functionName: 'isSameTree',
  paramNames: ['p', 'q'],
  starterCode: `/**
 * @param {TreeNode} p
 * @param {TreeNode} q
 * @return {boolean}
 */
function isSameTree(p, q) {
  
}
`,
  io: { params: ['tree', 'tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'Identical shape and values.',
      args: [[1, 2, 3], [1, 2, 3]], expected: true },
    { scenario: 'Example 2', hint: 'Same values but 2 hangs on different sides — the shape differs.',
      args: [[1, 2], [1, null, 2]], expected: false },
    { scenario: 'Example 3', hint: 'Same shape, children swapped — values differ position by position.',
      args: [[1, 2, 1], [1, 1, 2]], expected: false },
    { scenario: 'Both empty', hint: 'Two empty trees are the same.',
      args: [[], []], expected: true },
    { scenario: 'Only q empty', hint: 'Check null before reading `.val`, or this throws a TypeError.',
      args: [[1], []], expected: false },
    { scenario: 'Only p empty', hint: 'The mirror case of the previous test: p is null, q is not.',
      args: [[], [1]], expected: false },
    { scenario: 'Same inorder, different shape', hint: 'Mistake check: [2,1] and [1,null,2] both give inorder 1,2. Traversals without null markers lose the shape.',
      args: [[2, 1], [1, null, 2]], expected: false },
    { scenario: 'Only right subtree differs', hint: 'Mistake check: combining subtree results with `||` returns true as soon as the left side matches. Both sides must match.',
      args: [[1, 2, 3], [1, 2, 4]], expected: false },
    { scenario: 'Deep leaf differs', hint: 'The difference is a single leaf at depth 3.',
      args: [[1, 2, 3, 4], [1, 2, 3, 5]], expected: false },
    { scenario: 'Extra node at the bottom', hint: 'q has one more leaf than p; the comparison must notice the null vs node.',
      args: [[5, 4, 7, null, 3], [5, 4, 7, null, 3, 1]], expected: false },
    { scenario: 'Zero values', hint: 'Values of 0 are real nodes — testing `if (p.val)` or `if (!p)` on values goes wrong here.',
      args: [[0, null, 0], [0, 0]], expected: false },
    { scenario: 'Extreme values equal', hint: 'Min and max values compare equal with ===.',
      args: [[-10000, 10000, -10000], [-10000, 10000, -10000]], expected: true },
    { scenario: 'Identical 100-node trees', hint: 'The maximum size; every node is compared once.',
      argsGen: '() => [Array.from({ length: 100 }, (_, i) => i * 3 - 150), Array.from({ length: 100 }, (_, i) => i * 3 - 150)]', expected: true },
    { scenario: '100 nodes, last leaf differs', hint: 'Everything matches except the very last leaf — do not stop early.',
      argsGen: '() => [Array.from({ length: 100 }, (_, i) => i), Array.from({ length: 100 }, (_, i) => (i === 99 ? -1 : i))]', expected: false },
  ],

  solution: {
    code: `function isSameTree(p, q) {
  if (p === null && q === null) return true;   // both empty
  if (p === null || q === null) return false;  // only one empty
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
  },
  dryRun: {
    columns: ['pair', 'check', 'result'],
    rows: [
      ['(1, 1)', 'values equal', 'recurse'],
      ['(2, null)', 'one is null', 'false → && stops, whole answer false'],
    ],
  },
  complexity: { time: 'O(min(n, m))', space: 'O(min(h₁, h₂))', explanation: 'We stop at the first mismatch; at most every node of the smaller tree is compared.' },
  alternative: {
    title: 'Serialize both with null markers',
    md: 'Serialize each tree in preorder writing "#" for nulls and compare the strings. O(n + m) time and space — simple, but always processes both trees fully.',
    complexity: 'O(n + m) time and space',
  },
  mistakes: [
    'Checking `p.val` before checking for null → TypeError.',
    'Comparing only values in traversal order without null markers.',
    'Using `||` instead of `&&` to combine the subtree results.',
  ],
};
