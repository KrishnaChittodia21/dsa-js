export default {
  id: 'last-stone-weight',
  title: 'Last Stone Weight',
  difficulty: 'Easy',
  order: 2,
  pattern: 'heap-greedy-scheduling',
  tags: ['heap', 'simulation'],
  source: { platform: 'LeetCode', number: 1046, url: 'https://leetcode.com/problems/last-stone-weight/' },

  statement: `You have stones with positive integer weights \`stones[i]\`. Each turn, take the **two heaviest** stones \`y >= x\` and smash them:

- if \`x === y\`, both are destroyed;
- otherwise \`x\` is destroyed and \`y\` becomes \`y − x\`.

Repeat until at most one stone is left. Return its weight, or \`0\` if none are left.`,
  examples: [
    { input: 'stones = [2,7,4,1,8,1]', output: '1', explanation: '8,7 → 1 [2,4,1,1,1]; 4,2 → 2 [2,1,1,1]; 2,1 → 1 [1,1,1]; 1,1 → 0 [1].' },
    { input: 'stones = [1]', output: '1' },
  ],
  constraints: ['1 <= stones.length <= 30', '1 <= stones[i] <= 1000'],

  think: `- Each turn you need the two largest values. After the smash, the set changes by at most one value. Which structure makes "give me the largest" cheap while the set changes?
- What do you push back, and when?`,
  patternChallenge: {
    options: ['Two Pointers on a sorted array', 'Heap — Greedy Simulation & Scheduling', 'Dynamic Programming', 'Stack'],
    answer: 1,
    explanation: 'The process repeatedly needs the current maximum of a changing collection — a max-heap simulation. Two pointers on a sorted array break as soon as y − x must be inserted back in order. (The different problem "Last Stone Weight II" lets you pick any pair and is DP.)',
  },
  hints: [
    'Put every stone into a max-heap.',
    'While there are at least two stones: pop y and x; if y > x push y − x. Return the remaining top or 0.',
  ],
  approach: `**Brute force:** sort each round and take the last two → O(n² log n).

**Optimized:** max-heap. Each round is two pops and at most one push: O(log n). There are at most n − 1 rounds (each destroys at least one stone) → O(n log n).`,

  functionName: 'lastStoneWeight',
  paramNames: ['stones'],
  starterCode: `/**
 * @param {number[]} stones
 * @return {number}
 */
function lastStoneWeight(stones) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The walkthrough from the statement: always smash the two heaviest stones.', args: [[2,7,4,1,8,1]], expected: 1 },
    { scenario: 'Example 2', hint: 'A single stone never gets smashed — return its weight.', args: [[1]], expected: 1 },
    { scenario: 'Two equal stones', hint: 'Both stones are destroyed, so the heap ends empty. Return 0 instead of peeking an empty heap (undefined).', args: [[2,2]], expected: 0 },
    { scenario: 'Two unequal stones', hint: 'One smash leaves y - x; make sure you push the remainder back.', args: [[1000,1]], expected: 999 },
    { scenario: 'All stones destroyed', hint: 'Every stone cancels out — the answer is 0, not undefined.', args: [[9,3,2,10]], expected: 0 },
    { scenario: 'All equal, even count', hint: 'Equal pairs annihilate each other; with an even count nothing is left.', args: [[5,5,5,5]], expected: 0 },
    { scenario: 'All equal, odd count', hint: 'Equal pairs annihilate; one stone survives untouched.', args: [[7,7,7]], expected: 7 },
    { scenario: 'Remainder becomes heaviest', hint: 'The pushed-back remainder can be heavier than the remaining stones — re-heapify instead of appending to the end.', args: [[10,4,2,10]], expected: 2 },
    { scenario: 'Smallest stones matter', hint: 'A min-heap smashes the lightest stones first and gives a different answer — you need the heaviest two.', args: [[1,3,5,20]], expected: 11 },
    { scenario: 'Already sorted ascending', hint: 'Input order is irrelevant; sorted input should not confuse your heap.', args: [[1,2,3,4,5,6,7]], expected: 0 },
    { scenario: 'Reverse sorted', hint: 'Descending input — check you still pick the two heaviest after each push.', args: [[8,6,5,3,1]], expected: 1 },
    { scenario: 'Maximum size (30 stones)', hint: 'The largest allowed input: 30 stones of mixed weights up to 1000.', args: [[124,503,882,261,640,19,398,777,156,535,914,293,672,51,430,809,188,567,946,325,704,83,462,841,220,599,978,357,736,115]], expected: 3 },
    { scenario: 'Many ones', hint: 'Many identical light stones: pairs cancel, check the parity handling.', args: [[1,1,1,1,1,1,1,1,1]], expected: 1 },
  ],

  solution: {
    code: `function lastStoneWeight(stones) {
  const heap = new MaxHeap();
  for (const w of stones) heap.push(w);
  while (heap.size() > 1) {
    const y = heap.pop();          // heaviest
    const x = heap.pop();          // second heaviest
    if (y !== x) heap.push(y - x); // the remainder goes back
  }
  return heap.isEmpty() ? 0 : heap.peek();
}`,
  },
  dryRun: {
    columns: ['heap (as a set)', 'y', 'x', 'push'],
    rows: [
      ['{8,7,4,2,1,1}', '8', '7', '1'],
      ['{4,2,1,1,1}', '4', '2', '2'],
      ['{2,1,1,1}', '2', '1', '1'],
      ['{1,1,1}', '1', '1', '—'],
      ['{1}', '—', '—', 'return 1'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'At most n − 1 rounds, each O(log n).' },
  alternative: {
    title: 'Counting sort (weights ≤ 1000)',
    md: 'Keep a count array by weight and walk it from the top. O(n + W) where W = max weight — neat but specific to small weights.',
    complexity: 'O(n + W)',
  },
  mistakes: [
    'Using a min-heap (you need the heaviest stones).',
    'Pushing 0 back when x === y — harmless here but it changes the loop count and can be wrong in variants.',
    'Returning `heap.peek()` when the heap is empty (undefined instead of 0).',
  ],
};
