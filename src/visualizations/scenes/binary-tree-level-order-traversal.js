// Scene: Binary Tree Level Order Traversal. A roll call floor by floor: the line (queue) holds exactly one floor
// when a round starts; each node called says its value and sends its children to the back of the line.
import { row } from './util.js';

const SIZE = ['size', 'levelSize', 'len', 'n', 'count', 'cnt', 'width', 'sz', 'levelLen'];
const isNode = (v) => v && Array.isArray(v.$tree);
const lineOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|line|frontier|curr|level|next/i.test(k) && Array.isArray(v) && v.length && v.every(isNode));
const floorsOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && Array.isArray(v) && v.every((r) => row(r)) && (v.length || /res|ans|out|levels/i.test(k)));
const grownRow = (vars, prev, skip) =>
  Object.entries(vars).find(([k, v]) => k !== skip && row(v) && row(prev[k]) && v.length === prev[k].length + 1);
const sizeOf = (vars) => SIZE.find((k) => Number.isInteger(vars[k]));

export default {
  id: 'binary-tree-level-order-traversal',
  metaphor: 'A roll call, floor by floor',
  caption: 'The line (queue) holds one whole floor when a round starts. Each node called out says its value and sends its children to the back of the line, so the next floor is ready when this one ends.',
  narrate(ctx) {
    const floors = floorsOf(ctx.vars, ctx.params);
    const before = floors && ctx.prev[floors[0]];
    if (floors && Array.isArray(before) && floors[1].length === before.length + 1) {
      const r = floors[1][floors[1].length - 1];
      return `floor ${floors[1].length} is done: [${r.join(', ')}], read left to right`;
    }
    const said = grownRow(ctx.vars, ctx.prev, floors?.[0]);
    if (said) return `${said[1][said[1].length - 1]} is called and says its value (${said[1].length} on this floor so far)`;
    const line = lineOf(ctx.vars);
    const old = line && ctx.prev[line[0]];
    if (line && Array.isArray(old) && line[1].length === old.length + 1) {
      const kid = line[1][line[1].length - 1].$tree[0];
      return `child ${kid} joins the back of the line for the next floor`;
    }
    const s = sizeOf(ctx.vars);
    if (s && ctx.vars[s] !== ctx.prev[s] && /=/.test(ctx.src)) return `${ctx.vars[s]} ${ctx.vars[s] === 1 ? 'node waits' : 'nodes wait'} in line: that is exactly the next floor`;
    return null;
  },
  // before the floor size is taken, and before a floor is written down
  predict(ctx) {
    if (!ctx.next) return null;
    const nx = ctx.next.vars;
    const s = sizeOf(nx);
    const line = lineOf(ctx.vars);
    if (s && line && nx[s] > 1 && nx[s] !== ctx.vars[s] && /\b(size|levelSize|len|n|count|cnt|width|sz|levelLen)\s*=/.test(ctx.lines[ctx.next.line - 1] || '')) {
      const right = nx[s];
      return {
        question: 'A new floor starts. How many nodes are on it?',
        ...cardOf(right, [line[1].length, right + 1, right - 1, right * 2].filter((x) => x > 0)),
        explain: `Exactly the ${right} node${right === 1 ? '' : 's'} still waiting in line: every child pushed during the last round, and nothing else yet.`,
      };
    }
    const floors = floorsOf(nx, ctx.params);
    const before = floors && ctx.vars[floors[0]];
    if (floors && Array.isArray(before) && floors[1].length === before.length + 1 && floors[1][floors[1].length - 1].length > 1) {
      const r = floors[1][floors[1].length - 1];
      const fmt = (a) => `[${a.join(', ')}]`;
      const wrong = [fmt([...r].reverse()), fmt(r.slice(0, -1)), ...(before.length ? [fmt([...before[before.length - 1], ...r])] : [])];
      const opts = [...new Set([fmt(r), ...wrong.filter((x) => x !== fmt(r) && x !== '[]')])].slice(0, 4).sort();
      if (opts.length < 2) return null;
      return {
        question: `Floor ${floors[1].length} is complete. What gets written down for it?`,
        options: opts,
        answer: opts.indexOf(fmt(r)),
        explain: `The nodes of this floor, in the order they left the line: left to right. ${fmt(r)}.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Loop on the live queue length',
      find: 'for (let i = 0; i < size; i++)',
      replace: 'for (let i = 0; head < queue.length; i++)',
      explain: 'Children pushed during the round are called in the same round, so every floor runs into the next and all values end up on one floor.',
    },
    {
      label: 'Empty tree gives [[]]',
      find: 'if (root === null) return result;',
      replace: 'if (root === null) return [[]];',
      explain: 'An empty tree has no floors at all, so the answer is [], not one empty floor.',
    },
  ],
};

function cardOf(right, wrong) {
  const opts = [...new Set([right, ...wrong.filter((x) => x !== right)])].slice(0, 4).sort((a, b) => a - b);
  return { options: opts.map(String), answer: opts.indexOf(right) };
}
