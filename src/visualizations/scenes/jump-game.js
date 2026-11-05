// Jump Game: stepping stones across a river. Each stone says how far you may jump from it; the farthest stone you can
// reach so far grows as you walk. A stone past that mark is a gap: you are stuck. Works with a forward reach
// (reach / farthest / maxReach) or a backward goal (goal / target / last) that walks back towards stone 0.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'k', 'p', 'idx', 'pos'];
const REACH = ['reach', 'maxReach', 'farthest', 'furthest', 'far', 'max', 'maxIdx', 'best', 'canReach', 'reachable'];
const GOAL = ['goal', 'target', 'last', 'lastGood', 'lastPos', 'need'];

const local = (ctx, names, skip) => firstInt(Object.fromEntries(Object.entries(ctx).filter(([k]) => !skip.includes(k))), names);

export default {
  id: 'jump-game',
  metaphor: 'Stepping stones across a river',
  caption: 'Each cell is a stone; its number is the longest jump you may take from it (any shorter jump is fine too). The farthest-reach mark grows as you walk; a stone beyond it can never be reached.',
  pointers: ['i', 'reach', 'farthest', 'maxReach', 'goal'],
  compare: 'reach',
  narrate(ctx) {
    const nName = ctx.params[0];
    const a = row(ctx.vars[nName]);
    if (!a) return null;
    const last = a.length - 1;
    if (!ctx.next && typeof ctx.result === 'boolean' && /return/.test(ctx.src || '')) {
      return ctx.result ? `the last stone (${last}) can be reached: true` : `the walk is stuck before the last stone (${last}): false`;
    }
    const [iName, i] = local(ctx.vars, AT, [nName]);
    const [rName, r] = local(ctx.vars, REACH, [nName, iName]);
    const [gName, g] = local(ctx.vars, GOAL, [nName, iName, rName]);
    if (rName && rName in ctx.prev && iName && ctx.prev[iName] === i && i >= 0 && i <= last) {
      const to = i + a[i];
      if (r !== ctx.prev[rName]) return `from stone ${i} you can jump up to stone ${to}: the farthest reach grows to ${r}${r >= last ? ', past the last stone' : ''}`;
      return `from stone ${i} you reach only stone ${to}: the farthest reach stays ${r}`;
    }
    if (gName && gName in ctx.prev && g !== ctx.prev[gName]) return `stone ${g} can jump to the goal stone ${ctx.prev[gName]}: now it is enough to reach stone ${g}`;
    if (iName && i !== ctx.prev[iName] && i >= 0 && i <= last) {
      if (rName && i > r) return `stone ${i} is past the farthest reach (${r}): a gap nobody can jump over`;
      return `stand on stone ${i} (jump up to ${a[i]})${rName ? `, the farthest reach is ${r}` : ''}${gName ? `, the goal stone is ${g}` : ''}`;
    }
    return null;
  },
  // standing on a stone: how far does the reach go now? then, before the return: true or false?
  predict(ctx) {
    if (!ctx.next) return null;
    const nName = ctx.params[0];
    const a = row(ctx.vars[nName]);
    if (!a) return null;
    const [iName, i] = local(ctx.vars, AT, [nName]);
    const [rName, r] = local(ctx.vars, REACH, [nName, iName]);
    const nx = ctx.next.vars;
    if (ctx.next.ret && typeof ctx.result === 'boolean' && /return/.test(ctx.lines[ctx.next.line - 1] || '')) {
      const why = rName ? `The farthest reach is ${r} and the last stone is ${a.length - 1}.` : '';
      return { question: 'The walk is about to end. What does the run return?', options: ['true', 'false'], answer: ctx.result ? 0 : 1, explain: `${why} ${ctx.result ? 'The last stone is within reach.' : 'A gap stops the walk before the last stone.'}`.trim() };
    }
    if (!iName || !rName || i !== nx[iName] || i === ctx.prev[iName] || !(i >= 0 && i < a.length) || !Number.isInteger(nx[rName]) || i > r) return null;
    const now = nx[rName];
    return options(`Stone ${i} allows a jump of up to ${a[i]}; the farthest reach is ${r}. What is the farthest reach after this stone?`, now, [r, i + a[i], a[i], now + 1].filter((x) => x !== now), now === r ? `${i} + ${a[i]} = ${i + a[i]} is not past ${r}, so the reach stays.` : `${i} + ${a[i]} = ${i + a[i]} is farther than ${r}.`);
  },
  bugs: [
    {
      label: 'Gap check after extending the reach',
      find: 'if (i > reach) return false;          // gap: i cannot be reached\n    reach = Math.max(reach, i + nums[i]);',
      replace: 'reach = Math.max(reach, i + nums[i]);\n    if (i > reach) return false;',
      explain: 'An unreachable stone extends the reach before the gap is noticed, so [0, 1] looks crossable: stone 1 jumps to itself.',
    },
    {
      label: 'Standing on the farthest stone counts as a gap',
      find: 'i > reach',
      replace: 'i >= reach',
      explain: 'The farthest-reach stone itself can be reached; with >= the walk stops on it (even on stone 0, where reach is 0).',
    },
  ],
};
