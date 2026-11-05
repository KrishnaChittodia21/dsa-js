// Gas Station: a road trip around a ring of stations. The tank counts fuel since the current candidate start; when it
// goes below zero, no station from that start up to here can work, so the next station becomes the candidate.
// Works with tank / cur / fuel and start / begin / ans; a separate whole-lap balance is narrated when there is one.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'k', 'idx', 'station', 'st'];
const TANK = ['tank', 'cur', 'curr', 'current', 'fuel', 'gasLeft', 'left', 'balance', 'curSum', 'currSum', 'running'];
const START = ['start', 'begin', 'candidate', 'startIdx', 'startIndex', 'ans', 'res', 'idx', 's'];
const TOTAL = ['total', 'totalSum', 'sum', 'net', 'surplus', 'totalTank', 'overall'];

/** [name, value] of the first integer name that is not a parameter and not `skip` */
const pick = (ctx, vars, names, skip = []) => firstInt(Object.fromEntries(Object.entries(vars).filter(([k]) => !ctx.params.includes(k) && !skip.includes(k))), names);

export default {
  id: 'gas-station',
  metaphor: 'A road trip around a ring of stations',
  caption: 'Each cell is a station: fill up gas[i], then pay cost[i] to drive to the next. The tank counts fuel since the current start; once it runs dry, every start up to here fails, so the next station becomes the start.',
  pointers: ['i', 'start'],
  compare: 'start',
  narrate(ctx) {
    const [gName, cName] = ctx.params;
    const gas = row(ctx.vars[gName]);
    const cost = row(ctx.vars[cName]);
    const [iName, i] = pick(ctx, ctx.vars, AT);
    const [sName, s] = pick(ctx, ctx.vars, START, [iName]);
    const [tName, t] = pick(ctx, ctx.vars, TANK, [iName, sName]);
    const [oName, o] = pick(ctx, ctx.vars, TOTAL, [iName, sName, tName]);
    if (ctx.next === undefined && ctx.result !== undefined && /return/.test(ctx.src || '')) {
      if (ctx.result === -1) return `the whole lap needs more fuel than all the stations give: no start works (-1)`;
      return Number.isInteger(ctx.result) ? `a full lap from station ${ctx.result} works: the answer is ${ctx.result}` : null;
    }
    if (sName && sName in ctx.prev && s !== ctx.prev[sName]) {
      const last = Number.isInteger(i) ? i : s - 1;
      const which = last === ctx.prev[sName] ? `station ${last} cannot be the start` : `no start from station ${ctx.prev[sName]} up to ${last} can make it`;
      return `ran dry: ${which}, try station ${s}`;
    }
    if (tName && tName in ctx.prev && t !== ctx.prev[tName]) {
      if (t === 0 && ctx.prev[tName] < 0) return `empty the tank: count fuel again from the next station`;
      const from = sName ? ` (since station ${s})` : '';
      return `tank${from}: ${ctx.prev[tName]} → ${t}${t < 0 ? ', below zero: the car stalls before the next station' : ''}`;
    }
    if (oName && oName in ctx.prev && o !== ctx.prev[oName]) return `whole-lap balance (all stations so far): ${o}`;
    if (gas && cost && iName && i !== ctx.prev[iName] && i >= 0 && i < gas.length) {
      const d = gas[i] - cost[i];
      return `station ${i}: fill ${gas[i]}, the road to station ${(i + 1) % gas.length} costs ${cost[i]} (net ${d >= 0 ? '+' : ''}${d})`;
    }
    return null;
  },
  // the first time the tank runs dry: which station is the new start? and before the return: what comes out?
  predict(ctx) {
    if (!ctx.next) return null;
    const [iName, i] = pick(ctx, ctx.vars, AT);
    const [sName, s] = pick(ctx, ctx.vars, START, [iName]);
    const [tName, t] = pick(ctx, ctx.vars, TANK, [iName, sName]);
    const nx = ctx.next.vars;
    if (sName && tName && Number.isInteger(i) && t < 0 && s === 0 && Number.isInteger(nx[sName]) && nx[sName] !== s) {
      return options(`The tank went to ${t} after the road from station ${i}, starting at station ${s}. Which station is the new start?`, nx[sName], [i, i + 1, s + 1, i + 2].filter((x) => x !== nx[sName] && x >= 0), nx[sName] === i + 1 ? `Every start from ${s} to ${i} arrives at station ${i} with no more fuel than this run had, so they all stall too: try ${i + 1}.` : `This code moves the start to ${nx[sName]}.`);
    }
    if (ctx.next.ret && Number.isInteger(ctx.result) && /return/.test(ctx.lines[ctx.next.line - 1] || '')) {
      const [oName, o] = pick(ctx, ctx.vars, TOTAL, [iName, sName, tName]);
      const wrong = [-1, s, 0].filter((x) => Number.isInteger(x) && x !== ctx.result);
      const why = oName && Number.isInteger(o) ? `The whole lap nets ${o}${o >= 0 ? `, enough fuel, so the start ${s ?? ctx.result} works` : ', less than zero, so no start can finish'}.` : `This run returns ${ctx.result}.`;
      return options('The sweep is done. What does the run return?', ctx.result, wrong, why);
    }
    return null;
  },
  bugs: [
    {
      label: 'New start at i instead of i + 1',
      find: 'start = i + 1;',
      replace: 'start = i;',
      explain: 'The station where the tank ran dry is itself a bad start (it leads into the deficit), but the run tries it again and can return it.',
    },
    {
      label: 'No whole-lap check',
      find: 'return total >= 0 ? start : -1;',
      replace: 'return start;',
      explain: 'The sweep always ends with some candidate start, even when all the stations together give less fuel than the lap costs (example 2 should be -1).',
    },
  ],
};
