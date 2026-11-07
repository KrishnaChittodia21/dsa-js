// Scene: Count Good Nodes in Binary Tree. Hikers on a trail down a mountain: each node looks back up its path and
// is good when nobody above it stands taller. The tallest so far travels down with each node (stack or recursion).
// Works with the stack loop ([node, maxAbove] pairs) and with recursion dfs(node, maxSoFar).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const MAXNAME = /max|big|great|tall|high|^hi$|top|limit|sofar|above|path|^m$|^mx$|best/i;
const COUNTNAME = /count|cnt|good|res|ans|total|num|sum/i;
const num = (v) => typeof v === 'number' && !Number.isNaN(v);
const fmt = (v) => (v === -Infinity ? '−∞' : v === Infinity ? '∞' : String(v));

/** the node being looked at: a tree variable other than the root parameter, else the root parameter itself */
function nodeOf(ctx, vars) {
  const own = Object.entries(vars).filter(([k, v]) => (v === null || isTree(v)) && !/\(whole\)/.test(k) && k !== ctx.params[0]);
  const trees = own.filter(([, v]) => v !== null);
  if (trees.length === 1) return trees[0];
  return !own.length && isTree(vars[ctx.params[0]]) ? [ctx.params[0], vars[ctx.params[0]]] : null;
}
/** the "tallest above" variable: a number named like a maximum (the carried value, not the children's copy) */
function maxOf(vars, lines) {
  // the value made for the children (`const next = Math.max(…)`) is not the one looked back at
  const carried = new Set(lines.map((l) => l.match(/(?:const|let|var)\s+(\w+)\s*=\s*Math\.max\(/)?.[1]).filter(Boolean));
  const k = Object.keys(vars).find((k) => MAXNAME.test(k) && num(vars[k]) && !carried.has(k) && !COUNTNAME.test(k));
  return k || null;
}
const countOf = (vars, skip) => Object.keys(vars).find((k) => k !== skip && !/^is[A-Z_]/.test(k) && COUNTNAME.test(k) && Number.isInteger(vars[k]));

export default {
  id: 'count-good-nodes-in-binary-tree',
  metaphor: 'Nobody taller on the trail above',
  caption: 'Walking down from the root, each node looks back up its own path: it is good when nobody above it is taller. The tallest value so far travels down with every node.',
  narrate(ctx) {
    const nd = nodeOf(ctx, ctx.vars);
    const mk = maxOf(ctx.vars, ctx.lines);
    const v = nd?.[1].$tree[0];
    const m = mk && ctx.vars[mk];
    const ck = countOf(ctx.vars, mk);
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `every node has looked back up its path: ${ctx.value} good node${ctx.value === 1 ? '' : 's'}`;
    // a counter went up by one: this node is good
    if (nd && ck && Number.isInteger(ctx.prev[ck]) && ctx.vars[ck] === ctx.prev[ck] + 1 && num(m))
      return `node ${v} ≥ ${fmt(m)}, the tallest above it: good node #${ctx.vars[ck]}`;
    // recursion: a fresh 0/1 (or boolean) verdict
    const verdict = Object.keys(ctx.vars).find((k) => !(k in ctx.prev) && (ctx.vars[k] === 0 || ctx.vars[k] === 1 || typeof ctx.vars[k] === 'boolean') && /[<>]/.test(ctx.src));
    if (nd && verdict && num(m)) return ctx.vars[verdict] ? `node ${v} ≥ ${fmt(m)}, the tallest above it: good` : `${fmt(m)} above it is taller than node ${v}: not good`;
    // the tallest-so-far made for the children
    const carry = ctx.src.match(/(\w+)\s*=\s*Math\.max\(/)?.[1];
    if (nd && carry && num(ctx.vars[carry]) && num(m) && carry !== mk)
      return ck && ctx.vars[ck] === ctx.prev[ck] && v < m
        ? `node ${v} < ${fmt(m)} above it: not good. Its children will see ${fmt(ctx.vars[carry])} as the tallest above`
        : `node ${v}'s children will see ${fmt(ctx.vars[carry])} as the tallest above them`;
    if (ctx.ret && ctx.value === 0 && !nd) return 'an empty spot: no nodes here, 0 good';
    if (ctx.ret && Number.isInteger(ctx.value) && nd) return `back at node ${v}: ${ctx.value} good node${ctx.value === 1 ? '' : 's'} in its subtree`;
    // a node picked up from the stack, or a call that reached a new node
    const was = nodeOf(ctx, ctx.prev);
    if (nd && num(m) && (!was || was[1].$ids[0] !== nd[1].$ids[0])) return `node ${v} looks back up its path: the tallest above it is ${fmt(m)}`;
    return null;
  },
  // a node has just arrived with its tallest-above value: is it good?
  predict(ctx) {
    if (!ctx.next) return null;
    const nd = nodeOf(ctx, ctx.vars);
    const mk = maxOf(ctx.vars, ctx.lines);
    if (!nd || !mk || !Number.isFinite(ctx.vars[mk])) return null;
    const was = nodeOf(ctx, ctx.prev);
    if (was && was[1].$ids[0] === nd[1].$ids[0]) return null;
    const nx = ctx.next.vars;
    const nn = nodeOf(ctx, nx);
    if (!nn || nn[1].$ids[0] !== nd[1].$ids[0]) return null;
    const ck = countOf(ctx.vars, mk);
    const verdict = Object.keys(nx).find((k) => !(k in ctx.vars) && (nx[k] === 0 || nx[k] === 1 || typeof nx[k] === 'boolean') && /[<>]/.test(ctx.lines[ctx.next.line - 1] || ''));
    let good;
    if (ck && Number.isInteger(nx[ck]) && nx[ck] === ctx.vars[ck] + 1) good = true;
    else if (verdict) good = !!nx[verdict];
    else if (ck && nx[ck] === ctx.vars[ck] && /Math\.max/.test(ctx.lines[ctx.next.line - 1] || '')) good = false;
    else return null;
    const v = nd[1].$tree[0];
    const m = ctx.vars[mk];
    return {
      question: `Node ${v} looks back up its path; the tallest above it is ${fmt(m)}. Is node ${v} good?`,
      options: ['Yes, count it', 'No, skip it'],
      answer: good ? 0 : 1,
      explain: good
        ? `${v} ≥ ${fmt(m)}: nobody above is taller${v === m ? ' (an equal value does not block the view)' : ''}, so it counts.`
        : `${fmt(m)} above it is taller than ${v}, so it is not good. Its children still see ${fmt(m)} as the tallest above.`,
    };
  },
  bugs: [
    {
      label: 'Strictly greater than (>)',
      find: 'if (node.val >= maxAbove) count++;',
      replace: 'if (node.val > maxAbove) count++;',
      explain: 'A node equal to the tallest above it is still good: nobody above is taller. With > such ties are skipped and the count comes out too small.',
    },
    {
      label: 'Pass the node, not the tallest',
      find: 'const next = Math.max(maxAbove, node.val);',
      replace: 'const next = node.val;',
      explain: 'Children only compare with their parent, not the whole path: a small parent under a tall grandparent lets a medium child count as good.',
    },
  ],
};
