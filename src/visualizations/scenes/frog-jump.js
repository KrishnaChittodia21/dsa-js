// Frog Jump: for every stone, the set of jump sizes the frog can land on it with. From a stone reached with a
// k-jump the frog tries k − 1, k and k + 1 (forward only); a hop that ends on a stone adds its size to that stone's
// set. Works with a Map / object of Sets keyed by position or an array of Sets per stone; a recursive DFS with a
// memo falls back to the generic notes, and its final answer is still asked.
import { functionAt } from './util.js';

const POS = ['pos', 'p', 'stone', 'cur', 'position', 'at', 'x', 'u', 'from'];
const LAST = ['k', 'last', 'lastJump', 'prevJump', 'prev', 'jump', 'j', 'kk'];
const HOP = ['step', 'next', 'nk', 'nj', 'hop', 'jump', 'd', 'j', 'size', 'delta', 'nxt', 's'];

/** [name, [[position, jumps], …]] of the stone notebook: a Map / object of Sets, or an array of Sets per stone */
function reachOf(vars, params, stones) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !v) continue;
    const e = v.$map || (v.$obj && Object.entries(v.$obj));
    if (Array.isArray(e) && e.length && e.every(([, s]) => s && Array.isArray(s.$set))) return [k, e.map(([p, s]) => [Number(p), s.$set])];
    if (Array.isArray(v) && Array.isArray(stones) && v.length === stones.length && v.every((s) => s && Array.isArray(s.$set))) return [k, v.map((s, i) => [stones[i], s.$set])];
  }
  return null;
}
const jumpsAt = (r, p) => r?.[1].find(([q]) => q === p)?.[1];
/** the stone whose set gained a jump between two steps: { at, jump } */
function landed(now, before) {
  if (!now || !before) return null;
  for (const [p, js] of now[1]) {
    const was = jumpsAt(before, p);
    if (!was) continue;
    const added = js.filter((j) => !was.includes(j));
    if (added.length === 1) return { at: p, jump: added[0] };
  }
  return null;
}
/** the stone the frog stands on, its last jump and the hop it tries: { pos, k, hop } */
function hopOf(vars, reach) {
  const pos = POS.map((k) => vars[k]).find((v) => Number.isInteger(v) && jumpsAt(reach, v)?.length);
  if (pos === undefined) return null;
  const set = jumpsAt(reach, pos);
  const kName = LAST.find((k) => Number.isInteger(vars[k]) && set.includes(vars[k]));
  const hName = HOP.find((h) => h !== kName && Number.isInteger(vars[h]) && (kName === undefined || Math.abs(vars[h] - vars[kName]) <= 1));
  return hName ? { pos, k: kName === undefined ? undefined : vars[kName], hop: vars[hName], hName } : null;
}
/** the name of the main function: the one the code's last line closes */
function mainOf(lines) {
  let at = (lines || []).length;
  while (at > 1 && !lines[at - 1].trim()) at--;
  return functionAt(lines || [], at);
}
const fmt = (js) => (js.length ? `{${js.join(', ')}}` : '{}');

export default {
  id: 'frog-jump',
  metaphor: 'A frog hopping across river stones',
  caption: 'Each stone keeps a notebook of the jump sizes the frog can land on it with. From a stone reached with a k-jump, the frog tries k − 1, k and k + 1; a hop onto a stone writes its size there.',
  narrate(ctx) {
    const stones = ctx.input?.[0];
    if (!Array.isArray(stones)) return null;
    const last = stones[stones.length - 1];
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') return ctx.value ? `the far stone ${last} can be reached: the frog crosses the river` : `no jump ever lands on the far stone ${last}: the frog cannot cross`;
    const r = reachOf(ctx.vars, ctx.params, stones);
    if (!r) return null;
    const was = reachOf(ctx.prev, ctx.params, stones);
    if (r[1].length === stones.length && (!was || was[1].length !== stones.length) && r[1].every(([, js]) => !js.length)) return `a notebook for each of the ${stones.length} stones: which jump sizes land on it (all empty)`;
    const got = landed(r, was);
    if (got) {
      if (got.at === stones[0] && got.jump === 0) return `the frog starts on stone ${got.at} with a "last jump" of 0, so its first hop can only be 1`;
      const h = hopOf(ctx.vars, r);
      const from = h && h.pos + got.jump === got.at ? `from stone ${h.pos}${h.k !== undefined ? ` (arrived with ${h.k})` : ''} a` : 'a';
      return `${from} ${got.jump}-jump lands on stone ${got.at}: its notebook is now ${fmt(jumpsAt(r, got.at))}`;
    }
    const h = hopOf(ctx.vars, r);
    if (!h || (ctx.prev[h.hName] === h.hop && ctx.prev.pos === ctx.vars.pos)) {
      // the hop was looked up: a stone there, or water
      const ph = was && hopOf(ctx.prev, was);
      if (ph && h && ph.hop === h.hop && ph.pos === h.pos && h.hop > 0) {
        const to = h.pos + h.hop;
        const known = Object.entries(ctx.vars).some(([n, v]) => v && Array.isArray(v.$set) && ctx.prev[n] && Array.isArray(ctx.prev[n].$set));
        if (!jumpsAt(r, to)) return `${to} is open water: no stone to land on`;
        return known && jumpsAt(r, to).includes(h.hop) ? `stone ${to} already knew a ${h.hop}-jump: nothing new` : `there is a stone at ${to}`;
      }
      return null;
    }
    if (h.hop <= 0) return `a ${h.hop}-jump would not move the frog forward: skip it`;
    return `from stone ${h.pos}${h.k !== undefined ? ` (arrived with a ${h.k}-jump)` : ''}, try a ${h.hop}-jump to ${h.pos + h.hop}`;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const stones = ctx.input?.[0];
    if (!Array.isArray(stones) || stones.length < 2) return null;
    const last = stones[stones.length - 1];
    // the final answer: does any jump land on the far stone?
    if (ctx.next.ret && typeof ctx.next.value === 'boolean' && functionAt(ctx.lines || [], ctx.next.line) === mainOf(ctx.lines)) {
      return {
        question: `All hops are tried. Can the frog reach the far stone ${last}?`,
        options: ['Yes', 'No'],
        answer: ctx.next.value ? 0 : 1,
        explain: ctx.next.value ? `Stone ${last}'s notebook is not empty: some chain of jumps lands on it.` : `Stone ${last}'s notebook stayed empty: no allowed jump ever lands on it.`,
      };
    }
    // a hop from one of the first stones: is there a stone where it lands?
    const r = reachOf(ctx.vars, ctx.params, stones);
    const h = r && hopOf(ctx.vars, r);
    if (!h || h.hop <= 0 || ctx.prev[h.hName] === h.hop || h.pos !== stones[1]) return null;
    const to = h.pos + h.hop;
    const nr = reachOf(ctx.next.vars, ctx.params, stones);
    const got = landed(nr, r);
    const fetched = Object.entries(ctx.next.vars).some(([n, v]) => !(n in ctx.vars) && v && Array.isArray(v.$set));
    let yes;
    if ((got && got.at === to) || (fetched && jumpsAt(r, to))) yes = true;
    else if (!got && !jumpsAt(r, to)) yes = false;
    if (yes === undefined) return null;
    return {
      question: `The frog on stone ${h.pos} tries a ${h.hop}-jump, to ${to}. Does it land on a stone?`,
      options: ['Yes', 'No: water'],
      answer: yes ? 0 : 1,
      explain: yes ? `${to} is one of the stones, so a ${h.hop}-jump is written in stone ${to}'s notebook.` : `There is no stone at ${to}: that hop is dropped.`,
    };
  },
  bugs: [
    {
      label: 'Start with a last jump of 1 at stone 0',
      find: 'reach.get(0).add(0);',
      replace: 'reach.get(0).add(1);',
      explain: 'A "last jump" of 1 lets the first hop be 2, but the first hop must be exactly 1: [0,2] wrongly becomes crossable.',
    },
    {
      label: 'Forget the k + 1 jump',
      find: 'step <= k + 1',
      replace: 'step < k + 1',
      explain: 'The frog may also jump one unit further than last time. Without k + 1 its jumps never grow, so after the first 1-jump it can only make 1-jumps.',
    },
  ],
};
