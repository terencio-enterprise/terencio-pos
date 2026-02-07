import { POSConfiguration, POSRegistrationResponse, Shift, User } from '@terencio/domain';

export interface ElectronAPI {
  sync: {
    checkStatus: () => Promise<boolean>;
    register: (code: string) => Promise<POSRegistrationResponse>;
    getConfig: () => Promise<POSConfiguration | null>;
  };
  auth: {
    listUsers: () => Promise<Omit<User, 'pin_hash'>[]>;
    login: (username: string, pin: string) => Promise<Omit<User, 'pin_hash'>>;
    logout: () => Promise<{ success: boolean }>;
    getCurrentUser: () => Promise<Omit<User, 'pin_hash'> | null>;
  };
  shift: {
    start: (startingCash: number) => Promise<Shift>;
    end: (countedCash: number, notes?: string) => Promise<Shift>;
    getCurrent: () => Promise<Shift | null>;
    getHistory: () => Promise<Shift[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
