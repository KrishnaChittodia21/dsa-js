export default {
  id: 'minimum-one-bit-operations-to-make-integers-zero',
  title: 'Minimum One Bit Operations to Make Integers Zero',
  difficulty: 'Hard',
  order: 1,
  pattern: 'bit-gray-code',
  tags: ['dynamic programming', 'bit manipulation', 'memoization'],
  source: { platform: 'LeetCode', number: 1611, url: 'https://leetcode.com/problems/minimum-one-bit-operations-to-make-integers-zero/' },

  statement: `You may change the binary representation of \`n\` using two kinds of moves:

1. Flip bit 0 (the rightmost bit).
2. Flip bit \`i\` (for i ≥ 1) — but only if bit \`i − 1\` is \`1\` **and** bits \`i − 2\` down to \`0\` are all \`0\`.

Return the minimum number of moves needed to turn \`n\` into \`0\`.`,
  examples: [
    { input: 'n = 3', output: '2', explanation: '11 → 01 (rule 2 on bit 1, since bit 0 is 1) → 00 (rule 1).' },
    { input: 'n = 6', output: '4', explanation: '110 → 010 → 011 → 001 → 000.' },
  ],
  constraints: ['0 <= n <= 10^9'],

  think: `- From any state, how many different moves are there? (Hint: rule 2 can apply to at most one bit.)
- Write the sequence of states you get by starting at 0 and applying moves without undoing the last one. Does it look familiar?
- If the states form one long path starting at 0, what is the distance from n to 0?`,
  patternChallenge: {
    options: ['BFS over states', 'Greedy: clear the highest bit first', 'Inverse Gray code (prefix XOR of the bits)', 'Binary trie'],
    answer: 2,
    explanation: 'The two rules are exactly the transitions between consecutive Gray codes, so the answer is n\'s index in the Gray sequence — the inverse Gray code. BFS is correct but the state space is up to 2^30.',
  },
  hints: [
    'Starting from 0 and alternating rule 1, rule 2, rule 1, … produces 0, 1, 3, 2, 6, 7, 5, 4, … = i ^ (i >> 1).',
    'So answer = the i with g(i) = n: i = n ^ (n >> 1) ^ (n >> 2) ^ … .',
  ],
  approach: `**BFS:** each state has at most two neighbours; BFS from n to 0 works for small n but the state space is up to 2^30.

**Recursive insight (without Gray codes):** to clear the top bit k of \`1000…0\` you need \`2^(k+1) − 1\` moves (f(2^k) = 2·f(2^(k−1)) + 1). Then \`f(n) = f(2^k) − f(n without its top bit)\` — a well-known recursion that equals the closed form below.

**Gray code view:** every state has at most two moves (rule 1 always, rule 2 for exactly one bit when n ≠ 0 — the bit left of the lowest 1). So the state graph is a simple path, and walking it from 0 produces the reflected Gray code \`0, 1, 3, 2, 6, 7, 5, 4, …\`. The minimum moves from n to 0 is therefore the **position of n in the Gray sequence**, the inverse Gray code:

\`\`\`js
let ans = 0;
for (; n !== 0; n >>= 1) ans ^= n;   // prefix XOR of all right shifts
\`\`\`

n ≤ 10^9 < 2^30, so 32-bit ops are safe and the answer < 2^30.`,

  functionName: 'minimumOneBitOperations',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function minimumOneBitOperations(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 11 → 01 → 00.',
      args: [3], expected: 2 },
    { scenario: 'Example 2', hint: '110 → 010 → 011 → 001 → 000.',
      args: [6], expected: 4 },
    { scenario: 'Already zero', hint: 'n = 0 needs no operations.',
      args: [0], expected: 0 },
    { scenario: 'n = 1', hint: 'Rule 1 flips bit 0 directly — one move.',
      args: [1], expected: 1 },
    { scenario: 'n = 2', hint: 'Bit 1 can only be cleared after setting bit 0 first: 10 → 11 → 01 → 00.',
      args: [2], expected: 3 },
    { scenario: 'Power of two', hint: 'Clearing 1000 alone costs 2^4 − 1 = 15 moves.',
      args: [8], expected: 15 },
    { scenario: 'All ones (n = 7)', hint: '111 is cheaper than 100: lower bits that are already set help.',
      args: [7], expected: 5 },
    { scenario: 'Greedy top-down costing fails', hint: 'Pricing each set bit independently (15 + 7 = 22 for 1100) overcounts — a lower set bit actually saves moves; the answer is 8.',
      args: [12], expected: 8 },
    { scenario: 'Forward Gray code is wrong', hint: 'n ^ (n >> 1) gives 13 here; the answer is the INVERSE Gray code (XOR of all right shifts) = 14.',
      args: [9], expected: 14 },
    { scenario: 'Mid-sized value', hint: 'A 9-bit number with scattered bits.',
      args: [333], expected: 393 },
    { scenario: 'n = 1000', hint: 'Ten bits — recursion on the top bit or prefix XOR both work.',
      args: [1000], expected: 688 },
    { scenario: '2^29', hint: 'A single high bit: 2^30 − 1 moves. The result exceeds 10^9 but fits in 31 bits.',
      args: [536870912], expected: 1073741823 },
    { scenario: 'Maximum n (10^9)', hint: 'BFS over states would need ~2^30 visited entries. Use the closed form (inverse Gray code) — O(log n).',
      argsGen: '() => [1000000000]', expected: 756249599, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumOneBitOperations(n) {
  let ans = 0;
  for (; n !== 0; n >>= 1) {
    ans ^= n;          // inverse Gray code: XOR of n, n>>1, n>>2, ...
  }
  return ans;
}`,
  },
  dryRun: {
    columns: ['n (bin)', 'ans (bin)'],
    rows: [
      ['110', '110'],
      ['11', '101'],
      ['1', '100 = 4'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'One XOR per bit of n.' },
  alternative: {
    title: 'Top-bit recursion',
    md: 'f(0) = 0; with k = highest bit of n: f(n) = (2^(k+1) − 1) − f(n ^ (1 << k)).',
    code: `function minimumOneBitOperations(n) {
  if (n === 0) return 0;
  const k = 31 - Math.clz32(n);
  return (2 ** (k + 1) - 1) - minimumOneBitOperations(n ^ (1 << k));
}`,
    complexity: 'O(log n) time, O(log n) stack',
  },
  mistakes: [
    'Greedily clearing bits from the top as if each costs a fixed amount — clearing bit k needs lower bits set up first.',
    'Using BFS with a visited array of size 2^30.',
    'Computing g(n) = n ^ (n >> 1) (the forward Gray code) instead of its inverse.',
  ],
};
