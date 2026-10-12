export default {
  id: 'next-greater-element-ii',
  title: 'Next Greater Element II',
  difficulty: 'Medium',
  order: 4,
  pattern: 'monotonic-stack-next-greater',
  tags: ['array', 'monotonic stack', 'circular array'],
  source: { platform: 'LeetCode', number: 503, url: 'https://leetcode.com/problems/next-greater-element-ii/' },

  statement: `\`nums\` is a **circular** array (after the last element comes the first). For every element, return the first value **strictly greater** than it that you meet when walking forward (wrapping around), or \`-1\` if none exists.`,
  examples: [
    { input: 'nums = [1,2,1]', output: '[2,-1,2]', explanation: 'The last 1 wraps around and finds 2.' },
    { input: 'nums = [1,2,3,4,3]', output: '[2,3,4,-1,4]' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],

  think: `- In a circular array, how far forward can you ever need to look? (At most n − 1 steps.)
- Can you simulate "walking around twice" without actually copying the array?
- Should you push indices during the second lap?`,
  patternChallenge: {
    options: ['Monotonic stack over 2n positions (i % n)', 'Sort + binary search', 'Two pointers', 'Kadane'],
    answer: 0,
    explanation: 'Next greater element → monotonic stack; circular → iterate 2n positions with i % n so elements near the end can be answered by elements near the start.',
  },
  hints: [
    'Run the normal next-greater loop for k = 0 .. 2n − 1 with i = k % n.',
    'Push indices only while k < n; the second lap only answers elements that are still waiting.',
  ],
  approach: `**Brute force:** for each i, walk up to n − 1 steps around the circle → O(n²).

**Monotonic stack over two laps (O(n)):** process indices \`k % n\` for k in [0, 2n). Pop while \`nums[top] < nums[i]\` and set \`res[top] = nums[i]\`. Push i only during the first lap. After two laps, anything left (the maximum values) has no greater element and stays −1.`,

  functionName: 'nextGreaterElements',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function nextGreaterElements(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The last 1 wraps around to find 2; the 2 itself has nothing greater.', args: [[1, 2, 1]], expected: [2, -1, 2] },
    { scenario: 'Example 2', hint: 'The final 3 needs the wrap-around to reach 4 — one lap is not enough.', args: [[1, 2, 3, 4, 3]], expected: [2, 3, 4, -1, 4] },
    { scenario: 'Single element', hint: 'An element is never greater than itself — the answer is −1.', args: [[5]], expected: [-1] },
    { scenario: 'All equal', hint: 'Equal values are not strictly greater; using <= would wrongly answer with the same value.', args: [[3, 3, 3]], expected: [-1, -1, -1] },
    { scenario: 'Strictly decreasing', hint: 'Everything after the first element must wrap around to reach the maximum at index 0.', args: [[5, 4, 3, 2, 1]], expected: [-1, 5, 5, 5, 5] },
    { scenario: 'Increasing then max at end', hint: 'The maximum gets −1; everything else is answered without wrapping.', args: [[1, 5, 3, 6, 8]], expected: [5, 6, 6, 8, -1] },
    { scenario: 'Negative values', hint: 'Negative numbers compare normally; −5 wraps to find −2.', args: [[-2, -1, -5]], expected: [-1, -1, -2] },
    { scenario: 'Two elements', hint: 'The smaller one finds the larger, the larger gets −1, either order.', args: [[7, 2]], expected: [-1, 7] },
    { scenario: 'Duplicate maximum', hint: 'Both copies of the maximum get −1; other values find the nearest one going forward.', args: [[4, 1, 4, 2]], expected: [-1, 4, -1, 4] },
    { scenario: 'Extreme values', hint: 'Values at ±10^9.', args: [[1000000000, -1000000000, 0, -1000000000]], expected: [-1, 0, 1000000000, 1000000000] },
    { scenario: 'Answer needs full wrap', hint: 'The element just after the maximum must walk almost the whole circle back to it.', args: [[2, 9, 1, 1, 1, 3]], expected: [9, -1, 3, 3, 3, 9] },
    { scenario: 'Max size, all equal', hint: '10^4 equal values: every answer is −1.', argsGen: '() => [new Array(10000).fill(42)]', expected: new Array(10000).fill(-1) },
    { scenario: 'Max size, decreasing', hint: '10^4 decreasing values — every element except the first wraps to the maximum at index 0.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 1000000000 - i)]', expected: Array.from({ length: 10000 }, (_, i) => (i === 0 ? -1 : 1000000000)) },
  ],
  solution: {
    code: `function nextGreaterElements(nums) {
  const n = nums.length;
  const res = new Array(n).fill(-1);
  const st = [];                          // indices waiting; values non-increasing
  for (let k = 0; k < 2 * n; k++) {
    const i = k % n;
    while (st.length && nums[st[st.length - 1]] < nums[i]) {
      res[st.pop()] = nums[i];
    }
    if (k < n) st.push(i);               // second lap only answers, never waits
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['k', 'i', 'nums[i]', 'pops', 'stack (idx)'],
    rows: [
      ['0', '0', '1', '—', '[0]'],
      ['1', '1', '2', '0 → 2', '[1]'],
      ['2', '2', '1', '—', '[1,2]'],
      ['3', '0', '1', '—', '[1,2] (no push)'],
      ['4', '1', '2', 'index 2 → 2', '[1]'],
      ['5', '2', '1', '—', '[1] → res [2,-1,2]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: '2n iterations; each index pushed once and popped at most once.' },
  alternative: {
    title: 'Concatenate the array',
    md: 'Build `nums.concat(nums)` and run the plain algorithm, keeping only the first n answers. Same complexity but allocates 2n extra elements.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Pushing during the second lap (wasted work; wrong in variants that count waiting elements).',
    'Iterating only n times — elements near the end never see the start.',
    'Using <= — equal values are not greater.',
  ],
};
