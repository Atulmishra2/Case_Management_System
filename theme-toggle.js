/* ============================================================
   CaseBook Theme Switcher (theme-toggle.js)
   Toggles between CASEBOOK AZURE (default ambient-blue theme in
   admin.css) and CASEBOOK MINT (emerald theme via admin-mint.css,
   loaded as a disabled alternate stylesheet).

   - Persists the choice in localStorage ("casebook-theme")
   - Applied before first paint via the early inline restore below
     (kept in this file; admin.js loads deferred so the toggle must
     be self-contained and global)
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'casebook-theme';

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY) || 'azure'; }
    catch (e) { return 'azure'; }
  }

  function applyTheme(theme) {
    var link = document.getElementById('mintThemeCss');
    var labels = document.querySelectorAll('#themeToggleLabel');
    if (link) { link.disabled = (theme !== 'mint'); }
    document.documentElement.setAttribute('data-theme', theme);
    // Label shows the theme you would switch TO
    var next = (theme === 'mint') ? 'Azure' : 'Mint';
    for (var i = 0; i < labels.length; i++) { labels[i].textContent = next; }
  }

  /* Global — wired to onclick in the sidenav; closes the mobile drawer */
  window.toggleAppTheme = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var current = (document.documentElement.getAttribute('data-theme') === 'mint') ? 'mint' : 'azure';
    var next = (current === 'mint') ? 'azure' : 'mint';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    applyTheme(next);
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  };

  /* Restore saved theme ASAP (script is deferred, runs before
     admin.js but after DOM parse — no flash of wrong theme in
     practice because mint css starts disabled) */
  applyTheme(getStoredTheme());

  /* Also re-assert after admin.js re-renders headers */
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getStoredTheme());
  });
})();
