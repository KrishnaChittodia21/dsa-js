export default {
  id: 'classic-complexity-amortized-push',
  title: 'Amortized Cost of push()',
  difficulty: 'Medium',
  order: 4,
  kind: 'quiz',
  pattern: 'complexity-amortized-analysis',
  tags: ['big-o', 'amortized', 'dynamic array'],
  source: { platform: 'Classic', note: 'Standard dynamic-array analysis' },

  statement: `Here is a simplified dynamic array. When it is full it allocates **double** the capacity and copies everything over. What is the total cost of calling \`push\` \`n\` times on an empty \`DynArray\`?

\`\`\`js
class DynArray {
  constructor() { this.cap = 1; this.size = 0; this.data = new Array(1); }
  push(x) {
    if (this.size === this.cap) {
      this.cap *= 2;
      const bigger = new Array(this.cap);
      for (let i = 0; i < this.size; i++) bigger[i] = this.data[i]; // copy
      this.data = bigger;
    }
    this.data[this.size++] = x;
  }
}
\`\`\``,
  examples: [{ input: 'n = 9 pushes', output: 'copies: 1 + 2 + 4 + 8 = 15, writes: 9 → 24 steps total' }],
  constraints: ['JavaScript arrays grow in a similar geometric way internally'],
  think: `- When do resizes happen? At sizes 1, 2, 4, 8, …
- What is 1 + 2 + 4 + … + (something ≤ n)?`,
  patternChallenge: {
    options: ['Recursion: Call Tree & Stack Depth', 'Constraints → Target Complexity', 'Halving / Doubling → Logarithms', 'Amortized Analysis'],
    answer: 3,
    explanation: 'Individual operations are sometimes O(n); the question asks about the total over a sequence — that is amortized analysis.',
  },
  hints: ['A resize happens only when size is a power of two.', 'A geometric series 1 + 2 + 4 + … + 2ᵏ equals 2ᵏ⁺¹ − 1, which is less than twice its last term.'],
  approach: `The copies are 1 + 2 + 4 + … + 2ᵏ where 2ᵏ < n, which sums to < 2n. Add the n ordinary writes → < 3n steps → **O(n) total, O(1) amortized per push**.

Why doubling matters: if capacity grew by a *constant* (cap += 10), resizes would happen every 10 pushes and copy 10, 20, 30, … → O(n²) total.`,

  quiz: {
    options: ['O(n²) total — some pushes copy the whole array', 'O(n log n) total — there are log n resizes', 'O(n) total, i.e. O(1) amortized per push', 'O(log n) total'],
    answer: 2,
    explanation: 'Resizes copy 1, 2, 4, … elements; the sum is less than 2n. Plus n writes gives O(n) total, so each push costs O(1) amortized even though an individual push can cost O(n).',
  },
  dryRun: { columns: ['push #', 'resize?', 'copied', 'total work'], rows: [['1', 'no', '0', '1'], ['2', 'yes (1→2)', '1', '3'], ['3', 'yes (2→4)', '2', '6'], ['4', 'no', '0', '7'], ['5', 'yes (4→8)', '4', '12'], ['6–8', 'no', '0', '15'], ['9', 'yes (8→16)', '8', '24']] },
  complexity: { time: 'O(n) total, O(1) amortized per push', space: 'O(n)', explanation: 'Capacity is at most 2n.' },
  mistakes: ['Multiplying "log n resizes" by "n per resize" — resize costs grow geometrically, so their sum is O(n)', 'Confusing amortized with average-case: amortized holds for every sequence of pushes'],
};
