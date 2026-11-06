# DSA Journey — milestones (bringing over system-design-learn, plus Java/C++ and Animate my run everywhere)

Planning document only: no code has changed. Each milestone is explained before it starts, built in batches, and
paused after each batch with a file list; you commit, push and deploy yourself.

**Scope (updated 2026-11-04): GitHub Pages only, no separate service, one user for now.** No `api/`, no accounts,
no database, no email, no admin. Everything runs in the browser; progress stays in `localStorage` with
Export/Import as the backup. If more users are wanted later, the old account/service milestones come back (see
"Not included").

Source of the features: `/Users/krishna/nx/system-design-learn` (its `docs/MILESTONES.md` and its code; only the
browser-side parts are copied). Already planned here and folded in, not repeated: `design/animate-my-run-plan.md`
(engine W1–W4, scenes W5–W6) and the mockup `design/animate-my-run.html`.

---

## Where dsa-js is today

| Area | dsa-js now | system-design-learn (the model) |
|---|---|---|
| Stack | React 18, Vite 5, plain JavaScript, no backend | React 19, Vite 8, TypeScript, Fastify + Better Auth + MongoDB in `api/` |
| Progress | `localStorage` only (Export/Import on the Progress page) | Account-backed, synced, offline-safe |
| Content | 32 topics, ~450 lesson sections (14 per topic), 167 patterns, 438 questions (426 coding + 12 quiz) | 81 topics, 970 sections |
| Code | CodeMirror, **JavaScript only**, runs in a Web Worker; visible + hidden tests both ship in the bundle | — |
| Animations | Visualizer with 13 scenario files; `PatternVisual`; Animate my run planned | 96 lesson widgets, step lessons, 165 Shorts |
| Achievements | Yes (`src/content/achievements.js`, celebration, summary page) | Yes, account-backed |
| Guide | `WelcomeTour`, `CoachTip`, `StudyPath`, `NextUp` | Welcome tour + per-page guide (`?`) |
| Shorts, Saved | **None** | Live |
| Tests | **None** (only `npm run validate`, which runs every reference solution) | Unit tests (`node --test`) |
| Deploy | GitHub Pages (`.github/workflows/deploy.yml`) — **stays** | Vercel + Render + Atlas |

---

## Decisions (recommendations in **bold**)

1. **Language of the code base.** **Stay JavaScript** (no rewrite, no `api/`).
2. **Hosting.** **GitHub Pages only**, the existing `deploy.yml`. No server, so nothing to run, pay for or secure
   on the back end. Note: Pages on a free plan needs the repo to stay public.
3. **Users.** **One user, no sign-in.** Nothing is locked; hidden tests can stay in the bundle (there is nobody to
   hide them from). Progress, Saved, achievements and settings live in `localStorage`; Export/Import is the backup
   and the way to move to another browser.
4. **Where Java and C++ run.** With no server they must run **in the browser (WebAssembly)**. Candidates: CheerpJ
   for Java (free for personal use) and a clang build compiled to WebAssembly for C++. Both download tens of MB on
   first use (then cached). **A 1–2 day spike decides** (M7); if either is too heavy or too slow, that language
   becomes "write it + see the reference solution", without Run.

---

## Milestones

Order follows dependencies: tests first, then learning features, then Animate my run and Java/C++, then Shorts and
the extras, a light security check and deploy last. Every milestone ships to GitHub Pages when you push.

### M0 · Test foundation · 4–6 h · done 2026-11-04 (19 tests; `npm run check` = test + validate + build)
**Why.** You asked for test cases with everything; adding them per milestone needs a harness first.
- `npm test` = `node --test 'tests/*.test.js'` (no new test framework, same as system-design-learn).
- First unit tests for what already exists: the runner (`src/runner/core.js`: deep compare, timeouts,
  `compareResult` modes), the progress reducer, selectors, achievement rules, search.
- `npm run validate` stays, and runs in the same `check` script.
- **Done when:** `npm test` passes, and fails on a bug planted in `compareResult`.

### M1 · Company tags, Saved, settings and safer local data · 5–8 h · done 2026-11-04
- **Company tags on Contents (done 2026-11-04):** every question row shows one tag per company that asked it
  (e.g. Microsoft, Apple), from `COMPANY_QUESTIONS`; hovering a tag shows its evidence level.
- **Save for later:** questions, lesson sections, Visualizer scenes and Shorts; a Saved page with filters.
- Theme and accent picker (system-design-learn's light/dark/system), in Settings.
- `localStorage` writes get a version number and a migration step, so new features never wipe old progress;
  Export/Import covers the new data; a "last exported N days ago" nudge on the Progress page.
- **Tests:** an old export imports cleanly; Saved survives a reload; a corrupted store falls back without crashing.

### M2 · "Read less, view more": Step lessons · 14–20 h, then ~30–45 min per section
- **Batch 2a done 2026-11-04:** engine (Read · Steps switch per section, Watch/Your-turn player on the Visualizer's
  panels, tasks choose/number/order/cell, `stepSchema.js` checked by `validate` and tests) + Big-O §5, §8, §9.
- **Batch 2b done 2026-11-04:** the other 11 Big-O sections (14 of 16 have Steps; the complexity table and JS tools
  stay Read). The stage zooms long arrays down to fit a phone (never below 55%).
- **Batch 2c done 2026-11-05:** "Go deeper" links at the end of every section (its Visualizer scenes, their patterns,
  two unsolved practice questions; Shorts join in M9) + Steps for Arrays (16 of 18 sections). next batches: 2–3 topics each, in course order.
- **Batch 2d done 2026-11-05:** Steps for Hashing (15), Two Pointers (18), Sliding Window (12): 5 of 32 topics, 75
  sections. Array panels take `indexBase` so a split array shows its real indexes.
- **Batch 2e done 2026-11-05:** Steps for Prefix Sum (17), Array Techniques (16), Stack (15): 8 of 32 topics, 123 sections.
  Choose options now show in a fixed rotation from the question text (right answers had piled up first). Two lesson
  facts fixed: Stack `[2, 2]` tie goes to the rightmost 2; next-permutation `>` bug example is now `[1, 5, 5]`.
- **Batch 2f done 2026-11-05:** Steps for Queue & Deque (14), Binary Search (17), Linked List (17): 11 of 32 topics,
  171 sections. Lesson fix: Queue checkpoint cp-4 marked the wrong answer (now index 3, rear = 1). Step validator now
  checks intervals panels for the fields the renderer reads (`items`, `min`, `max`). Scan of all 310 checkpoints: no
  other answer/misconception mismatches.
- **Batch 2g done 2026-11-05:** Steps for Recursion (14), Sorting (29; the second half lives in `sorting/steps-2.js`,
  spread into `steps.js`), Intervals (23): 14 of 32 topics, 237 sections. Lesson fixes: Recursion "2*3-4*5" values
  (left {-2, 2}; result [-34, -10, -14, -10, 10]) and pow(2^31) = 33 calls; Sorting H-Index capping sentence.
- **Batch 2h done 2026-11-05:** Steps for Backtracking (16), Trees (16), BST (16): 17 of 32 topics, 285 sections.
  Lesson fixes: Backtracking "loop from 0" claims (subsets has no base case, so it never stops), BST balanced height
  now in levels (the lesson defines height in edges) and the 1..4 chain example. Step stage: tables and variable names
  wrap instead of clipping (a new clip scan over all 17 topics is clean); option text no longer splits around `code`.
- **Batch 2i done 2026-11-05:** Steps for Heaps (16), Tries (15), Graphs (24; part 2 in `graphs/steps-2.js`): 20 of
  32 topics, 340 sections. Lesson fixes: Heaps cp-10 (NaN compares make every push rise to the top, so the scenario now
  pushes [1,"a"] then [3,"c"]), Graphs bidirectional numbers (25^6 is about 244 million; 25 candidates per letter).
- **Batch 2j done 2026-11-05:** Steps for Topological Sort (18), Union-Find (14), Shortest Path (17): 23 of 32
  topics, 389 sections. Lesson fixes: Topo Sort BFS example (2 comes right after 0 only if 0 → 2 is listed first);
  Shortest Path grid paths (about 3.5 × 10^10, not > 10^11) and the stale-entry double count (only code relaxing with
  dist[u] double-counts; the lesson's d + w cannot tie).
- **Batch 2k done 2026-11-05:** Steps for MST (17), Advanced Graphs (24; part 2 in `advanced-graphs/steps-2.js`),
  Greedy (16): 26 of 32 topics, 446 sections. Lesson fix: Advanced Graphs SCC brute-force cost (one search per vertex,
  not per pair). Edges can now be drawn `bad` / `visited` / `window` (viz.css). New floor check over all 26 topics:
  the only frames too wide even at 55% zoom were Greedy's sign chips and Sliding Window's statement chips (both
  shortened).
- **Batch 2l done 2026-11-05:** Steps for DP 1D (16), DP 2D (28; part 2 in `dp-2d/steps-2.js`), Bit Manipulation (33;
  part 2 in `bit-manipulation/steps-2.js`): 29 of 32 topics, 523 sections. Lesson fixes: DP 1D house-robber recursion
  asks n + 2 distinct questions (k from -2), DP 2D knapsack wording (items of weight 1 and 3; when the target-sum index
  goes negative).
- **Batch 2m done 2026-11-05 (M2 content complete):** Steps for DP Advanced (32; part 2 in `dp-advanced/steps-2.js`),
  Advanced Structures (18), String Algorithms (15): all 32 topics, 588 sections (`complexity` / `js-tools` stay Read
  only). Lesson fix: String Algorithms KMP dry-run row i = 6 now resets j = lps[2] = 0 after the match, like row 2 and
  the code. Not yet checked by hand: the `then` animations shown after a task is solved (validated only).
**Why.** Lessons are long text; a Step lesson teaches the same section as a short animated sequence with tasks.
- The **Read · Steps** switch per section (Read stays the default), remembered per section, as in system-design-learn.
- A scene kit for DSA: bars, array cells, pointers, grid, linked list, tree, graph, stack/queue/heap, DP table,
  call stack. Shared with the Visualizer, so nothing is drawn twice.
- Varied tasks per lesson (predict the next swap, place the pointer, fill the DP cell, pick the pattern).
- **Learn more:** each section ends with "Go deeper" links (the pattern page, the Visualizer scene, two practice
  questions, the matching Short).
- Rule carried over from system-design-learn: the number of steps follows the section's content, and each lesson
  animates its own mechanism, never one template for all.
- **Tests:** every section's steps validate against the scene schema; a browser play-through check per topic.

### M3 · More animations and interactive animations · 12–18 h · done 2026-11-05 (158 scenes; 165 of 172 patterns have their own)
- The Visualizer grows from 13 scenario files to **one scene per pattern (167)**, each interactive: edit the
  input, predict the next step, scrub, change speed, reduced motion.
- Built on the M2 scene kit; Step lessons link into them.
- **Tests:** each scene's frames are a pure function of its input (same input → same frames); schema validation.
- **Found 2026-11-05:** the Visualizer already has 83 scenes with Try-your-own-input, Predict, a scrubber and speed.
  Of 172 patterns, 90 have their own scene, 67 borrow a "related" one, 15 have none. M3 = own scenes for those ~75
  (the 5 complexity rules, the custom comparator and interval design stay without), in batches by topic order.
- **Batch 3a:** `tests/visuals.test.js` (every scene deterministic, never mutates its input) and
  `validate-visuals.mjs` added to `npm run validate`. Scenes for arrays (4), index marking, hashing (3), two pointers
  (3), prefix sums (2), stack (2), queue/deque (3).
  **Done 2026-11-05:** 18 new scenes (101 in all; 108 of 172 patterns now have their own). Phone fix for every scene:
  the Visualizer stage now zooms to fit like Step lessons (shared `useFitZoom`); before, arrays of 8+ cells were cut
  off on a phone (binary search hid index 7+). Sweep-line example cut to 4 meetings (10 wide events did not fit at
  55%). Content fixes: stack contribution single-pass variation (top = −1, pop on ≥, −∞ sentinel), hashing
  complement-lookup mistake (counting pairs needs value → count), a missing `)` in two pointers. Next: 3b = linked
  list, recursion, sorting, intervals, backtracking, trees, BST (13 patterns).
- **Batch 3b done 2026-11-05:** 13 scenes (114 in all; 121 of 172 patterns have their own): linked-list merge sort,
  recursive descent, sort-then-scan (H-Index), greedy by earliest end, combination sum, generate parentheses, word
  search, good nodes, path sum II, LCA, serialize/deserialize, BST bounds, max-sum BST. Content fixes: sorting H-Index
  variation (answer is i + 1, not i), intervals greedy comment ("at or after lastEnd"). Next: 3c = heaps, tries,
  graphs, topological sort (13 patterns).
- **Batch 3c done 2026-11-05:** 13 scenes (127 in all; 134 of 172 have their own): two heaps (running median), k-way
  merge, last stone weight, trie wildcard search, binary trie max XOR, word search II, edge list → adjacency list,
  bidirectional BFS (word ladder), (node, mask) state BFS, town judge, 3-colour DFS, leaf trimming (MHT), DAG DP
  (parallel courses III). Content fix: graphs buildGraph comment (directed `degree` is out-degree). Next: 3d =
  union-find, shortest path, MST, advanced graphs (11 patterns).
- **Batch 3d done 2026-11-05:** 11 scenes (138 in all; 145 of 172 have their own): accounts merge (key mapping),
  evaluate division (weighted UF), islands II (online UF), minimum-effort path (minimax Dijkstra), k obstacle
  eliminations (state BFS), dense Prim, wells + pipes (virtual node), critical / pseudo-critical edges, Tarjan
  bridges, Kosaraju SCC, bus routes (BFS over routes). No content errors found. Next: 3e = binary search (4, missed in
  3a), greedy, dp-1d, dp-2d, bit manipulation, dp-advanced, advanced structures (20 patterns) — then M3 is done.
- **Batch 3e done 2026-11-05 (M3 done):** 20 scenes (158 in all; 165 of 172 have their own; the 7 without are the 5
  complexity rules, the custom comparator and interval design, as planned): first/last position, rotated search,
  Koko (search on the answer), peak; max units, min arrows, refuelling stops (heap regret), candy (two passes); house
  robber, frog jump (state map), coin change II (unbounded), longest palindromic subsequence, house robber III; bit
  counts mod k, letter masks, max XOR with a limit; count smaller after self (compression + BIT), lazy segment tree,
  range frequency (index lists), My Calendar III (boundary map). No content errors found.

### M4 · Animate my run, engine (JavaScript) · = `animate-my-run-plan.md` W1–W4
Already planned in detail and unchanged: the Proxy recorder in the worker, the "Animate my run" tab, renderers,
the interaction kit, the scene format, the QA harness and a 20-scene pilot. **One change to that plan:** the frame
format gets a `language` field and a "variables per line" shape, so Java/C++ (M8) can feed the same scenes.
- **Batch 4a done 2026-11-05 (W1, recorder):** `src/runner/instrument.js` rewrites the code with the editor's own
  parser (@lezer/javascript, no new dependency): after each statement inside a function, `__rec(line, [[name, () =>
  name], …])` for every variable of the enclosing functions (params included, so mutated inputs show; no Proxy
  needed), `this` in class methods; no newlines added, so error lines stay. `src/runner/recorder.js`: `recordRun`
  → `{ language, steps: [{ line, vars }] }` (the "variables per line" shape; snapshots of arrays, Map/Set, ListNode,
  TreeNode, objects; 2,000 steps kept by halving + always the final state; stops runaway loops after 2M statements
  and keeps its steps; verdict via the normal checkPass) and `firstDivergence` (first wrong step vs a reference
  run). `src/visualizations/runFrames.js`: steps → Visualizer frames (arrays with changed cells + index pointers,
  stack/queue by name, grids, lists, a vars panel; note = the line + what changed; last frame = verdict). Worker:
  `recordInWorker` (lazy chunk, 49 KB gzip). Tests: correct vs off-by-one bubble sort, runaway loop, lists/maps, and
  all 426 reference solutions pass when recorded (1.2 s). Next: 4b = the "Animate my run" tab (W2).
- **Batch 4b done 2026-11-05 (W2, tab):** an "Animate" tab in the question console (`AnimateRun.jsx`, lazy): pick
  one of the 3 visible tests (Test 1, the worked example, by default), "Animate my run" records in the worker and
  plays the run in the Visualizer's own player (it now also takes ready-made `frames`, `title`, `autoPlay`, `bars`):
  auto-plays unless reduced motion, scrub / step / speed / keyboard, bars for small non-negative arrays, the
  verdict on the last frame and in the title; "the code changed, animate again" hint. Desktop: the console gets
  ~76% of the height while the tab is open. Browser-checked on Sort an Array (bubble sort): correct run (16 frames,
  fits a 390 px phone without zoom), off-by-one run (wrong answer [2,3,5,1]), a runaway loop (stopped in ~0.25 s,
  1,956 sampled frames), a thrown TypeError. Renderers: the existing panels cover bars, cells, grid, list; trees
  show as text until 4c. Next: 4c = tree / graph / heap / DP-table views, the interaction kit, scene files (W3).
- **Batch 4c done 2026-11-05 (W3, renderers + kit + scenes):** `runFrames.js` now draws trees (other node variables
  become tags on the node: cur, node…), lists with pointers (slow / fast), heaps (MinHeap / PriorityQueue or a `heap`
  array), graphs from adjacency lists (visited / current / neighbour states), union-find forests, DP tables, Maps as
  key/value tables, Sets, Stack / Queue / Deque objects, queues of tree nodes, and design classes (an operation
  timeline + one panel per field of `this`; `executeOne` gained an `onOp` hook). Interaction kit in `AnimateRun.jsx`:
  your own input (expected answer from the reference), compare with the reference (step counts + first divergence),
  Break it (`runner/bugs.js`: scene bugs, then generic off-by-one / comparison / visited / max-min mutants until one
  fails), trace a variable, measure the work (steps vs the question's Big-O curve on every visible test), predictions
  (scene-written, else auto "which cell changes?"). Scene format + loader in `visualizations/scenes/index.js`; gold
  scenes: sort-an-array, binary-search, find-if-path-exists-in-graph. 36 tests (frames build for all 426 reference
  solutions; each gold scene narrates, predicts and has a failing bug). Browser-checked at 390 px: binary search (kit),
  BFS path, LRU cache, invert tree. Next: 4d = generator brief, QA harness, 20-question pilot (W4).
- **Batch 4d done 2026-11-05 (W4, pipeline + pilot):** `scripts/qa-scenes.mjs` (in `npm run validate`): per scene,
  reference passes with the scene on, frames well-formed, narrate tells ≥ 1 step, predict asks ≥ 1 valid question,
  an injected bug fails a test, phone-width warning. `scripts/dump-run.mjs` (steps, `--frames` preview, `--code`
  learner-style file). Brief: `design/scene-brief.md`, revised with the pilot's feedback. Pilot: 20 scenes by 4
  agents (two-pointers … design classes), 23/23 pass QA; spot-checked at 390 px: group-anagrams, edit-distance,
  design-circular-queue, course-schedule-ii. Engine fixes from the pilot: `if` statements are recorded (quiet),
  long arrays wrap at 13 cells, empty cells show "·", op timeline = previous / now / next, ctx gets op / ops.
  Cost: ~25k tokens per scene (≈ 0.5M for 20) → 406 remaining ≈ 10M tokens, more than one weekly limit.
- **Production batch 1 done 2026-11-05 (W5):** 25 scenes, all of arrays (13) and array-techniques (12); 48/48 scenes
  pass QA. Engine: renamed parameters mapped by position (ctx.params), rows wrap by width (≤ ~420 px), QA warns when a
  listed bug fails no test. Gold binary-search note no longer gives away its prediction. Brief: half-done steps
  (two statements on a line, temp swaps), helper-function prev. Spot-checked at 390 px: integer-to-english-words
  (fit 0.80), spiral-matrix (0.91). Remaining: 378 questions.
- **Production batch 2 done 2026-11-05 (W5):** 25 scenes, all of two-pointers (13) and 12 of sliding-window; 73/73 pass
  QA. Engine: a step just before a `return` carries `ret: true` (an `if (…) return x;` line records both outcomes on
  the same line), plain-object counters draw as key/value tables, util `entriesOf` reads Map or object counters.
  Spot-checked at 390 px: trapping-rain-water (fit 1.02), minimum-window-substring (1.09). Remaining: 353.
- **Production batch 3 done 2026-11-05 (W5):** 25 scenes: the last sliding-window, all of prefix-sum (12) and sorting
  (12); 98/98 pass QA. Engine: long counting arrays keep their non-zero cells (`$sparse`, wherever they are) and draw
  as an index → value table (relative-sort-array: ~3300 px → fits at 390 px); util `cellAt`. Brief: skip parameters
  when guessing working arrays by name. Remaining: 328.
- **Production batch 4 done 2026-11-05 (W5):** 25 scenes: the rest of binary-search (13) and 12 of intervals; 123/123
  pass QA. Engine: the recorder reads the learner's own parameter names off their function (`run.params`; replaces
  the first-step guess, which broke when a run starts in a helper); scenes get `ctx.result` (the run's return value)
  for questions decided only by a `return`; dump-run marks return steps. determine-if-two-events-have-conflict now
  answers its prediction from the run, not from the input. Brief: the sweep-a-sorted-list pattern. Spot-checked at
  390 px: time-based-key-value-store (fit 0.72). Remaining: 303.
- **Production batch 5 done 2026-11-05 (W5):** 25 scenes: the last 2 intervals, all of greedy (15) and 8 of hashing;
  148/148 pass QA. Engine: `ctx.ret` (the current step is a return). Spot-checked at 390 px: the-skyline-problem
  (fit 1.13). Remaining: 278.
- **Production batch 6 done 2026-11-05 (W5):** 25 scenes: the last 4 hashing, all of string-algorithms (12) and 9 of
  bit-manipulation; 173/173 pass QA. Engine: `ctx.input` (the arguments as given), Set panels wrap by width. Brief:
  long collections are cut to 64 (count with $size), `if` and `for`-update recording. Spot-checked at 390 px:
  maximum-xor-with-an-element-from-array (720 frames, recorded in 0.26 s, fit 1.04). Cleanup later: the five KMP
  scenes each carry the same helper block (could move to util.js). Remaining: 253.
- **Production batch 7 done 2026-11-05 (W5):** 25 scenes: the last 4 bit-manipulation, all of linked-list (15, incl.
  LRU / LFU cache) and 6 of stack; 198/198 pass QA. Engine: a `return expr` step is recorded after `expr` ran and
  carries `value` (so `return st.pop()` shows the pop); harness questions use the learner's own parameter names;
  list panels show their label (also fixes an unlabelled lesson panel in m3-list-sort). Spot-checked at 390 px in
  dark mode: reverse-linked-list (fit 0.99, prev / head / cur / next tags). Cleanup later: the five linked-list
  scenes of group 3 each carry a list helper (could move to util.js). Remaining: 228.
- **Production batch 8 done 2026-11-05 (W5):** 25 scenes: the last 9 stack, all of queue-deque (12) and 4 heaps;
  223/223 pass QA. Engine: `ctx.value` (the current return step's value), util `itemsOf` (stack / queue / deque / heap
  front first, plain or toolkit). Spot-checked at 390 px: sliding-window-maximum (fit 0.76; the toolkit Deque draws
  front to back). Small leftover: the first generic note prints a toolkit Deque's raw {buf: …} text. Remaining: 203.
- **Production batch 9 done 2026-11-05 (W5):** 25 scenes: the last 11 heaps and 14 of trees; 248/248 pass QA. Engine:
  in recursion the input tree / list stays visible as `<param> (whole)` (the call's own node is a tag on it; the biggest
  structure per name wins, so deep-first runs settle on the top root); util `entriesOf` only takes plain counters; QA
  no longer warns on lists (they wrap). Brief: node id order, tree half-done swaps. Content gap found: in
  sliding-window-median the classic "forgot to prune after moving a top" mistake passes every test (a test is
  missing). Spot-checked at 390 px: diameter-of-binary-tree (fit 1.11, node tag on the tree). Remaining: 178.
- **Production batch 10 done 2026-11-05 (W5):** 25 scenes: the last 2 trees, all of bst (12) and 11 of tries;
  273/273 pass QA. Engine: a trie renderer. Trie nodes (children / next / kids… as a Map, an object or a 26-slot array)
  snapshot as `$trie` at any depth and draw as a letter tree with word ends lit, counters beside the letters and
  `node` / `cur` as tags. implement-trie-prefix-tree and longest-word-in-dictionary were updated for the new
  snapshot. Spot-checked at 390 px: replace-words (fit 0.99, trie drawn). Remaining: 153.
- **Production batch 11 done 2026-11-05 (W5):** 25 scenes: word-search-ii, all of graphs (16) and 8 of shortest-path;
  298/298 pass QA. Engine: weighted adjacency lists (rows of [v, w]) draw as graphs with edge weights; util `diffItems`
  (what a heap / queue popped and pushed). Spot-checked at 390 px: rotting-oranges (fit 1.13, grid drawn). Gaps:
  clone-graph's Node objects are not drawn as a graph; word-ladder (694 frames) and the grid-BFS neighbour loops show
  mostly generic notes between the narrated moments. Remaining: 128.
- **Production batch 12 done 2026-11-05 (W5):** 25 scenes: the last 3 shortest-path, all of topological-sort (12) and
  all of mst (10); 323/323 pass QA. Engine: a square matrix named like a graph is read as an adjacency matrix (Prim's
  graph[i][j]), util `leaderOf` / `groupsOf` (union-find). Spot-checked at 390 px: classic-mst-kruskal (fit 1.13,
  UnionFind drawn as a forest). Cleanup later: the four Kruskal scenes repeat ~80 lines of union-find / edge helpers
  (now in util for new scenes). Remaining: 103.
- **Production batch 13 done 2026-11-06 (W5):** 25 scenes: all of union-find (12), all of advanced-graphs (10) and 3
  of dp-1d; 348/348 pass QA with no width warnings. Engine: union-find forests stay phone-sized (lone nodes in one
  wrapping row, groups laid out side by side and wrapped onto bands, groups wider than 7 nodes listed as
  leader → members); run graphs use a tighter circle (lessons keep theirs); util `functionAt` (which function a
  line is in). Spot-checked at 390 px: regions-cut-by-slashes (fit 0.99, every forest view). Remaining: 78.
- **Production batch 14 done 2026-11-06 (W5):** 25 scenes: the rest of dp-1d (11) and all of dp-2d (14); 373/373 pass
  QA. Util: `isHandover` (a `prev = cur` line is not a new cell), `writtenCell` (the cell a line writes, for tables
  where a write can leave the value unchanged). Spot-checked at 390 px: longest-common-subsequence (fit 1.00, rolling
  rows, every cell explained). Remaining: 53.
- **Production batch 15 done 2026-11-06 (W5):** 26 scenes: all of dp-advanced (15) and all of recursion (11);
  399/399 pass QA. Engine: long arrays keep the cells that differ from their fill value (0, -1, null, ∞…, `$fill`),
  cut-down long rows wrap; util `callArgs` (the call a step is in, with its arguments); dump-run prints return values.
  Spot-checked at 390 px: partition-to-k-equal-sum-subsets (fit 0.76, was ~3300 px). Remaining: 27.
- **Production batch 16 done 2026-11-06 (W5) — all 426 questions have a scene:** the last 27 (backtracking 14,
  advanced-structures 13); 426/426 pass QA. Engine: no predictions on sampled runs (`ctx.stride`), numeric option
  order. Spot-checked at 390 px: n-queens (fit 1.13). Production total ≈ 13.4M tokens over 16 batches (+ 0.5M pilot).
  Left for M5: W6.1 rework of scenes you flag, W6.2 large inputs + keyboard pass, W6.4 CONTENT_GUIDE section, your
  browser review, merge and deploy. Cleanup candidates: helper blocks copied across KMP / linked-list / Kruskal /
  Dijkstra scenes (util now has shared versions); clone-graph not drawn as a graph; first Deque note shows raw text.
- **W6.2 + W6.4 done 2026-11-06:** speed measured on all 1,278 visible runs (slowest 0.45 s to record + build, so no
  change). Keyboard pass: the Animate tab's busy buttons keep focus (`aria-disabled`); focus moves to a new player,
  to the prediction options, back to the player after "Show the step", and to the meter. Busy status is announced, and
  the scroll areas can be focused. CONTENT_GUIDE §7 explains how to add a scene. Left: W6.1 (your flags), W6.3
  review, merge and deploy.
- **Cleanup done 2026-11-06:** `parentOf` (finds the union-find parent row) now lives in `scenes/util.js`, replacing
  17 copies; 3 more scenes use util's `itemsOf` / `options`. Their frames are identical on every fixed test. Clone
  Graph's nodes are recorded as `$graph` (nodes + neighbour order) and drawn as a graph, seated by value, with tags.
  Toolkit Deque / Queue / Stack / heap values read as their items in the generic notes (`dq = queue []`, not
  `{buf: …}`). 37 tests.

### M5 · Animate my run for every question · = `animate-my-run-plan.md` W5–W6
One unique, interactive scene per coding question (426), 100 a day, the QA harness on each, just like
`design/animate-my-run.html`. The 12 quiz questions get no scene.

### M6 · Java and C++ in the editor (no Run yet) · 14–20 h
- A language switch in the workspace (JS · Java · C++), remembered; CodeMirror `lang-java` and `lang-cpp`
  (added only if each release is at least two weeks old).
- **Every question gets typed signatures** (`paramTypes`, `returnType`) and starter code for Java and C++: 426
  questions, generated in batches.
- **Reference solutions in Java and C++** for the Solution tab, written in batches.
- One test format for all languages: `args`/`expected` stay JSON; `argsGen` (341 questions) runs once in JS to
  produce JSON; the ~28 design-class questions (LRU cache, …) use an operation list (`["LRUCache","put","get"]` +
  args), as LeetCode does. This is what M7 will feed to each language.
- **Tests:** signatures parse; every question has starter code and a reference in both languages.
- **6a + 6b done 2026-11-06:**
  - **Types:** all 426 coding questions are typed. `scripts/infer-types.mjs` read 415 from their tests (argsGen
    included); 11 were set by hand: the 9 custom-harness questions, plus reverse-string and task-scheduler as `char[]`.
  - **Starters:** generated, not stored. `src/languages/signature.js` builds the Java / C++ starter from the types,
    and the names come from the JS starter. Design classes and the two Codecs use `methodTypes`.
  - **Checks:** `validate-content` checks every signature.
  - **Editor:** a JS · Java · C++ picker that is remembered (`codeLang`). Each language keeps its own draft
    (`codeByLang`, carried by Export / Import). In Java / C++ the editor is write-only: Run / Submit / Custom /
    Animate say so. Uses `@codemirror/lang-java` 6.0.2 + `lang-cpp` 6.0.3.
  - **Tests:** 40.
  - **Next (6c):** reference solutions in Java and C++, as real files next to each question.
- **6c batch 1 done 2026-11-06:**
  - **References:** 56 of 426 questions have Java and C++ references: 6 pilots by me plus 50 by 5 agents (~330K
    tokens). They live in `src/content/topics/<topic>/solutions/<id>.{java,cpp}`.
  - **Checking:** `scripts/check-refs.mjs` + `src/languages/harness.js` (generated drivers, number-token test
    input, JSON output judged by `checkPass`) compile each file and run every test. 112/112 pass. Java uses a
    portable Temurin JDK 21.0.13 in the session scratch folder (`DSA_JDK=…`; not installed, not in the project).
    `npm run check` does not run it, because it needs a JDK.
  - **Solution tab:** a JS · Java · C++ switch, starting on the editor's language. References are lazy `refs-<topic>`
    chunks.
  - **Fixes:** `infer-types` had treated −2³¹ as `long`, so 18 questions were re-typed to `int` (as LeetCode).
    `<random>` and a few more headers were added to the C++ driver.
  - **Next:** 355 questions (about 7 batches of 50), then the 9 custom-harness questions by hand.
- **6c batch 2 done 2026-11-06:** 50 more (prefix-sum, array-techniques, stack, queue-deque; ~310K tokens). 106 of 426
  questions have references; all 212 files pass every test. All first-run passes, no type changes.
  - **Deliberate differences from the JS:** max-sum-of-rectangle-no-larger-than-k uses `TreeSet` / `set` where the JS
    splices into a sorted array (same idea, faster insert); majority-element-ii uses count > 0 instead of a null candidate.
- **6c batch 3 done 2026-11-06:** 50 more (end of queue-deque, binary-search, linked-list, recursion, sorting; ~320K
  tokens). 156 of 426 questions have references; all 312 files pass every test, and all passed on the first run.
  count-good-numbers uses `long` + `% MOD` where the JS uses BigInt. reverse-string recurses per pair, so a very long
  input could overflow the Java stack; the tests pass.
- **6c batch 4 done 2026-11-06:** 50 more (end of sorting, intervals, backtracking, trees, first BST). 206 of 426
  questions have references; all 412 files pass every test, all on the first run. `-Infinity` starts and node
  min/max sentinels use `long`; Java comparators use `Integer.compare` (no subtraction overflow); sorts work on a
  copy where the JS uses `toSorted`. Tree recursion mirrors the JS (tests reach ~1000-deep chains).
- **6c batch 5 done 2026-11-06:** 50 more (end of BST, heaps, tries, first graphs). 256 of 426 questions have
  references; all 512 files pass every test. take-gifts-from-the-richest-pile retyped `int` → `long` (its sum
  reaches 10^12; LeetCode returns `long long`). sliding-window-median keeps its heaps in fields, so it now clears
  them at the start of each call. Trie children are 26-slot arrays (a–z, per the constraints); BST bounds and
  pair/heap sums use `long`.
- **6c batch 6 done 2026-11-06:** 50 more (end of graphs, topological sort, union-find, shortest paths, MST).
  306 of 426 questions have references; all 612 files pass every test. evaluate-division keeps its maps in fields,
  so it now clears them per call. Union-find is a small per-file helper (path halving; C++ `unite`, since `union`
  is a keyword). Infinity that gets added to is `MAX/2`; number-of-ways distances are `long`. MST totals fit `int`
  by the bounds (min-cost-to-connect-all-points: an MST of 1000 points in the box stays far below 2^31).
- **6c batch 7 done 2026-11-06:** 50 more (end of MST, advanced graphs, greedy, dp-1d, first dp-2d). 356 of 426
  questions have references; all 712 files pass every test, no fixes needed. combination-sum-iv and
  distinct-subsequences use wrapping 64-bit sums (exact mod 2^64, so exact whenever the answer fits `int`);
  decode-ways-ii keeps `long` + `% MOD`; patching-array and refueling-stops reach is `long`. Field state (Tarjan
  disc/low, cracking-the-safe) is recreated inside the public method.
- **6c batch 8 done 2026-11-06:** the last 61 (end of dp-2d, bit manipulation, dp-advanced, advanced structures,
  string algorithms). 417 of 426 questions have references (all but the 9 custom-harness ones); all 834 files pass
  every test, no fixes needed. Unsigned 32-bit values (`>>> 0` in the JS) use `long` / `uint32_t`; C++ avoids
  signed-shift UB with `unsigned`. Rolling hashes keep the JS double modulus (products < 2^52). reverse-pairs uses
  `2L *`, count-of-range-sum `long` prefixes; coin-change-ii wraps in 32 bits (exact when the answer fits).
- **6c done 2026-11-06 (the 9 custom-harness questions, by hand):** all 426 questions have Java and C++ references;
  all 852 files pass every test. `harness.js` has a `CUSTOM` table (per id: token types of the raw test args, a Java
  and a C++ body that do what the JS `harness` does): Codec round trips, in-place prefix (`k` → first k items), LCA
  (values → nodes), lists with a cycle (node index out), clone-graph (provides `Node`, same deep-copy checks as the
  JS). Wrong solutions are caught (original node returned, wrong cycle entry, full length). `tests/harness.test.js`
  covers encoding and wiring without a JDK (41 tests). Gap found: no encode-and-decode-strings test has a word
  containing a separator-like `|`, so a plain-delimiter encoding passes (the JS tests have the same gap).
  - **M6 left:** nothing in the plan; the browser check of the Solution-tab switch for a few questions is the user's.

### M7 · Running Java and C++ in the browser · 2-day spike, then 12–20 h
- **Spike first** (decision 4): load time, first-run time and memory for CheerpJ and clang-on-WebAssembly in a
  worker. Go / no-go per language at the end of the spike.
- If go: compile and run inside a Web Worker (the page stays responsive; a time limit kills runaway code); a small
  harness per language reads the JSON tests into `int[]`, `vector<int>`, `ListNode`, `TreeNode`, strings,
  matrices… and prints JSON back, so `compareResult` grades every language the same way. The compiler download is
  loaded only when you first pick Java or C++, and cached.
- **Tests:** harness round-trips for every type; every Java and C++ reference passes its question's tests; an
  infinite loop times out without freezing the page.
- **Spike done 2026-11-06 → go for both** (details: `design/m7-spike.md`). Java: TeaVM javac (official playground
  build, ~4 MB gzip, vendored) passes 402/426 references (~1.1 s compile); gaps: `Map.Entry`, `Integer::sum`, and
  recursion deeper than ~1–5k frames. C++: `@yowasp/clang` from jsDelivr (~23 MB brotli) passes 426/426 with an
  8 MB stack (~2.2 s compile); no exceptions (stubbed). Both: print per test and restart after a crash.
- **Batch 1 done 2026-11-06 (runner core, not wired into the UI yet):**
  - **Drivers:** `harness.js` prints one `\x01`-marked JSON line per test as soon as it is done (other stdout = the
    learner's prints → that test's logs; `splitDriverOutput`, also used by `check-refs`). `{ browser: true }`: Java
    reads `args[0]` and runs without a thread; C++ gets exception stubs; `CPP_BROWSER_FLAGS` (8 MB stack). TeaVM-safe
    `append(String.valueOf(o))` and an append chain for the result line (TeaVM failed on `"…" + double + "…"`).
  - **Runner** `src/runner/native/`: `runNative.js` (TeaVM worker from `public/teavm/`, clang worker
    `cppCompiler.js` loading `@yowasp/clang` from jsDelivr, fresh `execWorker.js` per run with the time limit),
    `results.js` (restart after a crash, time limit, compile errors mapped to the learner's lines + TeaVM hints,
    crash wording), `wasi.js` (own ~60-line WASI, no dependency). Same result shape as `runInWorker`.
  - **References:** 23 Java files rewritten without `Map.Entry` / `Integer::sum`; path-sum-ii Java is iterative.
    Desktop `check-refs` 852/852.
  - **Checked in Chrome:** references pass in both languages; a crash fails only its test and keeps its prints; an
    infinite loop times out (page stays responsive); compile errors show the learner's line + hint. TeaVM emits an
    invalid module for a method ending in `while (true) {}` → reported as a clear compile error.
  - **Open:** in a worker C++ recursion is shallower than on the page (path-sum-ii's 5 000-deep chain overflows) →
    batch 3 runs every reference through this runner and fixes what fails.
  - **Tests:** 45 (`tests/native.test.js`: restart, time limit, error lines).
- **Batch 2 done 2026-11-06 (workspace):** Run / Submit / Custom input work in Java and C++ (`CodeWorkspace` →
  `runIn(lang)`: JS → `runInWorker`, Java / C++ → `runNative`, loaded on first use). The running line shows the
  runner's status ("Loading the Java compiler…", "Downloading the C++ compiler… N%", "Compiling…", "Running…");
  the empty Test results panel says what the first run downloads; custom input compares with the JS reference.
  Animate stays JS-only (M8) with a note. `runClang` drops `fetchProgress`, so the clang worker prefetches with
  `runLLVM(null, {}, { fetchProgress })`. Checked in Chrome: Java Submit → Accepted 12/12 (counts as solved);
  C++ Run + custom input; empty cache: C++ 6.3 s (download ~3.3 s) and Java 1.5 s to the first result.
- **Batch 3 done 2026-11-06 → M7 done:** `scripts/check-refs-browser.html` (dev server; `?lang=`, `?ids=`) runs every
  reference through `runNative`, the same path as Run / Submit. First pass 845/852; fixed: 5 deep recursions made
  iterative (cracking-the-safe Java + C++, maximum-sum-bst-in-binary-tree Java + C++, path-sum-ii C++), TeaVM's
  `TreeMap` throws on `put` while iterating `keySet()` (hand-of-straights iterates a copy), a boxed `Character` hits
  the ambiguous `append(Object)` (longest-common-prefix). Now **852/852 in the browser** and 852/852 on the desktop.
  `design/refs-brief.md` lists the browser-safe rules; `check-refs` survives a program that exits early (EPIPE).
  - **Known limits (shown to learners as clear errors):** recursion deeper than ~1–5k levels, Java `Map.Entry` /
    `Integer::sum` (hint), Java null / index traps end the run on that test, C++ `throw` ends the run, TeaVM
    rejects a method ending in `while (true) {}`. Java needs a WebAssembly-GC browser (Chrome 119+, Firefox 120+,
    Safari 18.2+).

### M8 · Animate my run for Java and C++ · decided after M7
Line-by-line tracing of Java/C++ inside the browser is the hardest part and may not be practical. **Default
plan:** "animate the reference run and compare your output" for Java/C++, with full Animate my run kept for
JavaScript. Revisit only if M7's runtime makes tracing cheap.
- **Decided 2026-11-06 (options: `design/m8-options.md`): A now, B later.** M7 makes real tracing possible (the
  editor already ships `@lezer/java` / `@lezer/cpp`; ~25–35 h), but it waits until after the M5 review items.
- **Option A done 2026-11-06:** in Java / C++ the Animate tab runs your code on the chosen test (M7 runner) and
  plays the JavaScript reference's animation of the same test, with a verdict box: "Your Java on Test 1: correct /
  wrong answer / stopped with an error · yours … · reference …". Your own input: the JS reference decides the
  expected answer, then the question's checker judges yours. Compare / Break it / Measure (JS-code tools) are
  hidden in Java / C++. Checked in Chrome: correct, own input, and a wrong answer.
- **Later (M8b, not scheduled):** option B — trace your own Java / C++ line by line.

### M9 · Shorts · 18–26 h, then ~20–30 min per Short
- Two-minute animated stories that end in one question, built on the M2 scene kit.
- **One Short per pattern (~167)**, in course order; a new one unlocks each day you study (Day N badges, kept locally).
- Shorts page with filters, a Short of the day on the dashboard, reading speed, Save for later.
- Rules carried over: facts only from the lessons; illustrative numbers marked "e.g."; no characters, avatars,
  emoji or copyrighted characters.
- **Tests:** schema validation of every Short; the unlock order.

### M10 · Achievements, round two · 4–6 h
- New ones for the new features: first Animate my run passed, first divergence fixed, Polyglot (the same question
  in JS, Java and C++, if M7 is a go), Shorts streaks, Step-lesson streaks, Saved collector. Stored locally.
- **Tests:** each rule fires once at its threshold, and not one below.

### M11 · Guide me, round two · 5–8 h
- The existing `WelcomeTour` gains steps for the new features, plus a per-page guide on `?` (workspace: language
  switch, Animate my run; Shorts; Saved).
- Coach tips the first time a run diverges.
- **Tests:** every tour step's target exists on its page; "don't show again" is respected.

### M12 · Security check and deploy · 3–5 h
No server means a much smaller audit: a Content-Security-Policy `<meta>` tag (Pages can't set headers), the
worker time limits for user code, the WebAssembly downloads pinned and loaded from known URLs, `npm audit`, and no
secrets in the repo or workflows. GitHub Actions on push: `npm test`, `validate`, build, then the existing Pages
deploy. Launch check on the live Pages site: every page loads with no CSP errors, Export → Import round-trips.

---

## Estimates

| Milestone | Hours | Tokens (rough) |
|---|---|---|
| M0 Test foundation | 4–6 | 1–1.5M |
| M1 Company tags, Saved, settings, safer local data | 5–8 | 1–2M |
| M2 Step lessons (engine + first topic) | 14–20 | 3.5–5M, then content in batches |
| M3 Interactive Visualizer (167 scenes) | 12–18 | 3–5M |
| M4 Animate my run engine | per its plan (W1–W4) | 4–6M |
| M5 Animate my run for every question | per its plan (W5–W6) | 6–7M |
| M6 Java and C++ in the editor (426 signatures + references) | 14–20 | 4–7M |
| M7 Running Java/C++ in the browser | spike + 12–20 | 3–5M |
| M8 Animate my run for Java/C++ | decided after M7 | — |
| M9 Shorts (engine + 167) | 18–26, then content | 4.5–7M + content |
| M10 Achievements round two | 4–6 | 1–1.5M |
| M11 Guide me round two | 5–8 | 1–2M |
| M12 Security check and deploy | 3–5 | 0.5–1M |
| **Total** | **~110–170 h + content batches** | **~33–50M** |

Pacing (the weekly limit resets Wednesday 09:00): heavy build sessions Wed–Thu, content batches right after the
reset, one milestone task per session. At 1–2 h a day this is roughly **3–4 months**; the content-heavy parts (M2,
M5, M6, M9) can run as parallel agent batches, like the system-design-learn step lessons, which shortens it.

## Not included (later, if needed)
Accounts, sign-in and sync across devices; a back-end service (`api/`), database and email; the sign-up lock and
server-graded Submit with hidden tests off the bundle; Profile, feedback inbox and Admin; a server code sandbox.
These were the old M1–M4, M9 and M15 and come back only if the app gets more than one user. Also: Python or other
languages; a mobile app; paid plans; contests or leaderboards; AI hints; live mock interviews.
