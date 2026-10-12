export default {
  id: 'course-schedule-iii',
  title: 'Course Schedule III',
  difficulty: 'Hard',
  order: 3,
  pattern: 'greedy-heap-regret',
  tags: ['array', 'greedy', 'heap', 'sorting'],
  source: { platform: 'LeetCode', number: 630, url: 'https://leetcode.com/problems/course-schedule-iii/' },

  statement: `There are \`n\` online courses. \`courses[i] = [duration, lastDay]\`: course \`i\` takes \`duration\` consecutive days and must be **finished on or before** day \`lastDay\`. You start on day \`1\` and can take only one course at a time.

Return the **maximum number of courses** you can complete.`,
  examples: [
    { input: 'courses = [[100,200],[200,1300],[1000,1250],[2000,3200]]', output: '3', explanation: 'Take 100 (ends day 100), 1000 (ends 1100), 200 (ends 1300). The 2000-day course would end at 3300 > 3200.' },
    { input: 'courses = [[1,2]]', output: '1' },
    { input: 'courses = [[3,2],[4,3]]', output: '0' },
  ],
  constraints: ['1 <= courses.length <= 10^4', '1 <= duration, lastDay <= 10^4'],

  think: `- If you have already chosen a SET of courses, in which order should you take them to meet all deadlines?
- Going through courses in that order, what should you do when a new course would overflow its deadline?
- Which previously chosen course is the best one to drop?`,
  patternChallenge: {
    options: ['0/1 Knapsack DP', 'Greedy — Intervals by Earliest End', 'Greedy — Heap with Regret', 'Topological Sort'],
    answer: 2,
    explanation: 'Sort by deadline, take courses greedily, and when the time overflows swap out the longest course so far (max-heap). It is related to interval greedy, but the swap-with-heap is the key idea. Knapsack DP works in O(n·maxDay) but is much slower. (The name "Course Schedule" misleads — no prerequisites here.)',
  },
  hints: [
    'Any feasible set of courses can be taken in order of increasing lastDay. So sort by lastDay.',
    'Keep a max-heap of chosen durations and the total time. Add each course; if time > lastDay, remove the longest duration from the heap.',
  ],
  approach: `**Fact 1:** a set of courses is feasible iff taking them in increasing \`lastDay\` order meets every deadline (exchange argument: swapping two adjacent out-of-order courses never makes a deadline fail).

**Greedy:** sort by \`lastDay\`. Maintain \`time\` and a max-heap of durations taken.
- Add the course: push duration, \`time += duration\`.
- If \`time > lastDay\`, pop the largest duration and subtract it.

**Why:** after processing each prefix of courses, the heap holds the **maximum number** of courses possible for that prefix, with the **minimum total time** among such sets. Dropping the longest keeps the count and minimises time — which can only help future courses (their deadlines are later).`,

  functionName: 'scheduleCourse',
  paramNames: ['courses'],
  starterCode: `/**
 * @param {number[][]} courses
 * @return {number}
 */
function scheduleCourse(courses) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Taking 100, 1000, 200 in deadline order fits; the 2000-day course would finish at 3300.', args: [[[100, 200], [200, 1300], [1000, 1250], [2000, 3200]]], expected: 3 },
    { scenario: 'Example 2', hint: 'A single course that fits its deadline.', args: [[[1, 2]]], expected: 1 },
    { scenario: 'Example 3', hint: 'Every course is longer than its own deadline — the answer is 0, so the heap must end empty.', args: [[[3, 2], [4, 3]]], expected: 0 },
    { scenario: 'Duration equals deadline', hint: 'Finishing exactly on lastDay is allowed (use > not >= when checking overflow).', args: [[[5, 5]]], expected: 1 },
    { scenario: 'Swap instead of skip', hint: 'If you skip a course that overflows, you keep the 5-day course and get 1; evicting the longest course lets 4 + 2 fit for 2.', args: [[[5, 5], [4, 6], [2, 6]]], expected: 2 },
    { scenario: 'Shortest-first greedy fails', hint: 'Sorting by duration takes [1,4] first and then [3,3] no longer fits; deadline order fits both.', args: [[[3, 3], [1, 4]]], expected: 2 },
    { scenario: 'Min-heap evicts wrong course', hint: 'On overflow you must drop the LONGEST course taken; dropping the shortest keeps the time high and blocks later courses.', args: [[[2, 3], [10, 12], [1, 12], [1, 12]]], expected: 3 },
    { scenario: 'Identical courses', hint: 'Three [2,2] courses: only one can finish by day 2.', args: [[[2, 2], [2, 2], [2, 2]]], expected: 1 },
    { scenario: 'All courses fit', hint: 'Unit courses with deadlines 1..4 all fit back to back.', args: [[[1, 1], [1, 2], [1, 3], [1, 4]]], expected: 4 },
    { scenario: 'Unsorted mixed input', hint: 'Sort by lastDay first; the input order is arbitrary.', args: [[[7, 17], [3, 12], [10, 20], [9, 10], [5, 20], [10, 19], [4, 18]]], expected: 4 },
    { scenario: 'Maximum values', hint: 'A 10^4-day course with a 10^4 deadline fits on its own but blocks anything else.', args: [[[10000, 10000], [1, 10000], [9999, 10000]]], expected: 2 },
    { scenario: 'Late long course replaces early', hint: 'The heap should swap a long early course for shorter later ones when that frees time.', args: [[[6, 6], [2, 7], [2, 8], [2, 9]]], expected: 3 },
    { scenario: 'Large input (n = 10^4)', hint: 'Trying subsets is hopeless; sort by deadline and keep a max-heap of durations for O(n log n).', argsGen: '() => { let x = 12345; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 10000 }, () => [1 + r() % 1000, 1 + r() % 10000])]; }', expected: 469, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function scheduleCourse(courses) {
  const sorted = [...courses].sort((a, b) => a[1] - b[1]); // earliest deadline first
  const taken = new MaxHeap();                              // durations of chosen courses
  let time = 0;
  for (const [duration, lastDay] of sorted) {
    taken.push(duration);
    time += duration;
    if (time > lastDay) {
      time -= taken.pop(); // drop the longest course: same count, least time used
    }
  }
  return taken.size();
}`,
  },
  dryRun: {
    columns: ['course (d, last)', 'time after add', 'overflow?', 'drop', 'heap'],
    rows: [
      ['[100, 200]', '100', 'no', '', '[100]'],
      ['[1000, 1250]', '1100', 'no', '', '[1000, 100]'],
      ['[200, 1300]', '1300', 'no', '', '[1000, 200, 100]'],
      ['[2000, 3200]', '3300', 'yes', '2000', '[1000, 200, 100]'],
    ],
    note: 'Answer = heap size = 3.',
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sort plus one push and at most one pop per course.' },
  alternative: {
    title: 'Knapsack-style DP over days',
    md: '`dp[t]` = max courses finishing exactly by total time t, processing courses by deadline; for t from lastDay down to duration: `dp[t] = max(dp[t], dp[t − duration] + 1)`. Correct but O(n · maxDay).',
    code: `function scheduleCourse(courses) {
  const sorted = [...courses].sort((a, b) => a[1] - b[1]);
  const maxDay = sorted.length ? sorted[sorted.length - 1][1] : 0;
  const dp = new Array(maxDay + 1).fill(0);
  for (const [d, last] of sorted) {
    for (let t = last; t >= d; t--) dp[t] = Math.max(dp[t], dp[t - d] + 1);
  }
  return Math.max(0, ...dp);
}`,
    complexity: 'O(n · maxDay) time, O(maxDay) space',
  },
  mistakes: [
    'Sorting by duration instead of deadline.',
    'Skipping a course that overflows instead of swapping it with the longest one (misses better sets).',
    'Using a min-heap — you must evict the LONGEST course.',
  ],
};
