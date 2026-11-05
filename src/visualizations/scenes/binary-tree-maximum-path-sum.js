// Scene: Binary Tree Maximum Path Sum. A mountain trail that may bend only once, at its highest node: coming back
// up, each node hears what its two branches are worth, scores the trail bending at itself (both arms), and offers
// its parent only one arm, because a trail cannot fork. Works with any names for the node, the arms and the best.

const NODE = ['node', 'n', 'cur', 'curr', 't', 'tree', 'subtree', 'x'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => k in vars && (vars[k] === null || isTree(vars[k])));
  return name ? [name, vars[name]] : null;
}
/** the running best: a number under a best-like name (found in the code's assignments when renamed) */
function bestOf(ctx, vars) {
  const name = ['best', 'max', 'maxSum', 'ans', 'answer', 'res', 'result', 'globalMax', 'maxPath'].find((k) => typeof vars[k] === 'number');
  return name ? [name, vars[name]] : null;
}
/** [left, right] arm gains in scope, by name, else the only two numbers that are neither the best nor parameters */
function armsOf(ctx, vars) {
  const b = bestOf(ctx, vars)?.[0];
  const nums = Object.entries(vars).filter(([k, v]) => typeof v === 'number' && Number.isFinite(v) && k !== b && !ctx.params.includes(k));
  const l = nums.find(([k]) => /^(l|lg|gl|left\w*)$/i.test(k));
  const r = nums.find(([k]) => /^(r|rg|gr|right\w*)$/i.test(k));
  if (l && r) return [l[1], r[1]];
  return nums.length === 2 ? [nums[0][1], nums[1][1]] : null;
}
const fmt = (x) => (x === -Infinity ? '-∞' : String(x));

export default {
  id: 'binary-tree-maximum-path-sum',
  metaphor: 'A mountain trail that bends only once',
  caption: 'Coming back up, each node hears what its two branches are worth (a branch worth less than 0 is dropped). The trail bending at the node uses both arms and may become the best; the parent is offered only one arm, since a trail cannot fork.',
  narrate(ctx) {
    const at = nodeOf(ctx, ctx.vars);
    const val = at && isTree(at[1]) ? at[1].$tree[0] : null;
    const best = bestOf(ctx, ctx.vars);
    if (ctx.ret) {
      const v = ctx.value;
      if (!ctx.next && typeof v === 'number') return `the best trail found anywhere in the tree is worth ${fmt(v)}`;
      if (at && at[1] === null && v === 0) return 'an empty branch is worth 0';
      if (val !== null && typeof v === 'number') return v === val ? `node ${val} offers its parent just itself: ${v}` : `node ${val} offers its parent one arm only: ${val} + ${v - val} = ${v}`;
      return null;
    }
    const wasBest = bestOf(ctx, ctx.prev);
    if (best && wasBest && wasBest[0] === best[0] && val !== null && /=/.test(ctx.src) && new RegExp(`\\b${best[0]}\\s*=`).test(ctx.src)) {
      const arms = armsOf(ctx, ctx.vars);
      const sum = arms ? `${val} + ${arms[0]} + ${arms[1]} = ${val + arms[0] + arms[1]}` : 'its trail';
      if (best[1] !== wasBest[1]) return `the trail bending at ${val} is worth ${sum}: the best so far (was ${fmt(wasBest[1])})`;
      return `the trail bending at ${val} is worth ${sum}: not better than ${fmt(best[1])}`;
    }
    // an arm's worth just came back: const L = Math.max(0, gain(node.left))
    const m = ctx.src.match(/(?:const|let|var)?\s*(\w+)\s*=.*\.(left|right)\b/);
    if (m && val !== null && typeof ctx.vars[m[1]] === 'number') {
      const g = ctx.vars[m[1]];
      if (g === 0 && nodeOf(ctx, ctx.prev)?.[1] === null) return `${val} has no ${m[2]} branch: it adds 0`;
      return g === 0 && /max\(/.test(ctx.src) ? `${val}'s ${m[2]} branch is worth nothing (or less): leave it out, 0` : `${val}'s ${m[2]} branch is worth ${g}`;
    }
    const was = nodeOf(ctx, ctx.prev);
    // back in the outer function (its root parameter again) is not a step down
    const backOut = was && was[0] !== at?.[0] && at?.[0] === ctx.params[0];
    if (val !== null && !backOut && Object.keys(ctx.prev).length && (!was || was[0] !== at[0] || !isTree(was[1]) || was[1].$ids[0] !== at[1].$ids[0])) return `down to node ${val}: first hear what its branches are worth`;
    return null;
  },
  // both arms known: the trail bending here, and what goes up to the parent
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const at = nodeOf(ctx, ctx.vars);
    const after = nodeOf(ctx, nx.vars);
    if (!at || !after || !isTree(at[1]) || !isTree(after[1]) || at[1].$ids[0] !== after[1].$ids[0]) return null;
    const arms = armsOf(ctx, ctx.vars);
    if (!arms || (arms[0] === 0 && arms[1] === 0)) return null;
    const val = at[1].$tree[0];
    const [a, b] = arms;
    const card = (question, right, wrong, explain) => {
      const opts = [...new Set([right, ...wrong.filter((x) => x !== right)])].slice(0, 4).sort((x, y) => x - y);
      return opts.length < 2 ? null : { question, options: opts.map(String), answer: opts.indexOf(right), explain };
    };
    const best = bestOf(ctx, ctx.vars);
    const nb = best && nx.vars[best[0]];
    if (!ctx.ret && best && typeof nb === 'number' && new RegExp(`\\b${best[0]}\\s*=`).test(ctx.lines[nx.line - 1] || '')) {
      return card(
        `At node ${val} the arms are worth ${a} and ${b}; the best so far is ${fmt(best[1])}. What is the best after this node?`,
        nb,
        [val + a + b, val + Math.max(a, b), best[1], val].filter(Number.isFinite),
        `The trail bending at ${val} uses both arms: ${val} + ${a} + ${b} = ${val + a + b}. The best keeps the larger of that and ${fmt(best[1])}: ${nb}.`,
      );
    }
    if (nx.ret && typeof nx.value === 'number') {
      return card(
        `Node ${val} (arms ${a} and ${b}) now answers its parent. What does it offer?`,
        nx.value,
        [val + a + b, val + Math.max(a, b), val + Math.min(a, b), val],
        `A trail cannot fork, so the parent may only continue through one arm: ${val} + the better arm ${Math.max(a, b)} = ${val + Math.max(a, b)}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Start the best at 0',
      find: 'let best = -Infinity;',
      replace: 'let best = 0;',
      explain: 'A trail needs at least one node. When every value is negative, no trail ever beats 0, so 0 is returned instead of the largest single value.',
    },
    {
      label: 'Offer both arms to the parent',
      find: 'return node.val + Math.max(L, R);',
      replace: 'return node.val + L + R;',
      explain: 'The parent extends the trail through this node, so only one arm can come along. Offering both lets the trail fork and the sum comes out too big.',
    },
  ],
};
