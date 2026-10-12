export default {
  id: 'array-of-doubled-pairs',
  title: 'Array of Doubled Pairs',
  difficulty: 'Medium',
  order: 5,
  pattern: 'sorting-preprocess',
  tags: ['array', 'hash map', 'sorting', 'greedy'],
  source: { platform: 'LeetCode', number: 954, url: 'https://leetcode.com/problems/array-of-doubled-pairs/' },

  statement: `You are given an integer array \`arr\` of **even** length. Decide whether it can be reordered into pairs so that in every pair one number is **exactly twice** the other — formally, whether a reordering exists with \`arr[2i + 1] = 2 · arr[2i]\` for every i.

Return \`true\` or \`false\`.`,
  examples: [
    { input: 'arr = [3,1,3,6]', output: 'false' },
    { input: 'arr = [2,1,2,6]', output: 'false' },
    { input: 'arr = [4,-2,2,-4]', output: 'true', explanation: 'Pairs (-2, -4) and (2, 4).' },
  ],
  constraints: ['2 <= arr.length <= 3 * 10^4', 'arr.length is even', '-10^5 <= arr[i] <= 10^5'],

  think: `- Which element's partner is **forced**? Think about the element with the smallest absolute value.
- Why does plain ascending order break for negative numbers?
- How do you handle duplicates and zeros?`,
  patternChallenge: {
    options: ['Sort by absolute value, then greedy pairing with a count map', 'Two Pointers from both ends', 'Backtracking over all pairings', 'Prefix Sum'],
    answer: 0,
    explanation: 'Once sorted by |x|, the smallest remaining element cannot be anyone\'s double, so it must pair with 2x — a forced (safe) greedy choice. Backtracking would be exponential; two pointers from the ends do not match "double" relations.',
  },
  hints: [
    'Count every value in a Map. Process distinct values in increasing order of absolute value.',
    'For value x with remaining count c: you need c copies of 2x. If fewer remain, return false; otherwise subtract c from count[2x]. Zeros pair with zeros, so their count must be even.',
  ],
  approach: `**Brute force:** try all ways to pair elements (backtracking) — exponential.

**Sort + greedy:**
- Sort distinct values by absolute value.
- Claim: the remaining value x with the smallest |x| must be the *smaller* member (the "half") of its pair — its half, x/2, would have a smaller absolute value, and all of those are already used.
- So pair all remaining copies of x with copies of 2x. If there are not enough, it is impossible.
- Zero is its own double: \`count[0]\` must be even.

This forced-choice argument is what makes the greedy correct.`,

  functionName: 'canReorderDoubled',
  paramNames: ['arr'],
  starterCode: `/**
 * @param {number[]} arr
 * @return {boolean}
 */
function canReorderDoubled(arr) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: 1 needs a 2 and nothing can pair with 1 or 6 correctly.', args: [[3,1,3,6]], expected: false },
    { scenario: 'Example 2', hint: 'From the statement: 1 pairs with one 2, but the other 2 has no 4 (and 6 has no 3) — counts matter, not just values.', args: [[2,1,2,6]], expected: false },
    { scenario: 'Example 3', hint: 'From the statement: negatives pair with negatives (−2 with −4), positives with positives.', args: [[4,-2,2,-4]], expected: true },
    { scenario: 'Two elements forming a pair', hint: 'The smallest allowed input: one pair (1, 2).', args: [[2,1]], expected: true },
    { scenario: 'Two elements, no pair', hint: 'Neither number is double the other, so the answer is false.', args: [[3,5]], expected: false },
    { scenario: 'Opposite signs never pair', hint: 'Doubling keeps the sign: −1 needs −2, so −1 and 2 cannot form a pair.', args: [[-1,2]], expected: false },
    { scenario: 'Pair of zeros', hint: 'Zero is its own double, so two zeros form a valid pair.', args: [[0,0]], expected: true },
    { scenario: 'Odd number of zeros', hint: 'Forgetting the special case 0: zeros can only pair with each other, so an odd count of zeros is impossible.', args: [[0,0,0,1]], expected: false },
    { scenario: 'Negatives only', hint: 'Sorting ascending instead of by |x|: −8 comes first and looks for −16, but −8 is the double of −4. Process by absolute value.', args: [[-4,-8,-2,-1]], expected: true },
    { scenario: 'Not enough copies of the double', hint: 'Checking only that 2x exists is not enough: two 1s need two 2s, but there is only one.', args: [[1,1,2,4]], expected: false },
    { scenario: 'Chain of doubles with repeats', hint: '4 is both the double of 2 and the half of 8 — use counts so each copy is used exactly once.', args: [[2,4,4,8,8,16]], expected: true },
    { scenario: 'Mixed signs with duplicates', hint: 'Positives and negatives form independent chains; repeated values must each find their own partner.', args: [[1,2,1,-8,8,-4,4,-4,2,-2]], expected: true },
    { scenario: 'Values at the bounds', hint: '±10^5 are the doubles of ±50000 — make sure large magnitudes are handled like any other value.', args: [[100000,50000,-100000,-50000]], expected: true },
    { scenario: 'Large input (n = 3·10^4)', hint: 'Searching and removing partners with indexOf/splice is O(n²). Count values in a Map and walk keys sorted by |x|.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); const a = []; for (let i = 0; i < 15000; i++) { const x = (r() % 50000) + 1; const v = i % 2 ? -x : x; a.push(v, 2 * v); } for (let i = a.length - 1; i > 0; i--) { const j = r() % (i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return [a]; }', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canReorderDoubled(arr) {
  const count = new Map();
  for (const x of arr) count.set(x, (count.get(x) ?? 0) + 1);

  const keys = [...count.keys()].sort((a, b) => Math.abs(a) - Math.abs(b));
  for (const x of keys) {
    const c = count.get(x);
    if (c === 0) continue;                 // all copies already used as doubles
    if (x === 0) {
      if (c % 2 !== 0) return false;       // zeros pair with zeros
      continue;
    }
    const doubles = count.get(2 * x) ?? 0;
    if (doubles < c) return false;         // x's partner is forced to be 2x
    count.set(2 * x, doubles - c);
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['x (by |x|)', 'count[x]', 'count[2x] before', 'action'],
    rows: [
      ['-2', '1', 'count[-4] = 1', 'pair → count[-4] = 0'],
      ['2', '1', 'count[4] = 1', 'pair → count[4] = 0'],
      ['-4', '0', '—', 'skip (used)'],
      ['4', '0', '—', 'skip (used)'],
      ['done', '', '', 'true'],
    ],
  },
  complexity: { time: 'O(n + k log k)', space: 'O(k)', explanation: 'k = number of distinct values ≤ n. Counting is O(n); sorting the distinct keys is O(k log k).' },
  alternative: {
    title: 'Counting array with offset',
    md: 'Values lie in [−10⁵, 10⁵]; a counting array indexed by value + 10⁵ replaces the Map, and iterating by absolute value means walking 0, then ±1, ±2, … Linear in n + range.',
    complexity: 'O(n + R) time, O(R) space, R = 2·10⁵ + 1',
  },
  mistakes: [
    'Sorting ascending instead of by |x|: for negatives the double is the smaller number (−4 = 2·−2).',
    'Forgetting the special case 0 (its double is itself).',
    'Checking only existence of 2x instead of having enough copies of it.',
  ],
};
