// Scene: Binary Tree Right Side View. Standing to the right of the tree, you see one node per floor: the last one
// in that floor's line (BFS), or the first one reached on that floor when the walk goes right before left (DFS).
// Works with a queue BFS (head index or shift) or a depth-first walk with a depth counter.

const NODE = ['node', 'n', 'cur', 'curr', 't', 'x', 'front'];
const SIZE = ['size', 'levelSize', 'len', 'n', 'count', 'cnt', 'width', 'sz', 'levelLen'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const isRow = (v) => Array.isArray(v) && v.every(Number.isFinite);
/** [name, value] of the node being looked at now (null in a DFS call on an empty child) */
function nodeOf(ctx, vars) {
  const name = NODE.find((k) => k in vars && (vars[k] === null || isTree(vars[k]))) ?? (isTree(vars[ctx.params[0]]) ? ctx.params[0] : undefined);
  return name ? [name, vars[name]] : null;
}
/** a node was just reached: BFS (a floor size in scope) = any new node; DFS = a step down to a child */
function arrived(ctx) {
  const at = nodeOf(ctx, ctx.vars);
  const was = nodeOf(ctx, ctx.prev);
  if (!at || !isTree(at[1]) || at[0] === ctx.params[0] || !was || !isTree(was[1])) return null;
  const id = at[1].$ids[0];
  if (sizeOf(ctx.vars)) return was[1].$ids[0] !== id ? at : null;
  return was[1].$ids[1] === id || was[1].$ids[2] === id ? at : null;
}
/** [name, row] of the view being written down (a row of numbers that is not a parameter) */
function viewOf(ctx, vars) {
  const hit = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && isRow(v) && /view|res|ans|out|seen|right|vis/i.test(k));
  return hit || null;
}
const lineOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|line|frontier|level|next|curr/i.test(k) && Array.isArray(v) && v.length && v.every(isTree));
const sizeOf = (vars) => SIZE.find((k) => Number.isInteger(vars[k]) && k !== 'n');
const ord = (i) => `${i + 1}${['st', 'nd', 'rd'][i] && (i < 3 || i > 19) ? ['st', 'nd', 'rd'][i % 10] || 'th' : 'th'}`;

export default {
  id: 'binary-tree-right-side-view',
  metaphor: 'Looking at the tree from its right side',
  caption: 'Stand to the right of the tree: on every floor only one node is visible, the rightmost one. The view lists them top to bottom; nodes hidden behind it on the same floor are walked past.',
  narrate(ctx) {
    if (ctx.ret && isRow(ctx.value) && !ctx.next) return `from the right you see [${ctx.value.join(', ')}], one node per floor, top to bottom`;
    const view = viewOf(ctx, ctx.vars);
    const before = view && ctx.prev[view[0]];
    if (view && isRow(before) && view[1].length === before.length + 1) {
      const v = view[1][view[1].length - 1];
      return `floor ${view[1].length}: ${v} is the one you see from the right`;
    }
    const line = lineOf(ctx.vars);
    const old = line && ctx.prev[line[0]];
    if (line && Array.isArray(old) && line[1].length === old.length + 1) return `child ${line[1][line[1].length - 1].$tree[0]} joins the line for the next floor`;
    const at = arrived(ctx);
    const s = sizeOf(ctx.vars);
    const i = ctx.vars.i;
    if (at) {
      if (s && Number.isInteger(i) && i < ctx.vars[s]) return `node ${at[1].$tree[0]} steps out of the line: ${ord(i)} of ${ctx.vars[s]} on this floor`;
      const d = ['depth', 'level', 'd', 'h', 'lvl'].find((k) => Number.isInteger(ctx.vars[k]));
      return `visit node ${at[1].$tree[0]}${d ? ` on floor ${ctx.vars[d] + 1}` : ''}`;
    }
    const here = nodeOf(ctx, ctx.vars);
    const was = nodeOf(ctx, ctx.prev);
    if (!s && here && isTree(here[1]) && here[0] !== ctx.params[0] && was && was[0] === here[0] && was[1] === null) return `back at node ${here[1].$tree[0]}: nothing more on that side`;
    if (s && ctx.vars[s] !== ctx.prev[s] && /=/.test(ctx.src)) return `a new floor: ${ctx.vars[s]} ${ctx.vars[s] === 1 ? 'node waits' : 'nodes wait'} in line`;
    return null;
  },
  // a node just stepped up: is it the one seen from the right?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const at = arrived(ctx);
    const view = viewOf(ctx, ctx.vars);
    if (!at || !view) return null;
    const s = sizeOf(ctx.vars);
    if (s && ctx.vars[s] < 2) return null;
    const after = nx.vars[view[0]];
    if (!isRow(after)) return null;
    const seen = after.length === view[1].length + 1;
    const v = at[1].$tree[0];
    const where = s && Number.isInteger(ctx.vars.i) ? ` (${ord(ctx.vars.i)} of ${ctx.vars[s]} on this floor)` : '';
    return {
      question: `Node ${v} is visited${where}. Is it the one you see from the right?`,
      options: [`Yes: ${v} is written into the view`, `No: something to its right hides it`],
      answer: seen ? 0 : 1,
      explain: seen
        ? `${v} is the rightmost node of its floor${s ? ': the last one in this round of the line' : ': the first node reached on a new floor when going right first'}.`
        : `Another node on the same floor sits further right${s ? ' (it comes later in this round of the line)' : ' (it was reached first)'}, so ${v} is hidden.`,
    };
  },
  bugs: [
    {
      label: 'Keep the first node of each floor',
      find: 'if (i === size - 1)',
      replace: 'if (i === 0)',
      explain: 'The first node in each floor’s line is the leftmost one, so this records the view from the left side instead.',
    },
    {
      label: 'Only follow right children',
      find: 'if (node.left) queue.push(node.left);',
      replace: '',
      explain: 'A node on the left can be visible when nothing sits to its right on that floor. Skipping left children loses those floors entirely.',
    },
  ],
};
