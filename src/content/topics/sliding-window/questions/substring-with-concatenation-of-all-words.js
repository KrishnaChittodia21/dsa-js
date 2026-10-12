export default {
  id: 'substring-with-concatenation-of-all-words',
  title: 'Substring with Concatenation of All Words',
  difficulty: 'Hard',
  order: 3,
  pattern: 'fixed-window',
  tags: ['string', 'hash map', 'sliding window'],
  source: { platform: 'LeetCode', number: 30, url: 'https://leetcode.com/problems/substring-with-concatenation-of-all-words/' },

  statement: `You are given a string \`s\` and an array \`words\` in which **every word has the same length**.

A *concatenated string* is any string formed by joining **all** the words of \`words\` in some order, each word used exactly as many times as it appears in \`words\`.

Return the starting indices of all substrings of \`s\` that are concatenated strings. Return the indices in **increasing order**.`,
  examples: [
    { input: 's = "barfoothefoobarman", words = ["foo","bar"]', output: '[0,9]', explanation: '"barfoo" at 0 and "foobar" at 9.' },
    { input: 's = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]', output: '[]', explanation: '"word" must appear twice.' },
    { input: 's = "barfoofoobarthefoobarman", words = ["bar","foo","the"]', output: '[6,9,12]' },
  ],
  constraints: ['1 <= s.length <= 10^4', '1 <= words.length <= 5000', '1 <= words[i].length <= 30', 's and words[i] consist of lowercase English letters'],

  think: `- Every word has length \`L\`. If a match starts at index \`i\`, where do its word boundaries lie?
- Split the starting positions into \`L\` groups by \`i % L\`. Inside one group, stepping from one start to the next adds one word on the right and removes one on the left. What does that look like?
- The "letters" of this window are whole words. Which structure counts them?`,
  patternChallenge: {
    options: ['Trie of words + backtracking', 'Sliding Window over word-sized steps (one window per offset 0..L−1)', 'Sorting + Two Pointers', 'Dynamic Programming on prefixes'],
    answer: 1,
    explanation: 'The match has fixed length `L · words.length` and is cut into word-sized chunks, so it is a fixed window whose "elements" are words. Running one window per offset `0..L−1` covers every start while each step adds/removes a single word in O(L).',
  },
  hints: [
    'Count the words you need in a Map `need`. Let `L = words[0].length` and `m = words.length`.',
    'For each offset `o` in `0 .. L-1`, slide a window over the words `s.slice(j, j+L)` for `j = o, o+L, …`. Keep a Map `seen` and a counter `used`. If a word is not in `need`, reset the window past it. If a word appears too often, drop words from the left until it does not. When `used === m`, record `left`.',
  ],
  approach: `**Brute force:** for each start \`i\`, cut \`m\` words from \`s\` and compare their counts with \`need\` → O(n · m · L).

**Optimized (word-level window):** starts \`i\` and \`i + L\` share \`m − 1\` words, so slide instead of recomputing. Do it separately for each offset \`o = 0 … L−1\` (that covers every possible start exactly once):
1. \`left = o\`, \`seen = new Map()\`, \`used = 0\`.
2. For \`j = o; j + L <= n; j += L\`: \`w = s.slice(j, j + L)\`.
   - If \`w\` is not needed at all: clear \`seen\`, \`used = 0\`, \`left = j + L\` (no window can contain it).
   - Else add \`w\`; while \`seen[w] > need[w]\`, remove the word at \`left\` and \`left += L\`.
   - If \`used === m\`, push \`left\`, then remove the word at \`left\` and advance (look for the next match).
3. Sort the collected indices (they come grouped by offset).

Each word position enters and leaves one window once → O(n) word operations, each O(L) for slicing/hashing.`,

  functionName: 'findSubstring',
  paramNames: ['s', 'words'],
  starterCode: `/**
 * @param {string} s
 * @param {string[]} words
 * @return {number[]}
 */
function findSubstring(s, words) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "barfoo" at 0 and "foobar" at 9.', args: ['barfoothefoobarman', ['foo', 'bar']], expected: [0, 9] },
    { scenario: 'Example 2', hint: '"word" appears twice in words, so a window needs it twice. A Set of words is not enough — count them.', args: ['wordgoodgoodgoodbestword', ['word', 'good', 'best', 'word']], expected: [] },
    { scenario: 'Example 3', hint: 'Overlapping matches at 6, 9 and 12 all count.', args: ['barfoofoobarthefoobarman', ['bar', 'foo', 'the']], expected: [6, 9, 12] },
    { scenario: 'Single word', hint: 'One word: every occurrence of it is a match.', args: ['abcabc', ['abc']], expected: [0, 3] },
    { scenario: 'Window longer than s', hint: 'All words together are longer than s: return [].', args: ['ab', ['ab', 'cd']], expected: [] },
    { scenario: 'Smallest strings', hint: 's and the only word are one letter each.', args: ['a', ['a']], expected: [0] },
    { scenario: 'Offsets not multiple of L', hint: 'The match starts at index 1. Walking word boundaries only from offset 0 misses it — try every offset 0..L-1.', args: ['xfoobar', ['foo', 'bar']], expected: [1] },
    { scenario: 'Repeated words', hint: 'words = ["a", "a"]: every window of two a\'s matches, including overlapping ones.', args: ['aaaa', ['a', 'a']], expected: [0, 1, 2] },
    { scenario: 'Results in increasing order', hint: 'Matches found from different offsets come out of order — sort the result.', args: ['abababab', ['ab', 'ba']], expected: [] },
    { scenario: 'Too many of one word', hint: 'A window with three "foo"s holds one too many; drop words from the left until counts fit.', args: ['foofoofoobar', ['foo', 'bar']], expected: [6] },
    { scenario: 'No match', hint: 'Words never line up next to each other: [].', args: ['foobazbar', ['foo', 'bar']], expected: [] },
    { scenario: 'Large input (s = 10^4)', hint: '5 000 one-letter words and an almost-matching s: checking every start word by word is O(n·m·L). Slide a word window per offset.', argsGen: '() => [\'a\'.repeat(10000), [...new Array(4999).fill(\'a\'), \'b\']]', expected: [], timeLimitMs: 150 },
  ],

  solution: {
    code: `function findSubstring(s, words) {
  const L = words[0].length, m = words.length, n = s.length;
  const need = new Map();
  for (const w of words) need.set(w, (need.get(w) ?? 0) + 1);
  const result = [];

  for (let offset = 0; offset < L; offset++) {
    const seen = new Map();
    let left = offset, used = 0;
    for (let j = offset; j + L <= n; j += L) {
      const w = s.slice(j, j + L);
      if (!need.has(w)) {            // impossible word → restart after it
        seen.clear();
        used = 0;
        left = j + L;
        continue;
      }
      seen.set(w, (seen.get(w) ?? 0) + 1);
      used++;
      while (seen.get(w) > need.get(w)) { // too many copies of w → shrink
        const out = s.slice(left, left + L);
        seen.set(out, seen.get(out) - 1);
        used--;
        left += L;
      }
      if (used === m) {              // window holds exactly the multiset
        result.push(left);
        const out = s.slice(left, left + L);
        seen.set(out, seen.get(out) - 1);
        used--;
        left += L;
      }
    }
  }
  return result.sort((a, b) => a - b);
}`,
    explanation: 'The window length is fixed in *words* (m of them), but we repair it like a variable window: an over-used word forces shrinking from the left, and an unknown word resets everything. When `used === m` and no word is over-used, the counts must equal `need` exactly.',
  },
  dryRun: `\`s = "barfoothefoobarman"\`, words = ["foo","bar"], L = 3.

Offset 0 words: bar | foo | the | foo | bar | man
- "bar" → used 1; "foo" → used 2 = m → **push 0**, drop "bar" (left = 3)
- "the" → unknown → reset, left = 9
- "foo" → used 1; "bar" → used 2 → **push 9**, drop "foo"
- "man" → unknown → reset

Offsets 1 and 2 never see a needed word. Result **[0, 9]**.`,
  complexity: { time: 'O(n · L)', space: 'O(m · L)', explanation: 'For each of the L offsets we walk n / L word positions, each entering and leaving once; slicing/hashing a word costs O(L). The Maps hold at most m distinct words.' },
  alternative: {
    title: 'Check every start',
    md: 'For every start `i` from 0 to `n − m·L`, slice m words and count them against `need`, breaking early on a mismatch. O(n · m · L) — simple and usually accepted, a good first answer before optimising.',
    complexity: 'O(n · m · L) time, O(m) space',
  },
  mistakes: [
    'Sliding the window one character at a time — word boundaries only line up for starts with the same offset modulo L.',
    'Forgetting that words may repeat, so a Set is not enough; use counts.',
    'Returning indices unsorted — the offsets produce them out of order.',
  ],
};
