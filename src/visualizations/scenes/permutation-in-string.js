// Permutation in String (fixed sliding window of s1.length over s2, letter tallies). A frame the size of s1 slides
// along s2: one letter comes in on the right, one falls off the left, and the frame's tally is compared with s1's.
// Works with 26-slot count arrays or Maps, with or without a "matches" counter (letters whose counts agree).
import { options, row } from './util.js';

const RIGHT = ['right', 'r', 'end', 'j', 'hi', 'i'];
const MATCH = ['matches', 'match', 'matched', 'same', 'equal', 'agree', 'good'];
const NEEDLIKE = /need|target|want|s1|pat|^p|1$/i;
const letter = (i) => String.fromCharCode(97 + i);
const tallyOf = (s) => {
  const m = new Map();
  for (const ch of s) m.set(ch, (m.get(ch) || 0) + 1);
  return m;
};
// count structures: 26-slot rows or letter → count Maps, as Map<letter, count>
function tallies(vars) {
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    if (row(v) && v.length === 26 && v.every(Number.isInteger)) out.push([k, new Map(v.map((c, i) => [letter(i), c]).filter(([, c]) => c))]);
    else if (v && Array.isArray(v.$map) && v.$map.every((e) => typeof e[0] === 'string' && e[0].length === 1 && Number.isInteger(e[1]))) out.push([k, new Map(v.$map.filter(([, c]) => c))]);
  }
  return out;
}
const same = (a, b) => a.size === b.size && [...a].every(([k, c]) => b.get(k) === c);
// the window's tally: a count structure that is not s1's own
const windowTally = (vars, s1) => {
  const t = tallies(vars);
  return t.find(([k, m]) => !NEEDLIKE.test(k) && !same(m, tallyOf(s1))) || t.find(([k]) => !NEEDLIKE.test(k));
};
// [letter, before, after] when exactly one letter's count moved by one
function moved(now, was) {
  if (!was) return null;
  const keys = [...new Set([...now.keys(), ...was.keys()])].filter((k) => (now.get(k) || 0) !== (was.get(k) || 0));
  if (keys.length !== 1) return null;
  const [k] = keys;
  const a = was.get(k) || 0;
  const b = now.get(k) || 0;
  return Math.abs(a - b) === 1 ? [k, a, b] : null;
}
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));
function counterSkipped(ctx, cName) {
  if (!ctx.next || ctx.next.line <= ctx.line) return false;
  const re = new RegExp(`\\b${cName}\\s*(--|\\+\\+|[-+]=)|(--|\\+\\+)\\s*${cName}\\b`);
  return ctx.lines.slice(ctx.line, ctx.next.line - 1).some((l) => re.test(l));
}

export default {
  id: 'permutation-in-string',
  metaphor: 'A letter frame sliding along a word',
  caption: 'A frame as long as s1 slides along s2. Each slide lets one letter in on the right and one out on the left; when every letter count in the frame equals s1\'s, the frame holds a rearrangement of s1.',
  pointers: RIGHT,
  narrate(ctx) {
    const [s1Name, s2Name] = ctx.params;
    const s1 = ctx.vars[s1Name];
    const s2 = ctx.vars[s2Name];
    if (typeof s1 !== 'string' || typeof s2 !== 'string') return null;
    const m = s1.length;
    const rName = intName(ctx.vars, RIGHT);
    const sliding = rName && ctx.vars[rName] >= m && ctx.vars[rName] <= s2.length;
    const mName = intName(ctx.vars, MATCH);
    if (sliding && mName && Number.isInteger(ctx.prev[mName]) && ctx.vars[mName] !== ctx.prev[mName]) {
      const k = ctx.vars[mName];
      // the counter runs over the whole alphabet (=== 26) or over s1's distinct letters only
      const all = /\b26\b/.test(ctx.lines.join('\n')) ? 26 : new Set(s1).size;
      return `${k} of ${all === 26 ? '26 letters' : `${all} letters of s1`} now have the same count in the frame as in s1${k === all ? ': the frame is a rearrangement of s1!' : ''}`;
    }
    const w = windowTally(ctx.vars, s1);
    const wasW = w && windowTally(ctx.prev, s1);
    const mv = w && wasW && wasW[0] === w[0] ? moved(w[1], wasW[1]) : null;
    if (mv) {
      const [ch, a, b] = mv;
      const want = tallyOf(s1).get(ch) || 0;
      if (!sliding) return `the first frame takes in "${ch}" (now ×${b})`;
      // for letters of s1 the comparison is the next prediction, so do not give it away here
      return `"${ch}" ${b > a ? 'comes in on the right' : 'falls off the left'}: the frame has ${b} "${ch}"${want ? '' : ', s1 has none'}`;
    }
    if (sliding && ctx.vars[rName] !== ctx.prev[rName] && Number.isInteger(ctx.prev[rName])) {
      const r = ctx.vars[rName];
      const stops = !ctx.next || /^\s*(if\s*\(.*\)\s*)?return\b/.test(ctx.lines[ctx.next.line - 1] || '');
      if (stops && mName && ctx.vars[mName] === 26) return `the frame "${s2.slice(r - m, r)}" is a rearrangement of s1: stop here`;
      if (r >= s2.length) return null;
      return `slide the frame: "${s2[r]}" comes in, "${s2[r - m]}" falls off · next frame "${s2.slice(r - m + 1, r + 1)}"`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [s1Name, s2Name] = ctx.params;
    const s1 = ctx.vars[s1Name];
    const s2 = ctx.vars[s2Name];
    if (typeof s1 !== 'string' || typeof s2 !== 'string') return null;
    const mName = intName(ctx.vars, MATCH);
    const rName = intName(ctx.vars, RIGHT);
    if (!mName || !rName || ctx.vars[rName] < s1.length || !Number.isInteger(ctx.next.vars[mName])) return null;
    // a letter's count in the frame just changed: does it now agree with s1?
    const w = windowTally(ctx.vars, s1);
    const wasW = windowTally(ctx.prev, s1);
    const mv = w && wasW && wasW[0] === w[0] ? moved(w[1], wasW[1]) : null;
    if (!mv || ctx.vars[mName] !== ctx.prev[mName]) return null;
    const [ch, a, b] = mv;
    if (!s1.includes(ch)) return null;
    const up = ctx.next.vars[mName] > ctx.vars[mName];
    const skipped = ctx.next.vars[mName] === ctx.vars[mName] && counterSkipped(ctx, mName);
    if (!up && !skipped) return null;
    const want = tallyOf(s1).get(ch);
    if (up !== (b === want)) return null; // the run must agree with the rule, or we are misreading the names
    const yes = `Yes: one more letter agrees`;
    const no = `No: "${ch}" still disagrees`;
    return options(`"${ch}" ${b > a ? 'came in' : 'fell off'}, so the frame now has ${b} "${ch}". Does that agree with s1 ("${s1}")?`, up ? yes : no, [up ? no : yes], up ? `s1 has exactly ${want} "${ch}", so this letter now agrees and the counter goes up.` : `s1 has ${want} "${ch}", not ${b}, so this letter does not agree yet.`);
  },
  bugs: [
    {
      label: 'Never check the last frame',
      find: 'return matches === 26;',
      replace: 'return false;',
      explain: 'The loop checks each frame before sliding, so the frame after the final slide is never checked: a match at the very end of s2 is missed.',
    },
    {
      label: 'Forget to un-count a letter before it changes',
      find: 'if (have[c] === need[c]) matches--;\n    have[c]++;',
      replace: 'have[c]++;',
      explain: 'A letter that agreed stops agreeing when one more comes in, but the counter still counts it, so a frame can look like a match when it is not.',
    },
  ],
};
