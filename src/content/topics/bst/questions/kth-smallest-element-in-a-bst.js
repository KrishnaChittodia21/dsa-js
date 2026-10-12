export default {
  id: 'kth-smallest-element-in-a-bst',
  title: 'Kth Smallest Element in a BST',
  difficulty: 'Medium',
  order: 4,
  pattern: 'bst-inorder-sorted',
  tags: ['tree', 'binary search tree', 'inorder'],
  source: { platform: 'LeetCode', number: 230, url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/' },

  statement: `Given the \`root\` of a binary search tree and an integer \`k\`, return the **k-th smallest** value in the tree (1-indexed: \`k = 1\` is the minimum).`,
  examples: [
    { input: 'root = [3,1,4,null,2], k = 1', output: '1' },
    { input: 'root = [5,3,6,2,4,null,null,1], k = 3', output: '3', explanation: 'Sorted values: 1 2 3 4 5 6.' },
  ],
  constraints: ['1 <= k <= n <= 10^4', '0 <= Node.val <= 10^4'],

  think: `- Which traversal visits a BST's values in increasing order?
- Do you need to finish the traversal once you have seen k values?
- Follow-up: if the tree is modified often and you query often, what extra information per node would let you descend directly?`,
  patternChallenge: {
    options: ['Min-heap of all values', 'BST — Guided Descent', 'BST — In-order Traversal = Sorted Order', 'Quickselect'],
    answer: 2,
    explanation: '"k-th smallest" = the k-th value in sorted order, and in-order gives sorted order directly. A heap or quickselect would ignore the ordering you already have; plain guided descent needs subtree sizes (the follow-up) to know where the k-th value is.',
  },
  hints: [
    'In-order traversal visits values in sorted order — the k-th visited node is the answer.',
    'Use the iterative stack version and return as soon as you pop the k-th node.',
  ],
  approach: `**Brute force:** collect all values, sort, return \`vals[k-1]\` — O(n log n).

**Better:** in-order into an array — already sorted — O(n) time and space.

**Optimized:** iterative in-order with an early stop. Each pop is the next smallest value; decrement \`k\` and return when it hits 0. Cost: O(h) to reach the minimum plus O(k) pops → **O(h + k)** time, O(h) space.

**Follow-up (frequent updates):** store \`size\` of each subtree in the node. At a node, if \`k <= size(left)\` go left; if \`k === size(left) + 1\` it is this node; else go right with \`k -= size(left) + 1\`. O(h) per query.`,

  functionName: 'kthSmallest',
  paramNames: ['root', 'k'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {number} k
 * @return {number}
 */
function kthSmallest(root, k) {
  
}
`,
  io: { params: ['tree', 'any'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'k = 1 is the minimum — the leftmost node.', args: [[3, 1, 4, null, 2], 1], expected: 1 },
    { scenario: 'Example 2', hint: 'Basic case: the third value in sorted (in-order) order.', args: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3 },
    { scenario: 'Single node', hint: 'n = 1, k = 1: the root is the answer.', args: [[1], 1], expected: 1 },
    { scenario: 'k = n (maximum)', hint: 'The largest value is the last one in-order; don\'t stop one step early.', args: [[5, 3, 6, 2, 4, null, null, 1], 6], expected: 6 },
    { scenario: 'k is 1-indexed', hint: 'k = 2 means the second smallest. Treating k as 0-indexed returns the third.', args: [[3, 1, 4, null, 2], 2], expected: 2 },
    { scenario: 'Answer in right subtree', hint: 'The 5th smallest (7) is inside the left subtree\'s right branch.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 5], expected: 7 },
    { scenario: 'Answer deep on the right', hint: 'The 9th smallest is 14, after the root and its right subtree begin.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 9], expected: 14 },
    { scenario: 'Value 0 present', hint: '0 is a legal value — don\'t treat it as "missing".', args: [[2, 1, null, 0], 1], expected: 0 },
    { scenario: 'Left-skewed chain', hint: 'A left chain: the whole spine is pushed before the first value pops.', args: [[15, 14, null, 13, null, 12, null, 11, null, 10, null, 9, null, 8, null, 7, null, 6, null, 5, null, 4, null, 3, null, 2, null, 1], 4], expected: 4 },
    { scenario: 'Right-skewed chain', hint: 'A right chain: each pop leads to the next node on the right.', args: [[1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12, null, 13, null, 14, null, 15], 12], expected: 12 },
    { scenario: 'Large tree, middle k', hint: '10^4 nodes: you can stop after k values instead of collecting the whole in-order.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 5000]', expected: 5000 },
    { scenario: 'Large tree, k = n', hint: '10^4 nodes with k = n: the very last in-order value.', argsGen: '() => [((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000), 10000]', expected: 10000 },
  ],

  solution: {
    code: `function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; } // left spine
    node = stack.pop();          // next smallest value
    if (--k === 0) return node.val;
    node = node.right;
  }
  return -1; // k > n (not possible under the constraints)
}`,
  },
  dryRun: {
    columns: ['pop', 'k after', 'push next'],
    rows: [['1', '2', '—'], ['2', '1', '—'], ['3', '0 → return 3', '—']],
  },
  complexity: { time: 'O(h + k)', space: 'O(h)', explanation: 'Walking to the minimum costs O(h); each of the k pops is amortized O(1). The stack never holds more than one root-to-leaf path.' },
  alternative: {
    title: 'Recursive in-order with a counter',
    code: `function kthSmallest(root, k) {
  let ans = null;
  const dfs = (node) => {
    if (!node || ans !== null) return;
    dfs(node.left);
    if (ans === null && --k === 0) ans = node.val;
    dfs(node.right);
  };
  dfs(root);
  return ans;
}`,
    md: 'Same idea; the `ans !== null` guard stops the traversal early.',
    complexity: 'O(h + k) time, O(h) space',
  },
  mistakes: [
    'Collecting the entire in-order even though you can stop after k values.',
    'Treating k as 0-indexed.',
    'Using a heap and ignoring the BST ordering (works, but misses the point).',
  ],
};
