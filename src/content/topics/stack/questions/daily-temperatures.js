export default {
  id: 'daily-temperatures',
  title: 'Daily Temperatures',
  difficulty: 'Medium',
  order: 2,
  pattern: 'monotonic-stack-next-greater',
  tags: ['array', 'monotonic stack'],
  source: { platform: 'LeetCode', number: 739, url: 'https://leetcode.com/problems/daily-temperatures/' },

  statement: `\`temperatures[i]\` is the temperature on day \`i\`. For every day, return how many days you have to wait until a **strictly warmer** day. If no warmer day comes, the answer for that day is \`0\`.`,
  examples: [
    { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
    { input: 'temperatures = [30,40,50,60]', output: '[1,1,1,0]' },
    { input: 'temperatures = [30,60,90]', output: '[1,1,0]' },
  ],
  constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],

  think: `- This is "next greater element", but the answer is a **distance**. What should the stack store — temperatures or indices?
- When a warm day arrives, which waiting days does it answer?`,
  patternChallenge: {
    options: ['Sliding window', 'Binary search', 'Monotonic stack (next greater)', 'Prefix maximum'],
    answer: 2,
    explanation: '"Wait until a warmer day" = distance to the next strictly greater element. A decreasing stack of waiting indices solves all days in O(n). A prefix maximum only tells you IF a warmer day exists, not when.',
  },
  hints: [
    'Keep a stack of indices of days still waiting for a warmer day; their temperatures are non-increasing.',
    'For day i, while temperatures[top] < temperatures[i], pop top and set answer[top] = i − top. Then push i.',
  ],
  approach: `**Brute force:** for each day scan forward → O(n²) (10^10 for n = 10^5 — too slow).

**Monotonic stack (O(n)):** stack holds indices of unanswered days, temperatures non-increasing from bottom to top. Day i answers every waiting day that is colder: pop and write the distance. Then day i waits too. Leftover days keep 0.`,

  functionName: 'dailyTemperatures',
  paramNames: ['temperatures'],
  starterCode: `/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
function dailyTemperatures(temperatures) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Day 2 (75) waits 4 days for 76 — pop every colder waiting day when a warmer one arrives.', args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
    { scenario: 'Example 2', hint: 'Strictly increasing: every day is answered by the next one; the last day gets 0.', args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
    { scenario: 'Example 3', hint: 'Short increasing run.', args: [[30, 60, 90]], expected: [1, 1, 0] },
    { scenario: 'Single day', hint: 'Smallest input: no future day exists, so the answer is [0].', args: [[50]], expected: [0] },
    { scenario: 'Two days, warmer second', hint: 'The pair is the whole input; the answer must be a distance (index difference), not a temperature.', args: [[30, 100]], expected: [1, 0] },
    { scenario: 'Strictly decreasing', hint: 'No day ever gets warmer — every answer stays 0.', args: [[90, 80, 70]], expected: [0, 0, 0] },
    { scenario: 'Equal is not warmer', hint: 'Using <= in the pop condition treats 70 → 70 as warmer. Only strictly greater counts.', args: [[70, 70, 71]], expected: [2, 1, 0] },
    { scenario: 'All equal', hint: 'Equal temperatures never resolve each other — all answers are 0.', args: [[55, 55, 55, 55]], expected: [0, 0, 0, 0] },
    { scenario: 'Bounds 30 and 100', hint: 'Minimum and maximum temperatures mixed together.', args: [[100, 30, 100, 30, 30, 100]], expected: [0, 1, 0, 2, 1, 0] },
    { scenario: 'Mixed pattern', hint: 'A random-looking sequence with resolutions at several distances.', args: [[55, 38, 53, 81, 61, 93, 97, 32, 43, 78]], expected: [3, 1, 1, 2, 1, 1, 0, 1, 1, 0] },
    { scenario: 'Valley then peak', hint: 'One late warm day resolves many waiting days at once.', args: [[80, 70, 60, 50, 40, 90]], expected: [5, 4, 3, 2, 1, 0] },
    { scenario: 'All equal (n = 10^5)', hint: 'Nested loops scan to the end for every day here — ~5·10^9 steps. A monotonic stack of indices is O(n).', argsGen: '() => [new Array(100000).fill(70)]', expected: new Array(100000).fill(0), timeLimitMs: 1000 },
    { scenario: 'Plateau then warm day (n = 10^5)', hint: 'Every day waits until the very last day; an O(n²) forward scan is far too slow.', argsGen: '() => { const a = new Array(100000).fill(99); a[99999] = 100; return [a]; }', expected: Array.from({ length: 100000 }, (_, i) => (i < 99999 ? 99999 - i : 0)), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const waiting = [];                       // indices, temperatures non-increasing
  for (let i = 0; i < n; i++) {
    while (waiting.length && temperatures[waiting[waiting.length - 1]] < temperatures[i]) {
      const j = waiting.pop();
      answer[j] = i - j;                    // day i is j's first warmer day
    }
    waiting.push(i);
  }
  return answer;
}`,
  },
  dryRun: {
    columns: ['i', 'temp', 'pops (index: wait)', 'stack (temps)'],
    rows: [
      ['0', '73', '—', '[73]'],
      ['1', '74', '0: 1', '[74]'],
      ['2', '75', '1: 1', '[75]'],
      ['3', '71', '—', '[75,71]'],
      ['4', '69', '—', '[75,71,69]'],
      ['5', '72', '4: 1, 3: 2', '[75,72]'],
      ['6', '76', '5: 1, 2: 4', '[76]'],
      ['7', '73', '—', '[76,73]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each index pushed once and popped at most once.' },
  alternative: {
    title: 'Right-to-left with jumps',
    md: 'Scan from the right; for day i, start at j = i + 1 and jump j += answer[j] until temperatures[j] > temperatures[i] (or answer[j] is 0, meaning nothing warmer). Also amortized O(n) and O(1) extra space besides the output.',
    complexity: 'O(n) time, O(1) extra space',
  },
  mistakes: [
    'Storing temperatures instead of indices — the distance cannot be computed.',
    'Using <= in the while condition — equal temperatures are not warmer.',
    'Nested loops (O(n²)) timing out on 10^5 days.',
  ],
};
