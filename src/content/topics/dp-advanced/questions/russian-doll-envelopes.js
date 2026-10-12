export default {
  id: 'russian-doll-envelopes',
  title: 'Russian Doll Envelopes',
  difficulty: 'Hard',
  order: 1,
  pattern: 'dp-adv-lis',
  tags: ['array', 'sorting', 'binary search', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 354, url: 'https://leetcode.com/problems/russian-doll-envelopes/' },

  statement: `\`envelopes[i] = [w, h]\` is an envelope's width and height. One envelope fits inside another only if **both** its width and height are **strictly smaller**. Rotation is not allowed.

Return the maximum number of envelopes you can nest one inside another.`,
  examples: [
    { input: 'envelopes = [[5,4],[6,4],[6,7],[2,3]]', output: '3', explanation: '[2,3] → [5,4] → [6,7].' },
    { input: 'envelopes = [[1,1],[1,1],[1,1]]', output: '1' },
  ],
  constraints: ['1 <= envelopes.length <= 10^5', '1 <= w, h <= 10^5'],

  think: `- If the envelopes were sorted by width, what would remain to check?
- Two envelopes with the same width can never nest. How can you stop an increasing-height subsequence from picking both?
- n = 10^5: is O(n²) acceptable?`,
  patternChallenge: {
    options: ['Interval merging after sorting', 'Sort (width asc, height desc) + LIS on heights with binary search', 'Greedy: always take the smallest next envelope', '2D DP over (width, height) grid'],
    answer: 1,
    explanation: 'Sorting by width reduces the problem to a longest strictly increasing subsequence of heights; the descending tie-break on height prevents two equal-width envelopes from being chained. Patience sorting makes it O(n log n). A 10^5 × 10^5 grid is far too big.',
  },
  hints: [
    'Sort by width ascending. For equal widths, sort by height DESCENDING.',
    'Now run the O(n log n) LIS (lower bound → strictly increasing) on the heights only.',
  ],
  approach: `**Brute force DP:** sort by width; dp[i] = 1 + max dp[j] over j with w[j] < w[i] and h[j] < h[i]. O(n²) → 10^10 for n = 10^5. Too slow.

**Sort trick + LIS:**
1. Sort by \`w\` ascending, ties by \`h\` descending.
2. Strictly increasing subsequence of heights ⇔ valid chain:
   - widths are non-decreasing along the array by the sort;
   - inside one width group heights decrease, so a strictly increasing height sequence takes at most one per group → widths strictly increase too.
3. Patience sorting on heights: O(n log n).

With ascending tie-break, [3,4] then [3,5] would form an "increasing" pair of heights although they cannot nest.`,

  functionName: 'maxEnvelopes',
  paramNames: ['envelopes'],
  starterCode: `/**
 * @param {number[][]} envelopes
 * @return {number}
 */
function maxEnvelopes(envelopes) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: [2,3] → [5,4] → [6,7].', args: [[[5,4],[6,4],[6,7],[2,3]]], expected: 3 },
    { scenario: 'Example 2', hint: 'Identical envelopes never nest — the answer is 1.', args: [[[1,1],[1,1],[1,1]]], expected: 1 },
    { scenario: 'Single envelope', hint: 'One envelope → 1.', args: [[[1,1]]], expected: 1 },
    { scenario: 'Equal widths only', hint: 'Tie-breaking equal widths by ascending height chains them (answer 3). Sort equal widths by height descending.', args: [[[1,3],[1,2],[1,1]]], expected: 1 },
    { scenario: 'Equal heights only', hint: 'Using a non-strict bound lets equal heights chain. Heights must be strictly smaller.', args: [[[1,5],[2,5],[3,5]]], expected: 1 },
    { scenario: 'Mixed equal widths', hint: 'Only one envelope of width 4 can be used.', args: [[[4,5],[4,6],[6,7],[2,3],[1,1]]], expected: 4 },
    { scenario: 'Widths sorted as numbers', hint: 'Sorting without a comparator compares "10,8" < "2,18" as strings. Use a numeric comparator.', args: [[[10,8],[1,12],[6,15],[2,18],[11,20],[3,13]]], expected: 4 },
    { scenario: 'Many width groups', hint: 'Several envelopes per width; pick at most one per width.', args: [[[2,100],[3,200],[4,300],[5,500],[5,400],[5,250],[6,370],[6,360],[7,380]]], expected: 5 },
    { scenario: 'Long chain with traps', hint: 'Seven nest; [3,5]/[4,5]/[5,5] share heights.', args: [[[1,2],[2,3],[3,4],[3,5],[4,5],[5,5],[5,6],[6,7],[7,8]]], expected: 7 },
    { scenario: 'Width up, height down', hint: 'Widths increase while heights decrease — nothing nests.', args: [[[1,50],[2,49],[3,48],[4,47],[5,46],[6,45],[7,44],[8,43],[9,42],[10,41],[11,40],[12,39],[13,38],[14,37],[15,36],[16,35],[17,34],[18,33],[19,32],[20,31],[21,30],[22,29],[23,28],[24,27],[25,26],[26,25],[27,24],[28,23],[29,22],[30,21],[31,20],[32,19],[33,18],[34,17],[35,16],[36,15],[37,14],[38,13],[39,12],[40,11],[41,10],[42,9],[43,8],[44,7],[45,6],[46,5],[47,4],[48,3],[49,2],[50,1]]], expected: 1 },
    { scenario: 'Max coordinates', hint: 'Values up to 10^5.', args: [[[100000,100000],[1,1],[99999,100000],[100000,99999],[50000,50000]]], expected: 3 },
    { scenario: 'Large random (n = 10^5)', hint: 'O(n²) DP is 10^10 steps here. Sort by width ascending, height descending, then run an O(n log n) LIS on heights.', argsGen: "() => { let s = 9; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100000 }, () => [1 + (rnd() % 100000), 1 + (rnd() % 100000)])]; }", expected: 619, timeLimitMs: 1000 },
    { scenario: 'Large chain (n = 10^5)', hint: 'A perfect chain of 10^5 envelopes in reverse order: the answer is n.', argsGen: "() => [Array.from({ length: 100000 }, (_, i) => [100000 - i, 100000 - i])]", expected: 100000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxEnvelopes(envelopes) {
  // width ascending; equal widths → height DESCENDING (so they cannot chain)
  const sorted = [...envelopes].sort((a, b) => a[0] - b[0] || b[1] - a[1]);

  const tails = [];                        // patience sorting on heights
  for (const [, h] of sorted) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < h) lo = mid + 1;    // lower bound → strictly increasing
      else hi = mid;
    }
    tails[lo] = h;
  }
  return tails.length;
}`,
    explanation: '`a[0] - b[0] || b[1] - a[1]` falls through to the height comparison only when widths are equal (difference 0 is falsy).',
  },
  dryRun: {
    columns: ['sorted envelope', 'height', 'tails'],
    rows: [['[2,3]', '3', '[3]'], ['[5,4]', '4', '[3,4]'], ['[6,7]', '7', '[3,4,7]'], ['[6,4]', '4', '[3,4,7] (4 replaces 4)']],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting plus one binary search per envelope.' },
  alternative: {
    title: 'O(n²) DP after sorting',
    md: 'Correct and simple; only viable for small n.',
    code: `function maxEnvelopes(envelopes) {
  const e = [...envelopes].sort((a, b) => a[0] - b[0]);
  const dp = new Array(e.length).fill(1);
  let best = 0;
  for (let i = 0; i < e.length; i++) {
    for (let j = 0; j < i; j++) {
      if (e[j][0] < e[i][0] && e[j][1] < e[i][1]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    best = Math.max(best, dp[i]);
  }
  return best;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Tie-breaking equal widths by ascending height.',
    'Using upper bound (non-strict) — equal heights would chain.',
    'Sorting without a comparator (lexicographic on arrays-as-strings).',
    'O(n²) DP for n = 10^5.',
  ],
};
