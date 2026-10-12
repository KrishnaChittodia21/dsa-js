export default {
  id: 'range-sum-of-bst',
  title: 'Range Sum of BST',
  difficulty: 'Easy',
  order: 2,
  pattern: 'bst-range-bounds',
  tags: ['tree', 'binary search tree', 'dfs'],
  source: { platform: 'LeetCode', number: 938, url: 'https://leetcode.com/problems/range-sum-of-bst/' },

  statement: `Given the \`root\` of a binary search tree and two integers \`low\` and \`high\`, return the **sum of the values of all nodes** whose value lies in the inclusive range \`[low, high]\`.`,
  examples: [
    { input: 'root = [10,5,15,3,7,null,18], low = 7, high = 15', output: '32', explanation: '7 + 10 + 15 = 32.' },
    { input: 'root = [10,5,15,3,7,13,18,1,null,6], low = 6, high = 10', output: '23', explanation: '6 + 7 + 10 = 23.' },
  ],
  constraints: ['1 <= number of nodes <= 2 * 10^4', '1 <= Node.val <= 10^5', '1 <= low <= high <= 10^5', 'All values are unique'],

  think: `- If a node's value is **below** \`low\`, can anything in its left subtree be in range?
- Which subtrees can you skip entirely, and what does that save on a big tree with a narrow range?`,
  patternChallenge: {
    options: ['Prefix Sum', 'Two Pointers', 'BST — Pass Valid Range Down (low, high)', 'Binary tree level-order traversal'],
    answer: 2,
    explanation: 'We only care about values inside [low, high], and the BST ordering lets us prune any subtree that lies completely outside that range. Prefix sums and two pointers are array techniques; level-order visits every node and ignores the ordering.',
  },
  hints: [
    'A plain DFS that adds every in-range value works. Now make it skip subtrees that cannot contain in-range values.',
    'If `node.val < low`, only `node.right` can help. If `node.val > high`, only `node.left` can help. Otherwise add the value and recurse both ways.',
  ],
  approach: `**Brute force:** visit every node, add it if \`low <= val <= high\` — O(n).

**Optimized (pruning with bounds):**
- \`node.val < low\` → the node and its whole left subtree are too small: recurse right only.
- \`node.val > high\` → the node and its whole right subtree are too large: recurse left only.
- otherwise → add \`node.val\` and recurse on both children.

Worst case is still O(n) (everything in range), but for narrow ranges only the nodes near the range plus the O(h) paths leading to it are visited.`,

  functionName: 'rangeSumBST',
  paramNames: ['root', 'low', 'high'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} low
 * @param {number} high
 * @return {number}
 */
function rangeSumBST(root, low, high) {
  
}
`,
  io: { params: ['tree', 'any', 'any'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: 7, 10 and 15 are in range.', args: [[10, 5, 15, 3, 7, null, 18], 7, 15], expected: 32 },
    { scenario: 'Example 2', hint: 'Both bounds are node values (6 and 10) — the range is inclusive.', args: [[10, 5, 15, 3, 7, 13, 18, 1, null, 6], 6, 10], expected: 23 },
    { scenario: 'Single node in range', hint: 'One node with low = high = its value: inclusive comparisons must count it.', args: [[5], 5, 5], expected: 5 },
    { scenario: 'Single node out of range', hint: 'Nothing is in range — the sum is 0.', args: [[5], 1, 4], expected: 0 },
    { scenario: 'Range covers whole tree', hint: 'Every node counts; pruning must never skip an in-range node.', args: [[10, 5, 15, 3, 7, null, 18], 1, 100], expected: 58 },
    { scenario: 'Range between node values', hint: 'No node lies in [16, 17] — return 0.', args: [[10, 5, 15, 3, 7, null, 18], 16, 17], expected: 0 },
    { scenario: 'Inclusive bounds at extremes', hint: 'low and high equal the min and max values; exclusive comparisons drop both.', args: [[2, 1, 3], 1, 3], expected: 6 },
    { scenario: 'Root below low', hint: 'The root is too small, but its right subtree is in range. Returning early at a node below low loses those values.', args: [[3, 1, 10, null, null, 8, 12], 8, 12], expected: 30 },
    { scenario: 'Root above high', hint: 'The root is too large but its left subtree has in-range values — keep exploring left.', args: [[20, 10, 30, 5, 15], 5, 12], expected: 15 },
    { scenario: 'Below-low node inside range', hint: 'Node 5 < low, but its right child 7 is in range: only the left side of 5 can be pruned.', args: [[10, 5, 15, 3, 7, 13, 18, 1, null, 6], 7, 13], expected: 30 },
    { scenario: 'Maximum values', hint: 'Values up to 10^5; the range [99999, 100000] holds only the largest nodes.', args: [[50000, 1, 100000, null, null, 99999], 99999, 100000], expected: 199999 },
    { scenario: 'Large tree, full range', hint: '20000 nodes, everything in range: the sum is large and every node must be visited once.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(20000), 1, 100000]', expected: 200010000 },
    { scenario: 'Large tree, narrow range', hint: '20000 nodes but only [9990, 10010] matters; pruning skips almost everything.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(20000), 9990, 10010]', expected: 210000 },
  ],

  solution: {
    code: `function rangeSumBST(root, low, high) {
  let sum = 0;
  const stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop();
    if (node.val < low) {                 // node and its left side are too small
      if (node.right) stack.push(node.right);
    } else if (node.val > high) {         // node and its right side are too large
      if (node.left) stack.push(node.left);
    } else {                              // in range: count it, both sides may help
      sum += node.val;
      if (node.left) stack.push(node.left);
      if (node.right) stack.push(node.right);
    }
  }
  return sum;
}`,
    explanation: 'An explicit stack avoids recursion-depth issues on skewed trees; the recursive version is equally acceptable.',
  },
  dryRun: {
    columns: ['node', 'in [7,15]?', 'action', 'sum'],
    rows: [
      ['10', 'yes', 'add, push 5 and 15', '10'],
      ['15', 'yes', 'add, push 18 (no left)', '25'],
      ['18', '> 15', 'push left (none)', '25'],
      ['5', '< 7', 'push right 7 only (skip 3)', '25'],
      ['7', 'yes', 'add', '32'],
    ],
  },
  complexity: { time: 'O(n) worst case', space: 'O(h)', explanation: 'Every node may be in range. With pruning, nodes whose subtree lies outside the range are never visited. The stack holds O(h) nodes for DFS order (up to O(n) on pathological shapes).' },
  alternative: {
    title: 'In-order traversal without pruning',
    md: 'Collect the in-order (sorted) values and sum those in range. Simple and correct, but always O(n) and O(n) memory.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Returning early at a node below `low` without exploring its right subtree — larger values live there.',
    'Using exclusive comparisons; the range is inclusive.',
    'Forgetting the null checks before pushing children.',
  ],
};
