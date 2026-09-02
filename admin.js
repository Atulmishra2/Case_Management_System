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
const SUPABASE_URL = 'https://podehqyygbbabkimbcud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r8RXVVAf9UJfa9jtdamN_A_I5ZiDflg';

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
);

let supabaseClient = (isSupabaseConfigured && window.supabase?.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function ensureSupabaseClient() {
  if (!supabaseClient && isSupabaseConfigured && window.supabase?.createClient) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabaseClient;
    } catch (e) {
      console.warn('Supabase client creation error:', e);
    }
  }
  return supabaseClient;
}
window.ensureSupabaseClient = ensureSupabaseClient;

// Dataset arrays (hydrated live from Supabase or user entries)
const defaultFallbackCases = [];
let defaultCourts = [];
let courts = [];
let allCaseRecords = [];
let guestCases = [];
const defaultFallbackHearings = [];
let allHearingRecords = [];

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

function parseDateString(dateInput) {
  if (!dateInput || dateInput === '—' || dateInput === 'null' || dateInput === 'undefined') return null;
  const str = String(dateInput).trim();
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    return new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
  }
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

window.parseDateString = parseDateString;

function formatDateHindi(dateInput) {
  if (!dateInput || dateInput === '—' || dateInput === 'null' || dateInput === 'undefined') {
    return 'तय नहीं';
  }

  const str = String(dateInput).trim();
  if (!str || str === '—') return 'तय नहीं';

  const hindiMonths = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
  ];

  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = dmyMatch[3];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${hindiMonths[monthIdx]} ${year}`;
    }
    return `${day}/${dmyMatch[2]}/${year}`;
  }

  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const monthIdx = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${hindiMonths[monthIdx]} ${year}`;
    }
    return `${day}/${ymdMatch[2]}/${year}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const monthIdx = d.getMonth();
    const year = d.getFullYear();
    return `${day} ${hindiMonths[monthIdx]} ${year}`;
  }

  return str;
}

window.formatDateHindi = formatDateHindi;

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
  const remark = raw.remark || raw.remarks || raw.case_remark || '';
  const docLink = raw.doc_link || raw.document_link || raw.docLink || raw.doc_url || raw.documentUrl || '';

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
      remark,
      docLink,
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
    remark,
    docLink,
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
  ensureSupabaseClient();
  if (!supabaseClient && typeof window !== 'undefined') {
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (ensureSupabaseClient()) break;
    }
  }

  if (!supabaseClient) {
    console.log('Using local fallback data (Supabase not configured or CDN unreachable)');
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();
    refreshAllCaseTables();
    return;
  }

  try {
    const safeFetch = async (queryPromise, fallbackPromise = null) => {
      try {
        const res = await queryPromise;
        if (res && res.error && fallbackPromise) {
          return await fallbackPromise;
        }
        return res || { data: null, error: null };
      } catch (err) {
        if (fallbackPromise) {
          try { return await fallbackPromise; } catch (e) { /* ignore */ }
        }
        console.warn('Supabase query error:', err);
        return { data: null, error: err };
      }
    };

    // Fetch from civilcases, criminalcases, hearings, courts, and case_todos concurrently
    const [civilRes, criminalRes, hearingsRes, courtsRes, todosRes] = await Promise.all([
      safeFetch(supabaseClient.from('civilcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('civilcases').select('*')),
      safeFetch(supabaseClient.from('criminalcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('criminalcases').select('*')),
      safeFetch(supabaseClient.from('hearings').select('*').order('hearing_date', { ascending: false }), supabaseClient.from('hearings').select('*')),
      safeFetch(supabaseClient.from('courts').select('*').order('court_name'), supabaseClient.from('courts').select('*')),
      safeFetch(supabaseClient.from('case_todos').select('*').order('deadline_date', { ascending: true }), supabaseClient.from('case_todos').select('*'))
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

    // 3. Attach latest hearing dates from hearings table if available & store all hearing history
    if (hearingsRes.data && hearingsRes.data.length > 0) {
      allHearingRecords = hearingsRes.data;
      hearingsRes.data.forEach(h => {
        const matchingCase = loadedCases.find(c => (c.caseNo || '').toLowerCase() === (h.case_number || '').toLowerCase());
        if (matchingCase && (!matchingCase.nextHearing || matchingCase.nextHearing === '—')) {
          matchingCase.nextHearing = h.next_hearing_date || h.hearing_date;
          matchingCase.hearingProcess = h.process || matchingCase.hearingProcess;
        }
      });
    } else {
      allHearingRecords = [];
    }

    allCaseRecords = loadedCases;
    console.log(`Loaded ${allCaseRecords.length} cases from Supabase.`);

    // 4. Sync To-Do Tasks from case_todos
    if (todosRes && todosRes.data && !todosRes.error) {
      caseTasks = todosRes.data.map(t => ({
        id: t.id,
        caseNo: t.case_number,
        caseName: t.case_name || '—',
        taskTitle: t.task_title,
        hearingDate: t.hearing_date,
        deadlineDate: t.deadline_date,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        createdAt: t.created_at
      }));
      window.caseTasks = caseTasks;
      saveCaseTasksLocally();
      updateTodoSyncIndicator(true);
      console.log(`Loaded ${caseTasks.length} case tasks from Supabase.`);
    } else {
      updateTodoSyncIndicator(false);
    }

    refreshAllCaseTables();
  } catch (error) {
    console.error('Supabase live fetch error:', error);
    allCaseRecords = [];
    allHearingRecords = [];
    courts = [];
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();
    refreshAllCaseTables();
  }
}

// Add Case to Supabase (or local fallback)
async function addCaseToSupabase(newCase) {
  let dbInsertFailed = false;

  if (supabaseClient) {
    try {
      if (newCase.caseType === 'criminal') {
        const payload = {
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
        };
        let { error } = await supabaseClient.from('criminalcases').insert([{
          ...payload,
          doc_link: newCase.docLink || ''
        }]);
        // Fallback: retry without doc_link if column doesn't exist
        if (error && (error.message?.includes('doc_link') || error.code === 'PGRST204')) {
          const retryResult = await supabaseClient.from('criminalcases').insert([payload]);
          error = retryResult.error;
        }
        // Check for unique constraint violation (duplicate case number)
        if (error) {
          console.error('Supabase add criminal case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else {
        const payload = {
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
        };
        let { error } = await supabaseClient.from('civilcases').insert([{
          ...payload,
          doc_link: newCase.docLink || ''
        }]);
        // Fallback: retry without doc_link if column doesn't exist
        if (error && (error.message?.includes('doc_link') || error.code === 'PGRST204')) {
          const retryResult = await supabaseClient.from('civilcases').insert([payload]);
          error = retryResult.error;
        }
        // Check for unique constraint violation (duplicate case number)
        if (error) {
          console.error('Supabase add civil case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      }
    } catch (e) {
      console.error('Supabase add error:', e);
      dbInsertFailed = true;
    }
  }

  // Only add to in-memory records if DB insert succeeded (or DB not available)
  if (!dbInsertFailed) {
    allCaseRecords.unshift(newCase);
    refreshAllCaseTables();
  }
}

// Update Case in Supabase (or local fallback)
async function updateCaseInSupabase(originalCaseNumber, newCaseNumberOrType, caseTypeOrTarget, maybeTarget) {
  let originalNo = originalCaseNumber;
  let newCaseNumber = originalCaseNumber;
  let caseType = 'civil';
  let targetCase = null;

  if (typeof maybeTarget === 'object' && maybeTarget !== null) {
    newCaseNumber = newCaseNumberOrType;
    caseType = caseTypeOrTarget;
    targetCase = maybeTarget;
  } else {
    caseType = newCaseNumberOrType;
    targetCase = caseTypeOrTarget;
    newCaseNumber = targetCase?.caseNo || targetCase?.criminalCaseNumber || originalCaseNumber;
  }

  if (supabaseClient) {
    try {
      if (caseType === 'criminal') {
        const basePayload = {
          case_number: newCaseNumber,
          crime_year: parseInt(targetCase.caseYear || targetCase.crimeYear, 10) || 2026,
          police_station: targetCase.policeStation,
          crime_section: targetCase.crimeSection,
          crime_number: targetCase.crimeNumber,
          filing_date: targetCase.crimeFilingDate || targetCase.filingDate,
          victim_name: targetCase.victimName,
          accused_name: targetCase.accusedName,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          case_status: targetCase.caseStatus || 'Pending',
          updated_at: new Date().toISOString()
        };
        // Include next_hearing correction if provided
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        try {
          const { error } = await supabaseClient.from('criminalcases').update({
            ...basePayload,
            remark: targetCase.remark || '',
            doc_link: targetCase.docLink || ''
          }).eq('case_number', originalNo);

          if (error) {
            console.warn('Supabase criminal update error (retrying without optional columns):', error.message);
            // Fallback: retry with remark only (no doc_link)
            try {
              const fallback1 = { ...basePayload, remark: targetCase.remark || '' };
              const { error: err1 } = await supabaseClient.from('criminalcases').update(fallback1).eq('case_number', originalNo);
              if (err1) {
                // Fallback: retry with base payload only (no remark, no doc_link)
                console.warn('Supabase criminal update fallback1 error:', err1.message);
                await supabaseClient.from('criminalcases').update(basePayload).eq('case_number', originalNo);
              }
            } catch (innerErr) {
              await supabaseClient.from('criminalcases').update(basePayload).eq('case_number', originalNo);
            }
          }
        } catch (err) {
          await supabaseClient.from('criminalcases').update(basePayload).eq('case_number', originalNo);
        }
      } else {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          filing_date: targetCase.filingDate,
          plaintiff: targetCase.plaintiff,
          defendant: targetCase.defendant,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          case_status: targetCase.caseStatus || 'Pending',
          updated_at: new Date().toISOString()
        };
        // Include next_hearing correction if provided
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        try {
          const { error } = await supabaseClient.from('civilcases').update({
            ...basePayload,
            remark: targetCase.remark || '',
            doc_link: targetCase.docLink || ''
          }).eq('case_number', originalNo);

          if (error) {
            console.warn('Supabase civil update error (retrying without optional columns):', error.message);
            // Fallback: retry with remark only (no doc_link)
            try {
              const fallback1 = { ...basePayload, remark: targetCase.remark || '' };
              const { error: err1 } = await supabaseClient.from('civilcases').update(fallback1).eq('case_number', originalNo);
              if (err1) {
                // Fallback: retry with base payload only (no remark, no doc_link)
                console.warn('Supabase civil update fallback1 error:', err1.message);
                await supabaseClient.from('civilcases').update(basePayload).eq('case_number', originalNo);
              }
            } catch (innerErr) {
              await supabaseClient.from('civilcases').update(basePayload).eq('case_number', originalNo);
            }
          }
        } catch (err) {
          await supabaseClient.from('civilcases').update(basePayload).eq('case_number', originalNo);
        }
      }

      // If case number changed, cascade to hearings table
      if (originalNo.toLowerCase() !== newCaseNumber.toLowerCase()) {
        const { error: hError } = await supabaseClient.from('hearings')
          .update({ case_number: newCaseNumber })
          .eq('case_number', originalNo);
        if (hError) console.error('Supabase update hearings case_number error:', hError);
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
async function updateHearingInSupabase(caseNumber, hearingDate, process, actionTaken = '') {
  // Determine case type from allCaseRecords for proper tagging
  const matchedCase = allCaseRecords.find(c =>
    (c.caseNo || '').toLowerCase() === caseNumber.toLowerCase() ||
    (c.criminalCaseNumber || '').toLowerCase() === caseNumber.toLowerCase()
  );
  const caseType = matchedCase?.caseType || 'civil';
  const resolvedAction = actionTaken && actionTaken.trim() ? actionTaken.trim() : `Scheduled stage: ${process}`;

  const hearingPayload = {
    case_number: caseNumber,
    case_type: caseType,
    hearing_date: hearingDate,
    process: process,
    action_taken: resolvedAction
  };

  // --- Supabase: upsert (update existing or insert new) ---
  if (supabaseClient) {
    try {
      // Check if a hearing already exists for this case + date
      const { data: existing, error: fetchErr } = await supabaseClient
        .from('hearings')
        .select('id')
        .eq('case_number', caseNumber)
        .eq('hearing_date', hearingDate)
        .limit(1);

      if (fetchErr) {
        console.error('Supabase hearing lookup error:', fetchErr);
      }

      let dbError = null;
      if (existing && existing.length > 0) {
        // UPDATE existing hearing row
        const { error } = await supabaseClient.from('hearings')
          .update({ process: process, action_taken: resolvedAction })
          .eq('id', existing[0].id);
        dbError = error;
      } else {
        // INSERT new hearing row
        const { error } = await supabaseClient.from('hearings')
          .insert([hearingPayload]);
        dbError = error;
      }

      if (dbError) {
        console.error('Supabase hearing save error:', dbError);
        alert(`⚠️ Failed to save hearing to database: ${dbError.message || 'Unknown error'}. Changes saved locally only.`);
      } else {
        // Also update next_hearing and hearing_process on the case tables
        await Promise.all([
          supabaseClient.from('civilcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber),
          supabaseClient.from('criminalcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber)
        ]);
      }
    } catch (e) {
      console.error('Supabase hearing update error:', e);
      alert('⚠️ Hearing update encountered an error. Changes saved locally only.');
    }
  }

  // --- Local in-memory: prevent duplicate entries ---
  const existingLocalIdx = allHearingRecords.findIndex(h =>
    (h.case_number || '').toLowerCase() === caseNumber.toLowerCase() &&
    h.hearing_date === hearingDate
  );
  if (existingLocalIdx !== -1) {
    // Update existing local entry
    allHearingRecords[existingLocalIdx].process = process;
    allHearingRecords[existingLocalIdx].action_taken = `Scheduled stage: ${process}`;
    allHearingRecords[existingLocalIdx].case_type = caseType;
  } else {
    // Add new local entry
    allHearingRecords.unshift({
      ...hearingPayload,
      created_at: new Date().toISOString()
    });
  }

  // Update in-memory case record
  if (matchedCase) {
    if (matchedCase.nextHearing && matchedCase.nextHearing !== '—' && matchedCase.nextHearing !== hearingDate) {
      matchedCase.previousHearing = matchedCase.nextHearing;
      matchedCase.previousProcess = matchedCase.hearingProcess || '—';
    }
    matchedCase.nextHearing = hearingDate;
    matchedCase.hearingProcess = process;
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

  if (screenId === 'adminScreen') {
    restoreActiveAdminTab();
  }
}

function restoreActiveAdminTab() {
  let targetTab = 'home';
  const hash = (window.location.hash || '').replace(/^#/, '').trim();
  const storedTab = safeStorage.get('cmActiveTab') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cmActiveTab') : null);

  if (hash && document.getElementById(hash)) {
    targetTab = hash;
  } else if (storedTab && document.getElementById(storedTab)) {
    targetTab = storedTab;
  }

  showTab(targetTab, null, 'restore');
}
window.restoreActiveAdminTab = restoreActiveAdminTab;

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

function handleAdminLogout() {
  safeStorage.remove('cmUser');
  try {
    sessionStorage.removeItem('cmActiveTab');
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch (e) {}
  setActiveScreen('loginScreen');
  const form = document.getElementById('loginForm');
  if (form) form.reset();
  const errorBox = document.getElementById('loginError');
  if (errorBox) errorBox.textContent = '';
}

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

let tabNavigationHistory = [];
let tabForwardHistory = [];
let currentActiveTabId = 'home';

function showTab(tabId, event, navType = 'navigate') {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  // Handle history stacks
  if (navType === 'navigate') {
    if (currentActiveTabId && currentActiveTabId !== tabId) {
      tabNavigationHistory.push(currentActiveTabId);
      if (tabNavigationHistory.length > 40) tabNavigationHistory.shift();
      tabForwardHistory = []; // Reset forward history on new navigation
    }
  }

  currentActiveTabId = tabId;
  updateNavigationButtons();

  // Persist current active tab for page refresh retention
  try {
    safeStorage.set('cmActiveTab', tabId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cmActiveTab', tabId);
    }
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + tabId);
    }
  } catch (e) {}

  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  if (tabId === 'home') {
    renderHomeDashboard();
  }

  if (tabId === 'search') {
    filterCaseTables();
  }

  if (tabId === 'causelist') {
    initCauseListTab();
  }

  if (tabId === 'calendar') {
    renderCalendarView();
  }

  if (tabId === 'upcoming') {
    renderUpcomingWeekHearings();
  }

  if (tabId === 'todo') {
    populateTodoCaseDropdown();
    renderCaseTasks();
  }

  if (tabId === 'hearing') {
    populateHearingCaseDropdown();
  }

  if (tabId === 'dbmanager') {
    initDbManagerTab();
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

function goPreviousTab() {
  if (tabNavigationHistory.length > 0) {
    const previousTabId = tabNavigationHistory.pop();
    if (previousTabId) {
      if (currentActiveTabId) {
        tabForwardHistory.push(currentActiveTabId);
      }
      showTab(previousTabId, null, 'back');
    }
  }
}

function goForwardTab() {
  if (tabForwardHistory.length > 0) {
    const nextTabId = tabForwardHistory.pop();
    if (nextTabId) {
      if (currentActiveTabId) {
        tabNavigationHistory.push(currentActiveTabId);
      }
      showTab(nextTabId, null, 'forward');
    }
  }
}

function updateNavigationButtons() {
  const backBtn = document.getElementById('bottomNavBackBtn');
  const forwardBtn = document.getElementById('bottomNavForwardBtn');
  const homeBtn = document.getElementById('bottomNavHomeBtn');

  if (backBtn) {
    const hasBack = tabNavigationHistory.length > 0;
    backBtn.disabled = !hasBack;
    backBtn.classList.toggle('disabled', !hasBack);
  }

  if (forwardBtn) {
    const hasForward = tabForwardHistory.length > 0;
    forwardBtn.disabled = !hasForward;
    forwardBtn.classList.toggle('disabled', !hasForward);
  }

  if (homeBtn) {
    homeBtn.classList.toggle('active', currentActiveTabId === 'home');
  }
}

window.goPreviousTab = goPreviousTab;
window.goForwardTab = goForwardTab;
window.updateNavigationButtons = updateNavigationButtons;

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
// Case Full Details & History Rendering
// ==============================================================================

function getCaseHearingHistory(caseNumber) {
  if (!caseNumber) return [];
  const normalized = caseNumber.trim().toLowerCase();
  const list = allHearingRecords.filter(h => (h.case_number || '').trim().toLowerCase() === normalized);

  // Sort descending by hearing_date
  return list.sort((a, b) => {
    const da = new Date(a.hearing_date || a.created_at);
    const db = new Date(b.hearing_date || b.created_at);
    return db - da;
  });
}

function renderSelectedCaseDetails(caseObj) {
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

  const isCriminal = caseType === 'criminal';

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
  const caseHistory = getCaseHearingHistory(caseNumber);
  const currentNext = (caseObj.nextHearing && caseObj.nextHearing !== '—') ? caseObj.nextHearing : null;

  const prevHearings = caseHistory.filter(h => {
    if (currentNext && h.hearing_date === currentNext) return false;
    return true;
  });
  const latestPrev = prevHearings[0];
  const prevHearingDate = latestPrev ? latestPrev.hearing_date : (caseObj.previousHearing || null);
  const prevProcess = latestPrev ? latestPrev.process : (caseObj.previousProcess || null);

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
      ? '<span class="status-badge disposed">✅ Disposed Off</span>'
      : '<span class="status-badge pending">⏳ Pending</span>';
  }
  setVal('detailCaseRemark', caseObj.remark || caseObj.remarks || '—');

  const docLinkEl = document.getElementById('detailCaseDocLink');
  if (docLinkEl) {
    if (caseObj.docLink && caseObj.docLink.trim()) {
      docLinkEl.innerHTML = `<a href="${caseObj.docLink.trim()}" target="_blank" rel="noopener noreferrer" class="doc-link-pill">🔗 Open Document / Order Sheet ↗</a>`;
    } else {
      docLinkEl.textContent = '—';
    }
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

  const historyBtn = document.getElementById('detailHistoryBtn');
  if (historyBtn) {
    historyBtn.onclick = () => {
      openCaseHistoryModal(caseObj);
    };
  }

  const addTodoBtn = document.getElementById('searchAddTodoBtn');
  if (addTodoBtn) {
    addTodoBtn.style.display = 'inline-flex';
    addTodoBtn.onclick = () => {
      openTodoForCase(caseObj.caseNo || caseObj.criminalCaseNumber || '');
    };
  }
}

function openCaseHistoryModal(caseObj) {
  if (!caseObj) return;

  const modal = document.getElementById('caseHistoryModal');
  if (!modal) return;

  const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || '—';
  const caseName = caseObj.caseName || (caseObj.plaintiff ? `${caseObj.plaintiff} vs ${caseObj.defendant}` : (caseObj.victimName ? `${caseObj.victimName} vs ${caseObj.accusedName}` : '—'));
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
    modalNextHearingBadge.textContent = nextHearing !== '—' ? `${nextHearing} (${nextProcess})` : 'Not Scheduled';
    modalNextHearingBadge.className = `case-badge ${(caseObj.caseType || 'civil').toLowerCase()}`;
  }

  // Retrieve hearings for this case
  const history = getCaseHearingHistory(caseNumber);
  const currentNext = (caseObj.nextHearing && caseObj.nextHearing !== '—') ? caseObj.nextHearing : null;

  // Build unified hearing events list
  const events = [];

  // Add recorded hearings
  history.forEach(h => {
    const isNext = Boolean(currentNext && (h.hearing_date === currentNext || h.hearing_date === caseObj.nextHearing));
    events.push({
      date: h.hearing_date,
      process: h.process || '—',
      type: isNext ? 'next' : 'prev',
      action: h.action_taken || h.remarks || 'Court proceedings conducted.'
    });
  });

  // If case has next hearing not already present in events
  if (currentNext && !events.some(e => e.date === currentNext)) {
    events.push({
      date: currentNext,
      process: caseObj.hearingProcess || 'Scheduled Hearing',
      type: 'next',
      action: `Next hearing appearance at ${courtName}`
    });
  }

  // If case has previousHearing stored on case object not already present
  if (caseObj.previousHearing && caseObj.previousHearing !== '—' && !events.some(e => e.date === caseObj.previousHearing)) {
    events.push({
      date: caseObj.previousHearing,
      process: caseObj.previousProcess || 'Previous Stage',
      type: 'prev',
      action: `Previous proceedings recorded at ${courtName}`
    });
  }

  // Include filing date milestone if available
  const filingDate = caseObj.filingDate || caseObj.crimeFilingDate;
  if (filingDate && filingDate !== '—') {
    events.push({
      date: filingDate,
      process: 'Case Inception & Filing',
      type: 'filing',
      action: `Case instituted and registered at ${courtName}`
    });
  }

  // Sort events descending (newest first)
  events.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return db - da;
  });

  if (tbody) {
    if (events.length === 0) {
      tbody.innerHTML = '';
      if (emptyBox) emptyBox.classList.remove('hidden');
    } else {
      if (emptyBox) emptyBox.classList.add('hidden');
      tbody.innerHTML = events.map((ev, idx) => {
        let badgeHtml = '';
        if (ev.type === 'next') {
          badgeHtml = '<span class="history-badge-next">Upcoming Hearing</span>';
        } else if (ev.type === 'filing') {
          badgeHtml = '<span class="history-badge-filing">Initial Filing</span>';
        } else {
          badgeHtml = '<span class="history-badge-prev">Previous Hearing</span>';
        }

        return `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${formatDateDMY(ev.date)}</strong></td>
            <td><strong>${ev.process}</strong></td>
            <td>${badgeHtml}</td>
            <td>${ev.action}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Hook up update hearing button in modal
  const updateBtn = document.getElementById('modalUpdateHearingBtn');
  if (updateBtn) {
    updateBtn.onclick = () => {
      closeCaseHistoryModal();
      openUpdateHearingForCase(caseNumber);
    };
  }

  modal.classList.remove('hidden');
}

function closeCaseHistoryModal() {
  const modal = document.getElementById('caseHistoryModal');
  if (modal) modal.classList.add('hidden');
}

function openCaseHistoryModalByNo(caseNo) {
  if (!caseNo) return;
  const q = caseNo.trim().toLowerCase();
  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === q || num2 === q;
  });
  if (found) {
    openCaseHistoryModal(found);
  } else {
    alert(`Case "${caseNo}" details could not be found.`);
  }
}

window.openCaseHistoryModal = openCaseHistoryModal;
window.openCaseHistoryModalByNo = openCaseHistoryModalByNo;
window.closeCaseHistoryModal = closeCaseHistoryModal;
window.getCaseHearingHistory = getCaseHearingHistory;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'allCaseRecords', {
    get() { return allCaseRecords; },
    set(v) { allCaseRecords = v; },
    configurable: true
  });
  Object.defineProperty(window, 'allHearingRecords', {
    get() { return allHearingRecords; },
    set(v) { allHearingRecords = v; },
    configurable: true
  });
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

  const gDocEl = document.getElementById('gDetailDocLink');
  if (gDocEl) {
    if (caseObj.docLink && caseObj.docLink.trim()) {
      gDocEl.innerHTML = `<a href="${caseObj.docLink.trim()}" target="_blank" rel="noopener noreferrer" class="doc-link-pill">🔗 Open Document / Order Sheet ↗</a>`;
    } else {
      gDocEl.textContent = '—';
    }
  }
}

function renderGuestTable(searchText = '') {
  const tbody = document.querySelector('#guestCasesTable tbody');
  if (!tbody) return;

  const query = searchText.trim().toLowerCase();

  // Client Privacy Protection: Do not list all clients' records to public viewers by default
  if (!query) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-results" style="padding: 35px 20px; font-size: 14.5px; color: #475569;">🔒 <strong>Private Client Portal:</strong> Please enter your <strong>Case Number</strong> or <strong>Mobile Number</strong> above to securely view your hearing schedule.</td></tr>';
    renderGuestCaseDetails(null);
    return;
  }

  const filtered = allCaseRecords.filter((item) => {
    const haystack = [
      item.caseNo,
      item.criminalCaseNumber,
      item.clientNumber,
      item.criminalClientNumber,
      item.caseName,
      item.clientName,
      item.criminalClientName,
      item.plaintiff,
      item.defendant,
      item.victimName,
      item.accusedName,
      item.courtName
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-results" style="padding: 30px 15px;">❌ No case found matching "<strong>${searchText.trim()}</strong>". Please verify your Case Number or Mobile Number.</td></tr>`;
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

function populateHearingCaseDropdown(selectedCaseNoToInclude = '') {
  const select = document.getElementById('hearingCaseSelect');
  if (!select) return;

  const currentVal = selectedCaseNoToInclude || select.value || '';

  // Separate into undated and active dated cases
  const undatedCases = [];
  const datedCases = [];

  allCaseRecords.forEach(c => {
    const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
    if (isDisposed) return;
    const isDated = c.nextHearing && c.nextHearing !== '—' && c.nextHearing !== 'null' && c.nextHearing.trim() !== '';
    if (isDated) {
      datedCases.push(c);
    } else {
      undatedCases.push(c);
    }
  });

  // Sort both groups by case number
  const sortFn = (a, b) => {
    const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
    const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
    return numA.localeCompare(numB);
  };
  undatedCases.sort(sortFn);
  datedCases.sort(sortFn);

  let html = `<option value="">-- Choose Case from List (${allCaseRecords.length} Total) --</option>`;

  if (undatedCases.length > 0) {
    html += `<optgroup label="❓ Undated Cases (${undatedCases.length} Awaiting First Schedule)">`;
    undatedCases.forEach(c => {
      const caseNum = c.caseNo || c.criminalCaseNumber || '';
      const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
      const caseType = (c.caseType || 'civil').toUpperCase();
      html += `<option value="${escapeHtml(caseNum)}">❓ ${escapeHtml(caseNum)} — ${escapeHtml(caseName)} [${caseType}] (Undated)</option>`;
    });
    html += `</optgroup>`;
  }

  if (datedCases.length > 0) {
    html += `<optgroup label="📅 Active Cases to Forward Next Date (${datedCases.length} Listed)">`;
    datedCases.forEach(c => {
      const caseNum = c.caseNo || c.criminalCaseNumber || '';
      const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
      const caseType = (c.caseType || 'civil').toUpperCase();
      const curDateStr = formatDateDMY(c.nextHearing);
      html += `<option value="${escapeHtml(caseNum)}">📅 ${escapeHtml(caseNum)} — ${escapeHtml(caseName)} [${caseType}] (Current: ${curDateStr})</option>`;
    });
    html += `</optgroup>`;
  }

  select.innerHTML = html;

  if (currentVal) {
    select.value = currentVal;
  }
}

window.populateHearingCaseDropdown = populateHearingCaseDropdown;

function openUpdateHearingForCase(caseNo) {
  showTab('hearing');
  populateHearingCaseDropdown(caseNo);
  const caseInput = document.getElementById('hearingCaseNo');
  if (caseInput) {
    caseInput.value = caseNo;
  }
  const select = document.getElementById('hearingCaseSelect');
  if (select) {
    select.value = caseNo;
  }
  renderHearingCaseInfo(caseNo);
  setTimeout(() => {
    const dateInput = document.getElementById('hearingDate');
    if (dateInput) dateInput.focus();
  }, 100);
}

window.openUpdateHearingForCase = openUpdateHearingForCase;

function renderHearingCaseInfo(caseNo) {
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
  const prevDateDisp = document.getElementById('hearingPrevDateDisplay');

  if (!query) {
    setDisplayVal('hearingInfoCaseName', '—');
    setDisplayVal('hearingInfoCourt', '—');
    setDisplayVal('hearingInfoPrevDate', '—');
    setDisplayVal('hearingInfoPrevProcess', '—');
    if (prevDateDisp) prevDateDisp.textContent = '—';
    if (clientTag) clientTag.textContent = 'Client: —';
    if (elBadge) elBadge.style.display = 'none';
    updateHearingLivePreview();
    return;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === query || num2 === query;
  });

  if (!found) {
    setDisplayVal('hearingInfoCaseName', '— (Case not found)');
    setDisplayVal('hearingInfoCourt', '—');
    setDisplayVal('hearingInfoPrevDate', '—');
    setDisplayVal('hearingInfoPrevProcess', '—');
    if (prevDateDisp) prevDateDisp.textContent = 'Case Not Found';
    if (clientTag) clientTag.textContent = 'Client: —';
    if (elBadge) elBadge.style.display = 'none';
    updateHearingLivePreview();
    return;
  }

  const caseName = found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'));
  const courtName = found.courtName || found.criminalCourtName || 'District Court';
  const caseType = (found.caseType || 'civil').toUpperCase();
  const clientName = found.clientName || found.criminalClientName || 'Client';
  const clientNumber = found.clientNumber || found.criminalClientNumber || '';

  // Find previous hearing date and process from history
  const caseHistory = getCaseHearingHistory(found.caseNo || found.criminalCaseNumber || '');
  const currentNext = (found.nextHearing && found.nextHearing !== '—') ? found.nextHearing : null;

  const prevHearings = caseHistory.filter(h => {
    if (currentNext && h.hearing_date === currentNext) return false;
    return true;
  });
  const latestPrev = prevHearings[0];
  const prevDateRaw = latestPrev ? latestPrev.hearing_date : (found.previousHearing && found.previousHearing !== '—' ? found.previousHearing : null);
  const prevDate = prevDateRaw ? formatDateDMY(prevDateRaw) : (currentNext ? `${formatDateDMY(currentNext)} (Current Fixed Date)` : '— (First Hearing)');
  const prevProcess = latestPrev ? (latestPrev.process || '—') : (found.previousProcess || found.hearingProcess || '—');

  // Populate preview elements
  setDisplayVal('hearingInfoCaseName', caseName);
  setDisplayVal('hearingInfoCourt', courtName);
  setDisplayVal('hearingInfoPrevDate', prevDate);
  setDisplayVal('hearingInfoPrevProcess', prevProcess);

  if (prevDateDisp) {
    prevDateDisp.textContent = prevDateRaw ? formatDateDMY(prevDateRaw) : (currentNext ? formatDateDMY(currentNext) : 'First Hearing');
  }

  if (clientTag) {
    clientTag.textContent = `Client: ${clientName} ${clientNumber ? '(' + clientNumber + ')' : ''}`;
  }

  // Pre-fill stage if already set
  const processInput = document.getElementById('hearingProcess');
  if (processInput && !processInput.value && found.hearingProcess) {
    processInput.value = found.hearingProcess;
  }

  // Store reference for the "Edit Previous Date" button
  _editingPrevHearingCaseNo = found.caseNo || found.criminalCaseNumber || '';
  _editingPrevHearingRecord = latestPrev || null;

  // Reset edit mode
  const editEl  = document.getElementById('hearingInfoPrevDateEdit');
  const saveBtn = document.getElementById('savePrevDateBtn');
  const editBtn = document.getElementById('editPrevDateBtn');
  const dispEl  = document.getElementById('hearingInfoPrevDate');
  if (editEl)  editEl.style.display  = 'none';
  if (saveBtn) saveBtn.style.display = 'none';
  if (editBtn) { editBtn.textContent = '✏️ Edit Previous Date'; editBtn.title = 'Edit previous date'; }
  if (dispEl)  dispEl.style.display  = 'none';

  if (elBadge) {
    elBadge.style.display = 'inline-block';
    elBadge.textContent = caseType;
    elBadge.className = `case-badge ${(found.caseType || 'civil').toLowerCase()}`;
  }

  updateHearingLivePreview();
}

window.renderHearingCaseInfo = renderHearingCaseInfo;

// ── Quick Forward Next Date Preset Shortcut Handler ─────────────────────────
function setHearingDateOffset(daysOffset) {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  const dateInput = document.getElementById('hearingDate');
  if (dateInput) {
    dateInput.value = isoDate;
    updateHearingLivePreview();
  }
}

window.setHearingDateOffset = setHearingDateOffset;

// ── Quick Court Stage Preset Helper ─────────────────────────────────────────
function setHearingStagePreset(stageText) {
  const processInput = document.getElementById('hearingProcess');
  if (processInput) {
    processInput.value = stageText;
    updateHearingLivePreview();
  }
}

window.setHearingStagePreset = setHearingStagePreset;

// ── Live Hearing Progression Preview Updater ─────────────────────────────────
function updateHearingLivePreview() {
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

  const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)', 'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)', 'Saturday (शनिवार)'];
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
      intervalDisplay.textContent = '🎯 Today (आज)';
    } else if (diffDays === 1) {
      intervalDisplay.textContent = '⚡ Tomorrow (कल)';
    } else if (diffDays > 1) {
      intervalDisplay.textContent = `📅 In ${diffDays} Days (+${Math.round(diffDays / 7)} Wks)`;
    } else {
      intervalDisplay.textContent = `⚠️ Past Date (${Math.abs(diffDays)} Days ago)`;
    }
  }
}

window.updateHearingLivePreview = updateHearingLivePreview;

// ==============================================================================
// Edit Previous Hearing Date (in Update Hearing tab)
// ==============================================================================

// Track the hearing record currently being edited
let _editingPrevHearingCaseNo = null;
let _editingPrevHearingRecord = null;

function toggleEditPrevDate() {
  const displayEl = document.getElementById('hearingInfoPrevDate');
  const editEl    = document.getElementById('hearingInfoPrevDateEdit');
  const editBtn   = document.getElementById('editPrevDateBtn');
  const saveBtn   = document.getElementById('savePrevDateBtn');
  if (!displayEl || !editEl) return;

  const isEditing = editEl.style.display !== 'none';

  if (isEditing) {
    // Cancel – go back to display mode
    editEl.style.display = 'none';
    displayEl.style.display = '';
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) { editBtn.textContent = '✏️'; editBtn.title = 'Edit previous date'; }
  } else {
    // Enter edit mode – pre-fill with raw ISO date from the stored record
    const rawDate = _editingPrevHearingRecord ? (_editingPrevHearingRecord.hearing_date || '') : '';
    editEl.value = rawDate;
    editEl.style.display = '';
    displayEl.style.display = 'none';
    if (saveBtn) saveBtn.style.display = '';
    if (editBtn) { editBtn.textContent = '✕'; editBtn.title = 'Cancel edit'; }
  }
}
window.toggleEditPrevDate = toggleEditPrevDate;

async function savePrevDateEdit() {
  const editEl    = document.getElementById('hearingInfoPrevDateEdit');
  const displayEl = document.getElementById('hearingInfoPrevDate');
  const editBtn   = document.getElementById('editPrevDateBtn');
  const saveBtn   = document.getElementById('savePrevDateBtn');
  const caseNoEl  = document.getElementById('hearingCaseNo');

  if (!editEl || !editEl.value) {
    showToastNotification('⚠️ Please select a valid date first.', 2200);
    return;
  }

  const newDate  = editEl.value;           // YYYY-MM-DD
  const caseNo   = caseNoEl ? caseNoEl.value.trim() : (_editingPrevHearingCaseNo || '');

  if (!caseNo) {
    showToastNotification('⚠️ No case selected. Please load a case first.', 2200);
    return;
  }

  // Update in Supabase hearings table (update the most-recent past hearing for this case)
  if (supabaseClient && _editingPrevHearingRecord && _editingPrevHearingRecord.id) {
    try {
      const { error } = await supabaseClient
        .from('hearings')
        .update({ hearing_date: newDate })
        .eq('id', _editingPrevHearingRecord.id);
      if (error) console.error('Supabase prev date update error:', error);
    } catch (e) {
      console.error('Supabase prev date update exception:', e);
    }
  }

  // Update local allHearingRecords array
  if (_editingPrevHearingRecord) {
    _editingPrevHearingRecord.hearing_date = newDate;
  }

  // Refresh display
  const formatted = formatDateDMY(newDate);
  if (displayEl) {
    displayEl.value = formatted;
    displayEl.textContent = formatted;
  }

  // Return to read-only mode
  if (editEl)   editEl.style.display   = 'none';
  if (displayEl) displayEl.style.display = '';
  if (saveBtn)  saveBtn.style.display  = 'none';
  if (editBtn)  { editBtn.textContent = '✏️'; editBtn.title = 'Edit previous date'; }

  showToastNotification(`✅ Previous date for ${caseNo} updated to ${formatted}`, 2500);

  // Refresh tables so changed date reflects everywhere
  refreshAllCaseTables();
}
window.savePrevDateEdit = savePrevDateEdit;

// ==============================================================================
// Clipboard Copy & Toast Notifications
// ==============================================================================
function showToastNotification(message, duration = 2200) {
  let toast = document.getElementById('cmGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cmGlobalToast';
    toast.className = 'cm-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');

  if (toast.__timeout) clearTimeout(toast.__timeout);
  toast.__timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
window.showToastNotification = showToastNotification;

function fallbackCopyText(text) {
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

function copyCaseNumberToClipboard(caseNumber, triggerEl = null) {
  if (!caseNumber || caseNumber === '—') return;
  const cleanNo = caseNumber.trim();

  const showFeedback = () => {
    showToastNotification(`📋 Copied: ${cleanNo}`);
    if (triggerEl) {
      triggerEl.classList.add('copy-success-pulse');
      setTimeout(() => {
        triggerEl.classList.remove('copy-success-pulse');
      }, 500);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cleanNo).then(showFeedback).catch(() => {
      fallbackCopyText(cleanNo);
      showFeedback();
    });
  } else {
    fallbackCopyText(cleanNo);
    showFeedback();
  }
}
window.copyCaseNumberToClipboard = copyCaseNumberToClipboard;

function filterCaseTables(forceShowAll = false) {
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
  const selectedDate = (dateFilter?.value || '').trim().toLowerCase();

  const resultsTable = document.querySelector('#search .search-results-table');
  const resultsBody = resultsTable?.querySelector('tbody');

  const totalStatEl = document.getElementById('myCasesTotalStat');
  const pendingStatEl = document.getElementById('myCasesPendingStat');
  const todayStatEl = document.getElementById('myCasesTodayStat');
  const undatedStatEl = document.getElementById('myCasesUndatedStat');
  const disposedStatEl = document.getElementById('myCasesDisposedStat');

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = allCaseRecords.filter(c => !(c.caseStatus || '').toLowerCase().includes('dispose')).length;
  const disposedCount = allCaseRecords.filter(c => (c.caseStatus || '').toLowerCase().includes('dispose')).length;
  const todayCount = allCaseRecords.filter(c => c.nextHearing === todayStr).length;
  const undatedCount = allCaseRecords.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()).length;

  if (totalStatEl) totalStatEl.textContent = String(allCaseRecords.length);
  if (pendingStatEl) pendingStatEl.textContent = String(pendingCount);
  if (todayStatEl) todayStatEl.textContent = String(todayCount);
  if (undatedStatEl) undatedStatEl.textContent = String(undatedCount);
  if (disposedStatEl) disposedStatEl.textContent = String(disposedCount);

  let matches = allCaseRecords;

  // 1. Filter by Case Type
  if (selectedType) {
    matches = matches.filter(c => (c.caseType || 'civil').toLowerCase() === selectedType);
  }

  // 2. Filter by Court
  if (selectedCourt) {
    matches = matches.filter(c => {
      const courtVal = (c.courtName || c.criminalCourtName || '').trim().toLowerCase();
      return courtVal === selectedCourt;
    });
  }

  // 3. Filter by Case Status
  if (selectedStatus) {
    matches = matches.filter(c => {
      const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
      if (selectedStatus === 'disposed') return isDisposed;
      if (selectedStatus === 'pending') return !isDisposed;
      return true;
    });
  }

  // 4. Filter by Hearing Schedule
  if (selectedDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === 'today') {
      matches = matches.filter(c => c.nextHearing && c.nextHearing === todayStr);
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

  // 5. Filter by Search Query
  if (query) {
    matches = matches.filter(c => {
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
        c.clientNumber,
        c.criminalClientNumber,
        c.courtName,
        c.criminalCourtName,
        c.policeStation,
        c.crimeSection,
        c.crimeNumber,
        c.caseType,
        c.caseStatus,
        c.remark,
        c.hearingProcess
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  if (countBadge) {
    countBadge.textContent = `Showing ${matches.length} of ${allCaseRecords.length} Cases`;
  }

  if (matches.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="8" class="no-results">No cases found matching the specified filters. Try clearing or changing your filters.</td></tr>';
    renderSelectedCaseDetails(null);
    return;
  }

  resultsBody.innerHTML = '';
  matches.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = `clickable-row ${index === 0 ? 'selected-row' : ''}`;

    const caseNumber = item.caseNo || item.criminalCaseNumber || '—';
    const caseName = item.caseName || (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : (item.victimName ? `${item.victimName} vs ${item.accusedName}` : '—'));
    const courtName = item.courtName || item.criminalCourtName || '—';
    const clientName = item.clientName || item.criminalClientName || '—';
    const caseType = (item.caseType || 'civil').toLowerCase();
    const isDisposed = (item.caseStatus || '').toLowerCase().includes('dispose');
    const statusBadge = isDisposed
      ? '<span class="status-badge disposed">✅ Disposed</span>'
      : '<span class="status-badge pending">⏳ Pending</span>';
    const nextHearing = formatDateDMY(item.nextHearing);

    tr.innerHTML = `
      <td style="text-align: center;"><strong>${index + 1}</strong></td>
      <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
      <td>${escapeHtml(caseName)}</td>
      <td>${escapeHtml(clientName)}</td>
      <td><span class="case-badge ${caseType}">${caseType.toUpperCase()}</span></td>
      <td>${escapeHtml(courtName)}</td>
      <td>${statusBadge}</td>
      <td><strong>${nextHearing}</strong></td>
    `;

    const caseNumTd = tr.children ? tr.children[1] : (tr.querySelectorAll ? tr.querySelectorAll('td')[1] : null);
    if (caseNumTd && typeof caseNumTd.addEventListener === 'function') {
      caseNumTd.addEventListener('dblclick', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        copyCaseNumberToClipboard(caseNumber, caseNumTd);
      });
    }

    tr.addEventListener('click', () => {
      resultsBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
      tr.classList.add('selected-row');
      renderSelectedCaseDetails(item);
    });

    resultsBody.appendChild(tr);
  });

  renderSelectedCaseDetails(matches[0]);
}

window.filterCaseTables = filterCaseTables;

function setQuickCaseFilter(filterType, evt = null) {
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

  // Update quick chip active states
  const chips = document.querySelectorAll('.quick-filter-chip');
  chips.forEach(chip => chip.classList.remove('active'));

  const activeEvt = evt || (typeof window !== 'undefined' && window.event ? window.event : null);
  if (activeEvt && activeEvt.target && activeEvt.target.classList && activeEvt.target.classList.contains('quick-filter-chip')) {
    activeEvt.target.classList.add('active');
  } else if (filterType === 'all' && chips[0]) {
    chips[0].classList.add('active');
  }

  filterCaseTables();
}

window.setQuickCaseFilter = setQuickCaseFilter;

// ==============================================================================
// My Daily Cause List & Court Appearance Board Engine
// ==============================================================================

let currentCauseListDate = '';
let currentCauseListCourt = '';

function initCauseListTab() {
  const dateInput = document.getElementById('causeListDateInput');
  const courtSelect = document.getElementById('causeListCourtFilterSelect');

  if (!currentCauseListDate) {
    currentCauseListDate = new Date().toISOString().split('T')[0];
  }
  if (dateInput) {
    dateInput.value = currentCauseListDate;
  }

  // Populate court options for cause list filter
  if (courtSelect) {
    const prevVal = courtSelect.value || '';
    courtSelect.innerHTML = '<option value="">🏛️ All Courts</option>';
    courts.forEach(court => {
      const opt = document.createElement('option');
      opt.value = court;
      opt.textContent = court;
      courtSelect.appendChild(opt);
    });
    if (prevVal) courtSelect.value = prevVal;
  }

  renderCauseListTable(currentCauseListDate, courtSelect ? courtSelect.value : '');
}

window.initCauseListTab = initCauseListTab;

function setCauseListDateOffset(daysOffset) {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  currentCauseListDate = `${yyyy}-${mm}-${dd}`;

  const dateInput = document.getElementById('causeListDateInput');
  if (dateInput) {
    dateInput.value = currentCauseListDate;
  }

  const courtSelect = document.getElementById('causeListCourtFilterSelect');
  renderCauseListTable(currentCauseListDate, courtSelect ? courtSelect.value : '');
}

window.setCauseListDateOffset = setCauseListDateOffset;

function renderCauseListTable(dateVal = currentCauseListDate, courtFilter = '') {
  if (!dateVal) {
    dateVal = new Date().toISOString().split('T')[0];
  }
  currentCauseListDate = dateVal;
  currentCauseListCourt = (courtFilter || '').trim().toLowerCase();

  const tbody = document.getElementById('causeListTableBody');
  const bannerDateText = document.getElementById('causeListBannerDateText');
  const bannerDayName = document.getElementById('causeListBannerDayName');

  const totalBadge = document.getElementById('causeListTotalBadge');
  const civilBadge = document.getElementById('causeListCivilBadge');
  const criminalBadge = document.getElementById('causeListCriminalBadge');
  const revenueBadge = document.getElementById('causeListRevenueBadge');
  const navBadge = document.getElementById('causeListNavCount');

  // Format date readable
  const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)', 'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)', 'Saturday (शनिवार)'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = dateVal.split('-');
  const dtObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dayName = daysOfWeek[dtObj.getDay()];
  const formattedLong = `${parseInt(parts[2], 10)} ${months[dtObj.getMonth()]} ${parts[0]}`;

  if (bannerDateText) bannerDateText.textContent = `Daily Listed Matters — ${formattedLong}`;
  if (bannerDayName) bannerDayName.textContent = `Court Day: ${dayName}`;

  // Find all cases listed for this date
  let listedCases = allCaseRecords.filter(c => {
    return c.nextHearing === dateVal;
  });

  // Filter by court if selected
  if (currentCauseListCourt) {
    listedCases = listedCases.filter(c => {
      const ct = (c.courtName || c.criminalCourtName || '').trim().toLowerCase();
      return ct === currentCauseListCourt;
    });
  }

  // Update stats
  const civilCount = listedCases.filter(c => (c.caseType || 'civil') === 'civil').length;
  const criminalCount = listedCases.filter(c => (c.caseType || '') === 'criminal').length;
  const revenueCount = listedCases.filter(c => (c.caseType || '') === 'revenue').length;

  if (totalBadge) totalBadge.textContent = `${listedCases.length} Total Matters Listed`;
  if (civilBadge) civilBadge.textContent = `${civilCount} Civil`;
  if (criminalBadge) criminalBadge.textContent = `${criminalCount} Criminal`;
  if (revenueBadge) revenueBadge.textContent = `${revenueCount} Revenue`;

  // Update sidebar today count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayListedCount = allCaseRecords.filter(c => c.nextHearing === todayStr).length;
  if (navBadge) navBadge.textContent = String(todayListedCount);

  if (!tbody) return;

  if (listedCases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="no-results" style="padding: 24px;">
          🎉 No court appearances scheduled for <strong>${formattedLong}</strong> (${dayName.split(' ')[0]}).
          <br><small style="color:#64748b; margin-top:4px; display:inline-block;">Select a different date above or pick a preset.</small>
        </td>
      </tr>
    `;
    return;
  }

  // Sort by court name and then case number
  listedCases.sort((a, b) => {
    const courtA = (a.courtName || a.criminalCourtName || '').toUpperCase();
    const courtB = (b.courtName || b.criminalCourtName || '').toUpperCase();
    if (courtA !== courtB) return courtA.localeCompare(courtB);
    const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
    const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
    return numA.localeCompare(numB);
  });

  let html = '';
  listedCases.forEach((c, idx) => {
    const caseNumber = c.caseNo || c.criminalCaseNumber || '—';
    const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
    const courtName = c.courtName || c.criminalCourtName || 'District Court';
    const caseType = (c.caseType || 'civil').toLowerCase();
    const stage = c.hearingProcess || c.process || 'Scheduled Hearing';
    const clientName = c.clientName || c.criminalClientName || 'Client';
    const clientPhone = c.clientNumber || c.criminalClientNumber || '';

    html += `
      <tr>
        <td style="text-align: center;"><span class="court-index-badge">#${idx + 1}</span></td>
        <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
        <td><strong>${escapeHtml(caseName)}</strong></td>
        <td><span class="case-badge ${caseType}">${caseType.toUpperCase()}</span></td>
        <td>🏛️ ${escapeHtml(courtName)}</td>
        <td><span style="font-weight:600; color:#1e40af;">${escapeHtml(stage)}</span></td>
        <td>
          <div>${escapeHtml(clientName)}</div>
          ${clientPhone ? `<small style="color:#64748b;">📞 ${escapeHtml(clientPhone)}</small>` : ''}
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View case proceedings history">📜 Details</button>
          <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward next hearing date">📅 Forward Date</button>
          <button type="button" class="whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="Send WhatsApp court notice to client">💬</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

window.renderCauseListTable = renderCauseListTable;

function sendDailyCauseListWhatsApp() {
  const dateVal = currentCauseListDate || new Date().toISOString().split('T')[0];
  const listedCases = allCaseRecords.filter(c => c.nextHearing === dateVal);

  if (listedCases.length === 0) {
    alert(`No court hearings are scheduled for ${formatDateDMY(dateVal)}.`);
    return;
  }

  let msg = `*⚖️ CHAMBERS OF ATUL KUMAR MISHRA*\n`;
  msg += `*DAILY COURT APPEARANCE BOARD / CAUSE LIST*\n`;
  msg += `📅 *Date:* ${formatDateDMY(dateVal)}\n`;
  msg += `📋 *Total Matters:* ${listedCases.length}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  listedCases.forEach((c, idx) => {
    const num = c.caseNo || c.criminalCaseNumber || 'Case';
    const title = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
    const court = c.courtName || c.criminalCourtName || 'District Court';
    const stage = c.hearingProcess || 'Scheduled Hearing';
    const client = c.clientName || c.criminalClientName || '';

    msg += `*${idx + 1}. [${(c.caseType || 'Civil').toUpperCase()}] ${num}*\n`;
    msg += `   • *Parties:* ${title}\n`;
    msg += `   • *Court:* ${court}\n`;
    msg += `   • *Stage:* ${stage}\n`;
    if (client) msg += `   • *Client:* ${client}\n`;
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Advocate Atul Kumar Mishra_\nChambers & Legal Consultancy`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

window.sendDailyCauseListWhatsApp = sendDailyCauseListWhatsApp;


// ==============================================================================
// Executive Home Dashboard Engine
// ==============================================================================

function renderHomeDashboard() {
  const greetingEl = document.getElementById('homeHeroGreeting');
  const dateEl = document.getElementById('homeHeroDate');

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

  // 1. Dynamic Greeting
  const now = new Date();
  const hours = now.getHours();
  let timeGreeting = 'Good Day';
  if (hours < 12) timeGreeting = 'Good Morning';
  else if (hours < 17) timeGreeting = 'Good Afternoon';
  else timeGreeting = 'Good Evening';

  const daysOfWeek = ['Sunday (रविवार)', 'Monday (सोमवार)', 'Tuesday (मंगलवार)', 'Wednesday (बुधवार)', 'Thursday (गुरुवार)', 'Friday (शुक्रवार)', 'Saturday (शनिवार)'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = daysOfWeek[now.getDay()];
  const formattedDate = `${dayName}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  if (greetingEl) greetingEl.textContent = `${timeGreeting}, Advocate Atul Mishra`;
  if (dateEl) dateEl.textContent = `${formattedDate} • Chambers Legal Practice Management`;
  if (todayBoardDate) todayBoardDate.textContent = `Appearances for ${dayName.split(' ')[0]}, ${now.getDate()} ${months[now.getMonth()]}`;

  // 2. Calculations & Robust Date Matching
  const todayStr = now.toISOString().split('T')[0];
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = weekAhead.toISOString().split('T')[0];

  const totalCount = allCaseRecords.length;
  const civilCount = allCaseRecords.filter(c => (c.caseType || 'civil').toLowerCase() === 'civil').length;
  const criminalCount = allCaseRecords.filter(c => (c.caseType || '').toLowerCase() === 'criminal').length;
  const revenueCount = allCaseRecords.filter(c => (c.caseType || '').toLowerCase() === 'revenue').length;

  const todayCases = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
    const str = String(c.nextHearing).trim();
    if (str === todayStr) return true;

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

  const upcomingCases = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
    return c.nextHearing >= todayStr && c.nextHearing <= weekAheadStr;
  });

  const disposedCount = allCaseRecords.filter(c => (c.caseStatus || '').toLowerCase().includes('dispose')).length;
  const pendingCount = totalCount - disposedCount;
  const undatedCount = allCaseRecords.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()).length;

  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const disposedPercent = totalCount > 0 ? Math.round((disposedCount / totalCount) * 100) : 0;

  // 3. Update KPI Card Values
  if (totalEl) totalEl.textContent = String(totalCount);
  if (breakdownEl) breakdownEl.innerHTML = `<span>${civilCount} Civil</span> • <span>${criminalCount} Criminal</span> • <span>${revenueCount} Revenue</span>`;
  if (todayEl) todayEl.textContent = String(todayCases.length);
  if (upcomingEl) upcomingEl.textContent = String(upcomingCases.length);
  if (pendingEl) pendingEl.textContent = String(pendingCount);
  if (pendingPercentEl) pendingPercentEl.textContent = `${pendingPercent}% of total caseload`;
  if (undatedEl) undatedEl.textContent = String(undatedCount);
  if (disposedEl) disposedEl.textContent = String(disposedCount);
  if (disposedPercentEl) disposedPercentEl.textContent = `${disposedPercent}% Resolution Rate`;

  // 4. Update Shortcuts
  if (shortcutCivil) shortcutCivil.textContent = `${civilCount} Cases`;
  if (shortcutCriminal) shortcutCriminal.textContent = `${criminalCount} Cases`;
  if (shortcutRevenue) shortcutRevenue.textContent = `${revenueCount} Cases`;

  // 5. Populate Today's Court Appearance Board Table
  if (todayTbody) {
    if (todayCases.length === 0) {
      todayTbody.innerHTML = `
        <tr>
          <td colspan="7" class="no-results" style="padding: 24px;">
            🎉 No court hearings are listed for today (${dayName.split(' ')[0]}).
            <br><small style="color: #64748b; margin-top: 6px; display: inline-block;">
              <a href="javascript:void(0);" onclick="showTab('upcoming')" style="color: #2563eb; font-weight: 600;">View upcoming week appearances ➔</a>
            </small>
          </td>
        </tr>
      `;
    } else {
      // Sort by court name and then case number
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
        const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
        const courtName = c.courtName || c.criminalCourtName || 'District Court';
        const caseType = (c.caseType || 'civil').toLowerCase();
        const stage = c.hearingProcess || c.process || 'Listed Hearing';
        const clientName = c.clientName || c.criminalClientName || '—';
        const clientPhone = c.clientNumber || c.criminalClientNumber || '';

        html += `
          <tr>
            <td style="text-align: center;"><span class="court-index-badge">#${idx + 1}</span></td>
            <td class="copyable-case-no" title="Double-click to copy Case Number">
              <strong>${escapeHtml(caseNumber)}</strong>
              <div><span class="case-badge ${caseType}" style="font-size: 9px; padding: 1px 6px;">${caseType.toUpperCase()}</span></div>
            </td>
            <td><strong>${escapeHtml(caseName)}</strong></td>
            <td>🏛️ ${escapeHtml(courtName)}</td>
            <td><span style="color: #1e40af; font-weight: 700;">${escapeHtml(stage)}</span></td>
            <td>
              <div>${escapeHtml(clientName)}</div>
              ${clientPhone ? `<small style="color: #64748b;">📞 ${escapeHtml(clientPhone)}</small>` : ''}
            </td>
            <td style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View proceedings details">📜</button>
              <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward next hearing date">📅 Forward</button>
              <button type="button" class="whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="WhatsApp notice to client">💬</button>
            </td>
          </tr>
        `;
      });
      todayTbody.innerHTML = html;
    }
  }

  // 6. Populate Priority Tasks Widget
  if (tasksContainer) {
    const pendingTasks = (caseTasks || []).filter(t => (t.status || '').toLowerCase() !== 'done');
    if (pendingTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="home-empty-tasks">
          <span>🎉</span>
          <p>All tasks and deadlines are up-to-date.</p>
          <button type="button" class="primary-btn" style="margin-top: 6px; padding: 6px 12px; font-size: 12px;" onclick="showTab('todo')">➕ Add New Task</button>
        </div>
      `;
    } else {
      let taskHtml = '';
      pendingTasks.slice(0, 5).forEach(t => {
        const isUrgent = (t.priority || '').toLowerCase() === 'high';
        const priorityBadge = isUrgent
          ? '<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">URGENT</span>'
          : '<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">TASK</span>';

        taskHtml += `
          <div class="home-task-card">
            <div class="home-task-info">
              <div style="display: flex; align-items: center; gap: 6px;">
                ${priorityBadge}
                <span class="home-task-title">${escapeHtml(t.taskTitle || t.task || 'Legal Action')}</span>
              </div>
              <span class="home-task-meta">Case: <strong>${escapeHtml(t.caseNo || 'General')}</strong> • Due: ${formatDateDMY(t.deadlineDate || t.deadline)}</span>
            </div>
            <button type="button" class="table-view-btn" onclick="showTab('todo')" title="Manage task">Manage</button>
          </div>
        `;
      });
      tasksContainer.innerHTML = taskHtml;
    }
  }
}

window.renderHomeDashboard = renderHomeDashboard;

// ==============================================================================
// Dashboard Tables Rendering
// ==============================================================================

function renderCivilCasesTable(cases = null) {
  const tbody = document.querySelector('#civilCasesTable tbody');
  const countEl = document.getElementById('civilCount');
  if (!tbody) return;

  const list = cases || allCaseRecords.filter(c => c.caseType === 'civil');

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-results">No civil cases found.</td></tr>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  tbody.innerHTML = list.map((item) => {
    const caseNumber = getSafeValue(item.caseNo || item.case_number, '—');
    const caseName = getSafeValue(item.caseName || (item.plaintiff ? `${item.plaintiff} vs ${item.defendant}` : '—'), '—');
    const clientName = getSafeValue(item.clientName || item.client, '—');
    const nextHearing = formatDateDMY(item.nextHearing);
    const filingDate = formatDateDMY(item.filingDate);
    const isDisposed = (item.caseStatus || '').toLowerCase().includes('dispose');
    const statusBadge = isDisposed
      ? '<span class="status-badge disposed">✅ Disposed</span>'
      : '<span class="status-badge pending">⏳ Pending</span>';

    return `
      <tr>
        <td><strong>${caseNumber}</strong></td>
        <td>${caseName}</td>
        <td>${clientName}</td>
        <td>${statusBadge}</td>
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
      criminalTable.innerHTML = '<tr><td colspan="5" class="no-results">No criminal cases found.</td></tr>';
    } else {
      criminalTable.innerHTML = criminalCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed">✅ Disposed</span>'
          : '<span class="status-badge pending">⏳ Pending</span>';
        return `
          <tr>
            <td><strong>${c.caseNo || c.criminalCaseNumber}</strong></td>
            <td>${c.caseName || `${c.victimName} vs ${c.accusedName}`}</td>
            <td>${c.criminalClientName || c.clientName || '—'}</td>
            <td>${statusBadge}</td>
            <td>${formatDateDMY(c.nextHearing)}</td>
          </tr>
        `;
      }).join('');
    }
  }
  if (criminalCountEl) criminalCountEl.textContent = String(criminalCases.length);

  // 3. Revenue Cases Table & Count
  const revenueTable = document.querySelector('#revenueCasesTable tbody');
  const revenueCountEl = document.getElementById('revenueCount');
  const revenueCases = allCaseRecords.filter(c => c.caseType === 'revenue');
  if (revenueTable) {
    if (revenueCases.length === 0) {
      revenueTable.innerHTML = '<tr><td colspan="5" class="no-results">No revenue cases found.</td></tr>';
    } else {
      revenueTable.innerHTML = revenueCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed">✅ Disposed</span>'
          : '<span class="status-badge pending">⏳ Pending</span>';
        return `
          <tr>
            <td><strong>${c.caseNo}</strong></td>
            <td>${c.caseName || `${c.plaintiff} vs ${c.defendant}`}</td>
            <td>${c.clientName || '—'}</td>
            <td>${statusBadge}</td>
            <td>${formatDateDMY(c.nextHearing)}</td>
          </tr>
        `;
      }).join('');
    }
  }
  if (revenueCountEl) revenueCountEl.textContent = String(revenueCases.length);

  // 4. Disposed Cases Table & Count
  const disposedCases = allCaseRecords.filter(c => (c.caseStatus || '').toLowerCase().includes('dispose'));
  const disposedCountEl = document.getElementById('disposedCount');
  const disposedTable = document.querySelector('#disposedCasesTable tbody');
  if (disposedCountEl) disposedCountEl.textContent = String(disposedCases.length);
  if (disposedTable) {
    if (disposedCases.length === 0) {
      disposedTable.innerHTML = '<tr><td colspan="7" class="no-results">No disposed cases recorded yet.</td></tr>';
    } else {
      disposedTable.innerHTML = disposedCases.map(c => `
        <tr>
          <td><strong>${c.caseNo || c.criminalCaseNumber}</strong></td>
          <td>${c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : `${c.victimName} vs ${c.accusedName}`)}</td>
          <td>${c.clientName || c.criminalClientName || '—'}</td>
          <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
          <td>${c.courtName || c.criminalCourtName || 'District Court'}</td>
          <td><span class="status-badge disposed">✅ Disposed</span></td>
          <td>${c.remark || c.remarks || '—'}</td>
        </tr>
      `).join('');
    }
  }

  // 5. Undated Cases Table & Count (With Direct Update Hearing Action)
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

  // 6. All Cases Combined Table
  const allCasesTable = document.querySelector('#allCasesTable tbody');
  if (allCasesTable) {
    if (allCaseRecords.length === 0) {
      allCasesTable.innerHTML = '<tr><td colspan="7" class="no-results">No cases registered.</td></tr>';
    } else {
      allCasesTable.innerHTML = allCaseRecords.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed">✅ Disposed</span>'
          : '<span class="status-badge pending">⏳ Pending</span>';
        return `
          <tr>
            <td><strong>${c.caseNo || c.criminalCaseNumber}</strong></td>
            <td>${c.caseName}</td>
            <td>${c.clientName}</td>
            <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
            <td>${statusBadge}</td>
            <td>${formatDateDMY(c.filingDate || c.crimeFilingDate)}</td>
            <td>${formatDateDMY(c.nextHearing)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // 7. Render Upcoming Hearings (Next 7 Days)
  renderUpcomingWeekHearings();

  // 8. Guest Mode Table
  renderGuestTable();

  // 9. Home Executive Dashboard
  renderHomeDashboard();

  // 10. My Cases Filter Table
  filterCaseTables();

  // 11. My Daily Cause List
  renderCauseListTable();

  // 12. Interactive Calendar Scheduler
  renderCalendarView();

  // 10. Populate Hearing Case Dropdown
  populateHearingCaseDropdown();

  // 11. To-Do Tasks & Counters
  populateTodoCaseDropdown();
  updateTodoCounters();
  const todoTab = document.getElementById('todo');
  if (todoTab && todoTab.classList && typeof todoTab.classList.contains === 'function' && todoTab.classList.contains('active')) {
    renderCaseTasks();
  }
}

function exportAllCasesToCSV() {
  if (!allCaseRecords || allCaseRecords.length === 0) {
    alert('No cases available to export.');
    return;
  }

  const headers = [
    'Sr No',
    'Case Number',
    'Year',
    'Case Type',
    'Case Name',
    'Court Name',
    'Party Name',
    'Client Name',
    'Client Phone',
    'Filing Date',
    'Next Hearing Date',
    'Hearing Process / Stage',
    'Case Status',
    'Remarks',
    'Document Link'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = allCaseRecords.map((c, idx) => {
    const caseNum = c.caseNo || c.criminalCaseNumber || '';
    const caseYear = c.caseYear || c.crimeYear || '';
    const caseType = (c.caseType || 'civil').toUpperCase();
    const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
    const court = c.courtName || c.criminalCourtName || '';
    const party = c.partyName || c.defendant || c.accusedName || c.plaintiff || '';
    const client = c.clientName || c.criminalClientName || '';
    const phone = c.clientNumber || c.criminalClientNumber || '';
    const filing = formatDateDMY(c.filingDate || c.crimeFilingDate);
    const hearing = formatDateDMY(c.nextHearing);
    const stage = c.hearingProcess || c.process || '';
    const status = (c.caseStatus || '').toLowerCase().includes('dispose') ? 'Disposed Off' : 'Pending';
    const remark = c.remark || c.remarks || '';
    const docLink = c.docLink || c.doc_link || '';

    return [
      idx + 1,
      escapeCSV(caseNum),
      escapeCSV(caseYear),
      escapeCSV(caseType),
      escapeCSV(caseName),
      escapeCSV(court),
      escapeCSV(party),
      escapeCSV(client),
      escapeCSV(phone),
      escapeCSV(filing),
      escapeCSV(hearing),
      escapeCSV(stage),
      escapeCSV(status),
      escapeCSV(remark),
      escapeCSV(docLink)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Chambers_Case_Records_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.exportAllCasesToCSV = exportAllCasesToCSV;

function renderUpcomingWeekHearings() {
  const container = document.getElementById('upcomingWeekContainer');
  const countBadge = document.getElementById('upcomingWeekCount');
  if (!container) return;

  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date(todayZero.getTime() + (7 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000));

  const upcoming = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()) return false;
    if ((c.caseStatus || '').toLowerCase().includes('dispose')) return false;

    const parsed = parseDateString(c.nextHearing);
    if (!parsed) return false;
    const hTime = parsed.getTime();
    return hTime >= todayZero.getTime() && hTime <= in7Days.getTime();
  }).sort((a, b) => {
    const da = parseDateString(a.nextHearing) || new Date(9999, 11, 31);
    const db = parseDateString(b.nextHearing) || new Date(9999, 11, 31);
    return da - db;
  });

  const navBadge = document.getElementById('upcomingNavCount');
  if (navBadge) {
    navBadge.textContent = String(upcoming.length);
  }

  const totalBadge = document.getElementById('upcomingTotalBadge');
  if (totalBadge) {
    totalBadge.textContent = `${upcoming.length} Hearing${upcoming.length === 1 ? '' : 's'} Listed`;
  }

  if (countBadge) {
    countBadge.textContent = String(upcoming.length);
  }

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="upcoming-empty-card">
        <span>🎉</span>
        <p>No court appearances scheduled in the next 7 days.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="upcoming-hearings-grid">
      ${upcoming.map(c => {
        const caseNum = c.caseNo || c.criminalCaseNumber;
        const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : `${c.victimName} vs ${c.accusedName}`);
        const court = c.courtName || c.criminalCourtName || 'District Court';
        const dateFormatted = formatDateDMY(c.nextHearing);
        const stage = c.hearingProcess || c.process || 'Scheduled Hearing';
        const clientName = c.clientName || c.criminalClientName || 'Client';
        const clientPhone = c.clientNumber || c.criminalClientNumber || '';
        const caseType = (c.caseType || 'civil').toUpperCase();

        return `
          <div class="upcoming-hearing-card">
            <div class="upcoming-card-header">
              <div class="upcoming-card-badges">
                <span class="upcoming-date-badge">📅 ${dateFormatted}</span>
                <span class="case-badge ${c.caseType || 'civil'}">${caseType}</span>
              </div>
              <button type="button" class="mini-wa-btn" title="Send WhatsApp Hearing Reminder" onclick="sendWhatsAppHearingNotice('${caseNum}')">
                💬 WhatsApp
              </button>
            </div>
            <div class="upcoming-card-body">
              <h4 class="upcoming-case-number">${caseNum}</h4>
              <p class="upcoming-case-name">${caseName}</p>
              <div class="upcoming-meta-row">
                <span>🏛️ ${court}</span>
                <span>📌 ${stage}</span>
              </div>
              <div class="upcoming-client-row">
                <span>👤 ${clientName}</span>
                ${clientPhone ? `<span>📞 ${clientPhone}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.renderUpcomingWeekHearings = renderUpcomingWeekHearings;

// ==============================================================================
// Case To-Do List & Deadline Tracker Logic (Supabase Synced & Beautified)
// ==============================================================================
let caseTasks = [];
window.caseTasks = caseTasks;
let currentTodoFilter = 'all';
let todoSearchQuery = '';

function updateTodoSyncIndicator(isSynced) {
  const ind = document.getElementById('todoSyncIndicator');
  if (!ind) return;
  if (isSynced && supabaseClient) {
    ind.className = 'todo-sync-pill';
    ind.innerHTML = '<span class="sync-dot"></span> Supabase Synced';
  } else {
    ind.className = 'todo-sync-pill';
    ind.style.background = '#f1f5f9';
    ind.style.borderColor = '#cbd5e1';
    ind.style.color = '#475569';
    ind.innerHTML = '💾 Local Storage Ready';
  }
}
window.updateTodoSyncIndicator = updateTodoSyncIndicator;

function loadCaseTasks() {
  try {
    const raw = safeStorage.get('cmCaseTasks');
    if (raw) {
      caseTasks = JSON.parse(raw);
    } else {
      caseTasks = [];
    }
  } catch (e) {
    caseTasks = [];
  }
  window.caseTasks = caseTasks;
  updateTodoCounters();
}

function saveCaseTasksLocally() {
  window.caseTasks = caseTasks;
  try {
    safeStorage.set('cmCaseTasks', JSON.stringify(caseTasks), true);
  } catch (e) {
    console.error('Failed to save tasks locally:', e);
  }
  updateTodoCounters();
}

function saveCaseTasks() {
  saveCaseTasksLocally();
}

function updateTodoCounters() {
  const total = caseTasks.length;
  const pending = caseTasks.filter(t => t.status !== 'completed').length;
  const completed = caseTasks.filter(t => t.status === 'completed').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoonOrOverdue = caseTasks.filter(t => {
    if (t.status === 'completed') return false;
    const d = parseDateString(t.deadlineDate);
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  const navBadge = document.getElementById('todoNavCount');
  if (navBadge) navBadge.textContent = String(pending);

  const statTotal = document.getElementById('todoStatTotal');
  const statPending = document.getElementById('todoStatPending');
  const statDueSoon = document.getElementById('todoStatDueSoon');
  const statCompleted = document.getElementById('todoStatCompleted');

  if (statTotal) statTotal.textContent = String(total);
  if (statPending) statPending.textContent = String(pending);
  if (statDueSoon) statDueSoon.textContent = String(dueSoonOrOverdue);
  if (statCompleted) statCompleted.textContent = String(completed);

  const fAll = document.getElementById('todoFilterAllCount');
  const fPending = document.getElementById('todoFilterPendingCount');
  const fDueSoon = document.getElementById('todoFilterDueSoonCount');
  const fCompleted = document.getElementById('todoFilterCompletedCount');

  if (fAll) fAll.textContent = String(total);
  if (fPending) fPending.textContent = String(pending);
  if (fDueSoon) fDueSoon.textContent = String(dueSoonOrOverdue);
  if (fCompleted) fCompleted.textContent = String(completed);

  // Goal Progress Bar
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progressBar = document.getElementById('todoProgressBar');
  const progressText = document.getElementById('todoProgressPercentage');
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${pct}% Completed (${completed} of ${total})`;
}

function setTodoPriority(level) {
  const hiddenInput = document.getElementById('todoPriority');
  if (hiddenInput) hiddenInput.value = level;

  document.querySelectorAll('.todo-priority-chip').forEach(chip => {
    chip.classList.toggle('active', chip.classList.contains(level));
  });
}
window.setTodoPriority = setTodoPriority;

// ==============================================================================
// Searchable Combobox for Case Selector
// ==============================================================================
function renderTodoCaseDropdownItems(casesToRender) {
  const container = document.getElementById('todoCaseDropdownList');
  if (!container) return;

  const currentSelected = document.getElementById('todoCaseSelect')?.value || '';

  if (!casesToRender || casesToRender.length === 0) {
    container.innerHTML = `
      <div class="todo-combobox-empty">
        <span>🔎 No matching cases found</span>
      </div>
    `;
    return;
  }

  container.innerHTML = casesToRender.map(c => {
    const num = c.caseNo || c.criminalCaseNumber || '';
    const name = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
    const court = c.courtName || c.criminalCourtName || 'District Court';
    const caseType = (c.caseType || 'civil').toLowerCase();
    const hasHearing = c.nextHearing && c.nextHearing !== '—';
    const hearingText = hasHearing ? `📅 Hearing: ${formatDateDMY(c.nextHearing)}` : '⚠️ Undated';
    const isSelected = (currentSelected.toLowerCase() === num.toLowerCase());

    return `
      <div class="todo-combobox-item ${isSelected ? 'selected' : ''}" onclick="selectTodoCase('${num}')">
        <div class="combobox-item-top">
          <span class="combobox-case-num">${num}</span>
          <span class="case-badge ${caseType}">${caseType.toUpperCase()}</span>
        </div>
        <div class="combobox-item-name">${name}</div>
        <div class="combobox-item-meta">
          <span>🏛️ ${court}</span>
          <span class="combobox-hearing-badge ${hasHearing ? '' : 'undated'}">${hearingText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openTodoCaseDropdown() {
  const dropdown = document.getElementById('todoCaseDropdownList');
  if (!dropdown) return;
  dropdown.classList.remove('hidden');

  const searchInput = document.getElementById('todoCaseSearchInput');
  const query = searchInput ? searchInput.value.trim() : '';
  filterTodoCaseDropdown(query);
}
window.openTodoCaseDropdown = openTodoCaseDropdown;

function closeTodoCaseDropdown() {
  const dropdown = document.getElementById('todoCaseDropdownList');
  if (dropdown) dropdown.classList.add('hidden');
}
window.closeTodoCaseDropdown = closeTodoCaseDropdown;

function toggleTodoCaseDropdown() {
  const dropdown = document.getElementById('todoCaseDropdownList');
  if (!dropdown) return;
  if (dropdown.classList.contains('hidden')) {
    openTodoCaseDropdown();
    const searchInput = document.getElementById('todoCaseSearchInput');
    if (searchInput && typeof searchInput.focus === 'function') searchInput.focus();
  } else {
    closeTodoCaseDropdown();
  }
}
window.toggleTodoCaseDropdown = toggleTodoCaseDropdown;

function filterTodoCaseDropdown(query) {
  const dropdown = document.getElementById('todoCaseDropdownList');
  if (dropdown) dropdown.classList.remove('hidden');

  const clearBtn = document.getElementById('todoComboboxClearBtn');
  if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

  const cleanQuery = (query || '').trim().toLowerCase();

  const sorted = [...allCaseRecords].sort((a, b) => {
    const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
    const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
    return numA.localeCompare(numB);
  });

  if (!cleanQuery) {
    renderTodoCaseDropdownItems(sorted);
    return;
  }

  const filtered = sorted.filter(c => {
    const num = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
    const name = (c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''))).toLowerCase();
    const court = (c.courtName || c.criminalCourtName || '').toLowerCase();
    return num.includes(cleanQuery) || name.includes(cleanQuery) || court.includes(cleanQuery);
  });

  renderTodoCaseDropdownItems(filtered);
}
window.filterTodoCaseDropdown = filterTodoCaseDropdown;

function selectTodoCase(caseNo) {
  const select = document.getElementById('todoCaseSelect');
  const searchInput = document.getElementById('todoCaseSearchInput');
  const clearBtn = document.getElementById('todoComboboxClearBtn');

  if (select) select.value = caseNo;

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === caseNo.toLowerCase() || num2 === caseNo.toLowerCase();
  });

  if (found && searchInput) {
    const name = found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'));
    searchInput.value = `${caseNo} — ${name}`;
    if (clearBtn) clearBtn.style.display = 'flex';
  }

  closeTodoCaseDropdown();
  onTodoCaseSelectChange();
}
window.selectTodoCase = selectTodoCase;

function clearTodoCaseSelection() {
  const select = document.getElementById('todoCaseSelect');
  const searchInput = document.getElementById('todoCaseSearchInput');
  const clearBtn = document.getElementById('todoComboboxClearBtn');

  if (select) select.value = '';
  if (searchInput) {
    searchInput.value = '';
    if (typeof searchInput.focus === 'function') searchInput.focus();
  }
  if (clearBtn) clearBtn.style.display = 'none';

  onTodoCaseSelectChange();
  openTodoCaseDropdown();
}
window.clearTodoCaseSelection = clearTodoCaseSelection;

function populateTodoCaseDropdown(selectedCaseNo = '') {
  const select = document.getElementById('todoCaseSelect');
  const searchInput = document.getElementById('todoCaseSearchInput');
  const clearBtn = document.getElementById('todoComboboxClearBtn');

  const currentVal = selectedCaseNo || select?.value || '';

  if (select) {
    select.innerHTML = '<option value="">-- Choose Case to Link --</option>';
    const sorted = [...allCaseRecords].sort((a, b) => {
      const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
      const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
      return numA.localeCompare(numB);
    });

    sorted.forEach(c => {
      const num = c.caseNo || c.criminalCaseNumber || '';
      if (!num) return;
      const name = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
      const hearing = c.nextHearing && c.nextHearing !== '—' ? ` (Hearing: ${formatDateDMY(c.nextHearing)})` : ' (Undated)';
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = `${num} — ${name}${hearing}`;
      select.appendChild(opt);
    });
  }

  // Populate combobox dropdown items
  filterTodoCaseDropdown('');

  if (currentVal) {
    if (select) select.value = currentVal;
    const found = allCaseRecords.find(c => {
      const num1 = (c.caseNo || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || '').toLowerCase();
      return num1 === currentVal.toLowerCase() || num2 === currentVal.toLowerCase();
    });
    if (found && searchInput) {
      const name = found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'));
      searchInput.value = `${currentVal} — ${name}`;
      if (clearBtn) clearBtn.style.display = 'flex';
    }
    onTodoCaseSelectChange();
  } else {
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    onTodoCaseSelectChange();
  }
}

function onTodoCaseSelectChange() {
  const select = document.getElementById('todoCaseSelect');
  const banner = document.getElementById('todoCaseInfoBanner');
  const typeEl = document.getElementById('todoBannerCaseType');
  const numEl = document.getElementById('todoBannerCaseNum');
  const nameEl = document.getElementById('todoBannerCaseName');
  const courtEl = document.getElementById('todoBannerCourt');
  const hearingEl = document.getElementById('todoBannerHearing');
  const deadlineInput = document.getElementById('todoDeadline');

  const val = select?.value;
  if (!val) {
    if (banner) banner.classList.add('hidden');
    return;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === val.toLowerCase() || num2 === val.toLowerCase();
  });

  if (found) {
    if (banner) banner.classList.remove('hidden');
    const caseType = (found.caseType || 'civil').toLowerCase();
    const caseNum = found.caseNo || found.criminalCaseNumber || '—';
    const caseTitle = found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'));

    if (typeEl) {
      typeEl.textContent = caseType.toUpperCase();
      typeEl.className = `case-badge ${caseType}`;
    }
    if (numEl) numEl.textContent = caseNum;
    if (nameEl) nameEl.textContent = caseTitle;
    if (courtEl) courtEl.textContent = found.courtName || found.criminalCourtName || 'District Court';
    if (hearingEl) hearingEl.textContent = found.nextHearing && found.nextHearing !== '—' ? formatDateDMY(found.nextHearing) : 'None scheduled (Undated)';

    if (deadlineInput && found.nextHearing && found.nextHearing !== '—') {
      const parsed = parseDateString(found.nextHearing);
      if (parsed) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        deadlineInput.value = `${y}-${m}-${d}`;
      }
    }
  }
}

function setTodoDeadlinePreset(preset) {
  const select = document.getElementById('todoCaseSelect');
  const deadlineInput = document.getElementById('todoDeadline');
  if (!select || !deadlineInput) return;

  const val = select.value;
  if (!val) {
    alert('Please select a case first.');
    return;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === val.toLowerCase() || num2 === val.toLowerCase();
  });

  if (!found || !found.nextHearing || found.nextHearing === '—') {
    alert('This case does not have a scheduled hearing date. Please pick a deadline date manually.');
    return;
  }

  const hearingDate = parseDateString(found.nextHearing);
  if (!hearingDate) return;

  const targetDate = new Date(hearingDate.getTime());
  if (preset === '1day') {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (preset === '3days') {
    targetDate.setDate(targetDate.getDate() - 3);
  }

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  deadlineInput.value = `${y}-${m}-${d}`;
}
window.setTodoDeadlinePreset = setTodoDeadlinePreset;

async function handleAddTodoSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const select = document.getElementById('todoCaseSelect');
  const titleInput = document.getElementById('todoTitle');
  const deadlineInput = document.getElementById('todoDeadline');
  const priorityInput = document.getElementById('todoPriority');

  const caseNo = select?.value?.trim();
  const title = titleInput?.value?.trim();
  const deadline = deadlineInput?.value;
  const priority = priorityInput?.value || 'medium';

  if (!caseNo || !title || !deadline) {
    alert('Please fill in all task fields.');
    return false;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === caseNo.toLowerCase() || num2 === caseNo.toLowerCase();
  });

  const caseName = found ? (found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'))) : '—';
  const hearingDate = found?.nextHearing || null;

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    caseNo,
    caseName,
    taskTitle: title,
    hearingDate,
    deadlineDate: deadline,
    priority,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  caseTasks.unshift(newTask);
  saveCaseTasksLocally();
  renderCaseTasks(currentTodoFilter);

  if (titleInput) titleInput.value = '';
  showToastNotification(`📝 Task scheduled for ${caseNo}!`);

  // Live Supabase Sync (if configured)
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('case_todos').insert([{
        case_number: newTask.caseNo,
        case_name: newTask.caseName,
        task_title: newTask.taskTitle,
        hearing_date: newTask.hearingDate && newTask.hearingDate !== '—' ? newTask.hearingDate : null,
        deadline_date: newTask.deadlineDate,
        priority: newTask.priority,
        status: newTask.status
      }]).select();

      if (!error && data && data.length > 0) {
        newTask.id = data[0].id;
        saveCaseTasksLocally();
        updateTodoSyncIndicator(true);
      }
    } catch (supaErr) {
      console.warn('Supabase task insert fallback to local:', supaErr);
    }
  }

  return false;
}
window.handleAddTodoSubmit = handleAddTodoSubmit;

function filterTodoTasks(filterType, btnEl = null) {
  currentTodoFilter = filterType;
  if (btnEl) {
    document.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  renderCaseTasks(filterType);
}
window.filterTodoTasks = filterTodoTasks;

function onTodoSearchInput(val) {
  todoSearchQuery = (val || '').trim().toLowerCase();
  renderCaseTasks(currentTodoFilter);
}
window.onTodoSearchInput = onTodoSearchInput;

async function toggleTaskStatus(taskId) {
  const task = caseTasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = task.status === 'completed' ? 'pending' : 'completed';
  saveCaseTasksLocally();
  renderCaseTasks(currentTodoFilter);

  if (supabaseClient) {
    try {
      await supabaseClient.from('case_todos').update({ status: task.status }).eq('id', taskId);
    } catch (e) {
      console.warn('Supabase task toggle fallback to local:', e);
    }
  }
}
window.toggleTaskStatus = toggleTaskStatus;

async function deleteCaseTask(taskId) {
  if (typeof confirm === 'function' && !confirm('Are you sure you want to remove this task?')) return;
  caseTasks = caseTasks.filter(t => t.id !== taskId);
  saveCaseTasksLocally();
  renderCaseTasks(currentTodoFilter);
  showToastNotification('🗑️ Task removed');

  if (supabaseClient) {
    try {
      await supabaseClient.from('case_todos').delete().eq('id', taskId);
    } catch (e) {
      console.warn('Supabase task delete fallback to local:', e);
    }
  }
}
window.deleteCaseTask = deleteCaseTask;

function openTodoForCase(caseNo) {
  showTab('todo');
  populateTodoCaseDropdown(caseNo);
  setTimeout(() => {
    const titleInput = document.getElementById('todoTitle');
    if (titleInput && typeof titleInput.focus === 'function') titleInput.focus();
  }, 100);
}
window.openTodoForCase = openTodoForCase;

function renderCaseTasks(filter = currentTodoFilter) {
  const container = document.getElementById('todoListContainer');
  if (!container) return;

  updateTodoCounters();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filtered = [...caseTasks];

  // Apply tab filter
  if (filter === 'pending') {
    filtered = filtered.filter(t => t.status !== 'completed');
  } else if (filter === 'completed') {
    filtered = filtered.filter(t => t.status === 'completed');
  } else if (filter === 'dueSoon') {
    filtered = filtered.filter(t => {
      if (t.status === 'completed') return false;
      const d = parseDateString(t.deadlineDate);
      if (!d) return false;
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });
  }

  // Apply search query
  if (todoSearchQuery) {
    filtered = filtered.filter(t => {
      const title = (t.taskTitle || '').toLowerCase();
      const num = (t.caseNo || '').toLowerCase();
      const name = (t.caseName || '').toLowerCase();
      return title.includes(todoSearchQuery) || num.includes(todoSearchQuery) || name.includes(todoSearchQuery);
    });
  }

  if (filtered.length === 0) {
    const msg = todoSearchQuery
      ? `No tasks match "${todoSearchQuery}". Try clearing the search.`
      : filter === 'completed'
      ? 'No completed tasks yet. Mark tasks finished as you prepare for court hearings.'
      : filter === 'dueSoon'
      ? '🎉 No tasks due soon or overdue! All your deadlines are on track.'
      : 'No case preparation tasks found. Choose a case on the left to schedule your first appearance deadline.';
    container.innerHTML = `
      <div class="todo-empty-state">
        <span>📝</span>
        <p>${msg}</p>
      </div>
    `;
    return;
  }

  filtered.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
    const dateA = parseDateString(a.deadlineDate)?.getTime() || 0;
    const dateB = parseDateString(b.deadlineDate)?.getTime() || 0;
    return dateA - dateB;
  });

  container.innerHTML = filtered.map(t => {
    const isDone = t.status === 'completed';
    const d = parseDateString(t.deadlineDate);
    let deadlineBadgeHtml = '';

    if (isDone) {
      deadlineBadgeHtml = `<span class="todo-deadline-badge completed">✅ Completed</span>`;
    } else if (d) {
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        deadlineBadgeHtml = `<span class="todo-deadline-badge overdue">🔴 Overdue (${Math.abs(diffDays)}d late)</span>`;
      } else if (diffDays === 0) {
        deadlineBadgeHtml = `<span class="todo-deadline-badge today">⚠️ Due Today</span>`;
      } else if (diffDays === 1) {
        deadlineBadgeHtml = `<span class="todo-deadline-badge soon">⏳ Due Tomorrow</span>`;
      } else if (diffDays <= 3) {
        deadlineBadgeHtml = `<span class="todo-deadline-badge soon">⏳ Due in ${diffDays} days</span>`;
      } else {
        deadlineBadgeHtml = `<span class="todo-deadline-badge normal">📅 Due in ${diffDays} days</span>`;
      }
    }

    const priorityLabel = t.priority === 'high' ? '🔴 High (Urgent)' : (t.priority === 'normal' ? '🔵 Normal' : '🟡 Medium');
    const priorityClass = t.priority || 'medium';
    const hearingFormatted = t.hearingDate && t.hearingDate !== '—' ? formatDateDMY(t.hearingDate) : 'Undated';

    return `
      <div class="todo-item priority-${priorityClass} ${isDone ? 'status-completed' : ''}" id="${t.id}">
        <div class="todo-checkbox-wrapper">
          <input type="checkbox" class="todo-checkbox" ${isDone ? 'checked' : ''} onchange="toggleTaskStatus('${t.id}')" title="Mark as ${isDone ? 'Pending' : 'Completed'}">
        </div>
        <div class="todo-item-content">
          <div class="todo-item-top">
            <span class="todo-item-title">${t.taskTitle}</span>
            <div class="todo-badges-row">
              ${deadlineBadgeHtml}
              <span class="todo-priority-pill ${priorityClass}">${priorityLabel}</span>
            </div>
          </div>
          <div class="todo-meta-row">
            <span>Case: <a href="javascript:void(0);" class="todo-case-link" onclick="showTab('search'); document.getElementById('globalSearch').value='${t.caseNo}'; filterCaseTables(false);">${t.caseNo}</a> (${t.caseName})</span>
            <span>📅 Deadline: <strong>${formatDateDMY(t.deadlineDate)}</strong></span>
            <span>⚖️ Court Hearing: <strong>${hearingFormatted}</strong></span>
          </div>
        </div>
        <div class="todo-item-actions">
          <button type="button" class="todo-delete-btn" onclick="deleteCaseTask('${t.id}')" title="Delete Task">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderCaseTasks = renderCaseTasks;
window.populateTodoCaseDropdown = populateTodoCaseDropdown;

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

function printDailyCauseList(targetDateStr = '') {
  // If targetDateStr is passed as a MouseEvent/PointerEvent from event listeners, sanitize to empty string
  if (typeof targetDateStr !== 'string') {
    targetDateStr = '';
  }

  let y = null, m = null, d = null, fullDateFormatted = '', weekday = '';

  if (targetDateStr && targetDateStr.includes('-')) {
    const parts = targetDateStr.split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (typeof currentCauseListDate !== 'undefined' && currentCauseListDate && String(currentCauseListDate).includes('-')) {
    const parts = String(currentCauseListDate).split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (typeof selectedCalendarDate !== 'undefined' && selectedCalendarDate) {
    d = selectedCalendarDate.day;
    m = selectedCalendarDate.month;
    y = selectedCalendarDate.year;
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
    d = now.getDate();
  }

  const dateObj = new Date(y, m, d);
  fullDateFormatted = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
  const weekdayEnglish = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const weekdayHindiMap = {
    Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार',
    Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार'
  };
  weekday = `${weekdayEnglish} (${weekdayHindiMap[weekdayEnglish] || ''})`;

  const dateMatchYMD = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Filter hearings on this day across allCaseRecords
  const hearingsOnDay = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null') return false;
    const str = String(c.nextHearing).trim();
    if (str === dateMatchYMD) return true;

    // Check d/m/y or y/m/d fallback
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
    return hYear === y && hMonth === m && hDay === d;
  });

  // Filter by court if selected in either dropdown
  const courtFilterVal = (document.getElementById('causeListCourtFilterSelect')?.value || document.getElementById('causeListCourtFilter')?.value || '').trim().toLowerCase();
  const filteredHearings = courtFilterVal
    ? hearingsOnDay.filter(c => (c.courtName || c.criminalCourtName || '').trim().toLowerCase() === courtFilterVal)
    : hearingsOnDay;

  // Sort by Court Name and then Case Number
  filteredHearings.sort((a, b) => {
    const courtA = (a.courtName || a.criminalCourtName || '').toUpperCase();
    const courtB = (b.courtName || b.criminalCourtName || '').toUpperCase();
    if (courtA !== courtB) return courtA.localeCompare(courtB);
    const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
    const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
    return numA.localeCompare(numB);
  });

  // Populate Printable Document
  const printDateEl = document.getElementById('causeListPrintDate');
  const printDayEl = document.getElementById('causeListPrintDay');
  const printTotalEl = document.getElementById('causeListPrintTotal');
  const printTimestampEl = document.getElementById('causeListPrintTimestamp');
  const printTbody = document.getElementById('causePrintTableBody');

  if (printDateEl) printDateEl.textContent = fullDateFormatted;
  if (printDayEl) printDayEl.textContent = weekday;
  if (printTotalEl) {
    const courtSuffix = courtFilterVal ? ` (${courtFilterVal.toUpperCase()})` : '';
    printTotalEl.textContent = `${filteredHearings.length} Matter${filteredHearings.length === 1 ? '' : 's'} Listed${courtSuffix}`;
  }
  if (printTimestampEl) {
    const now = new Date();
    printTimestampEl.textContent = `${formatDateDMY(now)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (printTbody) {
    if (filteredHearings.length === 0) {
      const courtNote = courtFilterVal ? ` in ${courtFilterVal}` : '';
      printTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px 10px; font-weight: bold; color: #64748b;">No court hearings scheduled on ${fullDateFormatted} (${weekday})${courtNote}.</td></tr>`;
    } else {
      printTbody.innerHTML = filteredHearings.map((h, idx) => {
        const caseNo = h.caseNo || h.criminalCaseNumber || '—';
        const type = (h.caseType || 'civil').toUpperCase();
        const court = h.courtName || h.criminalCourtName || 'District Court';
        const stage = h.hearingProcess || h.process || 'Scheduled Proceeding';
        const client = h.clientName || h.criminalClientName || '—';
        const clientPhone = (h.clientNumber || h.criminalClientNumber) ? `<br><small style="color: #475569; font-weight: 600;">📞 ${h.clientNumber || h.criminalClientNumber}</small>` : '';
        const caseName = h.caseName || (h.plaintiff ? `${h.plaintiff} vs ${h.defendant}` : (h.victimName ? `${h.victimName} vs ${h.accusedName}` : '—'));

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

  const formattedDate = formatDateHindi(hearingDate);

  const message = 
`⚖️ *COURT DATE REMINDER*  
━━━━━━━━━━━━━━━━━━

नमस्ते *${clientName} जी*,

आपके प्रकरण की *अगली सुनवाई* निर्धारित है:

📋 *केस नंबर:* ${caseNo}  
👥 *केस का नाम:* ${caseTitle}  
🏛️ *न्यायालय:* ${courtName}  
📅 *अगली सुनवाई:* *${formattedDate}*

🔔 *महत्वपूर्ण सूचना:*  
कृपया निर्धारित तारीख को *प्रातः 11:00 बजे Chamber/Seat पर उपस्थित रहें।*

📍 *OFFICE ADDRESS*  
*Civil Courts, Chamber No. 5*  
*District & Sessions Court Campus,*  
*Lakhimpur Kheri*

📞 *संपर्क हेतु:*

*श्री सुशील कुमार मिश्रा*  
वरिष्ठ अधिवक्ता  
📱 9839810466

*श्री अतुल कुमार मिश्रा*  
अधिवक्ता  
📱 8318194561

*श्री सुभाष चन्द्र मिश्रा*  
अधिवक्ता  
📱 8081840363

━━━━━━━━━━━━━━━━━━  
🙏 *धन्यवाद*`;

  const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

window.sendWhatsAppHearingNotice = sendWhatsAppHearingNotice;

// ==============================================================================
// Update Case Tab Logic
// ==============================================================================

let currentlyLoadedOriginalCaseNo = '';

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
    const name = (c.caseName || '').toLowerCase();
    const plaintiff = (c.plaintiff || '').toLowerCase();
    const defendant = (c.defendant || '').toLowerCase();
    const victim = (c.victimName || '').toLowerCase();
    const accused = (c.accusedName || '').toLowerCase();
    return num1 === query || num2 === query || name.includes(query) || (plaintiff && plaintiff.includes(query)) || (defendant && defendant.includes(query)) || (victim && victim.includes(query)) || (accused && accused.includes(query));
  });

  if (!found) {
    if (statusEl) {
      statusEl.textContent = `❌ Case "${query.toUpperCase()}" not found.`;
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  currentlyLoadedOriginalCaseNo = found.caseNo || found.criminalCaseNumber || '';

  const typeDropdown = document.getElementById('updateCaseTypeDropdown');
  const caseType = (found.caseType || 'civil').toLowerCase();
  if (typeDropdown) {
    typeDropdown.value = caseType;
  }
  toggleUpdateCaseFormByType();

  // Load Status and Remark
  const statusSelect = document.getElementById('updateCaseStatus');
  if (statusSelect) {
    const isDisposed = (found.caseStatus || '').toLowerCase().includes('dispose');
    statusSelect.value = isDisposed ? 'Disposed' : 'Pending';
  }
  const remarkInput = document.getElementById('updateCaseRemark');
  if (remarkInput) {
    remarkInput.value = found.remark || found.remarks || '';
  }

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
    setVal('updateCrimeDocLink', found.docLink || '');
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
    setVal('updateCaseDocLink', found.docLink || '');
  }

  // Pre-fill Fix Next Hearing Date with the case's current nextHearing date
  const nextHearingFixEl = document.getElementById('updateNextHearingDate');
  if (nextHearingFixEl) {
    const existingDate = found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '';
    nextHearingFixEl.value = existingDate;
  }

  if (statusEl) {
    statusEl.textContent = `✅ Case "${currentlyLoadedOriginalCaseNo}" loaded. You can update the Case Number and other details below.`;
    statusEl.className = 'update-status-msg success';
  }
}

async function handleUpdateCaseSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const caseType = document.getElementById('updateCaseTypeDropdown')?.value;
  const statusEl = document.getElementById('updateSearchStatus');

  let newCaseNumber = '';
  if (caseType === 'criminal') {
    newCaseNumber = document.getElementById('updateCriminalCaseNumber')?.value?.trim();
  } else {
    newCaseNumber = document.getElementById('updateCaseNo')?.value?.trim();
  }

  if (!newCaseNumber) {
    alert('Please enter a valid Case Number.');
    if (statusEl) {
      statusEl.textContent = 'Please enter a valid Case Number.';
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  const originalCaseNo = currentlyLoadedOriginalCaseNo || newCaseNumber;

  // Check duplicate if case number is changed
  if (newCaseNumber.toLowerCase() !== originalCaseNo.toLowerCase()) {
    const duplicate = allCaseRecords.find(c => {
      const num1 = (c.caseNo || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || '').toLowerCase();
      const isCurrent = num1 === originalCaseNo.toLowerCase() || num2 === originalCaseNo.toLowerCase();
      return !isCurrent && (num1 === newCaseNumber.toLowerCase() || num2 === newCaseNumber.toLowerCase());
    });

    if (duplicate) {
      alert(`Case Number "${newCaseNumber}" already exists on another case. Please choose a unique Case Number.`);
      if (statusEl) {
        statusEl.textContent = `❌ Case Number "${newCaseNumber}" already exists on another case.`;
        statusEl.className = 'update-status-msg error';
      }
      return;
    }
  }

  const caseIndex = allCaseRecords.findIndex(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === originalCaseNo.toLowerCase() || num2 === originalCaseNo.toLowerCase();
  });

  if (caseIndex === -1) {
    alert(`Case "${originalCaseNo}" was not found.`);
    return;
  }

  const targetCase = allCaseRecords[caseIndex];
  targetCase.caseType = caseType;
  targetCase.caseNo = newCaseNumber;

  // Save Case Status, Remark, and Document Link
  targetCase.caseStatus = document.getElementById('updateCaseStatus')?.value || 'Pending';
  targetCase.remark = document.getElementById('updateCaseRemark')?.value?.trim() || '';
  targetCase.docLink = (caseType === 'criminal'
    ? document.getElementById('updateCrimeDocLink')?.value
    : document.getElementById('updateCaseDocLink')?.value)?.trim() || '';

  if (caseType === 'criminal') {
    targetCase.criminalCaseNumber = newCaseNumber;
    targetCase.policeStation = document.getElementById('updatePoliceStation')?.value || '';
    targetCase.crimeFilingDate = document.getElementById('updateCrimeFilingDate')?.value || targetCase.crimeFilingDate || targetCase.filingDate || '';
    targetCase.filingDate = targetCase.crimeFilingDate;
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
    targetCase.filingDate = document.getElementById('updateFilingDate')?.value || targetCase.filingDate || '';
    targetCase.plaintiff = document.getElementById('updatePlaintiff')?.value || '';
    targetCase.defendant = document.getElementById('updateDefendant')?.value || '';
    targetCase.courtName = document.getElementById('updateCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateClientName')?.value || '';
    targetCase.clientNumber = document.getElementById('updateClientNumber')?.value || '';
    targetCase.caseName = `${targetCase.plaintiff} vs ${targetCase.defendant}`;
    targetCase.partyName = targetCase.defendant || targetCase.plaintiff;
  }

  // Read "Fix Next Hearing Date" — read from correct input based on case type
  const fixNextHearingDate = (caseType === 'criminal'
    ? document.getElementById('updateCriminalNextHearingDate')?.value?.trim()
    : document.getElementById('updateNextHearingDate')?.value?.trim()) || '';
  if (fixNextHearingDate) {
    targetCase.nextHearing = fixNextHearingDate;
  }

  // Update in live Supabase database & cascade to hearings table
  await updateCaseInSupabase(originalCaseNo, newCaseNumber, caseType, targetCase);

  // Update in-memory hearing records if case number changed
  if (originalCaseNo.toLowerCase() !== newCaseNumber.toLowerCase()) {
    allHearingRecords.forEach(h => {
      if ((h.case_number || '').toLowerCase() === originalCaseNo.toLowerCase()) {
        h.case_number = newCaseNumber;
      }
    });
  }

  // Update search input & currentlyLoadedOriginalCaseNo to newCaseNumber
  currentlyLoadedOriginalCaseNo = newCaseNumber;
  const updateSearchInput = document.getElementById('updateSearchInput');
  if (updateSearchInput) updateSearchInput.value = newCaseNumber;

  if (statusEl) {
    statusEl.textContent = `🎉 Case "${newCaseNumber}" updated successfully!`;
    statusEl.className = 'update-status-msg success';
  }

  alert(`Case ${newCaseNumber} details updated successfully!`);
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

  renderSearchCourtFilterOptions();
}

function renderSearchCourtFilterOptions() {
  const filterSelect = document.getElementById('searchCourtFilter');
  if (!filterSelect) return;

  const currentVal = filterSelect.value || '';
  filterSelect.innerHTML = '<option value="">🏛️ All Courts</option>';

  const uniqueCourts = new Set();
  courts.forEach(c => {
    if (c && c.trim()) uniqueCourts.add(c.trim());
  });
  allCaseRecords.forEach(item => {
    const cName = item.courtName || item.criminalCourtName;
    if (cName && cName.trim()) uniqueCourts.add(cName.trim());
  });

  Array.from(uniqueCourts).sort().forEach(court => {
    const opt = document.createElement('option');
    opt.value = court;
    opt.textContent = court;
    filterSelect.appendChild(opt);
  });

  if (currentVal) filterSelect.value = currentVal;

  const causeListFilter = document.getElementById('causeListCourtFilter');
  if (causeListFilter) {
    const prevCauseVal = causeListFilter.value || '';
    causeListFilter.innerHTML = '<option value="">🏛️ All Courts</option>';
    Array.from(uniqueCourts).sort().forEach(court => {
      const opt = document.createElement('option');
      opt.value = court;
      opt.textContent = court;
      causeListFilter.appendChild(opt);
    });
    if (prevCauseVal) causeListFilter.value = prevCauseVal;
  }

  const causeListMainFilter = document.getElementById('causeListCourtFilterSelect');
  if (causeListMainFilter) {
    const prevMainVal = causeListMainFilter.value || '';
    causeListMainFilter.innerHTML = '<option value="">🏛️ All Courts</option>';
    Array.from(uniqueCourts).sort().forEach(court => {
      const opt = document.createElement('option');
      opt.value = court;
      opt.textContent = court;
      causeListMainFilter.appendChild(opt);
    });
    if (prevMainVal) causeListMainFilter.value = prevMainVal;
  }
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

  // Listen to browser hash navigation
  window.addEventListener('hashchange', () => {
    const hashTab = (window.location.hash || '').replace(/^#/, '').trim();
    if (hashTab && document.getElementById(hashTab) && hashTab !== currentActiveTabId) {
      showTab(hashTab, null, 'restore');
    }
  });

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterCaseTables());
  }

  const searchCourtFilter = document.getElementById('searchCourtFilter');
  if (searchCourtFilter) {
    searchCourtFilter.addEventListener('change', () => filterCaseTables());
  }

  const searchTypeFilter = document.getElementById('searchTypeFilter');
  if (searchTypeFilter) {
    searchTypeFilter.addEventListener('change', () => filterCaseTables());
  }

  const searchStatusFilter = document.getElementById('searchStatusFilter');
  if (searchStatusFilter) {
    searchStatusFilter.addEventListener('change', () => filterCaseTables());
  }

  const searchDateFilter = document.getElementById('searchDateFilter');
  if (searchDateFilter) {
    searchDateFilter.addEventListener('change', () => filterCaseTables());
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchCourtFilter) searchCourtFilter.value = '';
      if (searchTypeFilter) searchTypeFilter.value = '';
      if (searchStatusFilter) searchStatusFilter.value = '';
      if (searchDateFilter) searchDateFilter.value = '';
      document.querySelectorAll('.quick-filter-chip').forEach(chip => chip.classList.remove('active'));
      filterCaseTables();
    });
  }

  // Cause List Controls
  const causeListDateInput = document.getElementById('causeListDateInput');
  const causeListCourtFilterSelect = document.getElementById('causeListCourtFilterSelect');
  if (causeListDateInput) {
    causeListDateInput.addEventListener('change', (e) => {
      renderCauseListTable(e.target.value, causeListCourtFilterSelect ? causeListCourtFilterSelect.value : '');
    });
  }
  if (causeListCourtFilterSelect) {
    causeListCourtFilterSelect.addEventListener('change', (e) => {
      renderCauseListTable(causeListDateInput ? causeListDateInput.value : '', e.target.value);
    });
  }

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportAllCasesToCSV);
  }

  // Double-click to copy case number in Search Cases tab
  const detailCaseNoEl = document.getElementById('detailCaseNo');
  if (detailCaseNoEl) {
    detailCaseNoEl.addEventListener('dblclick', () => {
      const text = detailCaseNoEl.textContent.trim();
      if (text && text !== '—') {
        copyCaseNumberToClipboard(text, detailCaseNoEl);
      }
    });
  }

  const searchTab = document.getElementById('search');
  if (searchTab) {
    searchTab.addEventListener('dblclick', (e) => {
      const target = e.target.closest('.copyable-case-no') || e.target.closest('td:nth-child(2)');
      if (target && searchTab.querySelector('.search-results-table')?.contains(target)) {
        const text = target.textContent.trim();
        if (text && text !== '—' && text !== 'Case Number') {
          copyCaseNumberToClipboard(text, target);
        }
      }
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
        caseStatus: 'Pending',
        docLink: document.getElementById('criminalDocLink')?.value?.trim() || ''
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
        caseStatus: 'Pending',
        docLink: document.getElementById('caseDocLink')?.value?.trim() || ''
      };
    }

    // --- Duplicate prevention: check if case number already exists ---
    const caseNoToCheck = (newCase.caseNo || '').toLowerCase();
    if (caseNoToCheck) {
      const existingCase = allCaseRecords.find(c => {
        const num1 = (c.caseNo || '').toLowerCase();
        const num2 = (c.criminalCaseNumber || '').toLowerCase();
        return num1 === caseNoToCheck || num2 === caseNoToCheck;
      });
      if (existingCase) {
        alert(`❌ Case Number "${newCase.caseNo}" already exists! Please use a different Case Number or update the existing case from the Update tab.`);
        return;
      }
    }

    const recordCountBefore = allCaseRecords.length;
    await addCaseToSupabase(newCase);

    // Only show success and reset form if the case was actually added
    if (allCaseRecords.length > recordCountBefore) {
      this.reset();
      alert(`Case ${newCase.caseNo} added successfully!`);
    }
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

  // 3.5 Handle Mark Case as Disposed Button
  const markDisposeBtn = document.getElementById('markDisposeBtn');
  if (markDisposeBtn) {
    markDisposeBtn.addEventListener('click', () => {
      const statusSelect = document.getElementById('updateCaseStatus');
      const remarkInput = document.getElementById('updateCaseRemark');
      if (statusSelect) statusSelect.value = 'Disposed';
      if (remarkInput) {
        if (!remarkInput.value.trim()) {
          remarkInput.value = 'Disposed Off';
        }
        remarkInput.focus();
      }
      const statusEl = document.getElementById('updateSearchStatus');
      if (statusEl) {
        statusEl.textContent = '⚖️ Status set to "Disposed Off". Review/edit remarks and click "Save Case Updates".';
        statusEl.className = 'update-status-msg success';
      }
    });
  }

  // 4. Handle Delete Case Form (Search by Case No/Name, Preview, & Delete)
  const deleteSearchInput = document.getElementById('deleteSearchInput');
  const deleteFindBtn = document.getElementById('deleteFindBtn');
  const deleteCaseBtn = document.getElementById('deleteCaseBtn');
  const deleteStatus = document.getElementById('deleteStatus');
  const deletePreviewCard = document.getElementById('deletePreviewCard');
  const deletePreviewEmpty = document.getElementById('deletePreviewEmpty');

  let currentlyLoadedDeleteCase = null;

  function searchCaseForDeletion(queryStr) {
    const q = (queryStr || deleteSearchInput?.value || '').trim().toLowerCase();
    if (!q) {
      if (deleteStatus) {
        deleteStatus.textContent = 'Please enter a Case Number or Case Name to search.';
        deleteStatus.className = 'update-status-msg error';
      }
      if (deletePreviewCard) deletePreviewCard.classList.add('hidden');
      if (deletePreviewEmpty) deletePreviewEmpty.classList.remove('hidden');
      currentlyLoadedDeleteCase = null;
      return;
    }

    const found = allCaseRecords.find(c => {
      const num1 = (c.caseNo || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || '').toLowerCase();
      const name = (c.caseName || '').toLowerCase();
      const plaintiff = (c.plaintiff || '').toLowerCase();
      const defendant = (c.defendant || '').toLowerCase();
      const victim = (c.victimName || '').toLowerCase();
      const accused = (c.accusedName || '').toLowerCase();
      return num1 === q || num2 === q || name.includes(q) || (plaintiff && plaintiff.includes(q)) || (defendant && defendant.includes(q)) || (victim && victim.includes(q)) || (accused && accused.includes(q));
    });

    if (!found) {
      if (deleteStatus) {
        deleteStatus.textContent = `❌ No case found matching "${q.toUpperCase()}".`;
        deleteStatus.className = 'update-status-msg error';
      }
      if (deletePreviewCard) deletePreviewCard.classList.add('hidden');
      if (deletePreviewEmpty) deletePreviewEmpty.classList.remove('hidden');
      currentlyLoadedDeleteCase = null;
      return;
    }

    currentlyLoadedDeleteCase = found;

    // Populate preview card
    const cNum = found.caseNo || found.criminalCaseNumber || '—';
    const cType = (found.caseType || 'civil').toLowerCase();
    const isDisposed = (found.caseStatus || '').toLowerCase().includes('dispose');

    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt || '—';
    };

    setText('delPreviewCaseNumber', cNum);
    const typeBadge = document.getElementById('delPreviewCaseTypeBadge');
    if (typeBadge) {
      typeBadge.textContent = cType.toUpperCase();
      typeBadge.className = `case-badge ${cType}`;
    }

    const statusBadge = document.getElementById('delPreviewStatusBadge');
    if (statusBadge) {
      statusBadge.className = `status-badge ${isDisposed ? 'disposed' : 'pending'}`;
      statusBadge.textContent = isDisposed ? '✅ Disposed Off' : '⏳ Pending';
    }

    setText('delPreviewCaseName', found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—')));
    setText('delPreviewCourtName', found.courtName || found.criminalCourtName);
    setText('delPreviewClientName', found.clientName || found.criminalClientName);
    setText('delPreviewClientNumber', found.clientNumber || found.criminalClientNumber);
    setText('delPreviewFilingDate', formatDateDMY(found.filingDate || found.crimeFilingDate));
    setText('delPreviewNextHearing', formatDateDMY(found.nextHearing));

    if (deletePreviewEmpty) deletePreviewEmpty.classList.add('hidden');
    if (deletePreviewCard) deletePreviewCard.classList.remove('hidden');
    if (deleteStatus) {
      deleteStatus.textContent = `✅ Case "${cNum}" found! Review details below before deletion.`;
      deleteStatus.className = 'update-status-msg success';
    }
  }

  if (deleteFindBtn) {
    deleteFindBtn.addEventListener('click', () => searchCaseForDeletion());
  }

  if (deleteSearchInput) {
    deleteSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchCaseForDeletion();
      }
    });
  }

  if (deleteCaseBtn) {
    deleteCaseBtn.addEventListener('click', async () => {
      if (!currentlyLoadedDeleteCase) {
        alert('Please search and select a case first before deleting.');
        return;
      }

      const caseNumber = currentlyLoadedDeleteCase.caseNo || currentlyLoadedDeleteCase.criminalCaseNumber;
      const caseName = currentlyLoadedDeleteCase.caseName || caseNumber;

      const confirmDelete = confirm(`Are you sure you want to permanently delete case "${caseNumber}" (${caseName})? This action cannot be undone.`);
      if (confirmDelete) {
        await deleteCaseFromSupabase(caseNumber);
        if (deleteSearchInput) deleteSearchInput.value = '';
        if (deletePreviewCard) deletePreviewCard.classList.add('hidden');
        if (deletePreviewEmpty) deletePreviewEmpty.classList.remove('hidden');
        if (deleteStatus) {
          deleteStatus.textContent = `🗑️ Case "${caseNumber}" deleted successfully!`;
          deleteStatus.className = 'update-status-msg success';
        }
        currentlyLoadedDeleteCase = null;
        alert(`Case "${caseNumber}" has been deleted permanently.`);
      }
    });
  }

  // 5. Handle Update Hearing Form (Live Supabase sync)
  const hearingCaseSelect = document.getElementById('hearingCaseSelect');
  const hearingCaseNo = document.getElementById('hearingCaseNo');

  if (hearingCaseSelect) {
    hearingCaseSelect.addEventListener('change', () => {
      const selectedVal = hearingCaseSelect.value;
      if (hearingCaseNo) {
        hearingCaseNo.value = selectedVal;
      }

      renderHearingCaseInfo(selectedVal);

      if (selectedVal) {
        const found = allCaseRecords.find(c => {
          const num1 = (c.caseNo || '').toLowerCase();
          const num2 = (c.criminalCaseNumber || '').toLowerCase();
          return num1 === selectedVal.toLowerCase() || num2 === selectedVal.toLowerCase();
        });

        if (found) {
          const hearingProcessInput = document.getElementById('hearingProcess');
          if (hearingProcessInput && found.hearingProcess && !hearingProcessInput.value) {
            hearingProcessInput.value = found.hearingProcess;
          }
          const dateInput = document.getElementById('hearingDate');
          if (dateInput) dateInput.focus();
        }
      }
    });
  }

  if (hearingCaseNo) {
    hearingCaseNo.addEventListener('input', () => {
      const typed = hearingCaseNo.value.trim();
      renderHearingCaseInfo(typed);

      if (hearingCaseSelect) {
        const match = Array.from(hearingCaseSelect.options).find(opt => opt.value.toLowerCase() === typed.toLowerCase());
        if (match) {
          hearingCaseSelect.value = match.value;
        } else {
          hearingCaseSelect.value = '';
        }
      }
    });
  }

  // Live preview events for Hearing Date & Process inputs
  const hearingDateInput = document.getElementById('hearingDate');
  const hearingProcessInput = document.getElementById('hearingProcess');
  if (hearingDateInput) {
    hearingDateInput.addEventListener('input', updateHearingLivePreview);
    hearingDateInput.addEventListener('change', updateHearingLivePreview);
  }
  if (hearingProcessInput) {
    hearingProcessInput.addEventListener('input', updateHearingLivePreview);
    hearingProcessInput.addEventListener('change', updateHearingLivePreview);
  }

  const updateHearingForm = document.getElementById('updateHearingForm');
  if (updateHearingForm) {
    updateHearingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const caseNumber = document.getElementById('hearingCaseNo')?.value?.trim();
      const hearingDate = document.getElementById('hearingDate')?.value;
      const process = document.getElementById('hearingProcess')?.value?.trim();
      const actionTaken = document.getElementById('hearingActionTaken')?.value?.trim() || '';
      const statusEl = document.getElementById('hearingStatus');

      if (!caseNumber || !hearingDate || !process) {
        if (statusEl) {
          statusEl.textContent = 'Please fill all required hearing fields (Case Number, Date & Process).';
          statusEl.className = 'update-status-msg error';
        }
        return;
      }

      await updateHearingInSupabase(caseNumber, hearingDate, process, actionTaken);

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
      if (hearingCaseSelect) hearingCaseSelect.value = '';
      renderHearingCaseInfo('');
      updateHearingLivePreview();

      if (statusEl) {
        statusEl.textContent = `📅 Hearing for "${caseNumber}" forwarded to ${formatDateDMY(hearingDate)} (${process}) successfully!`;
        statusEl.className = 'update-status-msg success';
      }

      alert(`✅ Hearing for Case "${caseNumber}" has been updated and forwarded to ${formatDateDMY(hearingDate)} (${process}) successfully!`);
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

  // 9. Case History Modal Listeners
  const closeHistoryModalBtn = document.getElementById('closeCaseHistoryModalBtn');
  if (closeHistoryModalBtn) {
    closeHistoryModalBtn.addEventListener('click', closeCaseHistoryModal);
  }

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeCaseHistoryModal);
  }

  const historyModalOverlay = document.getElementById('caseHistoryModal');
  if (historyModalOverlay) {
    historyModalOverlay.addEventListener('click', (e) => {
      if (e.target === historyModalOverlay) {
        closeCaseHistoryModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeCaseHistoryModal();
    }
  });

  loadCaseTasks();
  const todoCaseSelect = document.getElementById('todoCaseSelect');
  if (todoCaseSelect) {
    todoCaseSelect.addEventListener('change', onTodoCaseSelectChange);
  }

  // Close combobox dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('todoComboboxWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeTodoCaseDropdown();
    }
  });

  renderCaseTypeOptions();
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderSearchCourtFilterOptions();
  toggleCaseFormByType();
  toggleUpdateCaseFormByType();
  renderCourtsTable();
  renderCalendarView();
  fetchAllDataFromSupabase();
  filterCaseTables();
  setupDbManagerEventListeners();
}

// ==============================================================================
// Supabase Database Manager & Live CRUD Engine
// ==============================================================================

const DB_SCHEMAS = {
  civilcases: {
    title: 'civilcases',
    singular: 'Civil / Revenue Case',
    badge: 'civil',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'e.g. CIV-2026-001' },
      { name: 'case_year', label: 'Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'select', options: ['civil', 'revenue', 'complaint'], default: 'civil' },
      { name: 'case_name', label: 'Case Name / Title', type: 'text', placeholder: 'e.g. Plaintiff vs Defendant' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g. District Court' },
      { name: 'plaintiff', label: 'Plaintiff Name', type: 'text', required: true, placeholder: 'Plaintiff name' },
      { name: 'defendant', label: 'Defendant Name', type: 'text', required: true, placeholder: 'Defendant name' },
      { name: 'party_name', label: 'Party Name Reference', type: 'text', placeholder: 'Primary party reference' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Phone Number', type: 'tel', placeholder: 'Client contact number' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Evidence, Arguments, Notice' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Disposed', 'Stayed', 'Transferred'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  criminalcases: {
    title: 'criminalcases',
    singular: 'Criminal Case',
    badge: 'criminal',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'e.g. CR-2026-003' },
      { name: 'crime_year', label: 'Crime Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'criminal', readonly: true },
      { name: 'case_name', label: 'Case Name / Title', type: 'text', placeholder: 'e.g. State vs Accused' },
      { name: 'police_station', label: 'Police Station', type: 'text', required: true, placeholder: 'Police station name' },
      { name: 'crime_section', label: 'Crime Section (IPC / CrPC)', type: 'text', required: true, placeholder: 'e.g. IPC 302, IPC 379' },
      { name: 'crime_number', label: 'Crime / FIR Number', type: 'text', required: true, placeholder: 'e.g. CR-402' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'victim_name', label: 'Victim Name / State', type: 'text', required: true, placeholder: 'Victim or Complainant' },
      { name: 'accused_name', label: 'Accused Name', type: 'text', required: true, placeholder: 'Accused party name' },
      { name: 'party_name', label: 'Party Name Reference', type: 'text', placeholder: 'Primary party reference' },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g. District Court' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Phone Number', type: 'tel', placeholder: 'Client contact number' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Bail Hearing, Evidence' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Bail Granted', 'Convicted', 'Acquitted', 'Disposed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  hearings: {
    title: 'hearings',
    singular: 'Hearing Session',
    badge: 'civil',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'Linked case number' },
      { name: 'case_type', label: 'Case Type', type: 'select', options: ['civil', 'criminal', 'revenue', 'complaint'], default: 'civil' },
      { name: 'hearing_date', label: 'Hearing Date', type: 'date', required: true, default: () => new Date().toISOString().split('T')[0] },
      { name: 'process', label: 'Hearing Process / Stage', type: 'text', required: true, placeholder: 'e.g. Arguments, Evidence, Notice' },
      { name: 'judge_name', label: 'Judge Name / Bench', type: 'text', placeholder: 'Presiding judge' },
      { name: 'court_room', label: 'Court Room Number', type: 'text', placeholder: 'e.g. Room No. 4' },
      { name: 'action_taken', label: 'Action Taken / Court Order', type: 'textarea', placeholder: 'Summary of proceedings' },
      { name: 'next_hearing_date', label: 'Subsequent Fixed Hearing Date', type: 'date' },
      { name: 'remarks', label: 'Remarks / Advocate Notes', type: 'textarea', placeholder: 'Internal notes' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  courts: {
    title: 'courts',
    singular: 'Court Record',
    badge: 'revenue',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g. District Court' },
      { name: 'court_type', label: 'Court Type / Hierarchy', type: 'select', options: ['District Court', 'High Court', 'Supreme Court', 'Family Court', 'Tribunal', 'Session Court'], default: 'District Court' },
      { name: 'location', label: 'Location / Complex Address', type: 'text', placeholder: 'City, complex or area' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  case_todos: {
    title: 'case_todos',
    singular: 'Task / Deadline',
    badge: 'disposed',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'Linked case number' },
      { name: 'case_name', label: 'Case Name / Title', type: 'text', placeholder: 'Case title' },
      { name: 'task_title', label: 'Task Title', type: 'text', required: true, placeholder: 'e.g. Draft Bail Application' },
      { name: 'hearing_date', label: 'Target Hearing Date', type: 'date' },
      { name: 'deadline_date', label: 'Deadline Date', type: 'date', required: true, default: () => new Date().toISOString().split('T')[0] },
      { name: 'priority', label: 'Priority', type: 'select', options: ['urgent', 'high', 'medium', 'low'], default: 'medium' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed'], default: 'pending' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  }
};

let currentDbTable = 'civilcases';
let currentDbTableData = [];
let dbManagerInitialized = false;

function setupDbManagerEventListeners() {
  if (dbManagerInitialized) return;
  dbManagerInitialized = true;

  const tableSelect = document.getElementById('dbManagerTableSelect');
  if (tableSelect) {
    tableSelect.addEventListener('change', (e) => {
      currentDbTable = e.target.value;
      fetchAndRenderDbTable(currentDbTable);
    });
  }

  const refreshBtn = document.getElementById('dbManagerRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchAndRenderDbTable(currentDbTable);
    });
  }

  const addBtn = document.getElementById('dbManagerAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openDbAddModal();
    });
  }

  const searchInput = document.getElementById('dbManagerSearchInput');
  const clearBtn = document.getElementById('dbManagerSearchClearBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
      filterDbManagerRows(q);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      filterDbManagerRows('');
      searchInput.focus();
    });
  }

  const closeBtn = document.getElementById('dbModalCloseBtn');
  const cancelBtn = document.getElementById('dbModalCancelBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeDbModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeDbModal);

  // Close modal when clicking backdrop outside card
  const modalBackdrop = document.getElementById('dbManagerFormModal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeDbModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && modalBackdrop && !modalBackdrop.classList.contains('hidden')) {
      closeDbModal();
    }
  });
}

function initDbManagerTab() {
  setupDbManagerEventListeners();
  const select = document.getElementById('dbManagerTableSelect');
  if (select) {
    currentDbTable = select.value || 'civilcases';
  }
  fetchAndRenderDbTable(currentDbTable);
  populateDbModifierCaseSelect();
}

function populateDbModifierCaseSelect() {
  const typeSelect = document.getElementById('dbModCaseType');
  const caseSelect = document.getElementById('dbModCaseSelect');
  const datalist = document.getElementById('dbModCaseDatalist');
  const searchInput = document.getElementById('dbModCaseSearchInput');
  const hiddenId = document.getElementById('dbModSelectedCaseId');
  if (!typeSelect) return;

  const targetType = typeSelect.value || 'civil';
  const isCriminal = targetType === 'criminal';

  const cases = allCaseRecords.filter(c => {
    const ct = String(c.caseType || '').toLowerCase();
    return isCriminal ? ct === 'criminal' : ct !== 'criminal';
  });

  let selectHtml = '<option value="">-- Choose from List --</option>';
  let datalistHtml = '';

  cases.forEach(c => {
    const caseNo = c.caseNo || c.criminalCaseNumber || 'No Case Number';
    const year = c.year || c.caseYear || c.crimeYear || '—';
    const filingDate = c.filingDate || c.crimeFilingDate || '';
    const title = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
    const id = c.id || '';
    const label = `${caseNo} (Year: ${year}) ${title ? '— ' + title : ''}`;
    
    selectHtml += `<option value="${escapeHtml(id)}" data-caseno="${escapeHtml(caseNo)}" data-year="${escapeHtml(year)}" data-filingdate="${escapeHtml(filingDate)}">${escapeHtml(label)}</option>`;
    datalistHtml += `<option value="${escapeHtml(caseNo)} — ${escapeHtml(title || 'Matter')} (${escapeHtml(year)})"></option>`;
  });

  if (caseSelect) caseSelect.innerHTML = selectHtml;
  if (datalist) datalist.innerHTML = datalistHtml;
  
  // Clear inputs
  if (searchInput) searchInput.value = '';
  if (hiddenId) hiddenId.value = '';
  const caseNoInput = document.getElementById('dbModNewCaseNo');
  const yearInput = document.getElementById('dbModNewYear');
  const filingDateInput = document.getElementById('dbModNewFilingDate');
  const statusMsg = document.getElementById('dbModStatusMsg');
  if (caseNoInput) caseNoInput.value = '';
  if (yearInput) yearInput.value = '';
  if (filingDateInput) filingDateInput.value = '';
  if (statusMsg) statusMsg.textContent = '';
}

function onDbModifierCaseSearch(typedVal) {
  const query = (typedVal || '').trim().toLowerCase();
  const hiddenId = document.getElementById('dbModSelectedCaseId');
  const caseSelect = document.getElementById('dbModCaseSelect');
  const caseNoInput = document.getElementById('dbModNewCaseNo');
  const yearInput = document.getElementById('dbModNewYear');
  const filingDateInput = document.getElementById('dbModNewFilingDate');
  const statusMsg = document.getElementById('dbModStatusMsg');
  if (statusMsg) statusMsg.textContent = '';

  if (!query) {
    if (hiddenId) hiddenId.value = '';
    if (caseSelect) caseSelect.value = '';
    if (caseNoInput) caseNoInput.value = '';
    if (yearInput) yearInput.value = '';
    if (filingDateInput) filingDateInput.value = '';
    return;
  }

  const typeSelect = document.getElementById('dbModCaseType');
  const isCriminal = (typeSelect?.value || 'civil') === 'criminal';
  const cases = allCaseRecords.filter(c => {
    const ct = String(c.caseType || '').toLowerCase();
    return isCriminal ? ct === 'criminal' : ct !== 'criminal';
  });

  // Find exact or closest match
  const matched = cases.find(c => {
    const num = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
    const title = (c.caseName || '').toLowerCase();
    const fullTag = `${num} — ${title}`.toLowerCase();
    return num === query || fullTag.startsWith(query) || num.startsWith(query) || (query.length >= 3 && fullTag.includes(query));
  });

  if (matched) {
    if (hiddenId) hiddenId.value = matched.id;
    if (caseSelect) caseSelect.value = matched.id;
    const caseNo = matched.caseNo || matched.criminalCaseNumber || '';
    const year = matched.year || matched.caseYear || matched.crimeYear || '';
    const filingDate = matched.filingDate || matched.crimeFilingDate || '';

    if (caseNoInput) caseNoInput.value = caseNo;
    if (yearInput) yearInput.value = (year && year !== '—') ? parseInt(year, 10) || '' : '';
    if (filingDateInput) filingDateInput.value = filingDate;
  }
}

function onDbModifierCaseSelected(selectedId) {
  const caseSelect = document.getElementById('dbModCaseSelect');
  const searchInput = document.getElementById('dbModCaseSearchInput');
  const hiddenId = document.getElementById('dbModSelectedCaseId');
  const caseNoInput = document.getElementById('dbModNewCaseNo');
  const yearInput = document.getElementById('dbModNewYear');
  const filingDateInput = document.getElementById('dbModNewFilingDate');
  const statusMsg = document.getElementById('dbModStatusMsg');
  if (statusMsg) statusMsg.textContent = '';
  if (!caseSelect) return;

  const idToLoad = selectedId || caseSelect.value;
  if (idToLoad) {
    if (hiddenId) hiddenId.value = idToLoad;
    const matched = allCaseRecords.find(c => String(c.id) === String(idToLoad));
    if (matched) {
      const caseNo = matched.caseNo || matched.criminalCaseNumber || '';
      const year = matched.year || matched.caseYear || matched.crimeYear || '';
      const filingDate = matched.filingDate || matched.crimeFilingDate || '';
      const title = matched.caseName || '';

      if (searchInput) searchInput.value = `${caseNo} — ${title || 'Matter'} (${year})`;
      if (caseNoInput) caseNoInput.value = caseNo;
      if (yearInput) yearInput.value = (year && year !== '—') ? parseInt(year, 10) || '' : '';
      if (filingDateInput) filingDateInput.value = filingDate;
    }
  } else {
    if (hiddenId) hiddenId.value = '';
    if (searchInput) searchInput.value = '';
    if (caseNoInput) caseNoInput.value = '';
    if (yearInput) yearInput.value = '';
    if (filingDateInput) filingDateInput.value = '';
  }
}

async function executeDbCaseNumberYearUpdate() {
  const typeSelect = document.getElementById('dbModCaseType');
  const hiddenId = document.getElementById('dbModSelectedCaseId');
  const caseSelect = document.getElementById('dbModCaseSelect');
  const caseNoInput = document.getElementById('dbModNewCaseNo');
  const yearInput = document.getElementById('dbModNewYear');
  const filingDateInput = document.getElementById('dbModNewFilingDate');
  const syncHearingsCheckbox = document.getElementById('dbModSyncHearings');
  const statusMsg = document.getElementById('dbModStatusMsg');
  const submitBtn = document.getElementById('dbModSubmitBtn');

  const recordId = hiddenId?.value || caseSelect?.value;

  if (!recordId) {
    alert('Please type or select a case to modify.');
    return;
  }

  const newCaseNo = (caseNoInput?.value || '').trim();
  const newYearVal = parseInt(yearInput?.value, 10);
  const newFilingDate = (filingDateInput?.value || '').trim();

  if (!newCaseNo) {
    alert('Please enter a valid New Case Number.');
    caseNoInput?.focus();
    return;
  }

  if (isNaN(newYearVal) || newYearVal < 1950 || newYearVal > 2099) {
    alert('Please enter a valid 4-digit Filing / Case Year (e.g. 2024).');
    yearInput?.focus();
    return;
  }

  const loadedCase = allCaseRecords.find(c => String(c.id) === String(recordId));
  const oldCaseNo = loadedCase ? (loadedCase.caseNo || loadedCase.criminalCaseNumber) : '';
  const isCriminal = (typeSelect?.value || 'civil') === 'criminal';
  const tableName = isCriminal ? 'criminalcases' : 'civilcases';

  if (statusMsg) {
    statusMsg.style.color = '#2F68A1';
    statusMsg.textContent = '⏳ Saving updates directly to Supabase...';
  }
  if (submitBtn) submitBtn.disabled = true;

  try {
    const updatePayload = {
      case_number: newCaseNo,
      year: newYearVal,
      filing_date: newFilingDate || null,
      updated_at: new Date().toISOString()
    };
    if (isCriminal) {
      updatePayload.crime_year = newYearVal;
      updatePayload.crime_filing_date = newFilingDate || null;
    } else {
      updatePayload.case_year = newYearVal;
    }

    if (supabaseClient) {
      const { error: updateErr } = await supabaseClient
        .from(tableName)
        .update(updatePayload)
        .eq('id', recordId);

      if (updateErr) {
        throw updateErr;
      }

      // If sync hearings is enabled, cascade case_number update to hearings table
      if (syncHearingsCheckbox?.checked && oldCaseNo && oldCaseNo !== newCaseNo) {
        const { error: hearingErr } = await supabaseClient
          .from('hearings')
          .update({ case_number: newCaseNo, updated_at: new Date().toISOString() })
          .eq('case_number', oldCaseNo);
        if (hearingErr) {
          console.warn('Hearings cascading update notice:', hearingErr);
        }
      }
    }

    // Refresh application database records in memory
    await fetchAllDataFromSupabase();
    await fetchAndRenderDbTable(tableName);
    populateDbModifierCaseSelect();

    if (statusMsg) {
      statusMsg.style.color = '#10B981';
      statusMsg.textContent = `✅ Successfully updated Case Number to "${newCaseNo}", Year to ${newYearVal}, and Filing Date to ${newFilingDate || '—'}!`;
    }
    alert(`✅ Case details (Case Number, Year & Filing Date) updated successfully in Supabase table "${tableName}"!`);
  } catch (err) {
    console.error('Error updating case details:', err);
    if (statusMsg) {
      statusMsg.style.color = '#EF4444';
      statusMsg.textContent = `❌ Update failed: ${err.message || err}`;
    }
    alert(`❌ Failed to update case in Supabase: ${err.message || err}`);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

window.populateDbModifierCaseSelect = populateDbModifierCaseSelect;
window.onDbModifierCaseSearch = onDbModifierCaseSearch;
window.onDbModifierCaseSelected = onDbModifierCaseSelected;
window.executeDbCaseNumberYearUpdate = executeDbCaseNumberYearUpdate;

async function fetchAndRenderDbTable(tableName = currentDbTable) {
  currentDbTable = tableName;
  const schema = DB_SCHEMAS[tableName];
  if (!schema) return;

  const thead = document.getElementById('dbManagerTableHead');
  const tbody = document.getElementById('dbManagerTableBody');
  const tableBadge = document.getElementById('dbManagerTableBadge');
  const rowCountBadge = document.getElementById('dbManagerRowCountBadge');
  const liveIndicator = document.getElementById('dbManagerLiveIndicator');

  if (tableBadge) {
    tableBadge.textContent = `Table: ${schema.title}`;
    tableBadge.className = `case-badge ${schema.badge || 'civil'}`;
  }

  if (thead) {
    let headHtml = '';
    schema.columns.forEach(col => {
      headHtml += `<th title="${col.name}">${col.name}</th>`;
    });
    headHtml += `<th class="actions-col">Actions</th>`;
    thead.innerHTML = headHtml;
  }

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="${schema.columns.length + 1}" class="no-results">⏳ Fetching live records from Supabase table "${tableName}"...</td></tr>`;
  }

  let rows = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from(tableName).select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn(`Supabase fetch error on ${tableName}:`, error);
        if (liveIndicator) {
          liveIndicator.textContent = '🟡 Local Fallback (DB Error)';
          liveIndicator.style.background = '#fef3c7';
          liveIndicator.style.color = '#92400e';
          liveIndicator.style.borderColor = '#fde68a';
        }
      } else if (data) {
        rows = data;
        if (liveIndicator) {
          liveIndicator.textContent = '🟢 Supabase Live';
          liveIndicator.style.background = '#dcfce7';
          liveIndicator.style.color = '#166534';
          liveIndicator.style.borderColor = '#bbf7d0';
        }
      }
    } catch (err) {
      console.error('Supabase query exception:', err);
    }
  }

  // If no Supabase data, load from local in-memory fallback
  if (rows.length === 0 && (!supabaseClient || currentDbTableData.length === 0)) {
    if (tableName === 'civilcases') {
      rows = allCaseRecords.filter(c => c.caseType === 'civil' || c.caseType === 'revenue').map(c => ({
        id: c.id || 'local-' + Math.random().toString(36).substr(2, 9),
        case_number: c.caseNo,
        case_year: parseInt(c.caseYear, 10) || 2026,
        case_type: c.caseType || 'civil',
        case_name: c.caseName,
        filing_date: c.filingDate,
        court_name: c.courtName,
        plaintiff: c.plaintiff,
        defendant: c.defendant,
        party_name: c.partyName,
        client_name: c.clientName,
        client_number: c.clientNumber,
        next_hearing: c.nextHearing && c.nextHearing !== '—' ? c.nextHearing : null,
        hearing_process: c.hearingProcess,
        case_status: c.caseStatus,
        remark: c.remark,
        doc_link: c.docLink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } else if (tableName === 'criminalcases') {
      rows = allCaseRecords.filter(c => c.caseType === 'criminal').map(c => ({
        id: c.id || 'local-' + Math.random().toString(36).substr(2, 9),
        case_number: c.caseNo || c.criminalCaseNumber,
        crime_year: parseInt(c.caseYear || c.crimeYear, 10) || 2026,
        case_type: 'criminal',
        case_name: c.caseName,
        police_station: c.policeStation,
        crime_section: c.crimeSection,
        crime_number: c.crimeNumber,
        filing_date: c.filingDate || c.crimeFilingDate,
        victim_name: c.victimName,
        accused_name: c.accusedName,
        party_name: c.partyName,
        court_name: c.courtName || c.criminalCourtName,
        client_name: c.clientName || c.criminalClientName,
        client_number: c.clientNumber || c.criminalClientNumber,
        next_hearing: c.nextHearing && c.nextHearing !== '—' ? c.nextHearing : null,
        hearing_process: c.hearingProcess,
        case_status: c.caseStatus,
        remark: c.remark,
        doc_link: c.docLink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } else if (tableName === 'hearings') {
      rows = allHearingRecords.map(h => ({
        id: h.id || 'local-' + Math.random().toString(36).substr(2, 9),
        case_number: h.case_number,
        case_type: h.case_type || 'civil',
        hearing_date: h.hearing_date,
        process: h.process,
        judge_name: h.judge_name || null,
        court_room: h.court_room || null,
        action_taken: h.action_taken || null,
        next_hearing_date: h.next_hearing_date || null,
        remarks: h.remarks || null,
        created_at: h.created_at || new Date().toISOString(),
        updated_at: h.updated_at || new Date().toISOString()
      }));
    } else if (tableName === 'courts') {
      rows = courts.map((ct, idx) => ({
        id: 'local-court-' + (idx + 1),
        court_name: ct,
        court_type: 'District Court',
        location: 'City Court Complex',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } else if (tableName === 'case_todos') {
      rows = (caseTasks || []).map(t => ({
        id: t.id || 'local-todo-' + Math.random().toString(36).substr(2, 9),
        case_number: t.caseNo,
        case_name: t.caseName,
        task_title: t.taskTitle,
        hearing_date: t.hearingDate || null,
        deadline_date: t.deadlineDate,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }
  }

  currentDbTableData = rows;
  if (rowCountBadge) {
    rowCountBadge.textContent = `${rows.length} row${rows.length === 1 ? '' : 's'} in table`;
  }

  const searchInput = document.getElementById('dbManagerSearchInput');
  const searchQ = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (searchQ) {
    filterDbManagerRows(searchQ);
  } else {
    renderDbManagerRows(rows);
  }
}

function renderDbManagerRows(rowsToRender) {
  const schema = DB_SCHEMAS[currentDbTable];
  const tbody = document.getElementById('dbManagerTableBody');
  if (!tbody || !schema) return;

  if (rowsToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${schema.columns.length + 1}" class="no-results">No records found in table "${currentDbTable}". Use "➕ Insert New Row" to add data.</td></tr>`;
    return;
  }

  let html = '';
  rowsToRender.forEach((row, rIdx) => {
    html += `<tr>`;
    schema.columns.forEach(col => {
      let rawVal = row[col.name];
      let displayVal = '—';
      let cellClass = '';

      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (col.type === 'uuid') {
          cellClass = 'uuid-cell';
          displayVal = String(rawVal);
        } else if (col.type === 'timestamp') {
          cellClass = 'uuid-cell';
          try {
            displayVal = new Date(rawVal).toLocaleString('en-IN', { timeZone: 'UTC' });
          } catch (e) {
            displayVal = String(rawVal);
          }
        } else if (col.type === 'date') {
          displayVal = formatDateDMY(rawVal);
        } else if (col.type === 'url') {
          displayVal = `<a href="${rawVal}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline;">🔗 Link</a>`;
        } else {
          displayVal = escapeHtml(String(rawVal));
        }
      }

      html += `<td class="${cellClass}" title="${escapeHtml(String(rawVal ?? ''))}">${displayVal}</td>`;
    });

    const rowId = row.id || row.case_number || row.court_name || String(rIdx);
    const identifier = row.case_number || row.court_name || row.task_title || row.id || `Row #${rIdx + 1}`;

    html += `
      <td class="actions-cell">
        <button type="button" class="db-btn-edit" onclick="openDbEditModal('${escapeHtml(String(row.id || ''))}', ${rIdx})" title="Edit this record">✏️ Edit</button>
        <button type="button" class="db-btn-delete" onclick="handleDbDeleteRow('${escapeHtml(String(row.id || ''))}', '${escapeHtml(String(identifier))}', ${rIdx})" title="Delete this record permanently">🗑️ Delete</button>
      </td>
    `;
    html += `</tr>`;
  });

  tbody.innerHTML = html;
}

function filterDbManagerRows(query) {
  if (!query) {
    renderDbManagerRows(currentDbTableData);
    const rowCountBadge = document.getElementById('dbManagerRowCountBadge');
    if (rowCountBadge) {
      rowCountBadge.textContent = `${currentDbTableData.length} row${currentDbTableData.length === 1 ? '' : 's'} in table`;
    }
    return;
  }

  const filtered = currentDbTableData.filter(row => {
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(query);
    });
  });

  renderDbManagerRows(filtered);
  const rowCountBadge = document.getElementById('dbManagerRowCountBadge');
  if (rowCountBadge) {
    rowCountBadge.textContent = `${filtered.length} of ${currentDbTableData.length} matching`;
  }
}

function openDbAddModal() {
  const schema = DB_SCHEMAS[currentDbTable];
  if (!schema) return;

  const modal = document.getElementById('dbManagerFormModal');
  const title = document.getElementById('dbModalTitle');
  const subtitle = document.getElementById('dbModalSubtitle');
  const icon = document.getElementById('dbModalIcon');
  const recordIdInput = document.getElementById('dbRecordId');
  const recordActionInput = document.getElementById('dbRecordAction');
  const fieldsGrid = document.getElementById('dbDynamicFieldsGrid');
  const statusMsg = document.getElementById('dbModalStatusMsg');

  if (title) title.textContent = `Insert Record into "${schema.title}"`;
  if (subtitle) subtitle.textContent = `Create a new record in PostgreSQL table "${schema.title}"`;
  if (icon) icon.textContent = '➕';
  if (recordIdInput) recordIdInput.value = '';
  if (recordActionInput) recordActionInput.value = 'create';
  if (statusMsg) statusMsg.textContent = '';

  renderDynamicFormFields(schema, null);

  if (modal) modal.classList.remove('hidden');
}

function openDbEditModal(rowId, fallbackIndex = null) {
  const schema = DB_SCHEMAS[currentDbTable];
  if (!schema) return;

  let row = null;
  if (rowId) {
    row = currentDbTableData.find(r => String(r.id) === String(rowId));
  }
  if (!row && fallbackIndex !== null && currentDbTableData[fallbackIndex]) {
    row = currentDbTableData[fallbackIndex];
  }
  if (!row) {
    alert('Record could not be found for editing.');
    return;
  }

  const modal = document.getElementById('dbManagerFormModal');
  const title = document.getElementById('dbModalTitle');
  const subtitle = document.getElementById('dbModalSubtitle');
  const icon = document.getElementById('dbModalIcon');
  const recordIdInput = document.getElementById('dbRecordId');
  const recordActionInput = document.getElementById('dbRecordAction');
  const statusMsg = document.getElementById('dbModalStatusMsg');

  const recordName = row.case_number || row.court_name || row.task_title || row.id || 'Record';

  if (title) title.textContent = `Edit Record in "${schema.title}"`;
  if (subtitle) subtitle.textContent = `Editing: ${recordName} (ID: ${row.id || 'local'})`;
  if (icon) icon.textContent = '✏️';
  if (recordIdInput) recordIdInput.value = row.id || '';
  if (recordActionInput) recordActionInput.value = 'update';
  if (statusMsg) statusMsg.textContent = '';

  renderDynamicFormFields(schema, row);

  if (modal) modal.classList.remove('hidden');
}

function renderDynamicFormFields(schema, existingData = null) {
  const container = document.getElementById('dbDynamicFieldsGrid');
  if (!container) return;

  let html = '';

  schema.columns.forEach(col => {
    // Skip readonly timestamp & auto ID fields in insert form unless editing
    if (col.readonly && !existingData) return;

    let val = '';
    if (existingData && existingData[col.name] !== undefined && existingData[col.name] !== null) {
      val = existingData[col.name];
    } else if (col.default) {
      val = typeof col.default === 'function' ? col.default() : col.default;
    }

    const isFullWidth = col.type === 'textarea' || col.name === 'doc_link' || col.name === 'case_name' || col.name === 'action_taken' || col.name === 'task_title';
    const gridStyle = isFullWidth ? 'grid-column: 1 / -1;' : '';
    const reqAttr = col.required ? 'required' : '';
    const reqBadge = col.required ? '<span style="color:#ef4444;">*</span>' : '';
    const readonlyAttr = col.readonly ? 'readonly class="locked-input"' : '';

    html += `<div class="form-group" style="${gridStyle}">`;
    html += `<label for="db_field_${col.name}">${col.label} ${reqBadge}</label>`;

    if (col.type === 'select') {
      html += `<select id="db_field_${col.name}" name="${col.name}" class="form-select" ${reqAttr}>`;
      col.options.forEach(opt => {
        const isSelected = String(val).toLowerCase() === String(opt).toLowerCase() ? 'selected' : '';
        html += `<option value="${opt}" ${isSelected}>${opt}</option>`;
      });
      html += `</select>`;
    } else if (col.type === 'textarea') {
      html += `<textarea id="db_field_${col.name}" name="${col.name}" rows="3" placeholder="${col.placeholder || ''}" ${reqAttr} style="resize:vertical;">${escapeHtml(String(val || ''))}</textarea>`;
    } else {
      const inputType = col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : (col.type === 'url' ? 'url' : (col.type === 'tel' ? 'tel' : 'text')));
      html += `<input id="db_field_${col.name}" name="${col.name}" type="${inputType}" value="${escapeHtml(String(val || ''))}" placeholder="${col.placeholder || ''}" ${reqAttr} ${readonlyAttr}>`;
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}

function closeDbModal() {
  const modal = document.getElementById('dbManagerFormModal');
  if (modal) modal.classList.add('hidden');
  const form = document.getElementById('dbRecordForm');
  if (form) form.reset();
}

async function handleDbRecordFormSubmit(event) {
  if (event) {
    event.preventDefault();
  }

  const schema = DB_SCHEMAS[currentDbTable];
  if (!schema) return false;

  const recordId = document.getElementById('dbRecordId')?.value?.trim();
  const action = document.getElementById('dbRecordAction')?.value || 'create';
  const statusMsg = document.getElementById('dbModalStatusMsg');

  // Collect form data
  const payload = {};
  schema.columns.forEach(col => {
    if (col.readonly && col.name === 'id' && action === 'create') return;
    if (col.name === 'created_at' || col.name === 'updated_at') return;

    const el = document.getElementById(`db_field_${col.name}`);
    if (el) {
      let v = el.value.trim();
      if (col.type === 'number') {
        payload[col.name] = parseInt(v, 10) || col.default || 2026;
      } else if (col.type === 'date' && !v) {
        payload[col.name] = null;
      } else {
        payload[col.name] = v;
      }
    }
  });

  payload.updated_at = new Date().toISOString();

  if (statusMsg) {
    statusMsg.textContent = 'Saving to database...';
    statusMsg.className = 'update-status-msg';
  }

  if (action === 'create') {
    // Insert operation
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from(currentDbTable).insert([payload]).select();
        if (error) {
          console.error(`Supabase insert error on ${currentDbTable}:`, error);
          if (error.code === '23505') {
            alert(`❌ Duplicate Entry Error: A record with this unique value already exists in "${currentDbTable}".`);
          } else {
            alert(`⚠️ Failed to insert into Supabase: ${error.message || 'Unknown error'}`);
          }
          if (statusMsg) {
            statusMsg.textContent = `Error: ${error.message}`;
            statusMsg.className = 'update-status-msg error';
          }
          return false;
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
      }
    }

    // Refresh application state
    await fetchAllDataFromSupabase();
    await fetchAndRenderDbTable(currentDbTable);
    closeDbModal();
    alert(`✅ Record created in "${currentDbTable}" successfully!`);
  } else {
    // Update operation
    if (!recordId) {
      alert('Cannot update record without an ID.');
      return false;
    }

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from(currentDbTable).update(payload).eq('id', recordId);
        if (error) {
          console.error(`Supabase update error on ${currentDbTable}:`, error);
          alert(`⚠️ Failed to update record in Supabase: ${error.message || 'Unknown error'}`);
          if (statusMsg) {
            statusMsg.textContent = `Error: ${error.message}`;
            statusMsg.className = 'update-status-msg error';
          }
          return false;
        }
      } catch (err) {
        console.error('Supabase update exception:', err);
      }
    }

    // Refresh application state
    await fetchAllDataFromSupabase();
    await fetchAndRenderDbTable(currentDbTable);
    closeDbModal();
    alert(`✅ Record updated in "${currentDbTable}" successfully!`);
  }

  return false;
}

async function handleDbDeleteRow(rowId, identifier, rowIndex) {
  const schema = DB_SCHEMAS[currentDbTable];
  if (!schema) return;

  const confirmMsg = `Are you sure you want to PERMANENTLY delete this record from table "${currentDbTable}"?\n\nIdentifier: ${identifier}\nID: ${rowId || 'Local index #' + rowIndex}`;
  if (!confirm(confirmMsg)) return;

  if (supabaseClient && rowId && !rowId.startsWith('local-')) {
    try {
      const { error } = await supabaseClient.from(currentDbTable).delete().eq('id', rowId);
      if (error) {
        console.error(`Supabase delete error on ${currentDbTable}:`, error);
        alert(`⚠️ Failed to delete record from Supabase: ${error.message || 'Unknown error'}`);
        return;
      }
    } catch (err) {
      console.error('Supabase delete exception:', err);
    }
  } else {
    // Local in-memory removal
    if (rowIndex !== null && currentDbTableData[rowIndex]) {
      currentDbTableData.splice(rowIndex, 1);
    }
  }

  // Resync application state
  await fetchAllDataFromSupabase();
  await fetchAndRenderDbTable(currentDbTable);
  alert(`🗑️ Record deleted from "${currentDbTable}" successfully!`);
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

window.initDbManagerTab = initDbManagerTab;
window.fetchAndRenderDbTable = fetchAndRenderDbTable;
window.openDbAddModal = openDbAddModal;
window.openDbEditModal = openDbEditModal;
window.handleDbRecordFormSubmit = handleDbRecordFormSubmit;
window.handleDbDeleteRow = handleDbDeleteRow;
window.closeDbModal = closeDbModal;


window.renderSearchCourtFilterOptions = renderSearchCourtFilterOptions;
window.filterCaseTables = filterCaseTables;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
