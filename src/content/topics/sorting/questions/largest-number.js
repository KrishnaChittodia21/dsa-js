export default {
  id: 'largest-number',
  title: 'Largest Number',
  difficulty: 'Medium',
  order: 3,
  pattern: 'sorting-custom-comparator',
  tags: ['array', 'string', 'sorting', 'greedy', 'comparator'],
  source: { platform: 'LeetCode', number: 179, url: 'https://leetcode.com/problems/largest-number/' },

  statement: `Given a list of non-negative integers \`nums\`, arrange them so that, written one after another, they form the **largest possible number**.

The result may be huge, so return it as a **string** (without unnecessary leading zeros).`,
  examples: [
    { input: 'nums = [10,2]', output: '"210"' },
    { input: 'nums = [3,30,34,5,9]', output: '"9534330"' },
    { input: 'nums = [0,0]', output: '"0"', explanation: 'Not "00".' },
  ],
  constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 10^9'],

  think: `- Sorting numerically descending gives [30, 3] → "303". Is that the best?
- Sorting as strings descending gives ["9","5","34","30","3"]. Is "30" before "3" right?
- For just **two** numbers a and b, how do you decide which goes first?`,
  patternChallenge: {
    options: ['Numeric sort descending', 'Custom comparator: a before b iff a+b > b+a', 'Dynamic Programming over subsets', 'Backtracking all permutations'],
    answer: 1,
    explanation: 'The best order is defined by comparing pairs: put a first when the concatenation ab beats ba. That relation is transitive, so a comparator sort gives the optimum. Numeric order fails on [3, 30]; permutations are n! and DP is unnecessary.',
  },
  hints: [
    'Convert to strings. For two strings a and b, a should go first exactly when `a + b > b + a`.',
    'After sorting, if the first string is "0", every number is 0 — return "0".',
  ],
  approach: `**Brute force:** try every permutation and keep the largest concatenation — O(n! · n). Impossible beyond ~10 numbers.

**Optimized (pairwise comparator):**
1. \`s = nums.map(String)\`.
2. Sort with a comparator: if \`a + b > b + a\` return −1, if smaller return 1, else 0. \`ab\` and \`ba\` have equal length, so lexicographic comparison equals numeric comparison.
3. Join. If the result starts with "0", return "0".

**Why it is correct:** the relation is transitive (it is equivalent to comparing each string repeated infinitely), and by an exchange argument any adjacent pair in the wrong order can be swapped to make the number bigger — so the sorted order is optimal.`,

  functionName: 'largestNumber',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {string}
 */
function largestNumber(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: "2" + "10" beats "10" + "2".', args: [[10,2]], expected: "210" },
    { scenario: 'Example 2', hint: 'From the statement: the order is decided by comparing concatenations.', args: [[3,30,34,5,9]], expected: "9534330" },
    { scenario: 'Example 3', hint: 'All zeros must give "0", not "00".', args: [[0,0]], expected: "0" },
    { scenario: 'Single number', hint: 'One element — return it as a string.', args: [[1]], expected: "1" },
    { scenario: 'Single zero', hint: 'A lone 0 is "0".', args: [[0]], expected: "0" },
    { scenario: 'Prefix trap', hint: 'Sorting numerically or as strings descending puts 30 before 3 ("303"); compare a+b with b+a instead ("330").', args: [[3,30]], expected: "330" },
    { scenario: 'Longer shared prefix', hint: 'One number is a prefix of the other — only the concatenation comparison decides correctly.', args: [[432,43243]], expected: "43243432" },
    { scenario: 'Short number should go first', hint: '"12" + "121" = "12121" beats "12112".', args: [[121,12]], expected: "12121" },
    { scenario: 'Huge result', hint: 'Converting with Number(...) loses digits beyond 2^53 — keep the result as a string.', args: [[1000000000,999999999,0]], expected: "99999999910000000000" },
    { scenario: 'Duplicates', hint: 'Equal numbers are interchangeable; the comparator must return 0 for them.', args: [[8308,8308,830]], expected: "83088308830" },
    { scenario: 'Many zeros', hint: 'Every element is 0 — still "0", not "0000".', args: [[0,0,0,0]], expected: "0" },
    { scenario: 'Zeros with a non-zero', hint: 'Leading-zero stripping must only trigger when the first piece is 0; "900" keeps its zeros.', args: [[0,9,0]], expected: "900" },
    { scenario: 'All single digits', hint: 'Single digits simply go in descending order.', args: [[1,2,3,4,5,6,7,8,9,0]], expected: "9876543210" },
    { scenario: 'Maximum length (n = 100)', hint: 'A full-size input with numbers of many lengths — the comparator must be a consistent total order.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100 }, (_, i) => r() % [10, 100, 1000, 100000, 1000000001][i % 5])]; }', expected: "99999998998979528974949488541389465338029453691914908948887213142864849550939848281817660422812808009879779580786557687554875508677072672454723777157723717089469666666628765880636166487515645555555325525145098373565057250196574847804475798152474524488344342763423574199465284140386382419936311063735928354367574347925148343327427934272682622580425752252462839122423524415222217203182150145601100" },
  ],

  solution: {
    code: `function largestNumber(nums) {
  const s = nums.map(String);
  s.sort((a, b) => {
    const ab = a + b;
    const ba = b + a;
    if (ab > ba) return -1;   // a first
    if (ab < ba) return 1;    // b first
    return 0;
  });
  return s[0] === '0' ? '0' : s.join('');
}`,
    explanation: 'Equal-length strings of digits compare lexicographically exactly like the numbers they represent, so no BigInt is needed.',
  },
  dryRun: {
    columns: ['pair (a, b)', 'a+b', 'b+a', 'order'],
    rows: [
      ['(3, 30)', '330', '303', '3 before 30'],
      ['(34, 3)', '343', '334', '34 before 3'],
      ['(9, 5)', '95', '59', '9 before 5'],
      ['sorted', '', '', '9, 5, 34, 3, 30 → "9534330"'],
    ],
  },
  complexity: { time: 'O(n log n · L)', space: 'O(n · L)', explanation: 'L ≤ 10 is the digit length; each comparison builds two strings of length ≤ 2L.' },
  alternative: {
    title: 'Precomputed keys',
    md: 'Comparators run O(n log n) times; building `a + b` each time is fine here (L ≤ 10). For long strings, compare character by character on the virtual concatenations to avoid allocations.',
    complexity: 'Same asymptotics, fewer allocations',
  },
  mistakes: [
    'Sorting numerically descending: [3, 30] → "303" instead of "330".',
    'Sorting as strings descending: "30" > "3" lexicographically, again "303".',
    'Returning "00" for [0, 0].',
    'Converting the result with Number(...) — it exceeds 2^53 and loses digits.',
  ],
};
