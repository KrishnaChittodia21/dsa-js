# 03 · Measure my Big-O — growth fit on generated sizes

**Status:** design only. **Effort:** M–L, 3–4 batches. **Recommended third.**

## The idea

After your code passes, **Measure my growth** runs it on inputs of size 8, 16, 32 … 4,096, counts steps (not
milliseconds), fits the counts to the usual classes and draws your curve next to the reference's:

> *Yours grows like **n²** (fit 0.99). The reference grows like **n**. Line 9 runs 94% of all steps.*

LeetCode's "beats 73%" is wall-clock noise and says nothing about growth. Nobody measures the class of *your* code.

## What exists, what is new

- **Exists:** the **Measure** meter in `AnimateRun.jsx`: for each existing test, `run.calls` vs the target curve
  `bigO(question.complexity.time)` and their ratio. Its sizes are whatever the tests happen to be (mostly tiny,
  plus one or two `argsGen` tests at 10^5 that hit `MAX_STEPS`), and it reads a ratio, not a class.
- **New:**
  - a **controlled ladder** of sizes from an input generator;
  - a **fit** over candidate classes;
  - the **reference measured the same way** (empirical, not only the stated O(…));
  - a **hot line** from per-line step counts.

`bigO()` and `inputSize()` in `runFrames.js` are reused unchanged.

## Counting without recording

`recordRun` snapshots every variable on every step: too slow for 4,096 elements and capped at 2,000 steps. A new
**count-only** mode is needed: run `instrument(code)` (existing) with a hook that only increments a counter and a
per-line tally, no snapshots, cap 5·10^6 steps. New file `src/runner/count.js`, in the existing worker via a new
message type (the existing messages are untouched). Batch 1 confirms the hook point in `instrument.js`.

## Input generators

Default, from `paramTypes` (covers most questions):

| `paramTypes` | n → input |
|---|---|
| `int[]` | n random ints in the constraint range if parseable, else 0…n |
| `int` (alone) | n |
| `string` | n random lowercase letters |
| `int[][]` grid | √n × √n |
| `int[][]` edges | a random connected graph with n nodes and 2n edges |
| tree / list node types | a random tree or list of n nodes (the harness already builds these) |

Override when structure matters (sorted input, a valid target, a permutation), an optional question field:

```js
growth: { gen: '(n, rnd) => [Array.from({ length: n }, (_, i) => i * 2), n]', worst: true }
```

`rnd` is a seeded generator (same seed as the large tests use) so results repeat. Questions whose reference does
not finish the ladder, or whose generator is missing and the default does not fit, show "not measurable yet".
`scripts/check-growth.mjs` runs every reference on the ladder and lists which questions need an override.

## The fit (pure, `src/lib/growthFit.js`)

- Candidates: 1, log n, n, n log n, n², n³, 2ⁿ (2ⁿ only up to n = 20 — the ladder stops early when the count
  explodes).
- For each candidate f: least-squares scale `c` for `count ≈ c·f(n)` on the larger half of the ladder (small n is
  dominated by constants), score = R² in log space. Best score wins; report "between n and n log n" when the top
  two are within 0.02.
- Also report the log-log slope (e.g. 1.98) — honest and easy to explain.

## User flow

```
Complexity tab   (existing content stays above)
 ── Measure my growth ─────────────────────────────────────
 [Measure]   sizes 8 … 4,096 · seeded random inputs
   steps ▲          · yours (n², slope 1.98)
         │        ·
         │     ·       ─ reference (n, slope 1.01)
         │  · ───────
         └──────────────▶ n
   Line 9 runs 94% of all steps:  for (let j = i + 1; j < n; j++)
```

Chart: the existing `ColumnChart` / line chart components from `src/components/charts/` (log-scaled axis).

## Mount points

| File | Edit |
|---|---|
| Complexity tab in `CodeWorkspace.jsx` | one lazily loaded section at the bottom, only when `labs` is on and the language is JS |
| `src/runner/worker.js` | one new message type `count`; existing types unchanged |
| `src/state/progressReducer.js` | optional `GROWTH_MEASURED` storing `{ cls, slope, at }` per question (for a "matched the target class" achievement) |

## Tests

- `growthFit` on synthetic counts for each class recovers the class; noisy n log n vs n is reported as "between".
- Count mode on `for i<n for j<n` → n² counts exactly.
- Default generators produce the right shapes per `paramTypes`.
- `npm run check` green; the existing meter output unchanged.

## Batches

1. Count-only mode + `growthFit` + tests.
2. `scripts/check-growth.mjs`: coverage report and the list needing `growth.gen`.
3. UI section + chart + hot line.
4. Overrides for the questions the script flags (content work, by topic).

## Risks

- Average vs worst case: random inputs measure the average (quicksort looks n log n). `worst: true` generators fix
  that per question; the UI says "on random inputs".
- Java / C++ need their own counter (M8b); v1 is JS only.
