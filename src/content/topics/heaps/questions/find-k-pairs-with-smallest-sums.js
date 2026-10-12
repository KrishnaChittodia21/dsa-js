export default {
  id: 'find-k-pairs-with-smallest-sums',
  title: 'Find K Pairs with Smallest Sums',
  difficulty: 'Medium',
  order: 5,
  pattern: 'heap-k-way-merge',
  tags: ['heap', 'k-way merge', 'array'],
  source: { platform: 'LeetCode', number: 373, url: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/' },

  statement: `You are given two arrays \`nums1\` and \`nums2\`, both sorted in non-decreasing order, and an integer \`k\`. A pair \`[u, v]\` takes \`u\` from \`nums1\` and \`v\` from \`nums2\`.

Return the \`k\` pairs with the **smallest sums** \`u + v\`. When several pairs tie on the sum, any of them may be returned; the order of the output does not matter.`,
  examples: [
    { input: 'nums1 = [1,7,11], nums2 = [2,4,6], k = 3', output: '[[1,2],[1,4],[1,6]]' },
    { input: 'nums1 = [1,1,2], nums2 = [1,2,3], k = 2', output: '[[1,1],[1,1]]', explanation: 'nums1[0] and nums1[1] are different elements, so [1,1] appears twice.' },
  ],
  constraints: ['1 <= nums1.length, nums2.length <= 10^5', '-10^9 <= nums1[i], nums2[i] <= 10^9', 'Both arrays are sorted', '1 <= k <= nums1.length * nums2.length, k <= 10^4'],

  think: `- There are up to 10¹⁰ pairs — you cannot generate them all. For a fixed \`i\`, what does the sequence \`nums1[i] + nums2[0], nums1[i] + nums2[1], …\` look like?
- You now have many sorted sequences. What pattern merges sorted sequences, producing the smallest elements first?
- After popping pair \`(i, j)\`, which pair from the same sequence comes next?`,
  patternChallenge: {
    options: ['Two Pointers', 'Heap — Top K by generating all pairs', 'Heap — K-way Merge', 'Binary Search'],
    answer: 2,
    explanation: 'Row i of the "sum matrix" is sorted, so this is merging sorted rows lazily with a heap of heads and stopping after k pops. Generating all pairs is O(n·m); a single two-pointer pass cannot enumerate pairs in sum order.',
  },
  hints: [
    'Treat row i as the sorted list nums1[i] + nums2[0..]. Push (i, 0) for the first min(k, n1) rows.',
    'Pop the smallest (i, j), record [nums1[i], nums2[j]], and push (i, j + 1) if it exists. Stop after k pops.',
  ],
  approach: `**Brute force:** generate all n1·n2 pairs, sort by sum, take k → O(n1·n2·log(n1·n2)) — impossible for 10⁵ × 10⁵.

**K-way merge:** conceptually there is a sorted list per row \`i\`: \`(i,0), (i,1), …\`. The globally smallest remaining pair is always the head of one row. Keep the heads in a min-heap keyed by sum:
1. push \`[nums1[i] + nums2[0], i, 0]\` for \`i < min(k, n1)\` (rows beyond k can never contribute).
2. k times: pop \`[s, i, j]\`, output \`[nums1[i], nums2[j]]\`, push \`(i, j + 1)\` if \`j + 1 < n2\`.

Heap size ≤ min(k, n1) → O(k log k).`,

  functionName: 'kSmallestPairs',
  paramNames: ['nums1', 'nums2', 'k'],
  starterCode: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @param {number} k
 * @return {number[][]}
 */
function kSmallestPairs(nums1, nums2, k) {
  
}
`,
  checker: `(output, args, expected) => {
  const [a, b, k] = args;
  if (!Array.isArray(output) || output.length !== expected.length) return false;
  const cntA = new Map(), cntB = new Map();
  for (const x of a) cntA.set(x, (cntA.get(x) ?? 0) + 1);
  for (const x of b) cntB.set(x, (cntB.get(x) ?? 0) + 1);
  const used = new Map();
  for (const p of output) {
    if (!Array.isArray(p) || p.length !== 2 || !cntA.has(p[0]) || !cntB.has(p[1])) return false;
    const key = p[0] + ',' + p[1];
    used.set(key, (used.get(key) ?? 0) + 1);
    if (used.get(key) > cntA.get(p[0]) * cntB.get(p[1])) return false; // more copies than exist
  }
  const sums = (arr) => arr.map((p) => p[0] + p[1]).sort((x, y) => x - y);
  return JSON.stringify(sums(output)) === JSON.stringify(sums(expected));
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The three smallest sums all use nums1[0] = 1.', args: [[1,7,11],[2,4,6],3], expected: [[1,2],[1,4],[1,6]] },
    { scenario: 'Example 2', hint: 'Equal values at different indices are different pairs, so [1,1] appears twice.', args: [[1,1,2],[1,2,3],2], expected: [[1,1],[1,1]] },
    { scenario: 'Single element each', hint: 'The smallest input: one pair, k = 1.', args: [[1],[1],1], expected: [[1,1]] },
    { scenario: 'nums2 has one element', hint: 'A row runs out after one pair; you must move on to the next row instead of stopping.', args: [[1,2],[3],2], expected: [[1,3],[2,3]] },
    { scenario: 'nums1 has one element', hint: 'Only one row exists — walk along it.', args: [[5],[1,2,3,4],3], expected: [[5,1],[5,2],[5,3]] },
    { scenario: 'k = all pairs', hint: 'k = n1·n2: every pair must be produced exactly once.', args: [[1,1,2],[1,2,3],9], expected: [[1,1],[1,1],[1,2],[1,2],[2,1],[1,3],[1,3],[2,2],[2,3]] },
    { scenario: 'No duplicate pairs', hint: 'Pushing both (i+1, j) and (i, j+1) without a visited set enqueues (1,1) twice and outputs [2,2] twice.', args: [[1,2,3],[1,2,3],9], expected: [[1,1],[1,2],[2,1],[1,3],[2,2],[3,1],[2,3],[3,2],[3,3]] },
    { scenario: 'Negative numbers', hint: 'Negative values sort first; sums can be negative.', args: [[-10,-4,0,0,6],[3,5,6,7,8,100],10], expected: [[-10,3],[-10,5],[-10,6],[-10,7],[-10,8],[-4,3],[-4,5],[-4,6],[-4,7],[0,3]] },
    { scenario: 'Extreme values', hint: 'Sums reach ±2·10^9 — beyond 32-bit ints but exact in JS numbers.', args: [[-1000000000,1000000000],[-1000000000,1000000000],3], expected: [[-1000000000,-1000000000],[-1000000000,1000000000],[1000000000,-1000000000]] },
    { scenario: 'Pairs interleave rows', hint: 'The answer mixes rows: after [1,3] and [2,3] the next pair comes from row 0 again.', args: [[1,2,4,5,6],[3,5,7,9],3], expected: [[1,3],[2,3],[1,5]] },
    { scenario: 'Longer second row wins', hint: 'Row 0 contributes many pairs before row 1 starts — do not take just one pair per row.', args: [[1,100],[1,2,3,4,5],5], expected: [[1,1],[1,2],[1,3],[1,4],[1,5]] },
    { scenario: 'Huge arrays, small k', hint: 'n1 = n2 = 10^5: generating all 10^10 pairs is impossible. Seed at most k rows and expand lazily.', argsGen: '() => { let s = 9; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const a = [], b = []; for (let i = 0; i < 100000; i++) { a.push(r() % 2000000001 - 1000000000); b.push(r() % 2000000001 - 1000000000); } a.sort((x, y) => x - y); b.sort((x, y) => x - y); return [a, b, 20]; }', expected: [[-999977804,-999998083],[-999977804,-999995573],[-999975179,-999998083],[-999975179,-999995573],[-999961762,-999998083],[-999977804,-999980306],[-999961762,-999995573],[-999975179,-999980306],[-999961762,-999980306],[-999938308,-999998083],[-999938308,-999995573],[-999938308,-999980306],[-999977804,-999928743],[-999975179,-999928743],[-999977804,-999923808],[-999975179,-999923808],[-999977804,-999919459],[-999897022,-999998083],[-999975179,-999919459],[-999897022,-999995573]], timeLimitMs: 1000 },
    { scenario: 'Huge arrays, k = 10^4', hint: 'The largest allowed k. A heap of at most k candidates gives O(k log k).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i), Array.from({ length: 100000 }, (_, i) => i), 10000]', expected: (() => { const o = []; for (let s = 0; o.length < 10000; s++) for (let i = 0; i <= s && o.length < 10000; i++) o.push([i, s - i]); return o; })(), timeLimitMs: 1000 },
  ],

  solution: {
    code: `function kSmallestPairs(nums1, nums2, k) {
  const pq = new PriorityQueue((a, b) => a[0] - b[0]);   // [sum, i, j]
  for (let i = 0; i < Math.min(k, nums1.length); i++) pq.push([nums1[i] + nums2[0], i, 0]);

  const out = [];
  while (out.length < k && !pq.isEmpty()) {
    const [, i, j] = pq.pop();
    out.push([nums1[i], nums2[j]]);
    if (j + 1 < nums2.length) pq.push([nums1[i] + nums2[j + 1], i, j + 1]); // next in row i
  }
  return out;
}`,
  },
  dryRun: {
    columns: ['pop (sum, i, j)', 'output', 'push'],
    rows: [['(3, 0, 0)', '[1,2]', '(5, 0, 1)'], ['(5, 0, 1)', '[1,4]', '(7, 0, 2)'], ['(7, 0, 2)', '[1,6]', '— (k reached)']],
    note: 'Heap initially held (3,0,0), (9,1,0), (13,2,0).',
  },
  complexity: { time: 'O(k log k)', space: 'O(k)', explanation: 'At most min(k, n1) initial pushes, then k pops each followed by ≤ 1 push; heap size ≤ min(k, n1).' },
  alternative: {
    title: 'Grid BFS from (0,0)',
    md: 'Start with (0,0); after popping (i,j) push (i+1,j) and (i,j+1), using a Set to avoid duplicates. Same complexity, a bit more bookkeeping.',
    complexity: 'O(k log k) time, O(k) space',
  },
  mistakes: [
    'Generating all pairs.',
    'Pushing both (i+1, j) and (i, j+1) without de-duplication (the same pair is pushed twice).',
    'Seeding more than k rows (wasted work when n1 is huge).',
  ],
};
