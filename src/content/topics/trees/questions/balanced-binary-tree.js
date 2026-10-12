export default {
  id: 'balanced-binary-tree',
  title: 'Balanced Binary Tree',
  difficulty: 'Easy',
  order: 6,
  pattern: 'tree-bottom-up',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 110, url: 'https://leetcode.com/problems/balanced-binary-tree/' },

  statement: `A binary tree is **height-balanced** if, **for every node**, the heights of its left and right subtrees differ by at most 1.

Given the \`root\` of a binary tree, return whether it is height-balanced. An empty tree is balanced.`,
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: 'true' },
    { input: 'root = [1,2,2,3,3,null,null,4,4]', output: 'false', explanation: 'At the root, the left subtree has height 3 and the right subtree height 1.' },
    { input: 'root = []', output: 'true' },
  ],
  constraints: ['The number of nodes is in the range [0, 5000]', '-10^4 <= Node.val <= 10^4'],

  think: `- To judge one node you need the heights of both of its subtrees. Where does that information come from?
- If you call a separate height() from every node, how many times is each node visited on a chain?
- How can a single return value say both "my height is h" and "something below me is already unbalanced"?`,
  patternChallenge: {
    options: ['BFS: every level must be full', 'Tree Recursion — Top-Down (pass depth)', 'Tree Recursion — Bottom-Up (return height or −1)', 'Sorting leaf depths'],
    answer: 2,
    explanation: 'Balance is a rule about subtree heights at every node — information from below → bottom-up. Returning −1 as a failure sentinel makes it a single O(n) pass. "Full levels" is a much stronger condition than balanced.',
  },
  hints: [
    'Let `check(node)` return the height of the subtree, or `-1` if the subtree is not balanced.',
    'After computing L and R: if either is −1 or `|L − R| > 1` return −1; otherwise return `1 + max(L, R)`.',
  ],
  approach: `**Brute force (top-down):** at every node compute height(left) and height(right) with a separate function and compare, then recurse → O(n²) on a skewed tree (O(n log n) on a balanced one).

**Bottom-up:** compute heights once in postorder and check the rule on the way up. Use −1 to mean "unbalanced somewhere below"; every ancestor passes −1 straight up. O(n) time.`,

  functionName: 'isBalanced',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {boolean}
 */
function isBalanced(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic balanced tree from the statement.', args: [[3, 9, 20, null, null, 15, 7]], expected: true },
    { scenario: 'Example 2', hint: 'The root\'s subtrees have heights 3 and 1 — the difference is more than 1.', args: [[1, 2, 2, 3, 3, null, null, 4, 4]], expected: false },
    { scenario: 'Example 3', hint: 'An empty tree is balanced — return true when root is null.', args: [[]], expected: true },
    { scenario: 'Single node', hint: 'Both subtrees are empty (height 0), so a lone node is balanced.', args: [[1]], expected: true },
    { scenario: 'Two nodes', hint: 'Heights 1 and 0 differ by exactly 1 — that is still allowed.', args: [[1, 2]], expected: true },
    { scenario: 'Right chain of three', hint: 'At the root the left height is 0 and the right height is 2.', args: [[1, null, 2, null, 3]], expected: false },
    { scenario: 'Root fine, subtrees not', hint: 'The root\'s two subtrees have equal height, but deeper nodes are lopsided. The rule applies to every node, not only the root.', args: [[1, 2, 2, 3, null, null, 3, 4, null, null, 4]], expected: false },
    { scenario: 'Balanced but not complete', hint: 'Balanced does not mean complete or full — gaps are fine as long as every node\'s heights differ by at most 1.', args: [[1, 2, 3, null, 4, null, 5]], expected: true },
    { scenario: 'Heights differ by exactly 1', hint: 'Use > 1 for "unbalanced", not >= 1.', args: [[1, 2, 3, 4, 5, 6, null, 8]], expected: true },
    { scenario: 'Failure sentinel next to empty side', hint: 'The left subtree is already unbalanced (−1) and the right is empty (0). If you compare −1 with 0 without checking the sentinel, |−1 − 0| = 1 looks fine.', args: [[1, 2, null, null, 3, null, 4]], expected: false },
    { scenario: 'Negative values', hint: 'Values do not matter, only the shape.', args: [[-1, -2, -3, -4, null, null, -5]], expected: true },
    { scenario: 'Large complete tree (n = 5000)', hint: 'A complete tree is always balanced. Compute heights bottom-up once instead of re-measuring every subtree.', argsGen: '() => [Array.from({ length: 5000 }, (_, i) => i + 1)]', expected: true },
    { scenario: 'Large chain (n = 5000)', hint: 'A 5000-deep chain: unbalanced right above the bottom. Make sure your recursion stops early once a failure is found.', argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 1) a.push(null); a.push(i + 1); } return [a]; }', expected: false },
    { scenario: 'Deep imbalance in large tree', hint: 'A perfect 4095-node tree with a 2-node tail hanging under its leftmost leaf: only a node near the bottom breaks the rule.', argsGen: '() => { let root = arrayToTree(Array.from({ length: 4095 }, (_, i) => i + 1)); let n = root; while (n.left) n = n.left; n.left = new TreeNode(-1); n.left.left = new TreeNode(-2); return [treeToArray(root)]; }', expected: false },
  ],

  solution: {
    code: `function isBalanced(root) {
  // returns the height of node's subtree, or -1 if it is not balanced
  function check(node) {
    if (node === null) return 0;
    const L = check(node.left);
    if (L === -1) return -1;                   // already failed below: stop early
    const R = check(node.right);
    if (R === -1) return -1;
    if (Math.abs(L - R) > 1) return -1;        // this node breaks the rule
    return 1 + Math.max(L, R);
  }
  return check(root) !== -1;
}`,
  },
  dryRun: {
    columns: ['node', 'L', 'R', '|L − R|', 'returns'],
    rows: [
      ['4 (both)', '0', '0', '0', '1'],
      ['3 (left)', '1', '1', '0', '2'],
      ['3 (right)', '0', '0', '0', '1'],
      ['2 (left)', '2', '1', '1', '3'],
      ['2 (right)', '0', '0', '0', '1'],
      ['1 (root)', '3', '1', '2 > 1', '-1 → false'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node is visited once; failures short-circuit upward.' },
  alternative: {
    title: 'Top-down with a separate height function',
    md: '`isBalanced(node) = |h(left) − h(right)| ≤ 1 && isBalanced(left) && isBalanced(right)`. Simple to write but recomputes heights: O(n²) worst case.',
    complexity: 'O(n²) time worst case, O(h) space',
  },
  mistakes: [
    'Only checking the root (the rule applies to every node).',
    'Confusing "balanced" with "complete" or "full".',
    'Using `Math.max(L, R) - Math.min(L, R)` after one side returned −1 without checking for the sentinel.',
  ],
};
