// M7: Run / Submit / custom tests for Java and C++ in the browser — the counterpart of runInWorker.js for JS.
// Java: TeaVM's javac (vendored in public/teavm/, ~4 MB). C++: clang for WebAssembly from the CDN (~23 MB).
// Each compiler loads on first use and stays in its worker; every run executes in a fresh worker (time limit).
import { programFor, driverSupports, CPP_BROWSER_FLAGS } from '../../languages/harness.js';
import { compileErrorText, runCompiled } from './results.js';

const TEAVM = new URL(`${import.meta.env.BASE_URL}teavm/`, self.location.href).href;
export const CLANG_URL = 'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js';
const LABEL = { java: 'Java', cpp: 'C++' };

// ---------- Java: the TeaVM compiler worker (its own message protocol) ----------
let java;
function javaCompiler() {
  if (java) return java;
  const worker = new Worker(`${TEAVM}worker.js`);
  const pending = new Map();
  let seq = 0;
  const send = (msg) =>
    new Promise((resolve) => {
      const id = String(++seq);
      pending.set(id, { resolve, diags: [] });
      worker.postMessage({ ...msg, id });
    });
  const ready = new Promise((resolve, reject) => {
    worker.onerror = (e) => reject(new Error(e.message || 'The Java compiler failed to load.'));
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.command === 'initialized') return resolve();
      const p = pending.get(m.id);
      if (!p) return;
      if (m.command === 'compiler-diagnostic' || m.command === 'diagnostic') {
        if (/error/i.test(m.severity)) p.diags.push({ lineNumber: m.lineNumber, message: m.message || m.text });
        return;
      }
      pending.delete(m.id);
      p.resolve({ ...m, diags: p.diags });
    };
  })
    .then(() => send({ command: 'load-classlib', url: `${TEAVM}compile-classlib-teavm.bin`, runtimeUrl: `${TEAVM}runtime-classlib-teavm.bin` }))
    .then((m) => {
      if (m.command !== 'ok') throw new Error(m.text || 'The Java class library failed to load.');
    });
  let queue = ready; // the worker answers "Busy" to overlapping requests: one compile at a time
  // after an internal error the TeaVM worker stays "Busy" for good: drop it, the next run starts a fresh one
  const drop = (m) => {
    if (m.command === 'error') {
      worker.terminate();
      if (java === handle) java = null;
    }
    return m;
  };
  const handle = { ready, compile: (text) => (queue = queue.then(() => send({ command: 'compile', text }).then(drop))) };
  java = handle;
  ready.catch(() => (java = null));
  return java;
}

// ---------- C++: our clang worker ----------
let cpp;
function cppCompile(src, onStatus) {
  cpp ||= { worker: new Worker(new URL('./cppCompiler.js', import.meta.url), { type: 'module' }), seq: 0, queue: Promise.resolve() };
  const c = cpp;
  const job = () =>
    new Promise((resolve) => {
      const id = ++c.seq;
      let shown = -1;
      c.worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          const pct = Math.floor((100 * e.data.done) / (e.data.total || 1));
          if (pct !== shown) onStatus?.(pct >= 100 ? 'Compiling…' : `Downloading the C++ compiler (about 23 MB, once)… ${(shown = pct)}%`);
        } else if (e.data.id === id) resolve(e.data);
      };
      c.worker.postMessage({ id, src, flags: CPP_BROWSER_FLAGS, url: CLANG_URL });
    });
  return (c.queue = c.queue.then(job, job));
}

// ---------- running ----------
function execOnce(lang, wasm, input, msLeft) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./execWorker.js', import.meta.url), { type: 'module' });
    let stdout = '';
    const finish = (r) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ stdout, ...r });
    };
    const timer = setTimeout(() => finish({ timedOut: true }), msLeft);
    worker.onmessage = (e) => (e.data.type === 'out' ? (stdout += e.data.text) : finish({ crash: e.data.crash }));
    worker.onerror = (e) => finish({ crash: e.message || 'The program could not start.' });
    worker.postMessage({ lang, wasm, input, teavmRuntimeUrl: `${TEAVM}compiler.wasm-runtime.js` });
  });
}

const fail = (compileError) => ({ compileError, results: [], logs: [] });

/**
 * Compile `code` (Java or C++) and run it on `tests`. Same result shape as runInWorker:
 * { compileError? , results: [{ index, passed, error, output, ms, logs }], logs, timeout? }.
 * `onStatus(text)` reports "Downloading…", "Compiling…", "Running…".
 */
export async function runNative({ lang, code, question, tests, opts = {}, timeoutMs = 10000, onStatus }) {
  if (!driverSupports(question)) return fail(`Running ${LABEL[lang]} is not available for this question yet.`);
  const src = programFor(lang, question, code, { browser: true });
  let wasm;
  try {
    if (lang === 'java') {
      onStatus?.('Loading the Java compiler…');
      const c = javaCompiler();
      await c.ready;
      onStatus?.('Compiling…');
      const m = await c.compile(src);
      if (m.command === 'error') return fail(`The Java compiler stopped: ${m.text}`);
      if (m.status !== 'successful') return fail(compileErrorText('java', src, code, m.diags));
      wasm = new Uint8Array(m.script.buffer, m.script.byteOffset, m.script.byteLength).slice().buffer;
      // TeaVM sometimes emits an invalid module (seen: a method ending in while (true) {} with no return)
      if (!WebAssembly.validate(wasm)) return fail('The browser Java compiler produced an invalid program (a TeaVM bug). Try writing the method differently — e.g. make sure every path ends in a return.');
    } else {
      onStatus?.('Compiling…');
      const r = await cppCompile(src, onStatus);
      if (r.fatal) return fail(r.fatal);
      if (r.errors) return fail(compileErrorText('cpp', src, code, r.errors));
      wasm = r.wasm.slice().buffer;
    }
  } catch (err) {
    return fail(String(err && err.message ? err.message : err));
  }
  onStatus?.('Running…');
  return runCompiled({ lang, question, tests, opts, timeoutMs, exec: (input, msLeft) => execOnce(lang, wasm, input, msLeft) });
}
