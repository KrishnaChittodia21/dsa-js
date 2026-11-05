// Patching Array: coins in a purse. `miss` is the smallest amount the purse cannot pay; every amount below it can be
// paid. A coin no bigger than miss stretches that range by its value; otherwise add a coin worth miss (doubling it).
import { options, row } from './util.js';

// miss-style names hold the first amount that cannot be paid; reach-style names the last one that can (miss - 1)
const MISS = ['miss', 'missing', 'need', 'smallest', 'next'];
const REACH = ['reach', 'covered', 'cover', 'sum', 'upto', 'limit', 'bound', 'maxReach', 'total', 'cur', 'r'];
const PATCH = ['patches', 'count', 'ans', 'res', 'added', 'cnt', 'result', 'p'];
const IDX = ['i', 'j', 'idx', 'k', 'pos'];

function stateOf(vars, params) {
  if (!vars) return null;
  const nums = row(vars[params[0]]);
  const mn = [...MISS, ...REACH].find((k) => !params.includes(k) && typeof vars[k] === 'number');
  const pn = PATCH.find((k) => k !== mn && Number.isInteger(vars[k]));
  const ix = IDX.find((k) => k !== mn && k !== pn && Number.isInteger(vars[k]));
  const miss = mn === undefined ? undefined : MISS.includes(mn) ? vars[mn] : vars[mn] + 1;
  return { nums, mn, miss, pn, patches: vars[pn], i: vars[ix] };
}

const coin = (s) => (s.nums && Number.isInteger(s.i) && s.i < s.nums.length ? s.nums[s.i] : undefined);

export default {
  id: 'patching-array',
  metaphor: 'Coins that can pay every amount',
  caption: 'miss is the smallest amount the purse cannot pay yet; everything below it can be paid. A coin no bigger than miss pushes miss up by its value; if the next coin is too big, add a coin worth miss, which doubles it.',
  narrate(ctx) {
    const now = stateOf(ctx.vars, ctx.params);
    const was = stateOf(ctx.prev, ctx.params);
    if (!now || !was || !now.mn || now.mn !== was.mn || typeof was.miss !== 'number') return null;
    const n = ctx.vars[ctx.params[1]];
    const done = now.miss > n ? `: every amount up to ${n} can be paid` : '';
    if (now.miss > was.miss) {
      const d = now.miss - was.miss;
      const nx = stateOf(ctx.next?.vars, ctx.params);
      // a coin equal to miss and a patch of miss look alike: the patch counter (now or on the next step) tells them apart
      const stepped = Number.isInteger(was.i) && now.i === was.i + 1;
      const patched = !stepped && ((now.pn && now.patches > was.patches) || (nx && nx.pn === now.pn && nx.patches > now.patches && nx.i === now.i));
      const used = [coin(was), coin(now)].includes(d) && !patched ? d : d === was.miss ? null : undefined;
      const next = coin(was);
      if (used === null) {
        return `${next === undefined ? 'no coins left' : `the next coin ${next} is bigger than ${was.miss}`}: patch in a coin of ${was.miss}, so every amount below ${now.miss} can be paid${done}`;
      }
      if (used !== undefined) return `coin ${used} ≤ ${was.miss}: add it, so every amount below ${now.miss} can be paid${done}`;
      return null;
    }
    if (now.pn && now.pn === was.pn && Number.isInteger(was.patches) && now.patches === was.patches + 1) return `that is patch #${now.patches}`;
    return null;
  },
  // before miss grows: use the next coin, or patch?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = stateOf(ctx.next.vars, ctx.params);
    const was = stateOf(ctx.prev, ctx.params);
    if (!now || !nx || !now.mn || nx.mn !== now.mn || typeof now.miss !== 'number') return null;
    // miss just moved: its index / patch bookkeeping is still to come (half done)
    if (!was || (was.miss !== now.miss && was.i === now.i && was.patches === now.patches)) return null;
    const c = coin(now);
    let ans;
    // asked only where coverage grows next: a patch counter bumped first would make the same decision show twice
    if (nx.miss > now.miss && nx.patches === now.patches) {
      const d = nx.miss - now.miss;
      if (c !== undefined && d === c && d !== now.miss) ans = 0;
      else if (d === now.miss && c !== now.miss) ans = 1;
      else return null;
    } else return null;
    const opts = c === undefined ? ['Use the next coin', `Patch in a coin of ${now.miss}`] : [`Use the coin ${c}`, `Patch in a coin of ${now.miss}`];
    return options(
      `Every amount below ${now.miss} can be paid. ${c === undefined ? 'No coins are left.' : `The next coin is ${c}.`} What happens?`,
      opts[ans],
      [opts[1 - ans], `Stop: every amount up to ${ctx.vars[ctx.params[1]]} can be paid`],
      ans === 0 ? `${c} ≤ ${now.miss}: adding it to any amount below ${now.miss} reaches every amount below ${now.miss + c}, no gap.` : `${c === undefined ? 'With no coins left' : `${c} > ${now.miss}`}, nothing can pay ${now.miss}. The biggest coin that leaves no gap is ${now.miss} itself, so the range doubles.`,
    );
  },
  bugs: [
    {
      label: 'while (miss < n): n itself is not covered',
      find: 'miss <= n',
      replace: 'miss < n',
      explain: 'The loop stops when every amount below n can be paid, but n itself may still be missing: [1] with n = 2 returns 0 patches instead of 1.',
    },
    {
      label: 'Patch with 1 instead of miss',
      find: 'miss += miss;',
      replace: 'miss += 1;',
      explain: 'A small patch coin grows the range by only 1, so far more patches are counted: [10] with n = 9 needs 4 (1, 2, 4, 8), not 8.',
    },
  ],
};
