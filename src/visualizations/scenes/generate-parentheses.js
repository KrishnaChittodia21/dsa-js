// Generate Parentheses: writing a bracket string one character at a time under two rules: open a new pair while
// fewer than n are open, close one only while some '(' is still waiting for its ')'. Every finished string is balanced.
const PATH = ['path', 'curr', 'cur', 'current', 'str', 's', 'temp', 'tmp', 'sb', 'built', 'prefix', 'combo', 'stack', 'chars', 'word'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'list', 'combos'];

/** the string being built: a string of brackets, or an array of '(' / ')' */
function pathOf(vars, params) {
  for (const k of PATH) {
    if (params.includes(k)) continue;
    const v = vars[k];
    if (typeof v === 'string' && /^[()]*$/.test(v)) return v;
    if (Array.isArray(v) && v.every((c) => c === '(' || c === ')')) return v.join('');
  }
  return null;
}
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => typeof r === 'string'));
const count = (s, ch) => s.split(ch).length - 1;
const q = (s) => `"${s}"`;

export default {
  id: 'generate-parentheses',
  metaphor: 'Writing brackets that must close',
  caption: 'The path is the string written so far. A "(" may go in while fewer than n are open; a ")" only while some "(" is still unmatched. A string of length 2n is balanced, so it is written down, then characters are erased to try the other choice.',
  narrate(ctx) {
    const n = ctx.input?.[0];
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) {
      return `${q(res[res.length - 1])} has all ${n} pairs: balanced, record it (${res.length} found so far)`;
    }
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (p === null || before === null || !Number.isInteger(n)) return null;
    const opened = count(p, '(');
    const waiting = opened - count(p, ')');
    if (p.length === before.length + 1 && p.startsWith(before)) {
      if (p.endsWith('(')) return `open → ${q(p)}: ${opened} of ${n} "(" used, ${waiting} waiting to close`;
      return waiting >= 0 ? `close → ${q(p)}: ${waiting} "(" still waiting` : `close → ${q(p)}: more ")" than "(", this string can never balance`;
    }
    if (before.length === p.length + 1 && before.startsWith(p)) return `erase "${before[before.length - 1]}" → ${q(p)}`;
    return null;
  },
  // all n "(" are used: what goes next? / a "(" was just erased: can a ")" go in its place?
  predict(ctx) {
    if (!ctx.next) return null;
    const n = ctx.input?.[0];
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const after = pathOf(ctx.next.vars, ctx.params);
    if (p === null || before === null || after === null || !Number.isInteger(n)) return null;
    const waiting = count(p, '(') - count(p, ')');
    // a "(" was just erased: the ")" branch comes next, if it is allowed
    if (before.length === p.length + 1 && before.startsWith(p) && before.endsWith('(')) {
      const answer = after === p + ')' ? 0 : after === p || after.length < p.length ? 1 : -1;
      if (answer < 0) return null;
      return {
        question: `Every string starting ${q(p + '(')} is done and the "(" was erased. Can a ")" go ${p ? `after ${q(p)}` : 'first'} instead?`,
        options: ['Yes: write ")" and go on', 'No: this call is done, back up'],
        answer,
        explain: answer === 0 ? `${q(p)} has ${waiting} unmatched "(", so closing one is allowed.` : `${q(p)} has no unmatched "(" (close = open), so a ")" would break the balance: this call is finished.`,
      };
    }
    // the call that starts after the last "(" was written: what comes next?
    if (p === before && p === '('.repeat(n) && p.length < 2 * n) {
      const answer = after === p + ')' ? 1 : after === p + '(' ? 0 : -1;
      if (answer < 0) return null;
      return {
        question: `${q(p)} has used all ${n} "(". Which character goes next?`,
        options: ['Another "("', 'A ")"'],
        answer,
        explain: answer === 1 ? `open < n fails (${n} "(" are used), but ${waiting} "(" are waiting, so only ")" can go next until the string is full.` : 'This run opened a pair beyond n, so the string can never balance: check the open < n test.',
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Close while close < n instead of close < open',
      find: 'if (close < open) {',
      replace: 'if (close < n) {',
      explain: 'A ")" may go in even when no "(" is waiting, so unbalanced strings like "())(" are recorded.',
    },
    {
      label: 'Record at length n instead of 2n',
      find: 'if (path.length === 2 * n) {',
      replace: 'if (path.length === n) {',
      explain: 'A string is written down when it is only half as long as it should be, so the answers are unfinished strings like "((".',
    },
  ],
};
