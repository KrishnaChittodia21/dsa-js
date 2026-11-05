// Encode and Decode Strings (length prefix). Each word is packed into a parcel with its size written on the label
// ("3#a#b"); unpacking reads the label, then takes exactly that many characters without looking at them.
// Works with an encoded string built as a list of parts or as a string, and any decoded list name.
import { options } from './util.js';

const strList = (v) => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null);
const quote = (w) => JSON.stringify(w);
// the encoded text: the longest string variable (decode's parameter, or the string encode is building)
function textOf(vars) {
  let best = null;
  for (const [k, v] of Object.entries(vars)) if (typeof v === 'string' && v.length > 1 && (!best || v.length > best[1].length)) best = [k, v];
  return best;
}
// a list of strings that gained exactly one word at the end: [name, word]
function newWord(vars, prev) {
  for (const [k, v] of Object.entries(vars)) {
    const a = strList(v);
    const b = strList(prev[k]);
    if (a && b && a.length === b.length + 1 && b.every((x, i) => x === a[i])) return [k, a[a.length - 1]];
  }
  return null;
}
// where in the text the word just read starts: an integer variable p with text[p] a non-digit label end
function startOf(vars, text, word) {
  for (const v of Object.values(vars)) {
    if (!Number.isInteger(v) || v < 0 || v >= text.length) continue;
    if (!/\d/.test(text[v]) && text.slice(v + 1, v + 1 + word.length) === word && /\d$/.test(text.slice(0, v))) return v + 1;
  }
  return -1;
}

export default {
  id: 'encode-and-decode-strings',
  metaphor: 'Parcels labelled with their size',
  caption: 'Encoding packs every word into a parcel with its length on the label, like "3#a#b". Decoding reads a label, then takes exactly that many characters, so a # inside a word is never mistaken for a label.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const words = strList(ctx.vars[sName]);
    // encode: the parts list or the string grows by one parcel
    const parts = Object.entries(ctx.vars).find(([k, v]) => k !== sName && Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' || Number.isInteger(x)) && Array.isArray(ctx.prev[k]));
    if (words && parts && parts[1].length > ctx.prev[parts[0]].length) {
      const added = parts[1].slice(ctx.prev[parts[0]].length).join('');
      const m = /^(\d+)(\D)/.exec(added);
      if (m) return `pack ${quote(added.slice(m[0].length))}: label ${m[1]}${m[2]}, then the word itself → ${quote(parts[1].join(''))}`;
    }
    if (words) {
      const t = textOf(ctx.vars);
      const was = t && ctx.prev[t[0]];
      if (t && typeof was === 'string' && t[1].startsWith(was) && t[1].length > was.length) {
        const added = t[1].slice(was.length);
        const m = /^(\d+)(\D)/.exec(added);
        if (m) return `pack ${quote(added.slice(m[0].length))}: label ${m[1]}${m[2]}, then the word itself → ${quote(t[1])}`;
      }
    }
    // decode
    const nw = newWord(ctx.vars, ctx.prev);
    const t = textOf(ctx.vars);
    if (nw && t) {
      const n = nw[1].length;
      return `the label says ${n}: take the next ${n} character${n === 1 ? ' as it is' : 's as they are'} → ${quote(nw[1])} (word ${strList(ctx.vars[nw[0]]).length})`;
    }
    if (!t || words) return null;
    const moved = Object.keys(ctx.vars).find((k) => Number.isInteger(ctx.vars[k]) && k in ctx.prev && ctx.vars[k] > ctx.prev[k] && Number.isInteger(ctx.prev[k]) && !Object.keys(ctx.prev).some((o) => o !== k && ctx.prev[o] === ctx.vars[k]));
    const v = moved && ctx.vars[moved];
    if (moved && v === t[1].length) return 'past the last word: the whole text is unpacked';
    if (moved && /\d/.test(t[1][v] || '') && !/\d/.test(t[1][v - 1])) return `skip over the word without reading it: the next label starts at position ${v}`;
    // the label's end: a separator right after a run of digits that starts where another variable (the read position) points
    const ints = Object.keys(ctx.vars).filter((k) => Number.isInteger(ctx.vars[k]));
    const end = ints.find((k) => {
      const e = ctx.vars[k];
      const digits = (t[1].slice(0, e).match(/\d+$/) || [''])[0];
      return e !== ctx.prev[k] && digits && !/\d/.test(t[1][e] || '0') && ints.some((j) => j !== k && ctx.vars[j] === e - digits.length);
    });
    if (end) return `the label ends at the ${t[1][ctx.vars[end]]} at position ${ctx.vars[end]}`;
    return null;
  },
  // before a word is unpacked: which word comes out?
  predict(ctx) {
    if (!ctx.next) return null;
    const nw = newWord(ctx.next.vars, ctx.vars);
    const t = textOf(ctx.vars);
    if (!nw || !t) return null;
    const word = nw[1];
    const at = startOf(ctx.vars, t[1], word);
    if (at < 0) return null;
    const sep = t[1][at - 1];
    const cut = t[1].indexOf(sep, at);
    const wrong = [t[1].slice(at, cut < 0 ? t[1].length : cut), t[1].slice(at - 1, at - 1 + word.length), t[1].slice(at, at + word.length + 1)];
    const label = (/\d+$/.exec(t[1].slice(0, at - 1)) || [''])[0];
    return options(
      `The label ${quote(label + sep)} has just been read from ${quote(t[1])}. Which word is unpacked next?`,
      quote(word),
      wrong.filter((w) => w !== word).map(quote),
      `The label says ${word.length}, so exactly the next ${word.length} characters are the word${word.includes(sep) ? `, even the ${sep} inside it` : ''}: ${quote(word)}.`,
    );
  },
  bugs: [
    {
      label: 'Start reading at the # itself',
      find: 'out.push(s.slice(hash + 1, hash + 1 + len));',
      replace: 'out.push(s.slice(hash, hash + len));',
      explain: 'The word is read one character too early: every word starts with the label\'s # and loses its own last character.',
    },
    {
      label: 'Next label read one character early',
      find: 'i = hash + 1 + len;',
      replace: 'i = hash + len;',
      explain: 'After a word, the next label is looked for one character too early, so the last letter of the word is read as part of the next label and the rest falls apart.',
    },
  ],
};
