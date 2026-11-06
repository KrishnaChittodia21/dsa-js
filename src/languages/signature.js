// M6: typed signatures → Java / C++ starter code. A question carries `paramTypes` + `returnType` (functions) or
// `methodTypes` (design classes, and classes like Codec: { constructor?: { params }, name: { params, returns } });
// the parameter NAMES come from the JS starter, so the three languages always agree.
// Type vocabulary: int long double boolean char string void ListNode TreeNode Node, and arrays of them (int[][]).

export const LANGUAGES = [
  { id: 'js', label: 'JavaScript', short: 'JS' },
  { id: 'java', label: 'Java', short: 'Java' },
  { id: 'cpp', label: 'C++', short: 'C++' },
];

const BASE = new Set(['int', 'long', 'double', 'boolean', 'char', 'string', 'ListNode', 'TreeNode', 'Node']);
/** true for a type in the vocabulary ('void' only where `allowVoid`) */
export function validType(t, allowVoid = false) {
  if (t === 'void') return allowVoid;
  return typeof t === 'string' && BASE.has(t.replace(/(\[\])+$/, ''));
}

const JAVA = { int: 'int', long: 'long', double: 'double', boolean: 'boolean', char: 'char', string: 'String', void: 'void', ListNode: 'ListNode', TreeNode: 'TreeNode', Node: 'Node' };
const CPP = { int: 'int', long: 'long long', double: 'double', boolean: 'bool', char: 'char', string: 'string', void: 'void', ListNode: 'ListNode*', TreeNode: 'TreeNode*', Node: 'Node*' };

export function javaType(t) {
  return t.endsWith('[]') ? `${javaType(t.slice(0, -2))}[]` : JAVA[t];
}
export function cppType(t) {
  return t.endsWith('[]') ? `vector<${cppType(t.slice(0, -2))}>` : CPP[t];
}
/** a C++ parameter: vectors by reference (as LeetCode does), the rest by value */
const cppParam = (t, name) => (t.endsWith('[]') ? `${cppType(t)}& ${name}` : `${cppType(t)} ${name}`);

const splitParams = (s) =>
  s
    .split(',')
    .map((p) => /^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(p)?.[1])
    .filter(Boolean);
const NOT_METHOD = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return']);

/**
 * the signature in a JS starter: { name, params: [names] } for a function, { name, methods: [{ name, params }] } for
 * a class (constructor included when written). null when the header is not found.
 */
export function parseJsSignature(starter, name) {
  const src = starter || '';
  const cls = new RegExp(`class\\s+${name}\\b[^{]*\\{`).exec(src);
  if (cls) {
    const methods = [];
    let depth = 1;
    let line = '';
    for (const c of src.slice(cls.index + cls[0].length)) {
      if (c === '\n') line = '';
      else line += c;
      if (c === '{') {
        const m = depth === 1 && /^\s*(?:static\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{$/.exec(line);
        if (m && !NOT_METHOD.has(m[1])) methods.push({ name: m[1], params: splitParams(m[2]) });
        depth++;
      } else if (c === '}' && --depth === 0) break;
    }
    return { name, methods };
  }
  const fn = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)|${name}\\s*=\\s*(?:function\\s*)?\\(([^)]*)\\)`).exec(src);
  return fn ? { name, params: splitParams(fn[1] ?? fn[2]) } : null;
}

const NODE_DOCS = {
  java: {
    ListNode: 'class ListNode { int val; ListNode next; ListNode(int val) { this.val = val; } }',
    TreeNode: 'class TreeNode { int val; TreeNode left, right; TreeNode(int val) { this.val = val; } }',
    Node: 'class Node { int val; List<Node> neighbors = new ArrayList<>(); Node(int val) { this.val = val; } }',
  },
  cpp: {
    ListNode: 'struct ListNode { int val; ListNode* next; ListNode(int x) : val(x), next(nullptr) {} };',
    TreeNode: 'struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} };',
    Node: 'struct Node { int val; vector<Node*> neighbors; Node(int x) : val(x) {} };',
  },
};

/** the provided node classes this signature uses, as a comment block (like LeetCode's "Definition for …") */
function nodeDocs(lang, types) {
  const used = Object.keys(NODE_DOCS[lang]).filter((n) => types.some((t) => t && t.replace(/(\[\])+$/, '') === n));
  if (!used.length) return '';
  const c = lang === 'java' ? ' * ' : '// ';
  const body = used.map((n) => `${c}${NODE_DOCS[lang][n]}`).join('\n');
  return lang === 'java' ? `/**\n * Provided:\n${body}\n */\n` : `// Provided:\n${body}\n`;
}

// own entries only: methodTypes.constructor would otherwise find Object.prototype.constructor
const typesOf = (q, name) => (q.methodTypes && Object.hasOwn(q.methodTypes, name) ? q.methodTypes[name] : undefined);

/** the class's methods with their types, in the JS starter's order; null when a method has no types */
function typedMethods(q, sig) {
  const ms = sig.methods.map((m) => typesOf(q, m.name) && { ...m, types: typesOf(q, m.name).params || [], returns: typesOf(q, m.name).returns });
  return ms.every(Boolean) ? ms : null;
}

/** Java or C++ starter code for a question, or null for JS / quiz / untyped questions */
export function starterFor(lang, q) {
  if (lang === 'js' || q.kind === 'quiz') return null;
  const name = q.kind === 'design' ? q.className : q.functionName;
  const sig = parseJsSignature(q.starterCode, name);
  if (!sig) return null;
  const java = lang === 'java';
  if (sig.methods) {
    if (!q.methodTypes) return null;
    const ms = typedMethods(q, sig);
    if (!ms) return null;
    const head = nodeDocs(lang, ms.flatMap((m) => [...m.types, m.returns]));
    const body = ms
      .map((m) => {
        const ps = m.params.map((p, i) => (java ? `${javaType(m.types[i])} ${p}` : cppParam(m.types[i], p))).join(', ');
        if (m.name === 'constructor') return java ? `    public ${name}(${ps}) {\n        \n    }` : `    ${name}(${ps}) {\n        \n    }`;
        return java ? `    public ${javaType(m.returns)} ${m.name}(${ps}) {\n        \n    }` : `    ${cppType(m.returns)} ${m.name}(${ps}) {\n        \n    }`;
      })
      .join('\n\n');
    return java ? `${head}class ${name} {\n${body}\n}\n` : `${head}class ${name} {\npublic:\n${body}\n};\n`;
  }
  if (!q.paramTypes || !q.returnType) return null;
  const head = nodeDocs(lang, [...q.paramTypes, q.returnType]);
  const ps = sig.params.map((p, i) => (java ? `${javaType(q.paramTypes[i])} ${p}` : cppParam(q.paramTypes[i], p))).join(', ');
  return java
    ? `${head}class Solution {\n    public ${javaType(q.returnType)} ${name}(${ps}) {\n        \n    }\n}\n`
    : `${head}class Solution {\npublic:\n    ${cppType(q.returnType)} ${name}(${ps}) {\n        \n    }\n};\n`;
}

/** problems with a question's types, as messages (empty = fine): used by validate-content */
export function signatureProblems(q) {
  if (q.kind === 'quiz') return [];
  const name = q.kind === 'design' ? q.className : q.functionName;
  const sig = parseJsSignature(q.starterCode, name);
  if (!sig) return [`starter has no header for ${name}`];
  const out = [];
  if (sig.methods) {
    if (!q.methodTypes) return [`no methodTypes for class ${name}`];
    for (const m of sig.methods) {
      const t = typesOf(q, m.name);
      if (!t) out.push(`methodTypes has no ${m.name}`);
      else {
        if ((t.params || []).length !== m.params.length) out.push(`${m.name}: ${m.params.length} params in the starter, ${(t.params || []).length} types`);
        (t.params || []).forEach((x) => validType(x) || out.push(`${m.name}: unknown type ${x}`));
        if (m.name !== 'constructor' && !validType(t.returns, true)) out.push(`${m.name}: unknown return type ${t.returns}`);
      }
    }
    for (const k of Object.keys(q.methodTypes)) if (!sig.methods.some((m) => m.name === k) && k !== 'constructor') out.push(`methodTypes.${k} is not in the starter`);
    return out;
  }
  if (!q.paramTypes || !q.returnType) return [`no paramTypes / returnType`];
  if (q.paramTypes.length !== sig.params.length) out.push(`${sig.params.length} params in the starter, ${q.paramTypes.length} types`);
  q.paramTypes.forEach((x) => validType(x) || out.push(`unknown type ${x}`));
  if (!validType(q.returnType, true)) out.push(`unknown return type ${q.returnType}`);
  return out;
}
