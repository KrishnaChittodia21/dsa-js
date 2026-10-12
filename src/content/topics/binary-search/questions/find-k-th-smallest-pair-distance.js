export default {
  id: 'find-k-th-smallest-pair-distance',
  title: 'Find K-th Smallest Pair Distance',
  difficulty: 'Hard',
  order: 2,
  pattern: 'binary-search-on-answer',
  tags: ['array', 'binary search on answer', 'two pointers', 'sorting'],
  source: { platform: 'LeetCode', number: 719, url: 'https://leetcode.com/problems/find-k-th-smallest-pair-distance/' },

  statement: `The **distance** of a pair \`(a, b)\` is \`|a − b|\`. Given an integer array \`nums\` and an integer \`k\`, consider the distances of all pairs \`nums[i], nums[j]\` with \`i < j\`, and return the **k-th smallest** of them (1-indexed, duplicates counted).`,
  examples: [
    { input: 'nums = [1,3,1], k = 1', output: '0', explanation: 'Distances: (1,3)→2, (1,1)→0, (3,1)→2. Sorted: 0, 2, 2. The 1st is 0.' },
    { input: 'nums = [1,1,1], k = 2', output: '0' },
    { input: 'nums = [1,6,1], k = 3', output: '5' },
  ],
  constraints: ['2 <= n <= 10^4', '0 <= nums[i] <= 10^6', '1 <= k <= n·(n−1)/2'],

  think: `- There are up to 5·10^7 pairs. Can you avoid listing them?
- For a candidate distance d, can you **count** how many pairs have distance ≤ d quickly? What does sorting buy you?
- Is that count monotonic in d? Which d is the answer?`,
  patternChallenge: {
    options: ['Generate all distances and sort', 'Min-heap of pairs', 'Binary Search on the answer + two-pointer counting', 'Sliding Window maximum'],
    answer: 2,
    explanation: 'count(d) = #pairs with distance ≤ d is non-decreasing in d, and the k-th smallest distance is the first d with count(d) ≥ k. On a sorted array count(d) is an O(n) two-pointer sweep. Listing all pairs is O(n²) memory; a heap is O((n + k) log n) with k up to 5·10^7.',
  },
  hints: [
    'Sort nums. For each right index, the pairs (left..right−1, right) with nums[right] − nums[left] ≤ d form a contiguous block — move left forward while the distance is too big.',
    'Binary search d in [0, max − min]: `count(mid) >= k` → `hi = mid`, else `lo = mid + 1`.',
  ],
  approach: `**Brute force:** compute all n(n−1)/2 distances, sort, pick index k−1 → O(n² log n) time and O(n²) memory (5·10^7 numbers — too much).

**Optimized:**
1. Sort \`nums\` (numeric comparator!).
2. \`count(d)\`: two pointers. For each \`right\`, advance \`left\` while \`nums[right] − nums[left] > d\`. Then every index in \`[left, right)\` pairs with \`right\` within distance d → add \`right − left\`. \`left\` never moves back, so count is O(n).
3. The answer is the smallest d with \`count(d) >= k\`. Why is it a real distance? At d = answer the count jumps past k − 1, which only happens when some pair has distance exactly d.
4. Total: O(n log n + n log W), W = max − min.`,

  functionName: 'smallestDistancePair',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function smallestDistancePair(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the two 1s give distance 0, the smallest.', args: [[1, 3, 1], 1], expected: 0 },
    { scenario: 'Example 2', hint: 'Every distance is 0, so any k returns 0.', args: [[1, 1, 1], 2], expected: 0 },
    { scenario: 'Example 3', hint: 'k is the largest index here: the 3rd smallest distance is the biggest one, 5.', args: [[1, 6, 1], 3], expected: 5 },
    { scenario: 'Two elements', hint: 'Minimum n: exactly one pair, so the answer is its distance.', args: [[1, 2], 1], expected: 1 },
    { scenario: 'k is the last pair', hint: 'k = n(n-1)/2 means the largest distance, max - min. Your hi must start at max - min, not lower.', args: [[1, 3, 6, 10, 15], 10], expected: 14 },
    { scenario: 'Unsorted input', hint: 'The two-pointer count only works after sorting the array numerically.', args: [[9, 10, 7, 10, 6, 1, 5, 4, 9, 8], 18], expected: 2 },
    { scenario: 'Default sort pitfall', hint: 'nums.sort() without a comparator sorts as strings ([1, 10, 100, 9]) and the window count goes wrong. Use (a, b) => a - b.', args: [[10, 9, 1, 100], 2], expected: 8 },
    { scenario: 'Small k, wide spread', hint: 'Three values far apart: the 2nd smallest distance is 58.', args: [[62, 100, 4], 2], expected: 58 },
    { scenario: 'Duplicate distances skip k', hint: 'No distance d has exactly 3 pairs ≤ d. Searching for count(d) === k fails — find the first d with count(d) >= k.', args: [[1, 1, 3, 3], 3], expected: 2 },
    { scenario: 'All values equal', hint: 'All six pairs have distance 0 — lo = hi = 0 from the start.', args: [[5, 5, 5, 5], 6], expected: 0 },
    { scenario: 'Extreme values', hint: 'Values 0 and 10^6: the search range is the full constraint range.', args: [[0, 1000000], 1], expected: 1000000 },
    { scenario: 'Smallest gap in the middle', hint: 'The closest pair (13, 14) is at the end of the array, not adjacent to the start.', args: [[1, 5, 9, 13, 14], 1], expected: 1 },
    { scenario: 'Large input (n = 10^4)', hint: 'Listing all ~5·10^7 distances and sorting them is far too slow. Binary search the distance and count pairs with a sliding window.', argsGen: '() => { let s = 11; const a = Array.from({ length: 10000 }, () => { s = (s * 48271) % 2147483647; return s % 1000001; }); return [a, 25000000]; }', expected: 297247, timeLimitMs: 500 },
    { scenario: 'Large input, k = 1', hint: 'Small distances make an O(n²) count crawl: if you reset `left` to 0 for every right, each count is quadratic. Keep `left` moving forward only.', argsGen: '() => { let s = 11; const a = Array.from({ length: 10000 }, () => { s = (s * 48271) % 2147483647; return s % 1000001; }); return [a, 1]; }', expected: 0, timeLimitMs: 500 },
  ],

  solution: {
    code: `function smallestDistancePair(nums, k) {
  nums.sort((a, b) => a - b);               // numeric sort, not the default!
  const n = nums.length;

  // number of pairs with distance <= d (two pointers on the sorted array)
  const countAtMost = (d) => {
    let count = 0, left = 0;
    for (let right = 0; right < n; right++) {
      while (nums[right] - nums[left] > d) left++;
      count += right - left;                 // pairs (left..right-1, right)
    }
    return count;
  };

  let lo = 0, hi = nums[n - 1] - nums[0];
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (countAtMost(mid) >= k) hi = mid;     // at least k pairs within mid
    else lo = mid + 1;
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'count(≤ mid) on [1,1,6]', 'decision (k = 3)'],
    rows: [
      ['0', '5', '2', '1 (only 1–1)', '< 3 → lo = 3'],
      ['3', '5', '4', '1', '< 3 → lo = 5'],
      ['5', '5', '—', '—', 'return 5'],
    ],
  },
  complexity: { time: 'O(n log n + n log W)', space: 'O(1) extra (sort in place)', explanation: 'W = max − min ≤ 10^6 → ~20 counting passes, each O(n) amortized.' },
  alternative: {
    title: 'Bucket counting',
    md: 'Because distances are ≤ 10^6, count every pair distance into an array of size W + 1, then walk the buckets until k is reached. O(n² + W) time — simpler but too slow for n = 10^4 in JS.',
    complexity: 'O(n² + W) time, O(W) space',
  },
  mistakes: [
    'Default `nums.sort()` sorts as strings — `[10, 9, 1]` becomes `[1, 10, 9]` and the two-pointer count breaks.',
    'Resetting `left` to 0 for each right — makes counting O(n²).',
    'Searching for `count(d) === k` — with duplicate distances no d may hit k exactly.',
  ],
};
