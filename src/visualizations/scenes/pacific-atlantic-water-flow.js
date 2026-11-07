// Pacific Atlantic Water Flow. Instead of pouring water downhill from every cell, each ocean climbs uphill from
// its own shore: a neighbour at least as high can drain into a cell that already reaches the ocean. Cells both
// climbs reach are the answer. Works with flat or 2-D visited arrays, Sets of "r,c", BFS or recursive DFS.
import { cellAt, row } from './util.js';

const SRC = [['r', 'c'], ['cr', 'cc'], ['i', 'j'], ['row', 'col'], ['x', 'y']];
const NB = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['nrow', 'ncol'], ['x', 'y'], ['a', 'b']];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pair = (vars, [a, b]) => (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) ? [vars[a], vars[b]] : null);
const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const OCEAN = { pac: 'Pacific', atl: 'Atlantic' };

// the cells a reach structure marks, as "r,c" keys (null when the value is not one)
function marked(v, R, C) {
  const out = new Set();
  if (isGrid(v) && v.length === R && v[0].length === C) v.forEach((x, r) => x.forEach((y, c) => y && out.add(`${r},${c}`)));
  else if ((row(v) && v.length === R * C) || (v && v.$array && v.$length === R * C)) {
    for (let i = 0; i < R * C; i++) if (cellAt(v, i)) out.add(`${Math.floor(i / C)},${i % C}`);
  } else if (v && v.$set) v.$set.forEach((k) => out.add(Number.isInteger(k) ? `${Math.floor(k / C)},${k % C}` : String(k).replace(/[^\d]+/g, ',')));
  else return null;
  return out;
}
// every reach structure in scope: { name, cells, ocean }
function reaches(vars, params, R, C) {
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || /start|queue|^q$|stack|res|ans|out|dirs/i.test(k) || !/pac|atl|seen|vis|reach|ocean|can|flow/i.test(k)) continue;
    const cells = marked(v, R, C);
    if (cells) out.push({ name: k, cells, ocean: /pac/i.test(k) ? 'Pacific' : /atl/i.test(k) ? 'Atlantic' : null, json: JSON.stringify(v) });
  }
  // a generic name (seen / visited) is the ocean whose named structure it equals, or the one its border starts show
  const starts = Object.entries(vars).find(([k, v]) => !params.includes(k) && /start|border|edge/i.test(k) && Array.isArray(v) && v.length > 0 && v.every((p) => Array.isArray(p)))?.[1];
  const byStart = starts && (starts.some((p) => p[0] === 0 && p[1] === 0) !== starts.some((p) => p[0] === R - 1 && p[1] === C - 1)) ? (starts.some((p) => p[0] === 0 && p[1] === 0) ? 'Pacific' : 'Atlantic') : null;
  for (const s of out) if (!s.ocean) s.ocean = out.find((o) => o.ocean && o.json === s.json && o.cells.size)?.ocean || byStart;
  return out;
}
function looking(vars) {
  for (const sp of SRC) {
    const src = pair(vars, sp);
    if (!src) continue;
    for (const np of NB) {
      const nb = pair(vars, np);
      if (np !== sp && nb && near(src, nb)) return { src, nb, nbNames: np };
    }
  }
  return null;
}
// recursive DFS: a call just arrived at (r, c) carrying the height it climbed from; is the cell added or does it return?
function dfsEntry(ctx, h, R, C) {
  const sp = SRC.find((p) => pair(ctx.vars, p));
  const cell = sp && pair(ctx.vars, sp), was = sp && pair(ctx.prev, sp);
  const hn = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && /prev|last|from|parent|^ph$|^h$|height/i.test(k) && Number.isInteger(ctx.vars[k]));
  if (!cell || !hn || (was && was[0] === cell[0] && was[1] === cell[1])) return null;
  const [r, c] = cell, p = ctx.vars[hn];
  if (r < 0 || r >= R || c < 0 || c >= C || p < 0) return null;
  const s = reaches(ctx.vars, ctx.params, R, C).find((x) => x.ocean && !x.cells.has(`${r},${c}`) && x.cells.size > 0);
  if (!s) return null;
  const n = reaches(ctx.next.vars, ctx.params, R, C).find((x) => x.name === s.name);
  let yes;
  if (n && n.cells.has(`${r},${c}`)) yes = true;
  else if (ctx.next.ret) yes = false;
  else return null;
  const a = h[r][c];
  return {
    question: `The climb toward the ${s.ocean} steps from a cell of height ${p} to ${at(cell)} (height ${a}). Is ${at(cell)} added?`,
    options: ['Yes: water can run down from it', 'No: the call returns'],
    answer: yes ? 0 : 1,
    explain: yes
      ? `${a} ≥ ${p} and ${at(cell)} was not reached yet: its water can run ${a === p ? 'across the flat' : 'down'} toward the ${s.ocean}.`
      : a < p ? `${a} < ${p}: water would have to run uphill, so the call returns.` : `${at(cell)} already reaches the ${s.ocean}, so the call returns without visiting it twice.`,
  };
}
const touches = (ocean, [r, c], R, C) => (ocean === 'Pacific' ? r === 0 || c === 0 : ocean === 'Atlantic' ? r === R - 1 || c === C - 1 : false);

export default {
  id: 'pacific-atlantic-water-flow',
  metaphor: 'Two oceans climbing up the hills',
  caption: 'Each ocean starts at its own shore (Pacific: top and left edges; Atlantic: bottom and right) and climbs to neighbours at least as high, since water could run down from them. Cells both oceans climb to drain into both.',
  narrate(ctx) {
    const h = ctx.vars[ctx.params[0]];
    if (!isGrid(h)) return null;
    const R = h.length, C = h[0].length;
    if (ctx.ret && Array.isArray(ctx.value) && ctx.value.every((p) => Array.isArray(p) && p.length === 2)) return `${ctx.value.length} cell${ctx.value.length === 1 ? '' : 's'} can send water to both oceans`;
    if (ctx.ret) {
      // a climb helper hands back its reach: say how far that ocean got
      const cells = marked(ctx.value, R, C);
      const s = cells && reaches(ctx.vars, ctx.params, R, C).find((x) => x.cells.size === cells.size);
      return cells ? `the ${s?.ocean || 'ocean'}'s climb is done: water from ${cells.size} of ${R * C} cells can reach it` : null;
    }
    // the answer list grew by one cell
    const res = Object.entries(ctx.vars).find(([k, v]) => /res|ans|out|both/i.test(k) && Array.isArray(v) && Array.isArray(ctx.prev[k]) && v.length === ctx.prev[k].length + 1);
    if (res) {
      const p = res[1][res[1].length - 1];
      if (Array.isArray(p) && Number.isInteger(h[p[0]]?.[p[1]])) return `${at(p)} (height ${h[p[0]][p[1]]}) was reached by both climbs: it drains into both oceans (${res[1].length} so far)`;
    }
    const now = reaches(ctx.vars, ctx.params, R, C);
    const before = reaches(ctx.prev, ctx.params, R, C);
    for (const s of now) {
      const b = before.find((x) => x.name === s.name);
      if (!b) {
        if (s.cells.size === 0 && s.ocean) return `the ${s.ocean} starts climbing from its shore: nothing reached yet`;
        continue;
      }
      const fresh = [...s.cells].filter((k) => !b.cells.has(k));
      if (fresh.length !== 1) continue;
      const cell = fresh[0].split(',').map(Number);
      const o = s.ocean ? `the ${s.ocean}` : 'this ocean';
      const l = looking(ctx.vars);
      if (l && l.nb[0] === cell[0] && l.nb[1] === cell[1] && s.cells.has(l.src.join(','))) {
        const [a, d] = [h[cell[0]][cell[1]], h[l.src[0]][l.src[1]]];
        return `${at(cell)} height ${a} ${a === d ? 'is level with' : 'is above'} ${at(l.src)} height ${d}: water runs from it down to ${o}`;
      }
      if (touches(s.ocean, cell, R, C)) return `${at(cell)} sits on the shore of ${o}: its water drains straight in`;
      return `${at(cell)} (height ${h[cell[0]][cell[1]]}) can drain into ${o} (${s.cells.size} cell${s.cells.size === 1 ? '' : 's'} so far)`;
    }
    // the climb steps onto the next cell from its queue
    const sp = SRC.find((p) => pair(ctx.vars, p));
    const src = sp && pair(ctx.vars, sp), was = sp && pair(ctx.prev, sp);
    const moved = ['head', 'front', 'qi', 'h', 'idx'].some((k) => Number.isInteger(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k]) || /shift\(|pop\(/.test(ctx.src || '');
    if (src && moved && (!was || was[0] !== src[0] || was[1] !== src[1]) && Number.isInteger(h[src[0]]?.[src[1]])) {
      return `stand on ${at(src)} (height ${h[src[0]][src[1]]}): which neighbours are at least as high?`;
    }
    return null;
  },
  // a neighbour was just picked: can its water run down into the cell the climb is standing on?
  predict(ctx) {
    if (!ctx.next) return null;
    const h = ctx.vars[ctx.params[0]];
    if (!isGrid(h)) return null;
    const R = h.length, C = h[0].length;
    const l = looking(ctx.vars);
    if (!l) return dfsEntry(ctx, h, R, C);
    const [r, c] = l.nb;
    if (r < 0 || r >= R || c < 0 || c >= C) return null;
    const was = pair(ctx.prev, l.nbNames);
    if (was && was[0] === r && was[1] === c) return null;
    const key = `${r},${c}`;
    const s = reaches(ctx.vars, ctx.params, R, C).find((x) => x.cells.has(l.src.join(',')) && !x.cells.has(key));
    if (!s) return null;
    const n = reaches(ctx.next.vars, ctx.params, R, C).find((x) => x.name === s.name);
    let yes;
    if (n && n.cells.has(key)) yes = true;
    else {
      const n2 = pair(ctx.next.vars, l.nbNames);
      const skip = /\bcontinue\b|\breturn\b/.test(ctx.lines[ctx.next.line - 1] || '') || !n2 || n2[0] !== r || n2[1] !== c;
      if (n && skip) yes = false;
      else return null;
    }
    const [a, d] = [h[r][c], h[l.src[0]][l.src[1]]];
    const o = s.ocean ? `the ${s.ocean}` : 'the ocean';
    return {
      question: `${at(l.src)} (height ${d}) already drains into ${o}. Its neighbour ${at(l.nb)} has height ${a}. Does the climb add ${at(l.nb)}?`,
      options: ['Yes: water can run down from it', 'No: it is lower, water cannot run uphill'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `${a} ≥ ${d}: water on ${at(l.nb)} can run ${a === d ? 'across the flat' : 'down'} into ${at(l.src)} and on to ${o}. Equal heights count.`
        : `${a} < ${d}: water on ${at(l.nb)} would have to run uphill to reach ${at(l.src)}, so this route does not work.`,
    };
  },
  bugs: [
    {
      label: 'Climb only to strictly higher cells (> instead of >=)',
      find: 'heights[nr][nc] < heights[r][c]',
      replace: 'heights[nr][nc] <= heights[r][c]',
      explain: 'Water also flows across equal heights. Skipping level neighbours cuts flat ridges and plateaus off from the ocean, so cells that drain into both are missed.',
    },
    {
      label: 'Atlantic forgets the bottom edge',
      find: 'atlStarts.push([R - 1, c]);',
      replace: '',
      explain: 'The Atlantic touches the bottom row too. Climbing only from the right edge misses cells whose water reaches the Atlantic through the bottom shore.',
    },
  ],
};
