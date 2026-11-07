// K-th Symbol in Grammar: each row grows from the one above (0 → 01, 1 → 10), so the symbols form a family tree:
// spot k of row n is a child of spot ⌈k/2⌉ of row n − 1. An odd spot (left child) copies its parent, an even spot
// (right child) flips it. Works with the self-calling form (any parameter names) or a helper; a loop gets the
// generic notes.
import { functionAt, options } from './util.js';

/** [function name, its parameter names] for the line */
function argsOf(lines, line) {
  const fn = functionAt(lines || [], line);
  if (!fn) return [fn, []];
  const re = new RegExp(`(?:function\\s+${fn}\\s*\\(([^)]*)\\)|\\b${fn}\\s*=\\s*(?:function\\s*\\(([^)]*)\\)|\\(([^)]*)\\)\\s*=>|(\\w+)\\s*=>))`);
  for (const l of lines) {
    const m = re.exec(l);
    if (m) return [fn, (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').split(',').map((s) => s.replace(/=.*$/, '').trim()).filter(Boolean)];
  }
  return [fn, []];
}
/** the current call { fn, n, k } of a recursive (row, spot) function */
function callOf(lines, line, vars) {
  const [fn, args] = argsOf(lines, line);
  if (!fn || args.length !== 2 || !Number.isInteger(vars[args[0]]) || !Number.isInteger(vars[args[1]])) return null;
  if (((lines || []).join('\n').match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length < 2) return null;
  return { fn, n: vars[args[0]], k: vars[args[1]] };
}
const callsSelf = (src, fn) => new RegExp(`\\b${fn}\\s*\\(`).test(src || '');
/** the parent's symbol just assigned on a self-calling line: [name, 0 | 1] */
function parentVar(c, src, vars) {
  const t = (/\b(\w+)\s*=[^=]/.exec(src || '') || [])[1];
  return t && callsSelf(src, c.fn) && (vars[t] === 0 || vars[t] === 1) ? [t, vars[t]] : null;
}
const sym = (v) => (v === true ? 1 : v === false ? 0 : v);

export default {
  id: 'k-th-symbol-in-grammar',
  metaphor: 'A family tree of 0s and 1s',
  caption: 'Every symbol has two children in the next row: 0 has children 0 1, and 1 has children 1 0. So a left child (odd spot) copies its parent and a right child (even spot) flips it.',
  narrate(ctx) {
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    const v = sym(ctx.value);
    const last = ctx.ret && !ctx.next && (v === 0 || v === 1);
    if (last && !(c && c.n > 1)) {
      const [n, k] = ctx.input || [];
      return `row ${n}, spot ${k} holds ${v}`;
    }
    if (!c) return null;
    const { n, k } = c;
    if (ctx.ret && (v === 0 || v === 1)) {
      if (n === 1) return `row 1 is just "0": the root of the family`;
      const p = k % 2 === 1 ? v : 1 - v;
      const end = last ? `: row ${n}, spot ${k} holds ${v}` : '';
      return (k % 2 === 1 ? `spot ${k} is odd, a left child: it copies its parent ${p} → ${v}` : `spot ${k} is even, a right child: it flips its parent ${p} → ${v}`) + end;
    }
    const pv = parentVar(c, ctx.src, ctx.vars);
    if (pv) return `row ${n - 1}, spot ${Math.ceil(k / 2)} (the parent) holds ${pv[1]}`;
    const was = callOf(ctx.lines, ctx.line, ctx.prev);
    if (!was || was.n !== n || was.k !== k) return n > 1 ? `row ${n}, spot ${k}: its parent is spot ${Math.ceil(k / 2)} of row ${n - 1}: ask it first` : `row 1, spot ${k}: the top of the tree`;
    return null;
  },
  // the parent's symbol is known: what does this spot hold?
  predict(ctx) {
    const nx = ctx.next;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    if (!nx || !c || !nx.ret) return null;
    const d = callOf(ctx.lines, nx.line, nx.vars);
    const v = sym(nx.value);
    if (!d || d.n < 2 || (v !== 0 && v !== 1)) return null;
    // the parent's symbol: a variable on this step of the same call, or the answer the parent call returns now
    let pv = d.n === c.n && d.k === c.k ? parentVar(c, ctx.src, ctx.vars) : null;
    const pr = sym(ctx.value);
    if (!pv && ctx.ret && c.n === d.n - 1 && c.k === Math.ceil(d.k / 2) && (pr === 0 || pr === 1)) pv = ['', pr];
    if (!pv) return null;
    const odd = d.k % 2 === 1;
    return {
      question: `Row ${d.n}, spot ${d.k}: its parent (row ${d.n - 1}, spot ${Math.ceil(d.k / 2)}) holds ${pv[1]}. What does spot ${d.k} hold?`,
      options: ['0', '1'],
      answer: v,
      explain: odd ? `Spot ${d.k} is odd, the left child, and a left child copies its parent: ${v}.` : `Spot ${d.k} is even, the right child, and a right child flips its parent: ${pv[1]} → ${v}.`,
    };
  },
  bugs: [
    {
      label: 'Parent spot rounded down',
      find: 'Math.ceil(k / 2)',
      replace: 'Math.floor(k / 2)',
      explain: 'Spots are counted from 1, so spots 1 and 2 share parent 1. Rounding down sends spot 1 to a spot 0 that does not exist and every odd spot to the wrong parent.',
    },
    {
      label: 'Copy and flip swapped',
      find: 'k % 2 === 1 ? parent : 1 - parent',
      replace: 'k % 2 === 0 ? parent : 1 - parent',
      explain: 'Row 2 is "01", so spot 1 (odd) copies the 0 and spot 2 (even) flips it. Swapping them makes row 2 "10" and every answer below it wrong.',
    },
  ],
};
