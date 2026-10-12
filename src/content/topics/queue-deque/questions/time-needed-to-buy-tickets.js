export default {
  id: 'time-needed-to-buy-tickets',
  title: 'Time Needed to Buy Tickets',
  difficulty: 'Easy',
  order: 3,
  pattern: 'queue-simulation',
  tags: ['array', 'queue', 'simulation'],
  source: { platform: 'LeetCode', number: 2073, url: 'https://leetcode.com/problems/time-needed-to-buy-tickets/' },

  statement: `\`n\` people stand in a line; person \`i\` wants to buy \`tickets[i]\` tickets. Each second, the person at the front buys **one** ticket; if they still need more, they go to the **back** of the line, otherwise they leave.

Return how many seconds pass until person \`k\` (0-indexed, original position) has bought all their tickets.`,
  examples: [
    { input: 'tickets = [2,3,2], k = 2', output: '6', explanation: 'Line after each round: [1,2,1] → [0,1,0]. Person 2 finishes at second 6.' },
    { input: 'tickets = [5,1,1,1], k = 0', output: '8' },
  ],
  constraints: ['1 <= n <= 100', '1 <= tickets[i] <= 100', '0 <= k < n'],

  think: `- Simulate with a queue first: what do you enqueue — the ticket counts or the people's indices?
- Then think: how many tickets does person i manage to buy before person k finishes? Does it depend on whether i stands before or after k?`,
  patternChallenge: {
    options: ['Queue simulation (or its closed-form count)', 'Monotonic stack', 'Binary search', 'Sliding window'],
    answer: 0,
    explanation: 'The process is literally a round-robin line — a queue. Studying the simulation gives a one-pass formula, but the queue is the natural first model.',
  },
  hints: [
    'Queue of indices: dequeue i, tickets[i]--, add 1 second; if i === k and tickets[k] === 0 stop; else if tickets[i] > 0 enqueue i again.',
    'Formula: people before or at k buy min(tickets[i], tickets[k]); people after k buy min(tickets[i], tickets[k] − 1). Sum them.',
  ],
  approach: `**Queue simulation (O(total tickets)):** enqueue all indices; each second dequeue the front, decrement their tickets, and re-enqueue if they still need tickets. Stop when person k reaches 0. At most 100 × 100 = 10^4 steps.

**One pass (O(n)):** when person k buys their last ticket, everyone before k (or k itself) has had \`tickets[k]\` turns and everyone after k has had \`tickets[k] − 1\` turns — but nobody buys more than they want. Sum \`min(tickets[i], turns)\`.`,

  functionName: 'timeRequiredToBuy',
  paramNames: ['tickets', 'k'],
  starterCode: `/**
 * @param {number[]} tickets
 * @param {number} k
 * @return {number}
 */
function timeRequiredToBuy(tickets, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Person 2 is last in line and finishes in the second round at second 6.', args: [[2, 3, 2], 2], expected: 6 },
    { scenario: 'Example 2', hint: 'Person 0 needs 5 tickets; everyone else leaves after the first round.', args: [[5, 1, 1, 1], 0], expected: 8 },
    { scenario: 'Single person', hint: 'Smallest input: one ticket, one second.', args: [[1], 0], expected: 1 },
    { scenario: 'All need one ticket', hint: 'Everyone buys once; person k finishes at second k + 1.', args: [[1, 1, 1], 1], expected: 2 },
    { scenario: 'People after k get one fewer turn', hint: 'People behind k only get tickets[k] − 1 turns before k finishes — giving them tickets[k] overcounts.', args: [[3, 3, 3], 0], expected: 7 },
    { scenario: 'k is the last person', hint: 'Everyone in front gets up to tickets[k] turns.', args: [[2, 5, 1, 4], 3], expected: 11 },
    { scenario: 'Mixed demands', hint: 'Some people leave early, others outlast k.', args: [[84, 49, 5, 24, 70, 77, 87, 8], 3], expected: 154 },
    { scenario: 'Max tickets, two people', hint: 'Both need 100; person 1 finishes last at 200.', args: [[100, 100], 1], expected: 200 },
    { scenario: 'Max tickets, k first', hint: 'Person 0 finishes before person 1 gets its 100th turn.', args: [[100, 100], 0], expected: 199 },
    { scenario: 'Track the person, not the value', hint: 'Several people have the same count — follow person k by index, not by value.', args: [[2, 2, 2, 2], 2], expected: 7 },
    { scenario: 'k needs fewer than others', hint: 'k leaves early; people with more tickets do not matter after that.', args: [[9, 1, 9, 9], 1], expected: 2 },
    { scenario: 'Max size (n = 100)', hint: '100 people with up to 100 tickets each.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => ((i * 37) % 100) + 1), 57]', expected: 917 },
    { scenario: 'Max size, all 100 tickets', hint: 'Everyone needs 100 tickets; the last person finishes at 10^4 seconds.', argsGen: '() => [new Array(100).fill(100), 99]', expected: 10000 },
  ],
  solution: {
    code: `function timeRequiredToBuy(tickets, k) {
  const left = [...tickets];               // do not mutate the input
  const q = new Queue(left.map((_, i) => i));
  let time = 0;
  while (true) {
    const i = q.dequeue();
    left[i]--;
    time++;                                  // one second per ticket
    if (i === k && left[i] === 0) return time;
    if (left[i] > 0) q.enqueue(i);          // back of the line
  }
}`,
  },
  dryRun: {
    columns: ['second', 'serves', 'remaining', 'queue after'],
    rows: [
      ['1', '0', '[1,3,2]', '[1,2,0]'],
      ['2', '1', '[1,2,2]', '[2,0,1]'],
      ['3', '2', '[1,2,1]', '[0,1,2]'],
      ['4', '0', '[0,2,1]', '[1,2]'],
      ['5', '1', '[0,1,1]', '[2,1]'],
      ['6', '2', '[0,1,0]', 'k done → 6'],
    ],
  },
  complexity: { time: 'O(Σ tickets) ≤ O(n · max)', space: 'O(n)', explanation: 'One queue operation per ticket bought before k finishes.' },
  alternative: {
    title: 'Closed-form count',
    md: 'Person i before (or equal to) k buys min(t[i], t[k]) tickets before k finishes; after k, min(t[i], t[k] − 1).',
    code: `function timeRequiredToBuy(tickets, k) {
  let time = 0;
  for (let i = 0; i < tickets.length; i++) {
    time += Math.min(tickets[i], i <= k ? tickets[k] : tickets[k] - 1);
  }
  return time;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Using tickets.shift()/push on values — you lose track of which person is k.',
    'In the formula, giving people after k tickets[k] turns instead of tickets[k] − 1.',
  ],
};
