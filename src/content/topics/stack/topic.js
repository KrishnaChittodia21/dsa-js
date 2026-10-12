export default {
  id: 'stack',
  summary: 'A stack is a pile where you only touch the top: last in, first out. It is the natural tool for anything nested (brackets, expressions, undo) and — kept in sorted order — the monotonic stack answers "next greater / smaller element" for every index in O(n).',

  jsTools: [
    { api: 'arr.push(x)', use: 'Push onto the top of the stack (end of the array)', complexity: 'O(1) amortized' },
    { api: 'arr.pop()', use: 'Remove and return the top (undefined when empty)', complexity: 'O(1)' },
    { api: 'arr[arr.length - 1] / arr.at(-1)', use: 'Peek at the top without removing it', complexity: 'O(1)' },
    { api: 'arr.length === 0', use: 'Is the stack empty?', complexity: 'O(1)' },
    { api: 'Stack (toolkit)', use: 'push / pop / peek / isEmpty / size wrapper around an array', complexity: 'O(1) each' },
    { api: 'Map / object literal', use: 'Closing bracket → matching opening bracket', complexity: 'O(1)' },
    { api: 'Math.trunc(a / b)', use: 'Integer division that truncates toward zero (RPN, calculators)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'stack-matching',
      name: 'Stack — Matching & Cancellation',
      summary: 'Push items that are "waiting for a partner"; when a new item can pair with (or cancel) the top, pop it. Whatever remains is unmatched.',
      whyItExists: 'In nested structures the most recently opened thing must be closed first. A stack keeps exactly the open items in order, and the one that must be matched next is always on top — so each check is O(1) and the whole scan is O(n).',
      whenToUse: [
        'Brackets / tags must be properly nested',
        'Adjacent items cancel or collide (asteroids, removing adjacent duplicates, backspace strings)',
        'Undo-style operations ("remove the previous score")',
      ],
      clues: ['"valid parentheses"', '"properly nested"', '"collide"', '"remove adjacent"', '"cancel the previous"', '"backspace"'],
      whenNotToUse: [
        'Only one bracket type and you just need balance → a counter is enough (O(1) space)',
        'Items interact with elements far away, not with the most recent one → hashing / sorting',
      ],
      template: `function isValid(s) {
  const pair = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in pair) {
      if (stack.pop() !== pair[ch]) return false; // top must be the partner
    } else {
      stack.push(ch);                             // waiting for a partner
    }
  }
  return stack.length === 0;                      // nothing left unmatched
}`,
      variations: [
        { name: 'Collisions', description: 'While the new item collides with the top, resolve the fight (pop the loser); push the new item if it survives.' },
        { name: 'Undo operations', description: '"C" invalidates the previous record → pop; "D"/"+" read the top one or two items.' },
        { name: 'Store indices', description: 'Push indices instead of characters to measure lengths (longest valid parentheses).' },
      ],
      mistakes: [
        'Forgetting to check the stack is non-empty at the end (unclosed brackets)',
        'Popping from an empty stack and comparing undefined without noticing',
        'Resolving only one collision instead of looping while collisions continue',
      ],
      evolution: {
        easy: 'Valid parentheses, baseball game.',
        medium: 'Asteroid collision, remove adjacent duplicates with a count k.',
        hard: 'Longest valid parentheses (indices on the stack), minimum removals to make valid.',
      },
    },
    {
      id: 'stack-expression-eval',
      name: 'Stack — Expression Evaluation & Nested Decoding',
      summary: 'Operands wait on a stack until their operator (or closing bracket) arrives. For nested parts, push the current context, start fresh, and restore it at the closing bracket.',
      whyItExists: 'Expressions are nested: an inner part must be finished before the outer one can use it. A stack remembers every unfinished outer context so we can return to it, turning recursive structure into a simple left-to-right loop.',
      whenToUse: [
        'Reverse Polish (postfix) notation evaluation',
        'Calculators with + − and parentheses (sign stack) or with × ÷ precedence',
        'Decoding nested encodings like 3[a2[c]]',
      ],
      clues: ['"evaluate the expression"', '"reverse polish notation"', '"parentheses" + "+ -"', '"k[encoded_string]"', '"nested"'],
      whenNotToUse: [
        'Full expression grammars with many precedence levels → shunting-yard or a recursive-descent parser (same idea, more structure)',
      ],
      template: `function evalRPN(tokens) {
  const st = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t) && t.length === 1) {
      const b = st.pop(), a = st.pop();   // order matters: a op b
      if (t === '+') st.push(a + b);
      else if (t === '-') st.push(a - b);
      else if (t === '*') st.push(a * b);
      else st.push(Math.trunc(a / b));
    } else {
      st.push(Number(t));
    }
  }
  return st.pop();
}`,
      variations: [
        { name: 'Sign stack', description: 'For + − and parentheses: at "(" push the current result and sign, reset; at ")" combine: result = saved + savedSign × result.' },
        { name: 'Precedence without parentheses', description: 'Push +n / −n, but for × and ÷ pop the top, combine, push back; answer = sum of stack.' },
        { name: 'Nested decode', description: 'At "[" push (currentString, repeatCount); at "]" pop and set current = saved + current.repeat(count).' },
      ],
      mistakes: [
        'Popping operands in the wrong order for − and ÷ (the first pop is the RIGHT operand)',
        'Using Math.floor for division — it rounds −7/2 to −4 instead of −3',
        'Multi-digit numbers: building the number character by character is required',
        'Unary minus ("-(2+3)") in calculators',
      ],
      evolution: {
        easy: 'Baseball game (operations on the last records).',
        medium: 'RPN evaluation, decode string, calculator II (precedence, no parentheses).',
        hard: 'Basic calculator with parentheses and unary minus; calculator III (both).',
      },
    },
    {
      id: 'stack-design',
      name: 'Stack — Design (Min Stack, Queue via Two Stacks)',
      summary: 'Augment each stack entry with extra information (the minimum so far), or combine two stacks to simulate other structures with amortized O(1) operations.',
      whyItExists: 'A stack only changes at the top, so any property of "everything below" can be precomputed when an item is pushed and is still valid when it is on top again. And reversing a stack by pouring it into another turns LIFO into FIFO.',
      whenToUse: [
        'Get the minimum / maximum of the stack in O(1)',
        'Build a queue from stacks (or the reverse) with amortized guarantees',
        'Undo/redo histories, browser back/forward',
      ],
      clues: ['"design a stack that supports … in constant time"', '"getMin"', '"implement a queue using only stacks"'],
      whenNotToUse: [
        'Minimum of an arbitrary sliding window → monotonic deque (Queue & Deque topic)',
        'Removing arbitrary elements → heap or balanced tree',
      ],
      template: `class MinStack {
  constructor() { this.st = []; }            // entries: [value, minSoFar]
  push(x) {
    const m = this.st.length ? Math.min(x, this.st[this.st.length - 1][1]) : x;
    this.st.push([x, m]);
  }
  pop() { this.st.pop(); }
  top() { return this.st[this.st.length - 1][0]; }
  getMin() { return this.st[this.st.length - 1][1]; }
}`,
      variations: [
        { name: 'Two parallel stacks', description: 'values[] and mins[] pushed together.' },
        { name: 'Queue from two stacks', description: 'Push into "in"; when "out" is empty, pour all of "in" into it. Each element moves at most twice → amortized O(1).' },
      ],
      mistakes: [
        'Storing a single global min — after popping it you cannot recover the previous minimum',
        'Queue via stacks: pouring in → out when out is NOT empty (breaks FIFO order)',
      ],
      evolution: {
        easy: 'Queue via two stacks.',
        medium: 'Min stack, max stack with O(1) getMax.',
        hard: 'Max stack with popMax (needs a heap/tree + lazy deletion), frequency stack.',
      },
    },
    {
      id: 'monotonic-stack-next-greater',
      name: 'Monotonic Stack — Next Greater / Smaller Element',
      summary: 'Scan once, keeping a stack of indices whose values are in sorted order. When a new value breaks the order, it is the "next greater (or smaller)" answer for every index it pops.',
      whyItExists: 'Brute force looks right of every index for the first larger value: O(n²). But once a larger value x arrives, every smaller value waiting before it has found its answer, and those can never be the answer for anyone after x. Popping them keeps only useful candidates, and each index is pushed and popped once: O(n).',
      whenToUse: [
        'Next / previous greater or smaller element for every index',
        '"How many days until a warmer day", stock span, visible people in a line',
        'Build the lexicographically smallest result by removing digits/letters (greedy + monotonic stack)',
        'Circular arrays: iterate 2n positions with i % n',
      ],
      clues: ['"next greater element"', '"next warmer day"', '"span"', '"previous smaller"', '"remove k digits to make it smallest"', '"circular"'],
      whenNotToUse: [
        'You need the k-th greater, or greater within a window of size k → heap / deque',
        'Queries arrive for arbitrary ranges → sparse table / segment tree',
      ],
      template: `function nextGreater(nums) {
  const res = new Array(nums.length).fill(-1);
  const st = [];                           // indices; their values are DECREASING
  for (let i = 0; i < nums.length; i++) {
    while (st.length && nums[st[st.length - 1]] < nums[i]) {
      res[st.pop()] = nums[i];             // nums[i] is the next greater for the popped index
    }
    st.push(i);                            // i waits for its own next greater
  }
  return res;                              // indices still on the stack have none
}`,
      variations: [
        { name: 'Next smaller', description: 'Flip the comparison: keep an increasing stack, pop while top > current.' },
        { name: 'Previous greater / smaller', description: 'After popping, the element left on top is the previous greater/smaller of the current index.' },
        { name: 'Distance instead of value', description: 'Store i − popped (daily temperatures).' },
        { name: 'Circular', description: 'Loop i from 0 to 2n − 1 using nums[i % n]; push only during the first pass.' },
        { name: 'Greedy removal', description: 'Remove k digits: pop while the top is larger than the current digit and removals remain.' },
      ],
      mistakes: [
        'Storing values instead of indices when you need distances or to write res[index]',
        'Using if instead of while (one new value can resolve many waiting indices)',
        'Strict vs non-strict comparison with duplicates (decide what "greater" means)',
      ],
      evolution: {
        easy: 'Next greater element with a lookup map.',
        medium: 'Daily temperatures, stock span, circular next greater, remove k digits.',
        hard: 'Largest rectangle in histogram, maximal rectangle, sum of subarray minimums.',
      },
    },
    {
      id: 'monotonic-stack-previous-smaller',
      name: 'Monotonic Stack — Previous/Next Smaller Boundaries (Histogram)',
      summary: 'For each bar, find how far it can extend left and right while it is the shortest bar: its boundaries are the previous smaller and next smaller elements, both found with one increasing stack.',
      whyItExists: 'The largest rectangle must be exactly as tall as its shortest bar. So try every bar as "the shortest": its best width runs from just after the previous smaller bar to just before the next smaller bar. An increasing stack produces both boundaries at pop time in O(n).',
      whenToUse: [
        'Largest rectangle in a histogram',
        'Maximal rectangle of 1s in a binary matrix (histogram per row)',
        'Any "maximise height × width where height is the minimum of the range"',
      ],
      clues: ['"histogram"', '"largest rectangle"', '"maximal rectangle of 1s"', '"minimum of the range × length"'],
      whenNotToUse: [
        'The rectangle need not be contiguous (choose any bars) → sort',
      ],
      template: `function largestRectangleArea(heights) {
  const st = [];                  // indices with increasing heights
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i]; // sentinel flushes the stack
    while (st.length && heights[st[st.length - 1]] >= h) {
      const height = heights[st.pop()];
      const left = st.length ? st[st.length - 1] : -1; // previous smaller
      best = Math.max(best, height * (i - left - 1));   // i = next smaller
    }
    st.push(i);
  }
  return best;
}`,
      variations: [
        { name: 'Maximal rectangle', description: 'Row by row, heights[c] = heights[c] + 1 if cell is 1 else 0, then run the histogram routine.' },
        { name: 'Two-pass boundaries', description: 'Compute prevSmaller[] and nextSmaller[] arrays separately, then area[i] = h[i] × (next − prev − 1).' },
      ],
      mistakes: [
        'Forgetting the sentinel (bars left on the stack are never measured)',
        'Width off-by-one: it is i − left − 1, with left = −1 when the stack is empty',
      ],
      evolution: {
        easy: '—',
        medium: 'Previous/next smaller arrays.',
        hard: 'Largest rectangle in histogram, maximal rectangle.',
      },
    },
    {
      id: 'monotonic-stack-contribution',
      name: 'Monotonic Stack — Contribution Technique',
      summary: 'Instead of enumerating subarrays, ask for each element: "in how many subarrays am I the minimum (or maximum)?" Multiply left choices × right choices, found with previous/next smaller boundaries.',
      whyItExists: 'A sum over all O(n²) subarrays of their minimum can be regrouped by WHICH element is the minimum. Element i is the minimum of every subarray whose left end lies in (prevSmaller, i] and right end lies in [i, nextSmaller) — that is left × right subarrays. Boundaries cost O(n) with a monotonic stack.',
      whenToUse: [
        'Sum of subarray minimums / maximums',
        'Sum of subarray ranges (sum of max − sum of min)',
        'Count subarrays where a given element is the extreme',
      ],
      clues: ['"sum of min(b) over every contiguous subarray"', '"sum of subarray ranges"', '"answer modulo 10^9 + 7"', 'n up to 3·10^4 or more'],
      whenNotToUse: [
        'The aggregate is not decided by a single extreme element (e.g. sum of subarray sums → prefix sums math)',
      ],
      template: `// left[i]  = i - prevLess[i]      (strictly smaller on the left)
// right[i] = nextLessOrEqual[i] - i (smaller OR EQUAL on the right)
// answer   = Σ nums[i] * left[i] * right[i]`,
      variations: [
        { name: 'Maximum instead of minimum', description: 'Use greater instead of smaller boundaries.' },
        { name: 'Single-pass version', description: 'When index j is popped by i, its right boundary is i and its left boundary is the new top — add nums[j] × (j − top) × (i − j) right there.' },
      ],
      mistakes: [
        'Duplicates counted twice: use strict on one side and non-strict on the other',
        'Overflow before modulo: in JS, products above 2^53 lose precision — take the modulo per term (or use BigInt)',
      ],
      evolution: {
        easy: '—',
        medium: 'Sum of subarray minimums, sum of subarray ranges.',
        hard: 'Sum of total strength of wizards (contribution + prefix of prefix sums).',
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
            md: `A **stack** is a collection where you can only add or remove items at **one end**, called the **top**.

\`\`\`text
push 1   push 2   push 3   pop → 3   pop → 2
  [1]    [1,2]   [1,2,3]    [1,2]      [1]
                    ↑ top
\`\`\`

The item that went in **last** comes out **first**. That rule is called **LIFO** — *Last In, First Out*.

Three operations, all O(1):
- **push(x)** — put x on top.
- **pop()** — remove and return the top item.
- **peek()** (or **top()**) — look at the top item without removing it.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A stack of plates in a cafeteria: you put clean plates on top and take plates from the top. The plate at the bottom was put there first and will be used last. Your browser\'s **Back** button and your editor\'s **Undo** work the same way — the most recent action is undone first.',
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms',
            md: `- **LIFO** — last in, first out.
- **Top** — the end where all pushes and pops happen.
- **Underflow** — popping an empty stack (in JavaScript \`[].pop()\` quietly returns \`undefined\`).
- **Monotonic stack** — a stack whose values are always in sorted order from bottom to top (increasing or decreasing). We restore the order by popping before each push.`,
          },
          {
            type: 'code',
            title: 'A JavaScript array is already a stack',
            code: `const stack = [];
stack.push(1);            // [1]
stack.push(2);            // [1, 2]
stack.push(3);            // [1, 2, 3]
stack[stack.length - 1];  // 3   (peek; or stack.at(-1))
stack.pop();              // 3   → [1, 2]
stack.length === 0;       // false (isEmpty)`,
            caption: 'push/pop work at the END of the array, which is O(1). Never use unshift/shift for a stack — they move every element (O(n)).',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-1',
            question: 'You push 4, 7, 1, then pop once, then push 9. What is on top, and what would the next two pops return?',
            options: [
              'Top 4; pops return 4, 7',
              'Top 9; pops return 9, 1',
              'Top 1; pops return 1, 9',
              'Top 9; pops return 9, 7',
            ],
            answer: 3,
            explanation: 'After 4, 7, 1 the stack is [4,7,1]. pop removes 1 → [4,7]. push 9 → [4,7,9]. Top is 9; popping gives 9 then 7.',
            misconceptions: {
              0: 'That is queue (FIFO) thinking — the first item in comes out first. A stack returns the most recent item.',
              1: '1 was already popped. Once removed it is gone.',
              2: '1 is no longer in the stack, and 9 was pushed after it, so 9 is on top.',
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
            md: `Whenever a problem has **nesting** — things opened and closed in reverse order — the thing you must deal with **next** is always the one you saw **most recently**. That is exactly what a stack gives you in O(1).

- \`( [ { } ] )\` — the last bracket opened (\`{\`) must be the first one closed.
- \`3 * (2 + 4)\` — the inner expression must be finished before the outer multiplication.
- Function calls — the call stack returns from the most recent call first. (Recursion is literally a stack; you can always replace recursion with an explicit stack.)

The second big reason is the **monotonic stack**: it answers "what is the next bigger element to my right?" for *every* index in one O(n) pass, instead of O(n²).`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why nesting and LIFO are the same idea?',
            deeper: 'In a properly nested structure, when you meet a closing symbol, it must close the **innermost** open thing. The innermost open thing is the one opened most recently — the last one in. So "match with the most recent unmatched opener" is exactly "pop the top of the stack". If a structure did not have this property (e.g. brackets that may close in any order), a stack would be the wrong tool.',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Situation | Stack flavour |
|---|---|
| Brackets, tags, nested encodings | **matching** stack |
| Evaluate expressions, calculators | **expression** stack (operands / signs / contexts) |
| Undo the previous action, collisions with the neighbour | **matching / cancellation** stack |
| O(1) min of a stack, queue built from stacks | **design** |
| Next/previous greater or smaller element, spans, "until a warmer day" | **monotonic** stack |
| Largest rectangle, sum of subarray minimums | **monotonic** stack giving boundaries |`,
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-2',
            question: 'Which problem is the most natural fit for a stack?',
            options: [
              'Process print jobs in the order they were submitted',
              'Find the median of a stream of numbers',
              'For each day, how many days until a warmer temperature',
              'Count how many times each word appears',
            ],
            answer: 2,
            explanation: '"Until a warmer day" = next greater element to the right, the classic monotonic-stack question. Days waiting for a warmer day sit on the stack; a warm day pops all cooler days before it.',
            misconceptions: {
              0: '"In the order submitted" is first-in-first-out — a queue, the next topic.',
              1: 'A running median needs two heaps (later topic).',
              3: 'Counting occurrences is a hash map job.',
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
            clues: ['brackets / parentheses / tags', '"evaluate" an expression', '"nested" or k[...] encodings', '"previous" operation / undo', '"next greater" / "next smaller"', '"span" / "days until"', '"histogram" / "largest rectangle"', '"sum of subarray minimums"'],
            conclusion: 'Think Stack (monotonic stack for next greater/smaller)',
          },
          {
            type: 'text',
            md: `Two strong signals:

1. **"The most recent unmatched thing matters"** → plain stack.
2. **"For each element, find the nearest element to the left/right that is bigger/smaller"** → monotonic stack. The words *nearest*, *next*, *previous*, *first greater* are the giveaway.`,
          },
        ],
      },

      // ---------- matching ----------
      {
        id: 'intuition',
        title: 'Core intuition — matching brackets',
        blocks: [
          {
            type: 'text',
            md: `Read the string left to right:

- An **opening** bracket is a promise: "someone will close me later". Push it.
- A **closing** bracket must close the **most recent unclosed** opener — the top of the stack. If the top is the matching opener, pop it. If not (or the stack is empty), the string is invalid.
- At the end, the stack must be **empty** — otherwise some promises were never kept.`,
          },
          {
            type: 'visual',
            scenario: 'stack-parentheses',
            input: { s: '({[]})[' },
            caption: 'Openers are pushed; each closer must match the top. The trailing "[" is left over → invalid.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-3',
            question: 'Why is `"([)]"` invalid even though every bracket type appears once opened and once closed?',
            options: [
              'Because it has an even length',
              'Because when ")" arrives the top of the stack is "[", not "(" — the brackets cross instead of nesting',
              'Because round brackets must come after square ones',
              'It is actually valid',
            ],
            answer: 1,
            explanation: 'After "([" the stack is ["(", "["]. The ")" must close the most recent opener, which is "[". They do not match → invalid. Counting each type separately would wrongly accept it.',
            misconceptions: {
              0: 'Even length is necessary, not sufficient. "([)]" has even length and is still invalid.',
              2: 'Any bracket type may appear inside any other. Only crossing is forbidden.',
              3: 'Crossing brackets are not nested: "(" opens, "[" opens, then ")" would close "(" while "[" is still open inside it.',
            },
            deeper: 'Three separate counters (one per type) only check that each type is balanced, not that they nest. The stack is needed because it remembers the ORDER in which brackets were opened.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach — next greater element',
        blocks: [
          {
            type: 'text',
            md: 'Now the second, deeper use of stacks. Problem: for each index, find the **next greater element** to its right (or −1). For `[2, 1, 2, 4, 3]` the answer is `[4, 2, 4, -1, -1]`. The obvious approach looks right from every index.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n²)',
            code: `function nextGreater(nums) {
  const res = new Array(nums.length).fill(-1);
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[j] > nums[i]) { res[i] = nums[j]; break; }
    }
  }
  return res;
}`,
            caption: 'A decreasing array like [5, 4, 3, 2, 1] makes every inner loop run to the end: n²/2 comparisons.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-4',
            question: 'In `[5, 1, 2, 3, 9]`, the value 9 is the next greater element for 5, and also for 3. When we meet 9, which earlier indices are still "waiting" for an answer?',
            options: [
              'Only 3',
              'All of them: 5, 1, 2, 3',
              'Only 5 and 3 — 1 and 2 already found their answers (2 and 3) earlier',
              'None; 9 is the last element',
            ],
            answer: 2,
            explanation: '1 was answered by 2, and 2 by 3. Only 5 and 3 are still waiting. Notice the waiting values (5, 3) are in DECREASING order — that is not a coincidence, and it is what the monotonic stack exploits.',
            misconceptions: {
              0: '5 is still waiting too: 1, 2 and 3 are all smaller than 5.',
              1: '1 found 2 and 2 found 3 as soon as those arrived. They stopped waiting.',
              3: 'Being last does not matter; 9 is the answer for the waiting elements before it.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — the monotonic stack',
        blocks: [
          {
            type: 'text',
            md: `Keep a stack of **indices still waiting** for their next greater element. Claim: their values are always **decreasing** from bottom to top. Why? If a smaller value were below a larger one, the larger one would have arrived after it — and would have answered it, so it would no longer be waiting.

For each new value \`x\`:
1. **While** the top's value is smaller than \`x\`: \`x\` is the next greater element of the top. Pop it and record the answer.
2. Push the current index — it now waits for its own answer.

Indices left on the stack at the end have no greater element → \`-1\`.`,
          },
          {
            type: 'visual',
            scenario: 'monotonic-stack',
            input: { nums: [2, 1, 2, 4, 3] },
            caption: 'Each new value pops every smaller waiting value — they have found their next greater element.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why O(n)? (amortized argument)',
            md: 'The inner `while` can pop many items in one step, so a single iteration may cost O(n). But **each index is pushed exactly once and popped at most once** over the whole run. Total pops ≤ n, total pushes = n → O(n) overall. Same "count the total, not per iteration" reasoning as the sliding window.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-5',
            question: 'For **next greater** element we keep a stack with decreasing values. What changes for **next smaller** element?',
            options: [
              'Keep an increasing stack and pop while the top is greater than the current value',
              'Nothing — the same stack answers both',
              'Iterate from right to left with the same comparison',
              'Use a queue instead of a stack',
            ],
            answer: 0,
            explanation: 'Mirror the comparison: now a new value answers every waiting value that is BIGGER than it, so we pop while top > x, which leaves the stack increasing.',
            misconceptions: {
              1: 'A decreasing stack only pops when something bigger arrives; it cannot detect smaller values.',
              2: 'Scanning right-to-left is a valid alternative formulation (you keep candidates instead of waiters), but you still must flip the comparison for "smaller".',
              3: 'The waiting elements are resolved most-recent-first, which is LIFO. A queue would resolve the oldest first — wrong.',
            },
            deeper: 'Summary table: next greater → decreasing stack, pop while top < x. Next smaller → increasing stack, pop while top > x. After popping, whatever remains on top is the PREVIOUS greater (or smaller) element of x — one pass gives both directions.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why popped elements can never be the answer for anyone later?',
            deeper: 'Suppose value 3 is popped by value 7 at a later index. For any index after 7, if 3 were greater than it, then 7 (which is closer and bigger) would also be greater — and 7 comes first. So 3 is "shadowed" by 7 forever. Throwing 3 away loses nothing. This shadowing argument is the heart of every monotonic stack (and of the monotonic deque in the next topic).',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Monotonic stack — next greater (store indices)',
            code: `const res = new Array(n).fill(-1);
const st = [];                           // indices, values decreasing
for (let i = 0; i < n; i++) {
  while (st.length && nums[st.at(-1)] < nums[i]) {
    const j = st.pop();
    res[j] = nums[i];                    // or i - j for a distance
  }
  st.push(i);
}`,
          },
          {
            type: 'code',
            title: 'Circular array — iterate twice',
            code: `for (let k = 0; k < 2 * n; k++) {
  const i = k % n;
  while (st.length && nums[st.at(-1)] < nums[i]) res[st.pop()] = nums[i];
  if (k < n) st.push(i);                 // push each index only once
}`,
          },
          {
            type: 'code',
            title: 'Context stack — nested structures (decode string, calculators)',
            code: `const st = [];
let cur = initialState();
for (const token of input) {
  if (token === '(' || token === '[') { st.push(cur); cur = initialState(); }
  else if (token === ')' || token === ']') { cur = combine(st.pop(), cur); }
  else cur = extend(cur, token);
}`,
          },
        ],
      },

      // ---------- expression evaluation ----------
      {
        id: 'optimized-expression',
        title: 'Optimized approach — evaluating expressions',
        blocks: [
          {
            type: 'text',
            md: `**Reverse Polish Notation (RPN)** writes the operator *after* its operands: \`3 4 +\` means 3 + 4, and \`2 1 + 3 *\` means (2 + 1) × 3. No parentheses are needed. Evaluate with one stack:

- number → push it;
- operator → pop **b** (the right operand, popped first), pop **a**, push \`a op b\`.

**Basic calculator with + − and parentheses** (e.g. \`"1 - (4 + 5 - 2) + 3"\`). Keep a running \`result\` and the current \`sign\` (+1 or −1):
- digit → build the whole number, then \`result += sign * number\`;
- \`+\` / \`−\` → set \`sign\`;
- \`(\` → **push** \`result\` and \`sign\` (the outer context), then reset \`result = 0, sign = 1\` to evaluate the inside;
- \`)\` → the inside is finished: \`result = savedResult + savedSign * result\`.

This is called a **sign stack**: it remembers, for each open parenthesis, what to add the inner value to and with which sign.`,
          },
          {
            type: 'dryrun',
            title: 'Calculator: "1 - (4 + 5 - 2) + 3"',
            columns: ['token', 'result', 'sign', 'stack', 'note'],
            rows: [
              ['1', '1', '+1', '[]', 'result += 1'],
              ['-', '1', '-1', '[]', ''],
              ['(', '0', '+1', '[1, -1]', 'save outer (1, −), reset'],
              ['4', '4', '+1', '[1, -1]', ''],
              ['+ 5', '9', '+1', '[1, -1]', ''],
              ['- 2', '7', '-1', '[1, -1]', ''],
              [')', '1 + (−1)·7 = −6', '', '[]', 'combine with saved context'],
              ['+ 3', '-3', '+1', '[]', 'answer −3'],
            ],
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-6',
            question: 'Evaluating RPN `["4", "13", "5", "/", "+"]`. At "/", which is computed?',
            options: [
              '5 / 13',
              '4 / 13',
              '13 / 5 = 2 (truncated), then 4 + 2 = 6',
              '13 / 5 = 2.6, then 4 + 2.6 = 6.6',
            ],
            answer: 2,
            explanation: 'The first pop gives the RIGHT operand (5), the second pop the LEFT operand (13). 13 / 5 truncated toward zero is 2, then 4 + 2 = 6.',
            misconceptions: {
              0: 'Popping order reversed: the first popped value is the right-hand side, so it is 13 / 5, not 5 / 13.',
              1: '4 is deeper in the stack; the operator uses the two values on top (13 and 5).',
              3: 'Integer division is required — use Math.trunc(a / b). Math.floor would be wrong for negative results.',
            },
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Valid parentheses',
            code: `function isValid(s) {
  const open = { ')': '(', ']': '[', '}': '{' };
  const st = [];
  for (const ch of s) {
    if (ch in open) {
      if (st.pop() !== open[ch]) return false;   // pop() of [] is undefined → false
    } else {
      st.push(ch);
    }
  }
  return st.length === 0;
}`,
          },
          {
            type: 'code',
            title: 'Daily temperatures — distance to the next greater',
            code: `function dailyTemperatures(t) {
  const ans = new Array(t.length).fill(0);
  const st = [];                                  // indices of days still waiting
  for (let i = 0; i < t.length; i++) {
    while (st.length && t[st[st.length - 1]] < t[i]) {
      const j = st.pop();
      ans[j] = i - j;
    }
    st.push(i);
  }
  return ans;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`arr.at(-1)\` is a readable peek (ES2022). \`arr[arr.length - 1]\` is equally fast and works everywhere.
- \`[].pop()\` returns \`undefined\` rather than throwing — convenient for bracket matching, dangerous elsewhere (silent \`NaN\` in arithmetic). Check \`length\` when an empty pop would be a bug.
- Preallocate result arrays with \`new Array(n).fill(-1)\`.
- Division: \`Math.trunc(-7 / 2) === -3\` but \`Math.floor(-7 / 2) === -4\`. Problems that say "truncate toward zero" need \`Math.trunc\`.`,
          },
        ],
      },

      // ---------- design ----------
      {
        id: 'optimized-design',
        title: 'Optimized approach — design problems',
        blocks: [
          {
            type: 'text',
            md: `**Min stack.** Keeping a single variable \`min\` fails: after popping the minimum, what is the new minimum? You would have to rescan. The fix: store, **with each entry**, the minimum of everything at or below it. A stack only changes at the top, so that stored value stays correct for as long as the entry exists.

\`\`\`text
push 5 → [(5,5)]
push 2 → [(5,5), (2,2)]
push 7 → [(5,5), (2,2), (7,2)]   getMin = 2
pop    → [(5,5), (2,2)]          getMin = 2
pop    → [(5,5)]                 getMin = 5  ← recovered for free
\`\`\`

**Queue from two stacks.** Push into \`inbox\`. To dequeue, take from \`outbox\`; if \`outbox\` is empty, pour **all** of \`inbox\` into it (this reverses the order, so the oldest element ends on top).`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Amortized O(1) for the two-stack queue',
            md: 'One dequeue may pour n elements — O(n) for that call. But follow a single element: it is pushed onto inbox once, moved to outbox once, and popped from outbox once. Three O(1) moves per element, ever. So n operations cost O(n) in total → **amortized O(1)** per operation. The key rule: only pour when outbox is empty, otherwise newer elements would land on top of older ones.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-7',
            question: 'In the two-stack queue, inbox = [3, 4] (4 on top) and outbox = [2, 1] (1 on top). Someone calls dequeue. What happens?',
            options: [
              'Pour inbox into outbox first, then pop → returns 3',
              'Pop from inbox → returns 4',
              'Pop from outbox → returns 1; inbox is untouched because outbox is not empty',
              'Pour outbox back into inbox, then pop → returns 2',
            ],
            answer: 2,
            explanation: 'outbox already holds the oldest elements in queue order (1 is oldest). Pour only when outbox is empty. So dequeue returns 1.',
            misconceptions: {
              0: 'Pouring now would put 3 and 4 on top of 1 and 2, so newer items would come out before older ones — FIFO broken.',
              1: 'inbox top is the NEWEST element. A queue removes the oldest.',
              3: 'Pouring back and forth makes each operation O(n) and is never needed.',
            },
          },
        ],
      },

      // ---------- histogram / contribution ----------
      {
        id: 'optimized-boundaries',
        title: 'Optimized approach — previous smaller boundaries (histogram)',
        blocks: [
          {
            type: 'text',
            md: `**Largest rectangle in a histogram.** Any rectangle is as tall as its **shortest** bar. So for each bar \`i\`, imagine it is the shortest bar of the rectangle: extend left and right until you hit a **shorter** bar.

- left boundary = index of the **previous smaller** bar,
- right boundary = index of the **next smaller** bar,
- area = \`heights[i] × (right − left − 1)\`.

With an **increasing** stack, both come for free at pop time: when bar \`j\` is popped by bar \`i\` (because \`heights[i]\` is smaller), \`i\` is its next smaller, and the new top of the stack is its previous smaller. A sentinel height 0 at the end pops everything that remains.`,
          },
          {
            type: 'dryrun',
            title: 'largestRectangleArea([2, 1, 5, 6, 2, 3])',
            columns: ['i', 'h', 'pops (height × width)', 'stack after (indices)', 'best'],
            rows: [
              ['0', '2', '—', '[0]', '0'],
              ['1', '1', '2 × (1 − (−1) − 1) = 2', '[1]', '2'],
              ['2', '5', '—', '[1,2]', '2'],
              ['3', '6', '—', '[1,2,3]', '2'],
              ['4', '2', '6 × 1 = 6; 5 × 2 = 10', '[1,4]', '10'],
              ['5', '3', '—', '[1,4,5]', '10'],
              ['6 (sentinel 0)', '0', '3 × 1 = 3; 2 × 4 = 8; 1 × 6 = 6', '[6]', '10'],
            ],
            note: 'Bar 5 (height 5) is popped by index 4, and after popping, index 1 is on top → width = 4 − 1 − 1 = 2.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-8',
            question: 'When bar j is popped by the current index i in the histogram algorithm, why is its width `i − top − 1` (top = new stack top after popping)?',
            options: [
              'Because every rectangle has width 1',
              'Because top is the previous SMALLER bar and i is the next SMALLER bar; bar j can extend over everything strictly between them',
              'Because i − j is always the width',
              'Because the stack stores widths',
            ],
            answer: 1,
            explanation: 'Any bar strictly between top and j must be at least as tall as bar j — a shorter one would still be on the stack between them. Any bar between j and i is also at least as tall — it was pushed after j and popped before i arrived or by i. So a rectangle of height heights[j] fits over the whole open interval (top, i): width i − top − 1.',
            misconceptions: {
              0: 'Rectangles can span several bars — that is the whole point.',
              2: 'i − j only counts the bars to the right of j. Bars on the left that are taller than j also belong to the rectangle.',
              3: 'The stack stores indices; widths are computed from them.',
            },
          },
          {
            type: 'text',
            md: `**Contribution technique — sum of subarray minimums.** Instead of looping over all O(n²) subarrays, flip the question: *for each element, in how many subarrays is it the minimum?*

If \`left[i]\` = number of choices for the left end (distance to the previous smaller element) and \`right[i]\` = choices for the right end (distance to the next smaller element), then element i is the minimum of exactly \`left[i] × right[i]\` subarrays, and

\`\`\`text
answer = Σ nums[i] × left[i] × right[i]
\`\`\`

**Duplicates.** In \`[2, 2]\` the subarray \`[2, 2]\` has two equal minimums. If both sides use "strictly smaller" as the boundary, both 2s claim it — double counting. If both use "smaller or equal", neither claims it. Fix: **strict on one side, non-strict on the other** — e.g. previous *strictly* smaller on the left, next *smaller-or-equal* on the right. Then each subarray is credited to exactly one minimum (the leftmost one, with this choice).`,
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-9',
            question: '`arr = [3, 1, 2, 4]`. Using contribution, in how many subarrays is `1` (index 1) the minimum?',
            options: [
              '2',
              '4',
              '8',
              '6',
            ],
            answer: 3,
            explanation: 'No smaller element exists on either side. Left ends can be index 0 or 1 → 2 choices. Right ends can be 1, 2 or 3 → 3 choices. 2 × 3 = 6 subarrays have 1 as their minimum; it contributes 1 × 6 = 6.',
            misconceptions: {
              0: 'That counts only the left choices. Multiply by the right choices too.',
              1: 'That is the array length, not the number of subarrays containing index 1.',
              2: 'Only 6 subarrays contain index 1: left end ∈ {0,1}, right end ∈ {1,2,3}.',
            },
            deeper: 'Checking the total: contributions are 3×(1×1)=3, 1×(2×3)=6, 2×(1×2)=4, 4×(1×1)=4 → 17, which matches summing the minimums of all 10 subarrays by hand.',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — next greater element',
        blocks: [
          {
            type: 'dryrun',
            title: 'nextGreater([2, 1, 2, 4, 3])',
            columns: ['i', 'nums[i]', 'pops (index → answer)', 'stack (values)', 'res'],
            rows: [
              ['0', '2', '—', '[2]', '[-1,-1,-1,-1,-1]'],
              ['1', '1', '—', '[2,1]', '[-1,-1,-1,-1,-1]'],
              ['2', '2', '1 → 2', '[2,2]', '[-1,2,-1,-1,-1]'],
              ['3', '4', '2 → 4, 0 → 4', '[4]', '[4,2,4,-1,-1]'],
              ['4', '3', '—', '[4,3]', '[4,2,4,-1,-1]'],
            ],
            note: 'At i = 2 the value 2 does NOT pop the earlier 2 because we pop only while top < current (strictly). Equal values keep waiting.',
          },
          {
            type: 'checkpoint',
            id: 'stack-cp-10',
            question: 'In the dry run, the stack at i = 2 contains values [2, 2]. Is that allowed in a "decreasing" monotonic stack?',
            options: [
              'No, it is a bug — the stack must be strictly decreasing',
              'Yes — with "pop while top < x", equal values are not popped, so the stack is non-increasing; that matches "next STRICTLY greater"',
              'Yes, because stacks may hold anything in any order',
              'No, duplicates must be removed from the input first',
            ],
            answer: 1,
            explanation: 'The comparison decides how duplicates behave. `<` gives a non-increasing stack and answers "next strictly greater". `<=` would pop equal values and answer "next greater or equal". Pick the comparison that matches the problem.',
            misconceptions: {
              0: 'Strictness of the stack follows from the comparison, and here we want "strictly greater" answers, so equal values must keep waiting.',
              2: 'A monotonic stack is only useful because it keeps its order. Arbitrary order would break the shadowing argument.',
              3: 'Duplicates are normal input; the comparison handles them.',
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
            md: `1. **Using \`shift\`/\`unshift\`** for stack operations — O(n) each. Use \`push\`/\`pop\` at the end.
2. **Not checking the stack is empty** at the end of bracket matching.
3. **Operand order** — in \`a − b\` and \`a ÷ b\`, \`b\` is popped first.
4. **Math.floor instead of Math.trunc** for division toward zero.
5. **Storing values instead of indices** in monotonic stacks when you need distances/positions.
6. **\`if\` instead of \`while\`** — one new element can pop many.
7. **Duplicates** — choose \`<\` vs \`<=\` deliberately; for contribution counting use strict on one side only.
8. **Forgetting the sentinel** in histogram problems (bars left on the stack are never measured).
9. **Min stack with one global min** — cannot recover after popping the minimum.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n)',
            space: 'O(n)',
            md: `- Push, pop, peek: **O(1)** (JavaScript \`push\` is amortized O(1) because the array occasionally grows its storage).
- Matching / expression evaluation: each token is pushed and popped at most once → **O(n)**.
- Monotonic stack: each index pushed once, popped at most once → **O(n)** amortized, even with a \`while\` inside the \`for\`.
- Queue via two stacks: each element moves at most three times → **amortized O(1)** per operation.
- Space: the stack can hold every element in the worst case (e.g. "((((((" or a strictly decreasing array) → **O(n)**.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say what the stack holds** — "indices of days that haven't found a warmer day yet, temperatures decreasing". That one sentence proves you understand the invariant.
- **Justify O(n)** with "each index is pushed and popped at most once".
- **Clarify duplicates**: "next greater" strictly or "greater or equal"?
- For calculators, **ask about precedence, parentheses, unary minus and spaces** before coding.
- If recursion depth could be huge (deep nesting), mention that an explicit stack avoids a call-stack overflow in JavaScript.`,
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
              { api: 'push / pop', use: 'Stack operations at the end of an array', complexity: 'O(1) amortized' },
              { api: 'arr.at(-1)', use: 'Peek the top', complexity: 'O(1)' },
              { api: 'Stack (toolkit)', use: 'Explicit push/pop/peek/isEmpty/size API', complexity: 'O(1)' },
              { api: 'new Array(n).fill(-1)', use: 'Result array for next greater/smaller', complexity: 'O(n)' },
              { api: 'Math.trunc', use: 'Integer division toward zero', complexity: 'O(1)' },
              { api: 'str.repeat(k)', use: 'Decode string: repeat the inner part k times', complexity: 'O(k · len)' },
              { api: "ch >= '0' && ch <= '9'", use: 'Digit test while parsing numbers', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Nested structures (brackets, expressions, k[...] encodings)', 'Undo / cancel the most recent item', 'Next/previous greater or smaller element', 'Histogram rectangles, sum of subarray minimums'],
    clues: ['valid parentheses', 'evaluate', 'reverse polish', 'decode', 'collide', 'next greater', 'days until warmer', 'span', 'histogram', 'sum of subarray minimums'],
    template: `const st = [];
for (let i = 0; i < n; i++) {
  while (st.length && nums[st.at(-1)] < nums[i]) {
    const j = st.pop();   // nums[i] is j's next greater
  }
  st.push(i);
}`,
    complexity: 'O(n) time (each item pushed/popped once), O(n) space',
    mistakes: ['shift/unshift instead of push/pop', 'non-empty stack at the end', 'operand order', 'Math.floor vs Math.trunc', 'if instead of while', 'duplicates: strict vs non-strict', 'missing sentinel'],
    jsTools: ['push', 'pop', 'at(-1)', 'Math.trunc', 'repeat', 'Stack (toolkit)'],
  },

  keyConcepts: [
    'LIFO: the most recent unmatched item is always on top — perfect for nesting.',
    'Bracket matching: push openers, a closer must match the top, the stack must end empty.',
    'Expressions: operands wait on the stack; a sign/context stack handles parentheses.',
    'Min stack stores the minimum-so-far with every entry; two stacks make a queue with amortized O(1).',
    'Monotonic stack: pop while the new value beats the top — the new value is the popped item\'s next greater/smaller; each index pushed and popped once → O(n).',
    'Previous and next smaller boundaries give each bar\'s widest rectangle (histogram).',
    'Contribution: Σ value × leftChoices × rightChoices; strict on one side, non-strict on the other for duplicates.',
  ],

  interviewTips: [
    'State the stack invariant ("indices waiting, values decreasing").',
    'Justify O(n) by counting pushes and pops.',
    'Ask about duplicates, precedence and unary minus up front.',
  ],
};
