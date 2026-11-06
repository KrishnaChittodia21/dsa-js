// Combinations: picking a team of k from players wearing shirts 1..n. Players join in rising shirt order (so [2, 1]
// never happens), a full team is written down, then the last player steps out so the next shirt can be tried.
import { callArgs, options, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'comb', 'combo', 'combination', 'temp', 'tmp', 'team', 'subset', 'list', 'picked', 'chosen'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'combos', 'combinations', 'teams'];
const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k)).map((k) => row(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => row(r)));
const show = (a) => `[${a.join(', ')}]`;
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export default {
  id: 'combinations',
  metaphor: 'Picking a team by shirt number',
  caption: 'The path is the team being picked, the result rows are finished teams. Players join in rising shirt order, so every team appears once; when the team has k players it is written down and the last player steps back out.',
  narrate(ctx) {
    const k = ctx.input?.[1];
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) {
      const got = res[res.length - 1];
      return `team ${show(got)} has ${got.length} players: it is complete, record it (${res.length} found so far)`;
    }
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (!p || !before || !Number.isInteger(k)) return null;
    if (extends1(p, before)) {
      const x = p[p.length - 1];
      return p.length < k ? `choose ${x} → team ${show(p)}, ${k - p.length} more to pick` : `choose ${x} → team ${show(p)}, that is ${k} players`;
    }
    if (extends1(before, p)) return `undo ${before[before.length - 1]} → team ${show(p)}`;
    // the first step of a new call: its start parameter says which shirts are still open
    const call = callArgs(ctx);
    const loopVar = /for\s*\(\s*(?:let|var)\s+([A-Za-z_$][\w$]*)/.exec(ctx.lines.join('\n'))?.[1];
    const start = call && Object.values(call.args).find((v) => Number.isInteger(v));
    if (same(p, before) && p.length < k && Number.isInteger(start) && loopVar && !(loopVar in ctx.vars) && loopVar in ctx.prev) {
      const n = ctx.input[0];
      return start <= n ? `new call for team ${show(p)}: shirts ${start}..${n} are still open` : `new call for team ${show(p)}: no shirts left (start ${start} > ${n})`;
    }
    return null;
  },
  // a player just stepped out: who joins next, or is this call finished?
  predict(ctx) {
    if (!ctx.next) return null;
    const n = ctx.input?.[0];
    const k = ctx.input?.[1];
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const after = pathOf(ctx.next.vars, ctx.params);
    if (!p || !before || !after || !Number.isInteger(n) || !Number.isInteger(k) || !extends1(before, p)) return null;
    const popped = before[before.length - 1];
    const NONE = 'nobody: this call is done, back up';
    let right;
    if (extends1(after, p)) right = after[after.length - 1];
    else if (same(after, p)) right = NONE;
    else return null;
    const low = p.length ? p[p.length - 1] : 0;
    const wrong = [NONE, ...Array.from({ length: n }, (_, i) => i + 1).filter((x) => x > low && x !== popped && x !== right)];
    const need = k - p.length;
    const explain =
      right === NONE
        ? popped === n
          ? `${popped} was the last shirt, so no one is left to try after it: the call returns to the one that picked ${show(p)}.`
          : `${need} more players are needed, but only ${n - popped} shirt${n - popped === 1 ? '' : 's'} above ${popped} remain${need > 1 && n - popped < need ? ': too few, so the loop stops early' : ''}; the call goes back up.`
        : `Shirts go up: every team starting ${show([...p, popped])} is done, so the next shirt after ${popped} is tried: ${right}.`;
    return options(`${popped} just stepped out of team ${show(p)} (n = ${n}, k = ${k}). Who joins next?`, right, wrong, explain);
  },
  bugs: [
    {
      label: 'Recurse with start + 1 instead of x + 1',
      find: 'backtrack(x + 1);',
      replace: 'backtrack(start + 1);',
      explain: 'The next call starts right after where this call started, not after the player just picked, so the same player can join twice ([2, 2]) and teams repeat.',
    },
    {
      label: 'Pruning bound off by one',
      find: 'x <= n - need + 1',
      replace: 'x <= n - need',
      explain: 'The loop stops one shirt too early, so teams that end with the last shirts (like [3, 4] for n = 4, or [1, 2, 3] when k = n) are never picked.',
    },
  ],
};
