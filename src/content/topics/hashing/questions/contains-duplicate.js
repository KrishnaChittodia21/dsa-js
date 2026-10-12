export default {
  id: 'contains-duplicate',
  title: 'Contains Duplicate',
  difficulty: 'Easy',
  order: 2,
  pattern: 'hash-set-membership',
  tags: ['array', 'hash set'],
  source: { platform: 'LeetCode', number: 217, url: 'https://leetcode.com/problems/contains-duplicate/' },

  statement: `Given an integer array \`nums\`, return \`true\` if **any value appears at least twice**, and \`false\` if every element is distinct.`,
  examples: [
    { input: 'nums = [1,2,3,1]', output: 'true' },
    { input: 'nums = [1,2,3,4]', output: 'false' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],

  think: `- What question do you ask about each element as you scan?
- Which data structure answers that question in O(1)?`,
  patternChallenge: {
    options: ['Hash Set — Seen Before?', 'Two Pointers', 'Frequency Map with sorting', 'Binary Search'],
    answer: 0,
    explanation: '"Have I seen this value before?" is a pure membership question — a Set. Counting exact frequencies is unnecessary.',
  },
  hints: ['Keep a Set of values seen so far.', 'Return true the moment a value is already in the Set.'],
  approach: `**Brute force:** compare every pair → O(n²).

**Sort:** duplicates become neighbours → O(n log n) time, O(1) extra if sorting in place (but that mutates the input).

**Optimized:** a Set — for each x, if \`seen.has(x)\` return true, else add it. O(n) time, O(n) space. One-liner: \`new Set(nums).size !== nums.length\` (same complexity, but never stops early).`,

  functionName: 'containsDuplicate',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: 1 appears twice.', args: [[1, 2, 3, 1]], expected: true },
    { scenario: 'Example 2', hint: 'All values are distinct — return false.', args: [[1, 2, 3, 4]], expected: false },
    { scenario: 'Many duplicates', hint: 'Several values repeat; returning on the first repeat is enough.', args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    { scenario: 'Single element', hint: 'One element can never be a duplicate.', args: [[7]], expected: false },
    { scenario: 'Two equal elements', hint: 'The smallest duplicate case — including zeros, which are falsy.', args: [[0, 0]], expected: true },
    { scenario: 'Opposite signs', hint: '−1 and 1 are different values; do not compare absolute values.', args: [[-1, 1]], expected: false },
    { scenario: 'Duplicate far apart', hint: 'The repeat is at the very start and end of the array.', args: [[5, 1, 2, 3, 4, 5]], expected: true },
    { scenario: 'Extreme values', hint: 'Values at ±10⁹ are compared exactly.', args: [[1000000000, -1000000000, 1000000000]], expected: true },
    { scenario: 'Negatives without duplicate', hint: 'Sorting without a comparator orders numbers as strings — a bad habit; here the values are all distinct.', args: [[-10, -9, 10, 9, -1, 1]], expected: false },
    { scenario: 'Large distinct input (n = 10^5)', hint: 'Using includes / indexOf inside the loop is O(n²) — too slow. A Set makes each check O(1).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i * 3 - 150000)]', expected: false, timeLimitMs: 1000 },
    { scenario: 'Large input, duplicate at end', hint: 'The only repeat is the last element; an O(n²) scan has to do almost all the work before finding it.', argsGen: '() => { const a = Array.from({ length: 100000 }, (_, i) => 1000000000 - i * 7); a[99999] = a[0]; return [a]; }', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;   // O(1) average
    seen.add(x);
  }
  return false;
}`,
  },
  dryRun: {
    columns: ['x', 'seen before', 'action'],
    rows: [['1', '{}', 'add'], ['2', '{1}', 'add'], ['3', '{1,2}', 'add'], ['1', '{1,2,3}', 'found → true']],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass with O(1) average Set operations; up to n stored values.' },
  alternative: {
    title: 'Sort and compare neighbours',
    md: 'After sorting, equal values are adjacent. O(1) extra space if the input may be mutated.',
    code: `function containsDuplicate(nums) {
  const a = [...nums].sort((x, y) => x - y);
  for (let i = 1; i < a.length; i++) if (a[i] === a[i - 1]) return true;
  return false;
}`,
    complexity: 'O(n log n) time, O(n) space for the copy (O(1) if sorting in place)',
  },
  mistakes: ['Using arr.includes / indexOf inside the loop (O(n²))', 'Calling sort() without a comparator — fine for equality here, but a bad habit with numbers'],
};
