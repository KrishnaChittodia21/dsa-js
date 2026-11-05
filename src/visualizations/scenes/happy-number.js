// Scene: Happy Number. Every number has exactly one next stop (the sum of its digits squared), so the numbers form a
// trail that either settles on 1 (1 → 1 forever) or runs round a loop. Two runners (slow: 1 hop, fast: 2 hops) or a
// pile of numbers already seen tell which. Reads slow/fast (tortoise/hare) or a seen Set; digit steps via sum/d.
import { firstInt, options } from './util.js';

const SLOW = ['slow', 'tortoise', 'slw', 'sl', 'a'];
const FAST = ['fast', 'hare', 'fst', 'fa', 'b'];
const SUM = ['sum', 'total', 'squares', 'acc', 'res', 's', 'nxt'];
const DIGIT = ['d', 'digit', 'dig', 'r', 'rem', 'last', 'ld'];
const isInt = Number.isInteger;
const runners = (v) => {
  const s = SLOW.find((k) => isInt(v?.[k]));
  const f = FAST.find((k) => isInt(v?.[k]));
  return s && f ? [s, f] : null;
};
const seenOf = (v) => Object.keys(v || {}).find((k) => v[k] && v[k].$set);
// the helper that squares digits has its own variables (x, sum…): a main-loop step has none the previous step lacked
/** one hop of the trail: the sum of the digits squared (fixed by the problem, used only for the round-1 check) */
const step = (x) => String(x).split('').reduce((a, c) => a + c * c, 0);
const inHelper = (ctx, vars) => Object.keys(vars).some((k) => !(k in ctx.vars)) || Object.keys(ctx.vars).some((k) => !(k in vars));

export default {
  id: 'happy-number',
  metaphor: 'Two runners on a digit-square trail',
  caption: 'Each number points to one next number: the sum of its digits squared. The trail either reaches 1 and stays there, or runs round a loop forever; a fast runner (2 hops) and a slow one (1 hop) find out which.',
  compare: 'fast',
  narrate(ctx) {
    const v = ctx.vars;
    const p = ctx.prev;
    const [nName] = ctx.params;
    // inside the digit-square helper
    const [sName, sum] = firstInt(v, SUM);
    const [dName, d] = firstInt(v, DIGIT);
    if (sName && dName && sName in p && isInt(p[sName]) && sum - p[sName] === d * d && (sum !== p[sName] || new RegExp(`\\b${sName}\\b`).test(ctx.src || ''))) {
      return d ? `digit ${d}: ${d}² = ${d * d}, running total ${sum}` : `digit 0 adds nothing: running total stays ${sum}`;
    }
    if (sName && ctx.ret && sName in p) return `the digits squared add up to ${sum}: that is the next stop on the trail`;
    const r = runners(v);
    if (r) {
      const [sl, fa] = r;
      const s = v[sl];
      const f = v[fa];
      if (ctx.ret && !runners(ctx.next?.vars || {}) && !(sName && dName)) {
        if (ctx.result === true) return `fast reached 1, and 1 only leads back to 1: ${ctx.input[0]} is happy`;
        if (ctx.result === false) return `slow and fast meet at ${s} without passing 1: the trail is a loop, ${ctx.input[0]} is not happy`;
        return null;
      }
      if (sName) return null;
      if (!(fa in p) && sl in v) return `slow starts at ${s}, fast starts one hop ahead at ${f}`;
      if (sl in p && s !== p[sl] && f === p[fa]) return `slow takes one hop: ${p[sl]} → ${s} (fast waits at ${f})`;
      if (fa in p && f !== p[fa] && s === p[sl]) return `fast takes two hops: ${p[fa]} → … → ${f} (slow is at ${s})`;
      return null;
    }
    // seen-pile version: n walks the trail, a Set remembers every stop
    const seen = seenOf(v);
    if (seen && seen in p && v[seen].$size > (p[seen]?.$size ?? 0)) {
      return `${v[seen].$set[v[seen].$set.length - 1]} goes on the seen pile (${v[seen].$size} number${v[seen].$size > 1 ? 's' : ''} seen)`;
    }
    if (seen && ctx.ret && isInt(v[nName])) {
      if (ctx.result === true) return `the walk reached 1, and 1 only leads back to 1: ${ctx.input[0]} is happy`;
      if (ctx.result === false) return `${v[nName]} is already on the seen pile: the trail is a loop without 1, not happy`;
    }
    if (nName && isInt(v[nName]) && isInt(p[nName]) && v[nName] !== p[nName] && (!sName || v[sName] === v[nName])) return `next stop on the trail: ${v[nName]}`;
    return null;
  },
  // right after fast's two hops (or a new stop): does the walk end here? Asks every stop, and "keep going" only on round 1
  predict(ctx) {
    if (!ctx.next) return null;
    const v = ctx.vars;
    const r = runners(v);
    const [nName] = ctx.params;
    const seen = seenOf(v);
    let at;
    let first;
    let note;
    if (r) {
      const [sl, fa] = r;
      if (firstInt(v, SUM)[0] || !(fa in ctx.prev) || v[fa] === ctx.prev[fa]) return null; // not inside the helper
      at = v[fa];
      first = v[sl] === step(ctx.input[0]);
      note = `Slow is at ${v[sl]}, fast just landed on ${at}`;
    } else if (seen && isInt(v[nName]) && nName in ctx.prev && v[nName] !== ctx.prev[nName]) {
      at = v[nName];
      first = at === step(ctx.input[0]);
      note = `The walk just reached ${at}`;
    } else return null;
    const stop = ctx.next.ret && !firstInt(ctx.next.vars, SUM)[0]; // a helper's `return sum` is not the end
    const goOn = !ctx.next.ret && (inHelper(ctx, ctx.next.vars) || (seen && ctx.next.vars[seen]?.$size > v[seen].$size));
    if (!stop && !(goOn && first)) return null;
    const right = !stop ? 'Keep going' : at === 1 ? 'Stop: it reached 1, happy' : 'Stop: a repeat, so it loops (not happy)';
    return options(
      `${note}. Does the walk end here?`,
      right,
      ['Keep going', 'Stop: it reached 1, happy', 'Stop: a repeat, so it loops (not happy)'],
      !stop
        ? `${at} is not 1${r ? ' and fast has not caught slow' : ' and has not been seen before'}, so nothing is decided yet.`
        : at === 1
          ? '1 leads only to 1, so once the walk is on 1 the answer is known: happy.'
          : `${r ? 'Fast caught up with slow' : `${at} was seen before`}: the trail is a loop that never touches 1.`,
    );
  },
  bugs: [
    {
      label: 'Return slow === 1',
      find: 'return fast === 1;',
      replace: 'return slow === 1;',
      explain: 'The loop stops as soon as fast reaches 1, while slow is still behind (68 for n = 19), so a happy number is reported unhappy.',
    },
    {
      label: 'x / 10 without Math.floor',
      find: 'x = Math.floor(x / 10);',
      replace: 'x = x / 10;',
      explain: 'Numbers are floats in JS: 19 / 10 is 1.9, not 1, so the digit loop keeps chopping fractions and the digit-square sums are garbage.',
    },
  ],
};
