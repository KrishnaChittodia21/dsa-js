export default {
  id: 'count-good-numbers',
  title: 'Count Good Numbers',
  difficulty: 'Medium',
  order: 4,
  pattern: 'recursion-halving',
  tags: ['recursion', 'math', 'fast exponentiation', 'modular arithmetic', 'BigInt'],
  source: { platform: 'LeetCode', number: 1922, url: 'https://leetcode.com/problems/count-good-numbers/' },

  statement: `A digit string (leading zeros allowed) is **good** if:
- every digit at an **even index** (0, 2, 4, …) is even: one of \`0, 2, 4, 6, 8\`, and
- every digit at an **odd index** (1, 3, 5, …) is prime: one of \`2, 3, 5, 7\`.

Given \`n\`, return how many good digit strings of length \`n\` exist. The number is huge, so return it **modulo 10^9 + 7**.`,
  examples: [
    { input: 'n = 1', output: '5', explanation: 'The good strings of length 1 are "0", "2", "4", "6", "8".' },
    { input: 'n = 4', output: '400', explanation: '5 · 4 · 5 · 4 = 400' },
    { input: 'n = 50', output: '564908303' },
  ],
  constraints: ['1 <= n <= 10^15'],

  think: `- How many choices does each position have, and are the positions independent?
- How many even indices and odd indices are there in a string of length n?
- n can be 10^15. How do you compute a^b mod M without b multiplications? And can a JS Number hold (10^9)² exactly?`,
  patternChallenge: {
    options: ['Dynamic Programming over positions', 'Backtracking to generate all strings', 'Sliding Window', 'Counting + modular fast exponentiation (halving recursion)'],
    answer: 3,
    explanation: 'Positions are independent, so the count is 5^(even positions) · 4^(odd positions). With n up to 10^15 the only feasible way is fast exponentiation: log2(10^15) ≈ 50 recursive calls per power.',
  },
  hints: [
    'There are ⌈n/2⌉ even indices and ⌊n/2⌋ odd indices, so the answer is 5^⌈n/2⌉ · 4^⌊n/2⌋ mod (10^9 + 7).',
    'Write a recursive `modPow(base, exp)` that halves exp. Do the arithmetic in **BigInt**: a product of two values near 10^9 is ≈ 10^18, far beyond 2^53, so Number multiplication loses precision.',
  ],
  approach: `**Brute force:** enumerate all strings (5·4·5·… of them) — impossible. Even a loop multiplying n times is 10^15 steps.

**Counting:** each position chooses independently: 5 options at even indices, 4 at odd. With ⌈n/2⌉ even and ⌊n/2⌋ odd indices, the answer is \`5^⌈n/2⌉ · 4^⌊n/2⌋ mod M\`.

**Fast modular power (recursion by halving):**
\`\`\`text
modPow(b, 0) = 1
modPow(b, e) = h·h mod M          (e even), where h = modPow(b, ⌊e/2⌋)
             = h·h·b mod M        (e odd)
\`\`\`

**The JavaScript trap:** \`h\` can be up to 10^9 + 6, so \`h * h\` ≈ 10^18 > \`Number.MAX_SAFE_INTEGER\` (≈ 9·10^15). The Number result is rounded and the modulo becomes wrong. Use **BigInt** (\`1_000_000_007n\`) and convert back with \`Number(...)\` at the end.`,

  functionName: 'countGoodNumbers',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function countGoodNumbers(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A single digit sits at index 0 (even), so only the 5 even digits are allowed.', args: [1], expected: 5 },
    { scenario: 'Example 2', hint: 'Indices 0 and 2 are even (5 choices each), 1 and 3 are prime (4 choices each).', args: [4], expected: 400 },
    { scenario: 'Example 3', hint: 'The answer already exceeds 2^53 before the modulo — multiply with BigInt (or a safe mulMod), not plain Numbers.', args: [50], expected: 564908303 },
    { scenario: 'Two digits', hint: 'One even slot and one odd slot: 5 · 4.', args: [2], expected: 20 },
    { scenario: 'Odd length', hint: 'For odd n the even indices get ⌈n/2⌉ slots. Swapping the counts gives 5·4·4 = 80 instead of 100.', args: [3], expected: 100 },
    { scenario: 'Five digits', hint: 'Three even slots, two odd slots: 5³ · 4². Check you use ceil for evens and floor for odds.', args: [5], expected: 2000 },
    { scenario: 'First value needing the modulo', hint: '5⁸ · 4⁷ is larger than 10^9 + 7 — remember to reduce modulo 10^9 + 7.', args: [15], expected: 399999958 },
    { scenario: 'Precision loss with Numbers', hint: '`(h * h) % MOD` with Numbers: h·h can reach 10^18 and is silently rounded. Use BigInt or split the multiplication.', args: [30], expected: 624001610 },
    { scenario: 'Exponent above 2^32', hint: 'Bit shifts (`e >> 1`) truncate to 32-bit integers, so an exponent this large breaks. Use Math.floor(e / 2) or BigInt.', args: [4294967301], expected: 851982059 },
    { scenario: 'Large n (2·10^8)', hint: 'Multiplying one slot at a time is O(n) — far too slow. Fast exponentiation needs only O(log n) steps.', args: [200000000], expected: 374132355, timeLimitMs: 1000 },
    { scenario: 'Large odd n', hint: 'A big odd n: ⌈n/2⌉ even slots and ⌊n/2⌋ odd slots, all with exact modular arithmetic.', args: [806166225460393], expected: 643535977 },
    { scenario: 'Maximum n (10^15)', hint: 'The largest allowed n. Halving the exponent keeps the recursion only ~50 levels deep.', args: [1000000000000000], expected: 711414395 },
    { scenario: 'Maximum odd n', hint: 'n = 10^15 − 1 is odd: the extra slot belongs to the even indices.', args: [999999999999999], expected: 927853604 },
  ],

  solution: {
    code: `function countGoodNumbers(n) {
  const MOD = 1_000_000_007n;

  // base^exp mod MOD, all BigInt; recursion depth ≈ log2(exp) ≈ 50
  function modPow(base, exp) {
    if (exp === 0n) return 1n;
    const half = modPow(base, exp / 2n);     // BigInt division floors
    const sq = (half * half) % MOD;          // exact: BigInt never loses precision
    return exp % 2n === 0n ? sq : (sq * base) % MOD;
  }

  const N = BigInt(n);
  const evenSlots = (N + 1n) / 2n;           // ceil(n / 2)
  const oddSlots = N / 2n;                   // floor(n / 2)
  return Number((modPow(5n, evenSlots) * modPow(4n, oddSlots)) % MOD);
}`,
    explanation: 'Every multiplication is followed by `% MOD`, so values stay below MOD² ≈ 10^18 — trivial for BigInt. The final result is < MOD, so converting it to a Number is exact.',
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['n = 4', 'evenSlots = 2, oddSlots = 2'],
      ['modPow(5n, 2n)', 'half = modPow(5n, 1n) = 5 → 25'],
      ['modPow(4n, 2n)', 'half = modPow(4n, 1n) = 4 → 16'],
      ['answer', '25 · 16 = 400'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(log n)', explanation: 'Two fast powers, each with ≈ log2(n/2) ≤ 50 recursive calls and frames.' },
  alternative: {
    title: 'Numbers with split multiplication (no BigInt)',
    md: 'Keep Numbers but multiply safely: split b into its high and low 16 bits so each partial product stays below 2^53.',
    code: `const M = 1_000_000_007;
function mulMod(a, b) {           // a, b < M
  const hi = Math.floor(b / 65536), lo = b % 65536;
  return ((a * hi) % M * 65536 + a * lo) % M;
}
function powMod(b, e) {           // e is a Number up to 1e15
  if (e === 0) return 1;
  const h = powMod(b, Math.floor(e / 2));
  const sq = mulMod(h, h);
  return e % 2 === 0 ? sq : mulMod(sq, b);
}
function countGoodNumbers(n) {
  return mulMod(powMod(5, Math.ceil(n / 2)), powMod(4, Math.floor(n / 2)));
}`,
    complexity: 'O(log n) time, O(log n) space — faster than BigInt, but easier to get wrong',
  },
  mistakes: [
    '`(h * h) % MOD` with Numbers: h·h can reach 10^18 and is silently rounded, giving a wrong answer only on large tests.',
    'Mixing BigInt and Number in one expression (`5n * 4`) — throws TypeError. Convert explicitly.',
    'Swapping the counts: even indices (0, 2, …) get ⌈n/2⌉ slots, not ⌊n/2⌋.',
    'Using `e >> 1` for e up to 10^15 — bit shifts truncate to 32 bits.',
  ],
};
