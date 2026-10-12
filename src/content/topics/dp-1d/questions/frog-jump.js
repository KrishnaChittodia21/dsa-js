export default {
  id: 'frog-jump',
  title: 'Frog Jump',
  difficulty: 'Hard',
  order: 3,
  pattern: 'dp-1d-state-map',
  tags: ['array', 'dynamic programming', 'hash map', 'hash set'],
  source: { platform: 'LeetCode', number: 403, url: 'https://leetcode.com/problems/frog-jump/' },

  statement: `A frog crosses a river on stones at positions \`stones\` (sorted ascending, first stone at \`0\`). It starts on the first stone and its **first jump must be exactly 1** unit.

If its previous jump was \`k\` units, the next jump must be \`k − 1\`, \`k\` or \`k + 1\` units, always **forward** and always landing **on a stone**.

Return \`true\` if the frog can reach the last stone.`,
  examples: [
    { input: 'stones = [0,1,3,5,6,8,12,17]', output: 'true', explanation: 'Jumps 1, 2, 2, 3, 4, 5.' },
    { input: 'stones = [0,1,2,3,4,8,9,11]', output: 'false', explanation: 'The gap from 4 to 8 is too wide.' },
  ],
  constraints: ['2 <= stones.length <= 2000', '0 <= stones[i] <= 2^31 - 1', 'stones[0] == 0', 'strictly increasing'],

  think: `- Is "I am on stone i" enough information to know which jumps are possible next?
- What extra number do you need? How many distinct values can it take?
- Stone positions go up to 2³¹. How do you look up "is there a stone at position p?" quickly?`,
  patternChallenge: {
    options: ['Greedy — always jump as far as possible', 'Graph BFS on positions only', '1D DP — Position + Extra State in a Map', 'Binary Search'],
    answer: 2,
    explanation: 'The state is (stone, last jump). Store reachable jump sizes per stone in Map<position, Set<k>> and propagate forward. BFS on positions alone loses the jump size; greedy fails because a shorter jump may be needed to land on the next stone.',
  },
  hints: [
    'Map every stone position to a Set of jump sizes that can land there. Start with reach.get(0) = {0} so the first jump is 0 + 1 = 1.',
    'Process stones in order; for each k in the Set, try k − 1, k, k + 1 (> 0) and add it to the Set of the stone at pos + step, if that stone exists.',
  ],
  approach: `**Brute force:** DFS trying three jumps from each stone — exponential.

**DP with extra state:** state = (stone, k = size of the jump that landed here). Since the frog only moves forward and stones are sorted, processing stones left to right is a valid topological order.
- \`reach: Map<position, Set<k>>\`, \`reach.get(0) = {0}\`.
- For each stone s, for each k in reach[s], for step in {k−1, k, k+1} with step > 0: if a stone exists at s + step, add step to its Set.
- Answer: reach[last] is non-empty.

The jump size at stone i is at most i + 1 (it grows by at most 1 per jump), so there are O(n²) states → O(n²) time and space. n = 2000 → ~4·10⁶ states at most.`,

  functionName: 'canCross',
  paramNames: ['stones'],
  starterCode: `/**
 * @param {number[]} stones
 * @return {boolean}
 */
function canCross(stones) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Jumps 1, 2, 2, 3, 4, 5: each within ±1 of the previous.', args: [[0, 1, 3, 5, 6, 8, 12, 17]], expected: true },
    { scenario: 'Example 2', hint: 'The gap from 4 to 8 is too big for any jump size the frog can have at stone 4.', args: [[0, 1, 2, 3, 4, 8, 9, 11]], expected: false },
    { scenario: 'Two stones, gap 1', hint: 'The first jump is exactly 1 — it lands on the last stone.', args: [[0, 1]], expected: true },
    { scenario: 'First gap is 2', hint: 'The first jump must be exactly 1. Starting with k = 1 at stone 0 wrongly allows a first jump of 2.', args: [[0, 2]], expected: false },
    { scenario: 'Growing jumps', hint: 'Each jump is one longer than the last: 1, 2, 3, 4, 5, 6.', args: [[0, 1, 3, 6, 10, 15, 21]], expected: true },
    { scenario: 'Must slow down', hint: 'After a jump of 2 the frog needs a 1 (k − 1) to land on the next stone.', args: [[0, 1, 3, 4, 5, 7, 9, 10, 12]], expected: true },
    { scenario: 'Extra stone, still reachable', hint: 'Stone 16 is a detour you can skip; one route still reaches 21.', args: [[0, 1, 3, 6, 10, 15, 16, 21]], expected: true },
    { scenario: 'Last gap too wide', hint: 'Any route to stone 2 arrives with k ≤ 2, so the gap of 3 to stone 5 is out of reach.', args: [[0, 1, 2, 5]], expected: false },
    { scenario: 'Zero-size jump trap', hint: 'From stone 1 with k = 1, k − 1 = 0 would keep the frog in place. Skip step sizes ≤ 0 or you loop forever.', args: [[0, 1, 2, 4, 7, 11]], expected: true },
    { scenario: 'Huge last position', hint: 'Positions go up to 2³¹ − 1. Indexing an array by position would allocate billions of cells — use a Map/Set keyed by position.', args: [[0, 1, 2147483647]], expected: false },
    { scenario: 'Consecutive stones (n = 2000)', hint: 'Many (stone, jump) states are reachable; process each pair once.', argsGen: '() => [Array.from({ length: 2000 }, (_, i) => i)]', expected: true },
    { scenario: 'Triangular gaps then far stone', hint: 'One long chain of growing jumps, then a stone that is far too far.', argsGen: '() => { const a = Array.from({ length: 1999 }, (_, k) => (k * (k + 1)) / 2); a.push(2147483647); return [a]; }', expected: false },
    { scenario: 'Unreachable last stone (n = 2000)', hint: 'Unmemoized DFS retries the same (stone, jump size) states along exponentially many routes before concluding false. Remember visited states.', argsGen: '() => { const a = Array.from({ length: 1999 }, (_, i) => i); a.push(2147483647); return [a]; }', expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canCross(stones) {
  // position -> set of jump sizes that can land on it
  const reach = new Map();
  for (const p of stones) reach.set(p, new Set());
  reach.get(0).add(0);                         // "previous jump 0" → first jump is exactly 1
  for (const pos of stones) {
    for (const k of reach.get(pos)) {
      for (let step = k - 1; step <= k + 1; step++) {
        if (step <= 0) continue;               // must move forward
        const target = reach.get(pos + step);
        if (target) target.add(step);          // there is a stone there
      }
    }
  }
  return reach.get(stones[stones.length - 1]).size > 0;
}`,
  },
  dryRun: {
    columns: ['stone', 'jumps landing here', 'steps tried', 'lands on'],
    rows: [
      ['0', '{0}', '1', '1 (k=1)'],
      ['1', '{1}', '1, 2', '3 (k=2)'],
      ['3', '{2}', '1, 2, 3', '5 (k=2), 6 (k=3)'],
      ['5', '{2}', '1, 2, 3', '6 (k=1), 8 (k=3)'],
      ['6', '{3, 1}', '2, 3, 4 / 1, 2', '8 (k=2), 8 (k=2)'],
      ['8', '{3, 2}', '2, 3, 4 / 1, 2, 3', '12 (k=4)'],
      ['12', '{4}', '3, 4, 5', '17 (k=5) ✓'],
    ],
    note: 'stones = [0,1,3,5,6,8,12,17] → true.',
  },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'Up to O(n) jump sizes per stone, 3 transitions each, O(1) Map/Set operations.' },
  alternative: {
    title: 'Memoized DFS on (index, k)',
    md: 'dfs(i, k) = can we finish from stone i having arrived with jump k. Memoize with a numeric key i * 4096 + k (k ≤ n). Recursion depth ≤ n = 2000, fine in JS.',
    code: `function canCross(stones) {
  const index = new Map(stones.map((p, i) => [p, i]));
  const n = stones.length;
  const memo = new Map();
  const dfs = (i, k) => {
    if (i === n - 1) return true;
    const key = i * 4096 + k;
    if (memo.has(key)) return memo.get(key);
    let ok = false;
    for (let step = k + 1; step >= k - 1 && !ok; step--) {
      if (step <= 0) continue;
      const j = index.get(stones[i] + step);
      if (j !== undefined && dfs(j, step)) ok = true;
    }
    memo.set(key, ok);
    return ok;
  };
  return dfs(0, 0);
}`,
    complexity: 'O(n²) time, O(n²) space',
  },
  mistakes: [
    'Allowing a jump of size 0 (the frog would stay in place forever).',
    'Starting with k = 1 at stone 0 (that allows a first jump of 2).',
    'Using an array indexed by position — positions go up to 2³¹.',
  ],
};
