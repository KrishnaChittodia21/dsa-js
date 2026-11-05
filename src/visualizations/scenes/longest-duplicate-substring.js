// Longest Duplicate Substring (binary search on the length + rolling-hash fingerprints). Each round guesses a
// length L and slides an L-letter window along s, giving every window a fingerprint (a number computed from its
// letters) and dropping it into a box; a fingerprint already in the box means the window appeared before. A repeat
// of length L means every shorter length repeats too, so the guesses can halve the range like a binary search.
import { firstInt, options, row } from './util.js';

const PAIRS = [['lo', 'hi'], ['left', 'right'], ['low', 'high'], ['l', 'r']];
const MID = ['mid', 'm', 'len', 'L', 'length', 'size'];
const WLEN = ['L', 'len', 'length', 'size', 'mid', 'm', 'w', 'windowLen', 'k'];
const WAT = ['i', 'start', 'j', 'idx', 'pos', 'st'];
const FP = ['k', 'key', 'hash', 'h', 'fp', 'code', 'cur', 'curr', 'sub', 'substr', 'piece', 'part', 'chunk', 'window', 'w', 'str'];
const q = (x) => `'${x}'`;
const pl = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
const setOf = (vars) => Object.entries(vars).find(([, v]) => v && v.$set);
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));

/** a round of the check: the box of fingerprints, the window length and where the window starts */
function round(ctx, vars) {
  const s = vars[ctx.params[0]];
  const box = setOf(vars);
  if (typeof s !== 'string' || !box) return null;
  const lName = WLEN.find((x) => Number.isInteger(vars[x]) && vars[x] > 0 && vars[x] < s.length);
  const iName = WAT.find((x) => x !== lName && Number.isInteger(vars[x]) && vars[x] >= 0);
  if (!lName || !iName) return null;
  const L = vars[lName];
  const i = vars[iName];
  if (i + L > s.length) return null;
  return { s, box: box[1], boxName: box[0], L, i, iName, win: s.slice(i, i + L) };
}

export default {
  id: 'longest-duplicate-substring',
  metaphor: 'Fingerprinting windows to spot a twin',
  caption: 'Each round guesses a length and slides a window of that length along s. Every window gets a fingerprint; one already in the box means the window has a twin. A twin of length L means one of every shorter length too, so the guesses halve the range.',
  range: PAIRS,
  narrate(ctx) {
    const sName = ctx.params[0];
    const s = ctx.vars[sName];
    if (typeof s !== 'string') {
      return null;
    }
    const r = round(ctx, ctx.vars);
    if (r) {
      const at = `(cells ${r.i}..${r.i + r.L - 1})`;
      const before = setOf(ctx.prev);
      if (before && before[0] === r.boxName && r.box.$size === before[1].$size + 1) return `${q(r.win)} ${at} is new: its fingerprint goes into the box (${r.box.$size} seen)`;
      const fp = FP.find((x) => x in ctx.vars && x !== r.iName && ctx.vars[x] !== ctx.prev[x]);
      if (fp) return `window ${q(r.win)} ${at} gets its fingerprint`;
      return null;
    }
    // inside a helper that cuts one window's fingerprint out of the running (prefix) fingerprints
    const n = s.length;
    const cut = [['l', 'r'], ['start', 'end'], ['i', 'j']].find(([a, b]) => Number.isInteger(ctx.vars[a]) && Number.isInteger(ctx.vars[b]));
    if (cut && !firstInt(ctx.vars, MID)[0] && new RegExp(`\\[\\s*${cut[1]}\\s*\\]`).test(ctx.src)) {
      const [a, b] = cut.map((x) => ctx.vars[x]);
      if (a >= 0 && a < b && b <= n && (a !== ctx.prev[cut[0]] || b !== ctx.prev[cut[1]])) {
        return `fingerprint of ${q(s.slice(a, b))}: ${a ? `the one of the first ${pl(b, 'letter')} minus the one of the first ${a}, shifted ${pl(b - a, 'place')}` : `the one of the first ${pl(b, 'letter')} as it is`}`;
      }
    }
    // running fingerprints of every prefix, built once
    // (only the first such table: a second modulus or the powers of the base would repeat the same story)
    const hk = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && /^(h|hash|pre|fp)/i.test(k) && row(ctx.vars[k]) && ctx.vars[k].length === n + 1);
    const hp = hk && row(ctx.prev[hk]);
    if (hp && hp.length === n + 1) {
      const d = ctx.vars[hk].findIndex((x, j) => x !== hp[j]);
      if (d >= 1) return `${hk}[${d}]: fingerprint of the first ${pl(d, 'letter')} ${q(s.slice(0, d))} (the previous one × base + ${q(s[d - 1])})`;
    }
    const box = setOf(ctx.vars);
    if (box) {
      const [lName, L] = firstInt(ctx.vars, WLEN);
      return box[1].$size === 0 && !setOf(ctx.prev) && lName ? `round for length ${L}: an empty box of fingerprints` : null;
    }
    const pair = pairOf(ctx.vars);
    const [mName, mid] = firstInt(ctx.vars, MID);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (mName && setOf(ctx.prev)) return `the round for length ${mid} is over`;
    if (mName && mid !== ctx.prev[mName]) return `guess length ${mid} (lengths ${lo}..${hi} still open): does some ${mid}-letter window appear twice?`;
    const bs = ['bestStart', 'ansStart', 'resStart'].find((x) => Number.isInteger(ctx.vars[x]) && x in ctx.prev && ctx.vars[x] !== ctx.prev[x]);
    const [blName, bl] = firstInt(ctx.vars, ['bestLen', 'maxLen', 'best', 'ansLen', 'resLen', 'length']);
    if (bs && blName && bl > 0 && ctx.vars[bs] >= 0) return `the twin starts at cell ${ctx.vars[bs]}: ${q(s.slice(ctx.vars[bs], ctx.vars[bs] + bl))} is the best so far`;
    if (blName && bl !== ctx.prev[blName] && blName in ctx.prev) return `a ${bl}-letter window has a twin: remember length ${bl}`;
    if (lo > hi && (lo !== ctx.prev[loName] || hi !== ctx.prev[hiName])) return `${loName} passed ${hiName}: no length is left to try, the best twin found is the answer`;
    if (lo !== ctx.prev[loName] && loName in ctx.prev) return `a twin exists, so try longer: lengths ${lo}..${hi} remain`;
    if (hi !== ctx.prev[hiName] && hiName in ctx.prev) return `no twin of that length, so none longer either: lengths ${lo}..${hi} remain`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const r = round(ctx, ctx.vars);
    if (r) {
      // a window just got its fingerprint: twin or new?
      const nb = setOf(ctx.next.vars);
      const before = setOf(ctx.prev);
      if ((before && before[1].$size !== r.box.$size) || (r.i !== ctx.prev[r.iName] && !FP.some((x) => x in ctx.vars && x !== r.iName && ctx.vars[x] !== ctx.prev[x]))) return null;
      const twin = ctx.next.ret === true && (!nb || nb[1].$size === r.box.$size);
      const fresh = nb && nb[0] === r.boxName && nb[1].$size === r.box.$size + 1;
      if (!twin && !fresh) return null;
      const seenAt = r.s.indexOf(r.win);
      if (r.i !== 1 && !(seenAt >= 0 && seenAt < r.i)) return null;
      const yes = 'Already in the box: a twin, stop the round';
      const no = 'New: put it in the box and slide on';
      return options(
        `Window ${q(r.win)} (cells ${r.i}..${r.i + r.L - 1}) has its fingerprint. Is that fingerprint already in the box?`,
        twin ? yes : no,
        [twin ? no : yes],
        twin ? `${q(r.win)} already appeared at cell ${seenAt}, so its fingerprint is in the box: a ${r.L}-letter twin exists.` : `No earlier ${r.L}-letter window spells ${q(r.win)}, so the fingerprint is new.`,
      );
    }
    // a round just finished: longer or shorter?
    const pair = pairOf(ctx.vars);
    const [mName, mid] = firstInt(ctx.vars, MID);
    if (!pair || !mName || setOf(ctx.vars) || !Object.keys(ctx.prev).length) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const keys = Object.keys(ctx.vars).filter((k) => k !== mName && Number.isInteger(ctx.vars[k]) && k in ctx.prev && !/^(n|i|j)$/.test(k));
    if (keys.some((k) => ctx.vars[k] !== ctx.prev[k])) return null;
    if (!setOf(ctx.prev)) return null; // ask only right after a round's box is gone
    const best = Object.keys(ctx.vars).some((k) => /best|max|ans|res/i.test(k) && k in nx && nx[k] !== ctx.vars[k]);
    const up = nx[loName] > ctx.vars[loName] || best;
    const down = nx[hiName] < ctx.vars[hiName];
    if (up === down || ctx.vars[loName] >= ctx.vars[hiName]) return null;
    const longer = `Only lengths longer than ${mid}`;
    const shorter = `Only lengths shorter than ${mid}`;
    return options(
      `The round for length ${mid} is over. Which lengths are still worth trying?`,
      up ? longer : shorter,
      [up ? shorter : longer],
      up ? `A ${mid}-letter twin was found, and cutting one letter off both copies gives a twin of every shorter length, so only longer ones can improve.` : `No ${mid}-letter window has a twin; a longer twin would contain a ${mid}-letter one, so only shorter lengths are left.`,
    );
  },
  bugs: [
    {
      label: 'After a twin is found, search shorter',
      find: 'lo = mid + 1;',
      replace: 'hi = mid - 1;',
      explain: 'A twin of length L says nothing is wrong with L: the answer is L or longer. Searching shorter throws the better lengths away and returns a too-short twin.',
    },
    {
      label: 'The last window is never checked',
      find: 'i + L <= n',
      replace: 'i + L < n',
      explain: 'The window that ends at the last letter is skipped, so a twin whose second copy sits at the very end of s is missed.',
    },
  ],
};
