// Letter Combinations of a Phone Number: a row of letter wheels, one per pressed key. The path holds the letters
// picked so far (one per key); a word with a letter on every key is written down, then the last letter comes back
// off so the next letter on that key can be tried. Works with a path array or a string built per call.
import { callArgs, options, row } from './util.js';

const KEYS = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
const PATH = ['path', 'curr', 'cur', 'current', 'comb', 'combo', 'combination', 'temp', 'tmp', 'sb', 'str', 'prefix', 'word', 'built', 'letters', 'chars', 'acc', 'partial', 'stack', 'picked', 'chosen', 'choice', 'seq', 'buf', 'buffer'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'combos', 'combinations', 'words', 'list'];

/** the picked letters as an array: a path array of single letters, or a string built per call */
const letters = (v) => (typeof v === 'string' ? [...v] : row(v) && v.every((x) => typeof x === 'string' && x.length === 1) ? v : null);
const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k) && k in vars).map((k) => letters(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((w) => typeof w === 'string' || letters(w)));
const word = (w) => (typeof w === 'string' ? w : w.join(''));
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const firstIntArg = (c) => (c ? Object.values(c.args).find(Number.isInteger) : undefined);

export default {
  id: 'letter-combinations-of-a-phone-number',
  metaphor: 'A row of letter wheels, one per key',
  caption: 'Each pressed key is a wheel with 3 or 4 letters. The path holds one letter per wheel so far; when every wheel has a letter the word is written down, then the last wheel turns to its next letter.',
  narrate(ctx) {
    const digits = ctx.vars[ctx.params[0]];
    if (typeof digits !== 'string') return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `"${word(res[res.length - 1])}" has a letter from every key: write it down (${res.length} found)`;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (!p || !before) return null;
    if (extends1(p, before)) {
      const d = digits[p.length - 1];
      const togo = digits.length - p.length;
      return `key ${d} (${KEYS[d] || '?'}): pick "${p[p.length - 1]}" → "${p.join('')}"${togo > 0 ? `, ${togo} key${togo > 1 ? 's' : ''} to go` : ', every key has a letter'}`;
    }
    if (extends1(before, p)) {
      const x = before[before.length - 1];
      const d = digits[p.length];
      if (KEYS[d] && KEYS[d].endsWith(x)) {
        return p.length > 0 ? `take "${x}" back off: key ${d} has no letters left, so back up to key ${digits[p.length - 1]}` : `take "${x}" back off: every letter of the first key is done`;
      }
      return `take "${x}" back off: key ${d} turns to its next letter`;
    }
    return null;
  },
  // a letter just came back off: which letter is next (first letter of a key), or what happens when the key is used up
  predict(ctx) {
    const digits = ctx.vars[ctx.params[0]];
    if (!ctx.next || typeof digits !== 'string') return null;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const after = pathOf(ctx.next.vars, ctx.params);
    if (!p || !before || !after || !extends1(before, p)) return null;
    const x = before[before.length - 1];
    const d = digits[p.length];
    const keyLetters = KEYS[d];
    if (!keyLetters) return null;
    if (keyLetters[0] === x && extends1(after, p)) {
      const y = after[after.length - 1];
      return options(`"${x}" came back off key ${d} (${keyLetters}). Which letter goes on next?`, y, [...keyLetters].filter((c) => c !== y), `Every word with "${x}" on key ${d} is written down, so the loop moves on to the next letter of "${keyLetters}": "${y}".`);
    }
    if (keyLetters.endsWith(x) && p.length > 0) {
      const back = after.length < p.length || (after.length === p.length && firstIntArg(callArgs({ ...ctx, line: ctx.next.line, vars: ctx.next.vars })) < firstIntArg(callArgs(ctx)));
      const answer = extends1(after, p) ? 0 : back ? 1 : -1;
      if (answer < 0) return null;
      return {
        question: `"${x}", the last letter of key ${d}, came back off. What happens next?`,
        options: [`Put another letter of key ${d} on`, `Back up to key ${digits[p.length - 1]} and turn it to its next letter`],
        answer,
        explain: answer === 1 ? `Key ${d} has no letters left, so this call is finished; the call for key ${digits[p.length - 1]} carries on with its next letter.` : `This run puts another letter on key ${d}, although "${x}" is its last one: check the letters stored for key ${d}.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'No empty-input check: returns [""]',
      find: 'if (digits.length === 0) return [];',
      replace: '',
      explain: 'With no digits, the first call is already "at the end", so it writes down the empty word and returns [""] instead of [].',
    },
    {
      label: 'Key 7 with only three letters',
      find: "7: 'pqrs'",
      replace: "7: 'pqr'",
      explain: 'Keys 7 and 9 have four letters; leaving out "s" drops every word that uses it, so "79" gives 12 words instead of 16.',
    },
  ],
};
