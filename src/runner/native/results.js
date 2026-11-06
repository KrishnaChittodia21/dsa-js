// M7: the language-independent part of running Java / C++ in the browser — no workers, no DOM, so it is unit-tested.
// A run = compile once, then execute the program on the tests; a crash (stack overflow, trap, uncaught throw) ends
// the program, so the run restarts it at the next test. Results have the same shape as the JS runner's (core.js).
import { checkPass, effectiveLimit, format } from '../core.js';
import { encodeTests, splitDriverOutput } from '../../languages/harness.js';

/** the 1-based line in the learner's code for a line of the generated program (null = in the driver) */
export function userLine(src, code, line) {
  const offset = src.slice(0, src.indexOf(code)).split('\n').length - 1;
  const n = line - offset;
  return n >= 1 && n <= code.split('\n').length ? n : null;
}

// TeaVM's class library (the in-browser Java compiler) lacks two things desktop Java has
const JAVA_HINTS = [
  [/class Entry[\s\S]*java\.util\.Map/, 'The browser Java compiler does not know Map.Entry yet: write for (var e : map.entrySet()) { e.getKey(); e.getValue(); }'],
  [/method sum\(.*\)[\s\S]*java\.lang\.(Integer|Long)/, 'The browser Java compiler has no Integer::sum yet: write (a, b) -> a + b, e.g. map.merge(key, 1, (a, b) -> a + b).'],
];

/** compile errors as text with the learner's line numbers. Java: [{ lineNumber, message }]; C++: clang's stderr */
export function compileErrorText(lang, src, code, raw) {
  const where = (line, col) => {
    const n = userLine(src, code, line);
    return n ? `Line ${n}${col ? `:${col}` : ''}` : 'In the test driver';
  };
  if (lang === 'java') {
    const out = raw.map((d) => `${d.lineNumber > 0 ? where(d.lineNumber) : 'Error'}: ${d.message}`);
    const all = raw.map((d) => d.message).join('\n');
    for (const [re, hint] of JAVA_HINTS) if (re.test(all)) out.push(`Hint: ${hint}`);
    return out.join('\n') || 'Compilation failed.';
  }
  const out = [];
  for (const line of raw.split('\n')) {
    const m = /^main\.cpp:(\d+):(\d+): (?:fatal )?error: (.*)$/.exec(line);
    if (m) out.push(`${where(+m[1], m[2])}: ${m[3]}`);
    else if (/error:/.test(line) && !/^main\.cpp:/.test(line)) out.push(line.replace(/^.*?error:/, 'error:'));
  }
  return out.join('\n') || raw.trim().split('\n').slice(-5).join('\n') || 'Compilation failed.';
}

/** what to tell the learner when the program died on a test */
export function crashText(lang, crash) {
  const s = String(crash || '');
  if (/call stack|stack overflow/i.test(s)) {
    return `${lang === 'java' ? 'StackOverflowError' : 'Stack overflow'}: the recursion is too deep for the browser (a few thousand levels at most), or never ends. For deep inputs, try an explicit stack.`;
  }
  if (lang === 'java') {
    // in the browser build these are WebAssembly traps, so the Java code cannot catch them and the run stops here
    if (/null/i.test(s)) return 'NullPointerException: a null reference was used (in the browser this stops the run on this test).';
    if (/out of bounds/i.test(s)) return 'ArrayIndexOutOfBoundsException: an index is outside the array (in the browser this stops the run on this test).';
  }
  if (/uncaught C\+\+ exception/.test(s)) return 'Uncaught C++ exception: exceptions are not supported in the browser build (a throw ends the run).';
  if (/out of bounds/i.test(s)) return 'Crashed: memory access out of bounds (an index past the end of a vector or array, or a null pointer?).';
  if (/unreachable|abort/i.test(s)) return 'Crashed: the program aborted (a failed assert, or a library error such as stoi on a bad string).';
  return `Crashed: ${s || 'the program stopped unexpectedly'}`;
}

/** one finished test's record (its JSON line + the learner's printed lines) → a result like core.runTests gives */
function toResult(question, test, index, record, opts) {
  const logs = record.logs;
  let r;
  try {
    r = JSON.parse(record.line);
  } catch {
    return { index, passed: false, error: `Unreadable output: ${record.line.slice(0, 200)}`, logs };
  }
  const out = r.out;
  if (out && typeof out === 'object' && !Array.isArray(out) && '__error' in out) return { index, passed: false, error: out.__error, ms: r.ms, logs };
  let passed = null;
  let error;
  if (opts.compareWith !== false) {
    try {
      passed = checkPass(question, test, out);
    } catch (e) {
      return { index, passed: false, error: `Checker error: ${e.message}`, ms: r.ms, logs };
    }
  }
  const limit = test.timeLimitMs && effectiveLimit(test.timeLimitMs);
  if (passed && limit && r.ms > limit) {
    passed = false;
    error = `Too slow: took ${Math.round(r.ms)} ms (limit ${Math.round(limit)} ms). The answer is right, but this input is large — your approach is probably a complexity class too slow.`;
  }
  return { index, passed, error, output: format(out), rawOutput: passed === null ? out : undefined, ms: r.ms, logs };
}

/**
 * Run a compiled program on `tests`, restarting after a crash. `exec(input, msLeft)` runs the program once on the
 * encoded tests and resolves { stdout, crash?, timedOut? }. Resolves { results, logs, timeout? } like core.runTests.
 */
export async function runCompiled({ lang, question, tests, exec, opts = {}, timeoutMs = 10000, now = () => performance.now() }) {
  const results = [];
  const end = now() + timeoutMs;
  let from = 0;
  while (from < tests.length) {
    const { stdout, crash, timedOut } = await exec(encodeTests(question, tests.slice(from)), Math.max(0, end - now()));
    const { records, rest } = splitDriverOutput(stdout);
    records.slice(0, tests.length - from).forEach((rec, i) => {
      const r = toResult(question, tests[from + i], from + i, rec, opts);
      results.push(r);
      opts.onResult?.(r);
    });
    from += records.length;
    if (from >= tests.length) break;
    if (timedOut) {
      results.push({ index: from, passed: false, timedOut: true, error: `Time limit exceeded on this test (stopped after ${timeoutMs / 1000}s). Infinite loop, or an approach that is too slow for this input size.`, logs: rest });
      for (let i = from + 1; i < tests.length; i++) results.push({ index: i, passed: false, skipped: true, error: 'Not run — an earlier test ran out of time.', logs: [] });
      return { results, timeout: true, logs: [] };
    }
    results.push({ index: from, passed: false, error: crash ? crashText(lang, crash) : 'The program stopped without printing a result.', logs: rest });
    from++;
  }
  return { results, logs: [] };
}
