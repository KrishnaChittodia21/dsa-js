// n = 10^4 pseudo-random values and 10^4 near-full ranges; expected sums from a prefix array.
const bigRangeOps = () => {
  let s = 3; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const n = 10000, nums = Array.from({ length: n }, () => rnd(200001) - 100000);
  const p = [0];
  for (const x of nums) p.push(p[p.length - 1] + x);
  const ops = ['NumArray'], args = [[nums]], expected = [null];
  for (let i = 0; i < 10000; i++) {
    const l = rnd(100), r = n - 1 - rnd(100);
    ops.push('sumRange'); args.push([l, r]); expected.push(p[r + 1] - p[l]);
  }
  return { ops, args, expected };
};

export default {
  id: 'range-sum-query-immutable',
  title: 'Range Sum Query - Immutable',
  difficulty: 'Easy',
  order: 4,
  pattern: 'prefix-sum-1d',
  tags: ['array', 'prefix sum', 'design'],
  source: { platform: 'LeetCode', number: 303, url: 'https://leetcode.com/problems/range-sum-query-immutable/' },
  kind: 'design',

  statement: `Design a class \`NumArray\`:

- \`new NumArray(nums)\` stores the integer array \`nums\` (it never changes afterwards).
- \`sumRange(left, right)\` returns \`nums[left] + nums[left + 1] + … + nums[right]\` (inclusive).

\`sumRange\` may be called many times, so make each call fast.`,
  examples: [
    {
      input: 'NumArray([-2,0,3,-5,2,-1]); sumRange(0,2); sumRange(2,5); sumRange(0,5)',
      output: '[null, 1, -1, -3]',
      explanation: '-2 + 0 + 3 = 1; 3 - 5 + 2 - 1 = -1; the whole array sums to -3.',
    },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^5 <= nums[i] <= 10^5', '0 <= left <= right < nums.length', 'At most 10^4 calls to sumRange'],

  think: `- If each call loops from \`left\` to \`right\`, what is the worst-case total work?
- What could you precompute in the constructor so that any range becomes a subtraction?
- Which convention (leading 0 or not) avoids a special case for \`left = 0\`?`,
  patternChallenge: {
    options: ['Prefix Sum (precompute in the constructor)', 'Segment Tree', 'Sliding Window', 'Hash Map of all ranges'],
    answer: 0,
    explanation: 'The array never changes and we have many range-sum queries → 1D prefix sum: O(n) build, O(1) per query. A segment tree also works but is overkill without updates; storing all ranges is O(n²) memory.',
  },
  hints: [
    'In the constructor, build `prefix` of length n + 1 with `prefix[0] = 0`.',
    '`sumRange(l, r) = prefix[r + 1] - prefix[l]`.',
  ],
  approach: `**Naive:** loop in every call → O(n) per query, up to 10^8 operations total.

**Prefix sum:** the constructor builds \`prefix[i + 1] = prefix[i] + nums[i]\` in O(n). Every query subtracts two entries in O(1). The leading 0 makes \`sumRange(0, r) = prefix[r + 1] − prefix[0]\` work without an \`if\`.`,

  className: 'NumArray',
  starterCode: `class NumArray {
  /**
   * @param {number[]} nums
   */
  constructor(nums) {
    
  }

  /**
   * @param {number} left
   * @param {number} right
   * @return {number}
   */
  sumRange(left, right) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Three ranges of the example array; each is prefix[right + 1] − prefix[left].', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]], expected: [null, 1, -1, -3] },
    { scenario: 'Single element', hint: 'Smallest input: the only range is the element itself.', ops: ['NumArray', 'sumRange'], args: [[[7]], [0, 0]], expected: [null, 7] },
    { scenario: 'Single-index ranges', hint: 'left = right — prefix[right] − prefix[left] (leading-0 convention) gives 0 instead of nums[right].', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[1, 2, 3, 4]], [1, 1], [0, 3], [3, 3]], expected: [null, 2, 10, 4] },
    { scenario: 'Alternating signs', hint: 'Values cancel in pairs.', ops: ['NumArray', 'sumRange', 'sumRange'], args: [[[5, -5, 5, -5]], [0, 1], [1, 3]], expected: [null, 0, -5] },
    { scenario: 'Max values', hint: 'Sums of values at 10^5 grow beyond any single element.', ops: ['NumArray', 'sumRange', 'sumRange'], args: [[[100000, 100000, 100000]], [0, 2], [1, 2]], expected: [null, 300000, 200000] },
    { scenario: 'Last element only', hint: 'The range ending at the last index must include it.', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[0, 0, 0, 0, 1]], [0, 3], [4, 4], [2, 4]], expected: [null, 0, 1, 1] },
    { scenario: 'Range starts at 0', hint: 'With left = 0 you need the leading 0 in the prefix array (or a special case).', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[3, -1, 4, -1, 5]], [0, 0], [0, 1], [0, 4]], expected: [null, 3, 2, 10] },
    { scenario: 'All negative', hint: 'Every value is negative.', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[-100000, -3, -7, -100000]], [0, 3], [1, 2], [3, 3]], expected: [null, -200010, -10, -100000] },
    { scenario: 'Repeated queries', hint: 'The same range asked many times must give the same answer each time — do not mutate state in sumRange.', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange', 'sumRange'], args: [[[2, 4, 6, 8]], [1, 2], [1, 2], [0, 3], [1, 2]], expected: [null, 10, 10, 20, 10] },
    { scenario: 'Zeros', hint: 'An all-zero array sums to 0 everywhere.', ops: ['NumArray', 'sumRange', 'sumRange'], args: [[[0, 0, 0]], [0, 2], [1, 1]], expected: [null, 0, 0] },
    { scenario: 'Random array, many queries', hint: 'Forty random ranges over a random array at the value bounds.', ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange', 'sumRange'], args: [[[61706, -36973, 57378, 53114, -17, -51026, -27164, -60932, 14912, -68213, 82966, -76156, 25469, 74151, 68037, 68636, -95917, 18687, -6049, 48492, 57802, -78156, 93108, -42413, -33133, -69133, 89021, -53451, -29827, -76932, -60789, 26980, 26156, -82091, 69330, 14140, 34012, -86168, 9171, -27522]], [8, 8], [0, 24], [8, 8], [8, 8], [8, 16], [8, 32], [8, 32], [0, 32], [0, 24], [0, 32], [0, 32], [0, 0], [32, 32], [16, 32], [8, 32], [16, 24], [16, 32], [0, 16], [0, 0], [16, 32], [0, 24], [16, 33], [16, 24], [8, 8], [16, 24], [8, 32], [32, 32], [16, 16], [0, 0], [8, 16], [8, 8], [0, 24], [1, 32], [16, 24], [0, 16], [16, 32], [16, 32], [16, 24], [8, 32], [16, 32]], expected: [null, 14912, 148309, 14912, 14912, 93885, 4248, 4248, 334, 148309, 334, 334, 61706, 26156, -185554, 4248, -37579, -185554, 89971, 61706, -185554, 148309, -267645, -37579, 14912, -37579, 4248, 26156, -95917, 61706, 93885, 14912, 148309, -61372, -37579, 89971, -185554, -185554, -37579, 4248, -185554] },
    { scenario: 'Max size (10^4 queries)', hint: 'The largest allowed input: 10^4 values and 10^4 ranges that each cover almost the whole array. Precompute prefix sums once in the constructor.', opsGen: String(bigRangeOps) },
  ],

  solution: {
    code: `class NumArray {
  constructor(nums) {
    // prefix[i] = sum of the first i numbers; prefix[0] = 0 (empty prefix)
    this.prefix = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'prefix[i + 1]'],
    rows: [
      ['0', '-2', '-2'],
      ['1', '0', '-2'],
      ['2', '3', '1'],
      ['3', '-5', '-4'],
      ['4', '2', '-2'],
      ['5', '-1', '-3'],
    ],
  },
  complexity: { time: 'O(n) build, O(1) per query', space: 'O(n)', explanation: 'One pass in the constructor; each query reads two entries.' },
  alternative: {
    title: 'Fenwick tree (if updates were allowed)',
    md: 'If the array could change between queries (Range Sum Query - Mutable), a prefix array would need O(n) per update. A Fenwick tree gives O(log n) for both updates and queries — see Advanced Structures.',
    complexity: 'O(log n) per update and query',
  },
  mistakes: [
    'Using `prefix[right] - prefix[left]` with the leading-0 convention (drops `nums[right]`).',
    'Summing in `sumRange` instead of precomputing.',
    'Keeping a reference to `nums` and recomputing — the constructor is the place to do the work.',
  ],
};
