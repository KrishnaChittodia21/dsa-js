// Scene: Power of Two. In binary a power of two is a single 1 followed by 0s; halving drops one trailing 0.
// Keep halving: reach 1 → yes; hit an odd number above 1 (a stray 1-bit) → no. Works with the recursive
// "halve and trust" form (answers passed back up), a halving loop, and the one-line bit trick n & (n − 1).
import { functionAt, options } from './util.js';

const bin = (n) => (Number.isInteger(n) && n > 0 ? ` (binary ${n.toString(2)})` : '');
/** true when this return line hands back a deeper call's answer (`return f(n / 2)`) */
function passesUp(ctx) {
  const fn = functionAt(ctx.lines || [], ctx.line);
  return !!fn && new RegExp(`\\b${fn}\\s*\\(`).test(ctx.src || '');
}
function recursive(lines) {
  const code = (lines || []).join('\n');
  const names = [...code.matchAll(/function\s+(\w+)|(\w+)\s*=\s*(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/g)].map((m) => m[1] || m[2]);
  return names.some((n) => (code.match(new RegExp(`\\b${n}\\s*\\(`, 'g')) || []).length >= 2);
}
/** why a stop says yes / no, from the number it stopped at */
function verdict(n, yes) {
  if (!Number.isInteger(n)) return null;
  if (n <= 0) return `${n} is not positive: no power of two is 0 or negative, so the answer is false`;
  if (n === 1 && yes) return 'reached 1 = 2^0 (binary 1): only the leading 1-bit was left, so true';
  if (n % 2 !== 0 && !yes) return `${n}${bin(n)} is odd and above 1: it has a stray 1-bit, so false`;
  return null;
}

export default {
  id: 'power-of-two',
  metaphor: 'Halving a number down to 1',
  caption: 'In binary a power of two is one 1 followed by 0s. Each halving drops a trailing 0; landing on 1 means yes, an odd number above 1 means a stray 1-bit, so no.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (passesUp(ctx)) return `the call for ${n}${bin(n)} passes its half's answer back up: ${ctx.value}`;
      if (!ctx.next && /&/.test(ctx.src || '') && Number.isInteger(ctx.input?.[0])) {
        const m = ctx.input[0];
        return m > 0 ? `${m}${bin(m)} & ${m - 1}${bin(m - 1)} = ${m & (m - 1)}: ${ctx.value ? 'one single 1-bit, so true' : 'more than one 1-bit, so false'}` : `${m} is not positive, so false`;
      }
      return verdict(n, ctx.value) || (ctx.next ? null : `the answer: ${ctx.value}`);
    }
    if (!Number.isInteger(n)) return null;
    if (ctx.index === 0 || !(nName in ctx.prev)) return `is ${n}${bin(n)} a power of two? It must be a single 1 followed only by 0s`;
    const was = ctx.prev[nName];
    if (Number.isInteger(was) && was > 0 && n * 2 === was) return `${was} is even, so halve it: ${was}${bin(was)} → ${n}${bin(n)}, one trailing 0 dropped`;
    return null;
  },
  predict(ctx) {
    const [nName] = ctx.params;
    const nx = ctx.next;
    if (!nx || !nx.ret || typeof nx.value !== 'boolean' || !Number.isInteger(nx.vars[nName])) return null;
    const m = nx.vars[nName];
    // the deepest call is about to stop
    if (!ctx.ret && m === ctx.vars[nName]) {
      return options(`The halving reached ${m}${bin(m)}. ${recursive(ctx.lines) ? 'What does this call answer?' : 'What is the answer?'}`, nx.value, [!nx.value], verdict(m, nx.value) || `This call answers ${nx.value}.`);
    }
    // the first answer travels up one level
    if (ctx.ret && !passesUp(ctx) && m !== ctx.vars[nName] && typeof ctx.value === 'boolean') {
      return options(`The call for ${ctx.vars[nName]} answered ${ctx.value}. What does the call for ${m} return?`, nx.value, [!nx.value], `${m} is a power of two exactly when its half ${ctx.vars[nName]} is, so it passes the same answer up: ${nx.value}.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Let 0 through the first check',
      find: 'if (n <= 0) return false;',
      replace: 'if (n < 0) return false;',
      explain: '0 is even and 0 / 2 is 0 again, so isPowerOfTwo(0) halves forever and never reaches a base case.',
    },
  ],
};
