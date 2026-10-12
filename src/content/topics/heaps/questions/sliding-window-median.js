export default {
  id: 'sliding-window-median',
  title: 'Sliding Window Median',
  difficulty: 'Hard',
  order: 4,
  pattern: 'heap-two-heaps',
  tags: ['heap', 'two heaps', 'sliding window', 'lazy deletion'],
  source: { platform: 'LeetCode', number: 480, url: 'https://leetcode.com/problems/sliding-window-median/' },

  statement: `Given an integer array \`nums\` and a window size \`k\`, a window of size \`k\` slides from the left of the array to the right, one position at a time. Return the **median of each window** (the average of the two middle values when \`k\` is even).

Answers within 10⁻⁵ are accepted.`,
  examples: [
    { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[1,-1,-1,3,5,6]' },
    { input: 'nums = [1,2,3,4,2,3,1,4,2], k = 3', output: '[2,3,3,3,2,3,2]' },
  ],
  constraints: ['1 <= k <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],

  think: `- You already know how to maintain a median while numbers are **added** (two heaps). What new operation does a sliding window need?
- Heaps can remove the top cheaply, but not an arbitrary element. What if you just *remember* that an element should be gone?
- When would a "should be gone" element actually hurt you?`,
  patternChallenge: {
    options: ['Monotonic Deque', 'Heap — Two Heaps (with lazy deletion)', 'Sliding Window — Fixed Size with a running sum', 'Heap — Top K / Kth Element'],
    answer: 1,
    explanation: 'Medians need the lower/upper-half split (two heaps); the window adds removals, handled lazily. A monotonic deque gives window max/min, not the median; a running sum gives the mean.',
  },
  hints: [
    'Keep `low` (max-heap) and `high` (min-heap) plus real sizes that ignore pending deletions, and a Map `delayed` value → count.',
    'To remove x: delayed[x]++, decrement the real size of the heap x belongs to (x <= low.peek() → low), rebalance, and prune tops that are delayed.',
  ],
  approach: `**Brute force:** sort every window → O(n · k log k).

**Sorted window array:** binary-search insert/remove → O(n · k) because of shifting. Often acceptable in JS for moderate inputs.

**Two heaps + lazy deletion (O(n log n)):**
- \`low\` (max-heap), \`high\` (min-heap), real sizes \`lowSize\`, \`highSize\` that count only live elements; \`delayed\`: Map of values waiting to be removed.
- \`prune(heap)\`: while the top is in \`delayed\`, pop it and decrement its delayed count.
- **add x:** if \`low\` is empty or \`x <= low.peek()\` push to low, else to high; update sizes; rebalance.
- **remove x:** \`delayed[x]++\`; decrement the size of the side x lives on (\`x <= low.peek()\` → low); if x was the top of that side, prune it; rebalance.
- **rebalance:** keep \`lowSize === highSize\` or \`lowSize === highSize + 1\` by moving tops (then prune the heap you popped from).
- **median:** \`k\` odd → \`low.peek()\`, else \`(low.peek() + high.peek()) / 2\`.

Stale elements are never read because tops are always pruned before use.`,

  functionName: 'medianSlidingWindow',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function medianSlidingWindow(nums, k) {
  
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: 'Odd k: the median is the middle element of each sorted window.', args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [1, -1, -1, 3, 5, 6] },
    { scenario: 'Example 2', hint: 'Duplicate values enter and leave the window; lazy deletion must remove the right copy.', args: [[1, 2, 3, 4, 2, 3, 1, 4, 2], 3], expected: [2, 3, 3, 3, 2, 3, 2] },
    { scenario: 'Single element, k = 1', hint: 'Smallest input: the window is the element itself.', args: [[1], 1], expected: [1] },
    { scenario: 'Even k gives a fraction', hint: 'Even k: average the two middle values — 2.5, not 2.', args: [[1, 4], 2], expected: [2.5] },
    { scenario: 'k = 1', hint: 'Every element is its own median.', args: [[5, -2, 7, 0], 1], expected: [5, -2, 7, 0] },
    { scenario: 'k equals length', hint: 'One window covering the whole array.', args: [[1, 2, 3, 4], 4], expected: [2.5] },
    { scenario: 'Maximum values', hint: 'Two copies of 2^31 − 1: the average must not overflow or lose precision.', args: [[2147483647, 2147483647], 2], expected: [2147483647] },
    { scenario: 'Minimum and maximum mixed', hint: 'Averaging -2^31 and 2^31 − 1 gives -0.5.', args: [[-2147483648, 2147483647, -2147483648], 2], expected: [-0.5, -0.5] },
    { scenario: 'All equal values', hint: 'Equal values on both heaps: decide the side of a removed value consistently with low.peek().', args: [[5, 5, 5, 5], 2], expected: [5, 5, 5] },
    { scenario: 'Negative and zero values', hint: 'Mixed signs in an even window.', args: [[-1, 5, -3, 8, 0], 2], expected: [2, 1, 2.5, 4] },
    { scenario: 'Many duplicates, even k', hint: 'Stale (lazily deleted) elements must never surface as a heap top; prune after moving elements between heaps.', args: [[4, 1, 7, 1, 8, 7, 8, 7, 7, 4], 4], expected: [2.5, 4, 7, 7.5, 7.5, 7, 7] },
    { scenario: 'Decreasing sequence', hint: 'Each new element is the new minimum; rebalancing keeps the halves equal.', args: [[9, 8, 7, 6, 5, 4, 3, 2, 1], 3], expected: [8, 7, 6, 5, 4, 3, 2] },
    { scenario: 'Large input, k = 1000', hint: 'n = 10^5, k = 1000: sorting every window is O(n·k log k) — far too slow. (Every window here is a shuffle of 0..999.)', argsGen: '() => { let s = 12345; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const P = 1000, p = Array.from({ length: P }, (_, i) => i); for (let i = P - 1; i > 0; i--) { const j = r() % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } return [Array.from({ length: 100000 }, (_, i) => p[i % P]), P]; }', expected: Array(99001).fill(499.5), timeLimitMs: 1000 },
    { scenario: 'Large input, k = 50000', hint: 'n = 10^5 with a huge window: two heaps with lazy deletion stay O(n log n). Large values and negatives too.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const P = 50000, p = Array.from({ length: P }, (_, i) => i * 40000 - 1000000000); for (let i = P - 1; i > 0; i--) { const j = r() % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } return [Array.from({ length: 100000 }, (_, i) => p[i % P]), P]; }', expected: Array(50001).fill(-20000), timeLimitMs: 2000 },
  ],

  solution: {
    code: `function medianSlidingWindow(nums, k) {
  const low = new MaxHeap();    // smaller half
  const high = new MinHeap();   // larger half
  const delayed = new Map();    // value -> how many copies are logically deleted
  let lowSize = 0, highSize = 0; // live elements only

  const prune = (heap) => {
    while (!heap.isEmpty() && (delayed.get(heap.peek()) ?? 0) > 0) {
      const v = heap.pop();
      delayed.set(v, delayed.get(v) - 1);
    }
  };
  const rebalance = () => {
    if (lowSize > highSize + 1) {
      high.push(low.pop()); lowSize--; highSize++; prune(low);
    } else if (highSize > lowSize) {
      low.push(high.pop()); highSize--; lowSize++; prune(high);
    }
  };
  const add = (x) => {
    if (low.isEmpty() || x <= low.peek()) { low.push(x); lowSize++; }
    else { high.push(x); highSize++; }
    rebalance();
  };
  const remove = (x) => {
    delayed.set(x, (delayed.get(x) ?? 0) + 1);
    if (x <= low.peek()) { lowSize--; if (x === low.peek()) prune(low); }
    else { highSize--; if (x === high.peek()) prune(high); }
    rebalance();
  };
  const median = () => (k % 2 === 1 ? low.peek() : (low.peek() + high.peek()) / 2);

  const out = [];
  for (let i = 0; i < nums.length; i++) {
    add(nums[i]);
    if (i >= k) remove(nums[i - k]);
    if (i >= k - 1) out.push(median());
  }
  return out;
}`,
    explanation: 'Adding before removing keeps both heaps non-empty when remove() peeks. Values up to 2³¹ − 1 sum to < 2³², safely exact in JS numbers.',
  },
  dryRun: {
    columns: ['i', 'window', 'low (live)', 'high (live)', 'median'],
    rows: [
      ['2', '[1, 3, -1]', '{-1, 1}', '{3}', '1'],
      ['3', '[3, -1, -3]', '{-3, -1}', '{3} (1 delayed)', '-1'],
      ['4', '[-1, -3, 5]', '{-3, -1}', '{5} (3 removed)', '-1'],
      ['5', '[-3, 5, 3]', '{-3, 3}', '{5}', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Each element is pushed once and popped at most once (possibly lazily); heaps may hold stale items, so sizes are bounded by n rather than k.' },
  alternative: {
    title: 'Sorted window with binary search',
    code: `function medianSlidingWindow(nums, k) {
  const lowerBound = (a, x) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; } return lo; };
  const win = nums.slice(0, k).sort((a, b) => a - b);
  const med = () => (k % 2 ? win[k >> 1] : (win[k / 2 - 1] + win[k / 2]) / 2);
  const out = [med()];
  for (let i = k; i < nums.length; i++) {
    win.splice(lowerBound(win, nums[i - k]), 1);
    win.splice(lowerBound(win, nums[i]), 0, nums[i]);
    out.push(med());
  }
  return out;
}`,
    md: 'Simpler to write; O(n·k) due to splice shifting, but splice is fast memmove in practice.',
    complexity: 'O(n · k) time, O(k) space',
  },
  mistakes: [
    'Counting delayed elements in the heap sizes (use separate live-size counters).',
    'Forgetting to prune after moving an element between heaps (a stale top can surface).',
    'Deciding which heap a removed value belongs to by comparing with high.peek() when low holds equal values — compare with low.peek() consistently with how you add.',
  ],
};
