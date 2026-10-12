export default {
  id: 'classic-complexity-space-recursion',
  title: 'Space of a Recursive Function',
  difficulty: 'Medium',
  order: 5,
  kind: 'quiz',
  pattern: 'complexity-recursion-analysis',
  tags: ['big-o', 'space complexity', 'call stack'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What is the **space** complexity (extra memory) of each version? \`n = arr.length\`.

\`\`\`js
// Version 1: index parameter
function sum1(arr, i = 0) {
  if (i === arr.length) return 0;
  return arr[i] + sum1(arr, i + 1);
}

// Version 2: slicing
function sum2(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + sum2(arr.slice(1));
}
\`\`\``,
  examples: [{ input: 'arr = [1, 2, 3]', output: '6 (both versions)' }],
  constraints: ['Count the call stack and any arrays that are alive at the same time'],
  think: `- How many calls are waiting on the stack at the deepest point?
- In version 2, how big is each slice, and are they all alive at once?`,
  patternChallenge: {
    options: ['Recursion: Call Tree & Stack Depth', 'Amortized Analysis', 'Halving / Doubling → Logarithms', 'Constraints → Target Complexity'],
    answer: 0,
    explanation: 'Space of recursion = depth of the stack × memory each frame keeps alive.',
  },
  hints: ['Both versions recurse n levels deep.', 'Version 2: frame k holds a slice of length n − k, and the slices stay alive until their calls return.'],
  approach: `**Version 1:** n + 1 frames, each O(1) → **O(n) space** (the stack). Time O(n).

**Version 2:** also n frames, but frame k keeps a slice of length n − k alive → n + (n−1) + … + 1 = **O(n²) space**. It is also O(n²) time, because each slice copies.

Also note: with n around 10⁴–10⁵, both versions can hit JavaScript's call-stack limit (RangeError). A plain loop is O(1) space.`,

  quiz: {
    options: ['V1: O(1), V2: O(n)', 'V1: O(n), V2: O(n)', 'V1: O(log n), V2: O(n log n)', 'V1: O(n), V2: O(n²)'],
    answer: 3,
    explanation: 'Version 1 is n frames of O(1) each → O(n). Version 2 is also n frames deep, but each keeps its own shrinking copy alive: n + (n−1) + … + 1 = O(n²).',
  },
  dryRun: { columns: ['depth', 'V1 frame keeps', 'V2 frame keeps'], rows: [['0', 'i = 0', 'array of 4'], ['1', 'i = 1', 'array of 3'], ['2', 'i = 2', 'array of 2'], ['3', 'i = 3', 'array of 1'], ['total', '4 numbers → O(n)', '10 elements → O(n²)']] },
  complexity: { time: 'V1: O(n), V2: O(n²)', space: 'V1: O(n), V2: O(n²)', explanation: 'Call stack depth n; slicing adds O(n) per level.' },
  mistakes: ['Calling a recursive function O(1) space because it creates no arrays — the stack counts', 'Passing slices/spreads into recursive calls instead of indices'],
};
