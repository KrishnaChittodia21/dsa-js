// Height Checker. The class photo line versus the line it should be (sorted by height): walk both lines together
// and count the spots where the student standing there is not the one who belongs there. Works with a sorted copy
// (expected[i]) or with a height tally walked in order (counting sort, the current height in h / cur).
import { changedIdx, firstInt, row } from './util.js';

const COUNT = ['mismatches', 'mismatch', 'count', 'cnt', 'ans', 'res', 'result', 'diff', 'wrong', 'moves'];
const IDX = ['i', 'idx', 'j', 'k', 'pos'];
const CUR = ['h', 'cur', 'curr', 'height', 'want', 'expected', 'target'];
const cells = (v) => row(v) || row(v?.$array);
const asc = (a) => a.every((x, i) => i === 0 || a[i - 1] <= x);

/** what should stand at spot i: a sorted copy's cell, or the counting walk's current height */
function wanted(vars, hName, i) {
  const h = row(vars[hName]);
  const copy = Object.entries(vars).find(([k, v]) => k !== hName && row(v) && v.length === h.length && asc(v) && v.every(Number.isInteger));
  if (copy) return copy[1][i];
  const tallied = Object.values(vars).some((v) => cells(v) && cells(v).length > h.length);
  const [, cur] = firstInt(vars, CUR.filter((k) => k !== hName));
  return tallied ? cur : undefined;
}

export default {
  id: 'height-checker',
  metaphor: 'Class photo line vs the height-ordered line',
  caption: 'The top row is where students actually stand. Walking the line spot by spot, each student is compared with the height that belongs there in the sorted line; a different height is one student out of place.',
  compare: 'mismatches',
  narrate(ctx) {
    const hName = ctx.params[0];
    const hs = row(ctx.vars[hName]);
    if (!hs) return null;
    const [cName, cnt] = firstInt(ctx.vars, COUNT);
    const [iName, i] = firstInt(ctx.vars, IDX);
    if (cName && Number.isInteger(ctx.prev[cName]) && cnt === ctx.prev[cName] + 1 && iName && i < hs.length) {
      const w = wanted(ctx.vars, hName, i);
      return w === undefined ? `spot ${i}: the student of height ${hs[i]} is out of place (${cnt} so far)` : `spot ${i}: height ${hs[i]} stands where the sorted line has ${w}: out of place (${cnt} so far)`;
    }
    for (const [k, v] of Object.entries(ctx.vars)) {
      const now = row(v);
      if (k === hName || !now || now.length !== hs.length || row(ctx.prev[k]) || !asc(now)) continue;
      return `the line as it should be, shortest first: [${now.join(', ')}]`;
    }
    for (const [k, v] of Object.entries(ctx.vars)) {
      const now = cells(v);
      const was = cells(ctx.prev[k]);
      if (k === hName || !now || !was || now.length <= hs.length || now.length !== was.length) continue;
      const d = changedIdx(now, was);
      if (d.length === 1 && now[d[0]] === was[d[0]] + 1) return `a student of height ${d[0]} is counted (${now[d[0]]} of that height so far)`;
    }
    return null;
  },
  // right before a student is found out of place: which spot is it?
  predict(ctx) {
    if (!ctx.next) return null;
    const hName = ctx.params[0];
    const hs = row(ctx.vars[hName]);
    const [cName, cnt] = firstInt(ctx.vars, COUNT);
    const [iName, i] = firstInt(ctx.vars, IDX);
    if (!hs || !cName || !iName || ctx.next.vars[cName] !== cnt + 1) return null;
    const spot = ctx.next.vars[iName];
    if (!Number.isInteger(spot) || spot < i || spot >= hs.length) return null;
    const line = [...hs].sort((a, b) => a - b);
    const fine = hs.map((_, x) => x).filter((x) => x >= i && x !== spot && hs[x] === line[x]);
    const other = hs.map((_, x) => x).filter((x) => x >= i && x !== spot && !fine.includes(x));
    const pick = [...fine, ...other].slice(0, 3);
    // after the first one, ask only when an in-place student must be told apart (else every spot is the answer)
    if (!pick.length || (cnt > 0 && !fine.length)) return null;
    const opts = [spot, ...pick].sort((a, b) => a - b);
    return {
      question: `The sorted line is [${line.join(', ')}]. Which spot is found out of place next?`,
      options: opts.map((x) => `spot ${x} (height ${hs[x]})`),
      answer: opts.indexOf(spot),
      explain: `At spot ${spot} stands height ${hs[spot]}, but the sorted line has ${line[spot]} there.`,
    };
  },
  bugs: [
    {
      label: 'Never use a student up',
      find: 'count[h]--;',
      replace: '',
      explain: 'The box for the current height never empties, so the sorted line stays on the shortest height forever: every taller student looks out of place.',
    },
    {
      label: 'Never skip used-up heights',
      find: 'while (count[h] === 0) h++;',
      replace: 'if (count[h] === 0) h++;',
      explain: 'When a height is used up and the next one is also missing (heights 1 and 4 only), the walk stops on an empty box and compares against a height nobody has.',
    },
  ],
};
