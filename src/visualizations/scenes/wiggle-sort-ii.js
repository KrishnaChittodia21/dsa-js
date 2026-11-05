// Wiggle Sort II (quickselect median + 3-way partition over virtual indices). A mountain ridge: odd slots are
// peaks, even slots are valleys. First find the median height; then big numbers go to the peaks (slots 1, 3, 5, …),
// small ones to the valleys from the back, and median copies fill the gap between them.
// The reference picks a random pivot, so phase 1 is narrated but never asked about.
import { firstInt, row } from './util.js';

const MED = ['median', 'med'];
const LEFT = ['left', 'l', 'big', 'large', 'lt'];
const CUR = ['cur', 'curr', 'i', 'current', 'mid'];
const RIGHT = ['right', 'r', 'small', 'gt'];

const medOf = (vars) => MED.find((k) => typeof vars[k] === 'number');
/** [left, cur, right] names of the wiggle pass (only once the median is known) */
function ptrs(vars, med) {
  const c = CUR.find((k) => k !== med && Number.isInteger(vars[k]));
  const l = LEFT.find((k) => k !== c && Number.isInteger(vars[k]));
  const r = RIGHT.find((k) => k !== c && k !== l && Number.isInteger(vars[k]));
  return c && l && r ? [l, c, r] : null;
}

export default {
  id: 'wiggle-sort-ii',
  metaphor: 'Peaks and valleys of a mountain ridge',
  caption: 'Odd slots are peaks, even slots valleys. Numbers above the median climb to the peaks, numbers below it sink to the valleys (from the back), and median copies end up far apart in between.',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    if (!a) return null;
    const med = medOf(ctx.vars);
    if (med && typeof ctx.prev[med] !== 'number') return `the median is ${ctx.vars[med]}: half the numbers are ≤ it, half ≥ it; now build the ridge`;
    if (!med) {
      const [pName, p] = firstInt(ctx.vars, ['pivot', 'pv']);
      if (pName && new RegExp(`\\b${pName}\\s*=[^=]`).test(ctx.src)) return `finding the median: try pivot ${p} and split the numbers into < ${p}, = ${p}, > ${p}`;
      const k = ctx.vars.k;
      for (const [lo, hi] of [['lo', 'hi'], ['left', 'right'], ['l', 'r']]) {
        if (!Number.isInteger(ctx.vars[lo]) || !Number.isInteger(ctx.vars[hi]) || !(lo in ctx.prev) || !Number.isInteger(k) || !Number.isInteger(ctx.prev.gt ?? ctx.prev[hi])) continue;
        if (ctx.vars[hi] < ctx.prev[hi]) return `the median slot ${k} is left of the pivot block: keep searching slots ${ctx.vars[lo]}..${ctx.vars[hi]}`;
        if (ctx.vars[lo] > ctx.prev[lo]) return `the median slot ${k} is right of the pivot block: keep searching slots ${ctx.vars[lo]}..${ctx.vars[hi]}`;
      }
      return null;
    }
    const m = ctx.vars[med];
    const p = ptrs(ctx.vars, med);
    if (!p || !p.every((x) => x in ctx.prev)) return null;
    const [l, c, r] = p;
    // inside a swap helper the number just read is only in the previous step
    const v = ctx.vars.v ?? ctx.vars.val ?? ctx.vars.x ?? ctx.prev.v ?? ctx.prev.val ?? ctx.prev.x;
    // trigger on the pointer that ends the decision (cur moves on, or right shrinks); classify by v against the median
    const moved = ctx.vars[c] === ctx.prev[c] + 1 || ctx.vars[r] === ctx.prev[r] - 1;
    if (moved && typeof v === 'number') {
      if (v > m) return `${v} is above the median ${m}: it climbs to the next peak (odd slot)`;
      if (v < m) return `${v} is below the median ${m}: it sinks to the last free valley (even slot)`;
      return `${v} equals the median ${m}: it stays in the gap between peaks and valleys`;
    }
    if (typeof v === 'number' && /\b(v|val|x)\s*=[^=]/.test(ctx.src)) return `next number to place: ${v} (the median is ${m})`;
    return null;
  },
  // the wiggle pass has just read a number: peak, valley, or stay?
  predict(ctx) {
    if (!ctx.next) return null;
    const med = medOf(ctx.vars);
    if (!med || typeof ctx.prev[med] !== 'number') return null;
    const p = ptrs(ctx.vars, med);
    const vName = ['v', 'val', 'x'].find((k) => typeof ctx.vars[k] === 'number');
    if (!p || !vName || !new RegExp(`\\b${vName}\\s*=[^=]`).test(ctx.src)) return null;
    const [l, c, r] = p;
    const nx = ctx.next.vars;
    if (![l, c, r].every((k) => Number.isInteger(nx[k]))) return null;
    const [L, C, R] = [l, c, r].map((k) => ctx.vars[k]);
    let ans = null;
    if (nx[l] === L + 1 && nx[c] === C + 1 && nx[r] === R) ans = 0;
    else if (nx[r] === R - 1 && nx[l] === L && nx[c] === C) ans = 1;
    else if (nx[c] === C + 1 && nx[l] === L && nx[r] === R) ans = 2;
    if (ans === null) return null;
    const v = ctx.vars[vName];
    const m = ctx.vars[med];
    return {
      question: `The next number is ${v} and the median is ${m}. Where does it go?`,
      options: ['Up to the next peak (odd slot)', 'Down to the last free valley (even slot)', 'It stays in the middle gap'],
      answer: ans,
      explain: [`${v} > ${m}: big numbers fill the peaks, left to right.`, `${v} < ${m}: small numbers fill the valleys from the back, so they end up far from the median copies.`, `${v} equals the median: copies of it stay between the peaks and the valleys, so no two of them touch.`][ans],
    };
  },
  bugs: [
    {
      label: 'Wrap with n instead of n | 1',
      find: '% (n | 1)',
      replace: '% n',
      explain: 'For an even n, (1 + 2i) % n visits only the odd slots twice and never the even ones, so the ridge is built from the wrong slots.',
    },
    {
      label: 'Move on after a swap to a valley',
      find: 'swap(idx(cur), idx(right--))',
      replace: 'swap(idx(cur++), idx(right--))',
      explain: 'The number that comes back from the valley has not been checked; skipping it can leave a big number in a valley.',
    },
  ],
};
