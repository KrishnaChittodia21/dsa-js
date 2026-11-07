export default {
  id: 'greedy',
  summary: 'Build the answer one step at a time, always taking the choice that looks best right now — and only when you can prove that choice never ruins the final answer.',

  jsTools: [
    { api: 'arr.sort((a, b) => a - b)', use: 'Most greedy algorithms start by sorting — ALWAYS pass a comparator for numbers', complexity: 'O(n log n)' },
    { api: 'arr.sort((a, b) => a[1] - b[1])', use: 'Sort intervals / pairs by one field (end time, cost difference…)', complexity: 'O(n log n)' },
    { api: 'MinHeap / MaxHeap (toolkit)', use: '"Best item so far" when choices arrive over time (refuelling, course scheduling)', complexity: 'push/pop O(log n), peek O(1)' },
    { api: 'Map', use: 'Counts of values (hand of straights) or last index of each character (partition labels)', complexity: 'O(1) average' },
    { api: 'Math.max / Math.min', use: 'Farthest reach, running bounds', complexity: 'O(1)' },
    { api: 'arr.splice(i, 0, x)', use: 'Insert at a position (queue reconstruction) — O(n) per call', complexity: 'O(n)' },
  ],

  patterns: [
    {
      id: 'greedy-sort-and-pick',
      name: 'Greedy — Sort, then Pick',
      summary: 'Sort by the key that makes the "obvious" choice correct, then sweep once and take (or pair up) items.',
      whyItExists: 'Many allocation problems are hard only because the items arrive in a random order. Sorting by the right key turns "try every assignment" (exponential) into a single sweep where each decision can be justified by an exchange argument.',
      whenToUse: [
        'Matching two groups (children ↔ cookies, people ↔ boats) to maximise the number of matches',
        'Taking items with a budget/capacity where each unit has a value (maximum units on a truck)',
        'Splitting people into two groups where each person has two costs (sort by the difference)',
        'Reconstructing an order from constraints ("k people in front are taller")',
      ],
      clues: ['"maximum number of … satisfied"', '"minimum cost to send n people to each city"', '"each box type has units"', '"at most two people per boat"', '"you may rearrange"', 'order of the input does not matter'],
      whenNotToUse: [
        'Items have both a weight and a value and you cannot take fractions (0/1 knapsack) → DP',
        'The order of the input is part of the problem (subarrays, subsequences) → sorting destroys it',
        'A small counter-example beats the greedy choice — always try one before committing',
      ],
      template: `function sortAndPick(items, capacity) {
  items.sort((a, b) => b.value - a.value); // 1. the key that makes "take the best first" safe
  let total = 0;
  for (const item of items) {              // 2. one sweep
    if (capacity === 0) break;
    const take = Math.min(item.count, capacity);
    total += take * item.value;
    capacity -= take;
  }
  return total;
}`,
      variations: [
        { name: 'Two sorted lists + two pointers', description: 'Assign cookies, boats to save people: sort both sides, match the smallest that works.' },
        { name: 'Sort by difference', description: 'Two-city scheduling: sort by costA − costB, first half goes to A.' },
        { name: 'Sort + insert', description: 'Queue reconstruction: tallest first, insert each person at index k.' },
        { name: 'Sort + count map', description: 'Hand of straights: the smallest remaining card must start a group.' },
      ],
      mistakes: [
        'Calling `.sort()` without a comparator — JavaScript sorts numbers as strings ([10, 9, 1] → [1, 10, 9])',
        'Sorting by the wrong key (by cost A alone in two-city scheduling instead of by the difference)',
        'Not proving the choice — "it worked on the example" is not a proof',
      ],
      evolution: {
        easy: 'Sort one or two arrays and match greedily (assign cookies, maximum units).',
        medium: 'The sort key is not obvious (difference of costs, height desc + k asc) or matching needs a count map.',
        hard: 'Sorting is combined with a heap or another data structure to revisit earlier choices.',
      },
    },
    {
      id: 'greedy-interval-scheduling',
      name: 'Greedy — Intervals by Earliest End',
      summary: 'When choosing or cutting intervals, process them in order of their end and always commit to the one that finishes first.',
      whyItExists: 'The interval that ends earliest leaves the most room for everything after it. An exchange argument shows any optimal schedule can be rewritten to start with it — so taking it is always safe.',
      whenToUse: [
        'Maximum number of non-overlapping intervals / minimum removals',
        'Minimum arrows / points to hit all intervals',
        'Cut a sequence into the most pieces so that each value lives in only one piece (partition labels)',
      ],
      clues: ['"non-overlapping"', '"minimum number of arrows"', '"as many parts as possible"', '"each letter appears in at most one part"', 'start/end pairs'],
      whenNotToUse: [
        'Intervals have weights/values and you maximise total value → weighted interval scheduling needs DP + binary search',
        'You need to merge intervals, not select them → that is the Intervals topic (sort by start)',
      ],
      template: `function maxNonOverlapping(intervals) {
  intervals.sort((a, b) => a[1] - b[1]); // earliest END first
  let count = 0, lastEnd = -Infinity;
  for (const [start, end] of intervals) {
    if (start >= lastEnd) {              // compatible with everything chosen so far
      count++;
      lastEnd = end;
    }
  }
  return count;
}`,
      variations: [
        { name: 'Partition labels', description: 'Each character defines an interval [first, last]; cut whenever the running max end equals the current index.' },
        { name: 'Minimum arrows', description: 'Same sweep, but touching intervals share an arrow (use > instead of >=).' },
      ],
      mistakes: ['Sorting by start instead of end for selection problems', 'Mixing up >= and > when intervals only touch at an endpoint'],
      evolution: {
        easy: 'Maximum meetings in one room.',
        medium: 'Partition labels, minimum arrows, erase overlapping intervals.',
        hard: 'Weighted versions (DP) or multiple rooms (heap of end times).',
      },
    },
    {
      id: 'greedy-heap-regret',
      name: 'Greedy — Heap with Regret',
      summary: 'Move forward greedily, but keep every past option in a heap so that when you get stuck (or find something better) you can take back the worst decision or cash in the best skipped one.',
      whyItExists: 'Sometimes the right choice is only known later. Instead of deciding immediately, you "remember" candidates in a heap and make the decision lazily at the moment it matters. Each item is pushed and popped at most once, so it stays O(n log n).',
      whenToUse: [
        'Minimum number of stops/refuels/actions to reach a goal while passing opportunities along the way',
        'Maximum number of tasks/courses that fit deadlines, where a long task can be swapped for a shorter one',
        '"Choose at most k items as you go" with the freedom to change your mind',
      ],
      clues: ['"minimum number of refueling stops"', '"deadline" + "duration"', '"maximum number of courses"', '"you can swap"', '"as you pass stations"'],
      whenNotToUse: ['All information is known up front and one sort suffices', 'Choices interact in ways a single swap cannot fix → DP'],
      template: `function minStops(target, fuel, stations) {
  const passed = new MaxHeap();       // fuel of stations we drove past but did not use
  let stops = 0, i = 0;
  while (fuel < target) {
    while (i < stations.length && stations[i][0] <= fuel) passed.push(stations[i++][1]);
    if (passed.isEmpty()) return -1;  // stuck and nothing to regret
    fuel += passed.pop();             // "retroactively" stop at the best one
    stops++;
  }
  return stops;
}`,
      variations: [
        { name: 'Retroactive choice', description: 'Refuelling stops: pretend you stopped at the biggest station you passed.' },
        { name: 'Swap out the worst', description: 'Course schedule III: if a new course overflows the deadline, drop the longest course taken so far.' },
      ],
      mistakes: ['Using a min-heap when you need the largest (or vice versa)', 'Forgetting to sort by deadline before sweeping', 'Popping from an empty heap'],
      evolution: {
        easy: 'Keep the k largest seen so far.',
        medium: 'Furthest building you can reach with bricks and ladders.',
        hard: 'Refuelling stops, course schedule III, IPO.',
      },
    },
    {
      id: 'greedy-reach-frontier',
      name: 'Greedy — Reach / Frontier Invariant',
      summary: 'Sweep left to right keeping one number that summarises everything so far — the farthest index you can reach, the current fuel balance, or the largest sum you can build — and update it greedily.',
      whyItExists: 'Instead of exploring every path, you keep an invariant such as "every index ≤ reach is reachable" or "every value in [1, miss) can be built". The invariant only grows, so a single pass decides the answer.',
      whenToUse: [
        'Can I reach the end? What is the minimum number of jumps?',
        'Circular route with gains and costs (gas station)',
        'Smallest number of additions so that every value up to n is representable (patching array)',
      ],
      clues: ['"maximum jump length"', '"can you reach the last index"', '"minimum number of jumps"', '"circular route"', '"complete the circuit"', '"every number in [1, n] can be formed"'],
      whenNotToUse: ['Moves have costs that differ per edge → shortest path', 'You need to count the number of ways → DP'],
      template: `function canReachEnd(nums) {
  let reach = 0;                         // invariant: every index <= reach is reachable
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;         // a gap: i can never be reached
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
      variations: [
        { name: 'BFS levels on an array', description: 'Jump game II: the current level ends at curEnd; the next level ends at the farthest reach seen.' },
        { name: 'Running balance with reset', description: 'Gas station: if the tank goes negative at i, no start in [start, i] works — restart at i + 1.' },
        { name: 'Coverage invariant', description: 'Patching array: all sums in [1, miss) are buildable; add miss itself when the next number is too big.' },
      ],
      mistakes: ['Checking `i > reach` after updating reach', 'In jump game II, counting a jump at the last index', 'Overflow thinking in patching array — JS numbers are safe up to 2^53'],
      evolution: {
        easy: 'Jump game (reachability).',
        medium: 'Jump game II (minimum jumps), gas station.',
        hard: 'Patching array, minimum taps to water a garden, video stitching.',
      },
    },
    {
      id: 'greedy-local-constraints',
      name: 'Greedy — Local Rules & Two Passes',
      summary: 'Process the input in order, fixing each position with the cheapest choice that satisfies its local rule — sometimes in two directions, sometimes tracking a range of possible states.',
      whyItExists: 'When every constraint only involves neighbours, you can satisfy them one at a time. If constraints point both ways (left neighbour and right neighbour), one pass per direction plus a max() combines them. If a symbol is ambiguous, track the range of states it could lead to instead of branching.',
      whenToUse: [
        'Neighbour constraints ("higher rating gets more candy than neighbours")',
        'Simulations where one choice is clearly better (give change with the largest bill first)',
        'Validity with wildcards (a * can be "(", ")" or empty) → track [minOpen, maxOpen]',
      ],
      clues: ['"neighbours"', '"adjacent"', '"minimum candies"', '"no two adjacent"', '"* can be treated as"', '"give correct change"'],
      whenNotToUse: ['Constraints reach far away and interact globally → DP or graph modelling'],
      template: `function twoPass(ratings) {
  const n = ratings.length;
  const give = new Array(n).fill(1);
  for (let i = 1; i < n; i++)            // left neighbour rule
    if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;
  for (let i = n - 2; i >= 0; i--)       // right neighbour rule
    if (ratings[i] > ratings[i + 1]) give[i] = Math.max(give[i], give[i + 1] + 1);
  return give.reduce((a, b) => a + b, 0);
}`,
      variations: [
        { name: 'Two passes + max', description: 'Candy, trapping-style problems: each pass satisfies one side.' },
        { name: 'Range of states', description: 'Valid parenthesis string: keep the lowest and highest possible open count.' },
        { name: 'Greedy simulation', description: 'Lemonade change, can place flowers.' },
      ],
      mistakes: ['Doing only one pass and missing the other side\'s constraint', 'Letting minOpen go negative in the wildcard problem'],
      evolution: {
        easy: 'Can place flowers, lemonade change.',
        medium: 'Valid parenthesis string.',
        hard: 'Candy (two passes; also solvable in O(1) space by counting slopes).',
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
            md: `A **greedy algorithm** builds its answer step by step, and at every step it takes the option that looks best *right now* — without looking ahead and without ever undoing the choice.

Example: you must pay 60 cents using the fewest coins from {25, 10, 5, 1}. The greedy cashier grabs the biggest coin that still fits: 25, 25, 10 → 3 coins. That happens to be optimal.

The whole difficulty of greedy is the phrase **"happens to be"**. Sometimes the locally best choice is also globally best; sometimes it walks you straight into a bad answer. A greedy solution is only correct when you can **prove** the choice is safe.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Greedy choice** — the rule used to pick the next piece of the answer ("biggest coin", "meeting that ends first").
- **Greedy-choice property** — some optimal solution contains the greedy choice, so taking it never hurts.
- **Optimal substructure** — after the choice, what remains is a smaller copy of the same problem.
- **Exchange argument** — a proof that swaps part of any optimal solution for the greedy choice without making it worse.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Packing a car boot: you put the biggest suitcases in first, then fill gaps with small bags. You never take a suitcase back out. That works well for boots — but it would fail at a puzzle like Tetris, where an early "good-looking" move can block you later. Greedy is the boot-packing mindset; the job is recognising when the problem is a boot and not Tetris.',
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-1',
            question: 'Which statement best describes a greedy algorithm?',
            options: [
              'It tries every possible combination and keeps the best one',
              'It remembers answers to overlapping subproblems so it never recomputes them',
              'It makes the locally best choice at each step and never revisits it',
              'It always sorts the input first',
            ],
            answer: 2,
            explanation: 'Greedy commits to one choice per step and moves on. That is why it is fast — and why it needs a proof.',
            misconceptions: {
              0: 'That is brute force / backtracking. Greedy explores exactly one path.',
              1: 'That is dynamic programming. DP considers all choices (efficiently); greedy considers only one.',
              3: 'Many greedy algorithms start with a sort, but sorting is a tool, not the definition. Jump game and gas station are greedy with no sort at all.',
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
            md: `Many optimisation problems have an exponential number of candidate answers. Brute force tries them all (2ⁿ subsets, n! orderings). A correct greedy rule collapses that search to **one path**, usually costing O(n) or O(n log n) (the log from sorting or a heap).

| Problem | Brute force | Greedy |
|---|---|---|
| Max non-overlapping meetings | 2ⁿ subsets | sort by end, one sweep: O(n log n) |
| Can you reach the last index? | try every jump sequence | one pass tracking farthest reach: O(n) |
| Min refuelling stops | 2ⁿ subsets of stations | heap of passed stations: O(n log n) |

But greedy has a famous danger, which we must look at before anything else.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Greedy can be confidently wrong',
            md: `Coins \`[1, 3, 4]\`, amount \`6\`. Greedy takes the biggest coin that fits: **4**, then **1**, then **1** → 3 coins.
But **3 + 3** uses only **2** coins. The early "best-looking" choice (4) made the remainder (2) expensive.

This problem needs **dynamic programming** (next topic), which considers every last coin instead of only the biggest.`,
          },
          {
            type: 'visual',
            scenario: 'dp-coin-change',
            input: { coins: [1, 3, 4], amount: 6 },
            caption: 'Preview of DP on the greedy counter-example: dp[6] = 2 (3 + 3), not the greedy 3 (4 + 1 + 1).',
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-2',
            question: 'With coins `[1, 3, 4]` and amount `6`, why does "take the largest coin first" fail?',
            options: [
              'It does not fail; 4 + 1 + 1 is optimal',
              'Because taking 4 leaves 2, which can only be paid with two 1s — while skipping 4 allows 3 + 3',
              'Because greedy should take the smallest coin first',
              'Because the coins are not sorted',
            ],
            answer: 1,
            explanation: 'The choice "4" is locally best but changes what remains. The remainder 2 costs two coins, while the remainder after choosing 3 (which is 3) costs one. Greedy never compares these futures; DP does.',
            misconceptions: {
              0: 'Count again: 3 + 3 = 6 with 2 coins beats 4 + 1 + 1 with 3 coins.',
              2: 'Smallest first gives six 1-coins — far worse. Changing the greedy rule does not fix a problem that lacks the greedy-choice property.',
              3: 'Sorting does not change which coin greedy picks; the issue is the choice rule itself.',
            },
            deeper: 'For "canonical" coin systems like {1, 5, 10, 25} greedy happens to be optimal, which is why cashiers get away with it. For arbitrary coins it is not. **The lesson:** before trusting a greedy rule, hunt for a small counter-example for two minutes. If you cannot find one, try to prove it.',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use greedy when you can make one of these arguments:

1. **Exchange argument.** Take any optimal solution. If it does not contain the greedy choice, swap something in it for the greedy choice and show the result is *no worse*. Therefore some optimal solution contains the greedy choice.
2. **Greedy stays ahead.** Show by induction that after every step, the greedy partial solution is at least as good as any other solution's partial solution (e.g. "after k meetings, greedy's k-th meeting ends no later than anyone else's k-th meeting").
3. **Invariant.** Maintain a fact that summarises all past choices ("every index ≤ reach is reachable") and show each step preserves it.

If none of these work and small counter-examples exist → use **DP** or **backtracking**.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Exchange argument in action — assign cookies',
            md: `Children have greed factors, cookies have sizes; a child is happy if cookie ≥ greed. Greedy: sort both; give the **least greedy child the smallest cookie that satisfies them**.

Why safe? Suppose an optimal assignment gives that child a bigger cookie B and gives our small cookie S to someone else (or nobody). Swap S and B: our child is still happy (S ≥ greed), the other child now has B ≥ S, so they are still happy too. Number of happy children unchanged → the greedy choice is part of some optimal solution.`,
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-3',
            question: 'In an exchange argument, what exactly do you need to show?',
            options: [
              'That greedy is faster than every other algorithm',
              'That greedy gives the right answer on all the examples',
              'That the greedy choice is the unique optimal choice',
              'That any optimal solution can be transformed to include the greedy choice without getting worse',
            ],
            answer: 3,
            explanation: 'You do not need greedy to be the *only* optimum — just that swapping it in never hurts. Then, by induction on the remaining subproblem, the whole greedy solution is optimal.',
            misconceptions: {
              0: 'Speed has nothing to do with correctness. The argument is about the quality of the answer.',
              1: 'Examples can only show a greedy is wrong (a counter-example), never that it is right.',
              2: 'There are often several optimal solutions. "At least one optimum contains the choice" is enough.',
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
            clues: ['maximum / minimum number of … (a count, not a sum of arbitrary values)', 'you may reorder or pick in any order', 'intervals with start and end', '"can you reach"', 'circular route with gains and costs', 'deadlines and durations', 'neighbour constraints'],
            conclusion: 'Think Greedy — then look for a counter-example before committing',
          },
          {
            type: 'text',
            md: `Signs that greedy is **not** enough (think DP instead):
- "count the number of ways" — greedy finds one answer, never counts all of them.
- 0/1 choices with **weights and values** (knapsack).
- A small counter-example exists (like coins [1, 3, 4]).
- The best choice now depends on details far in the future that no single number can summarise.`,
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-4',
            question: 'Which problem is the most likely to have a correct greedy solution?',
            options: [
              'Count the number of ways to climb n stairs taking 1 or 2 steps',
              'Pick items with weights and values to maximise value under a weight limit (items cannot be split)',
              'Minimum number of arrows so every balloon interval is hit by at least one arrow',
              'Minimum coins for an amount with an arbitrary coin set',
            ],
            answer: 2,
            explanation: 'Sort balloons by end; shoot at the first end; every balloon starting before that point is burst. An exchange argument proves it: moving any first arrow right to the earliest end never loses a balloon.',
            misconceptions: {
              0: '"Number of ways" is counting, not optimising one choice — that is DP.',
              1: '0/1 knapsack has no greedy-choice property: the best value/weight item may waste capacity. (Fractional knapsack IS greedy.)',
              3: 'Arbitrary coin systems break greedy — remember [1, 3, 4] and 6.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Every greedy solution has the same three parts:

1. **An order** — the sequence in which you consider the pieces (sorted by end, by value, left to right, by deadline…). Choosing the order *is* most of the design.
2. **A choice rule** — take / skip / pair / cut.
3. **A proof** — exchange, stays-ahead or invariant.

"Stays ahead" example — **max non-overlapping meetings**, sorted by end time. Let greedy pick meetings g₁, g₂, … and any other valid schedule pick o₁, o₂, …. Claim: end(gₖ) ≤ end(oₖ) for every k. True for k = 1 (greedy picks the earliest end overall). If true for k, then oₖ₊₁ starts after end(oₖ) ≥ end(gₖ), so oₖ₊₁ was available to greedy, and greedy picks the earliest-ending available meeting: end(gₖ₊₁) ≤ end(oₖ₊₁). So greedy can never run out of meetings before the other schedule does.`,
          },
          {
            type: 'visual',
            scenario: 'interval-merge',
            input: { intervals: [[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]] },
            caption: 'Interval problems are processed in sorted order and decided with one comparison against the last committed interval.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** sorting meetings by *start* time fails for "maximum number of non-overlapping meetings"?',
            deeper: 'Counter-example: `[1, 100], [2, 3], [4, 5]`. Sorted by start, greedy takes `[1, 100]` first and blocks everything else → 1 meeting. Sorted by end, greedy takes `[2, 3]`, then `[4, 5]` → 2 meetings (and could still fit more). An early start says nothing about how much room a meeting wastes; an early **end** is exactly "leaves the most room for the future". The key you sort by must be the quantity your proof talks about.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Take **Jump Game**: `nums[i]` is the maximum jump length from index i; can you reach the last index? The brute force tries every jump from every index recursively.',
          },
          {
            type: 'code',
            title: 'Brute force — exponential',
            code: `function canJump(nums, i = 0) {
  if (i >= nums.length - 1) return true;
  for (let step = 1; step <= nums[i]; step++) {
    if (canJump(nums, i + step)) return true;   // try every choice
  }
  return false;
}`,
            caption: 'The same index is re-explored from many different paths. Memoising it gives O(n²); greedy gives O(n).',
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-5',
            question: 'In Jump Game, if index 5 is reachable, what can you say about indices 0..4?',
            options: [
              'Nothing — each index must be checked separately',
              'They are all reachable too, because to get to 5 you must jump from some earlier index, and jumps can be shorter than the maximum',
              'Only the even indices are reachable',
              'They are reachable only if nums[5] > 0',
            ],
            answer: 1,
            explanation: 'Reachable indices form a **prefix** [0, reach]: any jump that lands at or beyond j could have been shortened to land exactly on j. So one number, `reach`, summarises the whole state.',
            misconceptions: {
              0: 'That is what makes brute force slow. The prefix property is what lets one integer replace the whole search.',
              2: 'There is no parity rule — jumps can be any length up to nums[i].',
              3: 'nums[5] affects where you can go *from* 5, not whether earlier indices are reachable.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — reach / frontier',
        blocks: [
          {
            type: 'steps',
            title: 'Jump Game in one pass',
            steps: [
              'Keep `reach = 0`: every index ≤ reach is reachable.',
              'For i from 0: if `i > reach`, you are stuck in a gap → return false.',
              'Otherwise update `reach = max(reach, i + nums[i])`.',
              'If the loop finishes, the last index was ≤ reach → return true.',
            ],
          },
          { type: 'visual', scenario: 'jump-game', caption: 'reach only grows; the first i beyond it is a gap. Switch the question to "fewest jumps" to see Jump Game II as BFS levels (curEnd / farthest).' },
          {
            type: 'text',
            md: `**Jump Game II (minimum jumps)** is BFS in disguise. Indices reachable with exactly 1 jump form a contiguous block, with 2 jumps the next block, etc. Scan the current block, track the farthest reach from it (\`farthest\`); when you pass the end of the block (\`curEnd\`), you *must* jump: \`jumps++\`, \`curEnd = farthest\`.

**Gas station.** Start at 0 with an empty tank; track \`tank += gas[i] − cost[i]\`. If the tank goes negative at i, then **no start between the current start and i works either**: every such start s arrives at s with tank ≥ 0 when starting from the earlier start, so starting fresh at s (tank = 0) is no better — and that still failed at i. So jump the start to i + 1. If total gas ≥ total cost, the final start works.

**Patching array.** Invariant: every sum in \`[1, miss)\` can be built from the numbers used so far. If the next number x ≤ miss, adding it extends coverage to \`[1, miss + x)\`. Otherwise nothing available fills the hole at \`miss\` — the best patch is \`miss\` itself, which doubles coverage to \`[1, 2·miss)\`.`,
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-6',
            question: 'Gas station: starting at station 0 the tank first becomes negative after station 3. Why can we skip trying stations 1, 2 and 3 as starts?',
            options: [
              'Because stations 1–3 have less gas than station 0',
              'Because we must always start at an even index',
              'Because starting from 0 we reached each of 1–3 with a tank ≥ 0; starting there with 0 fuel is no better, and it still fails at 3',
              'Because the answer is always the station with the most gas',
            ],
            answer: 2,
            explanation: 'Arriving at station s from 0 gives a non-negative surplus. Starting at s throws that surplus away, so the tank from s onwards is ≤ what we had — and we already ran dry at 3. Every start in [0, 3] fails, so the next candidate is 4.',
            misconceptions: {
              0: 'Individual gas amounts do not matter; what matters is the cumulative surplus argument.',
              1: 'There is no parity rule; this is a made-up constraint.',
              3: 'The station with the most gas may be followed by a huge cost. Try gas=[5,1,1], cost=[1,6,0]: starting at index 0 (most gas) fails (5−1=4, 4+1−6 <0), yet the unique answer is index 2.',
            },
            deeper: 'This also explains why one pass suffices: each failure advances the start past everything it tested, so every station is scanned once. The separate check `totalGas >= totalCost` tells us a valid start exists at all.',
          },
        ],
      },
      {
        id: 'optimized-sort',
        title: 'Optimized approach — sort, then pick',
        blocks: [
          {
            type: 'text',
            md: `The art is choosing **what to sort by**.

- **Assign cookies / boats:** sort both sides; pair the smallest options that work (two pointers).
- **Maximum units on a truck:** sort box types by units per box, descending — each slot on the truck is identical, so fill it with the most valuable box (a fractional-knapsack-like situation where items have equal size).
- **Two-city scheduling:** each person costs \`a\` to fly to A and \`b\` to B; exactly n go to each. Sorting by \`a\` alone fails. Instead think "everyone goes to B, then we move n people to A": moving a person changes the total by \`a − b\`. So sort by \`a − b\` and send the first n to A.
- **Queue reconstruction:** people \`[h, k]\` where k = number of people in front with height ≥ h. Sort by height descending (ties by k ascending) and insert each person at index k. Taller people are already placed and shorter people inserted later do not change a taller person's k.
- **Hand of straights:** the smallest remaining card cannot be in the middle of a group — it must *start* one. So repeatedly take the smallest card and consume the next \`groupSize − 1\` consecutive values from a count map.`,
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-7',
            question: 'Two-city scheduling: costs `[[10, 20], [30, 200], [400, 50], [30, 20]]`, two people to each city. What should you sort by?',
            options: [
              'The difference costA − costB, ascending (most "A-favoured" people first)',
              'costA ascending',
              'The smaller of the two costs',
              'costA + costB',
            ],
            answer: 0,
            explanation: 'Differences: −10, −170, 350, 10. Sorted: −170, −10, 10, 350 → persons 1 and 0 go to A (30 + 10), persons 3 and 2 go to B (20 + 50) → total 110. The difference measures how much you *save* by choosing A over B, which is exactly the trade-off.',
            misconceptions: {
              1: 'Cheap A-cost says nothing about whether B is even cheaper for that person. Person [30, 20] has a cheap A but is better in B.',
              2: 'Everyone would just pick their cheaper city, ignoring the "exactly n each" constraint.',
              3: 'The sum is the same whichever city they go to — it does not help decide.',
            },
          },
        ],
      },
      {
        id: 'optimized-interval',
        title: 'Optimized approach — interval greedy (partition labels)',
        blocks: [
          {
            type: 'text',
            md: `**Partition labels:** split a string into as many parts as possible so each letter appears in only one part.

Each letter c occupies the interval \`[first(c), last(c)]\`. A part must contain the whole interval of every letter inside it. Sweep i left to right keeping \`end = max(last(s[i]))\` of the current part. When \`i === end\`, nothing in the part extends further → **cut here**. Cutting as early as possible can only leave more room for more parts (stays ahead).`,
          },
          {
            type: 'code',
            title: 'Partition labels — O(n)',
            code: `function partitionLabels(s) {
  const last = new Map();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const sizes = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i]));
    if (i === end) {             // every letter seen so far ends by here
      sizes.push(end - start + 1);
      start = i + 1;
    }
  }
  return sizes;
}`,
          },
        ],
      },
      {
        id: 'optimized-heap',
        title: 'Optimized approach — heap with regret',
        blocks: [
          {
            type: 'text',
            md: `**Minimum refuelling stops.** Drive as far as your fuel allows. Every station you pass goes into a **max-heap** (you *could* have stopped there). When you cannot reach the next station/target, pop the biggest fuel from the heap — "retroactively" decide you stopped there. Each stop is the one that adds the most range, so no other choice of k stops reaches further than greedy's k stops (stays ahead).

**Course schedule III.** Courses \`[duration, lastDay]\`. Sort by lastDay (earliest deadline first). Take each course; push its duration to a max-heap and add to \`time\`. If \`time > lastDay\`, drop the **longest** course taken so far (heap top). The count stays what it was before this course, but the total time is now as small as possible for that count — which can only help later courses (exchange argument: any schedule of k courses can swap its longest course for a shorter one without breaking deadlines).`,
          },
          {
            type: 'visual',
            scenario: 'heap-operations',
            input: { nums: [10, 20, 30, 60] },
            caption: 'A heap gives the best "passed" option in O(log n) — the engine of regret-based greedy.',
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-8',
            question: 'Course schedule III: you took courses with durations 100, 200, 1000 (time = 1300) and the next course has duration 400 and deadline 1500. What does the algorithm do?',
            options: [
              'Skip the new course because it does not fit',
              'Drop the shortest course (100) to make room',
              'Take it anyway; deadlines are ignored after sorting',
              'Add it (time = 1700 > 1500), then drop the longest course (1000) → time = 700',
            ],
            answer: 3,
            explanation: 'Swapping the 1000-day course for the 400-day one keeps the same count and frees 600 days for future courses. Because courses were sorted by deadline, every course kept still meets its own deadline.',
            misconceptions: {
              0: 'Skipping keeps the count but leaves time at 1300; swapping keeps the same count with time 700. Less time used is never worse.',
              1: 'Dropping the shortest course frees the least time — the opposite of what we want.',
              2: 'Sorting by deadline does not remove the constraint; it just lets us check it against the running time.',
            },
          },
        ],
      },
      {
        id: 'optimized-local',
        title: 'Optimized approach — two passes & ranges',
        blocks: [
          {
            type: 'text',
            md: `**Candy.** Each child has a rating; each gets ≥ 1 candy; a child with a higher rating than a neighbour gets more than that neighbour. Minimise candies.

One pass left→right handles "more than the left neighbour". A second pass right→left handles "more than the right neighbour", using \`max\` so it does not break the first rule. Each value ends up as the smallest number satisfying both sides, so the total is minimal.

**Valid parenthesis string.** \`*\` can be \`(\`, \`)\` or empty. Instead of branching (3ⁿ), track the **range** of possible open counts \`[lo, hi]\`:
- \`(\` → lo++, hi++
- \`)\` → lo--, hi--
- \`*\` → lo-- (treat as ")"), hi++ (treat as "(")
- if \`hi < 0\`, too many ")" even in the best case → false. Clamp \`lo = max(lo, 0)\` (we never *choose* a negative count).
- valid iff \`lo === 0\` at the end.`,
          },
          {
            type: 'checkpoint',
            id: 'greedy-cp-9',
            question: 'Candy with ratings `[1, 3, 2, 1]`. After the left→right pass the candies are `[1, 2, 1, 1]`. What are they after the right→left pass?',
            options: [
              '[1, 2, 1, 1]',
              '[1, 3, 2, 1]',
              '[4, 3, 2, 1]',
              '[1, 2, 2, 1]',
            ],
            answer: 1,
            explanation: 'Right→left: index 2 (rating 2 > 1) → max(1, 1+1) = 2; index 1 (3 > 2) → max(2, 2+1) = 3; index 0 (1 < 3) stays 1. Result [1, 3, 2, 1], total 7.',
            misconceptions: {
              0: 'That is only the left-pass result. It ignores right neighbours: child 2 (rating 2) and child 3 (rating 1) both have 1 candy, which violates the rule.',
              2: 'Child 0 has rating 1 < 3, so it has no reason to get more than 1.',
              3: 'Child 1 (rating 3) must beat child 2 (now 2 candies), so it needs 3.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the valid-parenthesis-string solution may clamp `lo` at 0 but must return false when `hi` drops below 0?',
            deeper: '`hi` is the most open brackets we could possibly have. If even that is negative, every interpretation has closed more than it opened — impossible to fix later. `lo` is the fewest; a negative `lo` just means "some interpretation over-closed", and we can simply discard those interpretations (pick a different meaning for an earlier `*`). Every value between lo and hi is achievable, so at the end we need 0 ∈ [lo, hi], i.e. lo === 0.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Generic greedy skeleton',
            code: `function greedy(items) {
  items.sort(byTheKeyYourProofNeeds);   // 1. choose the order (skip if left-to-right)
  let state = initialState();           // 2. one number / small structure summarising choices
  for (const item of items) {
    if (canTake(state, item)) {         // 3. local rule
      state = take(state, item);
    } // else skip — or, heap version: take anyway and evict the worst
  }
  return answerFrom(state);
}`,
          },
          {
            type: 'code',
            title: 'Jump Game II — BFS levels on an array',
            code: `function jump(nums) {
  let jumps = 0, curEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {  // never jump FROM the last index
    farthest = Math.max(farthest, i + nums[i]);
    if (i === curEnd) {        // finished scanning this level
      jumps++;
      curEnd = farthest;
    }
  }
  return jumps;
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
            title: 'Minimum refuelling stops with the toolkit MaxHeap',
            code: `function minRefuelStops(target, startFuel, stations) {
  const heap = new MaxHeap();      // fuel amounts of passed stations
  let fuel = startFuel, stops = 0, i = 0;
  while (fuel < target) {
    while (i < stations.length && stations[i][0] <= fuel) {
      heap.push(stations[i][1]);
      i++;
    }
    if (heap.isEmpty()) return -1;
    fuel += heap.pop();
    stops++;
  }
  return stops;
}`,
            caption: '`fuel` doubles as "farthest position reachable" since we start at 0 and 1 litre = 1 mile.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`[10, 9, 1].sort()\` gives \`[1, 10, 9]\` — the default sort compares **strings**. Always write \`(a, b) => a - b\`.
- Sorting by two keys: \`(a, b) => b[0] - a[0] || a[1] - b[1]\` (the \`||\` falls through when the first difference is 0).
- \`Array.prototype.sort\` is stable in modern engines (ES2019+), so equal keys keep their input order.
- The toolkit's \`MaxHeap\`/\`MinHeap\` accept a key function: \`new MaxHeap((c) => c[0])\`.
- \`splice\` is O(n); queue reconstruction with n ≤ 2000 is fine at O(n²).`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'jump([2, 3, 1, 1, 4])',
            columns: ['i', 'nums[i]', 'farthest', 'curEnd (before)', 'action', 'jumps'],
            rows: [
              ['0', '2', '2', '0', 'i === curEnd → jump, curEnd = 2', '1'],
              ['1', '3', '4', '2', '—', '1'],
              ['2', '1', '4', '2', 'i === curEnd → jump, curEnd = 4', '2'],
              ['3', '1', '4', '4', '—', '2'],
            ],
            note: 'The loop stops before the last index. Level 0 = {0}, level 1 = {1, 2}, level 2 = {3, 4}. Answer 2.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the Jump Game II loop runs only to `nums.length - 2`?',
            deeper: 'A jump is counted when we *leave* a level. If we also processed the last index and it happened to equal `curEnd`, we would count one extra jump out of the destination. Stopping before the last index means we only count jumps that are needed to reach it.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Trusting greedy without a proof** — always test a small counter-example (coins [1, 3, 4], meetings [1, 100], [2, 3], [4, 5]).
2. **Wrong sort key** — by start instead of end, by cost instead of cost difference.
3. **Default \`.sort()\` on numbers** — lexicographic in JavaScript.
4. **Wrong heap direction** — min-heap when you need the biggest candidate.
5. **Off-by-one in level greedy** — counting a jump at the last index.
6. **One pass when two are needed** — candy needs both neighbours.
7. **Using greedy for counting ways** — greedy finds one path; counting needs DP.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n log n) or O(n)',
            space: 'O(1) – O(n)',
            md: `**Time:** dominated by the sort (O(n log n)) or by heap operations (each item pushed and popped once → O(n log n)). Reach/frontier and two-pass greedies are O(n).

**Space:** O(1) for frontier sweeps; O(n) for heaps, count maps, or the candy array. Remember JS \`sort\` itself may use O(n) extra memory (TimSort).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the greedy rule in one sentence** ("always keep the meeting that ends first").
- **Justify it** — even a two-line exchange argument impresses more than a correct but unexplained solution.
- **Offer a counter-example to the naive rule** (sort by start, largest coin first) — it shows you know the danger.
- If stuck, start with DP/brute force and ask "do I ever need more than the best choice?" — that is often how the greedy appears.
- Mention the sort cost: O(n log n) is usually the bottleneck.`,
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
              { api: 'arr.sort((a, b) => a - b)', use: 'Numeric sort (default sort is lexicographic!)', complexity: 'O(n log n)' },
              { api: '(a, b) => b[0] - a[0] || a[1] - b[1]', use: 'Two-key comparator', complexity: 'O(1) per comparison' },
              { api: 'new MaxHeap() / new MinHeap(key)', use: 'Best passed option / evict the worst (toolkit)', complexity: 'O(log n) push/pop' },
              { api: 'new Map()', use: 'Counts, last index of each character', complexity: 'O(1) average' },
              { api: 'arr.splice(k, 0, x)', use: 'Insert at index (queue reconstruction)', complexity: 'O(n)' },
              { api: 'Math.max', use: 'Farthest reach / running end', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Max/min count with free reordering', 'Interval selection (sort by end)', 'Reachability / min jumps', 'Circular gain/cost route', 'Deadlines + durations (heap)', 'Neighbour constraints (two passes)'],
    clues: ['maximum number of', 'non-overlapping', 'can you reach', 'minimum jumps', 'refuel', 'deadline', 'neighbours', 'wildcard *'],
    template: `items.sort(byKey);
let state = init;
for (const x of items) {
  if (ok(state, x)) state = take(state, x);
}
return answer(state);`,
    complexity: 'O(n log n) with sort/heap, O(n) for sweeps',
    mistakes: ['No proof / no counter-example check', 'Wrong sort key', 'Default lexicographic sort', 'Wrong heap direction', 'One pass instead of two'],
    jsTools: ['sort comparator', 'MaxHeap / MinHeap', 'Map', 'Math.max', 'splice'],
  },

  keyConcepts: [
    'Greedy commits to the locally best choice and never revisits it — fast, but only correct with a proof.',
    'Counter-example first: coins [1, 3, 4], amount 6 → greedy 3 coins, optimum 2 (DP).',
    'Proof tools: exchange argument, "greedy stays ahead", and invariants like "every index ≤ reach is reachable".',
    'The sort key is the design: end time for interval selection, cost difference for two-city scheduling.',
    'Heaps let greedy "regret": take the best passed option or evict the worst chosen one.',
    'Two passes satisfy constraints from both sides (candy); ranges replace branching (valid parenthesis string).',
    'Gas station: a failure at i rules out every start up to i.',
  ],

  interviewTips: [
    'State the greedy rule, then a one-line exchange argument.',
    'Show you checked a counter-example to the naive rule.',
    'Call out the O(n log n) sort as the bottleneck.',
  ],
};
