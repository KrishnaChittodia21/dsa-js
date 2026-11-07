// Permutations: guests take a row of chairs one seat at a time. The used flags show who is already seated; when
// every chair is taken the seating is written down, then the last guest stands up (and is marked free again) so
// another guest can try that chair. Swap-based solutions are narrated as guests trading chairs.
import { callArgs, functionAt, row, swapped } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'perm', 'permutation', 'temp', 'tmp', 'seq', 'order', 'list', 'chosen', 'picked', 'stack', 'comb', 'arrangement'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'perms', 'permutations', 'all'];
const USED = ['used', 'visited', 'seen', 'taken', 'inPath', 'picked', 'vis', 'chosen', 'usedFlags', 'flags'];
const IDX = ['i', 'j', 'k', 'idx', 'index'];

const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k) && k in vars).map((k) => row(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars?.[k]).find((v) => Array.isArray(v) && v.every((p) => row(p)));
/** [name, flags] of a used-flag row (true / false or 1 / 0) */
const usedOf = (vars) => {
  const k = USED.find((n) => row(vars?.[n]) && vars[n].length > 0 && vars[n].every((x) => typeof x === 'boolean' || x === 0 || x === 1));
  return k ? [k, vars[k]] : [undefined, undefined];
};
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const show = (a) => `[${a.join(', ')}]`;
const seat = (k) => `chair ${k}`;

export default {
  id: 'permutations',
  metaphor: 'Seating guests in a row of chairs',
  caption: 'The path is the row of chairs filled so far and the used flags mark who is already seated. When every chair is taken the seating is written down; then the last guest stands up and is marked free, so another guest can take that chair.',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `every chair is taken: ${show(res[res.length - 1])} is seating #${res.length}, write it down`;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (p && before && extends1(p, before)) {
      const left = nums.length - p.length;
      return `${p[p.length - 1]} sits in ${seat(p.length)}: ${show(p)}${left > 0 ? `, ${left} chair${left > 1 ? 's' : ''} to fill` : ', all chairs taken'}`;
    }
    if (p && before && extends1(before, p)) return `${before[before.length - 1]} stands up from ${seat(before.length)}: ${show(p)}`;
    const [uName, used] = usedOf(ctx.vars);
    const usedBefore = uName && row(ctx.prev[uName]);
    if (used && usedBefore && used.length === usedBefore.length) {
      const d = used.findIndex((x, i) => !!x !== !!usedBefore[i]);
      if (d >= 0 && d < nums.length) return used[d] ? `${nums[d]} (index ${d}) is picked: mark it as seated` : `${nums[d]} (index ${d}) is free again for later chairs`;
    }
    // a fresh index arrives at the "already seated?" test: no verdict for it here (a card may ask)
    const call = callArgs(ctx);
    const iName = IDX.find((k) => Number.isInteger(ctx.vars[k]) && !(call && k in call.args));
    const i = iName && ctx.vars[iName];
    if (p && before && used && iName && p.length === before.length && !(ctx.prev[iName] >= i) && i >= 0 && i < nums.length && p.length < nums.length) {
      const pi = ctx.prev[iName];
      const skipped = Number.isInteger(pi) && pi < i && used[pi] ? `${nums[pi]} is already seated, skip it. ` : '';
      return `${skipped}${seat(p.length + 1)}: what about ${nums[i]} (index ${i})?`;
    }
    // swap-based: the guest at a position trades chairs
    const sw = swapped(nums, row(ctx.prev[ctx.params[0]]));
    if (sw) return `${nums[sw[0]]} and ${nums[sw[1]]} trade chairs ${sw[0]} and ${sw[1]}: ${show(nums)}`;
    return null;
  },
  // the loop arrives at a guest: free to sit? / a guest just stood up: what must happen before the next guest?
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!ctx.next || !nums) return null;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const after = pathOf(ctx.next.vars, ctx.params);
    const [uName, used] = usedOf(ctx.vars);
    if (!p || !after || !used) return null;
    const nu = row(ctx.next.vars[uName]);
    // undo both pieces of state
    if (before && extends1(before, p)) {
      const x = before[before.length - 1];
      const d = nu && used.findIndex((f, i) => !!f !== !!nu[i]);
      const answer = d >= 0 && d < nums.length && !nu[d] ? 0 : extends1(after, p) ? 1 : -1;
      if (answer < 0) return null;
      return {
        question: `${x} just stood up from ${seat(before.length)}. What has to happen before another guest takes it?`,
        options: [`Mark ${x} as free again`, 'Nothing: seat the next guest'],
        answer,
        explain: answer === 0 ? `Both pieces of state are undone: ${x} left the path, and its used flag is cleared so a later chair can take ${x}.` : `This run seats the next guest while ${x} is still marked as seated, so ${x} can never sit again in this branch.`,
      };
    }
    // a fresh index has arrived at the "already seated?" test
    const call = callArgs(ctx);
    const iName = IDX.find((k) => Number.isInteger(ctx.vars[k]) && !(call && k in call.args));
    if (!iName || p.length !== 1) return null; // one round of these is enough; the undo card comes later
    const i = ctx.vars[iName];
    if (i < 0 || i >= nums.length || ctx.prev[iName] >= i || !before || before.length !== p.length) return null;
    if (functionAt(ctx.lines, ctx.next.line) !== call?.name) return null;
    let answer = -1;
    if (ctx.next.vars[iName] === i && nu && !used[i] && nu[i]) answer = 0;
    else if (ctx.next.vars[iName] === i && extends1(after, p) && after[after.length - 1] === nums[i]) answer = 0;
    else if (Number.isInteger(ctx.next.vars[iName]) && ctx.next.vars[iName] > i && after.length === p.length) answer = 1;
    if (answer < 0) return null;
    return {
      question: `Chairs so far: ${show(p)}. Can ${nums[i]} (index ${i}) take ${seat(p.length + 1)}?`,
      options: [`Yes: ${nums[i]} is still free`, `No: ${nums[i]} is already seated`],
      answer,
      explain: answer === 0 ? `${uName}[${i}] is false, so ${nums[i]} is not in the path yet and may sit here.` : `${uName}[${i}] is true: ${nums[i]} already sits in ${show(p)}, and each guest gets one chair.`,
    };
  },
  bugs: [
    {
      label: 'Forget to clear the used flag',
      find: 'used[i] = false;',
      replace: '',
      explain: 'A guest who stands up stays marked as seated, so after the first full seating nobody is free and only one permutation is found.',
    },
    {
      label: 'Write down the path itself, not a copy',
      find: 'result.push([...path]);',
      replace: 'result.push(path);',
      explain: 'Every saved seating is the same path array; guests standing up later empty it, so all answers end up as [].',
    },
  ],
};
