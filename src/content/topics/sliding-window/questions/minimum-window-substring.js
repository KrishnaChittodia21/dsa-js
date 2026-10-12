export default {
  id: 'minimum-window-substring',
  title: 'Minimum Window Substring',
  difficulty: 'Hard',
  order: 1,
  pattern: 'variable-window',
  tags: ['string', 'hash map', 'sliding window'],
  source: { platform: 'LeetCode', number: 76, url: 'https://leetcode.com/problems/minimum-window-substring/' },

  statement: `Given two strings \`s\` and \`t\`, return the **shortest substring of \`s\`** that contains **every character of \`t\`, including duplicates**.

If no such substring exists, return the empty string \`""\`. The answer is guaranteed to be unique.`,
  examples: [
    { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: '"BANC" contains A, B and C and nothing shorter does.' },
    { input: 's = "a", t = "a"', output: '"a"' },
    { input: 's = "a", t = "aa"', output: '""', explanation: 't needs two a\'s but s has only one.' },
  ],
  constraints: ['1 <= s.length, t.length <= 10^5', 's and t consist of uppercase and lowercase English letters'],

  think: `- "Shortest substring" — which template (longest or shortest) applies?
- How can you tell in **O(1)** whether the current window covers all of \`t\`? Comparing two maps every step would be O(σ).
- When is it safe to move \`left\`?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size (shortest valid)', 'Sliding Window — Fixed Size', 'Binary Search on the answer', 'Backtracking'],
    answer: 0,
    explanation: 'The answer is a contiguous substring, we minimise its length, and "covers t" is monotonic: a covering window stays covering when it grows. That is the shortest-valid variable window. It is not fixed-size because the answer length is unknown.',
  },
  hints: [
    'Count what `t` needs in a Map `need`. Keep `missing = t.length` = number of characters still required.',
    'When adding `s[right]` reduces a positive need, decrement `missing`. While `missing === 0` the window is valid: record it, then remove `s[left]` (if that makes a need positive again, `missing++`).',
  ],
  approach: `**Brute force:** check every substring and test whether it covers \`t\` → O(n² · σ) or worse.

**Optimized (shortest valid window):**
1. \`need[c]\` = how many more copies of \`c\` the window needs (can go negative = surplus).
2. \`missing\` = total characters still needed. The window is valid exactly when \`missing === 0\` — an O(1) check.
3. Expand right: \`if (need[c] > 0) missing--; need[c]--\`.
4. While valid: record the window if it is the shortest so far, then remove \`s[left]\`: \`need[c]++; if (need[c] > 0) missing++\`, and \`left++\`.`,

  functionName: 'minWindow',
  paramNames: ['s', 't'],
  starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
function minWindow(s, t) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "BANC" is the shortest window holding A, B and C.', args: ['ADOBECODEBANC', 'ABC'], expected: 'BANC' },
    { scenario: 'Example 2', hint: 's equals t: the whole string is the answer.', args: ['a', 'a'], expected: 'a' },
    { scenario: 'Example 3', hint: 't needs two a\'s but s has only one: return "".', args: ['a', 'aa'], expected: '' },
    { scenario: 't longer than s', hint: 'No window can be long enough: "".', args: ['ab', 'abc'], expected: '' },
    { scenario: 'Duplicates in t', hint: 't = "aa" needs two a\'s. Treating t as a set of letters returns "a".', args: ['baab', 'aa'], expected: 'aa' },
    { scenario: 'Case sensitive', hint: '"a" and "A" are different characters: only the uppercase A counts.', args: ['aAbB', 'AB'], expected: 'AbB' },
    { scenario: 'Answer is the whole s', hint: 'Only the full string contains everything.', args: ['abcde', 'ea'], expected: 'abcde' },
    { scenario: 'Answer at the very start', hint: 'The first window is the best; record it while it is still valid.', args: ['abxxxxab', 'ba'], expected: 'ab' },
    { scenario: 'Record before shrinking', hint: 'Record the window inside the shrink loop. After the loop, the window no longer contains all of t.', args: ['xyzABxyCxy', 'ABC'], expected: 'ABxyC' },
    { scenario: 'Extra copies shrink away', hint: 'Surplus copies of a needed letter at the left edge must be dropped to reach the shortest window.', args: ['aaaaab', 'ab'], expected: 'ab' },
    { scenario: 'Character not in s', hint: 't contains a letter that never appears: "".', args: ['abcdef', 'z'], expected: '' },
    { scenario: 'Large input, answer at end', hint: 'n = 10^5 and the needed letters are at the end. Restarting the scan from every index is O(n²); slide with a `missing` counter instead.', argsGen: '() => [\'a\'.repeat(99996) + \'XaYZ\', \'XYZ\']', expected: 'XaYZ', timeLimitMs: 1000 },
    { scenario: 'Large input, answer in middle', hint: 'Two Q\'s in a long random string; t = "QQ" needs both. Comparing whole count maps at every step is also too slow here.', argsGen: '() => { let s = 67; const a = Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return String.fromCharCode(97 + (s % 26)); }); a[50000] = \'Q\'; a[50003] = \'Q\'; return [a.join(\'\'), \'QQ\']; }', expected: 'QweQ', timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);

  let missing = t.length;         // characters still required
  let left = 0;
  let bestStart = 0, bestLen = Infinity;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if ((need.get(c) ?? 0) > 0) missing--;
    need.set(c, (need.get(c) ?? 0) - 1);

    while (missing === 0) {        // window covers t → try to shrink it
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestStart = left;
      }
      const out = s[left];
      need.set(out, need.get(out) + 1);
      if (need.get(out) > 0) missing++;  // we just removed a required char
      left++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestStart, bestStart + bestLen);
}`,
    explanation: 'Negative values in `need` mean "the window has spare copies". Removing a spare copy keeps the window valid; removing a required one makes `need` positive and `missing` goes back up.',
  },
  dryRun: `For \`s = "ADOBECODEBANC"\`, \`t = "ABC"\`:

| right | char | missing | window valid? | action |
|---|---|---|---|---|
| 5 | C | 0 | yes ("ADOBEC") | record len 6, remove A → missing 1 |
| 10 | A | 0 | yes ("DOBECODEBA"→ shrink) | shrink until "CODEBA" breaks… |
| 12 | C | 0 | yes | shrink to "BANC" → record len 4 |

Only the substring position is stored during the loop; \`slice\` is called once at the end.`,
  complexity: { time: 'O(|s| + |t|)', space: 'O(σ)', explanation: 'Each index of s enters and leaves the window once; the map holds at most one entry per distinct character.' },
  alternative: {
    title: 'Filtered s',
    md: 'Pre-filter s to only the positions whose characters appear in t, then run the same window over that shorter list. Helps when t is small and s is huge, same worst case.',
    complexity: 'O(|s| + |t|) time',
  },
  mistakes: [
    'Checking validity by comparing two maps each step (O(σ) per step) instead of maintaining `missing`.',
    'Recording the answer after the while loop — at that point the window is no longer valid.',
    'Building substrings with `slice` inside the loop; store indices and slice once.',
    'Ignoring duplicates in t (t = "aa" needs two a\'s).',
  ],
};
