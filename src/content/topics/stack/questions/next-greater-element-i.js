export default {
  id: 'next-greater-element-i',
  title: 'Next Greater Element I',
  difficulty: 'Easy',
  order: 3,
  pattern: 'monotonic-stack-next-greater',
  tags: ['array', 'hash map', 'monotonic stack'],
  source: { platform: 'LeetCode', number: 496, url: 'https://leetcode.com/problems/next-greater-element-i/' },

  statement: `You get two arrays of **distinct** integers, \`nums1\` and \`nums2\`, where every value of \`nums1\` also appears in \`nums2\`.

For each value \`x\` of \`nums1\`, find \`x\` inside \`nums2\` and return the first value to its **right** in \`nums2\` that is greater than \`x\`, or \`-1\` if there is none. Return the answers in the order of \`nums1\`.`,
  examples: [
    { input: 'nums1 = [4,1,2], nums2 = [1,3,4,2]', output: '[-1,3,-1]', explanation: '4: nothing larger to its right. 1: next larger is 3. 2: last element.' },
    { input: 'nums1 = [2,4], nums2 = [1,2,3,4]', output: '[3,-1]' },
  ],
  constraints: ['1 <= nums1.length <= nums2.length <= 1000', '0 <= values <= 10^4', 'All values are distinct; nums1 ⊆ nums2'],

  think: `- Could you compute the next greater element for **every** value of nums2 at once?
- How would you then answer the queries from nums1 in O(1) each?`,
  patternChallenge: {
    options: ['Monotonic stack + hash map', 'Binary search', 'Two pointers', 'Sorting'],
    answer: 0,
    explanation: '"First greater value to the right" is the next greater element — a monotonic stack computes it for all of nums2 in O(n). Values are distinct, so a Map value → answer serves the nums1 queries.',
  },
  hints: [
    'Scan nums2 with a stack of values waiting for a greater one (decreasing from bottom to top).',
    'When x pops a value v, store next.set(v, x). Afterwards map each nums1 value with next.get(v) ?? -1.',
  ],
  approach: `**Brute force:** for each x in nums1, find it in nums2 and scan right → O(m · n).

**Monotonic stack (O(m + n)):** one pass over nums2. While the top of the stack is smaller than the current value, the current value is its next greater: record it in a Map and pop. Push the current value. Values never popped have no next greater. Answer each query with the Map.`,

  functionName: 'nextGreaterElement',
  paramNames: ['nums1', 'nums2'],
  starterCode: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */
function nextGreaterElement(nums1, nums2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '4 has nothing larger to its right in nums2, 1 is followed by 3, 2 is last.', args: [[4, 1, 2], [1, 3, 4, 2]], expected: [-1, 3, -1] },
    { scenario: 'Example 2', hint: 'Answers come back in the order of nums1, not nums2.', args: [[2, 4], [1, 2, 3, 4]], expected: [3, -1] },
    { scenario: 'Single element', hint: 'Smallest input: nothing to the right, so −1.', args: [[1], [1]], expected: [-1] },
    { scenario: 'Decreasing nums2', hint: 'No value ever has a greater one to its right — all −1.', args: [[5, 4, 3], [5, 4, 3, 2, 1]], expected: [-1, -1, -1] },
    { scenario: 'Increasing nums2', hint: 'Each value is answered by its immediate right neighbour.', args: [[1, 2, 3], [1, 2, 3, 4]], expected: [2, 3, 4] },
    { scenario: 'One value resolves many', hint: '7 is the answer for every waiting value — pop with while, not if.', args: [[6, 2], [6, 5, 4, 3, 2, 1, 7]], expected: [7, 7] },
    { scenario: 'nums1 in different order', hint: 'Build the answers over nums2, then look them up for nums1 in its own order.', args: [[3, 1, 5, 7, 9, 2, 6], [1, 2, 3, 5, 6, 7, 9, 11]], expected: [5, 2, 6, 9, 11, 3, 7] },
    { scenario: 'Zero value present', hint: '0 is a valid value — look-ups must not treat it as missing.', args: [[0, 3], [3, 0, 1]], expected: [1, -1] },
    { scenario: 'Greater value is not adjacent', hint: 'The next greater element can be far to the right, past smaller values.', args: [[5], [5, 1, 2, 3, 4, 6]], expected: [6] },
    { scenario: 'Max values', hint: 'Values at the 10^4 limit; the largest value always gets −1.', args: [[10000, 9999], [9999, 0, 10000]], expected: [-1, 10000] },
    { scenario: 'Subset of nums2', hint: 'Only some values of nums2 are queried; run the stack over all of nums2 anyway.', args: [[8, 2], [2, 9, 8, 1, 3, 10]], expected: [10, 9] },
    { scenario: 'Max size (1000)', hint: 'nums2 is a scrambled permutation of 1000 distinct values; ten of them are queried.', argsGen: '() => { const b = Array.from({ length: 1000 }, (_, i) => (i * 7919) % 1009); return [[b[0], b[1], b[10], b[500], b[998], b[999], b[123], b[777], b[42], b[640]], b]; }', expected: [856, 947, 885, 887, -1, -1, 902, 884, 881, 991] },
    { scenario: 'Max size, decreasing', hint: 'Every value of a 1000-long decreasing array waits on the stack; only the final larger value resolves them.', argsGen: '() => { const b = Array.from({ length: 999 }, (_, i) => 5000 - i); b.push(10000); return [[5000, 4500, 4002, 10000], b]; }', expected: [10000, 10000, 10000, -1] },
  ],
  solution: {
    code: `function nextGreaterElement(nums1, nums2) {
  const next = new Map();          // value → its next greater value in nums2
  const stack = [];                // values waiting, decreasing bottom → top
  for (const x of nums2) {
    while (stack.length && stack[stack.length - 1] < x) {
      next.set(stack.pop(), x);
    }
    stack.push(x);
  }
  return nums1.map((v) => next.get(v) ?? -1);
}`,
  },
  dryRun: {
    columns: ['x', 'pops', 'stack', 'next map'],
    rows: [
      ['1', '—', '[1]', '{}'],
      ['3', '1 → 3', '[3]', '{1:3}'],
      ['4', '3 → 4', '[4]', '{1:3, 3:4}'],
      ['2', '—', '[4,2]', '{1:3, 3:4}'],
      ['queries', '', '', '4 → -1, 1 → 3, 2 → -1'],
    ],
  },
  complexity: { time: 'O(m + n)', space: 'O(n)', explanation: 'Each nums2 value is pushed and popped at most once; the Map holds up to n entries.' },
  alternative: {
    title: 'Brute force with indexOf',
    md: 'For each query find its index in nums2 and scan right. Fine for n ≤ 1000 (≈10^6 steps) but does not scale.',
    complexity: 'O(m · n) time, O(1) space',
  },
  mistakes: [
    'Using `next.get(v) || -1` — works here, but `??` is the safe default operator (0 is a valid value in general).',
    'Running the stack over nums1 instead of nums2.',
    'Using if instead of while when popping.',
  ],
};
