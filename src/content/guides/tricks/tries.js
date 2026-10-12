export default {
  signals: [
    '"replace each word by its shortest root from a dictionary"',
    '"search with a prefix AND a suffix at the same time"',
    '"count words that start with / end with …" asked many times',
    '"list 1..n in lexicographical (dictionary) order"',
    '"find many short patterns inside one long text" → trie + failure links (Aho–Corasick)',
    '"longest word that can be built one letter at a time"',
  ],
  tricks: [
    {
      title: 'Flat typed-array trie for big inputs',
      kind: 'javascript',
      md: "A trie with one `Map` or object per node costs hundreds of bytes per node; 10^6 nodes can use hundreds of MB and are slow to allocate. When the alphabet is small (26 letters, 2 bits) store all children in one `Int32Array` indexed by `node * 26 + letter`, with -1 meaning “no child”. The total number of nodes is at most the total number of characters + 1, so you can size the array up front.",
      code: `function buildFlatTrie(words) {
  const MAX = words.reduce((s, w) => s + w.length, 0) + 1;
  const next = new Int32Array(MAX * 26).fill(-1); // next[node * 26 + c]
  const end = new Uint8Array(MAX); let count = 1; // node 0 is the root
  for (const w of words) {
    let node = 0;
    for (let i = 0; i < w.length; i++) {
      const slot = node * 26 + (w.charCodeAt(i) - 97);
      if (next[slot] === -1) next[slot] = count++;
      node = next[slot];
    }
    end[node] = 1;
  }
  return { next, end };
}`,
    },
    {
      title: 'Stop at the first word end for "shortest root"',
      kind: 'template',
      md: "For “replace words by their root”, walk the word through the trie and return as soon as you reach a node marked as a word end — that is the SHORTEST dictionary prefix. If a child is missing first, no root exists and you keep the word. Each word costs O(its length) no matter how big the dictionary is.",
      code: `function shortestRoot(root, word) {
  let node = root;
  for (let i = 0; i < word.length; i++) {
    node = node.children.get(word[i]);
    if (!node) return word;                         // no root matches
    if (node.isEnd) return word.slice(0, i + 1);    // first (shortest) root
  }
  return word;
}`,
    },
    {
      title: 'Prefix + suffix queries: insert "suffix{word" keys',
      kind: 'template',
      md: "To answer “words with prefix p AND suffix s” with one trie, insert every suffix of each word glued to the whole word with a separator: for “apple” insert “{apple”, “e{apple”, “le{apple”, … Then the query is a single prefix walk for `s + '{' + p`. The separator '{' is the character right after 'z' in ASCII, so an `Array(27)` node with `charCodeAt − 97` still works.",
      code: `function keysFor(word) {
  const keys = [];
  for (let i = 0; i <= word.length; i++) keys.push(word.slice(i) + '{' + word);
  return keys;
}
console.log(keysFor('ab')); // → ["ab{ab","b{ab","{ab"]
// query(prefix, suffix) → walk the trie with suffix + '{' + prefix`,
    },
    {
      title: 'Lexicographic order of numbers is a trie walk you never build',
      kind: 'recognition',
      md: "The numbers 1..n in dictionary order are a preorder walk of an implicit 10-ary trie: from x, the first child is x·10; the next sibling is x + 1; when a branch ends, climb with x / 10. Simulating the walk gives O(n) time and O(1) extra space — no strings, no sort. The same idea answers “k-th number in lexicographical order” by counting subtree sizes.",
      code: `function lexicalOrder(n) {
  const out = [];
  let cur = 1;
  for (let i = 0; i < n; i++) {
    out.push(cur);
    if (cur * 10 <= n) cur *= 10;                 // go to first child
    else {
      while (cur % 10 === 9 || cur + 1 > n) cur = Math.floor(cur / 10); // climb
      cur++;                                      // next sibling
    }
  }
  return out;
}
console.log(lexicalOrder(13)); // → [1,10,11,12,13,2,3,4,5,6,7,8,9]`,
    },
    {
      title: 'Sometimes a Set of prefixes is enough',
      kind: 'interview',
      md: "If the inputs are small (total length up to ~10^4–10^5) and you only need “is this prefix present”, a `Set` of words (or of all prefixes) is simpler to write and to explain than a trie. Offer it as the first solution, state its cost (slicing costs O(L) per prefix, so O(L²) per word), then move to a trie if the interviewer wants better bounds.",
      code: `function longestWord(words) {
  const set = new Set(words);
  let best = '';
  for (const w of words) {
    if (w.length < best.length || (w.length === best.length && w > best)) continue;
    let ok = true;
    for (let i = 1; i < w.length && ok; i++) ok = set.has(w.slice(0, i));
    if (ok) best = w;
  }
  return best;
}
console.log(longestWord(['w', 'wo', 'wor', 'worl', 'world'])); // → world`,
    },
    {
      title: 'Handle the empty string on purpose',
      kind: 'edge-cases',
      md: "Inserting '' marks the ROOT as a word end; `search('')` then returns `root.isEnd`, and `startsWith('')` is always true (every word starts with the empty prefix). Decide whether '' is a valid word and test it explicitly — it is a common hidden test case, and code that starts by reading `word[0]` crashes or misbehaves on it.",
    },
    {
      title: 'Delete safely with pass-through counts',
      kind: 'template',
      md: "Store `pass` (how many words go through this node) as well as `isEnd`. To delete a word, first confirm it exists, then walk again decrementing `pass`; when a child’s `pass` drops to 0, cut that child off — the rest of the branch belonged only to this word. The same counts answer “how many words start with p” in O(|p|).",
      code: `const node = () => ({ children: new Map(), pass: 0, isEnd: 0 });
function insert(root, w) {
  let n = root; n.pass++;
  for (const ch of w) { if (!n.children.has(ch)) n.children.set(ch, node()); n = n.children.get(ch); n.pass++; }
  n.isEnd++;
}
function remove(root, w) { // assumes w was inserted
  let n = root; n.pass--;
  for (const ch of w) {
    const c = n.children.get(ch); // cut the branch once no other word uses it
    if (--c.pass === 0) { n.children.delete(ch); return; } n = c;
  }
  n.isEnd--;
}`,
    },
    {
      title: 'Many patterns, one text → Aho–Corasick',
      kind: 'recognition',
      md: "If you must find ALL occurrences of many dictionary words inside a long text (or a character stream), running a trie walk from every text position costs O(text × longest word). Aho–Corasick adds “failure links” to the trie (like KMP’s prefix function) so the text is scanned once. In an interview it is usually enough to name it and explain the reversed-word-trie alternative for streams.",
    },
  ],
  traps: [
    {
      looksLike: 'Trie for exact word lookups only',
      actually: 'Set / Map',
      why: 'without prefix queries a hash set is O(L) per lookup too and far less code',
    },
    {
      looksLike: 'Trie for "longest common prefix of all strings"',
      actually: 'Sort, then compare the first and last strings',
      why: 'after sorting, the common prefix of everything equals the common prefix of the two extremes',
    },
    {
      looksLike: 'Trie to find one pattern in a text',
      actually: 'KMP / Z-function (or indexOf)',
      why: 'a single pattern needs a string-matching algorithm, not a dictionary structure',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Trie', url: 'https://www.techinterviewhandbook.org/algorithms/trie/' },
    { label: 'Wikipedia — Trie', url: 'https://en.wikipedia.org/wiki/Trie' },
  ],
};
