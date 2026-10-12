export default {
  signals: [
    '"k-th smallest in a multiset with inserts/deletes" → BIT over values + binary lifting',
    '"count range sums in [lower, upper]" → prefix sums + BIT over compressed prefix values',
    '"add v to [l, r], then read a single element" → BIT on the difference array',
    '"first index with value ≥ x" while values change → segment tree descent',
    '"number of distinct values in [l, r]" for many queries → sort queries by r + BIT',
    'union area of rectangles / skyline with huge coordinates → sweep + segment tree on compressed y',
    'queries known in advance and no forced online order → think offline',
  ],
  tricks: [
    {
      title: 'Range add + point query with one BIT',
      kind: 'template',
      md: 'Store the **difference array** in the Fenwick tree: adding v to [l, r] is `add(l, v)` and `add(r + 1, -v)`. The current value at i is then `prefix(i)`. You only need two BITs if you want range add **and** range sum. A plain prefix-sum difference array can\'t do this, because it doesn\'t support queries between updates.',
      code: `const n = 5, t = new Array(n + 2).fill(0);
const add = (i, d) => { for (; i <= n + 1; i += i & -i) t[i] += d; };
const prefix = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; };
const rangeAdd = (l, r, v) => { add(l, v); add(r + 1, -v); };   // 1-based
rangeAdd(2, 4, 10); rangeAdd(3, 5, 1);
console.log([1, 2, 3, 4, 5].map(prefix)); // [ 0, 10, 11, 11, 1 ]`,
    },
    {
      title: 'Build a Fenwick tree in O(n)',
      kind: 'optimization',
      md: 'Calling `add` n times costs O(n log n). Instead copy the array into `t`, then for each i push `t[i]` into its parent `i + (i & -i)` once. Each node passes its total up exactly one level, and the parent passes it further later. This matters when n is 10^6 or you rebuild often.',
      code: `function buildBIT(a) {                       // a is 0-based, tree is 1-based
  const n = a.length, t = [0, ...a];
  for (let i = 1; i <= n; i++) { const p = i + (i & -i); if (p <= n) t[p] += t[i]; }
  return t;
}
const t = buildBIT([3, 2, -1, 6, 5]);
const prefix = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; };
console.log(prefix(3), prefix(5)); // 4 15`,
    },
    {
      title: 'Find the k-th smallest by descending the BIT',
      kind: 'template',
      md: 'With counts stored per value, find the k-th smallest by trying jumps of 2^LOG, 2^(LOG−1), …, 1. Take a jump whenever `t[pos + step] < k`, and subtract that count from k. Each tree node covers exactly the block you are skipping, so this takes O(log n), compared with O(log² n) for binary search over prefix sums. It gives you an order-statistics multiset, which JavaScript does not have built in.',
      code: `const N = 8, t = new Array(N + 1).fill(0);
const add = (i, d) => { for (; i <= N; i += i & -i) t[i] += d; };
function kth(k) {                           // smallest value v with prefix(v) >= k
  let pos = 0;
  for (let step = 1 << Math.floor(Math.log2(N)); step; step >>= 1)
    if (pos + step <= N && t[pos + step] < k) { pos += step; k -= t[pos]; }
  return pos + 1;
}
[5, 1, 7, 5].forEach((v) => add(v, 1));
console.log(kth(1), kth(2), kth(3), kth(4)); // 1 5 5 7`,
    },
    {
      title: 'Bottom-up segment tree in 2n slots',
      kind: 'template',
      md: 'Put the leaves at `n..2n-1`. Each internal node i is `op(t[2i], t[2i+1])`. Queries move l and r upward together, so there is no recursion, no 4n array, and no node-range bookkeeping. This works for any associative operation (sum, min, max, gcd). Use the recursive version only when you need lazy propagation or a descent.',
      code: `function segTree(a, op, id) {
  const n = a.length, t = [...new Array(n).fill(id), ...a];   // leaves at n..2n-1
  for (let i = n - 1; i > 0; i--) t[i] = op(t[2 * i], t[2 * i + 1]);
  const update = (i, v) => { for (t[i += n] = v; i > 1; i >>= 1) t[i >> 1] = op(t[i], t[i ^ 1]); };
  const query = (l, r) => {                       // [l, r)
    let resL = id, resR = id;
    for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
      if (l & 1) resL = op(resL, t[l++]); if (r & 1) resR = op(t[--r], resR);
    }
    return op(resL, resR);
  };
  return { update, query };
}
const st = segTree([5, 2, 8, 1, 9], Math.min, Infinity); st.update(3, 7);
console.log(st.query(0, 5), st.query(2, 4)); // 2 7`,
    },
    {
      title: 'Compress coordinates with a typed-array sort',
      kind: 'javascript',
      md: '`Float64Array.from(new Set(values)).sort()` gives the unique values sorted **numerically**, because typed arrays sort as numbers by default. A plain `[...set].sort()` compares as strings and puts 10 before 9. Then map value → rank with a `Map`, or binary search when you need the rank of a value that isn\'t in the list.',
      code: `const values = [100, -5, 9, 100, 10];
const sorted = Float64Array.from(new Set(values)).sort();
const rank = new Map(Array.from(sorted, (v, i) => [v, i + 1]));    // 1-based for a BIT
console.log(Array.from(sorted), [...new Set(values)].sort(), rank.get(100)); // [ -5, 9, 10, 100 ] [ -5, 10, 100, 9 ] 4`,
    },
    {
      title: 'Distinct values in a range: offline by right endpoint',
      kind: 'recognition',
      md: 'Sort the queries by r and sweep i from left to right. When you see `a[i]`, do `+1` at i and `-1` at the previous position where that value appeared, so each value is counted only at its latest position. A query [l, r] is answered right after processing r as `sum(l..r)`. Many hard-looking range questions become easy once you allow yourself to answer queries out of order.',
    },
    {
      title: 'Segment tree descent: first index with value ≥ x',
      kind: 'template',
      md: 'In a max segment tree, if a node\'s max is < x, nothing inside it can be the answer, so skip it. Otherwise go to the left child first and only try the right child if the left one fails. This finds the leftmost match in O(log n), compared with O(log² n) for binary searching on range queries. Use it for "first seat with enough space" and similar questions.',
    },
    {
      title: 'Prefer the BIT, and say why',
      kind: 'interview',
      md: 'A Fenwick tree takes about 10 lines and is hard to get wrong, so use it for sums and counts. Move to a segment tree when the operation can\'t be undone (min/max with arbitrary updates), when you need range assignment, or when you need a descent. For huge or unknown index ranges, mention that a dynamic (lazily created) or persistent segment tree exists. You don\'t have to code it, but naming it shows depth.',
    },
    {
      title: 'Recursive segment trees need 4n',
      kind: 'edge-cases',
      md: 'With root 1 and children 2v / 2v + 1 over [0, n), the highest index used can approach 4n when n is not a power of two. So `new Array(2 * n)` can index past the end with no error: JS just returns `undefined`, and the sums turn into `NaN`. Allocate 4n for recursive trees, or use the bottom-up 2n layout above.',
    },
  ],
  traps: [
    { looksLike: 'BIT for range minimum with arbitrary updates', actually: 'Segment tree', why: 'Fenwick prefix tricks need an invertible operation; min can\'t be undone when a value increases' },
    { looksLike: 'Lazy segment tree for range add + point query', actually: 'BIT on the difference array', why: 'a point value is just a prefix sum of the differences' },
    { looksLike: 'Online data structure needed for range distinct counts', actually: 'Offline sort by r + BIT', why: 'when all queries are known up front, sorting them removes the hard part' },
    { looksLike: 'Segment tree for a static array with sum queries', actually: 'Prefix sums', why: 'with no updates, O(1) queries from a prefix array beat O(log n)' },
  ],
  sources: [
    { label: 'CP-Algorithms — Fenwick tree', url: 'https://cp-algorithms.com/data_structures/fenwick.html' },
    { label: 'CP-Algorithms — Segment tree', url: 'https://cp-algorithms.com/data_structures/segment_tree.html' },
    { label: 'MDN — TypedArray.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/sort' },
  ],
};
