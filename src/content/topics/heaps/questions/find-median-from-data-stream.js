// 30000 pseudo-random addNum calls with findMedian every 15 adds; expected medians come from a sorted array kept by binary-search insertion.
const bigMedianOps = () => {
  let s = 7; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const ops = ['MedianFinder'], args = [[]], expected = [null], a = [];
  for (let i = 1; i <= 30000; i++) {
    const x = rnd(200001) - 100000;
    let lo = 0, hi = a.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; }
    a.splice(lo, 0, x);
    ops.push('addNum'); args.push([x]); expected.push(null);
    if (i % 15 === 0 || i < 4) { const h = a.length >> 1; ops.push('findMedian'); args.push([]); expected.push(a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2); }
  }
  return { ops, args, expected };
};

export default {
  id: 'find-median-from-data-stream',
  title: 'Find Median from Data Stream',
  difficulty: 'Hard',
  order: 1,
  pattern: 'heap-two-heaps',
  kind: 'design',
  tags: ['heap', 'two heaps', 'design', 'data stream'],
  source: { platform: 'LeetCode', number: 295, url: 'https://leetcode.com/problems/find-median-from-data-stream/' },

  statement: `Design a class \`MedianFinder\`:

- \`addNum(num)\` — adds an integer from the stream;
- \`findMedian()\` — returns the median of all numbers added so far. For an even count, the median is the average of the two middle values.

Answers within 10⁻⁵ of the true median are accepted.`,
  examples: [
    { input: 'addNum(1), addNum(2), findMedian(), addNum(3), findMedian()', output: '[null,null,null,1.5,null,2]' },
  ],
  constraints: ['-10^5 <= num <= 10^5', 'findMedian is only called after at least one addNum', 'At most 5 * 10^4 calls in total'],

  think: `- Keeping a sorted array makes \`findMedian\` O(1) but \`addNum\` O(n). Can you keep just enough order?
- The median separates a lower half from an upper half. Which element of each half do you need to see?
- What two invariants must hold after every insertion?`,
  patternChallenge: {
    options: ['Heap — Top K / Kth Element', 'Sorted array with binary insertion', 'Heap — Two Heaps', 'Heap — K-way Merge'],
    answer: 2,
    explanation: 'A max-heap for the lower half and a min-heap for the upper half expose the two middle values at their tops. A sorted array makes each insert O(n); a single size-k heap cannot track a moving middle.',
  },
  hints: [
    '`low` = max-heap (smaller half), `high` = min-heap (larger half). Keep low.size() === high.size() or one more.',
    'addNum: push to low, move low\'s top to high, and if high is now larger move its top back to low. Median: low.peek() or the average of both tops.',
  ],
  approach: `**Brute force:** store all numbers; sort on each \`findMedian\` → O(n log n) per query. Or keep a sorted array with binary-search insertion → O(n) per add (shifting).

**Two heaps:**
- \`low\` (max-heap) holds the smaller half; \`high\` (min-heap) the larger half.
- Invariant 1: \`max(low) ≤ min(high)\`. Invariant 2: \`low.size() − high.size() ∈ {0, 1}\`.
- \`addNum(x)\`: \`low.push(x)\`; \`high.push(low.pop())\` (the largest of the low side crosses, preserving invariant 1); if \`high.size() > low.size()\`, \`low.push(high.pop())\` (invariant 2).
- \`findMedian\`: odd total → \`low.peek()\`; even → \`(low.peek() + high.peek()) / 2\`.

\`addNum\` is O(log n), \`findMedian\` O(1).`,

  className: 'MedianFinder',
  starterCode: `class MedianFinder {
  constructor() {
    
  }

  /**
   * @param {number} num
   * @return {void}
   */
  addNum(num) {
    
  }

  /** @return {number} */
  findMedian() {
    
  }
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: 'Median of [1,2] is 1.5; after adding 3 it is 2.', ops: ["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"], args: [[],[1],[2],[],[3],[]], expected: [null,null,null,1.5,null,2] },
    { scenario: 'Single number', hint: 'With one number the median is that number — the smaller-half heap must hold it.', ops: ["MedianFinder","addNum","findMedian"], args: [[],[-5],[]], expected: [null,null,-5] },
    { scenario: 'Even count averages', hint: 'With an even count the median is the average of the two middle values, which may be a non-integer.', ops: ["MedianFinder","addNum","addNum","findMedian"], args: [[],[-5],[2],[]], expected: [null,null,null,-1.5] },
    { scenario: 'Odd count uses one heap', hint: 'For an odd count return the top of the heap holding the extra element, not an average.', ops: ["MedianFinder","addNum","addNum","addNum","findMedian","addNum","addNum","findMedian"], args: [[],[1],[2],[3],[],[4],[5],[]], expected: [null,null,null,null,2,null,null,3] },
    { scenario: 'Increasing stream', hint: 'Every new number is the largest so far. If you never rebalance the heap sizes, one heap grows and the median drifts.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[1],[],[2],[],[3],[],[4],[],[5],[],[6],[],[7],[]], expected: [null,null,1,null,1.5,null,2,null,2.5,null,3,null,3.5,null,4] },
    { scenario: 'Decreasing stream', hint: 'Every new number is the smallest so far — numbers must move from the small half to the large half.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[7],[],[6],[],[5],[],[4],[],[3],[],[2],[],[1],[]], expected: [null,null,7,null,6.5,null,6,null,5.5,null,5,null,4.5,null,4] },
    { scenario: 'Zigzag values', hint: 'Alternating small and large values exercise both rebalancing directions.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[5],[],[15],[],[1],[],[3],[],[8],[],[7],[],[9],[],[10],[],[20],[],[19],[]], expected: [null,null,5,null,10,null,5,null,4,null,5,null,6,null,7,null,7.5,null,8,null,8.5] },
    { scenario: 'All duplicates', hint: 'Equal values can live in either heap; the median is that value.', ops: ["MedianFinder","addNum","addNum","addNum","findMedian","addNum","findMedian"], args: [[],[2],[2],[2],[],[2],[]], expected: [null,null,null,null,2,null,2] },
    { scenario: 'Negative numbers', hint: 'Medians of negatives, including -1.5 and -2.5.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[-1],[],[-2],[],[-3],[],[-4],[]], expected: [null,null,-1,null,-1.5,null,-2,null,-2.5] },
    { scenario: 'Extreme values', hint: 'Values at ±10^5 average to 0.', ops: ["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"], args: [[],[100000],[-100000],[],[100000],[]], expected: [null,null,null,0,null,100000] },
    { scenario: 'Zeros and signs', hint: 'Mixed zeros, positives and negatives around the middle.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[0],[],[0],[],[-1],[],[1],[],[0],[]], expected: [null,null,0,null,0,null,0,null,0,null,0] },
    { scenario: 'Query only at the end', hint: 'Many adds before a single findMedian — the heaps must stay balanced after every add.', ops: ["MedianFinder","addNum","addNum","addNum","addNum","addNum","addNum","addNum","findMedian"], args: [[],[6],[10],[2],[6],[5],[1],[9],[]], expected: [null,null,null,null,null,null,null,null,6] },
    { scenario: 'Longer random stream', hint: 'A 50-number pseudo-random stream with a query after every add.', ops: ["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian","addNum","findMedian"], args: [[],[95938],[],[35831],[],[-52895],[],[-77816],[],[-92565],[],[54083],[],[-64591],[],[-50184],[],[33968],[],[91964],[],[-13427],[],[84267],[],[6714],[],[33518],[],[-87642],[],[73468],[],[-49330],[],[-35191],[],[-39127],[],[49505],[],[53683],[],[66250],[],[38770],[],[-61523],[],[26789],[],[-60794],[],[-58122],[],[17745],[],[-49977],[],[96092],[],[-26919],[],[61509],[],[67728],[],[-25302],[],[-28370],[],[60201],[],[54610],[],[-83640],[],[76518],[],[65006],[],[10250],[],[-62422],[],[91617],[],[11865],[],[-31856],[],[65810],[],[-34883],[],[-30054],[],[3781],[],[67051],[]], expected: [null,null,95938,null,65884.5,null,35831,null,-8532,null,-52895,null,-8532,null,-52895,null,-51539.5,null,-50184,null,-8108,null,-13427,null,10270.5,null,6714,null,20116,null,6714,null,20116,null,6714,null,-3356.5,null,-13427,null,-3356.5,null,6714,null,20116,null,33518,null,20116,null,26789,null,16751.5,null,6714,null,12229.5,null,6714,null,12229.5,null,6714,null,12229.5,null,17745,null,12229.5,null,6714,null,12229.5,null,17745,null,12229.5,null,17745,null,22267,null,17745,null,13997.5,null,17745,null,14805,null,11865,null,14805,null,11865,null,11057.5,null,10250,null,11057.5] },
    { scenario: 'Large stream (3·10^4 adds)', hint: 'Sorting all numbers on every findMedian is O(n log n) per query — far too slow here. Two heaps give O(log n) per add and O(1) per median.', opsGen: String(bigMedianOps), timeLimitMs: 300 },
  ],

  solution: {
    code: `class MedianFinder {
  constructor() {
    this.low = new MaxHeap();   // smaller half; top = largest of the small numbers
    this.high = new MinHeap();  // larger half; top = smallest of the large numbers
  }

  addNum(num) {
    this.low.push(num);
    this.high.push(this.low.pop());                  // keep every low <= every high
    if (this.high.size() > this.low.size()) {        // keep low the same size or one bigger
      this.low.push(this.high.pop());
    }
  }

  findMedian() {
    if (this.low.size() > this.high.size()) return this.low.peek();
    return (this.low.peek() + this.high.peek()) / 2;
  }
}`,
  },
  dryRun: {
    columns: ['call', 'low (max-heap)', 'high (min-heap)', 'median'],
    rows: [
      ['addNum(5)', '{5}', '{}', '—'],
      ['addNum(15)', '{5}', '{15}', '—'],
      ['findMedian', '', '', '(5 + 15) / 2 = 10'],
      ['addNum(1)', '{1, 5}', '{15}', '—'],
      ['findMedian', '', '', '5'],
      ['addNum(3)', '{1, 3}', '{5, 15}', '—'],
      ['findMedian', '', '', '(3 + 5) / 2 = 4'],
    ],
  },
  complexity: { time: 'addNum O(log n), findMedian O(1)', space: 'O(n)', explanation: 'Each add performs at most three heap operations; every number is stored once.' },
  alternative: {
    title: 'Counting array (values in a small range)',
    md: 'If all values were in [0, 100], keep a count per value and walk the counts to find the middle — O(100) per query. The follow-up "99% of numbers are in [0, 100]" combines this with two overflow counters.',
    complexity: 'O(R) per query, R = range size',
  },
  mistakes: [
    'Pushing into one heap based on a comparison with a top and forgetting to rebalance sizes.',
    'Letting high hold the extra element but still returning low.peek() for odd counts.',
    'Using integer division habits — in JS (a + b) / 2 is already exact enough for these ranges.',
  ],
};
