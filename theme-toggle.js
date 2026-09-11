/* ============================================================
   CaseBook Theme Engine (theme-toggle.js)
   Manages the app theme: Azure (default), Mint, Classic Legal,
   Modern Corporate, Minimalist Judicial, plus USER-MADE THEMES
   created in the Theme Maker (Themes tab).

   - Built-in custom themes are classes on <html> defined in admin.css.
   - Mint uses the admin-mint.css alternate sheet.
   - User themes are stored in localStorage ("casebook-custom-themes")
     and applied by injecting a <style id="customThemeStyle"> with
     html.theme-custom-<id> rules generated from 5 chosen colors.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'casebook-theme';
  var CUSTOM_KEY = 'casebook-custom-themes';

  var THEMES = [
    { id: 'azure',     name: 'CaseBook Azure',       desc: 'Ambient blue — soft periwinkle, sky blue, deep navy (default)', icon: 'fa-circle-half-stroke',
      palette: ['#0B132B', '#1C2541', '#5BC0BE', '#0284C7', '#A0C4FF', '#E0E8F9'] },
    { id: 'executive', name: 'Chambers Executive',    desc: 'Oxford navy + warm brass & gold — high-court prestige',          icon: 'fa-scale-balanced',
      palette: ['#0F172A', '#1E293B', '#D97706', '#B45309', '#F8FAFC', '#E2E8F0'] },
    { id: 'midnight',  name: 'Judicial Midnight',     desc: 'OLED dark mode — midnight canvas, cyan highlights, high contrast', icon: 'fa-moon',
      palette: ['#0A0E17', '#141B2D', '#38BDF8', '#60A5FA', '#1F293D', '#F8FAFC'] },
    { id: 'forest',    name: 'Cambridge Forest',      desc: 'British racing green + warm linen & amber — scholarly & calm',  icon: 'fa-feather-pointed',
      palette: ['#064E3B', '#04392B', '#059669', '#D97706', '#F9F9F6', '#E7E5E4'] },
    { id: 'mint',      name: 'CaseBook Mint',         desc: 'Emerald-mint family (the classic fresh restyle)',               icon: 'fa-leaf',
      palette: ['#064e3b', '#065f46', '#059669', '#10b981', '#6ee7b7', '#d1fae5'] },
    { id: 'corporate', name: 'Modern Corporate',      desc: 'Dark charcoal + teal — calm enterprise dashboard feel',        icon: 'fa-building',
      palette: ['#202124', '#18181B', '#0D9488', '#0F766E', '#0EA5E9', '#F1F5F9'] },
    { id: 'classic',   name: 'Classic Chambers',      desc: 'Traditional navy + muted gold chambers styling',                icon: 'fa-landmark',
      palette: ['#1B2A47', '#0F172A', '#C5A880', '#A8895F', '#F8FAFC', '#1E293B'] }
  ];

  /* ---------- user-made themes ---------- */
  function getCustomThemes() {
    try {
      var raw = localStorage.getItem(CUSTOM_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function saveCustomThemes(list) {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function findTheme(id) {
    var t = null;
    THEMES.forEach(function (x) { if (x.id === id) t = x; });
    if (!t) getCustomThemes().forEach(function (x) { if (x.id === id) t = x; });
    return t || { id: 'azure', name: 'CaseBook Azure', icon: 'fa-circle-half-stroke', palette: [] };
  }

  /* Generate CSS for a user theme. Colors:
     nav (chrome bg), accent (buttons), textOnDark, bg, surface,
     + optional user-picked: hover, active, navAccent (gradient end) */
  function customThemeCss(t) {
    var sel = 'html.theme-custom-' + t.id;
    var L = function (hex, amt) {
      // lighten/darken hex by amt (-255..255)
      var n = parseInt(hex.replace('#', ''), 16);
      var r = Math.min(255, Math.max(0, (n >> 16) + amt));
      var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
      var b = Math.min(255, Math.max(0, (n & 255) + amt));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    var c = t.colors;
    var nav = c.nav, accent = c.accent, onDark = c.textOnDark,
        bg = c.bg, surface = c.surface;
    // user picks with auto-derive fallbacks
    var hover = c.hover || L(accent, 22);
    var active = c.active || L(accent, -22);
    var navAccent = c.navAccent || L(nav, -26);
    var hoverOn = c.hoverText || onDark;
    return sel + ' body { background: ' + bg + ' !important; }' +
      // --- NAV GRADIENTS: nav → navAccent (user picks the gradient end) ---
      sel + ' .materialize-nav, ' + sel + ' .top-header, ' + sel + ' .guest-header-bar {' +
      '  background: linear-gradient(135deg, ' + nav + ' 0%, ' + navAccent + ' 100%) !important;' +
      '  color: ' + onDark + ' !important; }' +
      sel + ' .materialize-nav:hover { background: linear-gradient(135deg, ' + L(nav, 10) + ' 0%, ' + L(navAccent, 10) + ' 100%) !important; }' +
      sel + ' .sidebar, ' + sel + ' .sidenav {' +
      '  background: linear-gradient(180deg, ' + nav + ' 0%, ' + navAccent + ' 100%) !important; }' +
      sel + ' .fixed-bottom-nav { background: linear-gradient(135deg, ' + nav + ', ' + navAccent + ') !important; }' +
      // --- SIDENAV LINKS: hover + active user-controlled ---
      sel + ' .sidenav a { color: ' + onDark + ' !important; }' +
      sel + ' .sidenav a:hover { background: ' + hover + ' !important; color: ' + hoverOn + ' !important; }' +
      sel + ' .sidenav a.active { background: ' + active + ' !important; color: ' + hoverOn + ' !important;' +
      '  box-shadow: inset 3.5px 0 0 ' + accent + ' !important; }' +
      sel + ' .subheader { color: ' + accent + ' !important; }' +
      // --- SURFACES ---
      sel + ' .case-card, ' + sel + ' .home-today-card, ' + sel + ' .court-directory-card, ' + sel +
      ' .card, ' + sel + ' .panel, ' + sel + ' .form-container, ' + sel + ' .theme-option-card, ' + sel + ' .about-card {' +
      '  background: ' + surface + ' !important; }' +
      sel + ' .case-card:hover, ' + sel + ' .court-directory-card:hover { background: ' + L(surface, -6) + ' !important; }' +
      sel + ' .content, ' + sel + ' .case-card-name, ' + sel + ' .court-card-name { color: ' + L(bg, -110) + ' !important; }' +
      sel + ' th, ' + sel + ' thead th { background: ' + L(bg, 12) + ' !important; color: ' + L(bg, -110) + ' !important; }' +
      sel + ' tr:hover td { background: ' + L(surface, -8) + ' !important; }' +
      sel + ' .form-container, ' + sel + ' .case-card, ' + sel + ' .theme-option-card { border-color: ' + L(bg, -18) + ' !important; }' +
      // --- BUTTONS: accent → active gradient base, hover swaps in hover color ---
      sel + ' button, ' + sel + ' .btn, ' + sel + ' .primary-btn, ' + sel + ' .secondary-btn, ' + sel +
      ' .action-btn, ' + sel + ' .dossier-action-btn, ' + sel + ' .mini-court-btn, ' + sel +
      ' .panel-action-btn, ' + sel + ' .type-pill-btn, ' + sel + ' .todo-filter-btn, ' + sel +
      ' .case-cards-pill, ' + sel + ' .stage-pill, ' + sel + ' .court-btn-edit, ' + sel + ' .detail-action-btn {' +
      '  background: linear-gradient(135deg, ' + accent + ', ' + active + ') !important;' +
      '  color: ' + onDark + ' !important; border: 1px solid ' + active + ' !important; }' +
      sel + ' button:hover, ' + sel + ' .btn:hover, ' + sel + ' .primary-btn:hover, ' + sel +
      ' .secondary-btn:hover, ' + sel + ' .action-btn:hover, ' + sel + ' .dossier-action-btn:hover, ' + sel +
      ' .mini-court-btn:hover, ' + sel + ' .panel-action-btn:hover, ' + sel + ' .todo-filter-btn:hover, ' + sel +
      ' .case-cards-pill:hover, ' + sel + ' .stage-pill:hover, ' + sel + ' .court-btn-edit:hover, ' + sel + ' .detail-action-btn:hover {' +
      '  background: linear-gradient(135deg, ' + hover + ', ' + accent + ') !important;' +
      '  color: ' + hoverOn + ' !important; border-color: ' + hover + ' !important; }' +
      // Active/selected pills use the picked ACTIVE color solid
      sel + ' .type-pill-btn.active, ' + sel + ' .todo-filter-btn.active, ' + sel +
      ' .case-cards-pill.active, ' + sel + ' .stage-pill-specific.active, ' + sel +
      ' .bottom-nav-btn.active, ' + sel + ' .nav-link.active {' +
      '  background: ' + active + ' !important; color: ' + hoverOn + ' !important; }' +
      // Accent strips: accent → hover gradient
      sel + ' .case-card::before, ' + sel + ' .court-directory-card::before {' +
      '  background: linear-gradient(180deg, ' + accent + ', ' + hover + ') !important; }' +
      // Inputs focus ring uses accent
      sel + ' input:focus, ' + sel + ' select:focus, ' + sel + ' textarea:focus {' +
      '  border-color: ' + accent + ' !important; box-shadow: 0 0 0 3px ' + hexToRgba(accent, 0.25) + ' !important; outline: none !important; }' +
      // Nav search toggle: hover = picked hover color bg
      sel + ' .nav-case-search-toggle:hover, ' + sel + ' .nav-case-search-toggle:active {' +
      '  background: ' + hover + ' !important; color: ' + hoverOn + ' !important; }' +
      // Sidenav theme toggle
      sel + ' #themeToggleBtn { background: linear-gradient(135deg, ' + accent + ', ' + active + ') !important;' +
      '  color: ' + onDark + ' !important; border-color: ' + hover + ' !important; }' +
      sel + ' #themeToggleBtn:hover { background: linear-gradient(135deg, ' + hover + ', ' + accent + ') !important; color: ' + hoverOn + ' !important; }';
  }

  function hexToRgba(hex, alpha) {
    var n = parseInt(String(hex || '#000000').replace('#', ''), 16);
    return 'rgba(' + (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alpha + ')';
  }

  function injectCustomCss() {
    var el = document.getElementById('customThemeStyle');
    if (!el) {
      el = document.createElement('style');
      el.id = 'customThemeStyle';
      document.head.appendChild(el);
    }
    var css = getCustomThemes().map(customThemeCss).join('\n');
    el.textContent = css;
  }

  /* ---------- activation ---------- */
  function isCustom(id) { return /^custom-/.test(id); }

  function applyTheme(id) {
    var link = document.getElementById('mintThemeCss');
    if (link) { link.disabled = (id !== 'mint'); }
    var root = document.documentElement;
    THEMES.forEach(function (t) {
      if (t.id !== 'azure') root.classList.remove('theme-' + t.id);
    });
    // remove any custom class
    var keep = [];
    for (var i = 0; i < root.classList.length; i++) {
      if (!/^theme-custom-/.test(root.classList[i])) keep.push(root.classList[i]);
    }
    root.className = keep.join(' ');
    if (id !== 'azure' && id !== 'mint') root.classList.add('theme-' + id);
    root.setAttribute('data-theme', id);

    // Sync browser/OS status bar meta theme-color
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      var activeTheme = findTheme(id);
      var headerColor = (activeTheme && activeTheme.palette && activeTheme.palette[0]) ? activeTheme.palette[0] : '#0B132B';
      themeMeta.setAttribute('content', headerColor);
    }

    // Update quick toggle button label with the next theme in cycle
    var cycle = ['azure', 'executive', 'midnight', 'forest', 'mint'];
    var idx = cycle.indexOf(id);
    var nextId = (idx !== -1 && idx < cycle.length - 1) ? cycle[idx + 1] : cycle[0];
    var nextTheme = findTheme(nextId);
    var labels = document.querySelectorAll('#themeToggleLabel');
    var labelText = nextTheme ? (nextTheme.name.replace('CaseBook ', '').replace('Chambers ', '').replace('Judicial ', '')) : 'Theme';
    for (var j = 0; j < labels.length; j++) { labels[j].textContent = labelText; }

    // Mark selected card in Themes tab (if rendered)
    var cards = document.querySelectorAll('.theme-option-card');
    for (var k = 0; k < cards.length; k++) {
      cards[k].classList.toggle('selected', cards[k].getAttribute('data-theme-id') === id);
    }
  }

  function themeExists(id) {
    if (THEMES.some(function (t) { return t.id === id; })) return true;
    return getCustomThemes().some(function (t) { return t.id === id; });
  }

  function getStoredTheme() {
    try {
      var t = localStorage.getItem(STORAGE_KEY);
      return (t && themeExists(t)) ? t : 'azure';
    } catch (e) { return 'azure'; }
  }

  window.setAppTheme = function (id, persist) {
    if (!themeExists(id)) id = 'azure';
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
    }
    applyTheme(id);
  };

  /* Quick cycle toggle in sidenav */
  window.toggleAppTheme = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var current = getStoredTheme();
    var cycle = ['azure', 'executive', 'midnight', 'forest', 'mint'];
    var idx = cycle.indexOf(current);
    var next = (idx !== -1 && idx < cycle.length - 1) ? cycle[idx + 1] : cycle[0];
    window.setAppTheme(next);
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  };

  /* ---------- Themes tab rendering ---------- */
  window.renderThemeSettings = function () {
    var wrap = document.getElementById('themeOptionsGrid');
    if (!wrap) return;
    var current = getStoredTheme();
    var customs = getCustomThemes();
    var all = THEMES.concat(customs);
    var html = all.map(function (t) {
      var swatches = t.palette.map(function (c) {
        return '<span class="theme-swatch" style="background:' + c + '" title="' + c + '"></span>';
      }).join('');
      var del = isCustom(t.id)
        ? '<span class="theme-option-delete" onclick="deleteCustomTheme(\'' + t.id + '\')" title="Delete this theme"><i class="fa-solid fa-trash-can"></i></span>'
        : '';
      return '<div class="theme-option-card' + (t.id === current ? ' selected' : '') +
        '" data-theme-id="' + t.id + '" onclick="setAppTheme(\'' + t.id + '\')">' +
        '<span class="theme-option-icon"><i class="fa-solid ' + (t.icon || 'fa-palette') + '"></i></span>' +
        '<span class="theme-option-body">' +
        '<strong>' + escapeAttr(t.name) + (isCustom(t.id) ? ' <em class="rmk-badge rmk-badge-major">Custom</em>' : '') + '</strong>' +
        '<em>' + escapeAttr(t.desc || 'Your custom theme') + '</em>' +
        '<span class="theme-palette-row">' + swatches + '</span>' +
        '</span>' +
        '<span class="theme-option-check"><i class="fa-solid fa-circle-check"></i></span>' +
        del +
        '</div>';
    }).join('');
    // Theme Maker builder card
    html += '<div class="theme-maker-card" id="themeMakerCard">' +
      '<div class="theme-maker-head">' +
      '<span class="theme-option-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>' +
      '<div><strong>Theme Maker — Create Your Own</strong>' +
      '<em>Pick 5 colors; the app follows the light/dark contrast law automatically.</em></div>' +
      '</div>' +
      '<div class="theme-maker-grid">' +
      makerField('tmNav', 'Nav / Sidebar (dark bg)', '#1B2A47') +
      makerField('tmNavAccent', 'Gradient end (nav dark)', '#0F172A') +
      makerField('tmAccent', 'Buttons / Accent', '#C5A880') +
      makerField('tmHover', 'Hover color', '#A8895F') +
      makerField('tmActive', 'Active / selected', '#1B2A47') +
      makerField('tmOnDark', 'Text on dark bg', '#FFFFFF') +
      makerField('tmHoverText', 'Text on hover/active', '#FFFFFF') +
      makerField('tmBg', 'App background (light)', '#F8FAFC') +
      makerField('tmSurface', 'Cards / surfaces', '#FFFFFF') +
      '</div>' +
      '<div class="theme-maker-actions">' +
      '<input type="text" id="tmName" placeholder="Theme name (e.g. My Chambers)" maxlength="24">' +
      '<button type="button" class="primary-btn" onclick="previewCustomTheme()"><i class="fa-solid fa-eye"></i> Preview</button>' +
      '<button type="button" class="primary-btn" onclick="saveCustomTheme()"><i class="fa-solid fa-floppy-disk"></i> Save Theme</button>' +
      '<button type="button" class="secondary-btn" onclick="resetThemeMaker()">Reset</button>' +
      '</div></div>';
    wrap.innerHTML = html;
  };

  function makerField(id, label, def) {
    return '<label class="theme-maker-field"><span>' + label + '</span>' +
      '<span class="theme-maker-input"><input type="color" id="' + id + '" value="' + def + '">' +
      '<input type="text" id="' + id + 'Hex" value="' + def + '" maxlength="7" readonly></span></label>';
  }

  function escapeAttr(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ---------- theme maker actions ---------- */
  function readMakerColors() {
    var get = function (id) {
      var el = document.getElementById(id);
      return el ? el.value : null;
    };
    return {
      nav: get('tmNav'), navAccent: get('tmNavAccent'), accent: get('tmAccent'),
      hover: get('tmHover'), active: get('tmActive'),
      textOnDark: get('tmOnDark'), hoverText: get('tmHoverText'),
      bg: get('tmBg'), surface: get('tmSurface')
    };
  }

  function makerTempTheme(colors, name) {
    return { id: 'custom-preview', name: name || 'Preview', colors: colors };
  }

  window.previewCustomTheme = function () {
    injectOneCustomCss(makerTempTheme(readMakerColors(), 'Preview'));
    applyTheme('custom-preview');
  };

  function injectOneCustomCss(t) {
    var el = document.getElementById('customPreviewStyle');
    if (!el) {
      el = document.createElement('style');
      el.id = 'customPreviewStyle';
      document.head.appendChild(el);
    }
    el.textContent = customThemeCss(t);
  }

  window.saveCustomTheme = function () {
    var nameEl = document.getElementById('tmName');
    var name = (nameEl && nameEl.value.trim()) || 'My Theme';
    var colors = readMakerColors();
    if (!colors.nav || !colors.accent || !colors.bg) { alert('Pick colors first.'); return; }
    var list = getCustomThemes();
    var id = 'custom-' + Date.now().toString(36);
    var theme = {
      id: id, name: name, desc: 'Custom theme made with Theme Maker', icon: 'fa-palette',
      palette: [colors.nav, colors.navAccent, colors.accent, colors.hover, colors.active, colors.hoverText, colors.bg, colors.surface],
      colors: colors
    };
    list.push(theme);
    saveCustomThemes(list);
    // clear preview style, inject full set, activate saved theme
    var pv = document.getElementById('customPreviewStyle');
    if (pv) pv.textContent = '';
    injectCustomCss();
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
    applyTheme(id);
    window.renderThemeSettings();
  };

  window.deleteCustomTheme = function (id) {
    if (!confirm('Delete this custom theme?')) return;
    var list = getCustomThemes().filter(function (t) { return t.id !== id; });
    saveCustomThemes(list);
    injectCustomCss();
    if (getStoredTheme() === id) window.setAppTheme('azure');
    window.renderThemeSettings();
  };

  window.resetThemeMaker = function () {
    // remove preview, back to stored theme
    var pv = document.getElementById('customPreviewStyle');
    if (pv) pv.textContent = '';
    applyTheme(getStoredTheme());
    var defs = { tmNav: '#1B2A47', tmNavAccent: '#0F172A', tmAccent: '#C5A880', tmHover: '#A8895F', tmActive: '#1B2A47', tmOnDark: '#FFFFFF', tmHoverText: '#FFFFFF', tmBg: '#F8FAFC', tmSurface: '#FFFFFF' };
    Object.keys(defs).forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.value = defs[k];
      var hx = document.getElementById(k + 'Hex');
      if (hx) hx.value = defs[k];
    });
    var nm = document.getElementById('tmName');
    if (nm) nm.value = '';
  };

  window.getThemeList = function () { return THEMES.slice(); };

  /* ---------- boot ---------- */
  injectCustomCss();
  applyTheme(getStoredTheme());
  document.addEventListener('DOMContentLoaded', function () {
    injectCustomCss();
    applyTheme(getStoredTheme());
    window.renderThemeSettings();
  });
})();
