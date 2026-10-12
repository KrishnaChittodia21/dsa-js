export default {
  id: 'time-based-key-value-store',
  title: 'Time Based Key-Value Store',
  difficulty: 'Medium',
  order: 8,
  pattern: 'binary-search-boundary',
  tags: ['design', 'hash map', 'binary search'],
  source: { platform: 'LeetCode', number: 981, url: 'https://leetcode.com/problems/time-based-key-value-store/' },
  kind: 'design',

  statement: `Design a key-value store that remembers **every version** of a value with its timestamp.

Implement \`TimeMap\`:
- \`new TimeMap()\` — empty store.
- \`set(key, value, timestamp)\` — store \`value\` for \`key\` at time \`timestamp\`.
- \`get(key, timestamp)\` — return the value stored for \`key\` with the **largest timestamp ≤ timestamp**. If there is none, return \`""\`.

For every key, \`set\` is called with **strictly increasing** timestamps.`,
  examples: [
    {
      input: '["TimeMap","set","get","get","set","get","get"]\n[[],["foo","bar",1],["foo",1],["foo",3],["foo","bar2",4],["foo",4],["foo",5]]',
      output: '[null,null,"bar","bar",null,"bar2","bar2"]',
      explanation: 'get("foo", 3): the latest version at or before time 3 is the one set at time 1.',
    },
  ],
  constraints: ['1 <= key.length, value.length <= 100', '1 <= timestamp <= 10^7', 'Timestamps for set are strictly increasing per key', 'At most 2 · 10^5 calls'],

  think: `- Because timestamps arrive in increasing order, what does each key's list of versions look like?
- "Largest timestamp ≤ t" — is that a lower bound, an upper bound, or something derived from one?`,
  patternChallenge: {
    options: ['Map of key → sorted versions + binary search (upper bound − 1)', 'Map of key → Map of timestamp → value, scan downward from t', 'Min-heap per key', 'Trie of keys'],
    answer: 0,
    explanation: 'Appending in increasing time keeps each key\'s list sorted for free. The answer is the last version with time ≤ t = (first version with time > t) − 1. Scanning down from t can take 10^7 steps per query; a heap does not support "floor" queries.',
  },
  hints: [
    'Store `Map<key, Array<[timestamp, value]>>`. `set` is just `push` — the list stays sorted.',
    'In `get`, binary search for the first index whose timestamp is > t; the answer is at index − 1 (or "" if that is −1).',
  ],
  approach: `**Brute force:** on \`get\`, scan the key's versions from the newest backwards until a timestamp ≤ t — O(v) per query.

**Optimized:**
- \`set\`: \`map.get(key).push([timestamp, value])\` — O(1) amortized; the array is sorted because timestamps increase.
- \`get\`: upper-bound search: first index \`i\` with \`times[i] > t\`. If \`i === 0\` nothing is old enough → \`""\`; else return the value at \`i − 1\`. O(log v).`,

  className: 'TimeMap',
  paramNames: [],
  starterCode: `class TimeMap {
  constructor() {
    
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {number} timestamp
   * @return {void}
   */
  set(key, value, timestamp) {
    
  }

  /**
   * @param {string} key
   * @param {number} timestamp
   * @return {string}
   */
  get(key, timestamp) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: get(foo, 3) returns the version set at time 1.', ops: ['TimeMap', 'set', 'get', 'get', 'set', 'get', 'get'], args: [[], ['foo', 'bar', 1], ['foo', 1], ['foo', 3], ['foo', 'bar2', 4], ['foo', 4], ['foo', 5]], expected: [null, null, 'bar', 'bar', null, 'bar2', 'bar2'] },
    { scenario: 'Missing key', hint: 'A key that was never set returns "", not undefined.', ops: ['TimeMap', 'get'], args: [[], ['missing', 10]], expected: [null, ''] },
    { scenario: 'Too early timestamp', hint: 'Asking before the first version returns "". A lower bound (first ≥ t) would wrongly return "x" from the future.', ops: ['TimeMap', 'set', 'get', 'get'], args: [[], ['a', 'x', 5], ['a', 4], ['a', 5]], expected: [null, null, '', 'x'] },
    { scenario: 'Between versions', hint: 'Timestamp 15 falls between 10 and 20: return the version from 10 (largest ≤ 15).', ops: ['TimeMap', 'set', 'set', 'set', 'get', 'get', 'get', 'get'], args: [[], ['k', 'v1', 10], ['k', 'v2', 20], ['k', 'v3', 30], ['k', 9], ['k', 15], ['k', 30], ['k', 1000]], expected: [null, null, null, null, '', 'v1', 'v3', 'v3'] },
    { scenario: 'Keys are independent', hint: 'Versions of "a" must not leak into "b".', ops: ['TimeMap', 'set', 'set', 'get', 'get', 'get'], args: [[], ['a', 'A', 1], ['b', 'B', 2], ['a', 2], ['b', 1], ['b', 2]], expected: [null, null, null, 'A', '', 'B'] },
    { scenario: 'Many versions, upper bound', hint: 'Four versions: 24 → "low" (set at 20), 39 → "mid" (set at 25). Off-by-one in the binary search picks a neighbour.', ops: ['TimeMap', 'set', 'set', 'set', 'set', 'get', 'get'], args: [[], ['love', 'high', 10], ['love', 'low', 20], ['love', 'mid', 25], ['love', 'end', 40], ['love', 24], ['love', 39]], expected: [null, null, null, null, null, 'low', 'mid'] },
    { scenario: 'Exact timestamp matches', hint: 'get at exactly each set time returns that version.', ops: ['TimeMap', 'set', 'set', 'set', 'get', 'get', 'get'], args: [[], ['t', 'one', 1], ['t', 'two', 2], ['t', 'three', 3], ['t', 1], ['t', 2], ['t', 3]], expected: [null, null, null, null, 'one', 'two', 'three'] },
    { scenario: 'Same value, new version', hint: 'The same value can be stored again at a later time; versions are kept by timestamp.', ops: ['TimeMap', 'set', 'set', 'set', 'get', 'get'], args: [[], ['x', 'v', 1], ['x', 'w', 5], ['x', 'v', 9], ['x', 6], ['x', 9]], expected: [null, null, null, null, 'w', 'v'] },
    { scenario: 'Extreme timestamps', hint: 'Timestamps 1 and 10^7, the allowed bounds.', ops: ['TimeMap', 'set', 'set', 'get', 'get', 'get'], args: [[], ['e', 'first', 1], ['e', 'last', 10000000], ['e', 1], ['e', 9999999], ['e', 10000000]], expected: [null, null, null, 'first', 'first', 'last'] },
    { scenario: 'Get before any set', hint: 'A get on a key, then a set, then a get again: the first returns "".', ops: ['TimeMap', 'get', 'set', 'get'], args: [[], ['z', 3], ['z', 'zz', 2], ['z', 3]], expected: [null, '', null, 'zz'] },
    { scenario: 'Mixed sequence (3 keys)', hint: 'A pseudo-random mix of sets and gets over three keys.', ops: ['TimeMap', 'set', 'get', 'set', 'set', 'get', 'get', 'get', 'set', 'get', 'set', 'get', 'get', 'get', 'get', 'get', 'set', 'get', 'get', 'get', 'set', 'set', 'set', 'get', 'get', 'set', 'set', 'get', 'set', 'get', 'set', 'set', 'get', 'get', 'set', 'get', 'get', 'set', 'get', 'get', 'set', 'set', 'get', 'set', 'set', 'get', 'set', 'set', 'get', 'set', 'get', 'set', 'get', 'set', 'get', 'get', 'set', 'set', 'set', 'set', 'get'], args: [[], ['ccc', 'ccc5', 5], ['bb', 33], ['a', 'a1', 1], ['bb', 'bb1', 1], ['bb', 28], ['a', 19], ['a', 6], ['bb', 'bb2', 2], ['bb', 5], ['a', 'a2', 2], ['a', 14], ['ccc', 9], ['a', 30], ['a', 31], ['a', 32], ['bb', 'bb5', 5], ['bb', 19], ['a', 13], ['ccc', 30], ['a', 'a5', 5], ['ccc', 'ccc10', 10], ['ccc', 'ccc13', 13], ['a', 11], ['a', 9], ['bb', 'bb7', 7], ['ccc', 'ccc14', 14], ['a', 22], ['a', 'a10', 10], ['ccc', 7], ['a', 'a11', 11], ['bb', 'bb12', 12], ['ccc', 24], ['a', 34], ['ccc', 'ccc15', 15], ['ccc', 11], ['bb', 27], ['ccc', 'ccc16', 16], ['bb', 4], ['a', 19], ['bb', 'bb15', 15], ['bb', 'bb18', 18], ['bb', 22], ['bb', 'bb20', 20], ['a', 'a13', 13], ['bb', 31], ['a', 'a17', 17], ['a', 'a20', 20], ['a', 28], ['a', 'a22', 22], ['bb', 39], ['ccc', 'ccc18', 18], ['a', 17], ['ccc', 'ccc20', 20], ['bb', 34], ['ccc', 29], ['bb', 'bb22', 22], ['a', 'a26', 26], ['a', 'a30', 30], ['bb', 'bb26', 26], ['a', 29]], expected: [null, null, '', null, null, 'bb1', 'a1', 'a1', null, 'bb2', null, 'a2', 'ccc5', 'a2', 'a2', 'a2', null, 'bb5', 'a2', 'ccc5', null, null, null, 'a5', 'a5', null, null, 'a5', null, 'ccc5', null, null, 'ccc14', 'a11', null, 'ccc10', 'bb12', null, 'bb2', 'a11', null, null, 'bb18', null, null, 'bb20', null, null, 'a20', null, 'bb20', null, 'a17', null, 'bb20', 'ccc20', null, null, null, null, 'a26'] },
    { scenario: 'Large, 10^5 versions', hint: '10^5 versions of one key, then 10^5 gets. Scanning versions linearly is O(v) per get; binary search is O(log v).', opsGen: '() => { const N = 100000, ops = [\'TimeMap\'], args = [[]], expected = [null]; for (let i = 1; i <= N; i++) { ops.push(\'set\'); args.push([\'key\', \'v\' + i, i * 10]); expected.push(null); } for (let i = 1; i <= N; i++) { ops.push(\'get\'); args.push([\'key\', i * 10 + 5]); expected.push(\'v\' + i); } return { ops, args, expected }; }', timeLimitMs: 1000 },
  ],

  solution: {
    code: `class TimeMap {
  constructor() {
    this.store = new Map(); // key → { times: number[], values: string[] }
  }

  set(key, value, timestamp) {
    if (!this.store.has(key)) this.store.set(key, { times: [], values: [] });
    const entry = this.store.get(key);
    entry.times.push(timestamp);   // timestamps increase → stays sorted
    entry.values.push(value);
  }

  get(key, timestamp) {
    const entry = this.store.get(key);
    if (!entry) return '';
    const { times, values } = entry;
    // first index with times[i] > timestamp (upper bound)
    let lo = 0, hi = times.length;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (times[mid] > timestamp) hi = mid;
      else lo = mid + 1;
    }
    return lo === 0 ? '' : values[lo - 1];
  }
}`,
    explanation: 'Two parallel arrays avoid allocating a small [time, value] array per set and keep the search loop reading plain numbers.',
  },
  dryRun: `After set(k,v1,10), set(k,v2,20), set(k,v3,30): \`times = [10,20,30]\`.

| get(k, t) | upper bound (first > t) | answer |
|---|---|---|
| 9 | 0 | "" |
| 15 | 1 | values[0] = v1 |
| 30 | 3 | values[2] = v3 |`,
  complexity: { time: 'set O(1) amortized, get O(log v)', space: 'O(total sets)', explanation: 'v = number of versions of that key.' },
  alternative: {
    title: 'Linear scan from newest',
    md: 'Walk the versions from the end until one has time ≤ t. O(v) per get; fine if queries are mostly for the latest time, but worst case too slow.',
    complexity: 'set O(1), get O(v)',
  },
  mistakes: [
    'Using lower bound (first ≥ t) and returning that index — gives a version from the future when no exact match exists.',
    'Returning `undefined` instead of `""` when nothing is old enough or the key is missing.',
    'Sorting on every set — unnecessary because timestamps are increasing.',
  ],
};
