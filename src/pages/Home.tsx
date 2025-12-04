import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, Users, Award, MapPin, Filter, ArrowRight } from 'lucide-react';
import { useInstitutionStore } from '../stores/institutionStore';
import { api, Statistics } from '../services/api';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  const { institutions, fetchInstitutions, isLoading } = useInstitutionStore();

  useEffect(() => {
    // Fetch initial data
    fetchInstitutions({ limit: 6 });
    
    // Fetch cities for filter
    api.getCities().then(setCities).catch(console.error);
    
    // Fetch statistics
    api.getStatistics().then(setStatistics).catch(console.error);
  }, [fetchInstitutions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInstitutions({
      search: searchTerm,
      city: selectedCity,
      accreditation_status: selectedStatus,
      limit: 50
    });
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Državni registar visokoškolskih ustanova
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Centralizovana platforma za evidenciju i praćenje akreditacija visokoškolskih ustanova u Bosni i Hercegovini
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Pretraži ustanove..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Svi gradovi</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Svi statusi</option>
                      <option value="accredited">Akreditirane</option>
                      <option value="pending">U procesu</option>
                      <option value="expired">Istekle</option>
                      <option value="suspended">Suspendirane</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="mt-4 w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Pretraži
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      {statistics && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{statistics.total_institutions}</h3>
                <p className="text-gray-600">Ukupno ustanova</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{statistics.accredited_institutions}</h3>
                <p className="text-gray-600">Akreditiranih ustanova</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{statistics.total_programs}</h3>
                <p className="text-gray-600">Studijskih programa</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{statistics.accredited_programs}</h3>
                <p className="text-gray-600">Akreditiranih programa</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Institutions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Istaknute ustanove</h2>
            <p className="text-lg text-gray-600">Pregledajte neke od akreditiranih visokoškolskih ustanova</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Učitavanje ustanova...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {institutions.map((institution) => (
                <div key={institution.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{institution.name}</h3>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {institution.city}
                        </p>
                      </div>
                      {institution.logo_url && (
                        <img
                          src={institution.logo_url}
                          alt={institution.name}
                          className="h-12 w-12 rounded-full object-cover"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.onerror = null;
                            t.src = '/logos/default.svg';
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(institution.accreditation_status)
                      }`}>
                        {translateStatus(institution.accreditation_status)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {translateType(institution.institution_type)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{institution.address}</p>
                    
                    <div className="flex justify-between items-center">
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Web stranica →
                      </a>
                      <Link
                        to={`/ustanova/${institution.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        Detalji <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/registar"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Pogledajte kompletan registar
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Jeste li visokoškolska ustanova?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Prijavite se na naš portal i započnite proces akreditacije
          </p>
          <Link
            to="/portal"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Portal za ustanove
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
