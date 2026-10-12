export default {
  id: 'longest-substring-without-repeating-characters',
  title: 'Longest Substring Without Repeating Characters',
  difficulty: 'Medium',
  order: 1,
  pattern: 'variable-window',
  tags: ['string', 'hash set', 'sliding window'],
  source: { platform: 'LeetCode', number: 3, url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },

  statement: `Given a string \`s\`, find the length of the **longest substring** that contains **no repeated characters**.

A substring is a contiguous block of characters.`,
  examples: [
    { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length 3.' },
    { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b".' },
    { input: 's = "pwwkew"', output: '3', explanation: '"wke". Note "pwke" is a subsequence, not a substring.' },
  ],
  constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces'],

  think: `- Is the answer contiguous? What word tells you so?
- If \`s[i..j]\` has no duplicates, what do you know about \`s[i+1..j]\`?
- When a duplicate appears, which end of the current range has to move?`,
  patternChallenge: {
    options: ['Dynamic Programming', 'Binary Search', 'Sliding Window — Variable Size', 'Sorting + Two Pointers'],
    answer: 2,
    explanation: '"Longest **substring**" + a rule ("no repeats") that can be tracked with a Set and is monotonic (a valid window stays valid when shrunk) → variable-size sliding window.',
  },
  hints: [
    'Keep a window `[left, right]` and a Set of the characters inside it.',
    'When `s[right]` is already in the Set, remove characters from the left until it is not. Then add `s[right]` and update the answer.',
  ],
  approach: `**Brute force:** for every start, extend while characters are unique → O(n²).

**Optimized (variable window):** right explores one character at a time. If the new character is already inside the window, the window is invalid — shrink from the left until the older copy is removed. After repairing, the window is valid and its length \`right - left + 1\` is a candidate.

Each index enters the Set once and leaves at most once → O(n).`,

  functionName: 'lengthOfLongestSubstring',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "abc" repeats, so the longest window is 3.', args: ['abcabcbb'], expected: 3 },
    { scenario: 'Example 2', hint: 'All characters equal: the best window is a single character.', args: ['bbbbb'], expected: 1 },
    { scenario: 'Example 3', hint: '"pwke" is a subsequence, not a substring — windows must be contiguous.', args: ['pwwkew'], expected: 3 },
    { scenario: 'Empty string', hint: 'Length 0 is allowed: return 0.', args: [''], expected: 0 },
    { scenario: 'Single character', hint: 'One character is a window of length 1.', args: ['a'], expected: 1 },
    { scenario: 'Space character', hint: 'A space is a character like any other.', args: [' '], expected: 1 },
    { scenario: 'Left must not jump back', hint: 'In "abba", the last a was seen before left. Setting left = last + 1 without Math.max moves left backwards and gives 3.', args: ['abba'], expected: 2 },
    { scenario: 'All distinct', hint: 'No repeats: the whole string is the answer.', args: ['abcdef'], expected: 6 },
    { scenario: 'Repeat far apart', hint: 'The repeated "d" is far back; shrink only past its previous position.', args: ['dvdf'], expected: 3 },
    { scenario: 'Shrink more than one step', hint: 'When "a" repeats, several characters must leave the window — use `while`, not `if`, in the Set version.', args: ['abcdaefgb'], expected: 7 },
    { scenario: 'Digits and symbols', hint: 'Digits, symbols and spaces are all valid characters.', args: ['a1!a 1?b'], expected: 6 },
    { scenario: 'Mixed case is distinct', hint: '"a" and "A" are different characters.', args: ['aAbBaA'], expected: 4 },
    { scenario: 'Large input (n = 5·10^4)', hint: 'Re-checking every substring is far too slow. One pass with a last-seen Map is O(n).', argsGen: '() => { let s = 43; let r = \'\'; for (let i = 0; i < 50000; i++) { s = (s * 48271) % 2147483647; r += String.fromCharCode(32 + (s % 95)); } return [r]; }', expected: 39, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function lengthOfLongestSubstring(s) {
  const lastSeen = new Map(); // char -> last index where we saw it
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    // Only a copy INSIDE the window (index >= left) makes it invalid.
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    explanation: 'Instead of stepping `left` one by one with a Set, we remember the last index of each character and jump `left` past it. The `>= left` check matters for inputs like "abba": when we reach the final "a", its previous copy (index 0) is already outside the window.',
  },
  dryRun: {
    columns: ['right', 'ch', 'lastSeen[ch]', 'left', 'best'],
    rows: [
      ['0', 'a', '—', '0', '1'],
      ['1', 'b', '—', '0', '2'],
      ['2', 'b', '1 (≥ left)', '2', '2'],
      ['3', 'a', '0 (< left → ignore)', '2', '2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(min(n, σ))', explanation: 'One pass. The map holds at most one entry per distinct character (σ = alphabet size).' },
  alternative: {
    title: 'Set + step-by-step shrinking',
    md: 'Keep a Set; while `s[right]` is in it, delete `s[left]` and increment left. Same complexity, slightly simpler to reason about.',
    code: `function lengthOfLongestSubstring(s) {
  const inWindow = new Set();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    while (inWindow.has(s[right])) inWindow.delete(s[left++]);
    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    complexity: 'O(n) time, O(σ) space',
  },
  mistakes: [
    'Jumping `left` backwards: always use `left = Math.max(left, last + 1)` or check `last >= left` (fails on "abba").',
    'Using `if` instead of `while` in the Set version.',
    'Confusing substring with subsequence ("pwke" is not valid for "pwwkew").',
  ],
};
