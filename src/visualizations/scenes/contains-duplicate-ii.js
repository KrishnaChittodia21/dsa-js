// Contains Duplicate II (sliding window set). A short memory holds only the last k numbers seen; a new number that
// is already in the memory is a repeat at most k steps back. Works with a Set (any name) and i / j / idx / r, and
// narrates a value → last-index Map too.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'r', 'right', 'idx', 'end'];
const setOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$set));
const mapOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map));
const list = (xs) => `{${xs.join(', ')}}`;

export default {
  id: 'contains-duplicate-ii',
  metaphor: 'A memory of the last k numbers',
  caption: 'The set is a short memory: it only holds the numbers from the last k positions. A number that is already remembered repeats at most k steps back; anything older has been forgotten.',
  narrate(ctx) {
    const [nName, kName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const k = ctx.vars[kName];
    if (!nums) return null;
    const [iName, i] = firstInt(ctx.vars, AT);
    const set = setOf(ctx.vars);
    const was = set && ctx.prev[set[0]]?.$set;
    if (set && was) {
      const now = set[1].$set;
      const added = now.filter((x) => !was.includes(x));
      const gone = was.filter((x) => !now.includes(x));
      if (added.length === 1 && !gone.length) return `${added[0]} goes into the memory · remembered: ${list(now)}`;
      if (gone.length === 1 && !added.length) return `${gone[0]} is now more than ${k} steps back: forgotten · remembered: ${list(now)}`;
    }
    const map = mapOf(ctx.vars);
    const mWas = map && ctx.prev[map[0]]?.$map;
    if (map && mWas && iName) {
      const ch = map[1].$map.find(([key, v]) => !mWas.some(([k2, v2]) => k2 === key && v2 === v));
      if (ch) return `remember that ${ch[0]} was last seen at index ${ch[1]}`;
    }
    if (iName && i !== ctx.prev[iName] && i >= 0 && i < nums.length && (set || map)) {
      return `step ${i}: the number is ${nums[i]}. Is it in the memory of the last ${k}?`;
    }
    return null;
  },
  // before the check: is nums[i] already remembered? (Set version only: the next step adds it or returns true)
  predict(ctx) {
    const [nName, kName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const k = ctx.vars[kName];
    const set = setOf(ctx.vars);
    const [iName, i] = firstInt(ctx.vars, AT);
    // the answer must show in the same round: the next step adds nums[i] or is the return itself
    if (!nums || !set || !ctx.next || !(i >= 0 && i < nums.length) || ctx.next.vars[iName] !== i) return null;
    const v = nums[i];
    const now = set[1].$set;
    const after = ctx.next.vars[set[0]]?.$set;
    const ret = /\breturn\s+true\b/.test(ctx.lines[ctx.next.line - 1] || '');
    const seen = ret && now.includes(v) ? true : after && !now.includes(v) && after.length === now.length + 1 && after.includes(v) ? false : null;
    if (seen === null) return null;
    // only interesting when the number did appear earlier: is it still remembered or already forgotten?
    if (!nums.slice(0, i).includes(v)) return null;
    const back = i - nums.lastIndexOf(v, i - 1);
    const yes = `Yes: ${v} is remembered, return true`;
    const no = `No: ${v} goes into the memory`;
    return options(
      `Step ${i}: ${v} appears again (last seen ${back} step${back > 1 ? 's' : ''} back). The memory holds ${list(now)}, k = ${k}. Is it a nearby repeat?`,
      seen ? yes : no,
      [seen ? no : yes],
      seen ? `${back} ≤ ${k}, so the earlier ${v} is still in the memory.` : `${back} > ${k}: the earlier ${v} was forgotten when it fell out of the last ${k}.`,
    );
  },
  bugs: [
    {
      label: 'Memory keeps k + 1 numbers',
      find: 'if (i >= k)',
      replace: 'if (i > k)',
      explain: 'Forgetting starts one step late, so a repeat k + 1 steps back still matches: [7, 1, 2, 7] with k = 2 says true.',
    },
  ],
};
