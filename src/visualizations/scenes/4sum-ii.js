// 4Sum II (pair sums in a hash map). The first two lists build a price list "sum → how many pairs make it"; every
// pair from the last two lists looks up the sum that would cancel it to 0. Works with a Map or a plain object.
import { entriesOf, options } from './util.js';

const COUNT = ['count', 'res', 'ans', 'result', 'total', 'cnt', 'answer', 'tuples'];
const CD = [
  ['c', 'd'],
  ['x', 'y'],
  ['k', 'l'],
  ['n3', 'n4'],
  ['num3', 'num4'],
  ['c1', 'd1'],
];
const AB = [
  ['a', 'b'],
  ['x', 'y'],
  ['n1', 'n2'],
  ['num1', 'num2'],
];
const mapOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && entriesOf(v));
const countOf = (vars, params) => COUNT.find((k) => !params.includes(k) && Number.isInteger(vars[k]));
const pairOf = (vars, list) => list.find(([p, q]) => Number.isFinite(vars[p]) && Number.isFinite(vars[q]));
const lookup = (es, key) => es.find(([k]) => Number(k) === key)?.[1] ?? 0;

export default {
  id: '4sum-ii',
  metaphor: 'A price list of pair sums',
  caption: 'First every pair from lists 1 and 2 is written on a price list: sum → how many pairs make it. Then each pair from lists 3 and 4 looks up the sum that cancels it to 0, and that many tuples are found.',
  compare: 'count',
  narrate(ctx) {
    const m = mapOf(ctx.vars, ctx.params);
    const was = m && entriesOf(ctx.prev[m[0]]);
    if (m && was) {
      const now = entriesOf(m[1]);
      const ch = now.find(([k, v]) => !was.some(([k2, v2]) => k2 === k && v2 === v));
      if (ch && now.length >= was.length) {
        const ab = pairOf(ctx.vars, AB);
        const how = ab ? `${ctx.vars[ab[0]]} + ${ctx.vars[ab[1]]} = ${ch[0]}: ` : `sum ${ch[0]}: `;
        return `${how}${ch[1] === 1 ? 'a new sum on the list (1 pair)' : `${ch[1]} pairs now make this sum`}`;
      }
    }
    const cName = countOf(ctx.vars, ctx.params);
    if (!m || !cName || !Number.isInteger(ctx.prev[cName])) return null;
    const cd = pairOf(ctx.vars, CD);
    const got = ctx.vars[cName] - ctx.prev[cName];
    if (cd) {
      const s = ctx.vars[cd[0]] + ctx.vars[cd[1]];
      const need = -s;
      if (got !== lookup(entriesOf(m[1]), need)) return null;
      return `${ctx.vars[cd[0]]} + ${ctx.vars[cd[1]]} = ${s} needs ${need} from the list: ${got ? `${got} pair${got > 1 ? 's' : ''} → ${cName} ${ctx.vars[cName]}` : `none there · ${cName} stays ${ctx.vars[cName]}`}`;
    }
    const nName = ['need', 'target', 'comp', 'complement', 'want'].find((k) => Number.isFinite(ctx.vars[k]));
    const why = nName ? `${ctx.vars[nName]} is on the list ${got} time${got > 1 ? 's' : ''}` : `${got} pair${got > 1 ? 's' : ''} from the list cancel${got > 1 ? '' : 's'} this one`;
    if (got > 0) return `${why}: ${cName} = ${ctx.vars[cName]}`;
    return null;
  },
  // before a lookup: how many tuples does this pair add? · before a repeat sum: how many pairs make it now?
  predict(ctx) {
    if (!ctx.next) return null;
    const m = mapOf(ctx.vars, ctx.params);
    if (!m) return null;
    const es = entriesOf(m[1]);
    const nx = ctx.next.vars;
    const cName = countOf(nx, ctx.params);
    const cd = pairOf(nx, CD);
    if (cName && cd && Number.isInteger(ctx.vars[cName]) && entriesOf(nx[m[0]])?.length === es.length) {
      const c = nx[cd[0]];
      const d = nx[cd[1]];
      const got = nx[cName] - ctx.vars[cName];
      const need = -(c + d);
      if (got !== lookup(es, need)) return null; // a different lookup than the complement: do not guess
      const wrongSign = lookup(es, c + d);
      return options(
        `Next pair from lists 3 and 4: ${c} + ${d} = ${c + d}. By how much does ${cName} grow?`,
        got,
        [wrongSign, got + 1, got ? 0 : 1].filter((x) => x !== got),
        got ? `It needs ${need} from the list, and ${got} pair${got > 1 ? 's' : ''} from lists 1 and 2 sum to ${need}.` : `It needs ${need}, and no pair from lists 1 and 2 sums to ${need}.`,
      );
    }
    const after = entriesOf(nx[m[0]]);
    if (!after || after.length !== es.length) return null;
    const ch = after.find(([k, v]) => es.some(([k2, v2]) => k2 === k && v2 !== v));
    const ab = pairOf(nx, AB);
    if (!ch || !ab || Number(ch[0]) !== nx[ab[0]] + nx[ab[1]]) return null;
    const before = es.find(([k]) => k === ch[0])[1];
    return options(
      `Next pair from lists 1 and 2: ${nx[ab[0]]} + ${nx[ab[1]]} = ${ch[0]}. The list says ${ch[0]} → ${before}. What does it say after?`,
      ch[1],
      [before, 1, ch[1] + 1].filter((x) => x !== ch[1]),
      `${ch[0]} is already on the list, so its count goes up by one: different index pairs with the same sum all count.`,
    );
  },
  bugs: [
    {
      label: 'Remember the sum, not how many pairs',
      find: 'ab.set(a + b, (ab.get(a + b) ?? 0) + 1);',
      replace: 'ab.set(a + b, 1);',
      explain: 'Two pairs with the same sum are stored as one, so every tuple through the second pair is lost: [1,2],[2,1] makes 3 twice.',
    },
    {
      label: 'Look up c + d instead of −(c + d)',
      find: 'ab.get(-(c + d))',
      replace: 'ab.get(c + d)',
      explain: 'The pair needs the sum that cancels it, the opposite number. Looking up c + d counts tuples summing to 2(c + d), not 0.',
    },
  ],
};
