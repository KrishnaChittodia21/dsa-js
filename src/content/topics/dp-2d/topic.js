export default {
  id: 'dp-2d',
  summary: 'Dynamic programming whose state needs two numbers — a cell (row, col), a pair of prefixes (i, j), or an item index plus remaining capacity — filled as a table in an order that respects its dependencies.',

  jsTools: [
    { api: 'Array.from({ length: m }, () => new Array(n).fill(0))', use: 'Create an m × n table where every row is a separate array', complexity: 'O(m·n) time and space' },
    { api: 'new Array(m).fill(new Array(n).fill(0))', use: 'THE BUG to avoid: every row is the SAME array object, so writing one row writes them all', complexity: '—' },
    { api: 'new Int32Array(n) / new Float64Array(n)', use: 'Compact, zero-initialised numeric rows for large tables (typed arrays)', complexity: 'O(n) allocation, fast indexed access' },
    { api: 'row.slice() / [...row]', use: 'Copy the previous row when a rolling-array update would otherwise overwrite values you still need', complexity: 'O(n)' },
    { api: 'Math.min / Math.max', use: 'Combine the choices of a transition', complexity: 'O(1)' },
    { api: 'Infinity / -Infinity', use: 'Neutral starting values for min / max DP and "impossible" states', complexity: 'O(1)' },
    { api: 'BigInt', use: 'Counting DPs whose intermediate counts could exceed 2^53 (e.g. distinct subsequences on adversarial inputs)', complexity: 'slower than Number; use only when needed' },
  ],

  patterns: [
    {
      id: 'dp-2d-grid',
      name: 'Grid DP',
      summary: 'dp[r][c] describes the best / number of ways to reach (or leave) cell (r, c); each cell is built from a few neighbouring cells that were computed earlier.',
      whyItExists: 'Counting or optimising over all paths in a grid by brute force explores exponentially many paths (a 3×7 grid already has 28, a 16×16 grid has over 155 million). But every path that reaches (r, c) arrives from a neighbour, so the answer for (r, c) depends only on the answers of those neighbours. Each cell is computed once: O(rows·cols).',
      whenToUse: [
        'Moves are restricted to a fixed set of directions that never revisit a cell (right/down, down/diagonal) so the dependency graph has no cycles',
        'Count paths, minimum / maximum path cost, or "largest square/shape ending at this cell"',
        'Triangles and staircases — a grid whose rows have different lengths',
      ],
      clues: ['"can only move right or down"', '"number of unique paths"', '"minimum path sum"', '"obstacles"', '"triangle, adjacent numbers on the row below"', '"largest square of 1s"', '"minimum initial health"'],
      whenNotToUse: [
        'Moves in all four directions → cells depend on each other in a cycle; use BFS / Dijkstra (shortest path) instead',
        'You need to count islands or connected regions → graph traversal, not DP',
        'The path may revisit cells or the cost depends on the whole path history',
      ],
      template: `function gridDP(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) { dp[r][c] = base(grid[0][0]); continue; }
      const fromTop  = r > 0 ? dp[r - 1][c] : NEUTRAL;
      const fromLeft = c > 0 ? dp[r][c - 1] : NEUTRAL;
      dp[r][c] = combine(fromTop, fromLeft, grid[r][c]);
    }
  }
  return dp[m - 1][n - 1];
}`,
      variations: [
        { name: 'Count paths', description: 'dp[r][c] = dp[r−1][c] + dp[r][c−1]; obstacles force 0.' },
        { name: 'Min / max path cost', description: 'dp[r][c] = grid[r][c] + min(top, left).' },
        { name: 'Bottom-up triangle', description: 'Start from the last row and move up: each cell takes the better of its two children. No edge cases, answer ends at the apex.' },
        { name: 'Backward DP (dungeon)', description: 'When the constraint is about the future (health must stay ≥ 1), fill from the destination back to the start.' },
        { name: 'Shape ending here', description: 'Maximal square: dp[r][c] = 1 + min(top, left, top-left) when the cell is 1.' },
      ],
      mistakes: [
        'Creating rows with fill(new Array(n)) — all rows share one array',
        'Forgetting that an obstacle in the first row/column blocks everything after it',
        'Iterating in an order where dp[r−1][c] or dp[r][c−1] is not yet computed',
        'Using a forward DP for dungeon-game: the minimum health depends on what is ahead, not behind',
      ],
      evolution: {
        easy: 'Pascal\'s triangle — every cell is the sum of the two above it.',
        medium: 'Unique paths with obstacles, minimum path sum, triangle, maximal square.',
        hard: 'Dungeon game — the dependency points backwards and needs a max(1, …) clamp; cherry pickup — two walkers at once (3D state).',
      },
    },
    {
      id: 'dp-2d-two-sequences',
      name: 'Two-Sequence DP (prefix × prefix)',
      summary: 'dp[i][j] answers the question for the first i characters of a and the first j characters of b. Each cell looks at the last characters a[i−1], b[j−1] and reuses up to three smaller prefixes.',
      whyItExists: 'Comparing two strings by trying every alignment, subsequence or edit script is exponential. But any answer for (a[0..i), b[0..j)) must decide what happens to the LAST characters — matched together, or one of them dropped/edited — and that decision leaves a strictly smaller pair of prefixes. There are only (m+1)(n+1) pairs of prefixes, so memoising them gives O(m·n).',
      whenToUse: [
        'Two strings / arrays and a question about matching, aligning, transforming or counting occurrences of one inside the other',
        'Longest common subsequence, edit distance, "is s a subsequence of t", "how many times does t appear as a subsequence of s"',
        'Pattern matching with wildcards (. * ?)',
      ],
      clues: ['"two strings"', '"subsequence" (not substring)', '"minimum number of operations to convert"', '"insert, delete, replace"', '"wildcard" / "regular expression"', '"number of distinct subsequences"', '"interleaving"'],
      whenNotToUse: [
        'Only one string and you need a contiguous substring → sliding window',
        'Exact substring search → string matching (KMP / Z) in the Advanced stage',
        'is-subsequence with one query is fine with two pointers — no table needed',
      ],
      template: `function twoSeq(a, b) {
  const m = a.length, n = b.length;
  // dp[i][j] = answer for a[0..i) and b[0..j)   (one extra row/col for the empty prefix)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  // base cases: dp[0][j] and dp[i][0] (empty prefix vs something)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = /* use dp[i-1][j-1] */ dp[i - 1][j - 1] + 1;
      else dp[i][j] = /* combine dp[i-1][j], dp[i][j-1] (and maybe dp[i-1][j-1]) */ Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`,
      variations: [
        { name: 'LCS', description: 'Match → diagonal + 1; mismatch → max(up, left).' },
        { name: 'Edit distance', description: 'Match → diagonal; mismatch → 1 + min(replace = diagonal, delete = up, insert = left). Base: dp[i][0] = i, dp[0][j] = j.' },
        { name: 'Distinct subsequences (counting)', description: 'dp[i][j] = dp[i−1][j] (skip s char) + (match ? dp[i−1][j−1] : 0).' },
        { name: 'Regex / wildcard', description: 'Boolean table; "x*" either matches zero copies (dp[i][j−2]) or eats one more character (dp[i−1][j]).' },
      ],
      mistakes: [
        'Off-by-one between dp indices (prefix lengths) and string indices (a[i−1])',
        'Forgetting the empty-prefix row/column base cases',
        'Mixing up which neighbour means insert vs delete in edit distance',
        'Treating "subsequence" as "substring" (LCS allows gaps; longest common substring resets to 0 on a mismatch)',
      ],
      evolution: {
        easy: 'Is-subsequence (two pointers; the DP view prepares you for the rest).',
        medium: 'LCS, edit distance, longest palindromic subsequence (LCS of s and reverse(s)).',
        hard: 'Distinct subsequences (counting), regular-expression and wildcard matching, interleaving strings.',
      },
    },
    {
      id: 'dp-2d-knapsack-01',
      name: '0/1 Knapsack (and Subset Sum)',
      summary: 'dp[i][c] = best value (or feasibility / count) using only the first i items with capacity c; each item is either skipped or taken ONCE. Rolled into one array by iterating capacity backwards.',
      whyItExists: 'Trying every subset of n items is 2^n. But after deciding items 0..i−1, the only thing that matters for the future is how much capacity is left — not WHICH items were taken. So the state collapses to (item index, remaining capacity): O(n·C) states, each with two choices.',
      whenToUse: [
        'Choose a subset of items, each at most once, under a budget / to hit an exact total',
        'Partition an array into two groups with equal (or closest) sums',
        'Assign + / − signs to reach a target (transform into a subset-sum)',
        'The budget / target is a smallish integer (think ≤ 10^4–10^5) so n × C fits',
      ],
      clues: ['"each item can be used at most once"', '"subset whose sum is"', '"partition into two subsets"', '"assign + or −"', '"capacity / budget / weight limit"', '"maximum value without exceeding"'],
      whenNotToUse: [
        'Items can be reused unlimited times → unbounded knapsack (capacity loop forwards)',
        'Fractions of items allowed → greedy by value/weight ratio',
        'The capacity is huge (10^9) but n is tiny → meet-in-the-middle or backtracking',
      ],
      template: `function knapsack01(weights, values, C) {
  const dp = new Array(C + 1).fill(0);        // dp[c] = best value with capacity c
  for (let i = 0; i < weights.length; i++) {
    for (let c = C; c >= weights[i]; c--) {   // BACKWARDS: each item used at most once
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
    }
  }
  return dp[C];
}`,
      variations: [
        { name: 'Subset sum (boolean)', description: 'dp[s] = dp[s] || dp[s − x]; dp[0] = true.' },
        { name: 'Count subsets', description: 'dp[s] += dp[s − x]; dp[0] = 1 (target sum after the transform).' },
        { name: 'Two capacities', description: 'Ones and zeroes: dp[zeros][ones], both loops backwards.' },
        { name: 'Closest partition', description: 'Last stone weight II: largest reachable sum ≤ total/2.' },
      ],
      mistakes: [
        'Iterating capacity forwards in the 1D version — an item gets used many times',
        'Forgetting the parity / bounds check in partition and target sum (odd total → impossible)',
        'Initialising a counting DP with dp[0] = 0 instead of 1',
        'Using a Set of reachable sums without bounding it — can blow up memory',
      ],
      evolution: {
        easy: 'Recognise the "take or skip each item once" shape.',
        medium: 'Partition equal subset sum, target sum (via the (total + target) / 2 transform), last stone weight II.',
        hard: 'Multi-dimensional budgets, knapsack with item groups, reconstructing the chosen items from the table.',
      },
    },
    {
      id: 'dp-2d-knapsack-unbounded',
      name: 'Unbounded Knapsack (unlimited reuse)',
      summary: 'Same state as 0/1 knapsack, but an item may be taken again after taking it: dp[i][c] can use dp[i][c − w] (same row). In 1D that means iterating capacity FORWARDS.',
      whyItExists: 'With unlimited copies, "take item i" does not move you to the next item — you stay on item i with less capacity. Ordering the loops "items outer, capacity inner" also fixes an ORDER on the items, so every multiset is built exactly once: that is how we count combinations instead of permutations.',
      whenToUse: [
        'Coins / items that can be reused any number of times',
        'Count the number of combinations (order does not matter) that reach an amount',
        'Maximise value with reusable items (rod cutting, integer break)',
      ],
      clues: ['"infinite number of each coin"', '"number of combinations that make up"', '"you may use each item unlimited times"', '"cut the rod into pieces"'],
      whenNotToUse: [
        'Order matters ((1,2) and (2,1) are different) → amount outer, items inner (combination-sum-iv from DP 1D)',
        'Each item once → 0/1 knapsack (backwards loop)',
      ],
      template: `function countCombinations(coins, amount) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;                                   // one way to make 0: choose nothing
  for (const coin of coins) {                  // items OUTER → combinations
    for (let a = coin; a <= amount; a++) {     // FORWARDS → coin may be reused
      dp[a] += dp[a - coin];
    }
  }
  return dp[amount];
}`,
      variations: [
        { name: 'Minimum items (coin change)', description: 'dp[a] = min(dp[a], dp[a − coin] + 1) — loop order does not matter for min.' },
        { name: 'Count combinations (coin change II)', description: 'Coins outer, amount inner.' },
        { name: 'Count permutations (combination sum IV)', description: 'Amount outer, coins inner.' },
      ],
      mistakes: [
        'Swapping the loop order and silently counting permutations',
        'Iterating capacity backwards (turns it into 0/1 — each coin at most once)',
        'Forgetting dp[0] = 1',
      ],
      evolution: {
        easy: 'Recognise reuse → forward loop.',
        medium: 'Coin change II (combinations), perfect squares, integer break.',
        hard: 'Bounded knapsack (each item up to k copies — binary splitting), combining with other state dimensions.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `In DP 1D you described every sub-problem with **one number**: "the best answer for the first \`i\` houses", "the number of ways to reach step \`i\`".

Some problems cannot be described with one number. Ask yourself *"what do I need to know to continue from here?"* and the answer contains **two** things:

| Problem | What you need to know | State |
|---|---|---|
| Paths in a grid | which row **and** which column you are on | \`dp[r][c]\` |
| Compare two strings | how much of string **a** and how much of string **b** is left | \`dp[i][j]\` |
| Knapsack | which item you are deciding **and** how much capacity is left | \`dp[i][cap]\` |

That is all "2D DP" means: the **state** has two indices, so the memo is a **table** instead of a list.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms (recap + new)',
            md: `- **State** — the minimal information that describes a sub-problem. Two different paths that reach the same state must have the same future.
- **Transition** — the formula that builds a state from smaller states.
- **Base case** — states answered directly (empty string, first row, zero capacity).
- **Dependency direction** — which neighbouring cells a cell reads. It decides the **order** in which you must fill the table.
- **Rolling array** — keeping only the one or two rows the transition actually reads, to cut space from O(m·n) to O(n).`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A spreadsheet where each cell\'s formula refers to the cell above and the cell to the left (like `=B1+A2`). You cannot compute a cell before the cells it refers to, so you fill the sheet row by row, left to right — and the bottom-right cell is the answer.',
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-1',
            question: 'Which problem genuinely needs a **two-index** state?',
            options: [
              'Climbing stairs: number of ways to reach step n taking 1 or 2 steps',
              'House robber: maximum loot from a row of houses',
              'Maximum subarray sum (Kadane)',
              'Longest common subsequence of two strings a and b',
            ],
            answer: 3,
            explanation: 'To continue an LCS computation you must know how far you are in **a** *and* how far you are in **b**. Those are independent, so the state is (i, j).',
            misconceptions: {
              0: 'Only the current step matters — one index. That is DP 1D.',
              1: 'Only the current house index matters (and you already saw it solved with two variables). One dimension.',
              2: 'Kadane tracks "best sum ending here" for one index — it is DP 1D in disguise.',
            },
            deeper: 'A quick test: write the recursive function signature. `ways(i)` → 1D. `lcs(i, j)` → 2D. The number of parameters that change between calls is the number of dimensions of the table.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `The plain recursion for these problems branches at every step and revisits the same sub-problems **exponentially** often.

Take "unique paths" in an \`m × n\` grid moving only right or down. \`paths(r, c) = paths(r+1, c) + paths(r, c+1)\`. The call tree has about 2^(m+n) nodes, but there are only \`m · n\` distinct \`(r, c)\` pairs. For a 16 × 16 grid: ~10^9 calls versus 256 cells.

The same holds for two strings: every recursive call is some pair of prefixes \`(i, j)\` — at most \`(m+1)(n+1)\` of them.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Plain recursion — exponential',
              code: `function paths(r, c, m, n) {
  if (r === m - 1 || c === n - 1) return 1;
  return paths(r + 1, c, m, n) + paths(r, c + 1, m, n);
}`,
            },
            right: {
              title: 'Table — O(m·n)',
              code: `const dp = Array.from({ length: m }, () => new Array(n).fill(1));
for (let r = 1; r < m; r++)
  for (let c = 1; c < n; c++)
    dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
return dp[m - 1][n - 1];`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the table gives the same answer as the recursion, just faster?',
            deeper: `Both compute exactly the same formula. The recursion recomputes \`paths(1,1)\` once for every route that leads to it; the table computes it **once** and stores it. A table cell is just a memo entry that we compute *before* anyone asks for it. The only new responsibility is choosing a filling order so that every cell's inputs already exist — the next sections are about that.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for 2D DP when:

1. The problem has **optimal substructure** (the best answer is built from best answers of smaller pieces) and **overlapping sub-problems** (the same pieces are reached in many ways) — the same two conditions as DP 1D.
2. Describing a sub-problem needs **two independent quantities**.
3. The dependency graph between states has **no cycles** (you can order the cells so each depends only on earlier ones).

The four families you will meet in this topic:

| Family | State | Typical question |
|---|---|---|
| Grid DP | \`dp[r][c]\` | paths, path cost, largest square |
| Two sequences | \`dp[i][j]\` over prefixes | LCS, edit distance, regex |
| 0/1 knapsack | \`dp[i][cap]\` | subset sum, partition, target sum |
| Unbounded knapsack | \`dp[i][cap]\` (reuse allowed) | coin change II |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Cycles break DP',
            md: 'If you may move up, down, left **and** right, cell A can depend on B while B depends on A. There is no valid filling order. That is a shortest-path problem (BFS / Dijkstra), not a DP.',
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-2',
            question: 'A robot may move in all four directions on a weighted grid. You want the cheapest route from top-left to bottom-right. Why is a `dp[r][c] = cost + min(neighbours)` table the wrong tool?',
            options: [
              'Because the grid is too large for a table',
              'Because weights can be large numbers',
              'Because the neighbours depend on each other in cycles, so no filling order has every input ready',
              'It is the right tool; just fill row by row',
            ],
            answer: 2,
            explanation: 'With four directions, dp[r][c] reads dp[r+1][c], which reads dp[r][c] back. There is no topological order — use Dijkstra (weighted) or BFS (unweighted).',
            misconceptions: {
              0: 'Size is not the issue; a table of the same size is fine for right/down moves.',
              1: 'Big weights are fine for DP. The problem is the circular dependency.',
              3: 'Row by row, a cell would read the cell below it before it has been computed — the result is simply wrong.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['grid + "only right or down"', 'two strings + subsequence / operations / matching', '"each item at most once" + a sum or capacity', '"unlimited supply" + number of combinations', 'recursion with two changing parameters'],
            conclusion: 'Think 2D DP — then decide the dependency direction and fill order',
          },
          {
            type: 'text',
            md: `A reliable recipe for any DP, now with two indices:

1. **Define the state in words.** "dp[i][j] = the LCS length of the first i chars of a and the first j chars of b." If you cannot say it in one sentence, you are not ready to code.
2. **Transition:** what is the *last decision*? (last characters matched or not; last item taken or not; arrived from top or from left).
3. **Base cases:** the empty prefix, the first row/column, capacity 0.
4. **Order:** look at which cells the transition reads, and loop so they are computed first.
5. **Answer:** which cell (often \`dp[m][n]\`, sometimes the max over the table).
6. **Optimise space** if the transition only reads the previous row.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — dependency direction decides loop order',
        blocks: [
          {
            type: 'text',
            md: `Draw the cell and arrows to the cells it reads. The loops must visit those cells **first**.

\`\`\`text
reads up + left            reads down + right          reads the previous row only
   ↓                          dp[r][c] → dp[r][c+1]      row i-1:  . . x . . x .
 → dp[r][c]                     ↓                                     ↘     ↓
                             dp[r+1][c]                 row i:          dp[i][c]
fill r = 0..m-1,             fill r = m-1..0,           outer loop over i, inner over c
     c = 0..n-1                   c = n-1..0             (any direction… unless you roll
                                                          it into ONE array — see knapsack)
\`\`\`

- **Unique paths, min path sum, LCS, edit distance:** read up / left / up-left → fill top-to-bottom, left-to-right.
- **Triangle bottom-up, dungeon game:** read down / right → fill bottom-to-top, right-to-left.
- **Knapsack:** row \`i\` reads only row \`i − 1\`. The direction *inside* a row only matters once you squeeze the table into a single array.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Top-down memo never needs an order',
            md: 'Memoised recursion computes cells lazily in whatever order the recursion asks for them — it discovers the order for you. Tabulation needs you to pick the order, but it avoids recursion depth limits (JS engines overflow around ~10,000 frames) and is usually faster.',
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-3',
            question: 'A transition is `dp[r][c] = grid[r][c] + min(dp[r + 1][c], dp[r][c + 1])`. Which loop order is correct?',
            options: [
              'r from 0 up to m−1, c from 0 up to n−1',
              'r from m−1 down to 0, c from 0 up to n−1',
              'r from m−1 down to 0, c from n−1 down to 0',
              'Any order works because min is commutative',
            ],
            answer: 2,
            explanation: 'The cell reads the cell **below** (r+1) and to the **right** (c+1), so both must be finished first: rows bottom-up and columns right-to-left.',
            misconceptions: {
              0: 'Top-down, left-right would read dp[r+1][c] before it has been computed (still 0 or undefined).',
              1: 'Rows are right, but going left-to-right reads dp[r][c+1] before it has been filled.',
              3: 'Commutativity of min is irrelevant — the *inputs* must exist before you combine them.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Every 2D DP starts life as a recursion with two parameters. Write it first — it tells you the state and the transition. Example: **minimum path sum** (right/down moves).',
          },
          {
            type: 'code',
            title: 'Brute force → memo (top-down)',
            code: `function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const memo = Array.from({ length: m }, () => new Array(n).fill(-1));
  function best(r, c) {                       // cheapest cost from (r,c) to the end
    if (r >= m || c >= n) return Infinity;    // fell off the grid
    if (r === m - 1 && c === n - 1) return grid[r][c];
    if (memo[r][c] !== -1) return memo[r][c]; // ← delete this line = exponential brute force
    return (memo[r][c] = grid[r][c] + Math.min(best(r + 1, c), best(r, c + 1)));
  }
  return best(0, 0);
}`,
            caption: 'Without the memo line: O(2^(m+n)). With it: O(m·n) time, O(m·n) memo + O(m+n) recursion depth.',
          },
        ],
      },
      {
        id: 'intuition-grid',
        title: 'Core intuition — grid DP',
        blocks: [
          {
            type: 'text',
            md: `**Warm-up: Pascal's triangle.** Each number is the sum of the two numbers above it. Row 4 is \`[1, 4, 6, 4, 1]\`, because \`4 = 1 + 3\`, \`6 = 3 + 3\`. That is already a 2D DP: \`row[i][j] = row[i−1][j−1] + row[i−1][j]\`, with 1s on the edges.

**Unique paths** is the same idea turned sideways: the number of ways to reach a cell = ways to reach the cell above + ways to reach the cell to the left (because those are the only two ways to *enter* it).

\`\`\`text
3 × 4 grid, ways to reach each cell
1  1  1  1
1  2  3  4
1  3  6 10   ← answer 10
\`\`\`

Twist the combine step and you get the whole family:
- **Obstacles:** a blocked cell has 0 ways.
- **Minimum path sum:** \`cost + min(top, left)\` instead of \`top + left\`.
- **Triangle:** go **bottom-up** — each cell adds the smaller of its two children. The apex ends up holding the answer, and there are no "edge of the row" special cases.
- **Maximal square:** \`dp[r][c]\` = side of the largest all-1 square whose **bottom-right corner** is (r, c) = \`1 + min(top, left, top-left)\`.`,
          },
          {
            type: 'visual',
            scenario: 'grid-dp',
            input: { grid: [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]], mode: 'count-paths' },
            caption: 'Unique paths with one obstacle: each cell adds the cell above and the cell to the left; the blocked cell holds 0. Switch the mode to min-sum to see cost + min(top, left).',
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-4',
            question: 'Maximal square: why is `dp[r][c] = 1 + min(dp[r−1][c], dp[r][c−1], dp[r−1][c−1])` (for a 1-cell) and not `1 + max(...)`?',
            options: [
              'Because min is cheaper to compute',
              'Because a k×k square ending at (r,c) needs squares of size k−1 ending at ALL three neighbours; the weakest neighbour limits how big it can grow',
              'Because we are minimising the area',
              'Both work; max just gives a slightly bigger answer',
            ],
            answer: 1,
            explanation: 'A square of side k at (r,c) contains a (k−1) square ending at the top, the left and the top-left cells. If any of them only supports a smaller square, there is a 0 somewhere inside and the big square is impossible.',
            misconceptions: {
              0: 'Speed is identical. The choice is about correctness.',
              2: 'We maximise the square; min comes from the "all three must support it" requirement.',
              3: 'max would claim squares that contain zeros — e.g. top supports 3 but left is 0 → max says 4, reality is 1.',
            },
          },
        ],
      },
      {
        id: 'optimized-grid',
        title: 'Optimized approach — grid DP (and the backward dungeon)',
        blocks: [
          {
            type: 'steps',
            title: 'Grid DP recipe',
            steps: [
              'State: dp[r][c] = answer for reaching (or, for backward problems, leaving) cell (r, c).',
              'Base: the start cell, then the first row and first column (only one way to enter them).',
              'Transition: combine the allowed predecessors (top/left for forward, bottom/right for backward).',
              'Order: follow the dependency arrows.',
              'Space: each row only reads the previous row (and itself) → keep ONE array of length n and update it left to right.',
            ],
          },
          {
            type: 'text',
            md: `**Why the dungeon game must go backwards.** The knight needs health ≥ 1 at *every* step. Going forwards you would have to remember two things per cell (health now *and* the lowest health seen so far) and the best choice for one can be the worst for the other — forward DP has no single correct value per cell.

Going backwards the question becomes simple: *"what is the minimum health I need when I **enter** (r, c) so that I can survive to the end?"*

\`\`\`text
need[r][c] = max(1, min(need[r+1][c], need[r][c+1]) − dungeon[r][c])
\`\`\`

The \`max(1, …)\` clamp says: a big healing potion can't let you enter with 0 or negative health.`,
          },
          {
            type: 'visual',
            scenario: 'dp-coin-change',
            input: { coins: [1, 2, 5], amount: 11 },
            caption: 'Recap from DP 1D: a 1D table filled left to right. Grid DP is the same idea with a second index — each row now plays the role of this array.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why a single array is enough for unique paths, and why it is updated **left to right**?',
            deeper: `Before updating \`dp[c]\` in row r it still holds the value of row r−1 — the cell **above**. \`dp[c − 1]\` was already updated in this row, so it holds the cell to the **left**. \`dp[c] += dp[c − 1]\` therefore computes "above + left" exactly. Going right-to-left would read the old (above-left) value instead of the new left value — wrong. Always ask: *"at the moment I read this slot, does it hold the old row or the new row?"*`,
          },
        ],
      },
      {
        id: 'template-grid',
        title: 'Pattern / template — grid DP',
        blocks: [
          {
            type: 'code',
            title: 'Forward grid DP, rolled into one row',
            code: `function gridMinCost(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(Infinity);   // dp[c] = best cost to reach (r, c)
  dp[0] = 0;
  for (let r = 0; r < m; r++) {
    dp[0] += grid[r][0];                     // first column: only from above
    for (let c = 1; c < n; c++) {
      dp[c] = grid[r][c] + Math.min(dp[c] /* above */, dp[c - 1] /* left */);
    }
  }
  return dp[n - 1];
}`,
          },
          {
            type: 'code',
            title: 'Backward grid DP (dungeon style)',
            code: `function backward(grid) {
  const m = grid.length, n = grid[0].length;
  const need = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(Infinity));
  need[m][n - 1] = need[m - 1][n] = 1;     // sentinels next to the goal
  for (let r = m - 1; r >= 0; r--)
    for (let c = n - 1; c >= 0; c--)
      need[r][c] = Math.max(1, Math.min(need[r + 1][c], need[r][c + 1]) - grid[r][c]);
  return need[0][0];
}`,
            caption: 'An extra row/column of Infinity removes all boundary if-statements; the two 1s make the goal cell behave like "you must leave with at least 1 health".',
          },
        ],
      },
      {
        id: 'implementation-grid',
        title: 'JavaScript implementation — grid DP',
        blocks: [
          {
            type: 'code',
            title: 'Unique paths II (obstacles) — O(m·n) time, O(n) space',
            code: `function uniquePathsWithObstacles(grid) {
  const n = grid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = 1;
  for (const row of grid) {
    for (let c = 0; c < n; c++) {
      if (row[c] === 1) dp[c] = 0;          // blocked: nobody gets through
      else if (c > 0) dp[c] += dp[c - 1];   // above (old dp[c]) + left (new dp[c-1])
    }
  }
  return dp[n - 1];
}`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'The shared-row bug',
            md: `\`new Array(m).fill(new Array(n).fill(0))\` creates **one** inner array and puts the same reference in every slot. \`dp[0][0] = 5\` then changes \`dp[1][0]\`, \`dp[2][0]\`… too. Always write \`Array.from({ length: m }, () => new Array(n).fill(0))\` — the arrow function runs once per row.`,
          },
        ],
      },
      {
        id: 'dry-run-grid',
        title: 'Dry run — minimum path sum',
        blocks: [
          {
            type: 'dryrun',
            title: 'grid = [[1,3,1],[1,5,1],[4,2,1]] (one rolling row)',
            columns: ['row r', 'dp after the row', 'how'],
            rows: [
              ['0', '[1, 4, 5]', 'first row: running sum 1, 1+3, 4+1'],
              ['1', '[2, 7, 6]', 'dp[0]=1+1; dp[1]=5+min(4,2)=7; dp[2]=1+min(5,7)=6'],
              ['2', '[6, 8, 7]', 'dp[0]=2+4; dp[1]=2+min(7,6)=8; dp[2]=1+min(6,8)=7'],
            ],
            note: 'Answer dp[2] = 7 (path 1→3→1→1→1). Each "min(a, b)" is min(above = old dp[c], left = new dp[c−1]).',
          },
        ],
      },
      {
        id: 'intuition-two-sequences',
        title: 'Core intuition — two sequences',
        blocks: [
          {
            type: 'text',
            md: `Put string **a** down the side and string **b** across the top, each with an extra empty row/column for the **empty prefix**. Cell \`(i, j)\` answers the question for \`a[0..i)\` and \`b[0..j)\`.

The magic question every time: **what happens to the last characters, \`a[i−1]\` and \`b[j−1]\`?**

**LCS (longest common subsequence):**
- They are equal → they can be matched together: \`dp[i][j] = dp[i−1][j−1] + 1\`.
- Different → at least one of them is not in the LCS; drop one: \`max(dp[i−1][j], dp[i][j−1])\`.

Why is it safe to match equal last characters greedily? Any LCS that doesn't use this pair can be rearranged to use it without getting shorter (swap whichever character it matched a[i−1] with) — an *exchange argument*.`,
          },
          {
            type: 'visual',
            scenario: 'dp-lcs',
            input: { a: 'abcde', b: 'ace' },
            caption: 'Diagonal arrow = matched characters, up/left = drop one character. The bottom-right cell is the LCS length.',
          },
          {
            type: 'text',
            md: `**Edit distance** (minimum insert / delete / replace to turn \`word1\` into \`word2\`). Think of an arrow pointing at the last character of each prefix:

\`\`\`text
word1 prefix: h o r s [e]        word2 prefix: r o [s]
\`\`\`

| Operation on word1 | What it does to the last characters | Cell it comes from |
|---|---|---|
| **match** (e == s? no) | nothing to pay; both last chars consumed | \`dp[i−1][j−1]\` |
| **replace** e → s | pay 1; both last chars now handled | \`1 + dp[i−1][j−1]\` ↖ |
| **delete** e | pay 1; word1 loses its last char, word2 unchanged | \`1 + dp[i−1][j]\` ↑ |
| **insert** s at the end | pay 1; word2's last char is now matched, word1 unchanged | \`1 + dp[i][j−1]\` ← |

Base cases: turning a prefix of length \`i\` into the empty string costs \`i\` deletions (\`dp[i][0] = i\`), and building a prefix of length \`j\` from nothing costs \`j\` insertions (\`dp[0][j] = j\`).`,
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-5',
            question: 'In edit distance, cell `dp[i][j]` takes `1 + dp[i][j−1]`. Which operation is that?',
            options: [
              'Delete the last character of word1',
              'Replace the last character of word1',
              'Insert word2\'s last character at the end of word1',
              'Match the two last characters',
            ],
            answer: 2,
            explanation: 'j decreased but i did not: word2\'s last character has been taken care of (we inserted a copy of it) while word1 is untouched. That is an insertion.',
            misconceptions: {
              0: 'Deleting consumes one character of **word1**, so i shrinks: dp[i−1][j].',
              1: 'Replace consumes one character of each: dp[i−1][j−1] (+1).',
              3: 'A match costs 0 and also moves diagonally: dp[i−1][j−1].',
            },
            deeper: 'Memory aid: *the index that shrinks is the string that lost a character to be dealt with.* i shrinks → word1\'s char handled (delete). j shrinks → word2\'s char handled (insert). Both shrink → replace or match.',
          },
        ],
      },
      {
        id: 'optimized-two-sequences',
        title: 'Optimized approach — counting and pattern matching',
        blocks: [
          {
            type: 'text',
            md: `**Is subsequence** (\`s\` inside \`t\`): two pointers are enough — walk \`t\`, advance in \`s\` when characters match. The DP view (\`dp[i][j]\` = "is s[0..i) a subsequence of t[0..j)?") is what generalises to the harder problems.

**Distinct subsequences** (how many ways does \`t\` appear as a subsequence of \`s\`?). For the last character of \`s\`:
- **don't use it**: \`dp[i−1][j]\` ways;
- **use it** — only possible if \`s[i−1] === t[j−1]\`: \`dp[i−1][j−1]\` ways.

Add them (they are disjoint choices). Base: \`dp[i][0] = 1\` — the empty \`t\` appears exactly once in anything (choose nothing).

**Regular expression matching** (\`.\` = any one char, \`x*\` = zero or more x's). \`dp[i][j]\` = does \`s[0..i)\` match \`p[0..j)\`?
- \`p[j−1]\` is a normal char or \`.\`: it must match \`s[i−1]\`, then \`dp[i−1][j−1]\`.
- \`p[j−1]\` is \`*\`: the pair \`x*\` (x = \`p[j−2]\`) is **one unit**. Two choices:
  1. **Zero copies**: throw the pair away → \`dp[i][j−2]\`.
  2. **One more copy**: if \`s[i−1]\` matches x, consume that character of s **but keep the pair** (it may eat more) → \`dp[i−1][j]\`.

The row \`i = 0\` matters: the empty string matches \`a*b*c*\`, so \`dp[0][j] = dp[0][j−2]\` when \`p[j−1] === '*'\`.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: '"*" is not a wildcard on its own',
            md: 'In this regex problem `*` never stands alone — it modifies the character **before** it. `"a*"` means "any number of a", not "a followed by anything". Treat `p[j−2]` and `p[j−1]` together; that is why the zero-copies transition jumps back **two** columns.',
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-6',
            question: 'Regex DP: `s = "aa"`, `p = "a*"`. For the cell (i = 2, j = 2) we use the "one more copy" transition. Why does it read `dp[1][2]` and not `dp[1][0]`?',
            options: [
              'Because the star pair must be consumed along with the character',
              'Because after eating one "a" of s, the same "a*" may still eat more a\'s — so the pattern index j stays put',
              'Because dp[1][0] is out of bounds',
              'It should read dp[1][1]',
            ],
            answer: 1,
            explanation: '"One more copy" consumes a character of **s** only. The `a*` unit stays available, so j stays at 2. dp[1][2] ("a" vs "a*") is true, therefore dp[2][2] is true.',
            misconceptions: {
              0: 'If we dropped the pair after one use, "a*" could match at most one "a" — it would behave like "a?".',
              2: 'dp[1][0] exists (it is false: "a" vs empty pattern). It is simply the wrong transition.',
              3: 'dp[1][1] compares "a" with "a" — the pattern without the star. The star pair is a unit; you never stop halfway through it.',
            },
          },
        ],
      },
      {
        id: 'template-two-sequences',
        title: 'Pattern / template — two sequences',
        blocks: [
          {
            type: 'code',
            title: 'Edit distance — the prefix × prefix skeleton',
            code: `function minDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;     // delete everything
  for (let j = 0; j <= n; j++) dp[0][j] = j;     // insert everything
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(
        dp[i - 1][j - 1], // replace
        dp[i - 1][j],     // delete a[i-1]
        dp[i][j - 1],     // insert b[j-1]
      );
    }
  }
  return dp[m][n];
}`,
          },
          {
            type: 'text',
            md: `**Space optimisation:** row \`i\` reads row \`i−1\` (up, up-left) and itself (left). Keep \`prev\` and \`cur\` arrays, or a single array plus one variable \`diag\` holding the old \`dp[j−1]\` before it is overwritten. Choose the shorter string for the columns: O(min(m, n)) space.`,
          },
        ],
      },
      {
        id: 'implementation-two-sequences',
        title: 'JavaScript implementation — two sequences',
        blocks: [
          {
            type: 'code',
            title: 'LCS with two rolling rows — O(m·n) time, O(n) space',
            code: `function longestCommonSubsequence(a, b) {
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Compare characters with \`a[i - 1] === b[j - 1]\`; avoid \`a.slice()\` / \`substring\` inside the loops — each call is O(length) and allocates.
- For very long strings, \`a.charCodeAt(i)\` comparisons on typed arrays are slightly faster than string indexing.
- Counting DPs (distinct subsequences) can exceed \`Number.MAX_SAFE_INTEGER\` (2^53 − 1) on adversarial inputs. If the problem guarantees the answer fits in 32 bits you are fine; otherwise use \`BigInt\` or a modulus.`,
          },
        ],
      },
      {
        id: 'dry-run-two-sequences',
        title: 'Dry run — LCS("abcde", "ace")',
        blocks: [
          {
            type: 'dryrun',
            title: 'Rows = prefixes of a, columns = "", a, c, e',
            columns: ['i (a[i−1])', 'row dp[i][0..3]', 'notable cell'],
            rows: [
              ['0 (empty)', '[0, 0, 0, 0]', 'base row'],
              ['1 (a)', '[0, 1, 1, 1]', 'a == a → diagonal 0 + 1'],
              ['2 (b)', '[0, 1, 1, 1]', 'b matches nothing → copy max(up, left)'],
              ['3 (c)', '[0, 1, 2, 2]', 'c == c → dp[2][1] + 1 = 2'],
              ['4 (d)', '[0, 1, 2, 2]', 'no match'],
              ['5 (e)', '[0, 1, 2, 3]', 'e == e → dp[4][2] + 1 = 3'],
            ],
            note: 'Answer 3 ("ace"). To recover the subsequence, walk back from dp[5][3]: diagonal steps on matches are the chosen characters.',
          },
        ],
      },
      {
        id: 'intuition-knapsack',
        title: 'Core intuition — 0/1 knapsack',
        blocks: [
          {
            type: 'text',
            md: `You have a bag of capacity \`C\` and items with a weight and a value. Each item can be taken **at most once** ("0/1": take 0 or 1 copy). Maximise the total value.

Go through the items one at a time. For item \`i\` there are only two choices:
- **skip it** → best is whatever the first \`i−1\` items could do with the same capacity: \`dp[i−1][c]\`;
- **take it** (if it fits) → pay its weight, gain its value: \`dp[i−1][c − w] + v\`.

\`\`\`text
dp[i][c] = max(dp[i−1][c], dp[i−1][c − w_i] + v_i)
\`\`\`

Why is this state enough? Once items \`0..i−1\` are decided, the future only cares about **how much capacity is left**, not which items produced it. Many different subsets collapse into the same cell — that's the overlap DP exploits.`,
          },
          {
            type: 'visual',
            scenario: 'dp-knapsack',
            input: { weights: [1, 3, 4], values: [15, 20, 30], capacity: 4 },
            caption: 'Each row adds one item. A cell either copies the cell above (skip) or looks up-and-left by the item\'s weight (take).',
          },
          {
            type: 'text',
            md: `**Squeezing the table into one array.** Row \`i\` only reads row \`i−1\`, at columns \`c\` and \`c − w\` (to the **left**). If we overwrite a single array \`dp\` in place:

- Going **left → right**, by the time we reach \`c\`, slot \`c − w\` already holds the **new** row-\`i\` value — i.e. a value that may *already include item i*. Taking item i again on top of it = using item i twice. ✗
- Going **right → left**, slot \`c − w\` has not been touched yet in this row — it still holds the **old** row-\`i−1\` value. Exactly what the formula needs. ✓

\`\`\`js
for (const [w, v] of items)
  for (let c = C; c >= w; c--)       // BACKWARDS
    dp[c] = Math.max(dp[c], dp[c - w] + v);
\`\`\``,
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-7',
            question: 'Subset sum with `nums = [3]`, target 6, one array `dp` (dp[0] = true). You accidentally loop `s` from 3 **up to** 6. What does dp[6] become, and why?',
            options: [
              'false — 3 alone cannot make 6',
              'true — dp[3] became true earlier in the same pass, then dp[6] = dp[6 − 3] reused it, i.e. the 3 was used twice',
              'An error — index out of range',
              'true, and that is correct because 3 + 3 = 6',
            ],
            answer: 1,
            explanation: 'Forward iteration reads a slot that was already updated in the current item\'s pass, so the same item is counted again. That is unbounded knapsack behaviour. Iterate backwards for 0/1.',
            misconceptions: {
              0: 'That is the correct answer for 0/1 — but the forward loop does NOT produce it; it produces true.',
              2: 'Indices 0..6 all exist; s − 3 ≥ 0 inside the loop.',
              3: '3 + 3 uses the single element twice. Subset sum allows each element at most once.',
            },
            deeper: 'Walk it: s=3 → dp[3] = dp[0] = true. s=6 → dp[6] = dp[3] — but dp[3] is the value we set a moment ago *for this same item*. Backwards: s=6 reads dp[3] while it is still false, then s=3 sets dp[3]. Correct.',
          },
        ],
      },
      {
        id: 'optimized-knapsack',
        title: 'Optimized approach — subset sum, partition and target sum',
        blocks: [
          {
            type: 'text',
            md: `**Subset sum / partition equal subset sum.** Split \`nums\` into two groups of equal sum ⇔ find a subset with sum \`total / 2\`. If \`total\` is odd, answer \`false\` immediately. Then run the boolean 0/1 knapsack: \`dp[s] = dp[s] || dp[s − x]\`.

**Target sum** (put \`+\` or \`−\` before every number to reach \`target\`). Call the plus-group \`P\` and the minus-group \`N\`:

\`\`\`text
P − N = target
P + N = total
⇒ 2P = total + target   ⇒   P = (total + target) / 2
\`\`\`

So: **count subsets with sum P**. If \`total + target\` is odd or \`|target| > total\`, there are 0 ways. Counting version: \`dp[0] = 1\`, \`dp[s] += dp[s − x]\`, still backwards. Zeros are handled naturally: a 0 doubles the count (±0 are two different sign choices).`,
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-8',
            question: '`nums = [1, 1, 1, 1, 1]`, `target = 3`. After the transform, which subset-sum question do we answer?',
            options: [
              'Count subsets with sum 4',
              'Count subsets with sum 3',
              'Is there a subset with sum 5?',
              'Count subsets with sum (5 − 3) / 2 = 1',
            ],
            answer: 0,
            explanation: 'total = 5, P = (5 + 3) / 2 = 4. Choosing which four 1s get a "+" gives C(5, 4) = 5 ways — the known answer.',
            misconceptions: {
              1: 'Subsets summing to the target itself ignore the minus signs: the other numbers would then need to sum to 0.',
              2: 'We need a count, and 5 would be total, not P.',
              3: '(total − target) / 2 = 1 is the sum of the **minus** group N. Counting it also gives 5 — so it works — but the derivation we use is P = (total + target) / 2; mixing them up in the formula is how sign bugs appear.',
            },
          },
        ],
      },
      {
        id: 'template-knapsack',
        title: 'Pattern / template — 0/1 knapsack',
        blocks: [
          {
            type: 'code',
            title: '2D table (easiest to reason about)',
            code: `function knapsack2D(w, v, C) {
  const n = w.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(C + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= C; c++) {
      dp[i][c] = dp[i - 1][c];                                   // skip item i-1
      if (c >= w[i - 1]) dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]); // take
    }
  }
  return dp[n][C];
}`,
          },
          {
            type: 'code',
            title: '1D rolling array (the version to write in interviews)',
            code: `function canReach(nums, target) {
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;                               // empty subset
  for (const x of nums) {
    for (let s = target; s >= x; s--) {       // backwards!
      if (dp[s - x]) dp[s] = true;
    }
  }
  return dp[target];
}`,
          },
        ],
      },
      {
        id: 'implementation-knapsack',
        title: 'JavaScript implementation — 0/1 knapsack',
        blocks: [
          {
            type: 'code',
            title: 'Partition equal subset sum',
            code: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 === 1) return false;
  const half = total / 2;
  const dp = new Uint8Array(half + 1);       // 0/1 flags, zero-initialised
  dp[0] = 1;
  for (const x of nums) {
    for (let s = half; s >= x; s--) dp[s] |= dp[s - x];
    if (dp[half]) return true;               // early exit
  }
  return false;
}`,
            caption: 'Uint8Array is a compact boolean array. The early exit is optional but free.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Pseudo-polynomial',
            md: 'O(n · C) looks polynomial, but C is a **number**, not an input length: doubling the number of digits squares C. That is why knapsack is called *pseudo-polynomial* and why it only works when the capacity is small. Subset sum is NP-complete in general.',
          },
        ],
      },
      {
        id: 'dry-run-knapsack',
        title: 'Dry run — 0/1 knapsack',
        blocks: [
          {
            type: 'dryrun',
            title: 'weights [1, 3, 4], values [15, 20, 30], capacity 4 — 1D array, backwards',
            columns: ['item (w, v)', 'dp[0..4] after the item', 'interesting update'],
            rows: [
              ['start', '[0, 0, 0, 0, 0]', '—'],
              ['(1, 15)', '[0, 15, 15, 15, 15]', 'every c ≥ 1 takes it once (backwards stops double use)'],
              ['(3, 20)', '[0, 15, 15, 20, 35]', 'c=4: max(15, dp[1] + 20 = 35); c=3: max(15, dp[0]+20)'],
              ['(4, 30)', '[0, 15, 15, 20, 35]', 'c=4: max(35, dp[0] + 30 = 30) → keep 35'],
            ],
            note: 'Answer 35 = items 1 and 3 (weights 1 + 3). With a forward loop, the first row would become [0,15,30,45,60] — item 1 taken four times.',
          },
        ],
      },
      {
        id: 'intuition-unbounded',
        title: 'Core intuition — unbounded knapsack',
        blocks: [
          {
            type: 'text',
            md: `If every item/coin can be reused, "take it" keeps you on the **same** item: \`dp[i][c] = dp[i−1][c] + dp[i][c − coin]\` (note the \`i\`, not \`i−1\`, in the second term). In 1D, that is precisely what the **forward** loop does — the slot \`c − coin\` already includes this coin.

**Coin change II — counting combinations.**

\`\`\`js
dp[0] = 1;
for (const coin of coins)            // coins OUTER
  for (let a = coin; a <= amount; a++)
    dp[a] += dp[a - coin];
\`\`\`

Because coins are processed one at a time, every way is built as "some 1s, then some 2s, then some 5s" — coins appear in a fixed order, so the multiset \`{1, 2, 2}\` is counted exactly **once**.

Swap the loops (amount outer, coins inner) and each \`dp[a]\` asks "what is the **last** coin?", trying every coin every time — that counts \`1+2+2\`, \`2+1+2\`, \`2+2+1\` separately: **permutations**. That is exactly *Combination Sum IV* from DP 1D.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-9',
            question: '`coins = [1, 2]`, `amount = 3`. The coins-outer loop returns 2 ({1,1,1}, {1,2}). What does the amount-outer loop return?',
            options: ['2', '4', '3', '1'],
            answer: 2,
            explanation: 'Amount-outer counts ordered sequences: 1+1+1, 1+2, 2+1 → 3. Loop order is the whole difference between combinations and permutations.',
            misconceptions: {
              0: 'That is the combinations count. Amount-outer lets each position be any coin, so (1,2) and (2,1) are both counted.',
              1: 'There are only three ordered sequences of 1s and 2s summing to 3.',
              3: 'Even as combinations there are two (1+1+1 and 1+2).',
            },
            deeper: 'Amount-outer: dp = [1, 1, 2, 3]. dp[2] = dp[1] + dp[0] = 2 (1+1, 2). dp[3] = dp[2] (last coin 1) + dp[1] (last coin 2) = 3.',
          },
        ],
      },
      {
        id: 'optimized-unbounded',
        title: 'Optimized approach — unbounded knapsack',
        blocks: [
          {
            type: 'text',
            md: `The one-line summary you need to remember:

| Goal | Outer loop | Inner loop direction |
|---|---|---|
| 0/1 (each item once) | items | capacity **backwards** |
| Unbounded, count **combinations** | items | capacity **forwards** |
| Unbounded, count **permutations** | amount | items (any order) |
| Unbounded, **min / max** (coin change) | either | forwards — order doesn't change a min |

For min/max problems the loop order does not matter, because a multiset has the same cost whatever order you build it in — only **counting** is sensitive to double counting.`,
          },
          {
            type: 'reflect',
            prompt: 'Can you explain in your own words why the **inner** loop direction decides "once" vs "unlimited", but the **outer** loop decides "combinations" vs "permutations"?',
            deeper: `Inner direction controls whether the slot you read (\`c − w\`) already includes the **current** item: forwards → yes (reuse allowed), backwards → no (at most once).

The outer loop controls **how a solution is decomposed**. Items outer: a solution is "decide coin 1's count, then coin 2's count…" — one decomposition per multiset. Amount outer: a solution is "choose the last coin, then solve the rest" — one decomposition per *sequence*, so orders are distinguished.`,
          },
        ],
      },
      {
        id: 'template-unbounded',
        title: 'Pattern / template — unbounded knapsack',
        blocks: [
          {
            type: 'code',
            title: 'Combinations vs permutations side by side',
            code: `function combinations(coins, amount) {       // coin change II
  const dp = new Array(amount + 1).fill(0); dp[0] = 1;
  for (const c of coins)
    for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
  return dp[amount];
}

function permutations(nums, target) {         // combination sum IV (DP 1D)
  const dp = new Array(target + 1).fill(0); dp[0] = 1;
  for (let a = 1; a <= target; a++)
    for (const x of nums) if (x <= a) dp[a] += dp[a - x];
  return dp[target];
}`,
          },
        ],
      },
      {
        id: 'implementation-unbounded',
        title: 'JavaScript implementation — unbounded knapsack',
        blocks: [
          {
            type: 'code',
            title: 'Maximum value with unlimited copies (rod cutting shape)',
            code: `function unboundedMax(weights, values, C) {
  const dp = new Array(C + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let c = weights[i]; c <= C; c++)          // forwards: reuse allowed
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
  return dp[C];
}`,
          },
        ],
      },
      {
        id: 'dry-run-unbounded',
        title: 'Dry run — coin change II',
        blocks: [
          {
            type: 'dryrun',
            title: 'coins [1, 2, 5], amount 5',
            columns: ['coin', 'dp[0..5] after the coin', 'meaning'],
            rows: [
              ['start', '[1, 0, 0, 0, 0, 0]', 'only 0 is reachable (empty choice)'],
              ['1', '[1, 1, 1, 1, 1, 1]', 'using only 1s: one way each'],
              ['2', '[1, 1, 2, 2, 3, 3]', 'dp[4] = 1 + dp[2] = 3 → {1111, 112, 22}'],
              ['5', '[1, 1, 2, 2, 3, 4]', 'dp[5] = 3 + dp[0] = 4'],
            ],
            note: 'Answer 4: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Shared rows:** \`new Array(m).fill(new Array(n))\` — every row is the same object.
2. **Index confusion:** dp uses prefix *lengths* (\`i\`), strings use positions (\`a[i − 1]\`). Decide once and comment it.
3. **Missing base row/column:** empty prefix, first grid row, capacity 0, \`dp[0] = 1\` for counting.
4. **Wrong fill order:** reading a cell that hasn't been computed yet (it silently holds 0).
5. **Rolling-array direction:** 0/1 knapsack must go backwards; unique paths must go forwards; edit distance needs a saved \`diag\` value.
6. **Loop order in counting:** coins outer = combinations, amount outer = permutations.
7. **Dungeon game forwards:** the constraint depends on the future; go backwards and clamp with \`max(1, …)\`.
8. **Regex \`*\`:** treating it as its own token instead of a unit with the previous character, or forgetting the empty-string row (\`"" ~ "a*"\`).
9. **Target sum edge cases:** odd \`total + target\`, or \`|target| > total\` → 0 ways (and a negative array index otherwise).`,
          },
          {
            type: 'checkpoint',
            id: 'dp-2d-cp-10',
            question: 'Edit distance with ONE array. Inside row i you compute `dp[j] = 1 + min(dp[j−1], dp[j], ???)`. What goes in ??? and where does it come from?',
            options: [
              'dp[j + 1] — the next cell',
              'The OLD value of dp[j − 1] (the up-left cell), saved in a variable before dp[j − 1] was overwritten',
              'dp[j − 1] again',
              'Nothing — replace is not needed',
            ],
            answer: 1,
            explanation: 'Up-left is row i−1, column j−1. In a single array that slot has already been overwritten with row i\'s value, so you must save it (`diag`) before overwriting. Classic pattern: `const tmp = dp[j]; dp[j] = …; diag = tmp;`.',
            misconceptions: {
              0: 'Edit distance never reads to the right.',
              2: 'dp[j−1] now holds the *new* left value (insert). Up-left is a different cell.',
              3: 'Replace is one of the three operations; "horse" → "rose" needs it.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(states × transition cost) — O(m·n) or O(n·C)',
            space: 'O(m·n) table, usually O(n) or O(C) with a rolling array',
            md: `**Time:** number of cells × work per cell. Every problem in this topic has O(1) work per cell, so: grid O(m·n), two strings O(|a|·|b|), knapsack O(n·C).

**Space:** the full table, or one/two rows when the transition only looks one row back. Note: if you need to **reconstruct** the actual path / subsequence / chosen items, keep the full table (or you lose the information to walk back).

**Pseudo-polynomial:** knapsack's O(n·C) depends on the numeric value C — fine for C ≈ 10^4, hopeless for 10^9.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the state out loud in one sentence** before touching the keyboard: "dp[i][j] is the edit distance between the first i characters of word1 and the first j of word2."
- **Start from the recursion**, then memoise, then tabulate. Interviewers accept either; the recursion shows you understand the transition.
- **Draw the 3×3 corner of the table** on the whiteboard and fill it by hand — it catches base-case bugs instantly.
- **Mention the space optimisation** and *why its loop direction is what it is*. "Backwards so each item is used once" is a strong signal.
- **Knapsack recognition:** "each element used once + target sum" → 0/1; "unlimited" → unbounded; ask whether order matters.
- **Edge cases:** empty strings, 1×1 grid, obstacle on the start or end cell, target larger than the total, zeros in target sum.`,
          },
          {
            type: 'reflect',
            prompt: 'If an interviewer asks "how did you choose the loop order?", could you answer from the dependency arrows rather than from memory?',
            deeper: 'Point at the transition: "dp[i][j] reads dp[i−1][j−1], dp[i−1][j] and dp[i][j−1] — up-left, up and left. So when I reach (i, j) those must be done: rows increasing, columns increasing." For the dungeon: "it reads down and right, so I fill from the bottom-right corner." Deriving the order is more convincing than remembering it.',
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'Array.from({ length: m }, () => new Array(n).fill(0))', use: 'Independent rows for a 2D table', complexity: 'O(m·n)' },
              { api: 'new Array(n + 1).fill(0)', use: 'A rolling row or 1D knapsack array', complexity: 'O(n)' },
              { api: 'new Uint8Array(n) / new Int32Array(n)', use: 'Compact zero-filled boolean / integer rows', complexity: 'O(n)' },
              { api: 'Math.min(a, b, c)', use: 'Edit distance / maximal square transitions', complexity: 'O(1)' },
              { api: 'Infinity', use: 'Out-of-grid sentinel for min DPs', complexity: 'O(1)' },
              { api: 'a[i - 1] === b[j - 1]', use: 'Character comparison without substrings', complexity: 'O(1)' },
              { api: 'BigInt', use: 'Counts that may exceed 2^53 − 1', complexity: 'slower arithmetic' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['State needs two indices (cell, two prefixes, item + capacity)', 'Right/down grid paths or costs', 'LCS / edit distance / subsequence counting / regex', 'Subset sum, partition, target sum, coin combinations'],
    clues: ['only right or down', 'two strings', 'insert / delete / replace', 'subsequence', 'each item at most once', 'unlimited coins', 'number of combinations', 'largest square'],
    template: `// state → base → transition → order → answer → roll
const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
for (let i = 1; i <= m; i++)
  for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

// 0/1 knapsack: for (x of items) for (c = C; c >= x; c--)  ← backwards
// unbounded:    for (x of items) for (c = x; c <= C; c++)  ← forwards (combinations)`,
    complexity: 'O(m·n) or O(n·C) time; O(n) / O(C) space with a rolling array',
    mistakes: ['fill(new Array()) shared rows', 'off-by-one between prefix length and string index', 'forward loop in 0/1 knapsack', 'loop order counting permutations', 'dungeon filled forwards', 'regex star not treated as a pair'],
    jsTools: ['Array.from', 'Uint8Array', 'Math.min/max', 'Infinity', 'BigInt'],
  },

  keyConcepts: [
    'A 2D DP state has two changing parameters: (row, col), (prefix of a, prefix of b) or (item, capacity).',
    'The dependency direction of the transition decides the loop order; backward dependencies (triangle, dungeon) mean filling from the end.',
    'Two-sequence DP always asks "what happens to the last characters?" — match, or drop one (edit distance adds replace).',
    'In regex matching, "x*" is one unit: zero copies → dp[i][j−2], one more copy → dp[i−1][j].',
    '0/1 knapsack in 1D iterates capacity backwards so each item is used at most once; forwards means unlimited reuse.',
    'Items-outer counts combinations; amount-outer counts permutations.',
    'Target sum reduces to counting subsets with sum (total + target) / 2.',
    'Rolling arrays cut space to one row when a row only reads the previous row — but you lose the ability to reconstruct the path.',
  ],

  interviewTips: [
    'State the dp definition in one sentence before coding.',
    'Derive loop order from the dependency arrows.',
    'Explain why the 1D knapsack loop goes backwards.',
    'Hand-fill the first rows of the table to check base cases.',
  ],
};
