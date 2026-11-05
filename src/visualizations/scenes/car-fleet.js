// Car Fleet (sort by position, scan arrival times from the front). A one-lane road into town: no overtaking, so a
// car that would arrive earlier than the fleet ahead catches it and crawls along behind. Works with a fleet counter
// plus a "lead" time, or a stack of fleet arrival times.
import { options, row } from './util.js';

const TIME = ['time', 't', 'arrival', 'eta', 'curTime', 'currTime', 'cur', 'curr', 'tt'];
const LEAD = ['lead', 'prev', 'last', 'slowest', 'maxTime', 'lastTime', 'prevTime', 'leader', 'top', 'ahead'];
const FLEETS = ['fleets', 'fleet', 'count', 'cnt', 'res', 'result', 'ans', 'answer'];
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const firstNum = (vars, names) => names.find((n) => num(vars[n]));
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, ''));
const stackOf = (vars) => Object.entries(vars).find(([k, v]) => /stack|^st$|fleets?$|times/i.test(k) && row(v) && v.every(num));
const carsOf = (vars) => Object.entries(vars).find(([, v]) => Array.isArray(v) && v.length && v.every((c) => row(c) && c.length === 2 && c.every(num)));

/** { count, lead } of the fleets formed so far: a counter + lead time, or a stack of arrival times */
function fleetsOf(vars) {
  const s = stackOf(vars);
  if (s) return { count: s[1].length, lead: s[1][s[1].length - 1] };
  const f = firstNum(vars, FLEETS);
  const l = firstNum(vars, LEAD);
  return f ? { count: vars[f], lead: l ? vars[l] : undefined } : null;
}

export default {
  id: 'car-fleet',
  metaphor: 'Cars on a one-lane road into town',
  caption: 'Cars are taken from the one nearest town backwards. Each car\'s time is when it would arrive alone; a car that would arrive no later than the fleet ahead gets stuck behind it and joins.',
  compare: 'fleets',
  narrate(ctx) {
    const tName = ctx.params[0];
    const target = ctx.vars[tName];
    const cars = carsOf(ctx.vars);
    if (cars && JSON.stringify(cars[1]) !== JSON.stringify(ctx.prev[cars[0]])) {
      const was = ctx.prev[cars[0]];
      const list = cars[1].map(([p, t]) => `${p}→${fmt(t)}`).join(', ');
      if (Array.isArray(was) && was.length === cars[1].length) return `line the cars up from nearest town (position → solo arrival time): ${list}`;
      if (!was) return `each car's solo arrival time = (${target} − position) / speed: ${list}`;
    }
    const tn = firstNum(ctx.vars, TIME);
    const now = fleetsOf(ctx.vars);
    const before = fleetsOf(ctx.prev);
    if (now && before && now.count > before.count && tn && before.count === 0) return `the car nearest town arrives at ${fmt(ctx.vars[tn])}: nothing blocks it, it leads fleet #1`;
    if (now && before && now.count > before.count && tn) return `this car would arrive at ${fmt(ctx.vars[tn])}, after the fleet ahead${num(before.lead) ? ` (${fmt(before.lead)})` : ''}: it never catches up, so it leads fleet #${now.count}`;
    if (now && before && now.count === before.count && num(now.lead) && now.lead !== before.lead && tn && now.lead === ctx.vars[tn]) return `the new fleet sets the pace: anyone behind arriving by ${fmt(now.lead)} gets stuck behind it`;
    if (tn && ctx.vars[tn] !== ctx.prev[tn] && now && before && now.count === before.count && num(now.lead) && ctx.vars[tn] <= now.lead && now.count > 0) {
      return `this car would arrive at ${fmt(ctx.vars[tn])}, no later than the fleet ahead (${fmt(now.lead)}): it catches up and joins it`;
    }
    return null;
  },
  // before the next car is looked at: does it join the fleet ahead or start a new one?
  predict(ctx) {
    if (!ctx.next) return null;
    const tn = firstNum(ctx.next.vars, TIME);
    const now = fleetsOf(ctx.vars);
    const after = fleetsOf(ctx.next.vars);
    if (!tn || !now || !after || now.count < 1 || !num(now.lead)) return null;
    const t = ctx.next.vars[tn];
    if (t === ctx.vars[tn]) return null;
    // a half-done new fleet (counted, lead not set yet) is not a moment to ask
    if (num(ctx.vars[tn]) && now.lead !== ctx.vars[tn] && ctx.vars[tn] > now.lead) return null;
    const isNew = after.count === now.count + 1;
    if (!isNew && after.count !== now.count) return null;
    if (isNew !== t > now.lead) return null;
    const opts = ['It joins the fleet ahead', 'It starts a new fleet'];
    return {
      question: `The fleet ahead arrives at ${fmt(now.lead)}. The next car would arrive alone at ${fmt(t)}. What happens?`,
      options: opts,
      answer: isNew ? 1 : 0,
      explain: isNew ? `${fmt(t)} is later than ${fmt(now.lead)}: it can never reach the fleet ahead before town, so it forms its own.` : `${fmt(t)} ≤ ${fmt(now.lead)}: it would arrive no later, so it catches the fleet ahead by town and slows down to join it.`,
    };
  },
  bugs: [
    {
      label: '> becomes >=: tie at town makes a new fleet',
      find: 'if (time > lead)',
      replace: 'if (time >= lead)',
      explain: 'A car that catches the fleet ahead exactly at town does join it; >= counts it as a separate fleet.',
    },
    {
      label: 'Scan from the back of the road',
      find: 'b[0] - a[0]',
      replace: 'a[0] - b[0]',
      explain: 'Starting with the car furthest from town, it cannot know a slower car ahead will block it, so fleets are miscounted.',
    },
  ],
};
