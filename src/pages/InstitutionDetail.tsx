import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Globe, Award, Calendar, Users, ArrowLeft, ExternalLink, Plus, Pencil, Trash2, FileCheck, List, LayoutGrid, ChevronDown, FilePlus } from 'lucide-react';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { DocumentSection } from '@/components/documents/DocumentSection';
import { useInstitutionStore } from '../stores/institutionStore';
import { useAuthStore } from '../stores/authStore';
import { api, StudyProgram, AccreditationProcess } from '@/services/api';

const InstitutionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedInstitution, fetchInstitution, isLoading } = useInstitutionStore();
  const { user } = useAuthStore();
  const [showEditInstitutionModal, setShowEditInstitutionModal] = useState(false);
  const [editInstitutionForm, setEditInstitutionForm] = useState<{ name: string; city: string; address: string; email: string; phone?: string; website?: string; ownership_type?: string; founded_on?: string; institution_type: 'university'|'college'|'academy'; accreditation_status: 'pending'|'accredited'|'expired'|'suspended'; accreditation_valid_from?: string; accreditation_valid_to?: string; logo_url?: string; competent_authority?: string; notes?: string }>({ name: '', city: '', address: '', email: '', institution_type: 'university', accreditation_status: 'pending' });
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyProgram | null>(null);
  const [programForm, setProgramForm] = useState<Partial<StudyProgram>>({
    name: '',
    degree_level: 'bachelor',
    duration_years: 3,
    ects_credits: 180,
    accreditation_status: 'pending'
  });
  const [programDocFiles, setProgramDocFiles] = useState<File[]>([]);
  const [programDocType, setProgramDocType] = useState<string>('curriculum');
  const [processes, setProcesses] = useState<AccreditationProcess[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showEditProcessModal, setShowEditProcessModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<AccreditationProcess | null>(null);
  const [editProcessForm, setEditProcessForm] = useState<{ notes?: string; program_id?: string }>({});
  const [processForm, setProcessForm] = useState<{ process_type: 'initial' | 'renewal' | 're-evaluation'; application_date: string; notes?: string; program_id?: string }>({ process_type: 'initial', application_date: new Date().toISOString().slice(0,10) });
  const [processDocFiles, setProcessDocFiles] = useState<File[]>([]);
  const [processDocType, setProcessDocType] = useState<string>('application');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionProcess, setDecisionProcess] = useState<AccreditationProcess | null>(null);
  const [decisionForm, setDecisionForm] = useState<{ status: AccreditationProcess['status']; decision?: string; decision_date?: string; accreditation_expiry?: string; accreditation_valid_to?: string }>({ status: 'under_review' });
  const [programView, setProgramView] = useState<'grid' | 'list'>('grid');
  const municipalities = ['Centar', 'Stari Grad', 'Novo Sarajevo', 'Novi Grad', 'Ilidža', 'Ilijaš', 'Vogošća', 'Hadžići'];
  const authorities = ['Ministarstvo civilnih poslova BiH', 'Ministarstvo obrazovanja KS', 'Ministarstvo prosvjete i kulture RS'];
  const [openIdentitetEdit, setOpenIdentitetEdit] = useState(true);
  const [openLokacijaEdit, setOpenLokacijaEdit] = useState(true);
  const [openOsnivanjeEdit, setOpenOsnivanjeEdit] = useState(true);
  const [openRukovodjenjeEdit, setOpenRukovodjenjeEdit] = useState(true);
  const [openKontaktEdit, setOpenKontaktEdit] = useState(true);
  const [openAkreditacijaEdit, setOpenAkreditacijaEdit] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docAssociation, setDocAssociation] = useState<{ institution_id?: string; program_id?: string; process_id?: string }>({});
  const [instDocsOpen, setInstDocsOpen] = useState(true);
  const [instDocsRefresh, setInstDocsRefresh] = useState(0);

  useEffect(() => {
    if (id) {
      fetchInstitution(id);
      (async () => {
        try {
          const procs = await api.getAccreditationProcesses({ institution_id: id });
          setProcesses(procs);
        } catch {}
      })();
    }
  }, [id, fetchInstitution]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accredited':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'accredited':
        return 'Akreditirana';
      case 'pending':
        return 'U procesu';
      case 'expired':
        return 'Istekla';
      case 'suspended':
        return 'Suspendirana';
      default:
        return status;
    }
  };

  const translateType = (type: string) => {
    switch (type) {
      case 'university':
        return 'Univerzitet';
      case 'college':
        return 'Fakultet';
      case 'academy':
        return 'Akademija';
      default:
        return type;
    }
  };
  const translateProcessType = (t: string) => {
    switch (t) {
      case 'initial':
        return 'Početna akreditacija';
      case 'renewal':
        return 'Obnova akreditacije';
      case 're-evaluation':
        return 'Ponovna evaluacija';
      default:
        return t;
    }
  };
  const translateProcessStatus = (s: string) => {
    switch (s) {
      case 'submitted':
        return 'Podnesen';
      case 'under_review':
        return 'U pregledu';
      case 'approved':
        return 'Odobren';
      case 'rejected':
        return 'Odbijen';
      case 'appeal':
        return 'Žalba';
      default:
        return s;
    }
  };
  const resolveLogoUrl = (u?: string) => (u && u.startsWith('/uploads/')) ? `http://localhost:3001${u}` : (u || '');

  const isEmailValid = (email?: string) => !!email && /.+@.+\..+/.test(email);
  const isInstitutionFormValid = () => {
    if (!editInstitutionForm.name || editInstitutionForm.name.trim().length < 2) return false;
    if (!editInstitutionForm.city || editInstitutionForm.city.trim().length < 2) return false;
    if (!editInstitutionForm.address || editInstitutionForm.address.trim().length < 2) return false;
    if (!isEmailValid(editInstitutionForm.email)) return false;
    return true;
  };
  const handleInstitutionEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditInstitutionForm((prev) => ({ ...prev, [name]: value }));
  };
  const openEditInstitution = () => {
    if (!selectedInstitution) return;
    setEditInstitutionForm({
      name: selectedInstitution.name || '',
      city: selectedInstitution.city || '',
      address: selectedInstitution.address || '',
      email: selectedInstitution.email || '',
      phone: selectedInstitution.phone || '',
      website: selectedInstitution.website || '',
      ownership_type: (selectedInstitution as any).ownership_type || '',
      founded_on: (selectedInstitution as any).founded_on || '',
      institution_type: selectedInstitution.institution_type as any,
      accreditation_status: selectedInstitution.accreditation_status as any,
      accreditation_valid_from: (selectedInstitution as any).accreditation_valid_from || '',
      accreditation_valid_to: (selectedInstitution as any).accreditation_valid_to || '',
      logo_url: selectedInstitution.logo_url || '',
      competent_authority: (selectedInstitution as any).competent_authority || '',
      notes: (selectedInstitution as any).notes || ''
    });
    setShowEditInstitutionModal(true);
  };
  const submitInstitutionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditFormError(null);
      await api.updateInstitution(id!, editInstitutionForm as any);
      setShowEditInstitutionModal(false);
      await fetchInstitution(id!);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Greška pri snimanju ustanove';
      setEditFormError(msg);
    }
  };

  const translateDegreeLevel = (level: string) => {
    switch (level) {
      case 'bachelor':
        return 'Prvi ciklus (Bachelor)';
      case 'master':
        return 'Drugi ciklus (Master)';
      case 'phd':
        return 'Treći ciklus (PhD)';
      case 'professional':
        return 'Strukovni studij';
      default:
        return level;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje detalja o ustanovi...</p>
        </div>
      </div>
    );
  }

  if (!selectedInstitution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ustanova nije pronađena</h2>
          <p className="text-gray-600 mb-4">Tražena ustanova ne postoji u sistemu.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-blue-600">Registar</Link>
          <span>/</span>
          <span className="text-gray-900">{selectedInstitution.name}</span>
        </nav>

        {/* Back Button */}
        <div className="mb-4">
          <Link
            to="/registar"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu ustanova
          </Link>
        </div>

        {/* Institution Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start justify-between">
            <div className="flex items-start space-x-6 mb-6 md:mb-0">
              {selectedInstitution.logo_url && (
                <img
                  src={selectedInstitution.logo_url?.startsWith('/uploads/') ? `http://localhost:3001${selectedInstitution.logo_url}` : (selectedInstitution.logo_url as string)}
                  alt={selectedInstitution.name}
                  className="h-20 w-20 rounded-full object-cover"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.onerror = null;
                    t.src = '/logos/default.svg';
                  }}
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedInstitution.name}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(selectedInstitution.accreditation_status)
                  }`}>
                    <Award className="h-4 w-4 mr-1" />
                    {translateStatus(selectedInstitution.accreditation_status)}
                  </span>
                  <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {translateType(selectedInstitution.institution_type)}
                  </span>
                </div>
                
                
              </div>
            </div>
            
            
          </div>
          
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Podaci o ustanovi</h2>
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button onClick={openEditInstitution} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <Pencil className="h-4 w-4 mr-2" />
                Uredi podatke
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-16 lg:gap-x-24">
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Kratak naziv:</span><span className="font-medium">{(selectedInstitution as any).short_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tip ustanove:</span><span className="font-medium">{translateType(selectedInstitution.institution_type)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Oblik vlasništva:</span><span className="font-medium">{selectedInstitution.ownership_type || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Datum osnivanja:</span><span className="font-medium">{selectedInstitution.founded_on ? new Date(selectedInstitution.founded_on).toLocaleDateString('bs-BA') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Registracioni broj:</span><span className="font-medium">{(selectedInstitution as any).registration_number || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">JIB:</span><span className="font-medium">{(selectedInstitution as any).tax_id || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status akreditacije:</span><span className="font-medium">{translateStatus(selectedInstitution.accreditation_status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Akreditacija od:</span><span className="font-medium">{selectedInstitution.accreditation_valid_from ? new Date(selectedInstitution.accreditation_valid_from).toLocaleDateString('bs-BA') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Akreditacija do:</span><span className="font-medium">{selectedInstitution.accreditation_valid_to ? new Date(selectedInstitution.accreditation_valid_to).toLocaleDateString('bs-BA') : '-'}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Adresa:</span><span className="font-medium">{selectedInstitution.address}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Grad:</span><span className="font-medium">{selectedInstitution.city}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Općina:</span><span className="font-medium">{(selectedInstitution as any).municipality || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Poštanski broj:</span><span className="font-medium">{(selectedInstitution as any).postal_code || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Država:</span><span className="font-medium">{(selectedInstitution as any).country || 'Bosna i Hercegovina'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Telefon:</span><span className="font-medium">{selectedInstitution.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Fax:</span><span className="font-medium">{(selectedInstitution as any).fax || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-medium">{selectedInstitution.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Website:</span><span className="font-medium">{selectedInstitution.website || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Nadležna obrazovna vlast:</span><span className="font-medium">{selectedInstitution.competent_authority || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Osnivač:</span><span className="font-medium">{(selectedInstitution as any).founder_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Akt o osnivanju:</span><span className="font-medium">{(selectedInstitution as any).founding_act_reference || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Rukovodilac:</span><span className="font-medium">{(selectedInstitution as any).head_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Titula:</span><span className="font-medium">{(selectedInstitution as any).head_title || '-'}</span></div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-gray-600 mb-1">Napomena</div>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-800">{selectedInstitution.notes || '-'}</div>
          </div>
          <div className="mt-6">
            <DocumentSection title="Dokumenti ustanove" association={{ institution_id: selectedInstitution.id }} initiallyOpen={true} />
          </div>
        </div>

        {/* Study Programs */}
        {selectedInstitution.programs && selectedInstitution.programs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Studijski programi</h2>
              {user?.role === 'admin' || user?.role === 'operator' ? (
                <button onClick={() => { setEditingProgram(null); setProgramForm({ name: '', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'pending' }); setShowProgramModal(true); }} className="ml-auto inline-flex items-center px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4 mr-2" />Dodaj program</button>
              ) : <div className="ml-auto" />}
              <div className="ml-2 inline-flex rounded border">
                <button onClick={() => setProgramView('grid')} className={`px-3 py-2 text-sm ${programView === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}><LayoutGrid className="h-4 w-4" /></button>
                <button onClick={() => setProgramView('list')} className={`px-3 py-2 text-sm border-l ${programView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}><List className="h-4 w-4" /></button>
              </div>
            </div>

            {programView === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedInstitution.programs.map((program) => (
                  <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{program.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between"><span className="text-gray-600">Stepen studija:</span><span className="font-medium">{translateDegreeLevel(program.degree_level)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Trajanje:</span><span className="font-medium">{program.duration_years} godine</span></div>
                      {program.ects_credits && (<div className="flex justify-between"><span className="text-gray-600">ECTS kredita:</span><span className="font-medium">{program.ects_credits}</span></div>)}
                      {program.accreditation_expiry && (<div className="flex justify-between"><span className="text-gray-600">Istek akreditacije:</span><span className="font-medium">{new Date(program.accreditation_expiry).toLocaleDateString('bs-BA')}</span></div>)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.accreditation_status)}`}>{translateStatus(program.accreditation_status)}</span>
                      {program.accreditation_status === 'accredited' && program.accreditation_expiry && (
                        <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-1" /><span>{new Date(program.accreditation_expiry) < new Date() ? 'Istekla' : 'Važeća'}</span></div>
                      )}
                      {(user?.role === 'admin' || user?.role === 'operator') && (
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingProgram(program); setProgramForm({ name: program.name, degree_level: program.degree_level, duration_years: program.duration_years, ects_credits: program.ects_credits, accreditation_status: program.accreditation_status, accreditation_expiry: program.accreditation_expiry }); setShowProgramModal(true); }} className="text-green-600 hover:text-green-800"><Pencil className="h-4 w-4" /></button>
                          <button onClick={async () => { if (confirm('Obrisati program?')) { try { await api.deleteStudyProgram(program.id); await fetchInstitution(id!); } catch { alert('Brisanje nije uspjelo'); } } }} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <DocumentSection title="Dokumenti programa" association={{ program_id: program.id }} initiallyOpen={false} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naziv</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stepen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajanje</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECTS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Istek</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AKCIJE</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInstitution.programs.map((program) => (
                      <tr key={program.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{translateDegreeLevel(program.degree_level)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{program.duration_years} g.</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{program.ects_credits ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(program.accreditation_status)}`}>{translateStatus(program.accreditation_status)}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{program.accreditation_expiry ? new Date(program.accreditation_expiry).toLocaleDateString('bs-BA') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {(user?.role === 'admin' || user?.role === 'operator') && (
                            <div className="flex space-x-2">
                              <button onClick={() => { setEditingProgram(program); setProgramForm({ name: program.name, degree_level: program.degree_level, duration_years: program.duration_years, ects_credits: program.ects_credits, accreditation_status: program.accreditation_status, accreditation_expiry: program.accreditation_expiry }); setShowProgramModal(true); }} className="text-green-600 hover:text-green-900">Uredi</button>
                              <button onClick={async () => { if (confirm('Obrisati program?')) { try { await api.deleteStudyProgram(program.id); await fetchInstitution(id!); } catch { alert('Brisanje nije uspjelo'); } } }} className="text-red-600 hover:text-red-900">Obriši</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Institution Documents moved into Podaci o ustanovi */}

        {/* No programs message with add button for admin */}
        {selectedInstitution.programs && selectedInstitution.programs.length === 0 && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Studijski programi</h2>
            </div>
            <p className="text-gray-600 mb-4">Nema prijavljenih programa. Dodajte prvi program.</p>
            <button onClick={() => { setEditingProgram(null); setProgramForm({ name: '', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'pending' }); setShowProgramModal(true); }} className="inline-flex items-center px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4 mr-2" />Dodaj program</button>
          </div>
        )}

        {/* Processes */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center mb-6">
            <FileCheck className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Procesi akreditacije</h2>
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button onClick={() => setShowProcessModal(true)} className="ml-auto inline-flex items-center px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4 mr-2" />Novi proces</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Za program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Podneseno</th>
                  {(user?.role === 'admin' || user?.role === 'operator') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28"></th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processes.map((proc) => (
                  <React.Fragment key={proc.id}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{translateProcessType(proc.process_type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{translateProcessStatus(proc.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => { const pid = (proc as any).program_id as string | undefined; return pid ? (selectedInstitution.programs?.find(p => p.id === pid)?.name || pid) : '-'; })()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(proc.application_date).toLocaleDateString('bs-BA')}</td>
                      {(user?.role === 'admin' || user?.role === 'operator') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button onClick={() => { setDecisionProcess(proc); setDecisionForm({ status: 'under_review', decision: proc.decision, decision_date: proc.decision_date }); setShowDecisionModal(true); }} className="text-blue-600 hover:text-blue-900">Odluka</button>
                            <button onClick={() => { setEditingProcess(proc); setEditProcessForm({ notes: proc.notes, program_id: (proc as any).program_id }); setShowEditProcessModal(true); }} className="text-green-600 hover:text-green-900">Uredi</button>
                            <button onClick={async () => { if (confirm('Obrisati proces?')) { try { await api.deleteAccreditationProcess(proc.id); const procs = await api.getAccreditationProcesses({ institution_id: id! }); setProcesses(procs); } catch { alert('Brisanje nije uspjelo'); } } }} className="text-red-600 hover:text-red-900">Obriši</button>
                          </div>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td colSpan={(user?.role === 'admin' || user?.role === 'operator') ? 5 : 4} className="px-6 py-4">
                        <DocumentSection title={`Dokumenti procesa: ${translateProcessType(proc.process_type)}`} association={{ process_id: proc.id }} initiallyOpen={false} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Program Modal */}
        {showProgramModal && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowProgramModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{editingProgram ? 'Uredi program' : 'Dodaj program'}</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={async (e) => { e.preventDefault(); try { if (editingProgram) { await api.updateStudyProgram(editingProgram.id, { ...programForm }); if (programDocFiles.length) { for (const f of programDocFiles) { await api.uploadDocument(f, { program_id: editingProgram.id, document_type: programDocType }); } } } else { const created = await api.createStudyProgram({ institution_id: id!, ...programForm }); if (programDocFiles.length) { for (const f of programDocFiles) { await api.uploadDocument(f, { program_id: created.id, document_type: programDocType }); } } } setProgramDocFiles([]); setShowProgramModal(false); await fetchInstitution(id!); } catch { alert('Greška pri snimanju programa'); } }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                      <input value={programForm.name || ''} onChange={(e) => setProgramForm(p => ({ ...p, name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stepen studija</label>
                      <select value={programForm.degree_level || 'bachelor'} onChange={(e) => setProgramForm(p => ({ ...p, degree_level: e.target.value as any }))} className="w-full border rounded px-3 py-2">
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                        <option value="phd">PhD</option>
                        <option value="professional">Strukovni</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trajanje (godine)</label>
                      <input type="number" min={1} max={6} value={programForm.duration_years || 3} onChange={(e) => setProgramForm(p => ({ ...p, duration_years: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ECTS kredita</label>
                      <input type="number" min={60} max={360} value={programForm.ects_credits || 180} onChange={(e) => setProgramForm(p => ({ ...p, ects_credits: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status akreditacije</label>
                      <select value={programForm.accreditation_status || 'pending'} onChange={(e) => setProgramForm(p => ({ ...p, accreditation_status: e.target.value }))} className="w-full border rounded px-3 py-2">
                        <option value="pending">U procesu</option>
                        <option value="accredited">Akreditiran</option>
                        <option value="expired">Istekao</option>
                        <option value="suspended">Suspendovan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Istek akreditacije</label>
                      <input type="date" value={programForm.accreditation_expiry || ''} onChange={(e) => setProgramForm(p => ({ ...p, accreditation_expiry: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                  </div>
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">Dokumenti programa</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tip dokumenta</label>
                        <select value={programDocType} onChange={(e) => setProgramDocType(e.target.value)} className="w-full border rounded px-3 py-2">
                          <option value="curriculum">Plan i program</option>
                          <option value="decision">Odluka</option>
                          <option value="certificate">Certifikat</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">PDF fajlovi</label>
                        <input type="file" accept="application/pdf" multiple onChange={(e) => setProgramDocFiles(Array.from(e.target.files || []).filter(f => f.type === 'application/pdf'))} />
                        {programDocFiles.length > 0 && (
                          <div className="mt-2 text-sm text-gray-700">
                            {programDocFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1">
                                <span>{f.name}</span>
                                <button type="button" className="text-red-600" onClick={() => setProgramDocFiles(fs => fs.filter(x => x !== f))}>Ukloni</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 border-t pt-4">
                    <button type="button" onClick={() => setShowProgramModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Decision Modal */}
        {showDecisionModal && decisionProcess && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowDecisionModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Odluka o procesu</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={async (e) => { e.preventDefault(); try { await api.updateAccreditationProcess(decisionProcess.id, { status: decisionForm.status, decision: decisionForm.decision, decision_date: decisionForm.decision_date, ...(decisionForm.accreditation_expiry ? { accreditation_expiry: decisionForm.accreditation_expiry } as any : {}), ...(decisionForm.accreditation_valid_to ? { accreditation_valid_to: decisionForm.accreditation_valid_to } as any : {}), }); setShowDecisionModal(false); const procs = await api.getAccreditationProcesses({ institution_id: id! }); setProcesses(procs); if (id) await fetchInstitution(id); } catch { alert('Greška pri snimanju odluke'); } }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={decisionForm.status} onChange={(e) => setDecisionForm(f => ({ ...f, status: e.target.value as AccreditationProcess['status'] }))} className="w-full border rounded px-3 py-2">
                        <option value="under_review">U pregledu</option>
                        <option value="approved">Odobreno</option>
                        <option value="rejected">Odbijeno</option>
                        <option value="appeal">Žalba</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum odluke</label>
                      <input type="date" value={decisionForm.decision_date || ''} onChange={(e) => setDecisionForm(f => ({ ...f, decision_date: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Odluka</label>
                      <input value={decisionForm.decision || ''} onChange={(e) => setDecisionForm(f => ({ ...f, decision: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                    {((decisionProcess as any).program_id) ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Istek akreditacije programa (ako odobreno)</label>
                        <input type="date" value={decisionForm.accreditation_expiry || ''} onChange={(e) => setDecisionForm(f => ({ ...f, accreditation_expiry: e.target.value }))} className="w-full border rounded px-3 py-2" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija ustanove DO (ako odobreno)</label>
                        <input type="date" value={decisionForm.accreditation_valid_to || ''} onChange={(e) => setDecisionForm(f => ({ ...f, accreditation_valid_to: e.target.value }))} className="w-full border rounded px-3 py-2" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 border-t pt-4">
                    <button type="button" onClick={() => setShowDecisionModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Process Modal */}
        {showProcessModal && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowProcessModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Novi proces akreditacije</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={async (e) => { e.preventDefault(); try { const created = await api.createAccreditationProcess({ institution_id: id!, process_type: processForm.process_type, application_date: processForm.application_date, notes: processForm.notes, program_id: processForm.program_id }); if (processDocFiles.length) { for (const f of processDocFiles) { await api.uploadDocument(f, { process_id: created.id, document_type: processDocType }); } } setProcessDocFiles([]); setShowProcessModal(false); const procs = await api.getAccreditationProcesses({ institution_id: id! }); setProcesses(procs); if (id) await fetchInstitution(id); } catch { alert('Greška pri snimanju procesa'); } }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tip procesa</label>
                      <select value={processForm.process_type} onChange={(e) => setProcessForm(p => ({ ...p, process_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
                        <option value="initial">Početna akreditacija</option>
                        <option value="renewal">Obnova akreditacije</option>
                        <option value="re-evaluation">Ponovna evaluacija</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum podnošenja</label>
                      <input type="date" value={processForm.application_date} onChange={(e) => setProcessForm(p => ({ ...p, application_date: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Za program (opcionalno)</label>
                      <select value={processForm.program_id || ''} onChange={(e) => setProcessForm(p => ({ ...p, program_id: e.target.value || undefined }))} className="w-full border rounded px-3 py-2">
                        <option value="">(Nijedan – proces na nivou ustanove)</option>
                        {selectedInstitution.programs?.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                      <input value={processForm.notes || ''} onChange={(e) => setProcessForm(p => ({ ...p, notes: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                  </div>
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">Dokumenti procesa</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tip dokumenta</label>
                        <select value={processDocType} onChange={(e) => setProcessDocType(e.target.value)} className="w-full border rounded px-3 py-2">
                          <option value="application">Zahtjev</option>
                          <option value="self_evaluation">Samoevaluacija</option>
                          <option value="external_report">Izvještaj komisije</option>
                          <option value="decision">Odluka</option>
                          <option value="certificate">Certifikat</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">PDF fajlovi</label>
                        <input type="file" accept="application/pdf" multiple onChange={(e) => setProcessDocFiles(Array.from(e.target.files || []).filter(f => f.type === 'application/pdf'))} />
                        {processDocFiles.length > 0 && (
                          <div className="mt-2 text-sm text-gray-700">
                            {processDocFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1">
                                <span>{f.name}</span>
                                <button type="button" className="text-red-600" onClick={() => setProcessDocFiles(fs => fs.filter(x => x !== f))}>Ukloni</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 border-t pt-4">
                    <button type="button" onClick={() => setShowProcessModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Process Modal */}
        {showEditProcessModal && editingProcess && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowEditProcessModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Uredi proces</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={async (e) => { e.preventDefault(); try { await api.updateAccreditationProcess(editingProcess.id, { notes: editProcessForm.notes, program_id: editProcessForm.program_id }); setShowEditProcessModal(false); const procs = await api.getAccreditationProcesses({ institution_id: id! }); setProcesses(procs); if (id) await fetchInstitution(id); } catch { alert('Greška pri snimanju procesa'); } }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tip procesa</label>
                      <input value={editingProcess.process_type} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum podnošenja</label>
                      <input value={editingProcess.application_date} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Za program (opcionalno)</label>
                      <select value={editProcessForm.program_id || ''} onChange={(e) => setEditProcessForm(p => ({ ...p, program_id: e.target.value || undefined }))} className="w-full border rounded px-3 py-2">
                        <option value="">(Nijedan – proces na nivou ustanove)</option>
                        {selectedInstitution.programs?.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                      <input value={editProcessForm.notes || ''} onChange={(e) => setEditProcessForm(p => ({ ...p, notes: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 border-t pt-4">
                    <button type="button" onClick={() => setShowEditProcessModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showEditInstitutionModal && (user?.role === 'admin' || user?.role === 'operator') && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowEditInstitutionModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full sm:max-w-3xl max-w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-medium text-gray-900">Uredi podatke ustanove</h3>
              </div>
              <div className="px-6 py-4 overflow-y-auto flex-1">
                <form onSubmit={submitInstitutionEdit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenIdentitetEdit(!openIdentitetEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Identitet</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openIdentitetEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openIdentitetEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                            <input name="name" value={editInstitutionForm.name} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kratak naziv</label>
                            <input name="short_name" value={(editInstitutionForm as any).short_name || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registracioni broj</label>
                            <input name="registration_number" value={(editInstitutionForm as any).registration_number || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">JIB</label>
                            <input name="tax_id" value={(editInstitutionForm as any).tax_id || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload logo</label>
                            <div className="flex items-center">
                        <input id="inst-logo-file" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploadingLogo(true);
                          try {
                            const resp = await api.uploadInstitutionLogo(id!, f);
                            setEditInstitutionForm((prev) => ({ ...prev, logo_url: resp.logo_url }));
                            await fetchInstitution(id!);
                          } catch (err) {
                            try {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const dataUrl = reader.result as string;
                                try {
                                  await api.updateInstitution(id!, { logo_url: dataUrl });
                                  setEditInstitutionForm((prev) => ({ ...prev, logo_url: dataUrl }));
                                  await fetchInstitution(id!);
                                } catch {
                                  setEditFormError('Greška pri snimanju loga');
                                }
                              };
                              reader.readAsDataURL(f);
                            } catch {
                              setEditFormError('Greška pri uploadu loga');
                            }
                          } finally {
                            setUploadingLogo(false);
                          }
                        }} />
                        <label htmlFor="inst-logo-file" className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer">Izaberi logo</label>
                        {editInstitutionForm.logo_url && (
                          <img src={resolveLogoUrl(editInstitutionForm.logo_url)} alt="Logo preview" className="h-10 w-10 rounded object-cover ml-3" />
                        )}
                      </div>
                      {uploadingLogo && (<div className="text-xs text-gray-600 mt-1">Upload...</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenLokacijaEdit(!openLokacijaEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Lokacija</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openLokacijaEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openLokacijaEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
                            <input name="address" value={editInstitutionForm.address} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                            <input name="city" value={editInstitutionForm.city} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Općina</label>
                            <select name="municipality" value={(editInstitutionForm as any).municipality || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2">
                              <option value="">(nije postavljeno)</option>
                              {municipalities.map(m => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Poštanski broj</label>
                            <input name="postal_code" value={(editInstitutionForm as any).postal_code || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Država</label>
                            <input name="country" value={(editInstitutionForm as any).country || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenOsnivanjeEdit(!openOsnivanjeEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Osnivanje</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openOsnivanjeEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openOsnivanjeEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Oblik vlasništva</label>
                            <select name="ownership_type" value={editInstitutionForm.ownership_type || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2">
                              <option value="">(nije postavljeno)</option>
                              <option value="Javna">Javna</option>
                              <option value="Privatna">Privatna</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Datum osnivanja</label>
                            <input type="date" name="founded_on" value={editInstitutionForm.founded_on || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Osnivač</label>
                            <input name="founder_name" value={(editInstitutionForm as any).founder_name || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Akt o osnivanju</label>
                            <input name="founding_act_reference" value={(editInstitutionForm as any).founding_act_reference || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenRukovodjenjeEdit(!openRukovodjenjeEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Rukovođenje</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openRukovodjenjeEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openRukovodjenjeEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rukovodilac</label>
                            <input name="head_name" value={(editInstitutionForm as any).head_name || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titula rukovodioca</label>
                            <input name="head_title" value={(editInstitutionForm as any).head_title || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenKontaktEdit(!openKontaktEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Kontakt</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openKontaktEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openKontaktEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={editInstitutionForm.email} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input name="website" value={editInstitutionForm.website || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input name="phone" value={editInstitutionForm.phone || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                            <input name="fax" value={(editInstitutionForm as any).fax || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                            <input name="notes" value={editInstitutionForm.notes || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setOpenAkreditacijaEdit(!openAkreditacijaEdit)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Akreditacija</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openAkreditacijaEdit ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {openAkreditacijaEdit && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status akreditacije</label>
                            <select name="accreditation_status" value={editInstitutionForm.accreditation_status} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2">
                              <option value="pending">U procesu</option>
                              <option value="accredited">Akreditirana</option>
                              <option value="expired">Istekla</option>
                              <option value="suspended">Suspendirana</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nadležna obrazovna vlast</label>
                            <select name="competent_authority" value={editInstitutionForm.competent_authority || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2">
                              <option value="">(nije postavljeno)</option>
                              {authorities.map(a => (<option key={a} value={a}>{a}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija OD</label>
                            <input type="date" name="accreditation_valid_from" value={editInstitutionForm.accreditation_valid_from || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija DO</label>
                            <input type="date" name="accreditation_valid_to" value={editInstitutionForm.accreditation_valid_to || ''} onChange={handleInstitutionEditChange} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border rounded">
                      <button type="button" onClick={() => setInstDocsOpen(!instDocsOpen)} className="w-full flex justify-between items-center px-4 py-2">
                        <span className="font-semibold">Dokumenti</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${instDocsOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      {instDocsOpen && (
                        <div className="px-4 pb-4">
                          <div className="flex justify-end mb-3">
                            <button onClick={() => { setDocAssociation({ institution_id: selectedInstitution.id }); setShowDocModal(true); }} className="inline-flex items-center px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">Dodaj dokument</button>
                          </div>
                          <DocumentList association={{ institution_id: selectedInstitution.id }} refreshToken={instDocsRefresh} />
                        </div>
                      )}
                    </div>
                  </div>
                  {editFormError && (
                    <div className="text-sm text-red-600">{editFormError}</div>
                  )}
                  <div className="flex justify-end space-x-2 sticky bottom-0 bg-white pt-4 border-t">
                    <button type="button" onClick={() => setShowEditInstitutionModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
                    <button type="submit" disabled={!isInstitutionFormValid()} className={`px-4 py-2 rounded ${isInstitutionFormValid() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Sačuvaj</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showDocModal && docAssociation.institution_id && (
          <DocumentUploadModal
            open={showDocModal}
            onClose={() => setShowDocModal(false)}
            association={{ institution_id: selectedInstitution.id }}
            onUploaded={() => { setInstDocsRefresh(t => t + 1); setShowDocModal(false); }}
          />
        )}
      </div>
    </div>
  );
};

export default InstitutionDetail;
