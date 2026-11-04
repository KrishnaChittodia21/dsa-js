// The code runner: result comparison and running a solution against tests (src/runner/core.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareResult, runTests } from '../src/runner/core.js';

test('compareResult: exact mode needs the same values in the same order', () => {
  assert.equal(compareResult(undefined, [1, 2, 3], [1, 2, 3]), true);
  assert.equal(compareResult(undefined, [1, 2, 3], [3, 2, 1]), false);
  assert.equal(compareResult(undefined, { a: [1] }, { a: [1] }), true);
  assert.equal(compareResult(undefined, 1, '1'), false);
});

test('compareResult: unordered and nested-unordered ignore order', () => {
  assert.equal(compareResult('unordered', [3, 1, 2], [1, 2, 3]), true);
  assert.equal(compareResult('unordered', [1, 1, 2], [1, 2, 2]), false);
  assert.equal(compareResult('nested-unordered', [[2, 1], [3]], [[3], [1, 2]]), true);
  assert.equal(compareResult('nested-unordered', [[2, 1]], [[1, 3]]), false);
  assert.equal(compareResult('unordered', 'abc', ['a', 'b', 'c']), false);
});

test('compareResult: float mode allows rounding error but not a wrong answer', () => {
  assert.equal(compareResult('float', 0.1 + 0.2, 0.3), true);
  assert.equal(compareResult('float', [0.1 + 0.2, 1], [0.3, 1]), true);
  assert.equal(compareResult('float', 0.31, 0.3), false);
});

const add = { functionName: 'add' };
const tests = [
  { args: [1, 2], expected: 3 },
  { args: [-1, 1], expected: 0 },
];

test('runTests: a correct solution passes every test', () => {
  const { results, compileError } = runTests('function add(a, b) { return a + b; }', add, tests);
  assert.equal(compileError, undefined);
  assert.deepEqual(results.map((r) => r.passed), [true, true]);
});

test('runTests: a wrong solution fails, and console output is captured', () => {
  const { results } = runTests('function add(a, b) { console.log("hi", a); return a - b; }', add, tests);
  assert.deepEqual(results.map((r) => r.passed), [false, false]);
  assert.deepEqual(results[0].logs, ['hi 1']);
});

test('runTests: a renamed function and a syntax error are compile errors', () => {
  assert.match(runTests('function plus(a, b) { return a + b; }', add, tests).compileError, /Could not find function "add"/);
  assert.match(runTests('function add(a, b) { return a + ; }', add, tests).compileError, /SyntaxError/);
});

test('runTests: a thrown error and infinite recursion fail that test with a message', () => {
  const thrown = runTests('function add() { throw new Error("boom"); }', add, tests).results[0];
  assert.equal(thrown.passed, false);
  assert.equal(thrown.error, 'Error: boom');
  const deep = runTests('function add(a, b) { return add(a, b); }', add, tests).results[0];
  assert.match(deep.error, /infinite recursion/);
});

test('runTests: design questions run an operation list on a class', () => {
  const q = { kind: 'design', className: 'Counter' };
  const code = 'class Counter { constructor(s) { this.n = s; } inc() { this.n++; } get() { return this.n; } }';
  const [r] = runTests(code, q, [{ ops: ['Counter', 'inc', 'get'], args: [[5], [], []], expected: [null, null, 6] }]).results;
  assert.equal(r.passed, true);
});
