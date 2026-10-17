import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../editor/CodeEditor.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { runInWorker } from '../../runner/runInWorker.js';
import { describeTest, format, resolveExpected } from '../../runner/core.js';

const VISIBLE_TESTS = 3;

const MARK = { pass: '✓', fail: '×', skip: '–', ran: '·' };
const MARK_LABEL = { pass: 'passed', fail: 'failed', skip: 'skipped', ran: 'ran' };

// One line of the graded ledger: mark · scenario · time; opens to show input / expected / output.
function ResultCard({ r, test, question, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = r.skipped ? 'skip' : r.passed === null ? 'ran' : r.passed ? 'pass' : 'fail';
  return (
    <li className={`ledger-row ledger-${status} ${open ? 'is-open' : ''}`}>
      <button type="button" className="ledger-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="ledger-mark" aria-label={MARK_LABEL[status]}>
          {MARK[status]}
        </span>
        <span className="ledger-name">{test.scenario || test.name || `Test ${r.index + 1}`}</span>
        {test.hidden && <span className="ledger-tag">hidden</span>}
        <span className="ledger-ms">{r.ms !== undefined ? `${r.ms.toFixed(1)} ms` : ''}</span>
        <span className="ledger-caret" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && status === 'fail' && test.hint && (
        <p className="ledger-hint">
          <strong>The case you missed — {test.scenario}.</strong> {test.hint}
        </p>
      )}
      {open && (
        <dl className="ledger-body">
          <div className="ledger-line">
            <dt>Input</dt>
            <dd>
              <pre>{describeTest(question, test)}</pre>
            </dd>
          </div>
          {r.passed !== null && (
            <div className="ledger-line">
              <dt>Expected</dt>
              <dd>
                <pre>{test.expectedAnyOf ? test.expectedAnyOf.map((e) => format(e)).join('  or  ') : question.checker ? 'any valid answer (checked by rules)' : format(resolveExpected(test))}</pre>
              </dd>
            </div>
          )}
          <div className="ledger-line">
            <dt>{r.error ? 'Error' : 'Got'}</dt>
            <dd>
              <pre className={r.error ? 'ledger-error' : ''}>{r.error || r.output}</pre>
            </dd>
          </div>
          {r.logs?.length > 0 && (
            <div className="ledger-line">
              <dt>Console</dt>
              <dd>
                <pre>{r.logs.join('\n')}</pre>
              </dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

function Targets({ question }) {
  return (
    <dl className="complexity-pills">
      <div>
        <dt className="eyebrow">Target time</dt>
        <dd className="complexity-value">{question.complexity?.time}</dd>
      </div>
      <div>
        <dt className="eyebrow">Target space</dt>
        <dd className="complexity-value">{question.complexity?.space}</dd>
      </div>
    </dl>
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

  const failing = summary ? summary.total - summary.passed : 0;
  const TABS = [
    ['tests', 'Results'],
    ['cases', 'Test cases'],
    ['custom', 'Your own input'],
    ['complexity', 'Complexity'],
  ];

  return (
    <div className="ws">
      <div className="ws-toolbar">
        <span className="ws-lang">JavaScript</span>
        <span className="ws-note">MinHeap, Deque, UnionFind and the other toolkit classes are already loaded.</span>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} title="Reset to starter code">
          Reset
        </button>
        <button type="button" className="btn btn-sm" onClick={() => execute('run')} disabled={running} title="Run the example tests (Ctrl/⌘+Enter)">
          Run <kbd className="ws-kbd">⌘↵</kbd>
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => execute('submit')} disabled={running} title="Run every test (Ctrl/⌘+Shift+Enter)">
          Submit
        </button>
      </div>
      <div className="ws-editor">
        <CodeEditor value={code} onChange={onChange} onRun={() => execute('run')} onSubmit={() => execute('submit')} label={`${question.title} solution editor`} />
      </div>
      <div className="ws-bottom">
        <div className="ws-tabs" role="tablist" aria-label="Test output">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" id={`ws-tab-${id}`} className="ws-tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
              {id === 'tests' && summary && <span className="folio"> {summary.passed}/{summary.total}</span>}
            </button>
          ))}
        </div>
        <div className="ws-panel" role="tabpanel" aria-labelledby={`ws-tab-${tab}`} aria-live="polite" aria-busy={running}>
          {running && <p className="ws-running">Running your code…</p>}
          {!running && tab === 'tests' && (
            <>
              {!run && (
                <p className="ws-empty">
                  <strong>Run</strong> checks the {Math.min(VISIBLE_TESTS, tests.length)} examples. <strong>Submit</strong> grades all {tests.length} tests, hidden ones included.
                </p>
              )}
              {run?.res.compileError && (
                <div className="grade grade-bad">
                  <span className="stamp stamp-bad">{run.res.timeout ? 'Out of time' : "Didn't run"}</span>
                  <p className="grade-sub">{run.res.timeout ? 'One test took too long — look for a loop that never ends, or work that repeats.' : "That didn't run. The first line of the error usually tells you why."}</p>
                  <pre className="ledger-error grade-pre">{run.res.compileError}</pre>
                </div>
              )}
              {summary && (
                <div className={`grade ${accepted ? 'grade-ok' : summary.passed === summary.total ? 'grade-partial' : 'grade-bad'}`}>
                  <div className="grade-score">
                    <span className="grade-num">{summary.passed}</span>
                    <span className="grade-of">/{summary.total}</span>
                  </div>
                  <div className="grade-text">
                    {accepted ? (
                      <span className="stamp stamp-good">Accepted</span>
                    ) : summary.passed === summary.total ? (
                      <span className="grade-title">Every example passes. Now submit it for the full set.</span>
                    ) : (
                      <span className="stamp stamp-bad">
                        {failing} failing
                      </span>
                    )}
                    <p className="grade-sub">
                      {summary.passed} of {summary.total} passed · <span className="folio">{summary.ms.toFixed(1)} ms</span> total
                      {run.res.timeout && ' · stopped: one test ran out of time'}
                      {accepted && question.complexity && ` · target ${question.complexity.time} time, ${question.complexity.space} space`}
                    </p>
                  </div>
                </div>
              )}
              {summary && summary.passed < summary.total && (
                <div className="missed">
                  <div className="eyebrow">Cases your code doesn&apos;t handle yet</div>
                  <ul className="missed-list">
                    {run.res.results
                      .filter((r) => !r.passed && !r.skipped)
                      .map((r) => (
                        <li key={r.index} title={run.tests[r.index].hint}>
                          × {run.tests[r.index].scenario || `Test ${r.index + 1}`}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {summary && run.mode === 'run' && summary.passed === summary.total && tests.length > VISIBLE_TESTS && (
                <p className="ws-note">
                  Submit also checks: {tests.slice(VISIBLE_TESTS).map((t) => t.scenario).filter(Boolean).join(' · ')}
                </p>
              )}
              {run && run.res.results.length > 0 && (
                <ol className="ledger" aria-label="Test results">
                  {run.res.results.map((r) => (
                    <ResultCard key={`${run.mode}-${r.index}`} r={r} test={run.tests[r.index]} question={question} defaultOpen={!r.passed && run.res.results.filter((x) => !x.passed)[0] === r} />
                  ))}
                </ol>
              )}
            </>
          )}
          {!running && tab === 'cases' && (
            <div className="ws-cases">
              {tests.slice(0, VISIBLE_TESTS).map((t, i) => (
                <div key={i} className="ws-case">
                  <div className="ws-case-head">
                    <span className="folio">Test {i + 1}</span>
                    {t.scenario ? <span> · {t.scenario}</span> : null}
                  </div>
                  <pre>{describeTest(question, t)}</pre>
                  <div className="ws-case-expect">
                    <span className="eyebrow">Expected</span> <code>{t.expectedAnyOf ? t.expectedAnyOf.map((e) => format(e)).join(' or ') : question.checker ? 'any valid answer' : format(resolveExpected(t))}</code>
                  </div>
                </div>
              ))}
              {tests.length > VISIBLE_TESTS && (
                <div className="ws-hidden">
                  <p className="ws-note">
                    {tests.length - VISIBLE_TESTS} more tests run on Submit. Before you submit, ask whether your code handles each of these:
                  </p>
                  <ul className="missed-list missed-list-plain">
                    {tests.slice(VISIBLE_TESTS).map((t, i) => (
                      <li key={i}>
                        ○ {t.scenario || `Hidden test ${i + 1}`}
                        {t.timeLimitMs ? <span className="ws-timed"> · timed</span> : ''}
                      </li>
                    ))}
                  </ul>
                  {tests.some((t) => t.timeLimitMs) && <p className="ws-note">Timed tests fail a correct answer that is too slow.</p>}
                </div>
              )}
            </div>
          )}
          {!running && tab === 'custom' && (
            <div className="ws-custom">
              <label className="eyebrow" htmlFor={`custom-${question.id}`}>
                {question.kind === 'design' ? 'Operations as JSON: {"ops": [...], "args": [...]}' : `Arguments as a JSON array: [${(question.paramNames || []).join(', ')}]`}
              </label>
              <textarea id={`custom-${question.id}`} className="textarea" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} spellCheck={false} />
              <div className="row-wrap">
                <button type="button" className="btn btn-sm btn-primary" onClick={runCustom}>
                  Run this input
                </button>
                <span className="ws-note">The reference solution runs on it too, so you can compare.</span>
              </div>
              {customRun?.error && <p className="ledger-error">{customRun.error}</p>}
              {customRun?.mine && (
                <div className="ws-compare">
                  <div className="ws-case">
                    <div className="eyebrow">Your output</div>
                    <pre className={customRun.mine.compileError || customRun.mine.results[0]?.error ? 'ledger-error' : ''}>
                      {customRun.mine.compileError || customRun.mine.results[0]?.error || customRun.mine.results[0]?.output}
                    </pre>
                    {customRun.mine.results[0]?.logs?.length > 0 && <pre className="ws-logs">{customRun.mine.results[0].logs.join('\n')}</pre>}
                  </div>
                  <div className="ws-case">
                    <div className="eyebrow">Expected (reference)</div>
                    <pre>{customRun.ref ? customRun.ref.compileError || customRun.ref.results[0]?.error || customRun.ref.results[0]?.output : '—'}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          {!running && tab === 'complexity' && (
            <div className="ws-custom">
              {solved || qs.solutionViewed ? <Targets question={question} /> : <ComplexityGuess question={question} />}
              {summary && <p className="ws-note">Last run: {summary.ms.toFixed(2)} ms across {summary.total} tests. The inputs are small, so timing is a sanity check, not a proof of complexity.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComplexityGuess({ question }) {
  const [shown, setShown] = useState(false);
  if (shown) return <Targets question={question} />;
  return (
    <div className="ws-custom">
      <p>Before you look: what time and space does your solution use? The constraints hint at the target — n ≤ 10⁵ usually means O(n) or O(n log n).</p>
      <div>
        <button type="button" className="btn btn-sm" onClick={() => setShown(true)}>
          Show the target complexity
        </button>
      </div>
    </div>
  );
}
