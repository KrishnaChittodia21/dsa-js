export default {
  id: 'alien-dictionary',
  title: 'Alien Dictionary',
  difficulty: 'Hard',
  order: 1,
  pattern: 'topo-kahn-indegree',
  tags: ['graph', 'topological sort', 'string'],
  source: { platform: 'LeetCode', number: 269, url: 'https://leetcode.com/problems/alien-dictionary/', premium: true },

  statement: `An alien language uses lowercase English letters, but in an **unknown order**. You receive \`words\`, a list of words from the alien dictionary that is claimed to be **sorted** by the alien alphabet (the usual dictionary rule: compare the first differing letter; if one word is a prefix of the other, the shorter word comes first).

Return a string of **all distinct letters that appear in \`words\`**, ordered consistently with the alien alphabet. If several orders are possible, return any of them. If the given list cannot be sorted under any alphabet, return \`""\`.

*Your answer is checked by verifying that it uses each letter exactly once and that \`words\` is sorted under your order.*`,
  examples: [
    { input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"', explanation: 't<f (wrt/wrf), w<e (wrf/er), r<t (er/ett), e<r (ett/rftt).' },
    { input: 'words = ["z","x"]', output: '"zx"' },
    { input: 'words = ["z","x","z"]', output: '""', explanation: 'z<x and x<z is a cycle.' },
    { input: 'words = ["abc","ab"]', output: '""', explanation: 'A longer word cannot come before its own prefix.' },
  ],
  constraints: ['1 <= words.length <= 100', '1 <= words[i].length <= 100', 'words[i] consists of lowercase English letters'],

  think: `- Comparing two **adjacent** words, what exactly do you learn? Only one fact — which one?
- Do you need to compare non-adjacent words too?
- Which situation is invalid even without any cycle?
- Letters that never appear in a comparison still have to be in the output. Where do they go?`,
  patternChallenge: {
    options: ["Build letter-order edges from adjacent words, then Kahn's algorithm", 'Sort the letters by their first appearance', 'Trie + DFS', 'Union-Find on letters'],
    answer: 0,
    explanation: 'Each adjacent pair yields at most one constraint "c1 before c2" = a directed edge. An alphabet consistent with all constraints is a topological order of the letters, and a cycle means no alphabet exists. First-appearance order ignores the constraints entirely.',
  },
  hints: [
    'For each adjacent pair (w1, w2), find the first index where they differ: edge w1[j] → w2[j]. If there is no difference and w1 is longer than w2, return "" immediately.',
    'Register every letter from every word as a vertex (in-degree 0 by default). Run Kahn; if fewer letters are output than exist, there is a cycle → "".',
  ],
  approach: `**What a pair tells you:** for adjacent words \`w1\`, \`w2\`, the first differing position j gives exactly one rule: \`w1[j]\` comes before \`w2[j]\`. Letters after j tell you nothing. Non-adjacent pairs add nothing new, because sortedness is transitive.

**The prefix trap:** if \`w2\` is a proper prefix of \`w1\` (e.g. "abc" then "ab"), the list is unsorted under every alphabet → return "".

**Algorithm:**
1. Add every letter of every word as a vertex.
2. For each adjacent pair, add the edge (deduplicated with a Set so in-degrees stay consistent), or detect the prefix case.
3. Kahn over the letters. If all letters are output, join them; otherwise there is a cycle → "".

O(C) where C is the total number of characters (the alphabet has at most 26 letters, so the graph part is O(1)).`,

  functionName: 'alienOrder',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {string}
 */
function alienOrder(words) {
  
}
`,
  checker: `(output, args, expected, h) => {
  const words = args[0];
  if (typeof output !== 'string') return false;
  if (expected === '') return output === '';
  const letters = new Set(words.join(''));
  if (output.length !== letters.size) return false;
  const rank = new Map();
  for (let i = 0; i < output.length; i++) {
    if (!letters.has(output[i]) || rank.has(output[i])) return false;
    rank.set(output[i], i);
  }
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) return rank.get(a[i]) - rank.get(b[i]);
    }
    return a.length - b.length;
  };
  for (let i = 0; i + 1 < words.length; i++) if (cmp(words[i], words[i + 1]) > 0) return false;
  return true;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Each adjacent pair gives one rule: t<f, w<e, r<t, e<r — chain them into w,e,r,t,f.', args: [['wrt', 'wrf', 'er', 'ett', 'rftt']], expected: 'wertf' },
    { scenario: 'Example 2', hint: 'Two one-letter words give a single rule z<x.', args: [['z', 'x']], expected: 'zx' },
    { scenario: 'Example 3', hint: 'z<x and x<z is a cycle — no alphabet works, return "".', args: [['z', 'x', 'z']], expected: '' },
    { scenario: 'Example 4', hint: 'A word followed by its own proper prefix is impossible in any alphabet — return "".', args: [['abc', 'ab']], expected: '' },
    { scenario: 'Identical words', hint: 'Equal words give no rule; the answer still contains every letter once.', args: [['z', 'z']], expected: 'z' },
    { scenario: 'Single word', hint: 'One word: no comparisons, but all its distinct letters must be output.', args: [['a']], expected: 'a' },
    { scenario: 'Letters with no rule', hint: 'Only b<d is known; a and c appear but are never compared — they still belong in the output.', args: [['ab', 'adc']], expected: 'abdc' },
    { scenario: 'Only first difference counts', hint: '"ab" before "ba" only says a<b. Comparing letters after the first difference would add b<a and report a false cycle.', args: [['ab', 'ba']], expected: 'ab' },
    { scenario: 'Prefix before longer word', hint: '"ab" before "abc" is fine (shorter prefix first) and gives no rule.', args: [['ab', 'abc', 'abd', 'b']], expected: 'abcd' },
    { scenario: 'Contradiction deep in list', hint: 'Adjacent pairs give a<b, b<c, a<c and then c<b — b<c and c<b contradict, so return "".', args: [['a', 'b', 'ca', 'cc', 'cb']], expected: '' },
    { scenario: 'Same rule twice', hint: 'The rule a<b appears twice. Counting it twice in in-degree but storing it once in a Set leaves b stuck forever.', args: [['ax', 'bx', 'cax', 'cbx']], expected: 'axbc' },
    { scenario: 'Repeated letters in words', hint: 'Duplicate letters inside a word must appear only once in the answer.', args: [['aaa', 'aab', 'bbb']], expected: 'ab' },
    { scenario: 'Max size sorted list', hint: '100 words of up to 100 letters, sorted by a scrambled alphabet: return any order consistent with the derived rules.', argsGen: '() => { const ord = \'qwertyuiopasdfghjklzxcvbnm\'; const rk = {}; for (let i = 0; i < 26; i++) rk[ord[i]] = i; let s = 41; const r = () => (s = (s * 48271) % 2147483647); const w = []; for (let i = 0; i < 100; i++) { let x = \'\'; const len = 1 + (r() % 100); for (let j = 0; j < len; j++) x += ord[r() % 26]; w.push(x); } w.sort((a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return rk[a[i]] - rk[b[i]]; return a.length - b.length; });  return [w]; }', expected: 'qwertyuiopasdfghjklzxcvbnm' },
    { scenario: 'Max size with prefix violation', hint: 'A long sorted list where one word is followed by its own prefix: must return "" even though no letter cycle exists.', argsGen: '() => { const ord = \'qwertyuiopasdfghjklzxcvbnm\'; const rk = {}; for (let i = 0; i < 26; i++) rk[ord[i]] = i; let s = 41; const r = () => (s = (s * 48271) % 2147483647); const w = []; for (let i = 0; i < 100; i++) { let x = \'\'; const len = 1 + (r() % 100); for (let j = 0; j < len; j++) x += ord[r() % 26]; w.push(x); } w.sort((a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return rk[a[i]] - rk[b[i]]; return a.length - b.length; }); w.splice(50, 0, w[49] + "q"); w.splice(51, 0, w[49]); w.length = 100; return [w]; }', expected: '' },
  ],

  solution: {
    code: `function alienOrder(words) {
  const adj = new Map();                   // letter → Set of letters that come after it
  const indeg = new Map();
  for (const w of words) {
    for (const ch of w) {
      if (!adj.has(ch)) { adj.set(ch, new Set()); indeg.set(ch, 0); }
    }
  }

  for (let i = 0; i + 1 < words.length; i++) {
    const w1 = words[i], w2 = words[i + 1];
    const len = Math.min(w1.length, w2.length);
    let j = 0;
    while (j < len && w1[j] === w2[j]) j++;
    if (j === len) {
      if (w1.length > w2.length) return '';   // "abc" before "ab" is impossible
      continue;                               // prefix in the right order: no info
    }
    const a = w1[j], b = w2[j];
    if (!adj.get(a).has(b)) {                 // dedupe so indeg matches adj
      adj.get(a).add(b);
      indeg.set(b, indeg.get(b) + 1);
    }
  }

  const order = [];
  for (const [ch, d] of indeg) if (d === 0) order.push(ch);
  for (let head = 0; head < order.length; head++) {
    for (const next of adj.get(order[head])) {
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) order.push(next);
    }
  }
  return order.length === adj.size ? order.join('') : '';   // shorter → cycle
}`,
    explanation: 'Deduplicating edges keeps in-degrees consistent: two pairs that both say t<f must count as one edge (or be added and decremented twice consistently).',
  },
  dryRun: { columns: ['pair', 'first difference', 'edge'], rows: [['wrt / wrf', 't vs f', 't → f'], ['wrf / er', 'w vs e', 'w → e'], ['er / ett', 'r vs t', 'r → t'], ['ett / rftt', 'e vs r', 'e → r'], ['Kahn', 'indeg: w0 e1 r1 t1 f1', 'w, e, r, t, f → "wertf"']] },
  complexity: { time: 'O(C)', space: 'O(1) (≤ 26 letters, ≤ 26² edges)', explanation: 'C = total characters across words; each adjacent comparison is bounded by the shorter word.' },
  alternative: {
    title: 'DFS post-order with 3 colours',
    md: 'Build the same edges, then 3-colour DFS over letters; gray hit → "". Reverse the post-order to get the alphabet.',
    complexity: 'O(C) time, O(1) extra space for the graph',
  },
  mistakes: [
    'Comparing letters beyond the first difference (they carry no ordering information).',
    'Missing the prefix case ["abc", "ab"] → "".',
    'Forgetting letters that appear in no comparison — they still belong in the output.',
    'Adding duplicate edges to in-degree but storing them once in a Set (in-degree never reaches 0).',
  ],
};
