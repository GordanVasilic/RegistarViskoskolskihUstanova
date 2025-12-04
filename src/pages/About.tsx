import React from 'react';
import { GraduationCap, Shield, Users, Award, Target, BookOpen, Search, Mail, Phone, MapPin, FileText, Scale } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">O registru</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Državni registar akreditiranih visokoškolskih ustanova u Bosni i Hercegovini je centralizovana digitalna platforma 
            za evidenciju, praćenje i javno objavljivanje informacija o akreditiranim visokoškolskim ustanovama.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission and Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Misija</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Naša misija je osiguranje transparentnosti i dostupnosti informacija o akreditiranim visokoškolskim ustanovama 
              u Bosni i Hercegovini. Kroz ovaj registar, studenti, roditelji, poslodavci i šira javnost mogu lako pronaći 
              verifikovane informacije o visokoškolskim ustanovama i njihovim programima.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Vizija</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Vizija nam je da postanemo vodeći regionalni registar visokoškolskih ustanova, poznat po pouzdanosti, 
              inovativnosti i korisničkoj podršci. Težimo kontinuiranom unapređenju sistema kako bismo pružili 
              najbolju moguću uslugu svim korisnicima.
            </p>
          </div>
        </div>

        {/* Legal Framework */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pravni okvir</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Osnov za vođenje registra zasniva se na relevantnim propisima i tehničkim specifikacijama.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Pravilnik o vođenju registra</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Dokument definiše postupke, nadležnosti i objavu podataka o akreditiranim ustanovama.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Preuzmi dokument</a>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Tehnička dokumentacija</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Tehničke specifikacije sistema, model podataka, API i arhitektura za implementaciju.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Pregled dokumentacije</a>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kako koristiti registar</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kratko uputstvo za studente, roditelje i ustanove.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Za javnost</h3>
              <p className="text-gray-700">Pretražite akreditirane ustanove i programe po gradu, tipu i statusu.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Za ustanove</h3>
              <p className="text-gray-700">Prijavite se na portal i podnesite zahtjev za akreditaciju.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Za administratore</h3>
              <p className="text-gray-700">Upravljajte podacima, procesima i objavom informacija.</p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ključne karakteristike</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Naš sistem nudi širok spektar funkcionalnosti za različite korisničke grupe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Pretraga i filtriranje</h3>
              <p className="text-gray-600">
                Napredna pretraga ustanova po nazivu, lokaciji, tipu i statusu akreditacije sa višestrukim filterima.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verifikovani podaci</h3>
              <p className="text-gray-600">
                Svi podaci u registru su verifikovani i ažurni, čime se osigurava pouzdanost informacija.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Status akreditacije</h3>
              <p className="text-gray-600">
                Pregled statusa akreditacije ustanova i studijskih programa sa datumima isteka.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Više korisničkih uloga</h3>
              <p className="text-gray-600">
                Različite uloge za administratore, službenike, ustanove i javnost sa odgovarajućim pravima pristupa.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Studijski programi</h3>
              <p className="text-gray-600">
                Detaljan pregled studijskih programa sa informacijama o trajanju, ECTS kreditima i akreditaciji.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Statistički izvještaji</h3>
              <p className="text-gray-600">
                Generisanje statističkih izvještaja o stanju u visokom obrazovanju u Bosni i Hercegovini.
              </p>
            </div>
          </div>
        </div>

        {/* Process */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proces akreditacije</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kako funkcioniše proces akreditacije visokoškolskih ustanova u Bosni i Hercegovini
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prijava zahtjeva</h3>
                <p className="text-gray-600 text-sm">
                  Visokoškolska ustanova podnosi zahtjev za akreditaciju kroz naš portal.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Evaluacija</h3>
                <p className="text-gray-600 text-sm">
                  Stručna komisija vrši evaluaciju priložene dokumentacije i uslova ustanove.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Odluka</h3>
                <p className="text-gray-600 text-sm">
                  Donošenje odluke o akreditaciji na osnovu evaluacije i stručnih kriterija.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">4</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Objava</h3>
                <p className="text-gray-600 text-sm">
                  Objava odluke u javnom registru i izdavanje akreditacionog certifikata.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Imate pitanja?</h2>
            <p className="text-gray-600">
              Za sva pitanja vezana za registar i proces akreditacije, slobodno nas kontaktirajte.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">info@registry.ba</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">+387 33 xxx xxx</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">Sarajevo, BiH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
