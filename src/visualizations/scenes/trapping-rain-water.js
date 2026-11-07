// Trapping Rain Water (two pointers, bottleneck). Water above a bar stands at the lower of the two tallest walls
// around it; the side whose wall is lower is already decided, so it is settled and its pointer steps in.
// Works with l/r, left/right, i/j, lo/hi and running maxima named like leftMax / maxLeft / lMax.
import { options, row } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const findInt = (vars, re) => Object.entries(vars).find(([k, v]) => re.test(k) && Number.isInteger(v)) || [];
const LMAX = /^(left|l)_?max$|^max_?(left|l)$|^lm$/i;
const RMAX = /^(right|r)_?max$|^max_?(right|r)$|^rm$/i;
const WATER = /water|total|trapped|^res$|^ans$|^sum$/i;

export default {
  id: 'trapping-rain-water',
  metaphor: 'Rain pooling between two walls',
  caption: 'Each bar is a block; water above it stands at the lower of the tallest wall on its left and on its right. The side with the lower wall already knows its level, so that bar is settled and the pointer steps in.',
  bars: true,
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'water',
  narrate(ctx) {
    const hName = ctx.params[0];
    const h = row(ctx.vars[hName]);
    const pair = pairOf(ctx.vars);
    if (!h || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    const [lmName, lm] = findInt(ctx.vars, LMAX);
    const [rmName, rm] = findInt(ctx.vars, RMAX);
    const [, w] = findInt(ctx.vars, WATER);
    const total = w !== undefined ? ` · total water ${w}` : '';
    // a pointer stepped in: the bar it left is settled
    if (Number.isInteger(pl) && l === pl + 1 && r === pr && lm !== undefined && h[pl] !== undefined && lm >= h[pl]) {
      return `bar ${pl} (height ${h[pl]}) is settled: the left wall ${lm} is the lower one, so it holds ${lm - h[pl]}${total}`;
    }
    if (Number.isInteger(pr) && r === pr - 1 && l === pl && rm !== undefined && h[pr] !== undefined && rm >= h[pr]) {
      return `bar ${pr} (height ${h[pr]}) is settled: the right wall ${rm} is the lower one, so it holds ${rm - h[pr]}${total}`;
    }
    if (lmName && lmName in ctx.prev && lm !== ctx.prev[lmName] && lm === h[l]) return `bar ${l} (height ${lm}) is the tallest seen from the left: the left wall rises to ${lm}`;
    if (rmName && rmName in ctx.prev && rm !== ctx.prev[rmName] && rm === h[r]) return `bar ${r} (height ${rm}) is the tallest seen from the right: the right wall rises to ${rm}`;
    if (l >= r && Number.isInteger(pl)) return `the pointers meet at bar ${l}: every bar is settled${total}`;
    return null;
  },
  // before the side is chosen: which bar is settled next? (read from the next line: its pointer moves or its water is added)
  predict(ctx) {
    const hName = ctx.params[0];
    const h = row(ctx.vars[hName]);
    const pair = pairOf(ctx.vars);
    if (!h || !pair || !ctx.next) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const [lmName, lm] = findInt(ctx.vars, LMAX);
    const [rmName, rm] = findInt(ctx.vars, RMAX);
    if (!lmName || !rmName || !(l >= 0 && l < r && r < h.length)) return null;
    if (/\+=/.test(ctx.lines[ctx.line - 1] || '')) return null; // water is being added: the side is already chosen
    // only once both walls include the current bars (otherwise the walls are still being raised)
    if (lm < h[l] || rm < h[r] || ctx.next.vars[lmName] !== lm || ctx.next.vars[rmName] !== rm) return null;
    const nl = ctx.next.vars[lName];
    const nr = ctx.next.vars[rName];
    const text = ctx.lines[ctx.next.line - 1] || '';
    const esc = (s) => s.replace(/[$]/g, '\\$');
    const usesL = new RegExp(`\\[\\s*${esc(lName)}\\s*\\]`).test(text);
    const usesR = new RegExp(`\\[\\s*${esc(rName)}\\s*\\]`).test(text);
    const side = nl === l + 1 && nr === r ? 'left' : nr === r - 1 && nl === l ? 'right' : nl === l && nr === r && /\+=/.test(text) && usesL !== usesR ? (usesL ? 'left' : 'right') : null;
    if (!side) return null;
    const left = `Bar ${l} on the left (height ${h[l]})`;
    const right = `Bar ${r} on the right (height ${h[r]})`;
    return options(
      `Left wall ${lm}, right wall ${rm}. Which bar gets its water settled next?`,
      side === 'left' ? left : right,
      [side === 'left' ? right : left],
      side === 'left'
        ? `The left wall ${lm} is lower than the right wall ${rm}, and the right side can only be taller, so bar ${l} stands in water up to ${lm}.`
        : `The right wall ${rm} is not taller than the left wall ${lm}, so the level at bar ${r} is fixed at ${rm} whatever lies between.`,
    );
  },
  bugs: [
    {
      label: 'Settle the side with the taller wall',
      find: 'leftMax < rightMax',
      replace: 'leftMax > rightMax',
      explain: 'The taller side does not know its level yet: a lower wall on the other side may decide it, so water is counted that would spill away (or goes negative).',
    },
    {
      label: 'Fill up to the taller wall',
      find: 'water += leftMax - height[l];',
      replace: 'water += rightMax - height[l];',
      explain: 'Water spills over the lower wall, not the taller one: [3, 0, 0, 7] holds 6 (up to 3), not 14 (up to 7).',
    },
  ],
};
