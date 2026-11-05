// "Animate my run" (M4): rewrites user code so every statement inside a function reports the variables in scope.
// After each statement (before a `return`/`break`/`continue`/`throw`) it inserts `__rec(line, [["name", () => name], …])`.
// The list holds every variable declared in the enclosing functions; one that is not in scope yet throws when
// read, and the recorder skips it. Nothing inserted contains a newline, so line numbers in errors stay the user's.
// Parser: @lezer/javascript, already shipped with the code editor (no extra dependency).
import { parser } from '@lezer/javascript';

const FUNCS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunction', 'MethodDeclaration']);
// IfStatement: a condition-only line like `if (!uf.union(a, b)) return false;` changes state too (recorded "quiet")
const LATE = 1e9; // insert-order bonus: an if statement's record call goes after everything else at its end
const AFTER = new Set(['ExpressionStatement', 'VariableDeclaration', 'IfStatement']);
const BEFORE = new Set(['ReturnStatement', 'BreakStatement', 'ContinueStatement', 'ThrowStatement']);
const LIST_OK = new Set(['Block', 'Script']); // statement lists where code can be added next to a statement

/** names declared directly in this function (params and declarations), not inside functions nested in it */
function ownNames(fn, code) {
  const names = [];
  const visit = (n) => {
    if (FUNCS.has(n.name) || n.name === 'ClassDeclaration' || n.name === 'ClassExpression') return;
    if (n.name === 'VariableDefinition') names.push(code.slice(n.from, n.to));
    for (let c = n.firstChild; c; c = c.nextSibling) visit(c);
  };
  for (let c = fn.firstChild; c; c = c.nextSibling) {
    // a direct VariableDefinition is the function's own name (outer scope), except an arrow's lone param `x => …`
    if (c.name === 'VariableDefinition' && fn.name !== 'ArrowFunction') continue;
    visit(c);
  }
  return [...new Set(names)];
}

export function instrument(code) {
  const tree = parser.parse(code);
  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (pos) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const namesOf = new Map(); // function node start → its own names
  const inserts = []; // [pos, text]
  const cursor = tree.cursor();
  do {
    const node = cursor.node;
    const after = AFTER.has(node.name);
    if (!after && !BEFORE.has(node.name)) continue;
    const parent = node.parent;
    if (!parent || parent.name === 'ForSpec') continue; // `for (let i = 0; …)` header
    if (node.name === 'IfStatement' && parent.name === 'IfStatement') continue; // `else if`: the outer if records
    // the enclosing functions, innermost first; top-level code (outside any function) is not recorded
    const fns = [];
    for (let p = parent; p; p = p.parent) if (FUNCS.has(p.name)) fns.push(p);
    if (!fns.length) continue;
    const vars = [];
    for (const fn of fns) {
      if (!namesOf.has(fn.from)) namesOf.set(fn.from, ownNames(fn, code));
      for (const n of namesOf.get(fn.from)) if (!vars.includes(n)) vars.push(n);
    }
    const list = vars.map((n) => `[${JSON.stringify(n)},()=>${n}]`);
    // `this` in a class method (design questions), when only arrow functions sit between it and the statement
    const firstPlain = fns.find((f) => f.name !== 'ArrowFunction');
    if (firstPlain?.name === 'MethodDeclaration') list.push('["this",()=>this]');
    const call = `__rec(${lineOf(node.from)},[${list.join(',')}]${node.name === 'IfStatement' ? ',1' : node.name === 'ReturnStatement' ? ',2' : ''});`;
    const bare = !LIST_OK.has(parent.name); // e.g. the body of `if (x) a++;` — wrap it in braces
    if (node.name === 'IfStatement') {
      // after the whole if, including a braces-wrap its own body got at the same position (late = goes last)
      if (bare) inserts.push([node.from, '{'], [node.to, `;${call}}`, LATE]);
      else inserts.push([node.to, `;${call}`, LATE]);
    } else if (after) {
      if (bare) inserts.push([node.from, '{'], [node.to, `;${call}}`]);
      else inserts.push([node.to, `;${call}`]);
    } else if (bare) inserts.push([node.from, `{${call}`], [node.to, '}']);
    else inserts.push([node.from, call]);
  } while (cursor.next());

  // apply from the end so earlier positions stay valid; at one position the later insert goes in first, so the
  // texts end up in the order they were added (`a++;b++` → a's record call, then b's)
  const order = inserts.map((x, i) => [x[0], x[1], i + (x[2] || 0)]).sort((a, b) => b[0] - a[0] || b[2] - a[2]);
  let out = code;
  for (const [pos, text] of order) out = out.slice(0, pos) + text + out.slice(pos);
  return out;
}
