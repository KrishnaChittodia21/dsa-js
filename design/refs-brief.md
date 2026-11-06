# Java / C++ reference brief (M6, 6c)

You write the **Java and C++ reference solutions** for the questions you are given: two files per question,
`src/content/topics/<topic>/solutions/<id>.java` and `<id>.cpp` (create the `solutions/` folder if needed). They
appear in the Solution tab next to the JavaScript reference, so a learner compares the three line by line.

## Read first
1. The question file `src/content/topics/<topic>/questions/<id>.js`: statement, `solution.code` (the JS reference),
   `approach`, `complexity`, `paramTypes` / `returnType` (or `methodTypes`), `io.mutates`, `compare`, `checker`.
2. The exact signature to keep: `node scripts/check-refs.mjs --starter java <id>` and `--starter cpp <id>`.
3. Two finished examples: `src/content/topics/linked-list/solutions/lru-cache.{java,cpp}` and
   `src/content/topics/backtracking/solutions/sudoku-solver.{java,cpp}`.

## Rules
- **Same algorithm and complexity as the JS reference**: a learner reads them side by side. Translate the idea,
  not the JS quirks: use the language's own tools (Java: `HashMap`, `ArrayDeque`, `PriorityQueue`, `int[]`;
  C++: `unordered_map`, `vector`, `priority_queue`, `deque`). Where the JS uses a toolkit class (MinHeap, Deque,
  UnionFind…), use the standard library equivalent, or a small helper class when there is none (union-find).
- **Keep the starter's signature exactly**: class name, method name, parameter names and types. Return the declared
  type (e.g. `int[][]` in Java, `vector<vector<int>>` in C++), not a `List`. `void` + in-place questions change
  the argument (it is what gets checked).
- **The file is only what a learner would write**: no `import` / `#include`, no `main`, no reading input, no
  printing. Provided already: Java `java.util.*`, `java.util.function.*`, `java.util.stream.*`, `java.math.*`;
  C++ the usual standard headers (algorithm, vector, string, map/set, unordered_*, queue, stack, deque, list,
  numeric, functional, climits, cmath, cstring, bitset, array, tuple, sstream, random, iomanip, optional,
  string_view…) with `using namespace std;`
  (no `<bits/stdc++.h>`). `ListNode` / `TreeNode` (val, next / left, right; LeetCode constructors) are provided:
  do not declare them.
- Java: `class Solution` (not `public`); helpers as private methods, or extra non-public classes in the same file.
  C++: helpers as private members, or classes / structs above `Solution`.
- **No state that outlives one call**: no `static` mutable fields (Java), no global variables (C++). Every test
  creates a new `Solution`, but statics and globals would leak between tests.
- **Overflow**: JS numbers are exact to 2^53. Where sums / products can pass 2^31 use `long` / `long long`
  (the tests include large cases and will catch it). Keep `% MOD` steps where the JS has them.
- Readable, idiomatic, LeetCode-style code; 4-space indent; a short comment only for the non-obvious why
  (the same few comments as the JS reference is a good guide). No commented-out code.
- **Browser-safe (M7: references also run in the browser, Java via TeaVM, C++ via clang → WebAssembly):**
  no recursion deeper than ~1 000 levels on the largest test (use an explicit stack); Java: no `Map.Entry` (use
  `var e : map.entrySet()`), no `Integer::sum` / `Long::sum` (use `(a, b) -> a + b`), do not `put` into a map while
  iterating its `keySet()` (iterate a copy), append a boxed `Character` / `Integer` to a `StringBuilder` via a
  primitive local (`char c = …; sb.append(c)`); C++: no exceptions (`throw` ends the run). Check with
  `/scripts/check-refs-browser.html?ids=<ids>` on the dev server.
- Do not edit any other file. If a question's types look wrong (e.g. the signature cannot express the answer),
  say so in your report instead of working around it. Do not run `npm run check` (other agents run in parallel).

## Done when
`DSA_JDK=<given path> node scripts/check-refs.mjs <your ids>` prints ✔ for every file, both languages (it compiles
each file with a generated driver and runs **every** test of the question, large generated ones included, judged
exactly like the JS runner). Use `--show` to see every failing test. Then report: the ids done, anything you could
not make pass, and any type that looked wrong.
