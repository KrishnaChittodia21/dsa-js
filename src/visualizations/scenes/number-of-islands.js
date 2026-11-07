// Number of Islands. A scan walks the map row by row; each land tile it finds that is still above water is a new
// island, and the whole island is then sunk (flooded) so it is never counted twice. Works with sinking the grid
// in place or with a separate visited grid / Set, and with a stack (DFS) or a queue (BFS).
import { itemsOf, row } from './util.js';

const SCAN = [['r', 'c'], ['i', 'j'], ['row', 'col'], ['y', 'x']];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pair = (vars, [a, b]) => (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) ? [vars[a], vars[b]] : null);

// the scan cell: the first scan-like pair in scope that is inside the grid
function scanOf(vars, g) {
  for (const p of SCAN) {
    const v = pair(vars, p);
    if (v && v[0] >= 0 && v[0] < g.length && v[1] >= 0 && v[1] < g[0].length) return { names: p, cell: v };
  }
  return null;
}
// the island counter: a small integer under a counter-like name (never a parameter)
const countName = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && /island|count|cnt|^ans$|^res|^num$|total/i.test(k) && Number.isInteger(vars[k]));
// cells that went from land to anything else in the grid, or turned true in a visited grid
function sunk(vars, prev, gName) {
  const out = [];
  const g = vars[gName], p = prev[gName];
  if (isGrid(g) && isGrid(p) && p.length === g.length) g.forEach((r, i) => r.forEach((x, j) => p[i][j] === '1' && x !== '1' && out.push([i, j])));
  for (const [k, v] of Object.entries(vars)) {
    if (!/vis|seen/i.test(k) || !isGrid(v) || !isGrid(prev[k]) || prev[k].length !== v.length) continue;
    v.forEach((r, i) => r.forEach((x, j) => x && !prev[k][i][j] && out.push([i, j])));
  }
  return out;
}
// the cell just taken off a stack / queue that shrank by one
function popped(vars, prev) {
  for (const [k, v] of Object.entries(vars)) {
    if (!/stack|queue|^q$|^st$|frontier/i.test(k)) continue;
    const now = itemsOf(v), was = itemsOf(prev[k]);
    if (!now || !was || now.length !== was.length - 1) continue;
    const s = JSON.stringify, kind = /stack|^st$/i.test(k) ? 'stack' : 'queue';
    if (s(now) === s(was.slice(0, -1)) && Array.isArray(was[was.length - 1])) return { cell: was[was.length - 1], kind };
    if (s(now) === s(was.slice(1)) && Array.isArray(was[0])) return { cell: was[0], kind };
  }
  return null;
}
const flooding = (vars) => Object.entries(vars).some(([k, v]) => /stack|queue|^q$|^st$|frontier/i.test(k) && itemsOf(v)?.length > 0);

export default {
  id: 'number-of-islands',
  metaphor: 'Sinking each island once you find it',
  caption: 'The scan walks the map row by row. Land it finds still above water is a new island; the whole island is then sunk (lit tiles turn to water) so no part of it is counted again.',
  narrate(ctx) {
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    if (!isGrid(g)) return null;
    const cName = countName(ctx.vars, ctx.params);
    const k = cName ? ctx.vars[cName] : null;
    if (ctx.ret && Number.isInteger(ctx.value)) return `the scan is done: ${ctx.value} island${ctx.value === 1 ? '' : 's'} found, every one sunk as soon as it was spotted`;
    const s = scanOf(ctx.vars, g);
    if (cName && Number.isInteger(ctx.prev[cName]) && k === ctx.prev[cName] + 1) {
      return `${s ? `land at ${at(s.cell)}` : 'land'} that has not sunk yet: island #${k}! Now sink every tile of it`;
    }
    const d = sunk(ctx.vars, ctx.prev, gName);
    if (d.length === 1) {
      const [r, c] = d[0];
      // a separate visited grid leaves the map unchanged: no "land left" count then
      const left = g[r][c] !== '1' ? g.reduce((n, x) => n + x.filter((y) => y === '1').length, 0) : null;
      return `${at(d[0])} sinks${k ? `: it is part of island #${k}` : ''}${left === null ? '' : ` (${left} land tile${left === 1 ? '' : 's'} left on the map)`}`;
    }
    const p = popped(ctx.vars, ctx.prev);
    if (p && p.cell.length >= 2) return `take ${at(p.cell)} off the ${p.kind}: look up, down, left and right for land`;
    if (s && !flooding(ctx.vars)) {
      const was = pair(ctx.prev, s.names);
      const [r, c] = s.cell;
      if (was && was[0] === r && was[1] === c) return null;
      if (ctx.input?.[0]?.[r]?.[c] === '1') return `the scan reaches ${at(s.cell)}, a land tile on the original map: is it still above water?`;
    }
    return null;
  },
  // at a scan cell that was land at the start: does it start a new island?
  predict(ctx) {
    if (!ctx.next) return null;
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    if (!isGrid(g) || flooding(ctx.vars)) return null;
    const s = scanOf(ctx.vars, g);
    const cName = countName(ctx.vars, ctx.params);
    if (!s || !cName) return null;
    const [r, c] = s.cell;
    const was = pair(ctx.prev, s.names);
    if ((was && was[0] === r && was[1] === c) || ctx.input?.[0]?.[r]?.[c] !== '1') return null;
    const nv = ctx.next.vars;
    const k = ctx.vars[cName];
    let yes;
    if (nv[cName] === k + 1) yes = true;
    else {
      const ns = isGrid(nv[gName]) ? scanOf(nv, nv[gName]) : null;
      if (nv[cName] === k && ns && (ns.cell[0] !== r || ns.cell[1] !== c)) yes = false;
      else return null;
    }
    return {
      question: `The scan reaches ${at(s.cell)}, which was land on the original map. Does it start a new island?`,
      options: ['Yes: count a new island', 'No: it already sank with an earlier island'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `${at(s.cell)} is still above water, so no earlier flood reached it: it is the first tile of island #${k + 1}.`
        : `${at(s.cell)} is connected to land counted before, so that island's flood already sank it; counting it again would count cells, not islands.`,
    };
  },
  bugs: [
    {
      label: "Compare with the number 1, not the string '1'",
      find: "if (grid[r][c] !== '1') continue;",
      replace: 'if (grid[r][c] !== 1) continue;',
      explain: "The map holds the strings '1' and '0'. '1' !== 1 is always true, so every tile looks like water and the answer is 0.",
    },
    {
      label: 'Sink the neighbours but never explore from them',
      find: 'stack.push([nr, nc]);',
      replace: '',
      explain: 'Only the tiles right next to the first one sink; the far side of the island stays above water and the scan counts it again as a new island.',
    },
  ],
};
