// Sudoku Solver: pencil and eraser. Blank cells are filled one by one; a digit goes in only when its row, column and
// 3×3 box do not have it yet, and when a later blank has no digit left, the pencil backs out and erases. Notes are
// read from the current step alone (the board, the cell and the digit), because long runs are sampled and the step
// before may be far away. Works with r/c, i/j, row/col names and string or number digits.
import { callArgs, options, writtenCell } from './util.js';

const CELL = [['r', 'c'], ['i', 'j'], ['row', 'col'], ['x', 'y'], ['rr', 'cc']];
const DIGIT = ['ch', 'd', 'digit', 'num', 'val', 'value', 'candidate', 'cand', 'char', 'dig', 'x'];
const BLANK = ['.', '0', 0, '', null];
const isBoard = (v) => Array.isArray(v) && v.length === 9 && v.every((r) => Array.isArray(r) && r.length === 9);
const at = (r, c) => `(${r}, ${c})`;
const isDigit = (x) => /^[1-9]$/.test(String(x));

function cellOf(vars) {
  const p = CELL.find(([a, b]) => Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b]) && vars[a] >= 0 && vars[a] < 9 && vars[b] >= 0 && vars[b] < 9);
  return p ? [vars[p[0]], vars[p[1]], p] : null;
}
/** the digit being tried: a 1–9 variable that is not the cell's own names */
function digitOf(vars, pair) {
  const k = DIGIT.find((n) => !pair.includes(n) && n in (vars || {}) && isDigit(vars[n]) && (typeof vars[n] === 'string' || Number.isInteger(vars[n])));
  return k ? [k, String(vars[k])] : null;
}
/** where digit x already sits around (r, c): { row, col, box } as lists of other cells holding it */
function clashes(b, r, c, x) {
  const out = { row: [], col: [], box: [] };
  for (let j = 0; j < 9; j++) if (j !== c && String(b[r][j]) === x) out.row.push([r, j]);
  for (let i = 0; i < 9; i++) if (i !== r && String(b[i][c]) === x) out.col.push([i, c]);
  const r0 = r - (r % 3);
  const c0 = c - (c % 3);
  for (let i = r0; i < r0 + 3; i++) for (let j = c0; j < c0 + 3; j++) if ((i !== r || j !== c) && String(b[i][j]) === x) out.box.push([i, j]);
  return out;
}
/** digits 1–9 already used in the row / column / box of (r, c) */
function taken(b, r, c) {
  const s = new Set();
  for (let x = 1; x <= 9; x++) {
    const k = clashes(b, r, c, String(x));
    if (k.row.length || k.col.length || k.box.length) s.add(x);
  }
  return [...s];
}
const where = (k) => [k.row.length && 'row', k.col.length && 'column', k.box.length && 'box'].filter(Boolean).join(' and ');

/** the state of a try: { r, c, x, b, blank } when the step holds a board, a cell and a digit, else null */
function tryOf(ctx, vars) {
  const b = vars?.[ctx.params[0]];
  const cell = cellOf(vars);
  if (!isBoard(b) || !cell) return null;
  const [r, c, pair] = cell;
  const d = digitOf(vars, pair);
  if (!d) return null;
  return { r, c, x: d[1], name: d[0], b, blank: BLANK.includes(b[r][c]) };
}

export default {
  id: 'sudoku-solver',
  metaphor: 'Pencil in a digit, erase on a dead end',
  caption: 'Blanks are filled in order. A digit goes in only if its row, column and 3×3 box do not have it yet; when a later blank has no digit left, the pencil backs out and erases the last guess.',
  narrate(ctx) {
    const bName = ctx.params[0];
    const b = ctx.vars[bName];
    if (!isBoard(b)) return null;
    const w = writtenCell(ctx.src, ctx.vars);
    // a digit written into the board, or erased
    if (w && w.name === bName && w.at.length === 2) {
      const [r, c] = w.at;
      const now = b[r]?.[c];
      if (ctx.prev[bName]?.[r]?.[c] === now) return null; // the same line also updates the row / column / box sets
      if (BLANK.includes(now)) return `erase ${at(r, c)}: the blanks after it ran out of digits, so try its next digit`;
      if (isDigit(now)) {
        const t = taken(b, r, c);
        return `pencil ${now} into ${at(r, c)}: ${t.length ? `${t.join(', ')} are taken around it, ` : ''}no ${now} in its row, column or box`;
      }
      return null;
    }
    // inside a validity helper (it takes the digit as a parameter): its verdict on one digit
    const call = callArgs(ctx);
    const cellArgs = call && cellOf(call.args);
    if (call && cellArgs && digitOf(call.args, cellArgs[2])) {
      const tr = tryOf(ctx, ctx.vars);
      if (!ctx.ret || !tr || typeof ctx.value !== 'boolean') return null;
      const k = clashes(tr.b, tr.r, tr.c, tr.x);
      if (ctx.value && !where(k)) return `${tr.x} is free in the row, column and box of ${at(tr.r, tr.c)}`;
      if (!ctx.value && where(k)) return `${tr.x} is already in the ${where(k)} of ${at(tr.r, tr.c)}`;
      return null;
    }
    if (ctx.ret && ctx.value === true && !ctx.next) return 'every blank is filled: the puzzle is solved';
    if (ctx.ret && ctx.value === true) {
      const cell = cellOf(ctx.vars);
      return cell ? `${at(cell[0], cell[1])} keeps its digit: everything after it fits, pass "solved" back up` : 'every blank is filled: pass "solved" back up';
    }
    const cell = cellOf(ctx.vars);
    if (ctx.ret && ctx.value === false && cell && BLANK.includes(b[cell[0]][cell[1]])) {
      const t = taken(b, cell[0], cell[1]);
      return `${at(cell[0], cell[1])}: no digit 1–9 is left${t.length === 9 ? ' (all 9 are taken around it)' : ''}: back out to the blank before`;
    }
    const tr = tryOf(ctx, ctx.vars);
    if (!tr || !tr.blank) return null;
    // a digit is skipped (`if (… has …) continue`)
    if (/continue/.test(ctx.src)) {
      const k = clashes(tr.b, tr.r, tr.c, tr.x);
      return where(k) ? `${tr.x} is already in the ${where(k)} of ${at(tr.r, tr.c)}: skip it` : null;
    }
    // a new digit to try (no verdict: a prediction may ask)
    if (ctx.prev[tr.name] !== ctx.vars[tr.name] && ctx.prev[tr.name] !== undefined) return `${at(tr.r, tr.c)} is blank: try ${tr.x}`;
    if (ctx.prev[tr.name] === undefined) return tr.x === '1' ? `${at(tr.r, tr.c)} is the next blank: start with 1` : `${at(tr.r, tr.c)} is blank: try ${tr.x}`;
    return null;
  },
  // a digit is about to be tried: does it fit?
  predict(ctx) {
    const nx = ctx.next;
    const tr = tryOf(ctx, ctx.vars);
    if (!nx || !tr || !tr.blank || /continue/.test(ctx.src)) return null;
    if (ctx.prev[tr.name] === ctx.vars[tr.name]) return null;
    const nt = tryOf(ctx, nx.vars);
    if (!nt || nt.r !== tr.r || nt.c !== tr.c || nt.x !== tr.x) return null;
    const k = clashes(tr.b, tr.r, tr.c, tr.x);
    const fits = !where(k);
    const placed = String(nt.b[tr.r][tr.c]) === tr.x;
    const skipped = nt.blank && /continue/.test(ctx.lines[nx.line - 1] || '');
    // the next step must show the same verdict
    if (fits ? !placed : !skipped) return null;
    const t = taken(tr.b, tr.r, tr.c);
    return options(
      `${at(tr.r, tr.c)} is blank and ${tr.x} is the digit to try. Does it go in?`,
      fits ? `Yes: ${tr.x} fits` : `No: ${tr.x} is taken`,
      [fits ? `No: ${tr.x} is taken` : `Yes: ${tr.x} fits`],
      fits
        ? `No ${tr.x} in row ${tr.r}, column ${tr.c} or its box (taken there: ${t.join(', ') || 'nothing'}), so it is pencilled in.`
        : `There is already a ${tr.x} in the ${where(k)} (at ${[...k.row, ...k.col, ...k.box].map(([i, j]) => at(i, j)).filter((s, i, a) => a.indexOf(s) === i).join(', ')}), so it is skipped.`,
    );
  },
  bugs: [
    {
      label: 'Write numbers instead of strings',
      find: 'const ch = String(d);',
      replace: 'const ch = d;',
      explain: 'The givens are strings ("5"), so a check for the number 5 never sees them: digits clash with the givens, and the board ends up holding numbers.',
    },
    {
      label: 'Undo even after success',
      find: 'if (fill(k + 1)) return true;',
      replace: 'fill(k + 1);',
      explain: 'A solved board is erased again on the way back, so the puzzle ends up back where it started.',
    },
  ],
};
