// Scene: Maximum Depth of Binary Tree. Each node asks its two children "how tall are you?", takes the taller
// answer and adds itself. Recursion records most steps on the way back up, so the notes are the answers.
// Works with the recursive form (any parameter name) and narrates a BFS floor counter when the learner loops.
import { options } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** [name, node snapshot or null] of the current node: the parameter, else the first non-whole tree variable */
function nodeOf(vars, params) {
  const p = params[0];
  if (p in vars && (vars[p] === null || isTree(vars[p]))) return [p, vars[p]];
  const hit = Object.entries(vars).find(([k, v]) => !k.endsWith('(whole)') && isTree(v));
  return hit || [null, undefined];
}
const val = (t) => t.$tree[0];
/** true when some function in the code calls itself (the "ask the children" form) */
function recursive(lines) {
  const code = (lines || []).join('\n');
  const names = [...code.matchAll(/function\s+(\w+)|(\w+)\s*=\s*(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/g)].map((m) => m[1] || m[2]);
  return names.some((n) => (code.match(new RegExp(`\\b${n}\\s*\\(`, 'g')) || []).length >= 2);
}

export default {
  id: 'maximum-depth-of-binary-tree',
  metaphor: 'Each node asks its children how tall',
  caption: 'Every node waits for both children to report their height, keeps the taller answer and adds 1 for itself. An empty spot reports 0, so leaves report 1.',
  narrate(ctx) {
    const [, node] = nodeOf(ctx.vars, ctx.params);
    if (ctx.ret && Number.isInteger(ctx.value) && !recursive(ctx.lines)) return `${ctx.value} floors counted: the tree is ${ctx.value} deep`;
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (node === null) return ctx.index === 0 ? 'the tree is empty: its height is 0' : 'an empty spot below: it reports height 0';
      if (isTree(node)) {
        const kids = [node.$tree[1], node.$tree[2]].filter((x) => x !== null && x !== undefined);
        if (!kids.length) return `back at leaf ${val(node)}: no children, so its height is ${ctx.value}`;
        return `back at node ${val(node)}: the taller child reported ${ctx.value - 1}, plus 1 for itself = ${ctx.value}`;
      }
      return `the tree is ${ctx.value} levels deep`;
    }
    // a child's answer just arrived in the local assigned on this line (left / right / l / r …)
    if (isTree(node) && recursive(ctx.lines)) {
      const k = (/\b(\w+)\s*=[^=]/.exec(ctx.src || '') || [])[1];
      const h = k && !ctx.params.includes(k) ? ctx.vars[k] : undefined;
      if (Number.isInteger(h) && /maxDepth|depth|height|\(/i.test(ctx.src.split('=').slice(1).join('='))) {
        const side = /^(l|left)/i.test(k) ? 'left' : /^(r|right)/i.test(k) ? 'right' : null;
        return `node ${val(node)} hears from its ${side ? `${side} side` : 'child'}: height ${h}`;
      }
      const was = ctx.prev[ctx.params[0]];
      if (!isTree(was) || was.$ids[0] !== node.$ids[0]) return `down to node ${val(node)}: first ask its children how tall they are`;
    }
    // loop form: a floor counter went up
    const d = (/(\w+)\s*(?:\+\+|\+=\s*1\b)/.exec(ctx.src || '') || [])[1];
    if (d && Number.isInteger(ctx.vars[d]) && ctx.vars[d] === ctx.prev[d] + 1) return `one more floor finished: ${ctx.vars[d]} so far`;
    return null;
  },
  // right before a node with children reports its own height
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !nx.ret || !Number.isInteger(nx.value) || nx.value < 2 || !recursive(ctx.lines)) return null;
    const [name, node] = nodeOf(nx.vars, ctx.params);
    if (!name || !isTree(node) || !isTree(ctx.vars[name]) || ctx.vars[name].$ids[0] !== node.$ids[0]) return null;
    const right = nx.value;
    const card = options(`Node ${val(node)} has heard back from both children. What height does it report?`, right, [right - 1, right + 1, right * 2].filter((x) => x >= 0), `Its taller child reported ${right - 1}; node ${val(node)} adds 1 for itself, so it reports ${right}.`);
    return card;
  },
  bugs: [
    {
      label: 'Empty spot reports 1',
      find: 'if (root === null) return 0;',
      replace: 'if (root === null) return 1;',
      explain: 'Missing children count as a level, so every leaf reports 2 instead of 1 and the whole answer is one too big.',
    },
    {
      label: 'Keep the shorter child',
      find: 'Math.max(left, right)',
      replace: 'Math.min(left, right)',
      explain: 'Each node trusts its shorter side, so the answer is the depth of the closest leaf, not the deepest one.',
    },
  ],
};
