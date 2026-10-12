export default {
  id: 'boats-to-save-people',
  title: 'Boats to Save People',
  difficulty: 'Medium',
  order: 4,
  pattern: 'two-pointers-opposite',
  tags: ['array', 'two pointers', 'greedy', 'sorting'],
  source: { platform: 'LeetCode', number: 881, url: 'https://leetcode.com/problems/boats-to-save-people/' },

  statement: `\`people[i]\` is the weight of person \`i\`. Every boat can carry **at most two** people at once, and their total weight must be at most \`limit\`. Nobody is heavier than \`limit\`.

Return the **minimum number of boats** needed to carry everyone.`,
  examples: [
    { input: 'people = [1,2], limit = 3', output: '1', explanation: '1 + 2 ≤ 3.' },
    { input: 'people = [3,2,2,1], limit = 3', output: '3', explanation: '(1, 2), (2), (3).' },
    { input: 'people = [3,5,3,4], limit = 5', output: '4', explanation: 'No two people fit together.' },
  ],
  constraints: ['1 <= people.length <= 5 * 10^4', '1 <= people[i] <= limit <= 3 * 10^4'],

  think: `- Consider the heaviest person. Who is their best possible partner?
- If the heaviest cannot share a boat with the lightest, can they share with anyone?
- If they *can* share with the lightest, is it ever worse to pair them than to save the lightest person for someone else?`,
  patternChallenge: {
    options: ['Sort + Two Pointers (heaviest with lightest)', 'Dynamic Programming over subsets', 'Sliding Window', 'Hash Map of weights'],
    answer: 0,
    explanation: 'At most two per boat → a pairing problem. After sorting, the heaviest person either fits with the lightest or with nobody. Opposite-end pointers decide one boat per step. Subset DP is exponential.',
  },
  hints: [
    'Sort the weights. Put `l` on the lightest and `r` on the heaviest.',
    'Each step launches one boat carrying `people[r]`; if `people[l] + people[r] <= limit`, the lightest goes too (`l++`). Always `r--`.',
  ],
  approach: `**Greedy + two pointers:**
1. Sort ascending.
2. While \`l <= r\`: one boat takes the heaviest (\`r--\`). If the lightest also fits (\`people[l] + people[r] <= limit\`), they ride together (\`l++\`).
3. Count boats.

**Why the greedy is optimal (exchange argument):**
- If the heaviest can't pair with the lightest, they can't pair with anyone → a solo boat is forced.
- If they can, take any optimal plan. If the heaviest rides with someone \`x\` instead of the lightest \`y\`, swap \`x\` and \`y\`: \`y ≤ x\`, so both boats still fit. So some optimal plan pairs heaviest with lightest, and we can commit to it.`,

  functionName: 'numRescueBoats',
  paramNames: ['people', 'limit'],
  starterCode: `/**
 * @param {number[]} people
 * @param {number} limit
 * @return {number}
 */
function numRescueBoats(people, limit) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Both people fit in one boat: 1 + 2 ≤ 3.', args: [[1, 2], 3], expected: 1 },
    { scenario: 'Example 2', hint: 'Pair the lightest with the heaviest when they fit; otherwise the heaviest goes alone.', args: [[3, 2, 2, 1], 3], expected: 3 },
    { scenario: 'Example 3', hint: 'No two people fit together, so everyone needs their own boat.', args: [[3, 5, 3, 4], 5], expected: 4 },
    { scenario: 'Single person', hint: 'The smallest input: one person, one boat. With `while (l < r)` this person is never counted.', args: [[5], 5], expected: 1 },
    { scenario: 'Odd count, middle left alone', hint: 'After pairing, one person remains with l === r. Loop with `l <= r` so they get a boat.', args: [[1, 2, 2], 3], expected: 2 },
    { scenario: 'All equal, pairs fit', hint: 'Four people of weight 1 with limit 2: two boats of two.', args: [[1, 1, 1, 1], 2], expected: 2 },
    { scenario: 'Everyone weighs limit', hint: 'Weights equal to the limit can never share a boat.', args: [[4, 4, 4], 4], expected: 3 },
    { scenario: 'Lightest-first pairing fails', hint: 'Pairing the two lightest (1 + 2) leaves 3 and 4 unable to pair. Pair heaviest with lightest instead: (4, 1), (3, 2).', args: [[1, 2, 3, 4], 5], expected: 2 },
    { scenario: 'Default sort trap', hint: 'Sorting without a comparator gives [10, 2, 3, 9] (string order) and pairs the wrong people.', args: [[9, 10, 2, 3], 12], expected: 2 },
    { scenario: 'Mixed weights', hint: 'A shuffled array with many possible pairings. Sort, then greedily pair heaviest with lightest.', args: [[2, 49, 10, 7, 11, 41, 47, 2, 22, 6, 13, 12, 33, 18, 10, 26, 2, 6, 50, 10], 50], expected: 11 },
    { scenario: 'Some heavy people alone', hint: '40 and 30 cannot pair with anyone heavier than 10 and 20 respectively — count their boats too.', args: [[21, 40, 16, 24, 30], 50], expected: 3 },
    { scenario: 'Large input (n = 5·10^4)', hint: 'Sort once (O(n log n)) and sweep two pointers. Scanning for a partner for each person is O(n²).', argsGen: '() => { let s = 17; const p = Array.from({ length: 50000 }, () => { s = (s * 48271) % 2147483647; return (s % 30000) + 1; }); return [p, 30000]; }', expected: 25089, timeLimitMs: 1000 },
    { scenario: 'Large, all ones', hint: '50 000 people of weight 1 with limit 1: nobody can pair, so 50 000 boats.', argsGen: '() => [new Array(50000).fill(1), 1]', expected: 50000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numRescueBoats(people, limit) {
  const w = [...people].sort((a, b) => a - b);
  let l = 0, r = w.length - 1, boats = 0;
  while (l <= r) {                       // l === r: one person left, needs a boat
    if (w[l] + w[r] <= limit) l++;       // lightest rides along
    r--;                                 // heaviest always leaves
    boats++;
  }
  return boats;
}`,
    explanation: '`l <= r` (not `<`) so that a single remaining person still gets counted. When `l === r` the "pair" check may add them twice to the sum, but either branch sends exactly one boat, which is right.',
  },
  dryRun: {
    columns: ['sorted', 'l', 'r', 'w[l] + w[r]', 'boat'],
    rows: [
      ['[1,2,2,3]', '0', '3', '1 + 3 = 4 > 3', '(3) alone'],
      ['', '0', '2', '1 + 2 = 3', '(1, 2)'],
      ['', '1', '1', 'single', '(2)'],
    ],
    note: '3 boats.',
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the pointer pass is O(n). The copy keeps the input unchanged (sort in place for O(1) extra).' },
  alternative: {
    title: 'Counting sort on weights',
    md: 'Weights are ≤ 3·10^4, so bucket counts replace the comparison sort and the two pointers walk over weight values. O(n + limit).',
    complexity: 'O(n + limit) time, O(limit) space',
  },
  mistakes: [
    '`while (l < r)` and forgetting the last person when `l === r`.',
    'Pairing the two lightest people first — it can waste capacity the heaviest needed.',
    'Default `sort()` — weights like 10 and 9 sort as strings.',
  ],
};
