// Scene: Delete Node in a BST. A manager leaving a sorted org chart: first walk down to them (smaller left, bigger
// right). With no reports or one, their only report moves up into the seat. With two, the smallest person on their
// right team (the in-order successor) takes the seat, and is then removed from that team.
// Works with the recursive version (the root parameter walking down) and with iterative walkers (node / cur…).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const NODE = ['node', 'cur', 'curr', 'n', 't'];
const SUCC = /succ|pred|min|max|heir|next|repl|tmp|s$/i;
/** [name, node or null] of the node the search is at */
function atOf(ctx, vars) {
  const k = [ctx.params[0], ...NODE].find((n) => n in vars && !/\(whole\)/.test(n) && (vars[n] === null || isTree(vars[n])));
  return k ? [k, vars[k]] : null;
}
/** [name, node] of the successor finder: another node variable, by name */
const succOf = (ctx, vars) => Object.entries(vars).find(([k, v]) => k !== ctx.params[0] && !NODE.includes(k) && !/\(whole\)/.test(k) && SUCC.test(k) && isTree(v));
const has = (t, i) => t.$tree[i] !== null && t.$tree[i] !== undefined;
const keyOf = (ctx, vars) => (Number.isFinite(vars[ctx.params[1]]) ? vars[ctx.params[1]] : null);

export default {
  id: 'delete-node-in-a-bst',
  metaphor: 'A manager leaves; who takes the seat?',
  caption: 'Walk down the chart to the person leaving (smaller left, bigger right). One or no reports: the report moves up into the seat. Two reports: the smallest person on the right team takes the seat and is removed from that team.',
  narrate(ctx) {
    const at = atOf(ctx, ctx.vars);
    const was = atOf(ctx, ctx.prev);
    const key = keyOf(ctx, ctx.vars);
    const first = ctx.input?.[1];
    const inTree = Array.isArray(ctx.input?.[0]) && ctx.input[0].includes(first);
    if (ctx.ret && !ctx.next && !inTree) return `done: ${first} was never in the chart, nothing changed`;
    if (ctx.ret && !ctx.next) return isTree(ctx.value) ? `done: the chart without ${first} is handed back (top: ${ctx.value.$tree[0]})` : ctx.value === null ? 'done: the chart is empty' : null;
    if (ctx.ret && at && isTree(at[1]) && at[1].$tree[0] === key) {
      const t = at[1];
      if (!has(t, 1) && !has(t, 2)) return `${t.$tree[0]} has no reports: the seat is simply emptied`;
      if (!has(t, 1)) return `${t.$tree[0]} has only a right report: ${t.$tree[2]} moves up into the seat`;
      if (!has(t, 2)) return `${t.$tree[0]} has only a left report: ${t.$tree[1]} moves up into the seat`;
    }
    if (ctx.ret && at && at[1] === null && ctx.value === null) return `an empty seat: ${key} is not on this side of the chart`;
    const s = succOf(ctx, ctx.vars);
    const s0 = succOf(ctx, ctx.prev);
    // the seat takes the successor's value
    if (at && isTree(at[1]) && was && isTree(was[1]) && was[1].$ids[0] === at[1].$ids[0] && was[1].$tree[0] !== at[1].$tree[0]) {
      return `${at[1].$tree[0]} takes ${was[1].$tree[0]}'s seat; now remove the old ${at[1].$tree[0]} from the ${at[1].$tree[0] > was[1].$tree[0] ? 'right' : 'left'} team`;
    }
    const sameSeat = at && was && isTree(at[1]) && isTree(was[1]) && at[1].$ids[0] === was[1].$ids[0];
    // back from the call below: the parent re-attaches what it returned
    const up = ctx.src.match(/(\w+)\.(left|right)\s*=\s*\w+\(/);
    if (up && at && up[1] === at[0] && isTree(at[1]) && !sameSeat) {
      const c = at[1].$tree[up[2] === 'left' ? 1 : 2];
      return `back at ${at[1].$tree[0]}: its ${up[2]} team is re-attached${c === null || c === undefined ? ' (now empty)' : `, now led by ${c}`}`;
    }
    if (s && (!s0 || s0[0] !== s[0]) && sameSeat) return `${at && isTree(at[1]) ? at[1].$tree[0] : 'it'} has two reports: look for the ${s[1].$ids[0] === at[1].$ids[1] ? 'biggest on the left' : 'smallest on the right'} team, start at ${s[1].$tree[0]}`;
    if (s && s0 && s0[1].$ids[1] === s[1].$ids[0]) return `${s[1].$tree[0]} is smaller still: go left${has(s[1], 1) ? '' : `; nobody left of it, so ${s[1].$tree[0]} is the successor`}`;
    if (s && s0 && s0[1].$ids[2] === s[1].$ids[0]) return `${s[1].$tree[0]} is bigger still: go right${has(s[1], 2) ? '' : `; nobody right of it, so ${s[1].$tree[0]} is the predecessor`}`;
    if (!at || !isTree(at[1]) || key === null) return null;
    const t = at[1];
    // walked one step down
    if (was && isTree(was[1]) && was[0] === at[0] && Object.keys(ctx.prev).includes(ctx.params[1]) && keyOf(ctx, ctx.prev) === key) {
      const side = was[1].$ids[1] === t.$ids[0] ? 'left' : was[1].$ids[2] === t.$ids[0] ? 'right' : null;
      if (side) return `${key} ${side === 'left' ? '<' : '>'} ${was[1].$tree[0]}: go ${side} to ${t.$tree[0]}`;
    }
    if (!Object.keys(ctx.prev).length) return `look for ${key}, starting at the top: ${t.$tree[0]}`;
    if (key !== keyOf(ctx, ctx.prev) && keyOf(ctx, ctx.prev) !== null) return `now remove the old ${key} from that team, starting at ${t.$tree[0]}`;
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const at = atOf(ctx, ctx.vars);
    const key = keyOf(ctx, ctx.vars);
    if (!at || !isTree(at[1]) || key === null) return null;
    const t = at[1];
    // the seat is about to take a new value: who takes it?
    const after = atOf(ctx, nx.vars);
    const s = succOf(ctx, ctx.vars);
    if (s && after && isTree(after[1]) && after[1].$ids[0] === t.$ids[0] && after[1].$tree[0] !== t.$tree[0]) {
      const right = after[1].$tree[0];
      const opts = [...new Set([right, t.$tree[1], t.$tree[2]].filter((v) => v !== null && v !== undefined))].sort((a, b) => a - b);
      if (opts.length < 2) return null;
      return {
        question: `${t.$tree[0]} leaves and has two reports. Who takes the seat?`,
        options: opts.map(String),
        answer: opts.indexOf(right),
        explain:
          right === s[1].$tree[0]
            ? right > t.$tree[0]
              ? `${right} is the smallest on the right team: bigger than everyone on the left, smaller than the rest on the right, so the chart stays sorted.`
              : `${right} is the biggest on the left team: bigger than the rest on the left, smaller than everyone on the right, so the chart stays sorted.`
            : `This code moves ${right} up; the successor found was ${s[1].$tree[0]}.`,
      };
    }
    // a fresh arrival at a node during the search: go left, go right, or found?
    if (s || ctx.ret) return null;
    if (keyOf(ctx, nx.vars) !== key || !after || after[0] !== at[0]) return null;
    // ask on the first node and on the found one, not at every step of the walk
    const top = !Object.keys(ctx.prev).length;
    let answer;
    if (isTree(after[1]) && after[1].$ids[0] === t.$ids[1]) answer = 0;
    else if (isTree(after[1]) && after[1].$ids[0] === t.$ids[2]) answer = 1;
    else if (isTree(after[1]) && after[1].$ids[0] === t.$ids[0] && t.$tree[0] === key) answer = 2;
    else return null;
    if (!top && answer !== 2) return null;
    return {
      question: `Looking for ${key}; we are at ${t.$tree[0]}. What happens next?`,
      options: ['Go left', 'Go right', `Found: ${t.$tree[0]} is the one to remove`],
      answer,
      explain: answer === 2 ? `${t.$tree[0]} equals the key, so this seat is the one to empty.` : `${key} is ${answer === 0 ? 'smaller' : 'bigger'} than ${t.$tree[0]}, so it can only be on the ${answer === 0 ? 'left' : 'right'}.`,
    };
  },
  bugs: [
    {
      label: 'Remove the successor from the wrong team',
      find: 'root.right = deleteNode(root.right, succ.val);',
      replace: 'root.left = deleteNode(root.left, succ.val);',
      explain: 'The successor lives on the right team. Searching the left team never finds it, so its value now sits in the chart twice.',
    },
    {
      label: 'Forget to return the node',
      find: 'return root;',
      replace: 'return;',
      explain: 'Each parent re-attaches whatever the call below returns. Returning nothing cuts the chart off at every seat the search passed.',
    },
  ],
};
