// One valid answer (the reflected Gray code); the checker accepts any valid sequence.
const reflectedGray = (n) => Array.from({ length: 1 << n }, (_, i) => i ^ (i >> 1));

export default {
  id: 'gray-code',
  title: 'Gray Code',
  difficulty: 'Medium',
  order: 5,
  pattern: 'bit-gray-code',
  tags: ['math', 'backtracking', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 89, url: 'https://leetcode.com/problems/gray-code/' },

  statement: `An **n-bit Gray code sequence** is a list of all \`2^n\` integers from \`0\` to \`2^n − 1\` such that:

- it starts with \`0\`,
- every integer appears exactly once,
- any two neighbours differ in **exactly one bit**,
- the last and the first element also differ in exactly one bit.

Given \`n\`, return **any** valid n-bit Gray code sequence.`,
  examples: [
    { input: 'n = 2', output: '[0,1,3,2]', explanation: '00, 01, 11, 10 — each step flips one bit, and 10 → 00 flips one bit too. [0,2,3,1] is also valid.' },
    { input: 'n = 1', output: '[0,1]' },
  ],
  constraints: ['1 <= n <= 16'],

  think: `- If you have a valid sequence for n − 1 bits, how can you "mirror" it to get n bits?
- Why is the seam between the original and the mirrored half safe?
- Can you jump straight to the i-th element with a formula?`,
  patternChallenge: {
    options: ['Backtracking over all orders', 'Gray code formula i ^ (i >> 1) / reflect-and-prefix', 'BFS on a hypercube', 'Sorting by popcount'],
    answer: 1,
    explanation: 'The reflected construction (or its closed form i ^ (i >> 1)) builds the sequence directly in O(2^n). Backtracking works for tiny n but explores many dead ends; sorting by popcount does not give one-bit steps.',
  },
  hints: [
    'Gray(n) = Gray(n − 1) followed by Gray(n − 1) reversed with the new top bit set.',
    'Equivalently, element i is i ^ (i >> 1).',
  ],
  approach: `**Backtracking:** DFS from 0, try flipping each bit to an unused value — works, but is a search.

**Reflect-and-prefix:** start with [0]. For each new bit k, append the current list in **reverse** order with bit k set. The seam is fine because the last element before the mirror and the first element after it are the same value except bit k.

**Closed form:** \`g(i) = i ^ (i >> 1)\`. Moving from i to i+1 flips a block of low bits of i (…0111 → …1000); after XOR with the shifted value, exactly one bit of g changes. The wrap-around g(2^n − 1) = 100…0 differs from g(0) = 0 in one bit.

A checker accepts any valid sequence.`,

  functionName: 'grayCode',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number[]}
 */
function grayCode(n) {
  
}
`,
  checker: `(output, args) => {
  const n = args[0];
  const size = 1 << n;
  if (!Array.isArray(output) || output.length !== size || output[0] !== 0) return false;
  const seen = new Set();
  for (const v of output) {
    if (!Number.isInteger(v) || v < 0 || v >= size || seen.has(v)) return false;
    seen.add(v);
  }
  const oneBit = (x) => x > 0 && (x & (x - 1)) === 0;
  for (let i = 0; i < size; i++) if (!oneBit(output[i] ^ output[(i + 1) % size])) return false;
  return true;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 0, 1, 3, 2 — each neighbour (and the last back to the first) differs in exactly one bit.',
      args: [2], expected: [0, 1, 3, 2] },
    { scenario: 'Example 2', hint: 'One bit: the sequence is just 0, 1.',
      args: [1], expected: [0, 1] },
    { scenario: 'Three bits', hint: 'The first real mirror seam: if you append the old list without reversing it, 2 → 4 differs in two bits.',
      args: [3], expected: [0, 1, 3, 2, 6, 7, 5, 4] },
    { scenario: 'Plain counting order fails', hint: 'Returning 0..2^n − 1 in normal order breaks immediately (1 → 2 flips two bits).',
      args: [4], expected: reflectedGray(4) },
    { scenario: 'Wrap-around (n = 5)', hint: 'The last value must also differ from 0 in exactly one bit — a search that ignores the wrap-around can end anywhere.',
      args: [5], expected: reflectedGray(5) },
    { scenario: 'Six bits', hint: '64 values; every value 0..63 appears exactly once.',
      args: [6], expected: reflectedGray(6) },
    { scenario: 'Seven bits', hint: 'Odd number of bits — the reflection must still close the cycle.',
      args: [7], expected: reflectedGray(7) },
    { scenario: 'Eight bits', hint: '256 values; no duplicates and nothing ≥ 2^n.',
      args: [8], expected: reflectedGray(8) },
    { scenario: 'Ten bits', hint: '1024 values — the closed formula i ^ (i >> 1) or reflect-and-prefix both work.',
      args: [10], expected: reflectedGray(10) },
    { scenario: 'Twelve bits', hint: '4096 values — generate directly rather than searching with copies of the list at each step.',
      args: [12], expected: reflectedGray(12) },
    { scenario: 'Fourteen bits', hint: '16384 values; each must be unique and in range.',
      args: [14], expected: reflectedGray(14) },
    { scenario: 'Maximum n (16)', hint: 'The largest allowed input: 65536 values. Generate in O(2^n) — naive backtracking that copies or rescans arrays gets slow here.',
      args: [16], expected: reflectedGray(16) },
  ],

  solution: {
    code: `function grayCode(n) {
  const res = new Array(1 << n);
  for (let i = 0; i < res.length; i++) res[i] = i ^ (i >> 1);
  return res;
}`,
  },
  dryRun: {
    columns: ['i', 'i (bin)', 'i >> 1', 'g = i ^ (i >> 1)'],
    rows: [
      ['0', '000', '000', '000'],
      ['1', '001', '000', '001'],
      ['2', '010', '001', '011'],
      ['3', '011', '001', '010'],
      ['4', '100', '010', '110'],
      ['5', '101', '010', '111'],
      ['6', '110', '011', '101'],
      ['7', '111', '011', '100'],
    ],
  },
  complexity: { time: 'O(2^n)', space: 'O(1) besides the output', explanation: 'One O(1) formula per element; the output itself has 2^n entries.' },
  alternative: {
    title: 'Reflect and prefix',
    md: 'Builds the same sequence without the formula.',
    code: `function grayCode(n) {
  const res = [0];
  for (let k = 0; k < n; k++) {
    const top = 1 << k;
    for (let i = res.length - 1; i >= 0; i--) res.push(res[i] | top);
  }
  return res;
}`,
    complexity: 'O(2^n) time',
  },
  mistakes: [
    'Returning 0..2^n − 1 in normal order (neighbours like 1 → 2 differ in two bits).',
    'Mirroring without reversing — the seam then differs in more than one bit.',
    'Forgetting the wrap-around condition when writing your own search.',
  ],
};
