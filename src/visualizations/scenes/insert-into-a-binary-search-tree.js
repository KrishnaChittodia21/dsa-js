// Scene: Insert into a Binary Search Tree. A marble rolling down a sorting tree: at each node it goes left when
// it is smaller and right otherwise, until it falls off into an empty spot, where the new node is attached.
// Works with an iterative walker (node/cur/curr/p…) or recursion (the root parameter moving down the tree).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const trees = (vars) => Object.entries(vars || {}).filter(([, v]) => isTree(v));
// the value being inserted: the val parameter, or the only number in scope when the learner renamed it
const valOf = (ctx) => (Number.isFinite(ctx.vars[ctx.params[1]]) ? ctx.vars[ctx.params[1]] : Object.values(ctx.vars).find(Number.isFinite));
/** 'left' / 'right' when `id` is the left / right child of the snapshot's top node */
const sideOf = (t, id) => (id === undefined || id === null ? null : t.$ids[1] === id ? 'left' : t.$ids[2] === id ? 'right' : null);
/** [name, from, to, side] for a tree variable that stepped down one level between `a` and `b` */
function stepDown(a, b) {
  for (const [k, t] of trees(b)) {
    const was = a?.[k];
    if (!isTree(was) || was.$ids[0] === t.$ids[0]) continue;
    const side = sideOf(was, t.$ids[0]);
    if (side) return [k, was, t, side];
  }
  return null;
}
/** [new id, its value, parent value, side] when a node was attached between `a` and `b` */
function attached(a, b) {
  let found = null;
  for (const [k, t] of trees(b)) {
    const was = a?.[k];
    if (!isTree(was) || was.$ids[0] !== t.$ids[0]) continue;
    const old = new Set(was.$ids);
    const i = t.$ids.findIndex((id) => id !== null && !old.has(id));
    if (i < 0) continue;
    const side = i === 1 ? 'left' : i === 2 ? 'right' : null;
    if (!found || side) found = { value: t.$tree[i], parent: side ? t.$tree[0] : null, side };
  }
  return found;
}

export default {
  id: 'insert-into-a-binary-search-tree',
  metaphor: 'A marble rolling down the sorting tree',
  caption: 'The new value rolls down from the root: smaller goes left, bigger goes right. Where the path falls off the tree, the new node is attached, so the order is kept without moving anything.',
  narrate(ctx) {
    const v = valOf(ctx);
    const add = attached(ctx.prev, ctx.vars);
    if (add) return add.parent !== null ? `${add.value} drops into the empty spot as ${add.parent}'s ${add.side} child` : `${add.value} joins the tree`;
    const mv = stepDown(ctx.prev, ctx.vars);
    if (mv && Number.isFinite(v)) {
      const [, from, to, side] = mv;
      return `${v} ${side === 'left' ? '<' : '>'} ${from.$tree[0]}: roll ${side} to ${to.$tree[0]}`;
    }
    // recursion: steps show the way back up, one frame at a time
    for (const [k, t] of trees(ctx.vars)) {
      const was = ctx.prev[k];
      if (was === null && Number.isFinite(v)) {
        const side = t.$tree[1] === v ? 'left' : t.$tree[2] === v ? 'right' : null;
        if (side) return `${v} drops into the empty spot as ${t.$tree[0]}'s ${side} child`;
      }
      const up = isTree(was) && sideOf(t, was.$ids[0]);
      if (up) return `back up at ${t.$tree[0]}: its ${up} link is set to the subtree that now holds the new node`;
    }
    if (ctx.vars[ctx.params[0]] === null && ctx.prev[ctx.params[0]] === null && /return/.test(ctx.src)) return `the tree is empty: ${v} becomes the root`;
    return null;
  },
  // at a node: left, right, or attach here?
  predict(ctx) {
    if (!ctx.next) return null;
    const v = valOf(ctx);
    const mv = stepDown(ctx.vars, ctx.next.vars);
    const add = attached(ctx.vars, ctx.next.vars);
    let at;
    let answer;
    if (mv) {
      at = mv[1].$tree[0];
      answer = mv[3] === 'left' ? 0 : 1;
    } else if (add?.side && add.parent !== null) {
      at = add.parent;
      answer = add.side === 'left' ? 2 : 3;
    } else return null;
    return {
      question: `The marble ${v} is at ${at}. What happens next?`,
      options: ['Roll left', 'Roll right', `Attach as ${at}'s left child`, `Attach as ${at}'s right child`],
      answer,
      explain:
        answer < 2
          ? `${v} is ${answer === 0 ? 'smaller' : 'bigger'} than ${at} and ${at} has a ${answer === 0 ? 'left' : 'right'} child, so the marble keeps rolling.`
          : `${v} is ${answer === 2 ? 'smaller' : 'bigger'} than ${at}, and that side is empty: the new node goes into that spot.`,
    };
  },
  bugs: [
    {
      label: 'Compare the wrong way',
      find: 'if (val < node.val)',
      replace: 'if (val > node.val)',
      explain: 'Bigger values roll left and smaller ones right, so the new node lands on the wrong side and the tree is no longer sorted.',
    },
    {
      label: 'Forget the empty tree',
      find: 'if (!root) return fresh;',
      replace: 'if (!root) return root;',
      explain: 'With no root there is nowhere to roll: the new node itself must be returned as the tree, otherwise the answer is still empty.',
    },
  ],
};
