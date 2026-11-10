(function () {
  var theme = 'dark';
  try {
    var saved = localStorage.getItem('autozorg-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (_) {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#f8f6ef' : '#11110f';
})();
