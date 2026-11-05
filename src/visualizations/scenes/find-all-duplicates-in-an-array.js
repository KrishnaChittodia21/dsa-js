// Find All Duplicates in an Array (sign marking). Number v owns locker v − 1; a minus sign on the locker is a stamp
// "v was seen". Meeting v when its locker is already stamped means v is a duplicate. Reads sign flips on the input
// array and the answer array that grows, so any names work.
import { changedIdx, firstInt, row } from './util.js';

const V = ['v', 'val', 'value', 'num', 'x', 'cur'];
const I = ['i', 'idx', 'j', 'k', 'p'];

/** [name, array] of a flat array (not the input) that grew by exactly one item at the end */
function grown(vars, prev, skip) {
  for (const [k, v] of Object.entries(vars)) {
    const b = k !== skip && row(v) && row(prev[k]);
    if (b && v.length === b.length + 1 && b.every((x, i) => x === v[i])) return [k, v];
  }
  return null;
}
/** the input: the parameter, else the first flat number array (parameters are recorded first) */
function numsOf(vars, pName) {
  if (row(vars[pName])) return [pName, vars[pName]];
  return Object.entries(vars).find(([, v]) => row(v) && v.length && v.every(Number.isInteger)) || [];
}

export default {
  id: 'find-all-duplicates-in-an-array',
  metaphor: 'Every number has its own locker',
  caption: 'Number v owns locker v − 1. A minus sign is a stamp meaning "v was seen"; the number written in the locker is still read with its sign removed. Meeting v when its locker is already stamped means v is a duplicate.',
  compare: 'nums',
  narrate(ctx) {
    const [name, a] = numsOf(ctx.vars, ctx.params[0]);
    if (!a) return null;
    const b = row(ctx.prev[name]);
    const d = b ? changedIdx(a, b) : [];
    if (d.length === 1) {
      const k = d[0];
      if (a[k] < 0 && b[k] === -a[k]) return `first ${k + 1}: stamp locker ${k} (its ${b[k]} becomes ${a[k]}), so another ${k + 1} would find it stamped`;
      if (a[k] > 0 && b[k] === -a[k]) return `locker ${k} flips back to ${a[k]}: the stamp for ${k + 1} is lost`;
    }
    const g = grown(ctx.vars, ctx.prev, name);
    if (g) {
      const v = g[1][g[1].length - 1];
      const found = `found [${g[1].join(', ')}]`;
      return a[v - 1] < 0 ? `${v} again: locker ${v - 1} is already stamped (${a[v - 1]}), so ${v} is a duplicate · ${found}` : `${v} goes into the answer · ${found}`;
    }
    const [vName, v] = firstInt(ctx.vars, V);
    const [, i] = firstInt(ctx.vars, I);
    if (vName && v !== ctx.prev[vName] && Number.isInteger(i) && a[i] < 0 && v === -a[i]) {
      return `cell ${i} holds ${a[i]}: that minus is a stamp, the number there is still ${v}`;
    }
    return null;
  },
  // before a number is handled: first time (stamp) or duplicate (add to the answer)?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, a] = numsOf(ctx.vars, ctx.params[0]);
    const na = name && row(ctx.next.vars[name]);
    if (!a || !na || na.length !== a.length) return null;
    const d = changedIdx(na, a);
    const g = grown(ctx.next.vars, ctx.vars, name);
    let v;
    let dup;
    if (d.length === 1 && !g && a[d[0]] > 0 && na[d[0]] === -a[d[0]]) {
      // ask about one first sighting only: the one made when exactly 3 lockers are stamped
      if (a.filter((x) => x < 0).length !== 3) return null;
      [v, dup] = [d[0] + 1, false];
    } else if (g && !d.length) {
      [v, dup] = [g[1][g[1].length - 1], true];
      if (!(a[v - 1] < 0)) return null;
    } else return null;
    const k = v - 1;
    return {
      question: `The next number is ${v}. What happens?`,
      options: [`First ${v}: stamp locker ${k}`, `${v} is a duplicate: add it to the answer`],
      answer: dup ? 1 : 0,
      explain: dup ? `Locker ${k} already holds ${a[k]}: the minus sign says ${v} was seen before.` : `Locker ${k} holds ${a[k]}, no minus sign: nobody stamped it, so this is the first ${v}.`,
    };
  },
  bugs: [
    {
      label: 'Forget Math.abs when reading a number',
      find: 'const v = Math.abs(nums[i]);',
      replace: 'const v = nums[i];',
      explain: 'A cell that was already stamped holds a negative number; used as is, it points to a locker like nums[-3] that does not exist, so that number is never stamped and its duplicate is missed.',
    },
    {
      label: 'Push the locker index instead of the number',
      find: 'dup.push(v)',
      replace: 'dup.push(v - 1)',
      explain: 'Locker v − 1 belongs to number v; pushing the locker index reports every duplicate one too small.',
    },
  ],
};
