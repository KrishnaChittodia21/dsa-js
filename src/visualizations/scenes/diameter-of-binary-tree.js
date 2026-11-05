// Scene: Diameter of Binary Tree. Two ropes hanging down from a bend: every node measures how far its left and right
// sides reach, the longest path that bends there uses both ropes (L + R edges), and only the longer rope is handed up
// to the parent (1 + max(L, R)), because a path cannot fork.
import { options } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;

/** the call's own node: a tree variable other than the input root (helpers), else the root parameter */
function nodeOf(ctx, vars = ctx.vars) {
  const own = Object.entries(vars).filter(([k, v]) => isTree(v) && !/\(whole\)/.test(k) && k !== ctx.params[0]);
  if (own.length === 1) return own[0];
  return isTree(vars[ctx.params[0]]) && !own.length ? [ctx.params[0], vars[ctx.params[0]]] : null;
}
/** names of the two reach variables, from lines like `const L = height(node.left)` */
function sidesOf(lines) {
  const out = {};
  for (const l of lines) {
    const m = l.match(/(?:const|let|var)?\s*(\w+)\s*=\s*[\w.]+\(\s*\w+\.(left|right)\s*\)/);
    if (m && !out[m[2]]) out[m[2]] = m[1];
  }
  return out.left && out.right ? out : null;
}
/** the best-so-far variable, from `best = Math.max(best, …)` */
function bestOf(lines) {
  for (const l of lines) {
    const m = l.match(/(\w+)\s*=\s*Math\.max\(\s*\1\s*,/);
    if (m) return m[1];
  }
  return null;
}

export default {
  id: 'diameter-of-binary-tree',
  metaphor: 'Two ropes tied at a bend',
  caption: 'Each node measures how far its left and right sides reach down. The longest path bending there uses both (L + R edges), but only the longer side, plus the node itself, is handed up: a path cannot fork.',
  narrate(ctx) {
    const s = sidesOf(ctx.lines);
    const b = bestOf(ctx.lines);
    const nd = nodeOf(ctx);
    const at = nd?.[1].$tree[0];
    const L = s && ctx.vars[s.left];
    const R = s && ctx.vars[s.right];
    if (b && Number.isInteger(ctx.vars[b]) && nd && Number.isInteger(L) && Number.isInteger(R) && new RegExp(`\\b${b}\\s*=`).test(ctx.src)) {
      const was = ctx.prev[b];
      if (ctx.vars[b] !== was && Number.isInteger(was)) return `bend at node ${at}: ${L} + ${R} = ${L + R} edge${L + R === 1 ? "" : "s"}, the longest path so far (${b} ${was} → ${ctx.vars[b]})`;
      return `bend at node ${at}: ${L} + ${R} = ${L + R} edge${L + R === 1 ? "" : "s"}, no longer than ${ctx.vars[b]}`;
    }
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `every bend was measured: the longest path has ${ctx.value} edge${ctx.value === 1 ? "" : "s"}`;
    if (ctx.ret && ctx.value === 0 && Object.entries(ctx.vars).some(([k, v]) => v === null && !/\(whole\)/.test(k))) return 'an empty spot: it reaches 0 nodes down';
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (!nd) return null;
      if (Number.isInteger(L) && Number.isInteger(R)) return `back at node ${at}: hand up a reach of ${ctx.value} (itself + its longer side, ${Math.max(L, R)})`;
      return null;
    }
    const was = nodeOf(ctx, ctx.prev);
    if (nd && was && was[1].$ids[0] !== nd[1].$ids[0] && !Number.isInteger(L)) return `go down to node ${at}${nd[1].$tree.length === 1 ? ', a leaf' : ''}`;
    if (s && nd) {
      for (const side of ['left', 'right']) {
        const k = s[side];
        if (Number.isInteger(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k] && new RegExp(`\\b${k}\\s*=`).test(ctx.src)) return `node ${at}'s ${side} side reaches ${ctx.vars[k]} node${ctx.vars[k] === 1 ? '' : 's'} down`;
      }
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const s = sidesOf(ctx.lines);
    const nd = nodeOf(ctx);
    if (!s || !nd) return null;
    const L = ctx.vars[s.left];
    const R = ctx.vars[s.right];
    if (!Number.isInteger(L) || !Number.isInteger(R) || L + R === 0) return null;
    const at = nd[1].$tree[0];
    const nx = ctx.next.vars;
    const nn = nodeOf(ctx, nx);
    if (!nn || nn[1].$ids[0] !== nd[1].$ids[0]) return null;
    // before the bend is measured: what is the best after this node?
    const b = bestOf(ctx.lines);
    if (b && Number.isInteger(ctx.vars[b]) && Number.isInteger(nx[b]) && new RegExp(`\\b${b}\\s*=`).test(ctx.lines[ctx.next.line - 1] || '') && !ctx.next.ret) {
      const right = nx[b];
      return options(
        `Node ${at}: the left side reaches ${L}, the right side ${R}, the best so far is ${ctx.vars[b]}. What is ${b} after this node?`,
        right,
        [L + R, L + R + 1, Math.max(L, R) + 1, ctx.vars[b]].filter((x) => x !== right),
        right === L + R && L + R > ctx.vars[b]
          ? `The path bending at ${at} goes ${L} edges down the left and ${R} down the right: ${L + R} edges, longer than ${ctx.vars[b]}.`
          : right === ctx.vars[b]
            ? `The bend at ${at} gives ${L + R} edges, which does not beat ${ctx.vars[b]}, so the best stays.`
            : `The code keeps ${right} as the best after node ${at}.`,
      );
    }
    // before the return: what reach goes up to the parent?
    if (ctx.next.ret && Number.isInteger(ctx.next.value)) {
      const right = ctx.next.value;
      return options(
        `Back at node ${at}: its left side reaches ${L}, its right side ${R}. What does it hand up to its parent?`,
        right,
        [1 + Math.max(L, R), L + R, L + R + 1, Math.max(L, R)].filter((x) => x !== right),
        right === 1 + Math.max(L, R)
          ? `The parent can only continue one side: node ${at} itself plus its longer side, 1 + max(${L}, ${R}) = ${right}.`
          : `The code hands up ${right}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Count nodes, not edges',
      find: 'best = Math.max(best, L + R);',
      replace: 'best = Math.max(best, L + R + 1);',
      explain: 'L + R + 1 counts the nodes on the path; the question asks for edges, so every answer is one too big.',
    },
    {
      label: 'Hand the bend up to the parent',
      find: 'return 1 + Math.max(L, R);',
      replace: 'return 1 + L + R;',
      explain: 'The parent gets both sides at once, as if a path could go down the left and the right and still continue upwards: the path forks and is overcounted.',
    },
  ],
};
