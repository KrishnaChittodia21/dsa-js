// M6 / M7: run a Java or C++ solution on the JSON tests. The tests are encoded as plain number tokens (from the
// question's types, src/languages/signature.js), a generated driver reads them, calls the solution and prints one
// JSON line per test as soon as it is done, marked with a leading \x01 (anything else on stdout is the learner's own
// printing); checkPass (runner/core.js) then judges that output exactly as it judges JS.
// Token format: int / long / double as numbers, boolean 1/0, char as its code, string = length + char codes,
// T[] = length + items, ListNode = int[], TreeNode = count + level-order slots ("n" = no node).
// Each test starts with its own token count, so a test that throws cannot shift the next one.
import { javaType, cppType, parseJsSignature } from './signature.js';
import { resolveArgs, resolveDesign } from '../runner/core.js';

const elemOf = (t) => t.slice(0, -2);
const isArr = (t) => t.endsWith('[]');

/** the tokens of one value of type t */
function enc(t, v, out) {
  if (isArr(t) || t === 'ListNode') {
    const et = t === 'ListNode' ? 'int' : elemOf(t);
    const a = Array.isArray(v) ? v : [];
    out.push(a.length);
    for (const x of a) enc(et, x, out);
  } else if (t === 'TreeNode') {
    const a = Array.isArray(v) ? v : [];
    out.push(a.length);
    for (const x of a) out.push(x === null || x === undefined ? 'n' : x);
  } else if (t === 'string') {
    const s = String(v ?? '');
    out.push(s.length);
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  } else if (t === 'char') out.push(String(v).charCodeAt(0));
  else if (t === 'boolean') out.push(v ? 1 : 0);
  else out.push(v);
}

/** the methods of a design class, in the JS starter's order, with their types; [0] is the constructor (maybe empty) */
export function classMethods(q) {
  const sig = parseJsSignature(q.starterCode, q.className || q.functionName);
  const ctor = sig.methods.find((m) => m.name === 'constructor');
  const types = (n) => (Object.hasOwn(q.methodTypes, n) ? q.methodTypes[n] : { params: [] });
  return [
    { name: 'constructor', params: ctor ? ctor.params : [], types: types('constructor').params || [] },
    ...sig.methods.filter((m) => m.name !== 'constructor').map((m) => ({ ...m, types: types(m.name).params || [], returns: types(m.name).returns })),
  ];
}

// ---------- custom harnesses ----------
// The 9 questions whose JS `harness` builds the input or reads the result in its own way. Each entry: the token
// types of the test args, and Java / C++ bodies that do what the JS harness does (r(t) = a Java read expression).
const prefixOut = {
  java: (call, a) => `int cnt = ${call}; wo(sb, Arrays.copyOf(${a}, Math.max(0, Math.min(cnt, ${a}.length))));`,
  cpp: (call, a, T) => `int cnt = ${call}; harness::wr(o, vector<${T}>(${a}.begin(), ${a}.begin() + max(0, min(cnt, (int) ${a}.size()))));`,
};
const JAVA_LCA = (r) => `TreeNode root = ${r('TreeNode')}; int pv = ri(), qv = ri(); TreeNode p = null, q = null;
      ArrayDeque<TreeNode> st = new ArrayDeque<>(); if (root != null) st.push(root);
      while (!st.isEmpty()) { TreeNode x = st.pop(); if (x.val == pv) p = x; if (x.val == qv) q = x; if (x.left != null) st.push(x.left); if (x.right != null) st.push(x.right); }
      TreeNode res = new Solution().lowestCommonAncestor(root, p, q); wo(sb, res == null ? null : res.val);`;
const CPP_LCA = `TreeNode* root{}; harness::rd(root); int pv = harness::ri(), qv = harness::ri(); TreeNode *p = nullptr, *q = nullptr;
      vector<TreeNode*> st; if (root) st.push_back(root);
      while (!st.empty()) { TreeNode* x = st.back(); st.pop_back(); if (x->val == pv) p = x; if (x->val == qv) q = x; if (x->left) st.push_back(x->left); if (x->right) st.push_back(x->right); }
      TreeNode* res = (new Solution())->lowestCommonAncestor(root, p, q); if (res) harness::wr(o, res->val); else o += "null";`;
const JAVA_CYCLE = (r) => `int[] vals = ${r('int[]')}; int pos = ri(); ListNode[] ns = new ListNode[vals.length];
      for (int i = 0; i < vals.length; i++) { ns[i] = new ListNode(vals[i]); if (i > 0) ns[i - 1].next = ns[i]; }
      if (pos >= 0 && vals.length > 0) ns[vals.length - 1].next = ns[pos];
      ListNode head = vals.length == 0 ? null : ns[0];`;
const CPP_CYCLE = `vector<int> vals; harness::rd(vals); int pos = harness::ri(); vector<ListNode*> ns;
      for (int v : vals) { ns.push_back(new ListNode(v)); if (ns.size() > 1) ns[ns.size() - 2]->next = ns.back(); }
      if (pos >= 0 && !ns.empty()) ns.back()->next = ns[pos];
      ListNode* head = ns.empty() ? nullptr : ns[0];`;

const CUSTOM = {
  'encode-and-decode-strings': {
    types: ['string[]'],
    java: (r) => `String[] strs = ${r('string[]')}; String enc = new Codec().encode(strs); wo(sb, new Codec().decode(enc));`,
    cpp: `vector<string> strs; harness::rd(strs); Codec c1, c2; string enc = c1.encode(strs); harness::wr(o, c2.decode(enc));`,
  },
  'serialize-and-deserialize-binary-tree': {
    types: ['TreeNode'],
    java: (r) => `TreeNode root = ${r('TreeNode')}; String data = new Codec().serialize(root); wt(sb, new Codec().deserialize(data));`,
    cpp: `TreeNode* root{}; harness::rd(root); Codec c1, c2; string data = c1.serialize(root); harness::wr(o, c2.deserialize(data));`,
  },
  'string-compression': {
    types: ['char[]'],
    java: (r) => `char[] chars = ${r('char[]')}; ${prefixOut.java('new Solution().compress(chars)', 'chars')}`,
    cpp: `vector<char> chars; harness::rd(chars); ${prefixOut.cpp('(new Solution())->compress(chars)', 'chars', 'char')}`,
  },
  'remove-duplicates-from-sorted-array': {
    types: ['int[]'],
    java: (r) => `int[] nums = ${r('int[]')}; ${prefixOut.java('new Solution().removeDuplicates(nums)', 'nums')}`,
    cpp: `vector<int> nums; harness::rd(nums); ${prefixOut.cpp('(new Solution())->removeDuplicates(nums)', 'nums', 'int')}`,
  },
  'lowest-common-ancestor-of-a-binary-tree': { types: ['TreeNode', 'int', 'int'], java: JAVA_LCA, cpp: CPP_LCA },
  'lowest-common-ancestor-of-a-binary-search-tree': { types: ['TreeNode', 'int', 'int'], java: JAVA_LCA, cpp: CPP_LCA },
  'linked-list-cycle': {
    types: ['int[]', 'int'],
    java: (r) => `${JAVA_CYCLE(r)}\n      wo(sb, new Solution().hasCycle(head));`,
    cpp: `${CPP_CYCLE}\n      harness::wr(o, (new Solution())->hasCycle(head));`,
  },
  'linked-list-cycle-ii': {
    types: ['int[]', 'int'],
    java: (r) => `${JAVA_CYCLE(r)}\n      ListNode res = new Solution().detectCycle(head); int idx = -1; for (int i = 0; i < ns.length; i++) if (ns[i] == res) idx = i; wo(sb, idx);`,
    cpp: `${CPP_CYCLE}\n      ListNode* res = (new Solution())->detectCycle(head); int idx = -1; for (size_t i = 0; i < ns.size(); i++) if (ns[i] == res) idx = (int) i; harness::wr(o, idx);`,
  },
  'clone-graph': {
    types: ['int[][]'],
    javaHead: 'class Node { public int val; public List<Node> neighbors; public Node() { neighbors = new ArrayList<>(); } public Node(int val) { this.val = val; neighbors = new ArrayList<>(); } public Node(int val, List<Node> neighbors) { this.val = val; this.neighbors = neighbors; } }',
    cppHead: 'struct Node { int val; vector<Node*> neighbors; Node() : val(0) {} Node(int x) : val(x) {} Node(int x, vector<Node*> n) : val(x), neighbors(n) {} };',
    // the same checks as the JS harness: a deep copy, every node once, then each node's neighbour values by node value
    java: (r) => `int[][] adj = ${r('int[][]')}; String err = null;
      if (adj.length == 0) { if (new Solution().cloneGraph(null) == null) sb.append("[]"); else err = "expected null for an empty graph"; }
      else {
        Node[] ns = new Node[adj.length]; for (int i = 0; i < adj.length; i++) ns[i] = new Node(i + 1);
        for (int i = 0; i < adj.length; i++) for (int v : adj[i]) ns[i].neighbors.add(ns[v - 1]);
        Set<Node> orig = Collections.newSetFromMap(new IdentityHashMap<>()); orig.addAll(Arrays.asList(ns));
        Node c = new Solution().cloneGraph(ns[0]);
        if (c == null) err = "returned null for a non-empty graph";
        else if (orig.contains(c)) err = "returned an original node instead of a copy";
        else {
          HashMap<Integer, Node> byVal = new HashMap<>(); byVal.put(c.val, c); ArrayDeque<Node> qu = new ArrayDeque<>(); qu.add(c);
          while (err == null && !qu.isEmpty()) { Node u = qu.poll();
            for (Node v : u.neighbors) {
              if (orig.contains(v)) { err = "the copy shares node " + v.val + " with the original graph"; break; }
              Node s = byVal.get(v.val);
              if (s == null) { byVal.put(v.val, v); qu.add(v); } else if (s != v) { err = "node " + v.val + " was copied more than once"; break; } } }
          if (err == null) { sb.append('[');
            for (int val = 1; val <= byVal.size(); val++) { Node u = byVal.get(val);
              if (u == null) { err = "the copy is missing node " + val; break; }
              if (val > 1) sb.append(','); sb.append('['); for (int j = 0; j < u.neighbors.size(); j++) { if (j > 0) sb.append(','); sb.append(u.neighbors.get(j).val); } sb.append(']'); }
            sb.append(']'); }
        }
      }
      if (err != null) { sb.setLength(0); ws(sb, err); }`,
    cpp: `vector<vector<int>> adj; harness::rd(adj); string err;
      if (adj.empty()) { if ((new Solution())->cloneGraph(nullptr) == nullptr) o += "[]"; else err = "expected null for an empty graph"; }
      else {
        vector<Node*> ns; for (size_t i = 0; i < adj.size(); i++) ns.push_back(new Node((int) i + 1));
        for (size_t i = 0; i < adj.size(); i++) for (int v : adj[i]) ns[i]->neighbors.push_back(ns[v - 1]);
        unordered_set<Node*> orig(ns.begin(), ns.end());
        Node* c = (new Solution())->cloneGraph(ns[0]);
        if (!c) err = "returned null for a non-empty graph";
        else if (orig.count(c)) err = "returned an original node instead of a copy";
        else {
          unordered_map<int, Node*> byVal{{c->val, c}}; deque<Node*> qu{c};
          while (err.empty() && !qu.empty()) { Node* u = qu.front(); qu.pop_front();
            for (Node* v : u->neighbors) {
              if (orig.count(v)) { err = "the copy shares node " + to_string(v->val) + " with the original graph"; break; }
              auto s = byVal.find(v->val);
              if (s == byVal.end()) { byVal[v->val] = v; qu.push_back(v); } else if (s->second != v) { err = "node " + to_string(v->val) + " was copied more than once"; break; } } }
          if (err.empty()) { o += '[';
            for (int val = 1; val <= (int) byVal.size(); val++) { auto it = byVal.find(val);
              if (it == byVal.end()) { err = "the copy is missing node " + to_string(val); break; }
              if (val > 1) o += ','; o += '['; for (size_t j = 0; j < it->second->neighbors.size(); j++) { if (j) o += ','; o += to_string(it->second->neighbors[j]->val); } o += ']'; }
            o += ']'; }
        }
      }
      if (!err.empty()) { o.clear(); harness::ws(o, err); }`,
  },
};

/** all tests as one token string: count, then per test its token count and tokens */
export function encodeTests(q, tests) {
  const out = [tests.length];
  for (const test of tests) {
    const tok = [];
    if (CUSTOM[q.id]) {
      const args = resolveArgs(test);
      CUSTOM[q.id].types.forEach((t, j) => enc(t, args[j], tok));
    } else if (q.kind === 'design') {
      const ms = classMethods(q);
      const { ops, args } = resolveDesign(test);
      tok.push(ops.length);
      ms[0].types.forEach((t, j) => enc(t, (args[0] || [])[j], tok));
      for (let i = 1; i < ops.length; i++) {
        const k = ms.findIndex((m, x) => x > 0 && m.name === ops[i]);
        if (k < 0) throw new Error(`${q.id}: no method ${ops[i]}`);
        tok.push(k);
        ms[k].types.forEach((t, j) => enc(t, (args[i] || [])[j], tok));
      }
    } else {
      const args = resolveArgs(test);
      q.paramTypes.forEach((t, j) => enc(t, args[j], tok));
    }
    out.push(tok.length);
    for (const x of tok) out.push(x); // not push(...tok): long generated tests exceed the argument limit
  }
  return out.join(' ');
}

// ---------- Java ----------
const JAVA_HEAD = `import java.util.*;
import java.util.function.*;
import java.util.stream.*;
import java.math.*;
class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }
class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }
`;

const jName = (t) => `r_${t.replace(/\[\]/g, '_A')}`;
const JREAD = { int: 'Integer.parseInt(nx())', long: 'Long.parseLong(nx())', double: 'Double.parseDouble(nx())', boolean: 'nx().equals("1")', char: '(char) Integer.parseInt(nx())', string: 'rs()', ListNode: 'rl()', TreeNode: 'rt()' };
/** a read expression for type t, adding array readers to `defs` as needed */
function jRead(t, defs) {
  if (!isArr(t)) return JREAD[t];
  const name = jName(t);
  if (!defs.has(name)) {
    defs.set(name, '');
    const jt = javaType(t);
    const depth = (t.match(/\[\]/g) || []).length;
    const base = jt.replace(/(\[\])+$/, '');
    const inner = jRead(elemOf(t), defs);
    defs.set(name, `  static ${jt} ${name}() { int n = ri(); ${jt} a = new ${base}[n]${'[]'.repeat(depth - 1)}; for (int i = 0; i < n; i++) a[i] = ${inner}; return a; }`);
  }
  return `${name}()`;
}
const jWrite = (t, e) => (t === 'ListNode' ? `wl(sb, ${e});` : t === 'TreeNode' ? `wt(sb, ${e});` : `wo(sb, ${e});`);

const JAVA_LIB = `  static String[] T; static int P = 0;
  static String nx() { return T[P++]; }
  static int ri() { return Integer.parseInt(nx()); }
  static String rs() { int n = ri(); char[] c = new char[n]; for (int i = 0; i < n; i++) c[i] = (char) ri(); return new String(c); }
  static ListNode rl() { int n = ri(); ListNode d = new ListNode(0), t = d; for (int i = 0; i < n; i++) { t.next = new ListNode(ri()); t = t.next; } return d.next; }
  static TreeNode rt() {
    int n = ri(); String[] s = new String[n]; for (int i = 0; i < n; i++) s[i] = nx();
    if (n == 0 || s[0].equals("n")) return null;
    TreeNode root = new TreeNode(Integer.parseInt(s[0])); ArrayDeque<TreeNode> q = new ArrayDeque<>(); q.add(root); int i = 1;
    while (!q.isEmpty() && i < n) { TreeNode x = q.poll();
      if (i < n && !s[i].equals("n")) { x.left = new TreeNode(Integer.parseInt(s[i])); q.add(x.left); } i++;
      if (i < n && !s[i].equals("n")) { x.right = new TreeNode(Integer.parseInt(s[i])); q.add(x.right); } i++; }
    return root;
  }
  static void ws(StringBuilder sb, String s) {
    sb.append('"');
    for (int i = 0; i < s.length(); i++) { char c = s.charAt(i);
      if (c == '"' || c == '\\\\') sb.append('\\\\').append(c); else if (c < 32) sb.append(String.format("\\\\u%04x", (int) c)); else sb.append(c); }
    sb.append('"');
  }
  static void wl(StringBuilder sb, ListNode h) { sb.append('['); int k = 0; for (ListNode x = h; x != null && k < 200000; x = x.next, k++) { if (k > 0) sb.append(','); sb.append(x.val); } sb.append(']'); }
  static void wt(StringBuilder sb, TreeNode r) {
    ArrayList<String> out = new ArrayList<>(); ArrayList<TreeNode> lv = new ArrayList<>(); lv.add(r);
    if (r != null) for (int h = 0; h < lv.size(); h++) { TreeNode x = lv.get(h); if (x == null) { out.add("null"); continue; } out.add(String.valueOf(x.val)); lv.add(x.left); lv.add(x.right); }
    int e = out.size(); while (e > 0 && out.get(e - 1).equals("null")) e--;
    sb.append('['); for (int i = 0; i < e; i++) { if (i > 0) sb.append(','); sb.append(out.get(i)); } sb.append(']');
  }
  static void wo(StringBuilder sb, Object o) {
    if (o == null) sb.append("null");
    else if (o instanceof Integer || o instanceof Long || o instanceof Short || o instanceof Byte) sb.append(String.valueOf(o));
    else if (o instanceof Double || o instanceof Float) { double d = ((Number) o).doubleValue(); if (Double.isFinite(d)) sb.append(d); else sb.append("null"); }
    else if (o instanceof Boolean) sb.append(String.valueOf(o));
    else if (o instanceof Character) ws(sb, String.valueOf(o));
    else if (o instanceof String) ws(sb, (String) o);
    else if (o instanceof ListNode) wl(sb, (ListNode) o);
    else if (o instanceof TreeNode) wt(sb, (TreeNode) o);
    else if (o instanceof int[]) { int[] a = (int[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); } sb.append(']'); }
    else if (o instanceof long[]) { long[] a = (long[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); } sb.append(']'); }
    else if (o instanceof double[]) { double[] a = (double[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); wo(sb, a[i]); } sb.append(']'); }
    else if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); } sb.append(']'); }
    else if (o instanceof char[]) { char[] a = (char[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); ws(sb, String.valueOf(a[i])); } sb.append(']'); }
    else if (o instanceof Object[]) { Object[] a = (Object[]) o; sb.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); wo(sb, a[i]); } sb.append(']'); }
    else if (o instanceof Collection) { sb.append('['); int i = 0; for (Object x : (Collection<?>) o) { if (i++ > 0) sb.append(','); wo(sb, x); } sb.append(']'); }
    else ws(sb, o.toString());
  }
`;

/** one test's body in Java (reads its tokens, writes its JSON into sb) */
function javaBody(q, defs) {
  if (CUSTOM[q.id]) return `      ${CUSTOM[q.id].java((t) => jRead(t, defs))}`;
  if (q.kind === 'design') {
    const ms = classMethods(q);
    const cls = q.className || q.functionName;
    const ctorArgs = ms[0].types.map((t) => jRead(t, defs)).join(', ');
    const cases = ms
      .slice(1)
      .map((m, i) => {
        const reads = m.types.map((t, j) => `${javaType(t)} a${j} = ${jRead(t, defs)};`).join(' ');
        const call = `obj.${m.name}(${m.types.map((_, j) => `a${j}`).join(', ')})`;
        const w = m.returns === 'void' ? `${call}; sb.append("null");` : `${jWrite(m.returns, call)}`;
        return `          case ${i + 1}: { ${reads} ${w} break; }`;
      })
      .join('\n');
    return `      int m = ri(); ${cls} obj = new ${cls}(${ctorArgs}); sb.append("[null");
      for (int op = 1; op < m; op++) { int id = ri(); sb.append(',');
        switch (id) {
${cases}
        }
      }
      sb.append(']');`;
  }
  const reads = q.paramTypes.map((t, j) => `${javaType(t)} a${j} = ${jRead(t, defs)};`).join(' ');
  const call = `new Solution().${q.functionName}(${q.paramTypes.map((_, j) => `a${j}`).join(', ')})`;
  if (q.returnType !== 'void') return `      ${reads}\n      ${jWrite(q.returnType, call)}`;
  const m = q.io?.mutates;
  return `      ${reads}\n      ${call};\n      ${Number.isInteger(m) ? jWrite(q.paramTypes[m], `a${m}`) : 'sb.append("null");'}`;
}

export function javaProgram(q, userCode, { browser = false } = {}) {
  const defs = new Map();
  const body = javaBody(q, defs);
  return `${JAVA_HEAD}${CUSTOM[q.id]?.javaHead || ''}
${userCode}

public class Main {
${JAVA_LIB}
${[...defs.values()].join('\n')}
  public static void main(String[] args) throws Exception {
${browser ? `    String in = args.length > 0 ? args[0].trim() : "";` : `    String in = new String(System.in.readAllBytes()).trim();`}
    T = in.isEmpty() ? new String[0] : in.split("\\\\s+");
${browser ? `    run(); // TeaVM: no real threads, the tests come in as args[0]` : `    Thread t = new Thread(null, Main::run, "main", 1L << 29);
    t.start();
    t.join();`}
  }
  static void run() {
    int tests = ri();
    for (int k = 0; k < tests; k++) {
      int len = ri(), start = P;
      StringBuilder sb = new StringBuilder();
      long t0 = System.nanoTime();
      try {
${body}
      } catch (Throwable e) {
        sb.setLength(0); sb.append("{\\"__error\\":"); ws(sb, e.toString()); sb.append('}');
      }
      P = start + len;
      // an append chain: TeaVM (browser javac) failed to compile this line as "…" + double + "…"
      StringBuilder line = new StringBuilder("\\n\\u0001{\\"ms\\":");
      line.append((System.nanoTime() - t0) / 1e6).append(",\\"out\\":").append(sb.toString()).append("}\\n");
      System.out.print(line.toString());
      System.out.flush();
    }
  }
}
`;
}

// ---------- C++ ----------
const CPP_HEAD = `#include <algorithm>
#include <array>
#include <bitset>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iomanip>
#include <iostream>
#include <optional>
#include <random>
#include <string_view>
#include <list>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
#include <chrono>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode* n) : val(x), next(n) {} };
struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode() : val(0), left(nullptr), right(nullptr) {} TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} TreeNode(int x, TreeNode* l, TreeNode* r) : val(x), left(l), right(r) {} };
`;

const CPP_LIB = `namespace harness {
vector<string> T; size_t P = 0;
string nx() { return T[P++]; }
int ri() { return stoi(nx()); }
void rd(int& x) { x = stoi(nx()); }
void rd(long long& x) { x = stoll(nx()); }
void rd(double& x) { x = stod(nx()); }
void rd(bool& x) { x = nx() == "1"; }
void rd(char& x) { x = (char) stoi(nx()); }
void rd(string& s) { int n = ri(); s.clear(); for (int i = 0; i < n; i++) { int c = ri();
  if (c < 0x80) s += (char) c; else if (c < 0x800) { s += (char) (0xC0 | (c >> 6)); s += (char) (0x80 | (c & 63)); }
  else { s += (char) (0xE0 | (c >> 12)); s += (char) (0x80 | ((c >> 6) & 63)); s += (char) (0x80 | (c & 63)); } } }
void rd(ListNode*& h) { int n = ri(); ListNode d; ListNode* t = &d; for (int i = 0; i < n; i++) { t->next = new ListNode(ri()); t = t->next; } h = d.next; }
void rd(TreeNode*& root) {
  int n = ri(); vector<string> s(n); for (auto& x : s) x = nx();
  root = nullptr; if (n == 0 || s[0] == "n") return;
  root = new TreeNode(stoi(s[0])); deque<TreeNode*> q{root}; int i = 1;
  while (!q.empty() && i < n) { TreeNode* x = q.front(); q.pop_front();
    if (i < n && s[i] != "n") { x->left = new TreeNode(stoi(s[i])); q.push_back(x->left); } i++;
    if (i < n && s[i] != "n") { x->right = new TreeNode(stoi(s[i])); q.push_back(x->right); } i++; }
}
void rd(vector<bool>& v) { int n = ri(); v.assign(n, false); for (int i = 0; i < n; i++) { bool b; rd(b); v[i] = b; } }
template <class X> void rd(vector<X>& v) { int n = ri(); v.assign(n, X()); for (auto& x : v) rd(x); }
void ws(string& o, const string& s) { o += '"'; for (unsigned char c : s) { if (c == '"' || c == '\\\\') { o += '\\\\'; o += (char) c; } else if (c < 32) { char b[8]; snprintf(b, 8, "\\\\u%04x", c); o += b; } else o += (char) c; } o += '"'; }
void wr(string& o, int x) { o += to_string(x); }
void wr(string& o, long long x) { o += to_string(x); }
void wr(string& o, long x) { o += to_string(x); }
void wr(string& o, unsigned x) { o += to_string(x); }
void wr(string& o, double x) { if (!isfinite(x)) { o += "null"; return; } char b[40]; snprintf(b, 40, "%.17g", x); o += b; }
void wr(string& o, bool x) { o += x ? "true" : "false"; }
void wr(string& o, char x) { ws(o, string(1, x)); }
void wr(string& o, const string& s) { ws(o, s); }
void wr(string& o, const char* s) { ws(o, s); }
void wr(string& o, ListNode* h) { o += '['; int k = 0; for (ListNode* x = h; x && k < 200000; x = x->next, k++) { if (k) o += ','; o += to_string(x->val); } o += ']'; }
void wr(string& o, TreeNode* r) {
  vector<string> out; vector<TreeNode*> lv{r};
  if (r) for (size_t h = 0; h < lv.size(); h++) { TreeNode* x = lv[h]; if (!x) { out.push_back("null"); continue; } out.push_back(to_string(x->val)); lv.push_back(x->left); lv.push_back(x->right); }
  size_t e = out.size(); while (e && out[e - 1] == "null") e--;
  o += '['; for (size_t i = 0; i < e; i++) { if (i) o += ','; o += out[i]; } o += ']';
}
void wr(string& o, const vector<bool>& v) { o += '['; for (size_t i = 0; i < v.size(); i++) { if (i) o += ','; wr(o, (bool) v[i]); } o += ']'; }
template <class X> void wr(string& o, const vector<X>& v) { o += '['; for (size_t i = 0; i < v.size(); i++) { if (i) o += ','; wr(o, v[i]); } o += ']'; }
}
`;

// The WASI libc++ used in the browser (M7) is built without exceptions: a throw ends the program, and the host
// reports it on the running test and restarts at the next one. Desktop builds keep real exceptions.
const CPP_NO_EXCEPTIONS = `extern "C" void* __cxa_allocate_exception(size_t n) { return malloc(n); }
extern "C" void __cxa_throw(void*, void*, void (*)(void*)) { fputs("uncaught C++ exception\\n", stderr); abort(); }
`;
/** clang flags for the browser build: the default 64 KB WebAssembly stack is too small for deep recursion */
export const CPP_BROWSER_FLAGS = ['-std=c++17', '-O2', '-w', '-Wl,-z,stack-size=8388608'];

function cppBody(q) {
  if (CUSTOM[q.id]) return `      ${CUSTOM[q.id].cpp}`;
  const rd = (types) => types.map((t, j) => `${cppType(t)} a${j}{}; harness::rd(a${j});`).join(' ');
  const args = (types) => types.map((_, j) => `a${j}`).join(', ');
  if (q.kind === 'design') {
    const ms = classMethods(q);
    const cls = q.className || q.functionName;
    const cases = ms
      .slice(1)
      .map((m, i) => {
        const call = `obj->${m.name}(${args(m.types)})`;
        const w = m.returns === 'void' ? `${call}; o += "null";` : `harness::wr(o, ${call});`;
        return `          case ${i + 1}: { ${rd(m.types)} ${w} break; }`;
      })
      .join('\n');
    return `      int m = harness::ri(); ${rd(ms[0].types)} ${cls}* obj = new ${cls}(${args(ms[0].types)}); o += "[null";
      for (int op = 1; op < m; op++) { int id = harness::ri(); o += ',';
        switch (id) {
${cases}
        }
      }
      o += ']';`;
  }
  const call = `sol->${q.functionName}(${args(q.paramTypes)})`;
  const head = `      ${rd(q.paramTypes)}\n      Solution* sol = new Solution();`;
  if (q.returnType !== 'void') return `${head}\n      harness::wr(o, ${call});`;
  const m = q.io?.mutates;
  return `${head}\n      ${call};\n      ${Number.isInteger(m) ? `harness::wr(o, a${m});` : 'o += "null";'}`;
}

export function cppProgram(q, userCode, { browser = false } = {}) {
  return `${CPP_HEAD}${CUSTOM[q.id]?.cppHead || ''}
${userCode}

${CPP_LIB}
int main() {
  std::ios::sync_with_stdio(false);
  string tok;
  while (cin >> tok) harness::T.push_back(tok);
  int tests = harness::ri();
  for (int k = 0; k < tests; k++) {
    int len = harness::ri(); size_t start = harness::P;
    string o;
    auto t0 = chrono::steady_clock::now();
    try {
${cppBody(q)}
    } catch (const exception& e) {
      o = "{\\"__error\\":"; harness::ws(o, e.what()); o += "}";
    } catch (...) {
      o = "{\\"__error\\":\\"exception\\"}";
    }
    harness::P = start + len;
    double ms = chrono::duration<double, milli>(chrono::steady_clock::now() - t0).count();
    cout << "\\n\\x01" << "{\\"ms\\":" + to_string(ms) + ",\\"out\\":" + o + "}\\n" << flush;
  }
}
${browser ? CPP_NO_EXCEPTIONS : ''}`;
}

/** split a driver's stdout into one record per finished test: its JSON line and the learner's own printed lines
 *  before it; `rest` is what was printed after the last finished test (the test that was running when it stopped) */
export function splitDriverOutput(text) {
  const records = [];
  let logs = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('\x01')) {
      records.push({ line: line.slice(1), logs });
      logs = [];
    } else if (line !== '') logs.push(line);
  }
  return { records, rest: logs };
}

/** the generated program for a language */
export const programFor = (lang, q, userCode, opts) => (lang === 'java' ? javaProgram(q, userCode, opts) : cppProgram(q, userCode, opts));

/** questions a driver can run: the custom ones above, or typed with no harness and no graph Node */
export function driverSupports(q) {
  if (CUSTOM[q.id]) return true;
  if (q.kind === 'quiz' || q.harness) return false;
  const types = q.kind === 'design' ? Object.values(q.methodTypes || {}).flatMap((m) => [...(m.params || []), m.returns || 'void']) : [...(q.paramTypes || []), q.returnType];
  return types.length > 0 && types.every((t) => t && !/^Node/.test(t));
}
