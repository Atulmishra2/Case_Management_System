/* ============================================================================
   CASEBOOK MINT — CUSTOM DATE PICKER
   Replaces the native <input type="date"> popup with a consistent
   CaseBook Mint calendar across the whole app.
   - input.value stays ISO (YYYY-MM-DD), exactly what admin.js expects
   - the mint popup is the ONLY picker UI (native popup suppressed)
   - keyboard entry still works natively (type=date parses it)
   - auto-attaches to every input[type=date], present or added later
   ========================================================================= */
(function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  // Monday-first week (Indian legal register convention)
  var WEEKDAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  var pickerEl = null;      // singleton popup
  var activeInput = null;   // input currently bound
  var viewYear = 0;
  var viewMonth = 0;

  function pad2(n) { return String(n).padStart(2, '0'); }
  function isoOf(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }

  function isoToParts(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    return { y: +m[1], m: +m[2] - 1, d: +m[3] };
  }

  function setValue(input, iso, fireChange) {
    input.value = iso || '';
    if (fireChange) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* ---------- popup construction (built once, reused) ---------- */
  function ensurePicker() {
    if (pickerEl) return pickerEl;
    pickerEl = document.createElement('div');
    pickerEl.className = 'mint-date-picker';
    pickerEl.setAttribute('role', 'dialog');
    pickerEl.innerHTML =
      '<div class="mdp-header">' +
      '  <button type="button" class="mdp-nav mdp-prev" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button>' +
      '  <button type="button" class="mdp-nav mdp-prev-year" aria-label="Previous year"><i class="fa-solid fa-angles-left"></i></button>' +
      '  <div class="mdp-title">' +
      '    <select class="mdp-month" aria-label="Month"></select>' +
      '    <select class="mdp-year" aria-label="Year"></select>' +
      '  </div>' +
      '  <button type="button" class="mdp-nav mdp-next-year" aria-label="Next year"><i class="fa-solid fa-angles-right"></i></button>' +
      '  <button type="button" class="mdp-nav mdp-next" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>' +
      '</div>' +
      '<div class="mdp-subtitle">Select a Date</div>' +
      '<div class="mdp-weekdays"></div>' +
      '<div class="mdp-days"></div>' +
      '<div class="mdp-footer">' +
      '  <button type="button" class="mdp-btn mdp-today-btn"><i class="fa-solid fa-calendar-day"></i> Today</button>' +
      '  <button type="button" class="mdp-btn mdp-clear-btn"><i class="fa-solid fa-xmark"></i> Clear</button>' +
      '</div>';

    pickerEl.querySelector('.mdp-prev').addEventListener('click', function () { shiftMonth(-1); });
    pickerEl.querySelector('.mdp-next').addEventListener('click', function () { shiftMonth(1); });
    pickerEl.querySelector('.mdp-prev-year').addEventListener('click', function () { shiftMonth(-12); });
    pickerEl.querySelector('.mdp-next-year').addEventListener('click', function () { shiftMonth(12); });
    pickerEl.querySelector('.mdp-month').addEventListener('change', function () {
      viewMonth = parseInt(this.value, 10);
      renderGrid();
    });
    pickerEl.querySelector('.mdp-year').addEventListener('change', function () {
      viewYear = parseInt(this.value, 10);
      renderGrid();
    });
    pickerEl.querySelector('.mdp-today-btn').addEventListener('click', function () {
      var now = new Date();
      if (activeInput) {
        setValue(activeInput, isoOf(now.getFullYear(), now.getMonth(), now.getDate()), true);
      }
      closePicker();
    });
    pickerEl.querySelector('.mdp-clear-btn').addEventListener('click', function () {
      if (activeInput) setValue(activeInput, '', true);
      closePicker();
    });

    document.body.appendChild(pickerEl);
    return pickerEl;
  }

  function shiftMonth(delta) {
    var total = viewYear * 12 + viewMonth + delta;
    viewYear = Math.floor(total / 12);
    viewMonth = ((total % 12) + 12) % 12;
    renderGrid();
  }

  function renderGrid() {
    var wk = pickerEl.querySelector('.mdp-weekdays');
    wk.innerHTML = WEEKDAYS_MON.map(function (d) {
      return '<span class="mdp-wd">' + d + '</span>';
    }).join('');

    var daysEl = pickerEl.querySelector('.mdp-days');
    daysEl.innerHTML = '';

    // Month dropdown
    var monthSel = pickerEl.querySelector('.mdp-month');
    monthSel.innerHTML = MONTHS.map(function (nm, idx) {
      return '<option value="' + idx + '"' + (idx === viewMonth ? ' selected' : '') + '>' + nm + '</option>';
    }).join('');

    // Year dropdown: current view year ± 10, expanding window if needed
    var nowY = new Date().getFullYear();
    var yMin = Math.min(nowY - 10, viewYear - 5);
    var yMax = Math.max(nowY + 10, viewYear + 5);
    var yearSel = pickerEl.querySelector('.mdp-year');
    var yearHtml = '';
    for (var y = yMin; y <= yMax; y++) {
      yearHtml += '<option value="' + y + '"' + (y === viewYear ? ' selected' : '') + '>' + y + '</option>';
    }
    yearSel.innerHTML = yearHtml;

    var selected = activeInput ? isoToParts(activeInput.value) : null;
    var today = new Date();
    var todayIso = isoOf(today.getFullYear(), today.getMonth(), today.getDate());

    var first = new Date(viewYear, viewMonth, 1);
    // Monday-first offset: JS getDay() is Sun=0 → (getDay()+6)%7 gives Mon=0
    var lead = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (var i = 0; i < lead; i++) {
      var blank = document.createElement('span');
      blank.className = 'mdp-day mdp-blank';
      daysEl.appendChild(blank);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var iso = isoOf(viewYear, viewMonth, d);
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'mdp-day';
      cell.textContent = d;
      if (iso === todayIso) cell.classList.add('mdp-today');
      if (selected && selected.y === viewYear && selected.m === viewMonth && selected.d === d) {
        cell.classList.add('mdp-selected');
      }
      (function (isoVal, cellEl) {
        cellEl.addEventListener('click', function () {
          if (activeInput) setValue(activeInput, isoVal, true);
          closePicker();
        });
      })(iso, cell);
      daysEl.appendChild(cell);
    }
  }

  function positionPicker(input) {
    var rect = input.getBoundingClientRect();
    // measure the real picker size (falls back to estimates pre-layout)
    var popW = pickerEl.offsetWidth || 280;
    var popH = pickerEl.offsetHeight || 360;
    var left = rect.left;
    var top = rect.bottom + 6;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    // Prefer BELOW the input (user preference). Only flip above when
    // there is genuinely not enough room below AND the picker fits above.
    var spaceBelow = window.innerHeight - rect.bottom - 8;
    var spaceAbove = rect.top - 8;
    if (popH > spaceBelow && spaceAbove > spaceBelow && spaceAbove >= popH) {
      top = rect.top - popH - 6; // flip above
    }
    // never let it overflow the viewport
    if (top + popH > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - popH - 8);
    }
    if (top < 8) top = 8;
    pickerEl.style.left = left + 'px';
    pickerEl.style.top = top + 'px';
  }

  function openPicker(input) {
    ensurePicker();
    activeInput = input;
    var p = isoToParts(input.value) || (function (t) {
      return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
    })(new Date());
    viewYear = p.y;
    viewMonth = p.m;
    renderGrid();
    pickerEl.classList.add('mdp-open');
    positionPicker(input);
  }

  function closePicker() {
    if (pickerEl) pickerEl.classList.remove('mdp-open');
    activeInput = null;
  }

  /* ---------- per-input attachment ---------- */
  function attach(input) {
    if (input.getAttribute('data-mint-datepicker')) return;
    input.setAttribute('data-mint-datepicker', '1');

    // Open mint picker on tap/click; suppress the native popup.
    // pointerdown runs BEFORE focus and before mobile browsers hand off
    // to the OS picker, so intercepting it prevents the native UI.
    input.addEventListener('pointerdown', function (e) {
      e.preventDefault();   // blocks focus → blocks native OS picker
      e.stopPropagation();
      if (pickerEl && pickerEl.classList.contains('mdp-open') && activeInput === input) {
        closePicker();
      } else {
        openPicker(input);
      }
    });

    input.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      // pointerdown already handled it; keep click inert just in case
      // a browser dispatches click without pointerdown (keyboard activation)
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && (e.altKey || e.metaKey)) {
        e.preventDefault();
        openPicker(input);
      }
      if (e.key === 'Escape') closePicker();
    });

    // Block programmatic native picker where possible (harmless no-op
    // where the property is read-only — CSS pointer-events handles it)
    try {
      input.showPicker = function () { openPicker(input); };
    } catch (err) { /* non-writable on some engines — ignore */ }
  }

  /* ---------- global listeners ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (!pickerEl || !activeInput) return;
    if (pickerEl.contains(e.target)) return;
    if (e.target === activeInput) return;
    closePicker();
  }, true);

  window.addEventListener('resize', function () {
    if (pickerEl && activeInput) positionPicker(activeInput);
  });

  function attachAll(root) {
    var list = (root || document).querySelectorAll('input[type="date"]');
    Array.prototype.forEach.call(list, attach);
  }

  /* ---------- boot: initial + dynamically-added inputs ---------- */
  function boot() { attachAll(document); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Catch inputs injected later (tab switches, form builders)
  var MutationObserverCls = window.MutationObserver || window.WebKitMutationObserver;
  if (MutationObserverCls) {
    var obs = new MutationObserverCls(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        Array.prototype.forEach.call(mutations[i].addedNodes, function (n) {
          if (n.nodeType !== 1) return;
          if (n.tagName === 'INPUT' && n.type === 'date') attach(n);
          else if (n.querySelectorAll) attachAll(n);
        });
      }
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  window.MintDatePicker = {
    attach: attach,
    attachAll: attachAll,
    close: closePicker,
    open: openPicker,
    isoOf: isoOf,
    isoToParts: isoToParts
  };
})();
