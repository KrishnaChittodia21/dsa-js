// 2·10^5 pseudo-random get/put calls on capacity 10^4; expected values come from frequency buckets (Map of freq → insertion-ordered Set).
const bigLfuOps = () => {
  let s = 9; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const cap = 10000, val = new Map(), fr = new Map(), b = new Map();
  let minF = 0;
  const add = (key, f) => { fr.set(key, f); if (!b.has(f)) b.set(f, new Set()); b.get(f).add(key); };
  const touch = (key) => {
    const f = fr.get(key), bucket = b.get(f);
    bucket.delete(key);
    if (!bucket.size) { b.delete(f); if (minF === f) minF = f + 1; }
    add(key, f + 1);
  };
  const ops = ['LFUCache'], args = [[cap]], expected = [null];
  for (let i = 0; i < 199999; i++) {
    const key = rnd(3) ? rnd(12000) : rnd(100001);
    if (rnd(2)) {
      ops.push('get'); args.push([key]);
      if (val.has(key)) { touch(key); expected.push(val.get(key)); } else expected.push(-1);
    } else {
      const v = rnd(1000000001);
      ops.push('put'); args.push([key, v]); expected.push(null);
      if (val.has(key)) { val.set(key, v); touch(key); continue; }
      if (val.size === cap) {
        const bucket = b.get(minF), ev = bucket.values().next().value;
        bucket.delete(ev); if (!bucket.size) b.delete(minF);
        val.delete(ev); fr.delete(ev);
      }
      val.set(key, v); add(key, 1); minF = 1;
    }
  }
  return { ops, args, expected };
};

export default {
  id: 'lfu-cache',
  title: 'LFU Cache',
  difficulty: 'Hard',
  order: 2,
  pattern: 'linked-list-cache-design',
  kind: 'design',
  tags: ['design', 'hash map', 'doubly linked list'],
  source: { platform: 'LeetCode', number: 460, url: 'https://leetcode.com/problems/lfu-cache/' },

  statement: `Design a **Least Frequently Used (LFU)** cache with a fixed \`capacity\`:

- \`new LFUCache(capacity)\`
- \`get(key)\` — return the value if present, else \`-1\`. A successful get increases the key's **use counter** by 1.
- \`put(key, value)\` — update the value if the key exists (counts as a use), otherwise insert it with use counter 1. If inserting a new key would exceed \`capacity\`, first evict the key with the **smallest use counter**; if several keys tie, evict the **least recently used** among them.

Both operations must run in **O(1)** average time.`,
  examples: [
    {
      input: 'ops = ["LFUCache","put","put","get","put","get","get","put","get","get","get"]\nargs = [[2],[1,1],[2,2],[1],[3,3],[2],[3],[4,4],[1],[3],[4]]',
      output: '[null,null,null,1,null,-1,3,null,-1,3,4]',
      explanation: 'After get(1), key 1 has count 2 and key 2 has count 1, so put(3) evicts 2. Then keys 1 and 3 both have count 2; 1 was used less recently, so put(4) evicts 1.',
    },
  ],
  constraints: ['1 <= capacity <= 10^4', '0 <= key <= 10^5', '0 <= value <= 10^9', 'At most 2 * 10^5 calls to get and put'],

  think: `- Evicting needs "the smallest frequency" and, within it, "the oldest". What structure gives the oldest key of one frequency in O(1)?
- How do you find the smallest frequency without scanning all frequencies?
- When a key's frequency goes from f to f + 1, when can the minimum frequency change?`,
  patternChallenge: {
    options: ['Min-heap of (freq, time, key)', 'Map key → entry + Map freq → ordered bucket + minFreq', 'Single doubly linked list sorted by frequency', 'Array of counters scanned on eviction'],
    answer: 1,
    explanation: 'A heap costs O(log n) per touch; a single sorted list may need to skip over many equal-frequency nodes; scanning is O(n). Per-frequency buckets that keep recency order (a DLL — or a JS Set, which preserves insertion order) plus a tracked `minFreq` make every step O(1).',
  },
  hints: [
    'Store `keyMap: key → {value, freq}` and `freqMap: freq → Set of keys` (Set insertion order = recency). Track `minFreq`.',
    'On a touch, move the key from bucket f to f + 1; if bucket f is now empty and f === minFreq, increment minFreq. On inserting a new key, evict the first key of bucket minFreq if full, then set minFreq = 1.',
  ],
  approach: `**Brute force:** store (value, freq, lastUsed) per key; on eviction scan all keys for the minimum (freq, lastUsed). O(n) eviction.

**Optimized — frequency buckets:**
- \`keyMap: key → { value, freq }\`.
- \`freqMap: freq → ordered set of keys\` with that frequency, oldest first. Classic solutions use a doubly linked list per frequency; in JS a \`Set\` has the same O(1) add / delete / "first element" behaviour thanks to insertion order.
- \`minFreq\`: smallest frequency present.

**touch(key):** remove key from bucket f (delete the bucket if empty; if it was \`minFreq\`, \`minFreq++\`), add it to bucket f + 1. \`minFreq\` can only rise by exactly 1 here because the key itself now sits at f + 1.

**put new key:** if full, evict \`freqMap.get(minFreq).values().next().value\`. Insert with freq 1 and set \`minFreq = 1\` — a brand-new key always has the lowest frequency.`,

  className: 'LFUCache',
  starterCode: `class LFUCache {
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
    { scenario: 'Example 1', hint: 'The statement\'s sequence: frequencies decide eviction, recency breaks ties.',
      ops: ['LFUCache', 'put', 'put', 'get', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]], expected: [null, null, null, 1, null, -1, 3, null, -1, 3, 4] },
    { scenario: 'Single put then get', hint: 'Capacity 1, one key stored and read back.',
      ops: ['LFUCache', 'put', 'get'], args: [[1], [1, 5], [1]], expected: [null, null, 5] },
    { scenario: 'Get before put', hint: 'A missing key returns -1; later puts still work.',
      ops: ['LFUCache', 'get', 'put', 'get'], args: [[1], [3], [3, 9], [3]], expected: [null, -1, null, 9] },
    { scenario: 'Capacity 1 eviction', hint: 'The second put must evict the first key.',
      ops: ['LFUCache', 'put', 'put', 'get'], args: [[1], [1, 1], [2, 2], [1]], expected: [null, null, null, -1] },
    { scenario: 'Update does not evict', hint: 'Updating an existing key never evicts — only a new key can overflow the cache.',
      ops: ['LFUCache', 'put', 'put', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 10], [1], [2]], expected: [null, null, null, null, 10, 2] },
    { scenario: 'Update increments frequency', hint: 'put on an existing key counts as a use: key 1 reaches count 2, so key 2 is evicted.',
      ops: ['LFUCache', 'put', 'put', 'put', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [1, 2], [2, 2], [3, 3], [1], [2], [3]], expected: [null, null, null, null, null, 2, -1, 3] },
    { scenario: 'Tie broken by recency', hint: 'Both keys have count 2 and key 1 was inserted first, but key 2 was used less recently — breaking ties by insertion time evicts the wrong key.',
      ops: ['LFUCache', 'put', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [2], [1], [3, 3], [2], [1], [3]], expected: [null, null, null, 2, 1, null, -1, 1, 3] },
    { scenario: 'minFreq reset on insert', hint: 'After inserting key 3 the minimum frequency is 1 again — forgetting to reset minFreq evicts the wrong key on the next put.',
      ops: ['LFUCache', 'put', 'put', 'get', 'get', 'get', 'get', 'put', 'put', 'get', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [1], [2], [2], [3, 3], [4, 4], [1], [2], [3], [4]], expected: [null, null, null, 1, 1, 2, 2, null, null, -1, 2, -1, 4] },
    { scenario: 'Three keys, frequent survive', hint: 'Keys used more often survive; the count-1 key goes.',
      ops: ['LFUCache', 'put', 'put', 'put', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'get'], args: [[3], [1, 1], [2, 2], [3, 3], [1], [1], [2], [4, 4], [3], [1], [2], [4]], expected: [null, null, null, null, 1, 1, 2, null, -1, 1, 2, 4] },
    { scenario: 'Key and value 0', hint: '0 is a valid key and value — don\'t treat a stored 0 as "missing".',
      ops: ['LFUCache', 'put', 'get', 'put', 'get', 'get'], args: [[1], [0, 0], [0], [1, 1], [0], [1]], expected: [null, null, 0, null, -1, 1] },
    { scenario: 'Miss does not count as use', hint: 'get on a missing key must not create it or change frequencies.',
      ops: ['LFUCache', 'put', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [7], [3, 3], [1], [2], [3]], expected: [null, null, null, -1, null, -1, 2, 3] },
    { scenario: 'Mixed sequence (capacity 3)', hint: 'A pseudo-random mix of 60 gets and puts over 6 keys.',
      ops: ['LFUCache', 'put', 'put', 'put', 'get', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'put', 'put', 'put', 'put', 'get', 'put', 'put', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'get', 'get', 'put', 'put', 'put'], args: [[3], [0, 489], [1, 415], [0, 808], [5], [1, 157], [1, 257], [4], [5, 631], [4], [4, 650], [5], [5], [2], [1], [5], [5, 525], [2, 441], [4, 774], [2, 658], [5, 580], [1], [2, 326], [5, 197], [1], [2], [1], [3], [4, 86], [4], [3], [5], [3, 550], [2, 235], [3], [0, 621], [3], [2], [1], [4], [4], [4, 495], [3, 677], [2, 246], [0], [3, 478], [3], [1, 435], [3], [2], [5], [5], [5], [3, 53], [1], [2], [5], [4], [3, 681], [5, 516], [5, 909]], expected: [null, null, null, null, -1, null, null, -1, null, -1, null, -1, -1, -1, 257, -1, null, null, null, null, null, 257, null, null, 257, -1, 257, -1, null, 86, -1, -1, null, null, -1, null, -1, -1, 257, 86, 86, null, null, null, -1, null, 478, null, 478, -1, -1, -1, -1, null, 435, -1, -1, 495, null, null, null] },
    { scenario: 'Mixed sequence (capacity 5)', hint: 'A pseudo-random mix of 80 gets and puts over 10 keys.',
      ops: ['LFUCache', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'put', 'get', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'put', 'put', 'get', 'get', 'get', 'put', 'put', 'get', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'get', 'get', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'put', 'get', 'get', 'put', 'put', 'put', 'get', 'put', 'get', 'get', 'get', 'put', 'put', 'put', 'put'], args: [[5], [0, 541], [4, 971], [2, 587], [3], [4], [1, 211], [0, 540], [5], [7, 205], [7], [2], [0], [1, 503], [1], [8, 868], [2, 118], [0], [2], [0, 186], [1, 307], [8, 122], [8, 455], [6, 537], [9, 202], [7], [8], [8], [1, 34], [1, 200], [5], [3], [3], [6], [5], [7], [2, 823], [0], [0], [7, 148], [4, 279], [9, 665], [0], [4], [3, 473], [1, 459], [8, 699], [4, 120], [8], [0, 367], [9], [4], [3], [9], [4], [8, 636], [9], [3], [6, 688], [1, 257], [2, 67], [4], [0], [1, 314], [7, 243], [0, 745], [2, 258], [8], [5], [7, 267], [5, 390], [1, 380], [3], [7, 908], [3], [4], [6], [2, 221], [6, 781], [2, 266], [1, 555]], expected: [null, null, null, null, -1, 971, null, null, -1, null, 205, 587, 540, null, 503, null, null, 540, 118, null, null, null, null, null, null, -1, 455, 455, null, null, -1, -1, -1, -1, -1, -1, null, 186, 186, null, null, null, 186, -1, null, null, null, null, 699, null, -1, 120, -1, -1, 120, null, -1, -1, null, null, null, -1, 367, null, null, null, null, 636, -1, null, null, null, -1, null, -1, -1, -1, null, null, null, null] },
    { scenario: 'Large (2·10^5 calls)', hint: 'Scanning all 10^4 keys to find the least frequent one on every eviction is ~10^9 steps here. Keep a bucket per frequency plus minFreq so eviction is O(1).', opsGen: String(bigLfuOps), timeLimitMs: 1000 },
  ],

  solution: {
    code: `class LFUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.keyMap = new Map();   // key -> { value, freq }
    this.freqMap = new Map();  // freq -> Set of keys (insertion order = least recent first)
    this.minFreq = 0;
  }

  _touch(key, entry) {
    const f = entry.freq;
    const bucket = this.freqMap.get(f);
    bucket.delete(key);
    if (bucket.size === 0) {
      this.freqMap.delete(f);
      if (this.minFreq === f) this.minFreq = f + 1;
    }
    entry.freq = f + 1;
    if (!this.freqMap.has(f + 1)) this.freqMap.set(f + 1, new Set());
    this.freqMap.get(f + 1).add(key);
  }

  get(key) {
    const entry = this.keyMap.get(key);
    if (!entry) return -1;
    this._touch(key, entry);
    return entry.value;
  }

  put(key, value) {
    if (this.cap === 0) return;
    const entry = this.keyMap.get(key);
    if (entry) {
      entry.value = value;
      this._touch(key, entry);
      return;
    }
    if (this.keyMap.size >= this.cap) {
      const bucket = this.freqMap.get(this.minFreq);
      const victim = bucket.values().next().value; // least recent among least frequent
      bucket.delete(victim);
      if (bucket.size === 0) this.freqMap.delete(this.minFreq);
      this.keyMap.delete(victim);
    }
    this.keyMap.set(key, { value, freq: 1 });
    if (!this.freqMap.has(1)) this.freqMap.set(1, new Set());
    this.freqMap.get(1).add(key);
    this.minFreq = 1;
  }
}`,
    explanation: 'A Set per frequency plays the role of the per-frequency doubly linked list: add appends to the "most recent" end, delete removes in O(1), and the first value is the least recent.',
  },
  dryRun: {
    columns: ['op', 'buckets (freq: keys old→new)', 'minFreq', 'returns'],
    rows: [
      ['put(1,1)', '1:{1}', '1', 'null'],
      ['put(2,2)', '1:{1,2}', '1', 'null'],
      ['get(1)', '1:{2} 2:{1}', '1', '1'],
      ['put(3,3)', 'evict 2 → 1:{3} 2:{1}', '1', 'null'],
      ['get(2)', 'unchanged', '1', '-1'],
      ['get(3)', '2:{1,3}', '2', '3'],
      ['put(4,4)', 'evict 1 → 1:{4} 2:{3}', '1', 'null'],
      ['get(1), get(3), get(4)', '1:{} 2:{4} 3:{3} …', '2', '-1, 3, 4'],
    ],
  },
  complexity: { time: 'O(1) average per operation', space: 'O(capacity)', explanation: 'Every step is a constant number of Map/Set operations; there is at most one bucket entry per key.' },
  alternative: {
    title: 'Per-frequency doubly linked lists',
    md: 'The language-agnostic version: `freqMap: freq → DLL` with sentinels, nodes storing key/value/freq. Touch = unlink from list f, push to the front of list f + 1; evict = remove the tail of list minFreq. Same O(1) bounds; this is the version to describe in languages without ordered hash sets.',
    complexity: 'O(1) per operation, O(capacity) space',
  },
  mistakes: [
    'Forgetting to reset `minFreq = 1` after inserting a new key.',
    'Evicting when updating an existing key (only new keys can overflow).',
    'Breaking ties by insertion time instead of most recent use.',
    'Not handling capacity 0 (LeetCode allows it in some versions).',
  ],
};
