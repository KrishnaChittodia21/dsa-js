export default {
  id: 'path-sum-ii',
  title: 'Path Sum II',
  difficulty: 'Medium',
  order: 5,
  pattern: 'tree-path-backtracking',
  tags: ['tree', 'dfs', 'backtracking'],
  source: { platform: 'LeetCode', number: 113, url: 'https://leetcode.com/problems/path-sum-ii/' },

  statement: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return **every root-to-leaf path** whose node values add up to \`targetSum\`. Each path is a list of node **values** from the root down to the leaf. Paths may be returned in any order.

A **leaf** is a node with no children.`,
  examples: [
    { input: 'root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22', output: '[[5,4,11,2],[5,8,4,5]]' },
    { input: 'root = [1,2,3], targetSum = 5', output: '[]' },
    { input: 'root = [1,2], targetSum = 0', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 5000]', '-1000 <= Node.val <= 1000', '-1000 <= targetSum <= 1000'],

  think: `- What must you remember while walking down to be able to output the path at a leaf?
- If one path array is shared by all calls, what must happen when a call finishes?
- Can you stop early when the running sum exceeds the target? (Careful: values may be negative.)`,
  patternChallenge: {
    options: ['Tree BFS — Level Order', 'Tree Paths with Backtracking (push, record copy at leaf, pop)', 'Tree Recursion — Bottom-Up', 'Prefix Sum + Hash Map'],
    answer: 1,
    explanation: 'We must output the actual root-to-leaf paths, so we carry the path down and undo on return — Choose → Explore → Undo on a tree. Prefix sums + hash map count *any* downward paths (Path Sum III) but do not list root-to-leaf paths.',
  },
  hints: [
    '`dfs(node, remaining)`: push `node.val`, subtract it from remaining. If the node is a leaf and remaining is 0, store `[...path]`.',
    'Recurse into both children, then `path.pop()` before returning — every return path must pop exactly once.',
  ],
  approach: `**Naive:** pass a fresh copy of the path into each recursive call (\`[...path, node.val]\`) — correct but O(n · h) copying even for paths that fail.

**Backtracking:** keep one shared \`path\` array.
1. Choose: \`path.push(node.val)\`, \`remaining -= node.val\`.
2. If leaf and \`remaining === 0\` → \`result.push([...path])\` (copy only for real answers).
3. Explore: recurse left and right.
4. Undo: \`path.pop()\`.

No early pruning on "sum too large": values can be negative, so a path that is over the target can come back down.`,

  functionName: 'pathSum',
  paramNames: ['root', 'targetSum'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} targetSum
 * @return {number[][]}
 */
function pathSum(root, targetSum) {
  
}
`,
  io: { params: ['tree', 'any'], returns: 'any' },
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Two root-to-leaf paths sum to 22 — keep searching after the first one.',
      args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], 22], expected: [[5, 4, 11, 2], [5, 8, 4, 5]] },
    { scenario: 'Example 2', hint: 'No root-to-leaf path sums to 5 — return an empty list.',
      args: [[1, 2, 3], 5], expected: [] },
    { scenario: 'Example 3', hint: 'The only leaf path is 1 → 2 = 3, not 0.',
      args: [[1, 2], 0], expected: [] },
    { scenario: 'Empty tree', hint: 'An empty tree has no paths at all — even for targetSum 0 the answer is [].',
      args: [[], 0], expected: [] },
    { scenario: 'Single node matches', hint: 'The root alone is a leaf; its own value is the whole path.',
      args: [[5], 5], expected: [[5]] },
    { scenario: 'Single node no match', hint: 'The root is a leaf but its value is not the target.',
      args: [[5], -5], expected: [] },
    { scenario: 'Stopping at a null child', hint: 'Mistake check: the root 1 has only a left child, so it is not a leaf. Recording at null children wrongly reports [1].',
      args: [[1, 2], 1], expected: [] },
    { scenario: 'Negative path', hint: 'All values negative — the target is negative too.',
      args: [[-2, null, -3], -5], expected: [[-2, -3]] },
    { scenario: 'Over target then back down', hint: 'Mistake check: the running sum exceeds the target (15 > 5) and then a negative value brings it back. Pruning on "sum too big" misses it.',
      args: [[5, 10, null, -10], 5], expected: [[5, 10, -10]] },
    { scenario: 'Mixed signs', hint: 'Only one of several leaves gives the target; negatives appear at different depths.',
      args: [[1, -2, -3, 1, 3, -2, null, -1], -1], expected: [[1, -2, 1, -1]] },
    { scenario: 'Duplicate paths', hint: 'Two different leaves can produce identical value lists — both must be reported.',
      args: [[0, 1, 1], 1], expected: [[0, 1], [0, 1]] },
    { scenario: 'All zeros', hint: 'Every leaf path sums to 0 and they have different lengths. Copy the path when recording, or all answers end up empty.',
      args: [[0, 0, 0, 0, 0], 0], expected: [[0, 0], [0, 0, 0], [0, 0, 0]] },
    { scenario: 'Deep chain (5000 nodes)', hint: 'A 5000-node chain whose only leaf sum is 0 — no path matches target 1. Recursion depth 5000.',
      argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { a.push(i % 2 === 0 ? 1 : -1); if (i > 0) a.push(null); } return [a, 1]; }', expected: [] },
    { scenario: 'Large balanced tree (n = 4095)', hint: 'A perfect tree of 4095 nodes with mixed values; only a few of the 2048 leaf paths match. Copy the path only when a leaf matches.',
      argsGen: '() => [Array.from({ length: 4095 }, (_, i) => ((i * 37 + 11) % 41) - 20), -74]', expected: [[-9, -13, 16, -4, -7, -9, -17, 12, -12, -19, 8, -20], [-9, -17, 12, -12, -19, 8, -20, 2, 9, -18, 10, -20]] },
  ],

  solution: {
    code: `function pathSum(root, targetSum) {
  const result = [];
  const path = [];

  function dfs(node, remaining) {
    if (node === null) return;
    path.push(node.val);                        // choose
    remaining -= node.val;

    if (node.left === null && node.right === null) {
      if (remaining === 0) result.push([...path]); // a real leaf: record a COPY
    } else {
      dfs(node.left, remaining);                // explore
      dfs(node.right, remaining);
    }

    path.pop();                                 // undo — runs on every path out
  }

  dfs(root, targetSum);
  return result;
}`,
  },
  dryRun: {
    columns: ['node', 'path', 'remaining', 'action'],
    rows: [
      ['5', '[5]', '17', 'recurse'],
      ['4', '[5,4]', '13', 'recurse'],
      ['11', '[5,4,11]', '2', 'recurse'],
      ['7', '[5,4,11,7]', '-5', 'leaf, ≠ 0 → pop'],
      ['2', '[5,4,11,2]', '0', 'leaf, = 0 → record; pop'],
      ['8 → 4 → 5', '[5,8,4,5]', '0', 'record'],
      ['8 → 4 → 1', '[5,8,4,1]', '4', 'leaf, ≠ 0'],
    ],
  },
  complexity: { time: 'O(n · h) worst case', space: 'O(h) extra (plus output)', explanation: 'The traversal is O(n); copying a matching path costs O(h), and up to O(n) leaves may match (e.g. all-zero tree with target 0).' },
  alternative: {
    title: 'Copy the path into every call',
    md: '`dfs(node.left, remaining, [...path, node.val])` needs no undo, at the cost of O(h) copying per node.',
    complexity: 'O(n · h) time and allocations',
  },
  mistakes: [
    'Recording at null children instead of at real leaves (counts paths ending at a node with one child).',
    'Returning early after recording without popping.',
    'Pruning when the sum exceeds the target (negative numbers exist).',
    'Pushing `path` instead of `[...path]`.',
  ],
};
