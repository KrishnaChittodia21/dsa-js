// M7: the browser Java / C++ runner's pure logic (src/runner/native/results.js); the workers are checked in a browser
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCompiled, compileErrorText, userLine, crashText } from '../src/runner/native/results.js';
import { splitDriverOutput } from '../src/languages/harness.js';

const q = { id: 'demo', functionName: 'f', paramTypes: ['int'], returnType: 'int' };
const tests = [1, 2, 3].map((x) => ({ scenario: `t${x}`, args: [x], expected: x * 10 }));
const line = (out, ms = 1) => `\n\x01${JSON.stringify({ ms, out })}\n`;

test('driver output: marked lines are results, other lines are the learner\'s prints', () => {
  const { records, rest } = splitDriverOutput(`hi\n${line(10)}partial`);
  assert.deepEqual(records, [{ line: '{"ms":1,"out":10}', logs: ['hi'] }]);
  assert.deepEqual(rest, ['partial']);
});

test('a crash fails that test only; the program restarts at the next one', async () => {
  const calls = [];
  const exec = async (input) => {
    calls.push(input.split(' ')[0]); // number of tests in this run
    return calls.length === 1 ? { stdout: `${line(10)}debug\n`, crash: 'RuntimeError: memory access out of bounds' } : { stdout: line(30) };
  };
  const res = await runCompiled({ lang: 'cpp', question: q, tests, exec });
  assert.deepEqual(calls, ['3', '1']);
  assert.deepEqual(res.results.map((r) => [r.index, r.passed]), [[0, true], [1, false], [2, true]]);
  assert.match(res.results[1].error, /memory access out of bounds/);
  assert.deepEqual(res.results[1].logs, ['debug']);
});

test('the time limit marks the running test and skips the rest', async () => {
  const exec = async () => ({ stdout: line(10), timedOut: true });
  const res = await runCompiled({ lang: 'java', question: q, tests, exec, timeoutMs: 50 });
  assert.equal(res.timeout, true);
  assert.deepEqual(res.results.map((r) => [r.passed, !!r.timedOut, !!r.skipped]), [[true, false, false], [false, true, false], [false, false, true]]);
});

test('compile errors point at the learner\'s lines; TeaVM gaps get a hint', () => {
  const code = 'class Solution {\n  int f(int x) { return y; }\n}';
  const src = `head1\nhead2\n${code}\ntail`;
  assert.equal(userLine(src, code, 4), 2);
  assert.equal(userLine(src, code, 1), null);
  const java = compileErrorText('java', src, code, [{ lineNumber: 4, message: 'cannot find symbol\n  symbol:   class Entry\n  location: interface java.util.Map' }]);
  assert.match(java, /^Line 2: cannot find symbol/);
  assert.match(java, /Hint: .*var e : map\.entrySet/);
  const cpp = compileErrorText('cpp', src, code, "main.cpp:4:24: error: use of undeclared identifier 'y'\n1 error generated.");
  assert.equal(cpp, "Line 2:24: use of undeclared identifier 'y'");
  assert.match(crashText('java', 'RangeError: Maximum call stack size exceeded'), /StackOverflowError/);
});
