// Making A Large Island. Pass 1 paints every island with its own number (2, 3, …) and writes down its size.
// Pass 2 tries each sea tile: filling it joins the DIFFERENT islands around it, 1 + their sizes. An island touching
// the tile from two sides must be counted once (a Set of island numbers). Works with a size array or Map.
import { entriesOf, firstInt, row } from './util.js';

const R = ['r', 'i', 'row'];
const C = ['c', 'j', 'col'];
const NR = ['nr', 'ni', 'nx', 'rr', 'x', 'a'];
const NC = ['nc', 'nj', 'ny', 'cc', 'y', 'b'];
const BEST = ['best', 'ans', 'res', 'result', 'max', 'largest', 'biggest'];
const TOTAL = ['total', 'sum', 'cur', 'joined', 'area', 'tot'];
const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v[0].length && r.length > 0);

/** island number → size, from a size array (size[id]) or a Map / object */
function sizesOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !/size|area|count|cnt/i.test(k)) continue;
    if (row(v) && v.every((x) => Number.isInteger(x))) return new Map(v.map((x, i) => [i, x]).filter(([i, x]) => i > 1 || x > 0));
    const e = entriesOf(v);
    if (e) return new Map(e.map(([a, b]) => [Number(a), b]));
  }
  return null;
}
const setOf = (vars) => Object.entries(vars || {}).find(([, v]) => v && v.$set)?.[1]?.$set;
const cellOf = (vars, rs, cs) => {
  const [rn, r] = firstInt(vars, rs);
  const [cn, c] = firstInt(vars, cs);
  return rn && cn ? [r, c] : null;
};

export default {
  id: 'making-a-large-island',
  metaphor: 'Number the islands, then fill one sea tile',
  caption: 'First every island is painted with its own number and its size is written down. Then each sea tile is tried: filling it joins the different islands around it into one, 1 + their sizes.',
  narrate(ctx) {
    const name = ctx.params[0];
    const g = ctx.vars[name];
    if (!ok(g)) return null;
    if (ctx.ret && Number.isInteger(ctx.value) && !ctx.next) return `the biggest island you can make with at most one filled tile: ${ctx.value} tiles`;
    const pg = ctx.prev[name];
    const sizes = sizesOf(ctx.vars, ctx.params);
    // pass 1: a land tile painted with its island number
    if (ok(pg) && pg.length === g.length) {
      const painted = [];
      g.forEach((r, i) => r.forEach((x, j) => pg[i][j] === 1 && x !== 1 && painted.push([i, j, x])));
      if (painted.length === 1) {
        const [i, j, id] = painted[0];
        const [kName, k] = firstInt(ctx.vars, ['count', 'cnt', 'area', 'sz']);
        return `(${i}, ${j}) joins island #${id}${kName && k > 0 ? ` (${k} tile${k === 1 ? '' : 's'} counted so far)` : ''}`;
      }
    }
    const before = sizesOf(ctx.prev, ctx.params);
    if (sizes && before) {
      const fresh = [...sizes].filter(([k, v]) => before.get(k) !== v && v > 0);
      if (fresh.length === 1) return `island #${fresh[0][0]} is complete: ${fresh[0][1]} tile${fresh[0][1] === 1 ? '' : 's'}`;
    }
    const ids = setOf(ctx.vars);
    const at = cellOf(ctx.vars, R, C);
    const [bName, best] = firstInt(ctx.vars, BEST.filter((k) => !ctx.params.includes(k)));
    const [tName, total] = firstInt(ctx.vars, TOTAL);
    if (bName && bName in ctx.prev && best !== ctx.prev[bName]) {
      if (tName && total === best && at) return `filling (${at[0]}, ${at[1]}) makes an island of ${best}: the new best`;
      return `an island of ${best} tiles is the biggest so far (the answer if no fill helps)`;
    }
    if (bName && tName && /max/i.test(ctx.src) && at) return `filling (${at[0]}, ${at[1]}) makes ${total}: not bigger than ${best}`;
    if (ids && at) {
      const was = setOf(ctx.prev);
      if (!was) return `try filling sea tile (${at[0]}, ${at[1]}): which islands touch it?`;
      const nb = cellOf(ctx.vars, NR, NC);
      if (ids.length > was.length) {
        const id = ids[ids.length - 1];
        return `(${at[0]}, ${at[1]}) touches island #${id}${sizes?.has(id) ? ` (${sizes.get(id)} tiles)` : ''}`;
      }
      if (/\.add\(/.test(ctx.src) && nb && ids.includes(g[nb[0]]?.[nb[1]])) return `(${nb[0]}, ${nb[1]}) is island #${g[nb[0]][nb[1]]} again: the set already holds it, so it counts once`;
      if (tName && tName in ctx.prev && total !== ctx.prev[tName] && sizes) {
        const add = total - ctx.prev[tName];
        const id = [...sizes].find(([k, v]) => v === add && ids.includes(k))?.[0];
        return `add ${id !== undefined ? `island #${id}: ` : ''}${add} tile${add === 1 ? '' : 's'} (total ${total})`;
      }
      if (tName && !(tName in ctx.prev) && total === 1) return `the filled tile itself counts 1; now add the islands it touches`;
    }
    return null;
  },
  // a neighbour of the sea tile is island land: is it added to the set again?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !/\.add\(/.test(ctx.lines[nx.line - 1] || '')) return null;
    const g = ctx.vars[ctx.params[0]];
    const ids = setOf(ctx.vars);
    const after = setOf(nx.vars);
    // the neighbour as the add step shows it (a for-of loop brings the new neighbour and the add in one step)
    const nb = cellOf(nx.vars, NR, NC);
    const at = cellOf(ctx.vars, R, C);
    if (!ok(g) || !ids || !after || !nb || !at || !ids.length) return null;
    const atn = cellOf(nx.vars, R, C);
    if (!atn || atn[0] !== at[0] || atn[1] !== at[1]) return null;
    const id = g[nb[0]]?.[nb[1]];
    if (!Number.isInteger(id) || id < 2) return null;
    // only sea tiles that touch one island from two sides: there the set really matters
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => g[at[0] + dr]?.[at[1] + dc]).filter((x) => Number.isInteger(x) && x > 1);
    if (new Set(around).size === around.length) return null;
    const grew = after.length > ids.length;
    if (grew !== !ids.includes(id)) return null;
    return {
      question: `Filling (${at[0]}, ${at[1]}): its neighbour (${nb[0]}, ${nb[1]}) is island #${id}. The set holds {${ids.join(', ')}}. Is #${id} added as a new island?`,
      options: [`Yes: #${id} joins the fill`, `No: #${id} is already counted`],
      answer: grew ? 0 : 1,
      explain: grew ? `#${id} is not in the set yet: it is a different island, so its size will be added.` : `#${id} touches the tile from another side too. It is one island, so the set keeps it once and its size is added once.`,
    };
  },
  bugs: [
    {
      label: 'A list instead of a set',
      find: 'const ids = new Set();',
      replace: 'const ids = []; ids.add = ids.push;',
      explain: 'An island touching the sea tile from two or more sides is added each time: a ring around one 0 counts 1 + 8 × 4 = 33 instead of 9.',
    },
    {
      label: 'No baseline: only fills count',
      find: 'best = Math.max(best, count);',
      replace: '',
      explain: 'A grid with no 0 has nothing to fill, so best stays 0. The biggest existing island must be the starting answer.',
    },
  ],
};
