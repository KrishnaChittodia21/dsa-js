# Animate My Run — build plan (v2: unique scenes, 100 questions/day)

Press **Run** → your solution executes in the worker, every read/write/swap is recorded, and a
**question-specific, interactive scene** replays *your* run. The verdict comes from the final state;
"first wrong step" is a hint only on questions that mandate an algorithm. Mockup: `design/animate-my-run.html`.

**Scope:** 426 coding questions (398 function + 28 design-class). The 12 quiz questions get no scene.

**Budget assumptions**
- Your time: 1–2 h/day in engine weeks; **production runs 100 questions/day regardless of hours** — spend whatever time the day needs.
- Claude weekly limit resets **Wednesday 09:00**. A "week" = Wed 09:00 → Tue night.
- Estimated total: ~10–13M tokens. Engine weeks ~1–1.5M/week; **production week ~6–7M** (≈1–1.5M/day at 100 questions/day).
  The daily target is fixed at 100; the only thing that can stop a day short is the weekly usage limit (see Pacing).

---

## What "unique & interactive" means here

Every question gets its own **scene file** (`src/visualizations/scenes/<question-id>.js`), built on shared renderers:

| Unique per question | Shared (built once) |
|---|---|
| Visual metaphor (e.g. Koko's banana piles, ship cargo for capacity search, rooms for meeting intervals) | Recorder, frame format, timeline, verdict |
| Which variables/pointers are shown and how they're labelled | Renderers: bars, cells, grid, list, tree, graph, stack/queue/heap, DP table, op-timeline |
| Step narration written for that problem | Interaction kit (below) |
| Which interactions are switched on + the "aha" moment it pauses on | Theme tokens, reduced-motion, phone layout |
| Custom "wrong-run" explanations for that problem's common bugs | QA harness |

**Interaction kit** (each scene picks 2–4):
1. **Edit the input** — drag bars / click cells / add nodes, then re-run your code on it.
2. **Predict next step** — pause and ask "which pair swaps next?" (reuses the existing predict mode).
3. **Hover to inspect** — hover a bar/node/cell to see its value history across the run.
4. **Compare with reference** — ghost overlay of the reference run; jump to the first divergence.
5. **Break it** — one-click "inject the classic bug" (off-by-one, wrong comparison) to see how it fails.
6. **Complexity meter** — live counter of comparisons/visits vs. the target Big-O curve.

---

## Pacing rules (the weekly limit)

**Engine weeks (W1–W4):**

| Day | Session | Share of week |
|---|---|---|
| Wed–Thu | Build — new code | ~25% each |
| Fri–Sat | Finish — tests, wiring | ~15% each |
| Sun | Review — you test in browser | ~5% |
| Mon | Fix — small fixes | ~10% |
| Tue | Buffer — commit, log, no Build | ~5% |

**Production week (W5)** — **fixed 100 questions/day** Wed→Sun, Mon–Tue fixing only:
- Every day = **4 batches of 25**, no scaling down. You start each batch, it runs on its own, the QA harness checks every scene.
- Your time that day: whatever it takes — start batches, read the harness report, spot-check **~10 scenes** (2–3 per batch).
- Production starts **Wed 09:00 right after the reset**, so the full weekly limit goes to it (W4 must leave no heavy work for Mon–Tue).
- Run `/usage` after each batch. If the limit runs out mid-week, stop there and **resume at 100/day after the next Wednesday 09:00 reset** — the daily count never drops, only the finish date moves.
- The W4 pilot tells you in advance whether 426 questions fit in one week's limit or need two.

**Always**
- One task per session; start fresh (`/clear`): *"Read design/animate-my-run-plan.md and do task W2.1."*
- End each session: tick the task + one line in the Progress log.
- Point at exact files; never start a Build task on Tue.

---

## Milestones

| | Ships | Done by |
|---|---|---|
| M1 | Engine + tab, Bubble Sort end to end | Tue Nov 10 |
| M2 | All renderers + interaction kit + scene format | Tue Nov 17 |
| M3 | Pipeline + QA harness, 20 pilot scenes live, daily batch size known | Tue Nov 24 |
| M4 | **All 426 scenes generated** (100/day) | Sun Nov 29 |
| M5 | QA backlog cleared, deployed | Tue Dec 8 |

---

## Week 0 — Sun Oct 25 → Tue Oct 27 (light)
- [ ] W0.1 Review the mockup; decide pause length on the first wrong step and whether to keep the reference strip.
- [ ] W0.2 Run `/usage`, note plan + % in the Progress log.
- [ ] W0.3 Create branch `feat/animate-run` from `main`.

## Week 1 — Wed Oct 28 → Tue Nov 3 · Recorder (inputs + your own variables)
- [ ] W1.1 (Build) Proxy recorder for args in `src/runner/worker.js` / `src/runner/core.js`; events `{op, path, value}`; ~2,000-event cap with sampling.
- [ ] W1.2 (Build) Code-rewrite pass (parser, e.g. acorn) so locals — `dp`, `stack`, `seen`, loop vars — are recorded too. Check bundle size + slowdown; lazy-load it only for the Animate tab.
- [ ] W1.3 (Finish) Frame builder → frames in the `Visualizer` panel format (`src/visualizations/panels.jsx`).
- [ ] W1.4 (Finish) Verdict: pass/fail from final state; `algorithm` field enables step comparison.
- [ ] W1.5 (Fix) Node tests: reference + buggy bubble sort through the recorder. Commit.

## Week 2 — Wed Nov 4 → Tue Nov 10 · Tab + first renderers → **M1**
- [ ] W2.1 (Build) "Animate my run" tab in `src/components/question/CodeWorkspace.jsx`: Run → running → auto-play → verdict; scrub after.
- [ ] W2.2 (Build) Renderers: bars, cells (strings), grid, linked list, tree.
- [ ] W2.3 (Finish) Bubble Sort question wired end to end.
- [ ] W2.4 (Review/Fix) Browser test incl. reduced motion + phone. Merge, deploy. **M1.**

## Week 3 — Wed Nov 11 → Tue Nov 17 · Remaining renderers + interaction kit → **M2**
- [x] W3.1 (Build) Renderers: graph, stack/queue, heap, DP table, design-class op-timeline.
- [x] W3.2 (Build) Interaction kit 1–6 as reusable components.
- [x] W3.3 (Finish) Scene file format (`scenes/<id>.js`): metaphor, renderer, watched vars, narration, interactions, bug explanations. Write 3 hand-made reference scenes (bubble sort, binary search, BFS) as the gold standard.
- [ ] W3.4 (Review/Fix) **M2.**

## Week 4 — Wed Nov 18 → Tue Nov 24 · Pipeline + pilot → **M3**
- [x] W4.1 (Build) Generator brief: question file + gold scenes → new scene file. Batch runner for 25 questions.
- [x] W4.2 (Build) QA harness, run on every scene: reference solution must PASS, an auto-injected bug must FAIL at a sensible step, no crash, no empty frames, renders at phone width.
- [x] W4.3 (Finish) **Pilot: 20 questions** across all families. Measure `/usage` % per 25-question batch → project whether 426 questions (≈17 batches) fit in one weekly limit or spill into the next week.
- [ ] W4.4 (Review) Watch all 20; tighten the brief where scenes feel samey or confusing.
- [ ] W4.5 (Fix) Merge pilot scenes. **M3.**

## Week 5 — Wed Nov 25 → Tue Dec 1 · Production, 100/day → **M4**
Grouped so each day reuses the same renderers:

| Day | Batches (25 each) | Topics |
|---|---|---|
| Wed Nov 25 | 4 | arrays, array-techniques, two-pointers, sliding-window, prefix-sum, sorting, binary-search (part) |
| Thu Nov 26 | 4 | binary-search (rest), intervals, greedy, hashing, string-algorithms, bit-manipulation, complexity |
| Fri Nov 27 | 4 | linked-list, stack, queue-deque, heaps, trees, bst |
| Sat Nov 28 | 4 | tries, graphs, shortest-path, topological-sort, mst, union-find, advanced-graphs |
| Sun Nov 29 | 2 | dp-1d, dp-2d, dp-advanced, recursion, backtracking, advanced-structures, 28 design classes (remaining ~26 + design) |

- [ ] W5.1–W5.5 one checkbox per day above: batches run, harness report reviewed, ~10 spot-checked.
- [ ] W5.6 (Mon) Fix the harness failures from the week.
- [ ] W5.7 (Tue) Buffer — no generation. **M4: all 426 generated.**

## Week 6 — Wed Dec 2 → Tue Dec 8 · QA backlog + ship → **M5**
- [ ] W6.1 (Build) Re-generate scenes you flagged as weak (expect 10–15%).
- [ ] W6.2 (Finish) Performance on large inputs; accessibility pass (keyboard for every interaction).
- [ ] W6.3 (Review) Final walk-through, one scene per topic.
- [ ] W6.4 (Fix) Docs in `CONTENT_GUIDE.md` (how to add a scene for a new question). Merge, deploy. **M5.**

---

## Progress log
<!-- one line per session: date · task · result · /usage % after -->
2026-11-05 · W3.1–W3.3 · renderers, interaction kit, scene format + 3 gold scenes done (batch 4c); W3.4 = your browser review
2026-11-05 · W4.1–W4.3 · QA harness + brief + 20-scene pilot (23/23 pass); ~25k tokens/scene; W4.4 = your review of the 20
2026-11-05 · W5 batch 1 · 25 scenes (arrays, array-techniques), 48/48 pass QA; ~0.75M tokens for the batch
2026-11-05 · W5 batch 2 · 25 scenes (two-pointers, sliding-window part), 73/73 pass QA; ~0.7M tokens
2026-11-05 · W5 batch 3 · 25 scenes (sliding-window end, prefix-sum, sorting), 98/98 pass QA; ~0.75M tokens
