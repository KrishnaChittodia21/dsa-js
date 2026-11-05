// Scene: Decode String. Every "[" opens a box: the text written so far and the repeat count are saved on the
// stack, and a fresh piece starts. "]" closes the box: the piece is repeated and glued after the saved text.
// Works with one stack of [text, count] pairs or two stacks (counts and texts), and any names.
import { firstInt } from './util.js';

const CUR = ['cur', 'curr', 'current', 'res', 'result', 'str', 'word', 'out', 'ans', 'acc', 'piece', 'built'];
const NUM = ['num', 'k', 'n', 'count', 'cnt', 'times', 'mult', 'repeat', 'number'];
const isArr = (v) => Array.isArray(v);
// [name, text] of the text being built: a known name holding a string, not the input
function curOf(vars, params) {
  const k = CUR.find((x) => !params.includes(x) && typeof vars[x] === 'string');
  return k ? [k, vars[k]] : null;
}
// the stack(s): total depth and the top saved [text, count] when it can be read
function stackOf(vars, params) {
  const arrs = Object.entries(vars).filter(([k, v]) => !params.includes(k) && isArr(v) && /st|stack|stk|saved/i.test(k));
  if (arrs.length === 1) {
    const [name, v] = arrs[0];
    if (!v.every((p) => isArr(p) && p.length === 2)) return null;
    const top = v.at(-1);
    const [t, c] = top ? (typeof top[0] === 'string' ? top : [top[1], top[0]]) : [];
    return { depth: v.length, lens: { [name]: v.length }, text: t, count: c };
  }
  const nums = arrs.find(([, v]) => v.every(Number.isInteger));
  const strs = arrs.find(([k, v]) => k !== nums?.[0] && v.every((x) => typeof x === 'string'));
  if (!nums || !strs) return null;
  return { depth: Math.max(nums[1].length, strs[1].length), lens: { count: nums[1].length, text: strs[1].length }, text: strs[1].at(-1), count: nums[1].at(-1) };
}
// the saved text p and count k with after === p + before.repeat(k): from the variables or the old top of the stack
function closed(before, after, vars, prevStack) {
  const strs = new Set(Object.values(vars).filter((v) => typeof v === 'string'));
  const ints = new Set(Object.values(vars).filter((v) => Number.isInteger(v) && v > 0));
  if (prevStack?.text !== undefined) strs.add(prevStack.text);
  if (Number.isInteger(prevStack?.count)) ints.add(prevStack.count);
  if (after === before || after === before + after.at(-1)) return null; // unchanged, or one letter written
  for (const p of strs) for (const k of ints) if (after === p + before.repeat(k)) return [p, k];
  return null;
}
const q = (s) => `"${s.length > 24 ? `${s.slice(0, 24)}…` : s}"`;

export default {
  id: 'decode-string',
  metaphor: 'Boxes inside boxes of text',
  caption: 'Each "[" opens a box: the text so far and the repeat count are saved on the stack and a fresh piece starts. Each "]" closes the box: its piece is repeated and glued after the saved text.',
  narrate(ctx) {
    const cur = curOf(ctx.vars, ctx.params);
    const st = stackOf(ctx.vars, ctx.params);
    const pst = stackOf(ctx.prev, ctx.params);
    if (st && pst && st.lens.count !== undefined && st.lens.count + st.lens.text === pst.lens.count + pst.lens.text + 1) {
      // two stacks: each push is its own step
      return st.lens.count > pst.lens.count ? `"[" opens a box: save the count ${st.count} on the count stack` : `… and save the text so far ${q(st.text)}, then start a fresh piece`;
    }
    if (st && pst && st.depth === pst.depth + 1) {
      return `"[" opens box ${st.depth}: save the text so far ${q(st.text ?? '')} and the count ${st.count ?? '?'}, then start a fresh piece`;
    }
    if (st && pst && st.depth === pst.depth - 1 && !(cur && cur[1] !== ctx.prev[cur[0]])) {
      return `"]" closes box ${pst.depth}: it was opened after ${q(pst.text ?? '')} with count ${pst.count ?? '?'}`;
    }
    if (cur && typeof ctx.prev[cur[0]] === 'string' && cur[1] !== ctx.prev[cur[0]]) {
      const was = ctx.prev[cur[0]];
      if (cur[1].length === was.length + 1 && cur[1].startsWith(was)) return `write "${cur[1].at(-1)}" into the open piece: ${q(cur[1])}`;
      if (cur[1] === '') return null;
      const pk = closed(was, cur[1], ctx.vars, pst);
      if (pk) return `${q(was)} × ${pk[1]} = ${q(was.repeat(pk[1]))}, glued after the saved ${q(pk[0])}: ${q(cur[1])}`;
      return null;
    }
    const [nName, n] = firstInt(ctx.vars, NUM.filter((x) => !ctx.params.includes(x)));
    if (nName && Number.isInteger(ctx.prev[nName]) && n !== ctx.prev[nName] && n > 0) {
      return ctx.prev[nName] > 0 ? `another digit: the count is now ${n} (${ctx.prev[nName]} × 10 + ${n - ctx.prev[nName] * 10})` : `a digit: the count for the next box is ${n}`;
    }
    return null;
  },
  // right before a box closes into the text: what is the text then?
  predict(ctx) {
    if (!ctx.next) return null;
    const cur = curOf(ctx.vars, ctx.params);
    const nCur = curOf(ctx.next.vars, ctx.params);
    if (!cur || !nCur || cur[0] !== nCur[0] || nCur[1] === cur[1]) return null;
    const pst = stackOf(ctx.vars, ctx.params);
    const pk = closed(cur[1], nCur[1], ctx.next.vars, pst);
    if (!pk || cur[1] === '') return null;
    const [p, k] = pk;
    const right = nCur[1];
    const wrong = [cur[1].repeat(k) + p, p + cur[1], cur[1].repeat(k), p + cur[1].repeat(k + 1)].filter((x) => x !== right);
    const opts = [...new Set([right, ...wrong])].slice(0, 4).sort();
    if (opts.length < 2) return null;
    return {
      question: `"]" closes the box: its piece is ${q(cur[1])}, the count is ${k}, and the saved text is ${q(p)}. What is the text now?`,
      options: opts.map(q),
      answer: opts.indexOf(right),
      explain: `The piece is repeated ${k} times and glued AFTER the saved text: ${q(p)} + ${q(cur[1].repeat(k))} = ${q(right)}.`,
    };
  },
  bugs: [
    {
      label: 'Glue the saved text after the piece',
      find: 'cur = prev + cur.repeat(k);',
      replace: 'cur = cur.repeat(k) + prev;',
      explain: 'The saved text came before the "[", so it must stay in front: "3[a2[c]]" gives "ccaccacca" instead of "accaccacc".',
    },
    {
      label: 'Only single-digit counts',
      find: 'num = num * 10 + (ch.charCodeAt(0) - 48);',
      replace: 'num = ch.charCodeAt(0) - 48;',
      explain: 'Each new digit replaces the count instead of extending it, so "10[a]" repeats 0 times and returns "".',
    },
  ],
};
