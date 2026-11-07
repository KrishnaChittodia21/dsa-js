// Scene: Binary Search Tree Iterator. A pile of postponed visits: walking down the left edge, every node is put on
// the pile (it must wait for its smaller left side). next() takes the top, which is always the smallest value not
// handed out yet, and before leaving piles up the left edge of that node's right subtree.
// Reads the pile from `this` (any field holding a stack of nodes) and the walker from a node variable.
import { itemsOf, options } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** [field name, nodes bottom first] of the pile of waiting nodes in `this` */
function pileOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  for (const [k, v] of Object.entries(o)) {
    const it = itemsOf(v);
    if (it && (it.length ? it.every(isTree) : /st|stack|pile/i.test(k))) return [k, it];
  }
  return null;
}
const vals = (it) => it.map((t) => t.$tree[0]);
const show = (it) => (it.length ? `[${vals(it).join(', ')}]` : 'empty');
const opOf = (ctx, i = ctx.op) => ctx.ops?.[i];
const idOf = (v) => (isTree(v) ? v.$ids[0] : v);
/** [name, node] of a node variable in the current call: the one that moved since `prev`, else the first */
function walkerOf(vars, prev) {
  const ns = Object.entries(vars || {}).filter(([k, v]) => k !== 'this' && !/\(whole\)/.test(k) && (v === null || isTree(v)));
  return ns.find(([k, v]) => k in prev && idOf(prev[k]) !== idOf(v)) || ns[0];
}

export default {
  id: 'binary-search-tree-iterator',
  metaphor: 'A pile of postponed visits',
  caption: 'Going down the left edge, each node goes on the pile: it has to wait for the smaller nodes on its left. next() takes the top of the pile (the smallest value left), then piles up the left edge of its right subtree.',
  narrate(ctx) {
    const op = opOf(ctx);
    if (ctx.ret && op?.name === 'hasNext' && typeof ctx.value === 'boolean') {
      const p = pileOf(ctx.vars);
      return p ? `hasNext: the pile holds ${p[1].length ? p[1].length : 'nothing'}${p[1].length ? ` waiting (${show(p[1])})` : ''} → ${ctx.value}` : `hasNext → ${ctx.value}`;
    }
    if (ctx.ret && op?.name === 'next' && Number.isFinite(ctx.value)) return `hand out ${ctx.value}`;
    const p = pileOf(ctx.vars);
    const was = pileOf(ctx.prev);
    if (p && was && p[1].length === was[1].length - 1) {
      const top = was[1][was[1].length - 1];
      const r = top.$tree.length >= 3 && top.$tree[2] !== null && top.$tree[2] !== undefined;
      return `next(): take ${top.$tree[0]} off the top, the smallest value not handed out yet${r ? '; it has a right subtree to pile up' : ''}`;
    }
    if (p && was && p[1].length === was[1].length + 1) {
      const t = p[1][p[1].length - 1];
      const left = t.$tree.length >= 2 && t.$tree[1] !== null;
      return `${t.$tree[0]} waits on the pile ${show(p[1])}${left ? `: its smaller left side comes first, go left` : ': nothing smaller below it on the left'}`;
    }
    const w = walkerOf(ctx.vars, ctx.prev);
    const w0 = w && [w[0], ctx.prev[w[0]]];
    if (w && w0 && w[0] === w0[0] && w[1] === null && isTree(w0[1]) && p) {
      return p[1].length ? `no more left children: ${p[1][p[1].length - 1].$tree[0]} on top of the pile is the smallest waiting` : 'the left edge is empty: nothing to pile up';
    }
    if (w && w0 && w[0] === w0[0] && isTree(w[1]) && isTree(w0[1]) && w0[1].$ids[1] === w[1].$ids[0]) return `step down-left from ${w0[1].$tree[0]} to ${w[1].$tree[0]}`;
    // the popped node has no right subtree: the refill does nothing
    if (w && isTree(w[1]) && /\.right\b/.test(ctx.src) && w0 && isTree(w0[1]) && w0[1].$ids[0] === w[1].$ids[0] && op?.name === 'next') {
      const r = w[1].$tree[2];
      if (r === null || r === undefined) return `${w[1].$tree[0]} has no right subtree: nothing new goes on the pile`;
    }
    return null;
  },
  // just before a next() call: which value comes out?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || nx.op === ctx.op || opOf(ctx, nx.op)?.name !== 'next' || !Array.isArray(ctx.result)) return null;
    const out = ctx.result[nx.op];
    const p = pileOf(ctx.vars);
    if (!Number.isFinite(out) || !p || p[1].length < 2) return null;
    const v = vals(p[1]);
    return options(
      `next() is called. The pile holds ${show(p[1])} (top last). Which value comes out?`,
      out,
      [...v].reverse(),
      out === v[v.length - 1]
        ? `The top of the pile is the last node put on it, the deepest one down the left edge: nothing smaller is left, so ${out} is next.`
        : `This code hands out ${out}, but the top of the pile is ${v[v.length - 1]}, the smallest value left.`,
    );
  },
  bugs: [
    {
      label: 'Pile up only the right child, not its left edge',
      find: 'this.pushLeft(node.right);',
      replace: 'if (node.right) this.stack.push(node.right);',
      explain: 'After 5 the next value is the leftmost node of its right subtree (6), but only 10 goes on the pile, so 10 comes out before 6, 7 and 8.',
    },
    {
      label: 'Constructor piles up only the root',
      find: 'this.pushLeft(root);',
      replace: 'if (root) this.stack.push(root);',
      explain: 'The smallest value sits at the bottom of the left edge. With only the root on the pile, the first next() hands out the root instead.',
    },
  ],
};
