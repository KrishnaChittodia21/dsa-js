// M11: page guides and coach tips — every guide target exists in the file that renders it; `?` picks the right guide;
// the tour lists its steps; a dismissed coach tip stays hidden.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PAGE_GUIDES, guideFor } from '../src/components/guide/pageGuides.js';
import { tipVisible } from '../src/lib/uiPrefs.js';

test('every page-guide item points at a data-guide target that exists in its file', () => {
  for (const g of PAGE_GUIDES)
    for (const it of g.items.filter((x) => x.target)) {
      const src = fs.readFileSync(it.file, 'utf8');
      assert.ok(src.includes(`data-guide="${it.target}"`), `${g.id}: data-guide="${it.target}" is missing in ${it.file}`);
    }
});

test('`?` opens the guide of the page you are on', () => {
  assert.equal(guideFor('/topic/hashing/q/two-sum').id, 'question');
  assert.equal(guideFor('/shorts').id, 'shorts');
  assert.equal(guideFor('/shorts/fixed-window').id, 'short');
  assert.equal(guideFor('/saved').id, 'saved');
  assert.equal(guideFor('/').id, 'dashboard');
  assert.equal(guideFor('/topic/hashing').id, 'topic');
  assert.equal(guideFor('/companies/google').id, 'company');
  assert.equal(guideFor('/companies').id, 'companies');
  assert.equal(guideFor('/no-such-page').id, 'not-found');
});

test('every page route in App.jsx has its own guide of 3–6 steps', () => {
  const app = fs.readFileSync('src/App.jsx', 'utf8');
  const paths = [...app.matchAll(/<Route (index|path="([^"]+)") element=\{<(\w+)/g)]
    .filter((m) => m[3] !== 'Navigate' && m[2] !== '*')
    .map((m) => '/' + (m[2] || '').replace(/:\w+/g, 'x'));
  assert.ok(paths.length >= 18, `found only ${paths.length} routes`);
  for (const p of paths) {
    const g = guideFor(p);
    assert.notEqual(g.id, 'not-found', `${p} has no guide`);
  }
  for (const g of PAGE_GUIDES) assert.ok(g.items.length >= 3 && g.items.length <= 6, `${g.id} has ${g.items.length} steps`);
});

test('the welcome tour has its "What\'s new" step', () => {
  const src = fs.readFileSync('src/components/guide/WelcomeTour.jsx', 'utf8');
  const titles = src.match(/const STEP_TITLES = \[(.*)\];/)[1];
  assert.match(titles, /What's new/);
  for (let i = 0; i < titles.split(',').length; i++) assert.ok(src.includes(`{step === ${i} && (`), `tour step ${i} has no body`);
});

test('"don\'t show again" is respected: a dismissed tip, or tips turned off, stays hidden', () => {
  const prefs = { showCoachTips: true, coachDismissed: {} };
  assert.equal(tipVisible(prefs, 'animate-divergence'), true);
  assert.equal(tipVisible({ ...prefs, coachDismissed: { 'animate-divergence': true } }, 'animate-divergence'), false);
  assert.equal(tipVisible({ ...prefs, showCoachTips: false }, 'animate-divergence'), false);
});
