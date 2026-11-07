// Capacity To Ship Packages: binary search on the ship's capacity. Each trial loads the packages in order, sailing
// whenever the next one would not fit, and counts the days. lo / hi are capacities, not indexes, so no pointers are
// drawn on weights. Works with lo/hi, left/right, l/r, low/high; mid / cap / capacity; d / day(s) count; load / cur.
import { firstInt, options } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
];
const CAP = ['cap', 'capacity', 'limit', 'c', 'mid', 'm'];
const DAYS = ['d', 'day', 'dayCount', 'used', 'need', 'needed', 'count', 'cnt', 'ships', 'trips'];
const LOAD = ['load', 'cur', 'curr', 'current', 'sum', 'total', 'onBoard', 'loaded'];
const PKG = ['w', 'x', 'pkg', 'p', 'wt', 'weight', 'item'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
/** the first of `names` holding an integer that is not a parameter */
const own = (ctx, vars, names) => firstInt(vars, names.filter((n) => !ctx.params.includes(n)));

export default {
  id: 'capacity-to-ship-packages-within-d-days',
  metaphor: 'Loading a cargo ship, day by day',
  caption: 'Each cell is a package waiting on the dock, in order. A trial capacity loads packages until the next one would sink the ship, then sails and starts a new day; the search keeps the smallest capacity that finishes in time.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const days = ctx.vars[ctx.params[1]];
    const [, cap] = own(ctx, ctx.vars, CAP);
    const [dName, d] = own(ctx, ctx.vars, DAYS);
    const [lName, load] = own(ctx, ctx.vars, LOAD);
    if (Number.isInteger(cap) && cap > 0 && dName && lName) {
      // a new day: the counter went up (the load is reset on the next step, or in the same one)
      if (Number.isInteger(ctx.prev[dName]) && d === ctx.prev[dName] + 1) {
        const [, w] = own(ctx, ctx.vars, PKG);
        const was = ctx.prev[lName];
        return Number.isInteger(w) && Number.isInteger(was)
          ? `a package of ${w} does not fit (${was} + ${w} > ${cap}): the ship sails, day ${d} starts`
          : `the ship sails: day ${d} starts${Number.isInteger(days) ? ` (${days} allowed)` : ''}`;
      }
      const [, pkg] = own(ctx, ctx.vars, PKG);
      const was = ctx.prev[lName];
      // `load = w` after a new day: the package that did not fit opens the new day's load
      if (Number.isInteger(pkg) && load === pkg && Number.isInteger(was) && was > 0 && load !== was) return `the package of ${pkg} is the first aboard on day ${d}`;
      if (Number.isInteger(was) && load > was && ctx.prev[dName] === d && (!Number.isInteger(pkg) || load - was === pkg)) {
        return `a package of ${load - ctx.prev[lName]} goes aboard: ${load} of ${cap} loaded on day ${d}`;
      }
      if (load === 0 && Number.isInteger(ctx.prev[lName]) && ctx.prev[lName] > 0) return null; // the reset after a new day
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const [mName, mid] = own(ctx, ctx.vars, ['mid', 'm', 'cap', 'capacity']);
    if (!Number.isInteger(ctx.prev[loName]) || !Number.isInteger(ctx.prev[hiName])) return null;
    // the bracket moved after a trial: its day count is still in prev (the helper's last step)
    const [, used] = own(ctx, ctx.prev, DAYS);
    const tried = mName ? mid : undefined;
    if (Number.isInteger(tried) && lo > ctx.prev[loName] && ctx.prev[hiName] === hi) {
      return `capacity ${tried} is too small${Number.isInteger(used) ? ` (${used} days)` : ''}: try bigger ships (${lo}…${hi})`;
    }
    if (Number.isInteger(tried) && hi < ctx.prev[hiName] && ctx.prev[loName] === lo && ctx.prev[hiName] !== 0) {
      return `capacity ${tried} ships everything in time${Number.isInteger(used) ? ` (${used} days)` : ''}: keep it, try smaller (${lo}…${hi})`;
    }
    if (mName && mid !== own(ctx, ctx.prev, ['mid', 'm', 'cap', 'capacity'])[1] && lo <= hi) return `try a ship of capacity ${mid}: the answer is somewhere in ${lo}…${hi}`;
    // set-up: the heaviest package is the smallest ship that can work
    if (!mName && lo > ctx.prev[loName] && hi === ctx.prev[hiName] && lo > 0) return `a package of ${lo} is the heaviest so far: no ship below ${lo} can carry it`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const nx = ctx.next.vars;
    const days = ctx.vars[ctx.params[1]];
    // 1) on the first day of a trial, once the ship is half full: does the next package still fit?
    const [, cap] = own(ctx, ctx.vars, CAP);
    const [dName, d] = own(ctx, ctx.vars, DAYS);
    const [lName, load] = own(ctx, ctx.vars, LOAD);
    if (Number.isInteger(cap) && dName && lName && cap === own(ctx, nx, CAP)[1] && d <= 1 && load * 2 >= cap && load < cap) {
      const [, w] = own(ctx, nx, PKG);
      const sailed = nx[dName] === d + 1;
      const aboard = nx[dName] === d && Number.isInteger(w) && nx[lName] === load + w;
      if (Number.isInteger(w) && sailed !== aboard) {
        return {
          question: `The ship holds ${load} of ${cap}. The next package weighs ${w}. Does it go aboard today?`,
          options: ['Yes: it fits', 'No: the ship sails and a new day starts'],
          answer: aboard ? 0 : 1,
          explain: aboard ? `${load} + ${w} = ${load + w} is at most ${cap}, so it rides today.` : `${load} + ${w} = ${load + w} is more than ${cap}: the ship would sink, so it sails and the package waits for tomorrow.`,
        };
      }
    }
    // 2) a trial is over: which half of the capacities is kept?
    const pair = pairOf(ctx.vars);
    if (!pair || !Number.isInteger(days)) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const [mName, mid] = own(ctx, nx, ['mid', 'm', 'cap', 'capacity']);
    if (!mName || !(lo <= mid && mid <= hi)) return null;
    const up = nx[loName] > lo && nx[hiName] === hi;
    const down = nx[hiName] < hi && nx[loName] === lo;
    if (up === down) return null;
    const used = Number.isInteger(d) ? d : null;
    return {
      question: `A ship of capacity ${mid} was tried${used ? ` and needed ${used} days` : ''}; ${days} days are allowed. Which capacities are kept?`,
      options: [`Bigger ones: ${loName} moves up`, `${mid} and smaller: ${hiName} moves down`],
      answer: up ? 0 : 1,
      explain: up ? `Capacity ${mid} needs more than ${days} days, and any smaller ship needs at least as many, so all of them are out.` : `Capacity ${mid} finishes within ${days} days, so it may be the answer; a smaller ship might too, so the search looks lower.`,
    };
  },
  bugs: [
    {
      label: 'Start lo at 1, not the heaviest package',
      find: 'lo = Math.max(lo, w);',
      replace: 'lo = 1;',
      explain: 'A ship smaller than the heaviest package cannot carry it at all, but the day count still puts it aboard alone, so a too-small capacity looks good enough.',
    },
    {
      label: 'Sail when the load reaches the capacity exactly',
      find: 'load + w > cap',
      replace: 'load + w >= cap',
      explain: 'A load that fills the ship exactly is allowed. Sailing early wastes space, adds days, and makes the search pick a bigger ship than needed.',
    },
  ],
};
