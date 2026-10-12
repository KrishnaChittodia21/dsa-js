export default {
  id: 'find-the-winner-of-the-circular-game',
  title: 'Find the Winner of the Circular Game',
  difficulty: 'Medium',
  order: 2,
  pattern: 'recursion-reduce-and-trust',
  tags: ['recursion', 'math', 'josephus', 'simulation'],
  source: { platform: 'LeetCode', number: 1823, url: 'https://leetcode.com/problems/find-the-winner-of-the-circular-game/' },

  statement: `\`n\` friends sit in a circle, numbered \`1\` to \`n\` clockwise. Starting from friend 1, count \`k\` friends clockwise (counting the starting friend as 1). The friend you land on leaves the circle. Counting then restarts from the friend immediately clockwise of the one who left. This repeats until one friend remains.

Return the number of the friend who remains (the winner). This is the classic **Josephus problem**.`,
  examples: [
    { input: 'n = 5, k = 2', output: '3', explanation: 'Friends leave in the order 2, 4, 1, 5. Friend 3 remains.' },
    { input: 'n = 6, k = 5', output: '1', explanation: 'Friends leave in the order 5, 4, 6, 2, 3. Friend 1 remains.' },
  ],
  constraints: ['1 <= k <= n <= 500'],

  think: `- After the first friend leaves, you have the same game with n − 1 friends — but starting from a different person. How are the two numberings related?
- Using 0-based positions, which position leaves first?
- What is the answer when only one friend is in the circle?`,
  patternChallenge: {
    options: ['Simulation with a queue is the only option', 'Recursion (reduce & trust) with re-labelling: J(n) = (J(n−1) + k) % n', 'Binary search', 'Divide & conquer on split points'],
    answer: 1,
    explanation: 'Removing one friend leaves an (n − 1)-friend game whose position 0 is the friend right after the removed one. Trust the smaller answer and shift it back by k (mod n). A queue simulation also works (O(n·k)) but the recurrence is O(n).',
  },
  hints: [
    'Work 0-based. The first to leave is position `(k − 1) % n`; the smaller circle starts at position `k % n` of the bigger one.',
    'So smaller-circle position p equals bigger-circle position `(p + k) % n`. J(1) = 0 and J(n) = (J(n − 1) + k) % n. Return J(n) + 1.',
  ],
  approach: `**Simulation (brute force):** keep an array/queue of friends and repeatedly remove the k-th. Array splicing is O(n) per removal → O(n²); a queue rotating k times per removal → O(n·k). Fine for n ≤ 500, but there is a neater way.

**Recursion (Josephus recurrence):** label friends 0..n−1. After removing position \`(k−1) % n\`, re-label the remaining n − 1 friends so that the one right after the removed friend is 0. Then old = (new + k) % n. The survivor of the smaller game, J(n − 1), is therefore old position \`(J(n − 1) + k) % n\`. Base case J(1) = 0. Answer = J(n) + 1.

Depth n ≤ 500 is safe. For bigger n use the loop in the alternative.`,

  functionName: 'findTheWinner',
  paramNames: ['n', 'k'],
  starterCode: `/**
 * @param {number} n
 * @param {number} k
 * @return {number}
 */
function findTheWinner(n, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Friends 2, 4, 1, 5 leave in that order; friend 3 wins.', args: [5,2], expected: 3 },
    { scenario: 'Example 2', hint: 'Count 5 each round; friend 1 is the last one left.', args: [6,5], expected: 1 },
    { scenario: 'Single friend', hint: 'Base case: one friend wins immediately (J(1) = 0 → friend 1).', args: [1,1], expected: 1 },
    { scenario: 'Two friends, k = 1', hint: 'With k = 1 the first friend counted always leaves, so the last friend wins.', args: [2,1], expected: 2 },
    { scenario: 'Two friends, k = 2', hint: 'Friend 2 leaves first.', args: [2,2], expected: 1 },
    { scenario: 'k = 1 removes in order', hint: 'Friends leave 1, 2, 3, … so friend n wins. Off-by-one numbering shows up here.', args: [9,1], expected: 9 },
    { scenario: 'Small circle, k = 3', hint: 'Mixing 0-based and 1-based numbering usually gives a neighbour of the right answer.', args: [7,3], expected: 4 },
    { scenario: 'k equals n', hint: 'Taking the modulo with k instead of the current circle size m breaks when k ≥ m.', args: [10,10], expected: 8 },
    { scenario: 'Medium circle', hint: "A mid-sized case: shift the smaller circle's answer by k, modulo the current size.", args: [13,4], expected: 5 },
    { scenario: 'Maximum n, k = 1', hint: 'n = 500: recursion depth 500 is fine; the winner is the last friend.', args: [500,1], expected: 500 },
    { scenario: 'Maximum n, k = 7', hint: 'n = 500 with a small step.', args: [500,7], expected: 451 },
    { scenario: 'Maximum n and k', hint: 'k = n = 500: the count wraps around the whole circle every round.', args: [500,500], expected: 69 },
  ],

  solution: {
    code: `function findTheWinner(n, k) {
  // J(m) = 0-based survivor position in a circle of m friends
  function J(m) {
    if (m === 1) return 0;               // one friend: they win
    return (J(m - 1) + k) % m;           // shift the smaller answer back into this circle
  }
  return J(n) + 1;                       // convert to 1-based friend number
}`,
  },
  dryRun: {
    columns: ['m', 'J(m − 1)', 'J(m) = (J(m−1) + 2) % m'],
    rows: [
      ['1', '—', '0 (base)'],
      ['2', '0', '(0 + 2) % 2 = 0'],
      ['3', '0', '(0 + 2) % 3 = 2'],
      ['4', '2', '(2 + 2) % 4 = 0'],
      ['5', '0', '(0 + 2) % 5 = 2 → friend 3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'n calls, each O(1); the stack is n deep. The iterative version needs O(1) space.' },
  alternative: {
    title: 'Same recurrence as a loop',
    md: 'Evaluate J bottom-up from m = 2 to n. O(1) space and no stack-depth limit — use this when n can be large.',
    code: `function findTheWinner(n, k) {
  let j = 0;
  for (let m = 2; m <= n; m++) j = (j + k) % m;
  return j + 1;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Mixing 0-based and 1-based numbering — do the math 0-based and add 1 at the end.',
    'Taking the modulo with k instead of m (the current circle size).',
    'Simulating with `arr.splice` inside a loop and thinking it is O(n) — each splice is O(n).',
  ],
};
