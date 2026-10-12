export default {
  signals: [
    'the statement defines something "in terms of itself" (f(n) needs f(n − 1) or f(n / 2))',
    'input is nested: arrays inside arrays, JSON, brackets inside brackets',
    '"count the ways" with small n (≤ 25) — recursion first, memo next',
    'n or the exponent can be 10^9 … 10^18 → halve instead of subtract',
    'answer for a string = combine answers for the parts on each side of a split',
    '"both players play optimally" / "can the first player win"',
  ],
  tricks: [
    {
      title: 'Write the one-sentence contract before any code',
      kind: 'interview',
      md: "Say exactly what the function returns, in terms of its parameters: “go(i) returns the number of ways to decode s from index i to the end”. Once the meaning is fixed, the base case (what does go(s.length) mean?) and the combine step fall out almost mechanically. Most wrong recursions come from a return value whose meaning silently changes between the base case and the recursive case.",
    },
    {
      title: 'Count your base cases from your offsets',
      kind: 'edge-cases',
      md: "Look at the smallest argument any recursive call can produce. If you call f(n − 1) and f(n − 2), both n = 0 and n = 1 must be handled, otherwise f(1) calls f(−1) and never stops. A quick check: for every recursive call, ask “can this argument skip past my base case?” — if yes, add a base case or use `<=` instead of `===`.",
      code: `function climb(n) {
  if (n <= 1) return 1; // covers n = 0 AND n = 1, since we subtract 1 and 2
  return climb(n - 1) + climb(n - 2);
}
console.log(climb(5)); // → 8`,
    },
    {
      title: 'Pass an index, never a slice',
      kind: 'optimization',
      md: "`arr.slice(1)` or `s.substring(1)` in every call copies the rest of the input, so a linear recursion quietly becomes O(n²) time and O(n²) memory. Pass the same array plus a start index (or lo/hi bounds) instead — each call is then O(1) work and the recursion tree is unchanged.",
      code: `const sum = (a, i = 0) => (i === a.length ? 0 : a[i] + sum(a, i + 1));
console.log(sum([1, 2, 3, 4])); // → 10`,
    },
    {
      title: 'Thread the memo through default parameters',
      kind: 'javascript',
      md: "In JavaScript a default parameter such as `memo = new Map()` is evaluated on EVERY call that omits it (unlike Python, where it is shared). That is great for the top-level call (fresh cache each time) but if a recursive call forgets to pass `memo` along, every level gets an empty Map and you are back to exponential time.",
      code: `function fib(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1, memo) + fib(n - 2, memo); // pass memo down!
  memo.set(n, v);
  return v;
}
console.log(fib(50)); // → 12586269025`,
    },
    {
      title: 'Use numeric memo keys for two-parameter states',
      kind: 'optimization',
      md: "A key like `i + ',' + j` builds a new string on every lookup. If the parameters are bounded integers, encode them as one number (`i * cols + j`) — Map lookups on numbers are much faster and produce no garbage. Make sure the multiplier is larger than the biggest value of the second parameter, or two states will collide.",
      code: `function uniquePaths(m, n) {
  const memo = new Map();
  const go = (r, c) => {
    if (r === m - 1 || c === n - 1) return 1;
    const key = r * n + c; // c < n, so keys never collide
    if (memo.has(key)) return memo.get(key);
    const res = go(r + 1, c) + go(r, c + 1);
    memo.set(key, res);
    return res;
  };
  return go(0, 0);
}
console.log(uniquePaths(3, 7)); // → 28`,
    },
    {
      title: 'Keep a parser cursor in a closure variable',
      kind: 'template',
      md: "For nested input (decode string, evaluate expression, parse JSON-like text) let every recursive call read from one shared index `i` kept in the outer function. A call consumes exactly its own bracketed piece and returns; when it comes back, the caller simply continues from where the cursor now points. Returning `[value, newIndex]` pairs also works but is noisier.",
      code: `function decode(s) { // "3[a2[c]]" → "accaccacc"
  let i = 0;
  const parse = () => {
    let out = '', num = 0;
    while (i < s.length && s[i] !== ']') {
      const ch = s[i++];
      if (ch >= '0' && ch <= '9') num = num * 10 + (ch - '0');
      else if (ch === '[') { out += parse().repeat(num); num = 0; i++; } // i++ skips ']'
      else out += ch;
    }
    return out;
  };
  return parse();
}
console.log(decode('3[a2[c]]')); // → accaccacc`,
    },
    {
      title: 'Replace deep recursion with an explicit stack',
      kind: 'javascript',
      md: "V8 does not do tail-call optimisation, so even `return f(n - 1)` keeps a stack frame, and around 10 000 frames you get `RangeError: Maximum call stack size exceeded`. Any recursion can be turned into a loop with your own array as the stack: push what the recursive call would have received, pop to process. Store a “next child index” in each frame when you need to resume where you left off.",
      code: `function flatten(arr) {
  const out = [], stack = [[arr, 0]]; // frame = [array, next index]
  while (stack.length) {
    const frame = stack[stack.length - 1];
    const [a, i] = frame;
    if (i === a.length) { stack.pop(); continue; }
    frame[1]++;
    if (Array.isArray(a[i])) stack.push([a[i], 0]); else out.push(a[i]);
  }
  return out;
}
console.log(flatten([1, [2, [3, [4]]], 5])); // → [1,2,3,4,5]`,
    },
    {
      title: 'Read complexity off the recurrence shape',
      kind: 'interview',
      md: "Memorise four shapes and you can answer most complexity questions instantly: T(n) = T(n/2) + O(1) → O(log n) (fast power); T(n) = 2T(n/2) + O(1) → O(n) (tree traversal); T(n) = 2T(n/2) + O(n) → O(n log n) (merge sort); T(n) = 2T(n − 1) + O(1) → O(2ⁿ) (naive subsets / Hanoi). The rule of thumb behind them: branches^depth calls, times the work per call.",
    },
    {
      title: 'Iterative binary exponentiation with BigInt products',
      kind: 'javascript',
      md: "With a modulus near 10^9, `a * b` can reach 10^18 — far past 2^53 — so Number silently loses the low digits and the answer is wrong without any error. Do the multiply in BigInt (or keep everything BigInt) and convert back at the end. The loop form below also avoids the classic bug of calling pow(x, n/2) twice.",
      code: `function powMod(base, exp, mod) {
  const m = BigInt(mod);
  let result = 1n, b = BigInt(base) % m, e = BigInt(exp);
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return Number(result);
}
console.log(powMod(2, 100, 1e9 + 7)); // → 976371285`,
    },
    {
      title: 'Trace the recursion tree with indentation',
      kind: 'edge-cases',
      md: "When a recursion misbehaves, add a `depth` parameter and log `'  '.repeat(depth)` before the arguments. The printout is the recursion tree: you immediately see repeated sub-calls (time to memoise), a missing base case (the indentation never comes back) or a wrong argument. Remove the parameter when done.",
      code: `function fibTrace(n, depth = 0) {
  console.log('  '.repeat(depth) + 'fib(' + n + ')');
  if (n < 2) return n;
  return fibTrace(n - 1, depth + 1) + fibTrace(n - 2, depth + 1);
}
fibTrace(3); // fib(1) appears twice → overlapping sub-calls`,
    },
  ],
  traps: [
    {
      looksLike: 'Plain recursion for "count the number of ways"',
      actually: 'Recursion + memo (top-down DP)',
      why: 'the same (index, remaining) state is reached by many paths, so without a cache the call tree is exponential',
    },
    {
      looksLike: 'Recursion over a 10^5-element list or a skewed tree',
      actually: 'A loop or an explicit stack',
      why: 'one frame per element blows the ≈10k-frame JavaScript stack even though the algorithm is O(n)',
    },
    {
      looksLike: 'Recursion that returns new arrays (e.g. all subsets via concat)',
      actually: 'Backtracking with one shared path array',
      why: 'allocating and copying at every level multiplies time and memory; push/pop on one array and copy only at the leaves',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Recursion', url: 'https://www.techinterviewhandbook.org/algorithms/recursion/' },
    { label: 'MDN — InternalError: too much recursion', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion' },
  ],
};
