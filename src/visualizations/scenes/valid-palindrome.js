// Valid Palindrome (two pointers, skip junk). Read the sentence from both ends at once like a mirror: spaces and
// punctuation are skipped, letters are compared without case. Works on s itself or a cleaned copy, with l/r,
// left/right, i/j, lo/hi, start/end.
import { options } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const alnum = (c) => typeof c === 'string' && /^[a-z0-9]$/i.test(c);
const show = (c) => (c === ' ' ? 'a space' : `'${c}'`);
// the string the pointers walk: a cleaned lowercase copy when there is one, else the parameter
function textOf(vars, sName) {
  const s = vars[sName];
  if (typeof s !== 'string') return null;
  const clean = Object.entries(vars).find(([k, v]) => k !== sName && typeof v === 'string' && v.length <= s.length && /^[a-z0-9]*$/.test(v) && v.length > 1);
  return clean ? clean[1] : s;
}

export default {
  id: 'valid-palindrome',
  metaphor: 'Reading a sentence in a mirror',
  caption: 'One finger starts at each end. Spaces and punctuation are stepped over; the two letters under the fingers must match (ignoring case) before both move inward.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  narrate(ctx) {
    const s = textOf(ctx.vars, ctx.params[0]);
    const pair = pairOf(ctx.vars);
    if (!s || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    if (!Number.isInteger(pl) || !Number.isInteger(pr)) return null;
    const lMoved = l === pl + 1;
    const rMoved = r === pr - 1;
    if (lMoved && !alnum(s[pl]) && r === pr) return `skip ${show(s[pl])} at ${pl} on the left: not a letter or digit`;
    if (rMoved && !alnum(s[pr]) && l === pl) return `skip ${show(s[pr])} at ${pr} on the right: not a letter or digit`;
    // a matched pair: both fingers move (one step or two, so narrate the first half only)
    if (lMoved && alnum(s[pl]) && (rMoved || r === pr) && alnum(s[pr])) {
      const same = s[pl] === s[pr] ? '' : ' (same letter, different case)';
      return `${show(s[pl])} at ${pl} matches ${show(s[pr])} at ${pr}${same}: both fingers step inward`;
    }
    return null;
  },
  // both fingers on letters / digits: do they match? Ask only for the interesting pairs (case, digits, mismatch)
  predict(ctx) {
    const s = textOf(ctx.vars, ctx.params[0]);
    const pair = pairOf(ctx.vars);
    if (!s || !pair || !ctx.next) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (!(l >= 0 && l < r && r < s.length) || !alnum(s[l]) || !alnum(s[r])) return null;
    if (lName in ctx.prev && ctx.prev[lName] !== l && ctx.prev[rName] === r && alnum(s[ctx.prev[lName]])) return null; // half-done step: r has not moved yet
    const nl = ctx.next.vars[lName];
    const nr = ctx.next.vars[rName];
    const ret = /\breturn\s+false\b/.test(ctx.lines[ctx.next.line - 1] || '');
    const match = nl === l + 1 && (nr === r || nr === r - 1) ? true : nl === l && nr === r && ret ? false : null;
    if (match === null || match !== (s[l].toLowerCase() === s[r].toLowerCase())) return null;
    if (match && s[l] === s[r] && !/\d/.test(s[l])) return null; // identical letters: nothing to think about
    const yes = 'They match: both fingers step inward';
    const no = 'Mismatch: not a palindrome';
    return options(
      `The left finger is on ${show(s[l])} (index ${l}), the right on ${show(s[r])} (index ${r}). What happens?`,
      match ? yes : no,
      [match ? no : yes],
      match ? `${show(s[l])} and ${show(s[r])} are the same once lowercased.` : `${show(s[l])} and ${show(s[r])} differ even ignoring case, so the mirror image breaks here.`,
    );
  },
  bugs: [
    {
      label: 'Digits treated as junk',
      find: '(c >= 48 && c <= 57) ||   // 0-9',
      replace: '',
      explain: 'Digits count as characters: in "0P" the 0 is skipped, P is compared with itself, and the run says true where "0p" is not a palindrome.',
    },
    {
      label: 'Compare without lowercasing',
      find: 's[l].toLowerCase() !== s[r].toLowerCase()',
      replace: 's[l] !== s[r]',
      explain: '"A" and "a" are the same letter here, so "A man, a plan, a canal: Panama" is wrongly rejected at its very first pair.',
    },
  ],
};
