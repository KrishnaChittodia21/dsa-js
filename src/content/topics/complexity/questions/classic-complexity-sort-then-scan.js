export default {
  id: 'classic-complexity-sort-then-scan',
  title: 'Sort, Then Scan',
  difficulty: 'Easy',
  order: 5,
  kind: 'quiz',
  pattern: 'complexity-loop-counting',
  tags: ['big-o', 'sorting', 'sequential steps'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise' },

  statement: `What is the time and space complexity of \`hasDuplicate\`?

\`\`\`js
function hasDuplicate(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) return true;
  }
  return false;
}
\`\`\``,
  examples: [{ input: 'nums = [3, 1, 3]', output: 'true', explanation: 'sorted = [1, 3, 3]; neighbours 3 and 3 are equal.' }],
  constraints: ['n = nums.length'],
  think: `- What does each line cost on its own: the spread, the sort, the loop?
- Are those costs added or multiplied?`,
  patternChallenge: {
    options: ['Counting Loop Iterations (add sequential steps)', 'Amortized Analysis', 'Recursion: Call Tree & Stack Depth', 'Halving / Doubling → Logarithms'],
    answer: 0,
    explanation: 'Three sequential pieces: copy, sort, scan. Add their costs and keep the dominant one.',
  },
  hints: ['The spread copy is O(n) time and space; sort is O(n log n); the loop is O(n).', 'Sequential pieces add; the biggest term wins.'],
  approach: `O(n) copy + O(n log n) sort + O(n) scan = **O(n log n)** time. The copy holds n numbers → **O(n)** extra space (plus whatever the engine's sort uses internally).

We copied so the caller's array is not mutated — \`sort\` sorts in place. Without the copy, extra space would be the sort's internal usage only, but we would have modified the input.`,

  quiz: {
    options: ['O(n²) time, O(1) space', 'O(n log n) time, O(n) space', 'O(n) time, O(n) space', 'O(n log² n) time, O(1) space'],
    answer: 1,
    explanation: 'The sort dominates the time: O(n) + O(n log n) + O(n) = O(n log n). `[...nums]` allocates a full copy, so space is O(n).',
  },
  dryRun: 'n = 8: copy 8, sort ≈ 8·3 = 24 comparisons, scan 7 → ≈ 39 steps; the sort term dominates as n grows.',
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the spread copy uses linear space.' },
  mistakes: ['Multiplying the sort by the scan (O(n² log n)) — they run one after another', 'Forgetting that [...nums] is a full O(n) copy', 'Calling nums.sort() without a comparator — it sorts numbers as strings ([10, 9, 1] → [1, 10, 9])'],
};
