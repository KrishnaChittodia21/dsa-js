// Brick Wall (count edge positions in a hash map). Walk each row left to right, mark where its cracks are; the
// position shared by the most rows is where the line goes, and it cuts through every other row.
import { entriesOf, options } from './util.js';

const POS = ['pos', 'sum', 'edge', 'x', 'prefix', 'cur', 'curr', 'width', 'position', 'acc', 'w', 'at'];
const MAX = ['maxEdges', 'max', 'best', 'most', 'maxCount', 'maxFreq', 'mx', 'maxCracks', 'maxGaps'];
const mapOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && entriesOf(v));
const intOf = (vars, names, params) => names.find((k) => !params.includes(k) && Number.isInteger(vars[k]));
const countAt = (es, key) => es.find(([k]) => Number(k) === key)?.[1] ?? 0;
const plural = (n) => `${n} row${n === 1 ? '' : 's'}`;

export default {
  id: 'brick-wall',
  metaphor: 'Find the crack most rows share',
  caption: 'Each row marks where its cracks are (bricks added up from the left; the right edge does not count). The line goes down the crack most rows share and cuts only the other rows.',
  compare: 'maxEdges',
  narrate(ctx) {
    const [wName] = ctx.params;
    const wall = ctx.vars[wName];
    const rows = Array.isArray(wall) ? wall.length : null;
    const m = mapOf(ctx.vars, ctx.params);
    const was = m && entriesOf(ctx.prev[m[0]]);
    if (m && was) {
      const ch = entriesOf(m[1]).find(([k, v]) => !was.some(([k2, v2]) => k2 === k && v2 === v));
      if (ch) return `a crack at x = ${ch[0]}: ${ch[1] === 1 ? 'the first row with a crack there' : `${plural(ch[1])} have a crack there now`}`;
    }
    const mx = intOf(ctx.vars, MAX, ctx.params);
    if (mx && Number.isInteger(ctx.prev[mx]) && ctx.vars[mx] > ctx.prev[mx]) {
      return `new best crack: ${plural(ctx.vars[mx])} ${ctx.vars[mx] === 1 ? 'has' : 'share'} it${rows ? `, so a line there cuts ${rows - ctx.vars[mx]} brick${rows - ctx.vars[mx] === 1 ? '' : 's'}` : ''}`;
    }
    const same = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);
    const row = Array.isArray(wall) && Object.entries(ctx.vars).find(([k, v]) => k !== wName && Array.isArray(v) && wall.some((r) => same(r, v)));
    const p = intOf(ctx.vars, POS, ctx.params);
    const fresh = row && (!same(ctx.prev[row[0]], row[1]) || (p && ctx.vars[p] === 0 && ctx.prev[p] > 0));
    if (fresh) {
      if (row[1].length === 1) return `next row [${row[1].join(', ')}]: one brick, no inner crack`;
      return `next row [${row[1].join(', ')}]: add up its bricks from the left (the last edge is the wall's side)`;
    }
    if (p && ctx.vars[p] > 0 && ctx.vars[p] !== ctx.prev[p]) return `the bricks so far reach x = ${ctx.vars[p]}: this row has a crack there`;
    if (ctx.next?.ret && rows !== null && mx && ctx.result === rows - ctx.vars[mx]) {
      return `the best crack is shared by ${plural(ctx.vars[mx])} of ${rows}`;
    }
    return null;
  },
  // before a crack is counted: how many rows share it now? · at the end: how many bricks does the line cut?
  predict(ctx) {
    if (!ctx.next) return null;
    const [wName] = ctx.params;
    const wall = ctx.vars[wName];
    const rows = Array.isArray(wall) ? wall.length : null;
    const m = mapOf(ctx.vars, ctx.params);
    const mx = intOf(ctx.vars, MAX, ctx.params);
    if (ctx.next.ret && rows !== null && mx && Number.isInteger(ctx.result)) {
      const best = ctx.vars[mx];
      return options(
        `${plural(best)} of ${rows} share the busiest crack. How many bricks does the best line cut?`,
        ctx.result,
        [best, rows, rows - best + 1, 0].filter((x) => x !== ctx.result),
        `It passes through a crack in ${plural(best)} and cuts a brick in each other row: ${rows} − ${best} = ${rows - best}.`,
      );
    }
    if (!m) return null;
    const es = entriesOf(m[1]);
    const after = entriesOf(ctx.next.vars[m[0]]);
    const p = intOf(ctx.vars, POS, ctx.params);
    if (!after) return null;
    let key;
    let answer;
    const ch = after.find(([k, v]) => !es.some(([k2, v2]) => k2 === k && v2 === v));
    if (ch) {
      // the map is written next: skip when this step already shows the new count in a variable
      [key, answer] = [Number(ch[0]), ch[1]];
      const shown = Object.keys(ctx.vars).some((k) => k !== p && !ctx.params.includes(k) && ctx.vars[k] === answer && ctx.vars[k] !== ctx.prev[k]);
      if (shown) return null;
    } else if (p && ctx.vars[p] !== ctx.prev[p]) {
      // the count is computed into a variable first (c = old count + 1)
      key = ctx.vars[p];
      const fresh = Object.keys(ctx.next.vars).find((k) => k !== p && k !== mx && !ctx.params.includes(k) && Number.isInteger(ctx.next.vars[k]) && ctx.next.vars[k] !== ctx.vars[k]);
      if (!fresh || ctx.next.vars[fresh] !== countAt(es, key) + 1) return null;
      answer = ctx.next.vars[fresh];
    } else return null;
    // only the cracks that become the new busiest one (and at least 3 rows), so the final question still fits
    if (answer < 3 || (mx && answer <= ctx.vars[mx]) || !Number.isFinite(key)) return null;
    const before = countAt(es, key);
    return options(
      `This row has a crack at x = ${key}. The tally there says ${before}. How many rows have a crack at x = ${key} now?`,
      answer,
      [before, answer + 1, 1].filter((x) => x !== answer),
      `Every row with a crack at x = ${key} adds one: ${before} + 1 = ${answer}.`,
    );
  },
  bugs: [
    {
      label: 'Count the right edge too',
      find: 'i < row.length - 1',
      replace: 'i < row.length',
      explain: 'Every row ends at the wall\'s right side, so that "crack" is shared by all rows and the answer becomes 0: a line on the wall\'s edge is not allowed.',
    },
    {
      label: 'Return the busiest crack count',
      find: 'return wall.length - maxEdges;',
      replace: 'return maxEdges;',
      explain: 'maxEdges counts the rows the line slips through; the question asks for the rows it cuts, which is all the others.',
    },
  ],
};
