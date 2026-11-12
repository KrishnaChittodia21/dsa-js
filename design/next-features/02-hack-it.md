# 02 · Hack it — break the wrong solution with your own input

**Status:** design only. **Effort:** M, 3 batches. **Recommended first.**

## The idea

The app shows a solution that *looks* right and passes the examples, but is wrong. You write an input that breaks
it. The runner checks that the wrong solution and the reference disagree on your input, then plays both runs side
by side so you see *why*.

Interviews test exactly this ("what input breaks your greedy?"), and no learning site trains it. Codeforces has
"hacking", but only in contests and against strangers' code.

## What exists, what is new

- **Exists:** Break it (`AnimateRun.jsx` `breakIt`) — the app runs up to 6 `mutants()` on the current test and shows
  the first one that fails. The *app* finds the bug and the input.
- **New:** the learner finds the input. The wrong solutions are chosen so the examples do **not** catch them.

## Where wrong solutions come from

1. **Mutants that survive the examples.** For each question, run `mutants(solution.code, scene?.bugs)` against the
   tests. Keep a mutant when it **passes every `Example …` test** but **fails at least one other test**. That
   failing test proves a breaking input exists (and becomes the hidden "answer" for hints).
2. **Authored wrong solutions** from the question's `mistakes` list, e.g. Best Time to Buy and Sell Stock:
   "Returning max − min of the whole array". Optional new field on a question:

   ```js
   hacks: [{ label: 'Spread of the whole array', why: 'The max may come before the min.',
             code: `function maxProfit(p) { return Math.max(0, Math.max(...p) - Math.min(...p)); }` }]
   ```

The search in (1) is done **once by a script**, not in the browser:
`scripts/find-hackable.mjs` → `src/content/hackable.json`
(`{ [questionId]: [{ label, explain, line, code, brokenBy: <test index> }] }`, at most 3 per question). It is
re-run like `check-refs`, and `validate-content` checks each entry still differs from the reference on `brokenBy`.

Expected coverage: unknown until the script runs; the off-by-one / comparison / min-max rules fire on most array,
two-pointer and binary-search questions. Questions with no hackable entry simply show no Hack tab.

## User flow

```
┌ Hack it ──────────────────────────────────────────────── 1 of 2 ┐
│ This solution passes both examples. Find an input where it is    │
│ wrong.                                                           │
│  1 function maxProfit(prices) {                                  │
│  2   let min = prices[0], best = 0;                              │
│  3   for (let i = 1; i < prices.length - 1; i++) {   ← (no hint)  │
│  …                                                               │
│ Your input (prices):  [ 3, 1, 9              ]   [Try it]         │
│                                                                  │
│ ✓ Broken!  wrong: 0   ·   correct: 8                             │
│ [▶ Watch both runs]   [Next wrong solution]                      │
└──────────────────────────────────────────────────────────────────┘
```

- **Try it** → parse and type-check the input (`ownInput.js`), run the wrong code and the reference in two
  workers (`pair.js`), compare with the question's own `compareResult` mode.
- Results: **Broken** (outputs differ), **Survived** (same output — "try a case the loop might skip"),
  **Invalid input** (does not match `paramTypes`, or the reference throws / times out on it).
- **Hints**, one at a time: (1) the mutant's `label`, (2) the line it touched, (3) the `scenario` of the
  `brokenBy` test, (4) reveal that test's input.
- **Watch both runs** → `RunPair.jsx`: wrong run and reference run, synced, stopping at the first divergence
  (same `firstDivergence` used by Animate, on the variable the mutant's line writes).

## Input validity — the hard part

An input outside the constraints breaks solutions unfairly (an empty array when `1 <= n`). Three layers:
1. Type check against `paramTypes` (`int[]`, `string`, `int[][]`, …) — automatic.
2. The **reference must succeed** on it within its time limit — automatic.
3. Optional per-question `validInput` predicate (a string, like the existing `argsGen`), e.g.
   `'(prices) => prices.length >= 1 && prices.every((p) => p >= 0 && p <= 1e4)'`. Without it, the constraints
   text is shown under the input as a reminder. Add these first for questions whose hackable bug is only exposed
   by an *invalid* input — the script can flag those (the only failing test violates the constraints).

## Mount points (the only edits to existing files)

| File | Edit |
|---|---|
| `src/components/question/CodeWorkspace.jsx` | one tab button "Hack it" after Animate, shown only when `labs` is on, the language is JS and `hackable[question.id]` exists; one lazy import |
| `src/state/progressReducer.js` | one new case `HACK_DONE` writing `progress.hacks[qid][i] = true` |
| `src/content/achievements.js` | optional: "First hack", "Hacker" (10), "Every bug in a topic" |
| `package.json` | `"hackable": "node scripts/find-hackable.mjs"` |

Java / C++: not in the first version (the wrong code is JS). The input and the result are language-neutral, so a
later version could show the Java/C++ text of the same mutant.

## New files

`scripts/find-hackable.mjs`, `src/content/hackable.json`, `src/components/labs/HackIt.jsx`,
`src/runner/pair.js`, `src/runner/ownInput.js`, `src/components/labs/RunPair.jsx`, `tests/hack.test.js`.

## Tests

- `find-hackable` keeps a mutant only if it passes all examples and fails ≥ 1 test (fixture question).
- Verdict: broken / survived / invalid for a hand-made wrong solution.
- `HACK_DONE` is idempotent; old progress without `hacks` loads.
- `npm run check` stays green; `validate-content` verifies every `hackable.json` entry.

## Batches

1. Script + JSON + validation; report coverage per topic (how many questions get ≥ 1 hack).
2. `HackIt.jsx` with try / verdict / hints, `ownInput.js`, `pair.js`, progress.
3. `RunPair.jsx` watch-both, achievements, authored `hacks` for the 10–20 best `mistakes`.

## Risks

- Some surviving mutants are only broken by large inputs (timeouts, not wrong answers) — the script drops mutants
  whose only failing test is a `timeLimitMs` test.
- A mutant can be *equivalent* (never wrong) — impossible here, since we keep only mutants a test already breaks.
