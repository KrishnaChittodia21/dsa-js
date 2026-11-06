// Course Schedule: can every course be finished? Kahn's way: each course counts the prerequisites it still waits
// on, and a course whose count reaches 0 joins the queue of courses you can take. DFS way: white / grey / black
// colours, and a grey course seen again means a cycle. Works with indeg / inDegree / need… and a queue (head index
// or shift), or a colour array (0 / 1 / 2) or visiting / done Sets.
import { changedIdx, row, itemsOf } from './util.js';

const DEG = /indeg|in_?degree|^deg|^in$|need|req|pending|wait/i;
const QUEUE = /queue|^q$|order|^res|result|topo|plan|ready|avail|zero/i;
const TAKEN = /taken|count|^cnt$|done|finished|processed|visited|seen|complete/i;
const COLOR = /colou?r|state|status|mark|visit|seen/i;
const GREY = /visiting|path|grey|gray|active|instack|inprogress|onstack/i;
const BLACK = /done|finished|visited|checked|safe|black|clean|ok|good/i;
const AT = ['u', 'node', 'cur', 'curr', 'course', 'c', 'v', 'x'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const degOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && DEG.test(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every(Number.isInteger));
const queueOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && QUEUE.test(k) && itemsOf(vars[k]) && itemsOf(vars[k]).every(Number.isInteger));
const nodeOf = (vars) => AT.find((k) => Number.isInteger(vars[k]));

/** course → 'grey' | 'black' from a 0/1/2 colour array or visiting / done Sets; null when there is no colouring */
function colours(vars, params, deg) {
  const out = new Map();
  out.names = [];
  let found = false;
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || k === deg) continue;
    if (COLOR.test(k) && row(v) && v.length > 0 && v.every((x) => x === 0 || x === 1 || x === 2) && v.some((x) => x > 0)) {
      found = true;
      out.names.push(k);
      v.forEach((x, i) => x && out.set(i, x === 1 ? 'grey' : 'black'));
    } else if (v && v.$set && GREY.test(k)) {
      found = true;
      out.names.push(k);
      v.$set.forEach((x) => out.get(x) !== 'black' && out.set(x, 'grey'));
    } else if (v && v.$set && BLACK.test(k)) {
      found = true;
      out.names.push(k);
      v.$set.forEach((x) => out.set(x, 'black'));
    }
  }
  return found ? out : null;
}

/** true when the line reads one of the colour variables (the entry check of a DFS call) */
const readsColour = (col, src) => col.names.some((k) => new RegExp(`\\b${k}\\b`).test(src || ''));

/** true when this line calls one of the code's own helper functions (a recursive DFS step) */
function callsHelper(lines, src) {
  const names = [...lines.join('\n').matchAll(/function\s+(\w+)|(\w+)\s*=\s*(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/g)].map((m) => m[1] || m[2]).slice(1);
  return names.some((n) => new RegExp(`\\b${n}\\s*\\(`).test(src || '') && !new RegExp(`function\\s+${n}\\b|\\b${n}\\s*=`).test(src || ''));
}

export default {
  id: 'course-schedule',
  metaphor: 'Courses unlocking as prerequisites clear',
  caption: 'An arrow a → b means a must be taken before b. Kahn: a course whose waiting count hits 0 joins the queue. DFS: grey = on the current path, black = done; meeting a grey course again means a cycle.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const n = vars[params[0]];
    const of = Number.isInteger(n) ? ` of ${n}` : '';
    const dName = degOf(vars, params);
    const qName = queueOf(vars, params);
    const q = qName && itemsOf(vars[qName]);
    const qBefore = qName && itemsOf(prev[qName]);
    const [atName, at] = [nodeOf(vars), vars[nodeOf(vars)]];

    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') {
      const tName = Object.keys(vars).find((k) => TAKEN.test(k) && Number.isInteger(vars[k]));
      if (ctx.value) return `all${of.replace(" of", "")} courses can be taken in some order: true`;
      return `${tName ? `only ${vars[tName]}${of} courses ever became free` : 'some courses wait on each other'}: a cycle blocks the rest, so false`;
    }
    // DFS colouring
    const col = colours(vars, params, dName);
    if (col) {
      const before = colours(prev, params, dName) || new Map();
      const grey = [...col].filter(([c, s]) => s === 'grey' && before.get(c) !== 'grey').map(([c]) => c);
      const black = [...col].filter(([c, s]) => s === 'black' && before.get(c) !== 'black').map(([c]) => c);
      if (black.length === 1) return `everything course ${black[0]} leads to is clear: it turns black (done, no cycle through it)`;
      if (grey.length === 1) return `course ${grey[0]} turns grey: it is on the current path while we follow its arrows`;
      if (ctx.ret && typeof ctx.value === 'boolean' && atName) {
        if (callsHelper(ctx.lines, ctx.src)) return `the walk from course ${at} ran into a cycle further on, so course ${at} is stuck too (returns ${ctx.value})`;
        if (!readsColour(col, ctx.src)) return `the walk from course ${at} finished without meeting a cycle (returns ${ctx.value})`;
        if (col.get(at) === 'grey') return `course ${at} is grey: we came back to it on the same path, so this is a cycle (returns ${ctx.value})`;
        if (col.get(at) === 'black') return `course ${at} is already black: checked before and fine, no need to walk it again (returns ${ctx.value})`;
      }
    }
    // Kahn
    if (q && qBefore && q.length === qBefore.length + 1 && (!dName || cellOk(vars[dName], q[q.length - 1]))) {
      return `course ${q[q.length - 1]} has no prerequisites left: it goes into the queue (${q.length} unlocked${of})`;
    }
    if (q && !qBefore && q.length > 0) return `${q.length === 1 ? `course ${q[0]} has` : `courses ${q.join(', ')} have`} no prerequisites: ${q.length === 1 ? 'it starts' : 'they start'} in the queue`;
    if (dName && row(prev[dName])) {
      const d = vars[dName];
      const p = prev[dName];
      const ch = changedIdx(d, p);
      if (ch.length === 1) {
        const c = ch[0];
        if (d[c] > p[c]) return `course ${c} has another prerequisite: it now waits on ${plural(d[c], 'course')}`;
        if (d[c] < p[c]) return `a prerequisite of course ${c} is done: ${d[c] === 0 ? 'nothing left, it is free to take' : `still waits on ${d[c]}`}`;
      }
    }
    const tName = Object.keys(vars).find((k) => TAKEN.test(k) && Number.isInteger(vars[k]) && prev[k] === vars[k] - 1);
    if (tName) {
      const head = Number.isInteger(vars.head) ? vars.head : Number.isInteger(vars.h) ? vars.h : -1;
      const c = atName && at !== prev[atName] ? at : q && head >= 0 && head < q.length ? q[head] : null;
      return `${c === null ? 'take the next free course' : `take course ${c}`}: ${vars[tName]}${of} done; now its dependants lose one prerequisite`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const nx = ctx.next.vars;
    // Kahn: before a count goes down, does that course become free?
    const dName = degOf(vars, params);
    const d = dName && row(vars[dName]);
    const nd = dName && row(nx[dName]);
    if (d && nd) {
      const ch = changedIdx(nd, d);
      if (ch.length === 1 && nd[ch[0]] < d[ch[0]] && !ctx.next.ret) {
        const c = ch[0];
        const free = nd[c] === 0;
        return {
          question: `A course that course ${c} depends on was just finished. Is course ${c} free to take now?`,
          options: ['Yes: it joins the queue', 'No: it still waits on another course'],
          answer: free ? 0 : 1,
          explain: free ? `That was its last unfinished prerequisite (count ${d[c]} → 0), so course ${c} is free.` : `Its count drops ${d[c]} → ${nd[c]}: another prerequisite is still unfinished.`,
        };
      }
    }
    // DFS: the walk reaches a course that is already grey or black; what does this call return?
    if (!ctx.next.ret || typeof ctx.next.value !== 'boolean') return null;
    if (callsHelper(ctx.lines, ctx.lines[ctx.next.line - 1])) return null;
    const atName = nodeOf(nx);
    const col = colours(vars, params, dName);
    const nCol = colours(nx, params, degOf(nx, params));
    if (!atName || !col || !nCol || !readsColour(col, ctx.lines[ctx.next.line - 1])) return null;
    const at = nx[atName];
    const c = col.get(at);
    if (!c || nCol.get(at) !== c) return null;
    return {
      question: `The walk reaches course ${at}, which is already ${c} (${c === 'grey' ? 'still on the current path' : 'checked before'}). What does this call return?`,
      options: ['true', 'false'],
      answer: ctx.next.value ? 0 : 1,
      explain: `${c === 'grey' ? `Grey means course ${at} is on the path we are walking: meeting it again closes a cycle` : `Black means course ${at} was fully checked before and has no cycle behind it`}; this code reports that as ${ctx.next.value}.`,
    };
  },
  bugs: [
    {
      label: 'Check the count before lowering it',
      find: '--indeg[next] === 0',
      replace: 'indeg[next]-- === 0',
      explain: 'The old count is compared, so a course waiting on its last prerequisite is not seen as free and never joins the queue: even [[1,0]] reports false.',
    },
    {
      label: 'Arrow drawn the wrong way',
      find: 'adj[pre].push(course);',
      replace: 'adj[course].push(pre);',
      explain: 'Finishing a course now lowers the count of its own prerequisite instead of the course that needs it, so dependent courses never reach 0.',
    },
  ],
};

function cellOk(d, c) {
  return !row(d) || d[c] === undefined || d[c] === 0;
}
