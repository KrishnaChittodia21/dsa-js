// Find the Duplicate Number. The array is a one-way track: from index i you hop to nums[i]. Two indexes hop onto
// the duplicate value, so the track runs from index 0 into a loop whose entrance is the duplicate. Floyd: a slow
// runner (one hop) and a fast one (two hops) meet inside the loop; then one restarts at 0, both hop one at a time, and
// they meet at the entrance. Runners are found by what they do (a number that just hopped once or twice), not by name.
import { options, row } from './util.js';

const isInt = Number.isInteger;

/** how a runner moved this step: { k, from, to, hops, mid } */
function hop(ctx, nums) {
  for (const k of Object.keys(ctx.vars)) {
    if (ctx.params.includes(k)) continue;
    const to = ctx.vars[k];
    const from = ctx.prev[k];
    if (to === 0 && !(k in ctx.prev) && Object.keys(ctx.prev).length) return { k, from: null, to, hops: 0 }; // a new runner at the start
    if (!isInt(to) || !isInt(from) || to === from || from < 0 || from >= nums.length) continue;
    const one = nums[from];
    const two = isInt(one) && one >= 0 && one < nums.length ? nums[one] : undefined;
    if (to === one) return { k, from, to, hops: 1 };
    if (to === two) return { k, from, to, hops: 2, mid: one };
    if (to === 0) return { k, from, to, hops: 0 };
  }
  return null;
}

/** the step after a real meeting returns, or sends a runner (back) to index 0 */
function meetingEnds(ctx) {
  const n = ctx.next;
  if (!n || n.ret) return true;
  return Object.keys(n.vars).some((k) => n.vars[k] === 0 && ctx.vars[k] !== 0 && !ctx.params.includes(k));
}

/** another runner standing on the same index */
const partner = (vars, k, params) => Object.keys(vars).find((o) => o !== k && !params.includes(o) && isInt(vars[o]) && vars[o] === vars[k]);

export default {
  id: 'find-the-duplicate-number',
  metaphor: 'Two runners on a one-way track',
  caption: 'Index i has one arrow, to nums[i]. The duplicate value has two arrows coming in, so the track from index 0 runs into a loop that starts there. The pointers are the runners.',
  pointers: ['slow', 'fast', 'tortoise', 'hare', 's', 'f', 'p', 'q'],
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    if (!Object.keys(ctx.prev).length) {
      const rs = Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && isInt(ctx.vars[k]));
      if (!rs.length) return null;
      const same = rs.length === 2 && ctx.vars[rs[0]] === ctx.vars[rs[1]] && ctx.vars[rs[0]] !== 0 ? `: they already meet at ${ctx.vars[rs[0]]}` : ' (from i you hop to nums[i])';
      return `the runners leave index 0: ${rs.map((k) => `${k} at ${ctx.vars[k]}`).join(', ')}${same}`;
    }
    const h = hop(ctx, nums);
    if (h) {
      const other = partner(ctx.vars, h.k, ctx.params);
      // a runner passing the other mid-round is not a meeting: only when the loop then ends
      const meet = other && meetingEnds(ctx) ? `: it lands on ${other}, they meet at ${h.to}` : '';
      if (h.hops === 0) return `${h.k} ${h.from === null ? 'starts at' : 'goes back to the start,'} index 0; ${other ? '' : 'the other runner waits inside the loop, '}now both hop once per step`;
      if (h.hops === 1) return `${h.k} hops ${h.from} → nums[${h.from}] = ${h.to}${meet}`;
      return `${h.k} hops twice: ${h.from} → ${h.mid} → ${h.to}${meet}`;
    }
    // a hop that comes back to the same index (a self-loop, or a loop of length 2 for two hops)
    const k = Object.keys(ctx.vars).find((n) => !ctx.params.includes(n) && isInt(ctx.vars[n]) && ctx.vars[n] === ctx.prev[n] && new RegExp(`^\\s*${n}\\s*=[^=]`).test(ctx.src || ''));
    const at = k && ctx.vars[k];
    if (k && at >= 0 && at < nums.length) {
      const other = partner(ctx.vars, k, ctx.params);
      const meet = other && meetingEnds(ctx) ? `; ${other} is there too, they meet at ${at}` : '';
      if (nums[at] === at) return `${k} hops ${at} → nums[${at}] = ${at}: a self-loop, it stays put${meet}`;
      if (nums[nums[at]] === at) return `${k} hops twice: ${at} → ${nums[at]} → ${at}, back where it was${meet}`;
    }
    if (ctx.ret && !ctx.next && isInt(ctx.result)) return `the meeting point ${ctx.result} has two arrows coming in: ${ctx.result} is the duplicate`;
    return null;
  },
  // before a two-hop that ends on the slow runner, and when a runner restarts at 0
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums || !ctx.next || !Object.keys(ctx.prev).length) return null;
    const nx = ctx.next.vars;
    const h = hop(ctx, nums);
    if (h && h.hops === 0 && isInt(ctx.result) && nums.includes(ctx.result)) {
      const other = Object.keys(ctx.vars).find((o) => o !== h.k && !ctx.params.includes(o) && isInt(ctx.vars[o]));
      const wrong = [other && ctx.vars[other], nums[0], nums.indexOf(ctx.result)].filter((v) => isInt(v) && v !== ctx.result);
      return options(
        `${h.k} restarts at 0${other ? `, ${other} waits at ${ctx.vars[other]}` : ''}. Both now hop one at a time. What will your run return?`,
        ctx.result,
        wrong,
        `From 0 to the loop's entrance is as far as from the meeting point around to it, so the runners meet at the entrance: the value with two arrows in, ${ctx.result}.`,
      );
    }
    for (const k of Object.keys(ctx.vars)) {
      if (ctx.params.includes(k)) continue;
      const at = ctx.vars[k];
      if (!isInt(at) || at < 0 || at >= nums.length || !isInt(nx[k]) || nx[k] === at) continue;
      const one = nums[at];
      const two = one >= 0 && one < nums.length ? nums[one] : undefined;
      if (nx[k] !== two || two === one) continue;
      const other = partner({ ...ctx.vars, [k]: two }, k, ctx.params);
      if (!other) continue; // only ask about the hop that catches the slow runner
      return options(`${k} is at index ${at} and hops twice. Where does it land?`, two, [one, at, nums[two]].filter((v) => isInt(v) && v !== two), `${at} → nums[${at}] = ${one} → nums[${one}] = ${two}. That is where ${other} stands: the runners meet inside the loop.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Phase 2 restarts at nums[0], not index 0',
      find: 'slow = 0;',
      replace: 'slow = nums[0];',
      explain: 'The distance proof counts hops from the head of the track, index 0. Starting one hop ahead, the runners meet at the wrong node: [3, 2, 3, 1] gives 2 instead of 3.',
    },
  ],
};
