export default {
  signals: [
    '"longest consecutive sequence" in O(n) on unsorted input',
    '"isomorphic" / "word pattern" / "same structure" → two-way mapping',
    '"first unique" / "first non-repeating" → count, then a second ordered pass',
    '"number of good pairs" / "count pairs with equal X" → add the running count',
    '"equal row and column pairs" → serialise a row as a key',
    '"insert / delete / getRandom in O(1)"',
    '"least recently used" → a Map already remembers insertion order',
  ],
  tricks: [
    {
      title: 'Longest consecutive run: only start at the run\'s first value',
      kind: 'recognition',
      md: 'Put all numbers in a `Set`. Start counting upward from `x` **only if `x − 1` is not in the set** — that means `x` begins a run. Every number is then visited by at most one counting walk, so the whole thing is O(n) even though there is a `while` inside the `for`.',
      code: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue; // not the start of a run
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}
console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4`,
    },
    {
      title: 'Bijections need two maps',
      kind: 'edge-cases',
      md: 'For "isomorphic strings" or "word pattern", one map a → b only proves that each a has one partner. You must also reject two different a\'s mapping to the same b. Keep a second map (or a `Set` of used targets) and check both directions on every step.',
      code: `function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;
  const st = new Map(), ts = new Map();
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = t[i];
    if ((st.has(a) && st.get(a) !== b) || (ts.has(b) && ts.get(b) !== a)) return false;
    st.set(a, b);
    ts.set(b, a);
  }
  return true;
}
console.log(isIsomorphic('egg', 'add'), isIsomorphic('badc', 'baba')); // true false`,
    },
    {
      title: 'Map keys compare by reference (except primitives)',
      kind: 'javascript',
      md: '`Map` uses SameValueZero: primitives compare by value (and `NaN` even matches `NaN`), but arrays and objects compare by **identity**. `map.get([1, 2])` never finds a key set with a different `[1, 2]` literal. Build a primitive key instead — a joined string, or a single number when the parts are small integers.',
      code: `const m = new Map();
m.set([1, 2], 'a');
console.log(m.get([1, 2]));      // undefined — different array object
m.set(1 + ',' + 2, 'b');
console.log(m.get([1, 2].join(','))); // b
m.set(NaN, 'nan');
console.log(m.get(NaN));         // nan`,
    },
    {
      title: 'Encode small integer pairs as one number',
      kind: 'optimization',
      md: 'For grid cells or pairs of bounded ints, `key = r * COLS + c` (or `a * 100003 + b`) is cheaper than building the string `"r,c"` on every lookup: no allocation, no string hashing. Make sure the multiplier exceeds the largest second value and the product stays below 2^53.',
      code: `const COLS = 1000;
const seen = new Set();
const key = (r, c) => r * COLS + c;
seen.add(key(3, 7));
console.log(seen.has(key(3, 7)), seen.has(key(7, 3))); // true false`,
    },
    {
      title: 'Anagram key by counting, not sorting',
      kind: 'template',
      md: 'Sorting each word to build a group key costs O(L log L). For lowercase letters, count into a 26-slot array and join the counts with a separator: O(L) per word. The separator matters — without it, counts like `1,11` and `11,1` would collide.',
      code: `function anagramKey(word) {
  const cnt = new Array(26).fill(0);
  for (let i = 0; i < word.length; i++) cnt[word.charCodeAt(i) - 97]++;
  return cnt.join('#');
}
const groups = new Map();
for (const w of ['eat', 'tea', 'tan', 'ate', 'nat']) {
  const k = anagramKey(w);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(w);
}
console.log([...groups.values()]); // [ [ 'eat', 'tea', 'ate' ], [ 'tan', 'nat' ] ]`,
    },
    {
      title: 'Count equal pairs in one pass by adding the running count',
      kind: 'template',
      md: 'To count pairs i < j with the same key, process items left to right and add "how many earlier items had this key" before incrementing it. Each new item pairs with every earlier match exactly once, so you get the total without the n·(n−1)/2 formula per group or a nested loop.',
      code: `function goodPairs(nums) {
  const seen = new Map();
  let pairs = 0;
  for (const x of nums) {
    pairs += seen.get(x) ?? 0;
    seen.set(x, (seen.get(x) ?? 0) + 1);
  }
  return pairs;
}
console.log(goodPairs([1, 2, 3, 1, 1, 3])); // 4`,
    },
    {
      title: 'Never use || to default a stored index or count',
      kind: 'edge-cases',
      md: 'If a Map can hold `0` (index 0, a zero count, an empty string), `map.get(k) || fallback` treats that real 0 as "missing". Use `??`, which only falls back on `undefined`/`null`, or test with `map.has(k)` first.',
      code: `const firstIdx = new Map([['a', 0]]);
console.log(firstIdx.get('a') || -1); // -1  (wrong!)
console.log(firstIdx.get('a') ?? -1); // 0   (right)
console.log(firstIdx.get('z') ?? -1); // -1`,
    },
    {
      title: 'Plain objects turn keys into strings and reorder them',
      kind: 'javascript',
      md: 'Object keys are always strings (or symbols): `obj[1]` and `obj["1"]` are the same slot, and `Object.keys` returns strings, so `key + 1` concatenates. Integer-like keys are also listed in ascending order, not insertion order. A `Map` keeps the real key type and insertion order.',
      code: `const obj = {};
obj[10] = 'x'; obj[2] = 'y'; obj.b = 'z';
console.log(Object.keys(obj));         // [ '2', '10', 'b' ]
console.log(Object.keys(obj)[0] + 1);  // 21 (string concat)
const m = new Map([[10, 'x'], [2, 'y']]);
console.log([...m.keys()]);            // [ 10, 2 ]`,
    },
    {
      title: 'Insertion order makes Map a tiny LRU',
      kind: 'javascript',
      md: 'A `Map` iterates in insertion order, and re-setting an existing key does **not** move it. So "touch" a key with `delete` + `set` to move it to the newest end, and evict `map.keys().next().value` — the oldest. That is an O(1) LRU cache without writing a linked list (still learn the list version for interviews).',
      code: `const cache = new Map();
const cap = 2;
function put(k, v) {
  cache.delete(k);
  cache.set(k, v);
  if (cache.size > cap) cache.delete(cache.keys().next().value);
}
put('a', 1); put('b', 2); put('a', 3); put('c', 4);
console.log([...cache.keys()]); // [ 'a', 'c' ]  — 'b' was least recent`,
    },
    {
      title: 'Explain the hash-table worst case in one sentence',
      kind: 'interview',
      md: 'Say "O(1) **average** per operation; O(n) worst case if many keys collide, which a good hash function and resizing make unlikely". Interviewers rarely want collision-resolution details (chaining vs open addressing), but they do notice when you call hashing "guaranteed O(1)".',
    },
  ],
  traps: [
    {
      looksLike: 'Hash map of seen values for a pair sum',
      actually: 'Two pointers',
      why: 'if the input is already sorted and O(1) extra space is requested, opposite-end pointers solve it without any map.',
    },
    {
      looksLike: 'Hash set to find the duplicate',
      actually: 'Floyd cycle detection or index marking',
      why: 'when values are 1..n and you may not use extra space (or modify the array), the array itself is the "hash table".',
    },
    {
      looksLike: 'Store [r, c] arrays in a Set to mark visited cells',
      actually: 'Store a string or numeric key',
      why: 'Set membership on arrays checks object identity, so set.has([r, c]) is always false for a freshly built pair.',
    },
  ],
  sources: [
    { label: 'MDN — Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' },
    { label: 'Tech Interview Handbook — Hash table cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/hash-table/' },
  ],
};
