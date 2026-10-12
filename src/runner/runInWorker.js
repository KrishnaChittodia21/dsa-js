// Runs code in a fresh Web Worker so infinite loops can be killed.
const RUNNABLE_KEYS = ['kind', 'functionName', 'className', 'io', 'compare', 'harness', 'checker'];

export function runnableQuestion(q) {
  const out = {};
  for (const k of RUNNABLE_KEYS) if (q[k] !== undefined) out[k] = q[k];
  return out;
}

let seq = 0;

export function runInWorker({ code, question, tests, opts, timeoutMs = 10000 }) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    const id = ++seq;
    const partial = [];
    let running = -1;
    const timer = setTimeout(() => {
      worker.terminate();
      if (running < 0) {
        resolve({ timeout: true, compileError: `Time Limit Exceeded: stopped after ${timeoutMs / 1000}s. Look for an infinite loop at the top level of your code.`, results: [], logs: [] });
        return;
      }
      // Keep finished results; flag the test that was running; mark the rest as not run.
      const results = [...partial];
      results.push({ index: running, passed: false, timedOut: true, error: `Time limit exceeded on this test (stopped after ${timeoutMs / 1000}s). Infinite loop, or an approach that is too slow for this input size.` });
      for (let i = running + 1; i < tests.length; i++) results.push({ index: i, passed: false, skipped: true, error: 'Not run — an earlier test ran out of time.' });
      resolve({ timeout: true, results, logs: [] });
    }, timeoutMs);
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.id !== id) return;
      if (msg.type === 'start') running = msg.index;
      else if (msg.type === 'result') partial.push(msg.result);
      else if (msg.type === 'done') {
        clearTimeout(timer);
        worker.terminate();
        resolve(msg);
      }
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ compileError: e.message || 'Worker error', results: [], logs: [] });
    };
    worker.postMessage({ id, code, question: runnableQuestion(question), tests, opts });
  });
}
