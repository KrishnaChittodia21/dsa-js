export default {
  id: 'jump-game-vi',
  title: 'Jump Game VI',
  difficulty: 'Medium',
  order: 6,
  pattern: 'monotonic-deque-dp',
  tags: ['array', 'dynamic programming', 'monotonic deque'],
  source: { platform: 'LeetCode', number: 1696, url: 'https://leetcode.com/problems/jump-game-vi/' },

  statement: `You stand on index \`0\` of the integer array \`nums\`. In one move you may jump forward **at most \`k\` steps**: from index \`i\` to any index in \`[i + 1, min(n − 1, i + k)]\`.

Your **score** is the sum of \`nums[j]\` over every index \`j\` you stand on (including 0 and the last index). Return the maximum score you can have when you reach index \`n − 1\`.`,
  examples: [
    { input: 'nums = [1,-1,-2,4,-7,3], k = 2', output: '7', explanation: 'Path 0 → 1 → 3 → 5: 1 − 1 + 4 + 3 = 7.' },
    { input: 'nums = [10,-5,-2,4,0,3], k = 3', output: '17', explanation: 'Path 0 → 3 → 5: 10 + 4 + 3.' },
    { input: 'nums = [1,-5,-20,4,-1,3,-6,-3], k = 2', output: '0' },
  ],
  constraints: ['1 <= nums.length, k <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- Define \`best[i]\` = "the best score with which I can stand on index i". From where could you have jumped to i?
- Write best[i] in terms of earlier best values. How many earlier values does it look at?
- That inner "max of the last k values" slides along as i grows. Which structure answers sliding-window maxima in O(1)?`,
  patternChallenge: {
    options: ['Greedy: always jump to the largest value in reach', 'BFS', 'DP + monotonic deque (sliding window max over dp)', 'Sort the array'],
    answer: 2,
    explanation: 'best[i] = nums[i] + max(best[i−k..i−1]) — a DP whose transition is a sliding-window maximum, so a monotonic deque makes it O(n). Greedy fails: jumping to the largest nearby value can force you through worse values later.',
  },
  hints: [
    'best[0] = nums[0]; best[i] = nums[i] + max(best[j]) for j in [i − k, i − 1].',
    'Keep a deque of indices with decreasing best values. For each i: drop the front if it is < i − k, compute best[i] from the front, then pop backs with best <= best[i] and push i.',
  ],
  approach: `**Brute force DP (O(n·k)):** \`best[i] = nums[i] + max over j ∈ [i−k, i−1] of best[j]\` with a loop over the k previous values — up to 10^10 steps. Too slow.

**Deque-optimised DP (O(n)):** the inner max is the maximum of a window of size k sliding over the \`best\` array. Maintain a deque of indices whose best values are decreasing:
1. expire the front if it is out of reach (\`< i − k\`);
2. \`best[i] = nums[i] + best[front]\`;
3. pop the back while its best ≤ best[i] (dominated), push i.
The answer is \`best[n − 1]\`. (Greedy choices do not work because a big value now may lead into a region you must cross expensively.)`,

  functionName: 'maxResult',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function maxResult(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Path 0 → 1 → 3 → 5 skips −2 and −7.', args: [[1, -1, -2, 4, -7, 3], 2], expected: 7 },
    { scenario: 'Example 2', hint: 'With k = 3 you can jump 0 → 3 → 5 directly.', args: [[10, -5, -2, 4, 0, 3], 3], expected: 17 },
    { scenario: 'Example 3', hint: 'Greedy "jump to the biggest reachable number" fails here; you need DP over the window.', args: [[1, -5, -20, 4, -1, 3, -6, -3], 2], expected: 0 },
    { scenario: 'Single element', hint: 'You start on the last index — the score is nums[0].', args: [[5], 1], expected: 5 },
    { scenario: 'k = 1 walks every index', hint: 'With k = 1 you must step on every element.', args: [[1, -1, -1, -1, 1], 1], expected: -1 },
    { scenario: 'k covers the whole array', hint: 'You can jump straight from the first to the last index.', args: [[1, -1, -1, -1, 1], 4], expected: 2 },
    { scenario: 'All negative, big k', hint: 'You must still stand on the first and last index; skip everything in between.', args: [[-1, -2, -3], 5], expected: -4 },
    { scenario: 'Expire before using the front', hint: 'Index 0 (score 10) is out of reach for the last index — expire the front before reading it, not after.', args: [[10, -100, -100, 1], 2], expected: -89 },
    { scenario: 'Two elements', hint: 'Both endpoints are always counted.', args: [[-3, -4], 1], expected: -7 },
    { scenario: 'Must take a negative bridge', hint: 'A gap of negatives longer than k forces you onto the least-bad one.', args: [[2, -9, -1, -9, 5], 2], expected: 6 },
    { scenario: 'Extreme values', hint: 'Values at ±10^4.', args: [[-10000, 10000, -10000, 10000, -10000], 2], expected: 0 },
    { scenario: 'Large, k = n/2 (n = 10^5)', hint: 'Looping over the k previous states is O(n·k) ≈ 5·10^9 here; a monotonic deque gives the window max in O(1).', argsGen: '() => { let s = 777; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => (r() % 20001) - 10000), 50000]; }', expected: 247487796, timeLimitMs: 1000 },
    { scenario: 'Large all negative (n = 10^5)', hint: 'Every value is negative and k is huge — the best path jumps as far as possible over the worst values.', argsGen: '() => { let s = 777; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => -1 - (r() % 10000)), 70000]; }', expected: -6145, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function maxResult(nums, k) {
  const n = nums.length;
  const best = new Array(n);          // best[i] = best score standing on i
  const dq = new Deque();             // indices, best[...] decreasing front → back
  best[0] = nums[0];
  dq.pushBack(0);
  for (let i = 1; i < n; i++) {
    if (dq.front() < i - k) dq.popFront();          // out of jumping range
    best[i] = nums[i] + best[dq.front()];           // come from the best reachable index
    while (!dq.isEmpty() && best[dq.back()] <= best[i]) dq.popBack();
    dq.pushBack(i);
  }
  return best[n - 1];
}`,
    explanation: 'Only one index can expire per step because the window moves by one, so an `if` is enough for the front.',
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'front (best)', 'best[i]', 'deque (best values)'],
    rows: [
      ['0', '1', '—', '1', '[1]'],
      ['1', '-1', '1', '0', '[1,0]'],
      ['2', '-2', '1', '-1', '[1,0,-1]'],
      ['3', '4', '0 (index 0 expired)', '4', '[4]'],
      ['4', '-7', '4', '-3', '[4,-3]'],
      ['5', '3', '4', '7', '[7]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each index is pushed and popped from the deque at most once; the best array has n entries.' },
  alternative: {
    title: 'DP + max-heap with lazy deletion',
    md: 'Push [best[i], i] into a max-heap; before using the top, discard entries with index < i − k. O(n log n).',
    code: `function maxResult(nums, k) {
  const heap = new PriorityQueue((a, b) => b[0] - a[0]);
  heap.push([nums[0], 0]);
  let cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    while (heap.peek()[1] < i - k) heap.pop();
    cur = nums[i] + heap.peek()[0];
    heap.push([cur, i]);
  }
  return cur;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Greedy "jump to the biggest reachable number" — fails on many inputs.',
    'Inner loop over k previous states — O(n·k) times out.',
    'Expiring the front after computing best[i] (may use an unreachable index).',
  ],
};
