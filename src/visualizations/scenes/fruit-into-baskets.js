// Fruit Into Baskets (variable sliding window, at most 2 distinct). Two baskets, one fruit type each: walk right
// picking fruit; a third type forces you to drop trees from the left until a basket is empty. Works with any name
// for the type → count Map and left/l/start/i, right/r/end/j for the window.
import { options, row } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const BEST = ['best', 'max', 'maxLen', 'ans', 'res', 'result', 'longest', 'maxFruits'];
// the type → count Map: a $map whose values are all integers
const basketsOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => Number.isInteger(e[1])));
const asMap = (v) => new Map(v && Array.isArray(v.$map) ? v.$map : []);
const types = (m) => [...m.values()].filter((c) => c > 0).length; // a 0-count key is an empty basket
const show = (m) => [...m].map(([k, c]) => `${k}×${c}`).join(', ') || 'both empty';
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));

export default {
  id: 'fruit-into-baskets',
  metaphor: 'Two baskets, one fruit type each',
  caption: 'The bracket is the stretch of trees you are picking from. Each basket holds one type; when a third type shows up, trees are dropped from the left until one basket is empty again.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const fruits = row(ctx.vars[ctx.params[0]]);
    const b = basketsOf(ctx.vars);
    if (!fruits || !b) return null;
    const now = asMap(b[1]);
    const was = asMap(ctx.prev[b[0]]);
    const pair = pairOf(ctx.vars);
    for (const [k, c] of now) {
      const old = was.get(k) ?? 0;
      if (c === old + 1) {
        if (now.size > 2) return `a type ${k} fruit is picked: that is a third type, too many for two baskets, so drop trees from the left`;
        return `pick a type ${k} fruit (${c} of type ${k} now) · baskets: ${show(now)}`;
      }
      if (c === old - 1) return `drop a type ${k} fruit from the left end${c === 0 ? ': none of type ' + k + ' left, empty that basket' : ` (${c} of type ${k} left)`}`;
    }
    for (const [k] of was) if (!now.has(k)) return `type ${k} is gone from the window: its basket is free again · baskets: ${show(now)}`;
    if (pair) {
      const [lName, rName] = pair;
      const l = ctx.vars[lName];
      const r = ctx.vars[rName];
      if (Number.isInteger(ctx.prev[lName]) && l === ctx.prev[lName] + 1) return `the window now starts at tree ${l}: trees ${l}..${r} (${Math.max(0, r - l + 1)} fruit${r > l ? 's' : ''})`;
      const best = BEST.find((n) => Number.isInteger(ctx.vars[n]) && Number.isInteger(ctx.prev[n]) && ctx.vars[n] > ctx.prev[n]);
      if (best && ctx.vars[best] === r - l + 1) return `new best: trees ${l}..${r} give ${r - l + 1} fruit${r > l ? 's' : ''} from ${types(now)} type${types(now) > 1 ? 's' : ''}`;
    }
    return null;
  },
  // both baskets in use and a new fruit is about to be picked: does it fit?
  predict(ctx) {
    const b = basketsOf(ctx.vars);
    if (!b || !ctx.next) return null;
    const now = asMap(b[1]);
    const after = asMap(ctx.next.vars[b[0]]);
    if (types(now) !== 2) return null;
    const added = [...after].find(([k, c]) => c === (now.get(k) ?? 0) + 1);
    if (!added) return null;
    const [k] = added;
    const fits = types(after) <= 2;
    const yes = `It fits: type ${k} already has a basket`;
    const no = 'A third type: drop trees from the left';
    return options(`The baskets hold ${show(now)}. The next tree has type ${k}. What happens?`, fits ? yes : no, [fits ? no : yes], fits ? `Type ${k} is one of the two types already in the baskets, so the window just grows.` : `Types ${[...now.keys()].join(' and ')} fill both baskets, so type ${k} needs one emptied first.`);
  },
  bugs: [
    {
      label: 'Never delete a type whose count hits 0',
      find: 'if (count.get(t) === 0) count.delete(t);',
      replace: '',
      explain: 'A type with 0 fruits still takes a basket, so the Map size never drops back to 2 and the window shrinks to nothing.',
    },
    {
      label: 'Allow three types: while (size > 3)',
      find: 'count.size > 2',
      replace: 'count.size > 3',
      explain: 'You only have two baskets, but the window keeps going with three types, so the answer is too big.',
    },
  ],
};
