// Find All Anagrams in a String (fixed sliding window). A basket exactly |p| letters wide slides along s with p as
// the shopping list: a letter entering ticks an item off, a letter falling out puts it back. An empty list means the
// basket is an anagram. Narrates the need / missing counter version; any version gets the basket notes and the
// "is it an anagram?" question (answer read from whether the start index is recorded next).
import { options, row } from './util.js';

const RIGHT = ['right', 'r', 'end', 'j', 'i', 'hi'];
const MISSING = ['missing', 'need', 'needed', 'remaining', 'left', 'count', 'cnt', 'toMatch', 'diff'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'indices', 'starts', 'list'];
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));
const rowName = (vars, names) => names.find((n) => row(vars[n]));
/** the letter-count array: 26 integers */
const countsName = (vars) => Object.keys(vars).find((n) => {
  const a = row(vars[n]);
  return a && a.length === 26 && a.every(Number.isInteger);
});
const q = (c) => `'${c}'`;

function basics(ctx, vars) {
  const [sName, pName] = ctx.params;
  const s = vars[sName];
  const p = vars[pName];
  if (typeof s !== 'string' || typeof p !== 'string' || !p.length) return null;
  const rName = RIGHT.find((n) => Number.isInteger(vars[n]) && vars[n] >= 0 && vars[n] < s.length);
  return { s, p, m: p.length, rName, r: rName ? vars[rName] : undefined };
}

export default {
  id: 'find-all-anagrams-in-a-string',
  metaphor: 'A shopping list and a sliding basket',
  caption: 'p is the shopping list; the basket holds the last |p| letters of s. A letter that enters ticks an item off, a letter that falls out puts it back; an empty list means the basket is an anagram.',
  pointers: RIGHT,
  compare: 'result',
  narrate(ctx) {
    const b = basics(ctx, ctx.vars);
    if (!b) return null;
    const { s, p, m, rName, r } = b;
    const resName = rowName(ctx.vars, RESULT);
    if (resName && row(ctx.prev[resName]) && ctx.vars[resName].length === ctx.prev[resName].length + 1) {
      const st = ctx.vars[resName].at(-1);
      return `basket ${q(s.slice(st, st + m))} holds exactly the letters of ${q(p)}: an anagram starts at cell ${st}`;
    }
    const cName = countsName(ctx.vars);
    const missName = MISSING.find((n) => n !== cName && Number.isInteger(ctx.vars[n]) && Number.isInteger(ctx.prev[n]));
    // shopping list being written from p (the loop index walks p)
    if (cName && row(ctx.prev[cName]) && !missName) {
      const d = ctx.vars[cName].findIndex((x, i) => x === ctx.prev[cName][i] + 1);
      if (d >= 0 && rName && p[r] === String.fromCharCode(97 + d)) return `the list needs ${q(p[r])} ×${ctx.vars[cName][d]}`;
    }
    if (!rName) return null;
    if (r !== ctx.prev[rName] && Number.isInteger(ctx.prev[rName]) === (r > 0)) return `the basket reaches cell ${r}: ${q(s[r])} comes in`;
    const out = r - m >= 0 ? s[r - m] : undefined;
    if (missName) {
      const mi = ctx.vars[missName];
      const pm = ctx.prev[missName];
      if (mi === pm - 1) return `${q(s[r])} (cell ${r}) is on the list: tick it off (${mi} still missing)`;
      if (mi === pm + 1 && out) return `${q(out)} was on the list: it goes back on (${mi} missing)`;
    }
    if (cName && row(ctx.prev[cName])) {
      const a = ctx.vars[cName];
      const pa = ctx.prev[cName];
      const d = a.findIndex((x, i) => x !== pa[i]);
      if (d < 0) return null;
      const ch = String.fromCharCode(97 + d);
      if (a[d] === pa[d] - 1 && ch === s[r]) return a[d] < 0 ? `no ${q(ch)} left on the list: an extra letter in the basket` : `${q(ch)} goes into the basket`;
      if (a[d] === pa[d] + 1 && ch === out && r - m >= 0) return `${q(ch)} (cell ${r - m}) falls out of the basket on the left`;
      return null;
    }
    if (r !== ctx.prev[rName] && r >= m - 1) return `the basket now holds ${q(s.slice(r - m + 1, r + 1))} (cells ${r - m + 1}..${r})`;
    return null;
  },
  // the basket for this position is settled: is it an anagram?
  predict(ctx) {
    if (!ctx.next) return null;
    const b = basics(ctx, ctx.vars);
    if (!b || !b.rName) return null;
    const { s, p, m, rName, r } = b;
    if (r < m - 1) return null;
    const resName = rowName(ctx.vars, RESULT);
    const now = resName && row(ctx.vars[resName]);
    const after = resName && row(ctx.next.vars[resName]);
    if (!now || !after) return null;
    const pushed = after.length === now.length + 1;
    const moved = ctx.next.vars[rName] !== r && after.length === now.length;
    if (!pushed && !moved) return null;
    const st = r - m + 1;
    if (now.at(-1) === st || (moved && ctx.next.vars[rName] !== r + 1)) return null;
    if (pushed && after.at(-1) !== st) return null;
    const yes = `Yes: record start ${st}`;
    const no = 'No: slide on';
    const basket = s.slice(st, r + 1);
    const sortStr = (x) => [...x].sort().join('');
    return options(
      `The basket holds ${q(basket)} (cells ${st}..${r}). Is it an anagram of ${q(p)}?`,
      pushed ? yes : no,
      [pushed ? no : yes],
      pushed ? `${q(basket)} uses the same letters as ${q(p)}, each the same number of times.` : sortStr(basket) === sortStr(p) ? `The letters match, but this code does not record it here.` : `${q(basket)} and ${q(p)} do not have the same letter counts.`,
    );
  },
  bugs: [
    {
      label: 'Record the end, not the start',
      find: 'result.push(right - m + 1)',
      replace: 'result.push(right)',
      explain: 'The answer wants where each anagram starts, but this records the cell where the basket ends, m − 1 cells too far right.',
    },
    {
      label: 'Basket one letter too wide: right > m',
      find: 'if (right >= m) {',
      replace: 'if (right > m) {',
      explain: 'The first letter is dropped one step late, so for a moment the basket holds m + 1 letters and can contain the whole list while being too long.',
    },
  ],
};
