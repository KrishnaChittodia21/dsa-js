export default {
  id: 'dp-advanced',
  summary: 'The DP families that show up in hard interviews — LIS, palindromes, state machines, trees, intervals, bitmasks and digits — each is the same "state + transition" idea with a characteristic choice of state.',

  jsTools: [
    { api: 'Array.from({ length: n }, () => new Array(m).fill(0))', use: '2D DP tables with independent rows', complexity: 'O(n·m)' },
    { api: 'lower-bound binary search (hand-written)', use: 'Patience-sorting LIS in O(n log n); JS has no built-in bisect', complexity: 'O(log n)' },
    { api: 'Bitwise ops: 1 << i, mask & (1 << i), mask | (1 << i)', use: 'Subsets as integers for bitmask DP (n ≤ ~20)', complexity: 'O(1)' },
    { api: 'new Int32Array(1 << n) / new Array(1 << n).fill(-1)', use: 'Memo indexed by mask — much faster than a Map', complexity: 'O(2^n) memory' },
    { api: 'String(n).split("").map(Number)', use: 'Digits of the bound for digit DP', complexity: 'O(log n)' },
    { api: 'Returning [a, b] from recursion', use: 'Tree DP: each subtree reports several states at once (e.g. [rob, skip])', complexity: 'O(1) per node' },
    { api: '-Infinity', use: 'Initial value for "impossible" states in max-DP (e.g. holding before any buy)', complexity: '—' },
  ],

  patterns: [
    {
      id: 'dp-adv-lis',
      name: 'Longest Increasing Subsequence (DP & Patience Sorting)',
      summary: 'dp[i] = length of the best increasing subsequence ending at i (O(n²)); or keep tails[len] = smallest possible tail of an increasing subsequence of length len+1 and binary-search where each number goes (O(n log n)).',
      whyItExists: 'Subsequences can skip elements, so there are 2^n of them. "Ends at i" gives a clean O(n²) DP; the tails array compresses all the information the DP needs into one sorted array, so each step is a binary search.',
      whenToUse: ['Longest / count of increasing (or non-decreasing) subsequences', 'Nesting problems after sorting (envelopes, boxes, people stacking)', 'Minimum deletions to make an array sorted = n − LIS'],
      clues: ['"longest increasing subsequence"', '"strictly increasing"', '"nest inside"', '"chain of pairs"', '"number of longest"', '"minimum removals to make sorted"'],
      whenNotToUse: ['The answer must be contiguous (a subarray) → sliding window / Kadane', 'Both dimensions must increase and you cannot sort one away → 2D structures'],
      template: `function lengthOfLIS(nums) {
  const tails = [];                     // tails[k] = smallest tail of an increasing subsequence of length k+1
  for (const x of nums) {
    let lo = 0, hi = tails.length;      // first index with tails[idx] >= x
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    tails[lo] = x;                      // extend (lo === length) or improve a tail
  }
  return tails.length;
}`,
      variations: [
        { name: 'Number of LIS', description: 'O(n²) with len[i] and cnt[i]: when a longer length appears, copy the count; when an equal length appears, add it.' },
        { name: 'Russian dolls', description: 'Sort by width ascending and height DESCENDING, then LIS on heights.' },
        { name: 'Non-decreasing LIS', description: 'Use upper bound (first tail > x) instead of lower bound.' },
      ],
      mistakes: ['Thinking tails is an actual subsequence (it is not)', 'Lower vs upper bound for strict vs non-strict', 'Sorting envelopes with equal widths ascending by height (lets equal widths nest)'],
      evolution: { easy: 'LIS length in O(n²).', medium: 'LIS in O(n log n); count of LIS.', hard: 'Reduce a 2D nesting problem to LIS with a clever sort.' },
    },
    {
      id: 'dp-adv-palindrome',
      name: 'Palindromic DP (Expand Around Center & Interval Table)',
      summary: 'Palindromes are defined from the inside out: s[i..j] is a palindrome iff s[i] === s[j] and s[i+1..j-1] is one. Either expand from each of the 2n−1 centers, or fill a table over (i, j) by increasing length.',
      whyItExists: 'Checking every substring is O(n³). Reusing the inner answer makes each (i, j) O(1), giving O(n²) — and expansion does it with O(1) memory.',
      whenToUse: ['Longest palindromic substring / count of palindromic substrings', 'Longest palindromic SUBSEQUENCE (can skip characters)', 'Minimum insertions/deletions to make a palindrome'],
      clues: ['"palindrome"', '"reads the same backwards"', '"minimum insertions to make palindrome"', '"longest palindromic"'],
      whenNotToUse: ['n ≥ 10^5 and you need all palindromic substrings in linear time → Manacher (see String Algorithms)'],
      template: `// Longest palindromic subsequence: dp[i][j] over s[i..j]
function lps(s) {
  const n = s.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = n - 1; i >= 0; i--) {        // i goes DOWN so dp[i+1][*] is ready
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      dp[i][j] = s[i] === s[j] ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
    }
  }
  return n ? dp[0][n - 1] : 0;
}`,
      variations: [
        { name: 'Expand around center', description: 'For each center (a character or a gap), grow while ends match. O(n²) time, O(1) space.' },
        { name: 'Boolean table', description: 'isPal[i][j] = s[i] === s[j] && (j − i < 2 || isPal[i+1][j−1]).' },
        { name: 'LPS = LCS(s, reverse(s))', description: 'The longest palindromic subsequence is the LCS of the string with its reverse.' },
      ],
      mistakes: ['Only trying odd-length centers', 'Filling the table in an order where dp[i+1][j−1] is not ready yet', 'Confusing substring (contiguous) with subsequence'],
      evolution: { easy: 'Is this string a palindrome?', medium: 'Longest palindromic substring / subsequence.', hard: 'Palindrome partitioning with minimum cuts, Manacher.' },
    },
    {
      id: 'dp-adv-state-machine',
      name: 'State-Machine DP (Buy/Sell Stock Family)',
      summary: 'Describe "what situation am I in at the end of day i" with a few named states (hold, sold, rest, transactions used) and write one transition per arrow of the state diagram.',
      whyItExists: 'Rules like cooldowns, fees and transaction limits make greedy fail. A small state machine captures exactly the information the future depends on, so each day is O(#states).',
      whenToUse: ['Sequential decisions with modes (holding / not holding, on cooldown, k uses left)', 'Constraints that depend on what you did yesterday'],
      clues: ['"cooldown"', '"transaction fee"', '"at most k transactions"', '"cannot do X on consecutive days"', '"you must sell before you buy again"'],
      whenNotToUse: ['Unlimited transactions and no fee/cooldown → simple greedy (sum of positive differences)'],
      template: `function maxProfitWithCooldown(prices) {
  let hold = -Infinity, sold = 0, rest = 0;   // states at the end of the previous day
  for (const p of prices) {
    const prevHold = hold, prevSold = sold, prevRest = rest;
    hold = Math.max(prevHold, prevRest - p);  // keep holding, or buy (only from rest)
    sold = prevHold + p;                      // sell today
    rest = Math.max(prevRest, prevSold);      // idle; yesterday's sale ends its cooldown
  }
  return Math.max(sold, rest);
}`,
      variations: [
        { name: 'Transaction fee', description: 'Two states: hold / cash. Pay the fee on sell (or buy).' },
        { name: 'At most k transactions', description: 'States buy[j] / sell[j] for j = 1..k; when k ≥ n/2 it is unlimited.' },
        { name: 'Paint house / no two adjacent', description: 'State = colour (or choice) used yesterday.' },
      ],
      mistakes: ['Updating states in place so today\'s buy uses today\'s sell', 'Initialising hold with 0 (you cannot hold without buying)', 'Allowing buy straight after sell in the cooldown version'],
      evolution: { easy: 'One transaction (track min so far).', medium: 'Cooldown / fee with 2–3 states.', hard: 'k transactions: 2k states per day.' },
    },
    {
      id: 'dp-adv-tree',
      name: 'Tree DP (Post-order with Several States per Node)',
      summary: 'Each node returns a small tuple describing its subtree under different assumptions (robbed / not robbed; has camera / covered / not covered). The parent combines children\'s tuples in O(1).',
      whyItExists: 'A greedy top-down choice can be wrong and brute force over subsets is exponential. Because subtrees only interact through their root, a few numbers per node carry all information the parent needs.',
      whenToUse: ['Choose a subset of tree nodes with adjacency constraints', 'Cover / monitor / dominate the tree cheaply', 'Diameter-like quantities combining two children'],
      clues: ['binary tree + "maximum amount without adjacent"', '"minimum cameras to monitor"', '"each node covers its parent and children"'],
      whenNotToUse: ['General graphs with cycles (no clean subtree independence)'],
      template: `function rob(root) {
  function dfs(node) {                 // returns [bestIfRobbed, bestIfSkipped]
    if (!node) return [0, 0];
    const [lr, ls] = dfs(node.left);
    const [rr, rs] = dfs(node.right);
    const robIt = node.val + ls + rs;                    // children must be skipped
    const skipIt = Math.max(lr, ls) + Math.max(rr, rs);  // children free
    return [robIt, skipIt];
  }
  return Math.max(...dfs(root));
}`,
      variations: [
        { name: 'Binary tree cameras', description: '3 states per node: 0 = not covered, 1 = covered without camera, 2 = has camera. Greedy from the leaves up.' },
        { name: 'Rerooting', description: 'Two passes (down then up) to get the answer for every root.' },
      ],
      mistakes: ['Memoizing by node value instead of node identity', 'Forgetting the root itself may be uncovered (cameras)', 'Top-down greedy (rob the root if it is big)'],
      evolution: { easy: 'Max path/height per node.', medium: 'House Robber III with [rob, skip].', hard: 'Binary tree cameras with 3 states / rerooting.' },
    },
    {
      id: 'dp-adv-interval',
      name: 'Interval DP (Think About the LAST Action)',
      summary: 'dp[i][j] = best answer for the sub-range i..j. Choose a split point k — usually the LAST balloon to burst or the FIRST cut to make — so that the two sides become independent sub-problems.',
      whyItExists: 'Choosing the first balloon to burst changes the neighbours of everything else, so sub-problems are not independent. Choosing the LAST one fixes its neighbours (the range boundaries), making left and right independent.',
      whenToUse: ['Merge / burst / cut operations on a sequence where cost depends on neighbours or segment length', 'Optimal parenthesisation (matrix chain), polygon triangulation'],
      clues: ['"burst"', '"merge stones"', '"cut the stick"', '"cost equals length of the piece"', '"remove and neighbours become adjacent"'],
      whenNotToUse: ['Cost of an action does not depend on the order/neighbours → greedy or 1D DP'],
      template: `// dp[i][j]: best for the open interval (i, j) with fixed boundaries i and j
for (let len = 2; len < m; len++) {          // interval size, small → large
  for (let i = 0; i + len < m; i++) {
    const j = i + len;
    for (let k = i + 1; k < j; k++) {        // k = the LAST thing done inside (i, j)
      dp[i][j] = best(dp[i][j], dp[i][k] + dp[k][j] + cost(i, k, j));
    }
  }
}`,
      variations: [
        { name: 'Burst balloons', description: 'Pad with 1s; cost(i,k,j) = a[i]·a[k]·a[j] because i and j are still alive when k is burst last.' },
        { name: 'Cut a stick', description: 'Sort cuts, add 0 and n; cost = pos[j] − pos[i] (the piece length when the first cut inside is made).' },
        { name: 'Matrix chain / merge stones', description: 'Same triple loop with a different cost.' },
      ],
      mistakes: ['Iterating i then j in plain order so dp[k][j] is not ready — iterate by length', 'Thinking about the FIRST balloon (sub-problems are not independent)', 'Forgetting to add the boundaries (1s / 0 and n)'],
      evolution: { easy: 'Recognise the range state.', medium: 'Stick cutting / matrix chain.', hard: 'Burst balloons, strange printer, merge k stones.' },
    },
    {
      id: 'dp-adv-bitmask',
      name: 'Bitmask DP (Subsets as Integers)',
      summary: 'When n ≤ ~20, represent "which items are used" as the bits of an integer mask. dp[mask] or dp[mask][last] over all 2^n subsets.',
      whyItExists: 'Permutation problems are n!; but often the future only depends on WHICH items are used (and maybe the last one), not their order. That collapses n! orders into 2^n·n states.',
      whenToUse: ['n ≤ 16–20 and you need an assignment, ordering or partition', 'TSP-style "visit all, cost depends on consecutive pair"'],
      clues: ['n ≤ 16 / 20', '"partition into k subsets"', '"visit every node"', '"shortest superstring"', '"assign each worker a job"'],
      whenNotToUse: ['n ≥ 25 — 2^n becomes too large'],
      template: `// TSP-style: dp[mask][last] = best cost of a path visiting exactly mask, ending at last
const FULL = (1 << n) - 1;
const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
for (let i = 0; i < n; i++) dp[1 << i][i] = start(i);
for (let mask = 1; mask <= FULL; mask++) {
  for (let last = 0; last < n; last++) {
    if (!(mask & (1 << last)) || dp[mask][last] === Infinity) continue;
    for (let nxt = 0; nxt < n; nxt++) {
      if (mask & (1 << nxt)) continue;
      const nm = mask | (1 << nxt);
      dp[nm][nxt] = Math.min(dp[nm][nxt], dp[mask][last] + cost(last, nxt));
    }
  }
}`,
      variations: [
        { name: 'Partition into k equal subsets', description: 'dp[mask] = fill level of the current bucket (sum of mask % target), or -1 if unreachable.' },
        { name: 'Shortest superstring', description: 'cost(a, b) = extra characters needed to append b after a; keep parent pointers to rebuild the string.' },
      ],
      mistakes: ['Operator precedence: `mask & 1 << i === 0` parses as `mask & ((1 << i) === 0)` — always parenthesise', 'Using a Map for 2^20 states (slow) instead of a typed array', 'Forgetting to reconstruct the answer (store parents)'],
      evolution: { easy: 'Enumerate subsets with a mask loop.', medium: 'Partition to k equal subsets.', hard: 'TSP / shortest superstring with reconstruction.' },
    },
    {
      id: 'dp-adv-digit',
      name: 'Digit DP (Count Numbers ≤ N with a Property)',
      summary: 'Build numbers digit by digit from the most significant one, remembering whether you are still "tight" (equal to N\'s prefix so far). Memoize on (position, tight, extra state).',
      whyItExists: 'Iterating over all numbers up to 10^9 is too slow. The property usually depends only on a little summary of the digits chosen so far, so the number of states is (digits × 2 × state), tiny.',
      whenToUse: ['Count integers in [0, N] (or [L, R] via f(R) − f(L−1)) satisfying a digit property', 'Count occurrences of a digit across a range'],
      clues: ['"count numbers from 1 to n"', '"how many times digit d appears"', '"digits are unique / non-decreasing"', 'n up to 10^9 or 10^18'],
      whenNotToUse: ['The property is about the value arithmetically (primes, divisors) and not about digits'],
      template: `function countUpTo(N) {
  const digits = String(N).split('').map(Number);
  const memo = new Map();
  function go(pos, tight, state) {
    if (pos === digits.length) return /* value for a finished number */ 0;
    const key = pos + ',' + state;          // only non-tight states are shared
    if (!tight && memo.has(key)) return memo.get(key);
    const limit = tight ? digits[pos] : 9;
    let total = 0;
    for (let d = 0; d <= limit; d++) {
      total += go(pos + 1, tight && d === limit, /* next state */ state);
    }
    if (!tight) memo.set(key, total);
    return total;
  }
  return go(0, true, 0);
}`,
      variations: [
        { name: 'Per-position counting formula', description: 'For digit 1: at each place value p, count = high·p + (cur > 1 ? p : cur === 1 ? low + 1 : 0).' },
        { name: 'Ranges', description: 'count(L..R) = f(R) − f(L − 1).' },
        { name: 'Leading zeros state', description: 'Add a "started" flag when leading zeros would change the property.' },
      ],
      mistakes: ['Forgetting that tight stays true only if d equals the limit', 'Memoizing tight states (they are unique paths — harmless but pointless)', 'Leading zeros counted as real digits'],
      evolution: { easy: 'Count numbers ≤ N with a simple formula.', medium: 'Count of digit one per position.', hard: 'Digit DP with extra state (remainder, used-digit mask, non-decreasing).' },
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
            md: `You already know the DP recipe from the 1D and 2D topics: **define a state, write the transition, pick an order, handle base cases.** Advanced DP is not a new idea — it is a catalogue of *clever states* that experienced people reach for:

| Family | State | Typical question |
|---|---|---|
| LIS | "best subsequence **ending at i**" / sorted \`tails\` | longest increasing subsequence, nesting envelopes |
| Palindromic | the substring \`s[i..j]\` | longest palindromic substring / subsequence |
| State machine | (day, **mode**) — hold / sold / rest / k left | stock buy/sell with cooldown, fee, k transactions |
| Tree | (node, a few flags) returned **post-order** | house robber on a tree, cameras |
| Interval | the range \`(i, j)\` + the **last** action inside it | burst balloons, cut a stick |
| Bitmask | the **set** of used items as an integer (+ last item) | partition into k subsets, shortest superstring |
| Digit | (position, **tight**, summary) | count digit 1 in 1..n |

Once you can name the family, the rest is the standard recipe.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms used in this lesson',
            md: `- **Subsequence** — keep some elements in their original order, possibly skipping some (not necessarily contiguous).
- **Patience sorting** — the card game strategy behind the O(n log n) LIS algorithm: place each card on the leftmost pile whose top is ≥ it.
- **State machine** — a small set of named situations and the allowed moves (arrows) between them.
- **Post-order** — process children before the parent.
- **Bitmask** — an integer whose bit i says whether item i is in the set.
- **Tight** — in digit DP, "every digit so far equals the bound's digit", so the next digit is capped.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Analogy',
            md: 'A DP state is like the note a relay runner hands to the next runner. The art is writing the *shortest note that still lets the next runner make perfect decisions*: for stocks, "am I holding?"; for trees, "was my child robbed?"; for bitmasks, "which cities are already visited and where am I?".',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Every problem here has an exponential brute force:

- LIS: 2^n subsequences.
- Stocks with k transactions: every buy/sell pattern.
- Tree robbery: every subset of nodes.
- Burst balloons: n! orders.
- Superstring: n! word orders.
- Digit counting up to 10^9: a billion numbers.

The DP versions are O(n log n), O(n·k), O(n), O(n³), O(2^n·n²) and O(digits) respectively — because each finds the *minimum information about the past* that the future depends on.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-1',
            question: 'Burst Balloons has n! burst orders. Why can a DP over ranges avoid trying all of them?',
            options: [
              'Because the order does not matter for the final score',
              'Because once we fix which balloon in (i, j) is burst LAST, the left and right parts no longer affect each other',
              'Because we can always burst the smallest balloon first',
              'Because n is at most 20',
            ],
            answer: 1,
            explanation: 'If k is the last balloon burst between boundaries i and j, then while bursting everything in (i, k) the balloon k is still there as a wall, and likewise for (k, j). The two sides are independent sub-problems: dp[i][j] = max over k of dp[i][k] + dp[k][j] + a[i]·a[k]·a[j].',
            misconceptions: {
              0: 'Order matters a lot — the coins depend on current neighbours, which change as balloons disappear.',
              2: 'Greedy choices fail here; e.g. [3,1,5,8] is not optimal with smallest-first.',
              3: 'n goes up to 300 on LeetCode; the DP is O(n³), not exponential.',
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| If you see… | Try |
|---|---|
| "subsequence", "increasing", "nest", "chain" | LIS (maybe after sorting) |
| "palindrome" | Center expansion or \`dp[i][j]\` on the substring |
| "cooldown", "fee", "at most k transactions", "consecutive days" | State machine |
| A binary tree + choose/cover nodes | Tree DP returning a tuple |
| "burst", "merge", "cut", cost depends on neighbours/length | Interval DP (last action) |
| n ≤ 20 + subsets/orders | Bitmask DP |
| "count numbers ≤ N" with a digit property | Digit DP |`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Read the constraints',
            md: 'Constraints often reveal the family: n ≤ 16 → bitmask; n ≤ 500 → O(n³) interval DP is fine; n ≤ 10^5 → O(n log n) LIS; N ≤ 10^9 but "count numbers" → digit DP with ~10 positions.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['subsequence + increasing', 'palindrome', 'cooldown / fee / k transactions', 'tree + no two adjacent / cover', 'burst / cut / merge', 'n ≤ 20', 'count numbers up to N'],
            conclusion: 'Name the DP family first, then define its standard state',
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-2',
            question: '"Given up to 12 words, return the shortest string that contains each word as a substring." Which family and why?',
            options: [
              'Interval DP — the words form a range',
              'LIS — sort words by length',
              'Bitmask DP — the cost of appending a word depends only on the previous word, and n ≤ 12 allows 2^n·n states',
              'Digit DP — we count characters',
            ],
            answer: 2,
            explanation: 'The order of words matters only through consecutive overlaps, so the state is (set of words used, last word). 2^12 · 12 ≈ 49k states with 12 transitions each — easily fast. It is the travelling-salesman shape.',
            misconceptions: {
              0: 'Words can be placed in any order; they are not a fixed contiguous range of an array.',
              1: 'Sorting by length does not determine the optimal order; overlaps do.',
              3: 'Digit DP counts numbers under a bound; nothing here is about digits of a number.',
            },
          },
        ],
      },
      {
        id: 'intuition-lis',
        title: 'Core intuition — Longest Increasing Subsequence',
        blocks: [
          {
            type: 'text',
            md: `**O(n²) DP.** Let \`dp[i]\` = length of the longest strictly increasing subsequence that **ends exactly at index i**. It either is just \`nums[i]\` (length 1), or extends some earlier \`j < i\` with \`nums[j] < nums[i]\`:

\`\`\`text
dp[i] = 1 + max(dp[j] for j < i with nums[j] < nums[i])   (or 1 if none)
answer = max(dp)
\`\`\`

Why "ends at i"? Because to extend a subsequence you only need to know its **last value** — "ends at i" pins that down.

**Number of LIS.** Keep a second array \`cnt[i]\` = how many LIS of length \`dp[i]\` end at i. When a j gives a *longer* length, \`cnt[i] = cnt[j]\`; when it gives the *same* length, \`cnt[i] += cnt[j]\`.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-3',
            question: 'nums = [10, 9, 2, 5, 3, 7, 101, 18]. What is dp[5] (for the 7)?',
            options: ['2', '3', '4', '1'],
            answer: 1,
            explanation: 'Earlier values smaller than 7: 2 (dp=1), 5 (dp=2), 3 (dp=2). Best is 2, so dp[5] = 3 — e.g. [2, 5, 7] or [2, 3, 7].',
            misconceptions: {
              0: '2 would be just one element before 7. But 5 (or 3) already has a subsequence of length 2 ending at it ([2,5]).',
              2: '4 would need three smaller increasing values before 7; 5 and 3 are not increasing relative to each other.',
              3: 'dp[i] = 1 only when no earlier element is smaller; here 2, 5 and 3 are all smaller than 7.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'code',
            title: 'LIS by trying every subsequence — O(2^n)',
            code: `function lengthOfLIS(nums) {
  function go(i, prev) {            // best length using nums[i..] with last chosen value prev
    if (i === nums.length) return 0;
    let best = go(i + 1, prev);     // skip nums[i]
    if (nums[i] > prev) best = Math.max(best, 1 + go(i + 1, nums[i])); // take it
    return best;
  }
  return go(0, -Infinity);
}`,
            caption: 'Correct but exponential. Memoizing on (i, index of prev) gives the O(n²) DP.',
          },
          {
            type: 'text',
            md: 'Every advanced family has a brute force like this — "try every choice" recursion. The DP comes from spotting which parameters the recursion really depends on and caching them. Say this out loud in interviews: *"the recursion only depends on (i, prev), so there are O(n²) distinct calls."*',
          },
        ],
      },
      {
        id: 'optimized-lis',
        title: 'Optimized approach — patience sorting in O(n log n)',
        blocks: [
          {
            type: 'text',
            md: `Keep an array \`tails\` where

> \`tails[k]\` = the **smallest possible last value** of an increasing subsequence of length \`k + 1\` seen so far.

For each new number \`x\`, find the first index \`k\` with \`tails[k] >= x\` (lower bound):
- if none, \`x\` extends the longest subsequence → push it;
- otherwise replace \`tails[k] = x\`: we found a length-(k+1) subsequence with a **smaller** tail, which is never worse for the future.

The answer is \`tails.length\`.

**Why is \`tails\` always sorted?** A length-(k+2) subsequence contains a length-(k+1) prefix whose last value is smaller than its own last value. So the best tail for length k+1 is < the best tail for length k+2. Sorted ⇒ binary search works.

**Why is replacing safe?** A smaller tail can be extended by everything a larger tail can (anything > big tail is also > small tail), and possibly more. We never lose an option.`,
          },
          { type: 'visual', scenario: 'lis-patience', caption: "tails[k] = smallest possible tail of an increasing subsequence of length k + 1." },
          {
            type: 'callout',
            variant: 'warning',
            title: 'tails is NOT a subsequence',
            md: 'After [3, 4, 1] you get tails = [1, 4] — but "1, 4" is not a subsequence in that order (1 comes after 4). Each entry only records a *best tail per length*. The LENGTH of tails is the answer; its contents are bookkeeping. To rebuild an actual LIS, store the index and a parent pointer for each placement.',
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-4',
            question: 'tails = [2, 5, 7] and the next number is 3. What happens?',
            options: [
              'Append 3 → [2, 5, 7, 3]',
              'Replace 5 with 3 → [2, 3, 7]',
              'Replace 2 with 3 → [3, 5, 7]',
              'Ignore 3 because it is smaller than 7',
            ],
            answer: 1,
            explanation: 'Lower bound of 3 is index 1 (first tail ≥ 3 is 5). A length-2 subsequence can end in 3 (e.g. [2, 3]) — a smaller tail than 5 — so tails[1] = 3.',
            misconceptions: {
              0: 'Appending would claim a length-4 increasing subsequence ending in 3 after 7 — impossible since 3 < 7. tails must stay sorted.',
              2: 'Replacing 2 would mean the best length-1 tail got worse (3 > 2). We only ever make tails smaller.',
              3: 'Ignoring loses information: [2, 3] is a better length-2 subsequence than [2, 5], and a later 4 could extend it.',
            },
            deeper: 'Follow up with the next number 4: lower bound of 4 in [2, 3, 7] is index 2 → tails = [2, 3, 4]. Had we ignored 3, we would have [2, 5, 7] → 4 replaces 5 → [2, 4, 7]; same length here, but the general principle — keep every tail as small as possible — is what guarantees correctness.',
          },
          {
            type: 'text',
            md: `**Russian doll envelopes.** An envelope fits inside another if **both** width and height are strictly smaller. Sort by width ascending, and for equal widths by height **descending**, then run LIS on the heights.

Why descending? Envelopes with the same width cannot nest. With heights in descending order within a width group, any strictly increasing subsequence of heights can pick **at most one** envelope from each group. If you sorted ascending, [3,4] and [3,5] would look like a valid chain of 2.`,
          },
          {
            type: 'reflect',
            prompt: 'Can you explain why sorting envelopes by width ascending and height descending turns a 2D problem into 1D LIS?',
            deeper: 'After sorting, widths never decrease along the array, so any subsequence already has non-decreasing widths. We need strictly increasing widths AND heights. The only way widths could fail to be strict is picking two envelopes with the same width — but within a width group heights are descending, so a strictly increasing height subsequence can never take two of them. Hence "strictly increasing heights" ⇔ "valid nesting chain".',
          },
        ],
      },
      {
        id: 'template-lis',
        title: 'Pattern / template — LIS',
        blocks: [
          {
            type: 'code',
            title: 'Lower bound (strict LIS) / upper bound (non-decreasing LIS)',
            code: `// strict = true  → first index with arr[i] >= x   (lower bound)
// strict = false → first index with arr[i] >  x   (upper bound)
function bound(arr, x, strict) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (strict ? arr[mid] < x : arr[mid] <= x) lo = mid + 1; else hi = mid;
  }
  return lo;
}
function lis(nums, strict = true) {
  const tails = [];
  for (const x of nums) tails[bound(tails, x, strict)] = x;   // push or replace
  return tails.length;
}`,
            caption: 'Writing tails[length] = x is the same as push(x) — the replace and extend cases become one line.',
          },
        ],
      },
      {
        id: 'implementation-lis',
        title: 'JavaScript implementation — number of LIS',
        blocks: [
          {
            type: 'code',
            title: 'Length + count arrays — O(n²)',
            code: `function findNumberOfLIS(nums) {
  const n = nums.length;
  const len = new Array(n).fill(1), cnt = new Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] >= nums[i]) continue;
      if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; cnt[i] = cnt[j]; } // strictly better
      else if (len[j] + 1 === len[i]) cnt[i] += cnt[j];                  // another way
    }
  }
  const best = Math.max(...len);
  let total = 0;
  for (let i = 0; i < n; i++) if (len[i] === best) total += cnt[i];
  return total;
}`,
            caption: 'Math.max(...arr) is fine for n ≤ ~10^5; for larger arrays use a loop (spread hits argument limits).',
          },
        ],
      },
      {
        id: 'dry-run-lis',
        title: 'Dry run — patience sorting',
        blocks: [
          {
            type: 'dryrun',
            title: 'nums = [10, 9, 2, 5, 3, 7, 101, 18]',
            columns: ['x', 'lower bound k', 'action', 'tails'],
            rows: [
              ['10', '0', 'push', '[10]'],
              ['9', '0', 'replace 10', '[9]'],
              ['2', '0', 'replace 9', '[2]'],
              ['5', '1', 'push', '[2, 5]'],
              ['3', '1', 'replace 5', '[2, 3]'],
              ['7', '2', 'push', '[2, 3, 7]'],
              ['101', '3', 'push', '[2, 3, 7, 101]'],
              ['18', '3', 'replace 101', '[2, 3, 7, 18]'],
            ],
            note: 'Answer = tails.length = 4.',
          },
        ],
      },
      {
        id: 'intuition-palindrome',
        title: 'Core intuition — palindromic DP',
        blocks: [
          {
            type: 'text',
            md: `A palindrome is built **from the middle outwards**: \`"racecar"\` is \`"r" + "aceca" + "r"\`, and \`"aceca"\` is \`"a" + "cec" + "a"\`, …

**Longest palindromic substring — expand around center.** Every palindrome has a center: a character (odd length) or a gap between two characters (even length). There are \`2n − 1\` centers. From each, expand while \`s[l] === s[r]\`. Each expansion is O(n) → O(n²) total, **O(1) space**.

**Same thing as a table:** \`isPal[i][j] = s[i] === s[j] && (j − i < 2 || isPal[i + 1][j − 1])\`. Fill by increasing length (or i from n−1 down). O(n²) time and space.

**Longest palindromic subsequence** (characters may be skipped):

\`\`\`text
dp[i][j] = best for s[i..j]
s[i] === s[j] → dp[i+1][j-1] + 2        (both ends join the palindrome)
otherwise     → max(dp[i+1][j], dp[i][j-1])   (drop one end)
\`\`\`

Equivalently, LPS(s) = LCS(s, reverse(s)) — you met LCS in DP 2D.`,
          },
          {
            type: 'visual',
            scenario: 'dp-lcs',
            input: { a: 'bbbab', b: 'babbb' },
            caption: 'Longest palindromic subsequence of "bbbab" = LCS of "bbbab" and its reverse "babbb" = 4 ("bbbb").',
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-5',
            question: 'Why does expand-around-center need **2n − 1** centers instead of just n?',
            options: [
              'Because every character is checked twice for safety',
              'Because even-length palindromes like "abba" are centered on the gap between two characters, not on a character',
              'Because we expand left and right separately',
              'It does not; n centers are enough',
            ],
            answer: 1,
            explanation: '"abba" has no middle character — its center is between the two b\'s. So we try n character centers (odd lengths) and n − 1 gap centers (even lengths).',
            misconceptions: {
              0: 'Nothing is double-checked; the two kinds of centers produce different palindromes.',
              2: 'Each center expands both ways at once; that is not where the extra centers come from.',
              3: 'With only character centers, "abba" would never be found — you would return "bb" or "a".',
            },
          },
        ],
      },
      {
        id: 'optimized-palindrome',
        title: 'Optimized approach — palindromes',
        blocks: [
          {
            type: 'code',
            title: 'Expand around center — O(n²) time, O(1) space',
            code: `function longestPalindrome(s) {
  let start = 0, bestLen = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return r - l - 1;                         // length of s[l+1..r-1]
  };
  for (let c = 0; c < s.length; c++) {
    const len = Math.max(expand(c, c), expand(c, c + 1)); // odd, even
    if (len > bestLen) { bestLen = len; start = c - Math.floor((len - 1) / 2); }
  }
  return s.slice(start, start + bestLen);
}`,
          },
          {
            type: 'text',
            md: 'For the subsequence version, the table is required (skipping characters breaks the "expand" picture). Note the loop order: \`dp[i][j]\` reads \`dp[i+1][…]\`, so **i must go from n − 1 down to 0** and j upward from i + 1.',
          },
        ],
      },
      {
        id: 'implementation-palindrome',
        title: 'JavaScript implementation — palindromic subsequence in O(n) memory',
        blocks: [
          {
            type: 'code',
            title: 'Rolling rows',
            code: `function longestPalindromeSubseq(s) {
  const n = s.length;
  let next = new Array(n).fill(0);            // row i + 1
  for (let i = n - 1; i >= 0; i--) {
    const cur = new Array(n).fill(0);         // row i
    cur[i] = 1;
    for (let j = i + 1; j < n; j++) {
      cur[j] = s[i] === s[j] ? next[j - 1] + 2 : Math.max(next[j], cur[j - 1]);
    }
    next = cur;
  }
  return n ? next[n - 1] : 0;
}`,
            caption: 'next[j − 1] is dp[i+1][j−1]; next[j] is dp[i+1][j]; cur[j − 1] is dp[i][j−1].',
          },
        ],
      },
      {
        id: 'intuition-state-machine',
        title: 'Core intuition — state-machine DP',
        blocks: [
          {
            type: 'text',
            md: `Stock problems become easy once you **draw the states**. For "unlimited transactions with a 1-day cooldown after selling", at the end of any day you are in exactly one of three situations:

\`\`\`text
                 buy (−price)
        ┌──────────────────────────┐
        │                          ▼
     ┌──────┐                  ┌──────┐
 ┌──▶│ REST │                  │ HOLD │◀──┐
 │   └──────┘                  └──────┘   │ keep holding
 │  idle │ ▲                      │ └─────┘
 └───────┘ │ cooldown over        │ sell (+price)
           │                      ▼
           │                  ┌──────┐
           └──────────────────│ SOLD │   (sold today → must rest tomorrow)
                              └──────┘
\`\`\`

- **HOLD** — you own a share. Reach it by holding yesterday, or by buying today from REST (not from SOLD — cooldown!).
- **SOLD** — you sold today. Only reachable from HOLD.
- **REST** — no share, not sold today. From REST (idle) or SOLD (cooldown finishes).

Each arrow is one term in a \`max\`:

\`\`\`text
hold[i] = max(hold[i-1], rest[i-1] - price[i])
sold[i] = hold[i-1] + price[i]
rest[i] = max(rest[i-1], sold[i-1])
answer  = max(sold[n-1], rest[n-1])
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'State-machine DP',
            md: 'A DP whose state is **(position, mode)** where "mode" is one of a few named situations. Transitions are exactly the arrows of the diagram. Because each day depends only on the previous day, you only need O(#modes) variables.',
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-6',
            question: 'Why is `hold` initialised to `-Infinity` (not 0) before day 0?',
            options: [
              'So that the answer can be negative',
              'Because holding a share before any purchase is impossible; -Infinity makes every transition out of that state lose to a real option',
              'Because JavaScript numbers start at -Infinity',
              'To make the code shorter',
            ],
            answer: 1,
            explanation: 'With hold = 0 you would be pretending to own a free share, and sold on day 0 would be +price — a profit from nothing. -Infinity marks the state as unreachable; max() then always prefers a real path (buying for −price).',
            misconceptions: {
              0: 'Profit is never negative here (you can always do nothing), and that is not what the initial value is for.',
              2: 'Uninitialised `let` variables are `undefined`, not -Infinity. The choice is deliberate.',
              3: 'It is about correctness: 0 would allow selling a share you never bought.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Why must you compute today\'s three states from **yesterday\'s** values (saving prevHold etc.) rather than updating the variables one after another?',
            deeper: 'If you first update `sold = hold + p` and then `hold = max(hold, rest − p)` using the *new* rest, or compute rest from the *new* sold, you allow two actions on the same day (e.g. sell and then "finish the cooldown" instantly, or buy and sell the same day using today\'s values). Snapshot yesterday\'s values (or order the updates so each reads only unmodified variables) so every arrow in the diagram consumes exactly one day.',
          },
        ],
      },
      {
        id: 'optimized-state-machine',
        title: 'Optimized approach — fee and k transactions',
        blocks: [
          {
            type: 'text',
            md: `**Transaction fee:** two states — \`cash\` (no share) and \`hold\`. Pay the fee when selling:

\`\`\`text
cash = max(cash, hold + price - fee)
hold = max(hold, cash - price)
\`\`\`

(Using the updated \`cash\` in the second line is safe here: it would mean "sell and re-buy on the same day", which never increases profit because of the fee.)

**At most k transactions:** a transaction = buy + sell. States \`buy[j]\` = best balance while holding the j-th share, \`sell[j]\` = best balance after completing j sales:

\`\`\`text
for each price p, for j = 1..k:
  buy[j]  = max(buy[j],  sell[j-1] - p)
  sell[j] = max(sell[j], buy[j] + p)
\`\`\`

If \`k >= n / 2\`, the limit can never bind (a transaction needs 2 days), so fall back to the greedy "sum every positive day-to-day rise".`,
          },
        ],
      },
      {
        id: 'template-state-machine',
        title: 'Pattern / template — state machine',
        blocks: [
          {
            type: 'code',
            title: 'k transactions — O(n·k) time, O(k) space',
            code: `function maxProfit(k, prices) {
  const n = prices.length;
  if (k >= n >> 1) {                      // unlimited in practice
    let profit = 0;
    for (let i = 1; i < n; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
    return profit;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const p of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - p);
      sell[j] = Math.max(sell[j], buy[j] + p);
    }
  }
  return sell[k];
}`,
          },
        ],
      },
      {
        id: 'implementation-state-machine',
        title: 'JavaScript implementation — cooldown',
        blocks: [
          {
            type: 'code',
            title: 'Three variables, one pass',
            code: `function maxProfit(prices) {
  let hold = -Infinity, sold = 0, rest = 0;
  for (const p of prices) {
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
  }
  return Math.max(sold, rest);
}`,
            caption: 'Array destructuring evaluates the whole right side first — a tidy way to use only yesterday\'s values.',
          },
          {
            type: 'dryrun',
            title: 'prices = [1, 2, 3, 0, 2]',
            columns: ['day', 'price', 'hold', 'sold', 'rest'],
            rows: [
              ['start', '—', '-∞', '0', '0'],
              ['0', '1', '-1', '-∞', '0'],
              ['1', '2', '-1', '1', '0'],
              ['2', '3', '-1', '2', '1'],
              ['3', '0', '1', '-1', '2'],
              ['4', '2', '1', '3', '2'],
            ],
            note: 'Answer max(3, 2) = 3: buy 1, sell 2, cooldown, buy 0, sell 2.',
          },
        ],
      },
      {
        id: 'intuition-tree',
        title: 'Core intuition — tree DP',
        blocks: [
          {
            type: 'text',
            md: `On a tree, a subtree only touches the rest of the tree through **its root**. So if each child tells its parent "here is my best answer under each possible situation of my root", the parent can decide without looking deeper.

**House Robber III** (no two directly-linked houses): each node returns \`[rob, skip]\`:

\`\`\`text
rob  = node.val + left.skip + right.skip
skip = max(left.rob, left.skip) + max(right.rob, right.skip)
\`\`\`

**Binary Tree Cameras** (a camera watches itself, its parent and its children; minimise cameras). Three states returned post-order:

| state | meaning |
|---|---|
| 0 | this node is **not covered** yet (its parent must fix it) |
| 1 | covered, **no camera** here |
| 2 | **has a camera** |

Rules, from the bottom up: a null child counts as "covered" (1) so leaves don't get cameras unnecessarily. If any child is 0 → put a camera here (2). Else if any child is 2 → this node is covered (1). Else → not covered (0), let the parent handle it. At the end, if the root is 0 add one camera.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-7',
            question: 'In Binary Tree Cameras, why is it better to put a camera on a leaf\'s **parent** rather than on the leaf?',
            options: [
              'Because leaves cannot hold cameras',
              'A camera on the parent covers the leaf AND the parent AND the grandparent (and a sibling) — it covers a superset of what the leaf camera covers',
              'Because the root must always have a camera',
              'It makes no difference',
            ],
            answer: 1,
            explanation: 'A leaf camera covers only the leaf and its parent. A parent camera covers the leaf, the parent, the parent\'s other child and the grandparent. Never worse, often better — so the greedy/DP places cameras as high as possible, which is exactly what "null children count as covered" achieves.',
            misconceptions: {
              0: 'Leaves can hold cameras; it is simply never better than using the parent.',
              2: 'The root often does not need a camera (e.g. if a child of the root has one).',
              3: 'For the tree 0 → 0 → 0 (a path of 3), leaf cameras need 2 but the middle node needs only 1.',
            },
          },
        ],
      },
      {
        id: 'implementation-tree',
        title: 'JavaScript implementation — tree DP',
        blocks: [
          {
            type: 'code',
            title: 'Binary tree cameras — 3 states',
            code: `function minCameraCover(root) {
  let cameras = 0;
  const NOT_COVERED = 0, COVERED = 1, CAMERA = 2;
  function dfs(node) {
    if (!node) return COVERED;                    // nothing to watch
    const l = dfs(node.left), r = dfs(node.right);
    if (l === NOT_COVERED || r === NOT_COVERED) { cameras++; return CAMERA; }
    if (l === CAMERA || r === CAMERA) return COVERED;
    return NOT_COVERED;                           // parent will cover me
  }
  if (dfs(root) === NOT_COVERED) cameras++;
  return cameras;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Returning a small array \`[rob, skip]\` is idiomatic and cheap; destructure with \`const [a, b] = dfs(child)\`.
- Recursion depth = tree height. Balanced trees are fine; a 10^4-node "linked-list" tree may approach the JS stack limit — use an explicit post-order stack if the constraints allow very skewed trees.
- Memoizing with a \`Map\` keyed by **node objects** works (Maps compare object identity), but returning tuples avoids memo entirely.`,
          },
        ],
      },
      {
        id: 'intuition-interval',
        title: 'Core intuition — interval DP',
        blocks: [
          {
            type: 'text',
            md: `Interval DP answers "what is the best way to process the range \`i..j\`?" by trying every **split point**. The hard part is choosing *which* action to split on.

**Burst Balloons.** Bursting balloon k earns \`left · k · right\` where left/right are its *current* neighbours. Pad the array with 1 at both ends.

- *Think FIRST:* bursting k first changes the neighbours of k−1 and k+1 → the left and right parts now interact. ❌
- *Think LAST:* if k is the last balloon burst strictly between walls i and j, then while everything else in (i, j) is burst, **k is still standing** and separates the two sides. When k finally goes, its neighbours are exactly i and j. ✅

\`\`\`text
dp[i][j] = max over i < k < j of  dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]
\`\`\`

**Minimum Cost to Cut a Stick.** Cutting a piece costs its current length. Sort the cut positions and add 0 and n as walls. For the piece between walls i and j, choose the **first** cut k inside it: it costs \`pos[j] − pos[i]\` and splits into two independent pieces.

\`\`\`text
dp[i][j] = (pos[j] − pos[i]) + min over i < k < j of dp[i][k] + dp[k][j]
\`\`\`

(For the stick "first cut" works because after cutting, the pieces really are separate objects. For balloons "last" is needed because bursting joins neighbours.)`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-8',
            question: 'In the interval DP loop, why do we iterate by **interval length** (short to long) instead of simply `for i … for j …`?',
            options: [
              'It is faster by a constant factor',
              'dp[i][j] needs dp[i][k] and dp[k][j] for shorter intervals; iterating by length guarantees they are already computed',
              'Because lengths are always even',
              'To avoid negative indices',
            ],
            answer: 1,
            explanation: 'Both sub-intervals are strictly shorter than (i, j). Processing all length-2 intervals, then length-3, … ensures every dependency is ready. (Iterating i from high to low and j from low to high also works — any order where shorter intervals come first.)',
            misconceptions: {
              0: 'Order is about correctness. With plain i ascending, dp[k][j] (k > i) has not been computed yet.',
              2: 'Lengths take every value from 2 upward.',
              3: 'Index bounds are handled by the loop limits, regardless of order.',
            },
          },
        ],
      },
      {
        id: 'optimized-interval',
        title: 'Optimized approach — interval DP',
        blocks: [
          {
            type: 'steps',
            title: 'Recipe',
            steps: [
              'Add boundary sentinels (1s for balloons, 0 and n for the stick) so every sub-problem has fixed walls.',
              'Define dp[i][j] over the **open** interval between walls i and j (nothing inside → 0).',
              'Pick the split action: LAST balloon burst / FIRST cut made. Write its cost using only i, k, j.',
              'Iterate by length; inside, try every k strictly between i and j.',
              'Answer dp[0][m − 1].',
            ],
          },
          {
            type: 'reflect',
            prompt: 'Can you explain why "the last balloon" makes the two sides independent but "the first balloon" does not?',
            deeper: 'Independence means: the best way to handle the left side does not depend on what happens on the right side. If k is burst first, then k−1 and k+1 become neighbours, so a balloon on the left may later be multiplied by one on the right — the sides are entangled. If k is burst last, k stands between the sides the whole time, so no left balloon ever neighbours a right balloon. Each side only ever sees its own balloons plus the fixed walls (i and k, or k and j).',
          },
        ],
      },
      {
        id: 'template-interval',
        title: 'Pattern / template — interval DP',
        blocks: [
          {
            type: 'code',
            title: 'Burst balloons — O(n³)',
            code: `function maxCoins(nums) {
  const a = [1, ...nums, 1];
  const m = a.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let len = 2; len < m; len++) {              // j − i
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      for (let k = i + 1; k < j; k++) {            // k is burst LAST inside (i, j)
        dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + a[i] * a[k] * a[j]);
      }
    }
  }
  return dp[0][m - 1];
}`,
          },
        ],
      },
      {
        id: 'implementation-interval',
        title: 'JavaScript implementation — cutting a stick',
        blocks: [
          {
            type: 'code',
            title: 'Only the cut positions matter — O(c³)',
            code: `function minCost(n, cuts) {
  const pos = [0, ...[...cuts].sort((x, y) => x - y), n];   // numeric sort!
  const m = pos.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let len = 2; len < m; len++) {
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      let best = Infinity;
      for (let k = i + 1; k < j; k++) best = Math.min(best, dp[i][k] + dp[k][j]);
      dp[i][j] = best + (pos[j] - pos[i]);
    }
  }
  return dp[0][m - 1];
}`,
            caption: 'n can be 10^6, but only c ≤ 100 cut positions exist — build the DP over cuts, not over every unit of length.',
          },
        ],
      },
      {
        id: 'dry-run-interval',
        title: 'Dry run — burst balloons',
        blocks: [
          {
            type: 'dryrun',
            title: 'nums = [3, 1, 5, 8] → a = [1, 3, 1, 5, 8, 1]',
            columns: ['interval (i, j)', 'best k (last)', 'value'],
            rows: [
              ['(0,2) → {3}', 'k=1', '1·3·1 = 3'],
              ['(1,3) → {1}', 'k=2', '3·1·5 = 15'],
              ['(2,4) → {5}', 'k=3', '1·5·8 = 40'],
              ['(3,5) → {8}', 'k=4', '5·8·1 = 40'],
              ['(1,4) → {1,5}', 'k=3 (5 last)', 'dp[1][3] + dp[3][4] + 3·5·8 = 15 + 0 + 120 = 135'],
              ['(0,5) → all', 'k=4 (8 last)', 'dp[0][4] + dp[4][5] + 1·8·1 = 159 + 0 + 8 = 167'],
            ],
            note: 'dp[0][4] = 159 (burst 1, then 5, then 3 with 8 as the right wall). Final answer 167.',
          },
        ],
      },
      {
        id: 'intuition-bitmask',
        title: 'Core intuition — bitmask DP',
        blocks: [
          {
            type: 'text',
            md: `With n ≤ 20 items, a subset fits in one integer: bit i set ⇔ item i used.

\`\`\`text
items:   3 2 1 0
mask = 0b1011  → items 0, 1 and 3 are used
mask & (1 << 2)  → 0      (item 2 not used)
mask | (1 << 2)  → 0b1111 (add item 2)
\`\`\`

**Partition to K Equal Sum Subsets.** target = total / k. Fill buckets one at a time. \`dp[mask]\` = how full the *current* bucket is after using exactly the items in mask (or -1 if impossible). Adding item i is allowed if \`dp[mask] + nums[i] <= target\`; the new fill is \`(dp[mask] + nums[i]) % target\` (a full bucket resets to 0). Answer: \`dp[full] === 0\`.

Why is \`dp[mask]\` a single number and not a list of bucket sums? Because we fill buckets **in order**: all completed buckets are exactly full, so the only unknown is the current bucket's level — and that equals \`sum(mask) % target\`.

**Shortest Superstring (TSP-style).** \`dp[mask][last]\` = shortest length of a string containing exactly the words in mask, ending with word \`last\`. Appending word \`j\` costs \`len(j) − overlap(last, j)\`. Store the parent to rebuild the string.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-9',
            question: 'What does `if (mask & 1 << i === 0)` actually test in JavaScript?',
            options: [
              'Whether bit i of mask is 0',
              '`mask & ((1 << i) === 0)` — i.e. mask & false, which is always 0, so the branch never runs',
              'Whether mask equals 1 << i',
              'It throws a syntax error',
            ],
            answer: 1,
            explanation: '`===` binds tighter than `&` in JavaScript (and C). So the expression is `mask & (false)` → `mask & 0` → 0 → falsy. Always write `(mask & (1 << i)) === 0`.',
            misconceptions: {
              0: 'That is the intended meaning, but precedence does not work that way. `<<` binds tighter than `===`, which binds tighter than `&`.',
              2: 'Equality to 1 << i would be `mask === (1 << i)`; nothing like that happens here.',
              3: 'It is perfectly valid syntax — which is why the bug is silent.',
            },
          },
        ],
      },
      {
        id: 'template-bitmask',
        title: 'Pattern / template — bitmask DP',
        blocks: [
          {
            type: 'code',
            title: 'Partition to k equal subsets — O(n · 2^n)',
            code: `function canPartitionKSubsets(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % k) return false;
  const target = total / k, n = nums.length, FULL = (1 << n) - 1;
  const dp = new Int32Array(1 << n).fill(-1);    // fill level of current bucket
  dp[0] = 0;
  for (let mask = 0; mask <= FULL; mask++) {
    if (dp[mask] === -1) continue;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) continue;     // already used
      const next = mask | (1 << i);
      if (dp[next] !== -1) continue;             // already reachable
      if (dp[mask] + nums[i] <= target) dp[next] = (dp[mask] + nums[i]) % target;
    }
  }
  return dp[FULL] === 0;
}`,
            caption: 'Masks only grow (next > mask), so increasing mask order processes every state after all its predecessors.',
          },
        ],
      },
      {
        id: 'implementation-bitmask',
        title: 'JavaScript implementation — dp[mask][last] with reconstruction',
        blocks: [
          {
            type: 'code',
            title: 'TSP skeleton with parent pointers',
            code: `const N = 1 << n;
const dp = Array.from({ length: N }, () => new Array(n).fill(Infinity));
const parent = Array.from({ length: N }, () => new Array(n).fill(-1));
for (let i = 0; i < n; i++) dp[1 << i][i] = startCost(i);
for (let mask = 1; mask < N; mask++) {
  for (let last = 0; last < n; last++) {
    if (!(mask & (1 << last)) || dp[mask][last] === Infinity) continue;
    for (let j = 0; j < n; j++) {
      if (mask & (1 << j)) continue;
      const nm = mask | (1 << j), cand = dp[mask][last] + cost[last][j];
      if (cand < dp[nm][j]) { dp[nm][j] = cand; parent[nm][j] = last; }
    }
  }
}
// pick the best last in dp[N - 1][*], then walk parent[][] backwards to rebuild the order`,
          },
        ],
      },
      {
        id: 'intuition-digit',
        title: 'Core intuition — digit DP',
        blocks: [
          {
            type: 'text',
            md: `"How many times does digit 1 appear in all numbers from 0 to n?" For n = 10^9 we cannot loop. Instead we **write numbers digit by digit** from the left, like filling in a form, and count.

**The "tight" idea.** Say n = 2 3 5. We are choosing the digits of some x ≤ 235.
- First digit: we may choose 0, 1 or 2. If we chose 0 or 1, x is already **smaller** than n → every later digit is free (0–9). If we chose 2 we are still **tight**: the next digit is capped at 3.
- Second digit while tight: 0–3. Choosing 3 keeps us tight (third digit ≤ 5); choosing 0–2 frees us.

So the state is \`(pos, tight, …)\`. **Non-tight states repeat a lot** (every free suffix of length L behaves the same) → memoize them. Tight states form a single path — only one per position.

**Direct formula for digit one.** Look at each place value p = 1, 10, 100, … Split n into \`high\` (digits left of p), \`cur\` (the digit at p), \`low\` (digits right of p):

\`\`\`text
count of 1s at place p =
  high · p                           (full cycles of the lower part)
+ (cur > 1 ? p : cur === 1 ? low + 1 : 0)   (the partial last cycle)
\`\`\`

Example n = 13, p = 1: high = 1, cur = 3, low = 0 → 1·1 + 1 = 2 (the 1s in 1 and 11). p = 10: high = 0, cur = 1, low = 3 → 0 + 4 (10, 11, 12, 13). Total 6 ✓.`,
          },
          {
            type: 'checkpoint',
            id: 'dp-advanced-cp-10',
            question: 'n = 4 7 2. We are tight after choosing 4, and now choose the second digit 5. What happens?',
            options: [
              'We stay tight; the third digit is capped at 2',
              'We become non-tight: the prefix 45 is already smaller than 47, so the third digit can be anything from 0 to 9',
              'We stay tight because 5 ≤ 7 was allowed',
              'The number becomes larger than n',
            ],
            answer: 1,
            explanation: 'While tight the cap is n\'s digit (7). Choosing 5 < 7 makes the prefix 45 strictly smaller than 47, so every continuation is ≤ n — we are no longer tight and the next digit ranges over 0–9. tight stays true only when we pick exactly the cap.',
            misconceptions: {
              0: 'We would stay tight only if we picked exactly 7. With 5, the prefix is already smaller than n\'s prefix.',
              2: 'It is the reverse: picking something smaller than the cap RELEASES tightness.',
              3: '45x ≤ 459 < 472, so no continuation exceeds n.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Why is it safe (and useful) to memoize only the non-tight states?',
            deeper: 'A non-tight state (pos, state) means "the remaining digits are completely free" — its answer does not depend on n\'s remaining digits, and many different prefixes lead to it (e.g. 0x, 1x, 2x…). Caching it saves repeated work. A tight state can be reached by exactly one prefix (n\'s own prefix), so it is computed once anyway — caching it gains nothing, and with some memo layouts it would even collide with the free state and give wrong answers.',
          },
        ],
      },
      {
        id: 'template-digit',
        title: 'Pattern / template — digit DP',
        blocks: [
          {
            type: 'code',
            title: 'Count digit 1 in [0, n] with (pos, tight, onesSoFar)',
            code: `function countDigitOne(n) {
  const digits = String(n).split('').map(Number);
  const L = digits.length;
  const memo = new Map();
  function go(pos, tight, ones) {           // returns total 1s over all completions
    if (pos === L) return ones;
    const key = pos + ',' + ones;
    if (!tight && memo.has(key)) return memo.get(key);
    const limit = tight ? digits[pos] : 9;
    let total = 0;
    for (let d = 0; d <= limit; d++) {
      total += go(pos + 1, tight && d === limit, ones + (d === 1 ? 1 : 0));
    }
    if (!tight) memo.set(key, total);
    return total;
  }
  return go(0, true, 0);
}`,
            caption: 'Leading zeros are harmless here because a leading 0 is not a 1. Other properties (e.g. "digits are distinct") need an extra "started" flag.',
          },
        ],
      },
      {
        id: 'implementation-digit',
        title: 'JavaScript implementation — the O(log n) formula',
        blocks: [
          {
            type: 'code',
            title: 'Per-position counting',
            code: `function countDigitOne(n) {
  let count = 0;
  for (let p = 1; p <= n; p *= 10) {
    const high = Math.floor(n / (p * 10));
    const cur = Math.floor(n / p) % 10;
    const low = n % p;
    count += high * p;
    if (cur > 1) count += p;
    else if (cur === 1) count += low + 1;
  }
  return count;
}`,
            caption: 'Use Math.floor, not |0 or >> — n up to ~10^9 · 10 overflows 32-bit bitwise operators.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **LIS:** believing \`tails\` is an actual subsequence; lower vs upper bound for strict vs non-strict.
2. **Envelopes:** sorting equal widths by height ascending — lets same-width envelopes "nest".
3. **Palindromes:** forgetting even-length centers; wrong fill order for \`dp[i][j]\`.
4. **State machine:** \`hold = 0\` initially; updating states in place so one day does two actions.
5. **Tree DP:** greedy "rob the root if it is large"; forgetting the uncovered root in cameras.
6. **Interval DP:** thinking about the FIRST balloon; not iterating by length; missing sentinels.
7. **Bitmask:** operator precedence (\`mask & 1 << i === 0\`); \`Map\` instead of typed arrays for 2^n states.
8. **Digit DP:** tight stays true only when \`d === limit\`; 32-bit overflow with bitwise ops on large n.
9. **\`sort()\` without a comparator** on numbers (cuts, envelopes) — lexicographic!`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'Family-specific',
            space: 'Family-specific',
            md: `| Family | Time | Space |
|---|---|---|
| LIS (DP / patience) | O(n²) / O(n log n) | O(n) |
| Number of LIS | O(n²) | O(n) |
| Palindromic substring (center) | O(n²) | O(1) |
| Palindromic subsequence | O(n²) | O(n²) → O(n) rolling |
| Stock state machine | O(n · states) (k transactions: O(n·k)) | O(states) |
| Tree DP | O(n) | O(height) |
| Interval DP | O(n³) | O(n²) |
| Bitmask (partition) | O(n · 2^n) | O(2^n) |
| Bitmask TSP (superstring) | O(n² · 2^n) | O(n · 2^n) |
| Digit DP | O(digits · states · 10) | O(digits · states) |

**Rule of thumb:** #states × work per state. For interval DP: n² states × n split points. For TSP: 2^n·n states × n next items.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Name the family first**: "this is interval DP — I'll think about the last balloon".
- **Say the state in one sentence** before writing code: "dp[mask][last] is the shortest string covering mask that ends with word last."
- **Draw the state machine** for stock problems; the transitions write themselves.
- For LIS, explain **why tails is sorted** and **why replacing is safe** — that is what interviewers probe.
- For tree DP, say "each subtree returns [rob, skip]; the parent combines them in O(1)".
- For bitmask DP, check the constraint (n ≤ 20) out loud — it justifies 2^n.
- Mention **space optimisation** (rolling rows, O(k) arrays) once the basic DP works.`,
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
              { api: 'Array.from({ length: n }, () => new Array(m).fill(0))', use: '2D DP tables', complexity: 'O(n·m)' },
              { api: '(lo + hi) >> 1', use: 'Midpoint in binary search (safe for array indices)', complexity: 'O(1)' },
              { api: '[a, b, c] = [x, y, z]', use: 'Simultaneous state updates in state-machine DP', complexity: 'O(1)' },
              { api: '1 << i, mask & (1 << i), mask | (1 << i)', use: 'Subset operations (parenthesise!)', complexity: 'O(1)' },
              { api: 'new Int32Array(1 << n)', use: 'Compact memo for bitmask DP', complexity: 'O(2^n)' },
              { api: 'arr.sort((a, b) => a - b)', use: 'Numeric sort for cuts / envelopes', complexity: 'O(n log n)' },
              { api: 'Math.floor(n / p) % 10', use: 'Extract a digit without 32-bit overflow', complexity: 'O(1)' },
              { api: 'String(n).split("").map(Number)', use: 'Digits for digit DP', complexity: 'O(log n)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Increasing subsequences / nesting', 'Palindromes', 'Sequential decisions with modes (stocks)', 'Choose/cover nodes of a tree', 'Burst/cut/merge on a range', 'n ≤ 20 subsets or orders', 'Count numbers ≤ N with a digit property'],
    clues: ['subsequence', 'nest', 'palindrome', 'cooldown', 'fee', 'k transactions', 'binary tree + adjacent', 'cameras', 'burst', 'cut', 'n ≤ 16', 'count numbers up to n'],
    template: `// LIS: tails[lowerBound(tails, x)] = x
// palindrome: dp[i][j] = s[i]===s[j] ? dp[i+1][j-1]+2 : max(dp[i+1][j], dp[i][j-1])
// stock: [hold, sold, rest] = [max(hold, rest-p), hold+p, max(rest, sold)]
// tree: return [rob, skip]
// interval: for len, for i, j=i+len, for k in (i,j): dp[i][j] = best(dp[i][k]+dp[k][j]+cost)
// bitmask: dp[mask | 1<<j][j] = min(..., dp[mask][last] + cost(last, j))
// digit: go(pos, tight, state) with limit = tight ? d[pos] : 9`,
    complexity: 'LIS O(n log n); palindromes O(n²); stocks O(n·k); tree O(n); interval O(n³); bitmask O(2^n·n²); digit O(digits·states·10)',
    mistakes: ['tails is not a subsequence', 'envelope sort (height desc)', 'even centers', 'hold = 0 initialisation', 'first vs last balloon', 'mask precedence', 'tight only if d === limit'],
    jsTools: ['Array.from 2D', 'binary search', 'destructuring updates', 'bitwise ops', 'Int32Array', 'numeric sort'],
  },

  keyConcepts: [
    'LIS: dp[i] ends at i (O(n²)); tails[k] = smallest tail of length k+1 is sorted, so binary search gives O(n log n).',
    'Russian dolls: sort width asc, height desc, then LIS on heights.',
    'Palindromes grow from the center: expand 2n−1 centers, or dp[i][j] from dp[i+1][j−1].',
    'State-machine DP: draw the modes (hold/sold/rest), one transition per arrow, update from yesterday\'s values.',
    'Tree DP: post-order, each node returns a tuple of states ([rob, skip]; 0/1/2 for cameras).',
    'Interval DP: split on the LAST action (burst) or the FIRST cut; iterate by interval length.',
    'Bitmask DP: subsets as integers when n ≤ 20; TSP shape dp[mask][last].',
    'Digit DP: build digits left to right with a tight flag; memoize only free (non-tight) states.',
  ],

  interviewTips: [
    'Name the DP family and state out loud before coding.',
    'For LIS explain why tails stays sorted and why replacing is safe.',
    'Draw the stock state diagram.',
    'Justify 2^n with the constraint for bitmask DP.',
  ],
};
