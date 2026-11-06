// M7: the C++ compiler worker — clang built for WebAssembly (@yowasp/clang), loaded from the CDN on first use
// (~23 MB, cached by the browser) and kept for the next compiles. Replies { wasm } or { errors: clang's stderr }.
let clang;

self.onmessage = async (e) => {
  const { id, src, flags, url } = e.data;
  let runClang;
  try {
    clang ||= import(/* @vite-ignore */ url).then(async (m) => {
      // download the toolchain first: runClang does not pass fetchProgress on, runLLVM(null) only fetches
      await m.runLLVM(null, {}, { fetchProgress: ({ totalLength, doneLength }) => self.postMessage({ type: 'progress', done: doneLength, total: totalLength }) });
      return m;
    });
    ({ runClang } = await clang);
  } catch (err) {
    clang = null;
    self.postMessage({ id, type: 'done', fatal: `The C++ compiler failed to load: ${err && err.message ? err.message : err}` });
    return;
  }
  let stderr = '';
  try {
    const out = await runClang(['clang++', ...flags, 'main.cpp', '-o', 'main.wasm'], { 'main.cpp': src }, {
      stderr: (b) => b && (stderr += new TextDecoder().decode(b)),
    });
    self.postMessage({ id, type: 'done', wasm: out['main.wasm'] });
  } catch (err) {
    self.postMessage({ id, type: 'done', errors: stderr || String(err && err.message ? err.message : err) });
  }
};
