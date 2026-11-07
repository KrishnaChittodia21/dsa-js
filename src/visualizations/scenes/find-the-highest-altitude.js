// Find the Highest Altitude. A biker reads the altimeter after every stretch of road and moves a "highest so far"
// flag whenever a new peak is reached; the start (altitude 0) counts too. Works with common names for the running
// altitude (altitude, alt, cur, sum…) and the record (best, max, highest, res…).
const ALT = ['altitude', 'alt', 'cur', 'curr', 'current', 'height', 'h', 'sum', 'running', 'level', 'pos', 'now'];
const BEST = ['best', 'max', 'maxAlt', 'maxAltitude', 'highest', 'high', 'peak', 'res', 'result', 'ans', 'answer', 'top'];
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const numName = (vars, names) => names.find((k) => fin(vars[k]));

export default {
  id: 'find-the-highest-altitude',
  metaphor: "A biker's altimeter and a peak flag",
  caption: 'Each gain moves the biker up or down; the running altitude is the prefix sum of the gains. The flag marks the highest point so far, and the start (altitude 0) counts.',
  compare: 'best',
  narrate(ctx) {
    const alt = numName(ctx.vars, ALT);
    const best = numName(ctx.vars, BEST);
    if (alt && fin(ctx.prev[alt]) && ctx.vars[alt] !== ctx.prev[alt]) {
      const a = ctx.vars[alt];
      const d = a - ctx.prev[alt];
      return `${d >= 0 ? `climb ${d}` : `drop ${-d}`}: from ${ctx.prev[alt]} to altitude ${a}`;
    }
    if (alt && fin(ctx.prev[alt]) && new RegExp(`\\b${alt}\\s*\\+?=`).test(ctx.src)) return `a flat stretch (gain 0): the altitude stays ${ctx.vars[alt]}`;
    if (best && fin(ctx.prev[best]) && ctx.vars[best] !== ctx.prev[best]) return `new peak: the flag moves up to ${ctx.vars[best]} (was ${ctx.prev[best]})`;
    if (best && alt && new RegExp(`\\b${best}\\s*=`).test(ctx.src) && fin(ctx.prev[best])) {
      return `altitude ${ctx.vars[alt]} ${ctx.vars[alt] === ctx.vars[best] ? 'only ties' : 'is below'} the peak ${ctx.vars[best]}: the flag stays`;
    }
    if (best && !(best in ctx.prev) && alt) return `start at altitude ${ctx.vars[alt]}; the start is the first peak: ${best} = ${ctx.vars[best]}`;
    return null;
  },
  // right after the altimeter went up: does the flag move too?
  predict(ctx) {
    if (!ctx.next) return null;
    const alt = numName(ctx.vars, ALT);
    const best = numName(ctx.vars, BEST);
    // only after a climb: going down can never set a new peak
    if (!alt || !best || !fin(ctx.prev[alt]) || ctx.vars[alt] <= ctx.prev[alt]) return null;
    const nx = ctx.next.vars;
    if (!fin(nx[best]) || nx[alt] !== ctx.vars[alt] && nx[best] !== ctx.vars[best]) return null;
    const moved = nx[best] !== ctx.vars[best];
    const a = ctx.vars[alt];
    const b = ctx.vars[best];
    if (moved && nx[best] !== a) return null;
    // no move is only certain when the next step is the record check, the next stretch, or the return
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    if (!moved && !ctx.next.ret && !new RegExp(`\\b(${best}|${alt})\\b`).test(nextSrc)) return null;
    return {
      question: `The biker is now at altitude ${a}; the peak flag is at ${b}. Does the flag move?`,
      options: [`Yes: new peak ${a}`, `No: stays at ${b}`],
      answer: moved ? 0 : 1,
      explain: moved ? `${a} is higher than every point so far (${b}), so it becomes the new peak.` : `${a} is not higher than ${b}, so the highest point so far is still ${b}.`,
    };
  },
  bugs: [
    {
      label: 'Forget the start: best = -Infinity',
      find: 'best = 0;',
      replace: 'best = -Infinity;',
      explain: 'The start (altitude 0) is a point of the trip too. On an all-downhill ride like [-1] the answer is 0, but this returns -1.',
    },
    {
      label: 'Return where the ride ends',
      find: 'return best;',
      replace: 'return altitude;',
      explain: 'The final altitude is not the highest one: for [3, -5, 10, -1] the ride ends at 7 but the peak was 8.',
    },
  ],
};
