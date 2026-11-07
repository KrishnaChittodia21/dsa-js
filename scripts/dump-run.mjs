// Prints a recorded run, step by step: what a scene file's narrate / predict see in ctx.vars.
// Usage: node scripts/dump-run.mjs <question-id> [test-number=1] [max-steps=60] [--code <file>] [--frames]
//   --code <file>  run this solution instead of the reference (test a scene on learner-style code)
//   --frames       print the frames as the player shows them, with the question's scene: notes + predictions
// Note: JSON printing shows Infinity / NaN as null; scenes see the real numbers.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { recordRun } from '../src/runner/recorder.js';
import { buildRunFrames } from '../src/visualizations/runFrames.js';

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const [, value] = argv.splice(i, name === '--frames' ? 1 : 2);
  return value ?? true;
};
const codeFile = flag('--code');
const showFrames = flag('--frames');
const [id, testNo = '1', max = '60'] = argv;
if (!id) {
  console.log('usage: node scripts/dump-run.mjs <question-id> [test-number] [max-steps] [--code <file>] [--frames]');
  process.exit(1);
}
const root = path.resolve('src/content/topics');
const file = fs
  .readdirSync(root)
  .map((t) => path.join(root, t, 'questions', `${id}.js`))
  .find((f) => fs.existsSync(f));
if (!file) {
  console.log(`no question "${id}"`);
  process.exit(1);
}
const q = (await import(pathToFileURL(file).href)).default;
const test = q.tests[Number(testNo) - 1];
const code = codeFile ? fs.readFileSync(codeFile, 'utf8') : q.solution.code;
const run = recordRun(code, q, test, { refCode: q.solution.code });
const lines = code.split('\n');
const input = q.kind === 'design' ? { ops: test.ops, args: test.args } : test.args;
console.log(`${q.id} · params ${JSON.stringify(q.paramNames)} · test ${testNo}: ${(JSON.stringify(input) || '(generated)').slice(0, 200)}`);
console.log(`passed=${run.passed} steps=${run.steps.length} calls=${run.calls}${run.ops.length ? ` ops=${run.ops.length}` : ''}${run.error ? ` error=${run.error}` : ''}${run.compileError ? ` compileError=${run.compileError}` : ''}`);
if (showFrames) {
  const sceneFile = path.resolve('src/visualizations/scenes', `${id}.js`);
  const scene = fs.existsSync(sceneFile) ? (await import(pathToFileURL(sceneFile).href)).default : {};
  buildRunFrames(run, code, scene, q.harness ? [] : q.paramNames || [])
    .slice(0, Number(max))
    .forEach((f, i) => {
      if (f.predict) console.log(`    PREDICT: ${f.predict.question} [${f.predict.options.map((o, k) => (k === f.predict.answer ? `*${o}*` : o)).join(' | ')}]`);
      console.log(`#${i} ${f.note}`);
    });
} else {
  run.steps.slice(0, Number(max)).forEach((s, i) => {
    console.log(`#${i} line ${s.line}${s.op !== undefined ? ` op ${s.op}` : ''}${s.ret ? ` RETURN${s.value !== undefined ? ` ${JSON.stringify(s.value).slice(0, 60)}` : ''}` : ''}: ${(lines[s.line - 1] || '').trim().slice(0, 70)}`);
    console.log(`    ${JSON.stringify(s.vars).slice(0, 400)}`);
  });
}
if (run.steps.length > Number(max)) console.log(`… ${run.steps.length - Number(max)} more steps`);
