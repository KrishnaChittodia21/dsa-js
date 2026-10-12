export default {
  id: 'backtracking',
  summary: 'Build a solution one choice at a time; after exploring everything that follows a choice, undo it and try the next one — a depth-first walk over a tree of decisions.',

  jsTools: [
    { api: 'path.push(x) / path.pop()', use: 'Choose and undo on the shared partial solution', complexity: 'O(1) amortized' },
    { api: '[...path] / path.slice()', use: 'Snapshot the current path before storing it in the results', complexity: 'O(k) for a path of length k' },
    { api: 'new Array(n).fill(false)', use: '`used[]` flags for permutations', complexity: 'O(1) read / write' },
    { api: 'new Set()', use: 'Occupied columns / diagonals in N-Queens, digits in a Sudoku row', complexity: 'add / has / delete: O(1) average' },
    { api: 'nums.sort((a, b) => a - b)', use: 'Group duplicates and enable early `break` pruning (numeric comparator!)', complexity: 'O(n log n)' },
    { api: 'str.slice(i, j)', use: 'Take the next piece when partitioning a string', complexity: 'O(j − i)' },
    { api: 'arr.join("")', use: 'Turn a character path into the final string once, at the leaf', complexity: 'O(k)' },
  ],

  patterns: [
    {
      id: 'backtracking-subsets',
      name: 'Backtracking — Subsets (include / exclude)',
      summary: 'For every element decide "take it" or "skip it". Every node of the decision tree (not just the leaves) is a valid subset.',
      whyItExists: 'A set of n items has 2ⁿ subsets. There is no shortcut when you must *list* them all, but backtracking lists each one exactly once with O(n) extra memory by reusing a single path array.',
      whenToUse: [
        'Generate all subsets / the power set',
        'Every combination of "use or don\'t use" each item (subset sums, subset XOR totals)',
        'Subsets without duplicates when the input has repeated values (sort + skip)',
      ],
      clues: ['"all subsets"', '"power set"', '"every possible selection"', '"the solution set must not contain duplicate subsets"', 'n ≤ 20'],
      whenNotToUse: [
        'You only need a count or the best value and subproblems overlap → Dynamic Programming',
        'n is large (> ~25): 2ⁿ is too many to list',
      ],
      template: `function subsets(nums) {
  const result = [];
  const path = [];
  function backtrack(start) {
    result.push([...path]);                 // every node is an answer
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                   // choose
      backtrack(i + 1);                     // explore (only later elements)
      path.pop();                           // undo
    }
  }
  backtrack(0);
  return result;
}`,
      variations: [
        { name: 'Binary include/exclude recursion', description: '`dfs(i)`: call once with nums[i] added, once without. Leaves (i === n) are the subsets.' },
        { name: 'Subsets with duplicates', description: 'Sort, then skip `nums[i] === nums[i − 1]` when `i > start` so equal values at the same depth are tried once.' },
        { name: 'Bitmask enumeration', description: 'Iterate mask from 0 to 2ⁿ − 1; bit j set ⇔ nums[j] is taken. Iterative, no recursion.' },
      ],
      mistakes: [
        'Pushing `path` itself instead of a copy — every stored subset ends up as the same (finally empty) array',
        'Forgetting `path.pop()` after the recursive call',
        'Starting the loop at 0 instead of `start` → produces reorderings like [2,1] as well as [1,2]',
      ],
      evolution: {
        easy: 'List / sum over all subsets of distinct values.',
        medium: 'Subsets with duplicate values (sort + skip), subsets meeting a size or sum constraint.',
        hard: 'Partition into k equal-sum subsets — subsets combined with heavy pruning and memo/bitmask.',
      },
    },
    {
      id: 'backtracking-permutations',
      name: 'Backtracking — Permutations (used[] array)',
      summary: 'Fill positions one by one; at each position try every element that is not already used. Leaves at depth n are the permutations.',
      whyItExists: 'Order matters in a permutation, so unlike subsets we may pick an earlier index later. A `used[]` array (instead of a start index) tells us which elements are still available in O(1).',
      whenToUse: ['All orderings / arrangements of the input', 'Arrangements that must satisfy a rule checked position by position'],
      clues: ['"all permutations"', '"all possible orderings / arrangements"', '"every order"', 'n ≤ 8–10'],
      whenNotToUse: [
        'You only need the *next* permutation → a linear in-place algorithm exists',
        'You need a count → n! formula or DP',
      ],
      template: `function permute(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  function backtrack() {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);   // choose
      backtrack();                          // explore
      path.pop(); used[i] = false;          // undo BOTH
    }
  }
  backtrack();
  return result;
}`,
      variations: [
        { name: 'Swap-based permutations', description: 'Swap nums[start] with each nums[i ≥ start], recurse on start + 1, swap back. No used[] needed.' },
        { name: 'Permutations with duplicates', description: 'Sort; skip i when nums[i] === nums[i − 1] and !used[i − 1].' },
      ],
      mistakes: ['Undoing `path` but forgetting to reset `used[i]`', 'Using a start index (that produces combinations, not permutations)'],
      evolution: {
        easy: 'Permutations of a short distinct list.',
        medium: 'Permutations with duplicates; arrangements with adjacency rules.',
        hard: 'Constraint arrangements (N-Queens is "a permutation of columns" with diagonal rules).',
      },
    },
    {
      id: 'backtracking-combinations',
      name: 'Backtracking — Combinations & Combination Sum',
      summary: 'Choose k items (or items reaching a target) where order does not matter. A start index guarantees each group is generated in one canonical (increasing-index) order.',
      whyItExists: '{1,2} and {2,1} are the same combination. Forcing indices to increase along the path means each combination has exactly one path in the tree, so there are no duplicates to filter afterwards.',
      whenToUse: ['Choose k of n', 'Pick numbers that sum to a target (with or without reuse)', 'Any "group" where order is irrelevant'],
      clues: ['"combinations of k numbers"', '"sum to target"', '"may be chosen an unlimited number of times"', '"each number may only be used once"', '"unique combinations"'],
      whenNotToUse: ['You only need the number of combinations → DP (coin change II style) or a binomial formula'],
      template: `function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);          // enables break-pruning
  const result = [];
  const path = [];
  function backtrack(start, remaining) {
    if (remaining === 0) { result.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) break;  // sorted → all later ones too big
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]); // i (reuse) or i + 1 (no reuse)
      path.pop();
    }
  }
  backtrack(0, target);
  return result;
}`,
      variations: [
        { name: 'Reuse allowed', description: 'Recurse with `i` — the same element may be chosen again.' },
        { name: 'Each element once', description: 'Recurse with `i + 1`.' },
        { name: 'Duplicates in input', description: 'Sort and skip `i > start && c[i] === c[i − 1]`.' },
        { name: 'Size-k pruning', description: 'Stop the loop when there are not enough elements left to reach size k.' },
      ],
      mistakes: ['Recursing with `start` instead of `i` (re-picks earlier elements → duplicates in different orders)', 'Using `continue` where `break` is valid (slower) or `break` on an unsorted array (wrong)'],
      evolution: {
        easy: 'Choose k of small n; binary-watch style "k bits on".',
        medium: 'Combination Sum I/II/III — reuse vs no reuse vs duplicates.',
        hard: 'Combinations under several interacting constraints with aggressive pruning.',
      },
    },
    {
      id: 'backtracking-string-construction',
      name: 'Backtracking — Building & Splitting Strings',
      summary: 'Build an output string character by character (phone letters, parentheses) or cut an input string into pieces (palindrome partitioning, inserting operators) — each position is one decision.',
      whyItExists: 'Many "generate all strings" problems are a decision tree where depth = position in the string. Validity rules (open ≤ n, piece is a palindrome, running value of an expression) are checked while building, so invalid branches die early.',
      whenToUse: ['Generate every string that obeys a grammar or rule', 'Split a string into valid pieces', 'Insert operators / separators between digits'],
      clues: ['"all possible letter combinations"', '"generate all valid / well-formed"', '"partition s such that every substring is…"', '"insert +, -, * between digits"', '"restore IP addresses"'],
      whenNotToUse: ['You only need to know whether a split exists or how many → DP (word break)'],
      template: `function partition(s) {
  const result = [];
  const path = [];
  function backtrack(start) {
    if (start === s.length) { result.push([...path]); return; }
    for (let end = start + 1; end <= s.length; end++) {
      const piece = s.slice(start, end);
      if (!isValid(piece)) continue;   // prune invalid cuts
      path.push(piece);
      backtrack(end);
      path.pop();
    }
  }
  backtrack(0);
  return result;
}`,
      variations: [
        { name: 'Counters instead of a path check', description: 'Generate Parentheses tracks `open` and `close` counts so only valid prefixes are ever built.' },
        { name: 'Carry extra state down', description: 'Expression Add Operators carries the running value and the last operand to undo precedence for `*`.' },
      ],
      mistakes: ['Building strings with `+=` on a shared variable and forgetting to restore it', 'Allowing numbers with leading zeros ("05") when the problem forbids them'],
      evolution: {
        easy: 'Map each digit to letters and combine.',
        medium: 'Balanced parentheses, palindrome partitioning.',
        hard: 'Operators with precedence (expression add operators), removing invalid parentheses.',
      },
    },
    {
      id: 'backtracking-constraint',
      name: 'Backtracking — Constraint Satisfaction (N-Queens, Sudoku)',
      summary: 'Place items one slot at a time; before each placement check the constraints in O(1) with Sets/arrays; on a dead end, remove the item and try the next value.',
      whyItExists: 'The raw search space is astronomically large (9⁸¹ Sudoku fillings, n^n queen placements). Checking the rules *as you place* prunes whole subtrees the moment one rule is broken.',
      whenToUse: ['Place pieces so that no two conflict', 'Fill a grid so that every row/column/box obeys a rule', 'Puzzles where a partial placement can be judged invalid immediately'],
      clues: ['"no two queens attack each other"', '"fill the empty cells"', '"each row, column and box must contain…"', '"return all distinct solutions"'],
      whenNotToUse: ['Constraints cannot be checked until the very end (then backtracking is plain brute force)', 'Huge inputs — use specialised solvers or math'],
      template: `function solveNQueens(n) {
  const cols = new Set(), diag = new Set(), anti = new Set();
  const queenCol = [];                        // queenCol[row] = column
  const result = [];
  function place(row) {
    if (row === n) { result.push(render(queenCol)); return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(row - c) || anti.has(row + c)) continue;
      cols.add(c); diag.add(row - c); anti.add(row + c); queenCol.push(c);
      place(row + 1);
      cols.delete(c); diag.delete(row - c); anti.delete(row + c); queenCol.pop();
    }
  }
  place(0);
  return result;
}`,
      variations: [
        { name: 'Count solutions only', description: 'N-Queens II: same search, increment a counter at the leaf.' },
        { name: 'Stop at the first solution', description: 'Sudoku: return true up the stack as soon as the board is full, so the filled board is kept.' },
        { name: 'Bitmask constraints', description: 'Replace Sets with integers and bit operations for a big constant-factor speed-up.' },
      ],
      mistakes: ['Checking conflicts by scanning the board (O(n) per check) instead of keeping Sets', 'Forgetting to remove from EVERY constraint set on undo', 'Sudoku: resetting the cell even after a successful solve (erases the answer)'],
      evolution: {
        easy: 'Check whether a given board is valid.',
        medium: 'Count or list placements for small n.',
        hard: 'N-Queens, Sudoku solver — full constraint search with O(1) checks.',
      },
    },
    {
      id: 'backtracking-grid-path',
      name: 'Backtracking — Grid Paths (mark visited, then restore)',
      summary: 'Walk a grid cell by cell; mark the current cell as used so the path cannot revisit it, explore the 4 neighbours, then unmark it so other paths may use it.',
      whyItExists: 'A cell may be part of many different candidate paths. A global "visited forever" flag (as in flood fill) would wrongly block other paths, so the mark must be undone when we backtrack.',
      whenToUse: ['Find whether a word/path exists in a grid where cells cannot be reused within one path', 'Longest / all simple paths in a small grid'],
      clues: ['"adjacent cells (horizontally or vertically)"', '"the same cell may not be used more than once"', '"word exists in the grid"'],
      whenNotToUse: ['Reachability or shortest path where cells can be marked once forever → plain DFS/BFS (Graphs topic)'],
      template: `function exist(board, word) {
  const R = board.length, C = board[0].length;
  function dfs(r, c, k) {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= R || c >= C || board[r][c] !== word[k]) return false;
    const saved = board[r][c];
    board[r][c] = '#';                         // mark visited (choose)
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) ||
                  dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = saved;                       // restore (undo)
    return found;
  }
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) if (dfs(r, c, 0)) return true;
  return false;
}`,
      variations: [
        { name: 'Many words at once', description: 'Word Search II: walk a Trie alongside the grid (Tries topic).' },
        { name: 'Collect-the-most', description: 'Path with maximum gold: same mark/restore, track the best sum.' },
      ],
      mistakes: ['Not restoring the cell — later start positions see a corrupted board', 'Marking visited before checking the character matches'],
      evolution: {
        easy: 'Does a short path exist in a tiny grid.',
        medium: 'Word Search, maximum gold path.',
        hard: 'Word Search II (Trie + backtracking), unique paths III (visit every cell exactly once).',
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
            md: `**Backtracking** is a way to list (or search through) every possible answer by making **one choice at a time**, and — when a choice has been fully explored — **taking it back** and trying the next one.

Say you want every subset of \`[1, 2, 3]\`. You can think of it as three yes/no questions: *take 1? take 2? take 3?* Each answer splits the possibilities in two, and drawing every split gives a tree:

\`\`\`text
                      []
            take 1 /       \\ skip 1
               [1]           []
          /       \\       /      \\
      [1,2]      [1]    [2]       []
      /   \\     /  \\   /  \\     /  \\
 [1,2,3][1,2][1,3][1][2,3][2]  [3]  []
\`\`\`

Backtracking walks this tree **depth-first**: go all the way down one branch, record what you find, come back up one level, and go down the next branch.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Decision tree / state-space tree** — the tree of all partial choices. The root is "nothing chosen yet"; each edge is one decision.
- **Path (partial solution)** — the choices made from the root to the current node, usually kept in one array \`path\`.
- **Leaf** — a node where no more choices are possible (all positions filled / all elements decided).
- **Pruning** — refusing to walk into a subtree because we already know it cannot contain a valid answer.
- **Choose → Explore → Undo** — the three steps performed for every edge of the tree.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Solving a maze with a piece of chalk: at every junction pick a corridor and mark it. If you hit a dead end, walk **back** to the last junction, rub out the mark, and try the next corridor. You never need a map of the whole maze — only the path you are currently on.',
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-1',
            question: 'In the subsets tree for `[1, 2, 3]` drawn above, what does one **root-to-leaf path** correspond to?',
            options: [
              'One step of a loop over the array',
              'One permutation of the array',
              'One complete set of yes/no decisions — i.e. exactly one subset',
              'One element of the array',
            ],
            answer: 2,
            explanation: 'Each level answers "take this element?" for one element. After all three levels every element has a decision, so the leaf describes one subset. 3 binary decisions → 2³ = 8 leaves = 8 subsets.',
            misconceptions: {
              0: 'A loop step is one *edge* at most. A whole path is a sequence of decisions, one per level.',
              1: 'Subsets ignore order; a take/skip tree never reorders elements. Permutations need a different tree (choose which element goes in each position).',
              3: 'A single element is decided at one level. The path covers every element\'s decision.',
            },
            deeper: 'A useful habit: before coding, say out loud **"what does one level of my tree decide?"** For subsets: one element. For permutations: one position. For N-Queens: the column of the queen in one row. Once you know that, the code almost writes itself.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Many problems ask for **all** answers: all subsets, all orderings, all valid boards. Writing nested loops only works when the number of choices is fixed and small — you cannot write "n nested loops" for an unknown n.

Recursion solves that: **one recursive call = one level of the tree**, so the depth adapts to the input.

Backtracking adds two big wins over "generate every candidate, then filter":

1. **Memory:** we keep *one* path array and modify it in place, instead of creating a new array for every partial candidate.
2. **Pruning:** we check rules *while building*. If the first two queens already attack each other, we skip every board that starts that way — potentially millions of boards — in one step.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Generate everything, then filter',
              md: 'For 8 queens: try every way to put 8 queens on 64 squares (≈ 4.4 billion), then check each board. Hopeless.',
            },
            right: {
              title: 'Backtracking with pruning',
              md: 'Place one queen per row and only on safe squares. The search visits about **15,000** partial boards to find all 92 solutions.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** pruning can make such a huge difference even though the worst case is still exponential?',
            deeper: `Pruning cuts a node **and its entire subtree**. A node at depth 2 of an 8-level tree can have thousands of descendants; rejecting it early skips all of them with one check.

The worst-case bound (e.g. O(n!) for N-Queens) stays exponential because *some* inputs force you to explore a lot — but in practice, good pruning (check constraints as early as possible, try the most constrained choice first, sort so you can \`break\`) is the difference between milliseconds and hours.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use backtracking when:

1. The problem asks you to **list / generate all** answers (or find one answer in a huge search space, like a Sudoku).
2. An answer can be built as a **sequence of choices**.
3. The input is **small** — typical limits are \`n ≤ 10\` (permutations), \`n ≤ 20\` (subsets), a 9×9 board, a word of length ≤ 15.

| Family | One level decides | Loop starts at | Typical size of output |
|---|---|---|---|
| Subsets | take/skip one element | \`start\` | 2ⁿ |
| Combinations | next element of the group | \`start\` (or \`i\`) | C(n, k) |
| Permutations | which element goes in this position | 0 (skip \`used\`) | n! |
| Constraint puzzles | value for one slot | every candidate | usually few |
| Grid paths | next neighbour | 4 directions | depends |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Counting is not listing',
            md: 'If the question only asks **how many** ways or the **best** value (and not the actual lists), check whether subproblems repeat. If they do, Dynamic Programming (later in the curriculum) is usually polynomial where backtracking is exponential.',
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-2',
            question: 'Which problem is the **best** fit for backtracking?',
            options: [
              'Return the number of ways to climb n = 45 stairs taking 1 or 2 steps',
              'Return the maximum sum of a contiguous subarray',
              'Find the index of a target in a sorted array',
              'Return every way to place 6 queens on a 6×6 board so none attack each other',
            ],
            answer: 3,
            explanation: '"Return every way" + a small board + rules that can be checked queen by queen → classic constraint backtracking.',
            misconceptions: {
              0: 'Only a **count** is needed and the subproblems overlap heavily (ways(n) = ways(n−1) + ways(n−2)). Backtracking would enumerate ~1.8 billion paths; DP does it in 45 steps.',
              1: 'A single optimal contiguous range — Kadane\'s algorithm or prefix sums, O(n).',
              2: 'Sorted + find one position → binary search, O(log n).',
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
            clues: ['"return all …"', '"all possible combinations / permutations / subsets"', '"generate all valid …"', 'tiny constraints (n ≤ 10–20, 9×9 board)', '"cannot use the same cell / element twice"', '"place such that no two conflict"'],
            conclusion: 'Think Backtracking: Choose → Explore → Undo',
          },
          {
            type: 'text',
            md: `Then pick the family by asking two questions:

1. **Does order matter?** Yes → permutations (\`used[]\`). No → subsets/combinations (\`start\` index).
2. **Can an element be reused?** Recurse with \`i\` (reuse) or \`i + 1\` (no reuse).

And check for a third detail: **does the input contain duplicates** while the output must not? → sort + skip.`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-3',
            question: '"Given distinct integers and a target, return all unique combinations that sum to target; the same number may be chosen any number of times." In the recursive call after choosing `candidates[i]`, what should the next start index be?',
            options: [
              '`i + 1`, because each number can be used once',
              '`i`, so the same number can be chosen again but earlier numbers cannot',
              '`0`, so every number is available again',
              '`start + 1`',
            ],
            answer: 1,
            explanation: 'Reuse allowed → stay at `i`. Not going back below `i` keeps each combination in non-decreasing index order, so `[2,2,3]` is produced once and `[2,3,2]`, `[3,2,2]` never appear.',
            misconceptions: {
              0: '`i + 1` forbids reuse — you would miss `[2,2,3]` for target 7.',
              2: 'Restarting at 0 generates the same multiset in many orders (`[2,3,2]`, `[3,2,2]`…) — duplicates.',
              3: '`start + 1` ignores which element was actually picked; you could skip over it or re-pick earlier elements depending on i.',
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
            md: `Every backtracking function has the same heartbeat:

\`\`\`text
for each choice available at this level:
    CHOOSE   — apply it to the shared state (path.push, mark used, place queen)
    EXPLORE  — recurse to the next level
    UNDO     — remove it again (path.pop, unmark, remove queen)
\`\`\`

**Why must we undo?** Because there is only **one** \`path\` array, shared by every call. When the recursive call returns, the caller expects \`path\` to look exactly as it did before — otherwise the next choice would be added on top of leftovers from the previous branch.

**Why push a copy?** \`result.push(path)\` stores a *reference* to that one shared array. Later pushes and pops keep changing it, so at the end every entry in \`result\` points to the same (usually empty) array. \`result.push([...path])\` stores a snapshot.`,
          },
          {
            type: 'visual',
            scenario: 'backtracking-subsets',
            input: { nums: [1, 2, 3] },
            caption: 'Watch path grow on the way down (choose), and shrink on the way back up (undo). Each node visited records one subset.',
          },
          {
            type: 'code',
            title: 'The bug you will write at least once',
            code: `const result = [], path = [];
function bt(start) {
  result.push(path);          // ✗ stores a reference to the shared array
  for (let i = start; i < nums.length; i++) {
    path.push(nums[i]); bt(i + 1); path.pop();
  }
}
bt(0);
// nums = [1,2]  →  result = [[], [], [], []]   (4 references to one empty array)`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-4',
            question: 'You forget the `path.pop()` line in subsets of `[1, 2]` (but do push copies). What is the **third** subset recorded (right after `[]` and `[1]`)?',
            options: [
              '`[2]`',
              '`[1, 2]` — correct by luck, the bug only shows later',
              '`[]`',
              'The program throws an error',
            ],
            answer: 1,
            explanation: 'The order is: record [] → push 1 → record [1] → push 2 → record [1,2] (still correct) → return, **no pop** → back in the top call path is [1,2] → push 2 → record [1,2,2]. The bug appears once we return to a previous level and try the next branch, because leftovers from the old branch remain.',
            misconceptions: {
              0: '`[2]` would only be recorded at the top level after 1 had been removed — which never happens without pop.',
              2: 'The empty subset is recorded only once, at the root.',
              3: 'Nothing throws; the output is silently wrong: [[],[1],[1,2],[1,2,2]]. Silent wrong answers are why "undo" must be a reflex.',
            },
            deeper: 'Invariant to remember: **"when a call returns, the shared state is exactly as it was when the call started."** Every push is paired with a pop, every `used[i] = true` with `used[i] = false`, every `set.add` with `set.delete`.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Take **Combination Sum** (`candidates = [2, 3, 6, 7]`, `target = 7` → `[[2,2,3],[7]]`). The naive idea: generate every sequence of candidates whose sum does not exceed the target, then keep the ones that sum to 7, sort each, and de-duplicate with a Set of strings.',
          },
          {
            type: 'code',
            title: 'Brute force — sequences in any order, de-duplicated afterwards',
            code: `function combinationSumBrute(candidates, target) {
  const seen = new Set();
  const result = [];
  function gen(seq, sum) {
    if (sum > target) return;
    if (sum === target) {
      const key = [...seq].sort((a, b) => a - b).join(',');
      if (!seen.has(key)) { seen.add(key); result.push(key.split(',').map(Number)); }
      return;
    }
    for (const c of candidates) gen([...seq, c], sum + c);   // any order, new array each time
  }
  gen([], 0);
  return result;
}`,
            caption: 'Works, but generates [2,2,3], [2,3,2] and [3,2,2] separately, copies arrays at every node, and sorts at every leaf.',
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-5',
            question: 'What is the main waste in the brute force above?',
            options: [
              'Using a Set',
              'The `sum > target` check',
              'It explores every ordering of the same multiset, then throws the repeats away',
              'It uses recursion',
            ],
            answer: 2,
            explanation: 'A combination with k elements can appear in up to k! orders. The brute force walks all of them. Forcing indices to be non-decreasing (start index) makes each combination have exactly **one** path, so nothing needs to be thrown away.',
            misconceptions: {
              0: 'The Set is a symptom of the problem (it removes duplicates), not the cause.',
              1: 'That check is pruning — it *saves* work.',
              3: 'The optimized version is recursive too. The issue is *which* branches are explored.',
            },
          },
        ],
      },
      {
        id: 'optimized-subsets',
        title: 'Optimized approach — subsets (include / exclude)',
        blocks: [
          {
            type: 'text',
            md: `There are two equally good ways to write subsets. Both produce 2ⁿ subsets.

**A. Binary decision** — level \`i\` decides element \`i\`: include it or not. Answers live at the leaves (\`i === n\`).

**B. Loop with start** — every node is an answer; at each node, try adding each *later* element. This shape generalises directly to combinations and to duplicate handling.`,
          },
          {
            type: 'compare',
            left: {
              title: 'A. include / exclude',
              code: `function subsets(nums) {
  const res = [], path = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...path]); return; }
    path.push(nums[i]);   // include
    dfs(i + 1);
    path.pop();           // undo
    dfs(i + 1);           // exclude
  }
  dfs(0);
  return res;
}`,
            },
            right: {
              title: 'B. loop from start',
              code: `function subsets(nums) {
  const res = [], path = [];
  function dfs(start) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return res;
}`,
            },
          },
          {
            type: 'text',
            md: `### Handling duplicates (Subsets II, Combination Sum II)

With \`nums = [1, 2, 2]\`, version B would produce \`[1,2]\` twice (using the first 2 or the second 2). Fix: **sort**, then at the same level skip a value equal to the previous one:

\`\`\`js
for (let i = start; i < nums.length; i++) {
  if (i > start && nums[i] === nums[i - 1]) continue;  // same value already tried at THIS level
  ...
}
\`\`\`

Why \`i > start\` and not \`i > 0\`? The first element of the loop (\`i === start\`) is always allowed — that is how \`[1, 2, 2]\` (using both 2s at *different* depths) is still produced. We only skip a duplicate as an **alternative at the same depth**.`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-6',
            question: 'Sorted `nums = [1, 2, 2]`. If you wrote `if (i > 0 && nums[i] === nums[i-1]) continue;` (i > 0 instead of i > start), which subset goes missing?',
            options: [
              '`[2]`',
              '`[1, 2]`',
              '`[]`',
              '`[1, 2, 2]` and `[2, 2]`',
            ],
            answer: 3,
            explanation: 'After choosing the first 2 (index 1), the next level starts at index 2. With `i > 0`, index 2 is skipped because nums[2] === nums[1] — so no subset can ever contain both 2s. With `i > start`, index 2 is the first choice of its level and is allowed.',
            misconceptions: {
              0: '`[2]` is produced from the root level using index 1 (the first 2), which is not skipped.',
              1: '`[1, 2]` uses index 1 after index 0, also fine.',
              2: 'The empty set is recorded at the root before any loop runs.',
            },
            deeper: 'Picture the tree: **siblings** are alternatives at the same depth; a **child** is a deeper choice. Duplicate skipping must only compare siblings. The first sibling of every level has `i === start`, so `i > start` means "I am not the first sibling".',
          },
        ],
      },
      {
        id: 'optimized-permutations',
        title: 'Optimized approach — permutations (used[] array)',
        blocks: [
          {
            type: 'text',
            md: `In a permutation **order matters**: \`[2,1,3]\` and \`[1,2,3]\` are different answers. So at each position we may pick *any* element — even one with a smaller index — as long as it is not already in the path.

A \`start\` index would forbid going back to smaller indices, which is exactly wrong here. Instead we keep \`used[i]\` (true when \`nums[i]\` is in the path). Checking it is O(1); \`path.includes(x)\` would be O(n) and also breaks with duplicate values.

The tree has n choices at level 0, n − 1 at level 1, … → n! leaves.`,
          },
          { type: 'visual', scenario: 'backtracking-permutations', caption: "used[] tracks which items are already on the path." },
          {
            type: 'code',
            title: 'Permutations — O(n · n!)',
            code: `function permute(nums) {
  const res = [], path = [];
  const used = new Array(nums.length).fill(false);
  function dfs() {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;  path.push(nums[i]);
      dfs();
      path.pop();      used[i] = false;
    }
  }
  dfs();
  return res;
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the permutations loop starts at `0` (with `used[]`) while the subsets loop starts at `start`?',
            deeper: `\`start\` encodes "only move forward in the array". That produces each *unordered* group exactly once — perfect for subsets and combinations, where [1,2] and [2,1] are the same answer.

Permutations need **every** order, so an element with a smaller index must be allowed to come later: after choosing 3 first, we still need to try 1 and 2. So the loop scans all indices, and \`used[]\` prevents picking the same element twice *within one path*. Swap the two techniques and you get the wrong family: start-from-0 subsets produce reorderings (and even [1,1]); start-index permutations produce only [1,2,3].`,
          },
        ],
      },
      {
        id: 'optimized-combinations',
        title: 'Optimized approach — combinations & pruning',
        blocks: [
          {
            type: 'text',
            md: `Combinations are subsets with a stopping rule (size k or sum = target). Two pruning tricks make them fast:

**1. Sorted candidates → \`break\`.** If candidates are sorted ascending and \`candidates[i] > remaining\`, then every later candidate is also too big — \`break\` the whole loop instead of \`continue\`.

**2. Not enough elements left.** For "choose k of 1..n", if the path needs \`need = k − path.length\` more numbers, the loop variable can go at most to \`n − need + 1\`. Beyond that there are not enough numbers left to finish.`,
          },
          {
            type: 'code',
            title: 'Combinations (choose k of 1..n) with the "enough left" bound',
            code: `function combine(n, k) {
  const res = [], path = [];
  function dfs(start) {
    if (path.length === k) { res.push([...path]); return; }
    const need = k - path.length;
    for (let x = start; x <= n - need + 1; x++) {   // prune: leave room for the rest
      path.push(x);
      dfs(x + 1);
      path.pop();
    }
  }
  dfs(1);
  return res;
}`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-7',
            question: 'In Combination Sum with **sorted** candidates `[2, 3, 6, 7]` and `remaining = 4`, the loop reaches 6. Why is `break` correct (not just `continue`)?',
            options: [
              'Because 6 is even',
              'Because break and continue behave identically in JavaScript loops',
              'Because the path is already full',
              'Because the array is sorted, 7 is also > 4, so no later candidate can fit either',
            ],
            answer: 3,
            explanation: 'Sorting creates monotonicity: once one candidate is too big, all later ones are too. `break` skips them all at once. On an **unsorted** array, `break` would be a bug — a smaller candidate could come later.',
            misconceptions: {
              0: 'Parity is irrelevant — only the comparison with `remaining` matters.',
              1: '`continue` skips one iteration; `break` leaves the loop. The results are the same here only *because* the array is sorted — but `break` does less work.',
              2: 'Combination Sum has no fixed length; the path ends when remaining hits 0.',
            },
          },
        ],
      },
      {
        id: 'optimized-constraints',
        title: 'Optimized approach — constraint backtracking (N-Queens, Sudoku)',
        blocks: [
          {
            type: 'text',
            md: `**N-Queens:** place n queens on an n×n board so none attack each other.

- One level = one **row** (two queens in a row always attack, so exactly one queen per row).
- The choice = which **column** to use in this row.
- Constraints: no shared column, no shared diagonal.

The trick is checking diagonals in O(1). On a "\\\\" diagonal, \`row − col\` is constant; on a "/" anti-diagonal, \`row + col\` is constant. Keep three Sets: \`cols\`, \`diag\` (row − col), \`anti\` (row + col).

\`\`\`text
row-col          row+col
 0 -1 -2 -3       0 1 2 3
 1  0 -1 -2       1 2 3 4
 2  1  0 -1       2 3 4 5
 3  2  1  0       3 4 5 6
\`\`\`

**Sudoku:** one level = one empty cell; the choice = digit 1–9; constraints = row, column and 3×3 box Sets (box index \`Math.floor(r / 3) * 3 + Math.floor(c / 3)\`). Because we want *one* solution, the recursion returns \`true\` as soon as the board is full, and callers **stop undoing** when they get \`true\`, so the filled board survives.`,
          },
          { type: 'visual', scenario: 'n-queens', caption: "Place a queen per row; backtrack as soon as a row has no safe column." },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-8',
            question: 'Two queens at (1, 3) and (3, 1). Which Set detects the conflict?',
            options: [
              '`cols`, because 3 and 1 are both odd',
              '`anti` (row + col): 1 + 3 = 4 and 3 + 1 = 4 → same anti-diagonal',
              '`diag` (row − col): 1 − 3 = −2 and 3 − 1 = 2 → same diagonal',
              'No conflict; they are in different rows and columns',
            ],
            answer: 1,
            explanation: 'Both squares have row + col = 4, so they lie on the same "/" anti-diagonal. Moving down-left keeps row + col constant: (1,3) → (2,2) → (3,1).',
            misconceptions: {
              0: 'Columns are 3 and 1 — different, so `cols` sees no conflict.',
              2: '−2 ≠ 2, so they are **not** on the same "\\\\" diagonal. You computed correctly but concluded wrongly.',
              3: 'Different rows and columns is not enough — queens also attack along diagonals.',
            },
          },
        ],
      },
      {
        id: 'optimized-grid',
        title: 'Optimized approach — grid backtracking (Word Search)',
        blocks: [
          {
            type: 'text',
            md: `In **Word Search** you look for a word by walking between adjacent cells, never reusing a cell within one path.

- One level = one character of the word.
- The choices = the 4 neighbours.
- State to undo = "this cell is on my current path".

We mark the cell (e.g. overwrite it with \`'#'\`) before exploring and **restore the original letter** afterwards. Unlike flood fill, "visited" here means *visited on the current path*, not *ever visited*: a cell that failed as part of one path may be exactly what another path needs.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why Word Search must restore the cell, while "Number of Islands" can leave cells marked forever?',
            deeper: `Islands asks "which cells are connected?" — once a cell is known to belong to an island, that fact never changes, so marking it forever is correct and makes the algorithm O(R·C).

Word Search asks "is there a **path** spelling the word?" Whether a cell can be used depends on which *other* cells are already on the path. Board \`[["A","B"],["C","D"]]\`, word "ABDC": if a failed attempt left B marked, later attempts through B would be wrongly blocked. Restoring makes the state depend only on the current path — the backtracking invariant again.`,
          },
          {
            type: 'text',
            md: `### Carrying state down: Expression Add Operators

Some problems need more than a path. In **Expression Add Operators** (insert \`+ - *\` between digits to hit a target) we carry \`value\` (the expression's value so far) and \`last\` (the last operand added). Multiplication binds tighter, so when we append \`* x\` we must undo the last operand and replace it:

\`\`\`text
value' = value − last + last * x      last' = last * x
\`\`\`

Example: "1+2" has value 3, last 2. Appending "*3" → 3 − 2 + 2·3 = 7 (= 1 + 6), last = 6.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Universal backtracking skeleton',
            code: `function solve(input) {
  const result = [];
  const path = [];                 // shared, mutable partial solution

  function backtrack(state) {
    if (isComplete(state)) {       // leaf / goal
      result.push([...path]);      // SNAPSHOT, never the live array
      return;
    }
    for (const choice of choicesAt(state)) {
      if (!isValid(choice, state)) continue;   // prune (or break if sorted)
      apply(choice);               // CHOOSE
      backtrack(next(state, choice)); // EXPLORE
      revert(choice);              // UNDO — restore exactly what apply changed
    }
  }

  backtrack(initialState);
  return result;
}`,
          },
          {
            type: 'text',
            md: `Fill in the blanks per family:

| Family | state | choicesAt | next | complete |
|---|---|---|---|---|
| Subsets | \`start\` | \`i = start..n−1\` | \`i + 1\` | every node |
| Combination (reuse) | \`start, remaining\` | \`i = start..\` | \`i, remaining − c[i]\` | \`remaining === 0\` |
| Permutations | (\`used[]\`) | all unused \`i\` | — | \`path.length === n\` |
| Partition string | \`start\` | \`end = start+1..n\` | \`end\` | \`start === n\` |
| N-Queens | \`row\` | columns 0..n−1 | \`row + 1\` | \`row === n\` |
| Grid path | \`r, c, k\` | 4 neighbours | \`k + 1\` | \`k === word.length\` |

**Find one vs find all:** to stop at the first solution, make \`backtrack\` return a boolean and \`return true\` immediately when a recursive call returns true.`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-9',
            question: 'In Sudoku you want the board to stay filled after solving. What must the recursion do when a recursive call returns `true`?',
            options: [
              'Undo the digit anyway and continue with the next digit',
              'Clear the whole board and start again',
              'Return `true` immediately without undoing, so the placed digits stay on the board',
              'Push a copy of the board into a result list and keep searching',
            ],
            answer: 2,
            explanation: 'The answer lives in the board itself. Returning `true` straight up the stack skips every undo, so all placed digits remain. Undo only happens on failure.',
            misconceptions: {
              0: 'Undoing after success erases the solution — you end up back at the original puzzle.',
              1: 'That throws away the work and never terminates correctly.',
              3: 'That is the "find all" mode. It works but wastes time after a unique solution is found, and the board argument is what gets checked.',
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
            title: 'Subsets II — sort + skip duplicates at the same level',
            code: `function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);           // numeric sort — default sort is lexicographic!
  const res = [], path = [];
  function dfs(start) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return res;
}`,
          },
          {
            type: 'code',
            title: 'Palindrome partitioning — split a string',
            code: `function partition(s) {
  const res = [], path = [];
  const isPal = (l, r) => { while (l < r) if (s[l++] !== s[r--]) return false; return true; };
  function dfs(start) {
    if (start === s.length) { res.push([...path]); return; }
    for (let end = start; end < s.length; end++) {
      if (!isPal(start, end)) continue;
      path.push(s.slice(start, end + 1));
      dfs(end + 1);
      path.pop();
    }
  }
  dfs(0);
  return res;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`[...path]\` and \`path.slice()\` both copy in O(k). \`structuredClone\` is overkill for flat arrays.
- **\`nums.sort()\` without a comparator sorts as strings**: \`[10, 9, 2].sort()\` → \`[10, 2, 9]\`. Always pass \`(a, b) => a - b\` before duplicate-skipping or break-pruning.
- Define \`backtrack\` as an **inner function** so it closes over \`result\`, \`path\` and the input — no long parameter lists.
- Recursion depth is tiny here (≤ n or ≤ 81), so the JS call-stack limit (~10k frames) is never a concern.
- Strings are immutable, so passing \`cur + ch\` into the recursion is a natural "undo-free" alternative for short strings — each call gets its own string.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'combinationSum([2, 3, 6, 7], 7)',
            columns: ['call', 'path', 'remaining', 'action'],
            rows: [
              ['dfs(0, 7)', '[]', '7', 'try 2'],
              ['dfs(0, 5)', '[2]', '5', 'try 2'],
              ['dfs(0, 3)', '[2,2]', '3', 'try 2'],
              ['dfs(0, 1)', '[2,2,2]', '1', '2 > 1 → break; return, pop 2'],
              ['dfs(0, 3)', '[2,2]', '3', 'try 3'],
              ['dfs(1, 0)', '[2,2,3]', '0', 'record [2,2,3]; return, pop 3'],
              ['dfs(0, 3)', '[2,2]', '3', '6 > 3 → break; return, pop 2'],
              ['dfs(0, 5)', '[2]', '5', 'try 3 → dfs(1,2): 3 > 2 break; pop. 6 > 5 break; pop 2'],
              ['dfs(0, 7)', '[]', '7', 'try 3 → [3]: 3 → [3,3] rem 1 break… nothing; try 6 → rem 1 break'],
              ['dfs(3, 0)', '[7]', '0', 'record [7]'],
            ],
            note: 'Because candidates are sorted, every `break` cuts the rest of that loop. Because the recursion passes `i` (not 0), [3,2,2] is never generated.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the path always returns to `[]` at the end of the run, and why that proves the undo steps are balanced?',
            deeper: 'Each recursive call pushes exactly one element before it starts and that element is popped right after it returns. So the path at the start and end of any call is identical. Applied to the top-level call, the path is `[]` before and after. If you ever print the path after `backtrack(0)` and it is not empty, some branch forgot to undo.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Storing the live array** — \`result.push(path)\` instead of \`result.push([...path])\`.
2. **Forgetting to undo** (or undoing only part of the state: \`path.pop()\` but not \`used[i] = false\`, or only two of the three N-Queens Sets).
3. **Wrong start index** — \`i\` vs \`i + 1\` vs \`0\` decides reuse, uniqueness and order.
4. **Duplicate skipping with \`i > 0\`** instead of \`i > start\`, or skipping without sorting first.
5. **Default \`sort()\`** — lexicographic, not numeric.
6. **\`break\` on an unsorted list** — prunes branches that could still succeed.
7. **Restoring after success** in find-one problems (Sudoku) — erases the answer.
8. **Leading zeros** in digit-splitting problems — "05" is not a valid operand.`,
          },
          {
            type: 'checkpoint',
            id: 'backtracking-cp-10',
            question: 'In N-Queens your undo code is `cols.delete(c); diag.delete(row - c);` and nothing else. What happens?',
            options: [
              'Nothing — anti-diagonals are covered by the other two Sets',
              'An infinite loop',
              'Only the first solution is found',
              'Stale anti-diagonal entries remain, so later valid placements are rejected and solutions are missed',
            ],
            answer: 3,
            explanation: 'The anti-diagonal of every queen ever placed stays in `anti`, including queens that were removed. Later branches see phantom conflicts, so valid boards are pruned away. Every piece of state changed in CHOOSE must be reverted in UNDO.',
            misconceptions: {
              0: 'The three constraints are independent — a queen can conflict on the anti-diagonal alone (e.g. (1,3) and (3,1)).',
              1: 'The recursion always terminates (rows only increase). The result is silently wrong, not infinite.',
              2: 'It still searches everywhere; it simply rejects too much, so some or all solutions disappear.',
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
            time: 'O(k · #answers) — e.g. O(n·2ⁿ) subsets, O(n·n!) permutations',
            space: 'O(n) recursion + path (plus output)',
            md: `**Counting the work:** total time ≈ (number of nodes in the decision tree) × (work per node). Copying a path of length up to n at each recorded answer adds O(n) per answer.

- Subsets: 2ⁿ nodes, each copy O(n) → **O(n · 2ⁿ)**. For n = 20 that is ~20 million — fine.
- Permutations: n + n(n−1) + … ≤ e·n! nodes, n! leaves copied in O(n) → **O(n · n!)**. n = 10 → 36 million.
- Combinations C(n, k): **O(k · C(n, k))**.
- N-Queens: at most n choices in row 0, n − 1 non-conflicting columns in row 1, … → **O(n!)** upper bound; pruning makes it much smaller in practice.
- Sudoku: fixed 9×9, so formally O(9^(empty cells)) worst case; constraint checks make typical puzzles instant.

**Space:** recursion depth is the length of the path (n, k, or 81), plus O(n) for \`used\`/Sets. The output itself is often larger than everything else and is usually not counted as "extra" space.

**Why can't we do better?** When the output has 2ⁿ or n! items, just *writing* it takes that long — the algorithm is optimal up to the per-answer copy cost.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Draw the first two levels of the decision tree** before coding. Say what one level decides.
- **Name the three questions:** does order matter (used[] vs start)? can elements be reused (i vs i + 1)? are there duplicates (sort + skip)?
- **Say the invariant:** "when backtrack returns, path is exactly as before the call."
- **State the complexity from the tree:** "2ⁿ subsets, O(n) to copy each → O(n·2ⁿ)."
- **Mention pruning** even if you do not implement it all: sorting for \`break\`, "not enough elements left", constraint Sets.
- **Edge cases:** empty input (subsets → \`[[]]\`), target unreachable, n = 1, all duplicates.`,
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
              { api: 'path.push / path.pop', use: 'Choose / undo on the shared path', complexity: 'O(1) amortized' },
              { api: '[...path]', use: 'Snapshot when recording an answer', complexity: 'O(k)' },
              { api: 'new Array(n).fill(false)', use: 'used[] flags for permutations', complexity: 'O(n) to create, O(1) access' },
              { api: 'new Set() / add / has / delete', use: 'Constraint tracking (columns, diagonals, Sudoku digits)', complexity: 'O(1) average' },
              { api: 'arr.sort((a, b) => a - b)', use: 'Enables duplicate skipping and break-pruning', complexity: 'O(n log n)' },
              { api: 's.slice(i, j)', use: 'Cut the next piece when partitioning', complexity: 'O(j − i)' },
              { api: 'path.join("")', use: 'Build the final string once at the leaf', complexity: 'O(k)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['List all subsets / permutations / combinations', 'Generate all valid strings or partitions', 'Constraint puzzles (N-Queens, Sudoku)', 'Path search in a small grid without reusing cells'],
    clues: ['"return all"', '"all possible"', '"generate all valid"', 'n ≤ 20', '"no two … attack"', '"same cell may not be used twice"'],
    template: `function backtrack(start) {
  if (done) { result.push([...path]); return; }
  for (let i = start; i < n; i++) {
    if (i > start && a[i] === a[i - 1]) continue; // duplicates (sorted)
    if (a[i] > remaining) break;                  // pruning (sorted)
    path.push(a[i]);        // choose
    backtrack(i + 1);       // explore (i for reuse)
    path.pop();             // undo
  }
}`,
    complexity: 'O(n·2ⁿ) subsets, O(n·n!) permutations, O(k·C(n,k)) combinations; O(n) extra space',
    mistakes: ['pushing path instead of a copy', 'missing undo', 'i vs i+1 vs 0', 'i > 0 instead of i > start', 'default sort()', 'break on unsorted input', 'undoing after success in find-one problems'],
    jsTools: ['push/pop', '[...path]', 'used[]', 'Set', 'sort((a,b)=>a-b)', 'slice'],
  },

  keyConcepts: [
    'Backtracking is a depth-first walk of a decision tree: Choose → Explore → Undo.',
    'One shared path array + undo keeps memory O(n); record answers with a copy ([...path]).',
    'Order matters → used[] and loop from 0; order does not matter → start index.',
    'Reuse allowed → recurse with i; each item once → recurse with i + 1.',
    'Duplicates: sort, then skip i > start && a[i] === a[i − 1] (siblings only).',
    'Pruning cuts whole subtrees: constraint Sets, sorted break, "not enough left".',
    'Find-one problems return true up the stack and skip the undo, keeping the solution.',
    'Cost ≈ nodes in the tree × work per node; output size often makes this optimal.',
  ],

  interviewTips: [
    'Draw two levels of the decision tree and say what each level decides.',
    'Answer the three questions: order? reuse? duplicates?',
    'Derive complexity from the tree size (2ⁿ, n!, C(n,k)).',
    'Point out the undo invariant and every pruning rule you use.',
  ],
};
