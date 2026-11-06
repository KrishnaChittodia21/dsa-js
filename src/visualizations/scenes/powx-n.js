// Scene: Pow(x, n), fast power. x^10 = (x^5)², x^5 = (x^2)² · x: each call halves the exponent, so 2^31 needs
// ~31 calls, not 2 billion multiplications. A negative n first turns into (1/x)^|n|. Works with a helper on the
// exponent or myPow calling itself (any names): the exponent and the "half" are found from the halving call.
import { options } from './util.js';

const fmt = (v) => (typeof v !== 'number' ? String(v) : Number.isInteger(v) ? String(v) : String(+v.toPrecision(6)));
const near = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** the exponent name: the variable halved in the code (`e / 2`, `Math.floor(n / 2)`, `n >> 1`) */
function expName(lines) {
  const m = /\b([A-Za-z_$][\w$]*)\s*(?:\/\s*2\b|>>>?\s*1\b)/.exec((lines || []).join('\n'));
  return m ? m[1] : null;
}
/** the variable that receives the half power: `const half = pow(… / 2 …)` */
function halfName(lines) {
  const m = /\b([A-Za-z_$][\w$]*)\s*=\s*(?!Math\.)[A-Za-z_$][\w$.]*\s*\([^;]*(?:\/\s*2\b|>>>?\s*1\b)/.exec((lines || []).join('\n'));
  return m && m[1] !== expName(lines) ? m[1] : null;
}

export default {
  id: 'powx-n',
  metaphor: 'Squaring your way up the exponent',
  caption: 'Each call halves the exponent and waits for the half power. Coming back up it squares that answer, and multiplies one extra x when the exponent was odd.',
  narrate(ctx) {
    const [xName, nName] = ctx.params;
    const x = ctx.vars[xName];
    const eName = expName(ctx.lines);
    const hName = halfName(ctx.lines);
    const e = eName ? ctx.vars[eName] : undefined;
    const h = hName ? ctx.vars[hName] : undefined;
    const [x0, n0] = ctx.input || [];
    if (ctx.ret && typeof ctx.value === 'number') {
      if (!ctx.next) return `${typeof x0 === 'number' && x0 < 0 ? `(${fmt(x0)})` : fmt(x0)}^${fmt(n0)} = ${fmt(ctx.value)}`;
      if (e === 0 && ctx.value === 1) return `x^0 = 1: the exponent ran out, the answers start climbing back up`;
      if (Number.isInteger(e) && typeof h === 'number' && typeof x === 'number') {
        const half = Math.floor(e / 2);
        if (e % 2 === 0 && near(h * h, ctx.value)) return `x^${e} = (x^${half})² = ${fmt(h)} × ${fmt(h)} = ${fmt(ctx.value)}`;
        if (e % 2 !== 0 && near(h * h * x, ctx.value)) return `${e} is odd: x^${e} = (x^${half})² · x = ${fmt(h)} × ${fmt(h)} × ${fmt(x)} = ${fmt(ctx.value)}`;
      }
      return null;
    }
    // a negative exponent: flip the base, then the sign
    const xWas = xName in ctx.prev ? ctx.prev[xName] : x0;
    if (typeof x === 'number' && typeof xWas === 'number' && x !== xWas && near(x * xWas, 1) && n0 < 0) {
      return `negative power: x^${fmt(n0)} = (1/x)^${fmt(-n0)}, so the base becomes 1/${fmt(xWas)} = ${fmt(x)}`;
    }
    const nNow = ctx.vars[nName];
    if (Number.isInteger(nNow) && nNow > 0 && (nName in ctx.prev ? ctx.prev[nName] : n0) === -nNow) {
      return typeof x === 'number' && x !== x0 ? `…and the exponent turns positive: ${nNow}` : `negative power: x^${-nNow} = 1 / x^${nNow}, so work out x^${nNow} first`;
    }
    // a half power just came back
    if (hName && typeof h === 'number' && h !== ctx.prev[hName] && Number.isInteger(e)) {
      return `x^${e} hears back: x^${Math.floor(e / 2)} = ${fmt(h)}`;
    }
    // loop form (no half-power call): square the base, fold it in on a 1-bit, drop a bit
    if (!hName) {
      const sq = /\b([A-Za-z_$][\w$]*)\s*(?:\*=\s*\1\b|=\s*\1\s*\*\s*\1\b)/.exec(ctx.src || '');
      const mul = /\b([A-Za-z_$][\w$]*)\s*\*=\s*([A-Za-z_$][\w$]*)/.exec(ctx.src || '');
      if (sq && typeof ctx.vars[sq[1]] === 'number' && typeof ctx.prev[sq[1]] === 'number') return `square the running power: ${fmt(ctx.prev[sq[1]])}² = ${fmt(ctx.vars[sq[1]])}`;
      if (mul && mul[1] !== mul[2] && typeof ctx.vars[mul[1]] === 'number' && ctx.vars[mul[1]] !== ctx.prev[mul[1]]) return `the lowest bit of the exponent is 1: multiply ${fmt(ctx.vars[mul[2]])} into the answer → ${fmt(ctx.vars[mul[1]])}`;
      const was = ctx.prev[eName];
      if (Number.isInteger(e) && Number.isInteger(was) && e === Math.floor(was / 2) && e !== was) return `drop the exponent's lowest bit: ${was} (binary ${was.toString(2)}) → ${e}${e > 0 ? ` (binary ${e.toString(2)})` : ''}`;
      return null;
    }
    // a new call with a halved exponent
    if (Number.isInteger(e)) {
      const was = ctx.prev[eName];
      if (Number.isInteger(was) && e === Math.floor(was / 2) && e !== was) {
        return e === 0 ? `x^1 = (x^0)² · x: ask for x^0` : `x^${was} needs x^${e} first (${was} = ${e} + ${e}${was % 2 ? ' + 1' : ''})`;
      }
      if (!(eName in ctx.prev) && e > 0) return `compute x^${e} with x = ${fmt(x)}: halve the exponent first`;
    }
    return null;
  },
  // the half power is back: what does this call return?
  predict(ctx) {
    const nx = ctx.next;
    const [xName] = ctx.params;
    const eName = expName(ctx.lines);
    const hName = halfName(ctx.lines);
    if (!nx || !nx.ret || typeof nx.value !== 'number' || !eName || !hName || ctx.ret) return null;
    const e = ctx.vars[eName];
    const h = ctx.vars[hName];
    const x = ctx.vars[xName];
    if (!Number.isInteger(e) || e < 2 || nx.vars[eName] !== e || typeof h !== 'number' || typeof x !== 'number') return null;
    const v = nx.value;
    const odd = e % 2 !== 0;
    return options(
      `x = ${fmt(x)}, and x^${Math.floor(e / 2)} came back as ${fmt(h)}. What does x^${e} return?`,
      fmt(v),
      [fmt(odd ? h * h : h * h * x), fmt(h * 2), fmt(h * x)].filter((w) => w !== fmt(v)),
      odd ? `${e} is odd: square the half power and multiply one more x: ${fmt(h)} × ${fmt(h)} × ${fmt(x)} = ${fmt(v)}.` : `${e} is even: just square the half power: ${fmt(h)} × ${fmt(h)} = ${fmt(v)}.`,
    );
  },
  bugs: [
    {
      label: 'Forget the extra x on odd exponents',
      find: 'half * half : half * half * x',
      replace: 'half * half : half * half',
      explain: '(x^2)² is x^4, not x^5: every odd exponent loses one factor of x, so 2^10 comes out as 2^8 = 256.',
    },
    {
      label: 'Ignore the negative exponent',
      find: 'x = 1 / x;',
      replace: '',
      explain: 'n turns positive but the base stays x, so 2^−2 returns 2² = 4 instead of 1/4.',
    },
  ],
};
