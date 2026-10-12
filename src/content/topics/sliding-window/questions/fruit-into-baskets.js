export default {
  id: 'fruit-into-baskets',
  title: 'Fruit Into Baskets',
  difficulty: 'Medium',
  order: 6,
  pattern: 'variable-window',
  tags: ['array', 'hash map', 'sliding window'],
  source: { platform: 'LeetCode', number: 904, url: 'https://leetcode.com/problems/fruit-into-baskets/' },

  statement: `Trees stand in a row; \`fruits[i]\` is the **type** of fruit on tree \`i\`. You have **two baskets**, and each basket can hold only **one type** of fruit (but any amount of it).

Starting at any tree, you move to the right picking exactly one fruit from every tree, and you must stop as soon as a tree's fruit does not fit in either basket.

Return the **maximum number of fruits** you can pick.`,
  examples: [
    { input: 'fruits = [1,2,1]', output: '3', explanation: 'Only two types; pick all three.' },
    { input: 'fruits = [0,1,2,2]', output: '3', explanation: 'Start at index 1: [1,2,2].' },
    { input: 'fruits = [1,2,3,2,2]', output: '4', explanation: 'Start at index 1: [2,3,2,2].' },
  ],
  constraints: ['1 <= fruits.length <= 10^5', '0 <= fruits[i] < fruits.length'],

  think: `- Strip away the story: what are you really looking for in the array?
- What window state tells you how many **distinct** types are in the window?
- When a third type enters, which pointer must move, and until when?`,
  patternChallenge: {
    options: ['Greedy: always start at the first tree', 'Sliding Window — Fixed Size', 'Sliding Window — Variable Size (at most 2 distinct)', 'Prefix Sum'],
    answer: 2,
    explanation: 'Decoded: "longest contiguous subarray with **at most 2 distinct values**". Contiguous + longest + a monotonic rule (fewer elements never means more distinct values) → variable window with a count Map.',
  },
  hints: [
    'Keep a Map `type → count` for the current window; `map.size` is the number of distinct types.',
    'When `map.size > 2`, shrink from the left: decrement the count of `fruits[left]`, **delete the key when it reaches 0**, and move left.',
  ],
  approach: `**Brute force:** every start, extend while ≤ 2 types → O(n²).

**Optimized (longest window with at most K = 2 distinct):**
1. Add \`fruits[right]\` to the count Map.
2. While \`count.size > 2\`: decrement \`fruits[left]\`; if its count is 0, delete it; \`left++\`.
3. Record \`right - left + 1\`.

This is the general "longest subarray with at most K distinct" template with K = 2.`,

  functionName: 'totalFruit',
  paramNames: ['fruits'],
  starterCode: `/**
 * @param {number[]} fruits
 * @return {number}
 */
function totalFruit(fruits) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Only two types in total: pick everything.', args: [[1, 2, 1]], expected: 3 },
    { scenario: 'Example 2', hint: 'You do not have to start at index 0 — the best run starts at index 1.', args: [[0, 1, 2, 2]], expected: 3 },
    { scenario: 'Example 3', hint: 'When type 3 arrives, keep the trailing 2 from the old window instead of restarting at 3.', args: [[1, 2, 3, 2, 2]], expected: 4 },
    { scenario: 'Single tree', hint: 'The smallest input: one fruit.', args: [[0]], expected: 1 },
    { scenario: 'All one type', hint: 'One basket is enough; the whole row is picked.', args: [[0, 0, 0, 0]], expected: 4 },
    { scenario: 'Every tree different', hint: 'Each new type evicts the oldest one: the best is any two adjacent trees.', args: [[0, 1, 2, 3, 4]], expected: 2 },
    { scenario: 'Keep part of old window', hint: 'Restarting at the third type loses the 2s just before it: [2, 2, 3, 2] beats starting fresh.', args: [[1, 2, 2, 3, 2, 1, 1]], expected: 4 },
    { scenario: 'Count reaches zero', hint: 'When a type\'s count drops to 0 you must delete it from the Map, or size never returns to 2.', args: [[3, 3, 3, 1, 2, 1, 1, 2, 3, 3, 4]], expected: 5 },
    { scenario: 'Best window at the end', hint: 'The longest two-type run is the suffix — update the answer after the final step too.', args: [[0, 1, 2, 1, 2, 1, 2, 2]], expected: 7 },
    { scenario: 'Alternating two types', hint: 'Two types alternate the whole way: the answer is n.', args: [[1, 0, 1, 0, 1, 0]], expected: 6 },
    { scenario: 'Large, two types (n = 10^5)', hint: 'Restarting from every tree is O(n²) here. Each index must enter and leave the window at most once.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i * 7) % 3 === 0 ? 5 : 9)]', expected: 100000, timeLimitMs: 1000 },
    { scenario: 'Large, mixed types', hint: 'Many short two-type runs: the window slides forward without ever moving left.', argsGen: '() => { let s = 29; return [Array.from({ length: 100000 }, (_, i) => { s = (s * 48271) % 2147483647; return Math.floor(i / 50) % 1000 + (s % 2) * 1000; })]; }', expected: 50 },
  ],

  solution: {
    code: `function totalFruit(fruits) {
  const count = new Map(); // type -> how many of it are in the window
  let left = 0, best = 0;
  for (let right = 0; right < fruits.length; right++) {
    count.set(fruits[right], (count.get(fruits[right]) ?? 0) + 1);
    while (count.size > 2) {                    // third type → repair
      const t = fruits[left];
      count.set(t, count.get(t) - 1);
      if (count.get(t) === 0) count.delete(t);  // keep size = distinct types
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['right', 'fruit', 'count', 'left', 'best'],
    rows: [
      ['0', '1', '{1:1}', '0', '1'],
      ['1', '2', '{1:1, 2:1}', '0', '2'],
      ['2', '3', '{1:1,2:1,3:1} → remove 1 → {2:1,3:1}', '1', '2'],
      ['3', '2', '{2:2, 3:1}', '1', '3'],
      ['4', '2', '{2:3, 3:1}', '1', '4'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each index enters/leaves once; the Map never holds more than 3 keys.' },
  alternative: {
    title: 'Track the last run',
    md: 'Keep the two types, the current length, and the length of the trailing run of the last type. When a third type arrives, the new window is `lastRun + 1`. O(n) time and O(1) space without a Map, but more fiddly.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Forgetting `count.delete(t)` when a count reaches 0 — `count.size` then never drops back to 2 and the window collapses.',
    'Resetting the window to start at `right` when a third type appears — the best window may keep part of the old one ([1,2,3,2,2] keeps the 2).',
    'Assuming you must start at index 0.',
  ],
};
