// Majority Element (Boyer–Moore voting). King of the hill: the candidate holds the hill with an army; a soldier of the
// same value joins, any other value duels one soldier and both fall. Works with candidate / count under common names.
import { firstInt, options, row } from './util.js';

const CAND = ['candidate', 'cand', 'maj', 'major', 'majority', 'leader', 'king', 'winner', 'el', 'res', 'ans', 'm'];
const COUNT = ['count', 'cnt', 'votes', 'vote', 'army', 'c', 'k', 'freq', 'score', 'balance'];
const CUR = ['x', 'num', 'v', 'val', 'value', 'cur', 'e', 'el', 'item'];
const IDX = ['i', 'j', 'k', 'idx'];

const candOf = (vars) => CAND.find((n) => n in vars && (typeof vars[n] === 'number' || vars[n] === null));
const countOf = (vars, cand) => firstInt(vars, COUNT.filter((n) => n !== cand));
// the value being looked at: x-like variable, else nums[i]
function curOf(vars, nums, skip) {
  const [, x] = firstInt(vars, CUR.filter((n) => !skip.includes(n)));
  if (x !== undefined) return x;
  const [, i] = firstInt(vars, IDX.filter((n) => !skip.includes(n)));
  return nums && i >= 0 && i < nums.length ? nums[i] : undefined;
}
const army = (n) => `${n} soldier${n === 1 ? '' : 's'}`;

export default {
  id: 'majority-element',
  metaphor: 'King of the hill, one-on-one duels',
  caption: 'The candidate holds the hill with an army of `count` soldiers. A matching value joins the army; any other value duels one soldier and both fall. When the army is gone, the next value takes the hill.',
  compare: 'candidate',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    const cName = candOf(ctx.vars);
    if (!nums || !cName) return null;
    const cand = ctx.vars[cName];
    const [nName, count] = countOf(ctx.vars, cName);
    if (!nName || !(nName in ctx.prev) || !(cName in ctx.prev)) return null;
    const before = ctx.prev[nName];
    if (cand !== ctx.prev[cName]) return `the hill is empty, so ${cand} climbs it${count > 0 ? ` with ${army(count)}` : ''}`;
    const x = curOf(ctx.vars, nums, [cName, nName]);
    if (count === 1 && before === 0) return `the hill was empty: ${cand} now holds it with 1 soldier`;
    if (count === before + 1) return `another ${cand} joins the army on the hill: ${army(count)}`;
    if (count === before - 1) return `${x === undefined || x === cand ? 'a different value' : x} duels one of ${cand}'s soldiers and both fall: ${count === 0 ? 'the hill is empty now' : `${army(count)} left`}`;
    return null;
  },
  // before a vote with someone on the hill: does the army grow, or is there a duel?
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    const cName = candOf(ctx.vars);
    if (!nums || !cName || !ctx.next) return null;
    const [nName, count] = countOf(ctx.vars, cName);
    const nx = ctx.next.vars;
    if (!nName || !(count > 0) || nx[cName] !== ctx.vars[cName] || !Number.isInteger(nx[nName])) return null;
    const up = nx[nName] === count + 1;
    const down = nx[nName] === count - 1;
    if (!up && !down) return null;
    const cand = ctx.vars[cName];
    const y = curOf(nx, nums, [cName, nName]);
    if (y === undefined || (y === cand) !== up) return null;
    const grow = `${cand}'s army grows to ${count + 1}`;
    const duel = `A duel: ${count === 1 ? 'the hill is left empty' : `${army(count - 1)} left`}`;
    const take = `${y} takes over the hill`;
    const r = options(`${cand} holds the hill with ${army(count)}. The next value is ${y}. What happens?`, up ? grow : duel, [up ? duel : grow, ...(up ? [] : [take])], up ? `${y} is the same value as the king, so it joins the army.` : `${y} is a different value: it cancels one of ${cand}'s soldiers. It can only take the hill once the army is gone.`);
    return r;
  },
  bugs: [
    {
      label: 'The first king never leaves',
      find: 'if (count === 0) candidate = x;',
      replace: '',
      explain: 'Without adopting a new candidate when the army is gone, the answer is always nums[0]: [1, 9, 9, 1, 9, 1, 9, 9] returns 1 instead of 9.',
    },
  ],
};
