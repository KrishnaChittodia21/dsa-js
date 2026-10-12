export default {
  id: 'smallest-range-covering-elements-from-k-lists',
  title: 'Smallest Range Covering Elements from K Lists',
  difficulty: 'Hard',
  order: 5,
  pattern: 'heap-k-way-merge',
  tags: ['heap', 'k-way merge', 'sliding window'],
  source: { platform: 'LeetCode', number: 632, url: 'https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/' },

  statement: `You are given \`k\` lists of integers, each sorted in non-decreasing order. Find the **smallest range** \`[a, b]\` that includes **at least one number from each list**.

Range \`[a, b]\` is smaller than \`[c, d]\` if \`b − a < d − c\`, or if \`b − a === d − c\` and \`a < c\`. Return \`[a, b]\`.`,
  examples: [
    { input: 'nums = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]', output: '[20,24]', explanation: '24 from list 1, 20 from list 2, 22 from list 3.' },
    { input: 'nums = [[1,2,3],[1,2,3],[1,2,3]]', output: '[1,1]' },
  ],
  constraints: ['1 <= k <= 3500', '1 <= each list length <= 50', '-10^5 <= values <= 10^5', 'Each list is sorted'],

  think: `- Pick one element from each list. The range covering them is [their min, their max]. Which choice can you change to possibly shrink it?
- Increasing the **max** can only make the range worse. What about advancing the list that owns the **min**?
- Which structure gives you the min of k values repeatedly, while also tracking the max?`,
  patternChallenge: {
    options: ['Heap — K-way Merge (one pointer per list)', 'Binary Search on the range width', 'Heap — Two Heaps', 'Backtracking'],
    answer: 0,
    explanation: 'Keep one current element per list in a min-heap (a k-way merge frontier) plus the running max; advance the list with the minimum. Binary search on width needs an expensive feasibility check; backtracking is exponential; two heaps are for medians.',
  },
  hints: [
    'Heap holds [value, listIndex, elementIndex] for one element from each list; also track `curMax` of the values in the heap.',
    'Loop: the range is [heap top value, curMax]; record it if better. Pop the min and push the next element of its list (updating curMax). Stop when some list is exhausted.',
  ],
  approach: `**Brute force:** try every combination of one element per list → exponential.

**K-way merge frontier (O(N log k)):**
1. Push the first element of every list; \`curMax\` = the largest of them.
2. Repeat: the current frontier covers every list, and its range is \`[min, curMax]\` with \`min\` = heap top. Record it if smaller.
3. To find a smaller range we must raise the min (lowering the max is impossible without dropping a list). Pop the min and push the next element of the **same** list, updating \`curMax\`.
4. When the popped list has no next element, no further frontier can cover that list → stop.

Because ranges are recorded only when strictly smaller (width, then start), ties keep the earliest (smaller a).`,

  functionName: 'smallestRange',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[][]} nums
 * @return {number[]}
 */
function smallestRange(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: [20, 24] contains 24, 20 and 22 — one value from each list.', args: [[[4, 10, 15, 24, 26], [0, 9, 12, 20], [5, 18, 22, 30]]], expected: [20, 24] },
    { scenario: 'Example 2', hint: 'Identical lists: a single value covers all of them, so the range has width 0.', args: [[[1, 2, 3], [1, 2, 3], [1, 2, 3]]], expected: [1, 1] },
    { scenario: 'Single list', hint: 'k = 1: any single element is a valid range; the smallest start wins.', args: [[[1, 2, 3, 4, 5]]], expected: [1, 1] },
    { scenario: 'Single element overall', hint: 'Smallest input: one list with one value.', args: [[[7]]], expected: [7, 7] },
    { scenario: 'One element per list', hint: 'Each list has one value, so the range must span all of them.', args: [[[1], [2], [3]]], expected: [1, 3] },
    { scenario: 'Stop when a list runs out', hint: 'After list 0 (just [1]) is exhausted, no later frontier covers it. Continuing would report [5, 5].', args: [[[1], [5, 6]]], expected: [1, 5] },
    { scenario: 'Tie keeps the smaller start', hint: '[1, 2] and [4, 5] have the same width; the earlier start wins. Updating with <= picks the wrong one.', args: [[[1, 4], [2, 5]]], expected: [1, 2] },
    { scenario: 'Duplicates within a list', hint: 'Repeated values inside a list are allowed.', args: [[[10, 10], [11, 11]]], expected: [10, 11] },
    { scenario: 'Negative values', hint: 'Mixed negative and positive values.', args: [[[-5, -1, 8], [0, 3], [2, 9]]], expected: [-1, 2] },
    { scenario: 'Extreme values', hint: 'Values at -10^5 and 10^5: the only covering range spans the full width.', args: [[[-100000], [100000], [-100000, 100000]]], expected: [-100000, 100000] },
    { scenario: 'Max moves with each push', hint: 'Track curMax as elements are pushed; recomputing the heap max each step is O(k).', args: [[[1, 9], [4, 12], [7, 10, 16]]], expected: [9, 12] },
    { scenario: 'Best range found late', hint: 'The narrowest range appears only near the ends of the lists.', args: [[[1, 2, 3, 100], [50, 101], [60, 99, 102]]], expected: [99, 101] },
    { scenario: 'Large input (k = 3500)', hint: '3500 lists of 50 values: scanning all k list heads at every step is O(N·k); a min-heap makes each step O(log k).', argsGen: '() => { let s = 12345; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 3500 }, () => Array.from({ length: 50 }, () => r() % 200001 - 100000).sort((x, y) => x - y))]; }', expected: [10143, 28629], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function smallestRange(nums) {
  const pq = new PriorityQueue((a, b) => a[0] - b[0]);   // [value, list, index]
  let curMax = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    pq.push([nums[i][0], i, 0]);
    curMax = Math.max(curMax, nums[i][0]);
  }

  let best = [pq.peek()[0], curMax];
  while (true) {
    const [minVal, i, j] = pq.pop();
    if (curMax - minVal < best[1] - best[0]) best = [minVal, curMax];
    if (j + 1 === nums[i].length) break;          // list i exhausted: cannot cover it any more
    const next = nums[i][j + 1];
    pq.push([next, i, j + 1]);
    curMax = Math.max(curMax, next);
  }
  return best;
}`,
    explanation: 'Only strictly narrower ranges replace the best; since the min only increases, an equal-width later range would have a larger start, so ties are resolved correctly.',
  },
  dryRun: {
    columns: ['frontier', 'min', 'curMax', 'range', 'best'],
    rows: [
      ['4, 0, 5', '0', '5', '[0,5] w5', '[0,5]'],
      ['4, 9, 5', '4', '9', '[4,9] w5', '[0,5]'],
      ['10, 9, 5', '5', '10', '[5,10] w5', '[0,5]'],
      ['10, 9, 18', '9', '18', 'w9', '[0,5]'],
      ['…', '…', '…', '…', '…'],
      ['24, 20, 22', '20', '24', '[20,24] w4', '[20,24]'],
    ],
  },
  complexity: { time: 'O(N log k)', space: 'O(k)', explanation: 'N = total elements; each is pushed and popped at most once in a heap of exactly k entries.' },
  alternative: {
    title: 'Merge + sliding window',
    md: 'Merge all elements into one sorted array of (value, list) pairs, then run a variable sliding window that covers all k lists (count lists inside the window with a Map). O(N log N) for the sort, O(N) for the window.',
    complexity: 'O(N log N) time, O(N) space',
  },
  mistakes: [
    'Continuing after a list is exhausted (the frontier would no longer cover every list).',
    'Recomputing the max of the heap each time (O(k)) instead of tracking curMax.',
    'Using <= when updating the best range, which breaks the "smaller start" tie rule.',
  ],
};
