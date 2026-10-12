export default {
  id: 'decode-ways-ii',
  title: 'Decode Ways II',
  difficulty: 'Hard',
  order: 2,
  pattern: 'dp-1d-string-decoding',
  tags: ['string', 'dynamic programming', 'math'],
  source: { platform: 'LeetCode', number: 639, url: 'https://leetcode.com/problems/decode-ways-ii/' },

  statement: `Same encoding as Decode Ways (\`'A' → "1"\` … \`'Z' → "26"\`), but the string may also contain \`'*'\`, which stands for **any digit from 1 to 9** (never 0).

Return the number of ways to decode \`s\`, **modulo \`10^9 + 7\`**.`,
  examples: [
    { input: 's = "*"', output: '9', explanation: '"1".."9" → A..I.' },
    { input: 's = "1*"', output: '18', explanation: 'Split as 1|* (9 ways) or as 1* = 11..19 (9 ways).' },
    { input: 's = "2*"', output: '15', explanation: '2|* gives 9; 2* as two digits gives 21..26 → 6.' },
  ],
  constraints: ['1 <= s.length <= 10^5', "s[i] is a digit or '*'"],

  think: `- The recurrence is still dp[i] = (ways the last char alone is a letter) × dp[i−1] + (ways the last two chars are a letter) × dp[i−2]. Can you count those "ways" for each case?
- How many meanings does "*" have alone? "1*"? "2*"? "**"? "*6"? "*7"?
- Why must the modulo be applied at every step in JavaScript?`,
  patternChallenge: {
    options: ['Backtracking over every * value', '1D DP — String Decoding', 'Combinatorics formula without DP', 'Sliding Window'],
    answer: 1,
    explanation: 'Same two-state DP as Decode Ways; each transition gets a multiplier equal to the number of valid meanings of the 1- or 2-character piece. Backtracking over 9^(#stars) choices is hopeless for n = 10⁵.',
  },
  hints: [
    'one(c): "*" → 9, "0" → 0, other digit → 1.',
    'two(a, b): "**" → 15 (11–19, 21–26); "*d" → 2 if d ≤ 6 else 1; "1*" → 9; "2*" → 6; other "*"-with-a cases → 0; plain digits → 1 if 10..26 else 0.',
  ],
  approach: `**DP:** \`dp[i] = one(s[i−1]) · dp[i−1] + two(s[i−2], s[i−1]) · dp[i−2]\` (mod 1e9+7), \`dp[0] = 1\`.

Counting the multipliers:
- **one(c):** '*' → 9 (1–9), '0' → 0, else 1.
- **two(a, b):**
  - a = '*', b = '*' → 11–19 and 21–26 → **15**
  - a = '*', b digit → '1b' always valid; '2b' valid if b ≤ 6 → **2 or 1**
  - a = '1', b = '*' → 11–19 → **9**
  - a = '2', b = '*' → 21–26 → **6**
  - a other, b = '*' → **0**
  - both digits → 1 if 10 ≤ ab ≤ 26 else 0

**JS precision:** dp values are < 1e9+7 and multipliers ≤ 15, so each product < 1.6·10¹⁰ — well within 2⁵³. Take \`% MOD\` after each step.`,

  functionName: 'numDecodings',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function numDecodings(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '"*" is any of 1–9: nine single letters.', args: ['*'], expected: 9 },
    { scenario: 'Example 2', hint: 'As two letters: 1 · 9 = 9 ways. As one two-digit code: 11–19, another 9. Total 18.', args: ['1*'], expected: 18 },
    { scenario: 'Example 3', hint: '9 ways as "2" + single, plus 21–26 as one letter (6): 15.', args: ['2*'], expected: 15 },
    { scenario: 'Two stars', hint: 'As two singles: 81. As one code: 11–19 and 21–26 = 15 (not 26 or 17). Total 96.', args: ['**'], expected: 96 },
    { scenario: 'Single zero', hint: '"0" alone maps to nothing — 0 ways.', args: ['0'], expected: 0 },
    { scenario: 'Star before zero', hint: '"*" is 1–9 only (never 0), and only 10 and 20 are valid, so 2 ways. Letting * be 0 too adds bogus codes.', args: ['*0'], expected: 2 },
    { scenario: 'Star after 3', hint: '"3*" cannot form a two-digit code (31–39 > 26): only 9 single-letter readings.', args: ['3*'], expected: 9 },
    { scenario: 'No stars at all', hint: 'Plain digits behave exactly like Decode Ways: "12" → 2.', args: ['12'], expected: 2 },
    { scenario: 'Star then small digit', hint: '"*2" pairs as 12 or 22; "*6" pairs as 16 or 26; "*7" only as 17.', args: ['*2*6'], expected: 175 },
    { scenario: 'Mixed stars and zeros', hint: 'Every 0 must glue to the digit before it; a "*" before a 0 can only be 1 or 2.', args: ['*1*1*0'], expected: 404 },
    { scenario: 'Zero after a star pair', hint: 'The final 0 needs the "*" before it to be 1 or 2, which removes options from the rest.', args: ['1**0'], expected: 36 },
    { scenario: 'All stars (n = 10^5)', hint: 'The count grows like 9^n·…: apply the modulo at EVERY step. Taking it only at the end overflows 2^53 (or reaches Infinity) and loses precision.', argsGen: '() => [\'*\'.repeat(100000)]', expected: 81890275, timeLimitMs: 1000 },
    { scenario: 'Random mix (n = 10^5)', hint: 'Recursion over 10⁵ characters is too deep and, without memo, exponential. Keep two rolling values, multiplying by the number of choices for each one- and two-character code.', argsGen: '() => { let s = 21; const ch = \'*0123456789**12\'; let out = \'\'; for (let i = 0; i < 100000; i++) { s = (s * 1664525 + 1013904223) % 4294967296; out += ch[Math.floor(s / 256) % ch.length]; } return [out]; }', expected: 0, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numDecodings(s) {
  const MOD = 1_000_000_007;
  const one = (c) => (c === '*' ? 9 : c === '0' ? 0 : 1);
  const two = (a, b) => {
    if (a === '*' && b === '*') return 15;          // 11-19, 21-26
    if (a === '*') return b <= '6' ? 2 : 1;          // 1b always, 2b if b <= 6
    if (b === '*') return a === '1' ? 9 : a === '2' ? 6 : 0;
    const v = (a.charCodeAt(0) - 48) * 10 + (b.charCodeAt(0) - 48);
    return v >= 10 && v <= 26 ? 1 : 0;
  };
  let prev2 = 1;                 // dp[0]
  let prev1 = one(s[0]);         // dp[1]
  for (let i = 2; i <= s.length; i++) {
    const cur = (one(s[i - 1]) * prev1 + two(s[i - 2], s[i - 1]) * prev2) % MOD;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  },
  dryRun: {
    columns: ['i', 'piece(s)', 'one × dp[i−1]', 'two × dp[i−2]', 'dp[i]'],
    rows: [
      ['1', '"*"', '9 × 1', '—', '9'],
      ['2', '"*", "**"', '9 × 9 = 81', '15 × 1 = 15', '96'],
    ],
    note: 's = "**" → 96.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant-time case analysis per character.' },
  alternative: {
    title: 'Enumerate digit values for each piece',
    md: 'Instead of hand-counted multipliers, loop over the digits each character can be and count valid codes. Slower by a constant factor (up to 81 pairs), but much harder to get wrong.',
    code: `function numDecodings(s) {
  const MOD = 1_000_000_007;
  const opts = (c) => (c === '*' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [c.charCodeAt(0) - 48]);
  const one = (c) => opts(c).filter((d) => d !== 0).length;
  const two = (a, b) => {
    let k = 0;
    for (const x of opts(a)) for (const y of opts(b)) { const v = x * 10 + y; if (v >= 10 && v <= 26) k++; }
    return k;
  };
  let p2 = 1, p1 = one(s[0]);
  for (let i = 2; i <= s.length; i++) {
    const cur = (one(s[i - 1]) * p1 + two(s[i - 2], s[i - 1]) * p2) % MOD;
    p2 = p1; p1 = cur;
  }
  return p1;
}`,
    complexity: 'O(81 · n) time, O(1) space',
  },
  mistakes: [
    'Letting "*" mean 0 as well (it is 1–9 only).',
    'Counting "**" as 26 or 17 — the valid two-digit codes are 11–19 and 21–26: 15.',
    'Applying the modulo only at the end — values explode past 2⁵³ and lose precision.',
  ],
};
