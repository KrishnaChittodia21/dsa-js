// House Robber III: tree DP. Each house hands two hauls up to its parent: the best of its subtree if it is robbed
// (its value + both children skipped) and if it is skipped (each child gives its better haul). Narrated on the way
// back up; every haul is checked against the subtree itself, so pairs in either order ([rob, skip] / [skip, rob]) work.
import { options } from './util.js';

const NODE = ['node', 'n', 'cur', 'curr', 'house', 'nd', 't', 'root', 'r'];
const ROBRE = /rob|take|with|inc|yes|pick/i;

/** the current node: a $tree (or null) under a node-like name; `<name> (whole)` is the input, not the node */
function nodeOf(vars) {
  const keys = Object.keys(vars || {}).filter((k) => !k.includes(' (whole)') && (vars[k] === null || vars[k]?.$tree));
  const k = NODE.find((x) => keys.includes(x)) ?? keys[0];
  return k === undefined ? undefined : { name: k, tree: vars[k] };
}

/** a level-order list (LeetCode style) as nested { val, left, right } */
function build(list) {
  if (!Array.isArray(list) || !list.length || list[0] === null) return null;
  const root = { val: list[0], left: null, right: null };
  const q = [root];
  let k = 1;
  for (let h = 0; h < q.length && k < list.length; h++) {
    for (const side of ['left', 'right']) {
      if (k >= list.length) break;
      const v = list[k++];
      if (v !== null && v !== undefined) q.push((q[h][side] = { val: v, left: null, right: null }));
    }
  }
  return root;
}

/** [rob, skip] of a subtree */
function pair(t) {
  if (!t) return [0, 0];
  const l = pair(t.left);
  const r = pair(t.right);
  return [t.val + l[1] + r[1], Math.max(...l) + Math.max(...r)];
}

const here = (vars) => {
  const nd = nodeOf(vars);
  const t = nd?.tree?.$tree ? build(nd.tree.$tree) : null;
  return t && typeof t.val === 'number' ? t : null;
};
const newInt = (now, before) => Object.keys(now).filter((k) => Number.isInteger(now[k]) && !(k in before));
const hasVal = (src) => /\.val\b/.test(src || '');
const hasMax = (src) => /max|\?|>/.test(src || '');

export default {
  id: 'house-robber-iii',
  metaphor: 'A burglar in a tree of linked houses',
  caption: 'A house shares an alarm with its parent and its children. Each house reports two hauls up the tree: robbed (its value + both children skipped) and skipped (each child gives its better haul). The root picks the bigger one.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the biggest haul without robbing two linked houses: ${ctx.value}`;
    const t = here(ctx.vars);
    if (!t) return null;
    const [rob, skip] = pair(t);
    if (ctx.ret && Array.isArray(ctx.value) && ctx.value.length === 2) {
      const [a, b] = ctx.value;
      if (a === rob && b === skip) return `back up from house ${t.val}: robbed → ${rob}, skipped → ${skip}`;
      if (a === skip && b === rob) return `back up from house ${t.val}: skipped → ${skip}, robbed → ${rob}`;
      return null;
    }
    if (ctx.ret && Number.isInteger(ctx.value) && ctx.value === Math.max(rob, skip)) return `best haul in house ${t.val}'s part of the tree: ${ctx.value}`;
    // a child's report arrives
    const side = /\.left\b/.test(ctx.src || '') ? 'left' : /\.right\b/.test(ctx.src || '') ? 'right' : null;
    const kid = side && t[side];
    // the names this line writes (`const [lr, ls] = dfs(node.left)` or `const L = dfs(node.left)`)
    const got = ((/^\s*(?:const|let|var)?\s*(\[[^\]]*\]|[A-Za-z_$][\w$]*)\s*=(?!=)/.exec(ctx.src || '') || [])[1] || '').match(/[A-Za-z_$][\w$]*/g)?.filter((k) => k in ctx.vars) || [];
    if (side && !ctx.ret && got.length) {
      if (!kid) return `no ${side} child: it reports [0, 0]`;
      const [kr, ks] = pair(kid);
      const nums = got.map((k) => ctx.vars[k]).flat();
      if (nums.includes(kr) && nums.includes(ks)) return `the ${side} child (house ${kid.val}) reports: robbed ${kr}, skipped ${ks}`;
      return null;
    }
    // the two hauls of this house
    const nk = newInt(ctx.vars, ctx.prev);
    if (nk.length === 1) {
      const v = ctx.vars[nk[0]];
      if (v === rob && hasVal(ctx.src)) return `rob house ${t.val}: ${t.val} + its children skipped (${rob - t.val}) = ${rob}`;
      if (v === skip && hasMax(ctx.src) && !hasVal(ctx.src)) return `skip house ${t.val}: each child gives its better haul → ${skip}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const t = here(ctx.vars);
    if (!t || here(ctx.next.vars)?.val !== t.val) return null;
    const nsrc = ctx.lines?.[ctx.next.line - 1];
    const nk = newInt(ctx.next.vars, ctx.vars);
    if (nk.length !== 1) return null;
    const v = ctx.next.vars[nk[0]];
    const L = pair(t.left);
    const R = pair(t.right);
    const kids = `The left child reports robbed ${L[0]} / skipped ${L[1]}, the right robbed ${R[0]} / skipped ${R[1]}.`;
    // only on a run that matches the rule: the card describes the children's true reports
    const [rob, skip] = pair(t);
    if (hasVal(nsrc) && !hasMax(nsrc) && v === rob) {
      const wrong = [t.val + L[0] + R[0], t.val + Math.max(...L) + Math.max(...R), t.val].filter((w) => w !== v);
      if (wrong.length < 2) return null;
      return options(`Rob house ${t.val}. ${kids} How much is the haul?`, v, wrong, `Robbing house ${t.val} sets off its children's alarms, so both must be skipped: ${t.val} + ${L[1]} + ${R[1]}.`);
    }
    if (hasMax(nsrc) && !hasVal(nsrc) && v === skip) {
      const wrong = [L[0] + R[0], L[1] + R[1], t.val + L[1] + R[1]].filter((w) => w !== v);
      if (wrong.length < 2) return null;
      return options(`Skip house ${t.val}. ${kids} How much is the haul?`, v, wrong, `With house ${t.val} skipped, each child is free: take its better haul, ${Math.max(...L)} + ${Math.max(...R)}.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Rob a house and its children',
      find: 'node.val + leftSkip + rightSkip',
      replace: 'node.val + leftRob + rightRob',
      explain: 'Robbing a house means its children must be skipped; adding their robbed hauls robs two linked houses: [2, 7] gives 9.',
    },
    {
      label: 'Skipping a house forces robbing its children',
      find: 'Math.max(leftRob, leftSkip) + Math.max(rightRob, rightSkip)',
      replace: 'leftRob + rightRob',
      explain: 'That robs alternate levels only; in the chain 4-1-2-3 the best skips two houses in a row (4 + 3 = 7).',
    },
  ],
};

