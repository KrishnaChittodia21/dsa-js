export default {
  id: 'map-sum-pairs',
  title: 'Map Sum Pairs',
  difficulty: 'Medium',
  order: 2,
  pattern: 'trie-prefix-tree',
  kind: 'design',
  tags: ['trie', 'design', 'hash map'],
  source: { platform: 'LeetCode', number: 677, url: 'https://leetcode.com/problems/map-sum-pairs/' },

  statement: `Implement a class \`MapSum\`:

- \`insert(key, val)\` — sets \`key\`'s value to \`val\`. If \`key\` already exists, its old value is **replaced**.
- \`sum(prefix)\` — returns the sum of the values of all keys that start with \`prefix\`.`,
  examples: [
    { input: 'insert("apple", 3), sum("ap"), insert("app", 2), sum("ap")', output: '[null,null,3,null,5]' },
  ],
  constraints: ['1 <= key.length, prefix.length <= 50', 'lowercase English letters', '1 <= val <= 1000', 'At most 50 calls'],

  think: `- If each trie node stored "the sum of values of all keys passing through me", what would sum(prefix) cost?
- When a key is re-inserted with a new value, by how much must each node on its path change?`,
  patternChallenge: {
    options: ['Trie — Prefix Tree (with per-node sums)', 'Prefix Sum array', 'Heap — Top K', 'Sliding Window'],
    answer: 0,
    explanation: 'Sums grouped by string prefix → a trie whose nodes carry aggregated values. A numeric prefix-sum array works on indices, not string prefixes.',
  },
  hints: [
    'Keep a Map key → current value to know the old value on re-insert.',
    'On insert compute delta = val − old (old = 0 if new) and add delta to the `sum` of every node on the key\'s path. sum(prefix) = walk(prefix)?.sum ?? 0.',
  ],
  approach: `**Brute force:** a Map of key → value; \`sum\` scans all keys with \`startsWith\` → O(n · L) per query.

**Trie with aggregated sums:** each node stores the total value of keys passing through it.
- insert: \`delta = val − (values.get(key) ?? 0)\`; walk the key, adding \`delta\` to every node's \`sum\` (creating nodes as needed); \`values.set(key, val)\`.
- sum: walk the prefix; return that node's \`sum\` or 0.

Both are O(L). The delta trick handles overwrites without subtracting separately.`,

  className: 'MapSum',
  starterCode: `class MapSum {
  constructor() {
    
  }

  /** @param {string} key @param {number} val */
  insert(key, val) {
    
  }

  /** @param {string} prefix @return {number} */
  sum(prefix) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: after inserting "app", sum("ap") = 3 + 2.', ops: ["MapSum","insert","sum","insert","sum"], args: [[],["apple",3],["ap"],["app",2],["ap"]], expected: [null,null,3,null,5] },
    { scenario: 'Re-insert replaces value', hint: 'Adding val instead of the delta on re-insert counts the old value twice: the answer is 2, not 5.', ops: ["MapSum","insert","insert","sum"], args: [[],["apple",3],["apple",2],["ap"]], expected: [null,null,null,2] },
    { scenario: 'Sum on empty map', hint: 'Returning undefined instead of 0 for a missing prefix.', ops: ["MapSum","sum"], args: [[],["a"]], expected: [null,0] },
    { scenario: 'Separate first letters', hint: 'Each prefix only sums its own branch; "c" has no keys.', ops: ["MapSum","insert","insert","sum","sum","sum"], args: [[],["a",3],["b",2],["a"],["b"],["c"]], expected: [null,null,null,3,2,0] },
    { scenario: 'Re-insert a nested key', hint: '"aa" changes from 3 to 5: sum("a") = 2 + 5, sum("aa") = 5.', ops: ["MapSum","insert","insert","insert","sum","sum"], args: [[],["aa",3],["a",2],["aa",5],["a"],["aa"]], expected: [null,null,null,null,7,5] },
    { scenario: 'Prefix longer than keys', hint: '"apples" extends past every key — the sum is 0.', ops: ["MapSum","insert","sum","sum"], args: [[],["apple",3],["apple"],["apples"]], expected: [null,null,3,0] },
    { scenario: 'Full key as prefix', hint: 'A key starts with itself, so its own value counts.', ops: ["MapSum","insert","insert","sum","sum","sum"], args: [[],["cat",7],["cats",1],["cat"],["cats"],["ca"]], expected: [null,null,null,8,1,8] },
    { scenario: 'Re-insert same value', hint: 'Re-inserting with the same value is a delta of 0.', ops: ["MapSum","insert","insert","sum","insert","insert","sum"], args: [[],["x",5],["x",5],["x"],["xy",1],["x",5],["x"]], expected: [null,null,null,5,null,null,6] },
    { scenario: 'Value lowered then raised', hint: 'Deltas can be negative: 1000 → 1 → 500.', ops: ["MapSum","insert","sum","insert","sum","insert","sum"], args: [[],["k",1000],["k"],["k",1],["k"],["k",500],["k"]], expected: [null,null,1000,null,1,null,500] },
    { scenario: 'Max length keys', hint: '50-letter keys that share a 49-letter prefix.', ops: ["MapSum","insert","insert","sum","sum","sum"], args: [[],["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",10],["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab",20],["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],["a"]], expected: [null,null,null,30,10,30] },
    { scenario: 'Max calls (50)', hint: '49 mixed inserts and sums over short overlapping keys, including re-inserts.', ops: ["MapSum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert","sum","insert"], args: [[],["ayy",214],["a"],["az",630],["a"],["axxx",854],["a"],["axxx",358],["ax"],["ayy",838],["a"],["ax",206],["axx"],["azz",798],["ax"],["axx",686],["ax"],["ayy",318],["ax"],["az",518],["az"],["ayyy",446],["ay"],["ax",326],["ay"],["ay",502],["ax"],["axxx",78],["az"],["ayyy",182],["azz"],["ax",150],["az"],["ax",70],["az"],["axx",878],["ax"],["azz",630],["ayy"],["axx",918],["a"],["ayyy",830],["ax"],["ay",686],["az"],["axx",430],["azz"],["azzz",54],["az"],["ayy",310]], expected: [null,null,214,null,844,null,1698,null,358,null,1826,null,358,null,564,null,1250,null,1250,null,1316,null,764,null,764,null,1370,null,1316,null,798,null,1316,null,1316,null,1026,null,500,null,3216,null,1066,null,1148,null,630,null,1202,null] },
  ],

  solution: {
    code: `class MapSum {
  constructor() {
    this.root = { children: new Map(), sum: 0 };
    this.values = new Map();              // key -> current value
  }

  insert(key, val) {
    const delta = val - (this.values.get(key) ?? 0); // handles overwrite
    this.values.set(key, val);
    let node = this.root;
    for (const ch of key) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), sum: 0 });
      node = node.children.get(ch);
      node.sum += delta;                  // every prefix of key gains delta
    }
  }

  sum(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return 0;
    }
    return node.sum;
  }
}`,
  },
  dryRun: {
    columns: ['call', 'delta', 'sums on path', 'returns'],
    rows: [['insert apple 3', '3', 'a:3 p:3 p:3 l:3 e:3', 'null'], ['sum ap', '—', 'p (2nd level) = 3', '3'], ['insert app 2', '2', 'a:5 p:5 p:5', 'null'], ['sum ap', '—', '5', '5']],
  },
  complexity: { time: 'O(L) per call', space: 'O(total key characters)', explanation: 'Insert and sum each walk one path.' },
  alternative: {
    title: 'Map + scan',
    code: `class MapSum {
  constructor() { this.m = new Map(); }
  insert(k, v) { this.m.set(k, v); }
  sum(p) { let s = 0; for (const [k, v] of this.m) if (k.startsWith(p)) s += v; return s; }
}`,
    md: 'Perfectly fine for 50 calls; O(n · L) per sum.',
    complexity: 'O(n · L) per sum',
  },
  mistakes: [
    'Adding val instead of the delta on re-insert (old value counted twice).',
    'Storing the value only at the end node and DFS-summing the subtree on every query (correct but slower).',
    'Returning undefined instead of 0 for a missing prefix.',
  ],
};
