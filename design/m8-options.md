# M8 · Animate my run for Java and C++ — options (2026-11-06)

**Today:** Animate my run is JavaScript-only. It rewrites the learner's code with a parser (`@lezer/javascript`)
so every statement reports the variables in scope (`src/runner/instrument.js`), records up to 2 000 steps
(`recorder.js`), and turns them into frames and the question's scene (`runFrames.js`, `scenes/`).

**What M7 changed:** Java and C++ now compile and run in the browser (TeaVM, clang → WebAssembly), stream their
output line by line, and the editor already ships Java and C++ parsers from the same family (`@lezer/java`,
`@lezer/cpp`). So the same "rewrite the source, record each step" approach is possible without a new dependency.

## Option A · Reference animation + your output (the plan's default) — ~4–6 h
In Java / C++ the Animate tab picks a test, runs **your** code on it (M7 runner) and plays the **JavaScript
reference's** animation of the same test, then shows your output next to the expected one and the first place
they differ.
- ✔ Small, no new risk; every scene works as it does today.
- ✘ The steps are not *your* code: no line highlight in your Java / C++, no "your variables at this step".

## Option B · Real tracing of your Java / C++ — ~25–35 h (Java ~12–16 h, C++ ~13–19 h)
Same design as JavaScript: parse the learner's code (`@lezer/java` / `@lezer/cpp`), insert
`__rec(line, "name", name, …)` after each statement with the variables **in scope at that point**, compile with
a tracing driver that prints each step as a marked JSON line (capped at 2 000 steps), and feed the steps to the
existing frames and scenes.
- ✔ The real thing: your line highlighted, your variables, the question's scene driven by your run.
- ✘ Harder than JS: block scoping (only variables declared before that point), every value needs a JSON writer
  (Java: `Map`, `Set`, `Deque`, `PriorityQueue`, records…; C++: `map`, `unordered_*`, `stack` / `queue` /
  `priority_queue` copies, templates with no writer → shown as "?"), each traced step adds a compile-heavy
  serialisation (slower runs), TeaVM / WebAssembly quirks. Scenes read JS-style names and values; Java / C++
  learners use similar names, but some scenes will need small accessor additions.
- Can ship one language first (Java is simpler: one `Object` writer covers most types).

## Option C · A now, B later
Ship A in this milestone (Java / C++ learners get an animation and a diff today); keep B as a later milestone
once the M5 review items are done.

**Recommendation: C.** A gives every Java / C++ learner something useful within a session; B is a large, risky
build best done after the M5 browser review settles how the JS scenes should look.
