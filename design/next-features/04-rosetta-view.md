# 04 · Rosetta view — one solution in three languages, line by line

**Status:** design only. **Effort:** S–M, 2 batches. **Later.**

## The idea

In the Solution panel, **Compare languages** shows the JS, Java and C++ references side by side, with matching
lines aligned (the loop next to the loop, the swap next to the swap). Notes in the margin flag the traps each
language sets for *this* line:
- Java `Integer` compared with `==`;
- `(lo + hi) / 2` overflowing in Java and C++;
- JS `sort()` without a comparator;
- a C++ `vector` passed by value.

People preparing in Java or C++ usually learn from JS or Python videos. Sites show one language at a time;
none aligns them or explains the differences line by line.

## What exists

- References: `solution.code` (JS) in each question; Java / C++ text through `loadReference(id, lang)` in
  `src/languages/references.js` (lazy `?raw` glob, one chunk per file). `referenceLanguages(id)` lists what exists.
- All 426 questions have all three; all 852 Java/C++ references pass their tests (M6–M7).
- `CodeBlock` (`src/components/ui/`) renders highlighted code.

Nothing here changes; the view only reads them.

## Alignment (pure, `src/lib/rosetta.js`)

No authoring: an automatic line alignment.
1. Normalise each line to a set of *tokens that mean the same in every language*: identifiers (`left`, `mid`,
   `nums`), numbers, operators, and keyword groups (`for`, `while`, `if`, `return`, `push|add|push_back`,
   `length|size()|.length`, `Map|HashMap|unordered_map`).
2. Drop pure boilerplate lines (imports, `class Solution {`, `public:`, lone braces), shown dimmed and unaligned.
3. Align the JS lines with each other language by dynamic programming (like a diff / LCS) where a match scores the
   Jaccard similarity of the token sets, a gap costs a constant. The result is rows of `[js, java, cpp]` line
   ranges; a row may hold several lines on one side (Java's explicit types often take two lines).
4. Fallback: if the alignment scores badly (heavily restructured code, e.g. a custom class in C++), show the three
   unaligned with a note.

`scripts/check-rosetta.mjs` reports the alignment score for every question, so bad ones are known in advance.

## Trap notes (`src/content/languageTraps.js`)

A small table, regex → note, checked against each reference line:

| Lang | Matches | Note |
|---|---|---|
| Java | `Integer` value compared with `==` / `!=` | Compares references; works only for −128…127. Use `.equals` or `int`. |
| Java, C++ | `(lo + hi) / 2`, `(l + r) / 2` | Can overflow `int`; `lo + (hi - lo) / 2`. |
| JS | `.sort()` with no comparator | Sorts as strings: `[10, 9].sort()` → `[10, 9]`. |
| C++ | `vector<…> name` parameter without `&` | Copies the whole vector on every call. |
| C++ | `int` sum / product of large values | Use `long long`. |
| Java | `map.get(k) + 1` with `Map<…, Integer>` | Throws on a missing key; `getOrDefault`. |
| JS | `new Array(n).fill([])` | Every slot is the same array. |

Start with ~20 rules; each must match at least one real reference (the script checks), so none is dead.

## User flow

```
Solution ▸ [Explanation] [Code] [Compare languages]
   JavaScript                 Java                          C++
   let lo = 0, hi = n - 1;    int lo = 0, hi = n - 1;       int lo = 0, hi = n - 1;
   while (lo <= hi) {         while (lo <= hi) {            while (lo <= hi) {
     const mid = (lo+hi)>>1;    int mid = lo + (hi-lo)/2;  ⚠  int mid = (lo + hi) / 2;  ⚠ can overflow int
```

- Phone width: a segmented control picks two of the three; rows stay aligned.
- Hovering (or focusing) a row highlights it in all columns.

## Mount points

| File | Edit |
|---|---|
| `src/components/question/SolutionDetails.jsx` | one extra tab, only when `labs` is on and `referenceLanguages(id).length === 2`; lazy import |

No progress, no reducer change.

## Tests

- Alignment of a fixture binary search in three languages pairs the `while`, `mid` and `return` lines.
- Boilerplate lines are excluded from scoring.
- Each trap rule matches its example and not a near miss.
- `npm run check` green.

## Batches

1. `rosetta.js` + `check-rosetta.mjs` (scores for all 426) + tests.
2. The tab, the trap table, phone layout.
