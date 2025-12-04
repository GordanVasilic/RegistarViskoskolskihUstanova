import React from 'react';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold">Registar visokoškolskih ustanova</h3>
                <p className="text-sm text-gray-400">Bosna i Hercegovina</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Državni registar akreditiranih visokoškolskih ustanova u Bosni i Hercegovini. 
              Centralizovana platforma za evidenciju i praćenje akreditacija visokoškolskih ustanova.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Brzi linkovi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Početna
                </a>
              </li>
              <li>
                <a href="/registar" className="text-gray-300 hover:text-white transition-colors">
                  Javni registar
                </a>
              </li>
              <li>
                <a href="/o-nama" className="text-gray-300 hover:text-white transition-colors">
                  O nama
                </a>
              </li>
              <li>
                <a href="/kontakt" className="text-gray-300 hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                <span className="text-gray-300">
                  Ministarstvo obrazovanja<br />
                  Sarajevo, Bosna i Hercegovina
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">+387 33 xxx xxx</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">info@registry.ba</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Državni registar visokoškolskih ustanova. Sva prava pridržana.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Posljednja ažuriranja: {new Date().toLocaleDateString('bs-BA')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;