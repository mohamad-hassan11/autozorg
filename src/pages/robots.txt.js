export function GET({ site }) {
  return new Response(`User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL('sitemap.xml', site).href}\n` : ''}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
