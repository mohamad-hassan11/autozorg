const root = document.documentElement;
const themeButton = document.querySelector('[data-theme-toggle]');
function applyTheme(theme) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#f8f6ef' : '#11110f';
  if (themeButton) {
    const label = theme === 'dark' ? themeButton.dataset.lightLabel : themeButton.dataset.darkLabel;
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
  }
}
if (themeButton) {
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('autozorg-theme', theme); } catch { /* The toggle still works when storage is unavailable. */ }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'autozorg-theme' || event.key === null) {
      applyTheme(event.newValue === 'light' ? 'light' : 'dark');
    }
  });
}

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('#site-nav');
if (header && menuButton && navigation) {
  header.classList.add('menu-ready');
  menuButton.hidden = false;
  const setMenu = (open) => {
    header.classList.toggle('is-menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', () => setMenu(false));
}

// Keep useful section context when switching languages; both pages share these IDs.
const languageLink = document.querySelector('[data-language-link]');
const sectionIds = new Set(['services', 'about', 'contact', 'maintenance', 'repairs', 'diagnostics', 'handling', 'comfort', 'body']);
function updateLanguageLink() {
  if (languageLink) {
    const url = new URL(languageLink.href);
    url.hash = sectionIds.has(location.hash.slice(1)) ? location.hash : '';
    languageLink.href = url.href;
  }
}
updateLanguageLink();
window.addEventListener('hashchange', updateLanguageLink);
