// getRandom() cannot be compared exactly, so its expected slot is { anyOf: [...] }:
// the value must be one of the elements currently in the set. When a test has many
// multi-choice getRandom calls, the checker also requires at least two distinct results
// (a uniform implementation fails this with probability < 1e-5).
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
  if (randomOuts.length >= 20 && new Set(randomOuts).size < 2) return false; // never varies → not random
  return true;
}`;

export default {
  id: 'insert-delete-getrandom-o1',
  title: 'Insert Delete GetRandom O(1)',
  difficulty: 'Medium',
  order: 6,
  kind: 'design',
  pattern: 'hash-index-map-design',
  tags: ['design', 'hash map', 'array', 'randomized'],
  source: { platform: 'LeetCode', number: 380, url: 'https://leetcode.com/problems/insert-delete-getrandom-o1/' },

  statement: `Design a class \`RandomizedSet\` that stores **distinct** integers and supports, each in **average O(1)** time:

- \`insert(val)\` — adds \`val\` if it is not present. Returns \`true\` if it was added, \`false\` if it was already there.
- \`remove(val)\` — removes \`val\` if present. Returns \`true\` if it was removed, \`false\` otherwise.
- \`getRandom()\` — returns a random element currently in the set; **every element must be equally likely**. It is only called when the set is non-empty.

*Testing note:* since \`getRandom\` is random, tests accept any element currently in the set (shown as \`{ anyOf: [...] }\`), and a test with many calls checks that the result is not always the same.`,
  examples: [
    {
      input: '["RandomizedSet","insert","remove","insert","getRandom","remove","insert","getRandom"]\n[[],[1],[2],[2],[],[1],[2],[]]',
      output: '[null,true,false,true,1 or 2,true,false,2]',
      explanation: 'After inserting 1 and 2, getRandom returns either. After removing 1, only 2 remains.',
    },
  ],
  constraints: ['-2^31 <= val <= 2^31 - 1', 'At most 2 * 10^5 calls in total', 'getRandom is only called on a non-empty set'],

  think: `- Which structure gives O(1) insert/remove/has? Which gives O(1) uniform random pick?
- Removing from the middle of an array is O(n). Is there a position where removal is O(1)?
- What extra information do you need to find a value's position quickly?`,
  patternChallenge: {
    options: ['Map only', 'Array + index Map (swap with last)', 'Balanced BST', 'Linked list + Map'],
    answer: 1,
    explanation: 'A Map alone cannot sample uniformly in O(1); an array alone cannot find/delete a value in O(1). An array of values plus a Map value → index, deleting by swapping with the last element, makes all three operations O(1) average.',
  },
  hints: ['Keep `vals` (array) and `pos` (Map value → index in vals).', 'To remove val at index i: move the last element into slot i, update its index in pos, pop the array, delete val from pos.'],
  approach: `- **insert(v):** if \`pos.has(v)\` return false; else \`pos.set(v, vals.length)\`, \`vals.push(v)\`.
- **remove(v):** if absent return false. \`i = pos.get(v)\`, \`last = vals[vals.length − 1]\`; \`vals[i] = last\`, \`pos.set(last, i)\`; \`vals.pop()\`; \`pos.delete(v)\`. Order matters: deleting v last also handles v being the last element.
- **getRandom():** \`vals[Math.floor(Math.random() * vals.length)]\` — uniform because each element occupies exactly one slot.`,

  className: 'RandomizedSet',
  starterCode: `class RandomizedSet {
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
    { scenario: 'Example 1', hint: 'The statement example: insert/remove return values, and getRandom picks from what is present.', ops: ['RandomizedSet', 'insert', 'remove', 'insert', 'getRandom', 'remove', 'insert', 'getRandom'], args: [[], [1], [2], [2], [], [1], [2], []], expected: [null, true, false, true, { anyOf: [1, 2] }, true, false, 2] },
    { scenario: 'Duplicate insert and remove', hint: 'Inserting a present value returns false; removing an absent one returns false.', ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'remove', 'remove', 'remove', 'insert', 'getRandom'], args: [[], [5], [5], [6], [5], [5], [6], [7], []], expected: [null, true, false, true, true, false, true, true, 7] },
    { scenario: 'Remove from empty set', hint: 'remove on an empty set returns false and must not throw.', ops: ['RandomizedSet', 'remove', 'insert', 'getRandom', 'remove', 'insert', 'getRandom'], args: [[], [0], [0], [], [0], [-1], []], expected: [null, false, true, 0, true, true, -1] },
    { scenario: 'Remove the last element', hint: 'Removing the element stored last: if you delete it from the Map before re-pointing the moved element, it comes back as a ghost and the next insert wrongly returns false.', ops: ['RandomizedSet', 'insert', 'insert', 'remove', 'insert', 'getRandom', 'remove', 'remove', 'insert'], args: [[], [1], [2], [2], [2], [], [2], [1], [1]], expected: [null, true, true, true, true, { anyOf: [1, 2] }, true, true, true] },
    { scenario: 'Moved element index updated', hint: 'Removing 1 moves 3 into its slot. If 3\'s index is not updated, removing 3 afterwards corrupts the array.', ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom'], args: [[], [1], [2], [3], [1], [3], []], expected: [null, true, true, true, true, true, 2] },
    { scenario: 'Single element left', hint: 'After removing 10 and 30, only 20 remains — getRandom must return it every time.', ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'remove', 'getRandom', 'remove', 'getRandom', 'getRandom'], args: [[], [10], [20], [30], [30], [], [10], [], []], expected: [null, true, true, true, true, { anyOf: [10, 20] }, true, 20, 20] },
    { scenario: 'Remove all, reinsert', hint: 'Empty the set completely, then reuse it: the array and the Map must both be clean.', ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'remove', 'insert', 'remove', 'remove', 'getRandom'], args: [[], [1], [2], [3], [1], [1], [3], [2], []], expected: [null, true, true, true, true, true, true, true, 1] },
    { scenario: 'Extreme 32-bit values', hint: '-2^31 and 2^31 - 1 are ordinary keys.', ops: ['RandomizedSet', 'insert', 'insert', 'remove', 'remove', 'insert', 'getRandom'], args: [[], [-2147483648], [2147483647], [-2147483648], [2147483647], [42], []], expected: [null, true, true, true, true, true, 42] },
    { scenario: 'Zero and negatives', hint: '0 is a real value — do not treat it as "missing" in `if (!map.get(val))` checks.', ops: ['RandomizedSet', 'insert', 'insert', 'remove', 'insert', 'remove', 'getRandom'], args: [[], [0], [-5], [0], [0], [-5], []], expected: [null, true, true, true, true, true, 0] },
    { scenario: 'getRandom must vary', hint: '40 calls on {1, 2, 3}: always returning the same element (e.g. vals[0]) is not random.', ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom', 'getRandom'], args: [[], [1], [2], [3], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []], expected: [null, true, true, true, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }, { anyOf: [1, 2, 3] }] },
    { scenario: 'Mixed sequence (6 values)', hint: 'A pseudo-random mix of inserts, removes and getRandom calls — every rule above applies.', ops: ['RandomizedSet', 'insert', 'remove', 'insert', 'getRandom', 'getRandom', 'getRandom', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'getRandom', 'getRandom', 'remove', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom', 'getRandom', 'insert', 'getRandom', 'insert', 'insert', 'remove', 'remove', 'remove', 'getRandom', 'remove', 'remove', 'getRandom', 'insert', 'remove', 'remove', 'remove', 'insert', 'getRandom', 'getRandom', 'insert', 'remove', 'getRandom', 'remove', 'getRandom', 'insert', 'insert', 'getRandom', 'insert'], args: [[], [4], [5], [0], [], [], [], [0], [0], [0], [2], [0], [2], [1], [], [], [5], [2], [2], [3], [4], [3], [], [], [1], [], [2], [5], [2], [2], [5], [], [0], [0], [], [1], [5], [5], [0], [1], [], [], [1], [5], [], [3], [], [5], [2], [], [4]], expected: [null, true, false, true, { anyOf: [0, 4] }, { anyOf: [0, 4] }, { anyOf: [0, 4] }, false, false, false, true, false, false, true, { anyOf: [0, 1, 2, 4] }, { anyOf: [0, 1, 2, 4] }, false, false, false, true, true, true, { anyOf: [0, 1, 2] }, { anyOf: [0, 1, 2] }, false, { anyOf: [0, 1, 2] }, false, true, true, false, true, { anyOf: [0, 1] }, true, false, 1, false, false, false, false, false, 1, 1, false, false, 1, false, 1, true, true, { anyOf: [1, 2, 5] }, true] },
    { scenario: 'Mixed sequence (12 values)', hint: 'A longer pseudo-random mix over 12 values.', ops: ['RandomizedSet', 'insert', 'remove', 'getRandom', 'remove', 'insert', 'remove', 'remove', 'insert', 'getRandom', 'remove', 'remove', 'insert', 'insert', 'getRandom', 'getRandom', 'insert', 'insert', 'getRandom', 'getRandom', 'insert', 'insert', 'getRandom', 'insert', 'remove', 'getRandom', 'insert', 'insert', 'remove', 'insert', 'insert', 'remove', 'insert', 'insert', 'remove', 'getRandom', 'remove', 'getRandom', 'getRandom', 'remove', 'remove', 'getRandom', 'insert', 'insert', 'getRandom', 'insert', 'insert', 'getRandom', 'getRandom', 'getRandom', 'remove', 'insert', 'getRandom', 'remove', 'getRandom', 'getRandom', 'insert', 'remove', 'getRandom', 'remove', 'insert', 'insert', 'remove', 'getRandom', 'insert', 'remove', 'insert', 'insert', 'insert', 'getRandom', 'getRandom'], args: [[], [1], [10], [], [6], [8], [3], [5], [5], [], [9], [0], [9], [2], [], [], [3], [4], [], [], [8], [11], [], [2], [2], [], [4], [10], [9], [9], [10], [11], [5], [5], [1], [], [10], [], [], [2], [9], [], [7], [3], [], [11], [3], [], [], [], [1], [0], [], [8], [], [], [2], [9], [], [6], [8], [7], [1], [], [8], [8], [1], [5], [0], [], []], expected: [null, true, false, 1, false, true, false, false, true, { anyOf: [1, 5, 8] }, false, false, true, true, { anyOf: [1, 2, 5, 8, 9] }, { anyOf: [1, 2, 5, 8, 9] }, true, true, { anyOf: [1, 2, 3, 4, 5, 8, 9] }, { anyOf: [1, 2, 3, 4, 5, 8, 9] }, false, true, { anyOf: [1, 2, 3, 4, 5, 8, 9, 11] }, false, true, { anyOf: [1, 3, 4, 5, 8, 9, 11] }, false, true, true, true, false, true, false, false, true, { anyOf: [3, 4, 5, 8, 9, 10] }, true, { anyOf: [3, 4, 5, 8, 9] }, { anyOf: [3, 4, 5, 8, 9] }, false, true, { anyOf: [3, 4, 5, 8] }, true, false, { anyOf: [3, 4, 5, 7, 8] }, true, false, { anyOf: [3, 4, 5, 7, 8, 11] }, { anyOf: [3, 4, 5, 7, 8, 11] }, { anyOf: [3, 4, 5, 7, 8, 11] }, false, true, { anyOf: [0, 3, 4, 5, 7, 8, 11] }, true, { anyOf: [0, 3, 4, 5, 7, 11] }, { anyOf: [0, 3, 4, 5, 7, 11] }, true, false, { anyOf: [0, 2, 3, 4, 5, 7, 11] }, false, true, false, false, { anyOf: [0, 2, 3, 4, 5, 7, 8, 11] }, false, true, true, false, false, { anyOf: [0, 1, 2, 3, 4, 5, 7, 11] }, { anyOf: [0, 1, 2, 3, 4, 5, 7, 11] }] },
    { scenario: 'Large, many removals', hint: '10^5 inserts, then removing all but the first, newest first. Searching the array with `indexOf` (and `splice`) makes each remove O(n); swap with the last element and pop instead.', opsGen: '() => { const N = 100000, ops = [\'RandomizedSet\'], args = [[]], expected = [null]; for (let i = 0; i < N; i++) { ops.push(\'insert\'); args.push([i * 7 - 100000]); expected.push(true); } for (let i = N - 1; i >= 1; i--) { ops.push(\'remove\'); args.push([i * 7 - 100000]); expected.push(true); } ops.push(\'getRandom\'); args.push([]); expected.push(-100000); return { ops, args, expected }; }', timeLimitMs: 1000 },
    { scenario: 'Large, many getRandom calls', hint: '3·10^4 elements and 3·10^4 getRandom calls. Copying the Set into an array on every call is O(n) per call — keep an array of values.', opsGen: '() => { const N = 30000, ops = [\'RandomizedSet\'], args = [[]], expected = [null]; const vals = []; for (let i = 0; i < N; i++) { ops.push(\'insert\'); args.push([i]); expected.push(true); vals.push(i); } const any = { anyOf: vals }; for (let i = 0; i < N; i++) { ops.push(\'getRandom\'); args.push([]); expected.push(any); } return { ops, args, expected }; }', timeLimitMs: 1000 },
  ],

  solution: {
    code: `class RandomizedSet {
  constructor() {
    this.vals = [];           // values, for O(1) random access
    this.pos = new Map();     // value → index in vals
  }

  insert(val) {
    if (this.pos.has(val)) return false;
    this.pos.set(val, this.vals.length);
    this.vals.push(val);
    return true;
  }

  remove(val) {
    if (!this.pos.has(val)) return false;
    const i = this.pos.get(val);
    const last = this.vals[this.vals.length - 1];
    this.vals[i] = last;          // move the last element into the hole
    this.pos.set(last, i);
    this.vals.pop();              // O(1): remove from the end
    this.pos.delete(val);         // last, so it also works when val === last
    return true;
  }

  getRandom() {
    return this.vals[Math.floor(Math.random() * this.vals.length)];
  }
}`,
  },
  dryRun: {
    columns: ['op', 'vals', 'pos', 'returns'],
    rows: [
      ['insert(10)', '[10]', '{10:0}', 'true'],
      ['insert(20)', '[10,20]', '{10:0, 20:1}', 'true'],
      ['insert(30)', '[10,20,30]', '{10:0, 20:1, 30:2}', 'true'],
      ['remove(10)', 'move 30 → slot 0, pop → [30,20]', '{30:0, 20:1}', 'true'],
      ['getRandom()', '[30,20]', '', '30 or 20, each 50%'],
    ],
  },
  complexity: { time: 'O(1) average per operation', space: 'O(n)', explanation: 'Map operations are O(1) average; push/pop are O(1) amortized; no shifting ever happens.' },
  alternative: {
    title: 'Set + Array.from for getRandom (too slow)',
    md: 'Keeping only a Set and doing `Array.from(set)[k]` in getRandom is O(n) per call — correct but fails the O(1) requirement.',
    complexity: 'insert/remove O(1), getRandom O(n)',
  },
  mistakes: ['Using splice(i, 1) to remove — O(n)', 'Deleting val from the map before updating the moved element (re-creates a ghost when val was last)', 'Picking a random key by iterating the Map — O(n)'],
};
