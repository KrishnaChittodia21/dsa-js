// Jump Game II: hops in rounds, like BFS levels. Hop 1 can land anywhere in the zone stone 0 reaches; while walking
// that zone we note the farthest stone the NEXT hop can reach. At the zone's edge we must hop: count it, and the
// new zone ends at that farthest stone. Works with jumps / count / res, curEnd / end / r and farthest / far / reach.
import { firstInt, options, row } from './util.js';

const AT = ['i', 'j', 'k', 'p', 'idx', 'pos'];
const JUMPS = ['jumps', 'jump', 'hops', 'count', 'cnt', 'steps', 'ans', 'res', 'result'];
const END = ['curEnd', 'currEnd', 'currentEnd', 'end', 'edge', 'boundary', 'limit', 'levelEnd', 'r', 'right', 'hi'];
const FAR = ['farthest', 'furthest', 'far', 'maxReach', 'reach', 'nextEnd', 'maxPos', 'best'];

/** { name: [varName, value] } for the roles, each name used once, parameters skipped */
function roles(ctx, vars) {
  const used = [...ctx.params];
  const out = {};
  for (const [role, names] of [['at', AT], ['jumps', JUMPS], ['end', END], ['far', FAR]]) {
    const pair = firstInt(Object.fromEntries(Object.entries(vars).filter(([k]) => !used.includes(k))), names);
    out[role] = pair;
    if (pair[0]) used.push(pair[0]);
  }
  return out;
}
const hop = (k) => `${k} hop${k === 1 ? '' : 's'}`;

export default {
  id: 'jump-game-ii',
  metaphor: 'Hops in rounds, each zone wider',
  caption: 'The bracket is the zone the hops so far can land in. Walking through it, we note the farthest stone the next hop could reach; at the zone’s edge we must hop, and the next zone ends at that farthest stone.',
  pointers: ['i', 'curEnd', 'farthest', 'end', 'far'],
  compare: 'jumps',
  narrate(ctx) {
    const a = row(ctx.vars[ctx.params[0]]);
    if (!a) return null;
    const last = a.length - 1;
    if (!ctx.next && Number.isInteger(ctx.result) && /return/.test(ctx.src || '')) {
      return ctx.result === 0 ? 'you already stand on the last stone: 0 hops' : `${hop(ctx.result)} reach the last stone (${last})`;
    }
    const { at: [iName, i], jumps: [jName, j], end: [eName, e], far: [fName, f] } = roles(ctx, ctx.vars);
    if (jName && jName in ctx.prev && j === ctx.prev[jName] + 1) {
      return `${Number.isInteger(i) && i === e ? `stone ${i} is the edge of the zone: ` : ''}we must hop, hop ${j} is counted`;
    }
    if (eName && eName in ctx.prev && e !== ctx.prev[eName]) {
      const k = Number.isInteger(j) ? (ctx.next?.vars[jName] === j + 1 ? j + 1 : j) : null; // some code counts the hop after moving the edge
      return `${k ? `hop ${k}` : 'the next hop'} can land anywhere up to stone ${e}${e >= last ? ': the last stone is covered' : ''}`;
    }
    if (fName && iName && Number.isInteger(i) && i >= 0 && i <= last && (f !== ctx.prev[fName] || i !== ctx.prev[iName])) {
      const grew = fName in ctx.prev && f > ctx.prev[fName];
      return `stone ${i} (jump up to ${a[i]}) reaches stone ${i + a[i]}: the next hop can go as far as ${f}${grew ? '' : ' (no farther than before)'}`;
    }
    return null;
  },
  // after a stone is scanned: is a hop counted now? and after a hop: where does its zone end?
  predict(ctx) {
    if (!ctx.next) return null;
    const a = row(ctx.vars[ctx.params[0]]);
    if (!a) return null;
    const { at: [iName, i], jumps: [jName, j], end: [eName, e], far: [fName, f] } = roles(ctx, ctx.vars);
    if (!jName || !eName || !fName || !Number.isInteger(i)) return null;
    const nx = ctx.next.vars;
    if (j === ctx.prev[jName] + 1 && Number.isInteger(nx[eName]) && nx[eName] !== e) {
      const ne = nx[eName];
      return options(`Hop ${j} is counted at stone ${i}. The zone so far ended at ${e}; the farthest seen is ${f}. Where does the new zone end?`, ne, [f, e + 1, i + a[i], e + a[e] || 0].filter((x) => x !== ne), ne === f ? `The new hop can land on any stone up to the farthest one seen so far, ${f}.` : `This code sets the new zone end to ${ne}.`);
    }
    if (i > 0 && i === nx[iName] && nx[jName] === j + 1) {
      return yesNo(i, e, true);
    }
    if (i > 0 && Number.isInteger(nx[iName]) && nx[iName] !== i && ctx.next.line === ctx.line && nx[jName] === j) {
      return yesNo(i, e, false);
    }
    return null;
  },
  bugs: [
    {
      label: 'Loop runs onto the last stone',
      find: 'i < nums.length - 1',
      replace: 'i < nums.length',
      explain: 'Standing on the last stone you never jump again, but when it is exactly a zone edge the loop counts one more hop (example 1 gives 3, not 2).',
    },
  ],
};

function yesNo(i, e, yes) {
  return {
    question: `Stone ${i} is scanned; the current zone ends at stone ${e}. Is a new hop counted now?`,
    options: ['Yes', 'No'],
    answer: yes ? 0 : 1,
    explain: yes ? `Stone ${i} is the zone’s edge: to go any farther we must hop.` : `Stone ${i} is still inside the zone (edge ${e}): keep scanning, no hop yet.`,
  };
}
