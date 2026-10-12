export default {
  signals: [
    '"circular" / "wrap around" / "next index after the last is the first"',
    '"is s a rotation of goal" → look inside s + s',
    'cells on the same diagonal or anti-diagonal',
    'answer for index i depends on everything to its right → scan right-to-left',
    '"leaders" / "visible from the right" / "max to the right"',
    'grid stored as a flat array or "treat the matrix as one sorted list"',
    '"run-length" / "group consecutive equal values"',
  ],
  tricks: [
    {
      title: 'Walk a circular array with i % n instead of copying it',
      kind: 'template',
      md: 'For "wrap around" problems loop `i` from 0 to 2n − 1 and read `a[i % n]`. You get two laps of the array without allocating `a.concat(a)`. The string version of the same idea: a string is a rotation of another exactly when the lengths match and it appears inside `s + s`.',
      code: `const a = [3, 1, 2];
const n = a.length;
const twoLaps = [];
for (let i = 0; i < 2 * n; i++) twoLaps.push(a[i % n]);
console.log(twoLaps.join(' ')); // 3 1 2 3 1 2

const isRotation = (s, goal) => s.length === goal.length && (s + s).includes(goal);
console.log(isRotation('abcde', 'cdeab'), isRotation('abc', 'acb')); // true false`,
    },
    {
      title: 'Diagonals share r − c, anti-diagonals share r + c',
      kind: 'recognition',
      md: 'Every cell on a top-left → bottom-right diagonal has the same `r − c`; every cell on a top-right → bottom-left diagonal has the same `r + c`. Use that number as a Map key to group diagonals (Toeplitz matrix, diagonal sort, N-Queens attack checks) without walking each diagonal by hand.',
      code: `const grid = [[1, 2, 3], [4, 1, 2], [5, 4, 1]];
const diag = new Map();
grid.forEach((row, r) => row.forEach((v, c) => {
  const k = r - c;
  if (!diag.has(k)) diag.set(k, []);
  diag.get(k).push(v);
}));
console.log(diag.get(0), diag.get(-1)); // [ 1, 1, 1 ] [ 2, 2 ]`,
    },
    {
      title: 'Flatten (r, c) into one index',
      kind: 'template',
      md: 'In an m × n grid, `id = r * n + c` and back again with `r = Math.floor(id / n)`, `c = id % n`. This lets you treat a row-sorted matrix as one sorted array for binary search, store visited cells in a `Set` of numbers (faster than `"r,c"` strings), or index a flat `Uint8Array`.',
      code: `const n = 4; // columns
const toId = (r, c) => r * n + c;
const fromId = (id) => [Math.floor(id / n), id % n];
console.log(toId(2, 3), fromId(11)); // 11 [ 2, 3 ]
const seen = new Uint8Array(3 * n);
seen[toId(1, 2)] = 1;
console.log(seen[6]); // 1`,
    },
    {
      title: 'Scan from the right when the answer depends on the right side',
      kind: 'recognition',
      md: 'If index i needs "the max/min/count of everything after i", iterate backwards and carry that summary in one variable. You avoid a nested loop and an extra suffix array. Typical: leaders in an array, "replace each element with the greatest to its right", buildings with an ocean view.',
      code: `function leaders(a) {
  const out = [];
  let maxRight = -Infinity;
  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] > maxRight) out.push(a[i]);
    maxRight = Math.max(maxRight, a[i]);
  }
  return out.reverse();
}
console.log(leaders([16, 17, 4, 3, 5, 2])); // [ 17, 5, 2 ]`,
    },
    {
      title: 'Add a sentinel to kill the "last group" special case',
      kind: 'template',
      md: 'Group-by-runs code usually needs an extra flush after the loop for the final run — and forgetting it is a classic bug. Iterate one step past the end (or append a value that can never equal a real one) so the last run is closed inside the loop like every other run.',
      code: `function rle(s) {
  const out = [];
  let start = 0;
  for (let i = 1; i <= s.length; i++) {
    if (i === s.length || s[i] !== s[start]) { // i === length acts as sentinel
      out.push(s[start] + (i - start));
      start = i;
    }
  }
  return out.join('');
}
console.log(rle('aaabccdddd')); // a3b1c2d4`,
    },
    {
      title: 'Pass index bounds instead of slicing',
      kind: 'optimization',
      md: '`arr.slice(l, r)` copies r − l elements, so slicing inside recursion or a loop silently adds an O(n) factor. Pass `(arr, lo, hi)` and work on the original array; the subarray is just a pair of numbers. Use a half-open `[lo, hi)` convention so the length is simply `hi − lo`.',
      code: `function sumRange(a, lo = 0, hi = a.length) { // [lo, hi)
  if (hi - lo === 0) return 0;
  if (hi - lo === 1) return a[lo];
  const mid = (lo + hi) >> 1;
  return sumRange(a, lo, mid) + sumRange(a, mid, hi);
}
console.log(sumRange([1, 2, 3, 4, 5])); // 15`,
    },
    {
      title: 'Typed arrays for big numeric tables — watch the wrap-around',
      kind: 'javascript',
      md: '`new Int32Array(n)` is zero-filled, compact, never holey, and fast for counts, visited flags and DP rows. But values are coerced: decimals are truncated and anything outside the 32-bit range wraps silently. Use `Float64Array` (or a normal array) when sums can exceed about 2.1 billion.',
      code: `const cnt = new Int32Array(5);
cnt[2] += 3;
console.log(Array.from(cnt)); // [ 0, 0, 3, 0, 0 ]
const t = new Int32Array(1);
t[0] = 2 ** 31;     // too big
console.log(t[0]);  // -2147483648 (wrapped)
t[0] = 7.9;
console.log(t[0]);  // 7 (truncated)`,
    },
    {
      title: 'Copies are shallow: rows of a grid are shared',
      kind: 'edge-cases',
      md: '`[...grid]`, `grid.slice()` and `Array.from(grid)` copy only the outer array — each row is still the same object, so editing the "copy" edits the original. Copy rows with `grid.map((row) => [...row])` or use `structuredClone(grid)` for deep data.',
      code: `const grid = [[1, 2], [3, 4]];
const shallow = [...grid];
shallow[0][0] = 99;
console.log(grid[0][0]); // 99 — original changed!
const deep = grid.map((row) => [...row]);
deep[1][1] = 0;
console.log(grid[1][1]); // 4`,
    },
    {
      title: 'Negative indices: use at(), and truncate with length',
      kind: 'javascript',
      md: '`arr[-1]` is not the last element — it reads a property named "-1" and returns `undefined` with no error. Use `arr.at(-1)`. After an in-place compaction, set `arr.length = k` to drop the tail in O(1) amortized instead of splicing.',
      code: `const a = [5, 6, 7, 8];
console.log(a[-1], a.at(-1)); // undefined 8
let w = 0;
for (const x of a) if (x % 2 === 0) a[w++] = x;
a.length = w;
console.log(a); // [ 6, 8 ]`,
    },
    {
      title: 'Keep arrays packed: avoid holes and reading past the end',
      kind: 'optimization',
      md: 'V8 tracks an array\'s "elements kind". `new Array(n)` starts **holey** and stays holey even after you fill it; reading `a[a.length]` (an off-by-one `<=` loop) forces a slow prototype lookup. For hot loops build arrays with `push` or `Array.from({ length: n }, () => 0)`, or use a typed array; keep one value type per array, and loop with `i < a.length`. (The difference is small in everyday code — measure before caring.)',
    },
  ],
  traps: [
    {
      looksLike: 'Sort first, O(n log n)',
      actually: 'Counting array, O(n + k)',
      why: 'when values lie in a small known range (ages, grades, 0..100), counting beats comparison sorting and keeps stability easy.',
    },
    {
      looksLike: 'Product except self → total product ÷ nums[i]',
      actually: 'Prefix × suffix products',
      why: 'a single zero makes division impossible (and two zeros make everything 0); prefix/suffix needs no division.',
    },
    {
      looksLike: 'Set-matrix-zeroes needs an extra m × n copy',
      actually: 'Use the first row and column as marker storage',
      why: 'the markers only need one bit per row/column; two extra booleans remember whether row 0 / column 0 themselves must be zeroed.',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Array cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/array/' },
    { label: 'V8 blog — Elements kinds in V8', url: 'https://v8.dev/blog/elements-kinds' },
    { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
  ],
};
