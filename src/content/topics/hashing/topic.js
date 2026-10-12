export default {
  id: 'hashing',
  summary: 'Use a hash table (JavaScript Map / Set) to remember what you have seen, so "have I seen X?" and "how many X?" become O(1) average instead of an O(n) scan.',

  jsTools: [
    { api: 'new Map()', use: 'Key → value store; any key type; keeps insertion order; has .size', complexity: 'get / set / has / delete: O(1) average' },
    { api: 'new Set(iterable)', use: 'Unique values; fast membership', complexity: 'build O(n); add / has / delete O(1) average' },
    { api: 'map.get(k) ?? 0', use: 'Default for counters (?? keeps a real 0)', complexity: 'O(1) average' },
    { api: 'Object.create(null) / {}', use: 'Plain object as a dictionary with string keys only', complexity: 'O(1) average' },
    { api: 'new Array(26).fill(0)', use: 'Frequency table for lowercase letters (a "perfect hash")', complexity: 'O(1) access' },
    { api: '[...s].sort().join("")', use: 'Canonical key for anagrams', complexity: 'O(k log k) per word' },
    { api: 'counts.join("#")', use: 'Canonical key from a count signature', complexity: 'O(σ)' },
    { api: 'Math.floor(Math.random() * n)', use: 'Uniform random index (randomized design problems)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'hash-set-membership',
      name: 'Hash Set — Seen Before?',
      summary: 'Put values in a Set so every "does X exist?" question costs O(1) average instead of an O(n) scan.',
      whyItExists: 'Checking membership in an array is a linear scan. Doing that inside a loop gives O(n²). A Set answers the same question in O(1) average by jumping straight to the bucket where X would live.',
      whenToUse: ['Detect duplicates', 'Check if a value / neighbour exists (x − 1, x + 1)', 'Remove duplicates, intersect/union two lists'],
      clues: ['"contains duplicate"', '"appears at least twice"', '"distinct"', '"exists in"', '"consecutive sequence" in unsorted data'],
      whenNotToUse: ['You need counts, not just presence → frequency map', 'You need order/ranges (smallest greater than x) → sorting or a balanced BST / heap', 'Memory is extremely tight and sorting in place is allowed'],
      template: `function hasDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;   // O(1) average
    seen.add(x);
  }
  return false;
}`,
      variations: [
        { name: 'Sequence starts', description: 'Only start counting a run at x when x − 1 is NOT in the set → longest consecutive sequence in O(n).' },
        { name: 'Visited set', description: 'The same idea marks visited nodes in graph traversals (Graphs topic).' },
      ],
      mistakes: ['Putting arrays/objects into a Set and expecting value equality ([1,2] !== [1,2])', 'Using arr.includes inside a loop instead of a Set'],
      evolution: {
        easy: 'Contains duplicate, intersection of arrays.',
        medium: 'Longest consecutive sequence (only start at sequence beginnings).',
        hard: 'Sets combined with other structures (sliding window, graphs).',
      },
    },
    {
      id: 'hash-frequency-map',
      name: 'Frequency Map (Counting)',
      summary: 'Count how many times each key occurs with map.set(k, (map.get(k) ?? 0) + 1); compare, decrement or take the maximum.',
      whyItExists: 'Many questions only care about how many of each thing there is, not where. A frequency map compresses the input into counts in one pass; comparing counts is then cheap.',
      whenToUse: ['Anagram / permutation checks', '"Can A be built from B?"', 'Most common value / position', 'Majority, top-k (with a heap later)'],
      clues: ['"anagram"', '"same characters"', '"can be constructed from"', '"most frequent"', '"how many times"', '"least number of bricks crossed"'],
      whenNotToUse: ['Order matters (subsequence, contiguous) → the counts alone are not enough', 'Only presence matters → a Set is simpler'],
      template: `function countOf(items) {
  const freq = new Map();
  for (const x of items) freq.set(x, (freq.get(x) ?? 0) + 1);
  return freq;
}

// "can target be built from source?"
function canBuild(target, source) {
  const freq = countOf(source);
  for (const ch of target) {
    const left = (freq.get(ch) ?? 0) - 1;
    if (left < 0) return false;
    freq.set(ch, left);
  }
  return true;
}`,
      variations: [
        { name: 'Fixed alphabet array', description: 'new Array(26).fill(0) with charCodeAt(i) − 97: faster than Map for lowercase letters.' },
        { name: 'Increment one, decrement the other', description: 'Anagram check with a single table: +1 for s, −1 for t, all zero at the end.' },
        { name: 'Count positions', description: 'Brick wall: count how many rows have an edge at each x, take the max.' },
      ],
      mistakes: ['Using || for defaults in contexts where 0 or "" are real values (prefer ??)', 'Forgetting to delete zero-count keys when relying on map.size', 'Comparing two Maps with === (compares references)'],
      evolution: {
        easy: 'Valid anagram, ransom note.',
        medium: 'Brick wall, top-k frequent (with bucket sort / heap).',
        hard: 'Frequency maps inside sliding windows (minimum window substring).',
      },
    },
    {
      id: 'hash-complement-lookup',
      name: 'Complement Lookup',
      summary: 'While scanning, ask the map for the partner you need (target − x); if it is there you are done, otherwise store x for future elements.',
      whyItExists: 'Pair problems ask "is there an earlier y with f(x, y) true?". If the needed y can be computed from x (y = target − x), a map of earlier values answers it in O(1) — the O(n²) pair search collapses to O(n).',
      whenToUse: ['Find a pair (or count pairs) with a given sum / difference / XOR', 'Split 4 arrays into 2 + 2 and meet in the middle'],
      clues: ['"two numbers add up to target"', '"return their indices"', '"count tuples (i, j, k, l) with sum 0"', '"pairs with difference k"'],
      whenNotToUse: ['The input is sorted and O(1) space is required → two pointers (next topic)', 'You need all triples/quadruples from ONE array without duplicates → sort + two pointers is cleaner'],
      template: `function twoSum(nums, target) {
  const indexOf = new Map();          // value → index (only EARLIER elements)
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (indexOf.has(need)) return [indexOf.get(need), i];
    indexOf.set(nums[i], i);           // store AFTER checking → never pairs with itself
  }
  return [];
}`,
      variations: [
        { name: 'Count complements', description: 'Store counts instead of indices to count all pairs.' },
        { name: 'Meet in the middle', description: '4Sum II: map all sums a + b, then look up −(c + d): O(n²) instead of O(n⁴).' },
        { name: 'Prefix-sum complement', description: 'Subarray sum equals k: look up prefix − k (Prefix Sum topic).' },
      ],
      mistakes: ['Inserting before checking (an element pairs with itself when target = 2x)', 'Storing value → index for duplicates and overwriting the one you needed (check first, then store)'],
      evolution: {
        easy: 'Two sum.',
        medium: '4Sum II (meet in the middle), pairs with difference k.',
        hard: 'Prefix sums + complement for subarray counting (later topics).',
      },
    },
    {
      id: 'hash-canonical-key',
      name: 'Canonical Keys (Grouping by Signature)',
      summary: 'Turn each item into a normalised key so that "equivalent" items get the SAME key, then group or count by that key.',
      whyItExists: 'Hash maps compare keys exactly. When equivalence is looser (anagrams, same pattern, same slope, same box of a Sudoku), design a key that captures exactly that equivalence — then the map does the grouping for free.',
      whenToUse: ['Group anagrams', 'Same "shape" or pattern (isomorphic strings)', 'Points on the same line (normalised slope)', 'Composite keys like row/col/box in Sudoku'],
      clues: ['"group"', '"anagrams"', '"same pattern"', '"on the same line"', '"each row, column and 3×3 box"'],
      whenNotToUse: ['No cheap normal form exists (graph isomorphism)', 'Floating-point keys — normalise to integers instead (gcd for slopes)'],
      template: `function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);                 // canonical form
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}
// anagram key:   [...w].sort().join('')              O(k log k)
// count key:     counts(26).join('#')                O(k + 26)
// slope key:     (dy/g) + '/' + (dx/g), sign fixed   O(log)`,
      variations: [
        { name: 'Sorted-string key', description: 'Simple anagram signature: O(k log k) per word.' },
        { name: 'Count signature', description: '26 counts joined with a separator: O(k) per word.' },
        { name: 'Composite string key', description: '`${r}-${c}` or "r3:5" — encode tuples as strings because Map compares arrays by reference.' },
        { name: 'Bijection maps', description: 'Isomorphic strings: two maps (s→t and t→s) or map both strings to first-occurrence index patterns.' },
      ],
      mistakes: ['Using an array as a Map key (reference equality — never found again)', 'Ambiguous count keys without separators ("1,11" vs "11,1" collapse when joined with "")', 'Floating-point slopes (0.1 + 0.2 !== 0.3) and forgetting to normalise signs'],
      evolution: {
        easy: 'Isomorphic strings, word pattern.',
        medium: 'Group anagrams, valid Sudoku.',
        hard: 'Max points on a line (gcd-normalised slopes).',
      },
    },
    {
      id: 'hash-index-map-design',
      name: 'Index Map + Array (O(1) Design)',
      summary: 'Store values in an array (for O(1) random access) and a map value → index (for O(1) lookup); delete by swapping with the last element and popping.',
      whyItExists: 'A Map alone cannot pick a uniformly random element in O(1); an array alone cannot delete a given value in O(1). Together — with the swap-with-last trick — every operation is O(1) average.',
      whenToUse: ['Design a set/multiset with insert, remove and getRandom in O(1)', 'Any structure needing both "find by value" and "access by position"'],
      clues: ['"design a data structure"', '"average O(1) time"', '"getRandom"', '"each element equally likely"'],
      whenNotToUse: ['Order of elements must be preserved (swap-with-last scrambles it)'],
      template: `class RandomizedSet {
  constructor() { this.vals = []; this.pos = new Map(); } // value → index
  insert(v) {
    if (this.pos.has(v)) return false;
    this.pos.set(v, this.vals.length);
    this.vals.push(v);
    return true;
  }
  remove(v) {
    if (!this.pos.has(v)) return false;
    const i = this.pos.get(v), last = this.vals[this.vals.length - 1];
    this.vals[i] = last; this.pos.set(last, i);   // move last into the hole
    this.vals.pop(); this.pos.delete(v);
    return true;
  }
  getRandom() { return this.vals[Math.floor(Math.random() * this.vals.length)]; }
}`,
      variations: [
        { name: 'Duplicates allowed', description: 'value → Set of indices; getRandom over the array is automatically weighted by count.' },
        { name: 'LRU cache', description: 'Map + doubly linked list (Linked List topic).' },
      ],
      mistakes: ['Deleting from the map before updating the moved element (breaks when removing the last element)', 'Using splice (O(n)) instead of swap + pop', 'Iterating a Map to pick a random key (O(n))'],
      evolution: {
        easy: 'Design HashSet / HashMap with buckets.',
        medium: 'Insert Delete GetRandom O(1).',
        hard: 'Duplicates allowed; LFU cache.',
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
            md: `**Hashing** is a way to store things so you can find them again **instantly**, without searching.

Imagine a coat check with 100 numbered hooks. When you hand over a coat, the attendant computes a hook number from your name (say, by adding up the letters and taking the remainder mod 100) and hangs it there. When you come back, they do the same computation and go straight to the right hook. No scanning all 100 hooks.

That computation is a **hash function**; the hooks are **buckets**; the whole setup is a **hash table**. In JavaScript you use it through **\`Map\`** (key → value) and **\`Set\`** (just keys).

\`\`\`js
const age = new Map();
age.set('ana', 31);          // hash('ana') → bucket, store there
age.get('ana');              // hash('ana') → same bucket → 31
new Set([3, 1, 3]).has(3);   // true
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Hash function** — turns a key into a number (its *hash*). Same key → always the same number.
- **Bucket** — a slot in the table's internal array: \`bucket = hash(key) % capacity\`.
- **Collision** — two different keys land in the same bucket. The table must handle it (e.g. each bucket holds a small list — *chaining* — or it probes the next free slot — *open addressing*).
- **Load factor** — entries ÷ buckets. When it gets too high, the table **resizes** (allocates more buckets and re-inserts everything) to keep buckets short.
- **Map** — key → value. **Set** — collection of unique keys.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A library that shelves books by the first letter of the author. To find "Orwell" you go straight to shelf O (the bucket). Several authors share shelf O (collisions), so you scan that one shelf — which is short, as long as the library adds shelves when they get crowded (resizing).',
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-1',
            question: 'What does a hash table do when looking up a key?',
            options: [
              'Compares the key with every stored key from first to last',
              'Sorts the keys and binary-searches',
              'Computes hash(key) to jump to one bucket, then checks only the few keys in that bucket',
              'Stores keys in a tree and walks down it',
            ],
            answer: 2,
            explanation: 'The hash tells the table where the key would live. Only that bucket is examined — on average it holds a constant number of keys, so lookups are O(1) average.',
            misconceptions: {
              0: 'That is a linear scan (what `array.includes` does) — O(n). Avoiding it is the whole point of hashing.',
              1: 'Sorted arrays + binary search give O(log n). Hash tables do not keep keys sorted at all.',
              3: 'That describes a balanced binary search tree (O(log n), keeps order) — e.g. Java\'s TreeMap. JavaScript has no built-in one.',
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
            md: `Hashing is the most common way to turn an O(n²) solution into O(n): **trade memory for speed**.

| Question | Array scan | Hash map / set |
|---|---|---|
| "Have I seen x before?" | O(n) each → O(n²) total | O(1) avg each → O(n) total |
| "How many times does x appear?" | O(n) each | O(1) avg after an O(n) counting pass |
| "Is target − x somewhere earlier?" | O(n) each | O(1) avg each |

The price is **O(n) extra memory** for the table.`,
          },
          {
            type: 'text',
            md: `**Why O(1) *average* and not always?** If the hash function spreads keys evenly and the table resizes to keep the load factor below a constant, each bucket holds O(1) keys on average. Resizing costs O(n) occasionally, but — just like \`push\` on a dynamic array — that is O(1) **amortized**.

**Worst case O(n):** if many keys collide into one bucket (bad hash function, or an attacker crafting colliding keys), a lookup degrades to scanning a long list. JavaScript engines use good hash functions and randomised seeds, so in interviews you state **"O(1) average, O(n) worst case"**.`,
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-2',
            question: 'Why do interviewers expect you to say hash map lookups are "O(1) **average**"?',
            options: [
              'Because in the worst case many keys can collide into one bucket and a lookup scans them all — O(n)',
              'Because Map.get is O(log n) in JavaScript',
              'Because hashing a key takes O(n) time where n is the map size',
              'Because the table must be sorted after each insert',
            ],
            answer: 0,
            explanation: 'With a good hash and resizing, buckets stay short on average. But nothing prevents a pathological input from sending everything to one bucket, so the guarantee is only on average.',
            misconceptions: {
              1: 'JavaScript Maps are hash tables (the spec only requires sublinear access, and engines implement O(1) average hashing).',
              2: 'Hashing cost depends on the size of the KEY (e.g. string length), not on how many entries the map holds.',
              3: 'Hash tables are unordered internally; nothing is sorted. (Map iteration order is insertion order, which is tracked separately.)',
            },
            deeper: 'Subtle point: hashing a string key of length k costs O(k). So "O(1) per lookup" silently assumes short keys. With long string keys (e.g. sorted words in Group Anagrams), a lookup is O(k) — include it in your complexity.',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for a Map/Set when you catch yourself writing a **nested loop that searches for something**:

1. **Membership** — "does x exist?" → \`Set\`.
2. **Counting** — "how many of each?" → frequency \`Map\` (or a 26-slot array for letters).
3. **Complement** — "is there an earlier y with x + y = target?" → \`Map\` of value → index/count.
4. **Grouping** — "which items are equivalent?" → \`Map\` from a canonical key to a list.
5. **Design** — O(1) lookup by value combined with other structures.

**Map vs plain Object** — prefer \`Map\` in DSA code:

| | \`Map\` | \`{}\` object |
|---|---|---|
| Key types | anything (numbers stay numbers, objects by reference) | strings/symbols only — \`obj[1]\` and \`obj['1']\` are the same key |
| Size | \`map.size\` O(1) | \`Object.keys(obj).length\` O(n) |
| Order | insertion order | integer-like keys first (ascending), then strings in insertion order |
| Prototype pitfalls | none | \`'constructor' in {}\` is **true**; \`obj['__proto__'] = 1\` does not create a key |
| Iteration | \`for (const [k, v] of map)\` | \`Object.entries(obj)\` (builds an array) |`,
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-3',
            question: 'You count words with a plain object: `const c = {}; for (const w of words) c[w] = (c[w] || 0) + 1;`. The input contains the word `"constructor"`. What happens?',
            options: [
              'It works perfectly, "constructor" is just another key',
              'c["constructor"] starts as the inherited Object function, so the count becomes a string like "function Object() { [native code] }1"',
              'It throws a SyntaxError',
              'The word is silently skipped',
            ],
            answer: 1,
            explanation: 'Plain objects inherit from Object.prototype, so `c.constructor` already exists (it is the Object function). `(c[w] || 0)` picks the function, and `function + 1` concatenates as strings. A Map (or `Object.create(null)`) has no inherited keys.',
            misconceptions: {
              0: 'Inherited properties like constructor, toString and hasOwnProperty are visible through `obj[key]`. That is the classic plain-object trap.',
              2: 'Nothing is syntactically wrong — it fails silently, which is worse.',
              3: 'It is not skipped; it is corrupted.',
            },
            deeper: '`__proto__` is even stranger: `c["__proto__"] = 1` tries to set the prototype and is ignored for non-objects, so the key never appears. Use `new Map()` for arbitrary keys; if you must use an object, create it with `Object.create(null)`.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"duplicate", "distinct", "unique"', '"anagram", "same characters"', '"two numbers add up to"', '"group", "same pattern"', '"how many times", "most frequent"', '"in O(n)" on unsorted data', '"design … average O(1)"'],
            conclusion: 'Think Hash Map / Hash Set',
          },
          {
            type: 'text',
            md: `Ask: **"What would I search for inside my inner loop?"** If the thing you search for can be computed from the current element (x itself, target − x, a signature of x), store the earlier elements in a Map keyed by exactly that thing.`,
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-4',
            question: '"Given an unsorted array, find the length of the longest run of consecutive integers (like 1, 2, 3, 4) in O(n)." Which structure is the key ingredient?',
            options: [
              'Sort the array — O(n log n)',
              'A Set of all values, so "is x + 1 present?" is O(1)',
              'A stack',
              'A 2-D matrix',
            ],
            answer: 1,
            explanation: 'The run does not have to be adjacent in the array, only in value. With a Set you can walk x, x+1, x+2… checking each in O(1). (Start only from values whose x − 1 is absent, to keep it O(n) overall.)',
            misconceptions: {
              0: 'Sorting works and is a good first answer, but it is O(n log n), not O(n).',
              2: 'Nothing here is last-in-first-out; a stack does not help look up values.',
              3: 'Values can be up to 10⁹; no grid is involved.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — remember what you have seen',
        blocks: [
          {
            type: 'text',
            md: `Brute-force pair problems look like this:

\`\`\`text
for each x:
  for each earlier y:        ← searching
    if good(x, y): ...
\`\`\`

The inner loop **searches** the past. A hash map **remembers** the past in a way that makes the search O(1): instead of looking at every earlier y, you compute *which* y would work and ask the map directly.

For Two Sum (\`x + y = target\`), the y that works is exactly \`target − x\` — the **complement**.`,
          },
          { type: 'visual', scenario: 'hash-map', caption: "Watch keys land in buckets — and what a collision looks like." },
          {
            type: 'dryrun',
            title: 'twoSum([2, 7, 11, 15], 9)',
            columns: ['i', 'x', 'need = 9 − x', 'map before', 'action'],
            rows: [
              ['0', '2', '7', '{}', '7 not found → store 2→0'],
              ['1', '7', '2', '{2→0}', '2 found at 0 → return [0, 1]'],
            ],
            note: 'We check BEFORE storing, so an element can never pair with itself.',
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-5',
            question: 'In Two Sum, why do we check the map for the complement **before** inserting the current element?',
            options: [
              'Because Map.set is slower than Map.has',
              'So an element cannot be paired with itself (e.g. nums = [3, 5], target = 6 must not return [0, 0])',
              'Because the map must stay sorted',
              'It does not matter; either order is correct',
            ],
            answer: 1,
            explanation: 'If 3 were stored first, looking up 6 − 3 = 3 would find the element itself. Checking first means the map only ever contains EARLIER indices.',
            misconceptions: {
              0: 'Both are O(1) average; the order is about correctness.',
              2: 'Maps are never sorted.',
              3: 'Inserting first breaks when target = 2·x — you would return the same index twice.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'code',
            title: 'Two Sum — every pair, O(n²) time, O(1) space',
            code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
            caption: 'n = 10⁴ → about 5·10⁷ pair checks: borderline. n = 10⁵ → 5·10⁹: far too slow.',
          },
          {
            type: 'code',
            title: 'Still O(n²): includes / indexOf hide the inner loop',
            code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    const j = nums.indexOf(target - nums[i], i + 1); // O(n) scan!
    if (j !== -1) return [i, j];
  }
  return [];
}`,
            caption: 'Looks like one loop, but indexOf is a loop too (Complexity topic: hidden costs).',
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — complement lookup',
        blocks: [
          {
            type: 'steps',
            title: 'One pass with a Map',
            steps: [
              'Create `indexOf = new Map()` (value → index of an earlier element).',
              'For each i, compute `need = target − nums[i]`.',
              'If `indexOf.has(need)`, return `[indexOf.get(need), i]`.',
              'Otherwise `indexOf.set(nums[i], i)` and continue.',
            ],
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why one pass is enough — why we never need to look "ahead" for the partner?',
            deeper: 'Every valid pair (i, j) with i < j is discovered when we reach j: at that moment i is already in the map. So scanning left to right and only ever looking back covers every pair exactly once. This "look back with a map" idea generalises: prefix sums + map (Prefix Sum topic), and counting pairs instead of finding one (store counts, add `map.get(need)` to the answer).',
          },
        ],
      },
      {
        id: 'intuition-frequency',
        title: 'Core intuition — frequency maps',
        blocks: [
          {
            type: 'text',
            md: `Two strings are **anagrams** if they contain the same letters the same number of times (\`"listen"\` / \`"silent"\`). Position does not matter — only **counts**.

\`\`\`js
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);            // 'a'..'z'
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;                // +1 for s
    count[t.charCodeAt(i) - 97]--;                // −1 for t
  }
  return count.every((c) => c === 0);
}
\`\`\`

For a small, known alphabet, a plain array indexed by character code is a **perfect hash** — no collisions, very fast. For arbitrary keys (Unicode, words, numbers), use a \`Map\`.`,
          },
          { type: 'visual', scenario: 'frequency-map', caption: "Count with a Map, then cancel the counts to compare two strings." },
          {
            type: 'checkpoint',
            id: 'hashing-cp-6',
            question: 'Ransom Note: can `note` be built using letters from `magazine` (each letter used once)? Which approach is correct and O(n + m)?',
            options: [
              'For each letter of note, check magazine.includes(letter)',
              'Sort both strings and compare them for equality',
              'Check that every distinct letter of note appears in magazine (a Set)',
              'Count magazine letters, then decrement for each note letter; fail if any count goes below 0',
            ],
            answer: 3,
            explanation: 'Counts capture "how many of each letter are available". Each note letter consumes one; a negative count means we ran out.',
            misconceptions: {
              0: 'includes ignores multiplicity ("aa" from "ab" would pass) and is O(m) per letter → O(n·m).',
              1: 'The magazine usually has extra letters, so the sorted strings are not equal even when the note can be built. Also O(n log n).',
              2: 'A Set loses counts: note "aa" with magazine "a" would incorrectly pass.',
            },
          },
        ],
      },
      {
        id: 'optimized-canonical',
        title: 'Optimized approach — canonical keys',
        blocks: [
          {
            type: 'text',
            md: `**Group Anagrams:** \`["eat","tea","tan","ate","nat","bat"]\` → \`[["eat","tea","ate"],["tan","nat"],["bat"]]\`.

Idea: give every word a **canonical key** — a normal form that is identical for all anagrams and different otherwise — and group by it:

| word | sorted key | count key |
|---|---|---|
| eat | \`aet\` | \`1#0#0#0#1#…#1#…\` |
| tea | \`aet\` | same |
| tan | \`ant\` | different |

- **Sorted key:** \`[...w].sort().join('')\` — O(k log k) per word.
- **Count key:** 26 counts joined with a separator — O(k) per word. The separator matters: without it, counts \`[1, 11]\` and \`[11, 1]\` both become \`"111"\`.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Arrays are not good Map keys',
            md: '`map.set([1, 2], "x"); map.get([1, 2])` → `undefined`. Maps compare object keys by **reference**, and each `[1, 2]` literal is a new object. Encode tuples as strings: `` `${a},${b}` `` or `a + "," + b`.',
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-7',
            question: 'For Max Points on a Line you group points by the slope from an anchor point. Why not use `dy / dx` (a float) as the key?',
            options: [
              'Floats cannot be Map keys',
              'Floating-point division can give slightly different results for the same slope, and vertical lines divide by zero; use the reduced fraction (dy/g, dx/g) with a fixed sign as a string key',
              'Division is too slow',
              'Because slopes must be sorted first',
            ],
            answer: 1,
            explanation: 'Canonical keys must be EXACT. Reducing by gcd (and forcing e.g. dx > 0) gives every equal slope the same integer pair; vertical lines become "1/0".',
            misconceptions: {
              0: 'Numbers (including floats) are valid Map keys. The problem is precision, not legality.',
              2: 'Speed is irrelevant; correctness is the issue.',
              3: 'Grouping by key needs no sorting at all.',
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
            title: 'The four everyday hash templates',
            code: `// 1. membership
const seen = new Set();
for (const x of nums) { if (seen.has(x)) { /* duplicate */ } seen.add(x); }

// 2. frequency
const freq = new Map();
for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);

// 3. complement (check, then store)
const idx = new Map();
for (let i = 0; i < nums.length; i++) {
  if (idx.has(target - nums[i])) { /* pair found */ }
  idx.set(nums[i], i);
}

// 4. grouping by canonical key
const groups = new Map();
for (const item of items) {
  const key = canonical(item);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Group Anagrams with a count-signature key — O(n·k)',
            code: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const count = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
    const key = count.join('#');            // separator avoids ambiguity
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`map.get(k) ?? 0\` — \`??\` only replaces \`undefined\`/\`null\`, so a stored \`0\` stays \`0\`.
- \`new Set(arr).size !== arr.length\` — one-line duplicate check (O(n)).
- \`Map\` keys use **SameValueZero**: \`NaN\` equals \`NaN\`, \`0\` equals \`-0\`, objects by reference.
- Iterate with \`for (const [k, v] of map)\`, \`map.keys()\`, \`map.values()\` — insertion order.
- \`Object.keys(obj).length\` is O(n); \`map.size\` is O(1).`,
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-8',
            question: '`const m = new Map(); m.set(1, "a"); m.set("1", "b");` What is `m.size`, and what would the same code give with a plain object `o[1] = "a"; o["1"] = "b"`?',
            options: [
              'Map: 1, object: 1',
              'Map: 2, object: 2',
              'Map: 1, object: 2',
              'Map: 2 (number 1 and string "1" are different keys), object: 1 (object keys are converted to strings)',
            ],
            answer: 3,
            explanation: 'Map keeps key types, so 1 and "1" are distinct. Object property names are always strings (or symbols), so o[1] and o["1"] are the same property.',
            misconceptions: {
              0: 'Maps do not coerce keys. Only objects turn keys into strings.',
              1: 'The object coerces 1 → "1", so the second assignment overwrites the first.',
              2: 'It is the other way around: the Map distinguishes the keys, the object merges them.',
            },
          },
        ],
      },
      {
        id: 'optimized-design',
        title: 'Optimized approach — designing O(1) structures',
        blocks: [
          {
            type: 'text',
            md: `**Insert / Delete / GetRandom in O(1):**

- A **Map** alone: insert/delete O(1), but picking a random key means iterating — O(n).
- An **array** alone: random pick O(1) (\`vals[Math.floor(Math.random() * n)]\`), but deleting a value means finding it — O(n) — and \`splice\` shifts — O(n).
- **Both:** array \`vals\` + Map \`pos\` (value → index). To delete \`v\` at index i: copy the **last** element into slot i, update its index in the map, then \`pop()\`. No shifting.

\`\`\`text
vals = [10, 20, 30, 40]   remove 20 (i = 1)
move last (40) into slot 1 → [10, 40, 30, 40]
pop                         → [10, 40, 30]
pos: 40 → 1, delete 20
\`\`\``,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why removing the LAST element needs no special case in the swap-with-last trick — as long as you update the map before deleting?',
            deeper: 'If v is itself the last element, "move last into slot i" copies v onto itself and `pos.set(v, i)` rewrites the same index. Then `pop()` removes it and `pos.delete(v)` removes the key. If you had done `pos.delete(v)` FIRST and `pos.set(last, i)` afterwards, you would re-insert v into the map — a ghost entry. Order: update the moved element, then pop, then delete.',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'Longest consecutive sequence: nums = [100, 4, 200, 1, 3, 2]',
            columns: ['x', 'x − 1 in set?', 'action', 'run length', 'best'],
            rows: [
              ['100', 'no', 'start: 101? no', '1', '1'],
              ['4', 'yes (3)', 'skip — not a start', '—', '1'],
              ['200', 'no', 'start: 201? no', '1', '1'],
              ['1', 'no', 'start: 2 ✓ 3 ✓ 4 ✓ 5 ✗', '4', '4'],
              ['3', 'yes', 'skip', '—', '4'],
              ['2', 'yes', 'skip', '—', '4'],
            ],
            note: 'Each value is walked over at most once as part of a run (only from its run\'s start), so the total work is O(n) even with the inner while loop.',
          },
          {
            type: 'checkpoint',
            id: 'hashing-cp-9',
            question: 'In longest consecutive sequence, what goes wrong if you start walking a run from EVERY x (not just from x whose x − 1 is absent)?',
            options: [
              'The answer becomes wrong',
              'Nothing — it is the same complexity',
              'It is still correct but can become O(n²): for 1..n, the run from 1 walks n steps, from 2 walks n − 1, …',
              'It throws because the Set is modified',
            ],
            answer: 2,
            explanation: 'Every start would re-walk the tail of the same run. Starting only at run beginnings guarantees each value is visited by exactly one walk → O(n).',
            misconceptions: {
              0: 'The maximum is still found, because the true start is among the starting points. Only the running time suffers.',
              1: 'For the input 1..n the work is n + (n−1) + … + 1 = O(n²).',
              3: 'The Set is only read during the walks, never modified.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Inserting before checking** in complement lookups (element pairs with itself).
2. **Arrays/objects as keys** — compared by reference; encode as strings.
3. **Plain objects with arbitrary keys** — inherited keys like \`constructor\`, \`toString\`, and \`__proto__\` break counting; numbers become strings.
4. **\`||\` instead of \`??\`** — fine for counts, but wrong when 0/''/false are meaningful values.
5. **Stale zero counts** — decrementing to 0 without \`delete\` makes \`map.size\` lie.
6. **Ambiguous composite keys** — \`"1" + "11"\` equals \`"11" + "1"\`; use a separator.
7. **Floating-point keys** — normalise to integers (gcd).
8. **Forgetting the space cost** — hashing solutions are usually O(n) extra memory; say so.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(1) average per operation (O(n) worst case); O(n) for a full pass',
            space: 'O(n) for the table (O(σ) for a fixed alphabet)',
            md: '**Time:** hashing a key of length k costs O(k), then the bucket lookup is O(1) average. Resizing is amortized O(1). Worst case (all keys collide) is O(n) per operation. **Space:** one entry per distinct key. With a fixed alphabet (26 letters), the table is O(1).',
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Name the trade-off**: "I'll use O(n) extra space to get O(n) time instead of O(n²)."
- **Say "average"**: "Map lookups are O(1) on average."
- **Justify Map over object**: key types, \`size\`, no prototype keys.
- **Describe your key** precisely for grouping problems: "sorted letters", "26 counts joined by #", "reduced dy/dx with dx > 0".
- **Mention alternatives**: sort + scan uses O(1) extra space but O(n log n) time.`,
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
              { api: 'new Map() / get / set / has / delete / size', use: 'General key → value table', complexity: 'O(1) average' },
              { api: 'new Set(iterable) / add / has / delete', use: 'Membership, dedupe', complexity: 'O(1) average' },
              { api: 'map.get(k) ?? 0', use: 'Counter default', complexity: 'O(1) average' },
              { api: 'new Array(26).fill(0)', use: 'Letter frequency table', complexity: 'O(1) access' },
              { api: '[...map.values()] / map.entries()', use: 'Extract groups / iterate in insertion order', complexity: 'O(n)' },
              { api: 'Object.create(null)', use: 'Prototype-free object dictionary', complexity: 'O(1) average' },
              { api: '`${a},${b}` string keys', use: 'Composite keys (tuples, coordinates)', complexity: 'O(key length)' },
              { api: 'Math.floor(Math.random() * n)', use: 'Uniform random index', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Membership / duplicates', 'Counting occurrences', 'Pair with a target (complement)', 'Grouping by an equivalence', 'O(1) design problems'],
    clues: ['duplicate', 'distinct', 'anagram', 'add up to target', 'group', 'most frequent', 'O(n) on unsorted input', 'getRandom'],
    template: `const freq = new Map();
for (const x of a) freq.set(x, (freq.get(x) ?? 0) + 1);

const idx = new Map();
for (let i = 0; i < a.length; i++) {
  if (idx.has(t - a[i])) return [idx.get(t - a[i]), i];
  idx.set(a[i], i);
}`,
    complexity: 'O(n) time (O(1) average per op, O(n) worst), O(n) space',
    mistakes: ['insert before check', 'array keys', 'object prototype keys', 'stale zero counts', 'float keys'],
    jsTools: ['Map', 'Set', '??', 'Array(26)', 'string keys', 'Math.random'],
  },

  keyConcepts: [
    'A hash function maps a key to a bucket; lookups inspect only that bucket.',
    'O(1) average relies on a good hash and resizing (amortized); worst case is O(n) when keys collide.',
    'Prefer Map over plain objects: any key type, O(1) size, no prototype keys.',
    'Set → membership; frequency Map → counts; complement lookup → pairs; canonical key → grouping.',
    'Check before you insert in complement problems so an element never pairs with itself.',
    'Encode composite keys as strings with separators; never rely on array keys.',
    'Array + index Map with swap-with-last gives O(1) insert, delete and random access.',
  ],

  interviewTips: [
    'State the space-for-time trade-off explicitly.',
    'Say "O(1) average" for Map/Set operations.',
    'Describe the canonical key precisely in grouping problems.',
  ],
};
