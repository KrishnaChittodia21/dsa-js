// Is Subsequence: one finger on s (the next letter still to find) and one walking through t. A letter of t that
// equals the wanted letter is taken (the s finger moves on); any other letter is passed over. Never look back.
import { options } from './util.js';

const SI = ['i', 'si', 'p', 'sp', 'a', 'idx', 'k'];
const TI = ['j', 'ti', 'q', 'tp', 'b', 'pos', 'c'];
const q = (x) => `'${x}'`;

/** [name, value] of the s / t pointer: an int index into the string, read off the code that compares them */
function finger(vars, names, strName, lines) {
  const code = lines.join('\n');
  const n = names.find((k) => Number.isInteger(vars[k]) && new RegExp(`\\b${strName}\\[\\s*${k}\\s*\\]`).test(code));
  return n === undefined ? [undefined, undefined] : [n, vars[n]];
}

/** the current line compares s[i] with t[j] */
const compares = (src, sName, tName, iName, jName) =>
  new RegExp(`\\b${sName}\\[\\s*${iName}\\s*\\]\\s*[!=]==?\\s*${tName}\\[\\s*${jName}\\s*\\]|\\b${tName}\\[\\s*${jName}\\s*\\]\\s*[!=]==?\\s*${sName}\\[\\s*${iName}\\s*\\]`).test(src || '');

export default {
  id: 'is-subsequence',
  metaphor: 'Ticking off letters on a shopping list',
  caption: 's is the list, t the shelf walked once from left to right. When the shelf letter is the next one on the list, tick it off; otherwise walk past. All ticked = true.',
  narrate(ctx) {
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    if (typeof s !== 'string' || typeof t !== 'string') return null;
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') {
      if (!s.length) return 'an empty list is always done: true';
      return ctx.value ? `every letter of ${q(s)} was found in order: true` : `the shelf ran out before ${q(s)} was all ticked off: false`;
    }
    const [iName, i] = finger(ctx.vars, SI, sName, ctx.lines);
    const [jName, j] = finger(ctx.vars, TI, tName, ctx.lines);
    if (!iName || !jName || j >= t.length) return null;
    const pi = ctx.prev[iName];
    if (Number.isInteger(pi) && i === pi + 1 && s[pi] === t[j]) return `shelf letter ${j} is ${q(t[j])}, the next on the list: tick it off (${i} of ${s.length} found)`;
    if (i === pi && compares(ctx.src, sName, tName, iName, jName) && i < s.length && s[i] !== t[j]) return `shelf letter ${j} is ${q(t[j])}, but the list wants ${q(s[i])}: walk past`;
    return null;
  },
  // the next shelf letter: tick or walk past? and at the end: true or false?
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    if (typeof s !== 'string' || typeof t !== 'string') return null;
    if (ctx.next.ret && typeof ctx.next.value === 'boolean' && ctx.result === ctx.next.value && s.length) {
      const [, i] = finger(ctx.vars, SI, sName, ctx.lines);
      if (!Number.isInteger(i)) return null;
      return options(`The walk is over with ${i} of ${s.length} list letters ticked. What is returned?`, String(ctx.next.value), [String(!ctx.next.value)], ctx.next.value ? `All ${s.length} letters of ${q(s)} were found in order.` : `Only ${i} of ${s.length} letters were found: ${q(s[i] ?? '')} never showed up after that.`);
    }
    const [iName, i] = finger(ctx.vars, SI, sName, ctx.lines);
    const [jName] = finger(ctx.vars, TI, tName, ctx.lines);
    if (!iName || !jName || !Number.isInteger(i) || i >= s.length) return null;
    const nj = ctx.next.vars[jName];
    const ni = ctx.next.vars[iName];
    if (!Number.isInteger(nj) || !Number.isInteger(ni) || nj >= t.length || !compares(ctx.lines[ctx.next.line - 1], sName, tName, iName, jName)) return null;
    const tick = ni === i + 1;
    if (!tick && ni !== i) return null;
    if (tick !== (s[i] === t[nj])) return null;
    // ask early only (list letters 0 and 1), and a pass only right after a tick (the list just moved on)
    if (i > 1 || (!tick && ctx.prev[iName] === i)) return null;
    return options(`The list wants ${q(s[i])}. The shelf letter ${nj} is ${q(t[nj])}: tick it or walk past?`, tick ? 'tick it off' : 'walk past', [tick ? 'walk past' : 'tick it off'], tick ? `${q(t[nj])} is exactly the wanted letter; taking the first match is always safe.` : `${q(t[nj])} is not ${q(s[i])}: it is skipped, and the list keeps waiting for ${q(s[i])}.`);
  },
  bugs: [
    {
      label: 'Look for s as one block (includes)',
      find: 'return i === s.length;',
      replace: 'return t.includes(s);',
      explain: 'includes looks for the letters side by side. "abc" is spread out in "ahbgdc", so this says false.',
    },
    {
      label: 'Start the list over on a mismatch',
      find: 'if (s[i] === t[j]) i++;',
      replace: 'if (s[i] === t[j]) i++; else i = 0;',
      explain: 'Letters in between are allowed. Wiping the ticks on every other letter turns this into a "side by side" search, and "abc" in "ahbgdc" fails.',
    },
  ],
};
