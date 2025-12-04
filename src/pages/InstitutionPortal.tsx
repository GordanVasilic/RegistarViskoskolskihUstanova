import React, { useState, useEffect } from 'react';
import { 
  Building, 
  FileText, 
  Upload, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { api, Institution, StudyProgram, AccreditationProcess } from '@/services/api';

const InstitutionPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [processes, setProcesses] = useState<AccreditationProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProgramForm, setShowNewProgramForm] = useState(false);
  const [showAccreditationForm, setShowAccreditationForm] = useState(false);

  const [newProgram, setNewProgram] = useState({
    name: '',
    level: '',
    duration: '',
    ects: '',
    description: ''
  });

  const [accreditationRequest, setAccreditationRequest] = useState({
    type: 'initial',
    program_id: '',
    description: '',
    documents: [] as File[]
  });

  useEffect(() => {
    loadInstitutionData();
  }, []);

  const loadInstitutionData = async () => {
    try {
      setLoading(true);
      // Demo functionality - simulate loading institution data
      // In real app, this would be filtered by logged-in user
      const institutions = await api.getInstitutions();
      const programsData = await api.getStudyPrograms();
      const processesData = await api.getAccreditationProcesses();
      
      // Simulate current user's institution (first one for demo)
      setInstitution(institutions[0] || null);
      setPrograms(programsData.filter(p => p.institution_id === institutions[0]?.id));
      setProcesses(processesData.filter(p => p.institution_id === institutions[0]?.id));
    } catch (error) {
      console.error('Error loading institution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accredited': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo functionality - simulate adding program
    alert('Studijski program je uspješno dodat! Ovo je demo verzija.');
    setShowNewProgramForm(false);
    setNewProgram({ name: '', level: '', duration: '', ects: '', description: '' });
  };

  const handleAccreditationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo functionality - simulate accreditation request
    alert('Zahtjev za akreditaciju je uspješno poslat! Ovo je demo verzija.');
    setShowAccreditationForm(false);
    setAccreditationRequest({ type: 'initial', program_id: '', description: '', documents: [] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAccreditationRequest(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Institution Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Informacije o ustanovi</h3>
          <button className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-1" />
            Izmijeni
          </button>
        </div>
        {institution && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Naziv</p>
              <p className="text-base text-gray-900">{institution.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tip</p>
              <p className="text-base text-gray-900 capitalize">{institution.institution_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Grad</p>
              <p className="text-base text-gray-900">{institution.city}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Adresa</p>
              <p className="text-base text-gray-900">{institution.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Telefon</p>
              <p className="text-base text-gray-900">{institution.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900">{institution.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status akreditacije</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(institution.accreditation_status)}`}>
                {institution.accreditation_status === 'accredited' && 'Akreditirana'}
                {institution.accreditation_status === 'pending' && 'U procesu'}
                {institution.accreditation_status === 'expired' && 'Istekla'}
                {institution.accreditation_status === 'suspended' && 'Suspendovana'}
              </span>
            </div>
            {institution.accreditation_valid_to && (
              <div>
                <p className="text-sm font-medium text-gray-500">Ističe</p>
                <p className="text-base text-gray-900">
                  {new Date(institution.accreditation_valid_to).toLocaleDateString('bs-BA')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowNewProgramForm(true)}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Dodaj studijski program</h4>
          <p className="text-sm text-gray-600">Dodajte novi studijski program u ponudu</p>
        </button>

        <button
          onClick={() => setShowAccreditationForm(true)}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-4">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Podnesi zahtjev</h4>
          <p className="text-sm text-gray-600">Podnesite zahtjev za akreditaciju</p>
        </button>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="p-3 bg-yellow-100 rounded-full w-12 h-12 mx-auto mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Aktivni procesi</h4>
          <p className="text-2xl font-bold text-gray-900">{processes.length}</p>
        </div>
      </div>
    </div>
  );

  const ProgramsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Studijski programi</h3>
        <button
          onClick={() => setShowNewProgramForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj program
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Naziv programa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trajanje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ECTS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.map((program) => (
              <tr key={program.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{program.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 capitalize">{program.degree_level}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{program.duration_years}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{program.ects_credits}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(program.accreditation_status)}`}>
                    {program.accreditation_status === 'accredited' && 'Akreditiran'}
                    {program.accreditation_status === 'pending' && 'U procesu'}
                    {program.accreditation_status === 'expired' && 'Istekao'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
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
  );

  const AccreditationTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Procesi akreditacije</h3>
        <button
          onClick={() => setShowAccreditationForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Novi zahtjev
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip zahtjeva
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
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
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {process.process_type === 'initial' ? 'Inicijalna' : 
                     process.process_type === 'renewal' ? 'Obnova' : 'Ponovna evaluacija'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {programs.find(p => p.id === process.program_id)?.name || 'Sva ustanova'}
                  </div>
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
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Pregled
                </div>
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'programs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Programi
                </div>
              </button>
              <button
                onClick={() => setActiveTab('accreditation')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'accreditation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Akreditacija
                </div>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'programs' && <ProgramsTab />}
        {activeTab === 'accreditation' && <AccreditationTab />}
      </div>

      {/* New Program Modal */}
      {showNewProgramForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dodaj novi studijski program</h3>
            <form onSubmit={handleAddProgram} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Naziv programa *</label>
                <input
                  type="text"
                  required
                  value={newProgram.name}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nivo studija *</label>
                <select
                  required
                  value={newProgram.level}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, level: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Izaberite nivo</option>
                  <option value="bachelor">Prvi ciklus (Bachelor)</option>
                  <option value="master">Drugi ciklus (Master)</option>
                  <option value="doctoral">Treći ciklus (Doktorski)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trajanje (godina) *</label>
                  <input
                    type="number"
                    required
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ECTS bodova *</label>
                  <input
                    type="number"
                    required
                    value={newProgram.ects}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, ects: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Opis</label>
                <textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProgramForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Dodaj program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accreditation Request Modal */}
      {showAccreditationForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Podnesi zahtjev za akreditaciju</h3>
            <form onSubmit={handleAccreditationRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tip zahtjeva *</label>
                <select
                  required
                  value={accreditationRequest.type}
                  onChange={(e) => setAccreditationRequest(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="initial">Inicijalna akreditacija</option>
                  <option value="renewal">Obnova akreditacije</option>
                  <option value="modification">Izmjena programa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Studijski program</label>
                <select
                  value={accreditationRequest.program_id}
                  onChange={(e) => setAccreditationRequest(prev => ({ ...prev, program_id: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Cijela ustanova</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Opis zahtjeva *</label>
                <textarea
                  required
                  value={accreditationRequest.description}
                  onChange={(e) => setAccreditationRequest(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detaljno objasnite razlog zahtjeva..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dokumenti</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Prenesite datoteke</span>
                        <input
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">ili prevucite ovdje</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX do 10MB
                    </p>
                  </div>
                </div>
                {accreditationRequest.documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Odabrani dokumenti:</p>
                    <ul className="mt-1 text-sm text-gray-500">
                      {accreditationRequest.documents.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAccreditationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Pošalji zahtjev
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionPortal;
