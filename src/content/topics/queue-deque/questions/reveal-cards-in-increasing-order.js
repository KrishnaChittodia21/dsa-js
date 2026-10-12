export default {
  id: 'reveal-cards-in-increasing-order',
  title: 'Reveal Cards In Increasing Order',
  difficulty: 'Medium',
  order: 4,
  pattern: 'queue-simulation',
  tags: ['array', 'queue', 'simulation', 'sorting'],
  source: { platform: 'LeetCode', number: 950, url: 'https://leetcode.com/problems/reveal-cards-in-increasing-order/' },

  statement: `You have a deck of cards with **distinct** integers. You may arrange the deck in any order, then repeat:

1. take the top card and reveal it (remove it);
2. if cards remain, move the next top card to the **bottom** of the deck.

Return an ordering of the deck (top card first) such that the cards are revealed in **increasing** order.`,
  examples: [
    { input: 'deck = [17,13,11,2,3,5,7]', output: '[2,13,3,11,5,17,7]', explanation: 'Revealing gives 2, 3, 5, 7, 11, 13, 17.' },
    { input: 'deck = [1,1000]', output: '[1,1000]' },
  ],
  constraints: ['1 <= deck.length <= 1000', '1 <= deck[i] <= 10^6', 'All values are distinct'],

  think: `- The process never looks at values — only at **positions**. Which position is revealed first, second, third…?
- Can you simulate the process on the positions 0..n−1 with a queue and record the order in which positions are revealed?
- Then which card should go to the position revealed first?`,
  patternChallenge: {
    options: ['Sort + simulate the process on indices with a queue', 'Two pointers', 'Binary search', 'Greedy by swapping adjacent cards'],
    answer: 0,
    explanation: 'The reveal/move-to-bottom process is a queue. Running it on positions tells you which slot is revealed k-th; put the k-th smallest card there.',
  },
  hints: [
    'Sort the deck ascending. Put indices 0..n−1 into a queue.',
    'For each card in sorted order: i = dequeue(), result[i] = card; then, if the queue is not empty, move its front to the back.',
  ],
  approach: `**Key idea:** the reveal order of positions does not depend on the card values. Simulate the process on positions with a queue:
1. \`q = [0, 1, …, n−1]\`, sort the cards ascending.
2. For each card: the revealed position is \`q.dequeue()\` → write the card there. Then (if anything remains) move the next front to the back, exactly as the deck does.

The k-th revealed position gets the k-th smallest card. O(n log n) for sorting, O(n) for the simulation.`,

  functionName: 'deckRevealedIncreasing',
  paramNames: ['deck'],
  starterCode: `/**
 * @param {number[]} deck
 * @return {number[]}
 */
function deckRevealedIncreasing(deck) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Revealing gives 2, 3, 5, 7, 11, 13, 17 — the smallest card goes on top.', args: [[17, 13, 11, 2, 3, 5, 7]], expected: [2, 13, 3, 11, 5, 17, 7] },
    { scenario: 'Example 2', hint: 'With two cards, the smaller one is revealed first and the other moves under and is revealed next.', args: [[1, 1000]], expected: [1, 1000] },
    { scenario: 'Single card', hint: 'Smallest input: nothing to move to the bottom.', args: [[5]], expected: [5] },
    { scenario: 'Three cards', hint: 'Simulate on positions: position 0 gets the smallest, position 2 the second, position 1 the largest.', args: [[3, 1, 2]], expected: [1, 3, 2] },
    { scenario: 'Reverse sorted input', hint: 'The input order does not matter — sort numerically first.', args: [[4, 3, 2, 1]], expected: [1, 3, 2, 4] },
    { scenario: 'Numeric sort needed', hint: 'deck.sort() without a comparator puts 10 before 9 (string order).', args: [[10, 9, 100, 1]], expected: [1, 10, 9, 100] },
    { scenario: 'Odd length', hint: 'The last reveal must not try to move a card to the bottom of an empty deck.', args: [[10, 20, 30, 40, 50]], expected: [10, 50, 20, 40, 30] },
    { scenario: 'Even length', hint: 'Six cards: positions are filled in the order 0, 2, 4, 1, 5, 3.', args: [[1, 2, 3, 4, 5, 6]], expected: [1, 4, 2, 6, 3, 5] },
    { scenario: 'Large values', hint: 'Values up to 10^6.', args: [[1000000, 1, 500000, 999999]], expected: [1, 999999, 500000, 1000000] },
    { scenario: 'Already in answer order', hint: 'The input happens to be a valid answer, but you still must return the arrangement for the sorted values.', args: [[2, 13, 3, 11, 5, 17, 7]], expected: [2, 13, 3, 11, 5, 17, 7] },
    { scenario: 'Power of two length', hint: 'Eight cards: positions wrap around the queue several times.', args: [[8, 7, 6, 5, 4, 3, 2, 1]], expected: [1, 5, 2, 7, 3, 6, 4, 8] },
    { scenario: 'Larger deck (n = 100)', hint: 'Many rounds of moving cards to the bottom — simulate positions with a queue.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => ((i * 37) % 100 + 1) * 3)]', expected: [3, 153, 6, 228, 9, 156, 12, 297, 15, 159, 18, 231, 21, 162, 24, 267, 27, 165, 30, 234, 33, 168, 36, 285, 39, 171, 42, 237, 45, 174, 48, 270, 51, 177, 54, 240, 57, 180, 60, 294, 63, 183, 66, 243, 69, 186, 72, 273, 75, 189, 78, 246, 81, 192, 84, 288, 87, 195, 90, 249, 93, 198, 96, 276, 99, 201, 102, 252, 105, 204, 108, 300, 111, 207, 114, 255, 117, 210, 120, 279, 123, 213, 126, 258, 129, 216, 132, 291, 135, 219, 138, 261, 141, 222, 144, 282, 147, 225, 150, 264] },
  ],
  solution: {
    code: `function deckRevealedIncreasing(deck) {
  const n = deck.length;
  const cards = [...deck].sort((a, b) => a - b);   // numeric sort!
  const q = new Queue(Array.from({ length: n }, (_, i) => i));
  const res = new Array(n);
  for (const card of cards) {
    res[q.dequeue()] = card;                       // this position is revealed next
    if (!q.isEmpty()) q.enqueue(q.dequeue());      // next top goes to the bottom
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['card', 'revealed position', 'moved to bottom', 'queue after'],
    rows: [
      ['1', '0', '1', '[2,3,1]'],
      ['2', '2', '3', '[1,3]'],
      ['3', '1', '3', '[3]'],
      ['4', '3', '—', '[] → res [1,3,2,4]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the queue simulation is O(n).' },
  alternative: {
    title: 'Reverse the process with a deque',
    md: 'Build the deck backwards: take cards from largest to smallest; before placing each card on top, move the bottom card to the top (undoing "top to bottom"). Uses pushFront/popBack.',
    code: `function deckRevealedIncreasing(deck) {
  const cards = [...deck].sort((a, b) => b - a);
  const d = new Deque();
  for (const c of cards) {
    if (!d.isEmpty()) d.pushFront(d.popBack());
    d.pushFront(c);
  }
  return d.toArray();
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Sorting with deck.sort() and no comparator — [10, 9] sorts as strings.',
    'Moving a card to the bottom after the last reveal (queue already empty).',
    'Simulating on values instead of positions.',
  ],
};
