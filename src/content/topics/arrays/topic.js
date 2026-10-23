export default {
  id: 'arrays',
  summary: 'Arrays and strings are numbered rows of values: read any slot instantly by index, walk them with loops, edit them in place, treat grids as arrays of rows, and build strings efficiently.',

  jsTools: [
    { api: 'arr[i] / arr.at(-1)', use: 'Read or write a slot by index (at(-1) = last element)', complexity: 'O(1)' },
    { api: 'new Array(n).fill(0)', use: 'Pre-sized array of zeros (counts, results)', complexity: 'O(n)' },
    { api: 'Array.from({ length: m }, () => new Array(n).fill(0))', use: 'm × n matrix with independent rows', complexity: 'O(m·n)' },
    { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Swap two elements in place', complexity: 'O(1)' },
    { api: 'parts.push(s); parts.join("")', use: 'Build a long string in linear time', complexity: 'O(total length)' },
    { api: 's[i] / s.charCodeAt(i)', use: 'Read a character / its code without creating substrings', complexity: 'O(1)' },
    { api: 'str.split("") / [...str]', use: 'Turn an immutable string into a mutable array of characters', complexity: 'O(n)' },
    { api: 'str.repeat(k) / padEnd(w)', use: 'Build runs of spaces or characters', complexity: 'O(k)' },
  ],

  patterns: [
    {
      id: 'array-traversal-running-state',
      name: 'Single Pass with Running State',
      summary: 'Walk the array once, carrying a few variables (current streak, best so far, minimum so far) that summarise everything seen to the left.',
      whyItExists: 'Many questions about "the best X so far" only depend on a small summary of the prefix, not on the whole prefix. Keeping that summary up to date in O(1) per element turns an O(n²) "check every pair/range" into O(n).',
      whenToUse: ['Longest streak / run of something', '"Best pair where i < j" (buy before sell)', 'Anything answerable with a running min, max, count or sum'],
      clues: ['"consecutive"', '"maximum profit"', '"buy before you sell" (i < j)', '"longest run"'],
      whenNotToUse: ['The answer needs information from the right side too → consider a second (backward) pass or prefix/suffix arrays', 'You need arbitrary range queries → prefix sums (later topic)'],
      template: `function onePass(nums) {
  let best = 0;       // answer so far
  let state = 0;      // summary of the prefix (streak, min, sum…)
  for (const x of nums) {
    state = update(state, x);      // O(1)
    best = Math.max(best, score(state, x));
  }
  return best;
}`,
      variations: [
        { name: 'Streak counter', description: 'Reset a counter when the run breaks (max consecutive ones).' },
        { name: 'Running minimum', description: 'Best pair with i < j: keep the min to the left and compare with the current element (stock profit).' },
        { name: 'Carry from the right', description: 'Walk backwards when the dependency flows right-to-left (plus one).' },
      ],
      mistakes: ['Forgetting to record the last streak after the loop ends', 'Initialising best with 0 when negatives are possible', 'Updating the state before using its old value when the order matters'],
      evolution: {
        easy: 'Count a streak or track a running min/max.',
        medium: 'Two running values that interact (min so far + best profit).',
        hard: 'Running state that is a DP value (Kadane, stock with cooldown) — DP topics.',
      },
    },
    {
      id: 'array-in-place-reversal',
      name: 'In-place Rewrite & Reversal',
      summary: 'Modify the array inside its own memory (O(1) extra space) using swaps, reversals and careful write positions.',
      whyItExists: 'Interviewers often ask for O(1) extra space. Reversing segments, swapping, or using the array itself as storage (markers in the first row/column) avoids copying.',
      whenToUse: ['"do it in place" / "O(1) extra space"', 'Rotations and reversals', 'Marking information inside the input instead of a separate array'],
      clues: ['"in-place"', '"do not return anything, modify nums"', '"O(1) extra memory"', '"rotate"'],
      whenNotToUse: ['The caller needs the original array intact', 'In-place logic becomes much harder to read and memory is not constrained — mention both options'],
      template: `function reverse(a, lo, hi) {        // reverse a[lo..hi] in place
  while (lo < hi) {
    [a[lo], a[hi]] = [a[hi], a[lo]];
    lo++; hi--;
  }
}
// rotate right by k: reverse all, reverse first k, reverse the rest
function rotate(nums, k) {
  const n = nums.length; k %= n;
  reverse(nums, 0, n - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, n - 1);
}`,
      variations: [
        { name: 'Triple reversal', description: 'Rotate an array (or words in a string) by reversing three segments.' },
        { name: 'Markers inside the input', description: 'Use the first row/column of a matrix to remember which rows/cols to zero.' },
        { name: 'Grow at the front', description: 'Plus one on 999 → [1, 0, 0, 0]: the only case that needs a new slot.' },
      ],
      mistakes: ['Forgetting k %= n (k can exceed the length)', 'Overwriting a value before reading it (use temp or a swap)', 'Returning a new array when the caller checks the mutated input'],
      evolution: {
        easy: 'Reverse an array, plus one with carry.',
        medium: 'Rotate by k, set matrix zeroes with O(1) space.',
        hard: 'Cycle-following permutations, first missing positive (index-as-hash).',
      },
    },
    {
      id: 'matrix-traversal-layers',
      name: 'Matrix Traversal: Rows, Columns, Layers & Rotation',
      summary: 'A matrix is an array of rows: matrix[r][c]. Walk it row by row, column by column, layer by layer (spiral), or transform it with transpose + reverse.',
      whyItExists: 'Grid problems are array problems in two dimensions. Knowing the index formulas (transpose swaps r and c; clockwise rotation = transpose then reverse each row) and boundary bookkeeping (top/bottom/left/right) turns messy geometry into simple loops.',
      whenToUse: ['Spiral / zig-zag / diagonal orders', 'Rotate or flip an image', 'Row- or column-wide updates'],
      clues: ['"matrix"', '"m x n grid"', '"spiral order"', '"rotate the image by 90 degrees"', '"in place"'],
      whenNotToUse: ['Connectivity questions (islands, shortest path in a grid) → graph BFS/DFS topics'],
      template: `// spiral: shrink four boundaries after each side
let top = 0, bottom = m - 1, left = 0, right = n - 1;
while (top <= bottom && left <= right) {
  for (let c = left; c <= right; c++) visit(top, c);      top++;
  for (let r = top; r <= bottom; r++) visit(r, right);    right--;
  if (top <= bottom) { for (let c = right; c >= left; c--) visit(bottom, c); bottom--; }
  if (left <= right) { for (let r = bottom; r >= top; r--) visit(r, left);   left++; }
}

// rotate n×n clockwise in place: transpose, then reverse each row
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    [a[i][j], a[j][i]] = [a[j][i], a[i][j]];
for (const row of a) row.reverse();`,
      variations: [
        { name: 'Counter-clockwise rotation', description: 'Transpose, then reverse each column (or reverse each row first, then transpose).' },
        { name: '180° rotation', description: 'Reverse the order of rows, then reverse each row.' },
        { name: 'Spiral generation', description: 'Same boundaries, but write 1, 2, 3, … instead of reading (Spiral Matrix II).' },
      ],
      mistakes: ['Transposing with j starting at 0 (swaps every pair twice → no change)', 'Missing the `top <= bottom` / `left <= right` re-checks in spiral (duplicates on a single row/column)', 'Creating rows with new Array(m).fill([]) — every row is the SAME array'],
      evolution: {
        easy: 'Row/column sums, transpose, flip.',
        medium: 'Spiral order, rotate image, set matrix zeroes.',
        hard: 'Diagonal traversals with arbitrary shapes, in-place cycle rotation of layers.',
      },
    },
    {
      id: 'array-prefix-suffix-products',
      name: 'Prefix & Suffix Passes',
      summary: 'For each index, combine an aggregate of everything to its LEFT with an aggregate of everything to its RIGHT, computed by one forward and one backward pass.',
      whyItExists: '"Everything except me" = (everything before me) ⊕ (everything after me). Computing both sides from scratch for every index is O(n²); two sweeps compute them all in O(n) — without division.',
      whenToUse: ['"product/sum/max of all elements except nums[i]"', 'Each answer depends on both sides of the index', 'Division is forbidden or zeros make it unsafe'],
      clues: ['"except self"', '"without using division"', '"left and right of i"', '"max to the left and max to the right" (trapping rain water, later)'],
      whenNotToUse: ['Only the left side matters → a single running-state pass', 'Many arbitrary range queries → full prefix-sum array (Prefix Sum topic)'],
      template: `function exceptSelf(nums) {
  const n = nums.length, out = new Array(n);
  let left = 1;                        // product of nums[0..i-1]
  for (let i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
  let right = 1;                       // product of nums[i+1..n-1]
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}`,
      variations: [
        { name: 'Prefix/suffix max', description: 'leftMax[i], rightMax[i] — used in trapping rain water (Two Pointers topic).' },
        { name: 'Prefix sums', description: 'prefix[i] = sum of the first i elements — the Prefix Sum topic generalises this.' },
      ],
      mistakes: ['Using division (breaks on zeros)', 'Off-by-one: out[i] must use the product BEFORE multiplying nums[i] in', 'Allocating two extra arrays when the output array can hold one side'],
      evolution: {
        easy: 'Running totals from one side.',
        medium: 'Product except self with O(1) extra space.',
        hard: 'Combining prefix and suffix information with other structures (candy, trapping rain water).',
      },
    },
    {
      id: 'string-builder',
      name: 'String Building & Character Processing',
      summary: 'Strings are immutable: collect pieces in an array (or write into a char array) and join once; read characters by index instead of slicing.',
      whyItExists: 'In JavaScript every string operation that "changes" a string actually creates a new one. Building output piece by piece with parts.push + join, and inspecting with s[i], keeps the work linear and the code clear.',
      whenToUse: ['Producing a formatted string (justify text, number to words)', 'Merging / interleaving strings', 'Run-length encoding and compression'],
      clues: ['"return the resulting string"', '"format"', '"compress"', '"alternately"', '"in words"'],
      whenNotToUse: ['Very short fixed-size output — a template literal is clearer', 'Problems that are really about counting characters → Hashing topic'],
      template: `function build(words) {
  const parts = [];
  for (const w of words) {
    parts.push(w);           // O(1) amortized
  }
  return parts.join('');     // one O(total length) pass
}

// run-length groups: i scans, j finds the end of the run
for (let i = 0; i < s.length; ) {
  let j = i;
  while (j < s.length && s[j] === s[i]) j++;
  emit(s[i], j - i);
  i = j;
}`,
      variations: [
        { name: 'Char array as a buffer', description: 'Write into an array at a write index (string compression in place).' },
        { name: 'Chunking', description: 'Process a number in groups of 3 digits (integer to English words).' },
        { name: 'Greedy line packing', description: 'Fit as many words as possible per line, then distribute spaces (text justification).' },
      ],
      mistakes: ['Trying to assign s[i] = "x" (silently ignored — strings are immutable)', 'Using s += inside hot loops and then slicing repeatedly', 'Forgetting to flush the last group/line after the loop'],
      evolution: {
        easy: 'Merge alternately, reverse words.',
        medium: 'Run-length compression, zig-zag conversion.',
        hard: 'Text justification, integer to English words — many edge cases, careful formatting.',
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
            md: `An **array** is a row of numbered boxes. Box numbers (**indexes**) start at \`0\`:

\`\`\`text
index:   0    1    2    3    4
value: [ 7 ][ 2 ][ 9 ][ 4 ][ 1 ]
\`\`\`

Because the boxes are numbered, you can jump straight to any box: \`arr[3]\` is \`4\` — no searching needed. That instant access is the superpower of arrays.

A **string** is a row of characters that behaves like a read-only array: \`"hello"[1]\` is \`"e"\`, and \`"hello".length\` is 5.

A **matrix** (2-D grid) is an array of rows: \`grid[r][c]\` is the value in row \`r\`, column \`c\`.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Index** — the position number of an element, from \`0\` to \`length − 1\`.
- **Random access** — reading/writing any index in O(1) time.
- **Traversal** — visiting elements one by one, usually with a loop.
- **In place** — changing the input's own memory instead of building a new array (O(1) extra space).
- **Immutable** — cannot be changed after creation. JavaScript **strings are immutable**; arrays are mutable.
- **Subarray / substring** — a contiguous piece; **subsequence** — elements in order but possibly with gaps.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'An array is a street of numbered houses. If you know the house number you walk straight there (O(1)). But inserting a new house between #2 and #3 means renumbering every house after it (O(n)) — that is why inserting at the front of an array is expensive.',
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-1',
            question: 'Why is `arr[50000]` just as fast as `arr[0]` in an array of 100,000 numbers?',
            options: [
              'The engine searches from both ends at once',
              'Elements sit in consecutive slots, so the position of slot i can be computed directly (start + i × slot size)',
              'Arrays are sorted automatically',
              'It is not — later indexes are slower',
            ],
            answer: 1,
            explanation: 'Contiguous storage means the address of element i is a simple formula. No scanning is involved, so any index is O(1).',
            misconceptions: {
              0: 'No searching happens at all when you use an index — that is the whole point of random access.',
              2: 'JavaScript never sorts arrays unless you call sort(). Access by index has nothing to do with order of values.',
              3: 'Index access is O(1) regardless of position. What IS slower is *searching* for a value (includes/indexOf), which is O(n).',
            },
            deeper: 'JS engines store "packed" arrays of numbers in contiguous memory like C arrays. Arrays with holes (`a[1000000] = 1` on an empty array) may fall back to a slower dictionary mode — another reason to pre-size with `new Array(n).fill(0)` rather than writing far indexes.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Almost every interview problem gives you an array or a string. The patterns in later topics (hashing, two pointers, sliding windows, prefix sums, DP) are all built on the basic moves you learn here:

| Operation | Cost | Why |
|---|---|---|
| read / write \`arr[i]\` | O(1) | direct slot |
| \`push\` / \`pop\` (end) | O(1) amortized | nothing else moves |
| \`unshift\` / \`shift\` / \`splice\` in the middle | O(n) | everything after the slot must move |
| search for a value (\`includes\`, \`indexOf\`) | O(n) | must look at each element |
| copy (\`slice\`, \`[...a]\`) | O(n) | new array |
| \`s[i]\` on a string | O(1) | read-only access |
| "change" a string (\`s + t\`, \`s.slice\`, \`replace\`) | O(length) | creates a new string |`,
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-2',
            question: 'You run `const s = "cat"; s[0] = "b";`. What is `s` afterwards?',
            options: ['"bat"', '"cat" — strings are immutable, the assignment is ignored (or throws in strict mode)', '"bcat"', 'undefined'],
            answer: 1,
            explanation: 'JavaScript strings cannot be changed. In sloppy mode the write is silently ignored; in strict mode (modules, classes) it throws a TypeError. To "edit" a string, build a new one: `"b" + s.slice(1)`, or convert to an array, edit, and `join`.',
            misconceptions: {
              0: 'That is how it works in C with char arrays, but not in JavaScript. Strings are immutable values.',
              2: 'Index assignment never inserts. And for strings it does nothing at all.',
              3: 'The variable still holds the original string; nothing was cleared.',
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
            md: `Reach for plain array techniques when:

1. The answer can be computed in **one or two passes** keeping a few variables (running state).
2. You must modify the input **in place** with O(1) extra memory.
3. The data is a **grid** and the problem is about positions (spiral, rotation, rows/columns) rather than connectivity.
4. You need to **produce a string** in a specific format.

When a single pass is not enough, later topics add tools: remember values in a **hash map** (Hashing), walk **two indexes** (Two Pointers), keep a **window** (Sliding Window), or precompute **prefix sums**.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Ask the interviewer',
            md: '"May I modify the input?" and "Do you need O(1) extra space?" These two questions decide whether you copy the array or edit it in place.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"consecutive" / "streak" with a simple rule', '"in-place", "O(1) extra space"', '"rotate", "reverse"', '"matrix", "spiral", "rotate the image"', '"except self", "without division"', '"return the formatted string", "compress"'],
            conclusion: 'Think array traversal: running state, in-place rewrite, matrix layers, prefix/suffix passes or string building',
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-3',
            question: '"Return an array where answer[i] is the product of all elements except nums[i], in O(n) and without division." Which idea fits?',
            options: [
              'Nested loops multiplying everything except i',
              'Sort the array first',
              'Compute the total product and divide by nums[i]',
              'A forward pass for products to the left and a backward pass for products to the right',
            ],
            answer: 3,
            explanation: '"Except self" = (everything left of i) × (everything right of i). One sweep each way computes all of them in O(n).',
            misconceptions: {
              0: 'Correct but O(n²) — the constraints demand O(n).',
              1: 'Sorting moves elements, so answer[i] would no longer correspond to the original index — and it does not help compute products.',
              2: 'Division is explicitly forbidden, and it breaks when nums contains 0.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — one pass with running state',
        blocks: [
          {
            type: 'text',
            md: `Most array questions ask about **pairs** or **ranges**. Checking all of them is O(n²). The key question that unlocks O(n) is:

> *"When I stand at index i, what do I need to know about everything to my left?"*

If the answer is **a small summary** — a count, the minimum so far, the best so far — then keep that summary in variables and update it in O(1) as you move right.

Example — **best time to buy and sell a stock** (\`prices = [7, 1, 5, 3, 6, 4]\`, buy on one day, sell on a later day): if I sell today, the best buy day is simply the **cheapest day before today**. So I only need \`minSoFar\`.`,
          },
          {
            type: 'dryrun',
            title: 'Running minimum for max profit',
            columns: ['day', 'price', 'minSoFar (before)', 'profit if sold today', 'best'],
            rows: [
              ['0', '7', '—', '—', '0'],
              ['1', '1', '7', '−6', '0'],
              ['2', '5', '1', '4', '4'],
              ['3', '3', '1', '2', '4'],
              ['4', '6', '1', '5', '5'],
              ['5', '4', '1', '3', '5'],
            ],
            note: 'One pass, two variables → O(n) time, O(1) space.',
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-4',
            question: 'In the stock problem, why is it enough to remember only the minimum price seen so far?',
            options: [
              'Because for a fixed selling day, profit = price − buyPrice is largest when buyPrice is smallest, and only earlier days are allowed',
              'Because the minimum is always on day 0',
              'Because we sort the prices first',
              'Because the maximum price is always last',
            ],
            answer: 0,
            explanation: 'Fix the sell day j. Among all buy days i < j, the best is the one with the smallest price. That single number summarises the whole prefix.',
            misconceptions: {
              1: 'In the example the minimum is on day 1. The running minimum changes as we scan.',
              2: 'Sorting destroys the time order — you could end up "buying" after "selling".',
              3: 'Prices can go anywhere. We try every day as the sell day and keep the best.',
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
            md: 'Take **rotate array**: move every element k steps to the right, wrapping around (`[1,2,3,4,5,6,7]`, k = 3 → `[5,6,7,1,2,3,4]`). The most literal idea: rotate by one step, k times.',
          },
          {
            type: 'code',
            title: 'Rotate one step at a time — O(n·k) time',
            code: `function rotate(nums, k) {
  k %= nums.length;
  for (let step = 0; step < k; step++) {
    const last = nums.pop();     // O(1)
    nums.unshift(last);          // O(n): everything shifts right
  }
}`,
            caption: 'Correct, but k unshifts × n moves each. With n = k = 10^5 that is 10^10 moves.',
          },
          {
            type: 'code',
            title: 'Extra array — O(n) time, O(n) space',
            code: `function rotate(nums, k) {
  const n = nums.length;
  const copy = nums.slice();
  for (let i = 0; i < n; i++) nums[(i + k) % n] = copy[i]; // new position
}`,
            caption: 'Fast, but uses a full copy. Can we do it with O(1) extra space?',
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — in-place reversal',
        blocks: [
          {
            type: 'text',
            md: `The trick: **reversing** is easy to do in place (swap ends, move inward), and rotation can be written as three reversals.

\`\`\`text
nums = [1 2 3 4 | 5 6 7], k = 3
reverse all          → [7 6 5 | 4 3 2 1]
reverse first k      → [5 6 7 | 4 3 2 1]
reverse the rest     → [5 6 7 | 1 2 3 4]   ✔
\`\`\`

**Why it works:** rotation moves the last k elements (block B) in front of the first n − k (block A): \`A B → B A\`. Reversing everything gives \`rev(B) rev(A)\` — the blocks are in the right order but each is backwards. Reversing each block again fixes them.`,
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-5',
            question: 'nums has length 7 and k = 10. What must you do before the three reversals?',
            options: [
              'Nothing — reversing handles any k',
              'Set k = k % 7 = 3, because rotating by 7 brings the array back to where it started',
              'Throw an error, k must be smaller than n',
              'Set k = 7 − 10',
            ],
            answer: 1,
            explanation: 'Rotating by n is a full circle. So only k mod n matters. Without it, "reverse the first k" would read past the end of the array.',
            misconceptions: {
              0: 'reverse(nums, 0, k − 1) with k = 10 would touch indexes 7, 8, 9 that do not exist, creating undefined holes.',
              2: 'The problem allows any k ≥ 0. Normalising is the expected fix.',
              3: 'A negative k would make no sense for the reversal indices. The correct normalisation is modulo.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Running state (one pass)',
            code: `let best = 0, state = initial;
for (let i = 0; i < nums.length; i++) {
  state = update(state, nums[i]);   // e.g. streak = nums[i] === 1 ? streak + 1 : 0
  best = Math.max(best, state);
}`,
          },
          {
            type: 'code',
            title: 'In-place reverse of a segment',
            code: `function reverse(a, lo, hi) {
  while (lo < hi) {
    [a[lo], a[hi]] = [a[hi], a[lo]];
    lo++; hi--;
  }
}`,
          },
          {
            type: 'code',
            title: 'Carry from the right (digits)',
            code: `for (let i = digits.length - 1; i >= 0; i--) {
  if (digits[i] < 9) { digits[i]++; return digits; } // no carry left
  digits[i] = 0;                                       // 9 + 1 → 0, carry on
}
digits.unshift(1);   // all nines: 999 → 1000 (the only O(n) front insert)
return digits;`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Rotate array in place — O(n) time, O(1) space',
            code: `function rotate(nums, k) {
  const n = nums.length;
  k %= n;
  const reverse = (lo, hi) => {
    while (lo < hi) {
      [nums[lo], nums[hi]] = [nums[hi], nums[lo]];
      lo++; hi--;
    }
  };
  reverse(0, n - 1);   // whole array
  reverse(0, k - 1);   // first k
  reverse(k, n - 1);   // the rest
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`[a[i], a[j]] = [a[j], a[i]]\` swaps neatly; in very hot loops a \`temp\` variable is slightly faster (no temporary array).
- \`arr.reverse()\` reverses the **whole** array in place; for a segment, write your own loop.
- \`for (const x of arr)\` when you need values, \`for (let i = 0; …)\` when you need indexes. Avoid \`for…in\` on arrays — it iterates string keys, including inherited ones.
- \`arr.at(-1)\` reads the last element without \`arr[arr.length - 1]\`.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'rotate([1,2,3,4,5,6,7], 3)',
            columns: ['step', 'range reversed', 'array'],
            rows: [
              ['start', '—', '[1,2,3,4,5,6,7]'],
              ['1', '0..6', '[7,6,5,4,3,2,1]'],
              ['2', '0..2', '[5,6,7,4,3,2,1]'],
              ['3', '3..6', '[5,6,7,1,2,3,4]'],
            ],
            note: 'Each element is swapped at most twice → about n swaps in total.',
          },
        ],
      },
      {
        id: 'intuition-matrix',
        title: 'Core intuition — matrices',
        blocks: [
          {
            type: 'text',
            md: `A matrix with \`m\` rows and \`n\` columns is \`m\` arrays of length \`n\`:

\`\`\`text
          c=0 c=1 c=2
r=0   [ [ 1,  2,  3 ],
r=1     [ 4,  5,  6 ],
r=2     [ 7,  8,  9 ] ]      grid[1][2] === 6
\`\`\`

- **Row traversal:** outer loop over r, inner over c (reads rows left to right).
- **Column traversal:** outer loop over c, inner over r.
- **Neighbours of (r, c):** (r−1, c), (r+1, c), (r, c−1), (r, c+1) — always check bounds \`0 ≤ r < m\`, \`0 ≤ c < n\`.
- **Transpose:** swap \`grid[i][j]\` with \`grid[j][i]\` — rows become columns.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'The shared-row trap',
            md: '`new Array(3).fill(new Array(3).fill(0))` creates ONE inner array and puts the same reference in all 3 slots — writing `grid[0][0] = 1` changes every row! Use `Array.from({ length: m }, () => new Array(n).fill(0))`.',
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-6',
            question: 'To rotate an n × n matrix 90° **clockwise** in place, which sequence works?',
            options: [
              'Reverse each row, then reverse the order of the rows',
              'Transpose only',
              'Transpose, then reverse each row',
              'Reverse the order of the rows, then reverse each row',
            ],
            answer: 2,
            explanation: 'Clockwise rotation sends (r, c) to (c, n−1−r). Transposing sends (r, c) to (c, r); reversing each row then sends column r to column n−1−r. Together: (c, n−1−r). ✔',
            misconceptions: {
              0: 'Reversing rows and then the row order is a 180° rotation, not 90°.',
              1: 'A transpose is a reflection over the main diagonal — the top row becomes the left column, but in the wrong order.',
              3: 'That is also a 180° rotation. You need exactly one "diagonal" step (the transpose) to get a 90° turn.',
            },
            deeper: 'Check on [[1,2],[3,4]]: transpose → [[1,3],[2,4]]; reverse rows → [[3,1],[4,2]]. The clockwise rotation of the original is indeed [[3,1],[4,2]]. For counter-clockwise: transpose, then reverse the order of the rows.',
          },
        ],
      },
      {
        id: 'optimized-matrix',
        title: 'Optimized approach — spiral order with four boundaries',
        blocks: [
          {
            type: 'text',
            md: `Spiral order peels the matrix like an onion. Keep four walls: \`top\`, \`bottom\`, \`left\`, \`right\`. Walk one side, then move that wall inward:

1. left → right along \`top\`, then \`top++\`
2. top → bottom along \`right\`, then \`right--\`
3. right → left along \`bottom\` (only if \`top <= bottom\`), then \`bottom--\`
4. bottom → top along \`left\` (only if \`left <= right\`), then \`left++\`

The two re-checks matter for non-square matrices: after the first two sides, a single remaining row or column must not be walked twice.`,
          },
          { type: 'visual', scenario: 'spiral-matrix', caption: 'Each side is walked once and its wall moves inward; on this 3 × 4 matrix the inner layer is a single row, so the re-check skips the bottom side.' },
          {
            type: 'code',
            title: 'Spiral order — O(m·n) time, O(1) extra space (besides the output)',
            code: `function spiralOrder(matrix) {
  const out = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the `if (top <= bottom)` check is needed for a 3 × 4 matrix but never triggers for a square one?',
            deeper: `Take a 3 × 4 matrix. After the outer layer, only the middle row \`[6, 7]\` is left: top = bottom = 1. Step 1 walks it left → right and sets top = 2. Now top > bottom — there is no bottom row left. Without the check, step 3 would walk row 1 **again** from right to left, adding 7, 6 a second time.

In a square matrix the last layer is either a single cell or a full ring, and the while condition catches it. Rectangles are what expose the bug — always test with 1 × n, n × 1 and 3 × 4 shapes.`,
          },
        ],
      },
      {
        id: 'optimized-prefix-suffix',
        title: 'Optimized approach — prefix & suffix passes',
        blocks: [
          {
            type: 'text',
            md: `**Product of array except self**: \`[1, 2, 3, 4]\` → \`[24, 12, 8, 6]\`.

For each i: answer[i] = (product of everything **left** of i) × (product of everything **right** of i).

\`\`\`text
nums      =  1   2   3   4
leftProd  =  1   1   2   6     (product of elements before i)
rightProd = 24  12   4   1     (product of elements after i)
answer    = 24  12   8   6
\`\`\`

We can store \`leftProd\` directly in the output array, then sweep right-to-left with a single running variable \`right\`, multiplying it in. Extra space: O(1) beyond the output.`,
          },
          {
            type: 'visual',
            scenario: 'prefix-sum',
            input: { nums: [1, 2, 3, 4] },
            caption: 'The same "running total from the left" idea, shown with sums. Products work identically; the Prefix Sum topic develops it further.',
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-7',
            question: 'In the forward pass we write `out[i] = left; left *= nums[i];`. Why is the assignment BEFORE the multiplication?',
            options: [
              'It is arbitrary; swapping the two lines gives the same result',
              'Because out[i] must be the product of elements strictly BEFORE i, so nums[i] must not be included yet',
              'To avoid overflow',
              'Because multiplication is slow',
            ],
            answer: 1,
            explanation: '"Except self" means nums[i] must be excluded. At the moment we write out[i], `left` holds nums[0] × … × nums[i−1]. Only afterwards do we fold nums[i] in, ready for index i + 1.',
            misconceptions: {
              0: 'Swapping would include nums[i] in its own answer — out would become the inclusive prefix product.',
              2: 'Order does not change the magnitude of the numbers involved.',
              3: 'Both orders do the same number of multiplications; it is about correctness.',
            },
          },
        ],
      },
      {
        id: 'implementation-strings',
        title: 'JavaScript implementation — building strings',
        blocks: [
          {
            type: 'text',
            md: `Because strings are **immutable**, every "edit" creates a new string. In a loop, \`s += piece\` can (in the worst case) copy the whole string each time → O(n²). Engines often optimise simple appends, but the reliably linear approach is:

\`\`\`js
const parts = [];
for (...) parts.push(piece);
return parts.join('');
\`\`\`

To *modify* characters, convert to an array first: \`const chars = s.split('')\` (or \`[...s]\` for full Unicode code points), edit, then \`chars.join('')\`.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Repeated concatenation',
              code: `let out = '';
for (let i = 0; i < n; i++) {
  out += word1[i] ?? '';
  out += word2[i] ?? '';
}`,
            },
            right: {
              title: 'Collect + join once',
              code: `const out = [];
for (let i = 0; i < n; i++) {
  if (i < word1.length) out.push(word1[i]);
  if (i < word2.length) out.push(word2[i]);
}
return out.join('');`,
            },
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-8',
            question: 'Run-length compress `"aaabcc"` → `"a3bc2"`. Which loop structure avoids off-by-one bugs?',
            options: [
              'Compare s[i] with s[i+1] and emit when they differ, then hope the last run is handled',
              'Use s.split(s[0]) to find runs',
              'For each i, j scans forward while s[j] === s[i]; emit s[i] and (j − i) if > 1; then jump i = j',
              'Count every character with indexOf',
            ],
            answer: 2,
            explanation: 'The "i finds a run start, j finds its end" loop handles every run — including the last one — the same way. Each index is touched a constant number of times → O(n).',
            misconceptions: {
              0: 'This works but needs a special case after the loop to flush the final run — the most common bug in compression problems.',
              1: 'split on one character only separates that character; it does not find runs of every letter.',
              3: 'indexOf finds positions of one character, restarts scanning, and ignores contiguity — O(n²) and wrong for "aba".',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the nested `while` in the run-length loop is still O(n) overall?',
            deeper: '`i` jumps directly to `j` after each run, so `j` never revisits an index: across the whole loop `j` moves from 0 to n exactly once. That is the same amortized argument you saw in the Complexity topic — a pointer that never moves backwards bounds the total work.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Off-by-one** — valid indexes are \`0 … length − 1\`; \`arr[arr.length]\` is \`undefined\`, not an error.
2. **Forgetting the last group** — streaks, runs and lines that end at the end of the array need to be recorded after the loop (or use the i/j run loop).
3. **\`k\` larger than n** — normalise with \`k %= n\`.
4. **Shared rows** — \`new Array(m).fill([])\` shares one row; use \`Array.from\`.
5. **Mutating strings** — \`s[i] = 'x'\` does nothing; build a new string.
6. **\`sort()\` without a comparator** — sorts numbers as strings: \`[10, 9, 1].sort()\` → \`[1, 10, 9]\`.
7. **Hidden O(n) calls** in loops — \`shift\`, \`unshift\`, \`splice\`, \`includes\`, \`slice\`.
8. **Returning instead of mutating** — for "modify in place" problems the grader checks the input array.`,
          },
          {
            type: 'checkpoint',
            id: 'arrays-cp-9',
            question: '`const grid = new Array(2).fill(new Array(2).fill(0)); grid[0][0] = 5;` What is `grid`?',
            options: ['[[5,0],[0,0]]', '[[5,0],[5,0]]', '[[5,5],[0,0]]', 'It throws an error'],
            answer: 1,
            explanation: '`fill` puts the **same** inner array object into both slots. Changing it through grid[0] is visible through grid[1].',
            misconceptions: {
              0: 'That is what you would get with independent rows, e.g. `Array.from({ length: 2 }, () => [0, 0])`.',
              2: 'grid[0][0] only touches index 0 of the (shared) row.',
              3: 'Nothing is illegal here — which is exactly why the bug is sneaky.',
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
            time: 'O(n) for one or two passes; O(m·n) for a matrix',
            space: 'O(1) extra for in-place / running state; O(n) when you copy or build output',
            md: '**Time:** a constant number of passes, each O(1) per element. **Space:** a few variables for running state; in-place rewrites need no extra array. The output array/string itself is usually not counted as "extra" space — say so explicitly in interviews.',
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Clarify**: may I mutate the input? Empty input possible? Negative numbers? Unicode strings?
- **Say the brute force** (all pairs / extra copy), then what summary you can carry instead.
- **Name the invariant**: "\`minSoFar\` is the cheapest price on any earlier day."
- **Test shapes, not just values** for matrices: 1 × 1, 1 × n, n × 1, rectangular.
- **For strings**, mention immutability and that you build with an array + \`join\`.`,
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
              { api: 'arr[i], arr.at(-1)', use: 'Direct read/write; last element', complexity: 'O(1)' },
              { api: 'push / pop', use: 'Grow or shrink at the end', complexity: 'O(1) amortized' },
              { api: 'arr.reverse()', use: 'Reverse the whole array in place', complexity: 'O(n)' },
              { api: 'Array.from({ length: m }, () => new Array(n).fill(0))', use: 'Independent matrix rows', complexity: 'O(m·n)' },
              { api: 'parts.join("")', use: 'Build strings linearly', complexity: 'O(total length)' },
              { api: 'str.split("") / [...str]', use: 'Mutable char array from a string', complexity: 'O(n)' },
              { api: '" ".repeat(k)', use: 'k spaces (text justification)', complexity: 'O(k)' },
              { api: 'String(n) / Number(s)', use: 'Convert between numbers and digit strings', complexity: 'O(digits)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['One-pass questions with a small running summary', 'In-place edits with O(1) extra space', 'Matrix position problems (spiral, rotate, zero rows/cols)', 'Formatting and building strings'],
    clues: ['consecutive / streak', 'in-place', 'rotate', 'spiral', 'except self', 'without division', 'compress', 'justify'],
    template: `// rotate right by k in place
k %= n; reverse(0, n-1); reverse(0, k-1); reverse(k, n-1);
// rotate matrix clockwise: transpose, then reverse each row
// except-self: out[i] = leftProduct; then sweep right with rightProduct`,
    complexity: 'O(n) / O(m·n) time; O(1) extra space for in-place and running-state solutions',
    mistakes: ['off-by-one on the last group', 'k not reduced mod n', 'shared rows from fill([])', 'assigning to s[i]', 'sort() without comparator'],
    jsTools: ['arr[i]', 'push/pop', 'reverse', 'Array.from', 'join', 'split', 'repeat'],
  },

  keyConcepts: [
    'Index access is O(1); inserting/removing anywhere but the end is O(n).',
    'Ask "what summary of the left side do I need?" to turn O(n²) scans into one pass.',
    'In-place tricks: swaps, triple reversal for rotation, using the input as scratch space.',
    'A matrix is an array of rows; clockwise rotation = transpose + reverse each row.',
    'Spiral traversal keeps four shrinking boundaries and re-checks them before the last two sides.',
    'Prefix and suffix passes combine "everything left" with "everything right" in O(n).',
    'JavaScript strings are immutable: collect pieces in an array and join once.',
  ],

  interviewTips: [
    'Ask whether mutating the input is allowed and whether O(1) extra space is required.',
    'Test matrices with rectangular and single-row/column shapes.',
    'Mention string immutability and array + join when building output.',
  ],
};
