// Minimum Window Substring (variable sliding window with a shopping list). Walk along s collecting the letters on
// t's shopping list; once nothing is missing, give letters back from the left while the list stays complete, and
// keep the shortest complete stretch. Works with a "missing" counter (counts down) or a "formed" counter (counts up).
import { options } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const MISSING = ['missing', 'remaining', 'required', 'toFind', 'needCount', 'need'];
const FORMED = ['formed', 'have', 'matched', 'matches', 'found', 'valid', 'count', 'cnt'];
const BEST = ['bestLen', 'minLen', 'best', 'minLength', 'resLen', 'ansLen', 'len', 'size'];
const LETTER = ['c', 'ch', 'char', 'letter', 'cur', 'x'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));
const counterOf = (vars) => {
  const m = intName(vars, MISSING);
  if (m) return [m, 'missing'];
  const f = intName(vars, FORMED);
  return f ? [f, 'formed'] : [undefined, undefined];
};
const clip = (w) => (w.length > 24 ? `${w.slice(0, 10)}…${w.slice(-10)}` : w);
const mapOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => typeof e[0] === 'string' && Number.isInteger(e[1])));
// the one key whose count changed between two snapshots of the same Map
function changedKey(a, b) {
  if (!a || !b) return null;
  const x = new Map(a.$map);
  const y = new Map(b.$map);
  const keys = [...new Set([...x.keys(), ...y.keys()])].filter((k) => x.get(k) !== y.get(k));
  return keys.length === 1 ? keys[0] : null;
}
// a line between the current and the next step that would update the counter: it ran and left it unchanged
function counterSkipped(ctx, cName) {
  if (!ctx.next || ctx.next.line <= ctx.line) return false;
  const re = new RegExp(`\\b${cName}\\s*(--|\\+\\+|[-+]=)|(--|\\+\\+)\\s*${cName}\\b`);
  return ctx.lines.slice(ctx.line, ctx.next.line - 1).some((l) => re.test(l));
}
const hasBest = (vars, s) => BEST.some((n) => Number.isInteger(vars[n]) && vars[n] <= s.length) || ['res', 'ans', 'result', 'best'].some((n) => typeof vars[n] === 'string' && vars[n].length > 0);

export default {
  id: 'minimum-window-substring',
  metaphor: 'Shopping for every letter on a list',
  caption: 'The bracket is your basket. Grow it to the right until every letter of t is in it, then hand letters back from the left while the list stays complete; the shortest full basket wins.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'bestLen',
  narrate(ctx) {
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    const pair = pairOf(ctx.vars);
    if (typeof s !== 'string' || typeof t !== 'string' || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const [cName, kind] = counterOf(ctx.vars);
    const cnt = cName && ctx.vars[cName];
    const was = cName && ctx.prev[cName];
    if (cName && Number.isInteger(was) && cnt !== was) {
      const better = kind === 'missing' ? cnt < was : cnt > was;
      if (better) {
        const done = kind === 'missing' ? cnt === 0 : cnt === new Set(t).size; // formed counts distinct letters
        const ch = LETTER.map((n) => ctx.vars[n]).find((v) => typeof v === 'string' && v.length === 1 && t.includes(v));
        return `${ch ? `"${ch}"` : 'that letter'} was on the list: ${kind === 'missing' ? `${cnt} still missing` : `${cnt} done`}${done ? ` · the basket "${clip(s.slice(l, r + 1))}" holds all of t!` : ''}`;
      }
      const gone = Object.values(ctx.vars).find((v) => typeof v === 'string' && v.length === 1 && t.includes(v) && (v === s[l] || v === s[l - 1]));
      return `handing ${gone ? `"${gone}"` : 'that letter'} back broke the list: ${kind === 'missing' ? `${cnt} missing again` : `only ${cnt} done now`}, so grow to the right`;
    }
    const bName = intName(ctx.vars, BEST);
    if (bName && Number.isInteger(ctx.prev[bName]) && ctx.vars[bName] < ctx.prev[bName] || (bName && ctx.prev[bName] === Infinity && Number.isInteger(ctx.vars[bName]))) {
      const len = ctx.vars[bName];
      return `new shortest full basket: "${clip(s.slice(l, l + len))}" (${len} letter${len === 1 ? '' : 's'})`;
    }
    const strBest = ['res', 'ans', 'result', 'best'].find((n) => typeof ctx.vars[n] === 'string' && ctx.vars[n] && ctx.vars[n] !== ctx.prev[n]);
    if (strBest) return `new shortest full basket: "${clip(ctx.vars[strBest])}" (${ctx.vars[strBest].length} letters)`;
    if (Number.isInteger(ctx.prev[lName]) && l === ctx.prev[lName] + 1) return `"${s[l - 1]}" is handed back from the left: the basket is now "${clip(s.slice(l, r + 1))}"`;
    if (r !== ctx.prev[rName] && r < s.length) {
      const ch = LETTER.map((n) => ctx.vars[n]).find((v) => v === s[r]);
      if (ch) return `"${ch}" goes into the basket at the right${t.includes(ch) ? ' (t wants it)' : ' (not on the list)'}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    const pair = pairOf(ctx.vars);
    const [cName, kind] = counterOf(ctx.vars);
    if (typeof s !== 'string' || typeof t !== 'string' || !pair || !cName) return null;
    const [lName, rName] = pair;
    const cnt = ctx.vars[cName];
    const after = ctx.next.vars[cName];
    if (!Number.isInteger(after)) return null;
    const changes = after !== cnt;
    const skipped = !changes && counterSkipped(ctx, cName);
    if (!changes && !skipped) return null;
    // a letter is handed back while the list is complete: does the basket stay complete?
    const m = mapOf(ctx.vars);
    if (kind === 'missing' && cnt === 0 && ctx.prev[cName] === 0 && m) {
      const ch = changedKey(m[1], ctx.prev[m[0]]);
      if (!ch || ctx.vars[rName] !== ctx.prev[rName]) return null;
      const yes = 'Yes: the basket still holds all of t';
      const no = 'No: a letter of t is now missing';
      return options(`"${ch}" is handed back from the left. Does the basket still hold all of t = "${t}"?`, changes ? no : yes, [changes ? yes : no], changes ? `The basket had exactly as many "${ch}" as t needs, so giving one back leaves the list incomplete.` : `The basket had more "${ch}" than t needs${t.includes(ch) ? '' : ` (t needs none)`}, so the list stays complete and the basket can shrink further.`);
    }
    // a letter of t comes in after a full basket was already found: is it one that is still needed?
    const r = ctx.vars[rName];
    if (r === ctx.prev[rName] || !Number.isInteger(ctx.prev[rName]) || !hasBest(ctx.vars, s)) return null;
    const ch = s[r];
    if (!ch || !t.includes(ch) || !LETTER.some((n) => ctx.vars[n] === ch)) return null;
    const yes = `Yes: "${ch}" fills a gap on the list`;
    const no = `No: the basket already has enough "${ch}"`;
    const better = kind === 'missing' ? after < cnt : after > cnt;
    if (changes && !better) return null;
    return options(`"${ch}" goes into the basket "${clip(s.slice(ctx.vars[lName], r + 1))}". Is it a letter the list still needs?`, changes ? yes : no, [changes ? no : yes], changes ? `The basket was short of "${ch}", so the ${kind === 'missing' ? 'missing count drops' : 'formed count rises'}.` : `The basket already had all the "${ch}" that t asks for; an extra one does not complete anything.`);
  },
  bugs: [
    {
      label: 'if instead of while: shrink one letter only',
      find: 'while (missing === 0)',
      replace: 'if (missing === 0)',
      explain: 'Only one letter is handed back per step to the right, so a full basket with several spare letters on the left is never measured at its shortest.',
    },
    {
      label: 'Treat t as a set of letters',
      find: 'need.set(c, (need.get(c) ?? 0) + 1)',
      replace: 'need.set(c, 1)',
      explain: 't = "aa" asks for two a\'s, but the list only remembers one, so the counts go wrong and a basket holding both a\'s is never seen as complete.',
    },
  ],
};
