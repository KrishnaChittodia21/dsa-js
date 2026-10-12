export default {
  id: 'advanced-structures',
  summary: 'Answer range questions (sum, min, count) on an array that keeps changing — Fenwick trees and segment trees give O(log n) updates AND O(log n) queries; sparse tables give O(1) queries on arrays that never change.',

  jsTools: [
    { api: 'i & -i', use: 'Lowest set bit of i — the length of the range a Fenwick cell covers', complexity: 'O(1)' },
    { api: 'x >> 1 / 2 * i / 2 * i + 1', use: 'Parent / left child / right child index in an array-backed segment tree', complexity: 'O(1)' },
    { api: 'new Array(n + 1).fill(0)', use: 'Fenwick storage (1-indexed, slot 0 unused)', complexity: 'O(n)' },
    { api: 'new Float64Array(n) / Int32Array', use: 'Typed arrays: compact, zero-filled, faster than plain arrays for big trees', complexity: 'O(n)' },
    { api: '[...new Set(arr)].sort((a, b) => a - b)', use: 'Coordinate compression: unique sorted values', complexity: 'O(n log n)' },
    { api: 'new Map(sorted.map((v, i) => [v, i]))', use: 'Value → rank lookup after compression', complexity: 'O(1) average per lookup' },
    { api: 'Math.clz32(x)', use: '31 - Math.clz32(len) = floor(log2(len)) for sparse-table queries', complexity: 'O(1)' },
    { api: 'FenwickTree / SegmentTree / LazySegmentTree / SparseTable (toolkit)', use: 'Ready-made range structures available as globals in the editor', complexity: 'O(log n) / O(log n) / O(log n) / O(1) per query' },
  ],

  patterns: [
    {
      id: 'fenwick-tree-bit',
      name: 'Fenwick Tree (Binary Indexed Tree)',
      summary: 'An array where cell i stores the sum of the lowbit(i) elements ending at i. Prefix sums walk down by removing the lowest bit; point updates walk up by adding it. Both O(log n).',
      whyItExists: 'A prefix-sum array answers range sums in O(1) but one change forces O(n) rewrites. A plain array updates in O(1) but sums in O(n). A Fenwick tree stores *partial* prefix sums so that every prefix is the sum of at most log n cells and every element belongs to at most log n cells — balancing both operations at O(log n) with only n + 1 numbers of memory.',
      whenToUse: [
        'Point updates mixed with prefix/range sum queries (Range Sum Query – Mutable)',
        'Counting "how many earlier elements are smaller/larger than x" while scanning (a BIT over values)',
        'Any invertible, associative aggregate: sums, counts, XOR (not min/max for arbitrary ranges)',
      ],
      clues: ['"update" and "sumRange" in the same class', '"count of smaller numbers after/before"', '"number of elements less than x inserted so far"', 'values up to 10^5 used as indices', 'n and q both up to 10^5'],
      whenNotToUse: [
        'The array never changes → a plain prefix-sum array is simpler and O(1)',
        'You need range min/max with updates → segment tree (min is not invertible, so prefix(r) − prefix(l − 1) does not work)',
        'Range updates AND range queries of complex aggregates → lazy segment tree',
      ],
      template: `class Fenwick {
  constructor(n) { this.n = n; this.tree = new Array(n + 1).fill(0); }
  add(i, delta) {            // i is 1-based
    for (; i <= this.n; i += i & -i) this.tree[i] += delta;
  }
  prefix(i) {                // sum of positions 1..i
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.tree[i];
    return s;
  }
  range(l, r) { return this.prefix(r) - this.prefix(l - 1); }
}`,
      variations: [
        { name: 'Point update, range query', description: 'The standard form: `add(i, newVal - oldVal)` and `prefix(r) - prefix(l - 1)`.' },
        { name: 'Range update, point query', description: 'Store a *difference array* in the BIT: `add(l, d); add(r + 1, -d)`; the value at i is `prefix(i)`.' },
        { name: 'BIT over positions', description: 'Mark occupied slots with 1s; `prefix(p)` tells how many items sit before p (Queries on a Permutation with Key).' },
        { name: '2-D Fenwick', description: 'Nest the two loops for rectangle sums on a mutable matrix, O(log n · log m).' },
      ],
      mistakes: [
        'Using index 0 — `0 & -0` is 0, so the update loop never advances (infinite loop). Always shift to 1-based.',
        'Calling `add(i, val)` for an assignment instead of `add(i, val - current[i])` — you must remember the current values.',
        'Trying to answer range minimum with prefix(r) − prefix(l − 1): subtraction only works for invertible operations.',
      ],
      evolution: {
        easy: 'Mutable range sum: point update + range sum.',
        medium: 'BIT over positions or over values: count elements before a position, move items to the front.',
        hard: 'BIT over compressed values to count inversions / smaller-after-self / range-sum-in-[lower, upper].',
      },
    },
    {
      id: 'bit-coordinate-compression-counting',
      name: 'Coordinate Compression + BIT Counting',
      summary: 'Replace huge or negative values by their rank among the sorted distinct values, then scan the array and use a Fenwick tree of counts to ask "how many seen values are < x (or in [a, b])?" in O(log n).',
      whyItExists: 'Counting pairs (i < j) with a value condition is O(n²) brute force. If we scan j left to right and keep every earlier value in a frequency structure, each question becomes a prefix count. A BIT indexed by value needs indices 1..m, but values may be −10^9..10^9 — compression maps the n values that actually occur to 1..n while keeping their order, which is all a "less than" question needs.',
      whenToUse: [
        'Count pairs i < j with nums[i] > nums[j] (inversions) or nums[i] > 2·nums[j] (reverse pairs)',
        'For each element, count smaller/larger elements to its left or right',
        'Count subarrays whose sum lies in [lower, upper] (compress prefix sums)',
      ],
      clues: ['"count of smaller numbers after self"', '"reverse pairs"', '"number of pairs i < j such that"', '"cost = min(smaller before, greater before)"', 'values up to ±10^9 but n ≤ 10^5'],
      whenNotToUse: [
        'Values are already small non-negative integers (≤ ~10^6) → index the BIT by value directly',
        'The condition is about positions, not values → BIT over positions',
        'You only need the total count and n is small → brute force is fine',
      ],
      template: `function countSmallerBefore(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i + 1])); // 1-based ranks
  const bit = new FenwickTree(sorted.length);            // toolkit: 0-based API
  const out = [];
  for (const x of nums) {
    const r = rank.get(x);
    out.push(r > 1 ? bit.prefixSum(r - 2) : 0); // count of seen values with rank < r
    bit.add(r - 1, 1);                          // mark x as seen
  }
  return out;
}`,
      variations: [
        { name: 'Scan right-to-left', description: '"Smaller numbers after self" — process from the end so "seen" means "to my right".' },
        { name: 'Query a threshold that is not in the array', description: 'Reverse pairs asks for values > 2·x — include 2·x in the compressed set, or binary-search the rank.' },
        { name: 'Compress prefix sums', description: 'Count of Range Sum: count earlier prefixes P with S − upper ≤ P ≤ S − lower.' },
        { name: 'Merge-sort counting', description: 'The same pair counts fall out of merge sort: when merging, every left element greater than a right element forms a pair. O(n log n) without a tree.' },
      ],
      mistakes: [
        'Sorting numbers with the default `sort()` — it sorts as strings (`[10, 9, 1]` → `[1, 10, 9]`).',
        'Mixing 0-based and 1-based ranks between the Map and the Fenwick tree.',
        'Counting before vs. after inserting the current element in the wrong order (pairs of an element with itself).',
      ],
      evolution: {
        easy: 'Count inversions in a permutation of 1..n (no compression needed).',
        medium: 'Count Number of Teams: smaller-left × greater-right per middle element.',
        hard: 'Reverse pairs (thresholds 2·x), count of range sum (compressed prefix sums with a window of values).',
      },
    },
    {
      id: 'segment-tree-range-query',
      name: 'Segment Tree — Point Update, Range Query',
      summary: 'A binary tree where each node stores the aggregate (sum/min/max/gcd) of a segment; the root covers everything, leaves cover single elements. Any range is the union of O(log n) nodes.',
      whyItExists: 'Fenwick trees need an invertible operation to turn prefixes into ranges. A segment tree answers any *associative* aggregate directly on [l, r] — including min, max and gcd — by combining the few nodes that exactly tile the range. Updates change one leaf and its O(log n) ancestors.',
      whenToUse: [
        'Range min / max / gcd with point updates',
        'Aggregates that are associative but not invertible',
        'As the base for lazy propagation (range updates) or for "find first index where…" descents',
      ],
      clues: ['"update index i" + "min/max of range"', 'q queries interleaved with modifications', '"the k-th one / first position with value ≥ x" on a changing array'],
      whenNotToUse: [
        'No updates → sparse table (O(1) min/max) or prefix sums (O(1) sums)',
        'Only sums with point updates → a Fenwick tree is shorter and faster',
      ],
      template: `// Recursive: node covers [lo, hi]; children 2*node and 2*node+1
function query(node, lo, hi, l, r) {
  if (r < lo || hi < l) return IDENTITY;          // no overlap
  if (l <= lo && hi <= r) return tree[node];      // full overlap
  const mid = (lo + hi) >> 1;                     // partial → split
  return combine(query(2 * node, lo, mid, l, r),
                 query(2 * node + 1, mid + 1, hi, l, r));
}`,
      variations: [
        { name: 'Recursive (4n array)', description: 'Easiest to extend (lazy tags, descents). Allocate 4n slots to be safe.' },
        { name: 'Iterative bottom-up (2n array)', description: 'Leaves at [n, 2n); parents at i >> 1. Shorter and faster; the toolkit `SegmentTree` uses it.' },
        { name: 'Dynamic / compressed', description: 'Huge coordinate ranges (10^9): create nodes on demand, or compress the endpoints first (Falling Squares).' },
      ],
      mistakes: [
        'Allocating only 2n slots for the *recursive* layout (it needs up to 4n).',
        'Returning 0 as the identity for min (use Infinity) or for max (use -Infinity).',
        'Forgetting to recompute the parents after changing a leaf.',
      ],
      evolution: {
        easy: 'Range sum with point updates.',
        medium: 'Range min/max with updates; combine custom node data (max subarray sum per node).',
        hard: 'Lazy propagation, coordinate-compressed / dynamic trees, descending to find the first valid index.',
      },
    },
    {
      id: 'segment-tree-lazy-propagation',
      name: 'Segment Tree with Lazy Propagation',
      summary: 'For range updates, stop at nodes fully inside the update range and leave a "pending" tag there. Push the tag to the children only when a later operation needs to go deeper.',
      whyItExists: 'Adding 5 to every element of [l, r] would touch r − l + 1 leaves — O(n) per update. But the same O(log n) nodes that tile [l, r] for a query can absorb the update as a whole: their sum grows by 5 × length. The children are updated later, only if someone looks at them.',
      whenToUse: [
        'Range add / range assign combined with range sum / min / max',
        'Interval "painting" problems (booking calendars, falling squares) on compressed coordinates',
      ],
      clues: ['"add val to every element in [l, r]"', '"set all elements in range to x"', 'many range updates AND range queries'],
      whenNotToUse: [
        'Range updates but only point queries → a Fenwick tree on the difference array is enough',
        'All updates come before all queries → a difference array + prefix sum, O(n + q)',
      ],
      template: `apply(node, lo, hi, d) { sum[node] += d * (hi - lo + 1); lazy[node] += d; }
push(node, lo, hi) {           // hand the pending tag to both children
  if (lazy[node]) { const mid = (lo + hi) >> 1;
    apply(2 * node, lo, mid, lazy[node]); apply(2 * node + 1, mid + 1, hi, lazy[node]);
    lazy[node] = 0; }
}
rangeAdd(l, r, d, node, lo, hi) {
  if (r < lo || hi < l) return;
  if (l <= lo && hi <= r) return apply(node, lo, hi, d);   // absorb here, stop
  push(node, lo, hi);
  const mid = (lo + hi) >> 1;
  rangeAdd(l, r, d, 2 * node, lo, mid); rangeAdd(l, r, d, 2 * node + 1, mid + 1, hi);
  sum[node] = sum[2 * node] + sum[2 * node + 1];
}`,
      variations: [
        { name: 'Range add + range sum', description: 'Tag = pending addition; node sum grows by delta × segment length.' },
        { name: 'Range assign + range max', description: 'Tag = pending assignment (null when none); assigning overrides older tags.' },
        { name: 'Range chmax without push', description: 'If updates only ever raise values, a node tag can simply be "every element here is at least t" (Falling Squares).' },
      ],
      mistakes: [
        'Forgetting `push` before recursing into children in BOTH update and query.',
        'Multiplying by the wrong length — the segment length is hi − lo + 1.',
        'Combining tags incorrectly for assignment (a new assignment must replace, not add to, the old one).',
      ],
      evolution: {
        easy: 'Range add + point query (difference-array BIT is enough).',
        medium: 'Range add + range sum (the classic lazy tree).',
        hard: 'Two kinds of tags that must compose (assign then add), compressed coordinates, counting max overlap.',
      },
    },
    {
      id: 'sparse-table-rmq',
      name: 'Sparse Table (Static Range Min/Max)',
      summary: 'Precompute the min of every block whose length is a power of two. Any query [l, r] is covered by two (possibly overlapping) blocks of length 2^k, so the answer is min of two table cells — O(1).',
      whyItExists: 'When the array never changes and there are many min/max queries, even O(log n) per query can be beaten. Because min is idempotent (min(x, x) = x), counting an element twice in overlapping blocks does not change the answer, so two blocks are always enough.',
      whenToUse: [
        'Static array, many range min / max / gcd queries',
        'LCA via Euler tour + RMQ, suffix-array LCP queries (advanced)',
      ],
      clues: ['"array does not change"', '"answer q queries: minimum on [l, r]"', 'q up to 10^5–10^6'],
      whenNotToUse: [
        'The array is updated → segment tree',
        'The operation is not idempotent (sum, count, product) → prefix sums, or a disjoint O(log n) decomposition',
      ],
      template: `const LOG = [0, 0]; for (let i = 2; i <= n; i++) LOG[i] = LOG[i >> 1] + 1;
const st = [nums.slice()];
for (let k = 1; (1 << k) <= n; k++)
  st[k] = Array.from({ length: n - (1 << k) + 1 },
    (_, i) => Math.min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]));
const query = (l, r) => { const k = LOG[r - l + 1];
  return Math.min(st[k][l], st[k][r - (1 << k) + 1]); };`,
      variations: [
        { name: 'Max / gcd', description: 'Any idempotent, associative operation works unchanged.' },
        { name: 'Index of the minimum', description: 'Store indices and compare by value — useful for LCA and Cartesian trees.' },
        { name: 'Disjoint sparse table', description: 'Answers non-idempotent ops (sum) in O(1) with a different layout — rarely needed in interviews.' },
      ],
      mistakes: [
        'Using it for sums — overlapping blocks double-count.',
        'Computing log2 with floating point `Math.log2` repeatedly (slow, rounding risk) instead of a precomputed LOG table or `31 - Math.clz32(len)`.',
        'Off-by-one in the second block start: it is r − 2^k + 1.',
      ],
      evolution: {
        easy: 'Static range minimum.',
        medium: 'Range max / gcd, index of minimum.',
        hard: 'RMQ as a subroutine (LCA, LCP of suffixes).',
      },
    },
    {
      id: 'range-query-index-lists',
      name: 'Per-Value Index Lists + Binary Search',
      summary: 'For "how many times does value v appear in [l, r]" with a static array, store the sorted list of positions for each value and binary-search the two ends.',
      whyItExists: 'A tree would need one structure per value. But the positions of each value are already sorted if you record them while scanning left to right, and "count positions in [l, r]" is just upperBound(r) − lowerBound(l). No tree needed because the array never changes.',
      whenToUse: [
        'Static array + frequency-of-a-specific-value-in-a-range queries',
        '"Next occurrence of v after position p" questions',
      ],
      clues: ['"frequency of value in subarray"', '"query(left, right, value)"', 'array given once in the constructor'],
      whenNotToUse: [
        'The array changes → per-value Fenwick trees or an offline approach',
        'You need the most frequent value in a range (range mode) — much harder (Mo\'s algorithm)',
      ],
      template: `const pos = new Map();                 // value → sorted positions
arr.forEach((v, i) => { if (!pos.has(v)) pos.set(v, []); pos.get(v).push(i); });
function lowerBound(a, x) { let lo = 0, hi = a.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; } return lo; }
const count = (l, r, v) => { const a = pos.get(v) ?? [];
  return lowerBound(a, r + 1) - lowerBound(a, l); };`,
      variations: [
        { name: 'Offline sweep', description: 'If all queries are known up front, sort them and sweep with counts.' },
      ],
      mistakes: [
        'Building each list with unshift or re-sorting — push while scanning already gives sorted lists.',
        'Using lowerBound(r) instead of lowerBound(r + 1) for an inclusive right end.',
      ],
      evolution: {
        easy: 'Count occurrences of v in the whole array.',
        medium: 'Range Frequency Queries.',
        hard: 'Majority element in a subarray (random sampling + index lists).',
      },
    },
    {
      id: 'dynamic-interval-coverage',
      name: 'Interval Coverage on Huge Coordinates',
      summary: 'When coordinates go up to 10^9, either keep a sorted list of boundaries/intervals and edit it, or compress the endpoints that actually appear and run a segment tree over the compressed indices.',
      whyItExists: 'You cannot allocate an array of size 10^9. But only the endpoints mentioned by operations matter: between two consecutive endpoints nothing ever changes. So either store the breakpoints (sweep map, interval list) or compress them to 0..k−1 and reuse the ordinary range structures.',
      whenToUse: [
        'Booking / calendar problems: maximum overlap after each booking',
        'Tracking a set of covered ranges with add/remove/query (Range Module)',
        'Stacking intervals where each new one lands on the max height below it (Falling Squares)',
      ],
      clues: ['"0 <= start < end <= 10^9"', '"at most 400/1000 calls"', '"half-open interval [left, right)"', '"track ranges"'],
      whenNotToUse: [
        'Coordinates are small (≤ 10^5) → a plain array / difference array / normal segment tree',
      ],
      template: `// Sweep with a sorted boundary map: +1 at start, -1 at end.
const delta = new Map();
function book(start, end) {
  delta.set(start, (delta.get(start) ?? 0) + 1);
  delta.set(end, (delta.get(end) ?? 0) - 1);
  let cur = 0, best = 0;
  for (const k of [...delta.keys()].sort((a, b) => a - b)) {
    cur += delta.get(k);
    best = Math.max(best, cur);
  }
  return best;
}`,
      variations: [
        { name: 'Sorted interval list', description: 'Keep disjoint intervals sorted by start; binary-search the insertion point and merge/split (Range Module).' },
        { name: 'Compressed segment tree', description: 'Collect all endpoints, sort, map to indices, then use a (lazy) segment tree (Falling Squares).' },
        { name: 'Dynamic segment tree', description: 'Create child nodes only when visited; memory O(q log C).' },
      ],
      mistakes: [
        'Treating half-open [a, b) as closed [a, b] — adjacent intervals then overlap by mistake.',
        'Compressing only starts and forgetting ends (or the other way round).',
        'Sorting keys with the default lexicographic sort.',
      ],
      evolution: {
        easy: 'Maximum overlap of static intervals (sweep).',
        medium: 'Online bookings with a sweep map.',
        hard: 'Range Module (add/remove/query), Falling Squares (range max + range assign on compressed coordinates).',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `So far you have answered **range questions** — *"what is the sum of nums[2..6]?"* — with prefix sums. That works beautifully **as long as the array never changes**.

This topic is about arrays that **do** change while questions keep arriving:

\`\`\`text
nums = [5, 2, 9, -3, 5, 20, 10, -7]
sumRange(1, 4)   → 13
update(3, 7)     → nums[3] becomes 7
sumRange(1, 4)   → 23
update(0, 1)
sumRange(0, 7)   → ...
\`\`\`

Three structures cover almost every interview version of this:

| Structure | Updates | Queries | Best for |
|---|---|---|---|
| **Fenwick tree** (Binary Indexed Tree) | point, O(log n) | prefix/range **sum**, O(log n) | sums & counts, very short code |
| **Segment tree** | point or range (lazy), O(log n) | any associative op (sum/min/max/gcd), O(log n) | the general-purpose tool |
| **Sparse table** | none (static) | min/max/gcd, **O(1)** | many queries on a fixed array |`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Range query** — a question about a contiguous slice \`[l, r]\` (sum, min, count…).
- **Point update** — change one element: \`nums[i] = v\` or \`nums[i] += d\`.
- **Range update** — change every element in \`[l, r]\` at once (e.g. add 5 to all).
- **Associative** — \`(a ⊕ b) ⊕ c = a ⊕ (b ⊕ c)\`; grouping does not matter (sum, min, max, gcd, xor).
- **Invertible** — you can "undo" a combine: from \`a + b\` and \`a\` you get \`b\` by subtraction. Sum is invertible; **min is not**.
- **Idempotent** — combining a value with itself changes nothing: \`min(x, x) = x\`. Sum is not idempotent.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A company reports sales by **day, week, month and quarter**. To get "sales from March 3 to May 20" you do not add 79 daily numbers — you add a few big blocks (April, a couple of weeks, a few days). When one day\'s sale is corrected, you fix that day plus the week, month and quarter that contain it — only a handful of totals. Fenwick and segment trees are exactly this idea of **pre-summed blocks at several sizes**.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-1',
            question: 'You need **range minimum** queries on an array that receives point updates between queries. Which structure fits directly?',
            options: [
              'A prefix-minimum array',
              'A Fenwick tree with prefixMin(r) − prefixMin(l − 1)',
              'A sparse table',
              'A segment tree storing the min of each segment',
            ],
            answer: 3,
            explanation: 'Min is associative, so a segment tree can combine the O(log n) nodes that tile [l, r]. It also supports point updates by fixing one leaf and its ancestors.',
            misconceptions: {
              0: 'A prefix-minimum only answers ranges that start at index 0, and one update may change O(n) entries.',
              1: 'Subtraction "undoes" a sum, but nothing undoes a min: knowing min(nums[0..r]) and min(nums[0..l−1]) tells you nothing about min(nums[l..r]). Min is not invertible.',
              2: 'A sparse table answers min in O(1) but has no efficient update — one change can affect O(n log n) cells.',
            },
            deeper: 'Ask two questions about the operation: *Is it invertible?* (then prefixes are enough → Fenwick). *Is it idempotent?* (then overlapping blocks are fine → sparse table, if static). Min is idempotent but not invertible, so: static → sparse table; changing → segment tree.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Look at the two simple options and where each one breaks:

| Approach | update(i, v) | sumRange(l, r) | q = 10^5 mixed ops on n = 10^5 |
|---|---|---|---|
| Plain array | O(1) | O(n) — loop over the range | ~10^10 steps ✗ |
| Prefix-sum array | **O(n)** — every prefix after i shifts | O(1) | ~10^10 steps ✗ |
| Fenwick / segment tree | O(log n) | O(log n) | ~3.4 × 10^6 steps ✓ |

Each simple option is great at one operation and terrible at the other. The prefix-sum array stores *too much* shared information (every prefix contains nums[0], so changing nums[0] rewrites everything). The plain array stores *too little* (nothing is pre-added). The trees store **just enough**: each element belongs to about log n pre-summed blocks, and each range is made of about log n blocks.`,
          },
          {
            type: 'visual',
            scenario: 'prefix-sum',
            input: { nums: [5, 2, 9, -3, 5, 20, 10, -7] },
            caption: 'Prefix sums: each cell depends on every element before it — which is exactly why a single update is O(n).',
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-2',
            question: 'With a prefix-sum array `P` (P[i] = nums[0] + … + nums[i−1]), you change `nums[2]`. How many entries of `P` must change for n = 8?',
            options: [
              'Only P[3]',
              'P[3] through P[8] — every prefix that includes index 2',
              'Only P[2] and P[3]',
              'None, prefix sums are recomputed lazily',
            ],
            answer: 1,
            explanation: 'Every prefix that ends after index 2 contains nums[2]. That is n − 2 entries — O(n) per update. With many updates, prefix sums become the bottleneck.',
            misconceptions: {
              0: 'P[4] = nums[0] + nums[1] + nums[2] + nums[3] also contains nums[2], and so do all later prefixes.',
              2: 'P[2] = nums[0] + nums[1] does not contain nums[2] at all; but every prefix after it does.',
              3: 'A plain prefix array has no laziness — it is a fixed table. (Lazy ideas do exist: see lazy propagation later.)',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see **why** "log n blocks per element and log n blocks per query" is the sweet spot?',
            deeper: `An update must touch every stored number that includes the changed element; a query must add up enough stored numbers to exactly cover the range. If blocks are huge (prefix sums), updates suffer; if blocks are tiny (single elements), queries suffer.

With blocks of sizes 1, 2, 4, 8, … (powers of two), any length can be written as a sum of at most log₂ n powers of two (that is just its binary representation!), and each element sits in at most one block of each size. Both costs become O(log n). Fenwick and segment trees are two different ways of laying out those power-of-two blocks.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Pick the structure from **what changes** and **what is asked**:

| Situation | Use |
|---|---|
| Static array, range sums | Prefix sums (O(1) query) |
| Static array, range min/max/gcd, many queries | **Sparse table** (O(1) query) |
| Point updates + range sums / counts | **Fenwick tree** |
| Point updates + range min/max/any associative op | **Segment tree** |
| Range updates + range queries | **Lazy segment tree** |
| Range updates + point queries only | Fenwick tree over a difference array |
| "How many earlier values are < x?" while scanning | **Fenwick tree over (compressed) values** |
| Coordinates up to 10^9 with few operations | Compress the endpoints, or keep a sorted boundary list |
| Static array, count of value v in [l, r] | Per-value position lists + binary search (no tree!) |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Do not reach for a tree too early',
            md: 'These structures are powerful but long to write and easy to get subtly wrong. If the array is static, or all updates come before all queries, a prefix sum or a difference array is simpler and faster. Interviewers like hearing you rule out the simple option *with a reason* before you build a tree.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-3',
            question: 'You receive 10^5 operations "add d to every element in [l, r]", and **only after all of them** you must print the final array. What is the simplest optimal approach?',
            options: [
              'A lazy segment tree',
              'A Fenwick tree over the difference array',
              'A difference array: diff[l] += d, diff[r + 1] −= d, then one prefix-sum pass at the end',
              'A sparse table',
            ],
            answer: 2,
            explanation: 'All updates come before the only "query" (the final array). A difference array handles each update in O(1) and rebuilds the array with one O(n) prefix pass. No tree needed.',
            misconceptions: {
              0: 'It works, but it is O(log n) per update and far more code. Trees earn their place only when queries are interleaved with updates.',
              1: 'Also correct but unnecessary: the BIT exists to answer queries *between* updates. Here there are none.',
              3: 'Sparse tables cannot be updated at all, and they answer min/max, not sums.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['a class with update() and query()/sumRange()', 'n and q both up to 10^5', '"count of smaller numbers after self"', '"number of pairs i < j with nums[i] > k·nums[j]"', '"add val to all elements in [l, r]"', '"the array does not change" + many min queries', 'coordinates up to 10^9 but ≤ 10^4 operations'],
            conclusion: 'Think Fenwick / Segment Tree / Sparse Table (plus coordinate compression when values are huge)',
          },
          {
            type: 'text',
            md: `Checklist while reading:

1. **Are there interleaved updates and queries?** If not, prefix sums / sparse table / difference array.
2. **What is the aggregate?** Invertible (sum, count, xor) → Fenwick is enough. Only associative (min, max, gcd) → segment tree.
3. **Point or range updates?** Range + range → lazy segment tree.
4. **Is it really a counting problem?** "Pairs i < j with a value condition" becomes "scan and ask a Fenwick tree how many previous values satisfy it" — possibly after **coordinate compression**.
5. **Huge coordinates?** Compress, or keep a sorted list of breakpoints.`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-4',
            question: '"For each index i, return how many elements to the RIGHT of i are strictly smaller than nums[i]." (n ≤ 10^5, values in [−10^4, 10^4]). How does this become a range-query problem?',
            options: [
              'Scan right-to-left; keep a Fenwick tree of counts indexed by value; for nums[i] ask for the count of values < nums[i], then insert nums[i]',
              'Build a sparse table of minimums and query [i + 1, n − 1]',
              'Sort the array and return each element\'s index in the sorted array',
              'Use a sliding window of size k',
            ],
            answer: 0,
            explanation: 'Scanning from the right, "already inserted" means "to my right". A BIT over values turns "how many inserted values are < x" into a prefix sum. Values must be shifted (or compressed) to positive indices first.',
            misconceptions: {
              1: 'The minimum of the suffix tells you whether *some* smaller element exists, not *how many* there are.',
              2: 'The sorted index counts smaller elements in the *whole* array, including those to the left of i.',
              3: 'There is no fixed window — the right side of i shrinks as i moves.',
            },
            deeper: 'This "sweep + count what you have seen" move turns pair-counting (O(n²)) into n prefix queries (O(n log n)). The Fenwick tree is not indexed by *position* here but by *value* — a big mental shift the first time you see it.',
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `All three structures are built from the same brick: **pre-aggregated blocks whose sizes are powers of two**.

\`\`\`text
index:      1  2  3  4  5  6  7  8
size 8:   [ ---------- 1..8 ---------- ]
size 4:   [ -- 1..4 -- ][ -- 5..8 -- ]
size 2:   [1..2][3..4]  [5..6][7..8]
size 1:   [1][2][3][4]  [5][6][7][8]
\`\`\`

- A **segment tree** keeps *all* of these blocks (about 2n of them) as a binary tree.
- A **Fenwick tree** keeps only **one block per index** (n blocks) — for index i, the block that *ends* at i and has length = lowest set bit of i. That is enough for prefix sums.
- A **sparse table** keeps blocks of every power-of-two length starting at *every* index (n log n blocks), so any range is covered by just two of them.

Everything else is bookkeeping: which blocks to combine for a query and which blocks to fix after an update.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why O(log n) keeps appearing',
            md: 'There are only log₂ n + 1 distinct power-of-two sizes up to n. Any operation that touches **at most a constant number of blocks per size** is automatically O(log n). When you analyse any of these structures, count "blocks per level".',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Take **Range Sum Query – Mutable**: a class with `update(index, val)` and `sumRange(left, right)`. The two obvious designs each make one operation linear:',
          },
          {
            type: 'compare',
            left: {
              title: 'Plain array — update O(1), query O(n)',
              code: `class NumArray {
  constructor(nums) { this.nums = nums.slice(); }
  update(i, val) { this.nums[i] = val; }
  sumRange(l, r) {
    let s = 0;
    for (let i = l; i <= r; i++) s += this.nums[i];
    return s;
  }
}`,
            },
            right: {
              title: 'Prefix sums — update O(n), query O(1)',
              code: `class NumArray {
  constructor(nums) {
    this.nums = nums.slice();
    this.P = [0];
    for (const x of nums) this.P.push(this.P.at(-1) + x);
  }
  update(i, val) {
    const d = val - this.nums[i];
    this.nums[i] = val;
    for (let k = i + 1; k < this.P.length; k++) this.P[k] += d;
  }
  sumRange(l, r) { return this.P[r + 1] - this.P[l]; }
}`,
            },
          },
          {
            type: 'text',
            md: 'For **counting** problems (count of smaller numbers after self, reverse pairs, count of range sum) the brute force is a double loop over pairs `i < j` — O(n²), about 5 × 10^9 steps for n = 10^5. The optimized versions all scan once and ask a Fenwick tree a question per element: O(n log n).',
          },
        ],
      },
      {
        id: 'optimized-fenwick',
        title: 'Optimized approach — Fenwick tree (BIT)',
        blocks: [
          {
            type: 'text',
            md: `A **Fenwick tree** (also called a **Binary Indexed Tree**, BIT) is just an array \`tree[1..n]\`. The whole trick is *what each cell stores*.

**Step 1 — lowbit.** For a positive integer \`i\`, \`lowbit(i)\` is the value of its lowest set bit:

| i | binary | lowbit(i) = \`i & -i\` |
|---|---|---|
| 1 | 0001 | 1 |
| 2 | 0010 | 2 |
| 3 | 0011 | 1 |
| 4 | 0100 | 4 |
| 5 | 0101 | 1 |
| 6 | 0110 | 2 |
| 7 | 0111 | 1 |
| 8 | 1000 | 8 |

Why does \`i & -i\` work? In two's complement, \`-i = ~i + 1\`. Flipping all bits of \`i\` turns its trailing zeros into ones and its lowest 1 into a 0; adding 1 carries through those ones and lands exactly on the position of the lowest 1. Above that position, \`i\` and \`-i\` have opposite bits, so the AND keeps **only** the lowest set bit. Example: \`6 = 0110\`, \`-6 = …1010\`, \`6 & -6 = 0010 = 2\`.

**Step 2 — what cell i stores.** \`tree[i]\` = sum of the **lowbit(i)** elements that **end at i**, i.e. positions \`(i − lowbit(i), i]\`:

| i | lowbit | tree[i] covers |
|---|---|---|
| 1 | 1 | [1, 1] |
| 2 | 2 | [1, 2] |
| 3 | 1 | [3, 3] |
| 4 | 4 | [1, 4] |
| 5 | 1 | [5, 5] |
| 6 | 2 | [5, 6] |
| 7 | 1 | [7, 7] |
| 8 | 8 | [1, 8] |

**Step 3 — prefix sum by removing low bits.** \`prefix(7)\` = tree[7] (covers 7) + tree[6] (covers 5..6) + tree[4] (covers 1..4). We went 7 → 6 → 4 → 0 by doing \`i -= i & -i\`. Each step removes one set bit, so there are at most log₂ n steps. The blocks are adjacent and do not overlap: \`(6, 7] ∪ (4, 6] ∪ (0, 4]\`.

**Step 4 — point update by adding low bits.** Which cells contain position 3? tree[3], tree[4], tree[8]. We visit 3 → 4 → 8 with \`i += i & -i\`. Adding the lowest bit jumps to the next, larger block that still contains i. Again at most log₂ n steps.`,
          },
          { type: 'visual', scenario: 'fenwick-tree', caption: "Each cell covers a power-of-two range given by i & -i." },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Why 1-indexed?',
            md: 'lowbit(0) = 0, so with index 0 the update loop `i += i & -i` would never move (infinite loop) and the query loop `i > 0` would never include it. Fenwick trees are defined on 1..n; code that takes 0-based indices simply does `i = index + 1` first (the toolkit does this for you).',
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-5',
            question: 'In a Fenwick tree of size 16, which cells does `prefix(13)` add together?',
            options: [
              'tree[13], tree[12], tree[8]',
              'tree[13], tree[14], tree[16]',
              'tree[1] through tree[13]',
              'tree[13] and tree[8]',
            ],
            answer: 0,
            explanation: '13 = 1101₂. Remove the lowest bit repeatedly: 1101 → 1100 (12) → 1000 (8) → 0. So tree[13] (covers 13) + tree[12] (covers 9..12) + tree[8] (covers 1..8) = sum of 1..13.',
            misconceptions: {
              1: 'That is the **update** path (adding lowbit: 13 → 14 → 16). Queries go down by removing bits; updates go up by adding them.',
              2: 'That is the plain array approach — O(n). The point of the BIT is that three cells already cover 1..13.',
              3: 'You skipped 12: 13 → 13 − lowbit(13) = 12, not 8. tree[13] covers only position 13, and tree[8] covers 1..8, so 9..12 would be missing.',
            },
            deeper: 'Read the binary representation: 13 = 8 + 4 + 1. The query adds one block of each of those sizes — tree[13] (size 1), tree[12] (size 4), tree[8] (size 8). A prefix of length L is always covered by popcount(L) blocks.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the update path 3 → 4 → 8 hits exactly the cells whose range contains position 3?',
            deeper: `Cell j covers (j − lowbit(j), j]. It contains position i exactly when j ≥ i and j − lowbit(j) < i. Starting at j = i, the next such j must "absorb" i into a bigger block: adding lowbit(j) clears the lowest run of set bits and carries into a higher bit, producing the smallest larger index whose block reaches back past i. Any index strictly between them has a block that starts after i, so it does not contain i.

You do not need to reproduce the proof in an interview, but you should be able to say: *"queries remove the lowest bit, updates add it; each step changes the bit length, so both are O(log n)."*`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: 'Here is the toolkit `FenwickTree` (available as a global in the editor), with every line explained. It exposes a **0-based** API but stores a 1-based array internally.',
          },
          {
            type: 'code',
            title: 'Toolkit FenwickTree — annotated',
            code: `class FenwickTree {
  constructor(n) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0); // slot 0 unused → 1-based cells 1..n
  }
  static from(arr) {                      // O(n log n) build: n point updates
    const ft = new FenwickTree(arr.length);
    arr.forEach((v, i) => ft.add(i, v));
    return ft;
  }
  // arr[index] += delta   (index is 0-based)
  add(index, delta) {
    // i = index + 1 converts to 1-based. Each step jumps to the next cell whose
    // block also contains this position; stop when we run past n.
    for (let i = index + 1; i <= this.n; i += i & -i) this.tree[i] += delta;
  }
  // sum of arr[0..index] inclusive
  prefixSum(index) {
    let s = 0;
    // Each step adds one block and moves to the block just to its left.
    for (let i = index + 1; i > 0; i -= i & -i) s += this.tree[i];
    return s;
  }
  // sum of arr[left..right] inclusive — works because sums are invertible
  rangeSum(left, right) {
    return this.prefixSum(right) - (left > 0 ? this.prefixSum(left - 1) : 0);
  }
}`,
          },
          {
            type: 'code',
            title: 'Template — assignment update on top of a BIT',
            code: `// A BIT only knows "add delta". To SET nums[i] = val, remember current values:
update(i, val) {
  this.bit.add(i, val - this.nums[i]);
  this.nums[i] = val;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'O(n) build',
            md: 'Instead of n calls to `add`, copy the values into `tree[1..n]` and then, for each i, push `tree[i]` into its parent `j = i + (i & -i)` (if j ≤ n). Every cell is visited once — O(n). Rarely required in interviews, but a nice thing to mention.',
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Range Sum Query – Mutable with a Fenwick tree',
            code: `class NumArray {
  constructor(nums) {
    this.nums = nums.slice();                 // current values, needed for assignment
    this.bit = FenwickTree.from(nums);        // toolkit global
  }
  update(index, val) {
    this.bit.add(index, val - this.nums[index]);
    this.nums[index] = val;
  }
  sumRange(left, right) {
    return this.bit.rangeSum(left, right);
  }
}`,
          },
          {
            type: 'code',
            title: 'Writing it from scratch (what interviewers expect)',
            code: `class NumArray {
  constructor(nums) {
    this.n = nums.length;
    this.nums = new Array(this.n).fill(0);
    this.tree = new Array(this.n + 1).fill(0);
    nums.forEach((v, i) => this.update(i, v));
  }
  #add(i, d) { for (i++; i <= this.n; i += i & -i) this.tree[i] += d; }
  #prefix(i) { let s = 0; for (i++; i > 0; i -= i & -i) s += this.tree[i]; return s; }
  update(index, val) { this.#add(index, val - this.nums[index]); this.nums[index] = val; }
  sumRange(l, r) { return this.#prefix(r) - this.#prefix(l - 1); }
}`,
            caption: '#prefix(-1) starts at i = 0 and returns 0 immediately, so no special case is needed for l = 0.',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'text',
            md: 'nums = `[5, 2, 9, -3, 5, 20, 10, -7]`. After building, the 1-based cells are: tree[1]=5, tree[2]=7, tree[3]=9, tree[4]=13, tree[5]=5, tree[6]=25, tree[7]=10, tree[8]=41.',
          },
          {
            type: 'dryrun',
            title: 'prefixSum(6)  → sum of nums[0..6]',
            columns: ['i (1-based)', 'binary', 'tree[i] covers', 'tree[i]', 'running sum', 'next i = i − lowbit'],
            rows: [
              ['7', '0111', '[7, 7]', '10', '10', '6'],
              ['6', '0110', '[5, 6]', '25', '35', '4'],
              ['4', '0100', '[1, 4]', '13', '48', '0 → stop'],
            ],
            note: 'Check: 5 + 2 + 9 − 3 + 5 + 20 + 10 = 48. Three cells instead of seven elements.',
          },
          {
            type: 'dryrun',
            title: 'add(2, +4)  → nums[2] goes from 9 to 13',
            columns: ['i (1-based)', 'binary', 'tree[i] covers', 'tree[i] before', 'tree[i] after', 'next i = i + lowbit'],
            rows: [
              ['3', '0011', '[3, 3]', '9', '13', '4'],
              ['4', '0100', '[1, 4]', '13', '17', '8'],
              ['8', '1000', '[1, 8]', '41', '45', '16 > 8 → stop'],
            ],
            note: 'Exactly the three blocks that contain position 3 were updated.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-6',
            question: 'After `add(2, +4)`, what does `prefixSum(1)` (sum of nums[0..1]) return, and which cells does it read?',
            options: [
              '11, reading tree[2] and tree[1]',
              '7, reading only tree[2]',
              '11, reading only tree[2]',
              '7, reading tree[2] and tree[1]',
            ],
            answer: 1,
            explanation: 'prefixSum(1) starts at i = 2 (1-based). tree[2] covers [1, 2] = 5 + 2 = 7; then i = 2 − 2 = 0 stops. The update at position 3 never touched tree[2] because block [1, 2] does not contain position 3.',
            misconceptions: {
              0: 'tree[2] already covers positions 1 and 2, so reading tree[1] too would double-count nums[0]. And the change at position 3 is not part of this prefix.',
              2: 'The update to nums[2] is not inside nums[0..1], so the answer stays 7.',
              3: 'The value 7 is right, but i goes 2 → 0 in one step (lowbit(2) = 2); tree[1] is never read.',
            },
          },
        ],
      },
      {
        id: 'optimized-compression',
        title: 'Optimized approach — coordinate compression + BIT counting',
        blocks: [
          {
            type: 'text',
            md: `A Fenwick tree can be indexed by **value** instead of by position. Keep \`count[v]\` = how many times v has been seen so far; then "how many seen values are < x" is \`prefix(x − 1)\`.

The obstacle: values like \`-10^9\` or \`10^9\` cannot be array indices. **Coordinate compression** fixes that: only the *relative order* of values matters for "less than" questions, so replace each value by its **rank** among the distinct values.

\`\`\`text
nums   = [ 40, -7, 1000000000, 40, 3 ]
sorted unique = [-7, 3, 40, 1000000000]
rank   = { -7 → 1, 3 → 2, 40 → 3, 1000000000 → 4 }
ranks  = [  3,  1,  4,  3,  2 ]    // same order relations, indices 1..4
\`\`\``,
          },
          {
            type: 'steps',
            title: 'Count of smaller numbers after self',
            steps: [
              'Compress: `sorted = [...new Set(nums)].sort((a, b) => a - b)`, `rank = new Map(sorted.map((v, i) => [v, i]))`.',
              'Create `bit = new FenwickTree(sorted.length)` — one slot per distinct value.',
              'Scan i from n − 1 down to 0 (so everything in the tree is to the right of i).',
              'Answer for i: `bit.prefixSum(rank(nums[i]) − 1)` = number of inserted values with smaller rank (0 when rank is 0).',
              'Insert nums[i]: `bit.add(rank(nums[i]), 1)`.',
            ],
          },
          {
            type: 'code',
            title: 'countSmaller — O(n log n)',
            code: `function countSmaller(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));   // 0-based ranks
  const bit = new FenwickTree(sorted.length);
  const res = new Array(nums.length);
  for (let i = nums.length - 1; i >= 0; i--) {
    const r = rank.get(nums[i]);
    res[i] = r > 0 ? bit.prefixSum(r - 1) : 0;   // strictly smaller, to the right
    bit.add(r, 1);
  }
  return res;
}`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-7',
            question: 'For **reverse pairs** (count i < j with nums[i] > 2·nums[j]) you scan j left to right and need "how many earlier values are > 2·nums[j]". Values are compressed. What is the catch?',
            options: [
              'There is no catch; look up rank(2·nums[j]) in the Map',
              '2·nums[j] may not be in the array, so it has no rank — include the doubled values in the compressed set, or binary-search the first rank whose value is > 2·nums[j]',
              'You must scan right-to-left instead',
              'Reverse pairs cannot be solved with a BIT',
            ],
            answer: 1,
            explanation: 'Compression only assigns ranks to values that were collected. The threshold 2·nums[j] is usually not one of them. Either add every 2·x to the set before sorting, or use `upperBound(sorted, 2·x)` to find how many distinct values are ≤ the threshold.',
            misconceptions: {
              0: '`rank.get(2 * x)` returns `undefined` when 2·x never appears — and the arithmetic then silently produces NaN.',
              2: 'Either direction works if you phrase the question accordingly; direction is not the problem.',
              3: 'It can — it is the textbook BIT + compression problem. Merge sort is the other classic approach.',
            },
            deeper: 'Also watch the multiplication: nums[j] can be −2^31, and 2·nums[j] still fits exactly in a JS number (doubles are exact up to 2^53), so no overflow — unlike in Java/C++ where you would need a long.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Alternative: merge-sort counting',
            md: `Pair-counting problems like inversions, smaller-after-self and reverse pairs can also be solved **inside merge sort**: while merging two sorted halves, for each element of the left half you can count (with a moving pointer) how many elements of the right half satisfy the condition — they all come later in the original array. Every pair (i, j) is counted exactly once, at the merge where i and j are first separated. O(n log n) time, O(n) extra space, no tree and no compression.`,
          },
          {
            type: 'visual',
            scenario: 'merge-sort',
            input: { nums: [5, 2, 6, 1] },
            caption: 'Merge sort splits pairs across halves exactly once — the moment to count them.',
          },
        ],
      },
      {
        id: 'optimized-segment-tree',
        title: 'Optimized approach — segment tree',
        blocks: [
          {
            type: 'text',
            md: `A **segment tree** is a binary tree over the index range. The root covers \`[0, n−1]\`; a node covering \`[lo, hi]\` has children \`[lo, mid]\` and \`[mid+1, hi]\` with \`mid = (lo + hi) >> 1\`; leaves cover single elements. Each node stores the aggregate of its segment.

For \`nums = [2, 1, 5, 3]\` with sums:

\`\`\`text
                 node 1: [0,3] = 11
                /                   \\
       node 2: [0,1] = 3       node 3: [2,3] = 8
         /        \\              /        \\
  node 4: [0]=2  node 5: [1]=1  node 6: [2]=5  node 7: [3]=3
\`\`\`

Stored in an array: node \`k\` has children \`2k\` and \`2k + 1\` and parent \`k >> 1\` — the same numbering as a binary heap.

**Query [l, r]** — three cases at every node:
1. **No overlap** (\`r < lo || hi < l\`) → return the identity (0 for sum, Infinity for min).
2. **Full overlap** (\`l <= lo && hi <= r\`) → return the stored value, do not go deeper.
3. **Partial overlap** → ask both children and combine.

Query [1, 2] on the tree above: root is partial → node 2 partial → node 4 no overlap (0), node 5 full (1); node 3 partial → node 6 full (5), node 7 none (0). Answer 6.

**Update i** — walk from the root to the leaf of i, change it, and recompute every node on the way back up.

**Why O(log n) per query?** On each level of the tree, at most **two** nodes are partially overlapped (the ones containing the left and right borders of the query); every other visited node is a full or no overlap and stops immediately. With ~log₂ n levels, a query visits at most ~4 log n nodes.`,
          },
          { type: 'visual', scenario: 'segment-tree', caption: "Full overlap: use the node. No overlap: skip it. Partial: go down both sides." },
          {
            type: 'code',
            title: 'Recursive segment tree (sum) — build / update / query',
            code: `class SegTree {
  constructor(nums) {
    this.n = nums.length;
    this.tree = new Array(4 * this.n).fill(0);   // 4n is always enough
    if (this.n) this.#build(nums, 1, 0, this.n - 1);
  }
  #build(nums, node, lo, hi) {
    if (lo === hi) { this.tree[node] = nums[lo]; return; }
    const mid = (lo + hi) >> 1;
    this.#build(nums, 2 * node, lo, mid);
    this.#build(nums, 2 * node + 1, mid + 1, hi);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
  }
  update(i, val, node = 1, lo = 0, hi = this.n - 1) {
    if (lo === hi) { this.tree[node] = val; return; }
    const mid = (lo + hi) >> 1;
    if (i <= mid) this.update(i, val, 2 * node, lo, mid);
    else this.update(i, val, 2 * node + 1, mid + 1, hi);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1]; // fix on the way up
  }
  query(l, r, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return 0;                  // no overlap
    if (l <= lo && hi <= r) return this.tree[node];  // full overlap
    const mid = (lo + hi) >> 1;                      // partial overlap
    return this.query(l, r, 2 * node, lo, mid) + this.query(l, r, 2 * node + 1, mid + 1, hi);
  }
}`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-8',
            question: 'You turn the sum segment tree into a **min** segment tree by replacing `+` with `Math.min`. What else must change?',
            options: [
              'Nothing else',
              'The array size must become 8n',
              'The no-overlap case must return Infinity instead of 0',
              'Queries must now scan the leaves in [l, r]',
            ],
            answer: 2,
            explanation: 'The "no overlap" return value must be the identity of the operation — the value that does not affect the result. For sum that is 0; for min it is Infinity (min(x, Infinity) = x). Returning 0 would make every query with a no-overlap branch return ≤ 0.',
            misconceptions: {
              0: 'With 0 as the neutral value, `Math.min(7, 0)` is 0, so a query on all-positive data could return 0 — wrong.',
              1: 'The tree shape does not depend on the operation; 4n is still enough.',
              3: 'That would be O(n) again. The full-overlap case already returns the min of a whole node.',
            },
          },
        ],
      },
      {
        id: 'implementation-segment-tree',
        title: 'JavaScript implementation — iterative segment tree',
        blocks: [
          {
            type: 'text',
            md: `The toolkit \`SegmentTree\` uses the compact **bottom-up** layout: an array of size \`2n\`, leaves at \`tree[n..2n−1]\`, and \`tree[i] = combine(tree[2i], tree[2i+1])\` for \`i = n−1 … 1\`. No recursion, and it works for any n (not only powers of two).

\`\`\`text
n = 4, nums = [2, 1, 5, 3]
index:  1    2    3    4  5  6  7
tree:  11    3    8    2  1  5  3
            parents   | leaves (nums)
\`\`\``,
          },
          {
            type: 'code',
            title: 'Toolkit SegmentTree — annotated',
            code: `class SegmentTree {
  constructor(arr, combine = (a, b) => a + b, identity = 0) {
    this.n = arr.length;
    this.combine = combine;
    this.identity = identity;
    this.tree = new Array(2 * this.n).fill(identity);
    for (let i = 0; i < this.n; i++) this.tree[this.n + i] = arr[i];      // leaves
    for (let i = this.n - 1; i > 0; i--)                                  // parents, bottom-up
      this.tree[i] = combine(this.tree[2 * i], this.tree[2 * i + 1]);
  }
  update(index, value) {              // SET arr[index] = value
    let i = index + this.n;
    this.tree[i] = value;
    for (i >>= 1; i >= 1; i >>= 1)    // climb to the root, recomputing parents
      this.tree[i] = this.combine(this.tree[2 * i], this.tree[2 * i + 1]);
  }
  query(left, right) {                // inclusive [left, right]
    let resLeft = this.identity, resRight = this.identity;
    let l = left + this.n, r = right + this.n + 1;   // half-open [l, r) on leaves
    while (l < r) {
      if (l & 1) resLeft = this.combine(resLeft, this.tree[l++]);   // l is a right child: take it, step right
      if (r & 1) resRight = this.combine(this.tree[--r], resRight); // r-1 is a left child: take it
      l >>= 1; r >>= 1;                                              // move both borders up one level
    }
    return this.combine(resLeft, resRight);   // left and right parts kept separate → works for non-commutative ops
  }
}

// usage: const st = new SegmentTree(nums, Math.min, Infinity); st.query(2, 5);`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Why the odd-index checks?',
            md: 'At each level, if the left border `l` is a **right** child (odd), its parent also covers stuff to the left of the range — so take `tree[l]` alone and move past it. Otherwise the parent is fully inside and will be taken at a higher level. The right border is symmetric. At most two nodes are taken per level → O(log n).',
          },
        ],
      },
      {
        id: 'optimized-lazy',
        title: 'Optimized approach — lazy propagation (range updates)',
        blocks: [
          {
            type: 'text',
            md: `Now the updates are **"add delta to every element of [l, r]"** and the queries are **"sum of [l, r]"** (problem \`classic-range-add-range-sum\`).

Updating each leaf would be O(n). Instead, reuse the query decomposition: the update range is tiled by O(log n) nodes. For each fully covered node:
- increase its sum by \`delta × (hi − lo + 1)\` — correct immediately, and
- write \`delta\` into \`lazy[node]\` = "my children still owe this addition".

Later, whenever an operation needs to go **below** a node with a pending tag, first **push** it: apply the tag to both children (updating their sums and their own tags) and clear it. Nobody ever reads a stale child, because every path to a child passes through its parent and pushes first.`,
          },
          {
            type: 'code',
            title: 'Toolkit LazySegmentTree — annotated',
            code: `class LazySegmentTree {
  constructor(arr) {
    this.n = arr.length;
    this.sum = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);   // pending add for the children
    if (this.n) this.#build(arr, 1, 0, this.n - 1);
  }
  #build(arr, node, lo, hi) { /* same as a normal recursive build */ }
  #apply(node, lo, hi, delta) {                 // "everything under node gets +delta"
    this.sum[node] += delta * (hi - lo + 1);     // node is correct right now
    this.lazy[node] += delta;                    // children will be fixed later
  }
  #push(node, lo, hi) {                          // hand the debt to the children
    if (this.lazy[node] !== 0) {
      const mid = (lo + hi) >> 1;
      this.#apply(2 * node, lo, mid, this.lazy[node]);
      this.#apply(2 * node + 1, mid + 1, hi, this.lazy[node]);
      this.lazy[node] = 0;
    }
  }
  rangeAdd(l, r, delta, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return;                          // no overlap
    if (l <= lo && hi <= r) return this.#apply(node, lo, hi, delta); // full: stop here
    this.#push(node, lo, hi);                              // partial: children must be current
    const mid = (lo + hi) >> 1;
    this.rangeAdd(l, r, delta, 2 * node, lo, mid);
    this.rangeAdd(l, r, delta, 2 * node + 1, mid + 1, hi);
    this.sum[node] = this.sum[2 * node] + this.sum[2 * node + 1];
  }
  rangeSum(l, r, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.sum[node];
    this.#push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    return this.rangeSum(l, r, 2 * node, lo, mid) + this.rangeSum(l, r, 2 * node + 1, mid + 1, hi);
  }
}`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-9',
            question: 'In `rangeSum`, what goes wrong if you **forget** `this.#push(node, lo, hi)` before recursing into the children?',
            options: [
              'Nothing — the node\'s own sum already includes the pending additions',
              'The children may still have stale sums that miss a pending addition, so partial queries return too little',
              'The query becomes O(n)',
              'The lazy values overflow',
            ],
            answer: 1,
            explanation: 'When a node absorbed an update it fixed only its own sum. Its children do not know about it until a push. A partial query reads the children, so without the push it misses that addition.',
            misconceptions: {
              0: 'True for a *full-overlap* query (we return the node\'s sum and never look below). But a partial query combines children, and those are the stale ones.',
              2: 'Complexity is unchanged — the result is simply wrong.',
              3: 'Tags are ordinary numbers; the bug is a missing addition, not a size problem.',
            },
            deeper: 'Invariant to remember: **"sum[node] is always correct; the values below a node are correct once all tags on the path from the root have been pushed."** Every descent pushes on its way down, so every node you actually read satisfies it.',
          },
          {
            type: 'reflect',
            prompt: 'Why is a range update with lazy propagation still O(log n), even though it conceptually changes r − l + 1 elements?',
            deeper: 'The update visits exactly the same nodes a query on [l, r] would visit: at most two partial nodes per level plus their fully-covered or disjoint children. Fully covered nodes stop immediately (they only record a tag). So the work is O(log n) per operation, and the deferred work is paid later, a little at a time, only along paths that are actually visited — each push is O(1) and happens on a path we were walking anyway.',
          },
        ],
      },
      {
        id: 'optimized-sparse-table',
        title: 'Optimized approach — sparse table (static RMQ)',
        blocks: [
          {
            type: 'text',
            md: `If the array **never changes**, we can precompute more and query faster. Let \`st[k][i]\` = min of the block of length \`2^k\` starting at i:

\`\`\`text
nums      = [4, 6, 1, 5, 7, 3, 2]
st[0] (len 1) = [4, 6, 1, 5, 7, 3, 2]
st[1] (len 2) = [4, 1, 1, 5, 3, 2]         st[1][i] = min(st[0][i], st[0][i+1])
st[2] (len 4) = [1, 1, 1, 2]               st[2][i] = min(st[1][i], st[1][i+2])
\`\`\`

Build: \`st[k][i] = min(st[k−1][i], st[k−1][i + 2^(k−1)])\` — two halves of the previous level. n log n cells, each O(1) → O(n log n).

**Query [l, r]:** let \`len = r − l + 1\` and \`k = floor(log2(len))\`, so \`2^k ≤ len < 2^(k+1)\`. Two blocks of length 2^k — one starting at l, one ending at r — **cover the whole range**, possibly overlapping in the middle:

\`\`\`text
query [1, 5]  len = 5, k = 2 (block length 4)
index:  0  1  2  3  4  5  6
            [ block at l=1  ]
                  [ block ending at r=5 ]
answer = min(st[2][1], st[2][2]) = min(1, 1) = 1
\`\`\`

The overlap (indices 2..4) is counted twice — harmless because **min is idempotent**: min(x, x) = x. For **sum** it would be wrong (overlap added twice), which is why sparse tables are used for min/max/gcd, not sums.`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-structures-cp-10',
            question: 'Why does a sparse table answer range **min** in O(1) but not range **sum**?',
            options: [
              'Sums need more memory',
              'The two blocks may overlap; min(x, x) = x so overlap is harmless, but x + x double-counts',
              'Sums are not associative',
              'It can answer sums in O(1) too with the same query',
            ],
            answer: 1,
            explanation: 'The O(1) query uses two power-of-two blocks that together cover [l, r] but may share elements. That is only safe for idempotent operations (min, max, gcd, bitwise AND/OR).',
            misconceptions: {
              0: 'Memory is identical — n log n numbers either way.',
              2: 'Sum is associative. The missing property is idempotence.',
              3: 'Try nums = [1, 1, 1], query [0, 2]: blocks [0,1] and [1,2] each sum to 2, total 4 ≠ 3. (For static sums, just use prefix sums — also O(1).)',
            },
          },
          {
            type: 'code',
            title: 'classic-range-minimum-query with the toolkit SparseTable',
            code: `function rangeMinQuery(nums, queries) {
  const st = new SparseTable(nums, Math.min);   // O(n log n) build
  return queries.map(([l, r]) => st.query(l, r)); // O(1) each
}`,
            caption: 'The toolkit precomputes log[len] with log[i] = log[i >> 1] + 1, avoiding floating-point Math.log2.',
          },
        ],
      },
      {
        id: 'optimized-dynamic-ranges',
        title: 'Optimized approach — huge coordinates & interval problems',
        blocks: [
          {
            type: 'text',
            md: `Some problems talk about positions up to **10^9** (calendars, falling squares, range modules) but perform only ~10^3–10^4 operations. Only the **endpoints that actually appear** matter — nothing changes between two consecutive endpoints. Three acceptable strategies:

1. **Sorted boundary map (sweep).** My Calendar III: store \`+1\` at each start and \`−1\` at each end; after every booking, walk the sorted keys with a running sum — the max running sum is the answer. O(k) per booking after sorting, fine for ≤ 400 calls.
2. **Sorted list of disjoint intervals.** Range Module: keep \`[[l1, r1], [l2, r2], …]\` sorted and non-overlapping; binary-search where a new range lands, then merge (add), cut (remove) or check containment (query).
3. **Coordinate compression + segment tree.** Falling Squares: collect every left and right edge, sort + dedupe, map to indices, and run a segment tree over those indices supporting "max on a range" and "raise a range to h".`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Half-open intervals',
            md: 'Calendars and range modules use **half-open** intervals `[start, end)`: `[10, 20)` and `[20, 30)` do not overlap. Keep that convention everywhere (compressed indices `[idx(start), idx(end) − 1]` for "cells"), and your merge conditions become simple.',
          },
          {
            type: 'text',
            md: `**When no tree is needed at all.** Range Frequency Queries asks "how many times does value v appear in arr[l..r]?" on a **static** array. Record, for each value, the sorted list of positions where it appears (pushing while scanning keeps them sorted). The answer is \`lowerBound(pos[v], r + 1) − lowerBound(pos[v], l)\` — two binary searches, O(log n), with O(n) total memory. A segment tree would need per-node frequency maps and be far heavier.`,
          },
          {
            type: 'visual',
            scenario: 'binary-search',
            input: { nums: [1, 4, 7, 9, 12, 20], target: 9 },
            caption: 'Counting positions of a value inside [l, r] is two binary searches on its sorted index list.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Index 0 in a Fenwick tree** — \`0 & -0 === 0\`, so \`i += i & -i\` loops forever. Always convert to 1-based.
2. **Assignment vs. addition** — a BIT stores deltas. \`update(i, val)\` must add \`val − current[i]\` and then store the new current value.
3. **Wrong identity** — 0 for sum/xor/count, \`Infinity\` for min, \`-Infinity\` for max, 0 for gcd.
4. **Recursive segment tree with 2n slots** — the recursive (1-rooted, 2k/2k+1) layout needs up to 4n.
5. **Forgetting \`push\`** in a lazy tree before descending (in updates *and* queries).
6. **Sparse table for sums** — overlapping blocks double-count.
7. **Default \`sort()\` during compression** — sorts as strings; always pass \`(a, b) => a - b\`.
8. **Off-by-one in counting** — "strictly smaller" is \`prefix(rank − 1)\`; "smaller or equal" is \`prefix(rank)\`. Insert the current element *after* querying when pairs must have i ≠ j.
9. **Deep recursion** — a recursive segment tree has depth ~log n (safe), but a *dynamic* tree over 10^9 coordinates still only has depth ~30 — no stack issues. It is recursion over *lists* that overflows, not over balanced trees.
10. **Floating-point log** — \`Math.floor(Math.log2(len))\` is slow in hot loops and can misround near powers of two for huge values; use a precomputed table or \`31 - Math.clz32(len)\`.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'Fenwick / segment tree: O(log n) per update and query; sparse table: O(1) per query',
            space: 'Fenwick O(n) · segment tree O(n) (2n iterative, 4n recursive) · sparse table O(n log n)',
            md: `| Structure | Build | Point update | Range update | Range query | Memory |
|---|---|---|---|---|---|
| Prefix sums | O(n) | O(n) | O(n) | O(1) (sum) | O(n) |
| Fenwick tree | O(n log n), or O(n) | O(log n) | O(log n) with difference trick (point query) | O(log n) (invertible ops) | n + 1 |
| Segment tree | O(n) | O(log n) | — | O(log n) (any associative op) | 2n / 4n |
| Lazy segment tree | O(n) | O(log n) | O(log n) | O(log n) | 8n (sum + tag) |
| Sparse table | O(n log n) | ✗ | ✗ | O(1) (idempotent ops) | n log n |
| Index lists + binary search | O(n) | ✗ | ✗ | O(log n) (frequency of v) | O(n) |

**Counting problems** (compression + BIT): O(n log n) for sorting + n × O(log n) BIT operations = **O(n log n)** time, O(n) space.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Start with the trade-off table**: "Plain array is O(1)/O(n), prefix sums are O(n)/O(1); I need both fast, so a Fenwick tree gives O(log n)/O(log n)."
- **Prefer the Fenwick tree** when the aggregate is a sum/count — it is ~10 lines and hard to get wrong. Say why a segment tree is needed when it is (min/max, range updates).
- **Say the invariant**: "tree[i] holds the sum of the lowbit(i) elements ending at i" or "every node stores the min of its segment; sum[node] is always correct, children are correct after push."
- **For counting problems**, name the reduction explicitly: "pairs i < j → scan, and for each j ask how many earlier values satisfy the condition → BIT over compressed values."
- **Mention the alternative**: merge-sort counting for inversions / reverse pairs / smaller-after-self; sorted-list or sweep solutions for small-q interval problems.
- **Edge cases**: empty array, single element, duplicate values in compression, negative numbers, l = r queries, updates to the same index twice.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'i & -i', use: 'Lowest set bit (Fenwick step size). Works for i up to 2^31 − 1 (bitwise ops use 32-bit ints)', complexity: 'O(1)' },
              { api: '(lo + hi) >> 1', use: 'Midpoint without floating point (safe while lo + hi < 2^31)', complexity: 'O(1)' },
              { api: 'new Array(4 * n).fill(0)', use: 'Recursive segment tree storage', complexity: 'O(n)' },
              { api: 'new Int32Array(n) / Float64Array(n)', use: 'Zero-initialised, compact storage for large trees (Int32 wraps above 2^31 — use Float64 for big sums)', complexity: 'O(n)' },
              { api: '[...new Set(a)].sort((x, y) => x - y)', use: 'Unique sorted values for coordinate compression', complexity: 'O(n log n)' },
              { api: 'new Map(sorted.map((v, i) => [v, i]))', use: 'Value → rank', complexity: 'O(1) average lookup' },
              { api: '31 - Math.clz32(len)', use: 'floor(log2(len)) for a sparse-table query', complexity: 'O(1)' },
              { api: 'FenwickTree, SegmentTree, LazySegmentTree, SparseTable', use: 'Toolkit globals in the editor (0-based, inclusive ranges)', complexity: 'see Complexity' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: [
      'Interleaved updates and range queries (n, q ≈ 10^5)',
      'Counting pairs i < j by a value condition → BIT over (compressed) values',
      'Range updates + range queries → lazy segment tree',
      'Static array, many min/max queries → sparse table',
    ],
    clues: ['update + sumRange', 'count of smaller after self', 'reverse pairs', 'add val to range [l, r]', 'static RMQ', 'coordinates up to 10^9, few operations'],
    template: `// Fenwick (1-based)
add(i, d)  { for (; i <= n; i += i & -i) t[i] += d; }
prefix(i)  { let s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }
// Segment tree query: no overlap → identity; full → tree[node]; partial → combine(children)
// Sparse table: k = log[r - l + 1]; min(st[k][l], st[k][r - (1 << k) + 1])`,
    complexity: 'BIT / segment tree O(log n) per op, O(n) space; sparse table O(n log n) build, O(1) query',
    mistakes: ['index 0 in a BIT', 'add val instead of val − old', 'wrong identity for min/max', 'missing push in lazy tree', 'sparse table for sums', 'default sort in compression'],
    jsTools: ['i & -i', '>> 1', 'Map (ranks)', 'Set + sort', 'Math.clz32', 'toolkit FenwickTree / SegmentTree / LazySegmentTree / SparseTable'],
  },

  keyConcepts: [
    'Prefix sums: O(1) query but O(n) update; trees balance both at O(log n) using power-of-two blocks.',
    'Fenwick: tree[i] covers the lowbit(i) elements ending at i; query removes the lowest bit, update adds it; 1-indexed.',
    'A BIT indexed by value (after coordinate compression) counts "how many seen values are < x" in O(log n).',
    'Segment tree: no / full / partial overlap; at most two partial nodes per level → O(log n); works for any associative op.',
    'Lazy propagation: fully covered nodes absorb a range update and push the tag to children only when needed.',
    'Sparse table: two overlapping power-of-two blocks answer idempotent queries (min/max/gcd) in O(1) on static data.',
    'Huge coordinates: compress endpoints or keep sorted boundaries; static frequency queries need only index lists + binary search.',
  ],

  interviewTips: [
    'Rule out prefix sums / difference arrays first, with a reason (interleaved updates).',
    'Prefer a Fenwick tree for sums and counts; justify a segment tree for min/max or range updates.',
    'For pair counting, state the reduction to prefix queries, and mention merge-sort counting as an alternative.',
  ],
};
