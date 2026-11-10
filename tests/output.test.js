import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'astro';
import { business, content } from '../src/content.js';
// Match the production build's .env mode when checking optional metadata.
process.env.NODE_ENV = 'production';
const { default: config } = await import('../astro.config.js');

const outputDir = new URL('../dist/', import.meta.url);
const temporary = await mkdtemp(join(process.cwd(), '.astro/production-'));
const productionDir = pathToFileURL(`${temporary}/`);
after(() => rm(temporary, { recursive: true, force: true }));
await build({ site: 'https://garage.example', outDir: temporary, logLevel: 'silent' });

for (const language of ['nl', 'en']) {
  test(`${language}: complete static content and verified contact details`, () => {
    const html = readFileSync(new URL(language === 'nl' ? 'index.html' : 'en/index.html', outputDir), 'utf8');
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.ok(html.includes(business.street));
    assert.ok(html.includes(business.postalCode));
    assert.ok(html.includes(`href="tel:${business.phone}"`));
    assert.ok(html.includes(business.mapsUrl.replaceAll('&', '&amp;')));
    assert.equal((html.match(/<details\b/g) ?? []).length, 6);
    for (const service of content[language].services) {
      for (const item of service.items) assert.ok(html.includes(item.replaceAll('&', '&amp;')), `Missing service: ${item}`);
    }
    assert.equal((html.match(/data-language-link/g) ?? []).length, 1, 'Only the alternate language is enhanced');
    assert.ok(html.includes('href="/en/"'));
    assert.ok(html.includes('href="/"'));
    assert.ok(!html.includes('<form'));
    assert.ok(!html.includes('<iframe'));
    assert.ok(!/\bAPK\b|openingHours|aggregateRating/.test(html));
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'No duplicate element IDs');
    for (const anchor of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor[1]), `Missing anchor: ${anchor[1]}`);
  });

  test(`${language}: truthful structured data and optional production metadata`, () => {
    const meta = readFileSync(new URL(language === 'nl' ? 'index.html' : 'en/index.html', outputDir), 'utf8');
    const schema = JSON.parse(meta.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
    assert.equal(schema['@type'], 'AutoRepair');
    assert.equal(schema.telephone, business.phone);
    assert.equal(schema.address.streetAddress, business.street);
    assert.equal(schema.address.addressCountry, 'NL');
    assert.ok(!('openingHours' in schema));
    assert.ok(!('aggregateRating' in schema));
    if (config.site) {
      assert.ok(meta.includes(`rel="canonical" href="${new URL(language === 'en' ? '/en/' : '/', config.site).href}"`));
    } else {
      assert.ok(!meta.includes('rel="canonical"'));
    }
    const production = readFileSync(new URL(language === 'nl' ? 'index.html' : 'en/index.html', productionDir), 'utf8');
    assert.ok(production.includes(`rel="canonical" href="https://garage.example${language === 'en' ? '/en/' : '/'}"`));
    assert.ok(production.includes('hreflang="nl"'));
    assert.ok(production.includes('hreflang="en"'));
    assert.ok(production.includes('hreflang="x-default"'));
  });
}


test('crawl files use the configured production origin', () => {
  const expectedRobots = `User-agent: *\nAllow: /\n${config.site ? `Sitemap: ${new URL('sitemap.xml', config.site).href}\n` : ''}`;
  assert.equal(readFileSync(new URL('robots.txt', outputDir), 'utf8'), expectedRobots);
  assert.equal(existsSync(new URL('sitemap.xml', outputDir)), Boolean(config.site));
  const robots = readFileSync(new URL('robots.txt', productionDir), 'utf8');
  assert.ok(robots.includes('Sitemap: https://garage.example/sitemap.xml'));
  const sitemap = readFileSync(new URL('sitemap.xml', productionDir), 'utf8');
  assert.ok(sitemap.includes('<loc>https://garage.example/</loc>'));
  assert.ok(sitemap.includes('<loc>https://garage.example/en/</loc>'));
});
