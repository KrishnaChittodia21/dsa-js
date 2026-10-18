import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../editor/CodeEditor.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { runInWorker } from '../../runner/runInWorker.js';
import { describeTest, format, resolveExpected } from '../../runner/core.js';
import { bigoClass } from '../../visualizations/complexity.js';

const VISIBLE_TESTS = 3;
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const MOD = IS_MAC ? '⌘' : 'Ctrl';

const expectedText = (question, test) =>
  test.expectedAnyOf ? test.expectedAnyOf.map((e) => format(e)).join('  or  ') : question.checker ? 'any valid answer (checked by rules)' : format(resolveExpected(test));

/** One test line: pass/fail/ran, runtime; opens to the input · expected · output diff. */
function ResultCard({ r, test, question, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = r.skipped ? 'skip' : r.passed === null ? 'ran' : r.passed ? 'pass' : 'fail';
  const cls = status === 'pass' ? 'test--pass' : status === 'fail' ? 'test--fail' : 'test--run';
  return (
    <div className={`test qp-test ${cls}${status === 'skip' ? ' qp-test--skip' : ''}`}>
      <button type="button" className="qp-test-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="test-ico">
          <Icon name={status === 'pass' ? 'check' : status === 'fail' ? 'x' : status === 'skip' ? 'circle' : 'play'} size={12} />
        </span>
        <span className="qp-test-name">
          <b>{test.scenario || test.name || `Test ${r.index + 1}`}</b>
          {test.hidden && <span className="qp-test-sc"> · hidden</span>}
          {test.timeLimitMs ? <span className="qp-test-sc"> · ⏱ {test.timeLimitMs} ms limit</span> : null}
        </span>
        <span className="ms">{r.ms !== undefined ? `${r.ms.toFixed(1)} ms` : ''}</span>
        <Icon name="chevronDown" size={14} className={`qp-test-chev${open ? ' is-open' : ''}`} />
      </button>
      {open && (
        <div className="qp-diff">
          <span className="qp-diff-k">Input</span>
          <pre className="qp-diff-v">{describeTest(question, test)}</pre>
          {r.passed !== null && (
            <>
              <span className="qp-diff-k">Expected</span>
              <pre className="qp-diff-v exp">{expectedText(question, test)}</pre>
            </>
          )}
          <span className="qp-diff-k">{r.error ? 'Error' : 'Output'}</span>
          <pre className={`qp-diff-v ${r.error ? 'qp-err' : status === 'fail' ? 'got' : status === 'pass' ? 'exp' : ''}`}>{r.error || r.output}</pre>
          {r.logs?.length > 0 && (
            <>
              <span className="qp-diff-k">Console</span>
              <pre className="qp-diff-v">{r.logs.join('\n')}</pre>
            </>
          )}
          {status === 'fail' && test.hint && (
            <div className="qp-miss">
              <Icon name="target" size={15} />
              <span>
                <b>Scenario you missed: {test.scenario}.</b> {test.hint}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Targets({ question }) {
  return (
    <div className="qp-cx-targets">
      <div>
        <span className="lbl-mono">target time</span>
        <span className={`bigo ${bigoClass(question.complexity?.time)}`}>{question.complexity?.time || '—'}</span>
      </div>
      <div>
        <span className="lbl-mono">target space</span>
        <span className={`bigo ${bigoClass(question.complexity?.space)}`}>{question.complexity?.space || '—'}</span>
      </div>
    </div>
  );
}

export default function CodeWorkspace({ question }) {
  const { progress, dispatch } = useProgress();
  const qs = progress.questions[question.id] || {};
  const [code, setCode] = useState(qs.code ?? question.starterCode ?? '');
  const [tab, setTab] = useState('tests');
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState(null); // { mode, res, tests, at }
  const [custom, setCustom] = useState('');
  const [customRun, setCustomRun] = useState(null);
  const [saved, setSaved] = useState(true);
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
      setSaved(false);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        dispatch({ type: 'Q_SAVE_CODE', qid: question.id, code: v });
        setSaved(true);
      }, 600);
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
      setRun({ mode, res, tests: subset, at: new Date() });
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
    slowest: Math.max(0, ...run.res.results.map((r) => r.ms || 0)),
    timedOut: !!run.res.timeout,
  };
  const accepted = summary && summary.passed === summary.total && run.mode === 'submit';
  const allPass = summary && summary.passed === summary.total;
  const failing = summary ? summary.total - summary.passed : run?.res.compileError ? 1 : 0;
  const solved = qs.status === 'solved';
  const firstFail = run?.res.results.find((r) => !r.passed && !r.skipped);
  const tone = accepted ? 'ok' : allPass ? 'uv' : 'bad';
  const at = run?.at ? run.at.toTimeString().slice(0, 5) : '';

  return (
    <div className="qp-work">
      {/* ---------- editor (dark island) ---------- */}
      <section className="qp-ed" aria-label="Code editor">
        <div className="qp-ed-bar">
          <span className="qp-file">
            <i aria-hidden="true" />
            solution.js
          </span>
          <span className="tag qp-ed-lang">JavaScript</span>
          <span className="qp-ed-hint">MinHeap, Deque, UnionFind… are global</span>
          <span className="qp-sp" />
          <button type="button" className="iconbtn qp-ed-reset" onClick={reset} title="Reset to starter code" aria-label="Reset to starter code">
            <Icon name="rotate" size={16} />
          </button>
          <button type="button" className="btn btn--chrome btn--sm" onClick={() => execute('run')} disabled={running} title={`Run the visible tests (${MOD}+Enter)`}>
            <Icon name="play" size={14} /> Run
          </button>
          <button type="button" className="btn btn--plasma btn--sm" onClick={() => execute('submit')} disabled={running} title={`Run all tests (${MOD}+Shift+Enter)`}>
            Submit <Icon name="send" size={14} />
          </button>
        </div>
        <div className="qp-ed-body">
          <CodeEditor value={code} onChange={onChange} onRun={() => execute('run')} onSubmit={() => execute('submit')} label={`${question.title} solution editor`} />
        </div>
        <div className="qp-ed-foot">
          <span>{saved ? 'autosaved' : 'saving…'}</span>
          <span className="qp-sp" />
          <span>
            <span className="kbd">{MOD} ↵</span> run
          </span>
          <span>
            <span className="kbd">{MOD} ⇧ ↵</span> submit
          </span>
        </div>
      </section>

      {/* ---------- results console ---------- */}
      <section className="qp-con" aria-label="Tests">
        <div className="qp-con-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'tests'} onClick={() => setTab('tests')}>
            <Icon name="checkCircle" size={15} /> Test results
            {failing > 0 && <span className="qp-con-n">{failing} failing</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'cases'} onClick={() => setTab('cases')}>
            Test cases
          </button>
          <button type="button" role="tab" aria-selected={tab === 'custom'} onClick={() => setTab('custom')}>
            Custom input
          </button>
          <button type="button" role="tab" aria-selected={tab === 'complexity'} onClick={() => setTab('complexity')}>
            Complexity
          </button>
          <span className="qp-sp" />
          {run && (
            <span className="qp-con-meta">
              {run.mode} · {at}
            </span>
          )}
        </div>
        <div className="qp-con-body" aria-live="polite">
          {running && (
            <div className="qp-running">
              <span className="qp-running-dot" aria-hidden="true" /> Running in a sandboxed worker…
            </div>
          )}
          {!running && tab === 'tests' && (
            <>
              {!run && (
                <div className="qp-empty">
                  Press <b>Run</b> to test against the <span className="mono">{Math.min(VISIBLE_TESTS, tests.length)}</span> example cases, or <b>Submit</b> to run all{' '}
                  <span className="mono">{tests.length}</span> tests.
                </div>
              )}
              {run?.res.compileError && (
                <div className="qp-verdict qp-verdict--bad">
                  <span className="qp-verdict-big">
                    0<small> / {run.tests.length}</small>
                  </span>
                  <div>
                    <h3>{run.res.timeout ? 'Time Limit Exceeded' : 'Your code threw before any test finished'}</h3>
                    <pre className="qp-err qp-compile">{run.res.compileError}</pre>
                  </div>
                  <span className="chip qp-chip--bad">
                    <Icon name="alert" size={13} /> Error
                  </span>
                </div>
              )}
              {summary && (
                <>
                  <div className={`qp-verdict qp-verdict--${tone}`}>
                    <span className="qp-verdict-big">
                      {summary.passed}
                      <small> / {summary.total}</small>
                    </span>
                    <div>
                      <h3>
                        {accepted
                          ? 'Accepted'
                          : allPass
                            ? 'All example tests pass — now Submit'
                            : firstFail
                              ? `Wrong answer on “${run.tests[firstFail.index].scenario || `Test ${firstFail.index + 1}`}”`
                              : `${failing} test${failing > 1 ? 's' : ''} failing`}
                      </h3>
                      <p>
                        {run.mode === 'submit' ? 'Submit ran all' : 'Run checked'} <span className="mono">{summary.total}</span> tests · <span className="mono">{summary.ms.toFixed(1)} ms</span> total
                        {run.res.timeout && ' · stopped: one test ran out of time'}
                        {!allPass && ` · ${failing} scenario${failing > 1 ? 's' : ''} your code doesn't handle yet`}
                      </p>
                    </div>
                    <span className={`chip ${accepted ? 'qp-chip--ok' : allPass ? 'qp-chip--uv' : 'qp-chip--bad'}`}>
                      <Icon name={accepted ? 'checkCircle' : allPass ? 'send' : 'x'} size={13} /> {accepted ? 'Accepted' : allPass ? 'Examples pass' : 'Rejected'}
                    </span>
                  </div>
                  <div className="qp-cases" style={{ '--n': run.res.results.length }} aria-label={`${summary.total} tests: ${summary.passed} pass`}>
                    {run.res.results.map((r) => (
                      <i key={r.index} className={`${r.passed ? '' : r.skipped ? 's' : 'f'}${run.tests[r.index].timeLimitMs ? ' t' : ''}`} title={run.tests[r.index].scenario || `Test ${r.index + 1}`} />
                    ))}
                  </div>
                  <div className="qp-cases-l">
                    <span>
                      1 – {Math.min(VISIBLE_TESTS, run.tests.length)} · examples
                    </span>
                    {run.tests.length > VISIBLE_TESTS && <span>{VISIBLE_TESTS + 1} – {run.tests.length} hidden</span>}
                    <span>slowest {summary.slowest.toFixed(1)} ms</span>
                  </div>
                  {accepted && question.complexity && (
                    <div className="qp-accepted-cx">
                      <span className="lbl-mono">target</span>
                      <span className={`bigo ${bigoClass(question.complexity.time)}`}>{question.complexity.time} time</span>
                      <span className={`bigo ${bigoClass(question.complexity.space)}`}>{question.complexity.space} space</span>
                    </div>
                  )}
                  {run.mode === 'run' && allPass && tests.length > VISIBLE_TESTS && (
                    <div className="qp-also">
                      Submit also checks: {tests.slice(VISIBLE_TESTS).map((t) => t.scenario).filter(Boolean).join(' · ')}
                    </div>
                  )}
                </>
              )}
              {run && run.res.results.length > 0 && (
                <div className="tests qp-tests">
                  {run.res.results.map((r) => (
                    <ResultCard key={`${run.mode}-${r.index}-${run.at?.getTime()}`} r={r} test={run.tests[r.index]} question={question} defaultOpen={firstFail === r} />
                  ))}
                </div>
              )}
            </>
          )}
          {!running && tab === 'cases' && (
            <div className="qp-stack">
              {tests.slice(0, VISIBLE_TESTS).map((t, i) => (
                <div key={i} className="qp-case">
                  <div className="lbl-mono">
                    Test {i + 1}
                    {t.scenario ? ` · ${t.scenario}` : ''}
                  </div>
                  <div className="qp-diff">
                    <span className="qp-diff-k">Input</span>
                    <pre className="qp-diff-v">{describeTest(question, t)}</pre>
                    <span className="qp-diff-k">Expected</span>
                    <pre className="qp-diff-v exp">{t.expectedAnyOf ? t.expectedAnyOf.map((e) => format(e)).join(' or ') : question.checker ? 'any valid answer' : format(resolveExpected(t))}</pre>
                  </div>
                </div>
              ))}
              {tests.length > VISIBLE_TESTS && (
                <div className="qp-hidden">
                  <p>
                    + <span className="mono">{tests.length - VISIBLE_TESTS}</span> hidden tests run on Submit. Think about whether your code handles each of these before submitting:
                  </p>
                  <div className="qp-chips">
                    {tests.slice(VISIBLE_TESTS).map((t, i) => (
                      <span key={i} className="tag">
                        {t.scenario || `Hidden test ${i + 1}`}
                        {t.timeLimitMs ? ' ⏱' : ''}
                      </span>
                    ))}
                  </div>
                  {tests.some((t) => t.timeLimitMs) && <p className="qp-faint">⏱ = timed test: a correct but too-slow solution fails it.</p>}
                </div>
              )}
            </div>
          )}
          {!running && tab === 'custom' && (
            <div className="qp-stack">
              <label className="lbl-mono" htmlFor={`custom-${question.id}`}>
                {question.kind === 'design' ? 'Operations as JSON: {"ops": [...], "args": [...]}' : `Arguments as a JSON array: [${(question.paramNames || []).join(', ')}]`}
              </label>
              <textarea id={`custom-${question.id}`} className="textarea qp-custom" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} spellCheck={false} />
              <div className="qp-row">
                <button type="button" className="btn btn--chrome btn--sm" onClick={runCustom}>
                  <Icon name="play" size={14} /> Run custom input
                </button>
                <span className="qp-faint">The reference solution runs on the same input so you can compare.</span>
              </div>
              {customRun?.error && <div className="qp-err">{customRun.error}</div>}
              {customRun?.mine && (
                <div className="qp-diff qp-diff--custom">
                  <span className="qp-diff-k">Yours</span>
                  <pre className={`qp-diff-v ${customRun.mine.compileError || customRun.mine.results[0]?.error ? 'qp-err' : ''}`}>
                    {customRun.mine.compileError || customRun.mine.results[0]?.error || customRun.mine.results[0]?.output}
                  </pre>
                  {customRun.mine.results[0]?.logs?.length > 0 && (
                    <>
                      <span className="qp-diff-k">Console</span>
                      <pre className="qp-diff-v">{customRun.mine.results[0].logs.join('\n')}</pre>
                    </>
                  )}
                  <span className="qp-diff-k">Reference</span>
                  <pre className="qp-diff-v exp">{customRun.ref ? customRun.ref.compileError || customRun.ref.results[0]?.error || customRun.ref.results[0]?.output : '—'}</pre>
                </div>
              )}
            </div>
          )}
          {!running && tab === 'complexity' && (
            <div className="qp-stack">
              {solved || qs.solutionViewed ? <Targets question={question} /> : <ComplexityGuess question={question} />}
              {summary && (
                <p className="qp-faint">
                  Last run: <span className="mono">{summary.ms.toFixed(2)} ms</span> across <span className="mono">{summary.total}</span> tests (small inputs — timing is a sanity check, not a complexity proof).
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ComplexityGuess({ question }) {
  const [shown, setShown] = useState(false);
  if (shown) return <Targets question={question} />;
  return (
    <div className="qp-stack">
      <p className="qp-p">
        Before looking: what time and space complexity is your solution? Check the constraints — they tell you the target (e.g. n ≤ 10⁵ usually means O(n) or O(n log n)).
      </p>
      <div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(true)}>
          Show target complexity
        </button>
      </div>
    </div>
  );
}
