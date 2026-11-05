// Lemonade Change: a cash drawer with only $5 and $10 slots. Every customer pays for a $5 lemonade; a $10 needs one $5
// back, a $20 needs $15 back: a $10 + $5 if possible (keep the flexible $5s), else three $5s, else nobody can help.
// Reads the drawer from counters named five / ten (fives, f5, c5…) or from a Map / object keyed 5 and 10.
import { entriesOf, row } from './util.js';

const FIVE = ['five', 'fives', 'fiveCount', 'numFive', 'cnt5', 'count5', 'c5', 'f5', 'n5', 'five$', 'f'];
const TEN = ['ten', 'tens', 'tenCount', 'numTen', 'cnt10', 'count10', 'c10', 't10', 'n10', 'ten$', 't'];
const BILL = ['bill', 'b', 'x', 'p', 'pay', 'paid', 'note', 'money', 'amount', 'cur', 'curr', 'customer', 'c', 'v'];
const AT = ['i', 'j', 'k', 'idx'];

/** [fives, tens] in the drawer, or null */
function drawer(ctx, vars) {
  const f = FIVE.find((k) => Number.isInteger(vars[k]));
  const t = TEN.find((k) => Number.isInteger(vars[k]) && k !== f);
  if (f && t) return [vars[f], vars[t]];
  for (const [k, v] of Object.entries(vars)) {
    const e = !ctx.params.includes(k) && entriesOf(v);
    if (!e) continue;
    const get = (d) => e.find(([key]) => String(key) === String(d))?.[1];
    if (Number.isInteger(get(5)) || Number.isInteger(get(10))) return [get(5) ?? 0, get(10) ?? 0];
  }
  return null;
}

/** the bill the current customer pays: a loop variable holding 5 / 10 / 20, or bills[i] */
function billOf(ctx, vars) {
  const k = BILL.find((n) => [5, 10, 20].includes(vars[n]) && !ctx.params.includes(n));
  if (k) return vars[k];
  const bills = row(vars[ctx.params[0]]);
  const i = AT.find((n) => Number.isInteger(vars[n]));
  return bills && i && [5, 10, 20].includes(bills[vars[i]]) ? bills[vars[i]] : null;
}

const show = ([f, t]) => `drawer: ${f}×$5, ${t}×$10`;

export default {
  id: 'lemonade-change',
  metaphor: 'A cash drawer with $5 and $10 slots',
  caption: 'Customers pay one at a time for a $5 lemonade. A $10 needs a $5 back; a $20 needs $15 back, best as $10 + $5 so the flexible $5s stay in the drawer. $20 bills are never given out, so they are not counted.',
  narrate(ctx) {
    const now = drawer(ctx, ctx.vars);
    const bill = billOf(ctx, ctx.vars);
    if (!ctx.next && typeof ctx.result === 'boolean' && /return/.test(ctx.src || '')) {
      if (ctx.result) return `every customer got the right change: true`;
      return bill ? `a $${bill} needs $${bill - 5} back and the drawer cannot make it${now ? ` (${show(now)})` : ''}: false` : 'someone could not get change: false';
    }
    const before = drawer(ctx, ctx.prev);
    if (!now || !before) return bill && now ? `a customer pays $${bill}${bill > 5 ? `: $${bill - 5} change is due` : ''} (${show(now)})` : null;
    const df = now[0] - before[0];
    const dt = now[1] - before[1];
    if (!df && !dt) return bill && bill !== billOf(ctx, ctx.prev) ? `a customer pays $${bill}${bill > 5 ? `: $${bill - 5} change is due` : ''} (${show(now)})` : null;
    if (df === 1 && !dt) return `a customer pays $5: no change needed, the $5 goes in the drawer (${show(now)})`;
    if (df === -3) return `$15 back as three $5s (${show(now)})`;
    if (df === -1 && dt === 1) return `a $10 goes in, one $5 comes out as change (${show(now)})`;
    if (dt === 1) return `the $10 goes in the drawer (${show(now)})`;
    if (df === -1 && bill === 10) return `one $5 back as change for the $10 (${show(now)})`;
    if (dt === -1) return `a $10 back as part of the $15 change (${show(now)})`;
    if (df === -1 && bill === 20) return `a $5 back too: $15 change handed over (${show(now)})`;
    if (df === -1) return `a $5 back as change (${show(now)})`;
    return null;
  },
  // before change is handed out: which bills come out of the drawer?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = drawer(ctx, ctx.vars);
    const after = drawer(ctx, ctx.next.vars);
    const bill = billOf(ctx, ctx.next.vars);
    if (!now || (bill !== 10 && bill !== 20)) return null;
    const stop = ['cannot make change: false'];
    let answer = null;
    if (ctx.next.ret && ctx.result === false) answer = stop[0];
    else if (after && bill === 20 && after[1] === now[1] - 1 && after[0] >= now[0] - 1) answer = '$10 + $5';
    else if (after && bill === 20 && after[0] === now[0] - 3 && after[1] === now[1]) answer = 'three $5s';
    else if (after && bill === 10 && after[0] === now[0] - 1 && now[1] === 0) answer = 'one $5'; // only the first $10: later ones are the same story
    if (!answer) return null;
    const opts = bill === 20 ? ['$10 + $5', 'three $5s', ...stop] : ['one $5', ...stop];
    const why = {
      '$10 + $5': 'A $10 is there, and it is useless for $10 customers later, while a $5 helps everyone: give the $10 first.',
      'three $5s': 'No $10 in the drawer, but three $5s also make $15.',
      'one $5': 'A $10 for a $5 lemonade: one $5 goes back.',
    }[answer] || `The drawer cannot make $${bill - 5} from ${now[0]}×$5 and ${now[1]}×$10.`;
    return { question: `A customer pays $${bill} (${show(now)}). What change comes out?`, options: opts, answer: opts.indexOf(answer), explain: why };
  },
  bugs: [
    {
      label: 'Three $5s before the $10',
      find: 'if (ten > 0 && five > 0) { ten--; five--; } // keep $5s — they are more flexible\n      else if (five >= 3) five -= 3;',
      replace: 'if (five >= 3) five -= 3;\n      else if (ten > 0 && five > 0) { ten--; five--; }',
      explain: 'Spending three $5s on a $20 while a $10 sits in the drawer leaves no $5 for the $10 customers after it.',
    },
    {
      label: 'No check for an empty $5 slot',
      find: 'if (five === 0) return false;',
      replace: '',
      explain: 'A $10 customer gets a $5 that is not there: the $5 count goes negative and the run says true when the first customer pays $10.',
    },
  ],
};
