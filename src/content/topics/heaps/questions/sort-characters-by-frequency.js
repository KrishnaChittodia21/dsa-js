export default {
  id: 'sort-characters-by-frequency',
  title: 'Sort Characters By Frequency',
  difficulty: 'Medium',
  order: 4,
  pattern: 'heap-top-k',
  tags: ['heap', 'hash map', 'string', 'bucket sort'],
  source: { platform: 'LeetCode', number: 451, url: 'https://leetcode.com/problems/sort-characters-by-frequency/' },

  statement: `Given a string \`s\`, rearrange its characters so that they appear in **decreasing order of frequency** (all copies of a character together). Characters are case-sensitive (\`'A'\` and \`'a'\` differ).

If several answers exist (ties in frequency), return any of them.`,
  examples: [
    { input: 's = "tree"', output: '"eert"', explanation: '"eetr" is also valid.' },
    { input: 's = "cccaaa"', output: '"cccaaa"', explanation: '"aaaccc" is also valid, but "cacaca" is not (copies must be together).' },
    { input: 's = "Aabb"', output: '"bbAa"', explanation: '"bbaA" is also valid.' },
  ],
  constraints: ['1 <= s.length <= 5 * 10^5', 's consists of English letters and digits'],

  think: `- Count first. Then you need characters ordered by count, highest first. Which heap?
- How do you build the output string efficiently in JavaScript?`,
  patternChallenge: {
    options: ['Sliding Window', 'Heap — ordering by frequency (Top K with k = all)', 'Two Pointers', 'Heap — Two Heaps'],
    answer: 1,
    explanation: 'Count, then extract characters from a max-heap keyed by count (or bucket-sort by count). No window or pointers help with reordering by frequency.',
  },
  hints: [
    'Map char → count; push [char, count] entries into a max-heap keyed by count.',
    'Pop entries and append `char.repeat(count)` to an array; join at the end.',
  ],
  approach: `**Sort:** count, then sort the distinct characters by count descending → O(n + d log d), d ≤ 62.

**Heap:** the same with a max-heap — pop in decreasing count order. Because d ≤ 62, the heap part is tiny; the O(n) counting and output building dominate.

**Bucket sort:** \`buckets[c]\` = characters with count c; walk c from n down.`,

  functionName: 'frequencySort',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function frequencySort(s) {
  
}
`,
  checker: `(output, args) => {
  const s = args[0];
  if (typeof output !== 'string' || output.length !== s.length) return false;
  const cnt = new Map();
  for (const c of s) cnt.set(c, (cnt.get(c) ?? 0) + 1);
  const seen = new Set();
  let i = 0, prevRun = Infinity;
  while (i < output.length) {
    const c = output[i];
    let j = i;
    while (j < output.length && output[j] === c) j++;
    const run = j - i;
    // each char appears as ONE block with its full count, blocks in non-increasing size
    if (seen.has(c) || cnt.get(c) !== run || run > prevRun) return false;
    seen.add(c);
    prevRun = run;
    i = j;
  }
  return seen.size === cnt.size;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'e appears twice so it goes first; r and t can come in either order.', args: ['tree'], expected: 'eert' },
    { scenario: 'Example 2', hint: 'Equal counts: "cccaaa" and "aaaccc" are both fine, but never interleave ("cacaca").', args: ['cccaaa'], expected: 'cccaaa' },
    { scenario: 'Example 3', hint: 'Uppercase and lowercase are different characters: "A" and "a" each appear once.', args: ['Aabb'], expected: 'bbAa' },
    { scenario: 'Single character', hint: 'Length 1: return it as-is.', args: ['a'], expected: 'a' },
    { scenario: 'All the same character', hint: 'One block containing the whole string.', args: ['zzzzzz'], expected: 'zzzzzz' },
    { scenario: 'All distinct characters', hint: 'Every count is 1 — any order is accepted.', args: ['abcXYZ123'], expected: '123XYZabc' },
    { scenario: 'Digits and letters', hint: 'Digits are characters too and are counted the same way.', args: ['2a554442'], expected: '4442255a' },
    { scenario: 'Case sensitivity', hint: 'Treating "B" and "b" as the same merges blocks that must stay separate.', args: ['bBbBbaA'], expected: 'bbbBBAa' },
    { scenario: 'Equal counts not interleaved', hint: 'Each character must form one contiguous block, even when counts tie.', args: ['abcabcabcz'], expected: 'aaabbbcccz' },
    { scenario: 'Mixed counts', hint: 'Several different counts: blocks in non-increasing order of size.', args: ['loveleetcode'], expected: 'eeeelloocdtv' },
    { scenario: 'Large input (n = 5·10^5)', hint: '5·10^5 characters over 62 symbols: count once, then output blocks; avoid quadratic string building.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const a = \'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\'; return [Array.from({ length: 500000 }, (_, i) => a[(r() % 62) * (i % 3 === 0 ? 0 : 1)]).join(\'\')]; }', expectedGen: "() => { const [s] = (() => { let s = 12345; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; return [Array.from({ length: 500000 }, (_, i) => a[(r() % 62) * (i % 3 === 0 ? 0 : 1)]).join('')]; })(); const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1)).map((ch) => ch.repeat(c[ch])).join(''); }" },
  ],

  solution: {
    code: `function frequencySort(s) {
  const count = new Map();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);

  const heap = new MaxHeap((e) => e[1]);   // [char, count], most frequent first
  for (const entry of count) heap.push(entry);

  const parts = [];
  while (!heap.isEmpty()) {
    const [c, n] = heap.pop();
    parts.push(c.repeat(n));
  }
  return parts.join('');                   // one join instead of repeated +=
}`,
  },
  dryRun: {
    columns: ['pop', 'append'],
    rows: [['[e, 2]', '"ee"'], ['[t, 1] or [r, 1]', '"t"'], ['the other', '"r"'], ['result', '"eetr" or "eert"']],
  },
  complexity: { time: 'O(n + d log d)', space: 'O(n)', explanation: 'Counting and output are O(n); d ≤ 62 distinct characters pass through the heap. The output string is O(n).' },
  alternative: {
    title: 'Sort entries',
    code: `function frequencySort(s) {
  const count = new Map();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1]).map(([c, n]) => c.repeat(n)).join('');
}`,
    md: 'Equivalent and short; d is tiny so sorting is effectively O(1).',
    complexity: 'O(n + d log d)',
  },
  mistakes: [
    'Interleaving characters with equal counts ("tere") — each character must form one block.',
    'Treating uppercase and lowercase as the same.',
    'Building the result with += inside nested loops (fine in modern engines, but join is clearer and predictable).',
  ],
};
