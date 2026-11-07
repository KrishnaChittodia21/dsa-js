// Scene: Predict the Winner. Two players take numbers from either end of a row. A call on nums[i..j] answers
// "how far ahead does the player to move end up?": take an end, then the opponent's best lead on what is left
// counts against you. Works with (i, j) / (l, r) / (lo, hi) / (left, right) recursion, with or without a memo.
import { firstInt, options, row } from './util.js';

const PAIRS = [
  ['i', 'j'],
  ['l', 'r'],
  ['lo', 'hi'],
  ['left', 'right'],
  ['start', 'end'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const lead = (v) => (v > 0 ? `ahead by ${v}` : v < 0 ? `behind by ${-v}` : 'level (a tie)');
const show = (a, i, j) => `[${a.slice(i, j + 1).join(', ')}]`;
/** a "take one end" line: `takeLeft = nums[i] - diff(i + 1, j)` → { name, idx } */
function takeOf(src, numsName) {
  const m = new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s*=\\s*${numsName}\\[\\s*([A-Za-z_$][\\w$]*)\\s*\\]\\s*-`).exec(src || '');
  return m ? { name: m[1], idx: m[2] } : null;
}

export default {
  id: 'predict-the-winner',
  metaphor: 'Two players picking from the ends',
  caption: 'Each call is the game on the bracketed part of the row and answers how far ahead the player to move ends up. Whatever you take, the opponent then plays the rest just as well, so their lead is subtracted.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  narrate(ctx) {
    const [numsName] = ctx.params;
    const a = row(ctx.vars[numsName]);
    const pair = pairOf(ctx.vars);
    if (ctx.ret && typeof ctx.value === 'boolean' && !ctx.next) return ctx.value ? 'player 1 ends level or ahead: ties count for player 1, so player 1 wins' : 'player 1 ends behind even with perfect play: player 2 wins';
    if (!a || !pair) return null;
    const [iName, jName] = pair;
    const i = ctx.vars[iName];
    const j = ctx.vars[jName];
    if (ctx.ret && typeof ctx.value === 'number') {
      if (i > j) return 'nothing is left to take: the lead from here is 0';
      if (i === j) return `only ${a[i]} is left: the player to move takes it and is ${lead(ctx.value)}`;
      if (/\.get\(|\[\s*\w+\s*\]\s*\[/.test(ctx.src || '') && !/max/i.test(ctx.src || '')) return `${show(a, i, j)} was solved before: the mover is ${lead(ctx.value)} (read from the memo)`;
      return `on ${show(a, i, j)} the player to move is ${lead(ctx.value)} taking the better end`;
    }
    const t = takeOf(ctx.src, numsName);
    if (t && Number.isInteger(ctx.vars[t.name]) && Number.isInteger(ctx.vars[t.idx])) {
      const k = ctx.vars[t.idx];
      const opp = a[k] - ctx.vars[t.name];
      const [ri, rj] = k === i ? [i + 1, j] : [i, j - 1];
      return `take ${k === i ? 'the left' : 'the right'} ${a[k]}; on ${show(a, ri, rj)} the opponent is ${lead(opp)}: ${a[k]} − (${opp}) = ${ctx.vars[t.name]}`;
    }
    if (/Math\.max/.test(ctx.src || '')) {
      const m = /\b([A-Za-z_$][\w$]*)\s*=\s*Math\.max/.exec(ctx.src);
      if (m && Number.isInteger(ctx.vars[m[1]])) return `keep the better end: the mover on ${show(a, i, j)} is ${lead(ctx.vars[m[1]])}`;
    }
    const was = pairOf(ctx.prev);
    if (!was || ctx.prev[iName] !== i || ctx.prev[jName] !== j) {
      if (i < j && (!was || i >= ctx.prev[iName] && j <= ctx.prev[jName])) return `${was ? 'next turn' : 'player 1 to move'}: the row left is ${show(a, i, j)}`;
    }
    return null;
  },
  predict(ctx) {
    const [numsName] = ctx.params;
    const a = row(ctx.vars[numsName]);
    const nx = ctx.next;
    if (!nx || !a) return null;
    // the game on the whole row is solved: who wins?
    if (ctx.ret && typeof ctx.value === 'number' && nx.ret && typeof nx.value === 'boolean') {
      return options(`With perfect play player 1 ends ${lead(ctx.value)}. Who wins?`, nx.value ? 'player 1' : 'player 2', [nx.value ? 'player 2' : 'player 1'], ctx.value === 0 ? 'A tie counts as a win for player 1.' : `Player 1 is ${lead(ctx.value)}, so ${nx.value ? 'player 1' : 'player 2'} wins.`);
    }
    // the opponent's lead on the rest just came back: what is player 1's lead for this first move?
    const t = takeOf(ctx.lines[nx.line - 1], numsName);
    const pair = pairOf(nx.vars);
    if (!ctx.ret || typeof ctx.value !== 'number' || !t || !pair) return null;
    const [iName, jName] = pair;
    const i = nx.vars[iName];
    const j = nx.vars[jName];
    const k = nx.vars[t.idx];
    const v = nx.vars[t.name];
    if (i !== 0 || j !== a.length - 1 || !Number.isInteger(k) || !Number.isInteger(v) || a[k] - ctx.value !== v) return null;
    return options(
      `Player 1 takes ${k === i ? 'the left' : 'the right'} ${a[k]}; on the rest the opponent ends ${lead(ctx.value)}. What is player 1's lead for this move?`,
      v,
      [a[k] + ctx.value, ctx.value - a[k], a[k]],
      `Player 1 scores ${a[k]}, and the opponent's lead on the rest counts against player 1: ${a[k]} − (${ctx.value}) = ${v}.`,
    );
  },
  bugs: [
    {
      label: 'Add the opponent’s lead',
      find: 'nums[i] - diff(i + 1, j)',
      replace: 'nums[i] + diff(i + 1, j)',
      explain: 'After you take the left end, the opponent’s best lead on the rest is points against you. Adding it makes their good moves look good for you.',
    },
    {
      label: 'A tie counts as a loss',
      find: 'diff(0, n - 1) >= 0',
      replace: 'diff(0, n - 1) > 0',
      explain: 'Ending level is a win for player 1, so a lead of exactly 0 (like [1, 1]) must return true.',
    },
  ],
};
