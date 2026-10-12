export default {
  id: 'classic-complexity-constraints',
  title: 'Reading Constraints',
  difficulty: 'Easy',
  order: 6,
  kind: 'quiz',
  pattern: 'complexity-constraints-to-target',
  tags: ['big-o', 'constraints'],
  source: { platform: 'Classic', note: 'Standard interview-preparation skill' },

  statement: `A problem says:

\`\`\`text
1 <= nums.length <= 2 * 10^5
-10^9 <= nums[i] <= 10^9
Time limit: 1 second
\`\`\`

You have four ideas. Which is the **slowest one that will still pass** comfortably?

\`\`\`js
// A: try every subset                        O(2^n)
// B: check every pair (nested loops)         O(n^2)
// C: sort, then one scan                     O(n log n)
// D: loop over every value from -1e9 to 1e9  O(range) = O(2·10^9)
\`\`\``,
  examples: [{ input: 'n = 2·10^5', output: 'n² = 4·10^10 steps (too slow); n log n ≈ 3.5·10^6 steps (fast)' }],
  constraints: ['Assume roughly 10^8 simple operations per second (JavaScript: plan for a bit less)'],
  think: `- Plug n = 2·10^5 into each complexity. How many operations is that?
- Which ones stay well under ~10^8?`,
  patternChallenge: {
    options: ['Counting Loop Iterations', 'Amortized Analysis', 'Hidden Costs of JavaScript Built-ins', 'Constraints → Target Complexity'],
    answer: 3,
    explanation: 'The question is literally "given the limits, which complexity is acceptable?"',
  },
  hints: ['n² = (2·10^5)² = 4·10^10.', 'log₂(2·10^5) ≈ 18, so n log n ≈ 3.6·10^6.'],
  approach: `- A: 2^200000 — astronomically large.
- B: 4·10^10 — about 400 seconds at 10^8 ops/s.
- C: ≈ 3.6·10^6 — milliseconds.
- D: 2·10^9 — about 20 seconds; values up to 10⁹ mean you may never loop over the value range.

Only **C** passes. Rule of thumb: n ≤ 10^5–10^6 ⇒ aim for O(n log n) or O(n).`,

  quiz: {
    options: ['A — O(2ⁿ)', 'B — O(n²)', 'C — O(n log n)', 'D — O(value range)'],
    answer: 2,
    explanation: 'n log n ≈ 3.6 million steps. n² is 4·10^10 (minutes), 2ⁿ is impossible, and looping over a 2·10^9 value range is ~20× over budget.',
  },
  dryRun: { columns: ['idea', 'operations', 'verdict'], rows: [['A', '2^200000', 'impossible'], ['B', '4·10^10', 'TLE'], ['C', '≈3.6·10^6', 'passes'], ['D', '2·10^9', 'TLE']] },
  complexity: { time: 'Target: O(n log n) or better', space: '—', explanation: 'n ≤ 10^5–10^6 ⇒ sorting, hashing or linear scans.' },
  mistakes: ['Looping over the VALUE range when values go up to 10^9', 'Assuming n² is fine because "computers are fast"'],
};
