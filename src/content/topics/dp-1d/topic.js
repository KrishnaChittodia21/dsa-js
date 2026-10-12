export default {
  id: 'dp-1d',
  summary: 'Dynamic programming is recursion plus remembering: define what one subproblem means, write how it depends on smaller ones, and compute each exactly once.',

  jsTools: [
    { api: 'new Array(n + 1).fill(0)', use: 'The DP table dp[0..n] (tabulation)', complexity: 'O(n) to create' },
    { api: 'new Map()', use: 'Memo for recursion (key → answer); also Map<stone, Set<jump>> in frog jump', complexity: 'O(1) average get/set' },
    { api: 'memo.has(k) before memo.get(k)', use: 'Distinguish "not computed" from a stored 0/false', complexity: 'O(1)' },
    { api: 'new Set(wordDict)', use: 'O(1) dictionary lookups in word break', complexity: 'O(L) hashing per lookup' },
    { api: 's.slice(j, i)', use: 'Candidate word s[j..i) — costs O(i − j)', complexity: 'O(length)' },
    { api: '% 1_000_000_007', use: 'Keep counts small; numeric separators make 1e9+7 readable', complexity: 'O(1)' },
    { api: 'Infinity', use: 'Initial value for "minimum" DP cells (unreachable)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'dp-1d-linear-sequence',
      name: '1D DP — Linear Sequence (look back a fixed distance)',
      summary: 'dp[i] depends on a few previous cells (dp[i−1], dp[i−2], …). Fill left to right, then usually shrink the table to a couple of variables.',
      whyItExists: 'The brute-force recursion branches at every index, so it is exponential, yet there are only n distinct subproblems ("the answer for the first i elements"). Storing each one turns 2ⁿ into n.',
      whenToUse: [
        'Counting ways to reach step n with small moves (climbing stairs, tribonacci)',
        'Choosing elements with a "no two adjacent" rule (house robber)',
        'Minimum cost to walk to the end with 1- or 2-steps',
        'Problems that reduce to house robber after bucketing values (delete and earn)',
      ],
      clues: ['"number of distinct ways to reach"', '"cannot pick two adjacent"', '"minimum cost to reach the top"', '"houses arranged in a circle"', '"maximum points by deleting"'],
      whenNotToUse: [
        'The choice depends on more than position (e.g. remaining capacity, a second string) → 2D DP',
        'A proven greedy exists and is simpler (jump game reachability)',
      ],
      template: `function linearDP(nums) {
  // dp[i] = best answer using the first i elements
  let prev2 = 0;           // dp[i - 2]
  let prev1 = 0;           // dp[i - 1]
  for (const x of nums) {
    const cur = Math.max(prev1, prev2 + x); // transition (house robber shown)
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;            // answer location: dp[n]
}`,
      variations: [
        { name: 'Counting', description: 'dp[i] = dp[i−1] + dp[i−2] (+ dp[i−3]).' },
        { name: 'Take / skip', description: 'dp[i] = max(dp[i−1], dp[i−2] + value[i]).' },
        { name: 'Circular array', description: 'Run the linear DP twice: without the first element, and without the last.' },
        { name: 'Reduce to linear', description: 'Delete and earn: bucket points by value, then house robber over values.' },
      ],
      mistakes: ['Wrong base cases (dp[0] vs dp[1])', 'Off-by-one between "first i elements" and "index i"', 'Circular variant with n = 1'],
      evolution: {
        easy: 'Climbing stairs, tribonacci, min cost climbing stairs.',
        medium: 'House robber, house robber II, delete and earn.',
        hard: 'Linear DP with several states per index (stock problems with cooldown — see DP advanced).',
      },
    },
    {
      id: 'dp-1d-unbounded-choice',
      name: '1D DP — Unbounded Choices (try every last move)',
      summary: 'dp[x] = best over every option o that can be the last move: combine dp[x − o]. Options can be reused any number of times.',
      whyItExists: 'Greedy picks one "obvious" last move and can be wrong (coins [1, 3, 4], amount 6). DP tries every possible last move but still solves each amount only once — O(amount × options).',
      whenToUse: [
        'Fewest coins / squares / passes to reach a total',
        'Number of ordered sequences that sum to a target (combination sum IV)',
        'Cheapest way to cover a set of days with passes of different lengths',
      ],
      clues: ['"fewest number of coins"', '"least number of perfect squares"', '"number of possible combinations" where order matters', '"1-day, 7-day, 30-day passes"', '"infinite supply"'],
      whenNotToUse: [
        'Each item may be used at most once → 0/1 knapsack (DP 2D)',
        'Counting unordered combinations (coin change II) → loop coins outside, amounts inside (DP 2D topic)',
      ],
      template: `function minItems(options, target) {
  const dp = new Array(target + 1).fill(Infinity);
  dp[0] = 0;                              // base: zero items make 0
  for (let x = 1; x <= target; x++) {
    for (const o of options) {            // every possible LAST move
      if (o <= x) dp[x] = Math.min(dp[x], dp[x - o] + 1);
    }
  }
  return dp[target] === Infinity ? -1 : dp[target];
}`,
      variations: [
        { name: 'Minimum count', description: 'Coin change, perfect squares.' },
        { name: 'Count ordered sequences', description: 'Combination sum IV: dp[x] = Σ dp[x − o] with the amount loop OUTSIDE.' },
        { name: 'Look-back by duration', description: 'Minimum cost for tickets: dp[day] = min over passes of dp[day − length] + price.' },
      ],
      mistakes: ['Initialising a min-DP with 0 instead of Infinity', 'Swapping loop order and counting combinations instead of permutations (or vice versa)', 'Returning Infinity instead of -1'],
      evolution: {
        easy: 'Minimum cost over a small fixed set of steps.',
        medium: 'Coin change, perfect squares, combination sum IV, tickets.',
        hard: 'Adding a second constraint (limited coins, exact count) moves into 2D DP.',
      },
    },
    {
      id: 'dp-1d-string-decoding',
      name: '1D DP — String Decoding (1- and 2-character steps)',
      summary: 'dp[i] = number of ways to decode the first i characters; the last piece is either one character or two characters, each valid or not.',
      whyItExists: 'Every prefix can be split in several ways, and different splits share the same remaining suffix. Counting splits recursively re-counts the suffix exponentially often.',
      whenToUse: ['Count decodings of a digit string', 'Wildcards that stand for several digits (decode ways II)', 'Any "split the string into valid tokens of length 1 or 2" count'],
      clues: ['"A → 1 … Z → 26"', '"number of ways to decode"', '"* can be any digit 1–9"', '"answer modulo 10^9 + 7"'],
      whenNotToUse: ['Tokens can have arbitrary length from a dictionary → prefix segmentation (word break)'],
      template: `function numDecodings(s) {
  let prev2 = 1;                  // dp[i - 2]  (dp[0] = 1: empty prefix)
  let prev1 = s[0] === '0' ? 0 : 1; // dp[1]
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += prev1;                 // single digit
    const two = Number(s.slice(i - 2, i));
    if (two >= 10 && two <= 26) cur += prev2;           // two digits
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
      variations: [
        { name: 'Wildcard digits', description: 'Decode ways II: multiply by the number of valid meanings of each 1- or 2-char piece; take results mod 1e9+7.' },
      ],
      mistakes: ['Treating "0" as decodable alone', 'Accepting "06" as a two-digit code', 'Forgetting the modulo on intermediate sums (overflows 2^53)'],
      evolution: {
        easy: 'Fibonacci-like counting with validity checks.',
        medium: 'Decode ways.',
        hard: 'Decode ways II (wildcards, case analysis, modulo).',
      },
    },
    {
      id: 'dp-1d-prefix-segmentation',
      name: '1D DP — Prefix Segmentation (word break)',
      summary: 'dp[i] = can (or how can) the first i characters be split into dictionary words; try every last word s[j..i).',
      whyItExists: 'Backtracking over split points is exponential ("aaaa…b"). The only thing that matters about a partial split is where it ends, so there are only n + 1 states.',
      whenToUse: ['Can a string be segmented into dictionary words?', 'Return all segmentations (memoized DFS on suffixes)', 'Minimum number of pieces / extra characters'],
      clues: ['"segmented into a space-separated sequence of dictionary words"', '"return all such possible sentences"', '"word may be reused"'],
      whenNotToUse: ['Tokens are fixed length (1 or 2) → string decoding pattern is simpler'],
      template: `function wordBreak(s, words) {
  const dict = new Set(words);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;                                  // empty prefix is segmentable
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {                // last word is s[j..i)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}`,
      variations: [
        { name: 'Limit word length', description: 'Only try j ≥ i − maxWordLength.' },
        { name: 'All sentences', description: 'Memoized DFS returning a list per start index; output can be exponential.' },
      ],
      mistakes: ['Forgetting dp[0] = true', 'Using an array for the dictionary (O(k) includes)', 'Generating all sentences without memoization'],
      evolution: {
        easy: 'Check if a string is a concatenation of two words.',
        medium: 'Word break.',
        hard: 'Word break II (all sentences), concatenated words.',
      },
    },
    {
      id: 'dp-1d-state-map',
      name: '1D DP — Position + Extra State in a Map',
      summary: 'When the index alone is not enough, attach the missing information (last jump size…) to each position, storing reachable states in Map<position, Set<state>>.',
      whyItExists: 'Some problems are "1D" in position but need one more fact to decide the next move. Storing only the states that actually occur keeps memory proportional to what is reachable.',
      whenToUse: ['Next move depends on the previous move (frog jump: k − 1, k, k + 1)', 'Sparse positions (stone coordinates up to 2³¹)'],
      clues: ['"if the last jump was k units, the next must be k − 1, k or k + 1"', 'positions are sparse / huge'],
      whenNotToUse: ['The extra state is small and dense → a plain 2D array is simpler (DP 2D)'],
      template: `function frog(stones) {
  const reach = new Map(stones.map((s) => [s, new Set()]));
  reach.get(stones[0]).add(0);                     // at the start with "last jump 0"
  for (const s of stones) {
    for (const k of reach.get(s)) {
      for (const step of [k - 1, k, k + 1]) {
        if (step > 0 && reach.has(s + step)) reach.get(s + step).add(step);
      }
    }
  }
  return reach.get(stones[stones.length - 1]).size > 0;
}`,
      variations: [{ name: 'Memoized DFS', description: 'dfs(index, lastJump) with key `${index},${k}` in a Map/Set.' }],
      mistakes: ['Allowing a jump of size 0', 'Not requiring the first jump to be exactly 1'],
      evolution: {
        easy: '—',
        medium: 'Reachability with a small extra state.',
        hard: 'Frog jump.',
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
            md: `**Dynamic programming (DP)** is a way to solve a problem by breaking it into smaller versions of itself — exactly like recursion — **and writing down each smaller answer the first time you compute it**, so you never compute it again.

That is really all it is:

> **DP = recursion + remembering.**

Take *Climbing Stairs*: you climb n steps, taking 1 or 2 steps at a time. How many different ways are there? The last move was either a 1-step (from step n − 1) or a 2-step (from step n − 2), so

\`\`\`text
ways(n) = ways(n − 1) + ways(n − 2),   ways(0) = 1, ways(1) = 1
\`\`\`

That formula is the whole algorithm. DP is just the discipline of evaluating it without wasting work.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Subproblem / state** — a smaller version of the problem, described by a few parameters ("ways to reach step i").
- **Transition (recurrence)** — the formula that builds a state from smaller states.
- **Base case** — the smallest states whose answers you just know.
- **Overlapping subproblems** — the same state is needed many times by different branches.
- **Optimal substructure** — the best answer for a state is built from the best answers of its sub-states.
- **Memoization** — top-down: recursion + a cache.
- **Tabulation** — bottom-up: fill an array from the base cases upward.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Someone asks you "what is 1 + 1 + 1 + 1 + 1 + 1 + 1?" You count: 7. They add "+ 1" at the end. You do not recount from scratch — you say 8, because you **remembered** the 7. DP is building every answer from answers you already wrote down.',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-1',
            question: 'What is the key difference between plain recursion and dynamic programming?',
            options: [
              'DP never uses recursion',
              'DP stores the answer of every subproblem so each is computed only once',
              'DP always picks the locally best option',
              'DP only works on sorted arrays',
            ],
            answer: 1,
            explanation: 'The recurrence can be identical. DP adds a table (or cache) so that repeated subproblems are looked up instead of recomputed.',
            misconceptions: {
              0: 'Top-down DP (memoization) IS recursion — with a cache. Bottom-up DP replaces the recursion with a loop, but both are DP.',
              2: 'That is greedy. DP considers every option for the last step; greedy considers only one.',
              3: 'Sorting has nothing to do with it. DP works whenever subproblems overlap.',
            },
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Write the stairs formula as plain recursion and draw what happens for n = 5:

\`\`\`text
                    ways(5)
                /            \\
           ways(4)           ways(3)
          /      \\           /     \\
     ways(3)   ways(2)   ways(2)  ways(1)
     /    \\     /   \\     /   \\
ways(2) ways(1) ...    ...
\`\`\`

\`ways(3)\` is computed **twice**, \`ways(2)\` **three times**, and it gets worse fast: the tree has about 1.6ⁿ nodes. For n = 50 that is ~2·10¹⁰ calls — minutes of work. But there are only **n + 1 different questions** (ways(0) … ways(n)). Remember each one and the work drops to O(n).`,
          },
          {
            type: 'compare',
            left: {
              title: 'Plain recursion — O(φⁿ) ≈ O(1.6ⁿ)',
              code: `function climb(n) {
  if (n <= 1) return 1;
  return climb(n - 1) + climb(n - 2);
}`,
            },
            right: {
              title: 'Memoized — O(n)',
              code: `function climb(n, memo = new Map()) {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n);
  const ans = climb(n - 1, memo) + climb(n - 2, memo);
  memo.set(n, ans);
  return ans;
}`,
            },
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-2',
            question: 'With memoization, how many times is the body of `climb(k)` (the part after the cache check) executed for each k?',
            options: [
              'At most once — the second call finds the answer in the memo',
              'Twice, once for each parent',
              'Fibonacci(k) times',
              'n times',
            ],
            answer: 0,
            explanation: 'The first call computes and stores the result; every later call returns in O(1) at the `memo.has` check. With n + 1 distinct states and O(1) work each, the total is O(n).',
            misconceptions: {
              1: 'It may be *called* twice, but the second call stops at the cache check without recursing.',
              2: 'That is the number of times plain recursion (no memo) evaluates it.',
              3: 'Each state is independent of n in this sense — its body runs once.',
            },
            deeper: 'General rule for memoized recursion: **time = (number of distinct states) × (work per state, excluding recursive calls)**. For stairs: (n + 1) × O(1).',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use DP when both hold:

1. **Overlapping subproblems** — the brute-force recursion asks the same question repeatedly.
2. **Optimal substructure** — the answer for a state can be built from answers of smaller states (for counting: the count is a sum over disjoint cases).

Typical tasks: *count the ways*, *minimum/maximum cost*, *is it possible*, when every step offers several choices and a greedy rule is not provably safe.

It is called **1D** when a single number (an index, an amount, a day) identifies a state. When you need two numbers (two indices, index + capacity), that is 2D DP — the next topic.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-3',
            question: 'Which problem does NOT benefit from DP?',
            options: [
              'Number of ways to climb n stairs with 1- or 2-steps',
              'Fewest coins for an amount with coins [1, 3, 4]',
              'Maximum money from houses when you cannot rob two neighbours',
              'Find the maximum element of an array',
            ],
            answer: 3,
            explanation: 'Finding a maximum is a single scan — there are no overlapping subproblems or choices to combine.',
            misconceptions: {
              0: 'Classic DP: ways(n) = ways(n−1) + ways(n−2), with heavy overlap.',
              1: 'Greedy fails here (4+1+1 vs 3+3); DP tries every last coin.',
              2: 'House robber: rob(i) = max(rob(i−1), rob(i−2) + nums[i]) — overlapping take/skip branches.',
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
            clues: ['"number of ways"', '"minimum / maximum cost to reach"', '"can you … (true/false)" with many choices per step', '"fewest coins / squares"', '"cannot pick adjacent"', '"decode" / "segment into words"', 'greedy has a counter-example'],
            conclusion: 'Think DP: define dp[i], write the transition from the last choice',
          },
          {
            type: 'text',
            md: `A reliable way to discover the DP: **think about the LAST decision**.
- Stairs: the last step was 1 or 2.
- House robber: the last house was robbed or not.
- Coin change: the last coin was c₁ or c₂ or ….
- Decode ways: the last letter used 1 digit or 2 digits.
- Word break: the last word was s[j..i) for some j.

Each case leaves a **smaller** problem of the same kind. That gives you the transition.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Designing a DP is answering four questions, in this order:

1. **State** — what does \`dp[i]\` mean, *in words*? ("dp[i] = number of ways to reach step i", "dp[i] = max money from the first i houses").
2. **Transition** — how is \`dp[i]\` built from smaller states? (Think about the last decision.)
3. **Base cases** — which states are known directly? (\`dp[0] = 1\`: there is one way to stand at the bottom — do nothing.)
4. **Answer location** — which cell holds the final answer? (\`dp[n]\`, or \`max(dp)\`, or dp of the full amount.)

If you cannot say the state in one sentence, you are not ready to code.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: '"First i items" vs "index i"',
            md: 'Defining `dp[i]` as the answer for the **first i elements** (prefix of length i) gives you a natural empty base case `dp[0]` and avoids negative indices. `dp[i]` then looks at `nums[i − 1]`. It is a small shift that removes many off-by-one bugs.',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-4',
            question: 'For Climbing Stairs with `dp[i]` = number of ways to reach step i, why is `dp[0] = 1` and not 0?',
            options: [
              'Because arrays in JavaScript start at 1',
              'It is arbitrary; any value works',
              'Because there is exactly one way to be at step 0: take no steps. dp[2] = dp[1] + dp[0] must be 2',
              'Because dp[0] is never used',
            ],
            answer: 2,
            explanation: 'Base cases must be *true* statements about the state definition. "Ways to be at the bottom" = 1 (the empty sequence of moves). Check: dp[2] = dp[1] + dp[0] = 1 + 1 = 2 ({1,1}, {2}) ✓.',
            misconceptions: {
              0: 'JavaScript arrays are 0-indexed; the question is about meaning, not indexing.',
              1: 'A wrong base case corrupts every value built on it. With dp[0] = 0, dp[2] would be 1 — wrong.',
              3: 'dp[2] uses dp[0], so it definitely matters.',
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
            md: `Always start from the **recursive brute force** — it is the specification of your DP. Example, **House Robber**: houses in a row with money \`nums[i]\`; you cannot rob two adjacent houses.

\`rob(i)\` = the most money from houses \`0..i\`. For house i: skip it → \`rob(i − 1)\`, or rob it → \`nums[i] + rob(i − 2)\`.`,
          },
          {
            type: 'code',
            title: 'Brute-force recursion — O(2ⁿ)',
            code: `function rob(nums, i = nums.length - 1) {
  if (i < 0) return 0;                       // no houses → no money
  return Math.max(
    rob(nums, i - 1),                        // skip house i
    nums[i] + rob(nums, i - 2),              // rob house i
  );
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the house-robber recursion is exponential even though it only has two branches per call?',
            deeper: 'Every call spawns two more, and the depth is about n, so the tree has up to ~2ⁿ (more precisely ~1.6ⁿ) nodes. But the calls only ever ask about `rob(k)` for k in −1..n−1 — at most n + 1 distinct questions. The huge tree is the same few questions asked again and again. That mismatch (exponential calls, linear distinct states) is the signal that memoization will help.',
          },
        ],
      },
      {
        id: 'optimized-memo',
        title: 'Optimized approach — memoization (top-down)',
        blocks: [
          {
            type: 'text',
            md: `Keep the recursion, add a cache keyed by the state. Before computing, check the cache; after computing, store the result.`,
          },
          {
            type: 'code',
            title: 'House robber — memoized, O(n)',
            code: `function rob(nums) {
  const memo = new Array(nums.length).fill(-1);  // -1 = not computed (money is never negative)
  function best(i) {
    if (i < 0) return 0;
    if (memo[i] !== -1) return memo[i];
    memo[i] = Math.max(best(i - 1), nums[i] + best(i - 2));
    return memo[i];
  }
  return best(nums.length - 1);
}`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript stack depth',
            md: 'Memoized recursion still recurses **n levels deep** on the first call. V8\'s call stack typically allows around 10,000 frames — `best(50_000)` throws **RangeError: Maximum call stack size exceeded**. When n can be large, prefer tabulation (a loop), or warm the cache bottom-up.',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-5',
            question: 'You memoize with `if (memo[i]) return memo[i];`. On some inputs the code is still exponential. Why?',
            options: [
              'Arrays are slower than Maps',
              'Because a stored answer of 0 is falsy, so states whose answer is 0 are recomputed every time',
              'Because recursion can never be memoized in JavaScript',
              'Because the memo should be global',
            ],
            answer: 1,
            explanation: '`if (memo[i])` treats 0 (and false) as "not computed". Use a sentinel that cannot be a real answer (−1, undefined) or `memo.has(key)` with a Map.',
            misconceptions: {
              0: 'Arrays are actually faster for dense integer keys. The bug is the truthiness check.',
              2: 'Memoization works fine; the issue is how "already computed" is detected.',
              3: 'Where the memo lives does not matter as long as it is shared across calls for the same input.',
            },
          },
        ],
      },
      {
        id: 'optimized-tabulation',
        title: 'Optimized approach — tabulation (bottom-up)',
        blocks: [
          {
            type: 'text',
            md: `Instead of asking "what do I need?" (top-down), compute **every** state from the smallest upward, in an order where each state's dependencies are already filled.

\`dp[i]\` = best money from the **first i houses**: \`dp[0] = 0\`, \`dp[1] = nums[0]\`, \`dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1])\`.`,
          },
          {
            type: 'code',
            title: 'House robber — tabulation',
            code: `function rob(nums) {
  const n = nums.length;
  const dp = new Array(n + 1).fill(0);
  dp[1] = nums[0] ?? 0;
  for (let i = 2; i <= n; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
  }
  return dp[n];
}`,
          },
          {
            type: 'text',
            md: `| | Memoization (top-down) | Tabulation (bottom-up) |
|---|---|---|
| Order of evaluation | driven by recursion, only needed states | fixed loop order, all states |
| Code shape | closest to the recurrence | needs you to pick a valid order |
| Stack | O(depth) — can overflow in JS | none |
| Space optimisation | hard | easy (keep only the last few cells) |
| Best when | the state space is sparse or the order is awkward | states are dense and the order is obvious |`,
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-6',
            question: 'In the tabulated house robber, why must the loop go from i = 2 upwards?',
            options: [
              'Because dp[i] reads dp[i − 1] and dp[i − 2], which must already be final',
              'Because JavaScript loops must count up',
              'Going downwards is equally correct',
              'To save memory',
            ],
            answer: 0,
            explanation: 'Tabulation requires a **topological order** of the states: every dependency is computed before the state that uses it. Here dependencies point to smaller indices, so increasing i is valid.',
            misconceptions: {
              1: 'Loops can go in either direction; the direction is dictated by the dependencies.',
              2: 'Going downwards would read dp[i − 1] before it is computed (still 0) and give wrong answers.',
              3: 'The direction does not change memory use; dropping the table does.',
            },
          },
        ],
      },
      {
        id: 'optimized-space',
        title: 'Optimized approach — space optimisation',
        blocks: [
          {
            type: 'text',
            md: 'If `dp[i]` only reads the last two cells, you only need to **keep two variables**. Slide them forward like a window.',
          },
          {
            type: 'code',
            title: 'House robber — O(1) space',
            code: `function rob(nums) {
  let prev2 = 0; // dp[i - 2]
  let prev1 = 0; // dp[i - 1]
  for (const money of nums) {
    const cur = Math.max(prev1, prev2 + money);
    prev2 = prev1;   // shift the window: order matters!
    prev1 = cur;
  }
  return prev1;
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why `prev2 = prev1` must happen **before** `prev1 = cur`?',
            deeper: 'After this iteration, the new "two back" value is the old "one back" value. If you overwrite `prev1` first, the old one-back value is lost and `prev2` would become `cur`. Always compute `cur` from the old values, then shift from the oldest to the newest.',
          },
          {
            type: 'text',
            md: `**Circular variant (House Robber II):** the first and last houses are neighbours. Any valid plan skips at least one of them, so run the linear DP twice — on \`nums[0..n−2]\` and on \`nums[1..n−1]\` — and take the max. (n = 1 is a special case: just \`nums[0]\`.)

**Delete and earn** reduces to house robber: picking value v earns v × count(v) but forbids v − 1 and v + 1 — "adjacent values" instead of "adjacent houses". Bucket points by value and run house robber over values.`,
          },
        ],
      },
      {
        id: 'optimized-unbounded',
        title: 'Optimized approach — unbounded choices (coin change)',
        blocks: [
          {
            type: 'text',
            md: `**Coin change:** fewest coins summing to \`amount\` (unlimited coins of each type), or −1.

State: \`dp[x]\` = fewest coins to make x. Last decision: which coin was used last? If it was c, the rest makes x − c optimally:

\`\`\`text
dp[0] = 0
dp[x] = min over coins c ≤ x of dp[x − c] + 1      (Infinity if none works)
\`\`\`

This is exactly the fix for greedy's failure on coins [1, 3, 4] and amount 6: instead of trusting the biggest coin, try every coin as the last one.`,
          },
          {
            type: 'visual',
            scenario: 'dp-coin-change',
            input: { coins: [1, 3, 4], amount: 6 },
            caption: 'Each cell tries every coin as the last one. dp[6] = dp[3] + 1 = 2.',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-7',
            question: 'Coins `[1, 3, 4]`. Given dp[2] = 2, dp[3] = 1, dp[5] = 2, what is dp[6]?',
            options: ['3', '1', '4', '2'],
            answer: 3,
            explanation: 'dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2 — the coins 3 + 3.',
            misconceptions: {
              0: '3 is the greedy answer (4 + 1 + 1). DP also considers "last coin = 3", which gives 1 + dp[3] = 2.',
              1: 'No single coin equals 6.',
              2: 'No sensible combination needs 4 coins here (even greedy uses 3). Take the minimum over every possible last coin.',
            },
          },
          {
            type: 'text',
            md: `**Order matters vs order does not.** *Combination Sum IV* asks for the number of **ordered** sequences of numbers summing to target ((1,2) and (2,1) are different):

\`\`\`js
for (let x = 1; x <= target; x++)       // amount OUTSIDE
  for (const n of nums)                 // every possible last number
    if (n <= x) dp[x] += dp[x - n];
\`\`\`

If you swap the loops (numbers outside, amounts inside), each number is "introduced" in a fixed order, so each **multiset** is counted once — that is *Coin Change II* (unordered combinations), which you will meet in the DP 2D topic.

**Perfect squares** is coin change where the coins are 1, 4, 9, 16, … ≤ n. **Minimum cost for tickets** is the same shape over days: \`dp[d] = min(dp[d−1] + c1, dp[d−7] + c7, dp[d−30] + c30)\` on travel days, \`dp[d] = dp[d−1]\` otherwise.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the loop order alone decides whether (1, 2) and (2, 1) are counted separately?',
            deeper: 'With the amount loop outside, dp[x] is built by asking "what is the LAST element?" and trying every number for it — so a sequence ending in 2 and one ending in 1 land in different groups even if they use the same numbers. With the numbers loop outside, when we process number n, dp only contains sequences made of numbers processed earlier, so every counted sequence is "all 1s, then all 2s, then …" — one canonical order per multiset. Same recurrence ingredients, different meaning of the state: "ordered sequences summing to x" vs "multisets of the first j numbers summing to x".',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-8',
            question: 'nums = [1, 2], target = 3. The amount-outside loop (combination sum IV) returns 3. What does it count?',
            options: [
              'Only {1, 2} and {1, 1, 1}',
              'The sequences (1,1,1), (1,2), (2,1)',
              'The number of coins in the best solution',
              'Subsets of nums that sum to 3',
            ],
            answer: 1,
            explanation: 'With the amount outside, dp[x] sums over every possible LAST element, so different orders end differently and are counted separately: 3 sequences.',
            misconceptions: {
              0: 'That is the unordered count (2), produced by the coins-outside loop order.',
              2: 'This is a counting DP, not a minimum.',
              3: 'Elements can be reused, and only {1, 2} is a subset summing to 3 — but the answer is 3.',
            },
          },
        ],
      },
      {
        id: 'optimized-strings',
        title: 'Optimized approach — strings (decode ways, word break)',
        blocks: [
          {
            type: 'text',
            md: `**Decode ways:** digits map to letters (1 → A … 26 → Z). \`dp[i]\` = number of decodings of the first i characters. The last letter used either
- **one digit** \`s[i−1]\` (valid if it is not '0') → add \`dp[i−1]\`, or
- **two digits** \`s[i−2..i−1]\` (valid if between 10 and 26) → add \`dp[i−2]\`.

\`dp[0] = 1\` (empty string has one decoding: the empty one). Decode ways II adds \`*\` = any digit 1–9: each case gets a multiplier (how many meanings the 1- or 2-character piece has) and everything is taken modulo 1e9+7.

**Word break:** \`dp[i]\` = can the first i characters be segmented? \`dp[i] = true\` if for some j, \`dp[j]\` is true and \`s.slice(j, i)\` is in the dictionary Set. Word break II needs all sentences: a memoized DFS \`sentences(start)\` returns the list of sentences for the suffix from start; memoizing by start avoids re-exploring shared suffixes.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-9',
            question: 'Decode ways for `s = "106"`. Which is correct?',
            options: [
              '2 — "1 0 6" and "10 6"',
              '1 — only "10 6" (J F); "0" alone and "06" are invalid',
              '3',
              '0 — any string containing 0 is undecodable',
            ],
            answer: 1,
            explanation: 'dp[1] = 1 ("1"). dp[2]: "0" alone is invalid, "10" is valid → dp[2] = dp[0] = 1. dp[3]: "6" valid → +dp[2] = 1; "06" is not in 10..26 → +0. Answer 1.',
            misconceptions: {
              0: '"0" does not map to any letter, so "1 0 6" is not a decoding.',
              2: 'There is no third split; count the valid pieces carefully.',
              3: '"0" is fine as the second digit of 10 or 20.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'steps',
            title: 'The 1D DP recipe',
            steps: [
              'Write the brute-force recursion by thinking about the LAST decision.',
              'Name the state in words: "dp[i] = … for the first i …".',
              'Transition: dp[i] = combine(dp[smaller states]) — one term per possible last decision.',
              'Base cases: the smallest states, true to the definition (dp[0] = 1 for counting ways, 0 for min cost, Infinity for unreachable).',
              'Order: loop so every dependency is ready (usually increasing i).',
              'Answer location: dp[n], dp[amount], or max over dp.',
              'Optimise space if dp[i] reads only a fixed window of previous cells.',
            ],
          },
          {
            type: 'code',
            title: 'Generic 1D tabulation',
            code: `function solve(n) {
  const dp = new Array(n + 1).fill(INITIAL);   // 0 for counts/max, Infinity for min
  dp[0] = BASE;
  for (let i = 1; i <= n; i++) {
    for (const choice of choicesFor(i)) {      // every possible last decision
      if (valid(i, choice)) dp[i] = combine(dp[i], dp[prev(i, choice)], choice);
    }
  }
  return dp[n];
}`,
          },
          {
            type: 'code',
            title: 'Generic memoized recursion',
            code: `function solve(input) {
  const memo = new Map();
  function f(state) {
    if (isBase(state)) return baseValue(state);
    if (memo.has(state)) return memo.get(state);
    let best = INITIAL;
    for (const choice of choicesFor(state)) best = combine(best, f(next(state, choice)));
    memo.set(state, best);
    return best;
  }
  return f(startState);
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Coin change — bottom-up',
            code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`new Array(n).fill(0)\` for numbers; **never** \`fill([])\` for 2D (all rows share one array) — use \`Array.from({ length: n }, () => [])\`.
- \`Infinity + 1\` is still \`Infinity\`, so "unreachable" propagates safely in min-DPs.
- Integers are exact only up to \`Number.MAX_SAFE_INTEGER\` (2⁵³ − 1). When a problem says "modulo 1e9+7", apply \`%\` after **every** addition; for products of two values near 1e9 use \`BigInt\` or split the multiplication, since 1e9 × 1e9 exceeds 2⁵³.
- Memo keys for several parameters: a string key like \`i + ',' + k\` or a numeric key \`i * BIG + k\` (faster, no string allocation).`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'rob([2, 7, 9, 3, 1]) with two variables',
            columns: ['house', 'money', 'prev2 + money', 'prev1 (skip)', 'cur', 'prev2, prev1 after'],
            rows: [
              ['0', '2', '0 + 2 = 2', '0', '2', '0, 2'],
              ['1', '7', '0 + 7 = 7', '2', '7', '2, 7'],
              ['2', '9', '2 + 9 = 11', '7', '11', '7, 11'],
              ['3', '3', '7 + 3 = 10', '11', '11', '11, 11'],
              ['4', '1', '11 + 1 = 12', '11', '12', '11, 12'],
            ],
            note: 'Answer 12: rob houses 0, 2 and 4 (2 + 9 + 1).',
          },
          {
            type: 'checkpoint',
            id: 'dp-1d-cp-10',
            question: 'In the dry run, at house 3 the "rob" option gives 10 and "skip" gives 11. What does choosing 11 mean?',
            options: [
              'We rob house 3 and house 2',
              'We give up on the whole array',
              'The best plan for houses 0..3 does not rob house 3; it equals the best plan for houses 0..2',
              'We must skip house 4 as well',
            ],
            answer: 2,
            explanation: 'dp values are answers to prefixes. Choosing "skip" says dp[0..3] = dp[0..2] = 11. House 4 is decided later, independently, from these stored values.',
            misconceptions: {
              0: 'Houses 2 and 3 are adjacent — robbing both is forbidden. 11 comes from skipping 3.',
              1: 'Nothing is given up; the table only records the best value per prefix.',
              3: 'The decision for house 4 compares 11 + 1 with 11 on its own — it is not forced by house 3.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Vague state** — if you cannot say "dp[i] means …" in one sentence, the transition will be wrong.
2. **Wrong base case** — dp[0] = 1 for counting (empty way), 0 for costs, Infinity for "unreachable".
3. **Truthiness memo check** — \`if (memo[i])\` recomputes states whose answer is 0 or false.
4. **Wrong loop order** — reading cells that are not computed yet; or swapping loops in counting problems (ordered vs unordered).
5. **Stack overflow** — deep memoized recursion in JS for n ≳ 10⁴; switch to tabulation.
6. **Modulo applied only at the end** — intermediate sums exceed 2⁵³ and lose precision.
7. **Using greedy where DP is needed** — test a counter-example.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(states × transitions per state)',
            space: 'O(states), often reducible to O(1)',
            md: `- Climbing stairs / house robber: n states × O(1) → **O(n)** time, **O(1)** space with two variables.
- Coin change: amount states × k coins → **O(amount · k)**, O(amount) space.
- Perfect squares: n × √n → **O(n√n)**.
- Word break: n states × n split points × O(L) slicing/hashing → **O(n² · L)** (or O(n · maxWordLen · L)).
- Word break II: output-sensitive — there can be exponentially many sentences.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the state out loud** before coding: "dp[i] is the max money from the first i houses."
- Start with the recursive brute force, point at the repeated subproblem, then add memoization — that story shows understanding.
- Offer tabulation and the O(1)-space version as follow-ups.
- Mention JS stack depth when you use recursion on large n.
- For counting problems, clarify whether order matters (combination sum IV vs coin change II).`,
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
              { api: 'new Array(n + 1).fill(v)', use: 'DP table with a base/initial value', complexity: 'O(n)' },
              { api: 'new Map() + has/get/set', use: 'Memo for sparse or composite states', complexity: 'O(1) average' },
              { api: 'Infinity', use: 'Unreachable in min-DP; Infinity + 1 stays Infinity', complexity: 'O(1)' },
              { api: 'new Set(words)', use: 'Dictionary lookup in word break', complexity: 'O(L) per lookup' },
              { api: 's.slice(j, i)', use: 'Candidate token', complexity: 'O(i − j)' },
              { api: 'x % 1_000_000_007', use: 'Modular counting', complexity: 'O(1)' },
              { api: 'BigInt', use: 'Exact products beyond 2^53 when needed', complexity: 'slower than Number' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Count ways', 'Min/max cost with several choices per step', 'Feasibility with overlapping choices', 'Greedy has a counter-example'],
    clues: ['number of ways', 'minimum coins', 'cannot pick adjacent', 'decode', 'segment into words', 'order matters'],
    template: `const dp = new Array(n + 1).fill(INIT);
dp[0] = BASE;
for (let i = 1; i <= n; i++)
  for (const c of choices) if (ok(i, c)) dp[i] = combine(dp[i], dp[i - c]);
return dp[n];`,
    complexity: 'O(states × choices) time; O(states) space, often O(1) with rolling variables',
    mistakes: ['Vague state definition', 'Wrong base case', 'if (memo[i]) truthiness bug', 'Loop order (ordered vs unordered counting)', 'Deep recursion in JS', 'Modulo only at the end'],
    jsTools: ['Array.fill', 'Map', 'Set', 'Infinity', 'slice', '% 1e9+7'],
  },

  keyConcepts: [
    'DP = recursion + remembering: identical recurrence, each state computed once.',
    'Design order: state (in words) → transition (last decision) → base cases → answer location.',
    'Memoization is top-down and lazy; tabulation is bottom-up in dependency order and avoids stack overflow.',
    'Time = number of states × work per state.',
    'If dp[i] reads a fixed window of previous cells, keep only that window (two variables for house robber).',
    'Circular constraints: solve two linear cases (drop first / drop last).',
    'Amount-outside loop counts ordered sequences; item-outside loop counts unordered combinations.',
  ],

  interviewTips: [
    'State dp[i] in one sentence before writing code.',
    'Go brute-force recursion → memo → table → O(1) space.',
    'Mention JS recursion depth limits and the modulo/precision issue.',
  ],
};
