/**
 * CaseService — Case management operations
 */

import { safeStorage } from './auth-service.js';

// Utility functions
function getSafeValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function formatDateDMY(dateInput) {
  if (!dateInput || dateInput === '—' || dateInput === 'null' || dateInput === 'undefined') {
    return '—';
  }

  const str = String(dateInput).trim();
  if (!str) return '—';

  const parts = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (parts) {
    const [, year, month, day] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(day).padStart(2, '0')}-${months[parseInt(month, 10) - 1]}-${year}`;
  }

  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(day).padStart(2, '0')}-${months[parseInt(month, 10) - 1]}-${year}`;
  }

  return str;
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class CaseService {
  constructor(dbService, uiService) {
    this.db = dbService;
    this.ui = uiService;
    this.cases = [];
    this.hearings = [];
    this.courts = [];
  }

  setCases(cases, hearings, courts) {
    this.cases = cases || [];
    this.hearings = hearings || [];
    this.courts = courts || [];
    window.allCaseRecords = this.cases;
    window.allHearingRecords = this.hearings;
    window.courts = this.courts;
    window.defaultCourts = this.courts;
  }

  getAll() {
    return this.cases;
  }

  getCaseByNumber(caseNo) {
    const q = (caseNo || '').trim().toLowerCase();
    return this.cases.find(c => {
      const num1 = (c.caseNo || c.case_number || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || c.criminal_case_number || '').toLowerCase();
      return num1 === q || num2 === q;
    });
  }

  getCaseType(caseType) {
    return (caseType || 'civil').toLowerCase();
  }

  async addCase(newCase) {
    // Check for duplicates
    const existing = this.getCaseByNumber(newCase.caseNo || newCase.criminalCaseNumber);
    if (existing) {
      alert(`Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
      return false;
    }

    // Try Supabase first
    const supabaseSuccess = await this.db.addCase(newCase);
    
    // Add to local records
    this.cases.unshift(newCase);
    window.allCaseRecords = this.cases;
    
    return true;
  }

  async updateCase(caseObj, updates) {
    const originalNo = caseObj.caseNo || caseObj.criminalCaseNumber || caseObj.case_number;
    const tableName = caseObj.caseType === 'civil' ? 'civilcases' : 'criminalcases';
    
    const newCaseNumber = updates.caseNo || originalNo;
    const caseYear = updates.caseYear || caseObj.caseYear;
    const filingDate = updates.filingDate || caseObj.filingDate;

    // Prepare payload with all fields
    const payload = {
      ...updates,
      case_number: newCaseNumber
    };

    // Try Supabase
    const supabaseSuccess = await this.db.updateCase(tableName, payload, originalNo);

    // Update local records
    const idx = this.cases.findIndex(c => 
      (c.caseNo || c.case_number) === originalNo || 
      (c.criminalCaseNumber || c.criminal_case_number) === originalNo
    );
    
    if (idx !== -1) {
      this.cases[idx] = { ...this.cases[idx], ...updates, caseNo: newCaseNumber };
    }

    // Cascade case number change to hearings
    if (originalNo.toLowerCase() !== newCaseNumber.toLowerCase()) {
      this.hearings.forEach(h => {
        if ((h.case_number || '').toLowerCase() === originalNo.toLowerCase()) {
          h.case_number = newCaseNumber;
        }
      });
      window.allHearingRecords = this.hearings;
      await this.db.update(
        'hearings',
        { case_number: newCaseNumber },
        originalNo
      );
    }

    return true;
  }

  async deleteCase(caseNumber) {
    await this.db.deleteCase(caseNumber);
    
    const idx = this.cases.findIndex(c => 
      (c.caseNo || c.case_number || '').toLowerCase() === caseNumber.toLowerCase() ||
      (c.criminalCaseNumber || c.criminal_case_number || '').toLowerCase() === caseNumber.toLowerCase()
    );
    
    if (idx !== -1) {
      this.cases.splice(idx, 1);
    }
    window.allCaseRecords = this.cases;
  }

  getCourtOptions() {
    const courts = this.courts.length > 0 ? this.courts : [
      'District Court (Court Complex)',
      'Civil Court',
      'Family Court',
      'Sessions Court',
      'Tehsildar Court',
      'SDM Court',
      'High Court',
      'Lohiya Nagar District Court',
      'Civil Lines Court',
      'Madhupur Court',
      'Saharanpur Court',
      'Deoband Court'
    ];
    return Array.from(new Set(courts.filter(Boolean)));
  }

  renderCourtOptions(selectId = null) {
    const courts = this.getCourtOptions();
    const html = courts.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    
    // Update all court select dropdowns
    const selects = selectId 
      ? [document.getElementById(selectId)] 
      : document.querySelectorAll('select[id*="CourtName"], select[id*="Court"]');
    
    selects.forEach(select => {
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = '<option value="">-- Select Court --</option>' + html;
      if (currentValue) select.value = currentValue;
    });
  }

  renderCriminalCourtOptions() {
    this.renderCourtOptions();
  }

  renderCourtsTable() {
    // This method renders courts management table
    const tbody = document.querySelector('#courtsTable tbody') || document.querySelector('#courtsManagementTable tbody');
    if (!tbody) return;

    const courts = this.getCourtOptions();
    tbody.innerHTML = courts.map((court, idx) => `
      <tr>
        <td style="text-align: center;"><span class="court-index-badge">#${idx + 1}</span></td>
        <td>
          <div class="court-name-cell">
            <span style="font-size: 18px;">🏛️</span>
            <div class="court-name-meta">
              <span class="court-name-title">${escapeHtml(court)}</span>
            </div>
          </div>
        </td>
        <td class="table-actions-td">
          <div class="court-actions-cell">
            <button type="button" class="court-btn-edit" onclick="window.openEditCourtModal ? window.openEditCourtModal('${escapeHtml(court)}') : window.editCourtPrompt('${escapeHtml(court)}')"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            <button type="button" class="court-btn-delete" onclick="window.deleteCourtFromList ? window.deleteCourtFromList('${escapeHtml(court)}') : window.deleteCourtFromSupabase('${escapeHtml(court)}')"><i class="fa-solid fa-trash-can"></i><span class="btn-text"> Delete</span></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Stats calculations
  getStats() {
    const total = this.cases.length;
    const disposed = this.cases.filter(c => 
      (c.caseStatus || '').toLowerCase().includes('dispose')
    ).length;
    const pending = total - disposed;
    const todayStr = new Date().toISOString().split('T')[0];
    const today = this.cases.filter(c => c.nextHearing === todayStr).length;
    const undated = this.cases.filter(c => 
      !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()
    ).length;
    
    const byType = {
      civil: this.cases.filter(c => c.caseType === 'civil').length,
      criminal: this.cases.filter(c => c.caseType === 'criminal').length,
      state: this.cases.filter(c => c.caseType === 'state').length,
      family: this.cases.filter(c => c.caseType === 'family').length,
      revenue: this.cases.filter(c => c.caseType === 'revenue').length,
      misc_civil: this.cases.filter(c => c.caseType === 'misc_civil').length,
      misc_criminal: this.cases.filter(c => c.caseType === 'misc_criminal').length,
      complaint: this.cases.filter(c => c.caseType === 'complaint').length
    };

    const upcoming = this.cases.filter(c => {
      if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);
      const weekAheadStr = weekAhead.toISOString().split('T')[0];
      return c.nextHearing >= todayStr && c.nextHearing <= weekAheadStr;
    }).length;

    return {
      total,
      pending,
      disposed,
      today,
      undated,
      upcoming,
      pendingPercent: total > 0 ? Math.round((pending / total) * 100) : 0,
      disposedPercent: total > 0 ? Math.round((disposed / total) * 100) : 0,
      byType
    };
  }
}

export { CaseService, getSafeValue, formatDateDMY, escapeHtml };