// Scene: Balanced Binary Tree. A hanging mobile checked hook by hook from the bottom up: each node weighs the
// height of its two sides, and if they differ by more than 1 it tips (-1 is passed all the way up).
// Works with the -1 sentinel recursion under any names (node / root / t…, L / R, a / b…).

const NODE = ['node', 'n', 'cur', 'curr', 't', 'tree', 'subtree', 'x'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** [name, value] of the node this call is at (a tree snapshot or null) */
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => k in vars && (vars[k] === null || isTree(vars[k])));
  return name ? [name, vars[name]] : null;
}
/** the two side heights in scope: [left, right] by name, else the only two integers that are not parameters */
function sidesOf(ctx, vars) {
  const ints = Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !ctx.params.includes(k) && !/^(i|j|k|depth|level|d)$/.test(k));
  const l = ints.find(([k]) => /^(l|lh|hl|left\w*|l\w*h\w*)$/i.test(k));
  const r = ints.find(([k]) => /^(r|rh|hr|right\w*|r\w*h\w*)$/i.test(k));
  if (l && r) return [l[1], r[1]];
  return ints.length === 2 ? [ints[0][1], ints[1][1]] : null;
}
const tall = (h) => (h === 0 ? 'empty (height 0)' : `${h} tall`);

export default {
  id: 'balanced-binary-tree',
  metaphor: 'A hanging mobile, checked hook by hook',
  caption: 'Each node is a hook with two arms. Coming back up from the bottom, a hook compares the height of its two sides: within 1 it hangs level and reports its own height, otherwise it tips and -1 is passed up.',
  narrate(ctx) {
    const at = nodeOf(ctx, ctx.vars);
    const val = at && isTree(at[1]) ? at[1].$tree[0] : null;
    if (ctx.ret) {
      const v = ctx.value;
      if (typeof v === 'boolean' && !ctx.next) return v ? 'every hook hangs level: the tree is balanced' : 'somewhere a hook tipped: the tree is not balanced';
      if (at && at[1] === null && v === 0) return 'an empty arm: height 0';
      if (val === null || !Number.isInteger(v)) return null;
      const s = sidesOf(ctx, ctx.vars);
      if (v === -1) {
        if (s && Math.abs(s[0] - s[1]) > 1) return `hook ${val}: one side ${tall(s[0])}, the other ${tall(s[1])}, off by ${Math.abs(s[0] - s[1])}: it tips, report -1`;
        return `a hook below ${val} already tipped: pass -1 straight up without measuring more`;
      }
      if (s) return `back at hook ${val}: sides ${s[0]} and ${s[1]} are within 1, it hangs level; its height is ${v}`;
      return `back at hook ${val}: it hangs level, its height is ${v}`;
    }
    // a side's height just came back: const L = check(node.left)
    const m = ctx.src.match(/(?:const|let|var)?\s*(\w+)\s*=\s*\w+\(\s*\w+\.(left|right)\b/);
    if (m && val !== null && Number.isInteger(ctx.vars[m[1]])) {
      const h = ctx.vars[m[1]];
      return h === -1 ? `hook ${val}'s ${m[2]} side came back -1: something below it tipped` : `hook ${val}'s ${m[2]} side is ${tall(h)}`;
    }
    const was = nodeOf(ctx, ctx.prev);
    // back in the outer function (its root parameter again) is not a step down
    const backOut = was && was[0] !== at?.[0] && at?.[0] === ctx.params[0];
    if (val !== null && !backOut && Object.keys(ctx.prev).length && (!was || was[0] !== at[0] || !isTree(was[1]) || was[1].$ids[0] !== at[1].$ids[0])) return `down to hook ${val}: measure both of its sides first`;
    return null;
  },
  // both sides measured: what does the hook report up?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx?.ret || !Number.isInteger(nx.value)) return null;
    const at = nodeOf(ctx, ctx.vars);
    const after = nodeOf(ctx, nx.vars);
    if (!at || !after || !isTree(at[1]) || !isTree(after[1]) || at[1].$ids[0] !== after[1].$ids[0]) return null;
    const s = sidesOf(ctx, ctx.vars);
    if (!s || s.some((h) => h < 0) || (s[0] === 0 && s[1] === 0)) return null;
    const [a, b] = s;
    const fmt = (v) => (v === -1 ? '-1: it tips' : `height ${v}`);
    const right = nx.value;
    const cands = [1 + Math.max(a, b), 1 + Math.min(a, b), Math.max(a, b), -1, a + b + 1].filter((x) => x !== right);
    const opts = [...new Set([fmt(right), ...cands.map(fmt)])].slice(0, 4).sort();
    return {
      question: `Hook ${at[1].$tree[0]}: one side is ${tall(a)}, the other ${tall(b)}. What does it report to its parent?`,
      options: opts,
      answer: opts.indexOf(fmt(right)),
      explain:
        right === -1
          ? `${a} and ${b} differ by ${Math.abs(a - b)}, more than 1: the hook tips and reports -1.`
          : `${a} and ${b} differ by at most 1, so it hangs level; its height is 1 (itself) + the taller side ${Math.max(a, b)} = ${right}.`,
    };
  },
  bugs: [
    {
      label: 'A difference of 1 counts as tipping',
      find: 'Math.abs(L - R) > 1',
      replace: 'Math.abs(L - R) >= 1',
      explain: 'Sides of height 1 and 0 are allowed to differ by one; with >= a simple two-node tree is wrongly called unbalanced.',
    },
    {
      label: 'Height from the shorter side',
      find: 'return 1 + Math.max(L, R);',
      replace: 'return 1 + Math.min(L, R);',
      explain: 'A hook is as tall as its taller side. Using the shorter one under-reports heights, so a lopsided tree further up looks level.',
    },
  ],
};
