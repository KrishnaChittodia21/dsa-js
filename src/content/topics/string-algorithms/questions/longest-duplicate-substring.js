export default {
  id: 'longest-duplicate-substring',
  title: 'Longest Duplicate Substring',
  difficulty: 'Hard',
  order: 5,
  pattern: 'string-rolling-hash',
  tags: ['string', 'rolling hash', 'binary search', 'suffix array'],
  source: { platform: 'LeetCode', number: 1044, url: 'https://leetcode.com/problems/longest-duplicate-substring/' },

  statement: `Return **any** longest substring of \`s\` that occurs at least twice in \`s\` (the occurrences may overlap). If no substring repeats, return \`""\`.`,
  examples: [
    { input: 's = "banana"', output: '"ana"', explanation: '"ana" occurs at 1 and 3 (overlapping).' },
    { input: 's = "abcd"', output: '""' },
  ],
  constraints: ['2 <= s.length <= 3 * 10^4', 's consists of lowercase English letters'],

  think: `- If some substring of length L repeats, does a substring of length L − 1 also repeat? What does that allow?
- For a fixed L, how can you detect a repeated window without comparing strings pairwise?
- With ~3·10^4 windows per check, how big must your hash space be to avoid collisions?`,
  patternChallenge: {
    options: ['KMP Prefix Function', 'Binary search on length + rolling hash', 'Expand Around Center', 'Sliding Window — Variable Size'],
    answer: 1,
    explanation: '"A duplicate of length L exists" is monotonic in L (drop the last character of both copies), so binary search on L works. Each check hashes every length-L window with a rolling hash and looks for a repeat in a Set — O(n) per check. KMP needs a known pattern.',
  },
  hints: [
    'Binary search the largest L in [0, n − 1] such that some window of length L appears twice.',
    'check(L): roll a double hash over all windows of length L (or use prefix hashes), store keys in a Set, return the start of the first repeat. Keep moduli below 2^26 so products are exact in JS.',
  ],
  approach: `**Brute force:** for L from n − 1 down, put every \`slice(i, i + L)\` into a Set until a repeat appears — O(n²) memory/time per L in the worst case, O(n³) overall.

**Optimized — binary search + rolling hash (O(n log n) expected):**
1. \`check(L)\`: for i in [0, n − L], key = hash(s[i..i+L)); if the key is already in the Set, return i; else add. Return −1.
2. Binary search L: lo = 0, hi = n − 1. If check(mid) ≥ 0, record it and go right; else go left.
3. Answer = \`s.slice(start, start + bestL)\`.

**Hashing in JS:** use two primes below 2^26 (67108859, 67108837) and base 131. Every product of two residues is < 2^52, so there is no precision loss; the combined key \`h1 · M2 + h2\` is an exact number < 2^52 — perfect for a Set. With ~3·10^4 windows the collision chance is ~10^−7 per check. (For absolute certainty, verify a hit by comparing the substrings.)

**Advanced alternative:** suffix array + LCP array gives O(n log n) deterministically — beyond most interviews.`,

  functionName: 'longestDupSubstring',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function longestDupSubstring(s) {
  
}
`,
  checker: `(output, args, expected) => {
  const s = args[0];
  if (typeof output !== 'string' || output.length !== expected.length) return false;
  if (output === '') return true;
  return s.indexOf(output) !== -1 && s.indexOf(output) !== s.lastIndexOf(output);
}`,
  tests: [
    { scenario: "Example 1", hint: "The basic case: \"ana\" occurs twice and the two copies overlap.", args: ["banana"], expected: "ana" },
    { scenario: "Example 2", hint: "All characters are distinct, so nothing repeats — return \"\".", args: ["abcd"], expected: "" },
    { scenario: "Two equal characters", hint: "Smallest input with a repeat: the answer is the single repeated letter.", args: ["aa"], expected: "a" },
    { scenario: "Two different characters", hint: "Smallest input with no repeat — return \"\" rather than a 1-letter string.", args: ["ab"], expected: "" },
    { scenario: "All same letter", hint: "In \"aaaaa\" the copies at 0 and 1 overlap heavily; the answer has length n − 1. Do not require the occurrences to be disjoint.", args: ["aaaaa"], expected: "aaaa" },
    { scenario: "Long overlapping repeat", hint: "\"abcab\" occurs at 0 and 3 — they overlap by two characters.", args: ["abcabcab"], expected: "abcab" },
    { scenario: "Classic mississippi", hint: "\"issi\" occurs at 1 and 4. Binary search must go *right* after a success: a repeat of length L implies one of every shorter length.", args: ["mississippi"], expected: "issi" },
    { scenario: "Repeat at both ends", hint: "The duplicate is the prefix and the suffix — make sure the last window (i = n − L) is checked.", args: ["xyzabcdxyz"], expected: "xyz" },
    { scenario: "Whole alphabet, no repeat", hint: "Every letter appears once, so even length 1 has no duplicate.", args: ["abcdefghijklmnopqrstuvwxyz"], expected: "" },
    { scenario: "Thue–Morse string (n = 8192)", hint: "Thue–Morse strings are the classic anti-hash input (they break polynomial hashing with natural overflow). Products of residues must stay below 2^53 in JS, and two moduli make collisions negligible.", argsGen: "() => { let s = ''; for (let i = 0; i < 8192; i++) { let b = 0, v = i; while (v) { b ^= v & 1; v >>= 1; } s += b ? 'b' : 'a'; } return [s]; }", expectedGen: "() => { const [s] = (() => { let s = ''; for (let i = 0; i < 8192; i++) { let b = 0, v = i; while (v) { b ^= v & 1; v >>= 1; } s += b ? 'b' : 'a'; } return [s]; })(); const n = s.length; let sa = Array.from({ length: n }, (_, i) => i), rank = Array.from(s, (c) => c.charCodeAt(0)); const tmp = new Array(n); for (let k = 1; ; k <<= 1) { const key = (i) => (i + k < n ? rank[i + k] : -1); sa.sort((a, b) => rank[a] - rank[b] || key(a) - key(b)); tmp[sa[0]] = 0; for (let i = 1; i < n; i++) tmp[sa[i]] = tmp[sa[i - 1]] + (rank[sa[i]] !== rank[sa[i - 1]] || key(sa[i]) !== key(sa[i - 1]) ? 1 : 0); rank = tmp.slice(); if (rank[sa[n - 1]] === n - 1) break; } let h = 0, best = 0, at = 0; for (let i = 0; i < n; i++) { if (rank[i] > 0) { const j = sa[rank[i] - 1]; while (i + h < n && j + h < n && s[i + h] === s[j + h]) h++; if (h > best) { best = h; at = i; } if (h) h--; } else h = 0; } return s.slice(at, at + best); }" },
    { scenario: "Random letters (n = 3·10^4)", hint: "About 3·10^4 windows per check: with a single modulus near 10^9 (or with products that overflow 2^53) collisions make a wrong \"duplicate\" likely. Use two moduli or verify hits.", argsGen: "() => { let x = 12345, s = ''; for (let i = 0; i < 30000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 26)); } return [s]; }", expectedGen: "() => { const [s] = (() => { let x = 12345, s = ''; for (let i = 0; i < 30000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 26)); } return [s]; })(); const n = s.length; let sa = Array.from({ length: n }, (_, i) => i), rank = Array.from(s, (c) => c.charCodeAt(0)); const tmp = new Array(n); for (let k = 1; ; k <<= 1) { const key = (i) => (i + k < n ? rank[i + k] : -1); sa.sort((a, b) => rank[a] - rank[b] || key(a) - key(b)); tmp[sa[0]] = 0; for (let i = 1; i < n; i++) tmp[sa[i]] = tmp[sa[i - 1]] + (rank[sa[i]] !== rank[sa[i - 1]] || key(sa[i]) !== key(sa[i - 1]) ? 1 : 0); rank = tmp.slice(); if (rank[sa[n - 1]] === n - 1) break; } let h = 0, best = 0, at = 0; for (let i = 0; i < n; i++) { if (rank[i] > 0) { const j = sa[rank[i] - 1]; while (i + h < n && j + h < n && s[i + h] === s[j + h]) h++; if (h > best) { best = h; at = i; } if (h) h--; } else h = 0; } return s.slice(at, at + best); }", timeLimitMs: 1000 },
    { scenario: "Half repeated (n = 3·10^4)", hint: "A random 15 000-letter block written twice: the answer has length 15 000. Storing or comparing whole substrings costs O(L) per window — far too slow; hashing makes each window O(1).", argsGen: "() => { let x = 777, s = ''; for (let i = 0; i < 15000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 26)); } return [s + s]; }", expectedGen: "() => { const [s] = (() => { let x = 777, s = ''; for (let i = 0; i < 15000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 26)); } return [s + s]; })(); return s.slice(0, s.length / 2); }", timeLimitMs: 1000 },
    { scenario: "All \"a\" (n = 3·10^4)", hint: "The answer is n − 1 characters long; check that your binary search can reach hi = n − 1.", argsGen: "() => ['a'.repeat(30000)]", expectedGen: "() => 'a'.repeat(29999)" },
    { scenario: "Two-letter random (n = 3·10^4)", hint: "A small alphabet produces many near-equal windows and a long-ish answer — a good stress test for hash collisions.", argsGen: "() => { let x = 4242, s = ''; for (let i = 0; i < 30000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 2)); } return [s]; }", expectedGen: "() => { const [s] = (() => { let x = 4242, s = ''; for (let i = 0; i < 30000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 2)); } return [s]; })(); const n = s.length; let sa = Array.from({ length: n }, (_, i) => i), rank = Array.from(s, (c) => c.charCodeAt(0)); const tmp = new Array(n); for (let k = 1; ; k <<= 1) { const key = (i) => (i + k < n ? rank[i + k] : -1); sa.sort((a, b) => rank[a] - rank[b] || key(a) - key(b)); tmp[sa[0]] = 0; for (let i = 1; i < n; i++) tmp[sa[i]] = tmp[sa[i - 1]] + (rank[sa[i]] !== rank[sa[i - 1]] || key(sa[i]) !== key(sa[i - 1]) ? 1 : 0); rank = tmp.slice(); if (rank[sa[n - 1]] === n - 1) break; } let h = 0, best = 0, at = 0; for (let i = 0; i < n; i++) { if (rank[i] > 0) { const j = sa[rank[i] - 1]; while (i + h < n && j + h < n && s[i + h] === s[j + h]) h++; if (h > best) { best = h; at = i; } if (h) h--; } else h = 0; } return s.slice(at, at + best); }", timeLimitMs: 1000 },
  ],
  solution: {
    code: `function longestDupSubstring(s) {
  const n = s.length;
  const M1 = 67108859, M2 = 67108837, B = 131;   // primes < 2^26 → exact products in JS
  const h1 = new Array(n + 1).fill(0), h2 = new Array(n + 1).fill(0);
  const p1 = new Array(n + 1).fill(1), p2 = new Array(n + 1).fill(1);
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
    h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
  }
  const key = (l, r) => {
    const a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
    const b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
    return a * M2 + b;                             // exact, < 2^52
  };

  // start index of a repeated window of length L, or -1
  const check = (L) => {
    const seen = new Set();
    for (let i = 0; i + L <= n; i++) {
      const k = key(i, i + L);
      if (seen.has(k)) return i;
      seen.add(k);
    }
    return -1;
  };

  let lo = 1, hi = n - 1, bestLen = 0, bestStart = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = check(mid);
    if (start !== -1) {            // a duplicate of length mid exists → try longer
      bestLen = mid;
      bestStart = start;
      lo = mid + 1;
    } else {
      hi = mid - 1;                // none of length mid → none longer either
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'windows of length mid', 'repeat?', 'best'],
    rows: [
      ['1', '5', '3', 'ban, ana, nan, ana', 'yes (ana at 3)', '"ana"'],
      ['4', '5', '4', 'bana, anan, nana', 'no', '"ana"'],
      ['4', '3', '—', 'stop', '—', '"ana"'],
    ],
  },
  complexity: { time: 'O(n log n) expected', space: 'O(n)', explanation: 'Prefix hashes are O(n). Binary search makes O(log n) calls to check, each O(n) with O(1) Set operations on average.' },
  alternative: {
    title: 'Sliding window hash instead of prefix hashes',
    md: 'Inside check(L), keep a running hash: start with the first L characters, then `h = (h − s[i−1]·B^(L−1)) · B + s[i+L−1]` (mod M, normalised). Same complexity, O(1) extra memory per check. Prefix hashes are simpler because one table serves every L.',
    complexity: 'O(n log n) expected time, O(n) space',
  },
  mistakes: [
    'Using M = 10^9 + 7 with ordinary multiplication — products exceed 2^53 and hashes become wrong silently.',
    'Using a single small modulus — with 3·10^4 windows collisions are likely (birthday paradox), yielding a wrong "duplicate".',
    'Storing substrings in the Set (O(L) each) — O(n²) per check.',
    'Binary searching with the wrong monotonic direction (a duplicate of length L implies one of every smaller length, not larger).',
  ],
};
