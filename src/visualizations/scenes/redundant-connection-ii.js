// Redundant Connection II (directed). A family tree got one extra arrow: either some node now has two parents, or
// the arrows run in a loop (or both). Pass 1 records each node's parent and catches the node with two (two
// suspects); pass 2 runs union-find without the later suspect: a loop left over means the earlier one must go.
// Reads a child → parent row (parentOf / parent / par…: no node is its own parent), the suspects (pair variables),
// and a union-find parent row (a toolkit UnionFind object, or a row where roots point at themselves).
import { groupsOf, leaderOf, row } from './util.js';

const ints = (v) => row(v) && v.length > 1 && v.every(Number.isInteger);
const ufLike = (v) => ints(v) && v.some((x, i) => i > 0 && x === i);
const pairRow = (e) => row(e) && e.length === 2 && e.every(Number.isInteger);
const EDGE = ['edge', 'e', 'ed', 'arrow', 'cur'];

/** the union-find parent row: a class instance's parent field, or a self-rooted row */
function ufOf(vars, skip) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (skip.includes(k)) continue;
    const o = v && v.$obj;
    if (o) for (const f of ['parent', 'parents', 'par', 'root', 'p', 'fa']) if (ufLike(o[f])) return o[f];
    if (/^(parent|parents|par|p|root|roots|fa|uf|dsu|ds|leader)$/i.test(k) && ufLike(v)) return v;
  }
  return null;
}
/** the child → parent row of pass 1: no node is its own parent */
function childParentOf(vars, skip) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!skip.includes(k) && /par|pa$|^from$|^dad|^mom/i.test(k) && ints(v) && !ufLike(v)) return v;
  }
  return null;
}
/** the arrow being looked at: [from, to] */
function arrowOf(vars) {
  for (const k of EDGE) if (pairRow(vars[k])) return vars[k];
  for (const [a, b] of [['u', 'v'], ['from', 'to'], ['par', 'child'], ['parent', 'child'], ['p', 'c'], ['s', 't'], ['x', 'y'], ['a', 'b']] /* a / b last: often roots */) {
    if (Number.isInteger(vars[a]) && Number.isInteger(vars[b])) return [vars[a], vars[b]];
  }
  return null;
}
/** the suspects: pair variables that are not the current arrow, ordered by their place in the input */
function suspectsOf(vars, edges) {
  const idx = (c) => (Array.isArray(edges) ? edges.findIndex((x) => pairRow(x) && x.join() === c.join()) : -1);
  return Object.entries(vars || {})
    .filter(([k, v]) => !EDGE.includes(k) && pairRow(v) && idx(v) >= 0)
    .map(([, v]) => v)
    .sort((a, b) => idx(a) - idx(b));
}
const same = (a, b) => !!a && !!b && a.join() === b.join();
const fmt = (c) => `${c[0]}→${c[1]}`;
const groups = (p) => groupsOf(p).filter((g) => !(g.length === 1 && g[0] === 0));

export default {
  id: 'redundant-connection-ii',
  metaphor: 'A family tree with one extra arrow',
  caption: 'Each arrow points from a parent to its child. The extra arrow either gives a child two parents (two suspects) or closes a loop. In the forest, each tree is a group of nodes already linked; an arrow inside one group closes the loop.',
  narrate(ctx) {
    const edges = ctx.vars[ctx.params[0]];
    const e = arrowOf(ctx.vars);
    const p = ufOf(ctx.vars, ctx.params);
    const pp = ufOf(ctx.prev, ctx.params);
    const sus = suspectsOf(ctx.vars, edges);
    if (ctx.ret && pairRow(ctx.value)) {
      const val = ctx.value;
      if (p && e && leaderOf(p, e[0]) === leaderOf(p, e[1])) {
        if (sus.length === 2 && same(val, sus[0])) return `${e[0]} and ${e[1]} are already in one group: a loop is left even without ${fmt(sus[1])}, so the earlier arrow ${fmt(val)} must go`;
        if (same(val, e)) return `${e[0]} and ${e[1]} are already in one group: arrow ${fmt(e)} closes a loop, so it is the extra one`;
      }
      if (sus.length === 2 && same(val, sus[1])) return `no loop once ${fmt(val)} is left out: node ${val[1]} keeps one parent, so ${fmt(val)} is the extra arrow`;
      return `the run returns arrow ${fmt(val)}`;
    }
    // pass 1: a suspect appears
    const before = suspectsOf(ctx.prev, ctx.prev[ctx.params[0]]);
    const fresh = sus.filter((c) => !before.some((b) => same(b, c)));
    if (fresh.length === 1 && e && fresh[0][1] === e[1]) {
      const c = fresh[0];
      if (same(c, e)) return `suspect two is the later arrow ${fmt(c)}: test the tree with it left out`;
      return `node ${e[1]} already has parent ${c[0]}, and ${fmt(e)} brings a second: suspect one is the earlier arrow ${fmt(c)}`;
    }
    // pass 1: a parent is recorded
    const cp = childParentOf(ctx.vars, ctx.params);
    const cpp = childParentOf(ctx.prev, ctx.params);
    if (cp && cpp && cp.length === cpp.length && e && cp[e[1]] === e[0] && cpp[e[1]] !== e[0]) return `arrow ${fmt(e)}: node ${e[1]}'s parent is ${e[0]}`;
    // pass 2: union-find
    if (p && (!pp || pp.length !== p.length)) return groupsOf(p).length === p.length ? `now look for a loop: every node starts as its own group${sus.length === 2 ? `, and ${fmt(sus[1])} will be left out` : ''}` : null;
    if (p && pp && e) {
      const now = groups(p).length;
      if (now < groups(pp).length) return `arrow ${fmt(e)} links two different groups (${now} group${now === 1 ? '' : 's'} left)`;
      if (sus.length === 2 && same(e, sus[1]) && /continue/.test(ctx.src) && !same(arrowOf(ctx.prev), e)) return `${fmt(e)} is the later suspect: leave it out and see whether a loop remains`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const edges = ctx.vars[ctx.params[0]];
    const e = arrowOf(ctx.vars);
    // the verdict: which arrow is returned?
    if (ctx.next.ret && pairRow(ctx.next.value) && Array.isArray(edges)) {
      const val = ctx.next.value;
      const pool = [...suspectsOf(ctx.vars, edges), e, edges.at(-1)].filter(pairRow).map(fmt);
      const right = fmt(val);
      const opts = [...new Set([right, ...pool])].slice(0, 4);
      if (opts.length < 2) return null;
      const sus = suspectsOf(ctx.vars, edges);
      const why = sus.length === 2 && same(val, sus[0]) ? `Even with ${fmt(sus[1])} left out, ${fmt(e)} found a loop: the loop runs through the earlier parent arrow ${right}, so that one must go.` : sus.length === 2 && same(val, sus[1]) ? `Leaving out the later arrow ${right} left no loop, so removing it makes a valid tree.` : `No node has two parents; ${right} is the arrow whose ends were already in one group: it closes the loop.`;
      opts.sort();
      return { question: 'Which arrow does the run return as the extra one?', options: opts, answer: opts.indexOf(right), explain: why };
    }
    // pass 1: does the next arrow give its child a second parent? (asked when it does)
    const ne = arrowOf(ctx.next.vars);
    if (!ne || same(ne, e)) return null;
    const now = suspectsOf(ctx.vars, edges);
    const later = suspectsOf(ctx.next.vars, edges).filter((c) => !now.some((b) => same(b, c)));
    if (now.length || later.length !== 1 || later[0][1] !== ne[1] || same(later[0], ne)) return null;
    return {
      question: `Next arrow: ${fmt(ne)}. Does node ${ne[1]} already have a parent?`,
      options: [`Yes: ${ne[1]} would get a second parent`, `No: ${ne[0]} becomes its parent`],
      answer: 0,
      explain: `An earlier arrow ${fmt(later[0])} already points into ${ne[1]}: both arrows are now suspects for the extra one.`,
    };
  },
  bugs: [
    {
      label: 'Always drop the later parent arrow',
      find: 'return cand1 ? cand1 : [u, v];',
      replace: 'return cand2 ? cand2 : [u, v];',
      explain: 'When the earlier parent arrow is the one on the loop, removing the later one leaves the loop in place: the wrong suspect is returned.',
    },
    {
      label: 'Skip the earlier suspect instead',
      find: 'u === cand2[0] && v === cand2[1]',
      replace: 'u === cand1[0] && v === cand1[1]',
      explain: 'Pass 2 must test the tree without the later arrow. Leaving out the earlier one tests the wrong tree, so the verdict about the loop is wrong.',
    },
  ],
};
