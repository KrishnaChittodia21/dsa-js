export default {
  id: 'contiguous-array',
  title: 'Contiguous Array',
  difficulty: 'Medium',
  order: 2,
  pattern: 'prefix-sum-hashmap',
  tags: ['array', 'hash map', 'prefix sum'],
  source: { platform: 'LeetCode', number: 525, url: 'https://leetcode.com/problems/contiguous-array/' },

  statement: `Given a binary array \`nums\` (only 0s and 1s), return the length of the **longest contiguous subarray** that contains an **equal number of 0s and 1s**.`,
  examples: [
    { input: 'nums = [0,1]', output: '2' },
    { input: 'nums = [0,1,0]', output: '2', explanation: '[0,1] or [1,0].' },
    { input: 'nums = [0,1,1,1,1,1,0,0,0]', output: '6', explanation: '[1,1,1,0,0,0] at indices 3..8.' },
  ],
  constraints: ['1 <= nums.length <= 10^5', 'nums[i] is 0 or 1'],

  think: `- "Equal number of 0s and 1s" — can you turn it into a sum condition by changing how you count the 0s?
- After that change, which prefix-sum equation describes a balanced subarray?
- You want the **longest** one. For each prefix value, which earlier occurrence should you remember?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Prefix Sum + HashMap (first index)', 'Dynamic Programming', 'Two Pointers — Opposite Ends'],
    answer: 1,
    explanation: 'Map 0 → −1: a balanced subarray has sum 0, i.e. two equal prefix sums. For the longest one keep the first index of each prefix. A window fails because "balanced" is not monotonic — growing a balanced window can break it and growing further can fix it again.',
  },
  hints: [
    'Treat 0 as −1. Then a subarray is balanced exactly when its sum is 0, i.e. when the prefix sum at its end equals the prefix sum just before its start.',
    'Store `first.get(prefix)` = the earliest index where that prefix occurred, seeded with `first.set(0, -1)`. When a prefix repeats at i, the candidate length is `i - first.get(prefix)`. Never overwrite a first index.',
  ],
  approach: `**Brute force:** every start, extend and count zeros/ones → O(n²).

**Prefix sum + hash map (O(n)):**
1. Running \`balance\`: +1 for a 1, −1 for a 0.
2. \`balance\` at index j equal to \`balance\` at index i (i < j) ⇔ \`nums[i+1..j]\` is balanced.
3. To maximise \`j − i\`, remember the **first** index for each balance value. Seed \`first.set(0, -1)\`: balance 0 before the array starts, so a balanced prefix \`nums[0..j]\` has length \`j − (−1) = j + 1\`.

Compare with Subarray Sum Equals K: there we **count** subarrays and store counts; here we want the **longest** and store first indices.`,

  functionName: 'findMaxLength',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMaxLength(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The whole two-element array is balanced.', args: [[0, 1]], expected: 2 },
    { scenario: 'Example 2', hint: 'Either [0,1] or [1,0] — length 2.', args: [[0, 1, 0]], expected: 2 },
    { scenario: 'Example 3', hint: 'The longest balanced block starts in the middle of the array.', args: [[0, 1, 1, 1, 1, 1, 0, 0, 0]], expected: 6 },
    { scenario: 'Single element', hint: 'One element can never be balanced — return 0.', args: [[0]], expected: 0 },
    { scenario: 'All ones', hint: 'No 0s at all, so no balanced subarray exists.', args: [[1, 1, 1]], expected: 0 },
    { scenario: 'Two equal elements', hint: 'Two 0s are not balanced.', args: [[0, 0]], expected: 0 },
    { scenario: 'Whole array balanced', hint: 'The balanced prefix starts at index 0 — without the seed 0 → -1 you miss it.', args: [[1, 0, 1, 0, 1, 0]], expected: 6 },
    { scenario: 'Balanced prefix from index 0', hint: 'Needs the seed 0 → -1: the answer is the prefix [0,1,1,0].', args: [[0, 1, 1, 0, 1]], expected: 4 },
    { scenario: 'Zeros counted as -1', hint: 'If 0 counts as 0, "sum 0" means "all zeros" and [0,0,0] looks balanced. Count 0 as -1.', args: [[0, 0, 0, 1]], expected: 2 },
    { scenario: 'Keep earliest balance index', hint: 'Overwriting first[balance] on every repeat finds the shortest window, not the longest.', args: [[0, 0, 1, 0, 0, 0, 1, 1]], expected: 6 },
    { scenario: 'Answer at the end', hint: 'The longest balanced window ends at the last index.', args: [[1, 1, 0, 0, 1]], expected: 4 },
    { scenario: 'Long run then alternating', hint: 'A long block of 1s followed by an alternating tail.', args: [[1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1]], expected: 12 },
    { scenario: 'Large random input (n = 10^5)', hint: 'Checking every subarray is O(n²) ≈ 5·10^9 steps; one pass with the first index of each balance is O(n).', argsGen: '() => { let s = 3; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100000 }, () => r() % 2)]; }', expected: 50496, timeLimitMs: 1000 },
    { scenario: 'Large skewed input (n = 10^5)', hint: 'Balances reach large values here (30000 leading 1s); a Map or an offset array of size 2n+1 handles them in O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i < 30000 ? 1 : i % 2))]', expected: 70000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findMaxLength(nums) {
  const first = new Map([[0, -1]]); // balance -> first index where it occurred
  let balance = 0, best = 0;
  for (let i = 0; i < nums.length; i++) {
    balance += nums[i] === 1 ? 1 : -1;
    if (first.has(balance)) {
      best = Math.max(best, i - first.get(balance)); // (first, i] is balanced
    } else {
      first.set(balance, i);                          // keep only the earliest
    }
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'balance', 'first[balance]', 'best'],
    rows: [
      ['—', '—', '0', '-1', '0'],
      ['0', '0', '-1', 'new → 0', '0'],
      ['1', '1', '0', '-1', '2'],
      ['2', '0', '-1', '0', '2'],
    ],
    note: 'nums = [0,1,0].',
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass; balance values lie in [−n, n], so at most 2n + 1 keys.' },
  alternative: {
    title: 'Array instead of Map',
    md: 'Balance is in [−n, n], so use an array of size 2n + 1 indexed by `balance + n`, filled with a sentinel (e.g. −2). Faster constant factor, same complexity.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Overwriting `first[balance]` on every occurrence — that finds the shortest, not the longest.',
    'Forgetting the seed `0 → -1`, which misses balanced prefixes such as the whole array [0,1].',
    'Counting 0s as 0 instead of −1 — then "sum 0" means "all zeros", not "balanced".',
  ],
};
