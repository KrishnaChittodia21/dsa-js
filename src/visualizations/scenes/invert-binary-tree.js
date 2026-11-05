// Scene: Invert Binary Tree. A mirror held up to every fork: each node's two children trade sides, and once every
// node has had its turn the whole tree reads right to left. Works with recursion (preorder or postorder swap) and
// with a BFS / stack loop: a node counts as flipped when its children are the input's, reversed.
import { itemsOf, options } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const size = (t) => t.$ids.filter((x) => x !== null && x !== undefined).length;

/** id → { val, l, r } from a level-order snapshot (ids in the same slots) */
function nodesOf(vals, ids) {
  const m = new Map();
  if (!Array.isArray(vals) || !vals.length || ids[0] === null || ids[0] === undefined) return m;
  m.set(ids[0], { val: vals[0], l: null, r: null });
  const q = [ids[0]];
  let k = 1;
  for (let h = 0; h < q.length && k < ids.length; h++) {
    const n = m.get(q[h]);
    for (const side of ['l', 'r']) {
      if (k >= ids.length) break;
      const id = ids[k];
      if (id !== null && id !== undefined) {
        n[side] = id;
        if (!m.has(id)) m.set(id, { val: vals[k], l: null, r: null });
        q.push(id);
      }
      k++;
    }
  }
  return m;
}
/** the input tree: the recorder numbers its nodes 1, 2, 3… in level order */
function inputNodes(ctx) {
  const a = Array.isArray(ctx.input) ? ctx.input[0] : null;
  if (!Array.isArray(a)) return null;
  let n = 0;
  return nodesOf(a, a.map((x) => (x === null ? null : ++n)));
}
/** the biggest tree on screen (the whole tree) as a node map */
function wholeOf(vars) {
  const ts = Object.values(vars || {}).filter(isTree);
  if (!ts.length) return null;
  const t = ts.reduce((a, b) => (size(b) > size(a) ? b : a));
  return nodesOf(t.$tree, t.$ids);
}
/** ids whose children are the input's children, reversed (nodes with two equal sides never count) */
function flipped(whole, orig) {
  const out = new Set();
  if (!whole || !orig) return out;
  for (const [id, n] of whole) {
    const o = orig.get(id);
    if (o && o.val === n.val && o.l !== o.r && n.l === o.r && n.r === o.l) out.add(id);
  }
  return out;
}
const valOf = (m, id) => (id === null ? '∅' : m.get(id)?.val);

export default {
  id: 'invert-binary-tree',
  metaphor: 'A mirror held up to every fork',
  caption: 'At each node the two children trade sides. One swap at the top is not enough: every node below must take its turn, and then the whole tree reads like its own reflection.',
  narrate(ctx) {
    const orig = inputNodes(ctx);
    const now = wholeOf(ctx.vars);
    if (now && orig) {
      const before = flipped(wholeOf(ctx.prev), orig);
      const fresh = [...flipped(now, orig)].filter((id) => !before.has(id));
      if (fresh.length === 1) {
        const n = now.get(fresh[0]);
        if (n.l === null || n.r === null) return `node ${n.val}: its only child ${valOf(now, n.l ?? n.r)} moves to the ${n.l === null ? 'right' : 'left'} side`;
        return `node ${n.val}: its children trade sides, ${valOf(now, n.l)} is now left and ${valOf(now, n.r)} right`;
      }
      if (fresh.length > 1) return `${fresh.length} nodes have their children swapped at once`;
      // a swap through a temp: the old right child is already on the left, the old left one is only saved
      for (const [id, n] of now) {
        const o = orig.get(id);
        if (o && o.l !== null && o.r !== null && n.l === o.r && n.r !== o.l) return `half-way through node ${n.val}'s swap: ${valOf(now, n.l)} is on the left, the saved ${valOf(orig, o.l)} goes right next`;
      }
    }
    if (ctx.ret && isTree(ctx.value)) {
      const n = size(ctx.value);
      const top = ctx.value.$tree[0];
      if (now && n === now.size) return `back at the top: all ${n} nodes are mirrored, the tree is handed back`;
      if (n === 1) return `leaf ${top}: two empty sides, nothing to flip; hand it back up`;
      return `back at node ${top}: its ${n}-node subtree is fully mirrored, hand it up`;
    }
    // a BFS line / DFS stack of nodes still waiting for their turn
    for (const [k, v] of Object.entries(ctx.vars)) {
      const a = itemsOf(v);
      const b = itemsOf(ctx.prev[k]);
      if (a && b && a.length === b.length + 1 && a.every(isTree) && b.every(isTree)) return `node ${a[a.length - 1].$tree[0]} waits its turn (${a.length} in ${k})`;
    }
    // the walker (the call's own root, or a loop's node) moving through the tree
    for (const [k, t] of Object.entries(ctx.vars)) {
      if (/\(whole\)/.test(k) || !(k in ctx.prev)) continue;
      const was = ctx.prev[k];
      if (t === null && isTree(was) && ctx.ret) return 'an empty spot: nothing to mirror here, go back up';
      if (!isTree(t)) continue;
      const leaf = size(t) === 1;
      if (isTree(was) && was.$ids[0] === t.$ids[0]) {
        if (leaf && /^\w+$/.test(k) && new RegExp(`\\b${k}\\.left\\b[^;]*\\b${k}\\.right\\b|\\b${k}\\.right\\b[^;]*\\b${k}\\.left\\b`).test(ctx.src) && !/\(\s*\w+\.(left|right)\s*\)/.test(ctx.src)) return `leaf ${t.$tree[0]}: both sides are empty, the swap changes nothing`;
        continue;
      }
      const call = ctx.src.match(/\(\s*\w+\.(left|right)\s*\)/);
      if (call) return isTree(was) ? `back at node ${t.$tree[0]}: the subtree on its ${call[1]} is done` : null;
      return `visit node ${t.$tree[0]}${leaf ? ': a leaf, nothing hangs below it' : ': its children are swapped next'}`;
    }
    return null;
  },
  // right after a node's swap (recursion): which node does the run step into next?
  predict(ctx) {
    if (!ctx.next) return null;
    const orig = inputNodes(ctx);
    const now = wholeOf(ctx.vars);
    if (!orig || !now) return null;
    const before = flipped(wholeOf(ctx.prev), orig);
    const fresh = [...flipped(now, orig)].filter((id) => !before.has(id));
    if (fresh.length !== 1) return null;
    const n = now.get(fresh[0]);
    if (n.l === null || n.r === null) return null;
    // the walker: a tree variable that moves to another node in the next step
    const k = Object.keys(ctx.next.vars).find((k) => !/\(whole\)/.test(k) && isTree(ctx.next.vars[k]) && isTree(ctx.vars[k]) && ctx.next.vars[k].$ids[0] !== ctx.vars[k].$ids[0]);
    if (!k) return null;
    const to = ctx.next.vars[k].$ids[0];
    if (to !== n.l && to !== n.r) return null;
    const L = valOf(now, n.l);
    const R = valOf(now, n.r);
    const card = options(`Node ${n.val} was just flipped: ${L} is on its left now, ${R} on its right. Which node is visited next?`, to === n.l ? L : R, [to === n.l ? R : L, n.val], '');
    if (!card) return null;
    card.explain =
      to === n.l
        ? `The code goes down the left side first, and after the swap the left child is ${L}, the one that used to be on the right.`
        : `The code goes down the right side first: after the swap that is ${R}, the child that used to be on the left.`;
    return card;
  },
  bugs: [
    {
      label: 'Swap without a temp',
      find: '[root.left, root.right] = [root.right, root.left];',
      replace: 'root.left = root.right; root.right = root.left;',
      explain: 'The first assignment overwrites the left child before it is saved, so both sides end up pointing at the old right subtree and the left one is lost.',
    },
    {
      label: 'Only the left side is mirrored',
      find: 'invertTree(root.right);',
      replace: '',
      explain: 'Every node swaps its own children, but the run never steps into the right child, so everything under it keeps its old order.',
    },
  ],
};
