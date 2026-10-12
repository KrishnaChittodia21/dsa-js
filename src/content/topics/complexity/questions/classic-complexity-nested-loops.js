export default {
  id: 'classic-complexity-nested-loops',
  title: 'Triangle Nested Loops',
  difficulty: 'Easy',
  order: 2,
  kind: 'quiz',
  pattern: 'complexity-loop-counting',
  tags: ['big-o', 'nested loops'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What is the time complexity of \`countPairs\`?

\`\`\`js
function countPairs(nums, target) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) count++;
    }
  }
  return count;
}
\`\`\``,
  examples: [{ input: 'nums = [1, 2, 3, 4], target = 5', output: '2', explanation: 'Pairs (1,4) and (2,3). The inner body ran 3 + 2 + 1 = 6 times.' }],
  constraints: ['n = nums.length'],
  think: `- How many times does the inner body run when i = 0? When i = 1? When i = n − 1?
- What is the sum of those counts?`,
  patternChallenge: {
    options: ['Counting Loop Iterations', 'Halving / Doubling → Logarithms', 'Amortized Analysis', 'Constraints → Target Complexity'],
    answer: 0,
    explanation: 'Two nested loops with `++` steps — add up the inner iterations. The inner index j is re-initialised every outer iteration, so there is no amortization.',
  },
  hints: ['The inner loop runs n − 1, then n − 2, …, then 0 times.', '1 + 2 + … + (n − 1) = n(n − 1) / 2.'],
  approach: `Inner iterations: (n−1) + (n−2) + … + 1 + 0 = n(n−1)/2 = n²/2 − n/2.
Drop the constant ½ and the lower-order n/2 → **O(n²)**. Space O(1).`,

  quiz: {
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2n)'],
    answer: 2,
    explanation: 'The body runs n(n−1)/2 times. Starting j at i + 1 halves the work compared with a full n × n grid, but halving is a constant factor, so it is still O(n²).',
  },
  dryRun: { columns: ['i', 'inner iterations (n = 5)'], rows: [['0', '4'], ['1', '3'], ['2', '2'], ['3', '1'], ['4', '0'], ['total', '10 = 5·4/2']] },
  complexity: { time: 'O(n²)', space: 'O(1)', explanation: 'n(n−1)/2 pair checks; only counters are stored.' },
  mistakes: ['Writing O(2n) — nested loops multiply, they do not add', 'Thinking the shrinking inner loop gives n log n — it shrinks by 1, not by half'],
};
