export default {
  id: 'classic-complexity-two-inputs',
  title: 'Two Different Input Sizes',
  difficulty: 'Easy',
  order: 4,
  kind: 'quiz',
  pattern: 'complexity-loop-counting',
  tags: ['big-o', 'multiple inputs'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `\`a\` has length \`n\` and \`b\` has length \`m\`. What is the time complexity?

\`\`\`js
function printAllThenPairs(a, b) {
  for (const x of a) console.log(x);
  for (const y of b) console.log(y);
  for (const x of a) {
    for (const y of b) console.log(x, y);
  }
}
\`\`\``,
  examples: [{ input: 'a = [1, 2], b = ["x", "y", "z"]', output: '2 + 3 + 2·3 = 11 lines printed' }],
  constraints: ['n and m are independent — either can be much larger than the other'],
  think: `- Which parts run one after another, and which part is nested?
- Is it safe to call both sizes "n"?`,
  patternChallenge: {
    options: ['Constraints → Target Complexity', 'Halving / Doubling → Logarithms', 'Amortized Analysis', 'Counting Loop Iterations'],
    answer: 3,
    explanation: 'Plain loops: add the sequential ones, multiply the nested one — keeping n and m as separate variables.',
  },
  hints: ['The first two loops cost n and m. The nested loop costs n · m.', 'Total n + m + n·m. Which term dominates when both are ≥ 1?'],
  approach: `Cost = n + m + n·m. For n, m ≥ 1 we have n·m ≥ n and n·m ≥ m, so n + m + n·m ≤ 3·n·m. The dominant term is n·m → **O(n·m)**.

Keeping the variables separate matters: if m is tiny (say 3) the code is effectively linear in n; calling it O(n²) would be wrong.`,

  quiz: {
    options: ['O(n²)', 'O(n + m)', 'O(n · m)', 'O(n + m + n²)'],
    answer: 2,
    explanation: 'n + m + n·m, and n·m dominates both n and m. The inputs are independent, so we must not rename m to n.',
  },
  dryRun: 'n = 1000, m = 2 → 1000 + 2 + 2000 ≈ linear in n. n = m = 1000 → about 10⁶. The formula O(n·m) captures both cases; "O(n²)" captures neither.',
  complexity: { time: 'O(n · m)', space: 'O(1)', explanation: 'Printing aside, no extra memory grows with the inputs.' },
  mistakes: ['Collapsing two different sizes into a single n', 'Adding the nested loop instead of multiplying'],
};
