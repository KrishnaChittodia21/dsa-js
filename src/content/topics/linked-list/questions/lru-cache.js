// 2·10^5 pseudo-random get/put calls on capacity 3000; expected values come from a JS Map used as an ordered set (delete + set = move to the back).
const bigLruOps = () => {
  let s = 5; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const cap = 3000, m = new Map();
  const ops = ['LRUCache'], args = [[cap]], expected = [null];
  for (let i = 0; i < 199999; i++) {
    const key = rnd(10001);
    if (rnd(2)) {
      ops.push('get'); args.push([key]);
      if (m.has(key)) { const v = m.get(key); m.delete(key); m.set(key, v); expected.push(v); } else expected.push(-1);
    } else {
      const v = rnd(100001);
      ops.push('put'); args.push([key, v]); expected.push(null);
      m.delete(key); m.set(key, v);
      if (m.size > cap) m.delete(m.keys().next().value);
    }
  }
  return { ops, args, expected };
};

export default {
  id: 'lru-cache',
  title: 'LRU Cache',
  difficulty: 'Medium',
  order: 7,
  pattern: 'linked-list-cache-design',
  kind: 'design',
  tags: ['design', 'hash map', 'doubly linked list'],
  source: { platform: 'LeetCode', number: 146, url: 'https://leetcode.com/problems/lru-cache/' },

  statement: `Design a **Least Recently Used (LRU)** cache with a fixed \`capacity\`:

- \`new LRUCache(capacity)\` — create an empty cache.
- \`get(key)\` — return the value for \`key\` if present, else \`-1\`. A successful get counts as a **use**.
- \`put(key, value)\` — insert or update the key (this is also a use). If the insertion makes the cache exceed \`capacity\`, evict the key that was used **least recently**.

Both operations must run in **O(1)** average time.`,
  examples: [
    {
      input: 'ops = ["LRUCache","put","put","get","put","get","put","get","get","get"]\nargs = [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
      output: '[null,null,null,1,null,-1,null,-1,3,4]',
      explanation: 'get(1) makes 1 recent, so put(3) evicts 2. put(4) then evicts 1.',
    },
  ],
  constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5', 'At most 2 * 10^5 calls to get and put'],

  think: `- Which structure finds a key in O(1)? Which keeps an order you can change in O(1)?
- When you evict, you start from the "oldest" end of the order. How do you then remove it from the lookup structure?
- Does updating an existing key count as a use?`,
  patternChallenge: {
    options: ['Hash Map + Doubly Linked List', 'Min-heap keyed by timestamp', 'Array kept sorted by last use', 'Queue of keys only'],
    answer: 0,
    explanation: 'Map gives O(1) lookup of a node; a doubly linked list gives O(1) move-to-front and remove-oldest. A heap costs O(log n) per update; an array costs O(n) to reorder; a plain queue cannot move an element from the middle.',
  },
  hints: [
    'Keep sentinel `head` and `tail` nodes. Most recent right after head, least recent right before tail.',
    'Nodes store `key` and `val`. On get/put: unlink the node and re-insert it after head. On overflow: remove `tail.prev` and delete its key from the Map.',
  ],
  approach: `**Brute force:** an array of [key, value] ordered by recency: find with a scan (O(n)), move to the end with \`splice\` (O(n)).

**Optimized — Map + doubly linked list:**
- \`map: key → node\`. Each node has \`key, val, prev, next\`.
- Sentinels \`head\` ⇄ \`tail\` so insert/remove never meet \`null\`.
- \`get\`: look up the node, unlink it, insert after head, return its value.
- \`put\`: if the key exists, update and move to front; otherwise create a node at the front and add it to the map. If \`map.size > capacity\`, remove \`tail.prev\` and \`map.delete(lru.key)\`.

**JS shortcut:** a \`Map\` iterates in insertion order, so \`delete\` + \`set\` moves a key to the "newest" end and \`map.keys().next().value\` is the oldest. Mention it, but be ready to build the DLL version.`,

  className: 'LRUCache',
  starterCode: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement\'s sequence: get(1) refreshes key 1, so put(3) evicts key 2.',
      ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], expected: [null, null, null, 1, null, -1, null, -1, 3, 4] },
    { scenario: 'Single put then get', hint: 'Capacity 1, one key stored and read back.',
      ops: ['LRUCache', 'put', 'get'], args: [[1], [2, 1], [2]], expected: [null, null, 1] },
    { scenario: 'Get on empty cache', hint: 'A missing key returns -1.',
      ops: ['LRUCache', 'get'], args: [[1], [5]], expected: [null, -1] },
    { scenario: 'Capacity 1 eviction', hint: 'The second put must evict the first key.',
      ops: ['LRUCache', 'put', 'put', 'get', 'get'], args: [[1], [1, 1], [2, 2], [1], [2]], expected: [null, null, null, -1, 2] },
    { scenario: 'Get refreshes recency', hint: 'Not refreshing recency on get: key 1 was read, so key 2 is the least recently used and must be evicted.',
      ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [1], [2], [3]], expected: [null, null, null, 1, null, 1, -1, 3] },
    { scenario: 'Update moves key to front', hint: 'Updating key 2 makes it most recent; put(4) must then evict key 1, not key 2.',
      ops: ['LRUCache', 'put', 'put', 'put', 'put', 'get', 'get'], args: [[2], [2, 1], [1, 1], [2, 3], [4, 1], [1], [2]], expected: [null, null, null, null, null, -1, 3] },
    { scenario: 'Update does not evict', hint: 'The cache is full but key 1 already exists — evicting before checking would wrongly drop key 2.',
      ops: ['LRUCache', 'put', 'put', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 10], [1], [2]], expected: [null, null, null, null, 10, 2] },
    { scenario: 'Evicted key removed from map', hint: 'After eviction the old key must be gone from the Map too — a stale entry would return its old value.',
      ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'get'], args: [[1], [1, 1], [2, 2], [1], [3, 3], [1], [2]], expected: [null, null, null, -1, null, -1, -1] },
    { scenario: 'Reads reverse the order', hint: 'Reading 3, 2, 1 makes 3 the least recent, so put(4) evicts 3.',
      ops: ['LRUCache', 'put', 'put', 'put', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'get'], args: [[3], [1, 1], [2, 2], [3, 3], [3], [2], [1], [4, 4], [3], [2], [1], [4]], expected: [null, null, null, null, 3, 2, 1, null, -1, 2, 1, 4] },
    { scenario: 'Key and value 0', hint: '0 is a valid key and value — don\'t treat a stored 0 as "missing".',
      ops: ['LRUCache', 'put', 'get', 'put', 'get', 'get'], args: [[1], [0, 0], [0], [1, 1], [0], [1]], expected: [null, null, 0, null, -1, 1] },
    { scenario: 'Get of missing key keeps order', hint: 'A miss must not change recency or size.',
      ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [9], [3, 3], [1], [2]], expected: [null, null, null, -1, null, -1, 2] },
    { scenario: 'Mixed sequence (capacity 3)', hint: 'A pseudo-random mix of 60 gets and puts over 6 keys — every rule above applies.',
      ops: ['LRUCache', 'put', 'put', 'put', 'get', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'put', 'put', 'put', 'put', 'get', 'put', 'put', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'get', 'put', 'put', 'put'], args: [[3], [0, 489], [1, 415], [0, 808], [5], [1, 157], [1, 257], [4], [5, 631], [4], [4, 650], [5], [5], [2], [1], [5], [5, 525], [2, 441], [4, 774], [2, 658], [5, 580], [1], [2, 326], [5, 197], [1], [2], [1], [3], [4, 86], [4], [3], [5], [3, 550], [2, 235], [3], [0, 621], [3], [2], [1], [4], [4], [4, 495], [3, 677], [2, 246], [0], [3, 478], [3], [1, 435], [3], [2], [5], [5], [5], [3, 53], [1], [2], [5], [4], [3, 681], [5, 516], [5, 909]], expected: [null, null, null, null, -1, null, null, -1, null, -1, null, 631, 631, -1, 257, 631, null, null, null, null, null, -1, null, null, -1, 326, -1, -1, null, 86, -1, 197, null, null, 550, null, 550, 235, -1, -1, -1, null, null, null, -1, null, 478, null, 478, 246, -1, -1, -1, null, 435, 246, -1, -1, null, null, null] },
    { scenario: 'Mixed sequence (capacity 5)', hint: 'A pseudo-random mix of 80 gets and puts over 10 keys.',
      ops: ['LRUCache', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'put', 'get', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'put', 'put', 'get', 'get', 'get', 'put', 'put', 'get', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'put', 'put', 'put', 'put'], args: [[5], [0, 541], [4, 971], [2, 587], [3], [4], [1, 211], [0, 540], [5], [7, 205], [7], [2], [0], [1, 503], [1], [8, 868], [2, 118], [0], [2], [0, 186], [1, 307], [8, 122], [8, 455], [6, 537], [9, 202], [7], [8], [8], [1, 34], [1, 200], [5], [3], [3], [6], [5], [7], [2, 823], [0], [0], [7, 148], [4, 279], [9, 665], [0], [4], [3, 473], [1, 459], [8, 699], [4, 120], [8], [0, 367], [9], [4], [3], [9], [4], [8, 636], [9], [3], [6, 688], [1, 257], [2, 67], [4], [0], [1, 314], [7, 243], [0, 745], [2, 258], [8], [5], [7, 267], [5, 390], [1, 380], [3], [7, 908], [3], [4], [6], [2, 221], [6, 781], [2, 266], [1, 555]], expected: [null, null, null, null, -1, 971, null, null, -1, null, 205, 587, 540, null, 503, null, null, 540, 118, null, null, null, null, null, null, -1, 455, 455, null, null, -1, -1, -1, 537, -1, -1, null, -1, -1, null, null, null, -1, 279, null, null, null, null, 699, null, -1, 120, 473, -1, 120, null, -1, 473, null, null, null, -1, -1, null, null, null, null, -1, -1, null, null, null, -1, null, -1, -1, -1, null, null, null, null] },
    { scenario: 'Max calls (2·10^5)', hint: 'The largest allowed run: capacity 3000, keys 0..10^4, half gets and half puts. Every get must refresh recency and every overflow must evict the least recently used key.', opsGen: String(bigLruOps) },
  ],

  solution: {
    code: `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();                        // key -> node
    this.head = { key: 0, val: 0, prev: null, next: null }; // most-recent side
    this.tail = { key: 0, val: 0, prev: null, next: null }; // least-recent side
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addFront(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    const node = this.map.get(key);
    if (!node) return -1;
    this._remove(node);          // a read is a use
    this._addFront(node);
    return node.val;
  }

  put(key, value) {
    let node = this.map.get(key);
    if (node) {
      node.val = value;
      this._remove(node);
    } else {
      node = { key, val: value, prev: null, next: null };
      this.map.set(key, node);
    }
    this._addFront(node);
    if (this.map.size > this.cap) {
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);  // this is why nodes store their key
    }
  }
}`,
  },
  dryRun: {
    columns: ['op', 'list (recent → old)', 'returns'],
    rows: [
      ['put(1,1)', '1', 'null'],
      ['put(2,2)', '2, 1', 'null'],
      ['get(1)', '1, 2', '1'],
      ['put(3,3)', '3, 1, 2 → evict 2 → 3, 1', 'null'],
      ['get(2)', '3, 1', '-1'],
      ['put(4,4)', '4, 3, 1 → evict 1 → 4, 3', 'null'],
      ['get(1), get(3), get(4)', '… 4, 3 / 3, 4 / 4, 3', '-1, 3, 4'],
    ],
  },
  complexity: { time: 'O(1) average per operation', space: 'O(capacity)', explanation: 'Map operations are O(1) average; linking/unlinking a DLL node is O(1) worst case.' },
  alternative: {
    title: 'JS Map insertion order',
    md: 'A Map already keeps keys in insertion order. Re-inserting a key moves it to the newest end; the first key is the least recently used.',
    code: `class LRUCache {
  constructor(capacity) { this.cap = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);
    return v;
  }
  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.cap) this.map.delete(this.map.keys().next().value);
  }
}`,
    complexity: 'O(1) average per operation, O(capacity) space',
  },
  mistakes: [
    'Not refreshing recency on `get`.',
    'Updating an existing key without moving it to the front.',
    'Evicting before inserting when the key already exists (evicts a key needlessly).',
    'Forgetting to delete the evicted key from the Map.',
  ],
};
