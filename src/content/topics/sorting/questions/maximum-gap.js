export default {
  id: 'maximum-gap',
  title: 'Maximum Gap',
  difficulty: 'Hard',
  order: 2,
  pattern: 'sorting-counting-bucket',
  tags: ['array', 'bucket sort', 'pigeonhole', 'radix sort'],
  source: { platform: 'LeetCode', number: 164, url: 'https://leetcode.com/problems/maximum-gap/' },

  statement: `Given an integer array \`nums\`, return the **largest difference between two neighbours in the sorted version** of the array. If the array has fewer than two elements, return \`0\`.

You must write an algorithm that runs in **linear time** and uses linear extra space. (Rated Medium on LeetCode; it is here as a Hard because of the pigeonhole argument.)`,
  examples: [
    { input: 'nums = [3,6,9,1]', output: '3', explanation: 'Sorted: [1,3,6,9]; the gaps are 2, 3, 3.' },
    { input: 'nums = [10]', output: '0' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9'],

  think: `- Sorting then scanning is O(n log n). What stops counting sort here?
- With n numbers between min and max, what is the **smallest** the maximum gap could possibly be?
- If buckets are narrower than that, can the maximum gap lie *inside* a bucket?`,
  patternChallenge: {
    options: ['Sort then scan neighbours', 'Bucket sort with the pigeonhole principle', 'Binary search on the gap', 'Monotonic stack'],
    answer: 1,
    explanation: 'The linear-time requirement rules out comparison sorting; values up to 10⁹ rule out plain counting sort. Buckets of width ≈ (max − min)/(n − 1) guarantee the answer lies between buckets, so only each bucket\'s min and max matter.',
  },
  hints: [
    'The n − 1 gaps add up to max − min, so the largest gap is at least (max − min) / (n − 1). Use buckets of width `w = max(1, floor((max − min) / (n − 1)))`.',
    'A gap inside a bucket is at most w − 1 < answer, so ignore it. Record only each bucket\'s min and max; the answer is the largest `min of a non-empty bucket − max of the previous non-empty bucket`.',
  ],
  approach: `**Simple:** sort numerically and take the largest neighbour difference — O(n log n). Correct, but not linear.

**Bucket sort + pigeonhole (linear):**
1. Find \`lo = min\`, \`hi = max\` (loops, not \`Math.min(...nums)\` — 10⁵ arguments may overflow the stack). If \`lo === hi\` return 0.
2. Bucket width \`w = max(1, floor((hi − lo) / (n − 1)))\`, bucket of x = \`floor((x − lo) / w)\`.
3. Keep only \`min\` and \`max\` per bucket.
4. The maximum gap is ≥ ceil((hi − lo)/(n − 1)) ≥ w, but two numbers in the same bucket differ by at most w − 1. So the answer is between consecutive non-empty buckets: \`bucketMin[b] − previousMax\`.

**Radix sort** (O(d · n)) followed by a scan is the other linear option.`,

  functionName: 'maximumGap',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maximumGap(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: sorted [1,3,6,9] has largest gap 3.', args: [[3,6,9,1]], expected: 3 },
    { scenario: 'Example 2', hint: 'Fewer than two elements → 0.', args: [[10]], expected: 0 },
    { scenario: 'Two elements', hint: 'The only gap is between the two values.', args: [[1,10000000]], expected: 9999999 },
    { scenario: 'All equal', hint: 'min === max, so every gap is 0 (and a bucket width would be 0 — guard it).', args: [[1,1,1,1]], expected: 0 },
    { scenario: 'Range smaller than n', hint: 'Width 0 when (hi − lo) < n − 1: clamp the bucket width to at least 1 or you divide by zero.', args: [[1,1,1,5,5,5]], expected: 4 },
    { scenario: 'Extreme values', hint: '0 and 10^9 — the full range.', args: [[0,1000000000]], expected: 1000000000 },
    { scenario: 'Gap at the end', hint: 'The biggest gap involves the maximum element; the last bucket must be included.', args: [[1,3,100]], expected: 97 },
    { scenario: 'Unsorted with gap at end', hint: 'Input order does not matter — sorted it is [1,2,3,100].', args: [[100,3,2,1]], expected: 97 },
    { scenario: 'Multi-digit values', hint: 'Default .sort() uses string order ([1, 10, 2]) and finds the wrong gap — sort numerically.', args: [[2,10,1]], expected: 8 },
    { scenario: 'Many empty buckets', hint: 'Forgetting empty buckets: their Infinity sentinels must be skipped, comparing each bucket min with the previous non-empty bucket max.', args: [[1,2,3,1000000,1000001,1000002]], expected: 999997 },
    { scenario: 'Medium random case', hint: 'The largest gap is between buckets, never inside one.', args: [[15252,16764,27963,7817,26155,20757,3478,22602,20404,6739,16790,10588,16521,6644,20880,15632,27078,25463,20124,15728,30042,16604,17223,4388,23646,32683,23688,12439,30630,3895,7926,22101,32406,21540,31799,3768,26679,21799,23740]], expected: 2901 },
    { scenario: 'Large random (n = 10^5)', hint: 'O(n²) approaches are too slow here. `Math.min(...nums)` on 10^5 elements can also throw "Maximum call stack size exceeded" — use a loop.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100000 }, () => r() % 1000000001)]; }', expected: 117831, timeLimitMs: 1000 },
    { scenario: 'Large evenly spaced (n = 10^5)', hint: 'Every gap is 7 except one widened gap — buckets of width (max − min)/(n − 1) find it in O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i < 50000 ? i * 7 : i * 7 + 13)).reverse()]', expected: 20, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maximumGap(nums) {
  const n = nums.length;
  if (n < 2) return 0;
  let lo = Infinity, hi = -Infinity;
  for (const x of nums) {              // loop, not Math.min(...nums)
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  if (lo === hi) return 0;

  const width = Math.max(1, Math.floor((hi - lo) / (n - 1)));
  const count = Math.floor((hi - lo) / width) + 1;
  const bMin = new Array(count).fill(Infinity);
  const bMax = new Array(count).fill(-Infinity);
  for (const x of nums) {
    const b = Math.floor((x - lo) / width);
    if (x < bMin[b]) bMin[b] = x;
    if (x > bMax[b]) bMax[b] = x;
  }

  let best = 0;
  let prevMax = lo;
  for (let b = 0; b < count; b++) {
    if (bMin[b] === Infinity) continue;  // empty bucket
    best = Math.max(best, bMin[b] - prevMax);
    prevMax = bMax[b];
  }
  return best;
}`,
    explanation: 'The bucket count is at most (hi − lo)/width + 1 ≤ about 2n, so everything stays linear.',
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['lo, hi, n', '1, 9, 4'],
      ['width', 'floor(8 / 3) = 2 → 5 buckets'],
      ['buckets', 'b0: [1,1], b1: [3,3], b2: empty, b3: [6,6], b4: [9,9]'],
      ['gaps between buckets', '3−1 = 2, 6−3 = 3, 9−6 = 3'],
      ['answer', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Two linear passes over nums and one over at most ~2n buckets.' },
  alternative: {
    title: 'Sort and scan',
    md: 'Simple and accepted in practice, but not linear.',
    code: `function maximumGap(nums) {
  const s = [...nums].sort((a, b) => a - b);
  let best = 0;
  for (let i = 1; i < s.length; i++) best = Math.max(best, s[i] - s[i - 1]);
  return best;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Width 0 when (hi − lo) < n − 1 — clamp it to at least 1.',
    'Comparing neighbours inside a bucket — the answer is never there.',
    'Forgetting empty buckets (their Infinity sentinels must be skipped).',
    '`Math.min(...nums)` on 10⁵ elements can throw "Maximum call stack size exceeded".',
    'Default `.sort()` in the simple version — string order.',
  ],
};
