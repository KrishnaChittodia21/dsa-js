// Find First and Last Position: a run of equal books on a sorted shelf. Two binary searches find the bookends: the
// first copy, and the first book past the run (or the last copy). Works with lo/hi, left/right, l/r, low/high, mid / m,
// a helper with its own search value (x, t, val…) or the target itself, and first/last-like result names.
import { firstInt, row, sorted } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
];
const MID = ['mid', 'm', 'middle'];
const SOUGHT = ['x', 't', 'val', 'value', 'key', 'goal'];
const FIRST = ['first', 'firstPos', 'start', 'lower', 'lb', 'begin', 'startIdx'];
const LAST = ['last', 'lastPos', 'end', 'upper', 'ub', 'endIdx'];
const FOUND = ['ans', 'res', 'idx', 'pos', 'found', 'result'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
/** the value this search looks for: a helper's own argument, else the target */
const soughtOf = (ctx) => {
  const n = SOUGHT.find((k) => !ctx.params.includes(k) && Number.isFinite(ctx.vars[k]));
  return n ? ctx.vars[n] : ctx.vars[ctx.params[1]];
};
/** [name, row] of the shelf: the first parameter, or (when a run starts inside a helper and the names cannot be
 * mapped) the first sorted array in sight */
const shelfOf = (ctx) => {
  const p = ctx.params[0];
  if (row(ctx.vars[p])) return [p, ctx.vars[p]];
  return Object.entries(ctx.vars).find(([, v]) => sorted(v)) || [p, null];
};

export default {
  id: 'find-first-and-last-position-of-element-in-sorted-array',
  metaphor: 'Bookends around a run of equal books',
  caption: 'The shelf is sorted, so all copies of the target stand together. One search finds the left bookend (the first copy), a second finds the right one; the bracket is the part of the shelf still in question.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  compare: 'mid',
  narrate(ctx) {
    const [aName, a] = shelfOf(ctx);
    const t = soughtOf(ctx);
    if (!a) return null;
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (mName && pair && m !== ctx.prev[mName] && m >= 0 && m < a.length) {
      // no verdict: the prediction right after asks which half goes
      return `pull out the middle book: ${aName}[${m}] = ${a[m]}, looking for ${soughtOf(ctx)}`;
    }
    if (pair && mName) {
      const [loName, hiName] = pair;
      const lo = ctx.vars[loName];
      const hi = ctx.vars[hiName];
      const [fdName, fd] = firstInt(ctx.vars, FOUND);
      if (fdName && fd !== ctx.prev[fdName] && fd >= 0 && a[fd] === t) return `found ${t} at index ${fd}: remember it, then keep looking for the end of the run`;
      if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return null;
      if (lo > hi) return `${loName} passed ${hiName}: nothing left to check, this search is over`;
      if (lo !== ctx.prev[loName]) return `${a[m]} at index ${m}: drop it and everything left of it (keep ${lo}…${hi})`;
      if (hi !== ctx.prev[hiName]) return `${a[m]} at index ${m}: drop everything right of it (keep ${lo}…${hi})`;
      return null;
    }
    // results, once no search is running
    const [fName, f] = firstInt(ctx.vars, FIRST);
    const [lName, l] = firstInt(ctx.vars, LAST);
    if (lName && l !== ctx.prev[lName]) return l >= 0 && a[l] === t ? `right bookend: the last ${t} stands at index ${l}` : null;
    if (fName && f !== ctx.prev[fName]) {
      if (f >= 0 && a[f] === t) return `left bookend: the first ${t} stands at index ${f}`;
      if (f === -1) return `no copy of ${t} was found: ${t} is not on the shelf`;
      if (!a.length) return `the shelf is empty: ${t} is not on it`;
      return f === a.length ? `every book is smaller than ${t}: ${t} is not on the shelf` : `the first book ≥ ${t} is ${a[f]} at index ${f}, not ${t}: ${t} is not on the shelf`;
    }
    return null;
  },
  // right after a new middle: which half goes?
  predict(ctx) {
    const [, a] = shelfOf(ctx);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next || m < 0 || m >= a.length) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const up = nx[loName] > lo && nx[hiName] === hi;
    const down = nx[hiName] < hi && nx[loName] === lo;
    if (up === down) return null;
    const x = soughtOf(ctx);
    const why =
      a[m] < x ? `${a[m]} < ${x}: every book up to index ${m} is too small.`
      : a[m] > x ? `${a[m]} > ${x}: every book from index ${m} on is too big.`
      : `${a[m]} equals ${x}, but this search wants the ${up ? 'last' : 'first'} copy, so it keeps looking ${up ? 'right' : 'left'}.`;
    return {
      question: `The middle book is ${a[m]} (index ${m}), looking for ${x}. Which part of the shelf is dropped?`,
      options: [`The left part: ${loName} moves up`, `The right part: ${hiName} moves down`],
      answer: up ? 0 : 1,
      explain: why,
    };
  },
  bugs: [
    {
      label: 'nums[mid] > x: skip past the first copy',
      find: 'nums[mid] >= x',
      replace: 'nums[mid] > x',
      explain: 'The search now finds the first book bigger than the target, which sits after the run, so the first copy is never found and the answer is [-1, -1].',
    },
    {
      label: 'Forget the − 1 on the right bookend',
      find: 'firstAtLeast(target + 1) - 1',
      replace: 'firstAtLeast(target + 1)',
      explain: 'The second search lands on the first book past the run. Without stepping back one, the last position is one too far right.',
    },
  ],
};
