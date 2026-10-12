export default {
  id: 'minimum-interval-to-include-each-query',
  title: 'Minimum Interval to Include Each Query',
  difficulty: 'Hard',
  order: 2,
  pattern: 'intervals-sweep-line',
  tags: ['array', 'sorting', 'heap', 'sweep line', 'intervals'],
  source: { platform: 'LeetCode', number: 1851, url: 'https://leetcode.com/problems/minimum-interval-to-include-each-query/' },

  statement: `You get closed intervals \`intervals[i] = [left_i, right_i]\`; the **size** of an interval is \`right_i − left_i + 1\` (the number of integers it contains). You also get an array \`queries\`.

For each query value \`q\`, find the **smallest size** of any interval with \`left <= q <= right\`. If no interval contains \`q\`, the answer for that query is \`-1\`.

Return the answers in the **original order** of \`queries\`.`,
  examples: [
    { input: 'intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]', output: '[3,3,1,4]', explanation: 'q=2: [2,4] (size 3). q=3: [2,4] (3). q=4: [4,4] (1). q=5: [3,6] (4).' },
    { input: 'intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]', output: '[2,-1,4,6]' },
  ],
  constraints: ['1 <= intervals.length, queries.length <= 10^5', '1 <= left_i <= right_i <= 10^7', '1 <= queries[j] <= 10^7'],

  think: `- Checking every interval for every query is O(n · q) = 10¹⁰. What if you answer the queries in **increasing** order instead of the given order?
- As \`q\` grows, which intervals become "started" and never un-start? Which ones "expire"?
- Among the started, not-yet-expired intervals you want the smallest size — which data structure gives the minimum quickly?`,
  patternChallenge: {
    options: ['Binary search on each query in intervals sorted by left', 'Offline sweep: sorted queries + MinHeap of active intervals', 'Merge intervals first, then answer queries', 'Greedy by earliest end'],
    answer: 1,
    explanation: 'Sweeping queries in sorted order turns "which intervals contain q" into add-when-started / remove-when-expired events, and a MinHeap keyed by size gives the best active interval. Merging destroys sizes; binary search alone cannot find the minimum size among containing intervals.',
  },
  hints: [
    'Sort intervals by left and query indices by value. Keep a pointer into the intervals.',
    'For each query q (ascending): push every interval with `left <= q` into a MinHeap keyed by size (store [size, right]); then pop while the top\'s `right < q`. The top (if any) is the answer.',
  ],
  approach: `**Brute force:** for every query scan all intervals and take the minimum size among those containing it — O(n · q), too slow at 10⁵ × 10⁵.

**Offline sweep + MinHeap (intended):**
1. Sort intervals by \`left\`. Sort query **indices** by query value (so answers can be written back in the original order).
2. Sweep queries in increasing order with pointer \`i\` into the intervals:
   - while \`intervals[i].left <= q\`: push \`[size, right]\` into a \`MinHeap\` keyed by size; \`i++\`.
   - while the heap top has \`right < q\`: pop it. It can never contain a later (larger) query either — **lazy deletion** is safe.
   - answer = top's size, or −1 if the heap is empty.
3. Each interval is pushed once and popped at most once → O(n log n + q log q).

Heaps are covered in detail in the Heaps topic; here we use the toolkit's \`MinHeap\` (\`push\`, \`peek\`, \`pop\`, \`size\`).

**Why lazy deletion is correct:** an expired interval that is *not* at the top doesn't matter — we only ever read the top, and we clean the top before reading it.`,

  functionName: 'minInterval',
  paramNames: ['intervals', 'queries'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @param {number[]} queries
 * @return {number[]}
 */
function minInterval(intervals, queries) {
  // Toolkit: new MinHeap(x => key) — push(x), peek(), pop(), size()
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: each query picks the smallest containing interval; size of [l, r] is r − l + 1.', args: [[[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]], expected: [3, 3, 1, 4] },
    { scenario: 'Example 2', hint: 'Queries are not sorted and 19 is in no interval (→ −1). Answers must stay in the original query order.', args: [[[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22]], expected: [2, -1, 4, 6] },
    { scenario: 'Single point interval', hint: 'Smallest inputs: [1,1] has size 1 (not 0), and query 2 is outside it.', args: [[[1, 1]], [1, 2]], expected: [1, -1] },
    { scenario: 'Queries at the edges', hint: 'Endpoints are inclusive: 5 and 10 are inside [5,10]; 4 and 11 are not.', args: [[[5, 10]], [4, 5, 10, 11]], expected: [-1, 6, 6, -1] },
    { scenario: 'Duplicate queries', hint: 'Repeated query values must each get an answer in their own position.', args: [[[1, 10], [3, 3], [2, 4]], [3, 3, 1, 9]], expected: [1, 1, 10, 10] },
    { scenario: 'Key by size, not right end', hint: 'For q = 5, [1,6] ends first but [5,8] is smaller. A heap keyed by right end returns 6 instead of 4.', args: [[[1, 6], [5, 8]], [5]], expected: [4] },
    { scenario: 'Expired top between queries', hint: 'After q = 1, the small [1,2] is on top but has ended by q = 5. Clean the top before every read, not only when pushing.', args: [[[1, 2], [1, 10]], [1, 5]], expected: [2, 10] },
    { scenario: 'Descending queries', hint: 'Sort query indices, not the queries themselves — otherwise answers land in the wrong slots.', args: [[[1, 3], [4, 9], [2, 5]], [9, 5, 2, 1]], expected: [6, 4, 3, 3] },
    { scenario: 'No query is covered', hint: 'Every query falls in a gap: all answers are −1.', args: [[[2, 2], [4, 4]], [1, 3, 5]], expected: [-1, -1, -1] },
    { scenario: 'Maximum coordinates', hint: 'An interval spanning [1, 10^7] has size 10^7.', args: [[[1, 10000000]], [10000000, 1]], expected: [10000000, 10000000] },
    { scenario: 'Nested and repeated intervals', hint: 'Several intervals contain the same query; always report the smallest size.', args: [[[4, 5], [5, 8], [1, 9], [8, 10], [1, 6]], [7, 9, 3, 9, 3]], expected: [4, 3, 6, 3, 6] },
    { scenario: 'Large input (n = q = 10^5)', hint: 'Scanning all intervals per query is O(n · q) = 10^10. Sort intervals and query indices, sweep with a min-heap: O((n + q) log n).', argsGen: '() => { let s = 17; const r = (m) => (s = (s * 48271) % 2147483647) % m; const iv = []; for (let i = 1; i <= 50000; i++) iv.push([2 * i - 1, 2 * i - 1], [1, 10000000 - i + 1]); for (let i = iv.length - 1; i > 0; i--) { const j = r(i + 1); [iv[i], iv[j]] = [iv[j], iv[i]]; } return [iv, Array.from({ length: 100000 }, (_, j) => 100000 - j)]; }', expected: Array.from({ length: 100000 }, (_, j) => (j % 2 ? 1 : 9950001)), timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minInterval(intervals, queries) {
  const sorted = intervals.toSorted((a, b) => a[0] - b[0]);
  const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]);
  const heap = new MinHeap((x) => x[0]);          // items: [size, right]
  const ans = new Array(queries.length).fill(-1);

  let i = 0;
  for (const qi of order) {
    const q = queries[qi];
    // 1. every interval that has started by q becomes a candidate
    while (i < sorted.length && sorted[i][0] <= q) {
      const [l, r] = sorted[i++];
      heap.push([r - l + 1, r]);
    }
    // 2. lazily drop candidates that ended before q (they can't contain later queries either)
    while (heap.size() > 0 && heap.peek()[1] < q) heap.pop();
    // 3. the smallest remaining size contains q
    if (heap.size() > 0) ans[qi] = heap.peek()[0];
  }
  return ans;
}`,
    explanation: 'Sorting query indices (not values) lets us write each answer back to its original position.',
  },
  dryRun: {
    columns: ['query (sorted)', 'pushed [size,right]', 'popped (expired)', 'top', 'answer'],
    rows: [
      ['2', '[4,4] from [1,4], [3,4] from [2,4]', '—', '[3,4]', '3'],
      ['3', '[4,6] from [3,6]', '—', '[3,4]', '3'],
      ['4', '[1,4] from [4,4]', '—', '[1,4]', '1'],
      ['5', '—', '[1,4], [3,4], [4,4] (right 4 < 5)', '[4,6]', '4'],
    ],
  },
  complexity: { time: 'O(n log n + q log q)', space: 'O(n + q)', explanation: 'Two sorts; each interval is pushed and popped at most once (O(log n) each). The heap, order array and answers are linear.' },
  alternative: {
    title: 'Brute force per query',
    md: 'For each query, scan all intervals. Simple and correct — useful to verify the fast version — but O(n · q).',
    code: `function minInterval(intervals, queries) {
  return queries.map((q) => {
    let best = Infinity;
    for (const [l, r] of intervals) if (l <= q && q <= r) best = Math.min(best, r - l + 1);
    return best === Infinity ? -1 : best;
  });
}`,
    complexity: 'O(n · q) time, O(1) extra space',
  },
  mistakes: [
    'Sorting the queries themselves and losing their original positions — sort indices instead.',
    'Removing expired intervals only when pushing, instead of cleaning the top before every read.',
    'Keying the heap by right end instead of size — then the top is not the smallest interval.',
    'Size off by one: closed interval [l, r] has size r − l + 1.',
  ],
};
