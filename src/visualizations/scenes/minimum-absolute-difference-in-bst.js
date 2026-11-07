// Scene: Minimum Absolute Difference in BST. An in-order walk lines the values up in sorted order, like people
// sorted by height: the closest pair must stand next to each other, so each value is only compared with the one
// just before it. Works with the stack walk or a recursive in-order (node / cur / n…, prev / last…, best / min / ans…).
import { itemsOf } from './util.js';

const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'x'];
const BEST = ['best', 'min', 'minDiff', 'mindiff', 'ans', 'res', 'result', 'answer', 'diff', 'minimum', 'm'];
const PREV = ['prev', 'last', 'pre', 'previous', 'lastVal', 'prevVal', 'p', 'before'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const num = (v) => typeof v === 'number' && !Number.isNaN(v);
const show = (v) => (v === Infinity ? '∞' : String(v));
/** values are >= 0 (constraints), so null / a negative sentinel means "no value seen yet" */
const seen = (v) => Number.isFinite(v) && v >= 0;
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => k in (vars || {}) && (vars[k] === null || isTree(vars[k])));
  return name ? [name, vars[name]] : null;
}
const bestName = (vars) => BEST.find((k) => num(vars?.[k]));
const prevName = (vars) => PREV.find((k) => k in (vars || {}) && (vars[k] === null || num(vars[k])));
function stackOf(vars) {
  for (const k of Object.keys(vars || {})) {
    const items = itemsOf(vars[k]);
    if (items && (items.length ? items.every(isTree) : /^(stack|stk|st|s)$/.test(k))) return [k, items];
  }
  return null;
}
/** the node that just came off the stack (a tree), or null */
function popped(ctx) {
  const s = stackOf(ctx.vars);
  const was = s && itemsOf(ctx.prev[s[0]]);
  const at = nodeOf(ctx, ctx.vars);
  if (!s || !was || s[1].length !== was.length - 1 || !at || !isTree(at[1])) return null;
  const top = was[was.length - 1];
  return isTree(top) && top.$ids[0] === at[1].$ids[0] ? at[1] : null;
}

export default {
  id: 'minimum-absolute-difference-in-bst',
  metaphor: 'Neighbours in a line sorted by height',
  caption: 'An in-order walk visits a BST in sorted order, like people lined up by height. The closest pair must be next-door neighbours, so each value is compared only with the one just before it.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && num(ctx.value)) return `every neighbour pair is checked: the smallest gap is ${show(ctx.value)}`;
    const at = nodeOf(ctx, ctx.vars);
    const v = at && isTree(at[1]) ? at[1].$tree[0] : null;
    const b = bestName(ctx.vars);
    const p = prevName(ctx.vars);
    if (b && num(ctx.prev[b]) && ctx.vars[b] !== ctx.prev[b] && v !== null && p && seen(ctx.vars[p])) {
      const was = ctx.prev[b];
      return `${v} − ${ctx.vars[p]} = ${ctx.vars[b]}: ${was === Infinity ? 'the first gap measured' : `closer than ${was}, the new closest pair`}`;
    }
    if (b && p && v !== null && seen(ctx.vars[p]) && ctx.vars[p] !== v && ctx.vars[b] === ctx.prev[b] && ctx.src.includes(b) && ctx.vars[b] <= v - ctx.vars[p]) return `compare ${v} with its neighbour ${ctx.vars[p]}: a gap of ${v - ctx.vars[p]}, the closest stays ${show(ctx.vars[b])}`;
    if (p && v !== null && ctx.vars[p] === v && ctx.prev[p] !== v && p in ctx.prev) {
      const old = ctx.prev[p];
      if (seen(old) && b && ctx.vars[b] === ctx.prev[b] && ctx.vars[b] < v - old) return `${v} − ${old} = ${v - old}, not closer than ${show(ctx.vars[b])}. ${v} is now the last value seen`;
      return seen(old) ? `${v} is now the last value seen: the next one is compared with it` : `${v} is the smallest value: nothing before it to compare with`;
    }
    const t = popped(ctx);
    if (t) return `nothing smaller is left: ${t.$tree[0]} comes off the stack, next in sorted order`;
    const s = stackOf(ctx.vars);
    const was = s && itemsOf(ctx.prev[s[0]]);
    if (s && was && s[1].length === was.length + 1) return `${s[1][s[1].length - 1].$tree[0]} waits on the stack: smaller values come first`;
    const was0 = nodeOf(ctx, ctx.prev);
    if (at && was0 && was0[0] === at[0] && isTree(was0[1])) {
      const from = was0[1];
      if (at[1] === null) return /\.right\b/.test(ctx.src) ? `${from.$tree[0]} has nothing on its right` : /\.left\b/.test(ctx.src) ? `${from.$tree[0]} has nothing on its left` : null;
      if (from.$ids[1] === at[1].$ids[0]) return `${v} < ${from.$tree[0]}: keep walking left toward the smaller values`;
      if (from.$ids[2] === at[1].$ids[0]) return `on to ${from.$tree[0]}'s right side: the values just above ${from.$tree[0]}`;
    }
    // a loop over a collected sorted list: neighbours a[i - 1], a[i]
    const i = ['i', 'j', 'k', 'idx'].find((n) => Number.isInteger(ctx.vars[n]));
    const arr = i && Object.entries(ctx.vars).find(([k, a]) => !ctx.params.includes(k) && Array.isArray(a) && a.length > ctx.vars[i] && ctx.vars[i] > 0 && a.every(num));
    if (arr && b) {
      const [x, y] = [arr[1][ctx.vars[i] - 1], arr[1][ctx.vars[i]]];
      return ctx.vars[b] !== ctx.prev[b] ? `neighbours ${x} and ${y}: gap ${y - x}, the new closest` : `neighbours ${x} and ${y}: gap ${y - x}, not closer than ${show(ctx.vars[b])}`;
    }
    // a collected sorted list: the values in a row
    for (const [k, arr] of Object.entries(ctx.vars)) {
      const old = ctx.prev[k];
      if (Array.isArray(arr) && Array.isArray(old) && arr.length === old.length + 1 && num(arr[arr.length - 1]) && !ctx.params.includes(k)) return `${arr[arr.length - 1]} joins the line: ${arr.length} value${arr.length > 1 ? 's' : ''} in sorted order`;
    }
    return null;
  },
  // a value is next in line: what is the closest gap after comparing it with its neighbour?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || ctx.ret) return null;
    const at = nodeOf(ctx, ctx.vars);
    if (!at || !isTree(at[1])) return null;
    const b = bestName(ctx.vars);
    const p = prevName(ctx.vars);
    if (!b || !p || !seen(ctx.vars[p])) return null;
    const v = at[1].$tree[0];
    const last = ctx.vars[p];
    const cur = ctx.vars[b];
    // ask once the value has arrived (it came off the stack, or a recursive call reached it) and before it is compared
    if (!popped(ctx) && !(ctx.prev[at[0]] !== undefined && /\.(left)\b/.test(ctx.src))) return null;
    const changed = num(nx.vars[b]) && nx.vars[b] !== cur;
    // no change: the next step must be the comparison itself (its line uses the best variable), or prev moving on to v
    const same = nodeOf(ctx, nx.vars)?.[1]?.$ids?.[0] === at[1].$ids[0] && nx.vars[b] === cur && nx.vars[p] === last && (ctx.lines[nx.line - 1] || '').includes(b);
    const compared = changed || (nx.vars[p] === v && nx.vars[b] === cur) || same;
    if (!compared || !num(nx.vars[b])) return null;
    const right = nx.vars[b];
    const d = v - last;
    const card = options(`${v} is next in line, after ${last}. The closest gap so far is ${show(cur)}. What is it after ${v}?`, show(right), [show(d), show(cur), show(v), show(Math.max(0, d - 1))]);
    if (!card) return null;
    return {
      ...card,
      explain: changed ? `${v} − ${last} = ${d}, smaller than ${show(cur)}: the new closest gap.` : `${v} − ${last} = ${d}, not smaller than ${show(cur)}: the closest gap stays.`,
    };
  },
  bugs: [
    {
      label: 'Never moving the neighbour along',
      find: 'prev = node.val;',
      replace: 'prev = prev;',
      explain: 'The last value seen must move forward after every visit; left behind, no value is ever compared with its real neighbour.',
    },
    {
      label: 'A previous value of 0 counts as none',
      find: 'if (prev !== null)',
      replace: 'if (prev)',
      explain: '`if (prev)` is false when the last value seen is 0, so the gap between 0 and the next value is never measured.',
    },
  ],
};

function options(question, right, wrong) {
  const opts = [...new Set([String(right), ...wrong.map(String)])].slice(0, 4);
  if (opts.length < 2) return null;
  opts.sort((a, b) => (a === '∞' ? 1 : b === '∞' ? -1 : Number(a) - Number(b)));
  return { question, options: opts, answer: opts.indexOf(String(right)) };
}
