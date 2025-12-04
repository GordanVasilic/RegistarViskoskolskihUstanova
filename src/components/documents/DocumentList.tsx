import React, { useEffect, useState } from 'react';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { api, DocumentRecord } from '@/services/api';

type Props = {
  association: { institution_id?: string; program_id?: string; process_id?: string };
  refreshToken?: number;
  readonly?: boolean;
};

export const DocumentList: React.FC<Props> = ({ association, refreshToken, readonly }) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getDocuments({ ...association, limit: 100 });
      setDocs(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [association.institution_id, association.program_id, association.process_id, refreshToken]);

  return (
    <div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip dokumenta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naslov</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Izdavač</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veličina</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docs.map(d => (
              <tr key={d.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{translateDocType(d.document_type)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.title || d.file_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.issuer || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(d.issued_at || d.uploaded_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.file_size ? `${(d.file_size/1024/1024).toFixed(2)} MB` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <a href={`http://localhost:3001/api/documents/${d.id}/download`} className="text-blue-600 hover:text-blue-900 inline-flex items-center"><Download className="h-4 w-4" /></a>
                    {!readonly && (
                      <button onClick={() => { setDocToDelete(d); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900 inline-flex items-center"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && !loading && (
              <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={6}>Nema dokumenata</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleteModal && docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Obrisati dokument?</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="text-sm text-gray-700">Tip: <span className="font-semibold">{translateDocType(docToDelete.document_type)}</span></div>
              <div className="text-sm text-gray-700">Naslov: <span className="font-semibold">{docToDelete.title || docToDelete.file_name}</span></div>
              <div className="text-xs text-gray-500">Ova radnja je nepovratna.</div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded">Otkaži</button>
              <button type="button" onClick={async () => { if (!docToDelete) return; try { await api.deleteDocument(docToDelete.id); setShowDeleteModal(false); setDocToDelete(null); await load(); } catch {} }} className="px-4 py-2 bg-red-600 text-white rounded">Obriši</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function translateDocType(t?: string) {
  switch (t) {
    case 'application': return 'Zahtjev';
    case 'self_evaluation': return 'Samoevaluacija';
    case 'external_report': return 'Izvještaj komisije';
    case 'decision': return 'Odluka';
    case 'certificate': return 'Certifikat';
    case 'curriculum': return 'Plan i program';
    case 'statute': return 'Statut';
    case 'founding_act': return 'Akt o osnivanju';
    default: return t || '';
  }
}

function formatDate(d?: string) {
  try { return d ? new Date(d).toLocaleDateString('bs-BA') : '-'; } catch { return '-'; }
}
