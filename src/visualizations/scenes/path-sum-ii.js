// Scene: Path Sum II. A hiker walks every trail from the top to a leaf, writing each node's value in a notebook
// (the path). At a leaf the trail is copied into the answers only if it adds up to the target; on the way back
// the last value is erased (backtracking), so one notebook serves every trail.
import { row } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const isLeaf = (t) => isTree(t) && (t.$tree[1] ?? null) === null && (t.$tree[2] ?? null) === null;
const RESULT = /^(res|result|results|ans|answer|out|output|paths|all|allPaths|found)$/i;
/** [name, list of recorded trails]: an array of rows under a result-like name, or any non-empty one */
function trailsOf(vars, params) {
  const e = Object.entries(vars).filter(([k, v]) => !params.includes(k) && Array.isArray(v) && v.every((r) => row(r)));
  return e.find(([k]) => RESULT.test(k)) || e.find(([, v]) => v.length > 0) || null;
}
/** [name, values] of the notebook: a row of numbers that is not a parameter or the answer list */
function pathOf(vars, params, skip) {
  const e = Object.entries(vars).filter(([k, v]) => k !== skip && !params.includes(k) && row(v) && v.every((x) => typeof x === 'number'));
  return e.find(([k]) => /path|cur|trail|route|stack|stk|tmp|temp|list/i.test(k)) || (e.length === 1 ? e[0] : null);
}
/** [name, node] of the hiker's node: a non-whole tree variable, the root parameter only when nothing else */
function nodeOf(vars, params) {
  const e = Object.entries(vars).filter(([k, v]) => !k.endsWith('(whole)') && (isTree(v) || v === null) && k !== params[0]);
  return e[0] || (params[0] in vars ? [params[0], vars[params[0]]] : null);
}
const fmt = (a) => a.join(' → ');

export default {
  id: 'path-sum-ii',
  metaphor: 'A hiker logging every trail',
  caption: 'The notebook (path) holds the trail from the top to where the hiker stands. At a leaf the trail is copied into the answers if it adds up to the target; walking back erases the last value.',
  narrate(ctx) {
    const P = ctx.params;
    const res = trailsOf(ctx.vars, P);
    const was = res && ctx.prev[res[0]];
    if (res && Array.isArray(was) && res[1].length === was.length + 1) {
      const t = res[1][res[1].length - 1];
      return `leaf reached and the trail ${fmt(t)} adds up to ${t.reduce((a, b) => a + b, 0)}: copy it into the answers`;
    }
    const path = pathOf(ctx.vars, P, res?.[0]);
    const old = path && ctx.prev[path[0]];
    if (path && row(old)) {
      const now = path[1];
      if (now.length === old.length + 1) return `step onto ${now[now.length - 1]}: the trail is ${fmt(now)}`;
      if (now.length === old.length - 1) return `walk back from ${old[old.length - 1]}: erase it, the trail is ${now.length ? fmt(now) : 'empty again'}`;
    }
    // what is still needed (remaining -= val) or the running sum (sum += val)
    const k = (/(\w+)\s*(-=|\+=)/.exec(ctx.src || '') || [])[1];
    const target = ctx.vars[P[1]];
    if (k && Number.isFinite(ctx.vars[k]) && Number.isFinite(ctx.prev[k]) && ctx.vars[k] !== ctx.prev[k]) {
      const d = Math.abs(ctx.vars[k] - ctx.prev[k]);
      const undo = /-=/.test(ctx.src) && ctx.lines.some((l) => new RegExp(`\\b${k}\\s*\\+=`).test(l));
      if (undo) return `walking back takes ${d} off the sum: ${ctx.vars[k]} again`;
      return /-=/.test(ctx.src) ? `${d} is counted: ${ctx.vars[k]} still needed` : `${d} is counted: the trail adds up to ${ctx.vars[k]} so far${Number.isFinite(target) ? ` (target ${target})` : ''}`;
    }
    const nd = nodeOf(ctx.vars, P);
    if (ctx.ret && nd && nd[1] === null) return 'an empty spot: no trail goes this way';
    // back from a child call: prev is the child's last step
    if (nd && isTree(nd[1]) && !ctx.ret && nd[0] in ctx.prev) {
      const was = ctx.prev[nd[0]];
      const side = isTree(was) ? (was.$ids[0] === nd[1].$ids[1] ? 'left' : was.$ids[0] === nd[1].$ids[2] ? 'right' : null) : was === null ? '' : null;
      if (side !== null) return `back at ${nd[1].$tree[0]}${side ? ` from its ${side} side` : ''}: the trail is ${path ? fmt(path[1]) : 'as before'}`;
    }
    return null;
  },
  // standing on a leaf with the sum counted: is this trail an answer?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const P = ctx.params;
    const nd = nodeOf(ctx.vars, P);
    const res = trailsOf(ctx.vars, P);
    const resN = res && nx.vars[res[0]];
    const path = pathOf(ctx.vars, P, res?.[0]);
    const pathN = path && nx.vars[path[0]];
    if (!nd || !isLeaf(nd[1]) || !res || !path || !Array.isArray(resN) || !row(pathN)) return null;
    if (path[1][path[1].length - 1] !== nd[1].$tree[0]) return null; // the leaf is not written down yet
    if (res[1].some((t) => fmt(t) === fmt(path[1]))) return null; // this trail is already recorded
    let answer = null;
    if (resN.length === res[1].length + 1) answer = 0;
    else if (resN.length === res[1].length && pathN.length === path[1].length - 1) answer = 1;
    if (answer === null) return null;
    const sum = path[1].reduce((a, b) => a + b, 0);
    const target = ctx.vars[P[1]];
    return {
      question: `The hiker stands on leaf ${nd[1].$tree[0]} with the trail ${fmt(path[1])}. What happens next?`,
      options: ['Copy the trail into the answers', 'Erase the leaf and walk back'],
      answer,
      explain:
        answer === 0
          ? `${fmt(path[1])} adds up to ${sum}, exactly the target${Number.isFinite(target) ? ` ${target}` : ''}, and ${nd[1].$tree[0]} is a leaf: the trail is an answer.`
          : `${fmt(path[1])} adds up to ${sum}, not the target${Number.isFinite(target) ? ` ${target}` : ''}: nothing is recorded, and the hiker turns back.`,
    };
  },
  bugs: [
    {
      label: 'Record the notebook, not a copy',
      find: 'result.push([...path])',
      replace: 'result.push(path)',
      explain: 'Every answer is the same notebook, which keeps being erased and rewritten, so at the end all answers show its final (empty) state.',
    },
    {
      label: 'Return right after recording',
      find: 'if (remaining === 0) result.push([...path]);',
      replace: 'if (remaining === 0) { result.push([...path]); return; }',
      explain: 'The leaf is never erased from the notebook, so every later trail starts with stale values from the earlier one.',
    },
  ],
};
