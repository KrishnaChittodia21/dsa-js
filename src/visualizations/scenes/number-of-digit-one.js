// Number of Digit One: count the 1s one decimal place at a time. At place p the digit runs 0…9 over and over, each
// full cycle of 10·p numbers shows a 1 there p times, and the last, partial cycle adds p, low + 1 or nothing.
// Works with any loop over the place value (p, place, factor …); a digit-DP solution falls back to the generic notes.
import { options } from './util.js';

const PLACE = ['p', 'place', 'factor', 'pos', 'base', 'pow', 'power', 'unit', 'div', 'd', 'm', 'mul', 'i', 'k', 'f', 'b', 'digit'];
const COUNT = ['count', 'ones', 'total', 'res', 'result', 'ans', 'answer', 'sum', 'cnt', 'c'];
const NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions', 'ten-millions', 'hundred-millions', 'billions'];

const isPow10 = (x) => Number.isInteger(x) && x >= 1 && /^10*$/.test(String(x));
const placeName = (p) => `${NAMES[String(p).length - 1] || `10^${String(p).length - 1}`} place`;
/** [name, value] of the place-value variable: the first listed name that holds a power of ten up to 10·n */
function placeOf(vars, n) {
  const k = PLACE.find((x) => isPow10(vars[x]) && vars[x] <= 10 * Math.max(1, n));
  return k ? [k, vars[k]] : [];
}
/** the running count: a listed name holding an integer */
const countOf = (vars) => COUNT.find((x) => Number.isInteger(vars[x]));
/** high | digit | low of n at place p */
const split = (n, p) => ({ high: Math.floor(n / (p * 10)), cur: Math.floor(n / p) % 10, low: n % p });
const ones = (x) => `${x} one${x === 1 ? '' : 's'}`;

/** what one change of the count means at place p: full cycles, the partial cycle, or both at once */
function explainAdd(n, p, d, src) {
  const { high, cur, low } = split(n, p);
  const full = high * p;
  const part = cur > 1 ? p : cur === 1 ? low + 1 : 0;
  const cyc = `${high} full cycle${high === 1 ? '' : 's'} of 0–9`;
  // equal sizes: a product on the line means the full cycles
  const isFull = d === full && (d !== part || /\*/.test(src || ''));
  if (isFull) return high === 0 ? `${placeName(p)}: no full cycle of 0–9 has passed yet (+0)` : `${placeName(p)}: ${cyc}, each shows a 1 there ${p}× → +${full}`;
  if (d === part && cur > 1) return `${placeName(p)}: digit ${cur} > 1, so the last cycle passed its whole block of ${ones(p)} → +${p}`;
  if (d === part && cur === 1) return `${placeName(p)}: digit is 1, so only part of the last block: low ${low} + 1 → +${low + 1}`;
  if (d === full + part) return `${placeName(p)}: ${cyc} → ${full}, plus ${part} in the partial one → +${d}`;
  return null;
}

export default {
  id: 'number-of-digit-one',
  metaphor: 'An odometer counting its own 1s',
  caption: 'Count one decimal place at a time. At place p the digit cycles 0…9, showing a 1 for p numbers in every full cycle; the last, unfinished cycle adds all p, only low + 1, or nothing, depending on the digit there.',
  narrate(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (!Number.isInteger(n)) return null;
    if (ctx.ret && Number.isInteger(ctx.value)) return `writing every number from 0 to ${n} uses the digit 1 ${ctx.value} time${ctx.value === 1 ? '' : 's'}`;
    const [pName, p] = placeOf(ctx.vars, n);
    if (!pName) return null;
    const cName = countOf(ctx.vars);
    const c = cName && ctx.vars[cName];
    const was = cName && ctx.prev[cName];
    if (cName && Number.isInteger(was) && c !== was) {
      const why = explainAdd(n, p, c - was, ctx.src);
      return why && `${why} (total ${c})`;
    }
    // a new place starts: show how n splits around it
    if (p !== ctx.prev[pName] && p <= n) {
      const { high, cur, low } = split(n, p);
      return `${placeName(p)} of ${n}: the digit there is ${cur}, with ${high} to its left and ${p > 1 ? low : 'nothing'} to its right`;
    }
    // a statement in an add's body that left the count as it was
    if (cName && /\+=/.test(ctx.src) && c === was) {
      const { high } = split(n, p);
      return high === 0 ? `${placeName(p)}: no full cycle of 0–9 has passed yet (+0)` : null;
    }
    return null;
  },
  // right after the full cycles are counted: what does the last, partial cycle add?
  predict(ctx) {
    if (!ctx.next) return null;
    const n = ctx.vars[ctx.params[0]];
    if (!Number.isInteger(n)) return null;
    const [pName, p] = placeOf(ctx.vars, n);
    const cName = countOf(ctx.vars);
    if (!pName || !cName || !Number.isInteger(ctx.prev[cName]) || !Number.isInteger(ctx.next.vars[cName])) return null;
    const { high, cur, low } = split(n, p);
    // this step counted exactly the full cycles (also when that is +0)
    if (ctx.vars[cName] - ctx.prev[cName] !== high * p || !/\+=/.test(ctx.src) || !/\*/.test(ctx.src)) return null;
    const nextP = ctx.next.vars[pName];
    const d = ctx.next.vars[cName] - ctx.vars[cName];
    let got;
    if (nextP === p && !ctx.next.ret && d > 0) got = d; // the partial cycle's add
    else if ((nextP !== p || ctx.next.ret) && d === 0) got = 0; // no add: the digit is 0
    else return null;
    return options(
      `${placeName(p)}: the digit there is ${cur} and ${low} sits to its right. How many 1s does the last, unfinished cycle add?`,
      got,
      [p, low + 1, 0, low].filter((w) => w !== got),
      cur > 1 ? `Digit ${cur} is past 1, so the whole block of ${ones(p)} (…1${'0'.repeat(String(p).length - 1)} to …1${'9'.repeat(String(p).length - 1)}) was written.` : cur === 1 ? `Digit 1: the block has started but not finished, so only the numbers with low = 0…${low} count: ${low + 1}.` : 'Digit 0: the block of 1s in this cycle has not been reached yet, so nothing is added.',
    );
  },
  bugs: [
    {
      label: 'Add a whole block when the digit is 1',
      find: 'else if (cur === 1) count += low + 1;',
      replace: 'else if (cur === 1) count += p;',
      explain: 'When the digit there is 1 the block of 1s is only partly written (up to n), so adding all p overcounts: 13 gives 12 instead of 6.',
    },
    {
      label: 'Stop the place loop one place early',
      find: 'p <= n',
      replace: 'p < n',
      explain: 'For n = 10 or 100 the leading 1 sits at a place equal to n, so that place is never counted and the 1s it writes are lost.',
    },
  ],
};
