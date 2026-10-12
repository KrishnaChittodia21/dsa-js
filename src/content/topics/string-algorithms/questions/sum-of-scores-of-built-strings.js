export default {
  id: 'sum-of-scores-of-built-strings',
  title: 'Sum of Scores of Built Strings',
  difficulty: 'Hard',
  order: 3,
  pattern: 'string-z-algorithm',
  tags: ['string', 'z-algorithm', 'rolling hash', 'binary search'],
  source: { platform: 'LeetCode', number: 2223, url: 'https://leetcode.com/problems/sum-of-scores-of-built-strings/' },

  statement: `A string \`s\` of length n is built one character at a time by **prepending**: \`s_1\` is the last character of s, \`s_2\` the last two, …, \`s_n = s\`. So \`s_i\` is the suffix of s of length i.

The **score** of \`s_i\` is the length of the longest common prefix of \`s_i\` and \`s\`. Return the sum of the scores of \`s_1, …, s_n\`.`,
  examples: [
    { input: 's = "babab"', output: '9', explanation: 'Suffixes "b","ab","bab","abab","babab" score 1, 0, 3, 0, 5.' },
    { input: 's = "azbazbzaz"', output: '14' },
  ],
  constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],

  think: `- Rephrase: for each **suffix** of s, how long does it match the start of s?
- Which array from this topic stores exactly "LCP of s and s[i..]" for every i?
- What is the score of the full string s_n = s?`,
  patternChallenge: {
    options: ['KMP Prefix Function', 'Z-Algorithm', 'Expand Around Center', 'Sliding Window — Fixed Size'],
    answer: 1,
    explanation: 'The score of the suffix starting at i is z[i] by definition; the answer is the sum of the Z-array (with z[0] = n). The lps array answers prefix-equals-suffix questions, which is a different quantity.',
  },
  hints: [
    's_i is the suffix starting at index n − i; its score is LCP(s, s[n − i..]) = z[n − i].',
    'Build the Z-array in O(n) with the z-box, set z[0] = n, and add everything up.',
  ],
  approach: `**Brute force:** for each suffix, compare character by character with s — O(n²) worst case ("aaaa…").

**Optimized — Z-algorithm (O(n)):** z[i] = LCP(s, s[i..]). Maintain the rightmost box [l, r) where s[l..r) = s[0..r − l). For i inside the box start from \`min(r − i, z[i − l])\`, then extend; update the box. Sum z with z[0] = n.

The sum can reach n(n+1)/2 ≈ 5·10^9 — still an exact JS number.

**Alternative — binary search + hashing:** for each i, binary-search the LCP length comparing prefix hashes: O(n log n).`,

  functionName: 'sumScores',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function sumScores(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: scores 1, 0, 3, 0, 5.', args: ["babab"], expected: 9 },
    { scenario: 'Example 2', hint: 'The statement example: several partial matches add up to 14.', args: ["azbazbzaz"], expected: 14 },
    { scenario: 'Single character', hint: 'Leaving z[0] = 0 returns 0 — the last built string is s itself and scores n = 1.', args: ["a"], expected: 1 },
    { scenario: 'All same letter', hint: 'Every suffix matches fully: 4 + 3 + 2 + 1.', args: ["aaaa"], expected: 10 },
    { scenario: 'All distinct', hint: 'Only s itself scores (n = 4).', args: ["abcd"], expected: 4 },
    { scenario: 'Z-box cap needed', hint: 'Copying z[i − l] without the min(r − i, …) cap overshoots past the end of the current box.', args: ["aabxaab"], expected: 12 },
    { scenario: 'Cap at box edge', hint: 'Inside the box "aabaa", z[i − l] would extend beyond r — cap it and keep extending by comparison.', args: ["aabaacaabaab"], expected: 26 },
    { scenario: 'Not lps', hint: 'lps measures a prefix that ENDS at i; this needs the match STARTING at i. "abab" scores 4 + 0 + 2 + 0.', args: ["abab"], expected: 6 },
    { scenario: 'Two characters', hint: '"ab": only s scores → 2; "aa" would be 3.', args: ["ab"], expected: 2 },
    { scenario: 'Periodic medium', hint: '"abc" repeated 200 times — long z-boxes reused many times.', argsGen: "() => ['abc'.repeat(200)]", expected: 60300 },
    { scenario: 'Large all "a" (n = 10^5)', hint: 'Comparing every suffix character by character is O(n²) ≈ 5·10^9 steps. The Z-algorithm is O(n). The sum exceeds 2^32 — keep it a plain number.', argsGen: "() => ['a'.repeat(100000)]", expected: 5000050000, timeLimitMs: 500 },
    { scenario: 'Large "aaa…ab" (n = 10^5)', hint: 'Every suffix matches almost to the end before hitting "b": the brute force is quadratic again.', argsGen: "() => ['a'.repeat(99999) + 'b']", expected: 4999950001, timeLimitMs: 500 },
  ],
  solution: {
    code: `function sumScores(s) {
  const n = s.length;
  const z = new Array(n).fill(0);
  z[0] = n;                                    // the whole string matches itself
  let total = n;
  for (let i = 1, l = 0, r = 0; i < n; i++) {  // z-box [l, r)
    if (i < r) z[i] = Math.min(r - i, z[i - l]);           // reuse the mirror, capped at r
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++; // extend beyond known region
    if (i + z[i] > r) { l = i; r = i + z[i]; }
    total += z[i];
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['i', 'suffix', 'inside box?', 'start value', 'z[i]', 'box after'],
    rows: [
      ['0', 'babab', '—', 'n', '5', '—'],
      ['1', 'abab', 'no', '0', '0', '[0,0)'],
      ['2', 'bab', 'no', '0', '3', '[2,5)'],
      ['3', 'ab', 'yes', 'min(2, z[1]=0) = 0', '0', '[2,5)'],
      ['4', 'b', 'yes', 'min(1, z[2]=3) = 1', '1 (at end)', '[2,5)'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every successful comparison in the while loop moves r right; r never decreases, so at most n successful comparisons overall.' },
  alternative: {
    title: 'Binary search + prefix hashes',
    md: 'With prefix hashes, "does s[i..i+L) equal s[0..L)?" is O(1). The LCP at i is the largest such L, found by binary search — O(n log n). Useful when you remember hashing better than the z-box.',
    code: `function sumScores(s) {
  const n = s.length, M1 = 67108859, M2 = 67108837, B = 131;
  const h1 = [0], h2 = [0], p1 = [1], p2 = [1];
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    h1.push((h1[i] * B + c) % M1); p1.push((p1[i] * B) % M1);
    h2.push((h2[i] * B + c) % M2); p2.push((p2[i] * B) % M2);
  }
  const get = (l, r) => (((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1) * M2 + (((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2);
  let total = 0;
  for (let i = 0; i < n; i++) {
    let lo = 0, hi = n - i;                      // largest L with s[i..i+L) === s[0..L)
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (get(i, i + mid) === get(0, mid)) lo = mid; else hi = mid - 1;
    }
    total += lo;
  }
  return total;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Leaving z[0] = 0 — the last built string is s itself and scores n.',
    'Copying z[i − l] without the `min(r − i, …)` cap.',
    'Confusing this with lps: lps measures prefix = suffix *ending* at i, not the match *starting* at i.',
  ],
};
