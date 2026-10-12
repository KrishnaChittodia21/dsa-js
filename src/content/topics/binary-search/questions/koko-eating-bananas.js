export default {
  id: 'koko-eating-bananas',
  title: 'Koko Eating Bananas',
  difficulty: 'Medium',
  order: 6,
  pattern: 'binary-search-on-answer',
  tags: ['array', 'binary search on answer'],
  source: { platform: 'LeetCode', number: 875, url: 'https://leetcode.com/problems/koko-eating-bananas/' },

  statement: `There are \`n\` piles of bananas, \`piles[i]\` bananas in pile i, and the guards return in \`h\` hours (\`h >= n\`).

Koko picks an integer eating speed \`k\` (bananas per hour). Each hour she chooses one pile and eats \`k\` bananas from it; if the pile has fewer than \`k\`, she finishes it and waits for the rest of that hour.

Return the **minimum** \`k\` that lets her eat everything within \`h\` hours.`,
  examples: [
    { input: 'piles = [3,6,7,11], h = 8', output: '4' },
    { input: 'piles = [30,11,23,4,20], h = 5', output: '30', explanation: 'One hour per pile — she must eat the biggest pile in one hour.' },
    { input: 'piles = [30,11,23,4,20], h = 6', output: '23' },
  ],
  constraints: ['1 <= piles.length <= 10^4', 'piles.length <= h <= 10^9', '1 <= piles[i] <= 10^9'],

  think: `- For a fixed speed k, how many hours does pile p take?
- If speed k works, does k + 1 work too? What does that make the predicate look like?
- What is the smallest and the largest speed worth considering?`,
  patternChallenge: {
    options: ['Greedy: eat the largest pile first', 'Binary Search on the answer (speed)', 'Heap of piles', 'Sliding Window'],
    answer: 1,
    explanation: 'Hours needed never increase when k grows, so "finishes within h" is F…F,T…T over k ∈ [1, max(piles)]. Find the first T. The order of eating piles does not matter at all, so greedy/heap ideas are red herrings.',
  },
  hints: [
    'hours(k) = Σ Math.ceil(p / k). It is non-increasing in k.',
    'Search k in [1, max(piles)] with the boundary template: `hours(mid) <= h` → `hi = mid`, else `lo = mid + 1`.',
  ],
  approach: `**Brute force:** try k = 1, 2, … until hours(k) ≤ h — O(n · max(piles)), up to 10^13. Too slow.

**Optimized:** binary search on the answer.
- Range: \`lo = 1\`, \`hi = max(piles)\` (at that speed every pile takes one hour, and h ≥ n guarantees it works).
- Predicate: \`hours(k) <= h\`, monotonic because a faster speed never needs more hours for any pile.
- Each check is O(n); about 30 checks → O(n log max).`,

  functionName: 'minEatingSpeed',
  paramNames: ['piles', 'h'],
  starterCode: `/**
 * @param {number[]} piles
 * @param {number} h
 * @return {number}
 */
function minEatingSpeed(piles, h) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.', args: [[3, 6, 7, 11], 8], expected: 4 },
    { scenario: 'Example 2', hint: 'h equals the number of piles: one hour per pile, so the speed must be the biggest pile.', args: [[30, 11, 23, 4, 20], 5], expected: 30 },
    { scenario: 'Example 3', hint: 'One spare hour lets the 30-pile take two hours, so the answer drops to 23.', args: [[30, 11, 23, 4, 20], 6], expected: 23 },
    { scenario: 'Single pile, one hour', hint: 'Smallest input: speed 1 is enough. Make sure lo starts at 1 — at speed 0, `Math.ceil(p / 0)` is Infinity.', args: [[1], 1], expected: 1 },
    { scenario: 'Plenty of hours', hint: 'With 10^9 hours the slowest speed (1) works. The answer can be the lower bound itself.', args: [[5, 5, 5], 1000000000], expected: 1 },
    { scenario: 'h equals pile count', hint: 'No spare hours: the answer is max(piles), your upper bound.', args: [[3, 6, 7, 11], 4], expected: 11 },
    { scenario: 'Hours need rounding up', hint: 'A pile of 7 at speed 2 takes ceil(7/2) = 4 hours, not 3. Using floor division makes speed 2 look fast enough.', args: [[7], 3], expected: 3 },
    { scenario: 'Order does not matter', hint: 'Same piles as Example 1 in another order — each pile is independent, so the answer is unchanged.', args: [[11, 7, 6, 3], 8], expected: 4 },
    { scenario: 'All piles equal', hint: 'Four piles of 4 in 6 hours: speed 3 still needs 2 hours per pile (8 > 6), so the answer is 4.', args: [[4, 4, 4, 4], 6], expected: 4 },
    { scenario: 'One huge pile', hint: 'A 10^9 pile in 2 hours needs speed 5·10^8. Use `Math.floor((lo + hi) / 2)` — avoid bit tricks on values this large.', args: [[1000000000], 2], expected: 500000000 },
    { scenario: 'Two huge piles, 3 hours', hint: 'Speed 10^9 - 1 would need 4 hours, so the answer is the maximum, 10^9.', args: [[1000000000, 1000000000], 3], expected: 1000000000 },
    { scenario: 'One spare hour', hint: 'h = pile - 1: speed 1 needs one hour too many, so the answer is 2.', args: [[312884470], 312884469], expected: 2 },
    { scenario: 'Large input (n = 10^4)', hint: 'Piles up to 10^9: trying speeds 1, 2, 3, … is hopeless. Binary search the speed between 1 and max(piles).', argsGen: '() => { let s = 3; const p = Array.from({ length: 10000 }, () => { s = (s * 48271) % 2147483647; return (s % 1000000000) + 1; }); return [p, 20000]; }', expected: 322024103, timeLimitMs: 1000 },
    { scenario: 'Large input, many hours', hint: 'With h = 10^9 the answer is small, but the total hours (up to ~10^13) must still be summed without overflow tricks.', argsGen: '() => { let s = 3; const p = Array.from({ length: 10000 }, () => { s = (s * 48271) % 2147483647; return (s % 1000000000) + 1; }); return [p, 1000000000]; }', expected: 4717 },
  ],

  solution: {
    code: `function minEatingSpeed(piles, h) {
  const hoursAt = (k) => {
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / k);
    return hours;
  };

  let lo = 1, hi = 0;
  for (const p of piles) hi = Math.max(hi, p);   // max speed ever needed

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);        // values up to 1e9: avoid >> on sums
    if (hoursAt(mid) <= h) hi = mid;               // fast enough → try slower
    else lo = mid + 1;                             // too slow
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'hours(mid)', 'decision'],
    rows: [
      ['1', '11', '6', '6', '≤ 8 → hi = 6'],
      ['1', '6', '3', '10', '> 8 → lo = 4'],
      ['4', '6', '5', '8', '≤ 8 → hi = 5'],
      ['4', '5', '4', '8', '≤ 8 → hi = 4'],
      ['4', '4', '—', '—', 'return 4'],
    ],
  },
  complexity: { time: 'O(n log M)', space: 'O(1)', explanation: 'M = max(piles). log₂(10^9) ≈ 30 feasibility checks of O(n) each.' },
  alternative: {
    title: 'Tighter lower bound',
    md: 'Start `lo = Math.ceil(sum / h)`: she must eat at least sum/h bananas per hour on average. Same complexity, a few iterations fewer.',
    complexity: 'O(n log M) time, O(1) space',
  },
  mistakes: [
    'Starting lo at 0 → `Math.ceil(p / 0)` is Infinity.',
    'Using `(lo + hi) >> 1` — lo + hi can reach 2·10^9 > 2^31 − 1 and become negative.',
    'Thinking the eating order matters; each pile is independent.',
  ],
};
