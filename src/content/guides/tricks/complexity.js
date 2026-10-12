export default {
  signals: [
    '"sum of n over all test cases ≤ 2·10^5" → budget per total, not per test',
    'two size variables (n, m / rows, cols / q queries) → keep both in the bound',
    '"q queries" up to 10^5 → per-query cost decides the design',
    'string keys of length L in a Map/Set → every lookup is O(L), not O(1)',
    '"follow up: can you do it in O(1) extra space?"',
    'values up to 10^9 but n ≤ 20 → the exponent comes from n, not the values',
    'recursion over n ≥ 10^4 levels → a stack-depth problem, not a time problem',
  ],
  tricks: [
    {
      title: 'Turn the constraint into an operation budget',
      kind: 'recognition',
      md: 'Plug n into your formula and compare against roughly **10^8 simple operations per second** (a common competitive-programming rule of thumb). Tight numeric loops in JS get close to that; code that allocates objects or hits a `Map` on every step is often 5–10× slower, so leave yourself headroom. Doing this check *before* coding stops you from polishing an approach that can never pass.',
      code: `const fits = (n, cost) => cost(n) <= 1e8;
console.log(fits(1e5, (n) => n * Math.log2(n))); // true  (~1.7e6)
console.log(fits(1e5, (n) => n * n));            // false (1e10)
console.log(fits(2000, (n) => n * n));           // true  (4e6)`,
    },
    {
      title: 'Memorise a few logarithms',
      kind: 'interview',
      md: 'log₂(10^3) ≈ 10, log₂(10^5) ≈ 17, log₂(10^6) ≈ 20, log₂(10^9) ≈ 30, log₂(10^18) ≈ 60. With these you can say "n log n is about 1.7 million steps for n = 10^5" instantly, and you know a binary search over a 10^9 answer range needs only ~30 feasibility checks.',
    },
    {
      title: 'Spot the harmonic sum: inner loop steps by i',
      kind: 'recognition',
      md: 'A loop like `for (i = 1..n) for (j = i; j <= n; j += i)` looks quadratic, but the inner loop runs n/i times, and n/1 + n/2 + … + n/n ≈ n·ln n. This shape appears in sieves, "for every divisor/multiple" problems and some DP — it is **O(n log n)**.',
      code: `let steps = 0;
const n = 100000;
for (let i = 1; i <= n; i++) for (let j = i; j <= n; j += i) steps++;
console.log(steps, Math.round(n * Math.log(n))); // 1166750 vs 1151293`,
    },
    {
      title: 'Measure growth with a doubling experiment',
      kind: 'javascript',
      md: 'When unsure, time the function for n, 2n, 4n with `performance.now()`. If the time roughly doubles, it is linear; if it roughly quadruples, it is quadratic; ×8 means cubic. Ratios are more trustworthy than absolute times because they cancel out machine speed and JIT warm-up noise (use reasonably large n).',
      code: `function work(n) {
  let s = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s++;
  return s;
}
for (const n of [2000, 4000, 8000]) {
  const t = performance.now();
  work(n);
  console.log(n, (performance.now() - t).toFixed(1) + 'ms'); // ~×4 each step
}`,
    },
    {
      title: 'Recursion depth is a separate budget',
      kind: 'javascript',
      md: 'JS engines allow only around 10k nested calls (it varies by engine and frame size). An O(n) recursive solution with n = 10^5 has fine *time* complexity but crashes with `RangeError: Maximum call stack size exceeded`. When depth can reach n, convert to a loop or an explicit stack.',
      code: `const depth = (n) => (n === 0 ? 0 : 1 + depth(n - 1));
try {
  depth(1e6);
} catch (e) {
  console.log(e instanceof RangeError); // true
}`,
    },
    {
      title: 'Spread into Math.max is O(n) and can throw',
      kind: 'javascript',
      md: '`Math.max(...arr)` passes every element as a function argument. It is O(n) (so it must not sit inside a loop), and for arrays of a few hundred thousand items it throws a `RangeError` because of the argument limit. Use a plain loop or `reduce` for large inputs.',
      code: `const big = new Array(300000).fill(1);
try { Math.max(...big); } catch (e) { console.log(e.name); } // RangeError
const max = big.reduce((m, x) => (x > m ? x : m), -Infinity);
console.log(max); // 1`,
    },
    {
      title: 'Memoised recursion: states × work per state',
      kind: 'template',
      md: 'For top-down DP do not try to draw the call tree. Count the **distinct states** (the possible argument combinations) and multiply by the work done inside one call excluding recursive calls. fib(n) with a memo has n states and O(1) work each → O(n), even though the unmemoised tree is O(2ⁿ).',
      code: `let calls = 0;
const memo = new Map();
function fib(n) {
  calls++;
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1) + fib(n - 2);
  memo.set(n, v);
  return v;
}
console.log(fib(50), calls); // 12586269025 99`,
    },
    {
      title: 'The output size is a lower bound',
      kind: 'interview',
      md: 'If the task asks you to *return* all pairs, all subsets or all permutations, no algorithm can beat the size of that answer. Saying "there can be O(n²) pairs in the output, so O(n²) is optimal here" ends a fruitless hunt for something faster — and shows the interviewer you reason about limits.',
    },
    {
      title: 'Clarify what "O(1) extra space" excludes',
      kind: 'interview',
      md: 'By convention the output array usually does not count, and modifying the input may or may not be allowed. Ask both questions. A fixed 26-slot count array is O(1) because its size does not grow with n; a recursion stack of depth log n or n *does* count.',
    },
    {
      title: 'Multi-test inputs: do not reset max-size arrays per test',
      kind: 'edge-cases',
      md: 'With T test cases and "sum of n ≤ 2·10^5", allocating or clearing an array of the *maximum* size in every test costs T × max, which can be 10^4 × 2·10^5. Allocate per test with the test\'s own n, or clear only the entries you touched.',
    },
  ],
  traps: [
    {
      looksLike: 'O(n log n) — "the outer loop halves"',
      actually: 'O(n)',
      why: 'for (i = n; i > 0; i = floor(i/2)) with an inner loop of i steps does n + n/2 + n/4 + … ≈ 2n work in total.',
    },
    {
      looksLike: 'O(n²) — nested loops',
      actually: 'O(n log n)',
      why: 'when the inner loop steps by the outer index (j += i), the total is the harmonic sum n·(1 + 1/2 + … + 1/n).',
    },
    {
      looksLike: 'O(n) — one recursive call per level',
      actually: 'O(n²)',
      why: 'if each call passes arr.slice(1) or a new string, it copies up to n items per level; pass an index instead.',
    },
    {
      looksLike: 'O(1) per Map lookup',
      actually: 'O(L) per lookup with string keys of length L',
      why: 'the whole key must be hashed and compared, so grouping n strings of length L costs O(n·L) at least.',
    },
  ],
  sources: [
    { label: 'USACO Guide — Time Complexity', url: 'https://usaco.guide/bronze/time-comp' },
    { label: 'Tech Interview Handbook — Array (slicing costs)', url: 'https://www.techinterviewhandbook.org/algorithms/array/' },
  ],
};
