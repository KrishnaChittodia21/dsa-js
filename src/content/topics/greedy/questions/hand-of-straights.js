export default {
  id: 'hand-of-straights',
  title: 'Hand of Straights',
  difficulty: 'Medium',
  order: 5,
  pattern: 'greedy-sort-and-pick',
  tags: ['array', 'hash map', 'greedy', 'sorting'],
  source: { platform: 'LeetCode', number: 846, url: 'https://leetcode.com/problems/hand-of-straights/' },

  statement: `Alice holds cards with values \`hand[i]\`. She wants to split them into groups of exactly \`groupSize\` cards, where each group consists of **consecutive** values (like 3, 4, 5).

Return \`true\` if she can use every card this way, otherwise \`false\`.`,
  examples: [
    { input: 'hand = [1,2,3,6,2,3,4,7,8], groupSize = 3', output: 'true', explanation: '[1,2,3], [2,3,4], [6,7,8].' },
    { input: 'hand = [1,2,3,4,5], groupSize = 4', output: 'false', explanation: '5 cards cannot be split into groups of 4.' },
  ],
  constraints: ['1 <= hand.length <= 10^4', '0 <= hand[i] <= 10^9', '1 <= groupSize <= hand.length'],

  think: `- Look at the smallest card. Can it be the middle or end of a group?
- So which group MUST exist?
- How can you "remove" cards efficiently when there are duplicates?`,
  patternChallenge: {
    options: ['Sliding Window — Fixed Size', 'Backtracking', 'Greedy — Sort, then Pick', 'Union-Find'],
    answer: 2,
    explanation: 'The smallest remaining card has no smaller partner, so it must start a group — a forced greedy choice. Sort the distinct values and consume from a count map.',
  },
  hints: [
    'If hand.length is not divisible by groupSize, return false immediately.',
    'Count each value. Walk distinct values in ascending order; if value v still has count c > 0, you need c groups starting at v, so subtract c from v, v+1, …, v+groupSize−1 (fail if any count is too small).',
  ],
  approach: `**Brute force:** backtracking over which cards form which groups — exponential.

**Greedy:** the minimum card \`m\` can only be the first card of a straight (nothing smaller exists). So the straight \`m, m+1, …, m+k−1\` is forced. Remove it and repeat.

Efficiently: count values in a Map, sort the distinct keys. For each key v with \`count[v] = c > 0\`, start c groups at once: for j in 0..k−1, \`count[v+j] -= c\`, failing if it goes negative.`,

  functionName: 'isNStraightHand',
  paramNames: ['hand', 'groupSize'],
  starterCode: `/**
 * @param {number[]} hand
 * @param {number} groupSize
 * @return {boolean}
 */
function isNStraightHand(hand, groupSize) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Groups [1,2,3], [2,3,4], [6,7,8] use every card.', args: [[1, 2, 3, 6, 2, 3, 4, 7, 8], 3], expected: true },
    { scenario: 'Example 2', hint: '5 cards cannot be split into groups of 4 — check divisibility first.', args: [[1, 2, 3, 4, 5], 4], expected: false },
    { scenario: 'Single card', hint: 'One card with groupSize 1 is a valid group by itself.', args: [[1], 1], expected: true },
    { scenario: 'Group size 1', hint: 'With groupSize 1 every card is its own straight, duplicates included.', args: [[5, 5, 3], 1], expected: true },
    { scenario: 'Whole hand is one straight', hint: 'groupSize equals hand.length: the hand must be one run of consecutive values.', args: [[4, 2, 3, 1], 4], expected: true },
    { scenario: 'Length not divisible', hint: 'Seven cards can never form groups of 2 — a divisibility check answers false before any work.', args: [[1, 2, 3, 4, 5, 6, 7], 2], expected: false },
    { scenario: 'Duplicate straights', hint: 'Two copies of 1, 2, 3 form two identical straights; counts must be decremented, not just presence.', args: [[1, 1, 2, 2, 3, 3], 3], expected: true },
    { scenario: 'Gap in the values', hint: '1, 2 need a 3 that does not exist.', args: [[1, 2, 4, 5, 6, 7], 3], expected: false },
    { scenario: 'Default sort is lexicographic', hint: 'Without a numeric comparator [10, 9, 11] sorts as [10, 11, 9], so you start a straight at 10 and fail. Sort with (a, b) => a - b.', args: [[10, 9, 11], 3], expected: true },
    { scenario: 'Start from smallest card', hint: 'Starting a straight at the first card you see (3) fails; the smallest remaining card (1) must begin a straight.', args: [[3, 2, 1, 2, 3, 4], 3], expected: true },
    { scenario: 'Not enough copies', hint: 'Two 1s need two 2s for straights of length 2 — there is only one.', args: [[1, 1, 2, 3], 2], expected: false },
    { scenario: 'Zero values', hint: 'Card values can be 0; 0, 1, 2 is a valid straight.', args: [[2, 0, 1], 3], expected: true },
    { scenario: 'Maximum values (10^9)', hint: 'Values up to 10^9: use a Map of counts, not an array indexed by value.', args: [[1000000000, 999999999, 999999998], 3], expected: true },
    { scenario: 'Large input (n = 10^4)', hint: 'Re-scanning for the minimum card each time is O(n²); sort the distinct values once and consume counts in O(n log n).', argsGen: '() => { const h = []; for (let s = 0; s < 100; s++) for (let j = 0; j < 100; j++) h.push(s * 37 + j); return [h.reverse(), 100]; }', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize !== 0) return false;
  const count = new Map();
  for (const card of hand) count.set(card, (count.get(card) ?? 0) + 1);
  const values = [...count.keys()].sort((a, b) => a - b);
  for (const v of values) {
    const c = count.get(v);
    if (c === 0) continue;                 // already used by earlier straights
    // c straights must start at v (v is the smallest remaining value)
    for (let j = 0; j < groupSize; j++) {
      const have = count.get(v + j) ?? 0;
      if (have < c) return false;
      count.set(v + j, have - c);
    }
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['v', 'count[v]', 'action', 'counts after'],
    rows: [
      ['1', '1', 'start 1 group: 1,2,3', '{2:1, 3:1, 4:1, 6:1, 7:1, 8:1}'],
      ['2', '1', 'start 1 group: 2,3,4', '{6:1, 7:1, 8:1}'],
      ['3', '0', 'skip', ''],
      ['4', '0', 'skip', ''],
      ['6', '1', 'start 1 group: 6,7,8', '{}'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting distinct values dominates. Each value is decremented at most once per starting value, and each start covers groupSize values — O(n) total adjustments beyond the sort (each group of k decrements removes at least k cards).' },
  alternative: {
    title: 'MinHeap of distinct values',
    md: 'Push distinct values into the toolkit MinHeap. Repeatedly peek the smallest value with a positive count and consume a straight; pop values whose count hits 0 (they must be the heap top, otherwise a gap exists).',
    code: `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize) return false;
  const count = new Map();
  for (const c of hand) count.set(c, (count.get(c) ?? 0) + 1);
  const heap = new MinHeap();
  for (const v of count.keys()) heap.push(v);
  while (!heap.isEmpty()) {
    const first = heap.peek();
    for (let v = first; v < first + groupSize; v++) {
      if (!count.get(v)) return false;
      count.set(v, count.get(v) - 1);
      if (count.get(v) === 0) {
        if (v !== heap.peek()) return false; // a smaller value would be stranded
        heap.pop();
      }
    }
  }
  return true;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Sorting with the default (string) comparator — `[10, 9]` sorts as `[10, 9]`.',
    'Forgetting the divisibility check.',
    'Starting groups at an arbitrary card instead of the smallest remaining one.',
  ],
};
