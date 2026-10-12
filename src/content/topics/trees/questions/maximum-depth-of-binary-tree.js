export default {
  id: 'maximum-depth-of-binary-tree',
  title: 'Maximum Depth of Binary Tree',
  difficulty: 'Easy',
  order: 1,
  pattern: 'tree-bottom-up',
  tags: ['tree', 'dfs', 'bfs', 'recursion'],
  source: { platform: 'LeetCode', number: 104, url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },

  statement: `Given the \`root\` of a binary tree, return its **maximum depth**: the number of **nodes** on the longest path from the root down to a leaf.

An empty tree has depth 0.`,
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'The longest root-to-leaf paths are 3 → 20 → 15 and 3 → 20 → 7.' },
    { input: 'root = [1,null,2]', output: '2' },
  ],
  constraints: ['The number of nodes is in the range [0, 10^4]', '-100 <= Node.val <= 100'],

  think: `- If you already knew the depth of the left subtree and of the right subtree, what would the depth of the whole tree be?
- What should an empty tree return so that a leaf automatically gets depth 1?
- Could you also solve it by counting levels?`,
  patternChallenge: {
    options: ['Tree Recursion — Bottom-Up (return height)', 'Binary Search', 'Tree Paths with Backtracking', 'Sliding Window'],
    answer: 0,
    explanation: 'The depth of a tree is defined by its subtrees: 1 + max(depth(left), depth(right)). That is the purest bottom-up recursion. (Top-down with a depth parameter and BFS counting levels also work.)',
  },
  hints: [
    'Base case: `maxDepth(null) = 0`.',
    'Otherwise return `1 + Math.max(maxDepth(root.left), maxDepth(root.right))`.',
  ],
  approach: `**Bottom-up:** a tree's depth is one more than the deeper of its two subtrees. With \`depth(null) = 0\` every leaf becomes 1 automatically. Each node is visited once → O(n).

**BFS alternative:** process the tree level by level and count the levels.

**Top-down alternative:** pass the current depth as a parameter and keep the maximum seen — the lesson compares both directions on exactly this problem.`,

  functionName: 'maxDepth',
  paramNames: ['root'],
  starterCode: `/**
 * Definition for a binary tree node (available globally as TreeNode):
 * function TreeNode(val, left, right) { this.val = val; this.left = left ?? null; this.right = right ?? null; }
 *
 * @param {TreeNode} root
 * @return {number}
 */
function maxDepth(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The longest root-to-leaf path is 3 → 20 → 15 (3 nodes).',
      args: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
    { scenario: 'Example 2', hint: 'A right-only chain of two nodes has depth 2.',
      args: [[1, null, 2]], expected: 2 },
    { scenario: 'Empty tree', hint: 'An empty tree has depth 0. Returning 1 for null makes every answer one too large.',
      args: [[]], expected: 0 },
    { scenario: 'Single node', hint: 'A lone root has depth 1 — depth counts nodes, not edges.',
      args: [[0]], expected: 1 },
    { scenario: 'Left chain', hint: 'A left-leaning chain of 5 nodes has depth 5; counting edges gives 4.',
      args: [[1, 2, null, 3, null, 4, null, 5]], expected: 5 },
    { scenario: 'Perfect tree', hint: 'Every path in a perfect tree of 7 nodes has length 3.',
      args: [[1, 2, 3, 4, 5, 6, 7]], expected: 3 },
    { scenario: 'Deeper side is the right', hint: 'The deepest leaf is in the right subtree — you must look at both sides.',
      args: [[1, 2, 3, null, null, 4, null, null, 5]], expected: 4 },
    { scenario: 'One child missing (min vs max)', hint: 'Using Math.min picks the short side (or the empty side, giving the wrong answer); depth needs Math.max.',
      args: [[1, 2, 3, 4]], expected: 3 },
    { scenario: 'Negative values', hint: 'Values never matter — only the shape.',
      args: [[-100, -50, null, -1]], expected: 3 },
    { scenario: 'Two nodes', hint: 'A root with one child has depth 2.',
      args: [[7, 8]], expected: 2 },
    { scenario: 'Balanced tree (n = 10^4)', hint: 'A complete tree with 10 000 nodes has depth 14. One visit per node keeps this O(n).',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i % 201) - 100)]', expected: 14 },
    { scenario: 'Deep chain (5000 nodes)', hint: 'A right-leaning chain 5000 nodes deep. Recursion depth is 5000 here — each call must do O(1) work.',
      argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 0) a.push(null); a.push(i % 100); } return [a]; }', expected: 5000 },
    { scenario: 'Caterpillar (n = 10^4)', hint: 'A long spine where every spine node also has a leaf child. Taking the wrong side at any level loses most of the depth.',
      argsGen: '() => { const a = [0]; for (let i = 1; i < 5000; i++) { a.push(1, 0); a.push(null, null); } return [a]; }', expected: 5000 },
  ],

  solution: {
    code: `function maxDepth(root) {
  if (root === null) return 0;                 // empty tree
  const left = maxDepth(root.left);            // ask the subtrees…
  const right = maxDepth(root.right);
  return 1 + Math.max(left, right);            // …and combine on the way up
}`,
  },
  dryRun: {
    columns: ['node', 'left depth', 'right depth', 'returns'],
    rows: [
      ['9', '0', '0', '1'],
      ['15', '0', '0', '1'],
      ['7', '0', '0', '1'],
      ['20', '1', '1', '2'],
      ['3', '1', '2', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Every node is visited once. The recursion stack is as deep as the tree: O(log n) if balanced, O(n) for a chain.' },
  alternative: {
    title: 'BFS — count the levels',
    md: 'Walk the tree level by level and increment a counter per level. Uses O(w) memory instead of O(h), and cannot overflow the call stack on a deep chain.',
    code: `function maxDepth(root) {
  let depth = 0;
  let level = root ? [root] : [];
  while (level.length) {
    depth++;
    const next = [];
    for (const n of level) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
  }
  return depth;
}`,
    complexity: 'O(n) time, O(w) space',
  },
  mistakes: [
    'Returning 1 for an empty tree (off by one everywhere).',
    'Counting edges instead of nodes (this problem counts nodes).',
    'Using `Math.min` — that computes something else (and is wrong for minimum depth too, when one child is missing).',
  ],
};
