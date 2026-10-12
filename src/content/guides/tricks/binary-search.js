export default {
  signals: [
    '"integer square root" / "largest x with f(x) ≤ n" → search the answer, not an array',
    '"array of unknown size" / "infinite sorted stream" → exponential search first',
    '"single element in a sorted array where every other appears twice"',
    '"k-th smallest in a sorted matrix / multiplication table" → search on the value, count ≤ mid',
    '"maximum average subarray of length ≥ k" → binary search on a real-valued answer',
    '"how many elements lie in [a, b]" on sorted data → two lower bounds',
    '"find minimum in rotated sorted array" → compare mid with the right end',
  ],
  tricks: [
    {
      title: 'Real-valued answers: loop a fixed number of times',
      kind: 'template',
      md: 'For continuous answers (square roots, max average, geometry), `while (hi − lo > eps)` can loop forever when floating-point gaps exceed eps. Run a fixed count instead: 100 halvings shrink any range of doubles far below 10^-15 of its width. Also: never use `>> 1` on floats.',
      code: `function sqrtReal(x) {
  let lo = 0, hi = Math.max(1, x);
  for (let it = 0; it < 100; it++) {
    const mid = (lo + hi) / 2;
    if (mid * mid <= x) lo = mid; else hi = mid;
  }
  return lo;
}
console.log(sqrtReal(2).toFixed(10), sqrtReal(0.25)); // 1.4142135624 0.5`,
    },
    {
      title: 'Unknown size: double the bound, then binary search',
      kind: 'template',
      md: 'If you cannot read the length (a stream or an API that returns Infinity out of range), grow `hi` as 1, 2, 4, 8… until `get(hi) ≥ target`. That takes O(log p) steps where p is the target\'s position, and the final range `[hi/2, hi]` is then searched normally — O(log p) overall.',
      code: `function searchUnknown(get, target) { // get(i) → value, Infinity past the end
  let hi = 1;
  while (get(hi) < target) hi *= 2;
  let lo = hi >> 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (get(mid) < target) lo = mid + 1; else hi = mid;
  }
  return get(lo) === target ? lo : -1;
}
const data = [-1, 0, 3, 5, 9, 12];
console.log(searchUnknown((i) => data[i] ?? Infinity, 9)); // 4`,
    },
    {
      title: 'Search on the value and count how many are ≤ mid',
      kind: 'recognition',
      md: 'When the data is "sorted-ish" (sorted rows and columns, a multiplication table, pair distances) you often cannot index the k-th element, but you *can* count how many elements are ≤ x quickly. Binary search over the value range for the smallest x with count ≥ k. The result is guaranteed to be an actual element.',
      code: `function kthSmallest(matrix, k) {
  const n = matrix.length;
  let lo = matrix[0][0], hi = matrix[n - 1][n - 1];
  const countLE = (x) => { // staircase walk from bottom-left, O(n)
    let c = 0, r = n - 1, col = 0;
    while (r >= 0 && col < n) matrix[r][col] <= x ? (c += r + 1, col++) : r--;
    return c;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (countLE(mid) >= k) hi = mid; else lo = mid + 1;
  }
  return lo;
}
console.log(kthSmallest([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8)); // 13`,
    },
    {
      title: 'Pairs in a sorted array: look at the parity of mid',
      kind: 'recognition',
      md: 'Before the single element, pairs start at even indices; after it, at odd indices. So force `mid` to be even and check `a[mid] === a[mid + 1]`: if true, the single is to the right; otherwise it is at mid or to the left. The predicate "pair starts at an even index" is monotonic — that is what makes binary search legal here.',
      code: `function singleNonDuplicate(a) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (mid % 2 === 1) mid--;
    if (a[mid] === a[mid + 1]) lo = mid + 2;
    else hi = mid;
  }
  return a[lo];
}
console.log(singleNonDuplicate([1, 1, 2, 3, 3, 4, 4, 8, 8])); // 2`,
    },
    {
      title: 'Integer sqrt: compare with division, not mid * mid',
      kind: 'javascript',
      md: 'For n near 2^53 (or any big bound), `mid * mid` exceeds `Number.MAX_SAFE_INTEGER` and loses precision, so comparisons quietly go wrong. Compare `mid <= n / mid` instead (or use `BigInt`). Use `Math.floor((lo + hi) / 2)` rather than `>> 1` once bounds can pass 2^31.',
      code: `function isqrt(n) {
  let lo = 0, hi = n;
  while (lo < hi) { // last x with x*x <= n → round mid up
    const mid = Math.floor((lo + hi + 1) / 2);
    if (mid <= n / mid) lo = mid; else hi = mid - 1;
  }
  return lo;
}
console.log(isqrt(8), isqrt(2 ** 52), isqrt(Number.MAX_SAFE_INTEGER)); // 2 67108864 94906265`,
    },
    {
      title: 'Count in a range with two lower bounds',
      kind: 'template',
      md: 'With one `lowerBound(x)` = first index with `a[i] ≥ x`, you get everything else: the count of values in `[lo, hi]` is `lowerBound(hi + 1) − lowerBound(lo)` for integers, upper bound is `lowerBound(x + 1)`, and "x exists" is `a[lowerBound(x)] === x`. One well-tested function beats four hand-written variants.',
      code: `function lowerBound(a, x) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}
const a = [1, 2, 2, 2, 5, 7, 9];
const countIn = (l, r) => lowerBound(a, r + 1) - lowerBound(a, l);
console.log(countIn(2, 5), countIn(3, 4), countIn(0, 100)); // 4 0 7`,
    },
    {
      title: 'Print the predicate to debug: it must look like F F F T T T',
      kind: 'edge-cases',
      md: 'Most binary-search bugs are a predicate that is not monotonic or points the wrong way. Map it over the whole (small) input and print it: you should see all `false` then all `true` (or the reverse). Then test arrays of length 0, 1 and 2 and targets below the minimum and above the maximum.',
      code: `const a = [2, 3, 5, 7, 11, 13];
const P = (i) => a[i] >= 6; // "first index with value ≥ 6"
console.log(a.map((_, i) => (P(i) ? 'T' : 'F')).join(' ')); // F F F T T T`,
    },
    {
      title: 'Rotated minimum: compare mid with hi, not lo',
      kind: 'edge-cases',
      md: 'Comparing `a[mid]` with `a[hi]` always tells you which side holds the minimum: if `a[mid] > a[hi]`, the drop is to the right of mid; otherwise the minimum is at mid or left. Comparing with `a[lo]` fails on an un-rotated array, where both halves look "sorted". With duplicates, `a[mid] === a[hi]` is undecidable — do `hi--` (worst case O(n)).',
      code: `function findMin(a) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] > a[hi]) lo = mid + 1;
    else if (a[mid] < a[hi]) hi = mid;
    else hi--; // duplicates
  }
  return a[lo];
}
console.log(findMin([4, 5, 6, 7, 0, 1, 2]), findMin([1, 2, 3]), findMin([2, 2, 2, 0, 1])); // 0 1 0`,
    },
    {
      title: 'There is no built-in bisect in JavaScript',
      kind: 'javascript',
      md: '`indexOf`, `includes`, `find` and `findIndex` are all linear scans, even on sorted arrays. Keep a tested `lowerBound` in your toolkit, and to keep an array sorted while inserting, find the slot with it and `splice` (O(n) per insert, but with a fast native memmove).',
    },
    {
      title: 'Name the answer range out loud',
      kind: 'interview',
      md: 'For answer search, state "lowest possibly-valid answer, highest surely-valid answer, and why feasibility is monotonic" before coding. For "ship within D days", lo = max(weight) (anything smaller cannot carry the heaviest package) and hi = sum(weights) (one day). Tight, justified bounds remove off-by-one panic later.',
    },
  ],
  traps: [
    {
      looksLike: 'O(log n) search in a rotated array with duplicates',
      actually: 'O(n) worst case',
      why: 'when a[lo] === a[mid] === a[hi] you cannot tell which half is sorted, so you can only shrink by one.',
    },
    {
      looksLike: 'Binary search on the answer for "shortest subarray with sum ≥ k" (positives)',
      actually: 'Sliding window in O(n)',
      why: 'answer search works (O(n log n)), but the window is simpler and faster; the deque version handles negatives.',
    },
    {
      looksLike: 'Sort, then binary search to find two indices that sum to a target',
      actually: 'Hash map in one pass',
      why: 'sorting loses original indices and costs O(n log n); the Map solution is O(n).',
    },
  ],
  sources: [
    { label: 'CP-Algorithms — Binary search', url: 'https://cp-algorithms.com/num_methods/binary_search.html' },
    { label: 'MDN — Number.MAX_SAFE_INTEGER', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER' },
  ],
};
