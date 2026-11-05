// Group Anagrams (hash map keyed by a letter signature). Every word gets a label made of its letters, in order;
// words with the same label land in the same mailbox. Works with a sorted-letters key or a 26-count key, and any
// name for the label → words Map.
import { options } from './util.js';

const WORD = ['s', 'word', 'str', 'w', 'st', 'x'];
const KEY = ['key', 'k', 'sig', 'signature', 'sorted', 'id', 'hash', 'code'];
// the label → words Map: a $map whose values are arrays of strings
const boxesOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => Array.isArray(e[1]) && e[1].every((x) => typeof x === 'string')));
const asMap = (v) => new Map(v && Array.isArray(v.$map) ? v.$map : []);
const strOf = (vars, names) => names.find((n) => typeof vars[n] === 'string');
// a readable label: a 26-count key ("1#0#…") becomes its letters ("aet"); a sorted-letters key stays as it is
function label(key) {
  const parts = String(key).split(/[#,|-]/);
  if (parts.length === 26 && parts.every((p) => /^\d+$/.test(p))) return parts.map((c, i) => String.fromCharCode(97 + i).repeat(+c)).join('') || '(empty)';
  return String(key) || '(empty)';
}
// the label really belongs to this word (guards against a stale key from the previous word)
const fresh = (ctx, kName, wName) => (ctx.vars[kName] !== ctx.prev[kName] || ctx.vars[wName] !== ctx.prev[wName]) && label(ctx.vars[kName]) === ([...ctx.vars[wName]].sort().join('') || '(empty)');
const words = (a) => `[${a.map((w) => w || '""').join(', ')}]`;

export default {
  id: 'group-anagrams',
  metaphor: 'Mailboxes labelled by sorted letters',
  caption: 'Each word gets a label: its letters in alphabetical order (here possibly stored as 26 letter counts). Words with the same label are anagrams and drop into the same mailbox.',
  narrate(ctx) {
    const b = boxesOf(ctx.vars);
    if (!b) return null;
    const now = asMap(b[1]);
    const was = asMap(ctx.prev[b[0]]);
    for (const [k, list] of now) {
      const old = was.get(k);
      if (!old) return `no mailbox for label "${label(k)}" yet: open a new one${list.length ? ` holding ${words(list)}` : ''} (${now.size} box${now.size > 1 ? 'es' : ''})`;
      if (list.length === old.length + 1) return `"${list[list.length - 1]}" drops into the "${label(k)}" mailbox → ${words(list)}`;
    }
    const kName = strOf(ctx.vars, KEY);
    const wName = strOf(ctx.vars, WORD);
    if (kName && wName && fresh(ctx, kName, wName)) return `"${ctx.vars[wName]}" gets the label "${label(ctx.vars[kName])}": its letters in order, whatever order they came in`;
    return null;
  },
  // the label is ready: is there already a mailbox for it?
  predict(ctx) {
    const b = boxesOf(ctx.vars);
    const kName = strOf(ctx.vars, KEY);
    const wName = strOf(ctx.vars, WORD);
    if (!b || !kName || !wName || !ctx.next || !fresh(ctx, kName, wName)) return null;
    const now = asMap(b[1]);
    const after = asMap(ctx.next.vars[b[0]]);
    const key = ctx.vars[kName];
    const w = ctx.vars[wName];
    const opened = after.size === now.size + 1 && after.has(key) && !now.has(key);
    const joined = now.has(key) && after.size === now.size && (after.get(key) || []).length === now.get(key).length + 1;
    if (!opened && !joined) return null;
    const join = `It joins an existing mailbox`;
    const open = `A new mailbox is opened`;
    const list = now.get(key);
    return options(`"${w}" has the label "${label(key)}". Mailboxes so far: ${now.size ? [...now.keys()].map(label).join(', ') : 'none'}. What happens?`, opened ? open : join, [opened ? join : open], opened ? `No earlier word has the letters "${label(key)}", so "${w}" starts a new group.` : `${words(list)} already ${list.length > 1 ? 'have' : 'has'} the label "${label(key)}": same letters, so "${w}" is an anagram of ${list.length > 1 ? 'them' : 'it'}.`);
  },
  bugs: [
    {
      label: 'Counts joined without a separator',
      find: "count.join('#')",
      replace: "count.join('')",
      explain: 'Counts a:1, b:11 and a:11, b:1 both become "111…", so words with different letters share a mailbox.',
    },
    {
      label: 'A new mailbox for every word',
      find: 'if (!groups.has(key)) groups.set(key, []);',
      replace: 'groups.set(key, []);',
      explain: 'The box is replaced each time, so only the last word with each label survives and anagrams are lost.',
    },
  ],
};
