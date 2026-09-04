/**
 * CalendarService — Calendar and scheduling operations
 */

import { formatDateDMY, escapeHtml } from './case-service.js';

class CalendarService {
  constructor(caseService) {
    this.cases = caseService;
    this.currentMonth = new Date();
    this.currentDate = new Date();
  }

  renderCalendarView() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hindiDays = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

    let html = `
      <div class="calendar-header-bar">
        <button type="button" class="btn btn-icon btn-sm" onclick="calendarService.previousMonth()">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <h3 class="calendar-title">${months[month]} ${year}</h3>
        <button type="button" class="btn btn-icon btn-sm" onclick="calendarService.nextMonth()">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div class="calendar-table-wrapper">
        <table class="calendar-table">
          <thead>
            <tr>
              ${daysOfWeek.map((day, i) => `
                <th class="calendar-day-header">${day.substring(0, 3)}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    const todayStr = this.currentDate.toISOString().split('T')[0];
    let date = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      html += '<tr>';
      for (let day = 0; day < 7; day++) {
        const dateStr = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dateStr === todayStr;
        
        const dayCases = this.cases.cases.filter(c => 
          c.nextHearing === dateStr
        );

        const hasCases = dayCases.length > 0;
        
        html += `
          <td class="calendar-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}">
            <button type="button" class="calendar-date-btn" onclick="calendarService.selectDate('${dateStr}')">
              ${date.getDate()}
            </button>
            ${hasCases ? `
              <div class="calendar-hearings">
                ${dayCases.slice(0, 2).map(c => `
                  <div class="calendar-hearing-item" title="${escapeHtml(c.caseName || 'Case')}">
                    <span class="case-badge ${(c.caseType || 'civil')} calendar-badge">${escapeHtml((c.caseNo || '').substring(0, 8))}</span>
                  </div>
                `).join('')}
                ${dayCases.length > 2 ? `<small>+${dayCases.length - 2} more</small>` : ''}
              </div>
            ` : ''}
          </td>
        `;

        date.setDate(date.getDate() + 1);
      }
      html += '</tr>';
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  previousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.renderCalendarView();
  }

  nextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.renderCalendarView();
  }

  selectDate(dateStr) {
    const caseList = this.cases.cases.filter(c => 
      c.nextHearing === dateStr
    );

    if (caseList.length === 0) {
      const d = new Date(dateStr);
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      alert(`No hearings scheduled for ${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}.`);
      return;
    }

    // Show hearings for this date
    const tbody = document.getElementById('causeListTableBody');
    const bannerDateText = document.getElementById('causeListBannerDateText');
    const bannerDayName = document.getElementById('causeListBannerDayName');
    
    if (bannerDateText) {
      const d = new Date(dateStr);
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)',
                          'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)',
                          'Saturday (शनिवार)'];
      bannerDateText.textContent = `Hearings for ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      bannerDayName.textContent = daysOfWeek[d.getDay()];
    }

    // Populate cause list table with selected date's cases
    let tableHtml = '';
    caseList.forEach((c, idx) => {
      const caseNumber = c.caseNo || c.criminalCaseNumber || '—';
      const caseName = c.caseName || 
        (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
        (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
      const courtName = c.courtName || c.criminalCourtName || 'District Court';
      const caseType = (c.caseType || 'civil').toLowerCase();
      const stage = c.hearingProcess || 'Scheduled Hearing';
      const clientName = c.clientName || c.criminalClientName || '';
      const clientPhone = c.clientNumber || c.criminalClientNumber || '';

      tableHtml += `
        <tr>
          <td style="text-align: center;"><span class="court-index-badge">#${idx + 1}</span></td>
          <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
          <td><strong>${escapeHtml(caseName)}</strong></td>
          <td><span class="case-badge ${caseType}">${caseType.toUpperCase()}</span></td>
          <td><i class="fa-solid fa-landmark"></i> ${escapeHtml(courtName)}</td>
          <td><span style="font-weight:600; color:#1e40af;">${escapeHtml(stage)}</span></td>
          <td>
            <div>${escapeHtml(clientName)}</div>
            ${clientPhone ? `<small style="color:#64748b;"><i class="fa-solid fa-phone"></i> ${escapeHtml(clientPhone)}</small>` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')"><i class="fa-solid fa-history"></i> Details</button>
            <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')"><i class="fa-solid fa-calendar-plus"></i> Forward</button>
            <button type="button" class="whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="Send WhatsApp notice"><i class="fa-brands fa-whatsapp"></i></button>
          </td>
        </tr>
      `;
    });

    if (tbody) tbody.innerHTML = tableHtml;
  }
}

export { CalendarService };