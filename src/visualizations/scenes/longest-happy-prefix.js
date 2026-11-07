// Longest Happy Prefix (KMP prefix table). Walk the word letter by letter and keep the longest "border": a head of
// the word that is also the tail of what has been read so far. A new letter either extends the border, or the table
// says which shorter border to try next. The answer is the border of the whole word (the last table entry).
// Every note is checked against s itself, so a different method falls back to the generic note.
import { options, row } from './util.js';

const IDX = ['i', 'r', 'right', 'idx', 'k'];
const CNT = ['len', 'j', 'length', 'k', 'border', 'prefixLen', 'prev', 'l', 'p', 'matched', 'q'];
const q = (x) => `'${x}'`;
const pl = (k) => `${k} letter${k === 1 ? '' : 's'}`;

/** the table: a non-parameter integer row as long as s */
const tableOf = (ctx, vars, n) => Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === n && v.every(Number.isInteger))?.[1];

function setup(ctx, vars) {
  const s = vars[ctx.params[0]];
  if (typeof s !== 'string') return null;
  const table = tableOf(ctx, vars, s.length);
  const iName = IDX.find((x) => Number.isInteger(vars[x]) && vars[x] >= 0 && vars[x] < s.length);
  const jName = CNT.find((x) => x !== iName && Number.isInteger(vars[x]) && vars[x] >= 0 && vars[x] < s.length);
  if (!table || !iName || !jName) return { s, table };
  return { s, table, iName, jName, i: vars[iName], j: vars[jName] };
}

/** this step wrote table cell i (also when the value did not change) */
const writes = (ctx, st) => !!st.iName && new RegExp(`\\[\\s*${st.iName}\\s*\\]\\s*=[^=]`).test(ctx.src);

export default {
  id: 'longest-happy-prefix',
  metaphor: "Matching a word's head to its tail",
  caption: 'Read s left to right. Cell i of the table is the longest head of s that is also the tail of s[0..i] (never the whole thing). A letter that fits extends that head by one; one that does not makes the table offer the next shorter head.',
  compare: 'lps',
  narrate(ctx) {
    const st = setup(ctx, ctx.vars);
    if (!st) return null;
    const { s, table } = st;
    if (ctx.ret && table && !st.iName) {
      const v = table[s.length - 1];
      return v ? `the last cell says ${pl(v)}: ${q(s.slice(0, v))} is both a head and a tail of ${q(s)}` : `the last cell is 0: no head of ${q(s)} is also its tail, the answer is ""`;
    }
    const before = table && tableOf(ctx, ctx.prev, s.length);
    const changed = before ? table.findIndex((x, k) => x !== before[k]) : -1;
    const d = changed >= 0 ? changed : writes(ctx, st) ? st.i : -1;
    if (d >= 0) {
      const v = table[d];
      return v ? `table[${d}] = ${v}: ${q(s.slice(0, d + 1))} starts and ends with ${q(s.slice(0, v))}` : `table[${d}] = 0: no head of ${q(s.slice(0, d + 1))} is also its tail`;
    }
    if (!st.jName || !(st.jName in ctx.prev)) return null;
    const { i, j, iName } = st;
    const pj = ctx.prev[st.jName];
    const c = s[i];
    if (j === pj + 1 && c === s[j - 1] && i > j - 1) return `${q(c)} (letter ${i}) equals letter ${pj}, the one after the head: the head grows to ${q(s.slice(0, j))}`;
    if (j < pj && j === table[pj - 1] && c !== s[pj]) {
      const head = `${q(c)} (letter ${i}) cannot extend ${q(s.slice(0, pj))} (it needs ${q(s[pj])}): `;
      return j ? `${head}the table says ${q(s.slice(0, j))} is its own head and tail, so try that` : `${head}no shorter head fits, back to 0`;
    }
    if (j === 0 && pj === 0 && i !== ctx.prev[iName] && c !== s[0]) return `${q(c)} (letter ${i}) is not ${q(s[0])}: no head matches here`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const a = setup(ctx, ctx.vars);
    const b = setup(ctx, ctx.next.vars);
    if (!a?.jName || !b?.jName || a.jName !== b.jName || a.iName !== b.iName) return null;
    const { s, table, i, j } = a;
    const ni = b.i;
    const nj = b.j;
    // a fall-back: which shorter head does the table offer?
    if (ni === i + 1 || ni === i) {
      const c = s[ni];
      if (j >= 2 && nj < j && nj === table[j - 1] && c !== s[j]) {
        return options(
          `The head ${q(s.slice(0, j))} cannot be extended by ${q(c)} (it needs ${q(s[j])}). Which shorter head is tried next (its length)?`,
          nj,
          [0, j - 1, 1].filter((x) => x !== nj),
          nj ? `${q(s.slice(0, j))} itself starts and ends with ${q(s.slice(0, nj))}; the table stored that ${nj} at cell ${j - 1}.` : `No head of ${q(s.slice(0, j))} is also its tail (table cell ${j - 1} is 0).`,
        );
      }
    }
    // right after a table cell is written: does the next letter extend the head?
    if (!writes(ctx, a) || ni !== i + 1 || i < 1) return null;
    const c = s[ni];
    const grow = `It grows to ${pl(j + 1)}`;
    const shrink = j ? 'A shorter head is tried' : 'It stays empty (0)';
    const kind = nj === j + 1 && c === s[j] ? grow : nj < j || (nj === 0 && j === 0 && c !== s[0]) ? shrink : null;
    if (!kind || (!j && kind !== grow)) return null;
    return options(
      `The head is ${j ? q(s.slice(0, j)) : 'empty'} and the next letter is ${q(c)} (letter ${ni}). What happens to the head?`,
      kind,
      [kind === grow ? shrink : grow],
      kind === grow ? `${q(c)} equals ${q(s[j])}, so ${q(s.slice(0, j + 1))} is both a head and the newest tail.` : `${q(c)} is not ${q(s[j])}, so ${j ? 'the table offers a shorter head to try' : 'no head ends here'}.`,
    );
  },
  bugs: [
    {
      label: 'Start at letter 0: the whole word counts',
      find: 'for (let i = 1, len = 0;',
      replace: 'for (let i = 0, len = 0;',
      explain: 'Letter 0 is compared with itself, so every head is one letter too long, and "aaaa" returns the whole word, which is not a proper prefix.',
    },
    {
      label: 'Fall back once (if) instead of repeatedly (while)',
      find: 'while (len > 0 && s[i] !== s[len])',
      replace: 'if (len > 0 && s[i] !== s[len])',
      explain: 'After one jump the letter may still not fit, but the code stops jumping and keeps a stale head, so a border that is not really there can be counted.',
    },
  ],
};
