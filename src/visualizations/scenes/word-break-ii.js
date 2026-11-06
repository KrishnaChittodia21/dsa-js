// Word Break II: cut a word off the front of the rest of the string, then split what is left the same way; every
// sentence for the rest, with the word in front, is a sentence here. A memo keeps each start position's sentences.
// Works with a memo Map / object of sentence lists, a result list per call, or a path of words (backtracking).
import { entriesOf, options } from './util.js';

const START = ['start', 'i', 'idx', 'pos', 'index', 'st', 'from', 'begin', 'l', 'left'];
const WORD = ['word', 'w', 'prefix', 'sub', 'piece', 'pre', 'cand', 'head', 'part', 'first', 'chunk', 'cur'];
const RESULT = ['result', 'res', 'ans', 'out', 'sentences', 'output', 'list', 'ret', 'acc', 'all', 'answer'];
const PATH = ['path', 'curr', 'words', 'parts', 'current', 'stack', 'chosen', 'sentence', 'picked'];
const MEMO = ['memo', 'cache', 'dp', 'seen', 'map', 'm', 'mem'];
const strs = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const q = (x) => `“${x}”`;
const list = (L) => (L.length ? `: ${L.slice(0, 2).map(q).join(', ')}${L.length > 2 ? ', …' : ''}` : '');
const ways = (k) => `${k} sentence${k === 1 ? '' : 's'}`;
const pick = (vars, names, params, ok) => names.find((k) => !params.includes(k) && ok(vars[k]));
const memoOf = (vars, params) => {
  // entriesOf only takes objects of plain values; a memo of sentence lists is read off the $obj directly
  const e = (v) => entriesOf(v) || (v && v.$obj && Object.entries(v.$obj).every(([, x]) => strs(x)) ? Object.entries(v.$obj) : null);
  const k = pick(vars, MEMO, params, e);
  return k ? e(vars[k]) : null;
};
export default {
  id: 'word-break-ii',
  metaphor: 'Cutting a letter strip into words',
  caption: 'Each call gets the strip from one letter on. It cuts a dictionary word off the front and asks for every way to split what is left; those sentences, with the word in front, are this call’s answer.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName] ?? ctx.input?.[0];
    const dict = new Set(strs(ctx.input?.[1]) ? ctx.input[1] : []);
    if (typeof s !== 'string') return null;
    const sk = pick(ctx.vars, START, ctx.params, Number.isInteger);
    const start = ctx.vars[sk];
    if (ctx.ret && strs(ctx.value)) {
      const L = ctx.value;
      if (!ctx.next) return `${ways(L.length)} in all${list(L)}`;
      if (L.length === 1 && L[0] === '') return 'the cut reached the end of the strip: one way to finish, an empty tail';
      if (Number.isInteger(start) && start <= s.length) {
        const memo = memoOf(ctx.vars, ctx.params) || [];
        const hit = memo.some(([k]) => Number(k) === start) && memo.length === (memoOf(ctx.prev, ctx.params) || []).length && !RESULT.some((k) => new RegExp(`\\b${k}\\b`).test(ctx.src));
        if (hit) return `${q(s.slice(start))} was split before: reuse its ${ways(L.length)} from the memo`;
        return `${q(s.slice(start))} ${L.length ? `splits into ${ways(L.length)}` : 'cannot be split'}: hand ${L.length > 1 ? 'them' : L.length ? 'it' : 'that'} back to the caller`;
      }
      return null;
    }
    // a start position just remembered with its sentences
    const m = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    if (m && m.length === was.length + 1) {
      const [k, L] = m.find(([key]) => !was.some(([w]) => w === key)) || [];
      const at = Number(k);
      if (Number.isInteger(at) && strs(L)) return `${q(s.slice(at))} (from letter ${at + 1}) ${L.length ? `splits into ${ways(L.length)}` : 'cannot be split'}${list(L)}: remembered`;
    }
    const wk = pick(ctx.vars, WORD, ctx.params, (v) => typeof v === 'string' && v !== '');
    const word = ctx.vars[wk];
    // a new sentence in this call's list
    const rk = pick(ctx.vars, RESULT, ctx.params, strs);
    const res = ctx.vars[rk];
    const before = ctx.prev[rk];
    // (right after the call for the rest returns, prev is that call's step: trust the push line instead)
    const grew = strs(before) && res.length === before.length + 1 && before.every((x, j) => x === res[j]) && ctx.prev[sk] === start;
    if (rk && res.length && (grew || (/\.push\(/.test(ctx.src) && JSON.stringify(before) !== JSON.stringify(res)))) {
      const sent = res[res.length - 1];
      const tail = word && sent.startsWith(word) ? sent.slice(word.length).trim() : null;
      return tail === null ? `a whole sentence: ${q(sent)}` : tail ? `${q(word)} + the rest’s sentence ${q(tail)} → ${q(sent)}` : `${q(word)} ends the strip: the sentence is just ${q(sent)}`;
    }
    // backtracking with a path of words
    const pk = pick(ctx.vars, PATH, ctx.params, strs);
    const path = ctx.vars[pk];
    const pb = ctx.prev[pk];
    if (pk && strs(pb) && path.length === pb.length + 1) return `cut off ${q(path[path.length - 1])}: the sentence so far is ${q(path.join(' '))}`;
    if (pk && strs(pb) && path.length === pb.length - 1) return `back up: take ${q(pb[pb.length - 1])} off again and try another cut`;
    // a candidate cut: the letters from start to end
    if (word && new RegExp(`\\b${wk}\\s*=[^=]`).test(ctx.src || '') && Number.isInteger(start) && s.startsWith(word, start)) {
      const rest = s.slice(start + word.length);
      if (!dict.has(word)) return `${q(word)} is not a word: stretch the cut one letter`;
      return rest ? `${q(word)} is a word: cut after it and split the rest, ${q(rest)}` : `${q(word)} is a word and ends the strip`;
    }
    // a new call starts on the rest of the strip (back in a caller, its word is still in scope)
    if (!word && Number.isInteger(start) && ctx.prev[sk] !== start && start <= s.length) return start === s.length ? 'nothing is left of the strip' : `split ${q(s.slice(start))} (from letter ${start + 1})`;
    return null;
  },
  // once every cut from a start has been tried: how many sentences does that piece split into?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = ctx.input?.[0];
    const m = memoOf(ctx.vars, ctx.params);
    const after = memoOf(ctx.next.vars, ctx.params);
    if (typeof s !== 'string' || !m || !after || after.length !== m.length + 1) return null;
    const [k, L] = after.find(([key]) => !m.some(([w]) => w === key)) || [];
    const at = Number(k);
    if (!Number.isInteger(at) || !strs(L) || at >= s.length) return null;
    // a piece that is one dictionary word and nothing more is too easy to ask about
    if (L.length === 1 && L[0] === s.slice(at)) return null;
    return options(
      `Every cut of ${q(s.slice(at))} has been tried. How many sentences does it split into?`,
      L.length,
      [L.length + 1, Math.max(0, L.length - 1), L.length ? 0 : 2],
      L.length ? `It splits as ${L.map(q).join(', ')}.` : `No word cut off its front leaves a rest that can be split, so it has no sentence.`,
    );
  },
  bugs: [
    {
      label: 'An empty rest has no sentences',
      find: "if (start === s.length) return [''];",
      replace: 'if (start === s.length) return [];',
      explain: 'Reaching the end of the strip is one way to finish (an empty tail). Returning no sentences there means no word can ever end a sentence, so every list stays empty.',
    },
    {
      label: 'Always join with a space',
      find: "tail === '' ? word : word + ' ' + tail",
      replace: "word + ' ' + tail",
      explain: 'The last word gets the empty tail, so every sentence ends in a stray space: "cat sand dog " is not "cat sand dog".',
    },
  ],
};
