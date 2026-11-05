// "Animate my run" scene files (M4, W3.3). One optional file per question: src/visualizations/scenes/<question-id>.js.
// Without one, a run still animates with the generic renderers (runFrames.js); a scene adds the question's own story.
//
// Scene format (every field optional):
//   id           the question id (must match the file name)
//   metaphor     a short title for the picture, e.g. 'Guess the page in a sorted book'
//   caption      one or two sentences under the player: how to read the picture
//   bars         true = small non-negative arrays as value-tall bars
//   watch        ['nums', 'lo', …]: show only these variables (default: all)
//   labels       { nums: 'cards' }: shown names
//   pointers     names drawn as pointers on the main array (default: index-like names)
//   range        ['lo', 'hi'] or [['lo', 'hi'], ['left', 'right'], …]: a bracket over the main array
//   narrate(ctx) → string | null    the step note (null = the generic "Line N: … → changes")
//   predict(ctx) → { question, options, answer, explain } | null    asked before the NEXT step is shown
//   maxPredicts  default 3
//   compare      a variable name: "compare with reference" marks the first step where it differs
//   bugs         [{ label, find, replace, explain }]: "Break it" tries these before the generic bugs (runner/bugs.js)
//   interactions which kit buttons to show: 'edit', 'predict', 'inspect', 'compare', 'break', 'meter' (default: all)
//
// ctx = { vars, prev, line, src, lines, changes, index, next, params, op, ops } (op: the design-class operation
// running now, an index into ops = [{ name, args }]; undefined for function questions; result: what the learner's
// run returned in the end, as a snapshot (design classes: one value per operation)): vars / prev are this and the previous step's
// snapshots (recorder tags: $map $set $tree $list $obj), next is the next step ({ line, vars, ret }) or undefined (ret: true = that step
// is a `return`, recorded after its expression ran, with value = what it returns; ctx.ret / ctx.value are the same for the current step; ctx.input: the arguments as given, in
// parameter order, before the code changed any of them),
// params are the question's parameter names. Scenes must not assume the user's variable names beyond the
// parameters: check that a name exists before using it, and return null to fall back to the generic note.
// Helpers for scenes: ./util.js. Gold standard: sort-an-array.js, binary-search.js, find-if-path-exists-in-graph.js.

const files = import.meta.glob(['./*.js', '!./index.js', '!./util.js']);

/** the scene for a question, or null when it has none */
export async function loadScene(id) {
  const load = files[`./${id}.js`];
  return load ? (await load()).default : null;
}

export const ALL_INTERACTIONS = ['edit', 'predict', 'inspect', 'compare', 'break', 'meter'];
