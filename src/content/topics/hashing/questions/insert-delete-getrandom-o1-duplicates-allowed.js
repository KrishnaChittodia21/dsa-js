// See insert-delete-getrandom-o1.js: getRandom slots use { anyOf: [...] } and the checker
// requires variation across many random calls.
const CHECKER = `(output, args, expected) => {
  if (!Array.isArray(output) || output.length !== expected.length) return false;
  const randomOuts = [];
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    if (e && typeof e === 'object' && Array.isArray(e.anyOf)) {
      if (!e.anyOf.includes(output[i])) return false;
      if (e.anyOf.length > 1) randomOuts.push(output[i]);
    } else if (JSON.stringify(output[i]) !== JSON.stringify(e)) {
      return false;
    }
  }
  if (randomOuts.length >= 20 && new Set(randomOuts).size < 2) return false;
  return true;
}`;

export default {
  id: 'insert-delete-getrandom-o1-duplicates-allowed',
  title: 'Insert Delete GetRandom O(1) — Duplicates Allowed',
  difficulty: 'Hard',
  order: 2,
  kind: 'design',
  pattern: 'hash-index-map-design',
  tags: ['design', 'hash map', 'array', 'randomized', 'multiset'],
  source: { platform: 'LeetCode', number: 381, url: 'https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed/' },

  statement: `Design a class \`RandomizedCollection\` — a **multiset** (duplicates allowed) — supporting, each in **average O(1)** time:

- \`insert(val)\` — adds one copy of \`val\`. Returns \`true\` if \`val\` was **not** present before this insert, \`false\` otherwise.
- \`remove(val)\` — removes **one** copy of \`val\` if present. Returns \`true\` if something was removed.
- \`getRandom()\` — returns a random element; the probability of each value is **proportional to how many copies** it has. Only called when the collection is non-empty.

*Testing note:* \`getRandom\` results are accepted if they are any value currently present (\`{ anyOf: [...] }\`); a test with many calls checks the result varies.`,
  examples: [
    {
      input: '["RandomizedCollection","insert","insert","insert","getRandom","remove","getRandom"]\n[[],[1],[1],[2],[],[1],[]]',
      output: '[null,true,false,true,1 (prob 2/3) or 2 (prob 1/3),true,1 or 2 (each 1/2)]',
    },
  ],
  constraints: ['-2^31 <= val <= 2^31 - 1', 'At most 2 * 10^5 calls in total', 'getRandom is only called when the collection is non-empty'],

  think: `- In the no-duplicates version, the map stored ONE index per value. What must it store now?
- If each copy occupies its own array slot, is getRandom automatically weighted correctly?
- When you move the last element into a hole, which index sets change?`,
  patternChallenge: {
    options: ['Array + Map of value → Set of indices', 'Frequency Map only', 'Sorted array + binary search', 'Heap'],
    answer: 0,
    explanation: 'Every copy lives in its own array slot (so uniform slot sampling is proportional to counts), and the Map must track ALL slots of a value to delete any one of them in O(1).',
  },
  hints: ['Map each value to a Set of the indices where its copies live.', 'To remove: take any index i of val, move the last element into i, fix the last element\'s index set (add i, remove lastIndex), pop.'],
  approach: `- **insert(v):** \`vals.push(v)\`; add the new index to \`idx.get(v)\` (creating the Set if needed). Return whether the Set was empty before.
- **remove(v):** if no indices, false. Take any \`i\` from v's Set and delete it. Let \`lastIdx = vals.length − 1\`, \`last = vals[lastIdx]\`. Put \`last\` into slot i, then in last's Set **add i first, then delete lastIdx** (this order also works when i === lastIdx or last === v). Pop. If v's Set is empty, delete the key.
- **getRandom():** uniform slot → each value is chosen with probability count / total.`,

  className: 'RandomizedCollection',
  starterCode: `class RandomizedCollection {
  constructor() {
    
  }

  /** @param {number} val @return {boolean} */
  insert(val) {
    
  }

  /** @param {number} val @return {boolean} */
  remove(val) {
    
  }

  /** @return {number} */
  getRandom() {
    
  }
}
`,
  checker: CHECKER,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: the second insert of 1 returns false; removing one 1 leaves another.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'getRandom', 'remove', 'getRandom'], args: [[], [1], [1], [2], [], [1], []], expected: [null, true, false, true, { anyOf: [1, 2] }, true, { anyOf: [1, 2] }] },
    { scenario: 'Insert returns presence', hint: 'insert returns true only when the value was absent. Returning true for an existing value is a common slip.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'remove', 'remove', 'insert'], args: [[], [7], [7], [7], [7], [7], [7]], expected: [null, true, false, false, true, true, false] },
    { scenario: 'Remove from empty', hint: 'remove on an empty collection returns false.', ops: ['RandomizedCollection', 'remove', 'insert', 'getRandom', 'remove', 'remove'], args: [[], [3], [3], [], [3], [3]], expected: [null, false, true, 3, true, false] },
    { scenario: 'Remove every copy', hint: 'Two copies need two removes; the third remove returns false. Storing only one index per value loses the second copy.', ops: ['RandomizedCollection', 'insert', 'insert', 'remove', 'remove', 'remove', 'insert', 'getRandom'], args: [[], [4], [4], [4], [4], [4], [9], []], expected: [null, true, false, true, true, false, true, 9] },
    { scenario: 'Remove the last slot', hint: 'Removing the copy stored last (i === lastIdx): delete lastIdx before adding i and the index set is corrupted.', ops: ['RandomizedCollection', 'insert', 'insert', 'remove', 'insert', 'remove', 'getRandom', 'remove'], args: [[], [1], [2], [2], [2], [2], [], [1]], expected: [null, true, true, true, true, true, 1, true] },
    { scenario: 'Interleaved duplicates', hint: 'Copies of 0 and 1 interleave in the array; each remove must move the right element into the hole.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom'], args: [[], [0], [1], [0], [1], [0], [0], []], expected: [null, true, true, false, false, true, true, 1] },
    { scenario: 'Moved copy keeps index', hint: 'Removing 10 moves 20 into its slot; removing 20 later must find it at the new index.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom', 'remove', 'remove'], args: [[], [10], [10], [20], [10], [20], [], [10], [10]], expected: [null, true, false, true, true, true, 10, true, false] },
    { scenario: 'Extreme 32-bit values', hint: '-2^31 and 2^31 - 1 work like any other keys, including duplicates.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom'], args: [[], [-2147483648], [2147483647], [-2147483648], [2147483647], [-2147483648], []], expected: [null, true, true, false, true, true, -2147483648] },
    { scenario: 'Single value after removals', hint: 'Only 6 is left, so getRandom must return 6.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'remove', 'remove', 'insert', 'remove', 'getRandom'], args: [[], [5], [6], [5], [5], [5], [6], [6], []], expected: [null, true, true, false, true, true, false, true, 6] },
    { scenario: 'getRandom must vary', hint: '40 calls on {1, 1, 2, 3}: a getRandom that always returns the same element is not random.', ops: ['RandomizedCollection', 'insert', 'insert', 'insert', 'insert', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom'], args: [[], [1], [1], [2], [3], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []], expected: [null, true, false, true, true, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }] },
    { scenario: 'Mixed sequence (4 values)', hint: 'A pseudo-random mix with many duplicates — every rule above applies.', ops: ['RandomizedCollection', 'insert', 'remove', 'insert', 'insert', 'insert', 'remove', 'getRandom', 'remove', 'insert', 'getRandom', 'remove', 'remove', 'insert', 'getRandom', 'getRandom', 'getRandom', 'insert', 'remove', 'insert', 'getRandom', 'getRandom', 'remove', 'insert', 'remove', 'remove', 'remove', 'insert', 'remove', 'getRandom', 'getRandom', 'remove', 'getRandom', 'getRandom', 'insert', 'insert', 'remove', 'remove', 'remove', 'getRandom', 'remove', 'getRandom', 'insert', 'getRandom', 'getRandom', 'remove', 'insert', 'getRandom', 'remove', 'getRandom', 'insert', 'getRandom', 'remove', 'remove', 'insert', 'insert'], args: [[], [3], [1], [2], [3], [2], [2], [], [0], [3], [], [0], [2], [3], [], [], [], [2], [0], [3], [], [], [3], [3], [2], [0], [2], [0], [0], [], [], [0], [], [], [1], [3], [1], [1], [0], [], [0], [], [1], [], [], [3], [1], [], [0], [], [0], [], [2], [0], [3], [0]], expected: [null, true, false, true, false, false, true, { anyOf: [2, 3] }, false, false, { anyOf: [2, 3] }, false, true, false, 3, 3, 3, true, false, false, { anyOf: [2, 3] }, { anyOf: [2, 3] }, true, false, true, false, false, true, true, 3, 3, false, 3, 3, true, false, true, false, false, 3, false, 3, true, { anyOf: [1, 3] }, { anyOf: [1, 3] }, true, false, { anyOf: [1, 3] }, false, { anyOf: [1, 3] }, true, { anyOf: [0, 1, 3] }, false, true, false, true] },
    { scenario: 'Mixed sequence (8 values)', hint: 'A longer pseudo-random mix over 8 values.', ops: ['RandomizedCollection', 'remove', 'insert', 'getRandom', 'getRandom', 'insert', 'insert', 'insert', 'getRandom', 'getRandom', 'insert', 'getRandom', 'getRandom', 'insert', 'getRandom', 'getRandom', 'remove', 'insert', 'insert', 'getRandom', 'remove', 'remove', 'remove', 'insert', 'getRandom', 'remove', 'getRandom', 'getRandom', 'insert', 'getRandom', 'remove', 'remove', 'remove', 'remove', 'getRandom', 'getRandom', 'insert', 'getRandom', 'getRandom', 'insert', 'remove', 'getRandom', 'insert', 'remove', 'remove', 'insert', 'insert', 'remove', 'insert', 'remove', 'remove', 'remove', 'insert', 'insert', 'getRandom', 'getRandom', 'remove', 'insert', 'getRandom', 'insert', 'insert', 'remove', 'insert', 'remove', 'remove', 'insert', 'insert', 'remove', 'remove', 'remove', 'remove'], args: [[], [2], [4], [], [], [0], [6], [3], [], [], [2], [], [], [4], [], [], [7], [0], [3], [], [1], [6], [1], [4], [], [3], [], [], [2], [], [4], [6], [3], [2], [], [], [4], [], [], [5], [2], [], [7], [7], [1], [7], [7], [5], [1], [6], [3], [1], [3], [1], [], [], [5], [2], [], [5], [0], [6], [3], [5], [0], [0], [3], [3], [0], [0], [0]], expected: [null, false, true, 4, 4, true, true, true, { anyOf: [0, 3, 4, 6] }, { anyOf: [0, 3, 4, 6] }, true, { anyOf: [0, 2, 3, 4, 6] }, { anyOf: [0, 2, 3, 4, 6] }, false, { anyOf: [0, 2, 3, 4, 6] }, { anyOf: [0, 2, 3, 4, 6] }, false, false, false, { anyOf: [0, 2, 3, 4, 6] }, false, true, false, false, { anyOf: [0, 2, 3, 4] }, true, { anyOf: [0, 2, 3, 4] }, { anyOf: [0, 2, 3, 4] }, false, { anyOf: [0, 2, 3, 4] }, true, false, true, true, { anyOf: [0, 2, 4] }, { anyOf: [0, 2, 4] }, false, { anyOf: [0, 2, 4] }, { anyOf: [0, 2, 4] }, true, true, { anyOf: [0, 4, 5] }, true, true, false, true, false, true, true, false, false, true, true, true, { anyOf: [0, 1, 3, 4, 7] }, { anyOf: [0, 1, 3, 4, 7] }, false, true, { anyOf: [0, 1, 2, 3, 4, 7] }, true, false, false, false, true, true, false, false, true, true, true, true] },
    { scenario: 'Large, many removals', hint: '10^5 inserts, then removing all but the first, newest first. Searching the array with `indexOf` (and `splice`) makes each remove O(n); swap with the last slot and pop instead.', opsGen: '() => { const N = 100000, ops = [\'RandomizedCollection\'], args = [[]], expected = [null]; for (let i = 0; i < N; i++) { ops.push(\'insert\'); args.push([i % 50000]); expected.push(i < 50000); } for (let i = N - 1; i >= 1; i--) { ops.push(\'remove\'); args.push([i % 50000]); expected.push(true); } ops.push(\'getRandom\'); args.push([]); expected.push(0); return { ops, args, expected }; }', timeLimitMs: 1000 },
    { scenario: 'Large, many getRandom calls', hint: '3·10^4 distinct values and 3·10^4 getRandom calls. Walking a count Map on every call is O(n) per call — pick a random slot of an array.', opsGen: '() => { const N = 30000, ops = [\'RandomizedCollection\'], args = [[]], expected = [null]; const vals = []; for (let i = 0; i < N; i++) { ops.push(\'insert\'); args.push([i]); expected.push(true); vals.push(i); } const any = { anyOf: vals }; for (let i = 0; i < N; i++) { ops.push(\'getRandom\'); args.push([]); expected.push(any); } return { ops, args, expected }; }', timeLimitMs: 1000 },
  ],

  solution: {
    code: `class RandomizedCollection {
  constructor() {
    this.vals = [];            // one slot per copy
    this.idx = new Map();      // value → Set of indices in vals
  }

  insert(val) {
    if (!this.idx.has(val)) this.idx.set(val, new Set());
    const slots = this.idx.get(val);
    const wasAbsent = slots.size === 0;
    slots.add(this.vals.length);
    this.vals.push(val);
    return wasAbsent;
  }

  remove(val) {
    const slots = this.idx.get(val);
    if (!slots || slots.size === 0) return false;
    const i = slots.values().next().value;   // any copy of val
    slots.delete(i);

    const lastIdx = this.vals.length - 1;
    const last = this.vals[lastIdx];
    this.vals[i] = last;                     // move last element into the hole
    const lastSlots = this.idx.get(last);
    lastSlots.add(i);                        // add first…
    lastSlots.delete(lastIdx);               // …then delete (handles i === lastIdx)
    this.vals.pop();

    if (slots.size === 0) this.idx.delete(val);
    return true;
  }

  getRandom() {
    return this.vals[Math.floor(Math.random() * this.vals.length)];
  }
}`,
  },
  dryRun: {
    columns: ['op', 'vals', 'idx', 'returns'],
    rows: [
      ['insert(1)', '[1]', '{1:{0}}', 'true'],
      ['insert(1)', '[1,1]', '{1:{0,1}}', 'false'],
      ['insert(2)', '[1,1,2]', '{1:{0,1}, 2:{2}}', 'true'],
      ['remove(1)', 'take i=0; move 2 → slot 0; pop → [2,1]', '{1:{1}, 2:{0}}', 'true'],
      ['getRandom()', '[2,1]', '', '2 or 1, each 1/2'],
    ],
  },
  complexity: { time: 'O(1) average per operation', space: 'O(n)', explanation: 'Set and Map operations are O(1) average; the array only changes at its end.' },
  alternative: {
    title: 'Map value → array of indices',
    md: 'Using an array of indices per value makes "remove index lastIdx from last\'s list" O(k) unless you also store each slot\'s position inside that list. The Set version avoids that bookkeeping.',
    complexity: 'O(k) per remove without extra bookkeeping',
  },
  mistakes: ['Storing only one index per value (loses other copies)', 'Deleting lastIdx before adding i (breaks when i === lastIdx)', 'Returning true from insert when the value already existed'],
};
