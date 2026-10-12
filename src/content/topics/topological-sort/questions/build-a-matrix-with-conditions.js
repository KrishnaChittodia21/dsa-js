export default {
  id: 'build-a-matrix-with-conditions',
  title: 'Build a Matrix With Conditions',
  difficulty: 'Hard',
  order: 4,
  pattern: 'topo-kahn-indegree',
  tags: ['graph', 'topological sort', 'matrix'],
  source: { platform: 'LeetCode', number: 2392, url: 'https://leetcode.com/problems/build-a-matrix-with-conditions/' },

  statement: `Given a positive integer \`k\`, build a \`k x k\` matrix that contains each number \`1..k\` **exactly once**; every other cell is \`0\`. It must satisfy:

- \`rowConditions[i] = [above, below]\`: the number \`above\` is in a row **strictly above** the row of \`below\`.
- \`colConditions[i] = [left, right]\`: the number \`left\` is in a column **strictly left** of the column of \`right\`.

Return any valid matrix, or an empty array \`[]\` if none exists.

*Your answer is checked by verifying every rule, so any valid matrix is accepted.*`,
  examples: [
    { input: 'k = 3, rowConditions = [[1,2],[3,2]], colConditions = [[2,1],[3,2]]', output: '[[3,0,0],[0,0,1],[0,2,0]]', explanation: 'Rows: 1 and 3 above 2. Columns: 3 left of 2 left of 1.' },
    { input: 'k = 3, rowConditions = [[1,2],[2,3],[3,1],[2,3]], colConditions = [[2,1]]', output: '[]', explanation: 'Row rules 1 → 2 → 3 → 1 form a cycle.' },
  ],
  constraints: ['2 <= k <= 400', '1 <= rowConditions.length, colConditions.length <= 10^4', '1 <= above, below, left, right <= k, above != below, left != right'],

  think: `- Do the row rules and the column rules interact at all?
- If each number gets its own row and its own column, what do the row rules become?
- Why is a k×k matrix with k numbers always big enough?`,
  patternChallenge: {
    options: ['Backtracking placement', 'Bipartite matching', 'Greedy by number value', 'Two independent topological sorts (rows and columns)'],
    answer: 3,
    explanation: 'Row rules only constrain row indices; column rules only constrain column indices. Giving each number a distinct row = its position in a topological order of the row rules (same for columns) satisfies everything. A cycle in either set means no matrix exists. Backtracking would explore k!² placements.',
  },
  hints: [
    'Topologically sort 1..k with edges above → below. The index of number x in that order is its row. Do the same for columns.',
    'If either sort has a cycle (fewer than k numbers output), return []. Otherwise place x at (row[x], col[x]).',
  ],
  approach: `**Key insight:** the two families of rules are independent. Put every number in its own row and its own column (possible because the matrix is k×k). Then a row rule \`above → below\` just says "row index of above < row index of below", i.e. a topological order of the numbers under row rules. Same for columns.

**Algorithm:** run Kahn on \`rowConditions\` (vertices 1..k) → \`rowOrder\`; on \`colConditions\` → \`colOrder\`. If either has fewer than k vertices, return \`[]\`. Record \`rowPos[x]\`, \`colPos[x]\` and set \`matrix[rowPos[x]][colPos[x]] = x\`. Duplicate conditions are harmless as long as they are counted consistently. O(k² + conditions) (the k² is just the matrix).`,

  functionName: 'buildMatrix',
  paramNames: ['k', 'rowConditions', 'colConditions'],
  starterCode: `/**
 * @param {number} k
 * @param {number[][]} rowConditions
 * @param {number[][]} colConditions
 * @return {number[][]}
 */
function buildMatrix(k, rowConditions, colConditions) {
  
}
`,
  checker: `(output, args, expected, h) => {
  const [k, rows, cols] = args;
  if (!Array.isArray(output)) return false;
  if (expected.length === 0) return output.length === 0;
  if (output.length !== k) return false;
  const rowOf = new Array(k + 1).fill(-1), colOf = new Array(k + 1).fill(-1);
  for (let r = 0; r < k; r++) {
    if (!Array.isArray(output[r]) || output[r].length !== k) return false;
    for (let c = 0; c < k; c++) {
      const x = output[r][c];
      if (x === 0) continue;
      if (!Number.isInteger(x) || x < 1 || x > k || rowOf[x] !== -1) return false;
      rowOf[x] = r; colOf[x] = c;
    }
  }
  for (let x = 1; x <= k; x++) if (rowOf[x] === -1) return false;
  return rows.every(([a, b]) => rowOf[a] < rowOf[b]) && cols.every(([a, b]) => colOf[a] < colOf[b]);
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Row order and column order are two independent topological sorts; any matrix satisfying both is accepted.', args: [3, [[1, 2], [3, 2]], [[2, 1], [3, 2]]], expected: [[0, 0, 1], [3, 0, 0], [0, 2, 0]] },
    { scenario: 'Example 2', hint: 'Row rules 1 → 2 → 3 → 1 form a cycle, so return [].', args: [3, [[1, 2], [2, 3], [3, 1], [2, 3]], [[2, 1]]], expected: [] },
    { scenario: 'Smallest grid (k = 2)', hint: 'One row rule and one column rule pointing the other way.', args: [2, [[1, 2]], [[2, 1]]], expected: [[0, 1], [2, 0]] },
    { scenario: 'Column cycle only', hint: 'Rows are fine but columns contradict (1 left of 2 and 2 left of 1). Return [] — never a partial matrix.', args: [2, [[1, 2]], [[1, 2], [2, 1]]], expected: [] },
    { scenario: 'Opposite chains', hint: 'Rows go 4,3,2,1 while columns go 1,2,3,4 — the two orders are independent.', args: [4, [[4, 3], [3, 2], [2, 1]], [[1, 2], [2, 3], [3, 4]]], expected: [[0, 0, 0, 4], [0, 0, 3, 0], [0, 2, 0, 0], [1, 0, 0, 0]] },
    { scenario: 'Duplicate conditions', hint: 'The same rule [1,2] twice must not break your in-degree counting.', args: [3, [[1, 2], [1, 2], [1, 3]], [[3, 1], [3, 2]]], expected: [[0, 0, 1], [3, 0, 0], [0, 2, 0]] },
    { scenario: 'Numbers without rules', hint: 'Numbers that appear in no rule still need a row and a column (in-degree 0 from the start).', args: [5, [[1, 5], [2, 5], [3, 5], [4, 5]], [[5, 1]]], expected: [[0, 0, 0, 0, 1], [2, 0, 0, 0, 0], [0, 3, 0, 0, 0], [0, 0, 4, 0, 0], [0, 0, 0, 5, 0]] },
    { scenario: 'Mutual pair in rows', hint: 'A 2-cycle [1,2],[2,1] in rows makes it impossible even though columns are fine.', args: [3, [[1, 2], [2, 1]], [[1, 3]]], expected: [] },
    { scenario: 'Cycle not involving 1', hint: '2 → 3 → 4 → 2 is a cycle among later numbers; Kahn\'s processes fewer than k numbers.', args: [4, [[1, 2], [2, 3], [3, 4], [4, 2]], [[1, 2]]], expected: [] },
    { scenario: 'Same rules for rows and cols', hint: 'Identical rule sets put numbers on a diagonal; one combined graph is not needed.', args: [3, [[3, 1], [1, 2]], [[3, 1], [1, 2]]], expected: [[3, 0, 0], [0, 1, 0], [0, 0, 2]] },
    { scenario: 'Dense rules, valid (k = 50)', hint: '10^4 random consistent rules in each set: rows follow a hidden order, columns its reverse.', argsGen: '() => { const k = 50; let s = 5; const r = () => (s = (s * 48271) % 2147483647); const perm = Array.from({ length: k }, (_, i) => i + 1); for (let i = k - 1; i > 0; i--) { const j = r() % (i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; } const g = (n) => { const c = []; for (let t = 0; t < n; t++) { let a = r() % k, b = r() % k; if (a === b) continue; if (a > b) [a, b] = [b, a]; c.push([perm[a], perm[b]]); } return c; }; const rows = g(10000), cols = g(10000).map(([a, b]) => [b, a]);  return [k, rows, cols]; }', expected: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]] },
    { scenario: 'Max k with late cycle', hint: 'k = 400 and 10^4 consistent column rules, but one extra row rule closes a cycle: return [].', argsGen: '() => { const k = 400; let s = 5; const r = () => (s = (s * 48271) % 2147483647); const perm = Array.from({ length: k }, (_, i) => i + 1); for (let i = k - 1; i > 0; i--) { const j = r() % (i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; } const g = (n) => { const c = []; for (let t = 0; t < n; t++) { let a = r() % k, b = r() % k; if (a === b) continue; if (a > b) [a, b] = [b, a]; c.push([perm[a], perm[b]]); } return c; }; const rows = g(10000), cols = g(10000).map(([a, b]) => [b, a]); rows.push([perm[399], perm[0]], [perm[0], perm[399]]); rows.splice(0, 2); return [k, rows, cols]; }', expected: [] },
  ],

  solution: {
    code: `function buildMatrix(k, rowConditions, colConditions) {
  // Kahn over numbers 1..k; returns the order or null on a cycle
  const topo = (conditions) => {
    const adj = Array.from({ length: k + 1 }, () => []);
    const indeg = new Array(k + 1).fill(0);
    for (const [a, b] of conditions) { adj[a].push(b); indeg[b]++; }
    const order = [];
    for (let x = 1; x <= k; x++) if (indeg[x] === 0) order.push(x);
    for (let head = 0; head < order.length; head++) {
      for (const y of adj[order[head]]) if (--indeg[y] === 0) order.push(y);
    }
    return order.length === k ? order : null;
  };

  const rowOrder = topo(rowConditions);
  const colOrder = topo(colConditions);
  if (!rowOrder || !colOrder) return [];

  const colPos = new Array(k + 1);
  colOrder.forEach((x, i) => { colPos[x] = i; });
  const matrix = Array.from({ length: k }, () => new Array(k).fill(0));
  rowOrder.forEach((x, r) => { matrix[r][colPos[x]] = x; });
  return matrix;
}`,
    explanation: 'Duplicate conditions add duplicate edges and duplicate in-degree, and each is decremented once — consistent, so no dedupe is needed.',
  },
  dryRun: { columns: ['step', 'result'], rows: [['row topo (1→2, 3→2)', '[1, 3, 2] → rows 1:0, 3:1, 2:2'], ['col topo (2→1, 3→2)', '[3, 2, 1] → cols 3:0, 2:1, 1:2'], ['place', '1 at (0,2), 3 at (1,0), 2 at (2,1)']] },
  complexity: { time: 'O(k² + R + C)', space: 'O(k² + R + C)', explanation: 'Two Kahn runs over k vertices and R / C edges; building the k×k output dominates.' },
  alternative: {
    title: 'DFS topological sort',
    md: 'Use 3-colour DFS for each condition set instead of Kahn; identical placement step.',
    complexity: 'O(k² + R + C) time',
  },
  mistakes: [
    'Trying to satisfy both rule sets with one combined graph.',
    'Forgetting that numbers without any rule still need a row and a column (they have in-degree 0).',
    'Returning a partial matrix when one ordering has a cycle.',
  ],
};
