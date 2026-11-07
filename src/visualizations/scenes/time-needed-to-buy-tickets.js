// Scene: Time Needed to Buy Tickets. A ticket booth with a looping line: the front person buys one ticket per second
// and, if they still need more, walks to the back. Reads the tickets-left row (a copy, or the input itself), the
// person at the front (i / idx / front…) and the clock (time / t / seconds…); a queue of indices is optional.
import { changedIdx, row } from './util.js';

const WHO = ['i', 'idx', 'front', 'person', 'cur', 'curr', 'p', 'x'];
const CLOCK = ['time', 't', 'sec', 'secs', 'seconds', 'ans', 'res', 'result', 'count', 'total', 'timer'];

/** [name, row] of the tickets-left counter: a non-parameter number row as long as the input, else the input itself */
function leftOf(vars, params) {
  const t = row(vars[params[0]]);
  if (!t) return [null, null];
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && row(v) && v.length === t.length && v.every((x) => typeof x === 'number') && !/^q|queue|line/i.test(k));
  return own || [params[0], t];
}
const intOf = (vars, names, skip) => names.find((k) => !skip.includes(k) && Number.isInteger(vars[k]));
/** the queue of person indices, as the list of people still in line (front first) */
function lineOf(vars) {
  for (const [k, v] of Object.entries(vars)) {
    if (!/^q$|queue|line|^dq$/i.test(k)) continue;
    if (row(v)) return v;
    const o = v?.$obj;
    if (o && row(o.items)) return Number.isInteger(o.head) ? o.items.slice(o.head) : o.items;
  }
  return null;
}

export default {
  id: 'time-needed-to-buy-tickets',
  metaphor: 'A ticket booth with a looping line',
  caption: 'Each second the person at the front buys one ticket; anyone who still needs more walks to the back of the line. The clock stops the moment person k holds all their tickets.',
  narrate(ctx) {
    const [, kName] = ctx.params;
    const k = ctx.vars[kName];
    const [lName, left] = leftOf(ctx.vars, ctx.params);
    const clock = intOf(ctx.vars, CLOCK, ctx.params);
    if (ctx.ret && clock) return `the clock stops: person ${k} holds all their tickets after ${ctx.vars[clock]} seconds`;
    const [pName, before] = leftOf(ctx.prev, ctx.params);
    if (left && before && lName === pName) {
      const d = changedIdx(left, before);
      if (d.length === 1 && left[d[0]] === before[d[0]] - 1) {
        const p = d[0];
        const who = p === k ? `person ${p} (person k)` : `person ${p}`;
        return `${who} buys a ticket: ${left[p] > 0 ? `${left[p]} still to buy` : 'all tickets bought'}`;
      }
    }
    const cName = intOf(ctx.vars, CLOCK, ctx.params);
    if (cName && cName in ctx.prev && ctx.vars[cName] !== ctx.prev[cName]) {
      const step = ctx.vars[cName] - ctx.prev[cName];
      return step === 1 ? `second ${ctx.vars[cName]} ends` : `${step} more seconds pass: the clock reads ${ctx.vars[cName]}`;
    }
    const line = lineOf(ctx.vars);
    const was = lineOf(ctx.prev);
    if (line && was && line.length === was.length + 1) {
      const p = line[line.length - 1];
      if (!clock || !(clock in ctx.prev)) return `person ${p} joins the line (${line.join(' → ')})`;
      return `person ${p} still needs ${left && left[p] !== undefined ? left[p] : 'more'}: back of the line (${line.join(' → ')})`;
    }
    const wName = intOf(ctx.vars, WHO, ctx.params);
    if (wName && line && was && line.length === was.length - 1) return `person ${ctx.vars[wName]} reaches the front of the line`;
    return null;
  },
  predict(ctx) {
    const [, kName] = ctx.params;
    const k = ctx.vars[kName];
    const nx = ctx.next.vars;
    const wName = intOf(ctx.vars, WHO, ctx.params);
    const cName = intOf(ctx.vars, CLOCK, ctx.params);
    const [, left] = leftOf(ctx.vars, ctx.params);
    // person k's second just ended: does the clock stop now?
    if (wName && cName && left && ctx.vars[wName] === k && cName in ctx.prev && ctx.vars[cName] === ctx.prev[cName] + 1) {
      const rest = left[k];
      const stops = !!ctx.next.ret;
      if (stops !== (rest === 0)) return null;
      return {
        question: `Person ${k} (person k) just bought a ticket at second ${ctx.vars[cName]}. Does the clock stop now?`,
        options: ['Yes: return the time', 'No: back of the line'],
        answer: stops ? 0 : 1,
        explain: stops ? `Person ${k} has all their tickets, so ${ctx.vars[cName]} seconds is the answer.` : `Person ${k} still needs ${rest} more, so they walk to the back and wait another round.`,
      };
    }
    // the line wraps round: who is at the front next?
    const line = lineOf(ctx.vars);
    if (wName && line && line.length > 1 && Number.isInteger(nx[wName]) && nx[wName] < ctx.vars[wName] && lineOf(nx)?.length === line.length - 1) {
      const right = nx[wName];
      const opts = [...new Set([right, ...line.slice(0, 4)])].slice(0, 4).sort((a, b) => a - b);
      if (opts.length < 2) return null;
      return {
        question: `Person ${ctx.vars[wName]} just walked to the back. Who steps up to the booth next?`,
        options: opts.map((p) => `person ${p}`),
        answer: opts.indexOf(right),
        explain: `The front of the line goes next: person ${right}, who came back round after buying a ticket last round.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Stop when anyone finishes',
      find: 'if (i === k && left[i] === 0) return time;',
      replace: 'if (left[i] === 0) return time;',
      explain: 'The clock stops as soon as any person holds all their tickets, even when that person is not k.',
    },
    {
      label: 'Finished people stay in line',
      find: 'if (left[i] > 0) q.enqueue(i);',
      replace: 'q.enqueue(i);',
      explain: 'People with no tickets left still walk to the back and take a second at the booth, so the time comes out too large.',
    },
  ],
};
