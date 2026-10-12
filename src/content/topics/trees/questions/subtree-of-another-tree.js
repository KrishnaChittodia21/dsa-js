export default {
  id: 'subtree-of-another-tree',
  title: 'Subtree of Another Tree',
  difficulty: 'Easy',
  order: 7,
  pattern: 'tree-dfs-traversal',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 572, url: 'https://leetcode.com/problems/subtree-of-another-tree/' },

  statement: `Given the roots of two binary trees \`root\` and \`subRoot\`, return \`true\` if \`root\` contains a subtree with **exactly** the same structure and node values as \`subRoot\`.

A subtree of a node consists of that node **and all of its descendants** — you cannot stop part-way down.`,
  examples: [
    { input: 'root = [3,4,5,1,2], subRoot = [4,1,2]', output: 'true' },
    { input: 'root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]', output: 'false', explanation: 'The node 4 in root has an extra descendant 0, so its subtree is not identical.' },
    { input: 'root = [1,1], subRoot = [1]', output: 'true', explanation: 'The leaf 1 matches; the root 1 does not (it has a child).' },
  ],
  constraints: ['1 <= nodes in root <= 2000', '1 <= nodes in subRoot <= 1000', '-10^4 <= Node.val <= 10^4'],

  think: `- You already know how to check whether two trees are **the same** (Same Tree). How can you reuse it?
- Which nodes of \`root\` could be the top of a matching subtree?
- If the values match at the top, is that enough?`,
  patternChallenge: {
    options: ['Level-order BFS only', 'DFS: try "same tree" at every node', 'Binary Search Tree descent', 'Sliding Window over the inorder array'],
    answer: 1,
    explanation: 'A match can start at any node of `root`, so visit every node (DFS) and run the Same Tree check there. It is a direct reuse of an easier problem — a very common interview move.',
  },
  hints: [
    'Write `isSame(a, b)` first (Same Tree).',
    '`isSubtree(root, sub)` = `isSame(root, sub) || isSubtree(root.left, sub) || isSubtree(root.right, sub)`, with `root === null` → false.',
  ],
  approach: `**Reuse Same Tree:** \`isSame(a, b)\` is true when both are null, or both exist with equal values and \`isSame\` holds for both children pairs.

**Try every start:** a match can begin at any node of \`root\`. Recursively: if \`root\` is null → false; if \`isSame(root, subRoot)\` → true; otherwise search the left and right subtrees.

Worst case O(m·n) (m, n = node counts) — e.g. many nodes with the same value that almost match. An O(m + n) alternative serialises both trees with null markers and does a substring search.`,

  functionName: 'isSubtree',
  paramNames: ['root', 'subRoot'],
  io: { params: ['tree', 'tree'] },
  starterCode: `/**
 * Definition: TreeNode { val, left, right }
 * @param {TreeNode} root
 * @param {TreeNode} subRoot
 * @return {boolean}
 */
function isSubtree(root, subRoot) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The subtree rooted at 4 matches exactly.', args: [[3, 4, 5, 1, 2], [4, 1, 2]], expected: true },
    { scenario: 'Example 2', hint: 'Values match at the top but there is an extra descendant (0). A subtree must include ALL descendants — compare until both sides are null.', args: [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], expected: false },
    { scenario: 'Example 3', hint: 'The first node with a matching value (the root) fails; keep searching deeper instead of returning false.', args: [[1, 1], [1]], expected: true },
    { scenario: 'Trees are identical', hint: 'The whole tree counts as a subtree of itself — check the root, not only its children.', args: [[1, 2, 3], [1, 2, 3]], expected: true },
    { scenario: 'Single-node trees, different values', hint: 'Compare values, not just shape.', args: [[1], [2]], expected: false },
    { scenario: 'Match is a deep leaf', hint: 'Recurse all the way down — a leaf is a valid subtree.', args: [[1, 2, 3, 4, 5, 6, 7], [7]], expected: true },
    { scenario: 'Same values, different shape', hint: 'Left child vs right child matters: [2,1] and [2,null,1] are different trees.', args: [[3, 2, 4, 1], [2, null, 1]], expected: false },
    { scenario: 'Partial match is not enough', hint: 'subRoot has a node the candidate lacks — isSame must return false when exactly one side is null.', args: [[1, 2, 3], [2, 4]], expected: false },
    { scenario: 'Repeated values, match on the right', hint: 'Several nodes share the value; only one has the right descendants. Do not stop at the first value match.', args: [[2, 2, 2, 3, null, 2, null, null, null, 3], [2, 3]], expected: true },
    { scenario: 'Negative values', hint: 'Do not use falsy checks like if (!node.val) — 0 and negatives are valid values.', args: [[0, -1, 1, null, -2], [-1, null, -2]], expected: true },
    { scenario: 'Value-sequence trap for string serialisation', hint: 'If you serialise without separators/null markers, "12" can falsely match inside "2". Use markers like ",12,#".', args: [[12], [2]], expected: false },
    { scenario: 'Large skewed tree (2000 nodes)', hint: 'Every node has the same value, so naive matching does lots of work — still fine at this size, but make sure your recursion handles depth 2000.',
      argsGen: "() => { const root = []; root.push(1); for (let i = 1; i < 2000; i++) { root.push(1, null); } root.pop(); const sub = [1]; for (let i = 1; i < 40; i++) sub.push(1, null); sub.pop(); sub.push(null, 2); return [root, sub]; }",
      expected: false, timeLimitMs: 1500 },
  ],

  solution: {
    code: `function isSame(a, b) {
  if (!a || !b) return a === b;          // both null → true, exactly one null → false
  return a.val === b.val && isSame(a.left, b.left) && isSame(a.right, b.right);
}

function isSubtree(root, subRoot) {
  if (!root) return false;
  return isSame(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}`,
  },
  dryRun: {
    columns: ['node in root', 'isSame(node, sub)?', 'next'],
    rows: [
      ['3', '3 ≠ 4 → false', 'search left'],
      ['4', '4=4, 1=1, 2=2, all children null → true', 'return true'],
    ],
  },
  complexity: { time: 'O(m · n) worst case', space: 'O(h)', explanation: 'Up to m start nodes, each comparison up to n nodes; recursion depth is the tree height h.' },
  alternative: {
    title: 'Serialise + substring search',
    md: 'Serialise both trees in preorder with explicit null markers and separators (e.g. `,3,4,#,#,5,#,#`), then check `serial(root).includes(serial(sub))`. With KMP the search is O(m + n). Separators matter: without them `12` contains `2`.',
    complexity: 'O(m + n) with linear-time matching',
  },
  mistakes: [
    'Returning true when only the top values match (ignoring descendants).',
    'Stopping after the first node whose value matches.',
    'Serialising without null markers or separators.',
  ],
};
