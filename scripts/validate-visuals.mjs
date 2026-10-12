#!/usr/bin/env node
// Validates visualization scenarios: runs generate() on the default input (and any extra
// `testInputs`) and checks every frame's structure and predict questions.
// Usage: node scripts/validate-visuals.mjs [path/to/scenarioModule.js ...]
//        (no args = every scenario registered in src/visualizations/scenarios/index.js)
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PANEL_KINDS = new Set(['array', 'stack', 'queue', 'vars', 'list', 'nodes', 'grid', 'table', 'intervals']);
const FIELD_TYPES = new Set(['numbers', 'number', 'string', 'strings', 'json', 'select']);
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

function checkPanel(where, p) {
  if (!p || !PANEL_KINDS.has(p.kind)) return err(where, `unknown panel kind ${p && p.kind}`);
  const isArr = (x) => Array.isArray(x);
  switch (p.kind) {
    case 'array':
      if (!isArr(p.values)) err(where, 'array panel needs values[]');
      for (const ptr of p.pointers || []) if (typeof ptr.index !== 'number' || !ptr.label) err(where, 'pointer needs index + label');
      if (p.range && (!isArr(p.range) || p.range.length !== 2)) err(where, 'range must be [l, r]');
      break;
    case 'stack':
    case 'queue':
      if (!isArr(p.values)) err(where, `${p.kind} panel needs values[]`);
      break;
    case 'vars':
      if (!p.vars || typeof p.vars !== 'object') err(where, 'vars panel needs vars{}');
      break;
    case 'list':
      if (!isArr(p.values) || !isArr(p.next) || p.values.length !== p.next.length) err(where, 'list panel needs values[] and next[] of equal length');
      break;
    case 'nodes': {
      if (!isArr(p.nodes) || !isArr(p.edges)) return err(where, 'nodes panel needs nodes[] + edges[]');
      const ids = new Set(p.nodes.map((n) => n.id));
      for (const n of p.nodes) if (typeof n.x !== 'number' || typeof n.y !== 'number' || Number.isNaN(n.x) || Number.isNaN(n.y) || typeof n.label !== 'string') err(where, `node ${n.id} needs numeric x/y and string label`);
      for (const e of p.edges) if (!ids.has(e.from) || !ids.has(e.to)) err(where, `edge ${e.from}->${e.to} references a missing node`);
      break;
    }
    case 'grid':
      if (!isArr(p.cells) || !p.cells.every(isArr)) err(where, 'grid panel needs cells[][]');
      break;
    case 'table':
      if (!isArr(p.cells) || !isArr(p.rowLabels) || !isArr(p.colLabels)) return err(where, 'table needs cells, rowLabels, colLabels');
      if (p.cells.length !== p.rowLabels.length) err(where, 'table rowLabels length != rows');
      if (p.cells.some((r) => r.length !== p.colLabels.length)) err(where, 'table colLabels length != columns');
      break;
    case 'intervals':
      if (!isArr(p.items) || typeof p.min !== 'number' || typeof p.max !== 'number') err(where, 'intervals panel needs items[], min, max');
      break;
  }
}

function checkScenario(id, sc) {
  for (const k of ['title', 'description', 'defaultInput', 'generate']) if (!sc[k]) err(id, `missing ${k}`);
  for (const f of sc.fields || []) {
    if (!f.key || !f.label || !FIELD_TYPES.has(f.type)) err(id, `bad field ${JSON.stringify(f)}`);
    if (sc.defaultInput && !(f.key in sc.defaultInput)) err(id, `field ${f.key} missing from defaultInput`);
  }
  const inputs = [sc.defaultInput, ...(sc.testInputs || [])];
  let predicts = 0;
  inputs.forEach((input, ii) => {
    let frames;
    try {
      frames = sc.generate(structuredClone(input));
    } catch (e) {
      return err(`${id} input#${ii}`, `generate threw: ${e.message}`);
    }
    if (!Array.isArray(frames) || frames.length < 2) return err(`${id} input#${ii}`, 'generate must return 2+ frames');
    if (frames.length > 400) err(`${id} input#${ii}`, `${frames.length} frames — too many for a learner, reduce detail`);
    frames.forEach((f, fi) => {
      const where = `${id} input#${ii} frame#${fi}`;
      if (typeof f.note !== 'string' || !f.note) err(where, 'frame needs a note');
      if (!Array.isArray(f.panels)) err(where, 'frame needs panels[]');
      else f.panels.forEach((p, pi) => checkPanel(`${where} panel#${pi}`, p));
      if (f.predict) {
        predicts++;
        const p = f.predict;
        if (fi === 0) err(where, 'predict cannot be on the first frame (it asks about the step INTO this frame)');
        if (!p.question || !Array.isArray(p.options) || p.options.length < 2 || p.options.length > 4) err(where, 'predict needs question + 2–4 options');
        if (typeof p.answer !== 'number' || p.answer < 0 || p.answer >= (p.options || []).length) err(where, 'predict answer index out of range');
      }
    });
    try {
      JSON.stringify(frames);
    } catch {
      err(`${id} input#${ii}`, 'frames must be JSON-serialisable (no cycles)');
    }
  });
  return predicts;
}

const args = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let scenarios = [];
if (args.length) {
  for (const a of args) {
    const mod = await import(pathToFileURL(path.resolve(a)).href);
    for (const [name, v] of Object.entries(mod)) if (v && typeof v.generate === 'function') scenarios.push([name, v]);
  }
} else {
  const { SCENARIOS } = await import(pathToFileURL(path.join(root, 'src/visualizations/scenarios/index.js')).href);
  scenarios = Object.entries(SCENARIOS);
}
if (!args.length) {
  // Cross-checks between the registry, the title index and the pattern mapping.
  const { SCENARIO_TITLES } = await import(pathToFileURL(path.join(root, 'src/visualizations/scenarioTitles.js')).href);
  const { PATTERN_VISUALS } = await import(pathToFileURL(path.join(root, 'src/visualizations/patternVisuals.js')).href);
  const registered = new Set(scenarios.map(([id]) => id));
  for (const id of registered) if (!SCENARIO_TITLES[id]) err('scenarioTitles.js', `missing title for "${id}"`);
  for (const id of Object.keys(SCENARIO_TITLES)) if (!registered.has(id)) err('scenarioTitles.js', `"${id}" is not registered in scenarios/index.js`);
  for (const [pid, v] of Object.entries(PATTERN_VISUALS)) if (!registered.has(v.scenario)) err('patternVisuals.js', `pattern "${pid}" uses unknown scenario "${v.scenario}"`);
  // Mapped inputs must also produce valid frames.
  for (const [pid, v] of Object.entries(PATTERN_VISUALS)) {
    const sc = scenarios.find(([id]) => id === v.scenario)?.[1];
    if (sc && v.input) {
      try {
        const frames = sc.generate({ ...structuredClone(sc.defaultInput), ...structuredClone(v.input) });
        if (!Array.isArray(frames) || frames.length < 2) err(`patternVisuals.js ${pid}`, 'mapped input produced < 2 frames');
      } catch (e) {
        err(`patternVisuals.js ${pid}`, `mapped input threw: ${e.message}`);
      }
    }
  }
}
for (const [id, sc] of scenarios) {
  const n = checkScenario(id, sc);
  console.log(`${id.padEnd(30)} ${n} predict question(s) on default/test inputs`);
}
if (errors.length) {
  console.log(`\n✖ ${errors.length} errors`);
  for (const e of errors.slice(0, 60)) console.log('  ' + e);
  process.exit(1);
}
console.log(`\n✔ ${scenarios.length} scenarios valid`);
