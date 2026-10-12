// ---- large-test generators (deterministic; used by the timed tests below) ----
// arr[i] = (i mod 100) + 1, so value v sits exactly at the indices i ≡ v − 1 (mod 100) and every answer has a closed form.
const bigFreq = () => {
  const n = 100000, arr = Array.from({ length: n }, (_, i) => (i % 100) + 1);
  const upTo = (x, c) => (x < c ? 0 : Math.floor((x - c) / 100) + 1);   // indices in [0, x] that are ≡ c (mod 100)
  const ops = ['RangeFreqQuery'], args = [[arr]], expected = [null];
  let s = 5;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  for (let k = 0; k < 100000; k++) {
    const l = rnd() % 1000, r = n - 1 - (rnd() % 1000), v = 1 + (rnd() % 120);
    ops.push('query'); args.push([l, r, v]);
    expected.push(v > 100 ? 0 : upTo(r, v - 1) - upTo(l - 1, v - 1));
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'range-frequency-queries',
  title: 'Range Frequency Queries',
  difficulty: 'Medium',
  order: 4,
  pattern: 'range-query-index-lists',
  tags: ['design', 'binary search', 'hash map', 'array'],
  source: { platform: 'LeetCode', number: 2080, url: 'https://leetcode.com/problems/range-frequency-queries/' },

  statement: `Design a class \`RangeFreqQuery\`:

- \`constructor(arr)\` — receives an integer array (it never changes afterwards);
- \`query(left, right, value)\` — returns how many times \`value\` occurs in the subarray \`arr[left..right]\` (inclusive).

Up to 10^5 queries will be made.`,
  examples: [
    { input: '["RangeFreqQuery","query","query"]\n[[[12,33,4,56,22,2,34,33,22,12,34,56]],[1,2,4],[0,11,33]]', output: '[null,1,2]', explanation: 'arr[1..2] = [33,4] contains one 4. The whole array contains 33 twice.' },
  ],
  constraints: ['1 <= arr.length <= 10^5', '1 <= arr[i], value <= 10^4', '0 <= left <= right < arr.length', 'At most 10^5 calls to query'],

  think: `- Looping over [left, right] per query is O(n). With 10^5 queries?
- Suppose you knew **every index where value appears**, in sorted order. How would you count those inside [left, right]?
- Does anything ever change after construction? What does that tell you about needing a tree?`,
  patternChallenge: {
    options: ['Segment Tree with a frequency map per node', 'Per-value index lists + binary search', 'Sliding Window — Variable Size', 'Union-Find'],
    answer: 1,
    explanation: 'The array is static and each query is about one specific value. The sorted list of positions of that value turns the count into two binary searches. A segment tree of frequency maps would work but costs O(n log n) memory and much more code for no benefit.',
  },
  hints: [
    'In the constructor, build a Map from value to the list of indices where it occurs. Pushing while scanning left to right keeps each list sorted.',
    'The answer is `lowerBound(list, right + 1) − lowerBound(list, left)`, where lowerBound returns the first position whose element is ≥ x.',
  ],
  approach: `**Brute force:** loop from left to right counting \`value\` — O(n) per query, up to 10^10 total.

**Why no tree is needed:** trees shine when data *changes*. Here the array is fixed, and each query targets **one value**. For that value, the set of positions is a sorted list, and "how many positions lie in [left, right]" is a classic binary-search count.

**Optimized:**
1. \`positions = new Map()\`; for each i, push i into \`positions.get(arr[i])\`.
2. \`query(l, r, v)\`: \`list = positions.get(v)\`; if missing return 0; otherwise \`lowerBound(list, r + 1) − lowerBound(list, l)\`.`,

  kind: 'design',
  className: 'RangeFreqQuery',
  starterCode: `class RangeFreqQuery {
  /**
   * @param {number[]} arr
   */
  constructor(arr) {
    
  }

  /**
   * @param {number} left
   * @param {number} right
   * @param {number} value
   * @return {number}
   */
  query(left, right, value) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: one 4 in arr[1..2]; 33 twice in the whole array.', ops: ["RangeFreqQuery","query","query"], args: [[[12,33,4,56,22,2,34,33,22,12,34,56]],[1,2,4],[0,11,33]], expected: [null,1,2] },
    { scenario: 'Single element', hint: 'Values that never appear must return 0, not undefined.', ops: ["RangeFreqQuery","query","query","query"], args: [[[1]],[0,0,1],[0,0,2],[0,0,10000]], expected: [null,1,0,0] },
    { scenario: 'All equal values', hint: 'Every position matches; the count is the range length.', ops: ["RangeFreqQuery","query","query","query"], args: [[[7,7,7,7,7]],[0,4,7],[1,3,7],[2,2,7]], expected: [null,5,3,1] },
    { scenario: 'Occurrence exactly at right', hint: 'Using lowerBound(list, right) for the right end excludes an occurrence exactly at right: [1, 4] contains the 2 at index 3 and 1s at 2 and 4.', ops: ["RangeFreqQuery","query","query","query","query","query"], args: [[[1,2,1,2,1,2]],[0,0,2],[1,4,1],[5,5,2],[0,5,3],[3,3,2]], expected: [null,0,2,1,0,1] },
    { scenario: 'Occurrence exactly at left', hint: 'The left end is inclusive too.', ops: ["RangeFreqQuery","query","query","query"], args: [[[5,6,5,6]],[2,3,5],[0,0,5],[1,1,5]], expected: [null,1,1,0] },
    { scenario: 'Value outside the range', hint: 'The value occurs, but not inside [left, right].', ops: ["RangeFreqQuery","query","query","query"], args: [[[3,1,4,1,5,9,2,6]],[3,3,1],[4,7,1],[0,0,1]], expected: [null,1,0,0] },
    { scenario: 'Max value 10^4', hint: 'Values up to 10^4 — use a Map or sized array, not a fixed small table.', ops: ["RangeFreqQuery","query","query","query"], args: [[[10000,1,10000,10000]],[0,3,10000],[1,2,10000],[1,1,1]], expected: [null,3,1,1] },
    { scenario: 'Whole array queries', hint: 'Queries over [0, n − 1] count every occurrence.', ops: ["RangeFreqQuery","query","query","query"], args: [[[2,3,2,3,2]],[0,4,2],[0,4,3],[0,4,4]], expected: [null,3,2,0] },
    { scenario: 'Single-cell ranges', hint: 'left = right: the answer is 0 or 1.', ops: ["RangeFreqQuery","query","query","query","query"], args: [[[4,8,15,16,23,42]],[0,0,4],[5,5,42],[2,2,16],[3,3,16]], expected: [null,1,1,0,1] },
    { scenario: 'Random 50 queries (n = 40)', hint: 'Pseudo-random ranges and values checked against direct counting.', ops: ["RangeFreqQuery","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query","query"], args: [[[4,5,3,5,3,1,4,4,4,4,5,2,2,2,5,1,2,1,3,3,2,2,4,3,1,1,2,1,5,2,2,5,3,3,2,2,5,1,5,2]],[10,21,1],[35,39,4],[32,39,3],[33,33,6],[6,25,5],[23,38,6],[28,39,1],[29,35,2],[26,39,3],[35,38,6],[0,15,3],[25,28,6],[30,39,3],[7,32,2],[4,27,5],[29,39,6],[2,21,1],[35,38,4],[24,39,1],[1,18,4],[30,31,1],[31,32,2],[12,19,3],[5,28,2],[34,35,1],[3,24,2],[0,23,1],[33,37,6],[30,33,3],[23,37,6],[20,31,1],[29,29,4],[2,19,5],[19,31,6],[24,39,3],[9,17,4],[6,17,5],[31,32,4],[20,35,1],[21,30,2],[26,39,1],[11,11,6],[8,15,1],[9,34,2],[38,39,3],[39,39,2],[36,39,1],[37,38,2],[10,19,5],[11,23,4]], expected: [null,2,0,2,0,2,0,1,4,2,0,2,0,2,9,2,0,3,0,4,4,0,0,2,7,0,6,3,0,2,0,3,0,3,0,2,1,2,0,3,4,2,0,1,10,0,1,1,0,2,1] },
    { scenario: 'Large (n = 10^5, 10^5 queries)', hint: 'Counting inside [left, right] directly is ~10^5 steps per query — 10^10 in total. Store each value\'s sorted index list and binary-search both ends.', opsGen: String(bigFreq), timeLimitMs: 1000 },
  ],
  solution: {
    code: `class RangeFreqQuery {
  constructor(arr) {
    this.positions = new Map();              // value -> sorted list of indices
    arr.forEach((v, i) => {
      if (!this.positions.has(v)) this.positions.set(v, []);
      this.positions.get(v).push(i);         // scanning left→right keeps it sorted
    });
  }

  // first index in a with a[idx] >= x
  static lowerBound(a, x) {
    let lo = 0, hi = a.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  query(left, right, value) {
    const list = this.positions.get(value);
    if (!list) return 0;
    return RangeFreqQuery.lowerBound(list, right + 1) - RangeFreqQuery.lowerBound(list, left);
  }
}`,
  },
  dryRun: {
    columns: ['query', 'positions of value', 'lowerBound(left)', 'lowerBound(right + 1)', 'answer'],
    rows: [
      ['(1, 2, 4)', '[2]', '0', '1', '1'],
      ['(0, 11, 33)', '[1, 7]', '0', '2', '2'],
    ],
  },
  complexity: { time: 'O(n) build, O(log n) per query', space: 'O(n)', explanation: 'Every index is stored exactly once across all lists. Each query does two binary searches on one list.' },
  alternative: {
    title: 'Prefix counts per value (small value range)',
    md: 'If only a few distinct values exist, store a prefix-count array per value: `cnt[v][i]` = occurrences of v in arr[0..i−1]. Queries become O(1), but memory is O(n × distinct values) — far too much here (10^4 values × 10^5). The index-list method is the memory-efficient version of the same idea.',
    complexity: 'O(n·V) build and space, O(1) query',
  },
  mistakes: [
    'Using `lowerBound(list, right)` for the right end — that excludes an occurrence exactly at `right`.',
    'Returning `undefined` (or crashing) for values that never appear; return 0.',
    'Building a segment tree of frequency maps — correct but heavy and unnecessary for a static array.',
    'Re-sorting the lists: they are already sorted because indices are pushed in increasing order.',
  ],
};
