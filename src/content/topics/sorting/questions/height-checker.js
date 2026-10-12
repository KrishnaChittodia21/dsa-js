export default {
  id: 'height-checker',
  title: 'Height Checker',
  difficulty: 'Easy',
  order: 3,
  pattern: 'sorting-counting-bucket',
  tags: ['array', 'counting sort'],
  source: { platform: 'LeetCode', number: 1051, url: 'https://leetcode.com/problems/height-checker/' },

  statement: `Students should stand in a line in **non-decreasing** order of height. You are given \`heights\`, the order they are actually standing in.

Return how many positions \`i\` hold a different height from the height that *should* be there in the correctly ordered line.`,
  examples: [
    { input: 'heights = [1,1,4,2,1,3]', output: '3', explanation: 'Expected [1,1,1,2,3,4]; positions 2, 4 and 5 differ.' },
    { input: 'heights = [5,1,2,3,4]', output: '5' },
    { input: 'heights = [1,2,3,4,5]', output: '0' },
  ],
  constraints: ['1 <= heights.length <= 100', '1 <= heights[i] <= 100'],

  think: `- What is the "expected" line? How do you get it?
- Heights are between 1 and 100. Does that suggest something faster than a comparison sort?
- Do you even need to materialise the expected array?`,
  patternChallenge: {
    options: ['Counting sort (values in 1..100)', 'Sliding Window', 'Binary Search', 'Monotonic Stack'],
    answer: 0,
    explanation: 'The answer compares the array with its sorted version, and the constraints bound values to 1..100 — counting sort builds the sorted order in O(n + 100) without comparisons.',
  },
  hints: [
    'The simplest correct solution: sort a copy (numerically!) and count mismatches.',
    'Counting sort: count how many students have each height, then walk heights 1..100 in order while walking the original array, comparing as you go.',
  ],
  approach: `**Simple:** \`expected = [...heights].sort((a, b) => a - b)\`, then count indices where they differ. O(n log n). (Copy first — \`sort\` mutates!)

**Optimized (counting sort):** \`count[h]\` = number of students of height h. Walk the original array with index i while a pointer \`h\` walks through heights in increasing order, skipping heights whose count is exhausted. The height at position i of the sorted line is the current \`h\`. O(n + 100).`,

  functionName: 'heightChecker',
  paramNames: ['heights'],
  starterCode: `/**
 * @param {number[]} heights
 * @return {number}
 */
function heightChecker(heights) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: three positions differ from the sorted line.', args: [[1,1,4,2,1,3]], expected: 3 },
    { scenario: 'Example 2', hint: 'From the statement: every student is out of place.', args: [[5,1,2,3,4]], expected: 5 },
    { scenario: 'Example 3', hint: 'Already sorted — nobody is out of place.', args: [[1,2,3,4,5]], expected: 0 },
    { scenario: 'Single student', hint: 'One student is always in the right place.', args: [[7]], expected: 0 },
    { scenario: 'All equal heights', hint: 'Equal heights in any order already form a sorted line.', args: [[2,2,2]], expected: 0 },
    { scenario: 'Two students swapped', hint: 'Both positions are wrong.', args: [[2,1]], expected: 2 },
    { scenario: 'Sorted multi-digit heights', hint: '`heights.sort()` without a comparator: [9, 10, 100] becomes [10, 100, 9] in string order and every position looks wrong.', args: [[9,10,100]], expected: 0 },
    { scenario: 'Unsorted multi-digit heights', hint: 'Compare numerically — 9 < 10 < 100.', args: [[10,9,100]], expected: 2 },
    { scenario: 'Reverse sorted', hint: 'Sorting heights itself instead of a copy makes every position match (answer 0). Here only the middle student is in place.', args: [[5,4,3,2,1]], expected: 4 },
    { scenario: 'Height 100 present', hint: 'Sizing the count array to 100 instead of 101 loses height 100 (index 100).', args: [[100,1,100,1]], expected: 2 },
    { scenario: 'Duplicates out of place', hint: 'Duplicates mean several sorted positions hold the same value — compare position by position.', args: [[3,1,2,1,3,2]], expected: 3 },
    { scenario: 'Maximum length (n = 100)', hint: 'The largest allowed class with heights across the full 1..100 range.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100 }, () => (r() % 100) + 1)]; }', expected: 99 },
  ],

  solution: {
    code: `function heightChecker(heights) {
  const count = new Array(101).fill(0);
  for (const h of heights) count[h]++;

  let mismatches = 0;
  let h = 1;                           // current height in the sorted line
  for (let i = 0; i < heights.length; i++) {
    while (count[h] === 0) h++;        // skip heights already used up
    if (heights[i] !== h) mismatches++;
    count[h]--;
  }
  return mismatches;
}`,
    explanation: 'The pointer h only increases, so the inner while loop runs at most 100 times in total — O(n + 100).',
  },
  dryRun: {
    columns: ['i', 'heights[i]', 'expected h', 'mismatch?'],
    rows: [
      ['0', '1', '1', 'no'],
      ['1', '1', '1', 'no'],
      ['2', '4', '1', 'yes'],
      ['3', '2', '2', 'no'],
      ['4', '1', '3', 'yes'],
      ['5', '3', '4', 'yes'],
    ],
  },
  complexity: { time: 'O(n + k), k = 100', space: 'O(k)', explanation: 'One counting pass, one comparison pass; the height pointer advances at most k times overall.' },
  alternative: {
    title: 'Sort a copy',
    md: 'Easiest to write and plenty fast for n ≤ 100.',
    code: `function heightChecker(heights) {
  const expected = [...heights].sort((a, b) => a - b);
  return heights.filter((h, i) => h !== expected[i]).length;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    '`heights.sort()` without a comparator: [100, 9, 10] becomes [10, 100, 9] (string order).',
    'Sorting `heights` itself instead of a copy — then every position matches and the answer is 0.',
    'Sizing the count array to 100 instead of 101 (index 100 is needed).',
  ],
};
