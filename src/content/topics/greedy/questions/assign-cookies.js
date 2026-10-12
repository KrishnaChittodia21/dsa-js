export default {
  id: 'assign-cookies',
  title: 'Assign Cookies',
  difficulty: 'Easy',
  order: 1,
  pattern: 'greedy-sort-and-pick',
  tags: ['array', 'greedy', 'sorting', 'two pointers'],
  source: { platform: 'LeetCode', number: 455, url: 'https://leetcode.com/problems/assign-cookies/' },

  statement: `You have some children and some cookies. Child \`i\` has a **greed factor** \`g[i]\`: the smallest cookie size that will make them happy. Cookie \`j\` has size \`s[j]\`.

Each child may receive **at most one** cookie, and each cookie can be given to at most one child. A child is content if the cookie they get has size \`>= g[i]\`.

Return the **maximum number of content children**.`,
  examples: [
    { input: 'g = [1,2,3], s = [1,1]', output: '1', explanation: 'Both cookies have size 1, so only the child with greed 1 can be satisfied.' },
    { input: 'g = [1,2], s = [1,2,3]', output: '2', explanation: 'Cookie 1 → child 1, cookie 2 → child 2.' },
  ],
  constraints: ['1 <= g.length <= 3 * 10^4', '0 <= s.length <= 3 * 10^4', '1 <= g[i], s[j] <= 2^31 - 1'],

  think: `- Which child is the easiest to satisfy? Which cookie is the "cheapest" to give away?
- If a small cookie can satisfy the least greedy child, is there ever a reason to give that child a bigger one?
- After sorting both arrays, how many times do you need to look at each cookie?`,
  patternChallenge: {
    options: ['Dynamic Programming', 'Sliding Window', 'Backtracking', 'Greedy — Sort, then Pick'],
    answer: 3,
    explanation: 'Order does not matter (you may give any cookie to any child) and we maximise a count of matches. Sorting both sides and matching smallest-to-smallest is safe by an exchange argument.',
  },
  hints: [
    'Sort both arrays ascending.',
    'Walk through cookies from smallest; if the current cookie satisfies the least greedy unsatisfied child, give it to them and move to the next child. Otherwise the cookie is useless for everyone — skip it.',
  ],
  approach: `**Brute force:** try every assignment of cookies to children (exponential), or for each child scan all cookies for the smallest that fits (O(n·m)).

**Greedy:** sort \`g\` and \`s\`. Pointer \`child\` on \`g\`, pointer \`cookie\` on \`s\`. If \`s[cookie] >= g[child]\`, match them (child++). Always cookie++.

**Why it is safe (exchange):** if an optimal solution gives the least greedy child a bigger cookie, swap it with the smallest satisfying cookie — nobody becomes unhappy. And a cookie too small for the least greedy child is too small for everybody.`,

  functionName: 'findContentChildren',
  paramNames: ['g', 's'],
  starterCode: `/**
 * @param {number[]} g
 * @param {number[]} s
 * @return {number}
 */
function findContentChildren(g, s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Both cookies are size 1, so only the child with greed 1 can be satisfied.', args: [[1, 2, 3], [1, 1]], expected: 1 },
    { scenario: 'Example 2', hint: 'Every child fits a cookie: match the smallest fitting cookie to the least greedy child.', args: [[1, 2], [1, 2, 3]], expected: 2 },
    { scenario: 'No cookies at all', hint: 's may be empty — the answer is 0 and your loop must not read s[0].', args: [[1, 2, 3], []], expected: 0 },
    { scenario: 'Single child, single cookie', hint: 'The smallest input: the cookie fits exactly (size equals greed counts as content).', args: [[5], [5]], expected: 1 },
    { scenario: 'Cookie too small for everyone', hint: 'A cookie smaller than the least greedy child is useless — skip it, do not count it.', args: [[2, 2], [1, 1, 1]], expected: 0 },
    { scenario: 'Default sort is lexicographic', hint: 'Without a numeric comparator, [10, 2].sort() stays [10, 2] and [9, 3] becomes [3, 9] — you then match nobody. Use (a, b) => a - b.', args: [[10, 2], [9, 3]], expected: 1 },
    { scenario: 'Multi-digit unsorted values', hint: 'Lexicographic sort reorders 10 before 7, 8, 9; numeric sorting is required for the two-pointer scan.', args: [[10, 9, 8, 7], [5, 6, 7, 8]], expected: 2 },
    { scenario: 'Skip small cookies, keep the child', hint: 'If you advance the child pointer when a cookie is too small, child 2 is abandoned after cookie 1 fails and you return 0 instead of 2.', args: [[2, 3], [1, 2, 3]], expected: 2 },
    { scenario: 'Biggest cookie wasted on easy child', hint: 'Handing the biggest cookie to the first child you see wastes it; give each child the smallest cookie that still fits.', args: [[1, 5], [5, 1]], expected: 2 },
    { scenario: 'More cookies than children', hint: 'Stop once every child is content — the answer can never exceed g.length.', args: [[1, 1, 1], [1, 1, 1, 1]], expected: 3 },
    { scenario: 'One big cookie, many children', hint: 'A cookie can satisfy at most one child, however big it is.', args: [[1, 1, 1], [100]], expected: 1 },
    { scenario: 'Maximum values (2^31 − 1)', hint: 'Greed and sizes go up to 2^31 − 1; plain number comparison handles them, no overflow tricks needed.', args: [[2147483647, 1], [2147483647, 2147483646]], expected: 2 },
    { scenario: 'Unsorted input, all satisfiable', hint: 'Both arrays arrive unsorted; sort both before matching.', args: [[3, 1, 2], [100, 1, 2]], expected: 3 },
    { scenario: 'Large input (n = 3·10^4)', hint: 'Scanning all cookies for every child is O(n·m) ≈ 10^9 steps; sort both arrays and sweep with two pointers in O(n log n).', argsGen: '() => { let x = 7; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); const g = Array.from({ length: 30000 }, () => 1 + r() % 1000000); const s = Array.from({ length: 30000 }, () => 1 + r() % 1000000); return [g, s]; }', expected: 29871, timeLimitMs: 600 },
  ],

  solution: {
    code: `function findContentChildren(g, s) {
  g.sort((a, b) => a - b);        // numeric comparator — default sort is lexicographic
  s.sort((a, b) => a - b);
  let child = 0;
  for (let cookie = 0; cookie < s.length && child < g.length; cookie++) {
    if (s[cookie] >= g[child]) child++; // smallest cookie that satisfies the least greedy child
  }
  return child;                   // number of satisfied children
}`,
    explanation: 'Every cookie is looked at once. A cookie that is too small for the least greedy remaining child is too small for all of them, so skipping it loses nothing.',
  },
  dryRun: {
    columns: ['cookie', 's[cookie]', 'g[child]', 'match?', 'child'],
    rows: [
      ['0', '5', '7', 'no', '0'],
      ['1', '6', '7', 'no', '0'],
      ['2', '7', '7', 'yes', '1'],
      ['3', '8', '8', 'yes', '2'],
    ],
  },
  complexity: { time: 'O(n log n + m log m)', space: 'O(1) extra (besides sorting)', explanation: 'Sorting dominates; the two-pointer sweep is linear.' },
  alternative: {
    title: 'Iterate over children from the greediest',
    md: 'Sort both descending-style: for each child from greediest, give the largest remaining cookie if it fits, otherwise skip the child. Same complexity, same exchange argument mirrored.',
    code: `function findContentChildren(g, s) {
  g.sort((a, b) => b - a);
  s.sort((a, b) => b - a);
  let c = 0, count = 0;
  for (const greed of g) {
    if (c < s.length && s[c] >= greed) { count++; c++; }
  }
  return count;
}`,
    complexity: 'O(n log n + m log m) time, O(1) extra space',
  },
  mistakes: [
    'Using `.sort()` without a comparator: `[10, 9, 8, 7].sort()` becomes `[10, 7, 8, 9]`.',
    'Advancing the child pointer even when the cookie is too small.',
    'Giving the greediest child the biggest cookie first without checking it fits — wastes nothing, but only if you skip children correctly.',
  ],
};
