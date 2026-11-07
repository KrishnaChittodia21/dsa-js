// Expression Add Operators: slipping +, - or × into the gaps of a digit string. Each call carries the expression so
// far, its value, and its last term: × binds tighter, so it takes the last term back out and puts last × x in instead.
import { callArgs, options } from './util.js';

const VALUE = /^(value|val|sum|total|cur|curr|current|res|eval|calc|acc|so_?far)$/i;
const LAST = /^(last|prev|prevnum|prevoperand|prevterm|lastterm|lastnum|lastoperand|mult|multed|tail|term)$/i;
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'exprs'];
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => typeof r === 'string'));
const digits = (e) => e.replace(/[^0-9]/g, '').length;

/** the call's expression (its string parameter), value and last term, read from callArgs */
function stateOf(ctx) {
  const call = callArgs(ctx);
  if (!call) return null;
  const a = call.args;
  const en = Object.keys(a).find((k) => typeof a[k] === 'string' && /^[0-9+\-*]*$/.test(a[k]));
  const vn = Object.keys(a).find((k) => VALUE.test(k) && Number.isFinite(a[k]));
  const ln = Object.keys(a).find((k) => LAST.test(k) && Number.isFinite(a[k]));
  return en === undefined || !vn ? null : { expr: a[en], value: a[vn], last: ln ? a[ln] : undefined };
}
const sub = (ctx, step) => ({ lines: ctx.lines, line: step.line, vars: step.vars });

export default {
  id: 'expression-add-operators',
  metaphor: 'Slipping signs between calculator digits',
  caption: 'Each call holds the expression written so far, its value and its last term. + and - just add or subtract the new number; × binds tighter, so the last term is taken back out and last × number goes in instead. An expression that uses every digit and hits the target is written down.',
  narrate(ctx) {
    const num = ctx.input?.[0];
    const target = ctx.input?.[1];
    if (typeof num !== 'string' || !Number.isFinite(target)) return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `"${res[res.length - 1]}" uses every digit and equals ${target}, the target: record it (${res.length} found)`;
    const s = stateOf(ctx);
    if (!s || !s.expr) return null;
    const p = stateOf({ ...ctx, vars: ctx.prev });
    if (p && p.expr === s.expr) return null;
    if (p && p.expr.length > s.expr.length && p.expr.startsWith(s.expr)) return `back to "${s.expr}" (value ${s.value})`;
    const full = digits(s.expr) === num.length;
    const end = full ? `: every digit used, ${s.value} ≠ ${target}` : '';
    const m = /([+\-*])(\d+)$/.exec(s.expr);
    if (!m) return `first number ${s.expr}: value ${s.value}${end}`;
    const x = Number(m[2]);
    if (!p || !s.expr.startsWith(p.expr)) return `"${s.expr}" has value ${s.value}${end}`;
    if (m[1] === '*' && Number.isFinite(p.last)) return `write ×${x} → "${s.expr}": take back the last term ${p.last}, add ${p.last}×${x} = ${p.last * x} → ${s.value}${end}`;
    return `write ${m[1]}${x} → "${s.expr}": value ${s.value}${end}`;
  },
  // the next call writes one more sign: does the finished expression hit the target? what is a × expression worth?
  predict(ctx) {
    const num = ctx.input?.[0];
    const target = ctx.input?.[1];
    if (!ctx.next || typeof num !== 'string' || !Number.isFinite(target)) return null;
    const s = stateOf(ctx);
    const n = stateOf(sub(ctx, ctx.next));
    if (!s || !n || !s.expr || n.expr === s.expr || !n.expr.startsWith(s.expr)) return null;
    const m = /^([+\-*])(\d+)$/.exec(n.expr.slice(s.expr.length));
    if (!m) return null;
    const x = Number(m[2]);
    if (m[1] === '*' && Number.isFinite(s.last)) {
      const naive = s.value * x;
      return options(
        `"${s.expr}" is worth ${s.value} (last term ${s.last}). What is "${n.expr}" worth?`,
        n.value,
        [naive, s.value + x, s.last * x, s.value - s.last],
        `× binds tighter than + and -: take the last term ${s.last} back out (${s.value} − ${s.last} = ${s.value - s.last}) and add ${s.last}×${x} = ${s.last * x}, giving ${s.value - s.last + s.last * x}. Multiplying the whole value (${naive}) would ignore precedence.`,
      );
    }
    const res = resultOf(ctx.vars);
    const resNext = resultOf(ctx.next.vars);
    if (digits(n.expr) !== num.length || !res || !resNext) return null;
    const hit = resNext.length === res.length + 1;
    return {
      question: `Next try: "${n.expr}", which uses every digit. Is it written down (target ${target})?`,
      options: ['Yes: it equals the target', 'No: it misses the target'],
      answer: hit ? 0 : 1,
      explain: hit ? `"${n.expr}" works out to ${n.value}, exactly the target ${target}.` : `"${n.expr}" works out to ${n.value}, not ${target}, so this branch ends without an answer.`,
    };
  },
  bugs: [
    {
      label: 'Multiply the whole value: no precedence',
      find: 'value - last + last * x, last * x',
      replace: 'value * x, last * x',
      explain: '"1+2*3" is worked out as (1+2)×3 = 9 instead of 7, so expressions that need × to bind first are missed and wrong ones are recorded.',
    },
    {
      label: 'Forget the sign of the last term after -',
      find: 'value - x, -x);',
      replace: 'value - x, x);',
      explain: 'After "-2" the last term is stored as +2, so a following × takes back the wrong amount: "3-2*2" is worked out as 3 - 2 - 2 + 4 instead of -1.',
    },
  ],
};
