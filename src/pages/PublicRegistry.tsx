import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Building2, MapPin, Award, Users, Download, Eye, Mail, Globe, Plus, AlertCircle } from 'lucide-react';
import { useInstitutionStore } from '../stores/institutionStore';
import { api } from '../services/api';
import { useAuthStore } from '@/stores/authStore';

const PublicRegistry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { institutions, fetchInstitutions, isLoading } = useInstitutionStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; city: string; address: string; email: string; institution_type: 'university'|'college'|'academy'; accreditation_status: 'pending'|'accredited'|'expired'|'suspended'; phone?: string; website?: string; ownership_type?: string; founded_on?: string; logo_url?: string; competent_authority?: string; notes?: string }>({ name: '', city: '', address: '', email: '', institution_type: 'university', accreditation_status: 'pending' });
  const isEmailValid = (email?: string) => !!email && /.+@.+\..+/.test(email);
  const isFormValid = () => {
    if (!form.name || form.name.trim().length < 2) return false;
    if (!form.city || form.city.trim().length < 2) return false;
    if (!form.address || form.address.trim().length < 2) return false;
    if (!isEmailValid(form.email)) return false;
    return true;
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const slug = (form.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const payload = { ...form, logo_url: form.logo_url || `/logos/${slug}.svg` } as any;
      await api.createInstitution(payload);
      setShowAddModal(false);
      await fetchInstitutions({ limit: 100 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška pri snimanju ustanove';
      setFormError(msg);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchInstitutions({ limit: 100 });
    
    // Fetch cities for filter
    api.getCities().then(setCities).catch(console.error);
  }, [fetchInstitutions]);

  // Filter institutions based on search criteria
  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = !searchTerm || 
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !selectedCity || institution.city === selectedCity;
    const matchesStatus = !selectedStatus || institution.accreditation_status === selectedStatus;
    const matchesType = !selectedType || institution.institution_type === selectedType;
    
    return matchesSearch && matchesCity && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstitutions = filteredInstitutions.slice(startIndex, startIndex + itemsPerPage);

  

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

  const exportToCSV = () => {
    const headers = ['Naziv', 'Grad', 'Adresa', 'Tip', 'Status akreditacije', 'Email', 'Website'];
    const rows = filteredInstitutions.map(institution => [
      institution.name,
      institution.city,
      institution.address,
      translateType(institution.institution_type),
      translateStatus(institution.accreditation_status),
      institution.email,
      institution.website || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'registar_ustanova.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Javni registar visokoškolskih ustanova</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pregledajte sve akreditirane visokoškolska ustanove u Bosni i Hercegovini. 
              Pretražujte po nazivu, lokaciji, tipu ili statusu akreditacije.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              Podaci su demonstracioni i služe za prikaz funkcionalnosti.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pretraga
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Naziv ustanove ili grad..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grad
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Svi gradovi</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip ustanove
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Svi tipovi</option>
                  <option value="university">Univerzitet</option>
                  <option value="college">Fakultet</option>
                  <option value="academy">Akademija</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status akreditacije
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Svi statusi</option>
                  <option value="accredited">Akreditirane</option>
                  <option value="pending">U procesu</option>
                  <option value="expired">Istekle</option>
                  <option value="suspended">Suspendirane</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end items-center">
              <div className="text-sm text-gray-600">
                Prikazano {filteredInstitutions.length} od {institutions.length} ustanova
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => { setSelectedType('university'); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Univerzitet</button>
            <button onClick={() => { setSelectedType('college'); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Fakultet</button>
            <button onClick={() => { setSelectedStatus('accredited'); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Akreditirane</button>
            <button onClick={() => { setSelectedStatus('pending'); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">U procesu</button>
            <button onClick={() => { setSelectedCity('Sarajevo'); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Sarajevo</button>
            <button onClick={() => { setSelectedCity(''); setSelectedType(''); setSelectedStatus(''); setSearchTerm(''); setCurrentPage(1); }} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">Reset</button>
          </div>
        </div>

        {/* Export and Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm text-gray-600">
            Stranica {currentPage} od {totalPages} ({filteredInstitutions.length} ustanova)
          </div>
          
          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button
                onClick={() => { setForm({ name: '', city: '', address: '', email: '', institution_type: 'university', accreditation_status: 'pending' }); setShowAddModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj ustanovu
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Uputstvo</h2>
          <p className="text-gray-700 mb-2">Koristite pretragu i filtere iznad za sužavanje rezultata prema vašim kriterijima.</p>
          <p className="text-gray-700">Klikom na „Detalji“ otvorit ćete stranicu ustanove sa programima i kontakt podacima.</p>
        </div>

        {/* Institutions List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Učitavanje ustanova...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedInstitutions.map((institution) => (
              <div key={institution.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                      {institution.logo_url && (
                        <img
                          src={institution.logo_url?.startsWith('/uploads/') ? `http://localhost:3001${institution.logo_url}` : (institution.logo_url as string)}
                          alt={institution.name}
                          className="h-16 w-16 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.onerror = null;
                            t.src = '/logos/default.svg';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{institution.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            getStatusColor(institution.accreditation_status)
                          }`}>
                            <Award className="h-4 w-4 mr-1" />
                            {translateStatus(institution.accreditation_status)}
                          </span>
                          <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            {translateType(institution.institution_type)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{institution.address}, {institution.city}</span>
                          </div>
                          {institution.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{institution.email}</span>
                            </div>
                          )}
                          {institution.website && (
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-gray-400" />
                              <a
                                href={institution.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {institution.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`/ustanova/${institution.id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalji
                      </Link>
                      {institution.programs && institution.programs.length > 0 && (
                        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                          <Users className="h-4 w-4 mr-2" />
                          {institution.programs.length} programa
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredInstitutions.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nema rezultata</h3>
                <p className="text-gray-600">Nijedna ustanova ne odgovara zadatim kriterijima pretrage.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prethodna
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sljedeća
              </button>
            </nav>
          </div>
        )}
      </div>
      {showAddModal && (user?.role === 'admin' || user?.role === 'operator') && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full sm:max-w-3xl max-w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-900">Dodaj ustanovu</h3>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                    <input name="name" value={form.name} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                    <input name="city" value={form.city} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
                    <input name="address" value={form.address} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input name="phone" value={form.phone || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input name="website" value={form.website || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip ustanove</label>
                    <select name="institution_type" value={form.institution_type} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                      <option value="university">Univerzitet</option>
                      <option value="college">Fakultet</option>
                      <option value="academy">Akademija</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status akreditacije</label>
                    <select name="accreditation_status" value={form.accreditation_status} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                      <option value="pending">U procesu</option>
                      <option value="accredited">Akreditirana</option>
                      <option value="expired">Istekla</option>
                      <option value="suspended">Suspendirana</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Akreditacija OD</label>
                      <input type="date" name="founded_on" value={form.founded_on || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input name="logo_url" value={form.logo_url || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nadležna obrazovna vlast</label>
                    <input name="competent_authority" value={form.competent_authority || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                    <input name="notes" value={form.notes || ''} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                {formError && (
                  <div className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formError}</div>
                )}
                <div className="flex justify-end space-x-2 sticky bottom-0 bg-white pt-4 border-t">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
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

export default PublicRegistry;
