// Palindrome Partitioning: a ribbon of letters is cut into pieces that each read the same both ways. From the
// current cut, longer and longer pieces are tried; a mirror piece is cut off and the rest of the ribbon is cut the
// same way, a fully cut ribbon is written down, and the last piece comes back off so a longer one can be tried.
import { callArgs, functionAt, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'parts', 'pieces', 'temp', 'tmp', 'partition', 'cuts', 'comb', 'combo', 'list', 'stack', 'chosen', 'split'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'partitions', 'all'];
const END = ['end', 'e', 'j', 'i', 'k', 'r', 'stop', 'to', 'len'];

const strRow = (v) => (row(v) && v.every((x) => typeof x === 'string') ? v : null);
const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k) && k in vars).map((k) => strRow(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars?.[k]).find((v) => Array.isArray(v) && v.every((p) => strRow(p)));
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const isPal = (w) => w === [...w].reverse().join('');

/** the cut position (the recursive call's integer argument) and the piece's last index, when both are known */
function cutOf(ctx, vars = ctx.vars, line = ctx.line) {
  const call = callArgs({ ...ctx, vars, line });
  if (!call) return null;
  const startName = Object.keys(call.args).find((p) => Number.isInteger(call.args[p]));
  const endName = startName && END.find((k) => k !== startName && Number.isInteger(vars[k]));
  if (!endName) return null;
  const re = new RegExp(`\\b${call.name}\\s*\\(`);
  const recursive = ctx.lines.some((l, i) => functionAt(ctx.lines, i + 1) === call.name && re.test(l) && !new RegExp(`function\\s+${call.name}\\b|${call.name}\\s*=`).test(l));
  return recursive ? { fn: call.name, startName, endName, start: vars[startName], end: vars[endName] } : null;
}

export default {
  id: 'palindrome-partitioning',
  metaphor: 'Cutting a ribbon into mirror pieces',
  caption: 'The path holds the pieces cut so far. From the current cut, longer and longer pieces are tried; only a piece that reads the same both ways may be cut off. A ribbon cut all the way to the end is written down.',
  narrate(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string') return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `the ribbon is cut to the end: ${res[res.length - 1].join(' | ')}, write it down (${res.length} found)`;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (p && before && extends1(p, before)) {
      const done = p.join('');
      const rest = s.startsWith(done) ? s.slice(done.length) : null;
      return `cut off "${p[p.length - 1]}": it reads the same both ways${rest === null ? '' : rest ? `; "${rest}" is left to cut` : ', and nothing is left'}`;
    }
    if (p && before && extends1(before, p)) {
      const x = before[before.length - 1];
      return `take "${x}" back off: try a longer piece from position ${p.join('').length}`;
    }
    const cut = cutOf(ctx);
    if (cut && p && Number.isInteger(ctx.prev[cut.startName]) && ctx.prev[cut.startName] > cut.start) {
      return `back from the deeper cut: every way to finish after ${p.length ? p.join(' | ') : 'nothing'} is tried`;
    }
    if (cut && p && ctx.prev[cut.endName] !== cut.end && cut.end >= cut.start) {
      return `from position ${cut.start}: can "${s.slice(cut.start, cut.end + 1)}" (s[${cut.start}..${cut.end}]) be cut off?`;
    }
    // a palindrome helper finishing: no verdict here, the card after it asks for it
    if (ctx.ret && typeof ctx.value === 'boolean' && ctx.next) {
      const nc = cutOf(ctx, ctx.next.vars, ctx.next.line);
      if (nc) return `"${s.slice(nc.start, nc.end + 1)}" has been read from both ends`;
    }
    return null;
  },
  // a piece of 2+ letters is on the table: can it be cut off?
  predict(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (!ctx.next || typeof s !== 'string') return null;
    const p = pathOf(ctx.vars, ctx.params);
    const cut = cutOf(ctx);
    if (!p || !cut || ctx.prev[cut.endName] === cut.end || cut.end <= cut.start) return null;
    if (Number.isInteger(ctx.prev[cut.startName]) && ctx.prev[cut.startName] !== cut.start) return null; // just back from a deeper call
    const piece = s.slice(cut.start, cut.end + 1);
    const nv = ctx.next.vars;
    const after = pathOf(nv, ctx.params);
    if (!after) return null;
    const sameFn = functionAt(ctx.lines, ctx.next.line) === cut.fn;
    let answer = -1;
    if (extends1(after, p) && after[after.length - 1] === piece) answer = 0;
    else if (sameFn && after.length === p.length && Number.isInteger(nv[cut.endName]) && nv[cut.startName] === cut.start && nv[cut.endName] > cut.end) answer = 1;
    else if (sameFn && after.length <= p.length && Number.isInteger(nv[cut.startName]) && nv[cut.startName] < cut.start) answer = 1;
    if (answer < 0) return null;
    const right = (answer === 0) === isPal(piece);
    return {
      question: `From position ${cut.start}, the next piece to try is "${piece}". Can it be cut off?`,
      options: [`Yes: "${piece}" reads the same both ways`, `No: skip it`],
      answer,
      explain: !right
        ? `This run ${answer === 0 ? 'cuts it, although' : 'skips it, although'} "${piece}" backwards is "${[...piece].reverse().join('')}": check the palindrome test.`
        : answer === 0
          ? `"${piece}" backwards is still "${piece}", so it is a valid piece and the rest of the ribbon is cut next.`
          : `"${piece}" backwards is "${[...piece].reverse().join('')}", so it is not a palindrome and cannot be a piece.`,
    };
  },
  bugs: [
    {
      label: 'Slice without end + 1',
      find: 's.slice(start, end + 1)',
      replace: 's.slice(start, end)',
      explain: 'slice stops before its second index, so every piece misses its last letter (the first piece is even empty) and the answers are wrong.',
    },
    {
      label: 'Write down the path itself, not a copy',
      find: 'result.push([...path]);',
      replace: 'result.push(path);',
      explain: 'Every saved answer is the same path array; pieces taken back off later empty it, so all answers end up as [].',
    },
  ],
};
