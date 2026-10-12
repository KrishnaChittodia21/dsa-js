export default {
  id: 'count-number-of-teams',
  title: 'Count Number of Teams',
  difficulty: 'Medium',
  order: 6,
  pattern: 'bit-coordinate-compression-counting',
  tags: ['array', 'fenwick tree', 'coordinate compression', 'counting'],
  source: { platform: 'LeetCode', number: 1395, url: 'https://leetcode.com/problems/count-number-of-teams/' },

  statement: `Soldiers stand in a line; soldier i has a **unique** rating \`rating[i]\`. A team is three soldiers at indices \`i < j < k\` whose ratings are either strictly increasing (\`rating[i] < rating[j] < rating[k]\`) or strictly decreasing (\`rating[i] > rating[j] > rating[k]\`).

Return the number of valid teams. A soldier may belong to several teams.`,
  examples: [
    { input: 'rating = [2,5,3,4,1]', output: '3', explanation: '(2,3,4), (5,4,1) and (5,3,1).' },
    { input: 'rating = [2,1,3]', output: '0' },
    { input: 'rating = [1,2,3,4]', output: '4' },
  ],
  constraints: ['3 <= n <= 1000 (the BIT solution handles 10^5)', '1 <= rating[i] <= 10^5', 'All ratings are distinct'],

  think: `- Brute force tries every triple — O(n³). Can you fix one soldier and count the rest?
- If soldier j is the **middle**, how many increasing teams have j in the middle? (Think "smaller on the left" × "larger on the right".)
- How do you get "number of smaller values to my left" for every j faster than O(n) each?`,
  patternChallenge: {
    options: ['Backtracking (choose 3)', 'Coordinate Compression + BIT Counting', 'Two Pointers on a sorted array', 'Dynamic Programming on intervals'],
    answer: 1,
    explanation: 'Fixing the middle element reduces the problem to four counts per j: smaller/larger on the left and on the right. Those are "how many seen values are < x" questions — a Fenwick tree over (compressed) ratings answers each in O(log n). Sorting would destroy the index order that i < j < k depends on.',
  },
  hints: [
    'For middle j: increasing teams = leftSmaller · rightLarger; decreasing teams = leftLarger · rightSmaller.',
    'Scan left to right with a BIT over rating ranks to get leftSmaller (leftLarger = j − leftSmaller). Since ratings are distinct, rightSmaller = totalSmaller − leftSmaller, where totalSmaller = rank of rating[j].',
  ],
  approach: `**Brute force:** three nested loops — O(n³) (10^9 for n = 1000).

**Better — fix the middle, O(n²):** for each j, loop over the left and right to count smaller/larger. 10^6 for n = 1000, accepted.

**Optimized — BIT, O(n log n):**
1. Compress ratings to ranks 0..n−1 (they are distinct, so rank = number of ratings smaller than it overall).
2. Scan j left to right. \`leftSmaller = bit.prefixSum(rank − 1)\`, \`leftLarger = j − leftSmaller\`.
3. \`rightSmaller = rank − leftSmaller\` (all smaller ratings that are not on the left are on the right), \`rightLarger = (n − 1 − j) − rightSmaller\`.
4. Add \`leftSmaller · rightLarger + leftLarger · rightSmaller\`; then insert rank into the BIT.`,

  functionName: 'numTeams',
  paramNames: ['rating'],
  starterCode: `/**
 * @param {number[]} rating
 * @return {number}
 */
function numTeams(rating) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Both directions count: (2,3,4) is increasing, (5,4,1) and (5,3,1) are decreasing.', args: [[2,5,3,4,1]], expected: 3 },
    { scenario: 'Example 2', hint: 'Three soldiers that are neither increasing nor decreasing form no team.', args: [[2,1,3]], expected: 0 },
    { scenario: 'Example 3', hint: 'Every triple of a sorted array is a team: C(4,3) = 4.', args: [[1,2,3,4]], expected: 4 },
    { scenario: 'Minimum size, one team', hint: 'n = 3 and increasing: exactly one team. Middle-soldier loops must include index 1.', args: [[1,2,3]], expected: 1 },
    { scenario: 'Minimum size, no team', hint: 'n = 3 with the middle soldier highest: 0 teams.', args: [[1,3,2]], expected: 0 },
    { scenario: 'Only decreasing teams', hint: 'If you count only increasing teams you return 0 here; all C(5,3) = 10 triples are decreasing.', args: [[5,4,3,2,1]], expected: 10 },
    { scenario: 'Index order matters', hint: 'Sorting the ratings loses i < j < k — count with the original order.', args: [[3,1,4,6,5,2]], expected: 5 },
    { scenario: 'Different digit counts', hint: 'Default sort() compares strings ("10" < "9"), giving wrong ranks. Sort numerically.', args: [[9,10,100,2,11,1000]], expected: 8 },
    { scenario: 'Extreme ratings', hint: 'Ratings span 1..10^5 — size your BIT (or compress) accordingly.', args: [[1,100000,2,99999,50000]], expected: 3 },
    { scenario: 'Zigzag ratings', hint: 'Alternating ups and downs: teams skip over neighbours, so count all smaller/larger on each side, not just adjacent ones.', args: [[1,6,2,5,3,4]], expected: 7 },
    { scenario: 'Random (n = 60)', hint: 'Pseudo-random distinct ratings — compare against a simple O(n²) fix-the-middle count if this fails.', argsGen: '() => { let s = 5; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const seen = new Set(); const r = []; while (r.length < 60) { const v = 1 + (rnd() % 100000); if (!seen.has(v)) { seen.add(v); r.push(v); } } return [r]; }', expected: 12224 },
    { scenario: 'Largest input (n = 1000)', hint: 'Checking every triple is O(n³) ≈ 1.7·10^8 checks — too slow. Fix the middle soldier and count smaller/larger on each side.', argsGen: '() => { let s = 99; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const seen = new Set(); const r = []; while (r.length < 1000) { const v = 1 + (rnd() % 100000); if (!seen.has(v)) { seen.add(v); r.push(v); } } return [r]; }', expected: 56330982, timeLimitMs: 150 },
  ],
  solution: {
    code: `function numTeams(rating) {
  const n = rating.length;
  const sorted = [...rating].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));   // distinct → rank = #smaller overall
  const bit = new FenwickTree(n);                       // toolkit, 0-based API
  let teams = 0;

  for (let j = 0; j < n; j++) {
    const r = rank.get(rating[j]);
    const leftSmaller = r > 0 ? bit.prefixSum(r - 1) : 0;
    const leftLarger = j - leftSmaller;
    const rightSmaller = r - leftSmaller;
    const rightLarger = (n - 1 - j) - rightSmaller;
    teams += leftSmaller * rightLarger + leftLarger * rightSmaller;
    bit.add(r, 1);
  }
  return teams;
}`,
  },
  dryRun: {
    columns: ['j', 'rating', 'rank', 'leftSmaller', 'leftLarger', 'rightSmaller', 'rightLarger', 'teams += '],
    rows: [
      ['0', '2', '1', '0', '0', '1', '3', '0'],
      ['1', '5', '4', '1', '0', '3', '0', '0'],
      ['2', '3', '2', '1', '1', '1', '1', '1 + 1 = 2'],
      ['3', '4', '3', '2', '1', '1', '0', '0 + 1 = 1'],
      ['4', '1', '0', '0', '4', '0', '0', '0'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting for ranks is O(n log n); each j does one BIT query and one update, O(log n) each.' },
  alternative: {
    title: 'Fix the middle with plain loops — O(n²)',
    md: 'For each j, count smaller/larger on each side with two loops. Simple and fast enough for n ≤ 1000; a good first answer before introducing the BIT.',
    code: `function numTeams(rating) {
  const n = rating.length;
  let teams = 0;
  for (let j = 1; j < n - 1; j++) {
    let ls = 0, ll = 0, rs = 0, rl = 0;
    for (let i = 0; i < j; i++) rating[i] < rating[j] ? ls++ : ll++;
    for (let k = j + 1; k < n; k++) rating[k] < rating[j] ? rs++ : rl++;
    teams += ls * rl + ll * rs;
  }
  return teams;
}`,
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: [
    'Sorting the ratings and losing the index order i < j < k.',
    'Counting only increasing teams and forgetting the decreasing ones.',
    'Default `sort()` — ratings like 10 and 9 would sort as strings.',
    'Deriving rightSmaller as a separate BIT pass when the "total smaller = rank" shortcut already gives it (valid because ratings are distinct).',
  ],
};
