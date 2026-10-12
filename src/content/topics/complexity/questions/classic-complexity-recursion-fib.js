export default {
  id: 'classic-complexity-recursion-fib',
  title: 'Naive Recursive Fibonacci',
  difficulty: 'Medium',
  order: 3,
  kind: 'quiz',
  pattern: 'complexity-recursion-analysis',
  tags: ['big-o', 'recursion', 'exponential'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What are the time and space complexities of this function?

\`\`\`js
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
\`\`\``,
  examples: [{ input: 'n = 5', output: '5', explanation: 'fib(5) makes 15 calls in total.' }],
  constraints: ['0 <= n <= 40 (it becomes unbearably slow beyond that)'],
  think: `- Draw the call tree for fib(4). How many nodes does it have?
- At any moment, which calls are still waiting on the stack?`,
  patternChallenge: {
    options: ['Counting Loop Iterations', 'Recursion: Call Tree & Stack Depth', 'Amortized Analysis', 'Hidden Costs of JavaScript Built-ins'],
    answer: 1,
    explanation: 'The function calls itself twice — analyse the call tree (nodes → time, height → space).',
  },
  hints: ['Every call (except base cases) makes two more calls, and the depth is about n.', 'Only one root-to-leaf path is on the stack at any time.'],
  approach: `**Time:** number of calls. C(n) = C(n−1) + C(n−2) + 1, which grows like φⁿ ≈ 1.618ⁿ. We usually write the simple upper bound **O(2ⁿ)** (branching factor 2, depth n).

**Space:** the deepest chain of pending calls is fib(n) → fib(n−1) → … → fib(1): **O(n)**.

**Fix:** memoization or a bottom-up loop computes each fib(k) once → O(n) time (Dynamic Programming topic).`,

  quiz: {
    options: ['O(n) time, O(n) space', 'O(2ⁿ) time, O(2ⁿ) space', 'O(2ⁿ) time, O(n) space', 'O(n²) time, O(1) space'],
    answer: 2,
    explanation: 'The call tree has ~2ⁿ nodes (tight bound ~1.618ⁿ), so time is exponential. But memory holds only the current root-to-leaf path, which is n calls deep → O(n) space.',
  },
  dryRun: { columns: ['n', 'total calls'], rows: [['1', '1'], ['2', '3'], ['3', '5'], ['4', '9'], ['5', '15'], ['10', '177'], ['30', '≈ 2.7 million']] },
  complexity: { time: 'O(2ⁿ) (tight: Θ(φⁿ))', space: 'O(n)', explanation: 'Call-tree size vs call-tree height.' },
  mistakes: ['Using depth to estimate time (depth gives space)', 'Assuming all 2ⁿ calls occupy memory simultaneously', 'Forgetting the recursion stack when stating space'],
};
