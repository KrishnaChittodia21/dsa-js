# Brief: writing visualization scenarios

DSA Journey teaches DSA in JavaScript like a personal tutor. Visualizations are step-through animations
built from **frames**. You write pure generator functions — no React.

## Read first
1. `src/visualizations/scenarios/arrays.js`, `linear.js`, `trees.js`, `graphs.js`, `dp.js` — existing
   scenarios. Match their style exactly (notes explain WHY each step happens, in simple English).
2. `src/visualizations/panels.jsx` — how each panel kind renders (read the props it uses).
3. `src/visualizations/layout.js` — layout helpers for node-link diagrams (layoutLevelOrderTree,
   layoutHeap, layoutNary, layoutCircle).

## Scenario shape
```js
export const myScenario = {
  title: 'Short title',
  description: 'One sentence: what the animation shows.',
  defaultInput: { nums: [3, 1, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],   // types: numbers | number | string | strings | json | select (+ options)
  testInputs: [{ nums: [] }, { nums: [5] }, ...],            // 3–6 extra inputs incl. edge cases; validated, not shown
  generate(input) { return frames; },                        // must not mutate input; must handle edge cases and clamp sizes
};
```
A frame is `{ note: string, panels: Panel[], predict?: Predict }`.

### Panel kinds (only these exist)
| kind | fields |
|---|---|
| `array` | `values[]`, `label?`, `highlights?: {index: state}`, `range?: [l, r]` (window box), `pointers?: [{index, label, color: 'a'|'b'|'c'}]`, `showIndices?` |
| `stack` | `values[]` (bottom → top), `label?` |
| `queue` | `values[]` (front → back), `label?` |
| `vars` | `vars: { name: value }` |
| `list` | `values[]`, `next[]` (index or null), `pointers?`, `highlights?` |
| `nodes` | `nodes: [{id, label (string), x, y, state}]`, `edges: [{from, to, label?, state}]`, `directed`, `freeLayout?` (true for graphs laid out with layoutCircle), `label?` |
| `grid` | `cells[][]`, `states?[][]` (state names below or `wall`/`water`/`island-0..3`), `label?` |
| `table` | `cells[][]`, `states?[][]`, `rowLabels[]`, `colLabels[]`, `label?` |
| `intervals` | `items: [{start, end, state}]`, `min`, `max`, `label` |

Highlight/node/cell states: `active` (being processed now), `done` (finalised/answer), `visited`,
`bad` (invalid/rejected), `muted` (out of range / discarded), `hidden` (nodes only). Edge states: `done`, `muted`.

Look at the existing scenarios for how panels are combined (e.g. an array plus a stack plus vars).

### Predict questions (important — this is a tutoring app)
`frame.predict = { question, options: [2–4 strings], answer: index, explain? }` is asked **before**
the frame is revealed: "the learner sees frame N−1, predicts what happens next, then sees frame N".
Frame N's `note` must explain the answer. Add a predict to the **key decision points** of the
algorithm (e.g. "sum is too small — which pointer moves?", "which node is popped next?",
"does the window become invalid?") — roughly every 2nd–4th decision, at least 3 per default run,
never on frame 0. Options must be plausible; vary the answer index. Use a tiny helper in your file:
```js
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
```

### Quality bar
- Correct algorithm — the final frame shows the right answer for every input.
- 8–60 frames for the default input. Clamp large inputs (e.g. `slice(0, 12)`) and say so in `description`.
- Notes are short (1–2 sentences), plain English, explain *why*, mention complexity on the final frame.
- Must handle empty / single-element / duplicate inputs without throwing.
- Pure data only: frames must be JSON-serialisable (no class instances, no functions).

## Validate
`node scripts/validate-visuals.mjs src/visualizations/scenarios/<yourFile>.js` — must print ✔.
Also sanity-check correctness with a quick node script (scratch files must have **unique names** — other
agents share the scratchpad directory).

## Rules
- Only create the one file you are assigned. Do not edit index.js, panels, layout, content or anything else
  (the orchestrator registers your scenarios). If you need a layout helper, write it locally in your file.
- If a GateGuard hook asks for facts before Write/Bash, provide them, or create files via Bash heredoc
  (`cat > file <<'EOF'`, split very large files into several commands).
- Final report: the exported names + the scenario ids they should be registered as, frame/predict
  counts, and anything the orchestrator should know.
