// Repeated DNA Sequences (sliding 10-letter window + a set of seen windows). A 10-letter window slides along the
// strand; each window gets a barcode (2 bits per letter, or the 10 letters themselves) that goes into a "seen" box.
// A barcode already in the box is a repeat; a second box makes sure each repeat is reported only once.
// Works with a rolling code that ends at i, or with a substring variable; a counting Map gets the notes only.
import { entriesOf, row } from './util.js';

const W = 10;
const IDX = ['i', 'end', 'r', 'right', 'j', 'idx', 'start', 'k'];
const CODE = ['code', 'hash', 'key', 'h', 'bits', 'cur', 'curr', 'mask', 'window', 'num', 'val'];
const RES = ['res', 'result', 'ans', 'answer', 'out', 'output', 'repeated', 'list', 'ret'];
const q = (x) => `'${x}'`;
const sets = (vars) => Object.entries(vars).filter(([, v]) => v && v.$set);
const resOf = (vars) => {
  const k = RES.find((x) => row(vars[x]));
  return k ? [k, vars[k]] : [];
};
/** the "already reported" box: the second set, or one named like it */
const reportedBox = (vars) => {
  const all = sets(vars);
  return all.find(([k]) => /add|rep|dup|twice|out|res|found|done/i.test(k)) || (all.length === 2 ? all[1] : null);
};

/** the window this step is looking at: from a 10-letter substring variable, or from a rolling code that ends at i */
function windowOf(ctx, vars) {
  const s = vars[ctx.params[0]];
  if (typeof s !== 'string') return null;
  const iName = IDX.find((x) => Number.isInteger(vars[x]) && vars[x] >= 0 && vars[x] < s.length);
  if (!iName) return null;
  const i = vars[iName];
  const sub = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && typeof v === 'string' && v.length === W);
  if (sub) {
    if (s.slice(i, i + W) === sub[1]) return { s, iName, i, start: i, win: sub[1], key: sub[0] };
    if (i >= W - 1 && s.slice(i - W + 1, i + 1) === sub[1]) return { s, iName, i, start: i - W + 1, win: sub[1], key: sub[0] };
    return null;
  }
  const code = CODE.find((x) => Number.isInteger(vars[x]));
  if (!code) return null;
  return { s, iName, i, start: i - W + 1, win: i >= W - 1 ? s.slice(i - W + 1, i + 1) : null, key: code, rolling: true };
}

export default {
  id: 'repeated-dna-sequences',
  metaphor: 'Barcoding every 10-letter window',
  caption: 'A 10-letter window slides along the strand. Each full window gets a barcode and is checked against the "seen" box: new barcodes go in, a barcode already there is a repeat, and a second box keeps each repeat from being reported twice.',
  compare: 'res',
  narrate(ctx) {
    const w = windowOf(ctx, ctx.vars);
    if (!w) {
      const [rName, res] = resOf(ctx.vars);
      return ctx.ret && rName ? `the strand is done: ${res.length ? res.map(q).join(', ') : 'no 10-letter window'} ${res.length === 1 ? 'appears' : 'appear'} more than once` : null;
    }
    const at = `(cells ${w.start}..${w.start + W - 1})`;
    const [rName, res] = resOf(ctx.vars);
    const pres = rName && row(ctx.prev[rName]);
    if (pres && res.length === pres.length + 1) return `report ${q(res.at(-1))}: it has a twin (${res.length} found)`;
    const rb = reportedBox(ctx.vars);
    const prb = rb && ctx.prev[rb[0]];
    if (rb && prb?.$set && rb[1].$size === prb.$size + 1 && w.win) return `${q(w.win)} is in the "seen" box already: a repeat, mark it as reported`;
    const seen = sets(ctx.vars).find((e) => e !== rb);
    const ps = seen && ctx.prev[seen[0]];
    if (seen && ps?.$set && seen[1].$size === ps.$size + 1 && w.win) return `${q(w.win)} ${at} is new: its barcode goes into the "seen" box (${seen[1].$size} kind${seen[1].$size === 1 ? '' : 's'} so far)`;
    // a counting Map instead of a set
    for (const [k, v] of Object.entries(ctx.vars)) {
      const e = entriesOf(v);
      const pe = entriesOf(ctx.prev[k]);
      if (!e || !pe || !w.win || JSON.stringify(e) === JSON.stringify(pe)) continue;
      const hit = e.find(([key]) => key === w.win || key === ctx.vars[w.key]);
      if (hit && Number.isInteger(hit[1])) return `${q(w.win)} ${at} has now been seen ${hit[1]} time${hit[1] === 1 ? '' : 's'}`;
    }
    if (w.i === ctx.prev[w.iName]) return null;
    if (w.rolling && !w.win) return `${q(w.s[w.i])} slides in: ${w.i + 1} of ${W} letters, the window is not full yet`;
    if (w.win && w.rolling && w.start > 0) return `window ${q(w.win)} ${at}: barcode ${ctx.vars[w.key]} (the oldest letter's bits drop out, ${q(w.s[w.i])}'s come in)`;
    if (w.win) return `window ${q(w.win)} ${at}${w.rolling ? `: barcode ${ctx.vars[w.key]}` : ''}`;
    return null;
  },
  // a full window just arrived: new, a first repeat, or a repeat already reported?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = windowOf(ctx, ctx.vars);
    if (!w?.win || w.i === ctx.prev[w.iName] || w.s.indexOf(w.win) >= w.start) return null; // ask only about windows that did appear before
    const nx = ctx.next.vars;
    const [rName, res] = resOf(ctx.vars);
    const all = sets(ctx.vars);
    if (!all.length) return null;
    const rb = reportedBox(ctx.vars);
    const grew = (e) => nx[e[0]]?.$set && nx[e[0]].$size === e[1].$size + 1;
    const others = all.filter((e) => e !== rb);
    let kind = null;
    if ((rb && grew(rb)) || (rName && row(nx[rName]) && nx[rName].length === res.length + 1)) kind = 'report';
    else if (others.some(grew)) kind = 'new';
    else if (nx[w.iName] === w.i + 1 && all.every((e) => nx[e[0]]?.$size === e[1].$size) && (!rName || nx[rName]?.length === res.length)) kind = 'skip';
    if (!kind) return null;
    const opts = ['New: put its barcode in the "seen" box', 'A repeat seen for the first time: report it', 'Already reported: skip it'];
    const first = w.s.indexOf(w.win);
    const second = w.s.indexOf(w.win, first + 1);
    return {
      question: `Window ${q(w.win)} (cells ${w.start}..${w.start + W - 1}) is full. What happens to it?`,
      options: opts,
      answer: { new: 0, report: 1, skip: 2 }[kind],
      explain:
        kind === 'report'
          ? `The same 10 letters already appeared at cell ${first}, so the barcode is in the "seen" box, and this repeat has not been reported yet.`
          : kind === 'skip'
            ? `${q(w.win)} appeared at cells ${first} and ${second} before, and it was reported then; reporting it again would list it twice.`
            : `This code has not stored the earlier copy at cell ${first}, so it treats the window as new.`,
    };
  },
  bugs: [
    {
      label: 'Report a repeat every time it shows up',
      find: 'if (!added.has(code)) {',
      replace: 'if (true) {',
      explain: 'A window that appears three times is reported on its second and its third appearance, so the answer lists it twice.',
    },
    {
      label: 'Barcode the window before it is full',
      find: 'if (i < L - 1) continue;',
      replace: '',
      explain: 'The first nine "windows" are shorter than 10 letters, yet their barcodes go into the box; a short run of A\'s has the same barcode 0 as "AAAAAAAAAA", so a fake repeat is reported.',
    },
  ],
};
