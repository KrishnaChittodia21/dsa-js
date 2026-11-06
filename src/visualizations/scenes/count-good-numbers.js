// Count Good Numbers: even spots take one of 5 even digits, odd spots one of 4 prime digits, so the answer is
// 5^⌈n/2⌉ · 4^⌊n/2⌋ mod 10^9+7. Fast power halves the exponent each call: x^e = (x^⌊e/2⌋)² (· x when e is odd).
// Works with a recursive power helper (BigInt or Number), or a loop that squares the base and halves the exponent.
import { functionAt, options } from './util.js';

const MOD = 1000000007n;
/** a whole number as a BigInt: plain integers and BigInt snapshots ({ $text: '25n' }) */
function big(v) {
  if (Number.isInteger(v)) return BigInt(v);
  const m = v && typeof v.$text === 'string' && /^(-?\d+)n?$/.exec(v.$text);
  return m ? BigInt(m[1]) : null;
}
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
/** the current call of a recursive power helper: { fn, b, e, bName, eName } */
function powCall(lines, line, vars) {
  const [fn, args] = argsOf(lines, line);
  if (!fn || args.length < 2) return null;
  const code = (lines || []).join('\n');
  if ((code.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length < 3) return null; // header, a self-call, an outside call
  const b = big(vars[args[0]]);
  const e = big(vars[args[1]]);
  return b === null || e === null ? null : { fn, b, e, bName: args[0], eName: args[1] };
}
const bigs = (vars, skip) => Object.entries(vars).map(([k, v]) => [k, big(v)]).filter(([k, v]) => v !== null && !skip.includes(k) && v !== MOD);
/** the line squares a value (`h * h`, `b = b * b % M`): { t, x, v } read from the line and the two steps */
function squared(src, now, before) {
  const t = (/\b(\w+)\s*=[^=]/.exec(src || '') || [])[1];
  const m = /\b(\w+)\s*\*\s*\1\b/.exec(src || '');
  if (!t || !m) return null;
  const v = big(now[t]);
  const x = m[1] === t ? big(before[t]) : big(now[m[1]]);
  return v !== null && x !== null && (x * x) % MOD === v ? { t, x, v } : null;
}
const sup = (e) => `^${e}`;
/** the line folds one more factor into a value (`r = (r * x) % M`): { a, y, v } */
function folded(src, now, before) {
  const t = (/\b(\w+)\s*=[^=]/.exec(src || '') || [])[1];
  const m = t && new RegExp(`\\b${t}\\s*\\*\\s*(\\w+)|\\b(\\w+)\\s*\\*\\s*${t}\\b`).exec(src);
  const yName = m && (m[1] || m[2]);
  if (!yName || yName === t) return null;
  const a = big(before[t]);
  const y = big(now[yName]);
  const v = big(now[t]);
  return a !== null && y !== null && v !== null && (a * y) % MOD === v ? { a, y, v } : null;
}

export default {
  id: 'count-good-numbers',
  metaphor: 'Halving the power, squaring the answer',
  caption: 'Every even spot has 5 digit choices and every odd spot 4, so the count is 5^evens × 4^odds. Each power is found by asking for the power of half the size and squaring it.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.input?.[0] ?? ctx.vars[nName];
    if (ctx.ret && !ctx.next) {
      const v = big(ctx.value);
      return v === null ? null : `${v} good digit strings of length ${n}${n > 13 ? ' (counted mod 10⁹+7)' : ''}`;
    }
    const c = powCall(ctx.lines, ctx.line, ctx.vars);
    if (c) {
      const { b, e } = c;
      const v = big(ctx.value);
      if (ctx.ret && v !== null) {
        if (e === 0n) return `${b}${sup(0)} = ${v}: no factors left, the bottom of the halving`;
        if (e % 2n === 1n && bigs(ctx.vars, [c.bName, c.eName]).some(([k, x]) => x === v && big(ctx.prev[k]) === v)) return `${b}${sup(e)} = ${v} goes back up to the call that asked`;
        const sq = bigs(ctx.vars, [c.bName, c.eName]).find(([, x]) => x !== v && (x * b) % MOD === v);
        if (e % 2n === 1n && sq) return `power ${e} is odd: one extra ${b} → ${sq[1]} × ${b} = ${v} = ${b}${sup(e)}`;
        if (e % 2n === 0n) return `power ${e} is even: the square is already ${b}${sup(e)} = ${v}`;
        return `${b}${sup(e)} = ${v}`;
      }
      const s = squared(ctx.src, ctx.vars, ctx.prev);
      if (s) return `square it: ${s.x} × ${s.x} = ${s.v} = ${b}${sup((e / 2n) * 2n)}`;
      const f = folded(ctx.src, ctx.vars, ctx.prev);
      if (f) return `power ${e} is odd: one extra ${b} → ${f.a} × ${f.y} = ${f.v} = ${b}${sup(e)}`;
      const t = (/\b(\w+)\s*=[^=]/.exec(ctx.src || '') || [])[1];
      const h = t && big(ctx.vars[t]);
      if (h !== null && h !== undefined && new RegExp(`\\b${c.fn}\\s*\\(`).test(ctx.src)) return `${b}${sup(e / 2n)} came back: ${h}`;
      const was = powCall(ctx.lines, ctx.line, ctx.prev);
      if (!was || was.e !== e || was.b !== b) return e === 0n ? `${b}${sup(0)}: nothing left to multiply` : `work out ${b}${sup(e)}: first ask for ${b}${sup(e / 2n)} (half the power, rounded down)`;
      return null;
    }
    // slot counts (by name, else by value when n is odd)
    for (const [k, v] of bigs(ctx.vars, ctx.params)) {
      if (k in ctx.prev || !Number.isInteger(n) || !new RegExp(`\\b${k}\\s*=[^=]`).test(ctx.src || '')) continue;
      const ev = BigInt(Math.ceil(n / 2));
      const od = BigInt(Math.floor(n / 2));
      if (v === ev && (/even|ev/i.test(k) || (n % 2 && !/odd|prime/i.test(k)))) return `${n} digits: ${v} even spots (0, 2, …), each takes one of 5 even digits (0 2 4 6 8)`;
      if (v === od && (/odd|prime/i.test(k) || n % 2)) return `${v} odd spots (1, 3, …), each takes one of 4 prime digits (2 3 5 7)`;
    }
    // loop form of fast power: square the base, halve the exponent, fold odd bits into the result
    const s = squared(ctx.src, ctx.vars, ctx.prev);
    if (s) return `square the base: ${s.x} × ${s.x} = ${s.v}`;
    const f = folded(ctx.src, ctx.vars, ctx.prev);
    if (f) return `the power is odd: fold one ${f.y} into the result → ${f.a} × ${f.y} = ${f.v}`;
    for (const [k, v] of bigs(ctx.vars, ctx.params)) {
      const was = big(ctx.prev[k]);
      if (was !== null && was >= 1n && v === was / 2n && /\/\s*2|>>/.test(ctx.src || '')) return v ? `halve the power: ${was} → ${v}` : `halve the power: ${was} → 0, nothing left`;
    }
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const c = powCall(ctx.lines, ctx.line, ctx.vars);
    const d = powCall(ctx.lines, nx.line, nx.vars);
    if (!c || !d || d.fn !== c.fn || d.b !== c.b) return null;
    // the outermost call is about to ask for a smaller power
    if (!nx.ret && !powCall(ctx.lines, ctx.line, ctx.prev) && d.e < c.e && c.e >= 2n && functionAt(ctx.lines, ctx.line) === c.fn) {
      const right = `${c.b}${sup(d.e)}`;
      return options(`To get ${c.b}${sup(c.e)}, which power does this call ask for first?`, right, [`${c.b}${sup(c.e - 1n)}`, `${c.b}${sup(c.e / 2n + 1n)}`, `${c.b}${sup(c.e)}`].filter((x) => x !== right), `It halves the exponent and rounds down: ⌊${c.e}/2⌋ = ${d.e}. Squaring ${right} gives back (almost) ${c.b}${sup(c.e)}.`);
    }
    // just before a call with a real exponent returns
    const v = big(nx.value);
    if (!nx.ret || v === null || d.e !== c.e || c.e < 2n) return null;
    const sq = squared(ctx.src, ctx.vars, ctx.prev);
    if (!sq) return null;
    const odd = c.e % 2n === 1n;
    return options(`The square is ${sq.v} and the power is ${c.e}. What does ${c.b}${sup(c.e)} return?`, v, [sq.v, (sq.v * c.b * c.b) % MOD, odd ? sq.v * 2n : (sq.v * c.b) % MOD].filter((x) => x !== v), odd ? `${c.e} is odd, so the square covers only ${c.e - 1n} factors: one more ${c.b} gives ${sq.v} × ${c.b} = ${v}.` : `${c.e} is even, so the square already is ${c.b}${sup(c.e)} = ${v}.`);
  },
  bugs: [
    {
      label: 'Swap the even and odd spot counts',
      find: 'const evenSlots = (N + 1n) / 2n;',
      replace: 'const evenSlots = N / 2n;',
      explain: 'Even spots are 0, 2, 4…, so for odd n there is one more even spot than odd. Rounding down gives 5 · 4 · 4 = 80 for n = 3 instead of 100.',
    },
    {
      label: 'Forget the extra factor for odd powers',
      find: 'return exp % 2n === 0n ? sq : (sq * base) % MOD;',
      replace: 'return sq;',
      explain: 'Halving 3 gives 1, and squaring 5¹ only covers 5²: one factor of 5 is lost every time the power is odd, so n = 1 gives 1 instead of 5.',
    },
  ],
};
