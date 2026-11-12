# 05 · Edge-case radar — what kinds of input beat you

**Status:** design only. **Effort:** M, 3 batches. **Later.**

## The idea

Every test gets **categories**: empty, single, two items, duplicates, negatives, zero, all equal, sorted,
reverse-sorted, large n, extreme values, disconnected, cycle, …

- **Per question**, after Submit: a small map of the categories and how you did on each. Passed / failed / not
  tested, plus which categories *this problem's* hidden tests never cover ("your code was never tried on
  negatives — constraints allow them").
- **Across all questions**, on the Progress page: *your* weak categories, e.g. "You fail **duplicates** tests
  3× more often than average; 7 questions." Each one links to its questions.

Sites show pass/fail per test. Nobody turns your failures into a profile of the edge cases you forget.

## What exists

- Each test has `scenario` and `hint` prose; many already name the case ("Single day", "All prices equal",
  "Large random input (n = 10^5)").
- Big tests carry `argsGen` and `timeLimitMs`.
- `Q_SUBMIT` in `progressReducer.js` records submissions (to check in batch 1 whether per-test results are kept;
  if not, the new key below stores only what is needed).

## Tagging (no hand-tagging of 5,000+ tests)

`scripts/tag-tests.mjs` → `src/content/testTags.json` (`{ [qid]: [[tags of test 0], …] }`), from two sources:
1. **Shape of the arguments** (exact, computed): empty, single, two, all-equal, sorted, reverse-sorted,
   has-duplicates, has-negative, has-zero, at-constraint-max (when the constraint is parseable), large-n
   (`argsGen` / `timeLimitMs`).
2. **Words in `scenario` / `hint`** (keyword rules): "cycle", "disconnected", "overflow", "leading zeros",
   "unicode", "no solution", …

Optional override on a test: `tags: ['cycle']`. `validate-content` checks tags are from the known list.

## Storage

New key `edgeMisses: { [tag]: { failed, seen } }`, updated by a new action `EDGE_RESULT` dispatched after each
JS/Java/C++ **submit**. It holds counts only — no copy of the code or the inputs. Rates use `failed / seen` against
the course-wide share of that tag (from `testTags.json`) to find "more often than average".

## User flow

```
Submit ✓ 11/13  ·  Edge cases
  ✓ single   ✓ two   ✓ all equal   ✗ duplicates   ✗ large n   – negatives (not tested)
  Duplicates: [2, 2, 1] expected 1, got 2     [Find where it went wrong →]   ← links to 01 when built

Progress page ▸ Your edge cases
  duplicates   ██████░░  failed 6 / 14   ← 3.1× your average     [7 questions]
  empty        ██░░░░░░  failed 2 / 21
```

## Mount points

| File | Edit |
|---|---|
| `CodeWorkspace.jsx` (Test results) | one line of chips under the summary, `labs` only, lazy |
| `src/state/progressReducer.js` | new case `EDGE_RESULT` |
| Progress page | one card, lazy |

## Tests

- Shape tags on fixtures (`[]` → empty; `[3,3,3]` → all-equal, single-value; sorted / reverse detection).
- Keyword tags; override wins.
- `EDGE_RESULT` adds counts; old progress without `edgeMisses` loads.
- `npm run check` green.

## Batches

1. Tagger script + JSON + validation + coverage numbers per tag.
2. Per-question chips after Submit, `EDGE_RESULT`.
3. Progress page card and links.

## Risks

- Keyword tags can be wrong ("no cycle here" tagged *cycle*). Shape tags carry the weight; keyword rules are kept
  narrow and the script prints its keyword hits for a one-time review.
