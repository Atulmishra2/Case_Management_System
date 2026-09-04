/**
 * SupabaseService — Database operations and cloud sync
 */

const SUPABASE_URL = 'https://podehqyygbbabkimbcud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r8RXVVAf9UJfa9jtdamN_A_I5ZiDflg';

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
);

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConfigured = isSupabaseConfigured;
    
    if (this.isConfigured && window.supabase?.createClient) {
      try {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = this.client;
      } catch (e) {
        console.warn('Supabase client creation error:', e);
      }
    }
  }

  ensureClient() {
    if (!this.client && this.isConfigured && window.supabase?.createClient) {
      try {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = this.client;
      } catch (e) {
        console.warn('Supabase client creation error:', e);
      }
    }
    return this.client;
  }

  getClient() {
    return this.ensureClient();
  }

  async addCase(newCase) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const tableName = newCase.caseType === 'civil' ? 'civilcases' : 'criminalcases';
      const { error } = await client.from(tableName).insert([newCase]);
      if (error) {
        console.error('Supabase insert error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase insert exception:', e);
      return false;
    }
  }

  async updateCase(tableName, payload, originalNo) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from(tableName).update(payload).eq('case_number', originalNo);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase update error:', e);
      return false;
    }
  }

  async deleteCase(caseNumber) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      await Promise.all([
        client.from('civilcases').delete().eq('case_number', caseNumber),
        client.from('criminalcases').delete().eq('case_number', caseNumber),
        client.from('hearings').delete().eq('case_number', caseNumber)
      ]);
      return true;
    } catch (e) {
      console.error('Supabase delete error:', e);
      return false;
    }
  }

  async updateHearing(caseNumber, hearingDate, process, actionTaken = '') {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { data: existing } = await client
        .from('hearings')
        .select('id')
        .eq('case_number', caseNumber)
        .eq('hearing_date', hearingDate)
        .limit(1);

      if (existing && existing.length > 0) {
        const { error } = await client.from('hearings')
          .update({ process: process, action_taken: actionTaken })
          .eq('id', existing[0].id);
        if (error) return false;
      } else {
        const { error } = await client.from('hearings')
          .insert([{ case_number: caseNumber, hearing_date: hearingDate, process: process, action_taken: actionTaken }]);
        if (error) return false;
      }

      // Update case tables
      await Promise.all([
        client.from('civilcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber),
        client.from('criminalcases').update({ next_hearing: hearingDate, hearing_process: process }).eq('case_number', caseNumber)
      ]);
      return true;
    } catch (e) {
      console.error('Supabase hearing update error:', e);
      return false;
    }
  }

  async addCourt(courtName) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from('courts').insert([{ court_name: courtName, court_type: 'District Court' }]);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase add court error:', e);
      return false;
    }
  }

  async updateCourt(oldName, newName) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from('courts')
        .update({ court_name: newName, updated_at: new Date().toISOString() })
        .eq('court_name', oldName);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase edit court error:', e);
      return false;
    }
  }

  async deleteCourt(courtName) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from('courts').delete().eq('court_name', courtName);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase delete court error:', e);
      return false;
    }
  }

  async fetchCases() {
    const client = this.ensureClient();
    if (!client) return null;

    try {
      const cases = [];
      
      const { data: civilData, error: civilError } = await client
        .from('civilcases')
        .select('*');
      
      if (civilError) {
        console.error('Supabase civil cases fetch error:', civilError);
      } else if (civilData) {
        civilData.forEach(c => cases.push(c));
      }

      const { data: criminalData, error: criminalError } = await client
        .from('criminalcases')
        .select('*');
      
      if (criminalError) {
        console.error('Supabase criminal cases fetch error:', criminalError);
      } else if (criminalData) {
        criminalData.forEach(c => cases.push(c));
      }

      const { data: hearingData, error: hearingError } = await client
        .from('hearings')
        .select('*');
      
      if (hearingError) {
        console.error('Supabase hearings fetch error:', hearingError);
      }

      const { data: courtData, error: courtError } = await client
        .from('courts')
        .select('court_name');
      
      if (courtError) {
        console.error('Supabase courts fetch error:', courtError);
      } else if (courtData) {
        const courtNames = courtData.map(c => c.court_name);
        window.defaultCourts = courtNames;
        window.courts = courtNames;
      }

      return {
        cases: cases,
        hearings: hearingData || [],
        courts: courtData ? courtData.map(c => c.court_name) : []
      };
    } catch (e) {
      console.error('Supabase fetch error:', e);
      return null;
    }
  }

  async getAllTables() {
    const client = this.ensureClient();
    if (!client) return [];

    try {
      const tableNames = ['civilcases', 'criminalcases', 'hearings', 'courts'];
      const results = await Promise.all(
        tableNames.map(async (table) => {
          try {
            const { data, error } = await client.from(table).select('*', { count: 'exact' });
            if (error) {
              console.error(`Supabase table ${table} fetch error:`, error);
              return { name: table, count: 0, records: [] };
            }
            return { name: table, count: data ? data.length : 0, records: data || [] };
          } catch (e) {
            console.error(`Supabase table ${table} error:`, e);
            return { name: table, count: 0, records: [] };
          }
        })
      );
      return results;
    } catch (e) {
      console.error('Supabase tables fetch error:', e);
      return [];
    }
  }

  async insertRecord(tableName, record) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from(tableName).insert([record]);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase insert record error:', e);
      return false;
    }
  }

  async updateRecord(tableName, updates, identifier, identifierValue) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq(identifier, identifierValue);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase update record error:', e);
      return false;
    }
  }

  async deleteRecord(tableName, identifier, identifierValue) {
    const client = this.ensureClient();
    if (!client) return false;

    try {
      const { error } = await client.from(tableName).delete().eq(identifier, identifierValue);
      if (error) return false;
      return true;
    } catch (e) {
      console.error('Supabase delete record error:', e);
      return false;
    }
  }
}

export { SupabaseService };