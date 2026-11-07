// Scene: Maximum Sum BST in Binary Tree. Inspectors certify the tree from the leaves up: each node hears a report
// from both sides (is it a BST, its smallest and largest value, its sum) and passes only when everything on the
// left is smaller and everything on the right is bigger. Every certified subtree's sum is a candidate.
// Works with [isBST, min, max, sum] arrays (destructured or not) or report objects, under any names.

const NODE = ['node', 'n', 'cur', 'curr', 't', 'x', 'subtree'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => k in (vars || {}) && (vars[k] === null || isTree(vars[k])));
  return name ? [name, vars[name]] : null;
}
const num = (v) => typeof v === 'number' && !Number.isNaN(v);
/** a report value → { ok, min, max, sum }: [ok, min, max, sum] or an object with a boolean and min / max / sum fields */
function asReport(v) {
  if (Array.isArray(v) && v.length === 4 && typeof v[0] === 'boolean' && v.slice(1).every(num)) return { ok: v[0], min: v[1], max: v[2], sum: v[3] };
  const o = v && v.$obj;
  if (!o) return null;
  const f = (re) => Object.keys(o).find((k) => re.test(k));
  const ok = Object.keys(o).find((k) => typeof o[k] === 'boolean');
  const [mn, mx, sm] = [f(/min|lo|small/i), f(/max|hi|big|large/i), f(/sum|total/i)];
  return ok && mn && mx && sm && [mn, mx, sm].every((k) => num(o[k])) ? { ok: o[ok], min: o[mn], max: o[mx], sum: o[sm] } : null;
}
/** where the code keeps the left / right reports: destructured names or one variable, read from the code */
function specs(ctx) {
  const out = {};
  for (const line of ctx.lines || []) {
    let m = line.match(/\[\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*\w+\(\s*\w+\.(left|right)\s*\)/);
    if (m) out[m[5]] = { names: m.slice(1, 5), src: line };
    else if ((m = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*\w+\(\s*\w+\.(left|right)\s*\)/))) out[m[2]] = { name: m[1], src: line };
  }
  return out;
}
function readSide(vars, spec) {
  if (!spec) return null;
  if (spec.name) return asReport(vars[spec.name]);
  const [a, b, c, d] = spec.names.map((k) => vars[k]);
  return typeof a === 'boolean' && [b, c, d].every(num) ? { ok: a, min: b, max: c, sum: d } : null;
}
const empty = (r) => r.ok && r.min === Infinity && r.max === -Infinity;
const tell = (r) => (empty(r) ? 'empty' : r.ok ? `a BST holding ${r.min === r.max ? r.min : `${r.min}…${r.max}`}, sum ${r.sum}` : 'not a BST');
/** why a node with these side reports fails (or null when it passes) */
function fault(v, l, r) {
  if (!l.ok) return `its left side is not a BST, so ${v}'s subtree cannot be one`;
  if (!r.ok) return `its right side is not a BST, so ${v}'s subtree cannot be one`;
  if (!empty(l) && l.max >= v) return `its left side holds ${l.max}, not smaller than ${v}`;
  if (!empty(r) && r.min <= v) return `its right side holds ${r.min}, not bigger than ${v}`;
  return null;
}
const bounds = (v, l, r) => `${empty(l) ? '' : `${l.max} < `}${v}${empty(r) ? '' : ` < ${r.min}`}`;

export default {
  id: 'maximum-sum-bst-in-binary-tree',
  metaphor: 'Inspectors certifying the tree from the leaves up',
  caption: 'Each node waits for a report from both sides: is it a BST, its smallest and largest value, its sum. It passes only if everything on its left is smaller and everything on its right is bigger. The best sum of any passing subtree wins (an empty one counts as 0).',
  narrate(ctx) {
    const at = nodeOf(ctx, ctx.vars);
    const v = at && isTree(at[1]) ? at[1].$tree[0] : null;
    const sp = specs(ctx);
    const l = readSide(ctx.vars, sp.left);
    const r = readSide(ctx.vars, sp.right);
    if (ctx.ret) {
      if (!ctx.next && num(ctx.value)) return ctx.value === 0 ? 'no subtree beats the empty BST: the answer is 0' : `the biggest sum of a subtree that is a BST: ${ctx.value}`;
      const rep = asReport(ctx.value);
      if (!rep) return null;
      if (at && at[1] === null) return 'an empty spot: a BST with nothing in it, sum 0';
      if (v === null) return null;
      if (rep.ok && l && r && empty(l) && empty(r)) return `report up: a BST of just ${v}, sum ${rep.sum}`;
      if (rep.ok) return l && r ? `${v} passes (${bounds(v, l, r)}): a BST of sum ${rep.sum}, report it up` : `${v}'s subtree is a BST of sum ${rep.sum}: report it up`;
      const why = l && r && fault(v, l, r);
      return why ? `${v} fails: ${why}` : `${v}'s subtree is not a BST: report that up`;
    }
    if (v !== null) {
      for (const side of ['left', 'right']) {
        const rep = side === 'left' ? l : r;
        if (rep && sp[side].src.trim() === ctx.src.trim()) return `${v}'s ${side} side reports: ${tell(rep)}`;
      }
    }
    const sumK = Object.keys(ctx.vars).find((k) => !(k in ctx.prev) && num(ctx.vars[k]) && /sum|total/i.test(k));
    if (sumK && v !== null && l && r && empty(l) && empty(r)) return `${v} is a leaf, a BST on its own: sum ${ctx.vars[sumK]}`;
    if (sumK && v !== null && l && r) return `${v} passes (${bounds(v, l, r)}): its subtree sums to ${l.sum} + ${v} + ${r.sum} = ${ctx.vars[sumK]}`;
    const best = ['best', 'ans', 'max', 'maxSum', 'res', 'result', 'answer'].find((k) => num(ctx.vars[k]) && num(ctx.prev[k]) && ctx.vars[k] !== ctx.prev[k]);
    if (best && v !== null) return `new best: the BST under ${v} sums to ${ctx.vars[best]}`;
    const kept = ['best', 'ans', 'maxSum', 'res', 'result', 'answer'].find((k) => num(ctx.vars[k]) && ctx.vars[k] === ctx.prev[k] && new RegExp(`\\b${k}\\s*=`).test(ctx.src));
    const sumNow = Object.keys(ctx.vars).find((k) => num(ctx.vars[k]) && /sum|total/i.test(k) && !/^[lr]/i.test(k));
    if (kept && sumNow && v !== null) return `${ctx.vars[sumNow]} does not beat the best so far (${ctx.vars[kept]}): keep it`;
    const was = nodeOf(ctx, ctx.prev);
    if (v !== null && was && isTree(was[1]) && was[0] === at[0]) {
      const side = was[1].$ids[1] === at[1].$ids[0] ? 'left' : was[1].$ids[2] === at[1].$ids[0] ? 'right' : null;
      if (side) return `down to ${v} (${was[1].$tree[0]}'s ${side} side): first hear from both of its sides`;
    }
    if (v !== null && (!was || was[0] !== at[0]) && at[0] !== ctx.params[0] && at[1].$ids[0] === 1) return `start the inspection at ${v}: first hear from both of its sides`;
    return null;
  },
  // both reports are in: does this node pass?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || ctx.ret) return null;
    const at = nodeOf(ctx, ctx.vars);
    const after = nodeOf(ctx, nx.vars);
    if (!at || !isTree(at[1]) || !after || !isTree(after[1]) || after[1].$ids[0] !== at[1].$ids[0]) return null;
    const sp = specs(ctx);
    const l = readSide(ctx.vars, sp.left);
    const r = readSide(ctx.vars, sp.right);
    if (!l || !r || (empty(l) && empty(r))) return null;
    // ask on the step where the right report has just arrived
    if (!sp.right || sp.right.src.trim() !== ctx.src.trim()) return null;
    let pass = null;
    const rep = nx.ret ? asReport(nx.value) : null;
    if (rep) pass = rep.ok;
    else if (!nx.ret && Object.keys(nx.vars).some((k) => !(k in ctx.vars))) pass = true;
    if (pass === null) return null;
    const v = at[1].$tree[0];
    const why = fault(v, l, r);
    return {
      question: `${v} heard back: left side ${tell(l)}; right side ${tell(r)}. Is ${v}'s subtree a BST?`,
      options: ['Yes: it passes, add up its sum', 'No: report "not a BST" up'],
      answer: pass ? 0 : 1,
      explain: pass ? `Both sides are BSTs and ${bounds(v, l, r)}, so the whole subtree is sorted.` : why ? `${v} fails: ${why}.` : 'The checks did not pass, so the subtree is reported as not a BST.',
    };
  },
  bugs: [
    {
      label: 'Best starts at -Infinity',
      find: 'let best = 0;',
      replace: 'let best = -Infinity;',
      explain: 'The empty tree is a BST with sum 0. When every value is negative the answer is 0, but starting at -Infinity returns the least negative node instead.',
    },
    {
      label: 'Empty side reported the wrong way round',
      find: 'return [true, Infinity, -Infinity, 0];',
      replace: 'return [true, -Infinity, Infinity, 0];',
      explain: 'An empty side must never block its parent: its min must be +∞ and its max −∞. Swapped, every leaf fails the check and no BST is ever found.',
    },
  ],
};
