export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api');

export interface Institution {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email: string;
  website?: string;
  institution_type: 'university' | 'college' | 'academy';
  accreditation_status: 'pending' | 'accredited' | 'expired' | 'suspended';
  logo_url?: string;
  ownership_type?: string;
  founded_on?: string;
  accreditation_valid_from?: string;
  accreditation_valid_to?: string;
  competent_authority?: string;
  notes?: string;
  registration_number?: string;
  tax_id?: string;
  short_name?: string;
  municipality?: string;
  postal_code?: string;
  country?: string;
  founder_name?: string;
  founding_act_reference?: string;
  head_name?: string;
  head_title?: string;
  fax?: string;
  is_active?: number | boolean;
  created_at: string;
  updated_at: string;
  programs?: StudyProgram[];
}

export interface StudyProgram {
  id: string;
  institution_id: string;
  name: string;
  degree_level: 'bachelor' | 'master' | 'phd' | 'professional';
  duration_years: number;
  ects_credits?: number;
  accreditation_status: string;
  accreditation_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface AccreditationProcess {
  id: string;
  institution_id: string;
  program_id?: string;
  assigned_officer_id?: string;
  process_type: 'initial' | 'renewal' | 're-evaluation';
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'appeal';
  application_date: string;
  decision_date?: string;
  decision?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer' | 'institution';
  is_active: boolean;
  institution_id?: string;
  created_at: string;
}

export interface Statistics {
  total_institutions: number;
  accredited_institutions: number;
  total_programs: number;
  accredited_programs: number;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changed_fields?: string;
  prev_values?: string;
  new_values?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  institution_id?: string;
  program_id?: string;
  process_id?: string;
  document_type: string;
  title?: string;
  description?: string;
  issuer?: string;
  issued_at?: string;
  number?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  is_confidential?: number | boolean;
  tags?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

class ApiService {
  private currentUser: User | null = null;

  setAuthUser(user: User | null) {
    this.currentUser = user;
  }

  private async fetchWithError(url: string, options?: RequestInit) {
    const headers: Record<string, string> = { ...(options?.headers as any) };
    if (this.currentUser) {
      headers['x-user-id'] = this.currentUser.id;
      headers['x-user-role'] = this.currentUser.role;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let detail = '';
      try {
        const data = await response.json();
        detail = data?.error ? ` - ${data.error}` : '';
      } catch {
        try { detail = ' - ' + (await response.text()).slice(0, 200); } catch {}
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}${detail}`);
    }
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    throw new Error(`API Error: Unexpected non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User }> {
    return this.fetchWithError(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  }

  async getCurrentUser(): Promise<{ user: User | null }> {
    return this.fetchWithError(`${API_BASE_URL}/auth/me`);
  }

  // Institutions
  async getInstitutions(params?: {
    search?: string;
    city?: string;
    accreditation_status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Institution[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    return this.fetchWithError(`${API_BASE_URL}/institutions?${searchParams}`);
  }

  async getInstitution(id: string): Promise<Institution> {
    return this.fetchWithError(`${API_BASE_URL}/institutions/${id}`);
  }

  async createInstitution(payload: Partial<Institution>): Promise<Institution> {
    return this.fetchWithError(`${API_BASE_URL}/institutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async updateInstitution(id: string, payload: Partial<Institution>): Promise<Institution> {
    return this.fetchWithError(`${API_BASE_URL}/institutions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteInstitution(id: string): Promise<{ ok: boolean }> {
    return this.fetchWithError(`${API_BASE_URL}/institutions/${id}`, { method: 'DELETE' });
  }

  // Study Programs
  async getStudyPrograms(params?: {
    institution_id?: string;
    degree_level?: string;
    accreditation_status?: string;
  }): Promise<StudyProgram[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    return this.fetchWithError(`${API_BASE_URL}/study-programs?${searchParams}`);
  }

  async createStudyProgram(payload: Partial<StudyProgram>): Promise<StudyProgram> {
    return this.fetchWithError(`${API_BASE_URL}/study-programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async updateStudyProgram(id: string, payload: Partial<StudyProgram>): Promise<StudyProgram> {
    return this.fetchWithError(`${API_BASE_URL}/study-programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteStudyProgram(id: string): Promise<{ ok: boolean }> {
    return this.fetchWithError(`${API_BASE_URL}/study-programs/${id}`, { method: 'DELETE' });
  }

  // Accreditation Processes
  async getAccreditationProcesses(params?: {
    institution_id?: string;
    status?: string;
    assigned_officer_id?: string;
  }): Promise<AccreditationProcess[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    return this.fetchWithError(`${API_BASE_URL}/accreditation-processes?${searchParams}`);
  }

  async createAccreditationProcess(data: {
    institution_id: string;
    process_type: 'initial' | 'renewal' | 're-evaluation';
    application_date: string;
    notes?: string;
    program_id?: string;
  }): Promise<AccreditationProcess> {
    return this.fetchWithError(`${API_BASE_URL}/accreditation-processes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateAccreditationProcess(id: string, payload: Partial<AccreditationProcess>): Promise<AccreditationProcess> {
    return this.fetchWithError(`${API_BASE_URL}/accreditation-processes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteAccreditationProcess(id: string): Promise<{ ok: boolean }> {
    return this.fetchWithError(`${API_BASE_URL}/accreditation-processes/${id}`, {
      method: 'DELETE'
    });
  }

  // Cities
  async getCities(): Promise<string[]> {
    return this.fetchWithError(`${API_BASE_URL}/cities`);
  }

  // Statistics
  async getStatistics(): Promise<Statistics> {
    return this.fetchWithError(`${API_BASE_URL}/statistics`);
  }

  async getAuditLogs(params?: { limit?: number; offset?: number; resource_type?: string; action?: string; actor_role?: string; search?: string }): Promise<AuditLog[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') searchParams.append(k, String(v)); });
    }
    return this.fetchWithError(`${API_BASE_URL}/audit-logs?${searchParams}`);
  }

  getAuditLogsExportUrl(format: 'csv' | 'json', params?: { resource_type?: string; action?: string; actor_role?: string; search?: string }) {
    const sp = new URLSearchParams();
    sp.append('format', format);
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, String(v)); });
    const headers: Record<string, string> = {};
    if (this.currentUser) {
      headers['x-user-id'] = this.currentUser.id;
      headers['x-user-role'] = this.currentUser.role;
    }
    return `${API_BASE_URL}/audit-logs/export?${sp.toString()}`;
  }

  // Document Upload
  async uploadDocument(file: File, data: {
    institution_id?: string;
    program_id?: string;
    process_id?: string;
    document_type: string;
    title?: string;
    description?: string;
    issuer?: string;
    issued_at?: string;
    number?: string;
    is_confidential?: boolean;
    tags?: string;
  }): Promise<{ id: string; file_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, String(v)); });
    return this.fetchWithError(`${API_BASE_URL}/documents/upload`, { method: 'POST', body: formData });
  }

  async getDocuments(params?: { institution_id?: string; program_id?: string; process_id?: string; type?: string; search?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }): Promise<DocumentRecord[]> {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') sp.append(k, String(v)); });
    return this.fetchWithError(`${API_BASE_URL}/documents?${sp.toString()}`);
  }

  async updateDocument(id: string, payload: Partial<DocumentRecord>): Promise<DocumentRecord> {
    return this.fetchWithError(`${API_BASE_URL}/documents/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  }

  async deleteDocument(id: string): Promise<{ ok: boolean }> {
    return this.fetchWithError(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' });
  }

  async fixLogos(): Promise<{ updated: number }> {
    return this.fetchWithError(`${API_BASE_URL}/maintenance/fix-logos`, {
      method: 'POST'
    });
  }

  async uploadInstitutionLogo(institution_id: string, file: File): Promise<{ logo_url: string; institution: Institution }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.fetchWithError(`${API_BASE_URL}/institutions/${institution_id}/logo`, {
      method: 'POST',
      body: formData
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.fetchWithError(`${API_BASE_URL}/users`);
  }

  async createUser(payload: Partial<User> & { password?: string }): Promise<User> {
    return this.fetchWithError(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    return this.fetchWithError(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteUser(id: string): Promise<{ ok: boolean }> {
    return this.fetchWithError(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();
