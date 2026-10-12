export default {
  id: 'word-search-ii',
  title: 'Word Search II',
  difficulty: 'Hard',
  order: 2,
  pattern: 'trie-backtracking-search',
  tags: ['trie', 'backtracking', 'matrix', 'dfs'],
  source: { platform: 'LeetCode', number: 212, url: 'https://leetcode.com/problems/word-search-ii/' },

  statement: `Given an \`m × n\` grid of letters \`board\` and a list of \`words\`, return **all words** that can be traced on the board.

A word is traced by moving between **horizontally or vertically adjacent** cells; a cell may not be used twice in the same word. Return the words in any order, each at most once.`,
  examples: [
    { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: '["eat","oath"]' },
    { input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', output: '[]', explanation: '"abcb" would need to reuse b.' },
  ],
  constraints: ['1 <= m, n <= 12', '1 <= words.length <= 3 * 10^4', '1 <= words[i].length <= 10', 'lowercase letters, words are unique'],

  think: `- Running Word Search I (single-word backtracking) once per word is up to 3·10⁴ grid searches. What work is shared between words like "oath" and "oat"?
- During one grid DFS, what should the DFS carry so it knows whether the current path can still become *some* word?
- How do you avoid reporting the same word twice, and how can you make later searches faster after a word is found?`,
  patternChallenge: {
    options: ['Backtracking once per word', 'Trie — Trie-guided Search (trie + grid backtracking)', 'Breadth-first search from every cell', 'Dynamic Programming on the grid'],
    answer: 1,
    explanation: 'One backtracking pass guided by a trie of all words explores each grid path once for every word simultaneously and prunes paths that are not a prefix of any word. Per-word backtracking repeats work; BFS cannot enforce "no cell reused" per path; DP does not apply to self-avoiding paths.',
  },
  hints: [
    'Build a trie of words; store the whole word on its end node (`node.word = w`).',
    'DFS from each cell with the current trie node: stop if the cell letter is not a child; record and clear node.word when set; mark the cell visited ("#"), recurse on 4 neighbours, restore the letter. Remove childless, wordless nodes on the way back to prune.',
  ],
  approach: `**Brute force:** for each word run the Word Search I backtracking from every cell → O(W · m · n · 4 · 3^(L−1)).

**Trie + one backtracking pass:**
1. Insert every word into a trie; the end node stores the word itself.
2. For every cell, \`dfs(r, c, parentNode)\`:
   - \`node = parentNode.children.get(board[r][c])\`; if missing → return (no word continues).
   - if \`node.word\` → push it, set \`node.word = null\` (report once).
   - mark \`board[r][c] = '#'\`, recurse into the 4 neighbours with \`node\`, restore the letter.
   - **prune:** if \`node\` now has no children and no word, delete it from \`parentNode\` — future searches will not even enter this dead branch.
3. Return the collected words.

The trie makes the search cost depend on the grid and the shape of the dictionary, not on the number of words times the grid.`,

  functionName: 'findWords',
  paramNames: ['board', 'words'],
  starterCode: `/**
 * @param {character[][]} board
 * @param {string[]} words
 * @return {string[]}
 */
function findWords(board, words) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "oath" and "eat" can be traced; "pea" and "rain" cannot.', args: [[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]],["oath","pea","eat","rain"]], expected: ["oath","eat"] },
    { scenario: 'Example 2', hint: '"abcb" would need to reuse the b cell — mark cells as visited during a path.', args: [[["a","b"],["c","d"]],["abcb"]], expected: [] },
    { scenario: '1×1 board', hint: 'A single cell spelling a one-letter word. Check the word after moving into the cell\'s trie child, not before.', args: [[["a"]],["a","b","aa"]], expected: ["a"] },
    { scenario: 'Cell reuse needed', hint: '"aaa" needs three cells but the board has two.', args: [[["a","a"]],["aaa"]], expected: [] },
    { scenario: 'Many short words', hint: 'Only horizontal/vertical neighbours count — "ad" and "bc" are diagonals.', args: [[["a","b"],["c","d"]],["ab","cb","ad","bd","ac","ca","da","bc","db","adcb","dabc","abb","acb"]], expected: ["ab","bd","ac","ca","db"] },
    { scenario: 'Word is prefix of another', hint: '"oa" and "oaa" share a path: after recording "oa", keep walking deeper for "oaa".', args: [[["o","a","b","n"],["o","t","a","e"],["a","h","k","r"],["a","f","l","v"]],["oa","oaa"]], expected: ["oa","oaa"] },
    { scenario: 'Long snaking words', hint: 'Words that wind through most of the board. Forgetting to restore a cell\'s letter after exploring breaks later starts.', args: [[["a","b","c"],["a","e","d"],["a","f","g"]],["abcdefg","gfedcbaaa","eaabcdgfa","befa","dgc","ade"]], expected: ["abcdefg","gfedcbaaa","eaabcdgfa","befa"] },
    { scenario: 'No word found', hint: 'None of the letters exist on the board — return [].', args: [[["x","y"],["z","w"]],["q"]], expected: [] },
    { scenario: 'Word reachable two ways', hint: 'On an all-"a" board "aa" can be spelled many ways. Reporting a word twice — clear node.word (or use a Set) after recording.', args: [[["a","a"],["a","a"]],["aa","aaaa","aaaaa"]], expected: ["aa","aaaa"] },
    { scenario: 'Single row board', hint: 'A 1 × n board: words can go left or right only.', args: [[["c","a","t","s"]],["cat","tac","sta","cats","act"]], expected: ["cat","tac","sta","cats"] },
    { scenario: 'Single column board', hint: 'An m × 1 board: words go up or down.', args: [[["d"],["o"],["g"]],["dog","god","do","og","dg"]], expected: ["dog","god","do","og"] },
    { scenario: 'Full-board path', hint: 'A 12-letter word that uses every cell of a 3 × 4 board in a snake.', args: [[["a","b","c","d"],["h","g","f","e"],["i","j","k","l"]],["abcdefghijkl","abcdefghijkla","lkjihgfedcba"]], expected: ["abcdefghijkl","lkjihgfedcba"] },
    { scenario: 'Large (12×12, 3·10^4 words)', hint: 'All-"a" board and 30 000 words starting with "aaaaaa": running Word Search I per word re-explores ~10^5 paths each time. One DFS over a shared trie explores them once.', argsGen: "() => { const board = Array.from({ length: 12 }, () => Array(12).fill('a')); 'bcde'.split('').forEach((c, k) => { board[5][6 + k] = c; }); const L = 'bcdefghijklmnopqrstuvwxyz'; const words = Array.from({ length: 29998 }, (_, i) => { let k = (i * 7919) % 390625, s = 'aaaaaa'; for (let d = 0; d < 4; d++) { s += L[k % 25]; k = Math.floor(k / 25); } return s; }); words.push('aaaaaabcde', 'aaaaaaedcb'); return [board, words]; }", expected: ["aaaaaabcde","aaaaaaedcb"], timeLimitMs: 1500 },
  ],

  solution: {
    code: `function findWords(board, words) {
  const root = { children: new Map(), word: null };
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), word: null });
      node = node.children.get(ch);
    }
    node.word = w;
  }

  const rows = board.length, cols = board[0].length;
  const found = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const dfs = (r, c, parent) => {
    const ch = board[r][c];
    const node = parent.children.get(ch);
    if (!node) return;                          // prune: not a prefix of any word
    if (node.word !== null) {
      found.push(node.word);
      node.word = null;                         // report each word once
    }
    board[r][c] = '#';                          // mark visited
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== '#') dfs(nr, nc, node);
    }
    board[r][c] = ch;                           // backtrack
    if (node.children.size === 0 && node.word === null) parent.children.delete(ch); // drop dead leaf
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) dfs(r, c, root);
  }
  return found;
}`,
    explanation: 'The board is restored after every DFS, so the input is unchanged when the function returns.',
  },
  dryRun: {
    columns: ['start', 'path', 'trie node', 'event'],
    rows: [
      ['(0,0) o', 'o', 'o', 'continue'],
      ['', 'o a', 'oa', 'continue (only "oath")'],
      ['', 'o a t', 'oat', 'continue'],
      ['', 'o a t h', 'oath', 'found "oath"; leaf pruned'],
      ['(1,1) t', 't', '—', 'root has no "t" child → stop'],
      ['(1,3) e', 'e a t', 'eat', 'found "eat"'],
    ],
  },
  complexity: { time: 'O(m · n · 4 · 3^(L−1)) worst case', space: 'O(W · L)', explanation: 'Each start explores at most 4 · 3^(L−1) paths of length ≤ L (L ≤ 10), independent of the number of words; pruning and dead-leaf removal cut this down drastically. The trie holds W · L characters at most.' },
  alternative: {
    title: 'Per-word backtracking',
    md: 'Run Word Search I for each word. Simple but repeats the grid exploration for every word — times out for thousands of words.',
    complexity: 'O(W · m · n · 4 · 3^(L−1))',
  },
  mistakes: [
    'Reporting a word twice when two different paths spell it (clear node.word after recording).',
    'Forgetting to restore the cell letter after exploring (later starts see "#").',
    'Checking `node.word` before moving into the child for the current cell (off-by-one between cell and trie node).',
  ],
};
