// Range Frequency Queries (design class): an address book. The constructor writes down, for every value, the sorted
// list of indexes where it sits; a query looks up one value's list and counts the addresses inside [left, right]
// with two binary searches. Brute-force counting loops get the answer prediction too.
import { functionAt, options, row } from './util.js';

const isInt = Number.isInteger;
const COUNT = ['count', 'cnt', 'c', 'freq', 'res', 'ans', 'total', 'result', 'hits'];
const LIST = ['list', 'idx', 'indices', 'indexes', 'positions', 'pos', 'arr', 'lst', 'where', 'locs', 'occ', 'a'];

/** [[value, [indexes]], …] from the first field of this that maps values to index lists */
function bookOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  for (const v of Object.values(o)) {
    const e = v?.$map || (v?.$obj && Object.entries(v.$obj).map(([k, x]) => [Number(k), x]));
    if (e && e.every(([, x]) => row(x) && x.every(isInt))) return e;
  }
  return null;
}
const queryOf = (ctx) => {
  const op = ctx.ops?.[ctx.op];
  return ctx.op > 0 && op && row(op.args) && op.args.length === 3 && op.args.every(isInt) ? op.args : null;
};
const opName = (ctx) => ctx.ops?.[ctx.op]?.name || '';
const listOf = (vars, book, value) => {
  const own = book?.find(([k]) => k === value)?.[1];
  const k = LIST.find((n) => row(vars[n]) && vars[n].every(isInt) && (!own || vars[n].join() === own.join()));
  return k ? vars[k] : null;
};
const assigns = (src, name) => !!name && new RegExp(`\\b${name}\\s*=(?!=)`).test(src || '');
const show = (l) => `[${l.join(', ')}]`;

export default {
  id: 'range-frequency-queries',
  metaphor: 'An address book of where each value sits',
  caption: 'Built once: each value gets the sorted list of indexes where it appears. A query opens one value\'s list and counts the addresses between left and right with two binary searches, never touching the array.',
  narrate(ctx) {
    const book = bookOf(ctx.vars);
    const q = queryOf(ctx);
    if (!q) {
      // building: one value's list just grew
      const before = new Map(bookOf(ctx.prev) || []);
      const grown = book && book.find(([k, l]) => l.length && l.length === (before.get(k)?.length ?? 0) + 1);
      if (!grown) return null;
      const [v, l] = grown;
      return l.length === 1 ? `${v} first seen at index ${l[0]}: its address list starts [${l[0]}]` : `${v} seen again at index ${l[l.length - 1]}: its addresses are now ${show(l)}`;
    }
    const [left, right, value] = q;
    const own = book?.find(([k]) => k === value)?.[1];
    const isOp = !!ctx.lines && functionAt(ctx.lines, ctx.line) === opName(ctx);
    if (ctx.ret && isInt(ctx.value) && (!ctx.next || ctx.next.op !== ctx.op) && isOp) {
      if (!own && book) return `${value} never appears in the array: 0`;
      const inside = own ? own.filter((i) => i >= left && i <= right) : null;
      return inside && inside.length === ctx.value
        ? `${value} sits at ${show(own)}; ${ctx.value} of those ${ctx.value === 1 ? 'is' : 'are'} inside [${left}, ${right}]${inside.length ? `: ${show(inside)}` : ''}`
        : `${value} appears ${ctx.value} time${ctx.value === 1 ? '' : 's'} in [${left}, ${right}]`;
    }
    // a binary-search helper just answered "how many addresses come before x?"
    if (ctx.ret && isInt(ctx.value) && !isOp) {
      const a = Object.values(ctx.vars).find((v) => row(v) && v.every(isInt) && v.length >= ctx.value);
      const x = ['x', 'target', 't', 'key', 'val', 'k'].find((n) => isInt(ctx.vars[n]));
      if (!a || !x) return null;
      const t = ctx.vars[x];
      const is = ctx.value === 1 ? 'is' : 'are';
      if (t === right + 1) return `${ctx.value} of the addresses ${show(a)} ${is} ≤ ${right}, the right end`;
      if (t === left) return `${ctx.value} of the addresses ${show(a)} ${is} < ${left}, before the range starts`;
      return `${ctx.value} of the addresses ${show(a)} come before ${t}`;
      return null;
    }
    const list = listOf(ctx.vars, book, value);
    const lName = list && LIST.find((n) => ctx.vars[n] === list);
    if (list && assigns(ctx.src, lName)) return `count ${value} in [${left}, ${right}]: open its address list ${show(list)}`;
    return null;
  },
  // when the query's address list is opened (or its counter starts): how many fall inside the range?
  predict(ctx) {
    const q = queryOf(ctx);
    const ans = row(ctx.result) ? ctx.result[ctx.op] : undefined;
    if (!q || !isInt(ans) || ctx.ret) return null;
    const [left, right, value] = q;
    const book = bookOf(ctx.vars);
    const own = book?.find(([k]) => k === value)?.[1];
    const list = listOf(ctx.vars, book, value);
    const lName = list && LIST.find((n) => ctx.vars[n] === list);
    const cName = COUNT.find((n) => ctx.vars[n] === 0 && assigns(ctx.src, n));
    if (!ctx.lines || functionAt(ctx.lines, ctx.line) !== opName(ctx) || (!(list && assigns(ctx.src, lName)) && !cName)) return null;
    const all = list || own;
    const inside = all ? all.filter((i) => i >= left && i <= right) : null;
    return options(
      all ? `${value} sits at indexes ${show(all)}. How many of them are inside [${left}, ${right}]?` : `How many times does ${value} appear in [${left}, ${right}]?`,
      ans,
      [all ? all.length : ans + 1, ans + 1, ans > 0 ? ans - 1 : 2, 0].filter((x) => x !== ans),
      inside && inside.length === ans
        ? `Both ends are included: ${inside.length ? `${show(inside)} lie between ${left} and ${right}` : `none of ${show(all)} lies between ${left} and ${right}`}.`
        : `This code answers ${ans} for this query.`,
    );
  },
  bugs: [
    {
      label: 'lowerBound(list, right): an address at right is lost',
      find: 'RangeFreqQuery.lowerBound(list, right + 1)',
      replace: 'RangeFreqQuery.lowerBound(list, right)',
      explain: 'lowerBound(list, right) counts addresses below right, so an occurrence exactly at index right is left out: [1, 4] misses the 1 at index 4.',
    },
    {
      label: 'Missing value returns nothing',
      find: 'if (!list) return 0;',
      replace: 'if (!list) return;',
      explain: 'A value that never appears has no address list; the answer must be 0, not undefined.',
    },
  ],
};

