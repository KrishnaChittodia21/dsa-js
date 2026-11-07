// Longest Consecutive Sequence: every number goes into a bag (a Set); a run is only walked from its bottom rung
// (x − 1 missing), climbing x + 1, x + 2… while the bag has them. Finds the bag ($set, any name), the number being
// looked at (the int that changes to a bag value), the climber (a value or a length counter) and best / max / longest.
import { options, row } from './util.js';

const BEST = ['best', 'longest', 'max', 'maxLen', 'ans', 'res', 'result', 'answer', 'maxLength', 'longestStreak'];
const isInt = Number.isInteger;
const bagOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && Array.isArray(v?.$set));
const isCounter = (name) => /len|count|cnt|streak|run|size|curlen/i.test(name);
const short = (xs) => (xs.length > 10 ? `{${xs.slice(0, 10).join(', ')}, …}` : `{${xs.join(', ')}}`);

/** the number just picked: one int variable changed to a bag value and nothing else moved */
function picked(ctx, bag) {
  const keys = Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && k !== bag[0]);
  const changed = keys.filter((k) => ctx.vars[k] !== ctx.prev[k]);
  if (changed.length !== 1) return null;
  const [k] = changed;
  const x = ctx.vars[k];
  if (!isInt(x) || !bag[1].$set.includes(x) || BEST.includes(k) || isCounter(k)) return null;
  // not a climber: a fresh copy of the anchor, or one rung up while the anchor stays
  const anchors = keys.filter((o) => o !== k && !BEST.includes(o) && isInt(ctx.vars[o]) && ctx.vars[o] === ctx.prev[o]);
  if (anchors.some((o) => ctx.vars[o] === x) || (ctx.prev[k] === x - 1 && anchors.length)) return null;
  // the other variables must be untouched (old climbers may have gone out of scope)
  if (Object.keys(ctx.prev).some((p) => p !== k && p in ctx.vars && ctx.prev[p] !== ctx.vars[p] && typeof ctx.vars[p] !== 'object')) return null;
  return [k, x];
}

export default {
  id: 'longest-consecutive-sequence',
  metaphor: 'Climb each ladder from its bottom rung',
  caption: 'Every number goes into a bag. A number whose one-lower neighbour is missing is the bottom rung of a ladder: climb x + 1, x + 2… while the bag has them. Any other number is skipped, so each rung is climbed once.',
  narrate(ctx) {
    const bag = bagOf(ctx.vars, ctx.params);
    const best = BEST.find((k) => isInt(ctx.vars[k]));
    if (!ctx.next && /\breturn\b/.test(ctx.src || '') && isInt(ctx.result)) return ctx.result ? `the longest ladder has ${ctx.result} rung${ctx.result > 1 ? 's' : ''}` : 'the bag is empty: no ladder at all, the answer is 0';
    if (!bag) return null;
    const set = bag[1].$set;
    if (!ctx.prev[bag[0]]) return `every number goes into the bag: ${short(set)}${row(ctx.vars[ctx.params[0]]) && set.length < ctx.vars[ctx.params[0]].length ? ' (duplicates vanish)' : ''}`;
    if (best && ctx.prev[best] !== undefined && ctx.vars[best] > ctx.prev[best]) return `a new longest ladder: ${ctx.vars[best]} rung${ctx.vars[best] > 1 ? 's' : ''}`;
    if (best && best in ctx.prev && ctx.vars[best] === ctx.prev[best] && new RegExp(`\\b${best}\\s*=[^=]`).test(ctx.src || '')) return `this ladder is no taller than the best so far: still ${ctx.vars[best]}`;
    const p = picked(ctx, bag);
    // no verdict: the prediction right after asks whether a climb starts here
    if (p) return `pick ${p[1]} from the bag. Is ${p[1] - 1} in the bag too?`;
    // the climber moves one rung up
    const xKey = Object.keys(ctx.vars).find((k) => isInt(ctx.vars[k]) && ctx.vars[k] === ctx.prev[k] && set.includes(ctx.vars[k]) && !BEST.includes(k) && !isCounter(k));
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (!isInt(v) || ctx.prev[k] !== v - 1 || BEST.includes(k) || !xKey || k === xKey) continue;
      const x = ctx.vars[xKey];
      if (isCounter(k)) return `the next rung is in the bag: the ladder from ${x} is ${v} rungs tall`;
      if (set.includes(v)) return `${v} is in the bag: climb to it, the ladder ${x}…${v} has ${v - x + 1} rungs`;
    }
    // a climb starts: a fresh climber equals the picked number (or a counter at 1)
    const pk = xKey && Object.keys(ctx.vars).find((k) => k !== xKey && ctx.prev[k] !== ctx.vars[k] && (ctx.vars[k] === ctx.vars[xKey] || (isCounter(k) && ctx.vars[k] === 1)));
    if (pk && !set.includes(ctx.vars[xKey] - 1)) return `${ctx.vars[xKey] - 1} is missing: ${ctx.vars[xKey]} is a bottom rung, start climbing`;
    return null;
  },
  // right after a number is picked: bottom rung (climb) or skip?
  predict(ctx) {
    const bag = bagOf(ctx.vars, ctx.params);
    if (!bag || !ctx.next || !ctx.prev[bag[0]]) return null;
    const p = picked(ctx, bag);
    if (!p) return null;
    const [k, x] = p;
    const set = bag[1].$set;
    const nx = ctx.next.vars;
    const stays = !ctx.next.ret && nx[k] === x;
    const below = set.includes(x - 1);
    // ask only when the learner's next step agrees with the rule (a start stays on x, a skip moves on)
    if (stays === below) return null;
    const climb = `Climb: ${x} is a bottom rung`;
    const skip = `Skip: ${x} sits on a lower rung's ladder`;
    return options(`The bag holds ${short(set)}. You picked ${x}. What happens?`, stays ? climb : skip, [stays ? skip : climb], stays ? `${x - 1} is not in the bag, so no ladder reaches ${x} from below: start a climb here.` : `${x - 1} is in the bag, so ${x} will be climbed from a lower start. Climbing here too would repeat work.`);
  },
  bugs: [
    {
      label: 'Start best at 1',
      find: 'let best = 0;',
      replace: 'let best = 1;',
      explain: 'An empty array has no ladder at all, but the answer starts at 1 and nothing lowers it, so [] returns 1 instead of 0.',
    },
    {
      label: 'Ladder height y − x (off by one)',
      find: 'y - x + 1',
      replace: 'y - x',
      explain: 'The ladder x…y has y − x + 1 rungs: forgetting the + 1 makes every ladder one rung short, so [100, 4, 200, 1, 3, 2] gives 3.',
    },
  ],
};
