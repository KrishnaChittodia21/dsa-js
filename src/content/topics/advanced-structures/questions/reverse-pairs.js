export default {
  id: 'reverse-pairs',
  title: 'Reverse Pairs',
  difficulty: 'Hard',
  order: 3,
  pattern: 'bit-coordinate-compression-counting',
  tags: ['array', 'fenwick tree', 'coordinate compression', 'merge sort', 'binary search'],
  source: { platform: 'LeetCode', number: 493, url: 'https://leetcode.com/problems/reverse-pairs/' },

  statement: `Given an integer array \`nums\`, count the **reverse pairs**: index pairs \`(i, j)\` with \`i < j\` and \`nums[i] > 2 · nums[j]\`.`,
  examples: [
    { input: 'nums = [1,3,2,3,1]', output: '2', explanation: '(1, 4): 3 > 2·1 and (3, 4): 3 > 2·1.' },
    { input: 'nums = [2,4,3,5,1]', output: '3', explanation: '(1,4): 4 > 2, (2,4): 3 > 2, (3,4): 5 > 2.' },
  ],
  constraints: ['0 <= nums.length <= 5 * 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],

  think: `- Fix j. You need the number of **earlier** values greater than \`2 · nums[j]\`. What structure counts "seen values above a threshold"?
- The threshold \`2 · nums[j]\` is usually not in the array. How do you find its position among the compressed values?
- Could \`2 · nums[j]\` overflow? (In JavaScript, what is the largest exactly representable integer?)`,
  patternChallenge: {
    options: ['Two Pointers on a sorted copy', 'Coordinate Compression + BIT Counting', 'Hash Map (Complement Lookup)', 'Monotonic Stack'],
    answer: 1,
    explanation: 'It is a pair count with i < j and a value condition: scan j, and ask how many earlier values exceed a threshold — a Fenwick tree over compressed values plus a binary search for the threshold\'s rank. Sorting alone destroys the i < j order; a hash map only answers equality.',
  },
  hints: [
    'Compress `nums` (sorted unique values). For a threshold t, the number of distinct values ≤ t is `upperBound(sorted, t)`.',
    'Scan j left to right: pairs += seen − (count of seen values ≤ 2·nums[j]); then insert nums[j]. Doubles are exact below 2^53, so `2 * nums[j]` never overflows in JS.',
  ],
  approach: `**Brute force:** check all pairs — O(n²), 1.25·10^9 at n = 5·10^4.

**Optimized — BIT + compression (O(n log n)):**
1. \`sorted\` = unique values ascending; \`rank(v)\` = index in sorted.
2. Scan j from left to right, with \`seen = j\` values already inserted.
3. \`k = upperBound(sorted, 2 · nums[j])\` = number of distinct values ≤ threshold. Seen values ≤ threshold = \`bit.prefixSum(k − 1)\` (0 when k = 0).
4. \`pairs += seen − that\`; insert \`rank(nums[j])\`.

**Alternative — merge sort:** in each merge, before merging, walk a pointer through the right half: for each left element a, advance while \`a > 2·right[p]\` — the pointer only moves forward because the left half is sorted. Then merge normally.`,

  functionName: 'reversePairs',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function reversePairs(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Both pairs end at the last 1: 3 > 2·1 twice.', args: [[1,3,2,3,1]], expected: 2 },
    { scenario: 'Example 2', hint: 'Three earlier values exceed 2·1 = 2.', args: [[2,4,3,5,1]], expected: 3 },
    { scenario: 'Empty array', hint: 'n = 0 is allowed: no pairs.', args: [[]], expected: 0 },
    { scenario: 'Single element', hint: 'One element cannot form a pair.', args: [[1]], expected: 0 },
    { scenario: 'Exactly double is not enough', hint: 'The condition is strict: 2 > 2·1 is false. Using >= counts these.', args: [[2,1,4,2,8,4]], expected: 0 },
    { scenario: 'Strictly decreasing', hint: 'Not every inversion is a reverse pair — only those with more than double.', args: [[5,4,3,2,1]], expected: 4 },
    { scenario: 'Negative numbers', hint: 'With negatives, 2·nums[j] is smaller than nums[j]: −5 > −10 is a pair.', args: [[-5,-5,-1,-3]], expected: 4 },
    { scenario: 'Threshold not in the array', hint: '2·nums[j] is usually not a value of the array — rank.get() returns undefined; binary-search the threshold.', args: [[7,1,5,2,9,3]], expected: 5 },
    { scenario: 'All equal positive', hint: 'x > 2x is false for positive x: 0 pairs.', args: [[3,3,3,3]], expected: 0 },
    { scenario: 'All equal negative', hint: 'x > 2x is true for negative x: every pair counts, C(4,2) = 6.', args: [[-1,-1,-1,-1]], expected: 6 },
    { scenario: 'Extreme 32-bit values', hint: '2·nums[j] reaches ±2^32 — fine for JS numbers, but not for |0 or 32-bit tricks.', args: [[-2147483648,2147483647,-1,0,2147483647,-2147483648]], expected: 7 },
    { scenario: 'Random (n = 100)', hint: 'Pseudo-random signed values — compare with a double loop if this fails.', argsGen: '() => { let s = 61; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100 }, () => (rnd() % 2001) - 1000)]; }', expected: 2458 },
    { scenario: 'Large input (n = 5·10^4)', hint: 'A double loop is 1.25·10^9 comparisons — too slow. Use a BIT over compressed values or merge sort: O(n log n).', argsGen: '() => { let s = 71; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 50000 }, () => (rnd() % 4294967296) - 2147483648)]; }', expected: 624402052, timeLimitMs: 400 },
  ],
  solution: {
    code: `function reversePairs(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  // number of elements in sorted that are <= t
  const upperBound = (t) => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] <= t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const bit = new FenwickTree(sorted.length);
  let pairs = 0;
  for (let j = 0; j < nums.length; j++) {
    const k = upperBound(2 * nums[j]);                   // distinct values <= threshold
    const atMostThreshold = k > 0 ? bit.prefixSum(k - 1) : 0;
    pairs += j - atMostThreshold;                        // earlier values > 2 * nums[j]
    bit.add(rank.get(nums[j]), 1);
  }
  return pairs;
}`,
  },
  dryRun: {
    columns: ['j', 'nums[j]', 'threshold 2·x', 'k = upperBound', 'seen ≤ threshold', 'pairs += j − that'],
    rows: [
      ['0', '1', '2', '2 (sorted = [1,2,3])', '0', '0'],
      ['1', '3', '6', '3', '1', '0'],
      ['2', '2', '4', '3', '2', '0'],
      ['3', '3', '6', '3', '3', '0'],
      ['4', '1', '2', '2', '2 (the 1 and the 2)', '4 − 2 = 2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting, then per element one binary search, one BIT query and one BIT update — each O(log n).' },
  alternative: {
    title: 'Merge sort with a counting pass',
    md: 'Both halves are sorted after the recursive calls. For each element of the left half, a single forward-moving pointer counts right-half elements with `left > 2·right`. Then merge. Each level is O(n), so O(n log n) total.',
    code: `function reversePairs(nums) {
  const a = nums.slice();
  const sort = (lo, hi) => {                   // sorts a[lo..hi) and returns pairs inside
    if (hi - lo < 2) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid, hi);
    let p = mid;
    for (let i = lo; i < mid; i++) {
      while (p < hi && a[i] > 2 * a[p]) p++;
      count += p - mid;
    }
    const merged = a.slice(lo, hi).sort((x, y) => x - y); // or a real linear merge
    for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
    return count;
  };
  return sort(0, a.length);
}`,
    complexity: 'O(n log n) time with a linear merge (O(n log² n) with the sort shortcut shown), O(n) space',
  },
  mistakes: [
    'Looking up `rank.get(2 * nums[j])` — the threshold is usually not in the array, so it is undefined.',
    'Using `>=` instead of `>` (the condition is strict: nums[i] > 2·nums[j]).',
    'Worrying about overflow and converting to BigInt — unnecessary: |2·nums[j]| ≤ 2^32, far below 2^53.',
    'In the merge-sort version, counting during the merge itself with the merge comparison — the counting condition (2×) differs from the merge order, so count in a separate pass.',
  ],
};
