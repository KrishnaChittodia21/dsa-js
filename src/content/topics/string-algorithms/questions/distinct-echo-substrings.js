export default {
  id: 'distinct-echo-substrings',
  title: 'Distinct Echo Substrings',
  difficulty: 'Hard',
  order: 4,
  pattern: 'string-rolling-hash',
  tags: ['string', 'rolling hash', 'hash set'],
  source: { platform: 'LeetCode', number: 1316, url: 'https://leetcode.com/problems/distinct-echo-substrings/' },

  statement: `An **echo** string is a non-empty string that can be written as \`a + a\` for some string \`a\` (e.g. "abcabc" = "abc" + "abc"). Return the number of **distinct** non-empty substrings of \`text\` that are echo strings.`,
  examples: [
    { input: 'text = "abcabcabc"', output: '3', explanation: '"abcabc", "bcabca", "cabcab".' },
    { input: 'text = "leetcodeleetcode"', output: '2', explanation: '"ee" and "leetcodeleetcode".' },
  ],
  constraints: ['1 <= text.length <= 2000', 'text contains only lowercase English letters'],

  think: `- An echo is determined by its start i and half-length L. How many (i, L) pairs are there?
- For a pair, you must check s[i..i+L) === s[i+L..i+2L). Can that comparison be O(1)?
- "Distinct" means equal echoes at different positions count once. What will you store in a Set — strings or numbers?`,
  patternChallenge: {
    options: ['Rolling Hash (prefix hashes + Set)', 'KMP Prefix Function', 'Expand Around Center', 'Dynamic Programming (LCS table only)'],
    answer: 0,
    explanation: 'There are O(n²) candidate (start, half-length) pairs; each needs a substring equality check and a distinctness check. Prefix hashes make both O(1): compare the two halves\' hashes and insert the hash of the whole echo into a Set. KMP handles one fixed pattern, not all pairs.',
  },
  hints: [
    'Precompute prefix hashes (two moduli below 2^26 so products stay exact). hash(l, r) is then O(1).',
    'For each L from 1 to n/2, keep a Set for that length (echoes of different lengths are different strings). For each i with i + 2L ≤ n: if hash(i, i+L) === hash(i+L, i+2L), add hash(i, i+2L) to the Set. Sum the Set sizes.',
  ],
  approach: `**Brute force:** for every (i, L), compare the halves with \`slice\` (O(L)) and put the echo string into a Set — O(n³) time and lots of long strings.

**Optimized — rolling hash, O(n²):**
1. Double-modulus prefix hashes; \`get(l, r)\` returns one exact numeric key.
2. For each half-length L: a Set \`seen\`. For each start i: if \`get(i, i + L) === get(i + L, i + 2L)\`, add \`get(i, i + 2L)\` to \`seen\`.
3. Answer = sum of \`seen.size\` over L.

Using one Set per length also lowers collision risk (only same-length echoes are compared). n = 2000 gives ~10^6 pairs — fast.

**Alternative without hashing for the equality test:** for fixed L, walk i with a counter of consecutive positions where \`s[k] === s[k + L]\`; when it reaches L, an echo starts at k − L + 1. You still need hashing (or string keys) for distinctness.`,

  functionName: 'distinctEchoSubstrings',
  paramNames: ['text'],
  starterCode: `/**
 * @param {string} text
 * @return {number}
 */
function distinctEchoSubstrings(text) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "The basic case: three different echoes of length 6, each occurring once.", args: ["abcabcabc"], expected: 3 },
    { scenario: "Example 2", hint: "A short echo (\"ee\") and the whole string itself are both echoes.", args: ["leetcodeleetcode"], expected: 2 },
    { scenario: "Single character", hint: "Smallest input: an echo needs an even length ≥ 2, so the answer is 0.", args: ["a"], expected: 0 },
    { scenario: "Two equal characters", hint: "\"aa\" = \"a\" + \"a\" — the whole string is one echo.", args: ["aa"], expected: 1 },
    { scenario: "Two different characters", hint: "No even-length substring has equal halves.", args: ["ab"], expected: 0 },
    { scenario: "Count distinct, not occurrences", hint: "\"aa\" occurs three times in \"aaaa\" but counts once; \"aaaa\" counts once too. Counting occurrences returns 4 instead of 2.", args: ["aaaa"], expected: 2 },
    { scenario: "Whole string is an echo", hint: "\"abab\" = \"ab\" + \"ab\"; no shorter echo exists.", args: ["abab"], expected: 1 },
    { scenario: "All distinct letters", hint: "No letter repeats, so no echo exists.", args: ["abcd"], expected: 0 },
    { scenario: "Halves not adjacent", hint: "\"abc\" occurs twice but with an \"x\" between the copies — an echo needs s[i..i+L) to equal s[i+L..i+2L) exactly next to each other.", args: ["abcxabc"], expected: 0 },
    { scenario: "Echo inside a palindrome", hint: "\"aa\" in the middle and \"abaaba\" = \"aba\" + \"aba\" — check every start i for each half-length L.", args: ["abaaba"], expected: 2 },
    { scenario: "Ten equal letters", hint: "Echoes of every even length 2, 4, …, 10 — but each length counts once.", args: ["aaaaaaaaaa"], expected: 5 },
    { scenario: "All \"a\" (n = 2000)", hint: "Every even-length window is an echo: about 10^6 pairs to test. Comparing halves character by character or building an O(L) string key for every echo is O(n³); hashing makes each check and key O(1).", argsGen: "() => ['a'.repeat(2000)]", expected: 1000, timeLimitMs: 1800 },
    { scenario: "Fibonacci word (n = 2000)", hint: "Fibonacci words are packed with squares (echoes) of many lengths — a stress test for both distinctness and hashing.", argsGen: "() => { let a = 'a', b = 'ab'; while (b.length < 2000) { const c = b + a; a = b; b = c; } return [b.slice(0, 2000)]; }", expected: 1388 },
    { scenario: "Two-letter random (n = 2000)", hint: "About 10^6 hash comparisons: a single modulus near 10^9 — or products above 2^53 — makes a false \"equal halves\" likely. Use two moduli below 2^26 (or verify hits).", argsGen: "() => { let x = 2024, s = ''; for (let i = 0; i < 2000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 2)); } return [s]; }", expected: 111 },
  ],
  solution: {
    code: `function distinctEchoSubstrings(text) {
  const n = text.length;
  const M1 = 67108859, M2 = 67108837, B = 131;     // primes < 2^26: products stay exact
  const h1 = new Array(n + 1).fill(0), h2 = new Array(n + 1).fill(0);
  const p1 = new Array(n + 1).fill(1), p2 = new Array(n + 1).fill(1);
  for (let i = 0; i < n; i++) {
    const c = text.charCodeAt(i);
    h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
    h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
  }
  // exact numeric key for text[l..r)
  const get = (l, r) => {
    const a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
    const b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
    return a * M2 + b;
  };

  let total = 0;
  for (let L = 1; 2 * L <= n; L++) {
    const seen = new Set();                        // echoes of total length 2L
    for (let i = 0; i + 2 * L <= n; i++) {
      if (get(i, i + L) === get(i + L, i + 2 * L)) seen.add(get(i, i + 2 * L));
    }
    total += seen.size;
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['L', 'starts i with equal halves', 'echoes', 'distinct'],
    rows: [
      ['1', '—', '(no "xx" in abcabcabc)', '0'],
      ['2', '—', '—', '0'],
      ['3', '0, 1, 2, 3', 'abcabc, bcabca, cabcab, abcabc', '3'],
      ['4', '—', '—', '0'],
      ['total', '', '', '3'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'About n²/4 (i, L) pairs, each with O(1) hash work. Each per-length Set holds at most n keys and is discarded after its length.' },
  alternative: {
    title: 'Run-length matching + string keys',
    md: 'For each L, scan with `run` = number of consecutive k with `text[k] === text[k + L]`. Whenever run ≥ L, an echo starts at k − L + 1: add `text.slice(k - L + 1, k + L + 1)` to a Set of strings. No hashing collisions at all, but building strings costs O(L) each — O(n³) worst case ("aaaa…"), still OK for n = 2000 in practice but slower.',
    code: `function distinctEchoSubstrings(text) {
  const n = text.length;
  const seen = new Set();
  for (let L = 1; 2 * L <= n; L++) {
    let run = 0;
    for (let k = 0; k + L < n; k++) {
      run = text[k] === text[k + L] ? run + 1 : 0;
      if (run >= L) seen.add(text.slice(k - L + 1, k + L + 1));
    }
  }
  return seen.size;
}`,
    complexity: 'O(n²) comparisons plus O(L) per echo string',
  },
  mistakes: [
    'Counting occurrences instead of distinct echoes.',
    'Multiplying residues of a ~10^9 modulus in plain numbers — exceeds 2^53 and silently corrupts hashes.',
    'Using a single small modulus over ~10^6 candidates — collisions become likely.',
    'Forgetting that the halves must be adjacent: s[i..i+L) and s[i+L..i+2L).',
  ],
};
