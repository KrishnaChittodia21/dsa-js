// Step lessons for Hashing (Map & Set) (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// a Map drawn as key → value rows; `on` = key to highlight, `st` = its state
const mapT = (entries, label, on, st = 'active', col = 'value') =>
  entries.length
    ? table(entries.map(([k]) => String(k)), [col], entries.map(([, v]) => [String(v)]), entries.map(([k]) => [String(k) === String(on) ? st : '']), label)
    : table(['—'], [col], [['(empty)']], undefined, label);

// ---------- what: a toy hash (letter positions summed, a = 1) into 8 buckets ----------
const EMPTY8 = Array(8).fill('·');
const withB = (cells) => EMPTY8.map((v, i) => cells[i] ?? v);

// ---------- why: "seen before?" by scanning vs by Set ----------
const FIVE = [5, 2, 8, 3, 6];
const tri = (i) => (i * (i + 1)) / 2;

// ---------- intuition: twoSum([3, 8, 4, 1], 5) ----------
function twoSumRun(nums, target) {
  const out = [];
  const m = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    const hit = m.has(need) ? m.get(need) : null;
    out.push({ i, need, before: [...m], hit });
    if (hit !== null) break;
    m.set(nums[i], i);
  }
  return out;
}
const T1 = [3, 8, 4, 1];
const T2 = [5, 1, 3, 9, 7];
const tsFrames = (nums, target, say) =>
  twoSumRun(nums, target).map(({ i, need, before, hit }) => ({
    say,
    note: hit !== null ? `i = ${i}: need ${need} is in the map at ${hit} → return [${hit}, ${i}].` : `i = ${i}: need ${need} is not there → store ${nums[i]} → ${i}.`,
    panels: [
      arr(nums, { label: `nums, target ${target}`, pointers: [ptr(i, 'i')], highlights: hl(nums.length, (k) => (k === i ? 'active' : hit !== null && k === hit ? 'done' : k < i ? 'visited' : '')) }),
      vars({ x: nums[i], need }),
      mapT(hit !== null ? before : [...new Map([...before, [nums[i], i]])], 'indexOf', hit !== null ? need : nums[i], hit !== null ? 'done' : 'active'),
    ],
  }));

// ---------- brute force: every pair on [2, 7, 11, 15], target 26 ----------
const BF = [2, 7, 11, 15];
const PAIRS = [];
for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) PAIRS.push([i, j]);

// ---------- frequency: listen / silent ----------
const S = 'listen'.split('');
const T = 'silent'.split('');
const LET = ['e', 'i', 'l', 'n', 's', 't'];
const anaFrames = [];
{
  const c = Object.fromEntries(LET.map((l) => [l, 0]));
  S.forEach((_, i) => {
    c[S[i]]++;
    c[T[i]]--;
    anaFrames.push({
      say: 1,
      note: `i = ${i}: +1 for '${S[i]}', −1 for '${T[i]}'.`,
      panels: [
        arr(S, { label: 's', pointers: [ptr(i, 'i')], highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }),
        arr(T, { label: 't', pointers: [ptr(i, 'i', 'b')], highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }),
        table(LET, ['count'], LET.map((l) => [c[l]]), LET.map((l) => [l === S[i] || l === T[i] ? 'active' : ''])),
      ],
    });
  });
}

// ---------- canonical: group anagrams by sorted key ----------
const WORDS = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
const groupFrames = [];
{
  const g = [];
  WORDS.forEach((w, i) => {
    const key = [...w].sort().join('');
    let row = g.find((r) => r[0] === key);
    const isNew = !row;
    if (!row) g.push((row = [key, []]));
    row[1].push(w);
    groupFrames.push({
      say: i === 0 ? 1 : 2,
      note: `"${w}" → key "${key}"${isNew ? ': a new group.' : ': joins its group.'}`,
      panels: [
        arr(WORDS, { label: 'words', pointers: [ptr(i, 'w')], highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }),
        mapT(g.map(([k, v]) => [k, v.join(', ')]), 'groups', key, 'active', 'words'),
      ],
    });
  });
}

// ---------- template: [3, 1, 3, 2] ----------
const TPL = [3, 1, 3, 2];

// ---------- implementation: count key over a..e (the other 21 slots stay 0) ----------
const IMPL = ['bad', 'dab', 'cab'];
const cnt5 = (w) => [0, 1, 2, 3, 4].map((k) => [...w].filter((ch) => ch.charCodeAt(0) - 97 === k).length);
const key5 = (w) => cnt5(w).join('#') + '#…';
const implFrames = [];
{
  const g = [];
  IMPL.forEach((w, i) => {
    const key = key5(w);
    let row = g.find((r) => r[0] === key);
    if (!row) g.push((row = [key, []]));
    row[1].push(w);
    implFrames.push({
      say: i === 0 ? 0 : 2,
      note: `"${w}": count its letters; key ${key}.`,
      panels: [arr(cnt5(w), { label: `count[0..4] = a..e for "${w}"`, showIndices: true, highlights: hl(5, (k) => (cnt5(w)[k] ? 'active' : '')) }), vars({ key }), mapT(g.map(([k, v]) => [k, v.join(', ')]), 'groups', key, 'active', 'words')],
    });
  });
}

// ---------- dry run: longest consecutive ----------
const LC = [100, 4, 200, 1, 3, 2];
const LCROWS = [
  [100, 'no', 'start: 101? no', 1, 1],
  [4, 'yes (3)', 'skip: not a start', '—', 1],
  [200, 'no', 'start: 201? no', 1, 1],
  [1, 'no', 'start', '…', 1],
  [3, 'yes', 'skip', '—', 4],
  [2, 'yes', 'skip', '—', 4],
];
const lcFrame = (i, say, note, extra = {}, st) => ({
  say,
  note,
  panels: [arr(LC, { label: 'nums (all in the Set)', pointers: [ptr(i, 'x')], highlights: hl(6, (k) => (k === i ? st || 'active' : k < i ? 'visited' : '')) }), vars({ x: LC[i], ...extra })],
});

export default {
  what: [
    {
      kind: 'watch',
      title: 'A coat check with numbered hooks',
      lines: [
        'A **hash function** turns a key into a number: `bucket = hash(key) % capacity`.',
        'Looking up repeats the same computation and goes straight to that one bucket.',
        'A **collision**: two keys land in the same bucket; with **chaining** the bucket holds a small list.',
        '`Map` stores key → value; `Set` stores just unique keys.',
      ],
      frames: [
        { say: 0, note: 'Eight empty buckets. Toy hash: add up letter positions (a = 1, n = 14, …).', panels: [arr(EMPTY8, { label: 'buckets', showIndices: true })] },
        { say: 0, note: "set('ana', 31): hash = 1 + 14 + 1 = 16, and 16 % 8 = 0.", panels: [arr(EMPTY8, { label: 'buckets', showIndices: true, pointers: [ptr(0, 'ana')], highlights: { 0: 'active' } }), vars({ key: 'ana', hash: 16, bucket: 0 })] },
        { say: 0, note: '31 is stored in bucket 0.', panels: [arr(withB({ 0: 'ana:31' }), { label: 'buckets', showIndices: true, highlights: { 0: 'done' } })] },
        { say: 1, note: "get('ana'): same sum, same bucket 0 → 31. No other bucket is looked at.", panels: [arr(withB({ 0: 'ana:31' }), { label: 'buckets', showIndices: true, pointers: [ptr(0, 'get')], highlights: { 0: 'active' } }), vars({ result: 31 })] },
        { say: 2, note: "set('tom', 40): 20 + 15 + 13 = 48, 48 % 8 = 0. Bucket 0 again: a collision.", panels: [arr(withB({ 0: 'ana,tom' }), { label: 'buckets', showIndices: true, highlights: { 0: 'bad' } }), table(['bucket 0'], ['chain'], [['ana:31 → tom:40']])] },
        { say: 3, note: 'new Set([3, 1, 3]) keeps 3 and 1 once each; has(3) is true.', panels: [arr([3, 1, 3], { label: 'input', highlights: { 2: 'muted' } }), table(['3', '1'], ['in set'], [['yes'], ['yes']], [['active'], ['']], 'Set')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which hook?',
      lines: ['Same toy hash: add up letter positions, then `% 8`.', "b = 2, e = 5, n = 14."],
      panels: [arr(withB({ 0: 'ana,tom' }), { label: 'buckets', showIndices: true }), vars({ key: 'ben', capacity: 8 })],
      task: { type: 'cell', question: "Tap the bucket where 'ben' lands.", answer: 5, hints: { 0: '2 + 5 + 14 = 21, and 21 % 8 is not 0.', 2: 'That is 21 ÷ 8 (rounded down); the bucket is the remainder.' } },
      solved: '2 + 5 + 14 = 21, and 21 % 8 = 5.',
      then: [{ say: 0, note: "'ben' sits alone in bucket 5.", panels: [arr(withB({ 0: 'ana,tom', 5: 'ben' }), { label: 'buckets', showIndices: true, highlights: { 5: 'done' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: crowded buckets',
      lines: ['**Load factor** = entries ÷ buckets.', 'Here each number key hashes to itself.'],
      panels: [arr(['4,8', '1,5', '2,6', '3,7'], { label: '4 buckets', showIndices: true, highlights: hl(4, () => 'bad') }), vars({ entries: 8, buckets: 4, 'load factor': 2 })],
      task: {
        type: 'choose',
        question: 'The load factor got too high. What does the table do?',
        options: [
          { text: 'Allocate more buckets and re-insert everything', why: '' },
          { text: 'Sort the keys inside each bucket', why: 'Hash tables do not keep keys sorted at all.' },
          { text: 'Nothing: the chains just keep growing', why: 'Long chains mean every lookup scans a long list. The table resizes to keep buckets short.' },
        ],
        answer: 0,
      },
      solved: 'It **resizes**: more buckets, every entry re-inserted, buckets short again.',
      then: [{ say: 0, note: 'Re-inserted with % 8: one key per bucket. Load factor 1.', panels: [arr([8, 1, 2, 3, 4, 5, 6, 7], { label: '8 buckets', showIndices: true, highlights: hl(8, () => 'done') }), vars({ entries: 8, buckets: 8, 'load factor': 1 })] }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Seen before? Scan vs Set',
      lines: ['With an array, each "have I seen x?" scans the earlier elements: O(n) each, **O(n²)** total.', 'With a Set, each question is one O(1) average lookup: **O(n)** total.'],
      frames: [
        ...[1, 2, 3, 4].map((i) => ({
          say: 0,
          note: `x = ${FIVE[i]}: scan the ${i} earlier element${i > 1 ? 's' : ''}. Total looks: ${tri(i)}.`,
          panels: [arr(FIVE, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(5, (k) => (k === i ? 'active' : k < i ? 'window' : '')) }), vars({ looks: tri(i) })],
        })),
        { say: 1, note: 'Same array with a Set: one has() per element, 5 lookups in all.', panels: [arr(FIVE, { label: 'nums', highlights: hl(5, () => 'done') }), table(FIVE.map(String), ['in seen'], FIVE.map(() => ['yes']), undefined, 'seen'), vars({ lookups: 5 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the scans',
      lines: ['No duplicates, so the scan never stops early.', 'Element i scans the i elements before it.'],
      panels: [arr([4, 9, 1, 7, 2, 8], { label: 'nums, n = 6', showIndices: true })],
      task: { type: 'number', question: 'How many looks does the array-scan version make in total?', options: [6, 15, 21, 36], answer: 15, hint: 'Add 0 + 1 + 2 + … for each index.' },
      solved: '0 + 1 + 2 + 3 + 4 + 5 = 15 looks, against 6 Set lookups.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the price',
      lines: ['Hashing turns O(n²) into O(n) by **trading memory for speed**.'],
      panels: [table(['scan', 'Set'], ['time', 'extra'], [['O(n²)', 'none'], ['O(n)', '?']], [['', ''], ['done', 'active']])],
      task: {
        type: 'choose',
        question: 'What does the Set version pay for its speed?',
        options: [
          { text: 'O(n) extra memory for the table', why: '' },
          { text: 'O(n²) time', why: 'That is the cost of the scan it replaces.' },
          { text: 'Nothing at all', why: 'The table stores the elements: memory grows with n.' },
        ],
        answer: 0,
      },
      solved: 'The price is **O(n) extra memory**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the occasional resize',
      lines: ['Resizing re-inserts everything: O(n), but only occasionally.', 'Just like `push` on a dynamic array.'],
      panels: [arr([1, 5, 2, 6], { label: '4 buckets, full', highlights: hl(4, () => 'bad') }), arr([8, 1, 2, 3, 4, 5, 6, 7], { label: 'after resize: 8 buckets', highlights: hl(8, () => 'done') })],
      task: {
        type: 'choose',
        question: 'Averaged over many inserts, what does one insert cost?',
        options: [
          { text: 'O(1) amortized', why: '' },
          { text: 'O(n) every time', why: 'The O(n) resize happens only occasionally; most inserts touch one bucket.' },
          { text: 'O(log n)', why: 'Nothing is halved or sorted here.' },
        ],
        answer: 0,
      },
      solved: 'Rare O(n) resizes spread over many inserts: **O(1) amortized**.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Five reasons to reach for a Map',
      lines: ['The signal: a **nested loop that searches** for something.', 'Each kind of search has its own table.'],
      frames: [
        ['does x exist?', 'Set'],
        ['how many of each?', 'frequency Map'],
        ['earlier y with x + y = target?', 'Map value → index'],
        ['which items are equivalent?', 'Map key → list'],
        ['O(1) lookup + other structures', 'design'],
      ].map((_, k, all) => ({
        say: k === 0 ? 0 : 1,
        note: `"${all[k][0]}" → ${all[k][1]}.`,
        panels: [table(['membership', 'counting', 'complement', 'grouping', 'design'], ['tool'], all.map((r, i) => [i <= k ? r[1] : '?']), all.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: object key order',
      lines: ['A plain object orders **integer-like keys first** (ascending), then strings in insertion order.', 'A `Map` keeps plain insertion order.'],
      panels: [table(['1st', '2nd', '3rd', '4th'], ['statement'], [['o.b = 1'], ['o[2] = 1'], ['o.a = 1'], ['o[1] = 1']])],
      task: { type: 'order', question: 'Tap the keys in the order `Object.keys(o)` lists them.', items: ['1', '2', 'b', 'a'], hint: 'Integer-like keys first, smallest first; then strings as they were added.' },
      solved: '`["1", "2", "b", "a"]`: integers jump ahead, and they come back as strings.',
      then: [{ say: 1, note: 'The same four inserts into a Map: b, 2, a, 1, exactly as added.', panels: [mapT([['b', 1], [2, 1], ['a', 1], [1, 1]], 'Map')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many keys?',
      lines: ['`map.size` is O(1).', '`Object.keys(obj).length` is O(n).'],
      panels: [table(['Map', '{} object'], ['size'], [['map.size'], ['Object.keys(obj).length']])],
      task: {
        type: 'choose',
        question: 'Your loop asks "how many distinct keys so far?" after every insert. Which keeps that question O(1)?',
        options: [
          { text: 'A Map, with `map.size`', why: '' },
          { text: 'A plain object, with `Object.keys(obj).length`', why: 'That is O(n) each time, so O(n²) over the loop.' },
          { text: 'Either: they cost the same', why: 'Only the Map keeps its size ready; the object rebuilds a key list.' },
        ],
        answer: 0,
      },
      solved: '`map.size` is O(1): one more reason to prefer Map in DSA code.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'What does the inner loop search for?',
      lines: ['Ask: **what would I search for inside my inner loop?**', 'If it can be computed from the current element, key a Map by exactly that.'],
      frames: [
        ['"duplicate"', 'x itself', 'x'],
        ['"two numbers add up to"', 'an earlier y = target − x', 'value'],
        ['"group", "anagram"', 'items with the same letters', 'signature of x'],
      ].map((_, k, all) => ({
        say: k === 0 ? 0 : 1,
        note: `${all[k][0]}: the inner loop looks for ${all[k][1]}. Key: ${all[k][2]}.`,
        panels: [table(all.map((r) => r[0]), ['Map key'], all.map((r, i) => [i <= k ? r[2] : '?']), all.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the key',
      lines: ['Problem: for each word, is its **reverse** somewhere earlier in the list?', 'Brute force scans the earlier words for it.'],
      panels: [arr(['abc', 'dog', 'cba', 'god'], { label: 'words', pointers: [ptr(2, 'w')], highlights: { 0: 'visited', 1: 'visited', 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Store earlier words in a Set. What do you look up for the current word?',
        options: [
          { text: 'The reversed word', why: '' },
          { text: 'The word’s length', why: 'Many words share a length; you would still have to scan them.' },
          { text: 'Its index', why: 'An index says nothing about the letters; it cannot answer the question.' },
        ],
        answer: 0,
      },
      solved: 'The thing you search for is computable from w: look up its reverse.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Search the past, or remember it',
      lines: ['Brute force: for each x, **search** every earlier y.', 'A hash map **remembers** the past: compute which y works and ask the map directly.', 'For Two Sum the y that works is `target − x`: the **complement**.'],
      frames: [
        { say: 0, note: 'Brute force at x = 7: the inner loop walks the earlier elements.', panels: [arr([2, 7, 11, 15], { label: 'nums, target 9', pointers: [ptr(1, 'x')], highlights: { 0: 'window', 1: 'active' } })] },
        ...tsFrames([2, 7, 11, 15], 9, 2).map((f, k) => ({ ...f, say: k === 0 ? 2 : 1 })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: when does the map say yes?',
      lines: ['At each i: need = target − x; ask the map; if absent, store x → i.'],
      panels: [arr(T1, { label: 'nums, target 5', showIndices: true })],
      task: { type: 'cell', question: 'Tap the index at which the map first has the needed value.', answer: 3, hints: { 0: 'Nothing is stored yet at index 0.', 2: 'At 4 the need is 1, and 1 has not been seen yet.', 1: '8 needs −3, which is never stored.' } },
      solved: 'At index 3, x = 1 needs 4, stored at index 2 → [2, 3].',
      then: tsFrames(T1, 5, 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: what the map remembers',
      lines: ['Each element that does not finish the search is stored.'],
      panels: [arr(T1, { label: 'nums, target 5', pointers: [ptr(3, 'i')], highlights: { 0: 'visited', 1: 'visited', 2: 'done', 3: 'active' } }), mapT([[3, 0], [8, 1], [4, 2]], 'indexOf', 4, 'done')],
      task: { type: 'number', question: 'How many entries does the map hold when the pair is found?', options: [1, 2, 3, 4], answer: 3, hint: 'The element at index 3 ends the search before it is stored.' },
      solved: 'Three: 3, 8 and 4. That memory is what replaced the inner loop.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Every pair, one at a time',
      lines: ['Try every pair `i < j`: the outer loop picks i, the inner loop tries every j after it.', 'Time **O(n²)**, extra space **O(1)**.', 'n = 10⁴ → about 5·10⁷ pair checks: borderline. n = 10⁵ → 5·10⁹: far too slow.'],
      frames: [
        ...PAIRS.map(([i, j], k) => ({
          say: 0,
          note: `(${i}, ${j}): ${BF[i]} + ${BF[j]} = ${BF[i] + BF[j]}${BF[i] + BF[j] === 26 ? ' = 26 → return [2, 3].' : ', not 26.'}`,
          panels: [arr(BF, { label: 'nums, target 26', pointers: [ptr(i, 'i'), ptr(j, 'j', 'b')], highlights: { [i]: 'active', [j]: BF[i] + BF[j] === 26 ? 'done' : 'active' } }), vars({ checks: k + 1 })],
        })),
        { say: 1, note: 'The pair was the last one: 6 checks = 4 · 3 / 2, with no extra memory.', panels: [vars({ n: 4, checks: 6, 'extra space': 'O(1)' })] },
        { say: 2, note: 'The same count, n(n − 1)/2, for big n.', panels: [table(['n = 10⁴', 'n = 10⁵'], ['pair checks', 'verdict'], [['≈ 5·10⁷', 'borderline'], ['≈ 5·10⁹', 'far too slow']], [['window', 'window'], ['bad', 'bad']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the hidden loop',
      lines: ['This version has only one visible loop:', '`j = nums.indexOf(target − nums[i], i + 1)`'],
      panels: [arr(BF, { label: 'indexOf scanning from i + 1', pointers: [ptr(0, 'i')], highlights: { 0: 'active', 1: 'window', 2: 'window', 3: 'window' } })],
      task: {
        type: 'choose',
        question: 'What is its real time complexity?',
        options: [
          { text: 'O(n): one loop', why: 'indexOf is a loop too: an O(n) scan for every i.' },
          { text: 'O(n²)', why: '' },
          { text: 'O(n log n)', why: 'Nothing is sorted or halved; indexOf scans left to right.' },
        ],
        answer: 1,
      },
      solved: 'Still **O(n²)**: indexOf hides the inner loop.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'One pass with a Map',
      lines: ['Create `indexOf = new Map()` (value → index of an earlier element).', 'For each i, compute `need = target − nums[i]`.', 'If `indexOf.has(need)`, return `[indexOf.get(need), i]`.', 'Otherwise `indexOf.set(nums[i], i)` and continue.'],
      frames: [
        { say: 0, note: 'Empty map, nothing seen yet.', panels: [arr([4, 9, 6, 1], { label: 'nums, target 10' }), mapT([], 'indexOf')] },
        { say: 1, note: 'i = 0: need = 10 − 4 = 6.', panels: [arr([4, 9, 6, 1], { label: 'nums, target 10', pointers: [ptr(0, 'i')], highlights: { 0: 'active' } }), vars({ need: 6 }), mapT([], 'indexOf')] },
        ...tsFrames([4, 9, 6, 1], 10, 3).map((f) => ({ ...f, say: f.note.includes('return') ? 2 : 3 })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: found when we reach j',
      lines: ['Every pair (i, j) with i < j is discovered when the scan reaches **j**.', 'At that moment i is already in the map.'],
      panels: [arr(T2, { label: 'nums, target 10', showIndices: true })],
      task: { type: 'cell', question: 'Tap the index where the scan returns.', answer: 3, hints: { 1: 'At index 1 its partner 9 has not been seen yet; the scan only looks back.', 4: '7 pairs with 3, but an earlier pair is found first.' } },
      solved: 'The pair (1, 9) is found at j = 3, when 1 is already stored.',
      then: tsFrames(T2, 10, 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: count pairs instead',
      lines: ['To **count** pairs, store counts instead of indices.', 'At each x, add `map.get(need)` to the answer, then count x.'],
      panels: [arr([2, 2, 2], { label: 'nums, target 4' }), mapT([], 'count')],
      task: { type: 'number', question: 'How many pairs does the scan count?', options: [1, 2, 3, 6], answer: 3, hint: 'Each 2 pairs with every earlier 2.' },
      solved: '0 + 1 + 2 = 3 pairs.',
      then: [0, 1, 2].map((i) => ({
        say: 1,
        note: `i = ${i}: need 2 has count ${i} → answer ${tri(i)}; then count 2 → ${i + 1}.`,
        panels: [arr([2, 2, 2], { label: 'nums, target 4', pointers: [ptr(i, 'i')], highlights: hl(3, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), mapT([[2, i + 1]], 'count', 2), vars({ answer: tri(i) })],
      })),
    },
  ],

  'intuition-frequency': [
    {
      kind: 'watch',
      title: 'Plus for s, minus for t',
      lines: ['Anagrams have the same letters the same number of times; position does not matter.', 'One table: **+1** for each letter of `s`, **−1** for each letter of `t`.', 'They are anagrams exactly when every count ends at **0**.'],
      frames: [
        { say: 0, note: 'Same length (6), so keep going. Only the 6 letters used are shown; the other slots stay 0.', panels: [arr(S, { label: 's' }), arr(T, { label: 't' }), table(LET, ['count'], LET.map(() => [0]))] },
        ...anaFrames,
        { say: 2, note: 'Every count is 0: "listen" and "silent" are anagrams.', panels: [table(LET, ['count'], LET.map(() => [0]), LET.map(() => ['done']))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which slot?',
      lines: ['The slot for a letter is `charCodeAt(i) − 97`: a → 0, b → 1, …', 's = "abc", t = "abd". After i = 2, count[c]++ already ran.'],
      panels: [arr([0, 0, 1, 0, 0], { label: 'count[0..4] = a..e', showIndices: true, highlights: { 2: 'active' } })],
      task: { type: 'cell', question: "t[2] is 'd'. Tap the slot it decrements.", answer: 3, hints: { 2: "Slot 2 is 'c' (99 − 97).", 4: "Slot 4 is 'e'." } },
      solved: "'d' is 100, and 100 − 97 = 3.",
      then: [{ say: 0, note: 'Not every count is 0, so "abc" and "abd" are not anagrams.', panels: [arr([0, 0, 1, -1, 0], { label: 'count[0..4] = a..e', showIndices: true, highlights: { 2: 'bad', 3: 'bad' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: array or Map?',
      lines: ['For a small, known alphabet, an array indexed by character code is a **perfect hash**: no collisions.', 'For arbitrary keys (Unicode, words, numbers), use a `Map`.'],
      panels: [mapT([['the', 2], ['cat', 1], ['sat', 1]], 'word counts', 'the')],
      task: {
        type: 'choose',
        question: 'You count **whole words** in a sentence. Which table?',
        options: [
          { text: 'A Map', why: '' },
          { text: '`new Array(26).fill(0)`', why: '26 slots fit the letters a–z, not arbitrary words.' },
        ],
        answer: 0,
      },
      solved: 'Words are arbitrary keys: use a **Map**.',
    },
  ],

  'optimized-canonical': [
    {
      kind: 'watch',
      title: 'Group by a canonical key',
      lines: ['Give every word a **canonical key**: identical for all anagrams, different otherwise.', 'Sorted key: `[...w].sort().join(\'\')`, O(k log k) per word.', 'Group by the key: same key, same group.'],
      frames: [
        { say: 0, note: 'Six words, an empty Map from key to group.', panels: [arr(WORDS, { label: 'words' }), mapT([], 'groups', null, '', 'words')] },
        ...groupFrames,
        { say: 2, note: 'The groups: [eat, tea, ate], [tan, nat], [bat].', panels: [table(['aet', 'ant', 'abt'], ['words'], [['eat, tea, ate'], ['tan, nat'], ['bat']], [['done'], ['done'], ['done']], 'groups')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the separator',
      lines: ['Count key: the counts joined into a string.', 'Counts `[1, 11]` and `[11, 1]` are different and must stay apart.'],
      panels: [table(['[1, 11]', '[11, 1]'], ["join('')"], [['111'], ['111']], [['bad'], ['bad']])],
      task: {
        type: 'choose',
        question: 'Which key keeps them apart?',
        options: [
          { text: "join('')", why: 'Both become "111": two different counts, one key.' },
          { text: "join('#')", why: '' },
          { text: 'The sum of the counts', why: 'Both add up to 12.' },
        ],
        answer: 1,
      },
      solved: 'With a separator: "1#11" and "11#1".',
      then: [{ say: 1, note: 'Same counts, now two different keys.', panels: [table(['[1, 11]', '[11, 1]'], ["join('')", "join('#')"], [['111', '1#11'], ['111', '11#1']], [['bad', 'done'], ['bad', 'done']])] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: an array as a key',
      lines: ['Maps compare object keys by **reference**.', 'Each `[1, 2]` literal is a new object.'],
      panels: [table(['1', '2'], ['code'], [['map.set([1, 2], "x")'], ['map.get([1, 2])']], [[''], ['active']])],
      task: {
        type: 'choose',
        question: 'What does line 2 return?',
        options: [
          { text: '"x"', why: 'The second [1, 2] is a different object from the first, so it is a different key.' },
          { text: 'undefined', why: '' },
          { text: 'It throws', why: 'Arrays are allowed as keys; they are just compared by reference.' },
        ],
        answer: 1,
      },
      solved: '`undefined`. Encode tuples as strings instead.',
      then: [{ say: 0, note: 'Key "1,2" (a string): the same text finds the same entry.', panels: [mapT([['1,2', 'x']], 'map', '1,2', 'done')] }],
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Template 1 and 3 on one array',
      lines: ['**Membership**: if `seen.has(x)`, duplicate; then `seen.add(x)`.', '**Complement**: check `idx.has(target − nums[i])`, then `idx.set(nums[i], i)`.'],
      frames: [
        ...[0, 1, 2].map((i) => ({
          say: 0,
          note: i < 2 ? `x = ${TPL[i]}: not in seen → add it.` : 'x = 3: seen.has(3) is true → duplicate.',
          panels: [arr(TPL, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(4, (k) => (k === i ? (i === 2 ? 'bad' : 'active') : k < i ? 'visited' : '')) }), vars({ seen: `{${TPL.slice(0, i === 2 ? 2 : i + 1).join(', ')}}` })],
        })),
        ...tsFrames(TPL, 5, 1).map((f) => ({ ...f, note: f.note.replace('return', 'pair found') })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: frequency',
      lines: ['Template 2: `freq.set(x, (freq.get(x) ?? 0) + 1)` for every x.'],
      panels: [arr(TPL, { label: 'nums' }), mapT([], 'freq')],
      task: { type: 'number', question: 'After the loop, what is `freq.get(3)`?', options: [1, 2, 3, 4], answer: 2, hint: 'Count the 3s in the array.' },
      solved: '3 appears twice.',
      then: TPL.map((x, i) => {
        const m = new Map();
        TPL.slice(0, i + 1).forEach((y) => m.set(y, (m.get(y) ?? 0) + 1));
        return { say: 0, note: `x = ${x}: freq.get(${x}) ?? 0, plus 1 → ${m.get(x)}.`, panels: [arr(TPL, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(4, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }), mapT([...m], 'freq', x)] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: the grouping template',
      lines: ['Template 4 groups items by a canonical key.'],
      panels: [vars({ item: 'tea' }), mapT([['aet', 'eat']], 'groups', null, '', 'items')],
      task: { type: 'order', question: 'Tap the three lines of the loop body in order.', items: ['key = canonical(item)', 'if no group: groups.set(key, [])', 'groups.get(key).push(item)'], hint: 'You need the key before you can ask about it, and the list must exist before you push.' },
      solved: 'Key, make sure the group exists, push.',
      then: [{ say: 0, note: '"tea" → "aet" → pushed into the existing group.', panels: [mapT([['aet', 'eat, tea']], 'groups', 'aet', 'done', 'items')] }],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Group anagrams with a count key',
      lines: ['Count the 26 letters of each word.', "Key = `count.join('#')`; the separator avoids ambiguity.", 'Push the word into its key’s group; return `[...groups.values()]`.'],
      frames: [
        ...implFrames.map((f, i) => ({ ...f, say: i === 0 ? 0 : f.say })),
        { say: 1, note: '"bad" and "dab" share a key; "cab" got its own. (Slots f–z are all 0: shown as …)', panels: [mapT([[key5('bad'), 'bad, dab'], [key5('cab'), 'cab']], 'groups', null, '', 'words')] },
        { say: 2, note: 'groups.values() → [["bad", "dab"], ["cab"]].', panels: [table(['group 1', 'group 2'], ['words'], [['bad, dab'], ['cab']], [['done'], ['done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one-line duplicate check',
      lines: ['`new Set(arr).size !== arr.length` is a one-line duplicate check, O(n).'],
      panels: [arr([4, 2, 4, 4, 1], { label: 'arr, length 5' })],
      task: { type: 'number', question: 'What is `new Set(arr).size`?', options: [2, 3, 4, 5], answer: 3, hint: 'Count the distinct values.' },
      solved: '{4, 2, 1}: size 3, and 3 !== 5, so there are duplicates.',
    },
    {
      kind: 'turn',
      title: 'Your turn: ?? keeps a real 0',
      lines: ['`??` only replaces `undefined` or `null`.'],
      panels: [mapT([['a', 0]], 'm', 'a')],
      task: {
        type: 'choose',
        question: "What is `m.get('a') ?? 7`?",
        options: [
          { text: '0', why: '' },
          { text: '7', why: 'The stored value is 0, not undefined, so ?? keeps it.' },
          { text: 'undefined', why: "The key 'a' exists and holds 0." },
        ],
        answer: 0,
      },
      solved: 'A stored `0` stays `0`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: NaN as a key',
      lines: ['`Map` keys use **SameValueZero**: `NaN` equals `NaN`, `0` equals `-0`.'],
      panels: [mapT([['NaN', 'x']], 'm', 'NaN')],
      task: {
        type: 'choose',
        question: 'After `m.set(NaN, "x")`, what is `m.get(NaN)`?',
        options: [
          { text: '"x"', why: '' },
          { text: 'undefined', why: 'Under SameValueZero, NaN equals NaN, so the key is found.' },
          { text: 'It throws', why: 'NaN is a valid key.' },
        ],
        answer: 0,
      },
      solved: '"x": a Map finds NaN again.',
    },
  ],

  'optimized-design': [
    {
      kind: 'watch',
      title: 'Array + Map, delete by swap',
      lines: ['Array `vals`: a random pick is O(1), `vals[Math.floor(Math.random() * n)]`.', 'Map `pos` (value → index): find any value in O(1).', 'Delete v at index i: copy the **last** element into slot i, update its index in the map, then `pop()`. No shifting.'],
      frames: [
        { say: 1, note: 'After inserting 10, 20, 30, 40: each value and its index.', panels: [arr([10, 20, 30, 40], { label: 'vals', showIndices: true }), mapT([[10, 0], [20, 1], [30, 2], [40, 3]], 'pos', null, '', 'index')] },
        { say: 0, note: 'getRandom: pick a random index, say 2 → 30.', panels: [arr([10, 20, 30, 40], { label: 'vals', showIndices: true, pointers: [ptr(2, 'rand')], highlights: { 2: 'active' } })] },
        { say: 1, note: 'remove(20): pos says i = 1. No scan needed.', panels: [arr([10, 20, 30, 40], { label: 'vals', showIndices: true, pointers: [ptr(1, 'i')], highlights: { 1: 'bad' } }), mapT([[10, 0], [20, 1], [30, 2], [40, 3]], 'pos', 20, 'bad', 'index')] },
        { say: 2, note: 'Move the last element (40) into slot 1.', panels: [arr([10, 40, 30, 40], { label: 'vals', showIndices: true, highlights: { 1: 'active', 3: 'muted' } }), mapT([[10, 0], [20, 1], [30, 2], [40, 3]], 'pos', 40, 'active', 'index')] },
        { say: 2, note: 'Update the moved element: pos 40 → 1.', panels: [arr([10, 40, 30, 40], { label: 'vals', showIndices: true, highlights: { 1: 'done', 3: 'muted' } }), mapT([[10, 0], [20, 1], [30, 2], [40, 1]], 'pos', 40, 'done', 'index')] },
        { say: 2, note: 'pop() the old last slot, and delete 20 from pos.', panels: [arr([10, 40, 30], { label: 'vals', showIndices: true, highlights: { 1: 'done' } }), mapT([[10, 0], [30, 2], [40, 1]], 'pos', null, '', 'index')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a Map alone',
      lines: ['A Map alone: insert and delete are O(1).', 'But it has no index to pick at random.'],
      panels: [mapT([[10, 0], [30, 2], [40, 1]], 'pos', null, '', 'index')],
      task: {
        type: 'choose',
        question: 'With only a Map, what does picking a random key cost?',
        options: [
          { text: 'O(1)', why: 'A Map has no position to jump to; you must iterate to reach the k-th key.' },
          { text: 'O(n)', why: '' },
          { text: 'O(log n)', why: 'Nothing is halved; you walk the keys one by one.' },
        ],
        answer: 1,
      },
      solved: 'Iterating the keys is O(n). The array is what makes getRandom O(1).',
    },
    {
      kind: 'turn',
      title: 'Your turn: who fills the hole?',
      lines: ['Next: remove(10), at index 0.'],
      panels: [arr([10, 40, 30], { label: 'vals', showIndices: true, highlights: { 0: 'bad' } }), mapT([[10, 0], [30, 2], [40, 1]], 'pos', 10, 'bad', 'index')],
      task: { type: 'cell', question: 'Tap the slot whose value moves into the hole.', answer: 2, hints: { 0: 'That is the hole itself.', 1: '40 stays where it is; only the last element moves.' } },
      solved: 'The last element, 30, moves into slot 0.',
      then: [
        { say: 0, note: 'Copy 30 into slot 0 and set pos 30 → 0.', panels: [arr([30, 40, 30], { label: 'vals', showIndices: true, highlights: { 0: 'done', 2: 'muted' } }), mapT([[10, 0], [30, 0], [40, 1]], 'pos', 30, 'done', 'index')] },
        { say: 0, note: 'pop() and delete 10.', panels: [arr([30, 40], { label: 'vals', showIndices: true }), mapT([[30, 0], [40, 1]], 'pos', null, '', 'index')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: removing the last element',
      lines: ['remove(40): 40 is itself the last element (i = 1).', 'No special case is needed, if the steps run in the right order.'],
      panels: [arr([30, 40], { label: 'vals', showIndices: true, pointers: [ptr(1, 'i = last')], highlights: { 1: 'bad' } }), mapT([[30, 0], [40, 1]], 'pos', 40, 'bad', 'index')],
      task: { type: 'order', question: 'Tap the four steps in a safe order.', items: ['vals[i] = last', 'pos.set(last, i)', 'vals.pop()', 'pos.delete(v)'], hint: 'If pos.delete(v) ran before pos.set(last, i), v would be put back into the map.' },
      solved: 'Update the moved element, then pop, then delete. Deleting first leaves a ghost entry.',
      then: [
        { say: 1, note: '40 is copied onto itself; pos.set(40, 1) rewrites the same index.', panels: [arr([30, 40], { label: 'vals', showIndices: true, highlights: { 1: 'active' } }), mapT([[30, 0], [40, 1]], 'pos', 40, 'active', 'index')] },
        { say: 1, note: 'pop() removes it, pos.delete(40) removes the key. Clean.', panels: [arr([30], { label: 'vals', showIndices: true }), mapT([[30, 0]], 'pos', null, '', 'index')] },
      ],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Longest consecutive sequence',
      lines: ['Every value is in a Set.', 'Start a run at x only when x − 1 is **not** in the set.', 'From a start, walk x + 1, x + 2, … while present; keep the best length.'],
      frames: [
        ...LCROWS.slice(0, 3).map((r, i) => lcFrame(i, i === 1 ? 1 : 2, `x = ${r[0]}: x − 1 in set? ${r[1]} → ${r[2]}.`, { 'x − 1 in set?': r[1], run: r[3], best: r[4] }, i === 1 ? 'muted' : 'active')),
        lcFrame(3, 1, 'x = 1: 0 is not in the set, so 1 starts a run.', { 'x − 1 in set?': 'no', run: 1, best: 1 }),
        ...[2, 3, 4].map((v) => ({
          say: 2,
          note: `${v} is in the set ✓ → run ${v}.`,
          panels: [arr(LC, { label: 'nums (all in the Set)', pointers: [ptr(3, 'start'), ptr(LC.indexOf(v), String(v), 'b')], highlights: hl(6, (k) => (k === 3 || (LC[k] >= 1 && LC[k] <= v) ? 'done' : '')) }), vars({ run: v, best: Math.max(1, v) })],
        })),
        lcFrame(3, 2, '5 is not in the set ✗. Run 4, best 4.', { run: 4, best: 4 }, 'done'),
        ...LCROWS.slice(4).map((r, j) => lcFrame(4 + j, 1, `x = ${r[0]}: x − 1 is in the set → skip.`, { 'x − 1 in set?': 'yes', best: 4 }, 'muted')),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the best start',
      lines: ['A value starts a walk only if value − 1 is missing.'],
      panels: [arr([5, 6, 2, 7, 1], { label: 'nums (all in the Set)', showIndices: true })],
      task: { type: 'cell', question: 'Tap the value whose walk finds the longest run.', answer: 0, hints: { 4: '1 does start a walk, but it only reaches 2: length 2.', 1: '5 is in the set, so 6 is not a start.', 3: '6 is in the set, so 7 is not a start.' } },
      solved: '5 starts 5, 6, 7: length 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: how many walks?',
      lines: ['Skipped values never walk; each value is walked at most once.'],
      panels: [arr([5, 6, 2, 7, 1], { label: 'nums (all in the Set)', showIndices: true })],
      task: { type: 'number', question: 'How many values start a walk?', options: [1, 2, 3, 5], answer: 2, hint: 'For each x, ask whether x − 1 is in the array.' },
      solved: 'Two starts: 5 and 1. Best run = 3.',
      then: [{ say: 0, note: '5 → 6 → 7 (length 3) and 1 → 2 (length 2). Each value walked once.', panels: [arr([5, 6, 2, 7, 1], { label: 'nums', highlights: { 0: 'done', 1: 'done', 3: 'done', 2: 'window', 4: 'window' } }), vars({ starts: 2, best: 3 })] }],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Stale zero counts',
      lines: ['Decrementing a count to **0** without `delete` leaves the key in the map.', 'Then `map.size` lies.'],
      frames: [
        { say: 0, note: 'Two keys, size 2.', panels: [mapT([['a', 1], ['b', 1]], 'freq', null, '', 'count'), vars({ size: 2 })] },
        { say: 1, note: 'b drops to 0, but the key stays: size still says 2.', panels: [mapT([['a', 1], ['b', 0]], 'freq', 'b', 'bad', 'count'), vars({ size: 2 })] },
        { say: 0, note: 'delete b when it hits 0: size 1, the truth.', panels: [mapT([['a', 1]], 'freq', null, '', 'count'), vars({ size: 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: numbers in an object',
      lines: ['With a plain object, numbers become strings.'],
      panels: [table(['o[7] = 1'], ['Object.keys(o)'], [['[ ? ]']])],
      task: {
        type: 'choose',
        question: 'What type is `Object.keys(o)[0]`?',
        options: [
          { text: 'number', why: 'Object keys are strings (or symbols); 7 became "7".' },
          { text: 'string', why: '' },
        ],
        answer: 1,
      },
      solved: 'The key is the string "7". A Map would keep the number 7.',
    },
    {
      kind: 'turn',
      title: 'Your turn: an ambiguous composite key',
      lines: ['Cells are keyed by `r + "" + c`, with no separator.', 'seen already holds the cell (1, 11).'],
      panels: [table(['(1, 11)', '(11, 1)'], ['key'], [['111'], ['?']], [['done'], ['active']], 'seen')],
      task: {
        type: 'choose',
        question: 'What does `seen.has(key)` say for (11, 1)?',
        options: [
          { text: 'true: wrongly, it looks seen', why: '' },
          { text: 'false', why: '"11" + "1" is "111", the same string as "1" + "11".' },
        ],
        answer: 0,
      },
      solved: 'Both cells become "111". Use a separator: "1,11" vs "11,1".',
    },
    {
      kind: 'turn',
      title: 'Your turn: say the space',
      lines: ['Hashing solutions usually cost extra memory. Say so.'],
      panels: [arr([4, 9, 1, 7, 2, 8], { label: 'nums' }), table(['4', '9', '1', '7', '2', '8'], ['in seen'], [['yes'], ['yes'], ['yes'], ['yes'], ['yes'], ['yes']], undefined, 'seen')],
      task: {
        type: 'choose',
        question: 'Your Set-based duplicate check runs in O(n) time. What extra space do you report?',
        options: [
          { text: 'O(n)', why: '' },
          { text: 'O(1)', why: 'The set can hold one entry per element.' },
          { text: 'O(n²)', why: 'Each element is stored once, not once per pair.' },
        ],
        answer: 0,
      },
      solved: '**O(n)** extra memory: the usual hashing price.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Five things to say out loud',
      lines: ['Name the trade-off, say "average", justify Map, describe your key.', 'Mention the alternative: sort + scan uses O(1) extra space but O(n log n) time.'],
      frames: [
        ['trade-off', 'O(n) space for O(n) time'],
        ['average', 'O(1) on average'],
        ['Map', 'key types, size, no prototype'],
        ['your key', 'e.g. 26 counts joined by #'],
        ['alternative', 'sort + scan'],
      ].map((_, k, all) => ({
        say: k < 4 ? 0 : 1,
        note: `Say: ${all[k][1]}.`,
        panels: [table(all.map((r) => r[0]), ['say'], all.map((r, i) => [i <= k ? r[1] : '…']), all.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: less memory, please',
      lines: ['The interviewer asks: can you avoid the extra memory?'],
      panels: [table(['Map / Set'], ['time', 'space'], [['O(n)', 'O(n)']], [['done', 'bad']])],
      task: {
        type: 'choose',
        question: 'Which alternative do you mention?',
        options: [
          { text: 'Sort, then scan: O(1) extra space, O(n log n) time', why: '' },
          { text: 'A plain object instead of a Map', why: 'Still one entry per key: O(n) space.' },
          { text: 'A Set instead of a Map', why: 'A Set also stores one entry per key: O(n) space.' },
        ],
        answer: 0,
      },
      solved: 'Sort + scan trades time back for space.',
    },
    {
      kind: 'turn',
      title: 'Your turn: describe the key',
      lines: ['For grouping problems, describe your key **precisely**.'],
      panels: [table(['eat', 'tea', 'tan'], ['group'], [['A'], ['A'], ['B']])],
      task: {
        type: 'choose',
        question: 'Which description of the Group Anagrams key is precise?',
        options: [
          { text: '"26 letter counts joined by #"', why: '' },
          { text: '"a hash of the word"', why: 'Vague: it does not say what makes two words share a key.' },
          { text: '"the word itself"', why: 'Anagrams are different words, so they would never share a key.' },
        ],
        answer: 0,
      },
      solved: 'Say exactly what the key is: "sorted letters" or "26 counts joined by #".',
    },
  ],
};
