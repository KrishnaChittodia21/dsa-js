# Brief for content authors (subagents)

You are writing content for "DSA Journey", a React app that *teaches* DSA in JavaScript like a personal
tutor (Explain → Ask → Wait → Correct → Explain deeper → Practice → Review). The UI is built separately;
you only write data files.

## Read first (in this order)
1. /Users/krishna/nx/dsa-js/CONTENT_GUIDE.md — the schema contract. Follow it exactly.
2. /Users/krishna/nx/dsa-js/src/content/curriculum.js — topic metadata, prerequisites and the
   `plannedQuestions` for YOUR topics (use exactly these ids / file names).
3. The exemplar topic — match its depth, tone and interactivity:
   /Users/krishna/nx/dsa-js/src/content/topics/sliding-window/topic.js
   /Users/krishna/nx/dsa-js/src/content/topics/sliding-window/questions/*.js
4. /Users/krishna/nx/dsa-js/src/toolkit/index.js (globals available to solutions) and
   /Users/krishna/nx/dsa-js/src/runner/core.js (how tests run: io conversions, harness, checker, design).

## What to produce for each assigned topic
* `src/content/topics/<topic-id>/topic.js` — full lesson with ALL standard sections (what, why, when,
  recognize, intuition, brute-force, optimized, template, implementation, dry-run, mistakes, complexity,
  interview-tips, js-tools). Multi-pattern topics: give each pattern its own intuition/optimized/template/
  implementation sections (ids like `optimized-lower-bound`) so every pattern listed in the curriculum
  description is actually taught.
  - 6–10 `checkpoint` blocks (4 options, varying answer index, a misconception for EVERY wrong option,
    `deeper` where useful) and 2–4 `reflect` blocks, spread through the lesson. Checkpoint ids:
    `<topic-id>-cp-<n>`.
  - Use `visual` blocks wherever one of the scenarios in CONTENT_GUIDE §6 fits your topic.
  - `patterns[]` with every field (whyItExists, whenToUse, clues, whenNotToUse, template, variations,
    mistakes, evolution). Pattern ids must be globally unique — make them specific
    (e.g. `graph-bfs`, `tree-level-order`, `monotonic-stack-next-greater`), never bare `bfs`/`dfs`.
  - Explain in simple English first, then formal terms; define every term; real-world analogies;
    brute force → optimized; but DON'T over-simplify — explain WHY things work (proof sketches,
    invariants, amortized arguments, average vs worst case). Include JavaScript-specific advice.
  - Respect prerequisites: do not rely on concepts from topics that come later in the curriculum
    (you may mention them as "you'll see this later in X").
* One file per planned question in `src/content/topics/<topic-id>/questions/<id>.js` with EVERY field
  from CONTENT_GUIDE §4: statement (in your own words, do not copy LeetCode text verbatim), examples,
  constraints, think, patternChallenge (4 plausible options drawn from patterns across the whole
  curriculum; vary the answer index), 2 hints, approach (brute force → optimized), starterCode,
  functionName/className + paramNames, tests (6–10, correct, with edge cases, each running well under
  1 second), solution.code (clean, idiomatic modern JS, commented where it matters), dryRun, complexity
  with explanation, alternative approach, mistakes.
  - Set `order` so questions progress from simplest to hardest within each difficulty.
  - Use `io`, `compare`, `checker`, `harness`, `kind: 'design'` as needed (see guide). For problems with
    multiple valid outputs, use `compare: 'unordered'`/`'nested-unordered'` or a `checker`.
  - Premium LeetCode problems: set `source.premium: true`; still write them fully.
  - `classic-*` ids: problems not on LeetCode — `source: { platform: 'Classic', note: '...' }`.
  - Complexity-analysis topic uses `kind: 'quiz'` questions (code snippet + 4 options).
  - NEVER add company attributions (no `companies` field).

## Rules
* Only create/edit files inside your assigned topic folders. Do not edit curriculum.js, the guide,
  the runner, the toolkit or other topics. If you think the curriculum/runner needs a change, say so
  in your final report instead.
* Files are plain ES modules: `export default { ... }`. Code is stored in template strings — escape
  backticks and `${` inside them (or avoid template literals in solution code).
* Creating files: a GateGuard hook may block the Write tool on first touch of a new file and ask for
  facts. Creating files with Bash heredocs (`cat > path <<'EOF' ... EOF`, quoted delimiter) works and
  is fine to use. Write large topics in several files/commands rather than one enormous command.
* Validate continuously: `cd /Users/krishna/nx/dsa-js && node scripts/validate-content.mjs --topic <topic-id>`
  (runs every solution against every test). Finish only when your topics report **0 errors** and all
  planned questions are written. Warnings about checkpoint counts must also be resolved.
* Do not run `npm install`, the dev server, or builds.

## Final report (keep it short)
Per topic: checkpoints / reflects / E-M-H counts / tests, the validator's final line, and anything you
could not do or think the orchestrator should change.
