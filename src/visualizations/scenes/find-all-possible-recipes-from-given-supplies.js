// Find All Possible Recipes: a kitchen shelf starts with the supplies; each recipe counts the ingredients it still
// misses, and when the count reaches 0 it is cooked and put on the shelf too, so recipes that need it can move on
// (Kahn's topological sort over names). Works with a missing-count array by recipe index or a Map / object by
// recipe name, a queue (head index or shift) and a made / result list; DFS solutions fall back to generic notes.
import { changedIdx, entriesOf, itemsOf, row } from './util.js';

const NEED = /need|indeg|in_?degree|^deg|miss|count|left|remain|req|pending/i;
const SHELF = /queue|^q$|avail|shelf|ready|have|stock|pantry/i;
const MADE = /made|^res|result|^ans|cooked|out|can/i;
const ITEM = ['item', 'cur', 'curr', 'ing', 'ingredient', 'food', 'name', 'supply', 'x', 's', 'got'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const strings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** recipe name → missing count, from a row by recipe index or a Map / object by name */
function needOf(vars, params, recipes) {
  for (const k of Object.keys(vars)) {
    if (params.includes(k) || !NEED.test(k)) continue;
    const v = vars[k];
    if (row(v) && v.length > 0 && v.every(Number.isInteger) && strings(recipes) && v.length === recipes.length) return [k, new Map(v.map((c, i) => [recipes[i], c]))];
    const e = entriesOf(v);
    if (e && e.length > 0 && e.every(([, c]) => Number.isInteger(c))) return [k, new Map(e.map(([r, c]) => [String(r), c]))];
  }
  return [null, null];
}
const listOf = (vars, params, re) => Object.keys(vars).find((k) => !params.includes(k) && re.test(k) && strings(itemsOf(vars[k])));
const itemOf = (vars, params) => ITEM.find((k) => !params.includes(k) && typeof vars[k] === 'string');
/** the ingredient being handed out now: a string variable, or the shelf item at a head index */
function arrivedOf(vars, params) {
  const k = itemOf(vars, params);
  if (k) return vars[k];
  const sName = listOf(vars, params, SHELF);
  const head = ['head', 'h', 'front', 'ptr', 'qi'].find((x) => Number.isInteger(vars[x]));
  const shelf = sName && itemsOf(vars[sName]);
  return shelf && head ? shelf[vars[head]] ?? null : null;
}

/** the one recipe whose missing count dropped between two maps */
function dropped(now, before) {
  if (!now || !before) return null;
  const ch = [...now].filter(([r, c]) => before.has(r) && c < before.get(r));
  return ch.length === 1 ? ch[0][0] : null;
}

export default {
  id: 'find-all-possible-recipes-from-given-supplies',
  metaphor: 'A kitchen shelf that grows as you cook',
  caption: 'The shelf starts with the supplies. Each recipe counts the ingredients it still misses; when that hits 0 it is cooked and goes on the shelf, so recipes that use it can progress. Recipes stuck in a loop never reach 0.',
  narrate(ctx) {
    const { vars, prev, params, input } = ctx;
    const recipes = input?.[0];
    if (ctx.ret && !ctx.next && strings(ctx.value)) {
      const stuck = strings(recipes) ? recipes.filter((x) => !ctx.value.includes(x)) : [];
      const tail = stuck.length ? `; ${stuck.join(', ')} never get every ingredient` : '';
      return ctx.value.length ? `${plural(ctx.value.length, 'recipe')} cooked: ${ctx.value.join(', ')}${tail}` : `nothing could be cooked${tail}`;
    }
    const [nName, need] = needOf(vars, params, recipes);
    const [, needBefore] = nName && nName in prev ? needOf(prev, params, recipes) : [null, null];
    const mName = listOf(vars, params, MADE);
    const made = mName && itemsOf(vars[mName]);
    const madeBefore = mName && itemsOf(prev[mName]);
    const sName = listOf(vars, params, SHELF);
    const shelf = sName && itemsOf(vars[sName]);
    const shelfBefore = sName && itemsOf(prev[sName]);
    const item = itemOf(vars, params);

    if (made && madeBefore && made.length === madeBefore.length + 1) return `${made[made.length - 1]} has every ingredient: cook it (${made.length} cooked)`;
    if (shelf && !shelfBefore && shelf.length > 0) return `the shelf starts with the supplies: ${shelf.join(', ')}`;
    if (shelf && shelfBefore && shelf.length === shelfBefore.length + 1) {
      const r = shelf[shelf.length - 1];
      return strings(recipes) && recipes.includes(r) ? `${r} goes on the shelf: recipes that use it can move on` : `${r} is on the shelf`;
    }
    const r = dropped(need, needBefore);
    if (r !== null) {
      const c = need.get(r);
      const got = arrivedOf(vars, params);
      return `${got ? `${got} is on the shelf` : 'one more ingredient is ready'}: ${r} ${c === 0 ? 'has everything now' : `still misses ${plural(c, 'ingredient')}`}`;
    }
    if (need && needBefore && need.size === needBefore.size + 1) {
      const [x, c] = [...need].find(([k]) => !needBefore.has(k));
      return `${x} needs ${plural(c, 'ingredient')} before it can be cooked`;
    }
    if (need && !needBefore && strings(recipes)) return `each recipe counts what it misses: ${[...need].map(([x, c]) => `${x} ${c}`).join(', ')}`;
    const head = ['head', 'h', 'i', 'idx'].find((k) => Number.isInteger(vars[k]) && Number.isInteger(prev[k]) && vars[k] !== prev[k]);
    if (shelf && item && vars[item] !== prev[item] && (!head || shelf[vars[head]] === vars[item])) return `take ${vars[item]} from the shelf: tell every recipe that uses it`;
    return null;
  },
  // before a missing count goes down: can that recipe be cooked now?
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params, input } = ctx;
    const recipes = input?.[0];
    const [, need] = needOf(vars, params, recipes);
    const [, next] = needOf(ctx.next.vars, params, recipes);
    const r = dropped(next, need);
    if (r === null) return null;
    const idx = strings(recipes) ? recipes.indexOf(r) : -1;
    // a recipe with one ingredient is always ready at its first drop: not worth a question
    if (idx < 0 || !Array.isArray(input?.[1]?.[idx]) || input[1][idx].length < 2) return null;
    const ready = next.get(r) === 0;
    const got = arrivedOf(ctx.next.vars, params);
    return {
      question: `${got && input[1][idx].includes(got) ? `${got} is on the shelf, and ${r} needs ${input[1][idx].join(', ')}` : `One of ${r}'s ingredients (${input[1][idx].join(', ')}) is now on the shelf`}. Can ${r} be cooked now?`,
      options: ['Yes: nothing is missing', 'No: it still misses something'],
      answer: ready ? 0 : 1,
      explain: ready ? `That was the last missing ingredient (count ${need.get(r)} → 0).` : `Its count drops ${need.get(r)} → ${next.get(r)}: every ingredient is needed, not just some.`,
    };
  },
  bugs: [
    {
      label: 'Forget to shelve a cooked recipe',
      find: 'queue.push(recipes[i]);',
      replace: '',
      explain: 'Bread gets cooked but never goes on the shelf, so a sandwich that needs bread keeps missing it and is never made.',
    },
    {
      label: 'Cook as soon as one ingredient is ready',
      find: '--need[i] === 0',
      replace: '--need[i] >= 0',
      explain: 'A recipe is cooked when any ingredient arrives, so bread is "made" from yeast alone (and can be cooked twice).',
    },
  ],
};
