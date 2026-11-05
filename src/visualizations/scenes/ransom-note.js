// Ransom Note (frequency count). The magazine's letters go into a pile of 26 trays; the note then cuts its letters
// out of the trays one by one. A tray that runs dry means the note cannot be written. Reads a 26-count array, or a
// Map / plain object of letter counts (any name, not the parameters).
import { entriesOf, options, row } from './util.js';

const L = (i) => String.fromCharCode(97 + i);
const q = (c) => `'${c}'`;
// the letter trays as [[letter, count]…] plus the variable name, or null
function traysOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    const r = row(v);
    if (r && r.length === 26 && r.every(Number.isInteger)) return [k, r.map((c, i) => [L(i), c])];
    const es = entriesOf(v);
    if (es && es.every(([key, c]) => typeof key === 'string' && key.length === 1 && Number.isInteger(c))) return [k, es];
  }
  return null;
}
const countIn = (es, c) => es.find(([k]) => k === c)?.[1] ?? 0;
// the one tray that changed between two snapshots: [letter, before, after]
function changedTray(a, b) {
  if (!a || !b || a[0] !== b[0]) return null;
  const keys = new Set([...a[1], ...b[1]].map(([k]) => k));
  const d = [...keys].filter((k) => countIn(a[1], k) !== countIn(b[1], k));
  return d.length === 1 ? [d[0], countIn(a[1], d[0]), countIn(b[1], d[0])] : null;
}
// the note letter being cut now: a one-letter variable, or a letter index (0–25) named c / code / idx
function letterOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) if (!params.includes(k) && typeof v === 'string' && v.length === 1 && /^[a-z]$/.test(v)) return v;
  for (const k of ['c', 'code', 'idx', 'ci']) if (Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < 26) return L(vars[k]);
  return null;
}

export default {
  id: 'ransom-note',
  metaphor: 'Cutting letters out of a magazine',
  caption: 'Each tray holds the copies of one letter cut from the magazine. The note takes one copy per letter it needs; when a tray is empty and the note still needs that letter, the note cannot be written.',
  narrate(ctx) {
    const [nName, mName] = ctx.params;
    const note = ctx.vars[nName];
    const mag = ctx.vars[mName];
    if (typeof note !== 'string' || typeof mag !== 'string') return null;
    if (ctx.next?.ret && ctx.result === false && !traysOf(ctx.vars, ctx.params) && note.length > mag.length) return `the note needs ${note.length} letters, the magazine has only ${mag.length}: impossible before counting anything`;
    const t = traysOf(ctx.vars, ctx.params);
    if (!t) return null;
    const ch = changedTray(traysOf(ctx.prev, ctx.params), t);
    if (ch) {
      const [c, was, now] = ch;
      if (now === was + 1) return `the magazine gives one ${q(c)}: ${now} in the ${q(c)} tray`;
      if (now === was - 1 && now < 0) return `the note needs one more ${q(c)} but the tray is empty: the note cannot be written`;
      if (now === was - 1) return `the note cuts one ${q(c)}: ${now} left in the tray`;
    }
    if (ctx.ret && ctx.result === true) return 'every letter of the note was cut from the trays: it can be written';
    if (ctx.ret && ctx.result === false) {
      const c = letterOf(ctx.vars, ctx.params);
      if (c && countIn(t[1], c) <= 0) return `the note needs one ${q(c)} and the tray is empty: the note cannot be written`;
    }
    return null;
  },
  // the note wants a letter: is there a copy left in its tray?
  predict(ctx) {
    const t = traysOf(ctx.vars, ctx.params);
    if (!t || !ctx.next) return null;
    const after = traysOf(ctx.next.vars, ctx.params);
    const ch = changedTray(t, after);
    let c;
    let ok;
    if (ch && ch[2] === ch[1] - 1) {
      // a tray goes down by one: fine if it stays at 0 or above, unless the run stops on it right away
      [c] = ch;
      ok = ch[2] >= 0 && !(ctx.next.ret && ctx.result === false);
    } else if (!ch && ctx.next.ret && ctx.result === false) {
      // a check before the cut: the run stops with the tray untouched
      c = letterOf(ctx.vars, ctx.params);
      if (!c || countIn(t[1], c) > 0) return null;
      ok = false;
    } else return null;
    const have = countIn(t[1], c);
    const yes = `Cut one ${q(c)} and go on`;
    const no = `The tray is empty: return false`;
    return options(`The note needs one ${q(c)}. The ${q(c)} tray holds ${have}. What happens?`, ok ? yes : no, [ok ? no : yes], ok ? `There is still a ${q(c)} in the tray, so the note takes it (${have - 1} left).` : `Every ${q(c)} from the magazine is already used, so the note cannot be finished.`);
  },
  bugs: [
    {
      label: 'Last copy of a letter refused',
      find: '--count[c] < 0',
      replace: '--count[c] <= 0',
      explain: 'Taking the last copy leaves 0, which now counts as "ran out": "aa" from "aab" says false although two a\'s are there.',
    },
    {
      label: 'Letters are never used up',
      find: '--count[c] < 0',
      replace: 'count[c] - 1 < 0',
      explain: 'The tray only checks that the letter exists and never loses a copy, so "aa" from "ab" reuses the one a: true.',
    },
  ],
};
