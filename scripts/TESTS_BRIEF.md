# Brief: upgrading question test suites

DSA Journey runs learners' JavaScript against each question's `tests`. The first 3 tests are visible
(Run); all tests run on Submit. When a test fails, the UI shows its **scenario** name and **hint**, so the
learner learns *which situation their code doesn't handle*. Your job: make every assigned question's
test suite excellent.

Read first: `/Users/krishna/nx/dsa-js/CONTENT_GUIDE.md` §4 (question schema) and
`/Users/krishna/nx/dsa-js/src/runner/core.js` (how tests run: io, harness, checker, design ops,
`argsGen`, `timeLimitMs`).

## Test format
```js
tests: [
  { scenario: 'Example 1', hint: 'The basic case from the problem statement.', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { scenario: 'Pair uses the last element', hint: 'Make sure your loop reaches the final index — an off-by-one bound skips it.', args: [[1, 5, 3, 7], 10], expected: [2, 3] },
  { scenario: 'Large input (n = 10^5)', hint: 'An O(n²) double loop is too slow here; one pass with a Map is O(n).',
    argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i), 199997]', expected: [99998, 99999], timeLimitMs: 1000 },
]
```
* `scenario` — short noun phrase (≤ 6 words), unique within the question: "Empty array", "All duplicates",
  "Negative numbers only", "Answer at index 0", "Large input (n = 10^5)".
* `hint` — 1–2 sentences: what is special about this case and what a wrong solution typically does
  ("If you initialise best to 0, an all-negative array returns 0 instead of the largest element.").
  Never paste the solution.
* `argsGen` — a **string** with a deterministic arrow function returning the args array. Use it for any
  input with more than ~100 elements (never put big literal arrays in the file). No `Math.random` — use a
  tiny inline LCG if you need pseudo-random data.
* `timeLimitMs` — only on large/perf tests. Choose size + limit so that (a) the reference solution takes
  less than limit/3 in Node and (b) the naive approach described in the question's approach/alternative
  takes clearly longer than the limit (measure it!). Typical limit 1000 ms. A learner's whole run must
  stay well below 10 s, so keep the reference's total runtime per question under ~1 s.
* `expectedGen` — a **string** function returning the expected value (use for big outputs instead of
  literals; compute it with a simple closed form or an independent brute force, not the reference).
* Design questions keep `ops`/`args`/`expected`, plus `scenario` and `hint`. For performance tests use
  `opsGen: "() => ({ ops, args, expected })"` — a deterministic generator for a long operation sequence
  (e.g. 10^5 calls) with `timeLimitMs`, so an O(n)-per-operation design fails.
* Questions with a `checker` / `expectedAnyOf` keep working the same way; `expected` must still be a valid answer.

## What each suite must contain (10–15 tests)
1. **Tests 1–3 = the statement's examples** (they are the visible tests) — scenario "Example 1/2/3".
2. **Boundaries allowed by the constraints**: smallest input (empty if allowed, otherwise size 1),
   single element, two elements, maximum values / min values, zeros, negatives (if allowed).
3. **Structure edge cases**: all equal / all duplicates, already sorted, reverse sorted, answer at the
   start / end / whole input, no valid answer (−1 / [] / false), ties.
4. **One test per listed common mistake**: read the question's `mistakes` array — each mistake should
   be caught by at least one test, and that test's hint should name the mistake.
5. **Performance**: 1–2 large tests with `argsGen` + `timeLimitMs` wherever the intended complexity
   matters (skip only when constraints are tiny, e.g. backtracking with n ≤ 10 — then test the
   largest allowed n without a time limit).
Never test outside the stated constraints.

## Correctness
* Compute expected values with an **independent brute force** wherever feasible (a separate, obviously
  correct implementation in a scratch script), not just by running the reference solution. For large tests
  where brute force is impossible, use the reference and cross-check with `alternative.code` if present.
* If a new test reveals a bug in the reference `solution.code`, fix the solution and say so in your report.
* Keep existing tests that are correct (relabel them); fix or replace wrong ones.
* Do not change statements, hints, approaches, etc. — only `tests` (and `solution.code` if buggy).

## Workflow
* Edit only the question files in your assigned topics. Scratch scripts in the session scratchpad must have
  unique names (other agents share it).
* If a GateGuard hook asks for facts before a Bash/Write command, provide them; split big edits.
* Validate: `cd /Users/krishna/nx/dsa-js && node scripts/validate-content.mjs --topic <id>` — must end with
  `✔ content valid`, no errors, and **no warnings** about time limits.
* Final report (short): per topic — questions updated, min/avg tests per question, number of timed tests,
  any reference-solution bugs found, anything the orchestrator should know.
