export default {
  id: 'number-of-digit-one',
  title: 'Number of Digit One',
  difficulty: 'Hard',
  order: 6,
  pattern: 'dp-adv-digit',
  tags: ['math', 'digit dp', 'counting'],
  source: { platform: 'LeetCode', number: 233, url: 'https://leetcode.com/problems/number-of-digit-one/' },

  statement: `Given an integer \`n\`, count how many times the digit **1** is written in total when you write out every integer from \`0\` to \`n\`.`,
  examples: [
    { input: 'n = 13', output: '6', explanation: '1, 10, 11 (two 1s), 12, 13.' },
    { input: 'n = 0', output: '0' },
  ],
  constraints: ['0 <= n <= 10^9'],

  think: `- Looping to 10^9 is too slow. Can you count 1s one decimal place at a time?
- For the tens place, how often does it show a 1 as numbers count upward? What about the last, incomplete cycle?
- Alternatively: build numbers ≤ n digit by digit. When are the remaining digits completely free?`,
  patternChallenge: {
    options: ['Brute force: count digits of every number', 'Digit DP / per-position counting with a "tight" bound', 'Binary search', 'Sliding window over digits'],
    answer: 1,
    explanation: 'n up to 10^9 and a property about digits → digit DP (or its closed form per decimal place). Brute force is 10^9 × 10 steps.',
  },
  hints: [
    'At place value p, split n into high = ⌊n / (10p)⌋, cur = ⌊n / p⌋ % 10, low = n % p. Full cycles contribute high · p ones.',
    'The partial cycle adds p if cur > 1, low + 1 if cur === 1, and 0 if cur === 0.',
  ],
  approach: `**Brute force:** for x in 0..n count its 1s → O(n log n). Too slow for 10^9.

**Per-position counting (O(log n)):** at place p (1, 10, 100, …) the digit cycles 0→9 every 10p numbers and shows "1" for p consecutive numbers per cycle.
- \`high · p\` from complete cycles.
- Partial cycle: \`cur > 1\` → the whole block of p ones has passed (+p); \`cur === 1\` → only \`low + 1\` of them (+low+1); \`cur === 0\` → none.

**Digit DP (general tool):** \`go(pos, tight, ones)\` over the digits of n; if tight the next digit is capped at n's digit, otherwise 0–9; memoize non-tight states. Same answer, and the same skeleton solves "count numbers ≤ n with property P".`,

  functionName: 'countDigitOne',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function countDigitOne(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: 1, 10, 11 (two), 12, 13 → 6.', args: [13], expected: 6 },
    { scenario: 'Example 2', hint: 'n = 0: nothing is written with a 1.', args: [0], expected: 0 },
    { scenario: 'n = 1', hint: 'Just the number 1.', args: [1], expected: 1 },
    { scenario: 'Single digit, no tens', hint: 'n = 9: only "1" contains a one.', args: [9], expected: 1 },
    { scenario: 'Current digit is 1', hint: 'n = 10: when the current digit is 1, add low + 1, not a full power of ten.', args: [10], expected: 2 },
    { scenario: 'All nines', hint: 'n = 99: every place contributes a full 10 — 20 in total.', args: [99], expected: 20 },
    { scenario: 'Power of ten', hint: 'n = 100 adds exactly one more 1 than 99.', args: [100], expected: 21 },
    { scenario: 'All ones', hint: 'n = 111: each place hits the cur === 1 case. Adding p instead of low + 1 overcounts.', args: [111], expected: 36 },
    { scenario: 'Digit 0 in the middle', hint: 'n = 1050: a 0 digit contributes only high · p for its place.', args: [1050], expected: 366 },
    { scenario: 'Medium n = 200 000', hint: 'Still fine for a loop, but the per-digit formula is O(log n).', args: [200000], expected: 200000 },
    { scenario: 'Large n = 824 883 294', hint: 'Looping over every number up to ~8·10^8 is far too slow; count each decimal place with a formula.', args: [824883294], expected: 767944060, timeLimitMs: 500 },
    { scenario: 'Maximum n = 10^9', hint: 'n = 10^9 has ten digits: the place loop must reach p = 10^9. Prefer Math.floor over bitwise tricks, which wrap at 32 bits.', args: [1000000000], expected: 900000001, timeLimitMs: 500 },
    { scenario: 'Nine nines', hint: 'n = 999 999 999: every place contributes 10^8 ones — 9·10^8 total.', args: [999999999], expected: 900000000 },
  ],

  solution: {
    code: `function countDigitOne(n) {
  let count = 0;
  for (let p = 1; p <= n; p *= 10) {         // place value: 1, 10, 100, ...
    const high = Math.floor(n / (p * 10));   // digits left of this place
    const cur = Math.floor(n / p) % 10;      // digit at this place
    const low = n % p;                       // digits right of this place
    count += high * p;                       // complete 0..9 cycles
    if (cur > 1) count += p;                 // the whole "1" block of the last cycle
    else if (cur === 1) count += low + 1;    // only part of it
  }
  return count;
}`,
    explanation: 'Math.floor instead of `| 0`: for n near 10^9, p * 10 reaches 10^10, beyond 32-bit range.',
  },
  dryRun: {
    columns: ['p', 'high', 'cur', 'low', 'added', 'total'],
    rows: [['1', '1', '3', '0', '1·1 + 1 = 2', '2'], ['10', '0', '1', '3', '0 + (3 + 1) = 4', '6']],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'One iteration per decimal digit (≤ 10).' },
  alternative: {
    title: 'Digit DP with a tight flag',
    md: 'Walk the digits of n from the left; memoize only non-tight states (pos, onesSoFar).',
    code: `function countDigitOne(n) {
  const digits = String(n).split('').map(Number);
  const L = digits.length;
  const memo = new Map();
  function go(pos, tight, ones) {
    if (pos === L) return ones;
    const key = pos + ',' + ones;
    if (!tight && memo.has(key)) return memo.get(key);
    const limit = tight ? digits[pos] : 9;
    let total = 0;
    for (let d = 0; d <= limit; d++) total += go(pos + 1, tight && d === limit, ones + (d === 1 ? 1 : 0));
    if (!tight) memo.set(key, total);
    return total;
  }
  return go(0, true, 0);
}`,
    complexity: 'O(L² · 10) time, O(L²) space (L ≤ 10 digits)',
  },
  mistakes: [
    'Adding p when cur === 1 (should be low + 1).',
    'Using bitwise ops that overflow 32 bits for large n.',
    'Memoizing tight states together with free states under the same key.',
  ],
};
