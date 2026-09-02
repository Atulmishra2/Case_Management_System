// ==============================================================================
// Windows Desktop Widget Script • Case Management System
// Real-time Supabase Database Sync, Upcoming Hearings & Interactive To-Dos
// ==============================================================================

const SUPABASE_URL = 'https://podehqyygbbabkimbcud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r8RXVVAf9UJfa9jtdamN_A_I5ZiDflg';

let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Widget Supabase Client Init Error:', err);
  }
}

// Global Widget State
let widgetState = {
  cases: [],
  hearings: [],
  todos: [],
  currentTodoFilter: 'all',
  lastSync: null,
  isOnline: false
};

// ==============================================================================
// Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.M && typeof window.M.AutoInit === 'function') {
    window.M.AutoInit();
  }
  initLiveClock();
  fetchAllWidgetData();

  // Background Auto-sync every 60 seconds
  setInterval(() => {
    fetchAllWidgetData(false);
  }, 60000);

  // Window Control Buttons (Native Desktop Widget)
  const pinBtn = document.getElementById('winPinBtn');
  const minBtn = document.getElementById('winMinBtn');
  const closeBtn = document.getElementById('winCloseBtn');
  const openAdminBtn = document.getElementById('widgetOpenAdminBtn');

  if (window.electronWidget) {
    if (minBtn) {
      minBtn.addEventListener('click', () => window.electronWidget.minimize());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => window.electronWidget.close());
    }
    if (pinBtn) {
      pinBtn.addEventListener('click', async () => {
        const isPinnedNow = await window.electronWidget.togglePin();
        pinBtn.classList.toggle('active-pinned', isPinnedNow);
      });
    }
    if (openAdminBtn) {
      openAdminBtn.addEventListener('click', () => window.electronWidget.openAdmin());
    }
  } else {
    // Fallback if opened directly
    if (openAdminBtn) {
      openAdminBtn.addEventListener('click', () => window.open('admin.html', '_blank'));
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => window.close());
    }
  }

  const refreshBtn = document.getElementById('widgetRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => fetchAllWidgetData(true));
  }
});

function initLiveClock() {
  const clockEl = document.getElementById('widgetLiveClock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    clockEl.textContent = now.toLocaleDateString('en-IN', options);
  }
  updateClock();
  setInterval(updateClock, 30000);
}

function switchWidgetTab(tabName) {
  // Update Bulma Header Tabs
  document.querySelectorAll('.widget-nav-tabs li').forEach(li => {
    li.classList.remove('is-active');
  });
  const activeNavTab = document.getElementById(`nav-tab-${tabName}`);
  if (activeNavTab) activeNavTab.classList.add('is-active');

  // Update Tab Content Sections
  document.querySelectorAll('.widget-tab-content').forEach(tab => {
    tab.classList.remove('is-active-tab');
  });

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) {
    targetTab.classList.add('is-active-tab');
  }
}
window.switchWidgetTab = switchWidgetTab;

// ==============================================================================
// Data Fetching & Real-Time Sync
// ==============================================================================
async function fetchAllWidgetData(isManual = false) {
  const refreshBtn = document.getElementById('widgetRefreshBtn');
  const statusDot = document.getElementById('cloudStatusDot');
  const statusText = document.getElementById('cloudStatusText');

  if (refreshBtn) refreshBtn.classList.add('spinning');
  if (statusText && isManual) statusText.textContent = 'Syncing...';

  try {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    // Parallel fetch from Supabase (matching CMS schemas)
    const [civilRes, crimRes, hearingsRes, todosRes] = await Promise.all([
      supabaseClient.from('civilcases').select('*'),
      supabaseClient.from('criminalcases').select('*'),
      supabaseClient.from('hearings').select('*'),
      supabaseClient.from('case_todos').select('*').order('deadline_date', { ascending: true })
    ]);

    // Fallback if case_todos returned error or table not yet created
    let rawTodos = todosRes.data || [];
    if (todosRes.error || !todosRes.data) {
      const fallbackTodos = await supabaseClient.from('todos').select('*');
      if (fallbackTodos.data) rawTodos = fallbackTodos.data;
    }

    // Process Cases
    const civilCases = (civilRes.data || []).map(c => ({
      id: c.id,
      caseNo: c.case_number,
      caseName: c.case_name || `${c.plaintiff || ''} vs ${c.defendant || ''}`,
      courtName: c.court_name || 'Court',
      caseType: 'civil',
      nextHearing: c.next_hearing_date || c.next_hearing || '',
      clientName: c.client_name || '',
      raw: c
    }));

    const crimCases = (crimRes.data || []).map(c => ({
      id: c.id,
      caseNo: c.case_number,
      caseName: c.case_name || `${c.victim_name || ''} vs ${c.accused_name || ''}`,
      courtName: c.court_name || 'Court',
      caseType: 'criminal',
      nextHearing: c.next_hearing_date || c.next_hearing || '',
      clientName: c.client_name || '',
      raw: c
    }));

    // Process To-Do Tasks from case_todos
    const processedTodos = rawTodos.map(t => {
      const isDone = String(t.status || '').toLowerCase() === 'completed' || Boolean(t.is_completed || t.completed);
      return {
        id: t.id,
        taskTitle: t.task_title || t.title || t.task || 'Task',
        caseNo: t.case_number || '',
        caseName: t.case_name || '',
        priority: String(t.priority || 'medium').toLowerCase(),
        status: isDone ? 'completed' : 'pending',
        isCompleted: isDone,
        dueDate: t.deadline_date || t.due_date || null,
        hearingDate: t.hearing_date || null,
        createdAt: t.created_at || new Date().toISOString()
      };
    });

    widgetState.cases = [...civilCases, ...crimCases];
    widgetState.hearings = hearingsRes.data || [];
    widgetState.todos = processedTodos;
    widgetState.isOnline = true;
    widgetState.lastSync = new Date();

    // Update UI Status
    if (statusDot) {
      statusDot.className = 'status-dot online';
    }
    if (statusText) {
      statusText.textContent = 'Supabase Connected';
    }

    // Render components
    renderWidgetKPIs();
    renderUpcomingHearings();
    renderWidgetTodos();
    updateLastSyncTime();

    if (isManual) {
      checkAndSendDesktopNotifications();
    }
  } catch (err) {
    console.error('Widget Data Sync Error:', err);
    widgetState.isOnline = false;
    if (statusDot) statusDot.className = 'status-dot offline';
    if (statusText) statusText.textContent = 'Offline / Error';
  } finally {
    if (refreshBtn) {
      setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    }
  }
}
window.fetchAllWidgetData = fetchAllWidgetData;

function updateLastSyncTime() {
  const syncEl = document.getElementById('lastSyncTime');
  if (!syncEl || !widgetState.lastSync) return;
  const timeStr = widgetState.lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  syncEl.textContent = timeStr;
}

// ==============================================================================
// KPI Calculation & Render
// ==============================================================================
function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderWidgetKPIs() {
  const todayStr = getTodayIsoDate();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Today's listings count
  const todayListings = widgetState.hearings.filter(h => {
    const hDate = (h.hearing_date || h.next_hearing_date || '').slice(0, 10);
    return hDate === todayStr;
  });

  // Next 7 days hearings count
  const weekHearings = widgetState.hearings.filter(h => {
    const hDateStr = (h.hearing_date || h.next_hearing_date || '').slice(0, 10);
    if (!hDateStr) return false;
    const hDate = new Date(hDateStr);
    hDate.setHours(0, 0, 0, 0);
    return hDate >= now && hDate <= sevenDaysLater;
  });

  // Pending To-Dos
  const pendingTodos = widgetState.todos.filter(t => !t.is_completed && !t.completed);

  const kpiToday = document.getElementById('kpiTodayCount');
  const kpiWeek = document.getElementById('kpiWeekCount');
  const kpiTodos = document.getElementById('kpiPendingTodos');

  if (kpiToday) kpiToday.textContent = todayListings.length;
  if (kpiWeek) kpiWeek.textContent = weekHearings.length;
  if (kpiTodos) kpiTodos.textContent = pendingTodos.length;

  const todayPill = document.getElementById('todayListingPill');
  const weekPill = document.getElementById('weekListingPill');
  if (todayPill) todayPill.textContent = `${todayListings.length} listed`;
  if (weekPill) weekPill.textContent = `${weekHearings.length} cases`;
}

// ==============================================================================
// Upcoming Cases & Today's Hearings Render
// ==============================================================================
function renderUpcomingHearings() {
  const todayContainer = document.getElementById('todayListingsContainer');
  const weekContainer = document.getElementById('upcomingHearingsContainer');

  if (!todayContainer || !weekContainer) return;

  const todayStr = getTodayIsoDate();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Match hearings with case details
  const enrichedHearings = widgetState.hearings.map(h => {
    const caseNo = h.case_number || h.case_no;
    const matchedCase = widgetState.cases.find(c => c.caseNo === caseNo) || {};
    return {
      ...h,
      caseNumber: caseNo || 'No Case No',
      caseName: matchedCase.caseName || h.case_name || 'Matter Pending',
      courtName: h.court_name || matchedCase.courtName || 'Court',
      purpose: h.purpose_of_hearing || h.process || h.hearing_process || 'Hearing',
      hearingDate: (h.hearing_date || h.next_hearing_date || '').slice(0, 10),
      rawCase: matchedCase
    };
  });

  // Filter Today
  const todayItems = enrichedHearings.filter(h => h.hearingDate === todayStr);

  // Filter Tomorrow to Next 7 Days
  const upcomingItems = enrichedHearings.filter(h => {
    if (!h.hearingDate || h.hearingDate === todayStr) return false;
    const hDate = new Date(h.hearingDate);
    hDate.setHours(0, 0, 0, 0);
    return hDate > now && hDate <= sevenDaysLater;
  }).sort((a, b) => a.hearingDate.localeCompare(b.hearingDate));

  // Render Today's List
  if (todayItems.length === 0) {
    todayContainer.innerHTML = `
      <div class="box has-text-centered is-shadowless placeholder-box">
        <span class="icon is-medium text-navy"><i class="fa-solid fa-scale-balanced fa-lg"></i></span>
        <p class="is-size-7 has-text-grey mt-1">No court listings scheduled for today (${formatDatePretty(todayStr)}).</p>
      </div>
    `;
  } else {
    todayContainer.innerHTML = todayItems.map(item => `
      <div class="hearing-widget-card today-card">
        <div class="card-top-bar">
          <span class="card-case-number">${escapeHtml(item.caseNumber)}</span>
          <span class="card-day-badge today">🔥 Listed Today</span>
        </div>
        <div class="card-party-title" title="${escapeHtml(item.caseName)}">
          ${escapeHtml(item.caseName)}
        </div>
        <div class="card-meta-row">
          <span class="card-court-tag" title="${escapeHtml(item.courtName)}">
            <i class="fa-solid fa-landmark mr-1"></i>${escapeHtml(item.courtName)}
          </span>
          <span class="card-purpose-tag">
            ${escapeHtml(item.purpose)}
          </span>
        </div>
      </div>
    `).join('');
  }

  // Render Upcoming Timeline
  if (upcomingItems.length === 0) {
    weekContainer.innerHTML = `
      <div class="box has-text-centered is-shadowless placeholder-box">
        <p class="is-size-7 has-text-grey">No upcoming hearings listed in the next 7 days.</p>
      </div>
    `;
  } else {
    weekContainer.innerHTML = upcomingItems.map(item => {
      let badgeClass = 'upcoming';
      let badgeText = formatDatePretty(item.hearingDate);

      if (item.hearingDate === tomorrowStr) {
        badgeClass = 'tomorrow';
        badgeText = '⚡ Tomorrow';
      }

      return `
        <div class="hearing-widget-card">
          <div class="card-top-bar">
            <span class="card-case-number">${escapeHtml(item.caseNumber)}</span>
            <span class="card-day-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-party-title" title="${escapeHtml(item.caseName)}">
            ${escapeHtml(item.caseName)}
          </div>
          <div class="card-meta-row">
            <span class="card-court-tag" title="${escapeHtml(item.courtName)}">
              <i class="fa-solid fa-landmark mr-1"></i>${escapeHtml(item.courtName)}
            </span>
            <span class="card-purpose-tag">
              ${escapeHtml(item.purpose)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ==============================================================================
// Interactive To-Dos Render & Management
// ==============================================================================
function filterWidgetTodos(filterType, btnEl) {
  widgetState.currentTodoFilter = filterType;
  document.querySelectorAll('.todo-chip').forEach(chip => {
    chip.classList.remove('is-active-chip', 'is-primary', 'is-light');
    chip.classList.add('is-light');
  });
  if (btnEl) {
    btnEl.classList.add('is-active-chip');
    btnEl.classList.remove('is-light');
  }
  renderWidgetTodos();
}
window.filterWidgetTodos = filterWidgetTodos;

function renderWidgetTodos() {
  const container = document.getElementById('widgetTodoListContainer');
  if (!container) return;

  let filtered = widgetState.todos;
  if (widgetState.currentTodoFilter === 'pending') {
    filtered = filtered.filter(t => !t.isCompleted && t.status !== 'completed');
  } else if (widgetState.currentTodoFilter === 'urgent') {
    filtered = filtered.filter(t => (!t.isCompleted && t.status !== 'completed') && String(t.priority).toLowerCase() === 'urgent');
  } else if (widgetState.currentTodoFilter === 'completed') {
    filtered = filtered.filter(t => t.isCompleted || t.status === 'completed');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="box has-text-centered is-shadowless placeholder-box">
        <p class="is-size-7 has-text-grey">No tasks found for "${widgetState.currentTodoFilter}" filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isDone = Boolean(t.isCompleted || t.status === 'completed');
    const priority = String(t.priority || 'medium').toLowerCase();
    const taskTitle = t.taskTitle || 'Task';
    const dueDate = t.dueDate ? formatDatePretty(t.dueDate) : '';

    return `
      <div class="todo-widget-card ${isDone ? 'completed' : ''}">
        <div class="todo-checkbox-container">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTodoStatus('${escapeHtml(t.id)}', this.checked)">
        </div>
        <div class="todo-content-col">
          <div class="todo-text-title">${escapeHtml(taskTitle)}</div>
          <div class="todo-meta-row">
            <span class="todo-priority-badge ${priority}">${priority}</span>
            ${dueDate ? `<span><i class="fa-regular fa-calendar mr-1"></i>${dueDate}</span>` : ''}
            ${t.caseNo ? `<span><i class="fa-regular fa-folder mr-1"></i>${escapeHtml(t.caseNo)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleTodoStatus(todoId, isCompleted) {
  try {
    if (!supabaseClient) return;

    const newStatus = isCompleted ? 'completed' : 'pending';

    // Update in Supabase case_todos table
    const { error } = await supabaseClient
      .from('case_todos')
      .update({
        status: newStatus
      })
      .eq('id', todoId);

    if (error) {
      // Try fallback to todos table
      await supabaseClient
        .from('todos')
        .update({
          is_completed: isCompleted,
          completed: isCompleted,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId);
    }

    // Update local state
    const localTodo = widgetState.todos.find(t => String(t.id) === String(todoId));
    if (localTodo) {
      localTodo.status = newStatus;
      localTodo.isCompleted = isCompleted;
    }

    renderWidgetKPIs();
    renderWidgetTodos();

    if (window.M && typeof window.M.toast === 'function') {
      window.M.toast({
        html: isCompleted ? '✅ Task completed!' : '⚡ Task marked pending',
        displayLength: 2000
      });
    }
  } catch (err) {
    console.error('Error toggling todo:', err);
    if (window.M && typeof window.M.toast === 'function') {
      window.M.toast({ html: '❌ Update failed: ' + (err.message || err), displayLength: 3000 });
    } else {
      alert(`Could not update task: ${err.message || err}`);
    }
    fetchAllWidgetData();
  }
}
window.toggleTodoStatus = toggleTodoStatus;

async function handleQuickAddTodo(event) {
  if (event && event.preventDefault) event.preventDefault();

  const titleInput = document.getElementById('quickTodoTitle');
  const prioritySelect = document.getElementById('quickTodoPriority');
  const dueDateInput = document.getElementById('quickTodoDueDate');

  const title = (titleInput?.value || '').trim();
  const priority = prioritySelect?.value || 'medium';
  const dueDate = dueDateInput?.value || null;

  if (!title) return false;

  try {
    if (!supabaseClient) throw new Error('Database client not ready');

    const newTodoPayload = {
      task_title: title,
      case_number: 'General Task',
      case_name: 'Advisory / Office Work',
      priority,
      deadline_date: dueDate,
      status: 'pending'
    };

    const { data, error } = await supabaseClient
      .from('case_todos')
      .insert([newTodoPayload])
      .select();

    if (error) {
      // Fallback to todos table
      await supabaseClient
        .from('todos')
        .insert([{
          title,
          task: title,
          priority,
          due_date: dueDate,
          is_completed: false,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
    }

    if (titleInput) titleInput.value = '';
    if (dueDateInput) dueDateInput.value = '';

    if (window.M && typeof window.M.toast === 'function') {
      window.M.toast({ html: '📝 New task added!', displayLength: 2000 });
    }

    await fetchAllWidgetData(false);
  } catch (err) {
    console.error('Quick Add Todo Error:', err);
    if (window.M && typeof window.M.toast === 'function') {
      window.M.toast({ html: '❌ Failed: ' + (err.message || err), displayLength: 3000 });
    } else {
      alert(`Failed to add task: ${err.message || err}`);
    }
  }

  return false;
}
window.handleQuickAddTodo = handleQuickAddTodo;

// ==============================================================================
// Quick Case Search
// ==============================================================================
function handleWidgetSearch(query) {
  const container = document.getElementById('widgetSearchResultsContainer');
  if (!container) return;

  const q = (query || '').trim().toLowerCase();
  if (!q) {
    container.innerHTML = `
      <div class="box has-text-centered is-shadowless placeholder-box">
        <span class="icon is-large text-navy"><i class="fa-solid fa-file-invoice fa-2x"></i></span>
        <p class="is-size-7 has-text-grey mt-2">Type any Case Number, Plaintiff, Defendant, or Court above to view details and next hearing dates.</p>
      </div>
    `;
    return;
  }

  const results = widgetState.cases.filter(c => {
    return (
      (c.caseNo || '').toLowerCase().includes(q) ||
      (c.caseName || '').toLowerCase().includes(q) ||
      (c.courtName || '').toLowerCase().includes(q) ||
      (c.clientName || '').toLowerCase().includes(q)
    );
  });

  if (results.length === 0) {
    container.innerHTML = `
      <div class="box has-text-centered is-shadowless placeholder-box">
        <p class="is-size-7 has-text-grey">No matching cases found for "${escapeHtml(q)}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.slice(0, 15).map(c => `
    <div class="hearing-widget-card">
      <div class="card-top-bar">
        <span class="card-case-number">${escapeHtml(c.caseNo)}</span>
        <span class="card-day-badge ${c.nextHearing ? 'upcoming' : ''}">
          ${c.nextHearing ? '<i class="fa-regular fa-calendar mr-1"></i>' + formatDatePretty(c.nextHearing) : 'No Date Set'}
        </span>
      </div>
      <div class="card-party-title" title="${escapeHtml(c.caseName)}">
        ${escapeHtml(c.caseName)}
      </div>
      <div class="card-meta-row">
        <span class="card-court-tag" title="${escapeHtml(c.courtName)}">
          <i class="fa-solid fa-landmark mr-1"></i>${escapeHtml(c.courtName)}
        </span>
        <span class="card-purpose-tag">
          ${c.caseType === 'criminal' ? '<i class="fa-solid fa-shield-halved mr-1"></i>Criminal' : '<i class="fa-solid fa-scale-balanced mr-1"></i>Civil'}
        </span>
      </div>
    </div>
  `).join('');
}
window.handleWidgetSearch = handleWidgetSearch;

// ==============================================================================
// Windows Desktop Notifications
// ==============================================================================
function requestDesktopNotificationPermission() {
  if (!('Notification' in window)) {
    alert('This browser environment does not support desktop notifications.');
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification('⚖️ Case Tracker Notifications Enabled', {
        body: 'You will receive desktop alerts for today’s court listings and urgent reminders.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      });
    } else {
      alert('Notification permission was not granted.');
    }
  });
}
window.requestDesktopNotificationPermission = requestDesktopNotificationPermission;

function checkAndSendDesktopNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const todayStr = getTodayIsoDate();
  const todayListings = widgetState.hearings.filter(h => {
    return (h.hearing_date || h.next_hearing_date || '').slice(0, 10) === todayStr;
  });

  if (todayListings.length > 0) {
    new Notification(`🏛️ Today's Court Alert: ${todayListings.length} Case(s) Listed`, {
      body: `You have ${todayListings.length} hearing(s) listed for today. Check your daily cause list.`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    });
  }
}

// ==============================================================================
// Helpers
// ==============================================================================
function formatDatePretty(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = String(dateStr).slice(0, 10).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
