// k = 5000 over 10^4 initial values and 10^4 adds; expected answers come from a sorted array kept by binary-search insertion.
const bigKthOps = () => {
  let s = 11; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const k = 5000, nums = Array.from({ length: 10000 }, () => rnd(20001) - 10000);
  const a = [...nums].sort((x, y) => x - y);
  const ops = ['KthLargest'], args = [[k, nums]], expected = [null];
  for (let i = 0; i < 10000; i++) {
    const x = rnd(20001) - 10000;
    let lo = 0, hi = a.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; }
    a.splice(lo, 0, x);
    ops.push('add'); args.push([x]); expected.push(a[a.length - k]);
  }
  return { ops, args, expected };
};

export default {
  id: 'kth-largest-element-in-a-stream',
  title: 'Kth Largest Element in a Stream',
  difficulty: 'Easy',
  order: 1,
  pattern: 'heap-top-k',
  kind: 'design',
  tags: ['heap', 'design', 'data stream'],
  source: { platform: 'LeetCode', number: 703, url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/' },

  statement: `Design a class \`KthLargest\` that tracks the **k-th largest** value in a growing stream of numbers (k-th largest in sorted order, duplicates count separately).

- \`new KthLargest(k, nums)\` — starts with \`k\` and an initial array \`nums\`.
- \`add(val)\` — appends \`val\` to the stream and returns the current k-th largest value.

It is guaranteed that there are at least \`k\` numbers whenever \`add\` returns.`,
  examples: [
    { input: 'KthLargest(3, [4,5,8,2]); add(3), add(5), add(10), add(9), add(4)', output: '[null,4,5,5,8,8]', explanation: 'After add(3) the stream sorted descending is 8,5,4,3,2 → 3rd largest is 4.' },
  ],
  constraints: ['1 <= k <= 10^4', '0 <= nums.length <= 10^4', '-10^4 <= nums[i], val <= 10^4', 'At most 10^4 calls to add'],

  think: `- Do you need to remember numbers that are smaller than the current k-th largest?
- If you keep exactly the k largest numbers, which one of them is the answer?
- Which heap exposes that one at the top?`,
  patternChallenge: {
    options: ['Heap — Top K / Kth Element', 'Sort the whole stream on every add', 'Heap — Two Heaps', 'Binary search on a sorted array'],
    answer: 0,
    explanation: 'Only the k largest values matter, and the answer is the smallest of them: a size-k min-heap. Sorting each time is O(n log n) per call; a sorted array with binary search still needs O(n) insertion; two heaps are for medians.',
  },
  hints: [
    'Keep a min-heap containing only the k largest values seen so far.',
    'On add: push the value; if the size exceeds k, pop. The top of the heap is the answer.',
  ],
  approach: `**Brute force:** keep every value in an array, sort descending on each \`add\`, return index k − 1 → O(n log n) per call.

**Optimized (size-k min-heap):** values smaller than the current k-th largest can never become the answer again (the stream only grows), so drop them. Keep the k largest in a min-heap; its top is the k-th largest.
- constructor: push each number, popping whenever size > k.
- add: push, pop if size > k, return \`peek()\`.

Each call is O(log k). The toolkit's \`MinHeap\` is used here.`,

  className: 'KthLargest',
  starterCode: `class KthLargest {
  /**
   * @param {number} k
   * @param {number[]} nums
   */
  constructor(k, nums) {
    
  }

  /**
   * @param {number} val
   * @return {number}
   */
  add(val) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The walkthrough from the statement: k = 3 over a growing stream.', ops: ["KthLargest","add","add","add","add","add"], args: [[3,[4,5,8,2]],[3],[5],[10],[9],[4]], expected: [null,4,5,5,8,8] },
    { scenario: 'Empty initial nums', hint: 'nums can be empty; with k = 1 each add returns the maximum so far.', ops: ["KthLargest","add","add","add","add","add"], args: [[1,[]],[-3],[-2],[-4],[0],[4]], expected: [null,-3,-2,-2,0,4] },
    { scenario: 'Fewer than k initially', hint: 'The initial array has k - 1 numbers; the first add completes the heap. Do not assume nums.length >= k.', ops: ["KthLargest","add","add"], args: [[3,[1,2]],[3],[0]], expected: [null,1,1] },
    { scenario: 'Push before popping', hint: 'Adding a value smaller than the k-th largest must not change the answer. Popping before pushing evicts a value that should stay.', ops: ["KthLargest","add","add","add"], args: [[2,[5,6]],[1],[2],[7]], expected: [null,5,5,6] },
    { scenario: 'Many duplicates', hint: 'Duplicates count separately: the 4th largest of 8,7,7,7,7 is 7.', ops: ["KthLargest","add","add","add","add"], args: [[4,[7,7,7,7,8,3]],[2],[10],[9],[9]], expected: [null,7,7,7,8] },
    { scenario: 'k = 1 equal values', hint: 'k = 1 with a repeated value: the answer is that value.', ops: ["KthLargest","add"], args: [[1,[5]],[5]], expected: [null,5] },
    { scenario: 'Negative values', hint: 'Stream crossing zero with k = 2.', ops: ["KthLargest","add","add","add","add","add"], args: [[2,[0]],[-1],[1],[-2],[-4],[3]], expected: [null,-1,0,0,0,1] },
    { scenario: 'Extreme values', hint: 'Values at the bounds ±10^4.', ops: ["KthLargest","add","add","add"], args: [[2,[-10000,10000]],[-10000],[10000],[0]], expected: [null,-10000,10000,10000] },
    { scenario: 'Small values ignored', hint: 'Values below the current k-th largest never change the answer.', ops: ["KthLargest","add","add","add","add"], args: [[3,[10,20,30]],[1],[2],[3],[4]], expected: [null,10,10,10,10] },
    { scenario: 'Each add is new max', hint: 'Every add beats the current answer, so the k-th largest rises every time.', ops: ["KthLargest","add","add","add","add","add"], args: [[2,[1]],[2],[3],[4],[5],[6]], expected: [null,1,2,3,4,5] },
    { scenario: 'k equals total count', hint: 'With k = n the answer is the overall minimum so far.', ops: ["KthLargest","add","add"], args: [[4,[4,3,2]],[1],[5]], expected: [null,1,2] },
    { scenario: 'Large initial nums', hint: 'Initial nums much larger than k: keep only the k largest, evicting the rest.', ops: ["KthLargest","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add","add"], args: [[3,[5692,-3941,-6321,-8450,-4795,8470,2369,-2798,9881,-3571,-3344,3623,2556,-5013,5110,3013,4609,-5905,8736,7814,6192,886,6447,3586,188,-2711,7821,7333,4873,-6623,-2217,3176,8871,-4795,-2846,73,8741,-8744,-4676,-2095]],[-7658],[-2576],[-928],[8344],[-9035],[4634],[1635],[3511],[5930],[6259],[7874],[6298],[3565],[6657],[-7905],[7279],[8721],[3557],[-4511],[7821]], expected: [null,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741,8741] },
    { scenario: 'Large stream (10^4 adds)', hint: 'Re-sorting the whole array on every add is O(n log n) per call. A min-heap of size k makes each add O(log k).', opsGen: String(bigKthOps), timeLimitMs: 300 },
  ],

  solution: {
    code: `class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new MinHeap();       // holds the k largest values; top = kth largest
    for (const x of nums) this.add(x);
  }

  add(val) {
    this.heap.push(val);
    if (this.heap.size() > this.k) this.heap.pop(); // evict the weakest
    return this.heap.peek();
  }
}`,
  },
  dryRun: {
    columns: ['call', 'heap after (k = 3)', 'returns'],
    rows: [
      ['constructor [4,5,8,2]', '{4, 5, 8} (2 evicted)', 'null'],
      ['add(3)', '{4, 5, 8} (3 evicted)', '4'],
      ['add(5)', '{5, 5, 8} (4 evicted)', '5'],
      ['add(10)', '{5, 8, 10}', '5'],
      ['add(9)', '{8, 9, 10}', '8'],
      ['add(4)', '{8, 9, 10} (4 evicted)', '8'],
    ],
  },
  complexity: { time: 'O(n log k) to build, O(log k) per add', space: 'O(k)', explanation: 'The heap never holds more than k + 1 values.' },
  alternative: {
    title: 'Sorted array + binary insertion',
    md: 'Keep the k largest in a sorted array; find the insertion point with binary search (O(log k)) but splicing is O(k). Fine for small k.',
    complexity: 'O(k) per add',
  },
  mistakes: [
    'Using a max-heap of everything and popping k times per call.',
    'Forgetting that the initial nums may have fewer than k elements.',
    'Popping before pushing (you might evict a value that should stay).',
  ],
};
