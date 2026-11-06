// Different Ways to Add Parentheses: the last operator to run splits the expression in two. Cut at every
// operator, ask each side for all its values (recursion), and combine every left value with every right value.
// A piece without an operator is just a number. Works with a helper or a self-calling main function (any names),
// with or without a memo.
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
/** the piece of the expression the current call works on: { fn, name, e } */
function callOf(lines, line, vars) {
  const [fn, args] = argsOf(lines, line);
  const name = args.find((a) => typeof vars[a] === 'string');
  if (!fn || !name) return null;
  if (((lines || []).join('\n').match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length < 2) return null;
  return { fn, name, e: vars[name] };
}
const opsIn = (e) => (e.match(/[-+*]/g) || []).length;
const nums = (v) => Array.isArray(v) && v.every((x) => Number.isInteger(x));
const apply = (op, a, b) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : NaN);
const isOp = (x) => x === '+' || x === '-' || x === '*';
const memoLine = (src, fn) => /memo|cache|seen|dp|\.get\(|\.has\(/.test(src || '') && !new RegExp(`\\b${fn}\\s*\\(`).test(src || '');
/** the cut being tried: { op, i } (an operator variable and the index where it sits) */
function cutOf(vars, e) {
  const op = Object.entries(vars).find(([, v]) => isOp(v));
  if (!op) return null;
  const idx = Object.entries(vars).find(([, v]) => Number.isInteger(v) && e[v] === op[1]);
  return idx ? { opName: op[0], op: op[1], iName: idx[0], i: idx[1] } : null;
}
/** [name, list] of the results list that just grew by one */
function grownList(vars, prev, params, skip) {
  return Object.entries(vars).find(([k, v]) => !params.includes(k) && !skip.includes(k) && nums(v) && nums(prev[k]) && v.length === prev[k].length + 1) || null;
}

export default {
  id: 'different-ways-to-add-parentheses',
  metaphor: 'Cut at each operator, combine both halves',
  caption: 'The operator that runs last splits the expression into a left and a right part. Each part reports every value it can take, and every left value meets every right value.',
  narrate(ctx) {
    const [pName] = ctx.params;
    const whole = ctx.input?.[0] ?? ctx.vars[pName];
    if (ctx.ret && !ctx.next && nums(ctx.value)) return `all ${ctx.value.length} ways to group "${whole}": [${ctx.value.join(', ')}]`;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    if (!c) return null;
    const { fn, e } = c;
    if (ctx.ret && nums(ctx.value)) {
      if (memoLine(ctx.src, fn)) return `"${e}" is already in the notebook: [${ctx.value.join(', ')}]`;
      if (!opsIn(e)) return `"${e}" hands back its one value [${ctx.value.join(', ')}]`;
      return `"${e}" can be [${ctx.value.join(', ')}]: ${ctx.value.length} way${ctx.value.length === 1 ? '' : 's'}`;
    }
    const cut = cutOf(ctx.vars, e);
    // a side's values just came back
    const t = (/\b(\w+)\s*=[^=]/.exec(ctx.src || '') || [])[1];
    if (cut && t && nums(ctx.vars[t]) && new RegExp(`\\b${fn}\\s*\\(`).test(ctx.src)) {
      const side = /^l/i.test(t) ? e.slice(0, cut.i) : /^r/i.test(t) ? e.slice(cut.i + 1) : null;
      return side === null ? `one side can be [${ctx.vars[t].join(', ')}]` : `"${side}" (${/^l/i.test(t) ? 'left' : 'right'} of the '${cut.op}') can be [${ctx.vars[t].join(', ')}]`;
    }
    const was = callOf(ctx.lines, ctx.line, ctx.prev);
    if (!was || was.e !== e || was.fn !== fn) {
      const nx = ctx.next;
      if (nx?.ret && callOf(ctx.lines, nx.line, nx.vars)?.e === e && memoLine(ctx.lines[nx.line - 1], fn)) return `"${e}" again: check the notebook first`;
      return opsIn(e) ? `work on "${e}": try cutting at each of its ${opsIn(e)} operator${opsIn(e) > 1 ? 's' : ''}` : `"${e}" has no operator: it is just the number ${Number(e)}`;
    }
    const g = grownList(ctx.vars, ctx.prev, ctx.params, []);
    if (g) {
      const [name, list] = g;
      const x = list[list.length - 1];
      if (!opsIn(e)) return `"${e}" is a plain number: its only value is ${x}`;
      if (cut) {
        const ints = Object.entries(ctx.vars).filter(([k, v]) => Number.isInteger(v) && k !== cut.iName && k !== name);
        for (const [, a] of ints) for (const [, b] of ints) if (apply(cut.op, a, b) === x) return `${a} ${cut.op} ${b} = ${x}: "${e}" values so far [${list.join(', ')}]`;
      }
      return `one more grouping gives ${x}: [${list.join(', ')}]`;
    }
    if (cut && (ctx.vars[cut.opName] !== ctx.prev[cut.opName] || ctx.vars[cut.iName] !== ctx.prev[cut.iName])) return `cut "${e}" at the '${cut.op}': left "${e.slice(0, cut.i)}", right "${e.slice(cut.i + 1)}"`;
    return null;
  },
  // a piece with several operators is about to report all its values
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !nx.ret || !nums(nx.value)) return null;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    const d = callOf(ctx.lines, nx.line, nx.vars);
    if (!c || !d || c.e !== d.e || opsIn(d.e) < 2 || memoLine(ctx.lines[nx.line - 1], d.fn)) return null;
    const n = nx.value.length;
    return options(`All cuts of "${d.e}" are done. How many values does it report?`, n, [n - 1, n + 1, opsIn(d.e)].filter((x) => x > 0 && x !== n), `Each cut adds (left values) × (right values) results, and duplicates are kept: "${d.e}" reports ${n}: [${nx.value.join(', ')}].`);
  },
  bugs: [
    {
      label: 'Drop duplicate values',
      find: 'return solve(expression);',
      replace: 'return [...new Set(solve(expression))];',
      explain: 'Different groupings that give the same number each count: "2*3-4*5" has two groupings worth −10, so a Set reports 4 values instead of 5.',
    },
    {
      label: 'Forget the plain-number base case',
      find: 'if (out.length === 0) out.push(Number(expr)); // base case: plain number',
      replace: '// no base case',
      explain: 'A piece without an operator returns an empty list, so every pairing loops over nothing and the whole answer is [].',
    },
  ],
};
