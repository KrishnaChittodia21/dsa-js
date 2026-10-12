export default {
  id: 'search-suggestions-system',
  title: 'Search Suggestions System',
  difficulty: 'Medium',
  order: 5,
  pattern: 'trie-prefix-tree',
  tags: ['trie', 'string', 'sorting', 'binary search'],
  source: { platform: 'LeetCode', number: 1268, url: 'https://leetcode.com/problems/search-suggestions-system/' },

  statement: `You are given an array \`products\` and a string \`searchWord\`. After each character of \`searchWord\` is typed, suggest **at most three** products that start with the typed prefix — the three lexicographically smallest if there are more.

Return a list of lists: the suggestions after each typed character.`,
  examples: [
    {
      input: 'products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"',
      output: '[["mobile","moneypot","monitor"],["mobile","moneypot","monitor"],["mouse","mousepad"],["mouse","mousepad"],["mouse","mousepad"]]',
    },
    { input: 'products = ["havana"], searchWord = "tatiana"', output: '[[],[],[],[],[],[],[]]' },
  ],
  constraints: ['1 <= products.length <= 1000', '1 <= sum of product lengths <= 2 * 10^4', '1 <= searchWord.length <= 1000', 'lowercase English letters, products are unique'],

  think: `- Each typed character extends the prefix by one. Does the search have to start over each time?
- If every trie node already knew its three smallest words, what would each step cost?
- How can sorting the products first make "three smallest" automatic during insertion?`,
  patternChallenge: {
    options: ['Heap — Top K per prefix', 'Trie — Prefix Tree (store top-3 per node)', 'Sliding Window', 'Trie — DFS over branches with wildcards'],
    answer: 1,
    explanation: 'Autocomplete = walk one trie node deeper per typed character. Storing the first three (sorted) words on every node makes each step O(1). A heap per prefix redoes work; there is no wildcard.',
  },
  hints: [
    'Sort `products` first. Insert them in that order; on every node you pass, push the word into `node.top` if it has fewer than 3 entries.',
    'Walk `searchWord` one character at a time; output `node.top` (or [] once the walk has fallen off the trie).',
  ],
  approach: `**Brute force:** for every prefix, filter all products and sort → O(L · n · log n).

**Sort + binary search:** sort once; for each prefix, \`lowerBound(prefix)\` finds the first candidate; check the next three. O(n log n + L · log n · L).

**Trie with top-3 lists:** sort products, then insert them in sorted order; each node keeps the first three words that pass through it — which are therefore the three smallest with that prefix. Typing a character = one step down the trie, then read \`top\`. Once a child is missing, all remaining answers are \`[]\`.`,

  functionName: 'suggestedProducts',
  paramNames: ['products', 'searchWord'],
  starterCode: `/**
 * @param {string[]} products
 * @param {string} searchWord
 * @return {string[][]}
 */
function suggestedProducts(products, searchWord) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "m"/"mo" suggest the three smallest, "mou…" narrows to two.', args: [["mobile","mouse","moneypot","monitor","mousepad"],"mouse"], expected: [["mobile","moneypot","monitor"],["mobile","moneypot","monitor"],["mouse","mousepad"],["mouse","mousepad"],["mouse","mousepad"]] },
    { scenario: 'Example 2', hint: 'Nothing starts with "t" — every position gets an empty list, one list per typed character.', args: [["havana"],"tatiana"], expected: [[],[],[],[],[],[],[]] },
    { scenario: 'Single product typed fully', hint: 'One product matching every prefix: six lists each containing "havana".', args: [["havana"],"havana"], expected: [["havana"],["havana"],["havana"],["havana"],["havana"],["havana"]] },
    { scenario: 'Unsorted input order', hint: 'Inserting unsorted products stores the wrong top 3 — sort first (or keep each node\'s list sorted).', args: [["bags","baggage","banner","box","cloths"],"bags"], expected: [["baggage","bags","banner"],["baggage","bags","banner"],["baggage","bags"],["bags"]] },
    { scenario: 'Prefix dies midway', hint: 'After a missing child, every remaining prefix has no matches. Continuing to walk crashes — return [] for the rest.', args: [["a","aa","aaa","aaaa"],"aab"], expected: [["a","aa","aaa"],["aa","aaa","aaaa"],[]] },
    { scenario: 'Shorter word sorts first', hint: '"coddle" < "coddles" < "code" lexicographically: a prefix sorts before its extensions.', args: [["code","codephone","coddle","coddles","codes"],"coddle"], expected: [["coddle","coddles","code"],["coddle","coddles","code"],["coddle","coddles","code"],["coddle","coddles"],["coddle","coddles"],["coddle","coddles"]] },
    { scenario: 'Fewer than three matches', hint: 'Return only the matches that exist — do not pad to three.', args: [["apple","apricot"],"ap"], expected: [["apple","apricot"],["apple","apricot"]] },
    { scenario: 'More than three matches', hint: 'Exactly three — the smallest — even when ten products match.', args: [["ka","kb","kc","kd","ke","kf","kg","kh","ki","kj"],"k"], expected: [["ka","kb","kc"]] },
    { scenario: 'Search word longer than products', hint: 'Once the typed prefix is longer than every product, the lists are empty.', args: [["ab","abc"],"abcdef"], expected: [["ab","abc"],["ab","abc"],["abc"],[],[],[]] },
    { scenario: 'Single-letter search word', hint: 'One typed character → exactly one list.', args: [["z","zz","y"],"z"], expected: [["z","zz"]] },
    { scenario: 'Mismatch at first character', hint: 'The very first letter has no child; all lists are empty.', args: [["bbb","ccc"],"abc"], expected: [[],[],[]] },
    { scenario: 'Max size (1000 products)', hint: 'Many products share long "aaa…" prefixes and the search word is 1000 letters long; re-filtering and re-sorting every prefix repeats work a trie walk avoids.', argsGen: "() => { const products = Array.from({ length: 1000 }, (_, i) => 'a'.repeat(1 + (i % 19)) + String.fromCharCode(98 + (i % 23)) + (i < 26 ? '' : String.fromCharCode(97 + Math.floor(i / 26) % 26) + String.fromCharCode(97 + (Math.floor(i / 676) % 26)))); return [[...new Set(products)], 'a'.repeat(1000)]; }", expected: [["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],["aaaaaaaaaaaaaaaaaaabdb","aaaaaaaaaaaaaaaaaaabma","aaaaaaaaaaaaaaaaaaacia"],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]] },
  ],

  solution: {
    code: `function suggestedProducts(products, searchWord) {
  const root = { children: new Map(), top: [] };
  for (const p of [...products].sort()) {       // sorted insert → first 3 are the smallest
    let node = root;
    for (const ch of p) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), top: [] });
      node = node.children.get(ch);
      if (node.top.length < 3) node.top.push(p);
    }
  }

  const out = [];
  let node = root;
  for (const ch of searchWord) {
    node = node ? node.children.get(ch) : undefined; // once lost, stay lost
    out.push(node ? [...node.top] : []);
  }
  return out;
}`,
    explanation: 'Default `sort()` on strings is lexicographic by UTF-16 code units — exactly what we need for lowercase words.',
  },
  dryRun: {
    columns: ['typed', 'node', 'top'],
    rows: [['m', 'm', 'mobile, moneypot, monitor'], ['mo', 'mo', 'mobile, moneypot, monitor'], ['mou', 'mou', 'mouse, mousepad'], ['mous', 'mous', 'mouse, mousepad'], ['mouse', 'mouse', 'mouse, mousepad']],
  },
  complexity: { time: 'O(n log n · L + S + |searchWord|)', space: 'O(S)', explanation: 'Sorting n strings costs O(n log n) comparisons of length ≤ L; inserting is O(S) (S = total characters); each typed character is O(1). Each node stores ≤ 3 references.' },
  alternative: {
    title: 'Sort + binary search',
    code: `function suggestedProducts(products, searchWord) {
  const p = [...products].sort();
  const out = [];
  let prefix = '';
  for (const ch of searchWord) {
    prefix += ch;
    let lo = 0, hi = p.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (p[m] < prefix) lo = m + 1; else hi = m; }
    out.push(p.slice(lo, lo + 3).filter((w) => w.startsWith(prefix)));
  }
  return out;
}`,
    md: 'Less memory; binary search finds the first product ≥ prefix.',
    complexity: 'O(n log n · L + |searchWord| · L log n)',
  },
  mistakes: [
    'Inserting unsorted products (the stored top-3 would not be the smallest).',
    'Continuing to walk after a missing child (crash) instead of returning [] for the rest.',
    'Returning references to node.top that the caller might mutate — copy if in doubt.',
  ],
};
