# Autozorg

Bilingual static garage website: Dutch `/`, English `/en/`. Astro renders HTML at build time from shared components and translation data; there is no application server or client framework.

## Local development

Use Node.js 22.23.4+ (or a supported newer release) and npm.

```sh
npm ci
npm run dev
```

Astro prints the local preview URL. `npm run build` generates `dist/`; `npm run preview` serves that output. `npm test` runs content and browser-script unit tests. `npm run check` also builds the site and verifies the static HTML, local assets and metadata with and without a production origin.

## Structure

- `src/content.js`: shared business details and Dutch/English copy.
- `src/pages/`: Dutch and English routes, 404 page, robots file and sitemap.
- `src/layouts/BaseLayout.astro`: shared document, styles and browser scripts.
- `src/components/`: readable page markup, header, footer, metadata and shared UI.
- `src/styles/`: Tailwind CSS entry and separate custom SCSS.
- `src/main.js`: theme, navigation and language-link enhancement.
- `public/`: local photos/fonts, early theme bootstrap, favicon and Cloudflare headers.
- `astro.config.js`: static output, production origin and Tailwind’s Vite plugin.

Tailwind processes its own plain CSS; Sass never processes Tailwind directives. Custom SCSS owns the visual system; utilities cover small layout primitives. Design values are shared through CSS custom properties.

## Content and branding

Edit the shared `business` object for contact details and both locale objects for translated text. Keep stable service IDs aligned. Opening hours, email, certifications, APK, prices, reviews and guarantees have deliberately not been invented.

The wordmark and favicon are placeholders. See `docs/assets.md` for photo/font sources and replacement instructions. Stock imagery is identified as illustrative on the page.

Dark is the initial theme. A saved explicit choice in `autozorg-theme` is applied before paint; blocked storage does not break the controls. The website does not set tracking cookies or use analytics, third-party font requests, or embedded maps. Directions open Google Maps only when selected.

## Cloudflare Pages handoff (later)

No deployment has been performed. When ready, configure a Cloudflare Pages project with:

- Framework preset: Astro.
- Build command: `npm run build`.
- Output directory: `dist`.
- Node version: a supported release meeting the requirement above.
- Environment variable: `SITE_URL` set to the real HTTPS origin, without a path (for example `https://your-domain.nl`).

Setting `SITE_URL` adds canonical URLs, language alternatives, a sitemap and the sitemap reference in `robots.txt`. No placeholder production domain is emitted when unset. Rebuild when the domain changes. Root-relative links assume deployment at the domain root.

Both locales build to real HTML files; no SPA fallback is required. `src/pages/404.astro` provides a bilingual error page. `_headers` supplies Cloudflare security headers and immutable caching for hashed assets. It is not applied by Vite's preview server.

Before publication, confirm the logo, address/phone, any opening hours to add, the final domain and stock image suitability. Perform desktop/mobile browser checks in both languages and themes, including keyboard navigation, reduced motion, no-JavaScript access, phone/maps links, and direct `/en/` visits. Automated checks do not substitute for visual or real-device acceptance.

Hosting references: [Cloudflare static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [page routing and 404 handling](https://developers.cloudflare.com/pages/configuration/serving-pages/), and [static response headers](https://developers.cloudflare.com/pages/configuration/headers/).
