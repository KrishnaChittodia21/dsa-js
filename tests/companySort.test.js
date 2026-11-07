// Companies page sort modes (src/lib/companySort.js) must each give a distinct order.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sortCompanies } from '../src/lib/companySort.js';

const S = (name, size, inCourse, solved) => ({
  company: { name },
  entries: Array(size).fill(0),
  inCourse: Array(inCourse).fill(0),
  solved,
  readiness: inCourse ? Math.round((solved / inCourse) * 100) : 0,
});
const names = (l) => l.map((s) => s.company.name);

test('with no progress, readiness, size and A–Z give three different orders', () => {
  const list = [S('Google', 40, 30, 0), S('Netflix', 20, 15, 0), S('Adobe', 35, 25, 0)];
  assert.deepEqual(names(sortCompanies(list, 'size')), ['Google', 'Adobe', 'Netflix']);
  assert.deepEqual(names(sortCompanies(list, 'readiness')), ['Netflix', 'Adobe', 'Google']);
  assert.deepEqual(names(sortCompanies(list, 'az')), ['Adobe', 'Google', 'Netflix']);
});

test('readiness puts the most-ready company first', () => {
  const list = [S('A', 40, 10, 9), S('B', 20, 10, 1)];
  assert.deepEqual(names(sortCompanies(list, 'readiness')), ['A', 'B']);
  assert.deepEqual(names(sortCompanies(list, 'size')), ['A', 'B']);
  assert.deepEqual(names(sortCompanies([S('B', 20, 10, 9), S('A', 40, 10, 1)], 'readiness')), ['B', 'A']);
});
