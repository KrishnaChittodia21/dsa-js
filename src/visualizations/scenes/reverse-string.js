// Scene: Reverse String, in place. Two hands hold the outermost letters, swap them and step inward until they
// meet or cross. Works with the recursive go(l, r) helper and with a two-pointer loop (l/r, left/right, i/j,
// lo/hi, start/end), with a destructuring swap or a temp variable (two half steps).
import { changedIdx, row, swapped } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const SWAP_LINE = /^\s*\[.*\]\s*=\s*\[|^\s*\w+\[[^\]]+\]\s*=\s*\w+(?:\[[^\]]+\])?\s*;|^\s*(?:const|let|var)?\s*\w+\s*=\s*\w+\[[^\]]+\]\s*;/;
const q = (c) => `'${c}'`;

export default {
  id: 'reverse-string',
  metaphor: 'Two hands swapping the outer letters',
  caption: 'The two pointers are your hands on the outermost letters not yet fixed. Swap them, step both hands inward, and stop when they meet or cross.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = row(ctx.vars[sName]);
    const was = row(ctx.prev[sName]);
    if (!ctx.next && s) return `done: ${s.join('')}, reversed in place`;
    if (!s) return null;
    if (was && was.length === s.length) {
      const sw = swapped(s, was);
      if (sw) return `swap the ends: ${q(was[sw[0]])} ↔ ${q(was[sw[1]])} (positions ${sw[0]} and ${sw[1]})`;
      const ch = changedIdx(s, was);
      if (ch.length === 1) {
        const k = ch[0];
        // a temp swap: the first half leaves a duplicate, the second finishes the trade
        return s.filter((c) => c === s[k]).length > was.filter((c) => c === s[k]).length && was.includes(s[k]) ? `position ${k} takes ${q(s[k])}; the old ${q(was[k])} waits aside` : `position ${k} gets ${q(s[k])} back: the pair is swapped`;
      }
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (/^\s*\[|^\s*(?:const|let|var)?\s*\w+\s*=\s*\w+\[/.test(ctx.src || '') && SWAP_LINE.test(ctx.src || '') && s[l] === s[r] && l < r) return `both hands hold ${q(s[l])}: the swap changes nothing`;
    if (ctx.ret) return l === r ? `the hands meet at position ${l}: the middle ${q(s[l])} stays put` : l > r ? `the hands crossed (${l} > ${r}): every pair is swapped` : null;
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    if (!Number.isInteger(pl) || !Number.isInteger(pr)) return l < r ? `hands on the ends: ${q(s[l])} at ${l} and ${q(s[r])} at ${r}` : null;
    const settled = l >= pl && r <= pr && (l > pl || r < pr) && (!ctx.next || (ctx.next.vars[lName] === l && ctx.next.vars[rName] === r));
    if (settled && l < r) return `step inward: ${q(s[l])} at ${l} and ${q(s[r])} at ${r}`;
    if (l < pl && r > pr) return `back out in the call for ${l}..${r}: its two ends were swapped before, nothing more to do`;
    return null;
  },
  // the hands just moved: swap again, or stop?
  predict(ctx) {
    const [sName] = ctx.params;
    const s = row(ctx.vars[sName]);
    const pair = pairOf(ctx.vars);
    const nx = ctx.next;
    if (!s || !pair || !nx) return null;
    const [lName, rName] = pair;
    let l = ctx.vars[lName];
    let r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    const nl = nx.vars[lName];
    const nr = nx.vars[rName];
    const ns = row(nx.vars[sName]);
    let stop;
    let at;
    if (nx.ret && Number.isInteger(nl) && Number.isInteger(nr) && nl > l && nr < r) {
      // the next call starts with its base case: it stops right away
      stop = true;
      at = [nl, nr];
    } else {
      // settled: both hands have moved inward since the last swap, and the next step does not move them again
      if (!Number.isInteger(pl) || !Number.isInteger(pr) || !(l >= pl && r <= pr && (l > pl || r < pr)) || nl !== l || nr !== r) return null;
      if (!(SWAP_LINE.test(ctx.lines[nx.line - 1] || '') || (ns && changedIdx(ns, s).length > 0))) return null;
      stop = false;
      at = [l, r];
    }
    [l, r] = at;
    return {
      question: `The hands ${stop ? 'step inward to' : 'are now at'} ${l} and ${r}. What happens next?`,
      options: [l < r ? `Swap ${sName}[${l}] and ${sName}[${r}]` : "Swap again", 'Stop: nothing left to swap'],
      answer: stop ? 1 : 0,
      explain: stop ? (l === r ? 'Both hands are on the same middle letter: it is already in place.' : `The hands crossed (${l} > ${r}): every pair has been swapped.`) : `${l} < ${r}: there is still an unswapped pair between the hands.`,
    };
  },
  bugs: [
    {
      label: 'Stop only when the hands meet exactly',
      find: 'if (l >= r) return;',
      replace: 'if (l === r) return;',
      explain: 'With an even number of letters the hands cross without ever landing on the same spot, so the swapping never stops.',
    },
    {
      label: 'Stop one pair early',
      find: 'if (l >= r) return;',
      replace: 'if (l + 1 >= r) return;',
      explain: 'Two letters side by side still need a swap; stopping there leaves the middle pair of "abcd" unswapped ("dbca").',
    },
  ],
};
