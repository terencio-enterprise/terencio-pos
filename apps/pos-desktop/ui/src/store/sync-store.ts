import { POSConfiguration } from '@terencio/domain';
import { create } from 'zustand';

export type SyncStep = 'welcome' | 'input' | 'syncing' | 'preview' | 'success' | 'error';

interface SyncState {
  // State
  step: SyncStep;
  code: string;
  error: string | null;
  posConfig: POSConfiguration | null;
  isLoading: boolean;
  loadingStatus: string;

  // Actions
  setStep: (step: SyncStep) => void;
  setCode: (code: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  validateCode: () => Promise<void>;
  confirmRegistration: () => Promise<void>;
  checkSyncStatus: () => Promise<boolean>;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  // Initial state
  step: 'welcome',
  code: '',
  error: null,
  posConfig: null,
  isLoading: false,
  loadingStatus: 'loading.validating',

  // Actions
  setStep: (step) => set({ step }),
  
  setCode: (code) => set({ code: code.toUpperCase().slice(0, 6) }),
  
  setError: (error) => set({ error, step: 'error' }),
  
  clearError: () => set({ error: null }),

  validateCode: async () => {
    const { code } = get();
    
    if (!code || code.length !== 6) {
      set({ error: 'Please enter a valid 6-letter code', step: 'error' });
      return;
    }

    set({ isLoading: true, step: 'syncing', error: null, loadingStatus: 'loading.validating' });

    try {
      // Mock validation delay and config retrieval for preview
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ loadingStatus: 'loading.fetching' });
      
      // TODO: Replace with real pre-check API call if available
      // For now we simulate fetching config to show in preview
      
      // Mock data for preview
      const mockPreviewConfig: POSConfiguration = {
        pos_id: 'preview-uuid',
        pos_name: 'POS Terminal 1',
        store_id: 'store-uuid',
        store_name: 'Downtown Store',
        device_id: 'DEV-001',
        registered_at: new Date().toISOString(),
        is_active: 1
      };

      await new Promise(resolve => setTimeout(resolve, 800));

      set({ 
        posConfig: mockPreviewConfig,
        step: 'preview',
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Validation failed:', error);
      set({ 
        error: error.message || 'Failed to validate code',
        step: 'error',
        isLoading: false 
      });
    }
  },

  confirmRegistration: async () => {
    const { code } = get();
    set({ isLoading: true, step: 'syncing', error: null, loadingStatus: 'loading.registering' });

    try {
      await window.electronAPI.sync.register(code);
      set({ loadingStatus: 'loading.finalizing' });
      const config = await window.electronAPI.sync.getConfig() as POSConfiguration;
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Smooth transition

      set({ 
        posConfig: config,
        step: 'success',
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      set({ 
        error: error.message || 'Failed to register POS. Please check your code and try again.',
        step: 'error',
        isLoading: false 
      });
    }
  },

  checkSyncStatus: async () => {
    try {
      const isRegistered = await window.electronAPI.sync.checkStatus() as boolean;
      return isRegistered;
    } catch (error) {
      console.error('Failed to check sync status:', error);
      return false;
    }
  },

  reset: () => set({ 
    step: 'welcome', 
    code: '', 
    error: null, 
    posConfig: null, 
    isLoading: false 
  }),
}));
