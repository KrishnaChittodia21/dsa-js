// 15000 pushes, then rounds of one push/pop/top followed by six getMin calls (≈ 3·10^4 calls); expected values from a parallel prefix-minimum array.
const bigMinStackOps = () => {
  let s = 17; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const st = [], mins = [];
  const ops = ['MinStack'], args = [[]], expected = [null];
  const push = (v) => { st.push(v); mins.push(mins.length ? Math.min(v, mins[mins.length - 1]) : v); ops.push('push'); args.push([v]); expected.push(null); };
  for (let i = 0; i < 15000; i++) push(rnd(2000001) - 1000000 - i * 60);
  for (let i = 0; i < 2142; i++) {
    const r = rnd(3);
    if (r === 0) push(rnd(4000001) - 2000000);
    else if (r === 1) { st.pop(); mins.pop(); ops.push('pop'); args.push([]); expected.push(null); }
    else { ops.push('top'); args.push([]); expected.push(st[st.length - 1]); }
    for (let j = 0; j < 6; j++) { ops.push('getMin'); args.push([]); expected.push(mins[mins.length - 1]); }
  }
  return { ops, args, expected };
};

export default {
  id: 'min-stack',
  title: 'Min Stack',
  difficulty: 'Medium',
  order: 1,
  pattern: 'stack-design',
  kind: 'design',
  tags: ['stack', 'design'],
  source: { platform: 'LeetCode', number: 155, url: 'https://leetcode.com/problems/min-stack/' },

  statement: `Design a stack that, besides the usual operations, can return its **minimum element in O(1)**.

Implement \`MinStack\`:
- \`push(val)\` — push val;
- \`pop()\` — remove the top element;
- \`top()\` — return the top element;
- \`getMin()\` — return the smallest element currently in the stack.

Every operation must run in O(1) time. pop, top and getMin are only called on a non-empty stack.`,
  examples: [
    { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]' },
  ],
  constraints: ['-2^31 <= val <= 2^31 - 1', 'At most 3 · 10^4 calls'],

  think: `- If you keep one variable \`min\`, what happens when you pop the minimum?
- A stack only changes at its top. What could each entry remember about everything **below** it?`,
  patternChallenge: {
    options: ['Heap', 'Sorted array', 'Monotonic stack for next smaller', 'Stack whose entries store the minimum so far'],
    answer: 3,
    explanation: 'Each entry can store min(value, min below it). That stays true until the entry is popped, so getMin is just "look at the top". A heap gives O(log n) and cannot delete the popped element easily.',
  },
  hints: [
    'Push pairs [value, minSoFar], where minSoFar = min(value, minSoFar of the previous top).',
    'getMin returns the top\'s minSoFar; pop simply removes the pair — the entry below still knows its own minimum.',
  ],
  approach: `**Naive:** scan the stack on getMin → O(n). A single global min breaks after popping it.

**Augmented stack (all O(1)):** store \`[val, min(val, previousMin)]\` for every push. Because entries below the top never change, their stored minimum remains correct; after a pop, the new top already holds the minimum of the remaining elements.

**Space optimisation:** a second stack that only receives a value when it is ≤ the current minimum (pop it when the popped value equals its top).`,

  className: 'MinStack',
  starterCode: `class MinStack {
  constructor() {
    
  }

  /** @param {number} val */
  push(val) {
    
  }

  pop() {
    
  }

  /** @return {number} */
  top() {
    
  }

  /** @return {number} */
  getMin() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'After popping −3 the minimum must go back to −2.', ops: ['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'], args: [[], [-2], [0], [-3], [], [], [], []], expected: [null, null, null, null, -3, null, 0, -2] },
    { scenario: 'Single element', hint: 'With one element, top and getMin are both that element.', ops: ['MinStack', 'push', 'getMin', 'top'], args: [[], [5], [], []], expected: [null, null, 5, 5] },
    { scenario: 'Duplicate minimum', hint: 'With a separate min stack, push on <= (not <) — otherwise popping one copy of the minimum loses the other.', ops: ['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'getMin', 'pop', 'getMin'], args: [[], [2], [2], [1], [], [], [], [], []], expected: [null, null, null, null, 1, null, 2, null, 2] },
    { scenario: 'Equal values only', hint: 'Two equal pushes; popping one must leave the minimum unchanged.', ops: ['MinStack', 'push', 'push', 'getMin', 'pop', 'getMin'], args: [[], [1], [1], [], [], []], expected: [null, null, null, 1, null, 1] },
    { scenario: 'Min stays at the bottom', hint: 'Larger values pushed above the minimum do not change it, before or after pops.', ops: ['MinStack', 'push', 'push', 'push', 'top', 'getMin', 'pop', 'pop', 'top', 'getMin'], args: [[], [3], [5], [4], [], [], [], [], [], []], expected: [null, null, null, null, 4, 3, null, null, 3, 3] },
    { scenario: '32-bit extremes', hint: 'Values at ±2^31; an initial "min = 0" or similar sentinel would be wrong.', ops: ['MinStack', 'push', 'push', 'getMin', 'push', 'getMin', 'pop', 'getMin', 'pop', 'getMin'], args: [[], [2147483647], [-2147483648], [], [0], [], [], [], [], []], expected: [null, null, null, -2147483648, null, -2147483648, null, -2147483648, null, 2147483647] },
    { scenario: 'Pop the minimum', hint: 'A single global min variable cannot recover the previous minimum after it is popped.', ops: ['MinStack', 'push', 'push', 'getMin', 'pop', 'getMin'], args: [[], [4], [2], [], [], []], expected: [null, null, null, 2, null, 4] },
    { scenario: 'Decreasing pushes', hint: 'Every push is a new minimum; unwinding must restore each older minimum in turn.', ops: ['MinStack', 'push', 'push', 'push', 'push', 'getMin', 'pop', 'getMin', 'pop', 'getMin', 'pop', 'getMin'], args: [[], [5], [4], [3], [2], [], [], [], [], [], [], []], expected: [null, null, null, null, null, 2, null, 3, null, 4, null, 5] },
    { scenario: 'Increasing pushes', hint: 'The minimum is always the first element pushed.', ops: ['MinStack', 'push', 'push', 'push', 'push', 'getMin', 'pop', 'getMin', 'top'], args: [[], [1], [2], [3], [4], [], [], [], []], expected: [null, null, null, null, null, 1, null, 1, 3] },
    { scenario: 'Negative numbers', hint: 'All values negative — the minimum is the most negative one.', ops: ['MinStack', 'push', 'push', 'push', 'getMin', 'top', 'pop', 'getMin'], args: [[], [-1], [-5], [-3], [], [], [], []], expected: [null, null, null, null, -5, -3, null, -5] },
    { scenario: 'Empty then reuse', hint: 'Pop everything, then push again — no stale minimum may survive.', ops: ['MinStack', 'push', 'pop', 'push', 'getMin', 'top'], args: [[], [-10], [], [7], [], []], expected: [null, null, null, null, 7, 7] },
    { scenario: 'Long random mix', hint: 'A long sequence of all four operations with duplicates and negatives.', ops: ['MinStack', 'push', 'getMin', 'pop', 'push', 'pop', 'push', 'push', 'pop', 'top', 'push', 'top', 'top', 'pop', 'top', 'getMin', 'push', 'top', 'getMin', 'top', 'getMin', 'pop', 'push', 'push', 'getMin', 'top', 'push', 'push', 'getMin', 'getMin', 'push', 'push', 'getMin', 'top', 'pop', 'getMin', 'getMin', 'top', 'push', 'push', 'push', 'getMin', 'top', 'push', 'push', 'top', 'top', 'push', 'pop', 'top', 'push', 'push', 'pop', 'getMin', 'top', 'push', 'push', 'pop', 'pop', 'push', 'push', 'push', 'getMin', 'push', 'pop', 'getMin', 'push', 'top', 'top', 'push', 'top', 'push', 'getMin', 'top', 'push', 'pop', 'push', 'push', 'getMin', 'pop', 'pop', 'pop', 'pop', 'push', 'pop', 'push', 'top', 'push', 'top', 'top', 'top', 'top', 'top', 'pop', 'getMin', 'getMin', 'getMin', 'getMin', 'getMin', 'top', 'getMin', 'pop', 'getMin', 'getMin', 'getMin', 'top', 'pop', 'push', 'top', 'push', 'top', 'push', 'push', 'push', 'top', 'top', 'push', 'getMin', 'push', 'getMin', 'getMin'], args: [[], [-17], [], [], [14], [], [13], [-8], [], [], [-10], [], [], [], [], [], [-4], [], [], [], [], [], [4], [9], [], [], [-4], [-3], [], [], [6], [-4], [], [], [], [], [], [], [11], [18], [1], [], [], [-14], [8], [], [], [15], [], [], [-9], [-5], [], [], [], [15], [11], [], [], [-4], [19], [-6], [], [-4], [], [], [18], [], [], [-18], [], [17], [], [], [-14], [], [20], [-7], [], [], [], [], [], [-13], [], [-8], [], [-19], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [4], [], [-7], [], [6], [10], [3], [], [], [-2], [], [-12], [], []], expected: [null, null, -17, null, null, null, null, null, null, 13, null, -10, -10, null, 13, 13, null, -4, -4, -4, -4, null, null, null, 4, 9, null, null, -4, -4, null, null, -4, -4, null, -4, -4, 6, null, null, null, -4, 1, null, null, 8, 8, null, null, 8, null, null, null, -14, -9, null, null, null, null, null, null, null, -14, null, null, -14, null, 18, 18, null, -18, null, -18, 17, null, null, null, null, -18, null, null, null, null, null, null, null, -8, null, -19, -19, -19, -19, -19, null, -14, -14, -14, -14, -14, -8, -14, null, -14, -14, -14, 18, null, null, 4, null, -7, null, null, null, 3, 3, null, -14, null, -14, -14] },
    { scenario: 'Max calls (3·10^4)', hint: 'The largest allowed run: a stack of ~15000 values queried thousands of times. getMin must read a stored minimum, not scan the stack.', opsGen: String(bigMinStackOps) },
  ],
  solution: {
    code: `class MinStack {
  constructor() {
    this.st = [];                    // entries: [value, minimum of this entry and all below]
  }
  push(val) {
    const below = this.st.length ? this.st[this.st.length - 1][1] : Infinity;
    this.st.push([val, Math.min(val, below)]);
  }
  pop() {
    this.st.pop();
  }
  top() {
    return this.st[this.st.length - 1][0];
  }
  getMin() {
    return this.st[this.st.length - 1][1];
  }
}`,
  },
  dryRun: {
    columns: ['op', 'stack [val, min]', 'returns'],
    rows: [
      ['push -2', '[[-2,-2]]', ''],
      ['push 0', '[[-2,-2],[0,-2]]', ''],
      ['push -3', '[[-2,-2],[0,-2],[-3,-3]]', ''],
      ['getMin', '', '-3'],
      ['pop', '[[-2,-2],[0,-2]]', ''],
      ['top', '', '0'],
      ['getMin', '', '-2'],
    ],
  },
  complexity: { time: 'O(1) per operation', space: 'O(n)', explanation: 'One extra number per entry.' },
  alternative: {
    title: 'Separate min stack (pushes only new minimums)',
    md: 'Push val onto mins only if mins is empty or val <= mins.top. On pop, if the popped value equals mins.top, pop mins too. Uses less memory when minimums change rarely. The `<=` is essential for duplicates of the minimum.',
    complexity: 'O(1) time, O(n) worst-case space',
  },
  mistakes: [
    'One global min variable — cannot recover after popping the minimum.',
    'Separate min stack with `<` instead of `<=` — duplicates of the minimum break it.',
    'Recomputing Math.min(...stack) in getMin (O(n)).',
  ],
};
