// Boats to Save People (sort + two pointers). People stand on the shore lightest to heaviest; every boat takes the
// heaviest person left, and the lightest squeezes in when the pair fits. Works with l/r, left/right, i/j, lo/hi.
import { options, row, sorted } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
// the sorted shore: a sorted copy (any name) or the input itself once sorted in place
function shoreOf(vars, pName) {
  const p = row(vars[pName]);
  if (!p) return null;
  const copy = Object.entries(vars).find(([k, v]) => k !== pName && row(v) && v.length === p.length && sorted(v));
  return copy ? copy[1] : sorted(p) ? p : null;
}

export default {
  id: 'boats-to-save-people',
  metaphor: 'Heaviest boards first, lightest squeezes in',
  caption: 'The weights are sorted on the shore. Every boat takes the heaviest person still waiting (right pointer); if the lightest (left pointer) also fits under the limit, they ride together.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'boats',
  narrate(ctx) {
    const [pName, limName] = ctx.params;
    const w = shoreOf(ctx.vars, pName);
    const limit = ctx.vars[limName];
    const pair = pairOf(ctx.vars);
    if (!w || !pair || !Number.isInteger(limit)) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    if (Number.isInteger(pl) && l === pl + 1 && r === pr && w[pl] !== undefined && w[r] !== undefined && w[pl] + w[r] <= limit && pl < r) {
      return `the lightest (${w[pl]}) fits beside the heaviest (${w[r]}): ${w[pl]} + ${w[r]} = ${w[pl] + w[r]} ≤ ${limit}, they share a boat`;
    }
    if (Number.isInteger(pr) && r === pr - 1 && w[pr] !== undefined) {
      const left = Math.max(0, r - l + 1);
      return `the heaviest left (${w[pr]}) pushes off in a boat · ${left ? `${left} still on the shore` : 'the shore is empty'}`;
    }
    return null;
  },
  // before the pairing decision: does the lightest fit with the heaviest?
  predict(ctx) {
    const [pName, limName] = ctx.params;
    const w = shoreOf(ctx.vars, pName);
    const limit = ctx.vars[limName];
    const pair = pairOf(ctx.vars);
    if (!w || !pair || !ctx.next || !Number.isInteger(limit)) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (!(l >= 0 && l < r && r < w.length) || (lName in ctx.prev && ctx.prev[lName] !== l)) return null; // l just moved: mid-boat
    const nl = ctx.next.vars[lName];
    const nr = ctx.next.vars[rName];
    const sum = w[l] + w[r];
    // the next step must show the decision, and it must agree with the weights (otherwise the order is unusual)
    const fits = nl === l + 1 && sum <= limit ? true : nl === l && nr === r - 1 && sum > limit ? false : null;
    if (fits === null) return null;
    const yes = `They share: ${w[l]} rides with ${w[r]}`;
    const no = `${w[r]} goes alone`;
    return options(`Lightest ${w[l]}, heaviest ${w[r]}, limit ${limit}. Who gets in the next boat?`, fits ? yes : no, [fits ? no : yes], fits ? `${w[l]} + ${w[r]} = ${sum} ≤ ${limit}, so the lightest squeezes in.` : `${w[l]} + ${w[r]} = ${sum} > ${limit}: even the lightest is too heavy, so nobody can ride with ${w[r]}.`);
  },
  bugs: [
    {
      label: 'while (l < r): the last person is left behind',
      find: 'l <= r',
      replace: 'l < r',
      explain: 'When one person is left, l === r and the loop stops before giving them a boat, so the count is one short.',
    },
    {
      label: 'Default sort: weights sorted as strings',
      find: '.sort((a, b) => a - b)',
      replace: '.sort()',
      explain: 'Without a comparator 10 sorts before 9, so the "heaviest" and "lightest" ends are wrong and the wrong people are paired.',
    },
  ],
};
