export default {
  id: 'classic-complexity-halving',
  title: 'Halving Loop',
  difficulty: 'Easy',
  order: 3,
  kind: 'quiz',
  pattern: 'complexity-logarithmic-halving',
  tags: ['big-o', 'logarithm'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What is the time complexity of this function in terms of the number \`n\`?

\`\`\`js
function countHalvings(n) {
  let steps = 0;
  while (n > 1) {
    n = Math.floor(n / 2);
    steps++;
  }
  return steps;
}
\`\`\``,
  examples: [{ input: 'n = 16', output: '4', explanation: '16 → 8 → 4 → 2 → 1: four halvings.' }],
  constraints: ['1 <= n <= 10^18 (conceptually)'],
  think: `- How many iterations for n = 16? For n = 1024? For n = 1,000,000?
- What mathematical function answers "how many times can I halve n"?`,
  patternChallenge: {
    options: ['Amortized Analysis', 'Halving / Doubling → Logarithms', 'Counting Loop Iterations (linear)', 'Recursion: Call Tree & Stack Depth'],
    answer: 1,
    explanation: 'The loop variable is divided by 2 each step — the textbook sign of a logarithm.',
  },
  hints: ['Try n = 8, 16, 32 and count iterations: 3, 4, 5.', 'Doubling n adds only ONE iteration.'],
  approach: `After k iterations n has become about n / 2ᵏ. The loop stops when n / 2ᵏ ≤ 1, i.e. k ≥ log₂ n. So it runs ⌊log₂ n⌋ times → **O(log n)**. Space O(1).`,

  quiz: {
    options: ['O(n)', 'O(n / 2)', 'O(√n)', 'O(log n)'],
    answer: 3,
    explanation: 'Each iteration halves n, so the number of iterations is log₂ n. For n = 1,000,000 that is only about 20 iterations.',
  },
  dryRun: { columns: ['iteration', 'n after'], rows: [['1', '8'], ['2', '4'], ['3', '2'], ['4', '1 → stop']] },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'The remaining value halves every step.' },
  mistakes: ['Answering O(n / 2) — that would be `n -= 2`; subtracting is linear, dividing is logarithmic', 'Thinking the log base matters — log₂ and log₁₀ differ by a constant factor'],
};
