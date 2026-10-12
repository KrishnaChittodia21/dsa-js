export default {
  id: 'asteroid-collision',
  title: 'Asteroid Collision',
  difficulty: 'Medium',
  order: 6,
  pattern: 'stack-matching',
  tags: ['array', 'stack', 'simulation'],
  source: { platform: 'LeetCode', number: 735, url: 'https://leetcode.com/problems/asteroid-collision/' },

  statement: `Asteroids sit in a row, all moving at the same speed. For each value, the absolute value is its size and the sign is its direction (positive = moving right, negative = moving left).

When a right-moving asteroid meets a left-moving one, the smaller one explodes; if they are the same size, both explode. Asteroids moving in the same direction never meet. Return the asteroids that remain after all collisions, in order.`,
  examples: [
    { input: 'asteroids = [5,10,-5]', output: '[5,10]', explanation: '10 and -5 collide; 10 survives.' },
    { input: 'asteroids = [8,-8]', output: '[]' },
    { input: 'asteroids = [10,2,-5]', output: '[10]', explanation: '-5 destroys 2, then 10 destroys -5.' },
  ],
  constraints: ['2 <= asteroids.length <= 10^4', '-1000 <= asteroids[i] <= 1000', 'asteroids[i] != 0'],

  think: `- A left-moving asteroid collides with the **closest** right-moving asteroid to its left. Which structure gives you the closest one?
- A left-moving asteroid may destroy several in a row. When does it stop?
- Does a left-moving asteroid ever collide with one on its right? Does [-2, 3] collide?`,
  patternChallenge: {
    options: ['Two pointers from both ends', 'Sorting by size', 'Stack (collision / cancellation)', 'Queue simulation'],
    answer: 2,
    explanation: 'Each incoming left-mover fights the most recent surviving right-mover — the top of a stack — and may keep popping. Sorting destroys the order; two pointers do not model chains of collisions.',
  },
  hints: [
    'Keep a stack of survivors. A collision only happens when the top is positive and the new asteroid is negative.',
    'While colliding: if top < |a| pop and continue; if top == |a| pop and the new one dies; if top > |a| the new one dies. Push it only if it survives.',
  ],
  approach: `**Brute force:** repeatedly scan for an adjacent (+, −) pair and resolve it → O(n²).

**Stack (O(n)):** process left to right. A new asteroid \`a\`:
- if \`a > 0\`, or the stack is empty, or the top is negative → no collision, push.
- else (\`a < 0\` and top > 0): loop — compare sizes, popping smaller tops; stop when \`a\` is destroyed or no right-mover is on top. Push \`a\` if it survived.

Each asteroid is pushed and popped at most once.`,

  functionName: 'asteroidCollision',
  paramNames: ['asteroids'],
  starterCode: `/**
 * @param {number[]} asteroids
 * @return {number[]}
 */
function asteroidCollision(asteroids) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '10 and −5 collide and 10 survives; 5 never meets anything.', args: [[5, 10, -5]], expected: [5, 10] },
    { scenario: 'Example 2', hint: 'Equal sizes — both explode, so neither is kept.', args: [[8, -8]], expected: [] },
    { scenario: 'Example 3', hint: 'One left-mover destroys several right-movers in turn before dying — resolve collisions in a loop, not once.', args: [[10, 2, -5]], expected: [10] },
    { scenario: 'Moving apart (−, +)', hint: 'A left-mover followed by a right-mover drift apart — treating that order as a collision is the classic mistake.', args: [[-2, -1, 1, 2]], expected: [-2, -1, 1, 2] },
    { scenario: 'Two asteroids drifting apart', hint: 'Smallest input: −5 then 5 never meet.', args: [[-5, 5]], expected: [-5, 5] },
    { scenario: 'Big left-mover clears stack', hint: 'One left-mover destroys every right-mover; keep popping while it is bigger.', args: [[1, 2, 3, -10]], expected: [-10] },
    { scenario: 'Left-movers pass after one dies', hint: 'Once the lone right-mover is gone, the remaining left-movers have nothing to hit and all survive.', args: [[1, -2, -2, -2]], expected: [-2, -2, -2] },
    { scenario: 'Equal collision stops the chain', hint: 'After an equal-size collision the incoming asteroid is gone — do not push it or keep colliding with it.', args: [[3, 5, -5, -3, 4]], expected: [4] },
    { scenario: 'Everything destroyed', hint: 'A chain of equal and bigger collisions leaves nothing.', args: [[2, -1, 1, -2]], expected: [] },
    { scenario: 'All moving right', hint: 'No left-movers, so no collisions — return the input unchanged.', args: [[1, 2, 3, 4]], expected: [1, 2, 3, 4] },
    { scenario: 'All moving left', hint: 'Left-movers with nothing on their left never collide.', args: [[-4, -3, -2, -1]], expected: [-4, -3, -2, -1] },
    { scenario: 'Left-mover dies on first hit', hint: 'The incoming −3 hits a bigger right-mover and explodes immediately.', args: [[1, 10, -3, 2, -1]], expected: [1, 10, 2] },
    { scenario: 'Maximum sizes', hint: 'Sizes at the ±1000 bounds, including an equal-size pair.', args: [[1000, -1000, -1000, 999, -1000]], expected: [-1000, -1000] },
    { scenario: 'Long chain (n = 10^4)', hint: '9999 small right-movers wiped out one after another by a single huge left-mover — needs repeated popping.', argsGen: '() => [[...Array.from({ length: 9999 }, (_, i) => 1 + (i % 999)), -1000]]', expected: [-1000] },
    { scenario: 'Alternating pairs (n = 10^4)', hint: 'Many independent equal-size collisions; every pair cancels out.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i % 2 ? -1 : 1) * (1 + (i >> 1) % 1000))]', expected: [] },
  ],
  solution: {
    code: `function asteroidCollision(asteroids) {
  const st = [];
  for (const a of asteroids) {
    let alive = true;
    // Collision only when the top moves right and the new one moves left.
    while (alive && a < 0 && st.length && st[st.length - 1] > 0) {
      const top = st[st.length - 1];
      if (top < -a) {
        st.pop();              // top explodes; a keeps flying
      } else if (top === -a) {
        st.pop();              // both explode
        alive = false;
      } else {
        alive = false;         // a explodes
      }
    }
    if (alive) st.push(a);
  }
  return st;
}`,
  },
  dryRun: {
    columns: ['a', 'collisions', 'stack'],
    rows: [
      ['3', '—', '[3]'],
      ['5', '—', '[3,5]'],
      ['-5', '5 vs 5 → both explode', '[3]'],
      ['-3', '3 vs 3 → both explode', '[]'],
      ['4', '—', '[4]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every asteroid is pushed and popped at most once.' },
  alternative: {
    title: 'In-place write pointer',
    md: 'Use the input array itself as the stack with a write index `top` (overwrite asteroids[top]). O(1) extra space besides the output.',
    complexity: 'O(n) time, O(1) extra space',
  },
  mistakes: [
    'Treating (−, +) as a collision — a left-mover followed by a right-mover drift apart.',
    'Resolving only one collision per asteroid (use a loop).',
    'Pushing the new asteroid after an equal-size collision.',
  ],
};
