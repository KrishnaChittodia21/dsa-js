// Daily Temperatures (monotonic stack). Cold days wait in a line; a warmer day walks in and answers every colder
// day at the back of the line. Works with a stack of indices under a stack-like name and any answer array name.
import { firstInt, options, row } from './util.js';

const DAY = ['i', 'day', 'd', 'idx', 'cur', 'today'];
const stackOf = (vars) => Object.entries(vars).find(([k, v]) => /stack|waiting|^st$|^stk$|^s$|mono|pending/i.test(k) && row(v));
// the answer array: same length as temperatures, not the input itself, not the stack
function answerOf(vars, tName) {
  const t = row(vars[tName]);
  if (!t) return null;
  const s = stackOf(vars)?.[0];
  return Object.entries(vars).find(([k, v]) => k !== tName && k !== s && row(v) && v.length === t.length && v.every(Number.isInteger)) || null;
}
const isDay = (x, t) => Number.isInteger(x) && x >= 0 && x < t.length;

export default {
  id: 'daily-temperatures',
  metaphor: 'Cold days waiting for warmth',
  caption: 'The stack is a line of days still waiting for a warmer day; their temperatures only go down towards the back. A warmer day answers everyone colder at the back of the line, then joins it.',
  compare: 'answer',
  narrate(ctx) {
    const tName = ctx.params[0];
    const t = row(ctx.vars[tName]);
    if (!t) return null;
    const ans = answerOf(ctx.vars, tName);
    const before = ans && row(ctx.prev[ans[0]]);
    if (ans && before && before.length === ans[1].length) {
      const d = ans[1].map((x, k) => (x === before[k] ? -1 : k)).filter((k) => k >= 0);
      if (d.length === 1) {
        const j = d[0];
        const w = ans[1][j];
        const i = j + w;
        if (w > 0 && i < t.length) return `day ${i} (${t[i]}°) is warmer than day ${j} (${t[j]}°): day ${j} waited ${w} day${w > 1 ? 's' : ''}`;
      }
    }
    const st = stackOf(ctx.vars);
    const was = st && row(ctx.prev[st[0]]);
    if (!st || !was || !st[1].every((x) => isDay(x, t))) return null;
    const [, i] = firstInt(ctx.vars, DAY);
    const line = st[1].map((k) => `${t[k]}°`).join(', ') || 'empty';
    if (st[1].length === was.length + 1) {
      const k = st[1][st[1].length - 1];
      return `day ${k} (${t[k]}°) joins the waiting line: no warmer day yet · line: ${line}`;
    }
    if (st[1].length === was.length - 1 && isDay(was[was.length - 1], t)) {
      const k = was[was.length - 1];
      return `day ${k} (${t[k]}°) leaves the line${isDay(i, t) && i !== k ? `: day ${i} (${t[i]}°) is warmer` : ''}`;
    }
    return null;
  },
  // before the line changes (2+ days waiting, so it is a real choice): does the back of the line get its answer, or does the new day join?
  predict(ctx) {
    const tName = ctx.params[0];
    const t = row(ctx.vars[tName]);
    const st = stackOf(ctx.vars);
    if (!t || !st || !ctx.next || st[1].length < 2 || !st[1].every((x) => isDay(x, t))) return null;
    const after = row(ctx.next.vars[st[0]]);
    if (!after) return null;
    const [iName] = firstInt(ctx.next.vars, DAY);
    const i = iName && ctx.next.vars[iName];
    const back = st[1][st[1].length - 1];
    if (!isDay(i, t) || i === back) return null;
    const popped = after.length === st[1].length - 1;
    const pushed = after.length === st[1].length + 1 && after[after.length - 1] === i;
    if (!popped && !pushed) return null;
    const pop = `Day ${back} (${t[back]}°) gets its answer and leaves`;
    const push = `Day ${i} (${t[i]}°) joins the line behind it`;
    const r = options(`Day ${i} (${t[i]}°) ${ctx.vars[iName] === i ? "is still checking" : "arrives"}; the back of the line is day ${back} (${t[back]}°). What happens?`, popped ? pop : push, [popped ? push : pop], popped ? `${t[i]}° is warmer than ${t[back]}°, so day ${back} has found its warmer day (${i - back} day${i - back > 1 ? 's' : ''} later).` : `${t[i]}° is not warmer than ${t[back]}°, so nobody in the line is answered: day ${i} waits too.`);
    return r;
  },
  bugs: [
    {
      label: 'Pop on <=: an equal day counts as warmer',
      find: 'temperatures[waiting[waiting.length - 1]] < temperatures[i]',
      replace: 'temperatures[waiting[waiting.length - 1]] <= temperatures[i]',
      explain: 'A day with the same temperature is not warmer, but <= answers the waiting day anyway, so [70, 70, 71] gives day 0 a wait of 1 instead of 2.',
    },
  ],
};
