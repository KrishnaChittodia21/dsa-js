// Scene: Asteroid Collision (stack). Rocks fly along one lane; the stack holds the survivors so far, left to right.
// A left-mover only meets right-movers at the back of the survivors' line, so it fights the top of the stack.
import { firstInt, row } from './util.js';

const ROCK = ['a', 'ast', 'asteroid', 'rock', 'x', 'cur', 'curr', 'current', 'n', 'num', 'v', 'val', 'value', 'incoming', 'it'];
const TOP = ['top', 't', 'last', 'peek', 'prevTop', 'topVal', 'back'];
const show = (v) => (v > 0 ? `${v}→` : `←${-v}`);
// the survivors: an integer array under a stack-like name that is not the input
const stackOf = (vars, params) =>
  Object.entries(vars).find(([k, v]) => !params.includes(k) && /stack|^st$|^stk$|^s$|res|ans|out|surviv|kept|remain/i.test(k) && row(v) && v.every(Number.isInteger));
// the incoming rock: an integer under a rock-like name (not the stack top)
function rockOf(vars, params) {
  const [k, v] = firstInt(Object.fromEntries(Object.entries(vars).filter(([n]) => !params.includes(n))), ROCK);
  return k && v !== 0 ? v : undefined;
}

// a boolean that flipped to "the incoming rock is gone" (alive → false, destroyed → true; a reset does not count)
const flipped = (before, after) => Object.keys(after).find((k) => typeof after[k] === 'boolean' && typeof before[k] === 'boolean' && after[k] !== before[k] && after[k] === /dead|destroy|explod|gone|crash|boom|die|hit/i.test(k));

export default {
  id: 'asteroid-collision',
  metaphor: 'Rocks crashing on a one-lane road',
  caption: 'The stack is the line of survivors so far, in order. A right-mover (5→) is safe for now; a left-mover (←5) crashes into the right-movers at the back of the line, one at a time, until it explodes or nothing moving right is left.',
  compare: 'st',
  narrate(ctx) {
    const st = stackOf(ctx.vars, ctx.params);
    const was = st && row(ctx.prev[st[0]]);
    const a = rockOf(ctx.vars, ctx.params);
    if (st && was) {
      const s = st[1];
      if (s.length === was.length + 1 && s.slice(0, -1).every((x, i) => x === was[i])) {
        const x = s[s.length - 1];
        if (x > 0) return `${show(x)} joins the survivors: nothing ahead of it is coming its way (yet)`;
        return `${show(x)} survives: ${was.length && was[was.length - 1] < 0 ? 'the rock behind it flies left too' : 'no right-mover is left in its way'} · survivors: ${s.map(show).join(' ') || 'none'}`;
      }
      if (s.length === was.length - 1 && s.every((x, i) => x === was[i])) {
        const p = was[was.length - 1];
        if (Number.isInteger(a) && a < 0 && p > 0) {
          if (p < -a) return `${show(a)} hits ${show(p)}: ${p} is smaller and explodes; ${show(a)} keeps flying`;
          if (p === -a) return `${show(a)} hits ${show(p)}: same size, both explode`;
        }
        return `${show(p)} is removed from the survivors`;
      }
    }
    // the incoming rock dies on a bigger right-mover (no pop): read the top it fought from a top-like name
    const flag = flipped(ctx.prev, ctx.vars);
    const [tName, top] = firstInt(ctx.vars, TOP);
    if (flag && Number.isInteger(a) && a < 0 && Number.isInteger(top) && top > -a) return `${show(a)} hits ${show(top)}: ${-a} is smaller, so ${show(a)} explodes`;
    if (Number.isInteger(a) && Number.isInteger(top) && top !== ctx.prev[tName] && a < 0 && top > 0) return `${show(a)} meets ${show(top)} at the back of the line`;
    if (Number.isInteger(a) && a !== rockOf(ctx.prev, ctx.params)) return `next rock: ${show(a)}, moving ${a > 0 ? 'right' : 'left'}`;
    return null;
  },
  // a left-mover faces a right-mover of a different size: who explodes?
  predict(ctx) {
    if (!ctx.next) return null;
    const st = stackOf(ctx.vars, ctx.params);
    const a = rockOf(ctx.vars, ctx.params);
    if (!st || !Number.isInteger(a) || a >= 0 || !st[1].length) return null;
    const p = st[1][st[1].length - 1];
    if (p <= 0 || p === -a) return null;
    // not right after a crash (the rock may already be gone), and the fight must be with the top on screen
    const was = row(ctx.prev[st[0]]);
    const [, top] = firstInt(ctx.vars, TOP);
    if (!was || was.length !== st[1].length || (top !== undefined && top !== p)) return null;
    const after = row(ctx.next.vars[st[0]]);
    if (!after) return null;
    const popped = after.length === st[1].length - 1;
    const flag = flipped(ctx.vars, ctx.next.vars);
    const died = after.length === st[1].length && !!flag;
    if (!popped && !died) return null;
    const opts = [`${show(p)} explodes`, `${show(a)} explodes`, 'Both explode'];
    return {
      question: `${show(a)} meets ${show(p)}. What happens?`,
      options: opts,
      answer: popped ? 0 : 1,
      explain: popped ? `${p} is smaller than ${-a}, so ${show(p)} is destroyed and ${show(a)} flies on to the next one.` : `${-a} is smaller than ${p}, so ${show(a)} is destroyed and the survivors stay as they are.`,
    };
  },
  bugs: [
    {
      label: 'Resolve only one collision',
      find: 'while (alive && a < 0',
      replace: 'if (alive && a < 0',
      explain: 'A left-mover can destroy several right-movers in a row; with if it fights only the first one, then joins the survivors, so [10, 2, -5] keeps ←5 next to 10→.',
    },
    {
      label: 'Keep the rock after an equal crash',
      find: 'st.pop();              // both explode\n        alive = false;',
      replace: 'st.pop();              // both explode',
      explain: 'When both are the same size both are gone, but the left-mover keeps flying and is pushed, so [8, -8] gives [-8] instead of [].',
    },
  ],
};
