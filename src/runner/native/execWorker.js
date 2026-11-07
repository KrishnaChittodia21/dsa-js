// M7: runs one compiled Java (TeaVM) or C++ (WASI) program on the encoded tests and streams its stdout back.
// A fresh worker per run, so the host can terminate it when the time limit is up.
import { wasi, WasiExit } from './wasi.js';

self.onmessage = async (e) => {
  const { lang, wasm, input, teavmRuntimeUrl } = e.data;
  let line = '';
  let stderr = '';
  let crash = null;
  // pass stdout on line by line: the host keeps what finished even if a later test hangs
  const out = (text) => {
    line += text;
    const i = line.lastIndexOf('\n');
    if (i >= 0) {
      self.postMessage({ type: 'out', text: line.slice(0, i + 1) });
      line = line.slice(i + 1);
    }
  };
  try {
    if (lang === 'java') {
      const { load } = await import(/* @vite-ignore */ teavmRuntimeUrl);
      const mod = await load(new Uint8Array(wasm), {
        installImports(o) {
          o.teavmConsole.putcharStdout = (ch) => (ch === 10 ? out('\n') : (line += String.fromCharCode(ch)));
          o.teavmConsole.putcharStderr = (ch) => (stderr += String.fromCharCode(ch));
        },
      });
      mod.exports.main([input]);
    } else {
      const w = wasi(input, out, (s) => (stderr += s));
      const { instance } = await WebAssembly.instantiate(wasm, { wasi_snapshot_preview1: w.imports });
      w.setMemory(instance.exports.memory);
      try {
        instance.exports._start();
      } catch (err) {
        if (!(err instanceof WasiExit)) throw err;
        if (err.code !== 0) crash = stderr.trim() || `exit code ${err.code}`;
      }
    }
  } catch (err) {
    crash = `${stderr.trim()} ${err && err.message ? err.message : err}`.trim();
  }
  if (line) self.postMessage({ type: 'out', text: line });
  self.postMessage({ type: 'end', crash });
};
