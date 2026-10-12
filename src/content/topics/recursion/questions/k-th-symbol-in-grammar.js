export default {
  id: 'k-th-symbol-in-grammar',
  title: 'K-th Symbol in Grammar',
  difficulty: 'Medium',
  order: 3,
  pattern: 'recursion-halving',
  tags: ['recursion', 'math', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 779, url: 'https://leetcode.com/problems/k-th-symbol-in-grammar/' },

  statement: `Build a table of rows. Row 1 is \`0\`. To make each next row, look at the previous row and replace every \`0\` with \`01\` and every \`1\` with \`10\`.

\`\`\`text
row 1: 0
row 2: 01
row 3: 0110
row 4: 01101001
\`\`\`

Given \`n\` and \`k\` (1-indexed), return the \`k\`-th symbol of row \`n\`.`,
  examples: [
    { input: 'n = 1, k = 1', output: '0' },
    { input: 'n = 2, k = 1', output: '0' },
    { input: 'n = 2, k = 2', output: '1', explanation: 'Row 2 is 01.' },
  ],
  constraints: ['1 <= n <= 30', '1 <= k <= 2^(n - 1)'],

  think: `- Row 30 has 2^29 symbols. Can you avoid building it?
- Every symbol in row n − 1 creates two symbols in row n. Which symbol of row n − 1 is the "parent" of position k?
- Is position k the first or the second child, and how does that change the value?`,
  patternChallenge: {
    options: ['Build every row as a string', 'Two Pointers', 'Recursion — follow the parent at ⌈k/2⌉ (halving)', 'Game recursion (minimax)'],
    answer: 2,
    explanation: 'Row n is a binary tree level: position k has parent ⌈k/2⌉ in row n − 1. The left child copies the parent and the right child flips it. Recursing on (n − 1, ⌈k/2⌉) follows a single root-to-leaf path: O(n).',
  },
  hints: [
    'Parent of position k is `Math.ceil(k / 2)` in row n − 1. Base case: n = 1 → 0.',
    'If k is odd (left child), the symbol equals the parent; if k is even (right child), it is `1 - parent`.',
  ],
  approach: `**Brute force:** generate the rows as strings. Row n has 2^(n−1) characters — ~537 million for n = 30. Too much memory and time.

**Recursion:** think of the rows as levels of a binary tree. \`0\` has children \`0, 1\`; \`1\` has children \`1, 0\`. So a left child always equals its parent and a right child is the opposite. Position k is the left child when k is odd. Recurse on \`(n − 1, ⌈k/2⌉)\`, then flip if k is even. Depth n ≤ 30.

**Bit insight (alternative):** the answer is the parity of the number of 1-bits in \`k − 1\` — each 1-bit is one "right turn" (flip) on the path from the root.`,

  functionName: 'kthGrammar',
  paramNames: ['n', 'k'],
  starterCode: `/**
 * @param {number} n
 * @param {number} k
 * @return {number}
 */
function kthGrammar(n, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Row 1 is just "0".', args: [1,1], expected: 0 },
    { scenario: 'Example 2', hint: 'Row 2 is "01"; the first child copies its parent.', args: [2,1], expected: 0 },
    { scenario: 'Example 3', hint: 'The second child flips its parent — if you get 0 here the flip direction is backwards.', args: [2,2], expected: 1 },
    { scenario: 'Odd k needs ceil', hint: 'The parent of position 3 is ⌈3/2⌉ = 2. Using k / 2 without rounding up gives 1.5.', args: [3,3], expected: 1 },
    { scenario: 'Row 4, middle', hint: 'Row 4 is "01101001"; position 5 is 1.', args: [4,5], expected: 1 },
    { scenario: 'Last position of a row', hint: 'k = 2^(n−1) — the very end of the row.', args: [4,8], expected: 1 },
    { scenario: 'Row 4, even k', hint: 'Position 6 is the right child of a 1, so it flips to 0.', args: [4,6], expected: 0 },
    { scenario: 'Row 10, last position', hint: 'k = 512: nine flips along the right edge of the tree.', args: [10,512], expected: 1 },
    { scenario: 'Row 16, middle', hint: 'Row 16 has 32768 symbols; walk up the parents instead of building it.', args: [16,21846], expected: 0 },
    { scenario: 'Maximum n, first position', hint: 'Position 1 is always 0 — the leftmost path never flips.', args: [30,1], expected: 0, timeLimitMs: 1000 },
    { scenario: 'Maximum n, last position', hint: 'Building row 30 needs 2^29 characters — far too much memory. Recurse on the parent instead.', args: [30,536870912], expected: 1 },
    { scenario: 'Maximum n, arbitrary k', hint: 'A large k in the deepest row: only n = 30 recursive steps are needed.', args: [30,434991989], expected: 0 },
  ],

  solution: {
    code: `function kthGrammar(n, k) {
  if (n === 1) return 0;                       // row 1 is "0"
  const parent = kthGrammar(n - 1, Math.ceil(k / 2));
  // odd k = left child (copy parent), even k = right child (flip parent)
  return k % 2 === 1 ? parent : 1 - parent;
}`,
  },
  dryRun: {
    columns: ['call', 'n', 'k', 'child side', 'returns'],
    rows: [
      ['1', '4', '5', 'odd → left (copy)', 'parent = 1 → 1'],
      ['2', '3', '3', 'odd → left (copy)', 'parent = 1 → 1'],
      ['3', '2', '2', 'even → right (flip)', 'parent = 0 → 1'],
      ['4', '1', '1', 'base case', '0'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One recursive call per row, n ≤ 30 calls and frames.' },
  alternative: {
    title: 'Popcount parity',
    md: 'Write k − 1 in binary. Walking from the root, each 1-bit means "go to the right child" = one flip. The symbol is 1 iff the number of flips is odd.',
    code: `function kthGrammar(n, k) {
  let x = k - 1, flips = 0;
  while (x > 0) { flips += x & 1; x >>= 1; }
  return flips % 2;
}`,
    complexity: 'O(log k) time, O(1) space',
  },
  mistakes: [
    'Building the full row string — exponential memory.',
    'Using `k / 2` without rounding up for the parent (1-based positions need `Math.ceil`).',
    'Getting the flip direction backwards — check with row 2 = "01": k = 2 must be 1.',
  ],
};
