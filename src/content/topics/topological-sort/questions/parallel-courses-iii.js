export default {
  id: 'parallel-courses-iii',
  title: 'Parallel Courses III',
  difficulty: 'Hard',
  order: 2,
  pattern: 'topo-dag-dp',
  tags: ['graph', 'topological sort', 'dynamic programming', 'dag'],
  source: { platform: 'LeetCode', number: 2050, url: 'https://leetcode.com/problems/parallel-courses-iii/' },

  statement: `There are \`n\` courses labelled \`1..n\`. \`relations[j] = [prev, next]\` means course \`prev\` must be **completed** before course \`next\` can start. Course \`i\` takes \`time[i − 1]\` months.

You may take **any number of courses at the same time**, as long as their prerequisites are done. Return the minimum number of months needed to complete all courses. The graph is guaranteed to be a DAG.`,
  examples: [
    { input: 'n = 3, relations = [[1,3],[2,3]], time = [3,2,5]', output: '8', explanation: 'Courses 1 and 2 run in parallel; 3 starts at month 3 and ends at 8.' },
    { input: 'n = 5, relations = [[1,5],[2,5],[3,5],[3,4],[4,5]], time = [1,2,3,4,5]', output: '12', explanation: 'Critical path 3 → 4 → 5: 3 + 4 + 5.' },
  ],
  constraints: ['1 <= n <= 5 · 10^4', '0 <= relations.length <= min(n(n+1)/2, 5 · 10^4)', '1 <= time[i] <= 10^4', 'The graph is a DAG'],

  think: `- When is the earliest moment course v can **start**? Which prerequisites matter?
- In what order must you compute these moments?
- Is the answer the finish time of the last course processed, or something else?`,
  patternChallenge: {
    options: ['Greedy: always take the shortest available course', 'Dijkstra from every source', "Kahn's order + longest-path DP", 'Binary search on the number of months'],
    answer: 2,
    explanation: 'finish[v] = time[v] + max(finish[u]) over prerequisites u — a longest-path DP on a DAG, computed in topological order. Greedy scheduling is irrelevant because parallelism is unlimited; Dijkstra computes shortest paths, and turning weights negative is not needed when the graph is a DAG.',
  },
  hints: [
    'Let `finish[v]` be the earliest month course v can be completed. Initialise it with `time[v]`.',
    'In Kahn order, for each edge u → v: `finish[v] = max(finish[v], finish[u] + time[v])`. The answer is the maximum finish over all courses.',
  ],
  approach: `**Why longest path?** With unlimited parallelism, nothing ever waits except for prerequisites. So course v completes at \`time[v] + max(finish of its prerequisites)\` — the heaviest chain of dependencies ending at v (the *critical path*).

**Algorithm:** Kahn's algorithm; \`finish = time.slice()\`. When popping u, relax every edge u → v with \`finish[v] = max(finish[v], finish[u] + time[v])\`. Because v is popped only after all its prerequisites, \`finish[v]\` is final by then. Answer: \`max(finish)\`. O(n + m).

Longest path is NP-hard on general graphs; the DAG guarantee is what makes this linear.`,

  functionName: 'minimumTime',
  paramNames: ['n', 'relations', 'time'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} relations
 * @param {number[]} time
 * @return {number}
 */
function minimumTime(n, relations, time) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Courses 1 and 2 run in parallel; course 3 starts when the slower one (3 months) ends.', args: [3, [[1, 3], [2, 3]], [3, 2, 5]], expected: 8 },
    { scenario: 'Example 2', hint: 'The critical path 3 → 4 → 5 takes 3 + 4 + 5 = 12.', args: [5, [[1, 5], [2, 5], [3, 5], [3, 4], [4, 5]], [1, 2, 3, 4, 5]], expected: 12 },
    { scenario: 'Single course', hint: 'One course, no relations: its own time.', args: [1, [], [5]], expected: 5 },
    { scenario: 'No relations', hint: 'Everything runs in parallel: the answer is the longest single course, not the sum.', args: [3, [], [1, 2, 3]], expected: 3 },
    { scenario: 'Simple chain', hint: 'A chain forces sequential work: the sum along it.', args: [4, [[1, 2], [2, 3], [3, 4]], [1, 1, 1, 1]], expected: 4 },
    { scenario: 'Diamond, take the max', hint: 'Course 4 waits for the SLOWER of 2 and 3 — using min gives the wrong start.', args: [4, [[1, 2], [1, 3], [2, 4], [3, 4]], [1, 5, 2, 1]], expected: 7 },
    { scenario: 'Two converging branches', hint: 'Branch 3 → 5 is longer than 1/2 → 4; course 6 waits for both.', args: [6, [[1, 4], [2, 4], [4, 6], [3, 5], [5, 6]], [2, 7, 1, 3, 10, 1]], expected: 12 },
    { scenario: 'Longest course is not last', hint: 'The last course popped from the queue (2) finishes early; return the max finish time over all courses.', args: [2, [], [10, 1]], expected: 10 },
    { scenario: 'Isolated long course', hint: 'Course 4 is unrelated to the chain but takes longer than the whole chain.', args: [4, [[1, 2], [2, 3]], [1, 1, 1, 9]], expected: 9 },
    { scenario: 'Label n used', hint: 'Labels are 1..n; course n is the bottleneck here, so a 0-based mix-up shows.', args: [3, [[3, 1], [3, 2]], [1, 1, 10000]], expected: 10001 },
    { scenario: 'Max chain (n = 5·10^4)', hint: 'A 50 000-course chain: recursive DFS can overflow the stack; Kahn is iterative.', argsGen: '() => [50000, Array.from({ length: 49999 }, (_, i) => [i + 1, i + 2]), new Array(50000).fill(2)]', expected: 100000, timeLimitMs: 1000 },
    { scenario: 'Max layered DAG', hint: 'Layers of courses where each depends on two in the previous layer: there are exponentially many paths, so an un-memoised DFS never finishes.', argsGen: '() => { const n = 50000, W = 2; const rel = []; for (let v = W + 1; v <= n && rel.length < 49998; v++) { rel.push([v - W, v]); if ((v - 1) % W) rel.push([v - W - 1, v]); else rel.push([v - 1, v]); } let s = 2; const r = () => (s = (s * 48271) % 2147483647); const time = Array.from({ length: n }, () => 1 + (r() % 10000)); return [n, rel, time]; }', expected: 83549495, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumTime(n, relations, time) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [prev, next] of relations) {       // 1-based → 0-based
    adj[prev - 1].push(next - 1);
    indeg[next - 1]++;
  }
  const finish = time.slice();                  // at least its own duration
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];                      // finish[u] is final
    for (const v of adj[u]) {
      finish[v] = Math.max(finish[v], finish[u] + time[v]);
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  let best = 0;
  for (const f of finish) if (f > best) best = f;
  return best;
}`,
    explanation: 'A loop is used for the maximum instead of Math.max(...finish), which can exceed the argument limit for very large arrays in some engines.',
  },
  dryRun: { columns: ['pop', 'relax', 'finish'], rows: [['(init)', '—', '[1,2,3,4,5]'], ['1', '1→5', 'f5 = max(5, 1+5) = 6'], ['2', '2→5', 'f5 = max(6, 2+5) = 7'], ['3', '3→5, 3→4', 'f5 = max(7, 8) = 8; f4 = max(4, 3+4) = 7'], ['4', '4→5', 'f5 = max(8, 7+5) = 12'], ['5', '—', 'max = 12']] },
  complexity: { time: 'O(n + m)', space: 'O(n + m)', explanation: 'Kahn visits every course and relation once; the DP update is O(1) per edge.' },
  alternative: {
    title: 'Memoised DFS',
    md: '`done(v) = time[v] + max(done(u))` over prerequisites u (use the reversed graph). Memoise; answer = max over v. Recursion can reach 5·10^4 deep on a chain — risky in JavaScript, so Kahn is preferred.',
    complexity: 'O(n + m) time and space',
  },
  mistakes: [
    'Summing all times (ignores parallelism).',
    'Using min instead of max over prerequisites.',
    'Returning finish of the last popped course instead of the maximum over all courses.',
    'Forgetting the 1-based labels.',
  ],
};
