import { create } from 'zustand';
import { User, api } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(email, password);
      localStorage.setItem('registry_user', JSON.stringify(response.user));
      api.setAuthUser(response.user);
      set({ user: response.user, isLoading: false, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('registry_user');
    set({ user: null, error: null });
  },

  checkAuth: async () => {
    try {
      const raw = localStorage.getItem('registry_user');
      if (raw) {
        const user = JSON.parse(raw);
        api.setAuthUser(user);
        set({ user, error: null });
        return;
      }
      const response = await api.getCurrentUser();
      api.setAuthUser(response.user || null);
      set({ user: response.user, error: null });
    } catch (error) {
      set({ user: null, error: null });
    }
  }
}));
