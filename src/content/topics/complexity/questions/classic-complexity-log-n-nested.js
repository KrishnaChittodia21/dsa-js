export default {
  id: 'classic-complexity-log-n-nested',
  title: 'Nested Loops with Doubling and Halving',
  difficulty: 'Hard',
  order: 1,
  kind: 'quiz',
  pattern: 'complexity-logarithmic-halving',
  tags: ['big-o', 'logarithm', 'geometric series'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `Compare the two functions. What are their time complexities?

\`\`\`js
function f(n) {
  let c = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 1; j < n; j *= 2) c++;   // inner doubles
  }
  return c;
}

function g(n) {
  let c = 0;
  for (let i = n; i >= 1; i = Math.floor(i / 2)) {
    for (let j = 0; j < i; j++) c++;      // inner runs i times
  }
  return c;
}
\`\`\``,
  examples: [{ input: 'n = 8', output: 'f(8) = 8 · 3 = 24, g(8) = 8 + 4 + 2 + 1 = 15' }],
  constraints: ['Give tight bounds (the smallest correct Big-O)'],
  think: `- In f, does the inner loop's length depend on i?
- In g, the inner loop runs n, then n/2, then n/4 … times. What does that sum to?`,
  patternChallenge: {
    options: ['Amortized Analysis', 'Constraints → Target Complexity', 'Halving / Doubling → Logarithms', 'Hidden Costs of JavaScript Built-ins'],
    answer: 2,
    explanation: 'Both functions have a loop whose variable doubles or halves; the trick is how the logarithm combines with the other loop.',
  },
  hints: ['f: the inner loop always runs ⌈log₂ n⌉ times regardless of i, and the outer loop runs n times.', 'g: n + n/2 + n/4 + … is a geometric series bounded by 2n.'],
  approach: `**f:** n outer iterations × log₂ n inner iterations each → **O(n log n)**.

**g:** the outer loop runs log n times, but the inner work shrinks: n + n/2 + n/4 + … + 1 < 2n → **O(n)**. "log n × n" is only an upper bound; it is not tight because most rounds do far less than n work.

General rule: a sum whose terms shrink by a constant factor is dominated by its largest term.`,

  quiz: {
    options: ['f: O(n log n), g: O(n log n)', 'f: O(n log n), g: O(n)', 'f: O(n²), g: O(log n)', 'f: O(n), g: O(n log n)'],
    answer: 1,
    explanation: 'f does log n work for each of n values of i → O(n log n). g does n + n/2 + n/4 + … ≤ 2n work in total → O(n). Multiplying "log n rounds × up to n work" overestimates g.',
  },
  dryRun: { columns: ['n', 'f(n)', 'g(n)'], rows: [['8', '24', '15'], ['16', '64', '31'], ['1024', '10240', '2047']] },
  complexity: { time: 'f: O(n log n), g: O(n)', space: 'O(1)', explanation: 'Constant-factor shrinking sums to a constant multiple of the first term.' },
  mistakes: ['Multiplying outer iterations by the MAXIMUM inner work when the inner work shrinks geometrically', 'Treating `j *= 2` like `j++`'],
};
