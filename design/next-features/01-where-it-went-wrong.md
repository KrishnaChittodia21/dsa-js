# 01 · Where did I go wrong? — divergence debugger + input shrinker

**Status:** design only. **Effort:** L, 4 batches. **Recommended second.**

## The idea

When a submission fails, one button: **Find where it went wrong**. The app:
1. shrinks the failing input to the smallest one that still fails,
2. records your run and the reference run on it,
3. stops at the **first step where your state differs** from the reference, and says it in a sentence:
   *"Step 14, line 7: your `hi` became 4; in the correct run it is 3."*

LeetCode shows input / expected / output. Python Tutor animates your code but never against a correct run.
Nobody combines a minimal counterexample with a step-level diff.

## What exists, what is new

- **Exists:** `firstDivergence(userSteps, refSteps, name)` (`src/visualizations/runFrames.js`) — compares the
  distinct-value history of **one** variable, chosen by the scene file (`scene.compare`). Used by **Compare with the
  reference** inside Animate. Dispatches `ANIMATE_DIVERGED` (counts toward *Course Corrected*).
- **New:**
  - starts from **Test results**, on a failing test, without opening Animate;
  - compares **all variables both runs share**, not one chosen by a scene — works on all 426 questions;
  - **shrinks** the input first, so the diff is short;
  - reports the **line** (each recorded step already stores `line`);
  - says honestly when the approaches differ and a step diff would mislead.

`firstDivergence` is reused unchanged: the new code calls it once per shared variable.

## Algorithm (new file `src/runner/diverge.js`, pure, unit-tested)

**1. Shrink** (`shrinkInput(args, fails)`): delta-debugging on the arguments, each candidate checked in a worker.
- Arrays / strings: try removing halves, then quarters, … then single elements (classic `ddmin`).
- Numbers: try halving toward 0, then 1.
- Grids: remove rows, then columns.
- `fails(args)` = the reference succeeds **and** your output differs from it (`compareResult`). Your code crashing or
  timing out also counts as failing; the reference crashing does not (the input left the constraints).
- Budget: at most 60 runs or 4 s, then use the best so far. Skip shrinking for `kind: 'design'` (operation lists)
  in v1: show the original failing test.

**2. Record both** on the shrunk input (`pair.js`, two workers in parallel).

**3. Diff**:
- Shared names = variables in both runs (skipping `(whole)` snapshots and `this`).
- For each shared name: `firstDivergence(mine, ref, name)` → a step index or −1.
- The answer = the **earliest** index; ties go to the variable written on that step's line.
- **Same approach?** If fewer than half of your variable names exist in the reference, or the step counts differ
  by more than 10×, the diff is shown as a *hint* ("your approach is different; first difference in a shared
  variable:") or skipped, and the panel falls back to output only.
- **In-place questions** (`returnType: 'void'`): the argument snapshots are compared too (they are in `vars`).
- Truncated runs (`stride > 1`): fine — `firstDivergence` works on value histories, not raw step numbers.

**4. Explain**: `{ step, line, name, mine, theirs, lineText }` → *"Step {step} · line {line}: your `{name}` is
{mine}; in the correct run it is {theirs}."* plus the line's code.

## User flow

```
Test results
 ✗ Test 6 · Maximum before minimum      expected 2   got 3
   [🔎 Find where it went wrong]
   ── shrinking 7 → 3 elements… ──
   Smallest failing input: prices = [2, 4, 1]
   Step 5 · line 4:  your best = 3   ·   correct best = 2
     4 │   best = Math.max(best, prices[i] - minPrice);
   [▶ Watch from here]   [Show both runs]
```

- **Watch from here** opens the Animate tab on that input at that step (see mount points).
- **Show both runs** → `RunPair.jsx` (shared with 02), both paused one step before the divergence.
- Fixing the code and passing that test dispatches the existing `ANIMATE_RUN` with the same key, so the existing
  *Course Corrected* achievement keeps working.

## Mount points

| File | Edit |
|---|---|
| `src/components/question/CodeWorkspace.jsx` | under each failing JS test: one button (only when `labs` is on and `question.solution?.code` exists); lazy import of `DivergePanel` |
| `src/components/question/AnimateRun.jsx` | **optional new prop** `start = { test, step }`, default `undefined` = today's behaviour |

No reducer change: it reuses `ANIMATE_DIVERGED` / `ANIMATE_RUN`.

## New files

`src/runner/diverge.js` (shrink + diff, pure), `src/runner/pair.js` (shared with 02),
`src/components/labs/DivergePanel.jsx`, `src/components/labs/RunPair.jsx` (shared), `tests/diverge.test.js`.

## Tests

- `ddmin` on a fixture "fails when the array contains 3 before 1" shrinks `[5,3,8,1,9]` to `[3,1]`.
- Diff: two hand-built step lists diverging at a known step on one of three shared vars → that step and var.
- Different approach (no shared names) → `{ approach: 'different' }`, no step claimed.
- Reference crashing on a candidate → candidate rejected.
- `npm run check` green; `AnimateRun` without `start` renders exactly as before (snapshot of its first render).

## Batches

1. `diverge.js` + tests (pure, no UI).
2. `pair.js`, `DivergePanel` with the sentence and the line, behind `labs`.
3. Shrinking with progress text and a cancel button.
4. `RunPair`, Animate `start` prop, Java/C++ note (shows the JS reference diff only after M8b).

## Risks

- **False divergences** when you use the same names for different things (`i` as index vs counter). Mitigated by
  the same-approach check and by wording ("first difference in `i`", not "your bug is").
- Cost: shrinking runs up to 60 recordings; the existing worker restart on time-out keeps the page responsive.
- Java / C++: needs M8b (tracing your own Java/C++ code). Until then the button is JS only; the shrinker alone could
  work for Java/C++ (it only needs outputs) — a possible small extra.
