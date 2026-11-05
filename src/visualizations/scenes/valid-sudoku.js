// Valid Sudoku (hash set of facts). An inspector walks the board cell by cell; every digit is written into three
// notebooks: its row, its column and its 3×3 box. A digit already written in one of them is a clash. Reads the
// cell from r / row / i and c / col / j, the box from b / box / boxIdx, and counts facts in any Set(s) / Map /
// flag grid (not the board); keys of one big Set ("r0:5") are shown as they are.
import { entriesOf, firstInt, options } from './util.js';

const R = ['r', 'row', 'i', 'y'];
const C = ['c', 'col', 'j', 'x'];
const BOX = ['b', 'box', 'boxIdx', 'boxIndex', 'bi', 'bx', 'boxId'];
const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
const isBoard = (v) => Array.isArray(v) && v.length === 9 && v.every((x) => Array.isArray(x) && x.length === 9);
// the cell being inspected: { r, c, d, rName, cName }
function cellOf(ctx, vars = ctx.vars) {
  const board = vars[ctx.params[0]];
  if (!isBoard(board)) return null;
  const [rName, r] = firstInt(vars, R);
  const [cName, c] = firstInt(vars, C);
  if (!rName || !cName || rName === cName || !(r >= 0 && r < 9 && c >= 0 && c < 9)) return null;
  return { board, r, c, d: board[r][c], rName, cName };
}
// how many facts are written down, and the newest string key of a single Set
function facts(vars, params) {
  let n = 0;
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !v || typeof v !== 'object') continue;
    if (Array.isArray(v.$set)) n += v.$size ?? v.$set.length;
    else if (entriesOf(v)) n += entriesOf(v).length;
    else if (Array.isArray(v)) for (const x of v) {
      if (x && Array.isArray(x.$set)) n += x.$size ?? x.$set.length;
      else if (Array.isArray(x)) n += x.filter((y) => y === true || y === 1).length;
    }
  }
  return n;
}
const lastKey = (vars, params) => {
  const v = Object.entries(vars).find(([k, x]) => !params.includes(k) && x && Array.isArray(x.$set))?.[1];
  const s = v?.$set;
  // a long Set is cut short in the snapshot: its last shown key is then not the newest
  return s && s.length && s.length === (v.$size ?? s.length) && typeof s[s.length - 1] === 'string' ? s[s.length - 1] : null;
};
// where this digit already appears in its row, column or box (other cells)
function clashes({ board, r, c, d }) {
  const out = [];
  for (let k = 0; k < 9; k++) if (k !== c && board[r][k] === d) out.push(`row ${r} has another ${d} at (${r}, ${k})`);
  for (let k = 0; k < 9; k++) if (k !== r && board[k][c] === d) out.push(`column ${c} has another ${d} at (${k}, ${c})`);
  const b = boxOf(r, c);
  for (let rr = Math.floor(r / 3) * 3; rr < Math.floor(r / 3) * 3 + 3; rr++)
    for (let cc = Math.floor(c / 3) * 3; cc < Math.floor(c / 3) * 3 + 3; cc++)
      if ((rr !== r || cc !== c) && board[rr][cc] === d) out.push(`box ${b} has another ${d} at (${rr}, ${cc})`);
  return out;
}
const boxName = (vars) => BOX.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < 9);

export default {
  id: 'valid-sudoku',
  metaphor: 'An inspector with three notebooks',
  caption: 'The inspector visits every filled cell and writes its digit into three notebooks: its row, its column and its 3×3 box. Boxes are numbered 0–8, left to right, top to bottom. A digit already written in one of them means the board is invalid.',
  narrate(ctx) {
    const cell = cellOf(ctx);
    if (ctx.ret && ctx.result === true && !cell) return 'every digit checked: no row, column or box repeats a digit, the board is valid';
    if (!cell) return null;
    const { r, c, d } = cell;
    if (ctx.ret && ctx.result === false) {
      const cl = clashes(cell);
      return cl.length ? `${d} at (${r}, ${c}) clashes: ${cl[0]}. The board is invalid` : null;
    }
    const n = facts(ctx.vars, ctx.params);
    const was = facts(ctx.prev, ctx.params);
    if (n > was && ctx.prev[cell.rName] === r && ctx.prev[cell.cName] === c) {
      const key = lastKey(ctx.vars, ctx.params) ?? ['k', 'key', 'fact'].map((x) => ctx.vars[x]).find((x) => typeof x === 'string');
      // which notebook grew (rows / cols / boxes…), when there is no single key to show
      const grew = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && facts({ [k]: ctx.vars[k] }, []) > facts({ [k]: ctx.prev[k] }, []));
      const where = key ? `"${key}" is written down` : `${d} is written in ${grew || 'a notebook'}`;
      return `no clash: ${where} (${n} fact${n === 1 ? '' : 's'} so far)`;
    }
    const bName = boxName(ctx.vars);
    if (bName && ctx.vars[bName] !== ctx.prev[bName] && ctx.prev[cell.rName] === r && ctx.prev[cell.cName] === c) return `cell (${r}, ${c}) belongs to box ${ctx.vars[bName]}`;
    if (ctx.prev[cell.rName] !== r || ctx.prev[cell.cName] !== c) {
      if (d === '.') return `cell (${r}, ${c}) is empty: nothing to check`;
      return `cell (${r}, ${c}) holds ${d}: check its row, column and box`;
    }
    return null;
  },
  predict(ctx) {
    const cell = cellOf(ctx);
    if (!cell || !ctx.next || ctx.ret || cell.d === '.') return null;
    const { r, c, d } = cell;
    // the run stops on this cell: a clash (always asked: it is the moment the board fails)
    const nc = cellOf(ctx, ctx.next.vars);
    if (ctx.next.ret && ctx.result === false && nc && nc.r === r && nc.c === c) {
      const cl = clashes(cell);
      if (!cl.length) return null;
      const yes = 'Clash: return false';
      const no = `No clash: write ${d} down and go on`;
      return options(`Cell (${r}, ${c}) holds ${d} (row ${r}, column ${c}, box ${boxOf(r, c)}). What happens next?`, yes, [no], `${cl.join('; ')}: the same digit twice in one unit.`);
    }
    // the box number is about to be worked out (asked on the middle-row, left-column cell of boxes 1–8: a few per board)
    const bName = boxName(ctx.next.vars);
    if (!bName || bName in ctx.vars || r % 3 !== 1 || c % 3 !== 0 || boxOf(r, c) === 0 || nc?.r !== r || nc?.c !== c) return null;
    const b = ctx.next.vars[bName];
    const std = b === boxOf(r, c);
    const wrong = [Math.floor(r / 3) + Math.floor(c / 3), Math.floor(c / 3) * 3 + Math.floor(r / 3), r + Math.floor(c / 3), b + 1, b - 1].filter((x) => x >= 0 && x < 9);
    return options(`Cell (${r}, ${c}) holds ${d}. Which box does it belong to?`, b, wrong.filter((x) => x !== b), std ? `Row ${r} is in band ${Math.floor(r / 3)} (3 boxes per band), column ${c} is box column ${Math.floor(c / 3)}: ${Math.floor(r / 3)} × 3 + ${Math.floor(c / 3)} = ${b}.` : `Your code numbers this cell's box ${b}.`);
  },
  bugs: [
    {
      label: 'Box number without the ×3',
      find: 'Math.floor(r / 3) * 3 + Math.floor(c / 3)',
      replace: 'Math.floor(r / 3) + Math.floor(c / 3)',
      explain: 'Box (0, 1) and box (1, 0) both get number 1, so digits from two different boxes share a notebook and a valid board is reported invalid.',
    },
    {
      label: 'Rows and columns share one notebook',
      find: "'c' + c + ':' + d",
      replace: "'r' + c + ':' + d",
      explain: 'A 5 in column 2 is written as if it were in row 2, so a 5 in row 2 elsewhere looks like a clash although the board is fine.',
    },
  ],
};
