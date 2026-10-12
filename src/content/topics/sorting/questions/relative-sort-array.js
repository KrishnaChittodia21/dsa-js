export default {
  id: 'relative-sort-array',
  title: 'Relative Sort Array',
  difficulty: 'Easy',
  order: 4,
  pattern: 'sorting-counting-bucket',
  tags: ['array', 'counting sort', 'hash map'],
  source: { platform: 'LeetCode', number: 1122, url: 'https://leetcode.com/problems/relative-sort-array/' },

  statement: `You get two arrays \`arr1\` and \`arr2\`. The values in \`arr2\` are distinct and every one of them appears in \`arr1\`.

Reorder \`arr1\` so that values appearing in \`arr2\` come first, **in the same order as in \`arr2\`** (with all their copies together). Values of \`arr1\` that are not in \`arr2\` go at the end in **ascending** order.`,
  examples: [
    { input: 'arr1 = [2,3,1,3,2,4,6,7,9,2,19], arr2 = [2,1,4,3,9,6]', output: '[2,2,2,1,4,3,3,9,6,7,19]' },
    { input: 'arr1 = [28,6,22,8,44,17], arr2 = [22,28,8,6]', output: '[22,28,8,6,17,44]' },
  ],
  constraints: ['1 <= arr1.length, arr2.length <= 1000', '0 <= arr1[i], arr2[i] <= 1000', 'arr2 values are distinct and all appear in arr1'],

  think: `- Values are between 0 and 1000. How many copies of each value are there?
- If you knew the count of every value, how would you write the output?
- What about the leftovers — how do you emit them in ascending order cheaply?`,
  patternChallenge: {
    options: ['Two Pointers', 'Prefix Sum', 'Binary Search', 'Counting sort (values in 0..1000)'],
    answer: 3,
    explanation: 'Small bounded values + "emit all copies of each value in a given order" is counting sort: count, then write out following arr2, then the remaining counts in ascending order. A rank-map comparator also works in O(n log n).',
  },
  hints: [
    'Count every value of arr1 in an array of size 1001.',
    'For each value v of arr2, emit v count[v] times and set count[v] = 0. Then walk v = 0..1000 and emit the rest.',
  ],
  approach: `**Comparator approach:** build \`rank = Map(value → index in arr2)\`. Sort arr1 with: both ranked → compare ranks; only one ranked → it goes first; neither → \`a − b\`. O(n log n).

**Counting approach (optimal):**
1. \`count[v]\` for every v in arr1.
2. For v in arr2 (in order): push v \`count[v]\` times, then zero the count.
3. For v from 0 to 1000: push v \`count[v]\` times — these are the leftovers, automatically ascending.
O(n + m + 1000).`,

  functionName: 'relativeSortArray',
  paramNames: ['arr1', 'arr2'],
  starterCode: `/**
 * @param {number[]} arr1
 * @param {number[]} arr2
 * @return {number[]}
 */
function relativeSortArray(arr1, arr2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: arr2 order first, then leftovers ascending.', args: [[2,3,1,3,2,4,6,7,9,2,19],[2,1,4,3,9,6]], expected: [2,2,2,1,4,3,3,9,6,7,19] },
    { scenario: 'Example 2', hint: 'From the statement: leftovers 44 and 17 go at the end in ascending order.', args: [[28,6,22,8,44,17],[22,28,8,6]], expected: [22,28,8,6,17,44] },
    { scenario: 'Single element', hint: 'The smallest input.', args: [[1],[1]], expected: [1] },
    { scenario: 'Repeated arr2 value', hint: 'Emitting only one copy of each arr2 value: all three 5s must appear.', args: [[5,5,5],[5]], expected: [5,5,5] },
    { scenario: 'Leftovers need numeric sort', hint: 'Sorting leftovers with .sort() and no comparator uses string order (10, 100, 9).', args: [[100,9,10,3],[3]], expected: [3,9,10,100] },
    { scenario: 'Several leftovers', hint: 'Using ra − rb when both ranks are Infinity gives NaN and breaks the comparator; leftovers must still sort ascending.', args: [[0,1000,0,7,500,3],[1000]], expected: [1000,0,0,3,7,500] },
    { scenario: 'No leftovers', hint: 'arr2 covers every value — the output follows arr2 exactly.', args: [[4,3,2,1],[1,2,3,4]], expected: [1,2,3,4] },
    { scenario: 'Leftovers with duplicates', hint: 'Duplicate leftovers keep all their copies, ascending.', args: [[9,9,1,1,5],[5]], expected: [5,1,1,9,9] },
    { scenario: 'Values at the bounds', hint: '0 and 1000 are both valid values — a count array needs size 1001.', args: [[1000,0,500,1000,0],[0]], expected: [0,0,500,1000,1000] },
    { scenario: 'arr2 in descending order', hint: 'The arr2 order wins even when it is the opposite of numeric order.', args: [[1,2,3,4,5,6],[6,4,2]], expected: [6,4,2,1,3,5] },
    { scenario: 'Interleaved duplicates', hint: 'Copies of the same arr2 value are scattered — group them together.', args: [[3,1,2,3,1,2,3,8,0],[2,3]], expected: [2,2,3,3,3,0,1,1,8] },
    { scenario: 'Maximum length (n = 1000)', hint: 'Full-size arrays: every value appears twice and 250 of them are ranked by arr2.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => (i * 7) % 500), Array.from({ length: 250 }, (_, i) => 499 - i)]', expected: Array.from({ length: 1000 }, (_, i) => (i < 500 ? 499 - (i >> 1) : (i - 500) >> 1)) },
  ],

  solution: {
    code: `function relativeSortArray(arr1, arr2) {
  const count = new Array(1001).fill(0);
  for (const v of arr1) count[v]++;

  const out = [];
  for (const v of arr2) {              // arr2 order first
    while (count[v] > 0) { out.push(v); count[v]--; }
  }
  for (let v = 0; v <= 1000; v++) {    // leftovers ascending
    while (count[v] > 0) { out.push(v); count[v]--; }
  }
  return out;
}`,
  },
  dryRun: {
    columns: ['phase', 'value', 'count', 'out'],
    rows: [
      ['arr2', '22', '1', '[22]'],
      ['arr2', '28', '1', '[22,28]'],
      ['arr2', '8', '1', '[22,28,8]'],
      ['arr2', '6', '1', '[22,28,8,6]'],
      ['leftover', '17', '1', '[22,28,8,6,17]'],
      ['leftover', '44', '1', '[22,28,8,6,17,44]'],
    ],
  },
  complexity: { time: 'O(n + m + K), K = 1001', space: 'O(K)', explanation: 'Counting pass over arr1, one pass over arr2, one pass over the value range. Each output element is pushed once.' },
  alternative: {
    title: 'Rank-map comparator',
    md: 'General solution when values are not bounded.',
    code: `function relativeSortArray(arr1, arr2) {
  const rank = new Map(arr2.map((v, i) => [v, i]));
  return [...arr1].sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a) : Infinity;
    const rb = rank.has(b) ? rank.get(b) : Infinity;
    if (ra !== rb) return ra < rb ? -1 : 1;   // Infinity - Infinity would be NaN
    return a - b;
  });
}`,
    complexity: 'O(n log n + m) time, O(m) space',
  },
  mistakes: [
    'Using `ra - rb` when both ranks are Infinity — `Infinity - Infinity` is NaN, which breaks the comparator.',
    'Sorting the leftovers with `.sort()` without a comparator (string order: 100 before 9).',
    'Emitting only one copy of each arr2 value.',
  ],
};
