export default {
  id: 'data-stream-as-disjoint-intervals',
  title: 'Data Stream as Disjoint Intervals',
  difficulty: 'Hard',
  order: 1,
  pattern: 'intervals-design',
  kind: 'design',
  tags: ['design', 'binary search', 'intervals'],
  source: { platform: 'LeetCode', number: 352, url: 'https://leetcode.com/problems/data-stream-as-disjoint-intervals/' },

  statement: `Non-negative integers arrive one at a time. At any moment you may be asked to summarise all numbers seen so far as a sorted list of **disjoint closed intervals** of consecutive integers.

Implement \`SummaryRanges\`:

- \`new SummaryRanges()\` — starts with an empty stream.
- \`addNum(value)\` — adds \`value\` to the stream (values may repeat).
- \`getIntervals()\` — returns the summary as \`[[start, end], ...]\` sorted by start.

For example, after adding 1, 3, 7, 2, 6 the summary is \`[[1,3],[6,7]]\`.`,
  examples: [
    {
      input: '["SummaryRanges","addNum","getIntervals","addNum","getIntervals","addNum","getIntervals","addNum","getIntervals","addNum","getIntervals"]\n[[],[1],[],[3],[],[7],[],[2],[],[6],[]]',
      output: '[null,null,[[1,1]],null,[[1,1],[3,3]],null,[[1,1],[3,3],[7,7]],null,[[1,3],[7,7]],null,[[1,3],[6,7]]]',
      explanation: 'Adding 2 glues [1,1] and [3,3] together; adding 6 extends [7,7] to the left.',
    },
  ],
  constraints: ['0 <= value <= 10^4', 'At most 3·10^4 calls in total', 'At most 10^2 calls to getIntervals'],

  think: `- If you keep the intervals sorted and disjoint at all times, which intervals can a new value affect?
- A new value \`v\` can: already be covered, extend the left neighbour, extend the right neighbour, glue both together, or stand alone. How do you tell which case you are in?
- What is cheaper: doing work in \`addNum\` or in \`getIntervals\`? Look at how often each is called.`,
  patternChallenge: {
    options: ['Store values in a Set and merge from scratch on every getIntervals', 'Sorted interval set: merge the new value with its neighbours on insert', 'Sweep line with a heap', 'Greedy by earliest end'],
    answer: 1,
    explanation: 'Keeping a sorted, disjoint interval list means each addNum only touches the predecessor and successor (found by binary search), and getIntervals is a copy. Rebuilding from a Set each time is correct too but repeats sorting work (see the alternative).',
  },
  hints: [
    'Binary-search the first interval whose start is `> value`. Its left neighbour is the only one that can contain `value` or end at `value − 1`.',
    'Cases: covered by left → nothing; left ends at v−1 and right starts at v+1 → merge the two; only left → extend its end; only right → extend its start; neither → insert [v, v].',
  ],
  approach: `**Simple approach:** store all distinct values in a Set; on \`getIntervals\`, sort them and build runs (like Summary Ranges). O(1) add, O(k log k) per query, where k = distinct values.

**Maintained interval set (intended):** keep \`list\` sorted and disjoint.
1. \`i\` = first index with \`list[i][0] > v\` (upper bound, binary search). Left neighbour = \`list[i − 1]\`, right neighbour = \`list[i]\`.
2. If the left neighbour's end \`>= v\`, v is already covered → return.
3. \`joinLeft = left.end === v − 1\`, \`joinRight = right.start === v + 1\`.
4. Both → \`left.end = right.end\` and remove \`right\`; only left → \`left.end = v\`; only right → \`right.start = v\`; neither → insert \`[v, v]\` at \`i\`.

The invariant (sorted, disjoint, and no two intervals adjacent) is preserved by each case, so \`getIntervals\` just returns copies.`,

  className: 'SummaryRanges',
  starterCode: `class SummaryRanges {
  constructor() {
    
  }

  /**
   * @param {number} value
   * @return {void}
   */
  addNum(value) {
    
  }

  /**
   * @return {number[][]}
   */
  getIntervals() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: 2 glues [1,1] and [3,3]; 6 extends [7,7] to the left.', ops: ['SummaryRanges', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [1], [], [3], [], [7], [], [2], [], [6], []], expected: [null, null, [[1, 1]], null, [[1, 1], [3, 3]], null, [[1, 1], [3, 3], [7, 7]], null, [[1, 3], [7, 7]], null, [[1, 3], [6, 7]]] },
    { scenario: 'Empty stream', hint: 'No numbers yet: return an empty list.', ops: ['SummaryRanges', 'getIntervals'], args: [[], []], expected: [null, []] },
    { scenario: 'Same value repeated', hint: 'Duplicates change nothing: one interval [5, 5].', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'getIntervals'], args: [[], [5], [5], [5], []], expected: [null, null, null, null, [[5, 5]]] },
    { scenario: 'Descending inserts', hint: 'Each new value extends the interval to the left (join right neighbour).', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals'], args: [[], [4], [3], [2], [1], []], expected: [null, null, null, null, null, [[1, 4]]] },
    { scenario: 'Ascending inserts', hint: 'Each new value extends the interval to the right (join left neighbour).', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'getIntervals'], args: [[], [0], [1], [2], []], expected: [null, null, null, null, [[0, 2]]] },
    { scenario: 'Join both neighbours', hint: 'Adding 3 between [1,2] and [4,5] must merge all three into [1,5], not leave two intervals.', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [1], [2], [4], [5], [], [3], []], expected: [null, null, null, null, null, [[1, 2], [4, 5]], null, [[1, 5]]] },
    { scenario: 'Duplicate inside interval', hint: 'Re-adding 2, already inside [1,3], must not split or extend anything.', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [1], [2], [3], [6], [7], [], [2], []], expected: [null, null, null, null, null, null, [[1, 3], [6, 7]], null, [[1, 3], [6, 7]]] },
    { scenario: 'Value equals a start', hint: 'Re-adding 6, the start of [6,8]. With a lower bound instead of an upper bound the left neighbour is misidentified.', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals'], args: [[], [6], [8], [7], [2], [6], []], expected: [null, null, null, null, null, null, [[2, 2], [6, 8]]] },
    { scenario: 'Boundary values', hint: '0 and 10^4 are allowed; they never join anything here.', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [0], [10000], [5000], [], [2], []], expected: [null, null, null, null, [[0, 0], [5000, 5000], [10000, 10000]], null, [[0, 0], [2, 2], [5000, 5000], [10000, 10000]]] },
    { scenario: 'Returned arrays are copies', hint: 'getIntervals is called, then more numbers arrive. Returning your internal arrays lets earlier results change later.', ops: ['SummaryRanges', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [6], [], [7], [], [5], []], expected: [null, null, [[6, 6]], null, [[6, 7]], null, [[5, 7]]] },
    { scenario: 'Mixed sequence (small range)', hint: 'A pseudo-random stream over 0..19 with many duplicates and merges.', ops: ['SummaryRanges', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [8], [8], [13], [], [6], [0], [], [9], [5], [16], [11], [17], [15], [2], [4], [], [5], [], [], [2], [3], [], [], [15], [], [10], [15], [8], [7], [11], [2], [12], [17], [], [7], [9], [17], [], [19], [4], [], [19], [2], [], [9], [3], [], [11], [], [17], []], expected: [null, null, null, null, [[8, 8], [13, 13]], null, null, [[0, 0], [6, 6], [8, 8], [13, 13]], null, null, null, null, null, null, null, null, [[0, 0], [2, 2], [4, 6], [8, 9], [11, 11], [13, 13], [15, 17]], null, [[0, 0], [2, 2], [4, 6], [8, 9], [11, 11], [13, 13], [15, 17]], [[0, 0], [2, 2], [4, 6], [8, 9], [11, 11], [13, 13], [15, 17]], null, null, [[0, 0], [2, 6], [8, 9], [11, 11], [13, 13], [15, 17]], [[0, 0], [2, 6], [8, 9], [11, 11], [13, 13], [15, 17]], null, [[0, 0], [2, 6], [8, 9], [11, 11], [13, 13], [15, 17]], null, null, null, null, null, null, null, null, [[0, 0], [2, 13], [15, 17]], null, null, null, [[0, 0], [2, 13], [15, 17]], null, null, [[0, 0], [2, 13], [15, 17], [19, 19]], null, null, [[0, 0], [2, 13], [15, 17], [19, 19]], null, null, [[0, 0], [2, 13], [15, 17], [19, 19]], null, [[0, 0], [2, 13], [15, 17], [19, 19]], null, [[0, 0], [2, 13], [15, 17], [19, 19]]] },
    { scenario: 'Mixed sequence (wide range)', hint: 'A pseudo-random stream over 0..59: many separate intervals.', ops: ['SummaryRanges', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'getIntervals', 'addNum', 'addNum', 'getIntervals', 'getIntervals', 'addNum', 'addNum', 'addNum', 'addNum', 'addNum', 'getIntervals', 'addNum', 'getIntervals', 'addNum', 'getIntervals'], args: [[], [37], [], [29], [42], [3], [24], [5], [4], [], [24], [], [46], [1], [41], [3], [], [11], [34], [5], [56], [34], [31], [50], [37], [], [38], [48], [37], [35], [], [], [25], [28], [], [52], [], [], [28], [35], [], [], [57], [21], [28], [19], [3], [], [59], [], [20], []], expected: [null, null, [[37, 37]], null, null, null, null, null, null, [[3, 5], [24, 24], [29, 29], [37, 37], [42, 42]], null, [[3, 5], [24, 24], [29, 29], [37, 37], [42, 42]], null, null, null, null, [[1, 1], [3, 5], [24, 24], [29, 29], [37, 37], [41, 42], [46, 46]], null, null, null, null, null, null, null, null, [[1, 1], [3, 5], [11, 11], [24, 24], [29, 29], [31, 31], [34, 34], [37, 37], [41, 42], [46, 46], [50, 50], [56, 56]], null, null, null, null, [[1, 1], [3, 5], [11, 11], [24, 24], [29, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [56, 56]], [[1, 1], [3, 5], [11, 11], [24, 24], [29, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [56, 56]], null, null, [[1, 1], [3, 5], [11, 11], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [56, 56]], null, [[1, 1], [3, 5], [11, 11], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 56]], [[1, 1], [3, 5], [11, 11], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 56]], null, null, [[1, 1], [3, 5], [11, 11], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 56]], [[1, 1], [3, 5], [11, 11], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 56]], null, null, null, null, null, [[1, 1], [3, 5], [11, 11], [19, 19], [21, 21], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 57]], null, [[1, 1], [3, 5], [11, 11], [19, 19], [21, 21], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 57], [59, 59]], null, [[1, 1], [3, 5], [11, 11], [19, 21], [24, 25], [28, 29], [31, 31], [34, 35], [37, 38], [41, 42], [46, 46], [48, 48], [50, 50], [52, 52], [56, 57], [59, 59]]] },
    { scenario: 'Large stream (3·10^4 calls)', hint: '29 900 additions and 100 queries. Re-sorting everything on each addNum is far too slow; keep the intervals sorted and update locally.', opsGen: '() => { const ops = [\'SummaryRanges\'], args = [[]], expected = [null]; const seen = new Uint8Array(10001); let s = 137; for (let i = 0; i < 30000 - 1; i++) { if (i % 300 === 299) { ops.push(\'getIntervals\'); args.push([]); const r = []; for (let x = 0; x <= 10000; x++) if (seen[x]) { if (r.length && r[r.length - 1][1] === x - 1) r[r.length - 1][1] = x; else r.push([x, x]); } expected.push(r); } else { s = (s * 48271) % 2147483647; const v = s % 10001; seen[v] = 1; ops.push(\'addNum\'); args.push([v]); expected.push(null); } } return { ops, args, expected }; }', timeLimitMs: 1000 },
  ],

  solution: {
    code: `class SummaryRanges {
  constructor() {
    this.list = []; // sorted, disjoint, non-adjacent closed intervals
  }

  addNum(value) {
    const list = this.list;
    // upper bound: first interval whose start > value
    let lo = 0, hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] <= value) lo = mid + 1;
      else hi = mid;
    }
    const left = lo > 0 ? list[lo - 1] : null;
    const right = lo < list.length ? list[lo] : null;

    if (left && left[1] >= value) return;              // already covered
    const joinLeft = left !== null && left[1] === value - 1;
    const joinRight = right !== null && right[0] === value + 1;

    if (joinLeft && joinRight) {                        // value glues two intervals
      left[1] = right[1];
      list.splice(lo, 1);
    } else if (joinLeft) {
      left[1] = value;
    } else if (joinRight) {
      right[0] = value;
    } else {
      list.splice(lo, 0, [value, value]);
    }
  }

  getIntervals() {
    return this.list.map(([s, e]) => [s, e]); // copies, so callers can't corrupt our state
  }
}`,
  },
  dryRun: {
    columns: ['call', 'left / right neighbour', 'case', 'list'],
    rows: [
      ['addNum(1)', '— / —', 'insert', '[[1,1]]'],
      ['addNum(3)', '[1,1] / —', 'insert', '[[1,1],[3,3]]'],
      ['addNum(7)', '[3,3] / —', 'insert', '[[1,1],[3,3],[7,7]]'],
      ['addNum(2)', '[1,1] / [3,3]', 'join both', '[[1,3],[7,7]]'],
      ['addNum(6)', '[1,3] / [7,7]', 'join right', '[[1,3],[6,7]]'],
    ],
  },
  complexity: { time: 'addNum: O(log k) search + O(k) splice; getIntervals: O(k)', space: 'O(k)', explanation: 'k = number of stored intervals. `splice` shifts elements; a balanced BST would make addNum O(log k).' },
  alternative: {
    title: 'Set + rebuild on query',
    md: 'Because getIntervals is called at most 100 times, storing values in a Set and building runs on demand is also acceptable: O(1) addNum, O(k log k) getIntervals. With values ≤ 10⁴ you can even use a boolean array and scan it: O(10⁴) per query, no sort.',
    code: `class SummaryRanges {
  constructor() { this.seen = new Set(); }
  addNum(value) { this.seen.add(value); }
  getIntervals() {
    const vals = [...this.seen].sort((a, b) => a - b);
    const out = [];
    for (const v of vals) {
      const last = out[out.length - 1];
      if (last && last[1] === v - 1) last[1] = v;
      else out.push([v, v]);
    }
    return out;
  }
}`,
    complexity: 'addNum O(1), getIntervals O(k log k), O(k) space',
  },
  mistakes: [
    'Forgetting duplicates: a value already inside an interval must change nothing.',
    'Handling "join left" and "join right" but not "join both" — leaves [1,2] and [3,3] as separate intervals.',
    'Returning the internal arrays from getIntervals, letting callers mutate your state.',
    'Using a lower bound instead of an upper bound and mis-identifying the left neighbour when a start equals value.',
  ],
};
