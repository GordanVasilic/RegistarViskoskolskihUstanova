import React, { useState } from 'react';
import { FileCheck, ChevronDown } from 'lucide-react';
import { DocumentList } from './DocumentList';

type Props = {
  title: string;
  association: { institution_id?: string; program_id?: string; process_id?: string };
  defaultType?: string;
  initiallyOpen?: boolean;
};

export const DocumentSection: React.FC<Props> = ({ title, association, defaultType, initiallyOpen = true }) => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
        <div className="flex items-center">
          <FileCheck className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setOpen(o => !o)} className="inline-flex items-center px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-100">
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
            {open ? 'Sakrij' : 'Prikaži'}
          </button>
        </div>
      </div>
      {open && (
        <div className="p-4">
          <DocumentList association={association} refreshToken={0} readonly />
        </div>
      )}
    </div>
  );
};
