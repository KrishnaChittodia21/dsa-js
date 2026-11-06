// "Animate my run" tab (M4): records the editor's code on one test (src/runner/recorder.js, in the worker) and
// replays every step in the Visualizer's player. The question's scene file (src/visualizations/scenes/), when it
// has one, adds its own story; the interaction kit adds: your own input, the reference run side by side,
// "break it" (a classic bug injected), a variable's history and a complexity meter. Loaded only when the tab opens.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { recordInWorker } from "../../runner/runInWorker.js";
import { describeTest, resolveArgs, resolveDesign } from "../../runner/core.js";
import { mutants } from "../../runner/bugs.js";
import {
  bigO,
  buildRunFrames,
  firstDivergence,
  historyOf,
  inputSize,
  varNames,
} from "../../visualizations/runFrames.js";
import {
  ALL_INTERACTIONS,
  loadScene,
} from "../../visualizations/scenes/index.js";

const Visualizer = lazy(() => import("../../visualizations/Visualizer.jsx"));
const short = (s) => (s.length > 44 ? `${s.slice(0, 41)}…` : s);
const VIEWS = { mine: "Your run", ref: "Reference", bug: "Broken on purpose" };

/** the typed-in input as a test, or an error message */
function parseOwn(src, question) {
  let v;
  try {
    v = JSON.parse(src);
  } catch (e) {
    return [null, `Not valid JSON: ${e.message}`];
  }
  if (question.kind === "design") {
    const ok =
      v &&
      Array.isArray(v.ops) &&
      Array.isArray(v.args) &&
      v.ops.length === v.args.length &&
      v.ops.length > 0;
    return ok
      ? [{ ops: v.ops, args: v.args }, ""]
      : [
          null,
          'Write {"ops": [...], "args": [[...], ...]} with one argument list per operation.',
        ];
  }
  const n = (question.paramNames || []).length;
  if (!Array.isArray(v) || (n && v.length !== n))
    return [
      null,
      `Write the arguments as a JSON array of ${n || "the"} values: [${(question.paramNames || []).join(", ")}].`,
    ];
  return [{ args: v }, ""];
}

const ownText = (question, t) =>
  JSON.stringify(
    question.kind === "design" ? resolveDesign(t) : resolveArgs(t),
  );

function verdictOf(run, own) {
  if (run.compileError) return "did not run";
  if (run.error) return "stopped with an error";
  if (own)
    return run.passed
      ? "same answer as the reference"
      : "differs from the reference";
  return run.passed ? "correct" : "wrong answer";
}

export default function AnimateRun({ code, question, tests }) {
  const [scene, setScene] = useState(null);
  const [pick, setPick] = useState(0); // a visible test's index, or 'own'
  const [own, setOwn] = useState("");
  const [busy, setBusy] = useState("");
  const [shown, setShown] = useState(null); // { code, test, own, label, view, mine, ref, bug }
  const [watch, setWatch] = useState("");
  const [meter, setMeter] = useState(null);
  const meterRef = useRef(null);

  // the Measure button goes away when the table appears: keep a keyboard user's place
  useEffect(() => {
    if (meter && (!document.activeElement || document.activeElement === document.body)) meterRef.current?.focus({ preventScroll: true });
  }, [meter]);

  useEffect(() => {
    let live = true;
    loadScene(question.id).then((s) => live && setScene(s));
    return () => {
      live = false;
    };
  }, [question.id]);

  const kit = new Set(scene?.interactions || ALL_INTERACTIONS);
  const refCode = question.solution?.code;
  const [ownTest, ownError] =
    pick === "own" ? parseOwn(own, question) : [null, ""];
  const record = (c, test) =>
    recordInWorker({ code: c, question, test, refCode });
  const framesOf = (run, c) =>
    buildRunFrames(run, c, scene || {}, question.harness ? [] : question.paramNames || []);

  const choose = (i) => {
    if (i === "own" && pick !== "own") setOwn(ownText(question, tests[pick]));
    setPick(i);
  };

  const animate = async () => {
    const test = pick === "own" ? ownTest : tests[pick];
    if (!test || busy) return;
    setBusy("Recording…");
    const run = await record(code, test);
    setShown({
      code,
      test,
      own: pick === "own",
      label: pick === "own" ? "your input" : `Test ${pick + 1}`,
      view: "mine",
      mine: { run, frames: framesOf(run, code) },
    });
    setWatch("");
    setMeter(null);
    setBusy("");
  };

  const showRef = async () => {
    if (busy) return;
    setBusy("Recording the reference…");
    const run = await record(refCode, shown.test);
    const name = scene?.compare;
    const has = (r) => r.steps.some((s) => name in s.vars);
    const at =
      name && has(shown.mine.run) && has(run)
        ? firstDivergence(shown.mine.run.steps, run.steps, name)
        : -1;
    const info = `Your run: ${(shown.mine.run.calls ?? 0).toLocaleString("en")} steps · reference: ${(run.calls ?? 0).toLocaleString("en")} steps.${at >= 0 ? ` Your ${name} first takes a different value at step ${at + 1} of your run.` : ""}`;
    setShown((s) => ({
      ...s,
      view: "ref",
      ref: { run, frames: framesOf(run, refCode), info },
    }));
    setBusy("");
  };

  const breakIt = async () => {
    if (busy) return;
    const base = shown.mine.run.passed ? shown.code : refCode;
    setBusy("Trying classic bugs…");
    let bug = null;
    for (const m of mutants(base, scene?.bugs).slice(0, 6)) {
      const run = await record(m.code, shown.test);
      if (!run.passed) {
        bug = {
          run,
          frames: framesOf(run, m.code),
          info: `${m.label} (line ${m.line} of ${base === shown.code ? "your code" : "the reference"}): ${m.explain}`,
        };
        break;
      }
    }
    setShown((s) => ({
      ...s,
      view: bug ? "bug" : s.view,
      bug: bug || { none: true },
    }));
    setBusy("");
  };

  const measure = async () => {
    if (busy) return;
    setBusy("Measuring…");
    const f = bigO(question.complexity?.time);
    const rows = [];
    const all = tests.map((t, i) => [`Test ${i + 1}`, t]);
    if (ownTest) all.push(["your input", ownTest]);
    for (const [name, t] of all) {
      const run = await record(code, t);
      const n =
        question.kind === "design"
          ? resolveDesign(t).ops.length
          : inputSize(resolveArgs(t));
      rows.push({
        name,
        n,
        steps: run.calls ?? 0,
        target: f ? Math.round(f(n)) : null,
        failed: !!(run.error || run.compileError),
      });
    }
    setMeter({ rows, time: f ? question.complexity.time : null });
    setBusy("");
  };

  const cur =
    shown && (shown[shown.view]?.frames ? shown[shown.view] : shown.mine);
  const history = shown && watch ? historyOf(shown.mine.run.steps, watch) : [];

  return (
    <div className="qp-stack">
      <span className="sr-only" role="status">
        {busy}
      </span>
      <p className="qp-faint">
        {scene ? (
          <>
            <b>{scene.metaphor}.</b> {scene.caption}
          </>
        ) : (
          "Runs your code on one test and replays every step: arrays, pointers, trees, graphs, maps and the variables in each function. Pick a test, then press Animate."
        )}
      </p>
      <div className="qp-chips" role="group" aria-label="Input to animate">
        {tests.map((t, i) => (
          <button
            key={i}
            type="button"
            className={`tag qp-anim-test${pick === i ? " on" : ""}`}
            aria-pressed={pick === i}
            onClick={() => choose(i)}
            title={describeTest(question, t)}
          >
            Test {i + 1} ·{" "}
            <span className="mono">{short(describeTest(question, t))}</span>
          </button>
        ))}
        {kit.has("edit") && refCode && (
          <button
            type="button"
            className={`tag qp-anim-test${pick === "own" ? " on" : ""}`}
            aria-pressed={pick === "own"}
            onClick={() => choose("own")}
          >
            <Icon name="code" size={12} /> Your own input
          </button>
        )}
      </div>
      {pick === "own" && (
        <div className="qp-stack">
          <textarea
            className="textarea"
            rows={3}
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            aria-label="Your own input, as JSON"
            spellCheck={false}
          />
          <p className="qp-faint" role={ownError ? "alert" : undefined}>
            {ownError ||
              `JSON: ${question.kind === "design" ? "the operations and their arguments" : `one value per parameter (${(question.paramNames || []).join(", ")})`}. The reference solution decides the expected answer.`}
          </p>
        </div>
      )}
      <div className="qp-row">
        <button
          type="button"
          className="btn btn--plasma btn--sm"
          onClick={animate}
          aria-disabled={!!busy || (pick === "own" && !ownTest) || undefined}
        >
          <Icon name="play" size={14} />{" "}
          {busy === "Recording…"
            ? busy
            : shown
              ? "Animate again"
              : "Animate my run"}
        </button>
        {shown && shown.code !== code && (
          <span className="qp-faint">
            The code changed since this run: animate again to see the new
            version.
          </span>
        )}
      </div>

      {shown && (
        <>
          <div className="qp-row">
            {(shown.ref || shown.bug?.frames) && (
              <div className="seg" role="group" aria-label="Which run to show">
                {["mine", "ref", "bug"]
                  .filter((v) => v === "mine" || shown[v]?.frames)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={shown.view === v}
                      onClick={() => setShown({ ...shown, view: v })}
                    >
                      {VIEWS[v]}
                    </button>
                  ))}
              </div>
            )}
            {kit.has("compare") && refCode && !shown.ref && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={showRef}
                aria-disabled={!!busy || undefined}
              >
                <Icon name="eye" size={14} /> Compare with the reference
              </button>
            )}
            {kit.has("break") && !shown.bug && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={breakIt}
                aria-disabled={!!busy || undefined}
              >
                <Icon name="alert" size={14} /> Break it
              </button>
            )}
            {kit.has("meter") && !meter && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={measure}
                aria-disabled={!!busy || undefined}
              >
                <Icon name="chart" size={14} /> Measure the work
              </button>
            )}
            {busy && busy !== "Recording…" && (
              <span className="qp-faint">{busy}</span>
            )}
          </div>
          {shown.view !== "mine" && cur.info && (
            <p className="qp-faint">{cur.info}</p>
          )}
          {shown.bug?.none && (
            <p className="qp-faint">
              None of the classic bugs changes the answer on this input. Try
              another test.
            </p>
          )}
          <Suspense
            fallback={<div className="qp-faint">Loading the player…</div>}
          >
            <Visualizer
              key={`${shown.view}-${shown.label}-${cur.frames.length}`}
              scenario={`run-${shown.view}`}
              frames={cur.frames}
              title={`${VIEWS[shown.view]} · ${shown.label}: ${verdictOf(cur.run, shown.own)}`}
              caption={`${cur.frames.length - 1} recorded steps${cur.run.truncated ? ` (every ${cur.run.stride}th shown)` : ""}. Changed cells light up; i, j, lo, hi… point at the array.`}
              eyebrow={scene?.metaphor || "your run"}
              autoPlay
              autoFocus
              bars={scene?.bars ?? true}
              wide
            />
          </Suspense>

          {kit.has("inspect") && (
            <div className="qp-stack">
              <label className="qp-row qp-faint">
                Trace a variable
                <select
                  className="select qp-anim-pick"
                  value={watch}
                  onChange={(e) => setWatch(e.target.value)}
                >
                  <option value="">choose…</option>
                  {varNames(shown.mine.run.steps).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              {watch && (
                <ol
                  className="qp-anim-hist"
                  tabIndex={0}
                  aria-label={`Values of ${watch} in your run`}
                >
                  {history.slice(0, 40).map((h) => (
                    <li key={h.step}>
                      <span className="qp-faint">step {h.step}</span>{" "}
                      <span className="mono">{h.value}</span>
                    </li>
                  ))}
                  {history.length > 40 && (
                    <li className="qp-faint">
                      …and {history.length - 40} more values
                    </li>
                  )}
                </ol>
              )}
            </div>
          )}

          {meter && (
            <div className="qp-stack">
              <p className="qp-faint">
                Statements your code ran
                {meter.time
                  ? `, next to the target ${meter.time} curve (every variable read as n). If the ratio stays about level as n grows, you match the target`
                  : ""}
                .
              </p>
              <div
                className="qp-anim-meter-wrap"
                ref={meterRef}
                tabIndex={0}
                role="region"
                aria-label="Steps your code ran on each input"
              >
                <table className="qp-anim-meter">
                  <thead>
                    <tr>
                      <th>input</th>
                      <th>n</th>
                      <th>steps</th>
                      {meter.time && <th>target</th>}
                      {meter.time && <th>ratio</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {meter.rows.map((r) => (
                      <tr key={r.name}>
                        <td>{r.name}</td>
                        <td>{r.n.toLocaleString("en")}</td>
                        <td>
                          {r.steps.toLocaleString("en")}
                          {r.failed ? " (stopped)" : ""}
                        </td>
                        {meter.time && <td>{r.target.toLocaleString("en")}</td>}
                        {meter.time && (
                          <td>{(r.steps / r.target).toFixed(1)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
