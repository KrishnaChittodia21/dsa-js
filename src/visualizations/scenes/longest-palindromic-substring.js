// Longest Palindromic Substring. Expand around every centre: two hands start on a letter (or on the two letters of
// a gap) and step apart while the letters under them match; the longest stretch any centre reaches wins. Also reads
// the DP version: a true/false table where s[i..j] is a palindrome when its ends match and its middle is one.
// Hands may be l/r, left/right, lo/hi; the window is s[l+1..r-1] after a move when the loop compares s[l] with s[r],
// s[l..r] when it compares s[l - 1] with s[r + 1].
import { firstInt, writtenCell } from './util.js';

const LEFT = ['l', 'left', 'lo', 'L', 'low'];
const RIGHT = ['r', 'right', 'hi', 'R', 'high'];
const BEST = ['bestLen', 'maxLen', 'maxLength', 'bestLength', 'longest', 'best', 'max', 'resLen', 'ansLen', 'maxlen', 'len_max'];
const START = ['start', 'bestStart', 'begin', 'resStart', 'st', 'from', 'ansStart'];
const RES = ['res', 'result', 'ans', 'answer', 'best', 'longest', 'out', 'bestStr', 'pal'];
const q = (x) => `'${x}'`;
const isPal = (x) => typeof x === 'string' && x.length > 0 && x === [...x].reverse().join('');
const esc = (x) => x.replace(/\$/g, '\\$');

function hands(vars) {
  const ln = LEFT.find((x) => Number.isInteger(vars?.[x]));
  const rn = RIGHT.find((x) => Number.isInteger(vars?.[x]));
  return ln && rn ? { ln, rn, l: vars[ln], r: vars[rn] } : null;
}
const move = (a, b) => (a && b && a.ln === b.ln && a.rn === b.rn ? { dl: b.l - a.l, dr: b.r - a.r } : null);
const moveRe = (h) => new RegExp(`(?:\\b${esc(h.ln)}\\s*(?:--|-=\\s*1|=\\s*${esc(h.ln)}\\s*-\\s*1)|--\\s*${esc(h.ln)}\\b|\\b${esc(h.rn)}\\s*(?:\\+\\+|\\+=\\s*1|=\\s*${esc(h.rn)}\\s*\\+\\s*1)|\\+\\+\\s*${esc(h.rn)}\\b|\\[\\s*${esc(h.ln)}\\s*,\\s*${esc(h.rn)}\\s*\\]\\s*=)`);

/** which hand the code moves first ('l' or 'r'), from the order of the two moves in the code */
function firstHand(lines, h) {
  const code = (lines || []).join('\n');
  const a = code.search(new RegExp(`\\b${esc(h.ln)}\\s*(?:--|-=)|--\\s*${esc(h.ln)}\\b`));
  const b = code.search(new RegExp(`\\b${esc(h.rn)}\\s*(?:\\+\\+|\\+=)|\\+\\+\\s*${esc(h.rn)}\\b`));
  if (a < 0 || b < 0) return null;
  return a < b ? 'l' : 'r';
}

/** the window form: true when the loop compares s[l - 1] with s[r + 1] (window s[l..r]) */
const inclusive = (lines, h) => new RegExp(`\\[\\s*${esc(h.ln)}\\s*-\\s*1\\s*\\]`).test((lines || []).join('\n'));

/** the stretch the hands have proven, and the pair of cells they test next */
function windowOf(lines, h) {
  return inclusive(lines, h) ? { a: h.l, b: h.r, cl: h.l - 1, cr: h.r + 1 } : { a: h.l + 1, b: h.r - 1, cl: h.l, cr: h.r };
}

/** a step where one hand moved and the other one follows in the next step (a half-done move) */
function halfDone(ctx, h) {
  const nh = hands(ctx.next?.vars);
  const first = firstHand(ctx.lines, h);
  const nm = move(h, nh);
  if (!first || !nm) return false;
  const onlyL = (m) => m.dl === -1 && m.dr === 0;
  const onlyR = (m) => m.dl === 0 && m.dr === 1;
  const otherNext = first === 'l' ? onlyR(nm) : onlyL(nm);
  const cm = move(hands(ctx.prev), h);
  const firstNow = cm ? (first === 'l' ? onlyL(cm) : onlyR(cm)) : true;
  return otherNext && firstNow;
}

/** the hands have just finished a step apart */
function settled(ctx) {
  const h = hands(ctx.vars);
  if (!h || ctx.ret || !moveRe(h).test(ctx.src || '') || halfDone(ctx, h)) return null;
  return h;
}

const centreOf = (s, a, b) => ((a + b) % 2 === 0 ? `the centre ${q(s[(a + b) / 2])} (cell ${(a + b) / 2})` : `the gap between cells ${(a + b - 1) / 2} and ${(a + b + 1) / 2}`);

/** the best-so-far: { name, value, text } (a start + length pair, or a result string) */
function bestOf(vars, s, params) {
  const [bn, bl] = firstInt(vars, BEST);
  const [sn, st] = firstInt(vars, START);
  if (bn && sn && bl > 0 && isPal(s.slice(st, st + bl)) && st + bl <= s.length) return { names: [bn, sn], len: bl, text: s.slice(st, st + bl), st };
  const rn = RES.find((k) => !params.includes(k) && typeof vars[k] === 'string');
  if (rn && isPal(vars[rn]) && s.includes(vars[rn])) return { names: [rn], len: vars[rn].length, text: vars[rn] };
  if (bn) return { names: [bn], len: bl };
  return null;
}

/** a boolean palindrome table (not a parameter) and the cell this line writes */
function tableCell(vars, src, params, s) {
  const w = writtenCell(src, vars);
  if (!w || w.at.length !== 2 || params.includes(w.name)) return null;
  const g = vars[w.name];
  if (!Array.isArray(g) || g.length !== s.length || !Array.isArray(g[0])) return null;
  const [i, j] = w.at;
  if (!(i >= 0 && j >= i && j < s.length)) return null;
  const v = g[i]?.[j];
  if (typeof v !== 'boolean' && v !== 0 && v !== 1) return null;
  return { i, j, v: !!v, sub: s.slice(i, j + 1), mid: s.slice(i + 1, j) };
}

export default {
  id: 'longest-palindromic-substring',
  metaphor: 'Two hands spreading from each centre',
  caption: 'Every letter and every gap between two letters is a centre. Two hands step apart from it while the letters under them match; the widest stretch any centre reaches is the answer.',
  pointers: [...LEFT, ...RIGHT],
  narrate(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string') return null;
    if (ctx.ret && !ctx.next && typeof ctx.value === 'string') return `the longest palindrome is ${q(ctx.value)} (${ctx.value.length} letter${ctx.value.length === 1 ? '' : 's'})`;
    // DP table: one cell per stretch s[i..j]
    const c = tableCell(ctx.vars, ctx.src, ctx.params, s);
    if (c) {
      const at = `${ctx.params[0]}[${c.i}..${c.j}] = ${q(c.sub)}`;
      if (c.i === c.j) return `${at}: one letter alone is a palindrome`;
      if (c.j === c.i + 1) return c.v ? `${at}: two equal letters, a palindrome` : `${at}: two different letters, not a palindrome`;
      if (c.v) return `${at}: ends match and the middle ${q(c.mid)} is a palindrome`;
      return s[c.i] !== s[c.j] ? `${at}: ends ${q(s[c.i])} and ${q(s[c.j])} differ, not a palindrome` : `${at}: ends match but the middle ${q(c.mid)} is not a palindrome`;
    }
    const h = hands(ctx.vars);
    // the helper hands back what this centre reached
    if (ctx.ret && h) {
      const w = windowOf(ctx.lines, h);
      const pal = typeof ctx.value === 'string' ? ctx.value : s.slice(w.a, w.b + 1);
      const where = centreOf(s, w.cl, w.cr);
      if (!pal) return w.cl < 0 || w.cr >= s.length ? 'no gap after the last letter: nothing to spread from' : `${where}: the two letters differ, no palindrome there`;
      return `${where} reaches ${q(pal)}: ${pal.length} letter${pal.length === 1 ? '' : 's'}`;
    }
    const m = settled(ctx);
    if (m) {
      const w = windowOf(ctx.lines, m);
      const pal = s.slice(w.a, w.b + 1);
      if (!isPal(pal)) return null;
      if (w.cl < 0 || w.cr >= s.length) return `${q(pal)} reads the same both ways, and a hand is past the ${w.cl < 0 ? 'left' : 'right'} end`;
      return `${q(pal)} reads the same both ways: the hands step out to cells ${w.cl} and ${w.cr}`;
    }
    // the best so far changed
    const b = bestOf(ctx.vars, s, ctx.params);
    const pb = bestOf(ctx.prev, s, ctx.params);
    const writes = (src) => b?.names.some((k) => new RegExp(`^\\s*(?:let\\s+|const\\s+)?${esc(k)}\\s*=(?!=)`).test(src || ''));
    if (b && pb && (b.names.some((k) => ctx.vars[k] !== ctx.prev[k]) || writes(ctx.src))) {
      const writesStart = (src) => b.names.length > 1 && new RegExp(`^\\s*${esc(b.names[1])}\\s*=(?!=)`).test(src || '');
      const startNext = ctx.next && writesStart(ctx.lines?.[ctx.next.line - 1]) && !writesStart(ctx.src);
      if (b.text && b.text.length === b.len && !startNext) return `new longest: ${q(b.text)}${Number.isInteger(b.st) ? ` (cells ${b.st}..${b.st + b.len - 1})` : ''}, ${b.len} letter${b.len === 1 ? '' : 's'}`;
      if (Number.isInteger(pb.len) && b.len > pb.len) return `${b.len} letter${b.len === 1 ? ' beats' : 's beat'} the best so far (${pb.len})`;
    }
    return null;
  },
  predict(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string' || !ctx.next) return null;
    // DP: before a stretch with matching ends is decided
    const c = tableCell(ctx.next.vars, ctx.lines?.[ctx.next.line - 1], ctx.params, s);
    if (c) {
      // a line that only ever writes `true` has nothing to decide
      if (c.j - c.i < 2 || s[c.i] !== s[c.j] || /=\s*(true|1)\s*;?\s*(\/\/.*)?$/.test(ctx.lines?.[ctx.next.line - 1] || '')) return null;
      return {
        question: `${ctx.params[0]}[${c.i}..${c.j}] = ${q(c.sub)}: both ends are ${q(s[c.i])}. Is it a palindrome?`,
        options: ['Yes', 'No'],
        answer: c.v ? 0 : 1,
        explain: c.v ? `The ends match and the middle ${q(c.mid)} was already marked a palindrome.` : `The ends match, but the middle ${q(c.mid)} is not a palindrome, so the whole stretch is not either.`,
      };
    }
    // expanding: do the hands step out again?
    const m = settled(ctx);
    if (m) {
      const w = windowOf(ctx.lines, m);
      if (w.cl < 0 || w.cr >= s.length || !isPal(s.slice(w.a, w.b + 1))) return null;
      const nh = hands(ctx.next.vars);
      const nm = move(m, nh);
      const again = nm && (nm.dl < 0 || nm.dr > 0);
      const stop = ctx.next.ret || !nh;
      if (!again && !stop) return null;
      const pal = s.slice(w.a, w.b + 1);
      return {
        question: `The hands hold ${q(pal)} and now point at ${q(s[w.cl])} (cell ${w.cl}) and ${q(s[w.cr])} (cell ${w.cr}). Do they step out again?`,
        options: ['Yes: the letters match', `No: this centre stops at ${q(pal)}`],
        answer: again ? 0 : 1,
        explain: again ? `Both letters are ${q(s[w.cl])}, so ${q(s.slice(w.cl, w.cr + 1))} is a palindrome too.` : `${q(s[w.cl])} and ${q(s[w.cr])} differ, so no wider stretch around this centre can be a palindrome.`,
      };
    }
    // after a centre is measured: is it a new best?
    const b = bestOf(ctx.vars, s, ctx.params);
    if (!b || !b.len || hands(ctx.vars) || !/max/i.test(ctx.src || '')) return null;
    const newInt = Object.keys(ctx.vars).find((k) => Number.isInteger(ctx.vars[k]) && !(k in ctx.prev) && !b.names.includes(k));
    if (!newInt || ctx.vars[newInt] < 2) return null;
    const len = ctx.vars[newInt];
    const nb = bestOf(ctx.next.vars, s, ctx.params);
    const changed = nb && b.names.some((k) => ctx.next.vars[k] !== ctx.vars[k]);
    const left = ctx.next.ret || !(newInt in ctx.next.vars);
    if (!changed && !left) return null;
    return {
      question: `This centre reaches ${len} letters; the best so far has ${b.len}. Does the best change?`,
      options: ['Yes: a new longest palindrome', 'No: keep the old one'],
      answer: changed ? 0 : 1,
      explain: changed ? `${len} > ${b.len}, so this stretch becomes the answer so far.` : `${len} is not longer than ${b.len}, so the best stays.`,
    };
  },
  bugs: [
    {
      label: 'Only letter centres, no gap centres',
      find: 'const even = expand(c, c + 1);',
      replace: 'const even = 0;',
      explain: 'Even palindromes like "bb" have their centre in a gap between two letters, so they are never found: "cbbd" gives "c".',
    },
    {
      label: 'The left hand never reaches cell 0',
      find: 'l >= 0',
      replace: 'l > 0',
      explain: 'A stretch that starts at the very first letter is never tested, so "racecar" stops at "aceca".',
    },
  ],
};
