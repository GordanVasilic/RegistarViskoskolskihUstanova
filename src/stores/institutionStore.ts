import { create } from 'zustand';
import { Institution, api } from '../services/api';

interface InstitutionState {
  institutions: Institution[];
  selectedInstitution: Institution | null;
  isLoading: boolean;
  error: string | null;
  fetchInstitutions: (params?: any) => Promise<void>;
  fetchInstitution: (id: string) => Promise<void>;
  clearSelectedInstitution: () => void;
}

export const useInstitutionStore = create<InstitutionState>((set) => ({
  institutions: [],
  selectedInstitution: null,
  isLoading: false,
  error: null,

  fetchInstitutions: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const institutions = await api.getInstitutions(params);
      set({ institutions, isLoading: false, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch institutions', isLoading: false });
    }
  },

  fetchInstitution: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const institution = await api.getInstitution(id);
      set({ selectedInstitution: institution, isLoading: false, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch institution', isLoading: false });
    }
  },

  clearSelectedInstitution: () => {
    set({ selectedInstitution: null });
  }
}));