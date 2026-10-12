export default {
  id: 'candy',
  title: 'Candy',
  difficulty: 'Hard',
  order: 1,
  pattern: 'greedy-local-constraints',
  tags: ['array', 'greedy'],
  source: { platform: 'LeetCode', number: 135, url: 'https://leetcode.com/problems/candy/' },

  statement: `\`n\` children stand in a line; child \`i\` has rating \`ratings[i]\`. Hand out candies so that:

- every child gets **at least one** candy;
- a child with a **strictly higher** rating than an adjacent child gets **more** candies than that neighbour.

Return the **minimum** number of candies.`,
  examples: [
    { input: 'ratings = [1,0,2]', output: '5', explanation: 'Candies [2,1,2].' },
    { input: 'ratings = [1,2,2]', output: '4', explanation: 'Candies [1,2,1] — equal ratings impose no rule.' },
  ],
  constraints: ['1 <= n <= 2 * 10^4', '0 <= ratings[i] <= 2 * 10^4'],

  think: `- If you only had the rule "more than your LEFT neighbour", how would you assign candies in one pass?
- Now add the right-neighbour rule. Which direction should that pass go?
- How do you combine the two results without breaking either rule?`,
  patternChallenge: {
    options: ['Greedy — Local Rules & Two Passes', 'Monotonic Stack', 'Heap — process children by rating', 'Dynamic Programming on subsequences'],
    answer: 0,
    explanation: 'Each rule only involves one neighbour. One left→right pass satisfies the left rule minimally, one right→left pass the right rule, and max() of the two satisfies both minimally. (Processing children by increasing rating with a heap also works, in O(n log n).)',
  },
  hints: [
    'left[i] = left[i-1] + 1 if ratings[i] > ratings[i-1], else 1.',
    'Sweep right to left: if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1). Sum the result.',
  ],
  approach: `**Brute force:** start everyone at 1 and repeatedly fix violations until none remain — can take O(n²) rounds.

**Two passes:**
1. \`L[i]\` = minimum candies satisfying only the left rule: 1, or \`L[i−1] + 1\` on an increase.
2. \`R[i]\` similarly from the right.
3. Child i needs at least \`max(L[i], R[i])\` — both are forced lower bounds. Giving exactly that satisfies both rules: on a left increase, max(L[i], R[i]) ≥ L[i] = L[i−1] + 1, and one can check R never forces the left neighbour above that (R[i−1] = 1 when ratings[i−1] < ratings[i]).

Because each value is the smallest forced lower bound, the total is minimal. The second pass can be done in place on the same array.`,

  functionName: 'candy',
  paramNames: ['ratings'],
  starterCode: `/**
 * @param {number[]} ratings
 * @return {number}
 */
function candy(ratings) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A valley: the middle child gets 1, both neighbours get 2.', args: [[1, 0, 2]], expected: 5 },
    { scenario: 'Example 2', hint: 'Equal ratings impose no rule, so the last child can drop back to 1.', args: [[1, 2, 2]], expected: 4 },
    { scenario: 'Single child', hint: 'One child still needs at least one candy.', args: [[1]], expected: 1 },
    { scenario: 'Two equal ratings', hint: 'Equal neighbours do not need equal or different candies — both get 1.', args: [[2, 2]], expected: 2 },
    { scenario: 'Two increasing ratings', hint: 'The higher-rated child needs one more than the lower one.', args: [[1, 2]], expected: 3 },
    { scenario: 'All zeros', hint: 'Ratings can be 0; with no strict increases everyone gets exactly 1.', args: [[0, 0, 0, 0]], expected: 4 },
    { scenario: 'Strictly increasing', hint: 'Candies 1, 2, 3, 4, 5 — the left-to-right pass handles this alone.', args: [[1, 2, 3, 4, 5]], expected: 15 },
    { scenario: 'Strictly decreasing', hint: 'A single left-to-right pass gives everyone 1 here; you need the right-to-left pass too.', args: [[5, 4, 3, 2, 1]], expected: 15 },
    { scenario: 'Peak needs the max', hint: 'In pass 2, overwriting give[i] = give[i+1] + 1 shrinks the peak from 4 to 2 and breaks the left rule — take the max.', args: [[1, 3, 4, 5, 2]], expected: 11 },
    { scenario: 'Plateau of equal ratings', hint: 'The 87s form a plateau: each only has to beat its strictly lower neighbour, not each other.', args: [[1, 2, 87, 87, 87, 2, 1]], expected: 13 },
    { scenario: 'Short rise, long fall', hint: 'The peak must beat the long descent on its right (4), not just its left neighbour (2).', args: [[1, 6, 10, 8, 7, 3, 2]], expected: 18 },
    { scenario: 'Mountain then valley', hint: 'Multiple slopes: each child takes the max of the left-run and right-run requirements.', args: [[1, 3, 2, 1, 2, 3, 1]], expected: 13 },
    { scenario: 'Maximum ratings', hint: 'Ratings up to 2·10^4 only matter through comparisons — the values themselves never enter the total.', args: [[20000, 0, 20000, 20000, 0]], expected: 8 },
    { scenario: 'Large decreasing (n = 2·10^4)', hint: 'Repeatedly fixing violations needs ~n rounds of O(n) on a long descent; two linear passes are O(n).', argsGen: '() => [Array.from({ length: 20000 }, (_, i) => 20000 - i)]', expected: 200010000, timeLimitMs: 300 },
  ],

  solution: {
    code: `function candy(ratings) {
  const n = ratings.length;
  const give = new Array(n).fill(1);
  // Pass 1: satisfy "more than my left neighbour".
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;
  }
  // Pass 2: satisfy "more than my right neighbour" without breaking pass 1.
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) give[i] = Math.max(give[i], give[i + 1] + 1);
  }
  let total = 0;
  for (const c of give) total += c;
  return total;
}`,
    explanation: 'Pass 2 only ever increases values, so every left-rule inequality from pass 1 stays true: if give[i] increases, the inequality give[i] > give[i-1] only gets stronger; give[i-1] is updated after give[i] in the backward pass and uses the new value.',
  },
  dryRun: {
    columns: ['i', 'rating', 'after pass 1', 'after pass 2'],
    rows: [
      ['0', '1', '1', '1'],
      ['1', '6', '2', '2'],
      ['2', '10', '3', '5'],
      ['3', '8', '1', '4'],
      ['4', '7', '1', '3'],
      ['5', '3', '1', '2'],
      ['6', '2', '1', '1'],
    ],
    note: 'Total 18. Child 2 is the peak: it needs 3 from the left slope and 5 from the right slope.',
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Two linear passes over one array.' },
  alternative: {
    title: 'One pass counting slopes — O(1) space',
    md: 'Walk up and down slopes. An increasing run of length k costs 1 + 2 + … + k; a decreasing run the same. The peak takes max(up, down) + 1. Trickier to get right, but no array.',
    code: `function candy(ratings) {
  const n = ratings.length;
  if (n <= 1) return n;
  let total = 1, up = 0, down = 0, peak = 0;
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) {
      up++; down = 0; peak = up;
      total += up + 1;
    } else if (ratings[i] === ratings[i - 1]) {
      up = down = peak = 0;
      total += 1;
    } else {
      down++; up = 0;
      total += down + (down > peak ? 1 : 0); // the peak must grow once the slope outgrows it
    }
  }
  return total;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Doing only one pass (fails on decreasing ratings).',
    'Overwriting in pass 2 with give[i+1] + 1 instead of taking the max (breaks the left rule).',
    'Giving equal-rated neighbours equal candies on purpose — equal ratings impose no constraint at all.',
  ],
};
