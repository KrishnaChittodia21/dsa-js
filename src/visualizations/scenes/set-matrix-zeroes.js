// Set Matrix Zeroes. Every 0 is a little bomb that wipes its whole row and column, but only after the scan: first
// each 0 plants a flag on the edge (left cell of its row, top cell of its column), then flagged rows and columns are
// wiped. Works with the O(1) edge-flag solution and with row / column sets or boolean arrays.
import { row } from './util.js';

const R = ['r', 'i', 'row', 'y'];
const C = ['c', 'j', 'col', 'x'];

// the grid: the parameter, else the first array of equal-length rows in scope
function gridOf(vars, name) {
  const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v[0].length && r.length > 0);
  if (ok(vars[name])) return [name, vars[name]];
  return Object.entries(vars).find(([, v]) => ok(v)) || [];
}
function diff(a, b) {
  if (!Array.isArray(b) || b.length !== a.length || !b.every((r, i) => row(r) && r.length === a[i].length)) return null;
  const out = [];
  a.forEach((r, i) => r.forEach((x, j) => x !== b[i][j] && out.push([i, j])));
  return out;
}
const cellAt = (vars, g) => {
  const rn = R.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < g.length);
  const cn = C.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < g[0].length);
  return rn && cn ? [vars[rn], vars[cn]] : null;
};

// why (r, c) was wiped: a row / column set or flag array, else the edge flags of the O(1) solution
function reason(vars, g, r, c) {
  const has = (re, k) => Object.entries(vars).some(([n, v]) => re.test(n) && ((v && v.$set && v.$set.includes(k)) || (Array.isArray(v) && v[k] === true)));
  if (has(/row|^rs$/i, r)) return `row ${r} held a 0`;
  if (has(/col|^cs$/i, c)) return `column ${c} held a 0`;
  if (r > 0 && c > 0) return g[r][0] === 0 ? `row ${r} is flagged` : g[0][c] === 0 ? `column ${c} is flagged` : null;
  if (r === 0 && g[0][0] === 0) return 'row 0 held a 0 (its flag is the corner cell), so the top row is cleared last';
  if (c === 0) return 'column 0 held a 0 (its own flag), so the first column is cleared last';
  return null;
}

export default {
  id: 'set-matrix-zeroes',
  metaphor: 'Zeros flag their row and column',
  caption: 'Pass 1: every 0 plants a flag on the left edge of its row and the top edge of its column. Pass 2: a cell whose row or column is flagged is wiped to 0. The edges are wiped last, so no flag is lost before it is read.',
  narrate(ctx) {
    const [name, g] = gridOf(ctx.vars, ctx.params[0]);
    if (!g) return null;
    // a boolean that just turned true: column 0 (or row 0) itself holds a zero
    const flag = Object.keys(ctx.vars).find((k) => ctx.vars[k] === true && ctx.prev[k] === false);
    if (flag) return `a 0 sits in the first column itself: remember it in ${flag} (the corner cell already flags row 0)`;
    const d = diff(g, ctx.prev[name]);
    if (!d || d.length !== 1) return null;
    const [r, c] = d[0];
    if (g[r][c] !== 0) return null;
    const at = cellAt(ctx.vars, g);
    // marking: the loop is standing on a real 0 and writes into its row's left edge or its column's top edge
    if (at && g[at[0]][at[1]] === 0 && (at[0] !== r || at[1] !== c)) {
      if (r === at[0] && c === 0) return `the 0 at (${at[0]}, ${at[1]}) plants a flag on the left edge of row ${r}`;
      if (c === at[1] && r === 0) return `the 0 at (${at[0]}, ${at[1]}) plants a flag on the top edge of column ${c}`;
    }
    const why = reason(ctx.vars, g, r, c);
    return why ? `(${r}, ${c}) is wiped to 0: ${why}` : null;
  },
  // in the wipe pass (one cell checked per step): is this cell wiped?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, g] = gridOf(ctx.vars, ctx.params[0]);
    const after = name && ctx.next.vars[name];
    if (!g || !diff(g, after)) return null;
    const line = ctx.lines[ctx.next.line - 1] || '';
    // the deciding line checks a row OR a column and writes a 0 on the same line
    if (!/\|\|/.test(line) || !/\]\s*=\s*0\b/.test(line)) return null;
    const at = cellAt(ctx.next.vars, g);
    const now = cellAt(ctx.vars, g);
    if (!at || (now && now[0] === at[0] && now[1] === at[1])) return null;
    const [r, c] = at;
    if (g[r][c] === 0) return null;
    const wiped = after[r][c] === 0;
    return {
      question: `Cell (${r}, ${c}) holds ${g[r][c]}. Is it wiped to 0?`,
      options: ['Yes: its row or its column is flagged', 'No: neither its row nor its column is flagged'],
      answer: wiped ? 0 : 1,
      explain: wiped ? `A 0 was found in row ${r} or column ${c} during the scan, so the whole line is cleared, including this cell.` : `No 0 was found in row ${r} or column ${c} during the scan, so ${g[r][c]} stays.`,
    };
  },
  bugs: [
    {
      label: 'One corner flag for row 0 and column 0',
      find: 'if (firstColZero) for',
      replace: 'if (matrix[0][0] === 0) for',
      explain: 'The corner cell can only say one thing. Using it for both, a 0 in row 0 also wipes column 0 (or a 0 in column 0 is forgotten).',
    },
    {
      label: 'Wipe pass starts at row 0',
      find: 'for (let r = 1; r < m; r++) {\n    for (let c = 1;',
      replace: 'for (let r = 0; r < m; r++) {\n    for (let c = 1;',
      explain: 'Row 0 holds the column flags. Wiping it during the interior pass turns its cells into fake flags, so columns with no real 0 get cleared too.',
    },
  ],
};
