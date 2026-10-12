export default {
  id: 'implement-stack-using-queues',
  title: 'Implement Stack using Queues',
  difficulty: 'Easy',
  order: 4,
  pattern: 'queue-simulation',
  kind: 'design',
  tags: ['stack', 'queue', 'design'],
  source: { platform: 'LeetCode', number: 225, url: 'https://leetcode.com/problems/implement-stack-using-queues/' },

  statement: `Implement a last-in-first-out stack using **only queue operations** (enqueue at the back, dequeue from the front, peek front, size, isEmpty).

\`MyStack\` supports \`push(x)\`, \`pop()\` (remove and return the top), \`top()\` and \`empty()\`. pop and top are only called on a non-empty stack.`,
  examples: [
    { input: '["MyStack","push","push","top","pop","empty"]\n[[],[1],[2],[],[],[]]', output: '[null,null,null,2,2,false]' },
  ],
  constraints: ['1 <= x <= 9', 'At most 100 calls'],

  think: `- A queue gives you the OLDEST element. After pushing x, how could you make x the oldest?
- What happens if, right after enqueuing x, you dequeue and re-enqueue every element that was there before it?`,
  patternChallenge: {
    options: ['Two stacks', 'Monotonic deque', 'One queue, rotated after each push', 'Circular buffer with a head pointer only'],
    answer: 2,
    explanation: 'With only queue operations, rotate: enqueue x, then move every older element (size − 1 of them) from the front to the back. Now x is at the front, so pop/top are plain dequeue/front. Two stacks are the reverse problem.',
  },
  hints: [
    'push(x): enqueue x, then repeat (size − 1) times: enqueue(dequeue()).',
    'Now the front is always the most recent element: pop = dequeue, top = front.',
  ],
  approach: `**One queue, O(n) push:** after enqueuing x, rotate the older n − 1 elements behind it. The queue then stores elements from newest (front) to oldest (back), so \`pop\` and \`top\` are O(1).

**Alternative, O(n) pop:** push is a plain enqueue; to pop, move n − 1 elements to a second queue (or to the back), and the last remaining one is the top.

Unlike the two-stack queue, there is no amortized trick here: a queue cannot reverse order cheaply, so one of the operations is O(n).`,

  className: 'MyStack',
  starterCode: `class MyStack {
  constructor() {
    
  }

  /** @param {number} x */
  push(x) {
    
  }

  /** @return {number} */
  pop() {
    
  }

  /** @return {number} */
  top() {
    
  }

  /** @return {boolean} */
  empty() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The last pushed value (2) is the top and comes out first.', ops: ['MyStack', 'push', 'push', 'top', 'pop', 'empty'], args: [[], [1], [2], [], [], []], expected: [null, null, null, 2, 2, false] },
    { scenario: 'Single push then pop', hint: 'After popping the only element the stack is empty.', ops: ['MyStack', 'push', 'pop', 'empty'], args: [[], [3], [], []], expected: [null, null, 3, true] },
    { scenario: 'Empty right away', hint: 'A fresh stack is empty.', ops: ['MyStack', 'empty'], args: [[], []], expected: [null, true] },
    { scenario: 'Push after pops', hint: 'LIFO order must hold after mixing pops and new pushes.', ops: ['MyStack', 'push', 'push', 'push', 'pop', 'pop', 'push', 'top', 'pop', 'pop'], args: [[], [1], [2], [3], [], [], [4], [], [], []], expected: [null, null, null, null, 3, 2, null, 4, 4, 1] },
    { scenario: 'Top does not remove', hint: 'top only looks; pop removes.', ops: ['MyStack', 'push', 'top', 'push', 'top', 'pop', 'top'], args: [[], [5], [], [6], [], [], []], expected: [null, null, 5, null, 6, 6, 5] },
    { scenario: 'Three pushes, rotate size − 1', hint: 'Rotating size times (instead of size − 1) leaves the new element at the back, so top returns the oldest value.', ops: ['MyStack', 'push', 'push', 'push', 'top', 'pop', 'top', 'pop', 'top'], args: [[], [1], [2], [3], [], [], [], [], []], expected: [null, null, null, null, 3, 3, 2, 2, 1] },
    { scenario: 'Interleaved operations', hint: 'Pushes and pops interleave; empty is checked in the middle.', ops: ['MyStack', 'push', 'push', 'pop', 'push', 'empty', 'pop', 'pop', 'empty'], args: [[], [1], [2], [], [3], [], [], [], []], expected: [null, null, null, 2, null, false, 3, 1, true] },
    { scenario: 'Duplicate values', hint: 'Equal values must still be popped one at a time.', ops: ['MyStack', 'push', 'push', 'push', 'pop', 'top', 'pop', 'pop', 'empty'], args: [[], [7], [7], [7], [], [], [], [], []], expected: [null, null, null, null, 7, 7, 7, 7, true] },
    { scenario: 'Drain then reuse', hint: 'Empty the stack, then push again — no stale elements.', ops: ['MyStack', 'push', 'push', 'pop', 'pop', 'empty', 'push', 'push', 'top', 'pop', 'top'], args: [[], [1], [2], [], [], [], [8], [9], [], [], []], expected: [null, null, null, 2, 1, true, null, null, 9, 9, 8] },
    { scenario: 'Long stack unwound', hint: 'Nine pushes come back in exactly reverse order.', ops: ['MyStack', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'pop', 'empty'], args: [[], [1], [2], [3], [4], [5], [6], [7], [8], [9], [], [], [], [], [], [], [], [], [], []], expected: [null, null, null, null, null, null, null, null, null, null, 9, 8, 7, 6, 5, 4, 3, 2, 1, true] },
    { scenario: 'Max calls (100)', hint: 'A long random mix of all four operations.', ops: ['MyStack', 'push', 'pop', 'push', 'push', 'pop', 'push', 'top', 'top', 'top', 'pop', 'top', 'pop', 'push', 'top', 'pop', 'push', 'pop', 'push', 'pop', 'push', 'push', 'pop', 'push', 'push', 'top', 'push', 'pop', 'push', 'top', 'pop', 'top', 'top', 'push', 'push', 'push', 'top', 'pop', 'push', 'push', 'top', 'top', 'pop', 'push', 'push', 'push', 'pop', 'top', 'push', 'top', 'push', 'push', 'top', 'pop', 'pop', 'pop', 'pop', 'push', 'push', 'push', 'pop', 'pop', 'push', 'pop', 'pop', 'push', 'top', 'top', 'top', 'push', 'push', 'top', 'pop', 'pop', 'pop', 'top', 'push', 'top', 'pop', 'pop', 'push', 'push', 'pop', 'push', 'pop', 'pop', 'pop', 'push', 'pop', 'pop', 'pop', 'pop', 'push', 'pop', 'push', 'top', 'push', 'pop', 'pop', 'push'], args: [[], [4], [], [7], [9], [], [3], [], [], [], [], [], [], [6], [], [], [8], [], [5], [], [1], [3], [], [7], [5], [], [8], [], [6], [], [], [], [], [7], [3], [4], [], [], [9], [8], [], [], [], [7], [1], [1], [], [], [4], [], [3], [2], [], [], [], [], [], [5], [3], [6], [], [], [2], [], [], [2], [], [], [], [3], [1], [], [], [], [], [], [5], [], [], [], [8], [7], [], [5], [], [], [], [4], [], [], [], [], [8], [], [9], [], [2], [], [], [2]], expected: [null, null, 4, null, null, 9, null, 3, 3, 3, 3, 7, 7, null, 6, 6, null, 8, null, 5, null, null, 3, null, null, 5, null, 8, null, 6, 6, 5, 5, null, null, null, 4, 4, null, null, 8, 8, 8, null, null, null, 1, 1, null, 4, null, null, 2, 2, 3, 4, 1, null, null, null, 6, 3, null, 2, 5, null, 2, 2, 2, null, null, 1, 1, 3, 2, 7, null, 5, 5, 7, null, null, 7, null, 5, 8, 9, null, 4, 3, 7, 5, null, 8, null, 9, null, 2, 9, null] },
  ],
  solution: {
    code: `class MyStack {
  constructor() {
    this.q = new Queue();
  }
  push(x) {
    this.q.enqueue(x);
    // Rotate every older element behind x so x sits at the front.
    for (let i = 1; i < this.q.size(); i++) this.q.enqueue(this.q.dequeue());
  }
  pop() {
    return this.q.dequeue();
  }
  top() {
    return this.q.front();
  }
  empty() {
    return this.q.isEmpty();
  }
}`,
  },
  dryRun: {
    columns: ['op', 'queue (front → back)', 'returns'],
    rows: [
      ['push 1', '[1]', ''],
      ['push 2', '[1,2] → rotate → [2,1]', ''],
      ['push 3', '[2,1,3] → rotate ×2 → [3,2,1]', ''],
      ['pop', '[2,1]', '3'],
      ['top', '[2,1]', '2'],
    ],
  },
  complexity: { time: 'push O(n), pop/top/empty O(1)', space: 'O(n)', explanation: 'Each push rotates the n − 1 older elements once.' },
  alternative: {
    title: 'Two queues, costly pop',
    md: 'push = enqueue to q1. pop: move all but the last element of q1 into q2, dequeue the last one, then swap q1 and q2. push O(1), pop O(n).',
    complexity: 'push O(1), pop O(n)',
  },
  mistakes: [
    'Rotating size times instead of size − 1 (x ends up at the back again).',
    'Using arr.pop() on the underlying array — that is a stack operation, not allowed.',
  ],
};
