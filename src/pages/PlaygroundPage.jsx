import { useState } from 'react';
import CodeEditor from '../components/editor/CodeEditor.jsx';
import Icon from '../components/ui/Icon.jsx';
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
  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Playground</h1>
          <p>Experiment with JavaScript and the DSA toolkit. Ctrl/⌘ + Enter runs.</p>
        </div>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={() => save(DEFAULT)}>
          <Icon name="rotate" size={15} /> Reset
        </button>
        <button type="button" className="btn btn-primary" onClick={run} disabled={running}>
          <Icon name="play" size={15} /> Run
        </button>
      </div>
      <div className="playground">
        <div className="playground-editor">
          <CodeEditor value={code} onChange={save} onRun={run} label="Playground editor" />
        </div>
        <div className="card playground-out">
          <div className="card-title">Output</div>
          {!out && <div className="small muted">Run the code to see output.</div>}
          {out?.compileError && <pre className="result-error mono small">{out.compileError}</pre>}
          {r && (
            <>
              {r.logs?.length > 0 && <pre className="mono small">{r.logs.join('\n')}</pre>}
              {r.error ? <pre className="result-error mono small">{r.error}</pre> : <pre className="mono small">→ {r.output}</pre>}
              <div className="small faint">{r.ms?.toFixed(2)} ms</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
