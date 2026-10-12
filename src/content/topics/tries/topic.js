export default {
  id: 'tries',
  summary: 'A trie (prefix tree) stores strings character by character along root-to-node paths, so every shared prefix is stored once — giving O(L) insert, lookup and prefix queries no matter how many words you store.',

  jsTools: [
    { api: 'Map (children)', use: 'node.children: char → child node; works for any alphabet', complexity: 'get / set / has: O(1) average' },
    { api: 'new Array(26).fill(null)', use: 'Fixed children array for lowercase letters, indexed by charCodeAt(0) - 97', complexity: 'O(1) index; 26 slots per node' },
    { api: 'Trie (toolkit)', use: 'Reference trie: insert, search, startsWith, countPrefix, wordsWithPrefix', complexity: 'O(L) per operation' },
    { api: 'for (const ch of word)', use: 'Iterate characters (also handles Unicode code points)', complexity: 'O(L)' },
    { api: 'x >> b & 1', use: 'Read bit b of a number for binary tries (maximum XOR)', complexity: 'O(1)' },
    { api: 'Set', use: 'Collect found words without duplicates (word search II)', complexity: 'O(1) average' },
  ],

  patterns: [
    {
      id: 'trie-prefix-tree',
      name: 'Trie — Prefix Tree (insert / search / prefix queries)',
      summary: 'Each node is a prefix; each edge adds one character. Walk the characters of a word from the root: inserting creates missing nodes, searching fails as soon as a child is missing.',
      whyItExists: 'Checking a prefix against n words one by one costs O(n·L). A trie shares common prefixes, so every query walks at most L nodes — independent of how many words are stored. Counters on nodes turn "how many words start with p" into a single walk too.',
      whenToUse: [
        'Many prefix queries against the same word list ("starts with", "count words with prefix")',
        'Autocomplete / search suggestions',
        'Replace words by their shortest root (dictionary prefix)',
        'Build words character by character where every prefix must also be a word',
      ],
      clues: ['"prefix"', '"starts with"', '"autocomplete"', '"dictionary of words"', '"root / successor"', '"implement a trie"'],
      whenNotToUse: [
        'Only exact-match lookups — a Set is simpler and just as fast',
        'Very few queries — sorting + binary search or a direct scan may be simpler',
        'Substring (not prefix) queries — use suffix structures or string algorithms',
      ],
      template: `class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; }
}
function insert(root, word) {
  let node = root;
  for (const ch of word) {
    if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
    node = node.children.get(ch);
  }
  node.isEnd = true;
}
function walk(root, s) {          // node for prefix s, or null
  let node = root;
  for (const ch of s) {
    node = node.children.get(ch);
    if (!node) return null;
  }
  return node;
}`,
      variations: [
        { name: 'Prefix counts', description: 'Increment node.count on every node you pass during insert → countPrefix(p) = walk(p).count.' },
        { name: 'Store the word at the end node', description: 'node.word = word instead of isEnd — handy when you need to output the word (word search II, replace words).' },
        { name: 'Value sums', description: 'Map Sum Pairs: keep a sum of values on each node; update with the delta when a key is re-inserted.' },
      ],
      mistakes: [
        'Forgetting isEnd: "app" is a prefix of "apple" but not a word unless inserted',
        'Creating a node for every character on search (search must not modify the trie)',
        'Using a plain object with keys like "constructor" or "__proto__" — use Map or Object.create(null)',
      ],
      evolution: {
        easy: 'Longest common prefix, count words with a given prefix.',
        medium: 'Implement a trie, replace words, search suggestions, map sum pairs, longest word built one char at a time.',
        hard: 'Combine with other techniques: grid backtracking, palindromes, streams, DP on words.',
      },
    },
    {
      id: 'trie-wildcard-dfs',
      name: 'Trie — DFS over branches (wildcards, word breaks)',
      summary: 'When a query character can match several children ("." wildcard) or a word can end at several places, explore the trie with DFS instead of a single walk.',
      whyItExists: 'A plain walk follows exactly one path. Wildcards and "split this string into dictionary words" need to try every matching child / every word-ending position. The trie prunes all branches whose prefix already fails, which is what makes the search feasible.',
      whenToUse: [
        '"." matches any letter (add and search words)',
        'Is this word a concatenation of other dictionary words? (concatenated words)',
        'Collect every word under a node (autocomplete listing)',
      ],
      clues: ['"." can match any letter', '"concatenation of words"', '"composed of other words in the list"', '"all words with prefix"'],
      whenNotToUse: [
        'No wildcard and no splitting — a single walk suffices',
        'Arbitrary regex (e.g. "*" matching any length) — needs DP over pattern and text',
      ],
      template: `function match(node, word, i) {
  if (i === word.length) return node.isEnd;
  const ch = word[i];
  if (ch === '.') {
    for (const child of node.children.values()) if (match(child, word, i + 1)) return true;
    return false;
  }
  const next = node.children.get(ch);
  return next ? match(next, word, i + 1) : false;
}`,
      variations: [
        { name: 'Word break with a trie', description: 'From position i, walk the trie along s[i..]; every isEnd hit is a candidate split point; memoise positions (DP).' },
        { name: 'Collect words', description: 'DFS the subtree of a prefix node in sorted child order to list suggestions.' },
      ],
      mistakes: [
        'Returning false after the first non-matching child under "." (you must try all children)',
        'No memoisation in word-break style DFS → exponential time on inputs like "aaaa…ab"',
      ],
      evolution: {
        easy: '—',
        medium: 'Design add and search words with "." wildcards.',
        hard: 'Concatenated words (trie + DP), prefix + suffix search.',
      },
    },
    {
      id: 'trie-binary-xor',
      name: 'Trie — Binary Trie for Maximum XOR',
      summary: 'Store numbers as 31/32-bit strings from the highest bit to the lowest. To maximise a XOR b, walk the trie choosing the OPPOSITE bit of a at each level whenever it exists.',
      whyItExists: 'Checking all pairs is O(n²). A higher bit is worth more than all lower bits combined (2^b > 2^(b-1) + … + 1), so greedily winning the highest possible bit is always right. The binary trie answers "is there a number with this prefix of bits?" in O(1) per bit → O(32) per query.',
      whenToUse: [
        'Maximum XOR of two numbers in an array',
        'Maximum XOR of a query value with any array element (optionally with limits — offline + sorting)',
        'Counting pairs with XOR below a limit',
      ],
      clues: ['"maximum XOR"', '"xor of two numbers"', '"bitwise"', '"0 <= nums[i] < 2^31"'],
      whenNotToUse: [
        'Sums or products — XOR-specific greedy does not apply',
        'Very small n — the O(n²) pair loop is simpler',
      ],
      template: `function maxXor(nums) {
  const root = [null, null];                       // node = [child0, child1]
  const insert = (x) => { let n = root; for (let b = 30; b >= 0; b--) { const bit = (x >> b) & 1; n = n[bit] ??= [null, null]; } };
  let best = 0;
  insert(nums[0]);
  for (const x of nums) {
    let n = root, cur = 0;
    for (let b = 30; b >= 0; b--) {
      const want = ((x >> b) & 1) ^ 1;             // the opposite bit
      if (n[want]) { cur |= 1 << b; n = n[want]; } else n = n[want ^ 1];
    }
    best = Math.max(best, cur);
    insert(x);
  }
  return best;
}`,
      variations: [
        { name: 'Queries with limits', description: 'Sort queries by their limit and insert array values in increasing order, answering each query after inserting all values ≤ its limit.' },
        { name: 'Counting pairs under a limit', description: 'Store subtree counts in nodes and walk both the "limit bit" and "query bit" together.' },
      ],
      mistakes: [
        'Walking bits from low to high (the greedy only works from the most significant bit)',
        'Using 1 << 31 in JS — it is negative (-2147483648); for 31-bit inputs loop from bit 30',
        'Querying before inserting anything (empty trie)',
      ],
      evolution: {
        easy: '—',
        medium: 'Maximum XOR of two numbers in an array.',
        hard: 'Maximum XOR with an element from the array under a limit (offline queries).',
      },
    },
    {
      id: 'trie-backtracking-search',
      name: 'Trie — Trie-guided Search (grids, streams, palindromes)',
      summary: 'Build a trie of the dictionary (sometimes of REVERSED words) and let it steer another search: grid backtracking, a stream of characters, or pairing words into palindromes. The trie prunes every path that cannot become a word.',
      whyItExists: 'Searching for each dictionary word separately repeats work for shared prefixes: w words × grid search. A single search guided by the trie explores each grid path once and stops as soon as the path is not a prefix of any word. Reversing words lets a trie answer "does the recent suffix end in a word?" for streams.',
      whenToUse: [
        'Find all dictionary words in a letter grid (word search II)',
        'Answer "do the last few characters form a word?" for a stream (reversed trie)',
        'Pair words whose concatenation is a palindrome (trie of reversed words)',
      ],
      clues: ['"find all words from the dictionary in the board"', '"stream of characters"', '"suffix of the stream is a word"', '"concatenation is a palindrome"'],
      whenNotToUse: [
        'A single target word — plain backtracking is simpler',
        'Words must be matched anywhere as substrings of one long text with huge dictionaries — Aho-Corasick (an advanced string algorithm) is the general tool',
      ],
      template: `function findWords(board, words) {
  const root = buildTrie(words);          // node.word = full word at its end node
  const found = [];
  const dfs = (r, c, parent) => {
    const ch = board[r][c];
    const node = parent.children.get(ch);
    if (!node) return;                    // prune: no word continues this way
    if (node.word) { found.push(node.word); node.word = null; } // record once
    board[r][c] = '#';                    // mark visited
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < board.length && nc < board[0].length && board[nr][nc] !== '#') dfs(nr, nc, node);
    }
    board[r][c] = ch;                     // un-mark (backtrack)
    if (node.children.size === 0 && !node.word) parent.children.delete(ch); // prune dead leaf
  };
  for (let r = 0; r < board.length; r++) for (let c = 0; c < board[0].length; c++) dfs(r, c, root);
  return found;
}`,
      variations: [
        { name: 'Reversed trie for streams', description: 'Insert reversed words; after each new character, walk the trie from the newest character backwards through the history.' },
        { name: 'Palindrome pairs', description: 'Trie of reversed words; while walking a word, check whether the unmatched remainder of either word is a palindrome.' },
      ],
      mistakes: [
        'Running a separate DFS per word (times out)',
        'Adding the same word twice when it appears along two grid paths — null out node.word after recording',
        'Forgetting to un-mark the cell after exploring (backtracking)',
      ],
      evolution: {
        easy: '—',
        medium: 'Word search (single word, plain backtracking — earlier topic).',
        hard: 'Word search II, stream of characters, palindrome pairs.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `A **trie** (pronounced "try", from re*trie*val) is a tree where **each edge is one character** and **each node represents the prefix spelled on the path from the root**.

Insert \`car\`, \`cat\`, \`cart\` and \`dog\`:

\`\`\`text
          (root)
          /    \\
         c      d
         |      |
         a      o
        / \\     |
       r*  t*   g*
       |
       t*
\`\`\`

(\`*\` marks nodes where a complete word ends.) The words \`car\`, \`cat\` and \`cart\` share the path \`c → a\`, so that prefix is stored **once**. To check whether any word starts with \`ca\`, walk \`c\`, then \`a\` — two steps, whether the trie holds 4 words or 4 million.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Trie / prefix tree** — a rooted tree whose edges are labelled with characters; the path root → node spells that node's **prefix**.
- **End-of-word marker** (\`isEnd\`) — a flag on the node where an inserted word finishes. Needed because a word can be a prefix of another (\`car\` / \`cart\`).
- **L** — the length of the word or prefix being processed. Trie operations cost O(L).
- **σ (sigma)** — the alphabet size (26 for lowercase letters, 2 for bits).`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A phone\'s contact search: type "Jo" and the list narrows to John, Joanna, Jose… Each keystroke moves one level down the trie, and everything below your current node is a valid suggestion. A paper dictionary\'s thumb tabs (A, B, C…) are the first level of a trie.',
          },
          {
            type: 'visual',
            scenario: 'trie-insert',
            input: { words: ['car', 'cat', 'cart', 'dog'] },
            caption: 'Watch shared prefixes reuse existing nodes; only the new suffix creates nodes.',
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-1',
            question: 'After inserting only `"cart"` into an empty trie, what should `search("car")` return, and why?',
            options: [
              'true — the path c → a → r exists',
              'false — the path exists, but the node for "car" is not marked as the end of a word',
              'true — every prefix of an inserted word is also a word',
              'It throws, because "car" was never inserted',
            ],
            answer: 1,
            explanation: 'The path exists (it is part of "cart"), so `startsWith("car")` is true, but `search` also requires the end-of-word flag on the last node. That flag is only set for "cart".',
            misconceptions: {
              0: 'Path existence answers startsWith, not search. Without the isEnd check, every prefix of every word would count as a word.',
              2: 'Prefixes are not words. "car" becomes a word only if you insert it.',
              3: 'Search never throws; it walks the path and returns true/false.',
            },
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Suppose you store **n** words and answer **q** "does any word start with p?" queries (|p| = L).

| approach | per query | notes |
|---|---|---|
| scan all words with \`w.startsWith(p)\` | O(n · L) | simple, slow for many queries |
| \`Set\` of words | — | exact match only; cannot answer prefix queries |
| \`Set\` of **all prefixes** | O(L) | but stores O(total characters²) prefix strings |
| sorted array + binary search | O(L log n) | good for static lists; inserts are O(n) |
| **trie** | **O(L)** | inserts O(L), shared prefixes stored once, extra info per prefix (counts, sums, words) |

The real power is that a trie node is a **handle on a prefix**: you can attach data to it (how many words pass through, the best word below it, a running sum) and you can **continue** walking from it — which is what autocomplete, grid searches and streams need.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-2',
            question: 'A trie holds 1,000,000 words. How many nodes does `startsWith("pre")` visit (not counting the root)?',
            options: [
              'Up to 1,000,000 — it checks every word',
              'About log₂(1,000,000) ≈ 20',
              'At most 3 — one per character of the prefix',
              'It depends on how many words start with "pre"',
            ],
            answer: 2,
            explanation: 'The walk follows one edge per character: p, r, e. The number of stored words does not matter.',
            misconceptions: {
              0: 'That is the scan-every-word approach the trie replaces.',
              1: 'log n appears in balanced search trees and binary search. A trie\'s depth is the word length, not a function of n.',
              3: 'Counting or *listing* those words depends on how many there are; merely deciding that one exists takes 3 steps.',
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for a trie when the problem is about **prefixes of many strings**, or when you need to **walk several strings in lockstep** character by character.

| situation | trie flavour |
|---|---|
| prefix queries, counts, autocomplete, replace by root | **prefix tree** walk |
| wildcard \`.\`, split a string into dictionary words | **DFS** over trie branches |
| maximum XOR of numbers | **binary trie** (bits high → low) |
| many dictionary words in a grid / a stream / palindrome pairing | trie **guides another search** |

If you only need exact membership, use a \`Set\`. If there are few queries, a simple scan may be fine — say so in an interview before building a trie.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-3',
            question: 'You must check whether each of 10⁵ usernames is **exactly** in a banned list of 10⁵ names. Is a trie the right tool?',
            options: [
              'Yes — tries are always the fastest string structure',
              'No — a Set gives the same O(L) exact lookup with far less code and memory',
              'No — you must sort both lists and use two pointers',
              'Yes — a Set cannot store strings',
            ],
            answer: 1,
            explanation: 'Exact membership is what hashing does best. A Set hashes the string in O(L) and looks it up in O(1) average. A trie adds value only when prefixes matter.',
            misconceptions: {
              0: 'Tries win on prefix questions. For exact lookups they use much more memory (a node per character) for no gain.',
              2: 'Sort + two pointers works (O(n log n)) but a Set is simpler and O(n) overall.',
              3: 'Sets store any value, including strings, compared by content.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"prefix" / "starts with"', '"autocomplete" / "suggestions"', '"dictionary" of words + many queries', '"." wildcard search', '"maximum XOR"', '"find all words in the grid"', '"stream of characters"', '"concatenation of other words"'],
            conclusion: 'Think Trie',
          },
          {
            type: 'text',
            md: `Checklist:

1. **Many strings + prefix questions?** → prefix tree.
2. **A query character matches many options?** → DFS on the trie.
3. **XOR maximisation over numbers?** → binary trie.
4. **Searching for many words at once (grid, stream)?** → build a trie of the words and let it prune the search.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Think of the trie as **all the words merged at their common beginnings**. Two words share nodes for exactly as long as they share characters, then branch.

- **Insert** = walk as far as the word already exists, then create nodes for the rest. Mark the last node \`isEnd\`.
- **Search** = walk; if a child is missing, the word is absent. At the end, check \`isEnd\`.
- **startsWith** = the same walk without the \`isEnd\` check.

Every node is a *state* of "what I have read so far". That is why tries combine so naturally with other searches: a grid DFS or a stream can carry "my current trie node" as its state and stop the moment that state has no continuation.`,
          },
          {
            type: 'text',
            md: `**Map children vs Array(26) children.**

| | \`Map\` | \`new Array(26)\` |
|---|---|---|
| alphabet | any characters | fixed (e.g. \`a–z\`) |
| memory per node | proportional to actual children | always 26 slots |
| speed | hashing, slightly slower | direct index \`ch.charCodeAt(0) - 97\` |
| iterate children in order | insertion order (sort keys for lexicographic) | index order = alphabetical for free |

Both give O(1) per step. Use arrays when the problem guarantees lowercase letters and you want alphabetical order (autocomplete); use a Map otherwise.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-4',
            question: 'You need suggestions in **lexicographic order** from a trie of lowercase words. With `children` as an `Array(26)`, how do you get alphabetical order during DFS?',
            options: [
              'Iterate indices 0 → 25; index order is alphabetical order',
              'You cannot — tries lose ordering',
              'Sort all suggestions afterwards; DFS order is random',
              'Iterate indices 25 → 0',
            ],
            answer: 0,
            explanation: 'Index i corresponds to letter String.fromCharCode(97 + i), so visiting children by increasing index visits "a" before "b" … — a pre-order DFS then yields words in lexicographic order (a word before its extensions).',
            misconceptions: {
              1: 'Tries preserve ordering naturally; that is why they are used for sorted autocomplete.',
              2: 'Sorting works but is unnecessary. With a Map you would need to sort each node\'s keys, but arrays are already ordered.',
              3: 'That gives reverse alphabetical order.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Example problem: **search suggestions** — after each typed character of `searchWord`, return up to 3 dictionary words (lexicographically smallest) that start with the typed prefix.',
          },
          {
            type: 'compare',
            left: {
              title: 'Filter the whole list per prefix — O(L · n · L)',
              code: `function suggestedProducts(products, searchWord) {
  const sorted = [...products].sort();
  const out = [];
  for (let i = 1; i <= searchWord.length; i++) {
    const p = searchWord.slice(0, i);
    out.push(sorted.filter((w) => w.startsWith(p)).slice(0, 3));
  }
  return out;
}`,
            },
            right: {
              title: 'Trie walk, one node per typed character',
              code: `// build a trie; each node keeps up to 3 smallest words passing through it
// then for each typed character move ONE step deeper:
let node = root;
for (const ch of searchWord) {
  node = node && node.children.get(ch);
  out.push(node ? node.top3 : []);
}`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see **what work** the brute force repeats that the trie remembers?',
            deeper: 'The brute force re-checks the first characters of every word for every prefix: after typing "mou" it rescans all words starting from "m" again. The trie keeps its position — the node for "mo" — and moves just one edge to "mou". This "keep your place and extend by one character" idea is exactly what makes tries good for autocomplete, streams and grid searches.',
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — the prefix tree',
        blocks: [
          {
            type: 'steps',
            title: 'Operations (L = length of the word/prefix)',
            steps: [
              '**insert(word):** `node = root`; for each `ch`: create `node.children[ch]` if missing, move into it (and `node.count++` if you track prefix counts). Finally `node.isEnd = true`. O(L).',
              '**search(word):** walk each `ch`; if a child is missing return false. Return `node.isEnd`. O(L).',
              '**startsWith(prefix):** the same walk; return true if it completes. O(L).',
              '**countPrefix(prefix):** walk; return `node.count` (words passing through). O(L).',
            ],
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-5',
            question: 'You insert "apple", "app", "apt" into a trie that increments `count` on every node it passes (not the root). What is `count` on the node for "ap"?',
            options: [
              '1',
              '2',
              '5',
              '3',
            ],
            answer: 3,
            explanation: 'All three words pass through "a" → "p", so the "ap" node was incremented three times. countPrefix("ap") = 3.',
            misconceptions: {
              0: 'That would be the count of words *ending* at "ap" — which is actually 0. count tracks words *passing through*.',
              1: '"apt" also starts with "ap": a-p-t. All three share the "ap" prefix.',
              2: '5 is the length of "apple"; count is about words, not characters.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Trie with Map children, prefix counts and stored words',
            code: `class TrieNode {
  constructor() {
    this.children = new Map(); // char -> TrieNode
    this.isEnd = false;
    this.count = 0;            // words passing through this node
  }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
      node.count++;
    }
    node.isEnd = true;
  }

  #walk(s) {
    let node = this.root;
    for (const ch of s) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }

  search(word) { const n = this.#walk(word); return n !== null && n.isEnd; }
  startsWith(prefix) { return this.#walk(prefix) !== null; }
  countPrefix(prefix) { const n = this.#walk(prefix); return n ? n.count : 0; }
}`,
            caption: 'The toolkit exposes this as the global Trie (plus wordsWithPrefix(prefix, limit)), so you can use it directly in practice problems.',
          },
          {
            type: 'code',
            title: 'Array(26) variant for lowercase letters',
            code: `class Node26 {
  constructor() { this.next = new Array(26).fill(null); this.isEnd = false; }
}
const idx = (ch) => ch.charCodeAt(0) - 97;   // 'a' -> 0 … 'z' -> 25
function insert26(root, word) {
  let node = root;
  for (const ch of word) node = node.next[idx(ch)] ??= new Node26();
  node.isEnd = true;
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- **Map vs plain object:** \`{}\` has inherited keys — \`node.children["constructor"]\` is a function! Use \`new Map()\` or \`Object.create(null)\`.
- \`for (const ch of word)\` iterates characters; \`word[i]\` is fine for ASCII and lets you use indices.
- \`??=\` (logical nullish assignment) makes "create if missing" a one-liner: \`node = node.next[i] ??= new Node26()\`.
- Deep recursion: a DFS over a trie is at most L deep (word length), so recursion is safe here, unlike on degenerate trees.
- Memory: every character can become an object. 10⁵ words × 10 chars ≈ 10⁶ nodes — fine, but mention it; Array(26) nodes cost more memory than Map nodes when branching is sparse.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-6',
            question: 'A teammate uses plain objects: `node.children = {}` and checks `if (node.children[ch])`. Inserting the word `"constructor"` behaves strangely. Why?',
            options: [
              'Objects cannot have string keys',
              '"constructor" is too long for a trie',
              'Objects inherit properties from Object.prototype, so children["constructor"] already exists (it is the Object function) before anything is inserted',
              'Plain objects sort their keys, which breaks tries',
            ],
            answer: 2,
            explanation: 'Plain objects inherit keys like `constructor`, `toString`, `hasOwnProperty`. The truthy check sees a "child" that is really a function. Use `Map` or `Object.create(null)`.',
            misconceptions: {
              0: 'String keys are what objects are best at — the problem is inherited keys, not string keys.',
              1: 'Length is irrelevant; the issue appears at the first character sequence that matches an inherited property name.',
              3: 'Objects order integer-like keys numerically, but that does not affect lookups. The bug is prototype inheritance.',
            },
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'insert "car", "cat", "cart"; then search("ca"), startsWith("ca"), countPrefix("car")',
            columns: ['operation', 'path walked', 'nodes created', 'result'],
            rows: [
              ['insert car', 'c, a, r', 'c, a, r (3)', 'r.isEnd = true'],
              ['insert cat', 'c, a, t', 't (1)', 't.isEnd = true'],
              ['insert cart', 'c, a, r, t', 't under r (1)', 'rt.isEnd = true'],
              ['search ca', 'c, a', '—', 'a.isEnd = false → false'],
              ['startsWith ca', 'c, a', '—', 'true'],
              ['countPrefix car', 'c, a, r', '—', 'r.count = 2 (car, cart)'],
            ],
            note: 'Five nodes store three words with 10 characters in total — prefixes are shared.',
          },
        ],
      },
      {
        id: 'optimized-wildcard',
        title: 'Optimized approach — DFS over branches (wildcards, concatenated words)',
        blocks: [
          {
            type: 'text',
            md: `**Wildcard search.** In *Design Add and Search Words*, a query like \`"b.d"\` means *b, any letter, d*. At a normal character you follow one child; at \`.\` you must try **every** child, recursively. The search is still fast in practice because branches die as soon as their prefix fails — you never explore letters that no word uses.

Worst case: a query of all dots explores the whole trie (O(total nodes)); a query with d dots and a σ-letter alphabet explores at most O(σ^d · L) paths.

**Concatenated words.** "Is \`catsdog\` made of other words?" From position i, walk the trie along \`s[i..]\`; every time you reach an \`isEnd\` node at position j, you may **split** there and continue from j + 1. Memoise "can the suffix starting at i be split?" (that is dynamic programming — you will see it formally later) to avoid exponential re-exploration.`,
          },
          {
            type: 'code',
            title: 'Wildcard DFS',
            code: `search(word) {
  const dfs = (node, i) => {
    if (i === word.length) return node.isEnd;
    const ch = word[i];
    if (ch === '.') {
      for (const child of node.children.values()) {
        if (dfs(child, i + 1)) return true;   // any branch may match
      }
      return false;
    }
    const next = node.children.get(ch);
    return next !== undefined && dfs(next, i + 1);
  };
  return dfs(this.root, 0);
}`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-7',
            question: 'The trie holds "bad", "dad", "mad". What must the wildcard search do for the query ".ad"?',
            options: [
              'Follow only the first child of the root and fail if it does not match',
              'Return false immediately, because "." is not a letter in the trie',
              'Try the "b", "d" and "m" children of the root, continuing with "a", "d" under each until one reaches an end-of-word node',
              'Scan every inserted word as a string and compare character by character',
            ],
            answer: 2,
            explanation: '"." matches any single letter, so every child of the current node is a candidate. The DFS tries them until one full path matches (here "bad" succeeds immediately).',
            misconceptions: {
              0: 'That only works if the first child happens to lead to a match. With "bat" and "mad" stored, ".ad" would follow "b", fail at "a→d", and wrongly return false even though "mad" matches.',
              1: '"." is a query operator, never stored in the trie.',
              3: 'That ignores the trie and costs O(n · L) per query.',
            },
          },
        ],
      },
      {
        id: 'optimized-xor',
        title: 'Optimized approach — binary trie for maximum XOR',
        blocks: [
          {
            type: 'callout',
            variant: 'definition',
            title: 'Bits in 60 seconds (the Bit Manipulation topic goes deeper later)',
            md: `- Every non-negative integer is a sum of powers of two: \`13 = 8 + 4 + 1 = 1101₂\`. Bit b is the digit for 2^b.
- \`x >> b\` shifts x right by b positions; \`(x >> b) & 1\` reads bit b (0 or 1).
- \`a ^ b\` (**XOR**) sets a bit to 1 exactly where a and b **differ**: \`1101 ^ 1011 = 0110\`.
- \`cur | (1 << b)\` sets bit b of cur to 1.`,
          },
          {
            type: 'text',
            md: `**Goal:** max \`a ^ b\` over all pairs. Brute force is O(n²).

**Key fact:** bit b is worth \`2^b\`, which is **more than all lower bits together** (\`2^b > 2^(b−1) + … + 2 + 1 = 2^b − 1\`). So making the highest bit 1 beats anything the lower bits could do. That justifies a **greedy from the top bit down**.

**Binary trie:** insert every number as a path of 31 bits (bit 30 → bit 0; inputs are < 2³¹). For a number x, walk from the root; at bit b, x has bit \`t\`, and you *want* the opposite bit \`1 − t\` (that makes the XOR bit 1). If that child exists, go there and add \`2^b\` to the result; otherwise take the same-bit child (XOR bit 0). Each query is 31 steps → O(31·n) total.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-8',
            question: 'Why must the maximum-XOR walk go from the **most significant** bit to the least significant?',
            options: [
              'Because the trie can only be built in that order',
              'Because a 1 in a higher bit is worth more than all lower bits combined, so greedily securing high bits first is always optimal',
              'It does not matter; low-to-high gives the same answer',
              'Because JavaScript stores numbers big-endian',
            ],
            answer: 1,
            explanation: '2^b > 2^b − 1 = sum of all lower bits. Any choice that wins bit b beats every choice that loses it, regardless of lower bits. Deciding bits in decreasing significance therefore never needs to be undone.',
            misconceptions: {
              0: 'You could build a trie in either order; the order is chosen *because* of the greedy argument.',
              2: 'Low-to-high greedy can sacrifice a high bit for a low one: e.g. it might pick a partner that makes bit 0 = 1 but bit 5 = 0.',
              3: 'Byte order in memory is irrelevant; `>>` and `&` work on the numeric value.',
            },
          },
        ],
      },
      {
        id: 'optimized-guided-search',
        title: 'Optimized approach — trie-guided search (grid, stream, palindromes)',
        blocks: [
          {
            type: 'text',
            md: `**Word Search II** — find every dictionary word that can be traced in a letter grid. Running the single-word backtracking from the Backtracking topic once per word costs *words × cells × 4^L*. Instead:

1. Build a trie of all words (store the full word at its end node).
2. Start a DFS from every cell, carrying the **current trie node**. Step to a neighbour only if the trie has a child for its letter — otherwise no word continues this way (**prune**).
3. When you reach a node with a word, record it and clear it (so it is not recorded twice).
4. Optional but powerful: after exploring, delete trie leaves that have no word and no children — later searches skip dead branches entirely.

**Stream of characters** — after each new letter, report whether some suffix of the stream is a word. Store words **reversed** in a trie. After appending a letter, walk the trie from the newest letter backwards through the history; stop when a child is missing (no word ends like this) or report true on an end marker. Only the last maxWordLength letters matter.

**Palindrome pairs** — words \`a\`, \`b\` form a palindrome \`a + b\` when, after matching \`a\` against reversed \`b\`, the leftover part (of either word) is itself a palindrome. A trie of reversed words lets you match prefixes of \`a\` against all candidates at once.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-9',
            question: 'In Word Search II, why build ONE trie of all words instead of running the single-word search for each word?',
            options: [
              'Because a trie uses less memory than the word list',
              'Because the grid DFS can then explore each path once for all words at the same time, abandoning a path as soon as it is not a prefix of ANY word',
              'Because a trie sorts the words, which makes the grid search faster',
              'Because single-word search cannot handle grids',
            ],
            answer: 1,
            explanation: 'Words with shared prefixes ("oath", "oat", "oats") would otherwise be searched separately, each re-walking the same grid paths. The trie merges them, and its missing children prune paths that cannot lead to any word.',
            misconceptions: {
              0: 'A trie usually uses MORE memory (an object per character). The win is time.',
              2: 'Ordering is irrelevant here; pruning and shared prefixes are what matter.',
              3: 'Single-word search works on grids (that is Word Search I) — it is just too slow when repeated for thousands of words.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the **stream** problem stores words reversed?',
            deeper: 'After each new character the question is "does the stream END with a word?". Endings are read from the newest character backwards. If words are stored reversed, "ends with word w" becomes "the reversed recent history starts with reversed w" — a prefix walk from the root, which is exactly what a trie is good at. With forward words you would have to start a walk at every earlier position.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Missing \`isEnd\`** — confusing "path exists" (prefix) with "word exists".
2. **Search that creates nodes** — only insert may create children.
3. **Plain objects as children** — inherited keys (\`constructor\`, \`toString\`). Use \`Map\` / \`Object.create(null)\`.
4. **Wildcard DFS that gives up after one child** — \`.\` must try all children.
5. **Bits from low to high** in XOR tries, or \`1 << 31\` (negative in JS).
6. **Duplicate results** in grid search — clear \`node.word\` after recording.
7. **Rebuilding the trie per query** — build it once, query many times.
8. **Forgetting memoisation** when splitting words (concatenated words) → exponential time.`,
          },
          {
            type: 'checkpoint',
            id: 'tries-cp-10',
            question: 'In JavaScript, what is `1 << 31`, and why does it matter for a 32-level binary trie?',
            options: [
              '2147483648 — nothing special',
              '-2147483648 — bitwise operators work on signed 32-bit integers, so bit 31 is the sign bit; for inputs < 2³¹ start the walk at bit 30',
              'Infinity — the shift overflows',
              'It throws a RangeError',
            ],
            answer: 1,
            explanation: 'JS converts operands of `<<`, `>>`, `&`, `|`, `^` to signed 32-bit integers. Setting bit 31 produces a negative number. Most XOR problems have values < 2³¹, so bits 30…0 are enough.',
            misconceptions: {
              0: 'That is 2³¹ mathematically, but JS bitwise results are signed 32-bit.',
              2: 'Bitwise shifts never produce Infinity; they wrap within 32 bits.',
              3: 'No error is thrown; you silently get a negative number.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(L) per insert / search / startsWith / countPrefix',
            space: 'O(total characters inserted) nodes (× σ with array children)',
            md: `| operation | time |
|---|---|
| insert, search, startsWith, countPrefix | O(L) |
| build from n words of total length S | O(S) |
| list all words under a prefix | O(L + size of that subtree) |
| wildcard search with d dots | up to O(σ^d · L) |
| max XOR (31-bit numbers) | O(31 · n) = O(n) |
| word search II (m×n grid, max word length L) | O(m · n · 4 · 3^(L−1)) worst case, much less with pruning |

**Space:** at most one node per inserted character (shared prefixes reduce this). With \`Array(26)\` children every node pays for 26 slots, so a Map is more memory-efficient when branching is sparse.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Justify the trie:** "There are many prefix queries against the same dictionary; a trie makes each O(L) independent of n."
- **State your node shape** up front: Map vs Array(26), \`isEnd\`, and any extra fields (\`count\`, \`word\`, \`sum\`, top-3 list).
- **Mention the Set alternative** for exact lookups and the sort + binary search alternative for static prefix queries.
- For grid problems, **say the pruning ideas** explicitly: stop when no child, clear found words, delete dead leaves.
- For XOR, **explain the greedy** (higher bit dominates all lower bits) before coding.
- Be ready to discuss **memory**: node count ≈ total characters; compression (radix tree) merges single-child chains.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'new Map()', use: 'Children keyed by character; iterate with .values() / .entries()', complexity: 'O(1) average' },
              { api: 'new Array(26).fill(null)', use: 'Children for lowercase letters; alphabetical by index', complexity: 'O(1)' },
              { api: "ch.charCodeAt(0) - 97", use: "Map 'a'..'z' to 0..25", complexity: 'O(1)' },
              { api: 'new Trie(words) (toolkit)', use: 'insert, search, startsWith, countPrefix, wordsWithPrefix(prefix, limit)', complexity: 'O(L) per op' },
              { api: 'node.next[i] ??= new Node()', use: 'Create-if-missing in one expression', complexity: 'O(1)' },
              { api: '(x >> b) & 1 / 1 << b', use: 'Read and set bits in a binary trie', complexity: 'O(1)' },
              { api: 'Object.create(null)', use: 'Prototype-free object if you prefer objects over Map', complexity: 'O(1) average' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Many prefix queries on the same word set', 'Autocomplete / suggestions', 'Wildcard or split-into-words search', 'Maximum XOR over numbers', 'Many words searched at once in a grid or stream'],
    clues: ['prefix', 'starts with', 'autocomplete', 'dictionary', 'wildcard "."', 'maximum XOR', 'words in a board', 'stream of characters', 'concatenated words'],
    template: `class TrieNode { constructor() { this.children = new Map(); this.isEnd = false; } }
function insert(root, w) {
  let n = root;
  for (const ch of w) { if (!n.children.has(ch)) n.children.set(ch, new TrieNode()); n = n.children.get(ch); }
  n.isEnd = true;
}
function walk(root, s) { let n = root; for (const ch of s) { n = n.children.get(ch); if (!n) return null; } return n; }`,
    complexity: 'O(L) per operation; O(total characters) nodes',
    mistakes: ['missing isEnd check', 'search creating nodes', 'plain object children (inherited keys)', 'wildcard DFS stopping after one child', 'XOR bits low→high / 1 << 31', 'duplicate grid results'],
    jsTools: ['Map', 'Array(26)', 'charCodeAt', 'Trie (toolkit)', '??=', '>> & ^'],
  },

  keyConcepts: [
    'A trie node represents a prefix; edges add one character; shared prefixes are stored once.',
    'insert / search / startsWith are O(L), independent of the number of stored words.',
    'isEnd distinguishes complete words from mere prefixes.',
    'Attach data to nodes (count, word, sum, top-3) to answer richer prefix queries in one walk.',
    'Wildcards and word splitting need DFS over multiple children (with memoisation for splitting).',
    'Binary tries solve maximum XOR greedily from the highest bit because it dominates all lower bits.',
    'A trie can steer another search (grid DFS, reversed-word stream) and prune impossible paths.',
  ],

  interviewTips: [
    'Explain why a trie beats scanning or a Set for prefix queries.',
    'Declare the node shape (Map vs Array(26), isEnd, extras) before coding.',
    'For Word Search II mention pruning: stop on missing child, clear found words, delete dead leaves.',
  ],
};
