import { runTests } from './core.js';

// Streams each test result as soon as it finishes, so if a later test hangs the page
// still knows which tests passed and which scenario was running when time ran out.
self.onmessage = (e) => {
  const { id, code, question, tests, opts } = e.data;
  try {
    const res = runTests(code, question, tests, {
      ...opts,
      onStart: (index) => self.postMessage({ id, type: 'start', index }),
      onResult: (result) => self.postMessage({ id, type: 'result', result }),
    });
    self.postMessage({ id, type: 'done', ...res });
  } catch (err) {
    self.postMessage({ id, type: 'done', compileError: String(err && err.message ? err.message : err), results: [], logs: [] });
  }
};
