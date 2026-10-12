export default {
  id: 'teemo-attacking',
  title: 'Teemo Attacking',
  difficulty: 'Easy',
  order: 3,
  pattern: 'intervals-merge',
  tags: ['array', 'simulation', 'intervals'],
  source: { platform: 'LeetCode', number: 495, url: 'https://leetcode.com/problems/teemo-attacking/' },

  statement: `A hero poisons an enemy. An attack at second \`t\` keeps the enemy poisoned during the half-open time range \`[t, t + duration)\`. If a new attack lands while the enemy is still poisoned, the poison timer is **reset**: it now ends at \`t + duration\` (it does not stack).

Given the attack times \`timeSeries\` in non-decreasing order and \`duration\`, return the **total number of seconds** the enemy is poisoned.`,
  examples: [
    { input: 'timeSeries = [1,4], duration = 2', output: '4', explanation: 'Poisoned during [1,3) and [4,6): 2 + 2 seconds.' },
    { input: 'timeSeries = [1,2], duration = 2', output: '3', explanation: '[1,3) and [2,4) overlap; their union [1,4) lasts 3 seconds.' },
  ],
  constraints: ['1 <= timeSeries.length <= 10^4', '0 <= timeSeries[i], duration <= 10^7', 'timeSeries is sorted in non-decreasing order'],

  think: `- Each attack is an interval. The answer is the **length of the union** of all intervals.
- The intervals are already sorted by start. How much *new* poison time does attack \`i\` add before attack \`i + 1\` happens?
- Do you even need to build the merged list?`,
  patternChallenge: {
    options: ['Sweep line with a heap', 'Merge sorted intervals and sum the union length', 'Sliding window of size duration', 'Binary search on the answer'],
    answer: 1,
    explanation: 'Attacks are intervals `[t, t + duration)` sorted by start. The total poisoned time is the length of their union — the merge pattern, done in a single running sum.',
  },
  hints: [
    'Attack i contributes at most `duration` seconds, but the next attack may cut it short.',
    'Contribution of attack i = `Math.min(duration, timeSeries[i + 1] - timeSeries[i])`; the last attack contributes the full `duration`.',
  ],
  approach: `**Brute force:** mark every poisoned second in a Set and return its size — O(n · duration), too slow for duration up to 10⁷.

**Merge view:** build intervals \`[t, t + duration)\`, merge them, and sum the lengths. Because they are already sorted, merging is one pass.

**Even simpler:** between two consecutive attacks the enemy is poisoned for \`min(duration, gap)\` seconds — either the poison runs out before the next hit, or the next hit resets it. Add \`duration\` for the final attack.`,

  functionName: 'findPoisonedDuration',
  paramNames: ['timeSeries', 'duration'],
  starterCode: `/**
 * @param {number[]} timeSeries
 * @param {number} duration
 * @return {number}
 */
function findPoisonedDuration(timeSeries, duration) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two attacks far enough apart: 2 + 2 seconds.', args: [[1, 4], 2], expected: 4 },
    { scenario: 'Example 2', hint: 'Overlapping poison windows: the second attack resets the timer, so only the union (3 seconds) counts.', args: [[1, 2], 2], expected: 3 },
    { scenario: 'Single attack', hint: 'One attack poisons for exactly `duration` seconds — make sure the last attack is counted.', args: [[5], 10], expected: 10 },
    { scenario: 'Every second overlaps', hint: 'Adding `duration` per attack double-counts overlaps (25 instead of 9).', args: [[1, 2, 3, 4, 5], 5], expected: 9 },
    { scenario: 'Simultaneous attacks', hint: 'Attacks at the same moment add nothing extra — the gap is 0.', args: [[1, 1, 1], 3], expected: 3 },
    { scenario: 'Zero duration', hint: 'Duration 0 means no poison at all.', args: [[1, 2, 3], 0], expected: 0 },
    { scenario: 'Attack at time 0', hint: 'Time 0 is valid; gaps exactly equal to duration just touch and add fully.', args: [[0, 10, 20], 10], expected: 30 },
    { scenario: 'Gap smaller than duration', hint: 'Between attacks add min(duration, gap); here the gaps vary.', args: [[1, 3, 10, 11], 4], expected: 11 },
    { scenario: 'Last attack full duration', hint: 'Only the final attack always lasts its full duration — forgetting it loses 7 seconds.', args: [[0, 2], 7], expected: 9 },
    { scenario: 'Huge duration values', hint: 'Duration and times up to 10^7 — the total can reach 2·10^7.', args: [[0, 10000000], 10000000], expected: 20000000 },
    { scenario: 'Zero duration, single attack', hint: 'Smallest inputs: one attack with duration 0 gives 0.', args: [[0], 0], expected: 0 },
    { scenario: 'Large input (n = 10^4)', hint: 'Marking every poisoned second in a Set is O(n · duration) — 1.5·10^7 inserts here. Sum min(duration, gap) instead: O(n).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 1500 * i + (i % 7)), 1500]', expected: 14991432, timeLimitMs: 500 },
  ],

  solution: {
    code: `function findPoisonedDuration(timeSeries, duration) {
  let total = 0;
  for (let i = 0; i < timeSeries.length - 1; i++) {
    // poison lasts 'duration' unless the next attack resets it earlier
    total += Math.min(duration, timeSeries[i + 1] - timeSeries[i]);
  }
  return total + duration; // the last attack always runs its full course
}`,
    explanation: 'This is the length of the union of sorted intervals computed on the fly: overlapping parts are counted once because each interval is clipped at the next start.',
  },
  dryRun: {
    columns: ['i', 'gap to next', 'added', 'total'],
    rows: [
      ['0 (t=1)', '2 − 1 = 1', 'min(2, 1) = 1', '1'],
      ['last (t=2)', '—', 'duration = 2', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass over the attack times.' },
  alternative: {
    title: 'Explicit merge',
    md: 'Keep `[curStart, curEnd)`; for each attack if the attack lands while still poisoned (`t <= curEnd`; merging touching blocks is harmless here) extend `curEnd = t + duration`, otherwise add `curEnd − curStart` and start a new block.',
    code: `function findPoisonedDuration(timeSeries, duration) {
  let total = 0, curStart = timeSeries[0], curEnd = timeSeries[0] + duration;
  for (let i = 1; i < timeSeries.length; i++) {
    const t = timeSeries[i];
    if (t <= curEnd) curEnd = t + duration;
    else { total += curEnd - curStart; curStart = t; curEnd = t + duration; }
  }
  return total + curEnd - curStart;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Adding `duration` for every attack (double-counts overlaps).',
    'Forgetting the final attack\'s full duration.',
    'Simulating second by second — duration can be 10⁷.',
  ],
};
