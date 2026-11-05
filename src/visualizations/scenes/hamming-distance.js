// Hamming Distance. Two rows of light switches: XOR lights a 1 wherever the rows disagree, then the lit switches are
// counted. Kernighan's d & (d − 1) switches off the lowest lit one per round; a shift loop (d >>= 1) reads the last bit.
// The XOR value and the counter are found by shape (a new number equal to x ^ y, a number going up by 1).
import { options } from './util.js';

const COUNT = ['count', 'cnt', 'res', 'ans', 'result', 'dist', 'distance', 'total', 'c', 'diffs', 'bits', 'ones'];
const isNum = (v) => Number.isInteger(v) && v >= 0;
const len = (v) => (v > 0 ? Math.floor(Math.log2(v)) + 1 : 1);
const ones = (v) => v.toString(2).split('1').length - 1;

/** binary of every value, padded to their common width; null when too wide to read */
function bins(...vs) {
  const w = Math.max(...vs.map(len));
  return w > 16 ? null : vs.map((v) => v.toString(2).padStart(w, '0'));
}

/** [name] of a working number (not x / y, not the counter) that is new this step and equals x ^ y */
function xorName(ctx) {
  const [xn, yn] = ctx.params;
  const x = ctx.vars[xn];
  const y = ctx.vars[yn];
  if (!isNum(x) || !isNum(y)) return null;
  return Object.keys(ctx.vars).find((k) => k !== xn && k !== yn && !(k in ctx.prev) && ctx.vars[k] === (x ^ y) && !COUNT.includes(k)) || null;
}

/** name of a number that just lost its lowest 1 (d & (d − 1)) or its last bit (d >> 1) */
function shrunk(vars, prev) {
  return Object.keys(vars).find((k) => isNum(vars[k]) && isNum(prev[k]) && prev[k] > 0 && (vars[k] === (prev[k] & (prev[k] - 1)) || vars[k] === prev[k] >> 1) && vars[k] !== prev[k]) || null;
}

export default {
  id: 'hamming-distance',
  metaphor: 'Two rows of switches, count mismatches',
  caption: 'Write x and y in binary, one switch per bit. x ^ y has a 1 exactly where the switches disagree; the answer is how many 1s it has.',
  narrate(ctx) {
    const [xn, yn] = ctx.params;
    const x = ctx.vars[xn];
    const y = ctx.vars[yn];
    const dn = xorName(ctx);
    if (dn) {
      const b = bins(x, y, ctx.vars[dn]);
      // no count here: the card asked right after this step is "what is returned?"
      return b ? `${xn} = ${b[0]}, ${yn} = ${b[1]}: XOR puts a 1 wherever they disagree → ${dn} = ${b[2]}` : `${dn} = ${xn} ^ ${yn} = ${ctx.vars[dn]}: a 1 wherever the bits disagree`;
    }
    const k = shrunk(ctx.vars, ctx.prev);
    if (k && k !== xn && k !== yn) {
      const [p, v] = [ctx.prev[k], ctx.vars[k]];
      const b = isNum(x) && isNum(y) ? bins(x, y, p, v)?.slice(2) : bins(p, v); // same width as x and y
      const kern = v === (p & (p - 1)) && v !== p >> 1;
      if (!b) return kern ? `${k} & (${k} − 1) switches off the lowest lit bit: ${p} → ${v}` : null;
      return kern ? `${k} & (${k} − 1) switches off the lowest 1: ${b[0]} → ${b[1]} (one mismatch handled)` : `${k} >> 1: the last bit slides off, ${b[0]} → ${b[1]}`;
    }
    const c = COUNT.find((n) => n !== xn && n !== yn && isNum(ctx.vars[n]) && ctx.vars[n] === ctx.prev[n] + 1);
    if (c) return `${c} = ${ctx.vars[c]}: ${ctx.vars[c]} mismatched place${ctx.vars[c] === 1 ? '' : 's'} counted so far`;
    if (ctx.ret && isNum(ctx.result)) return `no lit bits left: ${xn} and ${yn} differ in ${ctx.result} place${ctx.result === 1 ? '' : 's'}`;
    return null;
  },
  // right after x ^ y: how many places differ? before d & (d − 1): which value is left?
  predict(ctx) {
    const [xn, yn] = ctx.params;
    const dn = xorName(ctx);
    if (dn) {
      const d = ctx.vars[dn];
      if (!isNum(ctx.result) || ones(d) !== ctx.result) return null; // their run counts something else: do not guess
      const b = bins(ctx.vars[xn], ctx.vars[yn], d);
      const shown = b ? `${xn} = ${b[0]}, ${yn} = ${b[1]}, so ${dn} = ${b[2]}` : `${dn} = ${d}`;
      return options(`${shown}. What will your run return?`, ctx.result, [ctx.result + 1, Math.max(0, ctx.result - 1), len(d), d].filter((v) => v !== ctx.result), `Each 1 in ${dn} is one place where ${xn} and ${yn} disagree: ${ones(d)} of them.`);
    }
    if (!ctx.next) return null;
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    if (!/-\s*1/.test(nextSrc) || !nextSrc.includes('&')) return null;
    const k = Object.keys(ctx.vars).find((n) => n !== xn && n !== yn && isNum(ctx.vars[n]) && ctx.vars[n] > 0 && ctx.next.vars[n] === (ctx.vars[n] & (ctx.vars[n] - 1)));
    if (!k) return null;
    const d = ctx.vars[k];
    const w = len(d);
    if (w > 16) return null;
    const fmt = (v) => v.toString(2).padStart(w, '0');
    const after = d & (d - 1);
    const high = d ^ (1 << (w - 1));
    return options(`${k} = ${fmt(d)}. Which value does ${k} & (${k} − 1) leave?`, fmt(after), [fmt(high), fmt(d >> 1), fmt(0)], `${k} − 1 turns the lowest 1 into 0 and the 0s below it into 1s; AND keeps only what both share, so exactly the lowest 1 goes: ${fmt(d)} → ${fmt(after)}.`);
  },
  bugs: [
    {
      label: 'AND instead of XOR',
      find: 'x ^ y',
      replace: 'x & y',
      explain: 'x & y marks places where both bits are 1, not where they differ: 1 = 001 and 4 = 100 share nothing, so it counts 0 instead of 2.',
    },
    {
      label: 'Shift instead of clearing the lowest 1',
      find: 'd &= d - 1',
      replace: 'd >>= 1',
      explain: 'Shifting runs once per bit position, not once per 1: for d = 101 the loop counts 3 rounds instead of 2 differences.',
    },
  ],
};
