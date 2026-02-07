import {
    POSConfiguration,
    PosConfig,
    PosRegistrationPreviewDto,
    PosRegistrationResultDto,
    Shift,
    User
} from '@terencio/domain';

export interface ElectronAPI {
  sync: {
    checkStatus: () => Promise<boolean>;
    preview: (code: string) => Promise<PosRegistrationPreviewDto>;
    confirm: (registrationData: PosRegistrationPreviewDto, code: string) => Promise<POSConfiguration>;
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
  registration: {
    preview: (code: string, deviceId: string) => Promise<PosRegistrationPreviewDto>;
    confirm: (code: string, hardwareId: string) => Promise<PosRegistrationResultDto>;
    checkStatus: () => Promise<boolean>;
    getConfig: () => Promise<PosConfig | null>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
