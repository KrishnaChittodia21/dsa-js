// Trie (prefix tree): each node represents a prefix; children are keyed by character.
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false; // a complete word ends here
    this.count = 0; // how many inserted words pass through this node
  }
}

export class Trie {
  constructor(words = []) {
    this.root = new TrieNode();
    for (const w of words) this.insert(w);
  }
  insert(word) {
    let node = this.root;
    node.count++; // every word passes through the root (so countPrefix('') = number of words)
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
      node.count++;
    }
    node.isEnd = true;
  }
  #walk(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }
  search(word) {
    const node = this.#walk(word);
    return node !== null && node.isEnd;
  }
  startsWith(prefix) {
    return this.#walk(prefix) !== null;
  }
  countPrefix(prefix) {
    const node = this.#walk(prefix);
    return node ? node.count : 0;
  }
  // All words that start with `prefix` (lexicographic order).
  wordsWithPrefix(prefix, limit = Infinity) {
    const start = this.#walk(prefix);
    const out = [];
    const dfs = (node, path) => {
      if (out.length >= limit) return;
      if (node.isEnd) out.push(path);
      const keys = [...node.children.keys()].sort();
      for (const ch of keys) dfs(node.children.get(ch), path + ch);
    };
    if (start) dfs(start, prefix);
    return out;
  }
}
