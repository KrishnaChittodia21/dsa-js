export default {
  id: 'happy-number',
  title: 'Happy Number',
  difficulty: 'Easy',
  order: 6,
  pattern: 'linked-list-fast-slow',
  tags: ['math', 'two pointers', 'hash set', 'implicit linked list'],
  source: { platform: 'LeetCode', number: 202, url: 'https://leetcode.com/problems/happy-number/' },

  statement: `Start with a positive integer \`n\`. Repeatedly replace it by the **sum of the squares of its digits**. If this process eventually reaches \`1\`, the number is **happy**; if it loops forever without reaching 1, it is not.

Return \`true\` if \`n\` is happy, otherwise \`false\`.`,
  examples: [
    { input: 'n = 19', output: 'true', explanation: '1²+9²=82 → 8²+2²=68 → 6²+8²=100 → 1²+0²+0²=1' },
    { input: 'n = 2', output: 'false', explanation: '2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 → … loops.' },
  ],
  constraints: ['1 <= n <= 2^31 - 1'],

  think: `- Can the sequence grow forever? (What is the largest digit-square sum of a 10-digit number?)
- If it cannot grow forever and never hits 1, what must happen?
- Where have you seen "detect that a sequence loops" with O(1) memory?`,
  patternChallenge: {
    options: ['Binary Search', 'Dynamic Programming', 'Fast & Slow Pointers on the implicit sequence n → f(n)', 'Sliding Window'],
    answer: 2,
    explanation: 'Each number has exactly one "next" number f(n), so the sequence is an implicit linked list. It either reaches the self-loop at 1 or enters another cycle — Floyd detects which with O(1) space.',
  },
  hints: [
    'Write `next(n)` = sum of squared digits. Values quickly drop below ~243 and stay there, so the sequence must repeat.',
    'Run slow = next(slow), fast = next(next(fast)) until they are equal; the number is happy iff they meet at 1.',
  ],
  approach: `**Why it must loop:** a number with d digits has digit-square sum at most 81·d. For d ≥ 4 that is smaller than the number itself, so values fall until they are below 1000, and then stay below 243. A finite set of states + a deterministic "next" → the sequence eventually repeats.

**Brute force-ish:** remember every value in a \`Set\`; stop when you reach 1 (happy) or repeat a value (not happy). O(log n) per step, small extra space.

**Optimized (Floyd):** treat \`next(x)\` as the \`next\` pointer. Move slow once and fast twice until they meet. Since 1 → 1 is itself a cycle, they always meet; the answer is whether the meeting value is 1.`,

  functionName: 'isHappy',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {boolean}
 */
function isHappy(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '19 → 82 → 68 → 100 → 1. If you return `slow === 1` after fast reaches 1 first, you get false here.',
      args: [19], expected: true },
    { scenario: 'Example 2', hint: '2 falls into the 4 → 16 → … → 4 loop; your cycle detection must stop and return false.',
      args: [2], expected: false },
    { scenario: 'Smallest input (n = 1)', hint: '1 is already happy — handle it before or inside the loop without looping forever.',
      args: [1], expected: true },
    { scenario: 'Single digit happy (7)', hint: '7 → 49 → 97 → 130 → 10 → 1. Fast reaches 1 before slow does; check `fast === 1`, not `slow === 1`.',
      args: [7], expected: true },
    { scenario: 'Starts inside the cycle', hint: '4 is itself part of the unhappy loop.',
      args: [4], expected: false },
    { scenario: 'Power of ten', hint: '100 → 1 in one step. Use Math.floor when stripping digits — plain `x / 10` never reaches 0 cleanly.',
      args: [100], expected: true },
    { scenario: 'Three-digit unhappy', hint: '116 never reaches 1.',
      args: [116], expected: false },
    { scenario: 'Maximum value (2^31 − 1)', hint: 'The digit-square sum shrinks large numbers quickly — no need for an iteration cap.',
      args: [2147483647], expected: false },
    { scenario: 'Many ones', hint: '1111111 → 7 → … → 1.',
      args: [1111111], expected: true },
    { scenario: 'Longest path to 1', hint: '78999 takes 7 steps to reach 1 — a small arbitrary iteration cap may give up too early.',
      args: [78999], expected: true },
    { scenario: 'Large happy number', hint: '1000000000 → 1 in one step.',
      args: [1000000000], expected: true },
    { scenario: 'Unhappy single digit (3)', hint: 'Most single digits are unhappy; only 1 and 7 are happy.',
      args: [3], expected: false },
  ],

  solution: {
    code: `function isHappy(n) {
  const next = (x) => {
    let sum = 0;
    while (x > 0) {
      const d = x % 10;
      sum += d * d;
      x = Math.floor(x / 10);
    }
    return sum;
  };
  let slow = n, fast = next(n);
  while (fast !== 1 && slow !== fast) {
    slow = next(slow);
    fast = next(next(fast));
  }
  return fast === 1;
}`,
    explanation: 'Starting fast one step ahead lets the loop condition `slow !== fast` work from the first iteration.',
  },
  dryRun: {
    columns: ['slow', 'fast', 'note'],
    rows: [
      ['19', '82', 'start (fast one step ahead)'],
      ['82', '100 → 1', 'fast reaches 1 → happy'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Computing next(x) costs O(number of digits). After the first step values are ≤ 810 and the cycle/tail length is bounded by a constant.' },
  alternative: {
    title: 'Seen Set',
    md: 'Keep a Set of values; stop at 1 or at a repeat.',
    code: `function isHappy(n) {
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = String(n).split('').reduce((s, d) => s + d * d, 0);
  }
  return n === 1;
}`,
    complexity: 'O(log n) time, O(log n) space (bounded)',
  },
  mistakes: [
    'Assuming the sequence might grow forever and adding an arbitrary iteration cap.',
    'Using `x / 10` without `Math.floor` — JS numbers are floats, so the loop never ends properly.',
    'Returning `slow === 1` when the loop exits because fast hit 1 first.',
  ],
};
