export default {
  id: 'string-matching-in-an-array',
  title: 'String Matching in an Array',
  difficulty: 'Easy',
  order: 3,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'string matching', 'kmp'],
  source: { platform: 'LeetCode', number: 1408, url: 'https://leetcode.com/problems/string-matching-in-an-array/' },

  statement: `You are given an array of **distinct** strings \`words\`. Return every word that is a **substring of some other word** in the array. The order of the output does not matter.`,
  examples: [
    { input: 'words = ["mass","as","hero","superhero"]', output: '["as","hero"]', explanation: '"as" is inside "mass", "hero" is inside "superhero".' },
    { input: 'words = ["leetcode","et","code"]', output: '["et","code"]' },
    { input: 'words = ["blue","green","bu"]', output: '[]' },
  ],
  constraints: ['1 <= words.length <= 100', '1 <= words[i].length <= 30', 'All words are distinct lowercase strings'],

  think: `- For a word w, which other words could possibly contain it? (Think about lengths.)
- The core check is "is w a substring of v?" — which algorithm does that in O(|v| + |w|)?
- Should a word that appears inside several others be reported once or several times?`,
  patternChallenge: {
    options: ['KMP Prefix Function (substring checks)', 'Trie of prefixes only', 'Union-Find', 'Dynamic Programming'],
    answer: 0,
    explanation: 'The task is a series of "is w inside v" pattern searches. Building w\'s lps once and running KMP over each longer word gives a linear-time check per pair. A prefix trie only finds words that start another word, not ones in the middle.',
  },
  hints: [
    'Only a strictly longer word can contain w (words are distinct).',
    'For each w, build its lps once, then KMP-search it inside each longer word; stop at the first hit so w is reported once.',
  ],
  approach: `**Straightforward:** for each pair (w, v) with w ≠ v, check \`v.includes(w)\`. With 100 words of length ≤ 30 this is tiny.

**With KMP (what the topic practises):** for each word w, build lps(w) once; for every longer word v, run the KMP scan. Each check is O(|v| + |w|), so total O(W² · L) with W words of length ≤ L. Report w as soon as one container is found.`,

  functionName: 'stringMatching',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {string[]}
 */
function stringMatching(words) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "as" ⊂ "mass", "hero" ⊂ "superhero".', args: [["mass","as","hero","superhero"]], expected: ["as","hero"] },
    { scenario: 'Example 2', hint: 'Both "et" and "code" are inside "leetcode".', args: [["leetcode","et","code"]], expected: ["et","code"] },
    { scenario: 'Example 3', hint: '"bu" is not contiguous in "blue" — nothing matches.', args: [["blue","green","bu"]], expected: [] },
    { scenario: 'Single word', hint: 'Comparing a word with itself makes every word "contained". One word → [].', args: [["a"]], expected: [] },
    { scenario: 'Nested chain', hint: '"c" ⊂ "bc" ⊂ "abc": both shorter words are reported.', args: [["abc","bc","c"]], expected: ["bc","c"] },
    { scenario: 'Several containers', hint: 'Pushing w once per container produces duplicates: "a" is inside three words but appears once.', args: [["a","ab","ca","bab"]], expected: ["a","ab"] },
    { scenario: 'Not only the next longer', hint: 'Sorting by length and checking only the next word misses "od" ⊂ "leetcoder" and "am" ⊂ "hamlet".', args: [["leetcoder","leetcode","od","hamlet","am"]], expected: ["leetcode","od","am"] },
    { scenario: 'Overlapping occurrences', hint: '"ab" and "ba" both appear inside "aba".', args: [["ab","ba","aba"]], expected: ["ab","ba"] },
    { scenario: 'Prefix and suffix', hint: 'A word can sit at the very start or the very end of another.', args: [["house","ho","use","xhouse"]], expected: ["house","ho","use"] },
    { scenario: 'Same length words', hint: 'Distinct words of equal length can never contain each other.', args: [["abc","bca","cab"]], expected: [] },
    { scenario: 'Max size (100 words)', hint: '100 words up to 30 letters; only the short ones built as slices of long ones are contained.', argsGen: "() => { let s = 13; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const set = new Set(); while (set.size < 80) { let w = ''; for (let i = 0; i < 30; i++) w += 'abcdefghij'[rnd() % 10]; set.add(w); } const longs = [...set]; while (set.size < 100) { const b = longs[rnd() % 80]; const st = rnd() % 20; set.add(b.slice(st, st + 4 + (rnd() % 7))); } return [[...set]]; }", expected: ["didifihab","ifgbeh","jebi","ibcfeh","bgjehcb","idcbgjeb","hibibadah","ifgfcdc","jibidcheh","ibcjahg","bahc","gdahcbih","jgdghehgb","ijcdefghgh","fibibcfihc","ajajcf","didifi","ifgb","bchid","efajed"] },
  ],
  solution: {
    code: `function stringMatching(words) {
  const buildLps = (p) => {
    const lps = new Array(p.length).fill(0);
    for (let i = 1, len = 0; i < p.length; i++) {
      while (len > 0 && p[i] !== p[len]) len = lps[len - 1];
      if (p[i] === p[len]) len++;
      lps[i] = len;
    }
    return lps;
  };
  const occurs = (text, p, lps) => {
    for (let i = 0, j = 0; i < text.length; i++) {
      while (j > 0 && text[i] !== p[j]) j = lps[j - 1];
      if (text[i] === p[j]) j++;
      if (j === p.length) return true;
    }
    return false;
  };

  const res = [];
  for (const w of words) {
    const lps = buildLps(w);
    // only strictly longer words can contain w (all words are distinct)
    if (words.some((v) => v.length > w.length && occurs(v, w, lps))) res.push(w);
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['w', 'longer candidates', 'found in', 'report?'],
    rows: [
      ['"mass"', '"superhero"', '—', 'no'],
      ['"as"', '"mass", "hero", "superhero"', '"mass"', 'yes'],
      ['"hero"', '"superhero"', '"superhero"', 'yes'],
      ['"superhero"', '—', '—', 'no'],
    ],
  },
  complexity: { time: 'O(W² · L)', space: 'O(L)', explanation: 'W words, each of length ≤ L. Each of the O(W²) pair checks is O(L) with KMP; one lps array of size ≤ L at a time.' },
  alternative: {
    title: 'Join all words and count occurrences',
    md: 'Join the words with a separator, e.g. `all = words.join("|")`. A word w is inside another word exactly when it occurs in `all` at least twice (once as itself). Checking `all.indexOf(w) !== all.lastIndexOf(w)` does it with two searches per word.',
    code: `function stringMatching(words) {
  const all = words.join('|');
  return words.filter((w) => all.indexOf(w) !== all.lastIndexOf(w));
}`,
    complexity: 'O(W · total length) with the built-in search',
  },
  mistakes: [
    'Comparing a word with itself — every word "contains" itself.',
    'Pushing w once per container, producing duplicates in the output.',
    'Sorting by length and only checking the next word — w may be inside any longer word.',
  ],
};
