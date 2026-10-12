export default {
  id: 'defuse-the-bomb',
  title: 'Defuse the Bomb',
  difficulty: 'Easy',
  order: 4,
  pattern: 'fixed-window',
  tags: ['array', 'circular array', 'sliding window'],
  source: { platform: 'LeetCode', number: 1652, url: 'https://leetcode.com/problems/defuse-the-bomb/' },

  statement: `You are given a **circular** array \`code\` of length \`n\` and an integer \`k\`. Build a new array where every element \`i\` is replaced **at the same time** by:

- if \`k > 0\`: the sum of the **next** \`k\` elements (after index \`i\`, wrapping around),
- if \`k < 0\`: the sum of the **previous** \`|k|\` elements (before index \`i\`, wrapping around),
- if \`k === 0\`: \`0\`.

"Circular" means the element after \`code[n - 1]\` is \`code[0]\`, and the element before \`code[0]\` is \`code[n - 1]\`. Return the decrypted array.`,
  examples: [
    { input: 'code = [5,7,1,4], k = 3', output: '[12,10,16,13]', explanation: 'Index 0: 7+1+4 = 12. Index 1: 1+4+5 = 10. Index 2: 4+5+7 = 16. Index 3: 5+7+1 = 13.' },
    { input: 'code = [1,2,3,4], k = 0', output: '[0,0,0,0]' },
    { input: 'code = [2,4,9,3], k = -2', output: '[12,5,6,13]', explanation: 'Index 0: 3+9 = 12. Index 1: 2+3 = 5. Index 2: 4+2 = 6. Index 3: 9+4 = 13.' },
  ],
  constraints: ['1 <= n <= 100', '1 <= code[i] <= 100', '-(n - 1) <= k <= n - 1'],

  think: `- For \`k > 0\`, which indices are summed for position \`i\`? And for position \`i + 1\`? How many do they share?
- How do you express "wrap around" with indices? What does \`%\` do here?
- Can you describe the \`k < 0\` window with the same code, just a different starting range?`,
  patternChallenge: {
    options: ['Sliding Window — Fixed Size (circular)', 'Two Pointers from both ends', 'Prefix Sum + HashMap', 'Monotonic Stack'],
    answer: 0,
    explanation: 'Every answer is the sum of exactly |k| consecutive elements, and the window for i + 1 is the window for i shifted by one — a fixed-size window. The circular part only changes how we compute indices (`% n`).',
  },
  hints: [
    'Describe the window for index 0 as a range `[start, end]` (inclusive). For k > 0 it is `[1, k]`; for k < 0 it is `[n + k, n - 1]`.',
    'Compute that first window sum. Then for each i: record the sum, subtract `code[start % n]`, add `code[(end + 1) % n]`, and shift both ends by one.',
  ],
  approach: `**Brute force:** for each i, loop |k| times and add up with \`% n\` indices → O(n·|k|). Fine for n ≤ 100, but it recomputes the overlap.

**Optimized (circular fixed window):**
1. If \`k === 0\` return all zeros.
2. Define the window for index 0: \`[start, end] = k > 0 ? [1, k] : [n + k, n - 1]\`.
3. Sum it once.
4. For \`i = 0 … n-1\`: \`result[i] = sum\`; then slide — \`sum -= code[start % n]\`, \`sum += code[(end + 1) % n]\`, \`start++\`, \`end++\`.

Indices only grow, and \`% n\` wraps them around the circle. Both directions of \`k\` use the same loop.`,

  functionName: 'decrypt',
  paramNames: ['code', 'k'],
  starterCode: `/**
 * @param {number[]} code
 * @param {number} k
 * @return {number[]}
 */
function decrypt(code, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Positive k: sum the next 3 values, wrapping from the end back to the start.', args: [[5, 7, 1, 4], 3], expected: [12, 10, 16, 13] },
    { scenario: 'Example 2', hint: 'k = 0: every element becomes 0.', args: [[1, 2, 3, 4], 0], expected: [0, 0, 0, 0] },
    { scenario: 'Example 3', hint: 'Negative k: sum the previous 2 values. `(-1) % n` is -1 in JS, so normalise indices with `(i + n) % n`.', args: [[2, 4, 9, 3], -2], expected: [12, 5, 6, 13] },
    { scenario: 'Single element', hint: 'n = 1 forces k = 0, so the answer is [0].', args: [[7], 0], expected: [0] },
    { scenario: 'Two elements, k = 1', hint: 'Each element is replaced by the other one.', args: [[3, 8], 1], expected: [8, 3] },
    { scenario: 'Two elements, k = -1', hint: 'Previous element of index 0 is the last element (wrap-around).', args: [[3, 8], -1], expected: [8, 3] },
    { scenario: 'Own index excluded', hint: 'With k = n - 1 the window is every element except i itself. Including code[i] adds it once too many.', args: [[1, 2, 3, 4, 5], 4], expected: [14, 13, 12, 11, 10] },
    { scenario: 'k = -(n - 1)', hint: 'The largest negative k: again everything except i itself.', args: [[1, 2, 3, 4, 5], -4], expected: [14, 13, 12, 11, 10] },
    { scenario: 'Use original values', hint: 'All replacements happen at once. Writing results into code while you go makes later sums use new values.', args: [[10, 5, 7, 7, 3, 2, 10, 3, 6, 9, 1, 6], 3], expected: [19, 17, 12, 15, 15, 19, 18, 16, 16, 17, 21, 22] },
    { scenario: 'All equal values', hint: 'Every window sums to k × value.', args: [[100, 100, 100], 2], expected: [200, 200, 200] },
    { scenario: 'Wrap at the start, negative', hint: 'Index 0 and 1 both need values from the end of the array when k < 0.', args: [[5, 1, 2, 9, 4], -3], expected: [15, 18, 10, 8, 12] },
    { scenario: 'Max values, wide window', hint: 'Values of 100 with k = n - 2: sums stay small, but the window wraps for almost every index.', args: [[100, 1, 100, 1, 100, 1], 4], expected: [202, 202, 202, 202, 202, 202] },
  ],

  solution: {
    code: `function decrypt(code, k) {
  const n = code.length;
  const result = new Array(n).fill(0);
  if (k === 0) return result;

  // Window (inclusive) used for index 0; later windows are shifted copies.
  let start = k > 0 ? 1 : n + k;
  let end = k > 0 ? k : n - 1;
  let sum = 0;
  for (let j = start; j <= end; j++) sum += code[j % n];

  for (let i = 0; i < n; i++) {
    result[i] = sum;
    sum -= code[start % n];       // leaves on the left
    end++;
    sum += code[end % n];         // enters on the right
    start++;
  }
  return result;
}`,
    explanation: 'We never let indices go negative: the backward window for index 0 starts at `n + k` (k is negative), so `% n` always receives a non-negative number. In JavaScript `-1 % 4` is `-1`, not `3`, so avoiding negative indices matters.',
  },
  dryRun: {
    columns: ['i', 'window (indices mod n)', 'sum → result[i]', 'slide'],
    rows: [
      ['0', '[1..3] = 7,1,4', '12', '-code[1]=7, +code[0]=5 → 10'],
      ['1', '[2..4] = 1,4,5', '10', '-code[2]=1, +code[1]=7 → 16'],
      ['2', '[3..5] = 4,5,7', '16', '-code[3]=4, +code[2]=1 → 13'],
      ['3', '[4..6] = 5,7,1', '13', 'done'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One initial sum of |k| < n elements plus one O(1) slide per index; the output array is O(n).' },
  alternative: {
    title: 'Doubled array + prefix sums',
    md: 'Concatenate `code` with itself so wrap-around becomes a normal range, build prefix sums over the 2n elements, and read each window sum in O(1). Same O(n) time, more memory — but it is a reusable trick for any circular-range question.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Using negative indices with `%` — in JavaScript `(-1) % n` is `-1`, and `code[-1]` is `undefined`, turning the sum into `NaN`.',
    'Including index `i` itself in its own window.',
    'Modifying `code` in place while computing — every replacement must use the original values.',
  ],
};
