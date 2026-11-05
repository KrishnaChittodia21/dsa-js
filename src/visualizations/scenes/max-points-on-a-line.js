// Max Points on a Line: stand on one point (the anchor) and sort every later point by the direction you see it in.
// Points that share a direction share a line with the anchor. Directions are reduced fractions (gcd, one sign) so
// (2, 4) and (-1, -2) get the same key. Reads any Map / object counter, i / j-like indexes, a string key, best.
import { entriesOf, firstInt, options } from './util.js';

const I = ['i', 'anchor', 'p', 'a'];
const J = ['j', 'k', 'q', 'b'];
const BEST = ['best', 'ans', 'res', 'result', 'max', 'maxPoints', 'answer'];
const isInt = Number.isInteger;
const pt = (p) => `(${p[0]}, ${p[1]})`;
const mapOf = (vars, params) => Object.entries(vars).filter(([k]) => !params.includes(k)).map(([k, v]) => [k, entriesOf(v)]).find(([, e]) => e);
const keyOf = (ctx) => Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && typeof ctx.vars[k] === 'string' && ctx.vars[k] !== ctx.prev[k]);

/** the main function's state: points, the anchor index and (maybe) the other point's index */
function state(ctx) {
  const pts = ctx.vars[ctx.params[0]];
  if (!Array.isArray(pts) || !pts.every((p) => Array.isArray(p) && p.length === 2)) return null;
  const [iName, i] = firstInt(ctx.vars, I);
  const [jName, j] = firstInt(ctx.vars, J);
  return { pts, iName, i: pts[i] ? i : undefined, jName, j: pts[j] && j !== i ? j : undefined };
}

export default {
  id: 'max-points-on-a-line',
  metaphor: 'Stand on a point, sort by direction',
  caption: 'Stand on one point and look at every later point: the ones you see in the same direction are on one line with you. Each direction is a reduced fraction dy/dx with one sign, so it has one spelling.',
  narrate(ctx) {
    const s = state(ctx);
    if (!s) return null;
    const best = BEST.find((k) => isInt(ctx.vars[k]));
    if (!ctx.next && /\breturn\b/.test(ctx.src || '') && isInt(ctx.result)) return s.pts.length <= 2 ? `with ${s.pts.length} point${s.pts.length === 1 ? '' : 's'}, one line always holds them all: ${ctx.result}` : `the best line holds ${ctx.result} points`;
    // right after the gcd helper returns: the common factor arrives
    const g = ['g', 'gcd', 'd', 'div', 'divisor'].find((k) => isInt(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k]);
    if (g && ctx.vars[g] > 1) return `dx and dy share the factor ${ctx.vars[g]}: divide both, so every point along this line gets one key`;
    // the previous step must be the main function too (not inside gcd)
    if (!(ctx.params[0] in ctx.prev)) return null;
    const m = mapOf(ctx.vars, ctx.params);
    const pm = mapOf(ctx.prev, ctx.params);
    const anchor = s.i !== undefined ? `point ${s.i} ${pt(s.pts[s.i])}` : 'the anchor';
    if (m && s.i !== undefined && s.iName && ctx.prev[s.iName] !== s.i && m[1].length === 0) return `stand on ${anchor} and sort the later points by direction`;
    if (m && pm && m[0] === pm[0] && m[1].length >= pm[1].length) {
      const ch = m[1].find(([k, v]) => !pm[1].some(([k2, v2]) => k2 === k && v2 === v));
      if (ch && isInt(ch[1])) return `${s.j !== undefined ? `point ${s.j} ${pt(s.pts[s.j])}` : 'this point'} is in direction ${ch[0]}: ${ch[1]} point${ch[1] > 1 ? 's' : ''} that way from ${anchor}`;
    }
    if (best && best in ctx.prev && ctx.vars[best] > ctx.prev[best]) return `${ctx.vars[best] - 1} point${ctx.vars[best] > 2 ? 's' : ''} in one direction from ${anchor}, plus the anchor: a line of ${ctx.vars[best]}`;
    const key = keyOf(ctx);
    // no count here: the prediction right after asks how many points this direction holds
    if (key) return `the direction, reduced and with one sign, is spelled "${ctx.vars[key]}"`;
    if (isInt(ctx.vars.dx) && ctx.vars.dx === -ctx.prev.dx && ctx.vars.dx !== 0 && s.jName && ctx.prev[s.jName] === s.j) return 'flip the signs: looking left along a line is the same line as looking right';
    if (isInt(ctx.vars.dy) && isInt(ctx.vars.dx) && !('dy' in ctx.prev) && s.j !== undefined && s.i !== undefined) return `${anchor} sees point ${s.j} ${pt(s.pts[s.j])}: ${ctx.vars.dx} across, ${ctx.vars.dy} up`;
    return null;
  },
  // the key for a point is on screen: how many points will that direction hold?
  predict(ctx) {
    const s = state(ctx);
    if (!s || !ctx.next || !(ctx.params[0] in ctx.prev)) return null;
    const key = keyOf(ctx);
    const m = mapOf(ctx.vars, ctx.params);
    if (!key || !m) return null;
    const K = ctx.vars[key];
    const had = m[1].find(([k]) => k === K)?.[1] ?? 0;
    // only a point that joins a direction already seen: the map lookup is the whole idea
    if (!isInt(had) || had < 1) return null;
    // the next step either writes the map or computes the new count
    const nm = mapOf(ctx.next.vars, ctx.params);
    const nowMap = nm && nm[0] === m[0] ? nm[1].find(([k]) => k === K)?.[1] : undefined;
    const changedInts = Object.keys(ctx.next.vars).filter((k) => isInt(ctx.next.vars[k]) && ctx.next.vars[k] !== ctx.vars[k]);
    const answer = isInt(nowMap) && nowMap !== had ? nowMap : changedInts.length === 1 && ctx.next.vars[changedInts[0]] === had + 1 ? had + 1 : undefined;
    if (answer === undefined) return null;
    const who = s.j !== undefined ? `Point ${s.j} ${pt(s.pts[s.j])}` : 'This point';
    return options(
      `${who} is in direction "${K}" from ${s.i !== undefined ? `point ${s.i} ${pt(s.pts[s.i])}` : 'the anchor'}. How many points will that direction hold?`,
      answer,
      [1, answer + 1, answer - 1, 2].filter((x) => x >= 1),
      had ? `"${K}" already held ${had}: this point lies on the same line through the anchor, so it is ${answer} now.` : `No earlier point was in direction "${K}", so it starts at ${answer}.`,
    );
  },
  bugs: [
    {
      label: 'Forget to count the anchor',
      find: 'best = Math.max(best, localBest + 1);',
      replace: 'best = Math.max(best, localBest);',
      explain: 'The map counts only the other points in each direction; the point you stand on is on that line too, so every answer comes out one short.',
    },
    {
      label: 'No sign normalisation',
      find: 'if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; } // one sign per direction',
      replace: '',
      explain: '(1, 2) and (-1, -2) point along the same line, but without flipping the signs they get the keys "2/1" and "-2/-1" and are counted apart.',
    },
  ],
};
