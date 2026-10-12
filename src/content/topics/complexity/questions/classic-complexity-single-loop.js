export default {
  id: 'classic-complexity-single-loop',
  title: 'Single Loop with Early Exit',
  difficulty: 'Easy',
  order: 1,
  kind: 'quiz',
  pattern: 'complexity-loop-counting',
  tags: ['big-o', 'loops', 'worst case'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What is the **worst-case** time complexity of this function, where \`n = arr.length\`?

\`\`\`js
function findFirstNegative(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < 0) return i;   // stops as soon as it finds one
  }
  return -1;
}
\`\`\``,
  examples: [{ input: 'arr = [3, 5, -2, 7]', output: '2', explanation: 'Stops after 3 checks — but that is one lucky input.' }],
  constraints: ['Answer for the worst case unless stated otherwise'],
  think: `- Which input makes this function do the MOST work?
- Does returning early change how the work grows in that worst input?`,
  patternChallenge: {
    options: ['Halving / Doubling → Logarithms', 'Amortized Analysis', 'Counting Loop Iterations', 'Recursion: Call Tree & Stack Depth'],
    answer: 2,
    explanation: 'A single `i++` loop over the input: count its iterations in the worst case. Nothing is halved, recursive or amortized.',
  },
  hints: ['Imagine an array with no negative numbers at all.', 'In that case the loop visits every one of the n elements before returning -1.'],
  approach: `Best case: the first element is negative → 1 step, O(1).
Worst case: no negatives (or only the last one) → n iterations, each O(1) → **O(n)**.
Space: only \`i\` → O(1).`,

  quiz: {
    options: ['O(1) — it can return immediately', 'O(log n) — it stops early', 'O(n²)', 'O(n)'],
    answer: 3,
    explanation: 'The early `return` helps the best case only. In the worst case (no negative number) the loop checks all n elements, each in O(1) → O(n) time and O(1) space.',
  },
  dryRun: 'arr = [1, 2, 3, 4] → i = 0, 1, 2, 3 all checked (4 = n steps), then return -1.',
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'At most n constant-time iterations; one index variable.' },
  mistakes: ['Quoting the best case (O(1)) as the complexity', 'Thinking "stops early" means logarithmic — log n requires halving the remaining work each step'],
};
