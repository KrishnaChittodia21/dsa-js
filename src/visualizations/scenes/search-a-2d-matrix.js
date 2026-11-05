// Search a 2D Matrix: the rows, read one after another, form one long sorted line, so a plain binary search over
// "cell numbers" 0…m·n−1 works; cell k lives at row floor(k / n), column k % n (n = number of columns).
// Works with lo/hi, left/right, l/r, low/high, start/end and mid or m; the value is read from the matrix itself.
import { firstInt } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'middle', 'm', 'k', 'idx'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const gridOf = (v) => (Array.isArray(v) && v.length && Array.isArray(v[0]) && v[0].length && v.every((r) => Array.isArray(r) && r.length === v[0].length) ? v : null);
// the cell number under a mid-like name (m is the row count in many solutions: only an index below m·n counts)
function midOf(vars, g) {
  const total = g.length * g[0].length;
  const name = MID.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < total && !(k === 'm' && vars[k] === g.length));
  return name ? [name, vars[name]] : [undefined, undefined];
}

export default {
  id: 'search-a-2d-matrix',
  metaphor: 'Bookshelf rows read as one line',
  caption: 'Read the rows left to right, top to bottom, and the matrix is one long sorted line of numbered cells. The search guesses a cell number, turns it into (row, column), and halves the range.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const [gName, tName] = ctx.params;
    const g = gridOf(ctx.vars[gName]);
    const t = ctx.vars[tName];
    if (!g) return null;
    const n = g[0].length;
    const total = g.length * n;
    const pair = pairOf(ctx.vars);
    const [mName, mid] = midOf(ctx.vars, g);
    const [, pm] = midOf(ctx.prev, g);
    if (mName && mid !== pm && pair) {
      const r = Math.floor(mid / n);
      // no verdict: the prediction asks which half goes
      return `guess cell #${mid}: row ⌊${mid}/${n}⌋ = ${r}, column ${mid} % ${n} = ${mid % n}, holding ${g[r][mid % n]} (target ${t})`;
    }
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return `${g.length} row(s) × ${n} column(s) = ${total} cell(s), numbered 0…${total - 1} in reading order`;
    const val = (k) => (Number.isInteger(k) && k >= 0 && k < total ? g[Math.floor(k / n)][k % n] : undefined);
    const left = lo > hi ? `no cells left, so ${t} is not in the matrix` : `cells ${lo}…${hi} left`;
    if (lo !== ctx.prev[loName] && val(pm) !== undefined) return `${val(pm)} < ${t}: cells up to #${pm} are too small (${left})`;
    if (hi !== ctx.prev[hiName] && val(pm) !== undefined) return `${val(pm)} > ${t}: cells from #${pm} on are too big (${left})`;
    if (lo > hi) return `${loName} = ${lo} passed ${hiName} = ${hi}: no cells left, so ${t} is not in the matrix`;
    if (/return/.test(ctx.src) && val(mid) === t) return `cell #${mid} = (${Math.floor(mid / n)}, ${mid % n}) holds ${t}: found`;
    return null;
  },
  // once a cell is guessed and read: which half is dropped?
  predict(ctx) {
    const [gName, tName] = ctx.params;
    const g = gridOf(ctx.vars[gName]);
    const pair = pairOf(ctx.vars);
    if (!g || !pair || !ctx.next) return null;
    const [mName, mid] = midOf(ctx.vars, g);
    if (!mName) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const moved = nx[loName] > ctx.vars[loName] ? 'up' : nx[hiName] < ctx.vars[hiName] ? 'down' : ctx.next.ret ? 'found' : null;
    if (!moved) return null;
    const n = g[0].length;
    const v = g[Math.floor(mid / n)][mid % n];
    const t = ctx.vars[tName];
    if (moved === 'found' && v !== t) return null;
    return {
      question: `Cell #${mid} is row ${Math.floor(mid / n)}, column ${mid % n}: it holds ${v}, the target is ${t}. What happens next?`,
      options: [`Drop cells #${mid} and before (${loName} moves up)`, `Drop cells #${mid} and after (${hiName} moves down)`, 'Stop: the target is found'],
      answer: { up: 0, down: 1, found: 2 }[moved],
      explain: moved === 'found' ? `${v} is the target, so the search returns true.` : `${v} is ${moved === 'up' ? 'smaller' : 'bigger'} than ${t}, and the reading order is sorted, so every cell ${moved === 'up' ? 'before' : 'after'} it is ${moved === 'up' ? 'smaller' : 'bigger'} too.`,
    };
  },
  bugs: [
    {
      label: 'Divide by the number of rows',
      find: 'matrix[Math.floor(mid / n)][mid % n]',
      replace: 'matrix[Math.floor(mid / m)][mid % m]',
      explain: 'Cell #k is at row k ÷ (cells per row). Dividing by the row count reads the wrong cell (or runs off the matrix) whenever rows and columns differ.',
    },
    {
      label: 'while (lo < hi): the last cell is never read',
      find: 'lo <= hi',
      replace: 'lo < hi',
      explain: 'When one cell is left, lo === hi and the loop stops before reading it, so a 1 × 1 matrix holding the target answers false.',
    },
  ],
};
