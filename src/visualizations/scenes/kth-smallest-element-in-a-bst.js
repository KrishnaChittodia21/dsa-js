// Scene: Kth Smallest Element in a BST. Reading the tree's values in sorted order, counting off as we go: walk
// left as far as possible (the stack remembers the way back), take the top of the stack (the next smallest),
// count it, then go to its right side. Stop at the k-th value. Works with the stack walk under any names, and
// narrates a recursive in-order with a counter or a collected array.
import { itemsOf } from './util.js';

const NODE = ['node', 'cur', 'curr', 'current', 'n', 'p', 't', 'x'];
const STACK = ['stack', 'stk', 'st', 's', 'path'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const ord = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
/** [name, value] of the walker: a node variable (tree or null), or the root parameter when the learner moves it */
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => k in vars && (vars[k] === null || isTree(vars[k])));
  return name ? [name, vars[name]] : null;
}
/** [name, items] of the stack of nodes */
function stackOf(vars) {
  for (const k of [...STACK, ...Object.keys(vars)]) {
    const items = itemsOf(vars[k]);
    if (items && (STACK.includes(k) ? items.every(isTree) : items.length > 0 && items.every(isTree))) return [k, items];
  }
  return null;
}
/** [name, now] of a counter (not a parameter) that went up by 1 from `prev` to `vars` */
function countUp(ctx, vars = ctx.vars, prev = ctx.prev) {
  for (const [k, v] of Object.entries(vars)) {
    if (ctx.params.includes(k) || !Number.isInteger(v) || !/^(cnt|count|counter|seen|visited|num|n|i|c|idx|rank)$/i.test(k)) continue;
    if (prev[k] === v - 1) return [k, v];
  }
  return null;
}
/** the node just taken off the stack (value), or null */
function popped(ctx, vars, prev) {
  const s = stackOf(vars);
  const was = s && itemsOf(prev[s[0]]);
  const at = nodeOf(ctx, vars);
  if (!s || !was || s[1].length !== was.length - 1 || !at || !isTree(at[1])) return null;
  const top = was[was.length - 1];
  return isTree(top) && top.$ids[0] === at[1].$ids[0] ? at[1].$tree[0] : null;
}

export default {
  id: 'kth-smallest-element-in-a-bst',
  metaphor: 'Counting off the values in sorted order',
  caption: 'In a BST the smallest value is as far left as you can go. The stack holds the nodes passed on the way down; the top of the stack is always the next smallest value. Count them off until the k-th.',
  narrate(ctx) {
    const K = ctx.input?.[1];
    if (ctx.ret && Number.isFinite(ctx.value) && !ctx.next) return Number.isInteger(K) ? `${ctx.value} is the ${ord(K)} smallest value: done, the rest of the tree is never visited` : `the answer is ${ctx.value}`;
    const kName = ctx.params[1];
    const k = ctx.vars[kName];
    const at = nodeOf(ctx, ctx.vars);
    const val = at && isTree(at[1]) ? at[1].$tree[0] : null;
    // the k parameter counting down
    if (Number.isInteger(k) && Number.isInteger(ctx.prev[kName]) && k === ctx.prev[kName] - 1 && val !== null) {
      return k === 0 ? `count ${val}: that is the ${ord(K)}, the one we want` : `count ${val} (the ${ord(K - k)} smallest): ${k} more to go`;
    }
    const c = countUp(ctx);
    if (c && val !== null) return `count ${val}: the ${ord(c[1])} smallest${Number.isInteger(K) ? `, looking for the ${ord(K)}` : ''}`;
    const v = popped(ctx, ctx.vars, ctx.prev);
    if (v !== null) return `nothing smaller is left: ${v} comes off the stack, the next value in sorted order`;
    const s = stackOf(ctx.vars);
    const was = s && itemsOf(ctx.prev[s[0]]);
    if (s && was && s[1].length === was.length + 1) {
      const top = s[1][s[1].length - 1];
      return `${top.$tree[0]} goes on the stack: smaller values may be to its left, come back to it later`;
    }
    // a collected in-order array growing
    for (const [name, arr] of Object.entries(ctx.vars)) {
      const old = ctx.prev[name];
      if (ctx.params.includes(name) || !Array.isArray(arr) || !Array.isArray(old) || arr.length !== old.length + 1 || !Number.isFinite(arr[arr.length - 1])) continue;
      return `visit ${arr[arr.length - 1]}: the ${ord(arr.length)} value in sorted order`;
    }
    if (at && at[1] === null && ctx.prev[at[0]] && isTree(ctx.prev[at[0]])) {
      const side = /\.right\b/.test(ctx.src) ? 'right' : /\.left\b/.test(ctx.src) ? 'left' : null;
      if (side) return `${ctx.prev[at[0]].$tree[0]} has nothing on its ${side}`;
    }
    if (at && val !== null && isTree(ctx.prev[at[0]]) && ctx.prev[at[0]].$ids[0] !== at[1].$ids[0]) {
      const from = ctx.prev[at[0]];
      if (from.$ids[2] === at[1].$ids[0]) return `${from.$tree[0]} is counted, so now its right side: the values between ${from.$tree[0]} and the next one up`;
      if (from.$ids[1] === at[1].$ids[0]) return `${at[1].$tree[0]} < ${from.$tree[0]}: keep walking left toward the smallest`;
    }
    return null;
  },
  // a value just came off the stack: is it the k-th?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const K = ctx.input?.[1];
    const kName = ctx.params[1];
    const k = ctx.vars[kName];
    const at = nodeOf(ctx, ctx.vars);
    const after = nodeOf(ctx, nx.vars);
    // a return from the same node (not an empty child's `return` in a recursive walk)
    const done = !!nx.ret && !!at && !!after && isTree(at[1]) && isTree(after[1]) && after[1].$ids[0] === at[1].$ids[0];
    let v = null;
    let nth = null;
    // a k that counts down decides in the same statement: ask as soon as the value comes off the stack
    const p = popped(ctx, ctx.vars, ctx.prev);
    if (p !== null && Number.isInteger(k) && (done || nx.vars[kName] === k - 1)) {
      v = p;
      nth = Number.isInteger(K) ? K - k + 1 : null;
    } else {
      // a counter that counts up: ask right after it went up, when the check comes next
      const c = countUp(ctx);
      const moved = after && at && isTree(at[1]) && (after[1] === null || !isTree(after[1]) || after[1].$ids[0] !== at[1].$ids[0]);
      if (!c || !at || !isTree(at[1]) || !(done || moved)) return null;
      v = at[1].$tree[0];
      nth = c[1];
    }
    const opts = [`Yes: return ${v}`, `No: keep going to its right side`];
    return {
      question: `${v} is the next value in sorted order${Number.isInteger(K) ? ` and we want the ${ord(K)} smallest` : ''}. Is ${v} the answer?`,
      options: opts,
      answer: done ? 0 : 1,
      explain: nth && Number.isInteger(K)
        ? `${v} is the ${ord(nth)} value counted off. ${done ? `That is the ${ord(K)}: stop here.` : `We need the ${ord(K)}, so keep going: the next values are on its right side, then up the stack.`}`
        : done ? `${v} is the k-th value counted, so the walk stops.` : `Not yet the k-th value: keep counting.`,
    };
  },
  bugs: [
    {
      label: 'k counted from 0',
      find: 'if (--k === 0)',
      replace: 'if (k-- === 0)',
      explain: 'Checking before counting treats k as 0-indexed: the walk goes one value too far and returns the (k+1)-th smallest.',
    },
  ],
};
