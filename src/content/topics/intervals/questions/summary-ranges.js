export default {
  id: 'summary-ranges',
  title: 'Summary Ranges',
  difficulty: 'Easy',
  order: 2,
  pattern: 'intervals-merge',
  tags: ['array', 'intervals'],
  source: { platform: 'LeetCode', number: 228, url: 'https://leetcode.com/problems/summary-ranges/' },

  statement: `You are given a **sorted** array of **distinct** integers \`nums\`. Group it into the fewest ranges of consecutive integers that cover exactly the numbers in \`nums\`, and return them in order as strings:

- a range \`[a, b]\` with \`a !== b\` is written \`"a->b"\`;
- a range with a single number \`a\` is written \`"a"\`.`,
  examples: [
    { input: 'nums = [0,1,2,4,5,7]', output: '["0->2","4->5","7"]' },
    { input: 'nums = [0,2,3,4,6,8,9]', output: '["0","2->4","6","8->9"]' },
    { input: 'nums = []', output: '[]' },
  ],
  constraints: ['0 <= nums.length <= 20', '-2^31 <= nums[i] <= 2^31 - 1', 'nums is sorted ascending and all values are unique'],

  think: `- Treat every number \`x\` as a tiny interval \`[x, x]\`. When do two neighbouring "intervals" merge?
- What do you need to remember while scanning: the start of the current run, the end, or both?
- How do you make sure the **last** run is emitted?`,
  patternChallenge: {
    options: ['Hash set of all numbers', 'Sort & merge adjacent intervals (runs)', 'Binary search', 'Prefix sums'],
    answer: 1,
    explanation: 'The array is already sorted, so this is the merge pass: extend the current run while `nums[i] === nums[i-1] + 1`, otherwise close it and start a new one. A hash set is only needed when the input is unsorted.',
  },
  hints: [
    'Keep `start = nums[i]` for the current run and walk `i` forward while the next value is exactly one more.',
    'When the run ends at index `j`, output `start` alone if `nums[j] === start`, otherwise `start + "->" + nums[j]`.',
  ],
  approach: `**Brute force:** for each number, check (with \`includes\`) whether \`x − 1\` is in the array to find run starts, then extend with \`includes(x + 1)\` — O(n²).

**Optimized (merge pass):** sorted input means runs are contiguous in the array. Scan with index \`i\`; remember \`start = nums[i]\`; advance while \`nums[i + 1] === nums[i] + 1\`; emit the run; continue from the next index. Each element is visited once: O(n).`,

  functionName: 'summaryRanges',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {string[]}
 */
function summaryRanges(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two runs and a single number at the end — do not forget to emit the last run.', args: [[0, 1, 2, 4, 5, 7]], expected: ['0->2', '4->5', '7'] },
    { scenario: 'Example 2', hint: 'Starts with a single number; singles are written without an arrow.', args: [[0, 2, 3, 4, 6, 8, 9]], expected: ['0', '2->4', '6', '8->9'] },
    { scenario: 'Example 3', hint: 'Empty input → empty output.', args: [[]], expected: [] },
    { scenario: 'Single element', hint: 'One number becomes the string "5", not the number 5 and not "5->5".', args: [[5]], expected: ['5'] },
    { scenario: 'Two consecutive numbers', hint: 'The smallest possible run: "1->2".', args: [[1, 2]], expected: ['1->2'] },
    { scenario: 'Two non-consecutive numbers', hint: 'Two singles: each needs its own entry.', args: [[1, 3]], expected: ['1', '3'] },
    { scenario: 'One run covers everything', hint: 'The whole array is one run; it is only emitted after the loop finishes.', args: [[-3, -2, -1, 0, 1, 2]], expected: ['-3->2'] },
    { scenario: 'All singles', hint: 'No two numbers are consecutive.', args: [[1, 3, 5, 7, 9]], expected: ['1', '3', '5', '7', '9'] },
    { scenario: 'Run at the end', hint: 'The final run must be emitted after the loop ends.', args: [[0, 5, 6, 7]], expected: ['0', '5->7'] },
    { scenario: 'Negative numbers', hint: 'Negative values format as "-5->-3"; the gap check works the same.', args: [[-5, -4, -3, -1, 1, 2]], expected: ['-5->-3', '-1', '1->2'] },
    { scenario: '32-bit extremes', hint: 'Values reach ±2^31; JS numbers handle `x + 1` exactly here.', args: [[-2147483648, -2147483647, 2147483647]], expected: ['-2147483648->-2147483647', '2147483647'] },
    { scenario: 'Maximum length (n = 20)', hint: 'Alternating runs of two and singles across 20 numbers.', args: [[0, 1, 3, 5, 6, 8, 10, 11, 13, 15, 16, 18, 20, 21, 23, 25, 26, 28, 30, 31]], expected: ['0->1', '3', '5->6', '8', '10->11', '13', '15->16', '18', '20->21', '23', '25->26', '28', '30->31'] },
  ],

  solution: {
    code: `function summaryRanges(nums) {
  const out = [];
  let i = 0;
  while (i < nums.length) {
    const start = nums[i];
    // extend the run while the next number is exactly one more
    while (i + 1 < nums.length && nums[i + 1] === nums[i] + 1) i++;
    const end = nums[i];
    out.push(start === end ? String(start) : start + '->' + end);
    i++;
  }
  return out;
}`,
    explanation: 'The inner loop only moves `i` forward, so the total work across both loops is O(n).',
  },
  dryRun: {
    columns: ['i (run start)', 'start', 'extend to', 'emit'],
    rows: [
      ['0', '0', 'i = 2 (0,1,2)', '"0->2"'],
      ['3', '4', 'i = 4 (4,5)', '"4->5"'],
      ['5', '7', 'i = 5', '"7"'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) extra', explanation: 'One pass; the output list is not counted as extra space.' },
  alternative: {
    title: 'For-loop with run start index',
    md: 'Loop over every index and close the run when `i === n - 1` or `nums[i + 1] !== nums[i] + 1`. Same complexity; some find it easier to avoid the nested while.',
    code: `function summaryRanges(nums) {
  const out = [];
  let runStart = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i === nums.length - 1 || nums[i + 1] !== nums[i] + 1) {
      out.push(runStart === i ? String(nums[i]) : nums[runStart] + '->' + nums[i]);
      runStart = i + 1;
    }
  }
  return out;
}`,
    complexity: 'O(n) time, O(1) extra space',
  },
  mistakes: [
    'Forgetting to emit the last run after the loop ends.',
    'Checking `nums[i + 1] - nums[i] === 1` in a language with overflow — fine in JS, but `nums[i] + 1` reads more clearly.',
    'Returning numbers instead of strings for single-element runs.',
  ],
};
