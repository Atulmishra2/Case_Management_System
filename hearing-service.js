/**
 * HearingService — Hearing management operations
 */

import { formatDateDMY, escapeHtml } from './case-service.js';

class HearingService {
  constructor(dbService, caseService) {
    this.db = dbService;
    this.cases = caseService;
  }

  getCaseHearingHistory(caseNumber) {
    if (!caseNumber) return [];
    const normalized = caseNumber.trim().toLowerCase();
    const list = this.cases.hearings.filter(h => 
      (h.case_number || '').trim().toLowerCase() === normalized
    );

    return list.sort((a, b) => {
      const da = new Date(a.hearing_date || a.created_at);
      const db = new Date(b.hearing_date || b.created_at);
      return db - da;
    });
  }

  async updateHearing(caseNumber, hearingDate, process, actionTaken = '') {
    const matchedCase = this.cases.getCaseByNumber(caseNumber);
    const caseType = matchedCase?.caseType || 'civil';
    const resolvedAction = actionTaken && actionTaken.trim() 
      ? actionTaken.trim() 
      : `Scheduled stage: ${process}`;

    const hearingPayload = {
      case_number: caseNumber,
      case_type: caseType,
      hearing_date: hearingDate,
      process: process,
      action_taken: resolvedAction
    };

    // Try Supabase
    const supabaseSuccess = await this.db.updateHearing(
      caseNumber, hearingDate, process, resolvedAction
    );

    if (!supabaseSuccess) {
      console.warn('Hearing update failed in Supabase, saving locally only');
    }

    // Update local hearings record
    const existingLocalIdx = this.cases.hearings.findIndex(h =>
      (h.case_number || '').toLowerCase() === caseNumber.toLowerCase() &&
      h.hearing_date === hearingDate
    );

    if (existingLocalIdx !== -1) {
      this.cases.hearings[existingLocalIdx].process = process;
      this.cases.hearings[existingLocalIdx].action_taken = resolvedAction;
      this.cases.hearings[existingLocalIdx].case_type = caseType;
    } else {
      this.cases.hearings.unshift({
        ...hearingPayload,
        created_at: new Date().toISOString()
      });
    }

    window.allHearingRecords = this.cases.hearings;

    // Update in-memory case record
    if (matchedCase) {
      if (matchedCase.nextHearing && matchedCase.nextHearing !== '—' && matchedCase.nextHearing !== hearingDate) {
        matchedCase.previousHearing = matchedCase.nextHearing;
        matchedCase.previousProcess = matchedCase.hearingProcess || '—';
      }
      matchedCase.nextHearing = hearingDate;
      matchedCase.hearingProcess = process;
    }

    return true;
  }

  setHearingDateOffset(daysOffset) {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const dateInput = document.getElementById('hearingDate');
    if (dateInput) {
      dateInput.value = isoDate;
      this.updateHearingLivePreview();
    }
  }

  setHearingStagePreset(stageText) {
    const processInput = document.getElementById('hearingProcess');
    if (processInput) {
      processInput.value = stageText;
      this.updateHearingLivePreview();
    }
  }

  updateHearingLivePreview() {
    const dateInput = document.getElementById('hearingDate');
    const processInput = document.getElementById('hearingProcess');
    const dateVal = dateInput ? dateInput.value : '';
    const processVal = processInput ? processInput.value.trim() : '';

    const nextDateDisplay = document.getElementById('hearingNextDateDisplay');
    const nextProcessDisplay = document.getElementById('hearingNextProcessDisplay');
    const nextDayNameDisplay = document.getElementById('hearingNextDayNameDisplay');
    const intervalDisplay = document.getElementById('hearingIntervalDisplay');
    const dateReadableInput = document.getElementById('hearingDateReadable');

    if (nextProcessDisplay) {
      nextProcessDisplay.textContent = processVal || '— (Specify Stage)';
    }

    if (!dateVal) {
      if (nextDateDisplay) nextDateDisplay.textContent = 'Select Date Below';
      if (nextDayNameDisplay) nextDayNameDisplay.textContent = 'Choose date below';
      if (intervalDisplay) intervalDisplay.textContent = '—';
      if (dateReadableInput) dateReadableInput.value = '—';
      return;
    }

    const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)', 
                        'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)', 
                        'Saturday (शनिवार)'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parts = dateVal.split('-');
    const selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = daysOfWeek[selectedDate.getDay()];
    const formattedReadable = `${parts[2]} ${months[selectedDate.getMonth()]} ${parts[0]} (${dayName.split(' ')[0]})`;

    if (dateReadableInput) dateReadableInput.value = formattedReadable;
    if (nextDateDisplay) nextDateDisplay.textContent = formatDateDMY(dateVal);
    if (nextDayNameDisplay) nextDayNameDisplay.textContent = dayName;

    // Calculate day difference from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (intervalDisplay) {
      if (diffDays === 0) {
        intervalDisplay.innerHTML = '<i class="fa-solid fa-bullseye"></i> Today';
      } else if (diffDays === 1) {
        intervalDisplay.innerHTML = '<i class="fa-solid fa-bolt"></i> Tomorrow';
      } else if (diffDays > 1) {
        intervalDisplay.innerHTML = `<i class="fa-solid fa-calendar"></i> In ${diffDays} Days (+${Math.round(diffDays / 7)} Wks)`;
      } else {
        intervalDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Past Date (${Math.abs(diffDays)} Days ago)`;
      }
    }
  }

  populateHearingCaseDropdown(selectedCaseNoToInclude = '') {
    const select = document.getElementById('hearingCaseSelect');
    if (!select) return;

    const currentVal = selectedCaseNoToInclude || select.value || '';

    // Separate into undated and active dated cases
    const undatedCases = [];
    const datedCases = [];

    this.cases.cases.forEach(c => {
      const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
      if (isDisposed) return;
      const isDated = c.nextHearing && c.nextHearing !== '—' && c.nextHearing !== 'null' && c.nextHearing.trim() !== '';
      if (isDated) {
        datedCases.push(c);
      } else {
        undatedCases.push(c);
      }
    });

    const sortFn = (a, b) => {
      const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
      const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
      return numA.localeCompare(numB);
    };
    undatedCases.sort(sortFn);
    datedCases.sort(sortFn);

    let html = `<option value="">-- Choose Case (${this.cases.cases.length} Total) --</option>`;

    if (undatedCases.length > 0) {
      html += `<optgroup label="Undated Cases (${undatedCases.length})">`;
      undatedCases.forEach(c => {
        const caseNum = c.caseNo || c.criminalCaseNumber || '';
        const caseName = c.caseName || 
          (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
          (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
        const caseType = (c.caseType || 'civil').toUpperCase();
        html += `<option value="${escapeHtml(caseNum)}"> ${escapeHtml(caseNum)} — ${escapeHtml(caseName)} [${caseType}]</option>`;
      });
      html += `</optgroup>`;
    }

    if (datedCases.length > 0) {
      html += `<optgroup label="Active Cases (${datedCases.length})">`;
      datedCases.forEach(c => {
        const caseNum = c.caseNo || c.criminalCaseNumber || '';
        const caseName = c.caseName || 
          (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
          (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
        const caseType = (c.caseType || 'civil').toUpperCase();
        const curDateStr = formatDateDMY(c.nextHearing);
        html += `<option value="${escapeHtml(caseNum)}"> ${escapeHtml(caseNum)} — ${escapeHtml(caseName)} [${caseType}] (Current: ${curDateStr})</option>`;
      });
      html += `</optgroup>`;
    }

    select.innerHTML = html;
    if (currentVal) select.value = currentVal;
  }

  renderHearingCaseInfo(caseNo) {
    const query = (caseNo || '').trim().toLowerCase();

    const setDisplayVal = (elId, val) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if ('value' in el && el.tagName === 'INPUT') {
        el.value = val || '—';
      } else {
        el.textContent = val || '—';
      }
    };

    const elBadge = document.getElementById('hearingInfoBadge');
    const clientTag = document.getElementById('hearingCaseClientTag');
    const prevDateDisp = document.getElementById('hearingInfoPrevDateDisplay');

    if (!query) {
      setDisplayVal('hearingInfoCaseName', '—');
      setDisplayVal('hearingInfoCourt', '—');
      setDisplayVal('hearingInfoPrevDate', '—');
      setDisplayVal('hearingInfoPrevProcess', '—');
      if (prevDateDisp) prevDateDisp.textContent = '—';
      if (clientTag) clientTag.textContent = 'Client: —';
      if (elBadge) elBadge.style.display = 'none';
      this.updateHearingLivePreview();
      return;
    }

    const found = this.cases.getCaseByNumber(caseNo);

    if (!found) {
      setDisplayVal('hearingInfoCaseName', '— (Case not found)');
      setDisplayVal('hearingInfoCourt', '—');
      setDisplayVal('hearingInfoPrevDate', '—');
      setDisplayVal('hearingInfoPrevProcess', '—');
      if (prevDateDisp) prevDateDisp.textContent = 'Case Not Found';
      if (clientTag) clientTag.textContent = 'Client: —';
      if (elBadge) elBadge.style.display = 'none';
      this.updateHearingLivePreview();
      return;
    }

    const caseName = found.caseName || 
      (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : 
      (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'));
    const courtName = found.courtName || found.criminalCourtName || 'District Court';
    const caseType = (found.caseType || 'civil').toUpperCase();
    const clientName = found.clientName || found.criminalClientName || 'Client';
    const clientNumber = found.clientNumber || found.criminalClientNumber || '';

    const caseHistory = this.getCaseHearingHistory(found.caseNo || found.criminalCaseNumber || '');
    const currentNext = (found.nextHearing && found.nextHearing !== '—') ? found.nextHearing : null;

    const prevHearings = caseHistory.filter(h => {
      if (currentNext && h.hearing_date === currentNext) return false;
      return true;
    });
    const latestPrev = prevHearings[0];
    const prevDateRaw = latestPrev 
      ? latestPrev.hearing_date 
      : (found.previousHearing && found.previousHearing !== '—' ? found.previousHearing : null);
    const prevDate = prevDateRaw 
      ? formatDateDMY(prevDateRaw) 
      : (currentNext ? `${formatDateDMY(currentNext)} (Current)` : '— (First Hearing)');
    const prevProcess = latestPrev 
      ? (latestPrev.process || '—') 
      : (found.previousProcess || found.hearingProcess || '—');

    setDisplayVal('hearingInfoCaseName', caseName);
    setDisplayVal('hearingInfoCourt', courtName);
    setDisplayVal('hearingInfoPrevDate', prevDate);
    setDisplayVal('hearingInfoPrevProcess', prevProcess);

    if (prevDateDisp) {
      prevDateDisp.textContent = prevDateRaw 
        ? formatDateDMY(prevDateRaw) 
        : (currentNext ? formatDateDMY(currentNext) : 'First Hearing');
    }

    if (clientTag) {
      clientTag.textContent = `Client: ${clientName} ${clientNumber ? '(' + clientNumber + ')' : ''}`;
    }

    const processInput = document.getElementById('hearingProcess');
    if (processInput && !processInput.value && found.hearingProcess) {
      processInput.value = found.hearingProcess;
    }

    window._editingPrevHearingCaseNo = found.caseNo || found.criminalCaseNumber || '';
    window._editingPrevHearingRecord = latestPrev || null;

    // Reset edit mode
    const editEl = document.getElementById('hearingInfoPrevDateEdit');
    const saveBtn = document.getElementById('savePrevDateBtn');
    const editBtn = document.getElementById('editPrevDateBtn');
    const dispEl = document.getElementById('hearingInfoPrevDate');
    
    if (editEl) editEl.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) {
      editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
      editBtn.title = 'Edit previous date';
    }
    if (dispEl) dispEl.style.display = '';

    if (elBadge) {
      elBadge.style.display = 'inline-block';
      elBadge.textContent = caseType;
      elBadge.className = `case-badge ${(found.caseType || 'civil').toLowerCase()}`;
    }

    this.updateHearingLivePreview();
  }

  toggleEditPrevDate() {
    const displayEl = document.getElementById('hearingInfoPrevDate');
    const editEl = document.getElementById('hearingInfoPrevDateEdit');
    const editBtn = document.getElementById('editPrevDateBtn');
    const saveBtn = document.getElementById('savePrevDateBtn');
    if (!displayEl || !editEl) return;

    const isEditing = editEl.style.display !== 'none';

    if (isEditing) {
      editEl.style.display = 'none';
      displayEl.style.display = '';
      if (saveBtn) saveBtn.style.display = 'none';
      if (editBtn) {
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
        editBtn.title = 'Edit previous date';
      }
    } else {
      const rawDate = window._editingPrevHearingRecord 
        ? (window._editingPrevHearingRecord.hearing_date || '') 
        : '';
      editEl.value = rawDate;
      editEl.style.display = '';
      displayEl.style.display = 'none';
      if (saveBtn) saveBtn.style.display = '';
      if (editBtn) {
        editBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        editBtn.title = 'Cancel edit';
      }
    }
  }

  async savePrevDateEdit() {
    const editEl = document.getElementById('hearingInfoPrevDateEdit');
    const displayEl = document.getElementById('hearingInfoPrevDate');
    const editBtn = document.getElementById('editPrevDateBtn');
    const saveBtn = document.getElementById('savePrevDateBtn');
    const caseNoEl = document.getElementById('hearingCaseNo');

    if (!editEl || !editEl.value) {
      this.ui.showToastNotification('Please select a valid date first.', 2200, 'warning');
      return;
    }

    const newDate = editEl.value;
    const caseNo = caseNoEl ? caseNoEl.value.trim() : (window._editingPrevHearingCaseNo || '');

    if (!caseNo) {
      this.ui.showToastNotification('No case selected. Please load a case first.', 2200, 'warning');
      return;
    }

    // Update in Supabase
    const record = window._editingPrevHearingRecord;
    if (record && record.id) {
      const client = this.db.ensureClient();
      if (client) {
        try {
          const { error } = await client
            .from('hearings')
            .update({ hearing_date: newDate })
            .eq('id', record.id);
          if (error) console.error('Supabase prev date update error:', error);
        } catch (e) {
          console.error('Supabase prev date update exception:', e);
        }
      }
    }

    // Update local records
    if (record) {
      record.hearing_date = newDate;
    }

    const formatted = formatDateDMY(newDate);
    if (displayEl) {
      displayEl.value = formatted;
      displayEl.textContent = formatted;
    }

    // Return to read-only mode
    if (editEl) editEl.style.display = 'none';
    if (displayEl) displayEl.style.display = '';
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) {
      editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
      editBtn.title = 'Edit previous date';
    }

    this.ui.showToastNotification(`Previous date updated to ${formatted}`, 2500, 'success');
  }

  renderUpcomingWeekHearings() {
    const container = document.getElementById('upcomingWeekContainer');
    if (!container) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    const weekAheadStr = weekAhead.toISOString().split('T')[0];

    const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)',
                        'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)',
                        'Saturday (शनिवार)'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    // Build 7-day cards
    let html = '';
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const dayName = daysOfWeek[dayDate.getDay()];
      const dateFormatted = `${dayName.split(' ')[0]}, ${dayDate.getDate()} ${months[dayDate.getMonth()]}`;

      const dayCases = this.cases.cases.filter(c => {
        if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
        return c.nextHearing === dateStr;
      });

      const isToday = dateStr === todayStr;

      html += `
        <div class="upcoming-day-card ${isToday ? 'today' : ''}">
          <div class="upcoming-date-badge">
            <i class="fa-solid fa-calendar"></i> ${dateFormatted}
          </div>
          ${dayCases.length === 0 
            ? `<div class="upcoming-empty-day"><i class="fa-solid fa-check-circle"></i> No hearings</div>`
            : dayCases.map(c => `
              <div class="upcoming-case-item">
                <div class="upcoming-case-header">
                  <span class="case-badge ${(c.caseType || 'civil')}">${(c.caseType || 'Civil').toUpperCase()}</span>
                  <strong>${escapeHtml(c.caseNo || c.criminalCaseNumber || '—')}</strong>
                </div>
                <div class="upcoming-case-title">${escapeHtml(c.caseName || '—')}</div>
                <div class="upcoming-case-meta">
                  <div><i class="fa-solid fa-landmark"></i> ${escapeHtml(c.courtName || c.criminalCourtName || '—')}</div>
                  <div><i class="fa-solid fa-user"></i> ${escapeHtml(c.clientName || c.criminalClientName || '—')}</div>
                  ${c.clientNumber || c.criminalClientNumber 
                    ? `<div><i class="fa-solid fa-phone"></i> ${escapeHtml(c.clientNumber || c.criminalClientNumber || '')}</div>` 
                    : ''}
                </div>
                <div class="upcoming-case-actions">
                  <button type="button" class="btn btn-sm btn-outline" onclick="openCaseHistoryModalByNo('${escapeHtml(c.caseNo || c.criminalCaseNumber || '')}')"><i class="fa-solid fa-history"></i> Details</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="sendWhatsAppHearingNotice('${escapeHtml(c.caseNo || c.criminalCaseNumber || '')}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    }

    container.innerHTML = html;

    const navBadge = document.getElementById('upcomingNavCount');
    if (navBadge) navBadge.textContent = String(this.cases.cases.filter(c => {
      if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
      return c.nextHearing >= todayStr && c.nextHearing <= weekAheadStr;
    }).length);
  }

  sendWhatsAppHearingNotice(caseObj) {
    if (!caseObj) return;
    
    const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || 'Unknown Case';
    const caseTitle = caseObj.caseName || 
      (caseObj.plaintiff ? `${caseObj.plaintiff} vs ${caseObj.defendant}` : 
      (caseObj.victimName ? `${caseObj.victimName} vs ${caseObj.accusedName}` : caseNumber));
    const courtName = caseObj.courtName || caseObj.criminalCourtName || '';
    const nextHearing = caseObj.nextHearing;
    const process = caseObj.hearingProcess || '';
    const clientName = caseObj.clientName || caseObj.criminalClientName || '';
    const clientPhone = caseObj.clientNumber || caseObj.criminalClientNumber || '';
    const today = new Date();
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

    let formattedDate = 'Not Scheduled';
    let readableDate = '';
    if (nextHearing && nextHearing !== '—' && nextHearing !== 'null') {
      const parts = nextHearing.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        readableDate = `${parts[2]} ${months[d.getMonth()]} ${parts[0]} (${days[d.getDay()]})`;
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    let msg = `*CHAMBERS OF ATUL KUMAR MISHRA*\n`;
    msg += `*COURT DATE REMINDER*\n`;
    msg += `*Date:* ${readableDate}\n`;
    msg += `*Case No:* ${caseNumber}\n`;
    msg += `*Case Title:* ${caseTitle}\n`;
    msg += `*Court:* ${courtName}\n`;
    msg += `*Stage:* ${process || 'To be listed'}\n`;
    if (clientPhone) {
      msg += `*Contact:* ${clientPhone}\n`;
    }
    msg += `\n_Respectfully,\nAtul Kumar Mishra_\nAdvocate`;

    const phone = clientPhone ? clientPhone.replace(/\D/g, '') : '';
    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    
    window.open(waUrl, '_blank');
  }

  openUpdateHearingForCase(caseNo) {
    // This will be called by the UI service
    return { caseNo, render: () => {
      const app = window.app;
      if (app) {
        app.showTab('hearing');
        this.populateHearingCaseDropdown(caseNo);
        const caseInput = document.getElementById('hearingCaseNo');
        if (caseInput) caseInput.value = caseNo;
        this.renderHearingCaseInfo(caseNo);
        setTimeout(() => {
          const dateInput = document.getElementById('hearingDate');
          if (dateInput) dateInput.focus();
        }, 100);
      }
    }};
  }
}

export { HearingService };