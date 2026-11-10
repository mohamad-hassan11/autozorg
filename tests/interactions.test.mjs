import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// A small event harness exercises progressive-enhancement logic only.
// It does not emulate layout, browser focus rules, or native <details> behavior.
function element(extra = {}) {
  const listeners = new Map();
  const classes = new Set();
  const attributes = new Map();
  return {
    hidden: true, dataset: {},
    classList: { add: (name) => classes.add(name), toggle: (name, active) => active ? classes.add(name) : classes.delete(name), contains: (name) => classes.has(name) },
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: (name) => attributes.get(name),
    addEventListener: (type, callback) => listeners.set(type, callback),
    fire: (type, event = {}) => listeners.get(type)?.(event),
    focus() { this.focused = true; },
    ...extra,
  };
}
function createPage({ theme = 'dark', blocked = false, hash = '' } = {}) {
  const root = { dataset: { theme }, style: {} };
  const themeButton = element({ dataset: { lightLabel: 'Use light', darkLabel: 'Use dark' } });
  const menu = element();
  const header = element({ contains: (target) => target === menu });
  const navigation = element();
  const languageLink = element({ href: 'https://garage.example/en/' });
  const meta = { content: '' };
  const document = element({ documentElement: root, querySelector: (selector) => ({ '[data-theme-toggle]': themeButton, '[data-menu-toggle]': menu, '.site-header': header, '#site-nav': navigation, '[data-language-link]': languageLink, 'meta[name="theme-color"]': meta })[selector] });
  const media = element();
  const window = element({ matchMedia: () => media });
  const saved = new Map();
  const localStorage = { setItem: (key, value) => { if (blocked) throw Error('Denied'); saved.set(key, value); } };
  const location = { hash };
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, { document, window, localStorage, location, URL, Set });
  return { root, themeButton, menu, header, navigation, languageLink, meta, document, window, media, saved, location };
}

test('theme toggle updates colour, accessible action and persisted preference', () => {
  const page = createPage();
  assert.equal(page.themeButton.hidden, false);
  assert.equal(page.themeButton.getAttribute('aria-label'), 'Use light');
  page.themeButton.fire('click');
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.root.style.colorScheme, 'light');
  assert.equal(page.meta.content, '#f8f6ef');
  assert.equal(page.themeButton.getAttribute('aria-label'), 'Use dark');
  assert.equal(page.saved.get('autozorg-theme'), 'light');
  page.themeButton.fire('click');
  assert.equal(page.root.dataset.theme, 'dark');
});

test('blocked storage does not break theme interaction', () => {
  const page = createPage({ blocked: true });
  assert.doesNotThrow(() => page.themeButton.fire('click'));
  assert.equal(page.root.dataset.theme, 'light');
});

test('cross-tab updates and cleared storage update current controls', () => {
  const page = createPage();
  page.window.fire('storage', { key: 'autozorg-theme', newValue: 'light' });
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.themeButton.getAttribute('aria-label'), 'Use dark');
  page.window.fire('storage', { key: null, newValue: null });
  assert.equal(page.root.dataset.theme, 'dark');
});

test('mobile menu opens and Escape closes it and restores button focus', () => {
  const page = createPage();
  assert.equal(page.menu.hidden, false);
  page.menu.fire('click');
  assert.equal(page.menu.getAttribute('aria-expanded'), 'true');
  assert.equal(page.header.classList.contains('is-menu-open'), true);
  page.document.fire('keydown', { key: 'Escape' });
  assert.equal(page.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(page.menu.focused, true);
});

test('menu closes after navigation, outside click and viewport transition', () => {
  const page = createPage();
  for (const close of [
    () => page.navigation.fire('click', { target: { closest: () => ({}) } }),
    () => page.document.fire('click', { target: {} }),
    () => page.media.fire('change'),
  ]) {
    page.menu.fire('click');
    close();
    assert.equal(page.menu.getAttribute('aria-expanded'), 'false');
  }
});

test('language switch preserves recognised section context, ignores unknown fragments', () => {
  const page = createPage({ hash: '#contact' });
  assert.equal(page.languageLink.href, 'https://garage.example/en/#contact');
  page.location.hash = '#unexpected';
  page.window.fire('hashchange');
  assert.equal(page.languageLink.href, 'https://garage.example/en/');
});
