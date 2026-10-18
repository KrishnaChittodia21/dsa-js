import { useState } from 'react';
import CodeEditor from '../components/editor/CodeEditor.jsx';
import Icon from '../components/ui/Icon.jsx';
import { runInWorker } from '../runner/runInWorker.js';
import { toolkit } from '../content/index.js';
import { WorkbenchHeader } from './ToolkitPage.jsx';

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
const GLOBALS = [...new Set(toolkit.flatMap((t) => t.exports || []))];

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
  const failed = !!(out?.compileError || r?.error);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

  return (
    <div className="page wb-page pl-page">
      <WorkbenchHeader title="Playground" lead="A scratch runner with the whole toolkit loaded. Experiment with JavaScript and the DSA classes — nothing here is graded." />
      <section className="tile pl-shell rise" style={{ '--i': 1 }} aria-labelledby="pl-t">
        <div className="pl-bar">
          <div>
            <span className="eyebrow">
              <i className="pip pip--acid" />
              Playground · main() runs in a worker
            </span>
            <h2 id="pl-t" className="h2" style={{ marginTop: 10 }}>
              Scratch runner
            </h2>
          </div>
          <span className="pl-sp" />
          <span className="pl-hint mono">{isMac ? '⌘' : 'Ctrl'} + ↵ runs</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => save(DEFAULT)}>
            <Icon name="rotate" size={15} /> Reset
          </button>
          <button type="button" className="btn btn--plasma btn--sm" onClick={run} disabled={running}>
            <Icon name="play" size={15} /> {running ? 'Running…' : 'Run'}
          </button>
        </div>
        <div className="pl-body">
          <div className="pl-editor">
            <CodeEditor value={code} onChange={save} onRun={run} label="Playground editor" />
          </div>
          <div className="pl-out" aria-label="Console output" aria-live="polite">
            <div className="pl-out-h">
              <span>console</span>
              {out && (failed ? <b className="pl-bad">✗ error</b> : <b className="pl-ok">✓ ran{r?.ms != null ? ` in ${r.ms.toFixed(2)} ms` : ''}</b>)}
            </div>
            {!out && <div className="pl-lg pl-muted">Run the code to see output.</div>}
            {out?.compileError && <pre className="pl-err">{out.compileError}</pre>}
            {r && (
              <>
                {(r.logs || []).map((l, i) => (
                  <pre key={i} className="pl-lg">
                    {l}
                  </pre>
                ))}
                {r.error ? <pre className="pl-err">{r.error}</pre> : <pre className="pl-rv">{r.output}</pre>}
              </>
            )}
            <div className="pl-lg">
              <span className="pl-cur" />
            </div>
          </div>
        </div>
        <div className="pl-globals">
          <span className="pl-lbl">globals</span>
          {GLOBALS.map((g) => (
            <span key={g} className="tag">
              {g}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
