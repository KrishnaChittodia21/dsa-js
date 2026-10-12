export default {
  id: 'minimum-absolute-difference-in-bst',
  title: 'Minimum Absolute Difference in BST',
  difficulty: 'Easy',
  order: 3,
  pattern: 'bst-inorder-sorted',
  tags: ['tree', 'binary search tree', 'inorder'],
  source: { platform: 'LeetCode', number: 530, url: 'https://leetcode.com/problems/minimum-absolute-difference-in-bst/' },

  statement: `Given the \`root\` of a binary search tree with at least two nodes, return the **smallest absolute difference** between the values of **any two different nodes**.`,
  examples: [
    { input: 'root = [4,2,6,1,3]', output: '1', explanation: 'Sorted values 1 2 3 4 6: several neighbours differ by 1.' },
    { input: 'root = [1,0,48,null,null,12,49]', output: '1', explanation: '|48 − 49| = 1 (also |0 − 1|).' },
  ],
  constraints: ['2 <= number of nodes <= 10^4', '0 <= Node.val <= 10^5'],

  think: `- In a **sorted** list, which pairs can possibly be the closest? Do you need to compare every pair?
- Which traversal gives you the BST's values in sorted order?
- Can you do it without storing all values in an array?`,
  patternChallenge: {
    options: ['BST — In-order Traversal = Sorted Order', 'Hash Map (complement lookup)', 'BST — Guided Descent', 'Two heaps'],
    answer: 0,
    explanation: 'The closest pair in a sorted sequence is always an adjacent pair, and in-order gives the sorted sequence. Guided descent finds one value, not a pair; hashing/heaps do not use the ordering we already have.',
  },
  hints: [
    'Brute force compares all pairs: O(n²). Sorting the values would make the closest pair adjacent.',
    'Do an in-order traversal, keep the previously visited value `prev`, and track `min(cur − prev)`.',
  ],
  approach: `**Brute force:** collect all values, compare every pair — O(n²).

**Better:** collect all values and sort — O(n log n) — then check adjacent pairs.

**Optimized:** a BST's in-order traversal is *already* sorted, so no sort is needed. Walk in-order, remember \`prev\`, and update \`best = min(best, node.val − prev)\` at each visit. Why adjacent pairs suffice: for sorted a < b < c, \`c − a = (c − b) + (b − a)\` is at least as large as either neighbour gap.`,

  functionName: 'getMinimumDifference',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number}
 */
function getMinimumDifference(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: several pairs differ by 1.', args: [[4, 2, 6, 1, 3]], expected: 1 },
    { scenario: 'Example 2', hint: 'The closest pair (48, 49) is a parent/child here, but you still need all in-order neighbours.', args: [[1, 0, 48, null, null, 12, 49]], expected: 1 },
    { scenario: 'Two nodes', hint: 'Smallest allowed tree: the answer is their difference.', args: [[1, null, 3]], expected: 2 },
    { scenario: 'Closest pair far apart', hint: '227 and 236 are not parent/child — comparing only a node with its children misses them.', args: [[236, 104, 701, null, 227, null, 911]], expected: 9 },
    { scenario: 'Previous value is 0', hint: '0 is a legal value. `if (prev)` treats 0 as "no previous" and skips the 0→1 gap.', args: [[5, 0, null, null, 1]], expected: 1 },
    { scenario: 'Zero and maximum', hint: 'Only 0 and 10^5: the answer is 10^5.', args: [[0, null, 100000]], expected: 100000 },
    { scenario: 'Closest pair across the root', hint: 'The best pair straddles the root (90 and 100).', args: [[100, 50, 200, null, 90, 150, 300]], expected: 10 },
    { scenario: 'All gaps equal', hint: 'Every adjacent gap is 5; the answer is 5.', args: [[15, 5, 25, 0, 10, 20, 30]], expected: 5 },
    { scenario: 'Left-skewed chain', hint: 'A left chain 40, 30, 20, 10 — in-order still visits them sorted.', args: [[40, 30, null, 20, null, 10]], expected: 10 },
    { scenario: 'Answer deep in a subtree', hint: 'The minimum gap (1) is between two deep nodes, 445 and 446.', args: [[543, 384, 652, null, 445, null, 699, 444, 446]], expected: 1 },
    { scenario: 'Large tree (n = 10^4)', hint: '10^4 nodes with gaps of 7 except one gap of 3 deep inside: an all-pairs check is O(n²).', argsGen: '() => { const a = ((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 7 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(10000); for (let i = a.length - 1; i >= 0; i--) if (a[i] !== null) { a[i] = a[i] - 4; break; } return [a]; }', expected: 3 },
  ],

  solution: {
    code: `function getMinimumDifference(root) {
  let best = Infinity;
  let prev = null;           // previous value in sorted (in-order) order
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; }
    node = stack.pop();
    if (prev !== null) best = Math.min(best, node.val - prev); // sorted → always >= 0
    prev = node.val;
    node = node.right;
  }
  return best;
}`,
    explanation: '`prev !== null` (not `if (prev)`) matters because 0 is a legal value.',
  },
  dryRun: {
    columns: ['visit', 'prev', 'gap', 'best'],
    rows: [['1', '—', '—', '∞'], ['2', '1', '1', '1'], ['3', '2', '1', '1'], ['4', '3', '1', '1'], ['6', '4', '2', '1']],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Every node is visited once; the stack holds at most one root-to-leaf path.' },
  alternative: {
    title: 'In-order into an array',
    md: 'Collect `traversals.inorder(root)` and scan adjacent pairs. Same time, O(n) extra memory.',
    code: `function getMinimumDifference(root) {
  const vals = traversals.inorder(root);
  let best = Infinity;
  for (let i = 1; i < vals.length; i++) best = Math.min(best, vals[i] - vals[i - 1]);
  return best;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Only comparing a node with its children — the closest value may be far away in the tree (e.g. 227 vs 236 above).',
    '`if (prev)` treats a previous value of 0 as "no previous".',
    'Sorting values again even though in-order is already sorted.',
  ],
};
