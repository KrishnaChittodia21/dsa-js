export default {
  id: 'custom-sort-string',
  title: 'Custom Sort String',
  difficulty: 'Medium',
  order: 2,
  pattern: 'sorting-custom-comparator',
  tags: ['string', 'hash map', 'sorting', 'counting'],
  source: { platform: 'LeetCode', number: 791, url: 'https://leetcode.com/problems/custom-sort-string/' },

  statement: `The string \`order\` lists some **distinct** lowercase letters in a custom alphabetical order.

Permute the characters of the string \`s\` so that they respect that order: if letter \`x\` appears before letter \`y\` in \`order\`, then every \`x\` must appear before every \`y\` in the result. Letters of \`s\` that do not appear in \`order\` may be placed **anywhere**.

Return any permutation of \`s\` that satisfies this.`,
  examples: [
    { input: 'order = "cba", s = "abcd"', output: '"cbad"', explanation: '"dcba", "cdba", "cbda" are also valid — d can go anywhere.' },
    { input: 'order = "bcafg", s = "abcd"', output: '"bcad"' },
  ],
  constraints: ['1 <= order.length <= 26', '1 <= s.length <= 200', 'order and s consist of lowercase letters', 'All characters of order are unique'],

  think: `- How do you turn "position in \`order\`" into a number a comparator can use?
- Letters are lowercase only — can you avoid a comparison sort entirely?
- Where should letters missing from \`order\` go?`,
  patternChallenge: {
    options: ['Custom comparator / rank-based ordering', 'Sliding Window', 'Two Pointers', 'Stack'],
    answer: 0,
    explanation: 'The order is defined by a rank table (index in `order`). Sorting by rank with a comparator is the direct translation; counting letters and emitting them in `order` is the linear-time version of the same idea.',
  },
  hints: [
    'Build rank[c] = index of c in order (and something large, e.g. 26, for letters not in order). Sort the characters by rank.',
    'Linear version: count letters of s; for each c in order emit c count[c] times; then emit whatever remains.',
  ],
  approach: `**Comparator:** \`rank\` from \`order\`, then \`[...s].sort((a, b) => rank(a) - rank(b)).join('')\`. O(n log n).

**Counting (optimal):**
1. \`count[c]\` for every character of s (26 slots).
2. For each c in order: append c \`count[c]\` times and zero it.
3. Append every remaining character (any order is valid).
O(|s| + 26).`,

  functionName: 'customSortString',
  paramNames: ['order', 's'],
  starterCode: `/**
 * @param {string} order
 * @param {string} s
 * @return {string}
 */
function customSortString(order, s) {
  
}
`,
  checker: `(out, args) => {
    const [order, s] = args;
    if (typeof out !== 'string' || out.length !== s.length) return false;
    if ([...out].sort().join('') !== [...s].sort().join('')) return false;
    const rank = new Map([...order].map((c, i) => [c, i]));
    let last = -1;
    for (const c of out) {
      if (!rank.has(c)) continue;
      if (rank.get(c) < last) return false;
      last = rank.get(c);
    }
    return true;
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: c, b, a in that order; d can go anywhere.', args: ["cba","abcd"], expected: "cbad" },
    { scenario: 'Example 2', hint: 'From the statement: only the letters that appear in s are emitted.', args: ["bcafg","abcd"], expected: "bcad" },
    { scenario: 'Single character', hint: 'The smallest input: one letter in order, one in s.', args: ["a","a"], expected: "a" },
    { scenario: 'No characters in order', hint: 'Dropping characters that are not in order: none of s appears in order, but every character must still be returned.', args: ["xyz","abc"], expected: "abc" },
    { scenario: 'Extra characters kept', hint: 'Letters not in order (x, y, z) must still appear in the output, anywhere.', args: ["ba","abxyzab"], expected: "bbaaxyz" },
    { scenario: 'Repeated characters', hint: 'Emitting only one copy of repeated characters: e appears twice and both copies must be output.', args: ["kqep","pekeq"], expected: "kqeep" },
    { scenario: 'Order reverses s', hint: 'Every letter is ranked; all copies of z come before all y, then all x.', args: ["zyx","xxyyzz"], expected: "zzyyxx" },
    { scenario: 'Order longer than s', hint: 'Letters of order that are missing from s are simply skipped.', args: ["abcdefg","ga"], expected: "ag" },
    { scenario: 'One repeated letter', hint: 'All characters are the same — the output equals the input.', args: ["abc","bbbb"], expected: "bbbb" },
    { scenario: 'Full alphabet order', hint: 'A comparator must return a number (rank(a) − rank(b)), not a boolean like rank(a) < rank(b).', args: ["zyxwvutsrqponmlkjihgfedcba","thequickbrownfoxjumpsoverthelazydog"], expected: "zyxwvuuttsrrqpoooonmlkjihhgfeeedcba" },
    { scenario: 'Long string (200 chars)', hint: 'The maximum length with letters both inside and outside order.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); let s2 = \'\'; for (let i = 0; i < 200; i++) s2 += String.fromCharCode(97 + (r() % 26)); return [\'hucwqmz\', s2]; }', expected: "hhhhhhhuuuuuuuuuuuuccccccccccccccccwwwwwwqqqqqqmmmmmmmzzzzzzaaaaaaaaaaaaaabbbbbdddddddddddeeeeeefffffffgggggggggggiiiiiijjjjjjjjjjkkkkkkklllllllnnnnnoooooppppprrrrsssssssttttvvvvvvvxxxxxxxxxxxyyyyyyyy" },
  ],

  solution: {
    code: `function customSortString(order, s) {
  const count = new Array(26).fill(0);
  for (const c of s) count[c.charCodeAt(0) - 97]++;

  let out = '';
  for (const c of order) {                 // letters in the custom order
    const k = c.charCodeAt(0) - 97;
    out += c.repeat(count[k]);
    count[k] = 0;
  }
  for (let k = 0; k < 26; k++) {           // everything else, anywhere
    out += String.fromCharCode(97 + k).repeat(count[k]);
  }
  return out;
}`,
    explanation: 'Counting sort keyed by the custom rank. Letters missing from order are appended at the end, which is one of the valid placements.',
  },
  dryRun: {
    columns: ['step', 'out'],
    rows: [
      ['count s="abcd": a1 b1 c1 d1', '""'],
      ['order c', '"c"'],
      ['order b', '"cb"'],
      ['order a', '"cba"'],
      ['leftover d', '"cbad"'],
    ],
  },
  complexity: { time: 'O(|s| + |order| + 26)', space: 'O(26)', explanation: 'One counting pass and one emission pass; the count array has a fixed 26 slots.' },
  alternative: {
    title: 'Rank comparator',
    md: 'Shorter to write; O(n log n).',
    code: `function customSortString(order, s) {
  const rank = (c) => { const i = order.indexOf(c); return i === -1 ? 26 : i; };
  return [...s].sort((a, b) => rank(a) - rank(b)).join('');
}`,
    complexity: 'O(n log n · 26) time as written (indexOf is O(26)); precompute ranks in an array for O(n log n)',
  },
  mistakes: [
    'Dropping characters that are not in order.',
    'Returning `rank(a) < rank(b)` (a boolean) from the comparator.',
    'Emitting only one copy of repeated characters.',
  ],
};
