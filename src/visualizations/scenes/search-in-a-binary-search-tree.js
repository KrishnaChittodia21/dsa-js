// Scene: Search in a Binary Search Tree. Following signposts down a sorted tree: at every node the value tells
// which ONE side can still hold the target, so the walk is a single root-to-leaf path. Works with a walking
// pointer (node / cur / curr…) or recursion (the root parameter itself moving down the tree).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const trees = (vars) => Object.entries(vars || {}).filter(([k, v]) => !/\(whole\)/.test(k) && isTree(v));
// the value searched for: the val parameter, or the only number in scope when the learner renamed it
const valOf = (ctx) => (Number.isFinite(ctx.vars[ctx.params[1]]) ? ctx.vars[ctx.params[1]] : Object.values(ctx.vars).find(Number.isFinite));
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
/** [name, tree] for a walker that fell off the tree (was a node, now null) between `a` and `b` */
const fellOff = (a, b) => trees(a).find(([k]) => b?.[k] === null) || null;

export default {
  id: 'search-in-a-binary-search-tree',
  metaphor: 'Following signposts down a sorted tree',
  caption: 'Each node is a signpost: smaller values live to its left, bigger ones to its right. The search follows one path down and either lands on the value or walks off the tree.',
  narrate(ctx) {
    const v = valOf(ctx);
    if (!Number.isFinite(v)) return null;
    const mv = stepDown(ctx.prev, ctx.vars);
    if (mv) {
      const [, from, to, side] = mv;
      return `${v} ${side === 'left' ? '<' : '>'} ${from.$tree[0]}: it can only be on the ${side}, go to ${to.$tree[0]}`;
    }
    const off = fellOff(ctx.prev, ctx.vars);
    if (off) return `${v} ${v < off[1].$tree[0] ? '<' : '>'} ${off[1].$tree[0]}, but that side is empty: ${v} is not in the tree`;
    if (ctx.ret) {
      // recursion: a caller further up only passes its child's answer on
      if (ctx.value === null && Object.values(ctx.vars).includes(null)) return `the path ran out: return null, ${v} is not here`;
      const here = trees(ctx.vars);
      const passOn = here.length > 0 && !here.some(([, t]) => isTree(ctx.value) && t.$ids[0] === ctx.value.$ids[0]);
      if (passOn) return `signpost ${here[0][1].$tree[0]} passes the answer from below up unchanged`;
      if (isTree(ctx.value) && ctx.value.$tree[0] === v) return `found ${v}: hand back its whole subtree [${ctx.value.$tree.filter((x) => x !== null).join(', ')}]`;
      if (ctx.value === null) return `the path ran out: return null, ${v} is not here`;
      return null;
    }
    // the first look at the root
    const [k, t] = trees(ctx.vars).find(([name]) => !(name in ctx.prev)) || [];
    if (k && t.$ids[0] === 1) return `start at the root signpost ${t.$tree[0]}, looking for ${v}`;
    return null;
  },
  // at a node: left, right, or found?
  predict(ctx) {
    if (!ctx.next) return null;
    const v = valOf(ctx);
    if (!Number.isFinite(v)) return null;
    let at;
    let answer;
    const mv = stepDown(ctx.vars, ctx.next.vars);
    if (mv) {
      at = mv[1].$tree[0];
      answer = mv[3] === 'left' ? 0 : 1;
    } else if (ctx.next.ret && isTree(ctx.next.value)) {
      // returning the node on screen: the signpost reads the value itself
      const [, t] = trees(ctx.vars).find(([, x]) => x.$ids[0] === ctx.next.value.$ids[0]) || [];
      if (!t) return null;
      at = t.$tree[0];
      answer = 2;
    } else return null;
    // ask only once per node: right after the walker arrived there
    if (ctx.ret) return null;
    return {
      question: `Looking for ${v}, standing at signpost ${at}. What happens next?`,
      options: ['Go left', 'Go right', `Stop: ${at} is the node`],
      answer,
      explain: answer === 2 ? `${at} equals ${v}: the search stops and returns this node with everything below it.` : `${v} is ${answer === 0 ? 'smaller' : 'bigger'} than ${at}, so everything on the other side is too ${answer === 0 ? 'big' : 'small'}: only the ${answer === 0 ? 'left' : 'right'} side can hold it.`,
    };
  },
  bugs: [
    {
      label: 'Compare the wrong way',
      find: 'node = val < node.val ? node.left : node.right;',
      replace: 'node = val > node.val ? node.left : node.right;',
      explain: 'Smaller targets go right and bigger ones left, away from where they can be, so the walk falls off the tree and returns null.',
    },
    {
      label: 'Return the value, not the subtree',
      find: 'return node; // the matching subtree, or null',
      replace: 'return node ? node.val : null;',
      explain: 'The question wants the node with everything below it; returning just the number 2 is not the tree [2,1,3].',
    },
  ],
};
