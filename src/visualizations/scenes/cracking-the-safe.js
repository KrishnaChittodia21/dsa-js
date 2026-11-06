// Cracking the Safe (de Bruijn sequence, Euler walk). A state is the last n − 1 digits typed; typing a digit d
// tries the password state + d and moves to its last n − 1 digits. Each password must be typed once. Hierholzer
// writes a digit when its walk is stuck (post-order); the greedy version appends a digit whenever the newest n
// digits are a new password. Works with a used / seen Set of passwords and a digit list or a growing string.
import { options } from './util.js';

const USED = /used|seen|visited|vis|done|tried/i;
const isStr = (v) => typeof v === 'string';
const usedOf = (vars) => Object.keys(vars).find((k) => USED.test(k) && vars[k] && vars[k].$set);

/** the password being tried: a string of n digits assigned on this line */
function candidate(ctx) {
  const n = ctx.vars[ctx.params[0]];
  if (!Number.isInteger(n)) return null;
  const k = Object.keys(ctx.vars).find((x) => !ctx.params.includes(x) && isStr(ctx.vars[x]) && ctx.vars[x].length === n && /^\d+$/.test(ctx.vars[x]) && new RegExp(`\\b${x}\\s*=[^=]`).test(ctx.src || ''));
  return k ? [k, ctx.vars[k]] : null;
}
/** the collected answer: a digit list or a digit string that grew by one at the end since the last step */
function grown(vars, prev, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    const p = prev[k];
    if (Array.isArray(v) && Array.isArray(p) && v.length === p.length + 1 && v.slice(0, -1).every((x, i) => x === p[i]) && /^\d$/.test(String(v[v.length - 1]))) return { name: k, d: v[v.length - 1], all: v.join(''), list: true };
    if (isStr(v) && isStr(p) && v.length === p.length + 1 && v.startsWith(p) && /^\d$/.test(v[v.length - 1]) && /^\d+$/.test(v)) return { name: k, d: v[v.length - 1], all: v, list: false };
  }
  return null;
}

export default {
  id: 'cracking-the-safe',
  metaphor: 'Typing every code on one keypad',
  caption: 'The safe checks the last n digits typed. A state is the last n − 1 digits; typing digit d tries the code state + d. Each code is one road between states, and the walk must use every road exactly once.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const [nName, kName] = params;
    const n = vars[nName], k = vars[kName];
    const total = Number.isInteger(n) && Number.isInteger(k) ? k ** n : null;
    if (ctx.ret && !ctx.next && isStr(ctx.value)) {
      return `the answer: "${ctx.value}", ${ctx.value.length} digits${total !== null ? ` = ${total} code${total === 1 ? '' : 's'} + ${n - 1} starting digit${n === 2 ? '' : 's'}` : ''}`;
    }
    const uName = usedOf(vars);
    const u = uName && vars[uName], pu = uName && prev[uName];
    if (u && pu && pu.$set && u.$size === pu.$size + 1) {
      const pw = u.$set.find((x) => !pu.$set.includes(x)) ?? null;
      if (isStr(pw)) return `code "${pw}" is new: use it and walk to state "${pw.slice(1)}" (${u.$size}${total ? ` of ${total}` : ''} codes used)`;
    }
    const g = grown(vars, prev, params);
    if (g) {
      if (g.list) {
        const pw = Object.entries(vars).find(([x, v]) => !params.includes(x) && isStr(v) && v.length === n && /^\d+$/.test(v) && v.endsWith(String(g.d)))?.[1];
        return `${pw ? `every road after code "${pw}" is used up` : 'this walk is used up'}: write its digit ${g.d} (digits so far: ${g.all})`;
      }
      return `append ${g.d}: "${g.all}"; its last ${n} digits form a code not typed before`;
    }
    const c = candidate(ctx);
    if (c && u) {
      const st = c[1].slice(0, -1);
      return `from state "${st}" try digit ${c[1].slice(-1)}: code "${c[1]}"`;
    }
    return null;
  },
  // a code is formed: has it been typed before?
  predict(ctx) {
    if (!ctx.next) return null;
    const c = candidate(ctx);
    const uName = usedOf(ctx.vars);
    if (!c || !uName) return null;
    const u = ctx.vars[uName], nu = ctx.next.vars[uName];
    if (!nu || !nu.$set) return null;
    const [cName, pw] = c;
    let fresh;
    if (nu.$size === u.$size + 1) fresh = true;
    else if (nu.$size === u.$size && (/has\(|continue/.test(ctx.lines[ctx.next.line - 1] || '') || (ctx.next.vars[cName] !== undefined && ctx.next.vars[cName] !== pw))) fresh = false;
    else return null;
    // only the start of the run is interesting: once most codes are used the answer is nearly always "used"
    if (u.$size > (ctx.vars[ctx.params[1]] ?? 2) * 2) return null;
    return options(
      `From state "${pw.slice(0, -1)}", digit ${pw.slice(-1)} makes the code "${pw}". What happens?`,
      fresh ? 'New code: use it and move on' : 'Already typed: try the next digit',
      [fresh ? 'Already typed: try the next digit' : 'New code: use it and move on'],
      fresh ? `"${pw}" is not in the used set yet, so it is typed now and the walk moves to state "${pw.slice(1)}".` : `"${pw}" is already in the used set: typing it again would waste a digit, so this road is skipped.`,
    );
  },
  bugs: [
    {
      label: 'Write the digit before the walk (pre-order)',
      find: 'visit(password.slice(1));    // next state = last n − 1 digits\n      digits.push(d);',
      replace: 'digits.push(d);\n      visit(password.slice(1));',
      explain: 'Digits are written in the order roads are first tried, so a walk that gets stuck and backs out leaves its digits in the wrong place: some codes never appear in the string.',
    },
    {
      label: 'Forget the n − 1 starting digits',
      find: "return digits.join('') + start;",
      replace: "return digits.join('');",
      explain: 'Each digit only completes a code together with the n − 1 digits before it; without the starting digits the first codes are cut short and the string is n − 1 digits too short.',
    },
  ],
};
