import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { api, DocumentRecord } from '@/services/api';

type Props = {
  open: boolean;
  onClose: () => void;
  association: { institution_id?: string; program_id?: string; process_id?: string };
  defaultType?: string;
  onUploaded: (doc: { id: string; file_url: string }) => void;
};

export const DocumentUploadModal: React.FC<Props> = ({ open, onClose, association, defaultType, onUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<string>(defaultType || 'application');
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [number, setNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) { setError('Odaberite PDF dokumente'); return; }
    setError(null);
    setBusy(true);
    try {
      for (const f of files) {
        const resp = await api.uploadDocument(f, {
          ...association,
          document_type: type,
          title: title || f.name.replace(/\.pdf$/i, ''),
          description: notes,
          issuer,
          issued_at: issuedAt,
          number
        });
        onUploaded(resp);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška pri uploadu');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upload dokumenta</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip dokumenta</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="application">Zahtjev</option>
                <option value="self_evaluation">Samoevaluacija</option>
                <option value="external_report">Izvještaj komisije</option>
                <option value="decision">Odluka</option>
                <option value="certificate">Certifikat</option>
                <option value="curriculum">Plan i program</option>
                <option value="statute">Statut</option>
                <option value="founding_act">Akt o osnivanju</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naslov</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Izdavač</label>
              <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum izdavanja</label>
              <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Broj akta</label>
              <input value={number} onChange={(e) => setNumber(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF fajlovi</label>
              <input type="file" accept="application/pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).filter(f => f.type === 'application/pdf'))} />
              {files.length > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span>{f.name}</span>
                      <button type="button" className="text-red-600" onClick={() => setFiles(fs => fs.filter(x => x !== f))}>Ukloni</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{error}</div>}
          <div className="flex justify-end space-x-2 border-t pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Otkaži</button>
            <button type="submit" disabled={busy || !files.length} className={`px-4 py-2 rounded ${files.length && !busy ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Sačuvaj</button>
          </div>
        </form>
      </div>
    </div>
  );
};
