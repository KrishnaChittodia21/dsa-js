export default {
  id: 'implement-queue-using-stacks',
  title: 'Implement Queue using Stacks',
  difficulty: 'Easy',
  order: 4,
  pattern: 'stack-design',
  kind: 'design',
  tags: ['stack', 'queue', 'design', 'amortized analysis'],
  source: { platform: 'LeetCode', number: 232, url: 'https://leetcode.com/problems/implement-queue-using-stacks/' },

  statement: `Build a first-in-first-out queue using **only two stacks** (you may only use push to top, pop from top, peek at top, size and isEmpty on each stack).

Implement \`MyQueue\`:
- \`push(x)\` — add x to the back of the queue;
- \`pop()\` — remove and return the front element;
- \`peek()\` — return the front element without removing it;
- \`empty()\` — return whether the queue is empty.

All calls to pop/peek are valid. Follow-up: make every operation **amortized O(1)**.`,
  examples: [
    { input: '["MyQueue","push","push","peek","pop","empty"]\n[[],[1],[2],[],[],[]]', output: '[null,null,null,1,1,false]' },
  ],
  constraints: ['1 <= x <= 9', 'At most 100 calls', 'pop and peek are only called on a non-empty queue'],

  think: `- Pouring a stack into another stack reverses its order. How does that help turn LIFO into FIFO?
- When exactly should you pour? What goes wrong if you pour while the second stack still has elements?
- How many times can a single element be moved in total?`,
  patternChallenge: {
    options: ['Monotonic stack', 'Two stacks: inbox + outbox (amortized)', 'Circular buffer', 'Hash map'],
    answer: 1,
    explanation: 'The restriction "only stacks" plus "amortized O(1)" points to the inbox/outbox design: pour inbox into outbox only when outbox is empty. A circular buffer would be a normal queue implementation but violates the rules.',
  },
  hints: [
    'push always goes onto `inbox`. pop/peek read from `outbox`.',
    'If `outbox` is empty, move every element from `inbox` to `outbox` first — the oldest element ends up on top.',
  ],
  approach: `**Naive:** keep one stack in queue order; on every push, pour everything out, push, pour back → O(n) per push.

**Amortized (inbox/outbox):**
- \`push\`: \`inbox.push(x)\` — O(1).
- \`pop\`/\`peek\`: if \`outbox\` is empty, pour all of \`inbox\` into it (reversing the order), then pop/peek \`outbox\`.
- \`empty\`: both stacks empty.

**Why amortized O(1):** each element is pushed to inbox once, moved to outbox once, and popped once — at most 3 moves per element in its lifetime, so any sequence of n operations costs O(n) total.`,

  className: 'MyQueue',
  starterCode: `class MyQueue {
  constructor() {
    
  }

  /** @param {number} x */
  push(x) {
    
  }

  /** @return {number} */
  pop() {
    
  }

  /** @return {number} */
  peek() {
    
  }

  /** @return {boolean} */
  empty() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Push 1, 2 — the front is 1, so peek and pop both return 1.', ops: ['MyQueue', 'push', 'push', 'peek', 'pop', 'empty'], args: [[], [1], [2], [], [], []], expected: [null, null, null, 1, 1, false] },
    { scenario: 'Single push then pop', hint: 'After popping the only element the queue must report empty.', ops: ['MyQueue', 'push', 'pop', 'empty'], args: [[], [5], [], []], expected: [null, null, 5, true] },
    { scenario: 'Push after partial drain', hint: 'Pouring the inbox into a non-empty outbox breaks FIFO — 4 must come out after 2 and 3.', ops: ['MyQueue', 'push', 'push', 'push', 'pop', 'push', 'pop', 'pop', 'pop', 'empty'], args: [[], [1], [2], [3], [], [4], [], [], [], []], expected: [null, null, null, null, 1, null, 2, 3, 4, true] },
    { scenario: 'Empty right away', hint: 'A fresh queue is empty.', ops: ['MyQueue', 'empty'], args: [[], []], expected: [null, true] },
    { scenario: 'Peek does not remove', hint: 'peek must leave the front in place; only pop removes it.', ops: ['MyQueue', 'push', 'peek', 'push', 'peek', 'pop', 'peek'], args: [[], [7], [], [8], [], [], []], expected: [null, null, 7, null, 7, 7, 8] },
    { scenario: 'Interleaved pushes and pops', hint: 'Pops and pushes alternate; the outbox only refills when it is empty.', ops: ['MyQueue', 'push', 'push', 'pop', 'push', 'push', 'pop', 'peek', 'empty'], args: [[], [1], [2], [], [3], [4], [], [], []], expected: [null, null, null, 1, null, null, 2, 3, false] },
    { scenario: 'Peek right after push', hint: 'The very first peek must pour the inbox so the oldest element is on top of the outbox.', ops: ['MyQueue', 'push', 'peek', 'empty'], args: [[], [9], [], []], expected: [null, null, 9, false] },
    { scenario: 'Duplicate values', hint: 'Equal values must still come out in insertion order and count separately.', ops: ['MyQueue', 'push', 'push', 'push', 'pop', 'pop', 'empty', 'pop', 'empty'], args: [[], [3], [3], [3], [], [], [], [], []], expected: [null, null, null, null, 3, 3, false, 3, true] },
    { scenario: 'Drain then reuse', hint: 'Empty the queue completely, then push again — state must reset cleanly.', ops: ['MyQueue', 'push', 'push', 'pop', 'pop', 'empty', 'push', 'push', 'peek', 'pop', 'pop', 'empty'], args: [[], [1], [2], [], [], [], [6], [7], [], [], [], []], expected: [null, null, null, 1, 2, true, null, null, 6, 6, 7, true] },
    { scenario: 'Push between peeks', hint: 'A push after a peek goes to the back, never in front of the existing elements.', ops: ['MyQueue', 'push', 'peek', 'push', 'push', 'peek', 'pop', 'peek', 'pop', 'peek'], args: [[], [4], [], [5], [6], [], [], [], [], []], expected: [null, null, 4, null, null, 4, 4, 5, 5, 6] },
    { scenario: 'Long queue drained in order', hint: 'Nine pushes then nine pops must come out exactly in push order.', ops: ['MyQueue', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'empty'], args: [[], [1], [2], [3], [4], [5], [6], [7], [8], [9], [], [], [], [], [], [], [], [], [], []], expected: [null, null, null, null, null, null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, true] },
    { scenario: 'Max calls (100)', hint: 'A long random mix of all four operations.', ops: ['MyQueue', 'push', 'push', 'pop', 'pop', 'push', 'pop', 'push', 'pop', 'push', 'peek', 'pop', 'push', 'peek', 'peek', 'pop', 'push', 'pop', 'push', 'pop', 'push', 'push', 'push', 'pop', 'peek', 'push', 'peek', 'pop', 'peek', 'push', 'push', 'pop', 'peek', 'pop', 'pop', 'peek', 'pop', 'push', 'peek', 'push', 'push', 'pop', 'pop', 'push', 'push', 'push', 'push', 'pop', 'pop', 'pop', 'pop', 'peek', 'push', 'push', 'push', 'pop', 'peek', 'peek', 'push', 'pop', 'pop', 'pop', 'peek', 'push', 'pop', 'push', 'pop', 'pop', 'push', 'push', 'pop', 'push', 'push', 'push', 'pop', 'pop', 'push', 'peek', 'pop', 'pop', 'peek', 'pop', 'push', 'pop', 'push', 'pop', 'push', 'pop', 'push', 'peek', 'pop', 'push', 'peek', 'peek', 'peek', 'pop', 'push', 'pop', 'push', 'pop'], args: [[], [5], [9], [], [], [6], [], [8], [], [1], [], [], [9], [], [], [], [5], [], [2], [], [5], [4], [2], [], [], [9], [], [], [], [8], [1], [], [], [], [], [], [], [1], [], [5], [3], [], [], [2], [4], [9], [7], [], [], [], [], [], [8], [4], [6], [], [], [], [2], [], [], [], [], [1], [], [9], [], [], [8], [9], [], [2], [7], [1], [], [], [1], [], [], [], [], [], [4], [], [3], [], [2], [], [4], [], [], [5], [], [], [], [], [6], [], [3], []], expected: [null, null, null, 5, 9, null, 6, null, 8, null, 1, 1, null, 9, 9, 9, null, 5, null, 2, null, null, null, 5, 4, null, 4, 4, 2, null, null, 2, 9, 9, 8, 1, 1, null, 1, null, null, 1, 5, null, null, null, null, 3, 2, 4, 9, 7, null, null, null, 7, 8, 8, null, 8, 4, 6, 2, null, 2, null, 1, 9, null, null, 8, null, null, null, 9, 2, null, 7, 7, 1, 1, 1, null, 4, null, 3, null, 2, null, 4, 4, null, 5, 5, 5, 5, null, 6, null, 3] },
  ],
  solution: {
    code: `class MyQueue {
  constructor() {
    this.inbox = [];   // newest on top
    this.outbox = [];  // oldest on top
  }
  push(x) {
    this.inbox.push(x);
  }
  #refill() {
    // Only pour when outbox is empty — otherwise FIFO order breaks.
    if (this.outbox.length === 0) {
      while (this.inbox.length) this.outbox.push(this.inbox.pop());
    }
  }
  pop() {
    this.#refill();
    return this.outbox.pop();
  }
  peek() {
    this.#refill();
    return this.outbox[this.outbox.length - 1];
  }
  empty() {
    return this.inbox.length === 0 && this.outbox.length === 0;
  }
}`,
  },
  dryRun: {
    columns: ['op', 'inbox', 'outbox', 'returns'],
    rows: [
      ['push 1', '[1]', '[]', ''],
      ['push 2', '[1,2]', '[]', ''],
      ['push 3', '[1,2,3]', '[]', ''],
      ['pop', '[]', '[3,2] (1 popped)', '1'],
      ['push 4', '[4]', '[3,2]', ''],
      ['pop', '[4]', '[3]', '2'],
      ['pop', '[4]', '[]', '3'],
      ['pop', '[] → pour', '[] (4 popped)', '4'],
    ],
  },
  complexity: { time: 'Amortized O(1) per operation (single pop worst case O(n))', space: 'O(n)', explanation: 'Each element moves inbox → outbox at most once.' },
  alternative: {
    title: 'Costly push',
    md: 'Keep one stack always in queue order by pouring it out and back on every push. pop/peek become O(1) but push is O(n) — worse overall.',
    complexity: 'push O(n), pop O(1)',
  },
  mistakes: [
    'Pouring on every pop even when outbox is not empty.',
    'Pouring back from outbox to inbox on push (O(n) each time).',
    'Implementing with shift() — that violates the "only stacks" rule and is O(n).',
  ],
};
