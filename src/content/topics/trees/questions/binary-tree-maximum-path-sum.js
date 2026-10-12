export default {
  id: 'binary-tree-maximum-path-sum',
  title: 'Binary Tree Maximum Path Sum',
  difficulty: 'Hard',
  order: 1,
  pattern: 'tree-bottom-up',
  tags: ['tree', 'dfs', 'recursion', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 124, url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },

  statement: `A **path** in a binary tree is a sequence of nodes where each pair of neighbours is connected by an edge, and no node appears twice. A path has **at least one node** and does not have to pass through the root.

The **path sum** is the sum of the node values on the path. Given the \`root\`, return the **maximum path sum** of any path. Node values may be negative.`,
  examples: [
    { input: 'root = [1,2,3]', output: '6', explanation: 'Path 2 → 1 → 3.' },
    { input: 'root = [-10,9,20,null,null,15,7]', output: '42', explanation: 'Path 15 → 20 → 7.' },
    { input: 'root = [-3]', output: '-3', explanation: 'A path needs at least one node, even if it is negative.' },
  ],
  constraints: ['The number of nodes is in the range [1, 3 · 10^4]', '-1000 <= Node.val <= 1000'],

  think: `- Every path has one highest node where it bends. Given that node, what is the best path bending there?
- What can a node usefully tell its **parent**? Remember a path cannot fork.
- When should a child's contribution be ignored completely?`,
  patternChallenge: {
    options: ['Kadane on the inorder traversal', 'Tree Recursion — Bottom-Up (return best one-sided gain, record two-sided sum)', 'Tree Recursion — Top-Down (pass prefix sum)', 'Tree BFS — Level Order'],
    answer: 1,
    explanation: 'This is Diameter with weights: each node returns the best **downward** (one-sided) gain, and records the best path bending at it (node + left gain + right gain). Kadane on inorder fails because neighbours in inorder are not always connected by an edge.',
  },
  hints: [
    '`gain(node)` = the best sum of a path that starts at node and goes **down one side** (or stops at node). Drop negative child gains: `L = max(0, gain(left))`.',
    'At each node update `best = max(best, node.val + L + R)` (path bending here) and return `node.val + max(L, R)` (one-sided). Start best at `-Infinity`.',
  ],
  approach: `**Brute force:** for every pair of nodes, sum the path between them → O(n²) pairs × O(n) path = far too slow.

**Bottom-up (like Diameter):**
- \`gain(null) = 0\`.
- \`L = max(0, gain(node.left))\`, \`R = max(0, gain(node.right))\` — a negative branch is better left out.
- Candidate for the answer: \`node.val + L + R\` — the best path whose highest node is \`node\`.
- Return \`node.val + max(L, R)\` — the parent can extend only one branch.

Every path has exactly one highest node, so checking the candidate at every node covers all paths. Initialize \`best = -Infinity\` (or \`root.val\`) so all-negative trees return their largest value instead of 0.`,

  functionName: 'maxPathSum',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number}
 */
function maxPathSum(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The best path bends at the root: 2 → 1 → 3.', args: [[1, 2, 3]], expected: 6 },
    { scenario: 'Example 2', hint: 'The best path 15 → 20 → 7 does not include the root.', args: [[-10, 9, 20, null, null, 15, 7]], expected: 42 },
    { scenario: 'Example 3', hint: 'A path needs at least one node, even if it is negative. Initialising best to 0 returns 0 here.', args: [[-3]], expected: -3 },
    { scenario: 'All negative values', hint: 'If best starts at 0 you return 0, but the answer is the largest single value.', args: [[-2, -1, -3]], expected: -1 },
    { scenario: 'Negative child to skip', hint: 'Take a branch only when its gain is positive — Math.max(0, gain) — otherwise the lone root is better.', args: [[2, -1]], expected: 2 },
    { scenario: 'Zero values', hint: 'Zero-valued branches neither help nor hurt.', args: [[0, -1, 0]], expected: 0 },
    { scenario: 'Path cannot fork', hint: 'Return only node.val + max(L, R) to the parent. Returning node.val + L + R lets a path split into two branches and overcounts.', args: [[10, 2, 10, 20, 1, null, -25, null, null, null, null, 3, 4]], expected: 42 },
    { scenario: 'Best path between two leaves', hint: 'This is not a root-to-leaf problem: the best path joins two leaves under the same inner node.', args: [[-1, 5, null, 4, 3, null, 2, -4, 6]], expected: 20 },
    { scenario: 'Root-to-leaf distractor', hint: 'The path bends at a node deep in the tree; check every node as the possible highest point of the path.', args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], expected: 48 },
    { scenario: 'Mixed signs, deeper tree', hint: 'Several negative nodes sit between good branches; only take branches with positive gain.', args: [[9, 6, -3, null, null, -6, 2, null, null, 2, null, -6, -6, -6]], expected: 16 },
    { scenario: 'Maximum values', hint: 'All 7 nodes are 1000: the best path covers 5 of them (leaf to leaf through the root).', args: [[1000, 1000, 1000, 1000, 1000, 1000, 1000]], expected: 5000 },
    { scenario: 'Large tree (n = 3·10^4)', hint: 'Compute each node\'s gain once in a single post-order pass — re-walking subtrees for every node is far too slow.', argsGen: '() => [Array.from({ length: 30000 }, (_, i) => (((i * 2654435761) >>> 0) % 2001) - 1000)]', expected: 12174 },
    { scenario: 'Long chain (n = 5000)', hint: 'On a chain the answer is the best contiguous run of values. The recursion is 5000 deep, which is fine.', argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { if (i > 1) a.push(null); a.push((((i * 2654435761) >>> 0) % 2001) - 1000); } return [a]; }', expected: 10898 },
    { scenario: 'Large all negative', hint: 'Every value is negative in a large tree: the answer is the largest single value.', argsGen: '() => [Array.from({ length: 30000 }, (_, i) => -1 - ((i * 7919) % 1000))]', expected: -1 },
  ],

  solution: {
    code: `function maxPathSum(root) {
  let best = -Infinity;

  // best sum of a path that starts at node and goes down at most one side
  function gain(node) {
    if (node === null) return 0;
    const L = Math.max(0, gain(node.left));    // ignore branches that only hurt
    const R = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + L + R);   // path whose highest node is 'node'
    return node.val + Math.max(L, R);          // one-sided: the parent may extend it
  }

  gain(root);
  return best;
}`,
  },
  dryRun: {
    columns: ['node', 'L', 'R', 'candidate val+L+R', 'best', 'returns val+max(L,R)'],
    rows: [
      ['9', '0', '0', '9', '9', '9'],
      ['15', '0', '0', '15', '15', '15'],
      ['7', '0', '0', '7', '15', '7'],
      ['20', '15', '7', '42', '42', '35'],
      ['-10', '9', '35', '34', '42', '25'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'One postorder pass, O(1) work per node.' },
  alternative: {
    title: 'Iterative postorder',
    md: 'Compute gains in postorder with an explicit stack (or by reversing a root-right-left preorder) and a Map from node to gain, applying the same formulas. Useful when the tree can be a 3·10⁴-node chain in environments with small stacks.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Initializing `best = 0` — wrong when every value is negative.',
    'Returning `node.val + L + R` to the parent (a path cannot fork).',
    'Forgetting `Math.max(0, …)` — negative branches drag the sum down.',
    'Treating it as a root-to-leaf problem.',
  ],
};
