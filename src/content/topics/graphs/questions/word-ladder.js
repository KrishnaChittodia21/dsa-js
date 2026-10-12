export default {
  id: 'word-ladder',
  title: 'Word Ladder',
  difficulty: 'Hard',
  order: 1,
  pattern: 'bidirectional-bfs',
  tags: ['bfs', 'bidirectional bfs', 'string', 'implicit graph'],
  source: { platform: 'LeetCode', number: 127, url: 'https://leetcode.com/problems/word-ladder/' },

  statement: `A **transformation sequence** from \`beginWord\` to \`endWord\` is a list of words where each consecutive pair differs in **exactly one letter**, and every word after \`beginWord\` is in \`wordList\` (\`beginWord\` itself need not be).

Return the **number of words** in the shortest such sequence (including both \`beginWord\` and \`endWord\`), or \`0\` if none exists.`,
  examples: [
    { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: 'hit → hot → dot → dog → cog.' },
    { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0', explanation: '"cog" is not in the list.' },
  ],
  constraints: ['1 <= beginWord.length <= 10', 'endWord.length == beginWord.length', '1 <= wordList.length <= 5000', 'All words are lowercase and unique in wordList', 'beginWord != endWord'],

  think: `- What are the vertices? When are two vertices connected?
- Comparing every pair of words costs O(N² · L). How else can you find all words one letter away?
- Both ends are known. Can you search from both sides?`,
  patternChallenge: {
    options: ['Backtracking over all sequences', 'Dynamic Programming on string edits', 'Trie + DFS', 'BFS on an implicit word graph (bidirectional)'],
    answer: 3,
    explanation: 'Words are vertices, one-letter differences are unweighted edges, and we want the fewest steps → BFS. Both endpoints are known and each word has up to 26·L neighbours, so bidirectional BFS shrinks the explored space dramatically. Backtracking would enumerate exponentially many sequences.',
  },
  hints: [
    'Put wordList in a Set. Neighbours of a word: change each position to each of the 26 letters and keep candidates that are in the Set.',
    'Keep a frontier from each end. Always expand the smaller one. When a generated neighbour is in the other frontier, you are done: steps so far + 1 words… count carefully.',
  ],
  approach: `**Model:** vertices = words; edges = pairs differing in one letter. The answer is (shortest path in edges) + 1.

**Plain BFS:** from \`beginWord\`, generate neighbours by trying 26 letters in each of L positions (O(26·L) candidates, each O(L) to build and hash). O(N · 26 · L²) total.

**Bidirectional BFS:** frontiers \`front = {beginWord}\`, \`back = {endWord}\`, \`length = 1\`. Each round, expand the smaller frontier; \`length++\`. If a neighbour is in the other frontier, return \`length\` (the two halves joined). Words are removed from the dictionary set when discovered, which doubles as the visited mark. Same worst case, but in practice it explores about the square root of the states.`,

  functionName: 'ladderLength',
  paramNames: ['beginWord', 'endWord', 'wordList'],
  starterCode: `/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @return {number}
 */
function ladderLength(beginWord, endWord, wordList) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'hit → hot → dot → dog → cog: 5 words.', args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']], expected: 5 },
    { scenario: 'Example 2', hint: '"cog" is not in the list, so no sequence exists: 0.', args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']], expected: 0 },
    { scenario: 'One-letter words', hint: 'a → c directly: 2 words.', args: ['a', 'c', ['a', 'b', 'c']], expected: 2 },
    { scenario: 'Direct neighbour', hint: 'begin and end differ in one letter: answer 2 (words, not edges).', args: ['hot', 'dot', ['dot']], expected: 2 },
    { scenario: 'No path despite endWord', hint: 'endWord is in the list but unreachable: 0.', args: ['hot', 'dog', ['hot', 'dog']], expected: 0 },
    { scenario: 'End word missing', hint: 'Check that endWord is in the list first; the other half of a bidirectional search starting from it would otherwise invent a path.', args: ['hot', 'hog', ['hot', 'dot', 'dog']], expected: 0 },
    { scenario: 'Begin word in the list', hint: 'beginWord may appear in wordList; it must not be counted twice.', args: ['lost', 'cost', ['most', 'fist', 'lost', 'cost', 'fish']], expected: 2 },
    { scenario: 'Count words, not steps', hint: 'Three transformations mean 4 words in the sequence.', args: ['red', 'tax', ['ted', 'tex', 'red', 'tax', 'tad', 'den', 'rex', 'pee']], expected: 4 },
    { scenario: 'Isolated end word', hint: 'No word in the list is one letter away from "tail" along any route: 0.', args: ['talk', 'tail', ['talk', 'tons', 'fall', 'tail', 'gale', 'hall', 'negs']], expected: 0 },
    { scenario: 'Detour required', hint: 'cat → cot → dot → dog: a dead end via "bat" does not help.', args: ['cat', 'dog', ['bat', 'cot', 'cog', 'dog', 'dot']], expected: 4 },
    { scenario: 'Large chain (5000 words)', hint: 'Comparing all pairs of words is O(N²·L); generating the 26·L one-letter variants of each word is O(N·26·L²).', argsGen: '() => { const toW = (k) => { const dg = []; for (let i = 0; i < 10; i++) { dg.push(k % 26); k = Math.floor(k / 26); } let rev = false; const out = new Array(10); for (let i = 9; i >= 0; i--) { const v = rev ? 25 - dg[i] : dg[i]; out[i] = String.fromCharCode(97 + v); if (dg[i] % 2 === 1) rev = !rev; } return out.join(\'\'); }; const list = Array.from({ length: 5000 }, (_, k) => toW(k)); return [list[0], list[4999], list.slice(1)]; }', expected: 4, timeLimitMs: 1000 },
    { scenario: 'Large dense dictionary (5000 words)', hint: '5000 random 8-letter words over a–c: every word has many neighbours. Mark words visited as soon as they are discovered.', argsGen: '() => { let x = 4242; const r = () => (x = (x * 48271) % 2147483647); const set = new Set(); while (set.size < 5000) { let w = \'\'; for (let i = 0; i < 8; i++) w += \'abc\'[r() % 3]; set.add(w); } const list = [...set]; return [list[1], list[0], list]; }', expected: 8, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function ladderLength(beginWord, endWord, wordList) {
  const dict = new Set(wordList);
  if (!dict.has(endWord)) return 0;
  dict.delete(beginWord);
  dict.delete(endWord);                   // words left in dict = not yet visited

  let front = new Set([beginWord]);
  let back = new Set([endWord]);
  let length = 1;                         // words in the sequence so far

  while (front.size && back.size) {
    if (front.size > back.size) [front, back] = [back, front];   // expand the smaller side
    length++;
    const next = new Set();
    for (const word of front) {
      const chars = word.split('');
      for (let i = 0; i < chars.length; i++) {
        const orig = chars[i];
        for (let code = 97; code <= 122; code++) {
          chars[i] = String.fromCharCode(code);
          const cand = chars.join('');
          if (back.has(cand)) return length;    // the two searches meet
          if (dict.has(cand)) { dict.delete(cand); next.add(cand); }
        }
        chars[i] = orig;
      }
    }
    front = next;
  }
  return 0;
}`,
    explanation: 'Deleting a word from `dict` when it is discovered is the visited mark for both directions at once.',
  },
  dryRun: { columns: ['round', 'expand', 'length', 'new frontier'], rows: [['1', '{hit}', '2', '{hot}'], ['2', '{hot} (vs {cog})', '3', '{dot, lot}'], ['3', '{cog} (smaller)', '4', '{dog, log}'], ['4', '{dog, log}', '5', 'dog → dot is in the other frontier → return 5']] },
  complexity: { time: 'O(N · 26 · L²)', space: 'O(N · L)', explanation: 'Each word is expanded at most once: 26·L candidates, each O(L) to build/hash. Bidirectional search usually explores far fewer words.' },
  alternative: {
    title: 'One-directional BFS with pattern buckets',
    md: 'Precompute a Map from patterns like "h*t" to the words that match. Neighbours of a word are all words in its L buckets. Standard BFS from beginWord.',
    complexity: 'O(N · L²) time, O(N · L²) space',
  },
  mistakes: [
    'Returning the number of transformations (edges) instead of words.',
    'Not checking whether endWord is in the list at all.',
    'Comparing all pairs of words to build edges (O(N²·L)).',
    'Only checking against visited instead of against the OTHER frontier in bidirectional BFS.',
  ],
};
