// String Compression: a read pointer measures each run of equal characters; a write pointer, never ahead of it,
// rewrites the front of the same array as letter + count digits. Works with read/write, r/w, anchor/i pointers and
// a count-like variable; any other shape falls back to the generic notes.
import { firstInt, options, row } from './util.js';

const WRITE = ['write', 'w', 'wr', 'writeIdx', 'writeIndex', 'out', 'idx', 'pos', 'k'];
const READ = ['read', 'r', 'anchor', 'start', 'readIdx', 'i'];
const COUNT = ['count', 'cnt', 'run', 'runLen', 'groupLen', 'streak', 'freq'];

/** the run's letter: the character under the read pointer */
function letterOf(vars, ch) {
  const [, rd] = firstInt(vars, READ);
  return Number.isInteger(rd) && rd >= 0 && rd < ch.length ? ch[rd] : undefined;
}
/** the slot just written: [slot, char] when the write pointer moved one step, else null */
function wrote(vars, prev, ch) {
  const [wName, w] = firstInt(vars, WRITE);
  return wName && Number.isInteger(prev[wName]) && w === prev[wName] + 1 && w - 1 < ch.length ? [w - 1, ch[w - 1]] : null;
}
const q = (x) => `'${x}'`;
/** [name, chars]: the parameter, else the first array of single characters (parameters are recorded first) */
function charsOf(vars, pName) {
  const isTape = (v) => row(v) && v.length && v.every((x) => typeof x === 'string' && x.length === 1);
  if (isTape(vars[pName])) return [pName, vars[pName]];
  return Object.entries(vars).find(([, v]) => isTape(v)) || [];
}

export default {
  id: 'string-compression',
  metaphor: 'Rewriting a tape as letter + count',
  caption: 'The read pointer measures a run of equal characters; the write pointer, never ahead of it, writes the letter and then the run length digit by digit over the front of the same array.',
  pointers: ['read', 'write', 'r', 'w', 'anchor', 'j', 'i'],
  compare: 'chars',
  narrate(ctx) {
    const [, ch] = charsOf(ctx.vars, ctx.params[0]);
    if (!ch) return null;
    const letter = letterOf(ctx.vars, ch);
    const [cntName, cnt] = firstInt(ctx.vars, COUNT);
    const w = wrote(ctx.vars, ctx.prev, ch);
    if (w) {
      const [s, x] = w;
      const digits = Number.isInteger(cnt) && cnt > 1 ? String(cnt) : '';
      if (letter !== undefined && x === letter && !digits.includes(x)) {
        return `slot ${s} gets ${q(x)}: the run's letter${cnt === 1 ? ' (a run of 1 gets no count after it)' : ''}`;
      }
      if (digits && digits.includes(x) && x !== letter) {
        return `slot ${s} gets ${q(x)}: ${digits.length > 1 ? `one digit of the count ${digits} (one slot per digit)` : `the run length ${digits}`}`;
      }
      return null;
    }
    const [rName, rd] = firstInt(ctx.vars, READ);
    if (cntName && cnt !== ctx.prev[cntName] && cnt >= 1 && letter !== undefined) {
      const end = rd + cnt;
      const why = rName === 'i' || end > ch.length ? '' : end === ch.length ? ': the tape ends' : `: next comes ${q(ch[end])}`;
      return `the run of ${q(letter)} is ${cnt} long${why}`;
    }
    const was = ctx.prev[rName];
    // an i that steps through every character is not a jump
    if (rName && Number.isInteger(was) && rd > was + (rName === 'i' ? 1 : 0)) {
      return rd >= ch.length ? `${rName} reaches the end of the tape: every run is written` : `${rName} moves to ${rd}: the next run starts with ${q(ch[rd])}`;
    }
    return null;
  },
  // right after a run's letter is written (run longer than 1): what goes into the next slot?
  predict(ctx) {
    if (!ctx.next) return null;
    const [cName, ch] = charsOf(ctx.vars, ctx.params[0]);
    const nx = cName && row(ctx.next.vars[cName]);
    if (!ch || !nx) return null;
    const w = wrote(ctx.vars, ctx.prev, ch);
    const after = wrote(ctx.next.vars, ctx.vars, nx);
    const [, cnt] = firstInt(ctx.vars, COUNT);
    const letter = letterOf(ctx.vars, ch);
    if (!w || !after || !(cnt > 1) || letter === undefined || w[1] !== letter) return null;
    const digits = String(cnt);
    if (digits.includes(letter) || after[1] !== digits[0]) return null;
    return options(
      `${q(letter)} × ${cnt}: the letter is in slot ${w[0]}. What goes into slot ${after[0]}?`,
      after[1],
      ['1', digits, letter, digits.slice(-1)],
      digits.length > 1 ? `A count of ${cnt} is written one character per slot: ${[...digits].map(q).join(' then ')}.` : `A run longer than 1 is followed by its length, ${cnt}, as a character.`,
    );
  },
  bugs: [
    {
      label: "Write a count after every run, even 1",
      find: 'if (count > 1) {',
      replace: 'if (count >= 1) {',
      explain: "A run of one character must stay just the letter; writing '1' after it makes ['a'] come out as ['a', '1'].",
    },
    {
      label: "Write 12 as one slot instead of '1', '2'",
      find: 'for (const d of String(count)) chars[write++] = d;',
      replace: 'chars[write++] = String(count);',
      explain: 'The count must be split into digits, one per slot: a run of 12 should take two slots, but "12" lands in one.',
    },
  ],
};
