export function normalizeSiteUrl(value = '') {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('SITE_URL must be an HTTPS origin, for example https://your-domain.nl');
  }
  return url.origin;
}
