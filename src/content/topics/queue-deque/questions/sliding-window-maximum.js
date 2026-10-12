export default {
  id: 'sliding-window-maximum',
  title: 'Sliding Window Maximum',
  difficulty: 'Hard',
  order: 1,
  pattern: 'monotonic-deque-window',
  tags: ['array', 'sliding window', 'monotonic deque'],
  source: { platform: 'LeetCode', number: 239, url: 'https://leetcode.com/problems/sliding-window-maximum/' },

  statement: `A window of size \`k\` slides over the integer array \`nums\` from left to right, one position at a time. Return an array containing the **maximum** of each window position (there are \`n − k + 1\` of them).`,
  examples: [
    { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]' },
    { input: 'nums = [1], k = 1', output: '[1]' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '1 <= k <= nums.length'],

  think: `- A running sum can be updated when an element leaves. Why can't a running maximum?
- When a new, larger element enters, what can you say about smaller elements that entered **before** it?
- What must you store so that you can tell when the current maximum has left the window?`,
  patternChallenge: {
    options: ['Max-heap of the whole array', 'Monotonic deque of indices', 'Monotonic stack', 'Prefix maximum array'],
    answer: 1,
    explanation: 'Window + maximum → monotonic deque: pop dominated elements from the back, expired ones from the front, read the max at the front, O(n). A heap works in O(n log n) with lazy deletion; a monotonic stack cannot expire old elements from the bottom; prefix maxima ignore the left edge.',
  },
  hints: [
    'Keep a deque of indices whose values are decreasing. Before pushing i, pop from the back every index with nums[back] <= nums[i].',
    'If the front index is <= i − k it has left the window: pop it. Once i >= k − 1, nums[front] is the window maximum.',
  ],
  approach: `**Brute force:** compute the max of each window → O(n·k) (up to 5·10^9).

**Heap:** push [value, index]; pop the top while its index is outside the window → O(n log n).

**Monotonic deque (O(n)):** an older element smaller than a newer one can never be a maximum again (the newer one is in every later window that still contains the older). So keep only a decreasing sequence of candidates (as indices):
1. pop back while \`nums[back] <= nums[i]\`; push i;
2. pop front if \`front <= i − k\`;
3. if \`i >= k − 1\`, output \`nums[front]\`.
Each index is pushed and popped once.`,

  functionName: 'maxSlidingWindow',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function maxSlidingWindow(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Six windows of size 3; the max changes as old values leave and bigger ones arrive.', args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7] },
    { scenario: 'Example 2', hint: 'Smallest input: one element, one window.', args: [[1], 1], expected: [1] },
    { scenario: 'Max leaves the window', hint: 'Once 9 slides out it must stop being reported — store indices so you can tell when the front expires.', args: [[9, 1, 1, 1], 2], expected: [9, 1, 1] },
    { scenario: 'k equals n', hint: 'Only one window — do not output before the first window is complete.', args: [[1, 2, 3, 4], 4], expected: [4] },
    { scenario: 'k = 1', hint: 'Every window is a single element, so the output equals the input.', args: [[1, -1, 5], 1], expected: [1, -1, 5] },
    { scenario: 'Strictly decreasing', hint: 'Nothing is ever popped from the back; the front expires every step (leaving index is i − k).', args: [[4, 3, 2, 1], 2], expected: [4, 3, 2] },
    { scenario: 'Strictly increasing', hint: 'Every new element pops everything behind it.', args: [[1, 2, 3, 4, 5], 2], expected: [2, 3, 4, 5] },
    { scenario: 'Negatives and repeated max', hint: 'The 7 appears twice; the max must survive when the first copy leaves.', args: [[-7, -8, 7, 5, 7, 1, 6, 0], 4], expected: [7, 7, 7, 7, 7] },
    { scenario: 'All equal', hint: 'Ties: every window max is the same value.', args: [[2, 2, 2, 2], 3], expected: [2, 2] },
    { scenario: 'All negative', hint: 'Initialising the max with 0 would be wrong here.', args: [[-5, -3, -9, -1, -4], 2], expected: [-3, -3, -1, -1] },
    { scenario: 'Value bounds', hint: 'Values at ±10^4.', args: [[-10000, 10000, -10000, -10000, 10000], 3], expected: [10000, 10000, 10000] },
    { scenario: 'Large decreasing, k = n/2 (n = 10^5)', hint: 'Rescanning each window is O(n·k) ≈ 2.5·10^9 here; a deque of indices gives O(n). Avoid shift() for popFront.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => 10000 - Math.floor(i / 5)), 50000]', expected: Array.from({ length: 50001 }, (_, s) => 10000 - Math.floor(s / 5)), timeLimitMs: 1000 },
    { scenario: 'Large sawtooth, k = n/2 (n = 10^5)', hint: 'Every window contains a peak of 10000; the deque keeps it while smaller values come and go.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i % 20001) - 10000), 50000]', expected: new Array(50001).fill(10000), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function maxSlidingWindow(nums, k) {
  const dq = new Deque();   // indices; nums[...] decreasing from front to back
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    // 1. Older, smaller-or-equal values can never be a maximum again.
    while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack();
    dq.pushBack(i);
    // 2. The front may have slid out of the window.
    if (dq.front() <= i - k) dq.popFront();
    // 3. Front = maximum of the current window.
    if (i >= k - 1) res.push(nums[dq.front()]);
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'deque (values)', 'output'],
    rows: [
      ['0', '1', '[1]', ''],
      ['1', '3', '[3]', ''],
      ['2', '-1', '[3,-1]', '3'],
      ['3', '-3', '[3,-1,-3]', '3'],
      ['4', '5', '[5]', '5'],
      ['5', '3', '[5,3]', '5'],
      ['6', '6', '[6]', '6'],
      ['7', '7', '[7]', '7'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(k)', explanation: 'Each index is pushed and popped at most once; the deque never holds more than k indices.' },
  alternative: {
    title: 'Block prefix/suffix maxima',
    md: 'Split the array into blocks of size k. prefixMax[i] = max from the block start to i, suffixMax[i] = max from i to the block end. The window [i, i+k−1] spans at most two blocks, so its max = max(suffixMax[i], prefixMax[i+k−1]). O(n) time, no deque.',
    code: `function maxSlidingWindow(nums, k) {
  const n = nums.length, pre = new Array(n), suf = new Array(n);
  for (let i = 0; i < n; i++) pre[i] = i % k === 0 ? nums[i] : Math.max(pre[i - 1], nums[i]);
  for (let i = n - 1; i >= 0; i--) suf[i] = (i === n - 1 || (i + 1) % k === 0) ? nums[i] : Math.max(suf[i + 1], nums[i]);
  const res = [];
  for (let i = 0; i + k <= n; i++) res.push(Math.max(suf[i], pre[i + k - 1]));
  return res;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Storing values in the deque — cannot detect when the max leaves.',
    'Outputting before the first window is complete.',
    'Using arr.shift() for popFront (O(n) each).',
    'Expiry off-by-one: the index leaving at step i is i − k.',
  ],
};
