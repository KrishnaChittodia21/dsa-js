// Alien Dictionary. Each adjacent pair of words gives at most one rule (the first letters that differ), a rule is
// an edge "a before b", and Kahn's algorithm places letters whose earlier letters are all placed. Reads the rules
// from a Map / object of letter → Set / array, the waiting counts from a Map / object / 26-slot array, and the
// alphabet from an array of letters; DFS solutions fall back to the generic notes.
import { entriesOf, row } from './util.js';

const letter = (x) => typeof x === 'string' && x.length === 1;
const q = (w) => `"${w}"`;

/** [[a, b], …] of a letter graph: Map / object of letter → Set / array of letters */
function edgesOf(v) {
  const ent = v?.$map || (v?.$obj && Object.entries(v.$obj));
  if (!Array.isArray(ent) || !ent.length || !ent.every(([k]) => letter(k))) return null;
  const out = [];
  for (const [a, s] of ent) {
    const items = s?.$set || (row(s) ? s : null);
    if (!items || !items.every(letter)) return null;
    items.forEach((b) => out.push([a, b]));
  }
  return out;
}
const graphOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && edgesOf(vars[k]));
/** letter → waiting count: Map / object of letter → int, or a 26-slot int array */
function countsOf(v) {
  const e = entriesOf(v);
  if (e && e.length && e.every(([k, x]) => letter(k) && Number.isInteger(x))) return new Map(e);
  if (row(v) && v.length === 26 && v.every(Number.isInteger)) return new Map(v.map((x, i) => [String.fromCharCode(97 + i), x]));
  return null;
}
const DEG = /indeg|in_?degree|deg|need|count|req|wait|before|parents/i;
const degOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && DEG.test(k) && countsOf(vars[k]));
const PLAN = /order|^res|result|^ans|alpha|topo|out|^sb$|^s$|^str$/i;
const QUEUE = /^q$|queue|ready|free|zero|stack/i;
/** the placed letters as a string: an array of letters or a string under a result-like name, else the queue */
const asText = (v) => (row(v) && v.every(letter) ? v.join('') : typeof v === 'string' && /^[a-z]*$/.test(v) ? v : null);
function planOf(vars, params) {
  const own = Object.keys(vars).filter((k) => !params.includes(k) && asText(vars[k]) !== null);
  const k = own.find((n) => PLAN.test(n)) ?? own.find((n) => QUEUE.test(n) && row(vars[n]));
  return k === undefined ? null : { name: k, text: asText(vars[k]), queue: !PLAN.test(k) };
}
/** the two adjacent words being compared, by value: an earlier variable holding words[i], a later one words[i + 1]
 * (the earliest such pair wins, so single-letter words are not confused with the letters a / b taken from them) */
function pairOf(vars, words) {
  const strs = Object.values(vars).map((v) => (typeof v === 'string' && words.includes(v) ? v : null));
  let best = null;
  for (let i = 0; i + 1 < words.length; i++) {
    const a = strs.indexOf(words[i]);
    if (a < 0) continue;
    const b = strs.findIndex((v, k) => k > a && v === words[i + 1]);
    if (b >= 0 && (!best || b < best.b)) best = { b, pair: [words[i], words[i + 1]] };
  }
  return best ? best.pair : null;
}
const firstDiff = (a, b) => {
  let j = 0;
  while (j < a.length && j < b.length && a[j] === b[j]) j++;
  return j;
};

export default {
  id: 'alien-dictionary',
  metaphor: 'Deciphering an alien alphabet',
  caption: 'Each pair of neighbouring words reveals at most one rule: at their first different letter, the upper word’s letter comes first. Rules are arrows; a letter joins the alphabet once every letter before it is placed.',
  narrate(ctx) {
    const wName = ctx.params[0];
    const words = ctx.input?.[0];
    if (!Array.isArray(words)) return null;
    const letters = new Set(words.join('')).size;
    const pair = pairOf(ctx.vars, words);
    if (ctx.ret && typeof ctx.value === 'string') {
      if (ctx.value) return `every letter is placed: the alien alphabet is ${q(ctx.value)}`;
      if (pair && pair[1].length < pair[0].length && pair[0].startsWith(pair[1])) return `${q(pair[0])} comes before its own prefix ${q(pair[1])}: no alphabet sorts that, return ""`;
      const plan = planOf(ctx.vars, ctx.params);
      return `${plan && !plan.queue ? `only ${plan.text.length} of ${letters} letters could be placed` : 'not every letter could be placed'}: the rules go round in a cycle, return ""`;
    }
    // a new rule
    const g = graphOf(ctx.vars, ctx.params);
    if (g) {
      const before = new Set((edgesOf(ctx.prev[g]) || []).map((e) => e.join('>')));
      const fresh = edgesOf(ctx.vars[g]).filter((e) => !before.has(e.join('>')));
      if (fresh.length === 1 && ctx.prev[g]) {
        const [a, b] = fresh[0];
        return `rule found: ${a} comes before ${b}${pair ? ` (first difference of ${q(pair[0])} and ${q(pair[1])})` : ''}`;
      }
    }
    // a letter is placed
    for (const k of Object.keys(ctx.vars).filter((n) => !ctx.params.includes(n) && (PLAN.test(n) || QUEUE.test(n)))) {
      const now = asText(ctx.vars[k]);
      const was = asText(ctx.prev[k]);
      if (now && was !== null && now.length === was.length + 1 && now.startsWith(was)) {
        const c = now[now.length - 1];
        const queued = !PLAN.test(k) || planOf(ctx.vars, ctx.params)?.name !== k;
        return queued ? `${c} has no unplaced letter before it: it waits in the queue to be placed` : `${c} has no unplaced letter before it: it is next in the alphabet (${now.split('').join(' ')})`;
      }
    }
    // a waiting count changes
    const d = degOf(ctx.vars, ctx.params);
    const cnow = d && countsOf(ctx.vars[d]);
    const cwas = d && countsOf(ctx.prev[d]);
    if (cnow && cwas) {
      const ch = [...cnow].filter(([k, x]) => cwas.has(k) && cwas.get(k) !== x);
      if (ch.length === 1) {
        const [c, x] = ch[0];
        if (x > cwas.get(c)) return `${c} now waits on ${x} letter${x === 1 ? '' : 's'} that must come first`;
        return `a letter before ${c} is placed: ${x === 0 ? `nothing left before ${c}` : `${c} still waits on ${x}`}`;
      }
    }
    // a new pair of words
    const was = pairOf(ctx.prev, words);
    if (pair && (!was || was[0] !== pair[0] || was[1] !== pair[1]) && ctx.vars[wName]) {
      return `compare ${q(pair[0])} with ${q(pair[1])}: only their first different letter tells us anything`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const words = ctx.input?.[0];
    if (!Array.isArray(words)) return null;
    // the run ends next: what does it return?
    if (ctx.next.ret && typeof ctx.next.value === 'string') {
      const pair = pairOf(ctx.vars, words);
      if (pair && firstDiff(pair[0], pair[1]) === Math.min(pair[0].length, pair[1].length) && ctx.next.value === '') {
        return {
          question: `No letter differs between ${q(pair[0])} and ${q(pair[1])} before one word runs out. What happens?`,
          options: ['Return "": a word sits before its own prefix', 'No rule here: move on to the next pair'],
          answer: 0,
          explain: `${q(pair[1])} is a prefix of ${q(pair[0])}, so it must come first in any alphabet. The list is not sorted under any order.`,
        };
      }
      const plan = planOf(ctx.vars, ctx.params);
      const letters = new Set(words.join('')).size;
      if (!plan || plan.queue) return null;
      const v = ctx.next.value;
      const opts = [...new Set([q(v), '""', q(plan.text), q([...new Set(words.join(''))].join(''))])];
      if (opts.length < 2) return null;
      return {
        question: `${plan.text.length} of the ${letters} letter${letters === 1 ? '' : 's'} ${plan.text.length === 1 ? 'was' : 'were'} placed. What does the run return?`,
        options: opts,
        answer: 0,
        explain: v ? `All ${letters} letters found a place, so the placement order is a valid alien alphabet.` : `Letters stuck in a cycle wait on each other forever and never get placed, so no alphabet exists: "".`,
      };
    }
    // the pair is a prefix in the right order: no rule, move on
    const pair = pairOf(ctx.vars, words);
    if (pair && pair[0].length <= pair[1].length && pair[1].startsWith(pair[0]) && /\bcontinue\b/.test(ctx.lines[ctx.next.line - 1] || '')) {
      return {
        question: `No letter differs between ${q(pair[0])} and ${q(pair[1])} before one word runs out. What happens?`,
        options: ['Return "": a word sits before its own prefix', 'No rule here: move on to the next pair'],
        answer: 1,
        explain: `${q(pair[0])} is the shorter word and comes first, which every alphabet allows. The pair teaches nothing.`,
      };
    }
    // a waiting count drops: is that letter free now?
    const d = degOf(ctx.vars, ctx.params);
    const cnow = d && countsOf(ctx.vars[d]);
    const cnext = d && countsOf(ctx.next.vars[d]);
    if (!cnow || !cnext) return null;
    const ch = [...cnext].filter(([k, x]) => cnow.has(k) && cnow.get(k) !== x);
    if (ch.length !== 1 || ch[0][1] >= cnow.get(ch[0][0])) return null;
    const [c, x] = ch[0];
    const placed = planOf(ctx.vars, ctx.params);
    if (cnow.get(c) < 2 && (!placed || placed.text.length > 1)) return null; // ask the easy 1 → 0 case only once, at the start
    return {
      question: `A letter that must come before ${c} was just placed. Can ${c} join the alphabet now?`,
      options: ['Yes: nothing unplaced comes before it', 'No: it still waits on another letter'],
      answer: x === 0 ? 0 : 1,
      explain: x === 0 ? `That was the last letter ${c} waited on (count → 0), so ${c} is free.` : `Its count drops ${cnow.get(c)} → ${x}: another rule still puts a letter before ${c}.`,
    };
  },
  bugs: [
    {
      label: 'Miss the prefix trap',
      find: "if (w1.length > w2.length) return '';",
      replace: '',
      explain: '"abc" before "ab" is impossible in any alphabet, but without the check the pair is just skipped and an alphabet is returned anyway.',
    },
    {
      label: 'Count a repeated rule twice',
      find: 'if (!adj.get(a).has(b)) {',
      replace: '{',
      explain: 'The Set keeps a repeated rule once, but its count goes up every time. When the earlier letter is placed the count drops only once, so the letter never becomes free.',
    },
  ],
};
