// Longest Increasing Path in a Matrix. Two common shapes, both narrated:
//   - Kahn layers (the reference): a cell waits on its strictly lower neighbours; each round climbs one layer,
//     and the number of layers is the answer (indeg / layer / length).
//   - DFS + memo: memo[r][c] = 1 + the best memo among strictly higher neighbours (memo / dp / cache).
import { changedIdx, options, row } from './util.js';

/** how many of cell id's four neighbours are strictly higher */
function higher(M, id) {
  const C = M[0].length;
  const r = Math.floor(id / C);
  const c = id % C;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => M[r + dr] && typeof M[r + dr][c + dc] === 'number' && M[r + dr][c + dc] > M[r][c]).length;
}

const isInts = (v) => !!row(v) && v.length > 0 && v.every((x) => Number.isInteger(x));
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0);
// a cell table, flat (id = r * C + c) or as rows
const flat = (v) => (isInts(v) ? v : isGrid(v) && v.every(isInts) ? v.flat() : null);
const findName = (ctx, vars, re) => Object.keys(vars).find((k) => !ctx.params.includes(k) && re.test(k) && flat(vars[k]));
const DEG = /indeg|in_?deg|^deg|lower|smaller|wait|need|cnt/i;
const MEMO = /memo|^dp$|cache|^best$|^len|^f$|climb/i;
const COUNT = ['length', 'len', 'level', 'levels', 'layers', 'steps', 'depth', 'ans', 'res', 'result', 'height'];
const LAYER = /layer|queue|^q$|^cur|frontier|level|bfs/i;

export default {
  id: 'longest-increasing-path-in-a-matrix',
  metaphor: 'Water rising over a terrain, step by step',
  caption: 'Only strictly higher neighbours continue a path. The lowest cells go under first; each round floods the cells whose lower neighbours are all under. The number of rounds is the longest climb.',
  narrate(ctx) {
    const [mName] = ctx.params;
    const M = ctx.vars[mName];
    if (!isGrid(M)) return null;
    const C = M[0].length;
    const cell = (id) => `(${Math.floor(id / C)},${id % C})=${M[Math.floor(id / C)]?.[id % C]}`;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the longest strictly rising path has ${ctx.value} cell${ctx.value === 1 ? '' : 's'}`;
    // DFS + memo: a cell learns its longest climb
    const memoName = findName(ctx, ctx.vars, MEMO);
    if (memoName && flat(ctx.prev[memoName])?.length === flat(ctx.vars[memoName]).length) {
      const now = flat(ctx.vars[memoName]);
      const ch = changedIdx(now, flat(ctx.prev[memoName]));
      if (ch.length === 1 && now[ch[0]] > 0) {
        const v = now[ch[0]];
        return higher(M, ch[0]) ? `from ${cell(ch[0])} the longest climb is ${v} cell${v === 1 ? '' : 's'}: 1 + the best higher neighbour` : `${cell(ch[0])} has no higher neighbour: its climb is just itself (${v})`;
      }
    }
    if (memoName && ctx.ret && new RegExp(`${memoName}\\[`).test(ctx.src) && Number.isInteger(ctx.value)) return `this cell was solved before: reuse its climb of ${ctx.value} instead of exploring again`;
    // Kahn layers
    const dName = findName(ctx, ctx.vars, DEG);
    if (dName && flat(ctx.prev[dName])?.length === flat(ctx.vars[dName]).length) {
      const now = flat(ctx.vars[dName]);
      const before = flat(ctx.prev[dName]);
      const ch = changedIdx(now, before);
      if (ch.length === 1) {
        const id = ch[0];
        if (now[id] > before[id]) return `${cell(id)} has a lower neighbour: it waits on ${now[id]} cell${now[id] === 1 ? '' : 's'} before it can flood`;
        return now[id] === 0 ? `${cell(id)}: its last lower neighbour is under water, so it floods in the next round` : `${cell(id)}: one lower neighbour is under, ${now[id]} still to go`;
      }
    }
    const cName = COUNT.find((k) => Number.isInteger(ctx.vars[k]) && Number.isInteger(ctx.prev[k]) && ctx.vars[k] === ctx.prev[k] + 1);
    const lName = Object.keys(ctx.vars).find((k) => LAYER.test(k) && isInts(ctx.vars[k]));
    if (cName && lName && dName) {
      const layer = ctx.vars[lName];
      return `round ${ctx.vars[cName]}: ${layer.map(cell).join(', ')} flood${layer.length === 1 ? 's' : ''}; a climb can now be ${ctx.vars[cName]} cell${ctx.vars[cName] === 1 ? '' : 's'} long`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [mName] = ctx.params;
    const M = ctx.vars[mName];
    if (!isGrid(M)) return null;
    const C = M[0].length;
    const cell = (id) => `(${Math.floor(id / C)},${id % C}) = ${M[Math.floor(id / C)]?.[id % C]}`;
    // DFS + memo: before a cell saves its climb, how long is it?
    const memoName = findName(ctx, ctx.vars, MEMO);
    if (memoName) {
      const now = flat(ctx.vars[memoName]);
      const nx = flat(ctx.next.vars[memoName]);
      if (!nx || nx.length !== now.length) return null;
      const ch = changedIdx(nx, now);
      // a peak (no higher neighbour) is always 1: not worth a question
      if (ch.length !== 1 || !(nx[ch[0]] > 0) || now[ch[0]] > 0 || !higher(M, ch[0])) return null;
      const v = nx[ch[0]];
      return options(
        `${cell(ch[0])} is about to save its longest climb (higher neighbours already know theirs). How many cells?`,
        v,
        [v + 1, v - 1, 1, v + 2].filter((x) => x >= 1 && x !== v),
        `1 for the cell itself plus the best saved climb among its strictly higher neighbours: ${v}.`,
      );
    }
    // Kahn: before a waiting count drops, does that cell flood next round?
    const dName = findName(ctx, ctx.vars, DEG);
    const d = dName && flat(ctx.vars[dName]);
    const nd = dName && flat(ctx.next.vars[dName]);
    if (!d || !nd || d.length !== nd.length) return null;
    const ch = changedIdx(nd, d);
    if (ch.length !== 1 || nd[ch[0]] !== d[ch[0]] - 1) return null;
    const id = ch[0];
    return {
      question: `A lower neighbour of ${cell(id)} just went under (it waited on ${d[id]}). Does ${cell(id)} flood in the next round?`,
      options: ['Yes: no lower neighbour left above water', 'No: it still waits on another lower cell'],
      answer: nd[id] === 0 ? 0 : 1,
      explain: nd[id] === 0 ? `Its count drops to 0: every strictly lower neighbour is under, so it joins the next layer.` : `Its count drops ${d[id]} → ${nd[id]}: a lower neighbour is still above water.`,
    };
  },
  bugs: [
    {
      label: 'Treat equal neighbours as a step up',
      find: 'matrix[nr][nc] <= matrix[r][c]',
      replace: 'matrix[nr][nc] < matrix[r][c]',
      explain: 'The path must rise strictly. Letting equal neighbours count as a step lowers their waiting counts by mistake, so cells flood too early or never, and the count of rounds goes wrong.',
    },
    {
      label: 'Count a layer before checking it',
      find: 'let length = 0;',
      replace: 'let length = 1;',
      explain: 'The counter starts at one round already climbed, so every answer is one cell too long.',
    },
  ],
};
