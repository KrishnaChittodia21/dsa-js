import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../editor/CodeEditor.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { runInWorker } from '../../runner/runInWorker.js';
import { describeTest, format, resolveExpected } from '../../runner/core.js';

const VISIBLE_TESTS = 3;

function ResultCard({ r, test, question, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = r.skipped ? 'skip' : r.passed === null ? 'ran' : r.passed ? 'pass' : 'fail';
  return (
    <div className={`result result-${status}`}>
      <button type="button" className="result-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name={status === 'pass' ? 'checkCircle' : status === 'fail' ? 'x' : status === 'skip' ? 'circle' : 'play'} size={15} />
        <span>{test.scenario || test.name || `Test ${r.index + 1}`}</span>
        {test.hidden && <span className="badge">hidden</span>}
        <span className="spacer" />
        <span className="small mono muted">{r.ms !== undefined ? `${r.ms.toFixed(1)} ms` : ''}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && status === 'fail' && test.hint && (
        <div className="result-hint small">
          <Icon name="bulb" size={14} />
          <span>
            <strong>Scenario you missed: {test.scenario}.</strong> {test.hint}
          </span>
        </div>
      )}
      {open && (
        <div className="result-body mono small">
          <div className="result-row">
            <span className="result-k">Input</span>
            <pre>{describeTest(question, test)}</pre>
          </div>
          {r.passed !== null && (
            <div className="result-row">
              <span className="result-k">Expected</span>
              <pre>{test.expectedAnyOf ? test.expectedAnyOf.map((e) => format(e)).join('  or  ') : question.checker ? 'any valid answer (checked by rules)' : format(resolveExpected(test))}</pre>
            </div>
          )}
          <div className="result-row">
            <span className="result-k">{r.error ? 'Error' : 'Output'}</span>
            <pre className={r.error ? 'result-error' : ''}>{r.error || r.output}</pre>
          </div>
          {r.logs?.length > 0 && (
            <div className="result-row">
              <span className="result-k">Console</span>
              <pre>{r.logs.join('\n')}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CodeWorkspace({ question }) {
  const { progress, dispatch } = useProgress();
  const qs = progress.questions[question.id] || {};
  const [code, setCode] = useState(qs.code ?? question.starterCode ?? '');
  const [tab, setTab] = useState('tests');
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState(null); // { mode, res, tests }
  const [custom, setCustom] = useState('');
  const [customRun, setCustomRun] = useState(null);
  const saveTimer = useRef(null);

  const tests = useMemo(() => (question.tests || []).map((t, i) => ({ ...t, hidden: i >= VISIBLE_TESTS })), [question]);

  useEffect(() => {
    setCode(progress.questions[question.id]?.code ?? question.starterCode ?? '');
    setRun(null);
    setCustomRun(null);
    const first = question.tests?.[0];
    setCustom(first && (first.args || first.ops) ? JSON.stringify(question.kind === 'design' ? { ops: first.ops, args: first.args } : first.args) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const onChange = useCallback(
    (v) => {
      setCode(v);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => dispatch({ type: 'Q_SAVE_CODE', qid: question.id, code: v }), 600);
    },
    [dispatch, question.id],
  );

  const execute = useCallback(
    async (mode) => {
      if (running) return;
      setRunning(true);
      setTab('tests');
      const subset = mode === 'submit' ? tests : tests.slice(0, VISIBLE_TESTS);
      const res = await runInWorker({ code, question, tests: subset });
      setRun({ mode, res, tests: subset });
      const passed = res.results.filter((r) => r.passed).length;
      const total = subset.length;
      if (mode === 'submit') dispatch({ type: 'Q_SUBMIT', qid: question.id, passed, total, allPassed: !res.compileError && passed === total });
      else dispatch({ type: 'Q_RUN', qid: question.id, passed, total });
      setRunning(false);
    },
    [code, question, tests, running, dispatch],
  );

  const runCustom = async () => {
    let test;
    try {
      const parsed = JSON.parse(custom);
      if (question.kind === 'design') {
        if (!parsed.ops || !parsed.args) throw new Error('Design input must look like {"ops": [...], "args": [...]}');
        test = { ops: parsed.ops, args: parsed.args };
      } else {
        if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of arguments, e.g. [[1,2,3], 2]');
        test = { args: parsed };
      }
    } catch (e) {
      setCustomRun({ error: e.message });
      return;
    }
    setRunning(true);
    const [mine, ref] = await Promise.all([
      runInWorker({ code, question, tests: [test], opts: { compareWith: false } }),
      question.solution?.code ? runInWorker({ code: question.solution.code, question, tests: [test], opts: { compareWith: false } }) : Promise.resolve(null),
    ]);
    setCustomRun({ test, mine, ref });
    setRunning(false);
  };

  const reset = () => {
    if (!window.confirm('Reset the editor to the starter code? Your current code will be lost.')) return;
    setCode(question.starterCode || '');
    dispatch({ type: 'Q_SAVE_CODE', qid: question.id, code: question.starterCode || '' });
  };

  const summary = run && !run.res.compileError && run.res.results.length > 0 && {
    passed: run.res.results.filter((r) => r.passed).length,
    total: run.res.results.length,
    ms: run.res.results.reduce((s, r) => s + (r.ms || 0), 0),
    timedOut: !!run.res.timeout,
  };
  const accepted = summary && summary.passed === summary.total && run.mode === 'submit';
  const solved = qs.status === 'solved';

  return (
    <div className="workspace">
      <div className="workspace-toolbar">
        <span className="badge badge-accent mono">JavaScript</span>
        <span className="small faint">Toolkit classes (MinHeap, Deque, UnionFind…) are available globally.</span>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} title="Reset to starter code">
          <Icon name="rotate" size={14} /> Reset
        </button>
        <button type="button" className="btn btn-sm" onClick={() => execute('run')} disabled={running} title="Run visible tests (Ctrl/⌘+Enter)">
          <Icon name="play" size={14} /> Run
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => execute('submit')} disabled={running} title="Run all tests (Ctrl/⌘+Shift+Enter)">
          <Icon name="send" size={14} /> Submit
        </button>
      </div>
      <div className="workspace-editor">
        <CodeEditor value={code} onChange={onChange} onRun={() => execute('run')} onSubmit={() => execute('submit')} label={`${question.title} solution editor`} />
      </div>
      <div className="workspace-bottom">
        <div className="tabs workspace-tabs" role="tablist">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'tests'} onClick={() => setTab('tests')}>
            Test results
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'cases'} onClick={() => setTab('cases')}>
            Test cases
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'custom'} onClick={() => setTab('custom')}>
            Custom input
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'complexity'} onClick={() => setTab('complexity')}>
            Complexity
          </button>
        </div>
        <div className="workspace-panel" aria-live="polite">
          {running && <div className="muted small">Running…</div>}
          {!running && tab === 'tests' && (
            <>
              {!run && <div className="muted small">Press <strong>Run</strong> to test against the {Math.min(VISIBLE_TESTS, tests.length)} example cases, or <strong>Submit</strong> to run all {tests.length} tests.</div>}
              {run?.res.compileError && (
                <div className="result result-fail">
                  <div className="result-head">
                    <Icon name="alert" size={15} /> {run.res.timeout ? 'Time Limit Exceeded' : 'Error'}
                  </div>
                  <pre className="result-error mono small" style={{ padding: '0 0.75rem 0.75rem' }}>{run.res.compileError}</pre>
                </div>
              )}
              {summary && (
                <div className={`run-summary ${accepted ? 'ok' : summary.passed === summary.total ? 'partial-ok' : 'bad'}`}>
                  <Icon name={summary.passed === summary.total ? 'checkCircle' : 'alert'} size={18} />
                  <div>
                    <div className="run-summary-title">
                      {accepted ? 'Accepted' : summary.passed === summary.total ? 'All example tests pass — now Submit' : `${summary.total - summary.passed} test${summary.total - summary.passed > 1 ? 's' : ''} failing`}
                    </div>
                    <div className="small muted">
                      {summary.passed}/{summary.total} passed · {summary.ms.toFixed(1)} ms total
                      {run.res.timeout && ' · stopped: one test ran out of time'}
                      {accepted && question.complexity && ` · Target: ${question.complexity.time} time, ${question.complexity.space} space`}
                    </div>
                  </div>
                </div>
              )}
              {summary && summary.passed < summary.total && (
                <div className="missed-scenarios">
                  <div className="small" style={{ fontWeight: 600 }}>Scenarios your code doesn't handle yet:</div>
                  <div className="row-wrap">
                    {run.res.results
                      .filter((r) => !r.passed && !r.skipped)
                      .map((r) => (
                        <span key={r.index} className="badge badge-danger" title={run.tests[r.index].hint}>
                          {run.tests[r.index].scenario || `Test ${r.index + 1}`}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {summary && run.mode === 'run' && summary.passed === summary.total && tests.length > VISIBLE_TESTS && (
                <div className="small muted">
                  Submit also checks: {tests.slice(VISIBLE_TESTS).map((t) => t.scenario).filter(Boolean).join(' · ')}
                </div>
              )}
              {run &&
                run.res.results.map((r) => (
                  <ResultCard key={`${run.mode}-${r.index}`} r={r} test={run.tests[r.index]} question={question} defaultOpen={!r.passed && run.res.results.filter((x) => !x.passed)[0] === r} />
                ))}
            </>
          )}
          {!running && tab === 'cases' && (
            <div className="stack-sm">
              {tests.slice(0, VISIBLE_TESTS).map((t, i) => (
                <div key={i} className="case">
                  <div className="small muted">
                    Test {i + 1}
                    {t.scenario ? ` · ${t.scenario}` : ''}
                  </div>
                  <pre className="mono small">{describeTest(question, t)}</pre>
                  <div className="small">
                    Expected: <code>{t.expectedAnyOf ? t.expectedAnyOf.map((e) => format(e)).join(' or ') : question.checker ? 'any valid answer' : format(resolveExpected(t))}</code>
                  </div>
                </div>
              ))}
              {tests.length > VISIBLE_TESTS && (
                <div className="small">
                  <div className="muted" style={{ marginBottom: '0.35rem' }}>
                    + {tests.length - VISIBLE_TESTS} hidden tests run on Submit. Think about whether your code handles each of these before submitting:
                  </div>
                  <div className="row-wrap">
                    {tests.slice(VISIBLE_TESTS).map((t, i) => (
                      <span key={i} className="badge badge-outline">
                        {t.scenario || `Hidden test ${i + 1}`}
                        {t.timeLimitMs ? ' ⏱' : ''}
                      </span>
                    ))}
                  </div>
                  {tests.some((t) => t.timeLimitMs) && <div className="faint" style={{ marginTop: '0.35rem' }}>⏱ = timed test: a correct but too-slow solution fails it.</div>}
                </div>
              )}
            </div>
          )}
          {!running && tab === 'custom' && (
            <div className="stack-sm">
              <label className="small muted" htmlFor={`custom-${question.id}`}>
                {question.kind === 'design' ? 'Operations as JSON: {"ops": [...], "args": [...]}' : `Arguments as a JSON array: [${(question.paramNames || []).join(', ')}]`}
              </label>
              <textarea id={`custom-${question.id}`} className="textarea" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} spellCheck={false} />
              <div className="row">
                <button type="button" className="btn btn-sm btn-primary" onClick={runCustom}>
                  <Icon name="play" size={14} /> Run custom input
                </button>
                <span className="small faint">The reference solution runs on the same input so you can compare.</span>
              </div>
              {customRun?.error && <div className="result-error small">{customRun.error}</div>}
              {customRun?.mine && (
                <div className="grid-2">
                  <div className="case">
                    <div className="small muted">Your output</div>
                    <pre className={`mono small ${customRun.mine.compileError || customRun.mine.results[0]?.error ? 'result-error' : ''}`}>
                      {customRun.mine.compileError || customRun.mine.results[0]?.error || customRun.mine.results[0]?.output}
                    </pre>
                    {customRun.mine.results[0]?.logs?.length > 0 && <pre className="mono small muted">{customRun.mine.results[0].logs.join('\n')}</pre>}
                  </div>
                  <div className="case">
                    <div className="small muted">Expected (reference solution)</div>
                    <pre className="mono small">{customRun.ref ? customRun.ref.compileError || customRun.ref.results[0]?.error || customRun.ref.results[0]?.output : '—'}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          {!running && tab === 'complexity' && (
            <div className="stack-sm">
              {solved || qs.solutionViewed ? (
                <div className="complexity-pills">
                  <div>
                    <div className="small muted">Target time</div>
                    <div className="complexity-value">{question.complexity?.time}</div>
                  </div>
                  <div>
                    <div className="small muted">Target space</div>
                    <div className="complexity-value">{question.complexity?.space}</div>
                  </div>
                </div>
              ) : (
                <ComplexityGuess question={question} />
              )}
              {summary && <div className="small muted">Last run: {summary.ms.toFixed(2)} ms across {summary.total} tests (small inputs — timing is a sanity check, not a complexity proof).</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComplexityGuess({ question }) {
  const [shown, setShown] = useState(false);
  if (shown)
    return (
      <div className="complexity-pills">
        <div>
          <div className="small muted">Target time</div>
          <div className="complexity-value">{question.complexity?.time}</div>
        </div>
        <div>
          <div className="small muted">Target space</div>
          <div className="complexity-value">{question.complexity?.space}</div>
        </div>
      </div>
    );
  return (
    <div className="stack-sm">
      <div className="small">Before looking: what time and space complexity is your solution? Check the constraints — they tell you the target (e.g. n ≤ 10⁵ usually means O(n) or O(n log n)).</div>
      <div>
        <button type="button" className="btn btn-sm" onClick={() => setShown(true)}>
          Show target complexity
        </button>
      </div>
    </div>
  );
}
