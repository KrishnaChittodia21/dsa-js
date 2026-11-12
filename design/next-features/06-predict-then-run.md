# 06 · Predict, then run — guess before you press Run

**Status:** design only. **Effort:** S, 1–2 batches. **Optional.**

## The idea

An opt-in toggle, **Predict first**, next to Run (JS). Before the run, a one-line prompt asks one of:
- "After Test 1, what is the final value of `best`?" (a variable from your code);
- "How many times does line 6 run on Test 1?";
- "Will Test 3 pass?"

After the run the recorder knows the truth: *"You said 4, it was 5. Line 6 ran 7 times, not 6: the loop includes
the last index."* A small streak counts right guesses.

Predicting before you look is a well-known way to learn faster. The app already uses it for its authored pattern
animations; no site applies it to the learner's *own* code.

## What exists

- `PredictCard` in `src/visualizations/Visualizer.jsx` (+ `dsa-journey:predict-mode` key): authored predictions on
  pattern animations. Not touched; its look is reused.
- The recorder (`recordRun`) gives each step's `line` and `vars`, so final values and line counts are free.

## Choosing the question (pure, `src/lib/predictPick.js`)

- Variables: names in the code (`let|const|var name`, parameters), skipping loop indexes on one-line loops.
- Pick from: final value of a variable that changes at least twice; hit count of the busiest loop body line;
  pass / fail of a test. Rotate the kind, and pick the variable at random (seeded by question + attempt).
- Answer types: number / boolean / short JSON — compared with `compareResult('exact', …)`.

## Mount points

| File | Edit |
|---|---|
| `CodeWorkspace.jsx` | a toggle next to Run (`labs` only) and the prompt before the run; the run itself unchanged |
| `src/state/progressReducer.js` | new case `PREDICTION` → `predictions: { right, total, streak }` |

The prediction run is one extra `recordInWorker` on Test 1, only when the toggle is on.

## Tests

- `predictPick` returns a question whose answer exists in the recorded run.
- Line-hit count equals the number of steps on that line.
- `npm run check` green; with the toggle off, Run behaves exactly as today.

## Batches

1. Picker + prompt + check + progress.
2. (Optional) achievements and the "why" sentence for line counts.

## Why optional

It adds friction to Run; useful as an opt-in habit, not a headline feature. It is cheap because everything it
needs already exists.
