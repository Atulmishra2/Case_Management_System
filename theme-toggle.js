/* ============================================================
   CaseBook Theme Engine (theme-toggle.js)
   Manages the app theme: Azure (default), Mint, Classic Legal,
   Modern Corporate, Minimalist Judicial.

   - Each custom theme is a class on <html> (html.theme-classic etc.)
     defined in admin.css; Mint uses the admin-mint.css alternate sheet.
   - Choice persists in localStorage ("casebook-theme")
   - Exposes window.toggleAppTheme (legacy sidenav quick toggle)
     and window.setAppTheme(name) used by the Settings → Themes tab
     and the About page.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'casebook-theme';

  var THEMES = [
    { id: 'azure',   name: 'CaseBook Azure',           desc: 'Ambient blue — soft periwinkle, sky blue, deep navy (default)', icon: 'fa-circle-half-stroke',
      palette: ['#0B132B', '#1C2541', '#5BC0BE', '#6FFFE9', '#A0C4FF', '#E0E8F9'] },
    { id: 'mint',    name: 'CaseBook Mint',            desc: 'Emerald-mint family (the original 2026 restyle)',                icon: 'fa-leaf',
      palette: ['#064e3b', '#065f46', '#059669', '#10b981', '#6ee7b7', '#d1fae5'] },
    { id: 'classic', name: 'Classic Legal',            desc: 'Deep navy + muted gold — traditional law-chambers prestige',     icon: 'fa-scale-balanced',
      palette: ['#1B2A47', '#0F172A', '#C5A880', '#A8895F', '#F8FAFC', '#1E293B'] },
    { id: 'corporate', name: 'Modern Corporate',       desc: 'Dark charcoal + teal — calm SaaS dashboard feel',                icon: 'fa-building',
      palette: ['#202124', '#18181B', '#0D9488', '#0F766E', '#0EA5E9', '#F1F5F9'] },
    { id: 'judicial', name: 'Minimalist Judicial',     desc: 'Monochrome paper + judicial red accent',                         icon: 'fa-gavel',
      palette: ['#111827', '#000000', '#991B1B', '#FAFAFA', '#E5E7EB', '#6B7280'] }
  ];

  function getStoredTheme() {
    try {
      var t = localStorage.getItem(STORAGE_KEY);
      return THEMES.some(function (x) { return x.id === t; }) ? t : 'azure';
    } catch (e) { return 'azure'; }
  }

  function applyTheme(id) {
    var link = document.getElementById('mintThemeCss');
    if (link) { link.disabled = (id !== 'mint'); }
    var root = document.documentElement;
    THEMES.forEach(function (t) {
      if (t.id !== 'azure') root.classList.remove('theme-' + t.id);
    });
    if (id !== 'azure' && id !== 'mint') root.classList.add('theme-' + id);
    root.setAttribute('data-theme', id);
    // Sidenav quick-toggle label shows the "other" of Azure/Mint
    var labels = document.querySelectorAll('#themeToggleLabel');
    var next = (id === 'mint') ? 'Azure' : 'Mint';
    for (var i = 0; i < labels.length; i++) { labels[i].textContent = next; }
    // Mark selected card in Settings → Themes (if rendered)
    var cards = document.querySelectorAll('.theme-option-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].classList.toggle('selected', cards[j].getAttribute('data-theme-id') === id);
    }
  }

  window.setAppTheme = function (id, persist) {
    if (!THEMES.some(function (t) { return t.id === id; })) id = 'azure';
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
    }
    applyTheme(id);
  };

  /* Legacy quick toggle in sidenav: Azure <-> Mint only */
  window.toggleAppTheme = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var current = getStoredTheme();
    var next = (current === 'mint') ? 'azure' : 'mint';
    window.setAppTheme(next);
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  };

  /* Themes tab: build the theme picker cards with palette swatches */
  window.renderThemeSettings = function () {
    var wrap = document.getElementById('themeOptionsGrid');
    if (!wrap) return;
    var current = getStoredTheme();
    wrap.innerHTML = THEMES.map(function (t) {
      var swatches = t.palette.map(function (c) {
        return '<span class="theme-swatch" style="background:' + c + '" title="' + c + '"></span>';
      }).join('');
      return '<button type="button" class="theme-option-card' + (t.id === current ? ' selected' : '') +
        '" data-theme-id="' + t.id + '" onclick="setAppTheme(\'' + t.id + '\')">' +
        '<span class="theme-option-icon"><i class="fa-solid ' + t.icon + '"></i></span>' +
        '<span class="theme-option-body">' +
        '<strong>' + t.name + '</strong><em>' + t.desc + '</em>' +
        '<span class="theme-palette-row">' + swatches + '</span>' +
        '</span>' +
        '<span class="theme-option-check"><i class="fa-solid fa-circle-check"></i></span>' +
        '</button>';
    }).join('');
  };

  window.getThemeList = function () { return THEMES.slice(); };

  applyTheme(getStoredTheme());
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getStoredTheme());
    window.renderThemeSettings();
  });
})();
