// "JavaScript for DSA" reference: only the parts of the language that matter when
// solving algorithm problems, each with its real cost and the traps that cost people
// accepted solutions. Complexities assume a modern engine (V8 in Chrome / Node).

export const JS_SECTIONS = [
  // ================================================================ Arrays
  {
    id: 'arrays',
    title: 'Arrays',
    intro: `A JavaScript array is a **dynamic array**: a block of slots that grows by itself. Reading or writing \`arr[i]\` is **O(1)** because the engine computes where slot \`i\` lives directly.

The one rule to remember: **the end is cheap, the front is expensive.** Adding or removing at the end touches one slot. Adding or removing at the front (or middle) forces every later element to move one position, which is **O(n)**.

Many methods **mutate** the array (\`push\`, \`pop\`, \`shift\`, \`unshift\`, \`splice\`, \`sort\`, \`reverse\`, \`fill\`), while others return a **new** array (\`slice\`, \`map\`, \`filter\`, \`concat\`, \`toSorted\`). Mixing them up is a very common bug.`,
    items: [
      {
        name: 'push',
        signature: 'arr.push(...items)',
        description: 'Adds items to the **end** and returns the new length. When the hidden capacity runs out, the engine allocates a bigger block (about double) and copies, which is rare enough that the average cost stays constant (*amortized*).',
        complexity: 'O(1) amortized per item',
        example: `const st = [1, 2];
st.push(3);        // → 3 (new length)
st;                // → [1, 2, 3]
st.push(4, 5);     // → 5`,
        dsaUse: 'Stack push, building result arrays, BFS queue enqueue.',
        pitfall: 'It returns the **length**, not the array: `return arr.push(x)` returns a number.',
      },
      {
        name: 'pop',
        signature: 'arr.pop()',
        description: 'Removes and returns the **last** element (`undefined` if empty). Nothing else moves.',
        complexity: 'O(1)',
        example: `const st = [1, 2, 3];
st.pop();   // → 3
st;         // → [1, 2]
[].pop();   // → undefined`,
        dsaUse: 'Stack pop, backtracking "undo the last choice".',
      },
      {
        name: 'shift',
        signature: 'arr.shift()',
        description: 'Removes and returns the **first** element. Every remaining element slides one slot left to fill index 0.',
        complexity: 'O(n)',
        example: `const q = [1, 2, 3];
q.shift();  // → 1
q;          // → [2, 3]`,
        dsaUse: 'Tiny queues only. For BFS use a head index or the toolkit `Queue`.',
        pitfall: 'A BFS loop that calls `shift()` on a large queue is secretly **O(n²)**. Use `for (let head = 0; head < q.length; head++)` instead.',
      },
      {
        name: 'unshift',
        signature: 'arr.unshift(...items)',
        description: 'Inserts items at the **front** and returns the new length. Every existing element moves right.',
        complexity: 'O(n + k) for k inserted items',
        example: `const a = [3, 4];
a.unshift(1, 2); // → 4
a;               // → [1, 2, 3, 4]`,
        dsaUse: 'Rarely. To build a list in reverse, `push` then `reverse()` once at the end (O(n) total instead of O(n²)).',
        pitfall: 'Calling `unshift` inside a loop makes the loop O(n²).',
      },
      {
        name: 'slice',
        signature: 'arr.slice(start = 0, end = arr.length)',
        description: 'Returns a **new** shallow copy of `arr[start..end)` (end excluded). Negative indices count from the end. Does not mutate.',
        complexity: 'O(k) where k = end − start',
        example: `const a = [10, 20, 30, 40];
a.slice(1, 3);  // → [20, 30]
a.slice(-2);    // → [30, 40]
a.slice();      // → [10, 20, 30, 40] (a copy)
a;              // → unchanged`,
        dsaUse: 'Copying arrays, saving a snapshot of a backtracking path, taking the first k results.',
        pitfall: 'Slicing inside recursion (e.g. `solve(arr.slice(1))`) copies every call: a hidden O(n) per call that can turn O(n) recursion into O(n²). Pass indices instead.',
      },
      {
        name: 'splice',
        signature: 'arr.splice(start, deleteCount, ...items)',
        description: 'Removes `deleteCount` elements at `start`, inserts `items` there, and returns the removed elements. **Mutates.** Everything after `start` has to shift.',
        complexity: 'O(n) (elements after `start` move)',
        example: `const a = [1, 2, 3, 4, 5];
a.splice(1, 2);        // → [2, 3] (removed)
a;                     // → [1, 4, 5]
a.splice(1, 0, 9, 9);  // → [] (insert only)
a;                     // → [1, 9, 9, 4, 5]`,
        dsaUse: 'Inserting into a sorted array after binary search (O(n) per insert; fine for small inputs).',
        pitfall: 'Removing while looping forward skips elements (indices shift under you). Loop backwards, or use `filter`.',
      },
      {
        name: 'sort',
        signature: 'arr.sort(compareFn?) / arr.toSorted(compareFn?)',
        description: `Sorts **in place** and returns the same array. \`compareFn(a, b)\` returns a **negative** number if \`a\` goes first, **positive** if \`b\` goes first, **0** to keep their order.

* **Without a comparator, elements are converted to strings and compared as text** (UTF-16 order), so numbers sort "lexicographically".
* Since ES2019 the sort is **stable**: equal elements keep their original relative order (V8 uses TimSort).
* \`toSorted()\` (ES2023) returns a sorted **copy** and leaves the original alone.`,
        complexity: 'O(n log n) comparisons (O(n) on already-sorted input with TimSort)',
        example: `[10, 9, 1, 100].sort();                // → [1, 10, 100, 9]  (text order!)
[10, 9, 1, 100].sort((a, b) => a - b); // → [1, 9, 10, 100]
[10, 9, 1, 100].sort((a, b) => b - a); // → [100, 10, 9, 1]

// multi-key: by end time, then by start
[[1, 3], [0, 3], [2, 2]].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
// → [[2, 2], [0, 3], [1, 3]]

['banana', 'Apple', 'cherry'].sort();  // → ['Apple', 'banana', 'cherry'] (uppercase first)

const orig = [3, 1, 2];
const sorted = orig.toSorted((a, b) => a - b); // → [1, 2, 3]
orig;                                          // → [3, 1, 2]`,
        dsaUse: 'Sorting intervals, greedy "sort then scan", two pointers on sorted data, grouping anagrams by sorted key.',
        pitfall: 'Returning a boolean (`(a, b) => a > b`) is wrong: `false` is treated as 0 ("equal") and the result is unreliable. Always return a number. `sort` mutates — sort a copy (`[...arr].sort()` or `toSorted()`) if the caller still needs the original order. `a - b` can overflow precision for huge numbers; use `a < b ? -1 : a > b ? 1 : 0` with BigInt or strings.',
      },
      {
        name: 'reverse',
        signature: 'arr.reverse() / arr.toReversed()',
        description: 'Reverses **in place** and returns the same array. `toReversed()` (ES2023) returns a reversed copy.',
        complexity: 'O(n)',
        example: `const a = [1, 2, 3];
a.reverse();       // → [3, 2, 1]
a;                 // → [3, 2, 1] (mutated)
[1, 2, 3].toReversed(); // → [3, 2, 1]`,
        dsaUse: 'Building a path backwards (parent pointers) then reversing once; reversing a string via `[...s].reverse().join("")`.',
        pitfall: '`const r = arr.reverse()` also reverses `arr` — both names point to the same array.',
      },
      {
        name: 'map',
        signature: 'arr.map((value, index, array) => newValue)',
        description: 'Returns a **new** array of the same length with each element transformed.',
        complexity: 'O(n)',
        example: `[1, 2, 3].map((x) => x * x);        // → [1, 4, 9]
['a', 'b'].map((ch, i) => ch + i);  // → ['a0', 'b1']
['1', '2', '3'].map(Number);        // → [1, 2, 3]`,
        dsaUse: 'Converting input (strings → numbers), pairing values with indices before sorting: `nums.map((v, i) => [v, i])`.',
        pitfall: '`["1","2","3"].map(parseInt)` gives `[1, NaN, NaN]` because `map` passes the index as `parseInt`\'s radix. `map` also **skips holes**: `new Array(3).map(() => 0)` is still `[ <3 empty items> ]`.',
      },
      {
        name: 'filter',
        signature: 'arr.filter((value, index) => keep)',
        description: 'Returns a **new** array with only the elements whose callback returns a truthy value.',
        complexity: 'O(n)',
        example: `[1, 2, 3, 4].filter((x) => x % 2 === 0); // → [2, 4]
[0, 1, '', 'a', null].filter(Boolean);    // → [1, 'a']`,
        dsaUse: 'Removing elements without index bugs, pre-filtering candidates.',
        pitfall: '`filter(Boolean)` also drops `0`, which is often a valid value in DSA.',
      },
      {
        name: 'reduce',
        signature: 'arr.reduce((acc, value, index) => nextAcc, initial)',
        description: 'Folds the array into one value by carrying an accumulator from left to right.',
        complexity: 'O(n) (if the callback is O(1))',
        example: `[1, 2, 3, 4].reduce((sum, x) => sum + x, 0);          // → 10
[3, 9, 2].reduce((m, x) => Math.max(m, x), -Infinity); // → 9
['a', 'b', 'a'].reduce((cnt, ch) => {
  cnt[ch] = (cnt[ch] || 0) + 1;
  return cnt;
}, {});                                                // → { a: 2, b: 1 }`,
        dsaUse: 'Sums, max/min of huge arrays (safe where `Math.max(...arr)` crashes), building frequency maps.',
        pitfall: 'Without an initial value, `[].reduce(fn)` throws a TypeError. Spreading inside the callback (`(acc, x) => [...acc, x]`) copies every step: O(n²).',
      },
      {
        name: 'find / findIndex',
        signature: 'arr.find(pred) / arr.findIndex(pred) / findLast / findLastIndex',
        description: '`find` returns the first element matching the predicate (or `undefined`); `findIndex` returns its index (or `-1`). `findLast`/`findLastIndex` search from the end. They stop at the first match.',
        complexity: 'O(n) worst case',
        example: `const a = [5, 12, 8, 130];
a.find((x) => x > 10);        // → 12
a.findIndex((x) => x > 10);   // → 1
a.findIndex((x) => x > 999);  // → -1
a.findLast((x) => x > 10);    // → 130`,
        dsaUse: 'Small lookups. In a loop, a Map/Set lookup is O(1) instead.',
        pitfall: '`find` inside a loop over the same array makes the algorithm O(n²). `if (arr.find(...))` is falsy when the found element is `0` — compare with `!== undefined`.',
      },
      {
        name: 'some / every',
        signature: 'arr.some(pred) / arr.every(pred)',
        description: '`some` is true if **any** element matches; `every` is true if **all** match. Both stop early (short-circuit).',
        complexity: 'O(n) worst case',
        example: `[1, 3, 4].some((x) => x % 2 === 0);  // → true
[1, 3, 5].every((x) => x % 2 === 1); // → true
[].every((x) => false);              // → true (vacuously)
[].some((x) => true);                // → false`,
        dsaUse: 'Validity checks (all rows valid, any neighbour unvisited).',
        pitfall: '`every` on an empty array is `true` — make sure that matches your problem.',
      },
      {
        name: 'includes / indexOf',
        signature: 'arr.includes(x) / arr.indexOf(x) / arr.lastIndexOf(x)',
        description: 'Linear scan for a value using strict equality. `includes` returns a boolean; `indexOf` returns the first index or `-1`.',
        complexity: 'O(n)',
        example: `const a = [1, 2, NaN];
a.includes(2);    // → true
a.indexOf(2);     // → 1
a.indexOf(7);     // → -1
a.includes(NaN);  // → true
a.indexOf(NaN);   // → -1  (indexOf uses ===, and NaN !== NaN)
[[1, 2]].includes([1, 2]); // → false (different array objects)`,
        dsaUse: 'Tiny arrays only. Membership inside a loop should use a `Set` (O(1) average).',
        pitfall: '`if (arr.indexOf(x))` is wrong — index `0` is falsy and `-1` is truthy. Use `!== -1` or `includes`.',
      },
      {
        name: 'flat',
        signature: 'arr.flat(depth = 1) / arr.flatMap(fn)',
        description: 'Returns a new array with sub-arrays concatenated into it, up to `depth` levels. `flatMap` is `map` followed by `flat(1)`.',
        complexity: 'O(total number of elements produced)',
        example: `[1, [2, [3, [4]]]].flat();         // → [1, 2, [3, [4]]]
[1, [2, [3, [4]]]].flat(Infinity); // → [1, 2, 3, 4]
[[1, 2], [3]].flat();              // → [1, 2, 3]
[1, 2].flatMap((x) => [x, x * 10]); // → [1, 10, 2, 20]`,
        dsaUse: 'Flattening a matrix to scan it once, flattening grouped results (`Object.values(groups).flat()`).',
        pitfall: 'Default depth is **1**, not "fully flat".',
      },
      {
        name: 'Array.from',
        signature: 'Array.from(iterableOrArrayLike, mapFn?)',
        description: 'Creates a new array from any iterable (Set, Map, string) or array-like object. With `{ length: n }` and a map function it is the cleanest way to create arrays where **each slot gets its own fresh value**.',
        complexity: 'O(n)',
        example: `Array.from({ length: 3 }, (_, i) => i * 2);          // → [0, 2, 4]
Array.from({ length: 2 }, () => new Array(3).fill(0)); // → [[0, 0, 0], [0, 0, 0]]
Array.from({ length: 3 }, () => []);                // → [[], [], []] (3 different arrays)
Array.from(new Set([3, 1, 3]));                      // → [3, 1]
Array.from('abc');                                   // → ['a', 'b', 'c']`,
        dsaUse: '2D grids / DP tables, adjacency lists (`Array.from({ length: n }, () => [])`), converting Sets and Maps to arrays.',
      },
      {
        name: 'new Array(n).fill(x)',
        signature: 'new Array(n).fill(value, start?, end?)',
        description: 'Creates an array of length `n` and sets every slot to `value`. Fast and fine for **primitive** values (numbers, booleans, strings).',
        complexity: 'O(n)',
        example: `new Array(4).fill(0);         // → [0, 0, 0, 0]
new Array(3).fill(Infinity);  // → [Infinity, Infinity, Infinity]

// THE TRAP: fill with an object puts the SAME object in every slot
const grid = new Array(2).fill([]);
grid[0].push(1);
grid;                         // → [[1], [1]]  (both rows changed!)

const ok = Array.from({ length: 2 }, () => []);
ok[0].push(1);
ok;                           // → [[1], []]`,
        dsaUse: 'DP arrays (`new Array(n + 1).fill(0)`), distance arrays (`fill(Infinity)`), visited flags (`fill(false)`).',
        pitfall: '`fill([])`, `fill({})` or `fill(new Array(m).fill(0))` share **one** object across all slots. For 2D structures always use `Array.from({ length: n }, () => …)`. `new Array(n)` without `fill` creates **holes** that `map`/`forEach` skip.',
      },
      {
        name: 'at',
        signature: 'arr.at(index)',
        description: 'Reads an element; negative indices count from the end (`at(-1)` is the last element). Also works on strings.',
        complexity: 'O(1)',
        example: `const st = [4, 7, 9];
st.at(-1);  // → 9  (same as st[st.length - 1])
st.at(0);   // → 4
[].at(-1);  // → undefined
'hello'.at(-1); // → 'o'`,
        dsaUse: 'Peeking at the top of a stack (`st.at(-1)`), last element of a path.',
        pitfall: '`arr[-1]` does **not** mean "last" — it looks up a property named "-1" and gives `undefined`.',
      },
      {
        name: 'concat / spread copy',
        signature: 'a.concat(b, …) / [...a, ...b] / [...a]',
        description: 'Both create a **new** array containing all the elements, so both copy: the cost is the total length, not O(1).',
        complexity: 'O(n + m)',
        example: `const a = [1, 2], b = [3];
a.concat(b);     // → [1, 2, 3]
[...a, ...b];    // → [1, 2, 3]
[0, ...a];       // → [0, 1, 2]
const copy = [...a];
copy === a;      // → false (a new array)`,
        dsaUse: 'Saving a copy of the current path in backtracking: `res.push([...path])`.',
        pitfall: 'Copies are **shallow**: `[...grid]` copies the outer array but the rows are still shared — use `grid.map((row) => [...row])`. Building a result with `res = [...res, x]` in a loop is O(n²); use `push`.',
      },
      {
        name: 'join',
        signature: 'arr.join(separator = ",")',
        description: 'Concatenates all elements into one string, converting each to a string.',
        complexity: 'O(total length of the output)',
        example: `['a', 'b', 'c'].join('');   // → 'abc'
[1, 2, 3].join(' -> ');     // → '1 -> 2 -> 3'
[1, 2, 3].join();           // → '1,2,3'
[1, null, 3].join('-');     // → '1--3'`,
        dsaUse: 'Building strings efficiently (collect parts, join once), serialising keys (`[r, c].join(",")`), sorted-letters keys for anagrams.',
        pitfall: 'The default separator is a comma, not the empty string.',
      },
      {
        name: 'length',
        signature: 'arr.length',
        description: 'The number of slots (one more than the highest index). Assigning a smaller value truncates the array.',
        complexity: 'O(1) to read; setting it smaller is O(removed)',
        example: `const a = [1, 2, 3, 4];
a.length;      // → 4
a.length = 2;
a;             // → [1, 2]
a.length = 0;  // clears the array in place`,
        dsaUse: 'Loop bounds, stack emptiness (`while (st.length)`), resetting a reused buffer.',
      },
    ],
  },

  // ================================================================ Map
  {
    id: 'map',
    title: 'Map (hash map)',
    intro: `A \`Map\` stores **key → value** pairs and finds a key in **O(1) on average**. It is JavaScript's hash map, and the single most useful structure in interview problems.

**How hashing gives O(1).** The engine runs the key through a *hash function* that turns it into a number, and uses that number to pick a *bucket* in an internal table. Looking a key up means computing its hash and checking that one bucket, so the cost does not depend on how many keys are stored. Occasionally two keys land in the same bucket (a *collision*), and the table grows (rehashes everything) when it gets full; spread over all operations, that is still O(1) average (amortized). In a pathological case where many keys collide, a lookup degrades to **O(n)**, which is why the formal guarantee is "O(1) average, O(n) worst". You will not hit that worst case in practice.

**Keys compare by "SameValueZero".** Numbers and strings compare by value (\`1\` and \`"1"\` are *different* keys). Objects and arrays compare by **reference**: two arrays with the same contents are two different keys.

**Maps remember insertion order.** Iterating a Map visits keys in the order they were first inserted, which is guaranteed by the spec.`,
    items: [
      {
        name: 'new Map()',
        signature: 'new Map() / new Map([[k1, v1], [k2, v2]])',
        description: 'Creates an empty map, or one filled from an iterable of `[key, value]` pairs.',
        complexity: 'O(1) empty; O(n) from n pairs',
        example: `const m = new Map([['a', 1], ['b', 2]]);
m.size;                     // → 2
new Map(Object.entries({ x: 1 })).get('x'); // → 1`,
        dsaUse: 'Frequency counts, value → index lookups, memoization caches, adjacency lists with non-numeric nodes.',
      },
      {
        name: 'set',
        signature: 'map.set(key, value)',
        description: 'Inserts or overwrites the value for `key` and returns the map (so calls can be chained). Overwriting keeps the key\'s original position in the iteration order.',
        complexity: 'O(1) average',
        example: `const freq = new Map();
for (const ch of 'banana') freq.set(ch, (freq.get(ch) || 0) + 1);
freq;                       // → Map { 'b' => 1, 'a' => 3, 'n' => 2 }
new Map().set('x', 1).set('y', 2).size; // → 2`,
        dsaUse: 'The counting idiom `m.set(k, (m.get(k) || 0) + 1)`.',
      },
      {
        name: 'get',
        signature: 'map.get(key)',
        description: 'Returns the stored value, or `undefined` if the key is absent.',
        complexity: 'O(1) average',
        example: `const seen = new Map([[7, 0]]);
seen.get(7);   // → 0
seen.get(99);  // → undefined
seen.get(99) ?? -1; // → -1`,
        dsaUse: 'Two Sum: `seen.get(target - x)` to find the complement\'s index.',
        pitfall: 'A stored value can be `0`, `""` or `false`, so `if (map.get(k))` can be falsy for a key that exists. Use `map.has(k)` or compare with `undefined`.',
      },
      {
        name: 'has',
        signature: 'map.has(key)',
        description: 'True if the key exists (even if its value is `undefined` or `0`).',
        complexity: 'O(1) average',
        example: `const m = new Map([['a', 0]]);
m.has('a');  // → true
m.has('b');  // → false`,
        dsaUse: 'Membership checks where the stored value might be falsy.',
      },
      {
        name: 'delete',
        signature: 'map.delete(key)',
        description: 'Removes the key; returns `true` if it existed.',
        complexity: 'O(1) average',
        example: `const m = new Map([['a', 1]]);
m.delete('a'); // → true
m.delete('a'); // → false
m.size;        // → 0`,
        dsaUse: 'Sliding window: remove a character when its count drops to 0, so `map.size` equals the number of distinct characters in the window.',
      },
      {
        name: 'size',
        signature: 'map.size',
        description: 'The number of entries. It is a **property**, not a method, and it is kept up to date so reading it is instant.',
        complexity: 'O(1)',
        example: `const m = new Map([['a', 1], ['b', 2]]);
m.size;     // → 2
m.size();   // TypeError: m.size is not a function`,
        dsaUse: '"At most k distinct" windows: `while (count.size > k) shrink()`.',
      },
      {
        name: 'iteration order',
        signature: 'for (const [key, value] of map)',
        description: 'Iterating a Map yields `[key, value]` pairs in **insertion order**. Deleting a key and setting it again moves it to the end.',
        complexity: 'O(n) for a full pass',
        example: `const m = new Map([['b', 2], ['a', 1]]);
for (const [k, v] of m) console.log(k, v); // b 2, then a 1
m.delete('b');
m.set('b', 2);
[...m.keys()];            // → ['a', 'b']
m.keys().next().value;    // → 'a' (oldest key)`,
        dsaUse: 'A cheap LRU cache: delete + re-set a key on each access; the first key is the least recently used.',
      },
      {
        name: 'entries / keys / values',
        signature: 'map.entries() / map.keys() / map.values()',
        description: 'Return **iterators** (lazy, not arrays). Spread them or use `Array.from` to get an array.',
        complexity: 'O(1) to create; O(n) to consume',
        example: `const m = new Map([['x', 3], ['y', 1]]);
[...m.keys()];     // → ['x', 'y']
[...m.values()];   // → [3, 1]
[...m.entries()];  // → [['x', 3], ['y', 1]]
[...m].sort((a, b) => b[1] - a[1])[0][0]; // → 'x' (key with the largest value)
Math.max(...m.values()); // → 3`,
        dsaUse: 'Sorting entries by frequency (Top K), grouping results (`[...groups.values()]`).',
        pitfall: 'Iterators have no `.map`, `.length` or `.sort` in most environments — convert with `[...it]` first. An iterator can only be consumed once.',
      },
      {
        name: 'composite keys',
        signature: 'map.set(`${r},${c}`, value)',
        description: 'Arrays are compared by reference, so `[r, c]` cannot be used as a key directly. Encode pairs as a string, or as a single number when bounds are known.',
        complexity: 'O(length of the key) to build a string key; O(1) for a numeric key',
        example: `const m = new Map();
m.set([1, 2], 'x');
m.get([1, 2]);               // → undefined (a different array)

const key = (r, c) => \`\${r},\${c}\`;
m.set(key(1, 2), 'x');
m.get(key(1, 2));            // → 'x'

const cols = 1000;
m.set(1 * cols + 2, 'y');    // numeric key r * cols + c
m.get(1002);                 // → 'y'`,
        dsaUse: 'Visited sets on grids, memo keys for 2D DP (`memo.get(i + "," + j)`), coordinate hashing.',
        pitfall: 'String keys like `r + c` without a separator collide: (1, 23) and (12, 3) both become "123".',
      },
      {
        name: 'Map vs Object',
        signature: 'new Map() vs {}',
        description: `Plain objects can act as hash maps, but they have traps:

| | \`Map\` | \`{}\` object |
|---|---|---|
| key types | any value (numbers stay numbers, objects by reference) | strings and symbols only — \`obj[1]\` is \`obj["1"]\` |
| built-in keys | none | inherits from \`Object.prototype\` (\`"constructor"\`, \`"toString"\`, \`"__proto__"\`) |
| order | insertion order | integer-like keys first in ascending numeric order, then strings in insertion order |
| size | \`map.size\`, O(1) | \`Object.keys(obj).length\`, O(n) |
| frequent add/delete | optimised for it | \`delete obj.k\` can make the object slower |

Prefer \`Map\` for anything keyed by user data. Objects are fine for fixed, known keys and for quick letter counts.`,
        complexity: 'Both O(1) average for get/set/has',
        example: `const obj = {};
obj[1] = 'a';
Object.keys(obj);        // → ['1']  (the number became a string)
'constructor' in obj;    // → true   (inherited!)
Object.keys({ b: 1, 2: 1, a: 1, 1: 1 }); // → ['1', '2', 'b', 'a']

const m = new Map([[1, 'a']]);
m.has('1');              // → false (1 and '1' are different keys)
m.has('constructor');    // → false`,
        dsaUse: 'Use Map for frequency maps keyed by words/numbers; an object or `new Array(26).fill(0)` for lowercase letter counts.',
        pitfall: 'Counting words with an object breaks on input like "constructor" (`obj.constructor` already exists, so `obj.constructor + 1` becomes a string). `Object.create(null)` avoids inherited keys, but a Map is simpler.',
      },
    ],
  },

  // ================================================================ Set
  {
    id: 'set',
    title: 'Set (hash set)',
    intro: `A \`Set\` holds **unique values** and answers "is x in here?" in **O(1) on average**, using the same hashing as \`Map\` (a Set is essentially a Map with keys and no values). Like Map, it keeps **insertion order** and compares objects/arrays **by reference**.

Replacing \`array.includes(x)\` (O(n)) with \`set.has(x)\` (O(1)) inside a loop is the most common way to turn an O(n²) solution into O(n).`,
    items: [
      {
        name: 'add',
        signature: 'set.add(value)',
        description: 'Adds the value if it is not already there; returns the set (chainable). Adding a duplicate does nothing.',
        complexity: 'O(1) average',
        example: `const s = new Set();
s.add(1).add(2).add(1);
s;        // → Set { 1, 2 }
s.size;   // → 2`,
        dsaUse: 'Visited sets in BFS/DFS, detecting duplicates.',
      },
      {
        name: 'has',
        signature: 'set.has(value)',
        description: 'True if the value is in the set.',
        complexity: 'O(1) average',
        example: `const seen = new Set([3, 5]);
seen.has(5);   // → true
seen.has('5'); // → false (different type)`,
        dsaUse: 'Contains Duplicate, longest consecutive sequence (`!set.has(x - 1)` finds sequence starts).',
      },
      {
        name: 'delete',
        signature: 'set.delete(value)',
        description: 'Removes the value; returns `true` if it was present.',
        complexity: 'O(1) average',
        example: `const s = new Set(['a', 'b']);
s.delete('a'); // → true
s.delete('z'); // → false
[...s];        // → ['b']`,
        dsaUse: 'Sliding window of unique characters: delete the left character as the window shrinks.',
      },
      {
        name: 'size',
        signature: 'set.size',
        description: 'Number of values (a property, O(1)).',
        complexity: 'O(1)',
        example: `new Set([1, 1, 2, 3, 3]).size; // → 3 (distinct count)
new Set('hello').size;         // → 4`,
        dsaUse: 'Counting distinct values in one line; `set.size !== arr.length` means there were duplicates.',
      },
      {
        name: 'iteration',
        signature: 'for (const x of set) / set.forEach(fn)',
        description: 'Visits values in insertion order. Values added during iteration are visited too.',
        complexity: 'O(n)',
        example: `const s = new Set(['c', 'a', 'b']);
for (const x of s) console.log(x); // c, a, b
[...s].sort();                      // → ['a', 'b', 'c']`,
        dsaUse: 'Walking all unique values, e.g. starts of consecutive runs.',
      },
      {
        name: 'to / from arrays',
        signature: 'new Set(array) / [...set] / Array.from(set)',
        description: 'Building a Set from an array removes duplicates (keeping the first occurrence order); spreading turns it back into an array.',
        complexity: 'O(n)',
        example: `const unique = [...new Set([3, 1, 3, 2, 1])]; // → [3, 1, 2]
new Set('aabbc');                               // → Set { 'a', 'b', 'c' }
Array.from(new Set([2, 2, 1])).sort((a, b) => a - b); // → [1, 2]`,
        dsaUse: 'Deduplicating input, coordinate compression (`[...new Set(nums)].sort((a, b) => a - b)`).',
      },
      {
        name: 'set operations by hand',
        signature: 'filter + has',
        description: 'Union, intersection and difference with a loop and `has`. (Newer engines — Node 22+, recent browsers — also have `a.union(b)`, `a.intersection(b)`, `a.difference(b)`, but the hand-written versions work everywhere.)',
        complexity: 'O(|A| + |B|)',
        example: `const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const union = new Set([...a, ...b]);                // → Set { 1, 2, 3, 4 }
const inter = new Set([...a].filter((x) => b.has(x))); // → Set { 2, 3 }
const diff  = new Set([...a].filter((x) => !b.has(x))); // → Set { 1 }
const isSubset = [...inter].every((x) => a.has(x));  // → true`,
        dsaUse: 'Intersection of arrays, common characters, finding elements missing from one list.',
        pitfall: 'For intersection, loop over the **smaller** set and check `has` on the larger one.',
      },
      {
        name: 'objects as values',
        signature: 'set.add([r, c])',
        description: 'Arrays and objects are compared by **reference**, so the same coordinates added twice are two different entries and `has` with a new array is always false. Store string or numeric keys instead.',
        complexity: 'O(1) average',
        example: `const s = new Set();
s.add([0, 0]);
s.has([0, 0]);     // → false
s.add('0,0');
s.has('0,0');      // → true`,
        dsaUse: 'Visited cells on grids: `seen.add(r * cols + c)` or `seen.add(r + "," + c)`.',
        pitfall: 'This is the #1 Set bug in grid problems — the visited check never succeeds and BFS loops forever.',
      },
    ],
  },

  // ================================================================ Strings
  {
    id: 'strings',
    title: 'Strings',
    intro: `JavaScript strings are **immutable** sequences of UTF-16 code units. \`s.length\` and \`s[i]\` are **O(1)**, but you can never change a character in place: every "modification" builds a **new** string, which costs time proportional to its length.

Two consequences for DSA:

* To edit characters, convert to an array (\`[...s]\` or \`s.split('')\`), change the array, then \`join('')\`.
* To build a long string piece by piece, push the pieces into an array and \`join\` once at the end.`,
    items: [
      {
        name: 'split',
        signature: 'str.split(separator, limit?)',
        description: 'Cuts the string at each separator and returns an array of pieces. `split("")` gives single UTF-16 units.',
        complexity: 'O(n)',
        example: `'a,b,,c'.split(',');     // → ['a', 'b', '', 'c']
'hello'.split('');       // → ['h', 'e', 'l', 'l', 'o']
'  two  words '.trim().split(/\\s+/); // → ['two', 'words']
'abc'.split(',');        // → ['abc']
''.split(',');           // → ['']`,
        dsaUse: 'Parsing input ("1,2,3"), splitting sentences into words, making a mutable char array.',
        pitfall: '`split("")` breaks emoji and other characters outside the Basic Multilingual Plane into two halves; `[...str]` splits by code point instead. `"".split(",")` is `[""]`, not `[]`.',
      },
      {
        name: 'join',
        signature: 'arr.join(separator)',
        description: 'The inverse of split: glue array pieces into one string.',
        complexity: 'O(total length)',
        example: `['c', 'a', 't'].join('');      // → 'cat'
[...'listen'].sort().join('');  // → 'eilnst' (anagram key)
['2', '0', '2', '6'].join('-'); // → '2-0-2-6'`,
        dsaUse: 'Anagram grouping keys, reversing a string, final answer assembly.',
      },
      {
        name: 'slice / substring',
        signature: 'str.slice(start, end?) / str.substring(start, end?)',
        description: 'Both return `str[start..end)` (end excluded). `slice` accepts **negative** indices (from the end); `substring` treats negatives as 0 and **swaps** the arguments if `start > end`. Prefer `slice`. (`substr` is deprecated.)',
        complexity: 'O(k) for a result of length k',
        example: `'abcdef'.slice(1, 4);      // → 'bcd'
'abcdef'.slice(-2);        // → 'ef'
'abcdef'.substring(4, 1);  // → 'bcd' (arguments swapped)
'abcdef'.slice(4, 1);      // → ''    (empty)
'abcdef'.substring(-2);    // → 'abcdef'`,
        dsaUse: 'Extracting windows, prefixes and suffixes (palindrome and word-break checks).',
        pitfall: 'Calling `slice` inside a nested loop to compare substrings adds a hidden O(k) factor: comparing all substrings this way is O(n³). Compare characters by index when you can.',
      },
      {
        name: 'includes / indexOf',
        signature: 'str.includes(sub) / str.indexOf(sub, from?) / str.startsWith / str.endsWith',
        description: 'Substring search. `indexOf` returns the first position or `-1`; `includes` returns a boolean. `startsWith`/`endsWith` only compare at one position.',
        complexity: 'O(n·m) worst case for text length n and pattern length m (typically much faster); startsWith/endsWith O(m)',
        example: `'hello world'.includes('o w');   // → true
'hello'.indexOf('l');            // → 2
'hello'.indexOf('l', 3);         // → 3
'hello'.indexOf('z');            // → -1
'prefix-tree'.startsWith('pre'); // → true`,
        dsaUse: 'Quick checks in small inputs; rotated-string check `(s + s).includes(goal)`.',
        pitfall: 'The worst case is not linear. When a problem is about pattern matching on large inputs, the interviewer usually wants KMP / Z / rolling hash.',
      },
      {
        name: 'replace / replaceAll',
        signature: 'str.replace(pattern, replacement) / str.replaceAll(pattern, replacement)',
        description: 'Return a **new** string. With a **string** pattern, `replace` changes only the **first** match; `replaceAll` changes all. With a regex, use the `g` flag to replace every match.',
        complexity: 'O(n) (plus regex matching cost)',
        example: `'a-b-c'.replace('-', '+');     // → 'a+b-c' (first only!)
'a-b-c'.replaceAll('-', '+');  // → 'a+b+c'
'a-b-c'.replace(/-/g, '');      // → 'abc'
'A man, a plan'.toLowerCase().replace(/[^a-z0-9]/g, ''); // → 'amanaplan'`,
        dsaUse: 'Normalising input for palindrome checks (lowercase, strip non-alphanumerics).',
        pitfall: 'Repeatedly calling `replace` in a loop (e.g. removing "()" pairs until none remain) is O(n²). A stack solves those in O(n).',
      },
      {
        name: 'charCodeAt / String.fromCharCode',
        signature: 'str.charCodeAt(i) / String.fromCharCode(code)',
        description: 'Convert between a character and its numeric UTF-16 code. `"a"` is 97, `"A"` is 65, `"0"` is 48.',
        complexity: 'O(1)',
        example: `'c'.charCodeAt(0) - 97;              // → 2 (index in the alphabet)
String.fromCharCode(97 + 25);         // → 'z'
'7'.charCodeAt(0) - 48;               // → 7 (digit value)

const count = new Array(26).fill(0);  // letter frequency, no Map needed
for (const ch of 'hello') count[ch.charCodeAt(0) - 97]++;
count[11];                            // → 2 ('l')`,
        dsaUse: 'Fixed-size letter counts (anagrams, sliding windows), Caesar shifts, trie child indices, digit parsing.',
        pitfall: '`charCodeAt` with no index reads position 0. Out of range returns `NaN`.',
      },
      {
        name: 'codePointAt / [...str]',
        signature: 'str.codePointAt(i) / [...str] / for (const ch of str)',
        description: 'For characters outside the Basic Multilingual Plane (most emoji), one visible character takes **two** UTF-16 units, so `length`, `s[i]` and `charCodeAt` see two halves. `codePointAt` and string iteration (`for…of`, spread) work in whole code points.',
        complexity: 'codePointAt O(1); spreading O(n)',
        example: `const s = 'a😀';
s.length;           // → 3
[...s].length;      // → 2
s.codePointAt(1);   // → 128512
s.charCodeAt(1);    // → 55357 (half of a surrogate pair)`,
        dsaUse: 'Mostly a note: LeetCode inputs are usually ASCII, so `charCodeAt` is fine. Reach for code points only if the problem mentions Unicode.',
      },
      {
        name: 'repeat',
        signature: 'str.repeat(count)',
        description: 'Returns the string repeated `count` times.',
        complexity: 'O(n · count) (the size of the output)',
        example: `'ab'.repeat(3);   // → 'ababab'
'-'.repeat(5);    // → '-----'
'x'.repeat(0);    // → ''`,
        dsaUse: 'Decode-string expansions (`3[a]` → "aaa"), padding output, repeated-string-match checks.',
      },
      {
        name: 'padStart / padEnd',
        signature: 'str.padStart(targetLength, padString = " ")',
        description: 'Pads the string on the left (or right) until it reaches the target length.',
        complexity: 'O(targetLength)',
        example: `(5).toString(2).padStart(8, '0'); // → '00000101'
'7'.padStart(3, '0');              // → '007'
'abc'.padStart(2, '0');            // → 'abc' (already long enough)`,
        dsaUse: 'Printing fixed-width binary numbers for bit problems, zero-padded times ("09:05").',
      },
      {
        name: 'localeCompare',
        signature: 'a.localeCompare(b)',
        description: 'Compares two strings using language rules and returns a negative number, 0 or a positive number — exactly the shape a sort comparator needs.',
        complexity: 'O(min(|a|, |b|)), with a larger constant than `<`',
        example: `['b', 'a', 'C'].sort((x, y) => x.localeCompare(y)); // → ['a', 'b', 'C']
['b', 'a', 'C'].sort();                              // → ['C', 'a', 'b']
'apple'.localeCompare('banana');                      // → negative (-1 in V8)`,
        dsaUse: 'String tie-breaks inside comparators: `b.count - a.count || a.word.localeCompare(b.word)`.',
        pitfall: 'Its order can differ from plain code-unit order (e.g. case handling). When a problem says "lexicographically smallest" it means code-unit order — compare with `<` / `>`, e.g. `(a, b) => (a < b ? -1 : a > b ? 1 : 0)`.',
      },
      {
        name: 'comparing with < >',
        signature: 'a < b, a === b',
        description: 'Relational operators compare strings **lexicographically by UTF-16 code unit**: character by character, and a prefix is smaller than the longer string. All uppercase letters (65–90) come before lowercase (97–122).',
        complexity: 'O(min(|a|, |b|))',
        example: `'apple' < 'banana';  // → true
'app' < 'apple';     // → true (prefix is smaller)
'Z' < 'a';           // → true (uppercase first)
'10' < '9';          // → true (text, not numbers!)
10 < 9;              // → false`,
        dsaUse: '"Lexicographically smallest" answers, comparing candidate strings in greedy/backtracking.',
        pitfall: 'Numbers read from input as strings compare as text. Convert with `Number(x)` first.',
      },
      {
        name: 'immutability & building strings',
        signature: 's += piece  vs  parts.push(piece); parts.join("")',
        description: 'Since strings cannot change, `s += x` creates a new string. Engines optimise concatenation with *ropes* (lazy joins), so small loops are fine, but the formal worst case of repeated `+=` is **O(n²)** total, and flattening a deep rope later can be slow. Collecting parts in an array and joining once is guaranteed linear.',
        complexity: 's[i] = x: impossible; `+=` in a loop: up to O(n²); push + join: O(n)',
        example: `const s = 'cat';
s[0] = 'b';        // ignored (TypeError in strict mode)
s;                 // → 'cat'

const chars = [...s];
chars[0] = 'b';
chars.join('');    // → 'bat'

const parts = [];
for (let i = 0; i < 3; i++) parts.push(i);
parts.join(',');   // → '0,1,2'`,
        dsaUse: 'Reversing words, building compressed strings, generating output for large inputs.',
        pitfall: 'Modules and classes run in strict mode, where writing `s[0] = "x"` throws instead of silently doing nothing.',
      },
    ],
  },

  // ================================================================ Math
  {
    id: 'math',
    title: 'Math & Numbers',
    intro: `Every JavaScript \`number\` is a 64-bit floating-point value (IEEE 754 double). There is no separate integer type. Integers are **exact** only up to \`Number.MAX_SAFE_INTEGER\` (2^53 − 1 ≈ 9 × 10^15); beyond that, gaps appear and arithmetic silently rounds.

Division never truncates on its own: \`7 / 2\` is \`3.5\`. You must pick how to round, and the choices differ for **negative** numbers.`,
    items: [
      {
        name: 'Math.min / Math.max',
        signature: 'Math.max(a, b, …) / Math.min(a, b, …)',
        description: 'Return the largest / smallest argument. With no arguments `Math.max()` is `-Infinity` and `Math.min()` is `Infinity`; any `NaN` argument makes the result `NaN`.',
        complexity: 'O(k) for k arguments',
        example: `Math.max(3, 7, 2);         // → 7
Math.max(...[3, 7, 2]);    // → 7
Math.max();                // → -Infinity
Math.min(...[]);           // → Infinity

// safe for huge arrays: a loop or reduce
const big = Array.from({ length: 1e6 }, (_, i) => i);
big.reduce((m, x) => (x > m ? x : m), -Infinity); // → 999999`,
        dsaUse: 'Updating a running best: `best = Math.max(best, current)`.',
        pitfall: '`Math.max(...arr)` passes every element as a function argument. Past a few hundred thousand elements (the exact limit depends on the engine) it throws `RangeError: Maximum call stack size exceeded`. Use a loop or `reduce` for large arrays.',
      },
      {
        name: 'floor / ceil / trunc / round',
        signature: 'Math.floor(x) / Math.ceil(x) / Math.trunc(x) / Math.round(x)',
        description: '`floor` rounds down (toward −∞), `ceil` up (toward +∞), `trunc` drops the fraction (toward 0), `round` goes to the nearest integer with **.5 rounding up toward +∞**.',
        complexity: 'O(1)',
        example: `Math.floor(3.7);   // → 3
Math.floor(-3.2);  // → -4
Math.ceil(3.2);    // → 4
Math.trunc(-3.7);  // → -3
Math.round(2.5);   // → 3
Math.round(-2.5);  // → -2 (not -3!)
Math.ceil(7 / 3);  // → 3 (ceil division: pages, trips, hours)`,
        dsaUse: 'Binary search midpoints, "minimum number of hours/boats" (`Math.ceil(pile / speed)`), grid index math.',
      },
      {
        name: 'integer division',
        signature: 'Math.floor(a / b) vs Math.trunc(a / b) vs (a / b) | 0',
        description: 'For non-negative numbers all three agree. For **negatives**, `Math.floor` rounds toward −∞ (like Python\'s `//`), while `Math.trunc` and `| 0` round toward 0 (like C++/Java `/`). `| 0` also forces the result into a 32-bit integer, so it breaks above 2^31 − 1.',
        complexity: 'O(1)',
        example: `Math.floor(7 / 2);   // → 3
Math.floor(-7 / 2);  // → -4
Math.trunc(-7 / 2);  // → -3
(-7 / 2) | 0;        // → -3
(2 ** 31) | 0;       // → -2147483648 (overflowed!)
Math.trunc(2 ** 40 / 2); // → 549755813888 (fine)

// binary search midpoint
const lo = 0, hi = 9;
const mid = lo + Math.floor((hi - lo) / 2); // → 4
const mid2 = (lo + hi) >> 1;                // → 4 (only safe below 2^31)`,
        dsaUse: 'Midpoints, "evaluate reverse polish notation" (which requires truncation toward zero: `Math.trunc`).',
        pitfall: 'Translating C++/Java code that uses `/` on negative ints: use `Math.trunc`, not `Math.floor`.',
      },
      {
        name: 'modulo of negatives',
        signature: 'a % m  vs  ((a % m) + m) % m',
        description: '`%` is a **remainder**: its sign follows the left operand, so `-7 % 3` is `-1`, not `2`. For a true modulo in `[0, m)`, add `m` and take `%` again.',
        complexity: 'O(1)',
        example: `7 % 3;                 // → 1
-7 % 3;                // → -1
((-7 % 3) + 3) % 3;    // → 2
const mod = (a, m) => ((a % m) + m) % m;
mod(-1, 5);            // → 4  (circular array: index before 0)
5.5 % 2;               // → 1.5 (works on floats)`,
        dsaUse: 'Circular arrays / rotation, "subarray sums divisible by k" (negative prefix sums!), hashing, answers "mod 1e9+7".',
        pitfall: 'Using a negative remainder as an array index or Map key splits one bucket into two. Normalise first.',
      },
      {
        name: 'Math.abs / Math.sign',
        signature: 'Math.abs(x) / Math.sign(x)',
        description: '`abs` drops the sign; `sign` returns -1, 0 or 1.',
        complexity: 'O(1)',
        example: `Math.abs(-5);            // → 5
Math.abs(3 - 8);         // → 5 (distance)
Math.sign(-12);          // → -1
const [x1, y1, x2, y2] = [1, 2, 4, -2];
Math.abs(x1 - x2) + Math.abs(y1 - y2); // → 7 (Manhattan distance)`,
        dsaUse: 'Distances, "absolute difference" constraints, direction of movement.',
      },
      {
        name: 'Math.sqrt',
        signature: 'Math.sqrt(x)',
        description: 'Square root (a float). For integer square roots, floor it and then **verify**, because floating-point results can be off by one for very large inputs.',
        complexity: 'O(1)',
        example: `Math.sqrt(16);              // → 4
Math.sqrt(2);               // → 1.4142135623730951
Math.floor(Math.sqrt(26));  // → 5

// check divisors only up to sqrt(n)
function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}
isPrime(97);                // → true`,
        dsaUse: 'Prime checks and factorisation in O(√n), perfect squares, distance formulas.',
        pitfall: 'Prefer `d * d <= n` in loops over comparing with `Math.sqrt(n)` — it stays in exact integer arithmetic.',
      },
      {
        name: 'Math.pow / **',
        signature: 'Math.pow(base, exp) / base ** exp',
        description: 'Exponentiation. `**` is the operator form and also works with BigInt.',
        complexity: 'O(1) for numbers (hardware); use fast exponentiation O(log exp) for modular powers',
        example: `2 ** 10;          // → 1024
Math.pow(2, 0.5); // → 1.4142135623730951
(-2) ** 2;        // → 4
2 ** 53 + 1;      // → 9007199254740992 (precision lost!)
10n ** 20n;       // → 100000000000000000000n`,
        dsaUse: 'Bit masks (`2 ** k`), powers of the base in rolling hashes, fast exponentiation (Pow(x, n)).',
        pitfall: '`-2 ** 2` is a SyntaxError — you must write `(-2) ** 2`. For `a ** b % m` with large numbers, the power overflows before the `%`: use modular exponentiation.',
      },
      {
        name: 'Math.log2 / log10 / log',
        signature: 'Math.log2(x) / Math.log10(x) / Math.log(x)',
        description: 'Logarithms (base 2, base 10, natural). Handy for counting bits, digits and tree levels.',
        complexity: 'O(1)',
        example: `Math.log2(1024);              // → 10
Math.floor(Math.log2(37));    // → 5 (highest set bit)
Math.floor(Math.log10(12345)) + 1; // → 5 (number of digits)
Math.log(1000) / Math.log(10); // → 2.9999999999999996 (!)
31 - Math.clz32(37);           // → 5 (exact, integer-only)`,
        dsaUse: 'Sparse table row count, levels of a heap, number of digits.',
        pitfall: 'Floating-point logs can land just below an integer. For exact bit positions use `31 - Math.clz32(x)` (32-bit) or a loop.',
      },
      {
        name: 'Number.MAX_SAFE_INTEGER',
        signature: 'Number.MAX_SAFE_INTEGER / Number.MIN_SAFE_INTEGER / Number.isSafeInteger(x)',
        description: 'The largest integer n such that n and n + 1 are both exactly representable: 2^53 − 1 = 9007199254740991. Above it, integers skip values.',
        complexity: 'O(1)',
        example: `Number.MAX_SAFE_INTEGER;            // → 9007199254740991
2 ** 53 === 2 ** 53 + 1;            // → true (!)
Number.isSafeInteger(2 ** 53);      // → false
1e9 * 1e9 + 1;                      // → 1000000000000000000 (the + 1 is lost)
(123456789 * 987654321) % 1000000007; // → wrong answer: product exceeds 2^53`,
        dsaUse: 'Knowing when a product needs BigInt or modular multiplication (two numbers near 10^9 multiplied exceed 2^53).',
        pitfall: 'Sums of up to 10^5 values of 10^9 are fine (10^14 < 9 × 10^15); **products** of two such values are not.',
      },
      {
        name: 'Infinity',
        signature: 'Infinity / -Infinity / Number.isFinite(x)',
        description: 'Special numbers larger / smaller than every other number. They behave sensibly with comparisons, `Math.min/max` and addition of finite numbers.',
        complexity: 'O(1)',
        example: `let best = Infinity;
best = Math.min(best, 42);     // → 42
Infinity + 1;                  // → Infinity
Infinity - Infinity;           // → NaN
new Array(3).fill(Infinity);   // → [Infinity, Infinity, Infinity]
Number.isFinite(1 / 0);        // → false`,
        dsaUse: 'Initial values for minimums, unreachable distances in Dijkstra / Bellman-Ford / DP, sentinel bounds in BST validation.',
        pitfall: 'Return `-1` instead of `Infinity` when the problem says "if impossible return -1". `Infinity` cannot be stored in an `Int32Array` (it becomes 0).',
      },
      {
        name: 'floating-point equality',
        signature: 'Math.abs(a - b) < 1e-9',
        description: 'Decimal fractions like 0.1 are not exact in binary, so tiny errors appear. Compare floats with a tolerance, or keep values as integers (e.g. cents, or fractions as numerator/denominator).',
        complexity: 'O(1)',
        example: `0.1 + 0.2;                          // → 0.30000000000000004
0.1 + 0.2 === 0.3;                  // → false
Math.abs(0.1 + 0.2 - 0.3) < 1e-9;   // → true`,
        dsaUse: 'Slopes in "max points on a line" (store reduced fractions via gcd instead of floats), probability answers.',
      },
    ],
  },

  // ================================================================ Numbers & bits
  {
    id: 'numbers-bits',
    title: 'Bits, BigInt & Parsing',
    intro: `Bitwise operators (\`& | ^ ~ << >> >>>\`) first convert their operands to **32-bit signed integers** (two's complement), do the operation, and convert back. So they are fast and exact for values that fit in 32 bits, but anything above 2^31 − 1 wraps around, and bit 31 is the sign bit.

When numbers really are bigger than 2^53, \`BigInt\` gives exact arbitrary-precision integers, at a real speed cost.`,
    items: [
      {
        name: '& | ^ ~',
        signature: 'a & b, a | b, a ^ b, ~a',
        description: 'AND, OR, XOR and NOT on each of the 32 bits. `~a` equals `-a - 1`. XOR has the key identities `x ^ x = 0` and `x ^ 0 = x`.',
        complexity: 'O(1)',
        example: `5 & 3;    // → 1   (101 & 011 = 001)
5 | 3;    // → 7   (111)
5 ^ 3;    // → 6   (110)
~5;       // → -6
[4, 1, 2, 1, 2].reduce((a, b) => a ^ b); // → 4 (Single Number)
(6 & 1) === 0;   // → true (even check)`,
        dsaUse: 'Single Number (XOR cancels pairs), subset masks, parity checks, toggling flags.',
        pitfall: 'Operator precedence: `x & 1 === 0` means `x & (1 === 0)`. Always parenthesise: `(x & 1) === 0`.',
      },
      {
        name: '<< >> >>>',
        signature: 'a << k, a >> k, a >>> k',
        description: '`<<` shifts left (multiplies by 2^k while it fits), `>>` shifts right keeping the sign (floor-divides by 2^k), `>>>` shifts right filling with zeros (treats the value as **unsigned**). Only the low 5 bits of `k` are used, so shifting by 32 is shifting by 0.',
        complexity: 'O(1)',
        example: `1 << 4;        // → 16
1 << 31;       // → -2147483648 (sign bit!)
1 << 32;       // → 1 (shift count taken mod 32)
-16 >> 2;      // → -4
-16 >>> 28;    // → 15
(13 >> 1);     // → 6 (floor(13 / 2))`,
        dsaUse: 'Building masks (`1 << i`), checking bit i (`(mask >> i) & 1`), halving in binary search (`(lo + hi) >> 1`).',
        pitfall: 'Masks for more than 31 items do not fit in a number\'s bitwise range; use BigInt (`1n << 40n`) or an array of flags.',
      },
      {
        name: '>>> 0',
        signature: 'x >>> 0',
        description: 'Reinterprets a 32-bit value as **unsigned** (0 to 2^32 − 1). Useful after bit tricks that may have set bit 31, and before printing binary.',
        complexity: 'O(1)',
        example: `-1 >>> 0;                   // → 4294967295
(1 << 31) >>> 0;            // → 2147483648
(-5).toString(2);           // → '-101'
(-5 >>> 0).toString(2);     // → '11111111111111111111111111111011'`,
        dsaUse: '"Reverse Bits" and "Number of 1 Bits" when the answer must be an unsigned 32-bit integer.',
      },
      {
        name: 'common bit tricks',
        signature: 'x & (x - 1), x & -x, popcount',
        description: '`x & (x - 1)` clears the lowest set bit; `x & -x` isolates it; counting how many times you can clear bits gives the popcount (number of 1s).',
        complexity: 'O(1) each; popcount loop O(number of set bits)',
        example: `12 & 11;        // → 8   (1100 → 1000, lowest bit cleared)
12 & -12;       // → 4   (lowest set bit)
(16 & 15) === 0; // → true (power of two check: n > 0 && (n & (n - 1)) === 0)

function popcount(x) {
  let c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
}
popcount(0b1011);   // → 3
Math.clz32(1);      // → 31 (leading zeros in 32 bits)`,
        dsaUse: 'Power of two, counting bits, Fenwick tree (`i & -i`), iterating subsets of a mask.',
        pitfall: 'For negative `x`, `while (x)` with `x &= x - 1` still terminates (32 bits), but convert with `>>> 0` first if you mean "unsigned".',
      },
      {
        name: 'BigInt',
        signature: '123n / BigInt(x)',
        description: 'Arbitrary-precision integers. Written with an `n` suffix. Exact for any size, but every operation allocates and costs time proportional to the number of digits, so it is **much slower** than number arithmetic. Use it only when values truly exceed 2^53 (or for exact products before a modulo).',
        complexity: 'O(d) for + and − on d-digit values; multiplication is superlinear in d',
        example: `2n ** 64n;                     // → 18446744073709551616n
BigInt(123456789) * 987654321n % 1000000007n; // → 259106859n (exact)
7n / 2n;                       // → 3n (truncates)
typeof 5n;                     // → 'bigint'
Number(10n) + 1;               // → 11
1n + 1;                        // TypeError: Cannot mix BigInt and other types`,
        dsaUse: 'Exact modular multiplication of large numbers, factorials / combinatorics, 64-bit masks, huge Fibonacci numbers.',
        pitfall: 'Cannot mix with plain numbers, and `Math.*` functions do not accept BigInt. `JSON.stringify` throws on BigInt. Prefer keeping numbers small with `% MOD` after every step when you can.',
      },
      {
        name: 'Number.isInteger',
        signature: 'Number.isInteger(x)',
        description: 'True if `x` is a number with no fractional part. Does not convert strings.',
        complexity: 'O(1)',
        example: `Number.isInteger(5);      // → true
Number.isInteger(5.0);    // → true
Number.isInteger(5.5);    // → false
Number.isInteger('5');    // → false
Number.isInteger(Math.sqrt(49)); // → true`,
        dsaUse: 'Checking that a computed ratio or square root is whole.',
      },
      {
        name: 'parseInt / Number',
        signature: 'parseInt(str, radix) / Number(str) / +str',
        description: '`parseInt` reads digits from the start of a string in the given base and stops at the first invalid character. `Number(str)` converts the whole string (or gives `NaN`). **Always pass the radix to parseInt.**',
        complexity: 'O(length of the string)',
        example: `parseInt('101', 2);     // → 5
parseInt('ff', 16);     // → 255
parseInt('42px', 10);   // → 42
Number('42px');         // → NaN
Number('');             // → 0 (!)
+'-17';                 // → -17
parseInt(0.0000005);    // → 5 (it becomes '5e-7' first!)`,
        dsaUse: 'Parsing tokens in calculators / RPN, reading binary strings, converting digit characters.',
        pitfall: 'Only pass **strings** to `parseInt`. For a single digit character, `ch.charCodeAt(0) - 48` or `+ch` is faster.',
      },
      {
        name: 'toString(radix)',
        signature: 'num.toString(2) / num.toString(16)',
        description: 'Formats a number in the given base (2–36).',
        complexity: 'O(number of digits)',
        example: `(10).toString(2);    // → '1010'
(255).toString(16);  // → 'ff'
(5).toString(2).padStart(8, '0'); // → '00000101'
[...(13).toString(2)].filter((b) => b === '1').length; // → 3
// 10.toString(2) is a SyntaxError (the dot is read as a decimal point) — use (10).toString(2)`,
        dsaUse: 'Debugging masks, counting set bits for small inputs, "add binary" problems.',
        pitfall: 'Negative numbers print with a minus sign, not in two\'s complement: use `(x >>> 0).toString(2)`.',
      },
    ],
  },

  // ================================================================ Syntax
  {
    id: 'syntax',
    title: 'Syntax that makes DSA code shorter',
    intro: 'Modern JavaScript syntax that shows up constantly in clean interview solutions — and the subtle ways each one can bite.',
    items: [
      {
        name: 'destructuring',
        signature: 'const [a, b] = arr; const { x, y } = obj; [a, b] = [b, a]',
        description: 'Unpacks arrays by position and objects by name, including in loop heads and function parameters. The swap `[a, b] = [b, a]` creates a temporary 2-element array.',
        complexity: 'O(1) for a fixed number of names',
        example: `const [r, c] = [2, 5];              // r → 2, c → 5
const [first, ...rest] = [1, 2, 3]; // first → 1, rest → [2, 3]

let a = 1, b = 2;
[a, b] = [b, a];                    // a → 2, b → 1

const arr = [3, 1, 2];
[arr[0], arr[2]] = [arr[2], arr[0]]; // arr → [2, 1, 3]

for (const [key, count] of new Map([['x', 2]])) console.log(key, count); // x 2
const { to, weight = 1 } = { to: 4 };   // to → 4, weight → 1`,
        dsaUse: 'Swaps in sorting / two pointers / heaps, unpacking `[r, c]` from a BFS queue, `[u, v, w]` edges, `[key, value]` Map entries.',
        pitfall: 'A line starting with `[` after a line with no semicolon is glued to it: `x = y` newline `[a, b] = [b, a]` becomes `x = y[a, b] = …`. End the previous line with `;`.',
      },
      {
        name: 'spread',
        signature: '[...iterable], { ...obj }, fn(...args)',
        description: 'Expands an iterable into elements (or an object into properties). It always **copies**, so it costs O(n).',
        complexity: 'O(n)',
        example: `[...'abc'];                 // → ['a', 'b', 'c']
[...new Set([1, 1, 2])];    // → [1, 2]
const path = [1, 2];
const saved = [...path];    // copy before backtracking mutates path
Math.max(...[4, 9, 2]);     // → 9
({ ...{ a: 1 }, b: 2 });    // → { a: 1, b: 2 }`,
        dsaUse: 'Copying paths/results, turning strings/Sets/Map iterators into arrays.',
        pitfall: 'Spreading huge arrays into function arguments overflows the stack; spreading inside a loop turns O(n) into O(n²).',
      },
      {
        name: 'rest parameters',
        signature: 'function f(first, ...others)',
        description: 'Collects the remaining arguments into a real array.',
        complexity: 'O(k) for k collected arguments',
        example: `function sumAll(...nums) {
  return nums.reduce((s, x) => s + x, 0);
}
sumAll(1, 2, 3);            // → 6
const [head, ...tail] = [5, 6, 7]; // tail → [6, 7]`,
        dsaUse: 'Variadic helpers, splitting a list into head and tail in recursion (though `tail` is an O(n) copy).',
      },
      {
        name: 'optional chaining',
        signature: 'obj?.prop, obj?.[key], fn?.()',
        description: 'Returns `undefined` instead of throwing if the thing on the left is `null` or `undefined`.',
        complexity: 'O(1)',
        example: `const node = { val: 1, left: null };
node.left?.val;         // → undefined (no TypeError)
node.left?.left?.val;   // → undefined
const grid = [[1, 2]];
grid[5]?.[0];           // → undefined (row out of range)`,
        dsaUse: 'Tree/linked list lookups (`fast?.next?.next`), safe grid neighbour reads.',
        pitfall: 'It hides bugs if overused: a missing value you did not expect silently becomes `undefined`.',
      },
      {
        name: 'nullish coalescing',
        signature: 'a ?? b  vs  a || b; x ??= y',
        description: '`a ?? b` uses `b` only when `a` is `null` or `undefined`. `a || b` uses `b` whenever `a` is **falsy**, which includes `0`, `""` and `false`. `??=` assigns only if the target is null/undefined.',
        complexity: 'O(1)',
        example: `const memo = new Map([['k', 0]]);
memo.get('k') || -1;    // → -1  (wrong: 0 was a real answer)
memo.get('k') ?? -1;    // → 0   (right)
memo.get('z') ?? -1;    // → -1

const groups = {};
(groups.a ??= []).push(1);  // groups → { a: [1] }`,
        dsaUse: 'Memo lookups whose values can be 0, default values from Maps, lazy group creation.',
        pitfall: '`(map.get(k) || 0) + 1` is fine for counts (0 → 0 either way), but for memoized answers use `??` or `has`.',
      },
      {
        name: 'default parameters',
        signature: 'function f(node, depth = 0, path = [])',
        description: 'Defaults apply when the argument is `undefined`. They are evaluated **on every call**, so `path = []` gives each call a fresh array (unlike Python\'s shared mutable defaults).',
        complexity: 'O(1) plus the cost of the default expression',
        example: `function depthOf(node, d = 0) {
  if (!node) return d;
  return Math.max(depthOf(node.left, d + 1), depthOf(node.right, d + 1));
}
depthOf({ left: { left: null, right: null }, right: null }); // → 2

function f(x = 10) { return x; }
f(undefined); // → 10
f(null);      // → null (null does not trigger the default)`,
        dsaUse: 'Recursive helpers with accumulators (`lo = 0, hi = arr.length - 1`), BST validation bounds (`low = -Infinity`).',
      },
      {
        name: 'for…of vs for…in vs forEach',
        signature: 'for (const x of arr) / for (const k in obj) / arr.forEach(fn)',
        description: `* \`for…of\` iterates **values** of any iterable (arrays, strings, Maps, Sets). Supports \`break\` and \`continue\`.
* \`for…in\` iterates **keys** of an object as **strings**, including inherited enumerable ones. Do not use it on arrays.
* \`forEach\` calls a function per element. You **cannot \`break\`** out of it; \`return\` only skips to the next element.
* A classic \`for (let i = 0; …)\` is the fastest and gives you the index.`,
        complexity: 'O(n) for all of them',
        example: `for (const x of [10, 20]) console.log(x);   // 10, 20
for (const i in [10, 20]) console.log(typeof i); // 'string', 'string'  (!)
for (const [i, x] of ['a', 'b'].entries()) console.log(i, x); // 0 'a', 1 'b'

[1, 2, 3].forEach((x) => {
  if (x === 2) return;      // only skips 2 — does NOT stop the loop
  console.log(x);           // 1, 3
});

for (const x of [1, 2, 3]) {
  if (x === 2) break;       // really stops
}`,
        dsaUse: '`for…of` for readable scans, index loops when you need `i` or early exit with index math, `for…in` only for plain-object frequency maps.',
        pitfall: '`for (const i in arr)` gives `"0" + 1 === "01"` style bugs because keys are strings.',
      },
      {
        name: 'labeled break',
        signature: 'outer: for (…) { for (…) { break outer; } }',
        description: 'A label names a loop so that `break label` / `continue label` can exit or advance an **outer** loop from inside a nested one.',
        complexity: 'O(1)',
        example: `const grid = [[1, 2], [3, 4]];
let found = null;
outer: for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < grid[0].length; c++) {
    if (grid[r][c] === 3) {
      found = [r, c];
      break outer;          // leaves both loops
    }
  }
}
found; // → [1, 0]`,
        dsaUse: 'Finding the first cell to start a flood fill, early exit from nested searches without a flag variable.',
      },
      {
        name: 'closures for recursion helpers',
        signature: 'function solve(input) { const memo = new Map(); function dfs(i) { … } return dfs(0); }',
        description: 'An inner function can read and update variables of the outer function. Defining `dfs` inside the main function lets it share `grid`, `memo`, `result` and counters without passing them as parameters.',
        complexity: 'O(1) overhead per call',
        example: `function numIslands(grid) {
  const rows = grid.length, cols = grid[0].length;
  let islands = 0;
  function sink(r, c) {                      // closes over grid, rows, cols
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === '1') { islands++; sink(r, c); }
  return islands;
}
numIslands([['1', '1', '0'], ['0', '0', '1']]); // → 2`,
        dsaUse: 'DFS / backtracking / memoized DP helpers that share state with the outer function.',
        pitfall: 'Keep shared state (memo, results) **inside** the outer function. Module-level variables survive between test cases and give wrong answers on the second test.',
      },
    ],
  },

  // ================================================================ Typed arrays
  {
    id: 'typed-arrays',
    title: 'Typed Arrays',
    intro: `Typed arrays (\`Int32Array\`, \`Float64Array\`, \`Uint8Array\`, …) are **fixed-length** arrays of one numeric type stored in a raw memory buffer. Compared with a normal array they:

* are **zero-initialised** automatically,
* use less memory (a \`Uint8Array\` uses 1 byte per slot; a normal array uses at least 8),
* are often faster in tight loops, because the engine knows every element is the same type.

The trade-off: you cannot \`push\`/\`pop\`, and values are **coerced** to the element type (wrapping, truncating, or turning \`Infinity\` into 0 for integer types).`,
    items: [
      {
        name: 'Int32Array',
        signature: 'new Int32Array(n) / Int32Array.from(arr)',
        description: 'Signed 32-bit integers (−2^31 to 2^31 − 1). Fractions are truncated, out-of-range values wrap around.',
        complexity: 'O(n) to create; O(1) read/write',
        example: `const dp = new Int32Array(5);  // → Int32Array [0, 0, 0, 0, 0]
dp[1] = 7.9;
dp[1];                         // → 7 (truncated)
dp[2] = 2 ** 31;
dp[2];                         // → -2147483648 (wrapped)
dp[3] = Infinity;
dp[3];                         // → 0 (!)
new Int32Array([3, 1, 2]).sort(); // → Int32Array [1, 2, 3] (numeric sort by default)`,
        dsaUse: 'DP tables of counts, in-degree arrays, parent arrays in Union Find, prefix sums that stay below 2^31.',
        pitfall: 'Never use an integer typed array for distances initialised to `Infinity` — they become 0. Use `Float64Array` or a large sentinel like `1e9`.',
      },
      {
        name: 'Float64Array',
        signature: 'new Float64Array(n)',
        description: 'Standard JavaScript numbers (doubles) in a packed buffer. Can hold `Infinity`, fractions and integers up to 2^53.',
        complexity: 'O(n) to create; O(1) read/write',
        example: `const dist = new Float64Array(4).fill(Infinity);
dist[0] = 0;
dist;          // → Float64Array [0, Infinity, Infinity, Infinity]
dist[1] = 2.5;
dist[1];       // → 2.5`,
        dsaUse: 'Dijkstra / Bellman-Ford distance arrays, probability DP, large sums beyond 32 bits.',
      },
      {
        name: 'Uint8Array',
        signature: 'new Uint8Array(n)',
        description: 'Unsigned bytes (0–255). The most compact way to store flags.',
        complexity: 'O(n) to create; O(1) read/write',
        example: `const visited = new Uint8Array(6); // all 0
visited[3] = 1;
visited[3] === 1;    // → true
visited[4] = 256;
visited[4];          // → 0 (wraps mod 256)
visited[5] = -1;
visited[5];          // → 255`,
        dsaUse: 'Visited flags for BFS/DFS on up to millions of nodes, sieve of Eratosthenes, grid visited as `visited[r * cols + c]`.',
      },
      {
        name: 'fill / subarray / slice',
        signature: 'ta.fill(v) / ta.subarray(start, end) / ta.slice(start, end)',
        description: '`fill` sets every slot. `subarray` returns a **view** that shares memory (no copy); `slice` returns an independent copy.',
        complexity: 'fill O(n); subarray O(1); slice O(k)',
        example: `const a = new Int32Array([1, 2, 3, 4]);
const view = a.subarray(1, 3); // → Int32Array [2, 3]
view[0] = 99;
a;                             // → Int32Array [1, 99, 3, 4] (shared!)
const copy = a.slice(1, 3);
copy[0] = 0;
a[1];                          // → 99 (unchanged)
a.fill(-1);                    // → Int32Array [-1, -1, -1, -1]`,
        dsaUse: 'Rolling DP rows (swap two typed arrays each iteration), resetting buffers with `fill(0)`.',
        pitfall: 'Writing through a `subarray` view changes the original — use `slice` when you need a copy.',
      },
      {
        name: '2D grids in one typed array',
        signature: 'grid[r * cols + c]',
        description: 'A 2D table can live in one flat typed array: index `r * cols + c`. This avoids creating one array per row and is cache-friendly.',
        complexity: 'O(rows · cols) to create; O(1) access',
        example: `const rows = 3, cols = 4;
const dp = new Int32Array(rows * cols);
const idx = (r, c) => r * cols + c;
dp[idx(2, 1)] = 5;
dp[9];         // → 5
Math.floor(9 / cols); // → 2 (row back from index)
9 % cols;             // → 1 (column back from index)`,
        dsaUse: 'Large grid DP, visited arrays for BFS on big grids, encoding cells as single numbers for queues and Sets.',
      },
    ],
  },

  // ================================================================ Recursion limits
  {
    id: 'recursion-limits',
    title: 'Recursion Limits & the Call Stack',
    intro: `Every function call pushes a **frame** (its local variables and where to return) onto the **call stack**, and the frame is popped when the function returns. The stack has a fixed size. In V8 (Chrome, Node) that is roughly **10,000 frames** for a typical recursive function (fewer if each frame has many locals, more for tiny ones; the exact number is not guaranteed).

Going deeper throws \`RangeError: Maximum call stack size exceeded\`. Problems with inputs up to 10^5 that are allowed to form a single long chain (a linked list, a skewed tree, a path graph, a snake-shaped grid island) can crash a recursive solution that is otherwise correct.`,
    items: [
      {
        name: 'call stack depth',
        signature: 'RangeError: Maximum call stack size exceeded',
        description: 'The depth of recursion, not the total number of calls, is what matters. A balanced tree with 10^6 nodes only recurses about 20 deep; a chain of 10^5 nodes recurses 10^5 deep.',
        complexity: 'Space O(depth) on the call stack',
        example: `function depth(n) { return n === 0 ? 0 : 1 + depth(n - 1); }
depth(1000);     // → 1000
// depth(1e6);   // RangeError: Maximum call stack size exceeded

let max = 0;
function probe(d) { max = d; probe(d + 1); }
try { probe(0); } catch (e) { /* max is now ~10k in most engines */ }`,
        dsaUse: 'Estimating risk: recursion depth ≤ ~5,000 is safe; depth that can reach 10^4–10^5 needs an iterative version.',
        pitfall: 'Space complexity of recursion includes the call stack: a "O(1) extra space" recursive DFS is really O(h).',
      },
      {
        name: 'no tail-call optimisation',
        signature: 'return f(n - 1, acc)',
        description: 'The spec describes proper tail calls, but V8 (Chrome, Node) and Firefox do **not** implement them, so writing a recursion in tail form does not save stack space. (Only Safari does.)',
        complexity: 'Still O(depth) stack',
        example: `function sumTo(n, acc = 0) {
  return n === 0 ? acc : sumTo(n - 1, acc + n); // tail call, still uses a frame per level
}
sumTo(1000);   // → 500500
// sumTo(1e6); // RangeError in Node / Chrome`,
        dsaUse: 'Do not rely on "it is tail recursive" in JavaScript — convert to a loop instead.',
      },
      {
        name: 'recursion → explicit stack (DFS)',
        signature: 'const stack = [start]; while (stack.length) { const u = stack.pop(); … }',
        description: 'Any DFS can use your own array as the stack. Arrays live on the heap, which can hold millions of items.',
        complexity: 'Same time as the recursive version; O(depth) heap memory instead of call stack',
        example: `// iterative flood fill on a grid
function fill(grid, sr, sc, color) {
  const old = grid[sr][sc];
  if (old === color) return grid;
  const stack = [[sr, sc]];
  while (stack.length) {
    const [r, c] = stack.pop();
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== old) continue;
    grid[r][c] = color;
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return grid;
}
fill([[1, 1], [1, 0]], 0, 0, 2); // → [[2, 2], [2, 0]]`,
        dsaUse: 'Flood fill, connected components, graph DFS on large inputs.',
        pitfall: 'The visiting order differs from recursion (neighbours pushed last are visited first). Push in reverse order if the order matters.',
      },
      {
        name: 'iterative tree traversals',
        signature: 'inorder with a stack; postorder with a "visited" flag',
        description: 'In-order: go left pushing nodes, pop one, record it, go right. Post-order: push `[node, visited]`; the first time you see a node, push it back as visited, then its children.',
        complexity: 'O(n) time, O(h) extra space',
        example: `function inorder(root) {
  const out = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    out.push(cur.val);
    cur = cur.right;
  }
  return out;
}
function postorder(root) {
  const out = [], stack = root ? [[root, false]] : [];
  while (stack.length) {
    const [node, visited] = stack.pop();
    if (visited) { out.push(node.val); continue; }
    stack.push([node, true]);
    if (node.right) stack.push([node.right, false]);
    if (node.left) stack.push([node.left, false]);
  }
  return out;
}
const t = { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } };
inorder(t);    // → [1, 2, 3]
postorder(t);  // → [1, 3, 2]`,
        dsaUse: 'BST iterator, kth smallest, any traversal on trees that may be skewed.',
      },
      {
        name: 'memoized recursion → tabulation',
        signature: 'dp[i] = f(dp[i - 1], dp[i - 2], …)',
        description: 'Top-down memoization recurses as deep as the state chain (e.g. n levels for `fib(n)`). Rewriting it bottom-up — filling a table in dependency order with a loop — removes recursion entirely and often allows O(1) space.',
        complexity: 'Same time; removes O(n) stack depth',
        example: `// top-down: depth n, crashes for n ~ 1e5
const memo = new Map();
function ways(n) {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n);
  const r = (ways(n - 1) + ways(n - 2)) % 1000000007;
  memo.set(n, r);
  return r;
}
// bottom-up: no recursion, O(1) space
function waysIter(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, (a + b) % 1000000007];
  return b;
}
ways(30) === waysIter(30); // → true
waysIter(1e6);             // works fine`,
        dsaUse: 'Climbing stairs, house robber, coin change, and any DP whose state chain can be long.',
      },
    ],
  },

  // ================================================================ Missing structures
  {
    id: 'structures-missing-in-js',
    title: 'Structures JavaScript Does Not Have',
    intro: `C++ (STL) and Java (Collections) ship with priority queues, deques, ordered maps and linked lists. JavaScript's standard library only has \`Array\`, \`Map\`, \`Set\` (and typed arrays). LeetCode's JavaScript runtime happens to include the \`@datastructures-js/priority-queue\` and \`@datastructures-js/queue\` packages, but most other judges and live interviews do not, so you should be able to write what you need.

The toolkit in this app provides ready-made versions (and the practice editor exposes them as globals). Here is what to use instead of each missing structure.`,
    items: [
      {
        name: 'priority queue / heap',
        signature: 'C++ priority_queue · Java PriorityQueue → toolkit MinHeap / MaxHeap / PriorityQueue',
        description: 'No built-in heap. Sorting after every insert is O(n log n) per insert. Use a binary heap: see Toolkit → **Min Heap** (`min-heap`), **Max Heap** (`max-heap`) and **Priority Queue** (`priority-queue`).',
        complexity: 'push / pop O(log n), peek O(1)',
        example: `const pq = new MinHeap(([dist]) => dist);
pq.push([5, 'b']);
pq.push([2, 'a']);
pq.pop();   // → [2, 'a']
pq.size();  // → 1`,
        dsaUse: 'Dijkstra, Top K, K-way merge, scheduling, running median.',
        toolkitIds: ['min-heap', 'max-heap', 'priority-queue'],
      },
      {
        name: 'deque / queue',
        signature: 'C++ deque · Java ArrayDeque → toolkit Deque / Queue (or array + head index)',
        description: 'Arrays have O(n) `shift`/`unshift`. For FIFO only, use an array with a moving head index or Toolkit → **Queue** (`queue`). For both ends, Toolkit → **Deque** (`deque`), a circular buffer.',
        complexity: 'O(1) at both ends (amortized for pushes)',
        example: `const dq = new Deque();
dq.pushBack(1);
dq.pushFront(0);
dq.popBack();   // → 1
const q = new Queue([1, 2]);
q.dequeue();    // → 1`,
        dsaUse: 'BFS, sliding window maximum, 0-1 BFS.',
        toolkitIds: ['queue', 'deque'],
      },
      {
        name: 'ordered map / set (TreeMap, std::map, std::set)',
        signature: 'C++ map/set · Java TreeMap/TreeSet → sorted array + binary search, BST, or Fenwick/segment tree',
        description: `No balanced search tree is built in, so there is no O(log n) "insert and keep sorted", floor/ceiling, or ordered iteration of a changing set. Options:

* **Sorted array + binary search**: O(log n) lookups, O(n) inserts (\`splice\`). Often fast enough for n ≤ 10^4–10^5 thanks to fast memory moves.
* **Toolkit → BST** (\`bst\`): O(log n) on random data, but unbalanced (O(n) on sorted input).
* **Fenwick / segment tree over compressed values** (\`fenwick-tree\`, \`segment-tree\`): O(log n) counts / k-th element when all possible values are known up front.
* **Heaps with lazy deletion** when you only need the min/max of a changing multiset.`,
        complexity: 'Sorted array: search O(log n), insert O(n); Fenwick: O(log n)',
        example: `// lower_bound: first index with arr[i] >= x
function lowerBound(arr, x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}
const sorted = [1, 3, 5, 7];
lowerBound(sorted, 4);                  // → 2
sorted.splice(lowerBound(sorted, 4), 0, 4);
sorted;                                 // → [1, 3, 4, 5, 7]`,
        dsaUse: 'Calendar / interval booking, "contains nearby almost duplicate", sliding window median, floor/ceiling queries.',
        pitfall: 'There is no built-in `lowerBound`/`upperBound`/`bisect` — write binary search yourself (and test the edges).',
        toolkitIds: ['bst', 'fenwick-tree', 'segment-tree'],
      },
      {
        name: 'linked list',
        signature: 'C++ list · Java LinkedList → toolkit ListNode / LinkedList / DoublyLinkedList',
        description: 'No built-in linked list. LeetCode passes `ListNode` objects; use Toolkit → **Singly Linked List** (`linked-list`) and **Doubly Linked List** (`doubly-linked-list`) for your own designs such as LRU caches.',
        complexity: 'O(1) insert/remove at a known node',
        example: `const head = arrayToList([1, 2, 3]);
head.next.val;          // → 2
listToArray(head);      // → [1, 2, 3]
const dll = new DoublyLinkedList();
dll.addBack(new DLLNode('k', 'v'));
dll.toArray();          // → ['v']`,
        dsaUse: 'LRU / LFU caches, problems that hand you a `head`.',
        toolkitIds: ['linked-list', 'doubly-linked-list'],
      },
      {
        name: 'multiset / counter',
        signature: 'C++ multiset · Java HashMap<K,Integer> · Python Counter → Map of counts',
        description: 'A Map from value to count covers counting and "remove one occurrence". Delete the key when its count reaches 0 so `size` stays meaningful.',
        complexity: 'O(1) average per update',
        example: `const cnt = new Map();
const add = (x) => cnt.set(x, (cnt.get(x) || 0) + 1);
const remove = (x) => (cnt.get(x) === 1 ? cnt.delete(x) : cnt.set(x, cnt.get(x) - 1));
add('a'); add('a'); add('b');
remove('a');
[...cnt];   // → [['a', 1], ['b', 1]]
cnt.size;   // → 2`,
        dsaUse: 'Anagram windows, "at most k distinct", frequency-based greedy.',
      },
      {
        name: 'pair / tuple hashing',
        signature: 'C++ pair as map key · Java record → string or numeric key',
        description: 'Maps and Sets compare arrays by reference, so tuples need encoding: `r + "," + c` or `r * cols + c` (fast, exact while below 2^53).',
        complexity: 'O(1) numeric key; O(key length) string key',
        example: `const seen = new Set();
const cols = 100;
seen.add(3 * cols + 7);
seen.has(3 * cols + 7);   // → true
seen.add('3,7');
seen.has([3, 7].join(',')); // → true`,
        dsaUse: 'Visited grids, memo keys for multi-argument DP, deduplicating pairs.',
      },
      {
        name: 'union find, tries, segment trees',
        signature: 'Not built into any language → toolkit UnionFind / Trie / SegmentTree / FenwickTree / SparseTable',
        description: 'No language ships these, but they are common in interviews. See the Toolkit entries **Union Find** (`union-find`), **Trie** (`trie`), **Segment Tree** (`segment-tree`), **Fenwick Tree** (`fenwick-tree`) and **Sparse Table** (`sparse-table`).',
        complexity: 'Union Find ~O(1); Trie O(L); Segment/Fenwick O(log n); Sparse table query O(1)',
        example: `const uf = new UnionFind(3);
uf.union(0, 2);
uf.connected(0, 2);        // → true
new Trie(['cat']).startsWith('ca'); // → true`,
        dsaUse: 'Connectivity, prefix search, range queries.',
        toolkitIds: ['union-find', 'trie', 'segment-tree', 'fenwick-tree', 'sparse-table'],
      },
    ],
  },
];

export const COMPLEXITY_TABLE = [
  { op: 'arr[i] (read / write)', time: 'O(1)', note: 'Direct index into the backing store.' },
  { op: 'arr.length', time: 'O(1)', note: 'Stored, not counted.' },
  { op: 'Array.push()', time: 'O(1) amortized', note: 'Occasional O(n) resize, averaged out by doubling.' },
  { op: 'Array.pop()', time: 'O(1)', note: 'Nothing else moves.' },
  { op: 'Array.shift()', time: 'O(n)', note: 'Every element slides left. Avoid in BFS — use a head index.' },
  { op: 'Array.unshift()', time: 'O(n)', note: 'Every element slides right.' },
  { op: 'Array.splice(i, k, …items)', time: 'O(n)', note: 'Elements after i move.' },
  { op: 'Array.slice(a, b)', time: 'O(b − a)', note: 'Copies the range into a new array.' },
  { op: 'Array.concat() / [...a, ...b]', time: 'O(n + m)', note: 'Always a full copy.' },
  { op: 'Array.sort() / toSorted()', time: 'O(n log n)', note: 'TimSort, stable. Default order is by string!' },
  { op: 'Array.reverse()', time: 'O(n)', note: 'In place.' },
  { op: 'Array.includes() / indexOf()', time: 'O(n)', note: 'Linear scan — use a Set inside loops.' },
  { op: 'Array.find() / findIndex() / some() / every()', time: 'O(n)', note: 'Stop at the first decisive element.' },
  { op: 'Array.map() / filter() / reduce() / forEach()', time: 'O(n)', note: 'Assuming an O(1) callback.' },
  { op: 'Array.flat(depth)', time: 'O(total elements)', note: 'Default depth is 1.' },
  { op: 'Array.join()', time: 'O(total length)', note: 'The efficient way to build strings.' },
  { op: 'Array.at(-1)', time: 'O(1)', note: 'Last element.' },
  { op: 'new Array(n).fill(x) / Array.from({ length: n }, f)', time: 'O(n)', note: 'Use Array.from for objects/arrays per slot.' },
  { op: 'Math.max(...arr) / Math.min(...arr)', time: 'O(n)', note: 'Throws RangeError for very large arrays — use a loop.' },
  { op: 'Map.set() / get() / has() / delete()', time: 'O(1) average', note: 'Hash table; O(n) worst case with pathological collisions.' },
  { op: 'Map.size / Set.size', time: 'O(1)', note: 'Property, kept up to date.' },
  { op: 'Iterate Map / Set', time: 'O(n)', note: 'Insertion order.' },
  { op: '[...map.keys()] / [...set]', time: 'O(n)', note: 'Materialises the iterator into an array.' },
  { op: 'Set.add() / has() / delete()', time: 'O(1) average', note: 'Objects/arrays compared by reference.' },
  { op: 'new Set(arr)', time: 'O(n)', note: 'Deduplicates.' },
  { op: 'Object.keys(obj).length', time: 'O(n)', note: 'Builds an array of keys — prefer Map.size.' },
  { op: 'str.length / str[i] / charCodeAt(i)', time: 'O(1)', note: 'UTF-16 code units.' },
  { op: 'str.slice() / substring()', time: 'O(k)', note: 'k = length of the result.' },
  { op: 'str.split() / [...str]', time: 'O(n)', note: 'Creates an array.' },
  { op: 'str.includes() / indexOf(sub)', time: 'O(n·m) worst', note: 'Usually fast in practice, but not guaranteed linear.' },
  { op: 'str.replaceAll() / toLowerCase() / trim()', time: 'O(n)', note: 'Always a new string.' },
  { op: 'str1 === str2 / str1 < str2', time: 'O(min(n, m))', note: 'Character by character.' },
  { op: 's += x (in a loop)', time: 'O(n²) worst total', note: 'Engines use ropes to help; push + join is guaranteed O(n).' },
  { op: 'str.repeat(k)', time: 'O(n·k)', note: 'Output size.' },
  { op: 'parseInt(str, radix) / Number(str)', time: 'O(length)', note: 'Always pass the radix.' },
  { op: 'Bitwise & | ^ ~ << >> >>>', time: 'O(1)', note: 'On 32-bit signed integers.' },
  { op: 'BigInt + and −', time: 'O(digits)', note: 'Much slower than numbers; cannot mix with numbers.' },
  { op: 'Math.floor / ceil / trunc / abs / sqrt / pow', time: 'O(1)', note: 'Hardware floating point.' },
  { op: 'new Int32Array(n) / new Uint8Array(n)', time: 'O(n)', note: 'Zero-initialised, fixed length.' },
  { op: 'typedArray.subarray()', time: 'O(1)', note: 'A view sharing memory; slice() copies in O(k).' },
  { op: 'structuredClone(obj) / JSON round-trip', time: 'O(size of the object)', note: 'Deep copy — expensive inside loops.' },
  { op: 'Recursive call', time: 'O(1) time, O(1) stack each', note: '~10k frames before RangeError in V8.' },
];

export const GOTCHAS = [
  {
    title: 'sort() without a comparator sorts numbers as strings',
    md: `\`[10, 9, 1, 100].sort()\` gives \`[1, 10, 100, 9]\`, because elements are converted to strings and compared as text. Always pass \`(a, b) => a - b\` for numbers. And remember \`sort\` **mutates** the array; use \`toSorted()\` or \`[...arr].sort(…)\` to keep the original.`,
  },
  {
    title: 'shift() makes BFS quadratic',
    md: `\`queue.shift()\` is O(n) because every remaining element moves. A BFS over 10^5 nodes can then do ~10^10 element moves. Use a read index:

\`\`\`js
const q = [start];
for (let head = 0; head < q.length; head++) {
  const u = q[head];
  // q.push(neighbour) ...
}
\`\`\`

or the toolkit \`Queue\`.`,
  },
  {
    title: 'fill([]) shares one array across every slot',
    md: `\`new Array(3).fill([])\` puts **the same** array in all three slots, so \`grid[0].push(1)\` changes every row. The same goes for \`fill({})\` and \`fill(new Array(m).fill(0))\`. Use \`Array.from({ length: n }, () => [])\` or \`Array.from({ length: n }, () => new Array(m).fill(0))\`.`,
  },
  {
    title: 'Arrays as Map / Set keys never match',
    md: `\`set.add([1, 2]); set.has([1, 2])\` is \`false\`: arrays are compared by **reference**, and the second \`[1, 2]\` is a new array. Encode coordinates as \`r + "," + c\` or \`r * cols + c\`. In a grid BFS this bug makes the visited check fail and the search never ends.`,
  },
  {
    title: '0 is falsy',
    md: `\`if (map.get(k))\`, \`memo.get(k) || compute()\`, \`if (!node.val)\` and \`arr.filter(Boolean)\` all treat a real value of \`0\` as "missing". Use \`map.has(k)\`, \`??\`, or explicit \`=== undefined\` / \`=== null\` checks. Likewise \`if (arr.indexOf(x))\` is wrong because index 0 is falsy and -1 is truthy.`,
  },
  {
    title: 'Negative numbers: % and integer division',
    md: `\`-7 % 3\` is \`-1\` (a remainder, sign of the left side), not \`2\`. Normalise with \`((a % m) + m) % m\`. For division, \`Math.floor(-7 / 2)\` is \`-4\` but \`Math.trunc(-7 / 2)\` and \`(-7 / 2) | 0\` are \`-3\`. Problems ported from C++/Java that say "truncate toward zero" need \`Math.trunc\`.`,
  },
  {
    title: 'Numbers stop being exact above 2^53',
    md: `\`Number.MAX_SAFE_INTEGER\` is 9,007,199,254,740,991. Multiplying two values near 10^9 exceeds it, so \`(a * b) % MOD\` can silently give a wrong answer. Use \`BigInt\` for that product (\`Number(BigInt(a) * BigInt(b) % BigInt(MOD))\`) or split the multiplication. Sums are usually safe; products are not.`,
  },
  {
    title: 'Bitwise operators are 32-bit',
    md: `\`1 << 31\` is \`-2147483648\`, \`1 << 32\` is \`1\`, and \`(2 ** 32) | 0\` is \`0\`. Anything above 2^31 − 1 wraps. Use \`>>> 0\` to read a value as unsigned, and BigInt (\`1n << 40n\`) for masks wider than 31 bits. Also parenthesise: \`x & 1 === 0\` parses as \`x & (1 === 0)\`.`,
  },
  {
    title: 'Math.max(...hugeArray) crashes',
    md: `Spreading passes every element as a function argument, and past a few hundred thousand arguments the engine throws \`RangeError: Maximum call stack size exceeded\`. Use a loop or \`arr.reduce((m, x) => (x > m ? x : m), -Infinity)\`. Also \`Math.max()\` with no arguments is \`-Infinity\`.`,
  },
  {
    title: 'Deep recursion overflows the call stack',
    md: `V8 allows roughly 10,000 nested calls. A DFS on a 10^5-node chain, a skewed tree or a long snake-shaped grid region throws \`RangeError\`. JavaScript engines (except Safari) do not optimise tail calls. Convert to an explicit stack, or DP recursion to a bottom-up loop.`,
  },
  {
    title: 'forEach cannot break',
    md: `\`return\` inside a \`forEach\` callback only skips to the next element, and \`break\` is a syntax error there. Use \`for…of\` or a classic \`for\` loop when you need to stop early, or \`some\`/\`every\`/\`find\` which short-circuit.`,
  },
  {
    title: 'for…in gives string keys (and inherited ones)',
    md: `\`for (const i in [10, 20])\` gives \`"0"\` and \`"1"\` as **strings**, so \`i + 1\` is \`"01"\`. It also walks inherited enumerable properties. Use \`for…of\` for values, \`arr.entries()\` for index + value, and \`Object.keys\`/\`Object.entries\` for objects.`,
  },
  {
    title: 'Plain objects as hash maps have hidden keys',
    md: `\`{}\` inherits \`constructor\`, \`toString\`, \`__proto__\`… so counting words with \`obj[w] = (obj[w] || 0) + 1\` breaks on the word "constructor". Object keys are also always strings (\`obj[1]\` is \`obj["1"]\`) and integer-like keys iterate in numeric order, not insertion order. Use \`Map\`.`,
  },
  {
    title: 'Strings are immutable; += in loops can be slow',
    md: `\`s[0] = "x"\` does nothing (or throws in strict mode). To edit, convert to an array (\`[...s]\`), change it, and \`join("")\`. To build a long result, push pieces into an array and join once. Also, \`"10" < "9"\` is \`true\` — strings compare as text, so convert numeric input with \`Number()\`.`,
  },
  {
    title: 'Shared state between test cases',
    md: `Variables declared **outside** your solution function (a global \`memo\`, \`result\` or \`visited\`) keep their values when the judge calls the function again for the next test. Declare state inside the function, or reset it at the start. The same applies to class-level caches in design problems: create them in the constructor.`,
  },
];
