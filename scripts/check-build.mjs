import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const dist = resolve('dist');
for (const [file, language] of [['index.html', 'nl'], ['en/index.html', 'en'], ['404.html', 'nl']]) {
  const html = await readFile(join(dist, file), 'utf8');
  assert.ok(/^<!doctype html>/i.test(html), `${file}: HTML doctype missing`);
  assert.ok(html.includes(`lang="${language}"`), `${file}: wrong document language`);
  assert.ok(!html.includes('<!-- page-'), `${file}: unrendered template`);
  assert.ok(!/<script(?![^>]*type="application\/ld\+json")(?![^>]*src=)[^>]*>[^<\s]/.test(html), `${file}: executable inline script conflicts with CSP`);
  assert.ok(!html.includes('/src/'), `${file}: unresolved source reference`);
  assert.ok(html.includes('tel:+31638075898'), `${file}: missing phone link`);
  for (const [, url] of html.matchAll(/(?:src|href)="(\/(?!\/)[^"#]*)"/g)) {
    const target = url.endsWith('/') ? `${url}index.html` : url;
    await access(join(dist, target));
  }
}
for (const file of ['theme-init.js', '_headers', 'robots.txt', 'fonts/manrope-variable.ttf', 'fonts/OFL.txt']) await access(join(dist, file));
const assets = await readdir(join(dist, 'assets'));
assert.ok(assets.some((file) => file.endsWith('.css')), 'CSS bundle missing');
assert.ok(assets.some((file) => file.endsWith('.js')), 'JS bundle missing');
const css = (await Promise.all(assets.filter((file) => file.endsWith('.css')).map((file) => readFile(join(dist, 'assets', file), 'utf8')))).join('');
assert.ok(css.includes('.flex{'), 'Tailwind utilities not compiled');
assert.ok(css.includes('.hero'), 'Custom SCSS not compiled');
assert.ok(css.includes('prefers-reduced-motion'), 'Reduced-motion handling missing');
console.log('Static output verified: Dutch, English, 404, contacts, local assets, CSS and JS.');
