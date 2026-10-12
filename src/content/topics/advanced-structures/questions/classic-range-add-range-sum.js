// ---- large-test generators (deterministic; used by the timed tests below) ----
// n = 10^5 and 10^5 operations. Every rangeAdd and rangeSum covers the whole middle [100, n − 100) and starts/ends inside
// the first/last 100 cells. So the generator tracks the 200 edge cells explicitly plus one running "added to the middle" total.
const bigRangeSum = () => {
  const n = 100000, E = 100, nums = Array.from({ length: n }, (_, i) => (i % 201) - 100);
  const left = nums.slice(0, E), right = nums.slice(n - E);     // right[k] is index n − E + k
  let middleInit = 0;
  for (let i = E; i < n - E; i++) middleInit += nums[i];
  let middleAdd = 0;
  const ops = ['RangeSumArray'], args = [[nums]], expected = [null];
  let s = 99;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  for (let k = 0; k < 100000; k++) {
    const l = rnd() % E, r = n - 1 - (rnd() % E), rk = r - (n - E);
    if (k % 2 === 0) {
      const d = (rnd() % 1101) - 100;
      for (let i = l; i < E; i++) left[i] += d;
      for (let i = 0; i <= rk; i++) right[i] += d;
      middleAdd += d;
      ops.push('rangeAdd'); args.push([l, r, d]); expected.push(null);
    } else {
      let ans = middleInit + middleAdd * (n - 2 * E);
      for (let i = l; i < E; i++) ans += left[i];
      for (let i = 0; i <= rk; i++) ans += right[i];
      ops.push('rangeSum'); args.push([l, r]); expected.push(ans);
    }
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'classic-range-add-range-sum',
  title: 'Range Add, Range Sum',
  difficulty: 'Medium',
  order: 5,
  pattern: 'segment-tree-lazy-propagation',
  tags: ['design', 'segment tree', 'lazy propagation', 'fenwick tree'],
  source: { platform: 'Classic', note: 'Standard lazy-propagation exercise (range increment + range sum)' },

  statement: `Design a class \`RangeSumArray\` built from an integer array \`nums\` that supports, in any order:

- \`rangeAdd(l, r, delta)\` — add \`delta\` to **every** element \`nums[l..r]\` (inclusive);
- \`rangeSum(l, r)\` — return the sum of \`nums[l..r]\` (inclusive).

Both operations must run in **O(log n)**.`,
  examples: [
    { input: '["RangeSumArray","rangeSum","rangeAdd","rangeSum","rangeSum"]\n[[[1,2,3,4,5]],[0,4],[1,3,10],[0,4],[2,2]]', output: '[null,15,null,45,13]', explanation: 'After adding 10 to indices 1..3 the array is [1,12,13,14,5].' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i], delta <= 10^6', '0 <= l <= r < nums.length', 'Up to 10^5 operations; all sums fit in a double exactly (below 2^53)'],

  think: `- A normal segment tree updates one leaf at a time. How many leaves does one \`rangeAdd\` touch?
- If a node's whole segment receives +delta, how does its sum change — without looking at its children?
- When do the children actually *need* to know about that addition?`,
  patternChallenge: {
    options: ['Difference Array', 'Segment Tree with Lazy Propagation', 'Sparse Table', 'Prefix Sum'],
    answer: 1,
    explanation: 'Range updates are interleaved with range queries. A difference array handles range updates only if all queries come at the end; prefix sums and sparse tables are static. A lazy segment tree absorbs each update at O(log n) nodes and defers the rest.',
  },
  hints: [
    'Store `sum[node]` and `lazy[node]`. When a node is fully inside the update range: `sum[node] += delta * length`, `lazy[node] += delta`, and stop.',
    'Before recursing into the children of a node (in both operations), push its lazy value down to them and reset it to 0.',
  ],
  approach: `**Brute force:** update every element in the range (O(n)) and loop for the sum (O(n)).

**Optimized — lazy segment tree:**
- Recursive segment tree with \`sum\` and \`lazy\` arrays of size 4n.
- \`apply(node, lo, hi, d)\`: \`sum[node] += d · (hi − lo + 1)\`, \`lazy[node] += d\`.
- \`push(node)\`: if \`lazy[node]\`, apply it to both children and clear it.
- \`rangeAdd\`: no overlap → return; full overlap → apply and return; partial → push, recurse, recompute \`sum[node]\`.
- \`rangeSum\`: no overlap → 0; full → \`sum[node]\`; partial → push, recurse, add.

The toolkit \`LazySegmentTree\` has exactly this interface (\`rangeAdd\`, \`rangeSum\`); the reference writes it out.`,

  kind: 'design',
  className: 'RangeSumArray',
  starterCode: `class RangeSumArray {
  /**
   * @param {number[]} nums
   */
  constructor(nums) {
    
  }

  /**
   * @param {number} l
   * @param {number} r
   * @param {number} delta
   * @return {void}
   */
  rangeAdd(l, r, delta) {
    
  }

  /**
   * @param {number} l
   * @param {number} r
   * @return {number}
   */
  rangeSum(l, r) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: after adding 10 to 1..3 the array is [1,12,13,14,5].', ops: ["RangeSumArray","rangeSum","rangeAdd","rangeSum","rangeSum"], args: [[[1,2,3,4,5]],[0,4],[1,3,10],[0,4],[2,2]], expected: [null,15,null,45,13] },
    { scenario: 'Single element', hint: 'n = 1: add to and read the only cell.', ops: ["RangeSumArray","rangeAdd","rangeSum"], args: [[[0]],[0,0,-5],[0,0]], expected: [null,null,-5] },
    { scenario: 'Overlapping adds', hint: 'Two adds overlap on 2..3; partial queries must see both.', ops: ["RangeSumArray","rangeAdd","rangeAdd","rangeSum","rangeSum","rangeSum"], args: [[[0,0,0,0,0,0]],[0,5,1],[2,3,4],[0,5],[2,3],[4,5]], expected: [null,null,null,14,10,2] },
    { scenario: 'Partial query after add', hint: 'Forgetting push in rangeSum: a query inside a lazily-updated node reads stale children.', ops: ["RangeSumArray","rangeAdd","rangeSum","rangeSum","rangeAdd","rangeSum","rangeSum"], args: [[[5,-3,8,1]],[0,3,2],[1,1],[2,3],[1,2,-1],[0,0],[1,2]], expected: [null,null,-1,13,null,7,7] },
    { scenario: 'Delta times node length', hint: 'Multiply delta by the node\'s length (hi − lo + 1), not by the query length.', ops: ["RangeSumArray","rangeAdd","rangeSum","rangeSum","rangeSum","rangeSum"], args: [[[0,0,0,0,0,0,0,0]],[1,6,3],[0,7],[0,3],[4,7],[3,4]], expected: [null,null,18,9,9,6] },
    { scenario: 'Queries only', hint: 'No adds: plain range sums of the initial array.', ops: ["RangeSumArray","rangeSum","rangeSum","rangeSum"], args: [[[4,4,4]],[0,2],[1,1],[0,1]], expected: [null,12,4,8] },
    { scenario: 'Negative deltas', hint: 'Deltas can be negative down to −10^4.', ops: ["RangeSumArray","rangeAdd","rangeSum","rangeSum"], args: [[[1,2,3]],[0,2,-10000],[0,2],[1,1]], expected: [null,null,-29994,-9998] },
    { scenario: 'Large values', hint: 'Deltas up to 10^6 accumulate — sums stay exact below 2^53.', ops: ["RangeSumArray","rangeAdd","rangeAdd","rangeAdd","rangeSum"], args: [[[1,1]],[0,0,1000000],[1,1,1000000],[0,1,1],[0,1]], expected: [null,null,null,null,2000004] },
    { scenario: 'Odd length array', hint: 'n = 7: uneven splits in the tree; check the last index.', ops: ["RangeSumArray","rangeAdd","rangeSum","rangeSum","rangeAdd","rangeSum","rangeSum"], args: [[[1,2,3,4,5,6,7]],[3,6,2],[6,6],[0,6],[0,3,-1],[3,3],[2,5]], expected: [null,null,9,36,null,5,22] },
    { scenario: 'Add to whole array', hint: 'A full-range add should touch only the root (lazily).', ops: ["RangeSumArray","rangeAdd","rangeSum","rangeSum","rangeAdd","rangeSum"], args: [[[1,2,3,4]],[0,3,5],[0,3],[1,2],[0,3,-5],[0,3]], expected: [null,null,30,15,null,10] },
    { scenario: 'Random 60 ops (n = 37)', hint: 'Pseudo-random adds and sums checked against direct loops.', ops: ["RangeSumArray","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd","rangeAdd"], args: [[[81,440,771,285,-350,358,-851,347,-358,725,-288,408,983,-139,-961,443,467,-716,-198,432,-228,-281,939,-502,-33,454,-862,907,-355,987,905,-29,249,-903,-282,126,-193]],[7,25,-386],[36,36,114],[32,33,560],[31,33,-872],[12,20,761],[17,23,-412],[13,19,-305],[23,23,-714],[5,27,-662],[17,27,708],[33,35,298],[26,27,-580],[14,18,-439],[23,29,-807],[34,34,-544],[36,36,129],[28,32,-434],[6,29,-511],[6,9,-570],[31,35,-3],[30,33,-60],[5,31,174],[13,27,-907],[34,35,-993],[9,19,-869],[16,26,488],[13,27,-227],[30,34,-703],[2,15,207],[16,35,-912],[25,31,-422],[15,15,-545],[2,14,-623],[0,10,578],[30,31,-104],[29,31,-723],[0,24,-361],[5,31,914],[36,36,-937],[36,36,294],[34,34,-42],[6,29,166],[14,22,436],[10,31,-590],[16,34,-633],[23,27,815],[16,26,-430],[35,35,-795],[17,23,152],[8,28,-381],[14,14,-561],[7,17,916],[15,19,604],[33,35,-83],[11,15,-157],[30,33,-382],[0,18,-681],[8,21,379],[0,27,-293],[30,30,-127]], expected: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null] },
    { scenario: 'Large (n = 10^5, 10^5 ops)', hint: 'Looping over [l, r] for every add or sum is ~10^5 steps per op — 10^10 in total. A lazy segment tree (or two Fenwick trees) does each op in O(log n).', opsGen: String(bigRangeSum), timeLimitMs: 1000 },
  ],
  solution: {
    code: `class RangeSumArray {
  constructor(nums) {
    this.n = nums.length;
    this.sum = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);   // pending addition owed to the children
    this.build(nums, 1, 0, this.n - 1);
  }

  build(nums, node, lo, hi) {
    if (lo === hi) { this.sum[node] = nums[lo]; return; }
    const mid = (lo + hi) >> 1;
    this.build(nums, 2 * node, lo, mid);
    this.build(nums, 2 * node + 1, mid + 1, hi);
    this.sum[node] = this.sum[2 * node] + this.sum[2 * node + 1];
  }

  apply(node, lo, hi, delta) {
    this.sum[node] += delta * (hi - lo + 1);     // correct immediately
    this.lazy[node] += delta;                    // children fixed later
  }

  push(node, lo, hi) {
    if (this.lazy[node] !== 0) {
      const mid = (lo + hi) >> 1;
      this.apply(2 * node, lo, mid, this.lazy[node]);
      this.apply(2 * node + 1, mid + 1, hi, this.lazy[node]);
      this.lazy[node] = 0;
    }
  }

  rangeAdd(l, r, delta, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return;                              // no overlap
    if (l <= lo && hi <= r) { this.apply(node, lo, hi, delta); return; } // full overlap
    this.push(node, lo, hi);                                   // partial: make children current
    const mid = (lo + hi) >> 1;
    this.rangeAdd(l, r, delta, 2 * node, lo, mid);
    this.rangeAdd(l, r, delta, 2 * node + 1, mid + 1, hi);
    this.sum[node] = this.sum[2 * node] + this.sum[2 * node + 1];
  }

  rangeSum(l, r, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.sum[node];
    this.push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    return this.rangeSum(l, r, 2 * node, lo, mid) + this.rangeSum(l, r, 2 * node + 1, mid + 1, hi);
  }
}`,
    explanation: 'Default parameters let the public calls `rangeAdd(l, r, delta)` / `rangeSum(l, r)` start at the root while the same methods recurse with explicit node bounds.',
  },
  dryRun: `nums = [1, 2, 3, 4, 5]; tree nodes: 1:[0,4]=15, 2:[0,2]=6, 3:[3,4]=9, 4:[0,1]=3, 5:[2]=3, 6:[3]=4, 7:[4]=5, 8:[0]=1, 9:[1]=2.

**rangeAdd(1, 3, 10):**
| node | segment | overlap | action |
|---|---|---|---|
| 1 | [0,4] | partial | push (nothing), recurse |
| 2 | [0,2] | partial | recurse |
| 4 | [0,1] | partial | recurse → node 8 none, node 9 full: sum 12, lazy 10 |
| 5 | [2] | full | sum 13, lazy 10 |
| 3 | [3,4] | partial | node 6 full: sum 14; node 7 none |
| back up | | | node 4 = 13, node 2 = 26, node 3 = 19, node 1 = 45 |

**rangeSum(0, 4)** → node 1 is a full overlap → **45** immediately. **rangeSum(2, 2)** → reaches node 5 (full) → **13**.`,
  complexity: { time: 'O(log n) per operation, O(n) build', space: 'O(n)', explanation: 'At most two partially overlapping nodes per level; fully covered nodes stop. Arrays of size 4n for sums and tags.' },
  alternative: {
    title: 'Two Fenwick trees (range add, range sum)',
    md: `Write the prefix sum after range adds as \`prefix(i) = B1(i)·i − B2(i)\` where both B1 and B2 are Fenwick trees over difference arrays:
\`rangeAdd(l, r, d)\`: B1.add(l, d), B1.add(r+1, −d), B2.add(l, d·(l−1)), B2.add(r+1, −d·r) (1-based). Shorter and faster than a lazy tree, but harder to derive on the spot.`,
    code: `class RangeSumArray {
  constructor(nums) {
    this.n = nums.length;
    this.b1 = new Array(this.n + 2).fill(0);
    this.b2 = new Array(this.n + 2).fill(0);
    nums.forEach((v, i) => this.rangeAdd(i, i, v));
  }
  #add(t, i, d) { for (; i <= this.n + 1; i += i & -i) t[i] += d; }
  #sum(t, i) { let s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }
  #prefix(i) { return this.#sum(this.b1, i) * i - this.#sum(this.b2, i); } // 1-based prefix
  rangeAdd(l, r, d) {
    l++; r++;
    this.#add(this.b1, l, d); this.#add(this.b1, r + 1, -d);
    this.#add(this.b2, l, d * (l - 1)); this.#add(this.b2, r + 1, -d * r);
  }
  rangeSum(l, r) { return this.#prefix(r + 1) - this.#prefix(l); }
}`,
    complexity: 'O(log n) per operation, O(n) space',
  },
  mistakes: [
    'Forgetting `push` in `rangeSum` — partial queries then read stale children.',
    'Multiplying delta by the wrong length (use hi − lo + 1 of the node, not r − l + 1 of the query).',
    'Recomputing `sum[node]` in `rangeAdd` before recursing instead of after.',
    'Allocating 2n instead of 4n for the recursive layout.',
  ],
};
