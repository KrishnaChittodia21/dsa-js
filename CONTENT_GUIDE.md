# Content Authoring Guide

All learning content lives in `src/content/` and is **pure data** (plain ES modules, no JSX, no imports
from React). The UI discovers files automatically, so adding a topic or a question never requires touching
a component.

```
src/content/
  curriculum.js                  ← stage order + topic metadata (title, prerequisites, plannedQuestions…)
  companies.js                   ← company ⇄ question attributions with evidence level + source
  topics/<topic-id>/topic.js     ← lesson, patterns, cheatsheet, JS tools for one topic
  topics/<topic-id>/questions/<question-id>.js   ← one file per practice question
  toolkit.js                     ← docs for the JS DSA Toolkit (code lives in src/toolkit)
  jsReference.js                 ← "JavaScript for DSA" reference
```

Run `npm run validate` after editing: it checks the schema **and executes every reference solution
against its tests** in Node.

---

## 1. Adding a topic

1. Add an entry to `TOPIC_META` in `curriculum.js` (title, category, difficulty, prerequisites, estMinutes,
   description, plannedQuestions) and put its id into a stage's `topics` array.
2. Create `src/content/topics/<id>/topic.js`:

```js
export default {
  id: 'sliding-window',               // must match the folder + curriculum id
  summary: 'One sentence, plain English.',
  jsTools: [                          // JavaScript features used by this topic
    { api: 'Map', use: 'Character → count inside the window', complexity: 'get/set O(1) average' },
  ],
  patterns: [ /* see §2 */ ],
  lesson: { sections: [ /* see §3 */ ] },
  cheatsheet: {                       // concise, for revision
    whenToUse: ['…'],
    clues: ['…'],
    template: `code string`,
    complexity: 'O(n) time, O(k) space',
    mistakes: ['…'],
    jsTools: ['Map', 'Set'],
  },
  keyConcepts: ['…', '…'],            // 4–8 bullet takeaways for the Review tab
  interviewTips: ['…'],
};
```

## 2. Patterns

Each topic teaches one or more patterns. The Patterns page and search index are built from these.

```js
{
  id: 'variable-window',              // unique across the whole app
  name: 'Sliding Window — Variable Size',
  summary: 'Grow the right edge; shrink the left edge while the window is invalid.',
  whyItExists: 'md…',
  whenToUse: ['longest/shortest subarray satisfying a condition', …],
  clues: ['"longest substring"', '"at most K"', …],        // interview recognition clues
  whenNotToUse: ['negative numbers break "sum only grows" monotonicity', …],
  template: `function longestValid(s) { … }`,
  variations: [{ name: 'At most K distinct', description: 'md…' }],
  mistakes: ['…'],
  evolution: { easy: 'md…', medium: 'md…', hard: 'md…' },  // how problems get harder
}
```

## 3. Lesson sections & blocks

Every topic follows the same section order (skip a section only if it truly does not apply):

| id | title |
|---|---|
| `what` | What is it? |
| `why` | Why do we need it? |
| `when` | When should I use it? |
| `recognize` | How do I recognize it? |
| `intuition` | Core intuition |
| `brute-force` | Brute-force approach |
| `optimized` | Optimized approach |
| `template` | Pattern / template |
| `implementation` | JavaScript implementation |
| `dry-run` | Dry run |
| `mistakes` | Common mistakes |
| `complexity` | Complexity |
| `interview-tips` | Interview tips |
| `js-tools` | JavaScript tools |

Topics with several patterns may repeat `intuition`…`dry-run` per pattern using ids such as
`optimized-fixed`, `optimized-variable` (titles like "Optimized approach — variable window").

```js
{ id: 'what', title: 'What is it?', blocks: [ …blocks ] }
```

### Block types

| type | fields | purpose |
|---|---|---|
| `text` | `md` | Markdown (GFM tables, lists, inline code, fenced code) |
| `callout` | `variant` (`analogy` \| `tip` \| `warning` \| `insight` \| `definition`), `title?`, `md` | Highlighted aside |
| `code` | `code`, `title?`, `caption?` | JavaScript snippet with syntax highlighting |
| `compare` | `left: {title, md?, code?}`, `right: {…}` | Before/after or brute/optimal side by side |
| `steps` | `title?`, `steps: [md]` | Numbered algorithm steps |
| `checkpoint` | `id`, `question`, `options[]`, `answer` (index), `explanation`, `misconceptions: {index: md}`, `deeper?` | **Blocks the lesson** until answered. Wrong answers show the matching misconception + `deeper` re-explanation |
| `reflect` | `prompt`, `deeper` | "Do you understand why…?" — *Not quite* reveals `deeper` |
| `recognition` | `clues[]`, `conclusion` | "Look for: … → Think X" box |
| `visual` | `scenario`, `input?`, `caption?` | Interactive step-through animation (ids in §6) |
| `dryrun` | `title?`, `columns[]`, `rows[][]`, `note?` | Iteration table revealed row by row |
| `complexity` | `time`, `space`, `md?` | Complexity card |
| `jsTools` | `items: [{api, use, complexity?}]` | JS features table |

Checkpoint rules:
* `id` must be globally unique: `<topic-id>-cp-<n>`.
* 4 options; put the correct answer at a varying index.
* `misconceptions` should explain *why that specific wrong choice is tempting and wrong* (one entry per wrong option).
* Aim for **6–10 checkpoints and 2–4 reflects per topic**, spread across sections — the lesson should feel
  like a conversation: explain → ask → correct → go deeper.

Writing style:
* Simple English first, formal term second ("a range that moves… — formally, a *window*").
* Every new term gets a one-line plain definition (use a `definition` callout).
* Use real-world analogies (`analogy` callouts), tiny concrete examples, and brute force → optimized progressions.
* Don't over-simplify: explain *why* things work (why O(1) average, why the search space halves, why greedy is safe).
* Mention JavaScript specifics: which built-in to use, its complexity, and pitfalls (e.g. `sort()` is lexicographic by default, `shift()` is O(n), `Map` vs object keys).

## 4. Questions

One file per question: `src/content/topics/<topic-id>/questions/<question-id>.js`.
The id is the LeetCode slug (or `classic-…` for non-LeetCode problems) and must be in the topic's `plannedQuestions`.

```js
export default {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',                       // Easy | Medium | Hard
  order: 1,                                 // progression order inside the topic (1 = first)
  pattern: 'complement-lookup',             // a pattern id from this topic's patterns
  tags: ['array', 'hash map'],
  source: { platform: 'LeetCode', number: 1, url: 'https://leetcode.com/problems/two-sum/' },
                                            // or { platform: 'Classic', note: 'Standard textbook problem' }
                                            // premium LeetCode problems: add premium: true
  statement: `md — the full problem in your own words`,
  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 9' }],
  constraints: ['2 <= nums.length <= 10^4', 'Exactly one valid answer exists'],
  think: `md — 2–4 guiding questions before any hint ("What do you need to remember as you scan?")`,
  patternChallenge: {
    options: ['Sliding Window', 'Hash Map (Complement Lookup)', 'Binary Search', 'Dynamic Programming'],
    answer: 1,
    explanation: 'md — which clue in the statement points to the pattern, and why the others do not fit',
  },
  hints: ['md — nudge', 'md — stronger nudge (still no code)'],
  approach: `md — the full idea, brute force first then optimized`,

  // ---- runnable part ----
  functionName: 'twoSum',                   // or className for kind: 'design'
  paramNames: ['nums', 'target'],
  starterCode: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  \n}\n`,
  io: { params: ['any', 'any'], returns: 'any' },   // optional; see below
  compare: 'exact',                          // exact | unordered | nested-unordered | float
  tests: [                                   // 10–15 tests; the first 3 are the statement's examples (visible on Run)
    { scenario: 'Example 1', hint: 'The basic case from the statement.', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { scenario: 'Large input (n = 10^5)', hint: 'A double loop is O(n²) — too slow here.',
      argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i), 199997]', expected: [99998, 99999], timeLimitMs: 1000 },
  ],                                         // every test needs a unique `scenario` + a `hint` (shown when it fails)
  solution: {
    code: `function twoSum(nums, target) { … }`,
    explanation: 'md (optional) — line-by-line notes',
  },
  dryRun: { columns: ['i', 'nums[i]', 'need', 'map', 'action'], rows: [['0', '2', '7', '{}', 'store 2→0']] },
                                             // or a markdown string
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'md' },
  alternative: { title: 'Sort + two pointers', md: '…', code: '…', complexity: 'O(n log n) time, O(n) space' },
  mistakes: ['md', 'md'],
};
```

### Runnable options

* `kind`: `'function'` (default), `'design'` (a class driven by operations), `'quiz'` (multiple choice, no code).
* `io.params[i]` / `io.returns`: `'any'` (default), `'list'` (array ⇄ `ListNode`), `'tree'` (level-order array
  with `null`s ⇄ `TreeNode`), `'list[]'` (array of lists).
* `io.mutates: <argIndex>` — for in-place problems returning nothing; the mutated argument is compared.
* `io.methodReturns: { methodName: 'list' | 'tree' }` and `io.ctorParams: ['tree', …]` — conversions for design problems.
* `compare: 'unordered'` sorts the top-level array before comparing; `'nested-unordered'` also sorts inner
  arrays; `'float'` allows 1e-5 relative error.
* `test.expectedAnyOf: [a, b]` — any of several answers is accepted.
* `test.argsGen` — a **string** with a deterministic function returning the args (use for big inputs instead of literals).
* `test.timeLimitMs` — a correct answer that takes longer fails as "too slow" (use on large inputs).
* `test.expectedGen` — string function generating the expected value; design tests can use
  `test.opsGen` returning `{ ops, args, expected }` for long generated operation sequences.
* Full test-writing checklist: `scripts/TESTS_BRIEF.md`.
* `checker`: a **string** containing a function `(output, args, expected, h) => boolean` when many outputs
  are valid (e.g. "return any valid arrangement"). `h` exposes the toolkit + `deepClone`. `args` is a fresh
  copy of the test inputs.
* `harness`: a **string** containing `(target, args, h) => output` for unusual signatures (cycle lists,
  node references, graph cloning, API-style problems). `target` is the user's function or class. When a
  harness is present, `io` conversions are *not* applied automatically — do them in the harness with
  `h.arrayToList`, `h.arrayToTree`, etc.
* Design problems: `kind: 'design'`, `className`, tests look like
  `{ ops: ['LRUCache', 'put', 'get'], args: [[2], [1, 1], [1]], expected: [null, null, 1] }`
  (constructor slot is always `null`; methods returning `undefined` produce `null`).
* The toolkit (`Stack, Queue, Deque, MinHeap, MaxHeap, PriorityQueue, ListNode, TreeNode, UnionFind, Trie,
  Graph, SegmentTree, LazySegmentTree, FenwickTree, SparseTable, BST, LinkedList, DoublyLinkedList, DLLNode,
  arrayToList, listToArray, arrayToTree, treeToArray, findNode, buildAdjList, traversals`) is available as
  globals in both the editor and solutions — mention it in the approach when a solution uses it.

### Quiz questions (`kind: 'quiz'`)

```js
{ …metadata, kind: 'quiz', statement: 'md with a code block', quiz: { options: [...], answer: 2, explanation: 'md' } }
```
No `tests`, `functionName`, `starterCode` or `solution.code` are needed (you may still add `approach`, `mistakes`).

### Important rules

* **Never invent company attributions.** Questions have no `companies` field; attributions live only in
  `companies.js` with an evidence level (`verified`, `community`, `associated`) and a source link.
* Solutions and user code may declare their own `class ListNode`, `class Trie`, etc. — they shadow the toolkit globals.
* Template-literal gotcha: code is stored in JS template strings — escape backticks as `` \` `` and
  `${` as `\${` inside them, or avoid template literals inside solution code.
* Hard questions must be genuinely different variations of the pattern, not the same problem with a twist.
* Tests must be correct: `npm run validate` runs the reference solution on every test. Include edge cases
  (empty input, single element, duplicates, negatives, maximum-ish sizes where cheap).

## 5. Companies

`src/content/companies.js` exports `EVIDENCE_LEVELS`, `COMPANIES`, `SOURCES` and `COMPANY_QUESTIONS`:

```js
export const SOURCES = {
  'liquidslr-google-6m': { label: '…', url: 'https://…', evidence: 'associated', accessed: '2026-09-29', description: 'how the list was compiled' },
};
export const COMPANY_QUESTIONS = [
  { company: 'google', questionId: 'two-sum', evidence: 'associated', sources: ['liquidslr-google-6m'], note: 'optional' },
  // Not in our bank? also give: title, difficulty, url, topic (curriculum topic id)
];
```

Title, difficulty, pattern and topic are looked up from the question bank by `questionId`, so they are only
needed for questions we don't host.

* `verified` — the company itself published it (official prep guide, engineering blog).
* `community` — candidates reported it (interview-experience posts, forums) with a linkable source.
* `associated` — appears in community-compiled company lists (e.g. data derived from LeetCode company tags); frequency not guaranteed.

Never add an entry without a source you have actually seen.

## 6. Visualization scenarios

Use `{ type: 'visual', scenario: '<id>', input: {…} }`. Input is optional (defaults are sensible).

| scenario | input |
|---|---|
| `two-pointers-pair-sum` | `{ nums: number[] (sorted), target }` |
| `dutch-flag` | `{ nums: (0\|1\|2)[] }` |
| `sliding-window-fixed` | `{ nums, k }` (max sum of size k) |
| `sliding-window-variable` | `{ s }` (longest substring without repeats) |
| `prefix-sum` | `{ nums }` |
| `kadane` | `{ nums }` |
| `binary-search` | `{ nums (sorted), target }` |
| `stack-parentheses` | `{ s }` |
| `monotonic-stack` | `{ nums }` (next greater element) |
| `monotonic-deque` | `{ nums, k }` (sliding window maximum) |
| `linked-list-reverse` | `{ values }` |
| `fast-slow-pointers` | `{ values }` (find middle) |
| `merge-sort` | `{ nums }` |
| `interval-merge` | `{ intervals }` |
| `backtracking-subsets` | `{ nums }` (≤ 4 items) |
| `tree-traversal` | `{ tree (level-order array), order: 'preorder'\|'inorder'\|'postorder'\|'level' }` |
| `heap-operations` | `{ nums }` (insert all, then extract) |
| `trie-insert` | `{ words }` |
| `graph-bfs` / `graph-dfs` | `{ n, edges, start }` |
| `grid-bfs` | `{ grid }` (multi-source: 2 = source, 1 = open, 0 = wall) |
| `grid-dfs` | `{ grid }` (count islands of 1s) |
| `topo-sort` | `{ n, edges }` (directed) |
| `union-find` | `{ n, edges }` |
| `dijkstra` | `{ n, edges: [u,v,w][], start }` |
| `dp-coin-change` | `{ coins, amount }` |
| `dp-lcs` | `{ a, b }` |
| `dp-knapsack` | `{ weights, values, capacity }` |
| `hash-map` / `frequency-map` | `{ keys, buckets, find }` / `{ s, t }` |
| `recursion-tree` | `{ n }` (fib, n ≤ 6) |
| `quick-sort` / `counting-sort` / `cyclic-sort` | `{ nums }` |
| `sweep-line` | `{ intervals }` |
| `lis-patience` | `{ nums }` |
| `kmp` / `rolling-hash` | `{ text, pattern }` |
| `bit-ops` / `xor-single-number` | `{ x, k }` / `{ nums }` |
| `segment-tree` | `{ nums, l, r, updateIndex, updateValue }` |
| `fenwick-tree` | `{ nums, queryIndex, updateIndex, delta }` (1-indexed) |
| `bst-operations` | `{ values, remove }` |
| `backtracking-permutations` / `n-queens` | `{ nums }` / `{ n }` |
| `kruskal` / `prim` | `{ n, edges: [u,v,w][] }` (+ `start` for prim) |
| `bellman-ford` / `zero-one-bfs` / `floyd-warshall` | `{ n, edges, start }` / same / `{ n, edges }` |
| `bipartite-check` | `{ n, edges }` |

**Pattern animations.** Each pattern is linked to an animation in `src/visualizations/patternVisuals.js`
(shown in the topic's Visualize tab, on the Patterns page, on question pages and in the Visualizer gallery).
A pattern can override it with `visual: { scenario, input }`. New scenarios: see `scripts/VIZ_BRIEF.md`
(frames, panels and `predict` questions) and run `node scripts/validate-visuals.mjs`.
