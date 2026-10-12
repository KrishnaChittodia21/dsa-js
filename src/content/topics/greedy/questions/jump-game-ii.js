export default {
  id: 'jump-game-ii',
  title: 'Jump Game II',
  difficulty: 'Medium',
  order: 2,
  pattern: 'greedy-reach-frontier',
  tags: ['array', 'greedy', 'bfs'],
  source: { platform: 'LeetCode', number: 45, url: 'https://leetcode.com/problems/jump-game-ii/' },

  statement: `From index \`i\` of \`nums\` you may jump forward by any number of steps from \`1\` to \`nums[i]\`. You start at index \`0\` and the last index is **guaranteed to be reachable**.

Return the **minimum number of jumps** needed to reach the last index.`,
  examples: [
    { input: 'nums = [2,3,1,1,4]', output: '2', explanation: 'Jump to index 1, then 3 steps to the end.' },
    { input: 'nums = [2,3,0,1,4]', output: '2' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 1000', 'the last index is reachable'],

  think: `- Which indices can be reached with exactly 1 jump? With at most 2 jumps? What shape do these sets have?
- This is a shortest-path question on an unweighted graph. What algorithm usually solves those?
- Can you run that algorithm without an explicit queue?`,
  patternChallenge: {
    options: ['Dynamic Programming O(n²)', 'Dijkstra', 'Greedy — Reach / Frontier Invariant (BFS levels)', 'Two Pointers'],
    answer: 2,
    explanation: 'Fewest jumps = BFS levels. Because each level is a contiguous block of indices, you only need its end (curEnd) and the farthest reach from it — O(n), O(1). DP works but is O(n²); Dijkstra is overkill for unit weights.',
  },
  hints: [
    'Indices reachable in k jumps form a contiguous block. Track where the current block ends.',
    'While scanning the current block, record the farthest index reachable from it. When you reach the block\'s end, you must jump: jumps++, and the new block ends at that farthest index.',
  ],
  approach: `**DP:** \`dp[i]\` = min jumps to reach i; for each i relax all j in (i, i + nums[i]] → O(n·max(nums)).

**Greedy BFS:** level 0 is {0}. Scan i from 0 to n − 2, keeping \`farthest = max(i + nums[i])\`. When \`i === curEnd\`, every index in the current level has been expanded, so take one jump: \`jumps++\`, \`curEnd = farthest\`. Stop before the last index — you never jump *from* the destination.

Why is it optimal? It is exactly BFS, which finds the shortest path in unweighted graphs; the greedy just exploits that each BFS layer is an interval.`,

  functionName: 'jump',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function jump(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Jump to index 1, then 3 steps to the end.', args: [[2, 3, 1, 1, 4]], expected: 2 },
    { scenario: 'Example 2', hint: 'A zero in the middle does not matter when you can jump over it.', args: [[2, 3, 0, 1, 4]], expected: 2 },
    { scenario: 'Single element', hint: 'You already stand on the last index, so the answer is 0 jumps, not 1.', args: [[0]], expected: 0 },
    { scenario: 'Two elements', hint: 'One jump of length 1 reaches the end.', args: [[1, 2]], expected: 1 },
    { scenario: 'All ones', hint: 'Every jump moves one step: n − 1 jumps.', args: [[1, 1, 1, 1]], expected: 3 },
    { scenario: 'First jump reaches end', hint: 'nums[0] covers the whole array — exactly one jump.', args: [[10, 1, 1, 1]], expected: 1 },
    { scenario: 'No extra jump at the end', hint: 'If your loop runs to the last index, landing exactly on curEnd there counts a jump you never take. Stop at n − 2.', args: [[1, 2, 1, 1, 1]], expected: 3 },
    { scenario: 'Biggest value is not best', hint: 'Jumping to the cell with the largest nums[i] (the 3) is worse than the cell with the largest i + nums[i].', args: [[3, 3, 1, 2, 1, 1, 1]], expected: 3 },
    { scenario: 'Zeros you must skip', hint: 'Zeros are dead ends; a BFS-by-ranges greedy never lands on them unnecessarily.', args: [[3, 0, 0, 2, 0, 1]], expected: 2 },
    { scenario: 'Long jump then short', hint: 'Count levels, not positions: the second level is defined by the farthest reach of the first.', args: [[2, 1, 1, 1, 1]], expected: 3 },
    { scenario: 'Maximum jump value', hint: 'nums[i] can be 1000, far beyond the array end — clamp nothing, just compare reach with n − 1.', args: [[1, 1000, 0, 0, 0, 0]], expected: 2 },
    { scenario: 'Large all ones (n = 10^4)', hint: 'Recursively trying every jump is exponential; the level-by-level greedy is O(n).', argsGen: '() => [new Array(10000).fill(1)]', expected: 9999, timeLimitMs: 1000 },
    { scenario: 'Large mixed jumps (n = 10^4)', hint: 'Relaxing every reachable index from every position is O(n · max(nums)); one greedy scan is O(n).', argsGen: '() => { let x = 99; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 10000 }, () => 1 + r() % 50)]; }', expected: 242, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function jump(nums) {
  let jumps = 0;
  let curEnd = 0;     // last index of the current BFS level
  let farthest = 0;   // farthest index reachable from the levels scanned so far
  for (let i = 0; i < nums.length - 1; i++) { // never jump from the last index
    farthest = Math.max(farthest, i + nums[i]);
    if (i === curEnd) {                        // current level fully expanded
      jumps++;
      curEnd = farthest;
    }
  }
  return jumps;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'farthest', 'curEnd', 'jumps'],
    rows: [
      ['0', '2', '2', '0 → 2', '1'],
      ['1', '3', '4', '2', '1'],
      ['2', '1', '4', '2 → 4', '2'],
      ['3', '1', '4', '4', '2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each index is scanned once.' },
  alternative: {
    title: 'DP over indices',
    md: '`dp[0] = 0`; for each i, for every j within reach, `dp[j] = min(dp[j], dp[i] + 1)`. Easier to discover, slower.',
    code: `function jump(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(Infinity);
  dp[0] = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= Math.min(n - 1, i + nums[i]); j++) {
      dp[j] = Math.min(dp[j], dp[i] + 1);
    }
  }
  return dp[n - 1];
}`,
    complexity: 'O(n · max(nums)) time, O(n) space',
  },
  mistakes: [
    'Looping to the last index and counting an extra jump when `i === curEnd` there.',
    'Jumping to the index with the largest nums[i] instead of the largest `i + nums[i]`.',
    'Returning 1 for a single-element array (the answer is 0).',
  ],
};
