// ---- large-test generators (deterministic; used by the timed tests below) ----
// queries = 1, 2, …, m: before query i the front holds i−1 moved values, so the answer is i − 1.
const ascQueriesArgs = () => [Array.from({ length: 1000 }, (_, i) => i + 1), 1000];
// queries = m, m−1, …, 1: each queried value is still at the end of P, so every answer is m − 1.
const descQueriesArgs = () => [Array.from({ length: 1000 }, (_, i) => 1000 - i), 1000];
// ---- end generators ----

export default {
  id: 'queries-on-a-permutation-with-key',
  title: 'Queries on a Permutation With Key',
  difficulty: 'Medium',
  order: 2,
  pattern: 'fenwick-tree-bit',
  tags: ['array', 'fenwick tree', 'simulation'],
  source: { platform: 'LeetCode', number: 1409, url: 'https://leetcode.com/problems/queries-on-a-permutation-with-key/' },

  statement: `Start with the list \`P = [1, 2, 3, …, m]\`. Process the numbers in \`queries\` one at a time. For each query value \`q\`:

1. find the current (0-based) position of \`q\` in \`P\` — that position is the answer for this query;
2. move \`q\` to the very front of \`P\`.

Return the array of answers.`,
  examples: [
    { input: 'queries = [3,1,2,1], m = 5', output: '[2,1,2,1]', explanation: 'P=[1,2,3,4,5]: 3 is at 2 → P=[3,1,2,4,5]; 1 is at 1 → P=[1,3,2,4,5]; 2 is at 2 → P=[2,1,3,4,5]; 1 is at 1.' },
    { input: 'queries = [4,1,2,2], m = 4', output: '[3,1,2,0]' },
    { input: 'queries = [7,5,5,8,3], m = 8', output: '[6,5,0,7,5]' },
  ],
  constraints: ['1 <= m <= 10^3 (think about m, queries.length up to 10^5 for the optimized version)', '1 <= queries.length <= m', '1 <= queries[i] <= m'],

  think: `- Simulating with \`indexOf\` + \`splice\` + \`unshift\` is O(m) per query. Where does the time go?
- The position of \`q\` equals "how many elements sit in front of it". Can you count that with a prefix sum?
- Moving to the front shifts everybody else. What if the front had spare empty slots, so nobody needs to shift?`,
  patternChallenge: {
    options: ['Hash Map (Complement Lookup)', 'Fenwick Tree over positions', 'Two Pointers', 'Min-Heap'],
    answer: 1,
    explanation: '"Position of x" = number of occupied slots before x. Marking occupied slots with 1s in a Fenwick tree turns that into a prefix sum, and "move to front" into two point updates (remove old slot, fill a fresh slot in front).',
  },
  hints: [
    'Reserve `n = queries.length` empty slots in front of the initial list. Put number x at slot `n + x` (1-based) and remember `pos[x]`.',
    'For the i-th query: answer = (number of occupied slots ≤ pos[q]) − 1. Then clear pos[q], and place q at slot `n − i`, which is in front of everything placed so far.',
  ],
  approach: `**Brute force (simulation):** keep P as an array; \`indexOf\`, \`splice\`, \`unshift\` — O(m) per query, O(q·m) total. Fine for m ≤ 1000, but it scales badly.

**Optimized — BIT over positions:**
- Use \`n + m\` slots. Slots \`n+1 … n+m\` start occupied by 1..m; slots \`1 … n\` are empty "front" space.
- A Fenwick tree stores 1 for an occupied slot, 0 for an empty one. \`prefix(p)\` = how many numbers are at slots ≤ p.
- Query i (0-based) for value q: \`answer = prefix(pos[q]) − 1\`. Then \`add(pos[q], −1)\`, set \`pos[q] = n − i\`, \`add(pos[q], +1)\`. Each new front slot is left of every previous one, so "move to front" is O(log) instead of O(m).`,

  functionName: 'processQueries',
  paramNames: ['queries', 'm'],
  starterCode: `/**
 * @param {number[]} queries
 * @param {number} m
 * @return {number[]}
 */
function processQueries(queries, m) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Answer = position before moving; then the value moves to the front.', args: [[3,1,2,1],5], expected: [2,1,2,1] },
    { scenario: 'Example 2', hint: 'Querying the value that is already at the front answers 0.', args: [[4,1,2,2],4], expected: [3,1,2,0] },
    { scenario: 'Example 3', hint: 'Values that were never queried keep their relative order behind the moved ones.', args: [[7,5,5,8,3],8], expected: [6,5,0,7,5] },
    { scenario: 'Smallest input (m = 1)', hint: 'P = [1]: the only query answers 0.', args: [[1],1], expected: [0] },
    { scenario: 'Front element queried repeatedly', hint: 'After the first query, 2 stays at the front: 1 then 0, 0.', args: [[2,2,2],3], expected: [1,0,0] },
    { scenario: 'Last element queried', hint: 'The last value of P is at position m − 1.', args: [[5],5], expected: [4] },
    { scenario: 'Count excludes the element itself', hint: 'The answer is the number of elements before q: prefix(pos[q]) − 1, not prefix(pos[q]).', args: [[2,3,4,1],4], expected: [1,2,3,3] },
    { scenario: 'Old slot must be freed', hint: 'If you forget to remove q from its old slot it is counted twice for later queries.', args: [[3,3,2,1,3],3], expected: [2,0,2,2,2] },
    { scenario: 'Every move gets a new slot', hint: 'Each moved value needs its own fresh front slot (n − i for the i-th query); reusing a slot makes two values collide.', args: [[1,2,3,4,5,1,2,3,4,5],10], expected: [0,1,2,3,4,4,4,4,4,4] },
    { scenario: 'Random (m = 100)', hint: 'Pseudo-random queries with repeats — simulate with an array to compare if this fails.', argsGen: '() => { let s = 51; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100 }, () => 1 + (rnd() % 100)), 100]; }', expected: [98,34,26,26,18,46,3,56,59,98,9,89,33,43,83,79,14,56,80,46,52,3,6,45,13,84,87,97,3,47,73,63,13,30,62,59,48,29,55,33,79,43,68,70,73,54,34,94,3,39,3,39,9,55,24,30,61,74,70,89,7,16,63,82,65,90,14,40,33,29,59,62,3,20,65,46,80,77,49,63,7,80,21,99,17,55,61,46,98,31,24,36,76,19,86,51,11,65,68,3] },
    { scenario: 'Largest input, ascending', hint: 'm = 1000 queries 1, 2, …, m: the i-th answer is i − 1 because every earlier value moved in front.', argsGen: String(ascQueriesArgs), expected: Array.from({ length: 1000 }, (_, i) => i) },
    { scenario: 'Largest input, descending', hint: 'm = 1000 queries m, m − 1, …, 1: each value is still at the back, so every answer is m − 1.', argsGen: String(descQueriesArgs), expected: Array.from({ length: 1000 }, () => 999) },
  ],
  solution: {
    code: `function processQueries(queries, m) {
  const n = queries.length;
  const size = n + m;
  const tree = new Array(size + 1).fill(0);              // 1-based Fenwick over slots
  const add = (i, d) => { for (; i <= size; i += i & -i) tree[i] += d; };
  const prefix = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += tree[i]; return s; };

  const pos = new Array(m + 1);
  for (let x = 1; x <= m; x++) {                          // initial P = [1..m] after n free slots
    pos[x] = n + x;
    add(pos[x], 1);
  }

  const res = [];
  for (let i = 0; i < n; i++) {
    const q = queries[i];
    res.push(prefix(pos[q]) - 1);                          // occupied slots strictly before q
    add(pos[q], -1);                                       // leave the old slot
    pos[q] = n - i;                                        // fresh slot in front of everything
    add(pos[q], 1);
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['i', 'q', 'pos[q] (slot)', 'prefix(pos[q]) − 1', 'new slot'],
    rows: [
      ['—', '—', 'n = 4, values 1..5 at slots 5..9', '', ''],
      ['0', '3', '7', '3 − 1 = 2', '4'],
      ['1', '1', '5', '2 − 1 = 1 (slots 4, 5)', '3'],
      ['2', '2', '6', '3 − 1 = 2 (slots 3, 4, 6)', '2'],
      ['3', '1', '3', '2 − 1 = 1 (slots 2, 3)', '1'],
    ],
  },
  complexity: { time: 'O((n + m) log(n + m))', space: 'O(n + m)', explanation: 'm initial insertions plus three Fenwick operations per query, each O(log(n + m)).' },
  alternative: {
    title: 'Direct simulation',
    md: 'Keep P as an array and use `indexOf`, `splice` and `unshift`. Each query is O(m), total O(n·m) — perfectly acceptable for the official limits (m ≤ 1000) and worth saying first in an interview.',
    code: `function processQueries(queries, m) {
  const P = Array.from({ length: m }, (_, i) => i + 1);
  return queries.map((q) => {
    const i = P.indexOf(q);
    P.splice(i, 1);
    P.unshift(q);
    return i;
  });
}`,
    complexity: 'O(n·m) time, O(m) space',
  },
  mistakes: [
    'Not reserving front slots — then "move to front" would need to shift every index.',
    'Returning `prefix(pos[q])` instead of `prefix(pos[q]) − 1` (the element itself is counted).',
    'Placing the i-th moved element at slot `n − i + 1` or reusing a slot, which collides with slot n + 1 or an earlier mover.',
    'Forgetting to remove the old slot before inserting the new one.',
  ],
};
