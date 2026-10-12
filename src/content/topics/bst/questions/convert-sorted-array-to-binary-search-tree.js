export default {
  id: 'convert-sorted-array-to-binary-search-tree',
  title: 'Convert Sorted Array to Binary Search Tree',
  difficulty: 'Easy',
  order: 4,
  pattern: 'bst-build-balanced',
  tags: ['tree', 'binary search tree', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 108, url: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/' },

  statement: `You are given an integer array \`nums\` sorted in **strictly increasing** order. Build a **height-balanced** binary search tree containing exactly these values and return its root.

*Height-balanced* means that for every node, the heights of its left and right subtrees differ by at most 1. Any valid answer is accepted.`,
  examples: [
    { input: 'nums = [-10,-3,0,5,9]', output: '[0,-10,5,null,-3,null,9]', explanation: '[0,-3,9,-10,null,5] is also accepted.' },
    { input: 'nums = [1,3]', output: '[1,null,3]', explanation: '[3,1] is also accepted.' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^4 <= nums[i] <= 10^4', 'nums is sorted in strictly increasing order'],

  think: `- Which element should be the root so that the two sides have (almost) the same number of nodes?
- Once you pick the root, what are the left and right subtrees built from?
- Why would inserting the values one by one, in order, be a disaster?`,
  patternChallenge: {
    options: ['BST — Guided Descent (insert each value)', 'Binary Search on the answer', 'Greedy', 'BST — Build Balanced from Sorted Data'],
    answer: 3,
    explanation: 'Sorted input + "height-balanced" → choose the middle as the root and recurse on both halves. Inserting in order builds a chain (height n); binary search on the answer and greedy do not construct trees.',
  },
  hints: [
    'The middle element splits the array into two halves of equal (or off-by-one) size.',
    'Write `build(lo, hi)`: if `lo > hi` return null; otherwise make `nums[mid]` the root, `left = build(lo, mid - 1)`, `right = build(mid + 1, hi)`.',
  ],
  approach: `**Naïve:** insert the values into an empty BST one by one. Because they are sorted, each goes to the right of the previous → a chain of height n − 1. Valid BST, **not** balanced.

**Optimized (divide and conquer):** the middle element has ⌊n/2⌋ elements on one side and ⌈n/2⌉ − 1 on the other. Make it the root, recursively build the left half and the right half. Sizes of sibling subtrees differ by at most 1 at every node, so heights differ by at most 1. Pass indices, not slices, to keep it O(n).`,

  functionName: 'sortedArrayToBST',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {TreeNode}
 */
function sortedArrayToBST(nums) {
  
}
`,
  io: { params: ['any'], returns: 'tree' },
  checker: `(output, args, expected, h) => {
  const root = h.arrayToTree(output);
  // 1. same values in the same (sorted) order → it is a BST with exactly these values
  if (JSON.stringify(h.traversals.inorder(root)) !== JSON.stringify(args[0])) return false;
  // 2. height-balanced at every node
  const height = (n) => {
    if (!n) return 0;
    const l = height(n.left), r = height(n.right);
    if (l < 0 || r < 0 || Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  };
  return height(root) >= 0;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: the middle value 0 becomes the root (other balanced shapes are also accepted).', args: [[-10, -3, 0, 5, 9]], expected: [0, -10, 5, null, -3, null, 9] },
    { scenario: 'Example 2', hint: 'Two values: either can be the root.', args: [[1, 3]], expected: [1, null, 3] },
    { scenario: 'Single element', hint: 'n = 1: a single node. Your base case must stop at lo > hi.', args: [[0]], expected: [0] },
    { scenario: 'Three elements', hint: 'The middle is the root, one child on each side. Inserting in order would build a chain.', args: [[1, 2, 3]], expected: [2, 1, 3] },
    { scenario: 'Four elements', hint: 'Even length: pick either middle, but stay consistent so sides differ by at most one.', args: [[1, 2, 3, 4]], expected: [2, 1, 3, null, null, null, 4] },
    { scenario: 'Perfect tree (n = 7)', hint: 'Seven values give a perfect tree of height 3.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: [4, 2, 6, 1, 3, 5, 7] },
    { scenario: 'Negative values', hint: 'Negatives sort like any other numbers.', args: [[-5, -4, -3, -2, -1, 0, 1, 2]], expected: [-2, -4, 0, -5, -3, -1, 1, null, null, null, null, null, null, null, 2] },
    { scenario: 'Extreme values', hint: 'Values at -10^4 and 10^4.', args: [[-10000, 0, 10000]], expected: [0, -10000, 10000] },
    { scenario: 'Twenty values', hint: 'Off-by-one recursion bounds (build(lo, mid)) either loop forever or duplicate values.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]], expected: [10, 5, 15, 2, 7, 12, 18, 1, 3, 6, 8, 11, 13, 16, 19, null, null, null, 4, null, null, null, 9, null, null, null, 14, null, 17, null, 20] },
    { scenario: 'Non-consecutive values', hint: 'Values with gaps — the shape depends only on positions, not values.', args: [[-9, -3, 1, 4, 10, 27, 50, 81, 100]], expected: [10, -3, 50, -9, 1, 27, 81, null, null, null, 4, null, null, null, 100] },
    { scenario: 'Large input (n = 10^4)', hint: '10^4 values: chain-building insertion is unbalanced; pass indices, not slices.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 10000)]', expectedGen: "() => { const [nums] = (() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 10000)])(); const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(nums[m], b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(0, nums.length - 1)); }" },
  ],

  solution: {
    code: `function sortedArrayToBST(nums) {
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;           // middle → halves differ by at most 1
    return new TreeNode(nums[mid], build(lo, mid - 1), build(mid + 1, hi));
  };
  return build(0, nums.length - 1);
}`,
  },
  dryRun: {
    columns: ['call (lo, hi)', 'mid', 'root value', 'left call', 'right call'],
    rows: [
      ['(0, 4)', '2', '0', '(0, 1)', '(3, 4)'],
      ['(0, 1)', '0', '-10', '(0, -1) → null', '(1, 1)'],
      ['(1, 1)', '1', '-3', 'null', 'null'],
      ['(3, 4)', '3', '5', 'null', '(4, 4) → 9'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(log n)', explanation: 'Each element becomes exactly one node. The recursion depth equals the tree height, ⌈log₂(n+1)⌉ (the output tree itself is O(n) but is not counted as extra space).' },
  alternative: {
    title: 'Slicing the array',
    md: '`root.left = sortedArrayToBST(nums.slice(0, mid))` is shorter but copies arrays at every level: O(n log n) time and memory.',
    complexity: 'O(n log n) time',
  },
  mistakes: [
    'Inserting values in order — builds a chain, not a balanced tree.',
    'Using `nums.slice` at each level (hidden O(n log n)).',
    'Off-by-one in the recursion bounds (`build(lo, mid)` recurses forever when lo === mid).',
  ],
};
