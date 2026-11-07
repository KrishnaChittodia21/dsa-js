// Accounts Merge (union-find over accounts or over emails, or DFS). Accounts that share an email are one person:
// a shared email glues their groups together. Reads a parent row over account indexes (parent / par / fa…, or a
// toolkit UnionFind), or a parent Map over emails (email → email), the email on screen and an owner-like Map.
import { entriesOf, row } from './util.js';

const PARENT = /^(parent|parents|par|p|root|roots|fa|leader|boss|uf|dsu|ds)$/i;
const EMAIL = ['email', 'mail', 'e', 'em', 'addr', 'address'];

/** the union-find: { kind: 'row', p } over account indexes, or { kind: 'map', m } over emails */
function ufOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    const o = v && v.$obj;
    const cands = PARENT.test(k) ? [v] : [];
    if (o) for (const f of ['parent', 'parents', 'par', 'root', 'p', 'fa']) if (f in o) cands.push(o[f]);
    for (const c of cands) {
      if (row(c) && c.length && c.every(Number.isInteger)) return { kind: 'row', p: c };
      if (c && c.$map && c.$map.every(([a, b]) => typeof a === 'string' && typeof b === 'string')) return { kind: 'map', m: new Map(c.$map) };
    }
  }
  return null;
}
function leader(uf, x) {
  const get = (y) => (uf.kind === 'row' ? uf.p[y] : uf.m.get(y));
  const seen = new Set();
  while (get(x) !== undefined && get(x) !== x && !seen.has(x)) {
    seen.add(x);
    x = get(x);
  }
  return x;
}
const keysOf = (uf) => (uf.kind === 'row' ? uf.p.map((_, i) => i) : [...uf.m.keys()]);
const people = (uf) => keysOf(uf).filter((k) => leader(uf, k) === k).length;
/** keys whose leader changed between two snapshots of the same union-find (only keys present in both) */
function moved(a, b) {
  if (!a || !b || a.kind !== b.kind) return [];
  return keysOf(b).filter((k) => (a.kind === 'row' ? k < a.p.length : a.m.has(k)) && leader(a, k) !== leader(b, k));
}
const emailName = (vars) => EMAIL.find((k) => typeof vars[k] === 'string' && vars[k].includes('@'));
const emailOf = (vars) => vars[emailName(vars)];
/** this step's line hands out the next email (`const email = acc[k]`, `for (const email of …)`) */
const arrives = (ctx) => !!emailName(ctx.vars) && new RegExp(`\\b${emailName(ctx.vars)}\\s*(=[^=]|of\\b)`).test(ctx.src);
/** the non-parent Maps keyed by emails (owner / emailToId / emailToName …) */
const ownersOf = (ctx, vars) => Object.entries(vars).filter(([k, v]) => !PARENT.test(k) && !ctx.params.includes(k) && v && v.$map && v.$map.length && typeof v.$map[0][0] === 'string' && v.$map.every(([, x]) => x === null || typeof x !== 'object'));
const hasKey = (ctx, vars, email) => ownersOf(ctx, vars).some(([, v]) => v.$map.some(([k]) => k === email)) || ufOf(vars)?.m?.has(email);
const s = (k) => (k === 1 ? '' : 's');

export default {
  id: 'accounts-merge',
  metaphor: 'Accounts glued together by shared emails',
  caption: 'Each tree in the forest is one person, its root the account (or email) that leads the group. An email seen in two accounts glues their groups together; the same name alone never does.',
  narrate(ctx) {
    const [aName] = ctx.params;
    const accounts = ctx.vars[aName] ?? ctx.input?.[0];
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) return `${ctx.value.length} ${ctx.value.length === 1 ? 'person' : 'people'} after gluing: each gets their name and their emails, sorted`;
    const uf = ufOf(ctx.vars);
    const puf = ufOf(ctx.prev);
    const acct = (i) => (Array.isArray(accounts?.[i]) ? `account ${i} (${accounts[i][0]})` : `account ${i}`);
    if (uf && puf && uf.kind === puf.kind) {
      const mv = moved(puf, uf);
      if (mv.length) {
        const k = people(uf);
        const lead = leader(uf, mv[0]);
        if (uf.kind === 'row') return `a shared email glues two groups: ${acct(mv[0])} now follows ${acct(lead)}: ${k} ${k === 1 ? 'person' : 'people'} left`;
        return `${mv[0]} joins ${lead}'s group: they belong to one person`;
      }
    }
    const email = emailOf(ctx.vars);
    const i0 = ctx.vars.i;
    if (email && uf?.kind === 'row' && /\bfind\b|\broot\b/.test(ctx.src) && Number.isInteger(i0)) return `${email} goes to the person led by ${acct(leader(uf, i0))}`;
    if (email && arrives(ctx)) {
      const i = Number.isInteger(ctx.vars.i) ? ctx.vars.i : undefined;
      if (aName in ctx.vars) return `${i !== undefined ? `${acct(i)} lists` : 'next email:'} ${email}`;
    }
    if (email) {
      const added = ownersOf(ctx, ctx.vars).find(([k, v]) => {
        const before = ctx.prev[k];
        return before && before.$map && v.$size === before.$size + 1 && v.$map.some(([key]) => key === email);
      });
      if (added) {
        const val = added[1].$map.find(([key]) => key === email)[1];
        return `${email} is new: ${Number.isInteger(val) ? acct(val) : `${val}`} owns it for now`;
      }
    }
    const res = Object.entries(ctx.vars).find(([k, v]) => /^(result|res|ans|answer|out|merged)$/i.test(k) && Array.isArray(v));
    if (res && Array.isArray(ctx.prev[res[0]]) && res[1].length === ctx.prev[res[0]].length + 1) {
      const p = res[1].at(-1);
      if (row(p) && p.length) return `person ${res[1].length}: ${p[0]} with ${p.length - 1} email${s(p.length - 1)}, sorted`;
    }
    return null;
  },
  // an email that appears in two accounts has just arrived: is it new, or does it glue two accounts?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const email = emailOf(ctx.vars);
    if (!email || !arrives(ctx) || emailOf(nx.vars) !== email && moved(ufOf(ctx.vars), ufOf(nx.vars)).length === 0 && !hasKey(ctx, nx.vars, email)) return null;
    const input = ctx.input?.[0];
    if (!Array.isArray(input) || input.filter((a) => Array.isArray(a) && a.slice(1).includes(email)).length < 2) return null;
    const uf = ufOf(ctx.vars);
    const nuf = ufOf(nx.vars);
    if (!uf || !nuf) return null;
    const glued = moved(uf, nuf).length > 0;
    const fresh = !glued && !hasKey(ctx, ctx.vars, email) && hasKey(ctx, nx.vars, email);
    const same = !glued && !fresh && hasKey(ctx, ctx.vars, email) && emailOf(nx.vars) !== email;
    if (!glued && !fresh && !same) return null;
    // "new" is asked once: for the first email (in input order) that several accounts share
    const shared = input.flatMap((a) => (Array.isArray(a) ? a.slice(1) : [])).find((e) => input.filter((a) => Array.isArray(a) && a.slice(1).includes(e)).length > 1);
    if (fresh && email !== shared) return null;
    const answer = glued ? 0 : fresh ? 1 : 2;
    return {
      question: `${email} is listed by more than one account. What happens with it at this point?`,
      options: ['It glues two groups into one person', 'It is new: this account just takes it', 'Nothing: both accounts are already one person'],
      answer,
      explain: [
        `${email} was already seen in another account, so the two groups are glued: same email, same person.`,
        `No account has listed ${email} yet, so it is only recorded; the glue happens when another account lists it.`,
        `${email} was seen before, but both accounts already lead to the same group, so nothing changes.`,
      ][answer],
    };
  },
  bugs: [
    {
      label: 'Merge accounts by name',
      find: 'if (owner.has(email)) uf.union(i, owner.get(email));',
      replace: 'const same = accounts.findIndex((a) => a[0] === acc[0]); uf.union(i, same); if (!owner.has(email)) owner.set(email, i);',
      explain: 'Two different people called John are glued together although they share no email: one person with everyone\'s addresses.',
    },
    {
      label: 'Sort with localeCompare',
      find: 'emails.sort();',
      replace: 'emails.sort((a, b) => a.localeCompare(b));',
      explain: 'The expected order is plain string order ("Z@m" before "_x@m" before "a@m"); localeCompare orders letters and symbols differently.',
    },
  ],
};
