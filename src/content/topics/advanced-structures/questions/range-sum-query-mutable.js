// ---- large-test generators (deterministic; used by the timed tests below) ----
// n = 3·10^4. Updates only touch indices [100, n − 100); every query is [l, r] with l < 100 and r >= n − 100.
// So each answer = (current total) − (fixed left edge before l) − (fixed right edge after r), tracked in O(1)/O(100).
const bigNumArray = () => {
  const n = 30000, nums = Array.from({ length: n }, (_, i) => ((i * 7) % 201) - 100);
  const cur = [...nums];
  let total = nums.reduce((a, b) => a + b, 0);
  const ops = ['NumArray'], args = [[nums]], expected = [null];
  let s = 12;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  for (let k = 0; k < 29999; k++) {
    if (k % 2 === 0) {
      const i = 100 + (rnd() % (n - 200)), v = (rnd() % 201) - 100;
      total += v - cur[i]; cur[i] = v;
      ops.push('update'); args.push([i, v]); expected.push(null);
    } else {
      const l = rnd() % 100, r = n - 1 - (rnd() % 100);
      let ans = total;
      for (let j = 0; j < l; j++) ans -= nums[j];
      for (let j = r + 1; j < n; j++) ans -= nums[j];
      ops.push('sumRange'); args.push([l, r]); expected.push(ans);
    }
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'range-sum-query-mutable',
  title: 'Range Sum Query - Mutable',
  difficulty: 'Medium',
  order: 1,
  pattern: 'fenwick-tree-bit',
  tags: ['design', 'fenwick tree', 'segment tree', 'array'],
  source: { platform: 'LeetCode', number: 307, url: 'https://leetcode.com/problems/range-sum-query-mutable/' },

  statement: `Design a class \`NumArray\` that is built from an integer array \`nums\` and supports two operations, called in any order:

- \`update(index, val)\` — set \`nums[index]\` to \`val\`.
- \`sumRange(left, right)\` — return \`nums[left] + nums[left + 1] + … + nums[right]\` (both ends inclusive).

Up to 3 · 10^4 calls are made in total, so both operations need to be fast.`,
  examples: [
    { input: '["NumArray","sumRange","update","sumRange"]\n[[[1,3,5]],[0,2],[1,2],[0,2]]', output: '[null,9,null,8]', explanation: 'Sum of [1,3,5] is 9. After nums[1] = 2 the array is [1,2,5], sum 8.' },
  ],
  constraints: ['1 <= nums.length <= 3 * 10^4', '-100 <= nums[i], val <= 100', '0 <= index < nums.length', '0 <= left <= right < nums.length', 'At most 3 * 10^4 calls to update and sumRange'],

  think: `- If you only had \`sumRange\`, what would you precompute? What happens to it after one \`update\`?
- Which operation is cheap in a plain array, and which is cheap in a prefix-sum array?
- A Fenwick tree only knows "add delta at i". How do you turn "set nums[i] = val" into a delta?`,
  patternChallenge: {
    options: ['Prefix Sum (static)', 'Sliding Window — Variable Size', 'Fenwick Tree (Binary Indexed Tree)', 'Monotonic Stack'],
    answer: 2,
    explanation: 'Updates and range-sum queries are interleaved. Static prefix sums make every update O(n); a Fenwick tree (or a segment tree) keeps both operations at O(log n). Sum is invertible, so the shorter Fenwick tree is enough.',
  },
  hints: [
    'Keep a copy of the current values so you can compute `delta = val − nums[index]` on update.',
    'Use a Fenwick tree: `update` → `add(index, delta)`; `sumRange(l, r)` → `prefix(r) − prefix(l − 1)`. The toolkit `FenwickTree` gives you `add`, `prefixSum` and `rangeSum`.',
  ],
  approach: `**Brute force A — plain array:** \`update\` O(1), \`sumRange\` loops over the range, O(n). With 3·10^4 calls on 3·10^4 elements that is ~10^9 steps in the worst case.

**Brute force B — prefix sums:** \`sumRange\` O(1), but \`update\` must shift every later prefix, O(n).

**Optimized — Fenwick tree:** store partial sums so every prefix is the sum of ≤ log n cells and every position is contained in ≤ log n cells.
1. Build the tree from \`nums\` (n point additions, O(n log n)) and keep \`this.nums\` as the current values.
2. \`update(i, val)\`: \`add(i, val − nums[i])\`, then \`nums[i] = val\`.
3. \`sumRange(l, r)\`: \`prefix(r) − prefix(l − 1)\`.

The solution below uses the toolkit \`FenwickTree\` (a global in the editor); writing the two 3-line loops yourself is equally fine and is what an interviewer expects to see.`,

  kind: 'design',
  className: 'NumArray',
  starterCode: `class NumArray {
  /**
   * @param {number[]} nums
   */
  constructor(nums) {
    
  }

  /**
   * @param {number} index
   * @param {number} val
   * @return {void}
   */
  update(index, val) {
    
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
    { scenario: 'Example 1', hint: 'The statement example: sum 9, then nums[1] = 2 gives 8.', ops: ["NumArray","sumRange","update","sumRange"], args: [[[1,3,5]],[0,2],[1,2],[0,2]], expected: [null,9,null,8] },
    { scenario: 'Single element', hint: 'n = 1: the range [0, 0] is the element itself.', ops: ["NumArray","sumRange"], args: [[[7]],[0,0]], expected: [null,7] },
    { scenario: 'Update single element', hint: 'Adding val instead of val − nums[index] accumulates old values: -1 → 5 must give 5, not 4.', ops: ["NumArray","update","sumRange","update","sumRange"], args: [[[-1]],[0,5],[0,0],[0,-3],[0,0]], expected: [null,null,5,null,-3] },
    { scenario: 'Repeated updates same index', hint: 'Forgetting to store the new value in this.nums makes the next delta wrong: 4 then 1 must leave 1.', ops: ["NumArray","update","update","sumRange","sumRange","sumRange"], args: [[[0,0,0,0]],[2,4],[2,1],[0,3],[3,3],[2,2]], expected: [null,null,null,1,0,1] },
    { scenario: 'Update index 0', hint: 'Using 0-based indices directly in Fenwick loops: 0 & -0 is 0 and the loop never advances. Shift to 1-based.', ops: ["NumArray","sumRange","update","sumRange","update","sumRange","sumRange"], args: [[[9,-8]],[0,1],[0,3],[0,1],[1,-3],[1,1],[0,0]], expected: [null,1,null,-5,null,-3,3] },
    { scenario: 'Mixed ranges', hint: 'Several inner ranges before and after updates.', ops: ["NumArray","sumRange","update","sumRange","sumRange","update","sumRange"], args: [[[5,2,9,-3,5,20,10,-7]],[1,4],[3,7],[1,4],[0,7],[0,1],[0,0]], expected: [null,13,null,23,51,null,1] },
    { scenario: 'Range at the right end', hint: 'Queries touching the last index — the Fenwick update loop must reach n.', ops: ["NumArray","update","sumRange","sumRange","sumRange"], args: [[[1,2,3,4,5]],[4,-100],[4,4],[3,4],[0,4]], expected: [null,null,-100,-96,-90] },
    { scenario: 'All negative values', hint: 'Sums can be negative; do not clamp at 0.', ops: ["NumArray","sumRange","update","sumRange","sumRange"], args: [[[-100,-100,-100]],[0,2],[1,100],[0,2],[1,1]], expected: [null,-300,null,-100,100] },
    { scenario: 'Queries only', hint: 'No updates: sums of the initial array.', ops: ["NumArray","sumRange","sumRange","sumRange","sumRange"], args: [[[3,1,4,1,5,9,2,6]],[0,7],[2,5],[7,7],[0,0]], expected: [null,31,19,6,3] },
    { scenario: 'Update to the same value', hint: 'A delta of 0 changes nothing.', ops: ["NumArray","update","sumRange","update","sumRange"], args: [[[4,4]],[0,4],[0,1],[1,4],[0,1]], expected: [null,null,8,null,8] },
    { scenario: 'Random 40 calls (n = 20)', hint: 'Pseudo-random updates and ranges checked against direct sums.', ops: ["NumArray","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange","update","sumRange"], args: [[[-26,-76,-50,-70,45,48,-30,-21,-53,-79,-85,0,-72,-19,47,86,25,-94,-7,79]],[6,-65],[19,19],[0,17],[17,19],[2,-47],[3,4],[16,-67],[9,15],[10,-92],[7,13],[8,32],[5,5],[14,-80],[15,19],[16,-13],[5,5],[2,-87],[3,13],[16,-66],[1,10],[14,-37],[7,13],[8,-10],[5,17],[14,-79],[11,17],[16,53],[1,7],[2,93],[7,7],[12,42],[9,15],[10,75],[11,11],[0,-74],[5,14],[18,-14],[19,19],[12,-53],[9,14]], expected: [null,null,79,null,-22,null,-25,null,-122,null,-336,null,48,null,-3,null,48,null,-293,null,-365,null,-251,null,-421,null,-244,null,-226,null,-21,null,-141,null,0,null,-108,null,79,null,-155] },
    { scenario: 'Large (n = 3·10^4, 3·10^4 calls)', hint: 'Summing each range directly or rebuilding prefix sums on every update is O(n) per call — about 4.5·10^8 steps here. A Fenwick or segment tree makes both O(log n).', opsGen: String(bigNumArray), timeLimitMs: 150 },
  ],
  solution: {
    code: `class NumArray {
  constructor(nums) {
    this.n = nums.length;
    this.nums = nums.slice();                 // current values (needed to compute deltas)
    this.tree = new Array(this.n + 1).fill(0); // 1-based Fenwick cells
    for (let i = 0; i < this.n; i++) this.#add(i, nums[i]);
  }

  // nums[i] += d  — climb by adding the lowest set bit
  #add(i, d) {
    for (let k = i + 1; k <= this.n; k += k & -k) this.tree[k] += d;
  }

  // nums[0] + ... + nums[i]  — descend by removing the lowest set bit
  #prefix(i) {
    let s = 0;
    for (let k = i + 1; k > 0; k -= k & -k) s += this.tree[k];
    return s;
  }

  update(index, val) {
    this.#add(index, val - this.nums[index]);
    this.nums[index] = val;
  }

  sumRange(left, right) {
    return this.#prefix(right) - this.#prefix(left - 1); // #prefix(-1) === 0
  }
}`,
    explanation: 'The tree stores deltas, so an assignment is converted into `val − old`. `#prefix(left − 1)` with left = 0 starts the loop at k = 0 and returns 0 — no special case.',
  },
  dryRun: {
    columns: ['operation', 'delta / cells touched (1-based)', 'result'],
    rows: [
      ['NumArray([1,3,5])', 'tree[1]=1, tree[2]=4, tree[3]=5', 'null'],
      ['sumRange(0, 2)', 'prefix(2): tree[3] + tree[2] = 5 + 4', '9'],
      ['update(1, 2)', 'delta = 2 − 3 = −1 → tree[2] = 3 (next cell 4 > n)', 'null'],
      ['sumRange(0, 2)', 'prefix(2): tree[3] + tree[2] = 5 + 3', '8'],
    ],
  },
  complexity: { time: 'O(log n) per update and sumRange, O(n log n) build', space: 'O(n)', explanation: 'Each loop removes or adds one set bit per step, so it runs at most ⌊log₂ n⌋ + 1 times. We store n + 1 tree cells and a copy of nums.' },
  alternative: {
    title: 'Segment tree (iterative)',
    md: 'The toolkit `SegmentTree` with `update(i, val)` (it assigns directly) and `query(l, r)` gives the same O(log n) bounds and also works for min/max. Sqrt decomposition (blocks of size √n with block sums) is a simpler O(√n) alternative.',
    code: `class NumArray {
  constructor(nums) { this.st = new SegmentTree(nums, (a, b) => a + b, 0); }
  update(index, val) { this.st.update(index, val); }
  sumRange(left, right) { return this.st.query(left, right); }
}`,
    complexity: 'O(log n) per operation, O(n) space',
  },
  mistakes: [
    'Adding `val` instead of `val − nums[index]` — the tree then accumulates old values.',
    'Forgetting to store the new value in `this.nums`, so the next update computes a wrong delta.',
    'Using 0-based indices directly in the Fenwick loops — `0 & -0` is 0 and the loop never advances.',
    'Rebuilding prefix sums on every update (O(n)) — correct but too slow for the limits.',
  ],
};
