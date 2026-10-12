export default {
  id: 'sort-the-people',
  title: 'Sort the People',
  difficulty: 'Easy',
  order: 2,
  pattern: 'sorting-custom-comparator',
  tags: ['array', 'sorting', 'comparator'],
  source: { platform: 'LeetCode', number: 2418, url: 'https://leetcode.com/problems/sort-the-people/' },

  statement: `You get two arrays of the same length: \`names[i]\` is a person's name and \`heights[i]\` is that person's height. All heights are **distinct**.

Return the names ordered from the **tallest** person to the **shortest**.`,
  examples: [
    { input: 'names = ["Mary","John","Emma"], heights = [180,165,170]', output: '["Mary","Emma","John"]' },
    { input: 'names = ["Alice","Bob","Bob"], heights = [155,185,150]', output: '["Bob","Alice","Bob"]', explanation: 'Names may repeat; heights never do.' },
  ],
  constraints: ['1 <= n <= 1000', '1 <= names[i].length <= 20', '1 <= heights[i] <= 10^5', 'All heights are distinct'],

  think: `- You must sort one array (\`names\`) using the values of *another* array (\`heights\`). How do you keep them linked?
- Could you sort **indices** instead of values?
- Why would sorting \`names\` directly with \`heights.indexOf\` be a bad idea?`,
  patternChallenge: {
    options: ['Two Pointers', 'Custom comparator (sort indices by a key array)', 'Counting sort on names', 'Hash set'],
    answer: 1,
    explanation: 'The order is defined by a different array — the textbook use of a comparator over indices (or over [height, name] pairs). Counting sort on heights is possible (heights ≤ 10^5) but the comparator is simpler and fast enough for n ≤ 1000.',
  },
  hints: [
    'Create `idx = [0, 1, …, n−1]` and sort it by `heights` descending.',
    'Comparator: `(i, j) => heights[j] - heights[i]`. Then map each index back to its name.',
  ],
  approach: `**Brute force:** selection-style — repeatedly find the tallest remaining person (O(n) each) → O(n²).

**Optimized:** sort index positions by height descending with a numeric comparator, then map indices to names. O(n log n). Equivalent: zip into \`[height, name]\` pairs, sort pairs by height descending, unzip.

Never sort \`names\` with a comparator that looks up heights via \`names.indexOf(...)\` — duplicate names break it, and each lookup is O(n).`,

  functionName: 'sortPeople',
  paramNames: ['names', 'heights'],
  starterCode: `/**
 * @param {string[]} names
 * @param {number[]} heights
 * @return {string[]}
 */
function sortPeople(names, heights) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: tallest first.', args: [["Mary","John","Emma"],[180,165,170]], expected: ["Mary","Emma","John"] },
    { scenario: 'Example 2', hint: 'Names may repeat; heights never do.', args: [["Alice","Bob","Bob"],[155,185,150]], expected: ["Bob","Alice","Bob"] },
    { scenario: 'Single person', hint: 'The smallest input.', args: [["Solo"],[100]], expected: ["Solo"] },
    { scenario: 'Two people swapped', hint: 'The shorter person is listed first, so the order flips.', args: [["p","q"],[2,10]], expected: ["q","p"] },
    { scenario: 'Ascending heights', hint: 'Input sorted shortest-first must be fully reversed.', args: [["a","b","c","d"],[1,2,3,4]], expected: ["d","c","b","a"] },
    { scenario: 'Already tallest first', hint: 'Already in order — nothing changes.', args: [["a","b","c","d"],[4,3,2,1]], expected: ["a","b","c","d"] },
    { scenario: 'Multi-digit heights', hint: 'Sorting heights with .sort() and no comparator: "100000" < "9" as strings.', args: [["x","y","z"],[9,100000,10]], expected: ["y","z","x"] },
    { scenario: 'Duplicate names', hint: 'Using names.indexOf(name) to find a height breaks with duplicate names — keep the index link.', args: [["Sam","Ann","Sam","Ann"],[150,160,170,140]], expected: ["Sam","Ann","Sam","Ann"] },
    { scenario: 'Names not sorted separately', hint: 'Sorting names and heights separately loses the link between them — names must follow their own height.', args: [["Zed","Amy","Bob"],[170,160,180]], expected: ["Bob","Zed","Amy"] },
    { scenario: 'Extreme heights', hint: 'Heights span 1..10^5.', args: [["low","high","mid"],[1,100000,50000]], expected: ["high","mid","low"] },
    { scenario: 'Maximum length (n = 1000)', hint: 'Full-size input with distinct heights.', argsGen: '() => { const n = 1000; const h = Array.from({ length: n }, (_, i) => ((i * 337) % n) * 97 + 5); return [h.map((x) => \'p\' + (x % 50)), h]; }', expected: Array.from({ length: 1000 }, (_, k) => 'p' + (((999 - k) * 97 + 5) % 50)) },
  ],

  solution: {
    code: `function sortPeople(names, heights) {
  const idx = names.map((_, i) => i);
  idx.sort((i, j) => heights[j] - heights[i]);  // tallest first (numeric!)
  return idx.map((i) => names[i]);
}`,
    explanation: 'Sorting indices keeps names and heights linked without building objects. The numeric comparator matters: 9 vs 100000 would be misordered by a string sort (last test).',
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['idx', '[0, 1, 2]'],
      ['heights', '[180, 165, 170]'],
      ['sorted idx (height desc)', '[0, 2, 1]'],
      ['names', '["Mary", "Emma", "John"]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'One comparison sort over n indices; the index array and output are O(n).' },
  alternative: {
    title: 'Counting by height (heights ≤ 10^5, distinct)',
    md: 'Store `byHeight[h] = name`, then walk h from 100000 down to 1 collecting names. O(n + H) — linear in theory, but a 100001-slot array for 1000 people is wasteful.',
    code: `function sortPeople(names, heights) {
  const byHeight = new Map();
  heights.forEach((h, i) => byHeight.set(h, names[i]));
  return [...heights].sort((a, b) => b - a).map((h) => byHeight.get(h));
}`,
    complexity: 'O(n log n) time, O(n) space (Map variant)',
  },
  mistakes: [
    'Sorting heights with `.sort()` and no comparator — "100000" < "9" as strings.',
    'Using `names.indexOf(name)` to find a height — breaks with duplicate names and is O(n) per lookup.',
    'Sorting `names` and `heights` separately — the link between them is lost.',
  ],
};
