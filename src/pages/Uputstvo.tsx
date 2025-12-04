import React from 'react';
import { BookOpen, Search, Building, Users, FileCheck, Upload, Shield, Settings, CheckCircle } from 'lucide-react';

const Uputstvo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center mb-6">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Uputstvo za korišćenje</h1>
          </div>

          <p className="text-gray-700 mb-8">Ovo uputstvo pokriva osnovne korake korišćenja internog registra visokoškolskih ustanova: pregled javnog registra, rad u administraciji, upravljanje ustanovama, programima i procesima, kao i ovlaštenja korisnika.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Search className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Registar</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Otvorite Registar preko glavnog menija.</li>
                <li>Koristite pretragu i filtere da pronađete ustanove.</li>
                <li>Kliknite na “Detalji” da vidite informacije o odabranoj ustanovi.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Uloge i ovlaštenja</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Administrator: upravlja korisnicima, šifarnicima i ima pregled svih audit zapisa.</li>
                <li>Operator: unosi i uređuje ustanove, programe, procese i dokumente.</li>
                <li>Pregled: ima samo čitanje (bez izmjena).</li>
                <li>Ustanova: ograničen pristup portalu ustanove.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Administracija</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Otvorite “Administracija” u meniju i izaberite odgovarajući modul.</li>
                <li>Kontrolna tabla: brza statistika ustanova, programa i procesa.</li>
                <li>Ustanove: dodavanje, uređivanje i brisanje preko modala.</li>
                <li>Procesi, Programi, Dokumenti, Korisnici: upravljanje podacima po modulima.</li>
                <li>Audit log: pregled istorije promjena, filtriranje i izvoz.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Detalji ustanove</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Stranica detalja prikazuje sve informacije o ustanovi i logo.</li>
                <li>Programi: pregled i CRUD modali za dodavanje/uređivanje.</li>
                <li>Procesi: lista procesa sa modalima za kreiranje i donošenje odluke.</li>
                <li>Odluka procesa automatski ažurira status akreditacije ustanove ili programa.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Korisnici</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Kreiranje i izmjena korisnika uz validaciju i jasne poruke grešaka.</li>
                <li>Uloge: admin, operator, pregled, ustanova.</li>
                <li>Aktivacija/deaktivacija naloga.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <FileCheck className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Procesi i odluke</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Kreiranje procesa: odabir tipa, datum i napomena, opcionalno vezivanje za program.</li>
                <li>Odluka: status, datum odluke, unos roka važenja akreditacije.</li>
                <li>Automatsko ažuriranje statusa i rokova po odobrenju.</li>
              </ul>
            </div>

            <div className="border rounded p-6">
              <div className="flex items-center mb-3">
                <Upload className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Dokumenti</h2>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Upload pratećih dokumenata u PDF formatu uz povezivanje na procese.</li>
                <li>Pregled i filtriranje dokumenata po ustanovi i procesu.</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">Savjet</span>
            </div>
            <p className="text-gray-700">Za uređivanje podataka otvorite Administraciju i koristite modale za siguran unos. Sve promjene se evidentiraju u audit logu, uključujući ko je izmijenio podatak i kada.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uputstvo;

