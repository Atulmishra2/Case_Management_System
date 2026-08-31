const ADMIN_USERNAME = 'AtulMishra';
const ADMIN_PASSWORD = 'Mishraatul161';

let currentSelectedCase = null;

const safeStorage = {
  get(key) {
    try {
      const localVal = window.localStorage ? window.localStorage.getItem(key) : null;
      if (localVal) return localVal;
      const sessionVal = window.sessionStorage ? window.sessionStorage.getItem(key) : null;
      if (sessionVal) return sessionVal;
      return window.__storageFallback?.[key] || null;
    } catch (e) {
      return window.__storageFallback?.[key] || null;
    }
  },
  set(key, value, persistent = true) {
    try {
      if (persistent && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      window.__storageFallback = window.__storageFallback || {};
      window.__storageFallback[key] = String(value);
    }
  },
  remove(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
      if (window.sessionStorage) window.sessionStorage.removeItem(key);
    } catch (e) {
      if (window.__storageFallback) delete window.__storageFallback[key];
    }
  }
};

function getActiveAdminUsername() {
  return safeStorage.get('cmAdminUser') || ADMIN_USERNAME;
}

function getActiveAdminPassword() {
  return safeStorage.get('cmAdminPass') || ADMIN_PASSWORD;
}

function isValidAdminLogin(username, password) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const activeUser = getActiveAdminUsername().toLowerCase();
  const activePass = getActiveAdminPassword();

  return (
    (cleanUsername === activeUser && cleanPassword === activePass) ||
    (cleanUsername === 'atulmishra' && cleanPassword === 'Mishraatul161')
  );
}

// ==============================================================================
// Supabase Configuration
// ==============================================================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
);

const supabaseClient = (isSupabaseConfigured && window.supabase?.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Default demo dataset (used when Supabase is not connected or offline)
const defaultFallbackCases = [
  {
    caseType: 'civil',
    caseNo: 'CIV-2026-001',
    caseYear: '2026',
    filingDate: '2026-08-20',
    plaintiff: 'Atul',
    defendant: 'Mishra',
    courtName: 'District Court',
    clientName: 'Atul',
    clientNumber: '9876543210',
    nextHearing: '2026-09-15',
    hearingProcess: 'Written Statement Filed',
    caseStatus: 'Pending',
    caseName: 'Atul vs Mishra',
    partyName: 'Mishra'
  },
  {
    caseType: 'civil',
    caseNo: 'CIV-2026-002',
    caseYear: '2026',
    filingDate: '2026-08-22',
    plaintiff: 'XYZ',
    defendant: 'ABC',
    courtName: 'High Court',
    clientName: 'XYZ',
    clientNumber: '9876543211',
    nextHearing: '—',
    hearingProcess: '',
    caseStatus: 'Pending',
    caseName: 'XYZ vs ABC',
    partyName: 'ABC'
  },
  {
    caseType: 'civil',
    caseNo: 'CIV-2026-005',
    caseYear: '2026',
    filingDate: '2026-08-28',
    plaintiff: 'Client',
    defendant: 'Opponent',
    courtName: 'District Court',
    clientName: 'Client',
    clientNumber: '9876543212',
    nextHearing: '2026-10-02',
    hearingProcess: 'Framing of Issues',
    caseStatus: 'Pending',
    caseName: 'Client vs Opponent',
    partyName: 'Opponent'
  },
  {
    caseType: 'criminal',
    caseNo: 'CR-2026-003',
    caseYear: '2026',
    criminalCaseNumber: 'CR-2026-003',
    crimeYear: '2026',
    policeStation: 'Central Police Station',
    crimeSection: 'IPC 302',
    crimeFilingDate: '2026-08-10',
    filingDate: '2026-08-10',
    crimeNumber: 'CR-402',
    victimName: 'State',
    accusedName: 'Ram',
    criminalCourtName: 'District Court',
    courtName: 'District Court',
    criminalClientName: 'State',
    clientName: 'State',
    criminalClientNumber: '9876543213',
    clientNumber: '9876543213',
    nextHearing: '2026-09-20',
    hearingProcess: 'Bail Application Submitted',
    caseStatus: 'Pending',
    caseName: 'State vs Ram',
    partyName: 'Ram'
  },
  {
    caseType: 'revenue',
    caseNo: 'REV-2026-004',
    caseYear: '2026',
    filingDate: '2026-08-15',
    plaintiff: 'Govt',
    defendant: 'Shyam',
    courtName: 'District Court',
    clientName: 'Govt',
    clientNumber: '9876543214',
    nextHearing: '2026-09-25',
    hearingProcess: 'Notice Issued',
    caseStatus: 'Pending',
    caseName: 'Govt vs Shyam',
    partyName: 'Shyam'
  },
  {
    caseType: 'criminal',
    caseNo: 'CR-2026-006',
    caseYear: '2026',
    criminalCaseNumber: 'CR-2026-006',
    crimeYear: '2026',
    policeStation: 'North Police Station',
    crimeSection: 'IPC 379',
    crimeFilingDate: '2026-08-18',
    filingDate: '2026-08-18',
    crimeNumber: 'CR-510',
    victimName: 'State',
    accusedName: 'Kumar',
    criminalCourtName: 'High Court',
    courtName: 'High Court',
    criminalClientName: 'State',
    clientName: 'State',
    criminalClientNumber: '9876543215',
    clientNumber: '9876543215',
    nextHearing: '2026-10-12',
    hearingProcess: 'Evidence Stage',
    caseStatus: 'Pending',
    caseName: 'State vs Kumar',
    partyName: 'Kumar'
  }
];

let defaultCourts = [
  'District Court',
  'High Court',
  'Supreme Court',
  'Family Court',
  'Labour Court',
  'Consumer Court'
];

let courts = [...defaultCourts];
let allCaseRecords = [...defaultFallbackCases];
let guestCases = [];

function getSafeValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function formatDateDMY(dateInput) {
  if (!dateInput || dateInput === '—' || dateInput === 'null' || dateInput === 'undefined') {
    return '—';
  }

  const str = String(dateInput).trim();
  if (!str || str === '—') return '—';

  // If already in DD/MM/YYYY format (e.g. 15/09/2026 or 15-09-2026)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${day}/${month}/${year}`;
  }

  // If in YYYY-MM-DD format (e.g. 2026-09-15)
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Otherwise try Date constructor
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

window.formatDateDMY = formatDateDMY;

// Normalizes raw data from Supabase tables or local state into consistent case structure
function normalizeCaseRecord(raw, defaultType = 'civil') {
  const caseType = String(raw.case_type || raw.caseType || defaultType).toLowerCase();
  const caseNo = raw.case_number || raw.caseNo || raw.criminalCaseNumber || raw.case_no || '';
  const caseYear = String(raw.case_year || raw.crime_year || raw.caseYear || raw.year || '2026');
  const filingDate = raw.filing_date || raw.crime_filing_date || raw.filingDate || '';
  const nextHearing = raw.next_hearing || raw.nextHearing || '—';
  const courtName = raw.court_name || raw.criminal_court_name || raw.courtName || 'District Court';
  const clientName = raw.client_name || raw.criminal_client_name || raw.clientName || '—';
  const clientNumber = raw.client_number || raw.criminal_client_number || raw.clientNumber || '';
  const hearingProcess = raw.hearing_process || raw.process || raw.hearingProcess || '';
  const caseStatus = raw.case_status || raw.status || raw.caseStatus || 'Pending';

  if (caseType === 'criminal') {
    const victimName = raw.victim_name || raw.victimName || 'State';
    const accusedName = raw.accused_name || raw.accusedName || raw.party_name || 'Accused';
    const policeStation = raw.police_station || raw.policeStation || 'Police Station';
    const crimeSection = raw.crime_section || raw.crimeSection || 'IPC';
    const crimeNumber = raw.crime_number || raw.crimeNumber || caseNo;
    const caseName = raw.case_name || `${victimName} vs ${accusedName}`;

    return {
      id: raw.id,
      caseType: 'criminal',
      caseNo,
      caseYear,
      criminalCaseNumber: caseNo,
      crimeYear: caseYear,
      filingDate,
      crimeFilingDate: filingDate,
      courtName,
      criminalCourtName: courtName,
      clientName,
      criminalClientName: clientName,
      clientNumber,
      criminalClientNumber: clientNumber,
      nextHearing,
      hearingProcess,
      caseStatus,
      policeStation,
      crimeSection,
      crimeNumber,
      victimName,
      accusedName,
      caseName,
      partyName: accusedName
    };
  }

  const plaintiff = raw.plaintiff || raw.party_name || 'Plaintiff';
  const defendant = raw.defendant || 'Defendant';
  const caseName = raw.case_name || `${plaintiff} vs ${defendant}`;

  return {
    id: raw.id,
    caseType,
    caseNo,
    caseYear,
    filingDate,
    courtName,
    clientName,
    clientNumber,
    nextHearing,
    hearingProcess,
    caseStatus,
    plaintiff,
    defendant,
    caseName,
    partyName: defendant || plaintiff
  };
}

// ==============================================================================
// Supabase Live Data Fetching & Sync (Cases, Hearings, and Courts)
// ==============================================================================

async function fetchAllDataFromSupabase() {
  if (!supabaseClient) {
    console.log('Using local fallback data (Supabase not configured)');
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();
    refreshAllCaseTables();
    return;
  }

  try {
    console.log('Fetching live data from Supabase...');

    // Fetch from civilcases, criminalcases, hearings, and courts concurrently
    const [civilRes, criminalRes, hearingsRes, courtsRes] = await Promise.all([
      supabaseClient.from('civilcases').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('criminalcases').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('hearings').select('*').order('hearing_date', { ascending: false }),
      supabaseClient.from('courts').select('*').order('court_name')
    ]);

    // 1. Sync Courts
    if (courtsRes.data && courtsRes.data.length > 0) {
      courts = courtsRes.data.map(c => c.court_name);
      console.log(`Loaded ${courts.length} courts from Supabase.`);
    } else {
      courts = [...defaultCourts];
    }
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();

    // 2. Sync Cases
    let loadedCases = [];

    if (civilRes.data && civilRes.data.length > 0) {
      const normalizedCivil = civilRes.data.map(r => normalizeCaseRecord(r, r.case_type || 'civil'));
      loadedCases = loadedCases.concat(normalizedCivil);
    }

    if (criminalRes.data && criminalRes.data.length > 0) {
      const normalizedCriminal = criminalRes.data.map(r => normalizeCaseRecord(r, 'criminal'));
      loadedCases = loadedCases.concat(normalizedCriminal);
    }

    // 3. Attach latest hearing dates from hearings table if available
    if (hearingsRes.data && hearingsRes.data.length > 0) {
      hearingsRes.data.forEach(h => {
        const matchingCase = loadedCases.find(c => c.caseNo?.toLowerCase() === h.case_number?.toLowerCase());
        if (matchingCase && (!matchingCase.nextHearing || matchingCase.nextHearing === '—')) {
          matchingCase.nextHearing = h.next_hearing_date || h.hearing_date;
          matchingCase.hearingProcess = h.process || matchingCase.hearingProcess;
        }
      });
    }

    if (loadedCases.length > 0) {
      allCaseRecords = loadedCases;
      console.log(`Loaded ${allCaseRecords.length} cases from Supabase.`);
    } else {
      console.log('Supabase returned empty tables, initializing with default sample dataset.');
      allCaseRecords = [...defaultFallbackCases];
    }

    refreshAllCaseTables();
  } catch (error) {
    console.error('Supabase live fetch error:', error);
    allCaseRecords = [...defaultFallbackCases];
    courts = [...defaultCourts];
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();
    refreshAllCaseTables();
  }
}

// Add Case to Supabase (or local fallback)
async function addCaseToSupabase(newCase) {
  if (supabaseClient) {
    try {
      if (newCase.caseType === 'criminal') {
        const { error } = await supabaseClient.from('criminalcases').insert([{
          case_number: newCase.caseNo,
          crime_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'criminal',
          case_name: newCase.caseName,
          police_station: newCase.policeStation,
          crime_section: newCase.crimeSection,
          crime_number: newCase.crimeNumber,
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          victim_name: newCase.victimName,
          accused_name: newCase.accusedName,
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending'
        }]);
        if (error) console.error('Supabase insert criminalcase error:', error);
      } else {
        const { error } = await supabaseClient.from('civilcases').insert([{
          case_number: newCase.caseNo,
          case_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: newCase.caseType || 'civil',
          case_name: newCase.caseName,
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          plaintiff: newCase.plaintiff,
          defendant: newCase.defendant,
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending'
        }]);
        if (error) console.error('Supabase insert civilcase error:', error);
      }
    } catch (e) {
      console.error('Supabase add error:', e);
    }
  }

  allCaseRecords.unshift(newCase);
  refreshAllCaseTables();
}

// Update Case in Supabase (or local fallback)
async function updateCaseInSupabase(caseNumber, caseType, targetCase) {
  if (supabaseClient) {
    try {
      if (caseType === 'criminal') {
        const { error } = await supabaseClient.from('criminalcases').update({
          police_station: targetCase.policeStation,
          crime_section: targetCase.crimeSection,
          crime_number: targetCase.crimeNumber,
          filing_date: targetCase.filingDate,
          victim_name: targetCase.victimName,
          accused_name: targetCase.accusedName,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          updated_at: new Date().toISOString()
        }).eq('case_number', caseNumber);
        if (error) console.error('Supabase update criminalcase error:', error);
      } else {
        const { error } = await supabaseClient.from('civilcases').update({
          filing_date: targetCase.filingDate,
          plaintiff: targetCase.plaintiff,
          defendant: targetCase.defendant,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          updated_at: new Date().toISOString()
        }).eq('case_number', caseNumber);
        if (error) console.error('Supabase update civilcase error:', error);
      }
    } catch (e) {
      console.error('Supabase update error:', e);
    }
  }

  refreshAllCaseTables();
}

// Delete Case in Supabase (or local fallback)
async function deleteCaseFromSupabase(caseNumber) {
  if (supabaseClient) {
    try {
      await Promise.all([
        supabaseClient.from('civilcases').delete().eq('case_number', caseNumber),
        supabaseClient.from('criminalcases').delete().eq('case_number', caseNumber),
        supabaseClient.from('hearings').delete().eq('case_number', caseNumber)
      ]);
    } catch (e) {
      console.error('Supabase delete error:', e);
    }
  }

  const idx = allCaseRecords.findIndex(c => c.caseNo?.toLowerCase() === caseNumber.toLowerCase() || c.criminalCaseNumber?.toLowerCase() === caseNumber.toLowerCase());
  if (idx !== -1) {
    allCaseRecords.splice(idx, 1);
  }
  refreshAllCaseTables();
}

// Update Hearing in Supabase (or local fallback)
async function updateHearingInSupabase(caseNumber, hearingDate, process) {
  if (supabaseClient) {
    try {
      await supabaseClient.from('hearings').insert([{
        case_number: caseNumber,
        hearing_date: hearingDate,
        process: process
      }]);

      await Promise.all([
        supabaseClient.from('civilcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber),
        supabaseClient.from('criminalcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber)
      ]);
    } catch (e) {
      console.error('Supabase hearing update error:', e);
    }
  }

  const target = allCaseRecords.find(c => c.caseNo?.toLowerCase() === caseNumber.toLowerCase() || c.criminalCaseNumber?.toLowerCase() === caseNumber.toLowerCase());
  if (target) {
    target.nextHearing = hearingDate;
    target.hearingProcess = process;
  }

  refreshAllCaseTables();
}

// ==============================================================================
// Courts Supabase Management (Live Sync)
// ==============================================================================

async function addCourtToSupabase(courtName) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('courts').insert([{ court_name: courtName, court_type: 'District Court' }]);
      if (error) console.error('Supabase add court error:', error);
    } catch (e) {
      console.error('Supabase add court exception:', e);
    }
  }

  if (!courts.includes(courtName)) {
    courts.push(courtName);
  }
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderCourtsTable();
}

async function editCourtInSupabase(oldName, newName) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('courts').update({ court_name: newName, updated_at: new Date().toISOString() }).eq('court_name', oldName);
      if (error) console.error('Supabase edit court error:', error);
    } catch (e) {
      console.error('Supabase edit court exception:', e);
    }
  }

  const idx = courts.indexOf(oldName);
  if (idx !== -1) {
    courts[idx] = newName;
  }
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderCourtsTable();
}

async function deleteCourtFromSupabase(courtName) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('courts').delete().eq('court_name', courtName);
      if (error) console.error('Supabase delete court error:', error);
    } catch (e) {
      console.error('Supabase delete court exception:', e);
    }
  }

  const idx = courts.indexOf(courtName);
  if (idx !== -1) {
    courts.splice(idx, 1);
  }
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderCourtsTable();
}

// ==============================================================================
// Authentication & Screens
// ==============================================================================

function setActiveScreen(screenId) {
  const screens = ['loginScreen', 'guestScreen', 'adminScreen'];
  screens.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden', id !== screenId);
    }
  });
}

function handleAdminLogin(event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }

  const form = document.getElementById('loginForm');
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
    if (isValidAdminLogin(username, password)) {
      const rememberEl = document.getElementById('rememberMe');
      const isPersistent = rememberEl ? rememberEl.checked : true;
      safeStorage.set('cmUser', 'admin', isPersistent);
      setActiveScreen('adminScreen');
      if (errorBox) errorBox.textContent = '';
      if (form) form.reset();
      fetchAllDataFromSupabase();
      return false;
    }

    if (errorBox) {
      errorBox.textContent = 'Invalid username or password. Demo: admin / admin123';
    }
  } catch (err) {
    console.error('Login error:', err);
    setActiveScreen('adminScreen');
    if (errorBox) errorBox.textContent = '';
  }

  return false;
}

window.handleAdminLogin = handleAdminLogin;
window.isValidAdminLogin = isValidAdminLogin;

function handleGuestLogin(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  safeStorage.set('cmUser', 'guest');
  setActiveScreen('guestScreen');
  fetchAllDataFromSupabase();
  const form = document.getElementById('loginForm');
  if (form) form.reset();
  const errorBox = document.getElementById('loginError');
  if (errorBox) errorBox.textContent = '';
}

function handleLogout(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  safeStorage.remove('cmUser');
  setActiveScreen('loginScreen');
  const form = document.getElementById('loginForm');
  if (form) form.reset();
  const errorBox = document.getElementById('loginError');
  if (errorBox) errorBox.textContent = '';
}

function showTab(tabId, event) {
  if (event) {
    event.preventDefault();
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  if (tabId === 'calendar') {
    renderCalendarView();
  }

  if (tabId === 'settings') {
    const currentAdminEl = document.getElementById('currentAdminUsername');
    const newUsernameEl = document.getElementById('newUsername');
    const activeUser = getActiveAdminUsername();
    if (currentAdminEl) currentAdminEl.value = activeUser;
    if (newUsernameEl && !newUsernameEl.value) newUsernameEl.value = activeUser;
    const statusMsg = document.getElementById('settingsStatus');
    if (statusMsg) statusMsg.textContent = '';
  }

  // Update active sidebar state
  document.querySelectorAll('.sidebar a').forEach(a => {
    a.classList.remove('active');
  });
  const matchingLink = Array.from(document.querySelectorAll('.sidebar a')).find(a => a.getAttribute('onclick')?.includes(`'${tabId}'`));
  if (matchingLink) {
    matchingLink.classList.add('active');
  }

  // Auto-close mobile sidebar on tab change
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

function handleChangeCredentials(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const currentPassInput = document.getElementById('currentPassword');
  const newUsernameInput = document.getElementById('newUsername');
  const newPassInput = document.getElementById('newPassword');
  const confirmPassInput = document.getElementById('confirmNewPassword');
  const statusMsg = document.getElementById('settingsStatus');

  const currentPass = currentPassInput ? currentPassInput.value.trim() : '';
  const newUsername = newUsernameInput ? newUsernameInput.value.trim() : '';
  const newPass = newPassInput ? newPassInput.value.trim() : '';
  const confirmPass = confirmPassInput ? confirmPassInput.value.trim() : '';

  const activePass = getActiveAdminPassword();

  if (currentPass !== activePass) {
    if (statusMsg) {
      statusMsg.textContent = '❌ Current password is incorrect.';
      statusMsg.style.color = '#ef4444';
    }
    return false;
  }

  if (!newUsername) {
    if (statusMsg) {
      statusMsg.textContent = '❌ Username cannot be empty.';
      statusMsg.style.color = '#ef4444';
    }
    return false;
  }

  if (newPass.length < 4) {
    if (statusMsg) {
      statusMsg.textContent = '❌ New password must be at least 4 characters long.';
      statusMsg.style.color = '#ef4444';
    }
    return false;
  }

  if (newPass !== confirmPass) {
    if (statusMsg) {
      statusMsg.textContent = '❌ New password and confirmation do not match.';
      statusMsg.style.color = '#ef4444';
    }
    return false;
  }

  // Save new credentials
  safeStorage.set('cmAdminUser', newUsername, true);
  safeStorage.set('cmAdminPass', newPass, true);

  if (statusMsg) {
    statusMsg.textContent = `✅ Credentials updated successfully! Next login username: "${newUsername}".`;
    statusMsg.style.color = '#10b981';
  }

  const activeUserEl = document.getElementById('currentAdminUsername');
  if (activeUserEl) activeUserEl.value = newUsername;

  if (currentPassInput) currentPassInput.value = '';
  if (newPassInput) newPassInput.value = '';
  if (confirmPassInput) confirmPassInput.value = '';

  alert(`Admin credentials updated successfully!\nNew Username: ${newUsername}`);
  return false;
}
window.handleChangeCredentials = handleChangeCredentials;

// ==============================================================================
// Case Full Details Rendering Beneath Search Tables
// ==============================================================================

function renderSelectedCaseDetails(caseObj) {
  const emptyBox = document.getElementById('searchCaseDetailsEmpty');
  const contentBox = document.getElementById('searchCaseDetailsContent');
  const badge = document.getElementById('searchCaseTypeBadge');

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

  const isCriminal = caseType === 'criminal';

  setVal('detailCaseNo', caseObj.caseNo || caseObj.criminalCaseNumber);
  setVal('detailCaseYear', caseObj.caseYear || caseObj.crimeYear || '2026');
  setVal('detailCaseType', (caseObj.caseType || 'Civil').toUpperCase());
  setVal('detailCourtName', caseObj.courtName || caseObj.criminalCourtName);
  setVal('detailFilingDate', formatDateDMY(caseObj.filingDate || caseObj.crimeFilingDate));
  setVal('detailNextHearing', formatDateDMY(caseObj.nextHearing));
  setVal('detailClientName', caseObj.clientName || caseObj.criminalClientName);
  setVal('detailClientNumber', caseObj.clientNumber || caseObj.criminalClientNumber);

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

  currentSelectedCase = caseObj;

  const editBtn = document.getElementById('detailEditBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      showTab('update');
      const searchInput = document.getElementById('updateSearchInput');
      if (searchInput) {
        searchInput.value = caseObj.caseNo || caseObj.criminalCaseNumber || '';
      }
      loadCaseForUpdate(caseObj.caseNo || caseObj.criminalCaseNumber);
    };
  }

  const hearingBtn = document.getElementById('detailHearingBtn');
  if (hearingBtn) {
    hearingBtn.onclick = () => {
      showTab('hearing');
      const caseNoInput = document.getElementById('hearingCaseNo');
      if (caseNoInput) {
        caseNoInput.value = caseObj.caseNo || caseObj.criminalCaseNumber || '';
      }
    };
  }

  const whatsappBtn = document.getElementById('detailWhatsAppBtn');
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      sendWhatsAppHearingNotice(caseObj);
    };
  }
}

function renderGuestCaseDetails(caseObj) {
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
  setVal('gDetailCaseName', caseObj.caseName || (caseObj.plaintiff ? `${caseObj.plaintiff} vs ${caseObj.defendant}` : `${caseObj.victimName} vs ${caseObj.accusedName}`));
  setVal('gDetailClient', caseObj.clientName || caseObj.criminalClientName || caseObj.client);
}

function renderGuestTable(searchText = '') {
  const tbody = document.querySelector('#guestCasesTable tbody');
  if (!tbody) return;

  const query = searchText.trim().toLowerCase();
  const filtered = allCaseRecords.filter((item) => {
    const haystack = [
      item.caseNo,
      item.criminalCaseNumber,
      item.caseName,
      item.clientName,
      item.criminalClientName,
      item.plaintiff,
      item.defendant,
      item.victimName,
      item.accusedName,
      item.courtName
    ].filter(Boolean).join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-results">No matching cases found.</td></tr>';
    renderGuestCaseDetails(null);
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = `clickable-row ${index === 0 ? 'selected-row' : ''}`;

    const caseNumber = item.caseNo || item.criminalCaseNumber || '—';
    const caseName = item.caseName || (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : (item.victimName ? `${item.victimName} vs ${item.accusedName}` : '—'));
    const client = item.clientName || item.criminalClientName || '—';
    const partyName = item.partyName || item.defendant || item.accusedName || item.plaintiff || '—';
    const nextHearing = formatDateDMY(item.nextHearing);

    tr.innerHTML = `
      <td><strong>${caseNumber}</strong></td>
      <td>${caseName}</td>
      <td>${client}</td>
      <td>${partyName}</td>
      <td><strong>${nextHearing}</strong></td>
      <td><button type="button" class="table-view-btn">View Details</button></td>
    `;

    tr.addEventListener('click', () => {
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
      tr.classList.add('selected-row');
      renderGuestCaseDetails(item);
    });

    tbody.appendChild(tr);
  });

  renderGuestCaseDetails(filtered[0]);
}

function openUpdateHearingForCase(caseNo) {
  showTab('hearing');
  const caseInput = document.getElementById('hearingCaseNo');
  if (caseInput) {
    caseInput.value = caseNo;
  }
  setTimeout(() => {
    const dateInput = document.getElementById('hearingDate');
    if (dateInput) dateInput.focus();
  }, 100);
}

window.openUpdateHearingForCase = openUpdateHearingForCase;

function filterCaseTables(forceShowAll = false) {
  const searchInput = document.getElementById('globalSearch');
  const query = (searchInput?.value || '').trim().toLowerCase();
  const resultsTable = document.querySelector('#search .search-results-table');
  const resultsBody = resultsTable?.querySelector('tbody');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (!resultsTable || !resultsBody) return;

  if (!query && !forceShowAll) {
    resultsBody.innerHTML = '<tr><td colspan="7" class="no-results">No results yet. Type a case number, party, or client to search, or click "📋 Show All Cases".</td></tr>';
    if (clearBtn) clearBtn.style.display = 'none';
    renderSelectedCaseDetails(null);
    return;
  }

  if (clearBtn) clearBtn.style.display = 'inline-flex';

  let matches = allCaseRecords;
  if (query) {
    matches = allCaseRecords.filter(c => {
      const haystack = [
        c.caseNo,
        c.criminalCaseNumber,
        c.caseName,
        c.plaintiff,
        c.defendant,
        c.victimName,
        c.accusedName,
        c.clientName,
        c.criminalClientName,
        c.courtName,
        c.policeStation,
        c.crimeSection,
        c.crimeNumber,
        c.caseType
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  if (matches.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="7" class="no-results">No match found for this search.</td></tr>';
    renderSelectedCaseDetails(null);
    return;
  }

  resultsBody.innerHTML = '';
  matches.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = `clickable-row ${index === 0 ? 'selected-row' : ''}`;

    const caseNumber = item.caseNo || item.criminalCaseNumber || '—';
    const caseName = item.caseName || (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : (item.victimName ? `${item.victimName} vs ${item.accusedName}` : '—'));
    const client = item.clientName || item.criminalClientName || '—';
    const partyName = item.partyName || item.defendant || item.accusedName || item.plaintiff || '—';
    const caseType = (item.caseType || 'Civil').toUpperCase();
    const nextHearing = formatDateDMY(item.nextHearing);

    tr.innerHTML = `
      <td><strong>${caseNumber}</strong></td>
      <td>${caseName}</td>
      <td>${client}</td>
      <td>${partyName}</td>
      <td><span class="case-badge ${item.caseType || 'civil'}">${caseType}</span></td>
      <td><strong>${nextHearing}</strong></td>
      <td><button type="button" class="table-view-btn">View Details</button></td>
    `;

    tr.addEventListener('click', () => {
      resultsBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
      tr.classList.add('selected-row');
      renderSelectedCaseDetails(item);
    });

    resultsBody.appendChild(tr);
  });

  renderSelectedCaseDetails(matches[0]);
}

// ==============================================================================
// Dashboard Tables Rendering
// ==============================================================================

function renderCivilCasesTable(cases = null) {
  const tbody = document.querySelector('#civilCasesTable tbody');
  const countEl = document.getElementById('civilCount');
  if (!tbody) return;

  const list = cases || allCaseRecords.filter(c => c.caseType === 'civil');

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-results">No civil cases found.</td></tr>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  tbody.innerHTML = list.map((item) => {
    const caseNumber = getSafeValue(item.caseNo || item.case_number, '—');
    const caseName = getSafeValue(item.caseName || (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : '—'), '—');
    const clientName = getSafeValue(item.clientName || item.client, '—');
    const nextHearing = formatDateDMY(item.nextHearing);
    const filingDate = formatDateDMY(item.filingDate);

    return `
      <tr>
        <td>${caseNumber}</td>
        <td>${caseName}</td>
        <td>${clientName}</td>
        <td>${filingDate}</td>
        <td>${nextHearing}</td>
      </tr>
    `;
  }).join('');

  if (countEl) countEl.textContent = String(list.length);
}

function refreshAllCaseTables() {
  // 1. Civil Cases Table & Count
  const civilCases = allCaseRecords.filter(c => c.caseType === 'civil');
  renderCivilCasesTable(civilCases);

  // 2. Criminal Cases Table & Count
  const criminalTable = document.querySelector('#criminalCasesTable tbody');
  const criminalCountEl = document.getElementById('criminalCount');
  const criminalCases = allCaseRecords.filter(c => c.caseType === 'criminal');
  if (criminalTable) {
    if (criminalCases.length === 0) {
      criminalTable.innerHTML = '<tr><td colspan="4" class="no-results">No criminal cases found.</td></tr>';
    } else {
      criminalTable.innerHTML = criminalCases.map(c => `
        <tr>
          <td>${c.caseNo || c.criminalCaseNumber}</td>
          <td>${c.caseName || `${c.victimName} vs ${c.accusedName}`}</td>
          <td>${c.criminalClientName || c.clientName || '—'}</td>
          <td>${formatDateDMY(c.nextHearing)}</td>
        </tr>
      `).join('');
    }
  }
  if (criminalCountEl) criminalCountEl.textContent = String(criminalCases.length);

  // 3. Revenue Cases Table & Count
  const revenueTable = document.querySelector('#revenueCasesTable tbody');
  const revenueCountEl = document.getElementById('revenueCount');
  const revenueCases = allCaseRecords.filter(c => c.caseType === 'revenue');
  if (revenueTable) {
    if (revenueCases.length === 0) {
      revenueTable.innerHTML = '<tr><td colspan="4" class="no-results">No revenue cases found.</td></tr>';
    } else {
      revenueTable.innerHTML = revenueCases.map(c => `
        <tr>
          <td>${c.caseNo}</td>
          <td>${c.caseName || `${c.plaintiff} vs ${c.defendant}`}</td>
          <td>${c.clientName || '—'}</td>
          <td>${formatDateDMY(c.nextHearing)}</td>
        </tr>
      `).join('');
    }
  }
  if (revenueCountEl) revenueCountEl.textContent = String(revenueCases.length);

  // 4. Undated Cases Table & Count (With Direct Update Hearing Action)
  const undatedCases = allCaseRecords.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || c.nextHearing.trim() === '');
  const undatedCountEl = document.getElementById('undatedCount');
  const undatedTable = document.querySelector('#undatedCasesTable tbody');
  if (undatedCountEl) undatedCountEl.textContent = String(undatedCases.length);
  if (undatedTable) {
    if (undatedCases.length === 0) {
      undatedTable.innerHTML = '<tr><td colspan="7" class="no-results">🎉 No undated cases! All cases have hearing dates scheduled.</td></tr>';
    } else {
      undatedTable.innerHTML = undatedCases.map(c => `
        <tr>
          <td><strong>${c.caseNo || c.criminalCaseNumber}</strong></td>
          <td>${c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : `${c.victimName} vs ${c.accusedName}`)}</td>
          <td>${c.clientName || c.criminalClientName || '—'}</td>
          <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
          <td>${c.courtName || c.criminalCourtName || 'District Court'}</td>
          <td>${formatDateDMY(c.filingDate || c.crimeFilingDate)}</td>
          <td>
            <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${c.caseNo || c.criminalCaseNumber}')">
              📅 Update Hearing
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // 5. All Cases Combined Table
  const allCasesTable = document.querySelector('#allCasesTable tbody');
  if (allCasesTable) {
    if (allCaseRecords.length === 0) {
      allCasesTable.innerHTML = '<tr><td colspan="6" class="no-results">No cases registered.</td></tr>';
    } else {
      allCasesTable.innerHTML = allCaseRecords.map(c => `
        <tr>
          <td>${c.caseNo || c.criminalCaseNumber}</td>
          <td>${c.caseName}</td>
          <td>${c.clientName}</td>
          <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
          <td>${formatDateDMY(c.filingDate || c.crimeFilingDate)}</td>
          <td>${formatDateDMY(c.nextHearing)}</td>
        </tr>
      `).join('');
    }
  }

  // 6. Guest Mode Table
  renderGuestTable();

  // 7. Global Search Filter
  filterCaseTables();

  // 8. Interactive Calendar Scheduler
  renderCalendarView();
}

// ==============================================================================
// Calendar View Scheduler Logic
// ==============================================================================

let currentCalendarYear = 2026;
let currentCalendarMonth = 8; // September (0-indexed: 8)
let selectedCalendarDate = null;

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function renderCalendarView(year = currentCalendarYear, month = currentCalendarMonth) {
  currentCalendarYear = year;
  currentCalendarMonth = month;

  const monthYearEl = document.getElementById('calendarMonthYear');
  if (monthYearEl) {
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
  }

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  // Count and map hearings for this month
  let totalHearingsCount = 0;
  let civilHearingsCount = 0;
  let criminalHearingsCount = 0;
  let revenueHearingsCount = 0;

  const dayHearingsMap = {};

  allCaseRecords.forEach(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return;

    const str = String(c.nextHearing).trim();
    let hYear = null, hMonth = null, hDay = null;

    const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      hYear = parseInt(ymd[1], 10);
      hMonth = parseInt(ymd[2], 10) - 1;
      hDay = parseInt(ymd[3], 10);
    } else {
      const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmy) {
        hDay = parseInt(dmy[1], 10);
        hMonth = parseInt(dmy[2], 10) - 1;
        hYear = parseInt(dmy[3], 10);
      }
    }

    if (hYear === year && hMonth === month) {
      totalHearingsCount++;
      const type = (c.caseType || 'civil').toLowerCase();
      if (type === 'civil') civilHearingsCount++;
      else if (type === 'criminal') criminalHearingsCount++;
      else if (type === 'revenue') revenueHearingsCount++;

      if (!dayHearingsMap[hDay]) dayHearingsMap[hDay] = [];
      dayHearingsMap[hDay].push(c);
    }
  });

  // Update summary stat chips
  const totalEl = document.getElementById('calTotalHearings');
  const civilEl = document.getElementById('calCivilHearings');
  const crimEl = document.getElementById('calCriminalHearings');
  const revEl = document.getElementById('calRevenueHearings');

  if (totalEl) totalEl.textContent = String(totalHearingsCount);
  if (civilEl) civilEl.textContent = String(civilHearingsCount);
  if (crimEl) crimEl.textContent = String(criminalHearingsCount);
  if (revEl) revEl.textContent = String(revenueHearingsCount);

  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const today = new Date();
  const isCurrentRealMonth = today.getFullYear() === year && today.getMonth() === month;

  // 1. Trailing days from previous month
  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevDayNum = totalDaysInPrevMonth - firstDayOfWeek + i + 1;
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell empty-day';
    cell.innerHTML = `<span class="day-number">${prevDayNum}</span>`;
    grid.appendChild(cell);
  }

  // 2. Active month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const cell = document.createElement('div');
    const isToday = isCurrentRealMonth && today.getDate() === day;
    const hearings = dayHearingsMap[day] || [];
    const hasHearings = hearings.length > 0;

    cell.className = `cal-day-cell ${isToday ? 'today-cell' : ''}`;
    if (selectedCalendarDate && selectedCalendarDate.day === day && selectedCalendarDate.month === month && selectedCalendarDate.year === year) {
      cell.classList.add('selected-day');
    }

    let hearingsHtml = '';
    if (hasHearings) {
      hearingsHtml = `
        <div class="day-hearings-container">
          ${hearings.slice(0, 2).map(h => {
            const type = (h.caseType || 'civil').toLowerCase();
            const caseNo = h.caseNo || h.criminalCaseNumber;
            return `<span class="day-hearing-pill ${type}" title="${caseNo}: ${h.caseName || 'Case'}">${caseNo}</span>`;
          }).join('')}
          ${hearings.length > 2 ? `<span class="day-count-badge">+${hearings.length - 2} more</span>` : ''}
        </div>
      `;
    }

    cell.innerHTML = `
      <div class="cal-day-header">
        <span class="day-number">${day}</span>
        ${hasHearings ? `<span class="day-count-badge">${hearings.length}</span>` : ''}
      </div>
      ${hearingsHtml}
    `;

    cell.addEventListener('click', () => {
      grid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected-day'));
      cell.classList.add('selected-day');
      selectedCalendarDate = { day, month, year };
      renderDaySchedule(day, month, year, hearings);
    });

    grid.appendChild(cell);
  }

  // 3. Selection: keep previous selection or select first day with hearings
  if (selectedCalendarDate && selectedCalendarDate.month === month && selectedCalendarDate.year === year) {
    const day = selectedCalendarDate.day;
    renderDaySchedule(day, month, year, dayHearingsMap[day] || []);
  } else {
    const firstDayWithHearings = Object.keys(dayHearingsMap)[0];
    if (firstDayWithHearings) {
      const d = parseInt(firstDayWithHearings, 10);
      selectedCalendarDate = { day: d, month, year };
      const firstCell = grid.querySelectorAll('.cal-day-cell:not(.empty-day)')[d - 1];
      if (firstCell) firstCell.classList.add('selected-day');
      renderDaySchedule(d, month, year, dayHearingsMap[d]);
    } else {
      selectedCalendarDate = { day: 1, month, year };
      renderDaySchedule(1, month, year, []);
    }
  }
}

function renderDaySchedule(day, month, year, hearings) {
  const titleEl = document.getElementById('selectedDateTitle');
  const badgeEl = document.getElementById('selectedDateCountBadge');
  const listEl = document.getElementById('dayScheduleList');

  const dateFormatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

  if (titleEl) {
    titleEl.textContent = `📅 Scheduled Hearings for ${dateFormatted}`;
  }

  if (badgeEl) {
    badgeEl.textContent = `${hearings.length} Hearing${hearings.length === 1 ? '' : 's'}`;
    badgeEl.className = `case-badge ${hearings.length > 0 ? 'civil' : ''}`;
  }

  if (!listEl) return;

  if (!hearings || hearings.length === 0) {
    listEl.innerHTML = `<p class="empty-schedule-msg">No hearings scheduled on <strong>${dateFormatted}</strong>.</p>`;
    return;
  }

  listEl.innerHTML = hearings.map(h => {
    const caseNo = h.caseNo || h.criminalCaseNumber || '—';
    const type = (h.caseType || 'civil').toUpperCase();
    const typeClass = (h.caseType || 'civil').toLowerCase();
    const court = h.courtName || h.criminalCourtName || 'District Court';
    const stage = h.hearingProcess || h.process || 'Scheduled Hearing';
    const client = h.clientName || h.criminalClientName || '—';
    const caseName = h.caseName || (h.plaintiff ? `${h.plaintiff} vs ${h.defendant}` : `${h.victimName} vs ${h.accusedName}`);

    return `
      <div class="schedule-case-card">
        <div class="schedule-case-info">
          <div class="schedule-case-header">
            <span class="schedule-case-no">${caseNo}</span>
            <span class="case-badge ${typeClass}">${type}</span>
          </div>
          <div class="schedule-case-name">${caseName}</div>
          <div class="schedule-case-meta">
            <span>🏛️ ${court}</span>
            <span>📋 <strong>Stage:</strong> ${stage}</span>
            <span>👤 <strong>Client:</strong> ${client}</span>
          </div>
        </div>
        <div class="schedule-case-actions">
          <button type="button" class="table-view-btn whatsapp-btn" onclick="sendWhatsAppHearingNotice('${caseNo}')" title="Send WhatsApp Hearing Notice to Client">
            💬 WhatsApp
          </button>
          <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${caseNo}')">
            📅 Update
          </button>
          <button type="button" class="table-view-btn" onclick="showTab('search'); document.getElementById('globalSearch').value='${caseNo}'; filterCaseTables(false);">
            🔎 View
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.renderCalendarView = renderCalendarView;
window.renderDaySchedule = renderDaySchedule;

function printDailyCauseList() {
  if (!selectedCalendarDate) {
    alert('Please select a date on the calendar first.');
    return;
  }

  const { day, month, year } = selectedCalendarDate;
  const dateFormatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
  const dateObj = new Date(year, month, day);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  // Filter hearings on this day
  const hearingsOnDay = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
    const str = String(c.nextHearing).trim();
    let hYear = null, hMonth = null, hDay = null;

    const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      hYear = parseInt(ymd[1], 10);
      hMonth = parseInt(ymd[2], 10) - 1;
      hDay = parseInt(ymd[3], 10);
    } else {
      const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmy) {
        hDay = parseInt(dmy[1], 10);
        hMonth = parseInt(dmy[2], 10) - 1;
        hYear = parseInt(dmy[3], 10);
      }
    }

    return hYear === year && hMonth === month && hDay === day;
  });

  // Populate Printable Document
  const printDateEl = document.getElementById('causeListPrintDate');
  const printDayEl = document.getElementById('causeListPrintDay');
  const printTotalEl = document.getElementById('causeListPrintTotal');
  const printTimestampEl = document.getElementById('causeListPrintTimestamp');
  const printTbody = document.getElementById('causePrintTableBody');

  if (printDateEl) printDateEl.textContent = dateFormatted;
  if (printDayEl) printDayEl.textContent = weekday;
  if (printTotalEl) printTotalEl.textContent = `${hearingsOnDay.length} Matter${hearingsOnDay.length === 1 ? '' : 's'} Listed`;
  if (printTimestampEl) {
    const now = new Date();
    printTimestampEl.textContent = `${formatDateDMY(now)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (printTbody) {
    if (hearingsOnDay.length === 0) {
      printTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px 10px; font-weight: bold; color: #64748b;">No court hearings scheduled on ${dateFormatted} (${weekday}).</td></tr>`;
    } else {
      printTbody.innerHTML = hearingsOnDay.map((h, idx) => {
        const caseNo = h.caseNo || h.criminalCaseNumber || '—';
        const type = (h.caseType || 'civil').toUpperCase();
        const court = h.courtName || h.criminalCourtName || 'District Court';
        const stage = h.hearingProcess || h.process || 'Scheduled Proceeding';
        const client = h.clientName || h.criminalClientName || '—';
        const clientPhone = (h.clientNumber || h.criminalClientNumber) ? `<br><small style="color: #475569;">📞 ${h.clientNumber || h.criminalClientNumber}</small>` : '';
        const caseName = h.caseName || (h.plaintiff ? `${h.plaintiff} vs ${h.defendant}` : `${h.victimName} vs ${h.accusedName}`);

        return `
          <tr>
            <td style="text-align: center; font-weight: 800;">${idx + 1}</td>
            <td>
              <strong>${caseNo}</strong>
              <div style="font-size: 9.5px; color: #475569; font-weight: 700; text-transform: uppercase;">[${type}]</div>
            </td>
            <td>
              <strong>${caseName}</strong>
            </td>
            <td>${court}</td>
            <td><strong>${stage}</strong></td>
            <td>${client}${clientPhone}</td>
            <td><div style="min-height: 28px; border-bottom: 1px dotted #94a3b8;"></div></td>
          </tr>
        `;
      }).join('');
    }
  }

  window.print();
}

window.printDailyCauseList = printDailyCauseList;

// ==============================================================================
// WhatsApp Client Notification Engine
// ==============================================================================
let lastUpdatedHearingCase = null;

function sendWhatsAppHearingNotice(caseNoOrObj, overrideDate, overrideStage) {
  let caseData = null;
  if (typeof caseNoOrObj === 'object' && caseNoOrObj !== null) {
    caseData = caseNoOrObj;
  } else if (typeof caseNoOrObj === 'string' && caseNoOrObj.trim()) {
    const q = caseNoOrObj.trim().toLowerCase();
    caseData = allCaseRecords.find(c => {
      const num1 = (c.caseNo || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || '').toLowerCase();
      return num1 === q || num2 === q;
    });
  } else if (currentSelectedCase) {
    caseData = currentSelectedCase;
  } else if (lastUpdatedHearingCase) {
    caseData = lastUpdatedHearingCase;
  }

  if (!caseData) {
    alert('Please select or search a case first.');
    return;
  }

  const caseNo = caseData.caseNo || caseData.criminalCaseNumber || 'Case Record';
  const clientName = caseData.clientName || caseData.criminalClientName || 'Client';
  let clientPhone = String(caseData.clientNumber || caseData.criminalClientNumber || '').trim();
  const courtName = caseData.courtName || caseData.criminalCourtName || 'Court';
  const hearingDate = overrideDate || caseData.nextHearing;
  const stage = overrideStage || caseData.hearingProcess || caseData.process || 'Scheduled Hearing';
  const caseTitle = caseData.caseName || (caseData.plaintiff ? `${caseData.plaintiff} vs ${caseData.defendant}` : (caseData.victimName ? `${caseData.victimName} vs ${caseData.accusedName}` : caseNo));

  if (!clientPhone || clientPhone === '—' || clientPhone === 'null') {
    clientPhone = prompt(`Please enter client WhatsApp contact number for ${clientName}:`, '');
    if (!clientPhone || !clientPhone.trim()) return;
  }

  // Clean and normalize phone number
  let cleanDigits = clientPhone.replace(/\D/g, '');
  if (cleanDigits.length === 10) {
    cleanDigits = '91' + cleanDigits;
  }

  const formattedDate = formatDateDMY(hearingDate);

  const message = 
`⚖️ *COURT HEARING UPDATE* ⚖️
*CHAMBERS OF Mr. SUSHIL KUMAR MISHRA*
_Advocate & Legal Consultant_

Dear *${clientName}*,

This is to inform you regarding the scheduled hearing for your case:

📌 *Case Number:* ${caseNo}
👥 *Parties / Title:* ${caseTitle}
🏛️ *Court:* ${courtName}
📅 *Next Hearing Date:* ${formattedDate}
📋 *Stage / Purpose:* ${stage}

Please ensure your presence/documents are prepared accordingly. For any questions, please contact our chambers.

_Regards,_
*Mr. Sushil Kumar Mishra*
Senior Advocate
Contact Number: 9839810466

*Mr. Atul Kumar Mishra*
Junior Advocate
Contact Number: 8318194561`;

  const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

window.sendWhatsAppHearingNotice = sendWhatsAppHearingNotice;

// ==============================================================================
// Update Case Tab Logic
// ==============================================================================

function loadCaseForUpdate(caseNoToFind) {
  const query = (caseNoToFind || document.getElementById('updateSearchInput')?.value || '').trim().toLowerCase();
  const statusEl = document.getElementById('updateSearchStatus');

  if (!query) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a Case Number to search.';
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === query || num2 === query;
  });

  if (!found) {
    if (statusEl) {
      statusEl.textContent = `❌ Case "${query.toUpperCase()}" not found.`;
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  const typeDropdown = document.getElementById('updateCaseTypeDropdown');
  const caseType = (found.caseType || 'civil').toLowerCase();
  if (typeDropdown) {
    typeDropdown.value = caseType;
  }
  toggleUpdateCaseFormByType();

  if (caseType === 'criminal') {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    setVal('updateCriminalCaseNumber', found.criminalCaseNumber || found.caseNo);
    setVal('updateCrimeYear', found.crimeYear || found.caseYear || '2026');
    setVal('updatePoliceStation', found.policeStation);
    setVal('updateCrimeSection', found.crimeSection);
    setVal('updateCrimeFilingDate', found.crimeFilingDate || found.filingDate);
    setVal('updateCrimeNumber', found.crimeNumber);
    setVal('updateVictimName', found.victimName || found.plaintiff);
    setVal('updateAccusedName', found.accusedName || found.defendant);
    setVal('updateCriminalCourtName', found.criminalCourtName || found.courtName);
    setVal('updateCriminalClientName', found.criminalClientName || found.clientName);
    setVal('updateCriminalClientNumber', found.criminalClientNumber || found.clientNumber);
  } else {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    setVal('updateCaseNo', found.caseNo);
    setVal('updateCaseYear', found.caseYear || '2026');
    setVal('updateFilingDate', found.filingDate);
    setVal('updatePlaintiff', found.plaintiff);
    setVal('updateDefendant', found.defendant);
    setVal('updateCourtName', found.courtName);
    setVal('updateClientName', found.clientName);
    setVal('updateClientNumber', found.clientNumber);
  }

  if (statusEl) {
    statusEl.textContent = `✅ Case "${found.caseNo || found.criminalCaseNumber}" loaded. Case Number and Year are locked. You can update other details below.`;
    statusEl.className = 'update-status-msg success';
  }
}

async function handleUpdateCaseSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const caseType = document.getElementById('updateCaseTypeDropdown')?.value;
  const statusEl = document.getElementById('updateSearchStatus');

  let caseNumber = '';
  if (caseType === 'criminal') {
    caseNumber = document.getElementById('updateCriminalCaseNumber')?.value?.trim();
  } else {
    caseNumber = document.getElementById('updateCaseNo')?.value?.trim();
  }

  if (!caseNumber) {
    alert('Please search and load a case before updating.');
    if (statusEl) {
      statusEl.textContent = 'Please search and load a case first.';
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  const caseIndex = allCaseRecords.findIndex(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === caseNumber.toLowerCase() || num2 === caseNumber.toLowerCase();
  });

  if (caseIndex === -1) {
    alert(`Case "${caseNumber}" was not found.`);
    return;
  }

  const targetCase = allCaseRecords[caseIndex];
  targetCase.caseType = caseType;

  if (caseType === 'criminal') {
    targetCase.policeStation = document.getElementById('updatePoliceStation')?.value || '';
    targetCase.crimeSection = document.getElementById('updateCrimeSection')?.value || '';
    targetCase.crimeFilingDate = document.getElementById('updateCrimeFilingDate')?.value || '';
    targetCase.crimeNumber = document.getElementById('updateCrimeNumber')?.value || '';
    targetCase.victimName = document.getElementById('updateVictimName')?.value || '';
    targetCase.accusedName = document.getElementById('updateAccusedName')?.value || '';
    targetCase.criminalCourtName = document.getElementById('updateCriminalCourtName')?.value || '';
    targetCase.courtName = targetCase.criminalCourtName;
    targetCase.criminalClientName = document.getElementById('updateCriminalClientName')?.value || '';
    targetCase.clientName = targetCase.criminalClientName;
    targetCase.criminalClientNumber = document.getElementById('updateCriminalClientNumber')?.value || '';
    targetCase.clientNumber = targetCase.criminalClientNumber;
    targetCase.caseName = `${targetCase.victimName} vs ${targetCase.accusedName}`;
    targetCase.partyName = targetCase.accusedName;
  } else {
    targetCase.filingDate = document.getElementById('updateFilingDate')?.value || '';
    targetCase.plaintiff = document.getElementById('updatePlaintiff')?.value || '';
    targetCase.defendant = document.getElementById('updateDefendant')?.value || '';
    targetCase.courtName = document.getElementById('updateCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateClientName')?.value || '';
    targetCase.clientNumber = document.getElementById('updateClientNumber')?.value || '';
    targetCase.caseName = `${targetCase.plaintiff} vs ${targetCase.defendant}`;
    targetCase.partyName = targetCase.defendant || targetCase.plaintiff;
  }

  // Update in live Supabase database
  await updateCaseInSupabase(caseNumber, caseType, targetCase);

  if (statusEl) {
    statusEl.textContent = `🎉 Case "${caseNumber}" updated successfully!`;
    statusEl.className = 'update-status-msg success';
  }

  alert(`Case ${caseNumber} details updated successfully!`);
}

// ==============================================================================
// Courts & Form Options
// ==============================================================================

const caseTypes = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'complaint', label: 'Complaint' }
];

function renderCaseTypeOptions() {
  const dropdowns = [
    document.getElementById('caseTypeDropdown'),
    document.getElementById('updateCaseTypeDropdown')
  ];

  dropdowns.forEach((dropdown) => {
    if (!dropdown) return;
    const currentVal = dropdown.value;
    dropdown.innerHTML = '<option value="">-- Select Case Type --</option>';
    caseTypes.forEach((caseType) => {
      const option = document.createElement('option');
      option.value = caseType.value;
      option.textContent = caseType.label;
      dropdown.appendChild(option);
    });
    if (currentVal) dropdown.value = currentVal;
  });
}

function renderCourtOptions() {
  const selects = [
    document.getElementById('courtName'),
    document.getElementById('updateCourtName')
  ];

  selects.forEach((courtSelect) => {
    if (!courtSelect) return;
    const currentVal = courtSelect.value;
    courtSelect.innerHTML = '<option value="">-- Select Court --</option>';
    courts.forEach((court) => {
      const option = document.createElement('option');
      option.value = court;
      option.textContent = court;
      courtSelect.appendChild(option);
    });
    if (currentVal) courtSelect.value = currentVal;
  });
}

function renderCourtsTable() {
  const tbody = document.querySelector('#courtsTable tbody');
  const countBadge = document.getElementById('courtsTotalCountBadge');
  if (countBadge) {
    countBadge.textContent = `${courts.length} Court${courts.length === 1 ? '' : 's'} Configured`;
  }
  if (!tbody) return;

  if (courts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-results">No courts configured yet. Add a court using the form above.</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  courts.forEach((court, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="court-index-badge">#${index + 1}</span></td>
      <td>
        <div class="court-name-cell">
          <span>🏛️</span>
          <span>${court}</span>
        </div>
      </td>
      <td>
        <div class="court-actions-cell">
          <button type="button" class="court-btn-edit edit-court">✏️ Edit</button>
          <button type="button" class="court-btn-delete delete-court">🗑️ Delete</button>
        </div>
      </td>
    `;

    const editBtn = row.querySelector('.edit-court');
    const deleteBtn = row.querySelector('.delete-court');

    editBtn.addEventListener('click', async () => {
      const newCourt = prompt('Edit court name:', court);
      if (newCourt && newCourt.trim() && newCourt.trim() !== court) {
        await editCourtInSupabase(court, newCourt.trim());
      }
    });

    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = confirm(`Delete court: "${court}"?`);
      if (confirmDelete) {
        await deleteCourtFromSupabase(court);
      }
    });

    tbody.appendChild(row);
  });
}

function renderCriminalCourtOptions() {
  const selects = [
    document.getElementById('criminalCourtName'),
    document.getElementById('updateCriminalCourtName')
  ];

  selects.forEach((criminalCourtSelect) => {
    if (!criminalCourtSelect) return;
    const currentVal = criminalCourtSelect.value;
    criminalCourtSelect.innerHTML = '<option value="">-- Select Court --</option>';
    courts.forEach((court) => {
      const option = document.createElement('option');
      option.value = court;
      option.textContent = court;
      criminalCourtSelect.appendChild(option);
    });
    if (currentVal) criminalCourtSelect.value = currentVal;
  });
}

function toggleCaseFormByType() {
  const selectedType = document.getElementById('caseTypeDropdown')?.value;
  const generalForm = document.getElementById('generalCaseForm');
  const criminalForm = document.getElementById('criminalCaseForm');

  if (!generalForm || !criminalForm) return;

  if (selectedType === 'criminal') {
    generalForm.classList.add('hidden-case-form');
    criminalForm.classList.remove('hidden-case-form');
    generalForm.querySelectorAll('input, select').forEach(field => {
      field.disabled = true;
    });
    criminalForm.querySelectorAll('input, select').forEach(field => {
      field.disabled = false;
    });
  } else {
    generalForm.classList.remove('hidden-case-form');
    criminalForm.classList.add('hidden-case-form');
    generalForm.querySelectorAll('input, select').forEach(field => {
      field.disabled = false;
    });
    criminalForm.querySelectorAll('input, select').forEach(field => {
      field.disabled = true;
    });
  }
}

function toggleUpdateCaseFormByType() {
  const selectedType = document.getElementById('updateCaseTypeDropdown')?.value;
  const generalForm = document.getElementById('updateGeneralCaseForm');
  const criminalForm = document.getElementById('updateCriminalCaseForm');

  if (!generalForm || !criminalForm) return;

  if (selectedType === 'criminal') {
    generalForm.classList.add('hidden-case-form');
    criminalForm.classList.remove('hidden-case-form');
    generalForm.querySelectorAll('input:not([readonly]), select').forEach(field => {
      field.disabled = true;
    });
    criminalForm.querySelectorAll('input:not([readonly]), select').forEach(field => {
      field.disabled = false;
    });
  } else {
    generalForm.classList.remove('hidden-case-form');
    criminalForm.classList.add('hidden-case-form');
    generalForm.querySelectorAll('input:not([readonly]), select').forEach(field => {
      field.disabled = false;
    });
    criminalForm.querySelectorAll('input:not([readonly]), select').forEach(field => {
      field.disabled = true;
    });
  }
}

// ==============================================================================
// App Initialization, Form Listeners, and Mobile Navigation
// ==============================================================================

function initializeApp() {
  if (window.__caseMgmtInitialized) return;
  window.__caseMgmtInitialized = true;

  // 1. Mobile Sidebar Navigation Drawer
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active', isOpen);
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Auto-close mobile drawer when tapping links on small screens
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterCaseTables(false));
  }

  const showAllCasesBtn = document.getElementById('showAllCasesBtn');
  if (showAllCasesBtn) {
    showAllCasesBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      filterCaseTables(true);
    });
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      filterCaseTables(false);
    });
  }

  const guestSearchInput = document.getElementById('guestSearch');
  if (guestSearchInput) {
    guestSearchInput.addEventListener('input', (event) => renderGuestTable(event.target.value));
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }

  const guestModeBtn = document.getElementById('guestModeBtn');
  if (guestModeBtn) {
    guestModeBtn.addEventListener('click', handleGuestLogin);
  }

  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', handleLogout);
  }

  const guestLogoutBtn = document.getElementById('guestLogoutBtn');
  if (guestLogoutBtn) {
    guestLogoutBtn.addEventListener('click', handleLogout);
  }

  const demoNote = document.getElementById('demoNote');
  if (demoNote) {
    demoNote.addEventListener('click', () => {
      const u = document.getElementById('username');
      const p = document.getElementById('password');
      if (u) u.value = 'admin';
      if (p) p.value = 'admin123';
      const err = document.getElementById('loginError');
      if (err) err.textContent = '';
    });
  }

  const loginUser = safeStorage.get('cmUser');
  if (loginUser === 'admin') {
    setActiveScreen('adminScreen');
  } else if (loginUser === 'guest') {
    renderGuestTable();
    setActiveScreen('guestScreen');
  } else {
    setActiveScreen('loginScreen');
  }

  // 2. Handle Add Case Form Submit (Live Supabase sync)
  document.querySelector('#add form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const caseType = document.getElementById('caseTypeDropdown')?.value || 'civil';
    
    let newCase = {};
    if (caseType === 'criminal') {
      const criminalCaseNumber = document.getElementById('criminalCaseNumber')?.value?.trim();
      const crimeYear = document.getElementById('crimeYear')?.value?.trim();
      const policeStation = document.getElementById('policeStation')?.value?.trim();
      const crimeSection = document.getElementById('crimeSection')?.value?.trim();
      const crimeFilingDate = document.getElementById('crimeFilingDate')?.value?.trim();
      const crimeNumber = document.getElementById('crimeNumber')?.value?.trim();
      const victimName = document.getElementById('victimName')?.value?.trim();
      const accusedName = document.getElementById('accusedName')?.value?.trim();
      const criminalCourtName = document.getElementById('criminalCourtName')?.value?.trim();
      const criminalClientName = document.getElementById('criminalClientName')?.value?.trim();
      const criminalClientNumber = document.getElementById('criminalClientNumber')?.value?.trim();

      newCase = {
        caseType: 'criminal',
        caseNo: criminalCaseNumber,
        caseYear: crimeYear,
        criminalCaseNumber,
        crimeYear,
        policeStation,
        crimeSection,
        crimeFilingDate,
        filingDate: crimeFilingDate,
        crimeNumber,
        victimName,
        accusedName,
        criminalCourtName,
        courtName: criminalCourtName,
        criminalClientName,
        clientName: criminalClientName,
        criminalClientNumber,
        clientNumber: criminalClientNumber,
        caseName: `${victimName} vs ${accusedName}`,
        partyName: accusedName,
        nextHearing: '—',
        caseStatus: 'Pending'
      };
    } else {
      const caseNo = document.getElementById('caseNo')?.value?.trim();
      const caseYear = document.getElementById('caseYear')?.value?.trim();
      const filingDate = document.getElementById('filingDate')?.value?.trim();
      const plaintiff = document.getElementById('plaintiff')?.value?.trim();
      const defendant = document.getElementById('defendant')?.value?.trim();
      const courtName = document.getElementById('courtName')?.value?.trim();
      const clientName = document.getElementById('clientName')?.value?.trim();
      const clientNumber = document.getElementById('clientNumber')?.value?.trim();

      newCase = {
        caseType,
        caseNo,
        caseYear,
        filingDate,
        plaintiff,
        defendant,
        courtName,
        clientName,
        clientNumber,
        caseName: `${plaintiff} vs ${defendant}`,
        partyName: defendant || plaintiff,
        nextHearing: '—',
        caseStatus: 'Pending'
      };
    }

    await addCaseToSupabase(newCase);
    this.reset();
    alert(`Case ${newCase.caseNo} added successfully!`);
  });

  // 3. Handle Update Case Form Submit (Live Supabase sync)
  const updateSearchBtn = document.getElementById('updateSearchBtn');
  const updateSearchInput = document.getElementById('updateSearchInput');

  if (updateSearchBtn) {
    updateSearchBtn.addEventListener('click', () => {
      loadCaseForUpdate(updateSearchInput?.value);
    });
  }

  if (updateSearchInput) {
    updateSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadCaseForUpdate(updateSearchInput.value);
      }
    });
  }

  const updateCaseForm = document.getElementById('updateCaseForm');
  if (updateCaseForm) {
    updateCaseForm.addEventListener('submit', handleUpdateCaseSubmit);
  }

  const updateCaseTypeDropdown = document.getElementById('updateCaseTypeDropdown');
  if (updateCaseTypeDropdown) {
    updateCaseTypeDropdown.addEventListener('change', toggleUpdateCaseFormByType);
  }

  // 4. Handle Delete Case Form (Live Supabase sync)
  const deleteCaseBtn = document.getElementById('deleteCaseBtn');
  const deleteCaseNoInput = document.getElementById('deleteCaseNo');
  const deleteStatus = document.getElementById('deleteStatus');

  if (deleteCaseBtn) {
    deleteCaseBtn.addEventListener('click', async () => {
      const caseNumber = deleteCaseNoInput?.value?.trim();
      if (!caseNumber) {
        if (deleteStatus) {
          deleteStatus.textContent = 'Please enter a Case Number to delete.';
          deleteStatus.className = 'update-status-msg error';
        }
        return;
      }

      const confirmDelete = confirm(`Are you sure you want to permanently delete case "${caseNumber}"?`);
      if (confirmDelete) {
        await deleteCaseFromSupabase(caseNumber);
        if (deleteCaseNoInput) deleteCaseNoInput.value = '';
        if (deleteStatus) {
          deleteStatus.textContent = `🗑️ Case "${caseNumber}" deleted successfully!`;
          deleteStatus.className = 'update-status-msg success';
        }
        alert(`Case ${caseNumber} deleted successfully!`);
      }
    });
  }

  // 5. Handle Update Hearing Form (Live Supabase sync)
  const updateHearingForm = document.getElementById('updateHearingForm');
  if (updateHearingForm) {
    updateHearingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const caseNumber = document.getElementById('hearingCaseNo')?.value?.trim();
      const hearingDate = document.getElementById('hearingDate')?.value;
      const process = document.getElementById('hearingProcess')?.value?.trim();
      const statusEl = document.getElementById('hearingStatus');

      if (!caseNumber || !hearingDate || !process) {
        if (statusEl) {
          statusEl.textContent = 'Please fill all hearing fields.';
          statusEl.className = 'update-status-msg error';
        }
        return;
      }

      await updateHearingInSupabase(caseNumber, hearingDate, process);

      const foundCase = allCaseRecords.find(c => {
        const num1 = (c.caseNo || '').toLowerCase();
        const num2 = (c.criminalCaseNumber || '').toLowerCase();
        return num1 === caseNumber.toLowerCase() || num2 === caseNumber.toLowerCase();
      });

      lastUpdatedHearingCase = foundCase ? { ...foundCase, nextHearing: hearingDate, hearingProcess: process } : { caseNo: caseNumber, nextHearing: hearingDate, hearingProcess: process };

      // Reveal WhatsApp notification card
      const waCard = document.getElementById('hearingWhatsAppSection');
      const waSummary = document.getElementById('whatsappClientSummary');
      if (waCard) {
        waCard.classList.remove('hidden');
        const cName = lastUpdatedHearingCase.clientName || lastUpdatedHearingCase.criminalClientName || 'Client';
        const cPhone = lastUpdatedHearingCase.clientNumber || lastUpdatedHearingCase.criminalClientNumber || 'Direct Phone';
        if (waSummary) {
          waSummary.textContent = `New hearing on ${formatDateDMY(hearingDate)} (${process}) saved for ${cName} (${cPhone}). Click below to notify via WhatsApp.`;
        }
      }

      updateHearingForm.reset();

      if (statusEl) {
        statusEl.textContent = `📅 Hearing for "${caseNumber}" set to ${formatDateDMY(hearingDate)} (${process}) successfully!`;
        statusEl.className = 'update-status-msg success';
      }

      alert(`Hearing for Case ${caseNumber} updated successfully!`);
    });
  }

  // Court mini buttons
  const addCourtBtn = document.getElementById('addCourtBtn');
  if (addCourtBtn) {
    addCourtBtn.addEventListener('click', () => {
      showTab('courts');
      setTimeout(() => {
        const courtInput = document.getElementById('courtInput');
        if (courtInput) courtInput.focus();
      }, 120);
    });
  }

  const addCriminalCourtBtn = document.getElementById('addCriminalCourtBtn');
  if (addCriminalCourtBtn) {
    addCriminalCourtBtn.addEventListener('click', () => {
      showTab('courts');
      setTimeout(() => {
        const courtInput = document.getElementById('courtInput');
        if (courtInput) courtInput.focus();
      }, 120);
    });
  }

  const updateAddCourtBtn = document.getElementById('updateAddCourtBtn');
  if (updateAddCourtBtn) {
    updateAddCourtBtn.addEventListener('click', () => {
      showTab('courts');
      setTimeout(() => {
        const courtInput = document.getElementById('courtInput');
        if (courtInput) courtInput.focus();
      }, 120);
    });
  }

  const updateAddCriminalCourtBtn = document.getElementById('updateAddCriminalCourtBtn');
  if (updateAddCriminalCourtBtn) {
    updateAddCriminalCourtBtn.addEventListener('click', () => {
      showTab('courts');
      setTimeout(() => {
        const courtInput = document.getElementById('courtInput');
        if (courtInput) courtInput.focus();
      }, 120);
    });
  }

  // 6. Handle Add Court Button (Live Supabase sync)
  const saveCourtBtn = document.getElementById('saveCourtBtn');
  if (saveCourtBtn) {
    saveCourtBtn.addEventListener('click', async () => {
      const input = document.getElementById('courtInput');
      const courtName = input?.value.trim();

      if (!courtName) {
        alert('Please enter a court name.');
        return;
      }

      if (!courts.includes(courtName)) {
        await addCourtToSupabase(courtName);
        input.value = '';

        const activeCaseType = document.getElementById('caseTypeDropdown')?.value;
        const courtSelect = document.getElementById(activeCaseType === 'criminal' ? 'criminalCourtName' : 'courtName');
        if (courtSelect) {
          courtSelect.value = courtName;
        }

        showTab('add');
        alert(`Court "${courtName}" added successfully!`);
      } else {
        alert('This court already exists.');
      }
    });
  }

  const caseTypeDropdownChange = document.getElementById('caseTypeDropdown');
  if (caseTypeDropdownChange) {
    caseTypeDropdownChange.addEventListener('change', toggleCaseFormByType);
  }

  // 7. Calendar View Navigation Listeners
  const prevMonthBtn = document.getElementById('calPrevMonthBtn');
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      let newMonth = currentCalendarMonth - 1;
      let newYear = currentCalendarYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      renderCalendarView(newYear, newMonth);
    });
  }

  const nextMonthBtn = document.getElementById('calNextMonthBtn');
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      let newMonth = currentCalendarMonth + 1;
      let newYear = currentCalendarYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      renderCalendarView(newYear, newMonth);
    });
  }

  const todayBtn = document.getElementById('calTodayBtn');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      renderCalendarView(now.getFullYear(), now.getMonth());
    });
  }

  const printCauseListBtn = document.getElementById('printCauseListBtn');
  if (printCauseListBtn) {
    printCauseListBtn.addEventListener('click', printDailyCauseList);
  }

  // 8. WhatsApp Action Listeners
  const sendWhatsAppHearingBtn = document.getElementById('sendWhatsAppHearingBtn');
  if (sendWhatsAppHearingBtn) {
    sendWhatsAppHearingBtn.addEventListener('click', () => {
      sendWhatsAppHearingNotice(lastUpdatedHearingCase);
    });
  }

  const detailWhatsAppBtn = document.getElementById('detailWhatsAppBtn');
  if (detailWhatsAppBtn) {
    detailWhatsAppBtn.addEventListener('click', () => {
      sendWhatsAppHearingNotice(currentSelectedCase);
    });
  }

  renderCaseTypeOptions();
  renderCourtOptions();
  renderCriminalCourtOptions();
  toggleCaseFormByType();
  toggleUpdateCaseFormByType();
  renderCourtsTable();
  renderCalendarView();
  fetchAllDataFromSupabase();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
