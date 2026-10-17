import { useState } from 'react';
import CodeEditor from '../components/editor/CodeEditor.jsx';
import { runInWorker } from '../runner/runInWorker.js';

const KEY = 'dsa-journey:playground';
const DEFAULT = `// Free-form JavaScript playground. All toolkit classes are available.
// Define main() — its return value is printed. console.log works too.

function main() {
  const pq = new MinHeap((x) => x[0]);
  [[5, 'e'], [1, 'a'], [3, 'c']].forEach((item) => pq.push(item));
  const order = [];
  while (!pq.isEmpty()) order.push(pq.pop()[1]);
  console.log('popped in priority order:', order);

  const uf = new UnionFind(5);
  uf.union(0, 1);
  uf.union(3, 4);
  return { groups: uf.count, connected01: uf.connected(0, 1) };
}
`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem(KEY) || DEFAULT;
    } catch {
      return DEFAULT;
    }
  });
  const [out, setOut] = useState(null);
  const [running, setRunning] = useState(false);
  const save = (v) => {
    setCode(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
  };
  const run = async () => {
    setRunning(true);
    const res = await runInWorker({ code, question: { functionName: 'main' }, tests: [{ args: [] }], opts: { compareWith: false } });
    setOut(res);
    setRunning(false);
  };
  const r = out?.results?.[0];
  const failed = out?.compileError || r?.error;
  return (
    <div className="page page-wide pg ink-in">
      <header className="pg-head">
        <div>
          <span className="eyebrow">Scratch paper</span>
          <h1>Playground</h1>
          <p>Try an idea before it becomes an answer. Every toolkit class is already loaded; whatever <code>main()</code> returns is printed below the console lines.</p>
        </div>
        <div className="pg-actions">
          <button type="button" className="rf-textbtn" onClick={() => save(DEFAULT)}>
            Reset to the example
          </button>
          <button type="button" className="btn btn-primary" onClick={run} disabled={running} aria-keyshortcuts="Control+Enter Meta+Enter">
            {running ? 'Running…' : 'Run the code'}
            <kbd className="pg-kbd" aria-hidden="true">
              Ctrl/⌘ ↵
            </kbd>
          </button>
        </div>
      </header>
      <div className="pg-bench">
        <div className="pg-editor">
          <span className="pg-label eyebrow" aria-hidden="true">
            main.js
          </span>
          <CodeEditor value={code} onChange={save} onRun={run} label="Playground editor" />
        </div>
        <section className={`pg-out ${failed ? 'is-error' : ''}`} aria-labelledby="pg-out-h" aria-live="polite">
          <header className="pg-out-head">
            <h2 id="pg-out-h" className="eyebrow">
              Console
            </h2>
            {r?.ms != null && <span className="folio">{r.ms.toFixed(2)} ms</span>}
          </header>
          {!out && <p className="pg-empty">Nothing printed yet. Press Run — or Ctrl/⌘ + Enter in the editor — and the output lands here.</p>}
          {out?.compileError && (
            <>
              <p className="pg-err-note">That didn't run. The first line of the error usually tells you why.</p>
              <pre className="pg-err">{out.compileError}</pre>
            </>
          )}
          {r && (
            <>
              {r.logs?.length > 0 && <pre className="pg-logs">{r.logs.join('\n')}</pre>}
              {r.error ? (
                <>
                  <p className="pg-err-note">That didn't run. The first line of the error usually tells you why.</p>
                  <pre className="pg-err">{r.error}</pre>
                </>
              ) : (
                <pre className="pg-return">
                  <span className="pg-return-k">main() returned</span>
                  {'\n'}→ {r.output}
                </pre>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
