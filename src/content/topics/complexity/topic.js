export default {
  id: 'complexity',
  summary: 'Estimate how the running time and memory of code grow as the input grows, so you can compare solutions before writing them.',

  jsTools: [
    { api: 'arr.push(x) / arr.pop()', use: 'Add/remove at the end of an array', complexity: 'O(1) amortized' },
    { api: 'arr.shift() / arr.unshift(x)', use: 'Remove/add at the FRONT — every other element moves', complexity: 'O(n)' },
    { api: 'arr.includes(x) / indexOf(x)', use: 'Linear scan of the array', complexity: 'O(n)' },
    { api: '[...arr] / arr.slice()', use: 'Copy an array', complexity: 'O(n) time and space' },
    { api: 'arr.sort((a, b) => a - b)', use: 'Sort numbers (needs a comparator!)', complexity: 'O(n log n)' },
    { api: 'str += piece (in a loop)', use: 'Build a string; may copy — prefer parts.push + join', complexity: 'O(total length) per step in the worst case' },
    { api: 'new Set(arr) / set.has(x)', use: 'Membership checks (Hashing topic)', complexity: 'O(n) build, O(1) average lookup' },
  ],

  patterns: [
    {
      id: 'complexity-loop-counting',
      name: 'Counting Loop Iterations',
      summary: 'Multiply nested loops, add sequential ones, keep only the dominant term and drop constants.',
      whyItExists: 'Exact step counts depend on the machine and engine. What we can reason about precisely is how the NUMBER of basic steps grows with n — and for loops that is just counting how many times the innermost body runs.',
      whenToUse: ['Any code with for/while loops over the input', 'Comparing two candidate solutions before coding', 'Checking a solution fits the constraints'],
      clues: ['nested for loops', 'a loop inside a function called inside a loop', 'two loops one after another', 'loop bounds depending on another loop variable (j = i + 1)'],
      whenNotToUse: ['The loop variable is multiplied/divided rather than incremented → use the halving pattern (log n)', 'The inner pointer never resets → use amortized counting'],
      template: `// Sequential → ADD:   O(n) + O(n)   = O(n)
for (let i = 0; i < n; i++) {}
for (let j = 0; j < n; j++) {}

// Nested → MULTIPLY:  O(n) * O(m)   = O(n·m)
for (let i = 0; i < n; i++)
  for (let j = 0; j < m; j++) {}

// Triangle: j from i+1 → n(n-1)/2 steps = O(n²)
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++) {}`,
      variations: [
        { name: 'Two independent inputs', description: 'Keep both variables: O(n + m) or O(n·m). Do not merge them into a single n.' },
        { name: 'Triangular loops', description: 'j starting at i still gives about n²/2 steps — still O(n²).' },
        { name: 'Hidden inner loops', description: 'Built-ins like includes, indexOf, slice, shift and spread are loops too.' },
      ],
      mistakes: ['Calling a nested loop O(2n) instead of O(n²)', 'Collapsing two different input sizes into one n', 'Ignoring loops hidden inside built-in methods'],
      evolution: {
        easy: 'Single loops, nested loops, sequential loops.',
        medium: 'Loops with hidden built-in costs; two different input sizes; triangle loops.',
        hard: 'Loops whose inner pointer never resets (amortized), or whose bound grows geometrically.',
      },
    },
    {
      id: 'complexity-logarithmic-halving',
      name: 'Halving / Doubling → Logarithms',
      summary: 'If each step multiplies or divides the remaining work by a constant, the number of steps is logarithmic.',
      whyItExists: 'log₂ n answers "how many times can I halve n before reaching 1?". Any loop that shrinks the problem by a constant factor per step runs O(log n) times, which is why binary search and heaps are fast.',
      whenToUse: ['Loop variable is multiplied or divided (i *= 2, n = Math.floor(n / 2))', 'Search space is cut in half each step', 'Counting digits of a number (divide by 10)'],
      clues: ['i *= 2', 'i = Math.floor(i / 2)', 'lo/hi/mid', 'n /= 10 (digit count = log₁₀ n)'],
      whenNotToUse: ['The variable is decreased by a constant (i -= 2) — that is still linear'],
      template: `let steps = 0;
for (let i = 1; i < n; i *= 2) steps++;   // ≈ log₂ n iterations

let x = n;
while (x > 1) { x = Math.floor(x / 2); } // ≈ log₂ n iterations`,
      variations: [
        { name: 'Linear outer, log inner', description: 'for i < n, for j = 1; j < n; j *= 2 → O(n log n).' },
        { name: 'Inner loop bounded by the outer variable', description: 'for (i = n; i > 0; i = i / 2) for (j = 0; j < i; j++) → n + n/2 + n/4 + … = O(n) (geometric series).' },
      ],
      mistakes: ['Thinking i += 2 is logarithmic (it is n/2 = O(n))', 'Forgetting that a geometric series n + n/2 + n/4 … sums to about 2n, i.e. O(n), not O(n log n)'],
      evolution: {
        easy: 'A single halving loop → O(log n).',
        medium: 'Log loop nested inside a linear loop → O(n log n).',
        hard: 'Geometric sums where the inner work shrinks each round → O(n).',
      },
    },
    {
      id: 'complexity-recursion-analysis',
      name: 'Recursion: Call Tree & Stack Depth',
      summary: 'Time = (number of calls) × (work per call); space = maximum depth of the call stack plus any data kept per call.',
      whyItExists: 'Recursive code hides loops inside calls. Drawing the call tree turns "how long does this take?" into "how many nodes does this tree have?", and "how much memory?" into "how tall is it?".',
      whenToUse: ['A function calls itself', 'Estimating memory of DFS-style code', 'Deciding whether memoization is needed'],
      clues: ['function f(n) { … f(n - 1) … }', 'two recursive calls per invocation (branching factor 2)', 'deep recursion on n up to 10^5 (stack overflow risk in JS)'],
      whenNotToUse: ['Loops without recursion — use loop counting'],
      template: `// One call per level, depth n            → O(n) time, O(n) stack
function f(n) { if (n === 0) return 0; return 1 + f(n - 1); }

// Two calls per level, depth n            → O(2^n) time, O(n) stack
function g(n) { if (n <= 1) return n; return g(n - 1) + g(n - 2); }

// Halving, one call per level              → O(log n) time and stack
function h(n) { if (n <= 1) return 0; return 1 + h(Math.floor(n / 2)); }`,
      variations: [
        { name: 'Branching factor b, depth d', description: 'About b^d calls in total.' },
        { name: 'Memoization', description: 'Each distinct argument is computed once: calls ≈ number of distinct states (you will see this in DP).' },
      ],
      mistakes: ['Saying fib recursion is O(n) because depth is n — depth gives SPACE, the number of nodes gives TIME', 'Forgetting the call stack when stating space complexity', 'Passing arr.slice() into each call, adding O(n) per call'],
      evolution: {
        easy: 'Linear recursion (factorial, sum of list).',
        medium: 'Branching recursion (naive Fibonacci) and halving recursion.',
        hard: 'Divide and conquer with work per level (merge sort: log n levels × n work = O(n log n)).',
      },
    },
    {
      id: 'complexity-amortized-analysis',
      name: 'Amortized Analysis',
      summary: 'Average the cost over a whole sequence of operations: rare expensive steps are paid for by many cheap ones.',
      whyItExists: 'Some operations are usually O(1) but occasionally O(n) (a dynamic array growing). Some nested loops look O(n²) but their inner pointer only ever moves forward. Counting the TOTAL work across the run gives the true, tighter bound.',
      whenToUse: ['Dynamic arrays (push)', 'Two pointers that only move forward', 'while loops inside for loops whose variable is never reset'],
      clues: ['array push in a loop', 'inner while loop with a pointer declared OUTSIDE the outer loop', '"each element is pushed and popped at most once"'],
      whenNotToUse: ['When a single operation must be fast every time (real-time systems) — amortized says nothing about the worst single step'],
      template: `// Looks nested, but j is never reset → j moves at most n times IN TOTAL
let j = 0;
for (let i = 0; i < n; i++) {
  while (j < n && cond(i, j)) j++;
}
// total work = n (i) + n (j) = O(n)`,
      variations: [
        { name: 'Doubling array', description: 'Capacity doubles when full: copies total 1 + 2 + 4 + … + n < 2n → O(1) amortized per push.' },
        { name: 'Stack push/pop once', description: 'Monotonic stack: each element pushed once and popped at most once → O(n) total (Stack topic).' },
      ],
      mistakes: ['Multiplying loop bounds when the inner pointer is shared across iterations', 'Confusing amortized O(1) with average-case O(1) (amortized is a guarantee over any sequence, not a probability)'],
      evolution: {
        easy: 'push is O(1) amortized.',
        medium: 'Two-pointer / sliding-window loops that look nested.',
        hard: 'Potential-function arguments (union-find, splay trees) — beyond interviews.',
      },
    },
    {
      id: 'complexity-constraints-to-target',
      name: 'Constraints → Target Complexity',
      summary: 'Read the input limits first; they tell you which complexity the intended solution has.',
      whyItExists: 'A typical judge allows roughly 10^8 simple operations per second (JavaScript is a bit slower — plan for ~10^7–10^8). Plugging n into candidate complexities tells you instantly which ideas are too slow.',
      whenToUse: ['Before choosing an approach', 'When unsure whether brute force is acceptable'],
      clues: ['1 <= n <= 20', 'n <= 10^5', 'n <= 10^9 (cannot even loop over it)'],
      whenNotToUse: ['Real systems where constants and memory dominate — measure instead'],
      template: `n ≤ 10–12      → O(n!)        permutations
n ≤ 20–25      → O(2^n)       subsets / bitmasks
n ≤ 100–500    → O(n³)
n ≤ 2000–5000  → O(n²)
n ≤ 10^5–10^6  → O(n log n) or O(n)
n ≤ 10^9+      → O(log n) or O(1)  (math / binary search)`,
      variations: [{ name: 'Multiple inputs', description: 'n, m ≤ 1000 → O(n·m) = 10^6 is fine; O(n·m·k) with k = 1000 is not.' }],
      mistakes: ['Writing O(n²) for n = 10^5 (10^10 steps — way too slow)', 'Over-engineering when n ≤ 100 and brute force is fine'],
      evolution: {
        easy: 'Map a single n to a complexity.',
        medium: 'Two inputs; recognising that n log n is needed (sorting).',
        hard: 'Values up to 10^9 → binary search on the answer or math, never a loop over values.',
      },
    },
    {
      id: 'complexity-hidden-costs-js',
      name: 'Hidden Costs of JavaScript Built-ins',
      summary: 'One line of JavaScript can be a whole loop. Know the cost of shift, includes, slice, spread, sort and string concatenation.',
      whyItExists: 'Interview code is short, and the expensive part is often a built-in call inside a loop. Recognising these turns an accidental O(n²) into an O(n) solution.',
      whenToUse: ['Any built-in call inside a loop', 'Reviewing a "looks linear" solution that times out'],
      clues: ['queue.shift() in a loop', 'arr.includes(x) in a loop', 'str += inside a loop', '[...acc, x] inside reduce', 'arr.slice() passed to recursion', 'sort inside a loop'],
      whenNotToUse: ['Tiny inputs where clarity matters more than speed'],
      template: `// O(n²) disguised as O(n):
for (const x of a) if (b.includes(x)) out.push(x);   // includes is O(m)
// O(n) instead:
const inB = new Set(b);
for (const x of a) if (inB.has(x)) out.push(x);    // has is O(1) average`,
      variations: [
        { name: 'Queue with shift', description: 'Use an index pointer (head++) or the toolkit Queue instead of shift() → O(1) per dequeue.' },
        { name: 'String building', description: 'Collect pieces in an array and join once at the end.' },
        { name: 'Spread in reduce', description: 'acc.push(x) instead of [...acc, x] — the spread copies the accumulator each time.' },
      ],
      mistakes: ['Assuming every one-liner is O(1)', 'Using shift() for BFS queues on large inputs', 'Copying arrays in every recursive call'],
      evolution: {
        easy: 'includes / indexOf inside loops.',
        medium: 'shift-based queues, string concatenation, spread copies.',
        hard: 'Recursion that slices/copies at every level; sort inside loops.',
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
            md: `**Complexity analysis** answers one question: *"If the input gets bigger, how much slower (or hungrier for memory) does my code get?"*

We do not measure seconds — seconds depend on the laptop, the browser and the JavaScript engine. Instead we **count basic steps** (a comparison, an addition, reading \`arr[i]\`) and ask how that count **grows** with the input size \`n\`.

\`\`\`js
function sum(arr) {
  let total = 0;                 // 1 step
  for (const x of arr) total += x; // n steps
  return total;                  // 1 step
}
// n + 2 steps → grows like n → O(n)
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Input size \`n\`** — how big the input is (array length, string length, number of nodes…).
- **Time complexity** — how the number of steps grows with \`n\`.
- **Space complexity** — how much *extra* memory grows with \`n\` (not counting the input itself, unless stated).
- **Big-O, \`O(f(n))\`** — an *upper bound* on growth: "for large n, the step count is at most a constant × f(n)".
- **Big-Θ (theta)** — a *tight* bound (both upper and lower). In interviews people say "O" but usually mean Θ.
- **Big-Ω (omega)** — a *lower bound*: "at least this much".`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Finding a name in a phone book. Reading page by page from the start: twice as many pages → twice as long (**linear**). Opening in the middle and discarding half each time: twice as many pages → just **one more** step (**logarithmic**). The size of the book matters far less than *how you search it*.',
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-1',
            question: 'Why do we count steps instead of timing code with a stopwatch?',
            options: [
              'Stopwatches are not available in JavaScript',
              'Step counts are always exact while timings are always wrong',
              'Timings depend on the machine and engine; the growth of the step count is a property of the algorithm itself',
              'Because Big-O tells you the exact number of milliseconds',
            ],
            answer: 2,
            explanation: 'The same code runs faster on a newer laptop, but if it is O(n²) it will still get ~4× slower when n doubles — on every machine. Growth is what lets us compare algorithms fairly.',
            misconceptions: {
              0: '`performance.now()` and `console.time` exist. Timing is useful for benchmarking, but it measures one machine, one input.',
              1: 'We deliberately throw away exact counts (constants) — Big-O is about growth, not exactness.',
              3: 'Big-O has no units. O(n) code can take 1 ms or 10 s depending on the constant and the machine.',
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
            md: `Because the difference between growth rates is **enormous** once n is large. Here is roughly how many steps each complexity needs:

| n | log n | n | n log n | n² | 2ⁿ |
|---|---|---|---|---|---|
| 10 | 3 | 10 | 33 | 100 | 1,024 |
| 1,000 | 10 | 1,000 | 10,000 | 1,000,000 | ≈ 10³⁰¹ |
| 100,000 | 17 | 100,000 | 1.7 million | 10 billion | — |

A computer does very roughly **10⁸ simple steps per second** (a JavaScript engine is in the same ballpark, often a little slower). So for n = 100,000, O(n log n) finishes in milliseconds, while O(n²) takes ~100 seconds. That is the difference between *accepted* and *time limit exceeded*.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why an O(n²) solution can be perfectly fine for n = 1,000 but hopeless for n = 100,000?',
            deeper: `n = 1,000 → n² = 10⁶ steps ≈ a few milliseconds. n = 100,000 → n² = 10¹⁰ steps ≈ 100 seconds. Multiplying n by 100 multiplied the work by 100² = 10,000.

This is exactly why interview problems state constraints: they tell you which growth rate is acceptable. "Fast enough" is not a property of an algorithm alone — it is algorithm **plus** input size.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `**Always** — before you write a solution and after you finish it:

1. **Before coding:** read the constraints, pick a target complexity, and reject ideas that are too slow.
2. **While choosing between ideas:** "sort + scan is O(n log n), the hash map idea is O(n) but uses O(n) memory."
3. **After coding:** state the time and space complexity. Interviewers expect this for every solution.

We usually care about the **worst case**, because it is a guarantee:

| Case | Meaning | Example: search for x in an unsorted array |
|---|---|---|
| **Best case** | the luckiest input | x is at index 0 → 1 step, O(1) |
| **Average case** | expected over typical/random inputs | x is somewhere in the middle → ~n/2 steps, O(n) |
| **Worst case** | the unluckiest input | x is last or missing → n steps, O(n) |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Best case is (almost) never the answer',
            md: 'Saying "linear search is O(1) because the target might be first" is a classic interview red flag. Unless asked otherwise, state the **worst case**, and mention average case when it differs meaningfully (e.g. hash maps: O(1) average, O(n) worst; quicksort: O(n log n) average, O(n²) worst).',
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-2',
            question: '`arr.indexOf(x)` on an array of n elements. What should you say its time complexity is?',
            options: [
              'O(1), because x might be the first element',
              'O(log n), because it stops early',
              'O(n²), because it compares every pair',
              'O(n) — in the worst case (x missing or last) it checks every element',
            ],
            answer: 3,
            explanation: 'indexOf is a linear scan. Stopping early helps the best case, but the worst case still touches all n elements.',
            misconceptions: {
              0: 'That is the *best* case. Complexity claims are worst case unless you explicitly say otherwise.',
              1: 'Stopping early does not halve the remaining work each step. O(log n) needs a sorted array and binary search.',
              2: 'indexOf compares x with each element once — n comparisons, not n².',
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
            clues: ['one loop over n → O(n)', 'loop inside loop → multiply', 'loops one after another → add', 'i *= 2 or n /= 2 → log n', 'sort → n log n', 'two recursive calls per level → 2ⁿ', 'built-in call inside a loop → check its cost'],
            conclusion: 'Count how many times the innermost statement runs, as a function of n',
          },
          {
            type: 'text',
            md: `The common complexities, from fastest to slowest:

| Big-O | Name | Typical code |
|---|---|---|
| O(1) | constant | \`arr[i]\`, \`map.get(k)\`, math formula |
| O(log n) | logarithmic | binary search, halving loop |
| O(n) | linear | one pass over the array |
| O(n log n) | linearithmic | sorting, n × (log n work) |
| O(n²) | quadratic | all pairs (nested loops) |
| O(2ⁿ) | exponential | all subsets, naive recursion with 2 branches |
| O(n!) | factorial | all permutations |`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — counting steps and dropping constants',
        blocks: [
          {
            type: 'text',
            md: `Big-O keeps only **what matters when n is huge**. Two simplification rules:

1. **Drop constants.** \`3n + 5\` → \`O(n)\`. Doubling n doubles \`3n + 5\` too; the 3 and the 5 do not change the *shape* of the growth.
2. **Keep only the dominant term.** \`n² + 100n + 1000\` → \`O(n²)\`. At n = 10⁶, n² = 10¹² while 100n = 10⁸ — the smaller terms are noise.

Then combine pieces:

- Code blocks **one after another → add**: O(n) + O(n²) = O(n²).
- Code **inside** a loop → **multiply**: a loop of n doing O(m) work each time = O(n·m).`,
          },
          {
            type: 'compare',
            left: {
              title: 'Sequential — O(n) + O(n) = O(n)',
              code: `for (let i = 0; i < n; i++) doA(i);
for (let j = 0; j < n; j++) doB(j);
// 2n steps → O(n)`,
            },
            right: {
              title: 'Nested — O(n) × O(n) = O(n²)',
              code: `for (let i = 0; i < n; i++)
  for (let j = 0; j < n; j++)
    doAB(i, j);
// n·n steps → O(n²)`,
            },
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-3',
            question: 'A function runs `5n² + 3n log n + 200n + 7` steps. What is its Big-O?',
            options: ['O(n²)', 'O(5n²)', 'O(n² + n log n + n)', 'O(n log n)'],
            answer: 0,
            explanation: 'Drop constants (5, 3, 200, 7) and keep the fastest-growing term. n² beats n log n, which beats n.',
            misconceptions: {
              1: 'Constants are dropped: O(5n²) and O(n²) are the same class. Writing the 5 is not wrong mathematically, but it is non-standard and shows you have not simplified.',
              2: 'Lower-order terms are dropped; for large n they are insignificant compared to n².',
              3: 'n log n grows slower than n² — it cannot be the dominant term here.',
            },
            deeper: 'Why is dropping legal? Big-O means "at most c·f(n) for large n". For n ≥ 1: 5n² + 3n log n + 200n + 7 ≤ 5n² + 3n² + 200n² + 7n² = 215n². So c = 215 and f(n) = n² works. Constants get absorbed into c.',
          },
          {
            type: 'text',
            md: `**Logarithms in one sentence:** \`log₂ n\` is *"how many times can I halve n until I reach 1?"* — log₂ 8 = 3 (8 → 4 → 2 → 1), log₂ 1,000,000 ≈ 20. So any loop that **cuts the remaining work in half** each step runs O(log n) times. The base does not matter in Big-O (log₂ n and log₁₀ n differ only by a constant factor).`,
          },
          {
            type: 'visual',
            scenario: 'binary-search',
            input: { nums: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31], target: 27 },
            caption: '16 elements, about 4 steps: each comparison throws away half of what is left. That is O(log n). (Binary search has its own topic later.)',
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-4',
            question: 'How many times does the body run?\n\n```js\nfor (let i = 1; i < n; i *= 2) { work(); }\n```',
            options: ['About n times', 'About n / 2 times', 'About log₂ n times', 'About √n times'],
            answer: 2,
            explanation: 'i takes the values 1, 2, 4, 8, … and stops once it reaches n. The number of doublings from 1 to n is log₂ n.',
            misconceptions: {
              0: 'That would be true for `i++`. Here i doubles, so it reaches n much faster.',
              1: 'n/2 iterations is what `i += 2` gives. Adding a constant is linear; multiplying by a constant is logarithmic.',
              3: '√n appears when the condition is `i * i < n` with `i++`. Doubling gives log n.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach (and how to measure it)',
        blocks: [
          {
            type: 'text',
            md: 'Complexity is how we compare a brute force with a better idea. Problem: **"does the array contain two numbers that sum to target?"** The simplest correct idea tries every pair.',
          },
          {
            type: 'code',
            title: 'All pairs — O(n²) time, O(1) space',
            code: `function hasPairWithSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {  // every pair once
      if (nums[i] + nums[j] === target) return true;
    }
  }
  return false;
}`,
            caption: 'Inner loop runs (n−1) + (n−2) + … + 1 = n(n−1)/2 times → O(n²).',
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-5',
            question: 'The inner loop starts at `j = i + 1`, so it does fewer iterations than a full n × n loop. Is it still O(n²)?',
            options: [
              'No, it is O(n log n) because the inner loop shrinks',
              'Yes: n(n−1)/2 = n²/2 − n/2, and dropping constants and lower terms leaves n²',
              'No, it is O(n) because each pair is checked once',
              'Yes, but only in the best case',
            ],
            answer: 1,
            explanation: 'Halving the work is a constant factor (½). Constant factors vanish in Big-O, so the triangle loop is still quadratic.',
            misconceptions: {
              0: 'The inner loop shrinks by 1 each time (linearly), not by half. Only halving gives log factors.',
              2: 'There are about n²/2 pairs — checking each once is still quadratic in n.',
              3: 'This is the worst case (no pair found → all pairs checked). The best case is O(1) when the first pair works.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — using complexity to pick a better idea',
        blocks: [
          {
            type: 'text',
            md: `Complexity tells you *what to aim for*. For the pair-sum problem there are two classic improvements:

| Idea | Time | Extra space | Topic |
|---|---|---|---|
| All pairs | O(n²) | O(1) | — |
| Sort, then two pointers from both ends | O(n log n) + O(n) = O(n log n) | O(1)–O(n) | Two Pointers |
| Remember what you have seen in a Set | O(n) average | O(n) | Hashing |

Notice the **time–space trade-off**: the fastest idea uses more memory. Both are valid; the constraints decide.`,
          },
          {
            type: 'code',
            title: 'Sort + scan — O(n log n): add the pieces, keep the biggest',
            code: `function hasPairWithSum(nums, target) {
  const a = [...nums].sort((x, y) => x - y);   // O(n) copy + O(n log n) sort
  let lo = 0, hi = a.length - 1;                // two pointers: O(n) total
  while (lo < hi) {
    const s = a[lo] + a[hi];
    if (s === target) return true;
    if (s < target) lo++; else hi--;
  }
  return false;
}
// O(n) + O(n log n) + O(n) = O(n log n) time, O(n) space for the copy`,
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-6',
            question: 'An algorithm sorts the array (O(n log n)) and then does one linear scan (O(n)). What is the total?',
            options: ['O(n² log n)', 'O(n)', 'O(n log n)', 'O(log n)'],
            answer: 2,
            explanation: 'The steps happen **one after another**, so we add: O(n log n) + O(n). n log n dominates n, so the total is O(n log n).',
            misconceptions: {
              0: 'Multiplying is only for work done *inside* another loop. The scan happens after the sort, not inside it.',
              1: 'The scan is linear, but the sort before it costs more — the slowest step dominates.',
              3: 'Nothing here is sub-linear; just reading the array is already O(n).',
            },
          },
        ],
      },
      {
        id: 'intuition-amortized',
        title: 'Amortized analysis — cheap on average over a sequence',
        blocks: [
          {
            type: 'text',
            md: `A JavaScript array is a **dynamic array**: it reserves some capacity; \`push\` writes into the next free slot (O(1)). When the capacity is full, the engine allocates a bigger block (typically ~1.5–2× larger) and **copies everything** — O(n) for that one push.

So is \`push\` O(n)? Look at the total over n pushes with doubling capacity: copies cost 1 + 2 + 4 + … + n < 2n. Spread over n pushes, that is **< 2 copies per push → O(1) amortized**.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Amortized vs average',
            md: '- **Amortized O(1)**: *any* sequence of k operations costs O(k) in total — a hard guarantee, no luck involved.\n- **Average O(1)**: expected over random inputs (e.g. hash maps with a good hash function) — a bad input could still be slow.',
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Buying a monthly transit pass: one day you pay a lot, every other day you pay nothing. Your cost *per ride*, averaged over the month, is small — even though one day was expensive.',
          },
          {
            type: 'text',
            md: 'The same idea explains loops that **look** nested but are linear: if the inner pointer is **never reset**, it can only move forward n times in total across the whole run.',
          },
          {
            type: 'code',
            title: 'Looks O(n²), is O(n)',
            code: `let j = 0;                         // declared OUTSIDE the outer loop
for (let i = 0; i < n; i++) {
  while (j < n && nums[j] < nums[i] + k) j++;  // j never goes back
  // ...
}
// i moves n times, j moves at most n times in total → O(n)`,
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-7',
            question: 'You push n items one by one into an empty JavaScript array. What is the total time?',
            options: [
              'O(n²), because some pushes copy the whole array',
              'O(n log n), because the array doubles log n times',
              'O(1), because push is O(1)',
              'O(n): rare resizes cost 1 + 2 + 4 + … < 2n in total, so each push is O(1) amortized',
            ],
            answer: 3,
            explanation: 'Resizes are geometric: each one is twice the previous but half as frequent. The total copying is bounded by ~2n, so n pushes are O(n).',
            misconceptions: {
              0: 'Only a few pushes copy (log n of them), and the copies get bigger geometrically — their sum is < 2n, not n².',
              1: 'There are log n resizes, but they do not each cost n. Their costs are 1, 2, 4, …, n which sum to < 2n.',
              2: 'One push is O(1) amortized, but n pushes are n × O(1) = O(n).',
            },
          },
        ],
      },
      {
        id: 'intuition-space',
        title: 'Space complexity — including the call stack',
        blocks: [
          {
            type: 'text',
            md: `**Space complexity** counts *extra* memory that grows with n:

- New arrays, Maps, Sets, strings you build → count their size.
- A handful of variables (\`i\`, \`sum\`, \`best\`) → O(1).
- **Recursion uses memory too.** Every call that has not returned yet sits on the **call stack** with its own variables. Maximum simultaneous depth d → O(d) space.

\`\`\`js
function sumTo(n) {           // sumTo(5) → sumTo(4) → … → sumTo(0)
  if (n === 0) return 0;      // at the deepest point, 6 calls are waiting
  return n + sumTo(n - 1);    // → O(n) stack space, even with no arrays
}
\`\`\``,
          },
          { type: 'visual', scenario: 'recursion-tree', caption: "The recursion tree shows the time; the deepest root-to-leaf path shows the stack space." },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript stack limit',
            md: 'JS engines allow roughly 10,000 nested calls (it varies by engine and frame size). Recursion with depth 10⁵ throws **RangeError: Maximum call stack size exceeded**. For deep inputs, convert recursion to a loop with an explicit stack.',
          },
          {
            type: 'text',
            md: `For recursion **time**, count the nodes of the **call tree**; for recursion **space**, measure its **height**. Naive Fibonacci makes two calls per level:

\`\`\`text
                fib(4)
             /         \\
        fib(3)          fib(2)
        /    \\          /    \\
    fib(2)  fib(1)  fib(1)  fib(0)
    /    \\
 fib(1) fib(0)
\`\`\`

The tree has roughly 2ⁿ nodes (time O(2ⁿ)) but is only n levels tall (space O(n)).`,
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-8',
            question: 'Naive recursive `fib(n)` (calls fib(n−1) and fib(n−2)) has what time and space complexity?',
            options: [
              'O(n) time, O(n) space',
              'O(2ⁿ) time, O(n) space',
              'O(2ⁿ) time, O(2ⁿ) space',
              'O(n²) time, O(1) space',
            ],
            answer: 1,
            explanation: 'Time = number of nodes in the call tree ≈ 2ⁿ (more precisely ~1.618ⁿ). Space = the deepest chain of pending calls = n, because the left branch finishes and frees its frames before the right branch starts.',
            misconceptions: {
              0: 'The depth is n, but the *number* of calls explodes — fib(n−2) is recomputed inside fib(n−1) and again directly.',
              2: 'Calls do not all exist at the same time. Only one root-to-leaf path is on the stack at any moment.',
              3: 'The call tree roughly doubles each level — exponential, not quadratic. And the stack is not O(1).',
            },
            deeper: 'Memoizing (caching fib(k) the first time it is computed) cuts time to O(n) — each k is computed once. You will do this in the Dynamic Programming topic.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why time uses the whole call tree but space only uses its height?',
            deeper: 'Time adds up **all** work ever done — every node of the tree runs once. Memory is only held by calls that are **still waiting** for a result. When a call returns, its stack frame is freed and reused. At any moment, the waiting calls form a single path from the root to the current node, so the maximum memory is the length of the longest path — the height.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template — constraints → target complexity',
        blocks: [
          {
            type: 'text',
            md: `Read the constraints **first**. With ~10⁸ simple operations per second (plan for a bit less in JavaScript), this table tells you what the intended solution looks like:

| Max n | Target | Typical technique |
|---|---|---|
| ≤ 10–12 | O(n!) | try all permutations |
| ≤ 20–25 | O(2ⁿ) or O(2ⁿ · n) | all subsets, bitmask DP |
| ≤ 100–500 | O(n³) | triple loops, Floyd–Warshall, interval DP |
| ≤ 2,000–5,000 | O(n²) | all pairs, 2-D DP |
| ≤ 10⁵–10⁶ | O(n log n) or O(n) | sorting, heaps, hashing, two pointers, sliding window |
| ≤ 10⁹ or more | O(log n) or O(1) | binary search, math formula |`,
          },
          {
            type: 'steps',
            title: 'How to analyse any piece of code',
            steps: [
              'Identify the input size variables (n, m, length of a string, number of nodes…). Keep different inputs separate.',
              'For each loop, count iterations: `i++` up to n → n; `i *= 2` → log n; pointer never reset → amortized.',
              'Multiply nested work, add sequential work.',
              'Expand every built-in call to its real cost (shift, includes, slice, spread, sort, +=).',
              'For recursion: time = number of calls × work per call; space = max depth (+ data per frame).',
              'Drop constants and lower-order terms. State time AND space.',
            ],
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-9',
            question: 'Constraints say `1 <= nums.length <= 10^5`. Which target should you aim for?',
            options: ['O(n²)', 'O(2ⁿ)', 'O(n³)', 'O(n log n) or better'],
            answer: 3,
            explanation: 'n log n ≈ 1.7 × 10⁶ steps — instant. n² = 10¹⁰ — far too slow. So the intended solution is sorting-based, hashing-based or a linear scan.',
            misconceptions: {
              0: 'n² = 10¹⁰ operations would take on the order of 100 seconds. Typical limits are 1–2 seconds.',
              1: '2^100000 is a number with ~30,000 digits. Exponential only works for n around 20.',
              2: 'n³ = 10¹⁵ — impossible.',
            },
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation — hidden costs of built-ins',
        blocks: [
          {
            type: 'text',
            md: `Many single lines of JavaScript are loops in disguise. Put one inside another loop and your O(n) becomes O(n²):

| Operation | Cost | Why |
|---|---|---|
| \`arr[i]\`, \`arr.length\`, \`push\`, \`pop\` | O(1) (push amortized) | direct slot access / end of the array |
| \`shift()\`, \`unshift(x)\`, \`splice(0, 0, x)\` | O(n) | every other element must move one slot |
| \`includes\`, \`indexOf\`, \`find\`, \`some\` | O(n) | linear scan |
| \`slice()\`, \`[...arr]\`, \`concat\`, \`Array.from\` | O(n) | creates a full copy |
| \`sort\` | O(n log n) | comparison sort |
| \`str + str\`, \`str.slice\`, \`str.split\` | O(length) | strings are immutable; new strings are created |
| \`set.has\`, \`map.get\` | O(1) average | hashing (next topics) |`,
          },
          {
            type: 'compare',
            left: {
              title: 'Queue with shift — O(n²) total',
              code: `const queue = [...items];
while (queue.length) {
  const x = queue.shift(); // O(n) each time
  process(x);
}`,
            },
            right: {
              title: 'Queue with a head index — O(n) total',
              code: `const queue = [...items];
let head = 0;
while (head < queue.length) {
  const x = queue[head++]; // O(1)
  process(x);
}`,
            },
          },
          {
            type: 'compare',
            left: {
              title: 'Spread in reduce — O(n²)',
              code: `const out = arr.reduce(
  (acc, x) => [...acc, x * 2], // copies acc every step
  []
);`,
            },
            right: {
              title: 'Push — O(n)',
              code: `const out = [];
for (const x of arr) out.push(x * 2);
// or simply: arr.map(x => x * 2)`,
            },
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'String building',
            md: 'JavaScript strings are **immutable**: `s += piece` conceptually creates a new string. Modern engines optimise simple appends with "rope" structures, so it is often fast in practice — but you cannot rely on it (reading characters or slicing can force a flatten, i.e. a copy). The safe, always-linear way is `const parts = []; parts.push(piece); …; parts.join("")`.',
          },
          {
            type: 'checkpoint',
            id: 'complexity-cp-10',
            question: 'What is the time complexity?\n\n```js\nfunction common(a, b) {        // a.length = n, b.length = m\n  const out = [];\n  for (const x of a) if (b.includes(x)) out.push(x);\n  return out;\n}\n```',
            options: ['O(n + m)', 'O(n)', 'O(n · m)', 'O(m log n)'],
            answer: 2,
            explanation: '`b.includes(x)` scans b — O(m) — and it runs once for each of the n elements of a. Nested work multiplies: O(n·m). Building `new Set(b)` first makes each lookup O(1) average → O(n + m).',
            misconceptions: {
              0: 'O(n + m) is what you get *after* replacing includes with a Set lookup. includes itself is a loop.',
              1: 'The loop over a is only half the story: each iteration does O(m) work inside includes.',
              3: 'Nothing is sorted or halved here, so no logarithm appears.',
            },
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — counting steps by hand',
        blocks: [
          {
            type: 'text',
            md: `Let us count exactly how many times \`work()\` runs, for n = 8:

\`\`\`js
for (let i = n; i >= 1; i = Math.floor(i / 2)) {
  for (let j = 0; j < i; j++) work();
}
\`\`\``,
          },
          {
            type: 'dryrun',
            title: 'Outer loop halves, inner loop runs i times',
            columns: ['outer i', 'inner iterations', 'running total'],
            rows: [
              ['8', '8', '8'],
              ['4', '4', '12'],
              ['2', '2', '14'],
              ['1', '1', '15'],
            ],
            note: 'Total = 8 + 4 + 2 + 1 = 15 < 2n. A geometric series is dominated by its first term → O(n), NOT O(n log n).',
          },
          {
            type: 'reflect',
            prompt: 'Why is this O(n) even though the outer loop runs log n times and the inner loop can run up to n times?',
            deeper: '"log n iterations × up to n each" is a valid *upper bound* (O(n log n)), but it is not tight — most outer iterations do far less than n work. Adding the actual amounts: n + n/2 + n/4 + … ≤ 2n. Whenever the work per round shrinks by a constant factor, the total is a constant multiple of the first round. Compare with `for i < n; for (j = 1; j < n; j *= 2)` where EVERY outer iteration does log n work → genuinely O(n log n).',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Merging different inputs** — two arrays of sizes n and m give O(n + m) or O(n·m), not O(n) or O(n²).
2. **Ignoring built-in costs** — \`shift\`, \`includes\`, \`indexOf\`, \`slice\`, spread and \`sort\` are not O(1).
3. **Calling nested loops O(n²) automatically** — check whether the inner pointer resets (amortized O(n)).
4. **Thinking \`i += 2\` is logarithmic** — adding a constant is linear; *multiplying* is logarithmic.
5. **Forgetting recursion stack space** — a recursive DFS on a path-shaped input uses O(n) stack.
6. **Confusing depth with call count** in recursion — depth → space, number of calls → time.
7. **Quoting the best case** — interviewers expect worst case (plus average case when it differs, e.g. hash maps).
8. **Forgetting output size** — returning all n² pairs or all 2ⁿ subsets costs at least that much just to write them.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
            space: 'Extra memory: data structures you create + recursion depth',
            md: 'Always report both. When they trade off (hash map: O(n) time with O(n) space vs sort-based O(n log n) with O(1) extra), say so and let the constraints decide.',
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Read constraints out loud** and name a target: "n is up to 10⁵, so I need O(n log n) or better."
- **State complexity for every solution** you propose, brute force included — it shows *why* you are optimising.
- **Name your variables**: "O(n·m) where n is the number of words and m their average length."
- **Mention hidden costs** you avoided: "I use an index pointer instead of \`shift()\` so the queue is O(1) per pop."
- **Give space too**, including the recursion stack.
- **Mention average vs worst case** for hash maps and quicksort-style algorithms.`,
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
              { api: 'arr[i], arr.length', use: 'Direct access', complexity: 'O(1)' },
              { api: 'push / pop', use: 'Stack operations at the end', complexity: 'O(1) amortized' },
              { api: 'shift / unshift / splice', use: 'Front or middle edits — elements move', complexity: 'O(n)' },
              { api: 'includes / indexOf / find', use: 'Linear search', complexity: 'O(n)' },
              { api: 'slice / [...arr] / concat', use: 'Copies', complexity: 'O(n) time and space' },
              { api: 'sort((a, b) => a - b)', use: 'Numeric sort', complexity: 'O(n log n)' },
              { api: 'parts.push(p); parts.join("")', use: 'Linear string building', complexity: 'O(total length)' },
              { api: 'console.time / performance.now()', use: 'Benchmark to confirm your analysis', complexity: '—' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Before choosing an approach (constraints → target)', 'After writing a solution (state time + space)', 'Comparing brute force vs optimized'],
    clues: ['nested loops → multiply', 'sequential → add', 'i *= 2 → log n', 'sort → n log n', '2 recursive calls → 2ⁿ', 'pointer never reset → amortized O(n)', 'built-in inside a loop → expand its cost'],
    template: `n ≤ 12 → n!   n ≤ 25 → 2ⁿ   n ≤ 500 → n³
n ≤ 5000 → n²   n ≤ 10^6 → n log n / n   n ≤ 10^9 → log n / 1`,
    complexity: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
    mistakes: ['merging n and m', 'shift/includes/slice/spread are O(n)', 'i += 2 is still linear', 'forgetting the recursion stack', 'quoting best case'],
    jsTools: ['push/pop O(1)', 'shift O(n)', 'includes O(n)', 'slice/spread O(n)', 'sort O(n log n)', 'join over +='],
  },

  keyConcepts: [
    'Big-O describes how step count grows with input size, ignoring constants and lower-order terms.',
    'Sequential code adds; nested code multiplies; halving gives log n.',
    'Worst case is the default; average case matters for hashing and quicksort.',
    'Amortized analysis bounds the total over a sequence (push is O(1) amortized; never-reset pointers are linear overall).',
    'Space includes created data structures and the recursion stack depth.',
    'Constraints reveal the intended complexity (n ≤ 10^5 ⇒ O(n log n) or better).',
    'Many JavaScript built-ins (shift, includes, slice, spread, sort) are loops in disguise.',
  ],

  interviewTips: [
    'Translate constraints into a target complexity before designing.',
    'State time and space for every solution, including the brute force.',
    'Call out hidden built-in costs you avoided.',
  ],
};
