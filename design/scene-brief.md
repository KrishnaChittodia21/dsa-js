# Scene generator brief (Animate my run, W4.1)

You write **one scene file per question**: `src/visualizations/scenes/<question-id>.js`. A scene turns the
generic replay of a learner's own run into that question's story: a metaphor, step notes that explain the
mechanism with real values, 1–3 "predict the next step" questions, and the question's classic bugs.

## Read first (in this order)
1. `src/visualizations/scenes/index.js`: the scene format (every field, and what `ctx` holds).
2. The three gold scenes: `sort-an-array.js`, `binary-search.js`, `find-if-path-exists-in-graph.js`.
3. `src/visualizations/scenes/util.js`: helpers you may import (`row`, `changedIdx`, `swapped`, `sorted`,
   `firstInt`, `visitedSet`, `options`, `entriesOf`: a Map or a plain-object counter as [[key, value]…]; learners
   use both, so read counters with it; `cellAt(v, i)`: a cell of a plain or a long `{ $array, $length, $sparse }` array; `itemsOf(v)`: a stack / queue /
   deque / heap front first, plain or toolkit object; `diffItems(before, after)`: what was popped / pushed between two
   steps, e.g. `diffItems(itemsOf(ctx.prev.pq), itemsOf(ctx.vars.pq))`; `leaderOf(parent, x)` / `groupsOf(parent)`:
   union-find group leader and groups from a parent row; `parentOf(vars, skip, empty)`: the parent row itself (a
   parent-like name or a DSU object's field); `functionAt(ctx.lines, line)`: the name of the
   function a line belongs to, to tell a helper's steps and returns from the main function's; `isHandover(ctx.src)`: a plain
   `prev = cur` / `row = rows[i - 1]` line, which moves a name and is not a new cell (skip it in rolling-row DP); `callArgs(ctx)`: the function the step is in and
   its parameters' current values (in recursion: the call we are in, e.g. { name: 'dfs', args: { i: 2 } });
   `writtenCell(ctx.src, ctx.vars)`: the cell a line
   writes (`dp[i][j - 1] = …` → { name, at: [i, j - 1] }), for tables where a write can leave the value unchanged; edges are often written `[cost, a, b]` as well as `[a, b, w]`).
   For Dijkstra-style relaxing with a candidate variable (`nd = d + w`), ask at the step that computes the candidate,
   before the write; the push after a write looks the same as a fresh push.
4. The question file: `src/content/topics/<topic>/questions/<id>.js` (statement, `paramNames`, `solution.code`,
   `hints`, `mistakes`, tests).
5. Real recorded steps: `node scripts/dump-run.mjs <id> 1 80` (and test 2, 3). **Design narration and predictions
   from these snapshots, not from guesses.** Snapshot shapes: plain arrays / numbers / strings; `{ $map: [[k, v]…],
   $size }`, `{ $set: […], $size }`, `{ $tree: [level order], $ids }`, `{ $list: { values, ids, cycleTo } }`, `{ $trie: { nodes: [{ id, ch, end, num }], edges:
   [[from, to]], more } }` (any node with `children` / `next` / `kids`… as a Map, object or 26-slot array; `num` is its
   counter such as `count` / `sum` when it has one; breadth first; `nodes[0]` is the node itself),
   `{ $graph: { nodes: [{ id, val, nb }], more } }` (a node with `val` + `neighbors`, breadth first, first 16;
   `nodes[0]` is the node itself, `nb` its neighbours' indexes in push order), `{ $obj: { field: … } }` (class instances; `this` in design classes is `ctx.vars.this.$obj`), `{ $text }`,
   `{ $array: [first 64], $length }`.

## How a run is recorded (what your functions see)
- A step is the state **after** its statement ran. `ctx.prev` is `{}` on the first step, and holds the previous
  step's variables only (no `line`; `ctx.next` is a whole step). When you test a shape with `every` ("all items are
  pairs"), also require length > 0: `[].every(…)` is true. Steps come after
  assignments, calls, declarations and `if` statements (an `if` step only when something changed), and before
  `return` / `break` / `continue` / `throw`. One statement can change several things at once.
- An `if` line records its own step only when something changed that no step has shown yet: when its body runs,
  the body's steps show the change and the `if` step is dropped. So "ask at the `if`" only sees the case where
  the body did not run; ask one step earlier instead. (Statements in the body always record, even when the value
  stays the same, e.g. `best = Math.min(best, d)`. After a recursive call inside an `if`, the `if` records a step
  back in the caller, since the last step was in the deeper call.)
- A `for` loop's update (`i++`) is not a step of its own: the next step shows the new index together with the
  first change of the next round, so compare the variable you narrate with `ctx.prev` even when the index moved.
- Recursion: steps appear in every call, but variables are the current call's (plus enclosing functions'). A tree /
  list passed in as a parameter stays visible as `<name> (whole)` (e.g. `root (whole)`) in steps where the original
  node is out of scope, and the call's own `root` is drawn as a tag on it: read the whole structure from there.
- `ctx.input` holds the arguments as given (in parameter order): read the original input there, not off the first
  step (a learner's first statement may already have changed a parameter).
- `ctx.result` is what the learner's run finally returned: when the decision lives only in the return value (an
  O(1) question that is one `return`), ask about it with `ctx.result` as the answer, never an answer you compute
  from the input (on buggy code the card must show what *their* code does).
- A `return expr` step is recorded after `expr` ran (so `return st.pop()` already shows the pop) and carries
  `value` (what it returns) next to `ret: true` (on the current step: `ctx.ret`, `ctx.value`). Return values are never in `vars`. Steps with `ret: true`: use `ctx.next?.ret`
  to ask "does it return now?" (an `if (…) return x;` line also records a step when it does not return).
  `ctx.src` is the current line only; the whole code is `ctx.lines`.
- Design classes: `ctx.vars.this.$obj` holds the fields; `ctx.op` is the running operation's index into
  `ctx.ops = [{ name, args }]`. Panels show fields as `this.x`, so `pointers: ['this.head']` works. Names like
  `size` are ambiguous (count in one solution, capacity in another): check before trusting them.
- Node ids (`$ids`, `$list.ids`) are handed out the first time a node is recorded, in parameter order and level
  order (lists: front to back), and never change: usually the input trees / lists get ids 1…n and nodes made later
  get bigger ids, but when a helper's own parameters are recorded first they get the first ids, so check the range.
  Use that to tell input nodes from new ones (`ctx.input` holds plain values, without ids).
- Long Maps / Sets / arrays are cut to their first 64 entries: count them with `$size` / `$length`, not the
  length of the kept list.
- Graphs draw automatically from an adjacency list named adj / graph / g / neighbours (an array of rows, or a Map of
  rows, up to 16 nodes; rows of `v` or of `[v, weight]`, weights shown on the edges): visited / seen colour the
  nodes, `u` / `node` / `cur` is the current node, `v` / `nei` the neighbour. Grids up to 12×12 draw as tile grids
  with changed tiles lit; `dist` / `dp` / `cost` tables up to 16×16 as numbered tables.
- Snapshots stop 3 levels deep (deeper values are `{ $text }`, e.g. nested trie nodes). `Infinity` stays
  `Infinity` (the dump prints it as `null`). Long arrays wrap onto rows of 13 cells automatically.
- `predict` is called at every step, in order, until `maxPredicts` (default 3) questions exist: it must pick the
  interesting moments itself (skip set-up steps, skip a decision that is only half done across two steps). It sees
  only one step ahead (`ctx.next`); when the deciding step is further away, do not ask.
- A long run is sampled (`ctx.stride` > 1: only every stride-th step is kept): `ctx.prev` / `ctx.next` may be far
  apart. The engine asks no predictions then; notes must describe the current step on its own.
- The note of the step *before* a prediction must not give its answer away (e.g. "guess the middle: 3, target 9",
  not "… too small, go right" when the next question is "which half is dropped?").
- Two statements on one line (`{ c1 = x; n1 = 1; }`, `n1--; n2--;`) and a swap through a temp variable are
  recorded as **two steps**: the first is half done (a temp swap leaves a duplicate). Guard predictions against the
  half-done state (on a tree, a node reached twice is shown once and `null` in its second place, so a half-done
  child swap shows "left is the old right, right is not the old left"); to narrate a temp swap, compare `ctx.next` with `ctx.prev` (`swapped(next[n], prev[n])`).
- Sweeps over a sorted list: when the code unpacks the next item in its own statement (`const [s, e] = arr[i]`),
  the keep/drop decision is two steps away; ask at the step where the item has just arrived and nothing has been
  decided yet, and word it for the item already on screen ("this meeting", not "the next meeting").
- Right after a helper function returns, `ctx.prev` is the helper's last step (other names): require one of the
  main function's names in `ctx.prev` before comparing prev with now.
- Finding a variable by what the code does with it is often more reliable than by its name: match a pattern in
  `ctx.lines` (`(\w+) = \1 & -\1`, `(\w+) = \(\1 \^ x\) & ~(\w+)`) or by behaviour (the runner that hops twice).
- When you guess a working variable by name or shape (`dp`, `prefix`, `count`…), skip the parameters (`ctx.params`):
  a learner's input `grid` must not be mistaken for their prefix table.
- Renamed parameters are handled for you: `ctx.params` holds the learner's own names (by position) when they
  differ from the question's.
- Every listed bug must fail at least one test (QA warns otherwise); a mistake that makes the code loop forever is
  fine only if it stops (the recorder stops runaway loops) and the run is clearly wrong.

## Rules
- **The learner's code is not the reference.** Only the parameters (`ctx.params`, already mapped to the
  learner's names) are certain: still check `ctx.vars[name]` exists. For anything
  else, look for a few common names (as the gold scenes do: `lo`/`left`/`l`, `stack`/`queue`), check the value's
  shape before using it, and `return null` when unsure; the generic note then shows. A scene must never throw.
- **Narrate the mechanism, not the code.** Short (≤ ~110 characters), plain words, the real values, in the
  metaphor's language: "day 5 (72°) is warmer than day 4 (69°): day 4 waited 1 day". Not "answer[4] = 1".
  Narrate the important steps (decisions, writes, pops, merges); return null for bookkeeping steps.
- **Predict 1–3 real decisions.** Ask *before* the step that reveals the answer, and compute the answer from
  `ctx.next` (never from what you expect the reference to do). 2–4 distinct options, an `explain` that says why.
  Use `options()` from util.js for value questions. Skip (return null) when you cannot be sure of the answer.
- **Bugs: 1–2 classic mistakes** from the question's `mistakes` / hints / tests (off-by-one, wrong comparison,
  forgetting to mark visited, wrong initial value…). `find` must be an exact substring of `solution.code` and the
  replaced code must still run but give a wrong answer on at least one test. `explain` says what goes wrong in the
  learner's terms.
- **Metaphor + caption are required.** `metaphor`: 3–7 words, a concrete picture (rooms for meetings, piles of
  bananas, a waiting line of cold days). `caption`: 1–2 sentences on how to read the picture.
- Optional fields when they help: `pointers` (names on the main array, e.g. `['this.head']` for design classes),
  `range` (a bracket), `labels` (rename for the metaphor), `watch` (a strict whitelist: a learner's variable
  with another name disappears, so use it only for parameters and well-known fields), `bars` (sort-like
  questions with small non-negative numbers), `compare` (the variable that best shows the algorithm's choices).
- Imports: only `./util.js`. No Date, no randomness, no side effects; the file is plain data + pure functions.
- Do not edit any other file. Do not run `npm run check` / build (other agents run in parallel).

## Done when
1. `node scripts/qa-scenes.mjs <id>` prints ✔ for your scene. Read its warnings and fix what you can (a bug
   whose `find` is not in the reference → fix the text).
2. `node scripts/dump-run.mjs <id> 1 80 --frames` reads well: notes tell the story, predictions are fair.
3. You wrote **one learner-style solution with different variable names** (and, where common, a different
   approach: recursion vs. loop, BFS vs. DFS) to a file in your own scratch folder, and
   `node scripts/dump-run.mjs <id> 1 80 --frames --code <that file>` passes, does not throw, and every prediction
   it asks is correct (notes may fall back to the generic text).

Then report: the id, the metaphor, how many steps are narrated / predictions asked (from the QA line), the bug
that fails, and anything you could not make work.
