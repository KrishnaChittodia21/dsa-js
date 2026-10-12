export default {
  id: 'prefix-sum',
  summary: 'Precompute running totals once so any range sum becomes one subtraction; pair them with a hash map to count subarrays, and run them "in reverse" (difference arrays) to apply many range updates cheaply.',

  jsTools: [
    { api: 'new Array(n + 1).fill(0)', use: 'Prefix array with a leading 0 so prefix[0] = empty sum', complexity: 'O(n)' },
    { api: 'Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))', use: '2D prefix table (each row its own array!)', complexity: 'O(m·n)' },
    { api: 'new Map()', use: 'prefix sum (or remainder) → count / first index', complexity: 'get / set O(1) average' },
    { api: '((x % k) + k) % k', use: 'Non-negative remainder — JS % keeps the sign of the dividend', complexity: 'O(1)' },
    { api: 'map.get(key) ?? 0', use: 'Default count of 0 without clobbering real zeros', complexity: 'O(1)' },
    { api: 'Int32Array / Float64Array', use: 'Compact typed prefix arrays for large inputs', complexity: 'O(n) memory, zero-initialised' },
  ],

  patterns: [
    {
      id: 'prefix-sum-1d',
      name: 'Prefix Sum — 1D Range Sums',
      summary: 'prefix[i] = sum of the first i elements; the sum of nums[l..r] is prefix[r + 1] − prefix[l].',
      whyItExists: 'Summing a range directly costs O(length). With q queries that is O(n·q). One O(n) precomputation makes every query O(1), because a range sum is the difference of two "sum so far" values.',
      whenToUse: [
        'Many range-sum queries on an array that does not change',
        'Compare "sum to the left" and "sum to the right" of each index (pivot / equilibrium)',
        'Best sum of fixed-length blocks, possibly combined with best-so-far arrays',
      ],
      clues: ['"sum of elements between indices left and right"', '"many queries"', '"left sum equals right sum"', '"running sum"', '"cumulative"', '"net gain"'],
      whenNotToUse: [
        'The array is updated between queries → Fenwick tree / segment tree (Advanced Structures)',
        'Only one range is ever asked → just sum it',
        'You need min/max over a range, not a sum → sparse table / segment tree (min is not invertible)',
      ],
      template: `function buildPrefix(nums) {
  const prefix = new Array(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
  return prefix;
}
// sum of nums[l..r] (inclusive)
const rangeSum = (prefix, l, r) => prefix[r + 1] - prefix[l];`,
      variations: [
        { name: 'Running sum in place', description: '`nums[i] += nums[i - 1]` when the input may be overwritten.' },
        { name: 'Pivot / equilibrium index', description: 'Left sum = prefix, right sum = total − prefix − nums[i].' },
        { name: 'Prefix + best-so-far arrays', description: 'Best block on the left of i and on the right of i, combined in the middle (3 non-overlapping subarrays).' },
        { name: 'Prefix products / XOR', description: 'Any invertible operation works: XOR of a range is px[r+1] ^ px[l].' },
      ],
      mistakes: [
        'Off-by-one: mixing "prefix[i] includes nums[i]" and "prefix[i] is the sum before i" conventions',
        'Forgetting the leading 0, which makes ranges starting at index 0 a special case',
        'Recomputing sums inside a loop instead of reading the prefix array',
      ],
      evolution: {
        easy: 'Running sum, pivot index, immutable range sum queries.',
        medium: 'Prefix sums inside another technique (hash map, sliding blocks).',
        hard: 'Prefix sums + left/right best arrays or DP (maximum sum of 3 non-overlapping subarrays).',
      },
    },
    {
      id: 'prefix-sum-2d',
      name: 'Prefix Sum — 2D (matrix) Sums',
      summary: 'P[r][c] = sum of the rectangle from (0,0) to (r−1,c−1); any rectangle sum is four lookups by inclusion–exclusion.',
      whyItExists: 'Summing a k×k block costs O(k²). A 2D prefix table built in O(m·n) answers any rectangle in O(1) by adding and subtracting four corner rectangles.',
      whenToUse: [
        'Many rectangle-sum queries on a fixed matrix',
        'Count / optimise submatrices by sum (fix two rows, then reduce to 1D)',
        'Image processing: box blur, block sums',
      ],
      clues: ['"sum of the submatrix"', '"row1, col1, row2, col2"', '"matrix" + "many queries"', '"number of submatrices that sum to target"'],
      whenNotToUse: ['The matrix changes between queries → 2D Fenwick tree', 'Only row or column sums are needed → 1D prefix per row'],
      template: `// P has one extra row and column of zeros
for (let r = 0; r < m; r++)
  for (let c = 0; c < n; c++)
    P[r + 1][c + 1] = matrix[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];

const sumRegion = (r1, c1, r2, c2) =>
  P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];`,
      variations: [
        { name: 'Immutable 2D range query', description: 'Build once, answer each query with 4 lookups.' },
        { name: 'Fix a pair of rows', description: 'Collapse the rows between them into a 1D array of column sums, then run a 1D technique (hash map, Kadane).' },
      ],
      mistakes: [
        'Forgetting to add back the doubly-subtracted top-left corner',
        'Creating rows with `new Array(m).fill(new Array(n))` — every row is the SAME array',
        'Mixing up (row, col) with (x, y)',
      ],
      evolution: {
        easy: 'Row-wise prefix sums.',
        medium: 'Range Sum Query 2D, matrix block sum.',
        hard: 'Submatrices with sum = target (row pairs + hash map), max sum rectangle ≤ k.',
      },
    },
    {
      id: 'prefix-sum-hashmap',
      name: 'Prefix Sum + HashMap (count / find subarrays by sum)',
      summary: 'A subarray (i, j] has sum k exactly when prefix[j] − prefix[i] = k, so while scanning j, look up how many earlier prefixes equal prefix[j] − k.',
      whyItExists: 'Counting subarrays with sum k by trying all (i, j) is O(n²). Sliding windows fail when numbers can be negative (the sum is not monotonic). Rewriting "sum of a subarray" as "difference of two prefix sums" turns the problem into Two Sum over prefix sums: one pass, O(n).',
      whenToUse: [
        'Count subarrays with sum exactly k (negatives allowed)',
        'Longest subarray with sum k / with equal counts of two things (map 0 → −1)',
        'Any "difference of two running values equals X" condition',
      ],
      clues: ['"number of subarrays whose sum equals k"', '"contiguous"', '"negative numbers allowed"', '"equal number of 0s and 1s"', '"longest subarray with sum k"'],
      whenNotToUse: [
        'All numbers positive and you need longest/shortest with sum ≥ / ≤ target → sliding window is O(1) space',
        'The condition is not expressible as prefix[j] − prefix[i] = something',
      ],
      template: `function countSubarraysWithSum(nums, k) {
  const seen = new Map([[0, 1]]); // the empty prefix: sum 0 seen once
  let prefix = 0, count = 0;
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) ?? 0;          // earlier prefixes that complete a sum-k subarray
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}`,
      variations: [
        { name: 'Count (store counts)', description: 'Every earlier occurrence of prefix − k is a different start → store how many times each prefix appeared.' },
        { name: 'Longest (store first index)', description: 'To maximise length, keep the EARLIEST index of each prefix and never overwrite it.' },
        { name: 'Transform values', description: 'Map 0 → −1 so "equal 0s and 1s" becomes "sum 0".' },
      ],
      mistakes: [
        'Forgetting `map.set(0, 1)` — subarrays that start at index 0 are never counted',
        'Inserting the current prefix BEFORE the lookup (with k = 0 every element would match itself)',
        'Storing a boolean/index when you need a count (or vice versa)',
        'Using a sliding window when negatives are allowed',
      ],
      evolution: {
        easy: 'Two Sum on prefix sums (does any subarray sum to k?).',
        medium: 'Subarray Sum Equals K, Contiguous Array.',
        hard: 'Combined with 2D compression (submatrices sum to target) or with modulo keys.',
      },
    },
    {
      id: 'prefix-sum-modulo',
      name: 'Prefix Sum Modulo k',
      summary: 'A subarray sum is divisible by k exactly when two prefix sums have the same remainder mod k, so count / locate equal remainders.',
      whyItExists: '"Sum divisible by k" is "prefix[j] − prefix[i] ≡ 0 (mod k)" ⇔ "prefix[j] ≡ prefix[i] (mod k)". Equal remainders are easy to find with a hash map (or an array of size k), giving O(n).',
      whenToUse: [
        'Count subarrays whose sum is divisible by k',
        'Does a subarray of length ≥ 2 have a sum that is a multiple of k?',
        'Smallest subarray to remove so the rest is divisible by p',
      ],
      clues: ['"divisible by k"', '"multiple of k"', '"sum % k === 0"', '"remainder"'],
      whenNotToUse: ['The condition is an exact sum, not a remainder → plain prefix + hash map'],
      template: `function subarraysDivByK(nums, k) {
  const count = new Array(k).fill(0);
  count[0] = 1;                             // empty prefix has remainder 0
  let prefix = 0, total = 0;
  for (const x of nums) {
    prefix = (((prefix + x) % k) + k) % k;  // normalise: JS % can be negative
    total += count[prefix];
    count[prefix]++;
  }
  return total;
}`,
      variations: [
        { name: 'Count pairs of equal remainders', description: 'Subarrays Sums Divisible by K.' },
        { name: 'Existence with a length constraint', description: 'Store the first index of each remainder; a match at distance ≥ 2 qualifies (Continuous Subarray Sum).' },
      ],
      mistakes: [
        'Using raw `%` with negative numbers: `-1 % 5` is `-1` in JavaScript, not `4`, so equal residues get different keys',
        'Forgetting the initial remainder-0 entry',
        'Overwriting the first index of a remainder when you need the longest distance',
      ],
      evolution: {
        easy: 'Pairs of numbers whose sum is divisible by k (remainder buckets).',
        medium: 'Continuous Subarray Sum, Subarray Sums Divisible by K.',
        hard: 'Make Sum Divisible by P (remove the shortest subarray).',
      },
    },
    {
      id: 'difference-array',
      name: 'Difference Array (range updates)',
      summary: 'To add v to every element of [l, r], do diff[l] += v and diff[r + 1] −= v; one prefix sum at the end rebuilds the final array.',
      whyItExists: 'Applying u range updates directly costs O(u · length). A difference array records only where each update starts and stops, O(1) per update; a single prefix-sum pass (O(n)) turns the "start/stop" marks into actual values.',
      whenToUse: [
        'Many range increments, then read the final array once',
        'Count how many intervals cover each point (bookings, passengers, events)',
        'Check capacity over time (car pooling, meeting rooms by timestamp)',
      ],
      clues: ['"add val to every index from l to r"', '"bookings"', '"passengers get on at from and off at to"', '"after all updates"', '"capacity at any moment"'],
      whenNotToUse: ['You must answer queries between updates → Fenwick tree / lazy segment tree', 'Coordinates are huge and sparse → sort the events (sweep line) instead of an array'],
      template: `function applyRangeAdds(n, updates) {
  const diff = new Array(n + 1).fill(0);   // one extra slot for r + 1 === n
  for (const [l, r, v] of updates) {
    diff[l] += v;
    diff[r + 1] -= v;
  }
  const result = new Array(n);
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];                    // prefix sum of diff = actual value
    result[i] = running;
  }
  return result;
}`,
      variations: [
        { name: 'Half-open intervals', description: 'If a range is [from, to) (e.g. passengers leave AT `to`), subtract at `to`, not `to + 1`.' },
        { name: '2D difference array', description: 'Four corner updates per rectangle, then a 2D prefix sum.' },
        { name: 'Sweep line', description: 'Same idea with sorted events when coordinates are large.' },
      ],
      mistakes: [
        'Subtracting at r instead of r + 1 (or vice versa for half-open ranges)',
        'Array too small for the r + 1 write',
        '1-based input positions (flight 1..n) not shifted to 0-based',
      ],
      evolution: {
        easy: 'Apply range increments and return the final array.',
        medium: 'Corporate Flight Bookings, Car Pooling.',
        hard: '2D difference arrays; combining with binary search on the number of updates applied.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `A **prefix sum** is a running total: for every position, the sum of everything before it.

\`\`\`text
index:        0   1   2   3   4
nums:       [ 3,  1,  4,  1,  5 ]
prefix:  [0,  3,  4,  8,  9, 14 ]
          ↑ empty sum   ↑ prefix[3] = 3 + 1 + 4
\`\`\`

Once you have it, the sum of **any** range is a single subtraction:

\`\`\`text
sum(nums[1..3]) = prefix[4] − prefix[1] = 9 − 3 = 6   (1 + 4 + 1)
\`\`\`

The same "running total" idea powers three more tools in this topic: **2D prefix sums** for rectangles, **prefix sum + hash map** for counting subarrays with a given sum, and **difference arrays**, which run the idea backwards to apply range updates.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Prefix** — the first \`i\` elements \`nums[0..i−1]\`.
- **Prefix sum array** — \`prefix[0] = 0\`, \`prefix[i + 1] = prefix[i] + nums[i]\`. It has **n + 1** entries.
- **Range sum** — \`sum(l..r) = prefix[r + 1] − prefix[l]\` (inclusive l and r).
- **Difference array** — \`diff[i] = a[i] − a[i − 1]\`; its prefix sum gives back \`a\`.
- **Precomputation** — work done once up front so each later query is cheap.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A car odometer. To know how far you drove between the 2nd and 5th stop, you do not re-drive the route — you subtract the odometer reading at stop 2 from the reading at stop 5. The prefix array is a list of odometer readings.',
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-1',
            question: '`nums = [2, 5, -1, 4]`, so `prefix = [0, 2, 7, 6, 10]`. What is the sum of `nums[1..3]` (indices 1 to 3 inclusive)?',
            options: [
              'prefix[3] − prefix[1] = 4',
              'prefix[3] − prefix[0] = 6',
              'prefix[4] − prefix[1] = 8',
              'prefix[4] − prefix[2] = 3',
            ],
            answer: 2,
            explanation: '`prefix[4]` = sum of the first 4 elements (indices 0..3). Subtract `prefix[1]` = sum of the first 1 element (index 0). What remains is indices 1..3: 5 − 1 + 4 = 8.',
            misconceptions: {
              0: '`prefix[3]` only covers indices 0..2, so index 3 is missing. With the leading-0 convention the right end is `r + 1`.',
              1: 'That is the sum of indices 0..2 — both ends are off by one.',
              3: 'Subtracting `prefix[2]` removes indices 0 and 1, so index 1 (the 5) is lost.',
            },
            deeper: 'Memorise one convention and never mix: **prefix[i] = sum of the first i elements** (so prefix[0] = 0). Then `sum(l..r) = prefix[r + 1] − prefix[l]`. The "+1" belongs to the right end because prefix[r + 1] is the first prefix that *includes* index r.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Suppose you have an array of \`n = 10^5\` numbers and \`q = 10^5\` questions "what is the sum from l to r?".

- **Direct:** each question loops over up to n elements → up to \`n · q = 10^10\` additions. Far too slow.
- **Prefix sums:** one O(n) pass to build \`prefix\`, then each question is O(1) → about \`2 · 10^5\` operations.

The idea — **pay once, reuse forever** — is the same "reuse previous work" idea behind sliding windows and dynamic programming.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Sum each query — O(n) per query',
              code: `function rangeSum(nums, l, r) {
  let s = 0;
  for (let i = l; i <= r; i++) s += nums[i];
  return s;
}`,
            },
            right: {
              title: 'Prefix sums — O(1) per query',
              code: `const prefix = [0];
for (const x of nums) prefix.push(prefix.at(-1) + x);

const rangeSum = (l, r) => prefix[r + 1] - prefix[l];`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see **why** a range sum is a difference of two prefix sums?',
            deeper: '`prefix[r + 1]` = nums[0] + … + nums[l − 1] + nums[l] + … + nums[r]. `prefix[l]` = nums[0] + … + nums[l − 1]. The shared part `nums[0..l−1]` cancels, leaving exactly nums[l..r]. This works because addition is **invertible** (you can subtract). That is also why there is no "prefix min": knowing min(0..r) and min(0..l−1) does not tell you min(l..r).',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Situation | Tool |
|---|---|
| Many range-sum queries, array never changes | 1D prefix sum |
| Many rectangle-sum queries on a matrix | 2D prefix sum |
| Count / find subarrays with sum **exactly** k (negatives allowed) | prefix sum + hash map |
| Subarray sums **divisible** by k | prefix sum mod k + hash map |
| Many range **updates**, read the result once | difference array |

**Not a fit:** the array changes between queries (use a Fenwick tree or segment tree — Advanced Structures); range **min/max** (not invertible); "longest subarray with sum ≤ target" with **only positive** numbers (a sliding window does it in O(1) space).`,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-2',
            question: '"Count the subarrays whose sum equals k. Numbers may be negative." Why not use a sliding window?',
            options: [
              'Sliding windows cannot count anything',
              'With negatives, adding an element can decrease the sum and removing one can increase it, so there is no safe rule for when to shrink',
              'Sliding windows need the array to be sorted',
              'Sliding windows only work on strings',
            ],
            answer: 1,
            explanation: 'Windows rely on monotonicity: growing makes the sum bigger, shrinking makes it smaller. Negatives break that, so the window cannot decide which pointer to move. Prefix sums + a hash map do not need monotonicity at all.',
            misconceptions: {
              0: 'Windows count subarrays well ("at most K" counts) — when the rule is monotonic.',
              2: 'Windows never require sorting; sorting would even destroy contiguity.',
              3: 'Windows work on any sequence — arrays and strings alike.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['sum of a range / between indices', 'many queries, no updates', 'number of subarrays with sum k', 'negatives allowed', 'divisible by k', 'equal number of 0s and 1s', 'add val to every element from l to r', 'after all bookings'],
            conclusion: 'Think Prefix Sum (+ HashMap or Difference Array)',
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-3',
            question: '"There are n flights. Each booking [first, last, seats] reserves `seats` on every flight from first to last. Return the total seats on each flight." Which tool fits best?',
            options: [
              'Prefix sum + hash map',
              '2D prefix sum',
              'Difference array: +seats at first, −seats after last, then one prefix sum',
              'Sort the bookings and binary search',
            ],
            answer: 2,
            explanation: 'Many range **updates**, one read at the end → difference array. Each booking is O(1), the final prefix sum is O(n).',
            misconceptions: {
              0: 'The hash-map trick answers "how many subarrays have sum k", not "apply range additions".',
              1: 'The data is one-dimensional (flights in a row).',
              3: 'Sorting helps a sweep line when coordinates are huge; here flights are 1..n, so an array of size n is simplest.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Think of \`prefix\` as a **height profile**: you walk along the array and your altitude changes by \`nums[i]\` at each step. A range sum is just "altitude at the end minus altitude at the start".

That picture explains every pattern in this topic:
- **Range sum** = difference of two altitudes.
- **Subarray with sum k** = two points on the walk whose altitudes differ by exactly k.
- **Divisible by k** = two points whose altitudes leave the same remainder mod k.
- **Difference array** = you are given the *steps* (changes) and rebuild the altitudes.`,
          },
          {
            type: 'visual',
            scenario: 'prefix-sum',
            input: { nums: [3, 1, 4, 1, 5, 9] },
            caption: 'Each prefix value is the previous one plus the current element.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Concrete problem: **Find Pivot Index** — the first index where the sum of everything to its left equals the sum of everything to its right. The direct approach recomputes both sums for every index.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n²)',
            code: `function pivotIndex(nums) {
  for (let i = 0; i < nums.length; i++) {
    let left = 0, right = 0;
    for (let j = 0; j < i; j++) left += nums[j];
    for (let j = i + 1; j < nums.length; j++) right += nums[j];
    if (left === right) return i;
  }
  return -1;
}`,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-4',
            question: 'Moving from index `i` to `i + 1`, how do `left` and `right` change?',
            options: [
              'They must both be recomputed from scratch',
              '`left` gains nums[i]; `right` loses nums[i + 1] — two O(1) updates, so one pass is enough',
              'Only `left` changes',
              'They swap values',
            ],
            answer: 1,
            explanation: 'The left part grows by the old pivot, the right part shrinks by the new pivot. Even simpler: `right = total − left − nums[i]`, so we only track `left` (a running prefix sum).',
            misconceptions: {
              0: 'That is exactly the wasted work: consecutive left sums differ by a single element.',
              2: 'The right part also loses the element that becomes the new pivot.',
              3: 'Nothing is swapped; each side changes by one element.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — 1D prefix sums',
        blocks: [
          {
            type: 'steps',
            title: 'Pivot index in one pass',
            steps: [
              'Compute `total = sum(nums)`.',
              'Walk i from 0 with `left = 0` (sum of nums[0..i−1]).',
              '`right = total − left − nums[i]`. If `left === right`, return i.',
              'Otherwise `left += nums[i]` and continue. Return −1 at the end.',
            ],
          },
          {
            type: 'text',
            md: `For **many range queries**, build the full array once:

\`\`\`js
const prefix = new Array(n + 1).fill(0);
for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
// sum(l..r) = prefix[r + 1] - prefix[l]
\`\`\`

The leading \`0\` (the **empty prefix**) is what makes ranges that start at index 0 work without a special case.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: '1D prefix sum',
            code: `const prefix = new Array(nums.length + 1).fill(0);
for (let i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
const sum = (l, r) => prefix[r + 1] - prefix[l]; // inclusive l..r`,
          },
          {
            type: 'code',
            title: 'Prefix sum + hash map (count sum = k)',
            code: `const seen = new Map([[0, 1]]);
let prefix = 0, count = 0;
for (const x of nums) {
  prefix += x;
  count += seen.get(prefix - k) ?? 0;
  seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
}`,
          },
          {
            type: 'code',
            title: 'Difference array (range add)',
            code: `const diff = new Array(n + 1).fill(0);
for (const [l, r, v] of updates) { diff[l] += v; diff[r + 1] -= v; }
for (let i = 1; i < n; i++) diff[i] += diff[i - 1]; // diff[0..n-1] is now the result`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Range Sum Query — Immutable',
            code: `class NumArray {
  constructor(nums) {
    this.prefix = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) this.prefix[i + 1] = this.prefix[i] + nums[i];
  }
  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Numbers are 64-bit floats: integer sums are exact up to \`Number.MAX_SAFE_INTEGER\` (≈ 9·10^15), so prefix sums of 10^5 values up to 10^9 are fine. Beyond that use \`BigInt\`.
- \`prefix.at(-1)\` reads the last element (ES2022); \`prefix[prefix.length - 1]\` works everywhere.
- For huge arrays, \`new Float64Array(n + 1)\` is zero-filled and more compact than a regular array.
- Avoid \`nums.slice(l, r + 1).reduce(...)\` inside loops — it is O(length) per call and allocates a new array.`,
          },
        ],
      },
      {
        id: 'optimized-2d',
        title: 'Optimized approach — 2D prefix sums',
        blocks: [
          {
            type: 'text',
            md: `Let \`P[r][c]\` be the sum of the rectangle with top-left \`(0, 0)\` and bottom-right \`(r − 1, c − 1)\` (again one extra row and column of zeros).

**Building:** the rectangle up to \`(r, c)\` = the cell + the rectangle above + the rectangle to the left − their overlap (counted twice):

\`\`\`text
P[r+1][c+1] = M[r][c] + P[r][c+1] + P[r+1][c] − P[r][c]
\`\`\`

**Querying** the rectangle \`(r1, c1)\`–\`(r2, c2)\` — inclusion–exclusion:

\`\`\`text
sum = P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]
      (whole)        (strip above)  (strip left)  (corner removed twice → add back)
\`\`\``,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-5',
            question: 'In the 2D query, why is `P[r1][c1]` **added** back?',
            options: [
              'It is a typo; all three extra terms should be subtracted',
              'Because the top-left corner rectangle is inside both the "strip above" and the "strip left", so it was subtracted twice',
              'Because P[r1][c1] is always zero',
              'To handle negative numbers',
            ],
            answer: 1,
            explanation: 'The region above the query and the region to its left overlap in the top-left block `(0,0)–(r1−1, c1−1)`. Subtracting both removes that block twice; adding `P[r1][c1]` once restores the balance.',
            misconceptions: {
              0: 'Subtracting it would remove the corner block three times in total — the sum would be too small.',
              2: 'It is zero only when r1 = 0 or c1 = 0 (thanks to the padding).',
              3: 'The formula is pure bookkeeping of areas; the signs of the values do not matter.',
            },
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'The shared-row trap',
            md: '`new Array(m + 1).fill(new Array(n + 1).fill(0))` creates **one** inner array and puts the same reference in every row — writing `P[1][1]` changes every row. Use `Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))`.',
          },
          {
            type: 'text',
            md: '**Counting submatrices** (e.g. sum = target): fix a top row and a bottom row, compute the sum of each column between them (a 1D array), then use the 1D hash-map trick on it. That is O(m² · n) instead of O(m² · n²).',
          },
        ],
      },
      {
        id: 'intuition-hashmap',
        title: 'Core intuition — prefix sum + hash map',
        blocks: [
          {
            type: 'text',
            md: `We want the number of subarrays \`nums[i..j]\` with sum \`k\`. Rewrite with prefix sums (\`P\` = running total **after** each element, and \`P = 0\` before any element):

\`\`\`text
sum(nums[i..j]) = P_after(j) − P_before(i) = k
            ⇔   P_before(i) = P_after(j) − k
\`\`\`

So, standing at \`j\` with current prefix \`cur\`, the question becomes: **how many earlier prefix values equal \`cur − k\`?** That is Two Sum (from Hashing) on prefix sums — a hash map answers it in O(1).`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why store COUNTS, and why map.set(0, 1)?',
            md: `**Counts:** with negatives or zeros, the same prefix value can occur several times. Each earlier occurrence is a **different starting point** for a valid subarray ending at \`j\`. Example \`nums = [1, -1, 1]\`, \`k = 1\`: prefixes are 0, 1, 0, 1. At the end (\`cur = 1\`) we look for \`0\`, which was seen **twice** (before index 0 and after index 1) → two subarrays \`[1, -1, 1]\` and \`[1]\`. A Set would count only one.

**\`map.set(0, 1)\`:** the empty prefix (before index 0) has sum 0. Without it, a subarray starting at index 0 — whose sum is \`cur\` itself — needs \`cur − k = 0\` to be in the map, and it would not be. \`nums = [3]\`, \`k = 3\`: cur = 3, look for 0 → found only because of the initial entry.`,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-6',
            question: '`nums = [0, 0]`, `k = 0`. What goes wrong if we store prefixes in a **Set** instead of counting them?',
            options: [
              'Nothing; the answer is 3 either way',
              'It crashes on zeros',
              'The Set version returns 2 instead of 3, because the prefix 0 appears three times (empty, after index 0, after index 1) and each earlier occurrence is a different valid start',
              'The Set version returns 0',
            ],
            answer: 2,
            explanation: 'Valid subarrays: [0] (index 0), [0] (index 1), [0, 0]. Prefix values: 0, 0, 0. At j = 0 there is one earlier 0 → +1. At j = 1 there are **two** earlier 0s → +2. A Set answers "is it there?" (+1 each time) → 2.',
            misconceptions: {
              0: 'Count by hand: three subarrays sum to 0. The Set loses the second start at j = 1.',
              1: 'Zeros are ordinary keys; nothing crashes — the answer is silently wrong.',
              3: 'Thanks to the initial 0 entry the Set still finds something at each step; it just undercounts.',
            },
            deeper: 'Rule: **count problems → store counts; longest problems → store the first index; existence problems → a Set is enough.**',
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-7',
            question: 'Inside the loop, why must we look up `cur − k` **before** adding `cur` to the map?',
            options: [
              'It does not matter',
              'Maps are faster when read first',
              'Because `cur` must be at least k',
              'Otherwise, when k = 0, the current prefix would match itself and count an empty subarray',
            ],
            answer: 3,
            explanation: 'The lookup must only see prefixes that end *strictly before* the current position, so that the subarray between them is non-empty. With k = 0, inserting first makes `cur − 0 = cur` always present.',
            misconceptions: {
              0: 'It matters exactly when k = 0 — a classic hidden-test failure.',
              1: 'Order has no performance impact.',
              2: 'Sums can be negative; there is no such requirement.',
            },
          },
        ],
      },
      {
        id: 'optimized-hashmap',
        title: 'Optimized approach — prefix sum + hash map',
        blocks: [
          {
            type: 'code',
            title: 'Subarray Sum Equals K — O(n)',
            code: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]); // empty prefix
  let cur = 0, count = 0;
  for (const x of nums) {
    cur += x;
    count += seen.get(cur - k) ?? 0;          // 1. look up first
    seen.set(cur, (seen.get(cur) ?? 0) + 1);  // 2. then record
  }
  return count;
}`,
          },
          {
            type: 'text',
            md: `**Longest instead of count** (e.g. Contiguous Array: longest subarray with equal 0s and 1s): map each 0 to −1 so the goal is "sum 0", and store the **first index** where each prefix appeared: \`first.set(0, -1)\` for the empty prefix. When \`cur\` repeats at index \`j\`, the subarray \`(first[cur], j]\` has sum 0 and length \`j − first[cur]\`. Never overwrite the first index — the earliest start gives the longest subarray.`,
          },
        ],
      },
      {
        id: 'optimized-modulo',
        title: 'Optimized approach — prefix sum modulo k',
        blocks: [
          {
            type: 'text',
            md: `A subarray sum is divisible by \`k\` iff \`(P_j − P_i) % k === 0\` iff **\`P_j\` and \`P_i\` have the same remainder mod k**. So instead of prefix values we key the map by prefix **remainders**:

- count problems: the number of earlier prefixes with the same remainder;
- existence with length ≥ 2: the first index of each remainder, and check \`j − first ≥ 2\`.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: "JavaScript's % is a remainder, not a modulo",
            md: `In JavaScript the result of \`%\` has the sign of the **dividend**: \`-1 % 5 === -1\`, \`-6 % 5 === -1\`, \`4 % 5 === 4\`. Mathematically -1 and 4 are the same class mod 5, but as map keys \`-1\` and \`4\` are different — you would miss matches.

Normalise: **\`((x % k) + k) % k\`** always lands in \`0 … k−1\`.`,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-8',
            question: '`k = 5`. Prefix sums so far are 4 and then −1. In JavaScript, `4 % 5` is 4 and `-1 % 5` is −1. Is the subarray between them divisible by 5?',
            options: [
              'Yes — −1 − 4 = −5 is divisible by 5; after normalising, both remainders are 4, so a correctly normalised map finds the match',
              'No, because the remainders 4 and −1 differ',
              'No, negative sums are never divisible',
              'It depends on the length of the subarray',
            ],
            answer: 0,
            explanation: 'The subarray sum is −1 − 4 = −5, a multiple of 5. `((−1 % 5) + 5) % 5 = 4`, matching the earlier remainder 4. Without normalising the map keys would be 4 and −1 and the match would be missed.',
            misconceptions: {
              1: 'That is exactly the bug: raw JS remainders differ even though the numbers are congruent mod 5.',
              2: '0, −5, −10… are all divisible by 5.',
              3: 'Divisibility depends only on the sum, not the length (Continuous Subarray Sum adds a separate length ≥ 2 rule).',
            },
          },
        ],
      },
      {
        id: 'intuition-difference',
        title: 'Core intuition — difference arrays',
        blocks: [
          {
            type: 'text',
            md: `A difference array stores **changes** instead of values: \`diff[i] = a[i] − a[i − 1]\`. The prefix sum of \`diff\` rebuilds \`a\`.

Adding \`v\` to the whole range \`[l, r]\` changes only **two** differences:
- at \`l\` the values jump up by \`v\` → \`diff[l] += v\`,
- right after \`r\` they drop back → \`diff[r + 1] −= v\`.

\`\`\`text
add 5 to [1, 3] in an array of 5 zeros
diff:    [0, +5, 0, 0, −5, 0]
prefix:  [0,  5, 5, 5,  0]      ← final array
\`\`\`

So u updates cost O(u), and one O(n) prefix pass produces the final array. Prefix sums and difference arrays are **inverse operations**, like integration and differentiation.`,
          },
          {
            type: 'checkpoint',
            id: 'prefix-sum-cp-9',
            question: 'Car pooling: a trip `[passengers, from, to]` means passengers get in at `from` and get **out at** `to`. On the diff array, where do you subtract?',
            options: [
              'At `to + 1`, like every inclusive range',
              'At `from`',
              'At `to`, because at position `to` they are no longer in the car (the range is half-open [from, to))',
              'Nowhere; you only add',
            ],
            answer: 2,
            explanation: 'Passengers occupy seats for positions from, from+1, …, to−1. At `to` they have left, so the occupancy drops exactly at `to`. Subtracting at `to + 1` would keep them in the car one stop too long and can report a false capacity violation.',
            misconceptions: {
              0: '`r + 1` is right for inclusive ranges like flight bookings [first, last]. Here the end is exclusive.',
              1: 'Adding and subtracting at the same position cancels the update.',
              3: 'Without the subtraction every passenger stays in the car forever.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why a difference array is the **reverse** of a prefix sum?',
            deeper: 'Prefix sum turns values into running totals; differencing turns running totals back into values. If `d` is the difference array of `a`, then `prefix(d) = a`. A range update on `a` is "add v to a block", which in the world of differences is "a +v step at l and a −v step after r". So we do cheap work in the difference world and convert back once — the same "change representation to make an operation cheap" idea behind many algorithms.',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'subarraySum([1, 2, 1, -1, 2], k = 3)',
            columns: ['j', 'nums[j]', 'cur', 'look for cur − k', 'found', 'count', 'map after'],
            rows: [
              ['—', '—', '0', '—', '—', '0', '{0:1}'],
              ['0', '1', '1', '-2', '0', '0', '{0:1, 1:1}'],
              ['1', '2', '3', '0', '1', '1', '{0:1, 1:1, 3:1}'],
              ['2', '1', '4', '1', '1', '2', '{…, 4:1}'],
              ['3', '-1', '3', '0', '1', '3', '{…, 3:2}'],
              ['4', '2', '5', '2', '0', '3', '{…, 5:1}'],
            ],
            note: 'Subarrays found: [1,2], [2,1], [1,2,1,-1]. Note [2,1] ends at j = 2 and starts after the prefix value 1.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Off-by-one conventions** — decide once: \`prefix\` has n + 1 entries and \`sum(l..r) = prefix[r + 1] − prefix[l]\`.
2. **Forgetting \`map.set(0, 1)\`** (or \`first.set(0, -1)\`) — subarrays starting at index 0 are missed.
3. **Insert before lookup** — breaks k = 0.
4. **Set instead of counts** — undercounts when prefixes repeat (zeros / negatives).
5. **Raw \`%\` on negatives** — normalise with \`((x % k) + k) % k\`.
6. **2D rows sharing one array** — \`fill(new Array(...))\`.
7. **Difference array end** — \`r + 1\` for inclusive ranges, \`to\` for half-open ones; allocate n + 1 slots.
8. **Using a sliding window with negatives.**`,
          },
          {
            type: 'reflect',
            prompt: 'Could you explain to a friend why "longest subarray with sum k" stores the **first** index of each prefix while "count subarrays with sum k" stores **counts**?',
            deeper: 'For the longest subarray ending at j we want the start as far left as possible, i.e. the earliest i with the needed prefix — later occurrences are never better, so we keep the first index and never overwrite. For counting, every occurrence is a distinct valid start, so we need how many there were. Same map, different value, chosen by what the question asks.',
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'Build O(n) (2D: O(m·n)); each range query O(1); hash-map counting O(n) average; difference array O(n + u)',
            space: 'O(n) for the prefix / diff array (O(m·n) in 2D); O(n) or O(k) for the hash map',
            md: `**Why hash-map counting is "O(n) average":** each step does one \`get\` and one \`set\`, which are O(1) on average for a hash map (Hashing topic). The worst case with adversarial collisions is worse, but in practice V8's Map is reliably fast.

**Modulo variant:** remainders are in \`0..k−1\`, so an array of size k can replace the Map → O(n + k) time, O(k) space.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- Say the **identity out loud**: "sum(i..j) = P[j+1] − P[i], so I need earlier prefixes equal to P − k."
- Explain **why a sliding window fails** when negatives are allowed — it shows you chose the tool deliberately.
- Mention the **initial map entry** and the **lookup-then-insert** order before the interviewer finds the bug.
- For modulo problems in JavaScript, **mention the negative remainder** explicitly.
- For many range updates, say "difference array: O(1) per update, one prefix pass at the end".
- **Edge cases:** single element, all zeros with k = 0, negative k/values, range covering the whole array, updates touching the last index.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'new Array(n + 1).fill(0)', use: 'Prefix / difference array with padding', complexity: 'O(n)' },
              { api: 'Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))', use: '2D table with independent rows', complexity: 'O(m·n)' },
              { api: 'new Map([[0, 1]])', use: 'Prefix → count, seeded with the empty prefix', complexity: 'O(1) average per op' },
              { api: 'map.get(key) ?? 0', use: 'Default 0 for missing counts', complexity: 'O(1)' },
              { api: '((x % k) + k) % k', use: 'Non-negative remainder', complexity: 'O(1)' },
              { api: 'arr.at(-1)', use: 'Last element when pushing running totals', complexity: 'O(1)' },
              { api: 'Float64Array / Int32Array', use: 'Compact zero-filled numeric arrays', complexity: 'O(n)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Many range-sum queries, no updates', 'Rectangle sums in a matrix', 'Count/longest subarrays with sum k (negatives OK)', 'Subarray sums divisible by k', 'Many range updates, one final read'],
    clues: ['sum between l and r', 'number of subarrays with sum k', 'negative numbers', 'divisible by k', 'equal 0s and 1s', 'bookings / passengers / add to range'],
    template: `const seen = new Map([[0, 1]]);
let cur = 0, count = 0;
for (const x of nums) {
  cur += x;
  count += seen.get(cur - k) ?? 0;
  seen.set(cur, (seen.get(cur) ?? 0) + 1);
}`,
    complexity: 'O(n) build, O(1) query; hash-map counting O(n) average time, O(n) space',
    mistakes: ['prefix off-by-one', 'missing map.set(0, 1)', 'insert before lookup (k = 0)', 'Set instead of counts', 'negative % in JS', 'shared 2D rows', 'diff end r+1 vs to'],
    jsTools: ['Array(n+1).fill(0)', 'Map', '?? 0', '((x%k)+k)%k', 'Array.from'],
  },

  keyConcepts: [
    'prefix[i] = sum of the first i elements; sum(l..r) = prefix[r + 1] − prefix[l].',
    'Range sums work because addition is invertible — there is no "prefix min".',
    '2D: inclusion–exclusion with four corners; add back the doubly-subtracted corner.',
    'Subarray sum k ⇔ two prefixes differ by k → hash map of prefix counts, seeded with {0: 1}.',
    'Store counts to count, first indices to find the longest, a Set for existence.',
    'Divisible by k ⇔ equal prefix remainders; normalise JS % with ((x % k) + k) % k.',
    'Difference arrays make range updates O(1); one prefix sum rebuilds the values.',
  ],

  interviewTips: [
    'State the prefix identity before coding.',
    'Explain why negatives rule out a sliding window.',
    'Call out the {0: 1} seed and lookup-before-insert order.',
  ],
};
