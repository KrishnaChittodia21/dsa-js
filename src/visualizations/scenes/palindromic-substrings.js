// Palindromic Substrings (expand around every centre). Each letter and each gap between two letters is a centre;
// from it two hands move outward one letter at a time. While the two letters under the hands match, the stretch
// between them reads the same both ways and is counted; the first mismatch (or an edge) ends that centre only.
// Narrated from the window [l..r] and the counter; every palindrome is checked against s itself.
import { firstInt } from './util.js';

const LEFT = ['l', 'left', 'lo', 'L'];
const RIGHT = ['r', 'right', 'hi', 'R'];
const COUNT = ['count', 'cnt', 'ans', 'res', 'result', 'total', 'answer', 'num', 'counter'];
const CENTRE = ['c', 'center', 'centre', 'i', 'mid', 'k'];
const q = (x) => `'${x}'`;
const isPal = (x) => x.length > 0 && x === [...x].reverse().join('');

/** the two hands, when this step has them */
function hands(vars) {
  const ln = LEFT.find((x) => Number.isInteger(vars[x]));
  const rn = RIGHT.find((x) => Number.isInteger(vars[x]));
  return ln && rn ? { ln, rn, l: vars[ln], r: vars[rn] } : null;
}

/** the hands moved outward in this step, and the next step does not move them again (not a half-done move) */
function settledMove(ctx) {
  const h = hands(ctx.vars);
  const p = hands(ctx.prev);
  if (!h || !p || h.ln !== p.ln || h.rn !== p.rn) return null;
  if (h.l > p.l || h.r < p.r || (h.l === p.l && h.r === p.r)) return null;
  const n = ctx.next && hands(ctx.next.vars);
  if (n && n.ln === h.ln && n.rn === h.rn && (n.l === h.l - 1 || n.r === h.r + 1) && !(n.l === h.l - 1 && n.r === h.r + 1)) return null;
  return h;
}

export default {
  id: 'palindromic-substrings',
  metaphor: 'Two hands spreading from a centre',
  caption: 'Every letter and every gap between two letters is a centre. Two hands start there and move apart one letter at a time; while the letters under them match, the stretch between them is a palindrome and is counted. A mismatch or an edge ends that centre only.',
  pointers: [...LEFT, ...RIGHT],
  range: LEFT.map((x, k) => [x, RIGHT[k]]),
  compare: 'count',
  narrate(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string') return null;
    const h = hands(ctx.vars);
    const [cName, cnt] = firstInt(ctx.vars, COUNT);
    if (h && cName && cName in ctx.prev && cnt === ctx.prev[cName] + 1 && h.l >= 0 && h.r < s.length && isPal(s.slice(h.l, h.r + 1))) {
      const sub = s.slice(h.l, h.r + 1);
      return `${q(sub)} (cells ${h.l}..${h.r}) reads the same both ways: palindrome #${cnt}`;
    }
    if (!h && cName) {
      // back in the main loop, right after one centre was tried
      const [kName, c] = firstInt(ctx.vars, CENTRE);
      if (kName && c >= 0 && c < s.length) {
        const so = `${cnt} so far`;
        if (new RegExp(`\\(\\s*${kName}\\s*,\\s*${kName}\\s*\\)`).test(ctx.src)) return `the centre on ${q(s[c])} (cell ${c}) is done: ${so}`;
        if (new RegExp(`\\(\\s*${kName}\\s*,\\s*${kName}\\s*\\+\\s*1\\s*\\)`).test(ctx.src)) {
          if (c + 1 >= s.length) return `no gap after the last letter: nothing to try (${so})`;
          if (!hands(ctx.prev) && s[c] !== s[c + 1]) return `the gap between ${q(s[c])} and ${q(s[c + 1])}: the letters differ, nothing to count (${so})`;
          return `the centre in the gap between cells ${c} and ${c + 1} is done: ${so}`;
        }
      }
    }
    const m = settledMove(ctx);
    if (!m) return null;
    if (m.l < 0 || m.r >= s.length) return `a hand is past the ${m.l < 0 ? 'left' : 'right'} end: no more palindromes around this centre`;
    return `the hands move apart: now ${q(s[m.l])} (cell ${m.l}) and ${q(s[m.r])} (cell ${m.r})`;
  },
  // the hands just moved apart: is the wider stretch still a palindrome?
  predict(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string' || !ctx.next) return null;
    const m = settledMove(ctx);
    if (!m || m.l < 0 || m.r >= s.length) return null;
    const [cName, cnt] = firstInt(ctx.vars, COUNT);
    if (!cName) return null;
    const nh = hands(ctx.next.vars);
    const counted = ctx.next.vars[cName] === cnt + 1 && nh && nh.l === m.l && nh.r === m.r;
    const left = !nh || nh.ln !== m.ln || nh.l > m.l || nh.r < m.r;
    if (!counted && !(left && ctx.next.vars[cName] === cnt)) return null;
    const sub = s.slice(m.l, m.r + 1);
    const yes = 'Yes: count it and spread again';
    const no = 'No: this centre is done';
    return {
      question: `The hands now hold ${q(sub)} (cells ${m.l}..${m.r}). Is it a palindrome?`,
      options: [yes, no],
      answer: counted ? 0 : 1,
      explain: counted
        ? `The inside ${q(s.slice(m.l + 1, m.r))} was already a palindrome, and the new outer letters are both ${q(s[m.l])}.`
        : `The outer letters ${q(s[m.l])} and ${q(s[m.r])} differ, so neither this stretch nor any wider one around the same centre can be a palindrome.`,
    };
  },
  bugs: [
    {
      label: 'Only letter centres, no gap centres',
      find: 'expand(c, c + 1);',
      replace: ';',
      explain: 'Only odd-length palindromes grow from a single letter; even ones like "aa" or "abba" have their centre in a gap, so they are never counted.',
    },
    {
      label: 'The left hand never reaches cell 0',
      find: 'l >= 0',
      replace: 'l > 0',
      explain: 'Stretches that start at the very first letter are never checked, so even the single first letter is not counted.',
    },
  ],
};
