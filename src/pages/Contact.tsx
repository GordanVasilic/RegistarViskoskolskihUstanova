import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo functionality - show alert
    alert('Poruka poslata! Ovo je demo verzija - poruka nije zapravo poslata.');
    setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kontaktirajte nas</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Imate pitanja ili vam je potrebna pomoć? Kontaktirajte nas i rado ćemo vam pomoći.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informacije za kontakt</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Adresa</h3>
                  <p className="text-gray-600">
                    Ministarstvo obrazovanja i nauke<br />
                    Trg Bosne i Hercegovine 1<br />
                    71000 Sarajevo, BiH
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Phone className="h-6 w-6 text-blue-600 mt-1" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Telefon</h3>
                  <p className="text-gray-600">
                    +387 33 281-000<br />
                    Radnim danima: 08:00 - 16:00
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-blue-600 mt-1" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">
                    info@mon.gov.ba<br />
                    registrars@mon.gov.ba
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-blue-600 mt-1" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Radno vrijeme</h3>
                  <p className="text-gray-600">
                    Ponedjeljak - Petak: 08:00 - 16:00<br />
                    Subota - Nedjelja: Zatvoreno
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pošaljite poruku</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorija upita
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">Opće pitanje</option>
                  <option value="accreditation">Akreditacija</option>
                  <option value="technical">Tehnička podrška</option>
                </select>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ime i prezime *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vaše ime i prezime"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email adresa *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vaša email adresa"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Naslov *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Naslov poruke"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Poruka *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vaša poruka..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Pošalji poruku
              </button>
            </form>
          </div>
        </div>

        {/* Map and Team */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lokacija</h2>
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
              Mapa lokacije (demo)
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontakt tim</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">Službenik za akreditaciju</h3>
                <p className="text-sm text-gray-600">accreditation@mon.gov.ba</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">Tehnička podrška</h3>
                <p className="text-sm text-gray-600">support@registry.ba</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">Administracija</h3>
                <p className="text-sm text-gray-600">admin@registry.ba</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Često postavljana pitanja</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kako provjeriti akreditaciju ustanove?</h3>
              <p className="text-gray-600">
                Možete pretražiti registar akreditiranih ustanova na našoj web stranici u sekciji "Javni registar" 
                ili nas kontaktirati putem emaila ili telefona za dodatne informacije.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Koliko traje proces akreditacije?</h3>
              <p className="text-gray-600">
                Standardni proces akreditacije traje između 6-12 mjeseci, u zavisnosti od kompleksnosti 
                programa i potrebe za dodatnim informacijama.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Da li su svi podaci javno dostupni?</h3>
              <p className="text-gray-600">
                Svi podaci o akreditiranim ustanovama i programima su javno dostupni u sekciji "Javni registar". 
                Za dodatne informacije možete kontaktirati našu službu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
