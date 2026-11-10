import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { content } from '../src/content.js';
import { normalizeSiteUrl } from '../src/lib/site-url.js';

test('both languages cover identical services and stable navigation targets', () => {
  assert.deepEqual(content.nl.services.map((s) => s.id), content.en.services.map((s) => s.id));
  assert.deepEqual(content.nl.services.map((s) => s.items.length), content.en.services.map((s) => s.items.length));
  assert.equal(content.nl.services.flatMap((s) => s.items).length, 12);
});

test('production origin rejects unsafe or misleading canonical configuration', () => {
  assert.equal(normalizeSiteUrl(''), '');
  assert.equal(normalizeSiteUrl('https://autozorg.example/'), 'https://autozorg.example');
  for (const value of ['http://garage.example', 'https://garage.example/subpath', 'https://garage.example/?tracking=1', 'https://garage.example/#section', 'https://user:pass@garage.example']) {
    assert.throws(() => normalizeSiteUrl(value));
  }
});

function runBootstrap(saved, blocked = false) {
  const meta = { content: '' };
  const document = { documentElement: { dataset: {}, style: {} }, querySelector: () => meta };
  vm.runInNewContext(readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8'), {
    document,
    localStorage: { getItem: () => { if (blocked) throw new Error('Storage denied'); return saved; } },
  });
  return { root: document.documentElement, meta };
}

test('theme is available before hydration, with dark fallback for absent/invalid/blocked storage', () => {
  for (const saved of [null, undefined, '', 'system', 'DARK', 'blue']) {
    const { root, meta } = runBootstrap(saved);
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(root.style.colorScheme, 'dark');
    assert.equal(meta.content, '#11110f');
  }
  assert.equal(runBootstrap('light', true).root.dataset.theme, 'dark');
  assert.equal(runBootstrap('light').root.dataset.theme, 'light');
  assert.equal(runBootstrap('light').meta.content, '#f8f6ef');
});
