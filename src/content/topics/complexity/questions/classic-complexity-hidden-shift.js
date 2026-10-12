export default {
  id: 'classic-complexity-hidden-shift',
  title: 'The Hidden Cost of shift()',
  difficulty: 'Medium',
  order: 2,
  kind: 'quiz',
  pattern: 'complexity-hidden-costs-js',
  tags: ['big-o', 'arrays', 'queue'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise (JavaScript-specific)' },

  statement: `What is the worst-case time complexity of \`drain\` for an array of length \`n\`?

\`\`\`js
function drain(items) {
  const queue = [...items];
  let total = 0;
  while (queue.length > 0) {
    const x = queue.shift();   // remove from the front
    total += x;
  }
  return total;
}
\`\`\``,
  examples: [{ input: 'items = [1, 2, 3]', output: '6' }],
  constraints: ['Assume the array is a regular dense array (engines may optimise small arrays, but the specification behaviour is that remaining elements are re-indexed)'],
  think: `- After \`shift()\`, what index does the old element 1 get? And element 2?
- How many elements move on each shift, and how many shifts are there?`,
  patternChallenge: {
    options: ['Amortized Analysis', 'Hidden Costs of JavaScript Built-ins', 'Halving / Doubling → Logarithms', 'Constraints → Target Complexity'],
    answer: 1,
    explanation: 'The loop runs n times; the trap is that one innocent-looking built-in call inside it is itself O(n).',
  },
  hints: ['shift() removes index 0, so every remaining element must move down by one index.', 'The k-th shift moves about n − k elements.'],
  approach: `Each \`shift()\` re-indexes all remaining elements: (n−1) + (n−2) + … + 0 = O(n²) total.

**Fix:** keep a head index and read \`queue[head++]\` (O(1)), or use a real queue (the toolkit's \`Queue\`/\`Deque\`, covered in the Queue & Deque topic). Then the whole function is O(n). The same applies to \`unshift\`, which moves everything up.`,

  quiz: {
    options: ['O(n) — the loop runs n times', 'O(n log n)', 'O(n²) — each shift moves all remaining elements', 'O(1) — shift is constant time'],
    answer: 2,
    explanation: 'shift() is O(n) on an array because the remaining elements are renumbered. n shifts cost about n²/2 moves → O(n²). A head pointer makes each dequeue O(1).',
  },
  dryRun: { columns: ['shift #', 'elements left before', 'elements moved'], rows: [['1', '4', '3'], ['2', '3', '2'], ['3', '2', '1'], ['4', '1', '0']] },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'n shifts × O(n) re-indexing each; the copy uses O(n) space.' },
  alternative: {
    title: 'Head index instead of shift',
    md: 'Read with an index that only moves forward. Nothing is re-indexed.',
    code: `function drain(items) {
  let total = 0;
  for (let head = 0; head < items.length; head++) total += items[head];
  return total;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: ['Treating shift/unshift like pop/push — only the END of an array is cheap', 'Using array.shift() as the queue in BFS on large graphs'],
};
