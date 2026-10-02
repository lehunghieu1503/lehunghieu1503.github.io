// Theme switch: the reader picks auto, light, or dark. Auto follows the
// reader's local clock: light from 06:00 to 18:00, dark otherwise.
(function () {
  var KEY = 'theme';
  var DAY_START = 6;
  var DAY_END = 18;
  var root = document.documentElement;

  function savedMode() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'auto';
  }

  function isDay() {
    var hour = new Date().getHours();
    return hour >= DAY_START && hour < DAY_END;
  }

  function apply() {
    var mode = savedMode();
    var theme = mode === 'auto' ? (isDay() ? 'light' : 'dark') : mode;
    root.dataset.theme = theme;
    root.dataset.themeMode = mode;

    var buttons = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.themeSet === mode));
    }

    var note = document.querySelector('[data-theme-note]');
    if (note) {
      note.textContent = mode === 'auto'
        ? 'Theme: auto / ' + (isDay() ? 'light until 18:00' : 'dark until 06:00')
        : 'Theme: ' + mode;
    }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1322' : '#f5f8fc');
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-theme-set]');
    if (!button) return;
    var mode = button.dataset.themeSet;
    try {
      if (mode === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) {}
    apply();
  });

  // Keep auto in step with the clock, and with a choice made in another tab.
  setInterval(apply, 60000);
  document.addEventListener('visibilitychange', apply);
  window.addEventListener('storage', apply);

  apply();
})();
