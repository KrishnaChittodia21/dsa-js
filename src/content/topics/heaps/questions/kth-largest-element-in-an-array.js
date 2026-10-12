export default {
  id: 'kth-largest-element-in-an-array',
  title: 'Kth Largest Element in an Array',
  difficulty: 'Medium',
  order: 1,
  pattern: 'heap-top-k',
  tags: ['heap', 'quickselect', 'array'],
  source: { platform: 'LeetCode', number: 215, url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, return the **k-th largest** element — the k-th element in descending sorted order, counting duplicates separately (so it is *not* the k-th largest distinct value).

Can you do it without fully sorting the array?`,
  examples: [
    { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' },
    { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4', explanation: 'Descending: 6,5,5,4,… → 4th is 4.' },
  ],
  constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- Sorting works in O(n log n). Can you avoid ordering the elements you do not care about?
- If you keep only the k largest seen so far, which one is the answer?
- What does quickselect do differently from quicksort?`,
  patternChallenge: {
    options: ['Heap — Two Heaps', 'Heap — Top K / Kth Element', 'Binary Search on a sorted array', 'Sliding Window'],
    answer: 1,
    explanation: '"k-th largest" is the canonical Top-K signal: a size-k min-heap whose top is the answer (or quickselect). Two heaps are for medians; there is no sorted array or window here.',
  },
  hints: [
    'Min-heap of size k: push each number, pop when size > k.',
    'After processing all numbers, heap.peek() is the k-th largest. (Alternative: quickselect for O(n) average.)',
  ],
  approach: `**Brute force:** \`nums.sort((a, b) => b - a)[k - 1]\` → O(n log n).

**Heap (O(n log k)):** a min-heap holding the k largest values seen so far. Every new value is pushed; if the heap exceeds k, the smallest is popped. The top is the weakest of the k largest = the k-th largest.

**Quickselect (O(n) average):** pick a random pivot, partition into > pivot / = pivot / < pivot, and recurse only into the part that contains position k − 1. Expected work n + n/2 + … = 2n. Worst case O(n²).`,

  functionName: 'findKthLargest',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function findKthLargest(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.', args: [[3,2,1,5,6,4],2], expected: 5 },
    { scenario: 'Example 2', hint: 'Duplicates count separately: 6,5,5,4 → the 4th largest is 4.', args: [[3,2,3,1,2,4,5,5,6],4], expected: 4 },
    { scenario: 'Single element', hint: 'n = 1, k = 1: the only element is the answer.', args: [[1],1], expected: 1 },
    { scenario: 'Duplicates are not distinct', hint: 'Returning the k-th largest DISTINCT value gives 2 here; duplicates must be counted.', args: [[3,3,3,2],2], expected: 3 },
    { scenario: 'All equal', hint: 'Every value is the same — any k returns that value.', args: [[5,5,5,5,5],3], expected: 5 },
    { scenario: 'k = 1 (maximum)', hint: 'k = 1 is just the maximum. A max-heap of size k would evict it.', args: [[2,9,4,7,1],1], expected: 9 },
    { scenario: 'k = n (minimum)', hint: 'k = n is the minimum — the heap must keep every element.', args: [[7,6,5,4,3,2,1],7], expected: 1 },
    { scenario: 'Two equal negatives', hint: 'Negative numbers and duplicates together.', args: [[-1,-1],2], expected: -1 },
    { scenario: 'Extreme values', hint: 'Values at the constraint bounds ±10^4 mixed with zero.', args: [[-10000,10000,0,3,-3],2], expected: 3 },
    { scenario: 'Already sorted ascending', hint: 'Sorted input is the classic worst case for quickselect with a fixed first/last pivot.', args: [[1,2,3,4,5,6,7,8,9,10],4], expected: 7 },
    { scenario: 'Wrong heap direction', hint: 'A max-heap capped at size k throws away the largest values; you need a min-heap whose top is the k-th largest.', args: [[10,1,9,2,8,3,7],3], expected: 8 },
    { scenario: 'Large sorted input (n = 10^5)', hint: 'Sorted input with k = n/2: quickselect with a fixed pivot degrades to O(n²) and repeatedly removing the max is O(n·k). A size-k min-heap is O(n log k).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i - 50000), 50000]', expected: 0, timeLimitMs: 1000 },
    { scenario: 'Large random input (n = 10^5)', hint: 'Many duplicates in a big array; repeated max-removal or partial selection sort is O(n·k) — too slow.', argsGen: '() => { let s = 7; const a = []; for (let i = 0; i < 100000; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; a.push((s % 20001) - 10000); } return [a, 30000]; }', expected: 3983, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findKthLargest(nums, k) {
  const heap = new MinHeap();          // the k largest so far; top = kth largest
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop();
  }
  return heap.peek();
}`,
  },
  dryRun: {
    columns: ['x', 'heap after (k = 2)'],
    rows: [['3', '{3}'], ['2', '{2, 3}'], ['1', '{2, 3} (1 evicted)'], ['5', '{3, 5} (2 evicted)'], ['6', '{5, 6} (3 evicted)'], ['4', '{5, 6} (4 evicted) → peek 5']],
  },
  complexity: { time: 'O(n log k)', space: 'O(k)', explanation: 'n pushes and ≤ n pops on a heap of size ≤ k + 1.' },
  alternative: {
    title: 'Quickselect (three-way partition, random pivot)',
    code: `function findKthLargest(nums, k) {
  let arr = nums;
  while (true) {
    const pivot = arr[Math.floor(Math.random() * arr.length)];
    const big = [], eq = [], small = [];
    for (const x of arr) (x > pivot ? big : x < pivot ? small : eq).push(x);
    if (k <= big.length) arr = big;
    else if (k <= big.length + eq.length) return pivot;
    else { k -= big.length + eq.length; arr = small; }
  }
}`,
    md: 'O(n) expected time. The three-way split handles many duplicates gracefully. An in-place Lomuto/Hoare version uses O(1) extra space.',
    complexity: 'O(n) average, O(n²) worst; O(n) space for this version',
  },
  mistakes: [
    'Using a max-heap of size k (it evicts the largest values).',
    'Returning the k-th largest DISTINCT value — duplicates count.',
    'Quickselect with a fixed first-element pivot on sorted input → O(n²).',
  ],
};
