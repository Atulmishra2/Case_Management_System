/**
 * UIService — UI rendering and DOM manipulation
 */

import { formatDateDMY, escapeHtml, getSafeValue } from './case-service.js';

class UIService {
  constructor(caseService, taskService, hearingService) {
    this.cases = caseService;
    this.tasks = taskService;
    this.hearings = hearingService;
  }

  // Toast notifications
  showToastNotification(message, duration = 2200, type = 'info') {
    let toast = document.getElementById('cmGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cmGlobalToast';
      toast.className = 'cm-toast';
      document.body.appendChild(toast);
    }
    
    toast.className = `cm-toast toast-${type}`;
    
    // Add icon based on type
    let icon = '';
    let iconClass = '';
    switch (type) {
      case 'success': icon = '<i class="fa-solid fa-circle-check"></i>'; break;
      case 'error': icon = '<i class="fa-solid fa-circle-exclamation"></i>'; break;
      case 'warning': icon = '<i class="fa-solid fa-triangle-exclamation"></i>'; break;
      case 'info': icon = '<i class="fa-solid fa-info-circle"></i>'; break;
    }

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    toast.classList.add('show');

    if (toast.__timeout) clearTimeout(toast.__timeout);
    toast.__timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  renderGuestTable(searchText = '') {
    const tbody = document.querySelector('#guestCasesTable tbody');
    if (!tbody) return;

    const query = searchText.trim().toLowerCase();

    if (!query) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-results">
        <i class="fa-solid fa-lock"></i>
        <strong>Private Client Portal:</strong> Please enter your Case Number or Mobile Number above to securely view your hearing schedule.
      </td></tr>`;
      this.renderGuestCaseDetails(null);
      return;
    }

    const filtered = this.cases.cases.filter((item) => {
      const haystack = [
        item.caseNo, item.criminalCaseNumber,
        item.clientNumber, item.criminalClientNumber,
        item.caseName, item.clientName, item.criminalClientName,
        item.plaintiff, item.defendant,
        item.victimName, item.accusedName,
        item.courtName, item.partyName, item.remark
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-results">
        <i class="fa-solid fa-magnifying-glass"></i> No case found matching "${escapeHtml(searchText.trim())}". Please verify your Case Number or Mobile Number.
      </td></tr>`;
      this.renderGuestCaseDetails(null);
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = `clickable-row ${index === 0 ? 'selected-row' : ''}`;

      const caseNumber = item.caseNo || item.criminalCaseNumber || '—';
      const caseName = item.caseName || 
        (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : 
        (item.victimName ? `${item.victimName} vs ${item.accusedName}` : '—'));
      const client = item.clientName || item.criminalClientName || '—';
      const partyName = item.partyName || item.defendant || item.accusedName || item.plaintiff || '—';
      const nextHearing = formatDateDMY(item.nextHearing);

      tr.innerHTML = `
        <td><strong>${escapeHtml(caseNumber)}</strong></td>
        <td>${escapeHtml(caseName)}</td>
        <td>${escapeHtml(client)}</td>
        <td>${escapeHtml(partyName)}</td>
        <td><strong>${nextHearing}</strong></td>
        <td style="text-align: center;">
          <button type="button" class="table-view-btn"><i class="fa-solid fa-eye"></i> View</button>
        </td>
      `;

      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
        tr.classList.add('selected-row');
        this.renderGuestCaseDetails(item);
      });

      tbody.appendChild(tr);
    });

    this.renderGuestCaseDetails(filtered[0]);
  }

  renderGuestCaseDetails(caseObj) {
    const emptyBox = document.getElementById('guestCaseDetailsEmpty');
    const contentBox = document.getElementById('guestCaseDetailsContent');
    const badge = document.getElementById('guestCaseTypeBadge');

    if (!caseObj) {
      if (emptyBox) emptyBox.classList.remove('hidden');
      if (contentBox) contentBox.classList.add('hidden');
      if (badge) {
        badge.textContent = 'Select a Case';
        badge.className = 'case-badge';
      }
      return;
    }

    if (emptyBox) emptyBox.classList.add('hidden');
    if (contentBox) contentBox.classList.remove('hidden');

    const caseType = (caseObj.caseType || 'civil').toLowerCase();
    if (badge) {
      badge.textContent = caseType.toUpperCase();
      badge.className = `case-badge ${caseType}`;
    }

    const setVal = (id, val, fallback = '—') => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || fallback;
    };

    setVal('gDetailCaseNo', caseObj.caseNo || caseObj.criminalCaseNumber);
    setVal('gDetailCaseYear', caseObj.caseYear || caseObj.crimeYear || '2026');
    setVal('gDetailCaseType', (caseObj.caseType || 'Civil').toUpperCase());
    setVal('gDetailCourtName', caseObj.courtName || caseObj.criminalCourtName);
    setVal('gDetailFilingDate', formatDateDMY(caseObj.filingDate || caseObj.crimeFilingDate));
    setVal('gDetailNextHearing', formatDateDMY(caseObj.nextHearing));
    setVal('gDetailCaseName', caseObj.caseName || 
      (caseObj.plaintiff ? `${caseObj.plaintiff} vs ${caseObj.defendant}` : 
      `${caseObj.victimName} vs ${caseObj.accusedName}`));
    setVal('gDetailClient', caseObj.clientName || caseObj.criminalClientName || caseObj.client);

    const gDocEl = document.getElementById('gDetailDocLink');
    if (gDocEl) {
      if (caseObj.docLink && caseObj.docLink.trim()) {
        gDocEl.innerHTML = `<a href="${caseObj.docLink.trim()}" target="_blank" rel="noopener noreferrer" class="doc-link-pill">
          <i class="fa-solid fa-link"></i> Open Document
        </a>`;
      } else {
        gDocEl.textContent = '—';
      }
    }
  }

  renderHomeDashboard() {
    const greetingEl = document.getElementById('homeHeroGreeting');
    const dateEl = document.getElementById('homeHeroDate');

    const stats = this.cases.getStats();

    const totalEl = document.getElementById('homeTotalCases');
    const breakdownEl = document.getElementById('homePortfolioBreakdown');
    const todayEl = document.getElementById('homeTodayCases');
    const upcomingEl = document.getElementById('homeUpcomingCases');
    const pendingEl = document.getElementById('homePendingCases');
    const pendingPercentEl = document.getElementById('homePendingPercent');
    const undatedEl = document.getElementById('homeUndatedCases');
    const disposedEl = document.getElementById('homeDisposedCases');
    const disposedPercentEl = document.getElementById('homeDisposedPercent');

    const shortcutCivil = document.getElementById('shortcutCivilCount');
    const shortcutCriminal = document.getElementById('shortcutCriminalCount');
    const shortcutRevenue = document.getElementById('shortcutRevenueCount');

    const todayTbody = document.getElementById('homeTodayTableBody');
    const todayBoardDate = document.getElementById('homeTodayBoardDate');
    const tasksContainer = document.getElementById('homeTasksListContainer');

    // Dynamic Greeting
    const now = new Date();
    const hours = now.getHours();
    let timeGreeting = 'Good Day';
    if (hours < 12) timeGreeting = 'Good Morning';
    else if (hours < 17) timeGreeting = 'Good Afternoon';
    else timeGreeting = 'Good Evening';

    const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)', 
                        'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)', 
                        'Saturday (शनिवार)'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = daysOfWeek[now.getDay()];
    const formattedDate = `${dayName}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    if (greetingEl) greetingEl.textContent = `${timeGreeting}, Advocate Atul Mishra`;
    if (dateEl) dateEl.textContent = `${formattedDate} • Chambers Legal Practice Management`;
    if (todayBoardDate) todayBoardDate.textContent = `Appearances for ${dayName.split(' ')[0]}, ${now.getDate()} ${months[now.getMonth()]}`;

    // Update KPI Card Values
    if (totalEl) totalEl.textContent = String(stats.total);
    if (breakdownEl) {
      breakdownEl.innerHTML = `
        <div class="breakdown-col-left">
          <div class="breakdown-item"><span class="breakdown-bullet"></span>${stats.byType.civil} Civil</div>
          <div class="breakdown-item"><span class="breakdown-bullet"></span>${stats.byType.criminal} Criminal</div>
          <div class="breakdown-item"><span class="breakdown-bullet"></span>${stats.byType.revenue} Revenue</div>
        </div>
        <div class="breakdown-col-right">
          <span class="breakdown-bullet"></span>
          <span class="breakdown-bullet"></span>
          <span class="breakdown-bullet"></span>
        </div>
      `;
    }
    if (todayEl) todayEl.textContent = String(stats.today);
    if (upcomingEl) upcomingEl.textContent = String(stats.upcoming);
    if (pendingEl) pendingEl.textContent = String(stats.pending);
    if (pendingPercentEl) pendingPercentEl.textContent = `${stats.pendingPercent}% of total caseload`;
    if (undatedEl) undatedEl.textContent = String(stats.undated);
    if (disposedEl) disposedEl.textContent = String(stats.disposed);
    if (disposedPercentEl) disposedPercentEl.textContent = `${stats.disposedPercent}% Resolution Rate`;

    // Update shortcuts
    if (shortcutCivil) shortcutCivil.textContent = `${stats.byType.civil} Cases`;
    if (shortcutCriminal) shortcutCriminal.textContent = `${stats.byType.criminal} Cases`;
    if (shortcutRevenue) shortcutRevenue.textContent = `${stats.byType.revenue} Cases`;

    // Update Undated Cases Graph Card & Analytics
    const undatedCasesList = (this.cases.cases || []).filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !String(c.nextHearing).trim() || String(c.nextHearing).toLowerCase() === 'undated');
    const undatedTotal = undatedCasesList.length;
    const undatedCivil = undatedCasesList.filter(c => (c.caseType || 'civil').toLowerCase() === 'civil').length;
    const undatedCriminal = undatedCasesList.filter(c => (c.caseType || '').toLowerCase() === 'criminal').length;
    const undatedRevenue = undatedCasesList.filter(c => (c.caseType || '').toLowerCase() === 'revenue').length;

    const undatedCivilPct = undatedTotal > 0 ? Math.round((undatedCivil / undatedTotal) * 100) : 0;
    const undatedCriminalPct = undatedTotal > 0 ? Math.round((undatedCriminal / undatedTotal) * 100) : 0;
    const undatedRevenuePct = undatedTotal > 0 ? Math.max(0, 100 - undatedCivilPct - undatedCriminalPct) : 0;

    const undatedGraphTotalEl = document.getElementById('undatedGraphTotal');
    const undatedCivilCountEl = document.getElementById('undatedCivilCount');
    const undatedCriminalCountEl = document.getElementById('undatedCriminalCount');
    const undatedRevenueCountEl = document.getElementById('undatedRevenueCount');
    const undatedCivilBarEl = document.getElementById('undatedCivilBar');
    const undatedCriminalBarEl = document.getElementById('undatedCriminalBar');
    const undatedRevenueBarEl = document.getElementById('undatedRevenueBar');
    const undatedFooterNoticeEl = document.getElementById('undatedFooterNotice');

    if (undatedGraphTotalEl) undatedGraphTotalEl.textContent = String(undatedTotal);
    if (undatedCivilCountEl) undatedCivilCountEl.textContent = `${undatedCivil} Cases (${undatedCivilPct}%)`;
    if (undatedCriminalCountEl) undatedCriminalCountEl.textContent = `${undatedCriminal} Cases (${undatedCriminalPct}%)`;
    if (undatedRevenueCountEl) undatedRevenueCountEl.textContent = `${undatedRevenue} Cases (${undatedRevenuePct}%)`;

    if (undatedCivilBarEl) undatedCivilBarEl.style.width = `${undatedCivilPct}%`;
    if (undatedCriminalBarEl) undatedCriminalBarEl.style.width = `${undatedCriminalPct}%`;
    if (undatedRevenueBarEl) undatedRevenueBarEl.style.width = `${undatedRevenuePct}%`;

    if (undatedFooterNoticeEl) {
      undatedFooterNoticeEl.textContent = undatedTotal === 0 
        ? '✅ All active cases have scheduled hearings' 
        : `⚡ ${undatedTotal} ${undatedTotal === 1 ? 'matter requires' : 'matters require'} hearing dates`;
    }

    const donutCircumference = 238.76;
    const segCivil = document.getElementById('donutSegmentCivil');
    const segCrim = document.getElementById('donutSegmentCriminal');
    const segRev = document.getElementById('donutSegmentRevenue');

    if (segCivil && segCrim && segRev) {
      if (undatedTotal === 0) {
        segCivil.style.strokeDasharray = `0 ${donutCircumference}`;
        segCrim.style.strokeDasharray = `0 ${donutCircumference}`;
        segRev.style.strokeDasharray = `0 ${donutCircumference}`;
      } else {
        const lenCivil = (undatedCivil / undatedTotal) * donutCircumference;
        const lenCrim = (undatedCriminal / undatedTotal) * donutCircumference;
        const lenRev = (undatedRevenue / undatedTotal) * donutCircumference;

        segCivil.style.strokeDasharray = `${lenCivil} ${donutCircumference - lenCivil}`;
        segCivil.style.strokeDashoffset = '0';

        segCrim.style.strokeDasharray = `${lenCrim} ${donutCircumference - lenCrim}`;
        segCrim.style.strokeDashoffset = `-${lenCivil}`;

        segRev.style.strokeDasharray = `${lenRev} ${donutCircumference - lenRev}`;
        segRev.style.strokeDashoffset = `-${lenCivil + lenCrim}`;
      }
    }

    // Populate today's court appearance board table
    if (todayTbody) {
      const todayStr = now.toISOString().split('T')[0];
      const todayCases = this.cases.cases.filter(c => {
        if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
        const str = String(c.nextHearing).trim();
        if (str === todayStr) return true;

        // Handle various date formats
        const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymd) {
          const formatted = `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}-${String(ymd[3]).padStart(2, '0')}`;
          return formatted === todayStr;
        }
        const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmy) {
          const formatted = `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
          return formatted === todayStr;
        }
        return false;
      });

      if (todayCases.length === 0) {
        todayTbody.innerHTML = `
          <tr><td colspan="7" class="no-results">
            <i class="fa-solid fa-calendar-xmark"></i> No court hearings listed for today (${dayName.split(' ')[0]}).
            <br><small style="color: #64748b; margin-top: 6px; display: inline-block;">
              <a href="javascript:void(0);" onclick="showTab('upcoming')" class="text-primary font-medium">
                <i class="fa-solid fa-arrow-right"></i> View upcoming week appearances
              </a>
            </small>
          </td></tr>
        `;
      } else {
        todayCases.sort((a, b) => {
          const courtA = (a.courtName || a.criminalCourtName || '').toUpperCase();
          const courtB = (b.courtName || b.criminalCourtName || '').toUpperCase();
          if (courtA !== courtB) return courtA.localeCompare(courtB);
          const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
          const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
          return numA.localeCompare(numB);
        });

        let html = '';
        todayCases.forEach((c, idx) => {
          const caseNumber = c.caseNo || c.criminalCaseNumber || '—';
          const caseName = c.caseName || 
            (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
            (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
          const courtName = c.courtName || c.criminalCourtName || 'District Court';
          const caseType = (c.caseType || 'civil').toLowerCase();
          const stage = c.hearingProcess || c.process || 'Listed Hearing';
          const clientName = c.clientName || c.criminalClientName || '—';
          const clientPhone = c.clientNumber || c.criminalClientNumber || '';

          html += `
            <tr>
              <td style="text-align: center;"><span class="court-index-badge">#${idx + 1}</span></td>
              <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
              <td>${escapeHtml(caseName)}</td>
              <td><span class="case-badge ${caseType}">${caseType.toUpperCase()}</span></td>
              <td><i class="fa-solid fa-landmark"></i> ${escapeHtml(courtName)}</td>
              <td><span style="font-weight:600; color:#1e40af;">${escapeHtml(stage)}</span></td>
              <td>
                <div>${escapeHtml(clientName)}</div>
                ${clientPhone ? `<small style="color:#64748b;"><i class="fa-solid fa-phone"></i> ${escapeHtml(clientPhone)}</small>` : ''}
              </td>
              <td style="white-space: nowrap; text-align: center;">
                <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View proceedings">
                  <i class="fa-solid fa-history"></i>
                </button>
                <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward next hearing">
                  <i class="fa-solid fa-calendar-plus"></i>
                </button>
                <button type="button" class="whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="WhatsApp notice">
                  <i class="fa-brands fa-whatsapp"></i>
                </button>
              </td>
            </tr>
          `;
        });
        todayTbody.innerHTML = html;
      }
    }

    // Populate priority tasks widget
    if (tasksContainer) {
      const pendingTasks = this.tasks.getPendingTasks();
      if (pendingTasks.length === 0) {
        tasksContainer.innerHTML = `
          <div class="home-empty-tasks">
            <div class="empty-icon"><i class="fa-solid fa-circle-check"></i></div>
            <p>All tasks and deadlines are up-to-date.</p>
            <button type="button" class="btn btn-primary" style="margin-top: 0.75rem;" onclick="showTab('todo')">
              <i class="fa-solid fa-plus"></i> Add New Task
            </button>
          </div>
        `;
      } else {
        let taskHtml = '';
        pendingTasks.slice(0, 5).forEach(t => {
          const isUrgent = (t.priority || '').toLowerCase() === 'high';
          const deadline = t.deadlineDate || t.deadline || '';
          const deadlineDate = deadline ? new Date(deadline) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = deadlineDate 
            ? Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24)) 
            : null;
          
          let priorityBadge = isUrgent
            ? '<span class="todo-deadline-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> URGENT</span>'
            : '<span class="todo-deadline-badge normal"><i class="fa-solid fa-tag"></i> TASK</span>';
          
          if (diffDays !== null && diffDays <= 1) {
            priorityBadge = `<span class="todo-deadline-badge ${diffDays < 0 ? 'overdue' : 'today'}">
              <i class="fa-solid ${diffDays < 0 ? 'fa-triangle-exclamation' : 'fa-bolt'}"></i> 
              ${diffDays < 0 ? 'Overdue' : 'Due Today'}
            </span>`;
          }

          taskHtml += `
            <div class="home-task-card">
              <div class="home-task-info">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  ${priorityBadge}
                  <span class="home-task-title">${escapeHtml(t.taskTitle || t.task || 'Legal Action')}</span>
                </div>
                <span class="home-task-meta">
                  <i class="fa-solid fa-folder"></i> Case: <strong>${escapeHtml(t.caseNo || 'General')}</strong> 
                  • <i class="fa-solid fa-calendar"></i> Due: ${deadlineDate ? formatDateDMY(deadline) : 'No deadline'}
                </span>
              </div>
              <button type="button" class="table-view-btn" onclick="showTab('todo')" title="Manage task">
                <i class="fa-solid fa-cog"></i>
              </button>
            </div>
          `;
        });
        tasksContainer.innerHTML = taskHtml;
      }
    }
  }

  // Render case details in search panel
  renderSelectedCaseDetails(caseObj) {
    const emptyBox = document.getElementById('searchCaseDetailsEmpty');
    const contentBox = document.getElementById('searchCaseDetailsContent');
    const badge = document.getElementById('searchCaseTypeBadge');

    if (!caseObj) {
      if (emptyBox) emptyBox.classList.remove('hidden');
      if (contentBox) contentBox.classList.add('hidden');
      const addTodoBtn = document.getElementById('searchAddTodoBtn');
      if (addTodoBtn) addTodoBtn.style.display = 'none';
      if (badge) {
        badge.textContent = 'Select a Case';
        badge.className = 'case-badge';
      }
      return;
    }

    if (emptyBox) emptyBox.classList.add('hidden');
    if (contentBox) contentBox.classList.remove('hidden');

    const caseType = (caseObj.caseType || 'civil').toLowerCase();
    if (badge) {
      badge.textContent = caseType.toUpperCase();
      badge.className = `case-badge ${caseType}`;
    }

    const setVal = (id, val, fallback = '—') => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || fallback;
    };

    const isCriminal = caseType === 'criminal' || caseType === 'state';

    setVal('detailCaseNo', caseObj.caseNo || caseObj.criminalCaseNumber);
    setVal('detailCaseYear', caseObj.caseYear || caseObj.crimeYear || '2026');
    setVal('detailCaseType', (caseObj.caseType || 'Civil').toUpperCase());
    setVal('detailCourtName', caseObj.courtName || caseObj.criminalCourtName);
    setVal('detailFilingDate', formatDateDMY(caseObj.filingDate || caseObj.crimeFilingDate));
    setVal('detailNextHearing', formatDateDMY(caseObj.nextHearing));
    setVal('detailClientName', caseObj.clientName || caseObj.criminalClientName);
    setVal('detailClientNumber', caseObj.clientNumber || caseObj.criminalClientNumber);

    // Determine previous hearing and processes
    const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || '';
    const caseHistory = this.hearings.getCaseHearingHistory(caseNumber);
    const currentNext = (caseObj.nextHearing && caseObj.nextHearing !== '—') ? caseObj.nextHearing : null;

    const prevHearings = caseHistory.filter(h => {
      if (currentNext && h.hearing_date === currentNext) return false;
      return true;
    });
    const latestPrev = prevHearings[0];
    const prevHearingDate = latestPrev 
      ? latestPrev.hearing_date 
      : (caseObj.previousHearing || null);
    const prevProcess = latestPrev 
      ? (latestPrev.process || '—') 
      : (caseObj.previousProcess || '—');

    setVal('detailHearingProcess', caseObj.hearingProcess || '—');
    setVal('detailPrevHearing', formatDateDMY(prevHearingDate));
    setVal('detailPrevProcess', prevProcess || '—');

    document.querySelectorAll('.general-detail').forEach(el => {
      el.classList.toggle('hidden', isCriminal);
    });
    document.querySelectorAll('.criminal-detail').forEach(el => {
      el.classList.toggle('hidden', !isCriminal);
    });

    if (isCriminal) {
      setVal('detailPoliceStation', caseObj.policeStation);
      setVal('detailCrimeSection', caseObj.crimeSection);
      setVal('detailCrimeNumber', caseObj.crimeNumber);
      setVal('detailVictimName', caseObj.victimName);
      setVal('detailAccusedName', caseObj.accusedName);
    } else {
      setVal('detailPlaintiff', caseObj.plaintiff);
      setVal('detailDefendant', caseObj.defendant);
    }

    const statusEl = document.getElementById('detailCaseStatus');
    if (statusEl) {
      const isDisposed = (caseObj.caseStatus || '').toLowerCase().includes('dispose');
      statusEl.innerHTML = isDisposed
        ? `<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed Off</span>`
        : `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
    setVal('detailCaseRemark', caseObj.remark || caseObj.remarks || '—');
    setVal('detailCaseDisposalComment', caseObj.disposalComment || caseObj.disposal_comment || '—');

    const docLinkEl = document.getElementById('detailCaseDocLink');
    if (docLinkEl) {
      if (caseObj.docLink && caseObj.docLink.trim()) {
        docLinkEl.innerHTML = `<a href="${caseObj.docLink.trim()}" target="_blank" rel="noopener noreferrer" class="doc-link-pill">
          <i class="fa-solid fa-link"></i> Open Document / Order Sheet
        </a>`;
      } else {
        docLinkEl.textContent = '—';
      }
    }

    window.currentSelectedCase = caseObj;

    const editBtn = document.getElementById('detailEditBtn');
    if (editBtn) {
      editBtn.onclick = () => {
        this.showTab('update');
        const searchInput = document.getElementById('updateSearchInput');
        if (searchInput) searchInput.value = caseObj.caseNo || caseObj.criminalCaseNumber || '';
        this.loadCaseForUpdate(caseObj.caseNo || caseObj.criminalCaseNumber);
      };
    }

    const hearingBtn = document.getElementById('detailHearingBtn');
    if (hearingBtn) {
      hearingBtn.onclick = () => {
        this.showTab('hearing');
        const caseNoInput = document.getElementById('hearingCaseNo');
        if (caseNoInput) caseNoInput.value = caseObj.caseNo || caseObj.criminalCaseNumber || '';
      };
    }

    const whatsappBtn = document.getElementById('detailWhatsAppBtn');
    if (whatsappBtn) {
      whatsappBtn.onclick = () => {
        this.hearings.sendWhatsAppHearingNotice(caseObj);
      };
    }

    const historyBtn = document.getElementById('detailHistoryBtn');
    if (historyBtn) {
      historyBtn.onclick = () => {
        this.openCaseHistoryModal(caseObj);
      };
    }

    const addTodoBtn = document.getElementById('searchAddTodoBtn');
    if (addTodoBtn) {
      addTodoBtn.style.display = 'inline-flex';
      addTodoBtn.onclick = () => {
        this.tasks.openAddTodoModal(caseObj.caseNo || caseObj.criminalCaseNumber || '');
      };
    }
  }

  openCaseHistoryModal(caseObj) {
    if (!caseObj) return;

    const modal = document.getElementById('caseHistoryModal');
    if (!modal) return;

    const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || '—';
    const caseName = caseObj.caseName || 
      (caseObj.plaintiff ? `${caseObj.plaintiff} vs ${caseObj.defendant}` : 
      (caseObj.victimName ? `${caseObj.victimName} vs ${caseObj.accusedName}` : '—'));
    const caseType = (caseObj.caseType || 'civil').toUpperCase();
    const courtName = caseObj.courtName || caseObj.criminalCourtName || '—';
    const nextHearing = formatDateDMY(caseObj.nextHearing);
    const nextProcess = caseObj.hearingProcess || '—';

    const modalCaseNo = document.getElementById('modalCaseNo');
    const modalCaseTitle = document.getElementById('modalCaseTitle');
    const modalCourtName = document.getElementById('modalCourtName');
    const modalNextHearingBadge = document.getElementById('modalNextHearingBadge');
    const tbody = document.getElementById('caseHistoryTableBody');
    const emptyBox = document.getElementById('caseHistoryEmpty');

    if (modalCaseNo) modalCaseNo.textContent = caseNumber;
    if (modalCaseTitle) modalCaseTitle.textContent = caseName;
    if (modalCourtName) modalCourtName.textContent = courtName;
    if (modalNextHearingBadge) {
      modalNextHearingBadge.textContent = nextHearing !== '—' 
        ? `${nextHearing} (${nextProcess})` 
        : 'Not Scheduled';
      modalNextHearingBadge.className = `case-badge ${(caseObj.caseType || 'civil').toLowerCase()}`;
    }

    // Retrieve hearings for this case
    const history = this.hearings.getCaseHearingHistory(caseNumber);
    const currentNext = (caseObj.nextHearing && caseObj.nextHearing !== '—') ? caseObj.nextHearing : null;

    // Build unified hearing events list
    const events = [];

    history.forEach(h => {
      const isNext = Boolean(currentNext && (h.hearing_date === currentNext || h.hearing_date === caseObj.nextHearing));
      events.push({
        date: h.hearing_date,
        process: h.process || '—',
        type: isNext ? 'next' : 'prev',
        action: h.action_taken || h.remarks || 'Court proceedings conducted.'
      });
    });

    if (currentNext && !events.some(e => e.date === currentNext)) {
      events.push({
        date: currentNext,
        process: caseObj.hearingProcess || 'Scheduled Hearing',
        type: 'next',
        action: `Next hearing at ${courtName}`
      });
    }

    if (caseObj.previousHearing && caseObj.previousHearing !== '—' && !events.some(e => e.date === caseObj.previousHearing)) {
      events.push({
        date: caseObj.previousHearing,
        process: caseObj.previousProcess || 'Previous Stage',
        type: 'prev',
        action: `Previous proceedings at ${courtName}`
      });
    }

    const filingDate = caseObj.filingDate || caseObj.crimeFilingDate;
    if (filingDate && filingDate !== '—') {
      events.push({
        date: filingDate,
        process: 'Case Inception & Filing',
        type: 'filing',
        action: `Case instituted at ${courtName}`
      });
    }

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (tbody) {
      if (events.length === 0) {
        tbody.innerHTML = '';
        if (emptyBox) emptyBox.classList.remove('hidden');
      } else {
        if (emptyBox) emptyBox.classList.add('hidden');
        tbody.innerHTML = events.map((ev, idx) => {
          let badgeHtml = '';
          if (ev.type === 'next') {
            badgeHtml = '<span class="history-badge-next"><i class="fa-solid fa-calendar-check"></i> Upcoming Hearing</span>';
          } else if (ev.type === 'filing') {
            badgeHtml = '<span class="history-badge-filing"><i class="fa-solid fa-file-import"></i> Initial Filing</span>';
          } else {
            badgeHtml = '<span class="history-badge-prev"><i class="fa-solid fa-history"></i> Previous Hearing</span>';
          }

          return `
            <tr>
              <td><strong>${idx + 1}</strong></td>
              <td><strong>${formatDateDMY(ev.date)}</strong></td>
              <td><strong>${escapeHtml(ev.process)}</strong></td>
              <td>${badgeHtml}</td>
              <td>${escapeHtml(ev.action)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const updateBtn = document.getElementById('modalUpdateHearingBtn');
    if (updateBtn) {
      updateBtn.onclick = () => {
        this.closeCaseHistoryModal();
        this.openUpdateHearingForCase(caseNumber);
      };
    }

    modal.classList.remove('hidden');
  }

  closeCaseHistoryModal() {
    const modal = document.getElementById('caseHistoryModal');
    if (modal) modal.classList.add('hidden');
  }

  openCaseHistoryModalByNo(caseNo) {
    if (!caseNo) return;
    const q = caseNo.trim().toLowerCase();
    const found = this.cases.getCaseByNumber(caseNo);
    if (found) {
      this.openCaseHistoryModal(found);
    } else {
      alert(`Case "${caseNo}" details could not be found.`);
    }
  }

  // Export functions
  exportAllCasesToCSV() {
    const cases = this.cases.getAll();
    if (!cases || cases.length === 0) {
      alert('No cases available to export.');
      return;
    }

    const headers = [
      'Sr No', 'Case Number', 'Year', 'Case Type', 'Case Name',
      'Court Name', 'Party Name', 'Client Name', 'Client Phone',
      'Filing Date', 'Next Hearing Date', 'Hearing Process',
      'Case Status', 'Remarks', 'Document Link'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.map(escapeCSV).join(',')];

    cases.forEach((c, idx) => {
      const caseNum = c.caseNo || c.criminalCaseNumber || '';
      const caseYear = c.caseYear || c.crimeYear || '';
      const caseType = (c.caseType || 'Civil').toUpperCase();
      const caseName = c.caseName || 
        (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
        (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
      const court = c.courtName || c.criminalCourtName || '';
      const party = c.partyName || c.defendant || c.accusedName || c.plaintiff || '';
      const client = c.clientName || c.criminalClientName || c.client || '';
      const clientPhone = c.clientNumber || c.criminalClientNumber || '';
      const filingDate = formatDateDMY(c.filingDate || c.crimeFilingDate);
      const nextHearing = formatDateDMY(c.nextHearing);
      const process = c.hearingProcess || '';
      const status = c.caseStatus || 'Pending';
      const remark = c.remark || c.remarks || '';
      const docLink = c.docLink || '';

      csvRows.push([
        idx + 1, caseNum, caseYear, caseType, caseName,
        court, party, client, clientPhone,
        filingDate, nextHearing, process,
        status, remark, docLink
      ].map(escapeCSV).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `casebook_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export { UIService };