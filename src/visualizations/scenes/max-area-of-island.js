// Max Area of Island. Flood each island from its first tile: every land tile the flood reaches is sunk (turned to
// water, or marked visited) and counted once; the biggest count wins. Works with sinking the grid or a visited
// grid / Set of "r,c", recursive DFS or an explicit stack / queue.
import { firstInt, row } from './util.js';

const R = ['r', 'i', 'row', 'y', 'cr', 'rr', 'nr'];
const C = ['c', 'j', 'col', 'x', 'cc', 'nc'];
const BEST = ['best', 'max', 'maxArea', 'maxarea', 'ans', 'res', 'result', 'largest', 'biggest', 'most'];
const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v[0].length && r.length > 0);

function gridOf(vars, name) {
  if (ok(vars[name])) return [name, vars[name]];
  return Object.entries(vars || {}).find(([k, v]) => !/visit|seen|vis/i.test(k) && ok(v)) || [];
}
const at = (vars) => {
  const rn = R.find((k) => Number.isInteger(vars[k]));
  const cn = C.find((k) => Number.isInteger(vars[k]));
  return rn && cn ? [vars[rn], vars[cn]] : null;
};
/** "done" tiles: land of the input that is sunk in the grid or marked in a visited grid / Set */
function doneSet(vars, name, input) {
  const out = new Set();
  const [, g] = gridOf(vars, name);
  const vis = Object.entries(vars || {}).find(([k]) => /visit|seen|^vis$/i.test(k))?.[1];
  input.forEach((r, i) =>
    r.forEach((x, j) => {
      if (x !== 1) return;
      if (g && g[i]?.[j] !== 1) out.add(`${i},${j}`);
      else if (Array.isArray(vis) && vis[i]?.[j]) out.add(`${i},${j}`);
      else if (vis?.$set && (vis.$set.includes(`${i},${j}`) || vis.$set.includes(i * r.length + j))) out.add(`${i},${j}`);
    }),
  );
  return out;
}
/** the island of the input that holds (r, c), as "r,c" keys */
function island(input, r, c) {
  const out = new Set();
  const todo = [[r, c]];
  while (todo.length) {
    const [i, j] = todo.pop();
    if (input[i]?.[j] !== 1 || out.has(`${i},${j}`)) continue;
    out.add(`${i},${j}`);
    todo.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
  }
  return out;
}

export default {
  id: 'max-area-of-island',
  metaphor: 'Sinking islands while counting tiles',
  caption: 'The scan walks the map; on new land it floods the whole island, sinking each tile as it counts it so no tile is counted twice. The biggest count is the answer.',
  narrate(ctx) {
    const input = ctx.input?.[0];
    if (!ok(input)) return null;
    const name = ctx.params[0];
    const [bName, best] = firstInt(ctx.vars, BEST.filter((k) => !ctx.params.includes(k)));
    if (ctx.ret && Number.isInteger(ctx.value) && !ctx.next) return `every island has been flooded: the biggest covers ${ctx.value} tile${ctx.value === 1 ? '' : 's'}`;
    const p = at(ctx.vars);
    if (ctx.ret && ctx.value === 0 && p) {
      const [r, c] = p;
      if (r < 0 || c < 0 || r >= input.length || c >= input[0].length) return `(${r}, ${c}) is off the map: it adds 0`;
      if (input[r][c] !== 1) return `(${r}, ${c}) is water: it adds 0`;
      return `(${r}, ${c}) was already sunk: it adds 0, so no tile is counted twice`;
    }
    if (ctx.ret && Number.isInteger(ctx.value) && ctx.value > 0 && p) return `(${p[0]}, ${p[1]}) reports ${ctx.value}: itself plus what the flood found beyond it`;
    const done = doneSet(ctx.vars, name, input);
    const before = doneSet(ctx.prev, name, input);
    const fresh = [...done].filter((k) => !before.has(k));
    if (fresh.length === 1 && Object.keys(ctx.prev).length) {
      const [r, c] = fresh[0].split(',').map(Number);
      const isl = island(input, r, c);
      const k = [...isl].filter((x) => done.has(x)).length;
      const [, g] = gridOf(ctx.vars, name);
      return `(${r}, ${c}) is land: ${g?.[r]?.[c] === 1 ? 'mark it visited' : 'sink it'} and count it (tile ${k} of this island)`;
    }
    if (bName && bName in ctx.prev && /max/i.test(ctx.src)) {
      if (best !== ctx.prev[bName]) return `that island is the biggest so far: best = ${best}`;
      // an \`if (land) best = max(…)\` line also records on plain scan steps: only a line of its own is a verdict
      if (!/^\s*(if|for|while)\b/.test(ctx.src)) return `that island is not bigger: best stays ${best}`;
    }
    return null;
  },
  // the flood steps onto a cell: land, water, or already sunk? (recursive floods with a `return 0` guard)
  predict(ctx) {
    const nx = ctx.next;
    const input = ctx.input?.[0];
    if (!nx || !ok(input) || !/return\s+0\b/.test(ctx.lines[nx.line - 1] || '')) return null;
    const p = at(nx.vars);
    const here = at(ctx.vars);
    if (!p || (here && here[0] === p[0] && here[1] === p[1])) return null;
    const [r, c] = p;
    if (r < 0 || c < 0 || r >= input.length || c >= input[0].length) return null;
    const [, g] = gridOf(ctx.vars, ctx.params[0]);
    let ans;
    if (nx.ret && nx.value === 0) {
      // water next to a one-tile island is not worth a question
      const big = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].some(([i, j]) => island(input, i, j).size > 1);
      if (input[r][c] === 1) ans = 2;
      else if (big) ans = 1;
      else return null;
    } else if (!nx.ret && g && g[r]?.[c] === 1) {
      // only mid-flood: the first tile of an island is obvious
      const done = doneSet(ctx.vars, ctx.params[0], input);
      if (![...island(input, r, c)].some((k) => done.has(k))) return null;
      ans = 0;
    } else return null;
    return {
      question: `The flood reaches (${r}, ${c}). What does it find?`,
      options: ['Land: sink it and count 1', 'Water: it adds 0', 'Land already sunk: it adds 0'],
      answer: ans,
      explain: ['(r, c) is still land: it is sunk now and counted once.', `(r, c) was water from the start.`, `(r, c) was land, but the flood already sank it earlier: sinking is what stops it being counted twice.`][ans].replace('(r, c)', `(${r}, ${c})`),
    };
  },
  bugs: [
    {
      label: 'Count islands, not tiles',
      find: 'best = Math.max(best, area(r, c))',
      replace: 'best = (area(r, c), best + 1)',
      explain: 'Each island adds 1 however big it is, so the answer is the number of islands: three islands of 1, 1 and 4 tiles give 3, not 4.',
    },
    {
      label: 'Start best at -1',
      find: 'let best = 0;',
      replace: 'let best = -1;',
      explain: 'A map with no land never updates best, so it returns -1 instead of 0.',
    },
  ],
};
