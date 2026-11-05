// Scene: Basic Calculator. A running total per bracket: "(" puts the outside total and its sign on the stack and
// starts a fresh total at 0; ")" folds the inside total back into the saved one. Works with result/res/total…,
// sign/sgn, num/n/cur and any stack name.
import { firstInt, options, row } from './util.js';

const TOTAL = ['result', 'res', 'total', 'sum', 'ans', 'acc', 'value', 'val'];
const SIGN = ['sign', 'sgn', 'op', 'operator'];
const NUM = ['num', 'number', 'n', 'curr', 'cur', 'operand', 'digits'];
const sgn = (x) => (x === -1 ? '−' : '+');
function namesOf(vars) {
  const [t] = firstInt(vars, TOTAL);
  const [g] = firstInt(vars, SIGN);
  const [n] = firstInt(vars, NUM.filter((k) => k !== t));
  const st = Object.entries(vars).find(([k, v]) => /st|stack|stk|saved/i.test(k) && row(v) && v.every(Number.isInteger));
  return { t, g: g && (vars[g] === 1 || vars[g] === -1) ? g : undefined, n, st: st?.[0] };
}
// [o, s] with after === o + s * before: the saved total and sign, from the old top of the stack or the variables
function folded(before, after, vars, prevStack) {
  const ints = Object.values(vars).filter(Number.isInteger);
  const pairs = [];
  if (prevStack && prevStack.length >= 2) pairs.push(prevStack.slice(-2), prevStack.slice(-2).reverse());
  for (const s of ints.filter((x) => x === 1 || x === -1)) for (const o of ints) pairs.push([o, s]);
  return pairs.find(([o, s]) => (s === 1 || s === -1) && after === o + s * before && !(o === 0 && s === 1)) || pairs.find(([o, s]) => (s === 1 || s === -1) && after === o + s * before && after !== before) || null;
}

export default {
  id: 'basic-calculator',
  metaphor: 'A running total per bracket',
  caption: 'result is the running total of the innermost open bracket. "(" saves the outside total and the sign in front of the bracket on the stack and starts again at 0; ")" folds the inside total back in.',
  narrate(ctx) {
    const { t, g, n, st } = namesOf(ctx.vars);
    const v = ctx.vars;
    const p = ctx.prev;
    if (st && row(p[st])) {
      const now = v[st];
      const was = p[st];
      if (now.length > was.length && was.every((x, k) => x === now[k])) {
        const added = now.slice(was.length);
        const has = (x) => x && new RegExp(`\\b${x}\\b`).test(ctx.src);
        const what = added.length === 1 && has(g) && !has(t) ? `the sign in front of the bracket (${sgn(added[0])})` : added.length === 1 && has(t) && !has(g) ? 'the total so far, outside the bracket' : `the outside total${g ? ' and the sign in front of the bracket' : ''}`;
        return `"(" opens a bracket: save ${added.join(' and ')} on the stack: ${what}`;
      }
      if (now.length < was.length && now.every((x, k) => x === was[k]) && !(t && v[t] !== p[t])) {
        const gone = was.slice(now.length).reverse();
        const k = gone.length === 1 && Object.keys(v).find((x) => x !== st && v[x] === gone[0] && p[x] !== gone[0]);
        const what = !k ? '' : /sign|sgn|op/i.test(k) ? `: the sign in front of the bracket (${sgn(gone[0])})` : /res|tot|sum|prev|outer|acc|val/i.test(k) ? ': the total from outside the bracket' : '';
        return `")" closes the bracket: take ${gone.join(', then ')} back off the stack${what}`;
      }
    }
    if (t && Number.isInteger(p[t]) && v[t] !== p[t]) {
      const d = v[t] - p[t];
      if (n && Number.isInteger(p[n]) && p[n] !== 0 && Math.abs(d) === p[n]) return `bank the number ${p[n]} with sign ${sgn(Math.sign(d))}: this bracket's total is ${v[t]}`;
      const fo = folded(p[t], v[t], v, st && row(p[st]));
      if (fo) return `fold the bracket back: saved ${fo[0]} ${sgn(fo[1])} bracket total ${p[t]} = ${v[t]}`;
      if (v[t] === 0) return `a fresh total for the new bracket: start at 0`;
      return null;
    }
    if (g && p[g] !== undefined && v[g] !== p[g]) return v[g] === -1 ? 'a "−": the next number (or bracket) will be subtracted' : 'a "+": the next number (or bracket) will be added';
    if (n && Number.isInteger(p[n]) && v[n] !== p[n] && v[n] !== 0) {
      return p[n] > 0 ? `another digit: the number is now ${v[n]}` : `start reading a number: ${v[n]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { t, g, n, st } = namesOf(ctx.vars);
    const v = ctx.vars;
    // the run is about to return: is the last number still pending?
    if (ctx.next.ret && t && n && g && v[n] !== 0 && Number.isInteger(ctx.result)) {
      const r = ctx.result;
      return options(
        `The string is read to the end. The total is ${v[t]}, and ${v[n]} (sign ${sgn(v[g])}) was read last. What does the calculator return?`,
        r,
        [v[t], v[t] - v[g] * v[n], v[n]].filter((x) => x !== r),
        r === v[t] + v[g] * v[n] ? `No operator came after ${v[n]}, so it was never banked: the answer is ${v[t]} ${sgn(v[g])} ${v[n]} = ${r}.` : `This run returned ${r}.`,
      );
    }
    // a bracket is folded back into the saved outside total
    const nv = ctx.next.vars;
    const nt = namesOf(nv).t;
    if (!t || nt !== t || !Number.isInteger(nv[t]) || nv[t] === v[t] || !st) return null;
    const fo = folded(v[t], nv[t], nv, row(v[st]));
    if (!fo || (n && Number.isInteger(v[n]) && v[n] !== 0 && Math.abs(nv[t] - v[t]) === v[n])) return null;
    const [o, s] = fo;
    const r = nv[t];
    return options(
      `")" closes a bracket worth ${v[t]}. Outside it the total was ${o}, and the sign in front of the bracket is ${sgn(s)}. What is the total now?`,
      r,
      [o + v[t], o - v[t], v[t], o].filter((x) => x !== r),
      `The bracket counts as one number with the saved sign: ${o} ${sgn(s)} ${v[t]} = ${r}.`,
    );
  },
  bugs: [
    {
      label: 'Forget the last pending number',
      find: 'return result + sign * num;',
      replace: 'return result;',
      explain: 'A number is only banked when an operator or ")" follows it, so the last one is still waiting: "42" returns 0.',
    },
    {
      label: 'Save the sign before the total',
      find: 'stack.push(result, sign);',
      replace: 'stack.push(sign, result);',
      explain: 'The pops at ")" take the sign first, then the total, so they must be pushed total first. Swapped, the saved total is used as the sign.',
    },
  ],
};
