// M6: check the Java / C++ reference solutions against every JSON test of their question.
//   node scripts/check-refs.mjs [--lang java|cpp] [--show] [question-id …]      (no ids: every reference file)
// References live next to the questions: src/content/topics/<topic>/solutions/<id>.java and <id>.cpp
// (just the class a learner would write: no imports or includes, ListNode / TreeNode are provided).
// Java needs a JDK: javac / java on PATH, or DSA_JDK=<jdk home>. C++ uses clang++ (or CXX).
// Each reference is compiled with a generated driver (src/languages/harness.js); every test's output is judged by
// checkPass, exactly like the JS runner. Exit code 1 when a reference fails or does not compile.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkPass, format } from '../src/runner/core.js';
import { encodeTests, programFor, driverSupports, splitDriverOutput } from '../src/languages/harness.js';
import { starterFor } from '../src/languages/signature.js';

const EXT = { java: 'java', cpp: 'cpp' };
const JDK = process.env.DSA_JDK ? path.join(process.env.DSA_JDK, 'bin') : '';
const tool = (n) => (JDK ? path.join(JDK, n) : n);
const CXX = process.env.CXX || 'clang++';
const BUILD = path.join(os.tmpdir(), 'dsa-refs');

function sh(cmd, args, { input, cwd, timeout = 120000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd });
    let out = '';
    let err = '';
    const timer = setTimeout(() => p.kill('SIGKILL'), timeout);
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => (err += e.message));
    p.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, out, err });
    });
    p.stdin.on('error', () => {}); // EPIPE: the program exited before reading all its input; its own result tells why
    if (input !== undefined) p.stdin.end(input);
  });
}

async function questions() {
  const root = path.resolve('src/content/topics');
  const out = [];
  for (const t of fs.readdirSync(root)) {
    const dir = path.join(root, t, 'questions');
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const q = (await import(pathToFileURL(path.join(dir, f)).href)).default;
      out.push({ q, solDir: path.join(root, t, 'solutions') });
    }
  }
  return out;
}

/** compile + run one reference; { ok, passed, total, fails: [...], error } */
export async function checkRef(q, lang, code) {
  const dir = path.join(BUILD, lang, q.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const tests = q.tests || [];
  let input;
  try {
    input = encodeTests(q, tests);
  } catch (e) {
    return { ok: false, error: `encoding the tests: ${e.message}` };
  }
  const src = programFor(lang, q, code);
  let run;
  if (lang === 'java') {
    fs.writeFileSync(path.join(dir, 'Main.java'), src);
    const c = await sh(tool('javac'), ['-nowarn', '-encoding', 'UTF-8', 'Main.java'], { cwd: dir });
    if (c.code !== 0) return { ok: false, error: `does not compile:\n${c.err.slice(0, 1500)}` };
    run = await sh(tool('java'), ['-Xmx2g', '-cp', '.', 'Main'], { cwd: dir, input });
  } else {
    fs.writeFileSync(path.join(dir, 'main.cpp'), src);
    const c = await sh(CXX, ['-std=c++17', '-O2', '-w', '-o', 'main', 'main.cpp'], { cwd: dir });
    if (c.code !== 0) return { ok: false, error: `does not compile:\n${c.err.slice(0, 1500)}` };
    run = await sh('./main', [], { cwd: dir, input });
  }
  const lines = splitDriverOutput(run.out).records.map((r) => r.line);
  if (lines.length < tests.length) return { ok: false, error: `stopped after ${lines.length} of ${tests.length} tests (${run.signal || `exit ${run.code}`}) ${run.err.slice(0, 600)}` };
  const fails = [];
  let passed = 0;
  let slowest = 0;
  lines.slice(0, tests.length).forEach((line, i) => {
    const t = tests[i];
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      fails.push({ scenario: t.scenario, why: `unreadable output ${line.slice(0, 200)}` });
      return;
    }
    slowest = Math.max(slowest, r.ms);
    if (r.out && typeof r.out === 'object' && !Array.isArray(r.out) && '__error' in r.out) {
      fails.push({ scenario: t.scenario, why: `threw ${r.out.__error}` });
      return;
    }
    let ok = false;
    try {
      ok = checkPass(q, t, r.out);
    } catch (e) {
      fails.push({ scenario: t.scenario, why: `checker threw ${e.message}` });
      return;
    }
    if (ok) passed++;
    else fails.push({ scenario: t.scenario, why: `got ${format(r.out).slice(0, 200)}` });
  });
  return { ok: !fails.length, passed, total: tests.length, fails, slowest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  if (argv[0] === '--starter') {
    // node scripts/check-refs.mjs --starter java two-sum: the exact signature a reference must keep
    const hit = (await questions()).find(({ q }) => q.id === argv[2]);
    console.log(hit ? starterFor(argv[1], hit.q) ?? '(no starter: untyped or quiz)' : `no question ${argv[2]}`);
    process.exit(hit ? 0 : 1);
  }
  const li = argv.indexOf('--lang');
  const langs = li >= 0 ? [argv.splice(li, 2)[1]] : ['java', 'cpp'];
  const show = argv.includes('--show') ? (argv.splice(argv.indexOf('--show'), 1), true) : false;
  const only = argv;
  const all = await questions();
  const jobs = [];
  for (const { q, solDir } of all) {
    if (only.length && !only.includes(q.id)) continue;
    for (const lang of langs) {
      const file = path.join(solDir, `${q.id}.${EXT[lang]}`);
      if (!fs.existsSync(file)) {
        if (only.length) jobs.push({ q, lang, missing: true });
        continue;
      }
      jobs.push({ q, lang, file });
    }
  }
  let bad = 0;
  let good = 0;
  const queue = [...jobs];
  const worker = async () => {
    for (let j = queue.shift(); j; j = queue.shift()) {
      const tag = `${j.q.id} [${j.lang}]`;
      if (j.missing) {
        console.log(`✖ ${tag}: no reference file`);
        bad++;
        continue;
      }
      if (!driverSupports(j.q)) {
        console.log(`· ${tag}: custom harness, not checked automatically yet`);
        continue;
      }
      const r = await checkRef(j.q, j.lang, fs.readFileSync(j.file, 'utf8'));
      if (r.ok) {
        good++;
        console.log(`✔ ${tag}: ${r.passed}/${r.total} tests, slowest ${r.slowest.toFixed(1)} ms`);
      } else {
        bad++;
        console.log(`✖ ${tag}: ${r.error || `${r.passed}/${r.total} tests`}`);
        for (const f of (r.fails || []).slice(0, show ? 50 : 3)) console.log(`    ${f.scenario}: ${f.why}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, os.cpus().length) }, worker));
  console.log(`${bad ? '✖' : '✔'} ${good} of ${good + bad} references pass every test`);
  process.exit(bad ? 1 : 0);
}
