// Sum of Scores of Built Strings (Z-algorithm). Slide each suffix of s under s itself and measure how far they match
// from the left: that length is the suffix's score, z[i]. The z-box [l, r) is the furthest stretch already known to
// copy the start of s, so a suffix inside it starts from its mirror's score instead of 0. The score table is the first
// working number array of length n; the box and running total are read under common names only.
import { row } from './util.js';

const TOTAL = ['total', 'sum', 'ans', 'res', 'result', 'score', 'scores'];
const isInt = Number.isInteger;

function table(ctx) {
  const s = ctx.vars[ctx.params[0]];
  if (typeof s !== 'string') return null;
  const name = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && row(ctx.vars[k]) && ctx.vars[k].length === s.length && ctx.vars[k].every(isInt));
  return name ? [s, name, ctx.vars[name]] : null;
}

/** the z-box ends under common names: [l, r, rName] */
const boxOf = (v) => (isInt(v.l) && isInt(v.r) ? [v.l, v.r, 'r'] : isInt(v.L) && isInt(v.R) ? [v.L, v.R, 'R'] : isInt(v.left) && isInt(v.right) ? [v.left, v.right, 'right'] : []);

/** the suffix cursor under common names: [name, value] */
const cursorOf = (v) => {
  const k = ['i', 'j', 'idx', 'pos', 'k'].find((x) => isInt(v[x]));
  return k ? [k, v[k]] : [];
};

const short = (t) => (t.length > 14 ? `${t.slice(0, 13)}…` : t);

export default {
  id: 'sum-of-scores-of-built-strings',
  metaphor: 'Slide each suffix under the string',
  caption: 'z[i] is how far the suffix starting at i matches the start of s: its score. The z-box [l, r) is a stretch already known to copy the start, so suffixes inside it reuse an earlier score.',
  pointers: ['i', 'l', 'r', 'L', 'R'],
  narrate(ctx) {
    const t = table(ctx);
    if (!t) return null;
    const [s, zn, z] = t;
    const pz = row(ctx.prev[zn]);
    const n = s.length;
    const [iName, i] = cursorOf(ctx.vars);
    const [l, r, rName] = boxOf(ctx.vars);
    const box = isInt(l);
    if (isInt(i) && i !== ctx.prev[iName] && i > 0 && i < n) {
      const suf = `suffix "${short(s.slice(i))}" (${iName} = ${i})`;
      if (box && i < r && l < i) {
        const start = z[i];
        // no verdict on the next letter: the card asked here is "does the match grow?"
        return `${suf} is inside the box [${l}, ${r}): mirror ${zn}[${i - l}] = ${z[i - l]}, cap ${rName} − ${iName} = ${r - i} → start at ${start}`;
      }
      return `${suf}: nothing known about it yet, compare from its first letter`;
    }
    if (pz && pz.length === z.length) {
      const d = z.map((x, k) => (x === pz[k] ? -1 : k)).filter((k) => k >= 0);
      if (d.length === 1) {
        const k = d[0];
        if (k === 0 && z[0] === n) return `the whole string matches itself: z[0] = ${n} (the last built string is s)`;
        if (z[k] === pz[k] + 1 && k + z[k] <= n) return `s[${z[k] - 1}] = '${s[z[k] - 1]}' matches s[${k + z[k] - 1}] = '${s[k + z[k] - 1]}': suffix ${k} matches ${z[k]} letter${z[k] === 1 ? '' : 's'} so far`;
      }
    }
    if (box && r !== ctx.prev[rName] && isInt(ctx.prev[rName]) && l < r) return `the match reaches index ${r - 1}: the box moves to [${l}, ${r}), "${short(s.slice(l, r))}" copies "${short(s.slice(0, r - l))}"`;
    const tn = TOTAL.find((k) => isInt(ctx.vars[k]) && isInt(ctx.prev[k]) && ctx.vars[k] > ctx.prev[k]);
    if (tn && isInt(i) && i < n) return `suffix "${short(s.slice(i))}" scores ${ctx.vars[tn] - ctx.prev[tn]}: ${tn} = ${ctx.vars[tn]}`;
    const same = TOTAL.find((k) => isInt(ctx.vars[k]) && ctx.vars[k] === ctx.prev[k] && new RegExp(`\\b${k}\\s*\\+=`).test(ctx.src || ''));
    if (same && isInt(i) && i < n) return `suffix "${short(s.slice(i))}" scores 0: ${same} stays ${ctx.vars[same]}`;
    return null;
  },
  // when a new suffix arrives: does its next letter match the start of s?
  predict(ctx) {
    const t = table(ctx);
    const [iName, i] = cursorOf(ctx.vars);
    if (!t || !ctx.next || !isInt(i) || i === ctx.prev[iName] || i < 1) return null;
    const [s, zn, z] = t;
    const k = z[i];
    if (!isInt(k) || i + k >= s.length) return null;
    const [l, r] = boxOf(ctx.vars);
    if (isInt(l) && l < i && i < r && k !== Math.min(r - i, z[i - l])) return null; // the box start is not copied yet
    const nz = row(ctx.next.vars[zn]);
    if (!nz || ctx.next.vars[iName] !== i) return null;
    const eq = s[k] === s[i + k];
    const grew = nz[i] === k + 1;
    if (grew !== eq || (!grew && nz[i] !== k)) return null; // not a plain one-letter compare: do not guess
    return {
      question: `Suffix ${i} matches ${k} letter${k === 1 ? '' : 's'} so far. Does it match one more (s[${k}] vs s[${i + k}])?`,
      options: ['Yes: the match grows by 1', 'No: the match stops here'],
      answer: grew ? 0 : 1,
      explain: grew ? `s[${k}] = '${s[k]}' and s[${i + k}] = '${s[i + k]}' are the same letter, so the match grows.` : `s[${k}] = '${s[k]}' but s[${i + k}] = '${s[i + k]}': the suffix scores ${k}.`,
    };
  },
  bugs: [
    {
      label: 'Forget that s itself scores n',
      find: 'let total = n;',
      replace: 'let total = 0;',
      explain: 'The last built string is s itself and matches all n letters; leaving it out makes "babab" sum to 4 instead of 9.',
    },
    {
      label: 'Copy the mirror without the cap',
      find: 'Math.min(r - i, z[i - l])',
      replace: 'z[i - l]',
      explain: 'The box only vouches for letters up to r. In "babab", i = 4 copies z[2] = 3 although only 1 letter is left, so the suffix "b" scores 3.',
    },
  ],
};
