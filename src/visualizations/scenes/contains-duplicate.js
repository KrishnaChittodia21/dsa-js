// Contains Duplicate (hash set). Every number signs a guest book on the way in; a number whose name is already in
// the book has been here before. Works with a Set (any name) or a plain object / Map of seen numbers.
import { entriesOf, firstInt, options, row } from './util.js';

const IDX = ['i', 'j', 'k', 'idx'];
const VAL = ['x', 'num', 'n', 'v', 'val', 'value', 'el', 'item', 'cur', 'e', 'a'];
// the guest book: a Set, or a Map / object of seen numbers (not the input)
function bookOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    if (v && Array.isArray(v.$set)) return [k, v.$set];
    const es = entriesOf(v);
    if (es) return [k, es.map(([key]) => key)];
  }
  return null;
}
// the number being checked: nums[i], or a value variable that is one of the numbers
function currentOf(vars, nums) {
  const [iName, i] = firstInt(vars, IDX);
  if (iName && i >= 0 && i < nums.length) return [iName, nums[i]];
  const v = VAL.find((k) => Number.isFinite(vars[k]) && nums.includes(vars[k]));
  return v ? [v, vars[v]] : [undefined, undefined];
}
const has = (book, x) => book.some((k) => k === x || String(k) === String(x));
const list = (xs) => `{${xs.join(', ')}}`;

export default {
  id: 'contains-duplicate',
  metaphor: 'A guest book at the door',
  caption: 'Each number signs the guest book as it walks in. If its name is already in the book, it has been here before: a duplicate, and the scan stops at once.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const book = bookOf(ctx.vars, ctx.params);
    if (!nums || !book) return null;
    const before = bookOf(ctx.prev, ctx.params);
    const [cName, x] = currentOf(ctx.vars, nums);
    if (before && book[1].length > before[1].length) {
      const added = book[1].filter((k) => !has(before[1], k));
      return `${added.join(', ')} signs the guest book · signed so far: ${list(book[1])}`;
    }
    const last = !ctx.next || (ctx.next.ret && ctx.vars[cName] === ctx.prev[cName]); // the run stops here
    if (last && cName !== undefined && has(book[1], x) && ctx.result === true) return `${x} is already in the book ${list(book[1])}: it has been here before, a duplicate`;
    if ((!ctx.next || ctx.next.ret) && ctx.result === false && cName === undefined) return `everyone signed once: ${book[1].length} different number${book[1].length === 1 ? "" : "s"}, no repeat`;
    if (cName !== undefined && ctx.vars[cName] !== ctx.prev[cName]) return `${x} arrives at the door. Is it in the book ${list(book[1])}?`;
    return null;
  },
  // a number at the door: seen before (stop) or new (sign)?
  predict(ctx) {
    const [nName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const book = bookOf(ctx.vars, ctx.params);
    if (!nums || !book || !ctx.next || book[1].length < 2) return null;
    const [cName, cur] = currentOf(ctx.vars, nums);
    const [nxName, nx] = currentOf(ctx.next.vars, nums);
    let x;
    let seen = null;
    if (cName !== undefined && ctx.vars[cName] !== ctx.prev[cName]) {
      // it just arrived: the next step signs it or returns
      x = cur;
      const after = bookOf(ctx.next.vars, ctx.params);
      if (ctx.next.ret && ctx.result === true && has(book[1], x)) seen = true;
      else if (after && after[1].length === book[1].length + 1 && has(after[1], x) && !has(book[1], x)) seen = false;
    } else if (ctx.next.ret && nxName !== undefined && ctx.next.vars[nxName] !== ctx.vars[nxName] && ctx.result === true && has(book[1], nx)) {
      // it arrives and is turned away in one step
      x = nx;
      seen = true;
    }
    if (seen === null) return null;
    const yes = `Seen before: return true`;
    const no = `New: ${x} signs the book`;
    return options(`${x} is at the door. The book holds ${list(book[1])}. What happens?`, seen ? yes : no, [seen ? no : yes], seen ? `${x} is already in the book, so it is a duplicate.` : `${x} is not in the book yet, so it signs and the scan goes on.`);
  },
  bugs: [
    {
      label: 'Sign the book before checking it',
      find: 'if (seen.has(x)) return true;   // O(1) average\n    seen.add(x);',
      replace: 'seen.add(x);\n    if (seen.has(x)) return true;',
      explain: 'Every number finds its own fresh signature, so the very first number looks like a duplicate: [1, 2, 3, 4] says true.',
    },
  ],
};
