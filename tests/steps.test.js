// Step-lesson schema (src/content/stepSchema.js): real content passes, and each kind of mistake is caught.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSteps } from '../src/content/stepSchema.js';
import complexity from '../src/content/topics/complexity/steps.js';

test('the Big-O step lessons are valid', () => {
  for (const [sid, steps] of Object.entries(complexity)) assert.deepEqual(validateSteps(steps, sid), [], sid);
});

const watch = (frame) => [{ kind: 'watch', title: 't', lines: ['one line'], frames: [frame] }];
const turn = (task, panels = [{ kind: 'array', values: [1, 2, 3] }]) => [{ kind: 'turn', title: 't', lines: ['l'], panels, task, solved: 's' }];
const first = (steps) => validateSteps(steps)[0] || '';

test('frames: unknown panels, bad states, pointers off the array and missing lines are caught', () => {
  assert.match(first(watch({ note: 'n', panels: [{ kind: 'pie' }] })), /panel kind "pie"/);
  assert.match(first(watch({ note: 'n', panels: [{ kind: 'array', values: [1], highlights: { 0: 'glow' } }] })), /highlight "glow"/);
  assert.equal(first(watch({ note: 'n', panels: [{ kind: 'array', values: [1], highlights: { 0: '' } }] })), '');
  assert.match(first(watch({ note: 'n', panels: [{ kind: 'array', values: [1], pointers: [{ index: 3, label: 'i' }] }] })), /outside the array/);
  assert.match(first(watch({ say: 4, note: 'n', panels: [{ kind: 'vars', vars: {} }] })), /say 4 has no matching line/);
  assert.match(first(watch({ panels: [{ kind: 'vars', vars: {} }] })), /needs a note/);
});

test('tasks: answers must exist and wrong options must explain themselves', () => {
  assert.match(first(turn({ type: 'choose', question: 'q', options: [{ text: 'a' }, { text: 'b', why: 'x' }], answer: 5 })), /not an option/);
  assert.match(first(turn({ type: 'choose', question: 'q', options: [{ text: 'a' }, { text: 'b' }], answer: 1 })), /needs a "why"/);
  assert.match(first(turn({ type: 'number', question: 'q', options: [1, 2], answer: 3, hint: 'h' })), /include the answer/);
  assert.match(first(turn({ type: 'order', question: 'q', items: ['a', 'a'], hint: 'h' })), /distinct items/);
  assert.match(first(turn({ type: 'cell', question: 'q', answer: 9 })), /outside the array/);
  assert.match(first(turn({ type: 'cell', question: 'q', answer: 0 }, [{ kind: 'vars', vars: {} }])), /needs an array panel/);
  assert.equal(first(turn({ type: 'cell', question: 'q', answer: 2 })), '');
});
