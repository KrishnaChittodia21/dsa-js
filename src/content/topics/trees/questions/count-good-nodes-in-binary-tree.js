export default {
  id: 'count-good-nodes-in-binary-tree',
  title: 'Count Good Nodes in Binary Tree',
  difficulty: 'Medium',
  order: 4,
  pattern: 'tree-top-down',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 1448, url: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/' },

  statement: `A node \`X\` in a binary tree is **good** if, on the path from the root down to \`X\`, there is no node with a value **greater than** \`X.val\`.

Given the \`root\`, return the number of good nodes. (The root is always good.)`,
  examples: [
    { input: 'root = [3,1,4,3,null,1,5]', output: '4', explanation: 'Good nodes: 3 (root), 4, 5, and the left-left 3 (path 3 → 1 → 3, nothing greater than 3).' },
    { input: 'root = [3,3,null,4,2]', output: '3', explanation: '2 is not good because 3 is above it.' },
    { input: 'root = [1]', output: '1' },
  ],
  constraints: ['The number of nodes is in the range [1, 10^5]', '-10^4 <= Node.val <= 10^4'],

  think: `- To decide whether a node is good, what is the **one** number about its ancestors you need?
- How does that number change when you move from a node to its child?
- Does this information come from above or from below?`,
  patternChallenge: {
    options: ['Tree Recursion — Bottom-Up', 'Tree BFS — Level Order', 'Tree Recursion — Top-Down (pass the max so far)', 'Binary Search'],
    answer: 2,
    explanation: 'Goodness depends only on the **maximum value above** the node — information from ancestors → pass it down as a parameter. Bottom-up returns cannot tell a node about its ancestors.',
  },
  hints: [
    '`dfs(node, maxSoFar)` — the largest value on the path from the root to node\'s parent.',
    'node is good if `node.val >= maxSoFar`. Recurse into both children with `Math.max(maxSoFar, node.val)`, and return good + counts from both children.',
  ],
  approach: `**Brute force:** for each node, walk the path from the root and check all ancestors → O(n · h).

**Top-down:** carry \`maxSoFar\` down the recursion. At each node:
- good iff \`node.val >= maxSoFar\`;
- children receive \`max(maxSoFar, node.val)\`.
Start with \`-Infinity\` so the root is always good. Each node is visited once → O(n).

Note the mix: the max flows **down** (parameter) while the count flows **up** (return value).

**Stack depth:** with n up to 10⁵ a completely skewed tree would need 10⁵ recursive frames, which can exceed the JavaScript call-stack limit. An iterative version with an explicit stack of \`[node, maxSoFar]\` pairs is the safe choice for such inputs.`,

  functionName: 'goodNodes',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number}
 */
function goodNodes(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the root, 4, 5 and the lower 3 are good.', args: [[3, 1, 4, 3, null, 1, 5]], expected: 4 },
    { scenario: 'Example 2', hint: '2 is not good because 3 is above it; the second 3 equals the root and is good.', args: [[3, 3, null, 4, 2]], expected: 3 },
    { scenario: 'Example 3', hint: 'The root is always good.', args: [[1]], expected: 1 },
    { scenario: 'All children smaller', hint: 'Every node below the root has a larger ancestor — only the root counts.', args: [[5, 4, 3, 2, 1]], expected: 1 },
    { scenario: 'Increasing downward', hint: 'Every path only grows, so every node is good.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: 7 },
    { scenario: 'All equal values', hint: 'A node equal to the path maximum is still good — use >=, not >.', args: [[2, 2, 2, 2, 2]], expected: 5 },
    { scenario: 'Negative values', hint: 'Starting maxSoFar at 0 makes negative nodes look bad. Start from the root value or −Infinity.', args: [[-1, -2, -1, -3, null, 0]], expected: 3 },
    { scenario: 'Single negative node', hint: 'A lone negative root is still good — maxSoFar = 0 would return 0.', args: [[-10000]], expected: 1 },
    { scenario: 'Dip then rise', hint: 'Pass max(maxSoFar, node.val) to the children, not node.val — 6 is bigger than its parent 3 but smaller than the root 9.', args: [[9, null, 3, 6]], expected: 1 },
    { scenario: 'Max carried down a branch', hint: 'The bottom 4 sits on the path 2 → 4 → 8 → 4, so 8 above it makes it not good — the running maximum must be carried all the way down.', args: [[2, null, 4, 10, 8, null, null, 4]], expected: 4 },
    { scenario: 'Extreme values', hint: 'Values at the limits ±10^4; mixing them on one path tests the running maximum.', args: [[-10000, 10000, -10000, 10000, -10000, 10000]], expected: 5 },
    { scenario: 'Large tree (n = 10^5)', hint: 'Visit each node once, carrying the path maximum down — O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (((i * 2654435761) >>> 0) % 20001) - 10000)]', expected: 6202 },
    { scenario: 'Long chain (n = 5000)', hint: 'A 5000-deep left chain with a zigzagging running maximum.', argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 1) a.push(null); a.push(((i * 37) % 101) + Math.floor(i / 50)); } return [a]; }', expected: 95 },
    { scenario: 'Decreasing right chain', hint: 'A 5000-node chain that only decreases: only the root is good.', argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 0) a.push(null); a.push(5000 - i); } return [a]; }', expected: 1 },
  ],

  solution: {
    code: `function goodNodes(root) {
  // Iterative DFS with an explicit stack: safe even for a 10^5-node chain.
  let count = 0;
  const stack = [[root, -Infinity]];           // [node, max value on the path ABOVE node]
  while (stack.length) {
    const [node, maxAbove] = stack.pop();
    if (node.val >= maxAbove) count++;         // nothing above is greater
    const next = Math.max(maxAbove, node.val); // what the children will see above them
    if (node.left) stack.push([node.left, next]);
    if (node.right) stack.push([node.right, next]);
  }
  return count;
}`,
    explanation: 'This is the top-down recursion `dfs(node, maxSoFar)` written with an explicit stack: each stack entry carries the information that would have been the parameter.',
  },
  dryRun: {
    columns: ['node', 'maxAbove', 'good?', 'passes down'],
    rows: [
      ['3 (root)', '-∞', 'yes', '3'],
      ['1', '3', 'no', '3'],
      ['3 (under 1)', '3', 'yes (3 ≥ 3)', '3'],
      ['4', '3', 'yes', '4'],
      ['1 (under 4)', '4', 'no', '4'],
      ['5', '4', 'yes', '5 → total 4'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h) recursive / O(n) worst case for the stack', explanation: 'Each node is pushed and popped once.' },
  alternative: {
    title: 'Recursive top-down',
    md: 'The textbook form. Clear and short; fine unless the tree may be a very long chain.',
    code: `function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (!node) return 0;
    const good = node.val >= maxSoFar ? 1 : 0;
    const m = Math.max(maxSoFar, node.val);
    return good + dfs(node.left, m) + dfs(node.right, m);
  }
  return dfs(root, -Infinity);
}`,
    complexity: 'O(n) time, O(h) space',
  },
  mistakes: [
    'Using `>` instead of `>=` (equal values are still good).',
    'Starting with `maxSoFar = 0` — breaks with negative values.',
    'Passing `node.val` instead of `max(maxSoFar, node.val)` to the children.',
  ],
};
