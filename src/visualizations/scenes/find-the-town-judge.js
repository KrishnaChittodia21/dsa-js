// Find the Town Judge (degree counting). Every trust pair moves points: the truster loses one (a judge trusts
// nobody), the trusted gains one. The judge is the one person who ends with n − 1. Works with one net score row
// (score / net / balance / count) or two rows (in-degree / out-degree, trusted / trusts).
import { changedIdx, options, row } from './util.js';

const isCounts = (v) => !!row(v) && v.length > 0 && v.every((x) => Number.isInteger(x));
// the per-person tally rows that changed between two steps (skips the parameters)
function tallies(ctx) {
  return Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && isCounts(ctx.vars[k]) && isCounts(ctx.prev[k]) && ctx.vars[k].length === ctx.prev[k].length);
}

export default {
  id: 'find-the-town-judge',
  metaphor: 'Townsfolk passing trust tokens',
  caption: 'Each "a trusts b" moves a token: a loses one (a judge trusts nobody), b gains one. Only a person trusted by all n − 1 others who trusts nobody ends on n − 1.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && Number.isInteger(ctx.value)) {
      return ctx.value === -1 ? `nobody is trusted by all ${Number.isInteger(n) ? n - 1 : 'n − 1'} others while trusting nobody: no judge, return -1` : `person ${ctx.value} is trusted by everyone else and trusts nobody: the judge is ${ctx.value}`;
    }
    for (const k of tallies(ctx)) {
      const now = ctx.vars[k];
      const ch = changedIdx(now, ctx.prev[k]);
      if (ch.length !== 1) continue;
      const i = ch[0];
      const p = now.length === n ? i + 1 : i; // 0-based rows of length n hold person i + 1
      const up = now[i] > ctx.prev[k][i];
      if (/out|trusts$|gives/i.test(k)) return up ? `person ${p} trusts someone (${now[i]} so far): a judge trusts nobody, so ${p} is ruled out` : null;
      if (/in|trusted|got|recv/i.test(k) && up) return `person ${p} is trusted by ${now[i]} ${now[i] === 1 ? 'person' : 'people'} so far${Number.isInteger(n) ? ` (a judge needs ${n - 1})` : ''}`;
      return up
        ? `person ${p} is trusted: +1 token, score ${now[i]}${Number.isInteger(n) ? ` (a judge needs ${n - 1})` : ''}`
        : `person ${p} trusts someone: −1 token, score ${now[i]} (a judge never gives a token away)`;
    }
    return null;
  },
  // just before the answer comes back: who is the judge?
  predict(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    if (!ctx.next?.ret || ctx.ret || !Number.isInteger(ctx.next.value) || !Number.isInteger(n) || n < 1) return null;
    const right = ctx.next.value;
    const wrong = [-1, ...Array.from({ length: Math.min(n, 4) }, (_, i) => n - i)].filter((x) => x !== right).slice(0, 3);
    const card = options(`All trust pairs are counted (n = ${n}). Who is the town judge?`, right, wrong, right === -1 ? `Nobody ends with exactly ${n - 1} (trusted by all others, trusting nobody), so the answer is -1.` : `Person ${right} reaches ${n - 1}: trusted by all ${n - 1} others and never gave a token away.`);
    if (card) card.options.sort((a, b) => Number(a) - Number(b));
    if (card) card.answer = card.options.indexOf(String(right));
    return card;
  },
  bugs: [
    {
      label: 'Only count who is trusted',
      find: 'score[a]--;',
      replace: '',
      explain: 'Without the −1 for trusting someone, a person trusted by everyone wins even if they trust somebody too, but a judge must trust nobody.',
    },
    {
      label: 'Array of size n with 1-based labels',
      find: 'new Array(n + 1)',
      replace: 'new Array(n)',
      explain: 'People are labelled 1..n, so person n has no slot: their score never becomes a number and the judge is missed.',
    },
  ],
};
