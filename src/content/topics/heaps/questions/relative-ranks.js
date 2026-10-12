export default {
  id: 'relative-ranks',
  title: 'Relative Ranks',
  difficulty: 'Easy',
  order: 3,
  pattern: 'heap-top-k',
  tags: ['heap', 'sorting', 'array'],
  source: { platform: 'LeetCode', number: 506, url: 'https://leetcode.com/problems/relative-ranks/' },

  statement: `\`score[i]\` is the score of athlete \`i\`; all scores are different. Rank the athletes by score (highest = 1st). Return an array \`answer\` where \`answer[i]\` is:

- \`"Gold Medal"\` for 1st place, \`"Silver Medal"\` for 2nd, \`"Bronze Medal"\` for 3rd;
- otherwise the placement number as a string (e.g. \`"4"\`).`,
  examples: [
    { input: 'score = [5,4,3,2,1]', output: '["Gold Medal","Silver Medal","Bronze Medal","4","5"]' },
    { input: 'score = [10,3,8,9,4]', output: '["Gold Medal","5","Bronze Medal","Silver Medal","4"]' },
  ],
  constraints: ['1 <= score.length <= 10^4', '0 <= score[i] <= 10^6', 'All scores are distinct'],

  think: `- You need athletes in order from highest to lowest score — but the output is indexed by the ORIGINAL position. What must you keep together with each score?
- Pop from a max-heap one by one: the i-th pop is the i-th place.`,
  patternChallenge: {
    options: ['Hash Map (complement lookup)', 'Sliding Window', 'Heap — repeated extraction of the largest (Top K with k = n)', 'Two Pointers'],
    answer: 2,
    explanation: 'Placements are the order in which a max-heap releases the scores. (Sorting indices by score is equivalent and equally good.) None of the other patterns produce an order.',
  },
  hints: [
    'Push `[score, index]` pairs into a max-heap keyed by score.',
    'Pop n times; the p-th pop (1-based) gets a medal for p ≤ 3, otherwise String(p), written at its original index.',
  ],
  approach: `**Brute force:** for each athlete, count how many scores are higher → O(n²).

**Heap:** push \`[score, i]\` into a max-heap (key = score). Pop repeatedly; the p-th pop is place p. Write the label into \`answer[i]\`. O(n log n).

**Equivalent:** sort the indices by score descending — same complexity, and often simpler when all data is known up front. The heap version generalises to "rank as scores arrive".`,

  functionName: 'findRelativeRanks',
  paramNames: ['score'],
  starterCode: `/**
 * @param {number[]} score
 * @return {string[]}
 */
function findRelativeRanks(score) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Already sorted descending: places follow the indices.', args: [[5, 4, 3, 2, 1]], expected: ['Gold Medal', 'Silver Medal', 'Bronze Medal', '4', '5'] },
    { scenario: 'Example 2', hint: 'Answers must be written back at each athlete\'s ORIGINAL index, not in sorted order.', args: [[10, 3, 8, 9, 4]], expected: ['Gold Medal', '5', 'Bronze Medal', 'Silver Medal', '4'] },
    { scenario: 'Single athlete', hint: 'n = 1: the only athlete gets gold.', args: [[1]], expected: ['Gold Medal'] },
    { scenario: 'Two athletes', hint: 'Only gold and silver are awarded.', args: [[1, 2]], expected: ['Silver Medal', 'Gold Medal'] },
    { scenario: 'Exactly three athletes', hint: 'All three medals, no numeric places.', args: [[3, 1, 2]], expected: ['Gold Medal', 'Bronze Medal', 'Silver Medal'] },
    { scenario: 'Ascending scores', hint: 'The last index has the highest score; losing the original index scrambles the output.', args: [[1, 2, 3, 4, 5, 6]], expected: ['6', '5', '4', 'Bronze Medal', 'Silver Medal', 'Gold Medal'] },
    { scenario: 'Places as strings', hint: 'Places 4 and beyond must be strings ("4"), not numbers.', args: [[7, 100, 3, 50]], expected: ['Bronze Medal', 'Gold Medal', '4', 'Silver Medal'] },
    { scenario: 'Default sort trap', hint: 'Default sort is lexicographic: "100" < "9". Sort numerically by score.', args: [[9, 100, 10, 1000, 2]], expected: ['4', 'Silver Medal', 'Bronze Medal', 'Gold Medal', '5'] },
    { scenario: 'Zero and maximum scores', hint: 'Scores range from 0 to 10^6.', args: [[0, 1000000, 5, 6, 7, 8]], expected: ['6', 'Gold Medal', '5', '4', 'Bronze Medal', 'Silver Medal'] },
    { scenario: 'Places beyond nine', hint: 'Double-digit places like "10" and "11".', args: [[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 12]], expected: ['Silver Medal', 'Bronze Medal', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Gold Medal'] },
    { scenario: 'Large input (n = 10^4)', hint: '10^4 distinct scores: use a heap or sort (O(n log n)) rather than counting higher scores for each athlete.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i * 7919) % 1000003)]', expectedGen: "() => { const [score] = (() => [Array.from({ length: 10000 }, (_, i) => (i * 7919) % 1000003)])(); const order = score.map((_, i) => i).sort((a, b) => score[b] - score[a]); const medals = ['Gold Medal', 'Silver Medal', 'Bronze Medal'], out = []; order.forEach((i, r) => { out[i] = r < 3 ? medals[r] : String(r + 1); }); return out; }" },
  ],

  solution: {
    code: `function findRelativeRanks(score) {
  const heap = new MaxHeap((p) => p[0]);          // [score, index], largest score first
  score.forEach((s, i) => heap.push([s, i]));
  const medals = ['Gold Medal', 'Silver Medal', 'Bronze Medal'];
  const answer = new Array(score.length);
  let place = 1;
  while (!heap.isEmpty()) {
    const [, i] = heap.pop();
    answer[i] = place <= 3 ? medals[place - 1] : String(place);
    place++;
  }
  return answer;
}`,
  },
  dryRun: {
    columns: ['pop', 'place', 'answer[index]'],
    rows: [['[10, 0]', '1', 'answer[0] = Gold'], ['[9, 3]', '2', 'answer[3] = Silver'], ['[8, 2]', '3', 'answer[2] = Bronze'], ['[4, 4]', '4', 'answer[4] = "4"'], ['[3, 1]', '5', 'answer[1] = "5"']],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'n pushes and n pops on a heap of size ≤ n.' },
  alternative: {
    title: 'Sort indices',
    code: `function findRelativeRanks(score) {
  const order = score.map((_, i) => i).sort((a, b) => score[b] - score[a]);
  const medals = ['Gold Medal', 'Silver Medal', 'Bronze Medal'];
  const answer = new Array(score.length);
  order.forEach((i, p) => { answer[i] = p < 3 ? medals[p] : String(p + 1); });
  return answer;
}`,
    md: 'Same O(n log n); idiomatic when all data is known.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Losing the original index (you must write answers in input order).',
    'Returning numbers instead of strings for places ≥ 4.',
    'Sorting `score` itself with default sort (lexicographic!) and without a copy.',
  ],
};
