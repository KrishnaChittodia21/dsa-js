export default {
  id: 'find-the-shortest-superstring',
  title: 'Find the Shortest Superstring',
  difficulty: 'Hard',
  order: 7,
  pattern: 'dp-adv-bitmask',
  tags: ['string', 'bitmask', 'dynamic programming', 'travelling salesman'],
  source: { platform: 'LeetCode', number: 943, url: 'https://leetcode.com/problems/find-the-shortest-superstring/' },

  statement: `Given an array of distinct strings \`words\`, return the **shortest** string that contains every word as a substring. If several shortest strings exist, return any of them.

No word is a substring of another word.`,
  examples: [
    { input: 'words = ["alex","loves","leetcode"]', output: '"alexlovesleetcode"', explanation: 'Any order of the three words (no overlaps) has length 17.' },
    { input: 'words = ["catg","ctaagt","gcta","ttca","atgcatc"]', output: '"gctaagttcatgcatc"', explanation: 'Length 16.' },
  ],
  constraints: ['1 <= words.length <= 12', '1 <= words[i].length <= 20', 'words[i] are lowercase and distinct', 'No word is a substring of another'],

  think: `- If the order of the words were fixed, how would you build the shortest string? What does each consecutive pair contribute?
- 12! ≈ 479 million orders. What does the cost of appending the next word actually depend on?
- Which state lets you forget the exact order of the words already placed?`,
  patternChallenge: {
    options: ['Greedy: repeatedly merge the pair with the largest overlap', 'Bitmask DP dp[mask][last] (travelling-salesman style)', 'Trie of all words', 'Sort words and concatenate'],
    answer: 1,
    explanation: 'Appending word j after word i costs len(j) − overlap(i, j), which depends only on the previous word — the TSP structure. dp over (set used, last word) is 2^12 · 12 states. Greedy max-overlap merging is a good approximation but not always optimal.',
  },
  hints: [
    'Precompute overlap[i][j] = longest suffix of words[i] that is a prefix of words[j].',
    'dp[mask][last] = shortest length covering mask ending with last; dp[1<<i][i] = len(words[i]). Keep parent pointers, then rebuild the string backwards from the best final word.',
  ],
  approach: `**Brute force:** try all n! orders, merging consecutive words with maximal overlap → 12! ≈ 4.8·10^8 orders × n. Too slow.

**Bitmask DP:**
1. \`overlap[i][j]\` for all pairs (O(n² · L²)).
2. \`dp[mask][last]\`: minimum length of a superstring of the words in \`mask\` that ends with \`words[last]\`.
3. Transition: \`dp[mask | 1<<j][j] = min(dp[mask][last] + len(j) − overlap[last][j])\`, recording \`parent\`.
4. Pick \`last\` minimising \`dp[FULL][last]\`, walk parents back to get the order, and build the string: first word in full, then each next word minus its overlap with the previous.

Many optimal strings may exist, so the tests use a checker: every word must be a substring and the length must equal the optimum.`,

  functionName: 'shortestSuperstring',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {string}
 */
function shortestSuperstring(words) {
  
}
`,
  checker: `(output, args, expected) => {
  const words = args[0];
  if (typeof output !== 'string') return false;
  if (output.length !== expected.length) return false;   // must be optimal
  return words.every((w) => output.includes(w));
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: no word overlaps another, so any order has length 17.', args: [["alex","loves","leetcode"]], expected: "alexlovesleetcode" },
    { scenario: 'Example 2', hint: 'The statement example: the best order chains overlaps to reach length 16.', args: [["catg","ctaagt","gcta","ttca","atgcatc"]], expected: "gctaagttcatgcatc" },
    { scenario: 'Single word', hint: 'With one word the answer is the word itself.', args: [["a"]], expected: "a" },
    { scenario: 'Two words overlapping', hint: '"ab" + "ba" overlap by one letter in either order — length 3.', args: [["ba","ab"]], expected: "bab" },
    { scenario: 'Chain of overlaps', hint: 'Each word overlaps the next by one letter: "abcd".', args: [["ab","bc","cd"]], expected: "abcd" },
    { scenario: 'Order differs from input', hint: 'The best order is not the input order — try every last word / every subset.', args: [["cde","xab","bcd","abc"]], expected: "xabcde" },
    { scenario: 'Greedy merge fails', hint: 'Merging the pair with the largest overlap first gives length 10; the optimum is 8. Greedy is not optimal — use DP over subsets.', args: [["cabab","baba","ababc"]], expected: "cabababc" },
    { scenario: 'Repeated letters', hint: 'Overlaps of length 2 between "aaa", "aab", "abb".', args: [["aaa","aab","abb"]], expected: "aaabb" },
    { scenario: 'Long overlaps', hint: 'Overlaps up to 6 letters; compute each overlap as the longest proper suffix/prefix match.', args: [["cedcagdeec","cagdeecf","eecfcd","fcdb"]], expected: "cedcagdeecfcdb" },
    { scenario: 'No overlaps (n = 6)', hint: 'Nothing overlaps; the answer is all words concatenated in any order.', args: [["ab","cd","ef","gh","ij","kl"]], expected: "abcdefghijkl" },
    { scenario: 'Max length words', hint: 'Two 20-letter words overlapping by 19 letters.', args: [["abcdefghijklmnopqrst","bcdefghijklmnopqrstu"]], expected: "abcdefghijklmnopqrstu" },
    { scenario: 'Chopped string (n = 12)', hint: '12 windows of one string overlapping by 5 letters: the answer is the original 41-letter string. 12! orders are far too many to try.', args: [["qwertyui","rtyuiopa","uiopasdf","pasdfghj","dfghjklz","hjklzxcv","lzxcvbnm","cvbnmqaz","nmqazwsx","azwsxedc","sxedcrfv","dcrfvtgb"]], expected: "qwertyuiopasdfghjklzxcvbnmqazwsxedcrfvtgb" },
    { scenario: 'Random overlaps (n = 12)', hint: '12 words with overlaps of 1–7 letters in shuffled order. Trying all 12! ≈ 4.8·10^8 orders is far too slow; DP over (subset, last word) is 2^12 · 12² steps.', args: [["ccbacabacabcc","bccabcaabaaaacbbaaa","bbcacbcbbacabc","bcaccbbaccbbb","aababbacbccccc","bacabccbccbaaca","ccbaacabbbbbbcac","cbcccccbbbbb","cbbbcbbbccccc","cabcaacacaac","caaaaabaaccc","bbcccccbccabc"]], expected: "caaaaabaacccbacabacabccbccbaacabbbbbbcaccbbaccbbbcbbbcccccbccabcaabaaaacbbaaababbacbcccccbbbbbcacbcbbacabcaacacaac", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shortestSuperstring(words) {
  const n = words.length;

  // overlap[i][j] = longest suffix of words[i] that is a prefix of words[j]
  const overlap = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const a = words[i], b = words[j];
      for (let k = Math.min(a.length, b.length) - 1; k > 0; k--) {
        if (a.endsWith(b.slice(0, k))) { overlap[i][j] = k; break; }
      }
    }
  }

  const N = 1 << n;
  const dp = Array.from({ length: N }, () => new Array(n).fill(Infinity));
  const parent = Array.from({ length: N }, () => new Array(n).fill(-1));
  for (let i = 0; i < n; i++) dp[1 << i][i] = words[i].length;

  for (let mask = 1; mask < N; mask++) {
    for (let last = 0; last < n; last++) {
      if ((mask & (1 << last)) === 0 || dp[mask][last] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        if ((mask & (1 << j)) !== 0) continue;
        const next = mask | (1 << j);
        const cand = dp[mask][last] + words[j].length - overlap[last][j];
        if (cand < dp[next][j]) { dp[next][j] = cand; parent[next][j] = last; }
      }
    }
  }

  // best final word
  const FULL = N - 1;
  let last = 0;
  for (let i = 1; i < n; i++) if (dp[FULL][i] < dp[FULL][last]) last = i;

  // walk parents back to recover the order
  const order = [];
  let mask = FULL;
  while (last !== -1) {
    order.push(last);
    const prev = parent[mask][last];
    mask ^= 1 << last;
    last = prev;
  }
  order.reverse();

  let result = words[order[0]];
  for (let t = 1; t < order.length; t++) {
    result += words[order[t]].slice(overlap[order[t - 1]][order[t]]);
  }
  return result;
}`,
    explanation: 'Overlaps are capped at min(len) − 1 because no word is contained in another. The reconstruction removes `last` from the mask before following its parent.',
  },
  dryRun: {
    columns: ['step', 'detail'],
    rows: [
      ['overlaps', 'ab→bc: 1, bc→cd: 1, others 0'],
      ['dp[{ab}][ab]', '2'],
      ['dp[{ab,bc}][bc]', '2 + 2 − 1 = 3 (parent ab)'],
      ['dp[{ab,bc,cd}][cd]', '3 + 2 − 1 = 4 (parent bc)'],
      ['rebuild', 'order ab, bc, cd → "ab" + "c" + "d" = "abcd"'],
    ],
  },
  complexity: { time: 'O(2^n · n² + n² · L²)', space: 'O(2^n · n)', explanation: '4096 · 12 · 12 ≈ 590k transitions for n = 12, plus the pairwise overlap computation.' },
  alternative: {
    title: 'Greedy maximum-overlap merging (approximation)',
    md: 'Repeatedly merge the two strings with the largest overlap until one remains. Simple and usually close, but **not always optimal**, so it would fail the length check on some inputs. It is known to be within a small constant factor of optimal.',
    complexity: 'O(n³ · L²) time',
  },
  mistakes: [
    'Forgetting parent pointers and being unable to rebuild the string.',
    'Precedence bug in `mask & (1 << j)` checks.',
    'Computing overlap as a full containment (k = min length) — words are never substrings of each other, but k must stay < length to keep the transition meaningful.',
    'Trying all 12! permutations.',
  ],
};
