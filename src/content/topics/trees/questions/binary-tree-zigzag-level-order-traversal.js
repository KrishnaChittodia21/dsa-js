export default {
  id: 'binary-tree-zigzag-level-order-traversal',
  title: 'Binary Tree Zigzag Level Order Traversal',
  difficulty: 'Medium',
  order: 3,
  pattern: 'tree-level-order',
  tags: ['tree', 'bfs'],
  source: { platform: 'LeetCode', number: 103, url: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/' },

  statement: `Given the \`root\` of a binary tree, return its level-order traversal in **zigzag** order: the first level left to right, the next level right to left, then left to right again, and so on.`,
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[20,9],[15,7]]' },
    { input: 'root = [1]', output: '[[1]]' },
    { input: 'root = []', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 2000]', '-100 <= Node.val <= 100'],

  think: `- Does the order in which you **visit** nodes need to change, or only the order in which you **write down** each level?
- How can you fill a level's array from the back without reversing afterwards?`,
  patternChallenge: {
    options: ['Tree BFS — Level Order with alternating direction', 'Two stacks only', 'Tree DFS — Postorder', 'Deque-based sliding window'],
    answer: 0,
    explanation: 'It is plain level order; only the order of values inside odd levels flips. (A two-stack solution exists, but it is the same BFS idea with more bookkeeping.)',
  },
  hints: [
    'Keep a boolean `leftToRight` that flips after each level.',
    'Visit nodes in normal BFS order, but place the i-th node at index `i` or `size − 1 − i` depending on the direction.',
  ],
  approach: `Run the usual BFS with a size snapshot. Allocate \`level = new Array(size)\`; the i-th dequeued node goes to \`level[leftToRight ? i : size − 1 − i]\`. Children are always enqueued left then right, so the next level is again read left to right and only its placement flips.

Reversing each odd level with \`level.reverse()\` also works — O(size) per level, still O(n) total.`,

  functionName: 'zigzagLevelOrder',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function zigzagLevelOrder(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: level 2 is read right to left.', args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [20, 9], [15, 7]] },
    { scenario: 'Example 2', hint: 'A single node gives a single level.', args: [[1]], expected: [[1]] },
    { scenario: 'Example 3', hint: 'An empty tree has no levels — return [].', args: [[]], expected: [] },
    { scenario: 'Two nodes, left child', hint: 'Level 2 has one node, so reversing it changes nothing.', args: [[1, 2]], expected: [[1], [2]] },
    { scenario: 'Two nodes, right child', hint: 'A missing left child must simply be skipped.', args: [[1, null, 2]], expected: [[1], [2]] },
    { scenario: 'Perfect tree (7 nodes)', hint: 'Level 2 reversed, level 3 back to left to right.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: [[1], [3, 2], [4, 5, 6, 7]] },
    { scenario: 'Perfect tree (15 nodes)', hint: 'If you change the order you enqueue children to get the zigzag, level 4 comes out scrambled. Keep the queue in normal order and reverse only the output.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], expected: [[1], [3, 2], [4, 5, 6, 7], [15, 14, 13, 12, 11, 10, 9, 8]] },
    { scenario: 'Sparse level 3', hint: 'Level 3 has nodes under different parents with gaps between them.', args: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [3, 2], [4, 5]] },
    { scenario: 'Reversed level of three', hint: 'The fourth level (right to left) has three nodes. Flip the direction once per level, not per node.', args: [[1, 2, 3, 4, 5, 6, 7, 8, null, null, 9, null, null, 10]], expected: [[1], [3, 2], [4, 5, 6, 7], [10, 9, 8]] },
    { scenario: 'Left chain', hint: 'Every level has one node — direction makes no difference here.', args: [[1, 2, null, 3, null, 4, null, 5]], expected: [[1], [2], [3], [4], [5]] },
    { scenario: 'Negative values', hint: 'Values can be negative or zero.', args: [[0, -1, -2, -3, -4, null, -5]], expected: [[0], [-2, -1], [-3, -4, -5]] },
    { scenario: 'All duplicates', hint: 'Equal values are still separate nodes.', args: [[7, 7, 7, 7, 7]], expected: [[7], [7, 7], [7, 7]] },
    { scenario: 'Perfect tree (63 nodes)', hint: 'Six full levels alternating direction; levels 2, 4 and 6 are reversed.', argsGen: '() => [Array.from({ length: 63 }, (_, i) => (i % 201) - 100)]', expected: [[-100], [-98, -99], [-97, -96, -95, -94], [-86, -87, -88, -89, -90, -91, -92, -93], [-85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70], [-38, -39, -40, -41, -42, -43, -44, -45, -46, -47, -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63, -64, -65, -66, -67, -68, -69]] },
    { scenario: 'Large complete tree (n = 2000)', hint: 'Eleven levels with 2000 nodes in total; every second level is reversed. Fill each level by index instead of unshift().', argsGen: '() => [Array.from({ length: 2000 }, (_, i) => i + 1)]', expected: Array.from({ length: 11 }, (_, k) => Array.from({ length: Math.min(2 ** (k + 1) - 1, 2000) - 2 ** k + 1 }, (_, j) => 2 ** k + j)).map((l, k) => (k % 2 ? l.reverse() : l)) },
  ],

  solution: {
    code: `function zigzagLevelOrder(root) {
  const result = [];
  if (root === null) return result;
  const queue = [root];
  let head = 0;
  let leftToRight = true;

  while (head < queue.length) {
    const size = queue.length - head;
    const level = new Array(size);
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      level[leftToRight ? i : size - 1 - i] = node.val;   // place, don't reorder the queue
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
    leftToRight = !leftToRight;
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['level', 'dequeued order', 'direction', 'level array'],
    rows: [
      ['0', '3', '→', '[3]'],
      ['1', '9, 20', '←', '[20, 9]'],
      ['2', '15, 7', '→', '[15, 7]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Standard BFS; each value is written once into its level array.' },
  alternative: {
    title: 'Two stacks',
    md: 'Stack A holds the current level; pop nodes and push their children onto stack B (left then right, or right then left, alternating). Swap stacks after each level. LIFO order produces the zigzag naturally.',
    complexity: 'O(n) time, O(w) space',
  },
  mistakes: [
    'Changing the order in which children are enqueued — that scrambles later levels.',
    'Flipping the direction per node instead of per level.',
    'Using `unshift` to build levels (O(size) per insertion).',
  ],
};
