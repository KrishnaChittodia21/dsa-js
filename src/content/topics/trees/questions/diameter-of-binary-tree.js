export default {
  id: 'diameter-of-binary-tree',
  title: 'Diameter of Binary Tree',
  difficulty: 'Easy',
  order: 5,
  pattern: 'tree-bottom-up',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 543, url: 'https://leetcode.com/problems/diameter-of-binary-tree/' },

  statement: `Given the \`root\` of a binary tree, return the length of its **diameter**: the number of **edges** on the longest path between any two nodes. The path does not have to pass through the root.`,
  examples: [
    { input: 'root = [1,2,3,4,5]', output: '3', explanation: 'Path 4 → 2 → 1 → 3 (or 5 → 2 → 1 → 3) has 3 edges.' },
    { input: 'root = [1,2]', output: '1' },
  ],
  constraints: ['The number of nodes is in the range [1, 10^4]', '-100 <= Node.val <= 100'],

  think: `- Every path has a single highest node where it "bends". What is the longest path that bends at a given node, in terms of its subtrees?
- Computing a height separately for every node is O(n²). Which value could each call return so that nothing is computed twice?
- What does the parent need from a child — a path that bends, or a path that goes straight down?`,
  patternChallenge: {
    options: ['BFS from the root', 'Tree Recursion — Bottom-Up (return height, record L + R)', 'Tree Recursion — Top-Down (pass depth)', 'Tree Paths with Backtracking'],
    answer: 1,
    explanation: 'The longest path through a node = height(left) + height(right): information from **below**. Return the height, record the two-sided sum in a global — one postorder pass, O(n). BFS from the root only measures distance from the root, and the diameter may not include it.',
  },
  hints: [
    'Write `height(node)` = number of nodes on the longest downward path (`height(null) = 0`).',
    'Inside `height`, after computing L and R, update `best = max(best, L + R)` (edges through this node), then return `1 + max(L, R)`.',
  ],
  approach: `**Brute force:** for every node compute height(left) + height(right) with a separate height function → O(n²) on a chain.

**Bottom-up:** one postorder DFS that returns the height and, as a side effect, records the best "bent" path:
- \`L = height(left)\`, \`R = height(right)\`
- candidate diameter through this node = \`L + R\` edges
- return \`1 + max(L, R)\` — the parent can only extend a **one-sided** path.`,

  functionName: 'diameterOfBinaryTree',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number}
 */
function diameterOfBinaryTree(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the longest path 4 → 2 → 1 → 3 has 3 edges.', args: [[1, 2, 3, 4, 5]], expected: 3 },
    { scenario: 'Example 2', hint: 'Two nodes are joined by one edge.', args: [[1, 2]], expected: 1 },
    { scenario: 'Single node', hint: 'One node has no edges — the diameter is 0, not 1. Count edges, not nodes.', args: [[1]], expected: 0 },
    { scenario: 'Right child only', hint: 'A missing left child has height 0.', args: [[1, null, 2]], expected: 1 },
    { scenario: 'Chain of five', hint: 'Five nodes in a line give 4 edges. Counting nodes is off by one.', args: [[1, 2, null, 3, null, 4, null, 5]], expected: 4 },
    { scenario: 'Perfect tree', hint: 'Leaf to leaf through the root: 4 edges.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: 4 },
    { scenario: 'Diameter avoids the root', hint: 'The longest path bends at the root\'s left child and never touches the root. Track the best L + R at every node.', args: [[1, 2, null, 3, 4, 5, null, null, 6]], expected: 4 },
    { scenario: 'Forked subtree', hint: 'Return 1 + max(L, R) to the parent. Returning L + R lets a path fork and overcounts.', args: [[1, 2, 3, 4, 5, null, null, 6, null, null, 7]], expected: 4 },
    { scenario: 'Long branches on both sides', hint: 'Two long branches meet at the root\'s left child.', args: [[1, 2, 7, 3, 4, null, null, 5, null, null, 6]], expected: 4 },
    { scenario: 'Negative values, deep tree', hint: 'Values are irrelevant — only the shape matters. The longest path has 8 edges.', args: [[4, -7, -3, null, null, -9, -3, 9, -7, -4, null, 6, null, -6, -6, null, null, 0, 6, 5, null, 9, null, null, -1, -4, null, null, null, -2]], expected: 8 },
    { scenario: 'Large complete tree (n = 10^4)', hint: 'Compute heights bottom-up once; calling a separate height function from every node repeats work.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i % 201) - 100)]', expected: 25 },
    { scenario: 'Long chain (n = 5000)', hint: 'A 5000-node chain has 4999 edges. The recursion is 5000 deep, which is fine.', argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 1) a.push(null); a.push((i % 201) - 100); } return [a]; }', expected: 4999 },
    { scenario: 'Caterpillar (n = 9999)', hint: 'A 5000-node spine where every spine node also has a leaf: the separate-height approach is O(n·depth) here and too slow. Get heights and the diameter in one post-order pass.', argsGen: '() => { const root = new TreeNode(0); let s = root; for (let i = 1; i < 5000; i++) { s.right = new TreeNode(1); s.left = new TreeNode(i % 100); s = s.left; } return [treeToArray(root)]; }', expected: 5000, timeLimitMs: 200 },
  ],

  solution: {
    code: `function diameterOfBinaryTree(root) {
  let best = 0;

  // returns the number of nodes on the longest downward path from node
  function height(node) {
    if (node === null) return 0;
    const L = height(node.left);
    const R = height(node.right);
    best = Math.max(best, L + R);     // longest path bending at node (in edges)
    return 1 + Math.max(L, R);        // one-sided path for the parent
  }

  height(root);
  return best;
}`,
  },
  dryRun: {
    columns: ['node', 'L', 'R', 'L + R', 'best', 'returns'],
    rows: [
      ['4', '0', '0', '0', '0', '1'],
      ['5', '0', '0', '0', '0', '1'],
      ['2', '1', '1', '2', '2', '2'],
      ['3', '0', '0', '0', '2', '1'],
      ['1', '2', '1', '3', '3', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'One postorder pass; each node does O(1) work after its children return.' },
  alternative: {
    title: 'Iterative postorder with a height Map',
    md: 'Traverse in postorder with an explicit stack and store each node\'s height in a Map; compute L + R when a node is finished. Avoids deep recursion on skewed trees.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Returning `L + R` to the parent (a path cannot fork).',
    'Assuming the diameter passes through the root.',
    'Counting nodes instead of edges (off by one).',
    'Computing heights in a separate function called from every node (O(n²)).',
  ],
};
