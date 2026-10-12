export default {
  id: 'constrained-subsequence-sum',
  title: 'Constrained Subsequence Sum',
  difficulty: 'Hard',
  order: 3,
  pattern: 'monotonic-deque-dp',
  tags: ['array', 'dynamic programming', 'monotonic deque'],
  source: { platform: 'LeetCode', number: 1425, url: 'https://leetcode.com/problems/constrained-subsequence-sum/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, choose a **non-empty subsequence** (keep some elements, in their original order) such that for every two **consecutive chosen** elements at indices \`i < j\`, \`j − i <= k\`.

Return the maximum possible sum of such a subsequence.`,
  examples: [
    { input: 'nums = [10,2,-10,5,20], k = 2', output: '37', explanation: 'Choose [10, 2, 5, 20]: gaps are at most 2.' },
    { input: 'nums = [-1,-2,-3], k = 1', output: '-1', explanation: 'The subsequence must be non-empty.' },
    { input: 'nums = [10,-2,-10,-5,20], k = 2', output: '23', explanation: '[10, -2, -5, 20].' },
  ],
  constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- Define \`best[i]\` = "the best sum of a valid subsequence whose **last** chosen element is nums[i]". What are the options for the element chosen before i?
- Unlike Jump Game VI, the subsequence may **start** at i. How does that change the formula?
- Which earlier best values are allowed, and how do you get their maximum quickly?`,
  patternChallenge: {
    options: ['Greedy: take every positive number', 'Kadane on the whole array', 'DP + monotonic deque over the last k states', 'Sort and take the largest'],
    answer: 2,
    explanation: 'best[i] = nums[i] + max(0, max(best[i−k..i−1])) — a DP whose transition is a sliding-window maximum → monotonic deque, O(n). Taking all positives can violate the gap rule; plain Kadane ignores the ability to skip elements.',
  },
  hints: [
    'best[i] = nums[i] + max(0, max of best[j] for j in [i − k, i − 1]). The 0 means "start a new subsequence at i".',
    'Keep a deque of indices with decreasing best values; expire indices < i − k from the front, and push i after popping backs with smaller-or-equal best. Answer = max over all best[i].',
  ],
  approach: `**Brute force DP (O(n·k)):** \`best[i] = nums[i] + max(0, best[i−1], …, best[i−k])\`; answer = max(best). Correct but up to 10^10 steps.

Why "max with 0"? A subsequence may start anywhere; if every reachable previous best is negative, starting fresh at i is better (Kadane's "extend or restart", with a window).

**Deque optimisation (O(n)):** the inner maximum over \`best[i−k..i−1]\` is a sliding window maximum. Keep a decreasing deque of indices:
1. pop the front while it is < i − k;
2. \`best[i] = nums[i] + max(0, best[front])\`;
3. pop backs with best ≤ best[i]; push i;
4. track the overall maximum.`,

  functionName: 'constrainedSubsetSum',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function constrainedSubsetSum(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Skip −10 (the gap from 2 to 5 is exactly k = 2) and take everything else.', args: [[10, 2, -10, 5, 20], 2], expected: 37 },
    { scenario: 'Example 2', hint: 'All negative: the subsequence is non-empty, so the answer is the largest element, not 0.', args: [[-1, -2, -3], 1], expected: -1 },
    { scenario: 'Example 3', hint: 'Sometimes a negative element must be taken to bridge a gap to a large positive one.', args: [[10, -2, -10, -5, 20], 2], expected: 23 },
    { scenario: 'Single element', hint: 'Smallest input: the only element is the answer.', args: [[5], 1], expected: 5 },
    { scenario: 'Single negative element', hint: 'Initialising the answer with 0 returns 0 here instead of −7.', args: [[-7], 1], expected: -7 },
    { scenario: 'Bridge negatives (k = 2)', hint: 'With k = 2 you must take one −1 between 3 and 4.', args: [[-5, 3, -1, -1, -1, 4], 2], expected: 6 },
    { scenario: 'Jump over negatives (k = 4)', hint: 'A larger k lets you jump straight from 3 to 4.', args: [[-5, 3, -1, -1, -1, 4], 4], expected: 7 },
    { scenario: 'All positive', hint: 'Take every element.', args: [[1, 2, 3], 3], expected: 6 },
    { scenario: 'Best ends early', hint: 'The best subsequence ends before the last index — return the max over all i, not best[n − 1].', args: [[5, 6, -100, -100], 1], expected: 11 },
    { scenario: 'Best starts late', hint: 'A subsequence can start anywhere: do not carry a negative prefix (use max(0, …)).', args: [[-10, -10, 4, 5], 1], expected: 9 },
    { scenario: 'k = 1 (contiguous)', hint: 'With k = 1 chosen elements must be adjacent — this is maximum subarray.', args: [[-8269, 3217, -4023, -4138, -683, 6455, -3621, 9242, 4015, -3790], 1], expected: 16091 },
    { scenario: 'Extreme values', hint: 'Values at ±10^4 with k = n.', args: [[-10000, 10000, -10000, 10000], 4], expected: 20000 },
    { scenario: 'Large, k = n/2 (n = 10^5)', hint: 'An O(n·k) scan of the window is ~5·10^9 steps; keep the window maximum in a monotonic deque.', argsGen: '() => { let s = 4242; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => (r() % 20001) - 10000), 50000]; }', expected: 247683490, timeLimitMs: 1000 },
    { scenario: 'Large all negative (n = 10^5)', hint: 'Every value is negative at full size; the answer is the largest single element.', argsGen: '() => { let s = 4242; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => -1 - (r() % 10000)), 60000]; }', expected: -1, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function constrainedSubsetSum(nums, k) {
  const n = nums.length;
  const best = new Array(n);    // best[i] = best sum of a valid subsequence ending at i
  const dq = new Deque();       // indices, best[...] decreasing
  let answer = -Infinity;
  for (let i = 0; i < n; i++) {
    if (!dq.isEmpty() && dq.front() < i - k) dq.popFront();     // too far back
    const prev = dq.isEmpty() ? 0 : Math.max(0, best[dq.front()]); // extend or start fresh
    best[i] = nums[i] + prev;
    answer = Math.max(answer, best[i]);
    while (!dq.isEmpty() && best[dq.back()] <= best[i]) dq.popBack();
    dq.pushBack(i);
  }
  return answer;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'max(0, window best)', 'best[i]', 'deque (best values)', 'answer'],
    rows: [
      ['0', '10', '0', '10', '[10]', '10'],
      ['1', '2', '10', '12', '[12]', '12'],
      ['2', '-10', '12', '2', '[12,2]', '12'],
      ['3', '5', '12', '17', '[17]', '17'],
      ['4', '20', '17', '37', '[37]', '37'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every index is pushed and popped from the deque at most once.' },
  alternative: {
    title: 'DP + max-heap with lazy deletion',
    md: 'Same recurrence; keep [best, index] in a max-heap and discard tops whose index < i − k. O(n log n).',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Forgetting max(0, …) — a subsequence may start at any index.',
    'Returning best[n − 1] instead of the maximum over all i (the subsequence can end anywhere).',
    'Initialising the answer with 0 — all-negative input must return its largest element.',
  ],
};
