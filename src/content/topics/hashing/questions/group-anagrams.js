export default {
  id: 'group-anagrams',
  title: 'Group Anagrams',
  difficulty: 'Medium',
  order: 1,
  pattern: 'hash-canonical-key',
  tags: ['string', 'hash map', 'canonical key'],
  source: { platform: 'LeetCode', number: 49, url: 'https://leetcode.com/problems/group-anagrams/' },

  statement: `Given an array of strings \`strs\`, group the words that are **anagrams** of each other (same letters, same counts, any order).

Return the groups in any order; the words inside each group may also be in any order.`,
  examples: [
    { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
    { input: 'strs = [""]', output: '[[""]]' },
    { input: 'strs = ["a"]', output: '[["a"]]' },
  ],
  constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters'],

  think: `- What single value could you compute from a word that is the same for all of its anagrams — and different for everything else?
- Once every word has such a value, how do you collect words that share it?`,
  patternChallenge: {
    options: ['Sorting the whole array', 'Canonical Keys (Grouping by Signature)', 'Two Pointers', 'Trie'],
    answer: 1,
    explanation: '"Group equivalent items" = map each item to a canonical key and bucket by it. Anagrams share their sorted letters (or their letter counts).',
  },
  hints: ['The sorted letters of a word ("eat" → "aet") are identical for all its anagrams.', 'Use a Map from key → array of words; return [...map.values()].'],
  approach: `**Brute force:** compare every pair of words with an anagram check → O(n²·k).

**Sorted key:** \`[...w].sort().join('')\` → O(n · k log k).

**Count key (optimal):** 26 counts joined with '#' → O(n · k). The separator prevents collisions like [1, 11] vs [11, 1]. Group with a Map and return its values.`,

  functionName: 'groupAnagrams',
  paramNames: ['strs'],
  starterCode: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: three groups of different sizes.', args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']] },
    { scenario: 'Example 2', hint: 'The empty string is a valid word and forms its own group.', args: [['']], expected: [['']] },
    { scenario: 'Example 3', hint: 'A single one-letter word.', args: [['a']], expected: [['a']] },
    { scenario: 'Several empty strings', hint: 'All empty strings are anagrams of each other — one group holding every "".', args: [['', '', 'a', '']], expected: [['', '', ''], ['a']] },
    { scenario: 'No anagrams at all', hint: 'Every word is its own group.', args: [['abc', 'abd', 'xyz']], expected: [['abc'], ['abd'], ['xyz']] },
    { scenario: 'All one group', hint: 'All words are permutations of each other: one group.', args: [['abc', 'bca', 'cab', 'acb']], expected: [['abc', 'bca', 'cab', 'acb']] },
    { scenario: 'Duplicate words', hint: 'The same word twice belongs to the same group, and both copies stay in it.', args: [['ab', 'ba', 'ab']], expected: [['ab', 'ba', 'ab']] },
    { scenario: 'Same letters, other counts', hint: '"aab" and "abb" share letters but not counts — different groups.', args: [['aab', 'abb', 'bab', 'aba']], expected: [['aab', 'aba'], ['abb', 'bab']] },
    { scenario: 'Count key needs separator', hint: 'Counts a:1,b:11 and a:11,b:1 both join to "111…" without a separator. Use a delimiter (or a sorted string) as the key.', args: [['abbbbbbbbbbb', 'aaaaaaaaaaab', 'bbbbbbbbbbba']], expected: [['abbbbbbbbbbb', 'bbbbbbbbbbba'], ['aaaaaaaaaaab']] },
    { scenario: 'Different lengths', hint: 'Words of different lengths can never be anagrams.', args: [['a', 'aa', 'aaa', 'a']], expected: [['a', 'a'], ['aa'], ['aaa']] },
    { scenario: 'Long words', hint: 'Words of length 100 (the maximum): building each key must stay linear in the word length.', args: [['abababababababababababababababababababababababababababababababababababababababababababababababababab', 'babababababababababababababababababababababababababababababababababababababababababababababababababa', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']], expected: [['abababababababababababababababababababababababababababababababababababababababababababababababababab', 'babababababababababababababababababababababababababababababababababababababababababababababababababa'], ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']] },
    { scenario: 'Many small groups', hint: '52 one-letter words, each letter twice: exactly 26 groups of two.', argsGen: '() => [Array.from({ length: 52 }, (_, i) => String.fromCharCode(97 + (i % 26)))]', expected: [['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'], ['f', 'f'], ['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'], ['u', 'u'], ['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'], ['z', 'z']] },
  ],

  solution: {
    code: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const count = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
    const key = count.join('#');          // canonical signature
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
  },
  dryRun: {
    columns: ['word', 'key (sorted view)', 'groups'],
    rows: [['eat', 'aet', '{aet:[eat]}'], ['tea', 'aet', '{aet:[eat,tea]}'], ['tan', 'ant', '{…, ant:[tan]}'], ['ate', 'aet', '{aet:[eat,tea,ate], …}'], ['nat', 'ant', '{…, ant:[tan,nat]}'], ['bat', 'abt', '{…, abt:[bat]}']],
  },
  complexity: { time: 'O(n · k)', space: 'O(n · k)', explanation: 'n words of length ≤ k; each key costs O(k + 26) to build and hash; the map stores every word.' },
  alternative: {
    title: 'Sorted-string key',
    md: 'Shorter code, slightly slower per word.',
    code: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = [...s].sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
    complexity: 'O(n · k log k) time, O(n · k) space',
  },
  mistakes: ['Using the count array itself as the Map key (reference equality — every word gets its own group)', 'Joining counts without a separator (ambiguous keys)', 'Forgetting the empty string is a valid word'],
};
