// M6: typed signatures → Java / C++ starters (src/languages/signature.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsSignature, starterFor, signatureProblems, cppType, javaType } from '../src/languages/signature.js';

const fn = {
  id: 'two-sum',
  functionName: 'twoSum',
  starterCode: 'function twoSum(nums, target = 0) {\n  \n}\n',
  paramTypes: ['int[]', 'int'],
  returnType: 'int[]',
};
const cls = {
  id: 'lru-cache',
  kind: 'design',
  className: 'LRUCache',
  starterCode: 'class LRUCache {\n  constructor(capacity) {\n    if (capacity) {}\n  }\n  get(key) {\n  }\n  put(key, value) {\n  }\n}\n',
  methodTypes: { constructor: { params: ['int'] }, get: { params: ['int'], returns: 'int' }, put: { params: ['int', 'int'], returns: 'void' } },
};

test('the JS starter gives the names: functions, and class methods (not the ifs inside them)', () => {
  assert.deepEqual(parseJsSignature(fn.starterCode, 'twoSum'), { name: 'twoSum', params: ['nums', 'target'] });
  assert.deepEqual(
    parseJsSignature(cls.starterCode, 'LRUCache').methods.map((m) => `${m.name}(${m.params})`),
    ['constructor(capacity)', 'get(key)', 'put(key,value)'],
  );
});

test('types map to Java and C++ (vectors by reference, nodes as pointers)', () => {
  assert.equal(javaType('string[][]'), 'String[][]');
  assert.equal(cppType('long[]'), 'vector<long long>');
  assert.match(starterFor('java', fn), /public int\[\] twoSum\(int\[\] nums, int target\)/);
  assert.match(starterFor('cpp', fn), /vector<int> twoSum\(vector<int>& nums, int target\)/);
  assert.match(starterFor('java', cls), /public LRUCache\(int capacity\)[\s\S]*public void put\(int key, int value\)/);
  assert.match(starterFor('cpp', { ...fn, paramTypes: ['TreeNode', 'int'] }), /\/\/ Provided:\n\/\/ struct TreeNode[\s\S]*twoSum\(TreeNode\* nums/);
  assert.equal(starterFor('js', fn), null);
});

test('signature problems: missing, miscounted and unknown types are reported', () => {
  assert.deepEqual(signatureProblems(fn), []);
  assert.deepEqual(signatureProblems(cls), []);
  assert.match(signatureProblems({ ...fn, paramTypes: ['int[]'] }).join(), /2 params in the starter, 1 types/);
  assert.match(signatureProblems({ ...fn, returnType: 'float' }).join(), /unknown return type float/);
  assert.match(signatureProblems({ ...cls, methodTypes: { get: cls.methodTypes.get } }).join(), /no constructor/);
});
