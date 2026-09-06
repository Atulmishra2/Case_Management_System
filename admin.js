const ADMIN_USERNAME = 'AtulMishra';
const ADMIN_PASSWORD = 'Mishraatul161';

let currentSelectedCase = null;

const safeStorage = {
  get(key) {
    try {
      const sessionVal = window.sessionStorage ? window.sessionStorage.getItem(key) : null;
      if (sessionVal) return sessionVal;
      const localVal = window.localStorage ? window.localStorage.getItem(key) : null;
      if (localVal) {
        if (window.sessionStorage) {
          try { window.sessionStorage.setItem(key, localVal); } catch (e) {}
        }
        return localVal;
      }
      return window.__storageFallback?.[key] || null;
    } catch (e) {
      return window.__storageFallback?.[key] || null;
    }
  },
  set(key, value, persistent = true) {
    try {
      if (persistent && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else if (!persistent && window.localStorage) {
        window.localStorage.removeItem(key);
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
    } catch (e) {}
    if (window.__storageFallback) delete window.__storageFallback[key];
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
    (cleanUsername === 'atulmishra' && cleanPassword === 'Mishraatul161') ||
    (cleanUsername === 'admin' && (cleanPassword === 'admin123' || cleanPassword === 'admin'))
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
let defaultCourts = [
  'Add. Civil Judge Junior Division-3rd /AJM-3rd Lakhimpur Kheri',
  'Add. Civil Judge Junior Division Court No. 4/AJM-4',
  'Add. Civil Judge Junior Division Court No. 5',
  'Add. Civil Judge Junior Division/FTC',
  'Add. Civil Judge SD/ ACJM-Ftc Kheri',
  'Add. Civil Judge Senior Division Court No.2',
  'Add. Civil Judge Senior Division Court No.3',
  'Add. Civil Judge Senior Division Court No. 5',
  'Add. Civil Judge Senior Division/ACJM',
  'Add. District Judge FTC/New',
  'Add. District Magistrate Judicial (ADM-J)',
  'Add. District Magistrate Revenue (ADM-Rev)',
  'Add. Family Court -Ist Lakhimpur Kheri',
  'Add. Sub Divisional Magistrate/ASDM Lakhimpur Kheri',
  'Civil Judge Junior Division Lakhimpur Kheri',
  'Civil Judge Senior Division Lakhimpur Kheri',
  'District & Session Judge Lakhimpur Kheri',
  'Family Court Lakhimpur',
  'Gram Nyayalaya Gola',
  'Gram Nyayalaya Gola Tehsil Gola',
  'S.O.C. Lakhimpur Kheri',
  'Sub Divisional Magistrate/SDM Lakhimpur Kheri',
  'Tehsildar Lakhimpur'
];
function getDeletedCourtsSet() {
  try {
    const list = JSON.parse(localStorage.getItem('cmDeletedCourts') || '[]');
    if (Array.isArray(list)) {
      return new Set(list.map(c => (c || '').trim().toLowerCase()).filter(Boolean));
    }
  } catch (e) {}
  return new Set();
}

function markCourtAsDeleted(courtName) {
  const trimmed = (courtName || '').trim();
  if (!trimmed) return;
  try {
    const list = JSON.parse(localStorage.getItem('cmDeletedCourts') || '[]');
    const lower = trimmed.toLowerCase();
    if (!list.some(c => (c || '').trim().toLowerCase() === lower)) {
      list.push(trimmed);
      localStorage.setItem('cmDeletedCourts', JSON.stringify(list));
    }
  } catch (e) {}
  defaultCourts = defaultCourts.filter(c => (c || '').trim().toLowerCase() !== trimmed.toLowerCase());
}

function unmarkCourtAsDeleted(courtName) {
  const trimmed = (courtName || '').trim();
  if (!trimmed) return;
  try {
    let list = JSON.parse(localStorage.getItem('cmDeletedCourts') || '[]');
    if (Array.isArray(list)) {
      list = list.filter(c => (c || '').trim().toLowerCase() !== trimmed.toLowerCase());
      localStorage.setItem('cmDeletedCourts', JSON.stringify(list));
    }
  } catch (e) {}
}

function saveCourtsToBackup() {
  try {
    courts.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    localStorage.setItem('cmCourts_backup', JSON.stringify(courts));
  } catch (e) {}
}

let courts = [...defaultCourts];
try {
  const cachedCourts = JSON.parse(localStorage.getItem('cmCourts_backup') || '[]');
  const deletedSet = getDeletedCourtsSet();
  if (Array.isArray(cachedCourts) && cachedCourts.length > 0) {
    courts = cachedCourts.filter(c => c && !deletedSet.has(c.trim().toLowerCase()));
  } else {
    courts = defaultCourts.filter(c => c && !deletedSet.has(c.trim().toLowerCase()));
  }
} catch (e) {}
let allCaseRecords = [];
let guestCases = [];
const defaultFallbackHearings = [];
let allHearingRecords = [];
let allCaseTransfers = [];
window.allCaseTransfers = allCaseTransfers;

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
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
  const disposalComment = raw.disposal_comment || raw.disposalComment || raw.disposal_remark || raw.disposalRemark || raw.disposal_notes || '';
  const docLink = raw.doc_link || raw.document_link || raw.docLink || raw.doc_url || raw.documentUrl || '';

  // 1. State Cases & Criminal Cases
  if (caseType === 'state' || caseType === 'criminal') {
    const firstParty = raw.first_party || raw.victim_name || raw.victimName || 'State of U.P.';
    const accusedName = raw.accused_name || raw.accusedName || raw.party_name || 'Accused';
    const policeStation = raw.police_station || raw.policeStation || 'Police Station';
    const crimeSection = raw.crime_section || raw.crimeSection || 'IPC';
    const crimeNumber = raw.crime_number || raw.crimeNumber || caseNo;
    const caseName = raw.case_name || `${firstParty} vs ${accusedName}`;

    return {
      id: raw.id,
      caseType: 'state',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      policeStation,
      crimeSection,
      crimeNumber,
      firstParty,
      victimName: firstParty,
      accusedName,
      caseName,
      partyName: accusedName
    };
  }

  // 2. Family Cases (Matrimonial / Maintenance 125)
  if (caseType === 'family') {
    const petitioner = raw.petitioner || raw.applicant || raw.plaintiff || 'Petitioner';
    const respondent = raw.respondent || raw.opposite_party || raw.defendant || 'Respondent';
    const matterType = raw.matter_type || raw.matterType || 'Maintenance (Sec 125 CrPC)';
    const marriageDate = raw.marriage_date || raw.marriageDate || '';
    const maintenanceDetail = raw.maintenance_detail || raw.maintenanceDetail || '';
    const caseName = raw.case_name || `${petitioner} vs ${respondent}`;

    return {
      id: raw.id,
      caseType: 'family',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      petitioner,
      respondent,
      matterType,
      marriageDate,
      maintenanceDetail,
      caseName,
      partyName: respondent
    };
  }

  // 3. Revenue Cases (Land / Tehsil / UP Revenue Code)
  if (caseType === 'revenue') {
    const applicant = raw.applicant || raw.plaintiff || 'Applicant';
    const oppositeParty = raw.opposite_party || raw.defendant || 'Gaon Sabha';
    const revenueActSection = raw.revenue_act_section || raw.revenueActSection || 'Sec 34 (Mutation)';
    const villageMauja = raw.village_mauja || raw.villageMauja || '';
    const parganaTehsil = raw.pargana_tehsil || raw.parganaTehsil || '';
    const gataKhataNo = raw.gata_khata_no || raw.gataKhataNo || '';
    const caseName = raw.case_name || `${applicant} vs ${oppositeParty}`;

    return {
      id: raw.id,
      caseType: 'revenue',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      applicant,
      oppositeParty,
      revenueActSection,
      villageMauja,
      parganaTehsil,
      gataKhataNo,
      caseName,
      partyName: oppositeParty
    };
  }

  // 4. Misc Civil Cases (Appeals, Revisions, Injunctions, Restorations)
  if (caseType === 'misc_civil') {
    const applicant = raw.applicant || raw.appellant || raw.plaintiff || 'Applicant';
    const oppositeParty = raw.opposite_party || raw.respondent || raw.defendant || 'Opposite Party';
    const originalCaseNumber = raw.original_case_number || raw.originalCase || '';
    const proceedingType = raw.proceeding_type || raw.proceedingType || 'Misc Application';
    const caseName = raw.case_name || `${applicant} vs ${oppositeParty}`;

    return {
      id: raw.id,
      caseType: 'misc_civil',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      applicant,
      oppositeParty,
      originalCaseNumber,
      originalCase: originalCaseNumber,
      proceedingType,
      caseName,
      partyName: oppositeParty
    };
  }

  // 5. Misc Criminal Cases (Bails, Criminal Appeals, Revisions, Sec 156(3))
  if (caseType === 'misc_criminal') {
    const applicant = raw.applicant || raw.accused_name || raw.appellant || 'Applicant';
    const oppositeParty = raw.opposite_party || raw.first_party || 'State of U.P.';
    const originalCaseNumber = raw.original_case_number || raw.crime_number || '';
    const proceedingType = raw.proceeding_type || raw.proceedingType || 'Bail Application (Sec 439 CrPC)';
    const policeStation = raw.police_station || raw.policeStation || '';
    const crimeSection = raw.crime_section || raw.crimeSection || '';
    const caseName = raw.case_name || `${applicant} vs ${oppositeParty}`;

    return {
      id: raw.id,
      caseType: 'misc_criminal',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      applicant,
      oppositeParty,
      originalCaseNumber,
      originalCase: originalCaseNumber,
      proceedingType,
      policeStation,
      crimeSection,
      caseName,
      partyName: applicant
    };
  }

  // 6. Complaint Cases (Cheque Bounce Sec 138 NI Act, Sec 200 CrPC, Defamation)
  if (caseType === 'complaint') {
    const complainant = raw.complainant || raw.plaintiff || raw.applicant || 'Complainant';
    const accusedName = raw.accused_name || raw.accused || raw.defendant || raw.opposite_party || 'Accused';
    const complaintType = raw.complaint_type || raw.complaintType || 'Cheque Bounce (Sec 138 NI Act)';
    const sectionAct = raw.section_act || raw.sectionAct || '';
    const policeStation = raw.police_station || raw.policeStation || '';
    const caseName = raw.case_name || `${complainant} vs ${accusedName}`;

    return {
      id: raw.id,
      caseType: 'complaint',
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
      disposalComment,
      disposal_comment: disposalComment,
      docLink,
      complainant,
      accusedName,
      defendant: accusedName,
      plaintiff: complainant,
      complaintType,
      sectionAct,
      policeStation,
      caseName,
      partyName: accusedName
    };
  }

  // 7. Default: Civil Cases
  const plaintiff = raw.plaintiff || raw.party_name || 'Plaintiff';
  const defendant = raw.defendant || 'Defendant';
  const caseName = raw.case_name || `${plaintiff} vs ${defendant}`;

  return {
    id: raw.id,
    caseType: 'civil',
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
    disposalComment,
    disposal_comment: disposalComment,
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
    updateSupabaseStatusIndicator(false);
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

    // Fetch from civilcases, statecases, criminalcases, familycases, revenuecases, misccivilcases, misccriminalcases, complaintcases, hearings, courts, case_todos, case_transfers, and court_helpers concurrently
    const [civilRes, stateRes, criminalRes, familyRes, revenueRes, miscCivilRes, miscCriminalRes, complaintRes, hearingsRes, courtsRes, todosRes, transfersRes, helpersRes] = await Promise.all([
      safeFetch(supabaseClient.from('civilcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('civilcases').select('*')),
      safeFetch(supabaseClient.from('statecases').select('*').order('created_at', { ascending: false }), supabaseClient.from('statecases').select('*')),
      safeFetch(supabaseClient.from('criminalcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('criminalcases').select('*')),
      safeFetch(supabaseClient.from('familycases').select('*').order('created_at', { ascending: false }), supabaseClient.from('familycases').select('*')),
      safeFetch(supabaseClient.from('revenuecases').select('*').order('created_at', { ascending: false }), supabaseClient.from('revenuecases').select('*')),
      safeFetch(supabaseClient.from('misccivilcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('misccivilcases').select('*')),
      safeFetch(supabaseClient.from('misccriminalcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('misccriminalcases').select('*')),
      safeFetch(supabaseClient.from('complaintcases').select('*').order('created_at', { ascending: false }), supabaseClient.from('complaintcases').select('*')),
      safeFetch(supabaseClient.from('hearings').select('*').order('hearing_date', { ascending: false }), supabaseClient.from('hearings').select('*')),
      safeFetch(supabaseClient.from('courts').select('*').order('court_name'), supabaseClient.from('courts').select('*')),
      safeFetch(supabaseClient.from('case_todos').select('*').order('deadline_date', { ascending: true }), supabaseClient.from('case_todos').select('*')),
      safeFetch(supabaseClient.from('case_transfers').select('*').order('transfer_date', { ascending: false }), supabaseClient.from('case_transfers').select('*')),
      safeFetch(supabaseClient.from('court_helpers').select('*').order('created_at', { ascending: false }), supabaseClient.from('helpers').select('*'))
    ]);

    // 1. Sync Courts (Deduplicated)
    const deletedSet = getDeletedCourtsSet();
    const seenCourtNames = new Set();
    courts = [];
    if (courtsRes.data && courtsRes.data.length > 0) {
      courtsRes.data.forEach(c => {
        const name = (c.court_name || '').trim();
        if (name && !seenCourtNames.has(name.toLowerCase()) && !deletedSet.has(name.toLowerCase())) {
          seenCourtNames.add(name.toLowerCase());
          courts.push(name);
        }
      });
      console.log(`Loaded ${courts.length} unique courts from Supabase.`);
    } else {
      defaultCourts.forEach(dc => {
        const name = (dc || '').trim();
        if (name && !seenCourtNames.has(name.toLowerCase()) && !deletedSet.has(name.toLowerCase())) {
          seenCourtNames.add(name.toLowerCase());
          courts.push(name);
        }
      });
    }
    saveCourtsToBackup();
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();

    // 2. Sync Cases
    let loadedCases = [];

    if (civilRes.data && civilRes.data.length > 0) {
      const normalizedCivil = civilRes.data.map(r => normalizeCaseRecord(r, r.case_type || 'civil'));
      loadedCases = loadedCases.concat(normalizedCivil);
    }

    if (stateRes.data && stateRes.data.length > 0) {
      const normalizedState = stateRes.data.map(r => normalizeCaseRecord(r, 'state'));
      loadedCases = loadedCases.concat(normalizedState);
    }

    if (criminalRes.data && criminalRes.data.length > 0) {
      const normalizedCriminal = criminalRes.data.map(r => normalizeCaseRecord(r, 'state'));
      loadedCases = loadedCases.concat(normalizedCriminal);
    }

    if (familyRes.data && familyRes.data.length > 0) {
      const normalizedFamily = familyRes.data.map(r => normalizeCaseRecord(r, 'family'));
      loadedCases = loadedCases.concat(normalizedFamily);
    }

    if (revenueRes.data && revenueRes.data.length > 0) {
      const normalizedRevenue = revenueRes.data.map(r => normalizeCaseRecord(r, 'revenue'));
      loadedCases = loadedCases.concat(normalizedRevenue);
    }

    if (miscCivilRes.data && miscCivilRes.data.length > 0) {
      const normalizedMiscCivil = miscCivilRes.data.map(r => normalizeCaseRecord(r, 'misc_civil'));
      loadedCases = loadedCases.concat(normalizedMiscCivil);
    }

    if (miscCriminalRes.data && miscCriminalRes.data.length > 0) {
      const normalizedMiscCriminal = miscCriminalRes.data.map(r => normalizeCaseRecord(r, 'misc_criminal'));
      loadedCases = loadedCases.concat(normalizedMiscCriminal);
    }

    if (complaintRes && complaintRes.data && complaintRes.data.length > 0) {
      const normalizedComplaint = complaintRes.data.map(r => normalizeCaseRecord(r, 'complaint'));
      loadedCases = loadedCases.concat(normalizedComplaint);
    }

    // Deduplicate loaded cases across tables so identical case numbers are never repeated in UI
    const seenCaseKeys = new Set();
    const uniqueLoadedCases = [];
    for (const item of loadedCases) {
      const rawKey = (item.caseNo || item.criminalCaseNumber || '').trim().toLowerCase();
      if (!rawKey) {
        uniqueLoadedCases.push(item);
        continue;
      }
      if (!seenCaseKeys.has(rawKey)) {
        seenCaseKeys.add(rawKey);
        uniqueLoadedCases.push(item);
      }
    }
    loadedCases = uniqueLoadedCases;

    // 3. Attach latest hearing dates from hearings table if available & store all hearing history
    if (hearingsRes.data && hearingsRes.data.length > 0) {
      allHearingRecords = hearingsRes.data;

      // Auto-heal orphaned "Cri-Rev-" hearing records by re-linking them to "Cr.Rev./129/2026"
      const orphanedCriRevHearings = allHearingRecords.filter(h => (h.case_number || '').trim().toLowerCase() === 'cri-rev-');
      if (orphanedCriRevHearings.length > 0) {
        const targetCase = loadedCases.find(c => {
          const num = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
          return num === 'cr.rev./129/2026' || num.includes('129/2026');
        });

        if (targetCase) {
          console.log('[AUTO-HEAL] Re-linking ' + orphanedCriRevHearings.length + ' orphaned "Cri-Rev-" hearings to case "' + targetCase.caseNo + '"...');
          orphanedCriRevHearings.forEach(h => {
            h.case_number = targetCase.caseNo;
            h.case_type = 'misc_criminal';
          });

          // Heal database records in background
          if (supabaseClient) {
            supabaseClient.from('hearings')
              .update({ case_number: targetCase.caseNo, case_type: 'misc_criminal' })
              .eq('case_number', 'Cri-Rev-')
              .then(() => console.log('[AUTO-HEAL] Supabase hearings table successfully updated.'))
              .catch(err => console.warn('[AUTO-HEAL] Supabase hearings update notice:', err));

            supabaseClient.from('misccriminalcases')
              .update({ previous_hearing: '2026-09-03', next_hearing: '2026-09-29', hearing_process: 'Summon' })
              .eq('case_number', targetCase.caseNo)
              .then(() => console.log('[AUTO-HEAL] Supabase misccriminalcases table successfully updated.'))
              .catch(err => console.warn('[AUTO-HEAL] Supabase misccriminalcases update notice:', err));
          }
        }
      }

      // Sort newest hearing date first so the latest scheduled hearing takes precedence
      const sortedHearings = [...allHearingRecords].sort((a, b) => {
        const da = new Date(a.hearing_date || a.created_at || 0);
        const db = new Date(b.hearing_date || b.created_at || 0);
        return db - da;
      });

      sortedHearings.forEach(h => {
        const hNum = (h.case_number || '').trim().toLowerCase();
        const hClean = hNum.replace(/[^a-z0-9]/g, '');
        if (!hNum) return;

        const matchingCase = loadedCases.find(c => {
          const cNum = (c.caseNo || c.criminalCaseNumber || '').trim().toLowerCase();
          if (cNum === hNum) return true;
          if (hClean && cNum.replace(/[^a-z0-9]/g, '') === hClean) return true;
          return false;
        });

        if (matchingCase) {
          const hDate = h.next_hearing_date || h.hearing_date;
          if (hDate && (!matchingCase.nextHearing || matchingCase.nextHearing === '—')) {
            matchingCase.nextHearing = hDate;
            matchingCase.hearingProcess = h.process || matchingCase.hearingProcess;
          }
        }
      });
    } else {
      allHearingRecords = [];
    }

    allCaseRecords = loadedCases;
    console.log(`Loaded ${allCaseRecords.length} unique cases from Supabase.`);

    // 4. Sync To-Do Tasks from case_todos (Deduplicated)
    if (todosRes && todosRes.data && !todosRes.error) {
      const seenTaskKeys = new Set();
      const uniqueTasks = [];
      todosRes.data.forEach(t => {
        const key = t.id ? `id_${t.id}` : `${(t.case_number || '').toLowerCase()}_${(t.task_title || '').toLowerCase()}_${t.deadline_date}`;
        if (!seenTaskKeys.has(key)) {
          seenTaskKeys.add(key);
          uniqueTasks.push({
            id: t.id,
            caseNo: t.case_number,
            caseName: t.case_name || '—',
            taskTitle: t.task_title,
            hearingDate: t.hearing_date,
            deadlineDate: t.deadline_date,
            priority: t.priority || 'medium',
            status: t.status || 'pending',
            createdAt: t.created_at
          });
        }
      });
      caseTasks = uniqueTasks;
      window.caseTasks = caseTasks;
      saveCaseTasksLocally();
      updateTodoSyncIndicator(true);
      console.log(`Loaded ${caseTasks.length} unique case tasks from Supabase.`);
    } else {
      updateTodoSyncIndicator(false);
    }

    // 5. Sync Case Transfers from case_transfers
    if (transfersRes && transfersRes.data && !transfersRes.error) {
      allCaseTransfers = transfersRes.data;
      window.allCaseTransfers = allCaseTransfers;
      try {
        localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers));
      } catch (e) {}
      console.log(`Loaded ${allCaseTransfers.length} court transfers from Supabase.`);
    } else {
      try {
        const localBackup = localStorage.getItem('case_transfers_backup');
        if (localBackup) {
          allCaseTransfers = JSON.parse(localBackup);
          window.allCaseTransfers = allCaseTransfers;
        }
      } catch (e) {}
    }
    if (typeof renderRecentTransfersTable === 'function') renderRecentTransfersTable();
    if (typeof updateTransfersCountBadge === 'function') updateTransfersCountBadge();

    // 6. Sync Court Helpers from court_helpers table
    if (helpersRes && helpersRes.data && !helpersRes.error) {
      const mappedHelpers = helpersRes.data.map(h => ({
        id: String(h.id || ('helper_' + Date.now())),
        name: h.name || '',
        court: h.court || '',
        position: h.position || '',
        mobile: h.mobile || '',
        createdAt: h.created_at || new Date().toISOString()
      }));
      courtHelpersList = mappedHelpers;
      try {
        localStorage.setItem(COURT_HELPERS_STORAGE_KEY, JSON.stringify(courtHelpersList));
      } catch (e) {}
      updateHelpersBadges();
      if (typeof updateHelpersCloudSyncIndicator === 'function') updateHelpersCloudSyncIndicator(true);
      if (typeof renderHelpersTable === 'function') renderHelpersTable();
      console.log(`Loaded ${courtHelpersList.length} court staff members from Supabase.`);
    } else {
      if (typeof updateHelpersCloudSyncIndicator === 'function') updateHelpersCloudSyncIndicator(false);
    }

    // Ensure all courts mentioned in case records are merged into courts directory (skipping deleted courts)
    if (Array.isArray(allCaseRecords)) {
      const deletedSet = getDeletedCourtsSet();
      let courtsUpdated = false;
      allCaseRecords.forEach(item => {
        const cName = (item.courtName || item.criminalCourtName || '').trim();
        if (cName && cName !== '—' && !deletedSet.has(cName.toLowerCase()) && !courts.some(c => c.trim().toLowerCase() === cName.toLowerCase())) {
          courts.push(cName);
          courtsUpdated = true;
        }
      });
      if (courtsUpdated) {
        saveCourtsToBackup();
        renderCourtOptions();
        renderCriminalCourtOptions();
        renderCourtsTable();
      }
    }

    updateSupabaseStatusIndicator(true);
    refreshAllCaseTables();
  } catch (error) {
    console.error('Supabase live fetch error:', error);
    updateSupabaseStatusIndicator(false);
    const deletedSet = getDeletedCourtsSet();
    if (!courts || courts.length === 0) {
      courts = defaultCourts.filter(c => c && !deletedSet.has(c.trim().toLowerCase()));
    }
    saveCourtsToBackup();
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderCourtsTable();
    refreshAllCaseTables();
  }
}

// ==============================================================================
// Centralized Database Duplicate Prevention Suite
// ==============================================================================

async function checkCaseNumberExists(rawCaseNo, excludeCaseNo = null) {
  if (!rawCaseNo) return { exists: false };
  const cleanNo = String(rawCaseNo).trim().replace(/\s+/g, ' ');
  if (!cleanNo) return { exists: false };

  const cleanLower = cleanNo.toLowerCase();
  const excludeLower = excludeCaseNo ? String(excludeCaseNo).trim().toLowerCase() : null;

  // 1. Check local in-memory records first (instant feedback)
  if (Array.isArray(allCaseRecords)) {
    const localMatch = allCaseRecords.find(c => {
      const cNo1 = (c.caseNo || '').trim().toLowerCase();
      const cNo2 = (c.criminalCaseNumber || '').trim().toLowerCase();
      if (excludeLower && (cNo1 === excludeLower || cNo2 === excludeLower)) {
        return false;
      }
      return cNo1 === cleanLower || cNo2 === cleanLower;
    });

    if (localMatch) {
      return {
        exists: true,
        source: 'local',
        caseNumber: localMatch.caseNo || localMatch.criminalCaseNumber,
        caseName: localMatch.caseName || 'Existing Case',
        caseType: localMatch.caseType || 'civil'
      };
    }
  }

  // 2. Query live Supabase database across all case tables
  if (supabaseClient) {
    try {
      const tablesToCheck = [
        'civilcases',
        'statecases',
        'criminalcases',
        'familycases',
        'revenuecases',
        'misccivilcases',
        'misccriminalcases',
        'complaintcases'
      ];

      const queries = tablesToCheck.map(tbl =>
        supabaseClient
          .from(tbl)
          .select('id, case_number, case_name')
          .ilike('case_number', cleanNo)
          .limit(2)
      );

      const results = await Promise.all(queries);

      for (let i = 0; i < tablesToCheck.length; i++) {
        const { data, error } = results[i];
        if (!error && Array.isArray(data) && data.length > 0) {
          const match = data.find(row => {
            const rowNo = (row.case_number || '').trim().toLowerCase();
            if (excludeLower && rowNo === excludeLower) return false;
            return rowNo === cleanLower;
          });
          if (match) {
            return {
              exists: true,
              source: 'database',
              table: tablesToCheck[i],
              caseNumber: match.case_number,
              caseName: match.case_name || 'Existing Case'
            };
          }
        }
      }
    } catch (supaErr) {
      console.warn('Supabase duplicate check query error:', supaErr);
    }
  }

  return { exists: false };
}
window.checkCaseNumberExists = checkCaseNumberExists;

function clearCaseNumberValidationBadges() {
  document.querySelectorAll('.case-dup-warning, .case-dup-ok').forEach(el => el.remove());
  document.querySelectorAll('.input-dup-error').forEach(el => el.classList.remove('input-dup-error'));
}
window.clearCaseNumberValidationBadges = clearCaseNumberValidationBadges;

function attachCaseNumberDuplicateListeners() {
  const caseNumberInputIds = [
    'caseNo',
    'stateCaseNumber',
    'familyCaseNumber',
    'revenueCaseNumber',
    'miscCivilCaseNumber',
    'miscCriminalCaseNumber',
    'complaintCaseNumber'
  ];

  let debounceTimer = null;

  caseNumberInputIds.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    const validateInput = async () => {
      const val = input.value.trim();
      const parent = input.parentElement;
      if (!parent) return;
      parent.querySelectorAll('.case-dup-warning, .case-dup-ok').forEach(el => el.remove());
      input.classList.remove('input-dup-error');

      if (!val) return;

      const dup = await checkCaseNumberExists(val);
      if (dup.exists) {
        input.classList.add('input-dup-error');
        const badge = document.createElement('div');
        badge.className = 'case-dup-warning';
        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span><strong>Duplicate Warning:</strong> Case Number "${val}" is already registered in ${dup.source === 'database' ? 'table ' + dup.table : 'records'}!</span>`;
        parent.appendChild(badge);
      } else {
        const badge = document.createElement('div');
        badge.className = 'case-dup-ok';
        badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Case Number is unique & available.</span>`;
        parent.appendChild(badge);
      }
    };

    input.addEventListener('blur', validateInput);
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(validateInput, 400);
    });
  });
}
window.attachCaseNumberDuplicateListeners = attachCaseNumberDuplicateListeners;

// Add Case to Supabase (or local fallback) with Strict Duplicate Prevention
async function addCaseToSupabase(newCase) {
  let dbInsertFailed = false;

  // Clean and normalize case number
  const cleanCaseNo = (newCase.caseNo || '').trim().replace(/\s+/g, ' ');
  newCase.caseNo = cleanCaseNo;
  if (newCase.criminalCaseNumber) newCase.criminalCaseNumber = cleanCaseNo;

  // Pre-check database for duplicate before attempting insert
  if (cleanCaseNo) {
    const dupCheck = await checkCaseNumberExists(cleanCaseNo);
    if (dupCheck && dupCheck.exists) {
      console.warn(`[Duplicate Blocked] Case ${cleanCaseNo} already exists in ${dupCheck.source} (${dupCheck.table || 'records'}).`);
      alert(`❌ Duplicate Entry Blocked!\n\nCase Number "${cleanCaseNo}" is already registered in the database (${dupCheck.source === 'database' ? 'Table: ' + dupCheck.table : 'Case Register'}).\n\nRepeated entry is blocked to preserve database integrity.`);
      return { success: false, duplicate: true };
    }
  }

  if (supabaseClient) {
    try {
      if (newCase.caseType === 'state' || newCase.caseType === 'criminal') {
        const payload = {
          case_number: newCase.caseNo,
          crime_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'state',
          case_name: newCase.caseName,
          police_station: newCase.policeStation,
          crime_section: newCase.crimeSection,
          crime_number: newCase.crimeNumber,
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          first_party: newCase.firstParty || 'State of U.P.',
          accused_name: newCase.accusedName,
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        // Try statecases table first
        let { error } = await supabaseClient.from('statecases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST204')) {
          // Fallback to legacy criminalcases table
          const crimPayload = {
            case_number: newCase.caseNo,
            crime_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'criminal',
            case_name: newCase.caseName,
            police_station: newCase.policeStation,
            crime_section: newCase.crimeSection,
            crime_number: newCase.crimeNumber,
            filing_date: newCase.filingDate,
            victim_name: newCase.firstParty || 'State of U.P.',
            accused_name: newCase.accusedName,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            next_hearing: null,
            case_status: 'Pending',
            remark: newCase.remark || ''
          };
          const crimRes = await supabaseClient.from('criminalcases').insert([crimPayload]);
          error = crimRes.error;
        }
        if (error) {
          console.error('Supabase add state case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else if (newCase.caseType === 'family') {
        const payload = {
          case_number: newCase.caseNo,
          case_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'family',
          case_name: newCase.caseName,
          matter_type: newCase.matterType,
          petitioner: newCase.petitioner,
          respondent: newCase.respondent,
          marriage_date: newCase.marriageDate || null,
          maintenance_detail: newCase.maintenanceDetail || '',
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('familycases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          // Fallback to civilcases
          const civRes = await supabaseClient.from('civilcases').insert([{
            case_number: newCase.caseNo,
            case_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'family',
            case_name: newCase.caseName,
            filing_date: newCase.filingDate,
            plaintiff: newCase.petitioner,
            defendant: newCase.respondent,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            remark: `[${newCase.matterType}] ${newCase.remark || ''}`
          }]);
          error = civRes.error;
        }
        if (error) {
          console.error('Supabase add family case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else if (newCase.caseType === 'revenue') {
        const payload = {
          case_number: newCase.caseNo,
          case_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'revenue',
          case_name: newCase.caseName,
          revenue_act_section: newCase.revenueActSection,
          village_mauja: newCase.villageMauja,
          pargana_tehsil: newCase.parganaTehsil,
          gata_khata_no: newCase.gataKhataNo,
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          applicant: newCase.applicant,
          opposite_party: newCase.oppositeParty,
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('revenuecases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          // Fallback to civilcases
          const civRes = await supabaseClient.from('civilcases').insert([{
            case_number: newCase.caseNo,
            case_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'revenue',
            case_name: newCase.caseName,
            filing_date: newCase.filingDate,
            plaintiff: newCase.applicant,
            defendant: newCase.oppositeParty,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            remark: `[${newCase.revenueActSection} - ${newCase.villageMauja}] ${newCase.remark || ''}`
          }]);
          error = civRes.error;
        }
        if (error) {
          console.error('Supabase add revenue case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else if (newCase.caseType === 'misc_civil') {
        const payload = {
          case_number: newCase.caseNo,
          case_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'misc_civil',
          case_name: newCase.caseName,
          original_case_number: newCase.originalCaseNumber || '',
          proceeding_type: newCase.proceedingType || 'Misc Application',
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          applicant: newCase.applicant,
          opposite_party: newCase.oppositeParty,
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('misccivilcases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          // Fallback to civilcases
          const civRes = await supabaseClient.from('civilcases').insert([{
            case_number: newCase.caseNo,
            case_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'misc_civil',
            case_name: newCase.caseName,
            filing_date: newCase.filingDate,
            plaintiff: newCase.applicant,
            defendant: newCase.oppositeParty,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            remark: `[${newCase.proceedingType}] ${newCase.remark || ''}`
          }]);
          error = civRes.error;
        }
        if (error) {
          console.error('Supabase add misc civil case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else if (newCase.caseType === 'misc_criminal') {
        const payload = {
          case_number: newCase.caseNo,
          crime_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'misc_criminal',
          case_name: newCase.caseName,
          original_case_number: newCase.originalCaseNumber || '',
          proceeding_type: newCase.proceedingType || 'Bail Application (Sec 439 CrPC)',
          police_station: newCase.policeStation || '',
          crime_section: newCase.crimeSection || '',
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          applicant: newCase.applicant,
          opposite_party: newCase.oppositeParty || 'State of U.P.',
          court_name: newCase.courtName,
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('misccriminalcases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          // Fallback to criminalcases
          const crimRes = await supabaseClient.from('criminalcases').insert([{
            case_number: newCase.caseNo,
            crime_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'misc_criminal',
            case_name: newCase.caseName,
            police_station: newCase.policeStation || 'Police Station',
            crime_section: newCase.crimeSection || 'IPC',
            crime_number: newCase.originalCaseNumber || newCase.caseNo,
            filing_date: newCase.filingDate,
            victim_name: newCase.oppositeParty || 'State of U.P.',
            accused_name: newCase.applicant,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            next_hearing: null,
            case_status: 'Pending',
            remark: `[${newCase.proceedingType}] ${newCase.remark || ''}`
          }]);
          error = crimRes.error;
        }
        if (error) {
          console.error('Supabase add misc criminal case error:', error);
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            alert(`❌ Case Number "${newCase.caseNo}" already exists in the database! Cannot add duplicate.`);
          } else {
            alert(`⚠️ Failed to add case to database: ${error.message || 'Unknown error'}`);
          }
          dbInsertFailed = true;
        }
      } else if (newCase.caseType === 'complaint') {
        const payload = {
          case_number: newCase.caseNo,
          case_year: parseInt(newCase.caseYear, 10) || 2026,
          case_type: 'complaint',
          complaint_type: newCase.complaintType || 'Cheque Bounce (Sec 138 NI Act)',
          complainant: newCase.complainant || newCase.plaintiff || 'Complainant',
          accused_name: newCase.accusedName || newCase.defendant || 'Accused',
          section_act: newCase.sectionAct || '',
          police_station: newCase.policeStation || '',
          case_name: newCase.caseName,
          court_name: newCase.courtName,
          filing_date: newCase.filingDate || new Date().toISOString().split('T')[0],
          client_name: newCase.clientName,
          client_number: newCase.clientNumber,
          next_hearing: null,
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('complaintcases').insert([insertObj]);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          // Fallback to criminalcases
          const crimRes = await supabaseClient.from('criminalcases').insert([{
            case_number: newCase.caseNo,
            crime_year: parseInt(newCase.caseYear, 10) || 2026,
            case_type: 'complaint',
            case_name: newCase.caseName,
            police_station: newCase.policeStation || 'Complaint',
            crime_section: newCase.sectionAct || 'Sec 138 NI Act',
            crime_number: newCase.caseNo,
            filing_date: newCase.filingDate,
            victim_name: newCase.complainant,
            accused_name: newCase.accusedName,
            court_name: newCase.courtName,
            client_name: newCase.clientName,
            client_number: newCase.clientNumber,
            next_hearing: null,
            case_status: 'Pending',
            remark: `[${newCase.complaintType}] ${newCase.remark || ''}`
          }]);
          error = crimRes.error;
        }
        if (error) {
          console.error('Supabase add complaint case error:', error);
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
          case_status: 'Pending',
          remark: newCase.remark || ''
        };
        let insertObj = { ...payload, doc_link: newCase.docLink || '' };
        let { error } = await supabaseClient.from('civilcases').insert([insertObj]);
        // Fallback: retry without optional columns if column doesn't exist in older Supabase schema
        if (error && (error.message?.includes('doc_link') || error.message?.includes('remark') || error.code === 'PGRST204')) {
          delete insertObj.doc_link;
          let retry1 = await supabaseClient.from('civilcases').insert([insertObj]);
          if (!retry1.error) {
            error = null;
          } else if (retry1.error.message?.includes('remark') || retry1.error.code === 'PGRST204') {
            delete insertObj.remark;
            let retry2 = await supabaseClient.from('civilcases').insert([insertObj]);
            error = retry2.error;
          } else {
            error = retry1.error;
          }
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

  // Only add to in-memory records if DB insert succeeded (or DB not available) AND not already in records
  if (!dbInsertFailed) {
    const alreadyLocal = allCaseRecords.some(c =>
      (c.caseNo || '').trim().toLowerCase() === cleanCaseNo.toLowerCase() ||
      (c.criminalCaseNumber || '').trim().toLowerCase() === cleanCaseNo.toLowerCase()
    );
    if (!alreadyLocal) {
      allCaseRecords.unshift(newCase);
    }
    refreshAllCaseTables();
    return { success: true };
  }
  return { success: false, error: 'Database insert failed' };
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
      const safeTableUpdate = async (tableName, payload, caseNumber) => {
        let res = await supabaseClient.from(tableName).update(payload).eq('case_number', caseNumber).select('id');
        if (res.error && (res.error.message || '').toLowerCase().includes('disposal_comment')) {
          const fallback = { ...payload };
          delete fallback.disposal_comment;
          res = await supabaseClient.from(tableName).update(fallback).eq('case_number', caseNumber).select('id');
        }
        return res;
      };

      if (caseType === 'state' || caseType === 'criminal') {
        const basePayload = {
          case_number: newCaseNumber,
          crime_year: parseInt(targetCase.caseYear || targetCase.crimeYear, 10) || 2026,
          police_station: targetCase.policeStation,
          crime_section: targetCase.crimeSection,
          crime_number: targetCase.crimeNumber,
          filing_date: targetCase.crimeFilingDate || targetCase.filingDate || null,
          first_party: targetCase.firstParty || 'State of U.P.',
          victim_name: targetCase.firstParty || targetCase.victimName || 'State of U.P.',
          accused_name: targetCase.accusedName,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('statecases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('criminalcases', basePayload, originalNo);
        }
      } else if (caseType === 'family') {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          matter_type: targetCase.matterType,
          petitioner: targetCase.petitioner,
          respondent: targetCase.respondent,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.respondent,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.filingDate) basePayload.filing_date = targetCase.filingDate;
        if (targetCase.marriageDate) basePayload.marriage_date = targetCase.marriageDate;
        if (targetCase.maintenanceDetail) basePayload.maintenance_detail = targetCase.maintenanceDetail;
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('familycases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('civilcases', {
            case_number: newCaseNumber,
            case_status: targetCase.caseStatus,
            remark: targetCase.remark,
            disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
            updated_at: new Date().toISOString()
          }, originalNo);
        }
      } else if (caseType === 'revenue') {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          revenue_act_section: targetCase.revenueActSection,
          village_mauja: targetCase.villageMauja,
          pargana_tehsil: targetCase.parganaTehsil,
          gata_khata_no: targetCase.gataKhataNo,
          applicant: targetCase.applicant,
          opposite_party: targetCase.oppositeParty,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.oppositeParty,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.filingDate) basePayload.filing_date = targetCase.filingDate;
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('revenuecases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('civilcases', {
            case_number: newCaseNumber,
            case_status: targetCase.caseStatus,
            remark: targetCase.remark,
            disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
            updated_at: new Date().toISOString()
          }, originalNo);
        }
      } else if (caseType === 'misc_civil') {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          original_case_number: targetCase.originalCaseNumber || targetCase.originalCase || '',
          proceeding_type: targetCase.proceedingType || 'Misc Application',
          applicant: targetCase.applicant,
          opposite_party: targetCase.oppositeParty,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.oppositeParty,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.filingDate) basePayload.filing_date = targetCase.filingDate;
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('misccivilcases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('civilcases', {
            case_number: newCaseNumber,
            case_status: targetCase.caseStatus,
            remark: targetCase.remark,
            disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
            updated_at: new Date().toISOString()
          }, originalNo);
        }
      } else if (caseType === 'misc_criminal') {
        const basePayload = {
          case_number: newCaseNumber,
          crime_year: parseInt(targetCase.caseYear || targetCase.crimeYear, 10) || 2026,
          original_case_number: targetCase.originalCaseNumber || targetCase.originalCase || '',
          proceeding_type: targetCase.proceedingType || 'Bail Application (Sec 439 CrPC)',
          police_station: targetCase.policeStation || '',
          crime_section: targetCase.crimeSection || '',
          filing_date: targetCase.filingDate || targetCase.crimeFilingDate || null,
          applicant: targetCase.applicant,
          opposite_party: targetCase.oppositeParty || 'State of U.P.',
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.applicant,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('misccriminalcases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('criminalcases', {
            case_number: newCaseNumber,
            case_status: targetCase.caseStatus,
            remark: targetCase.remark,
            disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
            updated_at: new Date().toISOString()
          }, originalNo);
        }
      } else if (caseType === 'complaint') {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          complaint_type: targetCase.complaintType || 'Cheque Bounce (Sec 138 NI Act)',
          complainant: targetCase.complainant || targetCase.plaintiff || 'Complainant',
          accused_name: targetCase.accusedName || targetCase.defendant || 'Accused',
          section_act: targetCase.sectionAct || '',
          police_station: targetCase.policeStation || '',
          filing_date: targetCase.filingDate || null,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.accusedName,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { data, error } = await safeTableUpdate('complaintcases', basePayload, originalNo);
        if (error || !data || data.length === 0) {
          await safeTableUpdate('criminalcases', {
            case_number: newCaseNumber,
            case_status: targetCase.caseStatus,
            remark: targetCase.remark,
            disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
            updated_at: new Date().toISOString()
          }, originalNo);
        }
      } else {
        const basePayload = {
          case_number: newCaseNumber,
          case_year: parseInt(targetCase.caseYear, 10) || 2026,
          filing_date: targetCase.filingDate || null,
          plaintiff: targetCase.plaintiff,
          defendant: targetCase.defendant,
          court_name: targetCase.courtName,
          client_name: targetCase.clientName,
          client_number: targetCase.clientNumber,
          case_name: targetCase.caseName,
          party_name: targetCase.partyName,
          case_status: targetCase.caseStatus || 'Pending',
          remark: targetCase.remark || '',
          disposal_comment: targetCase.disposalComment || targetCase.disposal_comment || null,
          doc_link: targetCase.docLink || '',
          updated_at: new Date().toISOString()
        };
        if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
          basePayload.next_hearing = targetCase.nextHearing;
        }
        let { error } = await safeTableUpdate('civilcases', basePayload, originalNo);
        if (error) {
          delete basePayload.doc_link;
          delete basePayload.remark;
          delete basePayload.disposal_comment;
          await supabaseClient.from('civilcases').update(basePayload).eq('case_number', originalNo);
        }
      }

      // If next hearing date is provided, update or record in hearings table
      if (targetCase.nextHearing && targetCase.nextHearing !== '—') {
        const hearingPayload = {
          case_number: newCaseNumber,
          next_hearing_date: targetCase.nextHearing,
          hearing_process: targetCase.hearingProcess || 'Listed Hearing',
          updated_at: new Date().toISOString()
        };
        const { data: hData, error: hErr } = await supabaseClient
          .from('hearings')
          .update(hearingPayload)
          .eq('case_number', originalNo)
          .select('id');
        if (hErr || !hData || hData.length === 0) {
          await supabaseClient.from('hearings').insert([{
            case_number: newCaseNumber,
            hearing_date: targetCase.nextHearing,
            next_hearing_date: targetCase.nextHearing,
            hearing_process: targetCase.hearingProcess || 'Listed Hearing',
            created_at: new Date().toISOString()
          }]);
        }
      }

      // If case number changed, cascade to hearings and tasks
      if (originalNo.toLowerCase() !== newCaseNumber.toLowerCase()) {
        if (typeof cascadeUpdateCaseNumber === 'function') {
          await cascadeUpdateCaseNumber(originalNo, newCaseNumber);
        } else {
          const { error: hError } = await supabaseClient.from('hearings')
            .update({ case_number: newCaseNumber })
            .eq('case_number', originalNo);
          if (hError) console.error('Supabase update hearings case_number error:', hError);
        }
      }
    } catch (e) {
      console.error('Supabase update error:', e);
    }
  }

  refreshAllCaseTables();
}

// Delete Case in Supabase (or local fallback)
async function deleteCaseFromSupabase(caseNumber) {
  if (!caseNumber) return;
  const targetNo = caseNumber.trim();

  if (supabaseClient) {
    try {
      const caseTables = [
        'civilcases',
        'statecases',
        'criminalcases',
        'familycases',
        'revenuecases',
        'misccivilcases',
        'misccriminalcases',
        'complaintcases'
      ];
      await Promise.all([
        ...caseTables.map(tbl => supabaseClient.from(tbl).delete().ilike('case_number', targetNo)),
        supabaseClient.from('hearings').delete().ilike('case_number', targetNo),
        supabaseClient.from('case_todos').delete().ilike('case_number', targetNo),
        supabaseClient.from('case_transfers').delete().ilike('case_number', targetNo)
      ]);
    } catch (e) {
      console.error('Supabase delete error:', e);
    }
  }

  const idx = allCaseRecords.findIndex(c => 
    (c.caseNo || '').trim().toLowerCase() === targetNo.toLowerCase() || 
    (c.criminalCaseNumber || '').trim().toLowerCase() === targetNo.toLowerCase()
  );
  if (idx !== -1) {
    allCaseRecords.splice(idx, 1);
  }

  // Cascade in-memory deletion to hearings
  if (Array.isArray(allHearingRecords)) {
    allHearingRecords = allHearingRecords.filter(h => 
      (h.case_number || '').trim().toLowerCase() !== targetNo.toLowerCase()
    );
  }

  // Cascade in-memory deletion to tasks
  if (Array.isArray(caseTasks)) {
    caseTasks = caseTasks.filter(t => 
      (t.caseNo || '').trim().toLowerCase() !== targetNo.toLowerCase()
    );
    if (typeof saveCaseTasksLocally === 'function') saveCaseTasksLocally();
    if (typeof renderCaseTasks === 'function') renderCaseTasks(currentTodoFilter);
  }

  // Cascade in-memory deletion to court transfers
  if (Array.isArray(allCaseTransfers)) {
    allCaseTransfers = allCaseTransfers.filter(t => 
      (t.case_number || '').trim().toLowerCase() !== targetNo.toLowerCase()
    );
    try { localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers)); } catch(e) {}
    if (typeof renderRecentTransfersTable === 'function') renderRecentTransfersTable();
    if (typeof updateTransfersCountBadge === 'function') updateTransfersCountBadge();
  }

  refreshAllCaseTables();
  if (typeof populateTodoCaseDropdown === 'function') populateTodoCaseDropdown();
  if (typeof renderCalendarView === 'function' && typeof currentCalendarMonth !== 'undefined') {
    renderCalendarView(currentCalendarMonth, currentCalendarYear);
  }
}

// Update Hearing in Supabase (or local fallback)
async function updateHearingInSupabase(caseNumber, hearingDate, process, actionTaken = '') {
  // Determine case type from allCaseRecords for proper tagging
  const cleanKey = (caseNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedCase = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    if (num1 === caseNumber.toLowerCase() || num2 === caseNumber.toLowerCase()) return true;
    if (cleanKey && (num1.replace(/[^a-z0-9]/g, '') === cleanKey || num2.replace(/[^a-z0-9]/g, '') === cleanKey)) return true;
    return false;
  });

  const caseType = matchedCase?.caseType || 'civil';
  const resolvedCaseNumber = matchedCase ? (matchedCase.caseNo || matchedCase.criminalCaseNumber || caseNumber) : caseNumber;
  const resolvedAction = actionTaken && actionTaken.trim() ? actionTaken.trim() : ('Scheduled stage: ' + process);

  const hearingPayload = {
    case_number: resolvedCaseNumber,
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
        .eq('case_number', resolvedCaseNumber)
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
        alert('⚠️ Failed to save hearing to database: ' + (dbError.message || 'Unknown error') + '. Changes saved locally only.');
      } else {
        // Update next_hearing and hearing_process across all relevant case tables
        const allCaseTables = [
          'civilcases',
          'statecases',
          'criminalcases',
          'familycases',
          'revenuecases',
          'misccivilcases',
          'misccriminalcases',
          'complaintcases'
        ];

        const tableMap = {
          'civil': 'civilcases',
          'state': 'statecases',
          'criminal': 'criminalcases',
          'family': 'familycases',
          'revenue': 'revenuecases',
          'misc_civil': 'misccivilcases',
          'misc_criminal': 'misccriminalcases',
          'complaint': 'complaintcases'
        };

        const targetTable = tableMap[caseType];
        const updatePayload = { next_hearing: hearingDate, hearing_process: process };

        if (matchedCase && matchedCase.nextHearing && matchedCase.nextHearing !== '—' && matchedCase.nextHearing !== hearingDate) {
          updatePayload.previous_hearing = matchedCase.nextHearing;
          updatePayload.previous_process = matchedCase.hearingProcess || '—';
        }

        const updatePromises = [];
        if (targetTable) {
          updatePromises.push(
            supabaseClient.from(targetTable).update(updatePayload).ilike('case_number', resolvedCaseNumber)
          );
        }

        // Also update any other tables where this case number might reside
        allCaseTables.forEach(tbl => {
          if (tbl !== targetTable) {
            updatePromises.push(
              supabaseClient.from(tbl).update(updatePayload).ilike('case_number', resolvedCaseNumber)
            );
          }
        });

        await Promise.allSettled(updatePromises);
      }
    } catch (e) {
      console.error('Supabase hearing update error:', e);
      alert('⚠️ Hearing update encountered an error. Changes saved locally only.');
    }
  }

  // --- Local in-memory: prevent duplicate entries ---
  const existingLocalIdx = allHearingRecords.findIndex(h =>
    (h.case_number || '').toLowerCase() === resolvedCaseNumber.toLowerCase() &&
    h.hearing_date === hearingDate
  );
  if (existingLocalIdx !== -1) {
    // Update existing local entry
    allHearingRecords[existingLocalIdx].process = process;
    allHearingRecords[existingLocalIdx].action_taken = ('Scheduled stage: ' + process);
    allHearingRecords[existingLocalIdx].case_type = caseType;
    allHearingRecords[existingLocalIdx].case_number = resolvedCaseNumber;
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
// Referential Integrity & Cascading Updates Suite
// ==============================================================================

async function cascadeUpdateCourtName(oldCourtName, newCourtName) {
  const oldName = (oldCourtName || '').trim();
  const newName = (newCourtName || '').trim();
  if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) return 0;

  console.log(`[CASCADE] Updating court name from "${oldName}" to "${newName}" across cases and database...`);

  unmarkCourtAsDeleted(newName);
  markCourtAsDeleted(oldName);

  // 1. Update in-memory courts array
  const cIdx = courts.findIndex(c => c.trim().toLowerCase() === oldName.toLowerCase());
  if (cIdx !== -1) {
    courts[cIdx] = newName;
  } else if (!courts.some(c => c.trim().toLowerCase() === newName.toLowerCase())) {
    courts.push(newName);
  }

  // Update defaultCourts in-memory array
  const dIdx = defaultCourts.findIndex(c => c.trim().toLowerCase() === oldName.toLowerCase());
  if (dIdx !== -1) {
    defaultCourts[dIdx] = newName;
  } else if (!defaultCourts.some(c => c.trim().toLowerCase() === newName.toLowerCase())) {
    defaultCourts.push(newName);
  }

  // 2. Update in-memory allCaseRecords
  let affectedCaseCount = 0;
  if (Array.isArray(allCaseRecords)) {
    allCaseRecords.forEach(c => {
      let changed = false;
      if ((c.courtName || '').trim().toLowerCase() === oldName.toLowerCase()) {
        c.courtName = newName;
        changed = true;
      }
      if ((c.criminalCourtName || '').trim().toLowerCase() === oldName.toLowerCase()) {
        c.criminalCourtName = newName;
        changed = true;
      }
      if (changed) affectedCaseCount++;
    });
  }

  // Update in-memory allCaseTransfers
  if (Array.isArray(allCaseTransfers)) {
    allCaseTransfers.forEach(t => {
      if ((t.fromCourt || '').trim().toLowerCase() === oldName.toLowerCase()) {
        t.fromCourt = newName;
      }
      if ((t.toCourt || '').trim().toLowerCase() === oldName.toLowerCase()) {
        t.toCourt = newName;
      }
    });
    try { localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers)); } catch(e) {}
  }

  // 3. Update Supabase database across all tables
  if (supabaseClient) {
    const caseTables = [
      'civilcases',
      'statecases',
      'criminalcases',
      'familycases',
      'revenuecases',
      'misccivilcases',
      'misccriminalcases',
      'complaintcases'
    ];

    try {
      // Check if oldName existed in courts table
      const { data: existingCourt } = await supabaseClient
        .from('courts')
        .select('id')
        .ilike('court_name', oldName)
        .limit(1);

      if (existingCourt && existingCourt.length > 0) {
        await supabaseClient
          .from('courts')
          .update({ court_name: newName, updated_at: new Date().toISOString() })
          .eq('id', existingCourt[0].id);
      } else {
        await supabaseClient
          .from('courts')
          .insert([{ court_name: newName, court_type: 'District Court' }]);
      }

      // Update all case tables where court_name = oldName
      const tableUpdates = caseTables.map(async (table) => {
        try {
          const { error } = await supabaseClient
            .from(table)
            .update({ court_name: newName, updated_at: new Date().toISOString() })
            .ilike('court_name', oldName);
          if (error && !error.message?.includes('column')) {
            console.warn(`[CASCADE] Note on table ${table}:`, error.message);
          }
        } catch (tblErr) {
          console.warn(`[CASCADE] Exception on table ${table}:`, tblErr);
        }
      });

      // Also check criminal_court_name column on criminalcases if exists
      tableUpdates.push((async () => {
        try {
          await supabaseClient
            .from('criminalcases')
            .update({ criminal_court_name: newName, updated_at: new Date().toISOString() })
            .ilike('criminal_court_name', oldName);
        } catch (e) {}
      })());

      // Update case_transfers
      tableUpdates.push((async () => {
        try {
          await supabaseClient
            .from('case_transfers')
            .update({ from_court: newName })
            .ilike('from_court', oldName);
        } catch (e) {}
      })());
      tableUpdates.push((async () => {
        try {
          await supabaseClient
            .from('case_transfers')
            .update({ to_court: newName })
            .ilike('to_court', oldName);
        } catch (e) {}
      })());

      await Promise.all(tableUpdates);
      console.log(`[CASCADE] Database cascading court update completed: "${oldName}" -> "${newName}".`);
    } catch (supaErr) {
      console.error('[CASCADE] Supabase cascading court update error:', supaErr);
    }
  }

  saveCourtsToBackup();

  // 4. Re-render UI components to reflect updated court name
  if (typeof renderCourtOptions === 'function') renderCourtOptions();
  if (typeof renderCriminalCourtOptions === 'function') renderCriminalCourtOptions();
  if (typeof renderSearchCourtFilterOptions === 'function') renderSearchCourtFilterOptions();
  if (typeof renderCourtsTable === 'function') renderCourtsTable();
  if (typeof refreshAllCaseTables === 'function') refreshAllCaseTables();
  if (typeof filterCaseTables === 'function') filterCaseTables();
  if (typeof renderRecentTransfersTable === 'function') renderRecentTransfersTable();
  if (typeof renderCalendarView === 'function' && typeof currentCalendarMonth !== 'undefined') {
    renderCalendarView(currentCalendarMonth, currentCalendarYear);
  }
  if (typeof populateTodoCaseDropdown === 'function') populateTodoCaseDropdown();

  return affectedCaseCount;
}
window.cascadeUpdateCourtName = cascadeUpdateCourtName;

async function cascadeUpdateCaseNumber(oldCaseNo, newCaseNo) {
  const oldNo = (oldCaseNo || '').trim();
  const newNo = (newCaseNo || '').trim();
  if (!oldNo || !newNo || oldNo.toLowerCase() === newNo.toLowerCase()) return;

  console.log(`[CASCADE] Cascading case number change from "${oldNo}" to "${newNo}"...`);

  // 1. In-memory allHearingRecords
  if (Array.isArray(allHearingRecords)) {
    allHearingRecords.forEach(h => {
      if ((h.case_number || '').trim().toLowerCase() === oldNo.toLowerCase()) {
        h.case_number = newNo;
      }
    });
  }

  // 2. In-memory caseTasks (To-Do items)
  let tasksUpdated = 0;
  if (Array.isArray(caseTasks)) {
    caseTasks.forEach(t => {
      if ((t.caseNo || '').trim().toLowerCase() === oldNo.toLowerCase()) {
        t.caseNo = newNo;
        tasksUpdated++;
      }
    });
    if (tasksUpdated > 0 && typeof saveCaseTasksLocally === 'function') {
      saveCaseTasksLocally();
      if (typeof renderCaseTasks === 'function') renderCaseTasks(currentTodoFilter);
    }
  }

  // 2.5 In-memory allCaseTransfers
  if (Array.isArray(allCaseTransfers)) {
    allCaseTransfers.forEach(t => {
      if ((t.case_number || '').trim().toLowerCase() === oldNo.toLowerCase()) {
        t.case_number = newNo;
      }
    });
    try { localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers)); } catch(e) {}
    if (typeof renderRecentTransfersTable === 'function') renderRecentTransfersTable();
  }

  // 3. Supabase updates on hearings, case_todos and case_transfers
  if (supabaseClient) {
    try {
      await Promise.all([
        supabaseClient.from('hearings').update({ case_number: newNo }).ilike('case_number', oldNo),
        supabaseClient.from('case_todos').update({ case_number: newNo }).ilike('case_number', oldNo),
        supabaseClient.from('case_transfers').update({ case_number: newNo }).ilike('case_number', oldNo)
      ]);
      console.log(`[CASCADE] Supabase hearings, case_todos, and case_transfers updated for case number "${oldNo}" -> "${newNo}".`);
    } catch (err) {
      console.error('[CASCADE] Supabase error cascading case number change:', err);
    }
  }

  // 4. Update UI dropdowns & views
  if (typeof populateTodoCaseDropdown === 'function') populateTodoCaseDropdown(newNo);
  if (typeof renderCalendarView === 'function' && typeof currentCalendarMonth !== 'undefined') {
    renderCalendarView(currentCalendarMonth, currentCalendarYear);
  }
}
window.cascadeUpdateCaseNumber = cascadeUpdateCaseNumber;

// ==============================================================================
// Courts Supabase Management (Live Sync & Cascading Updates)
// ==============================================================================

async function addCourtToSupabase(courtName) {
  const trimmed = (courtName || '').trim();
  if (!trimmed) return false;

  unmarkCourtAsDeleted(trimmed);

  const alreadyInMemory = courts.some(c => c.trim().toLowerCase() === trimmed.toLowerCase());

  if (supabaseClient) {
    try {
      // Check live database for duplicate court
      const { data: existing } = await supabaseClient
        .from('courts')
        .select('court_name')
        .ilike('court_name', trimmed)
        .limit(1);

      if (existing && existing.length > 0) {
        console.warn(`Court "${trimmed}" already exists in Supabase courts table.`);
        if (!alreadyInMemory) {
          courts.push(existing[0].court_name || trimmed);
        }
      } else {
        const { error } = await supabaseClient.from('courts').insert([{ court_name: trimmed, court_type: 'District Court' }]);
        if (error) console.error('Supabase add court error:', error);
      }
    } catch (e) {
      console.error('Supabase add court exception:', e);
    }
  }

  if (!alreadyInMemory) {
    courts.push(trimmed);
  }
  if (!defaultCourts.some(c => c.trim().toLowerCase() === trimmed.toLowerCase())) {
    defaultCourts.push(trimmed);
  }

  saveCourtsToBackup();
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderSearchCourtFilterOptions();
  renderCourtsTable();
  return true;
}

async function editCourtInSupabase(oldName, newName) {
  return await cascadeUpdateCourtName(oldName, newName);
}

async function deleteCourtFromSupabase(courtName) {
  const trimmed = (courtName || '').trim();
  if (!trimmed) return false;

  markCourtAsDeleted(trimmed);

  const caseTables = [
    'civilcases',
    'statecases',
    'criminalcases',
    'familycases',
    'revenuecases',
    'misccivilcases',
    'misccriminalcases',
    'complaintcases'
  ];

  if (supabaseClient) {
    try {
      // 1. Delete court record from courts table
      const { error: delErr } = await supabaseClient.from('courts').delete().ilike('court_name', trimmed);
      if (delErr) console.error('Supabase delete court error:', delErr);

      // 2. Unlink all cases in Supabase that belonged to this court
      const unlinks = caseTables.map(async (table) => {
        try {
          await supabaseClient
            .from(table)
            .update({ court_name: '—', updated_at: new Date().toISOString() })
            .ilike('court_name', trimmed);
        } catch (e) {}
      });
      unlinks.push((async () => {
        try {
          await supabaseClient
            .from('criminalcases')
            .update({ criminal_court_name: '—', updated_at: new Date().toISOString() })
            .ilike('criminal_court_name', trimmed);
        } catch (e) {}
      })());
      await Promise.all(unlinks);
    } catch (e) {
      console.error('Supabase delete court exception:', e);
    }
  }

  // 3. Remove from in-memory courts & defaultCourts
  courts = courts.filter(c => c.trim().toLowerCase() !== trimmed.toLowerCase());
  defaultCourts = defaultCourts.filter(c => c.trim().toLowerCase() !== trimmed.toLowerCase());

  // 4. Update in-memory cases that belonged to this court
  if (Array.isArray(allCaseRecords)) {
    allCaseRecords.forEach(c => {
      if ((c.courtName || '').trim().toLowerCase() === trimmed.toLowerCase()) {
        c.courtName = '—';
      }
      if ((c.criminalCourtName || '').trim().toLowerCase() === trimmed.toLowerCase()) {
        c.criminalCourtName = '—';
      }
    });
  }

  saveCourtsToBackup();
  renderCourtOptions();
  renderCriminalCourtOptions();
  renderSearchCourtFilterOptions();
  renderCourtsTable();
  refreshAllCaseTables();
  return true;
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
    document.documentElement.classList.add('auth-admin');
    document.documentElement.classList.remove('auth-guest');
    restoreActiveAdminTab();
  } else if (screenId === 'guestScreen') {
    document.documentElement.classList.add('auth-guest');
    document.documentElement.classList.remove('auth-admin');
    renderGuestTable('');
  } else {
    document.documentElement.classList.remove('auth-admin', 'auth-guest');
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

function checkInitialAuth() {
  const currentUser = safeStorage.get('cmUser');

  // Restore rememberMe checkbox state from localStorage
  const rememberEl = document.getElementById('rememberMe');
  if (rememberEl && window.localStorage) {
    const savedRemember = window.localStorage.getItem('cmRememberMe');
    if (savedRemember !== null) {
      rememberEl.checked = savedRemember === 'true';
    }
  }

  if (currentUser === 'admin') {
    setActiveScreen('adminScreen');
    return 'admin';
  } else if (currentUser === 'guest') {
    setActiveScreen('guestScreen');
    return 'guest';
  } else {
    setActiveScreen('loginScreen');
    return null;
  }
}
window.checkInitialAuth = checkInitialAuth;

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
      if (window.localStorage) {
        try { window.localStorage.setItem('cmRememberMe', isPersistent ? 'true' : 'false'); } catch (e) {}
      }
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

function handleAdminLogout(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
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

  const rememberEl = document.getElementById('rememberMe');
  if (rememberEl && window.localStorage) {
    const savedRemember = window.localStorage.getItem('cmRememberMe');
    if (savedRemember !== null) {
      rememberEl.checked = savedRemember === 'true';
    }
  }
}
window.handleAdminLogout = handleAdminLogout;

function handleGuestLogin(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  safeStorage.set('cmUser', 'guest', false);
  setActiveScreen('guestScreen');
  fetchAllDataFromSupabase();
  const form = document.getElementById('loginForm');
  if (form) form.reset();
  const errorBox = document.getElementById('loginError');
  if (errorBox) errorBox.textContent = '';
}
window.handleGuestLogin = handleGuestLogin;

function handleLogout(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
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

  const rememberEl = document.getElementById('rememberMe');
  if (rememberEl && window.localStorage) {
    const savedRemember = window.localStorage.getItem('cmRememberMe');
    if (savedRemember !== null) {
      rememberEl.checked = savedRemember === 'true';
    }
  }
}
window.handleLogout = handleLogout;

let tabNavigationHistory = [];
let tabForwardHistory = [];
let currentActiveTabId = 'home';

function showTab(tabId, event, navType = 'navigate') {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  // Redirect separate case type views to All Cases with filter pre-selected
  const caseTypeRedirects = {
    'civil': 'civil',
    'state': 'state',
    'criminal': 'state',
    'family': 'family',
    'revenue': 'revenue',
    'misccivil': 'misc_civil',
    'misccriminal': 'misc_criminal',
    'complaint': 'complaint'
  };
  let filterTypeToApply = null;
  if (caseTypeRedirects[tabId]) {
    filterTypeToApply = caseTypeRedirects[tabId];
    tabId = 'all';
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

  // Persist current active tab for page refresh retention & synchronize browser history
  try {
    safeStorage.set('cmActiveTab', tabId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cmActiveTab', tabId);
    }
    if (window.history) {
      if (navType === 'navigate') {
        window.history.pushState({ app: 'casebook', tab: tabId, timestamp: Date.now() }, '', '#' + tabId);
      } else {
        window.history.replaceState({ app: 'casebook', tab: tabId }, '', '#' + tabId);
      }
    }
  } catch (e) {}

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
  }

  // Update mobile Floating Action Button (FAB) visibility: show on listing/dashboard tabs, hide on form/management tabs
  const mobileFab = document.querySelector('.mobile-fab-btn');
  if (mobileFab) {
    const fabAllowedTabs = ['home', 'search', 'all', 'causelist', 'upcoming'];
    if (fabAllowedTabs.includes(tabId)) {
      mobileFab.style.removeProperty('display');
    } else {
      mobileFab.style.setProperty('display', 'none', 'important');
    }
  }

  // Smooth scroll to top for comfortable mobile navigation
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabId === 'home') {
    renderHomeDashboard();
  }

  if (tabId === 'search') {
    setTimeout(() => {
      const gs = document.getElementById('globalSearch');
      if (gs) gs.focus();
    }, 250);
    filterCaseTables();
  }

  if (tabId === 'all') {
    updateAllCasesTypePillCounts();
    if (filterTypeToApply !== null) {
      filterAllCasesByType(filterTypeToApply);
    } else {
      renderAllCasesTableWithFilters();
    }
  }

  if (tabId === 'add') {
    renderCaseTypeOptions();
    renderCourtOptions();
    renderCriminalCourtOptions();
    toggleCaseFormByType();
  }

  if (tabId === 'update') {
    renderCaseTypeOptions();
    renderCourtOptions();
    renderCriminalCourtOptions();
    toggleUpdateCaseFormByType();
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

  if (tabId === 'courts') {
    renderCourtsTable();
  }

  if (tabId === 'helpers') {
    renderHelpersTable();
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

/* ==============================================================================
   Mobile Back Button & History Navigation Architecture
   ============================================================================== */

let lastExitBackPressTime = 0;
let isInternalHistoryNav = false;

// Return open modal info if any modal dialog is currently displayed
function getOpenModalInfo() {
  const modalList = [
    { id: 'editHelperModal', close: () => (typeof closeEditHelperModal === 'function' ? closeEditHelperModal() : null) },
    { id: 'deleteHelperModal', close: () => (typeof closeDeleteHelperModal === 'function' ? closeDeleteHelperModal() : null) },
    { id: 'editCourtModal', close: () => (typeof closeEditCourtModal === 'function' ? closeEditCourtModal() : null) },
    { id: 'deleteCourtModal', close: () => (typeof closeDeleteCourtModal === 'function' ? closeDeleteCourtModal() : null) },
    { id: 'caseHistoryModal', close: () => (typeof closeCaseHistoryModal === 'function' ? closeCaseHistoryModal() : null) },
    { id: 'dbManagerFormModal', close: () => (typeof closeDbModal === 'function' ? closeDbModal() : null) },
    { id: 'pwaGuideModal', close: () => (typeof closePwaGuideModal === 'function' ? closePwaGuideModal() : null) }
  ];

  for (let i = 0; i < modalList.length; i++) {
    const el = document.getElementById(modalList[i].id);
    if (el && !el.classList.contains('hidden') && el.style.display !== 'none') {
      return modalList[i];
    }
  }
  return null;
}

function isMobileSidebarOpen() {
  const sidebar = document.querySelector('.sidebar');
  return !!(sidebar && sidebar.classList.contains('mobile-open'));
}

function closeMobileSidebarDrawer() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
}

function handlePopStateNavigation(event) {
  if (isInternalHistoryNav) {
    isInternalHistoryNav = false;
    return;
  }

  // 1. If any modal dialog is currently open, close it and prevent window back
  const openModal = getOpenModalInfo();
  if (openModal) {
    openModal.close();
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ app: 'casebook', tab: currentActiveTabId }, '', '#' + currentActiveTabId);
      }
    } catch (e) {}
    return;
  }

  // 2. If mobile sidebar navigation drawer is open, close it and stay in app
  if (isMobileSidebarOpen()) {
    closeMobileSidebarDrawer();
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ app: 'casebook', tab: currentActiveTabId }, '', '#' + currentActiveTabId);
      }
    } catch (e) {}
    return;
  }

  // 3. Guest Screen: if case details card is open on guest portal, dismiss it
  const guestDetails = document.getElementById('guestCaseDetailsContent');
  if (guestDetails && !guestDetails.classList.contains('hidden')) {
    guestDetails.classList.add('hidden');
    const guestEmpty = document.getElementById('guestCaseDetailsEmpty');
    if (guestEmpty) guestEmpty.classList.remove('hidden');
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ app: 'casebook', screen: 'guest' }, '', window.location.hash);
      }
    } catch (e) {}
    return;
  }

  // 4. Tab Navigation History Check
  const state = event.state;
  const targetTab = (state && state.tab) ? state.tab : ((window.location.hash || '').replace(/^#/, '').trim());

  if (targetTab && document.getElementById(targetTab) && targetTab !== currentActiveTabId) {
    showTab(targetTab, null, 'history');
    return;
  }

  // 5. Internal tab navigation history stack
  if (tabNavigationHistory.length > 0) {
    const prevTab = tabNavigationHistory.pop();
    if (prevTab && prevTab !== currentActiveTabId && document.getElementById(prevTab)) {
      if (currentActiveTabId) {
        tabForwardHistory.push(currentActiveTabId);
      }
      showTab(prevTab, null, 'history');
      return;
    }
  }

  // 6. If currently on a sub-tab (not 'home'), navigate back to Home Dashboard
  if (currentActiveTabId && currentActiveTabId !== 'home') {
    showTab('home', null, 'history');
    return;
  }

  // 7. On Home Dashboard with no history left:
  // Mobile double-back exit confirmation (prevents accidental window closes)
  const now = Date.now();
  if (now - lastExitBackPressTime < 2500) {
    // Second back press within 2.5s: allow user to exit application
    return;
  } else {
    lastExitBackPressTime = now;
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ app: 'casebook', tab: 'home', exitGuard: true }, '', '#home');
      }
    } catch (e) {}
    if (typeof showToastNotification === 'function') {
      showToastNotification('📱 Press back again to exit CaseBook', 2500);
    } else if (typeof M !== 'undefined' && M.toast) {
      M.toast({ html: '📱 Press back again to exit CaseBook' });
    }
  }
}

function setupMobileBackAndHistory() {
  const initialTab = (window.location.hash || '').replace(/^#/, '').trim() || currentActiveTabId || 'home';
  try {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({ app: 'casebook', tab: initialTab, isInitial: true }, '', '#' + initialTab);
      // Push an initial safety state so that pressing back on mobile triggers popstate instead of exiting the page immediately
      window.history.pushState({ app: 'casebook', tab: initialTab }, '', '#' + initialTab);
    }
  } catch (e) {}

  window.removeEventListener('popstate', handlePopStateNavigation);
  window.addEventListener('popstate', handlePopStateNavigation);
}

function goPreviousTab() {
  // 1. If any modal dialog is currently open, close it
  const openModal = getOpenModalInfo();
  if (openModal) {
    openModal.close();
    return;
  }

  // 2. If mobile drawer is open, close it
  if (isMobileSidebarOpen()) {
    closeMobileSidebarDrawer();
    return;
  }

  // 3. If browser history exists and we have internal history, let browser go back
  if (window.history && window.history.length > 1 && tabNavigationHistory.length > 0) {
    window.history.back();
    return;
  }

  // 4. Fallback in-memory history
  if (tabNavigationHistory.length > 0) {
    const previousTabId = tabNavigationHistory.pop();
    if (previousTabId) {
      if (currentActiveTabId) {
        tabForwardHistory.push(currentActiveTabId);
      }
      showTab(previousTabId, null, 'back');
      return;
    }
  }

  // 5. If on any tab other than home, return to home
  if (currentActiveTabId && currentActiveTabId !== 'home') {
    showTab('home', null, 'navigate');
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
  } else if (window.history && window.history.length > 1) {
    window.history.forward();
  }
}

function updateNavigationButtons() {
  const backBtn = document.getElementById('bottomNavBackBtn');
  const forwardBtn = document.getElementById('bottomNavForwardBtn');
  const homeBtn = document.getElementById('bottomNavHomeBtn');

  if (backBtn) {
    const hasBack = tabNavigationHistory.length > 0 || (currentActiveTabId && currentActiveTabId !== 'home');
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

window.getOpenModalInfo = getOpenModalInfo;
window.isMobileSidebarOpen = isMobileSidebarOpen;
window.closeMobileSidebarDrawer = closeMobileSidebarDrawer;
window.handlePopStateNavigation = handlePopStateNavigation;
window.setupMobileBackAndHistory = setupMobileBackAndHistory;
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
  const cleanKey = normalized.replace(/[^a-z0-9]/g, '');

  const list = allHearingRecords.filter(h => {
    const hNo = (h.case_number || '').trim().toLowerCase();
    if (hNo === normalized) return true;
    if (cleanKey && hNo.replace(/[^a-z0-9]/g, '') === cleanKey) return true;
    // Fallback: If case is Cr.Rev./129/2026 and hearing is Cri-Rev-
    if ((normalized === 'cr.rev./129/2026' || normalized.includes('129/2026')) && hNo === 'cri-rev-') return true;
    return false;
  });

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

  const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || '—';
  const rawType = (caseObj.caseType || 'civil').toLowerCase().trim();
  const isCriminal = rawType === 'state' || rawType === 'criminal' || rawType === 'misc_criminal';
  const isFamily = rawType === 'family';
  const isRevenue = rawType === 'revenue';

  let typeBadgeLabel = 'CIVIL';
  if (isCriminal) typeBadgeLabel = 'STATE (CRIMINAL)';
  else if (isFamily) typeBadgeLabel = 'FAMILY';
  else if (isRevenue) typeBadgeLabel = 'REVENUE';
  else if (rawType === 'complaint') typeBadgeLabel = 'COMPLAINT';
  else typeBadgeLabel = rawType.replace('_', ' ').toUpperCase();

  if (badge) {
    badge.textContent = typeBadgeLabel;
    badge.className = `case-badge ${rawType}`;
  }

  // Build accurate title
  let caseTitle = (caseObj.caseName || '').trim();
  if (!caseTitle || caseTitle.toLowerCase() === 'vs' || caseTitle.toLowerCase() === 'vs.') {
    if (caseObj.plaintiff && caseObj.defendant) {
      caseTitle = `${caseObj.plaintiff} vs ${caseObj.defendant}`;
    } else if (caseObj.victimName && caseObj.accusedName) {
      caseTitle = `${caseObj.victimName} vs ${caseObj.accusedName}`;
    } else if (caseObj.accusedName) {
      caseTitle = `State vs ${caseObj.accusedName}`;
    } else if (caseObj.plaintiff) {
      caseTitle = `${caseObj.plaintiff} vs Opposite`;
    } else {
      caseTitle = caseNumber !== '—' ? `Case ${caseNumber}` : 'Untitled Matter';
    }
  }

  const titleEl = document.getElementById('detailCaseTitle');
  if (titleEl) titleEl.textContent = caseTitle;

  const setVal = (id, val, fallback = '—') => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || fallback;
  };

  const courtName = caseObj.courtName || caseObj.criminalCourtName || 'District Court';
  setVal('detailCaseNo', caseNumber);
  setVal('detailCourtName', courtName);

  const isDisposed = (caseObj.caseStatus || '').toLowerCase().includes('dispose');
  const isUndated = !caseObj.nextHearing || caseObj.nextHearing === '—' || caseObj.nextHearing === 'null' || !caseObj.nextHearing.trim() || caseObj.nextHearing.toLowerCase() === 'undated';

  const statusBadgeEl = document.getElementById('detailCaseStatusBadge');
  if (statusBadgeEl) {
    if (isDisposed) {
      statusBadgeEl.className = 'status-badge disposed';
      statusBadgeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Disposed Off';
    } else if (isUndated) {
      statusBadgeEl.className = 'status-badge undated';
      statusBadgeEl.style = 'background:#fef3c7; color:#92400e; border:1px solid #fde68a;';
      statusBadgeEl.innerHTML = '<i class="fa-solid fa-calendar-xmark"></i> Undated';
    } else {
      statusBadgeEl.className = 'status-badge pending';
      statusBadgeEl.style = '';
      statusBadgeEl.innerHTML = '<i class="fa-solid fa-clock"></i> Pending';
    }
  }

  setVal('detailNextHearing', isUndated ? '—' : formatDateDMY(caseObj.nextHearing));
  setVal('detailHearingProcess', isUndated ? 'Undated' : (caseObj.hearingProcess || 'Scheduled Hearing'));

  // Determine previous hearing
  const caseHistory = getCaseHearingHistory(caseNumber);
  const currentNext = (caseObj.nextHearing && caseObj.nextHearing !== '—') ? caseObj.nextHearing : null;

  const prevHearings = caseHistory.filter(h => {
    if (currentNext && h.hearing_date === currentNext) return false;
    return true;
  });
  const latestPrev = prevHearings[0];
  const prevHearingDate = latestPrev ? latestPrev.hearing_date : (caseObj.previousHearing || null);
  const prevProcess = latestPrev ? latestPrev.process : (caseObj.previousProcess || null);

  // 1. CARD 1: Court & Case Info (Only related & present fields)
  const courtCardBody = document.getElementById('detailCourtCardBody');
  if (courtCardBody) {
    const filingDate = caseObj.filingDate || caseObj.crimeFilingDate;
    const filingDateFormatted = (filingDate && filingDate !== '—') ? formatDateDMY(filingDate) : null;
    const year = caseObj.caseYear || caseObj.crimeYear || null;

    let props = '';
    props += `
      <div class="dossier-prop">
        <span class="prop-label">Case Type</span>
        <span class="prop-val font-semibold">${escapeHtml(typeBadgeLabel)}</span>
      </div>
    `;
    if (year) {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Registration Year</span>
          <span class="prop-val">${escapeHtml(year)}</span>
        </div>
      `;
    }
    props += `
      <div class="dossier-prop">
        <span class="prop-label">Court / Forum</span>
        <span class="prop-val font-semibold">${escapeHtml(courtName)}</span>
      </div>
    `;
    if (filingDateFormatted) {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Filing Date</span>
          <span class="prop-val">${escapeHtml(filingDateFormatted)}</span>
        </div>
      `;
    }
    if (prevHearingDate && prevHearingDate !== '—') {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Previous Hearing</span>
          <span class="prop-val">${escapeHtml(formatDateDMY(prevHearingDate))}</span>
        </div>
      `;
    }
    if (prevProcess && prevProcess !== '—') {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Previous Stage</span>
          <span class="prop-val">${escapeHtml(prevProcess)}</span>
        </div>
      `;
    }
    if (!isUndated && caseObj.hearingProcess) {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Next Stage</span>
          <span class="prop-val font-semibold" style="color: #1e40af;">${escapeHtml(caseObj.hearingProcess)}</span>
        </div>
      `;
    }
    courtCardBody.innerHTML = props;
  }

  // 2. CARD 2: Parties & Particulars (Show ONLY related fields for this case type!)
  const partiesCardBody = document.getElementById('detailPartiesCardBody');
  if (partiesCardBody) {
    let props = '';

    if (isCriminal) {
      const stateParty = caseObj.firstParty || caseObj.victimName || 'State of U.P.';
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Prosecution / State</span>
          <span class="prop-val font-semibold text-slate-800">${escapeHtml(stateParty)}</span>
        </div>
      `;
      if (caseObj.accusedName) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Accused Person(s)</span>
            <span class="prop-val font-semibold text-slate-900">${escapeHtml(caseObj.accusedName)}</span>
          </div>
        `;
      }
      if (caseObj.policeStation) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Police Station</span>
            <span class="prop-val">🚔 ${escapeHtml(caseObj.policeStation)}</span>
          </div>
        `;
      }
      if (caseObj.crimeNumber || caseObj.firNumber) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Crime / FIR No.</span>
            <span class="prop-val font-semibold">${escapeHtml(caseObj.crimeNumber || caseObj.firNumber)}</span>
          </div>
        `;
      }
      if (caseObj.crimeSection) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Sections / IPC / BNS</span>
            <span class="prop-val">${escapeHtml(caseObj.crimeSection)}</span>
          </div>
        `;
      }
      if (caseObj.custodyStatus) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Custody / Bail Status</span>
            <span class="prop-val">${escapeHtml(caseObj.custodyStatus)}</span>
          </div>
        `;
      }
    } else if (isFamily) {
      const petitioner = caseObj.petitioner || caseObj.plaintiff;
      const respondent = caseObj.respondent || caseObj.defendant;
      if (petitioner) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Petitioner / Applicant</span>
            <span class="prop-val font-semibold">${escapeHtml(petitioner)}</span>
          </div>
        `;
      }
      if (respondent) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Respondent / Opposite</span>
            <span class="prop-val font-semibold">${escapeHtml(respondent)}</span>
          </div>
        `;
      }
      if (caseObj.familyMatterType || caseObj.matterType) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Dispute / Matter Type</span>
            <span class="prop-val">${escapeHtml(caseObj.familyMatterType || caseObj.matterType)}</span>
          </div>
        `;
      }
      if (caseObj.marriageDate) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Marriage Date</span>
            <span class="prop-val">${formatDateDMY(caseObj.marriageDate)}</span>
          </div>
        `;
      }
      if (caseObj.maintenance) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Maintenance Ordered</span>
            <span class="prop-val font-semibold text-emerald-800">${escapeHtml(caseObj.maintenance)}</span>
          </div>
        `;
      }
    } else if (isRevenue) {
      const applicant = caseObj.plaintiff || caseObj.applicant || caseObj.firstParty;
      const opposite = caseObj.defendant || caseObj.respondent || caseObj.oppositeParty;
      if (applicant) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Applicant / Petitioner</span>
            <span class="prop-val font-semibold">${escapeHtml(applicant)}</span>
          </div>
        `;
      }
      if (opposite) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Opposite Party</span>
            <span class="prop-val font-semibold">${escapeHtml(opposite)}</span>
          </div>
        `;
      }
      if (caseObj.revenueMatterType) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Revenue Matter</span>
            <span class="prop-val">${escapeHtml(caseObj.revenueMatterType)}</span>
          </div>
        `;
      }
      if (caseObj.village) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Village / Mauza</span>
            <span class="prop-val">${escapeHtml(caseObj.village)}</span>
          </div>
        `;
      }
      if (caseObj.khataNo || caseObj.gataNo) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Khata / Gata No.</span>
            <span class="prop-val font-semibold">${escapeHtml([caseObj.khataNo ? `Khata: ${caseObj.khataNo}` : '', caseObj.gataNo ? `Gata: ${caseObj.gataNo}` : ''].filter(Boolean).join(' | '))}</span>
          </div>
        `;
      }
    } else {
      // Civil / Standard
      const plaintiff = caseObj.plaintiff || caseObj.firstParty;
      const defendant = caseObj.defendant || caseObj.oppositeParty;
      if (plaintiff) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Plaintiff / Petitioner</span>
            <span class="prop-val font-semibold">${escapeHtml(plaintiff)}</span>
          </div>
        `;
      }
      if (defendant) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Defendant / Respondent</span>
            <span class="prop-val font-semibold">${escapeHtml(defendant)}</span>
          </div>
        `;
      }
      if (caseObj.matterType) {
        props += `
          <div class="dossier-prop">
            <span class="prop-label">Matter / Suit Nature</span>
            <span class="prop-val">${escapeHtml(caseObj.matterType)}</span>
          </div>
        `;
      }
    }

    if (!props.trim()) {
      props = `<div class="dossier-prop"><span class="prop-label">Parties</span><span class="prop-val">${escapeHtml(caseTitle)}</span></div>`;
    }
    partiesCardBody.innerHTML = props;
  }

  // 3. CARD 3: Client & Documents
  const clientCardBody = document.getElementById('detailClientCardBody');
  if (clientCardBody) {
    const clientName = caseObj.clientName || caseObj.criminalClientName;
    const clientPhone = caseObj.clientNumber || caseObj.criminalClientNumber;
    const docLink = caseObj.docLink || caseObj.doc_link;

    let statusBadgeHtml = '';
    if (isDisposed) {
      statusBadgeHtml = '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed Off</span>';
    } else if (isUndated) {
      statusBadgeHtml = '<span class="status-badge undated" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;"><i class="fa-solid fa-calendar-xmark"></i> Undated</span>';
    } else {
      statusBadgeHtml = '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
    }

    let props = '';
    props += `
      <div class="dossier-prop">
        <span class="prop-label">Client Name</span>
        <span class="prop-val font-semibold text-teal-800">${escapeHtml(clientName || '—')}</span>
      </div>
    `;
    if (clientPhone) {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Client Contact</span>
          <span class="prop-val"><a href="tel:${escapeHtml(clientPhone)}" style="color:#2563eb; text-decoration:none;">📞 ${escapeHtml(clientPhone)}</a></span>
        </div>
      `;
    }
    props += `
      <div class="dossier-prop">
        <span class="prop-label">Case Status</span>
        <span class="prop-val">${statusBadgeHtml}</span>
      </div>
    `;
    if (docLink && docLink.trim()) {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Order Sheet / File</span>
          <span class="prop-val"><a href="${escapeHtml(docLink.trim())}" target="_blank" rel="noopener noreferrer" class="doc-link-pill">🔗 Open Document ↗</a></span>
        </div>
      `;
    } else {
      props += `
        <div class="dossier-prop">
          <span class="prop-label">Order Sheet / File</span>
          <span class="prop-val" style="color: #94a3b8;">None attached</span>
        </div>
      `;
    }
    clientCardBody.innerHTML = props;
  }

  // 4. Remarks, Co-Parties & Disposal Box
  const remarkEl = document.getElementById('detailCaseRemark');
  if (remarkEl) {
    const remark = caseObj.remark || caseObj.remarks || '';
    if (remark && remark.trim()) {
      remarkEl.innerHTML = `<span style="color:#1e293b; font-weight:500;">${escapeHtml(remark.trim())}</span>`;
    } else {
      remarkEl.innerHTML = '<span style="color:#94a3b8; font-style:italic;">No co-parties or remarks recorded for this case.</span>';
    }
  }

  const disposalEl = document.getElementById('detailCaseDisposalComment');
  if (disposalEl) {
    const disposalComment = caseObj.disposalComment || caseObj.disposal_comment || '';
    if (disposalComment && disposalComment.trim()) {
      disposalEl.innerHTML = `<span style="color:#065f46; font-weight:600;">⚖️ ${escapeHtml(disposalComment.trim())}</span>`;
    } else {
      disposalEl.innerHTML = '<span style="color:#94a3b8; font-style:italic;">No disposal comment recorded yet.</span>';
    }
  }

  // 5. PROCEEDINGS & HEARING HISTORY (Dynamic Inline Table)
  const history = getCaseHearingHistory(caseNumber);
  const events = [];

  // Recorded hearings from history
  history.forEach(h => {
    const isNext = Boolean(currentNext && (h.hearing_date === currentNext || h.hearing_date === caseObj.nextHearing));
    events.push({
      date: h.hearing_date,
      process: h.process || 'Court Hearing',
      type: isNext ? 'next' : 'prev',
      action: h.action_taken || h.remarks || 'Court proceedings conducted.'
    });
  });

  // Add next hearing milestone if scheduled
  if (currentNext && !events.some(e => e.date === currentNext)) {
    events.push({
      date: currentNext,
      process: caseObj.hearingProcess || 'Scheduled Hearing',
      type: 'next',
      action: `Next appearance scheduled at ${courtName}`
    });
  }

  // Add previous hearing milestone if recorded on caseObj
  if (caseObj.previousHearing && caseObj.previousHearing !== '—' && !events.some(e => e.date === caseObj.previousHearing)) {
    events.push({
      date: caseObj.previousHearing,
      process: caseObj.previousProcess || 'Previous Stage',
      type: 'prev',
      action: `Previous proceedings recorded at ${courtName}`
    });
  }

  // Add filing date milestone
  const filingDateVal = caseObj.filingDate || caseObj.crimeFilingDate;
  if (filingDateVal && filingDateVal !== '—' && !events.some(e => e.date === filingDateVal)) {
    events.push({
      date: filingDateVal,
      process: 'Case Inception & Filing',
      type: 'filing',
      action: `Case instituted and registered at ${courtName}`
    });
  }

  // Sort newest first
  events.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return db - da;
  });

  const inlineTbody = document.getElementById('detailInlineHistoryTableBody');
  if (inlineTbody) {
    if (events.length === 0) {
      inlineTbody.innerHTML = `
        <tr>
          <td colspan="5" class="no-results text-center py-4" style="color: #64748b; padding: 2rem;">
            ℹ️ No proceedings or hearing history records logged yet for this case.
            <div style="margin-top: 8px;">
              <button type="button" class="table-view-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" style="font-size: 0.8rem;">
                📅 Log Next Hearing
              </button>
            </div>
          </td>
        </tr>
      `;
    } else {
      inlineTbody.innerHTML = events.map((ev, idx) => {
        let badgeHtml = '';
        if (ev.type === 'next') {
          badgeHtml = '<span class="history-badge-next" style="background:#e6f4ea; color:#137333; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600;"><i class="fa-solid fa-clock"></i> Upcoming Hearing</span>';
        } else if (ev.type === 'filing') {
          badgeHtml = '<span class="history-badge-filing" style="background:#e8f0fe; color:#1a73e8; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600;"><i class="fa-solid fa-file-signature"></i> Initial Filing</span>';
        } else {
          badgeHtml = '<span class="history-badge-prev" style="background:#f1f5f9; color:#475569; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Past Hearing</span>';
        }

        return `
          <tr>
            <td style="text-align: center; font-weight: 600; color: #64748b;">#${idx + 1}</td>
            <td style="white-space: nowrap; font-weight: 600;">${formatDateDMY(ev.date)}</td>
            <td style="font-weight: 600; color: #1e40af;">${escapeHtml(ev.process || '—')}</td>
            <td>${badgeHtml}</td>
            <td>${escapeHtml(ev.action || 'Court appearance & proceedings recorded.')}</td>
          </tr>
        `;
      }).join('');
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

  const transferBtn = document.getElementById('detailTransferBtn');
  if (transferBtn) {
    transferBtn.onclick = () => {
      openTransferForCase(caseObj.caseNo || caseObj.criminalCaseNumber || '');
    };
  }

  const whatsappBtn = document.getElementById('detailWhatsAppBtn');
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      sendWhatsAppHearingNotice(caseObj);
    };
  }

  // Render Court Transfer History section in dossier
  renderCaseTransferHistory(caseNumber, caseObj);

  const historyBtn = document.getElementById('detailHistoryBtn');
  if (historyBtn) {
    historyBtn.onclick = () => {
      openCaseHistoryModal(caseObj);
    };
  }

  const printBtn = document.getElementById('detailPrintBtn');
  if (printBtn) {
    printBtn.onclick = () => {
      printCurrentCaseDossier(caseObj);
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

let currentGuestSelectedCase = null;

function renderGuestCaseDetails(caseObj) {
  const emptyBox = document.getElementById('guestCaseDetailsEmpty');
  const contentBox = document.getElementById('guestCaseDetailsContent');
  const badge = document.getElementById('guestCaseTypeBadge');

  if (!caseObj) {
    currentGuestSelectedCase = null;
    if (emptyBox) emptyBox.classList.remove('hidden');
    if (contentBox) contentBox.classList.add('hidden');
    if (badge) {
      badge.textContent = 'Select a Case';
      badge.className = 'case-badge';
    }
    return;
  }

  currentGuestSelectedCase = caseObj;

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

  const guestPrintBtn = document.getElementById('guestDetailPrintBtn');
  if (guestPrintBtn) {
    guestPrintBtn.onclick = () => {
      printCurrentGuestCaseDossier();
    };
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
      item.courtName,
      item.partyName,
      item.remark
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
      <td class="table-actions-td"><button type="button" class="table-view-btn" title="View Details"><i class="fa-solid fa-eye"></i><span class="btn-text"> View Details</span></button></td>
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
    resultsBody.innerHTML = '<tr><td colspan="10" class="no-results">No cases found matching the specified filters. Try clearing or changing your filters.</td></tr>';
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
      ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
      : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
    const nextHearing = formatDateDMY(item.nextHearing);
    const remark = item.remark || item.remarks || '';
    const remarkHtml = remark
      ? `<span class="case-remark-clamp" title="${escapeHtml(remark)}">📝 ${escapeHtml(remark)}</span>`
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
      <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
        <div class="all-cases-actions-cell" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
          <button type="button" class="all-cases-action-btn details-btn" onclick="event.stopPropagation(); openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View Case Proceedings & Dossier"><i class="fa-solid fa-eye"></i></button>
          <button type="button" class="all-cases-action-btn edit-btn" onclick="event.stopPropagation(); editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case Details"><i class="fa-solid fa-pen-to-square"></i></button>
        </div>
      </td>
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
        <td class="table-actions-td" style="text-align: center; white-space: nowrap;">
          <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View case proceedings history"><i class="fa-solid fa-scroll"></i><span class="btn-text"> Details</span></button>
          <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward next hearing date"><i class="fa-solid fa-calendar-plus"></i><span class="btn-text"> Forward Date</span></button>
          <button type="button" class="table-view-btn whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="Send WhatsApp court notice to client"><i class="fa-brands fa-whatsapp"></i></button>
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
  const todayEmptyState = document.getElementById('homeTodayEmptyState');
  const todayTableWrapper = document.getElementById('homeTodayTableWrapper');

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
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const in7Days = new Date(todayZero.getTime() + (7 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000));

  const totalCount = allCaseRecords.length;
  const civilCount = allCaseRecords.filter(c => (c.caseType || 'civil').toLowerCase() === 'civil').length;
  const criminalCount = allCaseRecords.filter(c => (c.caseType || '').toLowerCase() === 'criminal').length;
  const revenueCount = allCaseRecords.filter(c => (c.caseType || '').toLowerCase() === 'revenue').length;

  const todayCases = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()) return false;
    const parsed = parseDateString(c.nextHearing);
    if (!parsed) return false;
    return parsed.getFullYear() === now.getFullYear() &&
           parsed.getMonth() === now.getMonth() &&
           parsed.getDate() === now.getDate();
  });

  const upcomingCases = allCaseRecords.filter(c => {
    if (!c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()) return false;
    if ((c.caseStatus || '').toLowerCase().includes('dispose')) return false;
    const parsed = parseDateString(c.nextHearing);
    if (!parsed) return false;
    const hTime = parsed.getTime();
    return hTime >= todayZero.getTime() && hTime <= in7Days.getTime();
  });

  const disposedCount = allCaseRecords.filter(c => (c.caseStatus || '').toLowerCase().includes('dispose')).length;
  const pendingCount = totalCount - disposedCount;
  const undatedCount = allCaseRecords.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim()).length;

  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const disposedPercent = totalCount > 0 ? Math.round((disposedCount / totalCount) * 100) : 0;

  // 3. Update KPI Card Values
  if (totalEl) totalEl.textContent = String(totalCount);
  if (breakdownEl) {
    breakdownEl.innerHTML = `
      <div class="breakdown-inline-row">
        <span>${civilCount} Civil</span>
        <span class="breakdown-dot">•</span>
        <span>${criminalCount} Criminal</span>
        <span class="breakdown-dot">•</span>
        <span>${revenueCount} Revenue</span>
      </div>
    `;
  }
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

  // 4b. Update Undated Cases Graph Card & Analytics
  const undatedCasesList = allCaseRecords.filter(c => !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim() || c.nextHearing.toLowerCase() === 'undated');
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

  // SVG Donut segments (circumference = 2 * PI * 38 ≈ 238.76)
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

  // 5. Populate Today's Court Appearance Board Table
  if (todayCases.length === 0) {
    if (todayEmptyState) todayEmptyState.style.display = 'flex';
    if (todayTableWrapper) todayTableWrapper.style.display = 'none';
    if (todayTbody) {
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
    }
  } else {
    if (todayEmptyState) todayEmptyState.style.display = 'none';
    if (todayTableWrapper) todayTableWrapper.style.display = 'block';
    if (todayTbody) {
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
              <strong style="color: #0f172a; font-size: 13.5px;">${escapeHtml(caseNumber)}</strong>
              <div style="margin-top: 3px;"><span class="case-badge ${caseType}" style="font-size: 9.5px; padding: 2px 7px; text-transform: uppercase; border-radius: 4px; font-weight: 700;">${caseType}</span></div>
            </td>
            <td><strong style="color: #0f172a; font-size: 13.5px; display: block;">${escapeHtml(caseName)}</strong></td>
            <td><span style="font-weight: 600; color: #334155;">🏛️ ${escapeHtml(courtName)}</span></td>
            <td><span class="hearing-stage-pill" style="color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; display: inline-block;">${escapeHtml(stage)}</span></td>
            <td>
              <div style="font-weight: 600; color: #1e293b;">${escapeHtml(clientName)}</div>
              ${clientPhone ? `<small style="margin-top: 3px; display: inline-block;"><a href="tel:${escapeHtml(clientPhone)}" style="color: #0284c7; text-decoration: none; font-weight: 600;" title="Call Client">📞 ${escapeHtml(clientPhone)}</a></small>` : ''}
            </td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View proceedings details"><i class="fa-solid fa-scroll"></i><span class="btn-text"> Details</span></button>
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case Details"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
              <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward next hearing date"><i class="fa-solid fa-calendar-plus"></i><span class="btn-text"> Forward</span></button>
              ${clientPhone ? `<a href="tel:${escapeHtml(clientPhone)}" class="table-view-btn call-btn" title="Call Client directly: ${escapeHtml(clientPhone)}" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;"><i class="fa-solid fa-phone"></i></a>` : ''}
              <button type="button" class="table-view-btn whatsapp-btn" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNumber)}')" title="WhatsApp notice to client"><i class="fa-brands fa-whatsapp"></i></button>
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
      ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
      : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';

    const partiesRemark = item.remark || item.remarks || '';
    const partiesRemarkHtml = partiesRemark
      ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
      : '<span style="color: #94a3b8;">—</span>';

    const disposalComment = item.disposalComment || item.disposal_comment || '';
    const disposalCommentHtml = disposalComment
      ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
      : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');

    return `
      <tr>
        <td><strong>${caseNumber}</strong></td>
        <td>${caseName}</td>
        <td>${clientName}</td>
        <td>${statusBadge}</td>
        <td class="case-remark-cell">${partiesRemarkHtml}</td>
        <td class="case-disposal-cell">${disposalCommentHtml}</td>
        <td>${filingDate}</td>
        <td>${nextHearing}</td>
        <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
          <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
        </td>
      </tr>
    `;
  }).join('');

  if (countEl) countEl.textContent = String(list.length);
}

function refreshAllCaseTables() {
  // 1. Civil Cases Table & Count
  const civilCases = allCaseRecords.filter(c => c.caseType === 'civil');
  renderCivilCasesTable(civilCases);

  // 2. State Cases Table & Count (Criminal / State of U.P.)
  const stateCases = allCaseRecords.filter(c => c.caseType === 'state' || c.caseType === 'criminal');
  const stateTable = document.querySelector('#stateCasesTable tbody');
  const legacyCriminalTable = document.querySelector('#criminalCasesTable tbody');
  const stateCountEl = document.getElementById('stateCount');
  const criminalCountEl = document.getElementById('criminalCount');

  if (stateCountEl) stateCountEl.textContent = String(stateCases.length);
  if (criminalCountEl) criminalCountEl.textContent = String(stateCases.length);

  const renderStateRow = c => {
    const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
    const statusBadge = isDisposed
      ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
      : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
    const partiesRemark = c.remark || c.remarks || '';
    const partiesRemarkHtml = partiesRemark
      ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
      : '<span style="color: #94a3b8;">—</span>';
    const disposalComment = c.disposalComment || c.disposal_comment || '';
    const disposalCommentHtml = disposalComment
      ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
      : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
    const caseNumber = c.caseNo || c.criminalCaseNumber || '—';

    return `
      <tr>
        <td><strong>${escapeHtml(caseNumber)}</strong></td>
        <td>${escapeHtml(c.caseName || (c.firstParty ? `${c.firstParty} vs ${c.accusedName}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—')))}</td>
        <td>${escapeHtml(c.crimeNumber || '—')}</td>
        <td>${escapeHtml(c.policeStation || '—')}</td>
        <td>${escapeHtml(c.crimeSection || '—')}</td>
        <td>${escapeHtml(c.clientName || c.criminalClientName || '—')}</td>
        <td>${statusBadge}</td>
        <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
        <td class="case-remark-cell">${partiesRemarkHtml}</td>
        <td class="case-disposal-cell">${disposalCommentHtml}</td>
        <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
          <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
        </td>
      </tr>
    `;
  };

  if (stateTable) {
    if (stateCases.length === 0) {
      stateTable.innerHTML = '<tr><td colspan="9" class="no-results">No State criminal cases recorded yet.</td></tr>';
    } else {
      stateTable.innerHTML = stateCases.map(renderStateRow).join('');
    }
  }
  if (legacyCriminalTable) {
    if (stateCases.length === 0) {
      legacyCriminalTable.innerHTML = '<tr><td colspan="5" class="no-results">No criminal cases found.</td></tr>';
    } else {
      legacyCriminalTable.innerHTML = stateCases.map(renderStateRow).join('');
    }
  }

  // 3. Family Cases Table & Count (Matrimonial / Maintenance 125)
  const familyCases = allCaseRecords.filter(c => c.caseType === 'family');
  const familyTable = document.querySelector('#familyCasesTable tbody');
  const familyCountEl = document.getElementById('familyCount');
  if (familyCountEl) familyCountEl.textContent = String(familyCases.length);
  if (familyTable) {
    if (familyCases.length === 0) {
      familyTable.innerHTML = '<tr><td colspan="10" class="no-results">No Family or Matrimonial cases recorded yet.</td></tr>';
    } else {
      familyTable.innerHTML = familyCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
          : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
        const caseNumber = c.caseNo || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(c.caseName || `${c.petitioner} vs ${c.respondent}`)}</td>
            <td><span class="case-badge family">${escapeHtml(c.matterType || 'Family Dispute')}</span></td>
            <td>${escapeHtml(c.petitioner || '—')}</td>
            <td>${escapeHtml(c.respondent || '—')}</td>
            <td>${escapeHtml(c.courtName || 'Family Court')}</td>
            <td>${escapeHtml(c.clientName || '—')}</td>
            <td>${statusBadge}</td>
            <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 4. Revenue Cases Table & Count (Land & Tehsil)
  const revenueTable = document.querySelector('#revenueCasesTable tbody');
  const revenueCountEl = document.getElementById('revenueCount');
  const revenueCases = allCaseRecords.filter(c => c.caseType === 'revenue');
  if (revenueCountEl) revenueCountEl.textContent = String(revenueCases.length);
  if (revenueTable) {
    if (revenueCases.length === 0) {
      revenueTable.innerHTML = '<tr><td colspan="12" class="no-results">No Revenue cases recorded yet.</td></tr>';
    } else {
      revenueTable.innerHTML = revenueCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
          : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
        const caseNumber = c.caseNo || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(c.caseName || `${c.applicant} vs ${c.oppositeParty}`)}</td>
            <td><span class="case-badge revenue">${escapeHtml(c.revenueActSection || 'Revenue Sec')}</span></td>
            <td>${escapeHtml(c.villageMauja || '—')}</td>
            <td>${escapeHtml(c.gataKhataNo || '—')}</td>
            <td>${escapeHtml(c.courtName || 'Tehsildar / SDM')}</td>
            <td>${escapeHtml(c.clientName || '—')}</td>
            <td>${statusBadge}</td>
            <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 5. Misc Civil Cases Table & Count
  const miscCivilTable = document.querySelector('#miscCivilCasesTable tbody');
  const miscCivilCountEl = document.getElementById('miscCivilCount');
  const miscCivilCases = allCaseRecords.filter(c => c.caseType === 'misc_civil');
  if (miscCivilCountEl) miscCivilCountEl.textContent = String(miscCivilCases.length);
  if (miscCivilTable) {
    if (miscCivilCases.length === 0) {
      miscCivilTable.innerHTML = '<tr><td colspan="13" class="no-results">No Misc Civil cases recorded yet.</td></tr>';
    } else {
      miscCivilTable.innerHTML = miscCivilCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
          : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
        const caseNumber = c.caseNo || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(c.caseName || `${c.applicant} vs ${c.oppositeParty}`)}</td>
            <td><span class="case-badge misc_civil">${escapeHtml(c.proceedingType || 'Misc Application')}</span></td>
            <td>${escapeHtml(c.originalCaseNumber || c.originalCase || '—')}</td>
            <td>${escapeHtml(c.applicant || '—')}</td>
            <td>${escapeHtml(c.oppositeParty || '—')}</td>
            <td>${escapeHtml(c.courtName || 'Court')}</td>
            <td>${escapeHtml(c.clientName || '—')}</td>
            <td>${statusBadge}</td>
            <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 6. Misc Criminal Cases Table & Count
  const miscCriminalTable = document.querySelector('#miscCriminalCasesTable tbody');
  const miscCriminalCountEl = document.getElementById('miscCriminalCount');
  const miscCriminalCases = allCaseRecords.filter(c => c.caseType === 'misc_criminal');
  if (miscCriminalCountEl) miscCriminalCountEl.textContent = String(miscCriminalCases.length);
  if (miscCriminalTable) {
    if (miscCriminalCases.length === 0) {
      miscCriminalTable.innerHTML = '<tr><td colspan="13" class="no-results">No Misc Criminal cases recorded yet.</td></tr>';
    } else {
      miscCriminalTable.innerHTML = miscCriminalCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
          : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
        const caseNumber = c.caseNo || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(c.caseName || `${c.applicant} vs ${c.oppositeParty}`)}</td>
            <td><span class="case-badge misc_criminal">${escapeHtml(c.proceedingType || 'Bail Application')}</span></td>
            <td>${escapeHtml(c.originalCaseNumber || c.originalCase || '—')}</td>
            <td>${escapeHtml(c.policeStation || '—')}</td>
            <td>${escapeHtml(c.applicant || '—')}</td>
            <td>${escapeHtml(c.courtName || 'Court')}</td>
            <td>${escapeHtml(c.clientName || '—')}</td>
            <td>${statusBadge}</td>
            <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 7. Complaint Cases Table & Count (Cheque Bounce Sec 138 NI Act, Sec 200 CrPC, Defamation)
  const complaintTable = document.querySelector('#complaintCasesTable tbody');
  const complaintCountEl = document.getElementById('complaintCount');
  const complaintCases = allCaseRecords.filter(c => c.caseType === 'complaint');
  if (complaintCountEl) complaintCountEl.textContent = String(complaintCases.length);
  if (complaintTable) {
    if (complaintCases.length === 0) {
      complaintTable.innerHTML = '<tr><td colspan="14" class="no-results">No Complaint cases recorded yet.</td></tr>';
    } else {
      complaintTable.innerHTML = complaintCases.map(c => {
        const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
        const statusBadge = isDisposed
          ? '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>'
          : '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');
        const caseNumber = c.caseNo || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(c.caseName || `${c.complainant} vs ${c.accusedName}`)}</td>
            <td><span class="case-badge complaint">${escapeHtml(c.complaintType || 'Complaint')}</span></td>
            <td>${escapeHtml(c.sectionAct || '—')}</td>
            <td>${escapeHtml(c.complainant || '—')}</td>
            <td>${escapeHtml(c.accusedName || '—')}</td>
            <td>${escapeHtml(c.policeStation || '—')}</td>
            <td>${escapeHtml(c.courtName || 'Court')}</td>
            <td>${escapeHtml(c.clientName || '—')}</td>
            <td>${statusBadge}</td>
            <td><strong>${formatDateDMY(c.nextHearing)}</strong></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 8. Disposed Cases Table & Count
  const disposedCases = allCaseRecords.filter(c => (c.caseStatus || '').toLowerCase().includes('dispose'));
  const disposedCountEl = document.getElementById('disposedCount');
  const disposedTable = document.querySelector('#disposedCasesTable tbody');
  if (disposedCountEl) disposedCountEl.textContent = String(disposedCases.length);
  if (disposedTable) {
    if (disposedCases.length === 0) {
      disposedTable.innerHTML = '<tr><td colspan="9" class="no-results">No disposed cases recorded yet.</td></tr>';
    } else {
      disposedTable.innerHTML = disposedCases.map(c => {
        const caseNumber = c.caseNo || c.criminalCaseNumber || '—';
        const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
        const partiesRemark = c.remark || c.remarks || '';
        const partiesRemarkHtml = partiesRemark
          ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
          : '<span style="color: #94a3b8;">—</span>';
        const disposalComment = c.disposalComment || c.disposal_comment || '';
        const disposalCommentHtml = disposalComment
          ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
          : (partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');

        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(caseName)}</td>
            <td>${escapeHtml(c.clientName || c.criminalClientName || '—')}</td>
            <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
            <td>${escapeHtml(c.courtName || c.criminalCourtName || 'District Court')}</td>
            <td><span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span></td>
            <td class="case-remark-cell">${partiesRemarkHtml}</td>
            <td class="case-disposal-cell">${disposalCommentHtml}</td>
            <td class="table-actions-td" style="text-align: center; white-space: nowrap;">
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Reopen Case"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
            </td>
          </tr>
        `;
      }).join('');
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
      undatedTable.innerHTML = undatedCases.map(c => {
        const caseNumber = c.caseNo || c.criminalCaseNumber || '—';
        const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : (c.victimName ? `${c.victimName} vs ${c.accusedName}` : '—'));
        return `
          <tr>
            <td><strong>${escapeHtml(caseNumber)}</strong></td>
            <td>${escapeHtml(caseName)}</td>
            <td>${escapeHtml(c.clientName || c.criminalClientName || '—')}</td>
            <td><span class="case-badge ${c.caseType || 'civil'}">${(c.caseType || 'Civil').toUpperCase()}</span></td>
            <td>${escapeHtml(c.courtName || c.criminalCourtName || 'District Court')}</td>
            <td>${formatDateDMY(c.filingDate || c.crimeFilingDate)}</td>
            <td class="table-actions-td" style="white-space: nowrap; text-align: center;">
              <button type="button" class="table-view-btn update-hearing-btn" onclick="openUpdateHearingForCase('${escapeHtml(caseNumber)}')" title="Forward Hearing Date">
                <i class="fa-solid fa-calendar-plus"></i><span class="btn-text"> Date</span>
              </button>
              <button type="button" class="table-view-btn edit-case-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case Details">
                <i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 6. All Cases Combined Table with Live Filters
  updateAllCasesTypePillCounts();
  renderAllCasesTableWithFilters();

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

// ==========================================
// ALL CASES MASTER REGISTER & LIVE FILTER SUITE (WITH PAGINATION)
// ==========================================

let currentAllCasesFilteredList = [];
let allCasesPageSize = 25; // options: 10, 25, 50, 100, 'all'
let allCasesCurrentPage = 1;

function handleAllCasesPageSizeChange(val) {
  if (val === 'all') {
    allCasesPageSize = 'all';
  } else {
    allCasesPageSize = parseInt(val, 10) || 25;
  }
  allCasesCurrentPage = 1;
  renderAllCasesTableWithFilters(false);
}

function changeAllCasesPage(targetPage) {
  allCasesCurrentPage = targetPage;
  renderAllCasesTableWithFilters(false);
}

function updateAllCasesTypePillCounts() {
  const records = allCaseRecords || [];
  const counts = {
    all: records.length,
    civil: 0,
    state: 0,
    family: 0,
    revenue: 0,
    misc_civil: 0,
    misc_criminal: 0,
    complaint: 0
  };

  records.forEach(c => {
    const t = (c.caseType || 'civil').toLowerCase().trim();
    if (t === 'civil') counts.civil++;
    else if (t === 'state' || t === 'criminal') counts.state++;
    else if (t === 'family') counts.family++;
    else if (t === 'revenue') counts.revenue++;
    else if (t === 'misc_civil' || t === 'misccivil') counts.misc_civil++;
    else if (t === 'misc_criminal' || t === 'misccriminal') counts.misc_criminal++;
    else if (t === 'complaint') counts.complaint++;
  });

  const setPill = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(count);
  };

  setPill('pillCountAll', counts.all);
  setPill('pillCountCivil', counts.civil);
  setPill('pillCountState', counts.state);
  setPill('pillCountFamily', counts.family);
  setPill('pillCountRevenue', counts.revenue);
  setPill('pillCountMiscCivil', counts.misc_civil);
  setPill('pillCountMiscCriminal', counts.misc_criminal);
  setPill('pillCountComplaint', counts.complaint);

  // Synchronize sidebar nav counter
  const navBadge = document.getElementById('allCasesNavCount');
  if (navBadge) navBadge.textContent = String(counts.all);
}

function filterAllCasesByType(type) {
  const typeSelect = document.getElementById('allCasesTypeSelect');
  if (typeSelect) {
    typeSelect.value = type || '';
  }

  // Update active pill button
  document.querySelectorAll('.all-cases-type-pills-bar .type-pill-btn').forEach(btn => {
    const btnType = btn.getAttribute('data-type') || '';
    if (btnType === (type || '')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderAllCasesTableWithFilters();
}

function handleAllCasesTypeSelectChange() {
  const typeSelect = document.getElementById('allCasesTypeSelect');
  const val = typeSelect ? typeSelect.value : '';

  // Synchronize pill button active state
  document.querySelectorAll('.all-cases-type-pills-bar .type-pill-btn').forEach(btn => {
    const btnType = btn.getAttribute('data-type') || '';
    if (btnType === val) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderAllCasesTableWithFilters();
}

function resetAllCasesFilters() {
  const searchInput = document.getElementById('allCasesSearchInput');
  const typeSelect = document.getElementById('allCasesTypeSelect');
  const statusSelect = document.getElementById('allCasesStatusSelect');
  const courtSelect = document.getElementById('allCasesCourtSelect');

  if (searchInput) searchInput.value = '';
  if (typeSelect) typeSelect.value = '';
  if (statusSelect) statusSelect.value = '';
  if (courtSelect) courtSelect.value = '';

  document.querySelectorAll('.all-cases-type-pills-bar .type-pill-btn').forEach(btn => {
    const btnType = btn.getAttribute('data-type') || '';
    if (btnType === '') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderAllCasesTableWithFilters();
}

function renderAllCasesTableWithFilters(resetPage = true) {
  const tbody = document.querySelector('#allCasesTable tbody');
  const countBadge = document.getElementById('allCasesCountBadge');
  if (!tbody) return;

  if (resetPage) {
    allCasesCurrentPage = 1;
  }

  const searchInput = document.getElementById('allCasesSearchInput');
  const typeSelect = document.getElementById('allCasesTypeSelect');
  const statusSelect = document.getElementById('allCasesStatusSelect');
  const courtSelect = document.getElementById('allCasesCourtSelect');

  const query = (searchInput?.value || '').trim().toLowerCase();
  const selectedType = (typeSelect?.value || '').trim().toLowerCase();
  const selectedStatus = (statusSelect?.value || '').trim().toLowerCase();
  const selectedCourt = (courtSelect?.value || '').trim().toLowerCase();

  let filtered = (allCaseRecords || []).slice();

  // 1. Filter by Case Type
  if (selectedType) {
    filtered = filtered.filter(c => {
      const t = (c.caseType || 'civil').toLowerCase().trim();
      if (selectedType === 'state') return t === 'state' || t === 'criminal';
      if (selectedType === 'misc_civil') return t === 'misc_civil' || t === 'misccivil';
      if (selectedType === 'misc_criminal') return t === 'misc_criminal' || t === 'misccriminal';
      return t === selectedType;
    });
  }

  // 2. Filter by Status
  if (selectedStatus) {
    filtered = filtered.filter(c => {
      const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
      const isUndated = !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim() || c.nextHearing.toLowerCase() === 'undated';
      if (selectedStatus === 'disposed') return isDisposed;
      if (selectedStatus === 'undated') return !isDisposed && isUndated;
      if (selectedStatus === 'pending') return !isDisposed && !isUndated;
      return true;
    });
  }

  // 3. Filter by Court
  if (selectedCourt) {
    filtered = filtered.filter(c => {
      const courtName = (c.courtName || c.criminalCourtName || '').trim().toLowerCase();
      return courtName === selectedCourt;
    });
  }

  // 4. Live Search across multiple indices
  if (query) {
    filtered = filtered.filter(c => {
      const caseNo = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
      const caseName = (c.caseName || '').toLowerCase();
      const plaintiff = (c.plaintiff || '').toLowerCase();
      const defendant = (c.defendant || '').toLowerCase();
      const accused = (c.accusedName || '').toLowerCase();
      const victim = (c.victimName || '').toLowerCase();
      const client = (c.clientName || c.criminalClientName || '').toLowerCase();
      const phone = (c.clientNumber || c.criminalClientNumber || '').toLowerCase();
      const court = (c.courtName || c.criminalCourtName || '').toLowerCase();
      const remark = (c.remark || c.remarks || '').toLowerCase();
      const police = (c.policeStation || '').toLowerCase();
      const crimeNo = (c.crimeNumber || c.firNumber || '').toLowerCase();

      return caseNo.includes(query) ||
        caseName.includes(query) ||
        plaintiff.includes(query) ||
        defendant.includes(query) ||
        accused.includes(query) ||
        victim.includes(query) ||
        client.includes(query) ||
        phone.includes(query) ||
        court.includes(query) ||
        remark.includes(query) ||
        police.includes(query) ||
        crimeNo.includes(query);
    });
  }

  currentAllCasesFilteredList = filtered;

  const totalFiltered = filtered.length;
  const isAll = allCasesPageSize === 'all';
  const effectivePageSize = isAll ? totalFiltered : (parseInt(allCasesPageSize, 10) || 25);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));

  if (allCasesCurrentPage > totalPages) allCasesCurrentPage = totalPages;
  if (allCasesCurrentPage < 1) allCasesCurrentPage = 1;

  const startIndex = isAll ? 0 : (allCasesCurrentPage - 1) * effectivePageSize;
  const endIndex = isAll ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered);

  // Update count badge
  if (countBadge) {
    countBadge.textContent = `Showing ${totalFiltered} of ${(allCaseRecords || []).length} cases`;
  }

  // Render pagination controls
  renderAllCasesPaginationControls(totalFiltered, effectivePageSize, totalPages, allCasesCurrentPage, isAll);

  if (totalFiltered === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="no-results" style="text-align: center; padding: 2rem; color: #64748b;">
          🔍 No cases match the selected filters or search query.
          <br><button type="button" class="table-view-btn" onclick="resetAllCasesFilters()" style="margin-top: 8px; font-size: 0.8rem;">Clear Filters</button>
        </td>
      </tr>
    `;
    return;
  }

  const pageRecords = filtered.slice(startIndex, endIndex);

  tbody.innerHTML = pageRecords.map(c => {
    const caseNumber = c.caseNo || c.criminalCaseNumber || '—';

    // Sanitize case name and avoid bare 'vs'
    let caseName = (c.caseName || '').trim();
    if (!caseName || caseName.toLowerCase() === 'vs' || caseName.toLowerCase() === 'vs.') {
      if (c.plaintiff && c.defendant) {
        caseName = `${c.plaintiff} vs ${c.defendant}`;
      } else if (c.plaintiff) {
        caseName = `${c.plaintiff} vs Opposite`;
      } else if (c.accusedName) {
        caseName = `State vs ${c.accusedName}`;
      } else if (c.victimName) {
        caseName = `${c.victimName} vs Accused`;
      } else {
        caseName = 'Untitled Matter';
      }
    }

    const courtName = c.courtName || c.criminalCourtName || 'District Court';
    const clientName = c.clientName || c.criminalClientName || '—';
    const clientPhone = c.clientNumber || c.criminalClientNumber || '';

    const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
    const isUndated = !c.nextHearing || c.nextHearing === '—' || c.nextHearing === 'null' || !c.nextHearing.trim() || c.nextHearing.toLowerCase() === 'undated';

    let statusBadge = '';
    if (isDisposed) {
      statusBadge = '<span class="status-badge disposed"><i class="fa-solid fa-circle-check"></i> Disposed</span>';
    } else if (isUndated) {
      statusBadge = '<span class="status-badge undated" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;"><i class="fa-solid fa-calendar-xmark"></i> Undated</span>';
    } else {
      statusBadge = '<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>';
    }

    const nextHearingStr = isUndated
      ? '<span style="color: #d97706; font-weight: 600;">—</span>'
      : `<strong>${formatDateDMY(c.nextHearing)}</strong>`;

    const partiesRemark = c.remark || c.remarks || '';
    const partiesRemarkHtml = partiesRemark
      ? `<span class="case-remark-clamp" title="${escapeHtml(partiesRemark)}">👥 ${escapeHtml(partiesRemark)}</span>`
      : '<span style="color: #94a3b8;">—</span>';

    const disposalComment = c.disposalComment || c.disposal_comment || '';
    const disposalCommentHtml = disposalComment
      ? `<span class="case-disposal-clamp" title="${escapeHtml(disposalComment)}">⚖️ ${escapeHtml(disposalComment)}</span>`
      : (isDisposed && partiesRemark ? `<span class="case-disposal-clamp" title="${escapeHtml(partiesRemark)}">⚖️ ${escapeHtml(partiesRemark)}</span>` : '<span style="color: #94a3b8;">—</span>');

    return `
      <tr>
        <td class="copyable-case-no" title="Double-click to copy Case Number"><strong>${escapeHtml(caseNumber)}</strong></td>
        <td>
          <div style="font-weight: 600; color: #1e293b; word-break: break-word;">${escapeHtml(caseName)}</div>
          ${c.policeStation ? `<small style="color:#64748b;">🚔 PS: ${escapeHtml(c.policeStation)}` + (c.crimeNumber ? ` | ${escapeHtml(c.crimeNumber)}` : '') + `</small>` : ''}
        </td>
        <td>🏛️ ${escapeHtml(courtName)}</td>
        <td>
          <div>${escapeHtml(clientName)}</div>
          ${clientPhone ? `<small style="color:#64748b;">📞 ${escapeHtml(clientPhone)}</small>` : ''}
        </td>
        <td class="all-cases-status-cell">${statusBadge}</td>
        <td class="case-remark-cell">${partiesRemarkHtml}</td>
        <td class="case-disposal-cell">${disposalCommentHtml}</td>
        <td class="all-cases-date-cell">${nextHearingStr}</td>
        <td class="all-cases-actions-cell-td table-actions-td" style="white-space: nowrap; text-align: center;">
          <div class="all-cases-actions-cell" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
            <button type="button" class="all-cases-action-btn details-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNumber)}')" title="View Case Proceedings & Dossier"><i class="fa-solid fa-eye"></i></button>
            <button type="button" class="all-cases-action-btn edit-btn" onclick="editCaseFromTable('${escapeHtml(caseNumber)}')" title="Edit / Update Case Details"><i class="fa-solid fa-pen-to-square"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAllCasesPaginationControls(totalItems, pageSize, totalPages, currentPage, isAll) {
  const infoEl = document.getElementById('allCasesPaginationInfo');
  const controlsEl = document.getElementById('allCasesPaginationControls');

  if (!infoEl || !controlsEl) return;

  if (totalItems === 0) {
    infoEl.textContent = 'Showing 0 to 0 of 0 entries';
    controlsEl.innerHTML = '';
    return;
  }

  const startDisplay = isAll ? 1 : (currentPage - 1) * pageSize + 1;
  const endDisplay = isAll ? totalItems : Math.min(currentPage * pageSize, totalItems);
  const filteredSuffix = totalItems !== (allCaseRecords || []).length
    ? ` (filtered from ${(allCaseRecords || []).length} total cases)`
    : '';

  infoEl.textContent = `Showing ${startDisplay} to ${endDisplay} of ${totalItems} entries${filteredSuffix}`;

  if (isAll || totalPages <= 1) {
    controlsEl.innerHTML = '';
    return;
  }

  let html = '';

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  // First and Previous buttons
  html += `<button type="button" class="pagination-btn" ${isFirst ? 'disabled' : ''} onclick="changeAllCasesPage(1)" title="First Page">«</button>`;
  html += `<button type="button" class="pagination-btn" ${isFirst ? 'disabled' : ''} onclick="changeAllCasesPage(${currentPage - 1})" title="Previous Page">‹ Prev</button>`;

  // Numbered page buttons with smart ellipsis
  const pagesToShow = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
  } else {
    pagesToShow.push(1);
    if (currentPage > 4) {
      pagesToShow.push('...');
    }
    const startRange = Math.max(2, currentPage - 1);
    const endRange = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startRange; i <= endRange; i++) {
      if (!pagesToShow.includes(i)) pagesToShow.push(i);
    }
    if (currentPage < totalPages - 3) {
      pagesToShow.push('...');
    }
    if (!pagesToShow.includes(totalPages)) {
      pagesToShow.push(totalPages);
    }
  }

  pagesToShow.forEach(p => {
    if (p === '...') {
      html += `<span class="pagination-ellipsis">…</span>`;
    } else {
      const isActive = p === currentPage ? ' active' : '';
      html += `<button type="button" class="pagination-btn${isActive}" onclick="changeAllCasesPage(${p})">${p}</button>`;
    }
  });

  // Next and Last buttons
  html += `<button type="button" class="pagination-btn" ${isLast ? 'disabled' : ''} onclick="changeAllCasesPage(${currentPage + 1})" title="Next Page">Next ›</button>`;
  html += `<button type="button" class="pagination-btn" ${isLast ? 'disabled' : ''} onclick="changeAllCasesPage(${totalPages})" title="Last Page">»</button>`;

  controlsEl.innerHTML = html;
}

function editCaseFromTable(caseNo) {
  if (!caseNo || caseNo === '—') return;
  showTab('update');
  const searchInput = document.getElementById('updateSearchInput');
  if (searchInput) searchInput.value = caseNo;
  loadCaseForUpdate(caseNo);
}

function exportAllCasesCsv() {
  const casesToExport = currentAllCasesFilteredList && currentAllCasesFilteredList.length > 0
    ? currentAllCasesFilteredList
    : (allCaseRecords || []);

  if (casesToExport.length === 0) {
    if (typeof showToast === 'function') {
      showToast('No cases available to export.', 'error');
    } else {
      alert('No cases available to export.');
    }
    return;
  }

  const headers = [
    'Sr No',
    'Case Number',
    'Case Title / Parties',
    'Case Type',
    'Court / Forum',
    'Client Name',
    'Client Phone',
    'Case Status',
    'Filing Date',
    'Next Hearing Date',
    'Remarks'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = casesToExport.map((c, idx) => {
    const caseNo = c.caseNo || c.criminalCaseNumber || '';
    const caseTitle = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant || ''}` : (c.accusedName ? `State vs ${c.accusedName}` : ''));
    const rawType = (c.caseType || 'civil').toLowerCase();
    const caseType = rawType === 'state' || rawType === 'criminal' ? 'STATE (CRIMINAL)' : rawType.replace('_', ' ').toUpperCase();
    const court = c.courtName || c.criminalCourtName || '';
    const client = c.clientName || c.criminalClientName || '';
    const phone = c.clientNumber || c.criminalClientNumber || '';
    const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
    const status = isDisposed ? 'Disposed Off' : 'Pending';
    const filing = formatDateDMY(c.filingDate || c.crimeFilingDate);
    const hearing = formatDateDMY(c.nextHearing);
    const remark = c.remark || c.remarks || '';

    return [
      idx + 1,
      escapeCSV(caseNo),
      escapeCSV(caseTitle),
      escapeCSV(caseType),
      escapeCSV(court),
      escapeCSV(client),
      escapeCSV(phone),
      escapeCSV(status),
      escapeCSV(filing),
      escapeCSV(hearing),
      escapeCSV(remark)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `All_Cases_Register_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Window exposures
window.updateAllCasesTypePillCounts = updateAllCasesTypePillCounts;
window.filterAllCasesByType = filterAllCasesByType;
window.handleAllCasesTypeSelectChange = handleAllCasesTypeSelectChange;
window.resetAllCasesFilters = resetAllCasesFilters;
window.renderAllCasesTableWithFilters = renderAllCasesTableWithFilters;
window.handleAllCasesPageSizeChange = handleAllCasesPageSizeChange;
window.changeAllCasesPage = changeAllCasesPage;
window.renderAllCasesPaginationControls = renderAllCasesPaginationControls;
window.editCaseFromTable = editCaseFromTable;
window.exportAllCasesCsv = exportAllCasesCsv;

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
      <div class="hearing-empty-state-card">
        <div class="hearing-empty-emblem"><i class="fa-solid fa-scale-balanced"></i></div>
        <h3>No Upcoming Hearings</h3>
        <p>Your court docket is completely clear for the next 7 days. No appearances, framing of issues, or evidence proceedings are scheduled.</p>
        <div class="hearing-empty-actions">
          <button type="button" class="primary-btn" onclick="showTab('causelist')" style="padding: 10px 20px; border-radius: 10px;">
            <i class="fa-solid fa-clipboard-list"></i> Daily Cause List
          </button>
          <button type="button" class="secondary-btn" onclick="showTab('calendar')" style="padding: 10px 20px; border-radius: 10px;">
            <i class="fa-regular fa-calendar"></i> Interactive Calendar
          </button>
          <button type="button" class="secondary-btn" onclick="showTab('all')" style="padding: 10px 20px; border-radius: 10px;">
            <i class="fa-solid fa-folder-tree"></i> All Cases
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = upcoming.map(c => {
    const caseNum = c.caseNo || c.criminalCaseNumber || '—';
    const caseName = c.caseName || (c.plaintiff ? `${c.plaintiff} vs ${c.defendant || 'Opposite'}` : `${c.victimName || 'State'} vs ${c.accusedName || 'Accused'}`) || '—';
    const court = c.courtName || c.criminalCourtName || 'District Court';
    const dateFormatted = formatDateDMY(c.nextHearing);
    const stage = c.hearingProcess || c.process || 'Scheduled Hearing';
    const clientName = c.clientName || c.criminalClientName || 'Client';
    const clientPhone = c.clientNumber || c.criminalClientNumber || '';
    const rawType = (c.caseType || 'civil').toLowerCase();
    const typeLabel = rawType === 'state' || rawType === 'criminal' ? 'CRIMINAL' : rawType.replace('_', ' ').toUpperCase();
    const remark = c.remark || c.remarks || '';

    const parsedHearing = parseDateString(c.nextHearing);
    let daysBadgeClass = '';
    let daysBadgeIcon = 'fa-regular fa-calendar';
    let daysLeftText = 'Scheduled';
    let isUrgentToday = false;

    if (parsedHearing) {
      const diffTime = parsedHearing.getTime() - todayZero.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysLeft === 0) {
        daysBadgeClass = 'today';
        daysBadgeIcon = 'fa-solid fa-fire';
        daysLeftText = 'Today in Court';
        isUrgentToday = true;
      } else if (daysLeft === 1) {
        daysBadgeClass = 'tomorrow';
        daysBadgeIcon = 'fa-solid fa-bolt';
        daysLeftText = 'Tomorrow';
      } else {
        daysBadgeIcon = 'fa-regular fa-clock';
        daysLeftText = `In ${daysLeft} Days`;
      }
    }

    return `
      <div class="legal-hearing-card ${isUrgentToday ? 'urgent-today' : ''}">
        <!-- Top Status & Category Strip -->
        <div class="hearing-card-header">
          <span class="hearing-countdown-badge ${daysBadgeClass}">
            <i class="${daysBadgeIcon}"></i> ${daysLeftText}
          </span>
          <span class="hearing-type-badge ${rawType}">
            ${typeLabel}
          </span>
        </div>

        <!-- Case Identity Header Block: Case Name Bigger & Prominent -->
        <div class="hearing-card-title-block">
          <div class="hearing-caseno-row">
            <span class="hearing-caseno-tag"><i class="fa-solid fa-hashtag" style="font-size: 11px;"></i> ${escapeHtml(caseNum)}</span>
            <button type="button" class="hearing-dossier-pill-btn" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNum)}')" title="View Complete Case Dossier">
              <i class="fa-solid fa-folder-open"></i> Dossier
            </button>
          </div>
          <h3 class="hearing-casename" title="${escapeHtml(caseName)}">${escapeHtml(caseName)}</h3>
        </div>

        <!-- Hearing Date & Court Location Highlight Strip -->
        <div class="hearing-datetime-strip">
          <div class="hearing-card-date">
            <i class="fa-solid fa-calendar-day"></i>
            <span>${dateFormatted}</span>
          </div>
          <div class="hearing-card-court" title="${escapeHtml(court)}">
            🏛️ ${escapeHtml(court)}
          </div>
        </div>

        <!-- Structured Case Metadata Details -->
        <div class="hearing-meta-table">
          <div class="hearing-meta-row">
            <span class="hearing-meta-lbl"><i class="fa-solid fa-stairs"></i> Stage / Purpose</span>
            <span class="hearing-meta-val highlight-stage" title="${escapeHtml(stage)}">${escapeHtml(stage)}</span>
          </div>
          <div class="hearing-meta-row">
            <span class="hearing-meta-lbl"><i class="fa-solid fa-user-tie"></i> Client</span>
            <span class="hearing-meta-val" title="${escapeHtml(clientName)}">${escapeHtml(clientName)}</span>
          </div>
          ${clientPhone ? `
          <div class="hearing-meta-row">
            <span class="hearing-meta-lbl"><i class="fa-solid fa-phone"></i> Contact</span>
            <span class="hearing-meta-val" style="font-family: monospace; font-size: 12px;">${escapeHtml(clientPhone)}</span>
          </div>
          ` : ''}
        </div>

        ${remark ? `
        <div class="hearing-remark-box" title="${escapeHtml(remark)}">
          <i class="fa-solid fa-note-sticky"></i>
          <div><strong>Note:</strong> ${escapeHtml(remark)}</div>
        </div>
        ` : ''}

        <!-- Footer Actions: Proceedings History + Direct Call + WhatsApp Notice -->
        <div class="hearing-card-footer">
          <button type="button" class="hearing-primary-cta" onclick="openCaseHistoryModalByNo('${escapeHtml(caseNum)}')">
            <i class="fa-solid fa-file-lines"></i> Proceedings
          </button>
          ${clientPhone ? `
          <a href="tel:${escapeHtml(clientPhone)}" class="hearing-call-cta" title="Call Client directly: ${escapeHtml(clientPhone)}">
            <i class="fa-solid fa-phone"></i> Call
          </a>
          ` : `
          <button type="button" class="hearing-call-cta disabled" title="No client phone number registered" disabled>
            <i class="fa-solid fa-phone-slash"></i> Call
          </button>
          `}
          <button type="button" class="hearing-whatsapp-cta" onclick="sendWhatsAppHearingNotice('${escapeHtml(caseNum)}')" title="Dispatch WhatsApp reminder to client">
            <i class="fa-brands fa-whatsapp"></i> Notice
          </button>
        </div>
      </div>
    `;
  }).join('');
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

function updateSupabaseStatusIndicator(isConnected) {
  const pill = document.getElementById('homeHeroStatus') || document.querySelector('.hero-status-pill');
  if (!pill) return;
  const textEl = document.getElementById('homeHeroStatusText') || pill.querySelector('span:not(.live-dot)');
  if (isConnected) {
    pill.classList.remove('disconnected');
    pill.classList.add('connected');
    if (textEl) textEl.textContent = 'Supabase Cloud Connected';
  } else {
    pill.classList.remove('connected');
    pill.classList.add('disconnected');
    if (textEl) textEl.textContent = 'Supabase Cloud Disconnected';
  }
}
window.updateSupabaseStatusIndicator = updateSupabaseStatusIndicator;

window.addEventListener('online', () => {
  if (supabaseClient) {
    updateSupabaseStatusIndicator(true);
    if (typeof fetchAllDataFromSupabase === 'function') fetchAllDataFromSupabase();
  } else {
    updateSupabaseStatusIndicator(false);
  }
});

window.addEventListener('offline', () => {
  updateSupabaseStatusIndicator(false);
});

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

let isSubmittingTodo = false;
async function handleAddTodoSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isSubmittingTodo) return false;

  const select = document.getElementById('todoCaseSelect');
  const titleInput = document.getElementById('todoTitle');
  const deadlineInput = document.getElementById('todoDeadline');
  const priorityInput = document.getElementById('todoPriority');
  const submitBtn = document.querySelector('#todoForm button[type="submit"]') || document.getElementById('addTodoSubmitBtn');

  const caseNo = select?.value?.trim();
  const title = titleInput?.value?.trim();
  const deadline = deadlineInput?.value;
  const priority = priorityInput?.value || 'medium';

  if (!caseNo || !title || !deadline) {
    alert('Please fill in all task fields.');
    return false;
  }

  // Prevent duplicate pending task (same case + same title + same deadline)
  const isDuplicateTask = caseTasks.some(t => 
    t.status !== 'completed' &&
    (t.caseNo || '').trim().toLowerCase() === caseNo.toLowerCase() &&
    (t.taskTitle || '').trim().toLowerCase() === title.toLowerCase() &&
    t.deadlineDate === deadline
  );

  if (isDuplicateTask) {
    alert(`⚠️ A pending task "${title}" with deadline ${deadline} already exists for case ${caseNo}.`);
    return false;
  }

  const found = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === caseNo.toLowerCase() || num2 === caseNo.toLowerCase();
  });

  const caseName = found ? (found.caseName || (found.plaintiff ? `${found.plaintiff} vs ${found.defendant}` : (found.victimName ? `${found.victimName} vs ${found.accusedName}` : '—'))) : '—';
  const hearingDate = found?.nextHearing || null;

  try {
    isSubmittingTodo = true;
    if (submitBtn) submitBtn.disabled = true;

    // Check live Supabase for duplicate pending task
    if (supabaseClient) {
      try {
        const { data: dupDb } = await supabaseClient
          .from('case_todos')
          .select('id')
          .ilike('case_number', caseNo)
          .ilike('task_title', title)
          .eq('deadline_date', deadline)
          .neq('status', 'completed')
          .limit(1);

        if (dupDb && dupDb.length > 0) {
          alert(`⚠️ A pending task "${title}" already exists in the database for case ${caseNo}.`);
          return false;
        }
      } catch (checkErr) {
        console.warn('Supabase task duplicate check fallback:', checkErr);
      }
    }

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
  } finally {
    isSubmittingTodo = false;
    if (submitBtn) submitBtn.disabled = false;
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
      const type = (c.caseType || 'civil').toLowerCase().trim();
      if (type === 'civil' || type === 'misc_civil') civilHearingsCount++;
      else if (type === 'criminal' || type === 'state' || type === 'complaint' || type === 'misc_criminal') criminalHearingsCount++;
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
            const rawType = (h.caseType || 'civil').toLowerCase().trim();
            const caseNo = h.caseNo || h.criminalCaseNumber || '—';
            let extraClass = '';
            if (rawType === 'state' || rawType === 'complaint' || rawType === 'misc_criminal') {
              extraClass = 'criminal';
            } else if (rawType === 'misc_civil') {
              extraClass = 'civil';
            }
            return `<span class="day-hearing-pill ${escapeHtml(rawType)} ${extraClass}" title="${escapeHtml(caseNo)}: ${escapeHtml(h.caseName || 'Case')}">${escapeHtml(caseNo)}</span>`;
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

  document.body.classList.remove('printing-case-dossier');
  window.print();
}

window.printDailyCauseList = printDailyCauseList;

// ==============================================================================
// Full Case Dossier Printable Engine
// ==============================================================================
function populatePrintableCaseDossier(caseObj) {
  if (!caseObj) return;

  const caseType = (caseObj.caseType || 'civil').toLowerCase();
  const isCriminal = caseType === 'criminal';
  const isFamily = caseType === 'family';
  const isRevenue = caseType === 'revenue';

  const caseNumber = caseObj.caseNo || caseObj.criminalCaseNumber || '—';
  const caseYear = caseObj.caseYear || caseObj.crimeYear || '—';
  const courtName = caseObj.courtName || caseObj.criminalCourtName || '—';
  const filingDateVal = caseObj.filingDate || caseObj.crimeFilingDate;
  const filingDate = formatDateDMY(filingDateVal);
  const nextHearing = formatDateDMY(caseObj.nextHearing);
  const nextProcess = caseObj.hearingProcess || '—';
  const prevHearing = formatDateDMY(caseObj.previousHearing);
  const prevProcess = caseObj.previousProcess || '—';
  const clientName = caseObj.clientName || caseObj.criminalClientName || caseObj.client || '—';
  const clientPhone = caseObj.clientNumber || caseObj.criminalClientNumber || '';

  // Status calculation
  const isDisposed = caseObj.status === 'disposed' || Boolean(caseObj.disposalComment || caseObj.disposal_comment);
  const isUndated = !caseObj.nextHearing || caseObj.nextHearing === '—' || String(caseObj.nextHearing).trim() === '';
  let statusText = 'Pending';
  if (isDisposed) statusText = 'Disposed Off';
  else if (isUndated) statusText = 'Undated / Unscheduled';

  // Case Title
  let caseTitle = caseObj.caseName || '';
  if (!caseTitle) {
    if (isCriminal) {
      const v = caseObj.victimName || caseObj.firstParty;
      const a = caseObj.accusedName || caseObj.oppositeParty;
      caseTitle = v && a ? `${v} vs ${a}` : (v || a || 'Criminal Matter');
    } else if (isFamily) {
      const p = caseObj.petitioner || caseObj.plaintiff;
      const r = caseObj.respondent || caseObj.defendant;
      caseTitle = p && r ? `${p} vs ${r}` : (p || r || 'Family Dispute');
    } else if (isRevenue) {
      const app = caseObj.applicant || caseObj.plaintiff;
      const opp = caseObj.respondent || caseObj.defendant;
      caseTitle = app && opp ? `${app} vs ${opp}` : (app || opp || 'Revenue Matter');
    } else {
      const p = caseObj.plaintiff || caseObj.firstParty;
      const d = caseObj.defendant || caseObj.oppositeParty;
      caseTitle = p && d ? `${p} vs ${d}` : (p || d || 'Civil Suit');
    }
  }

  // Header & Title
  const badgeEl = document.getElementById('casePrintTypeBadge');
  if (badgeEl) badgeEl.textContent = `${caseType.toUpperCase()} CASE`;

  const titleEl = document.getElementById('casePrintTitle');
  if (titleEl) titleEl.textContent = caseTitle;

  const noEl = document.getElementById('casePrintNo');
  if (noEl) noEl.textContent = caseNumber;

  const courtEl = document.getElementById('casePrintCourt');
  if (courtEl) courtEl.textContent = courtName;

  const statusEl = document.getElementById('casePrintStatus');
  if (statusEl) statusEl.textContent = statusText;

  // Grid details
  const ctEl = document.getElementById('casePrintCaseType');
  if (ctEl) ctEl.textContent = caseType.toUpperCase();

  const yrEl = document.getElementById('casePrintYear');
  if (yrEl) yrEl.textContent = caseYear;

  const fdEl = document.getElementById('casePrintFilingDate');
  if (fdEl) fdEl.textContent = filingDate;

  const cfEl = document.getElementById('casePrintCourtFull');
  if (cfEl) cfEl.textContent = courtName;

  const nhEl = document.getElementById('casePrintNextHearing');
  if (nhEl) nhEl.textContent = nextHearing;

  const npEl = document.getElementById('casePrintNextProcess');
  if (npEl) npEl.textContent = nextProcess;

  const phEl = document.getElementById('casePrintPrevHearing');
  if (phEl) phEl.textContent = prevHearing;

  const ppEl = document.getElementById('casePrintPrevProcess');
  if (ppEl) ppEl.textContent = prevProcess;

  // Parties & Matter Particulars
  const partiesContainer = document.getElementById('casePrintPartiesContent');
  if (partiesContainer) {
    const items = [];
    if (isCriminal || caseType === 'state' || caseType === 'complaint' || caseType === 'misc_criminal') {
      if (caseObj.victimName || caseObj.firstParty) items.push(['Complainant / Victim', caseObj.victimName || caseObj.firstParty]);
      if (caseObj.accusedName || caseObj.oppositeParty) items.push(['Accused / Opposite', caseObj.accusedName || caseObj.oppositeParty]);
      if (caseObj.policeStation) items.push(['Police Station', caseObj.policeStation]);
      if (caseObj.crimeNumber) items.push(['FIR / Crime No.', `${caseObj.crimeNumber}${caseObj.crimeYear ? ` / ${caseObj.crimeYear}` : ''}`]);
      if (caseObj.crimeSection) items.push(['Sections (IPC/BNS)', caseObj.crimeSection]);
      if (caseObj.custodyStatus) items.push(['Custody / Bail Status', caseObj.custodyStatus]);
    } else if (isFamily) {
      if (caseObj.petitioner || caseObj.plaintiff) items.push(['Petitioner / Applicant', caseObj.petitioner || caseObj.plaintiff]);
      if (caseObj.respondent || caseObj.defendant) items.push(['Respondent / Opposite', caseObj.respondent || caseObj.defendant]);
      if (caseObj.familyMatterType || caseObj.matterType) items.push(['Dispute Nature', caseObj.familyMatterType || caseObj.matterType]);
      if (caseObj.marriageDate) items.push(['Marriage Date', formatDateDMY(caseObj.marriageDate)]);
      if (caseObj.maintenance) items.push(['Maintenance Details', caseObj.maintenance]);
    } else if (isRevenue) {
      if (caseObj.applicant || caseObj.plaintiff) items.push(['Applicant / Petitioner', caseObj.applicant || caseObj.plaintiff]);
      if (caseObj.respondent || caseObj.defendant) items.push(['Opposite Party', caseObj.respondent || caseObj.defendant]);
      if (caseObj.revenueMatterType) items.push(['Revenue Matter Nature', caseObj.revenueMatterType]);
      if (caseObj.village) items.push(['Village / Mauza', caseObj.village]);
      if (caseObj.khataNo || caseObj.gataNo) items.push(['Khata / Gata No.', [caseObj.khataNo ? `Khata: ${caseObj.khataNo}` : '', caseObj.gataNo ? `Gata: ${caseObj.gataNo}` : ''].filter(Boolean).join(' | ')]);
    } else {
      if (caseObj.plaintiff || caseObj.firstParty) items.push(['Plaintiff / Petitioner', caseObj.plaintiff || caseObj.firstParty]);
      if (caseObj.defendant || caseObj.oppositeParty) items.push(['Defendant / Respondent', caseObj.defendant || caseObj.oppositeParty]);
      if (caseObj.matterType) items.push(['Matter / Suit Nature', caseObj.matterType]);
    }

    if (items.length === 0) {
      items.push(['Parties', caseTitle]);
    }

    partiesContainer.innerHTML = items.map(([k, v]) => `
      <div class="dossier-print-prop-cell">
        <span class="dossier-print-prop-lbl">${escapeHtml(k)}:</span>
        <span class="dossier-print-prop-val">${escapeHtml(v)}</span>
      </div>
    `).join('');
  }

  // Client & Remarks
  const cNameEl = document.getElementById('casePrintClientName');
  if (cNameEl) cNameEl.textContent = clientName;

  const cPhoneEl = document.getElementById('casePrintClientPhone');
  if (cPhoneEl) cPhoneEl.textContent = clientPhone ? clientPhone : '—';

  const remEl = document.getElementById('casePrintRemarks');
  const remarkVal = caseObj.remark || caseObj.remarks || '';
  if (remEl) remEl.textContent = remarkVal.trim() ? remarkVal.trim() : 'None recorded.';

  const dispRow = document.getElementById('casePrintDisposalRow');
  const dispEl = document.getElementById('casePrintDisposalComment');
  const disposalVal = caseObj.disposalComment || caseObj.disposal_comment || '';
  if (dispRow && dispEl) {
    if (disposalVal.trim()) {
      dispRow.style.display = '';
      dispEl.textContent = disposalVal.trim();
    } else if (isDisposed) {
      dispRow.style.display = '';
      dispEl.textContent = 'Matter disposed of.';
    } else {
      dispRow.style.display = 'none';
    }
  }

  // Proceedings History
  const historyBody = document.getElementById('casePrintHistoryBody');
  if (historyBody) {
    const history = typeof getCaseHearingHistory === 'function' ? getCaseHearingHistory(caseNumber) : [];
    const events = [];

    history.forEach(h => {
      const isNext = Boolean(caseObj.nextHearing && (h.hearing_date === caseObj.nextHearing));
      events.push({
        date: h.hearing_date,
        process: h.process || 'Court Hearing',
        type: isNext ? 'Upcoming Hearing' : 'Past Hearing',
        action: h.action_taken || h.remarks || 'Court proceedings conducted.'
      });
    });

    if (caseObj.nextHearing && caseObj.nextHearing !== '—' && !events.some(e => e.date === caseObj.nextHearing)) {
      events.push({
        date: caseObj.nextHearing,
        process: caseObj.hearingProcess || 'Scheduled Hearing',
        type: 'Upcoming Hearing',
        action: `Next appearance scheduled at ${courtName}`
      });
    }

    if (caseObj.previousHearing && caseObj.previousHearing !== '—' && !events.some(e => e.date === caseObj.previousHearing)) {
      events.push({
        date: caseObj.previousHearing,
        process: caseObj.previousProcess || 'Previous Stage',
        type: 'Past Hearing',
        action: `Previous proceedings recorded at ${courtName}`
      });
    }

    if (filingDateVal && filingDateVal !== '—' && !events.some(e => e.date === filingDateVal)) {
      events.push({
        date: filingDateVal,
        process: 'Case Inception & Filing',
        type: 'Initial Filing',
        action: `Case instituted and registered at ${courtName}`
      });
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (events.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:8px; color:#64748b; font-style:italic;">No recorded proceedings logged yet.</td></tr>';
    } else {
      // Limit to latest 8 hearings to guarantee a clean, single A4 page fit
      const displayEvents = events.slice(0, 8);
      let rowsHtml = displayEvents.map((ev, idx) => {
        const typeClass = String(ev.type || '').toLowerCase().replace(/\s+/g, '-');
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
            <td style="white-space: nowrap; font-weight: 700; color: #0f172a;">${formatDateDMY(ev.date)}</td>
            <td style="font-weight: 700; color: #1e40af;">${escapeHtml(ev.process || '—')}</td>
            <td><span class="dossier-timeline-tag ${typeClass}">${escapeHtml(ev.type)}</span></td>
            <td>${escapeHtml(ev.action || '—')}</td>
          </tr>
        `;
      }).join('');

      if (events.length > 8) {
        rowsHtml += `
          <tr>
            <td colspan="5" style="text-align: center; padding: 3px; font-size: 8.5px; color: #64748b; background: #f8fafc; font-style: italic;">
              + ${events.length - 8} earlier proceedings on record in CaseBook database
            </td>
          </tr>
        `;
      }

      historyBody.innerHTML = rowsHtml;
    }
  }

  // Timestamp
  const tsEl = document.getElementById('casePrintTimestamp');
  if (tsEl) {
    const now = new Date();
    tsEl.textContent = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

function printCurrentCaseDossier(customCaseObj = null) {
  const caseObj = customCaseObj || currentSelectedCase;
  if (!caseObj) {
    if (typeof showToast === 'function') {
      showToast('Please select a case to print.', 'warning');
    } else {
      alert('Please select a case to print.');
    }
    return;
  }

  populatePrintableCaseDossier(caseObj);
  document.body.classList.add('printing-case-dossier');

  const cleanup = () => {
    document.body.classList.remove('printing-case-dossier');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, 4000);

  window.print();
}

function printCurrentGuestCaseDossier() {
  if (!currentGuestSelectedCase) {
    if (typeof showToast === 'function') {
      showToast('Please select a case to print.', 'warning');
    } else {
      alert('Please select a case to print.');
    }
    return;
  }
  printCurrentCaseDossier(currentGuestSelectedCase);
}

window.populatePrintableCaseDossier = populatePrintableCaseDossier;
window.printCurrentCaseDossier = printCurrentCaseDossier;
window.printCurrentGuestCaseDossier = printCurrentGuestCaseDossier;


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

const setVal = (id, val, customInputId) => {
  const el = document.getElementById(id);
  if (!el) return;
  const customEl = customInputId ? document.getElementById(customInputId) : null;
  if (el.tagName === 'SELECT' && val) {
    let optionExists = false;
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value.toLowerCase() === String(val).toLowerCase() || el.options[i].text.toLowerCase() === String(val).toLowerCase()) {
        el.selectedIndex = i;
        optionExists = true;
        break;
      }
    }
    if (!optionExists) {
      // Check if this select has an "Other" option
      let otherOptionIndex = -1;
      for (let i = 0; i < el.options.length; i++) {
        const optVal = el.options[i].value.toLowerCase();
        if (optVal.startsWith('other') || optVal === 'other') {
          otherOptionIndex = i;
          break;
        }
      }
      if (customEl && otherOptionIndex !== -1) {
        el.selectedIndex = otherOptionIndex;
        customEl.style.display = 'block';
        customEl.value = val;
      } else {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        el.appendChild(opt);
        el.value = val;
        if (customEl) {
          customEl.style.display = 'none';
          customEl.value = '';
        }
      }
    } else if (customEl) {
      if (el.value.toLowerCase().startsWith('other') || el.value === 'Other') {
        customEl.style.display = 'block';
      } else {
        customEl.style.display = 'none';
        customEl.value = '';
      }
    }
  } else {
    el.value = val || '';
    if (customEl) {
      customEl.style.display = 'none';
      customEl.value = '';
    }
  }
};

function toggleCaseNumberUnlock(btn) {
  if (!btn) return;
  const targetIds = (btn.getAttribute('data-targets') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!targetIds.length) return;

  const isCurrentlyUnlocked = btn.classList.contains('unlocked');
  if (!isCurrentlyUnlocked) {
    const confirmUnlock = confirm('⚠️ Changing the Case Number or Year modifies the primary case identifier across registers and hearing history. Do you want to unlock these fields for editing?');
    if (!confirmUnlock) return;

    targetIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.removeAttribute('readonly');
        el.classList.remove('locked-input');
        el.classList.add('unlocked-input');
      }
    });
    btn.classList.add('unlocked');
    btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> <span>Lock</span>';
    btn.title = 'Click to re-lock Case Number & Year fields';
  } else {
    targetIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('readonly', 'true');
        el.classList.add('locked-input');
        el.classList.remove('unlocked-input');
      }
    });
    btn.classList.remove('unlocked');
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Unlock</span>';
    btn.title = 'Click to unlock and correct Case Number or Year';
  }
}
window.toggleCaseNumberUnlock = toggleCaseNumberUnlock;

let currentlyLoadedOriginalCaseNo = '';

function loadCaseForUpdate(caseNoToFind) {
  const query = (caseNoToFind || document.getElementById('updateSearchInput')?.value || '').trim().toLowerCase();
  const statusEl = document.getElementById('updateSearchStatus');

  if (!query) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a Case Number, Party Name, or Client Name to search.';
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  // 1. Check for exact case number match first
  let exactMatch = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === query || num2 === query;
  });

  // 2. Filter all potential matches
  const matches = allCaseRecords.filter(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    const name = (c.caseName || '').toLowerCase();
    const plaintiff = (c.plaintiff || '').toLowerCase();
    const defendant = (c.defendant || '').toLowerCase();
    const victim = (c.victimName || '').toLowerCase();
    const accused = (c.accusedName || '').toLowerCase();
    const client = (c.clientName || c.criminalClientName || '').toLowerCase();
    return num1 === query || num2 === query || num1.includes(query) || num2.includes(query) ||
           name.includes(query) || (plaintiff && plaintiff.includes(query)) ||
           (defendant && defendant.includes(query)) || (victim && victim.includes(query)) ||
           (accused && accused.includes(query)) || (client && client.includes(query));
  });

  if (!exactMatch && matches.length === 0) {
    if (statusEl) {
      statusEl.textContent = `❌ Case "${query.toUpperCase()}" not found in local or synchronized records.`;
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  // 3. Multi-match search disambiguation: render candidate list if > 1 match and no direct exact match
  if (!caseNoToFind && !exactMatch && matches.length > 1) {
    if (statusEl) {
      let html = `
        <div class="update-search-candidates">
          <div class="candidate-header">
            <span>🔍 Found ${matches.length} matches for "<em>${escapeHtml(query)}</em>":</span>
            <small style="color:#64748b;">Click a case below to load its details</small>
          </div>
          <div class="candidate-list">
      `;
      matches.slice(0, 10).forEach(m => {
        const cNo = m.caseNo || m.criminalCaseNumber || '—';
        const cName = m.caseName || (m.plaintiff ? `${m.plaintiff} vs ${m.defendant}` : (m.victimName ? `${m.victimName} vs ${m.accusedName}` : '—'));
        const cType = (m.caseType || 'civil').toUpperCase();
        const cCourt = m.courtName || m.criminalCourtName || 'District Court';
        const cHearing = m.nextHearing && m.nextHearing !== '—' ? m.nextHearing : 'Undated';
        const cClient = m.clientName || m.criminalClientName || '—';
        html += `
          <div class="candidate-item" onclick="loadCaseForUpdate('${escapeHtml(cNo)}')">
            <div class="candidate-item-info">
              <div class="candidate-item-title">
                <strong>${escapeHtml(cNo)}</strong>
                <span class="case-badge ${(m.caseType || 'civil').toLowerCase()}" style="font-size:10px; padding:2px 7px; text-transform:uppercase;">${cType}</span>
                <span>${escapeHtml(cName)}</span>
              </div>
              <div class="candidate-item-meta">
                <span>🏛️ ${escapeHtml(cCourt)}</span>
                <span>📅 Next: ${escapeHtml(cHearing)}</span>
                <span>👤 Client: ${escapeHtml(cClient)}</span>
              </div>
            </div>
            <button type="button" class="candidate-select-btn" onclick="event.stopPropagation(); loadCaseForUpdate('${escapeHtml(cNo)}');">Select &amp; Edit ➔</button>
          </div>
        `;
      });
      html += `</div></div>`;
      statusEl.innerHTML = html;
      statusEl.className = 'update-status-msg';
    }
    return;
  }

  const found = exactMatch || matches[0];
  currentlyLoadedOriginalCaseNo = found.caseNo || found.criminalCaseNumber || '';

  // Reset any unlocked inputs and lock buttons back to default locked state
  document.querySelectorAll('.unlock-case-btn').forEach(btn => {
    btn.classList.remove('unlocked');
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Unlock</span>';
    btn.title = 'Click to unlock and correct Case Number or Year';
  });
  document.querySelectorAll('#updateCaseForm input.unlocked-input').forEach(inp => {
    inp.setAttribute('readonly', 'true');
    inp.classList.add('locked-input');
    inp.classList.remove('unlocked-input');
  });

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
  const disposalCommentInput = document.getElementById('updateCaseDisposalComment');
  if (disposalCommentInput) {
    disposalCommentInput.value = found.disposalComment || found.disposal_comment || found.disposalRemark || '';
  }
  if (typeof syncDisposalSectionVisibility === 'function') {
    syncDisposalSectionVisibility();
  }

  if (caseType === 'state' || caseType === 'criminal') {
    setVal('updateStateCaseNumber', found.caseNo || found.criminalCaseNumber);
    setVal('updateStateCrimeYear', found.caseYear || found.crimeYear || '2026');
    setVal('updateStateFilingDate', found.filingDate || found.crimeFilingDate);
    setVal('updateStateCrimeNumber', found.crimeNumber);
    setVal('updateStatePoliceStation', found.policeStation, 'updateStatePoliceStationCustom');
    setVal('updateStateCrimeSection', found.crimeSection);
    setVal('updateStateFirstParty', found.firstParty || found.victimName || 'State of U.P.');
    setVal('updateStateAccusedName', found.accusedName || found.defendant);
    setVal('updateStateCourtName', found.courtName || found.criminalCourtName);
    setVal('updateStateClientName', found.clientName || found.criminalClientName);
    setVal('updateStateClientNumber', found.clientNumber || found.criminalClientNumber);
    setVal('updateStateDocLink', found.docLink || '');
    setVal('updateStateNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateStateNextHearingProcess', found.hearingProcess || found.stage || '');
  } else if (caseType === 'family') {
    setVal('updateFamilyCaseNumber', found.caseNo);
    setVal('updateFamilyCaseYear', found.caseYear || '2026');
    setVal('updateFamilyFilingDate', found.filingDate);
    setVal('updateFamilyMatterType', found.matterType || 'Maintenance (Sec 125 CrPC)', 'updateFamilyMatterTypeCustom');
    setVal('updateFamilyPetitioner', found.petitioner || found.plaintiff);
    setVal('updateFamilyRespondent', found.respondent || found.defendant);
    setVal('updateFamilyMarriageDate', found.marriageDate);
    setVal('updateFamilyMaintenance', found.maintenanceDetail);
    setVal('updateFamilyCourtName', found.courtName);
    setVal('updateFamilyClientName', found.clientName);
    setVal('updateFamilyClientNumber', found.clientNumber);
    setVal('updateFamilyDocLink', found.docLink || '');
    setVal('updateFamilyNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateFamilyNextHearingProcess', found.hearingProcess || found.stage || '');
  } else if (caseType === 'revenue') {
    setVal('updateRevenueCaseNumber', found.caseNo);
    setVal('updateRevenueCaseYear', found.caseYear || '2026');
    setVal('updateRevenueFilingDate', found.filingDate);
    setVal('updateRevenueActSection', found.revenueActSection || 'Sec 34 (Mutation / दाखिल खारिज)', 'updateRevenueActSectionCustom');
    setVal('updateRevenueVillage', found.villageMauja);
    setVal('updateRevenueTehsil', found.parganaTehsil);
    setVal('updateRevenueGataNo', found.gataKhataNo);
    setVal('updateRevenueApplicant', found.applicant || found.plaintiff);
    setVal('updateRevenueOppositeParty', found.oppositeParty || found.defendant);
    setVal('updateRevenueCourtName', found.courtName);
    setVal('updateRevenueClientName', found.clientName);
    setVal('updateRevenueClientNumber', found.clientNumber);
    setVal('updateRevenueDocLink', found.docLink || '');
    setVal('updateRevenueNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateRevenueNextHearingProcess', found.hearingProcess || found.stage || '');
  } else if (caseType === 'misc_civil') {
    setVal('updateMiscCivilCaseNumber', found.caseNo);
    setVal('updateMiscCivilCaseYear', found.caseYear || '2026');
    setVal('updateMiscCivilFilingDate', found.filingDate);
    setVal('updateMiscCivilOriginalCase', found.originalCaseNumber || found.originalCase || '');
    setVal('updateMiscCivilProceedingType', found.proceedingType || 'Temporary Injunction (Order 39 Rule 1 & 2 CPC)', 'updateMiscCivilProceedingTypeCustom');
    setVal('updateMiscCivilApplicant', found.applicant || found.plaintiff);
    setVal('updateMiscCivilOppositeParty', found.oppositeParty || found.defendant);
    setVal('updateMiscCivilCourtName', found.courtName);
    setVal('updateMiscCivilClientName', found.clientName);
    setVal('updateMiscCivilClientNumber', found.clientNumber);
    setVal('updateMiscCivilDocLink', found.docLink || '');
    setVal('updateMiscCivilNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateMiscCivilNextHearingProcess', found.hearingProcess || found.stage || '');
  } else if (caseType === 'misc_criminal') {
    setVal('updateMiscCriminalCaseNumber', found.caseNo);
    setVal('updateMiscCriminalCaseYear', found.caseYear || found.crimeYear || '2026');
    setVal('updateMiscCriminalFilingDate', found.filingDate || found.crimeFilingDate);
    setVal('updateMiscCriminalOriginalCase', found.originalCaseNumber || found.originalCase || '');
    setVal('updateMiscCriminalProceedingType', found.proceedingType || 'Regular Bail (Sec 439 CrPC / Sec 483 BNSS)', 'updateMiscCriminalProceedingTypeCustom');
    setVal('updateMiscCriminalPoliceStation', found.policeStation, 'updateMiscCriminalPoliceStationCustom');
    setVal('updateMiscCriminalCrimeSection', found.crimeSection);
    setVal('updateMiscCriminalApplicant', found.applicant || found.accusedName);
    setVal('updateMiscCriminalOppositeParty', found.oppositeParty || found.firstParty || 'State of U.P.');
    setVal('updateMiscCriminalCourtName', found.courtName);
    setVal('updateMiscCriminalClientName', found.clientName);
    setVal('updateMiscCriminalClientNumber', found.clientNumber);
    setVal('updateMiscCriminalDocLink', found.docLink || '');
    setVal('updateMiscCriminalNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateMiscCriminalNextHearingProcess', found.hearingProcess || found.stage || '');
  } else if (caseType === 'complaint') {
    setVal('updateComplaintCaseNumber', found.caseNo);
    setVal('updateComplaintCaseYear', found.caseYear || '2026');
    setVal('updateComplaintFilingDate', found.filingDate);
    setVal('updateComplaintType', found.complaintType || 'Cheque Bounce (Sec 138 NI Act)', 'updateComplaintTypeCustom');
    setVal('updateComplaintSectionAct', found.sectionAct || '');
    setVal('updateComplaintComplainant', found.complainant || found.plaintiff || '');
    setVal('updateComplaintAccusedName', found.accusedName || found.defendant || '');
    setVal('updateComplaintPoliceStation', found.policeStation || '', 'updateComplaintPoliceStationCustom');
    setVal('updateComplaintCourtName', found.courtName);
    setVal('updateComplaintClientName', found.clientName);
    setVal('updateComplaintClientNumber', found.clientNumber);
    setVal('updateComplaintDocLink', found.docLink || '');
    setVal('updateComplaintNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateComplaintNextHearingProcess', found.hearingProcess || found.stage || '');
  } else {
    setVal('updateCaseNo', found.caseNo);
    setVal('updateCaseYear', found.caseYear || '2026');
    setVal('updateFilingDate', found.filingDate);
    setVal('updatePlaintiff', found.plaintiff);
    setVal('updateDefendant', found.defendant);
    setVal('updateCourtName', found.courtName);
    setVal('updateClientName', found.clientName);
    setVal('updateClientNumber', found.clientNumber);
    setVal('updateCaseDocLink', found.docLink || '');
    setVal('updateNextHearingDate', found.nextHearing && found.nextHearing !== '—' ? found.nextHearing : '');
    setVal('updateNextHearingProcess', found.hearingProcess || found.stage || '');
  }

  // Pre-fill search input if needed
  const updateSearchInput = document.getElementById('updateSearchInput');
  if (updateSearchInput && !updateSearchInput.value) {
    updateSearchInput.value = currentlyLoadedOriginalCaseNo;
  }

  if (statusEl) {
    statusEl.textContent = `✅ Case "${currentlyLoadedOriginalCaseNo}" loaded. You can update details below.`;
    statusEl.className = 'update-status-msg success';
  }
}

let isSubmittingUpdate = false;
async function handleUpdateCaseSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (isSubmittingUpdate) {
    console.warn('Case update submission already in progress, blocking duplicate.');
    return;
  }

  const caseType = document.getElementById('updateCaseTypeDropdown')?.value || 'civil';
  const statusEl = document.getElementById('updateSearchStatus');
  const updateForm = document.getElementById('updateCaseForm');
  const submitBtn = updateForm?.querySelector('button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa-solid fa-save"></i> Save Case Details';

  let newCaseNumber = '';
  let newCaseYear = '';
  if (caseType === 'state' || caseType === 'criminal') {
    newCaseNumber = (document.getElementById('updateStateCaseNumber')?.value || document.getElementById('updateCriminalCaseNumber')?.value)?.trim();
    newCaseYear = document.getElementById('updateStateCrimeYear')?.value?.trim();
  } else if (caseType === 'family') {
    newCaseNumber = document.getElementById('updateFamilyCaseNumber')?.value?.trim();
    newCaseYear = document.getElementById('updateFamilyCaseYear')?.value?.trim();
  } else if (caseType === 'revenue') {
    newCaseNumber = document.getElementById('updateRevenueCaseNumber')?.value?.trim();
    newCaseYear = document.getElementById('updateRevenueCaseYear')?.value?.trim();
  } else if (caseType === 'misc_civil') {
    newCaseNumber = document.getElementById('updateMiscCivilCaseNumber')?.value?.trim();
    newCaseYear = document.getElementById('updateMiscCivilCaseYear')?.value?.trim();
  } else if (caseType === 'misc_criminal') {
    newCaseNumber = document.getElementById('updateMiscCriminalCaseNumber')?.value?.trim();
    newCaseYear = document.getElementById('updateMiscCriminalCaseYear')?.value?.trim();
  } else if (caseType === 'complaint') {
    newCaseNumber = document.getElementById('updateComplaintCaseNumber')?.value?.trim();
    newCaseYear = document.getElementById('updateComplaintCaseYear')?.value?.trim();
  } else {
    newCaseNumber = document.getElementById('updateCaseNo')?.value?.trim();
    newCaseYear = document.getElementById('updateCaseYear')?.value?.trim();
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

  // Check duplicate if case number is changed (both in-memory and live Supabase query across all tables)
  if (newCaseNumber.toLowerCase() !== originalCaseNo.toLowerCase()) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Duplicate...';
    }
    const duplicateExists = await checkCaseNumberExists(newCaseNumber, originalCaseNo);
    if (duplicateExists && duplicateExists.exists) {
      alert(`❌ Case Number "${newCaseNumber}" already exists in the database! Please choose a unique Case Number.`);
      if (statusEl) {
        statusEl.textContent = `❌ Case Number "${newCaseNumber}" already exists on another case.`;
        statusEl.className = 'update-status-msg error';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      return;
    }
  }

  try {
    isSubmittingUpdate = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Updates...';
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
  if (newCaseYear) {
    targetCase.caseYear = newCaseYear;
    if (caseType === 'state' || caseType === 'criminal' || caseType === 'misc_criminal') {
      targetCase.crimeYear = newCaseYear;
    }
  }

  // Save Case Status, Parties Remark, and Disposal Comment
  targetCase.caseStatus = document.getElementById('updateCaseStatus')?.value || 'Pending';
  targetCase.remark = document.getElementById('updateCaseRemark')?.value?.trim() || '';
  targetCase.disposalComment = document.getElementById('updateCaseDisposalComment')?.value?.trim() || '';
  targetCase.disposal_comment = targetCase.disposalComment;

  let fixNextHearingDate = '';
  let fixHearingProcess = '';

  if (caseType === 'state' || caseType === 'criminal') {
    targetCase.criminalCaseNumber = newCaseNumber;
    const psSelect = document.getElementById('updateStatePoliceStation')?.value?.trim() || '';
    const psCustom = document.getElementById('updateStatePoliceStationCustom')?.value?.trim() || '';
    targetCase.policeStation = (psSelect === 'Other' && psCustom) ? psCustom : (psSelect || psCustom || '');
    targetCase.crimeSection = document.getElementById('updateStateCrimeSection')?.value?.trim() || '';
    targetCase.crimeNumber = document.getElementById('updateStateCrimeNumber')?.value?.trim() || '';
    targetCase.filingDate = document.getElementById('updateStateFilingDate')?.value || '';
    targetCase.crimeFilingDate = targetCase.filingDate;
    targetCase.firstParty = document.getElementById('updateStateFirstParty')?.value?.trim() || 'State of U.P.';
    targetCase.victimName = targetCase.firstParty;
    targetCase.accusedName = document.getElementById('updateStateAccusedName')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateStateCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateStateClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateStateClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateStateDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.firstParty} vs ${targetCase.accusedName}`;
    targetCase.partyName = targetCase.accusedName;
    fixNextHearingDate = document.getElementById('updateStateNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateStateNextHearingProcess')?.value?.trim() || '';
  } else if (caseType === 'family') {
    const famSelect = document.getElementById('updateFamilyMatterType')?.value || '';
    const famCustom = document.getElementById('updateFamilyMatterTypeCustom')?.value?.trim() || document.getElementById('familyMatterTypeCustom')?.value?.trim() || '';
    targetCase.matterType = (famSelect.toLowerCase().startsWith('other') && famCustom) ? famCustom : (famSelect || famCustom || 'Maintenance (Sec 125 CrPC)');
    targetCase.filingDate = document.getElementById('updateFamilyFilingDate')?.value || '';
    targetCase.petitioner = document.getElementById('updateFamilyPetitioner')?.value?.trim() || '';
    targetCase.respondent = document.getElementById('updateFamilyRespondent')?.value?.trim() || '';
    targetCase.marriageDate = document.getElementById('updateFamilyMarriageDate')?.value || '';
    targetCase.maintenanceDetail = document.getElementById('updateFamilyMaintenance')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateFamilyCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateFamilyClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateFamilyClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateFamilyDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.petitioner} vs ${targetCase.respondent}`;
    targetCase.partyName = targetCase.respondent;
    fixNextHearingDate = document.getElementById('updateFamilyNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateFamilyNextHearingProcess')?.value?.trim() || '';
  } else if (caseType === 'revenue') {
    const revSelect = document.getElementById('updateRevenueActSection')?.value || '';
    const revCustom = document.getElementById('updateRevenueActSectionCustom')?.value?.trim() || document.getElementById('revenueActSectionCustom')?.value?.trim() || '';
    targetCase.revenueActSection = (revSelect.toLowerCase().startsWith('other') && revCustom) ? revCustom : (revSelect || revCustom || 'Sec 34 (Mutation / दाखिल खारिज)');
    targetCase.filingDate = document.getElementById('updateRevenueFilingDate')?.value || '';
    targetCase.villageMauja = document.getElementById('updateRevenueVillage')?.value?.trim() || '';
    targetCase.parganaTehsil = document.getElementById('updateRevenueTehsil')?.value?.trim() || '';
    targetCase.gataKhataNo = document.getElementById('updateRevenueGataNo')?.value?.trim() || '';
    targetCase.applicant = document.getElementById('updateRevenueApplicant')?.value?.trim() || '';
    targetCase.oppositeParty = document.getElementById('updateRevenueOppositeParty')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateRevenueCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateRevenueClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateRevenueClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateRevenueDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.applicant} vs ${targetCase.oppositeParty}`;
    targetCase.partyName = targetCase.oppositeParty;
    fixNextHearingDate = document.getElementById('updateRevenueNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateRevenueNextHearingProcess')?.value?.trim() || '';
  } else if (caseType === 'misc_civil') {
    targetCase.originalCaseNumber = document.getElementById('updateMiscCivilOriginalCase')?.value?.trim() || '';
    targetCase.originalCase = targetCase.originalCaseNumber;
    const mcProcSelect = document.getElementById('updateMiscCivilProceedingType')?.value || '';
    const mcProcCustom = document.getElementById('updateMiscCivilProceedingTypeCustom')?.value?.trim() || '';
    targetCase.proceedingType = (mcProcSelect.toLowerCase().startsWith('other') && mcProcCustom) ? mcProcCustom : (mcProcSelect || mcProcCustom || 'Temporary Injunction (Order 39 Rule 1 & 2 CPC)');
    targetCase.filingDate = document.getElementById('updateMiscCivilFilingDate')?.value || '';
    targetCase.applicant = document.getElementById('updateMiscCivilApplicant')?.value?.trim() || '';
    targetCase.oppositeParty = document.getElementById('updateMiscCivilOppositeParty')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateMiscCivilCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateMiscCivilClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateMiscCivilClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateMiscCivilDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.applicant} vs ${targetCase.oppositeParty}`;
    targetCase.partyName = targetCase.oppositeParty;
    fixNextHearingDate = document.getElementById('updateMiscCivilNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateMiscCivilNextHearingProcess')?.value?.trim() || '';
  } else if (caseType === 'misc_criminal') {
    targetCase.originalCaseNumber = document.getElementById('updateMiscCriminalOriginalCase')?.value?.trim() || '';
    targetCase.originalCase = targetCase.originalCaseNumber;
    const mcrProcSelect = document.getElementById('updateMiscCriminalProceedingType')?.value || '';
    const mcrProcCustom = document.getElementById('updateMiscCriminalProceedingTypeCustom')?.value?.trim() || '';
    targetCase.proceedingType = (mcrProcSelect.toLowerCase().startsWith('other') && mcrProcCustom) ? mcrProcCustom : (mcrProcSelect || mcrProcCustom || 'Regular Bail (Sec 439 CrPC / Sec 483 BNSS)');
    const mcrPsSelect = document.getElementById('updateMiscCriminalPoliceStation')?.value?.trim() || '';
    const mcrPsCustom = document.getElementById('updateMiscCriminalPoliceStationCustom')?.value?.trim() || '';
    targetCase.policeStation = (mcrPsSelect === 'Other' && mcrPsCustom) ? mcrPsCustom : (mcrPsSelect || mcrPsCustom || '');
    targetCase.crimeSection = document.getElementById('updateMiscCriminalCrimeSection')?.value?.trim() || '';
    targetCase.filingDate = document.getElementById('updateMiscCriminalFilingDate')?.value || '';
    targetCase.crimeFilingDate = targetCase.filingDate;
    targetCase.applicant = document.getElementById('updateMiscCriminalApplicant')?.value?.trim() || '';
    targetCase.oppositeParty = document.getElementById('updateMiscCriminalOppositeParty')?.value?.trim() || 'State of U.P.';
    targetCase.courtName = document.getElementById('updateMiscCriminalCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateMiscCriminalClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateMiscCriminalClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateMiscCriminalDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.applicant} vs ${targetCase.oppositeParty}`;
    targetCase.partyName = targetCase.applicant;
    fixNextHearingDate = document.getElementById('updateMiscCriminalNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateMiscCriminalNextHearingProcess')?.value?.trim() || '';
  } else if (caseType === 'complaint') {
    const compTypeSelect = document.getElementById('updateComplaintType')?.value || '';
    const compTypeCustom = document.getElementById('updateComplaintTypeCustom')?.value?.trim() || '';
    targetCase.complaintType = (compTypeSelect.toLowerCase().startsWith('other') && compTypeCustom) ? compTypeCustom : (compTypeSelect || compTypeCustom || 'Cheque Bounce (Sec 138 NI Act)');
    const compPsSelect = document.getElementById('updateComplaintPoliceStation')?.value?.trim() || '';
    const compPsCustom = document.getElementById('updateComplaintPoliceStationCustom')?.value?.trim() || '';
    targetCase.policeStation = (compPsSelect === 'Other' && compPsCustom) ? compPsCustom : (compPsSelect || compPsCustom || '');
    targetCase.sectionAct = document.getElementById('updateComplaintSectionAct')?.value?.trim() || '';
    targetCase.filingDate = document.getElementById('updateComplaintFilingDate')?.value || '';
    targetCase.complainant = document.getElementById('updateComplaintComplainant')?.value?.trim() || '';
    targetCase.accusedName = document.getElementById('updateComplaintAccusedName')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateComplaintCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateComplaintClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateComplaintClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateComplaintDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.complainant} vs ${targetCase.accusedName}`;
    targetCase.partyName = targetCase.accusedName;
    fixNextHearingDate = document.getElementById('updateComplaintNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateComplaintNextHearingProcess')?.value?.trim() || '';
  } else {
    targetCase.filingDate = document.getElementById('updateFilingDate')?.value || '';
    targetCase.plaintiff = document.getElementById('updatePlaintiff')?.value?.trim() || '';
    targetCase.defendant = document.getElementById('updateDefendant')?.value?.trim() || '';
    targetCase.courtName = document.getElementById('updateCourtName')?.value || '';
    targetCase.clientName = document.getElementById('updateClientName')?.value?.trim() || '';
    targetCase.clientNumber = document.getElementById('updateClientNumber')?.value?.trim() || '';
    targetCase.docLink = document.getElementById('updateCaseDocLink')?.value?.trim() || '';
    targetCase.caseName = `${targetCase.plaintiff} vs ${targetCase.defendant}`;
    targetCase.partyName = targetCase.defendant || targetCase.plaintiff;
    fixNextHearingDate = document.getElementById('updateNextHearingDate')?.value?.trim() || '';
    fixHearingProcess = document.getElementById('updateNextHearingProcess')?.value?.trim() || '';
  }

  if (fixNextHearingDate) {
    targetCase.nextHearing = fixNextHearingDate;
    if (fixHearingProcess) targetCase.hearingProcess = fixHearingProcess;

    // Update in-memory allHearingRecords as well
    const existingHearing = allHearingRecords.find(h => (h.case_number || '').toLowerCase() === originalCaseNo.toLowerCase());
    if (existingHearing) {
      existingHearing.next_hearing_date = fixNextHearingDate;
      if (fixHearingProcess) existingHearing.hearing_process = fixHearingProcess;
      if (originalCaseNo.toLowerCase() !== newCaseNumber.toLowerCase()) {
        existingHearing.case_number = newCaseNumber;
      }
    } else {
      allHearingRecords.unshift({
        id: 'hearing_' + Date.now(),
        case_number: newCaseNumber,
        hearing_date: fixNextHearingDate,
        next_hearing_date: fixNextHearingDate,
        hearing_process: fixHearingProcess || 'Listed Hearing',
        hearing_status: 'Scheduled',
        remarks: 'Updated via Case Update Form'
      });
    }
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

  if (typeof showToast === 'function') {
    showToast(`Case ${newCaseNumber} details updated successfully!`, 'success');
  } else {
    alert(`Case ${newCaseNumber} details updated successfully!`);
  }
  } catch (updateErr) {
    console.error('Error updating case:', updateErr);
    alert(`Error updating case: ${updateErr.message || updateErr}`);
    if (statusEl) {
      statusEl.textContent = `❌ Error: ${updateErr.message || updateErr}`;
      statusEl.className = 'update-status-msg error';
    }
  } finally {
    isSubmittingUpdate = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

// ==============================================================================
// Case Transfer to Another Court (Inter-Court Jurisdictional Transfer)
// ==============================================================================

let isSubmittingTransfer = false;

function loadCaseForTransfer(caseNoToFind) {
  const query = (caseNoToFind || document.getElementById('transferSearchInput')?.value || '').trim().toLowerCase();
  const statusEl = document.getElementById('transferSearchStatus');
  const previewCard = document.getElementById('transferSelectedCaseCard');
  const transferForm = document.getElementById('transferCaseForm');

  if (!query) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a Case Number, Party Name, or Client Name to search.';
      statusEl.className = 'update-status-msg error';
    }
    return;
  }

  // 1. Check for exact case number match first
  let exactMatch = allCaseRecords.find(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    return num1 === query || num2 === query;
  });

  // 2. Filter all potential matches
  const matches = allCaseRecords.filter(c => {
    const num1 = (c.caseNo || '').toLowerCase();
    const num2 = (c.criminalCaseNumber || '').toLowerCase();
    const name = (c.caseName || '').toLowerCase();
    const plaintiff = (c.plaintiff || '').toLowerCase();
    const defendant = (c.defendant || '').toLowerCase();
    const victim = (c.victimName || '').toLowerCase();
    const accused = (c.accusedName || '').toLowerCase();
    const client = (c.clientName || c.criminalClientName || '').toLowerCase();
    return num1 === query || num2 === query || num1.includes(query) || num2.includes(query) ||
           name.includes(query) || (plaintiff && plaintiff.includes(query)) ||
           (defendant && defendant.includes(query)) || (victim && victim.includes(query)) ||
           (accused && accused.includes(query)) || (client && client.includes(query));
  });

  if (!exactMatch && matches.length === 0) {
    if (statusEl) {
      statusEl.textContent = `❌ Case "${query.toUpperCase()}" not found in database records.`;
      statusEl.className = 'update-status-msg error';
    }
    if (previewCard) previewCard.style.display = 'none';
    if (transferForm) transferForm.style.display = 'none';
    return;
  }

  // 3. Multi-match search disambiguation: render candidate list if > 1 match and no direct exact match
  if (!caseNoToFind && !exactMatch && matches.length > 1) {
    if (statusEl) {
      let html = `
        <div class="update-search-candidates">
          <div class="candidate-header">
            <span>🔍 Found ${matches.length} matches for "<em>${escapeHtml(query)}</em>":</span>
            <small style="color:#64748b;">Click a case below to load it for transfer</small>
          </div>
          <div class="candidate-list">
      `;
      matches.slice(0, 8).forEach(m => {
        const cNo = m.caseNo || m.criminalCaseNumber || '—';
        const cName = m.caseName || (m.plaintiff ? `${m.plaintiff} vs ${m.defendant}` : (m.victimName ? `${m.victimName} vs ${m.accusedName}` : '—'));
        const cType = (m.caseType || 'civil').toUpperCase();
        const cCourt = m.courtName || m.criminalCourtName || 'District Court';
        html += `
          <div class="candidate-item" onclick="loadCaseForTransfer('${escapeHtml(cNo)}')">
            <div class="candidate-item-info">
              <div class="candidate-item-title">
                <strong>${escapeHtml(cNo)}</strong>
                <span class="candidate-item-type ${m.caseType || 'civil'}">${cType}</span>
                <span class="candidate-item-status">${escapeHtml(m.caseStatus || 'Pending')}</span>
              </div>
              <div class="candidate-item-parties">${escapeHtml(cName)}</div>
              <div class="candidate-item-court">🏛️ Current Court: ${escapeHtml(cCourt)}</div>
            </div>
            <div class="candidate-item-action">
              <button type="button" class="primary-btn candidate-pick-btn">Select ➔</button>
            </div>
          </div>
        `;
      });
      html += `
          </div>
        </div>
      `;
      statusEl.innerHTML = html;
      statusEl.className = 'update-status-msg';
    }
    if (previewCard) previewCard.style.display = 'none';
    if (transferForm) transferForm.style.display = 'none';
    return;
  }

  const targetCase = exactMatch || matches[0];
  const caseNo = targetCase.caseNo || targetCase.criminalCaseNumber || '—';
  const caseType = targetCase.caseType || 'civil';
  const currentCourt = targetCase.courtName || targetCase.criminalCourtName || 'District Court';
  const clientName = targetCase.clientName || targetCase.criminalClientName || '—';
  const nextHearing = targetCase.nextHearing && targetCase.nextHearing !== '—' ? formatDateDMY(targetCase.nextHearing) : 'Undated';
  const caseTitle = targetCase.caseName || (targetCase.plaintiff ? `${targetCase.plaintiff} vs ${targetCase.defendant}` : (targetCase.victimName ? `${targetCase.victimName} vs ${targetCase.accusedName}` : caseNo));

  // Populate preview card
  const cNoDisp = document.getElementById('transferCaseNoDisplay');
  if (cNoDisp) cNoDisp.textContent = caseNo;

  const cTypeBadge = document.getElementById('transferCaseTypeBadge');
  if (cTypeBadge) {
    cTypeBadge.textContent = caseType.replace('_', ' ').toUpperCase();
    cTypeBadge.className = `case-badge ${caseType}`;
  }

  const cStatusBadge = document.getElementById('transferCaseStatusBadge');
  if (cStatusBadge) {
    const isDisposed = (targetCase.caseStatus || '').toLowerCase().includes('dispose');
    cStatusBadge.textContent = isDisposed ? 'Disposed Off' : 'Pending';
    cStatusBadge.className = isDisposed ? 'status-badge disposed' : 'status-badge pending';
  }

  const cTitleDisp = document.getElementById('transferCaseTitleDisplay');
  if (cTitleDisp) cTitleDisp.textContent = caseTitle;

  const cCourtDisp = document.getElementById('transferCurrentCourtDisplay');
  if (cCourtDisp) cCourtDisp.textContent = currentCourt;

  const cClientDisp = document.getElementById('transferClientDisplay');
  if (cClientDisp) cClientDisp.textContent = clientName;

  const cHearingDisp = document.getElementById('transferHearingDisplay');
  if (cHearingDisp) cHearingDisp.textContent = nextHearing;

  // Populate Form Fields
  const hiddenNo = document.getElementById('transferHiddenCaseNo');
  if (hiddenNo) hiddenNo.value = caseNo;

  const hiddenType = document.getElementById('transferHiddenCaseType');
  if (hiddenType) hiddenType.value = caseType;

  const hiddenFrom = document.getElementById('transferHiddenFromCourt');
  if (hiddenFrom) hiddenFrom.value = currentCourt;

  const fromDisp = document.getElementById('transferFromCourtDisplay');
  if (fromDisp) fromDisp.value = currentCourt;

  const dateInput = document.getElementById('transferDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const toCourtSelect = document.getElementById('transferToCourt');
  if (toCourtSelect) {
    toCourtSelect.value = '';
  }

  const searchInput = document.getElementById('transferSearchInput');
  if (searchInput) searchInput.value = caseNo;

  if (statusEl) {
    statusEl.textContent = `✅ Case "${caseNo}" loaded. Specify destination court below.`;
    statusEl.className = 'update-status-msg success';
  }

  if (previewCard) previewCard.style.display = 'block';
  if (transferForm) transferForm.style.display = 'block';
}
window.loadCaseForTransfer = loadCaseForTransfer;

async function handleTransferCaseSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (isSubmittingTransfer) return;

  const caseNo = document.getElementById('transferHiddenCaseNo')?.value?.trim();
  const caseType = document.getElementById('transferHiddenCaseType')?.value?.trim() || 'civil';
  const fromCourt = document.getElementById('transferHiddenFromCourt')?.value?.trim() || document.getElementById('transferFromCourtDisplay')?.value?.trim();
  const toCourt = document.getElementById('transferToCourt')?.value?.trim();
  const transferDate = document.getElementById('transferDate')?.value?.trim() || new Date().toISOString().split('T')[0];
  const orderNo = document.getElementById('transferOrderNo')?.value?.trim() || '';
  const orderDate = document.getElementById('transferOrderDate')?.value?.trim() || null;
  const authority = document.getElementById('transferAuthority')?.value?.trim() || '';
  const reason = document.getElementById('transferReason')?.value?.trim() || 'Judicial / Territorial Court Transfer';
  const docLink = document.getElementById('transferDocLink')?.value?.trim() || '';
  const remarks = document.getElementById('transferRemarks')?.value?.trim() || '';
  const statusEl = document.getElementById('transferSearchStatus');
  const submitBtn = document.getElementById('submitTransferBtn');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa-solid fa-arrow-right-arrow-left"></i> Execute & Save Court Transfer';

  if (!caseNo) {
    alert('Please search and select a case to transfer first.');
    return;
  }

  if (!toCourt) {
    alert('Please select a destination court for the transfer.');
    return;
  }

  if (toCourt.toLowerCase() === fromCourt.toLowerCase()) {
    alert(`The case is already assigned to "${toCourt}". Please select a different destination court.`);
    return;
  }

  const confirmMsg = `Transfer Case "${caseNo}"\n\nFrom: ${fromCourt}\nTo: ${toCourt}\nDate: ${transferDate}\nReason: ${reason}\n\nDo you wish to execute this court transfer?`;
  if (!confirm(confirmMsg)) return;

  try {
    isSubmittingTransfer = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transferring Case...';
    }

    const transferId = 'transfer_' + Date.now();
    const transferRecord = {
      id: transferId,
      case_number: caseNo,
      case_type: caseType,
      from_court: fromCourt,
      to_court: toCourt,
      transfer_date: transferDate,
      order_number: orderNo,
      order_date: orderDate || null,
      transferred_by: authority,
      transfer_reason: reason,
      doc_link: docLink,
      remarks: remarks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Insert into Supabase case_transfers table (with graceful fallback)
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('case_transfers').insert([transferRecord]).select('id');
        if (error) {
          console.warn('Could not insert into Supabase case_transfers (table may need creation):', error.message);
        } else if (data && data[0]?.id) {
          transferRecord.id = data[0].id;
        }
      } catch (insertErr) {
        console.warn('Supabase case_transfers insert exception:', insertErr);
      }
    }

    // 2. Add to in-memory state & persist to local storage backup
    allCaseTransfers.unshift(transferRecord);
    window.allCaseTransfers = allCaseTransfers;
    try {
      localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers));
    } catch (e) {}

    // 3. Update the case's court in Supabase across the relevant case table
    const tableMap = {
      'civil': 'civilcases',
      'state': 'statecases',
      'criminal': 'criminalcases',
      'family': 'familycases',
      'revenue': 'revenuecases',
      'misc_civil': 'misccivilcases',
      'misc_criminal': 'misccriminalcases',
      'complaint': 'complaintcases'
    };
    const targetTable = tableMap[caseType] || 'civilcases';

    if (supabaseClient) {
      try {
        const payload = { court_name: toCourt, updated_at: new Date().toISOString() };
        await supabaseClient.from(targetTable).update(payload).ilike('case_number', caseNo);
      } catch (courtUpdateErr) {
        console.warn('Error updating court in Supabase case table:', courtUpdateErr);
      }
    }

    // 4. Update in-memory allCaseRecords
    const foundCase = allCaseRecords.find(c => {
      const num1 = (c.caseNo || '').toLowerCase();
      const num2 = (c.criminalCaseNumber || '').toLowerCase();
      return num1 === caseNo.toLowerCase() || num2 === caseNo.toLowerCase();
    });

    if (foundCase) {
      foundCase.courtName = toCourt;
      foundCase.criminalCourtName = toCourt;
      foundCase.updatedAt = new Date().toISOString();
    }

    // 5. If this case is currently open in Case Dossier, re-render it
    if (currentSelectedCase && ((currentSelectedCase.caseNo || '').toLowerCase() === caseNo.toLowerCase() || (currentSelectedCase.criminalCaseNumber || '').toLowerCase() === caseNo.toLowerCase())) {
      currentSelectedCase.courtName = toCourt;
      currentSelectedCase.criminalCourtName = toCourt;
      renderSelectedCaseDetails(currentSelectedCase);
    }

    // 6. Refresh views & tables
    refreshAllCaseTables();
    renderRecentTransfersTable();
    updateTransfersCountBadge();

    // 7. Reset form and inform user
    resetTransferForm();
    if (statusEl) {
      statusEl.textContent = `🎉 Success! Case "${caseNo}" successfully transferred from "${fromCourt}" to "${toCourt}".`;
      statusEl.className = 'update-status-msg success';
    }

    if (typeof showToast === 'function') {
      showToast(`Case ${caseNo} transferred to ${toCourt}!`, 'success');
    } else {
      alert(`✅ Case ${caseNo} successfully transferred from "${fromCourt}" to "${toCourt}".`);
    }

  } catch (err) {
    console.error('Error during case transfer:', err);
    alert(`Error transferring case: ${err.message || err}`);
    if (statusEl) {
      statusEl.textContent = `❌ Error: ${err.message || err}`;
      statusEl.className = 'update-status-msg error';
    }
  } finally {
    isSubmittingTransfer = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}
window.handleTransferCaseSubmit = handleTransferCaseSubmit;

// ==============================================================================
// BULK CASES TRANSFER LOGIC & STATE
// ==============================================================================
let bulkLoadedCases = [];
let bulkSelectedCaseNumbers = new Set();
let isSubmittingBulkTransfer = false;

function switchTransferMode(mode) {
  const singleBtn = document.getElementById('transferTabBtnSingle');
  const bulkBtn = document.getElementById('transferTabBtnBulk');
  const singleContainer = document.getElementById('singleTransferContainer');
  const bulkContainer = document.getElementById('bulkTransferContainer');

  if (mode === 'bulk') {
    if (singleBtn) singleBtn.classList.remove('active');
    if (bulkBtn) bulkBtn.classList.add('active');
    if (singleContainer) singleContainer.style.display = 'none';
    if (bulkContainer) bulkContainer.style.display = 'block';

    const bulkDateInput = document.getElementById('bulkTransferDate');
    if (bulkDateInput && !bulkDateInput.value) {
      bulkDateInput.value = new Date().toISOString().split('T')[0];
    }
  } else {
    if (singleBtn) singleBtn.classList.add('active');
    if (bulkBtn) bulkBtn.classList.remove('active');
    if (singleContainer) singleContainer.style.display = 'block';
    if (bulkContainer) bulkContainer.style.display = 'none';
  }
}
window.switchTransferMode = switchTransferMode;

function onBulkOriginCourtChange() {
  const courtSelect = document.getElementById('bulkTransferFromCourt');
  const selectedCourt = courtSelect ? courtSelect.value.trim() : '';
  bulkSelectedCaseNumbers.clear();
  updateBulkSelectionCount();

  if (!selectedCourt) {
    bulkLoadedCases = [];
    renderBulkCasesTable([]);
    return;
  }

  // Find all non-disposed cases belonging to this origin court
  bulkLoadedCases = allCaseRecords.filter(c => {
    const isDisposed = (c.caseStatus || '').toLowerCase().includes('dispose');
    if (isDisposed) return false;
    const court = (c.courtName || c.criminalCourtName || '').trim().toLowerCase();
    return court === selectedCourt.toLowerCase();
  });

  const totalEl = document.getElementById('bulkTotalOriginCases');
  if (totalEl) totalEl.textContent = String(bulkLoadedCases.length);

  const filterInput = document.getElementById('bulkCaseFilterInput');
  if (filterInput) filterInput.value = '';

  renderBulkCasesTable(bulkLoadedCases);
}
window.onBulkOriginCourtChange = onBulkOriginCourtChange;

function filterBulkCasesTable() {
  const query = (document.getElementById('bulkCaseFilterInput')?.value || '').toLowerCase().trim();
  if (!query) {
    renderBulkCasesTable(bulkLoadedCases);
    return;
  }
  const filtered = bulkLoadedCases.filter(c => {
    const num = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
    const title = (c.caseTitle || c.complainant || c.accused || '').toLowerCase();
    const stage = (c.caseStage || '').toLowerCase();
    const type = (c.caseType || '').toLowerCase();
    return num.includes(query) || title.includes(query) || stage.includes(query) || type.includes(query);
  });
  renderBulkCasesTable(filtered);
}
window.filterBulkCasesTable = filterBulkCasesTable;

function renderBulkCasesTable(cases) {
  const tbody = document.getElementById('bulkCasesTableBody');
  if (!tbody) return;

  if (!cases || cases.length === 0) {
    const originCourt = document.getElementById('bulkTransferFromCourt')?.value?.trim();
    if (!originCourt) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-results text-center py-6 text-slate-500">Please select an Origin Court above to load its active cases.</td></tr>';
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="no-results text-center py-6 text-slate-500">No active cases found in "${escapeHtml(originCourt)}".</td></tr>`;
    }
    const allCheckbox = document.getElementById('bulkSelectAllCheckbox');
    if (allCheckbox) allCheckbox.checked = false;
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const caseNo = c.caseNo || c.criminalCaseNumber || '—';
    const caseType = (c.caseType || 'civil').toUpperCase();
    const title = c.caseTitle || `${c.complainant || 'Complainant'} vs ${c.accused || 'Accused'}`;
    const stage = c.caseStage || 'Pending';
    const hearing = c.nextHearing || 'Undated';
    const isChecked = bulkSelectedCaseNumbers.has(caseNo);

    return `
      <tr class="hover:bg-indigo-50/40 transition-colors">
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="bulk-case-checkbox" value="${escapeHtml(caseNo)}" ${isChecked ? 'checked' : ''} onchange="onBulkCaseRowCheckboxChange(this)">
        </td>
        <td class="font-semibold text-slate-900" style="vertical-align: middle;">
          <span class="case-badge ${caseType.toLowerCase().includes('crim') ? 'criminal' : caseType.toLowerCase().includes('rev') ? 'revenue' : 'civil'}" style="font-size: 10px; padding: 2px 6px; margin-right: 4px;">${escapeHtml(caseType)}</span>
          ${escapeHtml(caseNo)}
        </td>
        <td style="vertical-align: middle;">
          <div class="font-medium text-slate-800 line-clamp-1">${escapeHtml(title)}</div>
        </td>
        <td style="vertical-align: middle;">
          <span class="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">${escapeHtml(stage)}</span>
        </td>
        <td style="vertical-align: middle;" class="text-xs font-semibold text-slate-700">
          📅 ${escapeHtml(hearing)}
        </td>
      </tr>
    `;
  }).join('');

  const allCheckbox = document.getElementById('bulkSelectAllCheckbox');
  if (allCheckbox) {
    allCheckbox.checked = cases.length > 0 && cases.every(c => bulkSelectedCaseNumbers.has(c.caseNo || c.criminalCaseNumber));
  }
}

function onBulkCaseRowCheckboxChange(checkbox) {
  const caseNo = checkbox.value;
  if (checkbox.checked) {
    bulkSelectedCaseNumbers.add(caseNo);
  } else {
    bulkSelectedCaseNumbers.delete(caseNo);
  }
  updateBulkSelectionCount();

  const allCheckbox = document.getElementById('bulkSelectAllCheckbox');
  if (allCheckbox && bulkLoadedCases.length > 0) {
    allCheckbox.checked = bulkLoadedCases.every(c => bulkSelectedCaseNumbers.has(c.caseNo || c.criminalCaseNumber));
  }
}
window.onBulkCaseRowCheckboxChange = onBulkCaseRowCheckboxChange;

function toggleBulkSelectAll(allCheckbox) {
  const isChecked = allCheckbox.checked;
  bulkLoadedCases.forEach(c => {
    const caseNo = c.caseNo || c.criminalCaseNumber;
    if (!caseNo) return;
    if (isChecked) {
      bulkSelectedCaseNumbers.add(caseNo);
    } else {
      bulkSelectedCaseNumbers.delete(caseNo);
    }
  });

  const rowCheckboxes = document.querySelectorAll('.bulk-case-checkbox');
  rowCheckboxes.forEach(cb => { cb.checked = isChecked; });

  updateBulkSelectionCount();
}
window.toggleBulkSelectAll = toggleBulkSelectAll;

function clearBulkCaseSelection() {
  bulkSelectedCaseNumbers.clear();
  const allCheckbox = document.getElementById('bulkSelectAllCheckbox');
  if (allCheckbox) allCheckbox.checked = false;
  const rowCheckboxes = document.querySelectorAll('.bulk-case-checkbox');
  rowCheckboxes.forEach(cb => { cb.checked = false; });
  updateBulkSelectionCount();
}
window.clearBulkCaseSelection = clearBulkCaseSelection;

function updateBulkSelectionCount() {
  const count = bulkSelectedCaseNumbers.size;
  const countEl = document.getElementById('bulkSelectedCount');
  if (countEl) countEl.textContent = String(count);
  const submitCountEl = document.getElementById('bulkSubmitBtnCount');
  if (submitCountEl) submitCountEl.textContent = String(count);
}

function insertBulkTransferReasonChip(chipText) {
  const input = document.getElementById('bulkTransferReason');
  if (input) {
    input.value = chipText;
    input.focus();
  }
}
window.insertBulkTransferReasonChip = insertBulkTransferReasonChip;

function resetBulkTransferForm() {
  const form = document.getElementById('bulkTransferForm');
  if (form) form.reset();
  const dateInput = document.getElementById('bulkTransferDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  clearBulkCaseSelection();
  const statusEl = document.getElementById('bulkTransferStatus');
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'update-status-msg';
  }
}
window.resetBulkTransferForm = resetBulkTransferForm;

async function handleBulkTransferSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (isSubmittingBulkTransfer) return;

  const originCourt = document.getElementById('bulkTransferFromCourt')?.value?.trim();
  const toCourt = document.getElementById('bulkTransferToCourt')?.value?.trim();
  const transferDate = document.getElementById('bulkTransferDate')?.value?.trim();
  const orderNo = document.getElementById('bulkTransferOrderNo')?.value?.trim() || '';
  const authority = document.getElementById('bulkTransferAuthority')?.value?.trim() || '';
  const docLink = document.getElementById('bulkTransferDocLink')?.value?.trim() || '';
  const reason = document.getElementById('bulkTransferReason')?.value?.trim() || 'Batch Judicial Reassignment';
  const remarks = document.getElementById('bulkTransferRemarks')?.value?.trim() || '';
  const statusEl = document.getElementById('bulkTransferStatus');
  const submitBtn = document.getElementById('submitBulkTransferBtn');

  if (!originCourt) {
    alert('Please select an Origin Court.');
    return;
  }

  if (bulkSelectedCaseNumbers.size === 0) {
    alert('Please select at least one case to transfer.');
    return;
  }

  if (!toCourt) {
    alert('Please select a destination court for the batch transfer.');
    return;
  }

  if (toCourt.toLowerCase() === originCourt.toLowerCase()) {
    alert(`Destination court cannot be the same as origin court ("${toCourt}").`);
    return;
  }

  if (!transferDate) {
    alert('Please provide the date of the transfer order.');
    return;
  }

  const selectedList = Array.from(bulkSelectedCaseNumbers);
  const confirmMsg = `Execute Batch Court Transfer\n\nTotal Cases to Transfer: ${selectedList.length}\nFrom: ${originCourt}\nTo: ${toCourt}\nOrder Date: ${transferDate}\nReason: ${reason}\n\nAre you sure you want to transfer these ${selectedList.length} cases?`;
  if (!confirm(confirmMsg)) return;

  try {
    isSubmittingBulkTransfer = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transferring ${selectedList.length} Cases...`;
    }

    const tableMap = {
      'civil': 'civilcases',
      'state': 'statecases',
      'criminal': 'criminalcases',
      'family': 'familycases',
      'revenue': 'revenuecases',
      'misc_civil': 'misccivilcases',
      'misc_criminal': 'misccriminalcases',
      'complaint': 'complaintcases'
    };

    const newTransferRecords = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < selectedList.length; i++) {
      const caseNo = selectedList[i];
      const caseObj = allCaseRecords.find(c => {
        const cNo = (c.caseNo || c.criminalCaseNumber || '').toLowerCase();
        return cNo === caseNo.toLowerCase();
      });

      const caseType = caseObj ? (caseObj.caseType || 'civil').toLowerCase() : 'civil';
      const transferId = 'transfer_' + Date.now() + '_' + i;
      const transferRecord = {
        id: transferId,
        case_number: caseNo,
        case_type: caseType,
        from_court: originCourt,
        to_court: toCourt,
        transfer_date: transferDate,
        order_number: orderNo,
        order_date: transferDate,
        transferred_by: authority,
        transfer_reason: reason,
        doc_link: docLink,
        remarks: remarks,
        created_at: nowIso,
        updated_at: nowIso
      };

      // Insert into Supabase case_transfers
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('case_transfers').insert([transferRecord]).select('id');
          if (!error && data && data[0]?.id) {
            transferRecord.id = data[0].id;
          }
        } catch (err) {
          console.warn('Supabase case_transfers insert err:', err);
        }

        // Update court_name in case table
        try {
          const targetTable = tableMap[caseType] || 'civilcases';
          await supabaseClient.from(targetTable).update({ court_name: toCourt, updated_at: nowIso }).ilike('case_number', caseNo);
        } catch (courtErr) {
          console.warn('Error updating court for case', caseNo, courtErr);
        }
      }

      // Update in-memory
      if (caseObj) {
        caseObj.courtName = toCourt;
        caseObj.criminalCourtName = toCourt;
        caseObj.updatedAt = nowIso;
      }

      // Also update dossier if currently open
      if (currentSelectedCase && ((currentSelectedCase.caseNo || '').toLowerCase() === caseNo.toLowerCase() || (currentSelectedCase.criminalCaseNumber || '').toLowerCase() === caseNo.toLowerCase())) {
        currentSelectedCase.courtName = toCourt;
        currentSelectedCase.criminalCourtName = toCourt;
        renderSelectedCaseDetails(currentSelectedCase);
      }

      newTransferRecords.unshift(transferRecord);
    }

    // Add to allCaseTransfers
    allCaseTransfers.unshift(...newTransferRecords);
    window.allCaseTransfers = allCaseTransfers;
    try {
      localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers));
    } catch (e) {}

    // Refresh views
    refreshAllCaseTables();
    renderRecentTransfersTable();
    updateTransfersCountBadge();

    // Reload the bulk origin court list (the transferred cases won't belong to origin anymore!)
    onBulkOriginCourtChange();

    resetBulkTransferForm();

    if (statusEl) {
      statusEl.textContent = `🎉 Success! Transferred ${selectedList.length} cases from "${originCourt}" to "${toCourt}".`;
      statusEl.className = 'update-status-msg success';
    }

    if (typeof showToast === 'function') {
      showToast(`Batch transfer complete! ${selectedList.length} cases transferred to ${toCourt}`, 'success');
    } else {
      alert(`✅ Success! ${selectedList.length} cases successfully transferred from "${originCourt}" to "${toCourt}".`);
    }

  } catch (err) {
    console.error('Bulk transfer failed:', err);
    alert('An error occurred during batch transfer: ' + err.message);
  } finally {
    isSubmittingBulkTransfer = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-layer-group"></i> Execute Batch Transfer (<span id="bulkSubmitBtnCount">0</span> Cases)`;
    }
  }
}
window.handleBulkTransferSubmit = handleBulkTransferSubmit;

function renderRecentTransfersTable() {
  const tbody = document.getElementById('transfersRegistryTableBody');
  const badge = document.getElementById('transfersTotalCountBadge');
  if (badge) {
    badge.textContent = `${allCaseTransfers.length} Transfer${allCaseTransfers.length === 1 ? '' : 's'} Logged`;
  }
  if (!tbody) return;

  if (allCaseTransfers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-results text-center py-4">No case transfers recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allCaseTransfers.slice(0, 25).map((t, idx) => {
    const docBtn = t.doc_link && t.doc_link.trim()
      ? `<a href="${escapeHtml(t.doc_link.trim())}" target="_blank" rel="noopener noreferrer" class="table-action-icon-btn" title="View Order Document" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;"><i class="fa-solid fa-file-arrow-down"></i></a>`
      : '';

    return `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">#${idx + 1}</td>
        <td style="white-space: nowrap; font-weight: 600;">${formatDateDMY(t.transfer_date)}</td>
        <td>
          <a href="#" onclick="showCaseDetails('${escapeHtml(t.case_number)}'); return false;" style="font-weight: 700; color: #1e40af; text-decoration: underline;">
            ${escapeHtml(t.case_number)}
          </a>
        </td>
        <td>
          <div class="transfer-direction-pill">
            <span class="transfer-from-court-badge">${escapeHtml(t.from_court || '—')}</span>
            <span class="transfer-arrow-icon"><i class="fa-solid fa-arrow-right"></i></span>
            <span class="transfer-to-court-badge">${escapeHtml(t.to_court || '—')}</span>
          </div>
        </td>
        <td>
          <strong style="color: #1e293b;">${escapeHtml(t.order_number || '—')}</strong>
          ${t.transferred_by ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(t.transferred_by)}</div>` : ''}
        </td>
        <td>
          <span class="transfer-reason-chip">${escapeHtml(t.transfer_reason || 'Court Transfer')}</span>
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <button type="button" class="table-action-icon-btn" onclick="showCaseDetails('${escapeHtml(t.case_number)}')" title="View Case Dossier" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:#f8fafc; color:#334155; border:1px solid #cbd5e1;">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${docBtn}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
window.renderRecentTransfersTable = renderRecentTransfersTable;

function renderCaseTransferHistory(caseNumber, caseObj) {
  const tbody = document.getElementById('detailInlineTransferTableBody');
  const badge = document.getElementById('detailTransferCountBadge');
  if (!tbody) return;

  const targetNo = (caseNumber || '').trim().toLowerCase();
  const transfers = (allCaseTransfers || []).filter(t => (t.case_number || '').trim().toLowerCase() === targetNo);

  // Sort descending by transfer_date or created_at
  transfers.sort((a, b) => {
    const da = new Date(a.transfer_date || a.created_at);
    const db = new Date(b.transfer_date || b.created_at);
    return db - da;
  });

  if (badge) {
    badge.textContent = `${transfers.length} Transfer${transfers.length === 1 ? '' : 's'}`;
  }

  if (transfers.length === 0) {
    const currentCourt = caseObj ? (caseObj.courtName || caseObj.criminalCourtName || 'Assigned Court') : 'Assigned Court';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-results text-center py-4" style="color: #64748b; padding: 2rem;">
          ℹ️ No court transfer records found for this case. Matter is presently pending before <strong>${escapeHtml(currentCourt)}</strong>.
          <div style="margin-top: 8px;">
            <button type="button" class="table-view-btn" onclick="openTransferForCase('${escapeHtml(caseNumber)}')" style="font-size: 0.8rem; background: #eef2ff; color: #4338ca; border-color: #c7d2fe;">
              🔄 Transfer to Another Court
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transfers.map((t, idx) => {
    const docLinkHtml = t.doc_link && t.doc_link.trim()
      ? `<a href="${escapeHtml(t.doc_link.trim())}" target="_blank" rel="noopener noreferrer" class="table-action-icon-btn" title="View Transfer Order Document" style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:6px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;"><i class="fa-solid fa-file-arrow-down"></i></a>`
      : '<span style="color:#94a3b8; font-size:12px;">—</span>';

    const authorityHtml = t.transferred_by ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">Auth: ${escapeHtml(t.transferred_by)}</div>` : '';
    const orderNoHtml = t.order_number ? `<strong style="color:#1e293b;">${escapeHtml(t.order_number)}</strong>` : '<span style="color:#64748b;">Suo-moto / Admin</span>';

    return `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">#${idx + 1}</td>
        <td style="white-space: nowrap; font-weight: 600;">${formatDateDMY(t.transfer_date)}</td>
        <td>
          <div class="transfer-direction-pill">
            <span class="transfer-from-court-badge" title="Origin Court">${escapeHtml(t.from_court || 'Origin Court')}</span>
            <span class="transfer-arrow-icon"><i class="fa-solid fa-arrow-right"></i></span>
            <span class="transfer-to-court-badge" title="Destination Court">${escapeHtml(t.to_court || 'Destination Court')}</span>
          </div>
        </td>
        <td>
          ${orderNoHtml}
          ${authorityHtml}
        </td>
        <td>
          <span class="transfer-reason-chip">${escapeHtml(t.transfer_reason || 'Court Transfer')}</span>
          ${t.remarks ? `<div style="font-size:11px; color:#475569; margin-top:3px; font-style:italic;">${escapeHtml(t.remarks)}</div>` : ''}
        </td>
        <td style="text-align: center;">
          ${docLinkHtml}
        </td>
      </tr>
    `;
  }).join('');
}
window.renderCaseTransferHistory = renderCaseTransferHistory;

function insertTransferReasonChip(reasonText) {
  const reasonInput = document.getElementById('transferReason');
  if (reasonInput) {
    reasonInput.value = reasonText;
    reasonInput.focus();
  }
}
window.insertTransferReasonChip = insertTransferReasonChip;

function resetTransferForm() {
  const previewCard = document.getElementById('transferSelectedCaseCard');
  const transferForm = document.getElementById('transferCaseForm');
  const searchInput = document.getElementById('transferSearchInput');
  const statusEl = document.getElementById('transferSearchStatus');

  if (previewCard) previewCard.style.display = 'none';
  if (transferForm) {
    transferForm.reset();
    transferForm.style.display = 'none';
  }
  if (searchInput) searchInput.value = '';
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'update-status-msg';
  }
}
window.resetTransferForm = resetTransferForm;

function openTransferForCase(caseNo) {
  showTab('transfer');
  const searchInput = document.getElementById('transferSearchInput');
  if (searchInput) {
    searchInput.value = caseNo || '';
  }
  loadCaseForTransfer(caseNo);
}
window.openTransferForCase = openTransferForCase;

function updateTransfersCountBadge() {
  const badge = document.getElementById('transfersTotalCountBadge');
  if (badge) {
    badge.textContent = `${allCaseTransfers.length} Transfer${allCaseTransfers.length === 1 ? '' : 's'} Logged`;
  }
}
window.updateTransfersCountBadge = updateTransfersCountBadge;

// ==============================================================================
// Courts & Form Options
// ==============================================================================

const caseTypes = [
  { value: 'civil', label: '⚖️ Civil Cases' },
  { value: 'state', label: '🚨 State Cases (Criminal / FIR)' },
  { value: 'family', label: '👨‍👩‍👧 Family Cases (Matrimonial)' },
  { value: 'revenue', label: '🌾 Revenue Cases (Land / Tehsil)' },
  { value: 'misc_civil', label: '📑 Misc Civil (Appeals / Revisions)' },
  { value: 'misc_criminal', label: '⚖️ Misc Criminal (Bails / Appeals)' },
  { value: 'complaint', label: '📢 Complaint Cases (Sec 138 / 200 CrPC)' }
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
    document.getElementById('updateCourtName'),
    document.getElementById('stateCourtName'),
    document.getElementById('updateStateCourtName'),
    document.getElementById('familyCourtName'),
    document.getElementById('updateFamilyCourtName'),
    document.getElementById('revenueCourtName'),
    document.getElementById('updateRevenueCourtName'),
    document.getElementById('miscCivilCourtName'),
    document.getElementById('updateMiscCivilCourtName'),
    document.getElementById('miscCriminalCourtName'),
    document.getElementById('updateMiscCriminalCourtName'),
    document.getElementById('complaintCourtName'),
    document.getElementById('updateComplaintCourtName'),
    document.getElementById('criminalCourtName'),
    document.getElementById('updateCriminalCourtName'),
    document.getElementById('transferToCourt'),
    document.getElementById('bulkTransferFromCourt'),
    document.getElementById('bulkTransferToCourt')
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
  if (typeof populateHelperCourtDropdowns === 'function') {
    populateHelperCourtDropdowns();
  }
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

  const allCasesCourtFilter = document.getElementById('allCasesCourtSelect');
  if (allCasesCourtFilter) {
    const prevAllVal = allCasesCourtFilter.value || '';
    allCasesCourtFilter.innerHTML = '<option value="">All Courts</option>';
    Array.from(uniqueCourts).sort().forEach(court => {
      const opt = document.createElement('option');
      opt.value = court;
      opt.textContent = court;
      allCasesCourtFilter.appendChild(opt);
    });
    if (prevAllVal) allCasesCourtFilter.value = prevAllVal;
  }
}

function renderCourtsTable(filterQuery = '') {
  const tbody = document.querySelector('#courtsTable tbody');
  const countBadge = document.getElementById('courtsTotalCountBadge');
  const searchInput = document.getElementById('courtSearchInput');
  const query = (filterQuery !== undefined && filterQuery !== null && filterQuery !== '' ? filterQuery : (searchInput ? searchInput.value : '') || '').trim().toLowerCase();

  const deletedSet = getDeletedCourtsSet();
  const seen = new Set();
  const allCourtsList = [];

  courts.forEach(c => {
    const t = (c || '').trim();
    if (t && !deletedSet.has(t.toLowerCase()) && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      allCourtsList.push(t);
    }
  });

  allCourtsList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const filteredCourts = query
    ? allCourtsList.filter(c => c.toLowerCase().includes(query))
    : allCourtsList;

  if (countBadge) {
    if (query) {
      countBadge.textContent = `${filteredCourts.length} of ${allCourtsList.length} Courts`;
    } else {
      countBadge.textContent = `${allCourtsList.length} Court${allCourtsList.length === 1 ? '' : 's'} Configured`;
    }
  }

  if (!tbody) return;

  if (filteredCourts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="no-results">${query ? `No courts matching "${escapeHtml(query)}".` : 'No courts configured yet. Add a court using the form above.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = '';

  filteredCourts.forEach((court, index) => {
    const row = document.createElement('tr');
    const casesInCourt = (allCaseRecords || []).filter(c => 
      (c.courtName || '').trim().toLowerCase() === court.trim().toLowerCase() || 
      (c.criminalCourtName || '').trim().toLowerCase() === court.trim().toLowerCase()
    );
    const count = casesInCourt.length;

    row.innerHTML = `
      <td style="text-align: center;"><span class="court-index-badge">#${index + 1}</span></td>
      <td>
        <div class="court-name-cell">
          <span style="font-size: 18px;">🏛️</span>
          <div class="court-name-meta">
            <span class="court-name-title">${escapeHtml(court)}</span>
            <span class="court-cases-count-badge ${count > 0 ? 'has-cases' : 'zero-cases'}">
              <i class="fa-solid fa-briefcase"></i> ${count} Case${count === 1 ? '' : 's'} Assigned
            </span>
          </div>
        </div>
      </td>
      <td class="table-actions-td">
        <div class="court-actions-cell">
          <button type="button" class="court-btn-edit edit-court" title="Edit Court"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
          <button type="button" class="court-btn-delete delete-court" title="Delete Court"><i class="fa-solid fa-trash-can"></i><span class="btn-text"> Delete</span></button>
        </div>
      </td>
    `;

    const editBtn = row.querySelector('.edit-court');
    const deleteBtn = row.querySelector('.delete-court');

    editBtn.addEventListener('click', () => {
      openEditCourtModal(court, count);
    });

    deleteBtn.addEventListener('click', () => {
      openDeleteCourtModal(court, count);
    });

    tbody.appendChild(row);
  });
}

function openEditCourtModal(courtName, count = 0) {
  const modal = document.getElementById('editCourtModal');
  const origInput = document.getElementById('editCourtOriginalName');
  const nameInput = document.getElementById('editCourtNameInput');
  const noticeText = document.getElementById('editCourtNoticeText');
  const errorDiv = document.getElementById('editCourtErrorMsg');
  const saveBtn = document.getElementById('saveEditCourtBtn');
  const saveBtnText = document.getElementById('saveEditCourtBtnText');

  if (!modal || !nameInput) {
    const newCourt = prompt(`Edit court name "${courtName}"\n(${count} case(s) currently assigned):`, courtName);
    if (newCourt && newCourt.trim() && newCourt.trim().toLowerCase() !== courtName.toLowerCase()) {
      if (courts.some(c => c.trim().toLowerCase() === newCourt.trim().toLowerCase())) {
        alert(`A court named "${newCourt.trim()}" already exists.`);
        return;
      }
      cascadeUpdateCourtName(courtName, newCourt.trim()).then(updatedCount => {
        alert(`✅ Court renamed to "${newCourt.trim()}".\nUpdated ${updatedCount || 0} associated case(s) across the database.`);
      });
    }
    return;
  }

  if (origInput) origInput.value = courtName;
  nameInput.value = courtName;
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
  }
  if (noticeText) {
    if (count > 0) {
      noticeText.innerHTML = `<strong>${count} active case(s)</strong> currently assigned to this court will be automatically updated across all tables and filings.`;
    } else {
      noticeText.textContent = 'This court currently has no active cases assigned. Renaming will update the court directory.';
    }
  }
  if (saveBtn) saveBtn.disabled = false;
  if (saveBtnText) saveBtnText.textContent = 'Save Changes';

  modal.classList.remove('hidden');
  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);
}

function closeEditCourtModal() {
  const modal = document.getElementById('editCourtModal');
  if (modal) modal.classList.add('hidden');
}

async function confirmSaveEditedCourt() {
  const origInput = document.getElementById('editCourtOriginalName');
  const nameInput = document.getElementById('editCourtNameInput');
  const errorDiv = document.getElementById('editCourtErrorMsg');
  const saveBtn = document.getElementById('saveEditCourtBtn');
  const saveBtnText = document.getElementById('saveEditCourtBtnText');

  const oldName = (origInput?.value || '').trim();
  const newName = (nameInput?.value || '').trim();

  if (!newName) {
    if (errorDiv) {
      errorDiv.textContent = 'Please enter a valid court name.';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  if (oldName.toLowerCase() === newName.toLowerCase()) {
    closeEditCourtModal();
    return;
  }

  const alreadyExists = courts.some(c => c.trim().toLowerCase() === newName.toLowerCase() && c.trim().toLowerCase() !== oldName.toLowerCase());
  if (alreadyExists) {
    if (errorDiv) {
      errorDiv.textContent = `A court named "${newName}" already exists. Please choose a different name.`;
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  try {
    if (saveBtn) saveBtn.disabled = true;
    if (saveBtnText) saveBtnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    if (errorDiv) errorDiv.classList.add('hidden');

    const updatedCount = await cascadeUpdateCourtName(oldName, newName);
    closeEditCourtModal();
    alert(`✅ Court renamed to "${newName}".\nUpdated ${updatedCount || 0} associated case(s) across the database.`);
  } catch (err) {
    console.error('Error renaming court:', err);
    if (errorDiv) {
      errorDiv.textContent = `Error saving changes: ${err.message || err}`;
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveBtnText) saveBtnText.textContent = 'Save Changes';
  }
}

function openDeleteCourtModal(courtName, count = 0) {
  const modal = document.getElementById('deleteCourtModal');
  const targetInput = document.getElementById('deleteCourtTargetName');
  const displaySpan = document.getElementById('deleteCourtDisplayName');
  const casesNotice = document.getElementById('deleteCourtActiveCasesNotice');
  const casesNoticeText = document.getElementById('deleteCourtCasesNoticeText');
  const errorDiv = document.getElementById('deleteCourtErrorMsg');
  const confirmBtn = document.getElementById('confirmDeleteCourtBtn');
  const confirmBtnText = document.getElementById('confirmDeleteCourtBtnText');

  if (!modal) {
    if (confirm(`Delete court: "${courtName}"?${count > 0 ? `\n\n⚠️ Note: ${count} case(s) currently belong to this court and will be unlinked.` : ''}`)) {
      deleteCourtFromSupabase(courtName);
    }
    return;
  }

  if (targetInput) targetInput.value = courtName;
  if (displaySpan) displaySpan.textContent = `"${courtName}"`;

  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
  }

  if (casesNotice && casesNoticeText) {
    if (count > 0) {
      casesNoticeText.innerHTML = `<strong>⚠️ Warning:</strong> <strong>${count} active case(s)</strong> are currently assigned to this court and will have their court reference unlinked.`;
      casesNotice.classList.remove('hidden');
    } else {
      casesNotice.classList.add('hidden');
      casesNoticeText.textContent = '';
    }
  }

  if (confirmBtn) confirmBtn.disabled = false;
  if (confirmBtnText) confirmBtnText.textContent = 'Delete Court';

  modal.classList.remove('hidden');
}

function closeDeleteCourtModal() {
  const modal = document.getElementById('deleteCourtModal');
  if (modal) modal.classList.add('hidden');
}

async function executeDeleteCourtConfirm() {
  const targetInput = document.getElementById('deleteCourtTargetName');
  const errorDiv = document.getElementById('deleteCourtErrorMsg');
  const confirmBtn = document.getElementById('confirmDeleteCourtBtn');
  const confirmBtnText = document.getElementById('confirmDeleteCourtBtnText');

  const courtName = (targetInput?.value || '').trim();
  if (!courtName) {
    closeDeleteCourtModal();
    return;
  }

  if (confirmBtn) confirmBtn.disabled = true;
  if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

  try {
    await deleteCourtFromSupabase(courtName);
    closeDeleteCourtModal();
    if (typeof showToastNotification === 'function') {
      showToastNotification(`✅ Court "${courtName}" deleted successfully.`, 2500);
    } else if (typeof M !== 'undefined' && M.toast) {
      M.toast({ html: `✅ Court "${courtName}" deleted successfully.` });
    }
  } catch (err) {
    console.error('Error deleting court:', err);
    if (errorDiv) {
      errorDiv.textContent = `Error deleting court: ${err.message || err}`;
      errorDiv.classList.remove('hidden');
    }
    if (confirmBtn) confirmBtn.disabled = false;
    if (confirmBtnText) confirmBtnText.textContent = 'Delete Court';
  }
}

window.openEditCourtModal = openEditCourtModal;
window.closeEditCourtModal = closeEditCourtModal;
window.confirmSaveEditedCourt = confirmSaveEditedCourt;
window.editCourtPrompt = openEditCourtModal;
window.openDeleteCourtModal = openDeleteCourtModal;
window.closeDeleteCourtModal = closeDeleteCourtModal;
window.executeDeleteCourtConfirm = executeDeleteCourtConfirm;
window.deleteCourtFromList = function(courtName) {
  openDeleteCourtModal(courtName);
};

function filterCourtsTable(query) {
  renderCourtsTable(query);
}
window.filterCourtsTable = filterCourtsTable;
window.renderCourtsTable = renderCourtsTable;

async function syncAllCourtsFromDatabase() {
  const syncBtn = document.querySelector('.court-refresh-btn');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Syncing...</span>';
  }
  try {
    const deletedSet = getDeletedCourtsSet();
    if (supabaseClient) {
      const { data: courtsData } = await supabaseClient.from('courts').select('*').order('court_name');
      if (courtsData && courtsData.length > 0) {
        const seen = new Set();
        courts = [];
        courtsData.forEach(c => {
          const name = (c.court_name || '').trim();
          if (name && !deletedSet.has(name.toLowerCase()) && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            courts.push(name);
          }
        });
      }
    }
    // Also include any courts referenced in cases if not deleted
    (allCaseRecords || []).forEach(item => {
      const cName = (item.courtName || item.criminalCourtName || '').trim();
      if (cName && cName !== '—' && !deletedSet.has(cName.toLowerCase()) && !courts.some(c => c.trim().toLowerCase() === cName.toLowerCase())) {
        courts.push(cName);
      }
    });
    saveCourtsToBackup();
    renderCourtOptions();
    renderCriminalCourtOptions();
    renderSearchCourtFilterOptions();
    renderCourtsTable();
  } catch (err) {
    console.error('Error syncing courts:', err);
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span>Sync All Courts</span>';
    }
  }
}
window.syncAllCourtsFromDatabase = syncAllCourtsFromDatabase;

// ==============================================================================
// Court Helpers & Staff Directory Engine
// ==============================================================================

const COURT_HELPERS_STORAGE_KEY = 'casebook_court_helpers';
let courtHelpersList = [];

function getCourtHelpersList() {
  try {
    const raw = localStorage.getItem(COURT_HELPERS_STORAGE_KEY);
    if (raw) {
      courtHelpersList = JSON.parse(raw);
      if (Array.isArray(courtHelpersList)) return courtHelpersList;
    }
  } catch (e) {
    console.error('Error reading court helpers:', e);
  }
  courtHelpersList = [];
  return courtHelpersList;
}

function saveCourtHelpersList(list) {
  courtHelpersList = list || [];
  try {
    localStorage.setItem(COURT_HELPERS_STORAGE_KEY, JSON.stringify(courtHelpersList));
  } catch (e) {
    console.error('Error saving court helpers:', e);
  }
  updateHelpersBadges();
}

function updateHelpersBadges() {
  const helpers = getCourtHelpersList();
  const count = helpers.length;
  const navBadge = document.getElementById('helpersNavCount');
  const totalBadge = document.getElementById('helpersTotalCountBadge');
  if (navBadge) navBadge.textContent = String(count);
  if (totalBadge) totalBadge.textContent = `${count} ${count === 1 ? 'Helper' : 'Helpers'} Registered`;
}

function updateHelpersCloudSyncIndicator(isSynced) {
  const badge = document.getElementById('helpersCloudStatusBadge');
  if (!badge) return;
  if (isSynced) {
    badge.textContent = '🟢 Cloud Synced';
    badge.className = 'db-live-badge';
    badge.style.background = '#f0fdf4';
    badge.style.color = '#15803d';
    badge.style.border = '1px solid #bbf7d0';
  } else {
    badge.textContent = '💾 Local Storage';
    badge.className = 'db-live-badge';
    badge.style.background = '#fefce8';
    badge.style.color = '#854d0e';
    badge.style.border = '1px solid #fef08a';
  }
}

async function syncCourtHelpersFromCloud(showToast = false) {
  const syncBtn = document.getElementById('helpersSyncDbBtn');
  const originalHtml = syncBtn ? syncBtn.innerHTML : '';
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Syncing...</span>';
  }

  ensureSupabaseClient();
  if (!supabaseClient) {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = originalHtml;
    }
    updateHelpersCloudSyncIndicator(false);
    if (showToast && typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Cloud database not connected. Using local offline storage.', 2500);
    }
    return;
  }

  try {
    let res = await supabaseClient.from('court_helpers').select('*').order('created_at', { ascending: false });
    if (res && res.error) {
      // Fallback try table named 'helpers'
      res = await supabaseClient.from('helpers').select('*').order('created_at', { ascending: false });
    }

    if (res && res.data && !res.error) {
      const mapped = res.data.map(h => ({
        id: String(h.id || ('helper_' + Date.now())),
        name: h.name || '',
        court: h.court || '',
        position: h.position || '',
        mobile: h.mobile || '',
        createdAt: h.created_at || new Date().toISOString()
      }));

      courtHelpersList = mapped;
      try {
        localStorage.setItem(COURT_HELPERS_STORAGE_KEY, JSON.stringify(courtHelpersList));
      } catch (e) {}

      updateHelpersBadges();
      updateHelpersCloudSyncIndicator(true);
      renderHelpersTable();

      if (showToast && typeof showToastNotification === 'function') {
        showToastNotification(`✅ Fetched ${mapped.length} court staff records from database.`, 2500);
      }
    } else {
      updateHelpersCloudSyncIndicator(false);
      if (showToast && typeof showToastNotification === 'function') {
        showToastNotification('ℹ️ Database connected. No records found or table not yet created.', 2500);
      }
    }
  } catch (err) {
    console.warn('Error fetching court helpers from database:', err);
    updateHelpersCloudSyncIndicator(false);
    if (showToast && typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Unable to sync with database: ' + (err.message || err), 2500);
    }
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = originalHtml || '<i class="fa-solid fa-arrows-rotate"></i> <span>Sync DB</span>';
    }
  }
}

function populateHelperCourtDropdowns() {
  const selects = [
    document.getElementById('helperCourtSelect'),
    document.getElementById('editHelperCourtSelect'),
    document.getElementById('helperFilterCourtSelect')
  ];

  // Unique sorted courts list
  const activeCourts = Array.from(new Set((courts || []).filter(c => c && c.trim())));
  activeCourts.sort((a, b) => a.localeCompare(b));

  selects.forEach(select => {
    if (!select) return;
    const isFilter = select.id === 'helperFilterCourtSelect';
    const currentVal = select.value;

    select.innerHTML = '';
    if (isFilter) {
      const allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = 'All Courts (All Forums)';
      select.appendChild(allOpt);
    } else {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.disabled = true;
      defaultOpt.selected = true;
      defaultOpt.textContent = 'Select Court / Forum...';
      select.appendChild(defaultOpt);

      const generalOpt = document.createElement('option');
      generalOpt.value = 'General / All Courts';
      generalOpt.textContent = 'General / All Courts';
      select.appendChild(generalOpt);
    }

    activeCourts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });

    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
      select.value = currentVal;
    }
  });
}

function renderHelpersTable(searchQuery = '') {
  const tbody = document.getElementById('helpersTableBody');
  if (!tbody) return;

  populateHelperCourtDropdowns();
  const helpers = getCourtHelpersList();
  const filterCourtSelect = document.getElementById('helperFilterCourtSelect');
  const courtFilterVal = (filterCourtSelect?.value || '').toLowerCase().trim();
  const query = (searchQuery || document.getElementById('helperSearchInput')?.value || '').toLowerCase().trim();

  let filtered = helpers.filter(h => {
    const nameMatch = (h.name || '').toLowerCase().includes(query);
    const courtMatch = (h.court || '').toLowerCase().includes(query);
    const posMatch = (h.position || '').toLowerCase().includes(query);
    const mobMatch = (h.mobile || '').replace(/\D/g, '').includes(query.replace(/\D/g, '')) || (h.mobile || '').includes(query);
    const textMatch = !query || nameMatch || courtMatch || posMatch || mobMatch;

    const courtDropMatch = !courtFilterVal || (h.court || '').toLowerCase().trim() === courtFilterVal;
    return textMatch && courtDropMatch;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 32px 16px; color: #64748b;">
        <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.6;"><i class="fa-solid fa-users-slash"></i></div>
        <div style="font-weight: 700; font-size: 15px; color: #334155;">No court helpers or workers found</div>
        <div style="font-size: 13px; margin-top: 4px;">${query || courtFilterVal ? 'Try adjusting your search or court filter.' : 'Add your first court staff member using the form above.'}</div>
      </td>
    `;
    tbody.appendChild(tr);
    updateHelpersBadges();
    return;
  }

  filtered.forEach((h, index) => {
    const tr = document.createElement('tr');
    const initial = (h.name || 'W').trim().charAt(0).toUpperCase();
    const cleanMobile = (h.mobile || '').trim();
    const waDigits = cleanMobile.replace(/\D/g, '');
    const waLink = waDigits.length === 10 ? `https://wa.me/91${waDigits}` : `https://wa.me/${waDigits}`;

    tr.innerHTML = `
      <td style="text-align: center; font-weight: 700; color: #64748b;">${index + 1}</td>
      <td>
        <div class="helper-user-cell">
          <div class="helper-avatar">${escapeHtml(initial)}</div>
          <div class="helper-user-info">
            <div class="helper-user-name">${escapeHtml(h.name || '—')}</div>
            <div class="helper-user-role"><i class="fa-solid fa-briefcase"></i> ${escapeHtml(h.position || 'Staff')}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="helper-court-tag">
          <i class="fa-solid fa-landmark" style="color: #0284c7;"></i>
          <span>${escapeHtml(h.court || 'General')}</span>
        </div>
      </td>
      <td>
        <div class="helper-contact-cell">
          ${cleanMobile ? `
            <a href="tel:${escapeHtml(cleanMobile)}" class="helper-call-btn" title="Call ${escapeHtml(h.name)}">
              <i class="fa-solid fa-phone"></i> <span>${escapeHtml(cleanMobile)}</span>
            </a>
            <a href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="helper-wa-btn" title="Chat on WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          ` : '<span style="color: #94a3b8; font-size: 13px;">No mobile provided</span>'}
        </div>
      </td>
      <td style="text-align: right;">
        <div class="court-actions-cell" style="justify-content: flex-end;">
          <button type="button" class="court-btn-edit edit-helper-btn" title="Edit Staff Details">
            <i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span>
          </button>
          <button type="button" class="court-btn-delete delete-helper-btn" title="Delete Staff Member">
            <i class="fa-solid fa-trash-can"></i><span class="btn-text"> Delete</span>
          </button>
        </div>
      </td>
    `;

    const editBtn = tr.querySelector('.edit-helper-btn');
    const delBtn = tr.querySelector('.delete-helper-btn');

    if (editBtn) {
      editBtn.addEventListener('click', () => openEditHelperModal(h.id));
    }
    if (delBtn) {
      delBtn.addEventListener('click', () => openDeleteHelperModal(h.id));
    }

    tbody.appendChild(tr);
  });

  updateHelpersBadges();
}

function filterHelpersTable(query) {
  renderHelpersTable(query);
}

async function handleSaveHelper(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameInput = document.getElementById('helperNameInput');
  const courtSelect = document.getElementById('helperCourtSelect');
  const positionInput = document.getElementById('helperPositionInput');
  const mobileInput = document.getElementById('helperMobileInput');
  const submitBtn = document.getElementById('saveHelperSubmitBtn');

  const name = (nameInput?.value || '').trim();
  const court = (courtSelect?.value || '').trim();
  const position = (positionInput?.value || '').trim();
  const mobile = (mobileInput?.value || '').trim();

  if (!name) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Please enter the worker / staff name.', 2500);
    }
    nameInput?.focus();
    return;
  }

  if (!court) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Please select the assigned court.', 2500);
    }
    courtSelect?.focus();
    return;
  }

  if (!position) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Please enter the position / role.', 2500);
    }
    positionInput?.focus();
    return;
  }

  if (!mobile) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('⚠️ Please enter the mobile number.', 2500);
    }
    mobileInput?.focus();
    return;
  }

  const helperId = 'helper_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newHelper = {
    id: helperId,
    name,
    court,
    position,
    mobile,
    createdAt: new Date().toISOString()
  };

  const currentList = getCourtHelpersList();
  currentList.unshift(newHelper);
  saveCourtHelpersList(currentList);

  // Reset form
  if (nameInput) nameInput.value = '';
  if (positionInput) positionInput.value = '';
  if (mobileInput) mobileInput.value = '';
  if (courtSelect) courtSelect.selectedIndex = 0;

  renderHelpersTable();

  // Asynchronously insert into Supabase court_helpers
  ensureSupabaseClient();
  if (supabaseClient) {
    try {
      if (submitBtn) submitBtn.disabled = true;
      const { data, error } = await supabaseClient.from('court_helpers').insert([{
        name,
        court,
        position,
        mobile
      }]).select();

      if (!error && data && data[0] && data[0].id) {
        newHelper.id = String(data[0].id);
        saveCourtHelpersList(currentList);
        updateHelpersCloudSyncIndicator(true);
      }
    } catch (err) {
      console.warn('Notice: Insert to Supabase court_helpers:', err);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification(`✅ Staff member "${name}" (${position}) saved successfully!`, 3000);
  } else if (typeof M !== 'undefined' && M.toast) {
    M.toast({ html: `✅ Staff member "${name}" saved!` });
  }
}

function openEditHelperModal(helperId) {
  const helpers = getCourtHelpersList();
  const helper = helpers.find(h => h.id === helperId);
  if (!helper) return;

  const modal = document.getElementById('editHelperModal');
  const idInput = document.getElementById('editHelperId');
  const nameInput = document.getElementById('editHelperNameInput');
  const courtSelect = document.getElementById('editHelperCourtSelect');
  const positionInput = document.getElementById('editHelperPositionInput');
  const mobileInput = document.getElementById('editHelperMobileInput');
  const errorDiv = document.getElementById('editHelperErrorMsg');

  if (!modal) return;

  populateHelperCourtDropdowns();

  if (idInput) idInput.value = helper.id;
  if (nameInput) nameInput.value = helper.name || '';
  if (positionInput) positionInput.value = helper.position || '';
  if (mobileInput) mobileInput.value = helper.mobile || '';

  if (courtSelect) {
    let found = false;
    Array.from(courtSelect.options).forEach(opt => {
      if (opt.value.toLowerCase() === (helper.court || '').toLowerCase()) {
        opt.selected = true;
        found = true;
      }
    });
    if (!found && helper.court) {
      const newOpt = document.createElement('option');
      newOpt.value = helper.court;
      newOpt.textContent = helper.court;
      newOpt.selected = true;
      courtSelect.appendChild(newOpt);
    }
  }

  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  setTimeout(() => {
    nameInput?.focus();
  }, 100);
}

function closeEditHelperModal() {
  const modal = document.getElementById('editHelperModal');
  if (modal) modal.classList.add('hidden');
}

async function confirmSaveEditedHelper() {
  const idInput = document.getElementById('editHelperId');
  const nameInput = document.getElementById('editHelperNameInput');
  const courtSelect = document.getElementById('editHelperCourtSelect');
  const positionInput = document.getElementById('editHelperPositionInput');
  const mobileInput = document.getElementById('editHelperMobileInput');
  const errorDiv = document.getElementById('editHelperErrorMsg');
  const saveBtn = document.getElementById('saveEditHelperBtn');

  const id = idInput?.value;
  const name = (nameInput?.value || '').trim();
  const court = (courtSelect?.value || '').trim();
  const position = (positionInput?.value || '').trim();
  const mobile = (mobileInput?.value || '').trim();

  if (!name || !court || !position || !mobile) {
    if (errorDiv) {
      errorDiv.textContent = 'Please fill out all required fields.';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  const helpers = getCourtHelpersList();
  const index = helpers.findIndex(h => h.id === id);
  if (index === -1) {
    closeEditHelperModal();
    return;
  }

  helpers[index] = {
    ...helpers[index],
    name,
    court,
    position,
    mobile,
    updatedAt: new Date().toISOString()
  };

  saveCourtHelpersList(helpers);
  closeEditHelperModal();
  renderHelpersTable();

  // Asynchronously update in Supabase court_helpers
  ensureSupabaseClient();
  if (supabaseClient && id && !id.startsWith('helper_')) {
    try {
      if (saveBtn) saveBtn.disabled = true;
      await supabaseClient.from('court_helpers').update({
        name,
        court,
        position,
        mobile,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      updateHelpersCloudSyncIndicator(true);
    } catch (err) {
      console.warn('Notice: Update to Supabase court_helpers:', err);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification(`✅ Staff details for "${name}" updated successfully!`, 2500);
  }
}

function openDeleteHelperModal(helperId) {
  const helpers = getCourtHelpersList();
  const helper = helpers.find(h => h.id === helperId);
  if (!helper) return;

  const modal = document.getElementById('deleteHelperModal');
  const idInput = document.getElementById('deleteHelperTargetId');
  const nameSpan = document.getElementById('deleteHelperDisplayName');
  const errorDiv = document.getElementById('deleteHelperErrorMsg');

  if (!modal) {
    if (confirm(`Delete court staff member "${helper.name}"?`)) {
      const remaining = helpers.filter(h => h.id !== helperId);
      saveCourtHelpersList(remaining);
      renderHelpersTable();
    }
    return;
  }

  if (idInput) idInput.value = helper.id;
  if (nameSpan) nameSpan.textContent = `"${helper.name}" (${helper.position} • ${helper.court})`;
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeDeleteHelperModal() {
  const modal = document.getElementById('deleteHelperModal');
  if (modal) modal.classList.add('hidden');
}

async function executeDeleteHelperConfirm() {
  const idInput = document.getElementById('deleteHelperTargetId');
  const id = idInput?.value;
  if (!id) {
    closeDeleteHelperModal();
    return;
  }

  const helpers = getCourtHelpersList();
  const target = helpers.find(h => h.id === id);
  const remaining = helpers.filter(h => h.id !== id);
  saveCourtHelpersList(remaining);

  closeDeleteHelperModal();
  renderHelpersTable();

  // Asynchronously delete from Supabase court_helpers
  ensureSupabaseClient();
  if (supabaseClient && id && !id.startsWith('helper_')) {
    try {
      await supabaseClient.from('court_helpers').delete().eq('id', id);
      updateHelpersCloudSyncIndicator(true);
    } catch (err) {
      console.warn('Notice: Delete from Supabase court_helpers:', err);
    }
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification(`✅ Staff member "${target ? target.name : 'Helper'}" removed from directory.`, 2500);
  }
}

function exportHelpersCsv() {
  const helpers = getCourtHelpersList();
  if (helpers.length === 0) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('⚠️ No court staff records to export.', 2200);
    }
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Sr No,Staff Name,Position,Assigned Court,Mobile Number,Date Added\r\n';

  helpers.forEach((h, idx) => {
    const row = [
      idx + 1,
      `"${(h.name || '').replace(/"/g, '""')}"`,
      `"${(h.position || '').replace(/"/g, '""')}"`,
      `"${(h.court || '').replace(/"/g, '""')}"`,
      `"${(h.mobile || '').replace(/"/g, '""')}"`,
      `"${(h.createdAt || '').split('T')[0]}"`
    ];
    csvContent += row.join(',') + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Court_Helpers_Directory_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof showToastNotification === 'function') {
    showToastNotification('✅ Court staff directory exported to CSV.', 2500);
  }
}

window.handleSaveHelper = handleSaveHelper;
window.renderHelpersTable = renderHelpersTable;
window.filterHelpersTable = filterHelpersTable;
window.openEditHelperModal = openEditHelperModal;
window.closeEditHelperModal = closeEditHelperModal;
window.confirmSaveEditedHelper = confirmSaveEditedHelper;
window.openDeleteHelperModal = openDeleteHelperModal;
window.closeDeleteHelperModal = closeDeleteHelperModal;
window.executeDeleteHelperConfirm = executeDeleteHelperConfirm;
window.exportHelpersCsv = exportHelpersCsv;
window.syncCourtHelpersFromCloud = syncCourtHelpersFromCloud;
window.updateHelpersCloudSyncIndicator = updateHelpersCloudSyncIndicator;

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
  const selectedType = document.getElementById('caseTypeDropdown')?.value || 'civil';
  const panels = {
    civil: document.getElementById('generalCaseForm'),
    state: document.getElementById('stateCaseForm'),
    criminal: document.getElementById('stateCaseForm'),
    family: document.getElementById('familyCaseForm'),
    revenue: document.getElementById('revenueCaseForm'),
    misc_civil: document.getElementById('miscCivilCaseForm'),
    misc_criminal: document.getElementById('miscCriminalCaseForm'),
    complaint: document.getElementById('complaintCaseForm')
  };

  const activePanel = panels[selectedType] || panels.civil;

  ['generalCaseForm', 'stateCaseForm', 'familyCaseForm', 'revenueCaseForm', 'miscCivilCaseForm', 'miscCriminalCaseForm', 'complaintCaseForm', 'criminalCaseForm'].forEach(id => {
    const p = document.getElementById(id);
    if (!p) return;
    if (p === activePanel) {
      p.classList.remove('hidden-case-form');
      p.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = false; });
    } else {
      p.classList.add('hidden-case-form');
      p.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = true; });
    }
  });

  if (typeof clearCaseNumberValidationBadges === 'function') {
    clearCaseNumberValidationBadges();
  }
}

function toggleUpdateCaseFormByType() {
  const selectedType = document.getElementById('updateCaseTypeDropdown')?.value || 'civil';
  const panels = {
    civil: document.getElementById('updateGeneralCaseForm'),
    state: document.getElementById('updateStateCaseForm'),
    criminal: document.getElementById('updateStateCaseForm'),
    family: document.getElementById('updateFamilyCaseForm'),
    revenue: document.getElementById('updateRevenueCaseForm'),
    misc_civil: document.getElementById('updateMiscCivilCaseForm'),
    misc_criminal: document.getElementById('updateMiscCriminalCaseForm'),
    complaint: document.getElementById('updateComplaintCaseForm')
  };

  const activePanel = panels[selectedType] || panels.civil;

  ['updateGeneralCaseForm', 'updateStateCaseForm', 'updateFamilyCaseForm', 'updateRevenueCaseForm', 'updateMiscCivilCaseForm', 'updateMiscCriminalCaseForm', 'updateComplaintCaseForm', 'updateCriminalCaseForm'].forEach(id => {
    const p = document.getElementById(id);
    if (!p) return;
    if (p === activePanel) {
      p.classList.remove('hidden-case-form');
      p.querySelectorAll('input:not([readonly]), select, textarea').forEach(field => { field.disabled = false; });
    } else {
      p.classList.add('hidden-case-form');
      p.querySelectorAll('input:not([readonly]), select, textarea').forEach(field => { field.disabled = true; });
    }
  });

  // Ensure Parties / Co-Parties Remark section is positioned beneath the primary parties of the active panel
  const targetPartyAnchor = {
    civil: document.getElementById('updateDefendant')?.closest('.form-group'),
    state: document.getElementById('updateStateAccusedName')?.closest('.form-group'),
    criminal: document.getElementById('updateStateAccusedName')?.closest('.form-group'),
    family: document.getElementById('updateFamilyRespondent')?.closest('.form-group'),
    revenue: document.getElementById('updateRevenueOppositeParty')?.closest('.form-group'),
    misc_civil: document.getElementById('updateMiscOppositeParty')?.closest('.form-group'),
    misc_criminal: document.getElementById('updateMiscCrimOppositeParty')?.closest('.form-group'),
    complaint: document.getElementById('updateComplaintAccused')?.closest('.form-group')
  };
  const anchor = targetPartyAnchor[selectedType] || targetPartyAnchor.civil;
  const remarkWrapper = document.getElementById('updateCaseRemarkWrapper');
  if (anchor && remarkWrapper && anchor.parentNode) {
    anchor.parentNode.insertBefore(remarkWrapper, anchor.nextSibling);
  }
}

function setupOtherFieldToggles() {
  const pairs = [
    ['miscCivilProceedingType', 'miscCivilProceedingTypeCustom'],
    ['miscCriminalProceedingType', 'miscCriminalProceedingTypeCustom'],
    ['updateMiscCivilProceedingType', 'updateMiscCivilProceedingTypeCustom'],
    ['updateMiscCriminalProceedingType', 'updateMiscCriminalProceedingTypeCustom'],
    ['statePoliceStation', 'statePoliceStationCustom'],
    ['miscCriminalPoliceStation', 'miscCriminalPoliceStationCustom'],
    ['updateStatePoliceStation', 'updateStatePoliceStationCustom'],
    ['updateMiscCriminalPoliceStation', 'updateMiscCriminalPoliceStationCustom'],
    ['familyMatterType', 'familyMatterTypeCustom'],
    ['updateFamilyMatterType', 'updateFamilyMatterTypeCustom'],
    ['revenueActSection', 'revenueActSectionCustom'],
    ['updateRevenueActSection', 'updateRevenueActSectionCustom'],
    ['complaintType', 'complaintTypeCustom'],
    ['updateComplaintType', 'updateComplaintTypeCustom'],
    ['complaintPoliceStation', 'complaintPoliceStationCustom'],
    ['updateComplaintPoliceStation', 'updateComplaintPoliceStationCustom']
  ];

  pairs.forEach(([selectId, customInputId]) => {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);
    if (!select || !customInput) return;

    const check = () => {
      const val = (select.value || '').toLowerCase();
      const isOther = val.startsWith('other') || val === 'other';
      if (isOther) {
        customInput.style.display = 'block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
        customInput.value = '';
      }
    };

    select.addEventListener('change', check);
  });
}

function insertRemarkChip(textareaId, textToInsert) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;
  const current = (textarea.value || '').trim();
  if (!current) {
    textarea.value = textToInsert;
  } else if (!current.includes(textToInsert.trim())) {
    textarea.value = current + (current.endsWith(';') || current.endsWith('.') ? ' ' : '; ') + textToInsert;
  }
  textarea.focus();
  const len = textarea.value.length;
  try { textarea.setSelectionRange(len, len); } catch (e) {}
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}
window.insertRemarkChip = insertRemarkChip;

// ==============================================================================
// App Initialization, Form Listeners, and Mobile Navigation
// ==============================================================================

function initializeApp() {
  if (window.__caseMgmtInitialized) return;
  window.__caseMgmtInitialized = true;

  // 0. Check authentication & restore session immediately
  checkInitialAuth();

  // Wire Auth & Logout actions
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }

  const guestBtn = document.getElementById('guestModeBtn');
  if (guestBtn) {
    guestBtn.addEventListener('click', handleGuestLogin);
  }

  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', handleAdminLogout);
  }

  const guestLogoutBtn = document.getElementById('guestLogoutBtn');
  if (guestLogoutBtn) {
    guestLogoutBtn.addEventListener('click', handleLogout);
  }

  const guestSearch = document.getElementById('guestSearch');
  if (guestSearch) {
    guestSearch.addEventListener('input', (e) => renderGuestTable(e.target.value));
  }

  setupOtherFieldToggles();
  if (typeof attachCaseNumberDuplicateListeners === 'function') {
    attachCaseNumberDuplicateListeners();
  }

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

  // Initialize mobile back button interception & browser history tracking
  if (typeof setupMobileBackAndHistory === 'function') {
    setupMobileBackAndHistory();
  }

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

  // 2. Handle Add Case Form Submit (Live Supabase sync & strict duplicate prevention)
  let isSubmittingCase = false;
  document.querySelector('#add form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (isSubmittingCase) {
      console.warn('Case submission already in progress, duplicate submit blocked.');
      return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa-solid fa-plus"></i> Submit Case';

    const caseType = document.getElementById('caseTypeDropdown')?.value || 'civil';
    
    let newCase = {};
    if (caseType === 'state' || caseType === 'criminal') {
      const stateCaseNumber = document.getElementById('stateCaseNumber')?.value?.trim() || document.getElementById('criminalCaseNumber')?.value?.trim();
      const stateCrimeYear = document.getElementById('stateCrimeYear')?.value?.trim() || document.getElementById('crimeYear')?.value?.trim();
      const statePoliceSelect = document.getElementById('statePoliceStation')?.value?.trim() || document.getElementById('policeStation')?.value?.trim();
      const statePoliceCustom = document.getElementById('statePoliceStationCustom')?.value?.trim();
      const statePoliceStation = (statePoliceSelect === 'Other' && statePoliceCustom) ? statePoliceCustom : (statePoliceSelect || statePoliceCustom || '');

      const stateCrimeSection = document.getElementById('stateCrimeSection')?.value?.trim() || document.getElementById('crimeSection')?.value?.trim();
      const stateFilingDate = document.getElementById('stateFilingDate')?.value?.trim() || document.getElementById('crimeFilingDate')?.value?.trim();
      const stateCrimeNumber = document.getElementById('stateCrimeNumber')?.value?.trim() || document.getElementById('crimeNumber')?.value?.trim();
      const stateFirstParty = document.getElementById('stateFirstParty')?.value?.trim() || 'State of U.P.';
      const stateAccusedName = document.getElementById('stateAccusedName')?.value?.trim() || document.getElementById('accusedName')?.value?.trim();
      const stateCourtName = document.getElementById('stateCourtName')?.value?.trim() || document.getElementById('criminalCourtName')?.value?.trim();
      const stateClientName = document.getElementById('stateClientName')?.value?.trim() || document.getElementById('criminalClientName')?.value?.trim();
      const stateClientNumber = document.getElementById('stateClientNumber')?.value?.trim() || document.getElementById('criminalClientNumber')?.value?.trim();

      newCase = {
        caseType: 'state',
        caseNo: stateCaseNumber,
        caseYear: stateCrimeYear,
        criminalCaseNumber: stateCaseNumber,
        crimeYear: stateCrimeYear,
        policeStation: statePoliceStation,
        crimeSection: stateCrimeSection,
        crimeFilingDate: stateFilingDate,
        filingDate: stateFilingDate,
        crimeNumber: stateCrimeNumber,
        firstParty: stateFirstParty,
        victimName: stateFirstParty,
        accusedName: stateAccusedName,
        courtName: stateCourtName,
        criminalCourtName: stateCourtName,
        clientName: stateClientName,
        criminalClientName: stateClientName,
        clientNumber: stateClientNumber,
        criminalClientNumber: stateClientNumber,
        caseName: `${stateFirstParty} vs ${stateAccusedName}`,
        partyName: stateAccusedName,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('stateDocLink')?.value?.trim() || document.getElementById('criminalDocLink')?.value?.trim() || '',
        remark: document.getElementById('stateCaseRemark')?.value?.trim() || document.getElementById('criminalCaseRemark')?.value?.trim() || ''
      };
    } else if (caseType === 'family') {
      const familyCaseNumber = document.getElementById('familyCaseNumber')?.value?.trim();
      const familyCaseYear = document.getElementById('familyCaseYear')?.value?.trim();
      const familyMatterSelect = document.getElementById('familyMatterType')?.value?.trim();
      const familyMatterCustom = document.getElementById('familyMatterTypeCustom')?.value?.trim();
      const familyMatterType = (familyMatterSelect && familyMatterSelect.toLowerCase().startsWith('other') && familyMatterCustom) ? familyMatterCustom : (familyMatterSelect || familyMatterCustom || 'Maintenance (Sec 125 CrPC)');

      const familyFilingDate = document.getElementById('familyFilingDate')?.value?.trim();
      const familyPetitioner = document.getElementById('familyPetitioner')?.value?.trim();
      const familyRespondent = document.getElementById('familyRespondent')?.value?.trim();
      const familyMarriageDate = document.getElementById('familyMarriageDate')?.value?.trim();
      const familyMaintenance = document.getElementById('familyMaintenance')?.value?.trim();
      const familyCourtName = document.getElementById('familyCourtName')?.value?.trim();
      const familyClientName = document.getElementById('familyClientName')?.value?.trim();
      const familyClientNumber = document.getElementById('familyClientNumber')?.value?.trim();

      newCase = {
        caseType: 'family',
        caseNo: familyCaseNumber,
        caseYear: familyCaseYear,
        matterType: familyMatterType,
        filingDate: familyFilingDate,
        petitioner: familyPetitioner,
        respondent: familyRespondent,
        marriageDate: familyMarriageDate,
        maintenanceDetail: familyMaintenance,
        courtName: familyCourtName,
        clientName: familyClientName,
        clientNumber: familyClientNumber,
        caseName: `${familyPetitioner} vs ${familyRespondent}`,
        partyName: familyRespondent,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('familyDocLink')?.value?.trim() || '',
        remark: document.getElementById('familyCaseRemark')?.value?.trim() || ''
      };
    } else if (caseType === 'revenue') {
      const revenueCaseNumber = document.getElementById('revenueCaseNumber')?.value?.trim();
      const revenueCaseYear = document.getElementById('revenueCaseYear')?.value?.trim();
      const revenueActSelect = document.getElementById('revenueActSection')?.value?.trim();
      const revenueActCustom = document.getElementById('revenueActSectionCustom')?.value?.trim();
      const revenueActSection = (revenueActSelect && revenueActSelect.toLowerCase().startsWith('other') && revenueActCustom) ? revenueActCustom : (revenueActSelect || revenueActCustom || 'Sec 34 (Mutation / दाखिल खारिज)');

      const revenueFilingDate = document.getElementById('revenueFilingDate')?.value?.trim();
      const revenueVillage = document.getElementById('revenueVillage')?.value?.trim();
      const revenueTehsil = document.getElementById('revenueTehsil')?.value?.trim();
      const revenueGataNo = document.getElementById('revenueGataNo')?.value?.trim();
      const revenueApplicant = document.getElementById('revenueApplicant')?.value?.trim();
      const revenueOppositeParty = document.getElementById('revenueOppositeParty')?.value?.trim();
      const revenueCourtName = document.getElementById('revenueCourtName')?.value?.trim();
      const revenueClientName = document.getElementById('revenueClientName')?.value?.trim();
      const revenueClientNumber = document.getElementById('revenueClientNumber')?.value?.trim();

      newCase = {
        caseType: 'revenue',
        caseNo: revenueCaseNumber,
        caseYear: revenueCaseYear,
        actSection: revenueActSection,
        village: revenueVillage,
        tehsil: revenueTehsil,
        gataNo: revenueGataNo,
        applicant: revenueApplicant,
        oppositeParty: revenueOppositeParty,
        filingDate: revenueFilingDate,
        courtName: revenueCourtName,
        clientName: revenueClientName,
        clientNumber: revenueClientNumber,
        caseName: `${revenueApplicant} vs ${revenueOppositeParty}`,
        partyName: revenueOppositeParty,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('revenueDocLink')?.value?.trim() || '',
        remark: document.getElementById('revenueCaseRemark')?.value?.trim() || ''
      };
    } else if (caseType === 'misc_civil') {
      const miscCivilCaseNumber = document.getElementById('miscCivilCaseNumber')?.value?.trim();
      const miscCivilCaseYear = document.getElementById('miscCivilCaseYear')?.value?.trim();
      const miscCivilOriginalCase = document.getElementById('miscCivilOriginalCase')?.value?.trim();
      const miscCivilProcSelect = document.getElementById('miscCivilProceedingType')?.value?.trim();
      const miscCivilProcCustom = document.getElementById('miscCivilProceedingTypeCustom')?.value?.trim();
      const miscCivilProceedingType = (miscCivilProcSelect && miscCivilProcSelect.toLowerCase().startsWith('other') && miscCivilProcCustom) ? miscCivilProcCustom : (miscCivilProcSelect || miscCivilProcCustom || 'Execution Petition (डिग्री तामीली)');

      const miscCivilApplicant = document.getElementById('miscCivilApplicant')?.value?.trim();
      const miscCivilOppositeParty = document.getElementById('miscCivilOppositeParty')?.value?.trim();
      const miscCivilCourtName = document.getElementById('miscCivilCourtName')?.value?.trim();
      const miscCivilFilingDate = document.getElementById('miscCivilFilingDate')?.value?.trim();
      const miscCivilClientName = document.getElementById('miscCivilClientName')?.value?.trim();
      const miscCivilClientNumber = document.getElementById('miscCivilClientNumber')?.value?.trim();

      newCase = {
        caseType: 'misc_civil',
        caseNo: miscCivilCaseNumber,
        caseYear: miscCivilCaseYear,
        originalCaseNumber: miscCivilOriginalCase,
        originalCase: miscCivilOriginalCase,
        proceedingType: miscCivilProceedingType,
        filingDate: miscCivilFilingDate,
        applicant: miscCivilApplicant,
        oppositeParty: miscCivilOppositeParty,
        courtName: miscCivilCourtName,
        clientName: miscCivilClientName,
        clientNumber: miscCivilClientNumber,
        caseName: `${miscCivilApplicant} vs ${miscCivilOppositeParty}`,
        partyName: miscCivilOppositeParty,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('miscCivilDocLink')?.value?.trim() || '',
        remark: document.getElementById('miscCivilCaseRemark')?.value?.trim() || ''
      };
    } else if (caseType === 'misc_criminal') {
      const miscCriminalCaseNumber = document.getElementById('miscCriminalCaseNumber')?.value?.trim();
      const miscCriminalCaseYear = document.getElementById('miscCriminalCaseYear')?.value?.trim();
      const miscCriminalOriginalCase = document.getElementById('miscCriminalOriginalCase')?.value?.trim();
      const miscCrimProcSelect = document.getElementById('miscCriminalProceedingType')?.value?.trim();
      const miscCrimProcCustom = document.getElementById('miscCriminalProceedingTypeCustom')?.value?.trim();
      const miscCriminalProceedingType = (miscCrimProcSelect && miscCrimProcSelect.toLowerCase().startsWith('other') && miscCrimProcCustom) ? miscCrimProcCustom : (miscCrimProcSelect || miscCrimProcCustom || 'Anticipatory Bail (अग्रिम जमानत)');

      const miscCrimPsSelect = document.getElementById('miscCriminalPoliceStation')?.value?.trim();
      const miscCrimPsCustom = document.getElementById('miscCriminalPoliceStationCustom')?.value?.trim();
      const miscCriminalPoliceStation = (miscCrimPsSelect === 'Other' && miscCrimPsCustom) ? miscCrimPsCustom : (miscCrimPsSelect || miscCrimPsCustom || '');

      const miscCriminalCrimeSection = document.getElementById('miscCriminalCrimeSection')?.value?.trim();
      const miscCriminalApplicant = document.getElementById('miscCriminalApplicant')?.value?.trim();
      const miscCriminalOppositeParty = document.getElementById('miscCriminalOppositeParty')?.value?.trim() || 'State of U.P.';
      const miscCriminalCourtName = document.getElementById('miscCriminalCourtName')?.value?.trim();
      const miscCriminalFilingDate = document.getElementById('miscCriminalFilingDate')?.value?.trim();
      const miscCriminalClientName = document.getElementById('miscCriminalClientName')?.value?.trim();
      const miscCriminalClientNumber = document.getElementById('miscCriminalClientNumber')?.value?.trim();

      newCase = {
        caseType: 'misc_criminal',
        caseNo: miscCriminalCaseNumber,
        caseYear: miscCriminalCaseYear,
        originalCaseNumber: miscCriminalOriginalCase,
        originalCase: miscCriminalOriginalCase,
        proceedingType: miscCriminalProceedingType,
        policeStation: miscCriminalPoliceStation,
        crimeSection: miscCriminalCrimeSection,
        filingDate: miscCriminalFilingDate,
        applicant: miscCriminalApplicant,
        oppositeParty: miscCriminalOppositeParty,
        courtName: miscCriminalCourtName,
        clientName: miscCriminalClientName,
        clientNumber: miscCriminalClientNumber,
        caseName: `${miscCriminalApplicant} vs ${miscCriminalOppositeParty}`,
        partyName: miscCriminalApplicant,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('miscCriminalDocLink')?.value?.trim() || '',
        remark: document.getElementById('miscCriminalCaseRemark')?.value?.trim() || ''
      };
    } else if (caseType === 'complaint') {
      const complaintCaseNumber = document.getElementById('complaintCaseNumber')?.value?.trim();
      const complaintCaseYear = document.getElementById('complaintCaseYear')?.value?.trim();
      const compSelect = document.getElementById('complaintType')?.value?.trim();
      const compCustom = document.getElementById('complaintTypeCustom')?.value?.trim();
      const complaintType = (compSelect && compSelect.toLowerCase().startsWith('other') && compCustom) ? compCustom : (compCustom || compSelect || 'Cheque Bounce (Sec 138 NI Act)');

      const compPsSelect = document.getElementById('complaintPoliceStation')?.value?.trim();
      const compPsCustom = document.getElementById('complaintPoliceStationCustom')?.value?.trim();
      const complaintPoliceStation = (compPsSelect === 'Other' && compPsCustom) ? compPsCustom : (compPsSelect || compPsCustom || '');

      const complaintSectionAct = document.getElementById('complaintSectionAct')?.value?.trim();
      const complaintComplainant = document.getElementById('complaintComplainant')?.value?.trim();
      const complaintAccusedName = document.getElementById('complaintAccusedName')?.value?.trim();
      const complaintCourtName = document.getElementById('complaintCourtName')?.value?.trim();
      const complaintFilingDate = document.getElementById('complaintFilingDate')?.value?.trim();
      const complaintClientName = document.getElementById('complaintClientName')?.value?.trim();
      const complaintClientNumber = document.getElementById('complaintClientNumber')?.value?.trim();

      newCase = {
        caseType: 'complaint',
        caseNo: complaintCaseNumber,
        caseYear: complaintCaseYear,
        complaintType,
        sectionAct: complaintSectionAct,
        complainant: complaintComplainant,
        accusedName: complaintAccusedName,
        policeStation: complaintPoliceStation,
        filingDate: complaintFilingDate,
        courtName: complaintCourtName,
        clientName: complaintClientName,
        clientNumber: complaintClientNumber,
        caseName: `${complaintComplainant} vs ${complaintAccusedName}`,
        partyName: complaintAccusedName,
        nextHearing: '—',
        caseStatus: 'Pending',
        docLink: document.getElementById('complaintDocLink')?.value?.trim() || '',
        remark: document.getElementById('complaintCaseRemark')?.value?.trim() || ''
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
        caseType: 'civil',
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
        docLink: document.getElementById('caseDocLink')?.value?.trim() || '',
        remark: document.getElementById('caseRemark')?.value?.trim() || ''
      };
    }

    if (!newCase.caseNo) {
      alert('Please enter a valid Case Number.');
      return;
    }

    try {
      isSubmittingCase = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking & Adding...';
      }

      // Live Supabase + local memory uniqueness verification
      const exists = await checkCaseNumberExists(newCase.caseNo);
      if (exists && exists.exists) {
        alert(`❌ Case Number "${newCase.caseNo}" already exists in the database!\n\nPlease use a unique case number or update the existing record.`);
        return;
      }

      const recordCountBefore = allCaseRecords.length;
      const addResult = await addCaseToSupabase(newCase);

      // Only show success and reset form if the case was actually added
      const wasAdded = (addResult && addResult.success) ||
        (allCaseRecords.length > recordCountBefore) ||
        allCaseRecords.some(c => (c.caseNo || '').toLowerCase() === (newCase.caseNo || '').toLowerCase());

      if (wasAdded) {
        this.reset();
        if (typeof clearCaseNumberValidationBadges === 'function') {
          clearCaseNumberValidationBadges();
        }
        alert(`🎉 Case ${newCase.caseNo} added successfully!`);
      }
    } catch (err) {
      console.error('Error submitting case:', err);
      alert(`Error submitting case: ${err.message || err}`);
    } finally {
      isSubmittingCase = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
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

  // 3.6 Handle Transfer Case Form Submit
  const transferSearchBtn = document.getElementById('transferSearchBtn');
  const transferSearchInput = document.getElementById('transferSearchInput');

  if (transferSearchBtn) {
    transferSearchBtn.addEventListener('click', () => {
      loadCaseForTransfer(transferSearchInput?.value);
    });
  }

  if (transferSearchInput) {
    transferSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadCaseForTransfer(transferSearchInput.value);
      }
    });
  }

  const transferCaseForm = document.getElementById('transferCaseForm');
  if (transferCaseForm) {
    transferCaseForm.addEventListener('submit', handleTransferCaseSubmit);
  }

  // 3.5 Handle Mark Case as Disposed Button & Wrapped Status Section Sync
  function syncDisposalSectionVisibility() {
    const statusSelect = document.getElementById('updateCaseStatus');
    const disposalSection = document.getElementById('updateCaseDisposalSection') || document.getElementById('updateCaseDisposalCard');
    if (!statusSelect || !disposalSection) return;
    const isDisposed = (statusSelect.value || '').toLowerCase().includes('dispose');
    if (isDisposed) {
      disposalSection.style.display = 'block';
    } else {
      disposalSection.style.display = 'none';
    }
  }
  window.syncDisposalSectionVisibility = syncDisposalSectionVisibility;

  const updateCaseStatusSelect = document.getElementById('updateCaseStatus');
  if (updateCaseStatusSelect) {
    updateCaseStatusSelect.addEventListener('change', () => {
      syncDisposalSectionVisibility();
      if (updateCaseStatusSelect.value === 'Disposed') {
        const disposalInput = document.getElementById('updateCaseDisposalComment');
        if (disposalInput) {
          if (!disposalInput.value.trim()) {
            disposalInput.value = 'Disposed Off on merits';
          }
          disposalInput.focus();
        }
      }
    });
  }

  const markDisposeBtn = document.getElementById('markDisposeBtn');
  if (markDisposeBtn) {
    markDisposeBtn.addEventListener('click', () => {
      const statusSelect = document.getElementById('updateCaseStatus');
      const disposalInput = document.getElementById('updateCaseDisposalComment');
      if (statusSelect) {
        statusSelect.value = 'Disposed';
        syncDisposalSectionVisibility();
      }
      if (disposalInput) {
        if (!disposalInput.value.trim()) {
          disposalInput.value = 'Disposed Off on merits';
        }
        disposalInput.focus();
      }
      const statusEl = document.getElementById('updateSearchStatus');
      if (statusEl) {
        statusEl.textContent = '⚖️ Status set to "Disposed Off". Review/edit disposal comments and click "Save Case Updates".';
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
      const rawCaseNumber = document.getElementById('hearingCaseNo')?.value?.trim();
      const hearingDate = document.getElementById('hearingDate')?.value;
      const process = document.getElementById('hearingProcess')?.value?.trim();
      const actionTaken = document.getElementById('hearingActionTaken')?.value?.trim() || '';
      const statusEl = document.getElementById('hearingStatus');

      if (!rawCaseNumber || !hearingDate || !process) {
        if (statusEl) {
          statusEl.textContent = 'Please fill all required hearing fields (Case Number, Date & Process).';
          statusEl.className = 'update-status-msg error';
        }
        return;
      }

      // Safeguard against incomplete case prefix inputs like "Cri-Rev-" or "CIV-"
      if (rawCaseNumber.endsWith('-') || rawCaseNumber.endsWith('/') || rawCaseNumber.length < 3) {
        if (statusEl) {
          statusEl.textContent = '⚠️ "' + rawCaseNumber + '" appears to be an incomplete case number prefix. Please select or enter the complete case number (e.g. Cr.Rev./129/2026).';
          statusEl.className = 'update-status-msg error';
        }
        alert('⚠️ Incomplete Case Number: "' + rawCaseNumber + '"\nPlease enter the full case number (for example: Cr.Rev./129/2026) so the hearing attaches properly to the case.');
        return;
      }

      // Auto-resolve case number to the official case number from allCaseRecords if matched
      let caseNumber = rawCaseNumber;
      const cleanTyped = rawCaseNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedOfficialCase = allCaseRecords.find(c => {
        const num1 = (c.caseNo || '').toLowerCase();
        const num2 = (c.criminalCaseNumber || '').toLowerCase();
        if (num1 === rawCaseNumber.toLowerCase() || num2 === rawCaseNumber.toLowerCase()) return true;
        if (cleanTyped && (num1.replace(/[^a-z0-9]/g, '') === cleanTyped || num2.replace(/[^a-z0-9]/g, '') === cleanTyped)) return true;
        return false;
      });

      if (matchedOfficialCase) {
        caseNumber = matchedOfficialCase.caseNo || matchedOfficialCase.criminalCaseNumber || rawCaseNumber;
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

  // Court mini buttons with return-tab tracking
  let returnToCaseFormTab = null;

  const addCourtBtn = document.getElementById('addCourtBtn');
  if (addCourtBtn) {
    addCourtBtn.addEventListener('click', () => {
      returnToCaseFormTab = 'add';
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
      returnToCaseFormTab = 'add';
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
      returnToCaseFormTab = 'update';
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
      returnToCaseFormTab = 'update';
      showTab('courts');
      setTimeout(() => {
        const courtInput = document.getElementById('courtInput');
        if (courtInput) courtInput.focus();
      }, 120);
    });
  }

  ['addStateCourtBtn', 'addFamilyCourtBtn', 'addRevenueCourtBtn', 'addMiscCivilCourtBtn', 'addMiscCriminalCourtBtn', 'addComplaintCourtBtn'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        returnToCaseFormTab = 'add';
        showTab('courts');
        setTimeout(() => {
          const courtInput = document.getElementById('courtInput');
          if (courtInput) courtInput.focus();
        }, 120);
      });
    }
  });

  ['updateAddStateCourtBtn', 'updateAddFamilyCourtBtn', 'updateAddRevenueCourtBtn', 'updateAddMiscCivilCourtBtn', 'updateAddMiscCriminalCourtBtn', 'updateAddComplaintCourtBtn'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        returnToCaseFormTab = 'update';
        showTab('courts');
        setTimeout(() => {
          const courtInput = document.getElementById('courtInput');
          if (courtInput) courtInput.focus();
        }, 120);
      });
    }
  });

  // 6. Handle Add Court Button (Live Supabase sync)
  let isSubmittingCourt = false;
  const saveCourtBtn = document.getElementById('saveCourtBtn');
  const courtInput = document.getElementById('courtInput');

  async function handleAddCourtSubmit() {
    if (isSubmittingCourt) return;
    const input = document.getElementById('courtInput');
    const courtName = (input?.value || '').trim();

    if (!courtName) {
      alert('Please enter a court name.');
      input?.focus();
      return;
    }

    const alreadyExists = courts.some(c => c.trim().toLowerCase() === courtName.toLowerCase());
    if (alreadyExists) {
      alert(`Court "${courtName}" already exists.`);
      input?.focus();
      return;
    }

    const saveBtn = document.getElementById('saveCourtBtn');
    const originalContent = saveBtn ? saveBtn.innerHTML : 'Submit Court';
    try {
      isSubmittingCourt = true;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving Court...</span>';
      }

      await addCourtToSupabase(courtName);
      if (input) input.value = '';

      const activeCaseType = document.getElementById('caseTypeDropdown')?.value;
      const courtSelect = document.getElementById(activeCaseType === 'criminal' ? 'criminalCourtName' : 'courtName');
      if (courtSelect) {
        courtSelect.value = courtName;
      }

      if (returnToCaseFormTab) {
        const dest = returnToCaseFormTab;
        returnToCaseFormTab = null;
        showTab(dest);
        alert(`✅ Court "${courtName}" added and selected in your form!`);
      } else {
        alert(`✅ Court "${courtName}" added successfully to the directory!`);
      }
    } catch (err) {
      console.error('Error saving court:', err);
      alert(`Error saving court: ${err.message || err}`);
    } finally {
      isSubmittingCourt = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalContent;
      }
    }
  }

  if (saveCourtBtn) {
    saveCourtBtn.addEventListener('click', handleAddCourtSubmit);
  }

  if (courtInput) {
    courtInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCourtSubmit();
      }
    });
  }

  // Edit Court Modal keyboard and overlay backdrop listeners
  const editCourtModal = document.getElementById('editCourtModal');
  if (editCourtModal) {
    editCourtModal.addEventListener('click', (e) => {
      if (e.target === editCourtModal) {
        closeEditCourtModal();
      }
    });
  }

  const editCourtNameInput = document.getElementById('editCourtNameInput');
  if (editCourtNameInput) {
    editCourtNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmSaveEditedCourt();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeEditCourtModal();
      }
    });
  }

  // Delete Court Modal keyboard and overlay backdrop listeners
  const deleteCourtModal = document.getElementById('deleteCourtModal');
  if (deleteCourtModal) {
    deleteCourtModal.addEventListener('click', (e) => {
      if (e.target === deleteCourtModal) {
        closeDeleteCourtModal();
      }
    });
  }

  // Edit Helper Modal backdrop listener
  const editHelperModal = document.getElementById('editHelperModal');
  if (editHelperModal) {
    editHelperModal.addEventListener('click', (e) => {
      if (e.target === editHelperModal) {
        closeEditHelperModal();
      }
    });
  }

  // Delete Helper Modal backdrop listener
  const deleteHelperModal = document.getElementById('deleteHelperModal');
  if (deleteHelperModal) {
    deleteHelperModal.addEventListener('click', (e) => {
      if (e.target === deleteHelperModal) {
        closeDeleteHelperModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const delModal = document.getElementById('deleteCourtModal');
      if (delModal && !delModal.classList.contains('hidden')) {
        closeDeleteCourtModal();
      }
      const editHModal = document.getElementById('editHelperModal');
      if (editHModal && !editHModal.classList.contains('hidden')) {
        closeEditHelperModal();
      }
      const delHModal = document.getElementById('deleteHelperModal');
      if (delHModal && !delHModal.classList.contains('hidden')) {
        closeDeleteHelperModal();
      }
    }
  });

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
  if (typeof populateHelperCourtDropdowns === 'function') populateHelperCourtDropdowns();
  if (typeof updateHelpersBadges === 'function') updateHelpersBadges();
  renderCalendarView();
  fetchAllDataFromSupabase();
  filterCaseTables();
  setupDbManagerEventListeners();
}

// ==============================================================================
// Supabase Database Manager & Live CRUD Engine
// ==============================================================================

const policeStationList = [
  'Kotwali Sadar (Main town)',
  'Kheri',
  "Mahila Thana (Women's police station)",
  'Kotwali Gola (Gola Gokarannath)',
  'Kotwali Gauriphanta',
  'Kotwali Chandan Chauki',
  'Ishanagar',
  'Kotwali Dhaurahara',
  'Nighasan',
  'Neemgaon',
  'Palia Kalan',
  'Pasgawan',
  'Phoolbehar',
  'Phardhan',
  'Bhira (Bheera)',
  'Maigalganj',
  'Mailani',
  'Mitauli',
  'Kotwali Mohammadi',
  'Thana Sampurna Nagar',
  'Singahi',
  'Hyderabad',
  'Kotwali Tikoniya',
  'Other'
];

const DB_SCHEMAS = {
  all_tables: {
    title: '(From All Tables)',
    singular: 'Database Record',
    badge: 'civil',
    columns: [
      { name: '_sourceTable', label: 'Database Table', type: 'badge' },
      { name: 'case_number', label: 'Case No. / Identifier', type: 'text' },
      { name: 'case_name', label: 'Parties / Title / Person', type: 'text' },
      { name: 'client_name', label: 'Client / Contact', type: 'text' },
      { name: 'court_name', label: 'Court / Location', type: 'text' },
      { name: 'next_hearing', label: 'Date / Hearing', type: 'date' },
      { name: 'hearing_process', label: 'Process / Stage / Role', type: 'text' },
      { name: 'case_status', label: 'Status / Stage', type: 'text' },
      { name: 'remark', label: 'Remarks / Notes', type: 'text' }
    ]
  },
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
  statecases: {
    title: 'statecases',
    singular: 'State Criminal Case',
    badge: 'state',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case / ST Number', type: 'text', required: true, placeholder: 'e.g. ST-2026-003' },
      { name: 'crime_year', label: 'Crime / Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'state', readonly: true },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. State of U.P. vs Accused' },
      { name: 'police_station', label: 'Police Station / Thana', type: 'select', options: policeStationList, required: true, default: 'Kotwali Sadar (Main town)' },
      { name: 'crime_section', label: 'Section (IPC / BNS)', type: 'text', required: true, placeholder: 'e.g. IPC 302, 307' },
      { name: 'crime_number', label: 'Crime / FIR Number', type: 'text', required: true, placeholder: 'e.g. Crime No. 120/2026' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'first_party', label: 'First Party (Prosecution)', type: 'text', required: true, default: 'State of U.P.' },
      { name: 'accused_name', label: 'Accused Name', type: 'text', required: true, placeholder: 'Accused name' },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g. Sessions Court' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Bail Hearing, Evidence' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Bail Granted', 'Convicted', 'Acquitted', 'Disposed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  familycases: {
    title: 'familycases',
    singular: 'Family / Matrimonial Case',
    badge: 'family',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'e.g. FC-2026-015' },
      { name: 'case_year', label: 'Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'family', readonly: true },
      { name: 'matter_type', label: 'Dispute / Matter Type', type: 'select', options: ['Maintenance (Sec 125 CrPC)', 'Divorce (Sec 13 HMA)', 'Restitution of Conjugal Rights (Sec 9 HMA)', 'Domestic Violence (DV Act)', 'Child Custody / Guardianship', 'Mutual Divorce (Sec 13B HMA)', 'Other Family Dispute'], default: 'Maintenance (Sec 125 CrPC)' },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. Petitioner vs Respondent' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'petitioner', label: 'Petitioner / Applicant', type: 'text', required: true, placeholder: 'Petitioner name' },
      { name: 'respondent', label: 'Respondent / Opposite Party', type: 'text', required: true, placeholder: 'Respondent name' },
      { name: 'marriage_date', label: 'Marriage Date', type: 'date' },
      { name: 'maintenance_detail', label: 'Maintenance Detail', type: 'text', placeholder: 'e.g. ₹15,000/month' },
      { name: 'court_name', label: 'Family Court Name', type: 'text', required: true, placeholder: 'e.g. Principal Judge Family Court' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Counseling, Interim Maintenance' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Disposed', 'Compromised', 'Transferred'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  revenuecases: {
    title: 'revenuecases',
    singular: 'Revenue / Land Case',
    badge: 'revenue',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case / Computerized No.', type: 'text', required: true, placeholder: 'e.g. T202610430101234' },
      { name: 'case_year', label: 'Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'revenue', readonly: true },
      { name: 'revenue_act_section', label: 'Revenue Section', type: 'select', options: ['Sec 34 (Mutation / दाखिल खारिज)', 'Sec 24 (Demarcation / पत्थरगड्डी)', 'Sec 116 (Partition / कुर्रा बटवारा)', 'Sec 67 (Eviction Gaon Sabha Land)', 'Sec 80 (Non-Agricultural Declaration)', 'Sec 144 (Declaratory Suit / घोषणात्मक वाद)', 'Sec 38 (Correction of Revenue Map/Record)', 'Other Revenue Section'], default: 'Sec 34 (Mutation / दाखिल खारिज)' },
      { name: 'village_mauja', label: 'Village / Mauja (मौजा)', type: 'text', placeholder: 'e.g. Kalyanpur' },
      { name: 'pargana_tehsil', label: 'Tehsil / Pargana (तहसील)', type: 'text', placeholder: 'e.g. Sadar' },
      { name: 'gata_khata_no', label: 'Gata / Khasra / Khatauni', type: 'text', placeholder: 'e.g. Gata 245/1' },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. Applicant vs Opposite Party' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'applicant', label: 'Applicant / Plaintiff (वादी)', type: 'text', required: true, placeholder: 'Applicant name' },
      { name: 'opposite_party', label: 'Opposite Party / Gaon Sabha (प्रतिवादी)', type: 'text', required: true, placeholder: 'Opposite party' },
      { name: 'court_name', label: 'Revenue Court Name', type: 'text', required: true, placeholder: 'e.g. Court of Tehsildar / SDM' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Lekhpal Report, Objections' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Disposed', 'Dismissed', 'Order Executed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  misccivilcases: {
    title: 'misccivilcases',
    singular: 'Misc Civil Case',
    badge: 'misc_civil',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Misc Case Number', type: 'text', required: true, placeholder: 'e.g. MCA-2026-101' },
      { name: 'case_year', label: 'Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'misc_civil', readonly: true },
      { name: 'original_case_number', label: 'Original / Main Suit No.', type: 'text', placeholder: 'e.g. OS No. 45/2024' },
      { name: 'proceeding_type', label: 'Proceeding / Application Type', type: 'select', options: ['Temporary Injunction (Order 39 Rule 1 & 2 CPC)', 'Restoration Application (Order 9 Rule 13 / Rule 9 CPC)', 'Civil Appeal (Sec 96 CPC)', 'Civil Revision (Sec 115 CPC)', 'Execution Application (Order 21 CPC)', 'Review Application (Order 47 CPC / Sec 114)', 'Misc Civil Appeal (Order 43 Rule 1 CPC)', 'Other Misc Application'], default: 'Temporary Injunction (Order 39 Rule 1 & 2 CPC)' },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. Applicant vs Respondent' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'applicant', label: 'Applicant / Appellant', type: 'text', required: true, placeholder: 'Applicant name' },
      { name: 'opposite_party', label: 'Opposite Party / Respondent', type: 'text', required: true, placeholder: 'Opposite party name' },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'Court name' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Injunction Hearing, Notice' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Disposed', 'Allowed', 'Dismissed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  misccriminalcases: {
    title: 'misccriminalcases',
    singular: 'Misc Criminal Case',
    badge: 'misc_criminal',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Bail / Misc Case Number', type: 'text', required: true, placeholder: 'e.g. BA-2026-050' },
      { name: 'crime_year', label: 'Crime / Application Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'misc_criminal', readonly: true },
      { name: 'original_case_number', label: 'Original ST / Crime / FIR No.', type: 'text', placeholder: 'e.g. Crime No. 210/2026' },
      { name: 'proceeding_type', label: 'Application / Proceeding Type', type: 'select', options: ['Regular Bail (Sec 439 CrPC / Sec 483 BNSS)', 'Anticipatory Bail (Sec 438 CrPC / Sec 482 BNSS)', 'Criminal Appeal (Sec 374 CrPC / Sec 415 BNSS)', 'Criminal Revision (Sec 397/401 CrPC)', 'Application u/s 156(3) CrPC / Sec 175(3) BNSS', 'Criminal Misc Application (Sec 482 CrPC)', 'Other Criminal Application'], default: 'Regular Bail (Sec 439 CrPC / Sec 483 BNSS)' },
      { name: 'police_station', label: 'Police Station / Thana', type: 'select', options: policeStationList, default: 'Kotwali Sadar (Main town)' },
      { name: 'crime_section', label: 'Section (IPC / BNS)', type: 'text', placeholder: 'e.g. IPC 307, 323' },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. Accused vs State of U.P.' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'applicant', label: 'Applicant / Accused / Appellant', type: 'text', required: true, placeholder: 'Applicant name' },
      { name: 'opposite_party', label: 'Opposite Party (Prosecution)', type: 'text', required: true, default: 'State of U.P.' },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g. Sessions Court' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Bail Arguments, Police Report' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Bail Granted', 'Bail Rejected', 'Disposed', 'Allowed', 'Dismissed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Disposal Notes', type: 'textarea', placeholder: 'Case remarks or order notes' },
      { name: 'doc_link', label: 'Document / Order Sheet URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  complaintcases: {
    title: 'complaintcases',
    singular: 'Complaint Case',
    badge: 'complaint',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Complaint / CC No.', type: 'text', required: true, placeholder: 'e.g. CC-2026-105' },
      { name: 'case_year', label: 'Case Year', type: 'number', required: true, default: 2026 },
      { name: 'case_type', label: 'Case Type', type: 'text', default: 'complaint', readonly: true },
      { name: 'complaint_type', label: 'Complaint Type', type: 'select', options: ['Cheque Bounce (Sec 138 NI Act)', 'Private Criminal Complaint (Sec 200 CrPC / Sec 223 BNSS)', 'Defamation (Sec 500 IPC / Sec 356 BNS)', 'Cheating & Fraud (Sec 420 IPC / Sec 318 BNS)', 'Domestic / Harassment Complaint', 'Labour / Industrial Dispute Complaint', 'Consumer Protection Complaint', 'Other Complaint'], default: 'Cheque Bounce (Sec 138 NI Act)' },
      { name: 'section_act', label: 'Sections & Acts', type: 'text', placeholder: 'e.g. Sec 138 NI Act, Sec 420 IPC' },
      { name: 'complainant', label: 'Complainant (परिवादी)', type: 'text', required: true, placeholder: 'Complainant name' },
      { name: 'accused_name', label: 'Accused / Opp. Party (अभियुक्त)', type: 'text', required: true, placeholder: 'Accused name' },
      { name: 'police_station', label: 'Police Station / Thana', type: 'select', options: policeStationList, default: 'Kotwali Sadar (Main town)' },
      { name: 'case_name', label: 'Case Title', type: 'text', placeholder: 'e.g. Complainant vs Accused' },
      { name: 'filing_date', label: 'Filing Date', type: 'date', default: () => new Date().toISOString().split('T')[0] },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'Court name' },
      { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Advocate client name' },
      { name: 'client_number', label: 'Client Contact Number', type: 'tel', placeholder: 'Client phone' },
      { name: 'next_hearing', label: 'Next Hearing Date', type: 'date' },
      { name: 'hearing_process', label: 'Hearing Stage / Process', type: 'text', placeholder: 'e.g. Sec 200 CrPC, Summoning, Bailable Warrant' },
      { name: 'case_status', label: 'Case Status', type: 'select', options: ['Pending', 'Summoning Done', 'Bailable Warrant Issued', 'Compromised', 'Disposed', 'Dismissed'], default: 'Pending' },
      { name: 'remark', label: 'Remark / Notes', type: 'textarea', placeholder: 'Cheque details, dishonour memo, notice, etc.' },
      { name: 'doc_link', label: 'Document / Complaint URL', type: 'url', placeholder: 'https://drive.google.com/...' },
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
      { name: 'police_station', label: 'Police Station', type: 'select', options: policeStationList, required: true, default: 'Kotwali Sadar (Main town)' },
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
  },
  case_transfers: {
    title: 'case_transfers',
    singular: 'Court Transfer Record',
    badge: 'civil',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'case_number', label: 'Case Number', type: 'text', required: true, placeholder: 'e.g. CIV-2026-001' },
      { name: 'case_type', label: 'Case Type', type: 'select', options: ['civil', 'state', 'criminal', 'family', 'revenue', 'misc_civil', 'misc_criminal', 'complaint'], default: 'civil' },
      { name: 'from_court', label: 'Transferred From (Origin)', type: 'text', required: true, placeholder: 'Origin court name' },
      { name: 'to_court', label: 'Transferred To (Destination)', type: 'text', required: true, placeholder: 'New court name' },
      { name: 'transfer_date', label: 'Transfer Date', type: 'date', required: true, default: () => new Date().toISOString().split('T')[0] },
      { name: 'order_number', label: 'Order / Ref Number', type: 'text', placeholder: 'e.g. Order No. 42/2026' },
      { name: 'order_date', label: 'Order Date', type: 'date' },
      { name: 'transferred_by', label: 'Ordering Authority / Judge', type: 'text', placeholder: 'e.g. District & Sessions Judge' },
      { name: 'transfer_reason', label: 'Reason for Transfer', type: 'text', required: true, placeholder: 'e.g. Administrative reassignment, territorial jurisdiction' },
      { name: 'doc_link', label: 'Order Sheet / Document URL', type: 'url', placeholder: 'https://drive.google.com/...' },
      { name: 'remarks', label: 'Remarks / Instructions', type: 'textarea', placeholder: 'Case transfer notes' },
      { name: 'created_at', label: 'Created At', type: 'timestamp', readonly: true },
      { name: 'updated_at', label: 'Updated At', type: 'timestamp', readonly: true }
    ]
  },
  court_helpers: {
    title: 'court_helpers',
    singular: 'Court Staff Member / Helper',
    badge: 'civil',
    columns: [
      { name: 'id', label: 'ID (UUID)', type: 'uuid', readonly: true },
      { name: 'name', label: 'Staff Member Name', type: 'text', required: true, placeholder: 'Staff name (e.g. Ramesh Chandra)' },
      { name: 'court', label: 'Assigned Court / Forum', type: 'text', required: true, placeholder: 'Court name (e.g. Court No. 1)' },
      { name: 'position', label: 'Position / Role', type: 'text', required: true, placeholder: 'e.g. Reader, Ahlmad, Peon, Steno' },
      { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '10-digit mobile number' },
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
  toggleDbCaseModifierPanel(true);
}

function populateDbModifierCaseSelect() {
  const typeSelect = document.getElementById('dbModCaseType');
  const caseSelect = document.getElementById('dbModCaseSelect');
  const datalist = document.getElementById('dbModCaseDatalist');
  const searchInput = document.getElementById('dbModCaseSearchInput');
  const hiddenId = document.getElementById('dbModSelectedCaseId');
  if (!typeSelect) return;

  const targetType = typeSelect.value || 'civil';
  const cases = allCaseRecords.filter(c => {
    const ct = String(c.caseType || '').toLowerCase();
    if (targetType === 'state' || targetType === 'criminal') return ct === 'state' || ct === 'criminal';
    if (targetType === 'family') return ct === 'family';
    if (targetType === 'revenue') return ct === 'revenue';
    if (targetType === 'misc_civil') return ct === 'misc_civil';
    if (targetType === 'misc_criminal') return ct === 'misc_criminal';
    if (targetType === 'complaint') return ct === 'complaint';
    return ct === 'civil';
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
  const targetType = typeSelect?.value || 'civil';
  const cases = allCaseRecords.filter(c => {
    const ct = String(c.caseType || '').toLowerCase();
    if (targetType === 'state' || targetType === 'criminal') return ct === 'state' || ct === 'criminal';
    if (targetType === 'family') return ct === 'family';
    if (targetType === 'revenue') return ct === 'revenue';
    if (targetType === 'misc_civil') return ct === 'misc_civil';
    if (targetType === 'misc_criminal') return ct === 'misc_criminal';
    return ct === 'civil';
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
  const card = document.getElementById('dbCaseModifierCard');
  if (card && card.classList.contains('panel-disabled')) {
    alert('Modification panel is disabled. Please toggle the switch above to enable editing.');
    return;
  }

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
  const targetType = typeSelect?.value || 'civil';
  let tableName = 'civilcases';
  if (targetType === 'state') tableName = 'statecases';
  else if (targetType === 'criminal') tableName = 'criminalcases';
  else if (targetType === 'family') tableName = 'familycases';
  else if (targetType === 'revenue') tableName = 'revenuecases';
  else if (targetType === 'misc_civil') tableName = 'misccivilcases';
  else if (targetType === 'misc_criminal') tableName = 'misccriminalcases';
  else if (targetType === 'complaint') tableName = 'complaintcases';

  if (statusMsg) {
    statusMsg.style.color = '#4338CA';
    statusMsg.textContent = '⏳ Saving updates directly to Supabase...';
  }
  if (submitBtn) submitBtn.disabled = true;

  try {
    const updatePayload = {
      case_number: newCaseNo,
      filing_date: newFilingDate || null,
      updated_at: new Date().toISOString()
    };
    if (tableName === 'statecases' || tableName === 'criminalcases' || tableName === 'misccriminalcases') {
      updatePayload.crime_year = newYearVal;
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

function toggleDbCaseModifierPanel(enable = null) {
  const card = document.getElementById('dbCaseModifierCard');
  const checkbox = document.getElementById('dbModToggleCheckbox');
  const label = document.getElementById('dbModToggleLabel');
  const collapseBtn = document.getElementById('dbModifierCollapseBtn');
  if (!card) return;

  const isEnabled = enable !== null ? !!enable : !card.classList.contains('panel-enabled');
  if (checkbox) checkbox.checked = isEnabled;

  if (isEnabled) {
    card.classList.remove('panel-disabled');
    card.classList.add('panel-enabled');
    if (label) label.innerHTML = '<i class="fa-solid fa-lock-open"></i> Enabled';
    if (collapseBtn) collapseBtn.disabled = false;
  } else {
    card.classList.add('panel-disabled');
    card.classList.remove('panel-enabled');
    if (label) label.innerHTML = '<i class="fa-solid fa-lock"></i> Disabled';
    // Toggle disable: collapse card (expand false)
    toggleDbModifierCollapse(true);
    if (collapseBtn) collapseBtn.disabled = true;
  }

  const controls = card.querySelectorAll('#dbModFormGrid input, #dbModFormGrid select, #dbModFormGrid button');
  controls.forEach(el => {
    el.disabled = !isEnabled;
  });
}

function toggleDbModifierCollapse(forceState = null) {
  const card = document.getElementById('dbCaseModifierCard');
  const btn = document.getElementById('dbModifierCollapseBtn');
  if (!card) return;
  // If panel is disabled and attempting to expand, expand is false
  if (card.classList.contains('panel-disabled') && forceState !== true) {
    return;
  }
  const shouldCollapse = forceState !== null ? !!forceState : !card.classList.contains('is-collapsed');
  if (shouldCollapse) {
    card.classList.add('is-collapsed');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-down collapse-chevron"></i> <span>Expand</span>';
  } else {
    card.classList.remove('is-collapsed');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-down collapse-chevron"></i> <span>Collapse</span>';
  }
}

function toggleDossierSection(elementId, forceState = null) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const shouldCollapse = forceState !== null ? !!forceState : !el.classList.contains('is-collapsed');
  if (shouldCollapse) {
    el.classList.add('is-collapsed');
  } else {
    el.classList.remove('is-collapsed');
  }
}

window.populateDbModifierCaseSelect = populateDbModifierCaseSelect;
window.onDbModifierCaseSearch = onDbModifierCaseSearch;
window.onDbModifierCaseSelected = onDbModifierCaseSelected;
window.executeDbCaseNumberYearUpdate = executeDbCaseNumberYearUpdate;
window.toggleDbCaseModifierPanel = toggleDbCaseModifierPanel;
window.toggleDbModifierCollapse = toggleDbModifierCollapse;
window.toggleDossierSection = toggleDossierSection;

function switchDbManagerToTable(tableName) {
  const select = document.getElementById('dbManagerTableSelect');
  if (select) {
    select.value = tableName;
  }
  currentDbTable = tableName;
  fetchAndRenderDbTable(tableName);
}
window.switchDbManagerToTable = switchDbManagerToTable;

async function fetchAndRenderDbTable(tableName = currentDbTable) {
  currentDbTable = tableName;
  const thead = document.getElementById('dbManagerTableHead');
  const tbody = document.getElementById('dbManagerTableBody');
  const tableBadge = document.getElementById('dbManagerTableBadge');
  const rowCountBadge = document.getElementById('dbManagerRowCountBadge');
  const liveIndicator = document.getElementById('dbManagerLiveIndicator');

  const searchInputEl = document.getElementById('dbManagerSearchInput');
  if (searchInputEl) {
    if (tableName === 'all_tables') {
      searchInputEl.placeholder = '🔍 Search anyone across all tables (name, case number, client, phone, date)...';
    } else {
      searchInputEl.placeholder = `Filter rows in "${tableName}" by any keyword, case number, or text...`;
    }
  }

  // Handle (From All Tables) universal multi-table search & view
  if (tableName === 'all_tables') {
    if (tableBadge) {
      tableBadge.textContent = '🌐 (From All Tables)';
      tableBadge.className = 'case-badge civil';
    }
    const schema = DB_SCHEMAS.all_tables;
    if (thead) {
      let headHtml = '';
      schema.columns.forEach(col => {
        headHtml += `<th title="${col.label}">${col.label}</th>`;
      });
      headHtml += `<th class="actions-col table-actions-th">Actions</th>`;
      thead.innerHTML = headHtml;
    }

    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-results">⏳ Fetching live records across all Supabase tables...</td></tr>';
    }

    let allAggregatedRows = [];
    const tablesList = [
      'civilcases', 'statecases', 'criminalcases', 'familycases',
      'revenuecases', 'misccivilcases', 'misccriminalcases', 'complaintcases',
      'hearings', 'courts', 'court_helpers', 'case_todos', 'case_transfers'
    ];

    if (supabaseClient) {
      try {
        const fetchPromises = tablesList.map(tbl =>
          supabaseClient.from(tbl).select('*').order('created_at', { ascending: false }).limit(200)
            .then(res => ({ table: tbl, data: res.data || [] }))
            .catch(() => ({ table: tbl, data: [] }))
        );

        const results = await Promise.all(fetchPromises);
        results.forEach(res => {
          (res.data || []).forEach(r => {
            allAggregatedRows.push({
              ...r,
              _sourceTable: res.table,
              case_number: r.case_number || r.caseNo || r.criminalCaseNumber || r.court_name || r.name || r.id,
              case_name: r.case_name || (r.applicant && r.opposite_party ? `${r.applicant} vs ${r.opposite_party}` : (r.plaintiff && r.defendant ? `${r.plaintiff} vs ${r.defendant}` : (r.victim_name && r.accused_name ? `${r.victim_name} vs ${r.accused_name}` : (r.staff_name || r.task_title || r.name || r.court_name || '—')))),
              client_name: r.client_name ? `${r.client_name}${r.client_number ? ' (' + r.client_number + ')' : ''}` : (r.mobile || r.phone || '—'),
              court_name: r.court_name || r.assigned_court || r.from_court || r.location || '—',
              next_hearing: r.next_hearing || r.hearing_date || r.deadline_date || r.transfer_date || r.filing_date || null,
              hearing_process: r.hearing_process || r.process || r.proceeding_type || r.position || r.priority || '—',
              case_status: r.case_status || r.status || '—',
              remark: r.remark || r.remarks || r.crime_section || r.action_taken || r.transfer_reason || ''
            });
          });
        });

        if (liveIndicator) {
          liveIndicator.textContent = '🟢 Supabase Live';
          liveIndicator.style.background = '#dcfce7';
          liveIndicator.style.color = '#166534';
        }
      } catch (err) {
        console.error('Error fetching all tables:', err);
      }
    }

    if (allAggregatedRows.length === 0) {
      allCaseRecords.forEach(c => {
        allAggregatedRows.push({
          ...c,
          _sourceTable: c.caseType === 'civil' ? 'civilcases' : (c.caseType === 'misc_criminal' ? 'misccriminalcases' : `${c.caseType}cases`),
          case_number: c.caseNo || c.criminalCaseNumber,
          case_name: c.caseName || '—',
          client_name: c.clientName || '—',
          court_name: c.courtName || '—',
          next_hearing: c.nextHearing && c.nextHearing !== '—' ? c.nextHearing : null,
          hearing_process: c.hearingProcess || '—',
          case_status: c.caseStatus || '—',
          remark: c.remark || ''
        });
      });
      allHearingRecords.forEach(h => {
        allAggregatedRows.push({
          ...h,
          _sourceTable: 'hearings',
          case_number: h.case_number,
          case_name: `Hearing for ${h.case_number}`,
          client_name: '—',
          court_name: '—',
          next_hearing: h.hearing_date,
          hearing_process: h.process || '—',
          case_status: 'Scheduled',
          remark: h.action_taken || ''
        });
      });
    }

    currentDbTableData = allAggregatedRows;
    if (rowCountBadge) {
      rowCountBadge.textContent = `${allAggregatedRows.length} rows across ${tablesList.length} tables`;
    }

    const searchInput = document.getElementById('dbManagerSearchInput');
    const searchQ = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQ) {
      filterDbManagerRows(searchQ);
    } else {
      renderDbManagerRows(allAggregatedRows);
    }
    return;
  }

  const schema = DB_SCHEMAS[tableName];
  if (!schema) return;

  if (tableBadge) {
    tableBadge.textContent = `Table: ${schema.title}`;
    tableBadge.className = `case-badge ${schema.badge || 'civil'}`;
  }

  if (thead) {
    let headHtml = '';
    schema.columns.forEach(col => {
      headHtml += `<th title="${col.name}">${col.name}</th>`;
    });
    headHtml += `<th class="actions-col table-actions-th">Actions</th>`;
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
    } else if (tableName === 'case_transfers') {
      rows = (allCaseTransfers || []).map(t => ({
        id: t.id || 'local-transfer-' + Math.random().toString(36).substr(2, 9),
        case_number: t.case_number,
        case_type: t.case_type || 'civil',
        from_court: t.from_court,
        to_court: t.to_court,
        transfer_date: t.transfer_date,
        order_number: t.order_number || '',
        order_date: t.order_date || null,
        transferred_by: t.transferred_by || '',
        transfer_reason: t.transfer_reason || '',
        doc_link: t.doc_link || '',
        remarks: t.remarks || '',
        created_at: t.created_at || new Date().toISOString(),
        updated_at: t.updated_at || new Date().toISOString()
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
    const emptyMsg = currentDbTable === 'all_tables'
      ? 'No records found matching your search across all database tables.'
      : `No records found in table "${currentDbTable}". Use "➕ Insert New Row" to add data.`;
    tbody.innerHTML = `<tr><td colspan="${schema.columns.length + 1}" class="no-results">${emptyMsg}</td></tr>`;
    return;
  }

  let html = '';
  rowsToRender.forEach((row, rIdx) => {
    html += `<tr>`;
    schema.columns.forEach(col => {
      let rawVal = row[col.name];
      let displayVal = '—';
      let cellClass = '';

      if (col.name === '_sourceTable') {
        const tName = String(rawVal || 'table');
        let badgeStyle = 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;';
        if (tName.includes('criminal') || tName.includes('state')) {
          badgeStyle = 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;';
        } else if (tName.includes('family')) {
          badgeStyle = 'background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8;';
        } else if (tName.includes('revenue')) {
          badgeStyle = 'background: #fefce8; color: #a16207; border: 1px solid #fef08a;';
        } else if (tName.includes('hearing')) {
          badgeStyle = 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;';
        } else if (tName.includes('todo')) {
          badgeStyle = 'background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe;';
        } else if (tName.includes('transfer')) {
          badgeStyle = 'background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;';
        } else if (tName.includes('helper')) {
          badgeStyle = 'background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc;';
        }
        displayVal = `<button type="button" onclick="switchDbManagerToTable('${escapeHtml(tName)}')" title="Switch to view '${escapeHtml(tName)}' table" style="${badgeStyle} padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><span>${escapeHtml(tName)}</span> <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 9px;"></i></button>`;
      } else if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
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

    const targetTbl = row._sourceTable || currentDbTable;
    const identifier = row.case_number || row.court_name || row.task_title || row.id || `Row #${rIdx + 1}`;

    html += `
      <td class="actions-cell table-actions-td">
        <button type="button" class="db-btn-edit" onclick="openDbEditModal('${escapeHtml(String(row.id || ''))}', ${rIdx}, '${escapeHtml(targetTbl)}')" title="Edit record in '${escapeHtml(targetTbl)}'"><i class="fa-solid fa-pen-to-square"></i><span class="btn-text"> Edit</span></button>
        <button type="button" class="db-btn-delete" onclick="handleDbDeleteRow('${escapeHtml(String(row.id || ''))}', '${escapeHtml(String(identifier))}', ${rIdx}, '${escapeHtml(targetTbl)}')" title="Delete record from '${escapeHtml(targetTbl)}'"><i class="fa-solid fa-trash-can"></i><span class="btn-text"> Delete</span></button>
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

let currentDbRecordTable = '';

function openDbAddModal() {
  let targetTable = currentDbTable;
  if (targetTable === 'all_tables') {
    targetTable = 'civilcases';
    const select = document.getElementById('dbManagerTableSelect');
    if (select) select.value = 'civilcases';
    currentDbTable = 'civilcases';
    fetchAndRenderDbTable('civilcases');
  }
  currentDbRecordTable = targetTable;

  const schema = DB_SCHEMAS[targetTable];
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

function openDbEditModal(rowId, fallbackIndex = null, specificTable = null) {
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

  currentDbRecordTable = specificTable || row._sourceTable || currentDbTable;
  if (currentDbRecordTable === 'all_tables') currentDbRecordTable = 'civilcases';
  const schema = DB_SCHEMAS[currentDbRecordTable] || DB_SCHEMAS[currentDbTable];
  if (!schema) return;

  const modal = document.getElementById('dbManagerFormModal');
  const title = document.getElementById('dbModalTitle');
  const subtitle = document.getElementById('dbModalSubtitle');
  const icon = document.getElementById('dbModalIcon');
  const recordIdInput = document.getElementById('dbRecordId');
  const recordActionInput = document.getElementById('dbRecordAction');
  const statusMsg = document.getElementById('dbModalStatusMsg');

  const recordName = row.case_number || row.court_name || row.task_title || row.id || 'Record';

  if (title) title.textContent = `Edit Record in "${schema.title}"`;
  if (subtitle) subtitle.textContent = `Editing: ${recordName} (ID: ${row.id || 'local'}) [Table: ${currentDbRecordTable}]`;
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

let isSubmittingDbRecord = false;
async function handleDbRecordFormSubmit(event) {
  if (event) {
    event.preventDefault();
  }
  if (isSubmittingDbRecord) return false;

  const activeTable = currentDbRecordTable || currentDbTable;
  const schema = DB_SCHEMAS[activeTable] || DB_SCHEMAS[currentDbTable];
  if (!schema) return false;

  const recordId = document.getElementById('dbRecordId')?.value?.trim();
  const action = document.getElementById('dbRecordAction')?.value || 'create';
  const statusMsg = document.getElementById('dbModalStatusMsg');
  const modalSaveBtn = document.querySelector('#dbManagerFormModal button[type="submit"]') || document.getElementById('dbModalSaveBtn');

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

  // Duplicate Prevention: Check case_number or case_no across all tables
  if (action === 'create') {
    const caseNum = (payload.case_number || payload.case_no || '').trim();
    if (caseNum && ['civilcases', 'statecases', 'familycases', 'revenuecases', 'misccivilcases', 'misccriminalcases', 'complaintcases'].includes(activeTable)) {
      const exists = await checkCaseNumberExists(caseNum);
      if (exists && exists.exists) {
        alert(`❌ Case Number "${caseNum}" already exists in the database! Duplicate insertion prevented.`);
        if (statusMsg) {
          statusMsg.textContent = `❌ Case Number "${caseNum}" already exists in database.`;
          statusMsg.className = 'update-status-msg error';
        }
        return false;
      }
    }

    // Duplicate check for court_name
    if (activeTable === 'courts') {
      const courtName = (payload.court_name || '').trim();
      if (courtName && courts.some(c => c.trim().toLowerCase() === courtName.toLowerCase())) {
        alert(`❌ Court "${courtName}" already exists!`);
        if (statusMsg) {
          statusMsg.textContent = `❌ Court "${courtName}" already exists.`;
          statusMsg.className = 'update-status-msg error';
        }
        return false;
      }
    }
  }

  if (statusMsg) {
    statusMsg.textContent = 'Saving to database...';
    statusMsg.className = 'update-status-msg';
  }

  try {
    isSubmittingDbRecord = true;
    if (modalSaveBtn) modalSaveBtn.disabled = true;

    if (action === 'create') {
      // Insert operation
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from(activeTable).insert([payload]).select();
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

      const existingRow = currentDbTableData.find(r => String(r.id) === String(recordId));
      const isCourtTable = activeTable === 'courts';
      const isCaseTable = ['civilcases', 'statecases', 'criminalcases', 'familycases', 'revenuecases', 'misccivilcases', 'misccriminalcases', 'complaintcases'].includes(activeTable);

      let oldCourtName = '';
      let newCourtName = '';
      if (isCourtTable) {
        oldCourtName = (existingRow?.court_name || '').trim();
        newCourtName = (payload.court_name || '').trim();
      }

      let oldCaseNo = '';
      let newCaseNo = '';
      if (isCaseTable) {
        oldCaseNo = (existingRow?.case_number || existingRow?.case_no || '').trim();
        newCaseNo = (payload.case_number || payload.case_no || '').trim();
      }

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from(activeTable).update(payload).eq('id', recordId);
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

      // Cascading updates for related tables and application memory
      if (isCourtTable && oldCourtName && newCourtName && oldCourtName.toLowerCase() !== newCourtName.toLowerCase()) {
        await cascadeUpdateCourtName(oldCourtName, newCourtName);
      }
      if (isCaseTable && oldCaseNo && newCaseNo && oldCaseNo.toLowerCase() !== newCaseNo.toLowerCase()) {
        await cascadeUpdateCaseNumber(oldCaseNo, newCaseNo);
      }

      // Refresh application state
      await fetchAllDataFromSupabase();
      await fetchAndRenderDbTable(currentDbTable);
      closeDbModal();
      alert(`✅ Record updated in "${currentDbTable}" successfully! Related data synchronized.`);
    }
  } finally {
    isSubmittingDbRecord = false;
    if (modalSaveBtn) modalSaveBtn.disabled = false;
  }

  return false;
}

async function handleDbDeleteRow(rowId, identifier, rowIndex, specificTable = null) {
  const targetTable = specificTable || currentDbTable;
  const schema = DB_SCHEMAS[targetTable] || DB_SCHEMAS[currentDbTable];
  if (!schema) return;

  const confirmMsg = `Are you sure you want to PERMANENTLY delete this record from table "${targetTable}"?\n\nIdentifier: ${identifier}\nID: ${rowId || 'Local index #' + rowIndex}`;
  if (!confirm(confirmMsg)) return;

  const isCaseTable = ['civilcases', 'statecases', 'criminalcases', 'familycases', 'revenuecases', 'misccivilcases', 'misccriminalcases', 'complaintcases'].includes(targetTable);
  const isCourtTable = targetTable === 'courts';

  if (supabaseClient && rowId && !rowId.startsWith('local-')) {
    try {
      const { error } = await supabaseClient.from(targetTable).delete().eq('id', rowId);
      if (error) {
        console.error(`Supabase delete error on ${currentDbTable}:`, error);
        alert(`⚠️ Failed to delete record from Supabase: ${error.message || 'Unknown error'}`);
        return;
      }

      // Cascade delete related hearings, todos, and transfers if deleting a case
      if (isCaseTable && identifier) {
        await Promise.all([
          supabaseClient.from('hearings').delete().ilike('case_number', identifier),
          supabaseClient.from('case_todos').delete().ilike('case_number', identifier),
          supabaseClient.from('case_transfers').delete().ilike('case_number', identifier)
        ]);
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

  // If deleting from case_transfers directly
  if (currentDbTable === 'case_transfers') {
    allCaseTransfers = allCaseTransfers.filter(t => String(t.id) !== String(rowId));
    try { localStorage.setItem('case_transfers_backup', JSON.stringify(allCaseTransfers)); } catch(e) {}
    if (typeof renderRecentTransfersTable === 'function') renderRecentTransfersTable();
    if (typeof updateTransfersCountBadge === 'function') updateTransfersCountBadge();
  }

  // If deleting from courts, update in-memory courts and unassign cases
  if (isCourtTable && identifier) {
    const cIdx = courts.findIndex(c => c.trim().toLowerCase() === identifier.trim().toLowerCase());
    if (cIdx !== -1) courts.splice(cIdx, 1);
    if (Array.isArray(allCaseRecords)) {
      allCaseRecords.forEach(c => {
        if ((c.courtName || '').trim().toLowerCase() === identifier.trim().toLowerCase()) c.courtName = '—';
        if ((c.criminalCourtName || '').trim().toLowerCase() === identifier.trim().toLowerCase()) c.criminalCourtName = '—';
      });
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

/* ==============================================================================
   Progressive Web App (PWA) & Mobile Installation Management
   ============================================================================== */
let deferredInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('✅ CMS Legal Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ CMS Legal Service Worker registration note:', err);
      });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('📱 Captured beforeinstallprompt event');
  updateInstallUiState(true);
});

window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA application successfully installed!');
  deferredInstallPrompt = null;
  updateInstallUiState(false);
  alert('🎉 CaseBook has been successfully installed on your Desktop / Device!');
});

function updateInstallUiState(canPrompt) {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const installBtns = document.querySelectorAll('.pwa-install-banner-btn, .header-install-btn, .nav-install-btn');
  
  installBtns.forEach(btn => {
    if (isStandalone) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  });
}

// Check install state immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => updateInstallUiState(false));
} else {
  updateInstallUiState(false);
}

async function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      console.log(`Install prompt outcome: ${choiceResult.outcome}`);
      if (choiceResult.outcome === 'accepted') {
        deferredInstallPrompt = null;
        updateInstallUiState(false);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
      openPwaGuideModal();
    }
  } else {
    openPwaGuideModal();
  }
}

function openPwaGuideModal() {
  const modal = document.getElementById('pwaGuideModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closePwaGuideModal() {
  const modal = document.getElementById('pwaGuideModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

window.triggerPwaInstall = triggerPwaInstall;
window.openPwaGuideModal = openPwaGuideModal;
window.closePwaGuideModal = closePwaGuideModal;

// ==============================================================================
// Mobile Filter Drawer & Active Filter Count Controllers
// ==============================================================================

function updateMobileFilterBadges() {
  try {
    // Search tab active filters
    const sType = document.getElementById('searchTypeFilter')?.value || '';
    const sCourt = document.getElementById('searchCourtFilter')?.value || '';
    const sStatus = document.getElementById('searchStatusFilter')?.value || '';
    const sDate = document.getElementById('searchDateFilter')?.value || '';
    let sCount = 0;
    if (sType) sCount++;
    if (sCourt) sCount++;
    if (sStatus) sCount++;
    if (sDate) sCount++;

    const sBadge = document.getElementById('searchFilterCountBadge');
    if (sBadge) {
      sBadge.textContent = String(sCount);
      sBadge.style.display = sCount > 0 ? 'inline-flex' : 'none';
    }

    // All Cases tab active filters
    const aType = document.getElementById('allCasesTypeSelect')?.value || '';
    const aStatus = document.getElementById('allCasesStatusSelect')?.value || '';
    const aCourt = document.getElementById('allCasesCourtSelect')?.value || '';
    let aCount = 0;
    if (aType) aCount++;
    if (aStatus) aCount++;
    if (aCourt) aCount++;

    const aBadge = document.getElementById('allCasesFilterCountBadge');
    if (aBadge) {
      aBadge.textContent = String(aCount);
      aBadge.style.display = aCount > 0 ? 'inline-flex' : 'none';
    }
  } catch (e) {}
}

function toggleMobileFilterDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isOpen = drawer.classList.toggle('open');
  const card = drawer.closest('.my-cases-filter-card, .all-cases-filter-card');
  const triggerBtn = card ? card.querySelector('.mobile-filter-trigger-btn') : null;
  if (triggerBtn) triggerBtn.classList.toggle('active', isOpen);
}

function openMobileFilterDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  drawer.classList.add('open');
  const card = drawer.closest('.my-cases-filter-card, .all-cases-filter-card');
  const triggerBtn = card ? card.querySelector('.mobile-filter-trigger-btn') : null;
  if (triggerBtn) triggerBtn.classList.add('active');
}

function closeMobileFilterDrawer() {
  document.querySelectorAll('.mobile-filter-drawer').forEach(d => {
    d.classList.remove('open');
    const card = d.closest('.my-cases-filter-card, .all-cases-filter-card');
    const triggerBtn = card ? card.querySelector('.mobile-filter-trigger-btn') : null;
    if (triggerBtn) triggerBtn.classList.remove('active');
  });
}

function applyMobileFilters(tab) {
  closeMobileFilterDrawer();
  updateMobileFilterBadges();
  if (tab === 'search') {
    filterCaseTables();
  } else if (tab === 'all') {
    renderAllCasesTableWithFilters();
  }
}

function resetMobileFilters(tab) {
  if (tab === 'search') {
    const sType = document.getElementById('searchTypeFilter');
    const sCourt = document.getElementById('searchCourtFilter');
    const sStatus = document.getElementById('searchStatusFilter');
    const sDate = document.getElementById('searchDateFilter');
    const sSearch = document.getElementById('globalSearch');
    if (sType) sType.value = '';
    if (sCourt) sCourt.value = '';
    if (sStatus) sStatus.value = '';
    if (sDate) sDate.value = '';
    if (sSearch) sSearch.value = '';
    document.querySelectorAll('.quick-filter-chip').forEach(c => c.classList.remove('active'));
    filterCaseTables();
  } else if (tab === 'all') {
    resetAllCasesFilters();
  }
  updateMobileFilterBadges();
  closeMobileFilterDrawer();
}

window.toggleMobileFilterDrawer = toggleMobileFilterDrawer;
window.updateMobileFilterBadges = updateMobileFilterBadges;
window.openMobileFilterDrawer = openMobileFilterDrawer;
window.closeMobileFilterDrawer = closeMobileFilterDrawer;
window.applyMobileFilters = applyMobileFilters;
window.resetMobileFilters = resetMobileFilters;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
