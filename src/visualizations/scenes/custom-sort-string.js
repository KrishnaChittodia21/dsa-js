// Custom Sort String. Letter tiles from s go into 26 tally boxes; then the tiles are laid down box by box in the
// order the string `order` dictates, and leftover letters (not in order) go at the end. Works with any string the
// learner builds up (out / res / ans …) and a 26-cell tally array.
import { changedIdx, entriesOf, options, row } from './util.js';

const L = (k) => String.fromCharCode(97 + k);
const tiles = (k, c) => `${k} '${c}' tile${k === 1 ? '' : 's'}`;

/** [name, value] of a non-parameter string var that grew from prev to vars (or from vars to next) */
function grown(params, before, after) {
  return Object.entries(after).find(([k, v]) => !params.includes(k) && typeof v === 'string' && typeof before[k] === 'string' && v.length > before[k].length && v.startsWith(before[k])) || null;
}
const tally = (vars) => Object.values(vars).find((v) => row(v) && v.length === 26 && v.every(Number.isInteger)) || null;

export default {
  id: 'custom-sort-string',
  metaphor: 'Laying down letter tiles in a house order',
  caption: 'The 26 boxes count the tiles of each letter in s. Then the boxes are emptied in the order the string order dictates; letters order never mentions are laid down at the end.',
  narrate(ctx) {
    const [oName, sName] = ctx.params;
    const order = ctx.vars[oName];
    if (typeof order !== 'string') return null;
    const g = grown(ctx.params, ctx.prev, ctx.vars);
    if (g) {
      const [name, v] = g;
      const add = v.slice(ctx.prev[name].length);
      const c = add[0];
      if (!/^[a-z]+$/.test(add) || ![...add].every((x) => x === c)) return null;
      const where = order.includes(c) ? `'${c}' is next in order` : `'${c}' is not in order, so it goes at the end`;
      return `${where}: lay down ${tiles(add.length, c)} → "${v}"`;
    }
    const t = tally(ctx.vars);
    const tp = tally(ctx.prev);
    if (t && tp) {
      const d = changedIdx(t, tp);
      if (d.length === 1 && t[d[0]] === tp[d[0]] + 1) return `tile '${L(d[0])}' from ${sName} goes into its box (${t[d[0]]} so far)`;
    }
    for (const [k, v] of Object.entries(ctx.vars)) {
      const now = entriesOf(v);
      const was = entriesOf(ctx.prev[k]);
      if (!now || !was) continue;
      const old = new Map(was);
      const up = now.filter(([c, x]) => x === (old.get(c) || 0) + 1);
      if (up.length === 1 && now.length >= was.length) return `tile '${up[0][0]}' from ${sName} goes into its box (${up[0][1]} so far)`;
    }
    return null;
  },
  // before tiles are laid down: the first letter of order, or the first leftover letter
  predict(ctx) {
    if (!ctx.next) return null;
    const order = ctx.vars[ctx.params[0]];
    const g = grown(ctx.params, ctx.vars, ctx.next.vars);
    if (typeof order !== 'string' || !g) return null;
    const [name, after] = g;
    const now = ctx.vars[name];
    const add = after.slice(now.length);
    const c = add[0];
    if (!/^[a-z]+$/.test(add) || ![...add].every((x) => x === c)) return null;
    const inOrder = order.includes(c);
    const first = inOrder && now === '';
    const firstLeftover = !inOrder && [...now].every((x) => order.includes(x));
    if (!first && !firstLeftover && add.length < 2) return null;
    const q = inOrder ? `'${c}' is next in order. What is ${name} after its tiles are laid down?` : `'${c}' is not in order at all. What is ${name} after this step?`;
    const wrong = [now, now + c, now + c + c, c + now].filter((w) => w !== after).map((w) => `"${w}"`);
    return options(q, `"${after}"`, wrong, inOrder ? `s holds ${tiles(add.length, c)}, and all of them go down together.` : `Letters order never mentions are kept, not dropped: all ${tiles(add.length, c)} go after the ordered part.`);
  },
  bugs: [
    {
      label: 'Drop letters that are not in order',
      find: 'out += String.fromCharCode(97 + k).repeat(count[k]);',
      replace: '',
      explain: 'The leftover tiles never go down, so the answer is shorter than s: "abcd" with order "cba" gives "cba" instead of "cbad".',
    },
    {
      label: 'One tile per letter',
      find: 'c.repeat(count[k])',
      replace: "(count[k] ? c : '')",
      explain: 'A letter that appears twice in s goes down only once, so repeated letters go missing ("abxyzab" loses an a and a b).',
    },
  ],
};
