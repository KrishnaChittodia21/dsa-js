// Sum of Subarray Minimums (two monotonic-stack passes). Each number rules a stretch of the array where it is the
// smallest: the left pass measures how far it reaches back, the right pass how far forward; it is the minimum of
// left × right subarrays. Works with count arrays under left/right-like names and a stack of indices.
import { changedIdx, firstInt, options, row } from './util.js';

const IDX = ['i', 'j', 'idx', 'k', 'x'];

const LEFT = /^(left|l|lft|prev|ple|leftCount|leftCnt|lefts|L)$/i;
const RIGHT = /^(right|r|rgt|next|nle|rightCount|rightCnt|rights|R)$/i;
const ofLen = (vars, re, n, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && re.test(k) && row(v) && v.length === n) || null;
const stackOf = (vars, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /stack|^st$|^stk$|^s$|mono/i.test(k) && row(v)) || null;
// the cell written this step in one of the two count arrays: [side, index, value]
function written(vars, prev, a, skip) {
  for (const [side, re] of [['left', LEFT], ['right', RIGHT]]) {
    const e = ofLen(vars, re, a.length, skip);
    if (!e || !row(prev[e[0]])) continue;
    const d = changedIdx(e[1], prev[e[0]]);
    if (d.length === 1 && Number.isInteger(e[1][d[0]])) return [side, d[0], e[1][d[0]], e[0]];
  }
  return null;
}
// c reads as a count of places a[i] rules (not a boundary index): everything inside is ≥ a[i], the stopper is ≤ a[i]
function isCount(a, side, i, c) {
  const j = side === 'left' ? i - c : i + c;
  if (c < 1 || j < -1 || j > a.length) return false;
  const inside = side === 'left' ? a.slice(j + 1, i) : a.slice(i + 1, j);
  return inside.every((x) => x >= a[i]) && (j < 0 || j >= a.length || a[j] <= a[i]);
}

export default {
  id: 'sum-of-subarray-minimums',
  metaphor: 'How far each number rules as smallest',
  caption: 'Each number is the minimum of every subarray inside its stretch: back to the previous smaller number, forward to the next one. The stack keeps indices with rising values, so the nearest smaller one is on top.',
  narrate(ctx) {
    const aName = ctx.params[0];
    const a = row(ctx.vars[aName]);
    if (!a) return null;
    const skip = [aName];
    const w = written(ctx.vars, ctx.prev, a, skip);
    if (w && isCount(a, w[0], w[1], w[2])) {
      const [side, i, c] = w;
      const j = side === 'left' ? i - c : i + c;
      const stop = j >= 0 && j < a.length ? `stopped by ${a[j]} at ${j}` : (side === 'left' ? 'nothing smaller before it' : 'nothing smaller or equal after it');
      return `${a[i]} at ${i} rules ${c} place${c > 1 ? 's' : ''} ${side === 'left' ? 'back' : 'forward'} (itself included), ${stop}: ${c} choice${c > 1 ? 's' : ''} for the ${side} end`;
    }
    const st = stackOf(ctx.vars, skip);
    const was = st && row(ctx.prev[st[0]]);
    if (st && was && st[1].every((x) => Number.isInteger(x) && x >= 0 && x < a.length)) {
      if (st[1].length === was.length - 1 && was.length) {
        const t = was.at(-1);
        const [, i] = firstInt(ctx.vars, IDX);
        if (!(i >= 0 && i < a.length && i !== t)) return `pop ${a[t]} (index ${t}) off the stack`;
        return `pop ${a[t]} (index ${t}): ${a[i]} at ${i} is ${a[i] === a[t] ? 'just as small' : 'smaller'} and nearer, so ${a[t]} never stops anyone again`;
      }
      if (st[1].length === was.length + 1) return `push index ${st[1].at(-1)} (${a[st[1].at(-1)]}) · stack values: ${st[1].map((x) => a[x]).join(', ')}`;
      if (!st[1].length && was.length > 1) return 'empty the stack for the pass in the other direction';
    }
    // the total grows by one number's share
    const tot = Object.entries(ctx.vars).find(([k, v]) => /total|sum|res|ans/i.test(k) && Number.isInteger(v) && Number.isInteger(ctx.prev[k]) && v !== ctx.prev[k]);
    const L = ofLen(ctx.vars, LEFT, a.length, skip);
    const R = ofLen(ctx.vars, RIGHT, a.length, skip);
    if (tot && L && R) {
      const [, iv] = firstInt(ctx.vars, IDX);
      const share = (k) => Number.isInteger(L[1][k]) && Number.isInteger(R[1][k]) && a[k] * L[1][k] * R[1][k] === tot[1] - ctx.prev[tot[0]];
      const i = iv >= 0 && iv < a.length && share(iv) ? iv : a.findIndex((x, k) => Number.isInteger(L[1][k]) && Number.isInteger(R[1][k]) && x * L[1][k] * R[1][k] === tot[1] - ctx.prev[tot[0]]);
      if (i >= 0) return `${a[i]} is the minimum of ${L[1][i]} × ${R[1][i]} = ${L[1][i] * R[1][i]} subarray${L[1][i] * R[1][i] > 1 ? 's' : ''}: add ${a[i] * L[1][i] * R[1][i]} · total ${tot[1]}`;
    }
    return null;
  },
  // right before a reach is written: how many choices for that end?
  predict(ctx) {
    const aName = ctx.params[0];
    const a = row(ctx.vars[aName]);
    const nx = ctx.next;
    if (!a || !nx) return null;
    const w = written(nx.vars, ctx.vars, a, [aName]);
    if (!w) return null;
    const [side, i, c] = w;
    if (!isCount(a, side, i, c)) return null;
    if ((side === 'left' && i === 0) || (side === 'right' && i === a.length - 1)) return null;
    const reach = side === 'left' ? i + 1 : a.length - i;
    return options(
      `${a[i]} at index ${i}: counting itself, how many places ${side === 'left' ? 'back' : 'forward'} does it stay the minimum (choices for the ${side} end)?`,
      c,
      [1, c + 1, c - 1, reach].filter((x) => x >= 1 && x <= reach && x !== c),
      `Walking ${side === 'left' ? 'back' : 'forward'} from ${a[i]}, the first number that stops it is ${(() => {
        const j = side === 'left' ? i - c : i + c;
        return j >= 0 && j < a.length ? `${a[j]} at index ${j}` : `none (it reaches the ${side === 'left' ? 'start' : 'end'})`;
      })()}, so there are ${c} choice${c > 1 ? 's' : ''}.`,
    );
  },
  bugs: [
    {
      label: 'Strict on both sides: ties counted twice',
      find: 'arr[st[st.length - 1]] >= arr[i]',
      replace: 'arr[st[st.length - 1]] > arr[i]',
      explain: 'With [2, 2] both 2s now claim the subarray [2, 2], so it is counted twice: 8 instead of 6.',
    },
    {
      label: 'Non-strict on both sides: ties counted zero times',
      find: 'arr[st[st.length - 1]] > arr[i]',
      replace: 'arr[st[st.length - 1]] >= arr[i]',
      explain: 'Now each equal copy stops at the other one on both sides, so a subarray like [1, 1] belongs to nobody and is never added.',
    },
  ],
};
