// Binary Watch: lighting exactly turnedOn of the 10 LEDs (hour 8 4 2 1, minute 32 16 8 4 2 1). LEDs are lit in
// order, so each set of LEDs is tried once; a time past 11:59 is a dead end, a full set that reads well is written down.
import { callArgs } from './util.js';

const HOUR = /^(h|hr|hrs|hour|hours)$/i;
const MIN = /^(m|min|mins|minute|minutes)$/i;
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'times'];
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => typeof r === 'string'));
const bits = (x) => x.toString(2).split('1').length - 1;
const time = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const isPow2 = (x) => x > 0 && (x & (x - 1)) === 0;

/** the hour and minute the call we are in is holding (its parameters), or null */
function clockOf(ctx) {
  const call = callArgs(ctx);
  if (!call) return null;
  const names = Object.keys(call.args);
  const hn = names.find((k) => HOUR.test(k));
  const mn = names.find((k) => MIN.test(k));
  const h = call.args[hn];
  const m = call.args[mn];
  return Number.isInteger(h) && Number.isInteger(m) && h >= 0 && m >= 0 ? { h, m, hn, mn } : null;
}
const invalid = (c) => c.h > 11 || c.m > 59;

/** "the hour-4 LED" when exactly one LED separates two clocks */
function ledLit(from, to) {
  const dh = to.h - from.h;
  const dm = to.m - from.m;
  if (dm === 0 && isPow2(dh)) return `the hour-${dh} LED`;
  if (dh === 0 && isPow2(dm)) return `the minute-${dm} LED`;
  return null;
}

export default {
  id: 'binary-watch',
  metaphor: 'Lighting LEDs on a binary watch',
  caption: 'Each call holds the time the lit LEDs add up to. LEDs are lit in a fixed order (hour 8 4 2 1, then minute 32 16 8 4 2 1), so no set is tried twice; past 11:59 is a dead end, and a full set that reads as a real time is written down.',
  narrate(ctx) {
    const on = ctx.input?.[0];
    if (!Number.isInteger(on)) return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) {
      const t = /^(\d+):(\d\d)$/.exec(res[res.length - 1]);
      if (!t) return `record "${res[res.length - 1]}" (${res.length} found so far)`;
      const h = Number(t[1]);
      const m = Number(t[2]);
      return `${t[0]}: hour ${h} (${bits(h)} LED${bits(h) === 1 ? '' : 's'}) + minute ${m} (${bits(m)}) = ${on} lit: record it (${res.length} found)`;
    }
    const c = clockOf(ctx);
    if (!c) return null;
    const p = Number.isInteger(ctx.prev[c.hn]) && Number.isInteger(ctx.prev[c.mn]) ? { h: ctx.prev[c.hn], m: ctx.prev[c.mn] } : null;
    if (p && p.h === c.h && p.m === c.m) return null;
    const left = on - bits(c.h) - bits(c.m);
    const led = p && ledLit(p, c);
    const back = p && bits(c.h) + bits(c.m) < bits(p.h) + bits(p.m);
    const lit = led ? `light ${led} → ${time(c.h, c.m)}` : back ? `back at ${time(c.h, c.m)}` : `the watch shows ${time(c.h, c.m)}`;
    if (invalid(c)) return `${lit}: ${c.h > 11 ? `hour ${c.h} is past 11` : `minute ${c.m} is past 59`}, not a real time: dead end, back up`;
    if (!p && c.h === 0 && c.m === 0) return `start: all LEDs off (0:00), ${on} to light`;
    return left > 0 ? `${lit}, ${left} more LED${left === 1 ? '' : 's'} to light` : `${lit}: all ${on} LED${on === 1 ? ' is' : 's are'} lit`;
  },
  // the next call lights one more LED: is the new time a dead end, a finished time, or a step on the way?
  predict(ctx) {
    const on = ctx.input?.[0];
    if (!ctx.next || !Number.isInteger(on)) return null;
    const c = clockOf(ctx);
    const n = clockOf({ lines: ctx.lines, line: ctx.next.line, vars: ctx.next.vars });
    if (!c || !n || (c.h === n.h && c.m === n.m)) return null;
    const led = ledLit(c, n);
    if (!led) return null;
    const left = on - bits(n.h) - bits(n.m);
    const bad = invalid(n);
    let answer;
    if (bad && ctx.next.ret) answer = 2;
    else if (!bad && !ctx.next.ret) answer = left === 0 ? 1 : 0;
    else return null;
    const res = resultOf(ctx.vars);
    const worth = answer === 2 || (answer === 1 && res && res.length === 0) || (answer === 0 && n.h > 7 && c.h <= 7);
    if (!worth) return null;
    return {
      question: `${time(c.h, c.m)} now, and ${led} is lit next (${on} LED${on === 1 ? '' : 's'} must be on in total). What happens to the new time?`,
      options: ['It is a real time with LEDs still to light: go deeper', 'It is a real time with every LED lit: record it', 'It is not a real time: dead end, back up'],
      answer,
      explain: [
        `${time(n.h, n.m)} is fine (hour ≤ 11, minute ≤ 59) and ${left} more LED${left === 1 ? ' has' : 's have'} to be lit, so the search goes on from here.`,
        `${time(n.h, n.m)} is a real time and all ${on} LEDs are lit, so it is written down (minutes padded to two digits).`,
        `The LEDs add up to ${time(n.h, n.m)}, but the hour must be at most 11 and the minute at most 59, so this branch stops at once.`,
      ][answer],
    };
  },
  bugs: [
    {
      label: 'Minutes without padding',
      find: "String(minute).padStart(2, '0')",
      replace: 'String(minute)',
      explain: 'Minute 5 is written as "1:5" instead of "1:05", so every time with a minute below 10 is in the wrong format.',
    },
    {
      label: 'Let the hour reach 12',
      find: 'hour > 11',
      replace: 'hour > 12',
      explain: 'Hour 12 (LEDs 8 and 4) passes the check, so "12:00" and other times the watch cannot show are written down.',
    },
  ],
};
