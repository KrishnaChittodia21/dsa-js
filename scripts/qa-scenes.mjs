// QA harness for "Animate my run" scene files (M4, W4.2): node scripts/qa-scenes.mjs [question-id …]
// For every scene in src/visualizations/scenes/ (or only the ids given), on the question's visible tests:
//   - the reference solution PASSES when recorded with the scene on, and frames build without throwing
//   - every frame is well-formed (panel kinds, pointer / highlight ranges, node and edge ids), none is empty
//   - narrate() tells at least one step, predict() (when present) asks at least one valid question
//   - at least one injected bug (the scene's own, then runner/bugs.js) makes the reference FAIL a fixed test
//   - phone width: warns when a panel is estimated wider than ~700 px (it would shrink below ~45 % on a phone)
// Exit code 1 when any scene has an error; warnings do not fail.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { recordRun } from '../src/runner/recorder.js';
import { buildRunFrames } from '../src/visualizations/runFrames.js';
import { mutants } from '../src/runner/bugs.js';
import { PANEL_KINDS } from '../src/content/stepSchema.js';

const SCENES = path.resolve('src/visualizations/scenes');
const TOPICS = path.resolve('src/content/topics');
const PHONE_MAX = 700;
const VISIBLE = 3;

async function questionsById() {
  const out = new Map();
  for (const t of fs.readdirSync(TOPICS)) {
    const dir = path.join(TOPICS, t, 'questions');
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) out.set(f.slice(0, -3), path.join(dir, f));
  }
  return out;
}

/** rough rendered width of a panel in px (mirrors the sizes in panels.jsx / viz.css) */
function width(p) {
  const cell = (v) => Math.max(44, String(v).length * 9.5 + 18) + 8; // as runFrames.js cellPx
  switch (p.kind) {
    case 'array':
      return p.values.reduce((s, v) => s + cell(v), 0);
    case 'list':
      return p.values.reduce((s, v) => s + cell(v) + 26, 0);
    case 'queue':
      return p.values.reduce((s, v) => s + cell(v), 90);
    case 'table': {
      const w = Math.max(40, ...p.cells.flat().map((v) => String(v).length * 8 + 16), ...p.colLabels.map((v) => String(v).length * 8 + 16));
      return (p.colLabels.length + 1) * w;
    }
    case 'grid':
      return (p.cells[0]?.length || 1) * 40;
    case 'nodes': {
      const xs = p.nodes.map((n) => n.x * (p.freeLayout ? 70 : 52));
      return xs.length ? Math.max(...xs) - Math.min(...xs) + 60 : 0;
    }
    default:
      return 0;
  }
}

function checkFrames(frames, errs, at) {
  if (!frames.length) errs.push(`${at}: no frames`);
  frames.forEach((f, k) => {
    const where = `${at} frame ${k + 1}`;
    if (typeof f.note !== 'string' || !f.note) errs.push(`${where}: no note`);
    if (!f.panels?.length && k < frames.length - 1) errs.push(`${where}: no panels`);
    for (const p of f.panels || []) {
      if (!PANEL_KINDS.includes(p.kind)) errs.push(`${where}: panel kind ${p.kind}`);
      if (p.kind === 'array') {
        for (const i of Object.keys(p.highlights || {})) if (!(+i >= 0 && +i < p.values.length)) errs.push(`${where}: highlight ${i} out of range`);
        for (const ptr of p.pointers || []) if (!(ptr.index >= 0 && ptr.index < p.values.length)) errs.push(`${where}: pointer ${ptr.label} out of range`);
      }
      if (p.kind === 'nodes') {
        const ids = new Set(p.nodes.map((n) => n.id));
        for (const e of p.edges) if (!ids.has(e.from) || !ids.has(e.to)) errs.push(`${where}: edge ${e.from}→${e.to} to a missing node`);
      }
      if (p.kind === 'table' && p.cells.length !== p.rowLabels.length) errs.push(`${where}: table rows / labels differ`);
    }
    const q = f.predict;
    if (q) {
      const ok = typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4 && new Set(q.options).size === q.options.length && q.answer >= 0 && q.answer < q.options.length && typeof q.explain === 'string';
      if (!ok) errs.push(`${where}: malformed prediction ${JSON.stringify(q).slice(0, 120)}`);
    }
  });
}

/** @returns { errors: [], warnings: [], stats } for one scene file */
export async function qaScene(id, file, qPath) {
  const errors = [];
  const warnings = [];
  const stats = { frames: 0, told: 0, asked: 0, bug: null, widest: 0 };
  let scene;
  try {
    scene = (await import(pathToFileURL(file).href)).default;
  } catch (e) {
    return { errors: [`does not load: ${e.message}`], warnings, stats };
  }
  if (!qPath) return { errors: [`no question with id "${id}"`], warnings, stats };
  const q = (await import(pathToFileURL(qPath).href)).default;
  if (scene?.id !== id) errors.push(`scene.id is "${scene?.id}", expected "${id}"`);
  const code = q.solution?.code;
  if (!code) return { errors: [...errors, 'question has no reference solution'], warnings, stats };
  const tests = (q.tests || []).slice(0, VISIBLE);
  // count narrated steps (and catch bad return types) without changing the scene's behaviour
  const wrapped = {
    ...scene,
    narrate: scene.narrate
      ? (ctx) => {
          const r = scene.narrate(ctx);
          if (r !== null && r !== undefined && typeof r !== 'string') throw new Error(`narrate returned ${typeof r}`);
          if (r) stats.told++;
          return r;
        }
      : undefined,
  };
  for (const [i, t] of tests.entries()) {
    const at = `test ${i + 1}`;
    const run = recordRun(code, q, t);
    if (!run.passed) {
      errors.push(`${at}: reference does not pass when recorded (${run.compileError || run.error || run.outputText})`);
      continue;
    }
    let frames;
    try {
      frames = buildRunFrames(run, code, wrapped, q.paramNames || []);
    } catch (e) {
      errors.push(`${at}: building frames threw: ${e.message}`);
      continue;
    }
    checkFrames(frames, errors, at);
    stats.frames += frames.length;
    stats.asked += frames.filter((f) => f.predict).length;
    for (const f of frames) for (const p of f.panels || []) stats.widest = Math.max(stats.widest, width(p));
  }
  if (scene.narrate && !stats.told) errors.push('narrate() never tells a step on the visible tests');
  if (!scene.narrate) warnings.push('no narrate(): notes are the generic "Line N: … → changes"');
  if (scene.predict && !stats.asked) errors.push('predict() never asks on the visible tests');
  if (stats.widest > PHONE_MAX) warnings.push(`a panel is ~${Math.round(stats.widest)} px wide: it will shrink to ~${Math.round((298 / stats.widest) * 100)} % on a phone`);
  for (const b of scene.bugs || []) if (!code.includes(b.find)) warnings.push(`bug "${b.label}": its find text is not in the reference (fine if it targets a common user version)`);
  const plain = (q.tests || []).filter((t) => !t.argsGen && !t.opsGen); // a bug may only show on an edge case
  for (const m of mutants(code, scene.bugs)) {
    const fails = plain.some((t) => {
      const r = recordRun(m.code, q, t);
      return !r.passed && !r.compileError && r.steps.length > 0;
    });
    if (fails) {
      stats.bug = m.label;
      break;
    }
  }
  // every listed bug must break something, or "Break it" may show a run that is still correct
  for (const m of mutants(code, scene.bugs).filter((x) => (scene.bugs || []).some((b) => b.label === x.label))) {
    const fails = plain.some((t) => {
      const r = recordRun(m.code, q, t);
      return !r.passed && !r.compileError;
    });
    if (!fails) warnings.push(`bug "${m.label}" fails no test: drop it or change it`);
  }
  if (!stats.bug) errors.push('no injected bug fails any test: add a scene bug ({ label, find, replace, explain }) that does');
  for (const k of ['metaphor', 'caption']) if (typeof scene[k] !== 'string' || !scene[k]) errors.push(`missing ${k}`);
  return { errors, warnings, stats };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv.slice(2);
  const qs = await questionsById();
  const files = fs.readdirSync(SCENES).filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'util.js');
  const ids = files.map((f) => f.slice(0, -3)).filter((id) => !only.length || only.includes(id));
  let bad = 0;
  for (const id of only) {
    if (!ids.includes(id)) {
      console.log(`✖ ${id}: no scene file`);
      bad++;
    }
  }
  for (const id of ids) {
    const { errors, warnings, stats } = await qaScene(id, path.join(SCENES, `${id}.js`), qs.get(id));
    console.log(`${errors.length ? '✖' : '✔'} ${id} · ${stats.frames} frames, ${stats.told} narrated, ${stats.asked} predictions, bug: ${stats.bug || '—'}`);
    for (const e of errors) console.log(`    error: ${e}`);
    for (const w of warnings) console.log(`    warn:  ${w}`);
    if (errors.length) bad++;
  }
  console.log(`${bad ? '✖' : '✔'} ${ids.length + only.filter((id) => !ids.includes(id)).length - bad} of ${ids.length + only.filter((id) => !ids.includes(id)).length} scenes pass QA`);
  process.exit(bad ? 1 : 0);
}
