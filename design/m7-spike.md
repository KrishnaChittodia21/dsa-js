# M7 spike: running Java and C++ in the browser (2026-11-06)

**Verdict: go for both**, with the limits below. Every reference was compiled and run in WebAssembly with the same
generated drivers as `scripts/check-refs.mjs` and judged by the same `checkPass`.

| | Java: TeaVM javac (official playground build) | C++: `@yowasp/clang` 22.0.0-git20542-10 |
|---|---|---|
| References passing | **402 / 426** (23 compile gaps, 1 deep recursion) | **426 / 426** (with an 8 MB stack) |
| Download (first use, then cached) | 6.9 MB raw · ~4.2 MB gzip | ~23 MB brotli from jsDelivr (105 MB raw) |
| Toolchain ready | worker 50 ms + class library 80 ms (local) | first compile 3.0 s (includes compiling clang) |
| Compile, per run | ~1.1 s (1.0–2.1 s) | ~2.2 s in the browser (1.5 s median in Node) |
| Run all tests of a question | 13 ms – 1.4 s (median ≈ 30 ms) | 13 ms – 1 s (median ≈ 55 ms) |
| Program size | ~625 KB wasm | ~600 KB wasm |
| Memory | small | JS heap ~104 MB after 6 compiles, plus clang's own wasm memory |
| Browser needs | WebAssembly GC: Chrome 119+, Firefox 120+, Safari 18.2+ | WebAssembly (all current browsers) |
| License | Apache-2.0 (teavm-javac); class library from OpenJDK (GPL-2.0 + Classpath exception) | ISC (YoWASP); LLVM Apache-2.0 with LLVM exception |

Measured in Chrome via the throwaway spike pages (scratchpad `spike/java/index.html`, `cpp.html`), C++ also in
Node (`spike/cpp-node.mjs`). Download times are not in the numbers (files were served locally).

## What the drivers need (both differ slightly from the desktop drivers in `harness.js`)
- **Java (TeaVM):** no `System.in` and no real threads → tests come in as `main(args[0])` and `run()` is called
  directly. TeaVM's `StringBuilder.append(Object)` is ambiguous → the driver writes `append(String.valueOf(o))`.
- **C++ (WASI libc++):** built **without exceptions** (`__cxa_throw` missing, no libunwind) → two stub functions
  make `throw` end the program (the driver's `catch` never runs). Link with `-Wl,-z,stack-size=8388608`: the
  default 64 KB stack crashed 4 recursive references.
- **Both:** a crash (stack overflow, trap, uncaught throw) ends the whole program. The driver must print each
  test's line as soon as it is done, and the host restarts the program at the next test, so one bad test does not
  hide the rest. Run in a Web Worker; a time limit terminates the worker (infinite loops).

## Limits found
1. **Java class-library gaps (TeaVM):** `Map.Entry` does not resolve ("cannot find symbol class Entry", although
   `entrySet()` works with `var`), and `Integer.sum` / `Integer::sum` are missing. 23 references use them
   (`merge(k, 1, Integer::sum)`, `for (Map.Entry<…> e : …)`). Workarounds that compile: `var e`, `(a, b) -> a + b`.
2. **Java recursion depth:** the browser stack holds roughly 1 000–5 000 Java frames; path-sum-ii's 5 000-deep
   chain overflows (C++ with 8 MB is fine). Recursive learner code on deep tests will hit this.
3. **C++ has no exceptions:** a `throw` stops the run (reported as an error for that test).
4. **Hosting:** clang is too big for the repo → load it from jsDelivr (immutable, brotli, pinned version). TeaVM is
   not on npm officially and teavm.org sends no CORS / compression headers → vendor the 5 files (6.9 MB) into
   `public/` pinned by checksum.

## Proposed M7 build (after this spike)
1. **Runner:** `src/runner/native/` — a worker per language that loads its toolchain on first use (progress
   shown), compiles, runs all tests with per-test restart after a crash, and a time limit; browser driver variants
   in `harness.js` (Java args / no thread / `String.valueOf`; C++ stubs + stack flag).
2. **UI:** Run / Submit / Custom tests for Java and C++ in the workspace; a one-time "downloading the Java/C++
   compiler (~4 / ~23 MB)" notice; compile errors with line numbers; a hint for the two TeaVM gaps.
3. **Checks:** a script that runs every reference through the browser runner; an infinite-loop timeout test;
   the 23 Java references and path-sum-ii adjusted (or kept, if the gaps get fixed upstream).
