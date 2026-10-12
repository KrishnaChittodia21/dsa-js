export default {
  id: 'longest-repeating-character-replacement',
  title: 'Longest Repeating Character Replacement',
  difficulty: 'Medium',
  order: 7,
  pattern: 'variable-window',
  tags: ['string', 'frequency count', 'sliding window'],
  source: { platform: 'LeetCode', number: 424, url: 'https://leetcode.com/problems/longest-repeating-character-replacement/' },

  statement: `You are given a string \`s\` of uppercase English letters and an integer \`k\`. You may change **at most \`k\`** characters of \`s\` into any other uppercase letter.

Return the length of the **longest substring containing only one repeated letter** that you can obtain.`,
  examples: [
    { input: 's = "ABAB", k = 2', output: '4', explanation: 'Replace both A\'s with B (or both B\'s with A).' },
    { input: 's = "AABABBA", k = 1', output: '4', explanation: 'Replace the A at index 3 → "AABBBBA"; "BBBB" has length 4.' },
  ],
  constraints: ['1 <= s.length <= 10^5', 's consists of uppercase English letters', '0 <= k <= s.length'],

  think: `- For a given window, which letter should you keep, and how many replacements do you need to make the whole window that letter?
- Write the validity rule as a formula using the window length and the count of its most frequent letter.
- When the window shrinks, the most frequent count might drop. Do you need to recompute it exactly — or can a stale value never produce a wrong *answer*?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size (longest valid)', 'Dynamic Programming over (index, k)', 'Greedy: replace the rarest letter everywhere', 'Sliding Window — Fixed Size k'],
    answer: 0,
    explanation: 'Contiguous + longest + a countable rule: a window is fixable when `length − maxFreq ≤ k` (replace everything that is not the majority letter). That is a longest-valid variable window. k is a budget, not the window size.',
  },
  hints: [
    'A window can be made uniform iff `windowLength - (count of its most frequent letter) <= k`.',
    'Keep `count[26]` and `maxFreq` (the largest count seen in any window so far). Shrink by **one** when the rule breaks. You never need to decrease `maxFreq` — think about why.',
  ],
  approach: `**Brute force:** for every substring, compute its most frequent letter and check \`len - maxFreq <= k\` → O(n²·26) or O(n²) with incremental counts.

**Optimized (longest valid window):**
1. Add \`s[right]\`; \`maxFreq = max(maxFreq, count[s[right]])\`.
2. If \`(right - left + 1) - maxFreq > k\`: remove \`s[left]\`, \`left++\` (one step is enough — see below).
3. \`best = max(best, right - left + 1)\`.

**Why a stale \`maxFreq\` is safe:** we only care about windows *longer* than the best found so far. A window of length L beats the current best only if some letter appears \`≥ L - k\` times in it — which requires a count larger than any \`maxFreq\` we have recorded. So if \`maxFreq\` has not grown, the window can at most keep its size (it slides), and the answer is never overstated. The window size therefore never shrinks, and \`best\` is simply the final window size.`,

  functionName: 'characterReplacement',
  paramNames: ['s', 'k'],
  starterCode: `/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
function characterReplacement(s, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Replace both A\'s (or both B\'s): the whole string becomes one letter.', args: ['ABAB', 2], expected: 4 },
    { scenario: 'Example 2', hint: 'One change: turn the A at index 3 into B to get "BBBB" (length 4).', args: ['AABABBA', 1], expected: 4 },
    { scenario: 'Single character', hint: 'The smallest input: length 1.', args: ['A', 0], expected: 1 },
    { scenario: 'k = 0', hint: 'No changes allowed: the answer is the longest existing run of one letter.', args: ['AABBBCC', 0], expected: 3 },
    { scenario: 'k covers whole string', hint: 'k = n lets you change everything — the answer is n, never more.', args: ['ABCDE', 5], expected: 5 },
    { scenario: 'k is not the window size', hint: 'k = 1 does not mean windows of length 1: "AAAB" → "AAAA" has length 4.', args: ['AAABCC', 1], expected: 4 },
    { scenario: 'All same letter', hint: 'Nothing to replace: the whole string counts.', args: ['ZZZZZZ', 2], expected: 6 },
    { scenario: 'Uppercase char codes', hint: 'Letters are uppercase: index counts with `charCodeAt(i) - 65`, not - 97 (which gives negative indices).', args: ['XYZZYX', 2], expected: 4 },
    { scenario: 'Best window in the middle', hint: 'The best window does not touch either end: slide and shrink correctly.', args: ['ABCCCDCCEF', 1], expected: 6 },
    { scenario: 'Many distinct letters', hint: 'Many letters, few changes: the window length is (most frequent count) + k at best.', args: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 3], expected: 4 },
    { scenario: 'Large input (n = 10^5)', hint: 'Checking every substring is O(n²). A sliding window with a 26-slot count array is O(n).', argsGen: '() => { let s = 41; let r = \'\'; for (let i = 0; i < 100000; i++) { s = (s * 48271) % 2147483647; r += \'ABCD\'[s % 4]; } return [r, 500]; }', expected: 719, timeLimitMs: 1000 },
    { scenario: 'Large, one letter', hint: '10^5 copies of one letter with k = 0: the window never shrinks, answer n.', argsGen: '() => [\'Q\'.repeat(100000), 0]', expected: 100000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let left = 0, maxFreq = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s.charCodeAt(right) - 65; // 'A' = 65
    count[c]++;
    maxFreq = Math.max(maxFreq, count[c]);
    // letters to replace = window length - majority count
    if (right - left + 1 - maxFreq > k) {
      count[s.charCodeAt(left) - 65]--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    explanation: 'An `if` is enough here (not `while`) because the window grew by exactly one; removing one element restores the length that was valid before. This is the "non-shrinking window" trick.',
  },
  dryRun: {
    columns: ['right', 'char', 'counts', 'maxFreq', 'len - maxFreq', 'left', 'best'],
    rows: [
      ['0', 'A', 'A1', '1', '0', '0', '1'],
      ['1', 'A', 'A2', '2', '0', '0', '2'],
      ['2', 'B', 'A2 B1', '2', '1', '0', '3'],
      ['3', 'A', 'A3 B1', '3', '1', '0', '4'],
      ['4', 'B', 'A3 B2', '3', '2 > 1 → drop A', '1', '4'],
      ['5', 'B', 'A2 B3', '3', '2 > 1 → drop A', '2', '4'],
      ['6', 'A', 'A2 B3', '3', '2 > 1 → drop B', '3', '4'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass; a 26-slot count array.' },
  alternative: {
    title: 'Exact maxFreq with while',
    md: 'Use `while (len - max(count) > k)` and recompute `max(count)` over the 26 slots. O(26·n), easier to trust if the stale-maxFreq argument feels shaky — say so in an interview and then offer the optimisation.',
    complexity: 'O(26·n) time, O(1) space',
  },
  mistakes: [
    'Thinking k is the window size.',
    'Believing `maxFreq` must be decreased when the window shrinks — it does not, because the answer only improves when maxFreq grows.',
    'Using `s.charCodeAt(i) - 97` for uppercase letters (it is 65 for "A").',
  ],
};
