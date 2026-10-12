export default {
  id: 'ipo',
  title: 'IPO',
  difficulty: 'Hard',
  order: 3,
  pattern: 'heap-greedy-scheduling',
  tags: ['heap', 'greedy', 'sorting'],
  source: { platform: 'LeetCode', number: 502, url: 'https://leetcode.com/problems/ipo/' },

  statement: `You start with capital \`w\` and may complete **at most \`k\`** distinct projects. Project \`i\` requires capital \`capital[i]\` to start (it is not spent) and adds \`profits[i]\` to your capital when finished.

Choose projects one after another to **maximise your final capital**, and return it.`,
  examples: [
    { input: 'k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]', output: '4', explanation: 'Only project 0 is affordable → w = 1. Now projects 1 and 2 are affordable; take project 2 → w = 4.' },
    { input: 'k = 3, w = 0, profits = [1,2,3], capital = [0,1,2]', output: '6' },
  ],
  constraints: ['1 <= k <= 10^5', '0 <= w <= 10^9', '1 <= n <= 10^5', '0 <= profits[i] <= 10^4', '0 <= capital[i] <= 10^9'],

  think: `- Among the projects you can afford right now, which one should you take? Can taking it ever hurt later?
- As your capital grows, more projects become affordable. How do you add them without rescanning everything?
- Which two structures play the roles "unlock" and "choose"?`,
  patternChallenge: {
    options: ['Dynamic Programming (0/1 knapsack)', 'Heap — Greedy (sort to unlock + max-heap to choose)', 'Binary Search', 'Heap — K-way Merge'],
    answer: 1,
    explanation: 'Capital only grows, so the most profitable affordable project is always a safe greedy choice. Sorting by capital unlocks projects in order; a max-heap of unlocked profits chooses. Knapsack DP would be far too slow and is unnecessary because nothing is ever "spent".',
  },
  hints: [
    'Sort project indices by required capital. Keep a pointer to the first project you cannot afford yet.',
    'Repeat k times: move the pointer forward pushing profits of newly affordable projects into a max-heap; if the heap is empty stop; otherwise add heap.pop() to w.',
  ],
  approach: `**Brute force:** k rounds, each scanning all n projects for the best affordable unused one → O(k·n) = 10¹⁰.

**Greedy + sort + heap (O(n log n + k log n)):**
1. Pair projects as \`[capital, profit]\` and sort by capital.
2. \`i = 0\`, max-heap \`avail\` of profits.
3. Repeat up to k times: while \`i < n\` and \`projects[i].capital <= w\`, push its profit and \`i++\`. If \`avail\` is empty, stop (nothing affordable, and nothing will become affordable). Otherwise \`w += avail.pop()\`.

**Why greedy is safe:** capital never decreases, so taking the largest available profit now yields the largest capital, which keeps every future option open (exchange argument).`,

  functionName: 'findMaximizedCapital',
  paramNames: ['k', 'w', 'profits', 'capital'],
  starterCode: `/**
 * @param {number} k
 * @param {number} w
 * @param {number[]} profits
 * @param {number[]} capital
 * @return {number}
 */
function findMaximizedCapital(k, w, profits, capital) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Capital unlocks projects as it grows: take project 0, then the best newly affordable one.', args: [2,0,[1,2,3],[0,1,1]], expected: 4 },
    { scenario: 'Example 2', hint: 'Each completed project unlocks the next; take all three.', args: [3,0,[1,2,3],[0,1,2]], expected: 6 },
    { scenario: 'Nothing affordable', hint: 'No project costs 0 or less, so w stays 0. Break out instead of popping an empty heap.', args: [1,0,[1,2,3],[1,1,2]], expected: 0 },
    { scenario: 'k larger than n', hint: 'You can only do each project once — stop when every project is used.', args: [10,5,[1,2,3],[0,0,0]], expected: 11 },
    { scenario: 'Capital is not spent', hint: 'Capital is only a threshold. Subtracting capital[i] from w gives a smaller answer.', args: [2,1,[5,1,2],[2,0,1]], expected: 8 },
    { scenario: 'Stuck after one project', hint: 'After the first project nothing else is affordable — the loop must break, not crash on an empty heap.', args: [3,0,[1,2,3],[0,5,10]], expected: 1 },
    { scenario: 'Capital equals w', hint: 'A project is affordable when capital[i] <= w (inclusive).', args: [1,2,[1,2,3],[1,1,2]], expected: 5 },
    { scenario: 'Zero profits block progress', hint: 'Profit-0 projects never raise w, so the 5-profit project stays out of reach.', args: [3,0,[0,0,5],[0,0,1]], expected: 0 },
    { scenario: 'Huge starting capital', hint: 'w near 10^9 makes every project affordable; just take the k largest profits.', args: [2,1000000000,[10000,1],[0,0]], expected: 1000010001 },
    { scenario: 'Greedy picks the largest profit', hint: 'Among affordable projects always take the most profitable; taking the cheapest one first loses.', args: [2,0,[1,5,10],[0,0,6]], expected: 6 },
    { scenario: 'Single project', hint: 'n = 1, k = 1 — the smallest input.', args: [1,0,[7],[0]], expected: 7 },
    { scenario: 'Large input (n = k = 10^5)', hint: 'Rescanning all projects every round is O(k·n) = 10^10. Sort by capital once and keep affordable profits in a max-heap: O((n + k) log n).', argsGen: '() => { let s = 3; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const p = [], c = []; for (let i = 0; i < 100000; i++) { p.push(r() % 10001); c.push(r() % (i * 3000 + 1)); } return [100000, 0, p, c]; }', expected: 500953911, timeLimitMs: 1000 },
    { scenario: 'Large, everything soon affordable', hint: 'Most projects unlock early; a per-round linear scan for the best profit is far too slow.', argsGen: '() => { let s = 5; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const p = [], c = []; for (let i = 0; i < 100000; i++) { p.push(r() % 10001); c.push(r() % 1000); } return [50000, 1000, p, c]; }', expected: 374618336, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findMaximizedCapital(k, w, profits, capital) {
  const projects = profits.map((p, i) => [capital[i], p]).sort((a, b) => a[0] - b[0]);
  const avail = new MaxHeap();          // profits of projects we can afford
  let i = 0;
  for (let round = 0; round < k; round++) {
    while (i < projects.length && projects[i][0] <= w) avail.push(projects[i++][1]); // unlock
    if (avail.isEmpty()) break;         // nothing affordable now or ever
    w += avail.pop();                   // choose the most profitable
  }
  return w;
}`,
  },
  dryRun: {
    columns: ['round', 'w before', 'unlocked (pushed)', 'pop', 'w after'],
    rows: [['1', '1', 'profit 1 (cap 0), profit 2 (cap 1)', '2', '3'], ['2', '3', 'profit 5 (cap 2)', '5', '8']],
    note: 'k = 2, w = 1, profits = [5,1,2], capital = [2,0,1].',
  },
  complexity: { time: 'O(n log n + k log n)', space: 'O(n)', explanation: 'Sorting is O(n log n); each project is pushed once and each round pops once.' },
  alternative: {
    title: 'Two heaps instead of sort',
    md: 'Put all projects in a min-heap by capital ("locked"). Each round pop from "locked" into a max-heap by profit ("available") while affordable. Same complexity; this is the "two heaps with different roles" view.',
    complexity: 'O((n + k) log n)',
  },
  mistakes: [
    'Spending the capital (subtracting capital[i]) — it is only a requirement.',
    'Not breaking when nothing is affordable (the loop would pop from an empty heap).',
    'Rescanning all projects every round (O(k·n)).',
  ],
};
