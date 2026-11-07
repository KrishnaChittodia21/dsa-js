// Shorts for Hashing (M9). Format: src/content/shortSchema.js. Facts come only from topics/hashing/topic.js.
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

// ---------- set membership: [5, 2, 8, 3, 2] ----------
const DUP = [5, 2, 8, 3, 2];
const setFrames = DUP.map((x, i) => {
  const seen = DUP.slice(0, i);
  const hit = seen.indexOf(x);
  return {
    say: hit >= 0 ? 0 : 1,
    note: hit >= 0 ? `x = ${x}: seen.has(${x}) is true → a duplicate. Return true.` : `x = ${x}: seen.has(${x}) is false → add ${x}.`,
    panels: [
      arr(DUP, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(5, (k) => (k === i ? (hit >= 0 ? 'done' : 'active') : k < i ? 'visited' : '')) }),
      arr(hit >= 0 ? seen : [...seen, x], { label: 'seen (Set)', highlights: hit >= 0 ? { [hit]: 'done' } : { [i]: 'active' } }),
    ],
  };
});
const LC = [100, 4, 200, 1, 3, 2];

// ---------- frequency: magazine "baca", note "aab" ----------
const MAG = ['b', 'a', 'c', 'a'];
const NOTE = ['a', 'a', 'b'];
const countFrames = [];
const spendFrames = [];
{
  const freq = new Map();
  MAG.forEach((ch, i) => {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
    countFrames.push({
      say: 0,
      note: `'${ch}': ${ch} → ${freq.get(ch)}.`,
      panels: [arr(MAG, { label: 'magazine', pointers: [ptr(i, 'ch')], highlights: hl(4, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }), mapT([...freq], 'freq', ch, 'active', 'count')],
    });
  });
  NOTE.forEach((ch, i) => {
    freq.set(ch, freq.get(ch) - 1);
    spendFrames.push({
      say: 1,
      note: `Note '${ch}': ${ch} → ${freq.get(ch)}, not below 0.${i === NOTE.length - 1 ? ' Every letter paid for: return true.' : ''}`,
      panels: [arr(NOTE, { label: 'note', pointers: [ptr(i, 'ch', 'b')], highlights: hl(3, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), mapT([...freq], 'freq', ch, 'done', 'count')],
    });
  });
}

// ---------- complement: [1, 6, 3, 8], target 11 ----------
const TS = [1, 6, 3, 8];
const TARGET = 11;
const tsFrames = [];
{
  const m = new Map();
  for (let i = 0; i < TS.length; i++) {
    const need = TARGET - TS[i];
    const hit = m.has(need) ? m.get(need) : null;
    if (hit === null) m.set(TS[i], i);
    tsFrames.push({
      say: 1,
      note: hit !== null ? `i = ${i}: need ${need} is in the map at ${hit} → return [${hit}, ${i}].` : `i = ${i}: need ${need} is not there → store ${TS[i]} → ${i}.`,
      panels: [
        arr(TS, { label: `nums, target ${TARGET}`, pointers: [ptr(i, 'i')], highlights: hl(4, (k) => (k === i ? (hit !== null ? 'done' : 'active') : k === hit ? 'done' : k < i ? 'visited' : '')) }),
        vars({ x: TS[i], need }),
        mapT([...m], 'indexOf', hit !== null ? need : TS[i], hit !== null ? 'done' : 'active', 'index'),
      ],
    });
    if (hit !== null) break;
  }
}

// ---------- canonical key: group by sorted letters ----------
const WORDS = ['tan', 'eat', 'nat', 'tea'];
const groupFrames = [];
{
  const g = new Map();
  WORDS.forEach((w, i) => {
    const key = [...w].sort().join('');
    const isNew = !g.has(key);
    if (isNew) g.set(key, []);
    g.get(key).push(w);
    groupFrames.push({
      say: 1,
      note: `"${w}" → key "${key}"${isNew ? ': a new group.' : ': joins its group.'}`,
      panels: [arr(WORDS, { label: 'words', pointers: [ptr(i, 'w')], highlights: hl(4, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), mapT([...g].map(([k, v]) => [k, v.join(', ')]), 'groups', key, 'active', 'words')],
    });
  });
}

// ---------- index map design ----------
const POS4 = [
  [10, 0],
  [20, 1],
  [30, 2],
  [40, 3],
];

export default [
  {
    id: 'hash-set-membership',
    title: 'Spot a repeat without scanning back',
    steps: [
      {
        kind: 'watch',
        title: 'Scanning the past, again and again',
        lines: ['Does any value appear **twice**?', 'Calling `includes` on the earlier elements is a scan inside a loop: **O(n²)**.'],
        frames: [
          { say: 0, note: 'e.g. nums = [5, 2, 8, 3, 2].', panels: [arr(DUP, { label: 'nums' })] },
          { say: 1, note: 'At index 3, is 3 among 5, 2, 8? includes looks at all three. Every index repeats such a walk.', panels: [arr(DUP, { label: 'nums', pointers: [ptr(3, 'x')], highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'active' } }), vars({ looks: 3 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A Set remembers',
        lines: ['`seen.has(x)` jumps straight to the bucket where x would live: **O(1) average**.', 'Not there? `seen.add(x)` and move on. One pass, O(n).'],
        frames: setFrames,
      },
      {
        kind: 'watch',
        title: 'The clue, and a neighbour check',
        lines: ['Clues: **"contains duplicate"**, **"appears at least twice"**, **"distinct"**, **"exists in"**, **"consecutive sequence"** in unsorted data.', 'Longest consecutive sequence: start a run at x only when **x − 1 is not** in the Set.'],
        frames: [
          { say: 0, note: 'All of these ask "does X exist?", which a Set answers in O(1) average.', panels: [vars({ question: 'have I seen x?', tool: 'new Set()' })] },
          { say: 1, note: '[100, 4, 200, 1, 3, 2]: 0 is absent, so 1 starts a run: 1 → 2 → 3 → 4. Length 4.', panels: [arr(LC, { label: 'nums (all in the Set)', pointers: [ptr(3, 'start')], highlights: { 3: 'active', 5: 'window', 4: 'window', 1: 'window' } }), vars({ run: 4, best: 4 })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: start or skip?',
        lines: ['Every value of `[100, 4, 200, 1, 3, 2]` is in the Set.', 'A run is walked only from its **start**.'],
        panels: [arr(LC, { label: 'nums (all in the Set)', pointers: [ptr(1, 'x')], highlights: { 0: 'visited', 1: 'active' } }), vars({ x: 4 })],
        task: {
          type: 'choose',
          question: 'The loop reaches x = 4. What should it do?',
          options: [
            { text: 'Walk 4 → 5 → … and count the run', why: 'Still correct, but walking from every x re-walks the tails of runs: O(n²) on 1..n.' },
            { text: 'Skip it: 3 is in the Set, so 4 is not a start' },
            { text: 'Remove 4 from the Set', why: 'The Set is only read during the walks, never modified.' },
            { text: 'Build a new Set for this run', why: 'One Set of all values is enough; membership is the only question asked.' },
          ],
          answer: 1,
        },
        solved: 'Only an x without x − 1 starts a walk, so each value is walked once: O(n) overall.',
      },
    ],
  },

  {
    id: 'hash-frequency-map',
    title: 'Can the note be built? Count, then spend',
    steps: [
      {
        kind: 'watch',
        title: 'Being there is not enough',
        lines: ['Can `note` be built from the letters of `magazine`, each letter used once?', '`includes` or a Set only say "is it there?"; they lose **how many**.'],
        frames: [
          { say: 0, note: 'e.g. magazine = "baca", note = "aab".', panels: [arr(MAG, { label: 'magazine' }), arr(NOTE, { label: 'note' })] },
          { say: 1, note: 'Note "aa", magazine "a": "is a there?" says yes twice, but there is only one a.', panels: [arr(['a', 'a'], { label: 'note', highlights: { 1: 'bad' } }), arr(['a'], { label: 'magazine', highlights: { 0: 'done' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Count once',
        lines: ['Count the magazine: `freq.set(ch, (freq.get(ch) ?? 0) + 1)`.', 'Then spend: each note letter takes one; a count below 0 means you ran out.'],
        frames: [...countFrames, ...spendFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"anagram"**, **"same characters"**, **"can be constructed from"**, **"most frequent"**, **"how many times"**.'],
        frames: [{ say: 0, note: 'Only how many of each thing matters, not where. One pass compresses the input into counts.', panels: [mapT([['b', 0], ['a', 0], ['c', 1]], 'freq after "aab"', '', 'active', 'count')] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: one b short',
        lines: ['Same magazine `"baca"`, new note `"abb"`.', 'After "a" and "b" are spent, the counts are b → 0, a → 1, c → 1.'],
        panels: [arr(['a', 'b', 'b'], { label: 'note', pointers: [ptr(2, 'ch', 'b')], highlights: { 0: 'done', 1: 'done', 2: 'active' } }), mapT([['b', 0], ['a', 1], ['c', 1]], 'freq', 'b', 'bad', 'count')],
        task: {
          type: 'choose',
          question: 'The second "b" comes. What does the function do?',
          options: [
            { text: 'Keep going: b is in the magazine', why: 'Being there is not enough; the only b was already spent (count 0).' },
            { text: 'Set b back to 1 and continue', why: 'Counts only go down while spending; nothing refills them.' },
            { text: 'Return false: b would drop to −1, the magazine ran out' },
            { text: 'Return true when the note ends', why: 'One letter could not be paid for, so the note cannot be built.' },
          ],
          answer: 2,
        },
        solved: 'A frequency map keeps **how many**; a count below 0 is the "ran out" signal.',
      },
    ],
  },

  {
    id: 'hash-complement-lookup',
    title: 'Find the pair by asking for the partner',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair is O(n²)',
        lines: ['Two Sum: return the indices of two numbers that add up to `target`.', 'Trying every pair is **O(n²)**; `indexOf` in the loop hides the same inner loop.'],
        frames: [
          { say: 0, note: 'e.g. nums = [1, 6, 3, 8], target = 11.', panels: [arr(TS, { label: 'nums' }), vars({ target: TARGET })] },
          { say: 1, note: '1+6, 1+3, 1+8, 6+3, 6+8, then 3+8: brute force checks 6 pairs to find it.', panels: [arr(TS, { label: 'nums', highlights: { 2: 'done', 3: 'done' } }), vars({ pairs: 6 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Ask the map for target − x',
        lines: ['For each x, the one partner that works is `need = target − x`.', 'If `need` is in the map, done. Otherwise store `x → i`, **after** checking.'],
        frames: tsFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"two numbers add up to target"**, **"return their indices"**, **"pairs with difference k"**.', 'Sorted input with O(1) space required? Then two pointers (next topic) instead.'],
        frames: [{ say: 0, note: 'Pair questions where the partner can be computed from x: one pass with a map, O(n).', panels: [vars({ question: 'is target − x behind me?', tool: 'new Map()' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: store first?',
        lines: ['nums = `[3, 5]`, target = 6.', 'This version stores `x → i` **before** it checks for `need`.'],
        panels: [arr([3, 5], { label: 'nums, target 6', pointers: [ptr(0, 'i')], highlights: { 0: 'active' } }), vars({ x: 3, need: 3 }), mapT([[3, 0]], 'indexOf', 3, 'bad', 'index')],
        task: {
          type: 'choose',
          question: 'What does it return at i = 0?',
          options: [
            { text: '[0, 0]: 3 pairs with itself' },
            { text: '[], because no pair adds up to 6', why: 'That is the right answer, but storing first means need = 3 is found at index 0: the element itself.' },
            { text: 'It depends on the order of the keys', why: 'Lookups go by key, not order; 3 is in the map, so has(3) is true.' },
          ],
          answer: 0,
        },
        solved: 'Check, then store: the map only holds **earlier** indices, so x never pairs with itself.',
      },
    ],
  },

  {
    id: 'hash-canonical-key',
    title: 'Group anagrams by giving each word a key',
    steps: [
      {
        kind: 'watch',
        title: 'Exact keys miss loose matches',
        lines: ['A Map compares keys **exactly**: "eat" and "tea" are different keys.'],
        frames: [
          { say: 0, note: 'e.g. words = ["tan", "eat", "nat", "tea"]. Group the anagrams together.', panels: [arr(WORDS, { label: 'words' })] },
          { say: 0, note: 'Used as keys as they are, every word gets its own group: 4 groups instead of 2.', panels: [mapT(WORDS.map((w) => [w, w]), 'groups by the word itself', '', 'active', 'words')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Normalise, then group',
        lines: ['A **canonical key** is the same for all anagrams and different otherwise.', 'Sorted key: `[...w].sort().join("")`; then `groups.get(key).push(w)`.'],
        frames: groupFrames,
      },
      {
        kind: 'watch',
        title: 'Keys that break, and the clue',
        lines: ['Arrays are compared **by reference**: after `map.set([1, 2], "x")`, `map.get([1, 2])` is `undefined`.', 'Count keys need a separator: counts `[1, 11]` and `[11, 1]` both join to `"111"`.', 'Clues: **"group"**, **"anagrams"**, **"same pattern"**, **"on the same line"**.'],
        frames: [
          { say: 0, note: 'Each [1, 2] literal is a new object, so it is never found again. Encode tuples as strings.', panels: [vars({ 'map.get([1, 2])': 'undefined', 'string key': '"1,2"' })] },
          { say: 1, note: 'With a separator they stay apart: "1#11" and "11#1".', panels: [vars({ 'join("")': '"111" = "111"', 'join("#")': '"1#11" ≠ "11#1"' })] },
          { say: 2, note: 'Design a key that captures the equivalence; the map does the grouping for free.', panels: [mapT([['ant', 'tan, nat'], ['aet', 'eat, tea']], 'groups', '', 'active', 'words')] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: pick the key',
        lines: ['`"eat"` and `"tea"` must share a group; `"tan"` must not join them.'],
        panels: [arr(['eat', 'tea', 'tan'], { label: 'words' })],
        task: {
          type: 'choose',
          question: 'Which key puts all anagrams together and nothing else?',
          options: [
            { text: 'The word’s length', why: '"eat" and "tan" both have length 3, so words that are not anagrams collide.' },
            { text: 'The letters sorted, e.g. "aet"' },
            { text: 'The array of letters, e.g. ["a", "e", "t"]', why: 'Maps compare arrays by reference: each array is a new key, never found again.' },
            { text: 'The distinct letters joined', why: 'That loses counts: e.g. "aab" and "abb" would both get "ab".' },
          ],
          answer: 1,
        },
        solved: 'A canonical key captures exactly the equivalence: sorted letters, or 26 counts with a separator.',
      },
    ],
  },

  {
    id: 'hash-index-map-design',
    title: 'Insert, remove and pick at random, all O(1)',
    steps: [
      {
        kind: 'watch',
        title: 'One structure is not enough',
        lines: ['Design a set with insert, remove and getRandom, each **O(1) average**.', 'A Map alone: picking a random key means iterating, **O(n)**.', 'An array alone: removing a value means finding it, and `splice` shifts, **O(n)**.'],
        frames: [
          { say: 1, note: 'e.g. 10, 20, 30, 40 in a Map: has/delete are O(1), but a random pick walks the keys.', panels: [mapT(POS4.map(([v]) => [v, 'yes']), 'Map', '', 'active', 'in set')] },
          { say: 2, note: 'In an array, remove(20) with splice: 30 and 40 each shift one slot left.', panels: [arr([10, 30, 40], { label: 'vals after splice', highlights: { 1: 'window', 2: 'window' } }), vars({ moved: 2 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Swap with the last, then pop',
        lines: ['Keep both: array `vals` + Map `pos` (value → index).', 'To remove v at i: copy the **last** value into slot i, update its index, `pop()`, delete v.', '`getRandom`: `vals[Math.floor(Math.random() * vals.length)]`, O(1).'],
        frames: [
          { say: 0, note: 'vals = [10, 20, 30, 40]; pos knows where each value lives.', panels: [arr([10, 20, 30, 40], { label: 'vals' }), mapT(POS4, 'pos', '', 'active', 'index')] },
          { say: 1, note: 'remove(20): pos says i = 1. Copy the last value, 40, into slot 1.', panels: [arr([10, 40, 30, 40], { label: 'vals', highlights: { 1: 'active', 3: 'muted' } }), mapT(POS4, 'pos', 20, 'bad', 'index')] },
          { say: 1, note: 'Update the moved value: pos 40 → 1.', panels: [arr([10, 40, 30, 40], { label: 'vals', highlights: { 1: 'active', 3: 'muted' } }), mapT([[10, 0], [20, 1], [30, 2], [40, 1]], 'pos', 40, 'active', 'index')] },
          { say: 1, note: 'pop() the old last slot, then delete 20 from pos. Nothing shifted.', panels: [arr([10, 40, 30], { label: 'vals', highlights: hl(3, () => 'done') }), mapT([[10, 0], [30, 2], [40, 1]], 'pos', '', 'active', 'index')] },
          { say: 2, note: 'Values fill slots 0..n − 1, so one random index is a uniform pick, e.g. 2 → 30.', panels: [arr([10, 40, 30], { label: 'vals', pointers: [ptr(2, 'random')], highlights: { 2: 'active' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"design a data structure"**, **"average O(1) time"**, **"getRandom"**, **"each element equally likely"**.', 'Not when the order must be kept: swap-with-last scrambles it.'],
        frames: [{ say: 0, note: 'Need "find by value" and "access by position"? Pair an array with a value → index map.', panels: [vars({ 'by value': 'pos.get(v)', 'by position': 'vals[i]' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: removing the last value',
        lines: ['vals = `[10, 40, 30]`; pos: 10 → 0, 40 → 1, 30 → 2.', 'remove(30): 30 is itself the last element.'],
        panels: [arr([10, 40, 30], { label: 'vals', highlights: { 2: 'bad' } }), mapT([[10, 0], [40, 1], [30, 2]], 'pos', 30, 'bad', 'index')],
        task: {
          type: 'choose',
          question: 'Which order of steps is safe?',
          options: [
            { text: '`pos.delete(30)`, then copy last into slot 2, `pos.set(30, 2)`, `pop()`', why: '`pos.set` re-inserts 30 after it was deleted: a ghost entry for a value that is gone.' },
            { text: 'Copy last into slot 2, `pos.set(30, 2)`, `pop()`, then `pos.delete(30)`' },
            { text: '`vals.splice(2, 1)`, then `pos.delete(30)`', why: 'splice shifts everything after the slot, which is O(n) in general; swap + pop is always O(1).' },
            { text: 'Special-case it: the last value needs different code', why: 'No special case is needed: copying 30 onto itself and rewriting its index is harmless.' },
          ],
          answer: 1,
        },
        solved: 'Update the moved element, then pop, then delete: the same steps work even when v is the last one.',
      },
    ],
  },
];
