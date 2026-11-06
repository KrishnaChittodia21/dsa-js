// Fibonacci Number: F(k) = F(k−1) + F(k−2). Recursion asks the two smaller numbers and adds their answers on the
// way back up; a memo notebook stops the same number from being worked out twice. Works with a helper or a
// self-calling fib(n) (any parameter name), a memo Map / object, a dp row, or two rolling numbers in a loop.
import { changedIdx, entriesOf, functionAt, options, row } from './util.js';

const FIB = [0, 1];
while (FIB.length < 80) FIB.push(FIB[FIB.length - 1] + FIB[FIB.length - 2]);
const MEMO = ['memo', 'cache', 'seen', 'dp', 'm', 'map', 'known', 'table'];
const IDX = ['i', 'j', 'k', 'idx', 'step', 'x'];

/** the parameter names of the function the line belongs to */
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
/** { fn, k } of the current call when it is a one-number recursive call, else null */
function callOf(lines, line, vars) {
  const [fn, args] = argsOf(lines, line);
  if (!fn || args.length !== 1 || !Number.isInteger(vars[args[0]])) return null;
  const code = (lines || []).join('\n');
  if ((code.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length < 3) return null; // header + two self-calls
  return { fn, k: vars[args[0]] };
}
const callsSelf = (src, fn) => new RegExp(`\\b${fn}\\s*\\(`).test(src || '');
const memoOf = (vars, params) => MEMO.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);
/** F(j) as this run knows it: the memo when it has j, the base cases, else the true value when it matches */
function known(vars, params, j, v, k) {
  const m = memoOf(vars, params);
  const hit = m && m.find(([key]) => Number(key) === j);
  if (hit && Number.isInteger(hit[1])) return hit[1];
  if (j < 2) return j;
  return FIB[k] === v ? FIB[j] : undefined; // shortcut: without a memo the parts are trusted only when the total is right
}
function sumNote(vars, params, k, v) {
  const a = known(vars, params, k - 1, v, k);
  const b = known(vars, params, k - 2, v, k);
  return k >= 2 && a + b === v ? `F(${k}) = F(${k - 1}) ${a} + F(${k - 2}) ${b} = ${v}` : `F(${k}) works out to ${v}`;
}
/** the step settles F(k) from its two smaller answers: { k, v } */
function settled(lines, step) {
  if (!step) return null;
  const c = callOf(lines, step.line, step.vars);
  const src = (lines || [])[step.line - 1] || '';
  if (!c || c.k < 2 || !callsSelf(src, c.fn)) return null;
  if (step.ret) return Number.isInteger(step.value) ? { k: c.k, v: step.value } : null;
  const t = (/\b(\w+)\s*=[^=]/.exec(src) || [])[1];
  return t && Number.isInteger(step.vars[t]) ? { k: c.k, v: step.vars[t] } : null;
}
const ints = (vars, skip) => Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !skip.includes(k) && !IDX.includes(k));
/** loop form: a new number made as the sum of two numbers of the previous step */
function sumStep(now, before, params) {
  for (const [t, v] of ints(now, params)) {
    if (v === before[t] || !ints(before, params).length) continue;
    if (ints(now, params).some(([k, w]) => k !== t && w === v && now[k] === before[k])) continue; // a slide copies
    const old = ints(before, params);
    for (let x = 0; x < old.length; x++) for (let y = x + 1; y < old.length; y++) if (old[x][1] + old[y][1] === v) return { v, a: Math.max(old[x][1], old[y][1]), b: Math.min(old[x][1], old[y][1]) };
  }
  return null;
}
const dpOf = (vars, params) => MEMO.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => x === null || typeof x === 'number'));

export default {
  id: 'fibonacci-number',
  metaphor: 'Each number asks the two before it',
  caption: 'F(k) asks F(k−1) and F(k−2), waits for both answers and adds them. F(0) = 0 and F(1) = 1 answer at once; the notebook (memo) keeps every answer so it is never worked out twice.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.input?.[0] ?? ctx.vars[nName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the answer: F(${n}) = ${ctx.value}`;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    if (c) {
      const { fn, k } = c;
      const s = settled(ctx.lines, ctx);
      if (s) return sumNote(ctx.vars, ctx.params, s.k, s.v);
      if (ctx.ret && Number.isInteger(ctx.value)) {
        if (k < 2) return `F(${k}) = ${ctx.value}: a base case, it answers at once`;
        if (/memo|cache|seen|known|\.get\(|\.has\(/.test(ctx.src) && !callsSelf(ctx.src, fn)) return `F(${k}) = ${ctx.value} is already in the notebook: no need to work it out again`;
        return `F(${k}) hands ${ctx.value} back up to the call that asked`;
      }
      const m = memoOf(ctx.vars, ctx.params);
      const was = memoOf(ctx.prev, ctx.params);
      if (m && was && m.length === was.length + 1) return `write F(${m[m.length - 1][0]}) = ${m[m.length - 1][1]} in the notebook`;
      const argName = argsOf(ctx.lines, ctx.line)[1][0];
      if (ctx.prev[argName] !== k || functionAt(ctx.lines, ctx.line) !== fn) {
        if (k < 2) return `call F(${k}): a base case`;
        const nx = ctx.next;
        if (nx?.ret && callOf(ctx.lines, nx.line, nx.vars)?.k === k && /memo|cache|seen|known|\.get\(|\.has\(/.test(ctx.lines[nx.line - 1] || '')) return `call F(${k}) again: check the notebook first`;
        return `call F(${k}): it needs F(${k - 1}) and F(${k - 2}) first`;
      }
      return null;
    }
    // loop forms
    const d = dpOf(ctx.vars, ctx.params);
    if (d) {
      const [name, dp] = d;
      const before = row(ctx.prev[name]);
      if (!before) return `a cell for every F(0)…F(${dp.length - 1})`;
      const ch = changedIdx(dp, before);
      if (ch.length !== 1) return null;
      const x = ch[0];
      return x >= 2 && dp[x - 1] + dp[x - 2] === dp[x] ? `F(${x}) = F(${x - 1}) ${dp[x - 1]} + F(${x - 2}) ${dp[x - 2]} = ${dp[x]}` : x < 2 ? `F(${x}) = ${dp[x]}: a base case` : null;
    }
    const s = sumStep(ctx.vars, ctx.prev, ctx.params);
    return s ? `next number = ${s.a} + ${s.b} = ${s.v}` : null;
  },
  // right before F(k) adds the two answers it got back
  predict(ctx) {
    if (!ctx.next) return null;
    let k;
    let a;
    let b;
    let v;
    const s = settled(ctx.lines, ctx.next);
    if (s) {
      ({ k, v } = s);
      a = known(ctx.next.vars, ctx.params, k - 1, v, k);
      b = known(ctx.next.vars, ctx.params, k - 2, v, k);
      if (a + b !== v) return null;
    } else {
      const d = dpOf(ctx.vars, ctx.params);
      const dn = d && row(ctx.next.vars[d[0]]);
      const ch = d && dn ? changedIdx(dn, d[1]) : [];
      if (!d && !callOf(ctx.lines, ctx.line, ctx.vars)) {
        const t = sumStep(ctx.next.vars, ctx.vars, ctx.params);
        return t ? options(`The last two numbers are ${t.a} and ${t.b}. What is the next one?`, t.v, [t.a, t.v + 1, t.a * t.b + 1].filter((x) => x !== t.v), `Each Fibonacci number is the sum of the two before it: ${t.a} + ${t.b} = ${t.v}.`) : null;
      }
      if (ch.length !== 1 || ch[0] < 2) return null;
      k = ch[0];
      [a, b, v] = [dn[k - 1], dn[k - 2], dn[k]];
      if (a + b !== v) return null;
    }
    return options(`F(${k - 1}) and F(${k - 2}) have answered. What is F(${k})?`, v, [a, v + 1, a * b + 1, v - 1].filter((x) => x !== v && x >= 0), `F(${k}) = F(${k - 1}) + F(${k - 2}) = ${a} + ${b} = ${v}.`);
  },
  bugs: [
    {
      label: 'Only one base case',
      find: 'if (k < 2) return k;',
      replace: 'if (k === 1) return 1;',
      explain: 'F(2) asks F(0), which is not a base case any more: it asks F(−1), F(−2)… and never stops, so the run blows the stack.',
    },
    {
      label: 'F(0) = 1',
      find: 'if (k < 2) return k;',
      replace: 'if (k < 2) return 1;',
      explain: 'Both base cases answer 1, so every number is shifted by one place: F(2) comes out 2 instead of 1.',
    },
  ],
};
