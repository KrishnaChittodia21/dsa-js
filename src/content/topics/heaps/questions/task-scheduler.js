export default {
  id: 'task-scheduler',
  title: 'Task Scheduler',
  difficulty: 'Medium',
  order: 6,
  pattern: 'heap-greedy-scheduling',
  tags: ['heap', 'greedy', 'counting'],
  source: { platform: 'LeetCode', number: 621, url: 'https://leetcode.com/problems/task-scheduler/' },

  statement: `A CPU must run a list of \`tasks\`, each labelled with an uppercase letter. Each time unit it either runs one task or stays **idle**. Two runs of the **same** task must be separated by at least \`n\` time units. Tasks may run in any order.

Return the **minimum number of time units** needed to finish all tasks.`,
  examples: [
    { input: 'tasks = ["A","A","A","B","B","B"], n = 2', output: '8', explanation: 'A B idle A B idle A B.' },
    { input: 'tasks = ["A","C","A","B","D","B"], n = 1', output: '6', explanation: 'A B A B C D — no idling needed.' },
    { input: 'tasks = ["A","A","A","B","B","B"], n = 3', output: '10', explanation: 'A B _ _ A B _ _ A B.' },
  ],
  constraints: ['1 <= tasks.length <= 10^4', 'tasks[i] is an uppercase letter', '0 <= n <= 100'],

  think: `- Which task is the bottleneck — the most frequent one, or the rarest?
- Think in "rounds" of \`n + 1\` slots: in each round every task can run at most once. Which tasks should fill a round?
- Can you count the answer directly without simulating?`,
  patternChallenge: {
    options: ['Heap — Greedy Simulation & Scheduling', 'Sliding Window', 'Heap — K-way Merge', 'Binary Search on the answer'],
    answer: 0,
    explanation: 'Each round greedily runs the most frequent remaining tasks, which a max-heap of counts provides; the counting formula is the closed form of the same greedy. No windows or merges here.',
  },
  hints: [
    'Max-heap of task counts. Each round of n + 1 slots: pop up to n + 1 tasks, decrement them, push back the ones still > 0.',
    'A round costs n + 1 time units unless the heap became empty — then it costs only the number of tasks run. (Formula: max(tasks.length, (maxFreq − 1)(n + 1) + numberOfTasksWithMaxFreq).)',
  ],
  approach: `**Greedy with a heap:** the most frequent task forces the most idle time, so schedule the most frequent tasks first.
- Count tasks; push the counts into a max-heap.
- Repeat rounds: pop up to \`n + 1\` counts (distinct tasks — none repeats within a round, so the cooldown is respected), decrement each, keep the non-zero ones and push them back after the round.
- Add \`n + 1\` to the time, or only the number of tasks run in the last round (no trailing idles).

**Counting formula:** lay out the most frequent task \`A\` with \`maxFreq − 1\` gaps of size \`n\` after each copy: \`(maxFreq − 1)(n + 1)\` slots, plus one final slot for every task tied at \`maxFreq\`. Other tasks fill idle slots; if there are more tasks than slots, no idle is needed and the answer is \`tasks.length\`.`,

  functionName: 'leastInterval',
  paramNames: ['tasks', 'n'],
  starterCode: `/**
 * @param {character[]} tasks
 * @param {number} n
 * @return {number}
 */
function leastInterval(tasks, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: A B idle A B idle A B — two idles per gap.', args: [['A', 'A', 'A', 'B', 'B', 'B'], 2], expected: 8 },
    { scenario: 'Example 2', hint: 'Enough distinct tasks to fill every gap: no idle needed.', args: [['A', 'C', 'A', 'B', 'D', 'B'], 1], expected: 6 },
    { scenario: 'Example 3', hint: 'A longer cooldown forces more idles.', args: [['A', 'A', 'A', 'B', 'B', 'B'], 3], expected: 10 },
    { scenario: 'Single task', hint: 'One task finishes at time 1 regardless of n.', args: [['A'], 5], expected: 1 },
    { scenario: 'n = 0', hint: 'No cooldown: the answer is simply the number of tasks.', args: [['A', 'A', 'A', 'A'], 0], expected: 4 },
    { scenario: 'One task type repeated', hint: 'Only A: (count − 1) gaps of n idles each, plus the last A.', args: [['A', 'A', 'A'], 2], expected: 7 },
    { scenario: 'No trailing idles', hint: 'The last round is not full; adding n + 1 for it counts idles after the final task.', args: [['A', 'A', 'A', 'B', 'C'], 3], expected: 9 },
    { scenario: 'Ties at max frequency', hint: 'Every task tied at the max adds one slot at the very end.', args: [['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'], 2], expected: 9 },
    { scenario: 'One dominant task', hint: 'A appears 6 times; the others fill some gaps but idles remain.', args: [['A', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], 2], expected: 16 },
    { scenario: 'No repeat within a round', hint: 'Pushing a task back during the same round could run it twice inside one cooldown window.', args: [['A', 'A', 'B', 'B'], 2], expected: 5 },
    { scenario: 'All 26 letters', hint: 'Many distinct tasks with n large: the formula bound vs task count.', args: [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'Z'], 25], expected: 28 },
    { scenario: 'Maximum cooldown', hint: 'n = 100 with two copies of A.', args: [['A', 'A', 'B'], 100], expected: 102 },
    { scenario: 'Large input (10^4 tasks)', hint: '10^4 tasks with n = 100: simulating one time slot at a time is fine, but think in rounds or use the counting formula.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => String.fromCharCode(65 + (i % 7 === 0 ? 0 : i % 26))), 100]', expected: 177559 },
  ],

  solution: {
    code: `function leastInterval(tasks, n) {
  const count = new Map();
  for (const t of tasks) count.set(t, (count.get(t) ?? 0) + 1);
  const heap = new MaxHeap();
  for (const c of count.values()) heap.push(c);

  let time = 0;
  while (!heap.isEmpty()) {
    const leftovers = [];
    let ran = 0;
    // one round: up to n + 1 DIFFERENT tasks, most frequent first
    while (ran < n + 1 && !heap.isEmpty()) {
      const c = heap.pop() - 1;
      if (c > 0) leftovers.push(c);
      ran++;
    }
    for (const c of leftovers) heap.push(c);
    time += heap.isEmpty() ? ran : n + 1;   // last round has no trailing idle
  }
  return time;
}`,
  },
  dryRun: {
    columns: ['round', 'heap before', 'ran', 'leftovers', 'time'],
    rows: [['1', '{3, 3}', 'A, B', '{2, 2}', '3 (A B idle)'], ['2', '{2, 2}', 'A, B', '{1, 1}', '6'], ['3', '{1, 1}', 'A, B', '{}', '8 (no idle at the end)']],
  },
  complexity: { time: 'O(T log 26) ≈ O(T)', space: 'O(1)', explanation: 'At most 26 distinct counts live in the heap; every run of a task is one pop. T = tasks.length.' },
  alternative: {
    title: 'Counting formula — O(T)',
    code: `function leastInterval(tasks, n) {
  const freq = new Array(26).fill(0);
  for (const t of tasks) freq[t.charCodeAt(0) - 65]++;
  const maxF = Math.max(...freq);
  const numMax = freq.filter((f) => f === maxF).length;
  return Math.max(tasks.length, (maxF - 1) * (n + 1) + numMax);
}`,
    md: 'The closed form of the same greedy argument.',
    complexity: 'O(T) time, O(1) space',
  },
  mistakes: [
    'Adding n + 1 for the final round even when it is not full (counts trailing idles).',
    'Pushing a task back into the heap within the same round (it could run twice in one round and violate the cooldown).',
    'Forgetting that n = 0 means no idling ever.',
  ],
};
