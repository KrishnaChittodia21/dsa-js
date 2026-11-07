// Two Sum (hash map of earlier numbers). Every number walks in and asks the front desk: "is my partner, target
// minus me, already waiting?" If yes, that is the pair; if not, it leaves its name and seat at the desk. Reads any
// Map / plain object of value → index (not the parameters) and the index i / j / idx.
import { entriesOf, firstInt, options, row } from './util.js';

const IDX = ['i', 'j', 'idx', 'k'];
// the front desk: [name, [[value, index]…]]
function deskOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    const es = entriesOf(v);
    if (es && es.every(([, x]) => Number.isInteger(x))) return [k, es.map(([key, x]) => [Number(key), x])];
  }
  return null;
}
const seatOf = (desk, x) => desk.find(([v]) => v === x)?.[1];
const list = (desk) => (desk.length ? desk.map(([v, at]) => `${v}@${at}`).join(', ') : 'nobody');
// the number standing at the desk now
function walker(ctx, vars = ctx.vars) {
  const [nName, tName] = ctx.params;
  const nums = row(vars[nName]);
  const t = vars[tName];
  const [iName, i] = firstInt(vars, IDX);
  if (!nums || !Number.isFinite(t) || !iName || !(i >= 0 && i < nums.length)) return null;
  return { nums, t, iName, i, x: nums[i], need: t - nums[i] };
}

export default {
  id: 'two-sum',
  metaphor: 'Partners meeting at a front desk',
  caption: 'Each number walks in and asks the desk for its partner (target minus itself). The desk only knows numbers that came earlier, so a number never pairs with itself.',
  narrate(ctx) {
    const w = walker(ctx);
    const d = deskOf(ctx.vars, ctx.params);
    if (!w || !d) return null;
    if (ctx.ret && Array.isArray(ctx.result) && ctx.result.length === 2 && ctx.result[1] === w.i) {
      return `${w.need} is waiting at seat ${ctx.result[0]}: ${w.need} + ${w.x} = ${w.t}, the pair is [${ctx.result.join(', ')}]`;
    }
    const was = deskOf(ctx.prev, ctx.params);
    if (was && was[0] === d[0] && d[1].length === was[1].length + 1 && seatOf(d[1], w.x) === w.i) {
      return `no partner yet: ${w.x} leaves its seat number ${w.i} at the desk (${list(d[1])})`;
    }
    // just arrived (or its partner was just worked out): no verdict, the prediction asks about it
    if (w.i !== ctx.prev[w.iName]) return `${w.x} walks in: it needs ${w.need} to make ${w.t}. The desk knows ${list(d[1])}`;
    return null;
  },
  // a number has arrived and knows its partner: is the partner at the desk?
  predict(ctx) {
    const w = walker(ctx);
    const d = deskOf(ctx.vars, ctx.params);
    if (!w || !d || !ctx.next || !d[1].length) return null;
    const nd = deskOf(ctx.next.vars, ctx.params);
    let found;
    if (ctx.next.ret && Array.isArray(ctx.result) && ctx.result.length === 2 && ctx.result[1] === w.i && ctx.result[0] === seatOf(d[1], w.need)) found = true;
    else if (nd && nd[0] === d[0] && nd[1].length === d[1].length + 1 && seatOf(nd[1], w.x) === w.i && seatOf(d[1], w.need) === undefined) found = false;
    else return null;
    const yes = `Partner found: return the pair`;
    const no = `No partner yet: ${w.x} waits at the desk`;
    return options(`${w.x} needs ${w.need}. The desk knows ${list(d[1])}. What happens?`, found ? yes : no, [found ? no : yes], found ? `${w.need} came earlier (seat ${ctx.result[0]}), and ${w.need} + ${w.x} = ${w.t}.` : `Nobody at the desk is ${w.need}, so ${w.x} leaves its seat number for a later partner.`);
  },
  bugs: [
    {
      label: 'Leave your name before asking',
      find: '    if (indexOf.has(need)) return [indexOf.get(need), i];\n    indexOf.set(nums[i], i);            // store after checking',
      replace: '    indexOf.set(nums[i], i);\n    if (indexOf.has(need)) return [indexOf.get(need), i];',
      explain: 'A number that is exactly half the target finds itself at the desk: [3, 2, 4] with target 6 returns [0, 0].',
    },
  ],
};
