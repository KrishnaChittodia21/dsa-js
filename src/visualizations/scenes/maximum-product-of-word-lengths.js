// Maximum Product of Word Lengths: a panel of 26 letter lamps per word. Each word lights the lamps of its letters
// (mask |= 1 << letter), so "do two words share a letter?" becomes one AND of two masks: 0 means no lamp is lit in both.
// Follows the mask-building loop (a string plus a growing integer) and the pair scan (i/j-like indexes over the masks).
import { firstInt, row } from './util.js';

const PAIRS = [['i', 'j'], ['a', 'b'], ['x', 'y'], ['p', 'q'], ['i', 'k'], ['j', 'k'], ['l', 'r']];
const BEST = ['best', 'ans', 'res', 'result', 'max', 'maxProd', 'maxProduct', 'answer', 'maxP', 'product', 'prod'];
const letters = (m) => [...Array(26).keys()].filter((k) => (m >>> k) & 1).map((k) => String.fromCharCode(97 + k)).join('');
const isPow2 = (v) => v > 0 && (v & (v - 1)) === 0;

function scan(ctx) {
  const wName = ctx.params[0];
  const words = ctx.vars[wName];
  if (!Array.isArray(words) || !words.every((w) => typeof w === 'string')) return null;
  const masksName = Object.keys(ctx.vars).find((k) => k !== wName && row(ctx.vars[k]) && ctx.vars[k].length === words.length && ctx.vars[k].every(Number.isInteger));
  const pair = PAIRS.find(([a, b]) => Number.isInteger(ctx.vars[a]) && Number.isInteger(ctx.vars[b]) && ctx.vars[a] >= 0 && ctx.vars[a] < ctx.vars[b] && ctx.vars[b] < words.length);
  const skip = [wName, masksName, ...(pair || [])];
  const [bName] = firstInt(Object.fromEntries(Object.entries(ctx.vars).filter(([k]) => !skip.includes(k))), BEST);
  return { wName, words, masksName, masks: masksName ? ctx.vars[masksName] : null, pair, bName };
}

/** at the if that tests a pair just shown: 'keep' when the next step still shows that pair, 'skip' when it moved on */
function decision(ctx, s) {
  if (!ctx.next || !s.pair || !/\bif\b/.test(ctx.src || '')) return null;
  const [p, q] = s.pair;
  if (ctx.prev[p] === ctx.vars[p] && ctx.prev[q] === ctx.vars[q]) return null; // not a new pair
  const same = ctx.next.vars[p] === ctx.vars[p] && ctx.next.vars[q] === ctx.vars[q];
  if (same && /\b(if|continue)\b/.test(ctx.lines[ctx.next.line - 1] || '')) return null;
  return same ? 'keep' : 'skip';
}

/** [a, b] (with .masks) when the next step multiplies a new pair of the first word straight away (no if step shown for it) */
function nextKept(ctx, s) {
  if (!ctx.next || !s.bName) return null;
  const t = scan({ ...ctx, vars: ctx.next.vars });
  if (!t || !t.pair || !t.masks || t.bName !== s.bName) return null;
  const [a, b] = t.pair.map((k) => ctx.next.vars[k]);
  if (a !== 0 || (ctx.vars[t.pair[0]] === a && ctx.vars[t.pair[1]] === b)) return null;
  const line = ctx.lines[ctx.next.line - 1] || '';
  if (!new RegExp(`\\b${s.bName}\\s*=`).test(line) || /\bif\b/.test(line)) return null;
  return Object.assign([a, b], { masks: t.masks });
}

export default {
  id: 'maximum-product-of-word-lengths',
  metaphor: 'A panel of 26 letter lamps per word',
  caption: 'Every word lights the lamps of its letters (a = bit 0 … z = bit 25). Two words share no letter exactly when no lamp is lit on both panels: mask₁ & mask₂ = 0. Only those pairs may multiply their lengths.',
  compare: 'best',
  narrate(ctx) {
    const s = scan(ctx);
    if (!s) return null;
    const { wName, words, masks, pair, bName } = s;
    if (pair && masks) {
      const [a, b] = pair.map((k) => ctx.vars[k]);
      const shared = letters(masks[a] & masks[b]);
      const pa = `"${words[a]}" & "${words[b]}"`;
      if (bName && bName in ctx.prev && /=/.test(ctx.src || '') && new RegExp(`\\b${bName}\\s*=`).test(ctx.src || '')) {
        const p = words[a].length * words[b].length;
        const best = ctx.vars[bName];
        return `${pa} share no letter: ${words[a].length} × ${words[b].length} = ${p}${best === p && ctx.prev[bName] !== p ? `, the new best` : `, the best stays ${best}`}`;
      }
      const d = decision(ctx, s);
      if (d) {
        const lit = `"${words[a]}" lights ${letters(masks[a])}, "${words[b]}" lights ${letters(masks[b])}`;
        if (a === 0 && !nextKept(ctx, s)) return `${lit}: is any lamp lit on both?`; // a prediction may be asked here: no verdict
        if (d === 'keep') return shared ? `${pa} share ${shared}, yet the pair is kept` : `${lit}: no lamp on both, multiply the lengths`;
        return shared ? `${pa} both light ${shared.split('').join(', ')}: a shared letter, skip the pair` : `${pa} share no letter, yet the pair is skipped`;
      }
      return null;
    }
    // building one word's mask: a string and an integer that just gained one bit
    for (const [k, v] of Object.entries(ctx.vars)) {
      const pv = ctx.prev[k];
      if (!Number.isInteger(v) || !Number.isInteger(pv) || v === pv || (v & pv) !== pv || !isPow2(v ^ pv) || k === bName || /^(i|j|k|idx|index|pos|len|n)$/.test(k)) continue;
      const bit = 31 - Math.clz32(v ^ pv);
      const ch = String.fromCharCode(97 + bit);
      const word = Object.entries(ctx.vars).find(([n, w]) => n !== wName && typeof w === 'string' && w.length > 1 && w.includes(ch) && letters(v).split('').every((c) => w.includes(c)))?.[1];
      if (bit < 26 && word) return `"${word}": letter ${ch} lights lamp ${bit} → lit: ${letters(v)}`;
    }
    if (s.masksName && !(s.masksName in ctx.prev) && masks.length) return `every word is a set of lamps now: ${words.slice(0, 4).map((w, i) => `${w} → ${letters(masks[i])}`).join(', ')}${words.length > 4 ? ', …' : ''}`;
    if (ctx.ret && !ctx.next && typeof ctx.result === 'number') return ctx.result ? `the best letter-disjoint pair gives ${ctx.result}` : 'every pair shares a letter: the answer is 0';
    return null;
  },
  // the pair the next step shows: do the two words share a letter?
  predict(ctx) {
    const s = scan(ctx);
    if (!s) return null;
    const kept = nextKept(ctx, s);
    if (kept) {
      const [a, b] = kept;
      const w = s.words;
      return {
        question: `Next pair: "${w[a]}" (lights ${letters(kept.masks[a])}) and "${w[b]}" (lights ${letters(kept.masks[b])}). Are their lengths multiplied?`,
        options: ['Yes: no lamp is lit on both (AND = 0)', 'No: a lamp is lit on both'],
        answer: 0,
        explain: `The code goes straight to the product: ${w[a].length} × ${w[b].length} = ${w[a].length * w[b].length}. ${letters(kept.masks[a] & kept.masks[b]) ? 'They do share a letter, though!' : 'The AND of the two masks is 0.'}`,
      };
    }
    if (!s.pair || !s.masks) return null;
    const d = decision(ctx, s);
    const [a, b] = s.pair.map((k) => ctx.vars[k]);
    if (!d || a !== 0) return null;
    const w = s.words;
    const shared = letters(s.masks[a] & s.masks[b]);
    return {
      question: `"${w[a]}" lights ${letters(s.masks[a])}, "${w[b]}" lights ${letters(s.masks[b])}. Are their lengths multiplied?`,
      options: ['Yes: no lamp is lit on both (AND = 0)', 'No: a lamp is lit on both'],
      answer: d === 'keep' ? 0 : 1,
      explain: d === 'keep' ? (shared ? `They share ${shared}, yet the code kept the pair.` : `The AND of the two masks is 0, so ${w[a].length} × ${w[b].length} = ${w[a].length * w[b].length} is a candidate.`) : shared ? `Both light ${shared}: a shared letter, so the pair is skipped.` : 'No lamp is lit on both, yet the code skipped the pair.',
    };
  },
  bugs: [
    {
      label: 'Missing parentheses around the &',
      find: '(masks[i] & masks[j]) === 0',
      replace: 'masks[i] & masks[j] === 0',
      explain: '=== binds tighter than &, so this is masks[i] & (masks[j] === 0) = masks[i] & false = 0: every pair is skipped and the answer is 0.',
    },
    {
      label: 'Building the mask with + instead of |',
      find: 'm |= 1 << (w.charCodeAt(i) - 97)',
      replace: 'm += 1 << (w.charCodeAt(i) - 97)',
      explain: 'A repeated letter is added twice: "aa" gives 1 + 1 = 2, the lamp of b, so "aa" and "b" look like they share a letter.',
    },
  ],
};
