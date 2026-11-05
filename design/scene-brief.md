# Scene generator brief (Animate my run, W4.1)

You write **one scene file per question**: `src/visualizations/scenes/<question-id>.js`. A scene turns the
generic replay of a learner's own run into that question's story: a metaphor, step notes that explain the
mechanism with real values, 1–3 "predict the next step" questions, and the question's classic bugs.

## Read first (in this order)
1. `src/visualizations/scenes/index.js`: the scene format (every field, and what `ctx` holds).
2. The three gold scenes: `sort-an-array.js`, `binary-search.js`, `find-if-path-exists-in-graph.js`.
3. `src/visualizations/scenes/util.js`: helpers you may import (`row`, `changedIdx`, `swapped`, `sorted`,
   `firstInt`, `visitedSet`, `options`, `entriesOf`: a Map or a plain-object counter as [[key, value]…]; learners
   use both, so read counters with it; `cellAt(v, i)`: a cell of a plain or a long `{ $array, $length, $sparse }` array).
4. The question file: `src/content/topics/<topic>/questions/<id>.js` (statement, `paramNames`, `solution.code`,
   `hints`, `mistakes`, tests).
5. Real recorded steps: `node scripts/dump-run.mjs <id> 1 80` (and test 2, 3). **Design narration and predictions
   from these snapshots, not from guesses.** Snapshot shapes: plain arrays / numbers / strings; `{ $map: [[k, v]…],
   $size }`, `{ $set: […], $size }`, `{ $tree: [level order], $ids }`, `{ $list: { values, ids, cycleTo } }`,
   `{ $obj: { field: … } }` (class instances; `this` in design classes is `ctx.vars.this.$obj`), `{ $text }`,
   `{ $array: [first 64], $length }`.

## How a run is recorded (what your functions see)
- A step is the state **after** its statement ran. `ctx.prev` is `{}` on the first step. Steps come after
  assignments, calls, declarations and `if` statements (an `if` step only when something changed), and before
  `return` / `break` / `continue` / `throw`. One statement can change several things at once.
- Recursion: steps appear in every call, but variables are the current call's (plus enclosing functions').
- Return values are never in `vars`. A step recorded just before a `return` has `ret: true`: use `ctx.next?.ret`
  to ask "does it return now?" (an `if (…) return x;` line also records a step when it does not return).
  `ctx.src` is the current line only; the whole code is `ctx.lines`.
- Design classes: `ctx.vars.this.$obj` holds the fields; `ctx.op` is the running operation's index into
  `ctx.ops = [{ name, args }]`. Panels show fields as `this.x`, so `pointers: ['this.head']` works. Names like
  `size` are ambiguous (count in one solution, capacity in another): check before trusting them.
- Snapshots stop 3 levels deep (deeper values are `{ $text }`, e.g. nested trie nodes). `Infinity` stays
  `Infinity` (the dump prints it as `null`). Long arrays wrap onto rows of 13 cells automatically.
- `predict` is called at every step, in order, until `maxPredicts` (default 3) questions exist: it must pick the
  interesting moments itself (skip set-up steps, skip a decision that is only half done across two steps). It sees
  only one step ahead (`ctx.next`); when the deciding step is further away, do not ask.
- The note of the step *before* a prediction must not give its answer away (e.g. "guess the middle: 3, target 9",
  not "… too small, go right" when the next question is "which half is dropped?").
- Two statements on one line (`{ c1 = x; n1 = 1; }`, `n1--; n2--;`) and a swap through a temp variable are
  recorded as **two steps**: the first is half done (a temp swap leaves a duplicate). Guard predictions against the
  half-done state; to narrate a temp swap, compare `ctx.next` with `ctx.prev` (`swapped(next[n], prev[n])`).
- Right after a helper function returns, `ctx.prev` is the helper's last step (other names): require one of the
  main function's names in `ctx.prev` before comparing prev with now.
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
