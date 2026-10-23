export default {
  id: 'recursion',
  summary: 'Solve a problem by assuming you can already solve a smaller copy of it, then add the one step that turns the smaller answer into the full answer — with a base case that stops the chain.',

  jsTools: [
    { api: 'function f(n) { … f(n - 1) … }', use: 'A function that calls itself; each call gets its own local variables (its own stack frame)', complexity: 'O(1) overhead per call, O(depth) stack memory' },
    { api: 'RangeError: Maximum call stack size exceeded', use: 'What JS throws when recursion is too deep (≈ 7k–10k frames in V8, depends on frame size)', complexity: '—' },
    { api: 'BigInt (10n, a * b % MOD)', use: 'Exact modular multiplication when a · b can exceed 2^53', complexity: 'slower than Number, but exact' },
    { api: 'Number.MAX_SAFE_INTEGER', use: '2^53 − 1: the largest integer a Number can represent exactly', complexity: '—' },
    { api: 'Map (memo)', use: 'Cache results of repeated sub-calls (preview of Dynamic Programming)', complexity: 'O(1) average per lookup' },
    { api: 'x >> 1, n % 2, n & 1', use: 'Halving and parity checks in fast exponentiation (careful: >> works on 32-bit ints only)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'recursion-reduce-and-trust',
      name: 'Recursion — Reduce by One & Trust the Call',
      summary: 'Answer(n) is built from Answer(n − 1) (or from a slightly smaller input) plus O(1) work; the base case handles the smallest input directly.',
      whyItExists: 'Many problems are defined in terms of themselves: n! = n · (n−1)!, reversing s = last char + reverse(rest), the Josephus survivor of n people = survivor of n − 1 people shifted by k. Writing the relation directly as code is shorter and easier to prove correct (by induction) than inventing a loop.',
      whenToUse: [
        'The problem has an obvious "one step smaller" version (n − 1 people, the string without its first/last char, the number divided by 2)',
        'You can state: "if I already had the answer for the smaller input, I could finish in O(1)"',
        'The recursion depth is small enough for the JS call stack (depth ≲ a few thousand)',
      ],
      clues: ['a recurrence is given ("F(n) = F(n−1) + F(n−2)")', '"eliminate every k-th person"', 'reverse / palindrome check on a shrinking range', '"is n a power of …"', 'the input is defined recursively'],
      whenNotToUse: [
        'Depth can reach 10^5 or more → an iterative loop (or explicit stack) is safer in JavaScript',
        'The same sub-call is repeated many times (like naive Fibonacci) → add memoization or use DP',
      ],
      template: `function solve(n) {
  if (n <= BASE) return baseAnswer(n);   // 1. base case: small enough to answer directly
  const smaller = solve(n - 1);          // 2. leap of faith: trust this is correct
  return combine(n, smaller);            // 3. one step of work turns it into the answer for n
}`,
      variations: [
        { name: 'Shrink from both ends', description: 'reverse(l, r): swap s[l], s[r], then reverse(l + 1, r − 1). Base case l >= r.' },
        { name: 'Recurrence with index shift', description: 'Josephus: J(n) = (J(n − 1) + k) % n — the smaller answer is re-labelled to fit the bigger problem.' },
        { name: 'Two recursive calls', description: 'fib(n) = fib(n−1) + fib(n−2) — correct but exponential without memoization.' },
      ],
      mistakes: [
        'Missing or unreachable base case → infinite recursion → RangeError',
        'Recursing on an input that is not actually smaller (e.g. n/2 on a negative odd number that never reaches the base case)',
        'Forgetting to return the recursive result (the function then returns undefined)',
        'Using recursion with depth 10^5 in JS — V8 has no tail-call optimisation',
      ],
      evolution: {
        easy: 'Direct recurrences: factorial, Fibonacci, power of two, reverse a string.',
        medium: 'You must discover the recurrence yourself and re-map indices (Josephus, k-th symbol).',
        hard: 'The recurrence is on structure rather than size (nested expressions, balanced strings).',
      },
    },
    {
      id: 'recursion-halving',
      name: 'Recursion — Halve the Problem (Fast Exponentiation)',
      summary: 'Reduce size n to n/2 with O(1) extra work, giving O(log n) depth and time. The classic example is x^n = (x^(n/2))² (times x if n is odd).',
      whyItExists: 'Multiplying x by itself n times is O(n) — hopeless for n = 2^31 or 10^15. Because x^n = x^(n/2) · x^(n/2), one sub-result can be computed once and squared, halving the exponent each level. log2(10^15) ≈ 50 levels.',
      whenToUse: [
        'Huge exponents or counts (n up to 10^9 … 10^18)',
        'The answer for n can be computed from the answer for ⌊n/2⌋',
        'Row n of a doubling structure depends on row n − 1 at position ⌈k/2⌉ (K-th symbol)',
      ],
      clues: ['"x raised to the power n"', 'n up to 2^31 or 10^15', '"return the answer modulo 10^9 + 7"', 'each row/level doubles the previous one'],
      whenNotToUse: [
        'n is small and a loop is clearer',
        'The combine step is not associative / cannot reuse the half result',
      ],
      template: `function power(x, n) {        // n >= 0
  if (n === 0) return 1;         // base case
  const half = power(x, Math.floor(n / 2)); // compute ONCE
  return n % 2 === 0 ? half * half : half * half * x;
}`,
      variations: [
        { name: 'Negative exponent', description: 'x^(−n) = 1 / x^n. Flip x once at the top, then use the positive exponent.' },
        { name: 'Modular power', description: 'Keep every product reduced mod M. In JS use BigInt, because (10^9)² ≈ 10^18 > 2^53 and Number multiplication silently loses precision.' },
        { name: 'Doubling structures', description: 'K-th Symbol in Grammar: symbol k of row n is derived from symbol ⌈k/2⌉ of row n − 1.' },
      ],
      mistakes: [
        'Calling power(x, n/2) TWICE instead of storing it — that brings the time back to O(n)',
        'Using Math.abs(n) with n >> 1 on huge n: bit operators truncate to 32-bit signed ints',
        'Computing a * b % MOD with Numbers when a, b ≈ 10^9 — the product is inexact above 2^53',
      ],
      evolution: {
        easy: 'Integer power with small non-negative exponent.',
        medium: 'Negative exponents, floating-point base, modular arithmetic with BigInt.',
        hard: 'Matrix exponentiation (Fibonacci in O(log n)) — same idea with matrices.',
      },
    },
    {
      id: 'recursion-divide-conquer',
      name: 'Recursion — Divide & Conquer on Split Points',
      summary: 'Try every way to split the input into a left and a right part, solve both parts recursively, and combine every left result with every right result.',
      whyItExists: 'When the last operation applied can be any of several split points (the operator evaluated last, the root of a tree), the full answer is the union over all choices of that split. Each side is an independent, smaller instance of the same problem.',
      whenToUse: [
        '"Return all possible results / all ways to group / parenthesize"',
        'Choosing a split point leaves two independent sub-problems',
        'Input is small (outputs can be exponential — Catalan numbers)',
      ],
      clues: ['"all possible ways to add parentheses"', '"all structurally unique trees"', '"for each operator, split"', 'answer is a list of all outcomes'],
      whenNotToUse: [
        'Only one optimal value is needed and sub-problems repeat heavily → DP over intervals is more efficient',
        'The two halves are not independent',
      ],
      template: `function allResults(parts) {
  if (isAtomic(parts)) return [value(parts)];       // base case
  const out = [];
  for (const split of splitPoints(parts)) {
    const left = allResults(leftOf(parts, split));   // leap of faith
    const right = allResults(rightOf(parts, split));
    for (const a of left) for (const b of right) out.push(combine(a, b, split));
  }
  return out;
}`,
      variations: [
        { name: 'Split on operators', description: 'Different Ways to Add Parentheses: every operator can be the last one evaluated.' },
        { name: 'Split in the middle', description: 'Merge sort / count inversions (next topic): always split at mid, combine by merging.' },
        { name: 'Memoized split', description: 'Cache results by substring or (i, j) to avoid recomputing identical sub-expressions.' },
      ],
      mistakes: [
        'Forgetting the base case where the expression is a single number (possibly multi-digit)',
        'Parsing numbers digit by digit and splitting "12" into 1 and 2',
        'Deduplicating results — the problem wants every grouping, duplicates included',
      ],
      evolution: {
        easy: 'Split in the middle, combine two values (max of array, sum of array).',
        medium: 'Enumerate all split points and cross-combine all results.',
        hard: 'Split by structure (balanced mountains in Special Binary String) and combine with sorting.',
      },
    },
    {
      id: 'recursion-game-minimax',
      name: 'Recursion — Two-Player Games (Score Difference / Minimax)',
      summary: 'Let best(state) = the largest (my score − opponent score) the player to move can force. Try each move: gain − best(stateAfterMove), because after my move the opponent becomes "the player to move".',
      whyItExists: 'In zero-sum games both players play optimally. Tracking two scores is messy; tracking the difference turns "they maximise theirs" into "they maximise the same function from their side", so one recursive function serves both players.',
      whenToUse: [
        '"Both players play optimally" / "predict whether player 1 wins"',
        'Players alternately take from the ends of an array, or remove stones, etc.',
        'The state is small enough to recurse (n ≤ 20 plain, or memoize for bigger n)',
      ],
      clues: ['"play optimally"', '"player 1 and player 2 take turns"', '"can the first player win"', '"from either end of the array"'],
      whenNotToUse: [
        'The game is not zero-sum or has hidden information',
        'State space is huge without overlapping sub-states → look for a math/parity shortcut',
      ],
      template: `// diff(i, j) = best (current player − other player) on nums[i..j]
function diff(nums, i, j) {
  if (i === j) return nums[i];                 // only one pick left
  const takeLeft = nums[i] - diff(nums, i + 1, j);
  const takeRight = nums[j] - diff(nums, i, j - 1);
  return Math.max(takeLeft, takeRight);
}`,
      variations: [
        { name: 'Win / lose states', description: 'A state is winning if some move leads to a losing state for the opponent (Nim-like games).' },
        { name: 'Memoized interval game', description: 'Cache diff(i, j) → O(n²) states; this becomes interval DP (Stone Game).' },
      ],
      mistakes: [
        'Adding the opponent\'s best instead of subtracting it',
        'Treating the opponent as greedy instead of optimal',
        'Forgetting that a tie counts as a win for player 1 in Predict the Winner (diff >= 0)',
      ],
      evolution: {
        easy: 'Parity arguments (Nim with one pile).',
        medium: 'Take from either end, predict the winner (minimax on intervals).',
        hard: 'Multi-pile / multi-move games with memoized state (Stone Game II/III) — DP topic.',
      },
    },
    {
      id: 'recursion-descent-parsing',
      name: 'Recursion — Nested Structure (Recursive Descent)',
      summary: 'When the input nests (expressions inside parentheses, balanced blocks inside blocks), write one function that handles one level and calls itself for each nested part.',
      whyItExists: 'Nesting depth is unknown in advance, so fixed loops cannot follow it. The call stack naturally remembers "where I was" in the outer level while an inner level is processed — the same job an explicit stack does in the Stack topic.',
      whenToUse: [
        'The grammar is recursive: expr = "!(expr)" | "&(expr,expr,…)" | "t" | "f"',
        'The string decomposes into balanced blocks, each of which has the same structure inside',
      ],
      clues: ['"parse", "evaluate the expression"', 'nested parentheses of arbitrary depth', '"special / balanced / valid" strings defined recursively', '"a b-string is 1 + b-string + 0"'],
      whenNotToUse: [
        'Nesting can be ~10^5 deep → use an explicit stack to avoid RangeError',
        'The expression is flat (no nesting) → a single loop is enough',
      ],
      template: `function parse(s) {
  let i = 0;                      // shared cursor, advanced by every level
  function expr() {
    const c = s[i++];
    if (isAtom(c)) return atomValue(c);
    i++;                          // skip '('
    const parts = [];
    while (s[i] !== ')') {
      parts.push(expr());         // recursive call handles one nested expression
      if (s[i] === ',') i++;
    }
    i++;                          // skip ')'
    return apply(c, parts);
  }
  return expr();
}`,
      variations: [
        { name: 'Shared cursor', description: 'A closure variable i that every recursive call advances — no substring copies.' },
        { name: 'Split into balanced blocks', description: 'Scan with a balance counter; each time it returns to 0 you have one top-level block; recurse inside it.' },
      ],
      mistakes: [
        'Passing substrings (s.slice) to every call → O(n²) copying',
        'Forgetting to consume the closing parenthesis, so the parent level sees it',
        'Short-circuiting && / || too early and leaving part of the input unparsed (the cursor gets out of sync)',
      ],
      evolution: {
        easy: 'Evaluate nested parentheses depth / balanced check (Stack topic).',
        medium: 'Decode strings like "3[a2[c]]" with recursion.',
        hard: 'Full expression parsing with operators and nesting; structural recursion with sorting (Special Binary String).',
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
            md: `**Recursion** is when a function solves a problem by calling **itself** on a smaller version of the same problem.

Take "add up the numbers from 1 to n". You could loop. Or you could notice:

\`\`\`text
sum(5) = 5 + sum(4)
sum(4) = 4 + sum(3)
...
sum(1) = 1            ← small enough to just know
\`\`\`

Written as code:

\`\`\`js
function sum(n) {
  if (n === 1) return 1;     // base case
  return n + sum(n - 1);     // recursive case
}
\`\`\`

Every recursive function has exactly these two ingredients:

1. A **base case** — an input so small you answer it directly, without recursing.
2. A **recursive case** — an answer built from the answer of a **strictly smaller** input.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Base case** — the input(s) where the function returns without calling itself. It *stops* the recursion.
- **Recursive case** — the branch that calls the function again on a smaller input.
- **Recurrence** — the math rule behind it, e.g. \`S(n) = n + S(n − 1)\`, \`S(1) = 1\`.
- **Stack frame** — the memory a single call uses (its parameters, local variables and "where to return to").
- **Recursion depth** — the largest number of calls that are "open" (started but not finished) at the same time.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'You are in a long queue at a cinema and want to know your position. You ask the person in front: "What is your position?" They ask the person in front of them, and so on. The first person in the line *knows* they are #1 (base case). The answers travel back: "I am 1" → "then I am 2" → … → you add 1 to whatever you were told. Nobody needed to see the whole queue.',
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-1',
            question: 'What happens when you call this function with `n = 3`?\n\n```js\nfunction countDown(n) {\n  console.log(n);\n  countDown(n - 1);\n}\n```',
            options: [
              'It prints 3, 2, 1 and stops',
              'It prints 3, 2, 1, 0 and stops',
              'It prints 3, 2, 1, 0, −1, … until JavaScript throws RangeError: Maximum call stack size exceeded',
              'It prints nothing because the function calls itself before returning',
            ],
            answer: 2,
            explanation: 'There is **no base case**, so nothing ever stops the chain. Each call waits for the next one, the stack fills up and the engine throws a `RangeError`. Fix: `if (n === 0) return;` before recursing.',
            misconceptions: {
              0: 'Nothing in the code says "stop at 1". A function does not stop recursing just because the numbers "feel done" — only an explicit base case stops it.',
              1: 'Zero is not special unless you make it special. After 0 it happily calls countDown(−1).',
              3: '`console.log(n)` runs **before** the recursive call, so each call prints first. The problem is not ordering but the missing stop condition.',
            },
            deeper: 'Whenever you write a recursive function, first write the base case, then check: *does every recursive call move closer to it?* `n − 1` moves towards 0, so `if (n <= 0) return` would be reached. `n / 2` on a positive number also reaches it. `n + 1` never would.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Anything recursion does, a loop plus a stack can also do. So why learn it?

- **Some problems are naturally self-similar.** Trees (a tree is a root plus smaller trees), nested expressions like \`&(t,|(f,t))\`, "all ways to split this", games where each move leaves a smaller game. A loop-only solution must manually simulate a stack; recursion lets the language do it.
- **Correctness is easier to argue.** If the base case is right, and the recursive case is right *assuming the smaller call is right*, the whole function is right. That is just **mathematical induction**.
- **It is the foundation of later topics.** Backtracking, tree/graph DFS, divide & conquer (merge sort, quick sort) and dynamic programming are all recursion with extra rules.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Loop — you manage the state',
              code: `function reverse(s) {
  const a = [...s];
  let l = 0, r = a.length - 1;
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    l++; r--;
  }
  return a.join('');
}`,
            },
            right: {
              title: 'Recursion — describe the relation',
              code: `function reverse(s) {
  if (s.length <= 1) return s;          // base
  // last char + reverse of everything before it
  return s[s.length - 1] + reverse(s.slice(0, -1));
}
// (clear, but O(n²) because slice copies —
//  see the Common mistakes section)`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why "the base case is right + the step is right assuming the smaller call is right" proves the **whole** function correct?',
            deeper: `It is a chain. Suppose \`sum(1)\` is correct (checked by hand). The step says: *if* \`sum(k − 1)\` is correct, *then* \`sum(k) = k + sum(k − 1)\` is correct. Apply it with k = 2: sum(1) correct ⇒ sum(2) correct. Then k = 3: sum(2) correct ⇒ sum(3) correct. The dominoes fall all the way to any n. This is **induction**, and it is why you are allowed to *trust* the recursive call while writing the function instead of tracing it — the "leap of faith".`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for recursion when you can finish the sentence **"If I already had the answer for a smaller input, I could get the answer for this input by …"**

| Shape of the problem | Smaller input | Example |
|---|---|---|
| Reduce by one | n − 1, or the array without one end | factorial, reverse, Josephus |
| Halve | n / 2 | fast power, K-th symbol |
| Split into two parts | left part + right part | merge sort, different ways to add parentheses |
| Game / choice | the state after one move | predict the winner |
| Nesting | the inside of a pair of brackets | parsing expressions |

**Prefer a loop** when the recursion would be very deep (JavaScript engines allow only about 10,000 nested calls) or when the recursion is just "reduce by one" and a loop is equally clear.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript has no tail-call optimisation (in practice)',
            md: 'The ES2015 spec describes proper tail calls, but V8 (Chrome, Node) and Firefox never shipped them. Even `return f(n - 1)` keeps a frame per call. Recursing 100,000 deep will throw `RangeError: Maximum call stack size exceeded`. Depth O(log n) (halving) or O(tree height) is fine; depth O(n) for n = 10^5 is not.',
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-2',
            question: 'Which of these is the **most** dangerous recursive solution in JavaScript for input size n = 200,000?',
            options: [
              'Fast power x^n that recurses on n/2',
              'Reversing an array by recursing on (left + 1, right − 1)',
              'Binary search written recursively',
              'Merge sort on the array (recurses on each half)',
            ],
            answer: 1,
            explanation: 'Reversing by shrinking both ends has depth n/2 = 100,000 — far beyond the ~10k frames an engine allows. The other three all halve the problem, so their depth is about log2(200,000) ≈ 18.',
            misconceptions: {
              0: 'Halving the exponent gives depth ≈ log2(n) ≈ 18 — tiny.',
              2: 'Binary search halves the range each call: depth ≈ 18.',
              3: 'Merge sort makes many calls in total (≈ 2n), but only ≈ log2(n) of them are open at the same time. Depth, not total calls, is what fills the stack.',
            },
            deeper: 'Two different numbers matter: **total calls** (drives time) and **maximum depth** (drives stack memory and RangeError). Merge sort has O(n) total calls but O(log n) depth. A linear recursion has O(n) of both.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['a recurrence formula is given or easy to find', 'input is nested (parentheses, brackets)', '"all possible ways to group / split"', '"both players play optimally"', 'huge exponent n (≥ 10^9) → halving', 'each row/level is built from the previous one'],
            conclusion: 'Think Recursion (then check the depth and whether sub-calls repeat)',
          },
          {
            type: 'text',
            md: `Ask three questions:

1. **What is the smaller version?** (n − 1? n / 2? the left and right parts? the game after one move?)
2. **What is the base case?** (n = 0, empty string, single number, one element left)
3. **How deep can it get, and do calls repeat?** Depth ≈ n for n ≥ 10^4 → prefer a loop. Repeated identical calls → memoize (Dynamic Programming).`,
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-3',
            question: '"Row 1 is `0`. Each next row replaces every 0 with `01` and every 1 with `10`. Return the k-th symbol of row n (n ≤ 30)." What is the best recursive view?',
            options: [
              'Build all rows as strings and index into row n',
              'It is a game — use minimax',
              'Split the row at every position and combine left/right results',
              'Symbol k of row n comes from symbol ⌈k/2⌉ of row n − 1: same if k is odd, flipped if k is even',
            ],
            answer: 3,
            explanation: 'Each symbol of row n − 1 produces two children in row n. Child k has parent ⌈k/2⌉; the first child (odd k) copies the parent, the second (even k) is its flip. Depth n ≤ 30, O(n) time, no strings built.',
            misconceptions: {
              0: 'Row 30 has 2^29 ≈ 537 million symbols — building it takes too much time and memory. Recursion follows only the one path you need.',
              1: 'There are no players or opposing choices here.',
              2: 'Splitting at every position is divide & conquer for "all groupings" problems. Here each position has exactly one parent, so one path suffices.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — the call stack',
        blocks: [
          {
            type: 'text',
            md: `When a function is called, the engine pushes a **stack frame** holding its parameters, locals and the place to resume afterwards. When it returns, the frame is popped. Recursion is simply many frames of the *same* function stacked up.

\`\`\`js
function fact(n) {
  if (n === 1) return 1;
  return n * fact(n - 1);
}
fact(4);
\`\`\`

\`\`\`text
Going down (pushing frames)        Coming back up (popping)
fact(4) waits for fact(3)          fact(1) returns 1
  fact(3) waits for fact(2)        fact(2) returns 2 * 1 = 2
    fact(2) waits for fact(1)      fact(3) returns 3 * 2 = 6
      fact(1) → base case          fact(4) returns 4 * 6 = 24
\`\`\`

Two phases:
- **Winding** (going down): work done *before* the recursive call happens in order 4, 3, 2, 1.
- **Unwinding** (coming back): work done *after* the call happens in reverse order 1, 2, 3, 4. The multiplication \`n * …\` happens here.

This is the same LIFO **stack** you met in the Stack topic — the engine maintains it for you.`,
          },
          { type: 'visual', scenario: 'recursion-tree', caption: "Every call becomes a node; the call stack is the path from the root to the active call." },
          {
            type: 'callout',
            variant: 'insight',
            title: 'The leap of faith',
            md: 'While **writing** a recursive function, do not trace it all the way down. Assume the recursive call already returns the correct answer for the smaller input (the induction hypothesis) and ask only: *"Given that, how do I finish?"* Tracing is for **debugging** small inputs, not for designing.',
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-4',
            question: 'What does `show(3)` print?\n\n```js\nfunction show(n) {\n  if (n === 0) return;\n  show(n - 1);\n  console.log(n);\n}\n```',
            options: ['3 2 1', '1 2 3', '3 2 1 0', 'Nothing'],
            answer: 1,
            explanation: 'The print is **after** the recursive call, so it runs during unwinding. show(3) first calls show(2), which calls show(1), which calls show(0) (returns). Then show(1) prints 1, show(2) prints 2, show(3) prints 3.',
            misconceptions: {
              0: 'That would be the output if `console.log(n)` came **before** `show(n - 1)`. Code after the call waits until the deeper calls finish.',
              2: 'show(0) hits the base case and returns before printing anything.',
              3: 'Every frame with n ≥ 1 prints once — just later than you might expect.',
            },
            deeper: 'Rule: code **before** the recursive call runs top-down (n, n−1, …); code **after** runs bottom-up (…, n−1, n). Tree traversals (preorder vs postorder) are exactly this difference.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach — recursion trees and naive Fibonacci',
        blocks: [
          {
            type: 'text',
            md: `Recursion can be *elegant and slow* at the same time. The classic example:

\`\`\`js
function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
\`\`\`

Draw the **recursion tree** — each node is a call, its children are the calls it makes:

\`\`\`text
                fib(5)
            /           \\
        fib(4)          fib(3)
        /    \\          /    \\
    fib(3)  fib(2)   fib(2)  fib(1)
    /   \\    /  \\     /  \\
 fib(2) f(1) f(1) f(0) f(1) f(0)
  /  \\
f(1) f(0)
\`\`\`

\`fib(3)\` is computed twice, \`fib(2)\` three times. Counting calls: \`C(n) = 1 + C(n−1) + C(n−2)\`, which grows like Fibonacci itself — about **1.618ⁿ**. \`fib(50)\` would make ~4·10^10 calls.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'How to count calls in a recursion tree',
            md: `- **Time ≈ (number of nodes) × (work per node)**.
- A call that makes **b** recursive calls, each reducing depth by 1 for **d** levels, has up to **bᵈ** nodes. fib: b = 2, d = n → O(2ⁿ) (tighter: O(1.618ⁿ)).
- A call that makes **one** call on n/2 has log2(n) nodes → O(log n).
- **Space ≈ maximum depth** of the tree (the longest root-to-leaf path), *not* the number of nodes. fib(n) uses O(n) stack even though it makes exponentially many calls.`,
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-5',
            question: 'Naive `fib(n)` makes about 1.6ⁿ calls. What is its **stack space** (maximum depth)?',
            options: ['O(n)', 'O(1.6ⁿ)', 'O(log n)', 'O(1)'],
            answer: 0,
            explanation: 'At any moment only one root-to-leaf path is on the stack: fib(n) → fib(n−1) → … → fib(1). That path has n frames. Calls on other branches are started only after the current branch has returned and its frames were popped.',
            misconceptions: {
              1: 'That is the total number of calls over the whole run (time). The stack only holds the *currently open* calls.',
              2: 'Depth is log n only when each step halves the input. fib reduces by 1 each step.',
              3: 'Every open call keeps a frame, and n of them are open at the deepest point.',
            },
          },
          {
            type: 'text',
            md: `**The fix — preview of Dynamic Programming:** the tree has only \`n + 1\` *distinct* nodes (fib(0) … fib(n)). Cache each result the first time you compute it (**memoization**) and every repeat becomes an O(1) lookup → O(n) time.

\`\`\`js
function fib(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, v);
  return v;
}
\`\`\`

You will study this properly in the **DP** topics. For now, the lesson is: *before trusting a recursive solution, check whether identical calls repeat*.`,
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — shrink faster and do less per call',
        blocks: [
          {
            type: 'text',
            md: `Recursion gets fast when you make the sub-problem **smaller faster** and **compute each sub-result once**. The flagship example is **fast exponentiation**.

Naive: \`x^n = x · x^(n−1)\` → n calls → O(n). For n = 2^31 that is two billion multiplications.

Halving:

\`\`\`text
x^n = (x^(n/2))²          if n is even
x^n = (x^(n/2))² · x      if n is odd   (n/2 rounded down)
x^0 = 1                   base case
\`\`\`

Each call halves n, so there are only about log2(n) calls: **O(log n)**. For n = 2^31, that is 31 calls instead of 2 billion.`,
          },
          {
            type: 'visual',
            scenario: 'fast-power',
            caption: 'pow(10) → pow(5) → pow(2) → pow(1) → pow(0): the stack grows by one frame per halving. On the way back each call squares its half, and odd exponents multiply by x once more.',
          },
          {
            type: 'steps',
            title: 'myPow(x, n) with negative exponents',
            steps: [
              'If `n < 0`: the answer is `1 / x^(−n)`. Replace `x` by `1 / x` and `n` by `−n` (safe in JS: −(−2^31) is exact as a Number).',
              'Base case: `n === 0` → return 1.',
              'Recurse ONCE: `half = pow(x, Math.floor(n / 2))`.',
              'Return `half * half` if n is even, otherwise `half * half * x`.',
            ],
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-6',
            question: 'A student writes `return pow(x, Math.floor(n/2)) * pow(x, Math.floor(n/2));` for even n. What is the time complexity?',
            options: ['O(log n) — it still halves n', 'O(1)', 'O(n²)', 'O(n) — two calls per level double the work at each of the log n levels'],
            answer: 3,
            explanation: 'Each call makes two identical calls. Level k of the recursion tree has 2^k nodes, and there are log2(n) levels, so the total is 2^(log2 n) = n calls. Storing the result in `half` and squaring it makes it one call per level: O(log n).',
            misconceptions: {
              0: 'Depth is still log n, but the number of calls doubles at every level. Time counts **all** nodes of the recursion tree, not just the depth.',
              2: 'Each call does O(1) work and there are about n calls in total, so the work is O(n), not n².',
              1: 'Recursion that depends on n cannot be constant time.',
            },
            deeper: 'Same shape as naive Fibonacci: a node with two children repeated for d levels gives 2ᵈ nodes. Here d = log2 n so 2ᵈ = n. The cure is also the same: compute the repeated sub-result once.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Modular arithmetic: the 2^53 trap',
            md: `Problems often say "return the answer modulo 10^9 + 7". With fast power you compute \`(a * b) % MOD\` where a, b < 10^9 + 7. Their product can be ≈ 10^18 — **bigger than \`Number.MAX_SAFE_INTEGER\` (≈ 9·10^15)**, so a JS Number silently rounds it and the remainder is wrong.

Two safe options:
- **BigInt**: \`Number((BigInt(a) * BigInt(b)) % MOD_BIG)\` or keep everything as BigInt (\`const MOD = 1_000_000_007n\`).
- **Split multiplication**: break b into high and low 16-bit halves so every partial product stays below 2^53: \`((a * (b >>> 16)) % M * 65536 + a * (b & 65535)) % M\`.

BigInt is the clearest choice for interview code.`,
          },
          {
            type: 'code',
            title: 'Modular fast power with BigInt',
            code: `const MOD = 1_000_000_007n;
function modPow(base, exp) {          // base, exp are BigInt, exp >= 0n
  if (exp === 0n) return 1n;
  const half = modPow(base, exp / 2n); // BigInt division already floors
  const sq = (half * half) % MOD;
  return exp % 2n === 0n ? sq : (sq * base) % MOD;
}
modPow(5n, 10n ** 15n);               // ~50 calls, exact result`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: 'Almost every recursive function is filled in with the same four questions: **What are the parameters that describe a sub-problem? What is the base case? What smaller call(s) do I make? How do I combine?**',
          },
          {
            type: 'code',
            title: 'Generic recursion',
            code: `function solve(state) {
  // 1. BASE CASE(S): smallest inputs, answered directly
  if (isSmallest(state)) return directAnswer(state);

  // 2. RECURSIVE CASE: trust the call on a strictly smaller state
  const sub = solve(smaller(state));

  // 3. COMBINE: one step of work turns the sub-answer into this answer
  return combine(state, sub);
}`,
          },
          {
            type: 'code',
            title: 'Helper with indices (avoids copying arrays/strings)',
            code: `function reverseString(s) {        // s is an array of chars
  function go(l, r) {
    if (l >= r) return;              // base: 0 or 1 element left
    [s[l], s[r]] = [s[r], s[l]];
    go(l + 1, r - 1);                // smaller range
  }
  go(0, s.length - 1);
}`,
            caption: 'Passing indices instead of slices keeps each call O(1). Depth is n/2, so for very large n prefer the loop.',
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-7',
            question: 'Josephus: n people in a circle, every k-th is removed, J(n) = survivor index (0-based). After the first removal the circle has n − 1 people, re-numbered starting from the person right after the removed one. Which recurrence is correct?',
            options: [
              'J(n) = J(n − 1) + 1',
              'J(n) = (J(n − 1) + k) % n, with J(1) = 0',
              'J(n) = J(n − 1) % k',
              'J(n) = n − k',
            ],
            answer: 1,
            explanation: 'The first removed person is index (k − 1). The smaller circle starts at index k of the big circle. So position p in the smaller circle is position (p + k) % n in the bigger one. Apply that to the smaller survivor: J(n) = (J(n − 1) + k) % n.',
            misconceptions: {
              0: 'Shifting by 1 would be right only if k = 1 (and then it still ignores the wrap-around modulo n).',
              2: 'The result must be an index in 0..n−1 of the *current* circle, so we reduce modulo n, not k.',
              3: 'That ignores the wrap-around entirely — the process goes round the circle many times.',
            },
            deeper: 'This is the "leap of faith" plus a **re-labelling**: trust J(n − 1) for the smaller circle, then translate its answer back into the bigger circle\'s numbering. Depth n ≤ 500 is fine recursively; for n = 10^5 write the same recurrence as a loop: `let j = 0; for (let m = 2; m <= n; m++) j = (j + k) % m;`.',
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Pow(x, n) — O(log n) time, O(log n) stack',
            code: `function myPow(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }   // x^-n = (1/x)^n
  function pow(e) {
    if (e === 0) return 1;
    const half = pow(Math.floor(e / 2)); // NOT e >> 1: breaks for e = 2^31
    return e % 2 === 0 ? half * half : half * half * x;
  }
  return pow(n);
}`,
          },
          {
            type: 'code',
            title: 'K-th Symbol in Grammar — follow one path of the tree',
            code: `function kthGrammar(n, k) {
  if (n === 1) return 0;                     // row 1 is "0"
  const parent = kthGrammar(n - 1, Math.ceil(k / 2));
  return k % 2 === 1 ? parent : 1 - parent;  // left child copies, right child flips
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Use **inner helper functions** (closures) so recursive calls can share arrays, a memo Map or a cursor without passing them every time.
- Avoid \`slice\`/\`substring\` in each call — every copy is O(n) and turns O(n) recursion into O(n²). Pass indices.
- Default parameters (\`function f(n, memo = new Map())\`) are evaluated per call only when the argument is missing — pass the memo explicitly in recursive calls.
- \`>>\`, \`|\`, \`&\` convert to **32-bit signed integers**. \`(2 ** 31) >> 1\` is \`-1073741824\`. Use \`Math.floor(n / 2)\` for big n.
- You can raise Node's stack with \`node --stack-size=…\`, but you cannot in a browser or on LeetCode — design for the default.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'myPow(2, 10)',
            columns: ['call', 'e', 'e even?', 'half (returned by the deeper call)', 'returns'],
            rows: [
              ['pow(10)', '10', 'yes', 'pow(5) = 32', '32 · 32 = 1024'],
              ['pow(5)', '5', 'no', 'pow(2) = 4', '4 · 4 · 2 = 32'],
              ['pow(2)', '2', 'yes', 'pow(1) = 2', '2 · 2 = 4'],
              ['pow(1)', '1', 'no', 'pow(0) = 1', '1 · 1 · 2 = 2'],
              ['pow(0)', '0', '—', 'base case', '1'],
            ],
            note: 'Read the "returns" column bottom-up: that is the unwinding phase. 5 calls instead of 10 multiplications; for n = 2^31 it would be 32 calls instead of 2 billion.',
          },
          {
            type: 'reflect',
            prompt: 'Do you see why the table is filled top-down for the "e" column but bottom-up for the "returns" column?',
            deeper: 'The calls are **made** top-down (winding): pow(10) calls pow(5), which calls pow(2)… The **results** are only known after the deeper call returns (unwinding), so pow(0) finishes first and pow(10) last. Any work written after the recursive call — here, the squaring — happens on the way back up.',
          },
        ],
      },
      {
        id: 'intuition-divide-conquer',
        title: 'Core intuition — divide & conquer',
        blocks: [
          {
            type: 'text',
            md: `**Divide & conquer** = split the input into parts, solve each part recursively, then **combine**.

1. **Divide** — pick a split (the middle, or every operator, or the root).
2. **Conquer** — recursively solve each part (leap of faith).
3. **Combine** — merge the parts' answers.

Merge sort is the most famous example (you will study it in detail in the next topic, **Sorting**): split the array in half, sort each half, merge two sorted halves.`,
          },
          {
            type: 'visual',
            scenario: 'merge-sort',
            input: { nums: [5, 2, 4, 7, 1, 3, 2, 6] },
            caption: 'Divide & conquer: split until single elements (base case), then combine on the way back up.',
          },
          {
            type: 'text',
            md: `**Different Ways to Add Parentheses** uses *every* split point. For \`"2*3-4*5"\`, whichever operator is evaluated **last** splits the expression into two independent sub-expressions:

\`\`\`text
last op = '*' (first):  2  *  (3-4*5)      → left {2},     right {-17, -5}
last op = '-':         (2*3) - (4*5)       → left {6},     right {20}
last op = '*' (last):  (2*3-4) * 5         → left {-10, 2}, right {5}
\`\`\`

Combine every left value with every right value: \`{-34, -10, -14, -50, 10}\`. The base case is a string with no operator — just a number.`,
          },
          {
            type: 'code',
            title: 'Different Ways to Add Parentheses',
            code: `function diffWaysToCompute(expr) {
  const out = [];
  for (let i = 0; i < expr.length; i++) {
    const op = expr[i];
    if (op !== '+' && op !== '-' && op !== '*') continue;
    const left = diffWaysToCompute(expr.slice(0, i));
    const right = diffWaysToCompute(expr.slice(i + 1));
    for (const a of left) for (const b of right) {
      out.push(op === '+' ? a + b : op === '-' ? a - b : a * b);
    }
  }
  if (out.length === 0) out.push(Number(expr)); // base case: a plain number
  return out;
}`,
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-8',
            question: 'Why are the left and right sub-expressions allowed to be solved **independently**?',
            options: [
              'Because once we fix which operator is applied last, the value of each side does not depend on how the other side is parenthesized',
              'Because multiplication is commutative',
              'Because the expression is always short',
              'Because JavaScript evaluates left to right',
            ],
            answer: 0,
            explanation: 'Fixing the last operator puts a "wall" between the two sides: `(anything on the left) op (anything on the right)`. Every grouping of the left can pair with every grouping of the right, so the answer set is the cross product of the two independent answer sets.',
            misconceptions: {
              1: 'Subtraction is not commutative, yet the method still works. Independence comes from the split, not from the operator\'s properties.',
              2: 'Length only affects running time. Independence is a structural property.',
              3: 'We are enumerating *all* evaluation orders, deliberately ignoring the default left-to-right rule.',
            },
          },
        ],
      },
      {
        id: 'optimized-game',
        title: 'Optimized approach — game recursion (minimax as a score difference)',
        blocks: [
          {
            type: 'text',
            md: `**Predict the Winner:** two players alternately take a number from **either end** of an array. Both play optimally. Does player 1 finish with at least as much as player 2?

A greedy "take the bigger end" fails: \`[1, 5, 2]\` — taking 2 lets the opponent take 5.

**Key trick:** define one function for *whoever is to move*:

\`\`\`text
diff(i, j) = the best (my total − opponent's total) I can force on nums[i..j]
\`\`\`

If I take \`nums[i]\`, the opponent then faces \`nums[i+1..j]\` and gets *their* best difference \`diff(i+1, j)\` — which counts against me. So:

\`\`\`text
diff(i, j) = max( nums[i] − diff(i+1, j),  nums[j] − diff(i, j−1) )
diff(i, i) = nums[i]
\`\`\`

Player 1 wins (ties count) iff \`diff(0, n−1) >= 0\`. This is **minimax** written compactly: maximising my difference *is* minimising the opponent's.`,
          },
          {
            type: 'visual',
            scenario: 'minimax-game',
            caption: 'The same game as an explicit MAX / MIN tree: Player 1 levels keep the larger child, Player 2 levels the smaller. Taking the 1 first looks bad but wins by 222 — greedy (take 7) would lose.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why we **subtract** `diff(i+1, j)` instead of adding something?',
            deeper: `After my move, the roles swap. \`diff(i+1, j)\` is measured from the **new mover's** viewpoint — the opponent's (their score − my score) on the rest. From *my* viewpoint that is the negative: (my score − their score) on the rest = −diff(i+1, j). Adding my pick \`nums[i]\` gives my total difference. One function, used by both players, each flipping the sign — that is the whole of minimax for zero-sum games.`,
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-9',
            question: 'For `nums = [1, 5, 2]`, what is `diff(0, 2)` and who wins?',
            options: [
              '`diff = 2`, player 1 wins',
              '`diff = 0`, it is a tie so player 1 wins',
              '`diff = −2`, player 2 wins',
              '`diff = 8`, player 1 wins',
            ],
            answer: 2,
            explanation: 'diff(1,2) on [5,2] = max(5 − 2, 2 − 5) = 3. diff(0,1) on [1,5] = max(1 − 5, 5 − 1) = 4. diff(0,2) = max(1 − diff(1,2), 2 − diff(0,1)) = max(1 − 3, 2 − 4) = −2. Negative → player 2 wins.',
            misconceptions: {
              0: 'Greedy thinking: "take 2, then 1 later" ignores that the opponent grabs 5 in between.',
              1: 'Recheck the sub-results: diff(1,2) = 3 and diff(0,1) = 4, so neither first move reaches 0.',
              3: '8 is the total of the array, not a difference between the two players.',
            },
            deeper: 'Plain recursion makes 2 calls per state and has depth n → O(2ⁿ); fine for n ≤ 20. But there are only n² distinct (i, j) pairs, so memoizing gives O(n²) — that is **interval DP**, coming in the DP topics.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **No base case, or a base case the input never reaches** → infinite recursion → \`RangeError\`. Check every recursive call moves strictly towards a base case (for all inputs, including negatives and 0).
2. **Forgetting \`return\`** — \`if (…) f(n - 1);\` without \`return\` makes the function return \`undefined\`.
3. **Repeated identical sub-calls** — naive Fibonacci, calling \`pow(x, n/2)\` twice. Store the result or memoize.
4. **Copying in every call** — \`s.slice(1)\`, \`[...arr]\`, string concatenation of big strings → hidden O(n) per call.
5. **Too deep for JavaScript** — linear recursion on n ≥ ~10^4. Convert to a loop or an explicit stack.
6. **Shared mutable state bugs** — a memo or result array defined *inside* the function is recreated every call; define it outside or in a wrapper.
7. **Precision** — \`a * b % MOD\` with a, b ≈ 10^9 exceeds 2^53. Use BigInt.
8. **32-bit bit tricks on big numbers** — \`n >> 1\` for n ≥ 2^31 gives garbage.`,
          },
          {
            type: 'checkpoint',
            id: 'recursion-cp-10',
            question: 'What is wrong with this "is n a power of two" function?\n\n```js\nfunction isPow2(n) {\n  if (n === 1) return true;\n  if (n % 2 !== 0) return false;\n  return isPow2(n / 2);\n}\n```',
            options: [
              'Nothing — it is correct for every integer',
              'It returns true for 6',
              '`isPow2(0)` never reaches a base case: 0 % 2 === 0 and 0 / 2 === 0, so it recurses forever',
              'It fails for n = 1',
            ],
            answer: 2,
            explanation: 'For n = 0 neither base case fires and n / 2 is still 0 — the input never gets smaller. Add `if (n <= 0) return false;` first. Always test the smallest and "weird" inputs (0, negatives) against your base cases.',
            misconceptions: {
              0: 'Try n = 0 by hand: 0 % 2 is 0, so it calls isPow2(0) again, forever.',
              1: '6 → 3 → 3 % 2 !== 0 → false. Correct.',
              3: 'n = 1 hits the first base case and returns true (2^0 = 1).',
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
            time: 'O(number of calls × work per call)',
            space: 'O(maximum depth) for the call stack (+ any memo)',
            md: `| Recursion shape | Calls | Depth | Example |
|---|---|---|---|
| One call on n − 1, O(1) work | n | n | factorial, Josephus |
| One call on n / 2 | log n | log n | fast power, binary search |
| Two calls on n − 1 | 2ⁿ | n | naive fib (≈1.618ⁿ), predict the winner without memo |
| Two calls on n / 2 + O(n) combine | 2n calls, O(n log n) work | log n | merge sort |
| One call on n − 1 + O(n) copy | n, O(n²) work | n | reverse with slice |

**How to derive it:** draw the recursion tree. Sum the work of every node for time; take the longest root-to-leaf path for stack space.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the recurrence in words first**: "the answer for n is the answer for n/2 squared, times x if n is odd". Then write base case → recursive case → combine.
- **Name the base case explicitly** and test it with the smallest inputs (0, 1, empty).
- **State both costs**: "O(log n) time and O(log n) stack space". Interviewers often ask about the stack.
- **Spot repetition**: "these sub-calls overlap — I can memoize to get O(n²)". Even if you do not implement it, saying it shows DP awareness.
- **Mention JS limits** when depth is large: "In JavaScript I'd convert this to a loop because the stack is ~10k frames."
- For modulo problems, say up front: "products can exceed 2^53, so I'll use BigInt."`,
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
              { api: 'Inner function (closure)', use: 'Recursive helper that shares arrays / memo / cursor with the outer function', complexity: 'O(1)' },
              { api: 'new Map()', use: 'Memoize results keyed by argument (or `${i},${j}`)', complexity: 'O(1) average' },
              { api: 'BigInt: 1_000_000_007n, a * b % MOD', use: 'Exact modular arithmetic beyond 2^53', complexity: 'O(1) for small BigInts' },
              { api: 'Number(big)', use: 'Convert a BigInt result back to a Number to return it', complexity: 'O(1)' },
              { api: 'Math.floor(n / 2), Math.ceil(k / 2)', use: 'Halving without 32-bit truncation', complexity: 'O(1)' },
              { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Swap in place (reverse by recursion)', complexity: 'O(1)' },
              { api: 'try { … } catch (e) { e instanceof RangeError }', use: 'Detect stack overflow when experimenting', complexity: '—' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Self-similar problems: answer(n) from answer(smaller)', 'Nested structures (expressions, balanced strings)', 'All ways to split / group', 'Two-player optimal games', 'Huge exponents → halving'],
    clues: ['recurrence', 'nested parentheses', 'all possible ways', 'play optimally', 'x^n / modulo 10^9+7', 'each row built from the previous'],
    template: `function solve(state) {
  if (isBase(state)) return base(state);
  const sub = solve(smaller(state));  // leap of faith
  return combine(state, sub);
}`,
    complexity: 'Time = calls × work per call; space = max depth (JS limit ≈ 10k frames)',
    mistakes: ['missing / unreachable base case', 'forgetting return', 'repeated identical sub-calls', 'slice/copy per call', 'deep linear recursion in JS', 'Number overflow past 2^53 in modular products'],
    jsTools: ['closures', 'Map memo', 'BigInt', 'Math.floor(n/2)'],
  },

  keyConcepts: [
    'Every recursion = base case + recursive case on a strictly smaller input.',
    'Leap of faith = induction: trust the smaller call, only design the combine step.',
    'Calls live on the call stack; code after the recursive call runs while unwinding.',
    'Time = nodes in the recursion tree × work per node; space = depth of the tree.',
    'Naive Fibonacci is exponential because identical calls repeat — memoization (DP) fixes it.',
    'Halving (fast power) gives O(log n); compute the half ONCE.',
    'Game recursion: best(state) = max over moves of (gain − best(next state)).',
    'JS has no TCO; depth ≳ 10^4 → use a loop. Products ≥ 2^53 → BigInt.',
  ],

  interviewTips: [
    'State the recurrence and base case in words before coding.',
    'Give both time and stack-space complexity.',
    'Point out overlapping sub-calls and mention memoization.',
    'Mention the JS stack limit and BigInt for modular multiplication when relevant.',
  ],
};
