import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { api, Institution, StudyProgram, AccreditationProcess, Statistics, User } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useLocation, Link } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [processes, setProcesses] = useState<AccreditationProcess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterResource, setAuditFilterResource] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditFilterRole, setAuditFilterRole] = useState('');
  const [expandedAudit, setExpandedAudit] = useState<string[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const auditLimit = 50;
  const { user } = useAuthStore();
  const location = useLocation();
  const [showInstitutionForm, setShowInstitutionForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [showInstitutionDeleteModal, setShowInstitutionDeleteModal] = useState(false);
  const [deleteTargetInstitution, setDeleteTargetInstitution] = useState<Institution | null>(null);
  const executeDeleteInstitution = async () => {
    if (!deleteTargetInstitution) return;
    try {
      await api.deleteInstitution(deleteTargetInstitution.id);
      setShowInstitutionDeleteModal(false);
      setDeleteTargetInstitution(null);
      await loadData();
    } catch {
      alert('Brisanje nije uspjelo');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [institutionsData, programsData, processesData, usersData] = await Promise.all([
        api.getInstitutions(),
        api.getStudyPrograms(),
        api.getAccreditationProcesses(),
        api.getUsers()
      ]);

      setInstitutions(institutionsData);
      setPrograms(programsData);
      setProcesses(processesData);
      setUsers(usersData);

      // Auto-fix external logo URLs once, then reload institutions
      const hasExternalLogos = institutionsData.some(i => i.logo_url && i.logo_url.startsWith('http'));
      if (hasExternalLogos) {
        try {
          await api.fixLogos();
          const refreshed = await api.getInstitutions();
          setInstitutions(refreshed);
        } catch (e) {
          // ignore maintenance error, UI will use onError fallback
        }
      }

      try {
        const stats = await api.getStatistics();
        setStatistics(stats);
      } catch (e) {
        setStatistics(null);
      }
      try {
        const logs = await api.getAuditLogs({ limit: auditLimit, offset: auditPage * auditLimit, resource_type: auditFilterResource || undefined, action: auditFilterAction || undefined, actor_role: auditFilterRole || undefined, search: auditSearch || undefined });
        setAuditLogs(logs);
      } catch (e) {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const logs = await api.getAuditLogs({ limit: auditLimit, offset: auditPage * auditLimit, resource_type: auditFilterResource || undefined, action: auditFilterAction || undefined, actor_role: auditFilterRole || undefined, search: auditSearch || undefined });
        setAuditLogs(logs);
      } catch (e) {
        setAuditLogs([]);
      }
    })();
  }, [auditFilterResource, auditFilterAction, auditFilterRole, auditSearch, auditPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accredited': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstitutionExpiry = (institutionId: string) => {
    const dates = programs
      .filter(p => p.institution_id === institutionId && p.accreditation_expiry)
      .map(p => new Date(p.accreditation_expiry as string).getTime());
    if (dates.length === 0) return null;
    const min = Math.min(...dates);
    return new Date(min).toLocaleDateString('bs-BA');
  };

  const getProcessStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Dashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ukupno ustanova</p>
              <p className="text-2xl font-bold text-gray-900">{statistics?.total_institutions ?? institutions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivne akreditacije</p>
              <p className="text-2xl font-bold text-gray-900">{statistics?.accredited_institutions ?? institutions.filter(i => i.accreditation_status === 'accredited').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Na čekanju</p>
              <p className="text-2xl font-bold text-gray-900">
                {processes.filter(p => p.status === 'under_review').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Studijski programi</p>
              <p className="text-2xl font-bold text-gray-900">{statistics?.total_programs ?? programs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Nedavne aktivnosti</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {processes.slice(0, 5).map((process) => (
              <div key={process.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${getProcessStatusColor(process.status)}`}>
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {institutions.find(i => i.id === process.institution_id)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Proces akreditacije
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProcessStatusColor(process.status)}`}>
                    {process.status === 'submitted' && 'Podneseno'}
                    {process.status === 'under_review' && 'U pregledu'}
                    {process.status === 'approved' && 'Odobreno'}
                    {process.status === 'rejected' && 'Odbijeno'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(process.created_at).toLocaleDateString('bs-BA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const InstitutionsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Ustanove</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pretraži ustanove..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtriraj
              </button>
              <button
                onClick={() => { setEditingInstitution(null); setShowInstitutionForm(true); }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Dodaj ustanovu
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[32rem]">
                  Naziv
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vlasništvo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status akreditacije
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ističe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstitutions.map((institution) => (
                <tr key={institution.id}>
                  <td className="px-6 py-4 whitespace-normal w-[32rem]">
                    <div className="flex items-start space-x-3 max-w-[32rem]">
                      {institution.logo_url && (
                        <img
                          src={institution.logo_url?.startsWith('/uploads/') ? `http://localhost:3001${institution.logo_url}` : (institution.logo_url as string)}
                          alt={institution.name}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.onerror = null;
                            t.src = '/logos/default.svg';
                          }}
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 break-words">{institution.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{institution.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{institution.ownership_type ?? 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(institution.accreditation_status)}`}>
                      {institution.accreditation_status === 'accredited' && 'Akreditirana'}
                      {institution.accreditation_status === 'pending' && 'Na čekanju'}
                      {institution.accreditation_status === 'expired' && 'Istekla'}
                      {institution.accreditation_status === 'suspended' && 'Suspendovana'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getInstitutionExpiry(institution.id) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/ustanova/${institution.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center" title="Detalji">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => { setEditingInstitution(institution); setShowInstitutionForm(true); }}
                        className="text-green-600 hover:text-green-900 inline-flex items-center"
                        title="Uredi"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setDeleteTargetInstitution(institution); setShowInstitutionDeleteModal(true); }}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Obriši"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showInstitutionForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full sm:max-w-3xl max-w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-900">{editingInstitution ? 'Uredi ustanovu' : 'Dodaj ustanovu'}</h3>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <InstitutionForm
                institution={editingInstitution}
                onCancel={() => setShowInstitutionForm(false)}
                onSaved={async () => { setShowInstitutionForm(false); await loadData(); }}
              />
            </div>
          </div>
        </div>
      )}
      {showInstitutionDeleteModal && deleteTargetInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Potvrda brisanja</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">Da li sigurno želiš obrisati ustanovu <span className="font-semibold">{deleteTargetInstitution.name}</span>? Ova radnja je nepovratna.</p>
            </div>
            <div className="px-6 py-4 flex justify-end space-x-2 border-t border-gray-200">
              <button onClick={() => { setShowInstitutionDeleteModal(false); setDeleteTargetInstitution(null); }} className="px-4 py-2 border rounded">Otkaži</button>
              <button onClick={executeDeleteInstitution} className="px-4 py-2 bg-red-600 text-white rounded">Obriši</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ProcessesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Procesi akreditacije</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ustanova
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Podneseno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((process) => (
                <tr key={process.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {institutions.find(i => i.id === process.institution_id)?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">{process.process_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProcessStatusColor(process.status)}`}>
                      {process.status === 'submitted' && 'Podneseno'}
                      {process.status === 'under_review' && 'U pregledu'}
                      {process.status === 'approved' && 'Odobreno'}
                      {process.status === 'rejected' && 'Odbijeno'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(process.created_at).toLocaleDateString('bs-BA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const isEmailValid = (email?: string) => !!email && /.+@.+\..+/.test(email);
    const isFormValid = () => {
      if (!isEmailValid(form.email)) return false;
      if (!form.full_name || form.full_name.trim().length < 2) return false;
      if (!editingUser && (!form.password || form.password.length < 1)) return false;
      if (!form.role) return false;
      return true;
    };
    const [form, setForm] = useState<Partial<User> & { password?: string }>({
      email: editingUser?.email || '',
      full_name: editingUser?.full_name || '',
      role: editingUser?.role || 'viewer',
      is_active: editingUser?.is_active ?? true,
      institution_id: editingUser?.institution_id || undefined,
      password: ''
    });

    useEffect(() => {
      setForm({
        email: editingUser?.email || '',
        full_name: editingUser?.full_name || '',
        role: editingUser?.role || 'viewer',
        is_active: editingUser?.is_active ?? true,
        institution_id: editingUser?.institution_id || undefined,
        password: ''
      });
    }, [editingUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: name === 'is_active' ? (value === '1') : value } as any));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setFormError(null);
        if (editingUser) {
          await api.updateUser(editingUser.id, {
            email: form.email,
            full_name: form.full_name,
            role: form.role as any,
            is_active: form.is_active
          });
        } else {
          await api.createUser({
            email: form.email!,
            full_name: form.full_name!,
            role: form.role as any,
            is_active: form.is_active!,
            password: form.password || 'changeme'
          });
        }
        setShowForm(false);
        setEditingUser(null);
        await loadData();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Greška pri snimanju korisnika';
        if (/409/.test(msg) || /Email already exists/i.test(msg)) {
          setFormError('Email je već zauzet. Molimo odaberite drugi.');
        } else if (/400/.test(msg) && /Invalid role/i.test(msg)) {
          setFormError('Neispravna uloga. Odaberite jednu od ponuđenih.');
        } else if (/400/.test(msg) && /Missing required fields/i.test(msg)) {
          setFormError('Nedostaju obavezna polja (Email, Lozinka, Ime i prezime).');
        } else {
          setFormError(msg);
        }
      }
    };

    const executeDelete = async () => {
      if (!deleteTarget) return;
      try {
        await api.deleteUser(deleteTarget.id);
        setShowDeleteModal(false);
        setDeleteTarget(null);
        await loadData();
      } catch {
        alert('Brisanje nije uspjelo');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Korisnici</h3>
            <button
              onClick={() => { setEditingUser(null); setShowForm(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >Dodaj korisnika</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ime i prezime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uloga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktivan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ustanova</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.is_active ? 'Da' : 'Ne'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institutions.find(i => i.id === u.institution_id)?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingUser(u); setShowForm(true); }} className="text-green-600 hover:text-green-900">Uredi</button>
                        <button onClick={() => { setDeleteTarget(u); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900">Obriši</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Potvrda brisanja</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700">Da li sigurno želiš obrisati korisnika <span className="font-semibold">{deleteTarget.email}</span>? Ova radnja je nepovratna.</p>
              </div>
              <div className="px-6 py-4 flex justify-end space-x-2 border-t border-gray-200">
                <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="px-4 py-2 border rounded">Otkaži</button>
                <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded">Obriši</button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{editingUser ? 'Uredi korisnika' : 'Dodaj korisnika'}</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input name="email" value={form.email || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ime i prezime</label>
                      <input name="full_name" value={form.full_name || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                    </div>
                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
                        <input type="password" name="password" value={form.password || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uloga</label>
                      <select name="role" value={form.role as any} onChange={handleChange} className="w-full border rounded px-3 py-2">
                        {user?.role === 'admin' && <option value="admin">Admin</option>}
                        <option value="operator">Operator</option>
                        <option value="viewer">Pregled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aktivan</label>
                      <select name="is_active" value={form.is_active ? '1' : '0'} onChange={handleChange} className="w-full border rounded px-3 py-2">
                        <option value="1">Da</option>
                        <option value="0">Ne</option>
                      </select>
                    </div>
                    
                  </div>
                  {formError && (
                    <div className="text-sm text-red-600">{formError}</div>
                  )}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                    <button type="button" onClick={() => { setShowForm(false); setEditingUser(null); }} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" disabled={!isFormValid()} className={`px-4 py-2 rounded ${isFormValid() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zabranjen pristup</h2>
          <p className="text-gray-600">Ova stranica je dostupna samo administratorima.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'institutions' && <InstitutionsTab />}
        {activeTab === 'processes' && <ProcessesTab />}
        {activeTab === 'programs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Sekcija Programi (CRUD) – uskoro.</p>
          </div>
        )}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Sekcija Dokumenti – lista i upload – uskoro.</p>
          </div>
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'import' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Sekcija Uvoz – CSV upload – uskoro.</p>
          </div>
        )}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Audit log</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Pretraga (korisnik, ID)" className="px-3 py-2 border rounded" />
                <select value={auditFilterResource} onChange={(e) => setAuditFilterResource(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="">Svi resursi</option>
                  <option value="institution">Ustanova</option>
                  <option value="study_program">Program</option>
                  <option value="accreditation_process">Proces</option>
                  <option value="document">Dokument</option>
                  <option value="user">Korisnik</option>
                </select>
                <select value={auditFilterAction} onChange={(e) => setAuditFilterAction(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="">Sve akcije</option>
                  <option value="create">Kreiranje</option>
                  <option value="update">Izmjena</option>
                  <option value="delete">Brisanje</option>
                  <option value="upload">Upload</option>
                </select>
                <select value={auditFilterRole} onChange={(e) => setAuditFilterRole(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="">Sve uloge</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Pregled</option>
                  <option value="institution">Ustanova</option>
                </select>
                <button onClick={() => window.open(api.getAuditLogsExportUrl('csv', { resource_type: auditFilterResource || undefined, action: auditFilterAction || undefined, actor_role: auditFilterRole || undefined, search: auditSearch || undefined }), '_blank')} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-50">Export CSV</button>
                <button onClick={() => window.open(api.getAuditLogsExportUrl('json', { resource_type: auditFilterResource || undefined, action: auditFilterAction || undefined, actor_role: auditFilterRole || undefined, search: auditSearch || undefined }), '_blank')} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-50">Export JSON</button>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={auditPage === 0} onClick={() => setAuditPage((p) => Math.max(0, p - 1))} className={`px-3 py-1 border rounded ${auditPage === 0 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}>Prethodna</button>
                <button onClick={() => setAuditPage((p) => p + 1)} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50">Sljedeća</button>
                <span className="text-sm text-gray-600">Stranica {auditPage + 1}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korisnik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uloga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcija</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resurs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Polja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalji</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs
                    .filter((l) => (auditFilterResource ? l.resource_type === auditFilterResource : true))
                    .filter((l) => (auditFilterAction ? l.action === auditFilterAction : true))
                    .filter((l) => (auditFilterRole ? l.actor_role === auditFilterRole : true))
                    .filter((l) => {
                      const hay = `${l.actor_name || ''} ${l.actor_id || ''} ${l.resource_id || ''}`.toLowerCase();
                      return hay.includes(auditSearch.toLowerCase());
                    })
                    .map((log) => (
                      <React.Fragment key={log.id}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.actor_name || log.actor_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.actor_role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => { try { const arr = JSON.parse(log.changed_fields || '[]'); return Array.isArray(arr) ? arr.join(', ') : ''; } catch { return ''; } })()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => setExpandedAudit((prev) => prev.includes(log.id) ? prev.filter(i => i !== log.id) : [...prev, log.id])} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50">{expandedAudit.includes(log.id) ? 'Sakrij' : 'Detalji'}</button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.created_at).toLocaleString('bs-BA')}</td>
                        </tr>
                        {expandedAudit.includes(log.id) && (
                          <tr key={`${log.id}-details`}>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-semibold text-gray-700 mb-2">Stare vrijednosti</div>
                                  <div className="text-sm text-gray-800 bg-white border rounded p-3">
                                    {(() => { try { const obj = JSON.parse(log.prev_values || 'null'); if (!obj) return '—'; return Object.entries(obj).map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="ml-4">{String(v)}</span></div>)); } catch { return '—'; } })()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-700 mb-2">Nove vrijednosti</div>
                                  <div className="text-sm text-gray-800 bg-white border rounded p-3">
                                    {(() => { try { const obj = JSON.parse(log.new_values || 'null'); if (!obj) return '—'; return Object.entries(obj).map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="ml-4">{String(v)}</span></div>)); } catch { return '—'; } })()}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

type InstitutionFormProps = {
  institution: Institution | null;
  onCancel: () => void;
  onSaved: () => void;
};

  const InstitutionForm: React.FC<InstitutionFormProps> = ({ institution, onCancel, onSaved }) => {
    const [form, setForm] = useState<Partial<Institution>>({
      name: institution?.name || '',
      address: institution?.address || '',
      city: institution?.city || '',
      phone: institution?.phone || '',
      email: institution?.email || '',
      website: institution?.website || '',
      institution_type: institution?.institution_type || 'university',
      accreditation_status: institution?.accreditation_status || 'pending',
      logo_url: institution?.logo_url || '',
      ownership_type: institution?.ownership_type || '',
      founded_on: institution?.founded_on || '',
      accreditation_valid_from: institution?.accreditation_valid_from || '',
      accreditation_valid_to: institution?.accreditation_valid_to || '',
      competent_authority: institution?.competent_authority || '',
      notes: institution?.notes || '',
      registration_number: (institution as any)?.registration_number || '',
      tax_id: (institution as any)?.tax_id || '',
      short_name: (institution as any)?.short_name || '',
      municipality: (institution as any)?.municipality || '',
      postal_code: (institution as any)?.postal_code || '',
      country: (institution as any)?.country || 'Bosna i Hercegovina',
      founder_name: (institution as any)?.founder_name || '',
      founding_act_reference: (institution as any)?.founding_act_reference || '',
      head_name: (institution as any)?.head_name || '',
      head_title: (institution as any)?.head_title || '',
      fax: (institution as any)?.fax || '',
      is_active: (institution as any)?.is_active ?? true
    });
    const [formError, setFormError] = useState<string | null>(null);
    const isEmailValid = (email?: string) => !!email && /.+@.+\..+/.test(email);
    const municipalities = ['Centar', 'Stari Grad', 'Novo Sarajevo', 'Novi Grad', 'Ilidža', 'Ilijaš', 'Vogošća', 'Hadžići'];
    const authorities = ['Ministarstvo civilnih poslova BiH', 'Ministarstvo obrazovanja KS', 'Ministarstvo prosvjete i kulture RS'];
    const [openIdentitet, setOpenIdentitet] = useState(true);
    const [openLokacija, setOpenLokacija] = useState(true);
    const [openOsnivanje, setOpenOsnivanje] = useState(true);
    const [openRukovodjenje, setOpenRukovodjenje] = useState(true);
    const [openKontakt, setOpenKontakt] = useState(true);
    const [openAkreditacija, setOpenAkreditacija] = useState(true);
    const isFormValid = () => {
      if (!form.name || String(form.name).trim().length < 2) return false;
      if (!form.city || String(form.city).trim().length < 2) return false;
      if (!form.address || String(form.address).trim().length < 2) return false;
      if (!isEmailValid(form.email)) return false;
      return true;
    };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const slug = (form.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const payload = { ...form, logo_url: form.logo_url || `/logos/${slug}.svg` };
      if (institution) {
        await api.updateInstitution(institution.id, payload);
      } else {
        await api.createInstitution(payload);
      }
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška pri snimanju ustanove';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="border rounded">
          <button type="button" onClick={() => setOpenIdentitet(!openIdentitet)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Identitet</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openIdentitet ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openIdentitet && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                <input name="name" value={form.name || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kratak naziv</label>
                <input name="short_name" value={String((form as any).short_name || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registracioni broj</label>
                <input name="registration_number" value={String((form as any).registration_number || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JIB</label>
                <input name="tax_id" value={String((form as any).tax_id || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload logo</label>
                <div className="flex items-center">
                  <input id="admin-inst-logo-file" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (!f) return;
                    const targetId = (institution?.id || '') as string;
                    try {
                      const resp = await api.uploadInstitutionLogo(targetId, f);
                      setForm((prev) => ({ ...prev, logo_url: resp.logo_url }));
                    } catch (err) {
                      try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const dataUrl = reader.result as string;
                          try {
                            if (targetId) await api.updateInstitution(targetId, { logo_url: dataUrl });
                            setForm((prev) => ({ ...prev, logo_url: dataUrl }));
                          } catch {
                            setFormError('Greška pri snimanju loga');
                          }
                        };
                        reader.readAsDataURL(f);
                      } catch {
                        setFormError('Greška pri uploadu loga');
                      }
                    }
                  }} />
                  <label htmlFor="admin-inst-logo-file" className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer">Izaberi logo</label>
                  {form.logo_url && (
                    <img src={String(form.logo_url).startsWith('/uploads/') ? `http://localhost:3001${form.logo_url}` : String(form.logo_url)} alt="Logo preview" className="h-10 w-10 rounded object-cover ml-3" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border rounded">
          <button type="button" onClick={() => setOpenLokacija(!openLokacija)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Lokacija</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openLokacija ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openLokacija && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
                <input name="address" value={form.address || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                <input name="city" value={form.city || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Općina</label>
                <select name="municipality" value={String((form as any).municipality || '')} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">(nije postavljeno)</option>
                  {municipalities.map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poštanski broj</label>
                <input name="postal_code" value={String((form as any).postal_code || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Država</label>
                <input name="country" value={String((form as any).country || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          )}
        </div>
        <div className="border rounded">
          <button type="button" onClick={() => setOpenOsnivanje(!openOsnivanje)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Osnivanje</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openOsnivanje ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openOsnivanje && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oblik vlasništva</label>
                <select name="ownership_type" value={form.ownership_type || ''} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">(nije postavljeno)</option>
                  <option value="Javna">Javna</option>
                  <option value="Privatna">Privatna</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum osnivanja</label>
                <input type="date" name="founded_on" value={form.founded_on || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Osnivač</label>
                <input name="founder_name" value={String((form as any).founder_name || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Akt o osnivanju</label>
                <input name="founding_act_reference" value={String((form as any).founding_act_reference || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          )}
        </div>
        <div className="border rounded">
          <button type="button" onClick={() => setOpenRukovodjenje(!openRukovodjenje)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Rukovođenje</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openRukovodjenje ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openRukovodjenje && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rukovodilac</label>
                <input name="head_name" value={String((form as any).head_name || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titula rukovodioca</label>
                <input name="head_title" value={String((form as any).head_title || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          )}
        </div>
        <div className="border rounded">
          <button type="button" onClick={() => setOpenKontakt(!openKontakt)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Kontakt</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openKontakt ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openKontakt && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={form.email || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="website" value={form.website || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input name="phone" value={form.phone || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text sm font-medium text-gray-700 mb-1">Fax</label>
                <input name="fax" value={String((form as any).fax || '')} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                <input name="notes" value={form.notes || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          )}
        </div>
        <div className="border rounded">
          <button type="button" onClick={() => setOpenAkreditacija(!openAkreditacija)} className="w-full flex justify-between items-center px-4 py-2">
            <span className="font-semibold">Akreditacija</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openAkreditacija ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {openAkreditacija && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status akreditacije</label>
                <select name="accreditation_status" value={form.accreditation_status || 'pending'} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="pending">U procesu</option>
                  <option value="accredited">Akreditirana</option>
                  <option value="expired">Istekla</option>
                  <option value="suspended">Suspendirana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nadležna obrazovna vlast</label>
                <select name="competent_authority" value={String(form.competent_authority || '')} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">(nije postavljeno)</option>
                  {authorities.map(a => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija OD</label>
                <input type="date" name="accreditation_valid_from" value={form.accreditation_valid_from || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija DO</label>
                <input type="date" name="accreditation_valid_to" value={form.accreditation_valid_to || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aktivna</label>
                <select name="is_active" value={String(((form as any).is_active) ? 1 : 0)} onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.value === '1' }))} className="w-full border rounded px-3 py-2">
                  <option value="1">Da</option>
                  <option value="0">Ne</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      {formError && (
        <div className="text-sm text-red-600">{formError}</div>
      )}
      <div className="flex justify-end space-x-2 sticky bottom-0 bg-white pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Otkaži</button>
        <button type="submit" disabled={!isFormValid()} className={`px-4 py-2 rounded ${isFormValid() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Sačuvaj</button>
      </div>
    </form>
  );
};
