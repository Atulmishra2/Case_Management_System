/**
 * App Core — Main application orchestrator
 * Coordinates all services and handles navigation/rendering
 */

import { AuthService } from './auth-service.js';
import { SupabaseService } from './supabase-service.js';
import { CaseService } from './case-service.js';
import { HearingService } from './hearing-service.js';
import { CalendarService } from './calendar-service.js';
import { TaskService } from './task-service.js';
import { UIService } from './ui-service.js';

class App {
  constructor() {
    this.auth = new AuthService();
    this.db = new SupabaseService();
    this.cases = new CaseService(this.db);
    this.hearings = new HearingService(this.db, this.cases);
    this.calendar = new CalendarService(this.cases);
    this.tasks = new TaskService(this.cases);
    this.ui = new UIService(this.cases, this.tasks, this.hearings);

    // Navigation state
    this.tabHistory = [];
    this.tabForwardHistory = [];
    this.currentActiveTabId = 'home';
    this.editingPrevHearingCaseNo = null;
    this.editingPrevHearingRecord = null;

    // Expose services globally
    window.caseService = this.cases;
    window.hearingService = this.hearings;
    window.calendarService = this.calendar;
    window.taskService = this.tasks;
    window.uiService = this.ui;
    
    window.editingPrevHearingCaseNo = null;
    window.editingPrevHearingRecord = null;
  }

  async init() {
    // Check if user is already logged in
    const user = safeStorage.get('cmUser');
    if (user === 'admin') {
      this.auth.setActiveScreen('adminScreen');
      await this.fetchAllData();
    } else if (user === 'guest') {
      this.auth.setActiveScreen('guestScreen');
      await this.fetchAllData();
    }

    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize PWA
    this.setupPWA();
  }

  async fetchAllData() {
    const data = await this.db.fetchCases();
    if (data) {
      this.cases.setCases(data.cases, data.hearings, data.courts);
    }
    this.refreshAllViews();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
    }

    // Guest mode button
    const guestModeBtn = document.getElementById('guestModeBtn');
    if (guestModeBtn) {
      guestModeBtn.addEventListener('click', () => this.handleGuestLogin());
    }

    // Sidebar toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggleBtn && sidebar) {
      sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay?.classList.toggle('active');
        const isOpen = sidebar.classList.contains('mobile-open');
        sidebarToggleBtn.setAttribute('aria-expanded', isOpen);
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        sidebar?.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
      });
    }

    // Admin logout
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Guest logout
    const guestLogoutBtn = document.getElementById('guestLogoutBtn');
    if (guestLogoutBtn) {
      guestLogoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar a[data-tab]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        this.showTab(tabId);
      });
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
  }

  setupPWA() {
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker.register('service-worker.js')
        .then((reg) => {
          console.log('CMS Legal Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('CMS Legal Service Worker registration note:', err);
        });
    }

    window.addEventListener('appinstalled', () => {
      console.log('PWA application successfully installed!');
      this.ui.showToastNotification('App installed successfully!', 2000, 'success');
    });
  }

  // Navigation
  showTab(tabId, event, navType = 'navigate') {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    if (navType === 'navigate') {
      if (this.currentActiveTabId && this.currentActiveTabId !== tabId) {
        this.tabHistory.push(this.currentActiveTabId);
        if (this.tabHistory.length > 40) this.tabHistory.shift();
        this.tabForwardHistory = [];
      }
    }

    this.currentActiveTabId = tabId;
    this.updateNavigationButtons();

    // Persist current active tab
    safeStorage.set('cmActiveTab', tabId);
    try { sessionStorage.setItem('cmActiveTab', tabId); } catch (e) {}
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + tabId);
    }

    // Update tab visibility
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    // Auto-close mobile sidebar drawer on tab switch
    if (window.innerWidth <= 992) {
      const sidebar = document.querySelector('.sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      const toggleBtn = document.getElementById('sidebarToggleBtn');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Tab-specific initialization
    this.initTab(tabId);
    
    // Update active sidebar state
    document.querySelectorAll('.sidebar a').forEach(a => {
      a.classList.remove('active');
    });
    const matchingLink = Array.from(document.querySelectorAll('.sidebar a')).find(
      a => a.getAttribute('data-tab') === tabId
    );
    if (matchingLink) {
      matchingLink.classList.add('active');
    }
  }

  initTab(tabId) {
    switch (tabId) {
      case 'home':
        this.ui.renderHomeDashboard();
        break;
      case 'search':
        this.filterCaseTables();
        break;
      case 'causelist':
        this.initCauseListTab();
        break;
      case 'calendar':
        this.calendar.renderCalendarView();
        break;
      case 'upcoming':
        this.hearings.renderUpcomingWeekHearings();
        break;
      case 'todo':
        this.tasks.populateTodoCaseDropdown();
        this.tasks.renderCaseTasks();
        break;
      case 'hearing':
        this.tasks.populateHearingCaseDropdown();
        break;
      case 'add':
        this.renderCaseTypeDropdown();
        break;
      case 'update':
        this.renderCaseTypeDropdown();
        break;
      case 'delete':
        this.renderDeleteSearch();
        break;
      case 'settings': {
        const currentAdminEl = document.getElementById('currentAdminUsername');
        const newUsernameEl = document.getElementById('newUsername');
        const activeUser = this.auth.getUsername();
        if (currentAdminEl) currentAdminEl.value = activeUser;
        if (newUsernameEl && !newUsernameEl.value) newUsernameEl.value = activeUser;
        break;
      }
      case 'courts':
        this.cases.renderCourtsTable();
        break;
    }
  }

  goPreviousTab() {
    if (this.tabHistory.length > 0) {
      const previousTabId = this.tabHistory.pop();
      if (previousTabId) {
        if (this.currentActiveTabId) {
          this.tabForwardHistory.push(this.currentActiveTabId);
        }
        this.showTab(previousTabId, null, 'back');
      }
    }
  }

  goForwardTab() {
    if (this.tabForwardHistory.length > 0) {
      const nextTabId = this.tabForwardHistory.pop();
      if (nextTabId) {
        if (this.currentActiveTabId) {
          this.tabHistory.push(this.currentActiveTabId);
        }
        this.showTab(nextTabId, null, 'forward');
      }
    }
  }

  updateNavigationButtons() {
    const backBtn = document.getElementById('bottomNavBackBtn');
    const forwardBtn = document.getElementById('bottomNavForwardBtn');
    const homeBtn = document.getElementById('bottomNavHomeBtn');

    if (backBtn) {
      const hasBack = this.tabHistory.length > 0;
      backBtn.disabled = !hasBack;
      backBtn.classList.toggle('disabled', !hasBack);
    }

    if (forwardBtn) {
      const hasForward = this.tabForwardHistory.length > 0;
      forwardBtn.disabled = !hasForward;
      forwardBtn.classList.toggle('disabled', !hasForward);
    }

    if (homeBtn) {
      homeBtn.classList.toggle('active', this.currentActiveTabId === 'home');
    }
  }

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      input.type = 'password';
      if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
  }

  // Auth handlers
  async handleAdminLogin(event) {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput ? usernameInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    const errorBox = document.getElementById('loginError');

    if (!username || !password) {
      if (errorBox) errorBox.textContent = 'Please enter both username and password.';
      return false;
    }

    try {
      if (this.auth.validateLogin(username, password)) {
        const rememberEl = document.getElementById('rememberMe');
        const isPersistent = rememberEl ? rememberEl.checked : true;
        safeStorage.set('cmUser', 'admin', isPersistent);
        this.auth.setActiveScreen('adminScreen');
        if (errorBox) errorBox.textContent = '';
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        await this.fetchAllData();
        return false;
      }

      if (errorBox) {
        errorBox.textContent = 'Invalid username or password. Demo: admin / admin123';
      }
    } catch (err) {
      console.error('Login error:', err);
      this.auth.setActiveScreen('adminScreen');
      if (errorBox) errorBox.textContent = '';
    }

    return false;
  }

  handleAdminLogout() {
    this.auth.logout();
    this.auth.setActiveScreen('loginScreen');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.textContent = '';
  }

  handleGuestLogin(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.auth.guestLogin();
    this.auth.setActiveScreen('guestScreen');
    this.fetchAllData();
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.textContent = '';
  }

  handleLogout(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.auth.logout();
    this.auth.setActiveScreen('loginScreen');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.textContent = '';
  }

  triggerPwaInstall() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          this.ui.showToastNotification('App installed successfully!', 2000, 'success');
        }
        window.deferredPrompt = null;
      });
    } else {
      alert('Please use your browser\'s "Add to Home Screen" option to install this app.');
    }
  }

  handleChangeCredentials(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.auth.changeCredentials(
      document.getElementById('currentPassword')?.value.trim() || '',
      document.getElementById('newUsername')?.value.trim() || '',
      document.getElementById('newPassword')?.value.trim() || '',
      document.getElementById('confirmNewPassword')?.value.trim() || ''
    );
  }

  restoreActiveAdminTab() {
    let targetTab = 'home';
    const hash = (window.location.hash || '').replace(/^#/, '').trim();
    const storedTab = safeStorage.get('cmActiveTab') || 
                      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cmActiveTab') : null);

    if (hash && document.getElementById(hash)) {
      targetTab = hash;
    } else if (storedTab && document.getElementById(storedTab)) {
      targetTab = storedTab;
    }

    this.showTab(targetTab, null, 'restore');
  }

  // Case operations
  setQuickCaseFilter(filterType, evt = null) {
    const searchInput = document.getElementById('globalSearch');
    const typeFilter = document.getElementById('searchTypeFilter');
    const courtFilter = document.getElementById('searchCourtFilter');
    const statusFilter = document.getElementById('searchStatusFilter');
    const dateFilter = document.getElementById('searchDateFilter');

    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = '';
    if (courtFilter) courtFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';

    if (filterType === 'today' && dateFilter) {
      dateFilter.value = 'today';
    } else if (filterType === 'undated' && dateFilter) {
      dateFilter.value = 'undated';
    } else if (filterType === 'pending' && statusFilter) {
      statusFilter.value = 'pending';
    } else if (filterType === 'disposed' && statusFilter) {
      statusFilter.value = 'disposed';
    }

    const chips = document.querySelectorAll('.quick-filter-chip');
    chips.forEach(chip => chip.classList.remove('active'));

    if (evt && evt.target && evt.target.classList.contains('quick-filter-chip')) {
      evt.target.classList.add('active');
    } else if (filterType === 'all' && chips[0]) {
      chips[0].classList.add('active');
    }

    this.filterCaseTables();
  }

  filterCaseTables() {
    const searchInput = document.getElementById('globalSearch');
    const courtFilter = document.getElementById('searchCourtFilter');
    const typeFilter = document.getElementById('searchTypeFilter');
    const statusFilter = document.getElementById('searchStatusFilter');
    const dateFilter = document.getElementById('searchDateFilter');
    const countBadge = document.getElementById('searchResultCountBadge');
    const clearBtn = document.getElementById('clearSearchBtn');

    const query = (searchInput?.value || '').trim().toLowerCase();
    const selectedCourt = (courtFilter?.value || '').trim().toLowerCase();
    const selectedType = (typeFilter?.value || '').trim().toLowerCase();
    const selectedStatus = (statusFilter?.value || '').trim().toLowerCase();
    const selectedDate = (dateFilter?.value || '').trim();

    const resultsTable = document.querySelector('#search .search-results-table');
    const resultsBody = resultsTable?.querySelector('tbody');

    const stats = this.cases.getStats();

    const totalStatEl = document.getElementById('myCasesTotalStat');
    const pendingStatEl = document.getElementById('myCasesPendingStat');
    const todayStatEl = document.getElementById('myCasesTodayStat');
    const undatedStatEl = document.getElementById('myCasesUndatedStat');
    const disposedStatEl = document.getElementById('myCasesDisposedStat');

    if (totalStatEl) totalStatEl.textContent = String(stats.total);
    if (pendingStatEl) pendingStatEl.textContent = String(stats.pending);
    if (todayStatEl) todayStatEl.textContent = String(stats.today);
    if (undatedStatEl) undatedStatEl.textContent = String(stats.undated);
    if (disposedStatEl) disposedStatEl.textContent = String(stats.disposed);

    let matches = [...this.cases.cases];

    // Filter by Case Type
    if (selectedType) {
      matches = matches.filter(c => (c.caseType || 'civil').toLowerCase() === selectedType);
    }

    // Filter by Court
    if (selectedCourt) {
      matches = matches.filter(c => {
        const courtVal = (c.courtName || c.criminalCourtName || '').trim().toLowerCase();
        return courtVal === selectedCourt;
      });
    }

    // Filter by Status
    if (selectedStatus) {
      matches = matches.filter(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        if (selectedStatus === 'disposed') return isDisposed;
        if (selectedStatus === 'pending') return !isDisposed;
        return true;
      });
    }

    // Filter by Hearing Schedule
    if (selectedDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === 'today') {
        matches = matches.filter(c => c.nextHearing === todayStr);
      } else if (selectedDate === 'upcoming') {
        const weekAhead = new Date();
        weekAhead.setDate(weekAhead.getDate() + 7);
        const weekAheadStr = weekAhead.toISOString().split('T')[0];
        matches = matches.filter(c => {
          if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
          return c.nextHearing >= todayStr && c.nextHearing <= weekAheadStr;
        });
      } else if (selectedDate === 'undated') {
        matches = matches.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || c.nextHearing.trim() === '');
      } else if (selectedDate === 'scheduled') {
        matches = matches.filter(c => c.nextHearing && c.nextHearing !== '—' && c.nextHearing !== 'null' && c.nextHearing.trim() !== '');
      }
    }

    // Filter by Search Query
    if (query) {
      matches = matches.filter(c => {
        const haystack = [
          c.caseNo, c.criminalCaseNumber, c.caseName,
          c.plaintiff, c.defendant,
          c.victimName, c.accusedName,
          c.clientName, c.criminalClientName,
          c.clientNumber, c.criminalClientNumber,
          c.courtName, c.criminalCourtName,
          c.partyName, c.policeStation, c.crimeSection, c.crimeNumber,
          c.caseType, c.caseStatus, c.remark, c.hearingProcess
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    if (countBadge) {
      countBadge.textContent = `Showing ${matches.length} of ${this.cases.cases.length} Cases`;
    }

    if (matches.length === 0) {
      if (resultsBody) {
        resultsBody.innerHTML = `<tr><td colspan="9" class="no-results">
          <i class="fa-solid fa-magnifying-glass"></i> No cases found matching the specified filters. Try clearing or changing your filters.
        </td></tr>`;
      }
      this.ui.renderSelectedCaseDetails(null);
      return;
    }

    if (resultsBody) {
      resultsBody.innerHTML = '';
      matches.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = `clickable-row ${index === 0 ? 'selected-row' : ''}`;

        const caseNumber = item.caseNo || item.criminalCaseNumber || '—';
        const caseName = item.caseName || 
          (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : 
          (item.victimName ? `${item.victimName} vs ${item.accusedName}` : '—'));
        const courtName = item.courtName || item.criminalCourtName || '—';
        const clientName = item.clientName || item.criminalClientName || '—';
        const caseType = (item.caseType || 'civil').toLowerCase();
        const isDisposed = (item.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? `<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>`
          : `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
        const nextHearing = formatDateDMY(item.nextHearing);
        const remark = item.remark || item.remarks || '';
        const remarkHtml = remark
          ? `<span class="case-remark-clamp" title="${escapeHtml(remark)}"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(remark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';

        tr.innerHTML = `
          <td style="text-align: center;"><strong>${index + 1}</strong></td>
          <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
          <td>${escapeHtml(caseName)}</td>
          <td class="case-remark-cell">${remarkHtml}</td>
          <td>${escapeHtml(clientName)}</td>
          <td><span class="case-badge ${caseType}">${caseType.toUpperCase()}</span></td>
          <td>${escapeHtml(courtName)}</td>
          <td>${statusBadge}</td>
          <td><strong>${nextHearing}</strong></td>
        `;

        const caseNumTd = tr.children ? tr.children[1] : null;
        if (caseNumTd && typeof caseNumTd.addEventListener === 'function') {
          caseNumTd.addEventListener('dblclick', (e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            this.copyCaseNumberToClipboard(caseNumber, caseNumTd);
          });
        }

        tr.addEventListener('click', () => {
          resultsBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
          tr.classList.add('selected-row');
          this.ui.renderSelectedCaseDetails(item);
        });

        resultsBody.appendChild(tr);
      });
    }

    if (matches[0]) {
      this.ui.renderSelectedCaseDetails(matches[0]);
    }
  }

  refreshAllViews() {
    // Render all case tables
    this.ui.renderCivilCasesTable();
    this.refreshAllCaseTables();
    this.hearings.renderUpcomingWeekHearings();
    this.ui.renderGuestTable();
    this.ui.renderHomeDashboard();
    this.filterCaseTables();
    this.initCauseListTab();
    this.calendar.renderCalendarView();
    this.tasks.populateHearingCaseDropdown();
    this.tasks.populateTodoCaseDropdown();
    this.tasks.renderCaseTasks();
  }

  refreshAllCaseTables() {
    // This will call the UI service methods
    this.cases.renderAllCases();
  }

  // Helper methods
  copyCaseNumberToClipboard(caseNumber, triggerEl = null) {
    if (!caseNumber || caseNumber === '—') return;
    const cleanNo = caseNumber.trim();

    const showFeedback = () => {
      this.ui.showToastNotification(`Copied: ${cleanNo}`, 2000, 'success');
      if (triggerEl) {
        triggerEl.classList.add('copy-success-pulse');
        setTimeout(() => {
          triggerEl.classList.remove('copy-success-pulse');
        }, 500);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanNo).then(showFeedback).catch(() => {
        this.fallbackCopyText(cleanNo);
        showFeedback();
      });
    } else {
      this.fallbackCopyText(cleanNo);
      showFeedback();
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy error:', err);
    }
    document.body.removeChild(textArea);
  }

  // Tab init methods
  initCauseListTab() {
    const dateInput = document.getElementById('causeListDateInput');
    const courtSelect = document.getElementById('causeListCourtFilterSelect');

    if (!dateInput) return;
    
    let currentCauseListDate = new Date().toISOString().split('T')[0];
    dateInput.value = currentCauseListDate;
    
    if (courtSelect) {
      const prevVal = courtSelect.value || '';
      courtSelect.innerHTML = '<option value="">All Courts</option>';
      const courts = this.cases.getCourtOptions();
      courts.forEach(court => {
        const opt = document.createElement('option');
        opt.value = court;
        opt.textContent = court;
        courtSelect.appendChild(opt);
      });
      if (prevVal) courtSelect.value = prevVal;
    }

    this.ui.renderCauseListTable(
      dateInput.value,
      courtSelect ? courtSelect.value : ''
    );
  }

  setCauseListDateOffset(daysOffset) {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dateInput = document.getElementById('causeListDateInput');
    if (dateInput) dateInput.value = dateStr;

    const courtSelect = document.getElementById('causeListCourtFilterSelect');
    this.ui.renderCauseListTable(dateStr, courtSelect ? courtSelect.value : '');
  }

  // Case type dropdown
  renderCaseTypeDropdown() {
    const select = document.getElementById('caseTypeDropdown');
    if (!select) return;
    
    const options = [
      { value: 'civil', label: 'Civil Cases' },
      { value: 'state', label: 'State Cases (Criminal / FIR)' },
      { value: 'family', label: 'Family Cases (Matrimonial / Maintenance)' },
      { value: 'revenue', label: 'Revenue Cases (Land / Tehsil)' },
      { value: 'misc_civil', label: 'Misc Civil (Applications / Appeals)' },
      { value: 'misc_criminal', label: 'Misc Criminal (Bails / Appeals)' },
      { value: 'complaint', label: 'Complaint Cases (Sec 138 / 200 CrPC)' }
    ];

    select.innerHTML = options.map(opt => 
      `<option value="${opt.value}">${escapeHtml(opt.label)}</option>`
    ).join('');
  }

  renderDeleteSearch() {
    // Render delete search form
  }

  // Expose key methods
  loadCaseForUpdate(caseNo) {
    // This would load the case for editing
  }

  openUpdateHearingForCase(caseNo) {
    this.showTab('hearing');
    this.tasks.populateHearingCaseDropdown(caseNo);
    const caseInput = document.getElementById('hearingCaseNo');
    if (caseInput) caseInput.value = caseNo;
    this.hearings.renderHearingCaseInfo(caseNo);
    setTimeout(() => {
      const dateInput = document.getElementById('hearingDate');
      if (dateInput) dateInput.focus();
    }, 100);
  }

  openTodoForCase(caseNo = '') {
    this.showTab('todo');
    if (caseNo) {
      this.tasks.openAddTodoModal(caseNo);
    }
  }

  async saveHearingForward() {
    const caseInput = document.getElementById('hearingCaseNo');
    const dateInput = document.getElementById('hearingDate');
    const processInput = document.getElementById('hearingProcess');
    
    if (!caseInput || !caseInput.value.trim()) {
      this.ui.showToastNotification('Please select or enter a case number first.', 2500, 'warning');
      return;
    }

    const caseNo = caseInput.value.trim();
    const hearingDate = dateInput?.value;
    const process = processInput?.value.trim();

    if (!hearingDate) {
      this.ui.showToastNotification('Please select a hearing date.', 2500, 'warning');
      return;
    }

    if (!process) {
      this.ui.showToastNotification('Please specify the stage/process.', 2500, 'warning');
      return;
    }

    await this.hearings.updateHearing(caseNo, hearingDate, process);
    
    this.ui.showToastNotification(
      `Hearing for "${caseNo}" forwarded to ${formatDateDMY(hearingDate)} (${process})`
    , 3500, 'success');
    
    alert(`Hearing for Case "${caseNo}" has been updated and forwarded to ${formatDateDMY(hearingDate)} (${process}) successfully!`);
  }
}

// Import safeStorage
import { safeStorage } from './auth-service.js';
import { formatDateDMY, escapeHtml } from './case-service.js';

export { App };