import { PosRegistrationPreviewDto, PosRegistrationResultDto } from '@terencio/domain';
import { create } from 'zustand';

export type SyncStep = 'welcome' | 'input' | 'syncing' | 'preview' | 'success' | 'error';

interface SyncState {
  step: SyncStep;
  code: string;
  error: string | null;
  registrationData: PosRegistrationPreviewDto | null;
  registrationResult: PosRegistrationResultDto | null;
  isLoading: boolean;
  loadingStatus: string | null;

  setStep: (step: SyncStep) => void;
  setCode: (code: string) => void;
  
  validateCode: () => Promise<void>;
  confirmRegistration: () => Promise<void>;
  checkSyncStatus: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  step: 'welcome',
  code: '',
  error: null,
  registrationData: null,
  registrationResult: null,
  isLoading: false,
  loadingStatus: null,

  setStep: (step) => set({ step }),
  setCode: (code) => set({ code }),

  validateCode: async () => {
    const { code } = get();
    if (!code || code.length !== 6) return;

    set({ isLoading: true, error: null, step: 'syncing', loadingStatus: 'loading.validating' });
    try {
      // Call Electron Bridge - sync:preview calls backend and returns preview data
      const data = await window.electronAPI.sync.preview(code);
      set({ 
        registrationData: data, 
        step: 'preview', 
        isLoading: false,
        loadingStatus: null
      });
    } catch (err: any) {
      set({ 
        error: err.message || 'Failed to verify code', 
        step: 'error', 
        isLoading: false,
        loadingStatus: null
      });
    }
  },

  confirmRegistration: async () => {
    const { code, registrationData } = get();
    if (!registrationData) return;

    set({ isLoading: true, error: null, step: 'syncing', loadingStatus: 'loading.confirming' });
    try {
      // Call Electron Bridge with Code AND Preview Data (to save users)
      const result = await window.electronAPI.sync.confirm(code, registrationData);
      set({ 
        registrationResult: result,
        step: 'success', 
        isLoading: false,
        loadingStatus: null
      });
    } catch (err: any) {
      set({ 
        error: err.message || 'Registration failed', 
        step: 'error', 
        isLoading: false,
        loadingStatus: null
      });
    }
  },

  checkSyncStatus: async () => {
    try {
      return await window.electronAPI.sync.checkStatus();
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ 
    step: 'welcome', 
    code: '', 
    error: null, 
    registrationData: null,
    registrationResult: null, 
    isLoading: false,
    loadingStatus: null
  })
}));