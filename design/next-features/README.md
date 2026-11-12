# Next features — designs only (2026-11-11)

Planning documents. **No code has changed.** Six features that, as far as we know, no other DSA site offers
(LeetCode, NeetCode, AlgoExpert, VisuAlgo, Python Tutor, Codeforces were the comparison; not web-verified).
Each builds on what only this app has: code runs in the browser in three languages, and every run can be recorded
step by step and animated.

## Correction to the first pitch: what already exists

Reading the code showed three of the six ideas are partly built. Each design below starts from the gap.

| Idea | Already in the app | What is new |
|---|---|---|
| 1. Where did I go wrong? | `firstDivergence()` in `src/visualizations/runFrames.js`, used by **Compare with the reference** in `AnimateRun.jsx`. One variable only (the scene's `compare`), only inside Animate, only for questions with a scene | Starts from a **failing test**, compares **every shared variable**, names the line, **shrinks the input** to the smallest that still fails |
| 2. Hack it | **Break it** in `AnimateRun.jsx` + `mutants()` in `src/runner/bugs.js`: the *app* injects a bug and finds the failing run | Reversed: the app shows a wrong solution, **you write the input** that breaks it |
| 3. Measure my Big-O | **Measure** meter in `AnimateRun.jsx`: steps on the existing tests next to the target curve | Generated **ladder of sizes**, a **fitted class** ("yours grows like n²"), and the **hot line** |
| 4. Rosetta view | JS / Java / C++ references for all 426 questions | Side-by-side, line-aligned, with language-trap notes |
| 5. Edge-case radar | Each test has a `scenario` and `hint` in prose | Tests get categories; a per-question map and a **personal weakness profile** across all questions |
| 6. Predict, then run | `PredictCard` in `Visualizer.jsx` (authored, pattern animations only) | Predictions on **your own code**, checked by the recorder |

## Files

| File | Feature | Effort | Recommendation |
|---|---|---|---|
| [01-where-it-went-wrong.md](01-where-it-went-wrong.md) | Divergence debugger + input shrinker | L (4 batches) | **Build 2nd** |
| [02-hack-it.md](02-hack-it.md) | Break the wrong solution with your own input | M (3 batches) | **Build 1st** |
| [03-measure-my-big-o.md](03-measure-my-big-o.md) | Growth fit on generated sizes | M–L (3–4 batches) | **Build 3rd** |
| [04-rosetta-view.md](04-rosetta-view.md) | Three languages side by side | S–M (2 batches) | Later |
| [05-edge-case-radar.md](05-edge-case-radar.md) | Edge-case categories + weakness profile | M (3 batches) | Later |
| [06-predict-then-run.md](06-predict-then-run.md) | Predict a value before running | S (1–2 batches) | Optional |

Order: 2 first (cheapest, clearly new, reuses `mutants()`), then 1 (biggest effect, reuses `firstDivergence`),
then 3 (needs input generators).

## Rules every feature follows — "do not hamper existing functionality"

1. **Additive only.** New logic lives in new files. Existing functions keep their signatures and behaviour; the
   only edits to existing files are the *mount points* each design lists (one import + one button or tab), and
   optional new props with defaults that reproduce today's behaviour exactly.
2. **One switch.** A `labs` UI preference (in `src/lib/uiPrefs.js`, default **on**). Off = every mount point renders
   nothing, so the app is exactly today's app. Each feature also checks its own guard (e.g. JS only, not a quiz).
3. **Progress is backward compatible.** New top-level keys only (`hacks`, `growth`, `edgeMisses`, `predictions`),
   created lazily (`progress.hacks?.[id]`). No existing key changes shape. `IMPORT` of an older export keeps working;
   an export made after still imports into the older app (unknown keys are ignored there — to confirm in batch 1).
4. **Off the main thread.** Every extra run goes through `recordInWorker` / `runInWorker` (time limit, restart on
   crash), never the page thread. Nothing runs until the learner presses a button.
5. **Lazy.** Each feature is its own chunk (`import()` on first use), so first-load size does not grow.
6. **Accessible.** Keyboard reachable, `aria-live` status like `AnimateRun`, reduced-motion respected (reuse the
   existing player, which already does).
7. **Regression gate per batch.** `npm run check` green (unit tests, content validation, 426/426 scenes, build),
   plus the new tests each design lists. The 852 reference runs are not touched by any of these features.
8. **No new dependencies.** Everything below uses code already in the repo.

## Shared building blocks (write once, used by several features)

| Block | New file | Used by |
|---|---|---|
| Record two runs on one test in parallel workers | `src/runner/pair.js` | 1, 2 |
| Parse + type-check a hand-written input against `paramTypes` (extracted *copy* of `parseOwn` logic, the original untouched) | `src/runner/ownInput.js` | 2, 6 |
| Per-line hit counts from `run.steps[].line` | `src/runner/lineHits.js` | 1, 3 |
| Two-pane run player (yours / theirs) reusing `buildRunFrames` + the existing player | `src/components/labs/RunPair.jsx` | 1, 2 |
