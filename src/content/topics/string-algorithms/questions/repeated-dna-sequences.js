export default {
  id: 'repeated-dna-sequences',
  title: 'Repeated DNA Sequences',
  difficulty: 'Medium',
  order: 1,
  pattern: 'string-rolling-hash',
  tags: ['string', 'rolling hash', 'bit manipulation', 'hash set', 'sliding window'],
  source: { platform: 'LeetCode', number: 187, url: 'https://leetcode.com/problems/repeated-dna-sequences/' },

  statement: `A DNA string uses only the letters \`A\`, \`C\`, \`G\` and \`T\`. Given such a string \`s\`, return every **10-letter-long** substring that occurs **more than once** in \`s\`. Each such sequence should appear once in the output, in any order.`,
  examples: [
    { input: 's = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"', output: '["AAAAACCCCC","CCCCCAAAAA"]' },
    { input: 's = "AAAAAAAAAAAAA"', output: '["AAAAAAAAAA"]', explanation: 'Overlapping occurrences count.' },
  ],
  constraints: ['1 <= s.length <= 10^5', 's[i] is one of A, C, G, T'],

  think: `- How many windows of length 10 are there? What does storing each as a string cost?
- With only 4 letters, how many bits does one letter need? How many bits does a whole window need?
- When the window slides by one, how do you update that number without rebuilding it?`,
  patternChallenge: {
    options: ['Rolling Hash / exact bit encoding of windows', 'KMP Prefix Function', 'Expand Around Center', 'Monotonic Stack'],
    answer: 0,
    explanation: 'We compare every length-10 window with every other — a "many substrings against each other" problem, which is what rolling hashes are for. With a 4-letter alphabet the hash can even be exact: 2 bits per letter, 20 bits per window. KMP searches for one known pattern, which we do not have.',
  },
  hints: [
    'Map A,C,G,T to 0,1,2,3. A window is a 20-bit number: `code = ((code << 2) | v) & 0xFFFFF` slides it by one letter.',
    'Keep a Set `seen` of codes and a Set `added` of codes already reported. When a full window\'s code is already in seen and not yet in added, output `s.slice(i − 9, i + 1)`.',
  ],
  approach: `**Simple (accepted):** slide over every window, \`s.slice(i, i + 10)\` into a Map of counts — O(10 · n) time, but it creates n small strings.

**Rolling encoding (exact rolling hash):**
- Letters → 2-bit values. Keep \`code\` = last 10 letters packed into 20 bits.
- Each step: shift left by 2, OR the new letter, AND with \`0xFFFFF\` to drop the letter that left. O(1) per step and **no collisions** — different windows have different codes.
- Only build a substring when reporting an answer.

For general alphabets/lengths, the same structure works with a polynomial rolling hash (with the usual collision caveats).`,

  functionName: 'findRepeatedDnaSequences',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string[]}
 */
function findRepeatedDnaSequences(s) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: "Example 1", hint: "The basic case: two different 10-letter sequences each appear twice.", args: ["AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"], expected: ["AAAAACCCCC","CCCCCAAAAA"] },
    { scenario: "Example 2", hint: "\"AAAAAAAAAA\" occurs four times (overlapping) but must be reported once — use a second Set for \"already added\".", args: ["AAAAAAAAAAAAA"], expected: ["AAAAAAAAAA"] },
    { scenario: "Single letter", hint: "Smallest input: shorter than 10, so there are no windows — return [].", args: ["A"], expected: [] },
    { scenario: "Shorter than 10", hint: "No 10-letter window exists; do not crash or return partial windows.", args: ["ACGTACGTA"], expected: [] },
    { scenario: "Exactly 10 letters", hint: "Only one window, so nothing can repeat. If you record codes before the window is full (i < 9), the partial code for \"A…\" equals the full code 0 and you report a false repeat.", args: ["AAAAAAAAAA"], expected: [] },
    { scenario: "Eleven equal letters", hint: "Two overlapping windows at 0 and 1 are the same sequence.", args: ["AAAAAAAAAAA"], expected: ["AAAAAAAAAA"] },
    { scenario: "Three occurrences", hint: "The sequence appears three times; it must still appear once in the output.", args: ["ACGTTGCAACTACGTTGCAACGACGTTGCAAC"], expected: ["ACGTTGCAAC"] },
    { scenario: "Repeat uses letter T", hint: "T maps to the highest 2-bit code (3); a wrong mask or shift corrupts windows that contain it.", args: ["TTTTTGTTTTTCTTTTTGTTTTT"], expected: ["TTTTTGTTTT","TTTTGTTTTT"] },
    { scenario: "Near-misses only", hint: "These windows differ only in their last letter — a code that keeps stale letters (missing mask) or drops one letter too many confuses them.", args: ["AAAAAAAAACGAAAAAAAAAT"], expected: [] },
    { scenario: "Repeat at both ends", hint: "The first and last windows are equal — make sure the last window (i = n − 1) is processed.", args: ["GATTACAGGCTTTTTTTTTTTTTTGATTACAGGC"], expected: ["GATTACAGGC","TTTTTTTTTT"] },
    { scenario: "Periodic \"ACGT…\" (n = 10^5)", hint: "Only four distinct windows exist, each repeating ~25 000 times — report each once.", argsGen: "() => ['ACGT'.repeat(25000)]", expected: ["ACGTACGTAC","CGTACGTACG","GTACGTACGT","TACGTACGTA"] },
    { scenario: "All \"A\" (n = 10^5)", hint: "One sequence repeated ~10^5 times: the output is just [\"AAAAAAAAAA\"].", argsGen: "() => ['A'.repeat(100000)]", expected: ["AAAAAAAAAA"] },
    { scenario: "No repeats (n = 10^5)", hint: "A de Bruijn prefix: all 10^5 windows are different. Searching the rest of the string for each window is O(n²) — use a Set of rolling codes (or window strings) for O(n).", argsGen: "() => { const k = 4, n = 10, A = 'ACGT', a = new Array(n + 1).fill(0), out = []; const need = 100000; const db = (t, p) => { if (out.length >= need) return; if (t > n) { if (n % p === 0) for (let j = 1; j <= p; j++) out.push(A[a[j]]); return; } a[t] = a[t - p]; db(t + 1, p); for (let j = a[t - p] + 1; j < k; j++) { a[t] = j; db(t + 1, t); } }; db(1, 1); const s = out.slice(0, need).join(''); return [s]; }", expected: [], timeLimitMs: 1000 },
    { scenario: "One repeat at the end", hint: "All windows are distinct except that the very first one reappears at the end.", argsGen: "() => { const k = 4, n = 10, A = 'ACGT', a = new Array(n + 1).fill(0), out = []; const need = 19990; const db = (t, p) => { if (out.length >= need) return; if (t > n) { if (n % p === 0) for (let j = 1; j <= p; j++) out.push(A[a[j]]); return; } a[t] = a[t - p]; db(t + 1, p); for (let j = a[t - p] + 1; j < k; j++) { a[t] = j; db(t + 1, t); } }; db(1, 1); const s = out.slice(0, need).join(''); return [s + s.slice(0, 10)]; }", expected: ["AAAAAAAAAA","GAAAAAAAAA","GGAAAAAAAA","CGGAAAAAAA","GCGGAAAAAA","AAAAGGCGGA","AAAGGCGGAA","AAGGCGGAAA","AGGCGGAAAA","GGCGGAAAAA"] },
  ],
  solution: {
    code: `function findRepeatedDnaSequences(s) {
  const L = 10;
  const val = { A: 0, C: 1, G: 2, T: 3 };
  const MASK = (1 << (2 * L)) - 1;         // 20 bits = 0xFFFFF
  const seen = new Set();
  const added = new Set();
  const res = [];
  let code = 0;

  for (let i = 0; i < s.length; i++) {
    code = ((code << 2) | val[s[i]]) & MASK; // slide: push new letter, drop the oldest
    if (i < L - 1) continue;                 // window not full yet
    if (seen.has(code)) {
      if (!added.has(code)) {
        added.add(code);
        res.push(s.slice(i - L + 1, i + 1));
      }
    } else {
      seen.add(code);
    }
  }
  return res;
}`,
    explanation: 'Bitwise operators work on 32-bit integers in JS; 20 bits fit comfortably, so `<<`, `|` and `&` are exact here.',
  },
  dryRun: {
    columns: ['i', 'window s[i−9..i]', 'code (20-bit)', 'seen before?', 'action'],
    rows: [
      ['9', 'AAAAACCCCC', '341 (A=00 ×5, then C=01 ×5)', 'no', 'add to seen'],
      ['10', 'AAAACCCCCA', '…', 'no', 'add to seen'],
      ['19', 'AAAAACCCCC', 'same as i = 9', 'yes', 'report "AAAAACCCCC"'],
      ['20', 'AAAACCCCCC', '…', 'no', 'add'],
      ['25', 'CCCCCAAAAA', 'same as i = 14', 'yes', 'report "CCCCCAAAAA"'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One O(1) update per letter; the sets hold at most n − 9 numbers (and at most 2^20 distinct codes).' },
  alternative: {
    title: 'Substring counting with a Map',
    md: 'The most readable version: count every `s.slice(i, i + 10)` in a Map and return the keys with count > 1. O(n · 10) time and more memory for the strings, but perfectly fine for 10^5.',
    code: `function findRepeatedDnaSequences(s) {
  const count = new Map();
  for (let i = 0; i + 10 <= s.length; i++) {
    const t = s.slice(i, i + 10);
    count.set(t, (count.get(t) ?? 0) + 1);
  }
  return [...count].filter(([, c]) => c > 1).map(([t]) => t);
}`,
    complexity: 'O(10·n) time, O(10·n) space',
  },
  mistakes: [
    'Reporting a sequence every time it repeats (3 occurrences → reported twice). Use a second Set.',
    'Forgetting the mask, so old letters stay in the code and every window looks different.',
    'Starting to record before the first window is full (i < 9).',
    'Strings shorter than 10 — return an empty array.',
  ],
};
