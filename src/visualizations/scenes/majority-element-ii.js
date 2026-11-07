// Majority Element II (two-candidate Boyer–Moore voting). Two seats with a vote count each; a value that matches
// neither seat cancels one vote from both (three different votes out at once). A recount then checks the survivors.
// Works with c1/n1/c2/n2, cand1/count1/…, a/ca/b/cb and the like.
import { firstInt, row } from './util.js';

const SEATS = [
  ['c1', 'n1', 'c2', 'n2'],
  ['cand1', 'count1', 'cand2', 'count2'],
  ['cand1', 'cnt1', 'cand2', 'cnt2'],
  ['candidate1', 'count1', 'candidate2', 'count2'],
  ['c1', 'cnt1', 'c2', 'cnt2'],
  ['c1', 'count1', 'c2', 'count2'],
  ['num1', 'count1', 'num2', 'count2'],
  ['m1', 'c1', 'm2', 'c2'],
  ['a', 'ca', 'b', 'cb'],
  ['x', 'cx', 'y', 'cy'],
];
const CUR = ['x', 'num', 'v', 'val', 'value', 'e', 'cur', 'item'];
const IDX = ['i', 'j', 'k', 'idx'];
const RES = ['res', 'result', 'ans', 'answer', 'out', 'output'];

const isVal = (v) => typeof v === 'number' || v === null || v === undefined;
const seatsOf = (vars) => SEATS.find(([a, na, b, nb]) => a in vars && b in vars && isVal(vars[a]) && isVal(vars[b]) && Number.isInteger(vars[na]) && Number.isInteger(vars[nb]));
function curOf(vars, nums, skip) {
  const [, x] = firstInt(vars, CUR.filter((n) => !skip.includes(n)));
  if (x !== undefined) return x;
  const [, i] = firstInt(vars, IDX.filter((n) => !skip.includes(n)));
  return nums && i >= 0 && i < nums.length ? nums[i] : undefined;
}
const show = (c) => (c === null || c === undefined ? '—' : c);
const votes = (n) => `${n} vote${n === 1 ? '' : 's'}`;

export default {
  id: 'majority-element-ii',
  metaphor: 'Two seats, three-way cancelling votes',
  caption: 'Two seats each hold a candidate and its votes. A matching value adds a vote; a value that matches neither seat knocks one vote off both. The survivors are only candidates until a recount confirms them.',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const limit = Math.floor(nums.length / 3);
    const s = seatsOf(ctx.vars);
    if (s && s.every((n) => n in ctx.prev)) {
      const [a, na, b, nb] = s;
      const v = ctx.vars;
      const p = ctx.prev;
      const x = curOf(v, nums, s);
      for (const [c, n, k] of [[a, na, 1], [b, nb, 2]]) {
        if (v[c] !== p[c]) return `seat ${k} is free, so ${v[c]} sits down${v[n] > 0 ? ` with ${votes(v[n])}` : ''}`;
      }
      const d1 = v[na] - p[na];
      const d2 = v[nb] - p[nb];
      if (d1 < 0 && d2 < 0) return `${x ?? 'a third value'} matches neither seat: one vote off ${show(v[a])} and ${show(v[b])} (${v[na]} and ${v[nb]} left)`;
      if (d1 < 0) return `${x ?? 'a third value'} matches neither ${show(v[a])} nor ${show(v[b])}: three different votes cancel, seat 1 drops to ${votes(v[na])}${v[na] === 0 ? ' (free)' : ''}`;
      if (d2 < 0) return `…and seat 2 (${show(v[b])}) drops to ${votes(v[nb])}${v[nb] === 0 ? ': it is free now' : ''}`;
      if (d1 > 0) return `a vote for seat 1: ${show(v[a])} has ${votes(v[na])}`;
      if (d2 > 0) return `a vote for seat 2: ${show(v[b])} has ${votes(v[nb])}`;
    }
    const r = RES.find((n) => row(ctx.vars[n]) && row(ctx.prev[n]) && ctx.vars[n].length === ctx.prev[n].length + 1);
    if (r) {
      const w = ctx.vars[r][ctx.vars[r].length - 1];
      const k = nums.filter((x) => x === w).length;
      return `recount: ${w} appears ${k} times, more than ⌊${nums.length} / 3⌋ = ${limit}, so it is a real winner`;
    }
    return null;
  },
  // before the next value votes: where does its vote go?
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    const s = seatsOf(ctx.vars);
    if (!nums || !s || !ctx.next || !s.every((n) => n in ctx.prev)) return null;
    const [a, na, b, nb] = s;
    const v = ctx.vars;
    const p = ctx.prev;
    const nx = ctx.next.vars;
    if (!s.every((n) => n in nx)) return null;
    // skip half-done moves: a seat just taken (votes not yet set) or one seat cancelled but not the other
    if ((v[a] !== p[a] && v[na] === 0) || (v[b] !== p[b] && v[nb] === 0) || (v[na] < p[na] && v[nb] === p[nb])) return null;
    if (v[a] === null || v[a] === undefined || v[b] === null || v[b] === undefined) return null; // a real choice needs two candidates
    const y = curOf(nx, nums, s);
    if (y === undefined) return null;
    let kind = null;
    if (nx[a] !== v[a] || nx[b] !== v[b]) kind = 'take';
    else if (nx[na] < v[na]) kind = 'cancel';
    else if (nx[na] > v[na]) kind = 'one';
    else if (nx[nb] > v[nb]) kind = 'two';
    if (!kind) return null;
    // sanity: the move must fit the value
    if ((kind === 'one' && y !== v[a]) || (kind === 'two' && y !== v[b]) || (kind === 'cancel' && (y === v[a] || y === v[b]))) return null;
    const opts = {
      one: `A vote for seat 1 (${show(v[a])})`,
      two: `A vote for seat 2 (${show(v[b])})`,
      take: `${y} takes a free seat`,
      cancel: 'One vote off both seats',
    };
    const order = ['one', 'two', 'take', 'cancel'];
    const explain = {
      one: `${y} is the candidate in seat 1, so seat 1 gets a vote.`,
      two: `${y} is the candidate in seat 2, so seat 2 gets a vote.`,
      take: `${y} matches neither candidate and a seat has 0 votes, so ${y} sits there.`,
      cancel: `${y} matches neither ${show(v[a])} nor ${show(v[b])} and both seats have votes, so three different values cancel out.`,
    };
    return {
      question: `Seat 1: ${show(v[a])} (${votes(v[na])}), seat 2: ${show(v[b])} (${votes(v[nb])}). The next value is ${y}. What happens?`,
      options: order.map((k) => opts[k]),
      answer: order.indexOf(kind),
      explain: explain[kind],
    };
  },
  bugs: [
    {
      label: 'Fill a free seat before matching',
      find: `if (x === c1) n1++;
    else if (x === c2) n2++;
    else if (n1 === 0) { c1 = x; n1 = 1; }
    else if (n2 === 0) { c2 = x; n2 = 1; }`,
      replace: `if (n1 === 0) { c1 = x; n1 = 1; }
    else if (n2 === 0) { c2 = x; n2 = 1; }
    else if (x === c1) n1++;
    else if (x === c2) n2++;`,
      explain: 'With seat 2 free, the second 1 in [1, 1, 1, 3, 3, 2, 2, 2] sits down there too: both seats hold 1, and 2 never gets a seat.',
    },
    {
      label: 'Skip the recount',
      find: `if (k1 > limit) res.push(c1);
  if (k2 > limit) res.push(c2);`,
      replace: `if (c1 !== null) res.push(c1);
  if (c2 !== null) res.push(c2);`,
      explain: 'The seats only hold survivors, not winners: [1, 2, 3] ends with 1 and 3 seated although each appears just once.',
    },
  ],
};
