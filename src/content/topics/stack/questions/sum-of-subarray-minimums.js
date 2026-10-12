export default {
  id: 'sum-of-subarray-minimums',
  title: 'Sum of Subarray Minimums',
  difficulty: 'Medium',
  order: 9,
  pattern: 'monotonic-stack-contribution',
  tags: ['array', 'monotonic stack', 'contribution technique'],
  source: { platform: 'LeetCode', number: 907, url: 'https://leetcode.com/problems/sum-of-subarray-minimums/' },

  statement: `Given an integer array \`arr\`, compute the sum of \`min(sub)\` over **every** contiguous subarray \`sub\` of \`arr\`. Return the result modulo \`10^9 + 7\`.`,
  examples: [
    { input: 'arr = [3,1,2,4]', output: '17', explanation: 'Minimums of the 10 subarrays: 3,1,2,4,1,1,2,1,1,1 → 17.' },
    { input: 'arr = [11,81,94,43,3]', output: '444' },
  ],
  constraints: ['1 <= arr.length <= 3 · 10^4', '1 <= arr[i] <= 3 · 10^4'],

  think: `- There are about n²/2 subarrays. Instead of visiting each, can you ask each **element** how many subarrays it is the minimum of?
- For element i, how far can a subarray extend left and right while arr[i] stays the minimum?
- In [2, 2], which of the two 2s should "own" the subarray [2, 2]?`,
  patternChallenge: {
    options: ['Monotonic stack + contribution counting', 'Prefix sums', 'Sliding window', 'Kadane'],
    answer: 0,
    explanation: 'The total regroups as Σ arr[i] × (number of subarrays where arr[i] is the minimum). That count is left × right, where the boundaries are the previous/next smaller elements — a monotonic stack job. Prefix sums add values, not minimums.',
  },
  hints: [
    'left[i] = i − (index of previous element < arr[i]); right[i] = (index of next element <= arr[i]) − i. Use −1 and n when none exists.',
    'Answer = Σ arr[i] · left[i] · right[i] mod 1e9+7. Strict on one side and non-strict on the other so equal minimums are counted once.',
  ],
  approach: `**Brute force:** for each start, extend and track the running minimum → O(n²) ≈ 4.5·10^8 for n = 3·10^4 (too slow).

**Contribution technique (O(n)):** element i is the minimum of every subarray [l, r] with \`prevLess < l ≤ i ≤ r < nextLessOrEqual\`. That is \`left[i] × right[i]\` subarrays.
- \`prevLess\`: previous index with a **strictly** smaller value (increasing stack, pop while top ≥ current).
- \`nextLessOrEqual\`: next index with a value **≤** current (increasing stack, pop while top > current).
The asymmetric comparison makes each subarray with repeated minimums count toward exactly one of them.

**Overflow:** a single term can reach 3·10^4 · 3·10^4 · 3·10^4 ≈ 2.7·10^13 < 2^53, so plain numbers are safe if you take the modulo after each term.`,

  functionName: 'sumSubarrayMins',
  paramNames: ['arr'],
  starterCode: `/**
 * @param {number[]} arr
 * @return {number}
 */
function sumSubarrayMins(arr) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Ten subarrays with minimums 3,1,2,4,1,1,2,1,1,1 → 17.', args: [[3, 1, 2, 4]], expected: 17 },
    { scenario: 'Example 2', hint: 'Each element contributes value × (choices of left end) × (choices of right end).', args: [[11, 81, 94, 43, 3]], expected: 444 },
    { scenario: 'Single element', hint: 'Smallest input: one subarray, its own minimum.', args: [[5]], expected: 5 },
    { scenario: 'Two equal values', hint: 'Strict comparisons on both sides count [2,2] twice (8 instead of 6) — make one side strict and the other non-strict.', args: [[2, 2]], expected: 6 },
    { scenario: 'All equal', hint: 'Non-strict on both sides counts the shared subarrays zero times; the tie-break must assign each subarray to exactly one element.', args: [[1, 1, 1]], expected: 6 },
    { scenario: 'Increasing', hint: 'Each element is the minimum of every subarray starting at it.', args: [[1, 2, 3]], expected: 10 },
    { scenario: 'Decreasing', hint: 'Each element is the minimum of every subarray ending at it.', args: [[3, 2, 1]], expected: 10 },
    { scenario: 'Duplicate minimum apart', hint: 'Two 55s separated by a larger value — ties must still be counted exactly once.', args: [[71, 55, 82, 55]], expected: 593 },
    { scenario: 'Minimum in the middle', hint: 'The 1 is the minimum of every subarray crossing it.', args: [[4, 6, 1, 7, 5]], expected: 40 },
    { scenario: 'Max values, modulo needed (n = 3·10^4)', hint: 'The true sum (~1.35·10^13) exceeds 10^9 + 7 — reduce modulo as you go.', argsGen: '() => [new Array(30000).fill(30000)]', expected: 449905500, timeLimitMs: 300 },
    { scenario: 'Large increasing (n = 3·10^4)', hint: 'A double loop over all ~4.5·10^8 subarrays is too slow; count each element\'s contribution with monotonic stacks.', argsGen: '() => [Array.from({ length: 30000 }, (_, i) => i + 1)]', expected: 449978500, timeLimitMs: 300 },
    { scenario: 'Large random (n = 3·10^4)', hint: 'Random values with many ties at full size.', argsGen: '() => { let s = 31337; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30000 }, () => 1 + (r() % 30000))]; }', expected: 449913050, timeLimitMs: 300 },
  ],
  solution: {
    code: `function sumSubarrayMins(arr) {
  const MOD = 1_000_000_007;
  const n = arr.length;
  const left = new Array(n);   // choices for the left end
  const right = new Array(n);  // choices for the right end
  const st = [];

  // previous STRICTLY smaller: pop while top >= current
  for (let i = 0; i < n; i++) {
    while (st.length && arr[st[st.length - 1]] >= arr[i]) st.pop();
    left[i] = i - (st.length ? st[st.length - 1] : -1);
    st.push(i);
  }
  st.length = 0;
  // next smaller OR EQUAL: scan from the right, pop while top > current
  for (let i = n - 1; i >= 0; i--) {
    while (st.length && arr[st[st.length - 1]] > arr[i]) st.pop();
    right[i] = (st.length ? st[st.length - 1] : n) - i;
    st.push(i);
  }

  let total = 0;
  for (let i = 0; i < n; i++) {
    total = (total + arr[i] * left[i] * right[i]) % MOD; // term < 2^53, safe
  }
  return total;
}`,
    explanation: 'For equal values: the left pass stops only at a STRICTLY smaller value, so a later copy extends left over earlier equal copies; the right pass stops at the first value that is smaller OR EQUAL. So a subarray whose minimum occurs several times is credited to the rightmost of those copies exactly once. Either convention works, as long as the two sides differ.',
  },
  dryRun: {
    columns: ['i', 'arr[i]', 'left', 'right', 'contribution'],
    rows: [
      ['0', '3', '1', '1', '3'],
      ['1', '1', '2', '3', '6'],
      ['2', '2', '1', '2', '4'],
      ['3', '4', '1', '1', '4'],
      ['sum', '', '', '', '17'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Two monotonic-stack passes and one summation pass.' },
  alternative: {
    title: 'DP on the previous smaller element',
    md: 'Let res[i] = sum of minimums of subarrays ending at i. If p = previous index with arr[p] < arr[i], then res[i] = res[p] + arr[i] · (i − p) (or arr[i] · (i + 1) when no p). Answer = Σ res[i]. One stack pass.',
    code: `function sumSubarrayMins(arr) {
  const MOD = 1_000_000_007, n = arr.length, res = new Array(n), st = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    while (st.length && arr[st[st.length - 1]] >= arr[i]) st.pop();
    const p = st.length ? st[st.length - 1] : -1;
    res[i] = ((p >= 0 ? res[p] : 0) + arr[i] * (i - p)) % MOD;
    total = (total + res[i]) % MOD;
    st.push(i);
  }
  return total;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Using strict comparisons on both sides — [2, 2] counts the subarray [2, 2] twice (gives 8 instead of 6).',
    'Using non-strict on both sides — the shared subarray is counted zero times.',
    'Forgetting the modulo, or multiplying three large numbers before reducing in languages with 32-bit ints.',
  ],
};
