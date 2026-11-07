// Maximum Employees to Be Invited to a Meeting (functional graph). Everyone points at one favourite, so each group
// is one loop with chains of admirers hanging into it. Kahn peels the chains (nobody admires a chain's end) and
// records the longest chain into each person; what is left are loops. A loop of 3+ fills a table alone; every
// mutual pair a ↔ b seats 2 + the longest chain into each, and all such pair-lines fit at one table together.
import { changedIdx, row, itemsOf, options } from './util.js';

const isInts = (v) => row(v) && v.length > 0 && v.every(Number.isInteger);
const DEG = /indeg|in_?deg|^deg|admir|fans|likes|^cnt$|count/i;
const DEPTH = /depth|chain|^dp$|arm|tail|^len|longest|dist/i;
const PAIRS = /pair|two|mutual|sum|line|chain|total|^res$/i;
const LOOP = /cycle|loop|ring|circle|best|big|max/i;

const pick = (vars, params, re, not) => Object.keys(vars).find((k) => !params.includes(k) && k !== not && re.test(k) && isInts(vars[k]));
const intName = (vars, params, re, not) => Object.keys(vars).find((k) => !params.includes(k) && re.test(k) && !(not && not.test(k)) && Number.isInteger(vars[k]));

/** a mutual pair a ↔ b among the loop / scan variables in scope */
function pairOf(vars, fav) {
  for (const k of ['i', 'start', 's', 'a', 'node', 'u', 'x', 'j']) {
    const a = vars[k];
    if (Number.isInteger(a) && Number.isInteger(fav[a]) && fav[a] !== a && fav[fav[a]] === a) return [a, fav[a]];
  }
  return null;
}

export default {
  id: 'maximum-employees-to-be-invited-to-a-meeting',
  metaphor: 'Loops and admirer chains at a table',
  caption: 'Each person points at their favourite. Chains of admirers are peeled off first, remembering the longest chain into each person. A loop of 3 or more fills a table alone; a mutual pair can bring one chain on each side, and all pairs share one table.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const fav = row(vars[params[0]]);
    if (!fav) return null;
    const pName = intName(vars, params, PAIRS, LOOP);
    const cName = intName(vars, params, LOOP, PAIRS);
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) {
      if (pName && cName) return `invite max(biggest loop ${vars[cName]}, all pair-lines ${vars[pName]}) = ${ctx.value} people`;
      return `${ctx.value} people can be invited`;
    }
    if (pName && Number.isInteger(prev[pName]) && vars[pName] > prev[pName]) {
      const pr = pairOf(vars, fav);
      const dName = pick(vars, params, DEPTH, pick(vars, params, DEG));
      const d = dName && vars[dName];
      if (pr && d) return `mutual pair ${pr[0]} ↔ ${pr[1]}: 2 + chain ${d[pr[0]]} + chain ${d[pr[1]]} = ${vars[pName] - prev[pName]} seats (pair-lines now seat ${vars[pName]})`;
      return `a mutual pair with its chains adds ${vars[pName] - prev[pName]} seats: pair-lines now seat ${vars[pName]}`;
    }
    if (cName && Number.isInteger(prev[cName]) && vars[cName] > prev[cName]) return `a loop of ${vars[cName]} people fills a table on its own: biggest loop so far ${vars[cName]}`;
    const gName = pick(vars, params, DEG);
    const dName = pick(vars, params, DEPTH, gName);
    if (dName && isInts(prev[dName])) {
      const ch = changedIdx(vars[dName], prev[dName]);
      if (ch.length === 1) {
        const v = ch[0];
        const u = ['u', 'cur', 'node', 'x', 'p'].map((k) => vars[k]).find((x) => Number.isInteger(x) && fav[x] === v) ?? null;
        return `${u === null ? 'a chain leads into' : `${u} (chain of ${vars[dName][u]} behind them) admires`} ${v}: the longest chain into ${v} is now ${vars[dName][v]}`;
      }
    }
    if (gName && isInts(prev[gName])) {
      const ch = changedIdx(vars[gName], prev[gName]);
      if (ch.length === 1) {
        const v = ch[0], c = vars[gName][v];
        if (c > prev[gName][v]) return `${v} gets an admirer (${c} so far)`;
        return c === 0 ? `every admirer of ${v} is peeled: ${v} is on a chain, not a loop, so peel it too` : `one admirer of ${v} is peeled (${c} left)`;
      }
    }
    const qName = Object.keys(vars).find((k) => /queue|^q$|stack|leaves|zero/i.test(k) && itemsOf(vars[k]));
    const q = qName && itemsOf(vars[qName]), pq = qName && itemsOf(prev[qName]);
    // only the first pushes: later ones follow a peel already narrated
    if (q && pq && q.length === pq.length + 1 && pName === undefined && (!dName || vars[dName].every((x) => x === 0))) return `nobody admires ${q[q.length - 1]}: the end of a chain, peel it first`;
    // walking a loop: a person is marked
    for (const [k, v] of Object.entries(vars)) {
      if (params.includes(k) || !/done|seen|vis|mark|on/i.test(k) || !row(v) || !row(prev[k])) continue;
      const ch = changedIdx(v, prev[k]);
      if (ch.length === 1 && v[ch[0]]) return `${ch[0]} is on a loop: walk on to their favourite ${fav[ch[0]]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const nx = ctx.next.vars;
    const fav = row(vars[params[0]]);
    if (!fav) return null;
    const pName = intName(vars, params, PAIRS, LOOP);
    const cName = intName(vars, params, LOOP, PAIRS);
    // the last step: which candidate wins?
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && ctx.next.value === ctx.result && pName && cName && !ctx.ret) {
      const p = vars[pName], c = vars[cName];
      if (!(p > 0) || !(c > 0) || p === c) return null; // with one option empty the answer is obvious
      return options(
        `The biggest loop seats ${c}; all pair-lines together seat ${p}. How many people are invited?`,
        ctx.next.value,
        [p + c, Math.min(p, c), Math.max(p, c)],
        'A loop of 3+ uses a whole table, so it cannot share with anyone; pair-lines can all sit together. The answer is the larger of the two options, not their sum.',
      );
    }
    // a pair is about to be added: how many seats?
    if (pName && Number.isInteger(nx[pName]) && nx[pName] > vars[pName]) {
      const pr = pairOf(vars, fav);
      const dName = pick(vars, params, DEPTH, pick(vars, params, DEG));
      if (!pr || !dName) return null;
      const d = vars[dName], add = nx[pName] - vars[pName];
      return options(
        `${pr[0]} and ${pr[1]} like each other. The longest chain into ${pr[0]} is ${d[pr[0]]}, into ${pr[1]} is ${d[pr[1]]}. How many seats does this pair-line take?`,
        add,
        [2, add + 1, d[pr[0]] + d[pr[1]], Math.max(d[pr[0]], d[pr[1]]) + 2],
        `The pair sits together (2) and each can bring one admirer chain on its free side: 2 + ${d[pr[0]]} + ${d[pr[1]]} = ${2 + d[pr[0]] + d[pr[1]]}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Keep only the best pair instead of summing',
      find: 'pairsTotal += 2 + depth[i] + depth[favorite[i]]',
      replace: 'pairsTotal = Math.max(pairsTotal, 2 + depth[i] + depth[favorite[i]])',
      explain: 'Pair-lines have free ends, so all of them can sit at one table. Keeping only the best one drops the others: [1,0,3,2] gives 2 instead of 4.',
    },
    {
      label: 'Add the loop and the pairs together',
      find: 'return Math.max(bestCycle, pairsTotal);',
      replace: 'return bestCycle + pairsTotal;',
      explain: 'A loop of 3+ fills its whole table: nobody else fits beside it. The two options exclude each other, so take the larger, not the sum.',
    },
  ],
};
