# Shorts brief (M9)

You write **Shorts**: a two-minute animated story per pattern that ends in one question. A learner watches it to
recall a pattern quickly. One file per topic: `src/content/shorts/<topicId>.js` exporting an array of Shorts in the
order of that topic's `patterns` (see `src/content/topics/<topicId>/topic.js`).

## Read first
1. `src/content/shortSchema.js` — the format and every rule the validator checks.
2. `src/content/stepSchema.js` — the step format Shorts reuse (watch steps with frames + panels; a turn step with a
   `choose` task). Panels: array, stack, queue, vars, list, nodes, grid, table, intervals.
3. The topic: its pattern (`topic.js` → `patterns[]`: name, summary, whyItExists, whenToUse, clues, template,
   mistakes) and its lesson (`topic.js` → `lesson.sections`) — **every fact in a Short comes from these**.
4. The topic's step lessons `src/content/topics/<topicId>/steps.js` — real examples of panels, notes and tasks to
   copy the style from (look at a few sections that use the same pattern).

## A Short
```js
{
  id: '<pattern id>',            // exactly the pattern's id
  title: 'Short, concrete title', // not just the pattern name: what it lets you do
  steps: [
    { kind: 'watch', title, lines: [...], frames: [{ say, note, panels }, ...] }, // 1–4 watch steps
    { kind: 'turn', title, lines: [...], panels: [...], task: { type: 'choose', question, options: [{ text, why? }], answer }, solved },
  ],
}
```
- **Story:** (1) the problem the pattern solves, shown on a tiny input where the naive way is clearly wasteful;
  (2) the mechanism, frame by frame on real panels with real values (pointers moving, a map filling, a window
  sliding…); (3) the clue in a problem statement that says "use this". Then **one question** that checks the idea,
  not trivia: e.g. "which value does the map need to hold here?", "what moves next?", "which problem fits?".
- **Size:** at most 14 frames in total (≈ 2 minutes at 2.2 s per frame). Usually 2–3 watch steps of 3–5 frames.
- **Text:** plain words, short lines; `**bold**` and `` `code` `` allowed. Each frame `note` ≤ ~110 characters and
  says what changes in that frame. `say` points at the line the frame explains.
- **The question:** 3–4 options; every wrong option has a `why` that teaches; `solved` is a one-line takeaway.
- **Facts only from the lesson/pattern.** Illustrative numbers the lesson does not give are marked "e.g.". No
  characters, avatars, emoji, jokes about people, or copyrighted characters. Do not invent complexities or claims.
- Every topic's Shorts are different stories — never one template filled in for each pattern.

## Done when
`node scripts/validate-content.mjs` prints `✔ content valid · … · N Shorts` with no error mentioning `shorts/`.
Report the Shorts written (id + title) and anything in the lesson that looked wrong or unclear.
